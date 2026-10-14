import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { calculateCreditsForDuration } from '@/features/swaps/lifecycle';

const createSwapSchema = z.object({
  providerId: z.string().min(1, 'Provider is required'),
  skillId: z.string().min(1, 'Skill is required'),
  learningGoal: z.string().min(5, 'Learning goal must be at least 5 characters'),
  sessionFormat: z.enum(['ONLINE', 'IN_PERSON']),
  preferredTime: z.string().min(1, 'Preferred date/time is required'),
  durationMinutes: z.enum(['30', '45', '60']).or(z.number()),
  message: z.string().optional(),
  deliverables: z.string().optional(),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const swaps = await prisma.swap.findMany({
      where: {
        OR: [{ requesterId: user.id }, { providerId: user.id }],
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarInitial: true,
            college: true,
            course: true,
          },
        },
        provider: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarInitial: true,
            college: true,
            course: true,
          },
        },
        skill: true,
        ratings: true,
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ swaps });
  } catch (error) {
    console.error('Failed to fetch swaps:', error);
    return NextResponse.json({ error: 'Failed to fetch swaps' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createSwapSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const {
      providerId,
      skillId,
      learningGoal,
      sessionFormat,
      preferredTime,
      durationMinutes,
      message,
      deliverables,
    } = parsed.data;

    if (providerId === user.id) {
      return NextResponse.json(
        { error: 'You cannot request a skill exchange with yourself.' },
        { status: 400 }
      );
    }

    // Verify provider exists
    const provider = await prisma.user.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      return NextResponse.json({ error: 'Skill provider not found.' }, { status: 404 });
    }

    // Verify skill exists
    const skill = await prisma.skill.findUnique({
      where: { id: skillId },
    });

    if (!skill) {
      return NextResponse.json({ error: 'Skill not found.' }, { status: 404 });
    }

    const durationNum = typeof durationMinutes === 'string' ? parseInt(durationMinutes, 10) : durationMinutes;
    const creditAmount = calculateCreditsForDuration(durationNum);

    // Verify learner has sufficient credit balance
    if (user.creditBalance < creditAmount) {
      return NextResponse.json(
        {
          error: `Insufficient credits. You currently have ${user.creditBalance.toFixed(2)} credits, but this ${durationNum}-minute session requires ${creditAmount.toFixed(2)} credits. Earn credits first by teaching!`,
        },
        { status: 400 }
      );
    }

    // Create swap request in PENDING state (NO credits deducted yet per rule 1!)
    const swap = await prisma.$transaction(async (tx) => {
      const newSwap = await tx.swap.create({
        data: {
          requesterId: user.id,
          providerId,
          skillId,
          learningGoal,
          sessionFormat,
          preferredTime,
          durationMinutes: durationNum,
          proposedCredits: creditAmount,
          agreedCredits: creditAmount,
          deliverables: deliverables || null,
          status: 'PENDING',
          settlementState: 'UNSETTLED',
        },
        include: {
          requester: true,
          provider: true,
          skill: true,
        },
      });

      // Optional initial message
      if (message && message.trim()) {
        await tx.message.create({
          data: {
            swapId: newSwap.id,
            senderId: user.id,
            recipientId: providerId,
            content: message.trim(),
          },
        });
      }

      // Notify provider
      await tx.notification.create({
        data: {
          userId: providerId,
          eventType: 'REQUEST_RECEIVED',
          title: 'New Session Request Received!',
          content: `${user.name} requested a ${durationNum}-minute session to learn ${skill.canonicalName}.`,
          link: `/sessions`,
        },
      });

      return newSwap;
    });

    return NextResponse.json({ success: true, swap }, { status: 201 });
  } catch (error) {
    console.error('Failed to create session request:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while creating the session request.' },
      { status: 500 }
    );
  }
}
