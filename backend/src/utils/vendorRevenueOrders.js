/**
 * Vendor earnings: cash collected (or equivalent) — not unpaid PENDING carts.
 *
 * Include:
 * - PAID / SHIPPED (normal flow after capture + fulfillment)
 * - Any non-cancelled order whose payment succeeded (handles cases where Order.status lagged PAID)
 */
const VENDOR_REVENUE_ORDER_STATUSES = ['PAID', 'SHIPPED'];

/** Prisma nested `Order` clause for joins from OrderItem. */
const orderWhereVendorRevenue = {
  OR: [
    { status: { in: VENDOR_REVENUE_ORDER_STATUSES } },
    {
      AND: [
        { status: { not: 'CANCELLED' } },
        { payment: { is: { status: 'SUCCEEDED' } } }
      ]
    }
  ]
};

/**
 * Prefer persisted line totals; fallback for rows created before checkout set `lineTotalCents`.
 * (Old flow left lineTotal at 0 while unitPrice × qty was authoritative.)
 */
const orderItemVendorLineGrossCents = (item) => {
  const lineFromDb = Number(item?.lineTotalCents);
  if (Number.isFinite(lineFromDb) && lineFromDb > 0) {
    return Math.floor(lineFromDb);
  }
  const qty = Math.max(1, Number.parseInt(String(item?.quantity ?? 1), 10) || 1);
  const unit = Number(item?.unitPriceCents);
  const safeUnit = Number.isFinite(unit) && unit >= 0 ? Math.floor(unit) : 0;
  const disc = Number(item?.discountCents);
  const safeDisc =
    Number.isFinite(disc) && disc >= 0 ? Math.min(Math.floor(disc), qty * safeUnit) : 0;
  return Math.max(0, qty * safeUnit - safeDisc);
};

module.exports = {
  VENDOR_REVENUE_ORDER_STATUSES,
  orderWhereVendorRevenue,
  orderItemVendorLineGrossCents
};
