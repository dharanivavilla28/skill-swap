import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase().trim() || '';
    const category = searchParams.get('category')?.trim() || '';
    const proficiency = searchParams.get('proficiency')?.trim() || '';
    const format = searchParams.get('format')?.trim() || '';
    const day = searchParams.get('day')?.trim() || '';
    const sortBy = searchParams.get('sortBy') || 'rating'; // 'rating', 'swaps', 'newest'

    const currentUser = await getCurrentUser();

    // Fetch users who offer skills
    const users = await prisma.user.findMany({
      where: {
        id: currentUser ? { not: currentUser.id } : undefined,
        ...(format && format !== 'ALL'
          ? {
              OR: [{ preferredFormat: format }, { preferredFormat: 'BOTH' }],
            }
          : {}),
      },
      include: {
        userSkills: {
          where: {
            isActive: true,
          },
          include: {
            skill: true,
          },
        },
        receivedRatings: {
          select: {
            score: true,
            reviewText: true,
          },
        },
        providedSwaps: {
          where: {
            status: 'COMPLETED',
          },
          select: {
            id: true,
          },
        },
      },
    });

    // Format & filter peers in application logic
    let peerResults = users.map((u) => {
      const offeredSkills = u.userSkills.filter((us) => us.type === 'OFFERED');
      const wantedSkills = u.userSkills.filter((us) => us.type === 'WANTED');

      // Calculate rating
      const reviews = u.receivedRatings;
      const reviewCount = reviews.length;
      const averageRating =
        reviewCount > 0
          ? Number((reviews.reduce((acc, r) => acc + r.score, 0) / reviewCount).toFixed(1))
          : null;

      const completedSwapsCount = u.providedSwaps.length;

      let availability: any[] = [];
      try {
        if (u.availabilityJson) {
          availability = JSON.parse(u.availabilityJson);
        }
      } catch {
        availability = [];
      }

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        college: u.college,
        course: u.course,
        year: u.year,
        bio: u.bio,
        interests: u.interests ? u.interests.split(',').map((i) => i.trim()) : [],
        avatarInitial: u.avatarInitial,
        preferredFormat: u.preferredFormat,
        verificationStatus: u.verificationStatus,
        trustScore: u.trustScore,
        availability,
        offeredSkills: offeredSkills.map((os) => ({
          id: os.id,
          skillId: os.skill.id,
          name: os.skill.canonicalName,
          category: os.skill.category,
          proficiency: os.proficiency,
          description: os.description,
          skill: {
            id: os.skill.id,
            canonicalName: os.skill.canonicalName,
            category: os.skill.category,
            description: os.skill.description,
          },
        })),
        wantedSkills: wantedSkills.map((ws) => ({
          id: ws.id,
          skillId: ws.skill.id,
          name: ws.skill.canonicalName,
          category: ws.skill.category,
          proficiency: ws.proficiency,
          skill: {
            id: ws.skill.id,
            canonicalName: ws.skill.canonicalName,
            category: ws.skill.category,
            description: ws.skill.description,
          },
        })),
        averageRating,
        reviewCount,
        completedSwapsCount,
      };
    });

    // Apply filtering
    if (search) {
      peerResults = peerResults.filter((p) => {
        const matchesName = p.name.toLowerCase().includes(search);
        const matchesCourse = p.course?.toLowerCase().includes(search);
        const matchesSkill = p.offeredSkills.some((s) =>
          s.name.toLowerCase().includes(search)
        );
        return matchesName || matchesCourse || matchesSkill;
      });
    }

    if (category && category !== 'ALL') {
      peerResults = peerResults.filter((p) =>
        p.offeredSkills.some((s) => s.category.toUpperCase() === category.toUpperCase())
      );
    }

    if (proficiency && proficiency !== 'ALL') {
      peerResults = peerResults.filter((p) =>
        p.offeredSkills.some((s) => s.proficiency.toUpperCase() === proficiency.toUpperCase())
      );
    }

    if (day && day !== 'ALL') {
      peerResults = peerResults.filter((p) =>
        p.availability.some((a: any) => a.day.toLowerCase() === day.toLowerCase())
      );
    }

    // Apply sorting
    if (sortBy === 'rating') {
      peerResults.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    } else if (sortBy === 'swaps') {
      peerResults.sort((a, b) => b.completedSwapsCount - a.completedSwapsCount);
    }

    return NextResponse.json({ peers: peerResults });
  } catch (error) {
    console.error('Failed to search peers:', error);
    return NextResponse.json({ error: 'Failed to search peers' }, { status: 500 });
  }
}
