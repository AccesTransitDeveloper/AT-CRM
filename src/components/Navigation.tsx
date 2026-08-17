import React from 'react';
import { UserRole, ActiveTab } from '../types';
import { Users, Navigation as NavIcon, Building2, Headphones, DollarSign, Terminal, Sparkles, ShieldCheck, Smartphone, Share2 } from 'lucide-react';
import { useTranslation } from '../lib/i18n';

export type { ActiveTab };

interface NavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  currentRole: UserRole;
  counts: {
    pendingDrivers: number;
    activeOrders: number;
    openTickets: number;
    pendingComplianceDocs?: number;
    expiringComplianceDocs?: number;
  };
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  currentRole,
  counts
}) => {
  const { t } = useTranslation();

  const primaryTabs: Array<{
    id: ActiveTab;
    label: string;
    sublabel: string;
    icon: React.ReactNode;
    badge?: number;
    badgeColor?: string;
  }> = [
    {
      id: 'drivers',
      label: t('nav.drivers'),
      sublabel: t('nav.driversSub'),
      icon: <Users className="w-4 h-4" />,
      badge: counts.pendingDrivers,
      badgeColor: 'bg-amber-500 text-white'
    },
    {
      id: 'orders',
      label: t('nav.orders'),
      sublabel: t('nav.ordersSub'),
      icon: <NavIcon className="w-4 h-4" />,
      badge: counts.activeOrders,
      badgeColor: 'bg-sky-500 text-white'
    },
    {
      id: 'brokers',
      label: t('nav.brokers'),
      sublabel: t('nav.brokersSub'),
      icon: <Building2 className="w-4 h-4" />
    },
    {
      id: 'support',
      label: t('nav.support'),
      sublabel: t('nav.supportSub'),
      icon: <Headphones className="w-4 h-4" />,
      badge: counts.openTickets,
      badgeColor: 'bg-rose-500 text-white'
    },
    {
      id: 'finance',
      label: t('nav.finance'),
      sublabel: t('nav.financeSub'),
      icon: <DollarSign className="w-4 h-4" />
    },
    {
      id: 'api',
      label: t('nav.api'),
      sublabel: t('nav.apiSub'),
      icon: <Terminal className="w-4 h-4" />
    }
  ];

  const secondaryTabs: Array<{
    id: ActiveTab;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }> = [
    {
      id: 'compliance',
      label: t('nav.compliance'),
      icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />,
      badge: counts.pendingComplianceDocs
    },
    {
      id: 'marketing',
      label: t('nav.marketing'),
      icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" />
    },
    {
      id: 'app_analytics',
      label: t('nav.appAnalytics'),
      icon: <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
    },
    {
      id: 'referrals',
      label: t('nav.referrals'),
      icon: <Share2 className="w-3.5 h-3.5 text-emerald-400" />
    }
  ];

  const isSecondaryActive = secondaryTabs.some(t => t.id === activeTab);

  return (
    <div className="bg-slate-900/95 border-b border-slate-800 backdrop-blur px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto no-scrollbar py-2">
        <nav className="flex space-x-1 sm:space-x-2 items-center">
          {primaryTabs.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`relative flex items-center space-x-2 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className={`${isActive ? 'text-white' : 'text-slate-400'}`}>
                  {tab.icon}
                </div>
                <div className="text-left leading-tight">
                  <div className="flex items-center gap-1.5">
                    <span>{tab.label}</span>
                  </div>
                  <div className={`text-[10px] hidden sm:block ${isActive ? 'text-sky-100' : 'text-slate-400'}`}>
                    {tab.sublabel}
                  </div>
                </div>

                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${tab.badgeColor}`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Secondary Tools Menu */}
          <div className="relative group ml-2">
            <button
              className={`flex items-center space-x-1.5 px-3 py-2 sm:px-3 sm:py-2.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                isSecondaryActive
                  ? 'bg-indigo-600/80 text-white border border-indigo-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('nav.moreModules')}</span>
              <span className="text-[10px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 ml-1">4</span>
            </button>

            <div className="absolute left-0 mt-1 w-56 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 p-1.5 hidden group-hover:block hover:block z-50">
              <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700/60 mb-1">
                {t('nav.advancedTools')}
              </div>
              {secondaryTabs.map((subTab) => (
                <button
                  key={subTab.id}
                  onClick={() => onTabChange(subTab.id)}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                    activeTab === subTab.id
                      ? 'bg-sky-600 text-white'
                      : 'hover:bg-slate-700/70 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {subTab.icon}
                    <span>{subTab.label}</span>
                  </div>
                  {subTab.badge !== undefined && subTab.badge > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-amber-500 text-white font-bold">
                      {subTab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
};
