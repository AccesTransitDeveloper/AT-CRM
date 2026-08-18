import { 
  Driver, 
  Order, 
  Broker, 
  Ticket, 
  CommissionSettlement, 
  SystemStats,
  StrategyReport,
  PromoCampaign,
  PassengerSegment,
  DriverOptimizationCandidate,
  TicketSentimentSummary,
  AdCopyVariant,
  ComplianceDocument,
  ComplianceDocStatus,
  ComplianceAuditLog,
  DriverConsent,
  FleetComplianceSummary,
  AppTarget,
  AppMetadataInfo,
  AppDailyMetric,
  AppFunnelStep,
  AppTrafficSource,
  AppCohortRow,
  AppReview,
  AppSentimentSummary,
  AppAiRecommendation,
  AppAudience,
  DriverFinancialAnalytics,
  DriverActivityAnalytics,
  DriverPayoutRecord,
  DriverAiAssessment,
  AnalyticsTimeRange,
  ReferralRecord,
  ReferralReward,
  CommissionRateLog,
  ReferralProgramSettings,
  DriverReferralSummary,
  ReferralDashboardStats,
  AiAgentCommandRequest,
  AiAgentCommandResponse,
  AiAgentProposedAction,
  AiAgentAuditLog,
  UserRole
} from '../types';


const API_BASE = '/api';

export const api = {
  // Stats
  async getStats(): Promise<SystemStats> {
    const res = await fetch(`${API_BASE}/stats`);
    if (!res.ok) throw new Error('Failed to fetch system stats');
    return res.json();
  },

  // Drivers
  async getDrivers(params?: { status?: string; search?: string; vehicleType?: string }): Promise<Driver[]> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    if (params?.vehicleType) query.append('vehicleType', params.vehicleType);

    const res = await fetch(`${API_BASE}/drivers?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch drivers');
    return res.json();
  },

  async getDriver(id: string): Promise<Driver> {
    const res = await fetch(`${API_BASE}/drivers/${id}`);
    if (!res.ok) throw new Error('Failed to fetch driver');
    return res.json();
  },

  async createDriver(driverData: Partial<Driver>): Promise<Driver> {
    const res = await fetch(`${API_BASE}/drivers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(driverData)
    });
    if (!res.ok) throw new Error('Failed to create driver');
    return res.json();
  },

  async updateDriver(id: string, updates: Partial<Driver>): Promise<Driver> {
    const res = await fetch(`${API_BASE}/drivers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update driver');
    return res.json();
  },

  async updateDriverStatus(id: string, status: Driver['status'], rejectionReason?: string): Promise<Driver> {
    const res = await fetch(`${API_BASE}/drivers/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, rejectionReason })
    });
    if (!res.ok) throw new Error('Failed to update driver status');
    return res.json();
  },

  async deleteDriver(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/drivers/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete driver');
    return res.json();
  },

  async getDriverTrips(id: string) {
    const res = await fetch(`${API_BASE}/drivers/${id}/trips`);
    if (!res.ok) throw new Error('Failed to fetch driver trips');
    return res.json();
  },

  async getDriverFinancials(id: string, params?: { timeRange?: AnalyticsTimeRange; startDate?: string; endDate?: string }): Promise<DriverFinancialAnalytics> {
    const query = new URLSearchParams();
    if (params?.timeRange) query.append('timeRange', params.timeRange);
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);

    const res = await fetch(`${API_BASE}/drivers/${id}/financials?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch driver financials');
    return res.json();
  },

  async getDriverActivity(id: string, params?: { timeRange?: AnalyticsTimeRange; startDate?: string; endDate?: string }): Promise<DriverActivityAnalytics> {
    const query = new URLSearchParams();
    if (params?.timeRange) query.append('timeRange', params.timeRange);
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);

    const res = await fetch(`${API_BASE}/drivers/${id}/activity?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch driver activity');
    return res.json();
  },

  async getDriverPayouts(id: string): Promise<DriverPayoutRecord[]> {
    const res = await fetch(`${API_BASE}/drivers/${id}/payouts`);
    if (!res.ok) throw new Error('Failed to fetch driver payouts');
    return res.json();
  },

  async getDriverAiAssessments(id: string): Promise<DriverAiAssessment[]> {
    const res = await fetch(`${API_BASE}/drivers/${id}/ai-assessments`);
    if (!res.ok) throw new Error('Failed to fetch driver AI assessments');
    return res.json();
  },

  async generateDriverAiAssessment(id: string): Promise<DriverAiAssessment> {
    const res = await fetch(`${API_BASE}/drivers/${id}/ai-assessment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error('Failed to generate driver AI assessment');
    return res.json();
  },

  // Orders
  async getOrders(params?: { status?: string; type?: string; source?: string; search?: string; neighborhood?: string }): Promise<Order[]> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.type) query.append('type', params.type);
    if (params?.source) query.append('source', params.source);
    if (params?.search) query.append('search', params.search);
    if (params?.neighborhood) query.append('neighborhood', params.neighborhood);

    const res = await fetch(`${API_BASE}/orders?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch orders');
    return res.json();
  },

  async createOrder(orderData: Partial<Order>): Promise<Order> {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    if (!res.ok) throw new Error('Failed to create order');
    return res.json();
  },

  async updateOrder(id: string, updates: Partial<Order>): Promise<Order> {
    const res = await fetch(`${API_BASE}/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update order');
    return res.json();
  },

  async assignDriver(orderId: string, driverId: string): Promise<Order> {
    const res = await fetch(`${API_BASE}/orders/${orderId}/assign`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ driverId })
    });
    if (!res.ok) throw new Error('Failed to assign driver');
    return res.json();
  },

  async updateOrderStatus(orderId: string, status: Order['status'], brokerConfirmationStatus?: Order['brokerConfirmationStatus']): Promise<Order> {
    const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, brokerConfirmationStatus })
    });
    if (!res.ok) throw new Error('Failed to update order status');
    return res.json();
  },

  async deleteOrder(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/orders/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete order');
    return res.json();
  },

  // Brokers
  async getBrokers(): Promise<Broker[]> {
    const res = await fetch(`${API_BASE}/brokers`);
    if (!res.ok) throw new Error('Failed to fetch brokers');
    return res.json();
  },

  async createBroker(brokerData: Partial<Broker>): Promise<Broker> {
    const res = await fetch(`${API_BASE}/brokers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(brokerData)
    });
    if (!res.ok) throw new Error('Failed to create broker');
    return res.json();
  },

  async updateBroker(id: string, updates: Partial<Broker>): Promise<Broker> {
    const res = await fetch(`${API_BASE}/brokers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update broker');
    return res.json();
  },

  // Tickets
  async getTickets(params?: { status?: string; priority?: string; search?: string }): Promise<Ticket[]> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.priority) query.append('priority', params.priority);
    if (params?.search) query.append('search', params.search);

    const res = await fetch(`${API_BASE}/tickets?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch tickets');
    return res.json();
  },

  async createTicket(ticketData: Partial<Ticket>): Promise<Ticket> {
    const res = await fetch(`${API_BASE}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticketData)
    });
    if (!res.ok) throw new Error('Failed to create ticket');
    return res.json();
  },

  async updateTicket(id: string, updates: Partial<Ticket>): Promise<Ticket> {
    const res = await fetch(`${API_BASE}/tickets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update ticket');
    return res.json();
  },

  async addTicketMessage(ticketId: string, message: { senderName: string; senderRole: 'user' | 'driver' | 'support_agent' | 'system'; content: string; isInternalNote?: boolean }): Promise<Ticket> {
    const res = await fetch(`${API_BASE}/tickets/${ticketId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });
    if (!res.ok) throw new Error('Failed to post message');
    return res.json();
  },

  // Finance
  async getSettlements(): Promise<CommissionSettlement[]> {
    const res = await fetch(`${API_BASE}/finance/settlements`);
    if (!res.ok) throw new Error('Failed to fetch settlements');
    return res.json();
  },

  async updateSettlementStatus(id: string, status: CommissionSettlement['status']): Promise<CommissionSettlement> {
    const res = await fetch(`${API_BASE}/finance/settlements/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error('Failed to update settlement status');
    return res.json();
  },

  // External API info
  async getExternalApiInfo() {
    const res = await fetch(`${API_BASE}/external/info`);
    if (!res.ok) throw new Error('Failed to fetch external API info');
    return res.json();
  },

  async simulateExternalOrder(orderPayload: any, apiKey: string) {
    const res = await fetch(`${API_BASE}/external/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify(orderPayload)
    });
    return { status: res.status, data: await res.json() };
  },

  async simulateExternalDriverApp(driverPayload: any, apiKey: string) {
    const res = await fetch(`${API_BASE}/external/driver-applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify(driverPayload)
    });
    return { status: res.status, data: await res.json() };
  },

  // Marketing & Market Intelligence
  async getMarketingAnalytics(): Promise<any> {
    const res = await fetch(`${API_BASE}/marketing/analytics`);
    if (!res.ok) throw new Error('Failed to fetch marketing analytics');
    return res.json();
  },

  async getStrategyReports(): Promise<StrategyReport[]> {
    const res = await fetch(`${API_BASE}/marketing/reports`);
    if (!res.ok) throw new Error('Failed to fetch strategy reports');
    return res.json();
  },

  async generateStrategyReport(): Promise<{ success: boolean; report: StrategyReport }> {
    const res = await fetch(`${API_BASE}/marketing/reports/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error('Failed to generate strategy report');
    return res.json();
  },

  async deleteStrategyReport(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/marketing/reports/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete report');
    return res.json();
  },

  async getPassengerSegments(): Promise<PassengerSegment[]> {
    const res = await fetch(`${API_BASE}/marketing/passengers`);
    if (!res.ok) throw new Error('Failed to fetch passenger segments');
    return res.json();
  },

  async getDriverOptimization(): Promise<DriverOptimizationCandidate[]> {
    const res = await fetch(`${API_BASE}/marketing/driver-optimization`);
    if (!res.ok) throw new Error('Failed to fetch driver optimization');
    return res.json();
  },

  async getPromoCampaigns(): Promise<PromoCampaign[]> {
    const res = await fetch(`${API_BASE}/marketing/campaigns`);
    if (!res.ok) throw new Error('Failed to fetch promo campaigns');
    return res.json();
  },

  async createPromoCampaign(data: Partial<PromoCampaign>): Promise<PromoCampaign> {
    const res = await fetch(`${API_BASE}/marketing/campaigns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create campaign');
    return res.json();
  },

  async updatePromoCampaign(id: string, updates: Partial<PromoCampaign>): Promise<PromoCampaign> {
    const res = await fetch(`${API_BASE}/marketing/campaigns/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update campaign');
    return res.json();
  },

  async deletePromoCampaign(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/marketing/campaigns/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete campaign');
    return res.json();
  },

  async generateAdCopy(params: { neighborhood: string; offer: string; tone?: string; promoCode?: string }): Promise<{ variants: AdCopyVariant[] }> {
    const res = await fetch(`${API_BASE}/marketing/generate-copy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) throw new Error('Failed to generate ad copy');
    return res.json();
  },

  async getTicketSentiment(): Promise<TicketSentimentSummary> {
    const res = await fetch(`${API_BASE}/marketing/sentiment`);
    if (!res.ok) throw new Error('Failed to fetch sentiment analysis');
    return res.json();
  },

  async triggerSentimentAnalysis(): Promise<TicketSentimentSummary> {
    const res = await fetch(`${API_BASE}/marketing/sentiment/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error('Failed to re-run sentiment analysis');
    return res.json();
  },

  async getAutoReportConfig(): Promise<any> {
    const res = await fetch(`${API_BASE}/marketing/auto-reports/config`);
    if (!res.ok) throw new Error('Failed to fetch auto-report config');
    return res.json();
  },

  async updateAutoReportConfig(config: any): Promise<any> {
    const res = await fetch(`${API_BASE}/marketing/auto-reports/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    if (!res.ok) throw new Error('Failed to update auto-report config');
    return res.json();
  },

  // ==========================================
  // COMPLIANCE & DOCUMENTS API
  // ==========================================

  async getComplianceDocuments(params?: {
    driverId?: string;
    status?: string;
    expiryStatus?: string;
    docType?: string;
    search?: string;
  }): Promise<ComplianceDocument[]> {
    const query = new URLSearchParams();
    if (params?.driverId) query.append('driverId', params.driverId);
    if (params?.status) query.append('status', params.status);
    if (params?.expiryStatus) query.append('expiryStatus', params.expiryStatus);
    if (params?.docType) query.append('docType', params.docType);
    if (params?.search) query.append('search', params.search);

    const res = await fetch(`${API_BASE}/compliance/documents?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch compliance documents');
    return res.json();
  },

  async getVerificationQueue(): Promise<ComplianceDocument[]> {
    const res = await fetch(`${API_BASE}/compliance/queue`);
    if (!res.ok) throw new Error('Failed to fetch verification queue');
    return res.json();
  },

  async getExpiringDocuments(): Promise<Array<ComplianceDocument & { daysRemaining: number; expiryStatus: string; daysText: string }>> {
    const res = await fetch(`${API_BASE}/compliance/expiring`);
    if (!res.ok) throw new Error('Failed to fetch expiring documents');
    return res.json();
  },

  async getFleetComplianceMatrix(): Promise<FleetComplianceSummary[]> {
    const res = await fetch(`${API_BASE}/compliance/matrix`);
    if (!res.ok) throw new Error('Failed to fetch fleet compliance matrix');
    return res.json();
  },

  async uploadComplianceDocument(data: {
    driverId: string;
    docType: string;
    title?: string;
    fileUrl: string;
    fileName?: string;
    fileSize?: string;
    fileType?: string;
    expiryDate?: string;
    uploadedBy?: string;
    extractedData?: any;
    isMandatory?: boolean;
    actorRole?: string;
    actorName?: string;
  }): Promise<ComplianceDocument> {
    const res = await fetch(`${API_BASE}/compliance/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to upload document');
    return res.json();
  },

  async verifyComplianceDocument(
    id: string, 
    data: { 
      status: ComplianceDocStatus; 
      reviewerName: string; 
      reviewerRole: string; 
      reviewerComment?: string 
    }
  ): Promise<ComplianceDocument> {
    const res = await fetch(`${API_BASE}/compliance/documents/${id}/verify`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to verify document');
    return res.json();
  },

  async getComplianceAuditLogs(driverId?: string): Promise<ComplianceAuditLog[]> {
    const query = driverId ? `?driverId=${encodeURIComponent(driverId)}` : '';
    const res = await fetch(`${API_BASE}/compliance/logs${query}`);
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  },

  async recordDriverConsent(driverId: string, consentVersion?: string, ipAddress?: string): Promise<DriverConsent> {
    const res = await fetch(`${API_BASE}/compliance/consent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ driverId, consentVersion, ipAddress })
    });
    if (!res.ok) throw new Error('Failed to record driver consent');
    return res.json();
  },

  async getDriverConsent(driverId: string): Promise<DriverConsent> {
    const res = await fetch(`${API_BASE}/compliance/consent/${driverId}`);
    if (!res.ok) throw new Error('Failed to fetch driver consent');
    return res.json();
  },

  async sendComplianceReminder(documentId: string, channel: 'sms' | 'email' | 'at_ai' = 'at_ai'): Promise<{ success: boolean; message: string; log: ComplianceAuditLog }> {
    const res = await fetch(`${API_BASE}/compliance/documents/${documentId}/reminder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel })
    });
    if (!res.ok) throw new Error('Failed to send reminder');
    return res.json();
  },

  async scanDocumentWithAI(docType: string, driverHint?: { fullName?: string; plate?: string; tlc?: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/compliance/ocr-scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ docType, driverHint })
    });
    if (!res.ok) throw new Error('Failed to scan document with AI');
    return res.json();
  },

  // ----------------------------------------------------
  // APP ANALYTICS & MONITORING API
  // ----------------------------------------------------

  async getAppMetadataList(): Promise<AppMetadataInfo[]> {
    const res = await fetch(`${API_BASE}/analytics/metadata`);
    if (!res.ok) throw new Error('Failed to fetch app metadata');
    return res.json();
  },

  async getAppOverview(appId: AppTarget = 'all', days: number = 30): Promise<{
    appId: AppTarget;
    periodDays: number;
    summary: {
      totalInstalls: number;
      installsGrowthPct: number;
      latestDau: number;
      avgWau: number;
      avgMau: number;
      avgD1: number;
      avgD7: number;
      avgD30: number;
      totalAdSpend: number;
      totalRegistrations: number;
      totalFirstActions: number;
      registrationRatePct: number;
      firstActionRatePct: number;
    };
    timeSeries: Array<{
      date: string;
      shortDate: string;
      installs: number;
      prevInstalls: number;
      dau: number;
      prevDau: number;
      firstActions: number;
      adSpend: number;
    }>;
    appCards: Array<AppMetadataInfo & {
      totalInstalls: number;
      dau: number;
      mau: number;
      d7Retention: number;
    }>;
  }> {
    const res = await fetch(`${API_BASE}/analytics/overview?appId=${appId}&days=${days}`);
    if (!res.ok) throw new Error('Failed to fetch app analytics overview');
    return res.json();
  },

  async getAppDailyMetrics(appId: AppTarget = 'all', days: number = 30): Promise<AppDailyMetric[]> {
    const res = await fetch(`${API_BASE}/analytics/metrics?appId=${appId}&days=${days}`);
    if (!res.ok) throw new Error('Failed to fetch app daily metrics');
    return res.json();
  },

  async getAppFunnel(appId: AppTarget = 'all'): Promise<AppFunnelStep[]> {
    const res = await fetch(`${API_BASE}/analytics/funnel?appId=${appId}`);
    if (!res.ok) throw new Error('Failed to fetch app funnel');
    return res.json();
  },

  async getAppTrafficSources(appId: AppTarget = 'all'): Promise<AppTrafficSource[]> {
    const res = await fetch(`${API_BASE}/analytics/sources?appId=${appId}`);
    if (!res.ok) throw new Error('Failed to fetch traffic sources');
    return res.json();
  },

  async createAppTrafficSource(data: Partial<AppTrafficSource>): Promise<AppTrafficSource> {
    const res = await fetch(`${API_BASE}/analytics/sources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create traffic source');
    return res.json();
  },

  async deleteAppTrafficSource(id: string): Promise<{ success: boolean; id: string }> {
    const res = await fetch(`${API_BASE}/analytics/sources/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete traffic source');
    return res.json();
  },

  async getAppCohorts(appId: AppTarget = 'all', audience?: AppAudience): Promise<AppCohortRow[]> {
    const query = audience ? `&audience=${audience}` : '';
    const res = await fetch(`${API_BASE}/analytics/cohorts?appId=${appId}${query}`);
    if (!res.ok) throw new Error('Failed to fetch app cohorts');
    return res.json();
  },

  async getAppReviews(appId: AppTarget = 'all'): Promise<AppReview[]> {
    const res = await fetch(`${API_BASE}/analytics/reviews?appId=${appId}`);
    if (!res.ok) throw new Error('Failed to fetch store reviews');
    return res.json();
  },

  async createAppReview(data: Partial<AppReview>): Promise<AppReview> {
    const res = await fetch(`${API_BASE}/analytics/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to submit store review');
    return res.json();
  },

  async getAppSentimentSummary(appId: AppTarget = 'all'): Promise<AppSentimentSummary> {
    const res = await fetch(`${API_BASE}/analytics/sentiment?appId=${appId}`);
    if (!res.ok) throw new Error('Failed to fetch sentiment summary');
    return res.json();
  },

  async getAppAiRecommendations(appId: AppTarget = 'all'): Promise<AppAiRecommendation[]> {
    const res = await fetch(`${API_BASE}/analytics/recommendations?appId=${appId}`);
    if (!res.ok) throw new Error('Failed to fetch AI recommendations');
    return res.json();
  },

  async generateAppAiRecommendations(appId: AppTarget = 'all'): Promise<AppAiRecommendation> {
    const res = await fetch(`${API_BASE}/analytics/recommendations/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appId })
    });
    if (!res.ok) throw new Error('Failed to generate AI recommendations');
    return res.json();
  },

  async importAppMetricsCsv(csvData: string): Promise<{ importedCount: number; errors: string[] }> {
    const res = await fetch(`${API_BASE}/analytics/import-csv`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csvData })
    });
    if (!res.ok) throw new Error('Failed to import CSV data');
    return res.json();
  },

  // Referral Program
  async getReferralSettings(): Promise<ReferralProgramSettings> {
    const res = await fetch(`${API_BASE}/referrals/settings`);
    if (!res.ok) throw new Error('Failed to fetch referral settings');
    return res.json();
  },

  async updateReferralSettings(settings: Partial<ReferralProgramSettings>): Promise<ReferralProgramSettings> {
    const res = await fetch(`${API_BASE}/referrals/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    if (!res.ok) throw new Error('Failed to update referral settings');
    return res.json();
  },

  async getReferralStats(): Promise<ReferralDashboardStats> {
    const res = await fetch(`${API_BASE}/referrals/stats`);
    if (!res.ok) throw new Error('Failed to fetch referral stats');
    return res.json();
  },

  async getReferrals(params?: { referrerId?: string; referrerType?: string; status?: string; isSuspicious?: boolean }): Promise<ReferralRecord[]> {
    const query = new URLSearchParams();
    if (params?.referrerId) query.append('referrerId', params.referrerId);
    if (params?.referrerType) query.append('referrerType', params.referrerType);
    if (params?.status) query.append('status', params.status);
    if (params?.isSuspicious !== undefined) query.append('isSuspicious', String(params.isSuspicious));

    const res = await fetch(`${API_BASE}/referrals?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch referrals');
    return res.json();
  },

  async createReferral(data: Partial<ReferralRecord>): Promise<{ referral: ReferralRecord; summary: DriverReferralSummary }> {
    const res = await fetch(`${API_BASE}/referrals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create referral');
    return res.json();
  },

  async activateReferral(id: string, orderId?: string): Promise<{ success: boolean; referral: ReferralRecord; reward?: ReferralReward; milestoneReached?: boolean }> {
    const res = await fetch(`${API_BASE}/referrals/${id}/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId })
    });
    if (!res.ok) throw new Error('Failed to activate referral');
    return res.json();
  },

  async reviewSuspiciousReferral(id: string, action: 'approve' | 'dismiss'): Promise<{ success: boolean; referral: ReferralRecord }> {
    const res = await fetch(`${API_BASE}/referrals/${id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    });
    if (!res.ok) throw new Error('Failed to review referral');
    return res.json();
  },

  async getReferralRewards(userId?: string): Promise<ReferralReward[]> {
    const query = userId ? `?userId=${userId}` : '';
    const res = await fetch(`${API_BASE}/referrals/rewards${query}`);
    if (!res.ok) throw new Error('Failed to fetch referral rewards');
    return res.json();
  },

  async getCommissionLogs(driverId?: string): Promise<CommissionRateLog[]> {
    const query = driverId ? `?driverId=${driverId}` : '';
    const res = await fetch(`${API_BASE}/referrals/commission-logs${query}`);
    if (!res.ok) throw new Error('Failed to fetch commission logs');
    return res.json();
  },

  async getDriverReferrals(driverId: string): Promise<DriverReferralSummary> {
    const res = await fetch(`${API_BASE}/drivers/${driverId}/referrals`);
    if (!res.ok) throw new Error('Failed to fetch driver referral summary');
    return res.json();
  },

  async lookupReferralCode(code: string): Promise<any> {
    const res = await fetch(`${API_BASE}/referrals/lookup/${encodeURIComponent(code)}`);
    if (!res.ok) throw new Error('Failed to lookup referral code');
    return res.json();
  },

  // ==========================================
  // AI AGENT ("JARVIS") API METHODS
  // ==========================================
  async sendAiAgentCommand(data: {
    command: string;
    currentRole: UserRole;
    actorName: string;
    language: 'en' | 'ru';
  }): Promise<AiAgentCommandResponse> {
    const res = await fetch(`${API_BASE}/ai/agent/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to send AI agent command');
    }
    return res.json();
  },

  async executeAiAgentAction(data: {
    action: AiAgentProposedAction;
    currentRole: UserRole;
    actorName: string;
  }): Promise<{ success: boolean; message: string; data?: any }> {
    const res = await fetch(`${API_BASE}/ai/agent/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || 'Failed to execute agent action');
    }
    return res.json();
  },

  async getAiAgentAuditLogs(): Promise<AiAgentAuditLog[]> {
    const res = await fetch(`${API_BASE}/ai/agent/audit-logs`);
    if (!res.ok) throw new Error('Failed to fetch AI agent audit logs');
    return res.json();
  }
};

