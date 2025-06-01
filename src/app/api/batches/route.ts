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
        userId: userIdInt, // Now using integer instead of string
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
    
    // Create new batch
    const batch = await prisma.batch.create({
      data: {
        ...body,
        userId: userIdInt, // Use integer user ID
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