
'use client';
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

import { supabase } from '@/lib/supabaseClient';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Tab } from '@headlessui/react';
import { Input } from '@/components/Input';
import { Label } from '@/components/label';
import { Textarea } from '@/components/textarea';
import MenuLayout from '@/components/MenuLayout';
import { Button } from '@/components/Button';
import { Select } from '@/components/Select';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';
import { useAuth } from '@/context/AuthContext';
import { SubscriptionGuard } from '@/components/SubscriptionGuard';

export default function NovoProdutoPage() {
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  
  // Estados para categorias
  const [grupos, setGrupos] = useState<Array<{id: string, nome: string}>>([]);
  const [categorias, setCategorias] = useState<Array<{id: string, nome: string, grupo_id: string}>>([]);
  const [subcategorias, setSubcategorias] = useState<Array<{id: string, nome: string, categoria_id: string}>>([]);
  const [loadingCategorias, setLoadingCategorias] = useState(false);
  
  // Estados para fornecedores
  const [fornecedores, setFornecedores] = useState<Array<{id: string, nome: string}>>([]);
  const [loadingFornecedores, setLoadingFornecedores] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'produto',
    codigo: '',
    grupo: '',
    categoria: '',
    subcategoria: '',
    custo: '',
    preco: '',
    unidade: '',
    fornecedor_id: '',
    marca: '',
    estoque_min: '',
    estoque_max: '',
    estoque_atual: '',
    situacao: 'Ativo',
    ncm: '',
    cfop: '',
    cst: '',
    cest: '',
    largura_cm: '',
    altura_cm: '',
    profundidade_cm: '',
    peso_g: '',
    obs: '',
    ativo: 'true',
    codigo_barras: '',
  });

  const searchParams = useSearchParams();
  const router = useRouter();
  const produtoId = searchParams.get('produtoId');
  // Usar o cliente importado
  const { addToast } = useToast();
  const confirm = useConfirm();
  const { user } = useAuth();

  // Função para carregar categorias
  const carregarCategorias = async () => {
    setLoadingCategorias(true);
    try {
      // Carregar grupos
      const { data: gruposData } = await supabase
        .from('grupos_produtos')
        .select('id, nome')
        .order('nome');

      // Carregar categorias
      const { data: categoriasData } = await supabase
        .from('categorias_produtos')
        .select('id, nome, grupo_id')
        .order('nome');

      // Carregar subcategorias
      const { data: subcategoriasData } = await supabase
        .from('subcategorias_produtos')
        .select('id, nome, categoria_id')
        .order('nome');

      setGrupos(gruposData || []);
      setCategorias(categoriasData || []);
      setSubcategorias(subcategoriasData || []);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      addToast('error', 'Erro ao carregar categorias');
    } finally {
      setLoadingCategorias(false);
    }
  };

  // Função para carregar fornecedores
  const carregarFornecedores = async () => {
    setLoadingFornecedores(true);
    try {
      if (!user?.id) {
        addToast('error', 'Usuário não autenticado');
        return;
      }

      const { data: usuarioData, error: userError } = await supabase
        .from('usuarios')
        .select('empresa_id')
        .eq('auth_user_id', user.id)
        .single();

      if (userError) {
        console.error('Erro ao buscar usuário:', userError);
        addToast('error', 'Erro ao buscar dados do usuário');
        return;
      }

      if (!usuarioData?.empresa_id) {
        addToast('error', 'Empresa não encontrada. Verifique se você está associado a uma empresa.');
        return;
      }

      const { data: fornecedoresData } = await supabase
        .from('fornecedores')
        .select('id, nome')
        .eq('empresa_id', usuarioData.empresa_id)
        .eq('ativo', true)
        .order('nome');

      setFornecedores(fornecedoresData || []);
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
      addToast('error', 'Erro ao carregar fornecedores');
    } finally {
      setLoadingFornecedores(false);
    }
  };

  // Funções para filtrar categorias baseado na seleção
  const categoriasDoGrupo = categorias.filter(cat => cat.grupo_id === formData.grupo);
  const subcategoriasDaCategoria = subcategorias.filter(sub => sub.categoria_id === formData.categoria);

  // Função para limpar categoria quando grupo muda
  const handleGrupoChange = (grupoId: string) => {
    setFormData(prev => ({
      ...prev,
      grupo: grupoId,
      categoria: '', // Limpar categoria quando grupo muda
      subcategoria: '' // Limpar subcategoria quando grupo muda
    }));
  };

  // Função para limpar subcategoria quando categoria muda
  const handleCategoriaChange = (categoriaId: string) => {
    setFormData(prev => ({
      ...prev,
      categoria: categoriaId,
      subcategoria: '' // Limpar subcategoria quando categoria muda
    }));
  };

  // Carregar categorias ao montar o componente
  useEffect(() => {
    carregarCategorias();
  }, []);

  // Carregar fornecedores quando o usuário estiver disponível
  useEffect(() => {
    if (user) {
      carregarFornecedores();
    }
  }, [user]);

  useEffect(() => {
    if (produtoId) {
      supabase
        .from('produtos_servicos')
        .select('*')
        .eq('id', produtoId)
        .single()
        .then(({ data, error }) => {
          if (data && !error) {
            setFormData({
              nome: data.nome || '',
              tipo: data.tipo || '',
              codigo: data.codigo || '',
              grupo: data.grupo_id || '',
              categoria: data.categoria_id || '',
              subcategoria: data.subcategoria_id || '',
              custo: data.custo?.toString() || '',
              preco: data.preco?.toString() || '',
              unidade: data.unidade || '',
              fornecedor_id: data.fornecedor_id || '',
              marca: data.marca || '',
              estoque_min: data.estoque_min?.toString() || '',
              estoque_max: data.estoque_max?.toString() || '',
              estoque_atual: data.estoque_atual?.toString() || '',
              situacao: data.situacao || '',
              ncm: data.ncm || '',
              cfop: data.cfop || '',
              cst: data.cst || '',
              cest: data.cest || '',
              largura_cm: data.largura_cm?.toString() || '',
              altura_cm: data.altura_cm?.toString() || '',
              profundidade_cm: data.profundidade_cm?.toString() || '',
              peso_g: data.peso_g?.toString() || '',
              obs: data.obs || '',
              ativo: data.ativo ? 'true' : 'false',
              codigo_barras: data.codigo_barras || '',
            });
            setExistingImageUrls(data.imagens_url || []);
          }
        });
    }
  }, [produtoId]);

  const handleSubmit = async () => {
    // Gerar código sequencial por empresa, somente se não estiver editando (novo produto)
    const empresa_id = localStorage.getItem('empresa_id');
    if (!empresa_id) {
      addToast('error', 'Erro: empresa_id não encontrado. Faça login novamente.');
      return;
    }

    if (!produtoId) {
      let proximoCodigo = 1;
      try {
        const res = await fetch(`/api/produtos?empresa_id=${empresa_id}`);
        if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
          const json = await res.json();
          const ultimo = Number(json?.ultimoCodigo) || 0;
          proximoCodigo = ultimo + 1;
        } else {
          const text = await res.text();
          console.error('Erro GET /api/produtos:', res.status, text);
        }
      } catch (err) {
        console.error('Erro ao buscar último código:', err);
      }
      formData.codigo = proximoCodigo.toString();
    }

    // Checagem dos campos obrigatórios: apenas Nome e Preço de Venda
    if (!formData.nome || !formData.preco) {
      addToast('error', 'Por favor, preencha os campos obrigatórios: Nome e Preço de Venda.');
      return;
    }

    // Coleta das imagens selecionadas como arquivos
    const arquivos = selectedImages ? Array.from(selectedImages) : [];
    const uploadedImageUrls: string[] = [];

    // Envio de cada arquivo direto ao Supabase Storage
    for (const file of arquivos) {
      // Gera nome de arquivo seguro, substituindo caracteres inválidos
      const timestamp = Date.now();
      const rawName = file.name;
      const safeName = rawName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const filePath = `produtos/${empresa_id}/${timestamp}_${safeName}`;
      // Apaga logo anterior, se quiser comportamento similar ao logo
      // await handleDeleteLogo? (não aplicável aqui)
      const { error: uploadError } = await supabase
        .storage
        .from('produtos')
        .upload(filePath, file, { upsert: false });
      if (uploadError) {
        console.error('Erro ao fazer upload da imagem:', uploadError);
        addToast('error', `Erro ao fazer upload da imagem ${file.name}: ${uploadError.message}`);
        continue;
      }
      const { data: urlData } = supabase
        .storage
        .from('produtos')
        .getPublicUrl(filePath);
      uploadedImageUrls.push(urlData.publicUrl);
    }
    // Log dos dados enviados
    console.log('Dados enviados:', formData);

    // empresa_id já obtido acima

    const data = {
      nome: formData.nome,
      tipo: formData.tipo,
      codigo: formData.codigo,
              grupo_id: formData.grupo,
        categoria_id: formData.categoria,
        subcategoria_id: formData.subcategoria,
        fornecedor_id: formData.fornecedor_id || null,
      custo: parseFloat(formData.custo || '0'),
      preco: parseFloat(formData.preco || '0'),
      unidade: formData.unidade,
      marca: formData.marca,
      estoque_min: parseFloat(formData.estoque_min || '0'),
      estoque_max: parseFloat(formData.estoque_max || '0'),
      estoque_atual: parseFloat(formData.estoque_atual || '0'),
      situacao: formData.situacao,
      ncm: formData.ncm,
      cfop: formData.cfop,
      cst: formData.cst,
      cest: formData.cest,
      largura_cm: parseFloat(formData.largura_cm || '0'),
      altura_cm: parseFloat(formData.altura_cm || '0'),
      profundidade_cm: parseFloat(formData.profundidade_cm || '0'),
      peso_g: parseFloat(formData.peso_g || '0'),
      obs: formData.obs,
      empresa_id,
      ativo: true,
      codigo_barras: formData.codigo_barras,
      imagens: [...existingImageUrls, ...uploadedImageUrls], // used in POST, not update
    };

    // Log dos dados para API
    console.log('Dados para API:', data);

    // Se for edição, atualiza o produto existente
    if (produtoId) {
      const updatePayload = {
        ...data,
        imagens_url: [...existingImageUrls, ...uploadedImageUrls],
      };
      const { error } = await supabase
        .from('produtos_servicos')
        .update(updatePayload)
        .eq('id', produtoId);
      if (error) {
        console.error('Erro ao atualizar produto:', error);
        addToast('error', 'Erro ao atualizar produto: ' + error.message);
        return;
      }
      addToast('success', 'Produto atualizado com sucesso!');
      router.push('/equipamentos');
      return;
    }

    // Se não for edição, prossegue com o cadastro (POST)
    try {
      const response = await fetch('/api/produtos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        let msg = '';
        try {
          const errJson = await response.json();
          msg = errJson.error?.message || errJson.message || JSON.stringify(errJson);
        } catch {
          const text = await response.text();
          console.error('Erro não-JSON da API:', text);
          msg = text || 'Erro desconhecido';
        }
        addToast('error', `Erro ao cadastrar produto: ${msg}`);
        return;
      }

      addToast('success', 'Produto cadastrado com sucesso!');
      router.push('/equipamentos');
    } catch (error) {
      console.error(error);
      addToast('error', 'Erro ao cadastrar produto');
    }
  };

  return (
    <SubscriptionGuard tipo="produtos">
      <MenuLayout>
        <main className="flex flex-col items-center justify-start flex-1 px-4 py-8">
          <div className="w-full max-w-5xl">
            <h1 className="text-2xl font-bold mb-6">
              {produtoId ? 'Editar Produto' : 'Novo Produto'}
            </h1>

            <Tab.Group manual defaultIndex={0}>
              <Tab.List className="flex space-x-2 border-b mb-4">
                {(
                  formData.tipo === 'servico'
                    ? ['dados', 'outros']
                    : ['dados', 'fiscal', 'imagens', 'detalhes', 'outros']
                ).map((tabName) => (
                  <Tab
                    key={tabName}
                    className={({ selected }) =>
                      `px-4 py-2 text-sm font-medium rounded-t ${
                        selected ? 'bg-black text-white' : 'bg-muted text-black'
                      }`
                    }
                  >
                    {tabName.charAt(0).toUpperCase() + tabName.slice(1)}
                  </Tab>
                ))}
              </Tab.List>

              <Tab.Panels>
                <Tab.Panel>
                  {/* Conteúdo da aba Dados */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Nome */}
                    <div>
                      <Label htmlFor="nome">Nome do Produto</Label>
                      <Input
                        id="nome"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        placeholder="Ex: Carregador Turbo"
                      />
                    </div>
                    {/* Tipo */}
                    <div>
                      <Select
                        id="tipo"
                        label="Tipo"
                        value={formData.tipo}
                        onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                      >
                        <option value="produto">Produto</option>
                        <option value="servico">Serviço</option>
                      </Select>
                    </div>
                    {/* Grupo */}
                    <div>
                      <Label htmlFor="grupo">Grupo</Label>
                      <Select
                        id="grupo"
                        value={formData.grupo}
                        onChange={(e) => handleGrupoChange(e.target.value)}
                        disabled={loadingCategorias}
                      >
                        <option value="">Selecione um grupo</option>
                        {grupos.map(grupo => (
                          <option key={grupo.id} value={grupo.id}>{grupo.nome}</option>
                        ))}
                      </Select>
                    </div>
                    {/* Categoria */}
                    <div>
                      <Label htmlFor="categoria">Categoria</Label>
                      <Select
                        id="categoria"
                        value={formData.categoria}
                        onChange={(e) => handleCategoriaChange(e.target.value)}
                        disabled={loadingCategorias || !formData.grupo}
                      >
                        <option value="">Selecione uma categoria</option>
                        {categoriasDoGrupo.map(categoria => (
                          <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>
                        ))}
                      </Select>
                    </div>
                    {/* Subcategoria */}
                    <div>
                      <Label htmlFor="subcategoria">Subcategoria</Label>
                      <Select
                        id="subcategoria"
                        value={formData.subcategoria}
                        onChange={(e) => setFormData({ ...formData, subcategoria: e.target.value })}
                        disabled={loadingCategorias || !formData.categoria}
                      >
                        <option value="">Selecione uma subcategoria</option>
                        {subcategoriasDaCategoria.map(subcategoria => (
                          <option key={subcategoria.id} value={subcategoria.id}>{subcategoria.nome}</option>
                        ))}
                      </Select>
                    </div>
                    {/* Preço de Custo */}
                    <div>
                      <Label htmlFor="custo">Preço de Custo</Label>
                      <Input
                        id="custo"
                        type="number"
                        value={formData.custo}
                        onChange={(e) => setFormData({ ...formData, custo: e.target.value })}
                        placeholder="R$ 0,00"
                      />
                    </div>
                    {/* Preço de Venda */}
                    <div>
                      <Label htmlFor="preco">Preço de Venda</Label>
                      <Input
                        id="preco"
                        type="number"
                        value={formData.preco}
                        onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
                        placeholder="R$ 0,00"
                      />
                    </div>
                    {/* Situação */}
                    <div>
                      <Label>Situação</Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={formData.situacao === 'Ativo' ? 'default' : 'outline'}
                          onClick={() => setFormData({ ...formData, situacao: 'Ativo' })}
                        >
                          Ativo
                        </Button>
                        <Button
                          type="button"
                          variant={formData.situacao === 'Inativo' ? 'default' : 'outline'}
                          onClick={() => setFormData({ ...formData, situacao: 'Inativo' })}
                        >
                          Inativo
                        </Button>
                      </div>
                    </div>
                    {/* Produto-specific fields */}
                    {formData.tipo !== 'servico' && (
                      <>
                        {/* Código de barras */}
                        <div>
                          <Label htmlFor="codigo_barras">Código de barras</Label>
                          <Input
                            id="codigo_barras"
                            value={formData.codigo_barras}
                            onChange={(e) => setFormData({ ...formData, codigo_barras: e.target.value })}
                            placeholder="Ex: 7894561230001"
                          />
                          <Button
                            type="button"
                            className="mt-2"
                            onClick={() => {
                              const codigoAleatorio = Math.floor(1000000000000 + Math.random() * 9000000000000).toString();
                              setFormData({ ...formData, codigo_barras: codigoAleatorio });
                            }}
                          >
                            Gerar Código
                          </Button>
                        </div>
                        {/* Unidade de Medida */}
                        <div>
                          <Select
                            id="unidade"
                            label="Unidade de Medida"
                            value={formData.unidade}
                            onChange={(e) => setFormData({ ...formData, unidade: e.target.value })}
                          >
                            <option value="">Selecione</option>
                            <option value="Unidade">Unidade</option>
                            <option value="Caixa">Caixa</option>
                            <option value="Lote">Lote</option>
                            <option value="Pacote">Pacote</option>
                          </Select>
                        </div>
                        {/* Fornecedor */}
                        <div>
                          <Label htmlFor="fornecedor">Fornecedor</Label>
                          <Select
                            id="fornecedor"
                            value={formData.fornecedor_id}
                            onChange={(e) => setFormData({ ...formData, fornecedor_id: e.target.value })}
                            disabled={loadingFornecedores}
                          >
                            <option value="">Selecione um fornecedor</option>
                            {fornecedores.map((fornecedor) => (
                              <option key={fornecedor.id} value={fornecedor.id}>
                                {fornecedor.nome}
                              </option>
                            ))}
                          </Select>
                        </div>
                        {/* Marca */}
                        <div>
                          <Label htmlFor="marca">Marca</Label>
                          <Input
                            id="marca"
                            value={formData.marca}
                            onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                            placeholder="Ex: Samsung"
                          />
                        </div>
                        {/* Estoque Mínimo */}
                        <div>
                          <Label htmlFor="estoqueMin">Estoque Mínimo</Label>
                          <Input
                            id="estoqueMin"
                            type="number"
                            value={formData.estoque_min}
                            onChange={(e) => setFormData({ ...formData, estoque_min: e.target.value })}
                          />
                        </div>
                        {/* Estoque Máximo */}
                        <div>
                          <Label htmlFor="estoqueMax">Estoque Máximo</Label>
                          <Input
                            id="estoqueMax"
                            type="number"
                            value={formData.estoque_max}
                            onChange={(e) => setFormData({ ...formData, estoque_max: e.target.value })}
                          />
                        </div>
                        {/* Estoque Atual */}
                        <div>
                          <Label htmlFor="estoqueAtual">Estoque Atual</Label>
                          <Input
                            id="estoqueAtual"
                            type="number"
                            value={formData.estoque_atual}
                            onChange={(e) => setFormData({ ...formData, estoque_atual: e.target.value })}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </Tab.Panel>
                {formData.tipo !== 'servico' && (
                  <>
                    <Tab.Panel>
                      {/* Conteúdo da aba Fiscal */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="ncm">NCM</Label>
                          <Input
                            id="ncm"
                            value={formData.ncm}
                            onChange={(e) => setFormData({ ...formData, ncm: e.target.value })}
                            placeholder="Ex: 8471.80.10"
                          />
                        </div>
                        <div>
                          <Label htmlFor="cfop">CFOP</Label>
                          <Input
                            id="cfop"
                            value={formData.cfop}
                            onChange={(e) => setFormData({ ...formData, cfop: e.target.value })}
                            placeholder="Ex: 5102"
                          />
                        </div>
                        <div>
                          <Label htmlFor="cst">CST</Label>
                          <Input
                            id="cst"
                            value={formData.cst}
                            onChange={(e) => setFormData({ ...formData, cst: e.target.value })}
                            placeholder="Ex: 00"
                          />
                        </div>
                        <div>
                          <Label htmlFor="cest">CEST</Label>
                          <Input
                            id="cest"
                            value={formData.cest}
                            onChange={(e) => setFormData({ ...formData, cest: e.target.value })}
                            placeholder="Ex: 28.038.00"
                          />
                        </div>
                      </div>
                    </Tab.Panel>
                    <Tab.Panel>
                      {/* Conteúdo da aba Imagens */}
                      <Label htmlFor="imagens">Upload de Imagens</Label>
                      <Input
                        id="imagens"
                        type="file"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);

                          const oversized = files.filter((file) => file.size > 3 * 1024 * 1024);
                          if (oversized.length > 0) {
                            alert("Algumas imagens excedem 3MB e foram ignoradas.");
                          }

                          const validFiles = files.filter((file) => file.size <= 3 * 1024 * 1024);
                          const totalImages = selectedImages.length + validFiles.length;

                          if (totalImages > 5) {
                            alert("Você pode enviar no máximo 5 imagens de até 3MB cada.");
                            return;
                          }

                          setSelectedImages((prev) => [...prev, ...validFiles]);
                        }}
                      />
                      <p className="text-sm text-muted-foreground mt-2">Adicione fotos para facilitar a identificação visual do produto.</p>
                      {/* Pré-visualização das imagens */}
                      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                        {existingImageUrls.map((url, index) => (
                          <div key={`exist-${index}`} className="border rounded p-2">
                            <img
                              src={url}
                              alt={`Existing ${index}`}
                              className="w-full h-auto object-contain"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              className="mt-2 text-xs"
                              onClick={() =>
                                setExistingImageUrls(prev => prev.filter((_, i) => i !== index))
                              }
                            >
                              Remover
                            </Button>
                          </div>
                        ))}
                        {selectedImages.map((file, index) => (
                          <div key={index} className="border rounded p-2">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`Preview ${index}`}
                              className="w-full h-auto object-contain"
                            />
                            <p className="text-xs mt-2 break-words">{file.name}</p>
                            <Button
                              type="button"
                              variant="outline"
                              className="mt-2 text-xs"
                              onClick={() =>
                                setSelectedImages(prev => prev.filter((_, i) => i !== index))
                              }
                            >
                              Remover
                            </Button>
                          </div>
                        ))}
                      </div>
                    </Tab.Panel>
                    <Tab.Panel>
                      {/* Conteúdo da aba Detalhes */}
                      <div className="grid grid-cols-1 gap-4">
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label htmlFor="largura">Largura (cm)</Label>
                            <Input
                              id="largura"
                              type="number"
                              value={formData.largura_cm}
                              onChange={(e) => setFormData({ ...formData, largura_cm: e.target.value })}
                              placeholder="Ex: 10"
                            />
                          </div>
                          <div>
                            <Label htmlFor="altura">Altura (cm)</Label>
                            <Input
                              id="altura"
                              type="number"
                              value={formData.altura_cm}
                              onChange={(e) => setFormData({ ...formData, altura_cm: e.target.value })}
                              placeholder="Ex: 10"
                            />
                          </div>
                          <div>
                            <Label htmlFor="profundidade">Profundidade (cm)</Label>
                            <Input
                              id="profundidade"
                              type="number"
                              value={formData.profundidade_cm}
                              onChange={(e) => setFormData({ ...formData, profundidade_cm: e.target.value })}
                              placeholder="Ex: 5"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="peso">Peso (g)</Label>
                          <Input
                            id="peso"
                            type="number"
                            value={formData.peso_g}
                            onChange={(e) => setFormData({ ...formData, peso_g: e.target.value })}
                            placeholder="Ex: 250"
                          />
                        </div>
                      </div>
                    </Tab.Panel>
                  </>
                )}
                <Tab.Panel>
                  {/* Conteúdo da aba Outros */}
                  <div>
                    <Label htmlFor="obs">Observações</Label>
                    <Textarea
                      id="obs"
                      value={formData.obs}
                      onChange={(e) => setFormData({ ...formData, obs: e.target.value })}
                      placeholder="Observações adicionais sobre o produto..."
                    />
                  </div>
                </Tab.Panel>
              </Tab.Panels>
            </Tab.Group>

            <div className="mt-6 flex gap-4">
              <Button type="button" onClick={handleSubmit}>
                {produtoId ? 'Atualizar Produto' : 'Salvar Produto'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={async () => {
                  const ok = await confirm({
                    message: 'Tem certeza que deseja cancelar? As alterações serão perdidas.',
                    confirmText: 'Sim, cancelar',
                    cancelText: 'Continuar editando',
                  });
                  if (ok) router.back();
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </main>
      </MenuLayout>
    </SubscriptionGuard>
  );
}