import { NextRequest, NextResponse } from 'next/server';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface OrderPayload {
  orderId: string;
  orderType: 'buy' | 'sell';
  digitalAsset: string;
  fiatCurrency: string;
  assetAmount: number;
  estimatedFiat: number;
  rate: number;
  walletAddress: string;
  timestamp: string;
  // sell-side: user's bank account
  bankName?: string;
  bankAccount?: string;
  accountType?: string;
  holderName?: string;
  accountLabel?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: OrderPayload = await request.json();

    // Try to persist to backend (fire-and-forget — endpoint may not exist yet)
    if (API_URL) {
      fetch(`${API_URL}/otc/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).catch(() => {});
    }

    const telegramMsg = buildTelegramMessage(body);
    const emailHtml = buildEmailHtml(body);

    let telegramSuccess = false;
    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
      try {
        const res = await fetch(
          `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: TELEGRAM_CHAT_ID,
              text: telegramMsg,
              parse_mode: 'HTML',
            }),
          }
        );
        telegramSuccess = res.ok;
        if (!res.ok) console.error('Telegram error:', await res.text());
      } catch (err) {
        console.error('Telegram send failed:', err);
      }
    }

    let emailSuccess = false;
    if (process.env.RESEND_API_KEY) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: 'OTC Orders <orders@convexo.xyz>',
            to: 'william@convexo.xyz',
            subject: `🔄 OTC ${body.orderType.toUpperCase()} — ${body.assetAmount} ${body.digitalAsset} [${body.orderId}]`,
            html: emailHtml,
          }),
        });
        emailSuccess = res.ok;
      } catch (err) {
        console.error('Email send failed:', err);
      }
    }

    return NextResponse.json({
      success: true,
      orderId: body.orderId,
      notifications: { telegram: telegramSuccess, email: emailSuccess },
    });
  } catch (err) {
    console.error('OTC create-order error:', err);
    return NextResponse.json({ success: false, error: 'Failed to process order' }, { status: 500 });
  }
}

function buildTelegramMessage(d: OrderPayload): string {
  const directionEmoji = d.orderType === 'buy' ? '🟢' : '🔴';
  const fiatFormatted =
    d.fiatCurrency === 'COP'
      ? `${d.estimatedFiat.toLocaleString('es-CO', { minimumFractionDigits: 2 })} COP`
      : `$${d.estimatedFiat.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} USD`;

  let msg = `🔄 <b>NEW OTC ORDER</b>\n`;
  msg += `<b>ID:</b> <code>${d.orderId}</code>\n\n`;

  msg += `${directionEmoji} <b>${d.orderType.toUpperCase()}</b>\n`;
  msg += `<b>Asset:</b> ${d.assetAmount} ${d.digitalAsset}\n`;
  msg += `<b>Fiat:</b> ${d.fiatCurrency}\n`;
  msg += `<b>Rate:</b> 1 ${d.digitalAsset} = ${d.rate} ${d.fiatCurrency}\n`;
  msg += `<b>Estimated Total:</b> ${fiatFormatted}\n`;
  msg += `<b>Time:</b> ${new Date(d.timestamp).toLocaleString()}\n\n`;

  msg += `👛 <b>WALLET</b>\n`;
  msg += `<code>${d.walletAddress}</code>\n\n`;

  if (d.orderType === 'sell' && d.bankName) {
    msg += `🏦 <b>DESTINATION BANK (send ${d.fiatCurrency} here)</b>\n`;
    msg += `<b>Bank:</b> ${d.bankName}\n`;
    msg += `<b>Account:</b> ${d.bankAccount}\n`;
    msg += `<b>Type:</b> ${d.accountType}\n`;
    if (d.holderName) msg += `<b>Holder:</b> ${d.holderName}\n`;
    if (d.accountLabel) msg += `<b>Label:</b> ${d.accountLabel}\n`;
  } else if (d.orderType === 'buy') {
    msg += `💰 <b>CLIENT WILL SEND</b>\n`;
    msg += `${fiatFormatted} → Convexo bank account\n`;
    msg += `Upon confirmation, send <b>${d.assetAmount} ${d.digitalAsset}</b> to wallet above.`;
  }

  return msg;
}

function buildEmailHtml(d: OrderPayload): string {
  const directionColor = d.orderType === 'buy' ? '#10b981' : '#ef4444';
  const fiatFormatted =
    d.fiatCurrency === 'COP'
      ? `${d.estimatedFiat.toLocaleString('es-CO', { minimumFractionDigits: 2 })} COP`
      : `$${d.estimatedFiat.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} USD`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 24px; border-radius: 8px 8px 0 0; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; background: ${directionColor}; color: white; font-weight: bold; font-size: 14px; }
    .content { background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
    .row { display: flex; justify-content: space-between; padding: 10px 14px; background: white; border-radius: 6px; margin-bottom: 8px; }
    .label { color: #6b7280; font-size: 13px; }
    .value { color: #111827; font-weight: 600; }
    .section { margin-top: 20px; padding: 16px; background: white; border-left: 4px solid #8b5cf6; border-radius: 0 6px 6px 0; }
    .mono { font-family: monospace; background: #f3f4f6; padding: 3px 8px; border-radius: 4px; font-size: 13px; }
    .highlight { background: #fef3c7; padding: 12px; border-radius: 6px; margin-top: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0 0 8px 0;">🔄 New OTC Order</h2>
      <span class="badge">${d.orderType.toUpperCase()}</span>
      <p style="margin: 8px 0 0 0; opacity: 0.8; font-size: 13px;">ID: ${d.orderId} · ${new Date(d.timestamp).toLocaleString()}</p>
    </div>
    <div class="content">
      <div class="row"><span class="label">Asset Amount</span><span class="value">${d.assetAmount} ${d.digitalAsset}</span></div>
      <div class="row"><span class="label">Fiat Currency</span><span class="value">${d.fiatCurrency}</span></div>
      <div class="row"><span class="label">Rate</span><span class="value">1 ${d.digitalAsset} = ${d.rate} ${d.fiatCurrency}</span></div>
      <div class="row"><span class="label">Estimated Total</span><span class="value">${fiatFormatted}</span></div>
      <div class="row"><span class="label">Wallet</span><span class="value mono">${d.walletAddress}</span></div>

      ${d.orderType === 'sell' && d.bankName ? `
      <div class="section">
        <strong>🏦 Destination Bank Account</strong>
        <div style="margin-top: 10px;">
          <div class="row"><span class="label">Bank</span><span class="value">${d.bankName}</span></div>
          <div class="row"><span class="label">Account</span><span class="value">${d.bankAccount}</span></div>
          <div class="row"><span class="label">Type</span><span class="value">${d.accountType}</span></div>
          ${d.holderName ? `<div class="row"><span class="label">Holder</span><span class="value">${d.holderName}</span></div>` : ''}
          ${d.accountLabel ? `<div class="row"><span class="label">Label</span><span class="value">${d.accountLabel}</span></div>` : ''}
        </div>
        <div class="highlight">
          Client will send <strong>${d.assetAmount} ${d.digitalAsset}</strong> from wallet above.<br>
          Send <strong>${fiatFormatted}</strong> to the bank account above upon confirmation.
        </div>
      </div>` : `
      <div class="section">
        <strong>💰 Client Payment</strong>
        <div class="highlight" style="margin-top: 12px;">
          Client will send <strong>${fiatFormatted}</strong> to Convexo&apos;s bank account.<br>
          Send <strong>${d.assetAmount} ${d.digitalAsset}</strong> to wallet above upon confirmation.
        </div>
      </div>`}
    </div>
  </div>
</body>
</html>`;
}
