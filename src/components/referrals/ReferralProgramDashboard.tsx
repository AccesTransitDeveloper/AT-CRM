import React, { useState, useEffect } from 'react';
import { 
  ReferralDashboardStats, 
  ReferralRecord, 
  ReferralSettings, 
  ReferralReward, 
  UserRole,
  Driver 
} from '../../types';
import { api } from '../../lib/api';
import { 
  Share2, 
  Users, 
  Car, 
  Sparkles, 
  Gift, 
  DollarSign, 
  TrendingUp, 
  ShieldAlert, 
  Settings, 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Search, 
  Filter, 
  Plus, 
  RefreshCw, 
  Download, 
  Eye, 
  Check, 
  X,
  ExternalLink,
  ChevronRight,
  BarChart3,
  Percent,
  Globe
} from 'lucide-react';
import { ReferralShareModal } from './ReferralShareModal';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Legend 
} from 'recharts';

interface ReferralProgramDashboardProps {
  currentRole: UserRole;
  drivers?: Driver[];
  onOpenDriverModal?: (driver: Driver) => void;
  onOpenLandingPage?: (code: string) => void;
}

export const ReferralProgramDashboard: React.FC<ReferralProgramDashboardProps> = ({
  currentRole,
  drivers = [],
  onOpenDriverModal,
  onOpenLandingPage
}) => {
  const [stats, setStats] = useState<ReferralDashboardStats | null>(null);
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [rewards, setRewards] = useState<ReferralReward[]>([]);
  const [settings, setSettings] = useState<ReferralSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Share Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareCode, setShareCode] = useState('ATP-TARIQ-101');
  const [shareAudience, setShareAudience] = useState<'passenger' | 'driver'>('passenger');

  // Active subtab in dashboard
  const [subTab, setSubTab] = useState<'overview' | 'table' | 'antifraud' | 'settings'>('overview');

  // Filters for referrals table
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'passenger' | 'driver'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'registered' | 'invited'>('all');

  // Add Referral Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addReferrerId, setAddReferrerId] = useState('');
  const [addName, setAddName] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addType, setAddType] = useState<'passenger' | 'driver'>('passenger');
  const [addStatus, setAddStatus] = useState<'invited' | 'registered' | 'active'>('active');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Notification message
  const [notice, setNotice] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, refsRes, rewardsRes, settingsRes] = await Promise.allSettled([
        api.getReferralStats(),
        api.getReferrals(),
        api.getReferralRewards(),
        api.getReferralSettings()
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      if (refsRes.status === 'fulfilled' && Array.isArray(refsRes.value)) setReferrals(refsRes.value);
      if (rewardsRes.status === 'fulfilled' && Array.isArray(rewardsRes.value)) setRewards(rewardsRes.value);
      if (settingsRes.status === 'fulfilled') setSettings(settingsRes.value);
    } catch (err) {
      console.error('Failed to load referral dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleActivateReferral = async (id: string) => {
    try {
      const res = await api.activateReferral(id);
      setNotice('Реферал активирован (1-й рейс зачтён)!');
      setTimeout(() => setNotice(null), 4000);
      await fetchDashboardData();
    } catch (err) {
      console.error('Failed to activate referral:', err);
    }
  };

  const handleReviewSuspicious = async (id: string, action: 'approve' | 'dismiss') => {
    try {
      await api.reviewSuspiciousReferral(id, action);
      setNotice(action === 'approve' ? 'Флаг подозрения снят' : 'Подозрительный реферал заблокирован');
      setTimeout(() => setNotice(null), 4000);
      await fetchDashboardData();
    } catch (err) {
      console.error('Failed to review referral:', err);
    }
  };

  const handleAddReferralSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName || !addPhone) return;

    setIsSubmitting(true);
    try {
      const res = await api.createReferral({
        referrerId: addReferrerId || (drivers[0]?.id || 'DRV-101'),
        referredName: addName,
        referredPhone: addPhone,
        referredType: addType,
        status: addStatus
      });

      setNotice(`Успешно создан реферал для ${addName}`);
      setTimeout(() => setNotice(null), 4000);
      setAddName('');
      setAddPhone('');
      setIsAddModalOpen(false);
      await fetchDashboardData();
    } catch (err: any) {
      alert(`Ошибка создания: ${err?.message || 'Не удалось сохранить'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      await api.updateReferralSettings(settings);
      setNotice('Настройки реферальной программы успешно сохранены');
      setTimeout(() => setNotice(null), 4000);
      await fetchDashboardData();
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  };

  const filteredReferrals = referrals.filter(r => {
    if (filterType !== 'all' && r.referredType !== filterType) return false;
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        r.referredName.toLowerCase().includes(q) ||
        r.referredPhone.includes(q) ||
        r.referrerName.toLowerCase().includes(q) ||
        r.referralCode.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const suspiciousList = referrals.filter(r => r.isSuspicious);

  return (
    <div className="space-y-6 pb-12">
      {/* NOTICE TOAST */}
      {notice && (
        <div className="bg-emerald-900 border border-emerald-500 text-emerald-100 p-4 rounded-xl flex items-center gap-3 shadow-lg animate-in slide-in-from-top-2">
          <Sparkles className="w-5 h-5 text-amber-300 shrink-0" />
          <span className="text-sm font-semibold">{notice}</span>
        </div>
      )}

      {/* HEADER WITH TITLE & ACTIONS */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-sky-600/20 rounded-xl border border-sky-500/30 text-sky-400">
              <Share2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-white">Referral Program CRM</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Пороги 5/10/5
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Управление вирусным ростом, QR-кодами водителей, автоматическими скидками на комиссию 3% и бесплатными поездками
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setShareCode('ATP-TARIQ-101');
                setShareAudience('passenger');
                setIsShareModalOpen(true);
              }}
              className="px-3.5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-sky-950/40"
            >
              <Share2 className="w-4 h-4" />
              <span>Шеринг QR & Ссылок</span>
            </button>

            <button
              onClick={() => {
                if (onOpenLandingPage) {
                  onOpenLandingPage('ATP-TARIQ-101');
                } else {
                  window.open('/ref/ATP-TARIQ-101', '_blank');
                }
              }}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors border border-slate-700"
              title="Открыть реферальный лендинг"
            >
              <Globe className="w-4 h-4" />
              <span>Открыть Лендинг</span>
            </button>

            <button
              onClick={fetchDashboardData}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
              title="Обновить"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              id="btn-add-referral-global"
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>+ Добавить (Тест)</span>
            </button>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-slate-800">
          <div className="bg-slate-800/70 p-3.5 rounded-xl border border-slate-700/60">
            <div className="text-xs text-slate-400 font-medium">QR-сканы & Приглашения</div>
            <div className="text-xl sm:text-2xl font-black text-white mt-1">
              {stats?.totalInvitationsSent || 89}
            </div>
            <div className="text-[10px] text-sky-400 mt-0.5">уникальных переходов</div>
          </div>

          <div className="bg-slate-800/70 p-3.5 rounded-xl border border-slate-700/60">
            <div className="text-xs text-slate-400 font-medium">Установки приложений</div>
            <div className="text-xl sm:text-2xl font-black text-white mt-1">
              {stats?.totalInstalls || 54}
            </div>
            <div className="text-[10px] text-emerald-400 mt-0.5">{stats?.conversionRateInviteToActivePct || 42}% конв. из QR</div>
          </div>

          <div className="bg-slate-800/70 p-3.5 rounded-xl border border-slate-700/60">
            <div className="text-xs text-slate-400 font-medium">Active (1-й рейс / TLC)</div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">
              {stats?.totalActiveUsers || 38}
            </div>
            <div className="text-[10px] text-emerald-400 mt-0.5">{stats?.conversionRateInstallToActivePct || 70}% совершили поездку</div>
          </div>

          <div className="bg-slate-800/70 p-3.5 rounded-xl border border-slate-700/60">
            <div className="text-xs text-slate-400 font-medium">Водители со скидкой 3%</div>
            <div className="text-xl sm:text-2xl font-black text-amber-400 mt-1">
              {stats?.activeDriverDiscountsCount || 3}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">ставка 12% вместо 15%</div>
          </div>

          <div className="bg-slate-800/70 p-3.5 rounded-xl border border-slate-700/60">
            <div className="text-xs text-slate-400 font-medium">Экономия водителей</div>
            <div className="text-xl sm:text-2xl font-black text-white mt-1">
              ${stats?.totalCommissionSavingsGranted?.toFixed(2) || '245.50'}
            </div>
            <div className="text-[10px] text-emerald-400 mt-0.5">поощрение активности</div>
          </div>

          <div className="bg-slate-800/70 p-3.5 rounded-xl border border-slate-700/60">
            <div className="text-xs text-slate-400 font-medium">Бесплатные поездки</div>
            <div className="text-xl sm:text-2xl font-black text-white mt-1">
              {stats?.totalFreeTripsGranted || 4}
            </div>
            <div className="text-[10px] text-sky-400 mt-0.5">пассажирам (до $35)</div>
          </div>
        </div>
      </div>

      {/* DASHBOARD NAVIGATION SUBTABS */}
      <div className="flex items-center gap-2 border-b border-gray-200 overflow-x-auto">
        <button
          id="subtab-overview"
          onClick={() => setSubTab('overview')}
          className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            subTab === 'overview'
              ? 'border-sky-600 text-sky-600 bg-sky-50/50'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Общий обзор & Лидеры
        </button>

        <button
          id="subtab-table"
          onClick={() => setSubTab('table')}
          className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            subTab === 'table'
              ? 'border-sky-600 text-sky-600 bg-sky-50/50'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Users className="w-4 h-4" />
          Все рефералы (База) ({referrals.length})
        </button>

        <button
          id="subtab-antifraud"
          onClick={() => setSubTab('antifraud')}
          className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            subTab === 'antifraud'
              ? 'border-rose-600 text-rose-600 bg-rose-50/50'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Антифрод & Подозрительные
          {suspiciousList.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
              {suspiciousList.length}
            </span>
          )}
        </button>

        <button
          id="subtab-settings"
          onClick={() => setSubTab('settings')}
          className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            subTab === 'settings'
              ? 'border-slate-800 text-slate-800 bg-gray-50'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Settings className="w-4 h-4" />
          Настройки программы (Пороги 5/10/5)
        </button>
      </div>

      {/* SUBTAB 1: OVERVIEW & LEADERBOARDS */}
      {subTab === 'overview' && (
        <div className="space-y-6">
          {/* Top Referrers Leaders Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 1. TOP DRIVERS (INVITING PASSENGERS) */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-sky-100 text-sky-700 rounded-lg">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Топ водителей → Пассажиры</h3>
                    <p className="text-[11px] text-gray-500">Цель: 10 активных для скидки 3%</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {stats?.topDriverReferrersPassengers.map((item, idx) => (
                  <div key={item.driverId} className="p-3 rounded-xl bg-slate-50 border border-gray-100 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx === 0 ? 'bg-amber-100 text-amber-800' : idx === 1 ? 'bg-slate-200 text-slate-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {idx + 1}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-gray-900">{item.driverName}</div>
                        <div className="text-[10px] text-gray-500">{item.vehicleType} • {item.phone}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-sky-700 font-mono">{item.activeCount} активных</div>
                      <div className="text-[10px] text-gray-500">из {item.totalInvited} приглашённых</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. TOP DRIVERS (INVITING DRIVERS) */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-100 text-amber-800 rounded-lg">
                    <Car className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Топ водителей → Водители</h3>
                    <p className="text-[11px] text-gray-500">Цель: 5 коллег для скидки 3%</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {stats?.topDriverReferrersDrivers.map((item, idx) => (
                  <div key={item.driverId} className="p-3 rounded-xl bg-slate-50 border border-gray-100 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx === 0 ? 'bg-amber-100 text-amber-800' : idx === 1 ? 'bg-slate-200 text-slate-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {idx + 1}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-gray-900">{item.driverName}</div>
                        <div className="text-[10px] text-gray-500">{item.vehicleType} • {item.phone}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-amber-800 font-mono">{item.activeCount} активных</div>
                      <div className="text-[10px] text-emerald-600 font-semibold">{item.rewardsEarned} наград (3%)</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. TOP PASSENGERS (INVITING PASSENGERS) */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                    <Gift className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Топ пассажиров → Пассажиры</h3>
                    <p className="text-[11px] text-gray-500">Цель: 5 друзей для бесплатной поездки ($35)</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {stats?.topPassengerReferrers.map((item, idx) => (
                  <div key={item.passengerId} className="p-3 rounded-xl bg-slate-50 border border-gray-100 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx === 0 ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {idx + 1}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-gray-900">{item.passengerName}</div>
                        <div className="text-[10px] text-gray-500">{item.phone}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-emerald-700 font-mono">{item.activeCount} активных</div>
                      <div className="text-[10px] text-purple-600 font-semibold">{item.freeTripsEarned} Free Trips</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Growth Chart: Organic vs Referral */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
              <div>
                <h3 className="text-base font-bold text-gray-900">Динамика установок: Organic vs Referral Program</h3>
                <p className="text-xs text-gray-500">Вклад реферальных QR-кодов в общий рост клиентской базы Accessible Transit</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium">
                <div className="flex items-center gap-1.5 text-sky-600">
                  <span className="w-3 h-3 rounded-full bg-sky-500" />
                  Реферальные установки (QR)
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-3 h-3 rounded-full bg-slate-400" />
                  Органический трафик
                </div>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.organicVsReferralGrowth || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="referralInstalls" name="Реферальные QR" fill="#0284c7" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="organicInstalls" name="Органика" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: ALL REFERRALS TABLE */}
      {subTab === 'table' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Поиск по имени, номеру, промокоду..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs w-64 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                />
              </div>

              {/* Type Filter */}
              <div className="flex items-center bg-white border border-gray-200 rounded-lg p-0.5 text-xs">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-2.5 py-1 rounded-md font-medium ${filterType === 'all' ? 'bg-slate-800 text-white' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Все ({referrals.length})
                </button>
                <button
                  onClick={() => setFilterType('passenger')}
                  className={`px-2.5 py-1 rounded-md font-medium ${filterType === 'passenger' ? 'bg-sky-600 text-white' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Пассажиры
                </button>
                <button
                  onClick={() => setFilterType('driver')}
                  className={`px-2.5 py-1 rounded-md font-medium ${filterType === 'driver' ? 'bg-amber-600 text-white' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Водители
                </button>
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-500 font-medium">Статус:</span>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value as any)}
                className="bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-700"
              >
                <option value="all">Все статусы</option>
                <option value="active">Active (Зачтены в порог)</option>
                <option value="registered">Registered</option>
                <option value="invited">Invited</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-100 text-gray-600 font-semibold border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Кто пригласил (Referrer)</th>
                  <th className="py-3 px-4">Приглашённый (Referred)</th>
                  <th className="py-3 px-4">Тип кода</th>
                  <th className="py-3 px-4">Промокод</th>
                  <th className="py-3 px-4">Дата установки</th>
                  <th className="py-3 px-4">Статус</th>
                  <th className="py-3 px-4 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredReferrals.map(ref => {
                  const isActive = ref.status === 'active';
                  const isRegistered = ref.status === 'registered';

                  return (
                    <tr key={ref.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-gray-900">
                        <div>{ref.referrerName}</div>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                          ref.referrerType === 'driver' ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'
                        }`}>
                          {ref.referrerType === 'driver' ? 'Водитель AT' : 'Пассажир'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900">{ref.referredName}</div>
                        <div className="text-[11px] text-gray-500 font-mono">{ref.referredPhone}</div>
                        {ref.isSuspicious && (
                          <div className="text-[10px] text-rose-600 flex items-center gap-1 mt-0.5 font-medium">
                            <AlertTriangle className="w-3 h-3" />
                            {ref.suspiciousReason}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {ref.codeType === 'driver_to_passenger' && (
                          <span className="text-[11px] font-medium text-sky-700">Водитель → Пассажир</span>
                        )}
                        {ref.codeType === 'driver_to_driver' && (
                          <span className="text-[11px] font-medium text-amber-700">Водитель → Водитель</span>
                        )}
                        {ref.codeType === 'passenger_to_passenger' && (
                          <span className="text-[11px] font-medium text-purple-700">Пассажир → Пассажир</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-medium text-gray-700">
                        {ref.referralCode}
                      </td>

                      <td className="py-3.5 px-4 text-gray-600 font-mono">
                        {ref.dateInstalled ? new Date(ref.dateInstalled).toLocaleDateString('ru-RU') : '—'}
                      </td>

                      <td className="py-3.5 px-4">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Active (1-й рейс)
                          </span>
                        ) : isRegistered ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                            Registered
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                            Invited
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {!isActive ? (
                          <button
                            onClick={() => handleActivateReferral(ref.id)}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-semibold transition-colors inline-flex items-center gap-1"
                          >
                            <Sparkles className="w-3 h-3 text-emerald-600" />
                            Активировать (1-й заказ)
                          </button>
                        ) : (
                          <span className="text-emerald-600 text-[11px] font-semibold">✓ В зачёте</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 3: ANTIFRAUD QUEUE */}
      {subTab === 'antifraud' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <h3 className="text-base font-bold text-gray-900">Очередь подозрительных рефералов (Антифрод)</h3>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Система автоматически помечает дубликаты телефонных номеров, совпадения IP/устройств и предотвращает самоначисление скидок
            </p>
          </div>

          {suspiciousList.length === 0 ? (
            <div className="p-10 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-semibold text-gray-700">Подозрительных действий не обнаружено</p>
              <p className="text-xs text-gray-500 mt-0.5">Все реферальные связи соответствуют правилам безопасности</p>
            </div>
          ) : (
            <div className="space-y-3">
              {suspiciousList.map(item => (
                <div key={item.id} className="p-4 bg-rose-50/60 rounded-xl border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 text-sm">{item.referredName}</span>
                      <span className="text-xs font-mono text-gray-500">{item.referredPhone}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                        Флаг риска
                      </span>
                    </div>
                    <p className="text-xs text-rose-700 font-medium mt-1">
                      Причина: {item.suspiciousReason} (Пригласил: {item.referrerName})
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleReviewSuspicious(item.id, 'approve')}
                      className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Одобрить (Снять флаг)
                    </button>
                    <button
                      onClick={() => handleReviewSuspicious(item.id, 'dismiss')}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      Заблокировать
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 4: PROGRAM SETTINGS */}
      {subTab === 'settings' && settings && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-base font-bold text-gray-900 mb-1">Параметры и пороги реферальной программы</h3>
          <p className="text-xs text-gray-500 mb-6">
            Настройка автоматических порогов 5/10/5 для скидок на комиссию AT и бесплатных поездок
          </p>

          <form onSubmit={handleSaveSettings} className="space-y-6 max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Порог пассажиров для скидки водителю
                </label>
                <input
                  type="number"
                  value={settings.driverMilestonePassengers}
                  onChange={e => setSettings({ ...settings, driverMilestonePassengers: parseInt(e.target.value) || 10 })}
                  className="w-full text-xs bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                />
                <p className="text-[11px] text-gray-500 mt-1">По умолчанию: 10 пассажиров</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Порог коллег-водителей для скидки
                </label>
                <input
                  type="number"
                  value={settings.driverMilestoneDrivers}
                  onChange={e => setSettings({ ...settings, driverMilestoneDrivers: parseInt(e.target.value) || 5 })}
                  className="w-full text-xs bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                />
                <p className="text-[11px] text-gray-500 mt-1">По умолчанию: 5 активных водителей</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Размер скидки на комиссию (%)
                </label>
                <input
                  type="number"
                  value={settings.driverCommissionDiscountPercent}
                  onChange={e => setSettings({ ...settings, driverCommissionDiscountPercent: parseInt(e.target.value) || 3 })}
                  className="w-full text-xs bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                />
                <p className="text-[11px] text-gray-500 mt-1">3% (снижение ставки с 15% до 12%)</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Срок действия скидки (дней)
                </label>
                <input
                  type="number"
                  value={settings.driverDiscountDurationDays}
                  onChange={e => setSettings({ ...settings, driverDiscountDurationDays: parseInt(e.target.value) || 30 })}
                  className="w-full text-xs bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                />
                <p className="text-[11px] text-gray-500 mt-1">По умолчанию: 30 дней</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Порог пассажиров для Free Trip ($35)
                </label>
                <input
                  type="number"
                  value={settings.passengerMilestoneForFreeTrip}
                  onChange={e => setSettings({ ...settings, passengerMilestoneForFreeTrip: parseInt(e.target.value) || 5 })}
                  className="w-full text-xs bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                />
                <p className="text-[11px] text-gray-500 mt-1">По умолчанию: 5 друзей</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Максимальный номинал бесплатной поездки ($)
                </label>
                <input
                  type="number"
                  value={settings.freeTripMaxFare}
                  onChange={e => setSettings({ ...settings, freeTripMaxFare: parseInt(e.target.value) || 35 })}
                  className="w-full text-xs bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                />
                <p className="text-[11px] text-gray-500 mt-1">Лимит покрытия: $35.00</p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Сохранить настройки
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ADD TEST REFERRAL MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200 animate-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Добавление реферала</h3>
            <p className="text-xs text-gray-500 mb-4">
              Создайте тестового или реального реферала для проверки начисления наград и расчета порогов.
            </p>

            <form onSubmit={handleAddReferralSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Кто пригласил (Водитель)</label>
                <select
                  value={addReferrerId}
                  onChange={e => setAddReferrerId(e.target.value)}
                  className="w-full text-xs bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                >
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.fullName} ({d.tlcLicenseNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Имя приглашённого</label>
                <input
                  type="text"
                  required
                  placeholder="напр. Rustam Kasimdzhanov"
                  value={addName}
                  onChange={e => setAddName(e.target.value)}
                  className="w-full text-xs bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Номер телефона</label>
                <input
                  type="tel"
                  required
                  placeholder="+1 (718) 555-0199"
                  value={addPhone}
                  onChange={e => setAddPhone(e.target.value)}
                  className="w-full text-xs bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Тип</label>
                  <select
                    value={addType}
                    onChange={e => setAddType(e.target.value as any)}
                    className="w-full text-xs bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                  >
                    <option value="passenger">Пассажир (Goal 10)</option>
                    <option value="driver">Водитель TLC (Goal 5)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Статус</label>
                  <select
                    value={addStatus}
                    onChange={e => setAddStatus(e.target.value as any)}
                    className="w-full text-xs bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                  >
                    <option value="active">Active (1-й рейс зачтён)</option>
                    <option value="registered">Registered</option>
                    <option value="invited">Invited</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Сохранение...' : 'Создать запись'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SHARE MODAL */}
      <ReferralShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        referralCode={shareCode}
        referralUrl={`https://accessibletransit.com/ref/${shareCode}`}
        defaultType={shareAudience}
        onOpenLandingPage={(code) => {
          setIsShareModalOpen(false);
          if (onOpenLandingPage) {
            onOpenLandingPage(code);
          } else {
            window.open(`/ref/${code}`, '_blank');
          }
        }}
      />
    </div>
  );
};
