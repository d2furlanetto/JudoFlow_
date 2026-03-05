import React, { useState, useEffect } from 'react';
import { useAuth } from '../firebase/AuthContext';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, Users, ChevronLeft, Plus, Save, UserPlus, Shield } from 'lucide-react';
import { ClassSession, UserProfile } from '../types';
import { PermissionErrorGuide } from '../components/PermissionErrorGuide';

export const Classes: React.FC = () => {
  const { profile } = useAuth();
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [unassignedStudents, setUnassignedStudents] = useState<UserProfile[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassSession | null>(null);
  const [selectedClassStudents, setSelectedClassStudents] = useState<UserProfile[]>([]);
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [permissionError, setPermissionError] = useState(false);

  // New class form state
  const [newName, setNewName] = useState('');
  const [newStartTime, setNewStartTime] = useState('18:00');
  const [newEndTime, setNewEndTime] = useState('19:00');
  const [newTuition, setNewTuition] = useState<number | ''>(150);
  const [newDaysOfWeek, setNewDaysOfWeek] = useState<number[]>([1]);
  const [newMaxStudents, setNewMaxStudents] = useState<number | ''>(20);
  const [newMinAge, setNewMinAge] = useState<number | ''>(5);
  const [newMaxAge, setNewMaxAge] = useState<number | ''>(12);
  const [isNewAgeFree, setIsNewAgeFree] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!db || !profile) return;
      setLoading(true);
      setPermissionError(false);
      try {
        const currentDojoId = profile.dojoId || 'main-dojo';
        console.log("Iniciando busca de turmas para o Dojo:", currentDojoId, "Papel do usuário:", profile.role);

        // Fetch classes
        const classesQuery = query(collection(db, 'classes'), where('dojoId', '==', currentDojoId));
        const classesSnap = await getDocs(classesQuery);
        const classesList = classesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassSession));
        setClasses(classesList);
        console.log("Turmas carregadas com sucesso:", classesList.length);

        // Fetch unassigned students ONLY if professor/admin
        if (profile.role === 'professor' || profile.role === 'admin') {
          console.log("Buscando alunos sem turma...");
          const usersQuery = query(collection(db, 'users'), where('role', '==', 'student'), where('dojoId', '==', currentDojoId));
          const usersSnap = await getDocs(usersQuery);
          const allStudents = usersSnap.docs.map(doc => doc.data() as UserProfile);
          
          const assignedStudentIds = new Set(classesList.flatMap(c => c.students));
          const unassigned = allStudents.filter(s => !assignedStudentIds.has(s.uid));
          setUnassignedStudents(unassigned);
          console.log("Alunos sem turma encontrados:", unassigned.length);
        }
      } catch (error: any) {
        console.error("ERRO CRÍTICO NO FIREBASE:", error.code, error.message);
        if (error.code === 'permission-denied') {
          setPermissionError(true);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profile]);

  if (permissionError) {
    return <PermissionErrorGuide errorSource="Aulas / Turmas" />;
  }

  useEffect(() => {
    const fetchClassStudents = async () => {
      if (!db || !selectedClass) return;
      setLoadingStudents(true);
      try {
        const studentsQuery = query(
          collection(db, 'users'),
          where('uid', 'in', selectedClass.students)
        );
        const studentsSnap = await getDocs(studentsQuery);
        const studentsList = studentsSnap.docs.map(doc => doc.data() as UserProfile);
        setSelectedClassStudents(studentsList);
        
        // Initialize attendance state
        const initialAttendance: Record<string, boolean> = {};
        selectedClass.students.forEach(uid => {
          initialAttendance[uid] = true; // Default to present
        });
        setAttendance(initialAttendance);
      } catch (error) {
        console.error("Error fetching class students:", error);
      } finally {
        setLoadingStudents(false);
      }
    };

    if (selectedClass && selectedClass.students.length > 0) {
      fetchClassStudents();
    } else {
      setSelectedClassStudents([]);
    }
  }, [selectedClass]);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !profile) return;
    try {
      const newClass: Omit<ClassSession, 'id'> = {
        name: newName,
        startTime: newStartTime,
        endTime: newEndTime,
        tuitionValue: newTuition === '' ? 0 : newTuition,
        dojoId: profile.dojoId || 'main-dojo',
        professorId: profile.uid,
        students: [],
        daysOfWeek: newDaysOfWeek,
        maxStudents: newMaxStudents === '' ? 0 : newMaxStudents,
        minAge: isNewAgeFree ? undefined : (newMinAge === '' ? undefined : newMinAge),
        maxAge: isNewAgeFree ? undefined : (newMaxAge === '' ? undefined : newMaxAge),
        ageRange: isNewAgeFree ? 'Livre' : `${newMinAge}-${newMaxAge}`,
      };
      const docRef = await addDoc(collection(db, 'classes'), newClass);
      setClasses([...classes, { id: docRef.id, ...newClass }]);
      setIsCreating(false);
      setNewName('');
      setNewDaysOfWeek([1]);
    } catch (error: any) {
      console.error("Error creating class:", error);
      if (error.code === 'permission-denied') {
        setPermissionError(true);
      }
    }
  };

  const enrollStudent = async (classId: string, studentUid: string) => {
    if (!db) return;
    try {
      const classRef = doc(db, 'classes', classId);
      await updateDoc(classRef, {
        students: arrayUnion(studentUid)
      });
      
      // Update local state
      setClasses(classes.map(c => c.id === classId ? { ...c, students: [...c.students, studentUid] } : c));
      setUnassignedStudents(unassignedStudents.filter(s => s.uid !== studentUid));
    } catch (error) {
      console.error("Error enrolling student:", error);
    }
  };

  const toggleAttendance = (studentId: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  const handleFinishAttendance = async () => {
    if (!db || !selectedClass) return;
    try {
      const presentStudents = Object.entries(attendance)
        .filter(([_, present]) => present)
        .map(([uid, _]) => uid);
      
      const absentStudents = selectedClass.students.filter(uid => !attendance[uid]);

      await addDoc(collection(db, 'attendance'), {
        classId: selectedClass.id,
        date: new Date().toISOString().split('T')[0],
        presentStudents,
        absentStudents,
        createdAt: new Date().toISOString()
      });

      alert("Chamada finalizada com sucesso!");
      setSelectedClass(null);
      setAttendance({});
    } catch (error) {
      console.error("Error saving attendance:", error);
      alert("Erro ao salvar chamada.");
    }
  };

  if (selectedClass) {
    const classStudents = unassignedStudents.concat(classes.flatMap(c => [])).filter(s => selectedClass.students.includes(s.uid));
    // Note: In a real app, we'd fetch the actual student profiles for the selected class if not already loaded
    
    return (
      <div className="space-y-6">
        <button 
          onClick={() => setSelectedClass(null)}
          className="flex items-center gap-2 text-stone-500 font-medium text-sm"
        >
          <ChevronLeft size={18} /> Voltar
        </button>

        <div className="bg-stone-900 text-white p-6 rounded-3xl">
          <h2 className="text-2xl font-bold">{selectedClass.name}</h2>
          <p className="text-stone-400 text-sm">{selectedClass.startTime} - {selectedClass.endTime} • R$ {selectedClass.tuitionValue}</p>
          <div className="flex items-center gap-2 mt-4">
            <Users size={16} />
            <span className="text-sm font-medium">{selectedClass.students.length} alunos inscritos</span>
          </div>
        </div>

        {(profile?.role === 'admin' || profile?.role === 'professor') && unassignedStudents.length > 0 && (
          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
            <h4 className="text-xs font-bold text-blue-800 uppercase tracking-widest mb-3">Matricular Alunos Disponíveis</h4>
            <div className="flex flex-wrap gap-2">
              {unassignedStudents.map(student => (
                <button
                  key={student.uid}
                  onClick={() => enrollStudent(selectedClass.id, student.uid)}
                  className="bg-white px-3 py-2 rounded-xl text-xs font-bold text-blue-600 border border-blue-200 flex items-center gap-2 hover:bg-blue-600 hover:text-white transition-all"
                >
                  <UserPlus size={14} />
                  {student.displayName}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <h3 className="font-bold text-stone-900 px-1">Lista de Chamada</h3>
          {loadingStudents ? (
            <div className="py-8 text-center text-stone-400 text-sm">Carregando alunos...</div>
          ) : selectedClass.students.length === 0 ? (
            <p className="text-stone-400 text-sm text-center py-8">Nenhum aluno matriculado nesta turma.</p>
          ) : (
            <div className="space-y-2">
              {selectedClassStudents.map(student => (
                <div 
                  key={student.uid}
                  onClick={() => toggleAttendance(student.uid)}
                  className={`p-4 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                    attendance[student.uid] 
                      ? 'bg-green-50 border-green-100' 
                      : 'bg-red-50 border-red-100 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${
                      attendance[student.uid] ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {student.displayName.charAt(0)}
                    </div>
                    <div>
                      <p className={`font-bold text-sm ${attendance[student.uid] ? 'text-green-900' : 'text-red-900'}`}>
                        {student.displayName}
                      </p>
                      <p className="text-[10px] uppercase font-bold opacity-50">Faixa {student.belt}</p>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                    attendance[student.uid] 
                      ? 'bg-green-600 border-green-600 text-white' 
                      : 'border-red-200 text-transparent'
                  }`}>
                    <Check size={14} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button 
          onClick={handleFinishAttendance}
          disabled={selectedClass.students.length === 0}
          className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-200 mt-4 disabled:opacity-50"
        >
          Finalizar Chamada
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <section className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-stone-900">Aulas</h2>
          <p className="text-stone-500 text-sm">Gerencie suas turmas e presenças</p>
        </div>
        {(profile?.role === 'admin' || profile?.role === 'professor') && (
          <button 
            onClick={() => setIsCreating(!isCreating)}
            className="bg-stone-900 text-white p-3 rounded-2xl shadow-lg"
          >
            {isCreating ? <X size={20} /> : <Plus size={20} />}
          </button>
        )}
      </section>

      <AnimatePresence>
        {isCreating && (
          <motion.form 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleCreateClass}
            className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm space-y-4 overflow-hidden"
          >
            <h3 className="font-bold text-stone-900">Nova Turma</h3>
            <div>
              <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Nome da Turma</label>
              <input 
                type="text" 
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Judô Infantil A"
                className="w-full px-4 py-3 rounded-xl border border-stone-100 bg-stone-50 outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Início</label>
                <input 
                  type="time" 
                  value={newStartTime}
                  onChange={(e) => setNewStartTime(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-stone-100 bg-stone-50 outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Fim</label>
                <input 
                  type="time" 
                  value={newEndTime}
                  onChange={(e) => setNewEndTime(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-stone-100 bg-stone-50 outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Dias da Semana</label>
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
                        setNewDaysOfWeek(prev => 
                          prev.includes(day.val) 
                            ? prev.filter(d => d !== day.val) 
                            : [...prev, day.val].sort()
                        );
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                        newDaysOfWeek.includes(day.val)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-stone-50 text-stone-500 border-stone-100'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Limite Alunos</label>
                <input 
                  type="number" 
                  value={newMaxStudents}
                  onChange={(e) => setNewMaxStudents(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border border-stone-100 bg-stone-50 outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Faixa Etária</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={isNewAgeFree}
                      onChange={(e) => setIsNewAgeFree(e.target.checked)}
                      className="w-4 h-4 rounded border-stone-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-stone-600 font-medium">Livre / Sem limite</span>
                  </label>
                </div>
                
                {!isNewAgeFree && (
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div>
                      <span className="text-[9px] font-bold text-stone-400 uppercase">Idade Mínima</span>
                      <input 
                        type="number"
                        value={newMinAge}
                        onChange={(e) => setNewMinAge(e.target.value === '' ? '' : parseInt(e.target.value))}
                        placeholder="Mín"
                        className="w-full px-4 py-2 rounded-xl border border-stone-100 bg-stone-50 outline-none focus:ring-2 focus:ring-blue-200 text-sm"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-stone-400 uppercase">Idade Máxima</span>
                      <input 
                        type="number"
                        value={newMaxAge}
                        onChange={(e) => setNewMaxAge(e.target.value === '' ? '' : parseInt(e.target.value))}
                        placeholder="Máx"
                        className="w-full px-4 py-2 rounded-xl border border-stone-100 bg-stone-50 outline-none focus:ring-2 focus:ring-blue-200 text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Mensalidade (R$)</label>
              <input 
                type="number" 
                required
                value={newTuition}
                onChange={(e) => setNewTuition(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border border-stone-100 bg-stone-50 outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2">
              <Save size={18} /> Criar Turma
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : classes.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-stone-100">
            <Users size={48} className="mx-auto text-stone-200 mb-4" />
            <p className="text-stone-400 font-medium">Nenhuma turma cadastrada.</p>
          </div>
        ) : (
          classes.map((c) => (
            <motion.div 
              key={c.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => profile?.role !== 'student' && setSelectedClass(c)}
              className="bg-white p-5 rounded-3xl border border-stone-100 shadow-sm flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-bold">
                  {c.startTime.split(':')[0]}h
                </div>
                <div>
                  <p className="font-bold text-stone-900 text-lg">{c.name}</p>
                  <p className="text-xs text-stone-500 font-medium uppercase tracking-wider">
                    {c.ageRange || 'Misto'} • {c.students.length}/{c.maxStudents || '∞'} Alunos • R$ {c.tuitionValue}
                  </p>
                </div>
              </div>
              {profile?.role !== 'student' && (
                <div className="bg-stone-900 text-white px-4 py-2 rounded-xl text-xs font-bold">
                  Gerenciar
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>

      {unassignedStudents.length > 0 && (profile?.role === 'admin' || profile?.role === 'professor') && (
        <section className="mt-8">
          <h3 className="font-bold text-stone-900 mb-3 flex items-center gap-2">
            <Users size={18} className="text-orange-500" />
            Alunos sem Turma ({unassignedStudents.length})
          </h3>
          <div className="space-y-2">
            {unassignedStudents.map(student => (
              <div key={student.uid} className="bg-orange-50 p-3 rounded-2xl border border-orange-100 flex justify-between items-center">
                <div>
                  <p className="text-sm font-bold text-stone-900">{student.displayName}</p>
                  <p className="text-[10px] text-stone-500 uppercase tracking-wider">Nasc: {new Date(student.birthDate).toLocaleDateString('pt-BR')}</p>
                </div>
                <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">Aguardando Turma</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
