import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, amount, ecopAmount, address, email, telegram, bankAccount } = body;

    // Validate required fields
    if (!type || !amount || !address) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!email && !telegram) {
      return NextResponse.json(
        { error: 'Email or Telegram contact is required' },
        { status: 400 }
      );
    }

    // Generate unique request ID
    const requestId = `${type.toUpperCase()}-${Date.now()}-${address.slice(2, 8).toUpperCase()}`;

    const requestData = {
      requestId,
      type, // 'MINT' or 'REDEEM'
      amount,
      ecopAmount,
      address,
      email: email || null,
      telegram: telegram || null,
      bankAccount: bankAccount || null,
      timestamp: new Date().toISOString(),
      status: 'PENDING',
    };

    return NextResponse.json({
      success: true,
      requestId,
      message: 'Request submitted successfully. An agent will contact you shortly.',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

