// src/app/api/batches/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authenticateRequest } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user ID
    const userId = await authenticateRequest(request);
        
    if (!userId) {
      console.warn('[GET /api/batches] ▶ No authenticated user found');
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    console.log('[GET /api/batches] ▶ Authenticated user ID:', userId);

    // Convert userId to integer for Prisma query
    const userIdInt = parseInt(userId);
        
    if (isNaN(userIdInt)) {
      console.error('[GET /api/batches] ▶ Invalid user ID format:', userId);
      return NextResponse.json(
        { error: "Invalid user ID format" },
        { status: 400 }
      );
    }

    // Fetch batches for the authenticated user
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
    
    // Debug: Log the first batch's apiaries to check location data
    if (batches.length > 0 && batches[0].apiaries.length > 0) {
      console.log('[GET /api/batches] ▶ Sample apiary data:', JSON.stringify(batches[0].apiaries[0], null, 2));
    }

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
    // Get the authenticated user ID
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
        
    // Debug: Log the incoming data
    console.log('[POST /api/batches] ▶ Received body:', JSON.stringify(body, null, 2));
        
    // Extract apiaries from body
    const { apiaries, ...batchData } = body;
        
    // Debug: Log apiaries data
    console.log('[POST /api/batches] ▶ Apiaries data:', JSON.stringify(apiaries, null, 2));

    // Helper function to safely parse coordinates
    const parseCoordinate = (value: any): number | null => {
      if (value === null || value === undefined || value === '') {
        return null;
      }
      
      const parsed = typeof value === 'string' ? parseFloat(value) : Number(value);
      
      // Check if it's a valid number and not zero (assuming 0,0 means no location set)
      if (isNaN(parsed) || (parsed === 0)) {
        return null;
      }
      
      return parsed;
    };

    // Create new batch with apiaries
    const batch = await prisma.batch.create({
      data: {
        ...batchData,
        userId: userIdInt,
        apiaries: {
          create: apiaries?.map((apiary: any) => {
            const processedApiary = {
              name: apiary.name || '',
              number: apiary.number || '',
              hiveCount: parseInt(apiary.hiveCount) || 0,
              kilosCollected: parseFloat(apiary.kilosCollected) || 0,
              latitude: parseCoordinate(apiary.latitude),
              longitude: parseCoordinate(apiary.longitude),
            };
            
            // Debug: Log each processed apiary
            console.log('[POST /api/batches] ▶ Processed apiary:', JSON.stringify(processedApiary, null, 2));
            
            return processedApiary;
          }) || []
        }
      },
      include: {
        apiaries: true,
      },
    });

    console.log('[POST /api/batches] ▶ Created batch:', JSON.stringify(batch, null, 2));

    return NextResponse.json(batch, { status: 201 });
  } catch (error) {
    console.error("[POST /api/batches] ▶ Error:", error);
    return NextResponse.json(
      { error: "Failed to create batch" },
      { status: 500 }
    );
  }
}

// Fixed apiary mapping for batch creation
export const createApiaryMapping = (formData: any, batchId: string, apiaryHoneyValues: any) => {
  return {
    apiaries: formData.apiaries
      .filter((apiary: any) => apiary.batchId === batchId || !apiary.batchId)
      .map((apiary: any) => {
        const storedValue = apiaryHoneyValues[`${batchId}-${apiary.number}`];
        
        // Helper function to safely handle coordinates
        const safeCoordinate = (coord: any): number | null => {
          if (coord === null || coord === undefined || coord === '') {
            return null;
          }
          
          const numCoord = typeof coord === 'string' ? parseFloat(coord) : Number(coord);
          
          // Return null for invalid numbers or explicit zeros (assuming 0,0 means no location)
          if (isNaN(numCoord) || numCoord === 0) {
            return null;
          }
          
          return numCoord;
        };
        
        const processedApiary = {
          name: apiary.name || '',
          number: apiary.number || '',
          hiveCount: parseInt(apiary.hiveCount) || 0,
          latitude: safeCoordinate(apiary.latitude),
          longitude: safeCoordinate(apiary.longitude),
          kilosCollected: storedValue !== undefined ? parseFloat(storedValue) : parseFloat(apiary.kilosCollected) || 0
        };
        
        // Debug log
        console.log(`Processing apiary ${apiary.number}:`, {
          original: { lat: apiary.latitude, lng: apiary.longitude },
          processed: { lat: processedApiary.latitude, lng: processedApiary.longitude }
        });
        
        return processedApiary;
      })
  };
};