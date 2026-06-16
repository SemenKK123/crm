import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';
import { Client, Ticket } from '../types';
import { StatusBadge, PriorityBadge, Spinner } from '../components/ui';
import { format } from 'date-fns';

export default function ClientDetailPage() {
  const { id } = useParams();
  const [client, setClient] = useState<Client & { tickets: Ticket[] } | null>(null);

  useEffect(() => { api.get(`/clients/${id}`).then(r => setClient(r.data)); }, [id]);
  if (!client) return <div className="flex justify-center py-20"><Spinner /></div>;

  return (
    <div className="p-6">
      <Link to="/clients" className="text-sm text-ink-400 hover:text-accent mb-4 inline-flex items-center gap-1">← Клиенты</Link>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
        <div className="card p-5 space-y-3">
          <h2 className="font-semibold text-lg text-ink-900">{client.name}</h2>
          {[['Компания', client.company], ['Email', client.email], ['Телефон', client.phone], ['ИНН', client.inn]].map(([l, v]) => v ? (
            <div key={l as string}><div className="label">{l as string}</div><div className="text-sm text-ink-700">{v as string}</div></div>
          ) : null)}
          {client.notes && <div><div className="label">Заметки</div><div className="text-sm text-ink-600">{client.notes}</div></div>}
          <div className="text-xs text-ink-400">Добавлен {format(new Date(client.createdAt), 'dd.MM.yyyy')}</div>
        </div>
        <div className="lg:col-span-2 card">
          <div className="p-4 border-b border-ink-100"><h3 className="font-medium text-sm">История обращений ({client.tickets.length})</h3></div>
          <div className="divide-y divide-ink-50">
            {client.tickets.length === 0 ? <p className="text-center text-ink-400 text-sm py-8">Нет обращений</p> :
              client.tickets.map((t: any) => (
                <Link key={t.id} to={`/tickets/${t.id}`} className="flex items-center gap-3 p-4 hover:bg-ink-50 transition">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-ink-800">{t.title}</div>
                    <div className="text-xs text-ink-400 mt-0.5">{t.assignee?.name || 'Не назначено'} · {format(new Date(t.createdAt), 'dd.MM.yyyy')}</div>
                  </div>
                  <div className="flex gap-2"><StatusBadge s={t.status} /><PriorityBadge p={t.priority} /></div>
                </Link>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
