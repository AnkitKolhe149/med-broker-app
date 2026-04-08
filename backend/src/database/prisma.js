const { PrismaClient } = require("@prisma/client");

const prismaLogLevel = process.env.PRISMA_LOG_LEVEL || 'warn';
const prismaLogConfig = prismaLogLevel === 'query'
  ? ['query', 'error', 'warn']
  : ['error', 'warn'];

// Configure Prisma for Neon's serverless PostgreSQL
const basePrisma = new PrismaClient({
  log: prismaLogConfig,
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isTransientDbTerminationError = (error) => {
  if (!error) return false;

  const message = String(error.message || '').toLowerCase();
  return (
    message.includes('57p01') ||
    message.includes('administrator command') ||
    message.includes('terminating connection due to administrator command') ||
    message.includes('server closed the connection unexpectedly') ||
    message.includes('closed, cause: none')
  );
};

// Test connection with retry logic
const connectWithRetry = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      await basePrisma.$connect();
      console.log('✓ Database connected successfully');
      return;
    } catch (err) {
      console.error(`✗ Database connection attempt ${i + 1} failed:`, err.message);
      if (i === retries - 1) {
        console.error('✗ Unable to connect to database after multiple attempts');
      } else {
        console.log(`  Retrying in ${(i + 1) * 2} seconds...`);
        await wait((i + 1) * 2000);
      }
    }
  }
};

const reconnectWithRetry = async (retries = 2) => {
  for (let i = 0; i < retries; i++) {
    try {
      await basePrisma.$disconnect().catch(() => {});
      await basePrisma.$connect();
      return true;
    } catch (error) {
      if (i === retries - 1) {
        return false;
      }
      await wait((i + 1) * 300);
    }
  }

  return false;
};

const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ args, query }) {
        try {
          return await query(args);
        } catch (error) {
          if (!isTransientDbTerminationError(error)) {
            throw error;
          }

          const recovered = await reconnectWithRetry();
          if (!recovered) {
            throw error;
          }

          return query(args);
        }
      },
    },
    async $queryRaw({ args, query }) {
      try {
        return await query(args);
      } catch (error) {
        if (!isTransientDbTerminationError(error)) {
          throw error;
        }

        const recovered = await reconnectWithRetry();
        if (!recovered) {
          throw error;
        }

        return query(args);
      }
    },
  },
});

connectWithRetry();

// Graceful shutdown
process.on('beforeExit', async () => {
  await basePrisma.$disconnect();
});

process.on('SIGINT', async () => {
  await basePrisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await basePrisma.$disconnect();
  process.exit(0);
});

module.exports = { prisma };
