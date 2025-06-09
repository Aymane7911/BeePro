import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { getUserIdFromToken } from '@/lib/auth';

const prisma = new PrismaClient();

// UPDATED Type definitions to match the actual frontend structure
interface ApiaryObject {
  id: number;
  name: string;
  number: string;
  hiveCount: number;
  kilosCollected: number;
  locationId: number | null;
  location: any;
}

interface BatchRequestBody {
  batchNumber: string;
  batchName?: string;
  apiaries?: ApiaryObject[]; // Changed to match what frontend sends
  totalHives?: number;
  totalHoney?: number;
}

// GET: Fetch batches for logged-in user (unchanged)
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

    const userIdentifier = await getUserIdFromToken(token);
    if (!userIdentifier) {
      return NextResponse.json({ message: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    const userId = parseInt(String(userIdentifier));
    if (isNaN(userId)) {
      return NextResponse.json({ message: 'Invalid user identifier' }, { status: 401 });
    }

    const user = await prisma.beeusers.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const batches = await prisma.batch.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: { apiaries: true },
    });

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

// FIXED POST: Handle the actual frontend data structure
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '').trim();

    console.log('[POST] Raw auth header:', authHeader);
    console.log('[POST] Extracted token:', token);

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized: No token provided' }, { status: 401 });
    }

    const userIdentifier = await getUserIdFromToken(token);
    console.log('[POST] userIdentifier returned:', userIdentifier);

    if (!userIdentifier) {
      return NextResponse.json({ message: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    const userId = parseInt(String(userIdentifier));
    if (isNaN(userId)) {
      return NextResponse.json({ message: 'Invalid user identifier' }, { status: 401 });
    }

    console.log('[POST] Final userId for query:', userId);

    const user = await prisma.beeusers.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ 
        message: `User not found with ID: ${userId}` 
      }, { status: 404 });
    }

    const body = await request.json();
    const { batchNumber, batchName, apiaries = [], totalHives, totalHoney } = body;

    console.log('[POST] Request body:', body);

    if (!batchNumber) {
      return NextResponse.json({ message: 'Batch number is required' }, { status: 400 });
    }

    // FIXED: Validate apiaries array (not apiaryReferences)
    if (!Array.isArray(apiaries) || apiaries.length === 0) {
      return NextResponse.json({ message: 'At least one apiary is required' }, { status: 400 });
    }

    // Validate each apiary object
    for (const apiary of apiaries) {
      if (!apiary.id || typeof apiary.id !== 'number') {
        return NextResponse.json({ message: 'Each apiary must have a valid id' }, { status: 400 });
      }
      
      // Verify the apiary exists and belongs to the user
      const existingApiary = await prisma.apiary.findFirst({
        where: { 
          id: apiary.id,
          userId: user.id 
        }
      });
      
      if (!existingApiary) {
        return NextResponse.json({ 
          message: `Apiary with ID ${apiary.id} not found or doesn't belong to user` 
        }, { status: 404 });
      }
    }

    const finalBatchName = batchName?.trim() || `${batchNumber}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`;

    // Check if batch number already exists for this user
    const existingBatch = await prisma.batch.findFirst({
      where: { batchNumber, userId: user.id },
    });

    if (existingBatch) {
      return NextResponse.json({ message: 'Batch number already exists' }, { status: 409 });
    }

    // STEP 1: Create the batch
    const batch = await prisma.batch.create({
      data: {
        user: { connect: { id: user.id } },
        batchNumber,
        batchName: finalBatchName,
        containerType: 'Glass',
        labelType: 'Standard',
        weightKg: totalHoney || 0,
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

    // STEP 2: UPDATE existing apiaries with batch ID
    const updatedApiaries = [];

    for (const apiary of apiaries) {
      console.log('[POST] Updating apiary with ID:', apiary.id);
      
      // UPDATE the existing apiary record to link it to the batch
      const updatedApiary = await prisma.apiary.update({
        where: { id: apiary.id },
        data: {
          batchId: batch.id, // Link to the batch
          // Keep the existing kilosCollected value from the apiary object
        },
      });
      
      updatedApiaries.push(updatedApiary);
      console.log('[POST] Updated apiary:', updatedApiary);
    }

    console.log('[POST] All apiaries updated successfully');

    // STEP 3: Return the complete batch with associated apiaries
    const completeBatch = await prisma.batch.findUnique({
      where: { id: batch.id },
      include: { apiaries: true },
    });

    // Get updated list of all batches for the user
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
      message: `Batch created successfully and ${updatedApiaries.length} existing apiaries updated`
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