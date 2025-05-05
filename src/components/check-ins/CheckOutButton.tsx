'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'

type CheckOutButtonProps = {
  checkInId: string
  onSuccess?: () => void
  disabled?: boolean
}

export function CheckOutButton({ checkInId, onSuccess, disabled }: CheckOutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleCheckOut = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/check-ins/check-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ checkInId })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error)
      }

      toast.success('Check-out successful')
      onSuccess?.()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleCheckOut}
      disabled={isLoading || disabled}
      className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? 'Checking out...' : 'Check Out'}
    </button>
  )
}
