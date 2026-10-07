export const generateHTML = (bill, fontBase64 = '', width = '80mm') => {
  const isTamil = bill.billLanguage === 'Tamil';

  const t = (en, ta) => isTamil ? ta : en;
  
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
  };

  const fmt = (num) => (Number(num) || 0).toLocaleString('en-IN');
  let eventName = '';
  if (isTamil) {
    eventName = bill.eventTypeNameTa || bill.eventTypeNameEn || (bill.eventType === 'Other' ? bill.otherEventType : bill.eventType);
  } else {
    eventName = bill.eventTypeNameEn || (bill.eventType === 'Other' ? bill.otherEventType : bill.eventType);
  }

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <style>
      ${fontBase64 ? `
      @font-face {
        font-family: 'Noto Sans Tamil';
        src: url(data:font/ttf;base64,${fontBase64}) format('truetype');
        font-weight: normal;
        font-style: normal;
      }
      ` : `@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap');`}
      
      :root {
        --receipt-width: ${width};
      }

      @page {
        margin: 0;
      }
      
      body {
        margin: 0;
        padding: 0;
        font-family: 'Inter', 'Noto Sans Tamil', monospace, sans-serif;
        background-color: #e5e7eb;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      * { box-sizing: border-box; }
      
      @media print {
        body { background-color: #ffffff; }
        .no-print { display: none !important; }
        .receipt { border: none !important; }
      }

      .receipt {
        width: var(--receipt-width);
        margin: 0 auto;
        padding: 4mm 4mm;
        background: #ffffff;
        color: #1e293b;
        font-size: 8pt;
        line-height: 1.4;
      }

      .divider {
        border-top: 1px dashed #94a3b8;
        margin: 2mm 0;
      }
      .divider-solid {
        border-top: 1px solid #64748b;
        margin: 2mm 0;
      }

      .header {
        text-align: center;
        margin-bottom: 2mm;
      }
      .header h1 {
        margin: 0;
        font-size: 14pt;
        color: #253C6D;
        font-weight: 700;
        text-transform: uppercase;
      }
      .event-type-display {
        font-size: 9pt;
        font-weight: 700;
        color: #0f172a;
        margin-top: 1mm;
        text-transform: uppercase;
      }

      /* Compact Info Block */
      .info-block {
        margin: 2mm 0;
        font-size: 8pt;
      }
      .info-line {
        display: flex;
      }
      .info-lbl {
        flex: 0 0 25mm;
        color: #475569;
        padding-right: 2mm;
      }
      .info-val {
        flex: 1;
        font-weight: 600;
        color: #0f172a;
        word-break: break-word;
      }

      /* Services Table */
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 2mm 0;
        table-layout: fixed;
      }
      th {
        font-size: 7.5pt;
        font-weight: 700;
        color: #253C6D;
        text-transform: uppercase;
        border-bottom: 1px solid #94a3b8;
        padding-bottom: 1mm;
      }
      td {
        font-size: 8pt;
        padding: 1.5mm 0;
        vertical-align: top;
      }
      
      .col-srv { width: 42%; text-align: left; font-weight: 600; padding-right: 1mm; }
      .col-qty { width: 14%; text-align: center; }
      .col-rate { width: 19%; text-align: right; padding-right: 1mm; }
      .col-amt { width: 25%; text-align: right; font-weight: 600; }

      .srv-desc {
        font-size: 7pt;
        font-weight: normal;
        color: #475569;
        margin-top: 0.5mm;
        white-space: pre-wrap;
        word-break: break-word;
      }

      /* Financials */
      .fin-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        font-size: 8.5pt;
        margin-bottom: 1mm;
        color: #334155;
      }
      .fin-row > span:first-child {
        flex: 1;
        padding-right: 2mm;
      }
      .fin-row .val {
        font-weight: 600;
        color: #0f172a;
        flex-shrink: 0;
        text-align: right;
      }
      .fin-total {
        display: flex;
        justify-content: space-between;
        font-size: 10pt;
        font-weight: 700;
        color: #253C6D;
        margin: 1.5mm 0;
      }
      .fin-balance {
        display: flex;
        justify-content: space-between;
        font-size: 11pt;
        font-weight: 700;
        color: #F2842F;
        margin: 1.5mm 0;
      }
      .fin-payment {
        display: flex;
        justify-content: space-between;
        font-size: 9pt;
        font-weight: 600;
        color: #0f172a;
        margin: 1mm 0;
      }

      /* Footer */
      .footer {
        text-align: center;
        margin-top: 4mm;
        margin-bottom: 2mm;
      }
      .footer h3 {
        margin: 0;
        font-size: 10pt;
        color: #0f172a;
      }
      .qr-block {
        text-align: center;
        margin: 3mm 0;
      }
      .qr-block img {
        width: 35mm;
        height: 35mm;
        display: block;
        margin: 0 auto;
      }
    </style>
  </head>
  <body>
    <div class="receipt">
      
      <!-- Header -->
      <div class="header">
        ${bill.eventLogo ? `<img src="${bill.eventLogo}" style="max-width: 30mm; max-height: 30mm; display: block; margin: 0 auto 1mm auto;" alt="Event Logo" />` : ''}
        <h1>EVENTBILL</h1>
        <div class="event-type-display">${eventName}</div>
      </div>

      <div class="divider-solid"></div>

      <!-- Info -->
      <div class="info-block">
        <div class="info-line">
          <span class="info-lbl">${t('Date', 'தேதி')}</span>
          <span class="info-val">: ${formatDate(bill.eventDate)}</span>
        </div>
        <div class="info-line">
          <span class="info-lbl">${t('Venue', 'இடம்')}</span>
          <span class="info-val">: ${bill.venue || '-'}</span>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Customer -->
      <div class="info-block">
        <div class="info-line">
          <span class="info-lbl">${t('Customer', 'வாடிக்கையாளர்')}</span>
          <span class="info-val">: ${bill.customerSnapshot?.name || '-'}</span>
        </div>
        <div class="info-line">
          <span class="info-lbl">${t('Phone', 'தொலைபேசி')}</span>
          <span class="info-val">: ${bill.customerSnapshot?.phone || '-'}</span>
        </div>
      </div>

      <div class="divider-solid"></div>

      <!-- Items -->
      <table>
        <thead>
          <tr>
            <th class="col-srv">${t('ITEM / CONTRIBUTION', 'பொருள் / பங்களிப்பு')}</th>
            <th class="col-qty">${t('QTY', 'அளவு')}</th>
            <th class="col-rate">${t('RATE', 'விலை')}</th>
            <th class="col-amt">${t('AMOUNT', 'தொகை')}</th>
          </tr>
        </thead>
        <tbody>
          ${bill.items.map((item) => `
            <tr>
              <td class="col-srv">
                ${item.service}
                ${item.description ? `<div class="srv-desc">${item.description.replace(/\\n/g, '<br/>')}</div>` : ''}
              </td>
              <td class="col-qty">${item.quantity}</td>
              <td class="col-rate">${fmt(item.rate)}</td>
              <td class="col-amt">${fmt(item.amount)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="divider-solid"></div>

      <!-- Financials -->
      <div class="fin-total">
        <span>${t('TOTAL AMOUNT', 'மொத்த தொகை')}</span>
        <span>₹${fmt(bill.totalAmount)}</span>
      </div>


      ${bill.balanceAmount > 0 ? `
      <div class="fin-balance" style="margin-top: 1.5mm;">
        <span>${t('BALANCE', 'மீதி தொகை')}</span>
        <span>₹${fmt(bill.balanceAmount)}</span>
      </div>
      ` : ''}

      ${bill.paymentMethod ? `
      <div class="divider"></div>
      <div class="fin-payment">
        <span>${t('Payment Mode', 'பணம் செலுத்தும் முறை')}</span>
        <span style="text-transform: uppercase;">${bill.paymentMethod}</span>
      </div>
      ` : ''}

      ${bill.changeReturned ? `
      <div class="fin-payment">
        <span>Change Returned</span>
        <span>₹${fmt(bill.changeReturned)}</span>
      </div>
      ` : ''}

      ${bill.paymentStatus ? `
      <div class="fin-payment">
        <span>Payment Status</span>
        <span style="text-transform: uppercase;">${bill.paymentStatus}</span>
      </div>
      ` : ''}

      ${bill.paymentReference ? `
      <div class="fin-payment">
        <span>Ref No</span>
        <span>${bill.paymentReference}</span>
      </div>
      ` : ''}

      <div class="divider-solid"></div>

      ${bill.pendingQr ? `
      <div class="qr-block">
        <img src="${bill.pendingQr}" alt="Scan to Pay" />
        <div style="font-size: 7.5pt; font-weight: bold; margin-top: 1mm; color: #475569;">${t('SCAN TO PAY', 'பணம் செலுத்த ஸ்கேன் செய்யவும்')}</div>
      </div>
      <div class="divider-solid"></div>
      ` : ''}

      <!-- Footer -->
      <div class="footer" style="line-height: 1.5; font-size: 8pt;">
        <strong>${t('Thank you for choosing us!', 'எங்களை தேர்வு செய்ததற்கு நன்றி!')}</strong><br/>
        <span style="color: #475569;">${t('Making your special moments memorable.', 'உங்கள் சிறப்பு தருணங்களை இனிமையாக்குவதில் மகிழ்ச்சி.')}</span>
      </div>

    </div>
  </body>
  </html>
  `;
};
