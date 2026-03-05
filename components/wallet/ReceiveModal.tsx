'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';
import QRCode from 'qrcode';

interface ReceiveModalProps {
  address: string;
  onClose: () => void;
}

export function ReceiveModal({ address, onClose }: ReceiveModalProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    QRCode.toDataURL(address, { width: 280, margin: 2, color: { dark: '#000', light: '#fff' } })
      .then(setQrCodeUrl);
  }, [address]);

  const copyAddress = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl max-w-sm w-full p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Receive</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {qrCodeUrl && (
          <div className="flex justify-center">
            <div className="p-4 bg-white rounded-2xl shadow-lg">
              <img src={qrCodeUrl} alt="Wallet QR" className="w-56 h-56" />
            </div>
          </div>
        )}

        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wide mb-2 block">
            Your Address
          </label>
          <div className="flex gap-2">
            <div className="flex-1 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl">
              <p className="text-white text-xs font-mono break-all">{address}</p>
            </div>
            <button onClick={copyAddress} className="btn-secondary p-2.5">
              {copied ? (
                <CheckIcon className="w-4 h-4 text-emerald-400" />
              ) : (
                <ClipboardDocumentIcon className="w-4 h-4" />
              )}
            </button>
          </div>
          {copied && <p className="text-xs text-emerald-400 mt-1.5">Copied!</p>}
        </div>

        <p className="text-xs text-gray-500 text-center">
          Works on Base and Ethereum Mainnet
        </p>
      </div>
    </div>
  );
}
