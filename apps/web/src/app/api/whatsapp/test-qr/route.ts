import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';

export async function GET(request: NextRequest) {
  try {
    // Gerar um QR Code de teste
    const testData = 'https://wa.me/5511999999999?text=Teste%20Consert';
    const qrCodeData = await QRCode.toDataURL(testData);
    
    return NextResponse.json({
      success: true,
      qr_code: qrCodeData,
      message: 'QR Code de teste gerado com sucesso'
    });
    
  } catch (error) {
    console.error('❌ WhatsApp: Erro ao gerar QR Code de teste:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar QR Code de teste' },
      { status: 500 }
    );
  }
}
