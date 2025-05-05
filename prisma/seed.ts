import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const hashedPassword = await hash('admin123', 10)
  
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

  console.log({ admin })

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

  // Create initial system date
  const systemDate = await prisma.systemDate.create({
    data: {
      currentDate: new Date('2025-05-05T13:50:07+03:00')
    }
  })

  console.log({ systemDate })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
