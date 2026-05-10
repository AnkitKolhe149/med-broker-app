const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();
const base = 'http://127.0.0.1:4000/api';
const out = { timestamp: new Date().toISOString() };

const req = async (name, fn) => {
  try {
    const r = await fn();
    out[name] = { ok: true, status: r.status, data: r.data };
  } catch (e) {
    out[name] = {
      ok: false,
      status: e.response?.status || null,
      data: e.response?.data || null,
      error: e.message
    };
  }
};

const expectTwoDecimalMoneyFields = (obj, path = 'data') => {
  if (!obj || typeof obj !== 'object') return `${path}: not an object`;
  const moneyKeys = new Set(['subtotal', 'grandTotal', 'shippingCost', 'totalShipping', 'baseFee', 'ratePerKg', 'minCharge']);
  for (const [k, v] of Object.entries(obj)) {
    if (moneyKeys.has(k) && typeof v === 'number' && !Number.isInteger(v)) {
      const s = String(v);
      const dec = s.includes('.') ? s.split('.')[1].length : 0;
      if (dec > 2) return `${path}.${k} has more than 2 decimal places (${v})`;
    }
    if (k === 'shipments' && Array.isArray(v)) {
      for (let i = 0; i < v.length; i += 1) {
        const err = expectTwoDecimalMoneyFields(v[i], `${path}.shipments[${i}]`);
        if (err) return err;
      }
    }
  }
  return null;
};

async function main() {
  await req('countryListEndpoint', () => axios.get(`${base}/countries`));
  await req('statesEndpoint', () => axios.get(`${base}/states`, { params: { countryCode: 'IN' } }));
  await req('geoCountries', () => axios.get(`${base}/geo/countries`));
  await req('geoStatesIN', () => axios.get(`${base}/geo/countries/IN/states`));
  await req('legacyQuote', () => axios.post(`${base}/shipping/quote`, {
    items: [{ quantity: 10, unitPrice: 120 }],
    destinationCountry: 'IN'
  }));
  await req('singleLaneQuoteUSKE', () => axios.post(`${base}/shipping/quote`, {
    items: [{ quantity: 4, unitPrice: 50 }],
    originCountry: 'US',
    destinationCountry: 'KE'
  }));
  await req('multiOriginQuote', () => axios.post(`${base}/shipping/quote`, {
    destinationCountry: 'KE',
    shipments: [
      { originCountry: 'IN', items: [{ quantity: 5, unitPrice: 100 }] },
      { originCountry: 'US', items: [{ quantity: 3, unitPrice: 80 }] }
    ]
  }));

  out.quoteMoneyPrecision = {
    legacy: expectTwoDecimalMoneyFields(out.legacyQuote?.data?.data || out.legacyQuote?.data, 'legacyQuote'),
    singleLane: expectTwoDecimalMoneyFields(out.singleLaneQuoteUSKE?.data?.data || out.singleLaneQuoteUSKE?.data, 'singleLane'),
    multiOrigin: expectTwoDecimalMoneyFields(out.multiOriginQuote?.data?.data || out.multiOriginQuote?.data, 'multiOrigin')
  };

  const sameItems = [{ quantity: 2, unitPrice: 99.99 }];
  await req('checkoutSingleOriginEquivalent', () => axios.post(`${base}/shipping/quote`, {
    items: sameItems,
    originCountry: 'IN',
    destinationCountry: 'GB'
  }));

  const inState = await prisma.state.findFirst({
    where: { countryCode: 'IN' },
    select: { id: true, countryCode: true, name: true }
  });
  const ts = Date.now();
  const mobile = `9${String(ts).slice(-9)}`;
  const signupPayload = {
    email: `phase8_customer_${ts}@example.com`,
    mobile,
    password: 'StrongPass1',
    role: 'CUSTOMER',
    countryCode: 'IN',
    stateId: inState?.id,
    phoneDial: '+91',
    phoneE164: `+91${mobile}`
  };
  await req('signupCustomer', () => axios.post(`${base}/auth/register`, signupPayload));

  await req('loginCustomer', () =>
    axios.post(`${base}/auth/login`, {
      email: signupPayload.email,
      password: signupPayload.password
    })
  );

  const vendorMobile = `8${String(ts + 1).slice(-9)}`;
  const vendorSignupPayload = {
    email: `phase8_vendor_${ts}@example.com`,
    mobile: vendorMobile,
    password: 'StrongPass1',
    role: 'VENDOR',
    countryCode: 'IN',
    stateId: inState?.id,
    phoneDial: '+91',
    phoneE164: `+91${vendorMobile}`
  };
  await req('signupVendor', () => axios.post(`${base}/auth/register`, vendorSignupPayload));
  await req('loginVendor', () =>
    axios.post(`${base}/auth/login`, {
      email: vendorSignupPayload.email,
      password: vendorSignupPayload.password
    })
  );

  out.signupPayloadPreview = { ...signupPayload, password: '***' };
  out.stateUsed = inState;
  fs.writeFileSync('verification-phase8.json', JSON.stringify(out, null, 2));
  await prisma.$disconnect();
}

main().catch(async (err) => {
  out.fatal = err.message;
  fs.writeFileSync('verification-phase8.json', JSON.stringify(out, null, 2));
  try {
    await prisma.$disconnect();
  } catch (_e) {}
  process.exit(1);
});
