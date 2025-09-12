export interface Cliente {
  id: string;
  numero_cliente: string;  // ✅ Sempre string
  nome: string;
  documento: string;
  telefone: string;
  celular?: string;        // ✅ Opcional
  email: string;
  responsavel?: string;    // ✅ Opcional
  tipo: string;
  origem?: string;         // ✅ Opcional
  aniversario?: string;    // ✅ Opcional
  cep?: string;           // ✅ Opcional
  rua?: string;           // ✅ Opcional
  numero?: string;        // ✅ Opcional
  complemento?: string;   // ✅ Opcional
  bairro?: string;        // ✅ Opcional
  cidade?: string;        // ✅ Opcional
  estado?: string;        // ✅ Opcional
  endereco?: string;      // ✅ Opcional (campo legado)
  observacoes?: string;   // ✅ Opcional
  senha?: string;         // ✅ Opcional
  status?: string;        // ✅ Opcional
  created_at?: string;    // ✅ Opcional
  updated_at?: string;    // ✅ Opcional
}