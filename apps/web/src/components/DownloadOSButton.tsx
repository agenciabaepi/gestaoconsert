// 📁 src/components/DownloadOSButton.tsx
import { PDFDownloadLink } from '@react-pdf/renderer';
import { OSPdfDocument } from './OSPdfDocument';

interface OSData {
  cliente: string;
  data: string;
  [key: string]: any; // Ajuste conforme os campos reais do osData
}

export const DownloadOSButton = ({ osData }: { osData: OSData }) => {
  // Dados padrão para o PDF
  const pdfData = {
    logoUrl: '/assets/imagens/logobranco.png',
    empresa: 'Consert',
    cnpj: '00.000.000/0000-00',
    endereco: 'Endereço da empresa',
    cliente: osData.cliente,
    telefone: 'Telefone do cliente',
    cpf: 'CPF do cliente',
    aparelho: 'Aparelho do cliente',
    cor: 'Cor do aparelho',
    imei: 'IMEI do aparelho',
    serie: 'Série do aparelho',
    relato: 'Relato do cliente',
    servicos: ['Serviço 1', 'Serviço 2'],
    pecas: ['Peça 1', 'Peça 2'],
    total: 'R$ 0,00',
    garantia: '90 dias',
    data: osData.data
  };

  return (
    <PDFDownloadLink
      document={<OSPdfDocument {...pdfData} />}
      fileName={`os_${osData.cliente}_${osData.data}.pdf`}
    >
      {({ loading }) => (loading ? 'Gerando PDF...' : 'Baixar OS em PDF')}
    </PDFDownloadLink>
  );
};