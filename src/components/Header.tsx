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
  const { t, language } = useTranslation();

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
    <header className="bg-slate-900/95 border-b border-slate-800/90 text-white sticky top-0 z-40 backdrop-blur-md shadow-lg shadow-black/20">
      <div className="w-full px-3 sm:px-5 lg:px-7">
        <div className="flex items-center justify-between min-h-[64px] py-2 gap-3 flex-wrap lg:flex-nowrap">
          {/* Left: Logo and branding */}
          <div className="flex items-center space-x-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 via-sky-600 to-indigo-700 flex items-center justify-center shadow-md shadow-sky-600/20 font-black text-lg text-white border border-sky-400/40 tracking-wider">
              AT
            </div>
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base sm:text-lg tracking-tight text-white leading-snug">
                  {language === 'ru' ? 'Доступный Транспорт' : 'Accessible Transit'}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider bg-sky-500/20 text-sky-300 px-1.5 py-0.5 rounded-md font-mono border border-sky-500/30">
                  CRM
                </span>
                <span className="hidden md:inline-flex items-center gap-1.5 text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  NYC Paratransit
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight hidden sm:block">
                Queens • Brooklyn • Bronx • Manhattan • Staten Island | MTA 15%
              </p>
            </div>
          </div>

          {/* Center: Live Real-Time Telemetry HUD Chips */}
          <div className="hidden xl:flex items-center space-x-2 text-xs text-slate-300">
            {/* Drivers HUD */}
            <div className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700/60 shadow-xs transition-colors">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <Car className="w-3.5 h-3.5" />
              </div>
              <div className="leading-tight">
                <div className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">{t('header.activeDrivers')}</div>
                <div className="text-xs font-bold text-white flex items-center gap-1">
                  <span className="text-emerald-400">{stats ? stats.activeDrivers : 3}</span>
                  <span className="text-slate-500 font-normal">/ {stats ? stats.totalDrivers : 6}</span>
                </div>
              </div>
            </div>

            {/* Orders HUD */}
            <div className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700/60 shadow-xs transition-colors">
              <div className="w-7 h-7 rounded-lg bg-sky-500/15 text-sky-400 flex items-center justify-center border border-sky-500/20">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
              </div>
              <div className="leading-tight">
                <div className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">{t('header.activeOrders')}</div>
                <div className="text-xs font-bold text-white flex items-center gap-1">
                  <span className="text-sky-400">{stats ? stats.activeOrdersNow : 4}</span>
                  <span className="text-slate-500 font-normal">{language === 'ru' ? 'в рейсе' : 'active'}</span>
                </div>
              </div>
            </div>

            {/* Margin HUD */}
            <div className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700/60 shadow-xs transition-colors">
              <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/20">
                <DollarSign className="w-3.5 h-3.5" />
              </div>
              <div className="leading-tight">
                <div className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">15% AT Comm</div>
                <div className="text-xs font-bold text-emerald-400 font-mono">
                  ${stats ? stats.atCommissionToday.toFixed(2) : '1,690.09'}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Controls (Refresh, Language, Role Selector, Face ID, Jarvis AI) */}
          <div className="flex items-center space-x-2 shrink-0 ml-auto lg:ml-0">
            {/* Refresh */}
            <button
              type="button"
              onClick={onRefresh}
              title={t('header.refreshData')}
              disabled={isLoading}
              className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700/80 flex items-center justify-center"
            >
              <Clock className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-sky-400' : ''}`} />
            </button>

            {/* Language Switcher (RU / EN) */}
            <LanguageSwitch />

            {/* Role Dropdown */}
            <div className="relative group">
              <button
                type="button"
                className="flex items-center space-x-2 bg-slate-800/90 hover:bg-slate-750 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-700/80 cursor-pointer hover:border-slate-600 transition-all text-xs"
              >
                <Shield className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <div className="text-left leading-none hidden sm:block">
                  <div className="text-[9px] text-slate-400 uppercase tracking-wider">{t('header.loggedInAs')}</div>
                  <div className="text-xs font-semibold text-white mt-0.5 flex items-center gap-1">
                    <span>{currentRoleInfo.label}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400 group-hover:rotate-180 transition-transform duration-200" />
                  </div>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400 sm:hidden" />
              </button>

              {/* Dropdown Menu */}
              <div className="absolute right-0 mt-1.5 w-72 bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/90 p-2 hidden group-hover:block hover:block z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700/60 mb-1.5">
                  {t('header.switchActiveRole')}
                </div>
                {(['admin', 'driver_manager', 'dispatcher', 'support', 'finance'] as UserRole[]).map((role) => {
                  const isCurrent = role === currentRole;
                  const item = getRoleInfo(role);
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => onRoleChange(role)}
                      className={`w-full text-left p-2 rounded-xl text-xs transition-all flex flex-col mb-1 ${
                        isCurrent
                          ? 'bg-sky-500/20 text-sky-200 border border-sky-500/40 shadow-xs'
                          : 'hover:bg-slate-700/60 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold">
                        <span>{item.label}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-slate-900/80 text-slate-400 border border-slate-700/60">
                          {item.badge}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{item.description}</span>
                    </button>
                  );
                })}

                {onOpenFaceLogin && (
                  <div className="pt-2 mt-1.5 border-t border-slate-700/80">
                    <button
                      type="button"
                      onClick={onOpenFaceLogin}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{language === 'ru' ? 'Биометрия Face ID' : 'Face ID Authentication'}</span>
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
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-500/40 rounded-xl text-xs font-semibold shadow-xs transition-all"
                title="Face ID Login / Biometrics"
              >
                <Camera className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Face ID</span>
              </button>
            )}

            {/* AI Assistant (Jarvis) Switch & Button */}
            <div className="flex items-center space-x-1.5 bg-slate-800/90 pl-2 pr-1 py-1 rounded-xl border border-slate-700/80 shadow-xs">
              {/* Quick toggle switch */}
              <button
                type="button"
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
                type="button"
                onClick={onToggleAiAgentOpen}
                className={`flex items-center space-x-1.5 px-2 py-1 rounded-lg text-xs font-semibold transition-all relative ${
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
                <span className="hidden sm:inline">{t('aiAgent.headerBadge')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
