import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { getUserIdFromToken } from '@/lib/auth';

const prisma = new PrismaClient();

// Type definitions
interface ApiaryData {
  name: string;
  number: string;
  hiveCount?: number | string;
  kilosCollected?: number | string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  locationId?: string;
}

interface BatchRequestBody {
  batchNumber: string;
  batchName?: string;
  apiaries?: ApiaryData[];
}

// GET: Fetch batches for logged-in user
export async function GET(request: Request) {
  try {
    const authHeaderRaw = request.headers.get('Authorization');
    if (!authHeaderRaw) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = authHeaderRaw.startsWith('Bearer ') ? authHeaderRaw.slice(7).trim() : null;
    console.log('[GET] Token received for verification:', token);

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized: No token provided' }, { status: 401 });
    }

    // FIXED: Add await since getUserIdFromToken is async
    const userIdentifier = await getUserIdFromToken(token);
    if (!userIdentifier) {
      return NextResponse.json({ message: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    // FIXED: Based on your logs, getUserIdFromToken returns the user ID, not email
    // Convert to number since it's the database ID
    const userId = parseInt(String(userIdentifier));
    if (isNaN(userId)) {
      return NextResponse.json({ message: 'Invalid user identifier' }, { status: 401 });
    }

    // FIXED: Find user by ID instead of email, and handle tokenStats relationship properly
    const user = await prisma.beeusers.findUnique({
      where: { id: userId },
      // Remove tokenStats from include if it doesn't exist in your schema
      // include: { tokenStats: true },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const batches = await prisma.batch.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: { apiaries: true },
    });

    // FIXED: Handle tokenStats properly - either remove or create default values
    const tokenStats = {
      totalTokens: 0,
      remainingTokens: 0,
      originOnly: 0,
      qualityOnly: 0,
      bothCertifications: 0,
    };

    const certifiedHoneyWeight = {
      originOnly: batches.reduce((sum, b) => sum + (b.originOnly || 0), 0),
      qualityOnly: batches.reduce((sum, b) => sum + (b.qualityOnly || 0), 0),
      bothCertifications: batches.reduce((sum, b) => sum + (b.bothCertifications || 0), 0),
    };

    return NextResponse.json({
      batches,
      tokenStats,
      certifiedHoneyWeight,
    });

  } catch (error) {
    console.error('[GET] Error fetching batches:', error);
    return NextResponse.json({ message: 'An error occurred while fetching batches' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// POST: Create a new batch for logged-in user
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '').trim();

    console.log('[POST] Raw auth header:', authHeader);
    console.log('[POST] Extracted token:', token);

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized: No token provided' }, { status: 401 });
    }

    // FIXED: Add await here since getUserIdFromToken is async
    const userIdentifier = await getUserIdFromToken(token);
    console.log('[POST] userIdentifier returned:', userIdentifier);
    console.log('[POST] userIdentifier type:', typeof userIdentifier);
    console.log('[POST] userIdentifier stringified:', JSON.stringify(userIdentifier));

    if (!userIdentifier) {
      return NextResponse.json({ message: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    // FIXED: Based on your logs, getUserIdFromToken returns the user ID as a string
    // Convert to number for database query
    const userId = parseInt(String(userIdentifier));
    if (isNaN(userId)) {
      return NextResponse.json({ message: 'Invalid user identifier' }, { status: 401 });
    }

    console.log('[POST] Final userId for query:', userId);
    console.log('[POST] Final userId type:', typeof userId);

    // FIXED: Query by ID instead of email, and handle tokenStats properly
    const user = await prisma.beeusers.findUnique({
      where: { id: userId },
      // Remove tokenStats from include if it doesn't exist in your schema
      // include: { tokenStats: true },
    });

    if (!user) {
      return NextResponse.json({ 
        message: `User not found with ID: ${userId}` 
      }, { status: 404 });
    }

    const body = await request.json();
    const { batchNumber, batchName, apiaries = [] } = body;

    console.log('[POST] Request body:', body);

    if (!batchNumber) {
      return NextResponse.json({ message: 'Batch number is required' }, { status: 400 });
    }

    for (const apiary of apiaries) {
      if (!apiary.name || !apiary.number) {
        return NextResponse.json({ message: 'Each apiary must have a name and number' }, { status: 400 });
      }
    }

    const finalBatchName = batchName?.trim() || `${batchNumber}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`;

    const existingBatch = await prisma.batch.findFirst({
      where: { batchNumber, userId: user.id },
    });

    if (existingBatch) {
      return NextResponse.json({ message: 'Batch number already exists' }, { status: 409 });
    }

    const batch = await prisma.batch.create({
      data: {
        user: { connect: { id: user.id } },
        batchNumber,
        batchName: finalBatchName,
        containerType: 'Glass',
        labelType: 'Standard',
        weightKg: 0,
        originOnly: 0,
        qualityOnly: 0,
        bothCertifications: 0,
        uncertified: 0,
        originOnlyPercent: 0,
        qualityOnlyPercent: 0,
        bothCertificationsPercent: 0,
        uncertifiedPercent: 0,
        completedChecks: 0,
        totalChecks: 4,
      },
    });

    console.log('[POST] Created batch:', batch);

    const createdApiaries = [];

    for (const apiaryData of apiaries) {
      console.log('[POST] Processing apiary:', apiaryData);
      
      if (apiaryData.locationId?.trim()) {
        const locationId = parseInt(apiaryData.locationId);
        if (isNaN(locationId)) throw new Error(`Invalid locationId: ${apiaryData.locationId}`);

        const existingLocation = await prisma.apiary.findUnique({ where: { id: locationId } });
        if (!existingLocation) throw new Error(`Location with ID ${locationId} not found`);

        const updatedApiary = await prisma.apiary.update({
          where: { id: locationId },
          data: {
            name: apiaryData.name,
            number: apiaryData.number,
            hiveCount: apiaryData.hiveCount ? parseInt(String(apiaryData.hiveCount)) : 0,
            kilosCollected: apiaryData.kilosCollected ? parseFloat(String(apiaryData.kilosCollected)) : 0,
            batch: { connect: { id: batch.id } }, // Connect via batch relation
            user: { connect: { id: user.id } }, // Connect the apiary to the user
          },
        });
        createdApiaries.push(updatedApiary);
      } else {
        const hiveCount = apiaryData.hiveCount ? parseInt(String(apiaryData.hiveCount)) : 0;
        const kilosCollected = apiaryData.kilosCollected ? parseFloat(String(apiaryData.kilosCollected)) : 0;
        const latitude = apiaryData.latitude ? parseFloat(String(apiaryData.latitude)) : 0;
        const longitude = apiaryData.longitude ? parseFloat(String(apiaryData.longitude)) : 0;

        const newApiary = await prisma.apiary.create({
          data: {
            name: apiaryData.name || '',
            number: apiaryData.number || '',
            hiveCount,
            kilosCollected,
            latitude: !isNaN(latitude) ? latitude : 0,
            longitude: !isNaN(longitude) ? longitude : 0,
            batch: { connect: { id: batch.id } }, // Connect via batch relation
            user: { connect: { id: user.id } }, // Connect the apiary to the user
          },
        });
        createdApiaries.push(newApiary);
      }
    }

    console.log('[POST] Created apiaries:', createdApiaries);

    const completeBatch = await prisma.batch.findUnique({
      where: { id: batch.id },
      include: { apiaries: true },
    });

    const batches = await prisma.batch.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: { apiaries: true },
    });

    console.log('[POST] Success - returning batch');

    return NextResponse.json({ 
      batch: completeBatch, 
      batchNumber: completeBatch?.batchNumber,
      batches,
    }, { status: 201 });

  } catch (error) {
    console.error('[POST] Error creating batch:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create batch';
    return NextResponse.json({ 
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error : undefined 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}