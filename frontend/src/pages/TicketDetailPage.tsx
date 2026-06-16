import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';
import { Ticket, User } from '../types';
import { StatusBadge, PriorityBadge, SlaIndicator, Spinner, STATUSES, PRIORITIES, statusLabels, priorityLabels } from '../components/ui';
import toast from 'react-hot-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useAuth } from '../hooks/useAuth';

export default function TicketDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [comment, setComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Ticket>>({});

  const load = () => {
    api.get(`/tickets/${id}`).then(r => { setTicket(r.data); setEditForm(r.data); });
    api.get('/users').then(r => setUsers(r.data));
  };
  useEffect(() => { load(); }, [id]);

  if (!ticket) return <div className="flex justify-center py-20"><Spinner /></div>;

  const saveEdit = async () => {
    setSaving(true);
    try {
      await api.put(`/tickets/${id}`, editForm);
      toast.success('Обновлено');
      setEditing(false);
      load();
    } catch { toast.error('Ошибка'); }
    finally { setSaving(false); }
  };

  const sendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      await api.post(`/tickets/${id}/comments`, { text: comment, isInternal });
      setComment('');
      load();
    } catch { toast.error('Ошибка'); }
  };

  const canEdit = user?.role === 'ADMIN' || user?.role === 'MANAGER' || ticket.assignee?.id === user?.id;

  return (
    <div className="p-6">
      <Link to="/tickets" className="text-sm text-ink-400 hover:text-accent mb-4 inline-flex items-center gap-1">← Обращения</Link>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-1">
                {editing ? <input className="input text-lg font-semibold" value={editForm.title || ''} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} />
                  : <h1 className="text-lg font-semibold text-ink-900">{ticket.title}</h1>}
                <div className="text-xs text-ink-400 mt-1">#{ticket.id} · {ticket.category} · создал {ticket.creator.name} · {format(new Date(ticket.createdAt), 'dd.MM.yyyy HH:mm')}</div>
              </div>
              {canEdit && !editing && <button className="btn-secondary text-xs" onClick={() => setEditing(true)}>Редактировать</button>}
              {editing && <div className="flex gap-2"><button className="btn-primary text-xs" onClick={saveEdit} disabled={saving}>Сохранить</button><button className="btn-secondary text-xs" onClick={() => setEditing(false)}>Отмена</button></div>}
            </div>
            {editing ? <textarea className="input resize-none" rows={5} value={editForm.description || ''} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} />
              : <p className="text-sm text-ink-700 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>}
          </div>

          <div className="card">
            <div className="p-4 border-b border-ink-100"><h3 className="font-medium text-sm">Комментарии ({ticket.comments.length})</h3></div>
            <div className="divide-y divide-ink-50">
              {ticket.comments.map(c => (
                <div key={c.id} className={`p-4 ${c.isInternal ? 'bg-yellow-50 border-l-2 border-yellow-300' : ''}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-ink-700">{c.author.name}</span>
                    {c.isInternal && <span className="badge bg-yellow-100 text-yellow-700">внутренний</span>}
                    <span className="text-xs text-ink-400 ml-auto">{formatDistanceToNow(new Date(c.createdAt), { locale: ru, addSuffix: true })}</span>
                  </div>
                  <p className="text-sm text-ink-700 whitespace-pre-wrap">{c.text}</p>
                </div>
              ))}
            </div>
            <form onSubmit={sendComment} className="p-4 border-t border-ink-100">
              <textarea className="input resize-none mb-2" rows={3} value={comment} onChange={e => setComment(e.target.value)} placeholder="Напишите комментарий..." />
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-ink-600 cursor-pointer">
                  <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} className="rounded" />
                  Внутренний
                </label>
                <button type="submit" className="btn-primary ml-auto text-xs">Отправить</button>
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-4 space-y-4">
            <h3 className="font-medium text-sm border-b border-ink-100 pb-3">Параметры</h3>
            <div>
              <label className="label">Статус</label>
              {editing ? (
                <select className="select" value={editForm.status} onChange={e => setEditForm(p => ({ ...p, status: e.target.value as any }))}>
                  {STATUSES.map(s => <option key={s} value={s}>{statusLabels[s]}</option>)}
                </select>
              ) : <StatusBadge s={ticket.status} />}
            </div>
            <div>
              <label className="label">Приоритет</label>
              {editing ? (
                <select className="select" value={editForm.priority} onChange={e => setEditForm(p => ({ ...p, priority: e.target.value as any }))}>
                  {PRIORITIES.map(p => <option key={p} value={p}>{priorityLabels[p]}</option>)}
                </select>
              ) : <PriorityBadge p={ticket.priority} />}
            </div>
            <div>
              <label className="label">Ответственный</label>
              {editing ? (
                <select className="select" value={editForm.assignee?.id || ''} onChange={e => setEditForm(p => ({ ...p, assigneeId: parseInt(e.target.value) } as any))}>
                  <option value="">Не назначен</option>
                  {users.filter(u => u.isActive).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              ) : <span className="text-sm text-ink-700">{ticket.assignee?.name || '—'}</span>}
            </div>
            <div><label className="label">SLA</label><SlaIndicator deadline={ticket.slaDeadline} /></div>
            {ticket.resolvedAt && <div><label className="label">Решено</label><div className="text-sm text-green-600">{format(new Date(ticket.resolvedAt), 'dd.MM.yyyy HH:mm')}</div></div>}
          </div>

          <div className="card p-4">
            <h3 className="font-medium text-sm mb-3 border-b border-ink-100 pb-3">Клиент</h3>
            <Link to={`/clients/${ticket.client.id}`} className="text-sm font-medium text-accent hover:underline">{ticket.client.name}</Link>
            {ticket.client.company && <div className="text-xs text-ink-400 mt-0.5">{ticket.client.company}</div>}
          </div>

          {!editing && canEdit && (
            <div className="card p-4">
              <h3 className="font-medium text-sm mb-3 border-b border-ink-100 pb-3">Быстрые действия</h3>
              <div className="space-y-2">
                {STATUSES.filter(s => s !== ticket.status).map(s => (
                  <button key={s} className="btn-secondary w-full text-xs justify-start" onClick={async () => {
                    await api.put(`/tickets/${id}`, { ...ticket, assigneeId: ticket.assignee?.id, status: s });
                    toast.success(`Статус → ${statusLabels[s]}`);
                    load();
                  }}>→ {statusLabels[s]}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
