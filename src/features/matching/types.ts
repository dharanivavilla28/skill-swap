// SkillSwap Matching Types & Contracts

export type SkillProficiency = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
export type SkillCategory = 'TECHNOLOGY' | 'DESIGN' | 'CAREER' | 'BUSINESS' | 'CREATIVE' | 'OTHER';
export type SessionFormat = 'ONLINE' | 'IN_PERSON' | 'BOTH';
export type VerificationStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED';

export interface AvailabilitySlot {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  time: 'Morning' | 'Afternoon' | 'Evening'; // Morning (9-12), Afternoon (12-5), Evening (5-9)
}

export interface ProviderProfileForMatching {
  id: string;
  name: string;
  avatarInitial?: string | null;
  college: string;
  course?: string | null;
  year?: string | null;
  bio?: string | null;
  interests?: string[] | null;
  availability: AvailabilitySlot[];
  preferredFormat: SessionFormat;
  verificationStatus: VerificationStatus;
  
  // Offered skills
  offeredSkills: {
    skillId: string;
    canonicalName: string;
    category: SkillCategory;
    proficiency: SkillProficiency;
    description?: string | null;
  }[];

  // Track record & metrics
  averageRating: number | null; // e.g. 4.8 or null if no reviews
  reviewCount: number;
  completedSwapsCount: number;
  totalInitiatedSwapsCount: number;
  recordedAverageResponseMinutes?: number | null; // null if no data
}

export interface MatchQuery {
  learnerId?: string;
  targetSkillName: string;
  targetCategory?: SkillCategory;
  desiredProficiency?: SkillProficiency;
  preferredFormat?: SessionFormat;
  availabilitySlots?: AvailabilitySlot[];
  interests?: string[];
  maxResults?: number;
}

export interface ScoreBreakdown {
  skillRelevance: number; // 0 - 40
  ratingScore: number;     // 0 - 25
  availabilityScore: number; // 0 - 15
  trustScore: number;      // 0 - 10
  responseScore: number;   // 0 - 10
  totalScore: number;      // 0 - 100
}

export interface MatchExplanation {
  overallSummary: string;
  matchType: 'EXACT' | 'RELATED' | 'CATEGORY_FALLBACK';
  skillDetail: string;
  levelCompatibility: string;
  availabilityDetail: string;
  trustDetail: string;
  formatCompatibility: string;
}

export interface MatchResult {
  provider: ProviderProfileForMatching;
  matchedSkill: {
    skillId: string;
    canonicalName: string;
    category: SkillCategory;
    proficiency: SkillProficiency;
    isExact: boolean;
  };
  scores: ScoreBreakdown;
  explanation: MatchExplanation;
  isNewUserWithLimitedHistory: boolean;
}
