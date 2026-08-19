import React, { useState, useEffect } from 'react';
import { Order, Driver, Broker, OrderStatus, OrderType, OrderSource, BrokerConfirmationStatus, VehicleType, QueensNeighborhood, UserRole } from '../../types';
import { 
  Navigation as NavIcon, Search, Filter, Plus, Clock, Car, CheckCircle2, 
  XCircle, AlertCircle, Building2, User, Phone, MapPin, DollarSign, 
  Sparkles, ArrowRight, ShieldCheck, ChevronRight, UserCheck, Bot,
  Download, FileSpreadsheet, Check, PhoneCall, PhoneOff, PhoneForwarded, Radio, Send,
  Lock, Edit3, Save, Calculator
} from 'lucide-react';
import { downloadTlcCsv, TLC_BASE_NUMBER } from '../../lib/tlcExport';
import { calculateMtaPaymentBreakdown, canViewMtaCommissionAndPayout, canEditMtaFinancials, downloadMtaFinancialCsv } from '../../lib/mtaPayment';
import { ProximityCallModal } from './ProximityCallModal';
import { OrdersCharts } from './OrdersCharts';

interface OrdersViewProps {
  orders: Order[];
  drivers: Driver[];
  brokers: Broker[];
  currentRole: UserRole;
  onCreateOrder: (order: Partial<Order>) => Promise<void>;
  onUpdateStatus: (orderId: string, status: OrderStatus, brokerStatus?: BrokerConfirmationStatus) => Promise<void>;
  onAssignDriver: (orderId: string, driverId: string) => Promise<void>;
  onDeleteOrder: (orderId: string) => Promise<void>;
  onUpdateOrder?: (orderId: string, updates: Partial<Order>) => Promise<Order | null>;
}

const statusConfig: Record<OrderStatus, { label: string; bg: string; text: string; border: string }> = {
  created: { label: 'Created (В очереди)', bg: 'bg-slate-500/10', text: 'text-slate-300', border: 'border-slate-500/30' },
  driver_assigned: { label: 'Driver Assigned (Назначен)', bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/30' },
  en_route: { label: 'En Route (В пути к клиенту)', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  on_trip: { label: 'On Trip (В поездке)', bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30' },
  completed: { label: 'Completed (Завершён)', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  cancelled: { label: 'Cancelled (Отменён)', bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' }
};

const brokerStatusConfig: Record<BrokerConfirmationStatus, { label: string; bg: string; text: string }> = {
  finding_driver: { label: '1. Finding Driver (Поиск)', bg: 'bg-amber-500/20', text: 'text-amber-300' },
  sent_to_broker: { label: '2. Sent to Broker (Отправлен)', bg: 'bg-sky-500/20', text: 'text-sky-300' },
  confirmed: { label: '3. Confirmed by Broker (Подтверждён)', bg: 'bg-emerald-500/20', text: 'text-emerald-300' }
};

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

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  drivers,
  brokers,
  currentRole,
  onCreateOrder,
  onUpdateStatus,
  onAssignDriver,
  onDeleteOrder,
  onUpdateOrder
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [neighborhoodFilter, setNeighborhoodFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Selected Order Drawer & Modals
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isProximityModalOpen, setIsProximityModalOpen] = useState(false);
  const [proximityTargetOrderId, setProximityTargetOrderId] = useState<string | null>(null);

  // Financial Edit State in Drawer
  const [editRate, setEditRate] = useState<number>(0);
  const [editCopay, setEditCopay] = useState<number>(0);
  const [isEditingFinancials, setIsEditingFinancials] = useState<boolean>(false);
  const [isSavingFinancials, setIsSavingFinancials] = useState<boolean>(false);

  // Sync selectedOrder to edit fields
  useEffect(() => {
    if (selectedOrder) {
      const initialRate = selectedOrder.rate ?? (selectedOrder.fareAmount - (selectedOrder.copay || 0));
      const initialCopay = selectedOrder.copay ?? 0;
      setEditRate(initialRate > 0 ? initialRate : selectedOrder.fareAmount);
      setEditCopay(initialCopay);
      setIsEditingFinancials(false);
    }
  }, [selectedOrder]);

  // Export Official TLC FHV Trip Record CSV
  const handleExportTlcCsv = () => {
    const targetOrders = filteredOrders.length > 0 ? filteredOrders : orders;
    const { filename, count } = downloadTlcCsv(targetOrders, drivers);
    setExportNotice(`Exported ${count} TLC trip records to ${filename}`);
    setTimeout(() => setExportNotice(null), 4000);
  };

  // Export MTA 5-Column Financials Breakdown CSV
  const handleExportMtaFinancialCsv = () => {
    const targetOrders = filteredOrders.length > 0 ? filteredOrders : orders;
    const { filename, count } = downloadMtaFinancialCsv(targetOrders);
    setExportNotice(`Exported ${count} MTA financial records to ${filename}`);
    setTimeout(() => setExportNotice(null), 4000);
  };

  // New Order Form State
  const initialBroker = brokers[0];
  const [newOrder, setNewOrder] = useState<Partial<Order>>({
    passengerName: '',
    passengerPhone: '',
    pickupAddress: '',
    pickupNeighborhood: 'Jackson Heights',
    dropoffAddress: '',
    dropoffNeighborhood: 'Jamaica',
    rate: 45.00,
    copay: initialBroker?.defaultCopay ?? 5.00,
    fareAmount: 50.00,
    vehicleType: 'WAV',
    requiresWav: true,
    type: 'mta_broker',
    source: 'broker',
    brokerId: initialBroker?.id || 'brk-01',
    brokerName: initialBroker?.name || 'TripLink Mobility (MTA Paratransit)',
    driverId: '',
    specialAssistanceNotes: 'Wheelchair passenger, door-to-door boarding assist required.'
  });

  // Calculate live breakdown for new order form
  const newOrderBreakdown = calculateMtaPaymentBreakdown(
    Number(newOrder.rate) || 0,
    Number(newOrder.copay) || 0
  );

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (typeFilter !== 'all' && o.type !== typeFilter) return false;
    if (sourceFilter !== 'all' && o.source !== sourceFilter) return false;
    if (neighborhoodFilter !== 'all') {
      const matchPick = o.pickupNeighborhood.toLowerCase().includes(neighborhoodFilter.toLowerCase());
      const matchDrop = o.dropoffNeighborhood.toLowerCase().includes(neighborhoodFilter.toLowerCase());
      if (!matchPick && !matchDrop) return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        o.orderNumber.toLowerCase().includes(q) ||
        o.passengerName.toLowerCase().includes(q) ||
        (o.driverName && o.driverName.toLowerCase().includes(q)) ||
        o.pickupAddress.toLowerCase().includes(q) ||
        o.dropoffAddress.toLowerCase().includes(q) ||
        (o.brokerName && o.brokerName.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  // Active online drivers for nearest assignment
  const availableDrivers = drivers.filter(d => d.status === 'active');

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrder.passengerName || !newOrder.pickupAddress || !newOrder.dropoffAddress) return;

    let brokerName = undefined;
    if (newOrder.type === 'mta_broker' && newOrder.brokerId) {
      const b = brokers.find(item => item.id === newOrder.brokerId);
      if (b) brokerName = b.name;
    }

    let driverName = undefined;
    let driverPhone = undefined;
    if (newOrder.driverId) {
      const d = drivers.find(item => item.id === newOrder.driverId);
      if (d) {
        driverName = d.fullName;
        driverPhone = d.phone;
      }
    }

    const calculated = calculateMtaPaymentBreakdown(
      Number(newOrder.rate) || 0,
      Number(newOrder.copay) || 0
    );

    await onCreateOrder({
      ...newOrder,
      brokerName,
      driverName,
      driverPhone,
      rate: calculated.rate,
      copay: calculated.copay,
      fareAmount: calculated.totalFare,
      atCommissionRate: 0.15,
      atCommissionAmount: calculated.atCommission15Pct,
      driverPayout: calculated.driverPayout,
      requiresWav: newOrder.vehicleType === 'WAV' || Boolean(newOrder.requiresWav)
    });

    setIsCreateModalOpen(false);
    setNewOrder({
      passengerName: '',
      passengerPhone: '',
      pickupAddress: '',
      pickupNeighborhood: 'Jackson Heights',
      dropoffAddress: '',
      dropoffNeighborhood: 'Jamaica',
      rate: 45.00,
      copay: initialBroker?.defaultCopay ?? 5.00,
      fareAmount: 50.00,
      vehicleType: 'WAV',
      requiresWav: true,
      type: 'mta_broker',
      source: 'broker',
      brokerId: brokers[0]?.id || 'brk-01',
      brokerName: brokers[0]?.name || 'TripLink Mobility (MTA Paratransit)',
      driverId: '',
      specialAssistanceNotes: ''
    });
  };

  const handleSaveOrderFinancials = async () => {
    if (!selectedOrder) return;
    setIsSavingFinancials(true);
    try {
      const updatedFinancials = calculateMtaPaymentBreakdown(editRate, editCopay);
      const updates: Partial<Order> = {
        rate: updatedFinancials.rate,
        copay: updatedFinancials.copay,
        fareAmount: updatedFinancials.totalFare,
        atCommissionAmount: updatedFinancials.atCommission15Pct,
        driverPayout: updatedFinancials.driverPayout
      };

      if (onUpdateOrder) {
        const res = await onUpdateOrder(selectedOrder.id, updates);
        if (res) {
          setSelectedOrder(res);
        } else {
          setSelectedOrder({ ...selectedOrder, ...updates });
        }
      } else {
        setSelectedOrder({ ...selectedOrder, ...updates });
      }
      setIsEditingFinancials(false);
    } finally {
      setIsSavingFinancials(false);
    }
  };

  const handleQuickStatusChange = async (order: Order, nextStatus: OrderStatus) => {
    let nextBrokerStatus = order.brokerConfirmationStatus;
    if (order.type === 'mta_broker') {
      if (nextStatus === 'driver_assigned' || nextStatus === 'en_route') {
        nextBrokerStatus = 'sent_to_broker';
      } else if (nextStatus === 'on_trip' || nextStatus === 'completed') {
        nextBrokerStatus = 'confirmed';
      }
    }
    await onUpdateStatus(order.id, nextStatus, nextBrokerStatus);
    if (selectedOrder && selectedOrder.id === order.id) {
      setSelectedOrder({
        ...selectedOrder,
        status: nextStatus,
        brokerConfirmationStatus: nextBrokerStatus
      });
    }
  };

  const handleBrokerStatusChange = async (order: Order, brokerStatus: BrokerConfirmationStatus) => {
    await onUpdateStatus(order.id, order.status, brokerStatus);
    if (selectedOrder && selectedOrder.id === order.id) {
      setSelectedOrder({
        ...selectedOrder,
        brokerConfirmationStatus: brokerStatus
      });
    }
  };

  const handleAssignDriverSubmit = async (driverId: string) => {
    if (!selectedOrder) return;
    await onAssignDriver(selectedOrder.id, driverId);
    const assignedDriver = drivers.find(d => d.id === driverId);
    setSelectedOrder({
      ...selectedOrder,
      driverId,
      driverName: assignedDriver?.fullName,
      driverPhone: assignedDriver?.phone,
      status: selectedOrder.status === 'created' ? 'driver_assigned' : selectedOrder.status,
      brokerConfirmationStatus: selectedOrder.type === 'mta_broker' ? 'sent_to_broker' : undefined
    });
    setIsAssignModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Orders & Paratransit Dispatch</h2>
            <span className="px-2 py-0.5 text-xs bg-sky-500/20 text-sky-400 rounded-full font-medium border border-sky-500/30">
              {filteredOrders.length} Orders
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time Queens queue, MTA Broker confirmations, AT AI Voice orders & 15% commission ledger
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Search */}
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search order #, passenger, address..."
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
            <option value="all">All Statuses</option>
            <option value="created">Created (В очереди)</option>
            <option value="driver_assigned">Driver Assigned (Назначен)</option>
            <option value="en_route">En Route (В пути)</option>
            <option value="on_trip">On Trip (В поездке)</option>
            <option value="completed">Completed (Завершён)</option>
            <option value="cancelled">Cancelled (Отменён)</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs bg-slate-800 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-sky-500"
          >
            <option value="all">All Order Types</option>
            <option value="mta_broker">MTA Broker (Брокерские)</option>
            <option value="standard">Standard Direct (Прямые)</option>
          </select>

          {/* Source Filter */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="text-xs bg-slate-800 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-sky-500 hidden sm:block"
          >
            <option value="all">All Sources</option>
            <option value="broker">Brokers (TripLink, MyLe)</option>
            <option value="at_ai">AT AI Voice Agent</option>
            <option value="app">Mobile App</option>
          </select>

          {/* MTA Proximity Auto-Call (Twilio & Telegram) Button */}
          <button
            id="btn-mta-auto-call"
            type="button"
            onClick={() => {
              setProximityTargetOrderId(null);
              setIsProximityModalOpen(true);
            }}
            className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 hover:text-amber-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 border border-amber-500/40 shadow-sm transition-all"
            title="Автозвонок пассажиру через Twilio при приближении водителя & Алерт в Telegram"
          >
            <PhoneCall className="w-3.5 h-3.5 text-amber-400" />
            <span>Автодозвон MTA (0.3 mi)</span>
          </button>

          {/* Export MTA 5-Column Financials CSV */}
          <button
            id="btn-export-mta-financial-csv"
            type="button"
            onClick={handleExportMtaFinancialCsv}
            className="px-3.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 hover:text-emerald-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 border border-emerald-500/30 shadow-sm transition-all"
            title="Download MTA Financials Breakdown CSV (Rate | Copay | Total Fare | AT Comm | Driver Payout)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>MTA Financials CSV</span>
          </button>

          {/* Export Official TLC FHV CSV Button */}
          <button
            id="btn-export-tlc-csv"
            type="button"
            onClick={handleExportTlcCsv}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 border border-slate-700 hover:border-slate-600 shadow-sm transition-all"
            title="Download Official NYC TLC FHV Trip Record CSV (Base B03669)"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>Export TLC CSV</span>
          </button>

          {/* Create MTA / Direct Order Button */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm shadow-sky-600/30 transition-all ml-auto sm:ml-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create MTA / Direct Order</span>
          </button>
        </div>
      </div>

      {/* Export Confirmation Toast / Banner */}
      {exportNotice && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between transition-all">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{exportNotice}</span>
          </div>
          <span className="text-[11px] text-emerald-400/80 font-mono">TLC Base B03669 Compliant</span>
        </div>
      )}

      {/* Interactive Orders & Dispatch Charts */}
      <OrdersCharts orders={filteredOrders} />

      {/* ORDERS UNIFIED TABLE */}
      <div className="bg-slate-900/80 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700/60 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3.5">Order ID & Source</th>
                <th className="px-4 py-3.5">Passenger & Route</th>
                <th className="px-4 py-3.5">Vehicle / WAV</th>
                <th className="px-4 py-3.5">Assigned Driver</th>
                <th className="px-4 py-3.5">Dispatch Status</th>
                <th className="px-4 py-3.5">Fare & AT 15% Comm</th>
                <th className="px-4 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    <NavIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    No dispatch orders match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const status = statusConfig[order.status];
                  return (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className="hover:bg-slate-800/50 cursor-pointer transition-colors group"
                    >
                      {/* Order Number & Source */}
                      <td className="px-4 py-3.5">
                        <div className="font-mono text-white font-semibold group-hover:text-sky-300">
                          {order.orderNumber}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          {order.source === 'at_ai' ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                              <Bot className="w-3 h-3" /> AT AI Voice
                            </span>
                          ) : order.source === 'broker' ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                              <Building2 className="w-3 h-3" /> {order.brokerName ? order.brokerName.split(' ')[0] : 'Broker'}
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-sky-500/20 text-sky-300 border border-sky-500/30">
                              App Direct
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Passenger & Route */}
                      <td className="px-4 py-3.5 max-w-[260px]">
                        <div className="font-medium text-white flex items-center gap-1.5 truncate">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{order.passengerName}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1 flex flex-col space-y-0.5 truncate">
                          <div className="truncate text-slate-300">
                            <span className="text-emerald-400 font-bold">P:</span> {order.pickupAddress}
                          </div>
                          <div className="truncate text-slate-400">
                            <span className="text-rose-400 font-bold">D:</span> {order.dropoffAddress}
                          </div>
                        </div>
                      </td>

                      {/* Vehicle & WAV */}
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          order.vehicleType === 'WAV' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {order.vehicleType} {order.requiresWav ? '♿ WAV' : ''}
                        </span>
                        {order.specialAssistanceNotes && (
                          <div className="text-[10px] text-amber-400 mt-1 truncate max-w-[140px]" title={order.specialAssistanceNotes}>
                            ⚠ Special Assist
                          </div>
                        )}
                      </td>

                      {/* Driver */}
                      <td className="px-4 py-3.5">
                        {order.driverName ? (
                          <div>
                            <div className="font-medium text-white flex items-center gap-1">
                              <Car className="w-3.5 h-3.5 text-emerald-400" />
                              {order.driverName}
                            </div>
                            <div className="text-[11px] text-slate-400">{order.driverPhone}</div>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrder(order);
                              setIsAssignModalOpen(true);
                            }}
                            className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 border border-amber-500/40 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors"
                          >
                            <UserCheck className="w-3 h-3" />
                            Assign Nearest
                          </button>
                        )}
                      </td>

                      {/* Status & Broker workflow & Proximity Call Badges */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border w-fit ${status.bg} ${status.text} ${status.border}`}>
                            {status.label}
                          </span>
                          
                          {order.type === 'mta_broker' && order.brokerConfirmationStatus && (
                            <div>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${brokerStatusConfig[order.brokerConfirmationStatus].bg}`}>
                                {brokerStatusConfig[order.brokerConfirmationStatus].label}
                              </span>
                            </div>
                          )}

                          {/* Proximity Call Status Badge */}
                          {order.callTriggered && (
                            <div className="flex items-center gap-1">
                              {order.callResult === 'cancelled_by_passenger' ? (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                                  <PhoneOff className="w-2.5 h-2.5" /> Отмена по звонку (DTMF 2)
                                </span>
                              ) : order.callResult === 'confirmed' ? (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                                  <PhoneCall className="w-2.5 h-2.5 text-emerald-400" /> Выход подтверждён
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                                  <PhoneCall className="w-2.5 h-2.5" /> Звонок (0.3 mi)
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Fare & 15% Commission */}
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-white text-xs">${order.fareAmount.toFixed(2)}</div>
                        <div className="text-[11px] text-emerald-400 font-mono">
                          AT Comm (15%): <strong>+${order.atCommissionAmount.toFixed(2)}</strong>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Driver: ${order.driverPayout.toFixed(2)}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {order.status === 'created' && (
                            <button
                              onClick={() => {
                                setSelectedOrder(order);
                                setIsAssignModalOpen(true);
                              }}
                              className="px-2 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-[11px] font-medium"
                            >
                              Dispatch
                            </button>
                          )}
                          {order.status === 'driver_assigned' && (
                            <button
                              onClick={() => handleQuickStatusChange(order, 'en_route')}
                              className="px-2 py-1 bg-amber-600/30 hover:bg-amber-600 text-amber-300 hover:text-white rounded text-[11px] font-medium border border-amber-500/40"
                            >
                              En Route
                            </button>
                          )}
                          {order.status === 'en_route' && (
                            <button
                              onClick={() => handleQuickStatusChange(order, 'on_trip')}
                              className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[11px] font-medium"
                            >
                              Start Trip
                            </button>
                          )}
                          {order.status === 'on_trip' && (
                            <button
                              onClick={() => handleQuickStatusChange(order, 'completed')}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-medium"
                            >
                              Complete
                            </button>
                          )}
                          {/* MTA Proximity IVR Quick Action */}
                          {(order.type === 'mta_broker' || order.source === 'broker') && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setProximityTargetOrderId(order.id);
                                setIsProximityModalOpen(true);
                              }}
                              className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded text-[11px] font-medium flex items-center gap-1"
                              title="Автозвонок Twilio & DTMF / Telegram"
                            >
                              <PhoneCall className="w-3 h-3" />
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="p-1.5 text-slate-400 hover:text-white rounded"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
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

      {/* ORDER DETAILS DRAWER */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-end p-0 sm:p-4">
          <div className="bg-slate-900 border-l sm:border border-slate-800 w-full max-w-2xl h-full sm:h-[92vh] sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right">
            {/* Drawer Header */}
            <div className="p-5 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-sky-600/20 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold">
                  AT
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-white">{selectedOrder.orderNumber}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusConfig[selectedOrder.status].bg} ${statusConfig[selectedOrder.status].text} ${statusConfig[selectedOrder.status].border}`}>
                      {statusConfig[selectedOrder.status].label}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Type: <strong className="text-slate-200">{selectedOrder.type === 'mta_broker' ? 'MTA Paratransit Brokerage' : 'Direct Trip'}</strong> • Source: <strong className="text-slate-200">{selectedOrder.source.toUpperCase()}</strong>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Status Progression Stepper */}
            <div className="p-4 bg-slate-950/70 border-b border-slate-800">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Dispatch Lifecycle Stepper</span>
                <span className="text-slate-400 font-mono">15% AT Commission Accrued</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5 text-center text-xs">
                {(['created', 'driver_assigned', 'en_route', 'on_trip', 'completed'] as OrderStatus[]).map((st, idx) => {
                  const isCurrent = selectedOrder.status === st;
                  const isPassed = ['created', 'driver_assigned', 'en_route', 'on_trip', 'completed'].indexOf(selectedOrder.status) >= idx;

                  return (
                    <button
                      key={st}
                      onClick={() => handleQuickStatusChange(selectedOrder, st)}
                      className={`p-2 rounded-lg text-[10px] font-medium transition-all ${
                        isCurrent
                          ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30 ring-1 ring-sky-400'
                          : isPassed
                          ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-900/60 text-slate-500 border border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      <div className="font-bold">{idx + 1}</div>
                      <div className="truncate capitalize">{st.replace('_', ' ')}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* MTA Broker Workflow Card (if broker order) */}
              {selectedOrder.type === 'mta_broker' && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-amber-300 font-semibold text-xs">
                      <Building2 className="w-4 h-4" />
                      MTA Brokerage Confirmation Status ({selectedOrder.brokerName || 'TripLink'})
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 mb-3">
                    Update broker system state once driver confirmation is achieved for Paratransit dispatch:
                  </p>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {(['finding_driver', 'sent_to_broker', 'confirmed'] as BrokerConfirmationStatus[]).map((bs) => {
                      const isCurrent = selectedOrder.brokerConfirmationStatus === bs;
                      return (
                        <button
                          key={bs}
                          onClick={() => handleBrokerStatusChange(selectedOrder, bs)}
                          className={`p-2 rounded-lg text-[11px] font-medium transition-all ${
                            isCurrent
                              ? 'bg-amber-600 text-white font-bold ring-1 ring-amber-400 shadow-md'
                              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700'
                          }`}
                        >
                          {brokerStatusConfig[bs].label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Route Card */}
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/60 text-xs">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Queens Route & Location</h4>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/30 font-bold">
                      A
                    </div>
                    <div>
                      <div className="text-slate-400 text-[11px]">Pickup Address ({selectedOrder.pickupNeighborhood})</div>
                      <div className="text-white font-medium text-sm mt-0.5">{selectedOrder.pickupAddress}</div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 mt-0.5 border border-rose-500/30 font-bold">
                      B
                    </div>
                    <div>
                      <div className="text-slate-400 text-[11px]">Dropoff Address ({selectedOrder.dropoffNeighborhood})</div>
                      <div className="text-white font-medium text-sm mt-0.5">{selectedOrder.dropoffAddress}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Assigned Driver & Change Driver */}
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/60 text-xs">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Assigned Driver</h4>
                  <button
                    onClick={() => setIsAssignModalOpen(true)}
                    className="px-2.5 py-1 bg-sky-600/30 hover:bg-sky-600 text-sky-300 hover:text-white rounded border border-sky-500/40 text-[11px] font-medium"
                  >
                    {selectedOrder.driverId ? 'Reassign Driver...' : 'Assign Driver...'}
                  </button>
                </div>

                {selectedOrder.driverName ? (
                  <div className="flex items-center justify-between p-3 bg-slate-900/60 rounded-lg border border-slate-700/60">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold">
                        <Car className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-white text-sm">{selectedOrder.driverName}</div>
                        <div className="text-slate-400 text-[11px] flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-sky-400" />
                          {selectedOrder.driverPhone || 'No phone recorded'}
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Dispatched
                    </span>
                  </div>
                ) : (
                  <div className="p-4 bg-amber-500/10 border border-dashed border-amber-500/30 rounded-lg text-amber-300 text-center">
                    No driver assigned yet. Click 'Assign Driver' to select an active WAV/Taxi driver in Queens.
                  </div>
                )}
              </div>

              {/* 5-Column Payment Breakdown (Rate | Copay | Total Fare | AT Commission 15% | Driver Payout) */}
              {(() => {
                const currentCalculated = isEditingFinancials 
                  ? calculateMtaPaymentBreakdown(editRate, editCopay)
                  : calculateMtaPaymentBreakdown(
                      selectedOrder.rate ?? (selectedOrder.fareAmount - (selectedOrder.copay || 0)),
                      selectedOrder.copay ?? 0
                    );
                const showCommission = canViewMtaCommissionAndPayout(currentRole);
                const canEdit = canEditMtaFinancials(currentRole);

                return (
                  <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/80 text-xs space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                            <Calculator className="w-4 h-4 text-emerald-400" />
                            Payment Breakdown (MTA Broker Financials)
                          </h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            15% Fixed Comm
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Standard 5-column brokerage formula settlement
                        </p>
                      </div>

                      {canEdit && (
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          {isEditingFinancials ? (
                            <>
                              <button
                                onClick={() => {
                                  const r = selectedOrder.rate ?? (selectedOrder.fareAmount - (selectedOrder.copay || 0));
                                  setEditRate(r > 0 ? r : selectedOrder.fareAmount);
                                  setEditCopay(selectedOrder.copay ?? 0);
                                  setIsEditingFinancials(false);
                                }}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] rounded font-medium border border-slate-700 transition"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleSaveOrderFinancials}
                                disabled={isSavingFinancials}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] rounded font-semibold flex items-center gap-1 shadow-sm transition disabled:opacity-50"
                              >
                                <Save className="w-3.5 h-3.5" />
                                <span>{isSavingFinancials ? 'Saving...' : 'Save Changes'}</span>
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setIsEditingFinancials(true)}
                              className="px-2.5 py-1 bg-sky-600/20 hover:bg-sky-600/40 text-sky-300 border border-sky-500/40 rounded text-[11px] font-semibold flex items-center gap-1 transition"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Edit Rate / Copay</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Interactive 5-Column Grid Table */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                      {/* Column 1: Rate */}
                      <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-700/70 flex flex-col justify-between">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                          <span>1. Rate</span>
                          <span className="text-[9px] text-slate-500">Broker</span>
                        </div>
                        {isEditingFinancials ? (
                          <div className="mt-2">
                            <input
                              type="number"
                              step="0.50"
                              min="0"
                              value={editRate}
                              onChange={(e) => setEditRate(Math.max(0, Number(e.target.value)))}
                              className="w-full p-1 bg-slate-800 text-white text-sm font-bold rounded border border-sky-500 focus:outline-none"
                            />
                            <div className="text-[10px] text-slate-400 mt-1">Base from broker</div>
                          </div>
                        ) : (
                          <div className="mt-2">
                            <div className="text-base font-bold text-white">${currentCalculated.rate.toFixed(2)}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">Paid by broker</div>
                          </div>
                        )}
                      </div>

                      {/* Column 2: Copay */}
                      <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-700/70 flex flex-col justify-between">
                        <div className="flex items-center justify-between text-[10px] text-amber-400 uppercase tracking-wider font-semibold">
                          <span>2. Copay</span>
                          <span className="text-[9px] text-amber-500/80">Cash</span>
                        </div>
                        {isEditingFinancials ? (
                          <div className="mt-2">
                            <input
                              type="number"
                              step="0.50"
                              min="0"
                              value={editCopay}
                              onChange={(e) => setEditCopay(Math.max(0, Number(e.target.value)))}
                              className="w-full p-1 bg-slate-800 text-amber-300 text-sm font-bold rounded border border-amber-500 focus:outline-none"
                            />
                            <div className="text-[10px] text-amber-400/80 mt-1">Cash to driver</div>
                          </div>
                        ) : (
                          <div className="mt-2">
                            <div className="text-base font-bold text-amber-300">${currentCalculated.copay.toFixed(2)}</div>
                            <div className="text-[10px] text-amber-400/80 mt-0.5">Cash in hand</div>
                          </div>
                        )}
                      </div>

                      {/* Column 3: Total Fare */}
                      <div className="bg-sky-950/30 p-3 rounded-lg border border-sky-700/40 flex flex-col justify-between">
                        <div className="flex items-center justify-between text-[10px] text-sky-400 uppercase tracking-wider font-semibold">
                          <span>3. Total Fare</span>
                          <span className="text-[9px] text-sky-400">Sum</span>
                        </div>
                        <div className="mt-2">
                          <div className="text-base font-bold text-sky-300">${currentCalculated.totalFare.toFixed(2)}</div>
                          <div className="text-[10px] text-sky-400/80 mt-0.5">Rate + Copay</div>
                        </div>
                      </div>

                      {/* Column 4: AT Commission (15%) */}
                      <div className="bg-emerald-950/30 p-3 rounded-lg border border-emerald-700/40 flex flex-col justify-between">
                        <div className="flex items-center justify-between text-[10px] text-emerald-400 uppercase tracking-wider font-semibold">
                          <span>4. AT Comm (15%)</span>
                          <span className="text-[9px] text-emerald-400">Margin</span>
                        </div>
                        <div className="mt-2">
                          {showCommission ? (
                            <>
                              <div className="text-base font-bold text-emerald-300">+${currentCalculated.atCommission15Pct.toFixed(2)}</div>
                              <div className="text-[10px] text-emerald-400/80 mt-0.5">Total Fare × 15%</div>
                            </>
                          ) : (
                            <>
                              <div className="text-sm font-bold text-slate-500 flex items-center gap-1 mt-1">
                                <Lock className="w-3 h-3 text-slate-500" />
                                <span>Restricted</span>
                              </div>
                              <div className="text-[9px] text-slate-500 mt-0.5">Admin/Finance</div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Column 5: Driver Payout */}
                      <div className="bg-indigo-950/30 p-3 rounded-lg border border-indigo-700/40 flex flex-col justify-between">
                        <div className="flex items-center justify-between text-[10px] text-indigo-300 uppercase tracking-wider font-semibold">
                          <span>5. Driver Payout</span>
                          <span className="text-[9px] text-indigo-400">Net</span>
                        </div>
                        <div className="mt-2">
                          {showCommission ? (
                            <>
                              <div className="text-base font-bold text-indigo-200">${currentCalculated.driverPayout.toFixed(2)}</div>
                              <div className="text-[10px] text-indigo-300/80 mt-0.5">Rate − AT Comm</div>
                            </>
                          ) : (
                            <>
                              <div className="text-sm font-bold text-slate-500 flex items-center gap-1 mt-1">
                                <Lock className="w-3 h-3 text-slate-500" />
                                <span>Restricted</span>
                              </div>
                              <div className="text-[9px] text-slate-500 mt-0.5">Admin/Finance</div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Formula Clarification Legend */}
                    <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-300">Rules & Formulas:</span>
                        <span className="font-mono text-[10px] bg-slate-800 px-2 py-0.5 rounded text-sky-300">
                          Total Fare = Rate + Copay
                        </span>
                        <span className="font-mono text-[10px] bg-slate-800 px-2 py-0.5 rounded text-emerald-300">
                          AT Comm = Total Fare × 15%
                        </span>
                        <span className="font-mono text-[10px] bg-slate-800 px-2 py-0.5 rounded text-indigo-300">
                          Driver Payout = Rate − AT Comm
                        </span>
                      </div>
                      <span className="text-[10px] text-amber-400/90 font-medium">
                        * Copay ($ {currentCalculated.copay.toFixed(2)}) is kept in driver's pocket in cash
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* MTA Proximity Calling (Twilio IVR & Telegram Alerts) Card */}
              {(selectedOrder.type === 'mta_broker' || selectedOrder.source === 'broker') && (
                <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 p-4 rounded-xl border border-amber-500/30 text-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-semibold text-white">
                      <PhoneCall className="w-4 h-4 text-amber-400" />
                      <span>MTA Автодозвон (Twilio IVR & Telegram)</span>
                    </div>
                    <button
                      onClick={() => {
                        setProximityTargetOrderId(selectedOrder.id);
                        setIsProximityModalOpen(true);
                      }}
                      className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded text-[11px] font-semibold flex items-center gap-1 transition"
                    >
                      <Radio className="w-3.5 h-3.5" />
                      Управление / Тест...
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-slate-300">
                    <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-800">
                      <div className="text-[10px] text-slate-400">Статус автозвонка:</div>
                      <div className="font-semibold text-white mt-0.5">
                        {selectedOrder.callTriggered ? (
                          selectedOrder.callResult === 'cancelled_by_passenger' ? (
                            <span className="text-rose-400">❌ Отменён по DTMF 2</span>
                          ) : (
                            <span className="text-emerald-400">✓ Выполнен ({selectedOrder.callResult || 'OK'})</span>
                          )
                        ) : (
                          <span className="text-amber-400">Ожидает триггера (0.3 mi)</span>
                        )}
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-800">
                      <div className="text-[10px] text-slate-400">Оповещение в Telegram:</div>
                      <div className="font-semibold text-white mt-0.5">
                        {selectedOrder.callResult === 'cancelled_by_passenger' ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <Send className="w-3 h-3 text-indigo-400" /> Отправлено
                          </span>
                        ) : (
                          <span className="text-slate-400">Активно при отмене</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Special Notes */}
              {selectedOrder.specialAssistanceNotes && (
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/60 text-xs">
                  <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">Accessibility & Assistance Instructions</h4>
                  <p className="text-slate-300">{selectedOrder.specialAssistanceNotes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ASSIGN DRIVER MODAL */}
      {isAssignModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-sky-400" />
                Assign Driver to {selectedOrder.orderNumber}
              </h3>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <p className="text-xs text-slate-400 mt-2 mb-3">
              Route: <strong>{selectedOrder.pickupNeighborhood}</strong> → <strong>{selectedOrder.dropoffNeighborhood}</strong> (Req: {selectedOrder.vehicleType} {selectedOrder.requiresWav ? '♿ WAV' : ''})
            </p>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {availableDrivers.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-xs">
                  No active drivers currently available.
                </div>
              ) : (
                availableDrivers.map((driver) => {
                  const isMatchingNeighborhood = driver.operatingBoroughs.some(b => b.toLowerCase().includes(selectedOrder.pickupNeighborhood.toLowerCase()));
                  const isMatchingVehicle = !selectedOrder.requiresWav || driver.isWheelchairAccessible || driver.vehicleType === 'WAV';

                  return (
                    <div
                      key={driver.id}
                      onClick={() => handleAssignDriverSubmit(driver.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isMatchingNeighborhood && isMatchingVehicle
                          ? 'bg-slate-800 hover:bg-slate-700/80 border-sky-500/40 hover:border-sky-400'
                          : 'bg-slate-900 hover:bg-slate-800 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-700 flex items-center justify-center font-bold text-sky-400 text-xs">
                          {driver.fullName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="font-semibold text-white text-xs flex items-center gap-1.5">
                            {driver.fullName}
                            {isMatchingNeighborhood && (
                              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded">
                                Nearest in {selectedOrder.pickupNeighborhood}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {driver.tlcLicenseNumber} • Plate: {driver.vehiclePlate} ({driver.vehicleType})
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-semibold"
                      >
                        Select
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-lg font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE MANUAL MTA / DIRECT ORDER MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-sky-400" />
                Create Manual MTA / Direct Order
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              {/* Order Type & Broker Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-medium block mb-1">Order Category *</label>
                  <select
                    value={newOrder.type}
                    onChange={(e) => {
                      const type = e.target.value as OrderType;
                      setNewOrder({
                        ...newOrder,
                        type,
                        source: type === 'mta_broker' ? 'broker' : 'app'
                      });
                    }}
                    className="w-full p-2 bg-slate-800 text-white rounded-lg border border-slate-700 focus:outline-none focus:border-sky-500"
                  >
                    <option value="mta_broker">MTA Paratransit Brokerage (TripLink / MyLe)</option>
                    <option value="standard">Standard Direct Taxi Order</option>
                  </select>
                </div>

                {newOrder.type === 'mta_broker' && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-400 font-medium">Brokerage Partner *</label>
                      {newOrder.brokerId && (
                        <span className="text-[11px] text-amber-400 font-medium">
                          Default Copay: ${((brokers.find(b => b.id === newOrder.brokerId)?.defaultCopay) ?? 5).toFixed(2)}
                        </span>
                      )}
                    </div>
                    <select
                      value={newOrder.brokerId}
                      onChange={(e) => {
                        const broker = brokers.find(b => b.id === e.target.value);
                        setNewOrder({
                          ...newOrder,
                          brokerId: e.target.value,
                          brokerName: broker?.name,
                          copay: broker?.defaultCopay !== undefined ? broker.defaultCopay : 5.00
                        });
                      }}
                      className="w-full p-2 bg-slate-800 text-white rounded-lg border border-slate-700 focus:outline-none focus:border-sky-500"
                    >
                      {brokers.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} (Default Copay: ${(b.defaultCopay ?? 5).toFixed(2)} • 15% Comm)
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Passenger Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-medium block mb-1">Passenger Name / MTA ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Eleanor Vance (AAR #4829)"
                    value={newOrder.passengerName}
                    onChange={(e) => setNewOrder({ ...newOrder, passengerName: e.target.value })}
                    className="w-full p-2 bg-slate-800 text-white rounded-lg border border-slate-700 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-medium block mb-1">Passenger Phone</label>
                  <input
                    type="text"
                    placeholder="+1 (718) 555-3819"
                    value={newOrder.passengerPhone}
                    onChange={(e) => setNewOrder({ ...newOrder, passengerPhone: e.target.value })}
                    className="w-full p-2 bg-slate-800 text-white rounded-lg border border-slate-700 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Pickup & Dropoff in Queens */}
              <div className="space-y-3 p-3 bg-slate-800/40 rounded-xl border border-slate-800">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <label className="text-slate-400 font-medium block mb-1">Pickup Street Address *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 82-11 37th Ave, Jackson Heights"
                      value={newOrder.pickupAddress}
                      onChange={(e) => setNewOrder({ ...newOrder, pickupAddress: e.target.value })}
                      className="w-full p-2 bg-slate-800 text-white rounded-lg border border-slate-700 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Pickup Area</label>
                    <select
                      value={newOrder.pickupNeighborhood}
                      onChange={(e) => setNewOrder({ ...newOrder, pickupNeighborhood: e.target.value })}
                      className="w-full p-2 bg-slate-800 text-white rounded-lg border border-slate-700 focus:outline-none focus:border-sky-500"
                    >
                      {neighborhoods.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <label className="text-slate-400 font-medium block mb-1">Dropoff Street Address *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Queens Hospital Center, 82-68 164th St"
                      value={newOrder.dropoffAddress}
                      onChange={(e) => setNewOrder({ ...newOrder, dropoffAddress: e.target.value })}
                      className="w-full p-2 bg-slate-800 text-white rounded-lg border border-slate-700 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Dropoff Area</label>
                    <select
                      value={newOrder.dropoffNeighborhood}
                      onChange={(e) => setNewOrder({ ...newOrder, dropoffNeighborhood: e.target.value })}
                      className="w-full p-2 bg-slate-800 text-white rounded-lg border border-slate-700 focus:outline-none focus:border-sky-500"
                    >
                      {neighborhoods.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Vehicle Category & 5-Column Financials Inputs */}
              <div className="space-y-3 p-3 bg-slate-800/40 rounded-xl border border-slate-800">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Vehicle Category</label>
                    <select
                      value={newOrder.vehicleType}
                      onChange={(e) => setNewOrder({ ...newOrder, vehicleType: e.target.value as VehicleType, requiresWav: e.target.value === 'WAV' })}
                      className="w-full p-2 bg-slate-800 text-white rounded-lg border border-slate-700 focus:outline-none focus:border-sky-500"
                    >
                      <option value="WAV">WAV ♿ (Wheelchair Auto-Ramp)</option>
                      <option value="Green">Green Taxi</option>
                      <option value="Go">Go (Standard)</option>
                      <option value="Plus">Plus</option>
                      <option value="XL">XL</option>
                      <option value="Black">Black</option>
                      <option value="Black XL">Black XL</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 font-medium block mb-1">1. Rate ($ Broker Base)</label>
                    <input
                      type="number"
                      step="0.50"
                      min="0"
                      value={newOrder.rate}
                      onChange={(e) => setNewOrder({ ...newOrder, rate: Math.max(0, Number(e.target.value)) })}
                      className="w-full p-2 bg-slate-800 text-white font-bold rounded-lg border border-slate-700 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 font-medium block mb-1">2. Copay ($ Cash)</label>
                    <input
                      type="number"
                      step="0.50"
                      min="0"
                      value={newOrder.copay}
                      onChange={(e) => setNewOrder({ ...newOrder, copay: Math.max(0, Number(e.target.value)) })}
                      className="w-full p-2 bg-slate-800 text-amber-300 font-bold rounded-lg border border-slate-700 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* 5-Column Live Calculation Preview Card */}
                <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-700/80">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Live 5-Column Payment Breakdown Preview</span>
                    <span className="text-emerald-400 font-mono">15% AT Commission</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                    <div className="p-2 bg-slate-800/80 rounded-lg border border-slate-700">
                      <div className="text-[10px] text-slate-400 uppercase">Rate</div>
                      <div className="text-sm font-bold text-white mt-0.5">${newOrderBreakdown.rate.toFixed(2)}</div>
                    </div>
                    <div className="p-2 bg-slate-800/80 rounded-lg border border-slate-700">
                      <div className="text-[10px] text-amber-400 uppercase">Copay</div>
                      <div className="text-sm font-bold text-amber-300 mt-0.5">${newOrderBreakdown.copay.toFixed(2)}</div>
                    </div>
                    <div className="p-2 bg-sky-950/40 rounded-lg border border-sky-700/40">
                      <div className="text-[10px] text-sky-400 uppercase">Total Fare</div>
                      <div className="text-sm font-bold text-sky-300 mt-0.5">${newOrderBreakdown.totalFare.toFixed(2)}</div>
                    </div>
                    <div className="p-2 bg-emerald-950/40 rounded-lg border border-emerald-700/40">
                      <div className="text-[10px] text-emerald-400 uppercase">AT 15% Comm</div>
                      <div className="text-sm font-bold text-emerald-300 mt-0.5">+${newOrderBreakdown.atCommission15Pct.toFixed(2)}</div>
                    </div>
                    <div className="p-2 bg-indigo-950/40 rounded-lg border border-indigo-700/40">
                      <div className="text-[10px] text-indigo-300 uppercase">Driver Payout</div>
                      <div className="text-sm font-bold text-indigo-200 mt-0.5">${newOrderBreakdown.driverPayout.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Assign Driver Immediately (Optional) */}
              <div>
                <label className="text-slate-400 font-medium block mb-1">Assign Driver (Optional)</label>
                <select
                  value={newOrder.driverId}
                  onChange={(e) => setNewOrder({ ...newOrder, driverId: e.target.value })}
                  className="w-full p-2 bg-slate-800 text-white rounded-lg border border-slate-700 focus:outline-none focus:border-sky-500"
                >
                  <option value="">Leave Unassigned (Dispatch Later)</option>
                  {availableDrivers.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.fullName} ({d.vehicleType}) - {d.operatingBoroughs.join(', ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Special assistance notes */}
              <div>
                <label className="text-slate-400 font-medium block mb-1">Accessibility / Paratransit Instructions</label>
                <input
                  type="text"
                  placeholder="e.g. Passenger is in motorized wheelchair, folding ramp needed"
                  value={newOrder.specialAssistanceNotes}
                  onChange={(e) => setNewOrder({ ...newOrder, specialAssistanceNotes: e.target.value })}
                  className="w-full p-2 bg-slate-800 text-white rounded-lg border border-slate-700 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-semibold shadow-sm"
                >
                  Dispatch MTA Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MTA PROXIMITY CALLING & TWILIO / TELEGRAM MODAL */}
      <ProximityCallModal
        isOpen={isProximityModalOpen}
        onClose={() => {
          setIsProximityModalOpen(false);
          setProximityTargetOrderId(null);
        }}
        orders={orders}
        drivers={drivers}
        selectedOrderId={proximityTargetOrderId}
      />
    </div>
  );
};
