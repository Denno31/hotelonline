import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { CheckInStatus } from '@prisma/client'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if there's any active shift
    const activeShift = await prisma.shift.findFirst({
      // @ts-ignore - Prisma types are incorrect
      where: {
        status: 'ACTIVE'
      },
      include: {
        user: true
      }
    })

    if (activeShift) {
      return NextResponse.json({
        error: `There is an active shift by ${activeShift.user.firstName} ${activeShift.user.lastName}. All shifts must be ended before advancing the day.`
      }, { status: 400 })
    }

    // Check for any due check-outs
    const dueCheckOuts = await prisma.checkIn.findMany({
      where: {
        status: CheckInStatus.ACTIVE,
        checkOutDate: {
          lte: new Date() // Check-out date is today or earlier
        }
      },
      include: {
        guest: true,
        room: true
      }
    })

    if (dueCheckOuts.length > 0) {
      const dueOutsList = dueCheckOuts.map(checkout => 
        `${checkout.guest.firstName} ${checkout.guest.lastName} in room ${checkout.room.number}`
      ).join(', ')

      return NextResponse.json({
        error: `Cannot advance day. The following guests are due to check out: ${dueOutsList}`
      }, { status: 400 })
    }

    // If all validations pass, get the current system date
    const systemDate = await prisma.systemDate.findFirst()
    if (!systemDate) {
      return NextResponse.json({ error: 'System date not found' }, { status: 500 })
    }

    // Advance the day
    const newDate = new Date(systemDate.currentDate)
    newDate.setDate(newDate.getDate() + 1)

    await prisma.systemDate.update({
      where: { id: systemDate.id },
      data: { currentDate: newDate }
    })

    return NextResponse.json({
      success: true,
      message: 'Day advanced successfully',
      newDate: newDate
    })

  } catch (error) {
    console.error('Error advancing day:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
