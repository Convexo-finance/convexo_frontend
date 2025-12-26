import { NextRequest, NextResponse } from 'next/server';

// Telegram Bot configuration
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || ''; // Get chat ID from @zktps

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      orderType,
      amount,
      rate,
      total,
      chain,
      walletAddress,
      bankName,
      bankAccount,
      accountType,
      userEmail,
    } = body;

    // Format message for Telegram and Email
    const timestamp = new Date().toISOString();
    const orderMessage = formatOrderMessage({
      orderType,
      amount,
      rate,
      total,
      chain,
      walletAddress,
      bankName,
      bankAccount,
      accountType,
      timestamp,
      userEmail,
    });

    // Send to Telegram
    let telegramSuccess = false;
    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
      try {
        const telegramResponse = await fetch(
          `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chat_id: TELEGRAM_CHAT_ID,
              text: orderMessage,
              parse_mode: 'HTML',
            }),
          }
        );

        if (telegramResponse.ok) {
          telegramSuccess = true;
        } else {
          console.error('Telegram API error:', await telegramResponse.text());
        }
      } catch (error) {
        console.error('Error sending to Telegram:', error);
      }
    }

    // Send Email using Resend (you can also use SendGrid, Nodemailer, etc.)
    let emailSuccess = false;
    try {
      const emailHtml = formatEmailHtml({
        orderType,
        amount,
        rate,
        total,
        chain,
        walletAddress,
        bankName,
        bankAccount,
        accountType,
        timestamp,
        userEmail,
      });

      // If you have Resend configured
      if (process.env.RESEND_API_KEY) {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: 'OTC Orders <orders@convexo.xyz>',
            to: 'william@convexo.xyz',
            subject: `🔄 New OTC Order - ${orderType.toUpperCase()} ${amount} USDC`,
            html: emailHtml,
          }),
        });

        if (emailResponse.ok) {
          emailSuccess = true;
        }
      }
    } catch (error) {
      console.error('Error sending email:', error);
    }

    // Return success if at least one notification method worked
    if (telegramSuccess || emailSuccess) {
      return NextResponse.json({
        success: true,
        message: 'Order submitted successfully',
        notifications: {
          telegram: telegramSuccess,
          email: emailSuccess,
        },
      });
    } else {
      // Even if notifications failed, we can still save the order
      return NextResponse.json({
        success: true,
        message: 'Order received but notifications may have failed',
        notifications: {
          telegram: false,
          email: false,
        },
      });
    }
  } catch (error) {
    console.error('Error processing order:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process order',
      },
      { status: 500 }
    );
  }
}

function formatOrderMessage(data: any): string {
  const {
    orderType,
    amount,
    rate,
    total,
    chain,
    walletAddress,
    bankName,
    bankAccount,
    accountType,
    timestamp,
    userEmail,
  } = data;

  let message = `🔄 <b>NEW OTC ORDER</b>\n\n`;
  message += `<b>Order Type:</b> ${orderType.toUpperCase()}\n`;
  message += `<b>Amount:</b> ${amount} USDC\n`;
  message += `<b>Exchange Rate:</b> ${rate.toFixed(2)} COP/USD\n`;
  message += `<b>Total:</b> ${total.toFixed(2)} COP\n`;
  message += `<b>Chain:</b> ${chain}\n`;
  message += `<b>Time:</b> ${new Date(timestamp).toLocaleString()}\n`;
  
  if (userEmail) {
    message += `<b>User Email:</b> ${userEmail}\n`;
  }
  
  message += `\n`;

  if (orderType === 'buy') {
    message += `💰 <b>PAYMENT DETAILS:</b>\n`;
    message += `<b>Wallet Address:</b> <code>${walletAddress}</code>\n\n`;
    message += `Client will transfer ${total.toFixed(2)} COP to Convexo's bank account.\n`;
    message += `Upon confirmation, ${amount} USDC will be sent to the wallet above.`;
  } else {
    message += `🏦 <b>BANK DETAILS:</b>\n`;
    message += `<b>Bank Name:</b> ${bankName}\n`;
    message += `<b>Account:</b> ${bankAccount}\n`;
    message += `<b>Type:</b> ${accountType}\n`;
    message += `<b>Wallet:</b> <code>${walletAddress}</code>\n\n`;
    message += `Client will send ${amount} USDC from the wallet above.\n`;
    message += `Upon confirmation, ${total.toFixed(2)} COP will be transferred to the bank account.`;
  }

  return message;
}

function formatEmailHtml(data: any): string {
  const {
    orderType,
    amount,
    rate,
    total,
    chain,
    walletAddress,
    bankName,
    bankAccount,
    accountType,
    timestamp,
    userEmail,
  } = data;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
    .info-row { margin: 10px 0; padding: 10px; background: white; border-radius: 4px; }
    .label { font-weight: bold; color: #4b5563; }
    .value { color: #1f2937; }
    .highlight { background: #fef3c7; padding: 2px 6px; border-radius: 3px; }
    .section { margin: 20px 0; padding: 15px; background: white; border-left: 4px solid #3b82f6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">🔄 New OTC Order</h1>
      <p style="margin: 5px 0 0 0; opacity: 0.9;">${new Date(timestamp).toLocaleString()}</p>
    </div>
    <div class="content">
      <div class="info-row">
        <span class="label">Order Type:</span>
        <span class="value highlight">${orderType.toUpperCase()}</span>
      </div>
      <div class="info-row">
        <span class="label">Amount:</span>
        <span class="value">${amount} USDC</span>
      </div>
      <div class="info-row">
        <span class="label">Exchange Rate:</span>
        <span class="value">${rate.toFixed(2)} COP/USD (includes 1.5% spread)</span>
      </div>
      <div class="info-row">
        <span class="label">Total:</span>
        <span class="value"><strong>${total.toFixed(2)} COP</strong></span>
      </div>
      <div class="info-row">
        <span class="label">Chain:</span>
        <span class="value">${chain}</span>
      </div>
      ${userEmail ? `
      <div class="info-row">
        <span class="label">User Email:</span>
        <span class="value">${userEmail}</span>
      </div>
      ` : ''}
      
      ${orderType === 'buy' ? `
      <div class="section">
        <h3 style="margin-top: 0;">💰 Payment Details</h3>
        <p><strong>Wallet Address:</strong><br><code style="background: #e5e7eb; padding: 4px 8px; border-radius: 4px;">${walletAddress}</code></p>
        <p style="margin-top: 15px; padding: 10px; background: #fef3c7; border-radius: 4px;">
          Client will transfer <strong>${total.toFixed(2)} COP</strong> to Convexo's bank account.<br>
          Upon confirmation, <strong>${amount} USDC</strong> will be sent to the wallet address above.
        </p>
      </div>
      ` : `
      <div class="section">
        <h3 style="margin-top: 0;">🏦 Bank Details</h3>
        <p><strong>Bank Name:</strong> ${bankName}</p>
        <p><strong>Account Number:</strong> ${bankAccount}</p>
        <p><strong>Account Type:</strong> ${accountType}</p>
        <p><strong>Wallet Address:</strong><br><code style="background: #e5e7eb; padding: 4px 8px; border-radius: 4px;">${walletAddress}</code></p>
        <p style="margin-top: 15px; padding: 10px; background: #fef3c7; border-radius: 4px;">
          Client will send <strong>${amount} USDC</strong> from the wallet address above.<br>
          Upon confirmation, <strong>${total.toFixed(2)} COP</strong> will be transferred to the bank account above.
        </p>
      </div>
      `}
    </div>
  </div>
</body>
</html>
  `;
}

