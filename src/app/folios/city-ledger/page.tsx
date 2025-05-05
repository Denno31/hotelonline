'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'

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
    payments: Array<{
      id: string
      amount: number
      date: string
    }>
  }>
}

export default function CityLedgerPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCompanies = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/companies?withActiveBills=true')
      const data = await response.json()
      
      if (data.success) {
        setCompanies(data.data)
      } else {
        setError(data.message || 'Failed to load companies')
      }
    } catch (err) {
      setError('Failed to load companies')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCompanies()
  }, [])

  if (loading) return <div className="p-8">Loading...</div>
  if (error) return <div className="p-8 text-red-500">{error}</div>

  return (
    <div className="container mx-auto p-8 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">City Ledger Folios</h1>

      <div className="grid gap-6">
        {companies.map(company => {
          const totalBilled = company.bills.reduce((sum, bill) => sum + bill.total, 0)
          const totalPaid = company.bills.reduce(
            (sum, bill) => sum + bill.payments.reduce((psum, payment) => psum + payment.amount, 0),
            0
          )
          const outstandingBalance = totalBilled - totalPaid

          return (
            <div key={company.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{company.name}</h2>
                  {company.email && (
                    <p className="text-gray-600 text-sm">{company.email}</p>
                  )}
                  {company.phone && (
                    <p className="text-gray-600 text-sm">{company.phone}</p>
                  )}
                </div>
                <a
                  href={`/folios/city-ledger/${company.id}`}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  View Details
                </a>
              </div>

              <div className="border-t pt-4 mt-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-gray-600 text-sm">Total Billed</p>
                    <p className="text-gray-900 font-semibold">
                      ${totalBilled.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Total Paid</p>
                    <p className="text-gray-900 font-semibold">
                      ${totalPaid.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Outstanding</p>
                    <p className="text-gray-900 font-semibold">
                      ${outstandingBalance.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-gray-600 text-sm mb-2">Active Bills ({company.bills.length})</p>
                <div className="space-y-2">
                  {company.bills.map(bill => (
                    <div key={bill.id} className="text-sm text-gray-600 flex justify-between">
                      <span>
                        {bill.guest.firstName} {bill.guest.lastName} - Room {bill.room.number}
                      </span>
                      <span>${bill.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
