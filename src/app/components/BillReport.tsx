'use client'

import React, { useRef } from 'react'
import { Bill, Guest, Payment, Room, BillItem } from '@prisma/client'
import { format } from 'date-fns'
import { useReactToPrint } from 'react-to-print'

// Extend BillItem type to include tax fields
type BillItemWithTax = BillItem & {
  taxRate: number
  taxAmount: number
  subtotal: number
  total: number
}

type BillWithDetails = {
  id: string
  guest: Guest
  room: Room
  checkIn: {
    guest: Guest
    room: Room
  } | null
  items: BillItemWithTax[]
  payments: Payment[]
  subtotal: number
  taxTotal: number
  total: number
  paid: number
  remaining: number
}

interface ReportData {
  mainBill: BillWithDetails
  generatedAt: string
}

interface BillReportProps {
  data: ReportData
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

const formatDate = (date: Date) => {
  return format(new Date(date), 'MMM dd, yyyy')
}

const BillReport: React.FC<BillReportProps> = ({ data }) => {
  const componentRef = useRef(null)
  const handlePrint = () => {
    if (componentRef.current) {
      window.print()
    }
  }

  const renderBillSection = (bill: BillWithDetails, isMainBill: boolean = false) => (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Hotel Bill
      </h2>
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <p className="text-base text-gray-700">Guest: <span className="font-medium">{bill.guest.firstName} {bill.guest.lastName}</span></p>
          <p className="text-base text-gray-700">Room: <span className="font-medium">{bill.room.number}</span></p>
          {bill.checkIn && (
            <div className="space-y-2 mt-4">
              <p className="text-base text-gray-700">Check-in Guest: <span className="font-medium">{bill.checkIn.guest.firstName} {bill.checkIn.guest.lastName}</span></p>
              <p className="text-base text-gray-700">Check-in Room: <span className="font-medium">{bill.checkIn.room.number}</span></p>
            </div>
          )}
        </div>
        <div className="text-right">
          <p className="text-base text-gray-700">Bill ID: <span className="font-medium">{bill.id}</span></p>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Item</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 uppercase tracking-wider">Quantity</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 uppercase tracking-wider">Price</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 uppercase tracking-wider">Tax Rate</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 uppercase tracking-wider">Tax Amount</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 uppercase tracking-wider">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {bill.items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3 text-base text-gray-700">{item.description}</td>
                <td className="px-4 py-3 text-base text-gray-700 text-right">{item.quantity}</td>
                <td className="px-4 py-3 text-base text-gray-700 text-right">{formatCurrency(item.amount / item.quantity)}</td>
                <td className="px-4 py-3 text-base text-gray-700 text-right">{((item as BillItemWithTax).taxRate * 100).toFixed(0)}%</td>
                <td className="px-4 py-3 text-base text-gray-700 text-right">{formatCurrency((item as BillItemWithTax).taxAmount)}</td>
                <td className="px-4 py-3 text-base text-gray-700 text-right font-medium">{formatCurrency((item as BillItemWithTax).total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4">
        <h3 className="text-xl font-bold mb-4 text-gray-800">Payments</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Method</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {bill.payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-4 py-3 text-base text-gray-700">{formatDate(payment.date)}</td>
                  <td className="px-4 py-3 text-base text-gray-700">{payment.method}</td>
                  <td className="px-4 py-3 text-base text-gray-700 text-right font-medium">{formatCurrency(payment.amount)}</td>
                  <td className="px-4 py-3 text-base text-gray-700">{payment.reference || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 text-right space-y-2">
        <p className="text-base text-gray-700">Subtotal: <span className="font-semibold">{formatCurrency(bill.subtotal)}</span></p>
        <p className="text-base text-gray-700">Tax Total: <span className="font-semibold">{formatCurrency(bill.taxTotal)}</span></p>
        <div className="border-t border-gray-200 pt-2 mt-2">
          <p className="text-base text-gray-700">Total: <span className="font-semibold">{formatCurrency(bill.total)}</span></p>
          <p className="text-base text-gray-700">Paid: <span className="font-semibold">{formatCurrency(bill.paid)}</span></p>
          <p className="text-base text-gray-700">
            Remaining: <span className="font-semibold">{formatCurrency(bill.remaining)}</span>
          </p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="bg-white rounded-lg shadow print:shadow-none print:p-0">
      <div className="p-6 print:p-0">
        <div ref={componentRef} className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-3 text-gray-800">Hotel Bill Report</h1>
            <p className="text-base text-gray-600">Generated on: {formatDate(new Date(data.generatedAt))}</p>
          </div>

          {renderBillSection(data.mainBill, true)}
        </div>

        <div className="mt-4 text-right">
          <button
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Print Report
          </button>
        </div>
      </div>
    </div>
  )
}

export default BillReport
