import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// POST /api/payments - Record a new payment
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { billId, amount, method, reference } = body

    // Validate payment method
    const validPaymentMethods = ['CASH', 'CREDIT_CARD', 'BANK_TRANSFER', 'MOBILE_MONEY']
    if (!validPaymentMethods.includes(method)) {
      return NextResponse.json(
        { error: 'Invalid payment method' },
        { status: 400 }
      )
    }

    // Validate amount
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid payment amount' },
        { status: 400 }
      )
    }

    // Get current system date
    const systemDate = await prisma.systemDate.findFirst({
      orderBy: { currentDate: 'desc' }
    })

    if (!systemDate) {
      return NextResponse.json(
        { error: 'System date not set' },
        { status: 400 }
      )
    }

    // First check if the bill exists and has enough remaining balance
    const bill = await prisma.bill.findUnique({
      where: { id: billId },
      include: {
        payments: true
      }
    })

    if (!bill) {
      return NextResponse.json(
        { error: 'Bill not found' },
        { status: 404 }
      )
    }

    const currentTotalPaid = bill.payments.reduce((sum, p) => sum + p.amount, 0)
    const remainingBalance = bill.total - currentTotalPaid

    if (amount > remainingBalance) {
      return NextResponse.json(
        { error: 'Payment amount exceeds remaining balance' },
        { status: 400 }
      )
    }

    const payment = await prisma.$transaction(async (tx) => {
      // Create payment record
      const payment = await tx.payment.create({
        data: {
          billId,
          amount,
          method,
          reference,
          date: systemDate.currentDate
        },
        include: {
          bill: true
        }
      })

      const newTotalPaid = currentTotalPaid + amount

      // Update bill status based on payment
      await tx.bill.update({
        where: { id: billId },
        data: {
          status: newTotalPaid >= bill.total ? 'PAID' : 'PARTIALLY_PAID'
        }
      })

      return payment
    })

    return NextResponse.json(payment)
  } catch (error) {
    console.error('Error recording payment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
