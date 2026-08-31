import { formatCurrency, formatDate } from "./formatters.js";

/**
 * Generate and print/download an anti-counterfeit Tax Invoice with watermark and security seal
 * @param {Object} order - Order details object
 * @param {Object} storeSettings - Store settings (GSTIN, Address, etc.)
 */
export function generateTaxInvoice(order, storeSettings = {}) {
  if (!order) return;

  const invoiceNumber = `INV-${order.orderNumber || (order.id ? String(order.id).substring(0, 8).toUpperCase() : "SKM")}-${new Date(order.orderDate || Date.now()).getFullYear()}`;
  const gstin = storeSettings?.gstin || "27AAACR1234A1Z5";
  const storeName = "Shreekamalinee";
  const storeSubtitle = "Authentic Handloom & Heritage Silk Ateliers";
  const storeAddress = "Atelier Heritage Lane, Textile City, Mumbai, Maharashtra 400001, India";
  const storeEmail = "concierge@shreekamalinee.com";
  const storePhone = "+91 98765 43210";

  const customerName = order.shippingAddress?.name || order.shippingAddress?.fullName || "Patron Customer";
  const customerAddress = [
    order.shippingAddress?.addressLine1 || order.shippingAddress?.streetAddress,
    order.shippingAddress?.addressLine2,
    order.shippingAddress?.city,
    order.shippingAddress?.state,
    order.shippingAddress?.pincode || order.shippingAddress?.pinCode || order.shippingAddress?.postalCode,
  ].filter(Boolean).join(", ");
  const customerPhone = order.shippingAddress?.phone || order.shippingAddress?.phoneNumber || "N/A";

  const items = order.items || [];
  const subtotal = order.subtotal || order.totalAmount || 0;
  const discount = order.discountAmount || 0;
  const shipping = order.shippingFee || 0;
  const total = order.totalAmount || 0;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Tax Invoice - ${invoiceNumber} - ${storeName}</title>
  <style>
    @page {
      size: A4;
      margin: 12mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
    body {
      color: #1a1a1a;
      background: #ffffff;
      padding: 20px;
      font-size: 12px;
      position: relative;
    }
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-35deg);
      font-size: 40px;
      font-weight: 800;
      color: rgba(128, 0, 32, 0.05);
      white-space: nowrap;
      pointer-events: none;
      z-index: 0;
      letter-spacing: 5px;
      text-transform: uppercase;
      font-family: Georgia, serif;
    }
    .container {
      position: relative;
      z-index: 1;
      max-width: 800px;
      margin: 0 auto;
      border: 1px solid #e0d8cc;
      padding: 30px;
      background: #ffffff;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #800020;
      padding-bottom: 20px;
      margin-bottom: 20px;
    }
    .brand-title {
      font-family: Georgia, serif;
      font-size: 26px;
      font-weight: bold;
      color: #800020;
      letter-spacing: 1px;
    }
    .brand-subtitle {
      font-size: 10.5px;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #777;
      margin-top: 2px;
    }
    .store-details {
      font-size: 10.5px;
      color: #555;
      margin-top: 6px;
      line-height: 1.4;
    }
    .invoice-badge {
      text-align: right;
    }
    .invoice-title {
      font-size: 18px;
      font-weight: bold;
      color: #111;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .invoice-meta {
      margin-top: 6px;
      font-size: 11px;
      color: #444;
      line-height: 1.5;
    }
    .invoice-meta strong {
      color: #111;
    }
    .party-details {
      display: flex;
      justify-content: space-between;
      gap: 20px;
      margin-bottom: 24px;
      padding: 12px 16px;
      background: #faf8f5;
      border: 1px solid #ede6dc;
      border-radius: 4px;
    }
    .party-col {
      flex: 1;
    }
    .party-heading {
      font-size: 10px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #800020;
      margin-bottom: 6px;
    }
    .party-name {
      font-size: 13px;
      font-weight: bold;
      color: #111;
    }
    .party-address {
      font-size: 11px;
      color: #555;
      margin-top: 4px;
      line-height: 1.4;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th {
      background: #800020;
      color: #ffffff;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
      padding: 8px 10px;
      text-align: left;
    }
    th.right, td.right {
      text-align: right;
    }
    td {
      padding: 10px;
      border-bottom: 1px solid #eee;
      font-size: 11.5px;
      color: #222;
      vertical-align: middle;
    }
    tr:nth-child(even) td {
      background: #fdfcfb;
    }
    .item-title {
      font-weight: bold;
      color: #111;
    }
    .item-sub {
      font-size: 10px;
      color: #777;
      margin-top: 2px;
    }
    .summary-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-top: 10px;
      padding-top: 15px;
      border-top: 1px solid #e0d8cc;
    }
    .summary-left {
      max-width: 340px;
      font-size: 10.5px;
      color: #555;
      line-height: 1.5;
    }
    .seal-box {
      border: 1px dashed #800020;
      padding: 10px;
      margin-top: 10px;
      background: #fffafa;
      display: inline-block;
      text-align: center;
      border-radius: 4px;
    }
    .seal-text {
      font-size: 10px;
      font-weight: bold;
      color: #800020;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .summary-right {
      width: 280px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      font-size: 11.5px;
      color: #555;
    }
    .summary-row.grand-total {
      border-top: 2px solid #800020;
      padding-top: 8px;
      margin-top: 6px;
      font-size: 15px;
      font-weight: bold;
      color: #800020;
    }
    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #ede6dc;
      text-align: center;
      font-size: 10px;
      color: #888;
      line-height: 1.5;
    }
    @media print {
      body {
        padding: 0;
      }
      .container {
        border: none;
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="watermark">SHREEKAMALINEE AUTHENTIC HANDLOOM</div>
  <div class="container">
    <div class="header">
      <div>
        <div class="brand-title">${storeName}</div>
        <div class="brand-subtitle">${storeSubtitle}</div>
        <div class="store-details">
          ${storeAddress}<br>
          GSTIN: <strong>${gstin}</strong> | State Code: 27<br>
          Email: ${storeEmail} | Concierge: ${storePhone}
        </div>
      </div>
      <div class="invoice-badge">
        <div class="invoice-title">TAX INVOICE</div>
        <div class="invoice-meta">
          Invoice No: <strong>${invoiceNumber}</strong><br>
          Date: <strong>${formatDate(order.orderDate)}</strong><br>
          Order ID: <strong>#${order.orderNumber || order.id?.slice(0, 8).toUpperCase()}</strong><br>
          Payment: <strong>${order.paymentMethod || "ONLINE"} (${order.paymentStatus || "PAID"})</strong>
        </div>
      </div>
    </div>

    <div class="party-details">
      <div class="party-col">
        <div class="party-heading">Billed & Shipped To:</div>
        <div class="party-name">${customerName}</div>
        <div class="party-address">
          ${customerAddress}<br>
          Phone: <strong>+91 ${customerPhone}</strong>
        </div>
      </div>
      <div class="party-col" style="text-align: right;">
        <div class="party-heading">Dispatch & Consignment Tracking:</div>
        <div class="party-address">
          Courier Partner: <strong>${order.courierName || order.courierPartner || "Blue Dart Express / Speed Post"}</strong><br>
          Tracking AWB: <strong>${order.trackingNumber || "Assigned on Dispatch"}</strong><br>
          Status: <strong>${order.status || "CONFIRMED"}</strong>
        </div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 35px;">#</th>
          <th>Handloom Description & SKU</th>
          <th style="width: 80px;">Size</th>
          <th style="width: 50px;" class="right">Qty</th>
          <th style="width: 100px;" class="right">Unit Price</th>
          <th style="width: 100px;" class="right">Total (INR)</th>
        </tr>
      </thead>
      <tbody>
        ${
          items.length > 0
            ? items
                .map(
                  (item, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td>
              <div class="item-title">${item.productName || item.name || "Authentic Handloom Saree"}</div>
              <div class="item-sub">SKU: ${item.sku || "SKM-HL-001"} | Handloom Mark Certified</div>
            </td>
            <td>${item.size || item.selectedSize || "Standard 6.3m"}</td>
            <td class="right">${item.quantity || item.qty || 1}</td>
            <td class="right">${formatCurrency(item.price || item.unitPrice || 0)}</td>
            <td class="right font-bold">${formatCurrency((item.price || item.unitPrice || 0) * (item.quantity || item.qty || 1))}</td>
          </tr>`
                )
                .join("")
            : `
          <tr>
            <td>1</td>
            <td>
              <div class="item-title">Authentic Handloom Saree Ensemble</div>
              <div class="item-sub">Master Artisan Handwoven Collection</div>
            </td>
            <td>Standard 6.3m</td>
            <td class="right">1</td>
            <td class="right">${formatCurrency(total)}</td>
            <td class="right">${formatCurrency(total)}</td>
          </tr>`
        }
      </tbody>
    </table>

    <div class="summary-section">
      <div class="summary-left">
        <div class="seal-box">
          <div class="seal-text">★ 100% GENUINE HANDLOOM AUTHENTICITY SEAL ★</div>
          <div style="font-size: 9.5px; color: #555; margin-top: 3px;">
            Certified Pitloom Craftsmanship • Stamped & Dispatched from Atelier
          </div>
        </div>
        <p style="margin-top: 10px; font-size: 10px; color: #777;">
          This is a computer-generated tax invoice and requires no physical signature under the Indian Information Technology Act, 2000.
        </p>
      </div>

      <div class="summary-right">
        <div class="summary-row">
          <span>Subtotal Amount:</span>
          <span>${formatCurrency(subtotal)}</span>
        </div>
        ${
          discount > 0
            ? `
        <div class="summary-row" style="color: #15803d; font-weight: 600;">
          <span>Promotional Discount:</span>
          <span>-${formatCurrency(discount)}</span>
        </div>`
            : ""
        }
        <div class="summary-row">
          <span>Insured Courier & Handling:</span>
          <span>${shipping === 0 ? "FREE" : formatCurrency(shipping)}</span>
        </div>
        <div class="summary-row">
          <span>Taxes & GST (Included):</span>
          <span>5% / 12% IGST</span>
        </div>
        <div class="summary-row grand-total">
          <span>Grand Total Payable:</span>
          <span>${formatCurrency(total)}</span>
        </div>
      </div>
    </div>

    <div class="footer">
      Thank you for patronizing Indian handloom artisans at <strong>Shreekamalinee</strong>.<br>
      For queries, returns or styling assistance, write to <strong>${storeEmail}</strong> or call <strong>${storePhone}</strong>.<br>
      www.shreekamalinee.com • All Rights Reserved.
    </div>
  </div>

  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>
`;

  const printWindow = window.open("", "_blank", "width=850,height=900");
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }
}
