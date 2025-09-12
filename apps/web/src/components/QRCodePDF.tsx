'use client';

import { useEffect, useState } from 'react';

interface QRCodePDFProps {
  numeroOS: number;
  size?: number;
}

export default function QRCodePDF({ numeroOS, size = 80 }: QRCodePDFProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    // URL da página de status da OS
    const statusUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://gestaoconsert.com.br'}/os/${numeroOS}/status`;
    
    // Usar API do Google Charts para gerar QR Code
    const qrUrl = `https://chart.googleapis.com/chart?chs=${size}x${size}&cht=qr&chl=${encodeURIComponent(statusUrl)}`;
    
    setQrCodeUrl(qrUrl);
  }, [numeroOS, size]);

  if (!qrCodeUrl) {
    return null;
  }

  return (
    <div className="flex flex-col items-center">
      <img 
        src={qrCodeUrl} 
        alt={`QR Code para OS ${numeroOS}`}
        width={size}
        height={size}
        className="border border-gray-300 rounded"
      />
      <p className="text-xs text-gray-500 text-center mt-1 max-w-[100px]">
        Escaneie para acompanhar
      </p>
    </div>
  );
}
