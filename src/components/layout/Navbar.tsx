'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sparkles,
  Search,
  Users,
  Calendar,
  MessageSquare,
  Coins,
  Bell,
  User,
  Settings,
  Menu,
  X,
  LogOut,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';

interface NavbarProps {
  user?: {
    id: string;
    name: string;
    email: string;
    creditBalance: number;
    avatarInitial?: string | null;
  } | null;
  unreadNotificationsCount?: number;
  unreadMessagesCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  unreadNotificationsCount = 0,
  unreadMessagesCount = 0,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: Layers },
    { href: '/explore', label: 'Explore Skills', icon: Search },
    { href: '/matches', label: 'My Matches', icon: Users },
    { href: '/sessions', label: 'Sessions', icon: Calendar },
    {
      href: '/messages',
      label: 'Messages',
      icon: MessageSquare,
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined,
    },
    { href: '/wallet', label: 'Wallet', icon: Coins },
  ];

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/';
    } catch {
      window.location.href = '/';
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90 transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <a href={user ? '/dashboard' : '/'} className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-teal-600 to-teal-500 text-white shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Skill<span className="text-teal-600">Swap</span>
              </span>
              <span className="hidden sm:block text-[10px] tracking-wide text-slate-400 font-medium uppercase">
                Campus Exchange
              </span>
            </div>
          </a>

          {/* Desktop Navigation */}
          {user && (
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
              {navLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className="relative flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
                  >
                    <Icon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    <span>{item.label}</span>
                    {item.badge !== undefined && (
                      <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-teal-600 px-1 text-[10px] font-bold text-white">
                        {item.badge}
                      </span>
                    )}
                  </a>
                );
              })}
            </nav>
          )}
        </div>

        {/* User / Auth Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* Wallet Badge */}
              <a
                href="/wallet"
                className="flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 border border-teal-200/80 hover:bg-teal-100 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800 transition-colors"
                title="Your Non-Cash Skill Credits"
              >
                <Coins className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                <span>{user.creditBalance.toFixed(2)} Credits</span>
              </a>

              {/* Notification Bell */}
              <a
                href="/notifications"
                className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  </span>
                )}
              </a>

              {/* Profile Link */}
              <a
                href="/profile"
                className="flex items-center gap-2 rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="View Profile"
              >
                <Avatar name={user.name} initials={user.avatarInitial} size="sm" />
                <span className="hidden lg:block text-sm font-medium text-slate-700 dark:text-slate-200">
                  {user.name}
                </span>
              </a>

              {/* Settings */}
              <a
                href="/settings"
                className="hidden sm:flex rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 transition-colors"
                aria-label="Settings"
              >
                <Settings className="h-4 w-4" />
              </a>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="hidden sm:flex rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 transition-colors"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <a
                href="/login"
                className="text-sm font-medium text-slate-700 hover:text-slate-900 px-3 py-2 rounded-lg dark:text-slate-300 dark:hover:text-white"
              >
                Log In
              </a>
              <a
                href="/signup"
                className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-sm transition-all"
              >
                <span>Get Started</span>
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-6 dark:border-slate-800 dark:bg-slate-900 animate-in slide-in-from-top duration-150">
          {user ? (
            <div className="space-y-1">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3 mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar name={user.name} initials={user.avatarInitial} size="sm" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                </div>
                <Badge variant="teal">{user.creditBalance.toFixed(2)} Credits</Badge>
              </div>

              {navLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="h-4 w-4 text-slate-500" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-teal-600 px-1 text-[10px] font-bold text-white">
                        {item.badge}
                      </span>
                    )}
                  </a>
                );
              })}

              <a
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <User className="h-4 w-4 text-slate-500" />
                <span>My Profile</span>
              </a>

              <a
                href="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <Settings className="h-4 w-4 text-slate-500" />
                <span>Settings</span>
              </a>

              <button
                onClick={handleLogout}
                className="w-full mt-2 flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-lg dark:hover:bg-rose-950/30"
              >
                <LogOut className="h-4 w-4" />
                <span>Log Out</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <a
                href="/login"
                className="block w-full text-center py-2.5 text-sm font-medium text-slate-800 bg-slate-100 rounded-lg dark:bg-slate-800 dark:text-white"
              >
                Log In
              </a>
              <a
                href="/signup"
                className="block w-full text-center py-2.5 text-sm font-semibold text-white bg-teal-600 rounded-lg shadow-sm"
              >
                Sign Up for SkillSwap
              </a>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
