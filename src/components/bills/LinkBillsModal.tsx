'use client'

import { useState } from 'react'
import { Dialog } from '@headlessui/react'
import toast from 'react-hot-toast'

interface LinkBillsModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  billId: string
  checkIns: Array<{
    id: string
    guest: {
      firstName: string
      lastName: string
    }
    room: {
      number: string
    }
    bill?: {
      id: string
      total: number
      paidByBill?: {
        id: string
      }
    }
  }>
}

export default function LinkBillsModal({
  isOpen,
  onClose,
  onSuccess,
  billId,
  checkIns
}: LinkBillsModalProps) {
  const [selectedCheckIn, setSelectedCheckIn] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCheckIn) return

    setLoading(true)
    try {
      const selectedBill = checkIns.find(c => c.id === selectedCheckIn)?.bill?.id
      if (!selectedBill) {
        throw new Error('Selected check-in has no bill')
      }

      const response = await fetch(`/api/bills/${billId}/link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          linkedBillId: selectedBill
        })
      })

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error || 'Failed to link bills')
      }

      toast.success('Bills linked successfully')
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error linking bills:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to link bills')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="relative bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <Dialog.Title className="text-lg font-medium mb-4">
            Link Bill to Another Guest
          </Dialog.Title>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Guest to Pay for This Bill
              </label>
              <select
                value={selectedCheckIn}
                onChange={(e) => setSelectedCheckIn(e.target.value)}
                className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                required
              >
                <option value="">Select a guest...</option>
                {checkIns
                  .filter(c => 
                    c.bill && 
                    !c.bill.paidByBill && 
                    c.bill.id !== billId
                  )
                  .map(checkIn => (
                    <option key={checkIn.id} value={checkIn.id}>
                      {checkIn.guest.firstName} {checkIn.guest.lastName} - Room {checkIn.room.number}
                    </option>
                  ))
                }
              </select>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:opacity-50"
                disabled={loading || !selectedCheckIn}
              >
                {loading ? 'Linking...' : 'Link Bills'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}
