
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card, CardContent, CardTitle } from '@/components/ui/card';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'

import SortableItem from '@/components/SortableItem'
import ProtectedRoute from '@/components/ProtectedRoute'
import { FiEdit2, FiTrash2, FiMove } from 'react-icons/fi';

export default function StatusPage() {
  const [customStatusOS, setCustomStatusOS] = useState<{ id: string; nome: string; cor: string }[]>([])
  const [statusFixoOS, setStatusFixoOS] = useState<{ id: string; nome: string; cor: string }[]>([])
  const [newStatusOS, setNewStatusOS] = useState('')
  const [newCorOS, setNewCorOS] = useState('#000000')
  const [customStatusTec, setCustomStatusTec] = useState<{ id: string; nome: string; cor: string }[]>([])
  const [statusFixoTec, setStatusFixoTec] = useState<{ id: string; nome: string; cor: string }[]>([])
  const [newStatusTec, setNewStatusTec] = useState('')
  const [newCorTec, setNewCorTec] = useState('#000000')
  // Estados para edição inline
  const [editandoIdOS, setEditandoIdOS] = useState<string | null>(null)
  const [editandoStatusOS, setEditandoStatusOS] = useState<string>('')
  const [editandoIdTec, setEditandoIdTec] = useState<string | null>(null)
  const [editandoStatusTec, setEditandoStatusTec] = useState<string>('')

  useEffect(() => {
    const fetchStatuses = async () => {
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData?.user?.id

      const { data: empresaData } = await supabase
        .from('usuarios')
        .select('empresa_id')
        .eq('auth_user_id', userId)
        .single()

      const empresa_id = empresaData?.empresa_id

      const { data: osCustom, error: osError } = await supabase
        .from('status')
        .select('id, nome, cor')
        .eq('tipo', 'os')
        .eq('empresa_id', empresa_id)
        .order('ordem', { ascending: true })

      const { data: tecCustom, error: tecError } = await supabase
        .from('status')
        .select('id, nome, cor')
        .eq('tipo', 'tecnico')
        .eq('empresa_id', empresa_id)
        .order('ordem', { ascending: true })

      const { data: osFixo } = await supabase
        .from('status_fixo')
        .select('id, nome, cor')
        .eq('tipo', 'os')
        .order('ordem', { ascending: true })

      const { data: tecFixo } = await supabase
        .from('status_fixo')
        .select('id, nome, cor')
        .eq('tipo', 'tecnico')
        .order('ordem', { ascending: true })

      if (osCustom) setCustomStatusOS(osCustom)
      if (tecCustom) setCustomStatusTec(tecCustom)
      if (osFixo) setStatusFixoOS(osFixo)
      if (tecFixo) setStatusFixoTec(tecFixo)
    }

    fetchStatuses()
  }, [])

  // Manipuladores para editar e excluir status personalizados
  const handleDeleteStatus = async (id: string, tipo: 'os' | 'tecnico') => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    const { data: empresaData } = await supabase
      .from('usuarios')
      .select('empresa_id')
      .eq('auth_user_id', userId)
      .single();

    if (!empresaData) return alert('Empresa não encontrada.');

    const confirmDelete = window.confirm('Tem certeza que deseja excluir este status? Essa ação não poderá ser desfeita.');
    if (!confirmDelete) return;

    const { error } = await supabase
      .from('status')
      .delete()
      .match({ id, empresa_id: empresaData.empresa_id, tipo });

    if (!error) {
      if (tipo === 'os') {
        setCustomStatusOS((prev) => prev.filter((s) => s.id !== id));
      } else {
        setCustomStatusTec((prev) => prev.filter((s) => s.id !== id));
      }
    } else {
      alert('Erro ao excluir o status. Tente novamente.');
    }
  };

  // Altera o modo de edição para inline, preenchendo os campos e sincronizando corretamente
  const handleEditStatus = (id: string, nome: string, cor: string, tipo: 'os' | 'tecnico') => {
    if (tipo === 'os') {
      setEditandoIdOS(id);
      setEditandoStatusOS(nome);
      setNewStatusOS(nome);
      setNewCorOS(cor);
      setEditandoIdTec(null);
      setEditandoStatusTec('');
    } else {
      setEditandoIdTec(id);
      setEditandoStatusTec(nome);
      setNewStatusTec(nome);
      setNewCorTec(cor);
      setEditandoIdOS(null);
      setEditandoStatusOS('');
    }
  }


  return (
    <ProtectedRoute allowedLevels={['admin', 'tecnico', 'financeiro']}>
      <div className="py-4">
        <h2 className="text-2xl font-extrabold text-lime-700 tracking-tight mb-2">Status da OS e Técnicos</h2>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
          {/* Card da Ordem de Serviço */}
          <Card className="bg-white rounded-2xl p-6 flex flex-col gap-4 border border-zinc-100 shadow-none">
            <h3 className="text-lg font-bold text-zinc-800 mb-1">Status da Ordem de Serviço</h3>
            <p className="text-xs text-zinc-500 mb-2">Arraste os itens para reorganizar a ordem dos status.</p>
            <div className="mb-1 text-xs text-zinc-400 uppercase tracking-widest">Status Fixos</div>
            <DndContext
              sensors={useSensors(
                useSensor(PointerSensor),
                useSensor(KeyboardSensor, {
                  coordinateGetter: sortableKeyboardCoordinates,
                })
              )}
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis]}
              onDragEnd={async ({ active, over }) => {
                if (active.id !== over?.id) {
                  // Junta os arrays dos status fixos e customizados
                  const allStatus = [...statusFixoOS, ...customStatusOS]
                  const oldIndex = allStatus.findIndex((item) => item.id === active.id)
                  const newIndex = allStatus.findIndex((item) => item.id === over?.id)
                  const reordered = arrayMove(allStatus, oldIndex, newIndex)

                  // Atualiza os estados locais para refletir a nova ordem
                  setStatusFixoOS(reordered.filter((s) => statusFixoOS.find((f) => f.id === s.id)))
                  setCustomStatusOS(reordered.filter((s) => customStatusOS.find((c) => c.id === s.id)))

                  // Atualiza ordem no banco para ambos status_fixo e status
                  const { data: userData } = await supabase.auth.getUser()
                  const userId = userData?.user?.id
                  const { data: empresaData } = await supabase
                    .from('usuarios')
                    .select('empresa_id')
                    .eq('auth_user_id', userId)
                    .single()

                  const empresa_id = empresaData?.empresa_id

                  for (let i = 0; i < reordered.length; i++) {
                    const status = reordered[i]
                    const table = statusFixoOS.find((s) => s.id === status.id) ? 'status_fixo' : 'status'
                    let query = supabase
                      .from(table)
                      .update({ ordem: i })
                      .eq('id', status.id)
                      .eq('tipo', 'os')
                    if (table === 'status') {
                      query = query.eq('empresa_id', empresa_id)
                    }
                    await query.maybeSingle()
                  }
                }
              }}
            >
              <SortableContext
                items={[...statusFixoOS, ...customStatusOS].map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-col gap-1">
                  {statusFixoOS.map((status) => (
                    <SortableItem key={status.id} id={status.id}>
                      <div className="flex items-center gap-3 py-2 px-2 bg-transparent">
                        <span className="h-5 w-5 rounded-full border-2 border-white shadow ring-2 ring-zinc-200" style={{ backgroundColor: status.cor }} />
                        <span className="text-base font-medium text-zinc-900">{status.nome}</span>
                        <FiMove className="text-zinc-300 text-lg ml-auto" />
                      </div>
                    </SortableItem>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            <div className="mt-3 mb-1 text-xs text-zinc-400 uppercase tracking-widest">Status Personalizados</div>
            <DndContext
              sensors={useSensors(
                useSensor(PointerSensor),
                useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
              )}
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis]}
              onDragEnd={async ({ active, over }) => {
                if (active.id !== over?.id) {
                  // Junta os arrays dos status fixos e customizados
                  const allStatus = [...customStatusOS]
                  const oldIndex = allStatus.findIndex((item) => item.id === active.id)
                  const newIndex = allStatus.findIndex((item) => item.id === over?.id)
                  const reordered = arrayMove(allStatus, oldIndex, newIndex)

                  // Atualiza os estados locais para refletir a nova ordem
                  setCustomStatusOS(reordered.filter((s) => customStatusOS.find((c) => c.id === s.id)))

                  // Atualiza ordem no banco para status
                  const { data: userData } = await supabase.auth.getUser()
                  const userId = userData?.user?.id
                  const { data: empresaData } = await supabase
                    .from('usuarios')
                    .select('empresa_id')
                    .eq('auth_user_id', userId)
                    .single()

                  const empresa_id = empresaData?.empresa_id

                  for (let i = 0; i < reordered.length; i++) {
                    const status = reordered[i]
                    const query = supabase
                      .from('status')
                      .update({ ordem: i })
                      .eq('id', status.id)
                      .eq('tipo', 'os')
                      .eq('empresa_id', empresa_id)
                    await query.maybeSingle()
                  }
                }
              }}
            >
              <SortableContext
                items={customStatusOS.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-col gap-1">
                  {customStatusOS.map((status) => (
                    <SortableItem key={status.id} id={status.id}>
                      <div className="flex items-center gap-3 py-2 px-2 bg-transparent">
                        <span className="h-5 w-5 rounded-full border-2 border-white shadow ring-2 ring-lime-200" style={{ backgroundColor: status.cor }} />
                        <span className="text-base font-medium text-zinc-900">{status.nome}</span>
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleEditStatus(status.id, status.nome, status.cor, 'os');
                          }}
                          className="flex items-center gap-1 text-blue-600 hover:bg-blue-50 px-1 py-1 rounded transition ml-auto"
                        >
                          <FiEdit2 size={15} />
                        </button>
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteStatus(status.id, 'os');
                          }}
                          className="flex items-center gap-1 text-red-600 hover:bg-red-50 px-1 py-1 rounded transition"
                        >
                          <FiTrash2 size={15} />
                        </button>
                        <FiMove className="text-zinc-300 text-lg ml-2" />
                      </div>
                    </SortableItem>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={newCorOS}
                onChange={(e) => setNewCorOS(e.target.value)}
                className="h-8 w-12 rounded-md border border-zinc-300 shadow-sm focus:outline-none focus:border-black"
                title="Escolha uma cor"
              />
              <input
                value={newStatusOS}
                onChange={(e) => setNewStatusOS(e.target.value)}
                placeholder="Novo status"
                className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:border-black"
              />
              <button
                onMouseDown={async (e) => {
                  e.preventDefault();
                  const isEditing = !!editandoIdOS;
                  if (isEditing) {
                    // Atualizar status existente
                    if (!newStatusOS.trim()) return;
                    const { data: userData } = await supabase.auth.getUser();
                    const userId = userData?.user?.id;
                    const { data: empresaData } = await supabase
                      .from('usuarios')
                      .select('empresa_id')
                      .eq('auth_user_id', userId)
                      .single();
                    if (!empresaData) return alert('Empresa não encontrada.');
                    const { error } = await supabase
                      .from('status')
                      .update({ nome: newStatusOS.trim(), cor: newCorOS })
                      .eq('id', editandoIdOS)
                      .eq('empresa_id', empresaData.empresa_id)
                      .eq('tipo', 'os');
                    if (!error) {
                      setCustomStatusOS((prev) =>
                        prev.map((s) =>
                          s.id === editandoIdOS
                            ? { ...s, nome: newStatusOS.trim(), cor: newCorOS }
                            : s
                        )
                      );
                      setEditandoIdOS(null);
                      setEditandoStatusOS('');
                      setNewStatusOS('');
                      setNewCorOS('#000000');
                    }
                  } else if (newStatusOS.trim()) {
                    // Inserir novo status
                    const { data: userData } = await supabase.auth.getUser();
                    const userId = userData?.user?.id;
                    const { data: empresaData } = await supabase
                      .from('usuarios')
                      .select('empresa_id')
                      .eq('auth_user_id', userId)
                      .single();
                    if (!empresaData) return alert('Empresa não encontrada.');
                    const { data, error } = await supabase
                      .from('status')
                      .insert({
                        nome: newStatusOS.trim(),
                        tipo: 'os',
                        cor: newCorOS,
                        empresa_id: empresaData.empresa_id,
                      })
                      .select('id, nome, cor')
                      .single();
                    if (!error && data) {
                      setCustomStatusOS([...customStatusOS, data]);
                      setNewStatusOS('');
                      setNewCorOS('#000000');
                    }
                  }
                }}
                className="px-4 py-2 bg-black text-white rounded-md font-semibold shadow-sm hover:bg-zinc-800 transition-colors text-sm"
              >
                {editandoIdOS ? 'Atualizar' : 'Adicionar'}
              </button>
            </div>
            <p className="text-xs text-zinc-400 mt-2">Os status fixos não podem ser removidos.</p>
          </Card>
          {/* Card do Técnico */}
          <Card className="bg-white rounded-2xl p-6 flex flex-col gap-4 border border-zinc-100 shadow-none">
            <h3 className="text-lg font-bold text-zinc-800 mb-1">Status do Técnico</h3>
            <p className="text-xs text-zinc-500 mb-2">Arraste os itens para reorganizar a ordem dos status.</p>
            <div className="mb-1 text-xs text-zinc-400 uppercase tracking-widest">Status Fixos</div>
            <DndContext
              sensors={useSensors(
                useSensor(PointerSensor),
                useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
              )}
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis]}
              onDragEnd={async ({ active, over }) => {
                if (active.id !== over?.id) {
                  // Junta os arrays dos status fixos e customizados
                  const allStatus = [...statusFixoTec, ...customStatusTec]
                  const oldIndex = allStatus.findIndex((item) => item.id === active.id)
                  const newIndex = allStatus.findIndex((item) => item.id === over?.id)
                  const reordered = arrayMove(allStatus, oldIndex, newIndex)

                  // Atualiza os estados locais para refletir a nova ordem
                  setStatusFixoTec(reordered.filter((s) => statusFixoTec.find((f) => f.id === s.id)))
                  setCustomStatusTec(reordered.filter((s) => customStatusTec.find((c) => c.id === s.id)))

                  // Atualiza ordem no banco para ambos status_fixo e status
                  const { data: userData } = await supabase.auth.getUser()
                  const userId = userData?.user?.id
                  const { data: empresaData } = await supabase
                    .from('usuarios')
                    .select('empresa_id')
                    .eq('auth_user_id', userId)
                    .single()

                  const empresa_id = empresaData?.empresa_id

                  for (let i = 0; i < reordered.length; i++) {
                    const status = reordered[i]
                    const table = statusFixoTec.find((s) => s.id === status.id) ? 'status_fixo' : 'status'
                    let query = supabase
                      .from(table)
                      .update({ ordem: i })
                      .eq('id', status.id)
                      .eq('tipo', 'tecnico')
                    if (table === 'status') {
                      query = query.eq('empresa_id', empresa_id)
                    }
                    await query.maybeSingle()
                  }
                }
              }}
            >
              <SortableContext
                items={[...statusFixoTec, ...customStatusTec].map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-col gap-1">
                  {statusFixoTec.map((status) => (
                    <SortableItem key={status.id} id={status.id}>
                      <div className="flex items-center gap-3 py-2 px-2 bg-transparent">
                        <span className="h-5 w-5 rounded-full border-2 border-white shadow ring-2 ring-zinc-200" style={{ backgroundColor: status.cor }} />
                        <span className="text-base font-medium text-zinc-900">{status.nome}</span>
                        <FiMove className="text-zinc-300 text-lg ml-auto" />
                      </div>
                    </SortableItem>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            <div className="mt-3 mb-1 text-xs text-zinc-400 uppercase tracking-widest">Status Personalizados</div>
            <DndContext
              sensors={useSensors(
                useSensor(PointerSensor),
                useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
              )}
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis]}
              onDragEnd={async ({ active, over }) => {
                if (active.id !== over?.id) {
                  // Junta os arrays dos status fixos e customizados
                  const allStatus = [...customStatusTec]
                  const oldIndex = allStatus.findIndex((item) => item.id === active.id)
                  const newIndex = allStatus.findIndex((item) => item.id === over?.id)
                  const reordered = arrayMove(allStatus, oldIndex, newIndex)

                  // Atualiza os estados locais para refletir a nova ordem
                  setCustomStatusTec(reordered.filter((s) => customStatusTec.find((c) => c.id === s.id)))

                  // Atualiza ordem no banco para status
                  const { data: userData } = await supabase.auth.getUser()
                  const userId = userData?.user?.id
                  const { data: empresaData } = await supabase
                    .from('usuarios')
                    .select('empresa_id')
                    .eq('auth_user_id', userId)
                    .single()

                  const empresa_id = empresaData?.empresa_id

                  for (let i = 0; i < reordered.length; i++) {
                    const status = reordered[i]
                    const query = supabase
                      .from('status')
                      .update({ ordem: i })
                      .eq('id', status.id)
                      .eq('tipo', 'tecnico')
                      .eq('empresa_id', empresa_id)
                    await query.maybeSingle()
                  }
                }
              }}
            >
              <SortableContext
                items={customStatusTec.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-col gap-1">
                  {customStatusTec.map((status) => (
                    <SortableItem key={status.id} id={status.id}>
                      <div className="flex items-center gap-3 py-2 px-2 bg-transparent">
                        <span className="h-5 w-5 rounded-full border-2 border-white shadow ring-2 ring-lime-200" style={{ backgroundColor: status.cor }} />
                        <span className="text-base font-medium text-zinc-900">{status.nome}</span>
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleEditStatus(status.id, status.nome, status.cor, 'tecnico');
                          }}
                          className="flex items-center gap-1 text-blue-600 hover:bg-blue-50 px-1 py-1 rounded transition ml-auto"
                        >
                          <FiEdit2 size={15} />
                        </button>
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteStatus(status.id, 'tecnico');
                          }}
                          className="flex items-center gap-1 text-red-600 hover:bg-red-50 px-1 py-1 rounded transition"
                        >
                          <FiTrash2 size={15} />
                        </button>
                        <FiMove className="text-zinc-300 text-lg ml-2" />
                      </div>
                    </SortableItem>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={newCorTec}
                onChange={(e) => setNewCorTec(e.target.value)}
                className="h-8 w-12 rounded-md border border-zinc-300 shadow-sm focus:outline-none focus:border-black"
                title="Escolha uma cor"
              />
              <input
                value={newStatusTec}
                onChange={(e) => setNewStatusTec(e.target.value)}
                placeholder="Novo status"
                className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:border-black"
              />
              <button
                onMouseDown={async (e) => {
                  e.preventDefault();
                  const isEditing = !!editandoIdTec;
                  if (isEditing) {
                    // Atualizar status existente
                    if (!newStatusTec.trim()) return;
                    const { data: userData } = await supabase.auth.getUser();
                    const userId = userData?.user?.id;
                    const { data: empresaData } = await supabase
                      .from('usuarios')
                      .select('empresa_id')
                      .eq('auth_user_id', userId)
                      .single();
                    if (!empresaData) return alert('Empresa não encontrada.');
                    const { error } = await supabase
                      .from('status')
                      .update({ nome: newStatusTec.trim(), cor: newCorTec })
                      .eq('id', editandoIdTec)
                      .eq('empresa_id', empresaData.empresa_id)
                      .eq('tipo', 'tecnico');
                    if (!error) {
                      setCustomStatusTec((prev) =>
                        prev.map((s) =>
                          s.id === editandoIdTec
                            ? { ...s, nome: newStatusTec.trim(), cor: newCorTec }
                            : s
                        )
                      );
                      setEditandoIdTec(null);
                      setEditandoStatusTec('');
                      setNewStatusTec('');
                      setNewCorTec('#000000');
                    }
                  } else if (newStatusTec.trim()) {
                    // Inserir novo status
                    const { data: userData } = await supabase.auth.getUser();
                    const userId = userData?.user?.id;
                    const { data: empresaData } = await supabase
                      .from('usuarios')
                      .select('empresa_id')
                      .eq('auth_user_id', userId)
                      .single();
                    if (!empresaData) return alert('Empresa não encontrada.');
                    const { data, error } = await supabase
                      .from('status')
                      .insert({
                        nome: newStatusTec.trim(),
                        tipo: 'tecnico',
                        cor: newCorTec,
                        empresa_id: empresaData.empresa_id,
                      })
                      .select('id, nome, cor')
                      .single();
                    if (!error && data) {
                      setCustomStatusTec([...customStatusTec, data]);
                      setNewStatusTec('');
                      setNewCorTec('#000000');
                    }
                  }
                }}
                className="px-4 py-2 bg-black text-white rounded-md font-semibold shadow-sm hover:bg-zinc-800 transition-colors text-sm"
              >
                {editandoIdTec ? 'Atualizar' : 'Adicionar'}
              </button>
            </div>
            <p className="text-xs text-zinc-400 mt-2">Os status fixos não podem ser removidos.</p>
          </Card>
        </CardContent>
      </div>  
    </ProtectedRoute>
  )
}