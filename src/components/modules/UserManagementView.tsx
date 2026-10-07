import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, setDoc, getDocs, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { UserProfile } from '../../lib/auth';
import { logAudit } from '../../lib/dataService';
import { Language, translations } from '../../lib/i18n';
import { Users, UserPlus, Phone, Mail, MapPin, ShieldCheck, CheckCircle, AlertCircle, X, Key, User } from 'lucide-react';

interface ExtendedUserProfile extends UserProfile {
  address?: string;
  designation?: string;
  loginId?: string;
  password?: string;
}

interface Props {
  profile: UserProfile;
  lang: Language;
}

export const UserManagementView: React.FC<Props> = ({ profile, lang }) => {
  const t = translations[lang];
  const [users, setUsers] = useState<ExtendedUserProfile[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [designation, setDesignation] = useState('Field Officer');
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'owner' | 'staff' | 'dealer' | 'farmer'>('staff');

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: ExtendedUserProfile[] = [];
      snapshot.forEach((docSnap) => {
        const u = docSnap.data() as ExtendedUserProfile;
        list.push({ uid: docSnap.id, ...u });
      });
      setUsers(list);
    });
    return () => unsubscribe();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (mobile) {
        const phoneQuery = query(collection(db, 'users'), where('mobile', '==', mobile.trim()));
        const phoneSnap = await getDocs(phoneQuery);
        if (!phoneSnap.empty) {
          setErrorMsg('हा मोबाईल नंबर आधीच नोंदणीकृत आहे!');
          return;
        }
      }

      const newUid = `user_${Date.now()}`;
      const newUserDoc: ExtendedUserProfile = {
        uid: newUid,
        name: name.trim(),
        mobile: mobile.trim(),
        email: email.trim() || `${mobile.trim()}@blackwormagri.com`,
        address: address.trim(),
        designation: designation.trim(),
        loginId: loginId.trim() || mobile.trim(),
        password: password.trim() || 'bw@123',
        role,
        createdAt: new Date().toISOString(),
      };

      // 1. Save to users
      await setDoc(doc(db, 'users', newUid), newUserDoc);

      // 2. Auto-create Target Sheet
      const targetId = `target_${newUid}_oct26`;
      await setDoc(doc(db, 'targets', targetId), {
        id: targetId,
        userId: newUid,
        userName: newUserDoc.name,
        month: 'October',
        year: 2026,
        targetSales: 200000,
        achievedSales: 0,
        targetCollection: 180000,
        achievedCollection: 0,
        ownerId: profile.uid,
        isArchived: false,
        createdAt: new Date().toISOString(),
      });

      // 3. Auto-create Travel Sheet
      const travelId = `travel_${newUid}_init`;
      await setDoc(doc(db, 'travel_records', travelId), {
        id: travelId,
        userId: newUid,
        userName: newUserDoc.name,
        date: new Date().toISOString().slice(0, 10),
        startLocation: 'Head Office',
        endLocation: 'Field Visits',
        vehicleType: 'Bike',
        kmTravelled: 0,
        kmRate: 3.5,
        fuelExpense: 0,
        daFoodExpense: 200,
        lodgingExpense: 0,
        totalExpense: 200,
        purpose: 'Initial Field Setup',
        status: 'submitted',
        ownerId: newUid,
        isArchived: false,
        createdAt: new Date().toISOString(),
      });

      await logAudit('CREATE', 'users', newUid, `Added user ${newUserDoc.name} (${role}) with login ID ${newUserDoc.loginId}`, profile);

      setSuccessMsg(`युझर ${newUserDoc.name} यशस्वीरित्या तयार झाला!`);
      setShowAddModal(false);
      setName('');
      setMobile('');
      setEmail('');
      setAddress('');
      setLoginId('');
      setPassword('');
    } catch (err: any) {
      setErrorMsg(err.message || 'त्रुटी आली.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" />
            {t.user} व्यवस्थापन (User Directory)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">पूर्ण नाव, मोबाईल, मेल, ऍड्रेस, डेजीग्नेशन, लॉगिन आयडी आणि पासवर्ड</p>
        </div>
        <button
          onClick={() => { setErrorMsg(''); setShowAddModal(true); }}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          <span>{t.addNew} युझर</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((u) => (
          <div key={u.uid} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center font-bold text-sm">
                {u.name ? u.name.slice(0, 2).toUpperCase() : 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-900 truncate">{u.name}</h3>
                <p className="text-[11px] text-slate-500 font-medium">{u.designation || u.role}</p>
                <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-slate-50 text-slate-700 mt-0.5">
                  {u.role}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
              {u.mobile && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-slate-400" /><span>{u.mobile}</span></div>}
              {u.email && <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-slate-400" /><span className="truncate">{u.email}</span></div>}
              {u.address && <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-slate-400" /><span className="truncate">{u.address}</span></div>}
              {u.loginId && <div className="flex items-center gap-2"><Key className="w-3.5 h-3.5 text-slate-400" /><span className="text-emerald-700 font-semibold">Login ID: {u.loginId}</span></div>}
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">नवीन युझर नोंदणी</h3>
                <p className="text-[11px] text-slate-500">पूर्ण तपशील, लॉगिन आयडी आणि पासवर्ड सेट करा</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">पूर्ण नाव (Full Name) *</label>
                <input type="text" required placeholder="उदा. श्रीधर बाळकृष्ण शिंदे" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">मोबाईल नंबर (Mobile) *</label>
                  <input type="tel" required placeholder="98220xxxxx" value={mobile} onChange={(e) => setMobile(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">मेल आयडी (Email)</label>
                  <input type="email" placeholder="user@blackworm.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">पत्ता (Address)</label>
                <input type="text" placeholder="मु. पोस्ट Baramati, पुणे" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">डेजीग्नेशन (Designation)</label>
                  <input type="text" placeholder="उदा. Sales Manager / Officer" value={designation} onChange={(e) => setDesignation(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">भूमिका (Role)</label>
                  <select value={role} onChange={(e) => setRole(e.target.value as any)} className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none">
                    <option value="staff">Staff (कर्मचारी)</option>
                    <option value="admin">Admin (प्रशासक)</option>
                    <option value="owner">Owner (मालक)</option>
                    <option value="dealer">Dealer (डीलर)</option>
                    <option value="farmer">Farmer (शेतकरी)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">लॉगिन आयडी (Login ID) *</label>
                  <input type="text" required placeholder="username / mobile" value={loginId} onChange={(e) => setLoginId(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">पासवर्ड (Password) *</label>
                  <input type="password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none" />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 rounded-xl border text-xs font-bold text-slate-600">{t.cancel}</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white">{t.save}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
