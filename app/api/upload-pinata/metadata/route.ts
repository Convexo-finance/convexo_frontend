import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface PassportMetadata {
  name: string;
  description: string;
  image: string;
  external_url: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { metadata } = body as { metadata: PassportMetadata };

    if (!metadata) {
      return NextResponse.json(
        { error: 'No metadata provided' },
        { status: 400 }
      );
    }

    // Validate metadata structure
    if (!metadata.name || !metadata.description || !metadata.image) {
      return NextResponse.json(
        { error: 'Invalid metadata structure: missing required fields' },
        { status: 400 }
      );
    }

    // Get Pinata credentials from environment variables
    // Support both JWT and API Key + Secret authentication
    const pinataJWT = process.env.PINATA_JWT;
    const pinataApiKey = process.env.PINATA_API_KEY;
    const pinataSecretKey = process.env.PINATA_SECRET_KEY;
    
    // Build headers based on available credentials
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (pinataJWT) {
      headers['Authorization'] = `Bearer ${pinataJWT}`;
    } else if (pinataApiKey && pinataSecretKey) {
      headers['pinata_api_key'] = pinataApiKey;
      headers['pinata_secret_api_key'] = pinataSecretKey;
    } else {
      console.error('Missing Pinata credentials. Set either PINATA_JWT or both PINATA_API_KEY and PINATA_SECRET_KEY');
      return NextResponse.json(
        { error: 'Pinata credentials not configured' },
        { status: 500 }
      );
    }

    // Upload JSON metadata to Pinata using pinJSONToIPFS endpoint
    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        pinataContent: metadata,
        pinataMetadata: {
          name: `${metadata.name}_metadata.json`,
          keyvalues: {
            type: 'nft_metadata',
            nftType: 'passport',
            createdAt: new Date().toISOString(),
          },
        },
        pinataOptions: {
          cidVersion: 1,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { rawError: errorText };
      }
      console.error('Pinata upload error:', {
        status: response.status,
        statusText: response.statusText,
        errorData,
      });
      return NextResponse.json(
        { error: `Pinata upload failed: ${errorData.error?.message || errorData.error || errorData.rawError || response.statusText}` },
        { status: response.status }
      );
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      ipfsHash: result.IpfsHash,
      ipfsUrl: `https://${process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'lime-famous-condor-7.mypinata.cloud'}/ipfs/${result.IpfsHash}`,
      timestamp: result.Timestamp,
    });
  } catch (error: any) {
    console.error('Error in upload-pinata/metadata:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}
