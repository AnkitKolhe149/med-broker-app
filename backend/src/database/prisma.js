const { PrismaClient } = require("@prisma/client");

// Configure Prisma for Neon's serverless PostgreSQL
const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Test connection with retry logic
const connectWithRetry = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      await prisma.$connect();
      console.log('✓ Database connected successfully');
      return;
    } catch (err) {
      console.error(`✗ Database connection attempt ${i + 1} failed:`, err.message);
      if (i === retries - 1) {
        console.error('✗ Unable to connect to database after multiple attempts');
      } else {
        console.log(`  Retrying in ${(i + 1) * 2} seconds...`);
        await new Promise(resolve => setTimeout(resolve, (i + 1) * 2000));
      }
    }
  }
};

connectWithRetry();

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

module.exports = { prisma };
