// 📁 src/components/DownloadOSButton.tsx
import { PDFDownloadLink } from '@react-pdf/renderer';
import { OSPdfDocument } from './OSPdfDocument';

interface OSData {
  cliente: string;
  data: string;
  [key: string]: any; // Ajuste conforme os campos reais do osData
}

export const DownloadOSButton = ({ osData }: { osData: OSData }) => (
  <PDFDownloadLink
    document={<OSPdfDocument {...osData} />}
    fileName={`os_${osData.cliente}_${osData.data}.pdf`}
  >
    {({ loading }) => (loading ? 'Gerando PDF...' : 'Baixar OS em PDF')}
  </PDFDownloadLink>
);