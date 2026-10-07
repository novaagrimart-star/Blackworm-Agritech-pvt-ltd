import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  setDoc 
} from 'firebase/firestore';
import { db } from '../../firebase';
import { UserProfile } from '../../lib/auth';
import { softDeleteRecord, logAudit } from '../../lib/dataService';
import { Language, translations } from '../../lib/i18n';
import { 
  Plus, 
  Target, 
  Trash2, 
  Edit3, 
  Search,
  X
} from 'lucide-react';

interface TargetItem {
  id: string;
  userId: string;
  userName: string;
  month: string;
  year: number;
  targetSales: number;
  achievedSales: number;
  targetCollection: number;
  achievedCollection: number;
  ownerId: string;
  isArchived?: boolean;
}

interface Props {
  profile: UserProfile;
  lang: Language;
}

export const TargetSheetView: React.FC<Props> = ({ profile, lang }) => {
  const t = translations[lang];
  const [targets, setTargets] = useState<TargetItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTarget, setEditingTarget] = useState<TargetItem | null>(null);

  const [formMonth, setFormMonth] = useState('October');
  const [formYear, setFormYear] = useState(2026);
  const [formUserName, setFormUserName] = useState(profile.name);
  const [formTargetSales, setFormTargetSales] = useState('200000');
  const [formTargetCollection, setFormTargetCollection] = useState('180000');
  const [formAchievedSales, setFormAchievedSales] = useState('0');
  const [formAchievedCollection, setFormAchievedCollection] = useState('0');

  useEffect(() => {
    const q = query(collection(db, 'targets'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: TargetItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as TargetItem;
        if (!data.isArchived) {
          items.push({ id: docSnap.id, ...data });
        }
      });
      setTargets(items);
    }, (error) => {
      console.error('Target fetch error:', error);
    });

    return () => unsubscribe();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const targetId = editingTarget ? editingTarget.id : `target_${Date.now()}`;
      const payload: TargetItem = {
        id: targetId,
        userId: profile.uid,
        userName: formUserName,
        month: formMonth,
        year: Number(formYear),
        targetSales: Number(formTargetSales) || 0,
        targetCollection: Number(formTargetCollection) || 0,
        achievedSales: Number(formAchievedSales) || 0,
        achievedCollection: Number(formAchievedCollection) || 0,
        ownerId: profile.uid,
        isArchived: false,
      };

      await setDoc(doc(db, 'targets', targetId), payload);
      await logAudit(
        editingTarget ? 'UPDATE' : 'CREATE',
        'targets',
        targetId,
        `Target for ${payload.userName} (${payload.month} ${payload.year})`,
        profile
      );

      setShowAddModal(false);
      setEditingTarget(null);
    } catch (err) {
      console.error('Error saving target:', err);
    }
  };

  const handleDelete = async (item: TargetItem) => {
    if (window.confirm(t.confirmDelete)) {
      await softDeleteRecord('targets', item.id, item, profile);
    }
  };

  const openEdit = (item: TargetItem) => {
    setEditingTarget(item);
    setFormMonth(item.month);
    setFormYear(item.year);
    setFormUserName(item.userName);
    setFormTargetSales(String(item.targetSales));
    setFormTargetCollection(String(item.targetCollection));
    setFormAchievedSales(String(item.achievedSales));
    setFormAchievedCollection(String(item.achievedCollection));
    setShowAddModal(true);
  };

  const filtered = targets.filter(item => {
    const matchesSearch = item.userName.toLowerCase().includes(search.toLowerCase()) || item.month.toLowerCase().includes(search.toLowerCase());
    const matchesMonth = selectedMonth === 'All' || item.month === selectedMonth;
    return matchesSearch && matchesMonth;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Target className="w-6 h-6 text-blue-600" />
            {t.targetSheet}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">मासिक विक्री व कलेक्शन उद्दिष्टे व्यवस्थापन</p>
        </div>

        <button
          onClick={() => {
            setEditingTarget(null);
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>{t.addNew} टार्गेट</span>
        </button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="नाव किंवा महिना शोधा..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">कोणतेही टार्गेट उपलब्ध नाही</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item) => {
            const salesPercent = item.targetSales > 0 ? Math.min(100, Math.round((item.achievedSales / item.targetSales) * 100)) : 0;
            const collectionPercent = item.targetCollection > 0 ? Math.min(100, Math.round((item.achievedCollection / item.targetCollection) * 100)) : 0;

            return (
              <div key={item.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 hover:border-blue-200 transition">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                      {item.month} {item.year}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{item.userName}</h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => openEdit(item)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"><Edit3 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(item)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-medium">विक्री उद्दिष्ट (Sales):</span>
                    <span className="font-bold text-slate-800">₹{item.achievedSales.toLocaleString()} / ₹{item.targetSales.toLocaleString()} ({salesPercent}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${salesPercent}%` }} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-medium">कलेक्शन उद्दिष्ट:</span>
                    <span className="font-bold text-slate-800">₹{item.achievedCollection.toLocaleString()} / ₹{item.targetCollection.toLocaleString()} ({collectionPercent}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div className="h-full bg-teal-500 rounded-full" style={{ width: `${collectionPercent}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">{editingTarget ? 'टार्गेट अपडेट करा' : 'नवीन टार्गेट जोडा'}</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">कर्मचारी नाव</label>
                <input type="text" required value={formUserName} onChange={(e) => setFormUserName(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">महिना</label>
                  <select value={formMonth} onChange={(e) => setFormMonth(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none">
                    <option value="October">October</option>
                    <option value="November">November</option>
                    <option value="December">December</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">वर्ष</label>
                  <input type="number" value={formYear} onChange={(e) => setFormYear(Number(e.target.value))} className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">विक्री टार्गेट (₹)</label>
                  <input type="number" required value={formTargetSales} onChange={(e) => setFormTargetSales(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">पूर्ण विक्री (₹)</label>
                  <input type="number" value={formAchievedSales} onChange={(e) => setFormAchievedSales(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">कलेक्शन टार्गेट (₹)</label>
                  <input type="number" required value={formTargetCollection} onChange={(e) => setFormTargetCollection(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">पूर्ण कलेक्शन (₹)</label>
                  <input type="number" value={formAchievedCollection} onChange={(e) => setFormAchievedCollection(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none" />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 rounded-xl border text-xs font-bold text-slate-600">{t.cancel}</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white">{t.save}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
