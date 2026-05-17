/* eslint-disable no-console */

const API_BASE = process.env.E2E_API_BASE || 'http://localhost:4000/api';

const assert = (name, condition) => {
  if (!condition) {
    throw new Error(`Assertion failed: ${name}`);
  }
};

const callApi = async ({ method = 'GET', path, token, body, expectBinary = false }) => {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      ...(expectBinary ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {})
  });

  if (expectBinary) {
    const buffer = Buffer.from(await response.arrayBuffer());
    return { status: response.status, ok: response.ok, data: buffer, headers: response.headers };
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch (_error) {
    payload = null;
  }

  return { status: response.status, ok: response.ok, payload };
};

const pickMedicine = async () => {
  const medicinesRes = await callApi({ path: '/medicines' });
  assert('medicines endpoint success', medicinesRes.ok && medicinesRes.payload?.success);

  const list = medicinesRes.payload.data || [];
  const candidate = list.find((item) => Number(item.stockLevel || 0) >= 5 && item.medicineId);
  assert('at least one medicine with stock available', Boolean(candidate));
  return candidate;
};

const createOrder = async ({ token, medicine, quantity, currencyCode }) => {
  const orderRes = await callApi({
    method: 'POST',
    path: '/orders',
    token,
    body: {
      items: [
        {
          medicineId: medicine.medicineId,
          vendorId: medicine.vendorId,
          quantity,
          selectedSize: 'standard'
        }
      ],
      deliveryType: 'standard',
      destinationCountry: 'US',
      deliveryAddress: {
        fullName: 'E2E Customer',
        phone: '9876543210',
        email: `e2e.${Date.now()}@example.com`,
        address: '101 E2E Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400001',
        country: 'United States'
      },
      orderNotes: 'E2E smoke order',
      discountPercent: 0,
      appliedCoupon: '',
      currencyCode
    }
  });

  assert(`create order ${currencyCode} success`, orderRes.ok && orderRes.payload?.success);
  return orderRes.payload.data;
};

const run = async () => {
  const suffix = Date.now();
  const email = `e2e.currency.${suffix}@example.com`;
  const password = 'TestPass123';
  const mobileSeed = String(Math.floor(Math.random() * 9000000000) + 1000000000);
  const primaryMobile = mobileSeed;
  const secondaryMobile = String((Number(mobileSeed) + 1) % 10000000000).padStart(10, '0');

  // 1) Register customer
  const registerRes = await callApi({
    method: 'POST',
    path: '/auth/register',
    body: {
      email,
      password,
      role: 'CUSTOMER',
      mobile: primaryMobile
    }
  });
  assert('register success', registerRes.ok && registerRes.payload?.success);
  const token = registerRes.payload.data.token;

  // 2) Verify same-email role conflict
  const duplicateRoleRes = await callApi({
    method: 'POST',
    path: '/auth/register',
    body: {
      email,
      password,
      role: 'VENDOR',
      mobile: secondaryMobile
    }
  });
  assert('same email blocked across roles', duplicateRoleRes.status === 409);

  // 3) Complete customer onboarding
  const onboardingRes = await callApi({
    method: 'POST',
    path: '/onboarding/customer',
    token,
    body: {
      fullName: 'E2E Customer',
      buyerType: 'RETAIL',
      country: 'United States',
      city: 'New York',
      deliveryAddress: '101 E2E Street',
      contactNumber: primaryMobile
    }
  });
  assert('customer onboarding success', onboardingRes.ok && onboardingRes.payload?.success);

  const medicine = await pickMedicine();

  // 4) Multi-currency order placement (USD)
  const usdOrder = await createOrder({ token, medicine, quantity: 1, currencyCode: 'USD' });
  assert('order currency is USD', usdOrder.currencyCode === 'USD');

  const usdPricing = usdOrder.checkoutSnapshot?.pricingSummary || {};
  assert('pricingSummary exists for USD order', typeof usdPricing.totalCents === 'number');
  assert('order total equals snapshot total for USD order', usdOrder.totalCents === usdPricing.totalCents);

  // 5) Payment success path (mock)
  const initiateSuccess = await callApi({
    method: 'POST',
    path: '/payments/initiate',
    token,
    body: {
      orderId: usdOrder.id,
      provider: 'mock',
      returnUrl: 'http://localhost:3000/customer/payment'
    }
  });
  assert('payment initiate success', initiateSuccess.ok && initiateSuccess.payload?.success);

  const paymentId = initiateSuccess.payload.data.paymentId;
  const verifySuccess = await callApi({
    method: 'POST',
    path: '/payments/verify',
    token,
    body: {
      paymentId,
      orderId: usdOrder.id,
      status: 'SUCCEEDED'
    }
  });
  assert('payment verify success', verifySuccess.ok && verifySuccess.payload?.success === true);

  const paidOrderRes = await callApi({ method: 'GET', path: `/orders/${usdOrder.id}`, token });
  assert('paid order fetch success', paidOrderRes.ok && paidOrderRes.payload?.success);
  const paidOrder = paidOrderRes.payload.data;
  assert('order marked paid', paidOrder.status === 'PAID');

  // 6) Refund eligibility + cancellation
  const refundEligibility = await callApi({ method: 'GET', path: `/orders/${usdOrder.id}/refund-eligibility`, token });
  assert('refund eligibility success', refundEligibility.ok && refundEligibility.payload?.success);
  assert('refund breakdown present for paid order', Boolean(refundEligibility.payload.data?.refund?.refundableCents >= 0));

  const cancelRes = await callApi({ method: 'PATCH', path: `/orders/${usdOrder.id}/cancel`, token, body: {} });
  assert('cancel order success', cancelRes.ok && cancelRes.payload?.success);

  const cancelledOrderRes = await callApi({ method: 'GET', path: `/orders/${usdOrder.id}`, token });
  assert('cancelled order fetch success', cancelledOrderRes.ok && cancelledOrderRes.payload?.success);
  const cancelledOrder = cancelledOrderRes.payload.data;
  assert('order marked cancelled after paid cancellation', cancelledOrder.status === 'CANCELLED');

  // 7) Payment failure path on a second order
  const eurOrder = await createOrder({ token, medicine, quantity: 2, currencyCode: 'EUR' });
  assert('order currency is EUR', eurOrder.currencyCode === 'EUR');

  const initiateFailure = await callApi({
    method: 'POST',
    path: '/payments/initiate',
    token,
    body: {
      orderId: eurOrder.id,
      provider: 'mock',
      returnUrl: 'http://localhost:3000/customer/payment'
    }
  });
  assert('payment initiate for EUR order success', initiateFailure.ok && initiateFailure.payload?.success);

  const failedPaymentId = initiateFailure.payload.data.paymentId;
  const verifyFailure = await callApi({
    method: 'POST',
    path: '/payments/verify',
    token,
    body: {
      paymentId: failedPaymentId,
      orderId: eurOrder.id,
      status: 'FAILED'
    }
  });
  assert('payment verify failed status handled', verifyFailure.ok && verifyFailure.payload?.success === false);

  const failedOrderRes = await callApi({ method: 'GET', path: `/orders/${eurOrder.id}`, token });
  assert('failed order fetch success', failedOrderRes.ok && failedOrderRes.payload?.success);
  assert('failed payment order remains pending', failedOrderRes.payload.data.status === 'PENDING');

  // 8) Invoice/receipt generation for paid order
  const receiptRes = await callApi({ method: 'GET', path: `/orders/${usdOrder.id}/receipt`, token, expectBinary: true });
  assert('receipt endpoint returns binary', receiptRes.ok && receiptRes.data.length > 1000);

  // 9) Session persistence check via token based profile endpoint
  const meRes = await callApi({ method: 'GET', path: '/auth/me', token });
  assert('auth me success after workflow', meRes.ok && meRes.payload?.success);

  const summary = {
    userEmail: email,
    sameEmailRoleConflictStatus: duplicateRoleRes.status,
    usdOrder: {
      id: usdOrder.id,
      currencyCode: usdOrder.currencyCode,
      totalCents: usdOrder.totalCents,
      snapshotTotalCents: usdPricing.totalCents,
      finalStatus: cancelledOrder.status
    },
    eurOrder: {
      id: eurOrder.id,
      currencyCode: eurOrder.currencyCode,
      statusAfterFailedPayment: failedOrderRes.payload.data.status
    },
    receiptBytes: receiptRes.data.length
  };

  console.log('E2E_SMOKE_PASS');
  console.log(JSON.stringify(summary, null, 2));
};

run().catch((error) => {
  console.error('E2E_SMOKE_FAIL');
  console.error(error.message);
  process.exitCode = 1;
});
