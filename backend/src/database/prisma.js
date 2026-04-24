const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");

const prismaLogLevel = process.env.PRISMA_LOG_LEVEL || 'warn';
const prismaLogConfig = prismaLogLevel === 'query'
  ? ['query', 'error', 'warn']
  : ['error', 'warn'];

// PrismaPg requires a pg Pool instance.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const basePrisma = new PrismaClient({
  adapter,
  log: prismaLogConfig,
});
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isTransientDbTerminationError = (error) => {
  if (!error) return false;

  const message = String(error.message || '').toLowerCase();
  const code = String(error.code || '').toUpperCase();
  return (
    code === 'ECONNRESET' ||
    code === 'ETIMEDOUT' ||
    code === 'EPIPE' ||
    message.includes('57p01') ||
    message.includes('administrator command') ||
    message.includes('terminating connection due to administrator command') ||
    message.includes('server closed the connection unexpectedly') ||
    message.includes('closed, cause: none') ||
    message.includes('econnreset') ||
    message.includes('connection terminated unexpectedly') ||
    message.includes('socket hang up') ||
    message.includes('read etimedout')
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
  await pool.end().catch(() => {});
});

process.on('SIGINT', async () => {
  await basePrisma.$disconnect();
  await pool.end().catch(() => {});
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await basePrisma.$disconnect();
  await pool.end().catch(() => {});
  process.exit(0);
});

module.exports = { prisma };
