'use client';

import { useState, useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import DashboardLayout from '@/components/DashboardLayout';
import { useNFTBalance } from '@/lib/hooks/useNFTBalance';
import { 
  ArrowsRightLeftIcon, 
  BanknotesIcon,
  EnvelopeIcon,
  PaperAirplaneIcon 
} from '@heroicons/react/24/outline';

type OrderType = 'buy' | 'sell';

interface USDCOPRate {
  rate: number;
  timestamp: number;
}

export default function OTCPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { hasPassportNFT } = useNFTBalance();
  const [orderType, setOrderType] = useState<OrderType>('buy');
  const [amount, setAmount] = useState('');
  const [usdcopRate, setUsdcopRate] = useState<USDCOPRate | null>(null);
  const [isLoadingRate, setIsLoadingRate] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [accountType, setAccountType] = useState<'savings' | 'checking'>('savings');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (address) {
      setWalletAddress(address);
    }
  }, [address]);

  useEffect(() => {
    fetchUSDCOPRate();
    // Refresh rate every 5 minutes
    const interval = setInterval(fetchUSDCOPRate, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchUSDCOPRate = async () => {
    setIsLoadingRate(true);
    try {
      // TODO: Implement actual Google API call
      // For now, using a mock rate
      // const response = await fetch('/api/exchange-rate/usdcop');
      // const data = await response.json();
      
      // Mock rate
      const mockRate = 4350.50;
      setUsdcopRate({
        rate: mockRate,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Error fetching USD/COP rate:', error);
    } finally {
      setIsLoadingRate(false);
    }
  };

  const calculateFinalRate = (baseRate: number, type: OrderType) => {
    const spreadPercentage = 1.5;
    if (type === 'buy') {
      // User buys crypto, we add spread
      return baseRate * (1 + spreadPercentage / 100);
    } else {
      // User sells crypto, we subtract spread
      return baseRate * (1 - spreadPercentage / 100);
    }
  };

  const calculateTotal = () => {
    if (!amount || !usdcopRate) return 0;
    const finalRate = calculateFinalRate(usdcopRate.rate, orderType);
    return parseFloat(amount) * finalRate;
  };

  const generateOrderMessage = () => {
    const finalRate = usdcopRate ? calculateFinalRate(usdcopRate.rate, orderType) : 0;
    const total = calculateTotal();
    const chainName = chainId === 84532 ? 'Base Sepolia' : chainId === 11155111 ? 'Ethereum Sepolia' : 'Unichain Sepolia';

    let message = `🔄 NEW OTC ORDER\n\n`;
    message += `Order Type: ${orderType.toUpperCase()}\n`;
    message += `Amount: ${amount} USDC\n`;
    message += `Exchange Rate: 1 USD = ${finalRate.toFixed(2)} COP (includes 1.5% spread)\n`;
    message += `Total: ${total.toFixed(2)} COP\n`;
    message += `Chain: ${chainName}\n`;
    message += `Timestamp: ${new Date().toISOString()}\n\n`;

    if (orderType === 'buy') {
      message += `💰 PAYMENT DETAILS:\n`;
      message += `Wallet Address: ${walletAddress}\n\n`;
      message += `Client will transfer ${total.toFixed(2)} COP to Convexo's bank account.\n`;
      message += `Upon confirmation, ${amount} USDC will be sent to the wallet address above.`;
    } else {
      message += `🏦 BANK DETAILS:\n`;
      message += `Bank Name: ${bankName}\n`;
      message += `Account Number: ${bankAccount}\n`;
      message += `Account Type: ${accountType}\n`;
      message += `Wallet Address: ${walletAddress}\n\n`;
      message += `Client will send ${amount} USDC from the wallet address above.\n`;
      message += `Upon confirmation, ${total.toFixed(2)} COP will be transferred to the bank account above.`;
    }

    return message;
  };

  const handleSubmitOrder = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (orderType === 'sell' && (!bankName || !bankAccount)) {
      alert('Please provide bank account details for selling');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderMessage = generateOrderMessage();
      
      // TODO: Implement actual email/telegram sending
      // const response = await fetch('/api/otc/create-order', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     message: orderMessage,
      //     email: 'otc@convexo.xyz',
      //     telegram: '@zktps',
      //   }),
      // });

      // For now, just show the message
      console.log('Order Message:', orderMessage);
      alert(`Order created successfully!\n\nA confirmation will be sent to otc@convexo.xyz and @zktps on Telegram.\n\nOrder Details:\n${orderMessage}`);
      
      // Reset form
      setAmount('');
      setBankName('');
      setBankAccount('');
    } catch (error) {
      console.error('Error submitting order:', error);
      alert('Failed to submit order. Please try again.');
    } finally {
      setIsSubmitting(false);
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
              Please connect your wallet to access OTC services
            </p>
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
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            OTC Trading
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Buy or sell digital assets with COP at competitive rates
          </p>
        </div>

        {/* Exchange Rate Card */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold mb-2">Current Exchange Rate</h2>
              {isLoadingRate ? (
                <p className="text-3xl font-bold">Loading...</p>
              ) : usdcopRate ? (
                <>
                  <p className="text-4xl font-bold">
                    1 USD = {usdcopRate.rate.toFixed(2)} COP
                  </p>
                  <p className="text-sm mt-2 opacity-90">
                    Last updated: {new Date(usdcopRate.timestamp).toLocaleTimeString()}
                  </p>
                  <p className="text-sm opacity-75">
                    * 1.5% spread applied to orders
                  </p>
                </>
              ) : (
                <p className="text-xl">Rate unavailable</p>
              )}
            </div>
            <ArrowsRightLeftIcon className="h-16 w-16 opacity-50" />
          </div>
        </div>

        {/* Order Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Create Order
          </h2>

          {/* Order Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Order Type
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setOrderType('buy')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  orderType === 'buy'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <BanknotesIcon className="h-8 w-8 mx-auto mb-2 text-green-600 dark:text-green-400" />
                <p className="font-semibold text-gray-900 dark:text-white">Buy USDC</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Pay with COP</p>
              </button>
              <button
                onClick={() => setOrderType('sell')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  orderType === 'sell'
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <BanknotesIcon className="h-8 w-8 mx-auto mb-2 text-red-600 dark:text-red-400" />
                <p className="font-semibold text-gray-900 dark:text-white">Sell USDC</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Receive COP</p>
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Amount (USDC)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1000"
              min="0"
              step="0.01"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-lg"
            />
            {amount && usdcopRate && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                ≈ {calculateTotal().toFixed(2)} COP
                <span className="ml-2 text-xs">
                  (Rate: {calculateFinalRate(usdcopRate.rate, orderType).toFixed(2)} COP/USD with 1.5% spread)
                </span>
              </p>
            )}
          </div>

          {/* Wallet Address (for buying) */}
          {orderType === 'buy' && (
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Receiving Wallet Address
              </label>
              <input
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          )}

          {/* Bank Details (for selling) */}
          {orderType === 'sell' && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Bancolombia"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Bank Account Number
                </label>
                <input
                  type="text"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  placeholder="1234567890"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Account Type
                </label>
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value as 'savings' | 'checking')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="savings">Savings</option>
                  <option value="checking">Checking</option>
                </select>
              </div>
            </>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmitOrder}
            disabled={isSubmitting || !amount}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isSubmitting ? (
              'Submitting...'
            ) : (
              <>
                <PaperAirplaneIcon className="h-5 w-5 mr-2" />
                Submit Order
              </>
            )}
          </button>
        </div>

        {/* Information */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <EnvelopeIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                How It Works
              </h3>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <p>
                  1. Select whether you want to buy or sell USDC
                </p>
                <p>
                  2. Enter the amount and provide required information
                </p>
                <p>
                  3. Submit your order - it will be sent to <strong>otc@convexo.xyz</strong> and <strong>@zktps</strong> on Telegram
                </p>
                <p>
                  4. Our team will review and confirm your order within 1-2 hours during business hours
                </p>
                <p>
                  5. Complete the payment/transfer as instructed
                </p>
                <p>
                  6. Receive your funds once the transaction is confirmed
                </p>
              </div>
              <p className="mt-4 text-xs text-gray-500 dark:text-gray-500">
                * All rates include a 1.5% spread over the Google API USD/COP rate
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

