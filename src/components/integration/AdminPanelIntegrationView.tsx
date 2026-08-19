import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Activity, 
  ArrowRightLeft, 
  Database, 
  Lock, 
  Zap, 
  Server, 
  Sliders, 
  FileText, 
  Send,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Filter
} from 'lucide-react';
import { 
  IntegrationStatus, 
  IntegrationConfig, 
  SyncAuditLog, 
  FieldMappingDefinition 
} from '../../types';
import { api } from '../../lib/api';

interface AdminPanelIntegrationViewProps {
  onRefreshAll?: () => void;
}

export const AdminPanelIntegrationView: React.FC<AdminPanelIntegrationViewProps> = ({ onRefreshAll }) => {
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [config, setConfig] = useState<IntegrationConfig | null>(null);
  const [logs, setLogs] = useState<SyncAuditLog[]>([]);
  const [mappings, setMappings] = useState<FieldMappingDefinition[]>([]);
  
  const [activeTab, setActiveTab] = useState<'overview' | 'mappings' | 'logs' | 'webhook_test'>('overview');
  const [selectedLogType, setSelectedLogType] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Webhook Test Payload State
  const [webhookPayload, setWebhookPayload] = useState({
    event: 'order.status_updated',
    entity: 'order',
    data: {
      id: 'CLONE_ORD_10091',
      order_code: 'APP-NYC-10091',
      status: 'COMPLETED',
      passenger: { name: 'Elena Rostova', phone: '+1 (718) 555-1192' },
      completed_at: new Date().toISOString()
    }
  });

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const [statusRes, configRes, logsRes, mappingsRes] = await Promise.all([
        api.getIntegrationStatus(),
        api.getIntegrationConfig(),
        api.getIntegrationLogs(),
        api.getFieldMappings()
      ]);
      setStatus(statusRes);
      setConfig(configRes);
      setLogs(logsRes);
      setMappings(mappingsRes);
    } catch (err: any) {
      console.error('Failed to load integration data:', err);
      showToast('Failed to load integration status: ' + err.message, 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // 10s auto-refresh
    return () => clearInterval(interval);
  }, []);

  const handleSyncOrders = async () => {
    setActionLoading('orders');
    try {
      const res = await api.syncLiveOrders();
      showToast(res.message || 'Live orders polled successfully', 'success');
      await loadData();
      onRefreshAll?.();
    } catch (err: any) {
      showToast('Failed to poll orders: ' + err.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSyncDrivers = async () => {
    setActionLoading('drivers');
    try {
      const res = await api.syncDrivers();
      showToast(res.message || 'Driver profiles synchronized successfully', 'success');
      await loadData();
      onRefreshAll?.();
    } catch (err: any) {
      showToast('Failed to sync drivers: ' + err.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRefreshToken = async () => {
    setActionLoading('auth');
    try {
      const res = await api.refreshIntegrationAuth();
      showToast(res.message || 'JWT Token refreshed successfully', 'success');
      await loadData();
    } catch (err: any) {
      showToast('Token refresh failed: ' + err.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendWebhook = async () => {
    setActionLoading('webhook');
    try {
      const res = await api.sendIntegrationWebhook(webhookPayload);
      showToast(res.message || 'Webhook sent and ingested', 'success');
      await loadData();
      onRefreshAll?.();
    } catch (err: any) {
      showToast('Webhook ingestion failed: ' + err.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (st?: string) => {
    switch (st) {
      case 'connected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Live Connected (Authenticated)
          </span>
        );
      case 'refreshing':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-500/10 text-sky-400 border border-sky-500/30 rounded-full text-xs font-semibold">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            Renewing OAuth/JWT Token
          </span>
        );
      case 'degraded':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full text-xs font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" />
            Degraded (CRM Fallback Active)
          </span>
        );
      case 'unauthorized':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-full text-xs font-semibold">
            <Lock className="w-3.5 h-3.5" />
            Service Account Unauthorized
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-500/10 text-slate-400 border border-slate-500/30 rounded-full text-xs font-semibold">
            Offline Mode
          </span>
        );
    }
  };

  const filteredLogs = logs.filter(log => {
    if (selectedLogType === 'all') return true;
    return log.type === selectedLogType;
  });

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-xl border text-sm font-medium flex items-center gap-2 ${
          toastMessage.type === 'success' 
            ? 'bg-emerald-950 border-emerald-600 text-emerald-200' 
            : toastMessage.type === 'error'
            ? 'bg-rose-950 border-rose-600 text-rose-200'
            : 'bg-sky-950 border-sky-600 text-sky-200'
        }`}>
          {toastMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
          {toastMessage.text}
        </div>
      )}

      {/* Top Banner & Control Bar */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <Server className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl font-bold text-white tracking-tight">
                    AdminPanelClient Integration Gateway
                  </h1>
                  {getStatusBadge(status?.status)}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Unified REST API & OAuth/JWT integration layer between Accessible Transit CRM and Clone App Admin Panel
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleSyncOrders}
              disabled={actionLoading !== null}
              className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-2 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${actionLoading === 'orders' ? 'animate-spin' : ''}`} />
              Poll Live Orders (20s)
            </button>
            <button
              onClick={handleSyncDrivers}
              disabled={actionLoading !== null}
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-2 transition disabled:opacity-50"
            >
              <Database className={`w-3.5 h-3.5 ${actionLoading === 'drivers' ? 'animate-spin' : ''}`} />
              Sync Drivers (10m)
            </button>
            <button
              onClick={handleRefreshToken}
              disabled={actionLoading !== null}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-2 transition disabled:opacity-50"
            >
              <Lock className={`w-3.5 h-3.5 ${actionLoading === 'auth' ? 'animate-spin' : ''}`} />
              Refresh Token
            </button>
            <button
              onClick={loadData}
              disabled={isRefreshing}
              className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
              title="Refresh telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-purple-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Status Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80 text-xs">
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <div className="text-slate-400 flex items-center gap-1.5 font-medium">
              <Lock className="w-3.5 h-3.5 text-purple-400" />
              Service Account
            </div>
            <div className="text-sm font-semibold text-white mt-1">
              {config?.clientIdMasked || 'at_service_account_crm'}
            </div>
            <div className="text-[11px] text-emerald-400 font-mono mt-0.5">
              JWT Exp: {status?.auth.tokenExpiresInSeconds ? `${status.auth.tokenExpiresInSeconds}s` : 'Valid'}
            </div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <div className="text-slate-400 flex items-center gap-1.5 font-medium">
              <Activity className="w-3.5 h-3.5 text-sky-400" />
              Live Order Polling
            </div>
            <div className="text-sm font-semibold text-white mt-1">
              Every {status?.sync.pollIntervalSeconds || 20}s (Active)
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Synced: <span className="text-sky-400 font-semibold">{status?.sync.totalSyncedOrders || 0}</span> orders
            </div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <div className="text-slate-400 flex items-center gap-1.5 font-medium">
              <Database className="w-3.5 h-3.5 text-amber-400" />
              Driver Reconciliation
            </div>
            <div className="text-sm font-semibold text-white mt-1">
              Every {status?.sync.profileSyncIntervalMinutes || 10}m
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Synced: <span className="text-amber-400 font-semibold">{status?.sync.totalSyncedDrivers || 0}</span> profiles
            </div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <div className="text-slate-400 flex items-center gap-1.5 font-medium">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              Rate Limiter & Errors
            </div>
            <div className="text-sm font-semibold text-white mt-1">
              {status?.rateLimit.requestsLastMinute || 0} / {status?.rateLimit.maxPerMinute || 120} req/min
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Sync Faults: <span className={status?.sync.totalSyncErrors ? 'text-rose-400 font-semibold' : 'text-emerald-400'}>{status?.sync.totalSyncErrors || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'bg-purple-600 text-white'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Architecture & Config
        </button>
        <button
          onClick={() => setActiveTab('mappings')}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'mappings'
              ? 'bg-purple-600 text-white'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          Field Mappings & Source of Truth ({mappings.length})
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'logs'
              ? 'bg-purple-600 text-white'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          Sync & Auth Audit Logs ({logs.length})
        </button>
        <button
          onClick={() => setActiveTab('webhook_test')}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'webhook_test'
              ? 'bg-purple-600 text-white'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Send className="w-4 h-4" />
          Webhook Simulator
        </button>
      </div>

      {/* TAB 1: OVERVIEW & ARCHITECTURE */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Architecture Card */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-400" />
                Integration Architecture & Security Boundaries
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                All communications between Accessible Transit CRM and the Clone App Admin Panel are strictly routed through the standalone backend module <code className="text-purple-300 bg-slate-950 px-1.5 py-0.5 rounded">AdminPanelClient</code>. Frontend components never interact directly with external endpoints.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800 space-y-1">
                  <div className="font-semibold text-sky-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Automatic Token Lifecycle
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Auto-login at backend startup, JWT validation on every request, auto-refresh 60s before expiry with exponential backoff on transient faults.
                  </p>
                </div>

                <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800 space-y-1">
                  <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Conflict Resolution Rules
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Admin Panel is authoritative for driver phone/vehicle specs; CRM is authoritative for TLC compliance verification, AI risk assessments, and dispatch split.
                  </p>
                </div>

                <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800 space-y-1">
                  <div className="font-semibold text-amber-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Reverse Synchronization
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    When a CRM manager approves, suspends, or rejects a driver profile, changes are automatically pushed upstream to the Clone Admin Panel via REST.
                  </p>
                </div>

                <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800 space-y-1">
                  <div className="font-semibold text-purple-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Token-Safe Audit Trail
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Raw JWT and client secrets are never written to logs or sent to the browser. Telemetry logs track sync durations, HTTP status, and record counts.
                  </p>
                </div>
              </div>
            </div>

            {/* Connection Endpoints */}
            <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-5 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-sky-400" />
                Configured Integration Endpoints
              </h3>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between p-2.5 bg-slate-950/80 rounded-lg border border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-sky-500/20 text-sky-400 rounded text-[10px] font-bold">GET</span>
                    <span className="text-slate-300">/api/v1/drivers</span>
                  </div>
                  <span className="text-slate-400 text-[11px] font-sans">Full Driver Profile & Location Sync (10m)</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-950/80 rounded-lg border border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-sky-500/20 text-sky-400 rounded text-[10px] font-bold">GET</span>
                    <span className="text-slate-300">/api/v1/orders</span>
                  </div>
                  <span className="text-slate-400 text-[11px] font-sans">Live Active Orders Polling (20s)</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-950/80 rounded-lg border border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-[10px] font-bold">POST</span>
                    <span className="text-slate-300">/api/v1/drivers/:id/status</span>
                  </div>
                  <span className="text-slate-400 text-[11px] font-sans">Reverse Sync Status Update</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-950/80 rounded-lg border border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[10px] font-bold">POST</span>
                    <span className="text-slate-300">/api/integration/webhook</span>
                  </div>
                  <span className="text-slate-400 text-[11px] font-sans">Incoming Webhook Ingestion Hook</span>
                </div>
              </div>
            </div>
          </div>

          {/* Config Settings Panel */}
          <div className="space-y-6">
            <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-400" />
                Integration Parameters
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Target Base URL</label>
                  <div className="p-2 bg-slate-950 rounded border border-slate-800 font-mono text-purple-300 truncate">
                    {config?.baseUrl}
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Auth Scheme</label>
                  <div className="p-2 bg-slate-950 rounded border border-slate-800 font-mono text-slate-300">
                    {config?.authMode.toUpperCase()} (Client Credentials Grant)
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Service Account Client ID</label>
                  <div className="p-2 bg-slate-950 rounded border border-slate-800 font-mono text-slate-300">
                    {config?.clientIdMasked}
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Live Polling Rate</label>
                  <div className="p-2 bg-slate-950 rounded border border-slate-800 text-sky-400 font-semibold">
                    {config?.liveOrderPollIntervalMs ? `${config.liveOrderPollIntervalMs / 1000} seconds` : '20 seconds'}
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Driver Profile Sync Rate</label>
                  <div className="p-2 bg-slate-950 rounded border border-slate-800 text-amber-400 font-semibold">
                    {config?.driverProfileSyncIntervalMs ? `${config.driverProfileSyncIntervalMs / 60000} minutes` : '10 minutes'}
                  </div>
                </div>

                <div className="pt-2">
                  <div className="p-3 bg-purple-950/30 border border-purple-800/40 rounded-lg text-[11px] text-purple-300">
                    🔐 <strong>Security notice:</strong> Credentials are read exclusively from environment variables on the backend container.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FIELD MAPPINGS & SOURCE OF TRUTH */}
      {activeTab === 'mappings' && (
        <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-purple-400" />
                Data Model Mapping & Conflict Resolution Rules
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Defines exact translation between Clone App payload schema and Accessible Transit CRM entities
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Entity</th>
                  <th className="py-2.5 px-3">CRM Field</th>
                  <th className="py-2.5 px-3">External API Field</th>
                  <th className="py-2.5 px-3">Data Type</th>
                  <th className="py-2.5 px-3">Source of Truth</th>
                  <th className="py-2.5 px-3">Resolution Policy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {mappings.map((m, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-white">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        m.entity === 'Driver' ? 'bg-amber-500/20 text-amber-300' : 'bg-sky-500/20 text-sky-300'
                      }`}>
                        {m.entity}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-purple-300">{m.crmField}</td>
                    <td className="py-2.5 px-3 font-mono text-emerald-300">{m.externalField}</td>
                    <td className="py-2.5 px-3 text-slate-400">{m.dataType}</td>
                    <td className="py-2.5 px-3">
                      {m.sourceOfTruth === 'clone_admin_panel' ? (
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-[10px] font-semibold">
                          Clone Admin Panel
                        </span>
                      ) : m.sourceOfTruth === 'crm' ? (
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[10px] font-semibold">
                          AT CRM
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-[10px] font-semibold">
                          Bidirectional
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 text-[11px]">{m.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SYNC & AUTH AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-400" />
                Integration & Synchronization Audit Logs
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time log of token refreshes, polling cycles, webhook events, and error alerts
              </p>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedLogType}
                onChange={e => setSelectedLogType(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-purple-500"
              >
                <option value="all">All Events ({logs.length})</option>
                <option value="auth_token_issued">Token Issued</option>
                <option value="auth_token_refreshed">Token Refreshed</option>
                <option value="orders_poll">Orders Poll</option>
                <option value="driver_profile_sync">Driver Sync</option>
                <option value="reverse_sync">Reverse Sync</option>
                <option value="webhook_received">Webhooks</option>
                <option value="auth_error">Auth/API Errors</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Summary</th>
                  <th className="py-2.5 px-3">Details / Endpoint</th>
                  <th className="py-2.5 px-3">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-purple-300 whitespace-nowrap">
                      {log.type}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        log.status === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                        log.status === 'error' ? 'bg-rose-500/20 text-rose-400' :
                        log.status === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-sky-500/20 text-sky-400'
                      }`}>
                        {log.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-white">{log.summary}</td>
                    <td className="py-2.5 px-3 text-slate-400 max-w-md truncate">
                      {log.details || log.endpoint || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 font-mono">
                      {log.durationMs !== undefined ? `${log.durationMs}ms` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: WEBHOOK TESTER */}
      {activeTab === 'webhook_test' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-purple-400" />
              Simulate Incoming Webhook Event
            </h3>
            <p className="text-xs text-slate-300">
              Test how the CRM handles real-time webhooks sent when a rider completes a trip or updates location in the clone mobile app.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Event Type</label>
                <select
                  value={webhookPayload.event}
                  onChange={e => setWebhookPayload({ ...webhookPayload, event: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono"
                >
                  <option value="order.status_updated">order.status_updated</option>
                  <option value="order.created">order.created</option>
                  <option value="driver.location_updated">driver.location_updated</option>
                  <option value="driver.status_changed">driver.status_changed</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">JSON Payload</label>
                <textarea
                  rows={8}
                  value={JSON.stringify(webhookPayload, null, 2)}
                  onChange={e => {
                    try {
                      setWebhookPayload(JSON.parse(e.target.value));
                    } catch {}
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 font-mono text-emerald-400 text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <button
                onClick={handleSendWebhook}
                disabled={actionLoading !== null}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold text-xs transition flex items-center justify-center gap-2 shadow"
              >
                <Send className="w-3.5 h-3.5" />
                Send Webhook to CRM (/api/integration/webhook)
              </button>
            </div>
          </div>

          <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-sky-400" />
              Reverse Synchronization Verification
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              When a manager in Accessible Transit CRM updates a driver's verification status (e.g. from <strong>Applied</strong> to <strong>Active</strong>), the CRM automatically invokes:
            </p>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-purple-300">
              POST /api/v1/drivers/:id/status<br />
              Headers: Authorization: Bearer &lt;JWT&gt;<br />
              Body: &#123; "status": "active" &#125;
            </div>
            <p className="text-xs text-slate-400">
              Try changing a driver status in the <strong>Drivers & Vehicles</strong> view to observe the reverse sync entry in the Audit Log.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
