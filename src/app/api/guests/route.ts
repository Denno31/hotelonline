import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const guests = await prisma.guest.findMany({
      include: {
        company: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(guests)
  } catch (error) {
    console.error('Error fetching guests:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { firstName, lastName, email, phone, address, companyId } =
      await request.json()

    const guest = await prisma.guest.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        address,
        companyId
      }
    })

    return NextResponse.json(guest)
  } catch (error) {
    console.error('Error creating guest:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
