import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { UserProfile } from '../../lib/auth';
import { logAudit } from '../../lib/dataService';
import { Language, translations } from '../../lib/i18n';
import { FileText, Search, Plus, Edit3, Trash2, X, CheckCircle2, Printer, Upload, Loader2 } from 'lucide-react';

import * as XLSX from 'xlsx';

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

  const handlePrint = () => {
    window.print();
  };

  // Form
  const [groupName, setGroupName] = useState('Group A - Water Soluble Fertilizers');
  const [code, setCode] = useState('A 1.');
  const [name, setName] = useState('Airawat 19:19:19');
  const [hsn, setHsn] = useState('31052000');
  const [packingSize, setPackingSize] = useState('25 Kg');
  const [rate, setRate] = useState('3710');
  const [gstRate, setGstRate] = useState('5');
  const [mrp, setMrp] = useState('4960');

  const [logoUrl, setLogoUrl] = useState<string>('');
  const [logoSize, setLogoSize] = useState<number>(80);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Send to Gemini API for exact extraction from PDF/Excel
      const response = await fetch('/api/parse-pricelist', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to parse price list');
      }

      const parsedItems = await response.json();
      
      if (parsedItems && Array.isArray(parsedItems)) {
        let updateCount = 0;
        let createCount = 0;

        for (const item of parsedItems) {
          // Generate a stable ID based on Name and Packing to avoid duplicates and support updates
          // This ensures that re-uploading the same product updates the existing record
          const sanitizedName = item.name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_');
          const sanitizedPacking = item.packingSize.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_');
          const stableId = `price_${sanitizedName}_${sanitizedPacking}`;

          const payload: PriceItem = {
            id: stableId,
            groupName: item.groupName || 'General',
            code: item.code || '-',
            name: item.name.toUpperCase().trim(),
            hsn: item.hsn || '-',
            packingSize: item.packingSize.trim(),
            rate: Number(item.rate) || 0,
            gstRate: Number(item.gstRate) || 5,
            mrp: Number(item.mrp) || 0,
            inStock: true,
            isArchived: false,
          };

          // Check if it exists in local state to count creates vs updates (optional but good for UX)
          const exists = items.some(i => i.id === stableId);
          if (exists) updateCount++; else createCount++;

          await setDoc(doc(db, 'products_pricelist', stableId), payload, { merge: true });
        }
        
        await logAudit('CREATE', 'products_pricelist', 'batch_upload', `Imported price list: ${createCount} new, ${updateCount} updated items`, profile);
        alert(`Process Complete!\n- New Products: ${createCount}\n- Updated: ${updateCount}\n\nData is strictly based on the uploaded file.`);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      alert('Error parsing file: ' + error.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    // Fetch branding config
    const unsubBranding = onSnapshot(doc(db, 'config', 'branding'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setLogoUrl(data.logoUrl || '');
        setLogoSize(data.logoSize || 80);
      }
    });
    return () => unsubBranding();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'products_pricelist'));
    const unsub = onSnapshot(q, (snap) => {
      const list: PriceItem[] = [];
      snap.forEach(d => {
        const data = d.data() as PriceItem;
        if (!data.isArchived) list.push({ ...data, id: d.id });
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

  const groups = ['All', ...Array.from(new Set(items.map(i => i.groupName)))];

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
            Product Price List (October 2026)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage product rates, HSN, GST, and MRP directly from the app</p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf,.xlsx,.xls,image/*"
            className="hidden"
          />
          
          {(profile.role === 'admin' || profile.role === 'owner') && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm no-print disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Upload List</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={handlePrint}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm no-print"
          >
            <Printer className="w-4 h-4" />
            <span>Print List</span>
          </button>
          
          {(profile.role === 'admin' || profile.role === 'owner') && (
            <button
              onClick={() => { setEditingItem(null); setShowModal(true); }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm no-print"
            >
              <Plus className="w-4 h-4" />
              <span>Add / Update Price</span>
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search product or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none"
          />
        </div>

        {/* Category Tabs (Page Selection) */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {groups.map(group => (
            <button
              key={group}
              onClick={() => setSelectedGroup(group)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedGroup === group
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-100 scale-105'
                  : 'bg-white text-slate-500 border border-slate-200 hover:border-sky-300'
              }`}
            >
              {group === 'All' ? 'View All' : group}
            </button>
          ))}
        </div>
      </div>

      {/* Page Header (Category Title) */}
      {selectedGroup !== 'All' && (
        <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl flex justify-between items-center shadow-lg">
          <h3 className="text-sm font-black uppercase tracking-widest">{selectedGroup}</h3>
          <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">{filtered.length} Products</span>
        </div>
      )}

      <div className="space-y-12 pb-24">
        {groups.filter(g => selectedGroup === 'All' || g === selectedGroup).map(group => {
          if (group === 'All') return null;
          const groupItems = filtered.filter(i => i.groupName === group);
          if (groupItems.length === 0) return null;

          return (
            <div key={group} className="space-y-6 print:break-before-page">
              {/* Section Header */}
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-slate-200"></div>
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] px-4 py-2 bg-slate-50 rounded-full border border-slate-200 shadow-sm">
                  {group}
                </h2>
                <div className="h-px flex-1 bg-slate-200"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupItems.map(item => (
                  <div 
                    key={item.id} 
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden group flex flex-col"
                  >
                    {/* Card Header: Group & Code */}
                    <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider truncate max-w-[70%]">
                        {item.groupName}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded">
                        {item.code}
                      </span>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 flex-1 space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="text-sm font-black text-slate-900 uppercase leading-tight group-hover:text-sky-600 transition-colors">
                          {item.name}
                        </h3>
                        <div className="shrink-0 text-right">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Packing</span>
                          <span className="text-xs font-black text-slate-900">{item.packingSize}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-50">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Rate (Basic)</span>
                          <span className="text-base font-black text-slate-900">₹{item.rate}/-</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">MRP</span>
                          <span className="text-base font-black text-emerald-600">₹{item.mrp}/-</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2 bg-slate-50/50 -mx-4 -mb-4 px-4 py-2 border-t border-slate-100">
                        <div className="flex gap-3">
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase mr-1">HSN:</span>
                            <span className="text-[9px] font-mono font-bold text-slate-600">{item.hsn}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase mr-1">GST:</span>
                            <span className="text-[9px] font-black text-slate-600">{item.gstRate}%</span>
                          </div>
                        </div>

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
                            className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-white rounded-lg transition-all"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-slate-300">
            <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No products found</p>
            <p className="text-slate-300 text-xs mt-1">Try uploading a new Price List or check your search</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-slate-900">{editingItem ? 'Update Rate' : 'Add New Product Rate'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Group Category</label>
                <select value={groupName} onChange={(e) => setGroupName(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none">
                  <option value="Group A - Water Soluble Fertilizers">Group A - Water Soluble Fertilizers</option>
                  <option value="Specialty Grades">Specialty Grades</option>
                  <option value="Group B - Micronutrients">Group B - Micronutrients</option>
                  <option value="Group C - Plant Growth Regulators">Group C - Plant Growth Regulators</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Code / Sr.No</label>
                  <input type="text" required value={code} onChange={(e) => setCode(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">HSN Code</label>
                  <input type="text" required value={hsn} onChange={(e) => setHsn(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Product Name</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none" />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Packing Size</label>
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
