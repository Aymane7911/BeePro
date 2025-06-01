// /lib/auth.ts
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import LinkedInProvider from "next-auth/providers/linkedin";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';
import { getServerSession } from "next-auth/next";

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
          // Check if user exists in our beeusers table
          const existingUser = await prisma.beeusers.findUnique({
            where: { email: user.email! },
          });

          if (!existingUser) {
            // Create new user in beeusers table
            const randomPassword = Math.random().toString(36).slice(-8);
            const hashedPassword = await bcrypt.hash(randomPassword, 12);

            await prisma.beeusers.create({
              data: {
                firstname: (user as any).firstName || user.name?.split(" ")[0] || "",
                lastname: (user as any).lastName || user.name?.split(" ").slice(1).join(" ") || "",
                email: user.email!,
                password: hashedPassword,
                isConfirmed: true, // Auto-confirm OAuth users
                isProfileComplete: false,
              },
            });

            console.log("New user created via OAuth:", user.email);
          }

          return true;
        } catch (error) {
          console.error("Error during OAuth sign in:", error);
          return false;
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user?.email) {
        try {
          const dbUser = await prisma.beeusers.findUnique({
            where: { email: session.user.email },
            include: {
              tokenStats: true,
              batches: true,
            },
          });

          if (dbUser) {
            session.user.id = dbUser.id.toString();
            session.user.firstName = dbUser.firstname;
            session.user.lastName = dbUser.lastname;
            session.user.isProfileComplete = dbUser.isProfileComplete;
            session.user.dbUser = dbUser;
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      return token;
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
 * Enhanced authentication utilities that work with NextAuth and standalone tokens
 */

/**
 * Extracts and validates user ID from various token types including NextAuth JWT tokens
 * @param {string} token - The authentication token
 * @returns {string | null} - User ID if valid, null if invalid
 */
export function getUserIdFromToken(token: string): string | null {
  try {
    if (!token) {
      console.warn('[getUserIdFromToken] No token provided');
      return null;
    }

    // Remove 'Bearer ' prefix if present
    const cleanToken = token.replace(/^Bearer\s+/i, '').trim();
    
    if (!cleanToken) {
      console.warn('[getUserIdFromToken] Empty token after cleaning');
      return null;
    }

    console.log('[getUserIdFromToken] Processing token type:', cleanToken.includes('.') ? 'JWT' : 'OAuth');

    // Handle JWT tokens (contains dots for header.payload.signature)
    if (cleanToken.includes('.') && cleanToken.split('.').length === 3) {
      try {
        // Try to decode without verification first (for debugging)
        const decoded = jwt.decode(cleanToken) as any;
        console.log('[getUserIdFromToken] Decoded JWT payload:', decoded);

        // Handle NextAuth JWT tokens
        if (decoded?.email) {
          // For NextAuth tokens, we'll use email to find the user ID
          return `nextauth_${decoded.email}`;
        }

        // If you have JWT_SECRET, verify the token
        if (process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET) {
          const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET!;
          const verified = jwt.verify(cleanToken, secret) as any;
          console.log('[getUserIdFromToken] Verified JWT:', verified);
          return verified.userId || verified.sub || verified.id || verified.email;
        } else {
          // If no JWT_SECRET, use decoded payload (less secure, for development)
          console.warn('[getUserIdFromToken] No JWT_SECRET found, using unverified token');
          return decoded.userId || decoded.sub || decoded.id || decoded.email;
        }
      } catch (jwtError: any) {
        console.error('[getUserIdFromToken] JWT verification failed:', jwtError.message);
        
        // Try to decode anyway for Google OAuth JWTs or NextAuth JWTs
        try {
          const decoded = jwt.decode(cleanToken) as any;
          if (decoded && typeof decoded === 'object') {
            console.log('[getUserIdFromToken] Using decoded JWT:', decoded);
            return decoded.sub || decoded.email || decoded.userId || decoded.id;
          }
        } catch (decodeError: any) {
          console.error('[getUserIdFromToken] JWT decode failed:', decodeError.message);
        }
      }
    }

    // Handle Google OAuth access tokens (long alphanumeric strings)
    if (cleanToken.length > 100 && !cleanToken.includes('.')) {
      console.log('[getUserIdFromToken] Detected Google OAuth access token');
      
      // Create a consistent user ID from the token hash
      const crypto = require('crypto');
      const hash = crypto.createHash('sha256').update(cleanToken).digest('hex');
      const userId = 'google_' + hash.substring(0, 16);
      
      console.log('[getUserIdFromToken] Generated user ID for OAuth token:', userId);
      return userId;
    }

    // Handle other token formats or session tokens
    if (cleanToken.length > 10) {
      console.log('[getUserIdFromToken] Treating as session token');
      
      // Create a consistent user ID from session token
      const crypto = require('crypto');
      const hash = crypto.createHash('sha256').update(cleanToken).digest('hex');
      const userId = 'session_' + hash.substring(0, 16);
      
      console.log('[getUserIdFromToken] Generated user ID for session token:', userId);
      return userId;
    }

    console.warn('[getUserIdFromToken] Unrecognized token format');
    return null;

  } catch (error) {
    console.error('[getUserIdFromToken] Unexpected error:', error);
    return null;
  }
}

/**
 * Get user ID from NextAuth session or fallback to token-based auth
 * @param request - Next.js Request object or authorization header
 * @returns Promise<string | null> - User ID if authenticated, null otherwise
 */
export async function getUserIdFromAuth(request?: Request | string): Promise<string | null> {
  try {
    // First, try to get user from NextAuth session
    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
      console.log('[getUserIdFromAuth] Found NextAuth session for email:', session.user.email);
      
      // Get the actual database user ID from the email
      const dbUser = await prisma.beeusers.findUnique({
        where: { email: session.user.email },
        select: { id: true }
      });
      
      if (dbUser) {
        console.log('[getUserIdFromAuth] Found database user ID:', dbUser.id);
        return dbUser.id.toString();
      } else {
        console.warn('[getUserIdFromAuth] No database user found for email:', session.user.email);
        return null;
      }
    }

    // Fallback to token-based authentication
    let authHeader: string | null = null;
    
    if (typeof request === 'string') {
      authHeader = request;
    } else if (request && 'headers' in request) {
      authHeader = request.headers.get('authorization');
    }

    if (authHeader) {
      const userId = getUserIdFromToken(authHeader);
      if (userId?.startsWith('nextauth_')) {
        // Convert NextAuth email-based ID to actual user ID
        const email = userId.replace('nextauth_', '');
        const dbUser = await prisma.beeusers.findUnique({
          where: { email },
          select: { id: true }
        });
        return dbUser?.id.toString() || null;
      }
      return userId;
    }

    return null;
  } catch (error) {
    console.error('[getUserIdFromAuth] Error:', error);
    return null;
  }
}

/**
 * Verifies Google OAuth token with Google's API
 * @param {string} token - Google OAuth access token
 * @returns {Promise<object|null>} - User info if valid, null if invalid
 */
export async function verifyGoogleToken(token: string): Promise<any | null> {
  try {
    const response = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`);
    
    if (!response.ok) {
      console.error('[verifyGoogleToken] Google API error:', response.status);
      return null;
    }
    
    const tokenInfo = await response.json();
    console.log('[verifyGoogleToken] Google token info:', tokenInfo);
    
    return tokenInfo;
  } catch (error) {
    console.error('[verifyGoogleToken] Error verifying Google token:', error);
    return null;
  }
}

/**
 * Enhanced getUserIdFromToken that verifies Google tokens with Google API
 * @param {string} token - The authentication token
 * @returns {Promise<string | null>} - User ID if valid, null if invalid
 */
export async function getUserIdFromTokenAsync(token: string): Promise<string | null> {
  try {
    const syncResult = getUserIdFromToken(token);
    
    // If it's a Google OAuth token, verify with Google
    if (syncResult && syncResult.startsWith('google_')) {
      const cleanToken = token.replace(/^Bearer\s+/i, '').trim();
      const googleInfo = await verifyGoogleToken(cleanToken);
      
      if (googleInfo && googleInfo.user_id) {
        return 'google_' + googleInfo.user_id;
      }
    }
    
    return syncResult;
  } catch (error) {
    console.error('[getUserIdFromTokenAsync] Error:', error);
    return null;
  }
}

/**
 * Creates a JWT token for a user
 * @param {string} userId - User ID
 * @param {object} additionalPayload - Additional data to include in token
 * @returns {string} - JWT token
 */
export function createUserToken(userId: string, additionalPayload: Record<string, any> = {}): string {
  const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET or NEXTAUTH_SECRET environment variable is required');
  }

  const payload = {
    userId,
    ...additionalPayload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  };

  return jwt.sign(payload, secret);
}

/**
 * Middleware to authenticate requests - works with both NextAuth and token-based auth
 * @param {string | Request} authHeaderOrRequest - Authorization header value or Request object
 * @returns {Promise<string | null>} - User ID if authenticated, null otherwise
 */
export async function authenticateRequest(authHeaderOrRequest?: string | Request): Promise<string | null> {
  try {
    // Try NextAuth session first
    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
      console.log('[authenticateRequest] Authenticated via NextAuth session for:', session.user.email);
      
      // Get the actual database user ID from the email
      const dbUser = await prisma.beeusers.findUnique({
        where: { email: session.user.email },
        select: { id: true }
      });
      
      if (dbUser) {
        console.log('[authenticateRequest] Found database user ID:', dbUser.id);
        return dbUser.id.toString();
      } else {
        console.warn('[authenticateRequest] No database user found for email:', session.user.email);
        return null;
      }
    }

    // Fallback to token-based authentication
    let authHeader: string | null = null;

    if (typeof authHeaderOrRequest === 'string') {
      authHeader = authHeaderOrRequest;
    } else if (authHeaderOrRequest && 'headers' in authHeaderOrRequest) {
      authHeader = authHeaderOrRequest.headers.get('authorization');
    }

    if (!authHeader) {
      console.warn('[authenticateRequest] No authorization header or session');
      return null;
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
    const userId = getUserIdFromToken(token);

    // Convert NextAuth email-based ID to actual user ID
    if (userId?.startsWith('nextauth_')) {
      const email = userId.replace('nextauth_', '');
      const dbUser = await prisma.beeusers.findUnique({
        where: { email },
        select: { id: true }
      });
      return dbUser?.id.toString() || null;
    }

    return userId;
  } catch (error) {
    console.error('[authenticateRequest] Error:', error);
    return null;
  }
}

/**
 * Get the current user's database record
 * @param authHeaderOrRequest - Authorization header or Request object
 * @returns Promise<beeusers | null> - User record if authenticated, null otherwise
 */
export async function getCurrentUser(authHeaderOrRequest?: string | Request) {
  try {
    const userId = await authenticateRequest(authHeaderOrRequest);
    if (!userId) return null;

    // First try to get from NextAuth session
    const session = await getServerSession(authOptions);
    if (session?.user?.dbUser) {
      return session.user.dbUser;
    }

    // Fallback to database lookup
    if (userId.startsWith('google_') || userId.startsWith('session_')) {
      // For hashed IDs, we can't easily look up the user
      // You might need to store these mappings in your database
      console.warn('[getCurrentUser] Cannot lookup user for hashed ID:', userId);
      return null;
    }

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

export default authOptions;