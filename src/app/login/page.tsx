'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, Lock, Mail, AlertCircle, Check } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const demoAccounts = [
    {
      name: 'Alex Rivera (Demo Learner)',
      email: 'demo@skillswap.edu',
      course: 'Freshman / First Year',
      initials: 'AR',
      description: 'Looking to learn Python & Figma',
    },
    {
      name: 'Maya Lin (Python Mentor)',
      email: 'maya.lin@skillswap.edu',
      course: 'CS Senior (Year 4)',
      initials: 'ML',
      description: 'Top rated Python & Algorithms mentor',
    },
    {
      name: 'Jordan Hayes (Design Lead)',
      email: 'jordan.hayes@skillswap.edu',
      course: 'Interaction Design (Year 3)',
      initials: 'JH',
      description: 'Figma & UI/UX specialist',
    },
    {
      name: 'Priya Sharma (Data & Excel)',
      email: 'priya.sharma@skillswap.edu',
      course: 'Business Analytics (Year 2)',
      initials: 'PS',
      description: 'Excel modeling & presentation pro',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const loginAsDemo = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('demopassword123');
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoEmail, password: 'demopassword123' }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Demo login failed');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-teal-50/30 to-[#fbfbf9]">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-md shadow-teal-600/20 mb-3">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back to SkillSwap
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-500">
            Log in to manage your skill swaps, session requests, and wallet ledger.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-7 shadow-xl shadow-slate-900/5">
          {error && (
            <div className="mb-5 flex items-center gap-2.5 rounded-xl bg-rose-50 border border-rose-200/80 p-3.5 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Campus Email
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm py-3 shadow-md shadow-teal-600/20 transition-all disabled:opacity-50"
            >
              {loading ? <span>Signing In...</span> : <span>Log In to SkillSwap</span>}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Quick Demo Logins */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="text-center mb-3">
              <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full">
                ⚡ 1-Click Demo Profiles
              </span>
            </div>
            <p className="text-center text-[11px] text-slate-400 mb-3">
              Click any student below to test instant login with sample data:
            </p>

            <div className="space-y-2">
              {demoAccounts.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => loginAsDemo(account.email)}
                  disabled={loading}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-teal-50/80 hover:border-teal-300 transition-all text-left group"
                >
                  <div className="flex items-center gap-2.5">
                    <Avatar name={account.name} initials={account.initials} size="sm" />
                    <div>
                      <div className="text-xs font-bold text-slate-800 group-hover:text-teal-700">
                        {account.name}
                      </div>
                      <div className="text-[11px] text-slate-500">{account.description}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    Switch →
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-slate-500">
          Don't have an account yet?{' '}
          <Link href="/signup" className="font-semibold text-teal-600 hover:text-teal-700 underline underline-offset-4">
            Sign up and get 5.0 free credits
          </Link>
        </div>
      </div>
    </div>
  );
}
