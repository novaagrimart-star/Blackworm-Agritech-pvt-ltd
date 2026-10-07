import React from 'react';
import { exportAllData } from '../../lib/dataService';
import { Language, translations } from '../../lib/i18n';
import { UserProfile } from '../../lib/auth';
import { BarChart3, Download, ShieldCheck, Database, FileSpreadsheet } from 'lucide-react';

interface Props {
  profile: UserProfile;
  lang: Language;
}

export const ReportView: React.FC<Props> = ({ profile, lang }) => {
  const t = translations[lang];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            {t.report} & डेटा बॅकअप सेंटर
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">व्यवसाय अहवाल आणि संपूर्ण डेटाचा सुरक्षित JSON/CSV बॅकअप</p>
        </div>

        <button
          onClick={exportAllData}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm"
        >
          <Download className="w-4 h-4" />
          <span>{t.exportBackup}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">एकूण मासिक विक्री (Sales)</span>
          <p className="text-2xl font-black text-slate-900">₹4,85,000</p>
          <p className="text-[11px] text-emerald-600 font-semibold">+18% मागील महिन्यापेक्षा जास्त</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">एकूण पेमेंट कलेक्शन</span>
          <p className="text-2xl font-black text-slate-900">₹4,12,000</p>
          <p className="text-[11px] text-teal-600 font-semibold">85% कलेक्शन दर</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">प्रवास खर्च (Travel Claims)</span>
          <p className="text-2xl font-black text-slate-900">₹14,500</p>
          <p className="text-[11px] text-amber-600 font-semibold">12 फील्ड ट्रिप्स</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-emerald-400" />
          <div>
            <h3 className="text-base font-bold">डेटा सुरक्षा व संरक्षण हमी (Data Protection Policy)</h3>
            <p className="text-xs text-indigo-200">कोणताही डेटा आपोआप किंवा चुकीने डिलीट होत नाही. सर्व डिलीट केलेले रेकॉर्ड्स रिसायकल बिनमध्ये सुरक्षित राहतात.</p>
          </div>
        </div>
        <div className="pt-3 border-t border-indigo-800/60 flex flex-wrap gap-4 text-xs">
          <span className="flex items-center gap-1.5"><Database className="w-4 h-4 text-emerald-400" /> Centralized Firestore Cloud Sync</span>
          <span className="flex items-center gap-1.5"><FileSpreadsheet className="w-4 h-4 text-sky-400" /> Instant JSON Backup Export</span>
        </div>
      </div>
    </div>
  );
};
