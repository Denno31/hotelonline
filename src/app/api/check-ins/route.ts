import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'


type CheckInResponse = {
  success: boolean
  data?: any
  error?: string
}

// POST /api/check-ins - Create a new check-in
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { guestId, roomId, checkInDate, checkOutDate } = await request.json()

    if (!guestId || !roomId || !checkInDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create check-in and update room status in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Get room details for billing
      const room = await tx.room.findUnique({
        where: { id: roomId },
        select: {
          rate: true,
          number: true,
          type: true
        }
      })

      if (!room) {
        throw new Error('Room not found')
      }

      // Create the check-in first
      const newCheckIn = await tx.checkIn.create({
        data: {
          guest: { connect: { id: guestId } },
          room: { connect: { id: roomId } },
          checkInDate: new Date(checkInDate),
          checkOutDate: checkOutDate ? new Date(checkOutDate) : null,
          status: 'ACTIVE'
        }
      })

      // Create initial bill
      const bill = await tx.bill.create({
        data: {
          guest: { connect: { id: guestId } },
          room: { connect: { id: roomId } },
          checkIn: { connect: { id: newCheckIn.id } },
          total: room.rate,
          status: 'PENDING',
          checkInDate: new Date(checkInDate),
          checkOutDate: checkOutDate ? new Date(checkOutDate) : null,
          items: {
            create: [
              {
                description: `Room ${room.number} - First Day`,
                amount: room.rate,
                type: 'ACCOMMODATION',
                date: new Date(checkInDate)
              }
            ]
          }
        }
      })

      // Update room status to OCCUPIED
      await tx.room.update({
        where: { id: roomId },
        data: { status: 'OCCUPIED' }
      })

      // Fetch complete check-in details
      const checkInWithDetails = await tx.checkIn.findUnique({
        where: { id: newCheckIn.id },
        include: {
          guest: true,
          room: true,
          bill: {
            include: {
              items: true,
              payments: {
                select: {
                  amount: true,
                  method: true,
                  date: true,
                  reference: true
                }
              }
            }
          }
        }
      })

      return checkInWithDetails
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Error creating check-in:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/check-ins - Get all active check-ins
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ data: [], error: 'Unauthorized' }, { status: 401 })
    }

    const checkIns = await prisma.checkIn.findMany({
      where: { status: 'ACTIVE' },
      include: {
        guest: true,
        room: true,
        bill: {
          include: {
            items: true,
            payments: true
          }
        }
      },
      orderBy: { checkInDate: 'desc' }
    })

    return NextResponse.json({ data: checkIns, success: true })
  } catch (error) {
    console.error('Error fetching check-ins:', error)
    return NextResponse.json(
      { data: [], error: 'Internal server error' },
      { status: 500 }
    )
  }
}
