import React, { useState } from 'react';
import { Terminal, Key, Play, CheckCircle2, Copy, Bot, Smartphone, ExternalLink, ShieldCheck, RefreshCw, Server, Cpu } from 'lucide-react';
import { api } from '../../lib/api';
import { AdminPanelIntegrationView } from '../integration/AdminPanelIntegrationView';

interface ApiExplorerViewProps {
  onRefreshAll: () => void;
}

export const ApiExplorerView: React.FC<ApiExplorerViewProps> = ({ onRefreshAll }) => {
  const [hubMode, setHubMode] = useState<'admin_panel_client' | 'direct_api_sandbox'>('admin_panel_client');
  const [apiKey, setApiKey] = useState('at_live_sec_9941a87b41e9');
  const [copied, setCopied] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [responseLog, setResponseLog] = useState<any>(null);
  const [activeEndpointTab, setActiveEndpointTab] = useState<'orders' | 'drivers' | 'active'>('orders');

  // Interactive Test State for AT AI Agent Booking
  const [aiBookingPayload, setAiBookingPayload] = useState({
    passengerName: 'Rosa Morales (AT AI Voice Caller)',
    passengerPhone: '+1 (718) 555-4920',
    pickupAddress: '37-20 74th St, Jackson Heights, NY 11372',
    pickupNeighborhood: 'Jackson Heights',
    dropoffAddress: '82-68 164th St (Queens Hospital), Jamaica, NY 11432',
    dropoffNeighborhood: 'Jamaica',
    fareAmount: 52.00,
    vehicleType: 'WAV',
    requiresWav: true,
    source: 'at_ai',
    notes: 'Voice booked via AT AI Dispatcher Agent. Requested wheelchair ramp.'
  });

  // Interactive Test State for Driver Registration App
  const [driverAppPayload, setDriverAppPayload] = useState({
    fullName: 'Carlos Mendoza',
    phone: '+1 (347) 555-6671',
    email: 'carlos.mendoza@email.com',
    tlcLicenseNumber: 'TLC-6190823',
    vehicleType: 'WAV',
    vehicleMakeModel: '2024 Toyota Sienna WAV (BraunAbility)',
    vehiclePlate: 'T819200C',
    vehicleYear: 2024,
    operatingBoroughs: ['Jackson Heights', 'Flushing', 'Jamaica'],
    notes: 'Submitted via AT Driver iOS onboarding portal.'
  });

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTriggerAiOrder = async () => {
    setIsExecuting(true);
    try {
      const res = await api.simulateExternalOrder(aiBookingPayload, apiKey);
      setResponseLog({
        endpoint: 'POST /api/external/orders',
        statusCode: res.status,
        timestamp: new Date().toLocaleTimeString(),
        data: res.data
      });
      onRefreshAll();
    } catch (err: any) {
      setResponseLog({
        endpoint: 'POST /api/external/orders',
        statusCode: 500,
        timestamp: new Date().toLocaleTimeString(),
        error: err.message
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleTriggerDriverApplication = async () => {
    setIsExecuting(true);
    try {
      const res = await api.simulateExternalDriverApp(driverAppPayload, apiKey);
      setResponseLog({
        endpoint: 'POST /api/external/driver-applications',
        statusCode: res.status,
        timestamp: new Date().toLocaleTimeString(),
        data: res.data
      });
      onRefreshAll();
    } catch (err: any) {
      setResponseLog({
        endpoint: 'POST /api/external/driver-applications',
        statusCode: 500,
        timestamp: new Date().toLocaleTimeString(),
        error: err.message
      });
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Main Mode Selector */}
      <div className="flex items-center space-x-2 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 w-fit">
        <button
          onClick={() => setHubMode('admin_panel_client')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
            hubMode === 'admin_panel_client'
              ? 'bg-purple-600 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Server className="w-4 h-4 text-purple-300" />
          Clone App Integration (AdminPanelClient)
        </button>
        <button
          onClick={() => setHubMode('direct_api_sandbox')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
            hubMode === 'direct_api_sandbox'
              ? 'bg-purple-600 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Terminal className="w-4 h-4 text-sky-300" />
          Direct REST API Sandbox & Voice Bot Hook
        </button>
      </div>

      {hubMode === 'admin_panel_client' ? (
        <AdminPanelIntegrationView onRefreshAll={onRefreshAll} />
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-white tracking-tight">External REST API & AT AI Integration Hub</h2>
            <span className="px-2 py-0.5 text-xs bg-purple-500/20 text-purple-400 rounded-full font-medium border border-purple-500/30">
              Live Ingestion Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            API endpoints for AT AI Voice/Chat Dispatcher, Passenger/Driver Mobile App clones, and broker webhooks
          </p>
        </div>

        {/* API Key Box */}
        <div className="flex items-center space-x-2 bg-slate-800/90 px-3 py-1.5 rounded-lg border border-slate-700">
          <Key className="w-4 h-4 text-purple-400" />
          <div className="text-left">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Integration API Key</div>
            <div className="text-xs font-mono text-purple-300 font-bold">{apiKey}</div>
          </div>
          <button
            onClick={handleCopyKey}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-700 transition-colors ml-1"
            title="Copy API Key"
          >
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Integration Architecture Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center space-x-2 text-purple-400 font-bold mb-2">
            <Bot className="w-4 h-4" />
            <span>1. AT AI Voice/Chat Agent</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            When passengers call Accessible Transit dispatch, the AT AI agent parses speech, confirms Queens pickup/destination and WAV wheelchair requirements, and directly pushes bookings into this CRM.
          </p>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center space-x-2 text-sky-400 font-bold mb-2">
            <Smartphone className="w-4 h-4" />
            <span>2. Mobile Apps (Driver & Rider)</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            Driver onboarding portal registers new TLC license documents directly into the Driver Verification pipeline. Rider apps submit instant trips.
          </p>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center space-x-2 text-amber-400 font-bold mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span>3. Brokerage & 15% Margins</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            Broker channels (TripLink, MyLe) link paratransit orders, calculate automatic 15% AT commission margins, and track 3-stage dispatch confirmation.
          </p>
        </div>
      </div>

      {/* Interactive API Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Interactive Request Builder */}
        <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-5 shadow-xl flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-purple-400" />
              Interactive API Request Sandbox
            </h3>
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveEndpointTab('orders')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  activeEndpointTab === 'orders' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                AT AI Order Dispatch
              </button>
              <button
                onClick={() => setActiveEndpointTab('drivers')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  activeEndpointTab === 'drivers' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Driver Onboarding
              </button>
            </div>
          </div>

          {/* TAB 1: AT AI ORDER INGESTION */}
          {activeEndpointTab === 'orders' && (
            <div className="space-y-3.5 text-xs flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="font-mono text-purple-300 font-bold">POST /api/external/orders</span>
                  <span className="text-[10px] text-slate-500">Header: x-api-key: {apiKey.slice(0, 12)}...</span>
                </div>

                <div className="space-y-2 mt-2">
                  <div>
                    <label className="text-slate-400 text-[11px] block mb-0.5">Passenger Name (from AI Speech Recognition)</label>
                    <input
                      type="text"
                      value={aiBookingPayload.passengerName}
                      onChange={(e) => setAiBookingPayload({ ...aiBookingPayload, passengerName: e.target.value })}
                      className="w-full p-2 bg-slate-800 text-white rounded-lg border border-slate-700"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-400 text-[11px] block mb-0.5">Pickup (Queens)</label>
                      <input
                        type="text"
                        value={aiBookingPayload.pickupAddress}
                        onChange={(e) => setAiBookingPayload({ ...aiBookingPayload, pickupAddress: e.target.value })}
                        className="w-full p-2 bg-slate-800 text-white rounded-lg border border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 text-[11px] block mb-0.5">Dropoff (Hospital/Airport)</label>
                      <input
                        type="text"
                        value={aiBookingPayload.dropoffAddress}
                        onChange={(e) => setAiBookingPayload({ ...aiBookingPayload, dropoffAddress: e.target.value })}
                        className="w-full p-2 bg-slate-800 text-white rounded-lg border border-slate-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-400 text-[11px] block mb-0.5">Vehicle Type</label>
                      <select
                        value={aiBookingPayload.vehicleType}
                        onChange={(e) => setAiBookingPayload({ ...aiBookingPayload, vehicleType: e.target.value })}
                        className="w-full p-2 bg-slate-800 text-white rounded-lg border border-slate-700"
                      >
                        <option value="WAV">WAV ♿ (Auto-Ramp Wheelchair)</option>
                        <option value="Green">Green Taxi</option>
                        <option value="Go">Go Standard</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-400 text-[11px] block mb-0.5">Fare ($)</label>
                      <input
                        type="number"
                        value={aiBookingPayload.fareAmount}
                        onChange={(e) => setAiBookingPayload({ ...aiBookingPayload, fareAmount: Number(e.target.value) })}
                        className="w-full p-2 bg-slate-800 text-white rounded-lg border border-slate-700"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleTriggerAiOrder}
                disabled={isExecuting}
                className="w-full mt-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-950/50 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Execute POST & Ingest Order into CRM Queue</span>
              </button>
            </div>
          )}

          {/* TAB 2: DRIVER ONBOARDING INGESTION */}
          {activeEndpointTab === 'drivers' && (
            <div className="space-y-3.5 text-xs flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="font-mono text-purple-300 font-bold">POST /api/external/driver-applications</span>
                  <span className="text-[10px] text-slate-500">Header: x-api-key: {apiKey.slice(0, 12)}...</span>
                </div>

                <div className="space-y-2 mt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-400 text-[11px] block mb-0.5">Full Name</label>
                      <input
                        type="text"
                        value={driverAppPayload.fullName}
                        onChange={(e) => setDriverAppPayload({ ...driverAppPayload, fullName: e.target.value })}
                        className="w-full p-2 bg-slate-800 text-white rounded-lg border border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 text-[11px] block mb-0.5">Phone Number</label>
                      <input
                        type="text"
                        value={driverAppPayload.phone}
                        onChange={(e) => setDriverAppPayload({ ...driverAppPayload, phone: e.target.value })}
                        className="w-full p-2 bg-slate-800 text-white rounded-lg border border-slate-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-400 text-[11px] block mb-0.5">TLC License #</label>
                      <input
                        type="text"
                        value={driverAppPayload.tlcLicenseNumber}
                        onChange={(e) => setDriverAppPayload({ ...driverAppPayload, tlcLicenseNumber: e.target.value })}
                        className="w-full p-2 bg-slate-800 text-white rounded-lg border border-slate-700 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 text-[11px] block mb-0.5">Vehicle Plate</label>
                      <input
                        type="text"
                        value={driverAppPayload.vehiclePlate}
                        onChange={(e) => setDriverAppPayload({ ...driverAppPayload, vehiclePlate: e.target.value })}
                        className="w-full p-2 bg-slate-800 text-white rounded-lg border border-slate-700 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 text-[11px] block mb-0.5">Vehicle Make & Model</label>
                    <input
                      type="text"
                      value={driverAppPayload.vehicleMakeModel}
                      onChange={(e) => setDriverAppPayload({ ...driverAppPayload, vehicleMakeModel: e.target.value })}
                      className="w-full p-2 bg-slate-800 text-white rounded-lg border border-slate-700"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleTriggerDriverApplication}
                disabled={isExecuting}
                className="w-full mt-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-sky-950/50 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Execute POST & Submit Driver into Onboarding Pipeline</span>
              </button>
            </div>
          )}
        </div>

        {/* Right: Live API Response Inspector */}
        <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-5 shadow-xl flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Live Response Output</span>
              {responseLog && (
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  responseLog.statusCode === 201 || responseLog.statusCode === 200
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-rose-500/20 text-rose-300'
                }`}>
                  HTTP {responseLog.statusCode}
                </span>
              )}
            </h3>
            {responseLog && (
              <span className="text-[11px] text-slate-400 font-mono">{responseLog.timestamp}</span>
            )}
          </div>

          <div className="flex-1 bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-emerald-400 overflow-y-auto max-h-[360px]">
            {responseLog ? (
              <pre className="whitespace-pre-wrap">{JSON.stringify(responseLog, null, 2)}</pre>
            ) : (
              <div className="text-slate-600 text-center py-12">
                Click "Execute POST" on the left to test external integration with AT AI Dispatcher or Driver App.
              </div>
            )}
          </div>

          {/* cURL Snippet */}
          <div className="mt-4 pt-3 border-t border-slate-800 text-xs">
            <div className="text-slate-400 text-[11px] font-semibold mb-1">Production cURL Command for AT AI Voice Bot:</div>
            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[10px] text-slate-300 overflow-x-auto whitespace-pre">
{`curl -X POST https://api.accessibletransit.nyc/api/external/orders \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${apiKey}" \\
  -d '{"passengerName":"Carlos R.","pickupAddress":"37th Ave, Jackson Heights","dropoffAddress":"JFK Terminal 4","fareAmount":52.00,"vehicleType":"WAV"}'`}
            </div>
          </div>
        </div>
      </div>
        </div>
      )}
    </div>
  );
};
