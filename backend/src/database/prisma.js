const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

// Test connection
prisma.$connect()
  .then(() => console.log('✓ Database connected successfully'))
  .catch((err) => console.error('✗ Database connection failed:', err.message));

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = { prisma };
