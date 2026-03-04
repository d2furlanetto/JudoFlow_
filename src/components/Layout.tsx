import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Home, Calendar, User, CreditCard, Award, ChevronRight, Shield } from 'lucide-react';
import { useAuth } from '../firebase/AuthContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Layout: React.FC = () => {
  const { profile } = useAuth();

  const navItems = [
    { icon: Home, label: 'Início', path: '/' },
    { icon: Calendar, label: 'Aulas', path: '/classes' },
    { icon: Award, label: 'Competições', path: '/championships' },
    { icon: User, label: 'Perfil', path: '/profile' },
  ];

  if (profile?.role === 'admin' || profile?.role === 'professor') {
    navItems.splice(3, 0, { icon: Shield, label: 'Gestão', path: '/admin' });
  }

  // If professor or admin, maybe add more or change labels
  if (profile?.role === 'admin' || profile?.role === 'professor') {
    navItems.splice(3, 0, { icon: CreditCard, label: 'Financeiro', path: '/finance' });
  } else {
    navItems.splice(3, 0, { icon: CreditCard, label: 'Mensalidade', path: '/finance' });
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col pb-20">
      <header className="bg-white border-b border-stone-200 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-stone-900 tracking-tight">JudoFlow</h1>
            <button className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-1">
              Dojo Central <ChevronRight size={10} />
            </button>
          </div>
          {profile && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium px-2 py-1 bg-stone-100 rounded-full text-stone-600 uppercase tracking-wider">
                {profile.belt}
              </span>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-md mx-auto w-full p-4">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 px-2 py-2 z-20">
        <div className="max-w-md mx-auto flex justify-around items-center">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors",
                  isActive ? "text-blue-600 bg-blue-50" : "text-stone-500 hover:text-stone-900"
                )
              }
            >
              <item.icon size={20} />
              <span className="text-[10px] font-medium uppercase tracking-wide">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};
