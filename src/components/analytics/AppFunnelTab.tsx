import React from 'react';
import { 
  Layers, 
  ArrowDown, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  HelpCircle, 
  Smartphone,
  TrendingDown,
  Info
} from 'lucide-react';
import { AppFunnelStep, AppTarget } from '../../types';

interface AppFunnelTabProps {
  funnelSteps: AppFunnelStep[];
  selectedApp: AppTarget;
  onNavigateToAi: () => void;
}

export const AppFunnelTab: React.FC<AppFunnelTabProps> = ({
  funnelSteps = [],
  selectedApp,
  onNavigateToAi
}) => {
  const steps = funnelSteps || [];

  // Find step with the highest dropoff rate
  const maxDropoffStep = steps.length > 1
    ? steps.slice(1).reduce((prev, curr) => (curr.dropoffRatePct > prev.dropoffRatePct ? curr : prev), steps[1])
    : null;

  const firstStepCount = steps.length > 0 ? steps[0].userCount : 1;
  const lastStepCount = steps.length > 0 ? steps[steps.length - 1].userCount : 0;
  const totalEndToEndConversion = firstStepCount > 0 ? ((lastStepCount / firstStepCount) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Summary Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <Layers className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-semibold text-white">Full User Conversion Funnel</h3>
              <p className="text-xs text-slate-400">
                Track each stage from initial Store Download to First Active Trip & 30-day Retention
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4 bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800">
          <div>
            <span className="block text-[10px] text-slate-500 uppercase tracking-wider">End-to-End Activation</span>
            <span className="text-lg font-bold text-emerald-400">{totalEndToEndConversion}%</span>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div>
            <span className="block text-[10px] text-slate-500 uppercase tracking-wider">Top Bottleneck</span>
            <span className="text-xs font-semibold text-rose-400">
              {maxDropoffStep ? maxDropoffStep.name : 'None'} (-{maxDropoffStep?.dropoffRatePct}%)
            </span>
          </div>
        </div>
      </div>

      {/* Critical Bottleneck Alert */}
      {maxDropoffStep && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start justify-between gap-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-rose-300">
                Conversion Leak Detected: Step "{maxDropoffStep.name}" (-{maxDropoffStep.dropoffRatePct}% Drop-off)
              </h4>
              <p className="text-xs text-slate-300 mt-1">
                {selectedApp.includes('driver') 
                  ? 'Drivers are abandoning during TLC Document Upload and Base affiliation verification. Recommend enabling automated OCR and instant WhatsApp photo submission.'
                  : 'Riders are dropping off before completing their first paratransit / MTA trip booking. Recommend a $10 first-ride voucher and one-click phone booking prompt.'}
              </p>
            </div>
          </div>
          <button
            onClick={onNavigateToAi}
            className="shrink-0 flex items-center space-x-1.5 px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-medium transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Bottleneck Remedy</span>
          </button>
        </div>
      )}

      {/* Funnel Pipeline Visual Steps */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6">
        <h4 className="text-sm font-semibold text-white flex items-center space-x-2">
          <Smartphone className="w-4 h-4 text-indigo-400" />
          <span>Stage-by-Stage Drop-off Breakdown</span>
        </h4>

        <div className="space-y-4">
          {steps.map((step, idx) => {
            const isFirst = idx === 0;
            const isMaxDropoff = maxDropoffStep?.name === step.name;

            return (
              <div key={step.name} className="space-y-2">
                
                {/* Step Bar Container */}
                <div className={`p-4 rounded-xl border transition-all ${
                  isMaxDropoff 
                    ? 'bg-rose-950/20 border-rose-500/40 ring-1 ring-rose-500/20' 
                    : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/60'
                }`}>
                  
                  {/* Step Header info */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-xs font-bold border border-slate-700">
                        {idx + 1}
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-white">{step.name}</span>
                        {isMaxDropoff && (
                          <span className="ml-2 text-[10px] font-bold uppercase bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full border border-rose-500/30">
                            Highest Drop-off Point
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-xs">
                      <div>
                        <span className="text-slate-400">Users: </span>
                        <strong className="text-white text-sm">{(step?.userCount ?? 0).toLocaleString()}</strong>
                      </div>
                      <div className="h-4 w-px bg-slate-700" />
                      <div>
                        <span className="text-slate-400">Step Conv: </span>
                        <strong className="text-emerald-400 text-sm">{step.conversionRatePct}%</strong>
                      </div>
                      {!isFirst && (
                        <>
                          <div className="h-4 w-px bg-slate-700" />
                          <div className="flex items-center text-rose-400 font-semibold">
                            <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
                            <span>-{step.dropoffRatePct}% lost</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isMaxDropoff 
                          ? 'bg-gradient-to-r from-rose-500 to-amber-500' 
                          : 'bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400'
                      }`}
                      style={{ width: `${Math.max(4, step.conversionRatePct)}%` }}
                    />
                  </div>

                </div>

                {/* Arrow indicator between steps */}
                {idx < steps.length - 1 && (
                  <div className="flex items-center justify-center text-slate-600">
                    <ArrowDown className="w-4 h-4" />
                  </div>
                )}

              </div>
            );
          })}
        </div>
      </div>

      {/* Domain Specific Insights & Best Practices for Queens Transit Apps */}
      <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
          <Info className="w-4 h-4 text-indigo-400" />
          <span>Conversion Benchmark & Optimization Notes</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-400">
          <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/50">
            <strong className="text-slate-200 block mb-1">Passenger Apps (iOS & Android):</strong>
            Industry average install-to-first-ride in NYC mobility is ~38%. Accessible Transit is outperforming at ~51% due to direct MTA TripLink broker integrations and paratransit phone call concierge fallback.
          </div>
          <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/50">
            <strong className="text-slate-200 block mb-1">Driver TLC Apps (iOS & Android):</strong>
            Driver onboarding requires 5 mandatory TLC documents (TLC FHV license, DMV license, Insurance FH1, Registration, Vehicle Inspection). 15% flat commission policy drives strong D30 retention (~38%).
          </div>
        </div>
      </div>

    </div>
  );
};
