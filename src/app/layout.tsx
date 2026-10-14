import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'SkillSwap | Student Peer-to-Peer Skill Exchange',
  description:
    'A transparent, trust-aware student skill exchange network with a non-cash credit ledger for fair campus peer learning.',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  let unreadNotificationsCount = 0;
  let unreadMessagesCount = 0;

  if (user) {
    try {
      unreadNotificationsCount = await prisma.notification.count({
        where: { userId: user.id, isRead: false },
      });
      unreadMessagesCount = await prisma.message.count({
        where: { recipientId: user.id, isRead: false },
      });
    } catch (err) {
      console.error('Error fetching unread counts in layout:', err);
    }
  }

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#fbfbf9] text-slate-900 selection:bg-teal-100 selection:text-teal-900">
        <Navbar
          user={user}
          unreadNotificationsCount={unreadNotificationsCount}
          unreadMessagesCount={unreadMessagesCount}
        />
        <main className="flex-1 flex flex-col">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
