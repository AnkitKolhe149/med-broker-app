const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const COUNTRY_TO_CURRENCY = {
  'UNITED STATES': 'USD',
  'UNITED KINGDOM': 'GBP',
  'INDIA': 'INR',
  'AUSTRALIA': 'AUD',
  'CANADA': 'CAD',
  'SINGAPORE': 'SGD',
  'UAE': 'AED',
  'SAUDI ARABIA': 'SAR',
  'JAPAN': 'JPY',
  'CHINA': 'CNY',
  'BRAZIL': 'BRL',
  'SOUTH AFRICA': 'ZAR',
  'RUSSIA': 'RUB',
  'GERMANY': 'EUR',
  'FRANCE': 'EUR',
  'ITALY': 'EUR',
  'SPAIN': 'EUR',
  'NETHERLANDS': 'EUR',
  'KENYA': 'KES'
};

const getCurrencyForCountry = (country) => {
  if (!country) return 'INR';
  const normalized = String(country).trim().toUpperCase();
  return COUNTRY_TO_CURRENCY[normalized] || 'INR';
};

async function fixPreferredCurrency() {
  const users = await prisma.user.findMany({
    include: { customer: true, vendor: true }
  });

  let updatedCount = 0;

  for (const user of users) {
    let country = null;
    if (user.customer?.country) {
      country = user.customer.country;
    } else if (user.vendor?.country) {
      country = user.vendor.country;
    }

    if (country) {
      const correctCurrency = getCurrencyForCountry(country);
      if (user.preferredCurrency !== correctCurrency) {
        await prisma.user.update({
          where: { id: user.id },
          data: { preferredCurrency: correctCurrency }
        });
        updatedCount++;
        console.log(`Updated user ${user.email} from ${user.preferredCurrency} to ${correctCurrency} (Country: ${country})`);
      }
    }
  }

  console.log(`Finished migrating ${updatedCount} users.`);
}

fixPreferredCurrency()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
