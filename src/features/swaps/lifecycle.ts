// Swap Lifecycle State Machine & Duration Calculations

export type SwapStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'DECLINED'
  | 'CANCELLED'
  | 'DISPUTED';

export type UserSwapRole = 'REQUESTER' | 'PROVIDER' | 'ADMIN';

export interface StateTransitionResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Calculates internal credits based on qualifying duration:
 * 1 hour = 1.0 internal credit
 * 30 min = 0.5 credits
 * 45 min = 0.75 credits
 */
export function calculateCreditsForDuration(minutes: number): number {
  if (minutes <= 0) return 0;
  if (minutes === 30) return 0.5;
  if (minutes === 45) return 0.75;
  if (minutes === 60) return 1.0;
  return Number(((minutes / 60) * 1.0).toFixed(2));
}

/**
 * Validates whether a state transition is legal according to SkillSwap business rules.
 * Enforces role-based permissions and state machine integrity.
 */
export function validateStateTransition(
  currentStatus: SwapStatus,
  targetStatus: SwapStatus,
  role: UserSwapRole
): StateTransitionResult {
  // Cannot transition to self
  if (currentStatus === targetStatus) {
    return { allowed: false, reason: `Swap is already in ${currentStatus} status.` };
  }

  // Terminal states cannot be changed
  if (currentStatus === 'COMPLETED') {
    return { allowed: false, reason: 'Completed swaps are final and settled.' };
  }
  if (currentStatus === 'DECLINED') {
    return { allowed: false, reason: 'Declined swaps cannot be re-opened.' };
  }
  if (currentStatus === 'CANCELLED') {
    return { allowed: false, reason: 'Cancelled swaps cannot be re-opened.' };
  }

  switch (currentStatus) {
    case 'PENDING':
      if (targetStatus === 'ACCEPTED') {
        if (role !== 'PROVIDER' && role !== 'ADMIN') {
          return { allowed: false, reason: 'Only the skill provider can accept a session request.' };
        }
        return { allowed: true };
      }
      if (targetStatus === 'DECLINED') {
        if (role !== 'PROVIDER' && role !== 'ADMIN') {
          return { allowed: false, reason: 'Only the skill provider can decline a session request.' };
        }
        return { allowed: true };
      }
      if (targetStatus === 'CANCELLED') {
        // Either party can cancel a pending request
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: `Cannot jump from PENDING directly to ${targetStatus}. Must be ACCEPTED first.`,
      };

    case 'ACCEPTED':
      if (targetStatus === 'SCHEDULED') {
        return { allowed: true };
      }
      if (targetStatus === 'IN_PROGRESS') {
        return { allowed: true };
      }
      if (targetStatus === 'CANCELLED') {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: `Cannot transition from ACCEPTED to ${targetStatus}.`,
      };

    case 'SCHEDULED':
      if (targetStatus === 'IN_PROGRESS') {
        return { allowed: true };
      }
      if (targetStatus === 'CANCELLED') {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: `Cannot transition from SCHEDULED to ${targetStatus}. Must start session first.`,
      };

    case 'IN_PROGRESS':
      if (targetStatus === 'COMPLETED') {
        return { allowed: true };
      }
      if (targetStatus === 'DISPUTED') {
        return { allowed: true };
      }
      if (targetStatus === 'CANCELLED') {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: `Cannot transition from IN_PROGRESS to ${targetStatus}.`,
      };

    case 'DISPUTED':
      if (targetStatus === 'COMPLETED' || targetStatus === 'CANCELLED') {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: `Disputed session can only be settled as COMPLETED or CANCELLED upon resolution.`,
      };

    default:
      return { allowed: false, reason: `Unknown state ${currentStatus}` };
  }
}
