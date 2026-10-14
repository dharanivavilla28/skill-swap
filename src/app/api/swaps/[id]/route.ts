import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { validateStateTransition, SwapStatus } from '@/features/swaps/lifecycle';
import { settleCompletedSwap } from '@/features/wallet/ledger';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;
    const swap = await prisma.swap.findUnique({
      where: { id },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarInitial: true,
            college: true,
            course: true,
            year: true,
            bio: true,
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
            year: true,
            bio: true,
          },
        },
        skill: true,
        ratings: {
          include: {
            reviewer: {
              select: { id: true, name: true, avatarInitial: true },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
              select: { id: true, name: true, avatarInitial: true },
            },
          },
        },
      },
    });

    if (!swap) {
      return NextResponse.json({ error: 'Swap not found' }, { status: 404 });
    }

    // Authorization check: participant only
    if (swap.requesterId !== user.id && swap.providerId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to view this swap transaction' },
        { status: 403 }
      );
    }

    return NextResponse.json({ swap });
  } catch (error) {
    console.error('Failed to get swap:', error);
    return NextResponse.json({ error: 'Failed to retrieve swap' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;
    const swap = await prisma.swap.findUnique({
      where: { id },
      include: { requester: true, provider: true, skill: true },
    });

    if (!swap) {
      return NextResponse.json({ error: 'Swap not found' }, { status: 404 });
    }

    const isRequester = swap.requesterId === user.id;
    const isProvider = swap.providerId === user.id;

    if (!isRequester && !isProvider) {
      return NextResponse.json(
        { error: 'Unauthorized. You are not a participant in this swap.' },
        { status: 403 }
      );
    }

    const role = isRequester ? 'REQUESTER' : 'PROVIDER';
    const body = await request.json();
    const { action, agreedTime } = body;

    let targetStatus: SwapStatus = swap.status as SwapStatus;

    if (action === 'ACCEPT') {
      targetStatus = 'ACCEPTED';
    } else if (action === 'DECLINE') {
      targetStatus = 'DECLINED';
    } else if (action === 'SCHEDULE') {
      targetStatus = 'SCHEDULED';
    } else if (action === 'START') {
      targetStatus = 'IN_PROGRESS';
    } else if (action === 'CANCEL') {
      targetStatus = 'CANCELLED';
    } else if (action === 'CONFIRM_COMPLETION') {
      // Handled specifically below
    } else {
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    // 1. Handle CONFIRM_COMPLETION
    if (action === 'CONFIRM_COMPLETION') {
      if (swap.status !== 'IN_PROGRESS' && swap.status !== 'SCHEDULED' && swap.status !== 'ACCEPTED') {
        return NextResponse.json(
          { error: `Cannot complete a session that is currently ${swap.status}.` },
          { status: 400 }
        );
      }

      const updateData: any = {};
      if (isRequester) updateData.requesterCompleted = true;
      if (isProvider) updateData.providerCompleted = true;

      // Update approval
      const updatedSwap = await prisma.swap.update({
        where: { id },
        data: updateData,
      });

      // Check if both have completed now
      const bothDone =
        (isRequester ? true : updatedSwap.requesterCompleted) &&
        (isProvider ? true : updatedSwap.providerCompleted);

      if (bothDone) {
        // Trigger atomic credit settlement
        const settlementResult = await settleCompletedSwap(swap.id, prisma);
        if (!settlementResult.success) {
          return NextResponse.json(
            { error: settlementResult.message, swap: updatedSwap },
            { status: 400 }
          );
        }

        const finalSwap = await prisma.swap.findUnique({
          where: { id },
          include: { requester: true, provider: true, skill: true },
        });

        return NextResponse.json({
          success: true,
          message: 'Session completed and credits settled atomically!',
          settled: true,
          swap: finalSwap,
        });
      }

      // One participant approved, awaiting the other
      const partnerName = isRequester ? swap.provider.name : swap.requester.name;
      const partnerId = isRequester ? swap.provider.id : swap.requester.id;

      await prisma.notification.create({
        data: {
          userId: partnerId,
          eventType: 'SESSION_COMPLETED',
          title: 'Completion Confirmation Requested',
          content: `${user.name} marked your session as completed. Please confirm to finalize and transfer credits.`,
          link: `/sessions`,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Your completion confirmation is recorded. Awaiting confirmation from ${partnerName}.`,
        settled: false,
        swap: updatedSwap,
      });
    }

    // 2. Validate state transition for other actions
    const validation = validateStateTransition(swap.status as SwapStatus, targetStatus, role);
    if (!validation.allowed) {
      return NextResponse.json({ error: validation.reason }, { status: 400 });
    }

    const updatePayload: any = { status: targetStatus };
    if (agreedTime) {
      updatePayload.agreedTime = agreedTime;
    }

    const updatedSwap = await prisma.swap.update({
      where: { id },
      data: updatePayload,
      include: { requester: true, provider: true, skill: true },
    });

    // Notify partner of status change
    const partnerId = isRequester ? swap.provider.id : swap.requester.id;
    let notifTitle = 'Swap Update';
    let notifContent = `${user.name} updated the status of your swap to ${targetStatus}.`;

    if (targetStatus === 'ACCEPTED') {
      notifTitle = 'Session Request Accepted!';
      notifContent = `${user.name} accepted your request to learn ${swap.skill.canonicalName}. Coordinate a time to meet!`;
    } else if (targetStatus === 'DECLINED') {
      notifTitle = 'Session Request Declined';
      notifContent = `${user.name} was unable to accept your request at this time.`;
    } else if (targetStatus === 'SCHEDULED') {
      notifTitle = 'Session Time Agreed!';
      notifContent = `Your session for ${swap.skill.canonicalName} has been agreed for ${agreedTime || 'the scheduled time'}.`;
    }

    await prisma.notification.create({
      data: {
        userId: partnerId,
        eventType:
          targetStatus === 'ACCEPTED'
            ? 'REQUEST_ACCEPTED'
            : targetStatus === 'DECLINED'
            ? 'REQUEST_DECLINED'
            : 'SESSION_SCHEDULED',
        title: notifTitle,
        content: notifContent,
        link: `/sessions`,
      },
    });

    return NextResponse.json({ success: true, swap: updatedSwap });
  } catch (error) {
    console.error('Failed to update swap:', error);
    return NextResponse.json({ error: 'Failed to process swap update' }, { status: 500 });
  }
}
