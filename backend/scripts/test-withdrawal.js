const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const vendorService = require('../src/modules/vendorProfile/vendorProfile.service');
const adminService = require('../src/modules/admin/admin.service');

(async () => {
  try {
    console.log('Locating a vendor...');
    const vendor = await prisma.vendor.findFirst({ include: { user: true } });
    if (!vendor) {
      console.error('No vendor found in database. Create a vendor or run seed script.');
      process.exit(2);
    }

    console.log('Found vendor:', vendor.companyName || vendor.id);

    // compute pending balance similar to service logic
    const paidOrderItems = await prisma.orderItem.findMany({
      where: { vendorId: vendor.id, order: { status: 'PAID' } },
      select: { quantity: true, unitPriceCents: true }
    });

    const completedPayouts = await prisma.payout.findMany({ where: { vendorId: vendor.id, status: 'COMPLETED' }, select: { amountCents: true } });

    const grossEarned = paidOrderItems.reduce((s, it) => s + (Number(it.quantity || 0) * Number(it.unitPriceCents || 0)), 0);
    const paid = completedPayouts.reduce((s, p) => s + Number(p.amountCents || 0), 0);
    const pending = Math.max(0, grossEarned - paid);

    console.log('Vendor balances (cents): grossEarned=', grossEarned, 'paid=', paid, 'pending=', pending);

    if (pending <= 0) {
      console.error('Vendor has no pending balance to withdraw. Aborting test.');
      process.exit(3);
    }

    const withdrawAmount = Math.min(pending, 5000); // try to withdraw up to 50.00
    console.log(`Requesting withdrawal of ${withdrawAmount} cents for vendor ${vendor.id}`);

    const result = await vendorService.requestWithdrawal(vendor.user.id, { amountCents: withdrawAmount, note: 'Automated test withdrawal' });
    console.log('Withdrawal request created:', result.request.id);

    // Approve as admin
    console.log('Approving payout as admin...');
    try {
      const approved = await adminService.processPayout(vendor.id, withdrawAmount, { payoutRequestId: result.request.id });
      console.log('Payout approval result:', approved);
    } catch (err) {
      console.error('Error during approval:', err && err.message ? err.message : err);
    }

    process.exit(0);
  } catch (err) {
    console.error('Test script failed:', err && err.message ? err.message : err);
    process.exit(1);
  } finally {
    try { await prisma.$disconnect(); } catch(e){}
  }
})();
