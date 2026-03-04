import React from 'react';
import { motion } from 'motion/react';
import { Trophy, MapPin, Calendar, ChevronRight } from 'lucide-react';

export const Championships: React.FC = () => {
  const championships = [
    { id: '1', name: 'Copa Regional de Judô', date: '25 de Abril', location: 'Ginásio Municipal', status: 'open' },
    { id: '2', name: 'Torneio Interno Dojo Central', date: '10 de Maio', location: 'Dojo Central', status: 'open' },
    { id: '3', name: 'Campeonato Estadual', date: '15 de Junho', location: 'Arena Olímpica', status: 'closed' },
  ];

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-bold text-stone-900">Competições</h2>
        <p className="text-stone-500 text-sm">Inscreva-se e acompanhe os resultados</p>
      </section>

      <div className="space-y-4">
        {championships.map((c) => (
          <motion.div 
            key={c.id}
            whileTap={{ scale: 0.98 }}
            className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden"
          >
            <div className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${c.status === 'open' ? 'bg-blue-50 text-blue-600' : 'bg-stone-100 text-stone-400'}`}>
                  <Trophy size={24} />
                </div>
                <div>
                  <p className="font-bold text-stone-900 text-lg">{c.name}</p>
                  <div className="flex items-center gap-3 mt-1 text-stone-500">
                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
                      <Calendar size={12} /> {c.date}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
                      <MapPin size={12} /> {c.location}
                    </div>
                  </div>
                </div>
              </div>
              <ChevronRight size={20} className="text-stone-300" />
            </div>
            
            <div className="bg-stone-50 px-5 py-3 flex justify-between items-center">
              <span className={`text-[10px] font-bold uppercase tracking-widest ${c.status === 'open' ? 'text-green-600' : 'text-stone-400'}`}>
                {c.status === 'open' ? 'Inscrições Abertas' : 'Inscrições Encerradas'}
              </span>
              {c.status === 'open' && (
                <button className="bg-blue-600 text-white px-4 py-1.5 rounded-xl text-xs font-bold">
                  Inscrever-se
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
