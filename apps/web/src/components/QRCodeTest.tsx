'use client';

import { useState } from 'react';

export default function QRCodeTest() {
  const [numeroOS, setNumeroOS] = useState('1234');
  const [baseUrl, setBaseUrl] = useState('https://gestaoconsert.com.br');

  const qrCodeUrl = `https://chart.googleapis.com/chart?chs=100x100&cht=qr&chl=${encodeURIComponent(`${baseUrl}/os/${numeroOS}/status`)}`;

  return (
    <div className="p-8 bg-white rounded-lg shadow-sm border max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Teste de QR Code</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Número da OS:</label>
          <input
            type="text"
            value={numeroOS}
            onChange={(e) => setNumeroOS(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">URL Base:</label>
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        
        <div className="text-center">
          <div className="mb-2">
            <img 
              src={qrCodeUrl} 
              alt="QR Code"
              className="mx-auto border border-gray-300"
            />
          </div>
          <p className="text-sm text-gray-600 mb-2">QR Code gerado:</p>
          <p className="text-xs text-gray-500 break-all">
            {baseUrl}/os/{numeroOS}/status
          </p>
        </div>
        
        <div className="text-center">
          <a 
            href={`${baseUrl}/os/${numeroOS}/status`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Testar Link
          </a>
        </div>
      </div>
    </div>
  );
}
