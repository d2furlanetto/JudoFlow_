import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { motion } from 'motion/react';
import { UserProfile } from '../types';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../firebase/AuthContext';

export const Login: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [isReset, setIsReset] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [role, setRole] = useState<'student' | 'professor'>('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user && !authLoading) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (isReset) {
        await sendPasswordResetEmail(auth, email);
        setMessage('E-mail de recuperação enviado!');
        setIsReset(false);
      } else if (isRegister) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const profile: UserProfile = {
          uid: userCredential.user.uid,
          email,
          displayName: name,
          birthDate,
          role,
          belt: 'branca',
          dojoId: 'main-dojo',
          tuitionStatus: 'up-to-date',
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, 'users', userCredential.user.uid), profile);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-white rounded-3xl shadow-xl shadow-stone-200/50 p-8 border border-stone-100"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white font-bold text-2xl">
            JF
          </div>
          <h2 className="text-2xl font-bold text-stone-900">
            {isReset ? 'Recuperar Senha' : isRegister ? 'Criar Conta' : 'Bem-vindo'}
          </h2>
          <p className="text-stone-500 text-sm mt-1">
            {isReset ? 'Digite seu e-mail para receber o link' : 'Acesse sua conta do Dojo'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <>
              <div className="flex bg-stone-100 p-1 rounded-xl mb-4">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${role === 'student' ? 'bg-white text-blue-600 shadow-sm' : 'text-stone-500'}`}
                >
                  Aluno
                </button>
                <button
                  type="button"
                  onClick={() => setRole('professor')}
                  className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${role === 'professor' ? 'bg-white text-blue-600 shadow-sm' : 'text-stone-500'}`}
                >
                  Professor
                </button>
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                  placeholder="Seu nome"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Data de Nascimento</label>
                <input
                  type="date"
                  required
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                />
              </div>
            </>
          )}
          <div>
            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              placeholder="seu@email.com"
            />
          </div>
          {!isReset && (
            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Senha</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          )}

          {error && <p className="text-red-500 text-xs font-medium">{error}</p>}
          {message && <p className="text-green-600 text-xs font-medium">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-stone-900 text-white py-3 rounded-xl font-semibold hover:bg-stone-800 transition-colors disabled:opacity-50 mt-2"
          >
            {loading ? 'Carregando...' : isReset ? 'Enviar Link' : isRegister ? 'Cadastrar' : 'Entrar'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          {!isReset && (
            <button
              onClick={() => setIsReset(true)}
              className="text-xs font-medium text-stone-500 hover:text-blue-600 transition-colors block mx-auto"
            >
              Esqueceu a senha?
            </button>
          )}
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setIsReset(false);
            }}
            className="text-xs font-medium text-blue-600 hover:underline"
          >
            {isReset ? 'Voltar para o login' : isRegister ? 'Já tem uma conta? Entre' : 'Não tem conta? Cadastre-se'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
