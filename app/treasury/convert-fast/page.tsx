'use client';

import { useAccount } from 'wagmi';
import { useState, useEffect } from 'react';
import { useContractRead, useContractWrite, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { CONTRACTS } from '@/lib/contracts/addresses';
import { erc20Abi } from 'viem';
import DashboardLayout from '@/components/DashboardLayout';
import { useNFTBalance } from '@/lib/hooks/useNFTBalance';

// Uniswap V4 Pool Interface (simplified)
// In production, you'd use the actual Uniswap V4 SDK
interface PoolData {
  token0: string;
  token1: string;
  fee: number;
  liquidity: string;
  sqrtPriceX96: string;
}

export default function ConversionPage() {
  const { address, isConnected } = useAccount();
  const { hasPassportNFT } = useNFTBalance();
  const [swapDirection, setSwapDirection] = useState<'ecop-to-usdc' | 'usdc-to-ecop'>('ecop-to-usdc');
  const [inputAmount, setInputAmount] = useState('');
  const [outputAmount, setOutputAmount] = useState('');
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);

  // Fetch pool data (mock for now - replace with actual Uniswap V4 API)
  useEffect(() => {
    // In production, fetch from Uniswap V4 API
    // For now, we'll use a mock rate
    const mockRate = 0.00025; // 1 ECOP = 0.00025 USDC (example rate)
    setExchangeRate(mockRate);
  }, []);

  // Calculate output amount based on rate
  useEffect(() => {
    if (inputAmount && exchangeRate) {
      if (swapDirection === 'ecop-to-usdc') {
        setOutputAmount((parseFloat(inputAmount) * exchangeRate).toFixed(6));
      } else {
        setOutputAmount((parseFloat(inputAmount) / exchangeRate).toFixed(6));
      }
    } else {
      setOutputAmount('');
    }
  }, [inputAmount, exchangeRate, swapDirection]);

  if (!isConnected) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="text-center py-20">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
              Please connect your wallet
            </h2>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!hasPassportNFT) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Identity Verification Required
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You need to hold a Convexo Passport NFT to access Treasury services.
            </p>
            <a
              href="/get-verified/zk-verification"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg"
            >
              Get Verified with ZKPassport
            </a>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            Convert Fast
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Swap between ECOP and USDC using the Uniswap V4 liquidity pool.
            Real-time rates from the ECOP/USDC pool.
          </p>

          <PoolInfo exchangeRate={exchangeRate} />

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg mt-6">
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Swap Direction
              </label>
              <div className="flex gap-4">
                <button
                  onClick={() => setSwapDirection('ecop-to-usdc')}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    swapDirection === 'ecop-to-usdc'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  ECOP → USDC
                </button>
                <button
                  onClick={() => {
                    setSwapDirection('usdc-to-ecop');
                    setInputAmount('');
                    setOutputAmount('');
                  }}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    swapDirection === 'usdc-to-ecop'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  USDC → ECOP
                </button>
              </div>
            </div>

            <SwapForm
              swapDirection={swapDirection}
              inputAmount={inputAmount}
              outputAmount={outputAmount}
              onInputChange={setInputAmount}
              onSwapDirectionChange={setSwapDirection}
              exchangeRate={exchangeRate}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function PoolInfo({ exchangeRate }: { exchangeRate: number | null }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
        Pool Information
      </h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Pool Pair</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            ECOP / USDC
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Exchange Rate
          </p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {exchangeRate
              ? `1 ECOP = ${exchangeRate.toFixed(6)} USDC`
              : 'Loading...'}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Protocol</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            Uniswap V4
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Network</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            Base Sepolia
          </p>
        </div>
      </div>
    </div>
  );
}

function SwapForm({
  swapDirection,
  inputAmount,
  outputAmount,
  onInputChange,
  onSwapDirectionChange,
  exchangeRate,
}: {
  swapDirection: 'ecop-to-usdc' | 'usdc-to-ecop';
  inputAmount: string;
  outputAmount: string;
  onInputChange: (value: string) => void;
  onSwapDirectionChange: (direction: 'ecop-to-usdc' | 'usdc-to-ecop') => void;
  exchangeRate: number | null;
}) {
  const { address } = useAccount();
  const [isSwapping, setIsSwapping] = useState(false);

  // Get balances
  const { data: ecopBalance } = useContractRead({
    address: address ? CONTRACTS[84532].ECOP : undefined,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const { data: usdcBalance } = useContractRead({
    address: address ? CONTRACTS[84532].USDC : undefined,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Check allowances
  const { data: ecopAllowance } = useContractRead({
    address:
      address && swapDirection === 'ecop-to-usdc'
        ? CONTRACTS[84532].ECOP
        : undefined,
    abi: erc20Abi,
    functionName: 'allowance',
    args:
      address && swapDirection === 'ecop-to-usdc'
        ? [address, CONTRACTS[84532].USDC] // Approve to router/pool
        : undefined,
    query: {
      enabled: !!address && swapDirection === 'ecop-to-usdc',
    },
  });

  const { data: usdcAllowance } = useContractRead({
    address:
      address && swapDirection === 'usdc-to-ecop'
        ? CONTRACTS[84532].USDC
        : undefined,
    abi: erc20Abi,
    functionName: 'allowance',
    args:
      address && swapDirection === 'usdc-to-ecop'
        ? [address, CONTRACTS[84532].ECOP] // Approve to router/pool
        : undefined,
    query: {
      enabled: !!address && swapDirection === 'usdc-to-ecop',
    },
  });

  const handleSwap = async () => {
    if (!inputAmount || !exchangeRate || !address) {
      alert('Please enter an amount');
      return;
    }

    // In production, this would call the Uniswap V4 router
    // For now, we'll show a message
    setIsSwapping(true);
    alert(
      'Swap functionality will be integrated with Uniswap V4 router. This requires the pool address and router contract.'
    );
    setIsSwapping(false);
  };

  const needsApproval =
    swapDirection === 'ecop-to-usdc'
      ? ecopAllowance !== undefined &&
        inputAmount &&
        ecopAllowance < parseUnits(inputAmount, 18)
      : usdcAllowance !== undefined &&
        inputAmount &&
        usdcAllowance < parseUnits(inputAmount, 6);

  const handleApprove = () => {
    // In production, approve to Uniswap V4 router
    alert('Approval will be integrated with Uniswap V4 router');
  };

  const inputToken = swapDirection === 'ecop-to-usdc' ? 'ECOP' : 'USDC';
  const outputToken = swapDirection === 'ecop-to-usdc' ? 'USDC' : 'ECOP';
  const inputBalance =
    swapDirection === 'ecop-to-usdc'
      ? ecopBalance
        ? formatUnits(ecopBalance, 18)
        : '0'
      : usdcBalance
      ? formatUnits(usdcBalance, 6)
      : '0';

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
          From ({inputToken})
        </label>
        <div className="relative">
          <input
            type="number"
            value={inputAmount}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder="0.0"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-lg"
          />
          <button
            onClick={() => onInputChange(inputBalance)}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-300"
          >
            MAX
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Balance: {inputBalance} {inputToken}
        </p>
      </div>

      <div className="flex justify-center">
        <button
          onClick={() => {
            onSwapDirectionChange(
              swapDirection === 'ecop-to-usdc' ? 'usdc-to-ecop' : 'ecop-to-usdc'
            );
            onInputChange('');
          }}
          className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          <svg
            className="w-6 h-6 text-gray-600 dark:text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
            />
          </svg>
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
          To ({outputToken})
        </label>
        <input
          type="text"
          value={outputAmount}
          readOnly
          className="w-full px-4 py-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white bg-gray-50 text-lg"
        />
      </div>

      {needsApproval ? (
        <button
          onClick={handleApprove}
          className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 px-4 rounded-lg"
        >
          Approve {inputToken}
        </button>
      ) : (
        <button
          onClick={handleSwap}
          disabled={isSwapping || !inputAmount || !exchangeRate}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSwapping ? 'Swapping...' : 'Swap'}
        </button>
      )}

      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Note:</strong> Full Uniswap V4 integration requires the pool
          address and router contract. This interface is ready for integration
          with the actual Uniswap V4 contracts once deployed.
        </p>
      </div>
    </div>
  );
}

