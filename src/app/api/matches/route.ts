import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { findTopMatches } from '@/features/matching/matching-engine';
import { ProviderProfileForMatching, MatchQuery, AvailabilitySlot } from '@/features/matching/types';

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    const body = await request.json();

    const {
      targetSkillName,
      targetCategory,
      desiredProficiency,
      preferredFormat,
      availabilitySlots,
    } = body;

    if (!targetSkillName || typeof targetSkillName !== 'string') {
      return NextResponse.json(
        { error: 'Target skill name is required for matching' },
        { status: 400 }
      );
    }

    // 1. Fetch potential peer providers from database
    const users = await prisma.user.findMany({
      where: {
        id: currentUser ? { not: currentUser.id } : undefined,
      },
      include: {
        userSkills: {
          where: {
            type: 'OFFERED',
            isActive: true,
          },
          include: {
            skill: true,
          },
        },
        receivedRatings: {
          select: { score: true },
        },
        providedSwaps: {
          select: { status: true },
        },
      },
    });

    // 2. Transform into ProviderProfileForMatching
    const providers: ProviderProfileForMatching[] = users.map((u) => {
      const reviews = u.receivedRatings;
      const reviewCount = reviews.length;
      const averageRating =
        reviewCount > 0
          ? Number((reviews.reduce((acc, r) => acc + r.score, 0) / reviewCount).toFixed(1))
          : null;

      const completedSwapsCount = u.providedSwaps.filter((s) => s.status === 'COMPLETED').length;
      const totalInitiatedSwapsCount = u.providedSwaps.length;

      let availability: AvailabilitySlot[] = [];
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
        avatarInitial: u.avatarInitial,
        college: u.college,
        course: u.course,
        year: u.year,
        bio: u.bio,
        interests: u.interests ? u.interests.split(',').map((i) => i.trim()) : [],
        availability,
        preferredFormat: u.preferredFormat as any,
        verificationStatus: u.verificationStatus as any,
        offeredSkills: u.userSkills.map((us) => ({
          skillId: us.skill.id,
          canonicalName: us.skill.canonicalName,
          category: us.skill.category as any,
          proficiency: us.proficiency as any,
          description: us.description,
        })),
        averageRating,
        reviewCount,
        completedSwapsCount,
        totalInitiatedSwapsCount,
        recordedAverageResponseMinutes: completedSwapsCount > 3 ? 45 : null,
      };
    });

    // 3. User availability if not provided in body
    let userSlots: AvailabilitySlot[] | undefined = availabilitySlots;
    if (!userSlots && currentUser?.availabilityJson) {
      try {
        userSlots = JSON.parse(currentUser.availabilityJson);
      } catch {
        userSlots = undefined;
      }
    }

    const query: MatchQuery = {
      learnerId: currentUser?.id,
      targetSkillName,
      targetCategory: targetCategory || undefined,
      desiredProficiency: desiredProficiency || 'BEGINNER',
      preferredFormat: preferredFormat || 'BOTH',
      availabilitySlots: userSlots,
      interests: currentUser?.interests ? currentUser.interests.split(',').map((i) => i.trim()) : [],
      maxResults: 5,
    };

    // 4. Run deterministic matching engine
    const matchResults = findTopMatches(providers, query);

    const transformedMatches = matchResults.matches.map((m) => {
      const reasons = [
        m.explanation.overallSummary,
        m.explanation.skillDetail,
        m.explanation.availabilityDetail,
        m.explanation.trustDetail,
      ].filter(Boolean);

      return {
        ...m,
        providerId: m.provider.id,
        name: m.provider.name,
        college: m.provider.college,
        course: m.provider.course || undefined,
        avatarInitial: m.provider.avatarInitial || undefined,
        trustScore: (m.scores.trustScore ?? 5) / 10,
        compositeScore: (m.scores.totalScore ?? 0) / 100,
        breakdown: {
          skillScore: (m.scores.skillRelevance ?? 0) / 40,
          availabilityScore: (m.scores.availabilityScore ?? 0) / 15,
          ratingExperienceScore: (m.scores.ratingScore ?? 0) / 25,
          campusTrustScore: (m.scores.trustScore ?? 0) / 10,
        },
        reasons: reasons.length > 0 ? reasons : [m.explanation.overallSummary],
        matchedSkillName: m.matchedSkill.canonicalName,
        matchedSkillProficiency: m.matchedSkill.proficiency,
        averageRating: m.provider.averageRating,
        reviewCount: m.provider.reviewCount,
        completedSwapsCount: m.provider.completedSwapsCount,
        preferredFormat: m.provider.preferredFormat,
        matchingAvailability: m.provider.availability || [],
      };
    });

    return NextResponse.json({
      success: true,
      query: {
        targetSkillName,
        targetCategory,
      },
      matches: transformedMatches,
      hasExactMatch: matchResults.hasExactMatch,
      relatedCategorySuggestions: matchResults.relatedCategorySuggestions,
    });
  } catch (error) {
    console.error('Match engine execution failed:', error);
    return NextResponse.json({ error: 'Matching engine failed to process request' }, { status: 500 });
  }
}
