import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { hashPassword, createSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  college: z.string().default('Metro State University'),
  course: z.string().optional(),
  year: z.string().optional(),
  bio: z.string().optional(),
  interests: z.string().optional(),
  preferredFormat: z.enum(['ONLINE', 'IN_PERSON', 'BOTH']).default('BOTH'),
  availabilityJson: z.string().optional(),
  offeredSkillIds: z.array(z.string()).optional(),
  wantedSkillIds: z.array(z.string()).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid form input' },
        { status: 400 }
      );
    }

    const {
      name,
      email,
      password,
      college,
      course,
      year,
      bio,
      interests,
      preferredFormat,
      availabilityJson,
      offeredSkillIds,
      wantedSkillIds,
    } = parsed.data;

    // Check duplicate email
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email address already exists.' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const avatarInitial = name
      .trim()
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();

    // Default starting credit policy: 5.0 credits
    const startingCredits = parseFloat(process.env.STARTING_CREDIT_BALANCE || '5.0');

    // Create user in a transaction with starting grant
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email: email.toLowerCase().trim(),
          passwordHash,
          college,
          course: course || null,
          year: year || null,
          bio: bio || null,
          interests: interests || null,
          preferredFormat,
          availabilityJson: availabilityJson || JSON.stringify([
            { day: 'Saturday', time: 'Morning' },
            { day: 'Wednesday', time: 'Evening' },
          ]),
          creditBalance: startingCredits,
          avatarInitial,
          verificationStatus: 'UNVERIFIED',
          trustScore: 0.5,
        },
      });

      // Starting credit transaction
      await tx.creditTransaction.create({
        data: {
          userId: user.id,
          type: 'STARTING_GRANT',
          amount: startingCredits,
          balanceAfter: startingCredits,
          description: 'Welcome onboard! Starting credit grant for campus skill exchanges.',
          idempotencyKey: `starting-grant-${user.id}`,
        },
      });

      // Add offered skills
      if (offeredSkillIds && offeredSkillIds.length > 0) {
        for (const skillId of offeredSkillIds) {
          await tx.userSkill.create({
            data: {
              userId: user.id,
              skillId,
              type: 'OFFERED',
              proficiency: 'INTERMEDIATE',
            },
          });
        }
      }

      // Add wanted skills
      if (wantedSkillIds && wantedSkillIds.length > 0) {
        for (const skillId of wantedSkillIds) {
          await tx.userSkill.create({
            data: {
              userId: user.id,
              skillId,
              type: 'WANTED',
              proficiency: 'BEGINNER',
            },
          });
        }
      }

      // Initial welcome notification
      await tx.notification.create({
        data: {
          userId: user.id,
          eventType: 'CREDITS_EARNED',
          title: 'Welcome to SkillSwap!',
          content: `You received ${startingCredits.toFixed(1)} starting skill credits. Explore peers or offer your skills to begin!`,
          link: '/dashboard',
        },
      });

      return user;
    });

    // Create JWT Session
    const token = await createSessionToken({
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
      college: newUser.college,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        college: newUser.college,
        creditBalance: newUser.creditBalance,
      },
    });

    // Set secure HTTP-only cookie
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'An unexpected server error occurred during registration.' },
      { status: 500 }
    );
  }
}
