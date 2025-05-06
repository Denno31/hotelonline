import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Prisma, Bill, Payment, PaymentMethod } from '@prisma/client'
import { Session } from 'next-auth'

type ExtendedSession = Session & {
  user?: {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

type BillWithGuest = {
  guest: { firstName: string; lastName: string }
}

type BillWithPayments = {
  payments: Payment[]
}

type BillWithPaidBills = {
  paidBills: (Bill & BillWithGuest & BillWithPayments)[]
}

type BillWithRelations = Bill & BillWithGuest & BillWithPayments & BillWithPaidBills

type PaymentInput = {
  billId: string
  amount: number
  method: PaymentMethod
  reference?: string | null
}

const billInclude = {
  guest: {
    select: {
      firstName: true,
      lastName: true
    }
  },
  payments: true,
  paidBills: {
    include: {
      guest: {
        select: {
          firstName: true,
          lastName: true
        }
      },
      payments: true
    }
  }
} as const

// POST /api/payments - Record a new payment
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions) as ExtendedSession
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { billId, amount, method, reference } = body as PaymentInput

    // Validate payment method
    if (!Object.values(PaymentMethod).includes(method)) {
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

    // Get bill with linked bills
    const mainBill = await prisma.bill.findUnique({
      where: { id: billId },
      include: billInclude
    }) as BillWithRelations

    if (!mainBill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 })
    }

    // Calculate total paid and remaining balance for main bill
    const mainBillPaid = mainBill.payments.reduce((sum: number, p: Payment) => sum + p.amount, 0)
    const mainBillRemaining = mainBill.total - mainBillPaid

    // Calculate total remaining amount including paid bills
    const totalRemaining = mainBillRemaining + mainBill.paidBills.reduce((sum: number, bill: Bill & BillWithPayments) => {
      const paidAmount = bill.payments.reduce((paid: number, p: Payment) => paid + p.amount, 0)
      return sum + (bill.total - paidAmount)
    }, 0)

    if (amount > totalRemaining) {
      return NextResponse.json(
        { error: 'Payment amount exceeds total remaining balance' },
        { status: 400 }
      )
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        billId: mainBill.id,
        amount,
        method,
        reference: reference ?? null,
        date: new Date(),
        shiftId: userId
      }
    })

    // Update bill status if fully paid
    if (mainBillPaid + amount >= mainBill.total) {
      await prisma.bill.update({
        where: { id: mainBill.id },
        data: { status: 'PAID' }
      })
    }

    return NextResponse.json({
      success: true,
      payment,
      totalRemaining,
      mainBillRemaining,
      linkedBillsRemaining: totalRemaining - mainBillRemaining
    })
  } catch (error) {
    console.error('Error processing payment:', error)
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    )
  }
}
