import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { UserProfile } from '../../lib/auth';
import { logAudit } from '../../lib/dataService';
import { Language, translations } from '../../lib/i18n';
import { FileText, Search, Plus, Edit3, Trash2, X, CheckCircle2 } from 'lucide-react';

interface PriceItem {
  id: string;
  groupName: string; // Group A, Specialty Grades, Group B, Group C
  code: string;
  name: string;
  hsn: string;
  packingSize: string;
  rate: number;
  gstRate: number;
  mrp: number;
  inStock: boolean;
  isArchived?: boolean;
}

interface Props {
  profile: UserProfile;
  lang: Language;
}

export const PriceListView: React.FC<Props> = ({ profile, lang }) => {
  const t = translations[lang];
  const [items, setItems] = useState<PriceItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<PriceItem | null>(null);

  // Form
  const [groupName, setGroupName] = useState('Group A - Water Soluble Fertilizers');
  const [code, setCode] = useState('A 1.');
  const [name, setName] = useState('Airawat 19:19:19');
  const [hsn, setHsn] = useState('31052000');
  const [packingSize, setPackingSize] = useState('25 Kg');
  const [rate, setRate] = useState('3710');
  const [gstRate, setGstRate] = useState('5');
  const [mrp, setMrp] = useState('4960');

  useEffect(() => {
    const q = query(collection(db, 'products_pricelist'));
    const unsub = onSnapshot(q, (snap) => {
      const list: PriceItem[] = [];
      snap.forEach(d => {
        const data = d.data() as PriceItem;
        if (!data.isArchived) list.push({ id: d.id, ...data });
      });

      // If empty, seed master price list from PDF data
      if (list.length === 0) {
        seedMasterPriceList(profile);
      } else {
        setItems(list);
      }
    });
    return () => unsub();
  }, [profile]);

  const seedMasterPriceList = async (user: UserProfile) => {
    const defaultPrices: Omit<PriceItem, 'id'>[] = [
      { groupName: 'Group A - Water Soluble Fertilizers', code: 'A 1.', name: 'Airawat 19:19:19', hsn: '31052000', packingSize: '25 Kg', rate: 3710, gstRate: 5, mrp: 4960, inStock: true },
      { groupName: 'Group A - Water Soluble Fertilizers', code: 'A 2.', name: 'Airawat 13:40:13', hsn: '31052000', packingSize: '25 Kg', rate: 4525, gstRate: 5, mrp: 6400, inStock: true },
      { groupName: 'Group A - Water Soluble Fertilizers', code: 'A 3.', name: 'Airawat 12:61:0', hsn: '31054000', packingSize: '25 Kg', rate: 4880, gstRate: 5, mrp: 6940, inStock: true },
      { groupName: 'Group A - Water Soluble Fertilizers', code: 'A 4.', name: 'Airawat 0:52:34', hsn: '31056000', packingSize: '25 Kg', rate: 5750, gstRate: 5, mrp: 7930, inStock: true },
      { groupName: 'Group A - Water Soluble Fertilizers', code: 'A 5.', name: 'Airawat 13:0:45', hsn: '31059010', packingSize: '25 Kg', rate: 4240, gstRate: 5, mrp: 5860, inStock: true },
      { groupName: 'Group A - Water Soluble Fertilizers', code: 'A 7.', name: 'Airawat Calcium Nitrate', hsn: '31026000', packingSize: '1 Kg * 25 Nos', rate: 135, gstRate: 5, mrp: 325, inStock: true },
      { groupName: 'Specialty Grades', code: 'S 1.', name: 'Airawat 00:42:47 + Fe', hsn: '31054000', packingSize: '2.5 Kg', rate: 1375, gstRate: 5, mrp: 2530, inStock: true },
      { groupName: 'Specialty Grades', code: 'S 2.', name: 'Airawat 14:48:00 + Mg', hsn: '31052000', packingSize: '2.5 Kg', rate: 890, gstRate: 5, mrp: 2170, inStock: true },
      { groupName: 'Specialty Grades', code: 'S 3.', name: 'Airawat 05:55:17 + Zn + B', hsn: '31053000', packingSize: '2.5 Kg', rate: 950, gstRate: 5, mrp: 2350, inStock: true },
      { groupName: 'Group B - Micronutrients', code: 'B 1.', name: 'Microgrip MH Grade No. II', hsn: '28332990', packingSize: '1 ltr', rate: 317, gstRate: 5, mrp: 577, inStock: true },
      { groupName: 'Group B - Micronutrients', code: 'B 8.', name: 'PoMag (K & Mg Oxide)', hsn: '31052000', packingSize: '1 Kg', rate: 1005, gstRate: 5, mrp: 1783, inStock: true },
      { groupName: 'Group C - Plant Growth Regulators', code: 'C 1.', name: 'BioVinS2 Humic Acid 12%', hsn: '31010099', packingSize: '1 ltr', rate: 318, gstRate: 5, mrp: 469, inStock: true },
      { groupName: 'Group C - Plant Growth Regulators', code: 'C 3.', name: '4 Star Combo Kit', hsn: '31010099', packingSize: '2 kg', rate: 820, gstRate: 5, mrp: 1495, inStock: true },
    ];

    for (const item of defaultPrices) {
      const id = `price_${Math.random().toString(36).slice(2, 9)}`;
      await setDoc(doc(db, 'products_pricelist', id), { id, ...item, isArchived: false });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = editingItem ? editingItem.id : `price_${Date.now()}`;
    const payload: PriceItem = {
      id,
      groupName,
      code: code.trim(),
      name: name.trim(),
      hsn: hsn.trim(),
      packingSize: packingSize.trim(),
      rate: Number(rate) || 0,
      gstRate: Number(gstRate) || 5,
      mrp: Number(mrp) || 0,
      inStock: true,
      isArchived: false,
    };

    await setDoc(doc(db, 'products_pricelist', id), payload);
    await logAudit(editingItem ? 'UPDATE' : 'CREATE', 'products_pricelist', id, `Updated price for ${payload.name} (Rate: ₹${payload.rate})`, profile);

    setShowModal(false);
    setEditingItem(null);
  };

  const filtered = items.filter(i => {
    const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase()) || i.code.toLowerCase().includes(search.toLowerCase());
    const matchesGroup = selectedGroup === 'All' || i.groupName === selectedGroup;
    return matchesSearch && matchesGroup;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-sky-600" />
            {t.priceList} (01/10/2026 ते 31/10/2026)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">ॲपमधून थेट प्राईस लिस्ट अपडेट व मॅनेज करण्याची सुविधा</p>
        </div>

        {(profile.role === 'admin' || profile.role === 'owner') && (
          <button
            onClick={() => { setEditingItem(null); setShowModal(true); }}
            className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>नवीन दर जोडा / बदला</span>
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="उत्पादन किंवा कोड शोधा..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none"
          />
        </div>
        <select
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none"
        >
          <option value="All">सर्व ग्रुप (All Groups)</option>
          <option value="Group A - Water Soluble Fertilizers">Group A - Water Soluble</option>
          <option value="Specialty Grades">Specialty Grades</option>
          <option value="Group B - Micronutrients">Group B - Micronutrients</option>
          <option value="Group C - Plant Growth Regulators">Group C - Regulators</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
              <th className="p-3">Sr.No</th>
              <th className="p-3">Product Name</th>
              <th className="p-3">HSN</th>
              <th className="p-3">Packing Size</th>
              <th className="p-3">Rate (₹)</th>
              <th className="p-3">GST</th>
              <th className="p-3">MRP (₹)</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(item => (
              <tr key={item.id} className="hover:bg-slate-50">
                <td className="p-3 font-bold text-sky-600">{item.code}</td>
                <td className="p-3 font-semibold text-slate-900">{item.name}</td>
                <td className="p-3 text-slate-500 font-mono text-[11px]">{item.hsn}</td>
                <td className="p-3 text-slate-700">{item.packingSize}</td>
                <td className="p-3 font-bold text-slate-900">₹{item.rate}/-</td>
                <td className="p-3 text-slate-600">{item.gstRate}%</td>
                <td className="p-3 font-bold text-emerald-700">₹{item.mrp}/-</td>
                <td className="p-3 text-right">
                  {(profile.role === 'admin' || profile.role === 'owner') && (
                    <button
                      onClick={() => {
                        setEditingItem(item);
                        setGroupName(item.groupName);
                        setCode(item.code);
                        setName(item.name);
                        setHsn(item.hsn);
                        setPackingSize(item.packingSize);
                        setRate(String(item.rate));
                        setGstRate(String(item.gstRate));
                        setMrp(String(item.mrp));
                        setShowModal(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-sky-600"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">{editingItem ? 'दर अपडेट करा' : 'नवीन उत्पादन दर जोडा'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">ग्रुप (Group Category)</label>
                <select value={groupName} onChange={(e) => setGroupName(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none">
                  <option value="Group A - Water Soluble Fertilizers">Group A - Water Soluble Fertilizers</option>
                  <option value="Specialty Grades">Specialty Grades</option>
                  <option value="Group B - Micronutrients">Group B - Micronutrients</option>
                  <option value="Group C - Plant Growth Regulators">Group C - Plant Growth Regulators</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">कोड (Sr.No)</label>
                  <input type="text" required value={code} onChange={(e) => setCode(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">एचएसएन (HSN)</label>
                  <input type="text" required value={hsn} onChange={(e) => setHsn(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">उत्पादनाचे नाव (Product Name)</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none" />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">पॅक साईझ (Packing Size)</label>
                <input type="text" required value={packingSize} onChange={(e) => setPackingSize(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none" />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Rate (₹)</label>
                  <input type="number" required value={rate} onChange={(e) => setRate(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">GST %</label>
                  <input type="number" required value={gstRate} onChange={(e) => setGstRate(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">MRP (₹)</label>
                  <input type="number" required value={mrp} onChange={(e) => setMrp(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none" />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border text-xs font-bold text-slate-600">{t.cancel}</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-xs font-bold text-white">{t.save}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
