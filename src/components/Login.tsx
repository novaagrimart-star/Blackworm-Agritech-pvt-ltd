import React from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/src/firebase';
import { LogIn } from 'lucide-react';

export const Login: React.FC = () => {
  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8 border border-slate-100 flex flex-col items-center">
        <div className="w-20 h-20 bg-rose-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg rotate-3">
          <span className="text-white font-black text-4xl">BA</span>
        </div>
        
        <h1 className="text-2xl font-black text-slate-900 text-center mb-2">
          Blackworm Agritech
        </h1>
        <p className="text-slate-500 text-center mb-8 text-sm">
          Management Information System
        </p>

        <button
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-200 hover:border-slate-300 py-4 px-6 rounded-2xl font-bold text-slate-700 transition-all hover:bg-slate-50 active:scale-95 shadow-sm"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
          Sign in with Google
        </button>

        <div className="mt-8 flex items-center gap-2 text-xs text-slate-400">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          Secure Enterprise Authentication
        </div>
      </div>
      
      <p className="mt-8 text-slate-400 text-[10px] uppercase tracking-widest font-bold">
        CoreSync Business Architecture
      </p>
    </div>
  );
};
