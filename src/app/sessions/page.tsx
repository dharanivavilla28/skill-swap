'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  Coins,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Star,
  Sparkles,
  ArrowRight,
  Send,
  AlertCircle,
  Check,
  User,
  MapPin,
  Laptop,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

interface SwapItem {
  id: string;
  status: string;
  sessionFormat: string;
  preferredTime: string;
  agreedTime?: string | null;
  durationMinutes: number;
  agreedCredits: number;
  learningGoal: string;
  requesterCompleted: boolean;
  providerCompleted: boolean;
  createdAt: string;
  skill: {
    id: string;
    canonicalName: string;
    category: string;
  };
  requester: {
    id: string;
    name: string;
    email: string;
    avatarInitial?: string | null;
    course?: string | null;
  };
  provider: {
    id: string;
    name: string;
    email: string;
    avatarInitial?: string | null;
    course?: string | null;
  };
  ratings: {
    id: string;
    score: number;
    reviewText: string;
    reviewerId: string;
  }[];
  _count: {
    messages: number;
  };
}

interface MessageItem {
  id: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    avatarInitial?: string | null;
  };
}

export default function SessionsPage() {
  const [swaps, setSwaps] = useState<SwapItem[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'ACCEPTED' | 'SCHEDULED' | 'COMPLETED'>('ALL');

  // Messages Drawer State
  const [activeChatSwap, setActiveChatSwap] = useState<SwapItem | null>(null);
  const [chatMessages, setChatMessages] = useState<MessageItem[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Review Modal State
  const [reviewSwap, setReviewSwap] = useState<SwapItem | null>(null);
  const [reviewScore, setReviewScore] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // Schedule Modal State
  const [scheduleSwap, setScheduleSwap] = useState<SwapItem | null>(null);
  const [scheduledDateTime, setScheduledDateTime] = useState('');

  const fetchSwaps = async () => {
    try {
      const authRes = await fetch('/api/auth/me');
      const authData = await authRes.json();
      if (authData.user) {
        setCurrentUserId(authData.user.id);
      }

      const res = await fetch('/api/swaps');
      const data = await res.json();
      if (data.swaps) {
        setSwaps(data.swaps);
      }
    } catch (err) {
      console.error('Failed to load swaps:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSwaps();
  }, []);

  const handleAction = async (swapId: string, action: string, extraData: any = {}) => {
    try {
      const res = await fetch(`/api/swaps/${swapId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extraData }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Action failed');
        return;
      }

      fetchSwaps();
    } catch (err) {
      console.error('Swap action failed:', err);
    }
  };

  // Open Chat and load messages
  const openChat = async (swap: SwapItem) => {
    setActiveChatSwap(swap);
    try {
      const res = await fetch(`/api/swaps/${swap.id}/messages`);
      const data = await res.json();
      if (data.messages) {
        setChatMessages(data.messages);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChatSwap || !newMessage.trim()) return;

    setSendingMessage(true);
    try {
      const res = await fetch(`/api/swaps/${activeChatSwap.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage.trim() }),
      });

      const data = await res.json();
      if (data.success && data.message) {
        setChatMessages((prev) => [...prev, data.message]);
        setNewMessage('');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleOpenReview = (swap: SwapItem) => {
    setReviewSwap(swap);
    setReviewScore(5);
    setReviewText('');
    setReviewSuccess(false);
    setReviewError(null);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewSwap) return;

    setSubmittingReview(true);
    setReviewError(null);

    try {
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          swapId: reviewSwap.id,
          score: reviewScore,
          reviewText,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit review');
      }

      setReviewSuccess(true);
      setTimeout(() => {
        setReviewSwap(null);
        fetchSwaps();
      }, 1500);
    } catch (err: any) {
      setReviewError(err.message || 'Error submitting review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const filteredSwaps = swaps.filter((s) => {
    if (activeTab === 'ALL') return true;
    return s.status === activeTab;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="warning">Pending Request</Badge>;
      case 'ACCEPTED':
        return <Badge variant="info">Accepted</Badge>;
      case 'SCHEDULED':
        return <Badge variant="indigo">Scheduled</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="purple">In Progress</Badge>;
      case 'COMPLETED':
        return <Badge variant="success">Completed</Badge>;
      case 'DECLINED':
      case 'CANCELLED':
        return <Badge variant="danger">{status}</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold text-teal-600 uppercase tracking-wider mb-2">
            <Calendar className="h-4 w-4" />
            <span>Exchange Lifecycle</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Swap Sessions
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your peer teaching sessions, chat with partners, and confirm completed credits.
          </p>
        </div>

        <Link
          href="/explore"
          className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-white font-semibold text-xs hover:bg-teal-700 transition-colors shadow-sm self-start sm:self-auto"
        >
          <span>Find Another Skill</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Tabs */}
      <div className="mt-8 flex flex-wrap gap-2 border-b border-slate-200 pb-4">
        {[
          { id: 'ALL', label: 'All Sessions', count: swaps.length },
          { id: 'PENDING', label: 'Pending Requests', count: swaps.filter((s) => s.status === 'PENDING').length },
          { id: 'ACCEPTED', label: 'Accepted', count: swaps.filter((s) => s.status === 'ACCEPTED').length },
          { id: 'SCHEDULED', label: 'Scheduled', count: swaps.filter((s) => s.status === 'SCHEDULED').length },
          { id: 'COMPLETED', label: 'Completed', count: swaps.filter((s) => s.status === 'COMPLETED').length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === tab.id ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Sessions List */}
      <div className="mt-6 space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 rounded-2xl border border-slate-200 bg-white animate-pulse" />
            ))}
          </div>
        ) : filteredSwaps.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 mb-3">
              <Calendar className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No swap sessions found</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              You don't have any sessions matching the selected filter.
            </p>
          </div>
        ) : (
          filteredSwaps.map((swap) => {
            const isRequester = currentUserId === swap.requester.id;
            const isProvider = currentUserId === swap.provider.id;
            const partner = isRequester ? swap.provider : swap.requester;
            const roleLabel = isRequester ? 'Learning' : 'Teaching';
            const userReviewed = swap.ratings.some((r) => r.reviewerId === currentUserId);

            return (
              <div
                key={swap.id}
                className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs hover:border-slate-300 transition-all space-y-4"
              >
                {/* Top Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                        isRequester
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      You are {roleLabel}
                    </span>
                    <h3 className="font-bold text-slate-900 text-lg">
                      {swap.skill.canonicalName}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3">
                    {getStatusBadge(swap.status)}
                    <span className="flex items-center gap-1 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-lg">
                      <Coins className="h-3.5 w-3.5" />
                      <span>{swap.agreedCredits.toFixed(2)} Credits</span>
                    </span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  {/* Partner Info */}
                  <div className="flex items-center gap-3">
                    <Avatar name={partner.name} initials={partner.avatarInitial} size="md" />
                    <div>
                      <div className="text-xs text-slate-400">Partner:</div>
                      <div className="text-sm font-bold text-slate-900">{partner.name}</div>
                      <div className="text-[11px] text-slate-500">{partner.course || partner.email}</div>
                    </div>
                  </div>

                  {/* Schedule & Duration */}
                  <div className="text-xs space-y-1 text-slate-600">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>{swap.durationMinutes} Minutes Session</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>{swap.agreedTime || swap.preferredTime}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      {swap.sessionFormat === 'ONLINE' ? (
                        <>
                          <Laptop className="h-3 w-3" /> Online Call
                        </>
                      ) : (
                        <>
                          <MapPin className="h-3 w-3" /> Campus In-Person
                        </>
                      )}
                    </div>
                  </div>

                  {/* Goal */}
                  <div className="text-xs rounded-xl bg-slate-50 p-3 border border-slate-100">
                    <div className="font-semibold text-slate-400 uppercase text-[10px] mb-1">
                      Learning Goal:
                    </div>
                    <p className="text-slate-700 line-clamp-2">{swap.learningGoal}</p>
                  </div>
                </div>

                {/* Completion Status Indicators */}
                {(swap.status === 'ACCEPTED' || swap.status === 'SCHEDULED' || swap.status === 'IN_PROGRESS') && (
                  <div className="flex items-center gap-4 text-xs bg-amber-50/70 border border-amber-200/70 p-3 rounded-2xl text-amber-900">
                    <span className="font-semibold">Completion Signoff:</span>
                    <span className="flex items-center gap-1">
                      {swap.requesterCompleted ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-slate-300" />
                      )}
                      <span>Learner: {swap.requesterCompleted ? 'Confirmed' : 'Pending'}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      {swap.providerCompleted ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-slate-300" />
                      )}
                      <span>Mentor: {swap.providerCompleted ? 'Confirmed' : 'Pending'}</span>
                    </span>
                  </div>
                )}

                {/* Action Toolbar */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {/* Chat button */}
                    <button
                      onClick={() => openChat(swap)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
                    >
                      <MessageSquare className="h-3.5 w-3.5 text-teal-600" />
                      <span>Chat Messages</span>
                      {swap._count.messages > 0 && (
                        <span className="ml-1 px-1.5 py-0.2 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold">
                          {swap._count.messages}
                        </span>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* PENDING: Provider can Accept or Decline */}
                    {swap.status === 'PENDING' && isProvider && (
                      <>
                        <button
                          onClick={() => handleAction(swap.id, 'DECLINE')}
                          className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => handleAction(swap.id, 'ACCEPT')}
                          className="inline-flex items-center gap-1 px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Accept Request</span>
                        </button>
                      </>
                    )}

                    {/* ACCEPTED: Schedule button */}
                    {swap.status === 'ACCEPTED' && (
                      <button
                        onClick={() => {
                          setScheduleSwap(swap);
                          setScheduledDateTime(swap.preferredTime);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
                      >
                        Confirm Time Schedule
                      </button>
                    )}

                    {/* ACTIVE: Mark Completion */}
                    {(swap.status === 'SCHEDULED' || swap.status === 'ACCEPTED' || swap.status === 'IN_PROGRESS') && (
                      <button
                        onClick={() => handleAction(swap.id, 'CONFIRM_COMPLETION')}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Confirm Session Finished</span>
                      </button>
                    )}

                    {/* COMPLETED: Rating button */}
                    {swap.status === 'COMPLETED' && (
                      <>
                        {userReviewed ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg">
                            <Star className="h-3.5 w-3.5 fill-emerald-500 text-emerald-500" />
                            <span>Feedback Submitted</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleOpenReview(swap)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-xs"
                          >
                            <Star className="h-3.5 w-3.5" />
                            <span>Rate & Review Peer</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Chat Messages Modal */}
      {activeChatSwap && (
        <Modal
          isOpen={true}
          onClose={() => setActiveChatSwap(null)}
          title={`Chat with ${
            currentUserId === activeChatSwap.requester.id
              ? activeChatSwap.provider.name
              : activeChatSwap.requester.name
          }`}
          description={`Topic: ${activeChatSwap.skill.canonicalName} (${activeChatSwap.durationMinutes} min)`}
          maxWidth="lg"
        >
          <div className="flex flex-col h-[460px]">
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
              {chatMessages.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No messages exchanged yet. Send a greeting or confirm location!
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isMe = msg.sender.id === currentUserId;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 text-[11px] text-slate-400">
                        <span>{msg.sender.name}</span>
                        <span>•</span>
                        <span>
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs ${
                          isMe
                            ? 'bg-teal-600 text-white rounded-br-none shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-xs'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 bg-white flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:border-teal-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={sendingMessage || !newMessage.trim()}
                className="inline-flex items-center gap-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </Modal>
      )}

      {/* Review Modal */}
      {reviewSwap && (
        <Modal
          isOpen={true}
          onClose={() => setReviewSwap(null)}
          title="Rate & Review Your Peer"
          description={`How was your ${reviewSwap.skill.canonicalName} session?`}
          maxWidth="md"
        >
          {reviewSuccess ? (
            <div className="p-6 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <Check className="h-6 w-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Review Submitted!</h4>
              <p className="text-xs text-slate-500">Thank you for contributing to campus trust.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmitReview} className="p-6 space-y-4">
              {reviewError && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                  <span>{reviewError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Star Rating (1 to 5)
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewScore(star)}
                      className="p-1 rounded-lg hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`h-7 w-7 ${
                          star <= reviewScore
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm font-bold text-slate-800">
                    {reviewScore} of 5 Stars
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Review & Feedback
                </label>
                <textarea
                  required
                  minLength={5}
                  rows={3}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share constructive feedback. Did your partner explain clearly? Were they on time?"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setReviewSwap(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}

      {/* Schedule Modal */}
      {scheduleSwap && (
        <Modal
          isOpen={true}
          onClose={() => setScheduleSwap(null)}
          title="Confirm Session Time"
          description="Lock in the agreed time slot for your exchange."
          maxWidth="sm"
        >
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Agreed Date & Time
              </label>
              <input
                type="text"
                value={scheduledDateTime}
                onChange={(e) => setScheduledDateTime(e.target.value)}
                placeholder="e.g. Thursday 3:00 PM (Campus Commons / Zoom)"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setScheduleSwap(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleAction(scheduleSwap.id, 'SCHEDULE', { agreedTime: scheduledDateTime });
                  setScheduleSwap(null);
                }}
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm"
              >
                Save Schedule
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
