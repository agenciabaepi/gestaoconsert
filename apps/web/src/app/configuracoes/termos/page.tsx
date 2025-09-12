'use client'

import { Button } from '@/components/Button'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import { FiPlus, FiEdit2, FiTrash2, FiX, FiSave, FiFileText, FiBold, FiItalic, FiUnderline, FiList, FiAlignLeft, FiAlignCenter, FiAlignRight, FiLink, FiCheckCircle, FiClock } from 'react-icons/fi'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import { useToast } from '@/components/Toast'
import { useConfirm } from '@/components/ConfirmDialog'

interface Termo {
  id: string
  nome: string
  conteudo: string
  ativo: boolean
  ordem: number
  empresa_id: string
  created_at: string
  updated_at: string
}

export default function TermosPage() {
  const { empresaData } = useAuth()
  const { addToast } = useToast()
  const confirm = useConfirm()
  const [termos, setTermos] = useState<Termo[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingTermo, setEditingTermo] = useState<Termo | null>(null)
  const [mounted, setMounted] = useState(false)
  const [expandedTermos, setExpandedTermos] = useState<Set<string>>(new Set())
  const [formData, setFormData] = useState({
    nome: '',
    conteudo: '',
    ativo: true
  })

  // Garantir que o componente está montado no cliente
  useEffect(() => {
    setMounted(true)
  }, [])

  // Configurar editor TipTap
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
      }),
      Underline,
    ],
    content: formData.conteudo,
    onUpdate: ({ editor }) => {
      setFormData(prev => ({ ...prev, conteudo: editor.getHTML() }))
    },
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none',
      },
    },
  })

  // Atualizar conteúdo do editor quando formData.conteudo mudar
  useEffect(() => {
    if (editor && formData.conteudo !== editor.getHTML()) {
      editor.commands.setContent(formData.conteudo)
    }
  }, [formData.conteudo, editor])

  // Carregar termos
  const fetchTermos = async () => {
    if (!empresaData?.id) return
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('termos_garantia')
        .select('*')
        .eq('empresa_id', empresaData.id)
        .order('ordem', { ascending: true })

      if (error) {
        console.error('Erro ao carregar termos:', error)
        addToast('error', 'Erro ao carregar termos de garantia')
      } else {
        setTermos(data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar termos:', error)
      addToast('error', 'Erro inesperado ao carregar termos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTermos()
  }, [empresaData?.id])

  // Salvar termo
  const salvarTermo = async () => {
    if (!empresaData?.id || !formData.nome || !formData.conteudo) {
      addToast('warning', 'Preencha todos os campos obrigatórios!')
      return
    }

    try {
      if (editingTermo) {
        // Atualizar termo existente
        const { error } = await supabase
          .from('termos_garantia')
          .update({
            nome: formData.nome,
            conteudo: formData.conteudo,
            ativo: formData.ativo
          })
          .eq('id', editingTermo.id)

        if (error) {
          console.error('Erro ao atualizar termo:', error)
          addToast('error', 'Erro ao atualizar termo!')
          return
        }
        addToast('success', 'Termo atualizado com sucesso!')
      } else {
        // Criar novo termo
        const { error } = await supabase
          .from('termos_garantia')
          .insert({
            empresa_id: empresaData.id,
            nome: formData.nome,
            conteudo: formData.conteudo,
            ativo: formData.ativo,
            ordem: termos.length + 1
          })

        if (error) {
          console.error('Erro ao criar termo:', error)
          addToast('error', 'Erro ao criar termo!')
          return
        }
        addToast('success', 'Termo criado com sucesso!')
      }

      // Recarregar lista e fechar modal
      await fetchTermos()
      fecharModal()
    } catch (error) {
      console.error('Erro ao salvar termo:', error)
      addToast('error', 'Erro inesperado!')
    }
  }

  // Excluir termo
  const excluirTermo = async (id: string) => {
    const confirmed = await confirm({
      title: 'Excluir Termo',
      message: 'Tem certeza que deseja excluir este termo? Esta ação não pode ser desfeita.',
      confirmText: 'Excluir',
      cancelText: 'Cancelar'
    })

    if (!confirmed) return

    try {
      const { error } = await supabase
        .from('termos_garantia')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Erro ao excluir termo:', error)
        addToast('error', 'Erro ao excluir termo!')
        return
      }

      await fetchTermos()
      addToast('success', 'Termo excluído com sucesso!')
    } catch (error) {
      console.error('Erro ao excluir termo:', error)
      addToast('error', 'Erro inesperado!')
    }
  }

  // Abrir modal para editar
  const editarTermo = (termo: Termo) => {
    setEditingTermo(termo)
    setFormData({
      nome: termo.nome,
      conteudo: termo.conteudo,
      ativo: termo.ativo
    })
    setShowModal(true)
  }

  // Abrir modal para criar novo
  const novoTermo = () => {
    setEditingTermo(null)
    setFormData({
      nome: '',
      conteudo: '',
      ativo: true
    })
    setShowModal(true)
  }

  // Fechar modal
  const fecharModal = () => {
    setShowModal(false)
    setEditingTermo(null)
    setFormData({
      nome: '',
      conteudo: '',
      ativo: true
    })
  }

  // Toggle acordeão
  const toggleTermo = (termoId: string) => {
    setExpandedTermos(prev => {
      const newSet = new Set(prev)
      if (newSet.has(termoId)) {
        newSet.delete(termoId)
      } else {
        newSet.add(termoId)
      }
      return newSet
    })
  }

  // Componente da barra de ferramentas do editor
  const Toolbar = () => {
    if (!editor) return null

    return (
      <div className="border border-gray-300 rounded-t-lg bg-gray-50 p-2 flex flex-wrap gap-1">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('bold') ? 'bg-gray-300' : ''}`}
          title="Negrito"
        >
          <FiBold className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('italic') ? 'bg-gray-300' : ''}`}
          title="Itálico"
        >
          <FiItalic className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('underline') ? 'bg-gray-300' : ''}`}
          title="Sublinhado"
        >
          <FiUnderline className="w-4 h-4" />
        </button>
        <div className="w-px bg-gray-300 mx-1"></div>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('bulletList') ? 'bg-gray-300' : ''}`}
          title="Lista com marcadores"
        >
          <FiList className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('orderedList') ? 'bg-gray-300' : ''}`}
          title="Lista numerada"
        >
          <span className="text-sm font-bold">1.</span>
        </button>
        <div className="w-px bg-gray-300 mx-1"></div>
        <button
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-300' : ''}`}
          title="Alinhar à esquerda"
        >
          <FiAlignLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-300' : ''}`}
          title="Centralizar"
        >
          <FiAlignCenter className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-300' : ''}`}
          title="Alinhar à direita"
        >
          <FiAlignRight className="w-4 h-4" />
        </button>
        <div className="w-px bg-gray-300 mx-1"></div>
        <button
          onClick={() => {
            const url = window.prompt('Digite a URL:')
            if (url) {
              editor.chain().focus().setLink({ href: url }).run()
            }
          }}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('link') ? 'bg-gray-300' : ''}`}
          title="Inserir link"
        >
          <FiLink className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header com gradiente */}
      <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 -mx-8 px-8 py-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FiFileText className="w-6 h-6 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Termos de Garantia</h1>
            </div>
            <p className="text-gray-600">Gerencie os termos de garantia da sua empresa</p>
          </div>
          <Button
            onClick={novoTermo}
            className="flex items-center gap-2 shadow-lg hover:shadow-xl transition-shadow"
          >
            <FiPlus className="w-4 h-4" />
            Novo Termo
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Termos</p>
              <p className="text-2xl font-bold text-gray-900">{termos.length}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <FiFileText className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Termos Ativos</p>
              <p className="text-2xl font-bold text-green-600">{termos.filter(t => t.ativo).length}</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <FiCheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Termos Inativos</p>
              <p className="text-2xl font-bold text-gray-500">{termos.filter(t => !t.ativo).length}</p>
            </div>
            <div className="p-2 bg-gray-100 rounded-lg">
              <FiX className="w-5 h-5 text-gray-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Termos */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Carregando termos...</p>
          </div>
        </div>
      ) : (
        <div className="flex-1">
          {termos.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <FiFileText className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum termo encontrado</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">Crie seu primeiro termo de garantia para começar a usar no sistema</p>
              <Button onClick={novoTermo} className="shadow-lg">
                <FiPlus className="w-4 h-4 mr-2" />
                Criar Primeiro Termo
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {termos.map((termo, index) => (
                <div key={termo.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  {/* Header do Acordeão */}
                  <div 
                    className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleTermo(termo.id)}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center justify-center w-10 h-10 bg-blue-50 rounded-lg">
                        <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">{termo.nome}</h3>
                        <div className="flex items-center gap-3 mt-2">
                          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                            termo.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-500'
                          }`}>
                            {termo.ativo ? '✓ Ativo' : '✗ Inativo'}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <FiClock className="w-3 h-3" />
                            Criado em {new Date(termo.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          editarTermo(termo)
                        }}
                        className="hover:bg-blue-50 hover:text-blue-600"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          excluirTermo(termo.id)
                        }}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Conteúdo do Acordeão */}
                  {expandedTermos.has(termo.id) && (
                    <div className="border-t border-gray-200 p-5 bg-gradient-to-br from-gray-50 to-white">
                      <div 
                        className="text-gray-600 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: termo.conteudo }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal de Edição/Criação */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col">
            {/* Header do Modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingTermo ? 'Editar Termo' : 'Novo Termo'}
              </h2>
              <button
                onClick={fecharModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                {/* Coluna da Esquerda - Campos Básicos */}
                <div className="lg:col-span-1 space-y-6">
                  {/* Nome do Termo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome do Termo *
                    </label>
                    <input
                      type="text"
                      value={formData.nome}
                      onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="Ex: Garantia Padrão 90 dias"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, ativo: true }))}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                          formData.ativo
                            ? 'bg-green-100 text-green-800 border-green-300'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        Ativo
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, ativo: false }))}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                          !formData.ativo
                            ? 'bg-gray-100 text-gray-800 border-gray-300'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        Inativo
                      </button>
                    </div>
                  </div>

                  {/* Botões */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={fecharModal}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      onClick={salvarTermo}
                      disabled={!formData.nome || !formData.conteudo}
                      className="flex-1"
                    >
                      <FiSave className="w-4 h-4 mr-2" />
                      {editingTermo ? 'Atualizar' : 'Salvar'}
                    </Button>
                  </div>
                </div>

                {/* Coluna da Direita - Editor */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Conteúdo do Termo *
                  </label>
                  <div className="border border-gray-300 rounded-lg h-full flex flex-col">
                    {mounted && <Toolbar />}
                    {mounted && (
                      <EditorContent 
                        editor={editor} 
                        className="flex-1 p-4 focus:outline-none min-h-[400px]"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}