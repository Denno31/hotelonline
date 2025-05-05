import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Prisma } from '@prisma/client'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log('Request params:', params)
  const requestData = await request.json()
  console.log('Request body:', requestData)
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const data = requestData
    const { description, amount, type } = data

    // Validate required fields
    if (!description || !amount || !type) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate amount is positive
    if (amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Amount must be greater than 0' },
        { status: 400 }
      )
    }

    // Get the user's current shift
    if (!session.user?.email) {
      return NextResponse.json(
        { success: false, message: 'User email not found' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { currentShift: true }
    })

    if (!user?.currentShift) {
      return NextResponse.json(
        { success: false, message: 'No active shift found' },
        { status: 400 }
      )
    }

    try {
      // Create the bill item
      const billItem = await prisma.billItem.create({
        data: {
          billId: params.id,
          description,
          amount,
          type,
          date: new Date(),
          quantity: 1
        }
      })

      // Update the bill total
      await prisma.bill.update({
        where: { id: params.id },
        data: {
          total: {
            increment: amount
          }
        }
      })

      return NextResponse.json({ success: true, data: billItem })
    } catch (error: any) {
      console.error('Error details:', {
        error: error.message,
        code: error.code,
        meta: error.meta
      })
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to add bill item' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Request error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'An error occurred' },
      { status: 500 }
    )
  }
}
