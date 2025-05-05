'use client';

import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'

export default function Navbar() {
  const { data: session } = useSession()

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-gray-800">HotelOnline</span>
            </Link>
            {session && (
              <div className="ml-10 flex items-center space-x-4">
                <Link href="/rooms" className="text-gray-700 hover:text-gray-900">
                  Rooms
                </Link>
                <Link href="/check-ins" className="text-gray-700 hover:text-gray-900">
                  Check-ins
                </Link>
                <Link href="/bills" className="text-gray-700 hover:text-gray-900">
                  Bills
                </Link>
                {session.user.role === 'ADMIN' && (
                  <Link href="/system" className="text-gray-700 hover:text-gray-900">
                    System Control
                  </Link>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center">
            {session ? (
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">{session.user.email}</span>
                <button
                  onClick={() => signOut()}
                  className="text-gray-700 hover:text-gray-900"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link href="/auth/signin" className="text-gray-700 hover:text-gray-900">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
