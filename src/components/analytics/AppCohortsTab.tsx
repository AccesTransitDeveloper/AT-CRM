import React, { useState } from 'react';
import { 
  Activity, 
  Users, 
  Filter, 
  Calendar, 
  HelpCircle, 
  TrendingUp, 
  Smartphone,
  ShieldCheck
} from 'lucide-react';
import { AppCohortRow, AppTarget, AppAudience } from '../../types';

interface AppCohortsTabProps {
  cohorts: AppCohortRow[];
  selectedApp: AppTarget;
}

export const AppCohortsTab: React.FC<AppCohortsTabProps> = ({
  cohorts = [],
  selectedApp
}) => {
  const [audienceFilter, setAudienceFilter] = useState<'all' | AppAudience>('all');

  const filteredCohorts = (cohorts || []).filter(c => {
    if (selectedApp !== 'all' && c.appId !== selectedApp) return false;
    if (audienceFilter !== 'all' && c.audience !== audienceFilter) return false;
    return true;
  });

  // Calculate average retention per day across filtered cohorts
  const avgD1 = filteredCohorts.length > 0 
    ? Math.round(filteredCohorts.reduce((acc, c) => acc + (c.day1Pct ?? (c as any).day1 ?? 0), 0) / filteredCohorts.length) 
    : 0;
  const avgD7 = filteredCohorts.length > 0 
    ? Math.round(filteredCohorts.reduce((acc, c) => acc + (c.day7Pct ?? (c as any).day7 ?? 0), 0) / filteredCohorts.length) 
    : 0;
  const avgD14 = filteredCohorts.length > 0 
    ? Math.round(filteredCohorts.reduce((acc, c) => acc + (c.day14Pct ?? (c as any).day14 ?? 0), 0) / filteredCohorts.length) 
    : 0;
  const avgD30 = filteredCohorts.length > 0 
    ? Math.round(filteredCohorts.reduce((acc, c) => acc + (c.day30Pct ?? (c as any).day30 ?? 0), 0) / filteredCohorts.length) 
    : 0;

  // Helper for heatmap cell color
  const getCellColor = (pct: number) => {
    if (pct >= 50) return 'bg-emerald-500/30 text-emerald-300 font-bold border border-emerald-500/40';
    if (pct >= 35) return 'bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/25';
    if (pct >= 25) return 'bg-sky-500/20 text-sky-300 font-medium border border-sky-500/25';
    if (pct >= 15) return 'bg-slate-700/50 text-slate-300 border border-slate-700';
    return 'bg-slate-800/40 text-slate-500 border border-slate-800';
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-sky-500/10 text-sky-400 rounded-xl">
              <Activity className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-semibold text-white">Cohort Retention Analysis (Heatmap)</h3>
              <p className="text-xs text-slate-400">
                Track how passenger and driver cohorts retain on Day 1, 3, 7, 14, and 30
              </p>
            </div>
          </div>
        </div>

        {/* Audience Switcher */}
        <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setAudienceFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              audienceFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            All Users
          </button>
          <button
            onClick={() => setAudienceFilter('passengers')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              audienceFilter === 'passengers' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Passengers
          </button>
          <button
            onClick={() => setAudienceFilter('drivers')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              audienceFilter === 'drivers' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Drivers (TLC)
          </button>
        </div>
      </div>

      {/* Average Retention Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl text-center">
          <span className="block text-[10px] text-slate-500 uppercase font-semibold">Day 1 Ret</span>
          <span className="text-lg font-bold text-emerald-400">{avgD1}%</span>
        </div>
        <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl text-center">
          <span className="block text-[10px] text-slate-500 uppercase font-semibold">Day 7 Ret</span>
          <span className="text-lg font-bold text-sky-400">{avgD7}%</span>
        </div>
        <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl text-center">
          <span className="block text-[10px] text-slate-500 uppercase font-semibold">Day 14 Ret</span>
          <span className="text-lg font-bold text-indigo-400">{avgD14}%</span>
        </div>
        <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl text-center">
          <span className="block text-[10px] text-slate-500 uppercase font-semibold">Day 30 Ret</span>
          <span className="text-lg font-bold text-slate-200">{avgD30}%</span>
        </div>
      </div>

      {/* Cohort Heatmap Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Cohort (Week)</th>
                <th className="py-3 px-4">App & Audience</th>
                <th className="py-3 px-4 text-center">Installs (100%)</th>
                <th className="py-3 px-3 text-center">Day 1</th>
                <th className="py-3 px-3 text-center">Day 7</th>
                <th className="py-3 px-3 text-center">Day 14</th>
                <th className="py-3 px-3 text-center">Day 30</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredCohorts.map((row, idx) => {
                const cohortLabel = row.cohortWeek || (row as any).cohort || `Cohort ${idx + 1}`;
                const totalUsers = row.totalInstalls ?? (row as any).users ?? 0;
                const d1 = row.day1Pct ?? (row as any).day1 ?? 0;
                const d7 = row.day7Pct ?? (row as any).day7 ?? 0;
                const d14 = row.day14Pct ?? (row as any).day14 ?? 0;
                const d30 = row.day30Pct ?? (row as any).day30 ?? 0;
                const rowKey = `${row.appId || 'app'}-${row.audience || 'aud'}-${cohortLabel}-${idx}`;

                return (
                  <tr key={rowKey} className="hover:bg-slate-800/30 transition-colors">
                    
                    {/* Cohort Date */}
                    <td className="py-3 px-4 font-semibold text-white">
                      {cohortLabel}
                    </td>

                    {/* App & Audience */}
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        row.audience === 'passengers' ? 'bg-indigo-500/15 text-indigo-300' : 'bg-amber-500/15 text-amber-300'
                      }`}>
                        {row.appId} ({row.audience})
                      </span>
                    </td>

                    {/* Users / Installs */}
                    <td className="py-3 px-4 text-center font-bold text-slate-200">
                      {totalUsers.toLocaleString()}
                    </td>

                    {/* Day 1 */}
                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-block px-3 py-1 rounded-lg text-xs ${getCellColor(d1)}`}>
                        {d1}%
                      </span>
                    </td>

                    {/* Day 7 */}
                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-block px-3 py-1 rounded-lg text-xs ${getCellColor(d7)}`}>
                        {d7}%
                      </span>
                    </td>

                    {/* Day 14 */}
                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-block px-3 py-1 rounded-lg text-xs ${getCellColor(d14)}`}>
                        {d14}%
                      </span>
                    </td>

                    {/* Day 30 */}
                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-block px-3 py-1 rounded-lg text-xs ${getCellColor(d30)}`}>
                        {d30}%
                      </span>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
