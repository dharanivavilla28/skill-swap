// Authentication and Session Security Module
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { prisma } from './db';

const JWT_SECRET_STRING = process.env.JWT_SECRET || 'skillswap_jwt_session_signing_secret_key_minimum_32_characters';
const SECRET_KEY = new TextEncoder().encode(JWT_SECRET_STRING);
export const SESSION_COOKIE_NAME = 'skillswap_session';

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  college: string;
}

/**
 * Hashes a plaintext password with bcrypt (salt rounds: 10)
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Verifies password against bcrypt hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Signs a tamper-proof session JWT
 */
export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET_KEY);
}

/**
 * Verifies and decodes a session JWT
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
      college: payload.college as string,
    };
  } catch {
    return null;
  }
}

/**
 * Retrieves the currently authenticated user from Next.js server cookies
 */
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = await verifySessionToken(token);
    if (!payload?.userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        college: true,
        course: true,
        year: true,
        bio: true,
        interests: true,
        availabilityJson: true,
        preferredFormat: true,
        verificationStatus: true,
        trustScore: true,
        creditBalance: true,
        totalCreditsEarned: true,
        totalCreditsSpent: true,
        avatarInitial: true,
        createdAt: true,
      },
    });

    return user;
  } catch (error: any) {
    if (error?.digest === 'DYNAMIC_SERVER_USAGE') {
      throw error;
    }
    console.error('Failed to get current user session:', error);
    return null;
  }
}
