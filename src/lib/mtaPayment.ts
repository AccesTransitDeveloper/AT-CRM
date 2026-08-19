import { Order, CommissionSettlement, UserRole } from '../types';

export interface MtaPaymentBreakdown {
  rate: number;          // Base fare paid by broker
  copay: number;         // Passenger cash copay paid directly to driver
  totalFare: number;     // Rate + Copay
  atCommission: number;  // Total Fare * 0.15 (rounded to cent)
  atCommission15Pct: number; // Total Fare * 0.15 (rounded to cent)
  driverPayout: number;  // Rate - atCommission
  atCommissionRate: number; // e.g. 0.15
}

/**
 * Calculates the exact 5-column financial breakdown for MTA Broker trips:
 * 1. Rate: Base trip fare paid by broker
 * 2. Copay: Cash copay paid directly by passenger to driver
 * 3. Total Fare = Rate + Copay
 * 4. AT Commission (15%) = Total Fare * commissionRate (rounded to 2 decimal places)
 * 5. Driver Payout = Rate - AT Commission (Copay is NOT deducted from Rate, since driver keeps cash directly)
 *
 * Check: AT Commission + Driver Payout = Rate (always exact to the cent).
 */
export function calculateMtaPaymentBreakdown(
  rateInput: number | string | undefined,
  copayInput: number | string | undefined,
  commissionRate: number = 0.15
): MtaPaymentBreakdown {
  const rate = Math.max(0, typeof rateInput === 'number' ? rateInput : parseFloat(String(rateInput || '0')) || 0);
  const copay = Math.max(0, typeof copayInput === 'number' ? copayInput : parseFloat(String(copayInput || '0')) || 0);
  
  // Total Fare = Rate + Copay (rounded to cent)
  const totalFare = Math.round((rate + copay) * 100) / 100;
  
  // AT Commission = Total Fare * commissionRate (rounded to cent)
  const atCommission = Math.round(totalFare * commissionRate * 100) / 100;
  
  // Driver Payout = Rate - atCommission (rounded to cent)
  const driverPayout = Math.round((rate - atCommission) * 100) / 100;

  return {
    rate: Math.round(rate * 100) / 100,
    copay: Math.round(copay * 100) / 100,
    totalFare,
    atCommission,
    atCommission15Pct: atCommission,
    driverPayout,
    atCommissionRate: commissionRate
  };
}

/**
 * Checks if the user role is authorized to view AT Commission and Driver Payout.
 * Dispatchers only see Rate, Copay, and Total Fare.
 */
export function canViewMtaCommissionAndPayout(role?: UserRole | string): boolean {
  if (!role) return false;
  const privilegedRoles = ['admin', 'super_admin', 'director', 'finance', 'finance_manager', 'operations_manager'];
  return privilegedRoles.includes(role.toLowerCase());
}

/**
 * Checks if the user role is authorized to edit Rate and Copay on an order.
 */
export function canEditMtaFinancials(role?: UserRole | string): boolean {
  if (!role) return false;
  const privilegedRoles = ['admin', 'super_admin', 'director', 'finance', 'finance_manager', 'operations_manager'];
  return privilegedRoles.includes(role.toLowerCase());
}

/**
 * Exports internal AT Financial Broker Report CSV with all 5 columns.
 */
export function downloadMtaFinancialCsv(
  orders: Order[],
  brokersFilter: string = 'all',
  filenamePrefix: string = 'AT_Financial_Broker_Report'
): { filename: string; count: number } {
  const mtaOrders = orders.filter(o => o.type === 'mta_broker' || o.source === 'broker');
  
  const headers = [
    'Order Number',
    'Broker Partner',
    'Passenger Name',
    'Passenger Phone',
    'Driver Name',
    'Vehicle / WAV',
    'Trip Date',
    'Pickup Address',
    'Dropoff Address',
    'Rate ($)',
    'Copay ($)',
    'Total Fare ($)',
    'AT Commission 15% ($)',
    'Driver Payout ($)',
    'Status',
    'Broker Confirmation Status'
  ];

  let sumRate = 0;
  let sumCopay = 0;
  let sumTotalFare = 0;
  let sumCommission = 0;
  let sumDriverPayout = 0;

  const rows = mtaOrders.map(order => {
    const rate = order.rate !== undefined ? order.rate : Math.max(0, (order.fareAmount || 0) - (order.copay || 0));
    const copay = order.copay || 0;
    const totalFare = order.fareAmount || (rate + copay);
    const commission = order.atCommissionAmount || Math.round(totalFare * (order.atCommissionRate || 0.15) * 100) / 100;
    const driverPayout = order.driverPayout !== undefined ? order.driverPayout : Math.round((rate - commission) * 100) / 100;

    sumRate += rate;
    sumCopay += copay;
    sumTotalFare += totalFare;
    sumCommission += commission;
    sumDriverPayout += driverPayout;

    const dateStr = order.createdAt ? new Date(order.createdAt).toISOString().split('T')[0] : 'N/A';

    return [
      order.orderNumber,
      `"${(order.brokerName || 'N/A').replace(/"/g, '""')}"`,
      `"${(order.passengerName || 'N/A').replace(/"/g, '""')}"`,
      `"${(order.passengerPhone || 'N/A').replace(/"/g, '""')}"`,
      `"${(order.driverName || 'Unassigned').replace(/"/g, '""')}"`,
      `"${order.vehicleType} ${order.requiresWav ? 'WAV' : ''}"`,
      dateStr,
      `"${(order.pickupAddress || '').replace(/"/g, '""')}"`,
      `"${(order.dropoffAddress || '').replace(/"/g, '""')}"`,
      rate.toFixed(2),
      copay.toFixed(2),
      totalFare.toFixed(2),
      commission.toFixed(2),
      driverPayout.toFixed(2),
      order.status,
      order.brokerConfirmationStatus || 'N/A'
    ];
  });

  // Summary row
  const summaryRow = [
    'TOTALS / SUMMARY',
    `"${mtaOrders.length} trips"`,
    '""',
    '""',
    '""',
    '""',
    '""',
    '""',
    '""',
    sumRate.toFixed(2),
    sumCopay.toFixed(2),
    sumTotalFare.toFixed(2),
    sumCommission.toFixed(2),
    sumDriverPayout.toFixed(2),
    '""',
    '""'
  ];

  const csvRows = [headers.join(','), ...rows.map(r => r.join(',')), summaryRow.join(',')];
  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + csvRows.join('\n');
  const encodedUri = encodeURI(csvContent);

  const dateTag = new Date().toISOString().split('T')[0];
  const filename = `${filenamePrefix}_${dateTag}.csv`;

  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  return { filename, count: mtaOrders.length };
}
