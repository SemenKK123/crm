import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { Category } from '../types';
import { PageHeader, EmptyState, Spinner } from '../components/ui';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

export default function CategoriesPage() {
  const { user } = useAuth();
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', slaHours: '24' });
  const [editId, setEditId] = useState<number | null>(null);

  const load = () => { setLoading(true); api.get('/categories').then(r => setCats(r.data)).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) { await api.put(`/categories/${editId}`, { name: form.name, slaHours: parseInt(form.slaHours) }); toast.success('Обновлено'); setEditId(null); }
      else { await api.post('/categories', { name: form.name, slaHours: parseInt(form.slaHours) }); toast.success('Создано'); }
      setForm({ name: '', slaHours: '24' });
      load();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Ошибка'); }
  };

  const del = async (id: number) => {
    if (!confirm('Удалить категорию?')) return;
    await api.delete(`/categories/${id}`);
    toast.success('Удалено');
    load();
  };

  const canEdit = user?.role === 'ADMIN' || user?.role === 'HEAD';

  return (
    <div className="p-6">
      <PageHeader title="Категории обращений" subtitle="Настройка справочника" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {canEdit && (
          <div className="card p-5">
            <h3 className="font-medium text-sm mb-4">{editId ? 'Редактирование' : 'Новая категория'}</h3>
            <form onSubmit={save} className="space-y-3">
              <div><label className="label">Название *</label><input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required /></div>
              <div><label className="label">SLA (часов)</label><input className="input" type="number" min="1" value={form.slaHours} onChange={e => setForm(p => ({ ...p, slaHours: e.target.value }))} required /></div>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1">{editId ? 'Сохранить' : 'Добавить'}</button>
                {editId && <button type="button" className="btn-secondary" onClick={() => { setEditId(null); setForm({ name: '', slaHours: '24' }); }}>Отмена</button>}
              </div>
            </form>
          </div>
        )}
        <div className={`${canEdit ? 'lg:col-span-2' : 'lg:col-span-3'} card overflow-hidden`}>
          {loading ? <div className="flex justify-center py-12"><Spinner /></div> : cats.length === 0 ? <EmptyState icon="◫" text="Нет категорий" /> : (
            <table className="w-full text-sm">
              <thead className="bg-ink-50 border-b border-ink-100">
                <tr>{['Название', 'SLA (часов)', canEdit ? 'Действия' : ''].filter(Boolean).map(h => <th key={h} className="text-left px-4 py-3 text-xs font-medium text-ink-500 uppercase tracking-wide">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-ink-50">
                {cats.map(c => (
                  <tr key={c.id} className="hover:bg-ink-50">
                    <td className="px-4 py-3 font-medium text-ink-800">{c.name}</td>
                    <td className="px-4 py-3 text-ink-600">{c.slaHours}ч</td>
                    {canEdit && <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button className="btn-ghost text-xs py-1 px-2" onClick={() => { setEditId(c.id); setForm({ name: c.name, slaHours: String(c.slaHours) }); }}>Изменить</button>
                        {user?.role === 'ADMIN' && <button className="btn-ghost text-xs py-1 px-2 text-red-500 hover:text-red-700" onClick={() => del(c.id)}>Удалить</button>}
                      </div>
                    </td>}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
