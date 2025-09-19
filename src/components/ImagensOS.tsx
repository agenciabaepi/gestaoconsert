'use client';

import { useState } from 'react';
import { FiX, FiZoomIn, FiDownload } from 'react-icons/fi';

interface ImagensOSProps {
  imagens: string;
  ordemId: string;
}

export default function ImagensOS({ imagens, ordemId }: ImagensOSProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');

  if (!imagens || imagens.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <div className="text-gray-400 mb-2">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-gray-500 text-sm">Nenhuma imagem disponível</p>
      </div>
    );
  }

  const imageUrls = imagens ? imagens.split(',').filter((url: string) => url.trim() !== '') : [];

  const openModal = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setModalOpen(true);
  };

  const downloadImage = async (imageUrl: string, index: number): Promise<void> => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `OS-${ordemId}-imagem-${index + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erro ao baixar imagem:', error);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Imagens do Equipamento</h3>
          <span className="text-sm text-gray-500">{imageUrls.length} imagem{imageUrls.length !== 1 ? 'ns' : ''}</span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {imageUrls.map((imageUrl, index) => (
            <div key={index} className="relative group">
              <img
                src={imageUrl}
                alt={`Imagem ${index + 1} da OS ${ordemId}`}
                className="w-full h-32 object-cover rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => openModal(imageUrl)}
              />
              
              {/* Overlay com ações */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openModal(imageUrl)}
                    className="bg-white text-gray-700 rounded-full w-8 h-8 flex items-center justify-center text-sm hover:bg-gray-100 transition-colors"
                    title="Ampliar"
                  >
                    <FiZoomIn size={14} />
                  </button>
                  <button
                    onClick={() => downloadImage(imageUrl, index)}
                    className="bg-white text-gray-700 rounded-full w-8 h-8 flex items-center justify-center text-sm hover:bg-gray-100 transition-colors"
                    title="Baixar"
                  >
                    <FiDownload size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal para visualização ampliada */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={selectedImage}
              alt="Imagem ampliada"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            
            <button
              onClick={() => setModalOpen(false)}
              className="absolute -top-4 -right-4 bg-white text-gray-700 rounded-full w-10 h-10 flex items-center justify-center text-lg hover:bg-gray-100 transition-colors shadow-lg"
            >
              <FiX size={20} />
            </button>
            
            <button
              onClick={() => downloadImage(selectedImage, 0)}
              className="absolute top-4 right-4 bg-white text-gray-700 rounded-lg px-3 py-2 flex items-center gap-2 text-sm hover:bg-gray-100 transition-colors shadow-lg"
            >
              <FiDownload size={16} />
              Baixar
            </button>
          </div>
        </div>
      )}
    </>
  );
} 