'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  Star,
  CheckCircle2,
  Calendar,
  Clock,
  Coins,
  ArrowRight,
  Sparkles,
  MapPin,
  Laptop,
  Check,
  AlertCircle,
  X,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

interface PeerSkill {
  id: string;
  skillId: string;
  type: string;
  proficiency: string;
  skill: {
    id: string;
    canonicalName: string;
    category: string;
  };
}

interface PeerItem {
  id: string;
  name: string;
  college: string;
  course: string | null;
  year: string | null;
  bio: string | null;
  preferredFormat: string;
  verificationStatus: string;
  trustScore: number;
  avatarInitial: string | null;
  averageRating: number | null;
  reviewCount: number;
  completedSwapsCount: number;
  offeredSkills: PeerSkill[];
  wantedSkills: PeerSkill[];
  availability: { day: string; time: string }[];
}

export default function ExplorePage() {
  const [peers, setPeers] = useState<PeerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('');
  const [sortBy, setSortBy] = useState('rating');

  // Swap Request Modal State
  const [selectedPeer, setSelectedPeer] = useState<PeerItem | null>(null);
  const [targetSkillId, setTargetSkillId] = useState('');
  const [learningGoal, setLearningGoal] = useState('');
  const [sessionFormat, setSessionFormat] = useState<'ONLINE' | 'IN_PERSON'>('ONLINE');
  const [preferredTime, setPreferredTime] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<'30' | '45' | '60'>('60');
  const [submittingSwap, setSubmittingSwap] = useState(false);
  const [swapSuccessMessage, setSwapSuccessMessage] = useState<string | null>(null);
  const [swapErrorMessage, setSwapErrorMessage] = useState<string | null>(null);

  const categories = [
    { label: 'All Categories', value: '' },
    { label: 'Technology', value: 'TECHNOLOGY' },
    { label: 'Design', value: 'DESIGN' },
    { label: 'Career', value: 'CAREER' },
    { label: 'Business', value: 'BUSINESS' },
    { label: 'Creative', value: 'CREATIVE' },
  ];

  const fetchPeers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedFormat) params.append('format', selectedFormat);
      if (sortBy) params.append('sortBy', sortBy);

      const res = await fetch(`/api/peers?${params.toString()}`);
      const data = await res.json();
      if (data.peers) {
        setPeers(data.peers);
      }
    } catch (err) {
      console.error('Failed to fetch peers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check initial search param from URL if present
    const urlParams = new URLSearchParams(window.location.search);
    const initialSearch = urlParams.get('search');
    const initialCat = urlParams.get('category');
    if (initialSearch) setSearch(initialSearch);
    if (initialCat) setSelectedCategory(initialCat);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPeers();
    }, 200);
    return () => clearTimeout(timer);
  }, [search, selectedCategory, selectedFormat, sortBy]);

  const handleOpenSwapModal = (peer: PeerItem) => {
    setSelectedPeer(peer);
    setTargetSkillId(peer.offeredSkills[0]?.skill.id || '');
    setSessionFormat(peer.preferredFormat === 'IN_PERSON' ? 'IN_PERSON' : 'ONLINE');
    setPreferredTime(
      peer.availability.length > 0
        ? `${peer.availability[0].day} ${peer.availability[0].time}`
        : 'Tomorrow at 4:00 PM'
    );
    setLearningGoal('');
    setSwapSuccessMessage(null);
    setSwapErrorMessage(null);
  };

  const handleSendSwapRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPeer || !targetSkillId) return;

    setSubmittingSwap(true);
    setSwapErrorMessage(null);

    try {
      const res = await fetch('/api/swaps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: selectedPeer.id,
          skillId: targetSkillId,
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

      setSwapSuccessMessage('Swap request sent successfully! The credits are held in escrow.');
      setTimeout(() => {
        setSelectedPeer(null);
      }, 1800);
    } catch (err: any) {
      setSwapErrorMessage(err.message || 'Could not send request');
    } finally {
      setSubmittingSwap(false);
    }
  };

  const calculateCredits = (mins: string) => {
    if (mins === '30') return '0.50';
    if (mins === '45') return '0.75';
    return '1.00';
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold text-teal-600 uppercase tracking-wider mb-2">
            <Sparkles className="h-4 w-4" />
            <span>Campus Peer Directory</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Explore Skills & Peers
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Discover student mentors offering Python, Figma, public speaking, and more.
          </p>
        </div>

        <Link
          href="/matches"
          className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-white font-semibold text-xs hover:bg-teal-700 transition-colors shadow-sm self-start md:self-auto"
        >
          <Sparkles className="h-4 w-4" />
          <span>Switch to Smart Matchmaker</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="mt-8 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by skill name (Python, Figma, etc.) or student..."
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-700 focus:border-teal-500 focus:outline-none"
            >
              <option value="">All Formats</option>
              <option value="ONLINE">Online Only</option>
              <option value="IN_PERSON">In-Person Only</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-700 focus:border-teal-500 focus:outline-none"
            >
              <option value="rating">Sort: Highest Rating</option>
              <option value="swaps">Sort: Most Swaps</option>
              <option value="newest">Sort: Newest Members</option>
            </select>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                selectedCategory === cat.value
                  ? 'bg-teal-600 border-teal-600 text-white shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-teal-300'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Peer Grid */}
      <div className="mt-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-72 rounded-2xl border border-slate-200 bg-white p-6 animate-pulse"
              />
            ))}
          </div>
        ) : peers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 mb-3">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No student peers found</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search keyword or clearing the category and format filters.
            </p>
            <button
              onClick={() => {
                setSearch('');
                setSelectedCategory('');
                setSelectedFormat('');
              }}
              className="mt-4 text-xs font-semibold text-teal-600 hover:text-teal-700 underline"
            >
              Reset all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {peers.map((peer) => (
              <div
                key={peer.id}
                className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={peer.name} initials={peer.avatarInitial} size="lg" />
                      <div>
                        <h3 className="font-bold text-slate-900 text-base flex items-center gap-1.5">
                          {peer.name}
                          {peer.verificationStatus === 'VERIFIED' && (
                            <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
                          )}
                        </h3>
                        <p className="text-xs text-slate-500">{peer.course || peer.college}</p>
                        {peer.year && (
                          <span className="text-[10px] text-slate-400">{peer.year}</span>
                        )}
                      </div>
                    </div>
                    <Badge variant="teal" size="sm">
                      Trust {(peer.trustScore * 100).toFixed(0)}%
                    </Badge>
                  </div>

                  {/* Rating & Swaps */}
                  <div className="mt-4 flex items-center gap-3 text-xs text-slate-600">
                    <div className="flex items-center gap-1 text-amber-600 font-semibold">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span>{peer.averageRating ?? 'New'}</span>
                      <span className="text-slate-400 font-normal">({peer.reviewCount})</span>
                    </div>
                    <span className="text-slate-300">•</span>
                    <span>
                      <strong>{peer.completedSwapsCount}</strong> swaps done
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="flex items-center gap-1 text-slate-500">
                      {peer.preferredFormat === 'IN_PERSON' ? (
                        <>
                          <MapPin className="h-3 w-3" /> Campus
                        </>
                      ) : peer.preferredFormat === 'ONLINE' ? (
                        <>
                          <Laptop className="h-3 w-3" /> Online
                        </>
                      ) : (
                        'Flexible'
                      )}
                    </span>
                  </div>

                  {peer.bio && (
                    <p className="mt-3 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {peer.bio}
                    </p>
                  )}

                  {/* Offered Skills */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Offers to Teach:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {peer.offeredSkills.map((os) => (
                        <span
                          key={os.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200/60"
                        >
                          {os.skill.canonicalName}
                          <span className="text-[10px] text-teal-600/70 font-normal">
                            ({os.proficiency.toLowerCase()})
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Wants to Learn */}
                  {peer.wantedSkills.length > 0 && (
                    <div className="mt-3">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Looking to Learn:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {peer.wantedSkills.map((ws) => (
                          <span
                            key={ws.id}
                            className="inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-600"
                          >
                            {ws.skill.canonicalName}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Availability slots */}
                  {peer.availability.length > 0 && (
                    <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>
                        Available:{' '}
                        {peer.availability
                          .slice(0, 2)
                          .map((a) => `${a.day} ${a.time}`)
                          .join(', ')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Bottom Action */}
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => handleOpenSwapModal(peer)}
                    className="w-full inline-flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2.5 rounded-xl transition-colors shadow-xs"
                  >
                    <span>Request 1-on-1 Swap</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Swap Request Modal */}
      {selectedPeer && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedPeer(null)}
          title={`Request Swap with ${selectedPeer.name}`}
          description="Credits are held safely in escrow until you both complete the session."
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
                  <span>View in Swap Sessions →</span>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSendSwapRequest} className="p-6 space-y-4">
              {swapErrorMessage && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                  <span>{swapErrorMessage}</span>
                </div>
              )}

              {/* Target Skill Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Skill to Learn
                </label>
                <select
                  value={targetSkillId}
                  onChange={(e) => setTargetSkillId(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-500 focus:outline-none"
                >
                  {selectedPeer.offeredSkills.map((os) => (
                    <option key={os.skill.id} value={os.skill.id}>
                      {os.skill.canonicalName} ({os.proficiency})
                    </option>
                  ))}
                </select>
              </div>

              {/* Duration & Credits */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Session Duration (Time Credit)
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
                        {calculateCredits(mins)} Credits
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Format */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Session Format
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSessionFormat('ONLINE')}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center ${
                      sessionFormat === 'ONLINE'
                        ? 'border-teal-600 bg-teal-50 text-teal-800'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Online (Video/Screen)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSessionFormat('IN_PERSON')}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center ${
                      sessionFormat === 'IN_PERSON'
                        ? 'border-teal-600 bg-teal-50 text-teal-800'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Campus In-Person
                  </button>
                </div>
              </div>

              {/* Preferred Date / Time */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Preferred Date & Time
                </label>
                <input
                  type="text"
                  required
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  placeholder="e.g. Wednesday at 5:00 PM (Library / Zoom)"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none"
                />
              </div>

              {/* Learning Goal */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Learning Goal & Deliverable
                </label>
                <textarea
                  required
                  rows={2}
                  value={learningGoal}
                  onChange={(e) => setLearningGoal(e.target.value)}
                  placeholder="e.g. I want to debug my Python homework on recursion and understand dictionaries..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none"
                />
              </div>

              {/* Escrow Notice */}
              <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 text-xs text-slate-600 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-teal-600" />
                  <span>Escrow Hold:</span>
                </div>
                <span className="font-bold text-teal-700">
                  {calculateCredits(durationMinutes)} Credits
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedPeer(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSwap}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
                >
                  {submittingSwap ? 'Sending...' : 'Confirm & Send Request'}
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
