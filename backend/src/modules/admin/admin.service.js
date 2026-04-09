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
  },

  getOrdersOverview: async (options = {}) => {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 10));
    const skip = (page - 1) * limit;

    const where = {};
    if (options.status) {
      where.status = String(options.status).toUpperCase();
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: {
            select: { id: true, email: true, name: true }
          },
          payment: true,
          items: {
            include: {
              medicine: {
                select: { id: true, name: true, requiresPrescription: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.order.count({ where })
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit))
      }
    };
  },

  getPrescriptionQueue: async (options = {}) => {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 10));
    const skip = (page - 1) * limit;

    const where = {
      items: {
        some: {
          medicine: {
            requiresPrescription: true
          }
        }
      }
    };

    if (options.status) {
      where.status = String(options.status).toUpperCase();
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: {
            select: { id: true, email: true, name: true }
          },
          payment: true,
          items: {
            include: {
              medicine: {
                select: { id: true, name: true, requiresPrescription: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.order.count({ where })
    ]);

    return {
      queue: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit))
      }
    };
  },

  getRefundCenter: async (options = {}) => {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 10));
    const skip = (page - 1) * limit;

    const where = {};
    if (options.status) {
      where.status = String(options.status).toUpperCase();
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          order: {
            include: {
              user: {
                select: { id: true, email: true, name: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.payment.count({ where })
    ]);

    const summary = {
      total,
      initiated: payments.filter((p) => p.status === 'INITIATED').length,
      succeeded: payments.filter((p) => p.status === 'SUCCEEDED').length,
      refunded: payments.filter((p) => p.status === 'REFUNDED').length
    };

    const items = payments.map((payment) => ({
      ...payment,
      canRefund: payment.status === 'SUCCEEDED'
    }));

    return {
      summary,
      refunds: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit))
      }
    };
  },

  getDisputeCases: async (options = {}) => {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 10));
    const skip = (page - 1) * limit;

    const orders = await prisma.order.findMany({
      include: {
        user: {
          select: { id: true, email: true, name: true }
        },
        payment: true,
        items: {
          include: {
            medicine: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit * 2
    });

    const candidates = orders
      .filter((order) => order.status === 'CANCELLED' || ['FAILED', 'REFUNDED'].includes(order.payment?.status))
      .map((order) => {
        const resolved = order.payment?.status === 'REFUNDED';
        return {
          id: `case_${order.id}`,
          orderId: order.id,
          user: order.user,
          amountCents: order.totalCents,
          category: order.payment?.status === 'FAILED' ? 'PAYMENT' : 'REFUND',
          status: resolved ? 'RESOLVED' : 'OPEN',
          reason: resolved ? 'Refund has been completed' : 'Requires admin review',
          createdAt: order.createdAt,
          items: order.items
        };
      });

    const normalizedStatus = options.status ? String(options.status).toUpperCase() : null;
    const filtered = normalizedStatus ? candidates.filter((item) => item.status === normalizedStatus) : candidates;

    const paged = filtered.slice(0, limit);

    return {
      disputes: paged,
      pagination: {
        page,
        limit,
        total: filtered.length,
        totalPages: Math.max(1, Math.ceil(filtered.length / limit))
      }
    };
  }
};
