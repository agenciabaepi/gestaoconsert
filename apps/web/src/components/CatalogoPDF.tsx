'use client';

import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 11,
    paddingTop: 15,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: '#fff',
    color: '#000',
    width: '100%',
  },
  // Header exatamente igual ao das O.S.
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
  catalogBlock: {
    minWidth: 120,
    alignItems: 'flex-end',
    textAlign: 'right',
    fontSize: 10,
  },
  catalogText: {
    fontSize: 10,
    marginBottom: 1,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderBottomStyle: 'solid',
    marginVertical: 6,
  },

  // Layout de tabela inspirado na imagem
  tableContainer: {
    width: '100%',
  },
  twoColumnsLayout: {
    flexDirection: 'row',
    gap: 15,
    width: '100%',
  },
  column: {
    flex: 1,
  },
  categorySection: {
    marginBottom: 15,
    pageBreakInside: 'avoid',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#D1FE6E',
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 5,
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  categoryRow: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: 10,
    marginBottom: 3,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1f2937',
    textTransform: 'uppercase',
  },
  serviceRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
    borderBottomStyle: 'solid',
    alignItems: 'center',
  },
  serviceName: {
    fontSize: 11,
    color: '#374151',
    flex: 1,
    textAlign: 'left',
  },
  servicePrice: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#dc2626',
    textAlign: 'right',
    minWidth: 80,
  },
  // Rodapé
  footer: {
    position: 'absolute',
    bottom: 15,
    left: 20,
    right: 20,
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
  },
  footerText: {
    fontSize: 9,
    color: '#6b7280',
  },
});

interface CatalogoPDFProps {
  empresaData: any;
  itens: any[];
  agrupadosPorCategoria: [string, any[]][];
}

export function CatalogoPDF({ empresaData, itens, agrupadosPorCategoria }: CatalogoPDFProps) {
  function formatCurrency(valor: number | string) {
    const num = typeof valor === 'string' ? parseFloat(valor) : valor;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(num || 0);
  }

  function formatDate() {
    return new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  function formatTime() {
    return new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Cabeçalho igual ao das O.S. */}
        <View style={styles.headerRow}>
          {empresaData?.logo_url ? (
            <Image src={empresaData.logo_url} style={styles.logo} />
          ) : (
            <View style={[styles.logo, { backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={{ fontSize: 8, color: '#6b7280' }}>Logo</Text>
            </View>
          )}
          <View style={styles.companyBlock}>
            <Text style={styles.companyName}>
              {empresaData?.nome}
            </Text>
            <Text style={styles.companyText}>
              CNPJ: {empresaData?.cnpj}
            </Text>
            <Text style={styles.companyText}>
              {empresaData?.endereco}
            </Text>
            <Text style={styles.companyText}>
              {empresaData?.telefone} - {empresaData?.email}
            </Text>
          </View>
          <View style={styles.catalogBlock}>
            <Text style={styles.catalogText}>Catálogo de Serviços</Text>
            <Text style={styles.catalogText}>Gerado em: {formatDate()}</Text>
            <Text style={styles.catalogText}>Horário: {formatTime()}</Text>
            <Text style={styles.catalogText}>Total de Itens: {itens.length}</Text>
            <Text style={styles.catalogText}>Status: Atualizado</Text>
          </View>
        </View>
        <View style={styles.divider} />

        {/* Header da tabela */}
        <View style={styles.tableHeader}>
          <Text style={styles.tableHeaderText}>Tabela de Preços - Serviços</Text>
        </View>

        {/* Conteúdo da tabela em 2 colunas */}
        <View style={styles.twoColumnsLayout}>
          {/* Coluna Esquerda */}
          <View style={styles.column}>
            {agrupadosPorCategoria
              .filter((_, index) => index % 2 === 0)
              .map(([categoria, servicos]) => (
                <View key={categoria} style={styles.categorySection}>
                  {/* Título da categoria */}
                  <View style={styles.categoryRow}>
                    <Text style={styles.categoryName}>{categoria}</Text>
                  </View>
                  
                  {/* Serviços da categoria */}
                  {servicos.map((servico, index) => (
                    <View key={servico.id} style={[
                      styles.serviceRow,
                      { backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa' }
                    ]}>
                      <Text style={styles.serviceName}>{servico.titulo}</Text>
                      <Text style={styles.servicePrice}>
                        {formatCurrency(servico.preco)}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
          </View>

          {/* Coluna Direita */}
          <View style={styles.column}>
            {agrupadosPorCategoria
              .filter((_, index) => index % 2 === 1)
              .map(([categoria, servicos]) => (
                <View key={categoria} style={styles.categorySection}>
                  {/* Título da categoria */}
                  <View style={styles.categoryRow}>
                    <Text style={styles.categoryName}>{categoria}</Text>
                  </View>
                  
                  {/* Serviços da categoria */}
                  {servicos.map((servico, index) => (
                    <View key={servico.id} style={[
                      styles.serviceRow,
                      { backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa' }
                    ]}>
                      <Text style={styles.serviceName}>{servico.titulo}</Text>
                      <Text style={styles.servicePrice}>
                        {formatCurrency(servico.preco)}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
          </View>
        </View>

        {/* Rodapé */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Total: {itens.length} serviços disponíveis • Última atualização: {formatDate()} às {formatTime()}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
