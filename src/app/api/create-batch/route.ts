import { NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { getUserIdFromToken } from '@/lib/auth'; // make sure this resolves correctly

const prisma = new PrismaClient();

// Type definitions
interface ApiaryData {
  name: string;
  number: string;
  hiveCount?: number | string;
  kilosCollected?: number | string;
  latitude?: number | string | null;
  longitude?: number | string | null;
}

interface BatchRequestBody {
  batchNumber: string;
  batchName?: string; // Made optional
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

    const userId = getUserIdFromToken(token);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    const user = await prisma.beeusers.findUnique({
      where: { id: userId },
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
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    console.log('[POST] Raw Authorization header:', authHeader);

    const token = authHeader?.replace('Bearer ', '').trim();
    console.log('[POST] Token after cleaning:', token);

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized: No token provided' }, { status: 401 });
    }

    const userId = getUserIdFromToken(token);
    console.log('[POST] Extracted userId:', userId);

    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    const body: BatchRequestBody = await request.json();
    const { batchNumber, batchName, apiaries = [] } = body;

    if (!batchNumber) {
      return NextResponse.json({ message: 'Batch number is required' }, { status: 400 });
    }

    // Generate batch name with timestamp if not provided
    const finalBatchName = batchName && batchName.trim() 
      ? batchName.trim() 
      : `${batchNumber}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`;

    // Validate apiaries data if provided
    if (apiaries.length > 0) {
      for (const apiary of apiaries) {
        if (!apiary.name || !apiary.number) {
          return NextResponse.json({ 
            message: 'Each apiary must have a name and number' 
          }, { status: 400 });
        }
      }
    }

    // 🔒 Check for duplicate batch number
    const existingBatch = await prisma.batch.findFirst({
      where: { batchNumber, userId },
    });

    if (existingBatch) {
      return NextResponse.json({ message: 'Batch number already exists' }, { status: 409 });
    }

    // Create batch with apiaries
    const newBatch = await prisma.batch.create({
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

    // 2. Create related Apiaries with validation
    if (apiaries.length > 0) {
      const validatedApiaries = apiaries.map((apiary) => {
        // Validate and convert each apiary's data
        const hiveCount = apiary.hiveCount ? parseInt(String(apiary.hiveCount)) : 0;
        const kilosCollected = apiary.kilosCollected ? parseFloat(String(apiary.kilosCollected)) : 0;
        const latitude = apiary.latitude ? parseFloat(String(apiary.latitude)) : 0;
        const longitude = apiary.longitude ? parseFloat(String(apiary.longitude)) : 0;

        // Check for NaN values
        if (isNaN(hiveCount) || isNaN(kilosCollected) || isNaN(latitude) || isNaN(longitude)) {
          throw new Error(`Invalid numeric values in apiary: ${apiary.name}`);
        }

        return {
          name: apiary.name || '',
          number: apiary.number || '',
          hiveCount,
          kilosCollected,
          latitude,
          longitude,
          batchId: newBatch.id,
        };
      });

      await prisma.apiary.createMany({
        data: validatedApiaries,
      });
    }

    // Fetch updated batches list
    const batches = await prisma.batch.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' },
      include: { apiaries: true }
    });

    return NextResponse.json({ 
      batch: newBatch, 
      batchNumber: newBatch.batchNumber,
      batches // Include updated batches list if needed
    });

  } catch (error) {
    console.error('[POST] Error creating batch:', error);
    return NextResponse.json({ message: 'Failed to create batch' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}