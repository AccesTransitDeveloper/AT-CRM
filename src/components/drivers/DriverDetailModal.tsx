import React, { useState, useEffect, useMemo } from 'react';
import { 
  Driver, 
  UserRole, 
  Order, 
  Ticket, 
  DriverStatus, 
  AnalyticsTimeRange,
  DriverFinancialAnalytics,
  DriverActivityAnalytics,
  DriverPayoutRecord,
  DriverAiAssessment,
  DriverRiskLevel
} from '../../types';
import { api } from '../../lib/api';
import { DriverDocumentsSection } from './DriverDocumentsSection';
import { DriverReferralsTab } from './DriverReferralsTab';
import { 
  X, 
  Phone, 
  Mail, 
  Car, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Sparkles, 
  RefreshCw, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Clock, 
  MapPin, 
  Shield, 
  Award, 
  Activity, 
  FileText, 
  BarChart3, 
  ChevronRight, 
  AlertCircle, 
  Info,
  Lock,
  Layers,
  Check,
  Send,
  Zap,
  Star,
  Download,
  QrCode,
  Gift
} from 'lucide-react';
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

interface DriverDetailModalProps {
  driver: Driver;
  currentRole: UserRole;
  orders?: Order[];
  tickets?: Ticket[];
  onClose: () => void;
  onUpdateStatus: (id: string, status: DriverStatus, reason?: string) => Promise<void>;
  onUpdateDriver?: (id: string, updates: Partial<Driver>) => Promise<void>;
  onOpenDocViewer?: (url: string, title?: string) => void;
  onOpenLandingPage?: (code: string) => void;
}

type TabType = 'overview' | 'finance' | 'orders' | 'ai-insight' | 'documents' | 'referrals';

export const DriverDetailModal: React.FC<DriverDetailModalProps> = ({
  driver,
  currentRole,
  orders = [],
  tickets = [],
  onClose,
  onUpdateStatus,
  onUpdateDriver,
  onOpenDocViewer = () => {},
  onOpenLandingPage
}) => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Time range filter
  const [timeRange, setTimeRange] = useState<AnalyticsTimeRange>('30d');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  // Data states
  const [financials, setFinancials] = useState<DriverFinancialAnalytics | null>(null);
  const [activity, setActivity] = useState<DriverActivityAnalytics | null>(null);
  const [payouts, setPayouts] = useState<DriverPayoutRecord[]>([]);
  const [aiAssessments, setAiAssessments] = useState<DriverAiAssessment[]>([]);
  
  // Loading & Action states
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Role Permissions
  const canViewFinance = currentRole === 'admin' || currentRole === 'finance' || currentRole === 'driver_manager';
  const canViewPayoutDetails = currentRole === 'admin' || currentRole === 'finance';
  const canViewAiInsights = currentRole !== 'dispatcher';
  const canManageStatus = currentRole === 'admin' || currentRole === 'driver_manager';

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch driver analytics and records
  const loadDriverAnalytics = async () => {
    setIsLoadingData(true);
    try {
      const [finData, actData, payData, aiData] = await Promise.allSettled([
        api.getDriverFinancials(driver.id, {
          timeRange,
          startDate: timeRange === 'custom' ? customStartDate : undefined,
          endDate: timeRange === 'custom' ? customEndDate : undefined
        }),
        api.getDriverActivity(driver.id, {
          timeRange,
          startDate: timeRange === 'custom' ? customStartDate : undefined,
          endDate: timeRange === 'custom' ? customEndDate : undefined
        }),
        api.getDriverPayouts(driver.id),
        api.getDriverAiAssessments(driver.id)
      ]);

      if (finData.status === 'fulfilled') setFinancials(finData.value);
      if (actData.status === 'fulfilled') setActivity(actData.value);
      if (payData.status === 'fulfilled') setPayouts(payData.value);
      if (aiData.status === 'fulfilled') setAiAssessments(aiData.value);
    } catch (err) {
      console.error('Error fetching driver analytics:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    loadDriverAnalytics();
  }, [driver.id, timeRange, customStartDate, customEndDate]);

  // Handle AI Assessment Generation
  const handleGenerateAiAssessment = async () => {
    setIsGeneratingAi(true);
    try {
      const newAssessment = await api.generateDriverAiAssessment(driver.id);
      setAiAssessments(prev => [newAssessment, ...prev]);
      showToast('AI Assessment updated using real-time telemetry!', 'success');
      // If parent has update driver callback, notify
      if (onUpdateDriver) {
        onUpdateDriver(driver.id, { latestRiskLevel: newAssessment.riskLevel });
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to refresh AI Assessment', 'error');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Latest AI assessment
  const latestAi = aiAssessments.length > 0 ? aiAssessments[0] : null;
  const currentRisk: DriverRiskLevel = latestAi?.riskLevel || driver.latestRiskLevel || 'low';

  // Filter driver's orders for the orders tab
  const driverOrders = useMemo(() => {
    return orders.filter(o => o.driverId === driver.id);
  }, [orders, driver.id]);

  // Quick period change
  const handleRangeSelect = (range: AnalyticsTimeRange) => {
    setTimeRange(range);
    if (range === 'custom') {
      setShowCustomDatePicker(true);
    } else {
      setShowCustomDatePicker(false);
    }
  };

  const getRiskBadge = (level: DriverRiskLevel) => {
    switch (level) {
      case 'low':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Низкий риск (Low Risk)
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Внимание (Medium Risk)
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Высокий риск (High Risk)
          </span>
        );
    }
  };

  const getStatusBadge = (status: DriverStatus) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Активен / На линии
          </span>
        );
      case 'under_review':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5" />
            На проверке
          </span>
        );
      case 'applied':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <Info className="w-3.5 h-3.5" />
            Новая заявка
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3.5 h-3.5" />
            Заблокирован / Приостановлен
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-300">
            <XCircle className="w-3.5 h-3.5" />
            Отклонён
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div 
        id={`driver-modal-${driver.id}`} 
        className="relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200"
      >
        {/* TOAST NOTIFICATION */}
        {toastMessage && (
          <div className="absolute top-4 right-14 z-50 flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm shadow-xl animate-in slide-in-from-top-2">
            {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {toastMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400" />}
            {toastMessage.type === 'info' && <Info className="w-4 h-4 text-blue-400" />}
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* HEADER SECTION (OVERVIEW) - FIXED AT TOP */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 border-b border-slate-800 shrink-0">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            {/* Driver Identity */}
            <div className="flex items-start sm:items-center gap-4">
              <div className="relative shrink-0">
                <img 
                  src={driver.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'} 
                  alt={driver.fullName}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-3 ring-slate-700 shadow-md bg-slate-800"
                />
                <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ring-2 ring-slate-900 ${driver.isOnline ? 'bg-emerald-500' : 'bg-slate-500'}`} />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">{driver.fullName}</h2>
                  {getStatusBadge(driver.status)}
                  {getRiskBadge(currentRisk)}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-slate-300">
                  <span className="flex items-center gap-1 font-mono text-emerald-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    {driver.tlcLicenseNumber}
                  </span>
                  <a href={`tel:${driver.phone}`} className="flex items-center gap-1 hover:text-white transition-colors">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {driver.phone}
                  </a>
                  <a href={`mailto:${driver.email}`} className="flex items-center gap-1 hover:text-white transition-colors">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {driver.email}
                  </a>
                  <span className="flex items-center gap-1 text-slate-300">
                    <Car className="w-3.5 h-3.5 text-amber-400" />
                    {driver.vehiclePlate} ({driver.vehicleType} {driver.isWheelchairAccessible ? '• WAV' : ''})
                  </span>
                </div>
              </div>
            </div>

            {/* Top Period Filter & Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              {/* Period Filter Bar */}
              <div className="bg-slate-800 p-1 rounded-xl border border-slate-700 flex items-center gap-1 text-xs">
                <button
                  id="btn-range-today"
                  onClick={() => handleRangeSelect('today')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${timeRange === 'today' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'}`}
                >
                  Сегодня
                </button>
                <button
                  id="btn-range-7d"
                  onClick={() => handleRangeSelect('7d')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${timeRange === '7d' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'}`}
                >
                  7 дней
                </button>
                <button
                  id="btn-range-30d"
                  onClick={() => handleRangeSelect('30d')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${timeRange === '30d' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'}`}
                >
                  30 дней
                </button>
                <button
                  id="btn-range-all"
                  onClick={() => handleRangeSelect('all')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${timeRange === 'all' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'}`}
                >
                  Всё время
                </button>
                <button
                  id="btn-range-custom"
                  onClick={() => handleRangeSelect('custom')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${timeRange === 'custom' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'}`}
                >
                  Период...
                </button>
              </div>

              {/* Close Button */}
              <button
                id="btn-close-driver-modal"
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors border border-slate-700"
                title="Закрыть (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Custom Date Range Picker Dropdown */}
          {showCustomDatePicker && (
            <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap items-center gap-3 text-xs">
              <span className="text-slate-300 font-medium">Диапазон дат:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
              <span className="text-slate-400">—</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
              <button
                onClick={loadDriverAnalytics}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors"
              >
                Применить
              </button>
            </div>
          )}

          {/* KEY HEADLINE METRICS - LARGE DISPLAY NUMBERS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-5">
            <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80">
              <div className="text-xs text-slate-400 font-medium mb-1">Заработано водителем (Net)</div>
              <div className="text-xl sm:text-2xl font-black text-emerald-400 tracking-tight">
                ${financials ? financials.totalDriverEarnings.toLocaleString('en-US', { minimumFractionDigits: 2 }) : (driver.totalTrips * 34.2).toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Выплаты на руки за {timeRange === 'today' ? 'сегодня' : timeRange === '7d' ? '7 дн.' : timeRange === '30d' ? '30 дн.' : 'период'}</div>
            </div>

            <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80">
              <div className="text-xs text-slate-400 font-medium mb-1">Комиссия AT (Gross Rev)</div>
              <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
                ${financials ? financials.totalAtCommission.toLocaleString('en-US', { minimumFractionDigits: 2 }) : (driver.totalTrips * 6.5).toFixed(2)}
              </div>
              <div className="text-[11px] text-emerald-400 mt-0.5">
                {financials && financials.atCommissionBroker15Pct > 0 
                  ? `$${financials.atCommissionBroker15Pct.toFixed(0)} с MTA 15%`
                  : '15% стандартная ставка'}
              </div>
            </div>

            <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80">
              <div className="text-xs text-slate-400 font-medium mb-1">Рейтинг водителя</div>
              <div className="text-xl sm:text-2xl font-black text-amber-400 tracking-tight flex items-center gap-1">
                {driver.rating.toFixed(2)}
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">на основе отзывов пассажиров</div>
            </div>

            <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80">
              <div className="text-xs text-slate-400 font-medium mb-1">Всего поездок за период</div>
              <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {activity ? activity.completedTrips : driver.totalTrips} <span className="text-sm font-normal text-slate-400">рейсов</span>
              </div>
              <div className="text-[11px] text-emerald-400 mt-0.5">
                Accept rate: {activity ? `${activity.acceptRate}%` : '94%'}
              </div>
            </div>
          </div>
        </div>

        {/* TAB NAVIGATION BAR */}
        <div className="bg-slate-50 border-b border-gray-200 px-6 flex items-center gap-2 overflow-x-auto shrink-0">
          <button
            id="tab-driver-overview"
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-4 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Info className="w-4 h-4" />
            Overview & Профиль
          </button>

          {canViewFinance && (
            <button
              id="tab-driver-finance"
              onClick={() => setActiveTab('finance')}
              className={`py-3 px-4 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'finance'
                  ? 'border-emerald-600 text-emerald-700 bg-white'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              Финансы
            </button>
          )}

          <button
            id="tab-driver-orders"
            onClick={() => setActiveTab('orders')}
            className={`py-3 px-4 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'orders'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Activity className="w-4 h-4" />
            Заказы и активность
          </button>

          {canViewAiInsights && (
            <button
              id="tab-driver-ai"
              onClick={() => setActiveTab('ai-insight')}
              className={`py-3 px-4 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'ai-insight'
                  ? 'border-indigo-600 text-indigo-700 bg-white'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              AI-оценка (AT AI Insight)
              {latestAi && (
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                  currentRisk === 'low' ? 'bg-emerald-100 text-emerald-800' : currentRisk === 'medium' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {currentRisk}
                </span>
              )}
            </button>
          )}

          <button
            id="tab-driver-docs"
            onClick={() => setActiveTab('documents')}
            className={`py-3 px-4 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'documents'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            TLC Документы & Комплаенс
          </button>

          <button
            id="tab-driver-referrals"
            onClick={() => setActiveTab('referrals')}
            className={`py-3 px-4 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'referrals'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <QrCode className="w-4 h-4 text-sky-600" />
            Рефералы & QR-коды
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800">
              Пороги 5/10/5
            </span>
          </button>
        </div>

        {/* MAIN BODY CONTENT AREA */}
        <div className="flex-1 p-5 sm:p-6 overflow-y-auto bg-slate-50/50">

          {/* ========================================================================= */}
          {/* TAB 1: OVERVIEW & PROFILE                                                 */}
          {/* ========================================================================= */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Vehicle & TLC Specs */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      <Car className="w-4 h-4 text-emerald-600" />
                      Транспортное средство & TLC
                    </h3>
                    <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-gray-100 text-gray-800">
                      {driver.vehicleType}
                    </span>
                  </div>

                  <div className="space-y-2.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Автомобиль:</span>
                      <span className="font-semibold text-gray-900">{driver.vehicleMakeModel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Год выпуска:</span>
                      <span className="font-semibold text-gray-900">{driver.vehicleYear}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Номерной знак:</span>
                      <span className="font-mono font-bold text-gray-900 bg-slate-100 px-2 py-0.5 rounded">{driver.vehiclePlate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">TLC Лицензия:</span>
                      <span className="font-mono font-semibold text-emerald-700">{driver.tlcLicenseNumber}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">WAV Инвалидный пандус:</span>
                      {driver.isWheelchairAccessible ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <Check className="w-3.5 h-3.5" /> Да (Сертифицирован)
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500">Нет</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Operations & Zones */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                      Зона обслуживания (Queens)
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${driver.isOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'}`}>
                      {driver.isOnline ? 'В сети' : 'Офлайн'}
                    </span>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-xs text-gray-500 block mb-1.5">Заявленные районы работы:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {driver.operatingBoroughs && driver.operatingBoroughs.map((b, i) => (
                          <span key={i} className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-medium">
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-100">
                      <span className="text-xs text-gray-500 block mb-1">Текущая геопозиция:</span>
                      <div className="font-medium text-gray-900 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-red-500" />
                        {driver.currentLocation?.neighborhood || 'Jackson Heights, Queens'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Telemetry Snapshot & Action Controls */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      <Award className="w-4 h-4 text-emerald-600" />
                      Диспетчерский статус
                    </h3>
                    <span className="text-xs text-gray-500">В парке с {driver.joinedDate}</span>
                  </div>

                  {canManageStatus && (
                    <div className="space-y-2">
                      <span className="text-xs text-gray-500 block">Управление статусом водителя:</span>
                      <div className="grid grid-cols-2 gap-2">
                        {driver.status !== 'active' && (
                          <button
                            id="btn-approve-driver-quick"
                            disabled={isUpdatingStatus}
                            onClick={async () => {
                              setIsUpdatingStatus(true);
                              await onUpdateStatus(driver.id, 'active');
                              setIsUpdatingStatus(false);
                            }}
                            className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Активировать
                          </button>
                        )}

                        {driver.status === 'active' && (
                          <button
                            id="btn-suspend-driver-quick"
                            disabled={isUpdatingStatus}
                            onClick={async () => {
                              setIsUpdatingStatus(true);
                              await onUpdateStatus(driver.id, 'suspended', 'Приостановлен диспетчером для проверки');
                              setIsUpdatingStatus(false);
                            }}
                            className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Приостановить
                          </button>
                        )}

                        <button
                          id="btn-open-reject-dialog"
                          onClick={() => setShowRejectModal(true)}
                          className="w-full py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Заблокировать...
                        </button>
                      </div>
                    </div>
                  )}

                  {driver.notes && (
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-gray-700">
                      <span className="font-semibold text-gray-900 block mb-0.5">Заметки оператора:</span>
                      {driver.notes}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick AI Summary banner if available */}
              {latestAi && (
                <div className="p-4 rounded-xl bg-indigo-50/80 border border-indigo-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-indigo-600 text-white shrink-0 mt-0.5">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">Резюме AT AI</span>
                        <span className="text-xs text-gray-500">• {new Date(latestAi.date).toLocaleDateString('ru-RU')}</span>
                      </div>
                      <p className="text-sm font-medium text-indigo-950 mt-0.5">{latestAi.verdict}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('ai-insight')}
                    className="shrink-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    Подробнее в AI-оценке
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: ФИНАНСЫ (FINANCIAL ANALYTICS)                                       */}
          {/* ========================================================================= */}
          {activeTab === 'finance' && canViewFinance && (
            <div className="space-y-6">
              {/* Financial KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                  <div className="text-xs text-gray-500 font-medium mb-1">Выплата водителю (Net)</div>
                  <div className="text-2xl font-black text-emerald-600">
                    ${financials?.totalDriverEarnings.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {(financials?.tripsCount || 0)} поездок завершено
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                  <div className="text-xs text-gray-500 font-medium mb-1">Заработок AT (Комиссия)</div>
                  <div className="text-2xl font-black text-gray-900">
                    ${financials?.totalAtCommission.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
                  </div>
                  <div className="text-xs text-emerald-600 mt-1">
                    Стандартная: ${financials?.atCommissionStandard.toFixed(2) || '0.00'}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                  <div className="text-xs text-gray-500 font-medium mb-1">MTA Brokerage (15% Margin)</div>
                  <div className="text-2xl font-black text-indigo-600">
                    ${financials?.atCommissionBroker15Pct.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    TripLink & MyLe Paratransit
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                  <div className="text-xs text-gray-500 font-medium mb-1">Средний чек за поездку</div>
                  <div className="text-2xl font-black text-gray-900">
                    ${financials?.avgFarePerTrip.toFixed(2) || '0.00'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Gross Fare Avg
                  </div>
                </div>
              </div>

              {/* Revenue Channels Breakdown */}
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
                <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  Разбивка выручки по каналам заказов
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-semibold text-gray-700">Мобильное приложение (Direct App)</span>
                      <span className="text-xs font-bold text-emerald-700">{financials?.channelsBreakdown.app.pct || 0}%</span>
                    </div>
                    <div className="text-lg font-bold text-gray-900">${financials?.channelsBreakdown.app.fare.toFixed(2) || '0.00'}</div>
                    <div className="text-xs text-gray-500">Комиссия AT: ${financials?.channelsBreakdown.app.commission.toFixed(2) || '0.00'} ({financials?.channelsBreakdown.app.count || 0} поездок)</div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-semibold text-gray-700">AT AI Голосовой диспетчер</span>
                      <span className="text-xs font-bold text-indigo-700">{financials?.channelsBreakdown.atAi.pct || 0}%</span>
                    </div>
                    <div className="text-lg font-bold text-gray-900">${financials?.channelsBreakdown.atAi.fare.toFixed(2) || '0.00'}</div>
                    <div className="text-xs text-gray-500">Комиссия AT: ${financials?.channelsBreakdown.atAi.commission.toFixed(2) || '0.00'} ({financials?.channelsBreakdown.atAi.count || 0} поездок)</div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-semibold text-gray-700">MTA Брокерские (TripLink/MyLe)</span>
                      <span className="text-xs font-bold text-blue-700">{financials?.channelsBreakdown.broker.pct || 0}%</span>
                    </div>
                    <div className="text-lg font-bold text-gray-900">${financials?.channelsBreakdown.broker.fare.toFixed(2) || '0.00'}</div>
                    <div className="text-xs text-gray-500">Комиссия AT (15%): ${financials?.channelsBreakdown.broker.commission.toFixed(2) || '0.00'} ({financials?.channelsBreakdown.broker.count || 0} поездок)</div>
                  </div>
                </div>
              </div>

              {/* Trend Chart (Earnings & Commission Dynamic) */}
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    Динамика заработка водителя и комиссии AT за период
                  </h4>
                  <span className="text-xs text-gray-500">USD ($)</span>
                </div>

                <div className="h-64 w-full">
                  {financials && financials.trendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={financials.trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorDriver" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorAt" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                        <Tooltip 
                          formatter={(value: any) => [`$${Number(value).toFixed(2)}`, '']}
                          contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', border: 'none' }}
                        />
                        <Legend verticalAlign="top" height={36} iconType="circle" />
                        <Area type="monotone" dataKey="driverEarnings" name="Выплата водителю (Net)" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorDriver)" />
                        <Area type="monotone" dataKey="atCommission" name="Комиссия AT" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAt)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                      Недостаточно данных за выбранный период
                    </div>
                  )}
                </div>
              </div>

              {/* Driver Payout History Table */}
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      История выплат водителю
                    </h4>
                    <p className="text-xs text-gray-500">Банковские переводы ACH и моментальные выплаты</p>
                  </div>
                </div>

                {!canViewPayoutDetails ? (
                  <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-600" />
                    <span>Детали банковских выплат доступны только ролям Admin и Finance.</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-gray-600 font-semibold border-b border-gray-200">
                        <tr>
                          <th className="py-2.5 px-3">Дата</th>
                          <th className="py-2.5 px-3">Расчётный период</th>
                          <th className="py-2.5 px-3">Сумма ($)</th>
                          <th className="py-2.5 px-3">Метод выплаты</th>
                          <th className="py-2.5 px-3">Статус</th>
                          <th className="py-2.5 px-3">ID транзакции</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {payouts.length > 0 ? (
                          payouts.map((p) => (
                            <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-2.5 px-3 font-medium text-gray-900">{p.date}</td>
                              <td className="py-2.5 px-3 text-gray-600">{p.period}</td>
                              <td className="py-2.5 px-3 font-bold text-emerald-700">${p.amount.toFixed(2)}</td>
                              <td className="py-2.5 px-3 text-gray-700">{p.method}</td>
                              <td className="py-2.5 px-3">
                                {p.status === 'settled' ? (
                                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                                    Settled (Выплачено)
                                  </span>
                                ) : p.status === 'processing' ? (
                                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
                                    Processing (В обработке)
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                                    Pending (Ожидает)
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-gray-500">{p.referenceId}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="py-6 text-center text-gray-400">
                              Нет истории выплат для данного водителя
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: ЗАКАЗЫ И АКТИВНОСТЬ (TRIPS & BEHAVIOR)                              */}
          {/* ========================================================================= */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              {/* Behavioral Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                  <div className="text-xs text-gray-500 font-medium mb-1">Acceptance Rate (Принятие)</div>
                  <div className="text-2xl font-black text-gray-900 flex items-center justify-between">
                    <span>{activity ? `${activity.acceptRate}%` : '94.2%'}</span>
                    <span className={`text-xs px-2 py-0.5 rounded font-bold ${(activity?.acceptRate || 94) >= (activity?.fleetAvgAcceptRate || 88.5) ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                      {(activity?.acceptRate || 94) >= (activity?.fleetAvgAcceptRate || 88.5) ? 'Выше нормы' : 'Ниже нормы'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Среднее по парку: {activity?.fleetAvgAcceptRate || 88.5}%
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                  <div className="text-xs text-gray-500 font-medium mb-1">Cancellation Rate (Отмены)</div>
                  <div className="text-2xl font-black text-gray-900 flex items-center justify-between">
                    <span>{activity ? `${activity.cancellationRate}%` : '1.8%'}</span>
                    <span className={`text-xs px-2 py-0.5 rounded font-bold ${(activity?.cancellationRate || 2) <= (activity?.fleetAvgCancelRate || 4.2) ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                      {(activity?.cancellationRate || 2) <= (activity?.fleetAvgCancelRate || 4.2) ? 'В норме' : 'Превышает'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Среднее по парку: {activity?.fleetAvgCancelRate || 4.2}%
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                  <div className="text-xs text-gray-500 font-medium mb-1">Часы активности / онлайн</div>
                  <div className="text-2xl font-black text-emerald-600">
                    {activity?.estimatedOnlineHours || 38} <span className="text-sm font-normal text-gray-500">часов</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {activity?.completedTrips || 0} выполненных смен/рейсов
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                  <div className="text-xs text-gray-500 font-medium mb-1">Соответствие зоне (Coverage)</div>
                  <div className="text-2xl font-black text-indigo-600">
                    {activity?.coverageCompliancePct || 96}%
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Поездок в заявленных районах Queens
                  </div>
                </div>
              </div>

              {/* Neighborhoods Worked vs Declared */}
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
                <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  Фактические районы выполнения поездок vs Заявленные зоны
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {activity && activity.neighborhoodsWorked.map((n, i) => (
                    <div key={i} className={`p-3 rounded-lg border text-center ${n.isDeclared ? 'bg-emerald-50/60 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="text-xs font-bold text-gray-900 truncate">{n.name}</div>
                      <div className="text-lg font-black text-gray-900 mt-0.5">{n.count} <span className="text-xs font-normal text-gray-500">рейсов</span></div>
                      <div className="text-[11px] font-medium text-emerald-700">{n.pct}% от общего</div>
                      {n.isDeclared ? (
                        <span className="inline-block mt-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">В зоне</span>
                      ) : (
                        <span className="inline-block mt-1 text-[10px] font-bold text-slate-700 bg-slate-200 px-1.5 py-0.5 rounded">Вне зоны</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Weekday & Hourly Driving Activity Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
                  <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    Активность по дням недели (Mon - Sun)
                  </h4>
                  <div className="h-52 w-full">
                    {activity ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={activity.weekdayActivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', border: 'none' }} />
                          <Bar dataKey="trips" name="Поездки" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : null}
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
                  <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    Распределение поездок по часам суток
                  </h4>
                  <div className="h-52 w-full">
                    {activity ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={activity.hourlyActivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="hour" tick={{ fontSize: 9, fill: '#64748b' }} interval={3} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', border: 'none' }} />
                          <Area type="monotone" dataKey="trips" name="Поездок" stroke="#6366f1" fill="#818cf8" fillOpacity={0.3} />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Table of Driver Orders */}
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
                <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  Последние заказы водителя за период
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-gray-600 font-semibold border-b border-gray-200">
                      <tr>
                        <th className="py-2.5 px-3">ID Заказа</th>
                        <th className="py-2.5 px-3">Дата / Время</th>
                        <th className="py-2.5 px-3">Тип</th>
                        <th className="py-2.5 px-3">Пассажир</th>
                        <th className="py-2.5 px-3">Маршрут (Pickup → Dropoff)</th>
                        <th className="py-2.5 px-3">Сумма</th>
                        <th className="py-2.5 px-3">Комиссия AT</th>
                        <th className="py-2.5 px-3">Выплата</th>
                        <th className="py-2.5 px-3">Статус</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {driverOrders.length > 0 ? (
                        driverOrders.slice(0, 15).map((o) => (
                          <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-2.5 px-3 font-mono font-semibold text-gray-900">{o.orderNumber}</td>
                            <td className="py-2.5 px-3 text-gray-600">{new Date(o.createdAt).toLocaleDateString('ru-RU')} {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                            <td className="py-2.5 px-3">
                              {o.type === 'mta_broker' ? (
                                <span className="px-2 py-0.5 rounded font-bold bg-blue-100 text-blue-800 text-[10px]">MTA Broker</span>
                              ) : (
                                <span className="px-2 py-0.5 rounded font-bold bg-gray-100 text-gray-700 text-[10px]">Standard</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-medium text-gray-900">{o.passengerName}</td>
                            <td className="py-2.5 px-3 text-gray-700 max-w-xs truncate" title={`${o.pickupAddress} → ${o.dropoffAddress}`}>
                              <span className="font-semibold">{o.pickupNeighborhood}</span> → {o.dropoffNeighborhood}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-gray-900">${o.fareAmount.toFixed(2)}</td>
                            <td className="py-2.5 px-3 text-indigo-700 font-semibold">${o.atCommissionAmount.toFixed(2)}</td>
                            <td className="py-2.5 px-3 text-emerald-700 font-bold">${o.driverPayout.toFixed(2)}</td>
                            <td className="py-2.5 px-3">
                              {o.status === 'completed' ? (
                                <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 text-[10px]">Завершён</span>
                              ) : o.status === 'cancelled' ? (
                                <span className="px-2 py-0.5 rounded-full font-bold bg-rose-100 text-rose-800 text-[10px]" title={o.notes}>Отменён</span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800 text-[10px]">В процессе</span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={9} className="py-6 text-center text-gray-400">
                            Нет заказов водителя за выбранный период
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: AI-ОЦЕНКА (AT AI INSIGHT)                                          */}
          {/* ========================================================================= */}
          {activeTab === 'ai-insight' && canViewAiInsights && (
            <div className="space-y-6">
              {/* Header Action Card */}
              <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-5 border border-indigo-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-lg font-bold">AT AI Интеллектуальный аудит водителя</h3>
                    <span className="px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200 text-xs font-mono">Gemini 3.7 Flash</span>
                  </div>
                  <p className="text-xs text-indigo-200 max-w-2xl leading-relaxed">
                    Комплексный анализ поведенческой телеметрии, дисциплины принятия заказов, уровня отмен, отзывов пассажиров и соблюдения зоны лицензирования TLC Queens.
                  </p>
                </div>

                <button
                  id="btn-refresh-ai-assessment"
                  disabled={isGeneratingAi}
                  onClick={handleGenerateAiAssessment}
                  className="shrink-0 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isGeneratingAi ? 'animate-spin' : ''}`} />
                  {isGeneratingAi ? 'Анализирую телеметрию...' : 'Обновить AI-оценку'}
                </button>
              </div>

              {/* Latest Assessment Detail Card */}
              {latestAi ? (
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-6">
                  {/* Verdict & Risk Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      {getRiskBadge(latestAi.riskLevel)}
                      <span className="text-xs text-gray-500 font-medium">
                        Уверенность модели: <strong className="text-gray-900">{latestAi.confidenceScore}%</strong>
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      Дата оценки: {new Date(latestAi.date).toLocaleString('ru-RU')}
                    </span>
                  </div>

                  {/* 2-3 Sentences Verdict */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Заключение AI-аналитика:</h4>
                    <p className="text-base font-semibold text-gray-900 leading-relaxed">
                      {latestAi.verdict}
                    </p>
                  </div>

                  {/* Observations & Signals */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-indigo-600" />
                      Ключевые поведенческие наблюдения
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {latestAi.observations.map((obs, i) => (
                        <div 
                          key={i} 
                          className={`p-3.5 rounded-xl border text-xs ${
                            obs.type === 'positive' ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' :
                            obs.type === 'warning' ? 'bg-amber-50/70 border-amber-200 text-amber-950' :
                            obs.type === 'critical' ? 'bg-rose-50/70 border-rose-200 text-rose-950' :
                            'bg-slate-50 border-slate-200 text-slate-900'
                          }`}
                        >
                          <div className="font-bold mb-1 flex items-center gap-1.5">
                            {obs.type === 'positive' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                            {obs.type === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                            {obs.type === 'critical' && <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
                            {obs.title}
                          </div>
                          <p className="text-gray-700 leading-relaxed">{obs.detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Manager Recommendations */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Рекомендации для менеджера флота
                    </h4>
                    <div className="space-y-2">
                      {latestAi.recommendations.map((rec, i) => (
                        <div key={i} className="flex items-start gap-2.5 p-3 rounded-lg bg-emerald-50/40 border border-emerald-100 text-xs text-gray-800">
                          <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-[10px]">
                            {i + 1}
                          </span>
                          <span className="pt-0.5">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center space-y-4">
                  <Sparkles className="w-12 h-12 text-indigo-400 mx-auto animate-bounce" />
                  <h4 className="text-base font-bold text-gray-900">AI-оценка для этого водителя ещё не сформирована</h4>
                  <p className="text-xs text-gray-500 max-w-md mx-auto">
                    Нажмите «Обновить AI-оценку», чтобы запустить серверный анализ по реальным поездкам, жалобам и активности.
                  </p>
                  <button
                    onClick={handleGenerateAiAssessment}
                    disabled={isGeneratingAi}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md inline-flex items-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${isGeneratingAi ? 'animate-spin' : ''}`} />
                    Сформировать первую AI-оценку
                  </button>
                </div>
              )}

              {/* Assessment History Timeline */}
              {aiAssessments.length > 1 && (
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
                  <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    История предыдущих AI-оценок (Динамика риска)
                  </h4>
                  <div className="space-y-3">
                    {aiAssessments.slice(1).map((hist) => (
                      <div key={hist.id} className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900">{new Date(hist.date).toLocaleDateString('ru-RU')}</span>
                            {getRiskBadge(hist.riskLevel)}
                          </div>
                          <p className="text-gray-600 line-clamp-1">{hist.verdict}</p>
                        </div>
                        <span className="text-gray-400 shrink-0 text-[11px]">Точность: {hist.confidenceScore}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: TLC ДОКУМЕНТЫ & COMPLIANCE                                         */}
          {/* ========================================================================= */}
          {activeTab === 'documents' && (
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
              <DriverDocumentsSection 
                driver={driver}
                currentRole={currentRole}
                onOpenDocViewer={onOpenDocViewer}
                onStatusChanged={loadDriverAnalytics}
              />
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 6: РЕФЕРАЛЬНАЯ ПРОГРАММА & QR-КОДЫ                                   */}
          {/* ========================================================================= */}
          {activeTab === 'referrals' && (
            <DriverReferralsTab 
              driver={driver} 
              onRefreshDriver={loadDriverAnalytics}
              onOpenLandingPage={onOpenLandingPage}
            />
          )}

        </div>

        {/* REJECTION / BLOCK MODAL */}
        {showRejectModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-base">
                <AlertTriangle className="w-5 h-5" />
                Блокировка / Отклонение водителя
              </div>
              <p className="text-xs text-gray-600">
                Укажите официальную причину приостановки допуска к заказам Accessible Transit (например: просрочена страховка TLC FHV, грубые нарушения зоны Queens):
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Причина блокировки водителя..."
                rows={3}
                className="w-full text-xs p-3 border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-rose-500"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  Отмена
                </button>
                <button
                  onClick={async () => {
                    await onUpdateStatus(driver.id, 'suspended', rejectionReason || 'Отклонён администрацией парка');
                    setShowRejectModal(false);
                    showToast('Водитель заблокирован', 'info');
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm"
                >
                  Подтвердить блокировку
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
