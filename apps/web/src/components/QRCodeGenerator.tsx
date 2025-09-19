'use client';

import { useEffect, useRef } from 'react';

interface QRCodeGeneratorProps {
  numeroOS: number;
  size?: number;
  className?: string;
}

export default function QRCodeGenerator({ numeroOS, size = 200, className = '' }: QRCodeGeneratorProps) {
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const generateQRCode = async () => {
      if (!qrRef.current) return;

      try {
        // URL da página de status da OS
        const statusUrl = `${window.location.origin}/os/${numeroOS}/status`;
        
        // Usar API do Google Charts para gerar QR Code
        const qrUrl = `https://chart.googleapis.com/chart?chs=${size}x${size}&cht=qr&chl=${encodeURIComponent(statusUrl)}`;
        
        qrRef.current.innerHTML = `
          <img 
            src="${qrUrl}" 
            alt="QR Code para OS ${numeroOS}"
            width="${size}"
            height="${size}"
            style="border-radius: 8px;"
          />
        `;
      } catch (error) {
        console.error('Erro ao gerar QR Code:', error);
        qrRef.current.innerHTML = `
          <div style="
            width: ${size}px;
            height: ${size}px;
            background: #f3f4f6;
            border: 2px dashed #d1d5db;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #6b7280;
            font-size: 12px;
            text-align: center;
            border-radius: 8px;
          ">
            QR Code<br/>Indisponível
          </div>
        `;
      }
    };

    generateQRCode();
  }, [numeroOS, size]);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div ref={qrRef} className="mb-2"></div>
      <p className="text-xs text-gray-500 text-center max-w-[200px]">
        Escaneie para acompanhar o status da OS #{numeroOS}
      </p>
    </div>
  );
}
