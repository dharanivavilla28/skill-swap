import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';

export async function GET() {
  try {
    const skills = await prisma.skill.findMany({
      orderBy: { canonicalName: 'asc' },
      include: {
        _count: {
          select: { userSkills: true },
        },
      },
    });

    return NextResponse.json({ skills });
  } catch (error) {
    console.error('Failed to fetch skills:', error);
    return NextResponse.json({ error: 'Failed to fetch skills' }, { status: 500 });
  }
}

const createSkillSchema = z.object({
  canonicalName: z.string().min(2, 'Skill name must be at least 2 characters'),
  category: z.enum(['TECHNOLOGY', 'DESIGN', 'CAREER', 'BUSINESS', 'CREATIVE', 'OTHER']),
  description: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createSkillSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const { canonicalName, category, description } = parsed.data;

    // Check if skill already exists (case-insensitive)
    const existing = await prisma.skill.findFirst({
      where: {
        canonicalName: {
          equals: canonicalName.trim(),
        },
      },
    });

    if (existing) {
      return NextResponse.json({ skill: existing });
    }

    const newSkill = await prisma.skill.create({
      data: {
        canonicalName: canonicalName.trim(),
        category,
        description: description || null,
      },
    });

    return NextResponse.json({ skill: newSkill }, { status: 201 });
  } catch (error) {
    console.error('Failed to create skill:', error);
    return NextResponse.json({ error: 'Failed to create skill' }, { status: 500 });
  }
}
