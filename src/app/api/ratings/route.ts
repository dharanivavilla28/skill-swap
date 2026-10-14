import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

const ratingSchema = z.object({
  swapId: z.string().min(1, 'Swap ID is required'),
  score: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
  reviewText: z.string().min(5, 'Review must be at least 5 characters').max(1000),
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = ratingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const { swapId, score, reviewText } = parsed.data;

    // 1. Fetch swap
    const swap = await prisma.swap.findUnique({
      where: { id: swapId },
      include: {
        requester: true,
        provider: true,
      },
    });

    if (!swap) {
      return NextResponse.json({ error: 'Swap not found' }, { status: 404 });
    }

    // 2. Rule: Only completed swaps can receive ratings
    if (swap.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Reviews and ratings can only be submitted for completed sessions.' },
        { status: 400 }
      );
    }

    // 3. Rule: Reviewer must be a participant
    if (swap.requesterId !== user.id && swap.providerId !== user.id) {
      return NextResponse.json(
        { error: 'Only participants in this completed swap can submit feedback.' },
        { status: 403 }
      );
    }

    const recipientId = swap.requesterId === user.id ? swap.providerId : swap.requesterId;

    // 4. Rule: Prevent duplicate reviews
    const existing = await prisma.rating.findUnique({
      where: {
        swapId_reviewerId: {
          swapId,
          reviewerId: user.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'You have already submitted a review for this session.' },
        { status: 409 }
      );
    }

    // 5. Create rating & update recipient's reputation
    const newRating = await prisma.$transaction(async (tx) => {
      const rating = await tx.rating.create({
        data: {
          swapId,
          reviewerId: user.id,
          recipientId,
          score,
          reviewText: reviewText.trim(),
        },
      });

      // Recalculate recipient's average rating and trust score
      const allRecipientRatings = await tx.rating.findMany({
        where: { recipientId },
        select: { score: true },
      });

      const totalScore = allRecipientRatings.reduce((sum, r) => sum + r.score, 0);
      const avg = Number((totalScore / allRecipientRatings.length).toFixed(1));

      // Fetch completed swaps
      const completedSwapsCount = await tx.swap.count({
        where: { providerId: recipientId, status: 'COMPLETED' },
      });

      // Update trust score using T = 0.4R + 0.3C + 0.2V + 0.1N
      const R = avg / 5;
      const C = 0.9; // Completed swaps ratio
      const V = 0.8;
      const N = Math.min(completedSwapsCount / 10, 1.0);
      const compositeTrust = Number((0.4 * R + 0.3 * C + 0.2 * V + 0.1 * N).toFixed(2));

      await tx.user.update({
        where: { id: recipientId },
        data: {
          trustScore: Math.min(Math.max(compositeTrust, 0), 1),
        },
      });

      // Notify recipient
      await tx.notification.create({
        data: {
          userId: recipientId,
          eventType: 'FEEDBACK_RECEIVED',
          title: 'New Feedback Received!',
          content: `${user.name} rated your session ${score} / 5 stars: "${reviewText.slice(0, 80)}${reviewText.length > 80 ? '...' : ''}"`,
          link: `/profile`,
        },
      });

      return rating;
    });

    return NextResponse.json({ success: true, rating: newRating }, { status: 201 });
  } catch (error) {
    console.error('Failed to submit rating:', error);
    return NextResponse.json({ error: 'Failed to record feedback' }, { status: 500 });
  }
}
