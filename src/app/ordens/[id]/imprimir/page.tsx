'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import ProtectedArea from '@/components/ProtectedArea';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 11,
    paddingTop: 18,
    paddingHorizontal: 32,
    paddingBottom: 18,
    backgroundColor: '#fff',
    color: '#000',
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    marginBottom: 4,
  },
  logo: {
    height: 64,
    width: 110,
    objectFit: 'contain',
    marginRight: 16,
  },
  companyBlock: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
    textAlign: 'left',
    marginTop: 2,
  },
  companyName: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  companyText: {
    fontSize: 11,
    marginBottom: 1,
  },
  osBlock: {
    minWidth: 120,
    alignItems: 'flex-end',
    textAlign: 'right',
    fontSize: 10,
  },
  osText: {
    fontSize: 10,
    marginBottom: 1,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderBottomStyle: 'solid',
    marginVertical: 6,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 2,
    textAlign: 'left',
  },
  block: {
    marginBottom: 6,
  },
  table: {
    width: '100%',
    marginBottom: 6,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableRowHeader: {
    backgroundColor: '#eee',
  },
  tableCell: {
    borderWidth: 1,
    borderColor: '#bbb',
    borderStyle: 'solid',
    padding: 2,
    fontSize: 10,
    width: '20%',
  },
  tableCellLeftAlign: {
    textAlign: 'left',
  },
  tableCellCenterAlign: {
    textAlign: 'center',
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 18,
  },
  signatureBox: {
    textAlign: 'center',
    flex: 1,
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: '#000',
    borderTopStyle: 'solid',
    width: 140,
    marginHorizontal: 'auto',
    marginBottom: 2,
  },
  signatureText: {
    fontSize: 10,
  },
  qrBox: {
    alignItems: 'flex-end',
    flex: 1,
  },
  paragraph: {
    marginBottom: 4,
    fontSize: 10,
  },
  bold: {
    fontWeight: 'bold',
  },
});

function OrdemPDF({ ordem }: { ordem: any }) {
  function formatDate(dateStr: string | null | undefined) {
    if (!dateStr) return '---';
    const m = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return `${m[3]}/${m[2]}/${m[1]}`;
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR');
  }
  function formatMoney(val: any) {
    if (val == null) return '---';
    return `R$ ${Number(val).toFixed(2)}`;
  }

  function renderTermoClean(htmlContent: string) {
    if (!htmlContent) return null;
    
    // Limpeza simples do HTML
    let cleanContent = htmlContent
      .replace(/<[^>]*>/g, '') // Remove todas as tags HTML
      .replace(/&nbsp;/g, ' ') // Remove espaços HTML
      .trim();
    
    // Encontra todas as seções numeradas
    const sectionMatches = [...cleanContent.matchAll(/(\d+)\s*-\s*([^:]+):/g)];
    const sections: any[] = [];
    
    // Processa cada seção encontrada
    sectionMatches.forEach((match, index) => {
      const sectionNumber = match[1];
      const sectionTitle = match[2];
      const startPos = match.index!;
      
      // Encontra o início da próxima seção ou o fim do texto
      let endPos = cleanContent.length;
      if (index + 1 < sectionMatches.length) {
        endPos = sectionMatches[index + 1].index!;
      }
      
      // Extrai o conteúdo da seção
      const content = cleanContent.substring(startPos + match[0].length, endPos).trim();
      
      sections.push({
        number: parseInt(sectionNumber),
        title: `${sectionNumber} - ${sectionTitle}:`,
        content: content.split('\n').filter(line => line.trim().length > 0),
        key: `section-${index}`
      });
    });
    
    // Ordena por número da seção
    sections.sort((a, b) => a.number - b.number);
    
    // Distribui em 2 colunas
    const leftColumn: any[] = [];
    const rightColumn: any[] = [];
    
    sections.forEach((section, index) => {
      if (index % 2 === 0) {
        leftColumn.push(section);
      } else {
        rightColumn.push(section);
      }
    });
    
    // Debug: verifica se todas as seções foram capturadas
    console.log('Seções encontradas:', sections.length);
    console.log('Números das seções:', sections.map(s => s.number));
    console.log('Coluna esquerda:', leftColumn.length);
    console.log('Coluna direita:', rightColumn.length);
    
    // Renderiza layout em 2 colunas otimizado para uma folha
    return (
      <View style={{ flexDirection: 'row', gap: 16 }}>
        {/* Coluna Esquerda */}
        <View style={{ flex: 1 }}>
          {leftColumn.map((section) => (
            <View key={section.key} style={{ marginBottom: 8 }}>
              <Text style={[styles.paragraph, { fontSize: 8, fontWeight: 'bold', color: '#000', marginBottom: 2 }]}>
                {section.title}
              </Text>
              {section.content.map((contentLine: string, contentIndex: number) => (
                <Text key={`${section.key}-content-${contentIndex}`} style={[styles.paragraph, { fontSize: 7, lineHeight: 1.2, color: '#333', marginBottom: 1 }]}>
                  {contentLine}
                </Text>
              ))}
            </View>
          ))}
        </View>
        
        {/* Coluna Direita */}
        <View style={{ flex: 1 }}>
          {rightColumn.map((section) => (
            <View key={section.key} style={{ marginBottom: 8 }}>
              <Text style={[styles.paragraph, { fontSize: 8, fontWeight: 'bold', color: '#000', marginBottom: 2 }]}>
                {section.title}
              </Text>
              {section.content.map((contentLine: string, contentIndex: number) => (
                <Text key={`${section.key}-content-${contentIndex}`} style={[styles.paragraph, { fontSize: 7, lineHeight: 1.2, color: '#333', marginBottom: 1 }]}>
                  {contentLine}
                </Text>
              ))}
            </View>
          ))}
        </View>
      </View>
    );
  }
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Cabeçalho */}
        <View style={styles.headerRow}>
          <Image src={ordem.empresas?.logo_url || '/logo.png'} style={styles.logo} />
          <View style={styles.companyBlock}>
            <Text style={styles.companyName}>{ordem.empresas?.nome}</Text>
            <Text style={styles.companyText}>CNPJ: {ordem.empresas?.cnpj}</Text>
            <Text style={styles.companyText}>{ordem.empresas?.endereco}</Text>
            <Text style={styles.companyText}>{ordem.empresas?.telefone} - {ordem.empresas?.email}</Text>
          </View>
          <View style={styles.osBlock}>
            <Text style={styles.osText}>Número da OS: {ordem.numero_os || ordem.id}</Text>
            <Text style={styles.osText}>Entrada: {formatDate(ordem.created_at)}</Text>
            <Text style={styles.osText}>Entrega: {formatDate(ordem.data_entrega)}</Text>
            <Text style={styles.osText}>Status: {ordem.status}</Text>
            <Text style={styles.osText}>Venc. Garantia: {formatDate(ordem.vencimento_garantia)}</Text>
          </View>
        </View>
        <View style={styles.divider} />

        {/* Cliente + QR code no topo */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Dados do Cliente</Text>
            <Text style={styles.paragraph}><Text style={styles.bold}>Nome:</Text> {ordem.clientes?.nome}   <Text style={styles.bold}>Telefone:</Text> {ordem.clientes?.telefone}</Text>
            <Text style={styles.paragraph}><Text style={styles.bold}>CPF:</Text> {ordem.clientes?.cpf}   <Text style={styles.bold}>Endereço:</Text> {ordem.clientes?.endereco}</Text>
            <Text style={styles.paragraph}><Text style={styles.bold}>Atendente:</Text> {ordem.atendente}</Text>
          </View>
          <View style={{ alignItems: 'flex-end', minWidth: 60 }}>
            <Image
              src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=https://exemplo.com/ordem/${ordem.id}`}
              style={{ width: 48, height: 48 }}
            />
          </View>
        </View>

        {/* Aparelho */}
        <View style={styles.block}>
          <Text style={styles.sectionTitle}>Aparelho</Text>
          <Text style={styles.paragraph}><Text style={styles.bold}>Equipamento:</Text> {ordem.categoria}   <Text style={styles.bold}>Marca:</Text> {ordem.marca}   <Text style={styles.bold}>Modelo:</Text> {ordem.modelo}</Text>
          <Text style={styles.paragraph}><Text style={styles.bold}>Cor:</Text> {ordem.cor}   <Text style={styles.bold}>Nº Série:</Text> {ordem.numero_serie}</Text>
          <Text style={styles.paragraph}><Text style={styles.bold}>Acessórios:</Text> {ordem.acessorios || '---'}</Text>
          <Text style={styles.paragraph}><Text style={styles.bold}>Condições:</Text> {ordem.condicoes_equipamento || '---'}</Text>
        </View>


        {/* Relato do Cliente */}
        <View style={styles.block}>
          <Text style={styles.sectionTitle}>Relato do Cliente</Text>
          <Text style={styles.paragraph}>{ordem.relato}</Text>
        </View>

        {/* Técnicos / Responsáveis */}
        <View style={styles.block}>
          <Text style={styles.sectionTitle}>Equipe</Text>
          <Text style={styles.paragraph}><Text style={styles.bold}>Técnico:</Text> {ordem.usuarios?.nome || ordem.tecnico}</Text>
        </View>

        {/* Serviços e Peças (por último) */}
        <View style={styles.block}>
          <Text style={styles.sectionTitle}>Serviços e Peças</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableRowHeader]}>
              <Text style={[styles.tableCell, styles.tableCellLeftAlign, { flex: 3 }]}>Item</Text>
              <Text style={[styles.tableCell, styles.tableCellCenterAlign, { flex: 1 }]}>Qtd</Text>
              <Text style={[styles.tableCell, styles.tableCellCenterAlign, { flex: 2 }]}>Valor Unit.</Text>
              <Text style={[styles.tableCell, styles.tableCellCenterAlign, { flex: 2 }]}>Subtotal</Text>
            </View>
            {ordem.servico && (
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.tableCellLeftAlign, { flex: 3 }]}>{ordem.servico}</Text>
                <Text style={[styles.tableCell, styles.tableCellCenterAlign, { flex: 1 }]}>{ordem.qtd_servico}</Text>
                <Text style={[styles.tableCell, styles.tableCellCenterAlign, { flex: 2 }]}>{formatMoney(ordem.valor_servico)}</Text>
                <Text style={[styles.tableCell, styles.tableCellCenterAlign, { flex: 2 }]}>{formatMoney(ordem.qtd_servico * ordem.valor_servico)}</Text>
              </View>
            )}
            {ordem.peca && (
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.tableCellLeftAlign, { flex: 3 }]}>{ordem.peca}</Text>
                <Text style={[styles.tableCell, styles.tableCellCenterAlign, { flex: 1 }]}>{ordem.qtd_peca}</Text>
                <Text style={[styles.tableCell, styles.tableCellCenterAlign, { flex: 2 }]}>{formatMoney(ordem.valor_peca)}</Text>
                <Text style={[styles.tableCell, styles.tableCellCenterAlign, { flex: 2 }]}>{formatMoney(ordem.qtd_peca * ordem.valor_peca)}</Text>
              </View>
            )}
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 8, borderRightWidth: 0, textAlign: 'right', fontWeight: 'bold' }]}>Desconto:</Text>
              <Text style={[styles.tableCell, { flex: 2, textAlign: 'right', fontWeight: 'bold' }]}>{formatMoney(ordem.desconto)}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 8, borderRightWidth: 0, textAlign: 'right', fontWeight: 'bold' }]}>Total:</Text>
              <Text style={[styles.tableCell, { flex: 2, textAlign: 'right', fontWeight: 'bold' }]}> {formatMoney((ordem.qtd_servico * ordem.valor_servico + ordem.qtd_peca * ordem.valor_peca) - (ordem.desconto || 0))}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 8, borderRightWidth: 0, textAlign: 'right', fontWeight: 'bold' }]}>Valor Faturado:</Text>
              <Text style={[styles.tableCell, { flex: 2, textAlign: 'right', fontWeight: 'bold' }]}>{formatMoney(ordem.valor_faturado)}</Text>
            </View>
          </View>
        </View>

        {/* Termo de Garantia */}
        {ordem.termo_garantia && (
          <View style={[styles.block, { padding: 8, backgroundColor: '#fafafa' }]}>
            <Text style={[styles.sectionTitle, { marginBottom: 4, textAlign: 'center', fontSize: 12 }]}>Termo de Garantia</Text>
            <Text style={[styles.paragraph, { marginBottom: 6, fontSize: 8, textAlign: 'center', color: '#666' }]}>{ordem.termo_garantia.nome}</Text>
            
            {/* Layout em 2 colunas otimizado */}
            <View style={{ width: '100%', paddingTop: 2 }}>
              {renderTermoClean(ordem.termo_garantia.conteudo)}
            </View>
          </View>
        )}

        {/* Assinaturas e QR code no rodapé */}
        <View style={styles.signatureRow}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine}></View>
            <Text style={styles.signatureText}>Assinatura do Cliente</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine}></View>
            <Text style={styles.signatureText}>Assinatura da Empresa</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export default function ImprimirOrdemPage() {
  const { id } = useParams();
  const [ordem, setOrdem] = useState<any>(null);
  const [PDFViewer, setPDFViewer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrdem() {
      if (!id) {
        console.error('ID da OS não fornecido');
        setError('ID da OS não fornecido');
        setLoading(false);
        return;
      }

      console.log('Buscando OS com ID:', id);

      const { data, error } = await supabase
        .from('ordens_servico')
        .select('*, clientes(*), usuarios!tecnico_id(*), empresas(*), termo_garantia:termo_garantia_id(*)')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Erro ao buscar OS:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          id: id
        });
        setError(`Erro ao buscar OS: ${error.message}`);
        setLoading(false);
        return;
      }

      console.log('OS encontrada:', data);
      setOrdem(data);
      setLoading(false);
    }

    fetchOrdem();
  }, [id]);

  useEffect(() => {
    import('@react-pdf/renderer').then((mod) => {
      setPDFViewer(() => mod.PDFViewer);
    });
  }, []);

  if (loading) {
    return (
      <div className="loadingText">
        Carregando...
      </div>
    );
  }

  if (error) {
    return (
      <div className="errorText">
        <h2>Erro ao carregar a OS</h2>
        <p>{error}</p>
        <button onClick={() => window.history.back()}>Voltar</button>
      </div>
    );
  }

  if (!PDFViewer || !ordem) {
    return (
      <div className="loadingText">
        Carregando...
      </div>
    );
  }

  return (
    <ProtectedArea area="ordens">
      <PDFViewer style={{ width: '100vw', height: '100vh' }}>
        <OrdemPDF ordem={ordem} />
      </PDFViewer>
    </ProtectedArea>
  );
}