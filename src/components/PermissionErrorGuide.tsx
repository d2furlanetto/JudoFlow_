import React from 'react';
import { AlertTriangle, Shield, RefreshCw } from 'lucide-react';

interface PermissionErrorGuideProps {
  errorSource?: string;
}

export const PermissionErrorGuide: React.FC<PermissionErrorGuideProps> = ({ errorSource }) => {
  return (
    <div className="min-h-[400px] bg-orange-50 p-8 rounded-3xl border border-orange-100 space-y-6 flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center shadow-sm mb-2">
        <Shield size={32} />
      </div>
      
      <div className="space-y-2 max-w-md">
        <h2 className="text-2xl font-bold text-orange-900">Acesso Bloqueado (Firebase)</h2>
        <p className="text-orange-700 text-sm leading-relaxed">
          O Firebase recusou a operação {errorSource ? `em ${errorSource}` : ''}. Isso acontece porque as <strong>Security Rules</strong> no console do Firebase estão bloqueando o acesso.
        </p>
      </div>
      
      <div className="bg-white/50 p-6 rounded-2xl space-y-4 border border-orange-200 text-left w-full max-w-lg">
        <div className="flex items-center gap-2 text-orange-800">
          <AlertTriangle size={18} />
          <p className="text-xs font-bold uppercase tracking-widest">Como resolver agora:</p>
        </div>
        
        <ol className="text-xs text-orange-800 space-y-3 list-decimal ml-4">
          <li>Acesse o <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="underline font-bold hover:text-orange-600">Console do Firebase</a>.</li>
          <li>Vá em <strong>Firestore Database</strong> &gt; aba <strong>Rules</strong>.</li>
          <li>Substitua o código existente por este (configuração profissional):
            <code className="bg-orange-100 p-2 rounded mt-2 block font-mono text-[9px] border border-orange-200 leading-tight">
              rules_version = '2';<br/>
              service cloud.firestore &#123;<br/>
              &nbsp;&nbsp;match /databases/&#123;database&#125;/documents &#123;<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;// Usuários: Leitura p/ todos logados, Escrita p/ o dono<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;match /users/&#123;userId&#125; &#123;<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;allow read: if request.auth != null;<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;allow write: if request.auth != null && request.auth.uid == userId;<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&#125;<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;// Dojos e Turmas: Leitura p/ todos logados, Escrita p/ Senseis/Admins<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;match /&#123;collection&#125;/&#123;docId&#125; &#123;<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;allow read: if request.auth != null;<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;allow write: if request.auth != null && <br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;collection in ['dojos', 'classes'] && <br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['professor', 'admin'];<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&#125;<br/>
              &nbsp;&nbsp;&#125;<br/>
              &#125;
            </code>
          </li>
          <li>Clique em <strong>Publish</strong> e aguarde 30 segundos.</li>
        </ol>
      </div>

      <button 
        onClick={() => window.location.reload()}
        className="flex items-center gap-2 bg-orange-600 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-orange-200 transition-all hover:bg-orange-700 active:scale-95"
      >
        <RefreshCw size={18} /> Recarregar App
      </button>
    </div>
  );
};
