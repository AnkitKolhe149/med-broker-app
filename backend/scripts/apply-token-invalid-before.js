require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { Client } = require('pg');

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    await client.query(
      'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "tokenInvalidBefore" TIMESTAMPTZ'
    );
    console.log('Applied: added nullable User.tokenInvalidBefore');
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
