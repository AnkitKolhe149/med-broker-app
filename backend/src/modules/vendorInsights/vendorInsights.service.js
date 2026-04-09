const { prisma } = require('../../database/prisma');

const DAY_MS = 24 * 60 * 60 * 1000;

const getRangeStart = (timeRange) => {
  const now = new Date();
  const start = new Date(now);

  switch (timeRange) {
    case 'week':
      start.setDate(now.getDate() - 7);
      break;
    case 'quarter':
      start.setMonth(now.getMonth() - 3);
      break;
    case 'year':
      start.setFullYear(now.getFullYear() - 1);
      break;
    case 'month':
    default:
      start.setMonth(now.getMonth() - 1);
      break;
  }

  return start;
};

const toDayStart = (date) => {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  return day;
};

const getVendorAndInventory = async (userId) => {
  const vendorWithInventory = await prisma.vendor.findUnique({
    where: { userId },
    select: {
      id: true,
      companyName: true,
      inventory: {
        select: {
          id: true,
          quantity: true,
          medicineId: true,
          medicine: {
            select: {
              id: true,
              name: true,
              priceCents: true
            }
          }
        }
      }
    }
  });

  if (!vendorWithInventory) {
    return null;
  }

  return {
    vendor: {
      id: vendorWithInventory.id,
      companyName: vendorWithInventory.companyName
    },
    inventory: vendorWithInventory.inventory
  };
};

const getVendorMedicineIds = (inventory = []) => new Set(
  inventory.map((item) => item.medicineId).filter(Boolean)
);

const isVendorOrderItem = (item, vendorId, vendorMedicineIds) => {
  if (item.vendorId) {
    return item.vendorId === vendorId;
  }

  return vendorMedicineIds.has(item.medicineId);
};

const calculateVendorOrderRevenue = (order, vendorId, vendorMedicineIds) => {
  return order.items
    .filter((item) => isVendorOrderItem(item, vendorId, vendorMedicineIds))
    .reduce((sum, item) => sum + (item.unitPriceCents * item.quantity), 0);
};

const formatVendorOrder = (order, vendorId, vendorMedicineIds) => {
  const vendorItems = order.items.filter((item) => isVendorOrderItem(item, vendorId, vendorMedicineIds));
  const totalCents = calculateVendorOrderRevenue(order, vendorId, vendorMedicineIds);

  return {
    id: order.id,
    customer: order.user?.customer?.fullName || order.user?.name || 'Customer',
    amountCents: totalCents,
    status: order.status.toLowerCase(),
    paymentStatus: order.payment?.status?.toLowerCase() || 'unknown',
    createdAt: order.createdAt,
    items: vendorItems.map((item) => ({
      id: item.id,
      medicineId: item.medicineId,
      name: item.medicine?.name || 'Medicine',
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents
    }))
  };
};

const getDashboard = async (userId) => {
  const context = await getVendorAndInventory(userId);
  if (!context) {
    return null;
  }

  const { vendor, inventory } = context;
  const vendorMedicineIds = getVendorMedicineIds(inventory);
  const today = toDayStart(new Date());
  const weekStart = new Date(Date.now() - (6 * DAY_MS));

  const orderWhere = {
    createdAt: { gte: weekStart }
  };

  const [todayOrders, pendingOrders, weeklyOrders, recentOrders, allRecentOrders] = await Promise.all([
    prisma.order.findMany({
      where: orderWhere,
      include: {
        user: {
          select: {
            name: true,
            customer: {
              select: { fullName: true }
            }
          }
        },
        items: true
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.order.count({
      where: {
        createdAt: { gte: weekStart },
        status: 'PENDING'
      }
    }),
    prisma.order.findMany({
      where: orderWhere,
      include: { items: true },
      orderBy: { createdAt: 'asc' }
    }),
    prisma.order.findMany({
      where: orderWhere,
      include: {
        items: true,
        user: {
          select: {
            name: true,
            customer: {
              select: { fullName: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    }),
    prisma.order.findMany({
      where: orderWhere,
      include: {
        items: true,
        user: {
          select: {
            name: true,
            customer: {
              select: { fullName: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  ]);

  const vendorOrders = allRecentOrders.filter((order) =>
    order.items.some((item) => isVendorOrderItem(item, vendor.id, vendorMedicineIds))
  );

  const todayOrdersForVendor = todayOrders.filter((order) =>
    order.items.some((item) => isVendorOrderItem(item, vendor.id, vendorMedicineIds))
  );
  const weeklyOrdersForVendor = weeklyOrders.filter((order) =>
    order.items.some((item) => isVendorOrderItem(item, vendor.id, vendorMedicineIds))
  );

  const todaySales = todayOrdersForVendor.reduce((sum, order) => sum + calculateVendorOrderRevenue(order, vendor.id, vendorMedicineIds), 0);

  const weeklyTrend = Array.from({ length: 7 }, (_, index) => {
    const dayStart = toDayStart(new Date(Date.now() - ((6 - index) * DAY_MS)));
    const dayEnd = new Date(dayStart.getTime() + DAY_MS);
    const dayOrders = weeklyOrdersForVendor.filter((order) => order.createdAt >= dayStart && order.createdAt < dayEnd);

    return {
      day: dayStart.toLocaleDateString('en-US', { weekday: 'short' }),
      orders: dayOrders.length,
      salesCents: dayOrders.reduce((sum, order) => sum + calculateVendorOrderRevenue(order, vendor.id, vendorMedicineIds), 0)
    };
  });

  const lowStockProducts = inventory
    .filter((item) => item.quantity <= 30)
    .sort((a, b) => a.quantity - b.quantity)
    .slice(0, 5)
    .map((item) => ({
      id: item.id,
      name: item.medicine.name,
      stock: item.quantity,
      threshold: 30
    }));

  const totalInventoryValueCents = inventory.reduce(
    (sum, item) => sum + (item.quantity * item.medicine.priceCents),
    0
  );

  return {
    vendor: {
      id: vendor.id,
      companyName: vendor.companyName
    },
    metrics: {
      todaySalesCents: todaySales,
      todayOrders: todayOrdersForVendor.length,
      pendingOrders: vendorOrders.filter((order) => order.status === 'PENDING').length,
      totalProducts: inventory.length,
      totalInventoryValueCents
    },
    weeklyTrend,
    recentOrders: vendorOrders.slice(0, 5).map((order) => formatVendorOrder(order, vendor.id, vendorMedicineIds)),
    lowStockProducts
  };
};

const getVendorOrders = async (userId, options = {}) => {
  const context = await getVendorAndInventory(userId);
  if (!context) {
    return null;
  }

  const { vendor, inventory } = context;
  const vendorMedicineIds = getVendorMedicineIds(inventory);
  const page = Math.max(Number.parseInt(options.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(options.limit, 10) || 10, 1), 100);
  const skip = (page - 1) * limit;
  const status = typeof options.status === 'string' && options.status.trim() && options.status !== 'all'
    ? options.status.trim().toUpperCase()
    : null;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: {
        ...(status ? { status } : {}),
      },
      include: {
        user: {
          select: {
            name: true,
            customer: {
              select: { fullName: true }
            }
          }
        },
        payment: true,
        items: {
          include: {
            medicine: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.order.count({
      where: {
        ...(status ? { status } : {})
      }
    })
  ]);

  const vendorOrders = orders.filter((order) =>
    order.items.some((item) => isVendorOrderItem(item, vendor.id, vendorMedicineIds))
  );

  return {
    vendor: {
      id: vendor.id,
      companyName: vendor.companyName
    },
    orders: vendorOrders.map((order) => formatVendorOrder(order, vendor.id, vendorMedicineIds)),
    pagination: {
      page,
      limit,
      total: vendorOrders.length,
      totalPages: Math.ceil(vendorOrders.length / limit)
    }
  };
};

const getAnalytics = async (userId, timeRange = 'month') => {
  const context = await getVendorAndInventory(userId);
  if (!context) {
    return null;
  }

  const { vendor, inventory } = context;
  const vendorMedicineIds = getVendorMedicineIds(inventory);
  const rangeStart = getRangeStart(timeRange);

  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: rangeStart }
    },
    include: {
      items: {
        include: {
          medicine: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      user: {
        select: {
          customer: {
            select: {
              country: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'asc' }
  });

  const filteredOrders = orders.filter((order) =>
    order.status !== 'CANCELLED' && order.items.some((item) => isVendorOrderItem(item, vendor.id, vendorMedicineIds))
  );
  const orderSummaries = filteredOrders.map((order) => {
    const revenueCents = calculateVendorOrderRevenue(order, vendor.id, vendorMedicineIds);
    const units = order.items
      .filter((item) => isVendorOrderItem(item, vendor.id, vendorMedicineIds))
      .reduce((sum, item) => sum + item.quantity, 0);

    return {
      id: order.id,
      createdAt: order.createdAt,
      revenueCents,
      units,
      items: order.items.filter((item) => isVendorOrderItem(item, vendor.id, vendorMedicineIds)),
      country: order.user?.customer?.country || 'Unknown'
    };
  }).filter((summary) => summary.revenueCents > 0);

  const totalSalesCents = orderSummaries.reduce((sum, order) => sum + order.revenueCents, 0);
  const totalOrders = orderSummaries.length;
  const avgOrderValueCents = totalOrders ? Math.round(totalSalesCents / totalOrders) : 0;

  const productMap = new Map();
  orderSummaries.forEach((order) => {
    order.items.forEach((item) => {
      const current = productMap.get(item.medicineId) || {
        id: item.medicineId,
        name: item.medicine?.name || 'Medicine',
        unitsSold: 0,
        revenueCents: 0
      };
      current.unitsSold += item.quantity;
      current.revenueCents += (item.unitPriceCents * item.quantity);
      productMap.set(item.medicineId, current);
    });
  });

  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.revenueCents - a.revenueCents)
    .slice(0, 5);

  const salesTrendMap = new Map();
  orderSummaries.forEach((order) => {
    const bucket = order.createdAt.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
    const current = salesTrendMap.get(bucket) || { label: bucket, salesCents: 0, orders: 0 };
    current.salesCents += order.revenueCents;
    current.orders += 1;
    salesTrendMap.set(bucket, current);
  });

  const salesTrend = Array.from(salesTrendMap.values()).slice(-8);

  const regionMap = new Map();
  orderSummaries.forEach((order) => {
    const country = order.country;
    const current = regionMap.get(country) || { region: country, orders: 0, revenueCents: 0 };
    current.orders += 1;
    current.revenueCents += order.revenueCents;
    regionMap.set(country, current);
  });

  const regionData = Array.from(regionMap.values())
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 6);

  return {
    vendor: {
      id: vendor.id,
      companyName: vendor.companyName
    },
    metrics: {
      totalSalesCents,
      totalOrders,
      avgOrderValueCents,
      conversionRate: 0
    },
    topProducts,
    salesTrend,
    regionData
  };
};

module.exports = {
  getDashboard,
  getAnalytics,
  getVendorOrders
};
