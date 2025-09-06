'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import AddPaymentModal from '@/components/payments/AddPaymentModal'
import AddChargeModal from '@/components/bills/AddChargeModal'

interface Bill {
  id: string
  total: number
  status: string
  checkIn: {
    id: string
    checkInDate: string
    checkOutDate: string | null
    status: string
    guest: {
      id: string
      firstName: string
      lastName: string
      email: string
      phone: string
    }
    room: {
      id: string
      number: string
      type: string
      rate: number
    }
  }
  items: Array<{
    id: string
    description: string
    amount: number
    date: string
    type: string
  }>
  payments: Array<{
    id: string
    amount: number
    date: string
    method: string
    reference: string
  }>
  company?: {
    id: string
    name: string
  }
  guest: {
    id: string
    firstName: string
    lastName: string
  }
  paidByBill?: {
    id: string
    guest: {
      firstName: string
      lastName: string
    }
  }
  linkedBills?: Array<{
    id: string
    total: number
    payments: Array<{
      id: string
      amount: number
      date: string
      method: string
      reference: string
    }>
    guest: {
      firstName: string
      lastName: string
    }
  }>
}

export default function GuestFolioPage() {
  const params = useParams()
  const [bill, setBill] = useState<Bill | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isChargeModalOpen, setIsChargeModalOpen] = useState(false)
  const router = useRouter()

  const fetchFolioData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/folios/${params.id}`)
      const data = await response.json()
      
      if (data.success) {
        setBill(data.data)
      } else {
        setError(data.error || 'Failed to load folio')
      }
    } catch (err) {
      setError('Failed to load folio data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFolioData()
  }, [params.id])

  if (loading) return <div className="p-8">Loading...</div>
  if (error) return <div className="p-8 text-red-500">{error}</div>
  if (!bill) return <div className="p-8">No data found</div>

  const outstandingBalance = bill.total - 
    bill.payments.reduce((sum, payment) => sum + payment.amount, 0)

  return (
    <div className="container mx-auto p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold mb-2 text-gray-900">
            Guest Folio - {bill.checkIn.guest.firstName} {bill.checkIn.guest.lastName}
          </h1>
          <p className="text-gray-600">
            Room {bill.checkIn.room.number} - {bill.checkIn.room.type}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/bills/${bill.id}/report`)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
            </svg>
            Print Bill
          </button>
          <button
            onClick={() => router.back()}
            className="bg-gray-100 text-gray-600 px-4 py-2 rounded hover:bg-gray-200"
          >
            Back to Check-ins
          </button>
        </div>
      </div>

      {/* Guest Information */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Guest Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600">Name</p>
            <p className="text-gray-900">{bill.checkIn.guest.firstName} {bill.checkIn.guest.lastName}</p>
          </div>
          <div>
            <p className="text-gray-600">Email</p>
            <p className="text-gray-900">{bill.checkIn.guest.email || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-600">Phone</p>
            <p className="text-gray-900">{bill.checkIn.guest.phone || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-600">Check-in Date</p>
            <p className="text-gray-900">{format(new Date(bill.checkIn.checkInDate), 'MMM dd, yyyy')}</p>
          </div>
        </div>
      </div>

      {/* Bill Summary */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Bill Summary</h2>
          <button
            onClick={() => setIsPaymentModalOpen(true)}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Add Payment
          </button>
        </div>
        <div className="mb-4">
          <div className="flex justify-between mb-2">
            <span className="text-gray-700">Total Charges</span>
            <span className="text-gray-900">${bill.total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-gray-700">Total Payments</span>
            <span className="text-gray-900">${bill.payments.reduce((sum, payment) => sum + payment.amount, 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span className="text-gray-900">Outstanding Balance</span>
            <span className="text-gray-900">${outstandingBalance.toFixed(2)}</span>
          </div>
        </div>
        {bill.paidByBill && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-blue-800">This bill is paid by: {bill.paidByBill.guest.firstName} {bill.paidByBill.guest.lastName}</p>
          </div>
        )}
        {bill.linkedBills && bill.linkedBills.length > 0 && (
          <div className="mt-4 p-4 bg-purple-50 rounded-lg">
            <p className="text-purple-800 font-semibold mb-2">Linked Bills:</p>
            <ul className="list-disc list-inside space-y-1">
              {bill.linkedBills.map(linkedBill => (
                <li key={linkedBill.id} className="text-purple-700">
                  {linkedBill.guest.firstName} {linkedBill.guest.lastName}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Charges */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Charges</h2>
          <button
            onClick={() => setIsChargeModalOpen(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Add Charge
          </button>
        </div>
        <table className="w-full">
          <thead>
            <tr className="text-left border-b">
              <th className="pb-2 text-gray-700">Date</th>
              <th className="pb-2 text-gray-700">Description</th>
              <th className="pb-2 text-gray-700">Type</th>
              <th className="pb-2 text-right text-gray-700">Amount</th>
            </tr>
          </thead>
          <tbody>
            {bill.items.map(item => (
              <tr key={item.id} className="border-b">
                <td className="py-2 text-gray-900">{format(new Date(item.date), 'MMM dd, yyyy')}</td>
                <td className="py-2 text-gray-900">{item.description}</td>
                <td className="py-2 text-gray-900">{item.type}</td>
                <td className="py-2 text-right text-gray-900">${item.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Payments */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Payments</h2>
        <table className="w-full">
          <thead>
            <tr className="text-left border-b">
              <th className="pb-2 text-gray-700">Date</th>
              <th className="pb-2 text-gray-700">Method</th>
              <th className="pb-2 text-gray-700">Reference</th>
              <th className="pb-2 text-right text-gray-700">Amount</th>
            </tr>
          </thead>
          <tbody>
            {bill.payments.map(payment => (
              <tr key={payment.id} className="border-b">
                <td className="py-2 text-gray-900">{format(new Date(payment.date), 'MMM dd, yyyy')}</td>
                <td className="py-2 text-gray-900">{payment.method}</td>
                <td className="py-2 text-gray-900">{payment.reference}</td>
                <td className="py-2 text-right text-gray-900">${payment.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <AddChargeModal
        isOpen={isChargeModalOpen}
        onClose={() => setIsChargeModalOpen(false)}
        onChargeAdded={() => {
          setIsChargeModalOpen(false)
          fetchFolioData()
        }}
        billId={bill.id}
      />
      <AddPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onPaymentAdded={() => {
          setIsPaymentModalOpen(false)
          fetchFolioData()
        }}
        billId={bill.id}
        billTotal={bill.total}
        amountPaid={bill.payments.reduce((sum, p) => sum + p.amount, 0)}
        linkedBills={bill.linkedBills}
      />
    </div>
  )
}
