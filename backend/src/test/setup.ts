import { beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '@/db';

beforeAll(async () => {
  // Setup test database
});

afterAll(async () => {
  // Cleanup test database
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clean up data between tests
  await prisma.order.deleteMany();
  await prisma.position.deleteMany();
  await prisma.user.deleteMany();
  await prisma.price.deleteMany();
});


