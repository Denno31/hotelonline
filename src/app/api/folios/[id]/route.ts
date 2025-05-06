import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Find the bill and its associated check-in
    const bill = await prisma.bill.findUnique({
      where: { id: params.id },
      include: {
        checkIn: {
          include: {
            guest: true,
            room: true
          }
        },
        items: true,
        payments: true,
        company: true,
        guest: true
      }
    })

    if (!bill) {
      return NextResponse.json(
        { success: false, error: 'Bill not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: bill })
  } catch (error) {
    console.error('Error fetching folio:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
