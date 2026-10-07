import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { UserProfile } from '../../lib/auth';
import { softDeleteRecord, logAudit } from '../../lib/dataService';
import { Language, translations } from '../../lib/i18n';
import { Users, Plus, Phone, MapPin, Trash2, X } from 'lucide-react';

interface FarmerItem {
  id: string;
  name: string;
  mobile: string;
  village: string;
  acres: number;
  crops: string;
  ownerId: string;
  isArchived?: boolean;
}

interface Props {
  profile: UserProfile;
  lang: Language;
}

export const FarmerView: React.FC<Props> = ({ profile, lang }) => {
  const t = translations[lang];
  const [farmers, setFarmers] = useState<FarmerItem[]>([]);
  const [showModal, setShowModal] = useState(false);

  // Form
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [village, setVillage] = useState('');
  const [acres, setAcres] = useState('5');
  const [crops, setCrops] = useState('Sugarcane, Soyabean');

  useEffect(() => {
    const q = query(collection(db, 'farmers'));
    const unsub = onSnapshot(q, (snap) => {
      const list: FarmerItem[] = [];
      snap.forEach(d => {
        const data = d.data() as FarmerItem;
        if (!data.isArchived) list.push({ id: d.id, ...data });
      });
      setFarmers(list);
    });
    return () => unsub();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = `farmer_${Date.now()}`;
    const newItem: FarmerItem = {
      id,
      name: name.trim(),
      mobile: mobile.trim(),
      village: village.trim() || 'Baramati',
      acres: Number(acres) || 2,
      crops: crops.trim(),
      ownerId: profile.uid,
      isArchived: false,
    };

    await setDoc(doc(db, 'farmers', id), newItem);
    await logAudit('CREATE', 'farmers', id, `Added farmer ${newItem.name}`, profile);

    setShowModal(false);
    setName('');
    setMobile('');
  };

  const handleDelete = async (item: FarmerItem) => {
    if (window.confirm(t.confirmDelete)) {
      await softDeleteRecord('farmers', item.id, item, profile);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" />
            {t.farmers} (शेतकरी मतदारसंघ / नेटवर्क)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">शेतकऱ्यांची नोंदणी, जमीन व पिकांची माहिती</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>नवीन शेतकरी जोडा</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {farmers.map(f => (
          <div key={f.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  {f.village}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">{f.name}</h3>
              </div>
              <button onClick={() => handleDelete(f)} className="text-slate-400 hover:text-rose-600 p-1">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1 text-xs text-slate-600 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{f.mobile}</span>
              </div>
              <p>जमीन: <strong>{f.acres} एकर</strong></p>
              <p>प्रमुख पिके: <strong className="text-slate-800">{f.crops}</strong></p>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">नवीन शेतकरी जोडा</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">शेतकऱ्याचे नाव *</label>
                <input
                  type="text"
                  required
                  placeholder="उदा. रमेश बाळकृष्ण पाटील"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">मोबाईल नंबर *</label>
                <input
                  type="tel"
                  required
                  placeholder="10 अंकी मोबाईल क्रमांक"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">गाव</label>
                  <input
                    type="text"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">क्षेत्र (एकर)</label>
                  <input
                    type="number"
                    value={acres}
                    onChange={(e) => setAcres(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">प्रमुख पिके</label>
                <input
                  type="text"
                  placeholder="उदा. ऊस, सोयाबीन, कांदा"
                  value={crops}
                  onChange={(e) => setCrops(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border text-xs font-bold text-slate-600 hover:bg-slate-50">{t.cancel}</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-sm">{t.save}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
