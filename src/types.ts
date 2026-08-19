export type UserRole = 'admin' | 'driver_manager' | 'dispatcher' | 'support' | 'finance';

export type ActiveTab = 
  | 'drivers' 
  | 'compliance' 
  | 'orders' 
  | 'brokers' 
  | 'support' 
  | 'finance' 
  | 'marketing' 
  | 'app_analytics' 
  | 'referrals'
  | 'employees'
  | 'profile'
  | 'api';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}

export type DriverStatus = 'applied' | 'under_review' | 'active' | 'suspended' | 'rejected';

export type VehicleType = 'Green' | 'Go' | 'Plus' | 'XL' | 'Black' | 'Black XL' | 'WAV';

export type QueensNeighborhood = 
  | 'Jackson Heights' 
  | 'Jamaica' 
  | 'Flushing' 
  | 'Kensington' 
  | 'Astoria' 
  | 'Long Island City' 
  | 'Forest Hills' 
  | 'Woodside';

export interface DriverDocument {
  title: string;
  type: 'driver_license' | 'insurance' | 'registration' | 'tlc_diamond';
  fileUrl: string;
  isVerified: boolean;
  uploadedAt: string;
  expiryDate?: string;
}

export interface DriverTrip {
  id: string;
  orderId: string;
  date: string;
  pickup: string;
  dropoff: string;
  fare: number;
  atCommission: number;
  driverEarnings: number;
  rating?: number;
  vehicleType: VehicleType;
  passengerName: string;
  status: 'completed' | 'cancelled';
  cancellationReason?: string;
}

export type DriverRiskLevel = 'low' | 'medium' | 'high';

export interface DriverAiObservation {
  title: string;
  detail: string;
  type: 'positive' | 'warning' | 'critical' | 'neutral';
}

export interface DriverAiAssessment {
  id: string;
  driverId: string;
  date: string;
  riskLevel: DriverRiskLevel;
  verdict: string; // 2-3 sentences overview: reliable / requires attention / problematic and why
  observations: DriverAiObservation[];
  recommendations: string[]; // specific action steps for manager
  confidenceScore: number;
  dataSnapshot?: {
    periodTrips: number;
    acceptRate: number;
    cancellationRate: number;
    totalEarnings: number;
    avgRating: number;
    complaintsCount: number;
  };
}

export interface DriverPayoutRecord {
  id: string;
  driverId: string;
  date: string;
  amount: number;
  period: string;
  status: 'settled' | 'pending' | 'processing';
  method: 'Direct Deposit (ACH)' | 'Instant Pay' | 'Weekly Batch';
  referenceId: string;
}

export type AnalyticsTimeRange = 'today' | '7d' | '30d' | 'all' | 'custom';

export interface DriverFinancialAnalytics {
  timeRange: AnalyticsTimeRange;
  totalDriverEarnings: number;
  totalAtCommission: number;
  atCommissionStandard: number;
  atCommissionBroker15Pct: number;
  totalGrossFare: number;
  avgFarePerTrip: number;
  tripsCount: number;
  channelsBreakdown: {
    app: { fare: number; commission: number; driverPayout: number; count: number; pct: number };
    atAi: { fare: number; commission: number; driverPayout: number; count: number; pct: number };
    broker: { fare: number; commission: number; driverPayout: number; count: number; pct: number };
  };
  trendData: Array<{
    date: string;
    label: string;
    driverEarnings: number;
    atCommission: number;
    trips: number;
  }>;
}

export interface DriverActivityAnalytics {
  timeRange: AnalyticsTimeRange;
  totalAssigned: number;
  completedTrips: number;
  cancelledByDriver: number;
  declinedOrIgnored: number;
  acceptRate: number; // percentage
  cancellationRate: number; // percentage
  fleetAvgAcceptRate: number; // benchmark e.g. 88%
  fleetAvgCancelRate: number; // benchmark e.g. 4.5%
  estimatedOnlineHours: number;
  coverageCompliancePct: number; // % of trips done in declared boroughs
  neighborhoodsWorked: Array<{
    name: string;
    count: number;
    pct: number;
    isDeclared: boolean;
  }>;
  hourlyActivity: Array<{ hour: string; trips: number }>;
  weekdayActivity: Array<{ day: string; trips: number; hours: number }>;
}

export interface Driver {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  tlcLicenseNumber: string;
  vehicleType: VehicleType;
  vehicleMakeModel: string;
  vehiclePlate: string;
  vehicleYear: number;
  isWheelchairAccessible: boolean;
  documents: {
    driverLicense: string;
    insurance: string;
    registration: string;
    tlcDiamond?: string;
  };
  operatingBoroughs: string[];
  status: DriverStatus;
  rejectionReason?: string;
  rating: number;
  totalTrips: number;
  joinedDate: string;
  currentLocation?: {
    neighborhood: string;
    lat: number;
    lng: number;
    lastUpdated: string;
  };
  isOnline: boolean;
  notes?: string;
  avatarUrl?: string;
  latestRiskLevel?: DriverRiskLevel;
  acceptRate?: number;
  cancellationRate?: number;
  weeklyHoursOnline?: number;
}

export type OrderType = 'standard' | 'mta_broker';

export type OrderSource = 'app' | 'at_ai' | 'broker';

export type OrderStatus = 'created' | 'driver_assigned' | 'en_route' | 'on_trip' | 'completed' | 'cancelled';

export type BrokerConfirmationStatus = 'finding_driver' | 'sent_to_broker' | 'confirmed';

export type ProximityCallStatus = 'pending' | 'calling' | 'completed' | 'failed' | 'cancelled';
export type ProximityCallResult = 'confirmed' | 'cancelled_by_passenger' | 'no_answer' | 'failed';

export interface Order {
  id: string;
  orderNumber: string;
  passengerName: string;
  passengerPhone: string;
  pickupAddress: string;
  pickupNeighborhood: string;
  dropoffAddress: string;
  dropoffNeighborhood: string;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  vehicleType: VehicleType;
  requiresWav: boolean;
  status: OrderStatus;
  type: OrderType;
  source: OrderSource;
  brokerId?: string;
  brokerName?: string;
  brokerConfirmationStatus?: BrokerConfirmationStatus;
  rate?: number; // Base amount paid by broker
  copay?: number; // Copay collected in cash from passenger directly by driver
  fareAmount: number; // Total Fare = Rate + Copay
  atCommissionRate: number; // typically 0.15 (15%)
  atCommissionAmount: number; // Total Fare * 0.15 (rounded to cent)
  driverPayout: number; // Rate - atCommissionAmount
  scheduledTime?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  cancellationReason?: string;
  notes?: string;
  specialAssistanceNotes?: string;
  // Proximity Call & IVR state
  callTriggered?: boolean;
  callStatus?: ProximityCallStatus;
  callResult?: ProximityCallResult;
  callTriggeredAt?: string;
  callDurationSeconds?: number;
  callDistanceMiles?: number;
  lastDriverDistanceMiles?: number;
}

export interface ProximityCallLog {
  id: string;
  orderId: string;
  orderNumber: string;
  brokerName: string;
  passengerName: string;
  passengerPhone: string;
  driverId: string;
  driverName: string;
  distanceMiles: number;
  triggerRadiusMiles: number;
  callSid?: string;
  status: 'initiated' | 'ringing' | 'in_progress' | 'completed' | 'cancelled' | 'failed';
  dtmfPressed?: string;
  callResult: ProximityCallResult;
  telegramNotified: boolean;
  telegramMessageId?: string;
  timestamp: string;
  durationSeconds?: number;
  notes?: string;
}

export interface ProximityCallSettings {
  enabled: boolean;
  triggerRadiusMiles: number; // default 0.3
  retryCount: number;
  ttsLanguage: string; // 'ru-RU'
  ttsVoice: string; // 'Polly.Tatyana'
  customMessagePrompt: string;
  telegramAlertsEnabled: boolean;
  isTwilioConfigured: boolean;
  isTelegramConfigured: boolean;
  configuredTwilioNumber?: string;
  configuredTelegramChatId?: string;
}

export interface Broker {
  id: string;
  name: string;
  code: string;
  contactPerson: string;
  email: string;
  phone: string;
  commissionRate: number; // e.g. 0.15
  defaultCopay?: number; // Default passenger cash copay e.g. 5.00
  portalUrl?: string;
  activeOrdersCount: number;
  totalOrdersCount: number;
  totalSettledAmount: number;
  status: 'active' | 'inactive';
  notes?: string;
  createdAt: string;
}

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface TicketMessage {
  id: string;
  senderName: string;
  senderRole: 'user' | 'driver' | 'support_agent' | 'system';
  content: string;
  timestamp: string;
  isInternalNote?: boolean;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  userType: 'driver' | 'passenger' | 'broker';
  userName: string;
  userContact: string;
  relatedOrderId?: string;
  priority: TicketPriority;
  status: TicketStatus;
  assignedTo?: string;
  category: 'fare_dispute' | 'trip_delay' | 'vehicle_condition' | 'app_issue' | 'mta_dispatch' | 'other';
  messages: TicketMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface CommissionSettlement {
  id: string;
  orderId: string;
  orderNumber: string;
  brokerName: string;
  tripDate: string;
  rate?: number; // Base rate from broker
  copay?: number; // Cash copay from passenger
  fare: number; // Total Fare = Rate + Copay
  atCommission15Pct: number; // Total Fare * 15%
  driverPayout: number; // Rate - atCommission15Pct
  status: 'pending' | 'settled' | 'invoiced';
  payoutDate?: string;
}

export interface MarketingSwot {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface StrategicRecommendation {
  id: string;
  category: 'pricing' | 'driver_recruitment' | 'passenger_acquisition' | 'mta_brokerage';
  title: string;
  impact: 'high' | 'medium' | 'low';
  description: string;
  targetArea: string;
  estimatedRevenueUplift?: string;
}

export interface DemandForecastItem {
  neighborhood: QueensNeighborhood | string;
  expectedTrips7d: number;
  growthRate: string;
  peakHours: string;
  recommendedWavDrivers: number;
  confidenceScore: number;
}

export interface StrategyReport {
  id: string;
  title: string;
  createdAt: string;
  period: string;
  executiveSummary: string;
  swot: MarketingSwot;
  recommendations: StrategicRecommendation[];
  forecast: DemandForecastItem[];
  metricsSnapshot: {
    totalRevenue: number;
    activeDrivers: number;
    brokerRevenueShare: string;
    atAiRevenueShare: string;
    avgDriverRating: number;
    underservedAreas: string[];
  };
}

export interface PromoCampaign {
  id: string;
  code: string;
  name: string;
  discountType: 'fixed' | 'percentage';
  discountValue: number;
  targetNeighborhood: string;
  targetSegment: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'scheduled' | 'expired';
  ordersCount: number;
  revenueGenerated: number;
  discountSpent: number;
  roiPercentage: number;
  notes?: string;
}

export interface PassengerSegment {
  id: string;
  passengerName: string;
  phone: string;
  totalTrips: number;
  totalSpent: number;
  averageFare: number;
  primaryChannel: OrderSource;
  favoriteNeighborhood: string;
  lastTripDate: string;
  daysSinceLastTrip: number;
  frequencyCategory: 'frequent' | 'regular' | 'occasional' | 'one_time';
  churnRisk: 'low' | 'medium' | 'high';
  requiresWav: boolean;
}

export interface DriverOptimizationCandidate {
  driverId: string;
  driverName: string;
  phone: string;
  currentNeighborhood: string;
  vehicleType: VehicleType;
  tripsToday: number;
  utilizationRate: string;
  isOnline: boolean;
  recommendedNeighborhood: string;
  rebalanceReason: string;
  priority: 'high' | 'medium' | 'low';
}

export interface TicketSentimentSummary {
  totalAnalyzed: number;
  positivePct: number;
  neutralPct: number;
  negativePct: number;
  topIssues: Array<{
    theme: string;
    count: number;
    severity: 'high' | 'medium' | 'low';
    suggestion: string;
  }>;
  aiExecutiveSummary: string;
  lastAnalyzedAt: string;
}

export interface AdCopyVariant {
  id: string;
  headline: string;
  bodyText: string;
  callToAction: string;
  channel: 'SMS' | 'Instagram/Facebook' | 'WhatsApp/Flyer';
}

export type ComplianceDocType = 
  | 'tlc_license' 
  | 'driver_license' 
  | 'insurance' 
  | 'registration' 
  | 'inspection' 
  | 'vehicle_photo' 
  | 'custom';

export type ComplianceDocStatus = 'unverified' | 'pending_review' | 'verified' | 'rejected';

export type ExpiryStatus = 'valid' | 'expiring_30d' | 'expiring_7d' | 'expired' | 'no_expiry';

export interface DocumentVersion {
  version: number;
  fileUrl: string;
  fileName: string;
  uploadedAt: string;
  uploadedBy: string; // 'driver' | 'admin' | 'at_ai'
  expiryDate?: string;
  status: ComplianceDocStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  reviewerComment?: string;
}

export interface ComplianceDocument {
  id: string;
  driverId: string;
  driverName: string;
  docType: ComplianceDocType;
  title: string;
  isMandatory: boolean;
  fileUrl: string;
  fileName: string;
  fileSize?: string;
  fileType?: string;
  uploadedAt: string;
  uploadedBy: string;
  expiryDate?: string;
  status: ComplianceDocStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  reviewerComment?: string;
  version: number;
  history: DocumentVersion[];
  extractedData?: {
    licenseNumber?: string;
    expiryDate?: string;
    fullName?: string;
    plateNumber?: string;
    vin?: string;
    confidence?: number;
  };
}

export interface ComplianceAuditLog {
  id: string;
  driverId: string;
  driverName: string;
  documentId?: string;
  docTitle?: string;
  action: 'upload' | 'verify' | 'reject' | 'reupload' | 'consent_given' | 'expired_auto_lock' | 'reminder_sent';
  performedBy: string;
  role: string;
  timestamp: string;
  details: string;
  ipOrChannel?: string;
}

export interface DriverConsent {
  driverId: string;
  consentGiven: boolean;
  consentDate: string;
  consentVersion: string;
  ipAddress?: string;
}

export interface FleetComplianceSummary {
  driverId: string;
  driverName: string;
  phone: string;
  vehicleType: VehicleType;
  vehiclePlate: string;
  tlcLicenseNumber: string;
  driverStatus: DriverStatus;
  isDispatchBlocked: boolean;
  blockReason?: string;
  totalDocs: number;
  verifiedDocs: number;
  pendingDocs: number;
  expiredDocs: number;
  expiringDocs: number;
  docs: {
    tlcLicense?: ComplianceDocument;
    driverLicense?: ComplianceDocument;
    insurance?: ComplianceDocument;
    registration?: ComplianceDocument;
    inspection?: ComplianceDocument;
    vehiclePhoto?: ComplianceDocument;
    custom?: ComplianceDocument[];
  };
  consentGiven: boolean;
}

export interface SystemStats {
  totalDrivers: number;
  activeDrivers: number;
  pendingReviewDrivers: number;
  totalOrdersToday: number;
  activeOrdersNow: number;
  totalGrossRevenueToday: number;
  atCommissionToday: number;
  directRevenue: number;
  atAiRevenue: number;
  brokerRevenue: number;
  pendingComplianceDocs?: number;
  expiringComplianceDocs?: number;
  blockedDriversCount?: number;
}

// ----------------------------------------------------
// APP ANALYTICS & MONITORING TYPES (4 Mobile Apps)
// ----------------------------------------------------

export type AppTarget = 'client_android' | 'driver_android' | 'client_ios' | 'driver_ios' | 'all';

export type AppPlatform = 'android' | 'ios';
export type AppAudience = 'client' | 'driver';

export interface AppMetadataInfo {
  id: AppTarget;
  title: string;
  shortTitle: string;
  audience: AppAudience;
  platform: AppPlatform;
  storeName: 'Google Play Store' | 'Apple App Store';
  packageOrBundleId: string;
  version: string;
  rating: number;
  ratingCount: number;
  iconBg: string;
  accentColor: string;
}

export interface AppDailyMetric {
  id: string;
  appId: AppTarget;
  date: string; // YYYY-MM-DD
  installs: number;
  dau: number;
  wau: number;
  mau: number;
  registrations: number;
  firstActions: number; // completed first order or accepted first trip
  retainedD1: number;
  retainedD7: number;
  retainedD30: number;
  crashes: number;
  uninstalls: number;
  trafficSource?: string;
  adSpend?: number;
}

export interface AppFunnelStep {
  stepId: 'install' | 'registration' | 'first_action' | 'active_user';
  name: string;
  description: string;
  count: number;
  conversionFromInstallPct: number;
  dropoffFromPrevPct: number;
  isMaxDropoff?: boolean;
}

export type AdChannel = 
  | 'Meta Ads' 
  | 'Google Ads' 
  | 'Apple Search Ads' 
  | 'TikTok' 
  | 'MTA Referral' 
  | 'Queens Community / Flyers' 
  | 'Organic / Direct Search';

export interface AppTrafficSource {
  id: string;
  appId: AppTarget;
  campaignName: string;
  channel: AdChannel;
  spend: number;
  installs: number;
  cac: number; // Spend / Installs
  firstActions: number; // Completed first order or accepted first trip
  firstActionRate: number; // (firstActions / installs) * 100
  costPerActiveUser: number; // Spend / firstActions
  revenueAttributed: number;
  roi: number; // ((revenueAttributed - spend) / spend) * 100
  status: 'active' | 'paused' | 'completed';
  period: string;
}

export interface AppCohortRow {
  cohortWeek: string; // e.g. "Week 28 (Jul 7 - Jul 13)"
  appId: AppTarget;
  audience: AppAudience;
  totalInstalls: number;
  day1Pct: number;
  day7Pct: number;
  day14Pct: number;
  day30Pct: number;
}

export interface AppReview {
  id: string;
  appId: AppTarget;
  store: 'Google Play Store' | 'Apple App Store';
  rating: number; // 1-5
  author: string;
  date: string;
  appVersion: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  reviewText: string;
  topicTag: string; // e.g. "Onboarding / TLC Verification", "Payment", "GPS Dispatch", "Pricing", "App UI"
  devResponse?: string;
}

export interface AppSentimentSummary {
  appId: AppTarget;
  avgRating: number;
  totalReviews: number;
  positivePct: number;
  neutralPct: number;
  negativePct: number;
  topComplaints: { issue: string; count: number; severity: 'high' | 'medium' | 'low' }[];
  topPraises: { highlight: string; count: number }[];
  ratingHistory: { month: string; rating: number }[];
}

export interface AppAiRecommendation {
  id: string;
  appId: AppTarget;
  generatedAt: string;
  summary: string;
  bottlenecks: {
    title: string;
    step: string;
    severity: 'high' | 'medium' | 'low';
    dropoffRate: string;
    description: string;
    impact: string;
  }[];
  productImprovements: {
    action: string;
    expectedImpact: string;
    effort: 'Low' | 'Medium' | 'High';
    priority: 'P0' | 'P1' | 'P2';
  }[];
  adStrategyRecommendations: {
    channel: string;
    tactic: string;
    goal: string;
  }[];
  prioritizationSummary: string;
}

// ==================== REFERRAL PROGRAM TYPES ====================

export type ReferralStatus = 'invited' | 'registered' | 'active';
export type ReferralCodeType = 'driver_to_passenger' | 'driver_to_driver' | 'passenger_to_passenger';
export type ReferralUserType = 'driver' | 'passenger';
export type ReferralRewardType = 'free_trip' | 'discount_percent' | 'commission_discount';
export type ReferralRewardStatus = 'active' | 'expired' | 'used';

export interface ReferralRecord {
  id: string;
  referrerId: string;
  referrerName: string;
  referrerType: ReferralUserType;
  referredId: string;
  referredName: string;
  referredPhone: string;
  referredType: ReferralUserType;
  codeType: ReferralCodeType;
  referralCode: string;
  dateInstalled: string; // ISO date
  dateActivated: string | null; // ISO date when completed 1st trip or driver approved
  status: ReferralStatus;
  isSuspicious?: boolean;
  suspiciousReason?: string;
  ipAddress?: string;
  deviceFingerprint?: string;
  firstOrderId?: string;
  firstOrderDate?: string;
}

export interface ReferralReward {
  id: string;
  userId: string;
  userName: string;
  userType: ReferralUserType;
  rewardType: ReferralRewardType;
  rewardValue: number; // e.g. 3 for 3% discount, 100 for 100% free trip, 25 for 25%
  description: string;
  earnedDate: string; // ISO date
  expiryDate: string | null; // ISO date (30 days for driver commission discount)
  status: ReferralRewardStatus;
  triggerMilestone: string; // e.g. "10 Active Passengers Invited", "5 Active Drivers Invited"
  appliedToCommissionRate?: number; // e.g. 0.12 (from 0.15)
  usedDate?: string;
}

export interface CommissionRateLog {
  id: string;
  driverId: string;
  driverName: string;
  date: string;
  previousRate: number; // e.g. 0.15
  newRate: number; // e.g. 0.12
  reason: string; // e.g. "Referral Reward: 10 Active Passengers Milestone"
  rewardId?: string;
  changedBy: string; // e.g. "System Automation", "Admin"
}

export interface ReferralProgramSettings {
  isEnabled: boolean;
  baseUrl: string; // e.g. "https://accessibletransit.com/ref/{code}"
  passengerThreshold: number; // default: 5
  passengerRewardType: 'free_trip' | 'discount_percent'; // default: 'free_trip'
  passengerDiscountPercent: number; // default: 25
  driverPassengerThreshold: number; // default: 10
  driverPassengerCommissionDiscount: number; // default: 3 (%)
  driverDriverThreshold: number; // default: 5
  driverDriverCommissionDiscount: number; // default: 3 (%)
  commissionDiscountDurationDays: number; // default: 30
  antiFraudDuplicatePhoneCheck: boolean; // default: true
  antiFraudSameDeviceCheck: boolean; // default: true
  maxAccountsPerIp: number; // default: 3
}

export interface ReferralSettings {
  isEnabled: boolean;
  baseUrl: string;
  driverMilestonePassengers: number;
  driverMilestoneDrivers: number;
  driverCommissionDiscountPercent: number;
  driverDiscountDurationDays: number;
  passengerMilestoneForFreeTrip: number;
  freeTripMaxFare: number;
  antiFraudDuplicatePhoneCheck?: boolean;
  antiFraudSameDeviceCheck?: boolean;
}

export interface DriverReferralSummary {
  driverId: string;
  driverName: string;
  passengerReferralCode: string; // e.g. "ATP-TARIQ-882"
  driverReferralCode: string; // e.g. "ATD-TARIQ-882"
  passengerReferralUrl: string;
  driverReferralUrl: string;
  invitedPassengersCount: number;
  registeredPassengersCount: number;
  activePassengersCount: number;
  invitedDriversCount: number;
  registeredDriversCount: number;
  activeDriversCount: number;
  passengerMilestoneTarget: number; // 10
  passengerMilestoneProgress: number; // 7 / 10
  driverMilestoneTarget: number; // 5
  driverMilestoneProgress: number; // 3 / 5
  activeCommissionDiscount: number; // e.g. 3 (%)
  currentCommissionRate: number; // e.g. 12 (%) or 15 (%)
  commissionDiscountExpiryDate: string | null;
  hasActiveDiscount: boolean;
  rewards: ReferralReward[];
  passengersList: ReferralRecord[];
  driversList: ReferralRecord[];
}

export interface ReferralDashboardStats {
  totalInvitationsSent: number;
  totalQrScans: number;
  totalInstalls: number;
  totalActiveUsers: number;
  conversionRateInstallToActivePct: number;
  conversionRateInviteToActivePct: number;
  activeDriverDiscountsCount: number;
  totalCommissionSavingsGranted: number;
  totalFreeTripsGranted: number;
  topDriverReferrersPassengers: Array<{
    driverId: string;
    driverName: string;
    avatarUrl?: string;
    phone: string;
    vehicleType: string;
    totalInvited: number;
    activeCount: number;
    rewardsEarned: number;
  }>;
  topDriverReferrersDrivers: Array<{
    driverId: string;
    driverName: string;
    avatarUrl?: string;
    phone: string;
    vehicleType: string;
    totalInvited: number;
    activeCount: number;
    rewardsEarned: number;
  }>;
  topPassengerReferrers: Array<{
    passengerId: string;
    passengerName: string;
    phone: string;
    totalInvited: number;
    activeCount: number;
    freeTripsEarned: number;
  }>;
  organicVsReferralGrowth: Array<{
    week: string;
    organicInstalls: number;
    referralInstalls: number;
    organicActive: number;
    referralActive: number;
  }>;
  suspiciousReferrals: ReferralRecord[];
}

// ==========================================
// INTERNAL CRM AI AGENT ("JARVIS") TYPES
// ==========================================
export type AiAgentActionType = 
  | 'assign_driver' 
  | 'cancel_order' 
  | 'update_driver_status' 
  | 'reply_ticket' 
  | 'generate_report';

export interface AiAgentProposedAction {
  id: string;
  actionType: AiAgentActionType;
  title: string;
  description: string;
  params: Record<string, any>;
  status: 'pending' | 'confirmed' | 'rejected' | 'executed' | 'failed';
  executedResult?: string;
  requiresAdmin?: boolean;
}

export interface AiAgentMessage {
  id: string;
  sender: 'user' | 'agent' | 'system';
  text: string;
  timestamp: string;
  proposedAction?: AiAgentProposedAction;
  isReport?: boolean;
  reportData?: {
    title: string;
    summary: string;
    sections?: Array<{ title: string; content: string | string[] }>;
    stats?: Array<{ label: string; value: string | number }>;
  };
}

export interface AiAgentAuditLog {
  id: string;
  timestamp: string;
  actorRole: UserRole;
  actorName: string;
  command: string;
  actionType?: string;
  status: 'success' | 'cancelled' | 'failed' | 'info_query';
  details: string;
  resultSummary: string;
}

export interface AiAgentCommandRequest {
  command: string;
  currentRole: UserRole;
  actorName: string;
  language: 'en' | 'ru';
}

export interface AiAgentCommandResponse {
  reply: string;
  proposedAction?: AiAgentProposedAction;
  isReport?: boolean;
  reportData?: any;
  auditLogId?: string;
}

// ==========================================
// EMPLOYEES, INVITATIONS & FACE BIOMETRICS TYPES
// ==========================================

export type EmployeeStatus = 'invited' | 'active' | 'suspended' | 'blocked';

export interface Employee {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  status: EmployeeStatus;
  createdAt: string;
  registeredAt?: string;
  lastLoginAt?: string;
  lastLoginMethod?: 'face_id' | 'password';
  faceEnrolled: boolean;
  faceEnrolledAt?: string;
  faceEmbeddingVectorId?: string; // Opaque reference, raw vectors hidden
  failedFaceAttempts: number;
  faceLockUntil?: string;
  invitationId?: string;
  department?: string;
  avatarUrl?: string;
  notes?: string;
  locationConsent?: boolean;
  locationConsentedAt?: string;
  locationRevokedAt?: string;
  currentLocation?: EmployeeLiveLocation | null;
}

export interface EmployeeInvitation {
  id: string;
  token: string;
  role: UserRole;
  status: 'pending' | 'used' | 'revoked' | 'expired';
  createdAt: string;
  expiresAt: string; // 48 Hours TTL
  firstSeenAt?: string;
  firstSeenIp?: string;
  firstSeenUserAgent?: string;
  registrationIp?: string;
  hasIpMismatchWarning?: boolean;
  usedAt?: string;
  usedByEmployeeId?: string;
  targetEmail?: string;
  targetFullName?: string;
  createdByAdminName: string;
}

export interface EmployeeLoginAuditLog {
  id: string;
  employeeId?: string;
  employeeEmail: string;
  employeeName?: string;
  role?: UserRole;
  timestamp: string;
  method: 'face_id' | 'password';
  status: 'success' | 'failed' | 'locked';
  confidenceScore?: number; // e.g. 0.985 (98.5%)
  ip: string;
  userAgent?: string;
  details: string;
  livenessPassed?: boolean;
}

export interface FaceEnrollmentPayload {
  token: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  biometricConsent: boolean;
  capturedFramesCount: number;
  faceImageBase64: string; // for embedding extraction via Rekognition/Azure Face API
  livenessData: {
    blinkDetected: boolean;
    headTurnDetected: boolean;
    livenessScore: number;
  };
  clientIp?: string;
  userAgent?: string;
}

export interface FaceVerificationResult {
  matched: boolean;
  employee?: Employee;
  confidenceScore: number;
  threshold: number;
  service: 'AWS Rekognition Face API' | 'Azure Face API';
  livenessPassed: boolean;
  lockedOut?: boolean;
  remainingAttempts?: number;
  lockUntil?: string;
  message: string;
}

export interface EmployeeLocationConsent {
  id?: string;
  employeeId: string;
  consented: boolean;
  consentedAt?: string;
  revokedAt?: string;
  ipAddress?: string;
  userAgent?: string;
  legalNoticeText: string;
  complianceVersion: string;
}

export interface EmployeeLiveLocation {
  employeeId: string;
  employeeName: string;
  email: string;
  role: UserRole;
  lat: number;
  lng: number;
  accuracy?: number; // meters
  heading?: number | null;
  speed?: number | null;
  updatedAt: string; // ISO string
  status: 'active_session' | 'location_unavailable';
  boroughOrArea?: string;
  deviceInfo?: string;
  sessionStartedAt?: string;
}

export interface EmployeeLocationUpdatePayload {
  employeeId: string;
  lat: number;
  lng: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
  boroughOrArea?: string;
  deviceInfo?: string;
}


