'use client';

import { useAuth } from '@/context/AuthContext';

export default function DebugAuth() {
  const auth = useAuth();
  
  return (
    <div style={{
      position: 'fixed',
      top: 10,
      right: 10,
      background: 'red',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <h4>🔍 DEBUG AUTH</h4>
      <div>user: {auth?.user ? 'SIM' : 'NÃO'}</div>
      <div>session: {auth?.session ? 'SIM' : 'NÃO'}</div>
      <div>usuarioData: {auth?.usuarioData ? 'SIM' : 'NÃO'}</div>
      <div>empresaData: {auth?.empresaData ? 'SIM' : 'NÃO'}</div>
      <div>loading: {auth?.loading ? 'SIM' : 'NÃO'}</div>
      <hr />
      <div>usuarioData?.nivel: {auth?.usuarioData?.nivel || 'N/A'}</div>
      <div>isUsuarioTeste(): {auth?.isUsuarioTeste ? auth.isUsuarioTeste() : 'N/A'}</div>
      <div>podeUsarFuncionalidade: {auth?.podeUsarFuncionalidade ? auth.podeUsarFuncionalidade('conversas_whatsapp') : 'N/A'}</div>
    </div>
  );
}


