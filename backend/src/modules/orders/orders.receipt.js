const PDFDocument = require('pdfkit');

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

const buildOrderReceiptPdf = (order) => {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 50
  });

  const subtotalCents = order.items.reduce((sum, item) => {
    return sum + item.unitPriceCents * item.quantity;
  }, 0);
  const taxCents = Math.round(subtotalCents * 0.05);

  doc.fontSize(20).text('MedIQ Receipt', { align: 'left' });
  doc.moveDown(0.5);

  doc.fontSize(11).text(`Order ID: ${order.id}`);
  doc.text(`Order Date: ${new Date(order.createdAt).toLocaleString()}`);
  doc.text(`Order Status: ${safeText(order.status)}`);
  doc.text(`Payment Status: ${safeText(order.payment?.status)}`);
  doc.moveDown(1);

  doc.fontSize(13).text('Customer Details', { underline: true });
  doc.moveDown(0.3);
  doc.fontSize(11).text(`Name: ${safeText(order.user?.name || order.user?.customer?.fullName || order.user?.customer?.businessName)}`);
  doc.text(`Email: ${safeText(order.user?.email)}`);
  doc.moveDown(1);

  doc.fontSize(13).text('Items', { underline: true });
  doc.moveDown(0.4);

  if (!order.items.length) {
    doc.fontSize(11).text('No items in this order.');
  } else {
    order.items.forEach((item, index) => {
      const lineTotal = item.unitPriceCents * item.quantity;
      doc.fontSize(11).text(`${index + 1}. ${safeText(item.medicine?.name)}`, { continued: false });
      doc.text(`   Quantity: ${item.quantity}`);
      doc.text(`   Unit Price: ${centsToCurrency(item.unitPriceCents)}`);
      doc.text(`   Line Total: ${centsToCurrency(lineTotal)}`);
      doc.moveDown(0.5);
    });
  }

  doc.moveDown(0.5);
  doc.fontSize(13).text('Summary', { underline: true });
  doc.moveDown(0.4);
  doc.fontSize(11).text(`Subtotal: ${centsToCurrency(subtotalCents)}`);
  doc.text(`Tax (5% GST): ${centsToCurrency(taxCents)}`);
  doc.font('Helvetica-Bold').text(`Total Paid: ${centsToCurrency(order.totalCents)}`);
  doc.font('Helvetica').moveDown(1);

  doc.text('This is a system-generated receipt from MedIQ.', { align: 'left' });

  return doc;
};

module.exports = {
  buildOrderReceiptPdf
};
