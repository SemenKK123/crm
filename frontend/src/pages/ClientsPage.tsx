import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { Client } from '../types';
import { PageHeader, EmptyState, Spinner } from '../components/ui';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

function ClientModal({ client, onClose, onSave }: { client?: Client; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({ name: client?.name || '', email: client?.email || '', phone: client?.phone || '', company: client?.company || '', inn: client?.inn || '', notes: client?.notes || '' });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (client) await api.put(`/clients/${client.id}`, form);
      else await api.post('/clients', form);
      toast.success(client ? 'Клиент обновлён' : 'Клиент создан');
      onSave();
    } catch { toast.error('Ошибка сохранения'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-lg">
        <div className="p-5 border-b border-ink-100 flex items-center justify-between">
          <h2 className="font-semibold">{client ? 'Редактировать' : 'Новый клиент'}</h2>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700">✕</button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-3">
          {[['name', 'Название / ФИО *', true], ['company', 'Компания', false], ['email', 'Email', false], ['phone', 'Телефон', false], ['inn', 'ИНН', false]].map(([k, l, req]) => (
            <div key={k as string}>
              <label className="label">{l as string}</label>
              <input className="input" value={(form as any)[k as string]} onChange={e => setForm(p => ({ ...p, [k as string]: e.target.value }))} required={req as boolean} />
            </div>
          ))}
          <div>
            <label className="label">Заметки</label>
            <textarea className="input resize-none" rows={3} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? 'Сохранение...' : 'Сохранить'}</button>
            <button type="button" onClick={onClose} className="btn-secondary">Отмена</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; client?: Client }>({ open: false });

  const load = () => { setLoading(true); api.get('/clients', { params: { search: search || undefined } }).then(r => setClients(r.data)).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, [search]);

  return (
    <div className="p-6">
      <PageHeader title="Клиенты" subtitle={`${clients.length} контрагентов`}
        action={<button className="btn-primary" onClick={() => setModal({ open: true })}>+ Добавить</button>} />

      <div className="mb-4">
        <input className="input max-w-xs" placeholder="Поиск по имени, компании, email..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card overflow-hidden">
        {loading ? <div className="flex justify-center py-12"><Spinner /></div> : clients.length === 0 ? <EmptyState icon="◎" text="Клиенты не найдены" /> : (
          <table className="w-full text-sm">
            <thead className="bg-ink-50 border-b border-ink-100">
              <tr>{['Название', 'Компания', 'Email', 'Телефон', 'Обращений', 'Создан'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-medium text-ink-500 uppercase tracking-wide">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {clients.map(c => (
                <tr key={c.id} className="hover:bg-ink-50 transition cursor-pointer" onClick={() => setModal({ open: true, client: c })}>
                  <td className="px-4 py-3 font-medium text-ink-800">
                    <Link to={`/clients/${c.id}`} onClick={e => e.stopPropagation()} className="hover:text-accent">{c.name}</Link>
                  </td>
                  <td className="px-4 py-3 text-ink-500">{c.company || '—'}</td>
                  <td className="px-4 py-3 text-ink-500">{c.email || '—'}</td>
                  <td className="px-4 py-3 text-ink-500">{c.phone || '—'}</td>
                  <td className="px-4 py-3"><span className="badge bg-blue-100 text-blue-700">{c._count?.tickets || 0}</span></td>
                  <td className="px-4 py-3 text-ink-400">{format(new Date(c.createdAt), 'dd.MM.yyyy')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal.open && <ClientModal client={modal.client} onClose={() => setModal({ open: false })} onSave={() => { setModal({ open: false }); load(); }} />}
    </div>
  );
}
