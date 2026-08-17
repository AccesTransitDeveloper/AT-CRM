import React, { useState, useEffect } from 'react';
import { 
  Driver, 
  UserRole, 
  ComplianceDocument, 
  ComplianceDocType, 
  ComplianceDocStatus, 
  ExpiryStatus,
  ComplianceAuditLog,
  DriverConsent
} from '../../types';
import { api } from '../../lib/api';
import { 
  FileCheck, Shield, AlertTriangle, CheckCircle2, XCircle, Clock, 
  Upload, Sparkles, RefreshCw, Eye, History, Send, Lock, 
  FileText, Calendar, Info, ChevronDown, ChevronUp, AlertCircle, FilePlus
} from 'lucide-react';

interface DriverDocumentsSectionProps {
  driver: Driver;
  currentRole: UserRole;
  onOpenDocViewer: (url: string, title?: string, doc?: ComplianceDocument) => void;
  onStatusChanged?: () => void;
}

const docTypeLabels: Record<ComplianceDocType, string> = {
  tlc_license: 'NYC TLC For-Hire Driver License',
  driver_license: "NYS DMV Driver's License",
  insurance: 'FHV Commercial Auto Liability Insurance',
  registration: 'NYC TLC Vehicle Registration',
  inspection: 'NYC TLC Visual & Safety Inspection',
  vehicle_photo: 'Vehicle Photo (Interior/Exterior)',
  custom: 'Additional TLC / WAV Certificate'
};

export const DriverDocumentsSection: React.FC<DriverDocumentsSectionProps> = ({
  driver,
  currentRole,
  onOpenDocViewer,
  onStatusChanged
}) => {
  const [documents, setDocuments] = useState<ComplianceDocument[]>([]);
  const [auditLogs, setAuditLogs] = useState<ComplianceAuditLog[]>([]);
  const [consent, setConsent] = useState<DriverConsent | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedHistoryDocId, setExpandedHistoryDocId] = useState<string | null>(null);

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadDocType, setUploadDocType] = useState<ComplianceDocType>('tlc_license');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadExpiryDate, setUploadExpiryDate] = useState('');
  const [uploadFileUrl, setUploadFileUrl] = useState('');
  const [uploadFileName, setUploadFileName] = useState('');
  const [isScanningAI, setIsScanningAI] = useState(false);
  const [aiScanResult, setAiScanResult] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  // Verify / Reject Modal State
  const [rejectModalDoc, setRejectModalDoc] = useState<ComplianceDocument | null>(null);
  const [rejectComment, setRejectComment] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const isDispatcher = currentRole === 'dispatcher';
  const canManage = currentRole === 'admin' || currentRole === 'driver_manager';

  const loadComplianceData = async () => {
    try {
      setLoading(true);
      const [docsData, logsData, consentData] = await Promise.all([
        api.getComplianceDocuments({ driverId: driver.id }),
        api.getComplianceAuditLogs(driver.id),
        api.getDriverConsent(driver.id)
      ]);
      setDocuments(docsData);
      setAuditLogs(logsData);
      setConsent(consentData);
    } catch (err) {
      console.error('Failed to load driver compliance records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplianceData();
  }, [driver.id]);

  const showNotification = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotificationMsg({ text, type });
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  // Helper for expiry calculation
  const getDocExpiryInfo = (expiryDate?: string): { status: ExpiryStatus; label: string; bg: string; text: string; border: string; daysLeft: number } => {
    if (!expiryDate) {
      return { status: 'no_expiry', label: 'No Expiry Set', bg: 'bg-slate-800', text: 'text-slate-400', border: 'border-slate-700', daysLeft: 999 };
    }
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const exp = new Date(expiryDate);
    exp.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { status: 'expired', label: `Expired ${Math.abs(diffDays)}d ago`, bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/30', daysLeft: diffDays };
    } else if (diffDays <= 7) {
      return { status: 'expiring_7d', label: `Expires in ${diffDays}d (Urgent)`, bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30', daysLeft: diffDays };
    } else if (diffDays <= 30) {
      return { status: 'expiring_30d', label: `Expires in ${diffDays}d`, bg: 'bg-amber-500/15', text: 'text-amber-300', border: 'border-amber-500/30', daysLeft: diffDays };
    } else {
      return { status: 'valid', label: `Valid (${diffDays}d left)`, bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', daysLeft: diffDays };
    }
  };

  // Check safety lock across mandatory documents
  const expiredMandatoryDocs = documents.filter(d => {
    const info = getDocExpiryInfo(d.expiryDate);
    return info.status === 'expired' && d.isMandatory;
  });

  const hasPendingReview = documents.some(d => d.status === 'pending_review');

  // Verify approve action
  const handleApproveDoc = async (doc: ComplianceDocument) => {
    if (!canManage) return;
    try {
      setActionLoadingId(doc.id);
      await api.verifyComplianceDocument(doc.id, {
        status: 'verified',
        reviewerName: currentRole === 'admin' ? 'Marcus Chen' : 'Sarah Jenkins',
        reviewerRole: currentRole,
        reviewerComment: 'Validated against NYC TLC active registry.'
      });
      showNotification(`"${doc.title}" verified successfully.`);
      await loadComplianceData();
      if (onStatusChanged) onStatusChanged();
    } catch (err: any) {
      showNotification(`Failed to approve document: ${err?.message}`, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Verify reject action
  const handleConfirmReject = async () => {
    if (!rejectModalDoc || !canManage) return;
    try {
      setActionLoadingId(rejectModalDoc.id);
      await api.verifyComplianceDocument(rejectModalDoc.id, {
        status: 'rejected',
        reviewerName: currentRole === 'admin' ? 'Marcus Chen' : 'Sarah Jenkins',
        reviewerRole: currentRole,
        reviewerComment: rejectComment || 'Document illegible or rejected. Re-upload required.'
      });
      showNotification(`Document rejected. Driver notified via AT AI.`, 'info');
      setRejectModalDoc(null);
      setRejectComment('');
      await loadComplianceData();
      if (onStatusChanged) onStatusChanged();
    } catch (err: any) {
      showNotification(`Failed to reject document: ${err?.message}`, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Send renewal reminder
  const handleSendReminder = async (doc: ComplianceDocument) => {
    try {
      setActionLoadingId(doc.id);
      const res = await api.sendComplianceReminder(doc.id, 'at_ai');
      showNotification(res.message, 'success');
      await loadComplianceData();
    } catch (err: any) {
      showNotification(`Failed to dispatch reminder: ${err?.message}`, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // AI OCR Scan
  const handleRunAiScan = async () => {
    try {
      setIsScanningAI(true);
      const res = await api.scanDocumentWithAI(uploadDocType, {
        fullName: driver.fullName,
        plate: driver.vehiclePlate,
        tlc: driver.tlcLicenseNumber
      });
      setAiScanResult(res);
      if (res.expiryDate) setUploadExpiryDate(res.expiryDate);
      if (res.ocrSummary) showNotification(`AI OCR Scan Complete: ${res.ocrSummary}`, 'info');
    } catch (err: any) {
      showNotification('AI OCR Scan failed to extract data.', 'error');
    } finally {
      setIsScanningAI(false);
    }
  };

  // Submit Upload
  const handleSubmitUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFileUrl) {
      showNotification('Please provide or select a document image/file.', 'error');
      return;
    }

    try {
      setUploading(true);
      await api.uploadComplianceDocument({
        driverId: driver.id,
        docType: uploadDocType,
        title: uploadTitle || docTypeLabels[uploadDocType],
        fileUrl: uploadFileUrl,
        fileName: uploadFileName || `${uploadDocType}_${Date.now()}.pdf`,
        fileSize: '2.4 MB',
        fileType: uploadFileUrl.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
        expiryDate: uploadExpiryDate || undefined,
        uploadedBy: 'staff',
        extractedData: aiScanResult,
        actorRole: currentRole,
        actorName: currentRole === 'admin' ? 'Admin' : 'Compliance Mgr'
      });

      showNotification('Document successfully uploaded to verification queue.');
      setIsUploadModalOpen(false);
      // Reset form
      setUploadTitle('');
      setUploadExpiryDate('');
      setUploadFileUrl('');
      setUploadFileName('');
      setAiScanResult(null);
      await loadComplianceData();
      if (onStatusChanged) onStatusChanged();
    } catch (err: any) {
      showNotification(`Upload failed: ${err?.message}`, 'error');
    } finally {
      setUploading(false);
    }
  };

  // Preset file templates for quick testing / manual attachment
  const sampleDocOptions = [
    { label: 'NYC TLC Driver License', url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1000&auto=format&fit=crop&q=80', name: 'TLC_Driver_License_2026.pdf' },
    { label: 'NYS DMV Class E License', url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1000&auto=format&fit=crop&q=80', name: 'NYS_DMV_ClassE.jpg' },
    { label: 'American Transit Insurance Binder', url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=1000&auto=format&fit=crop&q=80', name: 'AmericanTransit_Policy_2026.pdf' },
    { label: 'TLC Vehicle Registration', url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1000&auto=format&fit=crop&q=80', name: 'TLC_Registration_T789211C.jpg' },
    { label: 'TLC Woodside Inspection Pass', url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1000&auto=format&fit=crop&q=80', name: 'TLC_Inspection_Woodside.pdf' },
    { label: 'BraunAbility WAV Ramp Cert', url: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=1000&auto=format&fit=crop&q=80', name: 'BraunAbility_ADA_Cert.pdf' }
  ];

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
            {notificationMsg.type === 'info' && <Info className="w-4 h-4 text-sky-400" />}
            <span>{notificationMsg.text}</span>
          </div>
          <button onClick={() => setNotificationMsg(null)} className="text-slate-400 hover:text-white text-xs">✕</button>
        </div>
      )}

      {/* Safety Lock Alert Banner if expired mandatory docs exist */}
      {expiredMandatoryDocs.length > 0 && (
        <div className="p-4 bg-rose-950/40 border-2 border-rose-500/50 rounded-2xl flex items-start gap-3.5">
          <div className="p-2 bg-rose-500/20 rounded-xl text-rose-400 shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div className="flex-1 text-xs">
            <div className="flex items-center justify-between">
              <h4 className="text-rose-200 font-bold text-sm flex items-center gap-2">
                <span>DISPATCH SAFETY LOCK ACTIVATED</span>
                <span className="px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-300 text-[10px] font-mono uppercase">Blocked</span>
              </h4>
            </div>
            <p className="text-rose-300/90 mt-1 leading-relaxed">
              Driver has <strong className="text-rose-100">{expiredMandatoryDocs.length} expired mandatory document(s)</strong>.
              Accessible Transit safety policy has automatically suspended this driver from receiving new dispatch trip offers.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {expiredMandatoryDocs.map(d => (
                <span key={d.id} className="px-2.5 py-1 rounded-lg bg-rose-900/60 border border-rose-700/60 text-rose-200 text-[11px] font-medium flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3 text-rose-400" />
                  {d.title} (Expired {d.expiryDate})
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Header & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-bold text-white">NYC TLC & Safety Compliance Dossier</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
              {documents.length} Records Tracked
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {isDispatcher 
              ? '👁️ Dispatcher View-Only Mode: Real-time validity & expiry status (Protected PII files restricted).' 
              : 'Verifications, automated 30d/7d renewal alerts, AI OCR extracts, and document version history.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadComplianceData}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs transition-colors"
            title="Refresh documents"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {canManage && (
            <button
              onClick={() => {
                setUploadDocType('tlc_license');
                setIsUploadModalOpen(true);
              }}
              className="px-3.5 py-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-sky-900/20 transition-all cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload / Renew Document
            </button>
          )}
        </div>
      </div>

      {/* Electronic Driver Consent Badge */}
      <div className="bg-slate-900/40 p-3.5 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${consent?.consentGiven ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
            <FileCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-slate-200 font-semibold flex items-center gap-2">
              <span>TLC Electronic Background & Data Consent</span>
              <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                consent?.consentGiven ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
              }`}>
                {consent?.consentGiven ? 'Signed & Active (v2026.1)' : 'Pending Driver Signature'}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
              {consent?.consentGiven 
                ? `Confirmed on ${consent.consentDate ? new Date(consent.consentDate).toLocaleDateString() : 'N/A'} • IP: ${consent.ipAddress || 'Verified Mobile Device'}`
                : 'Driver must confirm TLC terms via AT AI Onboarding or Driver App'}
            </div>
          </div>
        </div>
        {canManage && !consent?.consentGiven && (
          <button
            onClick={async () => {
              await api.recordDriverConsent(driver.id, 'v2026.1', 'Manager Manual Override');
              showNotification('Driver electronic consent recorded manually.');
              await loadComplianceData();
            }}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium border border-slate-700"
          >
            Mark Signed
          </button>
        )}
      </div>

      {/* Document Grid / Cards */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin text-sky-400" />
          <span className="text-xs">Loading verified compliance records...</span>
        </div>
      ) : documents.length === 0 ? (
        <div className="py-12 text-center bg-slate-900/30 rounded-2xl border border-dashed border-slate-800 p-6 space-y-3">
          <FileText className="w-8 h-8 text-slate-500 mx-auto" />
          <div className="text-sm font-semibold text-slate-300">No Compliance Documents on File</div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Upload the driver's TLC License, NY DMV Driver License, FHV Insurance, and Inspection reports to proceed.
          </p>
          {canManage && (
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold"
            >
              Upload First Document
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map((doc) => {
            const expiryInfo = getDocExpiryInfo(doc.expiryDate);
            const isPending = doc.status === 'pending_review' || doc.status === 'unverified';
            const isRejected = doc.status === 'rejected';
            const isVerified = doc.status === 'verified';
            const isActionLoading = actionLoadingId === doc.id;
            const hasHistory = doc.history && doc.history.length > 0;
            const isHistoryOpen = expandedHistoryDocId === doc.id;

            return (
              <div 
                key={doc.id}
                className={`bg-slate-900/80 rounded-2xl border transition-all relative flex flex-col justify-between overflow-hidden ${
                  expiryInfo.status === 'expired'
                    ? 'border-rose-500/50 bg-rose-950/10'
                    : isPending
                    ? 'border-amber-500/40 bg-amber-950/10'
                    : isRejected
                    ? 'border-rose-900/60 bg-rose-950/20'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Card Top Section */}
                <div className="p-4 space-y-3">
                  {/* Status Badges & Type */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-white">
                          {doc.title}
                        </span>
                        {doc.version > 1 && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                            v{doc.version}
                          </span>
                        )}
                        {doc.isMandatory && (
                          <span className="px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 text-[10px] font-medium border border-sky-500/20">
                            Required
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {doc.fileName} • {doc.fileSize || '2.1 MB'}
                      </div>
                    </div>

                    {/* Expiry Pill */}
                    <div className="text-right shrink-0">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border flex items-center gap-1 ${expiryInfo.bg} ${expiryInfo.text} ${expiryInfo.border}`}>
                        <Clock className="w-3 h-3" />
                        {expiryInfo.label}
                      </span>
                    </div>
                  </div>

                  {/* Verification Status Banner */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <div className="flex items-center gap-1.5">
                      {isVerified && (
                        <span className="flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Verified
                        </span>
                      )}
                      {isPending && (
                        <span className="flex items-center gap-1 text-amber-400 font-semibold text-[11px]">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Pending Review
                        </span>
                      )}
                      {isRejected && (
                        <span className="flex items-center gap-1 text-rose-400 font-semibold text-[11px]">
                          <XCircle className="w-3.5 h-3.5" />
                          Rejected
                        </span>
                      )}
                      <span className="text-slate-500">•</span>
                      <span className="text-[11px] text-slate-400">
                        {doc.uploadedBy === 'at_ai' ? '🤖 Ingested by AT AI' : `Uploaded by ${doc.uploadedBy}`}
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-400 font-mono">
                      Exp: {doc.expiryDate || 'N/A'}
                    </span>
                  </div>

                  {/* Reviewer Note / Rejection Comment if present */}
                  {doc.reviewerComment && (
                    <div className={`p-2.5 rounded-xl text-xs border ${
                      isRejected 
                        ? 'bg-rose-900/30 text-rose-200 border-rose-800/50' 
                        : 'bg-slate-800/60 text-slate-300 border-slate-700/60'
                    }`}>
                      <div className="font-semibold text-[10px] text-slate-400 uppercase tracking-wider">
                        {isRejected ? 'Rejection Reason' : 'Compliance Note'}:
                      </div>
                      <div className="mt-0.5 text-[11px]">{doc.reviewerComment}</div>
                      {doc.verifiedBy && (
                        <div className="text-[10px] text-slate-400 mt-1">Reviewed by {doc.verifiedBy}</div>
                      )}
                    </div>
                  )}

                  {/* AI Extracted Metadata Chips */}
                  {doc.extractedData && (
                    <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800 text-[11px] space-y-1">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="flex items-center gap-1 font-semibold text-sky-300 text-[10px] uppercase">
                          <Sparkles className="w-3 h-3 text-sky-400" />
                          Gemini Vision OCR Extract
                        </span>
                        {doc.extractedData.confidence && (
                          <span className="text-[10px] text-emerald-400 font-mono">
                            {Math.round(doc.extractedData.confidence * 100)}% Match
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-slate-300 font-mono text-[10px] pt-0.5">
                        {doc.extractedData.licenseNumber && (
                          <div>License #: <span className="text-white font-bold">{doc.extractedData.licenseNumber}</span></div>
                        )}
                        {doc.extractedData.plateNumber && (
                          <div>Plate: <span className="text-sky-300 font-bold">{doc.extractedData.plateNumber}</span></div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Thumbnail / Document Preview Section */}
                  <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-[16/7] group">
                    {isDispatcher ? (
                      <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-slate-900/90 text-slate-400 space-y-1">
                        <Lock className="w-5 h-5 text-slate-500" />
                        <span className="text-xs font-semibold text-slate-300">Protected TLC Document</span>
                        <span className="text-[10px] text-slate-500">Dispatcher role restricted from viewing raw PII scan.</span>
                      </div>
                    ) : (
                      <>
                        <img
                          src={doc.fileUrl}
                          alt={doc.title}
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end justify-between p-2.5">
                          <button
                            onClick={() => onOpenDocViewer(doc.fileUrl, doc.title, doc)}
                            className="px-2.5 py-1 bg-slate-900/90 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 backdrop-blur border border-slate-700 shadow-md transition-all"
                          >
                            <Eye className="w-3.5 h-3.5 text-sky-400" />
                            Inspect Scan
                          </button>

                          {hasHistory && (
                            <button
                              onClick={() => setExpandedHistoryDocId(isHistoryOpen ? null : doc.id)}
                              className="px-2.5 py-1 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-[11px] font-medium flex items-center gap-1 backdrop-blur border border-slate-700"
                            >
                              <History className="w-3 h-3 text-amber-400" />
                              {doc.history.length} Prior Version{doc.history.length > 1 ? 's' : ''}
                              {isHistoryOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Version History Dropdown */}
                  {isHistoryOpen && hasHistory && (
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
                      <div className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
                        <History className="w-3 h-3" />
                        Previous Versions & Audit Record:
                      </div>
                      <div className="space-y-2 max-h-36 overflow-y-auto no-scrollbar">
                        {doc.history.map((ver, idx) => (
                          <div key={idx} className="p-2 bg-slate-900 rounded-lg border border-slate-800 text-[11px] space-y-1">
                            <div className="flex items-center justify-between text-slate-300 font-mono">
                              <span>v{ver.version} ({ver.fileName})</span>
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-semibold ${
                                ver.status === 'verified' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                              }`}>
                                {ver.status}
                              </span>
                            </div>
                            {ver.reviewerComment && (
                              <div className="text-slate-400 text-[10px]">Note: {ver.reviewerComment}</div>
                            )}
                            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                              <span>Uploaded: {new Date(ver.uploadedAt).toLocaleDateString()}</span>
                              <button
                                onClick={() => onOpenDocViewer(ver.fileUrl, `${doc.title} (v${ver.version})`)}
                                className="text-sky-400 hover:text-sky-300 underline"
                              >
                                View v{ver.version} Scan
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Action Footer */}
                <div className="p-3 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                  {canManage ? (
                    <div className="flex items-center justify-between w-full gap-2">
                      {/* Left actions: Remind / Reupload */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleSendReminder(doc)}
                          disabled={isActionLoading}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium border border-slate-700 flex items-center gap-1 transition-colors"
                          title="Send renewal reminder to driver via AT AI Voice / SMS"
                        >
                          <Send className="w-3 h-3 text-sky-400" />
                          <span>Remind</span>
                        </button>

                        <button
                          onClick={() => {
                            setUploadDocType(doc.docType);
                            setUploadTitle(doc.title);
                            setIsUploadModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium border border-slate-700 flex items-center gap-1 transition-colors"
                        >
                          <Upload className="w-3 h-3 text-emerald-400" />
                          <span>Replace</span>
                        </button>
                      </div>

                      {/* Right actions: Approve / Reject for Pending Review */}
                      {isPending ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setRejectModalDoc(doc)}
                            disabled={isActionLoading}
                            className="px-2.5 py-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5 text-rose-400" />
                            Reject...
                          </button>
                          <button
                            onClick={() => handleApproveDoc(doc)}
                            disabled={isActionLoading}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-md transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Verify ✓
                          </button>
                        </div>
                      ) : isRejected ? (
                        <button
                          onClick={() => handleApproveDoc(doc)}
                          disabled={isActionLoading}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium border border-slate-700 flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          Re-Approve
                        </button>
                      ) : (
                        <div className="text-[11px] text-emerald-400/80 font-mono flex items-center gap-1">
                          <Shield className="w-3 h-3 text-emerald-400" />
                          Active & Compliant
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full flex items-center justify-between text-slate-400 text-xs font-mono">
                      <span>Status: {isVerified ? 'VERIFIED' : isPending ? 'PENDING REVIEW' : 'REJECTED'}</span>
                      <span>Expiry: {doc.expiryDate || 'N/A'}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Driver Compliance Audit Trail */}
      {auditLogs.length > 0 && (
        <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              Immutable Compliance Audit Trail ({auditLogs.length})
            </h4>
            <span className="text-[10px] text-slate-500 font-mono">Append-Only Security Log</span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-2.5 bg-slate-950/70 rounded-xl border border-slate-800/80 text-xs flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{log.performedBy}</span>
                    <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono text-[10px]">
                      {log.role}
                    </span>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                      log.action === 'verify' ? 'bg-emerald-500/20 text-emerald-400' :
                      log.action === 'reject' ? 'bg-rose-500/20 text-rose-400' :
                      log.action === 'expired_auto_lock' ? 'bg-rose-900/50 text-rose-300' :
                      log.action === 'reminder_sent' ? 'bg-sky-500/20 text-sky-400' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {log.action}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">{log.details}</p>
                </div>
                <div className="text-right shrink-0 font-mono text-[10px] text-slate-500">
                  <div>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  <div>{new Date(log.timestamp).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 1: UPLOAD / RENEW DOCUMENT MODAL    */}
      {/* ========================================== */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-sky-500/10 rounded-xl text-sky-400">
                  <FilePlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Upload & Verify Driver Document</h3>
                  <p className="text-xs text-slate-400">{driver.fullName} • TLC: {driver.tlcLicenseNumber}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsUploadModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitUpload} className="space-y-4 text-xs">
              {/* Document Type Selector */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Document Category</label>
                <select
                  value={uploadDocType}
                  onChange={(e) => {
                    const type = e.target.value as ComplianceDocType;
                    setUploadDocType(type);
                    setUploadTitle(docTypeLabels[type]);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-medium focus:border-sky-500 focus:outline-none"
                >
                  <option value="tlc_license">NYC TLC For-Hire Driver License (Mandatory)</option>
                  <option value="driver_license">NYS DMV Driver's License (Mandatory)</option>
                  <option value="insurance">FHV Commercial Auto Liability Insurance (Mandatory)</option>
                  <option value="registration">NYC TLC Vehicle Registration (Mandatory)</option>
                  <option value="inspection">NYC TLC Vehicle Inspection (Mandatory)</option>
                  <option value="vehicle_photo">Vehicle Photo (Interior/Exterior)</option>
                  <option value="custom">Additional TLC / WAV / ADA Certificate</option>
                </select>
              </div>

              {/* Title / Description */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Document Title</label>
                <input
                  type="text"
                  value={uploadTitle || docTypeLabels[uploadDocType]}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-sky-500 focus:outline-none"
                  placeholder="e.g. American Transit Commercial FHV Policy"
                  required
                />
              </div>

              {/* Expiration Date & AI Scan Button */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                    <span>Expiration Date</span>
                    <span className="text-[10px] text-slate-500">YYYY-MM-DD</span>
                  </label>
                  <input
                    type="date"
                    value={uploadExpiryDate}
                    onChange={(e) => setUploadExpiryDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:border-sky-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">AI Assistant</label>
                  <button
                    type="button"
                    onClick={handleRunAiScan}
                    disabled={isScanningAI}
                    className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isScanningAI ? 'animate-spin' : ''}`} />
                    <span>{isScanningAI ? 'Scanning TLC Document...' : 'Gemini AI OCR Scan'}</span>
                  </button>
                </div>
              </div>

              {/* Sample / Quick File Attachment Selector */}
              <div className="space-y-2">
                <label className="block text-slate-300 font-semibold">Attach Document File (or Select Simulated Scan)</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {sampleDocOptions.map((opt, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setUploadFileUrl(opt.url);
                        setUploadFileName(opt.name);
                      }}
                      className={`p-2 rounded-xl border cursor-pointer text-left transition-all ${
                        uploadFileUrl === opt.url
                          ? 'bg-sky-500/15 border-sky-500 text-white shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <div className="text-[11px] font-semibold truncate">{opt.label}</div>
                      <div className="text-[9px] font-mono text-slate-500 truncate mt-0.5">{opt.name}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Direct Image/File URL Input if needed */}
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Direct File URL</label>
                <input
                  type="url"
                  value={uploadFileUrl}
                  onChange={(e) => setUploadFileUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-[11px] font-mono focus:border-sky-500 focus:outline-none"
                  placeholder="https://..."
                  required
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-lg shadow-sky-900/30"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploading ? 'Ingesting Document...' : 'Submit to Queue'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 2: REJECT DOCUMENT MODAL             */}
      {/* ========================================== */}
      {rejectModalDoc && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-800/80 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-500/20 rounded-xl text-rose-400">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Reject Document Submission</h3>
                <p className="text-xs text-slate-400">{rejectModalDoc.title}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              Provide a specific reason. Accessible Transit AI will automatically dispatch an SMS / notification to <strong className="text-white">{driver.fullName}</strong> requesting a clean re-upload.
            </p>

            {/* Quick Rejection Presets */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400">Rejection Presets:</label>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                {[
                  'Photo blurry / text illegible',
                  'Document has expired',
                  'Name does not match TLC profile',
                  'Missing official TLC inspection stamp'
                ].map((reason, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRejectComment(reason)}
                    className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-rose-700/60 text-slate-300 text-left truncate text-[10px]"
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1 text-xs">Reviewer Notes to Driver</label>
              <textarea
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-xs focus:border-rose-500 focus:outline-none"
                placeholder="Explain why the document was rejected..."
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
