import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { PageHeader, Spinner } from '../components/ui';
import { format } from 'date-fns';

interface ReportData {
  summary: { total: number; resolved: number; slaCompliance: number };
  byStatus: { status: string; _count: { _all: number } }[];
  byPriority: { priority: string; _count: { _all: number } }[];
  byCategory: { category: string; _count: { _all: number } }[];
  tickets: { id: number; title: string; status: string; priority: string; category: string; createdAt: string; client: { name: string; company?: string }; assignee?: { name: string }; creator: { name: string } }[];
}

const statusLabel: Record<string, string> = { NEW: 'Новые', IN_PROGRESS: 'В работе', PENDING: 'Ожидание', RESOLVED: 'Решено', CLOSED: 'Закрыто' };
const priorityLabel: Record<string, string> = { LOW: 'Низкий', MEDIUM: 'Средний', HIGH: 'Высокий', CRITICAL: 'Критический' };

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/reports', { params: { from: from || undefined, to: to || undefined } }).then(r => setData(r.data)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const exportCsv = () => {
    if (!data) return;
    const rows = [['ID', 'Тема', 'Клиент', 'Статус', 'Приоритет', 'Категория', 'Ответственный', 'Дата'].join(','),
      ...data.tickets.map(t => [t.id, `"${t.title}"`, `"${t.client.name}"`, statusLabel[t.status] || t.status, priorityLabel[t.priority] || t.priority, t.category, t.assignee?.name || '', format(new Date(t.createdAt), 'dd.MM.yyyy')].join(','))
    ];
    const blob = new Blob(['\uFEFF' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `report_${format(new Date(), 'yyyyMMdd')}.csv`;
    a.click();
  };

  return (
    <div className="p-6">
      <PageHeader title="Отчёты" subtitle="Аналитика по обращениям" action={
        <div className="flex gap-2">
          <input type="date" className="input w-36" value={from} onChange={e => setFrom(e.target.value)} />
          <input type="date" className="input w-36" value={to} onChange={e => setTo(e.target.value)} />
          <button className="btn-primary" onClick={load} disabled={loading}>Применить</button>
          <button className="btn-secondary" onClick={exportCsv} disabled={!data}>↓ CSV</button>
        </div>
      } />

      {loading && <div className="flex justify-center py-12"><Spinner /></div>}

      {data && !loading && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Всего обращений', value: data.summary.total, color: 'text-accent' },
              { label: 'Решено', value: data.summary.resolved, color: 'text-green-600' },
              { label: 'SLA соблюдение', value: `${data.summary.slaCompliance}%`, color: data.summary.slaCompliance >= 80 ? 'text-green-600' : 'text-red-500' },
            ].map(s => (
              <div key={s.label} className="card p-5">
                <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-ink-400 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            {[
              { title: 'По статусам', data: data.byStatus, keyF: (d: any) => statusLabel[d.status] || d.status },
              { title: 'По приоритетам', data: data.byPriority, keyF: (d: any) => priorityLabel[d.priority] || d.priority },
              { title: 'По категориям', data: data.byCategory, keyF: (d: any) => d.category },
            ].map(g => (
              <div key={g.title} className="card p-4">
                <h3 className="font-medium text-sm mb-3 border-b border-ink-100 pb-2">{g.title}</h3>
                <div className="space-y-2">
                  {g.data.map((d: any) => {
                    const total = g.data.reduce((a: number, b: any) => a + b._count._all, 0);
                    const pct = total ? Math.round(d._count._all / total * 100) : 0;
                    return (
                      <div key={g.keyF(d)}>
                        <div className="flex justify-between text-xs mb-0.5">
                          <span className="text-ink-600">{g.keyF(d)}</span>
                          <span className="font-medium">{d._count._all}</span>
                        </div>
                        <div className="h-1.5 bg-ink-100 rounded-full"><div className="h-1.5 bg-accent rounded-full" style={{ width: `${pct}%` }} /></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="card overflow-hidden">
            <div className="p-4 border-b border-ink-100"><h3 className="font-medium text-sm">Детализация ({data.tickets.length})</h3></div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-ink-50 border-b border-ink-100">
                  <tr>{['#', 'Тема', 'Клиент', 'Статус', 'Приоритет', 'Категория', 'Ответственный', 'Дата'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-medium text-ink-500 uppercase tracking-wide">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-ink-50">
                  {data.tickets.slice(0, 50).map(t => (
                    <tr key={t.id} className="hover:bg-ink-50">
                      <td className="px-4 py-2 text-ink-400 font-mono text-xs">#{t.id}</td>
                      <td className="px-4 py-2 text-ink-800 max-w-xs truncate">{t.title}</td>
                      <td className="px-4 py-2 text-ink-600">{t.client.name}</td>
                      <td className="px-4 py-2 text-ink-600">{statusLabel[t.status] || t.status}</td>
                      <td className="px-4 py-2 text-ink-600">{priorityLabel[t.priority] || t.priority}</td>
                      <td className="px-4 py-2 text-ink-600">{t.category}</td>
                      <td className="px-4 py-2 text-ink-600">{t.assignee?.name || '—'}</td>
                      <td className="px-4 py-2 text-ink-400 text-xs">{format(new Date(t.createdAt), 'dd.MM.yyyy')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
