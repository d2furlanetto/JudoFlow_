import React, { useState, useEffect } from 'react';
import { useAuth } from '../firebase/AuthContext';
import { db } from '../firebase/config';
import { collection, addDoc, doc, getDoc, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Calendar, CreditCard, ChevronRight, Plus, Users, Clock, MapPin, Shield, X, Save, Award, Trophy } from 'lucide-react';
import { format, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dojo, ClassSession, Notification } from '../types';
import { PermissionErrorGuide } from '../components/PermissionErrorGuide';

export const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const [dojo, setDojo] = useState<Dojo | null>(null);
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [permissionError, setPermissionError] = useState(false);

  // Real data state
  const [totalStudents, setTotalStudents] = useState(0);
  const [todayClassesCount, setTodayClassesCount] = useState(0);
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [nextClassesList, setNextClassesList] = useState<ClassSession[]>([]);
  const [notificationsList, setNotificationsList] = useState<Notification[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // Form state
  const [className, setClassName] = useState('');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1]); // Default Monday
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('19:00');
  const [maxStudents, setMaxStudents] = useState<number | ''>(20);
  const [minAge, setMinAge] = useState<number | ''>(5);
  const [maxAge, setMaxAge] = useState<number | ''>(12);
  const [isAgeFree, setIsAgeFree] = useState(false);
  const [tuition, setTuition] = useState<number | ''>(150);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!db || !profile?.dojoId) return;
      setLoadingStats(true);
      try {
        // 1. Fetch Dojo
        const dojoSnap = await getDoc(doc(db, 'dojos', profile.dojoId));
        if (dojoSnap.exists()) {
          setDojo(dojoSnap.data() as Dojo);
        }

        // 2. Fetch Total Students
        const studentsQuery = query(
          collection(db, 'users'),
          where('dojoId', '==', profile.dojoId),
          where('role', '==', 'student')
        );
        const studentsSnap = await getDocs(studentsQuery);
        setTotalStudents(studentsSnap.size);

        // 3. Fetch Today's Classes
        const today = getDay(new Date()); // 0-6
        const classesQuery = query(
          collection(db, 'classes'),
          where('dojoId', '==', profile.dojoId),
          where('daysOfWeek', 'array-contains', today)
        );
        const classesSnap = await getDocs(classesQuery);
        setTodayClassesCount(classesSnap.size);

        // 4. Fetch Next Classes (Sample some classes)
        const nextClassesQuery = query(
          collection(db, 'classes'),
          where('dojoId', '==', profile.dojoId),
          limit(3)
        );
        const nextClassesSnap = await getDocs(nextClassesQuery);
        setNextClassesList(nextClassesSnap.docs.map(d => ({ id: d.id, ...d.data() } as ClassSession)));

        // 5. Fetch Notifications (With fallback for missing index)
        try {
          const notificationsQuery = query(
            collection(db, 'notifications'),
            where('userId', '==', profile.uid),
            orderBy('createdAt', 'desc'),
            limit(5)
          );
          const notificationsSnap = await getDocs(notificationsQuery);
          setNotificationsList(notificationsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Notification)));
        } catch (indexError: any) {
          // If index is missing, fallback to unordered query to avoid crash
          if (indexError.code === 'failed-precondition') {
            console.warn("Firestore index missing for notifications. Falling back to unordered fetch.");
            const fallbackQuery = query(
              collection(db, 'notifications'),
              where('userId', '==', profile.uid),
              limit(5)
            );
            const fallbackSnap = await getDocs(fallbackQuery);
            setNotificationsList(fallbackSnap.docs.map(d => ({ id: d.id, ...d.data() } as Notification)));
          } else {
            throw indexError;
          }
        }

        // 6. Fetch Attendance Count (for students)
        if (profile.role === 'student') {
          const attendanceQuery = query(
            collection(db, 'attendance'),
            where('presentStudents', 'array-contains', profile.uid)
          );
          const attendanceSnap = await getDocs(attendanceQuery);
          setAttendanceCount(attendanceSnap.size);
        }

      } catch (error: any) {
        console.error("Error fetching dashboard data:", error);
        if (error.code === 'permission-denied') {
          setPermissionError(true);
        }
      } finally {
        setLoadingStats(false);
      }
    };
    fetchDashboardData();
  }, [profile]);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !profile) return;

    setIsCreating(true);
    try {
      await addDoc(collection(db, 'classes'), {
        name: className,
        dojoId: profile.dojoId || 'main-dojo',
        professorId: profile.uid,
        startTime,
        endTime,
        daysOfWeek: daysOfWeek,
        maxStudents: maxStudents === '' ? 0 : maxStudents,
        minAge: isAgeFree ? undefined : (minAge === '' ? undefined : minAge),
        maxAge: isAgeFree ? undefined : (maxAge === '' ? undefined : maxAge),
        ageRange: isAgeFree ? 'Livre' : `${minAge}-${maxAge}`,
        tuitionValue: tuition === '' ? 0 : tuition,
        students: [],
        createdAt: new Date().toISOString()
      });
      
      setShowCreateClass(false);
      setClassName('');
      setDaysOfWeek([1]);
      // Reset other fields if needed
    } catch (error: any) {
      console.error("Error creating class:", error);
      if (error.code === 'permission-denied') {
        setPermissionError(true);
      } else {
        alert("Erro ao criar turma. Verifique suas permissões.");
      }
    } finally {
      setIsCreating(false);
    }
  };

  const nextClasses = [
    { id: '1', name: 'Judô Infantil', time: '18:00', date: new Date() },
    { id: '2', name: 'Judô Adulto', time: '19:30', date: new Date() },
  ];

  const notifications = [
    { id: '1', title: 'Exame de Faixa', message: 'Inscrições abertas para o próximo exame.', type: 'exam' },
    { id: '2', title: 'Mensalidade', message: 'Sua mensalidade vence em 3 dias.', type: 'billing' },
  ];

  if (permissionError) {
    return <PermissionErrorGuide errorSource="Dashboard / Dojo" />;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <section className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-stone-900">Olá, {profile?.displayName?.split(' ')[0]}!</h2>
          <p className="text-stone-500 text-sm">
            {profile?.role === 'professor' ? `Sensei no ${dojo?.name || 'Dojo'}` : 'Pronto para o treino de hoje?'}
          </p>
        </div>
        {profile?.role === 'professor' && (
          <button 
            onClick={() => setShowCreateClass(true)}
            className="bg-stone-900 text-white p-3 rounded-2xl shadow-lg shadow-stone-200 active:scale-95 transition-transform"
          >
            <Plus size={24} />
          </button>
        )}
      </section>

      {/* Professor Quick Actions */}
      {profile?.role === 'professor' && (
        <AnimatePresence>
          {showCreateClass && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white p-6 rounded-3xl border border-stone-100 shadow-xl space-y-4"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-stone-900 flex items-center gap-2">
                  <Shield size={18} className="text-blue-600" />
                  Nova Turma
                </h3>
                <button onClick={() => setShowCreateClass(false)} className="text-stone-400">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateClass} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Nome do Dojo</label>
                  <div className="flex items-center gap-2 bg-stone-50 p-3 rounded-xl text-stone-500 text-sm border border-stone-100">
                    <MapPin size={16} />
                    {dojo?.name || 'Dojo Central'}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Nome da Turma</label>
                    <input 
                      required
                      value={className}
                      onChange={(e) => setClassName(e.target.value)}
                      placeholder="Ex: Judô Kids"
                      className="w-full bg-stone-50 p-3 rounded-xl text-sm border border-stone-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Dias da Semana</label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { val: 1, label: 'Seg' },
                        { val: 2, label: 'Ter' },
                        { val: 3, label: 'Qua' },
                        { val: 4, label: 'Qui' },
                        { val: 5, label: 'Sex' },
                        { val: 6, label: 'Sáb' },
                        { val: 0, label: 'Dom' },
                      ].map((day) => (
                        <button
                          key={day.val}
                          type="button"
                          onClick={() => {
                            setDaysOfWeek(prev => 
                              prev.includes(day.val) 
                                ? prev.filter(d => d !== day.val) 
                                : [...prev, day.val].sort()
                            );
                          }}
                          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                            daysOfWeek.includes(day.val)
                              ? 'bg-stone-900 text-white border-stone-900'
                              : 'bg-stone-50 text-stone-500 border-stone-100'
                          }`}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Início</label>
                    <input 
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full bg-stone-50 p-3 rounded-xl text-sm border border-stone-100 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Término</label>
                    <input 
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full bg-stone-50 p-3 rounded-xl text-sm border border-stone-100 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Faixa Etária</label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={isAgeFree}
                          onChange={(e) => setIsAgeFree(e.target.checked)}
                          className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                        />
                        <span className="text-sm text-stone-600 font-medium">Livre / Sem limite</span>
                      </label>
                    </div>
                    
                    {!isAgeFree && (
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-stone-400 uppercase">Idade Mínima</span>
                          <input 
                            type="number"
                            value={minAge}
                            onChange={(e) => setMinAge(e.target.value === '' ? '' : parseInt(e.target.value))}
                            placeholder="Mín"
                            className="w-full bg-stone-50 p-3 rounded-xl text-sm border border-stone-100 focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-stone-400 uppercase">Idade Máxima</span>
                          <input 
                            type="number"
                            value={maxAge}
                            onChange={(e) => setMaxAge(e.target.value === '' ? '' : parseInt(e.target.value))}
                            placeholder="Máx"
                            className="w-full bg-stone-50 p-3 rounded-xl text-sm border border-stone-100 focus:outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Limite Alunos</label>
                    <input 
                      type="number"
                      value={maxStudents}
                      onChange={(e) => setMaxStudents(e.target.value === '' ? '' : parseInt(e.target.value))}
                      className="w-full bg-stone-50 p-3 rounded-xl text-sm border border-stone-100 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Mensalidade (R$)</label>
                    <input 
                      type="number"
                      value={tuition}
                      onChange={(e) => setTuition(e.target.value === '' ? '' : parseInt(e.target.value))}
                      className="w-full bg-stone-50 p-3 rounded-xl text-sm border border-stone-100 focus:outline-none"
                    />
                  </div>
                </div>

                <button 
                  disabled={isCreating}
                  className="w-full bg-stone-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-stone-200 disabled:opacity-50"
                >
                  {isCreating ? 'Criando...' : <><Save size={18} /> Salvar Turma</>}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Tuition Status Card (Only for students) */}
      {profile?.role === 'student' && (
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
      )}

      {/* Professor Stats */}
      {profile?.role === 'professor' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <Users size={16} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Total Alunos</span>
            </div>
            <p className="text-2xl font-bold text-blue-900">{loadingStats ? '...' : totalStudents}</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
            <div className="flex items-center gap-2 text-orange-600 mb-1">
              <Clock size={16} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Aulas Hoje</span>
            </div>
            <p className="text-2xl font-bold text-orange-900">{loadingStats ? '...' : todayClassesCount}</p>
          </div>
        </div>
      )}

      {/* Student Stats */}
      {profile?.role === 'student' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <Award size={16} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Presenças</span>
            </div>
            <p className="text-2xl font-bold text-blue-900">{loadingStats ? '...' : attendanceCount}</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
            <div className="flex items-center gap-2 text-orange-600 mb-1">
              <Trophy size={16} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Pontos</span>
            </div>
            <p className="text-2xl font-bold text-orange-900">{loadingStats ? '...' : attendanceCount}</p>
          </div>
        </div>
      )}

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
          {loadingStats ? (
            <div className="py-4 text-center text-stone-400 text-xs">Carregando aulas...</div>
          ) : nextClassesList.length === 0 ? (
            <div className="py-4 text-center text-stone-400 text-xs italic">Nenhuma aula agendada.</div>
          ) : (
            nextClassesList.map((c) => (
              <div key={c.id} className="bg-white p-4 rounded-2xl border border-stone-100 flex items-center justify-between shadow-sm">
                <div>
                  <p className="font-bold text-stone-900">{c.name}</p>
                  <p className="text-xs text-stone-500">
                    {c.startTime} - {c.endTime}
                  </p>
                </div>
                <button className="bg-stone-100 text-stone-900 px-4 py-2 rounded-xl text-xs font-bold">
                  Detalhes
                </button>
              </div>
            ))
          )}
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
          {loadingStats ? (
            <div className="py-4 text-center text-stone-400 text-xs">Carregando notificações...</div>
          ) : notificationsList.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl border border-stone-100 text-center">
              <Bell size={24} className="mx-auto text-stone-200 mb-2" />
              <p className="text-stone-400 text-xs italic">Nenhuma notificação nova.</p>
            </div>
          ) : (
            notificationsList.map((n) => (
              <div key={n.id} className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm flex gap-3">
                <div className={`w-1 h-full rounded-full ${n.type === 'billing' ? 'bg-red-400' : 'bg-blue-400'}`} />
                <div>
                  <p className="font-bold text-sm text-stone-900">{n.title}</p>
                  <p className="text-xs text-stone-500 mt-0.5">{n.message}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};
