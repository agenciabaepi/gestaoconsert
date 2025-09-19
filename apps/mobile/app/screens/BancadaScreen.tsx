import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { supabase } from '../../src/lib/supabaseClient';
import { useAuth } from '../../src/context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/stack';

// Defina o tipo das rotas
// Se já houver um tipo RootStackParamList, use ele
// Caso contrário, defina:
type RootStackParamList = {
  Drawer: undefined;
  BancadaDetalhe: { id: string };
};

function BancadaScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { session } = useAuth();
  const [ordens, setOrdens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('Todos');

  useEffect(() => {
    const fetchOrdens = async () => {
      const userId = session && 'user' in session && session.user ? session.user.id : undefined;
      if (!userId) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('ordens_servico')
        .select('id, numero_os, cliente:cliente_id(nome), categoria, marca, modelo, cor, created_at, valor_servico, valor_peca, status, status_tecnico')
        .eq('tecnico_id', userId)
        .order('created_at', { ascending: false });
      if (!error && data) {
        setOrdens(data);
      }
      setLoading(false);
    };
    fetchOrdens();
  }, [session]);

  const iniciarOrdem = (id: string) => {
    navigation.navigate('BancadaDetalhe', { id });
  };

  // Filtro e exibição agora usam status_tecnico
  const filtradas = ordens
    .filter((os) => (os.cliente?.nome?.toLowerCase() || '').includes(searchTerm.toLowerCase()))
    .filter((os) => (filtroStatus === 'Todos' ? true : os.status_tecnico === filtroStatus));

  // Estatísticas por status técnico
  const finalizados = ordens.filter(o => o.status_tecnico === 'Concluído').length;
  const pendentes = ordens.filter(o => o.status_tecnico !== 'Concluído').length;
  const statusUnicos = [...new Set(ordens.map(o => o.status_tecnico))].length;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>
        <Ionicons name="hardware-chip-outline" size={24} color="#2563EB" /> Minha Bancada
      </Text>

      <View style={styles.statsContainer}>
        <StatCard cor="#16a34a" titulo="Finalizados no mês" valor={finalizados + ''} />
        <StatCard cor="#ca8a04" titulo="Pendentes no mês" valor={pendentes + ''} />
        <StatCard cor="#2563EB" titulo="Total de OS" valor={ordens.length + ''} />
        <StatCard cor="#6b7280" titulo="Status únicos" valor={statusUnicos + ''} />
      </View>

      <TextInput
        placeholder="Buscar cliente..."
        value={searchTerm}
        onChangeText={setSearchTerm}
        style={styles.input}
        placeholderTextColor="#888"
      />

      <View style={styles.filtros}>
        {['Todos', ...Array.from(new Set(ordens.map(o => o.status_tecnico)))].map((status) => (
          <TouchableOpacity
            key={status}
            onPress={() => setFiltroStatus(status)}
            style={[
              styles.filtroBotao,
              filtroStatus === status && styles.filtroAtivo
            ]}
          >
            <Text style={[
              styles.filtroTexto,
              filtroStatus === status && { color: '#fff' }
            ]}>
              {status}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 32 }} />
      ) : filtradas.length === 0 ? (
        <Text style={{ textAlign: 'center', color: '#888', marginTop: 32 }}>Nenhuma ordem encontrada.</Text>
      ) : (
        filtradas.map((os) => {
          const aparelho = [os.categoria, os.marca, os.modelo, os.cor].filter(Boolean).join(' ');
          const entrada = os.created_at ? new Date(os.created_at).toLocaleDateString('pt-BR') : '';
          const valor = ((os.valor_servico || 0) + (os.valor_peca || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
          return (
            <View key={os.id} style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>
                  #{os.numero_os || os.id} - {os.cliente?.nome || 'Sem nome'}
                </Text>
                <Text style={styles.cardSub}>
                  {aparelho} | Entrada: {entrada}
                </Text>
                <Text style={styles.cardValor}>Valor: {valor}</Text>
                <Text style={styles.cardStatus}>{os.status_tecnico}</Text>
              </View>
              <TouchableOpacity
                onPress={() => iniciarOrdem(os.id)}
                style={styles.botaoIniciar}
              >
                <Ionicons name="play-circle-outline" size={20} color="#fff" />
                <Text style={{ color: '#fff', marginLeft: 8 }}>Iniciar</Text>
              </TouchableOpacity>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

function StatCard({ cor, titulo, valor }: { cor: string; titulo: string; valor: string }) {
  return (
    <View style={[styles.statCard, { borderLeftColor: cor }]}> 
      <Text style={styles.statTitulo}>{titulo}</Text>
      <Text style={[styles.statValor, { color: cor }]}>{valor}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f9fafb', paddingTop: 48 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, color: '#111' },
  statsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16, gap: 8 },
  statCard: { backgroundColor: '#fff', padding: 12, borderRadius: 8, flexGrow: 1, flexBasis: '45%', marginBottom: 12, borderLeftWidth: 4 },
  statTitulo: { fontSize: 12, color: '#6b7280' },
  statValor: { fontSize: 18, fontWeight: 'bold' },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 12, backgroundColor: '#fff' },
  filtros: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  filtroBotao: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14, marginRight: 8, marginBottom: 8 },
  filtroAtivo: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  filtroTexto: { fontSize: 12, color: '#374151' },
  card: { backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2 },
  cardTitle: { fontWeight: '600', marginBottom: 4 },
  cardSub: { fontSize: 12, color: '#6b7280' },
  cardValor: { fontSize: 12, fontWeight: '600', color: '#2563EB', marginTop: 4 },
  cardStatus: { fontSize: 10, backgroundColor: '#fef3c7', color: '#92400e', paddingVertical: 2, paddingHorizontal: 6, borderRadius: 6, marginTop: 4, alignSelf: 'flex-start' },
  botaoIniciar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2563EB', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginTop: 8, marginLeft: 8 },
});

export default BancadaScreen;