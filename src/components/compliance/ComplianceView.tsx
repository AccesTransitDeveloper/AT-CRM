import React, { useState, useEffect } from 'react';
import { 
  UserRole, 
  ComplianceDocument, 
  ComplianceDocStatus, 
  ComplianceAuditLog, 
  FleetComplianceSummary,
  ExpiryStatus
} from '../../types';
import { api } from '../../lib/api';
import { 
  ShieldCheck, FileCheck, AlertTriangle, CheckCircle2, XCircle, Clock, 
  Upload, Search, Filter, RefreshCw, Eye, Send, Lock, 
  FileText, Calendar, Sparkles, AlertCircle, Users, Check,
  ChevronRight, ExternalLink, ShieldAlert, ArrowUpDown, ChevronDown
} from 'lucide-react';
import { ComplianceCharts } from './ComplianceCharts';

interface ComplianceViewProps {
  currentRole: UserRole;
  onSelectDriver?: (driverId: string) => void;
}

export const ComplianceView: React.FC<ComplianceViewProps> = ({
  currentRole,
  onSelectDriver
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'matrix' | 'queue' | 'expiring' | 'audit' | 'consents'>('matrix');
  const [matrixData, setMatrixData] = useState<FleetComplianceSummary[]>([]);
  const [queueDocs, setQueueDocs] = useState<ComplianceDocument[]>([]);
  const [expiringDocs, setExpiringDocs] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<ComplianceAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [matrixFilter, setMatrixFilter] = useState<'all' | 'attention' | 'blocked' | 'wav'>('all');
  const [auditActionFilter, setAuditActionFilter] = useState<string>('all');

  // Preview & Action Modals
  const [inspectDoc, setInspectDoc] = useState<ComplianceDocument | null>(null);
  const [rejectModalDoc, setRejectModalDoc] = useState<ComplianceDocument | null>(null);
  const [rejectComment, setRejectComment] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const isDispatcher = currentRole === 'dispatcher';
  const canManage = currentRole === 'admin' || currentRole === 'driver_manager';

  const showNotification = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotificationMsg({ text, type });
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  const loadAllComplianceData = async () => {
    try {
      setLoading(true);
      const [matrix, queue, expiring, logs] = await Promise.all([
        api.getFleetComplianceMatrix(),
        api.getVerificationQueue(),
        api.getExpiringDocuments(),
        api.getComplianceAuditLogs()
      ]);
      setMatrixData(matrix);
      setQueueDocs(queue);
      setExpiringDocs(expiring);
      setAuditLogs(logs);
    } catch (err) {
      console.error('Failed to load compliance dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllComplianceData();
  }, []);

  // Expiry calculation helper
  const getExpiryInfo = (expiryDate?: string): { status: ExpiryStatus; label: string; bg: string; text: string; border: string; daysLeft: number } => {
    if (!expiryDate) {
      return { status: 'no_expiry', label: 'No Expiry', bg: 'bg-slate-800', text: 'text-slate-400', border: 'border-slate-700', daysLeft: 999 };
    }
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const exp = new Date(expiryDate);
    exp.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { status: 'expired', label: `Expired ${Math.abs(diffDays)}d ago`, bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/30', daysLeft: diffDays };
    } else if (diffDays <= 7) {
      return { status: 'expiring_7d', label: `Expires in ${diffDays}d`, bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30', daysLeft: diffDays };
    } else if (diffDays <= 30) {
      return { status: 'expiring_30d', label: `Expires in ${diffDays}d`, bg: 'bg-amber-500/15', text: 'text-amber-300', border: 'border-amber-500/30', daysLeft: diffDays };
    } else {
      return { status: 'valid', label: `Valid (${diffDays}d)`, bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', daysLeft: diffDays };
    }
  };

  // Actions
  const handleApprove = async (doc: ComplianceDocument) => {
    if (!canManage) return;
    try {
      setActionLoadingId(doc.id);
      await api.verifyComplianceDocument(doc.id, {
        status: 'verified',
        reviewerName: currentRole === 'admin' ? 'Marcus Chen' : 'Sarah Jenkins',
        reviewerRole: currentRole,
        reviewerComment: 'Verified and validated with NYC TLC Registry.'
      });
      showNotification(`"${doc.title}" for ${doc.driverName} verified.`);
      if (inspectDoc && inspectDoc.id === doc.id) {
        setInspectDoc(null);
      }
      await loadAllComplianceData();
    } catch (err: any) {
      showNotification(`Verification error: ${err?.message}`, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectModalDoc || !canManage) return;
    try {
      setActionLoadingId(rejectModalDoc.id);
      await api.verifyComplianceDocument(rejectModalDoc.id, {
        status: 'rejected',
        reviewerName: currentRole === 'admin' ? 'Marcus Chen' : 'Sarah Jenkins',
        reviewerRole: currentRole,
        reviewerComment: rejectComment || 'Document rejected. Replacement required.'
      });
      showNotification(`Document rejected. Driver notified via AT AI.`, 'info');
      setRejectModalDoc(null);
      setRejectComment('');
      if (inspectDoc && inspectDoc.id === rejectModalDoc.id) {
        setInspectDoc(null);
      }
      await loadAllComplianceData();
    } catch (err: any) {
      showNotification(`Rejection error: ${err?.message}`, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSendReminder = async (doc: ComplianceDocument) => {
    try {
      setActionLoadingId(doc.id);
      const res = await api.sendComplianceReminder(doc.id, 'at_ai');
      showNotification(res.message, 'success');
      await loadAllComplianceData();
    } catch (err: any) {
      showNotification(`Reminder failed: ${err?.message}`, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter matrix
  const filteredMatrix = matrixData.filter(d => {
    if (matrixFilter === 'blocked' && !d.isDispatchBlocked) return false;
    if (matrixFilter === 'wav' && d.vehicleType !== 'WAV') return false;
    if (matrixFilter === 'attention' && d.expiredDocs === 0 && d.pendingDocs === 0 && d.expiringDocs === 0) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        d.driverName.toLowerCase().includes(q) ||
        d.phone.includes(q) ||
        d.tlcLicenseNumber.toLowerCase().includes(q) ||
        d.vehiclePlate.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Filter audit logs
  const filteredAuditLogs = auditLogs.filter(log => {
    if (auditActionFilter !== 'all' && log.action !== auditActionFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        log.driverName.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        (log.docTitle && log.docTitle.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Fleet overview statistics
  const totalTrackedDocs = matrixData.reduce((acc, m) => acc + m.totalDocs, 0);
  const totalVerifiedDocs = matrixData.reduce((acc, m) => acc + m.verifiedDocs, 0);
  const totalExpiredDocs = matrixData.reduce((acc, m) => acc + m.expiredDocs, 0);
  const blockedDriversCount = matrixData.filter(m => m.isDispatchBlocked).length;
  const complianceRate = totalTrackedDocs > 0 ? Math.round((totalVerifiedDocs / totalTrackedDocs) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notificationMsg && (
        <div className={`p-3 rounded-xl text-xs font-medium border flex items-center justify-between transition-all ${
          notificationMsg.type === 'success' 
            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' 
            : notificationMsg.type === 'error'
            ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
            : 'bg-sky-500/15 text-sky-300 border-sky-500/30'
        }`}>
          <div className="flex items-center gap-2">
            {notificationMsg.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {notificationMsg.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400" />}
            {notificationMsg.type === 'info' && <AlertCircle className="w-4 h-4 text-sky-400" />}
            <span>{notificationMsg.text}</span>
          </div>
          <button onClick={() => setNotificationMsg(null)} className="text-slate-400 hover:text-white text-xs">✕</button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-500/10 rounded-2xl text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">NYC TLC Compliance & Document Control</h2>
              <p className="text-xs text-slate-400">
                Automated driver credentials monitoring, expiry safety locks, AI verification, and append-only audit trail.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadAllComplianceData}
            disabled={loading}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync TLC Registry</span>
          </button>
        </div>
      </div>

      {/* Top 5 Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Metric 1: Pending Queue */}
        <div 
          onClick={() => setActiveSubTab('queue')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            activeSubTab === 'queue' ? 'bg-amber-950/30 border-amber-500' : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold">Verification Queue</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono">{queueDocs.length}</div>
          <div className="text-[11px] text-amber-300/80 mt-1">Pending Staff / OCR Review</div>
        </div>

        {/* Metric 2: Expiring Soon (30d / 7d) */}
        <div 
          onClick={() => setActiveSubTab('expiring')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            activeSubTab === 'expiring' ? 'bg-sky-950/30 border-sky-500' : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold">Expiring ≤ 30 Days</span>
            <Calendar className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-sky-400 font-mono">{expiringDocs.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Upcoming renewal notices</div>
        </div>

        {/* Metric 3: Expired / Safety Locked Drivers */}
        <div 
          onClick={() => {
            setActiveSubTab('matrix');
            setMatrixFilter('blocked');
          }}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            blockedDriversCount > 0 ? 'bg-rose-950/30 border-rose-500/50' : 'bg-slate-900/70 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold">Safety Locks</span>
            <Lock className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 font-mono">{blockedDriversCount}</div>
          <div className="text-[11px] text-rose-300 mt-1">Drivers auto-suspended</div>
        </div>

        {/* Metric 4: Total Tracked Documents */}
        <div 
          onClick={() => setActiveSubTab('matrix')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            activeSubTab === 'matrix' ? 'bg-slate-800/80 border-slate-600' : 'bg-slate-900/70 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold">Total Documents</span>
            <FileText className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{totalTrackedDocs}</div>
          <div className="text-[11px] text-emerald-400 mt-1">{totalVerifiedDocs} active & verified</div>
        </div>

        {/* Metric 5: Fleet Compliance Rate */}
        <div className="p-4 rounded-2xl border bg-slate-900/70 border-slate-800 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold">Fleet Compliance</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">{complianceRate}%</div>
          <div className="text-[11px] text-slate-400 mt-1">TLC regulatory standard</div>
        </div>
      </div>

      {/* Interactive Compliance Charts */}
      <ComplianceCharts 
        matrixData={matrixData}
        queueDocs={queueDocs}
        expiringDocs={expiringDocs}
      />

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-800 space-x-1 overflow-x-auto no-scrollbar">
        {[
          { id: 'matrix', label: 'Fleet Compliance Matrix', count: matrixData.length },
          { id: 'queue', label: 'Verification Queue', count: queueDocs.length, alert: queueDocs.length > 0 },
          { id: 'expiring', label: 'Expiring & Renewal Alerts', count: expiringDocs.length },
          { id: 'audit', label: 'Immutable Audit Log', count: auditLogs.length },
          { id: 'consents', label: 'TLC Privacy & Electronic Consents', count: matrixData.filter(m => m.consentGiven).length }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 border-t-2 ${
              activeSubTab === tab.id
                ? 'bg-slate-800/80 text-white border-sky-500 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`px-2 py-0.2 rounded-full text-[10px] font-mono ${
                tab.alert 
                  ? 'bg-amber-500 text-white' 
                  : activeSubTab === tab.id 
                  ? 'bg-slate-700 text-white' 
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* SUBTAB 1: FLEET COMPLIANCE MATRIX                                         */}
      {/* ========================================================================= */}
      {activeSubTab === 'matrix' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search driver, TLC license, plate number..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setMatrixFilter('all')}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                    matrixFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All Drivers ({matrixData.length})
                </button>
                <button
                  onClick={() => setMatrixFilter('attention')}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                    matrixFilter === 'attention' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Needs Attention
                </button>
                <button
                  onClick={() => setMatrixFilter('blocked')}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                    matrixFilter === 'blocked' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Safety Locked ({blockedDriversCount})
                </button>
                <button
                  onClick={() => setMatrixFilter('wav')}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                    matrixFilter === 'wav' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  WAV Fleet
                </button>
              </div>
            </div>
          </div>

          {/* Matrix Grid Table */}
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3.5 font-bold">Driver & Vehicle</th>
                    <th className="p-3.5 font-bold text-center">TLC License</th>
                    <th className="p-3.5 font-bold text-center">DMV License</th>
                    <th className="p-3.5 font-bold text-center">FHV Insurance</th>
                    <th className="p-3.5 font-bold text-center">TLC Registration</th>
                    <th className="p-3.5 font-bold text-center">TLC Inspection</th>
                    <th className="p-3.5 font-bold text-center">Dispatch Status</th>
                    <th className="p-3.5 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredMatrix.map((item) => {
                    const renderDocBadge = (doc?: ComplianceDocument) => {
                      if (!doc) {
                        return (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 text-slate-500">
                            Missing
                          </span>
                        );
                      }
                      const info = getExpiryInfo(doc.expiryDate);
                      const isPending = doc.status === 'pending_review';
                      const isRejected = doc.status === 'rejected';

                      if (isPending) {
                        return (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            Review
                          </span>
                        );
                      }
                      if (isRejected) {
                        return (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                            Rejected
                          </span>
                        );
                      }

                      return (
                        <div className="flex flex-col items-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${info.bg} ${info.text} ${info.border}`}>
                            {info.status === 'expired' ? 'Expired' : info.status === 'expiring_7d' ? '≤7d' : info.status === 'expiring_30d' ? '≤30d' : 'Valid'}
                          </span>
                          <span className="text-[9px] text-slate-500 font-mono mt-0.5">{doc.expiryDate?.slice(5)}</span>
                        </div>
                      );
                    };

                    return (
                      <tr key={item.driverId} className="hover:bg-slate-800/30 transition-colors">
                        {/* Driver details */}
                        <td className="p-3.5">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{item.driverName}</span>
                            {item.vehicleType === 'WAV' && (
                              <span className="px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 text-[10px] font-semibold font-mono">
                                ♿ WAV
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {item.tlcLicenseNumber} • Plate: {item.vehiclePlate}
                          </div>
                        </td>

                        {/* TLC License */}
                        <td className="p-3.5 text-center">
                          {renderDocBadge(item.docs.tlcLicense)}
                        </td>

                        {/* DMV License */}
                        <td className="p-3.5 text-center">
                          {renderDocBadge(item.docs.driverLicense)}
                        </td>

                        {/* FHV Insurance */}
                        <td className="p-3.5 text-center">
                          {renderDocBadge(item.docs.insurance)}
                        </td>

                        {/* Registration */}
                        <td className="p-3.5 text-center">
                          {renderDocBadge(item.docs.registration)}
                        </td>

                        {/* Inspection */}
                        <td className="p-3.5 text-center">
                          {renderDocBadge(item.docs.inspection)}
                        </td>

                        {/* Dispatch Status */}
                        <td className="p-3.5 text-center">
                          {item.isDispatchBlocked ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center justify-center gap-1">
                              <Lock className="w-3 h-3" />
                              Safety Locked
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Active Dispatch
                            </span>
                          )}
                        </td>

                        {/* Action */}
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => onSelectDriver && onSelectDriver(item.driverId)}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold border border-slate-700 transition-colors inline-flex items-center gap-1"
                          >
                            <span>Dossier</span>
                            <ChevronRight className="w-3 h-3 text-slate-400" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 2: VERIFICATION QUEUE                                             */}
      {/* ========================================================================= */}
      {activeSubTab === 'queue' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Pending Verification Queue</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {queueDocs.length} Pending
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                New driver uploads, renewed policies, and AT AI Voice ingested credentials awaiting validation.
              </p>
            </div>
          </div>

          {queueDocs.length === 0 ? (
            <div className="py-16 text-center bg-slate-900/40 rounded-2xl border border-slate-800 p-8 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <div className="text-sm font-bold text-white">Verification Queue is Clear!</div>
              <p className="text-xs text-slate-400">All submitted TLC documents have been verified and processed.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {queueDocs.map((doc) => {
                const isActionLoading = actionLoadingId === doc.id;
                return (
                  <div key={doc.id} className="bg-slate-900 rounded-2xl border border-amber-500/30 overflow-hidden flex flex-col justify-between shadow-xl">
                    <div className="p-4 space-y-3">
                      {/* Driver & Document Title */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-xs text-amber-400 font-mono font-semibold uppercase tracking-wider">
                            {doc.uploadedBy === 'at_ai' ? '🤖 AT AI Ingestion' : 'Driver Portal Submission'}
                          </div>
                          <h4 className="text-sm font-bold text-white mt-0.5">{doc.title}</h4>
                          <div className="text-xs text-slate-300 font-medium">
                            Driver: <strong className="text-sky-300">{doc.driverName}</strong>
                          </div>
                        </div>

                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                          Pending Review
                        </span>
                      </div>

                      {/* AI OCR Metadata if present */}
                      {doc.extractedData && (
                        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-xs space-y-1.5">
                          <div className="flex items-center justify-between text-slate-400">
                            <span className="font-semibold text-sky-400 flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5" />
                              Gemini OCR Extraction
                            </span>
                            <span className="text-[10px] text-emerald-400 font-mono font-bold">
                              {Math.round((doc.extractedData.confidence || 0.95) * 100)}% Confidence
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-slate-300 font-mono text-[11px]">
                            <div>Name: <span className="text-white font-bold">{doc.extractedData.fullName || doc.driverName}</span></div>
                            <div>Exp: <span className="text-amber-400 font-bold">{doc.expiryDate || 'Not specified'}</span></div>
                            {doc.extractedData.licenseNumber && (
                              <div>Lic #: <span className="text-white font-bold">{doc.extractedData.licenseNumber}</span></div>
                            )}
                            {doc.extractedData.plateNumber && (
                              <div>Plate: <span className="text-sky-300 font-bold">{doc.extractedData.plateNumber}</span></div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Image Preview */}
                      <div 
                        onClick={() => !isDispatcher && setInspectDoc(doc)}
                        className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-[16/8] relative group cursor-pointer"
                      >
                        {isDispatcher ? (
                          <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-slate-900 text-slate-400">
                            <Lock className="w-5 h-5 text-slate-500 mb-1" />
                            <span className="text-xs font-semibold">Protected TLC Scan</span>
                            <span className="text-[10px] text-slate-500">Dispatcher role restricted from PII inspection.</span>
                          </div>
                        ) : (
                          <>
                            <img
                              src={doc.fileUrl}
                              alt={doc.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity">
                              <Eye className="w-4 h-4 mr-1 text-sky-400" /> Click to Inspect Full Scan
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Verification Controls */}
                    <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between gap-2">
                      <div className="text-[11px] text-slate-400 font-mono">
                        Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                      </div>

                      {canManage ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setRejectModalDoc(doc)}
                            disabled={isActionLoading}
                            className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5 text-rose-400" />
                            Reject...
                          </button>
                          <button
                            onClick={() => handleApprove(doc)}
                            disabled={isActionLoading}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-900/30 transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Approve Document ✓
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500 italic">
                          Manager/Admin credentials required to verify.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 3: EXPIRING & RENEWAL ALERTS                                       */}
      {/* ========================================================================= */}
      {activeSubTab === 'expiring' && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>TLC Expiration & Renewal Tracking (30-Day Outlook)</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
                  {expiringDocs.length} Alerts
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Proactive monitoring ensures 0% vehicle downtime. Dispatch automated AT AI Voice & SMS renewal reminders before expiration.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {expiringDocs.map((item) => {
              const expiryInfo = getExpiryInfo(item.expiryDate);
              const isActionLoading = actionLoadingId === item.id;
              const isExpired = expiryInfo.status === 'expired';

              return (
                <div 
                  key={item.id}
                  className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                    isExpired 
                      ? 'bg-rose-950/20 border-rose-500/40' 
                      : expiryInfo.status === 'expiring_7d'
                      ? 'bg-orange-950/20 border-orange-500/40'
                      : 'bg-slate-900/80 border-slate-800'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1 ${expiryInfo.bg} ${expiryInfo.text} ${expiryInfo.border}`}>
                        <Clock className="w-3 h-3" />
                        {expiryInfo.label}
                      </span>
                      <h4 className="text-sm font-bold text-white">{item.title}</h4>
                    </div>
                    <div className="text-xs text-slate-300">
                      Driver: <strong className="text-white">{item.driverName}</strong> • Expiry Date: <span className="font-mono text-sky-300 font-bold">{item.expiryDate}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => !isDispatcher && setInspectDoc(item)}
                      disabled={isDispatcher}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5 text-sky-400" />
                      View Scan
                    </button>

                    <button
                      onClick={() => handleSendReminder(item)}
                      disabled={isActionLoading}
                      className="px-4 py-1.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isActionLoading ? 'Sending...' : 'Dispatch Reminder'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 4: IMMUTABLE AUDIT TRAIL                                           */}
      {/* ========================================================================= */}
      {activeSubTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Immutable Compliance Audit Trail</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 text-slate-300">
                  {filteredAuditLogs.length} Events Logged
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Append-only log of all document uploads, approvals, rejections, automated dispatch safety locks, and reminder notices.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={auditActionFilter}
                onChange={(e) => setAuditActionFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:border-sky-500 focus:outline-none"
              >
                <option value="all">All Actions</option>
                <option value="verify">Approvals (Verify)</option>
                <option value="reject">Rejections</option>
                <option value="expired_auto_lock">Safety Locks</option>
                <option value="upload">Uploads</option>
                <option value="reminder_sent">Reminders Sent</option>
                <option value="consent_given">Driver Consent</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden divide-y divide-slate-800">
            {filteredAuditLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-slate-800/30 transition-colors flex items-start justify-between gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      log.action === 'verify' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                      log.action === 'reject' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                      log.action === 'expired_auto_lock' ? 'bg-rose-900/60 text-rose-200 border border-rose-700' :
                      log.action === 'reminder_sent' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {log.action}
                    </span>
                    <strong className="text-white">{log.performedBy}</strong>
                    <span className="text-slate-400">({log.role})</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-sky-300 font-semibold">{log.driverName}</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed pt-0.5">{log.details}</p>
                </div>

                <div className="text-right shrink-0 font-mono text-[11px] text-slate-400">
                  <div>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  <div className="text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 5: CONSENTS & PRIVACY                                              */}
      {/* ========================================================================= */}
      {activeSubTab === 'consents' && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <span>Electronic TLC Driver Consent & Background Data Processing</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified electronic consent signatures stored in compliance with NYC TLC and NYS Department of Labor guidelines.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matrixData.map((item) => (
              <div key={item.driverId} className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-white">{item.driverName}</div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    item.consentGiven ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {item.consentGiven ? 'Consent Active ✓' : 'Pending Signature'}
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  Phone: {item.phone} • TLC: {item.tlcLicenseNumber}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                  {item.consentGiven 
                    ? 'Driver accepted electronic TLC Data Processing terms (v2026.1). Background check authorization on file.'
                    : 'Awaiting driver authorization through AT AI voice onboarding link.'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FULL RESOLUTION DOCUMENT INSPECTOR MODAL                                  */}
      {/* ========================================================================= */}
      {inspectDoc && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
              <div>
                <h3 className="text-sm font-bold text-white">{inspectDoc.title}</h3>
                <p className="text-xs text-slate-400 font-mono">
                  {inspectDoc.driverName} • {inspectDoc.fileName} • Exp: {inspectDoc.expiryDate || 'N/A'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {canManage && (inspectDoc.status === 'pending_review' || inspectDoc.status === 'unverified') && (
                  <>
                    <button
                      onClick={() => setRejectModalDoc(inspectDoc)}
                      className="px-3 py-1.5 bg-rose-950 text-rose-300 border border-rose-800 rounded-xl text-xs font-bold"
                    >
                      Reject...
                    </button>
                    <button
                      onClick={() => handleApprove(inspectDoc)}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold"
                    >
                      Approve Scan ✓
                    </button>
                  </>
                )}
                <button
                  onClick={() => setInspectDoc(null)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 bg-black/60 flex items-center justify-center">
              <img
                src={inspectDoc.fileUrl}
                alt={inspectDoc.title}
                className="max-h-[75vh] w-auto max-w-full rounded-xl object-contain shadow-2xl border border-slate-800"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectModalDoc && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-800/80 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-500/20 rounded-xl text-rose-400">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Reject Document Submission</h3>
                <p className="text-xs text-slate-400">{rejectModalDoc.title} ({rejectModalDoc.driverName})</p>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              Provide a clear reason. Accessible Transit AI will automatically dispatch an SMS / notification to the driver.
            </p>

            <div>
              <label className="block text-slate-300 font-semibold mb-1 text-xs">Reason for Rejection</label>
              <textarea
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-xs focus:border-rose-500 focus:outline-none"
                placeholder="e.g. Photo blurry, expiration date passed, or missing official TLC seal..."
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setRejectModalDoc(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-900/30"
              >
                Confirm Rejection & Notify Driver
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
