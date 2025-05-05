'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import CheckInModal from '@/components/check-in/CheckInModal'
import AddPaymentModal from '@/components/payments/AddPaymentModal'

interface CheckIn {
  id: string
  checkInDate: string
  checkOutDate: string | null
  status: string
  guest: {
    firstName: string
    lastName: string
    company?: {
      name: string
    }
  }
  room: {
    number: string
    type: string
    rate: number
  }
  bill?: {
    id: string
    total: number
    status: string
    items: Array<{
      description: string
      amount: number
      type: string
    }>
    payments?: Array<{
      id: string
      amount: number
      method: string
      reference?: string
      date: string
    }>
  }
}

export default function CheckInsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [loading, setLoading] = useState(true)
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [selectedBill, setSelectedBill] = useState<{ id: string; total: number; amountPaid: number } | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    fetchCheckIns()
  }, [])

  const fetchCheckIns = async () => {
    try {
      const response = await fetch('/api/check-ins')
      const result = await response.json()
      setCheckIns(result.data || [])
    } catch (error) {
      console.error('Error fetching check-ins:', error)
      setCheckIns([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-4">Loading...</div>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Active Check-ins</h1>
        <button
          onClick={() => setIsCheckInModalOpen(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          New Check-in
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {checkIns.map((checkIn) => (
          <div
            key={checkIn.id}
            className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 className="font-semibold text-gray-900">Guest Information</h3>
                <p className="text-gray-600">
                  {checkIn.guest.firstName} {checkIn.guest.lastName}
                </p>
                {checkIn.guest.company && (
                  <p className="text-gray-600">
                    Company: {checkIn.guest.company.name}
                  </p>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-gray-900">Room Details</h3>
                <p className="text-gray-600">Room {checkIn.room.number}</p>
                <p className="text-gray-600">
                  {checkIn.room.type} - ${checkIn.room.rate}/night
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900">Stay Information</h3>
                <p className="text-gray-600">
                  Check-in: {new Date(checkIn.checkInDate).toLocaleDateString()}
                </p>
                {checkIn.checkOutDate && (
                  <p className="text-gray-600">
                    Check-out:{' '}
                    {new Date(checkIn.checkOutDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>

            {checkIn.bill && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">Current Bill</h3>
                <div className="space-y-2">
                  {checkIn.bill.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between text-gray-600"
                    >
                      <span>{item.description}</span>
                      <span>${item.amount}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-semibold pt-2 border-t border-gray-200">
                    <span>Total</span>
                    <span>${checkIn.bill.total}</span>
                  </div>
                  {checkIn.bill.payments && checkIn.bill.payments.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Payment History</h4>
                      {checkIn.bill.payments.map((payment) => (
                        <div key={payment.id} className="flex justify-between text-sm text-gray-600">
                          <span>{new Date(payment.date).toLocaleDateString()} - {payment.method}</span>
                          <span>${payment.amount}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 flex justify-end space-x-4">
                  <button
                    onClick={() => {
                      if (checkIn.bill) {
                        const totalPaid = checkIn.bill.payments?.reduce((sum, p) => sum + p.amount, 0) || 0
                        setSelectedBill({
                          id: checkIn.bill.id,
                          total: checkIn.bill.total,
                          amountPaid: totalPaid
                        })
                        setIsPaymentModalOpen(true)
                      }
                    }}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    Add Payment
                  </button>
                  <button
                    onClick={() => {/* TODO: Implement check-out */}}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                  >
                    Check Out
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <CheckInModal
        isOpen={isCheckInModalOpen}
        onClose={() => setIsCheckInModalOpen(false)}
        onCheckIn={fetchCheckIns}
      />

      {selectedBill && (
        <AddPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false)
            setSelectedBill(null)
          }}
          onPaymentAdded={fetchCheckIns}
          billId={selectedBill.id}
          billTotal={selectedBill.total}
          amountPaid={selectedBill.amountPaid}
        />
      )}
    </div>
  )
}
