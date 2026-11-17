const PDFDocument = require('pdfkit');

// Streams a GST-style invoice PDF into the response.
exports.stream = (res, { payment, therapist, client }) => {
  const doc = new PDFDocument({ margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${payment.invoiceNumber}.pdf"`);
  doc.pipe(res);

  const gst = payment.gst > 0;
  doc.fontSize(20).text(gst ? 'TAX INVOICE' : 'INVOICE', { align: 'right' });
  doc.fontSize(10).text(`Invoice no: ${payment.invoiceNumber}`, { align: 'right' });
  doc.text(`Date: ${new Date(payment.paidAt).toLocaleDateString('en-IN')}`, { align: 'right' });
  doc.moveDown();

  doc.fontSize(12).text(therapist.name, { continued: false });
  if (therapist.gstin) doc.fontSize(10).text(`GSTIN: ${therapist.gstin}`);
  doc.fontSize(10).text(therapist.email);
  doc.moveDown();
  doc.fontSize(11).text('Billed to:');
  doc.fontSize(10).text(client.name).text(client.email);
  doc.moveDown(1.5);

  const y = doc.y;
  doc.fontSize(10).text('Description', 50, y).text('Amount (INR)', 400, y, { width: 100, align: 'right' });
  doc.moveTo(50, y + 15).lineTo(550, y + 15).stroke();
  doc.text(payment.description || 'Therapy session', 50, y + 22).text(payment.amount.toFixed(2), 400, y + 22, { width: 100, align: 'right' });
  let ly = y + 50;
  if (gst) {
    doc.text(`GST @ ${((payment.gst / payment.amount) * 100).toFixed(0)}%`, 50, ly).text(payment.gst.toFixed(2), 400, ly, { width: 100, align: 'right' });
    ly += 22;
  }
  doc.moveTo(50, ly).lineTo(550, ly).stroke();
  doc.fontSize(12).text('Total paid', 50, ly + 8).text(payment.total.toFixed(2), 400, ly + 8, { width: 100, align: 'right' });
  doc.fontSize(9).fillColor('#555').text(`Payment reference: ${payment.gateway_transaction_id || '-'}`, 50, ly + 50);
  doc.text('This is a computer generated invoice.', 50, ly + 65);
  doc.end();
};
