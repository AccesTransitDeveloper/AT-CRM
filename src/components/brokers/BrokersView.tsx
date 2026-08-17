import React, { useState } from 'react';
import { Broker, Order, BrokerConfirmationStatus, UserRole } from '../../types';
import { Building2, Plus, ExternalLink, Phone, Mail, DollarSign, CheckCircle2, Clock, Car, ChevronRight, XCircle } from 'lucide-react';

interface BrokersViewProps {
  brokers: Broker[];
  orders: Order[];
  currentRole: UserRole;
  onCreateBroker: (broker: Partial<Broker>) => Promise<void>;
  onUpdateOrderStatus: (orderId: string, status: any, brokerStatus?: BrokerConfirmationStatus) => Promise<void>;
}

export const BrokersView: React.FC<BrokersViewProps> = ({
  brokers,
  orders,
  currentRole,
  onCreateBroker,
  onUpdateOrderStatus
}) => {
  const [selectedBroker, setSelectedBroker] = useState<Broker | null>(brokers[0] || null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newBroker, setNewBroker] = useState<Partial<Broker>>({
    name: '',
    code: '',
    contactPerson: '',
    email: '',
    phone: '',
    commissionRate: 0.15,
    portalUrl: '',
    notes: ''
  });

  const brokerOrders = orders.filter(o => 
    o.type === 'mta_broker' && 
    (selectedBroker ? o.brokerId === selectedBroker.id || o.brokerName?.toLowerCase().includes(selectedBroker.code.toLowerCase()) || o.brokerName?.toLowerCase().includes(selectedBroker.name.toLowerCase()) : true)
  );

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBroker.name) return;
    await onCreateBroker({
      ...newBroker,
      code: newBroker.code || newBroker.name.toUpperCase().replace(/\s+/g, '_').slice(0, 10),
      commissionRate: 0.15
    });
    setIsAddModalOpen(false);
    setNewBroker({
      name: '',
      code: '',
      contactPerson: '',
      email: '',
      phone: '',
      commissionRate: 0.15,
      portalUrl: '',
      notes: ''
    });
  };

  const handleUpdateBrokerStatus = async (orderId: string, newBrokerStatus: BrokerConfirmationStatus) => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder) return;
    await onUpdateOrderStatus(orderId, targetOrder.status, newBrokerStatus);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-white tracking-tight">MTA Paratransit Brokerage Channels</h2>
            <span className="px-2 py-0.5 text-xs bg-amber-500/20 text-amber-400 rounded-full font-medium border border-amber-500/30">
              15% AT Commission Rate
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Partner integrations with TripLink, MyLe, MetroCare & Queens medical transit dispatch
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 self-start sm:self-auto shadow-sm shadow-sky-600/30"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add New Broker</span>
        </button>
      </div>

      {/* Broker Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {brokers.map((broker) => {
          const isSelected = selectedBroker?.id === broker.id;
          const brokerActiveCount = orders.filter(o => o.brokerId === broker.id && ['created', 'driver_assigned', 'en_route', 'on_trip'].includes(o.status)).length;

          return (
            <div
              key={broker.id}
              onClick={() => setSelectedBroker(broker)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-slate-800/90 border-sky-500 shadow-lg shadow-sky-950/40 ring-1 ring-sky-500/50'
                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  15% Margin Active
                </span>
              </div>

              <h3 className="font-bold text-white text-sm mt-3">{broker.name}</h3>
              <div className="text-xs text-slate-400 font-mono mt-0.5">Code: {broker.code}</div>

              <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                  <Phone className="w-3 h-3 text-sky-400" />
                  <span>{broker.phone}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                  <Mail className="w-3 h-3 text-sky-400" />
                  <span className="truncate">{broker.email}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-between text-xs">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Active MTA Trips</div>
                  <div className="font-bold text-white text-sm">{brokerActiveCount} active</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase">Settled</div>
                  <div className="font-bold text-emerald-400 text-sm">${(broker.totalSettledAmount ?? 0).toLocaleString()}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Broker Attached Orders & Confirmation Pipeline */}
      {selectedBroker && (
        <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800 gap-2">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">
                  MTA Paratransit Order Queue for {selectedBroker.name}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-300">
                  {brokerOrders.length} Trips
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Broker Confirmation Workflow: <strong className="text-amber-300">1. Finding Driver</strong> → <strong className="text-sky-300">2. Sent to Broker</strong> → <strong className="text-emerald-300">3. Confirmed by Broker</strong>
              </p>
            </div>

            {selectedBroker.portalUrl && (
              <a
                href={selectedBroker.portalUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 flex items-center gap-1.5 self-start sm:self-auto"
              >
                <span>Open Partner Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700/60 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3">Order Number</th>
                  <th className="px-4 py-3">MTA Passenger & Route</th>
                  <th className="px-4 py-3">Assigned Driver</th>
                  <th className="px-4 py-3">Trip Status</th>
                  <th className="px-4 py-3">Broker Confirmation Stage</th>
                  <th className="px-4 py-3">Fare & AT 15% Comm</th>
                  <th className="px-4 py-3 text-right">Update Stage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {brokerOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-500">
                      No MTA paratransit orders assigned to {selectedBroker.name} currently.
                    </td>
                  </tr>
                ) : (
                  brokerOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-white">
                        {order.orderNumber}
                      </td>
                      <td className="px-4 py-3 max-w-[220px]">
                        <div className="font-medium text-slate-200 truncate">{order.passengerName}</div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          {order.pickupNeighborhood} → {order.dropoffNeighborhood}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {order.driverName ? (
                          <div className="text-emerald-400 font-medium flex items-center gap-1">
                            <Car className="w-3 h-3" />
                            {order.driverName}
                          </div>
                        ) : (
                          <span className="text-amber-400 font-medium">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3 capitalize text-slate-300">
                        {order.status.replace('_', ' ')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          order.brokerConfirmationStatus === 'confirmed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                          order.brokerConfirmationStatus === 'sent_to_broker' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' :
                          'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}>
                          {order.brokerConfirmationStatus === 'confirmed' ? '3. Confirmed ✓' :
                           order.brokerConfirmationStatus === 'sent_to_broker' ? '2. Sent to Broker ✈' :
                           '1. Finding Driver 🔍'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-white font-bold">${order.fareAmount.toFixed(2)}</div>
                        <div className="text-emerald-400 text-[10px]">AT: +${order.atCommissionAmount.toFixed(2)}</div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleUpdateBrokerStatus(order.id, 'sent_to_broker')}
                            className="px-2 py-1 bg-sky-600/30 hover:bg-sky-600 text-sky-200 text-[10px] rounded border border-sky-500/30"
                            title="Mark Sent to Broker"
                          >
                            Send
                          </button>
                          <button
                            onClick={() => handleUpdateBrokerStatus(order.id, 'confirmed')}
                            className="px-2 py-1 bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 text-[10px] rounded border border-emerald-500/30"
                            title="Mark Confirmed by Broker"
                          >
                            Confirm
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD BROKER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-400" />
                Register New Broker Partner
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-400 font-medium block mb-1">Broker Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AccessHealth Mobility"
                  value={newBroker.name}
                  onChange={(e) => setNewBroker({ ...newBroker, name: e.target.value })}
                  className="w-full p-2 bg-slate-800 text-white rounded-lg border border-slate-700 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-medium block mb-1">Broker Code</label>
                  <input
                    type="text"
                    placeholder="ACCESS_HLTH"
                    value={newBroker.code}
                    onChange={(e) => setNewBroker({ ...newBroker, code: e.target.value.toUpperCase() })}
                    className="w-full p-2 bg-slate-800 text-white rounded-lg border border-slate-700 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-medium block mb-1">AT Commission Rate</label>
                  <input
                    type="text"
                    disabled
                    value="15% Fixed"
                    className="w-full p-2 bg-slate-800/50 text-emerald-400 font-bold rounded-lg border border-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-medium block mb-1">Contact Person & Title</label>
                <input
                  type="text"
                  placeholder="e.g. Mark Robinson (Dispatch Director)"
                  value={newBroker.contactPerson}
                  onChange={(e) => setNewBroker({ ...newBroker, contactPerson: e.target.value })}
                  className="w-full p-2 bg-slate-800 text-white rounded-lg border border-slate-700 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-medium block mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="dispatch@broker.com"
                    value={newBroker.email}
                    onChange={(e) => setNewBroker({ ...newBroker, email: e.target.value })}
                    className="w-full p-2 bg-slate-800 text-white rounded-lg border border-slate-700 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-medium block mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="+1 (212) 555-0199"
                    value={newBroker.phone}
                    onChange={(e) => setNewBroker({ ...newBroker, phone: e.target.value })}
                    className="w-full p-2 bg-slate-800 text-white rounded-lg border border-slate-700 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-medium block mb-1">Partner Portal / API URL</label>
                <input
                  type="url"
                  placeholder="https://dispatch.partnerportal.com"
                  value={newBroker.portalUrl}
                  onChange={(e) => setNewBroker({ ...newBroker, portalUrl: e.target.value })}
                  className="w-full p-2 bg-slate-800 text-white rounded-lg border border-slate-700 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg"
                >
                  Register Partner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
