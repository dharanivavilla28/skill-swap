import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Coins,
  Search,
  CheckCircle2,
  Users,
  Star,
  Clock,
  Award,
  Zap,
  BookOpen,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const user = await getCurrentUser();

  // Fetch top featured skills and popular peers for the landing page
  const featuredSkills = await prisma.skill.findMany({
    take: 8,
    include: {
      _count: {
        select: { userSkills: true },
      },
    },
    orderBy: {
      userSkills: {
        _count: 'desc',
      },
    },
  });

  const featuredPeers = await prisma.user.findMany({
    take: 3,
    where: {
      userSkills: {
        some: { type: 'OFFERED' },
      },
    },
    include: {
      userSkills: {
        where: { type: 'OFFERED' },
        include: { skill: true },
        take: 3,
      },
      receivedRatings: {
        select: { score: true },
      },
      providedSwaps: {
        where: { status: 'COMPLETED' },
        select: { id: true },
      },
    },
  });

  const categories = [
    { name: 'Technology', count: 'Python, React, Java', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { name: 'Design', count: 'Figma, UI/UX, Canva', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    { name: 'Career', count: 'Interview Prep, Resume', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { name: 'Business', count: 'Excel, Pitch Decks', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { name: 'Creative', count: 'Video Editing, Photo', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-teal-50/60 via-white to-[#fbfbf9] pt-16 pb-20 md:pt-24 md:pb-28 border-b border-slate-200/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            {/* Pill Banner */}
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50/80 px-4 py-1.5 text-xs font-semibold text-teal-800 shadow-xs mb-8">
              <span className="flex h-2 w-2 rounded-full bg-teal-500 animate-pulse"></span>
              <span>Metro State University Campus Pilot</span>
              <span className="text-teal-400">•</span>
              <span className="text-teal-700">100% Non-Cash Exchange</span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl sm:leading-[1.15]">
              Learn a skill. <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-800 bg-clip-text text-transparent">
                Share what you know.
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              SkillSwap is the fair, student-to-student peer network where your time is currency.
              Teach 1 hour to earn 1 skill credit. No cash, no exploitation—just authentic campus collaboration.
            </p>

            {/* Quick Search Bar */}
            <form
              action="/explore"
              method="GET"
              className="mt-8 mx-auto max-w-xl flex items-center p-1.5 rounded-2xl bg-white shadow-lg shadow-teal-900/5 border border-slate-200 focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20 transition-all"
            >
              <div className="flex items-center pl-3.5 text-slate-400">
                <Search className="h-5 w-5" />
              </div>
              <input
                type="text"
                name="search"
                placeholder="What skill do you want to learn? (e.g. Python, Figma, Resume Review)..."
                className="w-full px-3.5 py-2.5 text-sm sm:text-base text-slate-900 placeholder-slate-400 bg-transparent outline-none"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm px-5 py-2.5 rounded-xl transition-colors shrink-0"
              >
                <span>Search</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            {/* CTAs */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm font-medium">
              <Link
                href="/matches"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-white hover:bg-slate-800 transition-colors shadow-sm"
              >
                <Zap className="h-4 w-4 text-amber-400" />
                <span>Try Smart Matchmaker</span>
              </Link>
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
              >
                <Users className="h-4 w-4 text-teal-600" />
                <span>Browse Student Peers</span>
              </Link>
              {!user && (
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-teal-700 hover:text-teal-800 px-3 py-2 underline-offset-4 hover:underline"
                >
                  <span>Quick Demo Login</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>

            {/* Value Highlights */}
            <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left pt-8 border-t border-slate-200/60">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
                  <Coins className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">5.0 Starting Credits</div>
                  <div className="text-xs text-slate-500">Free starter grant</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">Trust Scores</div>
                  <div className="text-xs text-slate-500">Peer verified feedback</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">1 Hr = 1 Credit</div>
                  <div className="text-xs text-slate-500">Equal time valuation</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">Smart Matching</div>
                  <div className="text-xs text-slate-500">Multi-criteria scoring</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Pills Explorer */}
      <section className="py-12 bg-white border-b border-slate-200/70">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Explore by Category</h2>
              <p className="text-xs text-slate-500">Discover skills offered by fellow university peers</p>
            </div>
            <Link href="/explore" className="text-sm font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1">
              <span>View all skills</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                href={`/explore?category=${cat.name.toUpperCase()}`}
                className={`p-4 rounded-2xl border transition-all hover:scale-[1.02] hover:shadow-sm ${cat.color}`}
              >
                <div className="font-bold text-base">{cat.name}</div>
                <div className="text-xs opacity-80 mt-1 line-clamp-1">{cat.count}</div>
              </Link>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-2">Popular:</span>
            {featuredSkills.map((skill) => (
              <Link
                key={skill.id}
                href={`/explore?search=${encodeURIComponent(skill.canonicalName)}`}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 hover:bg-teal-50 hover:text-teal-700 border border-slate-200 hover:border-teal-200 text-slate-700 transition-colors"
              >
                <span>{skill.canonicalName}</span>
                <span className="text-[10px] text-slate-400">({skill._count.userSkills} peers)</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-[#fbfbf9] border-b border-slate-200/70">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-extrabold text-slate-900">How SkillSwap Works</h2>
            <p className="mt-3 text-slate-600 text-sm sm:text-base">
              A transparent, circular peer economy built specifically for college campuses.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 font-bold text-lg mb-5 border border-teal-100">
                1
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Create Your Skill Profile</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                List the skills you can offer (e.g., Python scripting, Figma wireframes) and skills you want to learn. Receive <strong>5.0 starting credits</strong> right away.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 font-bold text-lg mb-5 border border-emerald-100">
                2
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Find Matches & Book Swaps</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Our algorithm matches you based on topic relevance, mutual availability, format (online or on-campus), and trust ratings. Agree on a schedule with 1 click.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 font-bold text-lg mb-5 border border-indigo-100">
                3
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Complete Session & Earn</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Held credits are released automatically upon mutual completion. Rate your peer honestly to build campus trust and keep your skill ledger transparent.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Peer Mentors */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-10 gap-4">
            <div>
              <div className="text-xs font-bold text-teal-600 uppercase tracking-wider mb-1">Campus Community</div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Active Peer Mentors</h2>
              <p className="text-sm text-slate-500 mt-1">Connect with verified student peers ready to collaborate</p>
            </div>
            <Link
              href="/explore"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <span>Explore All Peers</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredPeers.map((peer) => {
              const reviews = peer.receivedRatings;
              const avg =
                reviews.length > 0
                  ? (reviews.reduce((a, b) => a + b.score, 0) / reviews.length).toFixed(1)
                  : 'New';

              return (
                <div
                  key={peer.id}
                  className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-300 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={peer.name} initials={peer.avatarInitial} size="lg" />
                        <div>
                          <h4 className="font-bold text-slate-900 text-base flex items-center gap-1.5">
                            {peer.name}
                            {peer.verificationStatus === 'VERIFIED' && (
                              <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
                            )}
                          </h4>
                          <p className="text-xs text-slate-500">{peer.course || peer.college}</p>
                        </div>
                      </div>
                      <Badge variant="teal" size="sm">
                        Trust {(peer.trustScore * 100).toFixed(0)}%
                      </Badge>
                    </div>

                    <div className="mt-4 flex items-center gap-4 text-xs text-slate-600">
                      <div className="flex items-center gap-1 text-amber-600 font-semibold">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span>{avg}</span>
                        <span className="text-slate-400 font-normal">({reviews.length})</span>
                      </div>
                      <div className="text-slate-300">•</div>
                      <div>
                        <strong>{peer.providedSwaps.length}</strong> swaps completed
                      </div>
                    </div>

                    {peer.bio && (
                      <p className="mt-3 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {peer.bio}
                      </p>
                    )}

                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Offers to teach:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {peer.userSkills.map((us) => (
                          <span
                            key={us.id}
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-800"
                          >
                            {us.skill.canonicalName}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <Link
                      href={`/matches?targetSkill=${encodeURIComponent(
                        peer.userSkills[0]?.skill.canonicalName || ''
                      )}`}
                      className="w-full inline-flex items-center justify-center gap-1.5 bg-teal-50 hover:bg-teal-600 text-teal-700 hover:text-white font-semibold text-xs py-2.5 rounded-xl border border-teal-200/80 transition-colors"
                    >
                      <span>Match or Request Swap</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Non-Cash Trust & Ledger Callout */}
      <section className="py-16 bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-teal-500/20 border border-teal-400/30 px-3.5 py-1 text-xs font-semibold text-teal-300 mb-6">
                <ShieldCheck className="h-4 w-4" />
                <span>Zero Cash, Fair Reciprocity</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                No money allowed. <br />
                Just pure student collaboration.
              </h2>
              <p className="mt-4 text-slate-300 text-sm sm:text-base leading-relaxed">
                SkillSwap strictly prevents cash monetization to keep peer mentoring accessible to everyone. Our immutable credit ledger ensures each participant’s contribution is recorded transparently.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-teal-600/30 p-2 text-teal-400 mt-0.5">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Escrow-Protected Exchanges</h4>
                    <p className="text-xs text-slate-400">Credits are held safely in escrow during an active swap and transferred only when both students complete the session.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-teal-600/30 p-2 text-teal-400 mt-0.5">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Trust & Feedback Ratings</h4>
                    <p className="text-xs text-slate-400">Every swap requires mutual 1–5 star reviews and verified commentary, maintaining a high-accountability campus network.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-teal-600/30 p-2 text-teal-400 mt-0.5">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Starting Balance for All</h4>
                    <p className="text-xs text-slate-400">Every new account receives 5.0 starting credits, letting you learn skills immediately even before teaching your first session.</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-700/80 flex items-center gap-4">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-500 hover:bg-teal-400 px-6 py-3 text-slate-950 font-bold text-sm transition-colors"
                >
                  <span>Join Metro State SkillSwap</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/wallet"
                  className="text-xs font-semibold text-slate-300 hover:text-white underline underline-offset-4"
                >
                  View Ledger Architecture
                </Link>
              </div>
            </div>

            {/* Visual Ledger Mockup */}
            <div className="rounded-2xl border border-slate-700 bg-slate-900/90 p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-teal-400" />
                  <span className="font-bold text-sm text-white">Campus Credit Ledger</span>
                </div>
                <span className="text-xs text-teal-400 bg-teal-950/60 border border-teal-800/80 px-2 py-0.5 rounded-full font-mono">
                  LIVE ESCROW
                </span>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/60 flex items-center justify-between">
                  <div>
                    <div className="text-slate-200 font-semibold">STARTING_GRANT</div>
                    <div className="text-[11px] text-slate-400 font-sans">New student registration grant</div>
                  </div>
                  <span className="text-emerald-400 font-bold text-sm">+5.00 CR</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/60 flex items-center justify-between">
                  <div>
                    <div className="text-slate-200 font-semibold">SWAP_COMPLETED: Python Mentoring</div>
                    <div className="text-[11px] text-slate-400 font-sans">Taught 60 mins to Maya Lin</div>
                  </div>
                  <span className="text-emerald-400 font-bold text-sm">+1.00 CR</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/60 flex items-center justify-between">
                  <div>
                    <div className="text-slate-200 font-semibold">SWAP_COMPLETED: Figma Auto-Layout</div>
                    <div className="text-[11px] text-slate-400 font-sans">Learned 45 mins from Jordan Hayes</div>
                  </div>
                  <span className="text-rose-400 font-bold text-sm">-0.75 CR</span>
                </div>

                <div className="p-3 rounded-xl bg-teal-950/40 border border-teal-800/60 flex items-center justify-between">
                  <div>
                    <div className="text-teal-200 font-semibold">ESCROW_HOLD: Public Speaking</div>
                    <div className="text-[11px] text-teal-300/80 font-sans">Session scheduled tomorrow 4:00 PM</div>
                  </div>
                  <span className="text-amber-300 font-bold text-sm">HOLD 1.00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
