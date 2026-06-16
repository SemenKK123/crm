import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch {
      toast.error('Неверный логин или пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-ink-900">
      <div className="hidden lg:flex flex-1 flex-col justify-center px-16 border-r border-ink-700">
        <div className="text-accent font-mono text-xs mb-6 tracking-widest">SME SUPPORT CRM</div>
        <h1 className="text-4xl font-semibold text-white leading-tight mb-4">Управление<br />клиентским<br />сервисом</h1>
        <p className="text-ink-400 text-sm leading-relaxed max-w-sm">Централизованный учёт обращений, контроль SLA и аналитика для отделов поддержки малого и среднего бизнеса.</p>
        <div className="mt-12 grid grid-cols-3 gap-6">
          {[['◈', 'Обращения', 'Полный жизненный цикл тикетов'], ['⊡', 'Аналитика', 'Отчёты и метрики в реальном времени'], ['◉', 'Роли', 'Гибкое разграничение прав']].map(([ic, t, d]) => (
            <div key={t} className="p-4 rounded-xl bg-ink-800 border border-ink-700">
              <div className="text-2xl mb-2 text-accent">{ic}</div>
              <div className="text-white text-sm font-medium">{t}</div>
              <div className="text-ink-400 text-xs mt-1">{d}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden text-accent font-mono text-xs mb-8 tracking-widest">SME SUPPORT CRM</div>
          <h2 className="text-2xl font-semibold text-white mb-2">Вход в систему</h2>
          <p className="text-ink-400 text-sm mb-8">Введите учётные данные для доступа</p>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs text-ink-400 mb-1.5 uppercase tracking-wide">Email</label>
              <input className="w-full px-4 py-3 rounded-lg bg-ink-800 border border-ink-600 text-white text-sm placeholder-ink-500 focus:outline-none focus:border-accent transition" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="user@company.local" required />
            </div>
            <div>
              <label className="block text-xs text-ink-400 mb-1.5 uppercase tracking-wide">Пароль</label>
              <input className="w-full px-4 py-3 rounded-lg bg-ink-800 border border-ink-600 text-white text-sm placeholder-ink-500 focus:outline-none focus:border-accent transition" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 bg-accent hover:bg-accent-dark text-white font-medium rounded-lg text-sm transition-all disabled:opacity-60 mt-2">
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>
          <p className="text-ink-500 text-xs mt-6 text-center">admin@crm.local / admin123</p>
        </div>
      </div>
    </div>
  );
}
