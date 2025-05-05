import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const withActiveBills = searchParams.get('withActiveBills') === 'true'

    const companies = await prisma.company.findMany({
      orderBy: {
        name: 'asc'
      },
      include: withActiveBills ? {
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
            payments: {
              select: {
                id: true,
                amount: true,
                date: true
              }
            }
          }
        }
      } : undefined
    })

    return NextResponse.json({ success: true, data: companies })
  } catch (error) {
    console.error('Error fetching companies:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { name, address, phone, email } = await request.json()

    const company = await prisma.company.create({
      data: {
        name,
        address,
        phone,
        email
      }
    })

    return NextResponse.json(company)
  } catch (error) {
    console.error('Error creating company:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
