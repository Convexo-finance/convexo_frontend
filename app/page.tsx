'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSignerStatus, AuthCard } from '@account-kit/react';
import { useAccount } from '@/lib/wagmi/compat';
import Image from 'next/image';

export default function SignInPage() {
  const router = useRouter();
  // useAccount covers both AlchemySigner (email/passkey/OAuth) AND external EOA wallets
  const { isConnected } = useAccount();
  const { isInitializing } = useSignerStatus();

  useEffect(() => {
    if (isConnected) {
      router.push('/profile');
    }
  }, [isConnected, router]);

  return (
    <div className="min-h-screen bg-[#0a0d14] flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Branding */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center overflow-hidden shadow-lg shadow-purple-500/20">
              <Image
                src="/logo_convexo.png"
                alt="Convexo"
                width={80}
                height={80}
                className="object-contain"
                priority
              />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Convexo</h1>
          <p className="text-gray-400 text-sm">
            Reducing the funding gap for SMEs in Latin America
          </p>
        </div>

        {/* Auth card — email · passkey · Google · WalletConnect · More wallets */}
        {!isInitializing && (
          <div className="rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
            <AuthCard />
          </div>
        )}

        {isInitializing && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
          </div>
        )}

        <p className="text-center text-xs text-gray-600 mt-6">
          Protocol v2.1 &nbsp;·&nbsp; Powered by Alchemy Account Kit
        </p>
      </div>
    </div>
  );
}
