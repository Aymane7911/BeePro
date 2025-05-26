import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserIdFromToken } from '@/lib/auth';
import { z } from 'zod';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

const updateBatchSchema = z.object({
  batchId: z.string().uuid(),
  updatedFields: z.object({
    batchName: z.string().optional(),
    batchNumber: z.string().optional(),
    status: z.string().optional(),
    containerType: z.string().optional(),
    labelType: z.string().optional(),
    weightKg: z.number().optional(),
    jarsUsed: z.number().optional(),
    originOnly: z.number().optional(),
    qualityOnly: z.number().optional(),
    bothCertifications: z.number().optional(),
    uncertified: z.number().optional(),
    originOnlyPercent: z.number().optional(),
    qualityOnlyPercent: z.number().optional(),
    bothCertificationsPercent: z.number().optional(),
    uncertifiedPercent: z.number().optional(),
    completedChecks: z.number().optional(),
    totalChecks: z.number().optional(),
    certificationDate: z.string().optional(),
    expiryDate: z.string().optional(),
    productionReportPath: z.string().optional(),
    labReportPath: z.string().optional(),
  }).optional(),
  apiaries: z.array(
    z.object({
      name: z.string(),
      number: z.string(),
      hiveCount: z.number(),
      latitude: z.number(),
      longitude: z.number()
    })
  ).optional()
});

// Helper function to save uploaded file
async function saveUploadedFile(file: File, type: 'production_report' | 'lab_report', batchId: string): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Create filename with timestamp to avoid conflicts
  const timestamp = Date.now();
  const fileExtension = path.extname(file.name);
  const fileName = `${type}_${batchId}_${timestamp}${fileExtension}`;
  
  // Create upload directory if it doesn't exist
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', type);
  await mkdir(uploadDir, { recursive: true });
  
  // Save file
  const filePath = path.join(uploadDir, fileName);
  await writeFile(filePath, buffer);
  
  // Return relative path for storage in database
  return `/uploads/${type}/${fileName}`;
}

// -------------------- GET --------------------
export async function GET(request: NextRequest) {
  try {
    console.log('[GET /api/batches] ▶ Incoming request');

    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

    console.log('[GET] ▶ Extracted token:', token ? '***' + token.slice(-5) : 'None');
    const userId = getUserIdFromToken(token ?? '');

    if (!userId) {
      console.warn('[GET] ▶ Invalid token');
      return new Response(JSON.stringify({ error: 'Invalid authentication token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('[GET] ▶ Authenticated user:', userId);

    const batches = await prisma.batch.findMany({
      where: { userId },
      include: { apiaries: true }
    });

    console.log(`[GET] ▶ Found ${batches.length} batches`);

    const tokenStats = await prisma.tokenStats.findUnique({
      where: { userId }
    });

    return new Response(JSON.stringify({ batches, tokenStats }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('[GET /api/batches] ▶', error.message, '\n', error.stack);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// -------------------- PUT --------------------
export async function PUT(request: NextRequest) {
  try {
    console.log('[PUT /api/batches] ▶ Incoming request');

    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

    console.log('[PUT] ▶ Token:', token ? '***' + token.slice(-5) : 'None');
    const userId = getUserIdFromToken(token ?? '');

    if (!userId) {
      console.warn('[PUT] ▶ Invalid token');
      return new Response(JSON.stringify({ error: 'Invalid authentication token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('[PUT] ▶ Authenticated user:', userId);

    // Parse FormData for file uploads
    const formData = await request.formData();
    
    // Extract JSON data
    const jsonData = formData.get('data') as string;
    if (!jsonData) {
      return new Response(JSON.stringify({ error: 'Missing form data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = JSON.parse(jsonData);
    console.log('[PUT] ▶ Received body:', JSON.stringify(body, null, 2));

    const parsed = updateBatchSchema.safeParse(body);
    if (!parsed.success) {
      console.warn('[PUT] ▶ Validation failed:', parsed.error.format());
      return new Response(JSON.stringify({ error: 'Invalid input', details: parsed.error.format() }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { batchId, updatedFields, apiaries } = parsed.data;
    console.log('[PUT] ▶ Validated batchId:', batchId);

    const existingBatch = await prisma.batch.findUnique({ where: { id: batchId } });
    if (!existingBatch || existingBatch.userId !== userId) {
      console.warn('[PUT] ▶ Unauthorized or batch not found:', batchId);
      return new Response(JSON.stringify({ error: 'Unauthorized or batch not found' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Handle file uploads
    const productionReportFile = formData.get('productionReport') as File | null;
    const labReportFile = formData.get('labReport') as File | null;

    let productionReportPath: string | undefined;
    let labReportPath: string | undefined;

    if (productionReportFile && productionReportFile.size > 0) {
      console.log('[PUT] ▶ Saving production report file:', productionReportFile.name);
      productionReportPath = await saveUploadedFile(productionReportFile, 'production_report', batchId);
    }

    if (labReportFile && labReportFile.size > 0) {
      console.log('[PUT] ▶ Saving lab report file:', labReportFile.name);
      labReportPath = await saveUploadedFile(labReportFile, 'lab_report', batchId);
    }

    // Prepare update data
    const updateData = { ...updatedFields };
    if (productionReportPath) {
      updateData.productionReportPath = productionReportPath;
    }
    if (labReportPath) {
      updateData.labReportPath = labReportPath;
    }

    if (Object.keys(updateData).length > 0) {
      console.log('[PUT] ▶ Updating batch fields:', updateData);
      await prisma.batch.update({ where: { id: batchId }, data: updateData });
    }

    if (apiaries) {
      console.log(`[PUT] ▶ Replacing ${apiaries.length} apiaries`);
      await prisma.apiary.deleteMany({ where: { batchId } });
      for (const apiary of apiaries) {
        await prisma.apiary.create({ data: { ...apiary, batchId } });
      }
    }

    const finalBatch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: { apiaries: true }
    });

    console.log('[PUT] ▶ Update complete for batch:', batchId);
    return new Response(JSON.stringify(finalBatch), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('[PUT /api/batches] ▶', error.message, '\n', error.stack);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// -------------------- DELETE --------------------
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

    const userId = getUserIdFromToken(token ?? '');
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Invalid authentication token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Option 1: Get batchId from query params
    const url = new URL(request.url);
    const batchIdFromQuery = url.searchParams.get('batchId');

    // Option 2: Get batchId from body if not in query
    let batchIdFromBody: string | null = null;
    try {
      const body = await request.json();
      batchIdFromBody = body.batchId ?? null;
    } catch {
      // No JSON body or invalid JSON, ignore
    }

    const batchId = batchIdFromQuery || batchIdFromBody;
    if (!batchId) {
      return new Response(JSON.stringify({ error: 'Batch ID is required in query or body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate batch ownership
    const existingBatch = await prisma.batch.findUnique({
      where: { id: batchId }
    });

    if (!existingBatch) {
      return new Response(JSON.stringify({ error: 'Batch not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (existingBatch.userId !== userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized access to this batch' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Transaction to delete apiaries and batch
    await prisma.$transaction(async (tx) => {
      await tx.apiary.deleteMany({ where: { batchId } });
      await tx.batch.delete({ where: { id: batchId } });
    });

    return new Response(
      JSON.stringify({ success: true, message: 'Batch and related data successfully deleted' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error: any) {
    console.error('[DELETE /api/batches] ▶', error.message, '\n', error.stack);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}