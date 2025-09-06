import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create admin user and staff
  const hashedPassword = await hash('admin123', 10)
  const staffPassword = await hash('staff123', 10)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@hotelonline.com' },
    update: {},
    create: {
      email: 'admin@hotelonline.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  const staff = await prisma.user.upsert({
    where: { email: 'staff@hotelonline.com' },
    update: {},
    create: {
      email: 'staff@hotelonline.com',
      name: 'Staff User',
      password: staffPassword,
      role: 'STAFF',
    },
  })

  console.log({ admin, staff })

  // Create sample rooms
  const rooms = await Promise.all([
    prisma.room.upsert({
      where: { number: '101' },
      update: {},
      create: {
        number: '101',
        type: 'SINGLE',
        rate: 100,
        status: 'AVAILABLE'
      }
    }),
    prisma.room.upsert({
      where: { number: '102' },
      update: {},
      create: {
        number: '102',
        type: 'DOUBLE',
        rate: 150,
        status: 'AVAILABLE'
      }
    }),
    prisma.room.upsert({
      where: { number: '201' },
      update: {},
      create: {
        number: '201',
        type: 'DELUXE',
        rate: 250,
        status: 'AVAILABLE'
      }
    }),
    prisma.room.upsert({
      where: { number: '202' },
      update: {},
      create: {
        number: '202',
        type: 'DELUXE',
        rate: 300,
        status: 'AVAILABLE'
      }
    })
  ])

  console.log({ rooms })

  // Create sample companies
  const companies = await Promise.all([
    prisma.company.upsert({
      where: { id: 'company_acme' },
      update: {},
      create: {
        id: 'company_acme',
        name: 'Acme Corp',
        address: '123 Business St',
        phone: '555-0100',
        email: 'contact@acme.com'
      }
    }),
    prisma.company.upsert({
      where: { id: 'company_techco' },
      update: {},
      create: {
        id: 'company_techco',
        name: 'TechCo Ltd',
        address: '456 Innovation Ave',
        phone: '555-0200',
        email: 'info@techco.com'
      }
    })
  ])

  console.log({ companies })

  // Create sample guests
  const guests = await Promise.all([
    prisma.guest.create({
      data: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '555-0001',
        address: '789 Residential St'
      }
    }),
    prisma.guest.create({
      data: {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        phone: '555-0002',
        address: '321 Home Ave',
        company: {
          connect: { id: 'company_acme' }
        }
      }
    })
  ])

  // Create a shift for payments and update staff's current shift
  const shift = await prisma.shift.create({
    data: {
      user: { connect: { id: staff.id } },
      startTime: new Date('2025-05-01T08:00:00+03:00'),
      endTime: null,
      status: 'ACTIVE',
      cashInHand: 1000
    }
  })

  // Update staff's current shift
  await prisma.user.update({
    where: { id: staff.id },
    data: { currentShift: { connect: { id: shift.id } } }
  })

  // Create sample check-ins and update room status
  const checkIns = await Promise.all([
    prisma.checkIn.create({
      data: {
        guest: { connect: { id: guests[0].id } },
        room: { connect: { id: rooms[0].id } },
        checkInDate: new Date('2025-05-01'),
        checkOutDate: new Date('2025-05-07'),
        status: 'ACTIVE',
        shift: { connect: { id: shift.id } }
      }
    }).then(async (checkIn) => {
      await prisma.room.update({
        where: { id: rooms[0].id },
        data: { status: 'OCCUPIED' }
      })
      return checkIn
    }),
    prisma.checkIn.create({
      data: {
        guest: { connect: { id: guests[1].id } },
        room: { connect: { id: rooms[1].id } },
        checkInDate: new Date('2025-05-03'),
        checkOutDate: new Date('2025-05-10'),
        status: 'ACTIVE',
        shift: { connect: { id: shift.id } }
      }
    }).then(async (checkIn) => {
      await prisma.room.update({
        where: { id: rooms[1].id },
        data: { status: 'OCCUPIED' }
      })
      return checkIn
    })
  ])

  // Create sample bills
  const bills = await Promise.all([
    prisma.bill.create({
      data: {
        guest: { connect: { id: guests[0].id } },
        room: { connect: { id: rooms[0].id } },
        checkIn: { connect: { id: checkIns[0].id } },
        total: 0,
        status: 'PENDING',
        checkInDate: new Date('2025-05-01'),
        items: {
          create: [
            {
              description: 'Room 101 - 6 nights',
              amount: 600,
              type: 'ACCOMMODATION',
              date: new Date('2025-05-01'),
              quantity: 6
            },
            {
              description: 'Restaurant - Dinner',
              amount: 45,
              type: 'FOOD',
              date: new Date('2025-05-02'),
              quantity: 1
            }
          ]
        },
        payments: {
          create: [
            {
              amount: 300,
              method: 'CASH',
              reference: 'CASH-001',
              date: new Date('2025-05-01'),
              shift: { connect: { id: shift.id } }
            }
          ]
        }
      }
    }),
    prisma.bill.create({
      data: {
        guest: { connect: { id: guests[1].id } },
        room: { connect: { id: rooms[1].id } },
        checkIn: { connect: { id: checkIns[1].id } },
        company: { connect: { id: 'company_acme' } },
        total: 0,
        status: 'PENDING',
        checkInDate: new Date('2025-05-03'),
        items: {
          create: [
            {
              description: 'Room 102 - 7 nights',
              amount: 1050,
              type: 'ACCOMMODATION',
              date: new Date('2025-05-03'),
              quantity: 7
            },
            {
              description: 'Laundry Service',
              amount: 30,
              type: 'SERVICE',
              date: new Date('2025-05-04'),
              quantity: 1
            }
          ]
        }
      }
    })
  ])

  // Update bill totals
  await Promise.all(
    bills.map(async (bill) => {
      const items = await prisma.billItem.findMany({
        where: { billId: bill.id }
      })
      const total = items.reduce((sum, item) => sum + (item.amount * item.quantity), 0)
      await prisma.bill.update({
        where: { id: bill.id },
        data: { 
          total,
          status: total > 0 ? 'PENDING' : 'PAID'
        }
      })
    })
  )

  // Create initial system date
  const systemDate = await prisma.systemDate.create({
    data: {
      currentDate: new Date('2025-05-05T13:50:07+03:00')
    }
  })

  console.log({ systemDate, guests, checkIns, bills })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
