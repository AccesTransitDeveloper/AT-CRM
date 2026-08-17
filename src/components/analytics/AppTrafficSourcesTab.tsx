import React, { useState } from 'react';
import { 
  Target, 
  PlusCircle, 
  Upload, 
  Download, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Search,
  Filter,
  CheckCircle2,
  Clock,
  PauseCircle,
  ExternalLink
} from 'lucide-react';
import { AppTrafficSource, AppTarget } from '../../types';
import { api } from '../../lib/api';

interface AppTrafficSourcesTabProps {
  trafficSources: AppTrafficSource[];
  selectedApp: AppTarget;
  onOpenAddModal: () => void;
  onOpenCsvModal: () => void;
  onRefresh: () => void;
}

export const AppTrafficSourcesTab: React.FC<AppTrafficSourcesTabProps> = ({
  trafficSources = [],
  selectedApp,
  onOpenAddModal,
  onOpenCsvModal,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [channelFilter, setChannelFilter] = useState('all');
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Filter sources
  const filteredSources = (trafficSources || []).filter(src => {
    if (selectedApp !== 'all' && src.appId !== selectedApp) return false;
    if (channelFilter !== 'all' && src.channel !== channelFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match = src.campaignName.toLowerCase().includes(q) ||
        src.channel.toLowerCase().includes(q) ||
        src.period.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Calculate totals
  const totalSpend = filteredSources.reduce((acc, s) => acc + (s.spend || 0), 0);
  const totalInstalls = filteredSources.reduce((acc, s) => acc + (s.installs || 0), 0);
  const totalFirstActions = filteredSources.reduce((acc, s) => acc + (s.firstActions || 0), 0);
  const totalRevenue = filteredSources.reduce((acc, s) => acc + (s.revenueAttributed || 0), 0);
  const blendedCac = totalInstalls > 0 ? (totalSpend / totalInstalls).toFixed(2) : '0.00';
  const blendedCpa = totalFirstActions > 0 ? (totalSpend / totalFirstActions).toFixed(2) : '0.00';
  const overallRoi = totalSpend > 0 ? (((totalRevenue - totalSpend) / totalSpend) * 100).toFixed(1) : '0.0';

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this traffic source entry?')) return;
    setIsDeletingId(id);
    try {
      await api.deleteAppTrafficSource(id);
      onRefresh();
    } catch (err: any) {
      alert(err?.message || 'Failed to delete traffic source');
    } finally {
      setIsDeletingId(null);
    }
  };

  const getAppName = (appId: AppTarget) => {
    switch (appId) {
      case 'client_ios': return 'Client iOS';
      case 'client_android': return 'Client Android';
      case 'driver_ios': return 'Driver iOS';
      case 'driver_android': return 'Driver Android';
      default: return appId;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Action Controls */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <Target className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-semibold text-white">Paid Traffic & Acquisition Channels</h3>
              <p className="text-xs text-slate-400">
                Track ad spend, blended CAC, first ride conversions, and ROI across marketing channels
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => { window.location.href = '/api/analytics/export-template'; }}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-medium border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV Template</span>
          </button>
          
          <button
            onClick={onOpenCsvModal}
            className="flex items-center space-x-1.5 px-3 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-white rounded-xl text-xs font-medium border border-indigo-500/30 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium shadow-lg shadow-emerald-600/20 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Campaign</span>
          </button>
        </div>
      </div>

      {/* Aggregate KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl text-center">
          <span className="block text-[10px] text-slate-500 uppercase font-semibold">Total Spend</span>
          <span className="text-base font-bold text-white">${(totalSpend ?? 0).toLocaleString()}</span>
        </div>
        <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl text-center">
          <span className="block text-[10px] text-slate-500 uppercase font-semibold">Total Installs</span>
          <span className="text-base font-bold text-indigo-400">{(totalInstalls ?? 0).toLocaleString()}</span>
        </div>
        <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl text-center">
          <span className="block text-[10px] text-slate-500 uppercase font-semibold">Blended CAC</span>
          <span className="text-base font-bold text-emerald-400">${blendedCac}</span>
        </div>
        <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl text-center">
          <span className="block text-[10px] text-slate-500 uppercase font-semibold">1st Actions</span>
          <span className="text-base font-bold text-sky-400">{(totalFirstActions ?? 0).toLocaleString()}</span>
        </div>
        <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl text-center">
          <span className="block text-[10px] text-slate-500 uppercase font-semibold">Cost per Action</span>
          <span className="text-base font-bold text-amber-400">${blendedCpa}</span>
        </div>
        <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl text-center">
          <span className="block text-[10px] text-slate-500 uppercase font-semibold">Attributed ROI</span>
          <span className={`text-base font-bold ${parseFloat(overallRoi) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {parseFloat(overallRoi) > 0 ? `+${overallRoi}%` : `${overallRoi}%`}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search campaigns, channels..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Channels</option>
            <option value="Apple Search Ads">Apple Search Ads</option>
            <option value="Google Ads UAC">Google Ads UAC</option>
            <option value="Meta Ads">Meta Ads</option>
            <option value="TikTok Ads">TikTok Ads</option>
            <option value="Local Queens Flyers (QR)">Local Queens Flyers</option>
            <option value="TLC Driver Referral Program">Driver Referral Program</option>
            <option value="Organic / App Store ASO">Organic / ASO</option>
          </select>
        </div>
      </div>

      {/* Traffic Sources Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Campaign & Channel</th>
                <th className="py-3 px-4">App Target</th>
                <th className="py-3 px-4 text-right">Spend</th>
                <th className="py-3 px-4 text-right">Installs</th>
                <th className="py-3 px-4 text-right">CAC</th>
                <th className="py-3 px-4 text-right">1st Actions</th>
                <th className="py-3 px-4 text-right">Conv Rate</th>
                <th className="py-3 px-4 text-right">CPA</th>
                <th className="py-3 px-4 text-right">Attributed Rev</th>
                <th className="py-3 px-4 text-right">ROI</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredSources.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-slate-500">
                    No traffic campaigns found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredSources.map((src) => {
                  const isPositiveRoi = src.roi >= 0;
                  return (
                    <tr key={src.id} className="hover:bg-slate-800/40 transition-colors">
                      
                      {/* Campaign & Channel */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{src.campaignName}</div>
                        <div className="text-[11px] text-slate-400">{src.channel} • {src.period}</div>
                      </td>

                      {/* App Target */}
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          src.appId.includes('ios') ? 'bg-sky-500/10 text-sky-300' : 'bg-emerald-500/10 text-emerald-300'
                        }`}>
                          {getAppName(src.appId)}
                        </span>
                      </td>

                      {/* Spend */}
                      <td className="py-3 px-4 text-right font-medium text-slate-200">
                        ${(src.spend ?? 0).toLocaleString()}
                      </td>

                      {/* Installs */}
                      <td className="py-3 px-4 text-right font-semibold text-indigo-300">
                        {(src.installs ?? 0).toLocaleString()}
                      </td>

                      {/* CAC */}
                      <td className="py-3 px-4 text-right font-medium text-emerald-400">
                        ${(src.cac ?? 0).toFixed(2)}
                      </td>

                      {/* 1st Actions */}
                      <td className="py-3 px-4 text-right font-semibold text-sky-300">
                        {(src.firstActions ?? 0).toLocaleString()}
                      </td>

                      {/* Conversion Rate */}
                      <td className="py-3 px-4 text-right text-slate-300">
                        {src.firstActionRate ?? 0}%
                      </td>

                      {/* Cost per Action */}
                      <td className="py-3 px-4 text-right font-medium text-amber-400">
                        ${(src.costPerActiveUser ?? 0).toFixed(2)}
                      </td>

                      {/* Attributed Revenue */}
                      <td className="py-3 px-4 text-right text-slate-200">
                        ${(src.revenueAttributed ?? 0).toLocaleString()}
                      </td>

                      {/* ROI */}
                      <td className="py-3 px-4 text-right">
                        <span className={`inline-flex items-center font-bold ${
                          isPositiveRoi ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {isPositiveRoi ? '+' : ''}{src.roi}%
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          src.status === 'active' 
                            ? 'bg-emerald-500/15 text-emerald-400' 
                            : src.status === 'paused' 
                            ? 'bg-amber-500/15 text-amber-400' 
                            : 'bg-slate-700 text-slate-300'
                        }`}>
                          {src.status}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDelete(src.id)}
                          disabled={isDeletingId === src.id}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="Delete source"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
