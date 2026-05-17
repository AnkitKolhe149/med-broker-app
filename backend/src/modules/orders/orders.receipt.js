const PDFDocument = require('pdfkit');

// Platform color scheme (healthcare professional palette)
const COLORS = {
  primary: '#2563EB',      // Vibrant Blue
  secondary: '#10B981',    // Emerald Green
  accent: '#F59E0B',       // Amber
  dark: '#1F2937',         // Dark Gray
  light: '#F3F4F6',        // Light Gray
  danger: '#EF4444',       // Red
  success: '#10B981'       // Green
};

const RECEIPT_CURRENCY_FORMATS = {
  INR: { symbol: 'Rs.', locale: 'en-IN' },
  USD: { symbol: '$', locale: 'en-US' },
  EUR: { symbol: '€', locale: 'de-DE' },
  GBP: { symbol: '£', locale: 'en-GB' },
  CAD: { symbol: 'C$', locale: 'en-CA' },
  AUD: { symbol: 'A$', locale: 'en-AU' },
  SGD: { symbol: 'S$', locale: 'en-SG' },
  AED: { symbol: 'د.إ', locale: 'ar-AE' },
  SAR: { symbol: 'ر.س', locale: 'ar-SA' },
  JPY: { symbol: '¥ JPY', locale: 'ja-JP' },
  CNY: { symbol: '¥ CNY', locale: 'zh-CN' },
  BRL: { symbol: 'R$', locale: 'pt-BR' },
  ZAR: { symbol: 'R', locale: 'en-ZA' },
  RUB: { symbol: '₽', locale: 'ru-RU' }
};

const centsToCurrency = (amountCents) => {
  const amount = Number(amountCents || 0) / 100;
  return `${amount.toFixed(2)}`;
};

const safeText = (value, fallback = 'N/A') => {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  return String(value);
};

const drawRectangle = (doc, x, y, width, height, color) => {
  doc.rect(x, y, width, height).fillAndStroke(color);
};

const buildOrderReceiptPdf = (order) => {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 40,
    bufferPages: true
  });

  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const margin = 40;
  const contentWidth = pageWidth - (margin * 2);

  // Header background box
  doc.rect(0, 0, pageWidth, 100).fill(COLORS.primary);

  // Logo/Brand text
  doc.fillColor('white').fontSize(32).font('Helvetica-Bold').text('MedIQ', margin + 10, 25);
  doc.fontSize(12).font('Helvetica').text('Your Trusted Medicine Delivery Partner', margin + 10, 65);

  // Reset position and colors
  doc.fillColor(COLORS.dark).font('Helvetica');
  doc.y = 120;
  doc.moveDown(0.5);

  const PAYMENT_CONFIG = require('../../config/payment');
  const { normalizeCurrencyCode } = require('../../utils/currencyPipeline');

  const checkoutSnapshot = order.checkoutSnapshot && typeof order.checkoutSnapshot === 'object'
    ? order.checkoutSnapshot
    : {};
  const pricingSummary = checkoutSnapshot.pricingSummary && typeof checkoutSnapshot.pricingSummary === 'object'
    ? checkoutSnapshot.pricingSummary
    : {};
  
  const fallbackCurrency = normalizeCurrencyCode(PAYMENT_CONFIG.currency) || String(process.env.EXCHANGE_RATE_BASE || 'INR').toUpperCase();
  const currencyCode = normalizeCurrencyCode(checkoutSnapshot.currencyCode) || normalizeCurrencyCode(order.currencyCode) || fallbackCurrency;
  const currencyFormat = RECEIPT_CURRENCY_FORMATS[currencyCode] || { symbol: `${currencyCode} `, locale: 'en-US' };

  const formatCurrency = (amountCents) => {
    const amount = Number(amountCents || 0) / 100;
    return `${currencyFormat.symbol} ${amount.toLocaleString(currencyFormat.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`.replace(/\s+/g, ' ').trim();
  };

  const inferLegacyItemScale = () => {
    const rawSubtotalCents = (order.items || []).reduce(
      (sum, item) => sum + (Number(item?.unitPriceCents || 0) * Math.max(1, Number(item?.quantity || 1))),
      0
    );

    if (rawSubtotalCents <= 0 || !Number.isFinite(subtotalCents) || subtotalCents <= 0) {
      return 1;
    }

    const ratio = subtotalCents / rawSubtotalCents;
    return Math.abs(ratio - 1) > 0.15 ? ratio : 1;
  };

  const itemMoneyScale = inferLegacyItemScale();

  const subtotalCents = Number.isFinite(pricingSummary.subtotalCents)
    ? pricingSummary.subtotalCents
    : order.items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);
  const discountCents = Number.isFinite(pricingSummary.discountCents)
    ? pricingSummary.discountCents
    : Math.round(subtotalCents * ((Number(checkoutSnapshot.discountPercent) || 0) / 100));
  const deliveryChargeCents = Number.isFinite(pricingSummary.deliveryChargeCents)
    ? pricingSummary.deliveryChargeCents
    : (checkoutSnapshot.deliveryType === 'express' ? 900 : 0);
  const taxCents = Number.isFinite(pricingSummary.taxCents)
    ? pricingSummary.taxCents
    : Math.round(Math.max(0, subtotalCents - discountCents + deliveryChargeCents) * 0.05);
  const totalCents = Number.isFinite(pricingSummary.totalCents)
    ? pricingSummary.totalCents
    : subtotalCents - discountCents + deliveryChargeCents + taxCents;

  // Order info section
  doc.fillColor(COLORS.primary).fontSize(14).font('Helvetica-Bold').text('Order Information', margin, doc.y);
  doc.moveTo(margin, doc.y + 2).lineTo(margin + 150, doc.y + 2).lineWidth(2).stroke(COLORS.primary);
  doc.moveDown(1);

  const startY = doc.y;
  doc.fillColor(COLORS.dark).fontSize(10).font('Helvetica');
  doc.text(`Order ID:`, margin);
  doc.font('Helvetica-Bold').text(order.id, margin + 80, startY);
  
  doc.font('Helvetica').text(`Order Date:`, margin);
  doc.font('Helvetica-Bold').text(`${new Date(order.createdAt).toLocaleDateString()} ${new Date(order.createdAt).toLocaleTimeString()}`, margin + 80, startY + 15);

  const statusColor = order.status === 'DELIVERED' ? COLORS.success : order.status === 'CANCELLED' ? COLORS.danger : COLORS.accent;
  doc.font('Helvetica').text(`Order Status:`, margin);
  doc.fillColor(statusColor).font('Helvetica-Bold').text(safeText(order.status), margin + 80, startY + 30);
  
  const paymentStatusColor = order.payment?.status === 'PAID' || order.payment?.status === 'COMPLETED' || order.payment?.status === 'SUCCEEDED' ? COLORS.success : COLORS.accent;
  doc.fillColor(COLORS.dark).font('Helvetica').text(`Payment:`, margin);
  doc.fillColor(paymentStatusColor).font('Helvetica-Bold').text(safeText(order.payment?.status || 'PENDING'), margin + 80, startY + 45);

  doc.moveDown(2);

  // Address and Customer details in two columns
  const detailsY = doc.y;
  
  // Left Column: Customer
  doc.fillColor(COLORS.primary).fontSize(12).font('Helvetica-Bold').text('Billing Details', margin, detailsY);
  doc.moveTo(margin, detailsY + 15).lineTo(margin + 100, detailsY + 15).lineWidth(1).stroke(COLORS.primary);
  doc.moveDown(0.8);
  doc.fillColor(COLORS.dark).fontSize(10).font('Helvetica');
  const customerName = safeText(order.user?.name || order.user?.customer?.fullName || order.user?.customer?.businessName);
  doc.text(customerName, margin);
  doc.text(safeText(order.user?.email), margin);
  if (order.user?.customer?.phoneNumber) {
    doc.text(`Phone: ${order.user.customer.phoneNumber}`, margin);
  }

  // Right Column: Shipping
  const col2X = margin + 250;
  doc.fillColor(COLORS.primary).fontSize(12).font('Helvetica-Bold').text('Shipping Address', col2X, detailsY);
  doc.moveTo(col2X, detailsY + 15).lineTo(col2X + 100, detailsY + 15).lineWidth(1).stroke(COLORS.primary);
  doc.moveDown(0.8);
  doc.fillColor(COLORS.dark).fontSize(10).font('Helvetica');
  
  const addr = checkoutSnapshot.deliveryAddress || {};
  if (addr.fullName) {
    doc.text(addr.fullName, col2X);
    doc.text(addr.address, col2X);
    doc.text(`${addr.city}, ${addr.state} ${addr.zipCode}`, col2X);
    doc.text(addr.country || 'India', col2X);
    doc.text(`Phone: ${addr.phone}`, col2X);
  } else {
    doc.text('Same as billing', col2X);
  }

  doc.moveDown(2);

  // Items Section
  doc.fillColor(COLORS.primary).fontSize(14).font('Helvetica-Bold').text('Ordered Medicines', margin);
  doc.moveTo(margin, doc.y + 2).lineTo(margin + 150, doc.y + 2).lineWidth(2).stroke(COLORS.primary);
  doc.moveDown(1);

  // Table header
  const tableTop = doc.y;
  doc.fillColor(COLORS.light).rect(margin, tableTop, contentWidth, 25).fill();
  doc.fillColor(COLORS.primary).fontSize(10).font('Helvetica-Bold');
  doc.text('Medicine Name', margin + 10, tableTop + 7);
  doc.text('Qty', margin + 280, tableTop + 7);
  doc.text('Unit Price', margin + 330, tableTop + 7);
  doc.text('Total', margin + 420, tableTop + 7);
  
  let currentY = tableTop + 30;
  doc.fillColor(COLORS.dark).font('Helvetica').fontSize(9);

  if (!order.items || !order.items.length) {
    doc.text('No items in this order.', margin, currentY);
    currentY += 20;
  } else {
    order.items.forEach((item) => {
      const unitPriceCents = Math.round(Number(item.unitPriceCents || 0) * itemMoneyScale);
      const lineTotal = unitPriceCents * item.quantity;
      const itemName = safeText(item.medicine?.name || item.name);

      doc.text(itemName, margin + 10, currentY, { width: 250 });
      doc.text(item.quantity.toString(), margin + 280, currentY);
      doc.text(formatCurrency(unitPriceCents), margin + 330, currentY);
      doc.text(formatCurrency(lineTotal), margin + 420, currentY);
      
      currentY += 20;
      
      // Handle page break if needed
      if (currentY > pageHeight - 150) {
        doc.addPage();
        currentY = margin;
      }
    });
  }

  doc.moveDown(1.5);
  currentY = doc.y;

  // Summary Section
  const summaryWidth = 200;
  const summaryX = pageWidth - margin - summaryWidth;
  
  doc.fillColor(COLORS.dark).fontSize(10).font('Helvetica');
  
  doc.text('Subtotal:', summaryX, currentY);
  doc.text(formatCurrency(subtotalCents), summaryX + 120, currentY, { align: 'right', width: 70 });
  currentY += 18;

  if (discountCents > 0) {
    doc.fillColor(COLORS.success);
    doc.text(`Discount (${checkoutSnapshot.discountPercent}%):`, summaryX, currentY);
    doc.text(`-${formatCurrency(discountCents)}`, summaryX + 120, currentY, { align: 'right', width: 70 });
    currentY += 18;
    doc.fillColor(COLORS.dark);
  }

  doc.text(`Shipping Fee:`, summaryX, currentY);
  doc.text(deliveryChargeCents === 0 ? 'FREE' : formatCurrency(deliveryChargeCents), summaryX + 120, currentY, { align: 'right', width: 70 });
  currentY += 18;

  doc.text(`Tax (5% GST):`, summaryX, currentY);
  doc.text(formatCurrency(taxCents), summaryX + 120, currentY, { align: 'right', width: 70 });
  currentY += 25;

  // Total Highlight
  doc.rect(summaryX - 10, currentY - 5, summaryWidth + 10, 30).fill(COLORS.primary);
  doc.fillColor('white').fontSize(12).font('Helvetica-Bold');
  doc.text('TOTAL AMOUNT:', summaryX, currentY + 5);
  doc.text(formatCurrency(totalCents), summaryX + 100, currentY + 5, { align: 'right', width: 90 });

  doc.moveDown(4);

  // Footer section
  doc.fillColor(COLORS.primary).fontSize(14).font('Helvetica-Bold').text('Thank You for Choosing MedIQ!', { align: 'center' });
  doc.moveDown(0.5);

  doc.fillColor(COLORS.dark).fontSize(10).font('Helvetica').text('Quality healthcare at your doorstep.', { align: 'center' });
  doc.moveDown(0.5);

  doc.fontSize(9).text('Questions? Contact support@mediq.com | +91 1800-MED-IQ', { align: 'center' });
  doc.moveDown(1);
  doc.fontSize(8).fillColor('#9CA3AF').text('This is a computer-generated invoice and does not require a physical signature.', { align: 'center' });

  // Bottom decorative line
  doc.moveTo(margin, pageHeight - 40).lineTo(pageWidth - margin, pageHeight - 40).lineWidth(1).stroke(COLORS.primary);

  return doc;
};

module.exports = {
  buildOrderReceiptPdf
};
