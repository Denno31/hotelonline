'use client'

import { useState } from 'react'
import Modal from '../shared/Modal'

interface AddPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onPaymentAdded: () => void
  billId: string
  billTotal: number
  amountPaid: number
}

export default function AddPaymentModal({
  isOpen,
  onClose,
  onPaymentAdded,
  billId,
  billTotal,
  amountPaid
}: AddPaymentModalProps) {
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('CASH')
  const [reference, setReference] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const remainingAmount = billTotal - amountPaid

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          billId,
          amount: parseFloat(amount),
          method,
          reference: reference || undefined
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add payment')
      }
      
      console.log('Payment response:', data)

      onPaymentAdded()
      onClose()
    } catch (error) {
      console.error('Error adding payment:', error)
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError('Failed to add payment')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Payment">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Bill Total
          </label>
          <div className="mt-1 text-lg font-semibold">${billTotal}</div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Amount Paid So Far
          </label>
          <div className="mt-1 text-lg font-semibold">${amountPaid}</div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Remaining Balance
          </label>
          <div className="mt-1 text-lg font-semibold">${remainingAmount}</div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Payment Amount
          </label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
            max={remainingAmount}
            min={0.01}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Payment Method
          </label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option value="CASH">Cash</option>
            <option value="CREDIT_CARD">Credit Card</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="MOBILE_MONEY">Mobile Money</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Reference Number (Optional)
          </label>
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Transaction reference, receipt number, etc."
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !amount}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Add Payment'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
