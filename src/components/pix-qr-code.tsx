'use client';

import * as React from 'react';
import QRCode from 'react-qr-code';
import { cn } from '@/lib/utils';

export interface PixQRCodeProps {
  value: string;
  size?: number;
  className?: string;
  ariaLabel?: string;
}

export function PixQRCode({
  value,
  size = 160,
  className,
  ariaLabel = 'QR Code PIX para pagamento',
}: PixQRCodeProps) {
  if (!value) return null;

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className={cn(
        'bg-white p-3.5 rounded-xl border border-border shadow-xs inline-flex items-center justify-center',
        className
      )}
    >
      <QRCode
        size={size}
        value={value}
        level="M"
        viewBox="0 0 256 256"
        style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
      />
    </div>
  );
}
