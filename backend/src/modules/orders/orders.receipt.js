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

const centsToCurrency = (amountCents) => {
  const amount = Number(amountCents || 0) / 100;
  return `$${amount.toFixed(2)}`;
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

  const checkoutSnapshot = order.checkoutSnapshot && typeof order.checkoutSnapshot === 'object'
    ? order.checkoutSnapshot
    : {};
  const pricingSummary = checkoutSnapshot.pricingSummary && typeof checkoutSnapshot.pricingSummary === 'object'
    ? checkoutSnapshot.pricingSummary
    : {};

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
  doc.moveTo(margin, doc.y + 5).lineTo(margin + 150, doc.y + 5).stroke(COLORS.primary);
  doc.moveDown(0.8);

  doc.fillColor(COLORS.dark).fontSize(10).font('Helvetica');
  doc.text(`Order #: ${order.id}`, margin, doc.y);
  doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()} at ${new Date(order.createdAt).toLocaleTimeString()}`, margin + 200, doc.y - 15);

  doc.moveDown(0.3);
  const statusColor = order.status === 'DELIVERED' ? COLORS.success : order.status === 'CANCELLED' ? COLORS.danger : COLORS.accent;
  doc.text(`Order Status: `, margin, doc.y);
  doc.fillColor(statusColor).font('Helvetica-Bold').text(safeText(order.status), margin + 100, doc.y - 12);
  doc.fillColor(COLORS.dark).font('Helvetica');

  const paymentStatusColor = order.payment?.status === 'PAID' || order.payment?.status === 'COMPLETED' ? COLORS.success : COLORS.accent;
  doc.text(`Payment: `, margin + 200, doc.y - 12);
  doc.fillColor(paymentStatusColor).font('Helvetica-Bold').text(safeText(order.payment?.status), margin + 280, doc.y - 12);
  doc.fillColor(COLORS.dark).font('Helvetica');

  doc.moveDown(1);

  // Customer Details Section
  doc.fillColor(COLORS.primary).fontSize(14).font('Helvetica-Bold').text('Customer Details', margin, doc.y);
  doc.moveTo(margin, doc.y + 5).lineTo(margin + 150, doc.y + 5).stroke(COLORS.primary);
  doc.moveDown(0.8);

  doc.fillColor(COLORS.dark).fontSize(10).font('Helvetica');
  const customerName = safeText(order.user?.name || order.user?.customer?.fullName || order.user?.customer?.businessName);
  const customerEmail = safeText(order.user?.email);
  doc.text(`Name: ${customerName}`, margin);
  doc.text(`Email: ${customerEmail}`);
  doc.moveDown(0.8);

  // Items Section
  doc.fillColor(COLORS.primary).fontSize(14).font('Helvetica-Bold').text('Order Items', margin, doc.y);
  doc.moveTo(margin, doc.y + 5).lineTo(margin + 150, doc.y + 5).stroke(COLORS.primary);
  doc.moveDown(0.8);

  // Table header
  doc.fillColor(COLORS.light).rect(margin, doc.y, contentWidth, 25).fill();
  doc.fillColor(COLORS.primary).fontSize(10).font('Helvetica-Bold');
  doc.text('Item', margin + 5, doc.y + 7);
  doc.text('Qty', margin + 280, doc.y + 7);
  doc.text('Price', margin + 320, doc.y + 7);
  doc.text('Total', margin + 400, doc.y + 7);
  doc.moveDown(2);

  doc.fillColor(COLORS.dark).font('Helvetica').fontSize(9);

  if (!order.items.length) {
    doc.text('No items in this order.', margin);
  } else {
    order.items.forEach((item) => {
      const lineTotal = item.unitPriceCents * item.quantity;
      const itemName = safeText(item.medicine?.name);

      doc.text(itemName.substring(0, 30), margin, doc.y, { width: 250 });
      doc.text(item.quantity.toString(), margin + 280, doc.y - 12);
      doc.text(centsToCurrency(item.unitPriceCents), margin + 320, doc.y - 12);
      doc.text(centsToCurrency(lineTotal), margin + 400, doc.y - 12);
      doc.moveDown(0.5);
    });
  }

  doc.moveDown(0.8);

  // Summary Section with colored box
  doc.rect(margin, doc.y - 5, contentWidth, 160).fill(COLORS.light);
  doc.fillColor(COLORS.dark).fontSize(11).font('Helvetica');

  const summaryY = doc.y + 10;
  doc.text('Subtotal:', margin + 10, summaryY);
  doc.text(centsToCurrency(subtotalCents), margin + 320, summaryY);

  if (discountCents > 0) {
    doc.fillColor(COLORS.success).font('Helvetica-Bold');
    doc.text(`Discount:`, margin + 10, summaryY + 20);
    doc.text(`-${centsToCurrency(discountCents)}`, margin + 320, summaryY + 20);
    doc.fillColor(COLORS.dark).font('Helvetica');
  }

  doc.text(`Shipping:`, margin + 10, summaryY + (discountCents > 0 ? 40 : 20));
  doc.text(deliveryChargeCents === 0 ? 'Free' : centsToCurrency(deliveryChargeCents), margin + 320, summaryY + (discountCents > 0 ? 40 : 20));

  doc.text(`Tax (5% GST):`, margin + 10, summaryY + (discountCents > 0 ? 60 : 40));
  doc.text(centsToCurrency(taxCents), margin + 320, summaryY + (discountCents > 0 ? 60 : 40));

  // Total in green box
  doc.rect(margin + 10, summaryY + (discountCents > 0 ? 85 : 65), contentWidth - 20, 35).fill(COLORS.success);
  doc.fillColor('white').fontSize(14).font('Helvetica-Bold');
  doc.text(`TOTAL PAID: ${centsToCurrency(totalCents)}`, margin + 20, summaryY + (discountCents > 0 ? 95 : 75), { align: 'right', width: contentWidth - 40 });

  doc.moveDown(12);

  // Footer section
  doc.moveDown(1);
  doc.fillColor(COLORS.primary).fontSize(13).font('Helvetica-Bold').text('Thank You for Your Order!', { align: 'center' });
  doc.moveDown(0.5);

  doc.fillColor(COLORS.secondary).fontSize(11).font('Helvetica-Bold').text('Visit us again soon for better health & wellness', { align: 'center' });
  doc.moveDown(0.5);

  doc.fillColor(COLORS.dark).fontSize(9).font('Helvetica').text('Questions? Contact support@mediq.com | www.mediq.com', { align: 'center' });
  doc.fontSize(8).text('This is a system-generated receipt. Please keep it safe for your records.', { align: 'center', color: COLORS.dark });

  // Bottom decorative line
  doc.moveTo(margin, pageHeight - 50).lineTo(pageWidth - margin, pageHeight - 50).stroke(COLORS.primary);

  return doc;
};

module.exports = {
  buildOrderReceiptPdf
};
