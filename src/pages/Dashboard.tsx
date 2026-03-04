import React from 'react';
import { useAuth } from '../firebase/AuthContext';
import { motion } from 'motion/react';
import { Bell, Calendar, CreditCard, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const Dashboard: React.FC = () => {
  const { profile } = useAuth();

  const nextClasses = [
    { id: '1', name: 'Judô Infantil', time: '18:00', date: new Date() },
    { id: '2', name: 'Judô Adulto', time: '19:30', date: new Date() },
  ];

  const notifications = [
    { id: '1', title: 'Exame de Faixa', message: 'Inscrições abertas para o próximo exame.', type: 'exam' },
    { id: '2', title: 'Mensalidade', message: 'Sua mensalidade vence em 3 dias.', type: 'billing' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <section>
        <h2 className="text-2xl font-bold text-stone-900">Olá, {profile?.displayName?.split(' ')[0]}!</h2>
        <p className="text-stone-500 text-sm">Pronto para o treino de hoje?</p>
      </section>

      {/* Tuition Status Card */}
      <motion.div 
        whileTap={{ scale: 0.98 }}
        className={`p-4 rounded-2xl border flex items-center justify-between ${
          profile?.tuitionStatus === 'up-to-date' 
            ? 'bg-green-50 border-green-100 text-green-800' 
            : 'bg-red-50 border-red-100 text-red-800'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${profile?.tuitionStatus === 'up-to-date' ? 'bg-green-100' : 'bg-red-100'}`}>
            <CreditCard size={20} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider opacity-70">Mensalidade</p>
            <p className="font-semibold">{profile?.tuitionStatus === 'up-to-date' ? 'Em dia' : 'Atrasada'}</p>
          </div>
        </div>
        <ChevronRight size={20} className="opacity-50" />
      </motion.div>

      {/* Next Classes */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-stone-900 flex items-center gap-2">
            <Calendar size={18} className="text-blue-600" />
            Próximas Aulas
          </h3>
          <button className="text-xs font-semibold text-blue-600">Ver todas</button>
        </div>
        <div className="space-y-3">
          {nextClasses.map((c) => (
            <div key={c.id} className="bg-white p-4 rounded-2xl border border-stone-100 flex items-center justify-between shadow-sm">
              <div>
                <p className="font-bold text-stone-900">{c.name}</p>
                <p className="text-xs text-stone-500">
                  {format(c.date, "EEEE", { locale: ptBR })} • {c.time}
                </p>
              </div>
              <button className="bg-stone-100 text-stone-900 px-4 py-2 rounded-xl text-xs font-bold">
                Detalhes
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Notifications */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-stone-900 flex items-center gap-2">
            <Bell size={18} className="text-orange-500" />
            Notificações
          </h3>
        </div>
        <div className="space-y-3">
          {notifications.map((n) => (
            <div key={n.id} className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm flex gap-3">
              <div className={`w-1 h-full rounded-full ${n.type === 'billing' ? 'bg-red-400' : 'bg-blue-400'}`} />
              <div>
                <p className="font-bold text-sm text-stone-900">{n.title}</p>
                <p className="text-xs text-stone-500 mt-0.5">{n.message}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
