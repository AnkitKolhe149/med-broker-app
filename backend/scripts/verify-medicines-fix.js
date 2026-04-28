require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const item = await prisma.inventory.findFirst({
      select: {
        id: true,
        quantity: true,
        medicine: {
          select: {
            id: true,
            name: true,
            priceCents: true,
            wholesalePriceCents: true
          }
        }
      }
    });

    console.log('✓ OK - Prisma medicines query validates and works');
  } finally {
    await prisma.$disconnect();
  }
})().catch((error) => {
  console.error('✗ FAILED', error.message);
  process.exit(1);
});
