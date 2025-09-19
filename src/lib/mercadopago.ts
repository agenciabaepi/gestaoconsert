import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

// Configuração do Mercado Pago
const configureMercadoPago = () => {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const environment = process.env.MERCADOPAGO_ENVIRONMENT || 'sandbox';
  
  if (!accessToken) {
    throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurado');
  }

  const config = new MercadoPagoConfig({
    accessToken: accessToken,
    options: {
      timeout: 15000,
    }
  });

  return { config, Preference, Payment };
};

export { configureMercadoPago }; 