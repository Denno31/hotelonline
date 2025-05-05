'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import AddPaymentModal from '@/components/payments/AddPaymentModal'
import AddChargeModal from '@/components/bills/AddChargeModal'

interface Company {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  bills: Array<{
    id: string
    total: number
    status: string
    checkInDate: string
    checkOutDate: string | null
    guest: {
      firstName: string
      lastName: string
    }
    room: {
      number: string
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
  }>
}

export default function CompanyFolioPage() {
  const params = useParams()
  const router = useRouter()
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedBill, setSelectedBill] = useState<string | null>(null)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isChargeModalOpen, setIsChargeModalOpen] = useState(false)

  const fetchCompany = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/companies/${params.id}?withBills=true`)
      const data = await response.json()
      
      if (data.success) {
        setCompany(data.data)
      } else {
        setError(data.message || 'Failed to load company')
      }
    } catch (err) {
      setError('Failed to load company')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCompany()
  }, [params.id])

  if (loading) return <div className="p-8">Loading...</div>
  if (error) return <div className="p-8 text-red-500">{error}</div>
  if (!company) return <div className="p-8">Company not found</div>

  const totalBilled = company.bills.reduce((sum, bill) => sum + bill.total, 0)
  const totalPaid = company.bills.reduce(
    (sum, bill) => sum + bill.payments.reduce((psum, payment) => psum + payment.amount, 0),
    0
  )
  const outstandingBalance = totalBilled - totalPaid

  return (
    <div className="container mx-auto p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold mb-2 text-gray-900">
            City Ledger - {company.name}
          </h1>
          <div className="text-gray-600">
            {company.email && <p>{company.email}</p>}
            {company.phone && <p>{company.phone}</p>}
            {company.address && <p>{company.address}</p>}
          </div>
        </div>
        <button
          onClick={() => router.back()}
          className="bg-gray-100 text-gray-600 px-4 py-2 rounded hover:bg-gray-200"
        >
          Back
        </button>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Account Summary</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-gray-600">Total Billed</p>
            <p className="text-2xl font-semibold text-gray-900">
              ${totalBilled.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Total Paid</p>
            <p className="text-2xl font-semibold text-gray-900">
              ${totalPaid.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Outstanding Balance</p>
            <p className="text-2xl font-semibold text-gray-900">
              ${outstandingBalance.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Bills */}
      <div className="space-y-6">
        {company.bills.map(bill => (
          <div key={bill.id} className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {bill.guest.firstName} {bill.guest.lastName}
                  </h3>
                  <p className="text-gray-600">Room {bill.room.number}</p>
                  <p className="text-gray-600">
                    {format(new Date(bill.checkInDate), 'MMM dd, yyyy')} - 
                    {bill.checkOutDate 
                      ? format(new Date(bill.checkOutDate), 'MMM dd, yyyy')
                      : 'Present'
                    }
                  </p>
                </div>
                <div className="space-x-2">
                  <button
                    onClick={() => {
                      setSelectedBill(bill.id)
                      setIsChargeModalOpen(true)
                    }}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    Add Charge
                  </button>
                  <button
                    onClick={() => {
                      setSelectedBill(bill.id)
                      setIsPaymentModalOpen(true)
                    }}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    Add Payment
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-gray-600 text-sm">Bill Total</p>
                  <p className="text-gray-900 font-semibold">${bill.total.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Amount Paid</p>
                  <p className="text-gray-900 font-semibold">
                    ${bill.payments.reduce((sum, payment) => sum + payment.amount, 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Status</p>
                  <p className="text-gray-900 font-semibold">{bill.status}</p>
                </div>
              </div>

              {/* Charges */}
              <div className="mt-4">
                <h4 className="text-gray-900 font-semibold mb-2">Charges</h4>
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="pb-2 text-gray-600">Date</th>
                      <th className="pb-2 text-gray-600">Description</th>
                      <th className="pb-2 text-gray-600">Type</th>
                      <th className="pb-2 text-right text-gray-600">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bill.items.map(item => (
                      <tr key={item.id} className="border-b">
                        <td className="py-2 text-gray-900">
                          {format(new Date(item.date), 'MMM dd, yyyy')}
                        </td>
                        <td className="py-2 text-gray-900">{item.description}</td>
                        <td className="py-2 text-gray-900">{item.type}</td>
                        <td className="py-2 text-right text-gray-900">
                          ${item.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Payments */}
              <div className="mt-4">
                <h4 className="text-gray-900 font-semibold mb-2">Payments</h4>
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="pb-2 text-gray-600">Date</th>
                      <th className="pb-2 text-gray-600">Method</th>
                      <th className="pb-2 text-gray-600">Reference</th>
                      <th className="pb-2 text-right text-gray-600">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bill.payments.map(payment => (
                      <tr key={payment.id} className="border-b">
                        <td className="py-2 text-gray-900">
                          {format(new Date(payment.date), 'MMM dd, yyyy')}
                        </td>
                        <td className="py-2 text-gray-900">{payment.method}</td>
                        <td className="py-2 text-gray-900">{payment.reference || '-'}</td>
                        <td className="py-2 text-right text-gray-900">
                          ${payment.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
      {selectedBill && (
        <>
          <AddChargeModal
            isOpen={isChargeModalOpen}
            onClose={() => {
              setIsChargeModalOpen(false)
              setSelectedBill(null)
            }}
            onChargeAdded={() => {
              setIsChargeModalOpen(false)
              setSelectedBill(null)
              fetchCompany()
            }}
            billId={selectedBill}
          />
          <AddPaymentModal
            isOpen={isPaymentModalOpen}
            onClose={() => {
              setIsPaymentModalOpen(false)
              setSelectedBill(null)
            }}
            onPaymentAdded={() => {
              setIsPaymentModalOpen(false)
              setSelectedBill(null)
              fetchCompany()
            }}
            billId={selectedBill}
            billTotal={company.bills.find(b => b.id === selectedBill)?.total || 0}
            amountPaid={
              company.bills
                .find(b => b.id === selectedBill)
                ?.payments.reduce((sum, p) => sum + p.amount, 0) || 0
            }
          />
        </>
      )}
    </div>
  )
}
