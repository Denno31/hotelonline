'use client'

import { useState } from 'react'

import { toast } from 'react-hot-toast'

export function AdvanceDay() {
  const [isLoading, setIsLoading] = useState(false)

  const handleAdvanceDay = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/system/advance-day', {
        method: 'POST'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error)
      }

      toast.success('Day advanced successfully')
      // Refresh the page to show updated data
      window.location.reload()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={handleAdvanceDay}
        disabled={isLoading}
        className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Advancing...' : 'Advance Day'}
      </button>
    </div>
  )
}
