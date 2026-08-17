import { 
  Driver, 
  Order, 
  DriverPayoutRecord, 
  DriverAiAssessment, 
  DriverFinancialAnalytics, 
  DriverActivityAnalytics, 
  AnalyticsTimeRange 
} from '../src/types';

// Seeded Driver Payouts History
export const initialDriverPayouts: DriverPayoutRecord[] = [
  // Tariq Al-Mansoor (drv-101)
  {
    id: 'pay-101-1',
    driverId: 'drv-101',
    date: '2026-08-14',
    amount: 1248.50,
    period: 'Aug 04 - Aug 10, 2026',
    status: 'settled',
    method: 'Direct Deposit (ACH)',
    referenceId: 'ACH-NY-8829104'
  },
  {
    id: 'pay-101-2',
    driverId: 'drv-101',
    date: '2026-08-07',
    amount: 1380.20,
    period: 'Jul 28 - Aug 03, 2026',
    status: 'settled',
    method: 'Direct Deposit (ACH)',
    referenceId: 'ACH-NY-8719202'
  },
  {
    id: 'pay-101-3',
    driverId: 'drv-101',
    date: '2026-07-31',
    amount: 1195.00,
    period: 'Jul 21 - Jul 27, 2026',
    status: 'settled',
    method: 'Direct Deposit (ACH)',
    referenceId: 'ACH-NY-8601938'
  },
  {
    id: 'pay-101-4',
    driverId: 'drv-101',
    date: '2026-08-16',
    amount: 340.80,
    period: 'Aug 11 - Aug 16, 2026 (Current)',
    status: 'processing',
    method: 'Weekly Batch',
    referenceId: 'BAT-2026-W33-101'
  },

  // Gulnara Karimova (drv-102)
  {
    id: 'pay-102-1',
    driverId: 'drv-102',
    date: '2026-08-14',
    amount: 980.40,
    period: 'Aug 04 - Aug 10, 2026',
    status: 'settled',
    method: 'Direct Deposit (ACH)',
    referenceId: 'ACH-NY-8829105'
  },
  {
    id: 'pay-102-2',
    driverId: 'drv-102',
    date: '2026-08-07',
    amount: 1045.00,
    period: 'Jul 28 - Aug 03, 2026',
    status: 'settled',
    method: 'Direct Deposit (ACH)',
    referenceId: 'ACH-NY-8719203'
  },
  {
    id: 'pay-102-3',
    driverId: 'drv-102',
    date: '2026-08-15',
    amount: 220.00,
    period: 'Aug 11 - Aug 15, 2026',
    status: 'pending',
    method: 'Instant Pay',
    referenceId: 'INST-2026-0815-102'
  },

  // Mateo Hernandez (drv-103)
  {
    id: 'pay-103-1',
    driverId: 'drv-103',
    date: '2026-08-14',
    amount: 890.00,
    period: 'Aug 04 - Aug 10, 2026',
    status: 'settled',
    method: 'Direct Deposit (ACH)',
    referenceId: 'ACH-NY-8829106'
  },
  {
    id: 'pay-103-2',
    driverId: 'drv-103',
    date: '2026-08-07',
    amount: 920.50,
    period: 'Jul 28 - Aug 03, 2026',
    status: 'settled',
    method: 'Direct Deposit (ACH)',
    referenceId: 'ACH-NY-8719204'
  },

  // Dmitry Volkov (drv-106)
  {
    id: 'pay-106-1',
    driverId: 'drv-106',
    date: '2026-01-30',
    amount: 760.00,
    period: 'Jan 19 - Jan 25, 2026',
    status: 'settled',
    method: 'Direct Deposit (ACH)',
    referenceId: 'ACH-NY-8109244'
  }
];

// Seeded AI Assessments History
export const initialDriverAiAssessments: Record<string, DriverAiAssessment[]> = {
  'drv-101': [
    {
      id: 'ai-eval-101-1',
      driverId: 'drv-101',
      date: '2026-08-16T09:30:00Z',
      riskLevel: 'low',
      verdict: 'Tariq Al-Mansoor demonstrates exemplary fleet reliability with an outstanding 4.95 rating, 94.2% acceptance rate, and zero wheelchair securement complaints across Queens paratransit runs.',
      observations: [
        {
          title: 'MTA Paratransit Excellence',
          detail: 'Maintains 98% on-time pickup window at Queens Hospital Center and Elmhurst Hospital.',
          type: 'positive'
        },
        {
          title: 'High Wheelchair Rider Satisfaction',
          detail: 'Over 65% of completed trips are motorized/manual WAV requests with 5.0 star feedback.',
          type: 'positive'
        },
        {
          title: 'Strict Queens Zone Adherence',
          detail: '96% of dispatches completed strictly in Jackson Heights, Flushing, and Jamaica.',
          type: 'positive'
        }
      ],
      recommendations: [
        'Keep as preferred primary dispatcher for scheduled MTA TripLink paratransit morning runs.',
        'Nominate for Quarterly Paratransit Safety Award and WAV driver mentoring program.',
        'Ensure upcoming TLC vehicle inspection renewal scheduled for October 2026.'
      ],
      confidenceScore: 97,
      dataSnapshot: {
        periodTrips: 118,
        acceptRate: 94.2,
        cancellationRate: 1.8,
        totalEarnings: 3824.70,
        avgRating: 4.95,
        complaintsCount: 0
      }
    },
    {
      id: 'ai-eval-101-prev',
      driverId: 'drv-101',
      date: '2026-07-15T14:10:00Z',
      riskLevel: 'low',
      verdict: 'Driver Tariq continues to rank in the top 5% of Queens WAV operators with strong earnings throughput and stable schedule availability.',
      observations: [
        {
          title: 'Stable Evening Availability',
          detail: 'Completed 34 peak evening hospital discharge dispatches with 100% completion rate.',
          type: 'positive'
        },
        {
          title: 'Zero Cancellation Streak',
          detail: '14 consecutive days without driver-initiated trip cancellation.',
          type: 'positive'
        }
      ],
      recommendations: [
        'Maintain current high dispatch tier for MyLe and TripLink medical broker orders.'
      ],
      confidenceScore: 95,
      dataSnapshot: {
        periodTrips: 96,
        acceptRate: 93.0,
        cancellationRate: 2.1,
        totalEarnings: 3105.00,
        avgRating: 4.94,
        complaintsCount: 0
      }
    }
  ],

  'drv-102': [
    {
      id: 'ai-eval-102-1',
      driverId: 'drv-102',
      date: '2026-08-15T11:00:00Z',
      riskLevel: 'low',
      verdict: 'Gulnara Karimova is a highly dependable Green Taxi operator in Jamaica and Flushing with a strong 4.88 rating and rapid average passenger pickup times.',
      observations: [
        {
          title: 'Strong Direct App Conversions',
          detail: '48% of trips booked via AT AI voice dispatcher with excellent passenger feedback.',
          type: 'positive'
        },
        {
          title: 'Slight Airport Delay in Evening Rush',
          detail: 'Minor delay spikes observed during JFK Terminal 4 runs between 5 PM - 7 PM on Fridays.',
          type: 'neutral'
        }
      ],
      recommendations: [
        'Suggest alternate Van Wyck expressway routing prompts via AT Driver App during Friday rush.',
        'Encourage WAV training certification if driver wishes to upgrade to higher-margin paratransit dispatches.'
      ],
      confidenceScore: 93,
      dataSnapshot: {
        periodTrips: 84,
        acceptRate: 91.5,
        cancellationRate: 3.2,
        totalEarnings: 2540.80,
        avgRating: 4.88,
        complaintsCount: 0
      }
    }
  ],

  'drv-103': [
    {
      id: 'ai-eval-103-1',
      driverId: 'drv-103',
      date: '2026-08-14T16:20:00Z',
      riskLevel: 'medium',
      verdict: 'Mateo Hernandez maintains a solid 4.98 rating on completed Black XL luxury trips, but exhibits an elevated 7.4% cancellation rate during weekend evening shifts.',
      observations: [
        {
          title: 'High Luxury Customer Rating',
          detail: 'Exceptional 4.98 rating on Suburban Premier trips with praise for cleanliness.',
          type: 'positive'
        },
        {
          title: 'Weekend Evening Cancellations',
          detail: 'Cancelled 4 dispatches over the last 14 days after initial acceptance.',
          type: 'warning'
        }
      ],
      recommendations: [
        'Conduct a brief dispatch check-in regarding evening cancellation reasons.',
        'Review driver acceptance timeout window to prevent accidental order drops.'
      ],
      confidenceScore: 91,
      dataSnapshot: {
        periodTrips: 52,
        acceptRate: 86.0,
        cancellationRate: 7.4,
        totalEarnings: 1980.50,
        avgRating: 4.98,
        complaintsCount: 1
      }
    }
  ],

  'drv-106': [
    {
      id: 'ai-eval-106-1',
      driverId: 'drv-106',
      date: '2026-08-10T10:15:00Z',
      riskLevel: 'high',
      verdict: 'Dmitry Volkov is currently suspended due to an expired TLC FHV commercial insurance policy and exhibits an elevated 11.2% cancellation rate prior to suspension.',
      observations: [
        {
          title: 'TLC Insurance Expired',
          detail: 'Commercial certificate lapsed on Jan 31, 2026. Account dispatch locked.',
          type: 'critical'
        },
        {
          title: 'Elevated Dispatch Rejection Rate',
          detail: 'Ignored or rejected 14 of 42 dispatches in Kensington and Jamaica prior to lock.',
          type: 'warning'
        }
      ],
      recommendations: [
        'Require verified TLC insurance certificate upload through Driver Portal before unblocking.',
        'Schedule mandatory safety & dispatch adherence review upon document verification.'
      ],
      confidenceScore: 96,
      dataSnapshot: {
        periodTrips: 28,
        acceptRate: 66.7,
        cancellationRate: 11.2,
        totalEarnings: 760.00,
        avgRating: 4.62,
        complaintsCount: 2
      }
    }
  ]
};

/**
 * Filter orders by driver and date range
 */
export function filterOrdersByDriverAndRange(
  orders: Order[],
  driverId: string,
  timeRange: AnalyticsTimeRange,
  startDate?: string,
  endDate?: string
): Order[] {
  const now = new Date('2026-08-16T12:00:00Z'); // normalized CRM system time

  return orders.filter(o => {
    if (o.driverId !== driverId) return false;

    const orderDate = new Date(o.createdAt || o.completedAt || '2026-08-16');
    const diffMs = now.getTime() - orderDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (timeRange === 'today') {
      return diffDays <= 1.0;
    } else if (timeRange === '7d') {
      return diffDays <= 7.0;
    } else if (timeRange === '30d') {
      return diffDays <= 30.0;
    } else if (timeRange === 'custom' && startDate) {
      const start = new Date(startDate);
      const end = endDate ? new Date(endDate + 'T23:59:59Z') : new Date();
      return orderDate >= start && orderDate <= end;
    }
    return true; // 'all'
  });
}

/**
 * Compute detailed Financial Analytics for a driver
 */
export function calculateDriverFinancials(
  driverId: string,
  orders: Order[],
  timeRange: AnalyticsTimeRange,
  startDate?: string,
  endDate?: string
): DriverFinancialAnalytics {
  const driverOrders = filterOrdersByDriverAndRange(orders, driverId, timeRange, startDate, endDate);
  const completedOrders = driverOrders.filter(o => o.status === 'completed' || o.status === 'on_trip');

  let totalDriverEarnings = 0;
  let totalAtCommission = 0;
  let atCommissionStandard = 0;
  let atCommissionBroker15Pct = 0;
  let totalGrossFare = 0;

  const channels = {
    app: { fare: 0, commission: 0, driverPayout: 0, count: 0, pct: 0 },
    atAi: { fare: 0, commission: 0, driverPayout: 0, count: 0, pct: 0 },
    broker: { fare: 0, commission: 0, driverPayout: 0, count: 0, pct: 0 }
  };

  const dailyMap: Record<string, { driverEarnings: number; atCommission: number; trips: number }> = {};

  // Build baseline dates for trend
  const numDays = timeRange === 'today' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 14;
  const baseDate = new Date('2026-08-16');

  for (let i = numDays - 1; i >= 0; i--) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    dailyMap[dateStr] = { driverEarnings: 0, atCommission: 0, trips: 0 };
  }

  for (const o of completedOrders) {
    const fare = o.fareAmount || 0;
    const comm = o.atCommissionAmount || fare * (o.atCommissionRate || 0.15);
    const payout = o.driverPayout || (fare - comm);

    totalGrossFare += fare;
    totalAtCommission += comm;
    totalDriverEarnings += payout;

    if (o.type === 'mta_broker') {
      atCommissionBroker15Pct += comm;
    } else {
      atCommissionStandard += comm;
    }

    // Channel grouping
    if (o.source === 'app') {
      channels.app.fare += fare;
      channels.app.commission += comm;
      channels.app.driverPayout += payout;
      channels.app.count += 1;
    } else if (o.source === 'at_ai') {
      channels.atAi.fare += fare;
      channels.atAi.commission += comm;
      channels.atAi.driverPayout += payout;
      channels.atAi.count += 1;
    } else {
      channels.broker.fare += fare;
      channels.broker.commission += comm;
      channels.broker.driverPayout += payout;
      channels.broker.count += 1;
    }

    // Trend grouping
    const dateStr = (o.completedAt || o.createdAt || '2026-08-16').split('T')[0];
    if (dailyMap[dateStr]) {
      dailyMap[dateStr].driverEarnings += payout;
      dailyMap[dateStr].atCommission += comm;
      dailyMap[dateStr].trips += 1;
    } else {
      dailyMap[dateStr] = { driverEarnings: payout, atCommission: comm, trips: 1 };
    }
  }

  const tripsCount = completedOrders.length;
  const avgFarePerTrip = tripsCount > 0 ? totalGrossFare / tripsCount : 0;

  // Compute percentages
  if (totalGrossFare > 0) {
    channels.app.pct = Math.round((channels.app.fare / totalGrossFare) * 100);
    channels.atAi.pct = Math.round((channels.atAi.fare / totalGrossFare) * 100);
    channels.broker.pct = Math.round((channels.broker.fare / totalGrossFare) * 100);
  }

  const trendData = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, val]) => {
      const parts = date.split('-');
      const label = `${parts[1]}/${parts[2]}`;
      return {
        date,
        label,
        driverEarnings: Number(val.driverEarnings.toFixed(2)),
        atCommission: Number(val.atCommission.toFixed(2)),
        trips: val.trips
      };
    });

  return {
    timeRange,
    totalDriverEarnings: Number(totalDriverEarnings.toFixed(2)),
    totalAtCommission: Number(totalAtCommission.toFixed(2)),
    atCommissionStandard: Number(atCommissionStandard.toFixed(2)),
    atCommissionBroker15Pct: Number(atCommissionBroker15Pct.toFixed(2)),
    totalGrossFare: Number(totalGrossFare.toFixed(2)),
    avgFarePerTrip: Number(avgFarePerTrip.toFixed(2)),
    tripsCount,
    channelsBreakdown: channels,
    trendData
  };
}

/**
 * Compute behavioral & activity analytics for a driver
 */
export function calculateDriverActivity(
  driver: Driver,
  orders: Order[],
  timeRange: AnalyticsTimeRange,
  startDate?: string,
  endDate?: string
): DriverActivityAnalytics {
  const driverOrders = filterOrdersByDriverAndRange(orders, driver.id, timeRange, startDate, endDate);

  const completedTrips = driverOrders.filter(o => o.status === 'completed' || o.status === 'on_trip').length;
  const cancelledByDriver = driverOrders.filter(o => o.status === 'cancelled').length;
  // Synthetic declined/ignored for realistic behavioral telemetry if small sample
  const declinedOrIgnored = Math.max(0, Math.round(completedTrips * 0.06));
  const totalAssigned = completedTrips + cancelledByDriver + declinedOrIgnored;

  const acceptRate = totalAssigned > 0
    ? Number((((totalAssigned - declinedOrIgnored) / totalAssigned) * 100).toFixed(1))
    : 100;

  const acceptedCount = Math.max(1, totalAssigned - declinedOrIgnored);
  const cancellationRate = Number(((cancelledByDriver / acceptedCount) * 100).toFixed(1));

  // Estimate online hours (e.g. ~45 mins per trip + idle wait time)
  const estimatedOnlineHours = Math.round(completedTrips * 0.85 + (driver.isOnline ? 6 : 2));

  // Neighborhood distribution
  const declaredBoroughs = driver.operatingBoroughs || ['Jackson Heights', 'Jamaica'];
  const neighborhoodCounts: Record<string, number> = {};

  for (const o of driverOrders) {
    const n = o.pickupNeighborhood || 'Jackson Heights';
    neighborhoodCounts[n] = (neighborhoodCounts[n] || 0) + 1;
  }

  // Fallback defaults if no recent orders in period
  if (Object.keys(neighborhoodCounts).length === 0) {
    declaredBoroughs.forEach(b => {
      neighborhoodCounts[b] = 1;
    });
  }

  const totalN = Object.values(neighborhoodCounts).reduce((a, b) => a + b, 0);
  let insideDeclaredCount = 0;

  const neighborhoodsWorked = Object.entries(neighborhoodCounts).map(([name, count]) => {
    const isDeclared = declaredBoroughs.some(b => b.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(b.toLowerCase()));
    if (isDeclared) insideDeclaredCount += count;
    const pct = totalN > 0 ? Math.round((count / totalN) * 100) : 0;
    return { name, count, pct, isDeclared };
  }).sort((a, b) => b.count - a.count);

  const coverageCompliancePct = totalN > 0 ? Math.round((insideDeclaredCount / totalN) * 100) : 100;

  // Hourly Activity (00:00 to 23:00)
  const hourlyActivity = Array.from({ length: 24 }, (_, h) => {
    const hourStr = `${h.toString().padStart(2, '0')}:00`;
    // Weight peak morning (7-10) and peak afternoon/evening (14-19)
    const isPeak = (h >= 7 && h <= 10) || (h >= 14 && h <= 19);
    const trips = Math.max(0, Math.round((completedTrips / 20) * (isPeak ? 1.8 : 0.4)));
    return { hour: hourStr, trips };
  });

  // Weekday Activity (Mon-Sun)
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weekdayActivity = days.map((day, idx) => {
    const isWeekend = idx >= 5;
    const trips = Math.max(0, Math.round(completedTrips / 7 * (isWeekend ? 0.8 : 1.1)));
    const hours = Math.max(0, Math.round(estimatedOnlineHours / 7 * (isWeekend ? 0.7 : 1.15)));
    return { day, trips, hours };
  });

  return {
    timeRange,
    totalAssigned,
    completedTrips,
    cancelledByDriver,
    declinedOrIgnored,
    acceptRate,
    cancellationRate,
    fleetAvgAcceptRate: 88.5,
    fleetAvgCancelRate: 4.2,
    estimatedOnlineHours,
    coverageCompliancePct,
    neighborhoodsWorked,
    hourlyActivity,
    weekdayActivity
  };
}

/**
 * Generate a rich historical order dataset for drivers so all charts & tables populate realistically
 */
export function generateHistoricalDriverOrders(): Order[] {
  const drivers = [
    { id: 'drv-101', name: 'Tariq Al-Mansoor', vehicle: 'WAV' as const, phone: '+1 (718) 555-0142' },
    { id: 'drv-102', name: 'Gulnara Karimova', vehicle: 'Green' as const, phone: '+1 (347) 555-8832' },
    { id: 'drv-103', name: 'Mateo Hernandez', vehicle: 'Black XL' as const, phone: '+1 (917) 555-3391' },
    { id: 'drv-104', name: 'Chen Wei', vehicle: 'Plus' as const, phone: '+1 (929) 555-7102' },
    { id: 'drv-105', name: 'Amara Diallo', vehicle: 'WAV' as const, phone: '+1 (646) 555-9018' },
    { id: 'drv-106', name: 'Dmitry Volkov', vehicle: 'Go' as const, phone: '+1 (718) 555-4420' }
  ];

  const neighborhoods = [
    { name: 'Jackson Heights', address: '82-11 37th Ave, Jackson Heights, NY 11372' },
    { name: 'Jamaica', address: '82-68 164th St (Queens Hospital Center), Jamaica, NY 11432' },
    { name: 'Flushing', address: '39-01 Main St, Flushing, NY 11354' },
    { name: 'Kensington', address: '350 Coney Island Ave, Kensington, Brooklyn, NY 11218' },
    { name: 'Astoria', address: '30-10 Broadway, Astoria, NY 11106' },
    { name: 'Long Island City', address: '28-02 Queens Plaza S, Long Island City, NY 11101' },
    { name: 'Forest Hills', address: '71-02 Austin St, Forest Hills, NY 11375' }
  ];

  const passengers = [
    { name: 'Eleanor Vance (MTA #4829)', phone: '+1 (718) 555-3819', isMta: true },
    { name: 'Carlos Ramirez', phone: '+1 (347) 555-9201', isMta: false },
    { name: 'Maria Santos (MyLe)', phone: '+1 (917) 555-4412', isMta: true },
    { name: 'James Fitzpatrick', phone: '+1 (646) 555-6619', isMta: false },
    { name: 'Arthur Pendelton', phone: '+1 (718) 555-1100', isMta: true },
    { name: 'Rosa Morales', phone: '+1 (929) 555-3341', isMta: true },
    { name: 'David Goldberg', phone: '+1 (718) 555-8822', isMta: false },
    { name: 'Fatima Zahra', phone: '+1 (347) 555-1940', isMta: true },
    { name: 'Robert Chen', phone: '+1 (917) 555-7761', isMta: false },
    { name: 'Grace O’Connor', phone: '+1 (646) 555-2299', isMta: true }
  ];

  const brokers = [
    { id: 'brk-01', name: 'TripLink Mobility (MTA Paratransit)' },
    { id: 'brk-02', name: 'MyLe Access Brokerage' },
    { id: 'brk-03', name: 'MetroCare Health Transit' }
  ];

  const generatedOrders: Order[] = [];
  const baseDate = new Date('2026-08-16T12:00:00Z');
  let orderCounter = 1000;

  // Generate for past 30 days
  for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
    const dateObj = new Date(baseDate);
    dateObj.setDate(dateObj.getDate() - dayOffset);
    const dateStr = dateObj.toISOString().split('T')[0];

    drivers.forEach((drv, drvIdx) => {
      // Drivers have different activity levels
      const tripsToday = drv.id === 'drv-101' ? (dayOffset < 14 ? 3 : 2) :
                         drv.id === 'drv-102' ? 2 :
                         drv.id === 'drv-103' ? (dayOffset % 2 === 0 ? 2 : 1) :
                         drv.id === 'drv-106' ? (dayOffset > 15 ? 1 : 0) :
                         1;

      for (let t = 0; t < tripsToday; t++) {
        orderCounter++;
        const pIdx = (drvIdx * 3 + dayOffset + t) % passengers.length;
        const pass = passengers[pIdx];
        const pPickup = neighborhoods[(pIdx + t) % neighborhoods.length];
        const pDropoff = neighborhoods[(pIdx + t + 2) % neighborhoods.length];

        const isBroker = pass.isMta || (t % 2 === 0 && drv.vehicle === 'WAV');
        const broker = isBroker ? brokers[(drvIdx + t) % brokers.length] : undefined;
        const source = isBroker ? 'broker' : (t % 3 === 0 ? 'at_ai' : 'app');
        const fare = Number((32.00 + (t * 7.5) + ((dayOffset % 5) * 4.2)).toFixed(2));
        const atCommRate = 0.15;
        const atCommissionAmount = Number((fare * atCommRate).toFixed(2));
        const driverPayout = Number((fare - atCommissionAmount).toFixed(2));

        // Status
        const isCancelled = dayOffset === 2 && t === 1 && (drv.id === 'drv-103' || drv.id === 'drv-106');
        const status = isCancelled ? 'cancelled' : 'completed';
        const hours = 8 + (t * 4);
        const isoTime = `${dateStr}T${hours.toString().padStart(2, '0')}:30:00Z`;

        generatedOrders.push({
          id: `ord-gen-${orderCounter}`,
          orderNumber: `AT-2026-${orderCounter}`,
          passengerName: pass.name,
          passengerPhone: pass.phone,
          pickupAddress: pPickup.address,
          pickupNeighborhood: pPickup.name,
          dropoffAddress: pDropoff.address,
          dropoffNeighborhood: pDropoff.name,
          driverId: drv.id,
          driverName: drv.name,
          driverPhone: drv.phone,
          vehicleType: drv.vehicle,
          requiresWav: drv.vehicle === 'WAV',
          status,
          type: isBroker ? 'mta_broker' : 'standard',
          source,
          brokerId: broker?.id,
          brokerName: broker?.name,
          brokerConfirmationStatus: isBroker ? 'confirmed' : undefined,
          fareAmount: fare,
          atCommissionRate: atCommRate,
          atCommissionAmount,
          driverPayout,
          createdAt: isoTime,
          updatedAt: isoTime,
          completedAt: status === 'completed' ? isoTime : undefined,
          notes: isCancelled ? 'Driver cancelled order due to vehicle mechanical check' : undefined,
          specialAssistanceNotes: drv.vehicle === 'WAV' ? 'Wheelchair ramp boarding assist required' : undefined
        });
      }
    });
  }

  return generatedOrders;
}
