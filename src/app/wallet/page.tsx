'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Coins,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  Sparkles,
  Lock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface TransactionItem {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
  swap?: {
    skill: { canonicalName: string };
    provider: { name: string };
    requester: { name: string };
  } | null;
}

interface PendingSwap {
  id: string;
  agreedCredits: number;
  status: string;
  skill: { canonicalName: string };
  provider: { name: string };
}

export default function WalletPage() {
  const [balance, setBalance] = useState<number>(0);
  const [totalEarned, setTotalEarned] = useState<number>(0);
  const [totalSpent, setTotalSpent] = useState<number>(0);
  const [pendingCommittedCredits, setPendingCommittedCredits] = useState<number>(0);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [pendingSwaps, setPendingSwaps] = useState<PendingSwap[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('ALL');

  const fetchWallet = async () => {
    try {
      const params = new URLSearchParams();
      if (typeFilter !== 'ALL') params.append('type', typeFilter);

      const res = await fetch(`/api/wallet?${params.toString()}`);
      const data = await res.json();
      if (data) {
        setBalance(data.balance || 0);
        setTotalEarned(data.totalEarned || 0);
        setTotalSpent(data.totalSpent || 0);
        setPendingCommittedCredits(data.pendingCommittedCredits || 0);
        setTransactions(data.transactions || []);
        setPendingSwaps(data.pendingSwaps || []);
      }
    } catch (err) {
      console.error('Failed to load wallet ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, [typeFilter]);

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case 'STARTING_GRANT':
        return <Badge variant="info">Starter Grant</Badge>;
      case 'EARNED':
        return <Badge variant="success">Earned Teaching</Badge>;
      case 'SPENT':
        return <Badge variant="purple">Spent Learning</Badge>;
      case 'ESCROW_HOLD':
        return <Badge variant="warning">Escrow Hold</Badge>;
      case 'ESCROW_RELEASED':
        return <Badge variant="teal">Escrow Released</Badge>;
      default:
        return <Badge variant="neutral">{type}</Badge>;
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold text-teal-600 uppercase tracking-wider mb-2">
            <Coins className="h-4 w-4" />
            <span>Non-Cash Campus Economy</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Skill Credits & Ledger
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Transparent, tamper-proof record of every hour you've shared or learned.
          </p>
        </div>

        <Link
          href="/explore"
          className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-white font-semibold text-xs hover:bg-teal-700 transition-colors shadow-sm self-start sm:self-auto"
        >
          <span>Use Credits to Learn</span>
        </Link>
      </div>

      {/* Rules Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 p-6 sm:p-7 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-400/20 border border-teal-400/30 px-3 py-0.5 text-xs font-semibold text-teal-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Campus Time Economy Principles</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">Equal Value: 1 Hour = 1.0 Skill Credit</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            All skills are valued equally by time. Teaching Python earns the same credit as teaching public speaking or design. Cash cannot buy credits, ensuring fair student access.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center">
            <div className="text-[10px] uppercase font-bold text-teal-300">Minimum Hourly Rate</div>
            <div className="text-lg font-black text-white mt-0.5">1.00 CR / hr</div>
          </div>
        </div>
      </div>

      {/* Balance Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available Balance */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Available Credits
            </span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
              <Coins className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {balance.toFixed(2)}
            </span>
            <span className="text-xs font-bold text-teal-600">Credits</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Available to spend on new swap requests</p>
        </div>

        {/* Escrow Locked */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Committed in Escrow
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Lock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-700 tracking-tight">
              {pendingCommittedCredits.toFixed(2)}
            </span>
            <span className="text-xs font-bold text-amber-600">Credits</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Locked in ongoing or pending sessions</p>
        </div>

        {/* Total Earned */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Earned
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <ArrowDownLeft className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-700 tracking-tight">
              +{totalEarned.toFixed(2)}
            </span>
            <span className="text-xs font-bold text-emerald-600">Credits</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Earned by mentoring campus peers</p>
        </div>

        {/* Total Spent */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Spent
            </span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-700 tracking-tight">
              -{totalSpent.toFixed(2)}
            </span>
            <span className="text-xs font-bold text-rose-600">Credits</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Spent receiving 1-on-1 peer teaching</p>
        </div>
      </div>

      {/* Escrow Details if active */}
      {pendingSwaps.length > 0 && (
        <div className="rounded-3xl border border-amber-200/90 bg-amber-50/50 p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-amber-900 text-sm flex items-center gap-2">
              <Lock className="h-4 w-4 text-amber-700" />
              <span>Active Escrow Commitments ({pendingSwaps.length})</span>
            </h3>
            <span className="text-xs font-semibold text-amber-800">
              Total: {pendingCommittedCredits.toFixed(2)} CR
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {pendingSwaps.map((ps) => (
              <div
                key={ps.id}
                className="p-3 rounded-2xl bg-white border border-amber-200/80 shadow-2xs flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-800">{ps.skill.canonicalName}</div>
                  <div className="text-[11px] text-slate-500">With {ps.provider.name}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-amber-700">HOLD {ps.agreedCredits.toFixed(2)} CR</div>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-medium">
                    {ps.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ledger Table Section */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Transaction Ledger</h3>
            <p className="text-xs text-slate-500">Chronological ledger entries with balance tracking</p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'ALL', label: 'All Transactions' },
              { id: 'STARTING_GRANT', label: 'Starter Grant' },
              { id: 'EARNED', label: 'Earned' },
              { id: 'SPENT', label: 'Spent' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setTypeFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  typeFilter === f.id
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading ledger entries...</div>
          ) : transactions.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No ledger transactions found for this filter.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Details / Partner</th>
                  <th className="py-3 px-3 text-right">Amount</th>
                  <th className="py-3 px-3 text-right">Balance After</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {transactions.map((tx) => {
                  const isPositive = tx.amount > 0;
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {new Date(tx.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-3">{getTransactionBadge(tx.type)}</td>
                      <td className="py-3.5 px-3">
                        <div className="font-medium text-slate-800">{tx.description}</div>
                        {tx.swap && (
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Swap: {tx.swap.skill.canonicalName} ({tx.swap.provider.name} ↔{' '}
                            {tx.swap.requester.name})
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-right whitespace-nowrap font-mono font-bold text-sm">
                        <span className={isPositive ? 'text-emerald-600' : 'text-rose-600'}>
                          {isPositive ? `+${tx.amount.toFixed(2)}` : tx.amount.toFixed(2)} CR
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right whitespace-nowrap font-mono font-semibold text-slate-600">
                        {tx.balanceAfter.toFixed(2)} CR
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
