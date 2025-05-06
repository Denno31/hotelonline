import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(
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

    const { linkedBillId } = await request.json();

    // Get both bills
    const [mainBill, linkedBill] = await Promise.all([
      prisma.bill.findUnique({
        where: { id: params.id },
        include: {
          guest: true,
          checkIn: true
        }
      }),
      prisma.bill.findUnique({
        where: { id: linkedBillId },
        include: {
          guest: true,
          checkIn: true
        }
      })
    ]);

    if (!mainBill || !linkedBill) {
      return NextResponse.json(
        { error: 'One or both bills not found' },
        { status: 404 }
      );
    }

    // Validation checks
    if (linkedBill.paidByBillId) {
      return NextResponse.json(
        { error: 'Selected bill is already being paid by another guest' },
        { status: 400 }
      );
    }

    if (mainBill.id === linkedBill.id) {
      return NextResponse.json(
        { error: 'Cannot link a bill to itself' },
        { status: 400 }
      );
    }

    // Both check-ins must be active
    if (mainBill.checkIn?.status !== 'ACTIVE' || linkedBill.checkIn?.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Can only link bills from active check-ins' },
        { status: 400 }
      );
    }

    // Update the linked bill in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Link the bills
      const updatedLinkedBill = await tx.bill.update({
        where: { id: linkedBill.id },
        data: {
          paidByBillId: mainBill.id,
          linkingDate: new Date()
        },
        include: {
          guest: true,
          checkIn: true
        }
      });

      return updatedLinkedBill;
    });

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error linking bills:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const { linkedBillId } = await request.json();

    // Get both bills
    const [mainBill, linkedBill] = await Promise.all([
      prisma.bill.findUnique({
        where: { id: params.id }
      }),
      prisma.bill.findUnique({
        where: { id: linkedBillId }
      })
    ]);

    if (!mainBill || !linkedBill) {
      return NextResponse.json(
        { error: 'One or both bills not found' },
        { status: 404 }
      );
    }

    // Verify the bills are actually linked
    if (linkedBill.paidByBillId !== mainBill.id) {
      return NextResponse.json(
        { error: 'Bills are not linked' },
        { status: 400 }
      );
    }

    // Remove the link
    const unlinkedBill = await prisma.bill.update({
      where: { id: linkedBill.id },
      data: {
        paidByBillId: null,
        linkingDate: null
      }
    });

    return NextResponse.json({
      success: true,
      data: unlinkedBill
    });
  } catch (error) {
    console.error('Error unlinking bills:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
