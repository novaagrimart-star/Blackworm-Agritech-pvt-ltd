import React, { useState } from 'react';
import { useAuth } from './lib/auth';
import { Dashboard } from './components/Dashboard';
import { Login } from './components/Login';
import { Language } from './lib/i18n';
import { Loader2 } from 'lucide-react';

export default function App() {
  const { profile, loading } = useAuth();
  const [lang, setLang] = useState<Language>('mr'); // Default Marathi as per user request

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-rose-600 animate-spin" />
          <span className="text-slate-500 font-medium text-sm animate-pulse">Syncing data across devices...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="antialiased">
      {profile ? (
        <Dashboard profile={profile} lang={lang} setLang={setLang} />
      ) : (
        <Login />
      )}
    </div>
  );
}
