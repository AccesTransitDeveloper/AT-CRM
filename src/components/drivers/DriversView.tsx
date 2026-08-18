import React, { useState } from 'react';
import { Driver, DriverStatus, VehicleType, QueensNeighborhood, UserRole, Order, Ticket } from '../../types';
import { 
  Users, Search, Filter, Plus, CheckCircle2, XCircle, AlertTriangle, 
  Car, Shield, Eye, Phone, Mail, MapPin, Award, FileText, ChevronRight,
  Clock, LayoutGrid, List, Sparkles, AlertCircle, Ban
} from 'lucide-react';
import { DriverDetailModal } from './DriverDetailModal';
import { useTranslation } from '../../lib/i18n';


interface DriversViewProps {
  drivers: Driver[];
  currentRole: UserRole;
  orders?: Order[];
  tickets?: Ticket[];
  onUpdateStatus: (id: string, status: DriverStatus, reason?: string) => Promise<void>;
  onCreateDriver: (driver: Partial<Driver>) => Promise<void>;
  onUpdateDriver: (id: string, updates: Partial<Driver>) => Promise<void>;
  onDeleteDriver: (id: string) => Promise<void>;
  onFetchTrips: (driverId: string) => Promise<any[]>;
  onOpenLandingPage?: (code: string) => void;
}

const statusStyleConfig: Record<DriverStatus, { bg: string; text: string; border: string }> = {
  applied: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  under_review: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  active: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  suspended: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
  rejected: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30' }
};

const vehicleTypes: VehicleType[] = ['Green', 'Go', 'Plus', 'XL', 'Black', 'Black XL', 'WAV'];
const neighborhoods: QueensNeighborhood[] = [
  'Jackson Heights', 
  'Jamaica', 
  'Flushing', 
  'Kensington', 
  'Astoria', 
  'Long Island City', 
  'Forest Hills', 
  'Woodside'
];

export const DriversView: React.FC<DriversViewProps> = ({
  drivers,
  currentRole,
  orders = [],
  tickets = [],
  onUpdateStatus,
  onCreateDriver,
  onUpdateDriver,
  onDeleteDriver,
  onFetchTrips,
  onOpenLandingPage
}) => {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [vehicleFilter, setVehicleFilter] = useState<string>('all');
  const [neighborhoodFilter, setNeighborhoodFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Modals & Selected Driver Drawer
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [driverTrips, setDriverTrips] = useState<any[]>([]);
  const [activeTabInDrawer, setActiveTabInDrawer] = useState<'details' | 'documents' | 'trips'>('details');
  const [inspectDocUrl, setInspectDocUrl] = useState<string | null>(null);

  const getStatusLabel = (status: DriverStatus) => {
    switch (status) {
      case 'applied': return t('drivers.statusApplied');
      case 'under_review': return t('drivers.statusUnderReview');
      case 'active': return t('drivers.statusActive');
      case 'suspended': return t('drivers.statusSuspended');
      case 'rejected': return t('drivers.statusRejected');
      default: return status;
    }
  };

  // New Driver Form State
  const [newDriver, setNewDriver] = useState<Partial<Driver>>({
    fullName: '',
    phone: '',
    email: '',
    tlcLicenseNumber: '',
    vehicleType: 'WAV',
    vehicleMakeModel: '',
    vehiclePlate: '',
    vehicleYear: 2023,
    isWheelchairAccessible: true,
    operatingBoroughs: ['Jackson Heights', 'Jamaica'],
    status: 'applied',
    notes: ''
  });

  // Filtered drivers
  const filteredDrivers = drivers.filter((d) => {
    if (statusFilter !== 'all' && d.status !== statusFilter) return false;
    if (vehicleFilter !== 'all' && d.vehicleType !== vehicleFilter) return false;
    if (neighborhoodFilter !== 'all' && !d.operatingBoroughs.includes(neighborhoodFilter)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        d.fullName.toLowerCase().includes(q) ||
        d.phone.includes(q) ||
        d.tlcLicenseNumber.toLowerCase().includes(q) ||
        d.vehiclePlate.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleOpenDriverDetails = async (driver: Driver) => {
    setSelectedDriver(driver);
    setActiveTabInDrawer('details');
    try {
      const trips = await onFetchTrips(driver.id);
      setDriverTrips(trips);
    } catch {
      setDriverTrips([]);
    }
  };

  const handleApprove = async (driverId: string) => {
    await onUpdateStatus(driverId, 'active');
    if (selectedDriver && selectedDriver.id === driverId) {
      setSelectedDriver({ ...selectedDriver, status: 'active' });
    }
  };

  const handleOpenReject = (driver: Driver) => {
    setSelectedDriver(driver);
    setRejectionReason('TLC License or Insurance document unverified / expired');
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedDriver) return;
    await onUpdateStatus(selectedDriver.id, 'rejected', rejectionReason);
    setSelectedDriver({ ...selectedDriver, status: 'rejected', rejectionReason });
    setIsRejectModalOpen(false);
  };

  const handleToggleSuspend = async (driver: Driver) => {
    const nextStatus = driver.status === 'suspended' ? 'active' : 'suspended';
    await onUpdateStatus(driver.id, nextStatus, nextStatus === 'suspended' ? 'Suspended by dispatch management' : undefined);
    if (selectedDriver && selectedDriver.id === driver.id) {
      setSelectedDriver({ ...selectedDriver, status: nextStatus });
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDriver.fullName || !newDriver.phone) return;
    await onCreateDriver({
      ...newDriver,
      isWheelchairAccessible: newDriver.vehicleType === 'WAV'
    });
    setIsAddModalOpen(false);
    setNewDriver({
      fullName: '',
      phone: '',
      email: '',
      tlcLicenseNumber: '',
      vehicleType: 'WAV',
      vehicleMakeModel: '',
      vehiclePlate: '',
      vehicleYear: 2023,
      isWheelchairAccessible: true,
      operatingBoroughs: ['Jackson Heights', 'Jamaica'],
      status: 'applied',
      notes: ''
    });
  };

  const kanbanColumns: DriverStatus[] = ['applied', 'under_review', 'active', 'suspended'];

  return (
    <div className="space-y-6">
      {/* Top Controls: Title, Search, Filters & View Toggle */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-white tracking-tight">{t('drivers.title')}</h2>
            <span className="px-2 py-0.5 text-xs bg-sky-500/20 text-sky-400 rounded-full font-medium border border-sky-500/30">
              {t('drivers.countBadge', { count: filteredDrivers.length })}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {t('drivers.subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Search */}
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t('drivers.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-800/90 text-white rounded-lg border border-slate-700 focus:outline-none focus:border-sky-500 placeholder-slate-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-800 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-sky-500"
          >
            <option value="all">{t('drivers.allStatuses')}</option>
            <option value="applied">{t('drivers.statusApplied')}</option>
            <option value="under_review">{t('drivers.statusUnderReview')}</option>
            <option value="active">{t('drivers.statusActive')}</option>
            <option value="suspended">{t('drivers.statusSuspended')}</option>
            <option value="rejected">{t('drivers.statusRejected')}</option>
          </select>

          {/* Vehicle Type Filter */}
          <select
            value={vehicleFilter}
            onChange={(e) => setVehicleFilter(e.target.value)}
            className="text-xs bg-slate-800 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-sky-500"
          >
            <option value="all">{t('drivers.allVehicleTypes')}</option>
            {vehicleTypes.map((tVal) => (
              <option key={tVal} value={tVal}>{tVal} {tVal === 'WAV' ? '♿' : ''}</option>
            ))}
          </select>

          {/* Neighborhood Filter */}
          <select
            value={neighborhoodFilter}
            onChange={(e) => setNeighborhoodFilter(e.target.value)}
            className="text-xs bg-slate-800 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-sky-500 hidden sm:block"
          >
            <option value="all">{t('drivers.allNeighborhoods')}</option>
            {neighborhoods.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded text-xs flex items-center gap-1 ${
                viewMode === 'table' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title={t('drivers.tableView')}
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded text-xs flex items-center gap-1 ${
                viewMode === 'kanban' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title={t('drivers.kanbanView')}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Add Driver Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm shadow-sky-600/30 transition-all ml-auto sm:ml-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('drivers.newDriver')}</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-slate-900/80 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700/60 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3.5">{t('drivers.thDriver')}</th>
                  <th className="px-4 py-3.5">{t('drivers.thLicense')}</th>
                  <th className="px-4 py-3.5">{t('drivers.thVehicle')}</th>
                  <th className="px-4 py-3.5">{t('drivers.thCoverage')}</th>
                  <th className="px-4 py-3.5">{t('drivers.thStatus')}</th>
                  <th className="px-4 py-3.5">{t('drivers.thRating')}</th>
                  <th className="px-4 py-3.5 text-right">{t('drivers.thActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredDrivers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-500">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      {t('drivers.noDriversFound')}
                    </td>
                  </tr>
                ) : (
                  filteredDrivers.map((driver) => {
                    const style = statusStyleConfig[driver.status];
                    const label = getStatusLabel(driver.status);
                    return (
                      <tr
                        key={driver.id}
                        onClick={() => handleOpenDriverDetails(driver)}
                        className="hover:bg-slate-800/50 cursor-pointer transition-colors group"
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-sky-400 border border-slate-700 text-xs">
                              {driver.fullName.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <div className="font-semibold text-white group-hover:text-sky-300 transition-colors flex items-center gap-1.5">
                                {driver.fullName}
                                {driver.isOnline && (
                                  <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-950" title="Online" />
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                                <span>{driver.phone}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="font-mono text-slate-200 font-medium">{driver.tlcLicenseNumber}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{t('drivers.plate')} {driver.vehiclePlate}</div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              driver.vehicleType === 'WAV' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' :
                              driver.vehicleType === 'Green' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                              driver.vehicleType.includes('Black') ? 'bg-slate-700 text-slate-200 border border-slate-600' :
                              'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                            }`}>
                              {driver.vehicleType} {driver.isWheelchairAccessible ? '♿ WAV' : ''}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[160px]">
                            {driver.vehicleMakeModel}
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="flex flex-wrap gap-1 max-w-[180px]">
                            {driver.operatingBoroughs.slice(0, 2).map((b) => (
                              <span key={b} className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px]">
                                {b}
                              </span>
                            ))}
                            {driver.operatingBoroughs.length > 2 && (
                              <span className="text-[10px] text-slate-400">+{driver.operatingBoroughs.length - 2}</span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${style.bg} ${style.text} ${style.border}`}>
                            {label}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="flex items-center text-amber-400 font-semibold text-xs gap-1">
                            <span>★</span> {driver.rating.toFixed(2)}
                          </div>
                          <div className="text-[11px] text-slate-400">{driver.totalTrips} {t('drivers.completedTrips')}</div>
                        </td>

                        <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {driver.status === 'applied' || driver.status === 'under_review' ? (
                              <>
                                <button
                                  onClick={() => handleApprove(driver.id)}
                                  className="px-2 py-1 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded text-[11px] font-medium transition-colors"
                                  title={t('drivers.approve')}
                                >
                                  {t('drivers.approve')}
                                </button>
                                <button
                                  onClick={() => handleOpenReject(driver)}
                                  className="px-2 py-1 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded text-[11px] font-medium border border-rose-500/30 transition-colors"
                                  title={t('drivers.reject')}
                                >
                                  {t('drivers.reject')}
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleOpenDriverDetails(driver)}
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: KANBAN ONBOARDING PIPELINE */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kanbanColumns.map((colStatus) => {
            const colDrivers = drivers.filter(d => d.status === colStatus);
            const style = statusStyleConfig[colStatus];
            const label = getStatusLabel(colStatus);

            return (
              <div key={colStatus} className="bg-slate-900/70 rounded-xl border border-slate-800 p-3.5 flex flex-col min-h-[500px]">
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <span className={`w-2 h-2 rounded-full ${style.text.replace('text-', 'bg-')}`} />
                    <span className="font-semibold text-xs text-white uppercase tracking-wider">{label}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    {colDrivers.length}
                  </span>
                </div>

                {/* Cards List */}
                <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                  {colDrivers.length === 0 ? (
                    <div className="text-center py-8 text-slate-600 text-xs border border-dashed border-slate-800 rounded-lg">
                      {t('drivers.noDriversFound')}
                    </div>
                  ) : (
                    colDrivers.map((driver) => (
                      <div
                        key={driver.id}
                        onClick={() => handleOpenDriverDetails(driver)}
                        className="bg-slate-800/90 hover:bg-slate-800 rounded-lg p-3 border border-slate-700/80 hover:border-sky-500/60 transition-all cursor-pointer shadow-md group"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-semibold text-white text-xs group-hover:text-sky-300">
                              {driver.fullName}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">{driver.tlcLicenseNumber}</div>
                          </div>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            driver.vehicleType === 'WAV' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-700 text-slate-300'
                          }`}>
                            {driver.vehicleType}
                          </span>
                        </div>

                        <div className="mt-2 text-[11px] text-slate-400 truncate">
                          {driver.vehicleMakeModel} ({driver.vehiclePlate})
                        </div>

                        <div className="mt-2 pt-2 border-t border-slate-700/50 flex items-center justify-between text-[10px] text-slate-400">
                          <span>{driver.operatingBoroughs[0]}</span>
                          <div className="flex items-center gap-1">
                            {colStatus === 'applied' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUpdateStatus(driver.id, 'under_review');
                                }}
                                className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 rounded border border-amber-500/30"
                              >
                                Review
                              </button>
                            )}
                            {colStatus === 'under_review' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApprove(driver.id);
                                }}
                                className="px-2 py-0.5 bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 rounded border border-emerald-500/30"
                              >
                                {t('drivers.approve')}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* EXPANDED DRIVER PROFILE & ANALYTICS MODAL */}
      {selectedDriver && (
        <DriverDetailModal
          driver={selectedDriver}
          currentRole={currentRole}
          orders={orders}
          tickets={tickets}
          onClose={() => setSelectedDriver(null)}
          onUpdateStatus={async (id, status, reason) => {
            await onUpdateStatus(id, status, reason);
            if (selectedDriver.id === id) {
              setSelectedDriver({ ...selectedDriver, status, rejectionReason: reason });
            }
          }}
          onUpdateDriver={async (id, updates) => {
            await onUpdateDriver(id, updates);
            if (selectedDriver.id === id) {
              setSelectedDriver({ ...selectedDriver, ...updates });
            }
          }}
          onOpenDocViewer={(url) => setInspectDocUrl(url)}
          onOpenLandingPage={onOpenLandingPage}
        />
      )}

      {/* DOCUMENT PREVIEW MODAL */}
      {inspectDocUrl && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4" onClick={() => setInspectDocUrl(null)}>
          <div className="bg-slate-900 p-2 rounded-2xl max-w-2xl w-full border border-slate-700" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-2 mb-2 text-xs font-semibold text-white">
              <span>TLC Document Inspector</span>
              <button onClick={() => setInspectDocUrl(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <img src={inspectDocUrl} alt="Inspection" className="w-full max-h-[70vh] object-contain rounded-lg" referrerPolicy="no-referrer" />
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {isRejectModalOpen && selectedDriver && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              {t('drivers.modalRejectTitle')}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {t('drivers.rejectPrompt')} ({selectedDriver.fullName})
            </p>

            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
              placeholder={t('drivers.rejectReasonPlaceholder')}
              className="w-full mt-3 p-3 bg-slate-800 text-white text-xs rounded-xl border border-slate-700 focus:outline-none focus:border-rose-500 placeholder-slate-500"
            />

            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => setIsRejectModalOpen(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg font-medium"
              >
                {t('drivers.cancel')}
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs rounded-lg font-semibold"
              >
                {t('drivers.confirmReject')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD DRIVER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Car className="w-5 h-5 text-sky-400" />
                {t('drivers.modalAddTitle')}
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-medium block mb-1">{t('drivers.fullName')} *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tariq Al-Mansoor"
                    value={newDriver.fullName}
                    onChange={(e) => setNewDriver({ ...newDriver, fullName: e.target.value })}
                    className="w-full p-2 bg-slate-800 text-white rounded-lg border border-slate-700 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-medium block mb-1">{t('drivers.phone')} *</label>
                  <input
                    type="text"
                    required
                    placeholder="+1 (718) 555-0142"
                    value={newDriver.phone}
                    onChange={(e) => setNewDriver({ ...newDriver, phone: e.target.value })}
                    className="w-full p-2 bg-slate-800 text-white rounded-lg border border-slate-700 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-medium block mb-1">{t('drivers.email')}</label>
                  <input
                    type="email"
                    placeholder="driver@gmail.com"
                    value={newDriver.email}
                    onChange={(e) => setNewDriver({ ...newDriver, email: e.target.value })}
                    className="w-full p-2 bg-slate-800 text-white rounded-lg border border-slate-700 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-medium block mb-1">{t('drivers.tlcLicense')} *</label>
                  <input
                    type="text"
                    required
                    placeholder="TLC-5829104"
                    value={newDriver.tlcLicenseNumber}
                    onChange={(e) => setNewDriver({ ...newDriver, tlcLicenseNumber: e.target.value })}
                    className="w-full p-2 bg-slate-800 text-white rounded-lg border border-slate-700 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 font-medium block mb-1">{t('drivers.vehicleType')}</label>
                  <select
                    value={newDriver.vehicleType}
                    onChange={(e) => setNewDriver({ ...newDriver, vehicleType: e.target.value as VehicleType })}
                    className="w-full p-2 bg-slate-800 text-white rounded-lg border border-slate-700 focus:outline-none focus:border-sky-500"
                  >
                    {vehicleTypes.map(tVal => (
                      <option key={tVal} value={tVal}>{tVal}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 font-medium block mb-1">{t('drivers.vehiclePlate')} *</label>
                  <input
                    type="text"
                    required
                    placeholder="T789211C"
                    value={newDriver.vehiclePlate}
                    onChange={(e) => setNewDriver({ ...newDriver, vehiclePlate: e.target.value })}
                    className="w-full p-2 bg-slate-800 text-white rounded-lg border border-slate-700 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-medium block mb-1">{t('drivers.vehicleYear')}</label>
                  <input
                    type="number"
                    value={newDriver.vehicleYear}
                    onChange={(e) => setNewDriver({ ...newDriver, vehicleYear: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-800 text-white rounded-lg border border-slate-700 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-medium block mb-1">{t('drivers.vehicleMakeModel')}</label>
                <input
                  type="text"
                  placeholder="e.g. 2023 Toyota Sienna WAV (BraunAbility Auto-Ramp)"
                  value={newDriver.vehicleMakeModel}
                  onChange={(e) => setNewDriver({ ...newDriver, vehicleMakeModel: e.target.value })}
                  className="w-full p-2 bg-slate-800 text-white rounded-lg border border-slate-700 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-medium block mb-1">{t('drivers.operatingNeighborhoods')}</label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {neighborhoods.map((n) => {
                    const isSelected = newDriver.operatingBoroughs?.includes(n);
                    return (
                      <button
                        type="button"
                        key={n}
                        onClick={() => {
                          const current = newDriver.operatingBoroughs || [];
                          if (isSelected) {
                            setNewDriver({ ...newDriver, operatingBoroughs: current.filter(item => item !== n) });
                          } else {
                            setNewDriver({ ...newDriver, operatingBoroughs: [...current, n] });
                          }
                        }}
                        className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors ${
                          isSelected ? 'bg-sky-600 text-white border-sky-500' : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  {t('drivers.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-semibold shadow-sm"
                >
                  {t('drivers.registerDriver')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
