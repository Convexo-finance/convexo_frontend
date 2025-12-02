import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    const pinataJWT = process.env.PINATA_JWT;
    const pinataGateway = process.env.PINATA_GATEWAY || 'lime-famous-condor-7.mypinata.cloud';
    
    if (!pinataJWT) {
      return NextResponse.json(
        { error: 'Pinata JWT not configured' },
        { status: 500 }
      );
    }

    // Get group for this wallet
    const groupsResponse = await fetch(
      `https://api.pinata.cloud/v3/files/groups?name=${encodeURIComponent(`wallet-${walletAddress.toLowerCase()}`)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${pinataJWT}`,
        },
      }
    );

    if (!groupsResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch groups', details: await groupsResponse.text() },
        { status: groupsResponse.status }
      );
    }

    const groupsData = await groupsResponse.json();
    
    if (!groupsData.groups || groupsData.groups.length === 0) {
      return NextResponse.json({
        success: true,
        documents: [],
        groupId: null,
      });
    }

    const groupId = groupsData.groups[0].id;

    // List files in the group
    const filesResponse = await fetch(
      `https://api.pinata.cloud/v3/files?group_id=${groupId}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${pinataJWT}`,
        },
      }
    );

    if (!filesResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch files', details: await filesResponse.text() },
        { status: filesResponse.status }
      );
    }

    const filesData = await filesResponse.json();

    // Construct gateway URL (use dedicated gateway if provided, otherwise use Convexo gateway)
    const gatewayBase = pinataGateway.includes('.') 
      ? `https://${pinataGateway}`
      : 'https://lime-famous-condor-7.mypinata.cloud';
    
    // Format documents for frontend
    const documents = (filesData.files || []).map((file: any) => ({
      id: file.id,
      cid: file.cid,
      name: file.name,
      size: file.size,
      createdAt: file.created_at,
      ipfsHash: file.cid,
      ipfsUri: `ipfs://${file.cid}`,
      pinataUrl: `${gatewayBase}/ipfs/${file.cid}`,
      mimeType: file.mime_type,
    }));

    return NextResponse.json({
      success: true,
      documents,
      groupId,
      walletAddress: walletAddress.toLowerCase(),
    });
  } catch (error) {
    console.error('List documents error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

