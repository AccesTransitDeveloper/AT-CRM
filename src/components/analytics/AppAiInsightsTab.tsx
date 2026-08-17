import React, { useState } from 'react';
import { 
  Sparkles, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowUpRight, 
  DollarSign, 
  Target, 
  Layers, 
  Activity, 
  ShieldAlert,
  Zap,
  TrendingUp
} from 'lucide-react';
import { AppAiRecommendation, AppTarget } from '../../types';
import { api } from '../../lib/api';

interface AppAiInsightsTabProps {
  recommendations: AppAiRecommendation[];
  selectedApp: AppTarget;
  onRefresh: () => void;
}

export const AppAiInsightsTab: React.FC<AppAiInsightsTabProps> = ({
  recommendations = [],
  selectedApp,
  onRefresh
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeRecIndex, setActiveRecIndex] = useState(0);

  const filteredRecs = (recommendations || []).filter(r => {
    if (selectedApp !== 'all' && r.appId !== selectedApp && r.appId !== 'all') return false;
    return true;
  });

  const currentRec = filteredRecs[activeRecIndex] || filteredRecs[0];

  const handleGenerateAi = async () => {
    setIsGenerating(true);
    try {
      await api.generateAppAiRecommendations(selectedApp);
      onRefresh();
      setActiveRecIndex(0);
    } catch (err: any) {
      alert(err?.message || 'Failed to generate AI recommendations');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Generation Button */}
      <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3">
          <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <span>Gemini AI App Portfolio & Growth Strategist</span>
              <span className="text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                Self-Healing Intelligence
              </span>
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Autonomous diagnosis across 4 mobile apps: funnel drop-off remedies, ASO opportunities, and CAC budget rebalancing.
            </p>
          </div>
        </div>

        <button
          onClick={handleGenerateAi}
          disabled={isGenerating}
          className="shrink-0 flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Analyzing Metrics with Gemini...</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              <span>Run AI App Growth Audit</span>
            </>
          )}
        </button>
      </div>

      {!currentRec ? (
        <div className="p-12 text-center bg-slate-900/60 rounded-2xl border border-slate-800 space-y-3">
          <Sparkles className="w-8 h-8 text-indigo-400 mx-auto" />
          <h4 className="text-sm font-semibold text-white">No AI audit report found for this selection</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Click "Run AI App Growth Audit" to trigger Gemini AI to analyze funnels, retention cohorts, store reviews, and paid channels.
          </p>
          <button
            onClick={handleGenerateAi}
            disabled={isGenerating}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium"
          >
            Generate AI Diagnosis Now
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Executive Diagnosis & Health Score */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                  Report generated on {currentRec?.generatedAt ? new Date(currentRec.generatedAt).toLocaleString() : 'N/A'}
                </span>
                <h4 className="text-base font-bold text-white mt-0.5">{currentRec.headline}</h4>
              </div>

              <div className="flex items-center space-x-3 bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400">Health Index:</span>
                <span className="text-sm font-bold text-emerald-400">{currentRec.healthScore}/100</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
              {currentRec.executiveSummary}
            </p>
          </div>

          {/* Prioritized Actionable Opportunities */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Prioritized Growth & Retention Opportunities ({(currentRec.opportunities || []).length})</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(currentRec.opportunities || []).map((opp, idx) => (
                <div
                  key={idx}
                  className="p-5 bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl flex flex-col justify-between space-y-3 shadow-sm transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        opp.priority === 'high' 
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                          : opp.priority === 'medium'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      }`}>
                        {opp.priority} Priority
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">Effort: {opp.implementationEffort}</span>
                    </div>

                    <h5 className="text-sm font-semibold text-white leading-snug">{opp.title}</h5>
                    <p className="text-xs text-slate-400 leading-relaxed">{opp.description}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                      <span>Uplift:</span>
                      <span>{opp.expectedUplift}</span>
                    </div>
                    <div className="text-[11px] text-slate-300">
                      <strong className="text-indigo-400">Action: </strong>
                      {opp.recommendedAction}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottleneck Remedies & Budget Rebalancing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Funnel Bottleneck Remedies */}
            <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3">
              <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Conversion Bottleneck Remedies</span>
              </h4>
              <div className="space-y-2.5">
                {(currentRec.bottleneckRemedies || []).map((bot, i) => (
                  <div key={i} className="p-3 bg-amber-500/5 border border-amber-500/15 rounded-xl space-y-1 text-xs">
                    <div className="font-semibold text-amber-300">{bot.stepName}</div>
                    <p className="text-slate-400">{bot.frictionCause}</p>
                    <p className="text-slate-200 font-medium pt-1">
                      <strong className="text-emerald-400">Fix: </strong>{bot.suggestedSolution}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Budget Allocation Advice */}
            <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3">
              <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-indigo-400" />
                <span>Paid Acquisition & Budget Rebalancing</span>
              </h4>
              <div className="space-y-2.5">
                {(currentRec.budgetAdvice || []).map((b, i) => (
                  <div key={i} className="p-3 bg-indigo-500/5 border border-indigo-500/15 rounded-xl space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{b.channel}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        b.action === 'increase' 
                          ? 'bg-emerald-500/20 text-emerald-300' 
                          : b.action === 'decrease'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-slate-700 text-slate-300'
                      }`}>
                        {b.action.toUpperCase()} SPEND
                      </span>
                    </div>
                    <p className="text-slate-400">{b.reason}</p>
                    <div className="text-emerald-400 font-medium pt-1">
                      Target CAC: {b.targetCac}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
