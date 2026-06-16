import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { User, Role } from '../types';
import { PageHeader, EmptyState, Spinner } from '../components/ui';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useAuth } from '../hooks/useAuth';

const roles: Role[] = ['ADMIN', 'MANAGER', 'SPECIALIST', 'HEAD'];
const roleLabel: Record<Role, string> = { ADMIN: 'Администратор', MANAGER: 'Менеджер', SPECIALIST: 'Специалист', HEAD: 'Руководитель' };
const roleCls: Record<Role, string> = { ADMIN: 'bg-red-100 text-red-700', MANAGER: 'bg-blue-100 text-blue-700', SPECIALIST: 'bg-green-100 text-green-700', HEAD: 'bg-purple-100 text-purple-700' };

function UserModal({ user, onClose, onSave }: { user?: User; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', password: '', role: user?.role || 'SPECIALIST' as Role });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (user) await api.put(`/users/${user.id}`, { name: form.name, role: form.role });
      else await api.post('/users', form);
      toast.success(user ? 'Пользователь обновлён' : 'Пользователь создан');
      onSave();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Ошибка'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-md">
        <div className="p-5 border-b border-ink-100 flex items-center justify-between">
          <h2 className="font-semibold">{user ? 'Редактировать' : 'Новый пользователь'}</h2>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700">✕</button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-3">
          <div><label className="label">Имя *</label><input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required /></div>
          {!user && <div><label className="label">Email *</label><input className="input" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required /></div>}
          {!user && <div><label className="label">Пароль *</label><input className="input" type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required minLength={6} /></div>}
          <div><label className="label">Роль</label>
            <select className="select" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value as Role }))}>
              {roles.map(r => <option key={r} value={r}>{roleLabel[r]}</option>)}
            </select>
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

export default function UsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; user?: User }>({ open: false });

  if (me?.role !== 'ADMIN') return <div className="p-6 text-ink-400">Доступ запрещён</div>;

  const load = () => { setLoading(true); api.get('/users').then(r => setUsers(r.data)).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const toggle = async (u: User) => {
    await api.put(`/users/${u.id}`, { ...u, isActive: !u.isActive });
    toast.success(u.isActive ? 'Пользователь заблокирован' : 'Пользователь активирован');
    load();
  };

  return (
    <div className="p-6">
      <PageHeader title="Пользователи" subtitle={`${users.length} учётных записей`}
        action={<button className="btn-primary" onClick={() => setModal({ open: true })}>+ Добавить</button>} />
      <div className="card overflow-hidden">
        {loading ? <div className="flex justify-center py-12"><Spinner /></div> : users.length === 0 ? <EmptyState icon="◉" text="Нет пользователей" /> : (
          <table className="w-full text-sm">
            <thead className="bg-ink-50 border-b border-ink-100">
              <tr>{['Имя', 'Email', 'Роль', 'Статус', 'Создан', 'Действия'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-medium text-ink-500 uppercase tracking-wide">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {users.map(u => (
                <tr key={u.id} className={`hover:bg-ink-50 transition ${!u.isActive ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3 font-medium text-ink-800">{u.name}</td>
                  <td className="px-4 py-3 text-ink-500 font-mono text-xs">{u.email}</td>
                  <td className="px-4 py-3"><span className={`badge ${roleCls[u.role]}`}>{roleLabel[u.role]}</span></td>
                  <td className="px-4 py-3"><span className={`badge ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-ink-100 text-ink-500'}`}>{u.isActive ? 'Активен' : 'Заблокирован'}</span></td>
                  <td className="px-4 py-3 text-ink-400 text-xs">{format(new Date(u.createdAt), 'dd.MM.yyyy')}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button className="btn-ghost text-xs py-1 px-2" onClick={() => setModal({ open: true, user: u })}>Изменить</button>
                      {u.id !== me?.id && <button className={`text-xs py-1 px-2 btn-ghost ${u.isActive ? 'text-red-500 hover:text-red-700' : 'text-green-600 hover:text-green-700'}`} onClick={() => toggle(u)}>{u.isActive ? 'Блок.' : 'Акт.'}</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {modal.open && <UserModal user={modal.user} onClose={() => setModal({ open: false })} onSave={() => { setModal({ open: false }); load(); }} />}
    </div>
  );
}
