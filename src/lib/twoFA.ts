import { authenticator } from 'otplib';
import QRCode from 'qrcode';

// Configurações do 2FA
export const TwoFA = {
  // Gerar um secret único para o usuário
  generateSecret: (): string => {
    return authenticator.generateSecret();
  },

  // Gerar URL para QR Code (compatível com Duo Mobile, Google Authenticator, etc.)
  generateKeyUri: (email: string, secret: string): string => {
    return authenticator.keyuri(
      email, // account name
      'Admin Panel - Gestão Consert', // service name
      secret
    );
  },

  // Gerar QR Code como Data URL
  generateQRCode: async (keyUri: string): Promise<string> => {
    try {
      return await QRCode.toDataURL(keyUri, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        width: 256,
      });
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      throw new Error('Falha ao gerar QR Code');
    }
  },

  // Verificar token TOTP
  verifyToken: (token: string, secret: string): boolean => {
    try {
      // Remove espaços e converte para string
      const cleanToken = token.replace(/\s/g, '');
      
      // Verificar com uma janela de tempo (permite pequenas diferenças de sincronização)
      return authenticator.verify({
        token: cleanToken,
        secret: secret,
        window: 1, // Aceita tokens de 30 segundos antes/depois
      });
    } catch (error) {
      console.error('Erro ao verificar token:', error);
      return false;
    }
  },

  // Gerar token para testes (não usar em produção)
  generateToken: (secret: string): string => {
    return authenticator.generate(secret);
  },
};

// Tipos TypeScript
export interface TwoFASetup {
  secret: string;
  keyUri: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface TwoFAConfig {
  enabled: boolean;
  secret?: string;
  backupCodes?: string[];
  setupComplete: boolean;
}

// Utilitários para backup codes
export const BackupCodes = {
  // Gerar códigos de backup
  generate: (count: number = 8): string[] => {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      // Gerar código de 8 caracteres
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  },

  // Verificar código de backup
  verify: (code: string, backupCodes: string[]): boolean => {
    const cleanCode = code.replace(/\s/g, '').toUpperCase();
    return backupCodes.includes(cleanCode);
  },

  // Remover código usado
  removeUsed: (code: string, backupCodes: string[]): string[] => {
    const cleanCode = code.replace(/\s/g, '').toUpperCase();
    return backupCodes.filter(c => c !== cleanCode);
  },
};

// Gerenciamento de configuração 2FA no localStorage
export const TwoFAStorage = {
  key: 'admin_2fa_config',

  // Salvar configuração
  save: (config: TwoFAConfig): void => {
    localStorage.setItem(TwoFAStorage.key, JSON.stringify(config));
  },

  // Carregar configuração
  load: (): TwoFAConfig | null => {
    try {
      const stored = localStorage.getItem(TwoFAStorage.key);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Erro ao carregar configuração 2FA:', error);
    }
    return null;
  },

  // Remover configuração
  remove: (): void => {
    localStorage.removeItem(TwoFAStorage.key);
  },

  // Verificar se 2FA está habilitado
  isEnabled: (): boolean => {
    const config = TwoFAStorage.load();
    return config?.enabled && config?.setupComplete || false;
  },
};
