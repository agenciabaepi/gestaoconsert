import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { supabase } from '../../src/lib/supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

type PerfilType = {
  id: string;
  nome: string;
  email: string;
  usuario: string;
  whatsapp: string;
  cpf: string;
  telefone: string;
  
  [key: string]: any;
};

export default function PerfilScreen() {
  const [perfil, setPerfil] = useState<PerfilType | null>(null);
  const [form, setForm] = useState({
    nome: '',
    email: '',
    usuario: '',
    whatsapp: '',
    senha: '',
    cpf: '',
    telefone: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchPerfil = async () => {
      setLoading(true);
      try {
        // Recupera sessão do AsyncStorage
        const sessionStr = await AsyncStorage.getItem('session');
        const session = sessionStr ? JSON.parse(sessionStr) : null;
        if (!session?.user) {
          setLoading(false);
          Alert.alert('Erro', 'Usuário não autenticado');
          return;
        }
        const { data, error } = await supabase
          .from('usuarios')
          .select('*')
          .eq('auth_user_id', session.user.id)
          .maybeSingle();
        if (error || !data) {
          Alert.alert('Erro', 'Erro ao carregar dados do perfil');
          setLoading(false);
          return;
        }
        setPerfil({ ...data, id: data.id || session.user.id });
        setForm({
          nome: data.nome || '',
          email: data.email || '',
          usuario: data.usuario || '',
          whatsapp: data.whatsapp || '',
          senha: '',
          cpf: data.cpf || '',
          telefone: data.telefone || '',
        });
      } catch (err) {
        Alert.alert('Erro', 'Erro inesperado ao carregar perfil');
      } finally {
        setLoading(false);
      }
    };
    fetchPerfil();
  }, []);

  const handleChange = (name: keyof typeof form, value: string) => {
    setForm({ ...form, [name]: value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Recupera sessão do AsyncStorage
      const sessionStr = await AsyncStorage.getItem('session');
      const session = sessionStr ? JSON.parse(sessionStr) : null;
      if (!session?.user) {
        Alert.alert('Erro', 'Usuário não autenticado');
        setSaving(false);
        return;
      }
      // Atualiza senha se fornecida
      if (form.senha) {
        // Atualiza senha usando o método correto para supabase-js v2 (React Native)
        const { error: senhaError } = await supabase.auth.update({ password: form.senha });
        if (senhaError) {
          Alert.alert('Erro', 'Erro ao atualizar senha: ' + senhaError.message);
          setSaving(false);
          return;
        }
      }
      const { error } = await supabase
        .from('usuarios')
        .update({
          nome: form.nome,
          email: form.email,
          usuario: form.usuario.trim().toLowerCase(),
          whatsapp: form.whatsapp,
          cpf: form.cpf,
          telefone: form.telefone,
        })
        .eq('auth_user_id', session.user.id);
      if (error) {
        Alert.alert('Erro', 'Erro ao salvar alterações');
        setSaving(false);
        return;
      }
      if (perfil) {
        setPerfil({ ...perfil, ...form, usuario: form.usuario.trim().toLowerCase() });
      }
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
      setIsEditing(false);
    } catch (err) {
      Alert.alert('Erro', 'Erro inesperado ao salvar alterações');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}><ActivityIndicator size="large" color="#000" /></View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Meu Perfil</Text>
          <TouchableOpacity
            style={[styles.editButton, isEditing ? styles.cancelButton : styles.editButton]}
            onPress={() => setIsEditing(!isEditing)}
            disabled={saving}
          >
            <Text style={styles.editButtonText}>{isEditing ? 'Cancelar' : 'Editar'}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.formRow}>
          <Text style={styles.label}>Nome Completo</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.inputDisabled]}
            value={form.nome}
            onChangeText={v => handleChange('nome', v)}
            editable={isEditing}
            placeholder="Nome completo"
          />
        </View>
        <View style={styles.formRow}>
          <Text style={styles.label}>E-mail</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.inputDisabled]}
            value={form.email}
            onChangeText={v => handleChange('email', v)}
            editable={isEditing}
            placeholder="E-mail"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        <View style={styles.formRow}>
          <Text style={styles.label}>Usuário</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.inputDisabled]}
            value={form.usuario}
            onChangeText={v => handleChange('usuario', v)}
            editable={isEditing}
            placeholder="Usuário"
            autoCapitalize="none"
          />
        </View>
        <View style={styles.formRow}>
          <Text style={styles.label}>WhatsApp</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.inputDisabled]}
            value={form.whatsapp}
            onChangeText={v => handleChange('whatsapp', v)}
            editable={isEditing}
            placeholder="WhatsApp"
            keyboardType="phone-pad"
          />
        </View>
        <View style={styles.formRow}>
          <Text style={styles.label}>Nova Senha (opcional)</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.inputDisabled]}
            value={form.senha}
            onChangeText={v => handleChange('senha', v)}
            editable={isEditing}
            placeholder="Nova senha"
            secureTextEntry
          />
        </View>
        <View style={styles.formRow}>
          <Text style={styles.label}>CPF</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.inputDisabled]}
            value={form.cpf}
            onChangeText={v => handleChange('cpf', v)}
            editable={isEditing}
            placeholder="CPF"
            keyboardType="numeric"
          />
        </View>
        <View style={styles.formRow}>
          <Text style={styles.label}>Telefone</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.inputDisabled]}
            value={form.telefone}
            onChangeText={v => handleChange('telefone', v)}
            editable={isEditing}
            placeholder="Telefone"
            keyboardType="phone-pad"
          />
        </View>
        {isEditing && (
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>{saving ? 'Salvando...' : 'Salvar Alterações'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6', padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 400, elevation: 4, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#111' },
  editButton: { backgroundColor: '#000', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  cancelButton: { backgroundColor: '#888' },
  editButtonText: { color: '#fff', fontWeight: '600' },
  formRow: { marginBottom: 12 },
  label: { fontSize: 14, color: '#555', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 10, backgroundColor: '#fff', color: '#222' },
  inputDisabled: { backgroundColor: '#f3f4f6', color: '#aaa' },
  saveButton: { backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 16 },
  saveButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
}); 