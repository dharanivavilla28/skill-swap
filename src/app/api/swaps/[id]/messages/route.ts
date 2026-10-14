import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

const messageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(2000),
});

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
      select: { requesterId: true, providerId: true },
    });

    if (!swap) {
      return NextResponse.json({ error: 'Swap not found' }, { status: 404 });
    }

    if (swap.requesterId !== user.id && swap.providerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to view messages' }, { status: 403 });
    }

    const messages = await prisma.message.findMany({
      where: { swapId: id },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: { id: true, name: true, avatarInitial: true },
        },
      },
    });

    // Mark messages sent to this user as read
    await prisma.message.updateMany({
      where: {
        swapId: id,
        recipientId: user.id,
        isRead: false,
      },
      data: { isRead: true },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Failed to get messages:', error);
    return NextResponse.json({ error: 'Failed to retrieve messages' }, { status: 500 });
  }
}

export async function POST(
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
      select: { requesterId: true, providerId: true },
    });

    if (!swap) {
      return NextResponse.json({ error: 'Swap not found' }, { status: 404 });
    }

    if (swap.requesterId !== user.id && swap.providerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to send message' }, { status: 403 });
    }

    const recipientId = swap.requesterId === user.id ? swap.providerId : swap.requesterId;
    const body = await request.json();
    const parsed = messageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: {
        swapId: id,
        senderId: user.id,
        recipientId,
        content: parsed.data.content.trim(),
        isRead: false,
      },
      include: {
        sender: {
          select: { id: true, name: true, avatarInitial: true },
        },
      },
    });

    return NextResponse.json({ success: true, message }, { status: 201 });
  } catch (error) {
    console.error('Failed to send message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
