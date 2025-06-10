// /lib/auth.ts - Simplified JWT-only authentication with user existence validation
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import LinkedInProvider from "next-auth/providers/linkedin";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          firstName: profile.given_name || "",
          lastName: profile.family_name || "",
        };
      },
    }),
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.id,
          name: `${profile.localizedFirstName} ${profile.localizedLastName}`,
          email: profile.emailAddress,
          image: profile.profilePicture?.["displayImage~"]?.elements?.[0]?.identifiers?.[0]?.identifier,
          firstName: profile.localizedFirstName || "",
          lastName: profile.localizedLastName || "",
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" || account?.provider === "linkedin") {
        try {
          const existingUser = await prisma.beeusers.findUnique({
            where: { email: user.email! },
          });

          if (!existingUser) {
            const randomPassword = Math.random().toString(36).slice(-8);
            const hashedPassword = await bcrypt.hash(randomPassword, 12);

            await prisma.beeusers.create({
              data: {
                firstname: (user as any).firstName || user.name?.split(" ")[0] || "",
                lastname: (user as any).lastName || user.name?.split(" ").slice(1).join(" ") || "",
                email: user.email!,
                password: hashedPassword,
                isConfirmed: true,
                isProfileComplete: false,
              },
            });
          }
          return true;
        } catch (error) {
          console.error("Error during OAuth sign in:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user?.email) {
        // Get user from database and create JWT with user ID
        const dbUser = await prisma.beeusers.findUnique({
          where: { email: user.email },
          select: { id: true, email: true, firstname: true, lastname: true }
        });

        if (dbUser) {
          token.userId = dbUser.id;
          token.email = dbUser.email;
          token.firstName = dbUser.firstname;
          token.lastName = dbUser.lastname;
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Pass JWT token data to session for frontend access
      if (token.userId) {
        session.user.id = token.userId.toString();
        session.user.email = token.email as string;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        
        // Create a proper JWT token for API calls
        session.accessToken = createJWTToken(token.userId as number, token.email as string);
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
  debug: process.env.NODE_ENV === "development",
};

/**
 * Creates a JWT token for API authentication
 */
export function createJWTToken(userId: number, email: string): string {
  const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET or NEXTAUTH_SECRET environment variable is required');
  }

  const payload = {
    userId,
    email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  };

  return jwt.sign(payload, secret);
}

/**
 * Enhanced JWT verification that checks if user still exists in database
 */
export async function getUserIdFromToken(token: string): Promise<string | null> {
  try {
    if (!token) {
      console.log('[getUserIdFromToken] No token provided');
      return null;
    }

    // Remove 'Bearer ' prefix if present
    const cleanToken = token.replace(/^Bearer\s+/i, '').trim();
    
    if (!cleanToken) {
      console.log('[getUserIdFromToken] Empty token after cleaning');
      return null;
    }

    const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
    if (!secret) {
      console.error('[getUserIdFromToken] No JWT secret found');
      return null;
    }

    console.log('[getUserIdFromToken] Processing JWT token');

    // Verify and decode JWT
    const decoded = jwt.verify(cleanToken, secret) as any;
    console.log('[getUserIdFromToken] Decoded JWT payload:', {
      userId: decoded.userId,
      email: decoded.email,
      iat: decoded.iat,
      exp: decoded.exp
    });

    let userId: string | null = null;

    if (decoded.userId) {
      userId = decoded.userId.toString();
    } else if (decoded.email) {
      // Fallback: lookup user by email
      const dbUser = await prisma.beeusers.findUnique({
        where: { email: decoded.email },
        select: { id: true }
      });
      
      if (dbUser) {
        userId = dbUser.id.toString();
      }
    }

    if (!userId) {
      console.warn('[getUserIdFromToken] No valid user identifier in JWT');
      return null;
    }

    // CRITICAL: Check if user still exists in database
    const userExists = await prisma.beeusers.findUnique({
      where: { id: parseInt(userId) },
      select: { id: true }
    });

    if (!userExists) {
      console.warn('[getUserIdFromToken] User no longer exists in database:', userId);
      return null;
    }

    console.log('[getUserIdFromToken] User verified and exists:', userId);
    return userId;

  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      console.log('[getUserIdFromToken] JWT token expired');
    } else if (error.name === 'JsonWebTokenError') {
      console.log('[getUserIdFromToken] Invalid JWT token');
    } else {
      console.error('[getUserIdFromToken] JWT verification error:', error.message);
    }
    return null;
  }
}

/**
 * Simplified authentication for API routes - JWT ONLY
 */
export async function authenticateRequest(request: NextRequest): Promise<string | null> {
  try {
    // Only check Authorization header for JWT token
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      console.log('[authenticateRequest] No authorization header');
      return null;
    }

    if (!authHeader.startsWith('Bearer ')) {
      console.log('[authenticateRequest] Invalid authorization header format');
      return null;
    }

    const token = authHeader.substring(7);
    const userId = await getUserIdFromToken(token);

    if (userId) {
      console.log('[authenticateRequest] Authenticated user ID:', userId);
      return userId;
    } else {
      console.log('[authenticateRequest] Token validation failed');
      return null;
    }

  } catch (error) {
    console.error('[authenticateRequest] Authentication error:', error);
    return null;
  }
}

/**
 * Get current user from JWT token
 */
export async function getCurrentUser(request: NextRequest) {
  try {
    const userId = await authenticateRequest(request);
    if (!userId) return null;

    const dbUser = await prisma.beeusers.findUnique({
      where: { id: parseInt(userId) },
      include: {
        tokenStats: true,
        batches: true,
      },
    });

    return dbUser;
  } catch (error) {
    console.error('[getCurrentUser] Error:', error);
    return null;
  }
}

/**
 * Client-side logout utility
 */
export function clearClientSession() {
  // Clear localStorage
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    localStorage.removeItem('next-auth.session-token');
    localStorage.removeItem('next-auth.csrf-token');
    
    // Clear sessionStorage as well
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('user');
    
    // Clear any other auth-related items you might have
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('next-auth') || key.startsWith('auth')) {
        localStorage.removeItem(key);
      }
    });
    
    console.log('[clearClientSession] All client-side auth data cleared');
  }
}

/**
 * Complete logout function for frontend use
 */
export async function performLogout() {
  try {
    console.log('[performLogout] Starting logout process...');
    
    // Call logout API
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
      },
    });

    if (!response.ok) {
      console.warn('[performLogout] Logout API failed, continuing with client cleanup');
    }

    // Clear client-side data regardless of API response
    clearClientSession();
    
    console.log('[performLogout] Logout completed successfully');
    return true;
  } catch (error) {
    console.error('[performLogout] Error during logout:', error);
    // Still clear client-side data even if API fails
    clearClientSession();
    return false;
  }
}

export default authOptions;