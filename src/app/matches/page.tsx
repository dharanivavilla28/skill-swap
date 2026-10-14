'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Zap,
  Star,
  CheckCircle2,
  Calendar,
  Clock,
  Coins,
  ArrowRight,
  ShieldCheck,
  Award,
  Sliders,
  Info,
  Check,
  AlertCircle,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

interface MatchBreakdown {
  skillScore?: number;
  availabilityScore?: number;
  ratingExperienceScore?: number;
  campusTrustScore?: number;
}

interface MatchResult {
  providerId?: string;
  name?: string;
  college?: string;
  course?: string;
  avatarInitial?: string;
  trustScore?: number;
  compositeScore?: number;
  breakdown?: MatchBreakdown;
  reasons?: string[];
  matchedSkillName?: string;
  matchedSkillProficiency?: string;
  averageRating?: number | null;
  reviewCount?: number;
  completedSwapsCount?: number;
  preferredFormat?: string;
  matchingAvailability?: { day: string; time: string }[];
  provider?: any;
  matchedSkill?: any;
  scores?: any;
  explanation?: any;
}

export default function MatchesPage() {
  const [targetSkillName, setTargetSkillName] = useState('Python');
  const [targetCategory, setTargetCategory] = useState('');
  const [desiredProficiency, setDesiredProficiency] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>('BEGINNER');
  const [preferredFormat, setPreferredFormat] = useState<'ONLINE' | 'IN_PERSON' | 'BOTH'>('BOTH');
  const [selectedSlots, setSelectedSlots] = useState<{ day: string; time: string }[]>([
    { day: 'Saturday', time: 'Morning' },
    { day: 'Wednesday', time: 'Evening' },
  ]);

  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Swap Request Modal State
  const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null);
  const [learningGoal, setLearningGoal] = useState('');
  const [sessionFormat, setSessionFormat] = useState<'ONLINE' | 'IN_PERSON'>('ONLINE');
  const [preferredTime, setPreferredTime] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<'30' | '45' | '60'>('60');
  const [submittingSwap, setSubmittingSwap] = useState(false);
  const [swapSuccessMessage, setSwapSuccessMessage] = useState<string | null>(null);
  const [swapErrorMessage, setSwapErrorMessage] = useState<string | null>(null);

  const popularSkills = [
    'Python',
    'Figma',
    'Web Development',
    'Interview Preparation',
    'Excel & Sheets',
    'Public Speaking',
    'Data Analysis',
    'Java',
  ];

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const timeSlots = ['Morning', 'Afternoon', 'Evening'];

  const toggleSlot = (day: string, time: string) => {
    setSelectedSlots((prev) => {
      const exists = prev.some((s) => s.day === day && s.time === time);
      if (exists) {
        return prev.filter((s) => !(s.day === day && s.time === time));
      } else {
        return [...prev, { day, time }];
      }
    });
  };

  const handleComputeMatches = async () => {
    setLoading(true);
    setHasSearched(true);
    try {
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetSkillName,
          targetCategory: targetCategory || undefined,
          desiredProficiency,
          preferredFormat,
          availabilitySlots: selectedSlots,
        }),
      });

      const data = await res.json();
      if (data.matches) {
        setMatches(data.matches);
      }
    } catch (err) {
      console.error('Failed to compute matches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check URL params
    const params = new URLSearchParams(window.location.search);
    const skill = params.get('targetSkill');
    if (skill) {
      setTargetSkillName(skill);
    }
    handleComputeMatches();
  }, []);

  const handleOpenSwap = (match: MatchResult) => {
    setSelectedMatch(match);
    const prefFormat = match.preferredFormat || match.provider?.preferredFormat;
    setSessionFormat(prefFormat === 'IN_PERSON' ? 'IN_PERSON' : 'ONLINE');
    const avail = match.matchingAvailability || match.provider?.availability || [];
    setPreferredTime(
      avail.length > 0
        ? `${avail[0].day} ${avail[0].time}`
        : 'Tomorrow at 4:00 PM'
    );
    const sName = match.matchedSkillName || match.matchedSkill?.canonicalName || targetSkillName;
    setLearningGoal(`I want to learn ${sName} fundamentals and practice exercises.`);
    setSwapSuccessMessage(null);
    setSwapErrorMessage(null);
  };

  const handleSendSwap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatch) return;

    setSubmittingSwap(true);
    setSwapErrorMessage(null);

    try {
      const pId = selectedMatch.providerId || selectedMatch.provider?.id;
      if (!pId) {
        throw new Error('Provider ID is missing');
      }

      const sName = selectedMatch.matchedSkillName || selectedMatch.matchedSkill?.canonicalName || targetSkillName;
      let sId = selectedMatch.matchedSkill?.skillId;

      if (!sId) {
        // Find skill id
        const skillsRes = await fetch('/api/skills');
        const skillsData = await skillsRes.json();
        const matchedSkill = skillsData.skills?.find(
          (s: any) => s.canonicalName.toLowerCase() === sName.toLowerCase()
        );
        sId = matchedSkill?.id;
      }

      if (!sId) {
        throw new Error('Skill not found in registry');
      }

      const res = await fetch('/api/swaps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: pId,
          skillId: sId,
          learningGoal,
          sessionFormat,
          preferredTime,
          durationMinutes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit swap request');
      }

      setSwapSuccessMessage('Swap request sent successfully! Escrow hold created.');
      setTimeout(() => {
        setSelectedMatch(null);
      }, 1800);
    } catch (err: any) {
      setSwapErrorMessage(err.message || 'Could not send request');
    } finally {
      setSubmittingSwap(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="pb-8 border-b border-slate-200">
        <div className="inline-flex items-center gap-2 text-xs font-bold text-teal-600 uppercase tracking-wider mb-2">
          <Zap className="h-4 w-4" />
          <span>Algorithm-Driven Peer Matching</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Smart Matchmaking Engine
        </h1>
        <p className="mt-1 text-sm text-slate-500 max-w-2xl">
          Multi-criteria matching with 100% transparent scoring breakdown. We balance skill relevance, schedule overlap, peer ratings, and campus trust.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Input Configuration Form */}
        <div className="lg:col-span-5 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Sliders className="h-4 w-4 text-teal-600" />
              <span>Matching Preferences</span>
            </h3>
            <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
              Live Heuristic
            </span>
          </div>

          {/* Target Skill */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Target Skill to Learn
            </label>
            <input
              type="text"
              value={targetSkillName}
              onChange={(e) => setTargetSkillName(e.target.value)}
              placeholder="e.g. Python, Figma, React..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 font-medium focus:border-teal-500 focus:bg-white focus:outline-none"
            />
            {/* Quick Suggestions */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {popularSkills.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setTargetSkillName(s)}
                  className={`text-[11px] px-2 py-0.5 rounded-md border transition-colors ${
                    targetSkillName.toLowerCase() === s.toLowerCase()
                      ? 'bg-teal-600 text-white border-teal-600 font-medium'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Desired Proficiency */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Your Current Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setDesiredProficiency(lvl)}
                  className={`py-2 text-xs font-semibold rounded-xl border transition-all text-center ${
                    desiredProficiency === lvl
                      ? 'border-teal-600 bg-teal-50 text-teal-900 shadow-2xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {lvl[0] + lvl.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Format Preference */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Location Format
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'BOTH', label: 'Any / Flexible' },
                { id: 'ONLINE', label: 'Online Only' },
                { id: 'IN_PERSON', label: 'In-Person' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setPreferredFormat(f.id as any)}
                  className={`py-2 text-xs font-semibold rounded-xl border transition-all text-center ${
                    preferredFormat === f.id
                      ? 'border-teal-600 bg-teal-50 text-teal-900 shadow-2xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Availability Time Slots */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Your Availability ({selectedSlots.length} slots)
              </label>
            </div>
            <div className="space-y-1.5 max-h-44 overflow-y-auto p-2 rounded-xl bg-slate-50 border border-slate-200">
              {daysOfWeek.map((day) => (
                <div key={day} className="flex items-center justify-between py-1 border-b border-slate-200/50 last:border-0">
                  <span className="text-xs font-medium text-slate-700 w-24">{day}</span>
                  <div className="flex gap-1">
                    {timeSlots.map((time) => {
                      const active = selectedSlots.some((s) => s.day === day && s.time === time);
                      return (
                        <button
                          key={time}
                          type="button"
                          onClick={() => toggleSlot(day, time)}
                          className={`text-[10px] px-2 py-0.5 rounded transition-colors ${
                            active
                              ? 'bg-teal-600 text-white font-bold'
                              : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weights Info Box */}
          <div className="rounded-2xl bg-teal-50/70 border border-teal-200/80 p-3.5 text-xs text-teal-900 space-y-1.5">
            <div className="font-bold flex items-center gap-1.5 text-teal-800">
              <Info className="h-3.5 w-3.5" />
              <span>Transparent Formula Weights</span>
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-teal-700">
              <div>• Skill Match: <strong>35%</strong></div>
              <div>• Availability: <strong>25%</strong></div>
              <div>• Ratings/Swaps: <strong>20%</strong></div>
              <div>• Campus Trust: <strong>20%</strong></div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleComputeMatches}
            disabled={loading || !targetSkillName}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm py-3 shadow-md shadow-teal-600/20 transition-all disabled:opacity-50"
          >
            {loading ? <span>Scoring Peers...</span> : <span>Run Matching Engine</span>}
            <Sparkles className="h-4 w-4" />
          </button>
        </div>

        {/* Right Match Results */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>Top Ranked Matches</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700">
                {matches.length} found
              </span>
            </h2>
            <span className="text-xs text-slate-400">Sorted by Composite Score</span>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-44 rounded-2xl border border-slate-200 bg-white p-6 animate-pulse"
                />
              ))}
            </div>
          ) : matches.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 mb-3">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">No matching peers found</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                No active peers match "{targetSkillName}". Try searching for another skill like Python, Figma, or Web Development.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {matches.map((match, idx) => {
                const matchPct = (
                  match.compositeScore != null
                    ? match.compositeScore * 100
                    : (match.scores?.totalScore ?? 0)
                ).toFixed(0);

                const peerName = match.name || match.provider?.name || 'Campus Peer';
                const peerInitials = match.avatarInitial || match.provider?.avatarInitial;
                const peerSub = match.course || match.provider?.course || match.college || match.provider?.college;
                const skillName = match.matchedSkillName || match.matchedSkill?.canonicalName || targetSkillName;
                const skillProficiency = match.matchedSkillProficiency || match.matchedSkill?.proficiency || 'INTERMEDIATE';
                const rating = match.averageRating ?? match.provider?.averageRating ?? null;
                const reviews = match.reviewCount ?? match.provider?.reviewCount ?? 0;
                const swapsDone = match.completedSwapsCount ?? match.provider?.completedSwapsCount ?? 0;
                const trustPct = (
                  match.trustScore != null
                    ? match.trustScore * 100
                    : ((match.scores?.trustScore ?? 5) / 10) * 100
                ).toFixed(0);

                const skillScorePct = (
                  match.breakdown?.skillScore != null
                    ? match.breakdown.skillScore * 100
                    : ((match.scores?.skillRelevance ?? 0) / 40) * 100
                ).toFixed(0);

                const availScorePct = (
                  match.breakdown?.availabilityScore != null
                    ? match.breakdown.availabilityScore * 100
                    : ((match.scores?.availabilityScore ?? 0) / 15) * 100
                ).toFixed(0);

                const ratingScorePct = (
                  match.breakdown?.ratingExperienceScore != null
                    ? match.breakdown.ratingExperienceScore * 100
                    : ((match.scores?.ratingScore ?? 0) / 25) * 100
                ).toFixed(0);

                const trustScorePct = (
                  match.breakdown?.campusTrustScore != null
                    ? match.breakdown.campusTrustScore * 100
                    : ((match.scores?.trustScore ?? 0) / 10) * 100
                ).toFixed(0);

                const reasonsList = (match.reasons && match.reasons.length > 0)
                  ? match.reasons
                  : [
                      match.explanation?.overallSummary,
                      match.explanation?.skillDetail,
                      match.explanation?.availabilityDetail,
                      match.explanation?.trustDetail,
                    ].filter(Boolean);

                return (
                  <div
                    key={match.providerId || match.provider?.id || idx}
                    className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-300 hover:shadow-md transition-all space-y-4"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={peerName} initials={peerInitials} size="lg" />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-900 text-base">{peerName}</h3>
                            <Badge variant="teal" size="sm">
                              #{idx + 1} Best Match
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500">{peerSub}</p>
                        </div>
                      </div>

                      {/* Composite Score Circle / Badge */}
                      <div className="text-right">
                        <div className="text-2xl font-black text-teal-600 tracking-tight">
                          {matchPct}%
                        </div>
                        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          Match Score
                        </div>
                      </div>
                    </div>

                    {/* Skill & Format overview */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1 font-semibold text-slate-800">
                        <span>Offers:</span>
                        <span className="text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                          {skillName} ({skillProficiency})
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-amber-600 font-semibold">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span>{rating ?? 'New'}</span>
                        <span className="text-slate-400 font-normal">({reviews})</span>
                      </div>

                      <div className="text-slate-500">
                        <strong>{swapsDone}</strong> swaps done
                      </div>

                      <div className="text-slate-500">
                        Trust: <strong>{trustPct}%</strong>
                      </div>
                    </div>

                    {/* Breakdown Bars */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                      <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">
                          Skill Fit (35%)
                        </div>
                        <div className="text-sm font-bold text-slate-800 mt-0.5">
                          {skillScorePct}%
                        </div>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">
                          Schedule (25%)
                        </div>
                        <div className="text-sm font-bold text-slate-800 mt-0.5">
                          {availScorePct}%
                        </div>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">
                          Reviews (20%)
                        </div>
                        <div className="text-sm font-bold text-slate-800 mt-0.5">
                          {ratingScorePct}%
                        </div>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">
                          Trust (20%)
                        </div>
                        <div className="text-sm font-bold text-slate-800 mt-0.5">
                          {trustScorePct}%
                        </div>
                      </div>
                    </div>

                    {/* Transparent Explanations */}
                    <div className="pt-2">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                        Why this match was selected:
                      </div>
                      <div className="space-y-1">
                        {(reasonsList.length > 0 ? reasonsList : ['Optimal skill and peer schedule fit']).map((reason, rIdx) => (
                          <div
                            key={rIdx}
                            className="flex items-center gap-1.5 text-xs text-slate-600 font-medium"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                            <span>{reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        Escrow Cost: <strong>1.0 credit / hour</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenSwap(match)}
                        className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-colors shadow-xs"
                      >
                        <span>Request Swap</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Swap Request Modal */}
      {selectedMatch && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedMatch(null)}
          title={`Request Swap with ${selectedMatch.name || selectedMatch.provider?.name || 'Peer'}`}
          description={`Selected via ${targetSkillName} matching engine (${(
            (selectedMatch.compositeScore != null
              ? selectedMatch.compositeScore * 100
              : (selectedMatch.scores?.totalScore ?? 0))
          ).toFixed(0)}% fit)`}
          maxWidth="md"
        >
          {swapSuccessMessage ? (
            <div className="p-6 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <Check className="h-6 w-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Request Sent!</h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">{swapSuccessMessage}</p>
              <div className="pt-2">
                <Link
                  href="/sessions"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 hover:underline"
                >
                  <span>Go to My Sessions →</span>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSendSwap} className="p-6 space-y-4">
              {swapErrorMessage && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                  <span>{swapErrorMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Skill to Learn
                </label>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-800">
                  {selectedMatch.matchedSkillName || selectedMatch.matchedSkill?.canonicalName || targetSkillName} ({selectedMatch.matchedSkillProficiency || selectedMatch.matchedSkill?.proficiency || 'INTERMEDIATE'})
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Session Duration
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['30', '45', '60'] as const).map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setDurationMinutes(mins)}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        durationMinutes === mins
                          ? 'border-teal-600 bg-teal-50 text-teal-900 font-bold'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      <div className="text-xs">{mins} Mins</div>
                      <div className="text-[11px] text-teal-600 mt-0.5">
                        {mins === '30' ? '0.50' : mins === '45' ? '0.75' : '1.00'} Credits
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Preferred Date & Time
                </label>
                <input
                  type="text"
                  required
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  placeholder="e.g. Wednesday 6:00 PM"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Learning Goal & Deliverable
                </label>
                <textarea
                  required
                  rows={2}
                  value={learningGoal}
                  onChange={(e) => setLearningGoal(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedMatch(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSwap}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
                >
                  {submittingSwap ? 'Sending...' : 'Confirm Request'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}
