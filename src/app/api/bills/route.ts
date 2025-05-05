import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const calculateInitialCharge = async (roomId: string) => {
  const room = await prisma.room.findUnique({
    where: { id: roomId }
  })

  if (!room) {
    throw new Error('Room not found')
  }

  return room.rate
}

// GET /api/bills - Get all bills
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const checkInId = searchParams.get('checkInId')
    const status = searchParams.get('status')

    const bills = await prisma.bill.findMany({
      where: {
        ...(checkInId && { checkInId }),
        ...(status && { status: status as any })
      },
      include: {
        guest: true,
        company: true,
        items: true,
        payments: true,
        checkIn: {
          include: {
            room: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(bills)
  } catch (error) {
    console.error('Error fetching bills:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/bills - Create bill with initial charge
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { guestId, companyId, roomId, checkInDate, checkOutDate, status } =
      await request.json()

    // Calculate initial charge
    const initialCharge = await calculateInitialCharge(roomId)

    // Create bill with initial charge
    const bill = await prisma.$transaction(async (tx) => {
      // Create the bill
      const newBill = await tx.bill.create({
        data: {
          guest: { connect: { id: guestId } },
          ...(companyId && { company: { connect: { id: companyId } } }),
          room: { connect: { id: roomId } },
          checkInDate: new Date(checkInDate),
          checkOutDate: checkOutDate ? new Date(checkOutDate) : null,
          status,
          total: initialCharge
        }
      })

      // Add initial charge
      await tx.charge.create({
        data: {
          billId: newBill.id,
          amount: initialCharge,
          description: 'Initial room charge',
          type: 'ROOM',
          date: new Date().toISOString()
        }
      })

      return newBill
    })

    return NextResponse.json(bill)
  } catch (error) {
    console.error('Error creating bill:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/bills/:id/items - Add item to bill
export async function POST_ITEM(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { billId, description, amount, type } = body

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

    const billItem = await prisma.billItem.create({
      data: {
        billId,
        description,
        amount,
        type,
        date: systemDate.currentDate
      }
    })

    // Update bill total
    await prisma.bill.update({
      where: { id: billId },
      data: {
        total: {
          increment: amount
        }
      }
    })

    return NextResponse.json(billItem)
  } catch (error) {
    console.error('Error adding bill item:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
