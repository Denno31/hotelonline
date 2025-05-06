import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Payment, PaymentMethod } from '@prisma/client'

interface Bill {
  id: string
  total: number
  status: string
  guest: {
    firstName: string
    lastName: string
  }
  payments: Array<{
    id: string
    amount: number
    date: string
    method: string
    reference: string
  }>
  linkedBills: Array<{
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
    if (!Object.values(PaymentMethod).includes(method as PaymentMethod)) {
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
    if (!session.user?.email) {
      return NextResponse.json({ error: 'User email not found' }, { status: 401 })
    }

    // Get the user and their current shift
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        currentShift: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.currentShift) {
      return NextResponse.json(
        { error: 'No active shift found. Please start a shift before recording payments.' },
        { status: 400 }
      )
    }

    // Get main bill and its linked bills
    const mainBill = await prisma.bill.findUnique({
      where: { id: billId },
      include: {
        guest: true,
        payments: {
          select: {
            id: true,
            amount: true,
            method: true,
            reference: true,
            date: true
          }
        },
        linkedBills: {
          include: {
            guest: {
              select: {
                firstName: true,
                lastName: true
              }
            },
            payments: {
              select: {
                id: true,
                amount: true,
                method: true,
                reference: true,
                date: true
              }
            }
          }
        }
      }
    }) as Bill | null

    if (!mainBill) {
      return NextResponse.json(
        { error: 'Bill not found' },
        { status: 404 }
      )
    }

    // Calculate total paid and remaining balance for main bill
    const mainBillPaid = mainBill.payments.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0)
    const mainBillRemaining = mainBill.total - mainBillPaid

    // Calculate total remaining amount including linked bills
    const totalRemainingAmount = mainBillRemaining + mainBill.linkedBills.reduce((sum: number, bill: { total: number, payments: Array<{ amount: number }> }) => {
      const paidAmount = bill.payments.reduce((paid: number, p: { amount: number }) => paid + p.amount, 0)
      return sum + (bill.total - paidAmount)
    }, 0)

    if (amount > totalRemainingAmount) {
      return NextResponse.json(
        { error: 'Payment amount exceeds total remaining balance' },
        { status: 400 }
      )
    }

    const result = await prisma.$transaction(async (tx) => {
      let remainingAmount = amount
      const payments: Payment[] = []

      // First, allocate payment to main bill if needed
      if (mainBillRemaining > 0) {
        const mainBillPayment = Math.min(remainingAmount, mainBillRemaining)
        const payment = await tx.payment.create({
          data: {
            billId: mainBill.id,
            amount: mainBillPayment,
            method: method as PaymentMethod,
            reference,
            date: systemDate.currentDate,
            shiftId: user.currentShift!.id
          }
        })
        payments.push(payment)
        remainingAmount -= mainBillPayment

        // Update main bill status
        await tx.bill.update({
          where: { id: mainBill.id },
          data: {
            status: mainBillPayment >= mainBillRemaining ? 'PAID' : 'PARTIALLY_PAID'
          }
        })
      }

      // If there's remaining amount, distribute to linked bills
      if (remainingAmount > 0 && mainBill.linkedBills.length > 0) {
        for (const linkedBill of mainBill.linkedBills) {
          const linkedBillPaid = linkedBill.payments.reduce((sum: number, p: Payment) => sum + p.amount, 0)
          const linkedBillRemaining = linkedBill.total - linkedBillPaid

          if (linkedBillRemaining > 0 && remainingAmount > 0) {
            const linkedBillPayment = Math.min(remainingAmount, linkedBillRemaining)
            const payment = await tx.payment.create({
              data: {
                billId: linkedBill.id,
                amount: linkedBillPayment,
                method: method as PaymentMethod,
                reference,
                date: systemDate.currentDate,
                shiftId: user.currentShift!.id
              }
            })
            payments.push(payment)
            remainingAmount -= linkedBillPayment

            // Update linked bill status
            await tx.bill.update({
              where: { id: linkedBill.id },
              data: {
                status: linkedBillPayment >= linkedBillRemaining ? 'PAID' : 'PARTIALLY_PAID'
              }
            })
          }

          if (remainingAmount <= 0) break
        }
      }

      return {
        payments,
        remainingAmount
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error recording payment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
