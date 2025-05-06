'use client'

import { useState } from 'react'
import Modal from '../shared/Modal'

interface LinkedBill {
  id: string
  total: number
  guest: {
    firstName: string
    lastName: string
  }
  payments: Array<{
    amount: number
  }>
}

interface LinkedBill {
  id: string
  total: number
  guest: {
    firstName: string
    lastName: string
  }
  payments: Array<{
    amount: number
  }>
}

interface AddPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onPaymentAdded: () => void
  billId: string
  billTotal: number
  amountPaid: number
  linkedBills?: LinkedBill[]
}

export default function AddPaymentModal({
  isOpen,
  onClose,
  onPaymentAdded,
  billId,
  billTotal,
  amountPaid,
  linkedBills
}: AddPaymentModalProps) {
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('CASH')
  const [reference, setReference] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Calculate remaining amounts
  const mainBillRemaining = billTotal - amountPaid
  const linkedBillsRemaining = linkedBills?.reduce((sum: number, bill: LinkedBill) => {
    const paidAmount = bill.payments.reduce((paid: number, p: { amount: number }) => paid + p.amount, 0)
    return sum + (bill.total - paidAmount)
  }, 0) ?? 0
  const totalRemaining = mainBillRemaining + linkedBillsRemaining
  
  // Allow payment up to total remaining amount, even if main bill is paid
  const validationMax = totalRemaining

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
            Your Bill
          </label>
          <div className="mt-1 space-y-1">
            <div className="flex justify-between">
              <span>Total:</span>
              <span className="font-semibold">${billTotal}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Paid:</span>
              <span>${amountPaid}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Remaining:</span>
              <span>${mainBillRemaining}</span>
            </div>
          </div>
        </div>

        {linkedBills && linkedBills.length > 0 && (
          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Linked Bills You're Paying For
            </label>
            <div className="space-y-4">
              {linkedBills.map(bill => {
                const paidAmount = bill.payments.reduce((sum, p) => sum + p.amount, 0)
                const remaining = bill.total - paidAmount
                return (
                  <div key={bill.id} className="bg-purple-50 p-3 rounded-lg">
                    <div className="font-medium text-purple-900 mb-1">
                      {bill.guest.firstName} {bill.guest.lastName}
                    </div>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>Total:</span>
                        <span className="font-semibold">${bill.total}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Paid:</span>
                        <span>${paidAmount}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Remaining:</span>
                        <span>${remaining}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="border-t pt-4">
          <label className="block text-sm font-medium text-gray-700">
            Total Amount Needed
          </label>
          <div className="mt-1 text-lg font-bold text-blue-600">
            ${totalRemaining}
          </div>
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
            max={validationMax.toString()}
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
