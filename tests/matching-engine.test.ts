import { describe, it, expect } from 'vitest';
import {
  calculateTrustScore,
  calculateRatingScore,
  calculateAvailabilityScore,
  calculateResponseScore,
  calculateSkillRelevance,
  findTopMatches,
  scoreProviderForQuery
} from '../src/features/matching/matching-engine';
import { ProviderProfileForMatching, MatchQuery } from '../src/features/matching/types';

describe('SkillSwap Matching Engine & Trust Algorithm', () => {
  const mockExperiencedProvider: ProviderProfileForMatching = {
    id: 'user-exp-1',
    name: 'Sarah Chen',
    college: 'Metro State University',
    availability: [
      { day: 'Saturday', time: 'Morning' },
      { day: 'Tuesday', time: 'Evening' },
      { day: 'Thursday', time: 'Evening' },
    ],
    preferredFormat: 'BOTH',
    verificationStatus: 'VERIFIED',
    offeredSkills: [
      {
        skillId: 's-python',
        canonicalName: 'Python',
        category: 'TECHNOLOGY',
        proficiency: 'ADVANCED',
        description: 'Data analysis and scripting'
      }
    ],
    averageRating: 4.9,
    reviewCount: 12,
    completedSwapsCount: 15,
    totalInitiatedSwapsCount: 15,
    recordedAverageResponseMinutes: 45
  };

  const mockNewProvider: ProviderProfileForMatching = {
    id: 'user-new-2',
    name: 'Alex Rivera',
    college: 'Metro State University',
    availability: [
      { day: 'Saturday', time: 'Morning' }
    ],
    preferredFormat: 'ONLINE',
    verificationStatus: 'UNVERIFIED',
    offeredSkills: [
      {
        skillId: 's-python',
        canonicalName: 'Python',
        category: 'TECHNOLOGY',
        proficiency: 'INTERMEDIATE',
        description: 'Basic scripting and pandas'
      }
    ],
    averageRating: null,
    reviewCount: 0,
    completedSwapsCount: 0,
    totalInitiatedSwapsCount: 0,
    recordedAverageResponseMinutes: null
  };

  const mockRelatedProvider: ProviderProfileForMatching = {
    id: 'user-rel-3',
    name: 'Jordan Lee',
    college: 'Metro State University',
    availability: [
      { day: 'Saturday', time: 'Morning' }
    ],
    preferredFormat: 'ONLINE',
    verificationStatus: 'PENDING',
    offeredSkills: [
      {
        skillId: 's-excel',
        canonicalName: 'Excel',
        category: 'TECHNOLOGY',
        proficiency: 'ADVANCED',
        description: 'Formulas and data analysis'
      }
    ],
    averageRating: 4.5,
    reviewCount: 4,
    completedSwapsCount: 4,
    totalInitiatedSwapsCount: 5,
    recordedAverageResponseMinutes: 120
  };

  describe('Trust Score Calculation (T = 0.4R + 0.3C + 0.2V + 0.1N)', () => {
    it('normalizes verified experienced provider to high trust score', () => {
      const trust = calculateTrustScore(mockExperiencedProvider);
      expect(trust.isNewUser).toBe(false);
      expect(trust.normalizedTrust).toBeGreaterThan(0.8);
      expect(trust.trustPoints).toBeGreaterThan(8.0);
      expect(trust.trustPoints).toBeLessThanOrEqual(10.0);
    });

    it('handles new user with limited history without penalizing aggressively', () => {
      const trust = calculateNewUserTrust();
      expect(trust.isNewUser).toBe(true);
      expect(trust.explanation).toContain('New student with limited exchange history');
      expect(trust.trustPoints).toBeGreaterThan(3.0);
    });

    function calculateNewUserTrust() {
      return calculateTrustScore(mockNewProvider);
    }
  });

  describe('Rating Score Calculation (ratingScore = (R / 5) * 25)', () => {
    it('computes exact rating points for rated user', () => {
      const res = calculateRatingScore(mockExperiencedProvider);
      // 4.9 / 5.0 * 25 = 24.5
      expect(res.ratingScore).toBe(24.5);
      expect(res.explanation).toContain('4.9 / 5.0');
    });

    it('uses neutral documented baseline for unrated user', () => {
      const res = calculateRatingScore(mockNewProvider);
      expect(res.ratingScore).toBe(15.0);
      expect(res.explanation).toContain('No reviews yet');
    });
  });

  describe('Availability Overlap Scoring', () => {
    it('awards maximum points when learner has >= 3 matching slots', () => {
      const res = calculateAvailabilityScore(mockExperiencedProvider.availability, [
        { day: 'Saturday', time: 'Morning' },
        { day: 'Tuesday', time: 'Evening' },
        { day: 'Thursday', time: 'Evening' }
      ]);
      expect(res.overlapCount).toBe(3);
      expect(res.availabilityScore).toBe(15.0);
      expect(res.explanation).toContain('Matches on');
    });

    it('awards partial points for single overlapping slot', () => {
      const res = calculateAvailabilityScore(mockExperiencedProvider.availability, [
        { day: 'Saturday', time: 'Morning' },
        { day: 'Sunday', time: 'Evening' }
      ]);
      expect(res.overlapCount).toBe(1);
      expect(res.availabilityScore).toBe(5.0);
    });
  });

  describe('Response Behaviour Scoring', () => {
    it('awards 10 points for response under 1 hour', () => {
      const res = calculateResponseScore(45);
      expect(res.responseScore).toBe(10.0);
      expect(res.explanation).toContain('under 1 hour');
    });

    it('awards neutral 7 points for new provider with no response history', () => {
      const res = calculateResponseScore(null);
      expect(res.responseScore).toBe(7.0);
    });
  });

  describe('Skill Relevance & Matching Fallbacks', () => {
    it('awards exact match 35+ points for target skill Python', () => {
      const res = calculateSkillRelevance(
        mockExperiencedProvider.offeredSkills[0],
        'Python',
        'TECHNOLOGY',
        'BEGINNER'
      );
      expect(res.matchType).toBe('EXACT');
      expect(res.relevanceScore).toBeGreaterThanOrEqual(35);
    });

    it('ranks exact match higher than related skill match', () => {
      const exactScore = scoreProviderForQuery(mockExperiencedProvider, { targetSkillName: 'Python' });
      const relatedScore = scoreProviderForQuery(mockRelatedProvider, { targetSkillName: 'Python', targetCategory: 'TECHNOLOGY' });

      expect(exactScore).not.toBeNull();
      expect(relatedScore).not.toBeNull();
      expect(exactScore!.matchedSkill.isExact).toBe(true);
      expect(relatedScore!.matchedSkill.isExact).toBe(false);
      expect(exactScore!.scores.skillRelevance).toBeGreaterThan(relatedScore!.scores.skillRelevance);
    });

    it('ranks matches deterministically and provides "Why this match?" panel', () => {
      const query: MatchQuery = {
        targetSkillName: 'Python',
        availabilitySlots: [{ day: 'Saturday', time: 'Morning' }]
      };

      const result = findTopMatches([mockExperiencedProvider, mockNewProvider, mockRelatedProvider], query);
      expect(result.matches.length).toBeGreaterThan(0);
      expect(result.hasExactMatch).toBe(true);

      const top = result.matches[0];
      expect(top.explanation.overallSummary).toBeDefined();
      expect(top.explanation.skillDetail).toBeDefined();
      expect(top.explanation.levelCompatibility).toBeDefined();
      expect(top.explanation.availabilityDetail).toBeDefined();
      expect(top.scores.totalScore).toBeGreaterThan(0);
    });
  });
});
