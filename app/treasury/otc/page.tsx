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
  const [userEmail, setUserEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

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
      const response = await fetch('/api/exchange-rate/usdcop');
      const data = await response.json();
      
      setUsdcopRate({
        rate: data.rate,
        timestamp: data.timestamp,
      });
    } catch (error) {
      console.error('Error fetching USD/COP rate:', error);
      // Fallback rate if API fails
      setUsdcopRate({
        rate: 4350.50,
        timestamp: Date.now(),
      });
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

    if (!usdcopRate) {
      alert('Exchange rate not available. Please wait and try again.');
      return;
    }

    setIsSubmitting(true);
    setSubmitSuccess(false);
    
    try {
      const finalRate = calculateFinalRate(usdcopRate.rate, orderType);
      const total = calculateTotal();
      const chainName = chainId === 84532 ? 'Base Sepolia' : 
                        chainId === 11155111 ? 'Ethereum Sepolia' : 
                        chainId === 8453 ? 'Base Mainnet' :
                        chainId === 1 ? 'Ethereum Mainnet' :
                        chainId === 1301 ? 'Unichain Sepolia' :
                        chainId === 130 ? 'Unichain Mainnet' : 'Unknown Chain';

      const response = await fetch('/api/otc/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderType,
          amount: parseFloat(amount),
          rate: finalRate,
          total,
          chain: chainName,
          walletAddress,
          bankName: orderType === 'sell' ? bankName : null,
          bankAccount: orderType === 'sell' ? bankAccount : null,
          accountType: orderType === 'sell' ? accountType : null,
          userEmail: userEmail || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitSuccess(true);
        alert(
          `✅ Order submitted successfully!\n\n` +
          `Your order has been sent to:\n` +
          `📧 Email: william@convexo.xyz\n` +
          `💬 Telegram: @zktps\n\n` +
          `Our team will review and confirm your order within 1-2 hours during business hours.`
        );
        
        // Reset form
        setAmount('');
        setBankName('');
        setBankAccount('');
        setUserEmail('');
        
        // Hide success message after 5 seconds
        setTimeout(() => setSubmitSuccess(false), 5000);
      } else {
        throw new Error(data.error || 'Failed to submit order');
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      alert('Failed to submit order. Please try again or contact support directly at william@convexo.xyz');
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
              You need a CONVEXO PASSPORT to access Treasury services.
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
        <div className="bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 rounded-xl shadow-lg p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-3">
                  <h2 className="text-lg font-semibold">Live Exchange Rate</h2>
                  {isLoadingRate && (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  )}
                </div>
                
                {isLoadingRate ? (
                  <div className="space-y-2">
                    <div className="h-12 w-64 bg-white/20 rounded animate-pulse"></div>
                    <div className="h-4 w-48 bg-white/10 rounded animate-pulse"></div>
                  </div>
                ) : usdcopRate ? (
                  <>
                    <div className="space-y-1 mb-4">
                      <div className="flex items-baseline space-x-3">
                        <span className="text-2xl font-medium">1 USD</span>
                        <span className="text-3xl font-bold">=</span>
                        <span className="text-5xl font-bold">
                          {usdcopRate.rate.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-2xl font-medium">COP</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm bg-white/20 rounded-full px-3 py-1 inline-flex">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="opacity-90">
                        Updated: {new Date(usdcopRate.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <p className="text-2xl font-semibold">Rate unavailable</p>
                    <p className="text-sm opacity-80">Please refresh the page</p>
                  </div>
                )}
              </div>
              
              <div className="hidden md:flex items-center justify-center">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6">
                  <ArrowsRightLeftIcon className="h-20 w-20" />
                </div>
              </div>
            </div>
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
              {orderType === 'buy' ? 'USDC Amount to Buy' : 'USDC Amount to Sell'}
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1000"
                min="0"
                step="0.01"
                className="w-full px-4 py-4 pr-16 border-2 border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-2xl font-semibold focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-semibold">
                USDC
              </div>
            </div>
          </div>

          {/* Conversion Display */}
          {amount && usdcopRate && parseFloat(amount) > 0 && (
            <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6 border-2 border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {orderType === 'buy' ? 'You Pay' : 'You Send'}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {orderType === 'buy' ? (
                      <>
                        {calculateTotal().toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xl">COP</span>
                      </>
                    ) : (
                      <>
                        {parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xl">USDC</span>
                      </>
                    )}
                  </p>
                </div>
                
                <div className="px-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <ArrowsRightLeftIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                
                <div className="flex-1 text-right">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {orderType === 'buy' ? 'You Receive' : 'You Receive'}
                  </p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {orderType === 'buy' ? (
                      <>
                        {parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xl">USDC</span>
                      </>
                    ) : (
                      <>
                        {calculateTotal().toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xl">COP</span>
                      </>
                    )}
                  </p>
                </div>
              </div>
              
              {/* Rate Breakdown */}
              <div className="border-t border-blue-200 dark:border-blue-800 pt-4 mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Base Rate:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    1 USD = {usdcopRate.rate.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} COP
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Spread (1.5%):</span>
                  <span className={`font-semibold ${orderType === 'buy' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                    {orderType === 'buy' ? '+' : '-'} {(usdcopRate.rate * 0.015).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} COP
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-blue-100 dark:border-blue-900">
                  <span className="font-semibold text-gray-900 dark:text-white">Your Rate:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    1 USD = {calculateFinalRate(usdcopRate.rate, orderType).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} COP
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Empty State - No Amount Entered */}
          {(!amount || parseFloat(amount) <= 0) && (
            <div className="mb-6 bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                Enter an amount above to see conversion details
              </p>
            </div>
          )}

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
                  required
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
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div className="mb-4">
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

          {/* Email (Optional) */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Your Email (Optional)
            </label>
            <input
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Provide your email to receive updates about your order
            </p>
          </div>

          {/* Success Message */}
          {submitSuccess && (
            <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-green-800 dark:text-green-200 font-semibold">
                ✅ Order submitted successfully!
              </p>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                Sent to william@convexo.xyz and @zktps on Telegram
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmitOrder}
            disabled={isSubmitting || !amount}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Submitting Order...
              </>
            ) : (
              <>
                <PaperAirplaneIcon className="h-5 w-5 mr-2" />
                Submit Order to Convexo Team
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
                  3. Submit your order - it will be sent to <strong>william@convexo.xyz</strong> and <strong>@zktps</strong> on Telegram
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
                * All rates include a 1.5% spread over the live USD/COP exchange rate from ExchangeRate-API
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

