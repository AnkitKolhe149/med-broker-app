const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('password123', 10);
  await prisma.user.create({
    data: {
      email: 'admin@test.com',
      passwordHash: hash,
      role: 'ADMIN',
      name: 'Test Admin',
      isProfileComplete: true
    }
  });
  console.log('Admin created: admin@test.com / password123');
}

main().catch(console.error).finally(() => prisma.$disconnect());
