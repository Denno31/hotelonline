import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { CheckInStatus, RoomStatus } from '@prisma/client'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { checkInId } = await request.json()

    if (!checkInId) {
      return NextResponse.json(
        { error: 'Check-in ID is required' },
        { status: 400 }
      )
    }

    // Get current user's active shift
    const user = await prisma.user.findUnique({
      where: { email: session.user?.email || '' },
      include: {
        currentShift: true
      }
    })

    if (!user?.currentShift) {
      return NextResponse.json(
        { error: 'No active shift found. Please start a shift before checking out guests.' },
        { status: 400 }
      )
    }

    // Get check-in details with bill
    const checkIn = await prisma.checkIn.findUnique({
      where: { id: checkInId },
      include: {
        guest: true,
        room: true,
        bill: {
          include: {
            items: true,
            payments: true,
            company: true
          }
        }
      }
    })

    if (!checkIn) {
      return NextResponse.json(
        { error: 'Check-in not found' },
        { status: 404 }
      )
    }

    if (checkIn.status !== CheckInStatus.ACTIVE) {
      return NextResponse.json(
        { error: 'Check-in is not active' },
        { status: 400 }
      )
    }

    if (!checkIn.bill) {
      return NextResponse.json(
        { error: 'No bill found for this check-in' },
        { status: 400 }
      )
    }

    // Calculate total bill and payments
    const totalBill = checkIn.bill.items.reduce((sum, item) => sum + item.amount, 0)
    const totalPaid = checkIn.bill.payments.reduce((sum, payment) => sum + payment.amount, 0)
    const remainingBalance = totalBill - totalPaid

    // Allow check-out if bill is assigned to a company
    const isCompanyBill = checkIn.bill.companyId !== null

    if (remainingBalance > 0 && !isCompanyBill) {
      return NextResponse.json(
        { 
          error: `Cannot check out. Guest has an outstanding balance of ${remainingBalance.toFixed(2)}`,
          remainingBalance
        },
        { status: 400 }
      )
    }

    // Perform check-out in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update check-in status
      const updatedCheckIn = await tx.checkIn.update({
        where: { id: checkInId },
        data: {
          status: CheckInStatus.COMPLETED,
          checkOutDate: new Date()
        }
      })

      // Update room status
      await tx.room.update({
        where: { id: checkIn.roomId },
        data: { status: RoomStatus.AVAILABLE }
      })

      return updatedCheckIn
    })

    return NextResponse.json({
      success: true,
      message: 'Check-out successful',
      data: result
    })

  } catch (error) {
    console.error('Error during check-out:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
