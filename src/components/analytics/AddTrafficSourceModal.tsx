import React, { useState } from 'react';
import { PlusCircle, X, DollarSign, Target, TrendingUp, AlertTriangle } from 'lucide-react';
import { AppTarget, AppTrafficSource } from '../../types';
import { api } from '../../lib/api';

interface AddTrafficSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newSource: AppTrafficSource) => void;
  defaultAppId?: AppTarget;
}

export const AddTrafficSourceModal: React.FC<AddTrafficSourceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultAppId = 'client_ios'
}) => {
  const [appId, setAppId] = useState<AppTarget>(defaultAppId === 'all' ? 'client_ios' : defaultAppId);
  const [campaignName, setCampaignName] = useState('');
  const [channel, setChannel] = useState('Google Ads');
  const [spend, setSpend] = useState('');
  const [installs, setInstalls] = useState('');
  const [firstActions, setFirstActions] = useState('');
  const [revenueAttributed, setRevenueAttributed] = useState('');
  const [period, setPeriod] = useState('Aug 2026');
  const [status, setStatus] = useState<'active' | 'paused' | 'completed'>('active');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignName.trim()) {
      setErrorMsg('Please enter a campaign name');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const created = await api.createAppTrafficSource({
        appId,
        campaignName,
        channel,
        spend: parseFloat(spend) || 0,
        installs: parseInt(installs, 10) || 0,
        firstActions: parseInt(firstActions, 10) || 0,
        revenueAttributed: parseFloat(revenueAttributed) || 0,
        period,
        status
      });

      onSuccess(created);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to create traffic source');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Add Paid Traffic / Ad Campaign</h3>
              <p className="text-xs text-slate-400">Record marketing spend and conversion metrics for app growth tracking</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {errorMsg && (
            <div className="flex items-center space-x-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* App Target */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Target Mobile App *
            </label>
            <select
              value={appId}
              onChange={(e) => setAppId(e.target.value as AppTarget)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="client_ios">Client App - iOS (Apple App Store)</option>
              <option value="client_android">Client App - Android (Google Play Store)</option>
              <option value="driver_ios">Driver App - iOS (Apple App Store)</option>
              <option value="driver_android">Driver App - Android (Google Play Store)</option>
            </select>
          </div>

          {/* Campaign Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Campaign Name *
            </label>
            <input
              type="text"
              required
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="e.g. ASA - Queens Hospital Paratransit Search"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Channel & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Channel / Network
              </label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="Apple Search Ads">Apple Search Ads</option>
                <option value="Google Ads UAC">Google Ads UAC</option>
                <option value="Meta Ads">Meta Ads (FB/IG)</option>
                <option value="TikTok Ads">TikTok Ads</option>
                <option value="Local Queens Flyers (QR)">Local Queens Flyers (QR)</option>
                <option value="TLC Driver Referral Program">TLC Driver Referral Program</option>
                <option value="Organic / App Store ASO">Organic / App Store ASO</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Campaign Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Spend & Installs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Total Ad Spend ($)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={spend}
                  onChange={(e) => setSpend(e.target.value)}
                  placeholder="450.00"
                  className="w-full pl-8 pr-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Attributed Installs
              </label>
              <input
                type="number"
                min="0"
                value={installs}
                onChange={(e) => setInstalls(e.target.value)}
                placeholder="120"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* First Actions & Attributed Revenue */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                First Actions (1st Ride / Trip)
              </label>
              <input
                type="number"
                min="0"
                value={firstActions}
                onChange={(e) => setFirstActions(e.target.value)}
                placeholder="68"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Attributed Revenue ($)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={revenueAttributed}
                  onChange={(e) => setRevenueAttributed(e.target.value)}
                  placeholder="1450.00"
                  className="w-full pl-8 pr-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Period */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Period / Cohort Label
            </label>
            <input
              type="text"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              placeholder="Aug 2026"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-5 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl shadow-lg shadow-emerald-600/30 transition-all"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <span>Save Campaign</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
