// Credit Wallet & Immutable Ledger Engine
// Enforces atomic settlement, duplicate prevention, and balance integrity

import { PrismaClient } from '@prisma/client';

export interface SettleSwapResult {
  success: boolean;
  message: string;
  alreadySettled?: boolean;
  requesterBalance?: number;
  providerBalance?: number;
  creditsTransferred?: number;
}

/**
 * Executes atomic credit settlement for a completed skill swap.
 * Guarantees:
 * 1. Idempotency - double execution will never result in multiple deductions or credits.
 * 2. Atomicity - both debit and credit succeed together or roll back entirely.
 * 3. Sufficient funds check - learner must have at least the agreed credit balance.
 * 4. Immutable ledger entries created with unique idempotency keys.
 */
export async function settleCompletedSwap(
  swapId: string,
  txClient: PrismaClient
): Promise<SettleSwapResult> {
  // Use interactive transaction
  return await txClient.$transaction(async (tx) => {
    // 1. Fetch swap
    const swap = await tx.swap.findUnique({
      where: { id: swapId },
      include: {
        requester: true,
        provider: true,
      },
    });

    if (!swap) {
      return { success: false, message: 'Swap not found.' };
    }

    // 2. Check if already settled (Idempotency control)
    if (swap.settlementState === 'SETTLED') {
      return {
        success: true,
        alreadySettled: true,
        message: 'This swap has already been settled previously.',
        creditsTransferred: swap.agreedCredits,
      };
    }

    // 3. Ensure both participants approved completion
    if (!swap.requesterCompleted || !swap.providerCompleted) {
      return {
        success: false,
        message: 'Both participants must confirm session completion before credits can be settled.',
      };
    }

    const credits = swap.agreedCredits;
    const learner = swap.requester;
    const provider = swap.provider;

    // 4. Verify learner balance
    if (learner.creditBalance < credits) {
      // Mark as disputed/insufficient funds
      await tx.swap.update({
        where: { id: swapId },
        data: { settlementState: 'DISPUTED' },
      });

      return {
        success: false,
        message: `Learner has insufficient credits (${learner.creditBalance.toFixed(2)} available, ${credits.toFixed(2)} required). Transaction awaiting resolution.`,
      };
    }

    const newLearnerBalance = Number((learner.creditBalance - credits).toFixed(2));
    const newProviderBalance = Number((provider.creditBalance + credits).toFixed(2));

    // 5. Atomic balance updates
    await tx.user.update({
      where: { id: learner.id },
      data: {
        creditBalance: newLearnerBalance,
        totalCreditsSpent: Number((learner.totalCreditsSpent + credits).toFixed(2)),
      },
    });

    await tx.user.update({
      where: { id: provider.id },
      data: {
        creditBalance: newProviderBalance,
        totalCreditsEarned: Number((provider.totalCreditsEarned + credits).toFixed(2)),
      },
    });

    // 6. Create immutable ledger transactions with unique idempotency keys
    const learnerTxKey = `settle-${swapId}-requester-debit`;
    const providerTxKey = `settle-${swapId}-provider-credit`;

    await tx.creditTransaction.create({
      data: {
        userId: learner.id,
        swapId: swap.id,
        type: 'SPENT',
        amount: -credits,
        balanceAfter: newLearnerBalance,
        description: `Spent ${credits} credits for learning session with ${provider.name}`,
        idempotencyKey: learnerTxKey,
      },
    });

    await tx.creditTransaction.create({
      data: {
        userId: provider.id,
        swapId: swap.id,
        type: 'EARNED',
        amount: credits,
        balanceAfter: newProviderBalance,
        description: `Earned ${credits} credits for teaching session to ${learner.name}`,
        idempotencyKey: providerTxKey,
      },
    });

    // 7. Update Swap status
    await tx.swap.update({
      where: { id: swapId },
      data: {
        status: 'COMPLETED',
        settlementState: 'SETTLED',
      },
    });

    // 8. Generate in-app notifications
    await tx.notification.createMany({
      data: [
        {
          userId: learner.id,
          eventType: 'CREDITS_SPENT',
          title: 'Credits Transferred',
          content: `${credits} skill credits have been debited for your completed session. Your new balance is ${newLearnerBalance.toFixed(2)}.`,
          link: `/dashboard/wallet`,
        },
        {
          userId: provider.id,
          eventType: 'CREDITS_EARNED',
          title: 'Credits Earned!',
          content: `You earned ${credits} skill credits for sharing your knowledge! Your new balance is ${newProviderBalance.toFixed(2)}.`,
          link: `/dashboard/wallet`,
        },
      ],
    });

    return {
      success: true,
      message: `Successfully settled ${credits} credits between ${learner.name} and ${provider.name}.`,
      requesterBalance: newLearnerBalance,
      providerBalance: newProviderBalance,
      creditsTransferred: credits,
    };
  });
}
