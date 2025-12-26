import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Using ExchangeRate-API (free tier: 1,500 requests/month)
    // Alternative: currencyapi.com, exchangeratesapi.io
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    
    if (!response.ok) {
      throw new Error('Failed to fetch exchange rate');
    }

    const data = await response.json();
    const copRate = data.rates.COP;

    if (!copRate) {
      throw new Error('COP rate not found');
    }

    return NextResponse.json({
      rate: copRate,
      timestamp: Date.now(),
      source: 'ExchangeRate-API',
    });
  } catch (error) {
    console.error('Error fetching USD/COP rate:', error);
    
    // Fallback: Return cached/estimated rate if API fails
    return NextResponse.json(
      {
        rate: 4350.50, // Fallback rate
        timestamp: Date.now(),
        source: 'Fallback',
        error: 'Unable to fetch live rate',
      },
      { status: 200 } // Still return 200 with fallback
    );
  }
}

