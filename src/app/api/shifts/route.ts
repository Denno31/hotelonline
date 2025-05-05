import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/shifts - Get current shift for user
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        currentShift: {
          include: {
            payments: true,
            checkIns: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user.currentShift)
  } catch (error) {
    console.error('Error fetching current shift:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/shifts - Start a new shift
export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { currentShift: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.currentShift) {
      return NextResponse.json(
        { error: 'User already has an active shift' },
        { status: 400 }
      )
    }

    const systemDate = await prisma.systemDate.findFirst({
      orderBy: { currentDate: 'desc' }
    })

    if (!systemDate) {
      return NextResponse.json(
        { error: 'System date not set' },
        { status: 400 }
      )
    }

    const shift = await prisma.$transaction(async (tx) => {
      // Create new shift
      const shift = await tx.shift.create({
        data: {
          userId: user.id,
          startTime: systemDate.currentDate,
          status: 'ACTIVE'
        }
      })

      // Update user's current shift
      await tx.user.update({
        where: { id: user.id },
        data: {
          currentShiftId: shift.id
        }
      })

      return shift
    })

    return NextResponse.json(shift)
  } catch (error) {
    console.error('Error starting shift:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/shifts - End current shift
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { cashInHand } = body

    if (typeof cashInHand !== 'number' || cashInHand < 0) {
      return NextResponse.json(
        { error: 'Invalid cash in hand amount' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { currentShift: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.currentShift) {
      return NextResponse.json(
        { error: 'No active shift found' },
        { status: 400 }
      )
    }

    const systemDate = await prisma.systemDate.findFirst({
      orderBy: { currentDate: 'desc' }
    })

    if (!systemDate) {
      return NextResponse.json(
        { error: 'System date not set' },
        { status: 400 }
      )
    }

    const shift = await prisma.$transaction(async (tx) => {
      // End the shift
      const shift = await tx.shift.update({
        where: { id: user.currentShift!.id },
        data: {
          endTime: systemDate.currentDate,
          cashInHand,
          status: 'ENDED'
        }
      })

      // Remove current shift from user
      await tx.user.update({
        where: { id: user.id },
        data: {
          currentShiftId: null
        }
      })

      return shift
    })

    return NextResponse.json(shift)
  } catch (error) {
    console.error('Error ending shift:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
