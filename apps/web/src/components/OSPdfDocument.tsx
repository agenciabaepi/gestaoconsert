// 📁 src/components/OSPdfDocument.tsx
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

interface OSPdfProps {
  logoUrl: string;
  empresa: string;
  cnpj: string;
  endereco: string;
  cliente: string;
  telefone: string;
  cpf: string;
  aparelho: string;
  cor: string;
  imei: string;
  serie: string;
  relato: string;
  servicos: string[];
  pecas: string[];
  total: string;
  garantia: string;
  data: string;
}

export const OSPdfDocument = ({
  logoUrl,
  empresa,
  cnpj,
  endereco,
  cliente,
  telefone,
  cpf,
  aparelho,
  cor,
  imei,
  serie,
  relato,
  servicos,
  pecas,
  total,
  garantia,
  data
}: OSPdfProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Image src={logoUrl} style={styles.logo} />
        <Text style={styles.title}>{empresa}</Text>
        <Text>{cnpj}</Text>
        <Text>{endereco}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.subtitle}>Cliente:</Text>
        <Text>{cliente} | {telefone} | {cpf}</Text>

        <Text style={styles.subtitle}>Aparelho:</Text>
        <Text>{aparelho} - {cor}</Text>
        <Text>IMEI: {imei} | Série: {serie}</Text>

        <Text style={styles.subtitle}>Relato do Cliente:</Text>
        <Text>{relato}</Text>

        <Text style={styles.subtitle}>Serviços Executados:</Text>
        {servicos.map((s, i) => (
          <Text key={i}>✅ {s}</Text>
        ))}

        <Text style={styles.subtitle}>Peças Utilizadas:</Text>
        {pecas.map((p, i) => (
          <Text key={i}>- {p}</Text>
        ))}

        <Text style={styles.subtitle}>Valor Total:</Text>
        <Text>{total}</Text>

        <Text style={styles.subtitle}>Termo de Garantia:</Text>
        <Text>{garantia}</Text>

        <Text style={styles.subtitle}>Data:</Text>
        <Text>{data}</Text>
      </View>

      <View style={styles.footer}>
        <Text>Assinatura do cliente: ________________________</Text>
      </View>
    </Page>
  </Document>
);

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 12 },
  header: { alignItems: 'center', marginBottom: 20 },
  logo: { width: 100, height: 100, marginBottom: 10 },
  title: { fontSize: 18, fontWeight: 'bold' },
  section: { marginBottom: 10 },
  subtitle: { marginTop: 10, fontWeight: 'bold' },
  footer: { marginTop: 20 }
});