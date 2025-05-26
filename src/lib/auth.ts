import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';


const JWT_SECRET = process.env.JWT_SECRET || 'cbb10daad5cebd98f36542a57b0cf19991eb8869d4a5c8b46ef1199b149bddcfe360bf1facac96b6b2e5e1878dc980cd49bd5695453dd439980b0dd56e12de35'; // Should be set in .env

export function getUserIdFromToken(token: string): number | null {
  try {
    // Check if token exists and has proper format
    if (!token || !token.includes('.')) {
      console.error('Token format is invalid');
      return null;
    }
    
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    return decoded.userId;
  } catch (err) {
    console.error('Invalid token:', err);
    return null;
  }
}

// src/app/api/create-batch/route.ts - Improved token extraction
export async function GET(request: NextRequest) {
  try {
    // Extract token properly from Authorization header
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    if (!token) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const userId = getUserIdFromToken(token);
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Invalid authentication token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Continue with the rest of your handler...
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
