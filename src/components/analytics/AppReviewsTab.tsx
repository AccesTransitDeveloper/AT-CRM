import React, { useState } from 'react';
import { 
  Star, 
  MessageSquare, 
  ThumbsUp, 
  AlertCircle, 
  PlusCircle, 
  CheckCircle2, 
  Smartphone,
  Filter,
  Search,
  X
} from 'lucide-react';
import { AppReview, AppSentimentSummary, AppTarget } from '../../types';
import { api } from '../../lib/api';

interface AppReviewsTabProps {
  reviews: AppReview[];
  sentimentSummary: AppSentimentSummary;
  selectedApp: AppTarget;
  onRefresh: () => void;
}

export const AppReviewsTab: React.FC<AppReviewsTabProps> = ({
  reviews = [],
  sentimentSummary,
  selectedApp,
  onRefresh
}) => {
  const [filterSentiment, setFilterSentiment] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states for manual review
  const [newAppId, setNewAppId] = useState<AppTarget>(selectedApp === 'all' ? 'client_ios' : selectedApp);
  const [newRating, setNewRating] = useState(5);
  const [newAuthor, setNewAuthor] = useState('');
  const [newTopic, setNewTopic] = useState('WAV Booking');
  const [newText, setNewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredReviews = (reviews || []).filter(rev => {
    if (selectedApp !== 'all' && rev.appId !== selectedApp) return false;
    if (filterSentiment !== 'all' && rev.sentiment !== filterSentiment) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = (rev.reviewText || '').toLowerCase().includes(q) ||
        (rev.author || '').toLowerCase().includes(q) ||
        (rev.topicTag || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;

    setIsSubmitting(true);
    try {
      await api.createAppReview({
        appId: newAppId,
        rating: newRating,
        author: newAuthor || 'Verified Transit User',
        reviewText: newText,
        topicTag: newTopic,
        appVersion: '2.4.2'
      });
      setIsModalOpen(false);
      setNewText('');
      setNewAuthor('');
      onRefresh();
    } catch (err: any) {
      alert(err?.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const summary = sentimentSummary || {
    avgRating: 4.8,
    totalReviews: 0,
    positivePct: 0,
    neutralPct: 0,
    negativePct: 0,
    topComplaints: [],
    topPraises: []
  };

  return (
    <div className="space-y-6">
      
      {/* Sentiment & Ratings Overview Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Rating Score */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm text-center md:text-left flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Store Rating</span>
            <div className="mt-2 flex items-center justify-center md:justify-start space-x-2">
              <span className="text-3xl font-extrabold text-white tracking-tight">{summary.avgRating}</span>
              <div className="flex items-center text-amber-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= Math.round(summary.avgRating || 5) ? 'fill-amber-400' : 'text-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">{(summary.totalReviews ?? 0).toLocaleString()} verified ratings across App Store & Google Play</p>
        </div>

        {/* Sentiment Distribution Bar */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm col-span-1 md:col-span-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AI Sentiment Classification</span>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center space-x-1 px-3 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-medium transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Log User Feedback</span>
            </button>
          </div>

          <div className="mt-3 space-y-2">
            {/* Visual Bar */}
            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
              <div style={{ width: `${summary.positivePct}%` }} className="bg-emerald-500 h-full" title={`Positive: ${summary.positivePct}%`} />
              <div style={{ width: `${summary.neutralPct}%` }} className="bg-amber-500 h-full" title={`Neutral: ${summary.neutralPct}%`} />
              <div style={{ width: `${summary.negativePct}%` }} className="bg-rose-500 h-full" title={`Negative: ${summary.negativePct}%`} />
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="flex items-center text-emerald-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1.5" />
                Positive: {summary.positivePct}%
              </span>
              <span className="flex items-center text-amber-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mr-1.5" />
                Neutral: {summary.neutralPct}%
              </span>
              <span className="flex items-center text-rose-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 mr-1.5" />
                Negative: {summary.negativePct}%
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Top Complaints & Praises Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Top Complaints */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
          <h4 className="text-xs font-semibold text-rose-400 uppercase tracking-wider flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>Top Friction Points & Complaints</span>
          </h4>
          <div className="space-y-2">
            {(sentimentSummary?.topComplaints || []).map((c, i) => (
              <div key={i} className="flex items-start justify-between p-2.5 bg-rose-500/5 border border-rose-500/15 rounded-xl text-xs">
                <span className="text-slate-200">{c.issue}</span>
                <span className="shrink-0 ml-2 font-bold text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded-full text-[10px]">
                  {c.count} mentions
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Praises */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
          <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center space-x-2">
            <ThumbsUp className="w-4 h-4 text-emerald-400" />
            <span>Top User Praises & Competitive Strengths</span>
          </h4>
          <div className="space-y-2">
            {(sentimentSummary?.topPraises || []).map((p, i) => (
              <div key={i} className="flex items-start justify-between p-2.5 bg-emerald-500/5 border border-emerald-500/15 rounded-xl text-xs">
                <span className="text-slate-200">{p.highlight}</span>
                <span className="shrink-0 ml-2 font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full text-[10px]">
                  {p.count} mentions
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search review keywords..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={filterSentiment}
            onChange={(e) => setFilterSentiment(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Sentiments</option>
            <option value="positive">Positive Reviews (4-5★)</option>
            <option value="neutral">Neutral Reviews (3★)</option>
            <option value="negative">Negative Reviews (1-2★)</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-3">
        {filteredReviews.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-500 text-xs">
            No store reviews found matching your search.
          </div>
        ) : (
          filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-2 hover:border-slate-700 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="flex items-center text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${s <= rev.rating ? 'fill-amber-400' : 'text-slate-700'}`}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-semibold text-white">{rev.author}</span>
                  <span className="text-[11px] text-slate-500">• {rev.date}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-medium bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                    {rev.store} (v{rev.appVersion})
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    rev.sentiment === 'positive' 
                      ? 'bg-emerald-500/20 text-emerald-400' 
                      : rev.sentiment === 'neutral' 
                      ? 'bg-amber-500/20 text-amber-400' 
                      : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {rev.sentiment}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{rev.reviewText}</p>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px]">
                <span className="text-indigo-400 font-medium bg-indigo-500/10 px-2 py-0.5 rounded-md">
                  Tag: {rev.topicTag}
                </span>
                {rev.devResponse && (
                  <span className="text-slate-400 italic">
                    Dev replied: "{rev.devResponse}"
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Manual Review Ingestion Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-semibold text-white">Log User Review / Feedback</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReview} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Target Mobile App</label>
                <select
                  value={newAppId}
                  onChange={(e) => setNewAppId(e.target.value as AppTarget)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-200"
                >
                  <option value="client_ios">Client iOS (Apple App Store)</option>
                  <option value="client_android">Client Android (Google Play Store)</option>
                  <option value="driver_ios">Driver iOS (Apple App Store)</option>
                  <option value="driver_android">Driver Android (Google Play Store)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Star Rating (1-5)</label>
                  <select
                    value={newRating}
                    onChange={(e) => setNewRating(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-200"
                  >
                    <option value={5}>5 Stars (Excellent)</option>
                    <option value={4}>4 Stars (Good)</option>
                    <option value={3}>3 Stars (Average)</option>
                    <option value={2}>2 Stars (Poor)</option>
                    <option value={1}>1 Star (Critical Issue)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Author Name / ID</label>
                  <input
                    type="text"
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    placeholder="e.g. Maria G. (Queens Rider)"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Feedback Category / Topic</label>
                <input
                  type="text"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder="e.g. WAV Accessibility, TLC Verification, Driver Payouts"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Review Content *</label>
                <textarea
                  required
                  rows={4}
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="Write the user's feedback or App Store review text..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-200"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium"
                >
                  {isSubmitting ? 'Saving...' : 'Save Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
