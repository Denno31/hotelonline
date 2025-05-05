import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'



// GET /api/system-date - Get current system date
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const systemDate = await prisma.systemDate.findFirst({
      orderBy: { currentDate: 'desc' }
    })

    return NextResponse.json(systemDate)
  } catch (error) {
    console.error('Error fetching system date:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/system-date - Set or advance system date
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { date, advanceDays } = body

    let newDate: Date

    if (date) {
      // Set specific date
      newDate = new Date(date)
    } else if (advanceDays) {
      // Advance current system date by specified days
      const currentSystemDate = await prisma.systemDate.findFirst({
        orderBy: { currentDate: 'desc' }
      })

      if (!currentSystemDate) {
        newDate = new Date() // If no system date exists, start from today
      } else {
        newDate = new Date(currentSystemDate.currentDate)
        newDate.setDate(newDate.getDate() + advanceDays)
      }
    } else {
      return NextResponse.json(
        { error: 'Either date or advanceDays must be provided' },
        { status: 400 }
      )
    }

    // Create new system date record
    const systemDate = await prisma.systemDate.create({
      data: {
        currentDate: newDate
      }
    })

    // Add accommodation charges for active check-ins
    await prisma.$transaction(async (tx: any) => {
      const activeCheckIns = await tx.checkIn.findMany({
        where: { status: 'ACTIVE' },
        include: {
          room: true,
          bills: {
            where: { status: { in: ['PENDING', 'PARTIALLY_PAID'] } }
          }
        }
      })

      for (const checkIn of activeCheckIns) {
        if (checkIn.bills.length > 0) {
          const activeBill = checkIn.bills[0] // Get the most recent bill

          await tx.billItem.create({
            data: {
              billId: activeBill.id,
              description: `Room ${checkIn.room.number} - Daily Charge`,
              amount: checkIn.room.rate,
              type: 'ACCOMMODATION',
              date: newDate
            }
          })

          await tx.bill.update({
            where: { id: activeBill.id },
            data: {
              total: { increment: checkIn.room.rate }
            }
          })
        }
      }
    })

    return NextResponse.json(systemDate)
  } catch (error) {
    console.error('Error updating system date:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
