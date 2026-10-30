export const generateHTML = (bill, fontBase64 = '') => {
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

  // Build both English and Tamil event names for dual display
  const eventNameEn = bill.eventTypeNameEn || (bill.eventType === 'Other' ? bill.otherEventType : bill.eventType) || '';
  const eventNameTa = bill.eventTypeNameTa || '';
  const dualEventName = eventNameTa && eventNameTa !== eventNameEn ? `${eventNameEn} ${eventNameTa}` : eventName;

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
      ` : `@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400;600;700&family=Inter:wght@400;500;600;700&family=Dancing+Script:wght@700&display=swap');`}
      
      :root {
        --receipt-width: 80mm;
      }

      @page {
        margin: 0;
      }
      
      body {
        margin: 0;
        padding: 0;
        font-family: 'Inter', 'Noto Sans Tamil', sans-serif;
        background-color: #ffffff;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      * { box-sizing: border-box; }

      .receipt {
        width: var(--receipt-width);
        margin: 0 auto;
        padding: 3mm 4mm 4mm 4mm;
        background: #ffffff;
        color: #1a1a1a;
        font-size: 8pt;
        line-height: 1.4;
      }

      /* ── Decorative Lines ── */
      .line-thin {
        border: none;
        border-top: 1px solid #333;
        margin: 1.5mm 0;
      }
      .line-double {
        border: none;
        border-top: 2px solid #111;
        margin: 1.5mm 0;
      }
      .line-dashed {
        border: none;
        border-top: 1px dashed #888;
        margin: 1.5mm 0;
      }

      /* ── Brand Header ── */
      .brand-header {
        text-align: center;
        padding: 2mm 0 1mm 0;
      }
      .brand-venba {
        font-family: 'Dancing Script', 'Georgia', cursive, serif;
        font-size: 22pt;
        font-weight: 700;
        color: #111;
        letter-spacing: 1px;
        margin: 0;
        line-height: 1.1;
      }
      .brand-underline {
        width: 18mm;
        height: 0.5mm;
        background: #333;
        margin: 1mm auto 1.5mm auto;
        border-radius: 1px;
      }
      .brand-emoi {
        font-family: 'Inter', sans-serif;
        font-size: 8pt;
        font-weight: 600;
        letter-spacing: 4px;
        color: #333;
        text-transform: uppercase;
        margin: 0;
      }

      /* ── Sub Header ── */
      .sub-header {
        text-align: center;
        margin: 1.5mm 0;
      }
      .sub-header-title {
        font-size: 10pt;
        font-weight: 700;
        color: #111;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin: 0;
      }
      .sub-header-event {
        font-size: 9pt;
        font-weight: 700;
        color: #111;
        margin-top: 1mm;
        text-transform: uppercase;
      }

      /* ── Info Block ── */
      .info-block {
        margin: 1.5mm 0;
        font-size: 8pt;
      }
      .info-line {
        display: flex;
        line-height: 1.6;
      }
      .info-lbl {
        flex: 0 0 20mm;
        color: #444;
        font-weight: 500;
      }
      .info-val {
        flex: 1;
        font-weight: 600;
        color: #111;
        word-break: break-word;
      }

      /* ── Items Table ── */
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 1.5mm 0;
        table-layout: fixed;
      }
      th {
        font-size: 7pt;
        font-weight: 700;
        color: #111;
        text-transform: uppercase;
        border-bottom: 1px solid #555;
        padding: 1mm 0;
        letter-spacing: 0.3px;
      }
      td {
        font-size: 8pt;
        padding: 1.5mm 0;
        vertical-align: top;
        color: #222;
      }
      
      .col-srv { width: 42%; text-align: left; font-weight: 600; padding-right: 1mm; }
      .col-qty { width: 14%; text-align: center; }
      .col-rate { width: 19%; text-align: right; padding-right: 1mm; }
      .col-amt { width: 25%; text-align: right; font-weight: 700; }

      .srv-desc {
        font-size: 7pt;
        font-weight: normal;
        color: #555;
        margin-top: 0.5mm;
        white-space: pre-wrap;
        word-break: break-word;
      }

      /* ── Financials ── */
      .fin-total {
        display: flex;
        justify-content: space-between;
        font-size: 11pt;
        font-weight: 700;
        color: #111;
        margin: 2mm 0 1mm 0;
        padding: 1mm 0;
      }

      .fin-balance {
        display: flex;
        justify-content: space-between;
        font-size: 10pt;
        font-weight: 700;
        color: #c0392b;
        margin: 1mm 0;
      }

      .fin-detail {
        display: flex;
        justify-content: space-between;
        font-size: 8.5pt;
        font-weight: 600;
        color: #222;
        margin: 0.8mm 0;
        line-height: 1.5;
      }

      /* ── Thank You ── */
      .thank-you {
        text-align: center;
        margin: 3mm 0 2mm 0;
        line-height: 1.5;
      }
      .thank-you-title {
        font-size: 8.5pt;
        font-weight: 700;
        font-style: italic;
        color: #222;
      }
      .thank-you-sub {
        font-size: 7pt;
        color: #555;
        margin-top: 0.5mm;
      }

      /* ── Company Footer ── */
      .company-footer {
        text-align: center;
        margin-top: 2mm;
        padding-top: 1.5mm;
      }
      .company-name {
        font-size: 8pt;
        font-weight: 700;
        color: #111;
      }
      .company-contact {
        font-size: 7pt;
        color: #555;
        margin-top: 0.5mm;
      }
    </style>
  </head>
  <body>
    <div class="receipt">
      
      <!-- Brand Header: Venba E-MOI -->
      <div class="brand-header">
        <div class="brand-venba">Venba</div>
        <div class="brand-underline"></div>
        <div class="brand-emoi">E - M O I</div>
      </div>

      <hr class="line-double" />

      <!-- Sub Header: MOI BILL + Event Name -->
      <div class="sub-header">
        <div class="sub-header-title">MOI BILL</div>
        <div class="sub-header-event">${dualEventName}</div>
      </div>

      <hr class="line-thin" />

      <!-- Bill Info -->
      <div class="info-block">
        <div class="info-line">
          <span class="info-lbl">${t('Date', 'தேதி')}</span>
          <span class="info-val">: ${formatDate(bill.eventDate)}</span>
        </div>
        ${bill.venue ? `
        <div class="info-line">
          <span class="info-lbl">${t('Venue', 'இடம்')}</span>
          <span class="info-val">: ${bill.venue}</span>
        </div>
        ` : ''}
      </div>

      <hr class="line-dashed" />

      <!-- Customer Info -->
      <div class="info-block">
        <div class="info-line">
          <span class="info-lbl">${t('Name', 'பெயர்')}</span>
          <span class="info-val">: ${bill.customerSnapshot?.name || '-'}</span>
        </div>
        ${bill.customerSnapshot?.phone ? `
        <div class="info-line">
          <span class="info-lbl">${t('Phone', 'தொலைபேசி')}</span>
          <span class="info-val">: ${bill.customerSnapshot.phone}</span>
        </div>
        ` : ''}
      </div>

      <hr class="line-thin" />

      <!-- Items Table -->
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

      <hr class="line-double" />

      <!-- Total Amount -->
      <div class="fin-total">
        <span>${t('TOTAL AMOUNT', 'மொத்த தொகை')}</span>
        <span>₹${fmt(bill.totalAmount)}</span>
      </div>

      ${bill.balanceAmount > 0 ? `
      <div class="fin-balance">
        <span>${t('BALANCE', 'மீதி தொகை')}</span>
        <span>₹${fmt(bill.balanceAmount)}</span>
      </div>
      ` : ''}

      ${bill.paymentMethod || bill.paymentStatus ? `
      <hr class="line-dashed" />
      ` : ''}

      ${bill.paymentMethod ? `
      <div class="fin-detail">
        <span>${t('Payment Mode', 'பணம் செலுத்தும் முறை')}</span>
        <span style="text-transform: uppercase;">${bill.paymentMethod}</span>
      </div>
      ` : ''}

      ${bill.paymentStatus ? `
      <div class="fin-detail">
        <span>${t('Payment Status', 'பணம் நிலை')}</span>
        <span style="text-transform: uppercase;">${bill.paymentStatus}</span>
      </div>
      ` : ''}

      ${bill.changeReturned ? `
      <div class="fin-detail">
        <span>${t('Change Returned', 'மீதி திருப்பியது')}</span>
        <span>₹${fmt(bill.changeReturned)}</span>
      </div>
      ` : ''}

      ${bill.paymentReference ? `
      <div class="fin-detail">
        <span>${t('Ref No', 'குறிப்பு எண்')}</span>
        <span>${bill.paymentReference}</span>
      </div>
      ` : ''}

      <hr class="line-double" />

      <!-- Thank You -->
      <div class="thank-you">
        <div class="thank-you-title">${t('Thank you for choosing us!', 'எங்களை தேர்வு செய்ததற்கு நன்றி!')}</div>
        <div class="thank-you-sub">${t('Making your special moments memorable.', 'உங்கள் சிறப்பு தருணங்களை இனிமையாக்குவதில் மகிழ்ச்சி.')}</div>
      </div>

      <!-- Company Footer -->
      <div class="company-footer">
        <div class="company-name">Venba Tech Solutions</div>
        <div class="company-contact">Contact: 7006472735 | 6362146398</div>
      </div>

    </div>
  </body>
  </html>
  `;
};
