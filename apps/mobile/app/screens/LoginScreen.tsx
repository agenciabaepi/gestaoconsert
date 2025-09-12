import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
const logo = require('../../assets/images/logo/logopreto.png');
import { supabase } from '../../src/lib/supabaseClient';

export default function LoginScreen() {
  const router = useRouter();
  const [loginInput, setLoginInput] = useState(''); // Unificado: e-mail ou usuário
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [recovering, setRecovering] = useState(false);
  // Novos estados para foco dos inputs
  const [loginFocused, setLoginFocused] = useState(false);
  const [senhaFocused, setSenhaFocused] = useState(false);

  // Busca e-mail se for usuário
  const buscarEmailPorUsuario = async (usuario: string) => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('email')
        .eq('usuario', usuario.trim().toLowerCase())
        .single();
      if (error || !data?.email) return null;
      return data.email;
    } catch {
      return null;
    }
  };

  const handleLogin = async () => {
    setErro('');
    setLoading(true);
    let emailToLogin = loginInput;
    try {
      if (!loginInput.includes('@')) {
        // Buscar e-mail pelo usuário
        const emailBuscado = await buscarEmailPorUsuario(loginInput);
        if (!emailBuscado) {
          setErro('Usuário não encontrado.');
          setLoading(false);
          return;
        }
        emailToLogin = emailBuscado;
      }
      const { user, session, error } = await supabase.auth.signIn({
        email: emailToLogin,
        password: senha,
      });
      if (error) {
        setErro('Erro ao fazer login.');
      } else {
        if (session) {
          await AsyncStorage.setItem('session', JSON.stringify(session));
        }
        router.replace('/screens/BancadaScreen');
      }
    } catch (err) {
      setErro('Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    setErro('');
    if (!loginInput) {
      setErro('Informe seu e-mail ou usuário para recuperar a senha.');
      return;
    }
    setRecovering(true);
    let emailToReset = loginInput;
    if (!loginInput.includes('@')) {
      const emailBuscado = await buscarEmailPorUsuario(loginInput);
      if (!emailBuscado) {
        setErro('Usuário não encontrado.');
        setRecovering(false);
        return;
      }
      emailToReset = emailBuscado;
    }
    const { error } = await supabase.auth.api.resetPasswordForEmail(emailToReset);
    setRecovering(false);
    if (error) {
      setErro(error.message);
    } else {
      setErro('E-mail de recuperação enviado!');
    }
  };

  return (
    <LinearGradient colors={["#cffb6d", "#e0ffe3"]} style={styles.container}>
      <View style={styles.card}>
        <Image source={logo} style={styles.logo} resizeMode="contain" />
        <Text style={styles.subtitle}>Acesse sua conta para continuar</Text>
        <TextInput
          placeholder="E-mail ou Usuário"
          value={loginInput}
          onChangeText={setLoginInput}
          style={[styles.input, loginFocused && styles.inputFocused]}
          autoCapitalize="none"
          placeholderTextColor="#888"
          onFocus={() => setLoginFocused(true)}
          onBlur={() => setLoginFocused(false)}
        />
        <TextInput
          placeholder="Senha"
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
          style={[styles.input, senhaFocused && styles.inputFocused]}
          placeholderTextColor="#888"
          onFocus={() => setSenhaFocused(true)}
          onBlur={() => setSenhaFocused(false)}
        />
        {erro ? <Text style={styles.error}>{erro}</Text> : null}
        {loading ? (
          <ActivityIndicator size="large" color="#000" style={{ marginTop: 16 }} />
        ) : (
          <TouchableOpacity style={styles.buttonEntrar} onPress={handleLogin}>
            <Text style={styles.buttonEntrarText}>Entrar</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.buttonRecuperar}
          onPress={handlePasswordReset}
          disabled={recovering}
        >
          <Text style={styles.buttonRecuperarText}>
            {recovering ? 'Enviando...' : 'Esqueci minha senha'}
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 24,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  logo: { width: 200, height: 200, marginBottom: 16 },
  subtitle: { fontSize: 14, color: '#6b7280', marginBottom: 16, textAlign: 'center' },
  input: {
    width: '100%',
    borderColor: '#e5e7eb',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
    color: '#333',
  },
  inputFocused: {
    borderColor: '#3b82f6', // azul igual ao web
    borderWidth: 2,
  },
  buttonEntrar: {
    backgroundColor: '#000',
    paddingVertical: 14,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  buttonEntrarText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  buttonRecuperar: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 14,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  buttonRecuperarText: { color: '#000', fontWeight: '600', fontSize: 16 },
  error: { color: '#f00', marginBottom: 8, textAlign: 'center' },
});