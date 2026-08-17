import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, AlertTriangle, X, Download, HelpCircle } from 'lucide-react';
import { api } from '../../lib/api';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [csvText, setCsvText] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ importedCount: number; errors: string[] } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (file: File) => {
    setFileName(file.name);
    setErrorMsg(null);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvText(text);
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read CSV file');
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDownloadTemplate = () => {
    window.location.href = '/api/analytics/export-template';
  };

  const handleImport = async () => {
    if (!csvText.trim()) {
      setErrorMsg('Please upload a CSV file or paste CSV text');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setResult(null);

    try {
      const res = await api.importAppMetricsCsv(csvText);
      setResult(res);
      if (res.importedCount > 0) {
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to parse and import CSV data');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sampleQuickFill = () => {
    const sample = `app,date,installs,dau,registrations,first_actions,ad_spend,traffic_source
client_ios,2026-08-16,145,2680,118,84,520.00,Apple Search Ads (Queens Medical)
client_android,2026-08-16,102,1890,79,56,380.00,Google Ads UAC (Paratransit)
driver_android,2026-08-16,34,440,28,19,410.00,Google Search (TLC Base 15% Comm)
driver_ios,2026-08-16,24,290,18,12,260.00,Meta Facebook (Queens Driver Hub)`;
    setCsvText(sample);
    setFileName('sample_quick_fill.csv');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Import App Store & Console CSV Data</h3>
              <p className="text-xs text-slate-400">Upload metrics export from Google Play Console, App Store Connect, or Ads Manager</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Action bar: Template & Sample */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl text-xs text-slate-300">
            <div className="flex items-center space-x-2">
              <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Supports columns: <strong>app</strong>, <strong>date</strong>, <strong>installs</strong>, <strong>dau</strong>, <strong>registrations</strong>, <strong>first_actions</strong>, <strong>ad_spend</strong></span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={sampleQuickFill}
                className="px-2.5 py-1 text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-md transition-colors"
              >
                Insert Sample Data
              </button>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="flex items-center space-x-1 px-2.5 py-1 text-indigo-300 hover:text-white bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 rounded-md transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Template .csv</span>
              </button>
            </div>
          </div>

          {/* Drag and Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              isDragging 
                ? 'border-indigo-500 bg-indigo-500/10' 
                : 'border-slate-700 hover:border-slate-600 bg-slate-800/30 hover:bg-slate-800/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="p-3 bg-slate-800 rounded-full text-slate-400">
                <FileText className="w-6 h-6 text-indigo-400" />
              </div>
              <div className="text-sm font-medium text-slate-200">
                {fileName ? (
                  <span className="text-indigo-400 font-semibold">{fileName}</span>
                ) : (
                  <span>Click to choose file or drag & drop CSV here</span>
                )}
              </div>
              <p className="text-xs text-slate-500">Supports standard UTF-8 CSV from Play Console, App Store, or Meta Ads</p>
            </div>
          </div>

          {/* Text Area for Direct Edit / Paste */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Or Paste CSV Raw Text:
            </label>
            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="app,date,installs,dau,registrations,first_actions,ad_spend,traffic_source&#10;client_ios,2026-08-16,115,2450,92,68,480.00,Apple Search Ads"
              rows={6}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="flex items-center space-x-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Result Banner */}
          {result && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-2">
              <div className="flex items-center space-x-2 text-sm font-medium text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
                <span>Successfully imported {result.importedCount} metric records!</span>
              </div>
              {result.errors.length > 0 && (
                <div className="text-xs text-amber-400 space-y-1 mt-2">
                  <p className="font-semibold">Warnings ({result.errors.length}):</p>
                  <ul className="list-disc list-inside space-y-0.5 max-h-24 overflow-y-auto">
                    {result.errors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-slate-800 bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={isSubmitting || !csvText.trim()}
            className="flex items-center space-x-2 px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Processing CSV...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Parse & Ingest Metrics</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
