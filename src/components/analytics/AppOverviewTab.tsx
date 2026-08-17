import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Download, 
  DollarSign, 
  Smartphone, 
  Activity, 
  Target, 
  ArrowRight, 
  Sparkles, 
  Upload,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { AppTarget, AppMetadataInfo } from '../../types';

interface AppOverviewTabProps {
  overviewData: {
    appId: AppTarget;
    periodDays: number;
    summary: {
      totalInstalls: number;
      installsGrowthPct: number;
      latestDau: number;
      avgWau: number;
      avgMau: number;
      avgD1: number;
      avgD7: number;
      avgD30: number;
      totalAdSpend: number;
      totalRegistrations: number;
      totalFirstActions: number;
      registrationRatePct: number;
      firstActionRatePct: number;
    };
    timeSeries: Array<{
      date: string;
      shortDate: string;
      installs: number;
      prevInstalls: number;
      dau: number;
      prevDau: number;
      firstActions: number;
      adSpend: number;
    }>;
    appCards: Array<AppMetadataInfo & {
      totalInstalls: number;
      dau: number;
      mau: number;
      d7Retention: number;
    }>;
  } | null;
  selectedApp: AppTarget;
  onSelectApp: (app: AppTarget) => void;
  onNavigateTab: (tab: 'funnel' | 'sources' | 'cohorts' | 'reviews' | 'ai_insights') => void;
  onOpenCsvModal: () => void;
  onOpenAddCampaignModal: () => void;
}

export const AppOverviewTab: React.FC<AppOverviewTabProps> = ({
  overviewData,
  selectedApp,
  onSelectApp,
  onNavigateTab,
  onOpenCsvModal,
  onOpenAddCampaignModal
}) => {
  const [chartMetric, setChartMetric] = useState<'installs' | 'dau' | 'firstActions'>('installs');

  if (!overviewData) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400">
        <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mr-3" />
        <span>Loading App Analytics overview...</span>
      </div>
    );
  }

  const summary = overviewData.summary || {
    totalInstalls: 0,
    installsGrowthPct: 0,
    latestDau: 0,
    avgWau: 0,
    avgMau: 0,
    avgD1: 0,
    avgD7: 0,
    avgD30: 0,
    totalAdSpend: 0,
    totalRegistrations: 0,
    totalFirstActions: 0,
    registrationRatePct: 0,
    firstActionRatePct: 0,
  };
  const timeSeries = overviewData.timeSeries || [];
  const appCards = overviewData.appCards || [];

  const blendedCac = (summary.totalInstalls || 0) > 0 
    ? ((summary.totalAdSpend || 0) / summary.totalInstalls).toFixed(2) 
    : '0.00';

  const costPerFirstAction = (summary.totalFirstActions || 0) > 0 
    ? ((summary.totalAdSpend || 0) / summary.totalFirstActions).toFixed(2) 
    : '0.00';

  return (
    <div className="space-y-6">
      
      {/* 4 Main Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Installs */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Installs</span>
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <Download className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white tracking-tight">{(summary.totalInstalls ?? 0).toLocaleString()}</span>
            <div className={`flex items-center text-xs font-semibold ${
              (summary.installsGrowthPct ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {(summary.installsGrowthPct ?? 0) >= 0 ? (
                <TrendingUp className="w-3.5 h-3.5 mr-1" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 mr-1" />
              )}
              <span>{(summary.installsGrowthPct ?? 0) > 0 ? `+${summary.installsGrowthPct}%` : `${summary.installsGrowthPct ?? 0}%`}</span>
            </div>
          </div>
          <p className="mt-1 text-xs text-slate-500">vs. previous period comparison</p>
        </div>

        {/* Daily Active Users (DAU) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Users (DAU / MAU)</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white tracking-tight">{(summary.latestDau ?? 0).toLocaleString()}</span>
            <span className="text-xs font-medium text-slate-400">MAU: <strong className="text-slate-200">{(summary.avgMau ?? 0).toLocaleString()}</strong></span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
            <span>WAU Avg: <strong className="text-slate-200">{(summary.avgWau ?? 0).toLocaleString()}</strong></span>
            <span className="text-emerald-400 font-medium">DAU/MAU: {(summary.avgMau ?? 0) > 0 ? Math.round(((summary.latestDau ?? 0) / summary.avgMau) * 100) : 0}%</span>
          </div>
        </div>

        {/* Retention D1 / D7 / D30 */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Retention Rates</span>
            <div className="p-2 bg-sky-500/10 text-sky-400 rounded-xl">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-bold text-white tracking-tight">{summary.avgD7 ?? 0}%</span>
              <span className="text-xs text-slate-400 ml-1.5 font-normal">D7 Avg</span>
            </div>
            <span className="text-xs font-semibold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full">D1: {summary.avgD1 ?? 0}%</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
            <span>D30 Long-term:</span>
            <span className="text-slate-200 font-semibold">{summary.avgD30 ?? 0}%</span>
          </div>
        </div>

        {/* Ad Spend & CAC */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ad Spend & CAC</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white tracking-tight">${(summary.totalAdSpend ?? 0).toLocaleString()}</span>
            <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">CAC: ${blendedCac}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
            <span>Cost per 1st Action:</span>
            <span className="text-slate-200 font-semibold">${costPerFirstAction}</span>
          </div>
        </div>

      </div>

      {/* 4 App Breakdown Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-white flex items-center space-x-2">
            <Smartphone className="w-4 h-4 text-indigo-400" />
            <span>4 Mobile Applications Portfolio Status</span>
          </h4>
          <span className="text-xs text-slate-400">Click card to filter dashboard view</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {appCards.map((app) => {
            const isSelected = selectedApp === app.id;
            return (
              <div
                key={app.id}
                onClick={() => onSelectApp(app.id)}
                className={`cursor-pointer relative p-4 rounded-2xl border transition-all ${
                  isSelected
                    ? 'bg-slate-800/90 border-indigo-500 ring-2 ring-indigo-500/30 shadow-lg shadow-indigo-500/10'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className={`p-2 rounded-xl text-lg ${
                      app.platform === 'ios' ? 'bg-sky-500/10 text-sky-400' : 'bg-emerald-500/10 text-emerald-400'
                    }`}>
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-semibold text-white">{app.title}</h5>
                      <span className="text-[10px] text-slate-400">{app.storeName} • v{app.version}</span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    app.audience === 'passengers' ? 'bg-indigo-500/15 text-indigo-300' : 'bg-amber-500/15 text-amber-300'
                  }`}>
                    {app.audience === 'passengers' ? 'Passenger' : 'Driver TLC'}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 pt-3 border-t border-slate-800 text-center">
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase">Installs</span>
                    <span className="text-xs font-bold text-white">{(app.totalInstalls ?? 0).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase">DAU</span>
                    <span className="text-xs font-bold text-emerald-400">{(app.dau ?? 0).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase">D7 Ret</span>
                    <span className="text-xs font-bold text-sky-400">{app.d7Retention ?? 0}%</span>
                  </div>
                </div>

                {isSelected && (
                  <div className="mt-3 flex items-center justify-center space-x-1 text-[11px] font-medium text-indigo-400 bg-indigo-500/10 py-1 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Currently Filtered</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Interactive Chart Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm">
        
        {/* Chart Header & Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h4 className="text-base font-semibold text-white flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <span>
                {chartMetric === 'installs' && 'Daily App Installs: Current vs Previous Period'}
                {chartMetric === 'dau' && 'Daily Active Users (DAU) Velocity'}
                {chartMetric === 'firstActions' && 'First Actions & Paid Ad Spend Correlation'}
              </span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              {selectedApp === 'all' ? 'Consolidated data across all 4 apps' : `Filtered by: ${selectedApp}`}
            </p>
          </div>

          <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setChartMetric('installs')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                chartMetric === 'installs' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Installs Comparison
            </button>
            <button
              onClick={() => setChartMetric('dau')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                chartMetric === 'dau' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              DAU Trend
            </button>
            <button
              onClick={() => setChartMetric('firstActions')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                chartMetric === 'firstActions' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Activations & Spend
            </button>
          </div>
        </div>

        {/* Chart Viewport */}
        <div className="h-72 w-full mt-6">
          <ResponsiveContainer width="100%" height="100%">
            {chartMetric === 'installs' ? (
              <AreaChart data={timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCurrentInstalls" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorPrevInstalls" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#64748b" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#64748b" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="shortDate" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} 
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Area 
                  type="monotone" 
                  dataKey="installs" 
                  name="Current Period Installs" 
                  stroke="#6366f1" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#colorCurrentInstalls)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="prevInstalls" 
                  name="Previous Period Installs" 
                  stroke="#64748b" 
                  strokeWidth={1.5} 
                  strokeDasharray="4 4" 
                  fillOpacity={1} 
                  fill="url(#colorPrevInstalls)" 
                />
              </AreaChart>
            ) : chartMetric === 'dau' ? (
              <AreaChart data={timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDau" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="shortDate" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} 
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Area 
                  type="monotone" 
                  dataKey="dau" 
                  name="Daily Active Users (DAU)" 
                  stroke="#10b981" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#colorDau)" 
                />
              </AreaChart>
            ) : (
              <BarChart data={timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="shortDate" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} 
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="firstActions" name="1st Ride/Action Activations" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="adSpend" name="Ad Spend ($)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

      </div>

      {/* Quick Access Action Deck */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Conversion Funnel Quick Card */}
        <div 
          onClick={() => onNavigateTab('funnel')}
          className="cursor-pointer bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
          </div>
          <h5 className="mt-3 text-sm font-semibold text-white">Conversion Funnel</h5>
          <p className="text-xs text-slate-400 mt-1">Track drop-off from App Install → Signup → 1st Trip Completed</p>
          <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-800 text-indigo-300">
            <span>Overall Activation:</span>
            <strong>{summary.firstActionRatePct}%</strong>
          </div>
        </div>

        {/* Traffic Sources Quick Card */}
        <div 
          onClick={() => onNavigateTab('sources')}
          className="cursor-pointer bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-5 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <Target className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
          </div>
          <h5 className="mt-3 text-sm font-semibold text-white">Traffic Sources & CAC</h5>
          <p className="text-xs text-slate-400 mt-1">Analyze Apple Search Ads, Google UAC, Meta, and Queens flyers</p>
          <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-800 text-emerald-300">
            <span>Blended CAC:</span>
            <strong>${blendedCac}</strong>
          </div>
        </div>

        {/* AI Recommendations Quick Card */}
        <div 
          onClick={() => onNavigateTab('ai_insights')}
          className="cursor-pointer bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-5 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
          </div>
          <h5 className="mt-3 text-sm font-semibold text-white">AI App Growth Insights</h5>
          <p className="text-xs text-slate-400 mt-1">Gemini AI automated funnel bottlenecks & budget allocation advice</p>
          <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-800 text-amber-300">
            <span>Status:</span>
            <strong>Ready for Audit</strong>
          </div>
        </div>

      </div>

    </div>
  );
};
