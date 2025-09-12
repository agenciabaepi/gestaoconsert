# 🔐 COMO ACESSAR O PAINEL ADMIN

## ✅ Status Confirmado:
- ✅ Usuário existe no Supabase Auth
- ✅ Login funciona (testado)
- ✅ Usuário tem `tipo: 'super_admin'`
- ✅ Painel admin está configurado corretamente

## 🚀 Passo a Passo:

### **1. Fazer Login:**
```
URL: http://localhost:3002/login
Email: admin@consert.com
Senha: 123456
```

### **2. Acessar Painel Admin:**
```
URL: http://localhost:3002/painel-admin
```

## 🔍 Se Ainda Estiver Bloqueado:

### **Verificar no Console do Navegador:**
1. Abra o DevTools (F12)
2. Vá para a aba "Console"
3. Acesse http://localhost:3002/painel-admin
4. Veja os logs de debug que adicionamos

### **Logs Esperados:**
```
🔍 Verificando autenticação...
📋 Session: { user: {...} }
✅ Usuário logado: admin@consert.com
📋 User data: { tipo: 'super_admin', ... }
✅ Super admin encontrado!
```

## 🛠️ Solução de Problemas:

### **Se não estiver logado:**
1. Vá para http://localhost:3002/login
2. Faça login com admin@consert.com / 123456
3. Depois acesse o painel admin

### **Se estiver logado mas bloqueado:**
1. Verifique os logs no console
2. Confirme que o usuário tem `tipo: 'super_admin'`
3. Tente fazer logout e login novamente

## 📋 Dados do Usuário:
```json
{
  "email": "admin@consert.com",
  "tipo": "super_admin",
  "nivel": "admin",
  "empresa_id": null
}
```

---

**🎯 O sistema está funcionando! Siga os passos acima para acessar o painel admin.** 