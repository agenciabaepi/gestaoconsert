'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { TwoFA, BackupCodes, TwoFAConfig } from '@/lib/twoFA';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Shield, 
  Smartphone, 
  Copy, 
  Check, 
  AlertTriangle, 
  Loader2,
  ArrowLeft,
  Download,
  Eye,
  EyeOff
} from 'lucide-react';

export default function Setup2FAPage() {
  const [step, setStep] = useState(1); // 1: QR Code, 2: Verificação, 3: Códigos de Backup
  const [secret, setSecret] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  const { user, updateTwoFAConfig } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Gerar secret e QR Code
    const newSecret = TwoFA.generateSecret();
    setSecret(newSecret);

    const keyUri = TwoFA.generateKeyUri(user.email, newSecret);
    
    TwoFA.generateQRCode(keyUri).then(qrUrl => {
      setQrCodeUrl(qrUrl);
    }).catch(err => {
      console.error('Erro ao gerar QR Code:', err);
      setError('Erro ao gerar QR Code');
    });

    // Gerar códigos de backup
    const codes = BackupCodes.generate();
    setBackupCodes(codes);
  }, [user, router]);

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Digite um código de 6 dígitos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const isValid = TwoFA.verifyToken(verificationCode, secret);
      
      if (isValid) {
        setStep(3); // Ir para códigos de backup
      } else {
        setError('Código inválido. Verifique o código no seu aplicativo.');
      }
    } catch (err) {
      setError('Erro ao verificar código');
    } finally {
      setLoading(false);
    }
  };

  const handleFinishSetup = async () => {
    const config: TwoFAConfig = {
      enabled: true,
      secret,
      backupCodes,
      setupComplete: true,
    };

    await updateTwoFAConfig(config);
    if (typeof window !== 'undefined') {
      (window as any).__twofa_enabled__ = true;
    }
    router.push('/');
  };

  const copyToClipboard = async (text: string, type: 'secret' | 'codes') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'secret') {
        setCopiedSecret(true);
        setTimeout(() => setCopiedSecret(false), 2000);
      } else {
        setCopiedCodes(true);
        setTimeout(() => setCopiedCodes(false), 2000);
      }
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  const downloadBackupCodes = () => {
    const content = `Códigos de Backup - Admin Panel Gestão Consert
Gerado em: ${new Date().toLocaleString('pt-BR')}
Email: ${user?.email}

IMPORTANTE: Guarde estes códigos em local seguro!
Cada código pode ser usado apenas uma vez.

${backupCodes.map((code, i) => `${i + 1}. ${code}`).join('\n')}

Instruções:
- Use estes códigos se perder acesso ao seu aplicativo de autenticação
- Digite qualquer código no campo de verificação 2FA
- Após usar um código, ele será invalidado automaticamente
- Mantenha estes códigos em local seguro e privado`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-codes-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Configurar 2FA</h1>
          <p className="text-gray-600">Adicione uma camada extra de segurança</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1 pb-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">
                {step === 1 && 'Escaneie o QR Code'}
                {step === 2 && 'Verificar Configuração'}
                {step === 3 && 'Códigos de Backup'}
              </CardTitle>
              <span className="text-sm text-gray-500">Passo {step} de 3</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-4">
                    Use seu aplicativo de autenticação para escanear este QR Code:
                  </p>
                  
                  {qrCodeUrl && (
                    <div className="inline-block p-4 bg-white rounded-lg border">
                      <img src={qrCodeUrl} alt="QR Code 2FA" className="w-48 h-48" />
                    </div>
                  )}

                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-700 mb-2">
                      <strong>Apps compatíveis:</strong>
                    </p>
                    <div className="flex justify-center space-x-4 text-xs text-blue-600">
                      <span>• Duo Mobile</span>
                      <span>• Google Authenticator</span>
                      <span>• Microsoft Authenticator</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700">
                    Ou digite manualmente esta chave:
                  </p>
                  <div className="flex items-center space-x-2">
                    <Input
                      value={secret}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => copyToClipboard(secret, 'secret')}
                    >
                      {copiedSecret ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <Button 
                  onClick={() => setStep(2)} 
                  className="w-full"
                  disabled={!qrCodeUrl}
                >
                  Continuar
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center">
                  <Smartphone className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <p className="text-sm text-gray-600">
                    Digite o código de 6 dígitos do seu aplicativo de autenticação:
                  </p>
                </div>

                <div className="space-y-4">
                  <Input
                    type="text"
                    placeholder="000000"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="text-center text-2xl tracking-widest h-14"
                    maxLength={6}
                    autoComplete="off"
                  />

                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <Button 
                      variant="outline" 
                      onClick={() => setStep(1)}
                      className="flex-1"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Voltar
                    </Button>
                    <Button 
                      onClick={handleVerifyCode}
                      disabled={loading || verificationCode.length !== 6}
                      className="flex-1"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Verificando...
                        </>
                      ) : (
                        'Verificar'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-8 h-8 text-yellow-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Códigos de Backup
                  </h3>
                  <p className="text-sm text-gray-600">
                    Guarde estes códigos em local seguro. Use se perder acesso ao seu aplicativo.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Seus códigos de backup:
                    </span>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowBackupCodes(!showBackupCodes)}
                      >
                        {showBackupCodes ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={downloadBackupCodes}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(backupCodes.join('\n'), 'codes')}
                      >
                        {copiedCodes ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-4 bg-gray-50 rounded-lg font-mono text-sm">
                    {backupCodes.map((code, index) => (
                      <div key={index} className="text-center p-2">
                        {showBackupCodes ? code : '••••••••'}
                      </div>
                    ))}
                  </div>

                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-yellow-800">
                        <p className="font-medium mb-1">Importante:</p>
                        <ul className="space-y-1 text-xs">
                          <li>• Cada código pode ser usado apenas uma vez</li>
                          <li>• Guarde em local seguro (não na nuvem)</li>
                          <li>• Use apenas se perder acesso ao app</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={handleFinishSetup}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    Concluir Configuração
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            2FA adiciona segurança extra • Seus dados estão protegidos
          </p>
        </div>
      </div>
    </div>
  );
}
