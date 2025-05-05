'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function SystemPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }
    if (status === 'authenticated' && session?.user.role !== 'ADMIN') {
      router.push('/')
      return
    }
    if (status === 'authenticated') {
      fetchSystemDate()
    }
  }, [status, session, router])

  const fetchSystemDate = async () => {
    try {
      const response = await fetch('/api/system-date')
      const data = await response.json()
      if (data) {
        setCurrentDate(new Date(data.currentDate).toLocaleDateString())
      }
    } catch (error) {
      console.error('Error fetching system date:', error)
    } finally {
      setLoading(false)
    }
  }

  const advanceDay = async () => {
    try {
      await fetch('/api/system-date', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ advanceDays: 1 }),
      })
      fetchSystemDate()
    } catch (error) {
      console.error('Error advancing day:', error)
    }
  }

  const setSpecificDate = async (date: string) => {
    try {
      await fetch('/api/system-date', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date }),
      })
      fetchSystemDate()
    } catch (error) {
      console.error('Error setting date:', error)
    }
  }

  if (loading) {
    return <div className="p-4">Loading...</div>
  }

  if (session?.user.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">System Control</h1>

      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Current System Date
          </h2>
          <p className="text-gray-600 text-xl">{currentDate}</p>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-md font-semibold text-gray-900 mb-2">
              Set Specific Date
            </h3>
            <input
              type="date"
              onChange={(e) => setSpecificDate(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2"
            />
          </div>

          <div>
            <h3 className="text-md font-semibold text-gray-900 mb-2">
              Quick Actions
            </h3>
            <button
              onClick={advanceDay}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Advance One Day
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
