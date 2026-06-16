import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const nav = [
  { to: '/', label: 'Дашборд', icon: '⊡' },
  { to: '/clients', label: 'Клиенты', icon: '◎' },
  { to: '/tickets', label: 'Обращения', icon: '◈' },
  { to: '/reports', label: 'Отчёты', icon: '◧' },
  { to: '/categories', label: 'Категории', icon: '◫', roles: ['ADMIN', 'HEAD'] },
  { to: '/users', label: 'Пользователи', icon: '◉', roles: ['ADMIN'] },
];

const roleLabel: Record<string, string> = { ADMIN: 'Администратор', MANAGER: 'Менеджер', SPECIALIST: 'Специалист', HEAD: 'Руководитель' };

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className={`${collapsed ? 'w-16' : 'w-56'} transition-all duration-200 bg-ink-900 flex flex-col shrink-0`}>
        <div className="h-14 flex items-center justify-between px-4 border-b border-ink-700">
          {!collapsed && <span className="text-white font-semibold text-sm tracking-wide">SME CRM</span>}
          <button onClick={() => setCollapsed(p => !p)} className="text-ink-400 hover:text-white transition ml-auto">
            {collapsed ? '›' : '‹'}
          </button>
        </div>
        <nav className="flex-1 py-4 space-y-0.5 px-2">
          {nav.filter(n => !n.roles || n.roles.includes(user?.role || '')).map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${isActive ? 'bg-accent text-white font-medium' : 'text-ink-300 hover:text-white hover:bg-ink-700'}`
              }
            >
              <span className="text-base shrink-0">{n.icon}</span>
              {!collapsed && <span>{n.label}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-ink-700">
          <NavLink to="/profile" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-all ${isActive ? 'bg-accent text-white' : 'text-ink-400 hover:text-white hover:bg-ink-700'}`}>
            <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-white font-bold text-xs shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <div className="text-white text-xs font-medium truncate">{user?.name}</div>
                <div className="text-ink-400 text-xs">{roleLabel[user?.role || '']}</div>
              </div>
            )}
          </NavLink>
          <button onClick={handleLogout} className={`mt-1 flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-ink-400 hover:text-white hover:bg-ink-700 transition-all w-full`}>
            <span className="shrink-0">⏻</span>
            {!collapsed && <span>Выйти</span>}
          </button>
        </div>
      </aside>
      {/* Main */}
      <main className="flex-1 overflow-auto bg-ink-50">
        {children}
      </main>
    </div>
  );
}
