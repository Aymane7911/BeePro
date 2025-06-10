import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authenticateRequest } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const userId = await authenticateRequest(request);
        
    if (!userId) {
      console.warn('[GET /api/batches] ▶ No authenticated user found');
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userIdInt = parseInt(userId);
        
    if (isNaN(userIdInt)) {
      console.error('[GET /api/batches] ▶ Invalid user ID format:', userId);
      return NextResponse.json(
        { error: "Invalid user ID format" },
        { status: 400 }
      );
    }

    const batches = await prisma.batch.findMany({
      where: {
        userId: userIdInt,
      },
      include: {
        apiaries: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`[GET /api/batches] ▶ Found ${batches.length} batches for user ${userIdInt}`);

    return NextResponse.json({ batches });
  } catch (error) {
    console.error("[GET /api/batches] ▶ Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch batches" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await authenticateRequest(request);
        
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userIdInt = parseInt(userId);
        
    if (isNaN(userIdInt)) {
      return NextResponse.json(
        { error: "Invalid user ID format" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { apiaries, ...batchData } = body;

    const parseCoordinate = (value: any): number | null => {
      if (value === null || value === undefined || value === '') {
        return null;
      }
      
      const parsed = typeof value === 'string' ? parseFloat(value) : Number(value);
      
      if (isNaN(parsed) || (parsed === 0)) {
        return null;
      }
      
      return parsed;
    };

    const batch = await prisma.batch.create({
      data: {
        ...batchData,
        userId: userIdInt,
        apiaries: {
          create: apiaries?.map((apiary: any) => ({
            name: apiary.name || '',
            number: apiary.number || '',
            hiveCount: parseInt(apiary.hiveCount) || 0,
            kilosCollected: parseFloat(apiary.kilosCollected) || 0,
            latitude: parseCoordinate(apiary.latitude),
            longitude: parseCoordinate(apiary.longitude),
            userId: userIdInt, // Add userId for apiary
          })) || []
        }
      },
      include: {
        apiaries: true,
      },
    });

    return NextResponse.json(batch, { status: 201 });
  } catch (error) {
    console.error("[POST /api/batches] ▶ Error:", error);
    return NextResponse.json(
      { error: "Failed to create batch" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await authenticateRequest(request);
        
    if (!userId) {
      console.warn('[PUT /api/batches] ▶ No authenticated user found');
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userIdInt = parseInt(userId);
        
    if (isNaN(userIdInt)) {
      console.error('[PUT /api/batches] ▶ Invalid user ID format:', userId);
      return NextResponse.json(
        { error: "Invalid user ID format" },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const dataString = formData.get('data') as string;
    
    if (!dataString) {
      return NextResponse.json(
        { error: "No data provided" },
        { status: 400 }
      );
    }

    const data = JSON.parse(dataString);
    const { batchId, updatedFields, apiaries } = data;

    console.log('[PUT /api/batches] ▶ Updating batch:', batchId);

    const parseCoordinate = (value: any): number | null => {
      if (value === null || value === undefined || value === '') {
        return null;
      }
      
      const parsed = typeof value === 'string' ? parseFloat(value) : Number(value);
      
      if (isNaN(parsed) || parsed === 0) {
        return null;
      }
      
      return parsed;
    };

    // Verify the batch belongs to the authenticated user
    const existingBatch = await prisma.batch.findFirst({
      where: {
        id: batchId,
        userId: userIdInt,
      },
      include: {
        apiaries: true,
      },
    });

    if (!existingBatch) {
      return NextResponse.json(
        { error: "Batch not found or access denied" },
        { status: 404 }
      );
    }

    // Prepare update data - convert jarCertifications to proper JSON
    const updateData: any = { ...updatedFields };
    if (updatedFields.jarCertifications) {
      updateData.jarCertifications = updatedFields.jarCertifications;
    }

    // Update the batch
    const updatedBatch = await prisma.batch.update({
      where: {
        id: batchId,
      },
      data: updateData,
      include: {
        apiaries: true,
      },
    });

    // Update apiaries if provided
    if (apiaries && apiaries.length > 0) {
      // Delete existing apiaries for this batch
      await prisma.apiary.deleteMany({
        where: {
          batchId: batchId,
        },
      });

      // Create new apiaries with updated data
      const processedApiaries = apiaries.map((apiary: any) => ({
        name: apiary.name || '',
        number: apiary.number || '',
        hiveCount: parseInt(apiary.hiveCount) || 0,
        kilosCollected: parseFloat(apiary.kilosCollected) || 0,
        latitude: parseCoordinate(apiary.latitude),
        longitude: parseCoordinate(apiary.longitude),
        batchId: batchId,
        userId: userIdInt, // Add userId for apiary
      }));

      await prisma.apiary.createMany({
        data: processedApiaries,
      });
    }

    // Fetch the updated batch with new apiaries
    const finalBatch = await prisma.batch.findUnique({
      where: {
        id: batchId,
      },
      include: {
        apiaries: true,
      },
    });

    console.log('[PUT /api/batches] ▶ Successfully updated batch:', batchId);

    return NextResponse.json({ 
      message: "Batch updated successfully", 
      batch: finalBatch 
    });

  } catch (error) {
    console.error("[PUT /api/batches] ▶ Error:", error);
    return NextResponse.json(
      { error: "Failed to update batch" },
      { status: 500 }
    );
  }
}