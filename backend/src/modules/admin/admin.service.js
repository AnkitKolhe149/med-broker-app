const { prisma } = require('../../database/prisma');
const { NotFoundError, ConflictError } = require('../../utils/errors');

module.exports = {
  getDashboardStats: async () => {
    // Basic stats
    const totalVendors = await prisma.vendor.count();
    const totalCustomers = await prisma.customer.count();
    
    const paidOrders = await prisma.order.findMany({
      where: { status: 'PAID' },
      select: { totalCents: true, createdAt: true }
    });

    const totalRevenueCents = paidOrders.reduce((sum, order) => sum + order.totalCents, 0);

    // Simple Monthly Growth logic (Current month vs Last month)
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const currentMonthRevenue = paidOrders
      .filter(o => o.createdAt >= startOfCurrentMonth)
      .reduce((sum, order) => sum + order.totalCents, 0);

    const lastMonthRevenue = paidOrders
      .filter(o => o.createdAt >= startOfLastMonth && o.createdAt < startOfCurrentMonth)
      .reduce((sum, order) => sum + order.totalCents, 0);

    return {
      totalVendors,
      totalCustomers,
      totalRevenueCents,
      totalOrders: paidOrders.length,
      currentMonthRevenueCents: currentMonthRevenue,
      lastMonthRevenueCents: lastMonthRevenue,
    };
  },

  getPendingVendors: async () => {
    return prisma.vendor.findMany({
      where: { verificationStatus: 'PENDING' },
      include: { user: { select: { email: true, name: true, mobile: true } } },
      orderBy: { createdAt: 'desc' }
    });
  },

  updateVendorStatus: async (vendorId, status) => {
    const validStatuses = ['VERIFIED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      throw new ConflictError('Invalid verification status');
    }

    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) throw new NotFoundError('Vendor not found');

    return prisma.vendor.update({
      where: { id: vendorId },
      data: { verificationStatus: status }
    });
  },

  getPayoutOverview: async () => {
    // For each vendor, calculate how much they've earned (from PAID order items)
    // minus the total of COMPLETED payouts.
    
    // Get all vendors
    const vendors = await prisma.vendor.findMany({
      select: { id: true, companyName: true, contactPersonName: true }
    });

    // We fetch order items belonging to PAID orders
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: { status: 'PAID' }
      },
      select: {
        vendorId: true,
        quantity: true,
        unitPriceCents: true
      }
    });

    // Payouts
    const payouts = await prisma.payout.findMany({
      where: { status: 'COMPLETED' },
      select: { vendorId: true, amountCents: true }
    });

    const overview = vendors.map(v => {
      const vendorItems = orderItems.filter(item => item.vendorId === v.id);
      const totalEarnedCents = vendorItems.reduce((sum, item) => sum + (item.quantity * item.unitPriceCents), 0);
      
      const vendorPayouts = payouts.filter(p => p.vendorId === v.id);
      const totalPaidCents = vendorPayouts.reduce((sum, p) => sum + p.amountCents, 0);

      // Assume a 5% platform commission
      const commissionCents = Math.floor(totalEarnedCents * 0.05);
      const netPayableCents = totalEarnedCents - commissionCents;
      const pendingBalanceCents = netPayableCents - totalPaidCents;

      return {
        vendorId: v.id,
        companyName: v.companyName,
        contactPersonName: v.contactPersonName,
        totalEarnedCents,
        commissionCents,
        totalPaidCents,
        pendingBalanceCents: Math.max(0, pendingBalanceCents)
      };
    });

    return overview.filter(item => item.pendingBalanceCents > 0 || item.totalPaidCents > 0);
  },

  processPayout: async (vendorId, amountCents) => {
    // Create a payout record for the vendor
    return prisma.payout.create({
      data: {
        vendorId,
        amountCents,
        status: 'COMPLETED',
        transactionId: `TXN-${Date.now()}` // Mock transaction ID
      }
    });
  }
};
