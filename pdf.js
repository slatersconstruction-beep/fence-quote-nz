/* Fence Quote NZ — client quote PDF (text-based, A4) built with jsPDF from the same doc model as the on-screen preview. */
(function (root) {
  'use strict';
  function latin(s) {
    return String(s == null ? '' : s)
      .replace(/[‘’ʼ]/g, "'").replace(/[“”]/g, '"')
      .replace(/[–—−]/g, '-').replace(/→/g, '->').replace(/≈/g, '~')
      .replace(/…/g, '...').replace(/•/g, '-').replace(/ /g, ' ')
      .replace(/[^\x09\x0A\x0D\x20-\x7E -ÿ]/g, '');
  }
  function money(n) { return '$' + Number(n || 0).toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

  function fileName(doc) {
    var client = (doc.client.name || 'client').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'client';
    var ref = String(doc.ref || 'quote').replace(/[^A-Za-z0-9-]+/g, '-');
    return 'Quote_' + ref + '_' + client + '_' + (doc.acceptance ? 'ACCEPTED' : 'awaiting-acceptance') + '.pdf';
  }

  function build(doc) {
    var JsPDF = root.jspdf.jsPDF;
    var pdf = new JsPDF({ unit: 'mm', format: 'a4', compress: true });
    var W = 210, H = 297, M = 16, CW = W - 2 * M;
    var y = M;
    var green = [31, 81, 48];
    pdf.setProperties({ title: 'Quote ' + latin(doc.ref) + ' - ' + latin(doc.business.tradingName), subject: 'Quote for ' + latin(doc.client.name), author: latin(doc.business.tradingName), creator: 'Fence Quote NZ' });

    function ensure(h) { if (y + h > H - 18) { pdf.addPage(); y = M; } }
    function text(str, opts) {
      opts = opts || {};
      pdf.setFont('helvetica', opts.bold ? 'bold' : 'normal');
      pdf.setFontSize(opts.size || 10);
      pdf.setTextColor.apply(pdf, opts.color || [27, 31, 28]);
      var width = opts.width || CW;
      var lines = pdf.splitTextToSize(latin(str), width);
      var lh = (opts.size || 10) * 0.45;
      for (var i = 0; i < lines.length; i++) { ensure(lh); pdf.text(lines[i], opts.x || M, y + lh * 0.8, opts.align ? { align: opts.align } : undefined); y += lh; }
      y += opts.after == null ? 1 : opts.after;
    }
    function heading(str) { ensure(12); y += 3; text(str.toUpperCase(), { bold: true, size: 10, color: green, after: 1 }); pdf.setDrawColor(220, 224, 218); pdf.line(M, y, W - M, y); y += 2; }

    // ---------- Header ----------
    var b = doc.business;
    var headTop = y;
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(26); pdf.setTextColor.apply(pdf, green);
    pdf.text('QUOTE', W - M, y + 9, { align: 'right' });
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10); pdf.setTextColor(27, 31, 28);
    var ry = y + 15;
    [['Quote ref', doc.ref], ['Issue date', doc.issueDateLabel], ['Valid until', doc.expiryDateLabel]].forEach(function (r) {
      pdf.setFont('helvetica', 'bold'); pdf.text(latin(r[0]) + ':', W - M - 38, ry, { align: 'right' });
      pdf.setFont('helvetica', 'normal'); pdf.text(latin(r[1]), W - M, ry, { align: 'right' }); ry += 5;
    });
    text(b.tradingName, { bold: true, size: 16, color: green, width: 110, after: 0.5 });
    var bizLines = [];
    if (b.legalName && b.legalName !== b.tradingName) bizLines.push(b.legalName);
    if (b.contactPerson) bizLines.push('Contact: ' + b.contactPerson);
    if (b.phone) bizLines.push('Phone: ' + b.phone);
    if (b.email) bizLines.push('Email: ' + b.email);
    if (b.address) bizLines.push(b.address);
    if (doc.price.gstRegistered && b.gstNumber) bizLines.push('GST No: ' + b.gstNumber);
    if (b.nzbn) bizLines.push('NZBN: ' + b.nzbn);
    bizLines.forEach(function (l) { text(l, { size: 9.5, width: 105, after: 0 }); });
    y = Math.max(y, ry) + 2;
    pdf.setDrawColor.apply(pdf, green); pdf.setLineWidth(0.8); pdf.line(M, y, W - M, y); pdf.setLineWidth(0.2); y += 4;

    // ---------- Status ----------
    var acc = doc.acceptance;
    var stH = acc ? 15 : 11;
    ensure(stH);
    if (acc) { pdf.setFillColor(227, 244, 232); pdf.setDrawColor(29, 122, 61); } else { pdf.setFillColor(255, 244, 214); pdf.setDrawColor(224, 165, 38); }
    pdf.roundedRect(M, y, CW, stH, 2, 2, 'FD');
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11);
    if (acc) {
      pdf.setTextColor(29, 107, 55);
      pdf.text(latin('ACCEPTED by ' + acc.name), M + 4, y + 6);
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9.5);
      pdf.text(latin('on ' + acc.atLabel), M + 4, y + 11.5);
    } else {
      pdf.setTextColor(122, 79, 0);
      pdf.text('AWAITING ACCEPTANCE - this quote has not been accepted yet', M + 4, y + 7);
    }
    y += stH + 4;

    // ---------- Client ----------
    heading('Prepared for');
    text(doc.client.name || '-', { bold: true, size: 11, after: 0.5 });
    text('Job address: ' + (doc.client.address || '-'), { after: 0.5 });
    if (doc.client.phone) text('Phone: ' + doc.client.phone, { after: 0.5 });
    if (doc.client.email) text('Email: ' + doc.client.email, { after: 0.5 });

    heading('Scope of works');
    text(doc.scope, { after: 1 });

    heading('Exclusions');
    (doc.exclusions.length ? doc.exclusions : ['None stated']).forEach(function (e) {
      var start = y; text('- ' + e, { after: 0.3 }); if (y === start) y += 4;
    });

    heading('Payment terms');
    text(doc.paymentTerms || '-');

    if (doc.schedule) {
      heading('Start date & job length');
      text('Start date: ' + doc.schedule.startLabel);
      text('Job length: ' + doc.schedule.durationLabel);
    }

    // ---------- Price ----------
    var p = doc.price;
    var disc = p.discountPct > 0;
    var boxH = (p.gstRegistered ? 26 : 22) + (disc ? 13 : 0);
    ensure(boxH + 8); y += 3;
    pdf.setDrawColor.apply(pdf, green); pdf.setLineWidth(0.6); pdf.roundedRect(M, y, CW, boxH, 2, 2, 'S'); pdf.setLineWidth(0.2);
    var y0 = y;
    if (disc) {
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10.5); pdf.setTextColor(27, 31, 28);
      pdf.text('Price', M + 4, y + 6);
      pdf.text(latin(money(p.listPrice) + (p.gstRegistered ? ' incl GST' : '')), W - M - 4, y + 6, { align: 'right' });
      pdf.setFont('helvetica', 'bold'); pdf.setTextColor.apply(pdf, green);
      pdf.text(latin('Discount ' + (Math.round(p.discountPct * 100) / 100) + '%'), M + 4, y + 11.5);
      pdf.text(latin('-' + money(p.discountAmount)), W - M - 4, y + 11.5, { align: 'right' });
      pdf.setDrawColor(200, 205, 200); pdf.line(M + 4, y + 13.5, W - M - 4, y + 13.5); pdf.setDrawColor.apply(pdf, green);
      y += 13;
    }
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11); pdf.setTextColor(27, 31, 28);
    pdf.text(disc ? 'FIXED PRICE AFTER DISCOUNT' : 'FIXED PRICE', M + 4, y + 7);
    pdf.setFontSize(20); pdf.text(latin(money(p.amount) + (p.gstRegistered ? ' incl GST' : '')), W - M - 4, y + 9, { align: 'right' });
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9.5);
    if (p.gstRegistered) {
      pdf.text(latin('Price excluding GST ' + money(p.exGst) + '  |  GST (15%) ' + money(p.gst)), W - M - 4, y + 16, { align: 'right' });
      pdf.text(latin(p.gstLine), M + 4, y + 22);
    } else {
      pdf.text(latin(p.gstLine), M + 4, y + 16);
    }
    y = y0 + boxH + 4;

    // ---------- How to pay ----------
    if (b.bankAccountNumber) {
      ensure(36); heading('How to pay');
      if (b.bankAccountName) text('Account name: ' + b.bankAccountName);
      text('Account number: ' + b.bankAccountNumber + (b.bankName ? ' (' + b.bankName + ')' : ''));
      text('Reference: ' + doc.ref);
      var dm = /(\d+(?:\.\d+)?)\s*%\s*deposit/i.exec(doc.paymentTerms || '');
      if (dm) text('Deposit (' + Number(dm[1]) + '%): ' + money(Math.round(p.amount * Number(dm[1])) / 100) + ' on acceptance');
    }

    // ---------- Acceptance ----------
    ensure(acc ? (acc.signature ? 62 : 36) : 34);
    heading('Acceptance');
    if (acc) {
      if (acc.signature) {
        try { ensure(26); var props = pdf.getImageProperties(acc.signature); var sw = 60, sh = Math.min(24, sw * props.height / props.width); pdf.addImage(acc.signature, 'PNG', M, y, sw * (sh / (sw * props.height / props.width)), sh); y += sh + 1; pdf.setDrawColor(150, 150, 150); pdf.line(M, y, M + 70, y); y += 3; text('Signature of ' + acc.name, { size: 8, color: [93, 102, 95], after: 1 }); } catch (e) {}
      }
      text('Accepted by: ' + acc.name, { bold: true, after: 0.5 });
      text('Date and time: ' + acc.atLabel + ' (' + acc.at + ')', { after: 0.5 });
      text('Accepted on the contractor\'s device by ' + (acc.signature ? 'signing above and ' : '') + 'ticking: "' + acc.statement + '"', { size: 9, after: 0.5 });
      text('Record fingerprint (SHA-256): ' + acc.hash, { size: 8, color: [93, 102, 95] });
    } else {
      text('To accept, reply to ' + (b.contactPerson || b.tradingName) + ' confirming you accept quote ' + doc.ref + ', or sign below.', { after: 3 });
      ensure(16);
      pdf.setDrawColor(150, 150, 150);
      pdf.line(M, y + 10, M + 75, y + 10); pdf.line(M + 90, y + 10, M + 135, y + 10); pdf.line(M + 145, y + 10, W - M, y + 10);
      pdf.setFontSize(8.5); pdf.setTextColor(93, 102, 95);
      pdf.text('Name', M, y + 14); pdf.text('Signature', M + 90, y + 14); pdf.text('Date', M + 145, y + 14);
      y += 18;
    }

    // ---------- Footer on every page ----------
    var pages = pdf.getNumberOfPages();
    for (var i = 1; i <= pages; i++) {
      pdf.setPage(i);
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(93, 102, 95);
      pdf.text(latin('This is a quote, not a tax invoice. ' + b.tradingName + ' - Quote ' + doc.ref + ' - valid until ' + doc.expiryDateLabel), M, H - 9);
      pdf.text('Page ' + i + ' of ' + pages, W - M, H - 9, { align: 'right' });
    }
    return pdf;
  }

  function blob(doc) { return build(doc).output('blob'); }

  // ---------------- Invoice (from an accepted quote) ----------------
  function invoiceFileName(inv) {
    var client = (inv.client.name || 'client').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'client';
    return (inv.gstRegistered ? 'Tax-Invoice_' : 'Invoice_') + String(inv.number).replace(/[^A-Za-z0-9-]+/g, '-') + '_' + client + '.pdf';
  }
  function buildInvoice(inv) {
    var JsPDF = root.jspdf.jsPDF;
    var pdf = new JsPDF({ unit: 'mm', format: 'a4', compress: true });
    var W = 210, H = 297, M = 16, CW = W - 2 * M, y = M, green = [31, 81, 48];
    var b = inv.business, title = inv.gstRegistered ? 'TAX INVOICE' : 'INVOICE';
    pdf.setProperties({ title: title + ' ' + latin(inv.number) + ' - ' + latin(b.tradingName), author: latin(b.tradingName), creator: 'Fence Quote NZ' });
    function ensure(h) { if (y + h > H - 18) { pdf.addPage(); y = M; } }
    function text(str, o) {
      o = o || {}; pdf.setFont('helvetica', o.bold ? 'bold' : 'normal'); pdf.setFontSize(o.size || 10); pdf.setTextColor.apply(pdf, o.color || [27, 31, 28]);
      var lines = pdf.splitTextToSize(latin(str), o.width || CW), lh = (o.size || 10) * 0.45;
      for (var i = 0; i < lines.length; i++) { ensure(lh); pdf.text(lines[i], o.x || M, y + lh * 0.8); y += lh; }
      y += o.after == null ? 1 : o.after;
    }
    function heading(str) { ensure(12); y += 3; text(str.toUpperCase(), { bold: true, size: 10, color: green, after: 1 }); pdf.setDrawColor(220, 224, 218); pdf.line(M, y, W - M, y); y += 2; }
    function row(label, val, o) {
      o = o || {}; ensure(7);
      pdf.setFont('helvetica', o.bold ? 'bold' : 'normal'); pdf.setFontSize(o.size || 10.5); pdf.setTextColor(27, 31, 28);
      pdf.text(latin(label), M + 2, y + 5); pdf.text(latin(val), W - M - 2, y + 5, { align: 'right' }); y += o.h || 7;
    }
    // header
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(24); pdf.setTextColor.apply(pdf, green);
    pdf.text(title, W - M, y + 9, { align: 'right' });
    pdf.setFontSize(10); pdf.setTextColor(27, 31, 28);
    var ry = y + 15, headTop = y;
    [['Invoice no', inv.number], ['Invoice date', inv.dateLabel], ['Due date', inv.dueLabel], ['Quote ref', inv.quoteRef]].forEach(function (r) {
      pdf.setFont('helvetica', 'bold'); pdf.text(latin(r[0]) + ':', W - M - 52, ry, { align: 'right' });
      pdf.setFont('helvetica', 'normal'); pdf.text(latin(r[1]), W - M, ry, { align: 'right' }); ry += 5;
    });
    text(b.tradingName, { bold: true, size: 16, color: green, width: 110, after: 0.5 });
    var bl = [];
    if (b.legalName && b.legalName !== b.tradingName) bl.push(b.legalName);
    if (b.phone) bl.push('Phone: ' + b.phone); if (b.email) bl.push('Email: ' + b.email); if (b.address) bl.push(b.address);
    if (inv.gstRegistered) bl.push('GST No: ' + (b.gstNumber || '-'));
    if (b.nzbn) bl.push('NZBN: ' + b.nzbn);
    bl.forEach(function (l) { text(l, { size: 9.5, width: 110, after: 0.2 }); });
    y = Math.max(y, ry) + 4;
    pdf.setDrawColor.apply(pdf, green); pdf.setLineWidth(0.8); pdf.line(M, y, W - M, y); pdf.setLineWidth(0.2); y += 4;

    heading('Bill to');
    text(inv.client.name || '-', { bold: true, after: 0.3 });
    if (inv.client.address) text(inv.client.address, { after: 0.3 });
    if (inv.client.phone) text('Phone: ' + inv.client.phone, { after: 0.3 });
    if (inv.client.email) text('Email: ' + inv.client.email, { after: 0.3 });

    heading('Description');
    text(inv.description);

    heading('Amount');
    if (inv.contractList && inv.discountPct > 0) row('Contract price before discount', money(inv.contractList));
    if (inv.discountPct > 0) row('Discount ' + inv.discountPct + '% (accepted on ' + inv.acceptedLabel + ')', '-' + money(inv.discountAmount));
    row('Agreed fixed price' + (inv.gstRegistered ? ' (incl GST)' : ''), money(inv.contractPrice));
    if (inv.previous > 0) row('Less previously invoiced', '-' + money(inv.previous));
    pdf.setDrawColor(200, 205, 200); pdf.line(M, y + 1, W - M, y + 1); y += 2;
    row(inv.lineLabel, money(inv.amount), { bold: true });
    if (inv.gstRegistered) {
      row('Amount excluding GST', money(inv.exGst), { size: 10 });
      row('GST (15%)', money(inv.gst), { size: 10 });
    }
    // total box
    ensure(22); y += 2;
    pdf.setDrawColor.apply(pdf, green); pdf.setLineWidth(0.6); pdf.roundedRect(M, y, CW, 16, 2, 2, 'S'); pdf.setLineWidth(0.2);
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(12); pdf.setTextColor(27, 31, 28);
    pdf.text('TOTAL DUE' + (inv.gstRegistered ? ' (incl GST)' : ''), M + 4, y + 10);
    pdf.setFontSize(18); pdf.text(latin(money(inv.amount)), W - M - 4, y + 10.5, { align: 'right' });
    y += 20;
    text(inv.gstRegistered ? 'Total includes GST of ' + money(inv.gst) + '.' : 'No GST charged: ' + b.tradingName + ' is not registered for GST.', { size: 9.5 });

    heading('How to pay');
    if (b.bankAccountNumber) {
      if (b.bankAccountName) text('Account name: ' + b.bankAccountName);
      text('Account number: ' + b.bankAccountNumber + (b.bankName ? ' (' + b.bankName + ')' : ''));
      text('Reference: ' + inv.number, { bold: true });
    } else text('Please contact us for payment details. Reference: ' + inv.number);
    text('Due: ' + inv.dueLabel, { bold: true });

    var pages = pdf.getNumberOfPages();
    for (var i = 1; i <= pages; i++) {
      pdf.setPage(i); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(93, 102, 95);
      pdf.text(latin(title + ' ' + inv.number + ' - ' + b.tradingName + ' - for accepted quote ' + inv.quoteRef), M, H - 9);
      pdf.text('Page ' + i + ' of ' + pages, W - M, H - 9, { align: 'right' });
    }
    return pdf;
  }
  function invoiceBlob(inv) { return buildInvoice(inv).output('blob'); }

  root.FQPdf = { build: build, blob: blob, fileName: fileName, latin: latin, buildInvoice: buildInvoice, invoiceBlob: invoiceBlob, invoiceFileName: invoiceFileName };
})(typeof self !== 'undefined' ? self : this);
