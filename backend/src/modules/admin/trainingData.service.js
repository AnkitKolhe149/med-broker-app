const { prisma } = require('../../database/prisma');

/**
 * Exports time-windowed training data for the demand forecasting model.
 * Each row = one medicine in one month, with features computed from that window.
 * Target (y) = actual sales in the NEXT month.
 */
const exportDemandTrainingData = async (monthsBack = 12) => {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setMonth(now.getMonth() - monthsBack);

  // Fetch all non-cancelled orders with their items, grouped by month
  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: cutoff },
      status: { not: 'CANCELLED' }
    },
    include: {
      items: {
        include: {
          medicine: {
            select: {
              id: true,
              name: true,
              priceCents: true,
              category: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'asc' }
  });

  // Fetch all inventory data for stock levels
  const inventoryItems = await prisma.inventory.findMany({
    include: {
      medicine: {
        select: { id: true, name: true, priceCents: true, category: true }
      },
      vendor: {
        select: { id: true, companyName: true }
      }
    }
  });

  // Fetch any active coupons/promotions for promotion_active signal
  let activeCoupons = [];
  try {
    activeCoupons = await prisma.coupon.findMany({
      where: { isActive: true }
    });
  } catch (_) {
    // Coupon model may not exist
  }

  // Build monthly sales aggregation: { medicineId -> { 'YYYY-MM' -> totalQty } }
  const monthlySales = {};
  const allMedicineIds = new Set();

  orders.forEach(order => {
    const monthKey = `${order.createdAt.getFullYear()}-${String(order.createdAt.getMonth() + 1).padStart(2, '0')}`;
    order.items.forEach(item => {
      allMedicineIds.add(item.medicineId);
      if (!monthlySales[item.medicineId]) {
        monthlySales[item.medicineId] = {};
      }
      monthlySales[item.medicineId][monthKey] =
        (monthlySales[item.medicineId][monthKey] || 0) + item.quantity;
    });
  });

  // Also add medicines from inventory that may have zero sales
  inventoryItems.forEach(inv => allMedicineIds.add(inv.medicineId));

  // Build medicine metadata lookup
  const medicineMeta = {};
  orders.forEach(order => {
    order.items.forEach(item => {
      if (!medicineMeta[item.medicineId] && item.medicine) {
        medicineMeta[item.medicineId] = {
          name: item.medicine.name,
          priceCents: item.medicine.priceCents,
          category: item.medicine.category || 'GENERAL'
        };
      }
    });
  });
  inventoryItems.forEach(inv => {
    if (!medicineMeta[inv.medicineId] && inv.medicine) {
      medicineMeta[inv.medicineId] = {
        name: inv.medicine.name,
        priceCents: inv.medicine.priceCents,
        category: inv.medicine.category || 'GENERAL'
      };
    }
  });

  // Build inventory lookup: medicineId -> latest stock level
  const stockLookup = {};
  inventoryItems.forEach(inv => {
    // Take the highest stock if multiple vendors
    stockLookup[inv.medicineId] = Math.max(stockLookup[inv.medicineId] || 0, inv.quantity);
  });

  // Generate month keys for the range
  const monthKeys = [];
  const cursor = new Date(cutoff);
  while (cursor <= now) {
    monthKeys.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`);
    cursor.setMonth(cursor.getMonth() + 1);
  }

  // Build training rows: for each medicine, for each month (except the last),
  // features are from month[i], target is sales in month[i+1]
  const trainingRows = [];

  allMedicineIds.forEach(medicineId => {
    const meta = medicineMeta[medicineId];
    if (!meta) return;

    const salesByMonth = monthlySales[medicineId] || {};

    for (let i = 0; i < monthKeys.length - 1; i++) {
      const currentMonth = monthKeys[i];
      const nextMonth = monthKeys[i + 1];
      const currentMonthSales = salesByMonth[currentMonth] || 0;
      const nextMonthSales = salesByMonth[nextMonth] || 0;

      // Calculate seasonality index: ratio of current month sales to average monthly sales
      const allMonthSales = monthKeys.map(mk => salesByMonth[mk] || 0);
      const avgMonthlySales = allMonthSales.reduce((a, b) => a + b, 0) / allMonthSales.length || 1;
      const seasonalityIndex = avgMonthlySales > 0
        ? Math.round((currentMonthSales / avgMonthlySales) * 100) / 100
        : 1.0;

      // Promotion active: 1 if any coupon applies to this category
      const promotionActive = activeCoupons.length > 0 ? 1 : 0;

      trainingRows.push({
        medicine_id: medicineId,
        medicine_name: meta.name,
        category: meta.category,
        month: currentMonth,
        past_month_sales: currentMonthSales,
        price: Math.round(meta.priceCents / 100 * 100) / 100,
        stock_level: stockLookup[medicineId] || 0,
        seasonality_index: Math.max(0.1, Math.min(3.0, seasonalityIndex)),
        promotion_active: promotionActive,
        actual_next_month_sales: nextMonthSales // TARGET variable for training
      });
    }
  });

  return {
    exportedAt: new Date().toISOString(),
    monthsAnalyzed: monthKeys.length,
    uniqueMedicines: allMedicineIds.size,
    totalRows: trainingRows.length,
    features: ['past_month_sales', 'price', 'stock_level', 'seasonality_index', 'promotion_active'],
    target: 'actual_next_month_sales',
    rows: trainingRows
  };
};

module.exports = { exportDemandTrainingData };
