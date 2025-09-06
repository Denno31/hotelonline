import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Bill, CheckIn, Guest, Payment, Room } from '@prisma/client';
import { CheckInStatus, RoomStatus } from '@prisma/client';

type BillWithRelations = Bill & {
  guest: Guest
  payments: Payment[]
  paidBills: (Bill & {
    guest: Guest
    payments: Payment[]
  })[]
}

type CheckInWithBill = CheckIn & {
  bill: BillWithRelations | null
  room: Room
}

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
            guest: true,
            paidBills: {
              include: {
                guest: true,
                payments: true
              }
            }
          }
        },
        room: true
      }
    }) as CheckInWithBill;

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

    const bill = checkIn.bill;

    // If bill has no payments and is not linked to another bill, prevent checkout
    if (bill && bill.payments.length === 0 && !bill.paidByBill) {
      return NextResponse.json(
        { error: 'Cannot check out guest with unpaid bill' },
        { status: 400 }
      )
    }

    // Check if guest has any unpaid bills they're paying for
    const unpaidBills = checkIn.bill?.paidBills.filter(bill => {
      const paidAmount = bill.payments.reduce((sum, p) => sum + p.amount, 0)
      return paidAmount < bill.total
    }) || []

    if (unpaidBills.length > 0) {
      const unpaidGuests = unpaidBills.map(b => `${b.guest.firstName} ${b.guest.lastName}`).join(', ')
      return NextResponse.json(
        { error: `Cannot check out guest while paying for unpaid bills: ${unpaidGuests}` },
        { status: 400 }
      )
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
