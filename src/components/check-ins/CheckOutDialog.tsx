'use client'

import { Dialog } from '@headlessui/react'
import { useState } from 'react'
import { toast } from 'react-hot-toast'

type CheckOutDialogProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  checkInId: string
  hasOutstandingBalance: boolean
  isCompanyBill: boolean
  remainingBalance: number
}

export function CheckOutDialog({
  isOpen,
  onClose,
  onSuccess,
  checkInId,
  hasOutstandingBalance,
  isCompanyBill,
  remainingBalance
}: CheckOutDialogProps) {
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
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md rounded bg-white p-6">
          <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
            Confirm Check-out
          </Dialog.Title>

          <div className="mb-6">
            {hasOutstandingBalance ? (
              isCompanyBill ? (
                <div className="text-yellow-600">
                  <p>This guest has an outstanding balance of ${remainingBalance.toFixed(2)}</p>
                  <p className="mt-2">However, the bill is assigned to a company, so check-out is allowed.</p>
                </div>
              ) : (
                <div className="text-red-600">
                  <p>Cannot check out. Guest has an outstanding balance of ${remainingBalance.toFixed(2)}</p>
                  <p className="mt-2">Please collect payment before checking out.</p>
                </div>
              )
            ) : (
              <p className="text-gray-600">Are you sure you want to check out this guest?</p>
            )}
          </div>

          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleCheckOut}
              disabled={isLoading || (hasOutstandingBalance && !isCompanyBill)}
              className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing...' : 'Confirm Check-out'}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}
