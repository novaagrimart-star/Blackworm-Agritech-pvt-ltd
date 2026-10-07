import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile } from '../lib/auth';
import { User, Lock, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (profile: UserProfile) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Branding state
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [logoSize, setLogoSize] = useState<number>(100);

  useEffect(() => {
    // Fetch branding config
    const unsubBranding = onSnapshot(doc(db, 'config', 'branding'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setLogoUrl(data.logoUrl || '');
        setLogoSize(data.logoSize || 100);
      }
    });
    return () => unsubBranding();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const trimmedId = loginId.trim();
      const trimmedPass = password.trim();

      // Master default admin override
      if ((trimmedId === 'admin' || trimmedId === '7798716201') && (trimmedPass === 'admin' || trimmedPass === 'bw@123')) {
        const ownerProfile: UserProfile = {
          uid: 'master_owner_001',
          fullName: 'Shridhar Balkrishna Shinde',
          emailId: 'blackwormagritechpvtltd@gmail.com',
          role: 'owner',
          mobileNumber: '7798716201',
          createdAt: new Date().toISOString(),
        };
        onLoginSuccess(ownerProfile);
        return;
      }

      // Query Firestore users by loginId or mobile
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('loginId', '==', trimmedId));
      const snap = await getDocs(q);

      let foundUser: any = null;
      if (!snap.empty) {
        foundUser = snap.docs[0].data();
      } else {
        // Try mobile search
        const qMobile = query(usersRef, where('mobileNumber', '==', trimmedId));
        const snapMobile = await getDocs(qMobile);
        if (!snapMobile.empty) {
          foundUser = snapMobile.docs[0].data();
        }
      }

      if (foundUser) {
        if (!foundUser.password || foundUser.password === trimmedPass) {
          onLoginSuccess(foundUser as UserProfile);
        } else {
          setError('Incorrect password! Please try again.');
        }
      } else {
        setError('Login ID not found. Please check user management.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8 border border-slate-100 flex flex-col items-center text-center">
        <div className="mb-6 flex items-center justify-center overflow-hidden">
          {logoUrl ? (
            <img 
              src={logoUrl} 
              alt="Logo"
              style={{ width: `${logoSize}px`, height: `${logoSize}px` }}
              className="object-contain"
            />
          ) : (
            <div className="w-20 h-20 bg-rose-50 rounded-2xl flex items-center justify-center">
              <ShieldCheck className="w-10 h-10 text-rose-600" />
            </div>
          )}
        </div>
        
        <h1 className="text-2xl font-black text-rose-600 tracking-tighter leading-tight mb-1 uppercase">
          BLACKWORM
        </h1>
        <p className="text-slate-400 mb-8 text-[10px] font-bold uppercase tracking-[0.2em]">
          Management Information System
        </p>

        {error && (
          <div className="mb-4 w-full p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="w-full space-y-4 text-left">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Login ID / Mobile</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                autoComplete="username"
                placeholder="Enter Login ID"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none focus:border-rose-500 transition-all bg-slate-50/50"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none focus:border-rose-500 transition-all bg-slate-50/50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-lg shadow-rose-200 transition flex items-center justify-center gap-2 active:scale-95 mt-2"
          >
            <span>{loading ? 'Logging in...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 pt-4 border-t border-slate-100 w-full flex items-center justify-center gap-2 text-[9px] text-slate-400 uppercase tracking-widest font-bold">
          <ShieldCheck className="w-3 h-3 text-emerald-500" />
          Secure Enterprise Access
        </div>
      </div>
    </div>
  );
};
