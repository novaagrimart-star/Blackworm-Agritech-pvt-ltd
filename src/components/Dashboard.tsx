import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
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
  IndianRupee,
  UserPlus,
  Bike,
  ShieldCheck,
  Phone,
  Key
} from 'lucide-react';
import { cn } from '../lib/utils';
import { UserProfile } from '../lib/auth';
import { Language, translations } from '../lib/i18n';
import { seedInitialDataIfEmpty } from '../lib/dataService';
import { PWAInstallButton } from './PWAInstallButton';
import { OfflineIndicator } from './OfflineIndicator';

import { TargetSheetView } from './modules/TargetSheetView';
import { UserManagementView } from './modules/UserManagementView';
import { OrderView } from './modules/OrderView';
import { CollectionView } from './modules/CollectionView';
import { OrderCalculatorView } from './modules/OrderCalculatorView';
import { PriceListView } from './modules/PriceListView';
import { DealerView } from './modules/DealerView';
import { TravelView } from './modules/TravelView';
import { SchemeView } from './modules/SchemeView';
import { ReportView } from './modules/ReportView';
import { SettingView } from './modules/SettingView';

interface DashboardProps {
  profile: UserProfile;
  lang: Language;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ profile, lang, onLogout }) => {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [logoSize, setLogoSize] = useState<number>(80);
  const [currentUserData, setCurrentUserData] = useState<any>(profile);

  useEffect(() => {
    seedInitialDataIfEmpty(profile);
  }, [profile]);

  // Live listener for current logged-in user profile
  useEffect(() => {
    if (profile.uid) {
      const unsubUser = onSnapshot(doc(db, 'users', profile.uid), (snap) => {
        if (snap.exists()) {
          setCurrentUserData({ ...profile, ...snap.data() });
        }
      });
      return () => unsubUser();
    }
  }, [profile.uid]);

  // Branding listener from Settings
  useEffect(() => {
    const unsubBranding = onSnapshot(doc(db, 'config', 'branding'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setLogoUrl(data.logoUrl || '');
        setLogoSize(data.logoSize || 80);
      }
    });
    return () => unsubBranding();
  }, []);

  const modules = [
    { id: 'target', label: t.targetSheet, icon: Target, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'user', label: 'User Form', icon: UserPlus, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { id: 'order', label: t.orders, icon: ShoppingBag, color: 'text-purple-500', bg: 'bg-purple-50' },
    { id: 'collection', label: t.collections, icon: IndianRupee, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'calculator', label: t.orderCalculator, icon: Calculator, color: 'text-teal-500', bg: 'bg-teal-50' },
    { id: 'price', label: t.priceList, icon: FileText, color: 'text-sky-500', bg: 'bg-sky-50' },
    { id: 'dealer', label: t.dealer, icon: Users, color: 'text-rose-500', bg: 'bg-rose-50' },
    { id: 'travel', label: 'Traveling', icon: Bike, color: 'text-amber-500', bg: 'bg-amber-50' },
    { id: 'scheme', label: t.scheme, icon: Gift, color: 'text-fuchsia-500', bg: 'bg-fuchsia-50' },
    { id: 'report', label: t.report, icon: BarChart3, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { id: 'setting', label: t.setting, icon: Settings, color: 'text-slate-500', bg: 'bg-slate-50' },
  ];

  const userAllowedModules = currentUserData.role === 'owner' 
    ? null 
    : (currentUserData.allowedModules && currentUserData.allowedModules.length > 0 ? currentUserData.allowedModules : null);

  const visibleModules = modules.filter((m) => {
    if (!userAllowedModules) return true;
    return userAllowedModules.includes(m.id);
  });

  const renderContent = () => {
    switch (activeTab) {
      case 'target': return <TargetSheetView profile={currentUserData} lang={lang} />;
      case 'user': return <UserManagementView profile={currentUserData} lang={lang} />;
      case 'order': return <OrderView profile={currentUserData} lang={lang} />;
      case 'collection': return <CollectionView profile={currentUserData} lang={lang} />;
      case 'calculator': return <OrderCalculatorView profile={currentUserData} lang={lang} />;
      case 'price': return <PriceListView profile={currentUserData} lang={lang} />;
      case 'dealer': return <DealerView profile={currentUserData} lang={lang} />;
      case 'travel': return <TravelView profile={currentUserData} lang={lang} />;
      case 'scheme': return <SchemeView profile={currentUserData} lang={lang} />;
      case 'report': return <ReportView profile={currentUserData} lang={lang} />;
      case 'setting': return <SettingView profile={currentUserData} lang={lang} onLogout={onLogout} />;
      default:
        return (
          <div className="space-y-6">
            {/* Logged-In User Profile: Strictly Name and Designation in Single Line Black Color - No Boxes & No Initials Circle */}
            <div className="flex items-center gap-3 mx-auto max-w-2xl px-2">
              <div className="min-w-0 flex-1">
                <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight truncate whitespace-nowrap">
                  {currentUserData.fullName || 'OWNER'} ({currentUserData.role === 'owner' ? 'OWNER / MD' : (currentUserData.designation || currentUserData.role)})
                </h3>
              </div>
              
              <PWAInstallButton />
            </div>

            <div className="grid grid-cols-3 gap-3 max-w-2xl mx-auto">
              {visibleModules.map((module) => (
                <button
                  key={module.id}
                  onClick={() => setActiveTab(module.id)}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white border border-slate-100 hover:border-slate-300 hover:shadow-md transition-all active:scale-95 group"
                >
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm", module.bg)}>
                    <module.icon className={cn("w-6 h-6", module.color)} />
                  </div>
                  <div className="flex items-center gap-1 justify-center">
                    <span className="text-[11px] font-semibold text-slate-700 text-center leading-tight">
                      {module.label}
                    </span>
                    {module.id === 'user' && <UserPlus className="w-3 h-3 text-emerald-500" />}
                  </div>
                </button>
              ))}
              
              <button
                onClick={onLogout}
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
      <header className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between sticky top-0 z-10 shadow-xs">
        <div className="flex items-center gap-3">
          {activeTab !== 'dashboard' && (
            <button
              onClick={() => setActiveTab('dashboard')}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition shrink-0"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          
          {/* Logo with dedicated room - Clear and Bigger */}
          <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 flex items-center justify-center p-0.5">
            <img 
              src={logoUrl || '/logo.jpg'} 
              alt="Blackworm Agritech Logo"
              className="max-w-full max-h-full object-contain drop-shadow-xs"
            />
          </div>

          {/* Company Title - Updated to full name after login */}
          <div className="flex flex-col justify-center min-w-0">
            <h1 className="text-sm sm:text-base font-black text-rose-600 tracking-tight leading-tight uppercase whitespace-nowrap">
              BLACKWORM AGRITECH PVT LTD
            </h1>
          </div>
        </div>

        {/* Current Active Logged-In User Badge in Header (Black Single Line - No Circle) */}
        <div className="hidden sm:flex items-center gap-2 px-3">
          <span className="text-[11px] font-black text-slate-900 uppercase leading-none whitespace-nowrap">
            {currentUserData.fullName || 'OWNER'} ({currentUserData.role === 'owner' ? 'OWNER / MD' : (currentUserData.designation || currentUserData.role)})
          </span>
        </div>
      </header>

      <main className="px-4 py-6 flex-1 max-w-4xl mx-auto w-full">
        {renderContent()}
      </main>

      <OfflineIndicator />

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-2 flex justify-around items-center z-20 shadow-lg">
        <NavItem icon={BarChart3} label={t.dashboard} active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
        {(!userAllowedModules || userAllowedModules.includes('target')) && (
          <NavItem icon={Target} label={t.target} active={activeTab === 'target'} onClick={() => setActiveTab('target')} />
        )}
        {(!userAllowedModules || userAllowedModules.includes('order')) && (
          <NavItem icon={ShoppingBag} label={t.orders} active={activeTab === 'order'} onClick={() => setActiveTab('order')} />
        )}
        {(!userAllowedModules || userAllowedModules.includes('collection')) && (
          <NavItem icon={IndianRupee} label={t.collections} active={activeTab === 'collection'} onClick={() => setActiveTab('collection')} />
        )}
        {(!userAllowedModules || userAllowedModules.includes('dealer')) && (
          <NavItem icon={Users} label={t.dealer} active={activeTab === 'dealer'} onClick={() => setActiveTab('dealer')} />
        )}
        {(!userAllowedModules || userAllowedModules.includes('travel')) && (
          <NavItem icon={Bike} label={t.travel} active={activeTab === 'travel'} onClick={() => setActiveTab('travel')} />
        )}
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
      "flex flex-col items-center justify-center min-w-[50px] transition-all relative py-2 group active:scale-90",
      active ? "text-rose-600" : "text-slate-400 hover:text-slate-600"
    )}
    title={label}
  >
    <Icon className={cn("w-6 h-6 transition-transform", active && "scale-110")} />
    {active && <div className="w-1.5 h-1.5 bg-rose-600 rounded-full absolute -bottom-1" />}
  </button>
);
