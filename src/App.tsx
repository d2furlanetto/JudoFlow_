import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './firebase/AuthContext';
import { isFirebaseConfigured } from './firebase/config';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Classes } from './pages/Classes';
import { Profile } from './pages/Profile';
import { Finance } from './pages/Finance';
import { Championships } from './pages/Championships';
import { AdminDashboard } from './pages/Admin';
import { AlertTriangle, ExternalLink } from 'lucide-react';

const SetupScreen: React.FC = () => (
  <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
    <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-stone-100 text-center">
      <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl mx-auto mb-6 flex items-center justify-center">
        <AlertTriangle size={32} />
      </div>
      <h2 className="text-2xl font-bold text-stone-900 mb-2">Configuração Necessária</h2>
      <p className="text-stone-500 text-sm mb-8 leading-relaxed">
        Para utilizar o JudoFlow, você precisa configurar as chaves do Firebase no painel de <strong>Secrets</strong> do AI Studio.
      </p>
      
      <div className="bg-stone-50 rounded-2xl p-4 text-left mb-8">
        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Variáveis Necessárias:</p>
        <ul className="text-xs font-mono text-stone-600 space-y-1">
          <li>VITE_FIREBASE_API_KEY</li>
          <li>VITE_FIREBASE_PROJECT_ID</li>
          <li>VITE_FIREBASE_APP_ID</li>
          <li>... (veja .env.example)</li>
        </ul>
      </div>

      <a 
        href="https://console.firebase.google.com/" 
        target="_blank" 
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2 w-full bg-stone-900 text-white py-3 rounded-xl font-semibold hover:bg-stone-800 transition-colors"
      >
        Ir para o Firebase Console <ExternalLink size={16} />
      </a>
    </div>
  </div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

export default function App() {
  if (!isFirebaseConfigured) {
    return <SetupScreen />;
  }

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="classes" element={<Classes />} />
            <Route path="profile" element={<Profile />} />
            <Route path="finance" element={<Finance />} />
            <Route path="championships" element={<Championships />} />
            <Route path="admin" element={<AdminDashboard />} />
          </Route>

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
