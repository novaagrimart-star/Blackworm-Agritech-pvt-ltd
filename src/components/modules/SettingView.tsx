import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { UserProfile } from '../../lib/auth';
import { restoreRecord, DeletedRecordItem, AuditLogItem } from '../../lib/dataService';
import { Language, translations } from '../../lib/i18n';
import { Settings, Trash2, RotateCcw, ShieldAlert, History, Globe, HardDrive } from 'lucide-react';

interface Props {
  profile: UserProfile;
  lang: Language;
  setLang: (l: Language) => void;
}

export const SettingView: React.FC<Props> = ({ profile, lang, setLang }) => {
  const t = translations[lang];
  const [deletedItems, setDeletedItems] = useState<DeletedRecordItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [activeTab, setActiveTab] = useState<'trash' | 'audit' | 'general'>('trash');

  useEffect(() => {
    // 1. Fetch Recycle Bin
    const qTrash = query(collection(db, 'deleted_records'));
    const unsubTrash = onSnapshot(qTrash, (snap) => {
      const list: DeletedRecordItem[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as DeletedRecordItem));
      setDeletedItems(list);
    });

    // 2. Fetch Audit Logs
    const qAudit = query(collection(db, 'audit_logs'));
    const unsubAudit = onSnapshot(qAudit, (snap) => {
      const list: AuditLogItem[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as AuditLogItem));
      setAuditLogs(list.reverse()); // latest first
    });

    return () => {
      unsubTrash();
      unsubAudit();
    };
  }, []);

  const handleRestore = async (item: DeletedRecordItem) => {
    if (window.confirm('हा डेटा पुन्हा रिस्टोअर (पुनर्प्राप्त) करायचा का?')) {
      await restoreRecord(item, profile);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-slate-700" />
            {t.setting} & डेटा रिकव्हरी
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">रिसायकल बिन, ऑडिट लॉग्स आणि भाषा सेटिंग्ज</p>
        </div>

        {/* Language switch */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setLang('mr')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${lang === 'mr' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
          >
            मराठी
          </button>
          <button
            onClick={() => setLang('en')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${lang === 'en' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
          >
            English
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('trash')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'trash' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
        >
          <Trash2 className="w-4 h-4" />
          <span>रिसायकल बिन (Trash: {deletedItems.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'audit' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
        >
          <History className="w-4 h-4" />
          <span>ऑडिट लॉग्स ({auditLogs.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'general' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
        >
          <HardDrive className="w-4 h-4" />
          <span>स्टोरेज व सिंक</span>
        </button>
      </div>

      {activeTab === 'trash' && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-xs text-amber-900">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
            <span>चुकीने डिलीट झालेला कोणताही डेटा येथे सुरक्षित असतो. कधीही 'रिस्टोअर' बटनावर क्लिक करून तो पुन्हा सक्रिय करू शकता.</span>
          </div>

          {deletedItems.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <Trash2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700">रिसायकल बिन रिकामी आहे</p>
              <p className="text-xs text-slate-400 mt-1">कोणताही डेटा डिलीट केलेला नाही.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {deletedItems.map(item => (
                <div key={item.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between shadow-sm">
                  <div>
                    <span className="text-[10px] font-bold bg-rose-50 text-rose-700 px-2 py-0.5 rounded uppercase">
                      {item.originalCollection}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">
                      {item.data.name || item.data.shopName || item.data.title || item.originalRecordId}
                    </h4>
                    <p className="text-[11px] text-slate-400">हटवणारे: {item.deletedByName} ({new Date(item.deletedAt).toLocaleString()})</p>
                  </div>
                  <button
                    onClick={() => handleRestore(item)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>रिस्टोअर</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700">
            सिस्टम ऑपरेशन्स ऑडिट ट्रेल (System Audit History)
          </div>
          <div className="divide-y divide-slate-100 max-h-[60vh] overflow-y-auto text-xs">
            {auditLogs.map(log => (
              <div key={log.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.action === 'CREATE' ? 'bg-emerald-50 text-emerald-700' :
                      log.action === 'UPDATE' ? 'bg-blue-50 text-blue-700' :
                      log.action === 'RESTORE' ? 'bg-purple-50 text-purple-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {log.action}
                    </span>
                    <span className="font-bold text-slate-800">{log.collection}</span>
                  </div>
                  <p className="text-slate-600 mt-1">{log.recordSummary}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">द्वारे: {log.performedByName}</p>
                </div>
                <span className="text-[11px] text-slate-400 shrink-0">{new Date(log.timestamp).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'general' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-900">सिस्टम आणि डेटाबेस माहिती</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl space-y-1">
              <span className="text-slate-400 block">फायरस्टोअर डेटाबेस</span>
              <span className="font-bold text-slate-800">ai-studio-coresyncbusiness</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl space-y-1">
              <span className="text-slate-400 block">रिअल-टाइम सिंक</span>
              <span className="font-bold text-emerald-600">सक्रिय (Active across all devices)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
