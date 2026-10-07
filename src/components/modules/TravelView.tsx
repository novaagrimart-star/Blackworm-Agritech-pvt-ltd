import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { UserProfile } from '../../lib/auth';
import { softDeleteRecord, logAudit } from '../../lib/dataService';
import { Language, translations } from '../../lib/i18n';
import { MapPin, Plus, Calendar, Trash2, X } from 'lucide-react';

interface TravelItem {
  id: string;
  userId: string;
  userName: string;
  date: string;
  startLocation: string;
  endLocation: string;
  kmTravelled: number;
  totalExpense: number;
  purpose: string;
  status: 'submitted' | 'approved' | 'reimbursed';
  isArchived?: boolean;
}

interface Props {
  profile: UserProfile;
  lang: Language;
}

export const TravelView: React.FC<Props> = ({ profile, lang }) => {
  const t = translations[lang];
  const [travels, setTravels] = useState<TravelItem[]>([]);
  const [showModal, setShowModal] = useState(false);

  // Form
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [startLocation, setStartLocation] = useState('Pune Office');
  const [endLocation, setEndLocation] = useState('Baramati Dealers');
  const [kmTravelled, setKmTravelled] = useState('85');
  const [daFoodExpense, setDaFoodExpense] = useState('250');
  const [purpose, setPurpose] = useState('Dealer visits & farmer meeting');

  useEffect(() => {
    const q = query(collection(db, 'travel_records'));
    const unsub = onSnapshot(q, (snap) => {
      const list: TravelItem[] = [];
      snap.forEach(d => {
        const data = d.data() as TravelItem;
        if (!data.isArchived) list.push({ id: d.id, ...data });
      });
      setTravels(list);
    });
    return () => unsub();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = `travel_${Date.now()}`;
    const km = Number(kmTravelled) || 0;
    const kmRate = 3.5;
    const fuel = km * kmRate;
    const food = Number(daFoodExpense) || 0;
    const total = fuel + food;

    const newItem: TravelItem = {
      id,
      userId: profile.uid,
      userName: profile.name,
      date,
      startLocation: startLocation.trim(),
      endLocation: endLocation.trim(),
      kmTravelled: km,
      totalExpense: total,
      purpose: purpose.trim(),
      status: 'submitted',
      isArchived: false,
    };

    await setDoc(doc(db, 'travel_records', id), newItem);
    await logAudit('CREATE', 'travel_records', id, `Added travel log ${date} (${km} KM)`, profile);

    setShowModal(false);
  };

  const handleDelete = async (item: TravelItem) => {
    if (window.confirm(t.confirmDelete)) {
      await softDeleteRecord('travel_records', item.id, item, profile);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-amber-600" />
            {t.travel} (दैनिक प्रवास व टीए/डीए)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">किलोमीटर प्रवास, इंधन आणि दैनिक भत्ता क्लेम</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>नवीन प्रवास नोंदवा</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {travels.map(item => (
          <div key={item.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                {item.date}
              </span>
              <button onClick={() => handleDelete(item)} className="text-slate-400 hover:text-rose-600 p-1">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <h3 className="text-sm font-bold text-slate-900">{item.userName}</h3>
            <p className="text-xs text-slate-600">प्रवास: <strong>{item.startLocation} ➔ {item.endLocation}</strong></p>
            <p className="text-xs text-slate-500">उद्देश: {item.purpose}</p>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100 text-xs">
              <span>{item.kmTravelled} KM (₹3.5/km)</span>
              <span className="font-bold text-amber-800">एकूण: ₹{item.totalExpense}</span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">दैनिक प्रवास नोंदवा</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">दिनांक</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">कुठून (Start)</label>
                  <input
                    type="text"
                    required
                    value={startLocation}
                    onChange={(e) => setStartLocation(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">कुठे (End)</label>
                  <input
                    type="text"
                    required
                    value={endLocation}
                    onChange={(e) => setEndLocation(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">एकूण किमी (KM)</label>
                  <input
                    type="number"
                    required
                    value={kmTravelled}
                    onChange={(e) => setKmTravelled(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">जेवण/इतर भत्ता (₹)</label>
                  <input
                    type="number"
                    value={daFoodExpense}
                    onChange={(e) => setDaFoodExpense(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">भेट देण्याचा उद्देश</label>
                <input
                  type="text"
                  required
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border text-xs font-bold text-slate-600 hover:bg-slate-50">{t.cancel}</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-xs font-bold text-white shadow-sm">{t.save}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
