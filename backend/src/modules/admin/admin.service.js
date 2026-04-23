const { prisma } = require('../../database/prisma');
const { NotFoundError, ConflictError } = require('../../utils/errors');
const { getEnv } = require('../../config/env');

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

    return prisma.payout.create({
      data: {
        vendorId,
        amountCents: normalizedAmount,
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
          preferredCurrency: true,
          isProfileComplete: true,
          lastLoginAt: true,
          createdAt: true,
          customer: {
            select: { buyerType: true, country: true, city: true }
          },
          vendor: {
            select: { companyName: true, country: true, verificationStatus: true }
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
          medicine: { select: { id: true, name: true, sku: true, category: true, requiresPrescription: true } },
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

    return {
      items,
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

  getComplianceOverview: async () => {
    const [kycDocs, prescriptions, returnRequests, disputes, auditLogs] = await Promise.all([
      prisma.vendorKycDocument.findMany({
        include: {
          vendor: { select: { id: true, companyName: true, country: true } }
        },
        orderBy: { updatedAt: 'desc' },
        take: 50
      }),
      prisma.prescription.findMany({
        include: {
          customer: { select: { id: true, fullName: true, country: true } },
          order: { select: { id: true, orderNumber: true, status: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      }),
      prisma.returnRequest.findMany({
        include: {
          customer: { select: { id: true, fullName: true } },
          order: { select: { id: true, orderNumber: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      }),
      prisma.disputeCase.findMany({
        include: {
          order: { select: { id: true, orderNumber: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      }),
      prisma.auditLog.findMany({
        include: {
          user: { select: { id: true, email: true, role: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      })
    ]);

    return {
      summary: {
        pendingKyc: kycDocs.filter((doc) => doc.status === 'PENDING').length,
        pendingPrescriptions: prescriptions.filter((item) => item.status === 'PENDING').length,
        openDisputes: disputes.filter((item) => item.status === 'OPEN' || item.status === 'UNDER_REVIEW').length,
        openReturns: returnRequests.filter((item) => item.status === 'REQUESTED' || item.status === 'APPROVED').length,
      },
      kycDocs,
      prescriptions,
      returnRequests,
      disputes,
      auditLogs
    };
  },

  getReportsOverview: async () => {
    const [orders, payments, vendors, customers] = await Promise.all([
      prisma.order.findMany({ select: { id: true, status: true, totalCents: true, currencyCode: true, createdAt: true } }),
      prisma.payment.findMany({ select: { id: true, status: true, amountCents: true, currencyCode: true, createdAt: true } }),
      prisma.vendor.findMany({ select: { id: true, companyName: true, verificationStatus: true, country: true } }),
      prisma.customer.findMany({ select: { id: true, fullName: true, buyerType: true, country: true } })
    ]);

    const sixMonths = Array.from({ length: 6 }).map((_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - index));
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleString('en-US', { month: 'short' });
      return { key, label, revenueCents: 0, orders: 0 };
    });

    orders.forEach((order) => {
      if (order.status !== 'PAID') return;
      const key = `${order.createdAt.getFullYear()}-${String(order.createdAt.getMonth() + 1).padStart(2, '0')}`;
      const match = sixMonths.find((item) => item.key === key);
      if (!match) return;
      match.revenueCents += order.totalCents;
      match.orders += 1;
    });

    return {
      summary: {
        totalOrders: orders.length,
        paidOrders: orders.filter((item) => item.status === 'PAID').length,
        cancelledOrders: orders.filter((item) => item.status === 'CANCELLED').length,
        totalRevenueCents: orders.filter((item) => item.status === 'PAID').reduce((acc, item) => acc + item.totalCents, 0),
        refundedPayments: payments.filter((item) => item.status === 'REFUNDED').length,
        verifiedVendors: vendors.filter((item) => item.verificationStatus === 'VERIFIED').length,
        wholesaleCustomers: customers.filter((item) => item.buyerType === 'WHOLESALE').length,
      },
      trends: sixMonths,
      orderStatusBreakdown: orders.reduce((acc, item) => ({ ...acc, [item.status]: (acc[item.status] || 0) + 1 }), {}),
      paymentStatusBreakdown: payments.reduce((acc, item) => ({ ...acc, [item.status]: (acc[item.status] || 0) + 1 }), {}),
      countryBreakdown: {
        vendors: vendors.reduce((acc, item) => ({ ...acc, [item.country]: (acc[item.country] || 0) + 1 }), {}),
        customers: customers.reduce((acc, item) => ({ ...acc, [item.country]: (acc[item.country] || 0) + 1 }), {}),
      }
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
    const exchangeRate = await prisma.exchangeRate.findFirst({ orderBy: { fetchedAt: 'desc' } });

    const hasStripe = Boolean(getEnv('STRIPE_SECRET_KEY'));
    const hasCloudinary = Boolean(getEnv('CLOUDINARY_CLOUD_NAME') && getEnv('CLOUDINARY_API_KEY') && getEnv('CLOUDINARY_API_SECRET'));
    const hasGroq = Boolean(getEnv('GROQ_API_KEY'));
    const hasPinecone = Boolean(getEnv('PINECONE_API_KEY') && getEnv('PINECONE_INDEX'));

    const now = new Date();
    const integrations = [
      {
        key: 'stripe',
        name: 'Stripe Payments',
        connected: hasStripe,
        status: hasStripe ? 'CONNECTED' : 'MISSING_CONFIG',
        note: hasStripe ? 'API keys detected' : 'Missing STRIPE_SECRET_KEY',
        lastCheckedAt: now
      },
      {
        key: 'cloudinary',
        name: 'Cloudinary Storage',
        connected: hasCloudinary,
        status: hasCloudinary ? 'CONNECTED' : 'MISSING_CONFIG',
        note: hasCloudinary ? 'Cloud credentials configured' : 'Cloudinary env vars incomplete',
        lastCheckedAt: now
      },
      {
        key: 'groq',
        name: 'Groq AI',
        connected: hasGroq,
        status: hasGroq ? 'CONNECTED' : 'MISSING_CONFIG',
        note: hasGroq ? 'AI provider key available' : 'Missing GROQ_API_KEY',
        lastCheckedAt: now
      },
      {
        key: 'pinecone',
        name: 'Pinecone Vector DB',
        connected: hasPinecone,
        status: hasPinecone ? 'CONNECTED' : 'MISSING_CONFIG',
        note: hasPinecone ? 'Vector index configured' : 'Missing Pinecone configuration',
        lastCheckedAt: now
      },
      {
        key: 'exchange-rates',
        name: 'Exchange Rates Pipeline',
        connected: Boolean(exchangeRate),
        status: exchangeRate ? 'CONNECTED' : 'MISSING_CONFIG',
        note: exchangeRate ? 'Latest rates available' : 'No exchange-rate sync record found',
        lastCheckedAt: exchangeRate?.fetchedAt || null
      }
    ];

    return {
      summary: {
        connected: integrations.filter((item) => item.connected).length,
        disconnected: integrations.filter((item) => !item.connected).length,
        checkedAt: now
      },
      integrations
    };
  },

  getSettingsOverview: async () => {
    const [users, orders, medicines, exchangeRate] = await Promise.all([
      prisma.user.findMany({ select: { preferredCurrency: true, timezone: true } }),
      prisma.order.findMany({ select: { currencyCode: true } }),
      prisma.medicine.findMany({ select: { requiresPrescription: true, bulkMinQty: true, priceCents: true } }),
      prisma.exchangeRate.findFirst({ orderBy: { fetchedAt: 'desc' } })
    ]);

    return {
      defaults: {
        currency: 'INR',
        locale: 'en-IN',
        platformCurrency: 'INR',
        commonUserCurrencies: [...new Set(users.map((user) => user.preferredCurrency).filter(Boolean))],
        activeOrderCurrencies: [...new Set(orders.map((order) => order.currencyCode).filter(Boolean))],
        exchangeRateBase: exchangeRate?.baseCode || null,
        exchangeRateFetchedAt: exchangeRate?.fetchedAt || null,
      },
      pricing: {
        taxPercent: 12,
        maxDiscountPercent: 20,
        baseMarkupPercent: 8,
        autoReprice: true,
        updateIntervalMinutes: 120
      },
      policy: {
        prescriptionMedicines: medicines.filter((medicine) => medicine.requiresPrescription).length,
        averageBulkMinQty: medicines.length
          ? Math.round(medicines.reduce((acc, medicine) => acc + (medicine.bulkMinQty || 0), 0) / medicines.length)
          : 0,
        averagePriceCents: medicines.length
          ? Math.round(medicines.reduce((acc, medicine) => acc + (medicine.priceCents || 0), 0) / medicines.length)
          : 0,
      }
    };
  }
};
