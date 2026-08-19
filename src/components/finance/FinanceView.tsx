import React, { useState } from 'react';
import { CommissionSettlement, SystemStats, UserRole, Order, Driver } from '../../types';
import { DollarSign, Download, CheckCircle2, Building2, Bot, FileSpreadsheet, Lock, Calculator, ArrowUpRight, TrendingUp } from 'lucide-react';
import { downloadTlcCsv, TLC_BASE_NUMBER } from '../../lib/tlcExport';
import { calculateMtaPaymentBreakdown, canViewMtaCommissionAndPayout, downloadMtaFinancialCsv } from '../../lib/mtaPayment';
import { FinanceCharts } from './FinanceCharts';

interface FinanceViewProps {
  stats: SystemStats | null;
  settlements: CommissionSettlement[];
  orders?: Order[];
  drivers?: Driver[];
  currentRole: UserRole;
  onUpdateSettlementStatus: (id: string, status: CommissionSettlement['status']) => Promise<void>;
}

export const FinanceView: React.FC<FinanceViewProps> = ({
  stats,
  settlements,
  orders = [],
  drivers = [],
  currentRole,
  onUpdateSettlementStatus
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const showCommission = canViewMtaCommissionAndPayout(currentRole);

  const filteredSettlements = settlements.filter(s => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    return true;
  });

  // Calculate detailed 5-column financials per item
  const enrichedSettlements = filteredSettlements.map(item => {
    // Find matching order if available
    const matchingOrder = orders.find(o => o.orderNumber === item.orderNumber || o.id === item.orderNumber);
    const rateVal = item.rate ?? (matchingOrder?.rate !== undefined ? matchingOrder.rate : (item.fare - (item.copay || matchingOrder?.copay || 0)));
    const copayVal = item.copay ?? (matchingOrder?.copay !== undefined ? matchingOrder.copay : 0);
    
    const breakdown = calculateMtaPaymentBreakdown(
      rateVal > 0 ? rateVal : item.fare,
      copayVal
    );

    return {
      ...item,
      rate: breakdown.rate,
      copay: breakdown.copay,
      totalFare: breakdown.totalFare,
      atCommission15Pct: breakdown.atCommission15Pct,
      driverPayout: breakdown.driverPayout,
    };
  });

  // Column Totals
  const totalRate = enrichedSettlements.reduce((acc, curr) => acc + curr.rate, 0);
  const totalCopay = enrichedSettlements.reduce((acc, curr) => acc + curr.copay, 0);
  const totalFare = enrichedSettlements.reduce((acc, curr) => acc + curr.totalFare, 0);
  const totalAtCommission = enrichedSettlements.reduce((acc, curr) => acc + curr.atCommission15Pct, 0);
  const totalDriverPayout = enrichedSettlements.reduce((acc, curr) => acc + curr.driverPayout, 0);

  const totalSettledSum = enrichedSettlements
    .filter(s => s.status === 'settled')
    .reduce((acc, curr) => acc + curr.atCommission15Pct, 0);

  const totalPendingSum = enrichedSettlements
    .filter(s => s.status === 'pending')
    .reduce((acc, curr) => acc + curr.atCommission15Pct, 0);

  const handleExportMtaFinancialsCSV = () => {
    if (orders && orders.length > 0) {
      const { filename, count } = downloadMtaFinancialCsv(orders);
      setExportNotice(`Exported ${count} MTA orders with 5-column financials breakdown to ${filename}`);
      setTimeout(() => setExportNotice(null), 4000);
      return;
    }

    // Direct CSV export from enriched settlements
    const headers = ['Settlement ID', 'Order Number', 'Broker Name', 'Trip Date', 'Rate ($)', 'Copay ($)', 'Total Fare ($)', 'AT Commission 15% ($)', 'Driver Payout ($)', 'Status'];
    const rows = enrichedSettlements.map(s => [
      s.id,
      s.orderNumber,
      `"${s.brokerName}"`,
      s.tripDate,
      s.rate.toFixed(2),
      s.copay.toFixed(2),
      s.totalFare.toFixed(2),
      s.atCommission15Pct.toFixed(2),
      s.driverPayout.toFixed(2),
      s.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `mta_broker_financials_5col_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportNotice(`Exported ${enrichedSettlements.length} settlement rows to CSV`);
    setTimeout(() => setExportNotice(null), 4000);
  };

  const handleExportTlcCSV = () => {
    if (orders && orders.length > 0) {
      const { filename, count } = downloadTlcCsv(orders, drivers);
      setExportNotice(`Exported ${count} trip records to ${filename} (TLC Base ${TLC_BASE_NUMBER})`);
      setTimeout(() => setExportNotice(null), 4000);
      return;
    }

    // Fallback if no order objects passed
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
    link.setAttribute('download', `${TLC_BASE_NUMBER}_settlements_${new Date().toISOString().split('T')[0]}.csv`);
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
            <h2 className="text-xl font-bold text-white tracking-tight">Finance & 15% Commission Ledger</h2>
            <span className="px-2 py-0.5 text-xs bg-emerald-500/20 text-emerald-400 rounded-full font-semibold border border-emerald-500/30">
              15% Fixed Brokerage Margin
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            5-Column Brokerage Breakdown: Rate • Copay • Total Fare • AT Comm (15%) • Driver Payout
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Export MTA 5-Column Financials CSV */}
          <button
            id="btn-finance-export-mta-csv"
            onClick={handleExportMtaFinancialsCSV}
            className="px-3.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 hover:text-emerald-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 border border-emerald-500/30 transition-colors shadow-sm"
            title="Download MTA Financials Breakdown CSV (5 Columns)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>MTA Financials CSV</span>
          </button>

          {/* Export TLC CSV */}
          <button
            id="btn-finance-export-tlc-csv"
            onClick={handleExportTlcCSV}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 border border-slate-700 hover:border-slate-600 transition-colors shadow-sm"
            title="Download Official NYC TLC FHV Trip Record CSV (Base B03669)"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>Export TLC CSV (B03669)</span>
          </button>
        </div>
      </div>

      {/* Export Notice Banner */}
      {exportNotice && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between transition-all">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{exportNotice}</span>
          </div>
          <span className="text-[11px] text-emerald-400/80 font-mono">TLC Base B03669 Compliant</span>
        </div>
      )}

      {/* Formula & Policy Card */}
      <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 text-xs space-y-2">
        <div className="flex items-center gap-2 text-white font-semibold">
          <Calculator className="w-4 h-4 text-emerald-400" />
          <span>MTA Brokerage 5-Column Financial Settlement Rules</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-slate-300">
          <div className="p-2.5 bg-slate-800/60 rounded-lg border border-slate-700/60">
            <span className="text-sky-400 font-semibold block text-[11px]">1. Total Fare Base</span>
            <div className="font-mono text-[11px] text-white mt-1">Total Fare = Rate + Copay</div>
            <span className="text-[10px] text-slate-400 block mt-0.5">Basis for 15% commission accrual</span>
          </div>
          <div className="p-2.5 bg-emerald-950/30 rounded-lg border border-emerald-700/40">
            <span className="text-emerald-400 font-semibold block text-[11px]">2. AT 15% Commission</span>
            <div className="font-mono text-[11px] text-emerald-300 mt-1">AT Comm = Total Fare × 15%</div>
            <span className="text-[10px] text-slate-400 block mt-0.5">Fixed platform margin rounded to cent</span>
          </div>
          <div className="p-2.5 bg-indigo-950/30 rounded-lg border border-indigo-700/40">
            <span className="text-indigo-300 font-semibold block text-[11px]">3. Driver Company Payout</span>
            <div className="font-mono text-[11px] text-indigo-200 mt-1">Driver Payout = Rate − AT Comm</div>
            <span className="text-[10px] text-slate-400 block mt-0.5">Copay is in driver's pocket in cash</span>
          </div>
        </div>
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
            ${stats ? stats.totalGrossRevenueToday.toFixed(2) : totalFare.toFixed(2)}
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
            {showCommission ? `$${(stats ? stats.atCommissionToday : totalAtCommission).toFixed(2)}` : 'Restricted'}
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
            ${stats ? stats.brokerRevenue.toFixed(2) : totalRate.toFixed(2)}
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

      {/* Interactive Financial Charts & Visualizer */}
      <FinanceCharts 
        settlements={enrichedSettlements}
        orders={orders}
        showCommission={showCommission}
      />

      {/* MTA Paratransit 5-Column Financial Breakdown & Settlement Ledger */}
      <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">
                MTA Brokerage Trips Breakdown & 15% Commission Ledger
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                5-Column Format
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Breakdown order: <strong>Rate</strong> | <strong>Copay</strong> | <strong>Total Fare</strong> | <strong>AT Commission (15%)</strong> | <strong>Driver Payout</strong>
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
                <th className="px-3.5 py-3">Order #</th>
                <th className="px-3.5 py-3">Broker Partner</th>
                <th className="px-3.5 py-3">Date</th>
                <th className="px-3.5 py-3 text-white bg-slate-800/40">1. Rate</th>
                <th className="px-3.5 py-3 text-amber-300 bg-amber-500/5">2. Copay</th>
                <th className="px-3.5 py-3 text-sky-300 bg-sky-500/5">3. Total Fare</th>
                <th className="px-3.5 py-3 text-emerald-300 bg-emerald-500/5">4. AT Comm (15%)</th>
                <th className="px-3.5 py-3 text-indigo-300 bg-indigo-500/5">5. Driver Payout</th>
                <th className="px-3.5 py-3">Status</th>
                <th className="px-3.5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {enrichedSettlements.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-slate-500 font-sans">
                    No commission settlement records match filter.
                  </td>
                </tr>
              ) : (
                enrichedSettlements.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-3.5 py-3 font-semibold text-white font-mono">
                      {item.orderNumber}
                    </td>
                    <td className="px-3.5 py-3 font-sans font-medium text-slate-200">
                      {item.brokerName}
                    </td>
                    <td className="px-3.5 py-3 text-slate-400 font-sans text-[11px]">
                      {item.tripDate}
                    </td>
                    <td className="px-3.5 py-3 font-bold text-white bg-slate-800/20">
                      ${item.rate.toFixed(2)}
                    </td>
                    <td className="px-3.5 py-3 font-bold text-amber-300 bg-amber-500/5">
                      ${item.copay.toFixed(2)}
                    </td>
                    <td className="px-3.5 py-3 font-bold text-sky-300 bg-sky-500/5">
                      ${item.totalFare.toFixed(2)}
                    </td>
                    <td className="px-3.5 py-3 font-bold text-emerald-400 bg-emerald-500/5">
                      {showCommission ? `+$${item.atCommission15Pct.toFixed(2)}` : (
                        <span className="text-slate-500 font-sans text-[10px] flex items-center gap-0.5">
                          <Lock className="w-2.5 h-2.5" /> Restricted
                        </span>
                      )}
                    </td>
                    <td className="px-3.5 py-3 font-bold text-indigo-300 bg-indigo-500/5">
                      {showCommission ? `$${item.driverPayout.toFixed(2)}` : (
                        <span className="text-slate-500 font-sans text-[10px] flex items-center gap-0.5">
                          <Lock className="w-2.5 h-2.5" /> Restricted
                        </span>
                      )}
                    </td>
                    <td className="px-3.5 py-3 font-sans">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        item.status === 'settled' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        item.status === 'invoiced' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' :
                        'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {item.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-3.5 py-3 text-right font-sans">
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

            {/* Column Totals Row */}
            {enrichedSettlements.length > 0 && (
              <tfoot className="bg-slate-800/90 font-mono text-xs border-t-2 border-slate-700">
                <tr>
                  <td colSpan={3} className="px-3.5 py-3 text-right font-sans font-bold text-slate-300 uppercase tracking-wider">
                    Total Ledger Sums:
                  </td>
                  <td className="px-3.5 py-3 font-bold text-white bg-slate-900/40">
                    ${totalRate.toFixed(2)}
                  </td>
                  <td className="px-3.5 py-3 font-bold text-amber-300 bg-amber-950/20">
                    ${totalCopay.toFixed(2)}
                  </td>
                  <td className="px-3.5 py-3 font-bold text-sky-300 bg-sky-950/20">
                    ${totalFare.toFixed(2)}
                  </td>
                  <td className="px-3.5 py-3 font-bold text-emerald-400 bg-emerald-950/20">
                    {showCommission ? `+$${totalAtCommission.toFixed(2)}` : '—'}
                  </td>
                  <td className="px-3.5 py-3 font-bold text-indigo-300 bg-indigo-950/20">
                    {showCommission ? `$${totalDriverPayout.toFixed(2)}` : '—'}
                  </td>
                  <td colSpan={2} className="px-3.5 py-3 font-sans text-slate-400 text-[11px]">
                    {enrichedSettlements.length} total orders
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};
