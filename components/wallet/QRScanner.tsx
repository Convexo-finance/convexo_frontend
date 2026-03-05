'use client';

import { useEffect, useRef, useState } from 'react';

interface QRScannerProps {
  onScan: (value: string) => void;
  onClose: () => void;
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [scanErr, setScanErr] = useState<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;

        if ('BarcodeDetector' in window) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
          timer = setInterval(async () => {
            if (!videoRef.current) return;
            try {
              const results = await detector.detect(videoRef.current);
              if (results.length > 0) {
                clearInterval(timer);
                onScan(results[0].rawValue as string);
              }
            } catch {
              // ignore frame errors
            }
          }, 300);
        } else {
          setScanErr('QR scanning is not supported in this browser. Please paste the address.');
        }
      } catch {
        setScanErr('Camera access denied. Please paste the address manually.');
      }
    };

    start();
    return () => {
      clearInterval(timer);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [onScan]);

  return (
    <div className="space-y-3">
      {scanErr ? (
        <div className="p-3 bg-red-900/20 border border-red-700/50 rounded-xl text-sm text-red-400">
          {scanErr}
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden bg-black aspect-square max-w-[260px] mx-auto">
          <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
          {/* Scan frame overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-44 h-44 border-2 border-purple-400 rounded-xl" />
          </div>
          <p className="absolute bottom-2 left-0 right-0 text-center text-xs text-white/70">
            Point at QR code
          </p>
        </div>
      )}
      <button onClick={onClose} className="w-full text-sm text-gray-400 hover:text-white transition-colors">
        Cancel
      </button>
    </div>
  );
}
