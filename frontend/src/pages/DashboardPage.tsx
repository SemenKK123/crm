import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { PageHeader, PriorityBadge, StatusBadge, SlaIndicator, Spinner } from '../components/ui';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

interface DashData {
  total: number;
  byStatus: { status: string; _count: { _all: number } }[];
  byPriority: { priority: string; _count: { _all: number } }[];
  overdue: number;
  recent: { id: number; title: string; status: string; priority: string; slaDeadline?: string; client: { name: string }; assignee?: { name: string }; createdAt: string }[];
  recentAudit: { id: number; action: string; createdAt: string; user?: { name: string } }[];
}

const statusLabel: Record<string, string> = { NEW: 'Новые', IN_PROGRESS: 'В работе', PENDING: 'Ожидание', RESOLVED: 'Решено', CLOSED: 'Закрыто' };

export default function DashboardPage() {
  const [data, setData] = useState<DashData | null>(null);

  useEffect(() => { api.get('/dashboard').then(r => setData(r.data)); }, []);

  if (!data) return <div className="flex items-center justify-center h-64"><Spinner /></div>;

  const active = data.byStatus.filter(s => !['RESOLVED','CLOSED'].includes(s.status)).reduce((a,b) => a + b._count._all, 0);

  return (
    <div className="p-6">
      <PageHeader title="Дашборд" subtitle="Сводная статистика системы" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Всего обращений', value: data.total, color: 'text-accent' },
          { label: 'Активные', value: active, color: 'text-yellow-600' },
          { label: 'Просрочено SLA', value: data.overdue, color: 'text-red-500' },
          { label: 'Решено', value: data.byStatus.find(s => s.status === 'RESOLVED')?._count._all || 0, color: 'text-green-600' },
        ].map(s => (
          <div key={s.label} className="card p-5">
            <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-ink-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <div className="p-4 border-b border-ink-100">
            <h3 className="font-medium text-sm text-ink-700">Последние обращения</h3>
          </div>
          <div className="divide-y divide-ink-50">
            {data.recent.length === 0 ? <p className="text-center text-ink-400 text-sm py-8">Нет обращений</p> :
              data.recent.map(t => (
                <Link key={t.id} to={`/tickets/${t.id}`} className="flex items-center gap-3 p-4 hover:bg-ink-50 transition">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-ink-800 truncate">{t.title}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-ink-400">{t.client.name}</span>
                      {t.assignee && <span className="text-xs text-ink-400">→ {t.assignee.name}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <SlaIndicator deadline={t.slaDeadline} />
                    <StatusBadge s={t.status as any} />
                    <PriorityBadge p={t.priority as any} />
                  </div>
                </Link>
              ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-4">
            <h3 className="font-medium text-sm text-ink-700 mb-3">По статусам</h3>
            <div className="space-y-2">
              {data.byStatus.map(s => (
                <div key={s.status} className="flex items-center justify-between text-sm">
                  <span className="text-ink-600">{statusLabel[s.status] || s.status}</span>
                  <span className="font-semibold text-ink-800">{s._count._all}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card p-4">
            <h3 className="font-medium text-sm text-ink-700 mb-3">Последние действия</h3>
            <div className="space-y-2">
              {data.recentAudit.slice(0, 6).map(a => (
                <div key={a.id} className="text-xs">
                  <span className="text-ink-800">{a.user?.name || 'Система'}</span>
                  <span className="text-ink-400 ml-1">{a.action}</span>
                  <div className="text-ink-300">{formatDistanceToNow(new Date(a.createdAt), { locale: ru, addSuffix: true })}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
