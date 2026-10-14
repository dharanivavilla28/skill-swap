'use client';

import React from 'react';
import { Sparkles, Heart, Shield, BookOpen, HelpCircle } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold text-slate-900 dark:text-white">
                Skill<span className="text-teal-600">Swap</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Student-to-student skill exchange platform. Learn a skill. Share what you know. Non-cash credit ledger for fair campus peer learning.
            </p>
            <div className="text-xs text-slate-400">
              Metro State University Campus Pilot
            </div>
          </div>

          {/* Platform Col */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
              Platform
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/explore" className="hover:text-teal-600 transition-colors">
                  Explore Skills
                </a>
              </li>
              <li>
                <a href="/matches" className="hover:text-teal-600 transition-colors">
                  Transparent Matching
                </a>
              </li>
              <li>
                <a href="/wallet" className="hover:text-teal-600 transition-colors">
                  Skill Credits & Ledger
                </a>
              </li>
              <li>
                <a href="/sessions" className="hover:text-teal-600 transition-colors">
                  Swap Sessions
                </a>
              </li>
            </ul>
          </div>

          {/* Trust & Community Col */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
              Trust & Safety
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/community-guidelines" className="hover:text-teal-600 transition-colors flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-teal-600" />
                  <span>Community Guidelines</span>
                </a>
              </li>
              <li>
                <a href="/how-matching-works" className="hover:text-teal-600 transition-colors flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-teal-600" />
                  <span>Explainable Match Engine</span>
                </a>
              </li>
              <li>
                <a href="/help" className="hover:text-teal-600 transition-colors flex items-center gap-1.5">
                  <HelpCircle className="h-3.5 w-3.5 text-teal-600" />
                  <span>Student Support & FAQ</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Legal / Campus Ethics Col */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
              Ethical Standards
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">
              SkillSwap credits are purely non-monetary accounting units. No cash exchange or commercial services are permitted.
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
              <a href="/privacy" className="hover:underline">Privacy Policy</a>
              <a href="/terms" className="hover:underline">Terms of Service</a>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 dark:border-slate-800">
          <p>© {new Date().getFullYear()} SkillSwap. Built for campus peer collaboration.</p>
          <p className="mt-2 sm:mt-0 flex items-center gap-1">
            Made with <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" /> for university learners.
          </p>
        </div>
      </div>
    </footer>
  );
};
