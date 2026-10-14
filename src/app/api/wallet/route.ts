import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const typeFilter = searchParams.get('type'); // 'EARNED', 'SPENT', 'STARTING_GRANT', etc.

    const transactions = await prisma.creditTransaction.findMany({
      where: {
        userId: user.id,
        ...(typeFilter && typeFilter !== 'ALL' ? { type: typeFilter } : {}),
      },
      include: {
        swap: {
          include: {
            requester: { select: { id: true, name: true } },
            provider: { select: { id: true, name: true } },
            skill: { select: { id: true, canonicalName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Also get active pending swaps where credits might be committed
    const pendingSwaps = await prisma.swap.findMany({
      where: {
        requesterId: user.id,
        status: { in: ['PENDING', 'ACCEPTED', 'SCHEDULED', 'IN_PROGRESS'] },
      },
      include: {
        provider: { select: { name: true } },
        skill: { select: { canonicalName: true } },
      },
    });

    const pendingCommittedCredits = pendingSwaps.reduce(
      (sum, s) => sum + s.agreedCredits,
      0
    );

    return NextResponse.json({
      balance: user.creditBalance,
      totalEarned: user.totalCreditsEarned,
      totalSpent: user.totalCreditsSpent,
      pendingCommittedCredits: Number(pendingCommittedCredits.toFixed(2)),
      pendingSwaps,
      transactions,
    });
  } catch (error) {
    console.error('Failed to get wallet ledger:', error);
    return NextResponse.json({ error: 'Failed to retrieve wallet ledger' }, { status: 500 });
  }
}
