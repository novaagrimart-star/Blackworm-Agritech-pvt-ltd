import React, { useState, useEffect } from 'react';
import { 
  Target, 
  User as UserIcon, 
  ShoppingBag, 
  Calculator, 
  FileText, 
  Users, 
  MapPin, 
  Gift, 
  BarChart3, 
  Settings, 
  LogOut,
  ArrowLeft,
  Sprout
} from 'lucide-react';
import { cn } from '../lib/utils';
import { auth } from '../firebase';
import { UserProfile } from '../lib/auth';
import { Language, translations } from '../lib/i18n';
import { seedInitialDataIfEmpty } from '../lib/dataService';
import { PWAInstallButton } from './PWAInstallButton';
import { OfflineIndicator } from './OfflineIndicator';

import { TargetSheetView } from './modules/TargetSheetView';
import { UserManagementView } from './modules/UserManagementView';
import { OrderCollectionView } from './modules/OrderCollectionView';
import { OrderCalculatorView } from './modules/OrderCalculatorView';
import { PriceListView } from './modules/PriceListView';
import { DealerView } from './modules/DealerView';
import { TravelView } from './modules/TravelView';
import { SchemeView } from './modules/SchemeView';
import { ReportView } from './modules/ReportView';
import { SettingView } from './modules/SettingView';
import { FarmerView } from './modules/FarmerView';

interface DashboardProps {
  profile: UserProfile;
  lang: Language;
  setLang: (l: Language) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ profile, lang, setLang }) => {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  useEffect(() => {
    seedInitialDataIfEmpty(profile);
  }, [profile]);

  const modules = [
    { id: 'target', label: t.targetSheet, icon: Target, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'user', label: t.user, icon: UserIcon, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { id: 'order', label: t.orderCollection, icon: ShoppingBag, color: 'text-purple-500', bg: 'bg-purple-50' },
    { id: 'calculator', label: t.orderCalculator, icon: Calculator, color: 'text-teal-500', bg: 'bg-teal-50' },
    { id: 'price', label: t.priceList, icon: FileText, color: 'text-sky-500', bg: 'bg-sky-50' },
    { id: 'dealer', label: t.dealer, icon: Users, color: 'text-rose-500', bg: 'bg-rose-50' },
    { id: 'travel', label: t.travel, icon: MapPin, color: 'text-amber-500', bg: 'bg-amber-50' },
    { id: 'scheme', label: t.scheme, icon: Gift, color: 'text-fuchsia-500', bg: 'bg-fuchsia-50' },
    { id: 'report', label: t.report, icon: BarChart3, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { id: 'setting', label: t.setting, icon: Settings, color: 'text-slate-500', bg: 'bg-slate-50' },
    { id: 'farmer', label: t.farmers, icon: Sprout, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'target': return <TargetSheetView profile={profile} lang={lang} />;
      case 'user': return <UserManagementView profile={profile} lang={lang} />;
      case 'order': return <OrderCollectionView profile={profile} lang={lang} />;
      case 'calculator': return <OrderCalculatorView profile={profile} lang={lang} />;
      case 'price': return <PriceListView profile={profile} lang={lang} />;
      case 'dealer': return <DealerView profile={profile} lang={lang} />;
      case 'travel': return <TravelView profile={profile} lang={lang} />;
      case 'scheme': return <SchemeView profile={profile} lang={lang} />;
      case 'report': return <ReportView profile={profile} lang={lang} />;
      case 'setting': return <SettingView profile={profile} lang={lang} setLang={setLang} />;
      case 'farmer': return <FarmerView profile={profile} lang={lang} />;
      default:
        return (
          <div className="space-y-6">
            {/* User Info Bar */}
            <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-slate-200 flex items-center justify-between mx-auto max-w-2xl">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                  {profile.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">{profile.name}</h3>
                  <span className="text-[10px] text-slate-400 capitalize font-medium">({profile.role})</span>
                </div>
              </div>
              <PWAInstallButton />
            </div>

            {/* Main 3-Column Grid */}
            <div className="grid grid-cols-3 gap-3 max-w-2xl mx-auto">
              {modules.map((module) => (
                <button
                  key={module.id}
                  onClick={() => setActiveTab(module.id)}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white border border-slate-100 hover:border-slate-300 hover:shadow-md transition-all active:scale-95 group"
                >
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm", module.bg)}>
                    <module.icon className={cn("w-6 h-6", module.color)} />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-700 text-center leading-tight">
                    {module.label}
                  </span>
                </button>
              ))}
              
              {/* Logout Button */}
              <button
                onClick={() => auth.signOut()}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white border border-slate-100 hover:border-rose-200 hover:shadow-md transition-all active:scale-95 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                  <LogOut className="w-6 h-6 text-rose-500" />
                </div>
                <span className="text-[11px] font-semibold text-slate-700 text-center leading-tight">
                  {t.logout}
                </span>
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2.5">
          {activeTab !== 'dashboard' && (
            <button
              onClick={() => setActiveTab('dashboard')}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="w-9 h-9 bg-rose-600 rounded-xl flex items-center justify-center shadow-sm shrink-0">
            <span className="text-white font-black text-base">BA</span>
          </div>
          <h1 className="text-sm font-black text-rose-600 tracking-tight whitespace-nowrap">
            BLACKWORM AGRITECH PVT LTD
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === 'mr' ? 'en' : 'mr')}
            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700 transition flex items-center gap-1"
            title="Switch Language (मराठी / English)"
          >
            <span>{lang === 'mr' ? '文A मराठी' : 'A文 English'}</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="px-4 py-6 flex-1 max-w-4xl mx-auto w-full">
        {renderContent()}
      </main>

      <OfflineIndicator />

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-2 flex justify-between items-center z-20 shadow-lg">
        <NavItem 
          icon={BarChart3} 
          label={t.dashboard} 
          active={activeTab === 'dashboard'} 
          onClick={() => setActiveTab('dashboard')} 
        />
        <NavItem 
          icon={Target} 
          label={t.target} 
          active={activeTab === 'target'} 
          onClick={() => setActiveTab('target')} 
        />
        <NavItem 
          icon={ShoppingBag} 
          label={t.orders} 
          active={activeTab === 'order'} 
          onClick={() => setActiveTab('order')} 
        />
        <NavItem 
          icon={Users} 
          label={t.dealer} 
          active={activeTab === 'dealer'} 
          onClick={() => setActiveTab('dealer')} 
        />
        <NavItem 
          icon={MapPin} 
          label={t.travel} 
          active={activeTab === 'travel'} 
          onClick={() => setActiveTab('travel')} 
        />
      </nav>
    </div>
  );
};

interface NavItemProps {
  icon: any;
  label: string;
  active?: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon: Icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex flex-col items-center gap-1 min-w-[56px] transition-colors relative py-1",
      active ? "text-rose-600" : "text-slate-400 hover:text-slate-600"
    )}
  >
    <Icon className="w-5 h-5" />
    <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    {active && <div className="w-1.5 h-1.5 bg-rose-600 rounded-full absolute bottom-0" />}
  </button>
);
