// SkillSwap Transparent, Trust-Aware Matching Engine
// Specification-defined deterministic scoring model

import {
  AvailabilitySlot,
  MatchExplanation,
  MatchQuery,
  MatchResult,
  ProviderProfileForMatching,
  ScoreBreakdown,
  SkillCategory,
  SkillProficiency
} from './types';

// Map of canonical skill relatedness within same or adjacent domains
const RELATED_SKILLS_MAP: Record<string, string[]> = {
  'python': ['data analysis', 'excel', 'web development', 'java', 'c++'],
  'web development': ['figma', 'ui/ux', 'canva', 'python'],
  'figma': ['ui/ux', 'canva', 'poster design', 'web development'],
  'ui/ux': ['figma', 'canva', 'web development', 'presentation storytelling'],
  'canva': ['poster design', 'figma', 'presentation storytelling', 'content creation'],
  'excel': ['data analysis', 'data visualization', 'finance basics', 'python'],
  'data analysis': ['excel', 'python', 'data visualization'],
  'public speaking': ['interview preparation', 'presentation storytelling', 'linkedin'],
  'interview preparation': ['resume review', 'public speaking', 'linkedin'],
  'resume review': ['interview preparation', 'linkedin', 'writing'],
  'video editing': ['content creation', 'photography', 'canva'],
};

/**
 * Calculates normalized trust score:
 * Formula: T = 0.4R + 0.3C + 0.2V + 0.1N
 * Every component is strictly normalized to [0, 1].
 */
export function calculateTrustScore(profile: ProviderProfileForMatching): {
  normalizedTrust: number;
  trustPoints: number;
  isNewUser: boolean;
  explanation: string;
} {
  const isNewUser = profile.completedSwapsCount < 2 && profile.reviewCount < 2;

  // R = normalized average rating (0 to 1). If no reviews yet, use neutral 0.6
  const R = profile.averageRating != null ? Math.min(Math.max(profile.averageRating / 5, 0), 1) : 0.6;

  // C = completion rate from recorded swaps. If no swaps yet, use neutral 0.7
  const C = profile.totalInitiatedSwapsCount > 0
    ? Math.min(Math.max(profile.completedSwapsCount / profile.totalInitiatedSwapsCount, 0), 1)
    : 0.7;

  // V = normalized verification level
  let V = 0.2; // UNVERIFIED base
  if (profile.verificationStatus === 'VERIFIED') {
    V = 1.0;
  } else if (profile.verificationStatus === 'PENDING') {
    V = 0.5;
  }

  // N = normalized completed-exchange count (10+ completed swaps reaches 1.0)
  const N = Math.min(profile.completedSwapsCount / 10, 1.0);

  // Compute composite trust
  const normalizedTrust = Number((0.4 * R + 0.3 * C + 0.2 * V + 0.1 * N).toFixed(3));
  // Trust contributes up to 10 points
  const trustPoints = Number((normalizedTrust * 10).toFixed(1));

  let explanation = '';
  if (isNewUser) {
    explanation = 'New student with limited exchange history; standard campus baseline applied.';
  } else {
    explanation = `Trust index ${(normalizedTrust * 100).toFixed(0)}% based on ${profile.completedSwapsCount} completed swaps, ${profile.reviewCount} reviews, and ${profile.verificationStatus.toLowerCase()} status.`;
  }

  return { normalizedTrust, trustPoints, isNewUser, explanation };
}

/**
 * Calculates rating score out of 25:
 * ratingScore = (averageRating / 5) * 25
 */
export function calculateRatingScore(profile: ProviderProfileForMatching): {
  ratingScore: number;
  explanation: string;
} {
  if (profile.averageRating == null || profile.reviewCount === 0) {
    // Neutral fallback for new peer (15 out of 25, equivalent to 3.0 baseline)
    return {
      ratingScore: 15.0,
      explanation: 'No reviews yet. Displaying neutral baseline.'
    };
  }

  const normalized = Math.min(Math.max(profile.averageRating / 5, 0), 1);
  const ratingScore = Number((normalized * 25).toFixed(1));
  const explanation = `${profile.averageRating.toFixed(1)} / 5.0 across ${profile.reviewCount} ${profile.reviewCount === 1 ? 'review' : 'reviews'}`;
  return { ratingScore, explanation };
}

/**
 * Calculates availability overlap score out of 15:
 * overlapScore = min(overlapCount / maxExpectedOverlap, 1) * 15
 */
export function calculateAvailabilityScore(
  providerSlots: AvailabilitySlot[],
  learnerSlots?: AvailabilitySlot[]
): {
  availabilityScore: number;
  overlapCount: number;
  overlappingSlots: string[];
  explanation: string;
} {
  if (!learnerSlots || learnerSlots.length === 0) {
    // Learner has open availability or did not restrict
    return {
      availabilityScore: 12.0,
      overlapCount: providerSlots.length,
      overlappingSlots: providerSlots.map(s => `${s.day} ${s.time}`),
      explanation: 'Flexible schedule with mutual availability'
    };
  }

  const overlapping: string[] = [];
  for (const lSlot of learnerSlots) {
    const match = providerSlots.find(
      p => p.day.toLowerCase() === lSlot.day.toLowerCase() && p.time.toLowerCase() === lSlot.time.toLowerCase()
    );
    if (match) {
      overlapping.push(`${match.day} ${match.time}`);
    }
  }

  const overlapCount = overlapping.length;
  // If at least 3 matching slots exist, learner receives max 15 points
  const maxExpectedOverlap = 3;
  const ratio = Math.min(overlapCount / maxExpectedOverlap, 1.0);
  const availabilityScore = Number((ratio * 15).toFixed(1));

  const explanation = overlapCount > 0
    ? `Matches on ${overlapping.slice(0, 2).join(', ')}${overlapping.length > 2 ? ` (+${overlapping.length - 2} more)` : ''}`
    : 'Limited schedule overlap; asynchronous or flexible times can be requested';

  return { availabilityScore, overlapCount, overlappingSlots: overlapping, explanation };
}

/**
 * Calculates response behaviour score out of 10 based on recorded average response time:
 * < 1 hr (<=60m) = 10 pts
 * 1-4 hrs (<=240m) = 8 pts
 * 4-12 hrs (<=720m) = 6 pts
 * 12-24 hrs (<=1440m) = 4 pts
 * Fallback / new user = 7 pts (neutral documented fallback)
 */
export function calculateResponseScore(recordedMinutes?: number | null): {
  responseScore: number;
  explanation: string;
} {
  if (recordedMinutes == null) {
    return {
      responseScore: 7.0,
      explanation: 'Standard campus response estimate (typically within a few hours)'
    };
  }

  if (recordedMinutes <= 60) {
    return { responseScore: 10.0, explanation: 'Typically replies in under 1 hour' };
  }
  if (recordedMinutes <= 240) {
    return { responseScore: 8.0, explanation: 'Typically replies within 1–4 hours' };
  }
  if (recordedMinutes <= 720) {
    return { responseScore: 6.0, explanation: 'Typically replies within half a day' };
  }
  return { responseScore: 4.0, explanation: 'Typically replies within 24 hours' };
}

/**
 * Calculates skill relevance score out of 40 points:
 * - Exact skill match: up to 40 pts
 * - Related skill / category fallback: 20-25 pts
 * - Level compatibility bonus/penalty
 * - Shared interests bonus
 */
export function calculateSkillRelevance(
  offeredSkill: {
    canonicalName: string;
    category: SkillCategory;
    proficiency: SkillProficiency;
  },
  targetSkillName: string,
  targetCategory?: SkillCategory,
  desiredProficiency?: SkillProficiency,
  sharedInterestsCount = 0
): {
  relevanceScore: number;
  matchType: 'EXACT' | 'RELATED' | 'CATEGORY_FALLBACK';
  levelExplanation: string;
} {
  const normOffered = offeredSkill.canonicalName.trim().toLowerCase();
  const normTarget = targetSkillName.trim().toLowerCase();

  const isExact = normOffered === normTarget || normOffered.includes(normTarget) || normTarget.includes(normOffered);

  const relatedList = RELATED_SKILLS_MAP[normTarget] || [];
  const isRelated = !isExact && (
    relatedList.some(r => normOffered.includes(r) || r.includes(normOffered)) ||
    (targetCategory && offeredSkill.category === targetCategory)
  );

  let base = 0;
  let matchType: 'EXACT' | 'RELATED' | 'CATEGORY_FALLBACK' = 'CATEGORY_FALLBACK';

  if (isExact) {
    base = 35;
    matchType = 'EXACT';
  } else if (isRelated) {
    base = 22;
    matchType = 'RELATED';
  } else if (targetCategory && offeredSkill.category === targetCategory) {
    base = 16;
    matchType = 'CATEGORY_FALLBACK';
  } else {
    base = 0;
  }

  // Proficiency comparison
  const levelOrder: Record<SkillProficiency, number> = {
    BEGINNER: 1,
    INTERMEDIATE: 2,
    ADVANCED: 3,
    EXPERT: 4,
  };

  const offeredRank = levelOrder[offeredSkill.proficiency] || 2;
  const desiredRank = desiredProficiency ? levelOrder[desiredProficiency] : 1;

  let levelBonus = 0;
  let levelExplanation = '';

  if (offeredRank >= desiredRank) {
    levelBonus = 3;
    levelExplanation = `${offeredSkill.proficiency.toLowerCase()} level matches or exceeds desired target`;
  } else {
    levelBonus = 0;
    levelExplanation = `Self-reported ${offeredSkill.proficiency.toLowerCase()} level`;
  }

  // Shared interests bonus (up to 2 points)
  const interestBonus = Math.min(sharedInterestsCount * 1.0, 2.0);

  const relevanceScore = Math.min(Math.max(base + levelBonus + interestBonus, 0), 40);

  return {
    relevanceScore: Number(relevanceScore.toFixed(1)),
    matchType,
    levelExplanation
  };
}

/**
 * Evaluates a single provider for a target skill query and returns the scored result.
 */
export function scoreProviderForQuery(
  provider: ProviderProfileForMatching,
  query: MatchQuery
): MatchResult | null {
  // Check if provider offers the exact or related skill
  let bestOfferedSkill: ProviderProfileForMatching['offeredSkills'][0] | null = null;
  let bestRelevanceResult: ReturnType<typeof calculateSkillRelevance> | null = null;

  for (const offered of provider.offeredSkills) {
    // Count shared interests
    let sharedInterestsCount = 0;
    if (query.interests && provider.interests) {
      sharedInterestsCount = provider.interests.filter(i =>
        query.interests!.some(qi => qi.toLowerCase() === i.toLowerCase())
      ).length;
    }

    const rel = calculateSkillRelevance(
      offered,
      query.targetSkillName,
      query.targetCategory,
      query.desiredProficiency,
      sharedInterestsCount
    );

    if (rel.relevanceScore > 0) {
      if (!bestRelevanceResult || rel.relevanceScore > bestRelevanceResult.relevanceScore) {
        bestRelevanceResult = rel;
        bestOfferedSkill = offered;
      }
    }
  }

  if (!bestOfferedSkill || !bestRelevanceResult) {
    return null; // No relevant skill offered by this provider
  }

  // Calculate component scores
  const ratingRes = calculateRatingScore(provider);
  const availRes = calculateAvailabilityScore(provider.availability, query.availabilitySlots);
  const trustRes = calculateTrustScore(provider);
  const respRes = calculateResponseScore(provider.recordedAverageResponseMinutes);

  // Format compatibility check
  let formatCompat = 'Compatible format';
  if (query.preferredFormat && query.preferredFormat !== 'BOTH' && provider.preferredFormat !== 'BOTH') {
    if (query.preferredFormat !== provider.preferredFormat) {
      formatCompat = `Prefers ${provider.preferredFormat.toLowerCase().replace('_', '-')}, but open to discussion`;
    }
  }

  const totalScore = Number((
    bestRelevanceResult.relevanceScore +
    ratingRes.ratingScore +
    availRes.availabilityScore +
    trustRes.trustPoints +
    respRes.responseScore
  ).toFixed(1));

  const breakdown: ScoreBreakdown = {
    skillRelevance: bestRelevanceResult.relevanceScore,
    ratingScore: ratingRes.ratingScore,
    availabilityScore: availRes.availabilityScore,
    trustScore: trustRes.trustPoints,
    responseScore: respRes.responseScore,
    totalScore
  };

  // Generate clear "Why this match?" narrative
  const matchDescriptor = bestRelevanceResult.matchType === 'EXACT'
    ? 'Strong exact skill match'
    : 'Related skill match in the same topic area';

  const summary = `${matchDescriptor} — offers ${bestOfferedSkill.canonicalName} (${bestOfferedSkill.proficiency.toLowerCase()}), ` +
    `${availRes.overlapCount > 0 ? availRes.explanation.toLowerCase() : 'flexible session times'}, and ${trustRes.explanation.toLowerCase()}`;

  const explanation: MatchExplanation = {
    overallSummary: summary,
    matchType: bestRelevanceResult.matchType,
    skillDetail: `${bestRelevanceResult.matchType === 'EXACT' ? 'Exact match' : 'Related skill'}: ${bestOfferedSkill.canonicalName} (${bestOfferedSkill.category})`,
    levelCompatibility: bestRelevanceResult.levelExplanation,
    availabilityDetail: availRes.explanation,
    trustDetail: trustRes.explanation,
    formatCompatibility: formatCompat
  };

  return {
    provider,
    matchedSkill: {
      skillId: bestOfferedSkill.skillId,
      canonicalName: bestOfferedSkill.canonicalName,
      category: bestOfferedSkill.category,
      proficiency: bestOfferedSkill.proficiency,
      isExact: bestRelevanceResult.matchType === 'EXACT'
    },
    scores: breakdown,
    explanation,
    isNewUserWithLimitedHistory: trustRes.isNewUser
  };
}

/**
 * Searches and ranks top peer matches for a student's request.
 * Returns up to maxResults (default: 5) sorted deterministically by totalScore.
 */
export function findTopMatches(
  providers: ProviderProfileForMatching[],
  query: MatchQuery
): {
  matches: MatchResult[];
  hasExactMatch: boolean;
  relatedCategorySuggestions: string[];
} {
  const maxResults = query.maxResults || 5;
  const scoredList: MatchResult[] = [];

  for (const provider of providers) {
    // Avoid matching self if learnerId provided
    if (query.learnerId && provider.id === query.learnerId) {
      continue;
    }

    const scored = scoreProviderForQuery(provider, query);
    if (scored) {
      scoredList.push(scored);
    }
  }

  // Sort descending by total score, secondary sort by exact match, tertiary by rating
  scoredList.sort((a, b) => {
    if (b.scores.totalScore !== a.scores.totalScore) {
      return b.scores.totalScore - a.scores.totalScore;
    }
    if (a.matchedSkill.isExact !== b.matchedSkill.isExact) {
      return a.matchedSkill.isExact ? -1 : 1;
    }
    return (b.provider.averageRating || 0) - (a.provider.averageRating || 0);
  });

  const matches = scoredList.slice(0, maxResults);
  const hasExactMatch = matches.some(m => m.matchedSkill.isExact);

  // Suggestions if no exact match
  const relatedCategorySuggestions: string[] = [];
  const normalizedTarget = query.targetSkillName.toLowerCase().trim();
  if (RELATED_SKILLS_MAP[normalizedTarget]) {
    relatedCategorySuggestions.push(...RELATED_SKILLS_MAP[normalizedTarget]);
  }

  return {
    matches,
    hasExactMatch,
    relatedCategorySuggestions
  };
}
