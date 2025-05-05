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
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const withBills = searchParams.get('withBills') === 'true'

    const company = await prisma.company.findUnique({
      where: {
        id: params.id
      },
      include: withBills ? {
        bills: {
          where: {
            status: {
              in: ['PENDING', 'PARTIALLY_PAID']
            }
          },
          include: {
            guest: {
              select: {
                firstName: true,
                lastName: true
              }
            },
            room: {
              select: {
                number: true
              }
            },
            items: {
              select: {
                id: true,
                description: true,
                amount: true,
                date: true,
                type: true
              }
            },
            payments: {
              select: {
                id: true,
                amount: true,
                date: true,
                method: true,
                reference: true
              }
            }
          }
        }
      } : undefined
    })

    if (!company) {
      return NextResponse.json(
        { success: false, message: 'Company not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: company })
  } catch (error) {
    console.error('Error fetching company:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch company' },
      { status: 500 }
    )
  }
}
