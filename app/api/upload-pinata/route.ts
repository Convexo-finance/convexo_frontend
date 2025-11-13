import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const walletAddress = formData.get('walletAddress') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    // Get Pinata credentials from environment variables
    const pinataJWT = process.env.PINATA_JWT;
    const pinataGateway = process.env.PINATA_GATEWAY || 'gateway.pinata.cloud'; // Default to public gateway
    
    if (!pinataJWT) {
      return NextResponse.json(
        { error: 'Pinata JWT not configured' },
        { status: 500 }
      );
    }

    // Create or get group for wallet address (organize by wallet)
    let groupId: string | null = null;
    if (walletAddress) {
      try {
        // Check if group exists for this wallet
        const groupsResponse = await fetch(
          `https://api.pinata.cloud/v3/files/groups?name=${encodeURIComponent(`wallet-${walletAddress.toLowerCase()}`)}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${pinataJWT}`,
            },
          }
        );

        if (groupsResponse.ok) {
          const groupsData = await groupsResponse.json();
          if (groupsData.groups && groupsData.groups.length > 0) {
            groupId = groupsData.groups[0].id;
          } else {
            // Create new group for this wallet
            const createGroupResponse = await fetch(
              'https://api.pinata.cloud/v3/files/groups',
              {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${pinataJWT}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  name: `wallet-${walletAddress.toLowerCase()}`,
                  metadata: {
                    walletAddress: walletAddress.toLowerCase(),
                    createdAt: new Date().toISOString(),
                  },
                }),
              }
            );

            if (createGroupResponse.ok) {
              const groupData = await createGroupResponse.json();
              groupId = groupData.id;
            }
          }
        }
      } catch (groupError) {
        console.warn('Failed to create/get group, continuing without group:', groupError);
        // Continue without group organization
      }
    }

    // Create FormData for Pinata v3 API
    // According to Pinata docs: https://docs.pinata.cloud/api-reference/endpoint/upload-a-file
    const pinataFormData = new FormData();
    pinataFormData.append('file', file);
    pinataFormData.append('name', file.name);
    pinataFormData.append('network', 'public'); // 'public' for public IPFS, 'private' for private IPFS
    
    // Add to group if we have one
    if (groupId) {
      pinataFormData.append('group_id', groupId);
    }

    // Add metadata with wallet address
    if (walletAddress) {
      pinataFormData.append('keyvalues', JSON.stringify({
        walletAddress: walletAddress.toLowerCase(),
        uploadedAt: new Date().toISOString(),
        type: 'contract-document',
      }));
    }

    // Upload to Pinata v3 API
    const pinataResponse = await fetch(
      'https://uploads.pinata.cloud/v3/files',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${pinataJWT}`,
          // Don't set Content-Type header - let browser set it with boundary for FormData
        },
        body: pinataFormData,
      }
    );

    if (!pinataResponse.ok) {
      let errorDetails;
      try {
        errorDetails = await pinataResponse.json();
      } catch {
        errorDetails = { message: await pinataResponse.text() };
      }
      console.error('Pinata error:', errorDetails);
      return NextResponse.json(
        { 
          error: 'Failed to upload to Pinata', 
          details: errorDetails,
          status: pinataResponse.status 
        },
        { status: pinataResponse.status }
      );
    }

    const pinataData = await pinataResponse.json();
    console.log('Pinata upload response (full):', JSON.stringify(pinataData, null, 2));
    
    // Pinata v3 API response structure can vary
    // Try multiple possible locations for the CID
    let ipfsHash: string | null = null;
    
    // Check if response is an array (multiple files)
    if (Array.isArray(pinataData)) {
      // If array, get CID from first item
      if (pinataData.length > 0) {
        ipfsHash = pinataData[0].cid || pinataData[0].IpfsHash || null;
      }
    } else {
      // Direct object response
      ipfsHash = pinataData.cid || 
                 pinataData.IpfsHash || 
                 pinataData.ipfsHash ||
                 pinataData.hash ||
                 (pinataData.data && (pinataData.data.cid || pinataData.data.IpfsHash)) ||
                 null;
    }
    
    // If CID is not in immediate response, try to fetch it by file ID
    if (!ipfsHash && pinataData.id) {
      console.log('CID not in immediate response, attempting to fetch by file ID:', pinataData.id);
      try {
        // Wait a brief moment for Pinata to process
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Fetch the file details by ID
        const fileDetailsResponse = await fetch(
          `https://api.pinata.cloud/v3/files/${pinataData.id}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${pinataJWT}`,
            },
          }
        );
        
        if (fileDetailsResponse.ok) {
          const fileDetails = await fileDetailsResponse.json();
          console.log('File details response:', JSON.stringify(fileDetails, null, 2));
          ipfsHash = fileDetails.cid || fileDetails.IpfsHash || fileDetails.ipfsHash || null;
        }
      } catch (fetchError) {
        console.warn('Failed to fetch file details by ID:', fetchError);
      }
    }
    
    if (!ipfsHash) {
      console.error('Pinata response missing CID. Full response:', JSON.stringify(pinataData, null, 2));
      console.error('Response keys:', Object.keys(pinataData));
      
      // Return a more helpful error with the actual response structure
      return NextResponse.json(
        { 
          error: 'Invalid response from Pinata - missing CID', 
          details: {
            message: 'The upload may have succeeded, but we could not extract the CID from the response.',
            responseStructure: Object.keys(pinataData),
            responseId: pinataData.id,
            suggestion: 'Check Pinata dashboard - the file may have uploaded successfully. You can manually copy the CID from there.',
            fullResponse: pinataData
          }
        },
        { status: 500 }
      );
    }
    
    console.log('Successfully extracted CID:', ipfsHash);
    
    // Construct gateway URL (use dedicated gateway if provided, otherwise use public gateway)
    const gatewayUrl = pinataGateway.includes('.') 
      ? `https://${pinataGateway}/ipfs/${ipfsHash}`
      : `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
    
    // Return IPFS hash with additional metadata
    return NextResponse.json({
      success: true,
      ipfsHash: ipfsHash,
      pinataUrl: gatewayUrl,
      ipfsUri: `ipfs://${ipfsHash}`,
      cid: ipfsHash,
      fileName: file.name,
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
      walletAddress: walletAddress?.toLowerCase() || null,
      groupId: groupId,
      gateway: pinataGateway,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

