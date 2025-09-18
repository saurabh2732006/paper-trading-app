import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Create a demo user first
  const user = await prisma.user.create({
    data: {
      username: "demo",
      startingCash: 100000
    }
  })

  console.log('Created demo user:', user)

  // Create some initial orders
  await prisma.order.createMany({
    data: [
      {
        userId: user.id,
        symbol: "AAPL",
        side: "BUY",
        type: "MARKET",
        qty: 10,
        price: 150,
        status: "OPEN",
        filledQty: 0,
        avgPrice: 0
      },
      {
        userId: user.id,
        symbol: "AAPL",
        side: "SELL",
        type: "LIMIT",
        qty: 5,
        price: 155,
        status: "OPEN",
        filledQty: 0,
        avgPrice: 0
      }
    ]
  })

  // Create some initial price data
  await prisma.price.createMany({
    data: [
      {
        symbol: "AAPL",
        ts: new Date(),
        price: 150.25
      },
      {
        symbol: "GOOGL",
        ts: new Date(),
        price: 2800.50
      },
      {
        symbol: "MSFT",
        ts: new Date(),
        price: 310.75
      }
    ]
  })

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })