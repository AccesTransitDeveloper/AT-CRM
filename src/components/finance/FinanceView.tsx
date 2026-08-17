import React, { useState } from 'react';
import { CommissionSettlement, SystemStats, UserRole } from '../../types';
import { DollarSign, Download, CheckCircle2, Clock, FileText, ArrowUpRight, TrendingUp, Building2, Bot, Smartphone } from 'lucide-react';

interface FinanceViewProps {
  stats: SystemStats | null;
  settlements: CommissionSettlement[];
  currentRole: UserRole;
  onUpdateSettlementStatus: (id: string, status: CommissionSettlement['status']) => Promise<void>;
}

export const FinanceView: React.FC<FinanceViewProps> = ({
  stats,
  settlements,
  currentRole,
  onUpdateSettlementStatus
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredSettlements = settlements.filter(s => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    return true;
  });

  const totalSettledSum = settlements
    .filter(s => s.status === 'settled')
    .reduce((acc, curr) => acc + curr.atCommission15Pct, 0);

  const totalPendingSum = settlements
    .filter(s => s.status === 'pending')
    .reduce((acc, curr) => acc + curr.atCommission15Pct, 0);

  const handleExportCSV = () => {
    const headers = ['Settlement ID', 'Order Number', 'Broker Name', 'Trip Date', 'Gross Fare ($)', 'AT 15% Comm ($)', 'Driver Payout ($)', 'Status'];
    const rows = filteredSettlements.map(s => [
      s.id,
      s.orderNumber,
      `"${s.brokerName}"`,
      s.tripDate,
      s.fare.toFixed(2),
      s.atCommission15Pct.toFixed(2),
      s.driverPayout.toFixed(2),
      s.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `accessible_transit_commission_settlements_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Finance, Revenue & 15% Commission Ledger</h2>
            <span className="px-2 py-0.5 text-xs bg-emerald-500/20 text-emerald-400 rounded-full font-medium border border-emerald-500/30">
              15% Fixed Brokerage Margin
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Gross booking volume, channel distribution, broker invoicing & driver payouts in Queens
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 border border-slate-700 self-start sm:self-auto transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Settlements CSV</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Gross Booking Volume */}
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Gross Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mt-2">
            ${stats ? stats.totalGrossRevenueToday.toFixed(2) : '275.00'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            <span>Combined app + AI + broker volume</span>
          </div>
        </div>

        {/* Card 2: AT 15% Margin */}
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-400 font-medium uppercase tracking-wider">AT 15% Commission</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">
            ${stats ? stats.atCommissionToday.toFixed(2) : '41.25'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Settled: <strong className="text-emerald-300">${totalSettledSum.toFixed(2)}</strong> • Pending: <strong className="text-amber-300">${totalPendingSum.toFixed(2)}</strong>
          </div>
        </div>

        {/* Card 3: Brokerage Revenue (TripLink/MyLe) */}
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-400 font-medium uppercase tracking-wider">Brokerage Channel</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mt-2">
            ${stats ? stats.brokerRevenue.toFixed(2) : '194.50'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            TripLink, MyLe, MetroCare MTA Paratransit
          </div>
        </div>

        {/* Card 4: AT AI Voice & Chat Revenue */}
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-purple-400 font-medium uppercase tracking-wider">AT AI Agent Channel</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mt-2">
            ${stats ? stats.atAiRevenue.toFixed(2) : '46.00'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Direct bookings via voice dispatcher agent
          </div>
        </div>
      </div>

      {/* Revenue Breakdown Visualization */}
      <div className="bg-slate-900/80 p-5 rounded-xl border border-slate-800 shadow-xl">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <span>Channel Revenue Split & Inflow</span>
        </h3>

        <div className="space-y-3 text-xs">
          {/* Progress bar */}
          <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden flex">
            <div style={{ width: '65%' }} className="bg-amber-500 hover:bg-amber-400 transition-all" title="Brokerage (65%)" />
            <div style={{ width: '20%' }} className="bg-purple-500 hover:bg-purple-400 transition-all" title="AT AI Voice (20%)" />
            <div style={{ width: '15%' }} className="bg-sky-500 hover:bg-sky-400 transition-all" title="Mobile App (15%)" />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-slate-300">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <span>MTA Brokerage Channels: <strong>65%</strong> (${stats ? stats.brokerRevenue.toFixed(2) : '194.50'})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-purple-500" />
              <span>AT AI Voice Dispatcher: <strong>20%</strong> (${stats ? stats.atAiRevenue.toFixed(2) : '46.00'})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-sky-500" />
              <span>Passenger App Direct: <strong>15%</strong> (${stats ? stats.directRevenue.toFixed(2) : '34.50'})</span>
            </div>
          </div>
        </div>
      </div>

      {/* MTA Paratransit 15% Commission Settlement Ledger */}
      <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800 gap-2">
          <div>
            <h3 className="text-base font-bold text-white">
              MTA Paratransit 15% Commission Accrual Ledger
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Itemized commission schedule per completed brokerage trip for partner invoicing
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-slate-800 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700"
            >
              <option value="all">All Settlement Statuses</option>
              <option value="pending">Pending Settlement (Ожидает)</option>
              <option value="settled">Settled (Выплачено)</option>
              <option value="invoiced">Invoiced (Выставлен счёт)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700/60 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">Order Number</th>
                <th className="px-4 py-3">Broker Partner</th>
                <th className="px-4 py-3">Trip Date</th>
                <th className="px-4 py-3">Gross Fare</th>
                <th className="px-4 py-3">AT 15% Commission</th>
                <th className="px-4 py-3">Driver Share (85%)</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredSettlements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-500">
                    No commission settlement records match filter.
                  </td>
                </tr>
              ) : (
                filteredSettlements.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-white">
                      {item.orderNumber}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-200">
                      {item.brokerName}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {item.tripDate}
                    </td>
                    <td className="px-4 py-3 font-semibold text-white">
                      ${item.fare.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 font-bold text-emerald-400">
                      +${item.atCommission15Pct.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-slate-300 font-mono">
                      ${item.driverPayout.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        item.status === 'settled' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        item.status === 'invoiced' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' :
                        'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {item.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {item.status !== 'settled' ? (
                        <button
                          onClick={() => onUpdateSettlementStatus(item.id, 'settled')}
                          className="px-2 py-1 bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 text-[11px] rounded border border-emerald-500/40 font-medium transition-colors"
                        >
                          Mark Settled
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-500">Paid ✓</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
