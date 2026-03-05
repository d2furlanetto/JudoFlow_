import React, { useState, useEffect } from 'react';
import { useAuth } from '../firebase/AuthContext';
import { db } from '../firebase/config';
import { collection, getDocs, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { UserProfile, Dojo } from '../types';
import { Users, Shield, Award, AlertCircle, Home, Save, CreditCard } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [dojo, setDojo] = useState<Dojo | null>(null);
  const [dojoName, setDojoName] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingDojo, setSavingDojo] = useState(false);
  const [permissionError, setPermissionError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!db || !profile) return;
      setPermissionError(false);
      try {
        const currentDojoId = profile.dojoId || 'main-dojo';

        // Fetch users
        const querySnapshot = await getDocs(collection(db, 'users'));
        const usersList = querySnapshot.docs.map(doc => doc.data() as UserProfile);
        setUsers(usersList);

        // Fetch dojo
        const dojoRef = doc(db, 'dojos', currentDojoId);
        const dojoSnap = await getDoc(dojoRef);
        if (dojoSnap.exists()) {
          const dojoData = dojoSnap.data() as Dojo;
          setDojo(dojoData);
          setDojoName(dojoData.name);
        } else {
          // Create default dojo if it doesn't exist
          const defaultDojo: Dojo = {
            id: currentDojoId,
            name: 'Dojo Central',
            address: 'Endereço não configurado'
          };
          await setDoc(dojoRef, defaultDojo);
          setDojo(defaultDojo);
          setDojoName(defaultDojo.name);
        }
      } catch (error: any) {
        console.error("Error fetching admin data:", error);
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
    return (
      <div className="bg-red-50 p-8 rounded-3xl border border-red-100 space-y-6">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center shadow-sm">
          <Shield size={32} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-red-900">Erro de Permissão (Firebase)</h2>
          <p className="text-red-700 text-sm leading-relaxed">
            O Firebase bloqueou o acesso aos dados administrativos. Isso ocorre porque as <strong>Security Rules</strong> no console do Firebase não permitem a leitura da coleção de usuários ou dojos.
          </p>
        </div>

        <div className="bg-white/50 p-4 rounded-2xl space-y-3 border border-red-200">
          <p className="text-xs font-bold text-red-800 uppercase tracking-widest">Passos para corrigir:</p>
          <ol className="text-xs text-red-800 space-y-3 list-decimal ml-4">
            <li>Acesse o <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="underline font-bold">Console do Firebase</a>.</li>
            <li>Vá em <strong>Firestore Database</strong> &gt; aba <strong>Rules</strong>.</li>
            <li>Certifique-se de que a regra permite leitura global para testes: <br/><code className="bg-red-100 p-1 rounded mt-1 block">allow read, write: if request.auth != null;</code></li>
            <li>Verifique se o seu usuário tem o campo <code>role</code> como <code>"admin"</code> ou <code>"professor"</code> na coleção <code>users</code>.</li>
          </ol>
        </div>

        <button 
          onClick={() => window.location.reload()}
          className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-red-200 transition-transform active:scale-95"
        >
          Recarregar e Tentar Novamente
        </button>
      </div>
    );
  }

  const handleRoleChange = async (uid: string, newRole: 'student' | 'professor' | 'admin') => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'users', uid), { role: newRole });
      setUsers(users.map(u => u.uid === uid ? { ...u, role: newRole } : u));
    } catch (error) {
      console.error("Error updating role:", error);
    }
  };

  const handleCustomTuitionChange = async (uid: string, value: number) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'users', uid), { customTuitionValue: value });
      setUsers(users.map(u => u.uid === uid ? { ...u, customTuitionValue: value } : u));
    } catch (error) {
      console.error("Error updating custom tuition:", error);
    }
  };

  const handleUpdateDojo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !profile || !dojo) return;
    setSavingDojo(true);
    try {
      await updateDoc(doc(db, 'dojos', profile.dojoId), { name: dojoName });
      setDojo({ ...dojo, name: dojoName });
    } catch (error) {
      console.error("Error updating dojo:", error);
    } finally {
      setSavingDojo(false);
    }
  };

  if (profile?.role !== 'admin' && profile?.role !== 'professor') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
          <Shield size={32} />
        </div>
        <h2 className="text-xl font-bold text-stone-900">Acesso Negado</h2>
        <p className="text-stone-500 text-sm mt-2">
          Esta área é restrita para administradores e professores do dojo.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <section>
        <h2 className="text-2xl font-bold text-stone-900">Gestão do Dojo</h2>
        <p className="text-stone-500 text-sm">Controle administrativo e configurações</p>
      </section>

      {/* Dojo Settings */}
      <section className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm space-y-4">
        <h3 className="font-bold text-stone-900 flex items-center gap-2">
          <Home size={18} className="text-blue-600" />
          Configurações do Dojo
        </h3>
        <form onSubmit={handleUpdateDojo} className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Nome do Dojo</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={dojoName}
                onChange={(e) => setDojoName(e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl border border-stone-100 bg-stone-50 outline-none focus:ring-2 focus:ring-blue-200"
              />
              <button 
                type="submit" 
                disabled={savingDojo}
                className="bg-stone-900 text-white px-4 py-3 rounded-xl font-bold disabled:opacity-50"
              >
                {savingDojo ? '...' : <Save size={18} />}
              </button>
            </div>
          </div>
        </form>
      </section>

      <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-start gap-3 text-blue-800">
        <AlertCircle size={20} className="mt-0.5 shrink-0" />
        <p className="text-xs leading-relaxed">
          <strong>Gestão de Alunos:</strong> Como {profile.role === 'admin' ? 'administrador' : 'professor'}, você pode visualizar todos os alunos e gerenciar suas permissões.
        </p>
      </div>

      <section className="space-y-3">
        <h3 className="font-bold text-stone-900 flex items-center gap-2">
          <Users size={18} className="text-blue-600" />
          Usuários Cadastrados ({users.length})
        </h3>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((u) => (
              <div key={u.uid} className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold text-stone-900">{u.displayName}</p>
                    <p className="text-xs text-stone-500">{u.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-[10px] text-stone-400">Nasc: {new Date(u.birthDate).toLocaleDateString('pt-BR')}</p>
                      {u.role === 'student' && (
                        <div className="flex items-center gap-1 bg-stone-50 px-2 py-0.5 rounded-lg border border-stone-100">
                          <CreditCard size={10} className="text-stone-400" />
                          <span className="text-[10px] font-bold text-stone-600">R$ </span>
                          <input 
                            type="number" 
                            defaultValue={u.customTuitionValue || 0}
                            onBlur={(e) => handleCustomTuitionChange(u.uid, Number(e.target.value))}
                            className="w-12 bg-transparent text-[10px] font-bold outline-none"
                            placeholder="Valor"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                    u.role === 'admin' ? 'bg-purple-100 text-purple-600' : 
                    u.role === 'professor' ? 'bg-blue-100 text-blue-600' : 
                    'bg-stone-100 text-stone-600'
                  }`}>
                    {u.role}
                  </span>
                </div>
                
                {profile.role === 'admin' && (
                  <div className="flex items-center gap-2 border-t border-stone-50 pt-3 mt-1">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mr-auto">Alterar Papel:</p>
                    <button 
                      onClick={() => handleRoleChange(u.uid, 'student')}
                      className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors ${u.role === 'student' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-50'}`}
                    >
                      Aluno
                    </button>
                    <button 
                      onClick={() => handleRoleChange(u.uid, 'professor')}
                      className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors ${u.role === 'professor' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-50'}`}
                    >
                      Prof
                    </button>
                    <button 
                      onClick={() => handleRoleChange(u.uid, 'admin')}
                      className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors ${u.role === 'admin' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-50'}`}
                    >
                      Admin
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
