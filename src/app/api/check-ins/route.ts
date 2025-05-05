import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { CheckInStatus, RoomStatus } from '@prisma/client'


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

    const { guestId, roomId, checkInDate, checkOutDate, isCompanyBill, companyId } = await request.json()

    if (!guestId || !roomId || !checkInDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get current user's active shift
    const user = await prisma.user.findUnique({
      where: { email: session.user?.email || '' }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Get active shift
    const activeShift = await prisma.shift.findFirst({
      where: {
        userId: user.id,
        status: 'ACTIVE'
      }
    })

    if (!activeShift) {
      return NextResponse.json(
        { success: false, error: 'No active shift found. Please start a shift before creating a check-in.' },
        { status: 400 }
      )
    }

    // Check if guest already has an active check-in
    const existingCheckIn = await prisma.checkIn.findFirst({
      where: {
        guestId,
        status: CheckInStatus.ACTIVE
      },
      include: {
        room: true
      }
    })

    if (existingCheckIn) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Guest already has an active check-in in room ${existingCheckIn.room.number}` 
        },
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
          guestId,
          roomId,
          shiftId: activeShift.id,
          checkInDate: new Date(checkInDate),
          checkOutDate: checkOutDate ? new Date(checkOutDate) : null,
          status: CheckInStatus.ACTIVE
        }
      })

      // Get guest details to check for company
      const guest = await tx.guest.findUnique({
        where: { id: guestId },
        select: { companyId: true }
      })

      // Create initial bill
      const bill = await tx.bill.create({
        data: {
          guestId,
          roomId,
          checkInId: newCheckIn.id,
          ...(isCompanyBill && companyId ? { companyId } : {}),
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
        data: { status: RoomStatus.OCCUPIED }
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
              payments: true,
              company: true
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
      where: { status: CheckInStatus.ACTIVE },
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
