import React from 'react';
import { UserRole, SystemStats } from '../types';
import { Shield, Radio, Car, Clock, DollarSign, ChevronDown, Bot, Sparkles, Power, Camera, ScanFace } from 'lucide-react';
import { useTranslation, LanguageSwitch } from '../lib/i18n';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  stats: SystemStats | null;
  onRefresh: () => void;
  isLoading: boolean;
  isAiAgentOpen: boolean;
  onToggleAiAgentOpen: () => void;
  isAiAgentActive: boolean;
  onToggleAiAgentActive: (active: boolean) => void;
  onOpenFaceLogin?: () => void;
}

export const roleStyleConfig: Record<UserRole, { color: string }> = {
  admin: {
    color: 'bg-indigo-900 text-indigo-200 border-indigo-700'
  },
  driver_manager: {
    color: 'bg-emerald-900 text-emerald-200 border-emerald-700'
  },
  dispatcher: {
    color: 'bg-sky-900 text-sky-200 border-sky-700'
  },
  support: {
    color: 'bg-amber-900 text-amber-200 border-amber-700'
  },
  finance: {
    color: 'bg-purple-900 text-purple-200 border-purple-700'
  }
};

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  stats,
  onRefresh,
  isLoading,
  isAiAgentOpen,
  onToggleAiAgentOpen,
  isAiAgentActive,
  onToggleAiAgentActive,
  onOpenFaceLogin
}) => {
  const { t } = useTranslation();

  const getRoleInfo = (role: UserRole) => {
    return {
      label: t(`roles.${role}.label`),
      description: t(`roles.${role}.description`),
      badge: t(`roles.${role}.badge`),
      color: roleStyleConfig[role].color
    };
  };

  const currentRoleInfo = getRoleInfo(currentRole);

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and branding */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center shadow-inner font-bold text-lg text-white border border-sky-400/30">
              AT
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">Accessible Transit</span>
                <span className="text-xs bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded font-mono border border-sky-500/30">CRM</span>
                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-medium border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {t('header.hubLocation')}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {t('header.subHeader')}
              </p>
            </div>
          </div>

          {/* Key Live Status Counters */}
          <div className="hidden lg:flex items-center space-x-6 text-xs text-slate-300">
            <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
              <Car className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">{t('header.activeDrivers')}</div>
                <span className="font-bold text-white text-sm">{stats ? stats.activeDrivers : 3}</span>
                <span className="text-slate-400 text-xs"> / {stats ? stats.totalDrivers : 6} {t('header.fleet')}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
              <Radio className="w-4 h-4 text-sky-400 animate-pulse" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">{t('header.activeOrders')}</div>
                <span className="font-bold text-white text-sm">{stats ? stats.activeOrdersNow : 4}</span>
                <span className="text-slate-400 text-xs"> {t('header.inDispatch')}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
              <DollarSign className="w-4 h-4 text-amber-400" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">{t('header.atCommission')}</div>
                <span className="font-bold text-emerald-400 text-sm">
                  ${stats ? stats.atCommissionToday.toFixed(2) : '41.26'}
                </span>
              </div>
            </div>
          </div>

          {/* Controls: Refresh, Language Switcher, Role Selector & AI Agent */}
          <div className="flex items-center space-x-2.5">
            <button
              onClick={onRefresh}
              title={t('header.refreshData')}
              disabled={isLoading}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700 flex items-center justify-center text-xs"
            >
              <Clock className={`w-4 h-4 ${isLoading ? 'animate-spin text-sky-400' : ''}`} />
            </button>

            {/* Language Switcher (RU / EN) */}
            <LanguageSwitch />

            {/* Role dropdown */}
            <div className="relative group">
              <div className="flex items-center space-x-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 cursor-pointer hover:border-slate-600 transition-all">
                <Shield className="w-4 h-4 text-sky-400" />
                <div className="text-left">
                  <div className="text-[10px] text-slate-400 uppercase leading-none">{t('header.loggedInAs')}</div>
                  <div className="text-xs font-semibold text-white flex items-center gap-1">
                    {currentRoleInfo.label}
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Dropdown Menu */}
              <div className="absolute right-0 mt-1 w-72 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 p-2 hidden group-hover:block hover:block z-50">
                <div className="px-2 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700 mb-1">
                  {t('header.switchActiveRole')}
                </div>
                {(['admin', 'driver_manager', 'dispatcher', 'support', 'finance'] as UserRole[]).map((role) => {
                  const isCurrent = role === currentRole;
                  const item = getRoleInfo(role);
                  return (
                    <button
                      key={role}
                      onClick={() => onRoleChange(role)}
                      className={`w-full text-left p-2 rounded-lg text-xs transition-colors flex flex-col mb-1 ${
                        isCurrent
                          ? 'bg-sky-500/20 text-sky-200 border border-sky-500/40'
                          : 'hover:bg-slate-700/60 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold">
                        <span>{item.label}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900/60 text-slate-400 border border-slate-700">
                          {item.badge}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{item.description}</span>
                    </button>
                  );
                })}

                {onOpenFaceLogin && (
                  <div className="pt-2 mt-1 border-t border-slate-700">
                    <button
                      onClick={onOpenFaceLogin}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Face ID Authentication</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Face ID Switcher Button */}
            {onOpenFaceLogin && (
              <button
                type="button"
                onClick={onOpenFaceLogin}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-950/70 hover:bg-indigo-900/90 text-indigo-300 border border-indigo-500/40 rounded-lg text-xs font-semibold shadow-sm transition-all"
                title="Sign in with Face ID / Switch User"
              >
                <Camera className="w-3.5 h-3.5 text-indigo-400" />
                <span>Face ID</span>
              </button>
            )}

            {/* AI Assistant (Jarvis) Trigger & Activation Switch */}
            <div className="flex items-center space-x-1.5 bg-slate-800/90 pl-2 pr-1.5 py-1 rounded-lg border border-slate-700">
              {/* Quick toggle switch */}
              <button
                onClick={() => onToggleAiAgentActive(!isAiAgentActive)}
                className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors focus:outline-hidden ${
                  isAiAgentActive ? 'bg-emerald-500' : 'bg-slate-600'
                }`}
                title={isAiAgentActive ? t('aiAgent.toggleDeactivate') : t('aiAgent.toggleActivate')}
                id="header-ai-agent-switch"
              >
                <span
                  className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${
                    isAiAgentActive ? 'translate-x-3.5' : 'translate-x-0.5'
                  }`}
                />
              </button>

              {/* Agent Trigger Button */}
              <button
                onClick={onToggleAiAgentOpen}
                className={`flex items-center space-x-1.5 px-2 py-1 rounded-md text-xs font-semibold transition-all relative ${
                  isAiAgentActive
                    ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 shadow-xs shadow-emerald-500/20'
                    : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-slate-200 border border-slate-600/40'
                }`}
                id="header-ai-agent-btn"
                title="Jarvis Operations AI Assistant"
              >
                <div className="relative flex items-center">
                  <Bot className="w-3.5 h-3.5" />
                  {isAiAgentActive && (
                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  )}
                </div>
                <span>{t('aiAgent.headerBadge')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
