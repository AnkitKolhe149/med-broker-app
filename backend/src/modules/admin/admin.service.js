const { prisma } = require('../../database/prisma');
const { NotFoundError, ConflictError } = require('../../utils/errors');
const { getEnv } = require('../../config/env');
const { orderWhereVendorRevenue, orderItemVendorLineGrossCents } = require('../../utils/vendorRevenueOrders');

module.exports = {
  getDashboardStats: async (options = {}) => {
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const rangeStart = options.startDate ? new Date(options.startDate) : startOfCurrentMonth;
    const rangeEnd = options.endDate ? new Date(options.endDate) : now;

    if (isNaN(rangeStart.getTime()) || isNaN(rangeEnd.getTime())) {
      throw new ConflictError('Invalid startDate or endDate format. Must be ISO 8601.');
    }

    // ── Step 1: Fetch global setting ──
    const commissionSetting = await prisma.systemSetting.findUnique({
      where: { key: 'PLATFORM_COMMISSION_PERCENT' },
    }).catch(() => null);
    const currentGlobalRate = commissionSetting ? parseFloat(commissionSetting.value) : 5;

    // ── Step 2: Fetch data ──
    const [totalVendors, totalCustomers, revenueAgg, currentMonthAgg, lastMonthAgg, rolling30DayAgg, paidByVendor, paidOrderItems] = await Promise.all([
      prisma.vendor.count(),
      prisma.customer.count(),
      prisma.order.aggregate({
        where: { ...orderWhereVendorRevenue, createdAt: { gte: rangeStart, lte: rangeEnd } },
        _sum: { totalCents: true },
        _count: { id: true },
      }),
      prisma.order.aggregate({
        where: { ...orderWhereVendorRevenue, createdAt: { gte: startOfCurrentMonth } },
        _sum: { totalCents: true },
      }),
      prisma.order.aggregate({
        where: { ...orderWhereVendorRevenue, createdAt: { gte: startOfLastMonth, lt: startOfCurrentMonth } },
        _sum: { totalCents: true },
      }),
      prisma.order.aggregate({
        where: { ...orderWhereVendorRevenue, createdAt: { gte: thirtyDaysAgo } },
        _sum: { totalCents: true },
        _count: { id: true },
      }),
      // Total already paid out and realized commission per vendor
      prisma.payout.groupBy({
        by: ['vendorId'],
        where: { status: 'COMPLETED' },
        _sum: { amountCents: true, commissionCents: true },
      }),
      prisma.orderItem.findMany({
        where: { order: orderWhereVendorRevenue },
        select: {
          vendorId: true,
          quantity: true,
          unitPriceCents: true,
          discountCents: true,
          lineTotalCents: true,
          order: {
            select: {
              id: true,
              totalCents: true,
              persistedFeeAmount: true
            }
          }
        }
      })
    ]);

    const legacyOrderFeeMap = paidOrderItems.reduce((map, item) => {
      const orderTotal = item.order?.totalCents || 0;
      const orderFee = item.order?.persistedFeeAmount || 0;
      const lineGross = orderItemVendorLineGrossCents(item);
      const itemFee = orderTotal > 0 ? Math.floor(lineGross * (orderFee / orderTotal)) : 0;
      map[item.vendorId] = (map[item.vendorId] || 0) + itemFee;
      return map;
    }, {});

    // ── Step 3: Vendor-level PAID/PENDING fee calculation ──
    // Dashboard "Platform Revenue" = realized profit only (vendors with completed payouts)
    let totalPlatformFeeCents = 0;
    for (const row of paidByVendor) {
      const vendorCommission = row._sum.commissionCents || legacyOrderFeeMap[row.vendorId] || 0;
      if (vendorCommission <= 0) {
        continue;
      }
      totalPlatformFeeCents += vendorCommission;
    }

    // ── Step 4: Return ──
    return {
      totalVendors,
      totalCustomers,
      totalRevenueCents: revenueAgg._sum.totalCents || 0,
      totalOrders: revenueAgg._count.id || 0,
      currentMonthRevenueCents: currentMonthAgg._sum.totalCents || 0,
      lastMonthRevenueCents: lastMonthAgg._sum.totalCents || 0,
      platformCommissionPercent: currentGlobalRate,
      totalPlatformFeeCents,
      rolling30DayRevenueCents: rolling30DayAgg._sum.totalCents || 0,
      rolling30DayOrderCount: rolling30DayAgg._count.id || 0,
      rangeStart,
      rangeEnd,
      lastUpdated: now.toISOString()
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
    const validStatuses = ['VERIFIED', 'REJECTED', 'PENDING'];
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
    // ── Step 1: Fetch current global rate from Settings ──
    const commissionSetting = await prisma.systemSetting.findUnique({
      where: { key: 'PLATFORM_COMMISSION_PERCENT' },
    }).catch(() => null);
    const currentGlobalRate = commissionSetting ? parseFloat(commissionSetting.value) : 5;

    // ── Step 2: Fetch raw data ──
    const vendors = await prisma.vendor.findMany({
      select: { id: true, companyName: true, contactPersonName: true },
    });

    const [paidOrderItems, completedPayouts] = await Promise.all([
      prisma.orderItem.findMany({
        where: { order: orderWhereVendorRevenue },
        select: {
          vendorId: true,
          quantity: true,
          unitPriceCents: true,
          discountCents: true,
          lineTotalCents: true,
          order: {
            select: {
              id: true,
              totalCents: true,
              persistedFeeAmount: true
            }
          }
        }
      }),
      prisma.payout.findMany({
        where: { status: 'COMPLETED' },
        select: { vendorId: true, amountCents: true, commissionCents: true },
      }),
    ]);

    const earnedMap = paidOrderItems.reduce((map, item) => {
      map[item.vendorId] = (map[item.vendorId] || 0) + orderItemVendorLineGrossCents(item);
      return map;
    }, {});

    const paidMap = completedPayouts.reduce((map, payout) => {
      map[payout.vendorId] = (map[payout.vendorId] || 0) + (payout.amountCents || 0);
      return map;
    }, {});

    const historicalFeeMap = completedPayouts.reduce((map, payout) => {
      map[payout.vendorId] = (map[payout.vendorId] || 0) + (payout.commissionCents || 0);
      return map;
    }, {});

    const legacyOrderFeeMap = paidOrderItems.reduce((map, item) => {
      const orderTotal = item.order?.totalCents || 0;
      const orderFee = item.order?.persistedFeeAmount || 0;
      const lineGross = orderItemVendorLineGrossCents(item);
      const itemFee = orderTotal > 0 ? Math.floor(lineGross * (orderFee / orderTotal)) : 0;
      map[item.vendorId] = (map[item.vendorId] || 0) + itemFee;
      return map;
    }, {});

    // ── Step 3: Build raw vendor records, then .map() with PAID/PENDING logic ──
    const rawRecords = vendors.map(v => ({
      vendorId: v.id,
      companyName: v.companyName,
      contactPersonName: v.contactPersonName,
      grossRevenue: earnedMap[v.id] || 0,
      totalPaidCents: paidMap[v.id] || 0,
      historicalPlatformFee: historicalFeeMap[v.id] || legacyOrderFeeMap[v.id] || 0,
      payoutStatus: (paidMap[v.id] || 0) > 0 ? 'PAID' : 'PENDING',
    }));

    const mappedBalances = rawRecords.map(record => {
      if (record.payoutStatus === 'PENDING') {
        const dynamicFee = Math.floor(record.grossRevenue * (currentGlobalRate / 100));
        return {
          ...record,
          platformFee: dynamicFee,
          appliedRate: currentGlobalRate,
          pendingBalance: Math.max(0, record.grossRevenue - dynamicFee - record.totalPaidCents),
        };
      }

      const historicalGross = record.historicalPlatformFee + record.totalPaidCents;
      const historicalRate = historicalGross > 0
        ? Math.round((record.historicalPlatformFee / historicalGross) * 100)
        : currentGlobalRate;

      return {
        ...record,
        platformFee: record.historicalPlatformFee,
        appliedRate: historicalRate,
        pendingBalance: Math.max(0, record.grossRevenue - record.historicalPlatformFee - record.totalPaidCents),
      };
    });

    // ── Step 4: Shape output for frontend ──
    const overview = mappedBalances.map(r => ({
      vendorId: r.vendorId,
      companyName: r.companyName,
      contactPersonName: r.contactPersonName,
      totalEarnedCents: r.grossRevenue,
      commissionCents: r.platformFee,
      commissionRatePercent: r.appliedRate,
      totalPaidCents: r.totalPaidCents,
      pendingBalanceCents: r.pendingBalance,
      total: r.grossRevenue,
    }));

    const totalPlatformFeeCents = mappedBalances.reduce((sum, r) => sum + r.platformFee, 0);

    return {
      data: overview.filter((item) => item.totalEarnedCents > 0 || item.totalPaidCents > 0),
      totalPlatformFeeCents,
      globalRatePercent: currentGlobalRate
    };
  },

  getPayoutRequests: async (options = {}) => {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 20));
    const skip = (page - 1) * limit;

    const where = {
      status: 'PENDING'
    };

    const [requests, total] = await Promise.all([
      prisma.payout.findMany({
        where,
        include: {
          vendor: {
            select: {
              id: true,
              companyName: true,
              contactPersonName: true,
              contactNumber: true,
              user: {
                select: {
                  email: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.payout.count({ where })
    ]);

    return {
      requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit))
      }
    };
  },

  processPayout: async (vendorId, amountCents, options = {}) => {
    const payoutRequestId = options?.payoutRequestId;

    if (payoutRequestId) {
      const payoutRequest = await prisma.payout.findFirst({
        where: {
          id: payoutRequestId,
          vendorId,
          status: 'PENDING'
        }
      });

      if (!payoutRequest) {
        throw new NotFoundError('Pending payout request not found for this vendor');
      }

      // Record admin approval metadata (do not change enum status yet)
      const updated = await prisma.payout.update({
        where: { id: payoutRequest.id },
        data: {
          meta: {
            ...(payoutRequest.meta && typeof payoutRequest.meta === 'object' ? payoutRequest.meta : {}),
            approvedAt: new Date().toISOString(),
            approvedBy: 'ADMIN'
          }
        }
      });

      // Attempt automated transfer via Razorpay Payouts if enabled
      try {
        const paymentsService = require('../payments/payments.service');
        const vendor = await prisma.vendor.findUnique({ where: { id: payoutRequest.vendorId } });
        const payoutResult = await paymentsService.createRazorpayPayout({
          vendor,
          amountCents: payoutRequest.amountCents,
          currency: payoutRequest.currencyCode || undefined,
          notes: { requestId: payoutRequest.id, vendorId: payoutRequest.vendorId }
        });

        if (payoutResult && payoutResult.payout) {
          return prisma.payout.update({
            where: { id: payoutRequest.id },
            data: {
              status: 'COMPLETED',
              transactionId: payoutResult.payout?.id || `TXN-${Date.now()}`,
              processedAt: new Date(),
              meta: {
                ...(payoutRequest.meta && typeof payoutRequest.meta === 'object' ? payoutRequest.meta : {}),
                approvedAt: new Date().toISOString(),
                approvedBy: 'ADMIN',
                payoutProvider: 'razorpay',
                payoutResponse: payoutResult.payout
              }
            }
          });
        }
      } catch (err) {
        // Log error and fallthrough to mark as FAILED
        console.error('Automated payout failed', err && err.message ? err.message : err);
        await prisma.payout.update({
          where: { id: payoutRequest.id },
          data: {
            status: 'FAILED',
            failureReason: err && err.message ? err.message : 'Automated payout failed',
            meta: {
              ...(payoutRequest.meta && typeof payoutRequest.meta === 'object' ? payoutRequest.meta : {}),
              payoutAttemptedAt: new Date().toISOString(),
              payoutError: (err && err.message) || String(err)
            }
          }
        });

        throw err;
      }

      // If payouts not enabled or payoutResult not created, mark as FAILED if necessary
      return prisma.payout.update({
        where: { id: payoutRequest.id },
        data: {
          status: 'FAILED',
          failureReason: 'Automated payout not completed',
          meta: {
            ...(payoutRequest.meta && typeof payoutRequest.meta === 'object' ? payoutRequest.meta : {}),
            payoutAttemptedAt: new Date().toISOString()
          }
        }
      });
    }

    const normalizedAmount = Number(amountCents);
    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      throw new ConflictError('amountCents must be a positive number');
    }

    const commissionSetting = await prisma.systemSetting.findUnique({
      where: { key: 'PLATFORM_COMMISSION_PERCENT' },
    }).catch(() => null);
    const persistedFeeRate = commissionSetting ? parseFloat(commissionSetting.value) : 5;
    const persistedFeeAmount = normalizedAmount * (persistedFeeRate / 100);

    // Lock-in: freeze the current global rate onto all un-frozen PAID orders for this vendor
    const unfrozenOrders = await prisma.order.findMany({
      where: {
        ...orderWhereVendorRevenue,
        persistedFeeRate: null,
        items: { some: { vendorId } }
      },
      select: { id: true, totalCents: true }
    });

    if (unfrozenOrders.length > 0) {
      await Promise.all(unfrozenOrders.map(order =>
        prisma.order.update({
          where: { id: order.id },
          data: {
            persistedFeeRate,
            persistedFeeAmount: order.totalCents * (persistedFeeRate / 100)
          }
        })
      ));
    }

    return prisma.payout.create({
      data: {
        vendorId,
        amountCents: normalizedAmount,
        persistedFeeRate,
        persistedFeeAmount,
        status: 'COMPLETED',
        processedAt: new Date(),
        transactionId: `TXN-${Date.now()}`
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

    const where = {};
    if (options.status) where.status = String(options.status).toUpperCase();
    if (options.startDate || options.endDate) {
      where.createdAt = {};
      if (options.startDate) where.createdAt.gte = new Date(options.startDate);
      if (options.endDate) where.createdAt.lte = new Date(options.endDate);
    }

    const [disputes, total, statusCounts] = await Promise.all([
      prisma.disputeCase.findMany({
        where,
        include: {
          order: { select: { id: true, orderNumber: true, totalCents: true, currencyCode: true } },
          payment: { select: { id: true, status: true, amountCents: true } },
          raisedByUser: { select: { id: true, email: true, name: true } },
          assignedUser: { select: { id: true, email: true, name: true } },
          resolvedUser: { select: { id: true, email: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.disputeCase.count({ where }),
      prisma.disputeCase.groupBy({ by: ['status'], _count: { _all: true } }),
    ]);

    return {
      disputes,
      summary: {
        total,
        statusCounts: statusCounts.reduce((acc, r) => ({ ...acc, [r.status]: r._count._all }), {}),
      },
      pagination: {
        page, limit, total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  },

  getUsersOverview: async (options = {}) => {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 20));
    const skip = (page - 1) * limit;
    const role = options.role ? String(options.role).toUpperCase() : null;
    const search = String(options.search || '').trim();

    const where = {};
    if (role) where.role = role;
    if (options.active !== undefined) where.isActive = String(options.active) === 'true';
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { mobile: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [users, total, roleCounts] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          mobile: true,
          role: true,
          isActive: true,
          isBanned: true,
          moderationNote: true,
          preferredCurrency: true,
          isProfileComplete: true,
          lastLoginAt: true,
          createdAt: true,
          customer: {
            select: { fullName: true, buyerType: true, country: true, city: true }
          },
          vendor: {
            select: { companyName: true, contactPersonName: true, country: true, verificationStatus: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.user.count({ where }),
      prisma.user.groupBy({ by: ['role'], _count: { _all: true } })
    ]);

    return {
      users,
      summary: {
        totalUsers: total,
        roleCounts: roleCounts.reduce((acc, item) => ({ ...acc, [item.role]: item._count._all }), {})
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit))
      }
    };
  },

  getVendorsOverview: async (options = {}) => {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 20));
    const skip = (page - 1) * limit;
    const status = options.status ? String(options.status).toUpperCase() : null;
    const search = String(options.search || '').trim();

    const where = {};
    if (status) where.verificationStatus = status;
    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { contactPersonName: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const [vendors, total, statusCounts] = await Promise.all([
      prisma.vendor.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, name: true, preferredCurrency: true } },
          _count: { select: { inventory: true, payouts: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.vendor.count({ where }),
      prisma.vendor.groupBy({ by: ['verificationStatus'], _count: { _all: true } })
    ]);

    return {
      vendors,
      summary: {
        total,
        statusCounts: statusCounts.reduce((acc, item) => ({ ...acc, [item.verificationStatus]: item._count._all }), {})
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit))
      }
    };
  },

  getCatalogOverview: async (options = {}) => {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 20));
    const skip = (page - 1) * limit;
    const search = String(options.search || '').trim();
    const status = options.status ? String(options.status).toUpperCase() : null;

    const where = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [medicines, total, groupedByStatus] = await Promise.all([
      prisma.medicine.findMany({
        where,
        select: {
          id: true,
          name: true,
          sku: true,
          category: true,
          brand: true,
          status: true,
          priceCents: true,
          requiresPrescription: true,
          updatedAt: true,
          _count: { select: { inventory: true, orderItems: true, reviews: true } }
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.medicine.count({ where }),
      prisma.medicine.groupBy({ by: ['status'], _count: { _all: true } })
    ]);

    return {
      medicines,
      summary: {
        total,
        statusCounts: groupedByStatus.reduce((acc, item) => ({ ...acc, [item.status]: item._count._all }), {})
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit))
      }
    };
  },

  getInventoryOverview: async (options = {}) => {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 20));
    const skip = (page - 1) * limit;
    const vendorId = options.vendorId ? String(options.vendorId) : null;

    const where = {};
    if (vendorId) where.vendorId = vendorId;

    const [items, total] = await Promise.all([
      prisma.inventory.findMany({
        where,
        include: {
          medicine: {
            select: {
              id: true,
              name: true,
              sku: true,
              category: true,
              priceCents: true,
              requiresPrescription: true
            }
          },
          vendor: { select: { id: true, companyName: true, country: true } },
          _count: { select: { batches: true } }
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.inventory.count({ where })
    ]);

    const lowStockCount = items.filter((item) => item.quantity <= item.reorderLevel).length;

    // Vendor flows store retail price on Medicine; admin UI reads Inventory.sellingPriceCents/mrpCents.
    // Coalesce so the dashboard reflects vendor-entered prices even when inventory columns were never set.
    const itemsForAdmin = items.map((item) => {
      const fromMedicine = item.medicine?.priceCents;
      const sellingPriceCents = item.sellingPriceCents ?? fromMedicine ?? null;
      const mrpCents = item.mrpCents ?? fromMedicine ?? null;
      return { ...item, sellingPriceCents, mrpCents };
    });

    return {
      items: itemsForAdmin,
      summary: {
        total,
        lowStockCount,
        inactiveCount: items.filter((item) => !item.isActive).length
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit))
      }
    };
  },

  getSupportTicketsOverview: async (options = {}) => {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 20));
    const skip = (page - 1) * limit;
    const status = options.status ? String(options.status).toUpperCase() : null;

    const where = {};
    if (status) where.status = status;

    const [tickets, total, statusCounts] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        include: {
          requester: { select: { id: true, email: true, name: true } },
          assignee: { select: { id: true, email: true, name: true } },
          order: { select: { id: true, orderNumber: true } },
          _count: { select: { messages: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.supportTicket.count({ where }),
      prisma.supportTicket.groupBy({ by: ['status'], _count: { _all: true } })
    ]);

    return {
      tickets,
      summary: {
        total,
        statusCounts: statusCounts.reduce((acc, item) => ({ ...acc, [item.status]: item._count._all }), {})
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit))
      }
    };
  },

  getComplianceOverview: async (options = {}) => {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 20));
    const skip = (page - 1) * limit;

    const dateFilter = (options.startDate || options.endDate) ? {
      createdAt: {
        ...(options.startDate && { gte: new Date(options.startDate) }),
        ...(options.endDate && { lte: new Date(options.endDate) }),
      },
    } : {};

    const [kycDocs, kycTotal, prescriptions, prescTotal, returnRequests, returnTotal,
      disputes, disputeTotal, auditLogs, auditTotal] = await Promise.all([

        prisma.vendorKycDocument.findMany({
          where: dateFilter,
          include: { vendor: { select: { id: true, companyName: true, country: true } } },
          orderBy: { updatedAt: 'desc' }, skip, take: limit,
        }),
        prisma.vendorKycDocument.count({ where: dateFilter }),

        prisma.prescription.findMany({
          where: dateFilter,
          include: {
            customer: { select: { id: true, fullName: true, country: true } },
            order: { select: { id: true, orderNumber: true, status: true } },
          },
          orderBy: { createdAt: 'desc' }, skip, take: limit,
        }),
        prisma.prescription.count({ where: dateFilter }),

        prisma.returnRequest.findMany({
          where: dateFilter,
          include: {
            customer: { select: { id: true, fullName: true } },
            order: { select: { id: true, orderNumber: true } },
          },
          orderBy: { createdAt: 'desc' }, skip, take: limit,
        }),
        prisma.returnRequest.count({ where: dateFilter }),

        prisma.disputeCase.findMany({
          where: dateFilter,
          include: { order: { select: { id: true, orderNumber: true } } },
          orderBy: { createdAt: 'desc' }, skip, take: limit,
        }),
        prisma.disputeCase.count({ where: dateFilter }),

        prisma.auditLog.findMany({
          where: dateFilter,
          include: { user: { select: { id: true, email: true, role: true } } },
          orderBy: { createdAt: 'desc' }, skip, take: limit,
        }),
        prisma.auditLog.count({ where: dateFilter }),
      ]);

    // Summary counts use fast DB aggregations, not in-memory .filter()
    const [pendingKyc, pendingPrescriptions, openDisputes, openReturns] = await Promise.all([
      prisma.vendorKycDocument.count({ where: { status: 'PENDING' } }),
      prisma.prescription.count({ where: { status: 'PENDING' } }),
      prisma.disputeCase.count({ where: { status: { in: ['OPEN', 'UNDER_REVIEW'] } } }),
      prisma.returnRequest.count({ where: { status: { in: ['REQUESTED', 'APPROVED'] } } }),
    ]);

    return {
      summary: { pendingKyc, pendingPrescriptions, openDisputes, openReturns },
      pagination: { page, limit, totalPages: Math.max(1, Math.ceil(kycTotal / limit)) },
      kycDocs, kycTotal,
      prescriptions, prescTotal,
      returnRequests, returnTotal,
      disputes, disputeTotal,
      auditLogs, auditTotal,
    };
  },
  getReportsOverview: async (options = {}) => {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const startDate = options.startDate ? new Date(options.startDate) : sixMonthsAgo;
    const endDate = options.endDate ? new Date(options.endDate) : now;

    // All aggregations hit the DB — no full-table scans in memory
    const [orderAggs, paymentAggs, vendorStatusCounts, customerTypeCounts,
      orderTrends, vendorCountryAgg, customerCountryAgg] = await Promise.all([

        prisma.order.groupBy({
          by: ['status'],
          _count: { _all: true },
          _sum: { totalCents: true },
        }),

        prisma.payment.groupBy({
          by: ['status'],
          _count: { _all: true },
        }),

        prisma.vendor.groupBy({
          by: ['verificationStatus'],
          _count: { _all: true },
        }),

        prisma.customer.groupBy({
          by: ['buyerType'],
          _count: { _all: true },
        }),

        // Monthly trend data via groupBy on year+month is not directly supported;
        // fetch only PAID orders in range with minimal projection
        prisma.order.findMany({
          where: { ...orderWhereVendorRevenue, createdAt: { gte: startDate, lte: endDate } },
          select: { totalCents: true, createdAt: true },
          orderBy: { createdAt: 'asc' },
        }),

        prisma.vendor.groupBy({ by: ['country'], _count: { _all: true } }),
        prisma.customer.groupBy({ by: ['country'], _count: { _all: true } }),
      ]);

    // Build 6-month trend buckets
    const numMonths = Math.min(12, Math.max(1,
      (endDate.getFullYear() - startDate.getFullYear()) * 12
      + (endDate.getMonth() - startDate.getMonth()) + 1
    ));
    const trends = Array.from({ length: numMonths }).map((_, i) => {
      const d = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
      return {
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: d.toLocaleString('en-US', { month: 'short' }),
        revenueCents: 0, orders: 0,
      };
    });
    orderTrends.forEach(o => {
      const key = `${o.createdAt.getFullYear()}-${String(o.createdAt.getMonth() + 1).padStart(2, '0')}`;
      const bucket = trends.find(t => t.key === key);
      if (bucket) { bucket.revenueCents += o.totalCents; bucket.orders += 1; }
    });

    const orderStatusBreakdown = Object.fromEntries(orderAggs.map(r => [r.status, r._count._all]));
    const paymentStatusBreakdown = Object.fromEntries(paymentAggs.map(r => [r.status, r._count._all]));

    return {
      summary: {
        totalOrders: orderAggs.reduce((s, r) => s + r._count._all, 0),
        paidOrders: orderStatusBreakdown['PAID'] || 0,
        cancelledOrders: orderStatusBreakdown['CANCELLED'] || 0,
        totalRevenueCents: orderAggs.find(r => r.status === 'PAID')?._sum?.totalCents || 0,
        refundedPayments: paymentStatusBreakdown['REFUNDED'] || 0,
        verifiedVendors: vendorStatusCounts.find(r => r.verificationStatus === 'VERIFIED')?._count?._all || 0,
        wholesaleCustomers: customerTypeCounts.find(r => r.buyerType === 'WHOLESALE')?._count?._all || 0,
      },
      trends,
      orderStatusBreakdown,
      paymentStatusBreakdown,
      countryBreakdown: {
        vendors: Object.fromEntries(vendorCountryAgg.map(r => [r.country, r._count._all])),
        customers: Object.fromEntries(customerCountryAgg.map(r => [r.country, r._count._all])),
      },
      rangeStart: startDate,
      rangeEnd: endDate,
    };
  },

  getNotificationsOverview: async (options = {}) => {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 20));
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        include: {
          user: { select: { id: true, email: true, role: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.notification.count()
    ]);

    return {
      notifications,
      summary: {
        total,
        unread: notifications.filter((item) => !item.isRead).length,
        read: notifications.filter((item) => item.isRead).length,
        typeBreakdown: notifications.reduce((acc, item) => ({ ...acc, [item.type]: (acc[item.type] || 0) + 1 }), {})
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit))
      }
    };
  },

  getIntegrationsOverview: async () => {
    // Fetch all integration records from DB — no .env checks
    const rows = await prisma.integration.findMany({ orderBy: { name: 'asc' } });

    const integrations = rows.map(r => ({
      key: r.key,
      name: r.name,
      connected: r.isEnabled && r.status === 'CONNECTED',
      isEnabled: r.isEnabled,
      status: r.status,
      note: r.note,
      lastCheckedAt: r.lastCheckedAt,
      meta: r.meta,
    }));

    return {
      summary: {
        connected: integrations.filter(i => i.connected).length,
        disconnected: integrations.filter(i => !i.connected).length,
        disabled: integrations.filter(i => !i.isEnabled).length,
        checkedAt: new Date(),
      },
      integrations,
    };
  },

  toggleIntegration: async (key, isEnabled) => {
    const existing = await prisma.integration.findUnique({ where: { key } });
    if (!existing) throw new NotFoundError(`Integration '${key}' not found`);
    return prisma.integration.update({
      where: { key },
      data: { isEnabled: Boolean(isEnabled), updatedAt: new Date() },
    });
  },

  getSettingsOverview: async () => {
    // All settings come from DB — no hardcoded values
    const settings = await prisma.systemSetting.findMany({ orderBy: [{ category: 'asc' }, { key: 'asc' }] });

    // Group by category for a structured response
    const grouped = settings.reduce((acc, s) => {
      if (!acc[s.category]) acc[s.category] = {};
      acc[s.category][s.key] = {
        value: s.value,
        label: s.label,
        description: s.description,
        isEditable: s.isEditable,
      };
      return acc;
    }, {});

    return { settings: grouped, raw: settings };
  },

  updateSettings: async (updates) => {
    // updates: { KEY: 'newValue', ... }
    if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
      throw new ConflictError('Request body must be a JSON object of { KEY: value } pairs');
    }

    const keys = Object.keys(updates);
    if (keys.length === 0) throw new ConflictError('No settings keys provided');

    // Validate all keys exist in DB before writing anything
    const existing = await prisma.systemSetting.findMany({
      where: { key: { in: keys } },
      select: { key: true, isEditable: true },
    });

    const existingKeys = new Set(existing.map(s => s.key));
    const unknownKeys = keys.filter(k => !existingKeys.has(k));
    if (unknownKeys.length > 0) {
      throw new ConflictError(`Unknown setting key(s): ${unknownKeys.join(', ')}`);
    }

    const nonEditable = existing.filter(s => !s.isEditable).map(s => s.key);
    if (nonEditable.length > 0) {
      throw new ConflictError(`Setting(s) are read-only and cannot be updated: ${nonEditable.join(', ')}`);
    }

    // Run all updates in a single transaction
    const results = await prisma.$transaction(
      keys.map(key => prisma.systemSetting.update({
        where: { key },
        data: { value: String(updates[key]), updatedAt: new Date() },
      }))
    );

    return results;
  },

  // Wave 1
  updatePrescriptionStatus: async (id, status, adminId, rejectionReason) => {
    // Support calling with either a prescription `id` or an `orderId` (frontend currently sends order.id)
    // First try direct update by prescription id
    try {
      return await prisma.prescription.update({
        where: { id },
        data: { status, reviewedBy: adminId, reviewedAt: new Date(), rejectionReason }
      });
    } catch (err) {
      // If no prescription found by id, try finding by orderId and update that record instead
      const byOrder = await prisma.prescription.findFirst({ where: { orderId: id } });
      if (!byOrder) throw err;
      return prisma.prescription.update({
        where: { id: byOrder.id },
        data: { status, reviewedBy: adminId, reviewedAt: new Date(), rejectionReason }
      });
    }
  },

  verifyKycDocument: async (id, status, adminId, rejectedReason) => {
    return prisma.vendorKycDocument.update({
      where: { id },
      data: { status, verifiedBy: adminId, verifiedAt: new Date(), rejectedReason }
    });
  },

  updateDisputeCase: async (id, data, adminId) => {
    const updateData = { ...data };
    if (data.status === 'RESOLVED') {
      updateData.resolvedAt = new Date();
      updateData.resolvedBy = adminId;
    }
    return prisma.disputeCase.update({
      where: { id },
      data: updateData
    });
  },

  replyToSupportTicket: async (id, message, adminId, isInternal = false) => {
    return prisma.supportTicketMessage.create({
      data: { ticketId: id, senderId: adminId, message, isInternal }
    });
  },

  updateSupportTicketStatus: async (id, status) => {
    const updateData = { status };
    if (status === 'RESOLVED' || status === 'CLOSED') updateData.closedAt = new Date();
    return prisma.supportTicket.update({ where: { id }, data: updateData });
  },

  // Wave 2
  updateUserStatus: async (id, isActive) => {
    return prisma.user.update({ where: { id }, data: { isActive } });
  },

  updateUserModeration: async (id, isBanned, moderationNote, adminId) => {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundError('User not found');
    const fullNote = `[Moderated by Admin ${adminId} on ${new Date().toISOString()}] ${moderationNote || ''}`;
    return prisma.user.update({
      where: { id },
      data: { isBanned, moderationNote: fullNote }
    });
  },

  updateUserRole: async (id, role, adminId) => {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundError('User not found');
    const fullNote = `[Role changed by Admin ${adminId} on ${new Date().toISOString()}]`;
    return prisma.user.update({
      where: { id },
      data: { role, moderationNote: fullNote }
    });
  },

  getAdminAccounts: async () => {
    return prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true, email: true, name: true, createdAt: true, isActive: true, isBanned: true }
    });
  },

  updateMedicineStatus: async (id, status, adminId) => {
    const medicine = await prisma.medicine.findUnique({ where: { id } });
    if (!medicine) throw new NotFoundError('Medicine not found');
    const fullNote = `[Status updated to ${status} by Admin ${adminId} on ${new Date().toISOString()}]`;
    return prisma.medicine.update({
      where: { id },
      data: { status, moderationNote: fullNote }
    });
  },

  adminOverrideMedicine: async (id, data, adminId) => {
    const medicine = await prisma.medicine.findUnique({ where: { id } });
    if (!medicine) throw new NotFoundError('Medicine not found');

    const { stock, ...medicineData } = data;

    const updatePayload = { ...medicineData };
    updatePayload.moderationNote = `Modified by Admin ${adminId} on ${new Date().toISOString()}`;

    const updatedMedicine = await prisma.medicine.update({
      where: { id },
      data: updatePayload
    });

    if (stock !== undefined && stock !== null) {
      const inventory = await prisma.inventory.findFirst({ where: { medicineId: id } });
      if (inventory) {
        await prisma.inventory.update({
          where: { id: inventory.id },
          data: { quantity: parseInt(stock, 10) }
        });
      }
    }

    return updatedMedicine;
  },

  forceDeleteMedicine: async (id) => {
    const medicine = await prisma.medicine.findUnique({ where: { id } });
    if (!medicine) throw new NotFoundError('Medicine not found');
    return prisma.medicine.delete({
      where: { id }
    });
  },

  createCoupon: async (data) => {
    return prisma.coupon.create({ data });
  },

  getCoupons: async () => {
    return prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  },

  deleteCoupon: async (id) => {
    return prisma.coupon.delete({ where: { id } });
  },

  updateReturnRequestStatus: async (id, status, adminId, notes) => {
    const updateData = { status, notes };
    if (status === 'APPROVED') {
      updateData.approvedBy = adminId;
      updateData.approvedAt = new Date();
    }
    return prisma.returnRequest.update({ where: { id }, data: updateData });
  },

  // Wave 3
  broadcastNotification: async (data) => {
    let whereClause = {};
    if (data.targetRole) {
      whereClause = { role: data.targetRole };
    }
    const users = await prisma.user.findMany({ where: whereClause, select: { id: true } });

    if (users.length === 0) return { count: 0 };

    const notifications = users.map(u => ({
      userId: u.id,
      title: data.title,
      body: data.message,
      type: data.type || 'SYSTEM',
      channel: data.channel || 'IN_APP'
    }));

    const result = await prisma.notification.createMany({ data: notifications });
    return { count: result.count };
  },

  adjustInventoryStock: async (inventoryId, delta, note = '') => {
    return prisma.inventory.update({
      where: { id: inventoryId },
      data: {
        quantity: { increment: delta },
        updatedAt: new Date()
      }
    });
  },

  markNotificationRead: async (id) => {
    return prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });
  },

  markAllNotificationsRead: async () => {
    return prisma.notification.updateMany({
      where: { isRead: false },
      data: { isRead: true }
    });
  },

  clearAllNotifications: async () => {
    return prisma.notification.deleteMany({});
  },

  // ✅ Create new admin user (admin-only operation)
  createAdminUser: async (userData) => {
    const { email, password, name } = userData;

    if (!email || !password || !name) {
      throw new ConflictError('Email, password, and name are required');
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Hash the password using bcrypt
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 10);

    // Create the admin user
    const newAdmin = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: 'ADMIN',
        isProfileComplete: true,
        isActive: true
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    return newAdmin;
  },

  getRecentTransactions: async (limit = 10) => {
    const [payouts, payments] = await Promise.all([
      prisma.payout.findMany({
        where: { status: 'COMPLETED' },
        include: { vendor: { select: { companyName: true, contactPersonName: true } } },
        orderBy: { createdAt: 'desc' },
        take: limit
      }),
      prisma.payment.findMany({
        where: { status: 'SUCCEEDED' },
        include: { order: { include: { user: { select: { name: true, email: true } } } } },
        orderBy: { createdAt: 'desc' },
        take: limit
      })
    ]);

    const formattedPayouts = payouts.map(p => ({
      id: p.id,
      type: 'PAYOUT',
      amountCents: p.amountCents,
      status: p.status,
      date: p.processedAt || p.createdAt,
      receiver: p.vendor?.companyName || p.vendor?.contactPersonName || 'Vendor',
      meta: p.transactionId
    }));

    const formattedPayments = payments.map(p => ({
      id: p.id,
      type: 'PAYMENT',
      amountCents: p.amountCents,
      status: p.status,
      date: p.createdAt,
      receiver: 'Platform',
      sender: p.order?.user?.name || 'Customer',
      meta: p.transactionRef
    }));

    return [...formattedPayouts, ...formattedPayments]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit);
  }
};
