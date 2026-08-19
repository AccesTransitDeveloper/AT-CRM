import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { Flame, Tag, Target, TrendingUp, DollarSign, Users, Award, Sparkles } from 'lucide-react';

interface MarketingChartsProps {
  analyticsData: any;
  campaigns: any[];
}

const CHANNEL_COLORS: Record<string, string> = {
  'Google Ads (Search & Maps)': '#0284c7',
  'Meta / FB Queens Ads': '#8b5cf6',
  'Physician & Dialysis Ref': '#10b981',
  'Offline Flyers & Posters': '#f59e0b',
  'Driver In-App Promos': '#ec4899'
};

export const MarketingCharts: React.FC<MarketingChartsProps> = ({ analyticsData, campaigns }) => {
  const [activeTab, setActiveTab] = useState<'ad_channels' | 'demand_areas' | 'cac_roi'>('ad_channels');

  // 1. Channel Performance (Installs, Spend, CAC, ROI)
  const channelPerformanceData = useMemo(() => {
    return [
      {
        channel: 'Google Ads',
        fullName: 'Google Ads (Search & Maps)',
        installs: 420,
        registrations: 310,
        adSpend: 1250,
        cac: 2.98,
        roiPct: 480
      },
      {
        channel: 'Meta / FB Ads',
        fullName: 'Meta / FB Queens Ads',
        installs: 340,
        registrations: 220,
        adSpend: 950,
        cac: 2.79,
        roiPct: 420
      },
      {
        channel: 'Medical Ref',
        fullName: 'Physician & Dialysis Ref',
        installs: 280,
        registrations: 260,
        adSpend: 300,
        cac: 1.07,
        roiPct: 750
      },
      {
        channel: 'Flyers & Posters',
        fullName: 'Offline Flyers & Posters',
        installs: 150,
        registrations: 95,
        adSpend: 400,
        cac: 2.67,
        roiPct: 290
      },
      {
        channel: 'Driver Promos',
        fullName: 'Driver In-App Promos',
        installs: 190,
        registrations: 160,
        adSpend: 250,
        cac: 1.32,
        roiPct: 620
      }
    ];
  }, []);

  // 2. Demand by Queens Neighborhood
  const neighborhoodDemandData = useMemo(() => {
    if (analyticsData?.heatmap && Array.isArray(analyticsData.heatmap)) {
      return analyticsData.heatmap.map((row: any) => ({
        neighborhood: row.neighborhood,
        'Morning (06-10)': row.hourlyDistribution?.morning || 0,
        'Midday (10-14)': row.hourlyDistribution?.midday || 0,
        'Afternoon (14-18)': row.hourlyDistribution?.afternoon || 0,
        'Evening (18-22)': row.hourlyDistribution?.evening || 0,
        'Total Trips': row.totalTrips || 0,
        'WAV Demand': row.wavTrips || 0
      }));
    }

    return [
      { neighborhood: 'Jackson Hts', 'Morning (06-10)': 34, 'Midday (10-14)': 28, 'Afternoon (14-18)': 31, 'Evening (18-22)': 22, 'Total Trips': 115, 'WAV Demand': 68 },
      { neighborhood: 'Jamaica', 'Morning (06-10)': 26, 'Midday (10-14)': 30, 'Afternoon (14-18)': 24, 'Evening (18-22)': 18, 'Total Trips': 98, 'WAV Demand': 52 },
      { neighborhood: 'Flushing', 'Morning (06-10)': 32, 'Midday (10-14)': 25, 'Afternoon (14-18)': 29, 'Evening (18-22)': 20, 'Total Trips': 106, 'WAV Demand': 74 },
      { neighborhood: 'Astoria', 'Morning (06-10)': 18, 'Midday (10-14)': 14, 'Afternoon (14-18)': 19, 'Evening (18-22)': 26, 'Total Trips': 77, 'WAV Demand': 28 },
      { neighborhood: 'Kensington', 'Morning (06-10)': 22, 'Midday (10-14)': 21, 'Afternoon (14-18)': 20, 'Evening (18-22)': 15, 'Total Trips': 78, 'WAV Demand': 46 },
      { neighborhood: 'Long Island City', 'Morning (06-10)': 15, 'Midday (10-14)': 12, 'Afternoon (14-18)': 16, 'Evening (18-22)': 21, 'Total Trips': 64, 'WAV Demand': 22 }
    ];
  }, [analyticsData]);

  // Custom Dark Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-950/95 border border-slate-700/80 p-3 rounded-xl shadow-2xl backdrop-blur-md text-xs space-y-1 z-50 min-w-[180px]">
          <div className="font-semibold text-slate-200 border-b border-slate-800 pb-1 mb-1 flex items-center justify-between">
            <span>{label}</span>
            <span className="text-[10px] text-slate-400">Marketing Intelligence</span>
          </div>
          {payload.map((entry: any, index: number) => (
            <div key={`tooltip-mkt-${index}`} className="flex items-center justify-between gap-3 text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
                <span className="text-slate-400 text-[11px]">{entry.name}:</span>
              </span>
              <span className="font-mono font-bold text-slate-100">
                {typeof entry.value === 'number' && entry.name.includes('CAC') ? `$${entry.value.toFixed(2)}` :
                 typeof entry.value === 'number' && entry.name.includes('Spend') ? `$${entry.value.toLocaleString()}` :
                 typeof entry.value === 'number' && entry.name.includes('ROI') ? `${entry.value}%` : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      {/* Header with Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>Marketing Performance & Acquisition ROI</span>
              <span className="px-2 py-0.5 text-[10px] bg-indigo-500/15 text-indigo-300 rounded-full font-semibold border border-indigo-500/30">
                Queens Multi-Channel
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Acquisition channels, CAC vs ROI benchmarks & neighborhood demand curves
            </p>
          </div>
        </div>

        <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700/70 text-xs self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('ad_channels')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'ad_channels'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Installs & Spend</span>
          </button>
          <button
            onClick={() => setActiveTab('cac_roi')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'cac_roi'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>CAC ($) vs ROI (%)</span>
          </button>
          <button
            onClick={() => setActiveTab('demand_areas')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'demand_areas'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Queens Hourly Demand</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Installs & Ad Spend by Channel */}
      {activeTab === 'ad_channels' && (
        <div>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
            <span>App Installs & Registrations Compared Against Ad Spend by Acquisition Source</span>
            <span className="text-emerald-400 font-semibold text-[11px]">Total Installs: 1,380</span>
          </div>

          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelPerformanceData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                <XAxis dataKey="channel" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={{ stroke: '#475569' }} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={{ stroke: '#475569' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={32} formatter={(val) => <span className="text-xs text-slate-300">{val}</span>} />
                <Bar dataKey="installs" name="App Installs" fill="#0284c7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="registrations" name="Active Registrations" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="adSpend" name="Ad Spend ($)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 2: CAC ($) vs ROI (%) */}
      {activeTab === 'cac_roi' && (
        <div>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
            <span>Customer Acquisition Cost (CAC in $) vs Return on Marketing Investment (ROI %)</span>
            <span className="text-emerald-400 font-semibold text-[11px]">Top ROI: Medical Referrals (750%)</span>
          </div>

          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelPerformanceData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                <XAxis dataKey="channel" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={{ stroke: '#475569' }} />
                <YAxis yAxisId="left" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={{ stroke: '#475569' }} tickFormatter={(val) => `$${val}`} />
                <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={11} tickLine={false} axisLine={{ stroke: '#10b981' }} tickFormatter={(val) => `${val}%`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={32} formatter={(val) => <span className="text-xs text-slate-300">{val}</span>} />
                <Bar yAxisId="left" dataKey="cac" name="CAC ($)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="roiPct" name="ROI (%)" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 3: Neighborhood Hourly Demand Curve */}
      {activeTab === 'demand_areas' && (
        <div>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
            <span>Hourly Paratransit Demand & WAV Requests by Queens Geographic Zone</span>
            <span className="text-amber-400 font-semibold text-[11px]">Jackson Heights & Flushing Lead</span>
          </div>

          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={neighborhoodDemandData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                <XAxis dataKey="neighborhood" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={{ stroke: '#475569' }} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={{ stroke: '#475569' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={32} formatter={(val) => <span className="text-xs text-slate-300">{val}</span>} />
                <Bar dataKey="Morning (06-10)" fill="#0284c7" stackId="a" />
                <Bar dataKey="Midday (10-14)" fill="#10b981" stackId="a" />
                <Bar dataKey="Afternoon (14-18)" fill="#f59e0b" stackId="a" />
                <Bar dataKey="Evening (18-22)" fill="#8b5cf6" stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
