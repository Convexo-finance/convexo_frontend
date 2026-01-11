// Pinata Configuration for Convexo Protocol NFT Metadata
// Gateway: lime-famous-condor-7.mypinata.cloud

export const PINATA_CONFIG = {
  gateway: process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'lime-famous-condor-7.mypinata.cloud',
  apiUrl: 'https://api.pinata.cloud',
  
  // NFT Image IPFS Hashes
  images: {
    passport: 'bafybeiekwlyujx32cr5u3ixt5esfxhusalt5ljtrmsng74q7k45tilugh4',
    lpIndividuals: 'bafkreib7mkjzpdm3id6st6d5vsxpn7v5h6sxeiswejjmrbcb5yoagaf4em',
    lpBusiness: 'bafkreiejesvgsvohwvv7q5twszrbu5z6dnpke6sg5cdiwgn2rq7dilu33m',
    creditScore: 'bafkreignxas6gqi7it5ng6muoykujxlgxxc4g7rr6sqvwgdfwveqf2zw3e',
  },
} as const;

// Build IPFS URL with custom gateway
export const buildIPFSUrl = (hash: string): string => {
  return `https://${PINATA_CONFIG.gateway}/ipfs/${hash}`;
};

// Build standard IPFS URI
export const buildIPFSUri = (hash: string): string => {
  return `ipfs://${hash}`;
};

// NFT Metadata Types
export interface PassportTraits {
  kycVerified: boolean;
  faceMatchPassed: boolean;
  sanctionsPassed: boolean;
  isOver18: boolean;
}

export interface PassportMetadata {
  name: string;
  description: string;
  image: string;
  external_url: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
}

// Create Passport NFT Metadata JSON
export const createPassportMetadata = (tokenId: number, traits: PassportTraits): PassportMetadata => {
  return {
    name: `Convexo Passport #${tokenId}`,
    description: 'Soulbound NFT representing verified identity for Tier 1 access in the Convexo Protocol. It represents a privacy-compliant verification of identity without storing personal information. This passport enables swap and liquidity provision in gated Uniswap V4 liquidity pools, create OTC and P2P orders and lending options within the vaults created by verified lenders.',
    image: buildIPFSUrl(PINATA_CONFIG.images.passport),
    external_url: 'https://convexo.io',
    attributes: [
      {
        trait_type: 'Tier',
        value: '1',
      },
      {
        trait_type: 'Type',
        value: 'Passport',
      },
      {
        trait_type: 'KYC Verified',
        value: traits.kycVerified ? 'Yes' : 'No',
      },
      {
        trait_type: 'Face Match Passed',
        value: traits.faceMatchPassed ? 'Yes' : 'No',
      },
      {
        trait_type: 'Sanctions Check Passed',
        value: traits.sanctionsPassed ? 'Yes' : 'No',
      },
      {
        trait_type: 'Age Verification',
        value: traits.isOver18 ? '18+' : 'Under 18',
      },
      {
        trait_type: 'Soulbound',
        value: 'True',
      },
      {
        trait_type: 'Network Access',
        value: 'LP Pools',
      },
      {
        trait_type: 'Verification Method',
        value: 'ZKPassport',
      },
    ],
  };
};

// Upload metadata JSON to Pinata via API route
export const uploadMetadataToPinata = async (metadata: PassportMetadata): Promise<string> => {
  try {
    console.log('📤 Uploading metadata to Pinata...', { name: metadata.name });
    
    const response = await fetch('/api/upload-pinata/metadata', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ metadata }),
    });

    const responseData = await response.json();
    
    if (!response.ok) {
      console.error('❌ Pinata upload failed:', responseData);
      const errorMessage = typeof responseData.error === 'object' 
        ? JSON.stringify(responseData.error) 
        : responseData.error;
      throw new Error(errorMessage || `Upload failed with status ${response.status}`);
    }

    console.log('✅ Metadata uploaded successfully:', responseData.ipfsHash);
    return responseData.ipfsHash;
  } catch (error) {
    console.error('Error uploading metadata to Pinata:', error);
    throw error;
  }
};

// Create LP Individual NFT Metadata
export const createLPIndividualMetadata = (tokenId: number, verificationLevel: string = 'Enhanced') => {
  return {
    name: `Convexo LP Individual #${tokenId}`,
    description: 'Soulbound Individual Limited Partner NFT for Personas verified through Veriff KYC verification in the Convexo Protocol. Provides Tier 2 access to Credit Score requests, monetization to trade local stablecoins to FIAT, and compliant protocol features.',
    image: buildIPFSUrl(PINATA_CONFIG.images.lpIndividuals),
    external_url: 'https://convexo.io',
    attributes: [
      { trait_type: 'Tier', value: '2' },
      { trait_type: 'Type', value: 'Individual LP' },
      { trait_type: 'Entity Type', value: 'Individual' },
      { trait_type: 'Verification Level', value: verificationLevel },
      { trait_type: 'Vault Creation', value: 'Enabled' },
      { trait_type: 'Network Access', value: 'Full Protocol' },
      { trait_type: 'Accredited Status', value: 'Verified' },
    ],
  };
};

// Create LP Business NFT Metadata
export const createLPBusinessMetadata = (tokenId: number, verificationLevel: string = 'Enhanced') => {
  return {
    name: `Convexo LP Business #${tokenId}`,
    description: 'Soulbound Business Limited Partner NFT for institutional verified through Sumsub KYB verification in the Convexo Protocol. Provides Tier 2 access to Credit Score requests, monetization to trade local stablecoins to FIAT, and compliant protocol features.',
    image: buildIPFSUrl(PINATA_CONFIG.images.lpBusiness),
    external_url: 'https://convexo.io',
    attributes: [
      { trait_type: 'Tier', value: '2' },
      { trait_type: 'Type', value: 'Business LP' },
      { trait_type: 'Entity Type', value: 'Business' },
      { trait_type: 'Verification Level', value: verificationLevel },
      { trait_type: 'Vault Creation', value: 'Enabled' },
      { trait_type: 'Network Access', value: 'Full Protocol' },
      { trait_type: 'Credit Scoring', value: 'Eligible' },
    ],
  };
};

// Create Credit Score NFT Metadata
export const createCreditScoreMetadata = (
  tokenId: number, 
  creditScore: number, 
  maxLoanAmount: number,
  creditTier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum'
) => {
  return {
    name: `Convexo Credit Score #${tokenId}`,
    description: 'Soulbound AI-powered Credit Score NFT for borrowers in the Convexo Protocol. After a comprehensive creditworthiness assessment, this NFT grants Tier 3 access to Vaults and advanced Borrow and Lending features and institutional-grade protocol participation.',
    image: buildIPFSUrl(PINATA_CONFIG.images.creditScore),
    external_url: 'https://convexo.io',
    attributes: [
      { trait_type: 'Tier', value: '3' },
      { trait_type: 'Type', value: 'Credit Score' },
      { trait_type: 'Credit Score', value: creditScore.toString() },
      { trait_type: 'Max Loan Amount (USDC)', value: maxLoanAmount.toString() },
      { trait_type: 'Credit Tier', value: creditTier },
      { trait_type: 'AI Assessment', value: 'Complete' },
      { trait_type: 'Soulbound', value: 'True' },
      { trait_type: 'Access Level', value: 'Vault Creation' },
      { trait_type: 'Verification Method', value: 'AI Credit Analysis' },
    ],
  };
};
