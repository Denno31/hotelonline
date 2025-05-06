import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import { Toaster } from 'react-hot-toast';
import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]/route';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Hotel Management System',
  description: 'Modern cloud-based hotel management system',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers session={session}>
          <Toaster />
          <div className="flex h-screen overflow-hidden">
            {/* Sidebar for desktop */}
            <div className="hidden md:flex">
              <Sidebar />
            </div>

            {/* Main content */}
            <div className="flex flex-col flex-1 w-full overflow-x-hidden">
              <Navbar />
              <main className="flex-1 overflow-y-auto bg-gray-50 px-4 py-8">
                {children}
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
