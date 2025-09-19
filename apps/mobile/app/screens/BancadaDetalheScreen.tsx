import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRoute, useNavigation } from '@react-navigation/native';
import { supabase } from '../../src/lib/supabaseClient';
import { Ionicons } from '@expo/vector-icons';

export default function BancadaDetalheScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { id } = route.params as { id: string };

  const [os, setOs] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusTecnico, setStatusTecnico] = useState('');
  const [laudo, setLaudo] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [produtos, setProdutos] = useState('');
  const [servicos, setServicos] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [statusTecnicoOptions, setStatusTecnicoOptions] = useState<{ id: string, nome: string }[]>([]);

  useEffect(() => {
    const fetchOS = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('ordens_servico')
        .select('*')
        .eq('id', id)
        .single();
      if (!error && data) {
        setOs(data);
        setStatusTecnico(data.status_tecnico || '');
        setLaudo(data.laudo || '');
        setObservacoes(data.observacao || '');
        setProdutos(data.peca || '');
        setServicos(data.servico || '');
      }
      setLoading(false);
    };
    if (id) fetchOS();
  }, [id]);

  useEffect(() => {
    async function fetchStatusTecnico() {
      const { data: statusEmpresa } = await supabase
        .from('status')
        .select('id, nome')
        .eq('tipo', 'tecnico');
      const { data: statusFixos } = await supabase
        .from('status_fixo')
        .select('id, nome')
        .eq('tipo', 'tecnico');
      setStatusTecnicoOptions([...(statusFixos || []), ...(statusEmpresa || [])]);
    }
    fetchStatusTecnico();
  }, []);

  const handleSalvar = async () => {
    setSalvando(true);
    const { error } = await supabase
      .from('ordens_servico')
      .update({
        status_tecnico: statusTecnico,
        laudo,
        observacao: observacoes,
        peca: produtos,
        servico: servicos,
      })
      .eq('id', id);
    setSalvando(false);
    if (!error) {
      Alert.alert('Sucesso', 'Dados salvos com sucesso!');
      navigation.goBack();
    } else {
      Alert.alert('Erro', 'Erro ao salvar: ' + error.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}><ActivityIndicator size="large" color="#2563EB" /></View>
    );
  }
  if (!os) {
    return (
      <View style={styles.centered}><Text style={{ color: '#e11d48' }}>Ordem de serviço não encontrada.</Text></View>
    );
  }
  const aparelho = [os.categoria, os.marca, os.modelo, os.cor].filter(Boolean).join(' ');

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.voltar}>
        <Ionicons name="arrow-back" size={20} color="#2563EB" />
        <Text style={{ color: '#2563EB', marginLeft: 6 }}>Voltar</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Ordem #{os.numero_os || os.id}</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Status da OS</Text>
        <Text style={styles.value}>{os.status || '---'}</Text>
        <Text style={styles.label}>Aparelho</Text>
        <Text style={styles.value}>{aparelho || '---'}</Text>
        <Text style={styles.label}>Relato do cliente</Text>
        <Text style={styles.value}>{os.relato || '---'}</Text>
        <Text style={styles.label}>Acessórios</Text>
        <Text style={styles.value}>{os.acessorios || '---'}</Text>
        <Text style={styles.label}>Checklist</Text>
        <Text style={styles.value}>{os.condicoes_equipamento || '---'}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Status Técnico</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={statusTecnico}
            onValueChange={setStatusTecnico}
            style={styles.picker}
          >
            <Picker.Item label="Selecione o status" value="" />
            {statusTecnicoOptions.map(opt => (
              <Picker.Item key={opt.id} label={opt.nome} value={opt.nome} />
            ))}
          </Picker>
        </View>
        <Text style={styles.label}>Produtos utilizados</Text>
        <TextInput
          style={styles.input}
          placeholder="Produtos utilizados"
          value={produtos}
          onChangeText={setProdutos}
        />
        <Text style={styles.label}>Serviços realizados</Text>
        <TextInput
          style={styles.input}
          placeholder="Serviços realizados"
          value={servicos}
          onChangeText={setServicos}
        />
        <Text style={styles.label}>Laudo Técnico</Text>
        <TextInput
          style={[styles.input, { minHeight: 80 }]}
          placeholder="Descreva o diagnóstico técnico..."
          value={laudo}
          onChangeText={setLaudo}
          multiline
        />
        <Text style={styles.label}>Observações técnicas</Text>
        <TextInput
          style={[styles.input, { minHeight: 60 }]}
          placeholder="Observações do técnico..."
          value={observacoes}
          onChangeText={setObservacoes}
          multiline
        />
        <TouchableOpacity
          style={styles.botaoSalvar}
          onPress={handleSalvar}
          disabled={salvando}
        >
          <Ionicons name="save-outline" size={20} color="#fff" />
          <Text style={{ color: '#fff', marginLeft: 8 }}>{salvando ? 'Salvando...' : 'Salvar Alterações'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16, paddingTop: 48 },
  voltar: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#111', marginBottom: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 18, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  label: { fontSize: 13, color: '#6b7280', marginTop: 10, marginBottom: 2, fontWeight: '500' },
  value: { fontSize: 15, color: '#222', marginBottom: 2 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#fff', fontSize: 15, marginBottom: 8 },
  pickerWrapper: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, marginBottom: 8, backgroundColor: '#fff' },
  picker: { height: 44, width: '100%' },
  botaoSalvar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2563EB', paddingVertical: 12, paddingHorizontal: 18, borderRadius: 8, marginTop: 18, alignSelf: 'flex-end' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' },
}); 