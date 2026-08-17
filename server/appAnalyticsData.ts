import {
  AppTarget,
  AppMetadataInfo,
  AppDailyMetric,
  AppFunnelStep,
  AppTrafficSource,
  AppCohortRow,
  AppReview,
  AppSentimentSummary,
  AppAiRecommendation
} from '../src/types';

export const APP_METADATA_LIST: AppMetadataInfo[] = [
  {
    id: 'client_android',
    title: 'Accessible Transit: NYC Rider',
    shortTitle: 'Client Android',
    audience: 'client',
    platform: 'android',
    storeName: 'Google Play Store',
    packageOrBundleId: 'com.accessibletransit.rider.android',
    version: 'v2.4.1 (Build 184)',
    rating: 4.7,
    ratingCount: 1420,
    iconBg: 'from-emerald-600 to-teal-700',
    accentColor: 'emerald'
  },
  {
    id: 'driver_android',
    title: 'AT Driver: Queens TLC Base',
    shortTitle: 'Driver Android',
    audience: 'driver',
    platform: 'android',
    storeName: 'Google Play Store',
    packageOrBundleId: 'com.accessibletransit.driver.android',
    version: 'v2.3.0 (Build 128)',
    rating: 4.6,
    ratingCount: 580,
    iconBg: 'from-amber-600 to-orange-700',
    accentColor: 'amber'
  },
  {
    id: 'client_ios',
    title: 'Accessible Transit Rider NYC',
    shortTitle: 'Client iOS',
    audience: 'client',
    platform: 'ios',
    storeName: 'Apple App Store',
    packageOrBundleId: 'com.accessibletransit.rider.ios',
    version: 'v2.4.2 (Build 202)',
    rating: 4.8,
    ratingCount: 2190,
    iconBg: 'from-sky-600 to-blue-700',
    accentColor: 'sky'
  },
  {
    id: 'driver_ios',
    title: 'AT Driver NYC — TLC Dispatch',
    shortTitle: 'Driver iOS',
    audience: 'driver',
    platform: 'ios',
    storeName: 'Apple App Store',
    packageOrBundleId: 'com.accessibletransit.driver.ios',
    version: 'v2.2.8 (Build 96)',
    rating: 4.5,
    ratingCount: 390,
    iconBg: 'from-purple-600 to-indigo-700',
    accentColor: 'purple'
  }
];

// Helper to generate past dates
function getPastDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

// Generate 30 days of realistic daily metrics for all 4 apps
export function generateInitialDailyMetrics(): AppDailyMetric[] {
  const metrics: AppDailyMetric[] = [];

  const baseProfiles = {
    client_android: {
      installsRange: [55, 95],
      dauMultiplier: 18.5,
      regRate: 0.76,
      firstActionRate: 0.52,
      d1: 42,
      d7: 28,
      d30: 19
    },
    driver_android: {
      installsRange: [15, 32],
      dauMultiplier: 14.2,
      regRate: 0.68,
      firstActionRate: 0.44, // Driver TLC upload & activation
      d1: 58,
      d7: 46,
      d30: 38
    },
    client_ios: {
      installsRange: [80, 140],
      dauMultiplier: 22.0,
      regRate: 0.82,
      firstActionRate: 0.58,
      d1: 48,
      d7: 34,
      d30: 24
    },
    driver_ios: {
      installsRange: [10, 24],
      dauMultiplier: 12.8,
      regRate: 0.64,
      firstActionRate: 0.41,
      d1: 54,
      d7: 42,
      d30: 34
    }
  };

  const appIds: AppTarget[] = ['client_android', 'driver_android', 'client_ios', 'driver_ios'];

  for (let daysAgo = 29; daysAgo >= 0; daysAgo--) {
    const dateStr = getPastDate(daysAgo);
    const dayOfWeek = new Date(dateStr).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    appIds.forEach(appId => {
      if (appId === 'all') return;
      const profile = baseProfiles[appId];
      const isClient = appId.includes('client');

      // Weekend boosts client rides, weekday boosts driver logins
      const dayFactor = isClient ? (isWeekend ? 1.25 : 0.95) : (isWeekend ? 0.85 : 1.1);
      const minInst = profile.installsRange[0];
      const maxInst = profile.installsRange[1];
      const rawInstalls = Math.floor((minInst + Math.random() * (maxInst - minInst)) * dayFactor);
      
      const installs = Math.max(5, rawInstalls);
      const dau = Math.round(installs * profile.dauMultiplier * (0.9 + Math.random() * 0.2));
      const wau = Math.round(dau * 3.4);
      const mau = Math.round(dau * 7.8);

      const registrations = Math.round(installs * (profile.regRate + (Math.random() * 0.06 - 0.03)));
      const firstActions = Math.round(registrations * (profile.firstActionRate + (Math.random() * 0.05 - 0.02)));

      metrics.push({
        id: `met-${appId}-${dateStr}`,
        appId,
        date: dateStr,
        installs,
        dau,
        wau,
        mau,
        registrations,
        firstActions,
        retainedD1: Math.round(profile.d1 + (Math.random() * 4 - 2)),
        retainedD7: Math.round(profile.d7 + (Math.random() * 4 - 2)),
        retainedD30: Math.round(profile.d30 + (Math.random() * 3 - 1.5)),
        crashes: Math.floor(Math.random() * 3),
        uninstalls: Math.round(installs * 0.08 + Math.random() * 2),
        adSpend: Math.round(installs * (isClient ? 4.2 : 18.5))
      });
    });
  }

  return metrics;
}

// Initial traffic sources and ad campaigns
export const initialAppTrafficSources: AppTrafficSource[] = [
  {
    id: 'src-01',
    appId: 'client_ios',
    campaignName: 'Apple Search Ads — "NYC Taxi & WAV Jackson Heights"',
    channel: 'Apple Search Ads',
    spend: 2840,
    installs: 620,
    cac: 4.58,
    firstActions: 412,
    firstActionRate: 66.45,
    costPerActiveUser: 6.89,
    revenueAttributed: 18450,
    roi: 549.6,
    status: 'active',
    period: 'Last 30 Days'
  },
  {
    id: 'src-02',
    appId: 'client_android',
    campaignName: 'Google Ads UAC — Queens & Brooklyn Transit Keywords',
    channel: 'Google Ads',
    spend: 2150,
    installs: 590,
    cac: 3.64,
    firstActions: 348,
    firstActionRate: 58.98,
    costPerActiveUser: 6.18,
    revenueAttributed: 12900,
    roi: 500.0,
    status: 'active',
    period: 'Last 30 Days'
  },
  {
    id: 'src-03',
    appId: 'client_ios',
    campaignName: 'Meta Ads (IG Reels) — Queens Wheelchair Accessible Travel',
    channel: 'Meta Ads',
    spend: 1890,
    installs: 410,
    cac: 4.61,
    firstActions: 235,
    firstActionRate: 57.32,
    costPerActiveUser: 8.04,
    revenueAttributed: 9870,
    roi: 422.2,
    status: 'active',
    period: 'Last 30 Days'
  },
  {
    id: 'src-04',
    appId: 'driver_android',
    campaignName: 'Google Search Ads — "TLC Driver 15% Commission Base Queens"',
    channel: 'Google Ads',
    spend: 1650,
    installs: 142,
    cac: 11.62,
    firstActions: 88,
    firstActionRate: 61.97,
    costPerActiveUser: 18.75,
    revenueAttributed: 26400,
    roi: 1500.0,
    status: 'active',
    period: 'Last 30 Days'
  },
  {
    id: 'src-05',
    appId: 'driver_ios',
    campaignName: 'Meta Ads — Facebook Group NYC TLC Drivers Hub',
    channel: 'Meta Ads',
    spend: 980,
    installs: 74,
    cac: 13.24,
    firstActions: 39,
    firstActionRate: 52.70,
    costPerActiveUser: 25.13,
    revenueAttributed: 11700,
    roi: 1093.8,
    status: 'active',
    period: 'Last 30 Days'
  },
  {
    id: 'src-06',
    appId: 'client_android',
    campaignName: 'TikTok Promo — Affordable Paratransit & Airport Rides',
    channel: 'TikTok',
    spend: 1120,
    installs: 390,
    cac: 2.87,
    firstActions: 164,
    firstActionRate: 42.05,
    costPerActiveUser: 6.83,
    revenueAttributed: 4920,
    roi: 339.3,
    status: 'active',
    period: 'Last 30 Days'
  },
  {
    id: 'src-07',
    appId: 'client_ios',
    campaignName: 'MTA TripLink / MyLe Hospital Referral Links',
    channel: 'MTA Referral',
    spend: 350,
    installs: 310,
    cac: 1.13,
    firstActions: 268,
    firstActionRate: 86.45,
    costPerActiveUser: 1.31,
    revenueAttributed: 21440,
    roi: 6025.7,
    status: 'active',
    period: 'Last 30 Days'
  },
  {
    id: 'src-08',
    appId: 'driver_android',
    campaignName: 'Queens Community & TLC Dispatch Hub Flyers (Woodside & Jamaica)',
    channel: 'Queens Community / Flyers',
    spend: 420,
    installs: 95,
    cac: 4.42,
    firstActions: 71,
    firstActionRate: 74.74,
    costPerActiveUser: 5.92,
    revenueAttributed: 21300,
    roi: 4971.4,
    status: 'active',
    period: 'Last 30 Days'
  },
  {
    id: 'src-09',
    appId: 'client_android',
    campaignName: 'Organic Direct Play Store Search & Word-of-Mouth',
    channel: 'Organic / Direct Search',
    spend: 0,
    installs: 840,
    cac: 0.00,
    firstActions: 540,
    firstActionRate: 64.28,
    costPerActiveUser: 0.00,
    revenueAttributed: 24300,
    roi: 0.0,
    status: 'active',
    period: 'Last 30 Days'
  },
  {
    id: 'src-10',
    appId: 'client_ios',
    campaignName: 'Organic App Store Search (NYC WAV, Green Cab, JFK Airport)',
    channel: 'Organic / Direct Search',
    spend: 0,
    installs: 1210,
    cac: 0.00,
    firstActions: 860,
    firstActionRate: 71.07,
    costPerActiveUser: 0.00,
    revenueAttributed: 43000,
    roi: 0.0,
    status: 'active',
    period: 'Last 30 Days'
  }
];

// Cohort analysis data
export const initialAppCohorts: AppCohortRow[] = [
  // Client apps cohorts
  {
    cohortWeek: 'W32 (Aug 10 - Aug 16)',
    appId: 'client_ios',
    audience: 'client',
    totalInstalls: 890,
    day1Pct: 52.4,
    day7Pct: 38.1,
    day14Pct: 31.0,
    day30Pct: 25.8
  },
  {
    cohortWeek: 'W31 (Aug 3 - Aug 9)',
    appId: 'client_ios',
    audience: 'client',
    totalInstalls: 840,
    day1Pct: 50.8,
    day7Pct: 36.4,
    day14Pct: 29.5,
    day30Pct: 24.2
  },
  {
    cohortWeek: 'W30 (Jul 27 - Aug 2)',
    appId: 'client_android',
    audience: 'client',
    totalInstalls: 610,
    day1Pct: 44.2,
    day7Pct: 29.8,
    day14Pct: 23.4,
    day30Pct: 19.5
  },
  {
    cohortWeek: 'W29 (Jul 20 - Jul 26)',
    appId: 'client_android',
    audience: 'client',
    totalInstalls: 580,
    day1Pct: 43.1,
    day7Pct: 28.5,
    day14Pct: 22.0,
    day30Pct: 18.2
  },
  // Driver apps cohorts (Drivers have higher long-term retention once onboarded)
  {
    cohortWeek: 'W32 (Aug 10 - Aug 16)',
    appId: 'driver_android',
    audience: 'driver',
    totalInstalls: 180,
    day1Pct: 62.8,
    day7Pct: 51.2,
    day14Pct: 46.0,
    day30Pct: 41.5
  },
  {
    cohortWeek: 'W31 (Aug 3 - Aug 9)',
    appId: 'driver_android',
    audience: 'driver',
    totalInstalls: 165,
    day1Pct: 60.5,
    day7Pct: 49.0,
    day14Pct: 44.2,
    day30Pct: 39.8
  },
  {
    cohortWeek: 'W30 (Jul 27 - Aug 2)',
    appId: 'driver_ios',
    audience: 'driver',
    totalInstalls: 110,
    day1Pct: 56.4,
    day7Pct: 44.8,
    day14Pct: 39.1,
    day30Pct: 35.0
  },
  {
    cohortWeek: 'W29 (Jul 20 - Jul 26)',
    appId: 'driver_ios',
    audience: 'driver',
    totalInstalls: 98,
    day1Pct: 55.0,
    day7Pct: 43.0,
    day14Pct: 38.2,
    day30Pct: 33.5
  }
];

// App Store & Google Play Reviews
export const initialAppReviews: AppReview[] = [
  {
    id: 'rev-01',
    appId: 'client_ios',
    store: 'Apple App Store',
    rating: 5,
    author: 'Elena Rostova (Jackson Heights)',
    date: '2026-08-14',
    appVersion: '2.4.2',
    sentiment: 'positive',
    reviewText: 'Booking wheelchair accessible rides in Queens is finally stress-free. Driver Tariq was on time, secured the ramp with care, and fare was transparent with Apple Pay.',
    topicTag: 'WAV & Accessibility',
    devResponse: 'Thank you Elena! We are proud to serve our Queens community with dedicated WAV certified drivers.'
  },
  {
    id: 'rev-02',
    appId: 'client_android',
    store: 'Google Play Store',
    rating: 2,
    author: 'Marcus Vance',
    date: '2026-08-12',
    appVersion: '2.4.1',
    sentiment: 'negative',
    reviewText: 'Pickup address pin kept drifting away when I selected Jamaica Hospital Medical Center. Had to cancel and call support desk.',
    topicTag: 'GPS / Address Geocoding',
    devResponse: 'Hi Marcus, we patched the geocoding pin-drop in v2.4.2 to snap directly to MTA hospital entrances.'
  },
  {
    id: 'rev-03',
    appId: 'driver_android',
    store: 'Google Play Store',
    rating: 5,
    author: 'Khurram Shahzad',
    date: '2026-08-11',
    appVersion: '2.3.0',
    sentiment: 'positive',
    reviewText: 'Best TLC dispatch app in Queens! 15% commission is way better than Uber 28%, and AT AI Voice dispatch automatically sends job alerts right to my headset.',
    topicTag: '15% Commission & AT AI Voice'
  },
  {
    id: 'rev-04',
    appId: 'driver_ios',
    store: 'Apple App Store',
    rating: 3,
    author: 'Dmitri V.',
    date: '2026-08-09',
    appVersion: '2.2.8',
    sentiment: 'neutral',
    reviewText: 'The app works fine on iOS 18, but document upload for TLC renewal photo took 3 attempts to pass the blur check.',
    topicTag: 'TLC Document Upload & OCR',
    devResponse: 'Thanks Dmitri. Our AI OCR auto-enhancement feature is now rolling out to detect lighting before snap.'
  },
  {
    id: 'rev-05',
    appId: 'client_android',
    store: 'Google Play Store',
    rating: 5,
    author: 'Priya Sharma (Flushing)',
    date: '2026-08-08',
    appVersion: '2.4.1',
    sentiment: 'positive',
    reviewText: 'Used the MyLe brokerage voucher from our clinic. Ride was confirmed in 90 seconds. Clean Green Taxi vehicle!',
    topicTag: 'MTA Brokerage & Speed'
  },
  {
    id: 'rev-06',
    appId: 'driver_android',
    store: 'Google Play Store',
    rating: 2,
    author: 'Abdoulaye Diallo',
    date: '2026-08-05',
    appVersion: '2.3.0',
    sentiment: 'negative',
    reviewText: 'My account was locked for expired TLC diamond even though I submitted renewal receipt 2 days earlier. Need faster verification.',
    topicTag: 'Compliance Lock & Onboarding'
  },
  {
    id: 'rev-07',
    appId: 'client_ios',
    store: 'Apple App Store',
    rating: 4,
    author: 'Carmen Morales',
    date: '2026-08-03',
    appVersion: '2.4.2',
    sentiment: 'positive',
    reviewText: 'Great app, very easy to use for elderly parents in Kensington. Wish there was recurring weekly ride scheduling.',
    topicTag: 'Scheduled Bookings'
  }
];

// Sentiment summaries per app
export const initialAppSentimentSummaries: Record<string, AppSentimentSummary> = {
  client_ios: {
    appId: 'client_ios',
    avgRating: 4.8,
    totalReviews: 2190,
    positivePct: 88.5,
    neutralPct: 7.2,
    negativePct: 4.3,
    topComplaints: [
      { issue: 'Recurring / Scheduled weekly ride booking requested', count: 42, severity: 'medium' },
      { issue: 'Occasional payment authorization lag with Amex', count: 18, severity: 'low' },
      { issue: 'Ramp vehicle ETA during rush hours on Queens Blvd', count: 15, severity: 'medium' }
    ],
    topPraises: [
      { highlight: 'Courteous WAV certified drivers & ramp assistance', count: 320 },
      { highlight: 'Transparent Queens flat rates & Apple Pay integration', count: 245 },
      { highlight: 'Instant SMS & live GPS tracking for family members', count: 180 }
    ],
    ratingHistory: [
      { month: 'Mar 2026', rating: 4.6 },
      { month: 'Apr 2026', rating: 4.7 },
      { month: 'May 2026', rating: 4.7 },
      { month: 'Jun 2026', rating: 4.8 },
      { month: 'Jul 2026', rating: 4.8 },
      { month: 'Aug 2026', rating: 4.8 }
    ]
  },
  client_android: {
    appId: 'client_android',
    avgRating: 4.7,
    totalReviews: 1420,
    positivePct: 82.1,
    neutralPct: 10.4,
    negativePct: 7.5,
    topComplaints: [
      { issue: 'GPS pin-drop accuracy near large hospital complexes', count: 38, severity: 'high' },
      { issue: 'Google Pay biometrics prompt repeat on older Samsung devices', count: 22, severity: 'medium' },
      { issue: 'App reload needed when switching between Wi-Fi and 5G', count: 14, severity: 'low' }
    ],
    topPraises: [
      { highlight: 'Clean UI and lightweight APK size (under 18MB)', count: 210 },
      { highlight: 'Direct integration with MTA Paratransit & Medicaid vouchers', count: 195 },
      { highlight: 'Fast dispatch time in Jackson Heights & Jamaica', count: 160 }
    ],
    ratingHistory: [
      { month: 'Mar 2026', rating: 4.4 },
      { month: 'Apr 2026', rating: 4.5 },
      { month: 'May 2026', rating: 4.6 },
      { month: 'Jun 2026', rating: 4.6 },
      { month: 'Jul 2026', rating: 4.7 },
      { month: 'Aug 2026', rating: 4.7 }
    ]
  },
  driver_android: {
    appId: 'driver_android',
    avgRating: 4.6,
    totalReviews: 580,
    positivePct: 78.6,
    neutralPct: 12.8,
    negativePct: 8.6,
    topComplaints: [
      { issue: 'TLC document expiry lock prompt requires faster manual review', count: 28, severity: 'high' },
      { issue: 'Battery consumption during background location broadcast', count: 19, severity: 'medium' },
      { issue: 'Sound alert volume toggle needed for noisy vehicle cabins', count: 11, severity: 'low' }
    ],
    topPraises: [
      { highlight: 'Fair 15% commission vs 25-30% on competitor apps', count: 180 },
      { highlight: 'AT AI Voice dispatcher job offers directly via Bluetooth', count: 140 },
      { highlight: 'Weekly direct deposit payout reliability', count: 115 }
    ],
    ratingHistory: [
      { month: 'Mar 2026', rating: 4.3 },
      { month: 'Apr 2026', rating: 4.4 },
      { month: 'May 2026', rating: 4.5 },
      { month: 'Jun 2026', rating: 4.5 },
      { month: 'Jul 2026', rating: 4.6 },
      { month: 'Aug 2026', rating: 4.6 }
    ]
  },
  driver_ios: {
    appId: 'driver_ios',
    avgRating: 4.5,
    totalReviews: 390,
    positivePct: 74.5,
    neutralPct: 15.0,
    negativePct: 10.5,
    topComplaints: [
      { issue: 'Document OCR camera capture on iPhone 12/13 glare detection', count: 16, severity: 'high' },
      { issue: 'Apple CarPlay companion mode requested', count: 14, severity: 'low' },
      { issue: 'Night mode map contrast adjustment', count: 9, severity: 'low' }
    ],
    topPraises: [
      { highlight: 'Instant shift start & earnings breakdown transparency', count: 95 },
      { highlight: 'High concentration of profitable Queens & Airport orders', count: 82 },
      { highlight: 'Responsive dispatch support chat in app', count: 68 }
    ],
    ratingHistory: [
      { month: 'Mar 2026', rating: 4.2 },
      { month: 'Apr 2026', rating: 4.3 },
      { month: 'May 2026', rating: 4.4 },
      { month: 'Jun 2026', rating: 4.4 },
      { month: 'Jul 2026', rating: 4.5 },
      { month: 'Aug 2026', rating: 4.5 }
    ]
  }
};

// Initial AI Recommendations
export const initialAppAiRecommendations: AppAiRecommendation[] = [
  {
    id: 'rec-all-01',
    appId: 'all',
    generatedAt: '2026-08-16T04:15:00Z',
    summary: 'Cross-app diagnostic indicates strong retention among activated users, with primary acquisition friction concentrated in Driver Onboarding document uploads (42% dropoff) and Client First-Ride payment friction on Android (24% dropoff).',
    bottlenecks: [
      {
        title: 'Driver Onboarding: TLC License & Diamond Photo Verification Dropoff',
        step: 'Registration → First Accepted Trip',
        severity: 'high',
        dropoffRate: '42.8% Dropoff',
        description: 'New drivers download the app but abandon completion during the 4-document TLC compliance upload stage due to camera glare and manual review waiting times.',
        impact: 'Loss of ~48 qualified TLC drivers per week across Queens.'
      },
      {
        title: 'Client Android: Address Pin Drifting Near Medical Facilities',
        step: 'Registration → First Order',
        severity: 'medium',
        dropoffRate: '23.5% Dropoff',
        description: 'Paratransit passengers searching for hospital clinics in Jamaica & Flushing experience geocoding ambiguity, causing order abandonment.',
        impact: 'Estimated $14,200 in monthly lost gross bookings.'
      },
      {
        title: 'Marketing Channel Disparity: High CAC on TikTok vs High ROI on MTA Referrals',
        step: 'Campaign Spend Allocation',
        severity: 'medium',
        dropoffRate: '57.9% Non-converting installs on TikTok',
        description: 'TikTok campaigns generate high volume at low CAC ($2.87) but lowest activation rate (42%), whereas MTA referrals have 86.4% activation and 6,000% ROI.',
        impact: 'Suboptimal ad spend distribution ($1,120/mo on low-intent traffic).'
      }
    ],
    productImprovements: [
      {
        action: 'Deploy AI OCR Auto-Crop & Instant Quality Check on Driver Document Uploads',
        expectedImpact: '+18% Increase in Driver Onboarding Completion within 24 hours',
        effort: 'Medium',
        priority: 'P0'
      },
      {
        action: 'Implement Pre-set "Hospital & Transit Hub" Dropdown Geofences in Client Apps',
        expectedImpact: '-65% Reduction in rider address confusion & cancellations',
        effort: 'Low',
        priority: 'P0'
      },
      {
        action: 'Add 1-Click Repeat / Scheduled Rides for Dialysis & Paratransit Riders',
        expectedImpact: '+28% Increase in D30 Client Retention and LTV',
        effort: 'Medium',
        priority: 'P1'
      },
      {
        action: 'Introduce Driver In-App Live Chat with Dispatch for Immediate Document Clearance',
        expectedImpact: 'Reduce verification turnaround from 6 hours to 8 minutes',
        effort: 'Low',
        priority: 'P1'
      }
    ],
    adStrategyRecommendations: [
      {
        channel: 'MTA Referral & Hospital Clinic Partnerships',
        tactic: 'Expand QR-code physical display stands in Queens medical centers with direct app deep-linking',
        goal: 'Scale highest-LTV paratransit cohort at near-zero acquisition cost'
      },
      {
        channel: 'Apple Search Ads & Google Ads UAC',
        tactic: 'Double down on high-intent intent keywords ("Queens Wheelchair Cab", "JFK Accessible Ride", "15% TLC Base")',
        goal: 'Capture 75%+ first-trip conversion rate among iOS riders'
      },
      {
        channel: 'TikTok & General Social Video',
        tactic: 'Pivot ad creatives from generic taxi promos to specific "Driver 15% Commission vs 28% Big Tech" testimonial videos',
        goal: 'Boost driver install-to-first-trip rate above 60%'
      }
    ],
    prioritizationSummary: 'Immediate P0 focus on Driver Document OCR Onboarding flow and Hospital preset geocoding will yield the fastest growth in active fleet capacity and paratransit ride volume.'
  }
];

// Helper to calculate conversion funnel for any app or all apps
export function calculateFunnelForApp(
  metrics: AppDailyMetric[],
  appId: AppTarget = 'all'
): AppFunnelStep[] {
  const filtered = appId === 'all' ? metrics : metrics.filter(m => m.appId === appId);
  
  const totalInstalls = filtered.reduce((acc, m) => acc + m.installs, 0);
  const totalRegs = filtered.reduce((acc, m) => acc + m.registrations, 0);
  const totalFirstActions = filtered.reduce((acc, m) => acc + m.firstActions, 0);
  
  // Active users = users who retained at least Day 7
  const avgD7Retention = filtered.length > 0 
    ? filtered.reduce((acc, m) => acc + m.retainedD7, 0) / filtered.length 
    : 32;
  const totalActiveRetained = Math.round(totalFirstActions * (avgD7Retention / 100) * 1.8);

  const regDropoff = totalInstalls > 0 ? Math.round(((totalInstalls - totalRegs) / totalInstalls) * 1000) / 10 : 0;
  const firstActionDropoff = totalRegs > 0 ? Math.round(((totalRegs - totalFirstActions) / totalRegs) * 1000) / 10 : 0;
  const activeDropoff = totalFirstActions > 0 ? Math.round(((totalFirstActions - totalActiveRetained) / totalFirstActions) * 1000) / 10 : 0;

  const dropoffs = [
    { step: 'reg', rate: regDropoff },
    { step: 'firstAction', rate: firstActionDropoff },
    { step: 'active', rate: activeDropoff }
  ];
  const maxDropoff = dropoffs.reduce((max, cur) => cur.rate > max.rate ? cur : max, dropoffs[0]);

  const isDriver = appId.includes('driver');

  return [
    {
      stepId: 'install',
      name: '1. App Store / Play Install',
      description: 'Downloaded & opened application',
      count: totalInstalls,
      conversionFromInstallPct: 100,
      dropoffFromPrevPct: 0,
      isMaxDropoff: false
    },
    {
      stepId: 'registration',
      name: '2. Profile & Phone Registration',
      description: 'Phone SMS verified & profile saved',
      count: totalRegs,
      conversionFromInstallPct: totalInstalls > 0 ? Math.round((totalRegs / totalInstalls) * 1000) / 10 : 0,
      dropoffFromPrevPct: regDropoff,
      isMaxDropoff: maxDropoff.step === 'reg'
    },
    {
      stepId: 'first_action',
      name: isDriver ? '3. TLC Verified & First Accepted Ride' : '3. First Ride Booked & Completed',
      description: isDriver ? 'TLC documents verified and first trip accepted' : 'First ride completed in Queens/NYC',
      count: totalFirstActions,
      conversionFromInstallPct: totalInstalls > 0 ? Math.round((totalFirstActions / totalInstalls) * 1000) / 10 : 0,
      dropoffFromPrevPct: firstActionDropoff,
      isMaxDropoff: maxDropoff.step === 'firstAction'
    },
    {
      stepId: 'active_user',
      name: '4. Retained Active User (WAU/MAU)',
      description: isDriver ? 'Regular active driver (>= 8 trips/week)' : 'Repeat passenger (>= 2 rides/month)',
      count: totalActiveRetained,
      conversionFromInstallPct: totalInstalls > 0 ? Math.round((totalActiveRetained / totalInstalls) * 1000) / 10 : 0,
      dropoffFromPrevPct: activeDropoff,
      isMaxDropoff: maxDropoff.step === 'active'
    }
  ];
}
