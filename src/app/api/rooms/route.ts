import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/rooms - Get all rooms with their current status
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rooms = await prisma.room.findMany({
      orderBy: { number: 'asc' },
      include: {
        checkIns: {
          where: { status: 'ACTIVE' },
          include: { guest: true }
        }
      }
    })

    return NextResponse.json({ data: rooms, success: true })
  } catch (error) {
    console.error('Error fetching rooms:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/rooms - Create a new room
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { number, type, rate } = body

    // Validate room type
    const validRoomTypes = ['SINGLE', 'DOUBLE', 'SUITE', 'DELUXE']
    if (!validRoomTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid room type' },
        { status: 400 }
      )
    }

    const room = await prisma.room.create({
      data: {
        number,
        type,
        rate,
        status: 'AVAILABLE'
      }
    })

    return NextResponse.json({ data: room, success: true })
  } catch (error: any) {
    console.error('Error creating room:', error)
    
    // Handle unique constraint violation
    if (error?.code === 'P2002' && error?.meta?.target?.includes('number')) {
      return NextResponse.json(
        { error: 'A room with this number already exists' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
