import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CheckInStatus, RoomStatus } from '@prisma/client';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the check-in with its bill
    const checkIn = await prisma.checkIn.findUnique({
      where: { id: params.id },
      include: {
        bill: {
          include: {
            payments: true,
            paidByBill: {
              include: {
                checkIn: true,
                guest: true
              }
            }
          }
        },
        room: true
      }
    });

    if (!checkIn) {
      return NextResponse.json(
        { error: 'Check-in not found' },
        { status: 404 }
      );
    }

    if (checkIn.status !== CheckInStatus.ACTIVE) {
      return NextResponse.json(
        { error: 'Check-in is not active' },
        { status: 400 }
      );
    }

    // If bill has no payments and is not linked to another bill, prevent checkout
    if (
      checkIn.bill && 
      checkIn.bill.payments.length === 0 && 
      !checkIn.bill.paidByBill
    ) {
      return NextResponse.json(
        { error: 'Cannot check out: Bill has no payments and is not linked to another bill' },
        { status: 400 }
      );
    }

    // Perform checkout
    const result = await prisma.$transaction(async (tx) => {
      // Update check-in status
      const updatedCheckIn = await tx.checkIn.update({
        where: { id: params.id },
        data: {
          status: CheckInStatus.COMPLETED,
          checkOutDate: new Date()
        }
      });

      // Update room status
      await tx.room.update({
        where: { id: checkIn.roomId },
        data: { status: RoomStatus.AVAILABLE }
      });

      // If bill exists, update its checkout date
      if (checkIn.bill) {
        await tx.bill.update({
          where: { id: checkIn.bill.id },
          data: { checkOutDate: new Date() }
        });
      }

      return updatedCheckIn;
    });

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error checking out:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
