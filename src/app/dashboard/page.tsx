import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import {
  Sparkles,
  Coins,
  Calendar,
  Star,
  Users,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Plus,
  BookOpen,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user's skills
  const userSkills = await prisma.userSkill.findMany({
    where: { userId: user.id },
    include: { skill: true },
  });

  const offered = userSkills.filter((s) => s.type === 'OFFERED');
  const wanted = userSkills.filter((s) => s.type === 'WANTED');

  // Fetch active swaps
  const activeSwaps = await prisma.swap.findMany({
    where: {
      OR: [{ requesterId: user.id }, { providerId: user.id }],
      status: { in: ['PENDING', 'ACCEPTED', 'SCHEDULED', 'IN_PROGRESS'] },
    },
    include: {
      skill: true,
      requester: { select: { id: true, name: true, avatarInitial: true } },
      provider: { select: { id: true, name: true, avatarInitial: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 4,
  });

  // Fetch recent transactions
  const recentTransactions = await prisma.creditTransaction.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  // Fetch user reviews
  const reviews = await prisma.rating.findMany({
    where: { recipientId: user.id },
    include: {
      reviewer: { select: { name: true, avatarInitial: true } },
      swap: { include: { skill: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 3,
  });

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + r.score, 0) / reviews.length).toFixed(1)
      : '5.0';

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Top Welcome Card */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Avatar name={user.name} initials={user.avatarInitial} size="xl" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {user.name}
              </h1>
              <Badge variant="teal" size="sm">
                Trust {(user.trustScore * 100).toFixed(0)}%
              </Badge>
              {user.verificationStatus === 'VERIFIED' && (
                <CheckCircle2 className="h-4 w-4 text-teal-600" />
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {user.course || 'Undergraduate'} • {user.year || 'Student'} • {user.college}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/matches"
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-white font-semibold text-xs hover:bg-teal-700 transition-colors shadow-sm"
          >
            <Sparkles className="h-4 w-4" />
            <span>Find a Skill Match</span>
          </Link>
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors"
          >
            <Users className="h-4 w-4 text-teal-600" />
            <span>Explore Peers</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Credits */}
        <Link
          href="/wallet"
          className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-300 transition-colors group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase">
            <span>Skill Credits</span>
            <Coins className="h-4 w-4 text-teal-600" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 group-hover:text-teal-700 transition-colors">
              {user.creditBalance.toFixed(2)}
            </span>
            <span className="text-xs font-bold text-teal-600">CR</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">View transaction ledger →</p>
        </Link>

        {/* Active Sessions */}
        <Link
          href="/sessions"
          className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs hover:border-indigo-300 transition-colors group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase">
            <span>Active Sessions</span>
            <Calendar className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 group-hover:text-indigo-700 transition-colors">
              {activeSwaps.length}
            </span>
            <span className="text-xs font-bold text-indigo-600">Pending / In Progress</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Manage swap sessions →</p>
        </Link>

        {/* Total Earned */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase">
            <span>Hours Taught</span>
            <Clock className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {user.totalCreditsEarned.toFixed(1)}
            </span>
            <span className="text-xs font-bold text-emerald-600">Hours</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Total earned from peer mentoring</p>
        </div>

        {/* Rating */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase">
            <span>Peer Rating</span>
            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{avgRating}</span>
            <span className="text-xs font-bold text-amber-500">/ 5.0</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Based on {reviews.length} reviews</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 8 cols: Active Swaps & Skills */}
        <div className="lg:col-span-8 space-y-6">
          {/* Active Swaps */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-teal-600" />
                <span>Active & Upcoming Swaps</span>
              </h3>
              <Link href="/sessions" className="text-xs font-semibold text-teal-600 hover:underline">
                View all sessions →
              </Link>
            </div>

            {activeSwaps.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-slate-200 rounded-2xl">
                <p className="text-xs text-slate-500">No active swaps right now.</p>
                <Link
                  href="/explore"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-teal-600 hover:underline"
                >
                  <span>Explore skills to start a session →</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {activeSwaps.map((s) => {
                  const isRequester = s.requesterId === user.id;
                  const partner = isRequester ? s.provider : s.requester;
                  return (
                    <div
                      key={s.id}
                      className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                              isRequester ? 'bg-indigo-100 text-indigo-700' : 'bg-teal-100 text-teal-800'
                            }`}
                          >
                            {isRequester ? 'Learning' : 'Teaching'}
                          </span>
                          <span className="font-bold text-sm text-slate-900">
                            {s.skill.canonicalName}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                          <span>Partner: <strong>{partner.name}</strong></span>
                          <span>•</span>
                          <span>{s.agreedTime || s.preferredTime}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span className="text-xs font-bold text-teal-700 bg-white border border-teal-200 px-2 py-1 rounded-lg">
                          {s.agreedCredits.toFixed(2)} CR
                        </span>
                        <Link
                          href="/sessions"
                          className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* User Skills Portfolio */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">My Skill Portfolio</h3>
                <p className="text-xs text-slate-500">Skills visible to peers for matchmaking</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Offered */}
              <div>
                <div className="text-xs font-bold text-teal-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" />
                  <span>Skills I Can Teach ({offered.length})</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {offered.map((s) => (
                    <span
                      key={s.id}
                      className="px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs font-semibold"
                    >
                      {s.skill.canonicalName}{' '}
                      <span className="text-teal-600 font-normal">({s.proficiency.toLowerCase()})</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Wanted */}
              <div>
                <div className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Skills I Want to Learn ({wanted.length})</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {wanted.map((s) => (
                    <span
                      key={s.id}
                      className="px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-semibold"
                    >
                      {s.skill.canonicalName}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 4 cols: Recent Ledger & Peer Feedback */}
        <div className="lg:col-span-4 space-y-6">
          {/* Recent Ledger */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Recent Ledger</h3>
              <Link href="/wallet" className="text-xs text-teal-600 font-semibold hover:underline">
                Full ledger →
              </Link>
            </div>

            <div className="space-y-2.5 font-sans">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-800 text-[11px] line-clamp-1">
                      {tx.description}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {new Date(tx.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                  <span
                    className={`font-mono font-bold text-xs shrink-0 ${
                      tx.amount > 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {tx.amount > 0 ? `+${tx.amount.toFixed(2)}` : tx.amount.toFixed(2)} CR
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Received Reviews */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Peer Reviews</h3>
            {reviews.length === 0 ? (
              <p className="text-xs text-slate-400">No reviews received yet.</p>
            ) : (
              <div className="space-y-3">
                {reviews.map((r) => (
                  <div key={r.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-800">{r.reviewer.name}</span>
                      <div className="flex text-amber-500">
                        {Array.from({ length: r.score }).map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-slate-600 text-[11px] italic">"{r.reviewText}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
