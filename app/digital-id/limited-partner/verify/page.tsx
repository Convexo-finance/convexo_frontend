'use client';

import { useState, useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import DashboardLayout from '@/components/DashboardLayout';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import { useNFTBalance } from '@/lib/hooks/useNFTBalance';

// Sumsub SDK types
declare global {
  interface Window {
    SumsubWebSdk?: any;
  }
}

export default function AMLCFTPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { hasLPsNFT, lpsBalance } = useNFTBalance();
  const [isLoading, setIsLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'completed' | 'failed' | null>(null);
  const [sumsubToken, setSumsubToken] = useState<string | null>(null);

  useEffect(() => {
    // Load Sumsub SDK
    const script = document.createElement('script');
    script.src = 'https://static.sumsub.com/idensic/static/sns-websdk-builder.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const startVerification = async () => {
    if (!address) return;

    setIsLoading(true);
    try {
      // TODO: Call your backend API to get Sumsub access token
      // const response = await fetch('/api/sumsub/get-token', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ walletAddress: address }),
      // });
      // const { token } = await response.json();
      // setSumsubToken(token);

      // For now, show a placeholder
      alert('Sumsub integration coming soon. Please contact support for manual verification.');
      
      // Initialize Sumsub SDK when token is available
      // if (window.SumsubWebSdk && token) {
      //   const snsWebSdkInstance = window.SumsubWebSdk
      //     .init(token, () => sumsubToken)
      //     .withConf({
      //       lang: 'en',
      //       theme: 'dark',
      //     })
      //     .on('idCheck.onStepCompleted', (payload: any) => {
      //       console.log('Step completed:', payload);
      //     })
      //     .on('idCheck.onApplicantSubmitted', (payload: any) => {
      //       console.log('Verification submitted:', payload);
      //       setVerificationStatus('pending');
      //     })
      //     .on('idCheck.onApplicantReviewed', (payload: any) => {
      //       console.log('Verification reviewed:', payload);
      //       if (payload.reviewResult.reviewAnswer === 'GREEN') {
      //         setVerificationStatus('completed');
      //         // TODO: Call backend to mint LPs NFT
      //       } else {
      //         setVerificationStatus('failed');
      //       }
      //     })
      //     .build();
      //   
      //   snsWebSdkInstance.launch('#sumsub-websdk-container');
      // }
    } catch (error) {
      console.error('Error starting verification:', error);
      alert('Failed to start verification. Please try again.');
    } finally {
      setIsLoading(false);
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
              Please connect your wallet to start verification
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (hasLPsNFT) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-green-100 dark:bg-green-900 rounded-full">
                <ShieldCheckIcon className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Already Verified
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You have already completed AML/CFT verification and hold {lpsBalance?.toString() || '0'} LPs NFT(s).
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
            AML/CFT Verification
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Complete identity verification to receive your LPs NFT
          </p>
        </div>

        {/* Verification Steps */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Verification Process
          </h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 font-semibold">1</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Identity Document</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Upload a valid government-issued ID (passport, driver's license, or national ID)
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 font-semibold">2</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Liveness Check</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Complete a quick selfie verification to confirm your identity
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 font-semibold">3</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Address Verification</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Provide proof of address (utility bill, bank statement, etc.)
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 font-semibold">4</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Receive NFT</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Upon approval, your LPs NFT will be minted to your wallet
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sumsub Container */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div id="sumsub-websdk-container" className="min-h-[400px]">
            {!sumsubToken && (
              <div className="text-center py-12">
                <div className="flex justify-center mb-4">
                  <ShieldCheckIcon className="h-16 w-16 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Ready to Start Verification?
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  The verification process typically takes 5-10 minutes
                </p>
                <button
                  onClick={startVerification}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Loading...' : 'Start Verification'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Status Messages */}
        {verificationStatus === 'pending' && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
            <p className="text-yellow-800 dark:text-yellow-200">
              Your verification is being reviewed. This typically takes 1-2 business days.
            </p>
          </div>
        )}
        {verificationStatus === 'completed' && (
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <p className="text-green-800 dark:text-green-200">
              Verification completed! Your LPs NFT is being minted to your wallet.
            </p>
          </div>
        )}
        {verificationStatus === 'failed' && (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200">
              Verification failed. Please contact support for assistance.
            </p>
          </div>
        )}

        {/* Information */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Privacy & Security
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Your personal information is encrypted and securely stored. We use Sumsub, a
            leading identity verification provider trusted by thousands of companies worldwide.
            Your data is only used for compliance purposes and will never be shared without
            your consent.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}

