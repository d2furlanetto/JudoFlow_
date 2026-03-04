import React from 'react';
import { useAuth } from '../firebase/AuthContext';
import { auth } from '../firebase/config';
import { signOut } from 'firebase/auth';
import { motion } from 'motion/react';
import { Settings, LogOut, User, MapPin, Phone, Mail, Award, CheckCircle2 } from 'lucide-react';

export const Profile: React.FC = () => {
  const { profile } = useAuth();

  const handleLogout = () => signOut(auth);

  const beltProgress = [
    { rank: 'Branca', completed: true },
    { rank: 'Cinza', completed: true },
    { rank: 'Azul', completed: false },
    { rank: 'Amarela', completed: false },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <h2 className="text-2xl font-bold text-stone-900">Perfil</h2>
        <button className="p-2 bg-white rounded-xl border border-stone-100 text-stone-500">
          <Settings size={20} />
        </button>
      </div>

      {/* Profile Card */}
      <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm text-center">
        <div className="w-24 h-24 bg-stone-100 rounded-full mx-auto mb-4 flex items-center justify-center text-stone-400 overflow-hidden border-4 border-stone-50">
          <User size={48} />
        </div>
        <h3 className="text-xl font-bold text-stone-900">{profile?.displayName}</h3>
        <p className="text-blue-600 font-bold text-sm uppercase tracking-widest mt-1">Faixa {profile?.belt}</p>
        
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-stone-50 p-3 rounded-2xl">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Presenças</p>
            <p className="text-lg font-bold text-stone-900">24</p>
          </div>
          <div className="bg-stone-50 p-3 rounded-2xl">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Pontos</p>
            <p className="text-lg font-bold text-stone-900">150</p>
          </div>
        </div>
      </div>

      {/* Info List */}
      <div className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-50 flex items-center gap-3">
          <Mail size={18} className="text-stone-400" />
          <div className="flex-1">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">E-mail</p>
            <p className="text-sm font-medium text-stone-900">{profile?.email}</p>
          </div>
        </div>
        <div className="p-4 border-b border-stone-50 flex items-center gap-3">
          <Phone size={18} className="text-stone-400" />
          <div className="flex-1">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Telefone</p>
            <p className="text-sm font-medium text-stone-900">{profile?.phone || 'Não informado'}</p>
          </div>
        </div>
        <div className="p-4 flex items-center gap-3">
          <MapPin size={18} className="text-stone-400" />
          <div className="flex-1">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Dojo</p>
            <p className="text-sm font-medium text-stone-900">Dojo Central</p>
          </div>
        </div>
      </div>

      {/* Belt Progress */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-stone-900 flex items-center gap-2">
            <Award size={18} className="text-blue-600" />
            Caminho Suave
          </h3>
          <button className="text-xs font-semibold text-blue-600">Ver Checklist</button>
        </div>
        <div className="bg-white p-4 rounded-3xl border border-stone-100 shadow-sm space-y-4">
          {beltProgress.map((b, i) => (
            <div key={b.rank} className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${b.completed ? 'bg-green-100 text-green-600' : 'bg-stone-100 text-stone-300'}`}>
                <CheckCircle2 size={16} />
              </div>
              <p className={`text-sm font-bold ${b.completed ? 'text-stone-900' : 'text-stone-400'}`}>
                Faixa {b.rank}
              </p>
              {i === 2 && <span className="ml-auto text-[10px] font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full uppercase">Atual</span>}
            </div>
          ))}
        </div>
      </section>

      {/* Support Link */}
      <div className="bg-blue-600 text-white p-6 rounded-3xl shadow-lg shadow-blue-200 flex items-center justify-between">
        <div>
          <p className="font-bold text-lg">Precisa de ajuda?</p>
          <p className="text-blue-100 text-xs">Fale com o suporte do Dojo</p>
        </div>
        <button className="bg-white text-blue-600 px-4 py-2 rounded-xl text-xs font-bold">
          Contato
        </button>
      </div>

      <button 
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 text-red-500 font-bold py-4 rounded-2xl border border-red-100 bg-red-50/50 hover:bg-red-50 transition-colors"
      >
        <LogOut size={20} /> Sair da Conta
      </button>
    </div>
  );
};
