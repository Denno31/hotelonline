'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import AddPaymentModal from '@/components/payments/AddPaymentModal'
import AddChargeModal from '@/components/bills/AddChargeModal'

interface CheckIn {
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
  bill: {
    id: string
    total: number
    status: string
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
  }
}

export default function GuestFolioPage() {
  const params = useParams()
  const [checkIn, setCheckIn] = useState<CheckIn | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isChargeModalOpen, setIsChargeModalOpen] = useState(false)
  const router = useRouter()

  const fetchFolioData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/check-ins?id=${params.id}`)
      const data = await response.json()
      
      if (data.success && data.data.length > 0) {
        setCheckIn(data.data[0])
      } else {
        setError('Check-in not found')
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
  if (!checkIn) return <div className="p-8">No data found</div>

  const outstandingBalance = checkIn.bill.total - 
    checkIn.bill.payments.reduce((sum, payment) => sum + payment.amount, 0)

  return (
    <div className="container mx-auto p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold mb-2 text-gray-900">
            Guest Folio - {checkIn.guest.firstName} {checkIn.guest.lastName}
          </h1>
          <p className="text-gray-600">
            Room {checkIn.room.number} - {checkIn.room.type}
          </p>
        </div>
        <button
          onClick={() => router.back()}
          className="bg-gray-100 text-gray-600 px-4 py-2 rounded hover:bg-gray-200"
        >
          Back to Check-ins
        </button>
      </div>

      {/* Guest Information */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Guest Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600">Name</p>
            <p className="text-gray-900">{checkIn.guest.firstName} {checkIn.guest.lastName}</p>
          </div>
          <div>
            <p className="text-gray-600">Email</p>
            <p className="text-gray-900">{checkIn.guest.email || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-600">Phone</p>
            <p className="text-gray-900">{checkIn.guest.phone || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-600">Check-in Date</p>
            <p className="text-gray-900">{format(new Date(checkIn.checkInDate), 'MMM dd, yyyy')}</p>
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
            <span className="text-gray-900">${checkIn.bill.total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-gray-700">Total Payments</span>
            <span className="text-gray-900">${checkIn.bill.payments.reduce((sum, payment) => sum + payment.amount, 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span className="text-gray-900">Outstanding Balance</span>
            <span className="text-gray-900">${outstandingBalance.toFixed(2)}</span>
          </div>
        </div>
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
            {checkIn.bill.items.map(item => (
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
            {checkIn.bill.payments.map(payment => (
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
      {checkIn.bill && (
        <>
          <AddChargeModal
            isOpen={isChargeModalOpen}
            onClose={() => setIsChargeModalOpen(false)}
            onChargeAdded={() => {
              setIsChargeModalOpen(false)
              fetchFolioData()
            }}
            billId={checkIn.bill.id}
          />
          <AddPaymentModal
            isOpen={isPaymentModalOpen}
            onClose={() => setIsPaymentModalOpen(false)}
            onPaymentAdded={() => {
              setIsPaymentModalOpen(false)
              fetchFolioData()
            }}
            billId={checkIn.bill.id}
            billTotal={checkIn.bill.total}
            amountPaid={checkIn.bill.payments.reduce((sum, p) => sum + p.amount, 0)}
          />
        </>
      )}
    </div>
  )
}
