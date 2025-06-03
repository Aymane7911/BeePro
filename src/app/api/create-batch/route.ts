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
  locationId?: string; // Add this field
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

    const userIdentifier = getUserIdFromToken(token);
    if (!userIdentifier) {
      return NextResponse.json({ message: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    // Find user by email and get their integer ID
    const user = await prisma.beeusers.findUnique({
      where: { email: userIdentifier },
      include: { tokenStats: true },
    });
    

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const batches = await prisma.batch.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: { apiaries: true},
    });

    const tokenStats = user.tokenStats || {
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

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized: No token provided' }, { status: 401 });
    }

    const userIdentifier = getUserIdFromToken(token);
    if (!userIdentifier) {
      return NextResponse.json({ message: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    const user = await prisma.beeusers.findUnique({
      where: { email: userIdentifier },
      include: { tokenStats: true },
    });

    if (!user) {
      return NextResponse.json({ 
        message: `User not found with email: ${userIdentifier}` 
      }, { status: 404 });
    }

    const userId = user.id;

    const body = await request.json();
    const { batchNumber, batchName, apiaries = [] } = body;

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
      where: { batchNumber, userId },
    });

    if (existingBatch) {
      return NextResponse.json({ message: 'Batch number already exists' }, { status: 409 });
    }

    const batch = await prisma.batch.create({
      data: {
        user: { connect: { id: userId } },
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

    const createdApiaries = [];

    for (const apiaryData of apiaries) {
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
            batchId: batch.id,
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
            batchId: batch.id,
          },
        });
        createdApiaries.push(newApiary);
      }
    }

    const completeBatch = await prisma.batch.findUnique({
      where: { id: batch.id },
      include: { apiaries: true },
    });

    const batches = await prisma.batch.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { apiaries: true },
    });

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
