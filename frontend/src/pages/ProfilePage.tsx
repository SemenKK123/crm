import React, { useState } from 'react';
import api from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { PageHeader } from '../components/ui';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const roleLabel: Record<string, string> = { ADMIN: 'Администратор', MANAGER: 'Менеджер', SPECIALIST: 'Специалист', HEAD: 'Руководитель' };
const rolePerms: Record<string, string[]> = {
  ADMIN: ['Управление пользователями', 'Настройка категорий', 'Все обращения', 'Все клиенты', 'Отчёты'],
  HEAD: ['Просмотр всех обращений', 'Настройка категорий', 'Отчёты', 'Все клиенты'],
  MANAGER: ['Создание обращений', 'Назначение специалистов', 'Все клиенты', 'Отчёты'],
  SPECIALIST: ['Просмотр назначенных обращений', 'Комментирование', 'Смена статуса'],
};

export default function ProfilePage() {
  const { user } = useAuth();
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [saving, setSaving] = useState(false);

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.next !== pw.confirm) { toast.error('Пароли не совпадают'); return; }
    if (pw.next.length < 6) { toast.error('Минимум 6 символов'); return; }
    setSaving(true);
    try {
      await api.put('/auth/change-password', { currentPassword: pw.current, newPassword: pw.next });
      toast.success('Пароль изменён');
      setPw({ current: '', next: '', confirm: '' });
    } catch (err: any) { toast.error(err.response?.data?.error || 'Ошибка'); }
    finally { setSaving(false); }
  };

  if (!user) return null;

  return (
    <div className="p-6">
      <PageHeader title="Профиль" subtitle="Управление учётной записью" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center text-white text-xl font-bold">{user.name[0]}</div>
              <div>
                <div className="font-semibold text-lg text-ink-900">{user.name}</div>
                <div className="text-sm text-ink-400">{user.email}</div>
              </div>
            </div>
            <div className="space-y-3">
              {[['Роль', roleLabel[user.role]], ['Email', user.email], ['Аккаунт с', format(new Date(user.createdAt), 'dd.MM.yyyy')]].map(([l, v]) => (
                <div key={l} className="flex items-center justify-between py-2 border-b border-ink-50">
                  <span className="text-xs text-ink-400 uppercase tracking-wide">{l}</span>
                  <span className="text-sm font-medium text-ink-700">{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-medium text-sm mb-3">Права доступа</h3>
            <ul className="space-y-1.5">
              {(rolePerms[user.role] || []).map(p => (
                <li key={p} className="flex items-center gap-2 text-sm text-ink-700">
                  <span className="text-green-500 text-xs">✓</span> {p}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-medium text-sm mb-4">Сменить пароль</h3>
          <form onSubmit={changePassword} className="space-y-3">
            {[['current', 'Текущий пароль'], ['next', 'Новый пароль'], ['confirm', 'Повторите пароль']].map(([k, l]) => (
              <div key={k}>
                <label className="label">{l}</label>
                <input className="input" type="password" value={(pw as any)[k]} onChange={e => setPw(p => ({ ...p, [k]: e.target.value }))} required />
              </div>
            ))}
            <button type="submit" disabled={saving} className="btn-primary w-full mt-2">{saving ? 'Сохранение...' : 'Изменить пароль'}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
