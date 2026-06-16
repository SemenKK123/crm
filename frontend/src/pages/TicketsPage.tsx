import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { Ticket, Client, User, Category } from '../types';
import { PageHeader, StatusBadge, PriorityBadge, SlaIndicator, EmptyState, Spinner, STATUSES, PRIORITIES, statusLabels, priorityLabels } from '../components/ui';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

function TicketModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({ title: '', description: '', priority: 'MEDIUM', category: '', clientId: '', assigneeId: '', slaHours: '' });
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/clients'), api.get('/users'), api.get('/categories')]).then(([c, u, cat]) => { setClients(c.data); setUsers(u.data); setCategories(cat.data); });
  }, []);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientId) { toast.error('Выберите клиента'); return; }
    setLoading(true);
    try {
      await api.post('/tickets', { ...form, clientId: parseInt(form.clientId), assigneeId: form.assigneeId ? parseInt(form.assigneeId) : undefined, slaHours: form.slaHours ? parseInt(form.slaHours) : undefined });
      toast.success('Обращение создано');
      onSave();
    } catch { toast.error('Ошибка создания'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-ink-100 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="font-semibold">Новое обращение</h2>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700">✕</button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-3">
          <div><label className="label">Тема *</label><input className="input" value={form.title} onChange={e => set('title', e.target.value)} required /></div>
          <div><label className="label">Описание *</label><textarea className="input resize-none" rows={3} value={form.description} onChange={e => set('description', e.target.value)} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Приоритет</label>
              <select className="select" value={form.priority} onChange={e => set('priority', e.target.value)}>
                {PRIORITIES.map(p => <option key={p} value={p}>{priorityLabels[p]}</option>)}
              </select>
            </div>
            <div><label className="label">Категория *</label>
              <select className="select" value={form.category} onChange={e => set('category', e.target.value)} required>
                <option value="">Выберите...</option>
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div><label className="label">Клиент *</label>
            <select className="select" value={form.clientId} onChange={e => set('clientId', e.target.value)} required>
              <option value="">Выберите клиента...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</option>)}
            </select>
          </div>
          <div><label className="label">Ответственный</label>
            <select className="select" value={form.assigneeId} onChange={e => set('assigneeId', e.target.value)}>
              <option value="">Не назначен</option>
              {users.filter(u => u.isActive).map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
            </select>
          </div>
          <div><label className="label">SLA (часов, переопределить)</label>
            <input className="input" type="number" min="1" value={form.slaHours} onChange={e => set('slaHours', e.target.value)} placeholder="По умолчанию из категории" />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? 'Создание...' : 'Создать'}</button>
            <button type="button" onClick={onClose} className="btn-secondary">Отмена</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', priority: '', search: '' });
  const [showModal, setShowModal] = useState(false);

  const load = () => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (filters.status) params.status = filters.status;
    if (filters.priority) params.priority = filters.priority;
    if (filters.search) params.search = filters.search;
    api.get('/tickets', { params }).then(r => setTickets(r.data)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [filters]);

  return (
    <div className="p-6">
      <PageHeader title="Обращения" subtitle={`${tickets.length} записей`}
        action={<button className="btn-primary" onClick={() => setShowModal(true)}>+ Создать</button>} />

      <div className="flex flex-wrap gap-3 mb-4">
        <input className="input w-56" placeholder="Поиск..." value={filters.search} onChange={e => setFilters(p => ({ ...p, search: e.target.value }))} />
        <select className="select w-40" value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}>
          <option value="">Все статусы</option>
          {STATUSES.map(s => <option key={s} value={s}>{statusLabels[s]}</option>)}
        </select>
        <select className="select w-40" value={filters.priority} onChange={e => setFilters(p => ({ ...p, priority: e.target.value }))}>
          <option value="">Все приоритеты</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{priorityLabels[p]}</option>)}
        </select>
        {(filters.status || filters.priority || filters.search) && <button className="btn-ghost" onClick={() => setFilters({ status: '', priority: '', search: '' })}>Сбросить</button>}
      </div>

      <div className="card overflow-hidden">
        {loading ? <div className="flex justify-center py-12"><Spinner /></div> : tickets.length === 0 ? <EmptyState icon="◈" text="Обращения не найдены" /> : (
          <table className="w-full text-sm">
            <thead className="bg-ink-50 border-b border-ink-100">
              <tr>{['#', 'Тема', 'Клиент', 'Ответственный', 'Статус', 'Приоритет', 'SLA', 'Дата'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-medium text-ink-500 uppercase tracking-wide">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {tickets.map(t => (
                <tr key={t.id} className="hover:bg-ink-50 transition">
                  <td className="px-4 py-3 text-ink-400 font-mono text-xs">#{t.id}</td>
                  <td className="px-4 py-3">
                    <Link to={`/tickets/${t.id}`} className="font-medium text-ink-800 hover:text-accent">{t.title}</Link>
                    <div className="text-xs text-ink-400">{t.category}</div>
                  </td>
                  <td className="px-4 py-3 text-ink-600">{t.client.name}</td>
                  <td className="px-4 py-3 text-ink-600">{t.assignee?.name || <span className="text-ink-300">—</span>}</td>
                  <td className="px-4 py-3"><StatusBadge s={t.status} /></td>
                  <td className="px-4 py-3"><PriorityBadge p={t.priority} /></td>
                  <td className="px-4 py-3"><SlaIndicator deadline={t.slaDeadline} /></td>
                  <td className="px-4 py-3 text-ink-400 text-xs">{format(new Date(t.createdAt), 'dd.MM.yy')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {showModal && <TicketModal onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); load(); }} />}
    </div>
  );
}
