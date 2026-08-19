/**
 * REST API Client for Accessible Transit (AT) CRM
 * Safe JSON parser with fallback to avoid "Unexpected token 'T', The page..." errors on Vercel
 */

export async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit
): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      const data = await res.json();
      if (!res.ok) {
        return {
          ok: false,
          status: res.status,
          error: data?.error || `Server error (${res.status})`
        };
      }
      return { ok: true, status: res.status, data };
    }

    // Server returned HTML (e.g. 404/500 static page on Vercel)
    const rawText = await res.text();
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error: res.status === 404 
          ? 'API endpoint not found (Vercel serverless function or static host)' 
          : `Server returned status ${res.status}`
      };
    }

    try {
      const data = JSON.parse(rawText);
      return { ok: true, status: res.status, data };
    } catch {
      return {
        ok: false,
        status: res.status,
        error: 'Received non-JSON response from server'
      };
    }
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      error: err?.message || 'Network request failed'
    };
  }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const result = await safeFetchJson<T>(url, options);
  if (!result.ok) {
    throw new Error(result.error || `HTTP request failed (${result.status})`);
  }
  return result.data as T;
}

export const api = {
  // Stats
  getStats: () => request<any>('/api/stats'),

  // Drivers
  getDrivers: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>(`/api/drivers${qs}`);
  },
  getDriverById: (id: string) => request<any>(`/api/drivers/${id}`),
  createDriver: (driver: any) => request<any>('/api/drivers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(driver)
  }),
  updateDriver: (id: string, updates: any) => request<any>(`/api/drivers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  }),
  updateDriverStatus: (id: string, status: string, reason?: string) => request<any>(`/api/drivers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, rejectionReason: reason })
  }),
  deleteDriver: (id: string) => request<any>(`/api/drivers/${id}`, { method: 'DELETE' }),
  getDriverFinancials: (driverId: string, params?: any) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any>(`/api/drivers/${driverId}/financials${qs}`);
  },
  getDriverActivity: (driverId: string, params?: any) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any>(`/api/drivers/${driverId}/activity${qs}`);
  },
  getDriverPayouts: (driverId: string) => request<any[]>(`/api/drivers/${driverId}/payouts`),
  getDriverAiAssessments: (driverId: string) => request<any[]>(`/api/drivers/${driverId}/assessments`),
  generateDriverAiAssessment: (driverId: string, actor?: any) => request<any>(`/api/drivers/${driverId}/assessments/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(actor || {})
  }),
  getDriverTrips: (driverId: string) => request<any[]>(`/api/orders?driverId=${driverId}`),

  // Orders
  getOrders: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>(`/api/orders${qs}`);
  },
  getOrderById: (id: string) => request<any>(`/api/orders/${id}`),
  createOrder: (order: any) => request<any>('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order)
  }),
  updateOrder: (id: string, updates: any) => request<any>(`/api/orders/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  }),
  updateOrderStatus: (orderId: string, status: string, brokerConfirmationStatus?: string) => request<any>(`/api/orders/${orderId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, brokerConfirmationStatus })
  }),
  assignDriver: (orderId: string, driverId: string) => request<any>(`/api/orders/${orderId}/assign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ driverId })
  }),
  assignDriverToOrder: (orderId: string, driverId: string) => request<any>(`/api/orders/${orderId}/assign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ driverId })
  }),
  deleteOrder: (orderId: string) => request<any>(`/api/orders/${orderId}`, { method: 'DELETE' }),

  // Brokers
  getBrokers: () => request<any[]>('/api/brokers'),
  createBroker: (broker: any) => request<any>('/api/brokers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(broker)
  }),
  updateBroker: (id: string, updates: any) => request<any>(`/api/brokers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  }),

  // Tickets
  getTickets: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>(`/api/tickets${qs}`);
  },
  getTicketById: (id: string) => request<any>(`/api/tickets/${id}`),
  createTicket: (ticket: any) => request<any>('/api/tickets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ticket)
  }),
  updateTicket: (id: string, updates: any) => request<any>(`/api/tickets/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  }),
  addTicketMessage: (ticketId: string, message: any) => request<any>(`/api/tickets/${ticketId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message)
  }),
  updateTicketStatus: (ticketId: string, status: string) => request<any>(`/api/tickets/${ticketId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  }),

  // Settlements
  getSettlements: () => request<any[]>('/api/settlements'),
  createSettlement: (settlement: any) => request<any>('/api/settlements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settlement)
  }),
  updateSettlementStatus: (id: string, status: string) => request<any>(`/api/settlements/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  }),

  // Compliance
  getFleetComplianceMatrix: () => request<any[]>('/api/compliance/matrix'),
  getVerificationQueue: () => request<any[]>('/api/compliance/queue'),
  getExpiringDocuments: () => request<any[]>('/api/compliance/expiring'),
  getComplianceAuditLogs: (driverId?: string) => request<any[]>(`/api/compliance/audit-logs${driverId ? `?driverId=${driverId}` : ''}`),
  getDriverComplianceDocs: (driverId: string) => request<any[]>(`/api/compliance/drivers/${driverId}/documents`),
  getComplianceDocuments: (params?: any) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>(`/api/compliance/documents${qs}`);
  },
  getDriverConsent: (driverId: string) => request<any>(`/api/compliance/drivers/${driverId}/consent`),
  updateDriverConsent: (payload: any) => request<any>('/api/compliance/consent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }),
  recordDriverConsent: (driverId: string | any, consentVersion?: string, ipAddress?: string) => request<any>('/api/compliance/consent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(typeof driverId === 'object' ? driverId : { driverId, consentVersion, ipAddress, consentGiven: true })
  }),
  verifyComplianceDoc: (docId: string, payload: any) => request<any>(`/api/compliance/documents/${docId}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }),
  verifyComplianceDocument: (docId: string, payload: any) => request<any>(`/api/compliance/documents/${docId}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }),
  rejectComplianceDoc: (docId: string, payload: any) => request<any>(`/api/compliance/documents/${docId}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }),
  uploadComplianceDoc: (payload: any) => request<any>('/api/compliance/documents/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }),
  uploadComplianceDocument: (payload: any) => request<any>('/api/compliance/documents/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }),
  deleteComplianceDocument: (docId: string, payload?: any) => request<any>(`/api/compliance/documents/${docId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {})
  }),
  scanComplianceDocumentAI: (payload: any) => request<any>('/api/compliance/scan-ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }),
  scanDocumentWithAI: (docType: string | any, meta?: any) => request<any>('/api/compliance/scan-ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(typeof docType === 'object' ? docType : { docType, ...meta })
  }),
  sendComplianceReminder: (driverId: string, payload: any) => request<any>(`/api/compliance/drivers/${driverId}/remind`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }),

  // App Analytics
  getAppMetadataList: () => request<any[]>('/api/analytics/apps'),
  getAppOverview: (appTarget: string, periodDays: number) => request<any>(`/api/analytics/overview?appTarget=${appTarget}&days=${periodDays}`),
  getAppFunnel: (appTarget: string) => request<any[]>(`/api/analytics/funnel?appTarget=${appTarget}`),
  getAppTrafficSources: (appTarget: string) => request<any[]>(`/api/analytics/traffic-sources?appTarget=${appTarget}`),
  getAppCohorts: (appTarget: string) => request<any[]>(`/api/analytics/cohorts?appTarget=${appTarget}`),
  getAppReviews: (appTarget: string) => request<any[]>(`/api/analytics/reviews?appTarget=${appTarget}`),
  getAppSentimentSummary: (appTarget: string) => request<any>(`/api/analytics/sentiment?appTarget=${appTarget}`),
  getAppAiRecommendations: (appTarget: string) => request<any[]>(`/api/analytics/recommendations?appTarget=${appTarget}`),
  generateAppAiRecommendations: (appTarget: string) => request<any[]>(`/api/analytics/recommendations/generate?appTarget=${appTarget}`, {
    method: 'POST'
  }),
  createAppTrafficSource: (payload: any) => request<any>('/api/analytics/traffic-sources', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }),
  deleteAppTrafficSource: (id: string) => request<any>(`/api/analytics/traffic-sources/${id}`, {
    method: 'DELETE'
  }),
  createAppReview: (payload: any) => request<any>('/api/analytics/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }),
  importAnalyticsCsv: (payload: any) => request<any>('/api/analytics/import-csv', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }),
  importAppMetricsCsv: (payload: any) => request<any>('/api/analytics/import-csv', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }),
  addTrafficCampaign: (payload: any) => request<any>('/api/analytics/campaigns', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }),

  // Marketing & AI Strategy
  getMarketingAnalytics: () => request<any>('/api/marketing/analytics'),
  getMarketingCampaigns: () => request<any[]>('/api/marketing/campaigns'),
  getMarketingChannels: () => request<any[]>('/api/marketing/channels'),
  getStrategyReports: () => request<any[]>('/api/marketing/strategy-reports'),
  getPassengerSegments: () => request<any[]>('/api/marketing/passenger-segments'),
  getDriverOptimization: () => request<any>('/api/marketing/driver-optimization'),
  getPromoCampaigns: () => request<any[]>('/api/marketing/promo-campaigns'),
  getTicketSentiment: () => request<any>('/api/marketing/ticket-sentiment'),
  getAutoReportConfig: () => request<any>('/api/marketing/auto-report-config'),
  generateStrategyReport: (params?: any) => request<any>('/api/marketing/strategy-reports/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params || {})
  }),
  deleteStrategyReport: (id: string) => request<any>(`/api/marketing/strategy-reports/${id}`, { method: 'DELETE' }),
  createPromoCampaign: (campaign: any) => request<any>('/api/marketing/promo-campaigns', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(campaign)
  }),
  generateMarketingCopy: (payload: any) => request<any>('/api/gemini/generate-ad-variants', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }),
  generateAdCopy: (prompt: any) => request<any>('/api/marketing/generate-ad-copy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(prompt)
  }),
  triggerSentimentAnalysis: () => request<any>('/api/marketing/trigger-sentiment-analysis', { method: 'POST' }),
  updateAutoReportConfig: (config: any) => request<any>('/api/marketing/auto-report-config', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  }),

  // Referrals
  getReferralProgramStats: () => request<any>('/api/referrals/stats'),
  getReferralStats: () => request<any>('/api/referrals/stats'),
  getReferrals: (params?: any) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>(`/api/referrals${qs}`);
  },
  getDriverReferrals: (driverId: string) => request<any[]>(`/api/referrals/driver/${driverId}`),
  getCommissionLogs: (driverId?: string) => request<any[]>(`/api/referrals/commission-logs${driverId ? `?driverId=${driverId}` : ''}`),
  getReferralRewards: () => request<any[]>('/api/referrals/rewards'),
  getReferralSettings: () => request<any>('/api/referrals/settings'),
  getReferralTiers: () => request<any[]>('/api/referrals/tiers'),
  getDriverReferralCodes: () => request<any[]>('/api/referrals/codes'),
  getReferralPayouts: () => request<any[]>('/api/referrals/payouts'),
  getReferralLeaderboard: () => request<any[]>('/api/referrals/leaderboard'),
  getReferralFraudAlerts: () => request<any[]>('/api/referrals/fraud-alerts'),
  getReferralPromoMaterials: () => request<any[]>('/api/referrals/promo-materials'),
  activateReferral: (id: string) => request<any>(`/api/referrals/${id}/activate`, { method: 'POST' }),
  reviewSuspiciousReferral: (id: string, action: string) => request<any>(`/api/referrals/${id}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action })
  }),
  createReferral: (referral: any) => request<any>('/api/referrals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(referral)
  }),
  updateReferralSettings: (settings: any) => request<any>('/api/referrals/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  }),
  generateReferralCode: (driverId: string) => request<any>('/api/referrals/generate-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ driverId })
  }),
  validateReferralCode: (code: string) => request<any>(`/api/referrals/validate/${encodeURIComponent(code)}`),

  // External API Simulation
  simulateExternalOrder: (payload: any, apiKey: string) => request<any>('/api/external/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey
    },
    body: JSON.stringify(payload)
  }),
  simulateExternalDriverApp: (payload: any, apiKey: string) => request<any>('/api/external/driver-applications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey
    },
    body: JSON.stringify(payload)
  }),

  // AI Assistant Panel
  processAiCommand: (payload: any) => request<any>('/api/ai-agent/command', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }),
  sendAiAgentCommand: (command: any, actor?: any) => request<any>('/api/ai-agent/command', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(typeof command === 'object' ? command : { command, actor })
  }),
  getAiAuditLogs: (role?: string) => request<any[]>(`/api/ai-agent/audit-logs${role ? `?role=${role}` : ''}`),
  getAiAgentAuditLogs: (role?: string) => request<any[]>(`/api/ai-agent/audit-logs${role ? `?role=${role}` : ''}`),
  executeAiAction: (actionIdOrPayload: string | any, actor?: any) => {
    const actionId = typeof actionIdOrPayload === 'string' ? actionIdOrPayload : actionIdOrPayload?.action?.id || actionIdOrPayload?.actionId;
    const body = typeof actionIdOrPayload === 'string' ? (actor || {}) : actionIdOrPayload;
    return request<any>(`/api/ai-agent/actions/${actionId}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  },
  executeAiAgentAction: (actionIdOrPayload: string | any, actor?: any) => {
    const actionId = typeof actionIdOrPayload === 'string' ? actionIdOrPayload : actionIdOrPayload?.action?.id || actionIdOrPayload?.actionId;
    const body = typeof actionIdOrPayload === 'string' ? (actor || {}) : actionIdOrPayload;
    return request<any>(`/api/ai-agent/actions/${actionId}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  },

  // Employees & Face ID
  getEmployees: (role?: string) => request<any[]>(`/api/employees${role ? `?role=${role}` : ''}`),
  getEmployeeInvitations: () => request<any[]>('/api/employees/invitations'),
  createEmployeeInvitation: (payload: any) => request<any>('/api/employees/invitations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }),
  previewInvitationToken: (token: string) => request<any>(`/api/employees/invite-preview/${encodeURIComponent(token)}`),
  registerEmployee: (payload: any) => request<any>('/api/employees/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }),
  verifyFaceLogin: (payload: any) => request<any>('/api/auth/face-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }),
  passwordLogin: (payload: any) => request<any>('/api/auth/password-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }),
  getLoginAuditLogs: (employeeId?: string) => request<any[]>(`/api/auth/login-audit${employeeId ? `?employeeId=${employeeId}` : ''}`),
  updateEmployeeStatus: (employeeId: string, status: string) => request<any>(`/api/employees/${employeeId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  }),
  resetEmployeeFace: (employeeId: string, adminName: string) => request<any>(`/api/employees/${employeeId}/reset-face`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminName })
  }),
  updateLocationConsent: (payload: any) => request<any>('/api/employees/location/consent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }),
  sendLocationHeartbeat: (payload: any) => request<any>('/api/employees/location/heartbeat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }),
  getLiveLocations: () => request<any[]>('/api/employees/location/live?role=admin'),

  // =========================================================================
  // CLONE APP ADMIN PANEL REST API INTEGRATION
  // =========================================================================
  getIntegrationStatus: () => request<any>('/api/integration/status'),
  getIntegrationConfig: () => request<any>('/api/integration/config'),
  updateIntegrationConfig: (config: any) => request<any>('/api/integration/config', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  }),
  syncLiveOrders: () => request<any>('/api/integration/sync/live-orders', { method: 'POST' }),
  syncDrivers: () => request<any>('/api/integration/sync/drivers', { method: 'POST' }),
  refreshIntegrationAuth: () => request<any>('/api/integration/auth/refresh', { method: 'POST' }),
  testIntegrationConnection: () => request<any>('/api/integration/auth/test', { method: 'POST' }),
  getIntegrationLogs: (params?: { type?: string; status?: string }) => {
    const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return request<any[]>(`/api/integration/logs${qs}`);
  },
  getFieldMappings: () => request<any[]>('/api/integration/mappings'),
  sendIntegrationWebhook: (payload: any) => request<any>('/api/integration/webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
};
