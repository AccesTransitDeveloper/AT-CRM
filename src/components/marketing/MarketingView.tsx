import React, { useState, useEffect } from 'react';
import { 
  UserRole, 
  StrategyReport, 
  PromoCampaign, 
  PassengerSegment, 
  DriverOptimizationCandidate, 
  TicketSentimentSummary, 
  AdCopyVariant 
} from '../../types';
import { api } from '../../lib/api';
import { 
  Sparkles, 
  Flame, 
  PieChart as PieChartIcon, 
  TrendingUp, 
  AlertTriangle, 
  Users, 
  Tag, 
  MessageSquareHeart, 
  FileText, 
  RefreshCw, 
  CheckCircle2, 
  Copy, 
  Plus, 
  MapPin, 
  Clock, 
  ArrowUpRight, 
  Calendar, 
  Layers, 
  SlidersHorizontal,
  Lightbulb,
  ShieldCheck,
  Zap,
  TrendingDown,
  Percent,
  Compass,
  FileCheck2,
  Trash2,
  Lock
} from 'lucide-react';

interface MarketingViewProps {
  currentRole: UserRole;
  onNavigateToTab?: (tab: any) => void;
}

type SubSection = 'analytics' | 'strategy' | 'segmentation' | 'campaigns' | 'sentiment' | 'auto_reports';

export const MarketingView: React.FC<MarketingViewProps> = ({ currentRole }) => {
  const [activeSubSection, setActiveSubSection] = useState<SubSection>('analytics');
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [reports, setReports] = useState<StrategyReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<StrategyReport | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  
  // Segmentation
  const [passengers, setPassengers] = useState<PassengerSegment[]>([]);
  const [passengerFilter, setPassengerFilter] = useState<'all' | 'high_risk' | 'frequent' | 'wav'>('all');
  const [driverOptimization, setDriverOptimization] = useState<DriverOptimizationCandidate[]>([]);

  // Campaigns & Ad Copy
  const [campaigns, setCampaigns] = useState<PromoCampaign[]>([]);
  const [showNewCampaignModal, setShowNewCampaignModal] = useState(false);
  const [newCampaignData, setNewCampaignData] = useState({
    name: '',
    code: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 15,
    targetNeighborhood: 'Jackson Heights',
    targetSegment: 'All Passengers',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
    notes: ''
  });

  // AI Copy Generator state
  const [copyParams, setCopyParams] = useState({
    neighborhood: 'Jackson Heights',
    offer: '15% Off Airport and Paratransit Rides',
    tone: 'Friendly & Professional',
    promoCode: 'QUEENSWAV15'
  });
  const [copyVariants, setCopyVariants] = useState<AdCopyVariant[]>([]);
  const [generatingCopy, setGeneratingCopy] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Sentiment
  const [sentiment, setSentiment] = useState<TicketSentimentSummary | null>(null);
  const [analyzingSentiment, setAnalyzingSentiment] = useState(false);

  // Auto report config
  const [autoReportConfig, setAutoReportConfig] = useState<any>({
    enabled: true,
    frequency: 'weekly',
    dayOfWeek: 'Monday',
    time: '08:00 AM'
  });

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const isReadOnly = currentRole === 'finance'; // Finance can view but cannot edit marketing campaigns

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, reportsRes, passRes, optRes, campRes, sentRes, autoRes] = await Promise.all([
        api.getMarketingAnalytics(),
        api.getStrategyReports(),
        api.getPassengerSegments(),
        api.getDriverOptimization(),
        api.getPromoCampaigns(),
        api.getTicketSentiment(),
        api.getAutoReportConfig()
      ]);

      setAnalyticsData(analyticsRes);
      const safeReports = Array.isArray(reportsRes) ? reportsRes : [];
      setReports(safeReports);
      if (safeReports.length > 0 && !selectedReport) {
        setSelectedReport(safeReports[0]);
      }
      setPassengers(Array.isArray(passRes) ? passRes : []);
      setDriverOptimization(Array.isArray(optRes) ? optRes : []);
      setCampaigns(Array.isArray(campRes) ? campRes : []);
      setSentiment(sentRes);
      setAutoReportConfig(autoRes);
    } catch (err) {
      console.error("Error loading marketing data:", err);
      showToast("Ошибка загрузки данных маркетинга", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGenerateStrategyReport = async () => {
    setGeneratingReport(true);
    try {
      const res = await api.generateStrategyReport();
      if (res.success && res.report) {
        setReports(prev => [res.report, ...prev]);
        setSelectedReport(res.report);
        showToast("Новый ИИ-отчёт стратегии и прогноз спроса успешно сгенерированы!");
        setActiveSubSection('strategy');
      }
    } catch (err) {
      console.error("Error generating strategy report:", err);
      showToast("Не удалось сгенерировать стратегический отчёт", "error");
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleDeleteReport = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Удалить этот отчёт из архива?")) return;
    try {
      await api.deleteStrategyReport(id);
      const updated = reports.filter(r => r.id !== id);
      setReports(updated);
      if (selectedReport?.id === id) {
        setSelectedReport(updated.length > 0 ? updated[0] : null);
      }
      showToast("Отчёт удален из архива");
    } catch (err) {
      showToast("Ошибка при удалении отчёта", "error");
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    try {
      const created = await api.createPromoCampaign(newCampaignData);
      setCampaigns(prev => [created, ...prev]);
      setShowNewCampaignModal(false);
      showToast(`Промо-кампания "${created.code}" успешно создана!`);
      // Reset form
      setNewCampaignData({
        name: '',
        code: '',
        discountType: 'percentage',
        discountValue: 15,
        targetNeighborhood: 'Jackson Heights',
        targetSegment: 'All Passengers',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
        notes: ''
      });
    } catch (err) {
      showToast("Ошибка создания промо-кампании", "error");
    }
  };

  const handleGenerateAdCopy = async () => {
    setGeneratingCopy(true);
    try {
      const res = await api.generateAdCopy(copyParams);
      if (res.variants) {
        setCopyVariants(res.variants);
        showToast("ИИ создал 3 варианта рекламного текста!");
      }
    } catch (err) {
      showToast("Ошибка генерации текстов", "error");
    } finally {
      setGeneratingCopy(false);
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast("Текст скопирован в буфер обмена!");
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleReanalyzeSentiment = async () => {
    setAnalyzingSentiment(true);
    try {
      const res = await api.triggerSentimentAnalysis();
      setSentiment(res);
      showToast("Анализ тональности обращений поддержки обновлен!");
    } catch (err) {
      showToast("Ошибка анализа тональности", "error");
    } finally {
      setAnalyzingSentiment(false);
    }
  };

  const handleToggleAutoReport = async () => {
    if (isReadOnly) return;
    const newConf = { ...autoReportConfig, enabled: !autoReportConfig.enabled };
    try {
      await api.updateAutoReportConfig(newConf);
      setAutoReportConfig(newConf);
      showToast(`Авто-отчёты ${newConf.enabled ? 'включены' : 'отключены'}`);
    } catch (err) {
      showToast("Ошибка обновления настроек авто-отчётов", "error");
    }
  };

  // Filtered passengers
  const filteredPassengers = passengers.filter(p => {
    if (passengerFilter === 'high_risk') return p.churnRisk === 'high';
    if (passengerFilter === 'frequent') return p.frequencyCategory === 'frequent';
    if (passengerFilter === 'wav') return p.requiresWav;
    return true;
  });

  if (loading && !analyticsData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-slate-400 space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin text-sky-500" />
        <p className="text-sm">Загрузка данных рыночной аналитики и ИИ-стратегии Accessible Transit...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs sm:text-sm animate-fade-in ${
          notification.type === 'success' ? 'bg-emerald-950/80 border-emerald-700/60 text-emerald-200' :
          notification.type === 'error' ? 'bg-rose-950/80 border-rose-700/60 text-rose-200' :
          'bg-sky-950/80 border-sky-700/60 text-sky-200'
        }`}>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white ml-3">✕</button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950/80 border border-slate-700/60 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2.5 mb-1.5">
              <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Marketing & Market Intelligence
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                NYC Queens Paratransit
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Комплексный анализ спроса по районам Queens (Jackson Heights, Jamaica, Flushing, Kensington), ИИ-стратегия на базе Gemini LLM, мониторинг недообслуженных зон MTA, сегментация клиентов и управление промокодами.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleGenerateStrategyReport}
              disabled={generatingReport}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-medium text-xs sm:text-sm shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {generatingReport ? (
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Sparkles className="w-4 h-4 text-amber-300" />
              )}
              <span>{generatingReport ? 'ИИ анализирует метрики...' : 'Сгенерировать анализ рынка'}</span>
            </button>

            <button
              onClick={loadData}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white transition-all"
              title="Обновить данные"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Real-time KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-700/60">
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/40">
            <div className="text-[11px] text-slate-400 font-medium">Недельный оборот</div>
            <div className="text-base sm:text-lg font-bold text-white mt-0.5">
              ${(analyticsData?.metricsSnapshot?.totalWeeklyRevenue ?? 5490).toLocaleString()}
            </div>
            <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5 font-medium">
              <TrendingUp className="w-3 h-3" /> +14.2% vs прошл. нед.
            </div>
          </div>

          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/40">
            <div className="text-[11px] text-slate-400 font-medium">Комиссия AT 15% (Брокеры)</div>
            <div className="text-base sm:text-lg font-bold text-amber-300 mt-0.5">
              ${(analyticsData?.metricsSnapshot?.brokerCommission15PctTotal ?? 372).toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-300 mt-0.5">TripLink & MyLe MTA</div>
          </div>

          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/40">
            <div className="text-[11px] text-slate-400 font-medium">Активных промо-кампаний</div>
            <div className="text-base sm:text-lg font-bold text-sky-300 mt-0.5">
              {campaigns.filter(c => c.status === 'active').length}
            </div>
            <div className="text-[10px] text-slate-300 mt-0.5">ROI: ~520% средний</div>
          </div>

          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/40">
            <div className="text-[11px] text-slate-400 font-medium">Рейтинг автопарка / Недообслуженность</div>
            <div className="text-base sm:text-lg font-bold text-emerald-300 mt-0.5">
              4.93 ★ <span className="text-xs font-normal text-rose-300 ml-1">Flushing (WAV)</span>
            </div>
            <div className="text-[10px] text-rose-300 mt-0.5">Спрос превышает емкость</div>
          </div>
        </div>
      </div>

      {/* Sub-navigation Pills */}
      <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar pb-1 border-b border-slate-800">
        {[
          { id: 'analytics', label: '1. Дашборд аналитики & Теплокарта', icon: Flame },
          { id: 'strategy', label: '2. ИИ-стратег (SWOT & Прогноз)', icon: Sparkles, badge: reports.length },
          { id: 'segmentation', label: '3. Сегментация & Автопарк', icon: Users },
          { id: 'campaigns', label: '4. Промо-кампании & ИИ-копирайтер', icon: Tag },
          { id: 'sentiment', label: '5. Мониторинг репутации (Тикеты)', icon: MessageSquareHeart },
          { id: 'auto_reports', label: '6. Авто-отчёты ИИ', icon: FileCheck2 }
        ].map(item => {
          const Icon = item.icon;
          const isActive = activeSubSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSubSection(item.id as SubSection)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-slate-800 text-sky-400 border border-sky-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
              <span>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-700 text-slate-300 font-bold">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 1. MARKET ANALYTICS DASHBOARD (Heatmap, Channels & Underserved Zones) */}
      {/* ========================================================================= */}
      {activeSubSection === 'analytics' && analyticsData && (
        <div className="space-y-6">
          {/* Top Row: Demand Heatmap & Underserved Zones */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Heatmap Card (2 cols) */}
            <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-400" />
                    Тепловая карта спроса по районам Queens и часам дня
                  </h3>
                  <p className="text-xs text-slate-400">
                    Основана на реальной таблице заказов (orders) и брокерских заявках (MTA TripLink / MyLe)
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-slate-800 border border-slate-700"></span> Низкий</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-sky-600/60"></span> Средний</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500/80"></span> Высокий</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-rose-600"></span> Пиковый</span>
                </div>
              </div>

              {/* Heatmap Table Matrix */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-2.5 px-3 font-medium">Район Queens</th>
                      <th className="py-2.5 px-2 font-medium text-center">06-10ч (Утро)</th>
                      <th className="py-2.5 px-2 font-medium text-center">10-14ч (Клиники)</th>
                      <th className="py-2.5 px-2 font-medium text-center">14-18ч (День)</th>
                      <th className="py-2.5 px-2 font-medium text-center">18-22ч (Вечер)</th>
                      <th className="py-2.5 px-2 font-medium text-center">Всего / Нед</th>
                      <th className="py-2.5 px-2 font-medium text-right">Ср. чек</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {analyticsData.heatmap?.map((row: any) => {
                      const getBg = (val: number) => {
                        if (val > 30) return 'bg-rose-600/90 text-white font-bold';
                        if (val > 22) return 'bg-amber-500/80 text-slate-950 font-semibold';
                        if (val > 15) return 'bg-sky-600/60 text-white';
                        return 'bg-slate-800/70 text-slate-300';
                      };

                      return (
                        <tr key={row.neighborhood} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-3 font-medium text-slate-200">
                            <div className="flex items-center space-x-2">
                              <MapPin className="w-3.5 h-3.5 text-sky-400" />
                              <span>{row.neighborhood}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 pl-5.5">
                              WAV: {row.wavTrips} | Брокеры: {row.brokerTrips}
                            </div>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <span className={`px-2 py-1 rounded-md text-[11px] inline-block w-9 text-center ${getBg(row.hourlyDistribution.morning)}`}>
                              {row.hourlyDistribution.morning}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <span className={`px-2 py-1 rounded-md text-[11px] inline-block w-9 text-center ${getBg(row.hourlyDistribution.midday)}`}>
                              {row.hourlyDistribution.midday}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <span className={`px-2 py-1 rounded-md text-[11px] inline-block w-9 text-center ${getBg(row.hourlyDistribution.afternoon)}`}>
                              {row.hourlyDistribution.afternoon}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <span className={`px-2 py-1 rounded-md text-[11px] inline-block w-9 text-center ${getBg(row.hourlyDistribution.evening)}`}>
                              {row.hourlyDistribution.evening}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center font-bold text-slate-100">
                            {row.totalTrips}
                          </td>
                          <td className="py-3 px-2 text-right font-medium text-emerald-400">
                            ${row.avgFare?.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Underserved Zones Card (1 col) */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    Недообслуженные зоны
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    Live Dispatch Audit
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  Сравнение спроса на инвалидные коляски (WAV/MTA) с активными онлайн-водителями в районе:
                </p>

                <div className="space-y-3">
                  {analyticsData.underservedZones?.map((zone: any) => {
                    const isShortage = zone.capacityStatus !== 'adequate';
                    return (
                      <div
                        key={zone.neighborhood}
                        className={`p-3 rounded-xl border transition-all ${
                          zone.capacityStatus === 'critical_shortage'
                            ? 'bg-rose-950/40 border-rose-700/60'
                            : zone.capacityStatus === 'underserved'
                            ? 'bg-amber-950/30 border-amber-700/50'
                            : 'bg-slate-800/40 border-slate-700/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-semibold text-xs sm:text-sm text-slate-200 flex items-center gap-1.5">
                            <MapPin className={`w-3.5 h-3.5 ${isShortage ? 'text-rose-400' : 'text-emerald-400'}`} />
                            {zone.neighborhood}
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${
                            zone.capacityStatus === 'critical_shortage' ? 'bg-rose-500 text-white' :
                            zone.capacityStatus === 'underserved' ? 'bg-amber-500 text-slate-950' :
                            'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}>
                            {zone.capacityStatus === 'critical_shortage' ? 'Критический дефицит' :
                             zone.capacityStatus === 'underserved' ? 'Дефицит WAV' : 'В норме'}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-1 my-2 text-center text-[10px] text-slate-400">
                          <div className="bg-slate-900/60 p-1.5 rounded">
                            <div className="text-slate-400">Спрос</div>
                            <div className="font-bold text-white text-xs">{zone.pendingBrokerDemand} заказов</div>
                          </div>
                          <div className="bg-slate-900/60 p-1.5 rounded">
                            <div className="text-slate-400">Онлайн</div>
                            <div className="font-bold text-sky-400 text-xs">{zone.onlineDriversCount} водителей</div>
                          </div>
                          <div className="bg-slate-900/60 p-1.5 rounded">
                            <div className="text-slate-400">WAV авто</div>
                            <div className="font-bold text-amber-400 text-xs">{zone.wavDriversCount} авто</div>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-300 leading-tight">
                          {zone.shortageMessage}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Рекомендация: перенаправить водителей из Астории</span>
                <button
                  onClick={() => setActiveSubSection('segmentation')}
                  className="text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1"
                >
                  Перебалансировать <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Row: Channel Share & Weekly Trend */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Channel Breakdown Cards (1 col) */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <h3 className="text-base font-semibold text-white flex items-center gap-2 mb-1">
                <PieChartIcon className="w-4 h-4 text-sky-400" />
                Соотношение каналов заказов
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Сравнение выручки и долей: Пассажирское приложение / AT AI Голосовой агент / MTA Брокеры
              </p>

              <div className="space-y-3.5">
                {/* Broker Channel */}
                <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3.5">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                      Брокеры (TripLink, MyLe)
                    </span>
                    <span className="font-bold text-slate-200">{analyticsData.channelShare?.broker?.percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-700/60 h-2 rounded-full overflow-hidden mb-2">
                    <div className="bg-amber-400 h-full rounded-full" style={{ width: `${analyticsData.channelShare?.broker?.percentage}%` }} />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Выручка: <b className="text-white">${(analyticsData.channelShare?.broker?.revenue ?? 0).toLocaleString()}</b></span>
                    <span>AT 15%: <b className="text-amber-300">${((analyticsData.channelShare?.broker?.revenue ?? 0) * 0.15).toFixed(2)}</b></span>
                  </div>
                </div>

                {/* App Channel */}
                <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3.5">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-sky-300 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block" />
                      Пассажирское приложение AT
                    </span>
                    <span className="font-bold text-slate-200">{analyticsData.channelShare?.app?.percentage ?? 0}%</span>
                  </div>
                  <div className="w-full bg-slate-700/60 h-2 rounded-full overflow-hidden mb-2">
                    <div className="bg-sky-400 h-full rounded-full" style={{ width: `${analyticsData.channelShare?.app?.percentage ?? 0}%` }} />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Выручка: <b className="text-white">${(analyticsData.channelShare?.app?.revenue ?? 0).toLocaleString()}</b></span>
                    <span>Рост: <b className="text-emerald-400">{analyticsData.channelShare?.app?.growth || '+0%'}</b></span>
                  </div>
                </div>

                {/* AT AI Voice Channel */}
                <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3.5">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-indigo-300 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 inline-block" />
                      ИИ-диспетчер AT AI (Voice/Chat)
                    </span>
                    <span className="font-bold text-slate-200">{analyticsData.channelShare?.atAi?.percentage ?? 0}%</span>
                  </div>
                  <div className="w-full bg-slate-700/60 h-2 rounded-full overflow-hidden mb-2">
                    <div className="bg-indigo-400 h-full rounded-full" style={{ width: `${analyticsData.channelShare?.atAi?.percentage ?? 0}%` }} />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Выручка: <b className="text-white">${(analyticsData.channelShare?.atAi?.revenue ?? 0).toLocaleString()}</b></span>
                    <span>Рост: <b className="text-emerald-400">{analyticsData.channelShare?.atAi?.growth || '+0%'}</b></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Weekly Channel Trends Table & Bars (2 cols) */}
            <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Динамика каналов по неделям (Gross Revenue)
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Эволюция структуры брокерского потока и рост прямого пассажирского трафика за последние 4 недели
                </p>

                <div className="space-y-4">
                  {(analyticsData.weeklyTrends || []).map((week: any, idx: number) => {
                    const maxTotal = 6000;
                    const appW = ((week?.app ?? 0) / maxTotal) * 100;
                    const aiW = ((week?.atAi ?? 0) / maxTotal) * 100;
                    const brokerW = ((week?.broker ?? 0) / maxTotal) * 100;

                    return (
                      <div key={week.week || idx} className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-slate-300">{week.week}</span>
                          <span className="font-bold text-white">${(week?.total ?? 0).toLocaleString()}</span>
                        </div>
                        {/* Segmented Stacked Bar */}
                        <div className="h-4 w-full bg-slate-800 rounded-lg overflow-hidden flex">
                          <div
                            style={{ width: `${appW}%` }}
                            className="bg-sky-500 hover:bg-sky-400 transition-all"
                            title={`App: $${week.app}`}
                          />
                          <div
                            style={{ width: `${aiW}%` }}
                            className="bg-indigo-500 hover:bg-indigo-400 transition-all"
                            title={`AT AI: $${week.atAi}`}
                          />
                          <div
                            style={{ width: `${brokerW}%` }}
                            className="bg-amber-500 hover:bg-amber-400 transition-all"
                            title={`Broker (15% AT): $${week.broker}`}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>App: ${week.app}</span>
                          <span>AT AI: ${week.atAi}</span>
                          <span>Broker: ${week.broker}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  Прямой канал (App + AI) вырос с 51% до 62% от общего объема
                </span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> +26.8% AT AI
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. AI STRATEGY ADVISOR (SWOT, Strategic Recommendations, 7-Day Forecast) */}
      {/* ========================================================================= */}
      {activeSubSection === 'strategy' && (
        <div className="space-y-6">
          {/* Top Bar with Report Selector & Generate Action */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="text-base sm:text-lg font-bold text-white">
                  ИИ-Стратег (AI Market Strategy Advisor)
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Автоматический синтез операционных показателей CRM через Gemini 3.7 Flash: SWOT-анализ, точечные рекомендации и прогноз спроса на 7 дней.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              {reports.length > 1 && (
                <select
                  value={selectedReport?.id || ''}
                  onChange={(e) => {
                    const found = reports.find(r => r.id === e.target.value);
                    if (found) setSelectedReport(found);
                  }}
                  className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:ring-1 focus:ring-sky-500 focus:outline-none"
                >
                  {reports.map((r, idx) => (
                    <option key={r.id} value={r.id}>
                      {r.title} ({new Date(r.createdAt).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              )}

              <button
                onClick={handleGenerateStrategyReport}
                disabled={generatingReport}
                className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
              >
                {generatingReport ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                )}
                <span>{generatingReport ? 'Генерация...' : 'Обновить анализ'}</span>
              </button>
            </div>
          </div>

          {selectedReport ? (
            <div className="space-y-6">
              {/* Executive Summary Card */}
              <div className="bg-gradient-to-r from-indigo-950/60 to-slate-900 border border-indigo-700/40 rounded-2xl p-5 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4 text-amber-400" />
                    Executive Summary & Market Context
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Период: <b className="text-slate-200">{selectedReport.period}</b>
                  </span>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed font-normal">
                  {selectedReport.executiveSummary}
                </p>
              </div>

              {/* 4-Box Visual SWOT Matrix */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
                <h4 className="text-base font-semibold text-white flex items-center gap-2 mb-4">
                  <ShieldCheck className="w-4 h-4 text-sky-400" />
                  SWOT-анализ текущего положения на рынке Queens
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Strengths */}
                  <div className="bg-emerald-950/30 border border-emerald-700/50 rounded-xl p-4">
                    <div className="flex items-center space-x-2 mb-2.5">
                      <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
                      <h5 className="font-bold text-xs sm:text-sm text-emerald-300 uppercase tracking-wide">
                        Strengths (Сильные стороны)
                      </h5>
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-200 list-disc list-inside">
                      {selectedReport.swot?.strengths?.map((item, idx) => (
                        <li key={idx} className="leading-snug">{item}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Weaknesses */}
                  <div className="bg-rose-950/30 border border-rose-700/50 rounded-xl p-4">
                    <div className="flex items-center space-x-2 mb-2.5">
                      <span className="w-3 h-3 rounded-full bg-rose-400 inline-block" />
                      <h5 className="font-bold text-xs sm:text-sm text-rose-300 uppercase tracking-wide">
                        Weaknesses (Слабые места)
                      </h5>
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-200 list-disc list-inside">
                      {selectedReport.swot?.weaknesses?.map((item, idx) => (
                        <li key={idx} className="leading-snug">{item}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Opportunities */}
                  <div className="bg-sky-950/30 border border-sky-700/50 rounded-xl p-4">
                    <div className="flex items-center space-x-2 mb-2.5">
                      <span className="w-3 h-3 rounded-full bg-sky-400 inline-block" />
                      <h5 className="font-bold text-xs sm:text-sm text-sky-300 uppercase tracking-wide">
                        Opportunities (Возможности роста)
                      </h5>
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-200 list-disc list-inside">
                      {selectedReport.swot?.opportunities?.map((item, idx) => (
                        <li key={idx} className="leading-snug">{item}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Threats */}
                  <div className="bg-amber-950/30 border border-amber-700/50 rounded-xl p-4">
                    <div className="flex items-center space-x-2 mb-2.5">
                      <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
                      <h5 className="font-bold text-xs sm:text-sm text-amber-300 uppercase tracking-wide">
                        Threats (Угрозы и риски)
                      </h5>
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-200 list-disc list-inside">
                      {selectedReport.swot?.threats?.map((item, idx) => (
                        <li key={idx} className="leading-snug">{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Strategic Recommendations Cards */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
                <h4 className="text-base font-semibold text-white flex items-center gap-2 mb-4">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Точечные стратегические рекомендации ИИ
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedReport.recommendations?.map((rec, idx) => (
                    <div key={rec.id || idx} className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 hover:border-slate-600 transition-all flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
                            rec.category === 'driver_recruitment' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                            rec.category === 'pricing' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                            rec.category === 'mta_brokerage' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                            'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                          }`}>
                            {rec.category === 'driver_recruitment' ? 'Найм водителей' :
                             rec.category === 'pricing' ? 'Ценообразование' :
                             rec.category === 'mta_brokerage' ? 'MTA Брокеры' : 'Привлечение клиентов'}
                          </span>

                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                            rec.impact === 'high' ? 'bg-rose-500 text-white' :
                            rec.impact === 'medium' ? 'bg-amber-500 text-slate-950' : 'bg-slate-700 text-slate-300'
                          }`}>
                            Влияние: {rec.impact}
                          </span>
                        </div>

                        <h5 className="font-semibold text-xs sm:text-sm text-slate-100 mb-1.5">
                          {rec.title}
                        </h5>
                        <p className="text-xs text-slate-300 leading-relaxed mb-3">
                          {rec.description}
                        </p>
                      </div>

                      <div className="pt-2.5 border-t border-slate-700/60 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-sky-400" /> {rec.targetArea}
                        </span>
                        {rec.estimatedRevenueUplift && (
                          <span className="text-emerald-400 font-semibold">
                            {rec.estimatedRevenueUplift}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 7-Day Demand Forecast */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
                <h4 className="text-base font-semibold text-white flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  Прогноз спроса на 7 дней по районам Queens
                </h4>
                <p className="text-xs text-slate-400 mb-4">
                  Оценка ожидаемого объема поездок, пиковых часов и рекомендуемого количества дежурных WAV-водителей
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="py-2.5 px-3 font-medium">Район</th>
                        <th className="py-2.5 px-3 font-medium">Ожидаемый спрос (7д)</th>
                        <th className="py-2.5 px-3 font-medium">Динамика роста</th>
                        <th className="py-2.5 px-3 font-medium">Пиковые часы (Клиники/Аэропорт)</th>
                        <th className="py-2.5 px-3 font-medium">Реком. WAV водителей</th>
                        <th className="py-2.5 px-3 font-medium text-right">Точность ИИ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {selectedReport.forecast?.map((f, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-3 font-semibold text-slate-200 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-sky-400" />
                            {f.neighborhood}
                          </td>
                          <td className="py-3 px-3 font-bold text-white">
                            {f.expectedTrips7d} поездок
                          </td>
                          <td className="py-3 px-3 font-semibold text-emerald-400">
                            {f.growthRate}
                          </td>
                          <td className="py-3 px-3 text-slate-300">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {f.peakHours}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                              {f.recommendedWavDrivers} авто
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-medium text-indigo-300">
                            {f.confidenceScore}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Reports Archive */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
                <h4 className="text-base font-semibold text-white flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  Архив стратегических отчётов ИИ
                </h4>

                <div className="space-y-2">
                  {reports.map(r => (
                    <div
                      key={r.id}
                      onClick={() => setSelectedReport(r)}
                      className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        selectedReport.id === r.id
                          ? 'bg-slate-800/90 border-sky-500/60 shadow-sm'
                          : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className={`w-4 h-4 ${selectedReport.id === r.id ? 'text-sky-400' : 'text-slate-400'}`} />
                        <div>
                          <div className="font-semibold text-xs sm:text-sm text-slate-200">
                            {r.title}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Сгенерирован: {r.createdAt ? new Date(r.createdAt).toLocaleString() : 'N/A'} | Период: {r.period}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {selectedReport.id === r.id && (
                          <span className="text-[10px] px-2 py-0.5 bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded font-semibold">
                            Просматривается
                          </span>
                        )}
                        {!isReadOnly && reports.length > 1 && (
                          <button
                            onClick={(e) => handleDeleteReport(r.id, e)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                            title="Удалить из архива"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400">
              <Sparkles className="w-8 h-8 mx-auto text-slate-500 mb-2" />
              <p>Нет сохраненных отчётов. Нажмите «Сгенерировать анализ рынка» выше.</p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. CUSTOMER & FLEET SEGMENTATION */}
      {/* ========================================================================= */}
      {activeSubSection === 'segmentation' && (
        <div className="space-y-6">
          {/* Passenger Segmentation Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-sky-400" />
                  Сегментация пассажиров и анализ оттока (Churn Risk)
                </h3>
                <p className="text-xs text-slate-400">
                  Кластеризация по частоте поездок, основному каналу бронирования и риску потери клиента
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center space-x-1 bg-slate-800 p-1 rounded-xl text-xs">
                {[
                  { id: 'all', label: 'Все' },
                  { id: 'high_risk', label: 'Риск оттока (High Churn)' },
                  { id: 'frequent', label: 'Постоянные' },
                  { id: 'wav', label: 'WAV Paratransit' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setPassengerFilter(f.id as any)}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                      passengerFilter === f.id ? 'bg-sky-600 text-white' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2.5 px-3 font-medium">Пассажир / Телефон</th>
                    <th className="py-2.5 px-3 font-medium">Поездок</th>
                    <th className="py-2.5 px-3 font-medium">LTV / Выручка</th>
                    <th className="py-2.5 px-3 font-medium">Канал</th>
                    <th className="py-2.5 px-3 font-medium">Любимый район</th>
                    <th className="py-2.5 px-3 font-medium">Посл. заказ</th>
                    <th className="py-2.5 px-3 font-medium">Риск оттока</th>
                    <th className="py-2.5 px-3 font-medium text-right">Действие</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredPassengers.map(p => (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 font-medium text-slate-200">
                        <div className="font-semibold text-white">{p.passengerName}</div>
                        <div className="text-[10px] text-slate-400">{p.phone}</div>
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-100">
                        {p.totalTrips} поездок
                      </td>
                      <td className="py-3 px-3 font-semibold text-emerald-400">
                        ${p.totalSpent.toFixed(2)}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          p.primaryChannel === 'app' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' :
                          p.primaryChannel === 'at_ai' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                          'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {p.primaryChannel === 'app' ? 'AT App' :
                           p.primaryChannel === 'at_ai' ? 'AT AI Voice' : 'Broker MTA'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-300 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {p.favoriteNeighborhood}
                      </td>
                      <td className="py-3 px-3 text-slate-400">
                        {p.lastTripDate} ({p.daysSinceLastTrip === 0 ? 'Сегодня' : `${p.daysSinceLastTrip} дн. назад`})
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          p.churnRisk === 'high' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                          p.churnRisk === 'medium' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {p.churnRisk === 'high' ? 'Высокий риск' :
                           p.churnRisk === 'medium' ? 'Средний' : 'Активен'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => {
                            setCopyParams(prev => ({
                              ...prev,
                              neighborhood: p.favoriteNeighborhood,
                              offer: '15% Off Your Next Accessible Ride',
                              promoCode: 'QUEENSWAV15'
                            }));
                            setActiveSubSection('campaigns');
                            showToast(`Подготовлен промокод для района ${p.favoriteNeighborhood}`, 'info');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 text-[11px] font-medium transition-colors"
                        >
                          Отправить промо
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Driver Fleet Optimization & Rebalancing Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <h3 className="text-base font-semibold text-white flex items-center gap-2 mb-1">
              <Compass className="w-4 h-4 text-amber-400" />
              Оптимизация автопарка и перебалансировка зон дежурства
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Кандидаты для перемещения из зон с низким спросом в дефицитные районы (MTA Hospital Corridors)
            </p>

            <div className="space-y-3">
              {driverOptimization.map(d => (
                <div
                  key={d.driverId}
                  className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-100 text-sm">{d.driverName}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-medium">
                        {d.vehicleType}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        d.priority === 'high' ? 'bg-rose-500 text-white' :
                        d.priority === 'medium' ? 'bg-amber-500 text-slate-950' : 'bg-slate-700 text-slate-300'
                      }`}>
                        Приоритет: {d.priority}
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span>Текущая зона: <b className="text-slate-200">{d.currentNeighborhood}</b></span>
                      <span>Заказов сегодня: <b className="text-white">{d.tripsToday}</b></span>
                      <span>Утилизация: <b className="text-sky-300">{d.utilizationRate}</b></span>
                      <span>Статус: <b className={d.isOnline ? 'text-emerald-400' : 'text-slate-400'}>{d.isOnline ? 'Онлайн' : 'Офлайн'}</b></span>
                    </div>

                    <p className="text-xs text-amber-200/90 leading-snug pt-1">
                      💡 {d.rebalanceReason}
                    </p>
                  </div>

                  <div className="flex flex-col items-end justify-center min-w-[200px] border-t md:border-t-0 md:border-l border-slate-700 pt-3 md:pt-0 md:pl-4">
                    <div className="text-[11px] text-slate-400">Целевая зона:</div>
                    <div className="font-bold text-xs sm:text-sm text-sky-400 mb-2">
                      {d.recommendedNeighborhood}
                    </div>
                    <button
                      onClick={() => showToast(`Диспетчерское уведомление отправлено водителю ${d.driverName}`, 'success')}
                      className="w-full sm:w-auto px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-sm transition-all"
                    >
                      Отправить водителю зону
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MARKETING CAMPAIGNS & AI AD COPY GENERATOR */}
      {/* ========================================================================= */}
      {activeSubSection === 'campaigns' && (
        <div className="space-y-6">
          {/* Active Campaigns Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <Tag className="w-4 h-4 text-emerald-400" />
                  Управление промокодами и рекламными кампаниями
                </h3>
                <p className="text-xs text-slate-400">
                  Отслеживание использования промокодов, привлеченной выручки и автоматический расчет ROI
                </p>
              </div>

              {!isReadOnly && (
                <button
                  onClick={() => setShowNewCampaignModal(true)}
                  className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/30 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Создать промокод</span>
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2.5 px-3 font-medium">Промокод / Название</th>
                    <th className="py-2.5 px-3 font-medium">Скидка</th>
                    <th className="py-2.5 px-3 font-medium">Целевой район</th>
                    <th className="py-2.5 px-3 font-medium">Срок действия</th>
                    <th className="py-2.5 px-3 font-medium">Заказов</th>
                    <th className="py-2.5 px-3 font-medium">Выручка</th>
                    <th className="py-2.5 px-3 font-medium">Расход (Скидки)</th>
                    <th className="py-2.5 px-3 font-medium">ROI %</th>
                    <th className="py-2.5 px-3 font-medium text-right">Статус</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {campaigns.map(c => (
                    <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 font-medium text-slate-200">
                        <div className="font-mono font-bold text-sky-400 text-xs sm:text-sm">{c.code}</div>
                        <div className="text-[11px] text-slate-300">{c.name}</div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-white">
                        {c.discountType === 'percentage' ? `${c.discountValue}%` : `$${c.discountValue}`}
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {c.targetNeighborhood}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-[11px]">
                        {c.startDate} — {c.endDate}
                      </td>
                      <td className="py-3 px-3 font-bold text-white">
                        {c.ordersCount}
                      </td>
                      <td className="py-3 px-3 font-semibold text-emerald-400">
                        ${c.revenueGenerated.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-rose-300">
                        -${c.discountSpent.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 font-bold text-emerald-300">
                        +{c.roiPercentage}%
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          c.status === 'active' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          c.status === 'scheduled' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' :
                          'bg-slate-700 text-slate-400'
                        }`}>
                          {c.status === 'active' ? 'Активен' : c.status === 'scheduled' ? 'Запланирован' : 'Истёк'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Ad Copy Generator Module */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center space-x-2 mb-1">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-semibold text-white">
                ИИ-Копирайтер рекламных текстов (AI Ad Copy Generator)
              </h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Генерация готовых продающих текстов для рассылок по SMS, публикаций в Instagram/Facebook и флаеров для медицинских центров Queens
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form Input (1 col) */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 space-y-3.5">
                <div>
                  <label className="block text-xs text-slate-300 mb-1 font-medium">Район кампании</label>
                  <select
                    value={copyParams.neighborhood}
                    onChange={(e) => setCopyParams({ ...copyParams, neighborhood: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="Jackson Heights">Jackson Heights (Elmhurst Corridor)</option>
                    <option value="Jamaica">Jamaica (Queens Hospital & Access-A-Ride)</option>
                    <option value="Flushing">Flushing (Downtown & Medical Plazas)</option>
                    <option value="Kensington">Kensington & Ditmas (Brooklyn/Queens Border)</option>
                    <option value="All Queens">Весь округ Queens</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1 font-medium">Суть предложения / Оффер</label>
                  <input
                    type="text"
                    value={copyParams.offer}
                    onChange={(e) => setCopyParams({ ...copyParams, offer: e.target.value })}
                    placeholder="Например: 15% скидка на поездки в клиники и аэропорт"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1 font-medium">Промокод</label>
                  <input
                    type="text"
                    value={copyParams.promoCode}
                    onChange={(e) => setCopyParams({ ...copyParams, promoCode: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1 font-medium">Тональность текста (Tone)</label>
                  <select
                    value={copyParams.tone}
                    onChange={(e) => setCopyParams({ ...copyParams, tone: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="Friendly & Caring">Заботливый & Доступный (Senior / WAV)</option>
                    <option value="Professional & Business">Деловой & Премиум (Airport TLC)</option>
                    <option value="Urgent Limited-Time">Срочный / Ограниченная акция</option>
                  </select>
                </div>

                <button
                  onClick={handleGenerateAdCopy}
                  disabled={generatingCopy}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-slate-950 font-bold text-xs shadow-md transition-all disabled:opacity-50"
                >
                  {generatingCopy ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-slate-950" />
                  )}
                  <span>{generatingCopy ? 'Генерация вариантов...' : 'Сгенерировать 3 варианта'}</span>
                </button>
              </div>

              {/* Generated Variants (2 cols) */}
              <div className="lg:col-span-2 space-y-3">
                {copyVariants.length > 0 ? (
                  copyVariants.map((variant) => (
                    <div
                      key={variant.id}
                      className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 relative group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {variant.channel}
                        </span>

                        <button
                          onClick={() => handleCopyText(`${variant.headline}\n\n${variant.bodyText}\n\n${variant.callToAction}`, variant.id)}
                          className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs transition-colors"
                        >
                          {copiedId === variant.id ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400 font-bold">Скопировано!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Скопировать</span>
                            </>
                          )}
                        </button>
                      </div>

                      <h5 className="font-bold text-xs sm:text-sm text-slate-100 mb-1">
                        {variant.headline}
                      </h5>
                      <p className="text-xs text-slate-300 whitespace-pre-line mb-2">
                        {variant.bodyText}
                      </p>
                      <div className="text-[11px] text-sky-400 font-medium">
                        👉 {variant.callToAction}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full min-h-[220px] bg-slate-800/30 border border-dashed border-slate-700 rounded-xl p-6 text-center text-slate-400">
                    <Sparkles className="w-8 h-8 text-slate-600 mb-2" />
                    <p className="text-xs">
                      Заполните параметры слева и нажмите «Сгенерировать 3 варианта», чтобы ИИ подготовил рекламные тексты для рассылки.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* New Campaign Modal */}
          {showNewCampaignModal && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Tag className="w-4 h-4 text-emerald-400" />
                    Создание промокода
                  </h3>
                  <button onClick={() => setShowNewCampaignModal(false)} className="text-slate-400 hover:text-white">✕</button>
                </div>

                <form onSubmit={handleCreateCampaign} className="space-y-3.5">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1 font-medium">Код промокода</label>
                    <input
                      type="text"
                      required
                      value={newCampaignData.code}
                      onChange={(e) => setNewCampaignData({ ...newCampaignData, code: e.target.value.toUpperCase() })}
                      placeholder="Например: JACKSON15"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 uppercase font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1 font-medium">Название кампании</label>
                    <input
                      type="text"
                      required
                      value={newCampaignData.name}
                      onChange={(e) => setNewCampaignData({ ...newCampaignData, name: e.target.value })}
                      placeholder="Например: Весенняя скидка на поездки в больницы"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-slate-100"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-300 mb-1 font-medium">Тип скидки</label>
                      <select
                        value={newCampaignData.discountType}
                        onChange={(e) => setNewCampaignData({ ...newCampaignData, discountType: e.target.value as any })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-slate-100"
                      >
                        <option value="percentage">Процентная (%)</option>
                        <option value="fixed">Фиксированная ($)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-300 mb-1 font-medium">Размер скидки</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={newCampaignData.discountValue}
                        onChange={(e) => setNewCampaignData({ ...newCampaignData, discountValue: Number(e.target.value) })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-slate-100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-300 mb-1 font-medium">Целевой район</label>
                      <select
                        value={newCampaignData.targetNeighborhood}
                        onChange={(e) => setNewCampaignData({ ...newCampaignData, targetNeighborhood: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-slate-100"
                      >
                        <option value="Jackson Heights">Jackson Heights</option>
                        <option value="Jamaica">Jamaica</option>
                        <option value="Flushing">Flushing</option>
                        <option value="Kensington">Kensington</option>
                        <option value="All Queens">Все районы</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-300 mb-1 font-medium">Сегмент</label>
                      <input
                        type="text"
                        value={newCampaignData.targetSegment}
                        onChange={(e) => setNewCampaignData({ ...newCampaignData, targetSegment: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-slate-100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-300 mb-1 font-medium">Дата начала</label>
                      <input
                        type="date"
                        value={newCampaignData.startDate}
                        onChange={(e) => setNewCampaignData({ ...newCampaignData, startDate: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-300 mb-1 font-medium">Дата окончания</label>
                      <input
                        type="date"
                        value={newCampaignData.endDate}
                        onChange={(e) => setNewCampaignData({ ...newCampaignData, endDate: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-slate-100"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowNewCampaignModal(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs hover:text-white"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md"
                    >
                      Запустить кампанию
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. REPUTATION & SENTIMENT MONITORING (Tickets) */}
      {/* ========================================================================= */}
      {activeSubSection === 'sentiment' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <MessageSquareHeart className="w-4 h-4 text-rose-400" />
                  Мониторинг репутации и анализ тональности обращений (Sentiment Analysis)
                </h3>
                <p className="text-xs text-slate-400">
                  ИИ-анализ тикетов службы поддержки водителей и пассажиров для выявления системных проблем и точек роста
                </p>
              </div>

              <button
                onClick={handleReanalyzeSentiment}
                disabled={analyzingSentiment}
                className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${analyzingSentiment ? 'animate-spin' : ''}`} />
                <span>{analyzingSentiment ? 'Анализ тикетов...' : 'Пересчитать тональность'}</span>
              </button>
            </div>

            {sentiment ? (
              <div className="space-y-6">
                {/* Sentiment Ratio Bar */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-emerald-950/30 border border-emerald-700/40 rounded-xl p-4">
                    <div className="text-xs text-emerald-300 font-medium">Позитивная тональность</div>
                    <div className="text-2xl font-bold text-emerald-400 mt-1">{sentiment.positivePct}%</div>
                    <div className="text-[11px] text-slate-300 mt-1">Благодарности водителям, удобство AT AI</div>
                  </div>

                  <div className="bg-sky-950/30 border border-sky-700/40 rounded-xl p-4">
                    <div className="text-xs text-sky-300 font-medium">Нейтральные обращения</div>
                    <div className="text-2xl font-bold text-sky-400 mt-1">{sentiment.neutralPct}%</div>
                    <div className="text-[11px] text-slate-300 mt-1">Запросы справок, статусы выплат, онбординг</div>
                  </div>

                  <div className="bg-rose-950/30 border border-rose-700/40 rounded-xl p-4">
                    <div className="text-xs text-rose-300 font-medium">Негативные жалобы</div>
                    <div className="text-2xl font-bold text-rose-400 mt-1">{sentiment.negativePct}%</div>
                    <div className="text-[11px] text-slate-300 mt-1">Задержки на шлагбаумах, споры по тарифам</div>
                  </div>
                </div>

                {/* Summary Box */}
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 text-xs sm:text-sm text-slate-200">
                  <span className="font-bold text-amber-300 mr-1.5">Заключение ИИ-аудитора:</span>
                  {sentiment.aiExecutiveSummary}
                </div>

                {/* Top 3 Recurring Issues */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-200 mb-3">
                    Топ-3 повторяющихся операционных тем и решения:
                  </h4>
                  <div className="space-y-3">
                    {sentiment.topIssues?.map((issue, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-xs sm:text-sm text-white">{issue.theme}</span>
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                              issue.severity === 'high' ? 'bg-rose-500 text-white' :
                              issue.severity === 'medium' ? 'bg-amber-500 text-slate-950' : 'bg-slate-700 text-slate-300'
                            }`}>
                              {issue.severity}
                            </span>
                            <span className="text-[11px] text-slate-400">({issue.count} инцидентов)</span>
                          </div>
                          <p className="text-xs text-emerald-300/90 leading-snug">
                            💡 Решение: {issue.suggestion}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400">
                Загрузка данных анализа тональности...
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. AUTOMATED AI REPORTS CONFIGURATION */}
      {/* ========================================================================= */}
      {activeSubSection === 'auto_reports' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg max-w-3xl">
            <h3 className="text-base font-semibold text-white flex items-center gap-2 mb-1">
              <FileCheck2 className="w-4 h-4 text-sky-400" />
              Автоматические еженедельные отчёты ИИ (Scheduled AI Reports)
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Настройка регулярной генерации стратегических сводок по расписанию с сохранением в архив CRM
            </p>

            <div className="space-y-5">
              {/* Toggle Enable */}
              <div className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700/60 rounded-xl">
                <div>
                  <div className="font-semibold text-xs sm:text-sm text-slate-100">
                    Автоматическая генерация отчётов
                  </div>
                  <div className="text-xs text-slate-400">
                    Каждую неделю ИИ синтезирует метрики всех каналов и формирует стратегический отчет
                  </div>
                </div>

                <button
                  disabled={isReadOnly}
                  onClick={handleToggleAutoReport}
                  className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                    autoReportConfig.enabled ? 'bg-sky-500' : 'bg-slate-700'
                  } ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    autoReportConfig.enabled ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Schedule Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-300 mb-1 font-medium">День недели</label>
                  <select
                    disabled={isReadOnly || !autoReportConfig.enabled}
                    value={autoReportConfig.dayOfWeek || 'Monday'}
                    onChange={(e) => setAutoReportConfig({ ...autoReportConfig, dayOfWeek: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 disabled:opacity-50"
                  >
                    <option value="Monday">Понедельник (08:00 AM)</option>
                    <option value="Wednesday">Среда (08:00 AM)</option>
                    <option value="Friday">Пятница (17:00 PM)</option>
                    <option value="Sunday">Воскресенье (20:00 PM)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1 font-medium">Частота отчётов</label>
                  <select
                    disabled={isReadOnly || !autoReportConfig.enabled}
                    value={autoReportConfig.frequency || 'weekly'}
                    onChange={(e) => setAutoReportConfig({ ...autoReportConfig, frequency: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 disabled:opacity-50"
                  >
                    <option value="weekly">Раз в неделю (Weekly Executive)</option>
                    <option value="biweekly">Раз в 2 недели</option>
                    <option value="monthly">Ежемесячный аудит</option>
                  </select>
                </div>
              </div>

              {/* Inclusions */}
              <div className="space-y-2 pt-2">
                <div className="text-xs font-semibold text-slate-300 mb-1">Включать в отчёт:</div>
                <label className="flex items-center space-x-2 text-xs text-slate-300">
                  <input type="checkbox" defaultChecked disabled className="rounded text-sky-500" />
                  <span>SWOT-анализ и операционные метрики</span>
                </label>
                <label className="flex items-center space-x-2 text-xs text-slate-300">
                  <input type="checkbox" defaultChecked disabled className="rounded text-sky-500" />
                  <span>7-дневный прогноз спроса по районам Queens</span>
                </label>
                <label className="flex items-center space-x-2 text-xs text-slate-300">
                  <input type="checkbox" defaultChecked disabled className="rounded text-sky-500" />
                  <span>Аудит недообслуженных зон MTA Paratransit</span>
                </label>
              </div>

              {!isReadOnly && (
                <button
                  onClick={() => {
                    api.updateAutoReportConfig(autoReportConfig);
                    showToast("Настройки расписания авто-отчётов сохранены!");
                  }}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md"
                >
                  Сохранить расписание
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
