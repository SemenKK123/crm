import React from 'react';
import { Priority, TicketStatus } from '../types';

const priorityConfig: Record<Priority, { label: string; cls: string }> = {
  LOW: { label: 'Низкий', cls: 'bg-ink-100 text-ink-600' },
  MEDIUM: { label: 'Средний', cls: 'bg-blue-100 text-blue-700' },
  HIGH: { label: 'Высокий', cls: 'bg-orange-100 text-orange-700' },
  CRITICAL: { label: 'Критический', cls: 'bg-red-100 text-red-700' },
};

const statusConfig: Record<TicketStatus, { label: string; cls: string }> = {
  NEW: { label: 'Новое', cls: 'bg-blue-100 text-blue-700' },
  IN_PROGRESS: { label: 'В работе', cls: 'bg-yellow-100 text-yellow-700' },
  PENDING: { label: 'Ожидание', cls: 'bg-purple-100 text-purple-700' },
  RESOLVED: { label: 'Решено', cls: 'bg-green-100 text-green-700' },
  CLOSED: { label: 'Закрыто', cls: 'bg-ink-100 text-ink-500' },
};

export function PriorityBadge({ p }: { p: Priority }) {
  const { label, cls } = priorityConfig[p];
  return <span className={`badge ${cls}`}>{label}</span>;
}

export function StatusBadge({ s }: { s: TicketStatus }) {
  const { label, cls } = statusConfig[s];
  return <span className={`badge ${cls}`}>{label}</span>;
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">{title}</h1>
        {subtitle && <p className="text-sm text-ink-400 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Spinner() {
  return <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />;
}

export function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-ink-400">
      <span className="text-4xl mb-3">{icon}</span>
      <p className="text-sm">{text}</p>
    </div>
  );
}

export function SlaIndicator({ deadline }: { deadline?: string }) {
  if (!deadline) return null;
  const diff = new Date(deadline).getTime() - Date.now();
  const hours = Math.round(diff / 3600000);
  const overdue = diff < 0;
  const soon = !overdue && hours < 4;
  return (
    <span className={`badge text-xs ${overdue ? 'bg-red-100 text-red-700' : soon ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
      {overdue ? `Просрочено ${Math.abs(hours)}ч` : `SLA ${hours}ч`}
    </span>
  );
}

export const STATUSES: TicketStatus[] = ['NEW', 'IN_PROGRESS', 'PENDING', 'RESOLVED', 'CLOSED'];
export const PRIORITIES: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
export const statusLabels = Object.fromEntries(STATUSES.map(s => [s, statusConfig[s].label]));
export const priorityLabels = Object.fromEntries(PRIORITIES.map(p => [p, priorityConfig[p].label]));
