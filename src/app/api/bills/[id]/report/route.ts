import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Bill, Payment } from '@prisma/client'

// GET /api/bills/[id]/report - Get bill report data
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const billId = params.id

    // Get bill with all related data
    const bill = await prisma.bill.findUnique({
      where: { id: billId },
      include: {
        guest: true,
        room: true,
        items: true,
        checkIn: {
          include: {
            guest: true,
            room: true
          }
        },
        payments: {
          orderBy: {
            date: 'asc'
          }
        }
      }
    })

    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 })
    }

    // Calculate totals
    const mainBillTotal = bill.total
    const mainBillPaid = bill.payments.reduce((sum: number, p) => sum + p.amount, 0)
    const mainBillRemaining = mainBillTotal - mainBillPaid

    // Format report data
    const reportData = {
      mainBill: {
        id: bill.id,
        guest: bill.guest,
        room: bill.room,
        checkIn: bill.checkIn,
        items: bill.items,
        payments: bill.payments,
        total: mainBillTotal,
        paid: mainBillPaid,
        remaining: mainBillRemaining
      },
      generatedAt: new Date().toISOString()
    }

    return NextResponse.json(reportData)
  } catch (error) {
    console.error('Error generating bill report:', error)
    return NextResponse.json(
      { error: 'Failed to generate bill report' },
      { status: 500 }
    )
  }
}
