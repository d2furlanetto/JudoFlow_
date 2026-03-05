import React, { useState, useEffect } from 'react';
import { useAuth } from '../firebase/AuthContext';
import { auth, db } from '../firebase/config';
import { signOut } from 'firebase/auth';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, LogOut, User, MapPin, Phone, Mail, Award, 
  CheckCircle2, Edit3, Save, X, Plus, Trash2, Calendar,
  Trophy, BookOpen, Building2, Loader2
} from 'lucide-react';
import { BeltRank, UserProfile, BeltHistory, CompetitionRecord, CourseRecord } from '../types';

export const Profile: React.FC = () => {
  const { profile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [loadingAttendance, setLoadingAttendance] = useState(true);

  // Form State
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [birthDate, setBirthDate] = useState(profile?.birthDate || '');
  const [association, setAssociation] = useState(profile?.association || '');
  const [beltHistory, setBeltHistory] = useState<BeltHistory[]>(profile?.beltHistory || []);
  const [competitions, setCompetitions] = useState<CompetitionRecord[]>(profile?.competitions || []);
  const [courses, setCourses] = useState<CourseRecord[]>(profile?.courses || []);

  useEffect(() => {
    // Only sync form state with profile when NOT in editing mode
    // to prevent background updates from overwriting unsaved changes
    if (profile && !isEditing) {
      setDisplayName(profile.displayName || '');
      setPhone(profile.phone || '');
      setBirthDate(profile.birthDate || '');
      setAssociation(profile.association || '');
      setBeltHistory(profile.beltHistory || []);
      setCompetitions(profile.competitions || []);
      setCourses(profile.courses || []);
    }
  }, [profile, isEditing]);

  useEffect(() => {
    const fetchAttendance = async () => {
      if (!db || !profile) return;
      setLoadingAttendance(true);
      try {
        const attendanceQuery = query(
          collection(db, 'attendance'),
          where('presentStudents', 'array-contains', profile.uid)
        );
        const attendanceSnap = await getDocs(attendanceQuery);
        setAttendanceCount(attendanceSnap.size);
      } catch (error) {
        console.error("Error fetching attendance:", error);
      } finally {
        setLoadingAttendance(false);
      }
    };
    fetchAttendance();
  }, [profile]);

  const handleLogout = () => signOut(auth);

  const handleSave = async () => {
    if (!db || !profile) return;
    setLoading(true);
    try {
      const userRef = doc(db, 'users', profile.uid);
      await updateDoc(userRef, {
        displayName: displayName.trim(),
        phone: phone.trim(),
        birthDate,
        association: association.trim(),
        beltHistory,
        competitions,
        courses
      });
      setIsEditing(false);
      alert("Perfil atualizado com sucesso!");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      if (error.code === 'permission-denied') {
        alert("Erro de permissão: Verifique se você está logado corretamente.");
      } else {
        alert("Erro ao atualizar perfil: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const addBeltHistory = () => {
    const newBelt: BeltHistory = { belt: 'branca', date: new Date().toISOString().split('T')[0] };
    setBeltHistory([...beltHistory, newBelt]);
  };

  const removeBeltHistory = (index: number) => {
    setBeltHistory(beltHistory.filter((_, i) => i !== index));
  };

  const addCompetition = () => {
    const newComp: CompetitionRecord = { name: '', date: new Date().toISOString().split('T')[0], result: '' };
    setCompetitions([...competitions, newComp]);
  };

  const removeCompetition = (index: number) => {
    setCompetitions(competitions.filter((_, i) => i !== index));
  };

  const addCourse = () => {
    const newCourse: CourseRecord = { name: '', date: new Date().toISOString().split('T')[0], type: 'técnico' };
    setCourses([...courses, newCourse]);
  };

  const removeCourse = (index: number) => {
    setCourses(courses.filter((_, i) => i !== index));
  };

  const beltRanks: BeltRank[] = [
    'branca', 'cinza', 'azul', 'amarela', 'laranja', 'verde', 'roxa', 'marrom', 'preta'
  ];

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-start">
        <h2 className="text-2xl font-bold text-stone-900">Perfil</h2>
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className={`p-2 rounded-xl border transition-all ${isEditing ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-500 border-stone-100'}`}
        >
          {isEditing ? <X size={20} /> : <Settings size={20} />}
        </button>
      </div>

      {/* Profile Card */}
      <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-blue-600" />
        <div className="w-24 h-24 bg-stone-100 rounded-full mx-auto mb-4 flex items-center justify-center text-stone-400 overflow-hidden border-4 border-stone-50">
          <User size={48} />
        </div>
        
        {isEditing ? (
          <div className="space-y-3">
            <input 
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Nome Completo"
              className="w-full text-center text-xl font-bold text-stone-900 bg-stone-50 p-2 rounded-xl border border-stone-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <p className="text-blue-600 font-bold text-sm uppercase tracking-widest">Faixa {profile?.belt}</p>
          </div>
        ) : (
          <>
            <h3 className="text-xl font-bold text-stone-900">{profile?.displayName}</h3>
            <p className="text-blue-600 font-bold text-sm uppercase tracking-widest mt-1">Faixa {profile?.belt}</p>
          </>
        )}
        
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-stone-50 p-3 rounded-2xl">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Presenças</p>
            <p className="text-lg font-bold text-stone-900">
              {loadingAttendance ? <Loader2 size={16} className="animate-spin mx-auto" /> : attendanceCount}
            </p>
          </div>
          <div className="bg-stone-50 p-3 rounded-2xl">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Pontos</p>
            <p className="text-lg font-bold text-stone-900">
              {loadingAttendance ? <Loader2 size={16} className="animate-spin mx-auto" /> : attendanceCount}
            </p>
          </div>
        </div>
      </div>

      {/* Basic Info Section */}
      <section className="space-y-3">
        <h3 className="font-bold text-stone-900 flex items-center gap-2 px-1">
          <User size={18} className="text-blue-600" />
          Dados Pessoais
        </h3>
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
              {isEditing ? (
                <input 
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-sm font-medium text-stone-900 bg-stone-50 p-1 rounded-lg focus:outline-none"
                />
              ) : (
                <p className="text-sm font-medium text-stone-900">{profile?.phone || 'Não informado'}</p>
              )}
            </div>
          </div>

          <div className="p-4 border-b border-stone-50 flex items-center gap-3">
            <Calendar size={18} className="text-stone-400" />
            <div className="flex-1">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Data de Nascimento</p>
              {isEditing ? (
                <input 
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full text-sm font-medium text-stone-900 bg-stone-50 p-1 rounded-lg focus:outline-none"
                />
              ) : (
                <p className="text-sm font-medium text-stone-900">{profile?.birthDate || 'Não informado'}</p>
              )}
            </div>
          </div>

          <div className="p-4 flex items-center gap-3">
            <Building2 size={18} className="text-stone-400" />
            <div className="flex-1">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Associação / Clube</p>
              {isEditing ? (
                <input 
                  type="text"
                  value={association}
                  onChange={(e) => setAssociation(e.target.value)}
                  placeholder="Nome da academia ou projeto"
                  className="w-full text-sm font-medium text-stone-900 bg-stone-50 p-1 rounded-lg focus:outline-none"
                />
              ) : (
                <p className="text-sm font-medium text-stone-900">{profile?.association || 'Não informado'}</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Belt History Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-bold text-stone-900 flex items-center gap-2">
            <Award size={18} className="text-blue-600" />
            Histórico de Faixas
          </h3>
          {isEditing && (
            <button onClick={addBeltHistory} className="text-blue-600 p-1 bg-blue-50 rounded-lg">
              <Plus size={16} />
            </button>
          )}
        </div>
        <div className="bg-white p-4 rounded-3xl border border-stone-100 shadow-sm space-y-3">
          {beltHistory.length === 0 && !isEditing && (
            <p className="text-xs text-stone-400 italic text-center py-2">Nenhum histórico registrado.</p>
          )}
          {beltHistory.map((bh, index) => (
            <div key={index} className="flex items-center gap-3 bg-stone-50 p-3 rounded-2xl border border-stone-100">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                <Award size={16} />
              </div>
              <div className="flex-1">
                {isEditing ? (
                  <div className="grid grid-cols-2 gap-2">
                    <select 
                      value={bh.belt}
                      onChange={(e) => {
                        const newHistory = [...beltHistory];
                        newHistory[index].belt = e.target.value as BeltRank;
                        setBeltHistory(newHistory);
                      }}
                      className="text-xs font-bold text-stone-900 bg-white p-1 rounded border border-stone-200"
                    >
                      {beltRanks.map(rank => <option key={rank} value={rank}>{rank.charAt(0).toUpperCase() + rank.slice(1)}</option>)}
                    </select>
                    <input 
                      type="date"
                      value={bh.date}
                      onChange={(e) => {
                        const newHistory = [...beltHistory];
                        newHistory[index].date = e.target.value;
                        setBeltHistory(newHistory);
                      }}
                      className="text-xs text-stone-600 bg-white p-1 rounded border border-stone-200"
                    />
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-bold text-stone-900 capitalize">Faixa {bh.belt}</p>
                    <p className="text-[10px] text-stone-500">{new Date(bh.date).toLocaleDateString('pt-BR')}</p>
                  </>
                )}
              </div>
              {isEditing && (
                <button onClick={() => removeBeltHistory(index)} className="text-red-400 p-1">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Competitions Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-bold text-stone-900 flex items-center gap-2">
            <Trophy size={18} className="text-orange-500" />
            Competições
          </h3>
          {isEditing && (
            <button onClick={addCompetition} className="text-orange-600 p-1 bg-orange-50 rounded-lg">
              <Plus size={16} />
            </button>
          )}
        </div>
        <div className="bg-white p-4 rounded-3xl border border-stone-100 shadow-sm space-y-3">
          {competitions.length === 0 && !isEditing && (
            <p className="text-xs text-stone-400 italic text-center py-2">Nenhuma competição registrada.</p>
          )}
          {competitions.map((comp, index) => (
            <div key={index} className="bg-stone-50 p-4 rounded-2xl border border-stone-100 space-y-2">
              {isEditing ? (
                <div className="space-y-2">
                  <input 
                    type="text"
                    value={comp.name}
                    onChange={(e) => {
                      const newComps = [...competitions];
                      newComps[index].name = e.target.value;
                      setCompetitions(newComps);
                    }}
                    placeholder="Nome do Campeonato"
                    className="w-full text-xs font-bold text-stone-900 bg-white p-2 rounded border border-stone-200"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="date"
                      value={comp.date}
                      onChange={(e) => {
                        const newComps = [...competitions];
                        newComps[index].date = e.target.value;
                        setCompetitions(newComps);
                      }}
                      className="text-xs text-stone-600 bg-white p-2 rounded border border-stone-200"
                    />
                    <input 
                      type="text"
                      value={comp.result}
                      onChange={(e) => {
                        const newComps = [...competitions];
                        newComps[index].result = e.target.value;
                        setCompetitions(newComps);
                      }}
                      placeholder="Resultado (ex: Campeão)"
                      className="text-xs text-stone-600 bg-white p-2 rounded border border-stone-200"
                    />
                  </div>
                  <button onClick={() => removeCompetition(index)} className="w-full text-red-500 text-[10px] font-bold uppercase py-1 border border-red-100 rounded-lg">
                    Remover
                  </button>
                </div>
              ) : (
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-bold text-stone-900">{comp.name}</p>
                    <p className="text-[10px] text-stone-500">{new Date(comp.date).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase">
                    {comp.result}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Courses Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-bold text-stone-900 flex items-center gap-2">
            <BookOpen size={18} className="text-green-600" />
            Cursos e Seminários
          </h3>
          {isEditing && (
            <button onClick={addCourse} className="text-green-600 p-1 bg-green-50 rounded-lg">
              <Plus size={16} />
            </button>
          )}
        </div>
        <div className="bg-white p-4 rounded-3xl border border-stone-100 shadow-sm space-y-3">
          {courses.length === 0 && !isEditing && (
            <p className="text-xs text-stone-400 italic text-center py-2">Nenhum curso registrado.</p>
          )}
          {courses.map((course, index) => (
            <div key={index} className="bg-stone-50 p-4 rounded-2xl border border-stone-100 space-y-2">
              {isEditing ? (
                <div className="space-y-2">
                  <input 
                    type="text"
                    value={course.name}
                    onChange={(e) => {
                      const newCourses = [...courses];
                      newCourses[index].name = e.target.value;
                      setCourses(newCourses);
                    }}
                    placeholder="Nome do Curso"
                    className="w-full text-xs font-bold text-stone-900 bg-white p-2 rounded border border-stone-200"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select 
                      value={course.type}
                      onChange={(e) => {
                        const newCourses = [...courses];
                        newCourses[index].type = e.target.value as any;
                        setCourses(newCourses);
                      }}
                      className="text-xs text-stone-600 bg-white p-2 rounded border border-stone-200"
                    >
                      <option value="técnico">Técnico</option>
                      <option value="arbitragem">Arbitragem</option>
                      <option value="outro">Outro</option>
                    </select>
                    <input 
                      type="date"
                      value={course.date}
                      onChange={(e) => {
                        const newCourses = [...courses];
                        newCourses[index].date = e.target.value;
                        setCourses(newCourses);
                      }}
                      className="text-xs text-stone-600 bg-white p-2 rounded border border-stone-200"
                    />
                  </div>
                  <button onClick={() => removeCourse(index)} className="w-full text-red-500 text-[10px] font-bold uppercase py-1 border border-red-100 rounded-lg">
                    Remover
                  </button>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold text-stone-900">{course.name}</p>
                    <p className="text-[10px] text-stone-500">{new Date(course.date).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase">
                    {course.type}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Action Buttons */}
      <div className="space-y-3">
        {isEditing ? (
          <button 
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-stone-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-stone-200 disabled:opacity-50"
          >
            {loading ? 'Salvando...' : <><Save size={20} /> Salvar Currículo</>}
          </button>
        ) : (
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-red-500 font-bold py-4 rounded-2xl border border-red-100 bg-red-50/50 hover:bg-red-50 transition-colors"
          >
            <LogOut size={20} /> Sair da Conta
          </button>
        )}
      </div>
    </div>
  );
};
