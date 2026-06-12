import React from 'react';
import { useAuthStore } from '../store/authStore';
import { NotificationBell } from './NotificationBell';
import { LogOut, HeartPulse } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/75 backdrop-blur-md px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
        <div className="bg-brand-600 p-1.5 rounded-lg text-white shadow-md shadow-brand-500/10">
          <HeartPulse className="h-5 w-5 animate-pulse-subtle" />
        </div>
        <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-brand-600 to-indigo-400 bg-clip-text text-transparent">
          MediAI
        </span>
      </div>

      <div className="flex items-center gap-6">
        {user ? (
          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{user.name}</p>
              <span className="text-[10px] uppercase font-bold tracking-wider text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/40 px-2 py-0.5 rounded">
                {user.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-500 hover:text-clinical-rose rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Logout"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            Login
          </button>
        )}
      </div>
    </header>
  );
};
