import React, { useState, useEffect, useCallback } from 'react';
import { 
  Smartphone, 
  Layers, 
  Target, 
  Activity, 
  MessageSquare, 
  Sparkles, 
  Upload, 
  Download, 
  PlusCircle, 
  RefreshCw, 
  Calendar, 
  Filter,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { 
  AppTarget, 
  AppFunnelStep, 
  AppTrafficSource, 
  AppCohortRow, 
  AppReview, 
  AppSentimentSummary, 
  AppAiRecommendation, 
  AppMetadataInfo 
} from '../../types';
import { api } from '../../lib/api';

import { AppOverviewTab } from './AppOverviewTab';
import { AppFunnelTab } from './AppFunnelTab';
import { AppTrafficSourcesTab } from './AppTrafficSourcesTab';
import { AppCohortsTab } from './AppCohortsTab';
import { AppReviewsTab } from './AppReviewsTab';
import { AppAiInsightsTab } from './AppAiInsightsTab';
import { CsvImportModal } from './CsvImportModal';
import { AddTrafficSourceModal } from './AddTrafficSourceModal';

type SubTab = 'overview' | 'funnel' | 'sources' | 'cohorts' | 'reviews' | 'ai_insights';

export const AppAnalyticsView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('overview');
  const [selectedApp, setSelectedApp] = useState<AppTarget>('all');
  const [periodDays, setPeriodDays] = useState<number>(30);

  // Data states
  const [appMetadataList, setAppMetadataList] = useState<AppMetadataInfo[]>([]);
  const [overviewData, setOverviewData] = useState<any>(null);
  const [funnelSteps, setFunnelSteps] = useState<AppFunnelStep[]>([]);
  const [trafficSources, setTrafficSources] = useState<AppTrafficSource[]>([]);
  const [cohorts, setCohorts] = useState<AppCohortRow[]>([]);
  const [reviews, setReviews] = useState<AppReview[]>([]);
  const [sentimentSummary, setSentimentSummary] = useState<AppSentimentSummary | null>(null);
  const [aiRecommendations, setAiRecommendations] = useState<AppAiRecommendation[]>([]);

  // Loading & Modal states
  const [isLoading, setIsLoading] = useState(true);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isAddCampaignModalOpen, setIsAddCampaignModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Fetch all app analytics data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        meta,
        overview,
        funnel,
        sources,
        cohortList,
        revList,
        sentiment,
        recs
      ] = await Promise.all([
        api.getAppMetadataList(),
        api.getAppOverview(selectedApp, periodDays),
        api.getAppFunnel(selectedApp),
        api.getAppTrafficSources(selectedApp),
        api.getAppCohorts(selectedApp),
        api.getAppReviews(selectedApp),
        api.getAppSentimentSummary(selectedApp),
        api.getAppAiRecommendations(selectedApp)
      ]);

      setAppMetadataList(Array.isArray(meta) ? meta : []);
      setOverviewData(overview || null);
      setFunnelSteps(Array.isArray(funnel) ? funnel : []);
      setTrafficSources(Array.isArray(sources) ? sources : []);
      setCohorts(Array.isArray(cohortList) ? cohortList : []);
      setReviews(Array.isArray(revList) ? revList : []);
      setSentimentSummary(sentiment || null);
      setAiRecommendations(Array.isArray(recs) ? recs : []);
    } catch (err: any) {
      console.error('Failed to load app analytics:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedApp, periodDays]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const navTabs: Array<{ id: SubTab; label: string; icon: React.ReactNode; badge?: string }> = [
    { id: 'overview', label: 'Overview & Metrics', icon: <Smartphone className="w-4 h-4" /> },
    { id: 'funnel', label: 'Conversion Funnel', icon: <Layers className="w-4 h-4" /> },
    { id: 'sources', label: 'Traffic & CAC', icon: <Target className="w-4 h-4" />, badge: `${(trafficSources || []).length}` },
    { id: 'cohorts', label: 'Cohort Retention', icon: <Activity className="w-4 h-4" /> },
    { id: 'reviews', label: 'Store Reviews', icon: <MessageSquare className="w-4 h-4" />, badge: `${(reviews || []).length}` },
    { id: 'ai_insights', label: 'AI Growth Audit', icon: <Sparkles className="w-4 h-4 text-amber-400" /> }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 bg-emerald-500 text-slate-950 px-4 py-2.5 rounded-xl shadow-xl font-medium text-xs animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Main Header with Top Controls */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur shadow-xl relative overflow-hidden">
        
        {/* Background glow accent */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Title & Badge */}
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-tr from-indigo-600 to-sky-500 rounded-2xl text-white shadow-lg shadow-indigo-500/20">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                    App Analytics & Monitoring
                  </h1>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full">
                    4 Native Mobile Apps
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  Track Installs, DAU/MAU, TLC Driver Onboarding Funnels, Paid CAC & Store Feedback
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            
            {/* CSV Template Download */}
            <button
              onClick={() => { window.location.href = '/api/analytics/export-template'; }}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-medium border border-slate-700 transition-colors"
              title="Download CSV Structure for Google Play / App Store"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV Template</span>
            </button>

            {/* CSV Import */}
            <button
              onClick={() => setIsCsvModalOpen(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-white rounded-xl text-xs font-medium border border-indigo-500/30 shadow-sm transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import Console CSV</span>
            </button>

            {/* Add Campaign */}
            <button
              onClick={() => setIsAddCampaignModalOpen(true)}
              className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium shadow-lg shadow-emerald-600/20 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Ad Campaign</span>
            </button>

            {/* Refresh */}
            <button
              onClick={fetchData}
              disabled={isLoading}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs border border-slate-700 transition-colors"
              title="Refresh Analytics"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
            </button>

          </div>

        </div>

        {/* Global Filter Bar: App Selector & Date Range */}
        <div className="mt-6 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          
          {/* 4 App Targets Segmented Selector */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => setSelectedApp('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedApp === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All 4 Apps (Portfolio)
            </button>

            <button
              onClick={() => setSelectedApp('client_ios')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                selectedApp === 'client_ios'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Client iOS</span>
              <span className="text-[10px] opacity-75">(App Store)</span>
            </button>

            <button
              onClick={() => setSelectedApp('client_android')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                selectedApp === 'client_android'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Client Android</span>
              <span className="text-[10px] opacity-75">(Google Play)</span>
            </button>

            <button
              onClick={() => setSelectedApp('driver_ios')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                selectedApp === 'driver_ios'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Driver iOS</span>
              <span className="text-[10px] opacity-75">(TLC)</span>
            </button>

            <button
              onClick={() => setSelectedApp('driver_android')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                selectedApp === 'driver_android'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Driver Android</span>
              <span className="text-[10px] opacity-75">(TLC)</span>
            </button>
          </div>

          {/* Time Period Selector */}
          <div className="flex items-center space-x-2 self-end sm:self-auto">
            <Calendar className="w-4 h-4 text-slate-400" />
            <select
              value={periodDays}
              onChange={(e) => setPeriodDays(parseInt(e.target.value, 10))}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value={7}>Last 7 Days</option>
              <option value={14}>Last 14 Days</option>
              <option value={30}>Last 30 Days</option>
              <option value={90}>Last 90 Days</option>
            </select>
          </div>

        </div>

        {/* Sub-tab Navigation */}
        <div className="mt-6 flex items-center space-x-2 overflow-x-auto no-scrollbar border-b border-slate-800 pb-0">
          {navTabs.map((tab) => {
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`relative flex items-center space-x-2 px-4 py-2.5 text-xs sm:text-sm font-semibold whitespace-nowrap transition-all border-b-2 ${
                  isActive
                    ? 'border-indigo-500 text-white bg-indigo-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

      </div>

      {/* Tab Content Display */}
      {isLoading && !overviewData ? (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-16 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-300 font-medium">Aggregating mobile metrics for {selectedApp}...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {activeSubTab === 'overview' && (
            <AppOverviewTab
              overviewData={overviewData}
              selectedApp={selectedApp}
              onSelectApp={(app) => setSelectedApp(app)}
              onNavigateTab={(tab) => setActiveSubTab(tab)}
              onOpenCsvModal={() => setIsCsvModalOpen(true)}
              onOpenAddCampaignModal={() => setIsAddCampaignModalOpen(true)}
            />
          )}

          {activeSubTab === 'funnel' && (
            <AppFunnelTab
              funnelSteps={funnelSteps}
              selectedApp={selectedApp}
              onNavigateToAi={() => setActiveSubTab('ai_insights')}
            />
          )}

          {activeSubTab === 'sources' && (
            <AppTrafficSourcesTab
              trafficSources={trafficSources}
              selectedApp={selectedApp}
              onOpenAddModal={() => setIsAddCampaignModalOpen(true)}
              onOpenCsvModal={() => setIsCsvModalOpen(true)}
              onRefresh={fetchData}
            />
          )}

          {activeSubTab === 'cohorts' && (
            <AppCohortsTab
              cohorts={cohorts}
              selectedApp={selectedApp}
            />
          )}

          {activeSubTab === 'reviews' && sentimentSummary && (
            <AppReviewsTab
              reviews={reviews}
              sentimentSummary={sentimentSummary}
              selectedApp={selectedApp}
              onRefresh={fetchData}
            />
          )}

          {activeSubTab === 'ai_insights' && (
            <AppAiInsightsTab
              recommendations={aiRecommendations}
              selectedApp={selectedApp}
              onRefresh={fetchData}
            />
          )}
        </div>
      )}

      {/* CSV Import Modal */}
      <CsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onSuccess={() => {
          setIsCsvModalOpen(false);
          showToast('CSV metrics imported successfully!');
          fetchData();
        }}
      />

      {/* Add Traffic Source Campaign Modal */}
      <AddTrafficSourceModal
        isOpen={isAddCampaignModalOpen}
        onClose={() => setIsAddCampaignModalOpen(false)}
        defaultAppId={selectedApp}
        onSuccess={(newSrc) => {
          setIsAddCampaignModalOpen(false);
          showToast(`Campaign "${newSrc.campaignName}" created!`);
          fetchData();
        }}
      />

    </div>
  );
};
