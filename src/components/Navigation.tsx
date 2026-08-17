import React from 'react';
import { UserRole, ActiveTab } from '../types';
import { Users, Navigation as NavIcon, Building2, Headphones, DollarSign, Terminal, Sparkles, ShieldCheck, Smartphone, Share2, UserCheck, User } from 'lucide-react';
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
    pendingInvitations?: number;
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
    ...(currentRole === 'admin'
      ? [
          {
            id: 'employees' as ActiveTab,
            label: t('nav.employees'),
            sublabel: t('nav.employeesSub'),
            icon: <UserCheck className="w-4 h-4 text-emerald-400" />,
            badge: counts.pendingInvitations,
            badgeColor: 'bg-emerald-500 text-white'
          }
        ]
      : [
          {
            id: 'profile' as ActiveTab,
            label: t('nav.profile'),
            sublabel: t('roles.' + currentRole + '.badge'),
            icon: <User className="w-4 h-4 text-sky-400" />
          }
        ]),
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
    <div className="bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-md px-3 sm:px-5 lg:px-7 z-30">
      <div 
        className="w-full flex items-center justify-between overflow-x-auto no-scrollbar py-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <nav className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
          {primaryTabs.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`relative flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-md shadow-sky-600/25 border border-sky-400/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent hover:border-slate-700/60'
                }`}
              >
                <div className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                  {tab.icon}
                </div>
                <div className="text-left leading-tight">
                  <span className="block">{tab.label}</span>
                  <span className={`text-[9px] font-normal hidden 2xl:block ${isActive ? 'text-sky-100/90' : 'text-slate-500'}`}>
                    {tab.sublabel}
                  </span>
                </div>

                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${tab.badgeColor}`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Secondary Tools Menu */}
          <div className="relative group ml-1">
            <button
              type="button"
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                isSecondaryActive
                  ? 'bg-indigo-600/80 text-white border border-indigo-400/40 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70 border border-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('nav.moreModules')}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-800 text-slate-400 border border-slate-700/60 ml-0.5">
                4
              </span>
            </button>

            <div className="absolute left-0 mt-1.5 w-60 bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/90 p-1.5 hidden group-hover:block hover:block z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700/60 mb-1">
                {t('nav.advancedTools')}
              </div>
              {secondaryTabs.map((subTab) => (
                <button
                  key={subTab.id}
                  type="button"
                  onClick={() => onTabChange(subTab.id)}
                  className={`w-full text-left px-2.5 py-2 rounded-xl text-xs transition-all flex items-center justify-between ${
                    activeTab === subTab.id
                      ? 'bg-sky-600 text-white font-medium shadow-xs'
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
