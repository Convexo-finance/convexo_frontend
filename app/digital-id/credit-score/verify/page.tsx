'use client';

import { useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import DashboardLayout from '@/components/DashboardLayout';
import { SparklesIcon, DocumentTextIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { useNFTBalance } from '@/lib/hooks/useNFTBalance';

type CreditScore = {
  score: number;
  rating: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  approved: boolean;
  maxCreditLimit: string;
};

export default function AICreditCheckPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { hasEcreditscoringNFT, ecreditscoringBalance } = useNFTBalance();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [creditScore, setCreditScore] = useState<CreditScore | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setUploadedFiles([...uploadedFiles, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const analyzeCreditworthiness = async () => {
    if (uploadedFiles.length === 0) {
      alert('Please upload at least one financial document');
      return;
    }

    setIsAnalyzing(true);
    try {
      // TODO: Implement actual AI credit scoring API call
      // const formData = new FormData();
      // uploadedFiles.forEach(file => formData.append('documents', file));
      // formData.append('walletAddress', address || '');
      // 
      // const response = await fetch('/api/ai-credit-check', {
      //   method: 'POST',
      //   body: formData,
      // });
      // const result = await response.json();
      // setCreditScore(result);

      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock result
      const mockScore: CreditScore = {
        score: Math.floor(Math.random() * 200) + 650,
        rating: 'Good',
        approved: true,
        maxCreditLimit: '50000',
      };
      
      if (mockScore.score >= 750) mockScore.rating = 'Excellent';
      else if (mockScore.score >= 700) mockScore.rating = 'Good';
      else if (mockScore.score >= 650) mockScore.rating = 'Fair';
      else mockScore.rating = 'Poor';
      
      mockScore.approved = mockScore.score >= 650;
      
      setCreditScore(mockScore);
    } catch (error) {
      console.error('Error analyzing credit:', error);
      alert('Failed to analyze creditworthiness. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const requestNFT = async () => {
    if (!creditScore?.approved) return;

    try {
      // TODO: Call backend to mint Vaults NFT
      alert('NFT minting coming soon. Please contact support.');
    } catch (error) {
      console.error('Error requesting NFT:', error);
      alert('Failed to request NFT. Please try again.');
    }
  };

  if (!isConnected) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Connect Your Wallet
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Please connect your wallet to start credit check
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (hasEcreditscoringNFT) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-green-100 dark:bg-green-900 rounded-full">
                <SparklesIcon className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Already Verified
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You have already completed credit verification and hold {ecreditscoringBalance?.toString() || '0'} Credit Score NFT(s).
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Wallet: {address}
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            AI Credit Check
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Submit your financial information for AI-powered credit scoring
          </p>
        </div>

        {/* Required Documents */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Required Documents
          </h2>
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
              <DocumentTextIcon className="h-5 w-5" />
              <span>Financial statements (last 6-12 months)</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
              <DocumentTextIcon className="h-5 w-5" />
              <span>Bank statements</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
              <DocumentTextIcon className="h-5 w-5" />
              <span>Tax returns (optional but recommended)</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
              <DocumentTextIcon className="h-5 w-5" />
              <span>Business registration documents (if applicable)</span>
            </div>
          </div>
        </div>

        {/* File Upload */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Upload Financial Documents
          </h2>
          
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
            <CloudArrowUpIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              Drag and drop files here, or click to select
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
              Supported formats: PDF, JPG, PNG (Max 10MB per file)
            </p>
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg cursor-pointer"
            >
              Select Files
            </label>
          </div>

          {/* Uploaded Files List */}
          {uploadedFiles.length > 0 && (
            <div className="mt-4 space-y-2">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Uploaded Files ({uploadedFiles.length})
              </h3>
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <DocumentTextIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm text-gray-900 dark:text-white">
                      {file.name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-600 hover:text-red-700 text-sm font-semibold"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={analyzeCreditworthiness}
            disabled={isAnalyzing || uploadedFiles.length === 0}
            className="w-full mt-6 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <span className="flex items-center justify-center">
                <SparklesIcon className="h-5 w-5 mr-2 animate-spin" />
                Analyzing with AI...
              </span>
            ) : (
              'Analyze Creditworthiness'
            )}
          </button>
        </div>

        {/* Credit Score Result */}
        {creditScore && (
          <div className={`rounded-lg shadow-md p-6 ${
            creditScore.approved
              ? 'bg-green-50 dark:bg-green-900/20'
              : 'bg-red-50 dark:bg-red-900/20'
          }`}>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Credit Analysis Complete
              </h2>
              <div className="my-6">
                <div className={`text-6xl font-bold ${
                  creditScore.approved
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {creditScore.score}
                </div>
                <div className="text-xl text-gray-600 dark:text-gray-400 mt-2">
                  {creditScore.rating}
                </div>
              </div>
              
              {creditScore.approved ? (
                <>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Congratulations! You are approved for vault creation with a maximum
                    credit limit of <strong>${creditScore.maxCreditLimit} USDC</strong>.
                  </p>
                  <button
                    onClick={requestNFT}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg"
                  >
                    Request Vaults NFT
                  </button>
                </>
              ) : (
                <p className="text-gray-600 dark:text-gray-400">
                  Unfortunately, your credit score does not meet the minimum requirements
                  at this time. Please improve your financial standing and try again later.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Information */}
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            How It Works
          </h3>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p>
              Our AI-powered credit scoring system analyzes your financial documents using
              advanced machine learning algorithms to assess your creditworthiness.
            </p>
            <p>
              The analysis considers factors such as revenue trends, cash flow stability,
              debt-to-income ratio, and payment history to generate an accurate credit score.
            </p>
            <p>
              All documents are encrypted and processed securely. Your financial information
              is never shared with third parties.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

