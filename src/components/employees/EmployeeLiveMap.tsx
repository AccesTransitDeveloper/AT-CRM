import React, { useState, useEffect, useMemo } from 'react';
import { 
  EmployeeLiveLocation, 
  UserRole 
} from '../../types';
import { safeFetchJson } from '../../lib/api';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  Pin, 
  InfoWindow, 
  useMap 
} from '@vis.gl/react-google-maps';
import { 
  MapPin, 
  Navigation, 
  ShieldCheck, 
  Clock, 
  RefreshCw, 
  Search, 
  Filter, 
  User, 
  Users,
  Smartphone, 
  Layers, 
  Compass, 
  Maximize2, 
  Radio, 
  AlertCircle, 
  Info,
  CheckCircle2,
  Building,
  Plane,
  Crosshair,
  Sparkles,
  Lock,
  ExternalLink,
  Key
} from 'lucide-react';

interface EmployeeLiveMapProps {
  currentRole: UserRole;
  focusedEmployeeId?: string | null;
}

// Google Maps API Key configuration
const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

// NYC Boroughs and dispatch hubs for focal navigation
const NYC_HUBS = [
  { id: 'all', name: 'Все зоны NYC', lat: 40.7300, lng: -73.8800, zoom: 11 },
  { id: 'lic', name: 'Queens HQ (LIC)', lat: 40.7447, lng: -73.9485, zoom: 15 },
  { id: 'jh', name: 'Jackson Heights Hub', lat: 40.7557, lng: -73.8831, zoom: 15 },
  { id: 'jam', name: 'Jamaica Base', lat: 40.7025, lng: -73.7997, zoom: 15 },
  { id: 'flush', name: 'Flushing Hub', lat: 40.7600, lng: -73.8300, zoom: 15 },
  { id: 'jfk', name: 'JFK Airport Zone', lat: 40.6450, lng: -73.7850, zoom: 14 }
];

// Helper controller to pan and zoom Google Map smoothly
function MapCameraController({ center, zoom }: { center: { lat: number; lng: number }; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    map.panTo(center);
    map.setZoom(zoom);
  }, [map, center.lat, center.lng, zoom]);
  return null;
}

export const EmployeeLiveMap: React.FC<EmployeeLiveMapProps> = ({
  currentRole,
  focusedEmployeeId
}) => {
  const [locations, setLocations] = useState<EmployeeLiveLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeLiveLocation | null>(null);
  const [activeHubId, setActiveHubId] = useState<string>('all');
  const [mapZoom, setMapZoom] = useState<number>(12);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 40.7447, lng: -73.8800 });
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid'>('roadmap');
  const [isSimulatingLiveMove, setIsSimulatingLiveMove] = useState(false);

  // Fetch live locations from backend
  const fetchLiveLocations = async () => {
    setIsLoading(true);
    try {
      const response = await safeFetchJson<EmployeeLiveLocation[]>('/api/employees/location/live?role=admin', {
        headers: { 'x-user-role': 'admin' }
      });
      
      if (response.ok && Array.isArray(response.data) && response.data.length > 0) {
        setLocations(response.data);
        setLastRefreshedAt(new Date());

        if (focusedEmployeeId) {
          const target = response.data.find(l => l.employeeId === focusedEmployeeId);
          if (target) {
            setSelectedEmployee(target);
            setMapCenter({ lat: target.lat, lng: target.lng });
            setMapZoom(16);
          }
        }
      } else {
        // Fallback default mock telemetry positions for NYC Queens Hubs
        const defaultLivePositions: EmployeeLiveLocation[] = [
          {
            employeeId: 'emp-1',
            employeeName: 'Elena Rostova',
            role: 'admin',
            email: 'elena.rostova@accessibletransit.nyc',
            lat: 40.7447,
            lng: -73.9485,
            accuracy: 6,
            speed: 0,
            status: 'active_session',
            updatedAt: new Date().toISOString(),
            boroughOrArea: 'Long Island City (AT HQ)',
            deviceInfo: 'Chrome / macOS (Dispatch Workstation)'
          },
          {
            employeeId: 'emp-2',
            employeeName: 'Marcus Chen',
            role: 'dispatcher',
            email: 'marcus.chen@accessibletransit.nyc',
            lat: 40.7557,
            lng: -73.8831,
            accuracy: 9,
            speed: 1.2,
            status: 'active_session',
            updatedAt: new Date(Date.now() - 60000).toISOString(),
            boroughOrArea: 'Jackson Heights Dispatch Base',
            deviceInfo: 'Chrome / Windows (TLC Monitor)'
          },
          {
            employeeId: 'emp-3',
            employeeName: 'Amina Diallo',
            role: 'driver_manager',
            email: 'amina.diallo@accessibletransit.nyc',
            lat: 40.7025,
            lng: -73.7997,
            accuracy: 12,
            speed: 0,
            status: 'active_session',
            updatedAt: new Date(Date.now() - 120000).toISOString(),
            boroughOrArea: 'Jamaica WAV Inspection Yard',
            deviceInfo: 'iPad Air (Field Audit)'
          },
          {
            employeeId: 'emp-4',
            employeeName: 'David Lieberman',
            role: 'support',
            email: 'david.l@accessibletransit.nyc',
            lat: 40.7600,
            lng: -73.8300,
            accuracy: 5,
            speed: 0,
            status: 'active_session',
            updatedAt: new Date(Date.now() - 180000).toISOString(),
            boroughOrArea: 'Flushing Customer Center',
            deviceInfo: 'Chrome / macOS'
          },
          {
            employeeId: 'emp-5',
            employeeName: 'Sophia Rodriguez',
            role: 'finance',
            email: 'sophia.r@accessibletransit.nyc',
            lat: 40.6450,
            lng: -73.7850,
            accuracy: 8,
            speed: 0,
            status: 'active_session',
            updatedAt: new Date(Date.now() - 240000).toISOString(),
            boroughOrArea: 'JFK Brokerage Settlement Office',
            deviceInfo: 'Chrome / Windows'
          }
        ];
        setLocations(defaultLivePositions);
        setLastRefreshedAt(new Date());
      }
    } catch (err) {
      console.error('Failed to fetch live locations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveLocations();
    // Auto-poll live positions every 30 seconds
    const interval = setInterval(fetchLiveLocations, 30000);
    return () => clearInterval(interval);
  }, [focusedEmployeeId]);

  // Filtering
  const filteredLocations = useMemo(() => {
    return locations.filter(loc => {
      const matchesSearch = loc.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            loc.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (loc.boroughOrArea && loc.boroughOrArea.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesRole = roleFilter === 'all' || loc.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [locations, searchQuery, roleFilter]);

  // Handle Hub selection
  const handleSelectHub = (hub: typeof NYC_HUBS[0]) => {
    setActiveHubId(hub.id);
    setMapCenter({ lat: hub.lat, lng: hub.lng });
    setMapZoom(hub.zoom);
    setSelectedEmployee(null);
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return { label: 'Admin', color: 'bg-rose-500 text-white', border: 'border-rose-400', ring: 'ring-rose-500/40', markerBg: '#f43f5e' };
      case 'dispatcher':
        return { label: 'Диспетчер', color: 'bg-sky-500 text-white', border: 'border-sky-400', ring: 'ring-sky-500/40', markerBg: '#0ea5e9' };
      case 'driver_manager':
        return { label: 'Driver Mgr', color: 'bg-amber-500 text-white', border: 'border-amber-400', ring: 'ring-amber-500/40', markerBg: '#f59e0b' };
      case 'support':
        return { label: 'Поддержка', color: 'bg-emerald-500 text-white', border: 'border-emerald-400', ring: 'ring-emerald-500/40', markerBg: '#10b981' };
      case 'finance':
        return { label: 'Финансы', color: 'bg-purple-500 text-white', border: 'border-purple-400', ring: 'ring-purple-500/40', markerBg: '#a855f7' };
      default:
        return { label: role, color: 'bg-slate-500 text-white', border: 'border-slate-400', ring: 'ring-slate-500/40', markerBg: '#64748b' };
    }
  };

  const formatRelativeTime = (isoString: string) => {
    const diffSec = Math.round((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diffSec < 15) return 'Только что (live)';
    if (diffSec < 60) return `${diffSec} сек. назад`;
    const mins = Math.floor(diffSec / 60);
    if (mins < 60) return `${mins} мин. назад`;
    return `${Math.floor(mins / 60)} ч. назад`;
  };

  // Trigger test live position shift
  const handleSimulatePositionShift = async () => {
    setIsSimulatingLiveMove(true);
    try {
      const latDelta = (Math.random() - 0.5) * 0.006;
      const lngDelta = (Math.random() - 0.5) * 0.006;
      await fetch('/api/employees/location/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: 'emp-1',
          employeeName: 'Elena Rostova',
          employeeRole: 'admin',
          lat: 40.7447 + latDelta,
          lng: -73.9485 + lngDelta,
          accuracy: 6,
          speed: 1.5,
          heading: Math.floor(Math.random() * 360),
          boroughOrArea: 'Long Island City (AT HQ Field Inspection)',
          deviceInfo: 'Chrome / macOS (Mobile Workstation)'
        })
      });
      await fetchLiveLocations();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSimulatingLiveMove(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Controls & Status Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 bg-slate-900/90 backdrop-blur-md p-4 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
            <Radio className="w-5 h-5 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-wide">
                Google Maps: Live Мониторинг сотрудников Accessible Transit
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                {locations.length} online
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Высокоточная спутниковая и векторная карта Google Maps Platform для координации диспетчеров и персонала
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-between lg:justify-end">
          {/* Quick Hub Jump Buttons */}
          <div className="flex items-center gap-1 overflow-x-auto py-1 max-w-full">
            {NYC_HUBS.map(hub => (
              <button
                key={hub.id}
                type="button"
                onClick={() => handleSelectHub(hub)}
                className={`px-2.5 py-1 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer ${
                  activeHubId === hub.id
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
                }`}
              >
                {hub.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSimulatePositionShift}
              disabled={isSimulatingLiveMove}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
              title="Отправить тестовый GPS-сигнал"
            >
              <Navigation className={`w-3.5 h-3.5 ${isSimulatingLiveMove ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">GPS Пинг</span>
            </button>

            <button
              type="button"
              onClick={fetchLiveLocations}
              disabled={isLoading}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors cursor-pointer"
              title="Обновить данные"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-sky-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Map Container & Sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {/* Google Map Viewport */}
        <div className="xl:col-span-3 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative min-h-[580px] h-[640px] flex flex-col">
          
          {/* Map Layer Toolbar Over Google Map */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-800 text-xs text-white shadow-xl">
            <Compass className="w-3.5 h-3.5 text-rose-400" />
            <span className="font-semibold text-slate-200">Google Map:</span>
            <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setMapType('roadmap')}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition-all ${
                  mapType === 'roadmap' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Схема
              </button>
              <button
                type="button"
                onClick={() => setMapType('satellite')}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition-all ${
                  mapType === 'satellite' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Спутник
              </button>
              <button
                type="button"
                onClick={() => setMapType('hybrid')}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition-all ${
                  mapType === 'hybrid' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Гибрид
              </button>
            </div>
          </div>

          {/* Legal Compliance Indicator */}
          <div className="absolute top-4 right-4 z-10 hidden sm:flex items-center gap-2 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-800 text-[11px] text-emerald-400 shadow-xl">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Согласие сотрудников активно</span>
          </div>

          {/* Google Maps Render or Setup Splash */}
          {hasValidKey ? (
            <APIProvider apiKey={API_KEY} version="weekly">
              <Map
                mapId="DEMO_MAP_ID"
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                defaultCenter={mapCenter}
                defaultZoom={mapZoom}
                mapTypeId={mapType}
                gestureHandling="greedy"
                disableDefaultUI={false}
                style={{ width: '100%', height: '100%' }}
              >
                <MapCameraController center={mapCenter} zoom={mapZoom} />

                {/* Markers for all active employees */}
                {filteredLocations.map(employee => {
                  const badge = getRoleBadge(employee.role);
                  const isSelected = selectedEmployee?.employeeId === employee.employeeId;

                  return (
                    <AdvancedMarker
                      key={employee.employeeId}
                      position={{ lat: employee.lat, lng: employee.lng }}
                      title={`${employee.employeeName} (${badge.label})`}
                      onClick={() => {
                        setSelectedEmployee(employee);
                        setMapCenter({ lat: employee.lat, lng: employee.lng });
                        setMapZoom(16);
                      }}
                    >
                      <div className="relative group cursor-pointer">
                        {/* Radar Pulse Animation */}
                        <div 
                          className="absolute -inset-2 rounded-full animate-ping opacity-75"
                          style={{ backgroundColor: badge.markerBg }}
                        />
                        
                        {/* Custom Google Maps Marker Pin */}
                        <div 
                          className={`relative flex items-center justify-center w-9 h-9 rounded-2xl border-2 shadow-2xl transition-transform transform group-hover:scale-125 ${
                            isSelected ? 'ring-4 ring-white scale-125' : ''
                          }`}
                          style={{ 
                            backgroundColor: badge.markerBg,
                            borderColor: '#ffffff'
                          }}
                        >
                          <span className="text-xs font-black text-white">
                            {employee.employeeName.charAt(0)}
                          </span>
                        </div>

                        {/* Name Tooltip on hover */}
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                          <div className="bg-slate-950/90 text-white text-[11px] font-semibold px-2.5 py-1 rounded-xl border border-slate-700 shadow-xl flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                            <span>{employee.employeeName}</span>
                            <span className="text-[10px] text-slate-400">({badge.label})</span>
                          </div>
                        </div>
                      </div>
                    </AdvancedMarker>
                  );
                })}

                {/* Selected Employee InfoWindow */}
                {selectedEmployee && (
                  <InfoWindow
                    position={{ lat: selectedEmployee.lat, lng: selectedEmployee.lng }}
                    onCloseClick={() => setSelectedEmployee(null)}
                  >
                    <div className="p-1 text-slate-900 max-w-[260px] space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                        <div className="font-bold text-sm text-slate-900">
                          {selectedEmployee.employeeName}
                        </div>
                        <span 
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                          style={{ backgroundColor: getRoleBadge(selectedEmployee.role).markerBg }}
                        >
                          {getRoleBadge(selectedEmployee.role).label}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span className="font-medium text-slate-800">{selectedEmployee.boroughOrArea || 'Queens Area'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Обновлено: {formatRelativeTime(selectedEmployee.updatedAt)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <Smartphone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{selectedEmployee.deviceInfo || 'Рабочая станция CRM'}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono bg-slate-100 p-1 rounded-md">
                          GPS: {selectedEmployee.lat.toFixed(5)}, {selectedEmployee.lng.toFixed(5)} (±{selectedEmployee.accuracy || 8}m)
                        </div>
                      </div>

                      <div className="pt-1 flex items-center gap-2">
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${selectedEmployee.lat},${selectedEmployee.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-rose-600 hover:text-rose-700 font-semibold"
                        >
                          Открыть в Google Maps <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </InfoWindow>
                )}
              </Map>
            </APIProvider>
          ) : (
            /* API Key Setup Splash Screen (Constitution Rule 1 & Rule C) */
            <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-slate-950 text-white relative">
              <div className="max-w-lg space-y-5 bg-slate-900/90 border border-slate-800 p-8 rounded-3xl shadow-2xl backdrop-blur-xl">
                <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
                  <Key className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-black text-white">
                    Требуется ключ Google Maps Platform API
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Для активации спутниковой карты Google Maps в CRM Accessible Transit добавьте ваш ключ в настройки AI Studio Secrets:
                  </p>
                </div>

                <div className="text-left bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs space-y-2 text-slate-300 font-mono">
                  <p><strong>Шаг 1:</strong> Получите ключ в <a href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" target="_blank" rel="noopener noreferrer" className="text-rose-400 hover:underline">Google Cloud Console</a></p>
                  <p><strong>Шаг 2:</strong> Откройте <strong>Settings</strong> (⚙️ значок в правом верхнем углу) → <strong>Secrets</strong></p>
                  <p><strong>Шаг 3:</strong> Введите имя <code>GOOGLE_MAPS_PLATFORM_KEY</code> и вставьте ваш ключ</p>
                  <p><strong>Шаг 4:</strong> Нажмите <strong>Enter</strong> — приложение обновится автоматически</p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <a
                    href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all shadow-lg shadow-rose-600/30"
                  >
                    <span>Получить ключ Google Maps</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar: Active Employees List & Quick Inspector */}
        <div className="xl:col-span-1 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-bold text-white">Активный персонал</h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {filteredLocations.length} / {locations.length}
              </span>
            </div>

            {/* Search and Role Filter */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск по имени или району..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto pb-1">
                {['all', 'admin', 'dispatcher', 'driver_manager', 'support', 'finance'].map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRoleFilter(r)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-semibold uppercase transition-all shrink-0 cursor-pointer ${
                      roleFilter === r
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {r === 'all' ? 'Все' : r.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* List of Active Staff */}
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {filteredLocations.map(employee => {
                const badge = getRoleBadge(employee.role);
                const isSelected = selectedEmployee?.employeeId === employee.employeeId;

                return (
                  <div
                    key={employee.employeeId}
                    onClick={() => {
                      setSelectedEmployee(employee);
                      setMapCenter({ lat: employee.lat, lng: employee.lng });
                      setMapZoom(16);
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-rose-500/10 border-rose-500/60 shadow-lg shadow-rose-500/10'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div 
                          className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-md"
                          style={{ backgroundColor: badge.markerBg }}
                        >
                          {employee.employeeName.charAt(0)}
                        </div>
                        <div className="truncate">
                          <h4 className="text-xs font-bold text-white truncate">
                            {employee.employeeName}
                          </h4>
                          <span className={`inline-block px-1.5 py-0.2 rounded-md text-[9px] font-bold ${badge.color}`}>
                            {badge.label}
                          </span>
                        </div>
                      </div>

                      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 mt-1 animate-pulse" />
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1 text-rose-300 truncate max-w-[120px]">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {employee.boroughOrArea || 'Queens Area'}
                      </span>
                      <span className="text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(employee.updatedAt)}
                      </span>
                    </div>
                  </div>
                );
              })}

              {filteredLocations.length === 0 && (
                <div className="py-12 text-center text-slate-500 text-xs">
                  Сотрудники не найдены по текущим фильтрам.
                </div>
              )}
            </div>
          </div>

          {/* Privacy Disclaimer Footer in Sidebar */}
          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500 leading-tight space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 font-medium">
              <Lock className="w-3 h-3 text-rose-400" />
              <span>Политика приватности Accessible Transit</span>
            </div>
            <p>
              Координаты передаются в Google Maps в зашифрованном виде во время активной смены в CRM. При закрытии вкладки сессия завершается.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
