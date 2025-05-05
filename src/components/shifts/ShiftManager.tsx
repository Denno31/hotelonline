'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface Shift {
  id: string
  startTime: string
  endTime: string | null
  cashInHand: number | null
  status: 'ACTIVE' | 'ENDED'
  payments: {
    amount: number
    method: string
    date: string
  }[]
  checkIns: {
    id: string
    checkInDate: string
  }[]
}

export default function ShiftManager() {
  const { data: session } = useSession()
  const [currentShift, setCurrentShift] = useState<Shift | null>(null)
  const [cashInHand, setCashInHand] = useState('')


  // Fetch current shift
  const fetchCurrentShift = async () => {
    try {
      const response = await fetch('/api/shifts')
      const data = await response.json()
      setCurrentShift(data)
    } catch (error) {
      console.error('Error fetching shift:', error)
    }
  }

  useEffect(() => {
    fetchCurrentShift()
  }, [])

  // Start new shift
  const startShift = async () => {
    try {
      const response = await fetch('/api/shifts', {
        method: 'POST'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      await fetchCurrentShift()
      alert('Shift started successfully')
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  // End current shift
  const endShift = async () => {
    if (!cashInHand) {
      alert('Error: Please enter cash in hand amount')
      return
    }

    try {
      const response = await fetch('/api/shifts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cashInHand: parseFloat(cashInHand)
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      await fetchCurrentShift()
      setCashInHand('')
      alert('Shift ended successfully')
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  // Calculate total cash payments
  const calculateTotalCash = () => {
    if (!currentShift) return 0
    return currentShift.payments
      .filter(p => p.method === 'CASH')
      .reduce((sum, p) => sum + p.amount, 0)
  }

  if (!session) {
    return null
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-lg mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Shift Management</h2>
        <p className="text-gray-600">
          {currentShift ? 'Current shift details' : 'Start a new shift'}
        </p>
      </div>
      
      <div className="mb-6">
        {currentShift ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <p>{new Date(currentShift.startTime).toLocaleString()}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Check-ins</label>
              <p>{currentShift.checkIns.length}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Cash Payments</label>
              <p>${calculateTotalCash().toFixed(2)}</p>
            </div>
            {currentShift.status === 'ACTIVE' && (
              <div>
                <label htmlFor="cashInHand" className="block text-sm font-medium text-gray-700 mb-1">Cash in Hand</label>
                <input
                  id="cashInHand"
                  type="number"
                  value={cashInHand}
                  onChange={(e) => setCashInHand(e.target.value)}
                  placeholder="Enter cash amount"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            )}
          </div>
        ) : (
          <p>No active shift. Start a new shift to begin working.</p>
        )}
      </div>
      
      <div className="flex justify-end">
        {currentShift?.status === 'ACTIVE' ? (
          <button
            onClick={endShift}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            End Shift
          </button>
        ) : (
          <button
            onClick={startShift}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Start Shift
          </button>
        )}
      </div>
    </div>
  )
}
