import { 
  Driver, 
  Order, 
  ExternalCloneDriverPayload, 
  ExternalCloneOrderPayload,
  SyncAuditLog,
  IntegrationStatus,
  IntegrationConfig
} from '../src/types';

interface AuthTokenState {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null; // epoch ms
  isRefreshing: boolean;
  consecutiveAuthErrors: number;
  lastRefreshTime: string | null;
}

interface RequestRateLimiter {
  timestamps: number[];
  maxPerMinute: number;
}

/**
 * AdminPanelClient - Unified Backend Integration Gateway
 * 
 * Exclusively responsible for all communications between Accessible Transit CRM
 * and the live Accessible Transit Admin Panel REST API.
 * 
 * Features:
 * - Secure admin sign-in from environment variables
 * - Re-authentication before the upstream session expires
 * - Exponential backoff retry logic for transient API faults
 * - Token-safe audit logging (no raw tokens written to logs)
 * - Rate limiting to safeguard against upstream IP bans
 * - HTTPS-only enforcement in production
 * - Explicit failures when a required upstream resource is unavailable
 */
export class AdminPanelClient {
  private static instance: AdminPanelClient;

  // Configuration (read strictly from env vars)
  private baseUrl: string;
  private historyBaseUrl: string;
  private driverType: number;
  private authMode: 'accessible_transit_admin';
  private clientId: string;
  private clientSecret: string;
  private username: string;
  private passwordMasked: boolean;
  private isConfigured: boolean;

  // Auth State
  private authState: AuthTokenState = {
    accessToken: null,
    refreshToken: null,
    expiresAt: null,
    isRefreshing: false,
    consecutiveAuthErrors: 0,
    lastRefreshTime: null
  };

  // Rate Limiting
  private rateLimiter: RequestRateLimiter = {
    timestamps: [],
    maxPerMinute: 120 // 2 requests per second average max
  };

  // Status & Telemetry
  private syncAuditLogs: SyncAuditLog[] = [];
  private consecutiveErrors: number = 0;
  private firstFailureTimestamp: number | null = null;
  private totalSyncedDrivers: number = 0;
  private totalSyncedOrders: number = 0;
  private totalSyncErrors: number = 0;
  private lastLiveOrdersSync: string | null = null;
  private lastDriversSync: string | null = null;
  private lastError: string | null = null;
  private lastErrorTime: string | null = null;

  // Legacy fixtures are kept only for webhook compatibility. They must never be
  // returned as live data because that would hide a broken upstream connection.
  private mockExternalDrivers: ExternalCloneDriverPayload[] = [
    {
      id: "CLONE_DRV_8921",
      full_name: "Tariq Al-Mansoor",
      phone: "+1 (718) 555-8921",
      email: "tariq.mansoor@accessibletransit.com",
      tlc_license_number: "TLC-4992104",
      status: "active",
      vehicle: {
        type: "WAV",
        make_model: "2024 Toyota Sienna WAV (BraunAbility)",
        plate: "T789211C",
        year: 2024,
        is_wheelchair_accessible: true
      },
      operating_boroughs: ["Jackson Heights", "Jamaica", "Astoria"],
      rating: 4.98,
      total_trips: 1420,
      is_online: true,
      location: {
        lat: 40.7557,
        lng: -73.8831,
        neighborhood: "Jackson Heights",
        updated_at: new Date().toISOString()
      },
      updated_at: new Date().toISOString()
    },
    {
      id: "CLONE_DRV_3390",
      full_name: "Guillermo Ramirez",
      phone: "+1 (917) 555-3390",
      email: "g.ramirez@accessibletransit.com",
      tlc_license_number: "TLC-5829103",
      status: "active",
      vehicle: {
        type: "WAV",
        make_model: "2023 Chrysler Pacifica WAV",
        plate: "T610944C",
        year: 2023,
        is_wheelchair_accessible: true
      },
      operating_boroughs: ["Jamaica", "Flushing", "Long Island City"],
      rating: 4.91,
      total_trips: 890,
      is_online: true,
      location: {
        lat: 40.7027,
        lng: -73.7890,
        neighborhood: "Jamaica",
        updated_at: new Date().toISOString()
      },
      updated_at: new Date().toISOString()
    },
    {
      id: "CLONE_DRV_7741",
      full_name: "Dmitry Volkov",
      phone: "+1 (347) 555-7741",
      email: "d.volkov@accessibletransit.com",
      tlc_license_number: "TLC-3910245",
      status: "active",
      vehicle: {
        type: "Green",
        make_model: "2023 Toyota Camry Hybrid",
        plate: "T441902C",
        year: 2023,
        is_wheelchair_accessible: false
      },
      operating_boroughs: ["Astoria", "Long Island City", "Jackson Heights"],
      rating: 4.88,
      total_trips: 1140,
      is_online: false,
      location: {
        lat: 40.7644,
        lng: -73.9235,
        neighborhood: "Astoria",
        updated_at: new Date().toISOString()
      },
      updated_at: new Date().toISOString()
    },
    {
      id: "CLONE_DRV_9042",
      full_name: "Kwame Asante",
      phone: "+1 (718) 555-9042",
      email: "kwame.asante@accessibletransit.com",
      tlc_license_number: "TLC-7740192",
      status: "pending_approval",
      vehicle: {
        type: "WAV",
        make_model: "2024 Ford Transit WAV",
        plate: "T820194C",
        year: 2024,
        is_wheelchair_accessible: true
      },
      operating_boroughs: ["Flushing", "Jamaica"],
      rating: 5.0,
      total_trips: 0,
      is_online: false,
      location: {
        lat: 40.7590,
        lng: -73.8300,
        neighborhood: "Flushing",
        updated_at: new Date().toISOString()
      },
      updated_at: new Date().toISOString()
    }
  ];

  private mockExternalOrders: ExternalCloneOrderPayload[] = [
    {
      id: "CLONE_ORD_10091",
      order_code: "APP-NYC-10091",
      status: "EN_ROUTE",
      passenger: {
        name: "Elena Rostova",
        phone: "+1 (718) 555-1192"
      },
      driver: {
        external_id: "CLONE_DRV_8921",
        name: "Tariq Al-Mansoor",
        phone: "+1 (718) 555-8921"
      },
      pickup: {
        address: "74-09 37th Ave, Jackson Heights, NY 11372",
        neighborhood: "Jackson Heights",
        lat: 40.7505,
        lng: -73.8901
      },
      dropoff: {
        address: "82-68 164th St (Queens Hospital Medical Center), Jamaica, NY 11432",
        neighborhood: "Jamaica",
        lat: 40.7180,
        lng: -73.7990
      },
      fare: {
        total_amount: 54.50,
        rate: 54.50,
        copay: 0,
        commission_rate: 0.15
      },
      vehicle_type: "WAV",
      requires_wav: true,
      created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 60 * 1000).toISOString()
    },
    {
      id: "CLONE_ORD_10092",
      order_code: "APP-NYC-10092",
      status: "NEW",
      passenger: {
        name: "Marcus Vance",
        phone: "+1 (917) 555-4421"
      },
      pickup: {
        address: "31-10 Thomson Ave, Long Island City, NY 11101",
        neighborhood: "Long Island City",
        lat: 40.7441,
        lng: -73.9360
      },
      dropoff: {
        address: "136-20 38th Ave, Flushing, NY 11354",
        neighborhood: "Flushing",
        lat: 40.7602,
        lng: -73.8315
      },
      fare: {
        total_amount: 48.00,
        rate: 48.00,
        copay: 0,
        commission_rate: 0.15
      },
      vehicle_type: "Green",
      requires_wav: false,
      created_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 3 * 60 * 1000).toISOString()
    }
  ];

  public constructor() {
    this.baseUrl = (process.env.AT_ADMIN_API_BASE_URL || 'https://api.accessibletransit.com').replace(/\/$/, '');
    this.historyBaseUrl = (process.env.AT_ADMIN_HISTORY_API_BASE_URL || 'https://history.accessibletransit.com').replace(/\/$/, '');
    this.driverType = Number(process.env.AT_ADMIN_DRIVER_TYPE || '3');
    this.authMode = 'accessible_transit_admin';
    this.clientId = 'accessible-transit-admin';
    this.clientSecret = '';
    this.username = process.env.AT_ADMIN_USERNAME || '';
    this.passwordMasked = Boolean(process.env.AT_ADMIN_PASSWORD);
    this.isConfigured = Boolean(this.username && this.passwordMasked);

    this.addLog({
      type: 'auth_token_issued',
      status: 'info',
      summary: 'AdminPanelClient initialized in CRM backend',
      details: `Admin API: ${this.baseUrl} | History API: ${this.historyBaseUrl} | Auth Mode: Accessible Transit Admin Sign-in | Credentials configured: ${this.isConfigured ? 'yes' : 'no'}`
    });
  }

  public static getInstance(): AdminPanelClient {
    if (!AdminPanelClient.instance) {
      AdminPanelClient.instance = new AdminPanelClient();
    }
    return AdminPanelClient.instance;
  }

  // =========================================================================
  // 1. AUTHORIZATION & TOKEN LIFECYCLE MANAGEMENT
  // =========================================================================

  /**
   * Authenticate and obtain JWT + Refresh Token
   */
  public async authenticate(forceRefresh: boolean = false): Promise<{ success: boolean; message: string }> {
    const startTime = Date.now();

    // Check if current token is still valid (with 60-second safety window)
    if (!forceRefresh && this.authState.accessToken && this.authState.expiresAt) {
      const remainingMs = this.authState.expiresAt - Date.now();
      if (remainingMs > 60 * 1000) {
        return { success: true, message: `Token valid for ${(remainingMs / 1000).toFixed(0)}s` };
      }
    }

    this.authState.isRefreshing = true;

    try {
      // The Admin Panel exposes a short-lived login session rather than a
      // refresh-token endpoint, so every renewal safely performs a new sign-in.
      const result = await this.executeLoginWithRetry();
      this.authState.isRefreshing = false;
      return result;
    } catch (err: any) {
      this.authState.isRefreshing = false;
      this.authState.consecutiveAuthErrors++;
      this.handleApiError('authenticate', err);
      return { success: false, message: `Authentication error: ${this.redactSensitiveErrorMessage(err)}` };
    }
  }

  /**
   * Internal Login execution with exponential backoff retries
   */
  private async executeLoginWithRetry(maxRetries: number = 3): Promise<{ success: boolean; message: string }> {
    let attempt = 0;
    let delayMs = 500;
    const startedAt = Date.now();

    while (attempt < maxRetries) {
      attempt++;
      try {
        this.assertSecureServiceUrl(this.baseUrl, 'Admin API');
        this.assertSecureServiceUrl(this.historyBaseUrl, 'history API');

        if (!this.isConfigured) {
          throw new Error('AT_ADMIN_USERNAME and AT_ADMIN_PASSWORD must be configured before connecting to the Admin Panel.');
        }

        const deviceTokenResponse = await fetch(`${this.baseUrl}/api/auth/get_token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'type': '1',
            'User-Agent': 'AccessibleTransit-CRM/2026.1'
          },
          body: JSON.stringify({
            deviceId: 'at-crm-sync-service',
            deviceType: 'WEB',
            manufacturer: 'Replit',
            deviceName: 'Accessible Transit CRM',
            os: 'Linux',
            appVersion: '1.0.0',
            isShowSuccessToast: false
          })
        });

        const deviceToken = deviceTokenResponse.headers.get('authorization');
        if (!deviceTokenResponse.ok || !deviceToken) {
          throw new Error(`Admin Panel device-token request failed (HTTP ${deviceTokenResponse.status}).`);
        }

        const response = await fetch(`${this.baseUrl}/api/auth/signin`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'type': '1',
            'Authorization': deviceToken,
            'User-Agent': 'AccessibleTransit-CRM/2026.1'
          },
          body: JSON.stringify({
            email: this.username,
            username: this.username,
            password: process.env.AT_ADMIN_PASSWORD,
            loginBy: 1,
            deviceId: 'at-crm-sync-service',
            deviceType: 'WEB',
            isShowSuccessToast: false
          })
        });

        const accessToken = response.headers.get('authorization');
        if (!response.ok || !accessToken) {
          throw new Error(`Admin Panel sign-in failed (HTTP ${response.status}).`);
        }
        
        this.authState.accessToken = accessToken;
        this.authState.refreshToken = null;
        // The upstream API does not disclose token expiry. Renew early instead
        // of persisting credentials or treating an expired session as valid.
        this.authState.expiresAt = Date.now() + (20 * 60 * 1000);
        this.authState.lastRefreshTime = new Date().toISOString();
        this.authState.consecutiveAuthErrors = 0;
        this.consecutiveErrors = 0;
        this.firstFailureTimestamp = null;

        this.addLog({
          type: 'auth_token_issued',
          status: 'success',
          summary: `Admin Panel session established (attempt ${attempt})`,
          details: 'Authenticated using the configured Admin Panel account. Session value is never logged.',
          durationMs: Date.now() - startedAt
        });

        return { success: true, message: 'Authenticated successfully with Accessible Transit Admin Panel' };
      } catch (err: any) {
        if (attempt >= maxRetries) {
          this.addLog({
            type: 'auth_error',
            status: 'error',
            summary: `Authentication failed after ${attempt} attempts`,
            details: this.redactSensitiveErrorMessage(err)
          });
          throw err;
        }
        await new Promise(res => setTimeout(res, delayMs));
        delayMs *= 2; // Exponential backoff: 500ms -> 1000ms -> 2000ms
      }
    }

    return { success: false, message: 'Max authentication retries exceeded' };
  }

  private assertSecureServiceUrl(url: string, serviceName: string): void {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      throw new Error(`Invalid ${serviceName} URL configuration.`);
    }

    const localDevelopmentHosts = new Set(['localhost', '127.0.0.1', '::1']);
    if (parsedUrl.protocol !== 'https:' && !(parsedUrl.protocol === 'http:' && localDevelopmentHosts.has(parsedUrl.hostname))) {
      throw new Error(`Insecure HTTP protocol blocked for ${serviceName}. HTTPS is required for AdminPanelClient communications.`);
    }
  }

  /**
   * Refresh token execution
   */
  private async executeRefreshTokenRequest(): Promise<boolean> {
    return false;
  }

  /**
   * Ensure token is valid before sending any request
   */
  private async ensureAuthenticated(): Promise<void> {
    if (!this.authState.accessToken || (this.authState.expiresAt && this.authState.expiresAt - Date.now() < 30000)) {
      const result = await this.authenticate();
      if (!result.success) throw new Error(result.message);
    }
  }

  // =========================================================================
  // 2. RATE LIMITING & REQUEST DISPATCHER
  // =========================================================================

  private async checkRateLimit(): Promise<void> {
    while (true) {
      const now = Date.now();
      const oneMinuteAgo = now - 60000;
      this.rateLimiter.timestamps = this.rateLimiter.timestamps.filter(t => t > oneMinuteAgo);

      if (this.rateLimiter.timestamps.length < this.rateLimiter.maxPerMinute) {
        this.rateLimiter.timestamps.push(now);
        return;
      }

      const oldestRequest = this.rateLimiter.timestamps[0];
      const waitMs = Math.max(1000, oldestRequest + 60000 - now);
      this.addLog({
        type: 'rate_limit_throttle',
        status: 'warning',
        summary: 'Rate limit threshold reached: request throttled',
        details: `Current: ${this.rateLimiter.timestamps.length} req/min (Limit: ${this.rateLimiter.maxPerMinute})`
      });
      await new Promise(resolve => setTimeout(resolve, waitMs));
    }
  }

  private getTripHistoryPollIntervalMs(): number {
    const configuredMs = parseInt(process.env.CLONE_SYNC_POLL_INTERVAL_MS || '600000', 10);
    return Math.max(Number.isFinite(configuredMs) ? configuredMs : 600000, 600000);
  }

  // =========================================================================
  // 3. EXTERNAL API DATA FETCH METHODS (DRIVERS, ORDERS, LOCATIONS)
  // =========================================================================

  private async fetchAdminCollection(
    serviceBaseUrl: string,
    path: string,
    params?: Record<string, string | number | undefined>
  ): Promise<Record<string, any>[]> {
    const url = new URL(`${serviceBaseUrl}${path}`);
    for (const [key, value] of Object.entries(params || {})) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }

    const requestCollection = async () => {
      await this.checkRateLimit();
      return fetch(url, {
        headers: {
          'Authorization': this.authState.accessToken || '',
          'type': '1',
          'Accept': 'application/json'
        }
      });
    };

    let response = await requestCollection();

    // The Admin Panel can invalidate a session while the configured credentials
    // remain valid. Its gateway reports this as 409 rather than a conventional
    // 401, so refresh the server-side session once and retry the same read.
    if ([401, 403, 409].includes(response.status)) {
      const refresh = await this.authenticate(true);
      if (refresh.success) {
        response = await requestCollection();
      }
    }

    if (!response.ok) {
      throw new Error(`Admin Panel resource ${path} failed (HTTP ${response.status}).`);
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new Error(`Admin Panel resource ${path} returned a non-JSON response.`);
    }
    const data: any = (body && typeof body === 'object'
      ? (body as Record<string, unknown>).data
      : undefined) ?? body;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.users)) return data.users;
    if (Array.isArray(data?.drivers)) return data.drivers;
    if (Array.isArray(data?.bookings)) return data.bookings;
    if (Array.isArray(data?.orders)) return data.orders;
    throw new Error(`Admin Panel resource ${path} returned an unrecognized collection envelope.`);
  }

  private async fetchAllAdminCollection(
    serviceBaseUrl: string,
    path: string,
    params?: Record<string, string | number | undefined>
  ): Promise<Record<string, any>[]> {
    const limit = Number(params?.limit || 100);
    const records: Record<string, any>[] = [];
    const seenRecordIds = new Set<string>();

    for (let page = 1; ; page++) {
      const batch = await this.fetchAdminCollection(serviceBaseUrl, path, { ...params, page, limit });
      const newRecords = batch.filter((record) => {
        const id = record._id || record.id || record.bookingId || record.driverId;
        if (!id) return true;
        if (seenRecordIds.has(String(id))) return false;
        seenRecordIds.add(String(id));
        return true;
      });
      records.push(...newRecords);
      if (batch.length < limit) return records;
      if (newRecords.length === 0) {
        throw new Error(`Admin Panel resource ${path} returned a duplicate page; synchronization stopped to prevent a loop.`);
      }
    }
  }

  private asIsoTimestamp(value: unknown): string {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return new Date(value < 100_000_000_000 ? value * 1000 : value).toISOString();
    }
    if (typeof value === 'string' && value.trim()) {
      const parsed = Date.parse(value);
      return Number.isNaN(parsed) ? new Date().toISOString() : new Date(parsed).toISOString();
    }
    return new Date().toISOString();
  }

  private mapDriverStatus(rawStatus: unknown): ExternalCloneDriverPayload['status'] {
    const status = typeof rawStatus === 'number' ? rawStatus : String(rawStatus || '').toLowerCase();
    if (status === 1 || status === 'active' || status === 'approved') return 'active';
    if (status === 3 || status === 'unapproved' || status === 'pending' || status === 'pending_approval') return 'pending_approval';
    if (status === 4 || status === 'rejected') return 'rejected';
    if (status === 2 || status === 6 || status === 'inactive' || status === 'suspended' || status === 'blocked') return 'suspended';
    return 'offline';
  }

  private mapBookingStatus(rawStatus: unknown, completedAt?: unknown): ExternalCloneOrderPayload['status'] {
    const status = typeof rawStatus === 'number' ? rawStatus : String(rawStatus || '').toUpperCase();
    if (status === 70 || status === 'ARRIVED_AT_DESTINATION' || status === 'COMPLETED') return 'COMPLETED';
    if (status === 90 || status === 'CANCELLED' || status === 'CANCELED') return 'CANCELLED';
    if (completedAt) return 'COMPLETED';
    if (status === 10 || status === 'REQUESTED' || status === 'NEW') return 'NEW';
    if (status === 20 || status === 30 || status === 'ASSIGNED' || status === 'ACCEPTED') return 'ACCEPTED';
    if (status === 40 || status === 50 || status === 'IN_ROUTE' || status === 'ARRIVED_AT_PICKUP') return 'EN_ROUTE';
    if (status === 60 || status === 'STARTED' || status === 'ON_TRIP') return 'ON_TRIP';
    return 'NEW';
  }

  private mapAdminDriver(raw: Record<string, any>): ExternalCloneDriverPayload {
    const vehicle = raw.vehicleDetail || raw.vehicle || {};
    const location = raw.location || raw.currentLocation;
    const fullName = raw.fullName || raw.name || `${raw.firstName || ''} ${raw.lastName || ''}`.trim();
    const phone = [raw.countryPhoneCode, raw.phone || raw.phoneNumber].filter(Boolean).join(' ').trim();

    return {
      id: String(raw._id || raw.id || raw.driverId),
      full_name: String(fullName || 'Unknown driver'),
      phone,
      email: raw.email || undefined,
      tlc_license_number: String(raw.tlcLicenseNumber || raw.licenseNumber || raw.license || ''),
      status: this.mapDriverStatus(raw.status ?? raw.driverStatus),
      vehicle: {
        type: String(vehicle.type || vehicle.vehicleType || raw.vehicleType?.name || raw.vehicleType || ''),
        make_model: String(vehicle.make_model || vehicle.makeModel || `${vehicle.make || ''} ${vehicle.model || ''}`.trim()),
        plate: String(vehicle.plate || vehicle.plateNumber || raw.vehiclePlate || ''),
        year: Number(vehicle.year || raw.vehicleYear || 0),
        is_wheelchair_accessible: Boolean(vehicle.is_wheelchair_accessible ?? vehicle.isWheelchairAccessible ?? raw.isWheelchairAccessible)
      },
      operating_boroughs: Array.isArray(raw.operatingBoroughs) ? raw.operatingBoroughs : undefined,
      rating: Number(raw.rating || 0) || undefined,
      total_trips: Number(raw.totalTrips || raw.completedTrips || 0) || undefined,
      is_online: Boolean(raw.isOnline ?? raw.online),
      location: location && Number.isFinite(Number(location.lat ?? location.latitude)) && Number.isFinite(Number(location.lng ?? location.longitude))
        ? {
            lat: Number(location.lat ?? location.latitude),
            lng: Number(location.lng ?? location.longitude),
            neighborhood: String(location.neighborhood || location.address || ''),
            updated_at: String(location.updated_at || location.updatedAt || new Date().toISOString())
          }
        : undefined,
      updated_at: raw.updatedAt || raw.updated_at || raw.lastActiveAt || raw.createdAt
    };
  }

  private mapAdminOrder(raw: Record<string, any>): ExternalCloneOrderPayload {
    const pickup = raw.pickupAddress || raw.pickup || raw.pickupLocation || {};
    const destinationAddresses = raw.destinationAddresses || [];
    const dropoff = destinationAddresses[destinationAddresses.length - 1] || raw.dropoff || raw.destination || raw.dropoffLocation || {};
    const passenger = raw.customerDetail || raw.passenger || raw.user || raw.customer || {};
    const driver = raw.driverDetail || raw.driver || raw.providerDetail || {};
    const invoice = raw.bookingInvoice?.actual || raw.bookingInvoice?.estimated || raw.bookingInvoice || {};

    return {
      id: String(raw._id || raw.id || raw.bookingId),
      order_code: String(raw.uniqueId || raw.bookingNumber || raw.orderCode || raw._id || raw.id),
      status: this.mapBookingStatus(raw.status || raw.bookingStatus, raw.completedAt),
      passenger: {
        name: String(passenger.fullName || passenger.name || raw.userName || ''),
        phone: String(passenger.phone || passenger.phoneNumber || raw.userPhone || '')
      },
      driver: driver && (driver._id || driver.id)
        ? {
            external_id: String(driver._id || driver.id),
            name: String(driver.fullName || driver.name || ''),
            phone: String(driver.phone || driver.phoneNumber || '')
          }
        : undefined,
      pickup: {
        address: String(pickup.address || pickup.addressText || raw.pickupAddress || ''),
        neighborhood: String(pickup.neighborhood || pickup.city || ''),
        lat: Number(pickup.lat ?? pickup.latitude) || undefined,
        lng: Number(pickup.lng ?? pickup.longitude) || undefined
      },
      dropoff: {
        address: String(dropoff.address || dropoff.addressText || raw.destinationAddress || ''),
        neighborhood: String(dropoff.neighborhood || dropoff.city || ''),
        lat: Number(dropoff.lat ?? dropoff.latitude) || undefined,
        lng: Number(dropoff.lng ?? dropoff.longitude) || undefined
      },
      fare: {
        total_amount: Number(invoice.total ?? raw.totalFare ?? raw.totalAmount ?? raw.estimatedFare ?? 0),
        rate: Number(invoice.total ?? raw.rate ?? raw.fare ?? 0) || undefined,
        copay: Number(raw.copay || 0) || undefined,
        commission_rate: Number(raw.commissionRate || 0) || undefined
      },
      vehicle_type: raw.vehicleType?.name || raw.vehicleType || raw.vehicle?.type,
      requires_wav: Boolean(raw.requiresWav || raw.isWheelchairAccessible),
      created_at: this.asIsoTimestamp(raw.createdAt || raw.created_at || raw.bookingTime),
      updated_at: this.asIsoTimestamp(raw.updatedAt || raw.updated_at || raw.completedAt || raw.createdAt || raw.bookingTime),
      completed_at: raw.completedAt ? this.asIsoTimestamp(raw.completedAt) : undefined
    };
  }

  /**
   * Fetch Driver Profiles from Clone Admin Panel API
   */
  public async fetchDrivers(params?: { updatedSince?: string; limit?: number }): Promise<ExternalCloneDriverPayload[]> {
    await this.ensureAuthenticated();
    const startTime = Date.now();

    try {
      const endpoint = (process.env.AT_ADMIN_DRIVERS_PATH || '/api/user/{type}')
        .replace('{type}', String(this.driverType));
      const drivers = (await this.fetchAllAdminCollection(this.baseUrl, endpoint, {
        page: 1,
        limit: params?.limit || 100
      })).map((driver) => this.mapAdminDriver(driver));
      
      this.totalSyncedDrivers = drivers.length;
      this.lastDriversSync = new Date().toISOString();

      this.addLog({
        type: 'driver_profile_sync',
        status: 'success',
        summary: `Synchronized ${drivers.length} driver profiles from Accessible Transit Admin`,
        recordsCount: drivers.length,
        durationMs: Date.now() - startTime,
        endpoint
      });

      return drivers;
    } catch (err: any) {
      this.handleApiError('fetchDrivers', err);
      throw err;
    }
  }

  /**
   * Fetch Live Orders & Statuses (for Live Orders & Dispatch Polling)
   */
  public async fetchLiveOrders(params?: { status?: string; updatedSince?: string; limit?: number }): Promise<ExternalCloneOrderPayload[]> {
    await this.ensureAuthenticated();
    const startTime = Date.now();

    try {
      const endpoint = process.env.AT_ADMIN_ORDERS_PATH || '/api/booking_history';
      const orders = (await this.fetchAllAdminCollection(this.historyBaseUrl, endpoint, {
        page: 1,
        limit: params?.limit || 100
      })).map((order) => this.mapAdminOrder(order));

      this.totalSyncedOrders = orders.length;
      this.lastLiveOrdersSync = new Date().toISOString();

      this.addLog({
        type: 'orders_poll',
        status: 'success',
        summary: `Trip history sync: ${orders.length} bookings synchronized from Accessible Transit Admin`,
        recordsCount: orders.length,
        durationMs: Date.now() - startTime,
        endpoint
      });

      return orders;
    } catch (err: any) {
      this.handleApiError('fetchLiveOrders', err);
      throw err;
    }
  }

  /**
   * Reverse Synchronization: Push Driver status update from CRM to Clone Admin Panel
   * e.g. when manager approves, suspends, or rejects driver in CRM
   */
  public async pushDriverStatusUpdate(externalId: string, status: string, reason?: string): Promise<boolean> {
    try {
      await this.ensureAuthenticated();
      await this.checkRateLimit();
      const template = process.env.AT_ADMIN_DRIVER_STATUS_PATH_TEMPLATE || '/api/user/status/{type}/{id}';
      const endpoint = template
        .replace('{type}', String(this.driverType))
        .replace('{id}', encodeURIComponent(externalId));
      this.assertSecureServiceUrl(this.baseUrl, 'Admin API');
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.authState.accessToken || '',
          'type': '1'
        },
        body: JSON.stringify({ status: this.mapCrmStatusToAdminStatus(status) })
      });
      if (!response.ok) throw new Error(`Admin Panel status update failed (HTTP ${response.status}).`);

      this.addLog({
        type: 'reverse_sync',
        status: 'success',
        summary: `Reverse Sync: Pushed Driver ${externalId} status -> "${status}" to Admin Panel`,
        details: reason ? `Reason: ${reason}` : 'Updated by CRM Manager',
        endpoint
      });

      return true;
    } catch (err: any) {
      this.handleApiError('pushDriverStatusUpdate', err);
      return false;
    }
  }

  private mapCrmStatusToAdminStatus(status: string): number {
    switch (status.toLowerCase()) {
      case 'active':
      case 'approved':
        return 1;
      case 'suspended':
      case 'blocked':
        return 2;
      case 'rejected':
        return 4;
      default:
        return 3;
    }
  }

  /**
   * Ingest incoming Webhook event from Clone Admin Panel
   */
  public handleIncomingWebhook(event: { event: string; entity: string; data: any }): { success: boolean; message: string } {
    this.addLog({
      type: 'webhook_received',
      status: 'info',
      summary: `Webhook received: ${event.event} on ${event.entity}`,
      details: JSON.stringify(event.data).slice(0, 120) + '...'
    });

    if (event.entity === 'order' && event.data) {
      const idx = this.mockExternalOrders.findIndex(o => o.id === event.data.id);
      if (idx >= 0) {
        this.mockExternalOrders[idx] = { ...this.mockExternalOrders[idx], ...event.data };
      } else {
        this.mockExternalOrders.unshift(event.data);
      }
    }

    return { success: true, message: 'Webhook ingested successfully' };
  }

  // =========================================================================
  // 4. ERROR HANDLING, TELEMETRY & ALERTS
  // =========================================================================

  private handleApiError(operation: string, err: any): void {
    const errorMessage = this.redactSensitiveErrorMessage(err);
    this.consecutiveErrors++;
    this.totalSyncErrors++;
    this.lastError = `${operation}: ${errorMessage}`;
    this.lastErrorTime = new Date().toISOString();

    if (!this.firstFailureTimestamp) {
      this.firstFailureTimestamp = Date.now();
    }

    const downtimeDurationSeconds = Math.floor((Date.now() - this.firstFailureTimestamp) / 1000);

    this.addLog({
      type: 'auth_error',
      status: 'error',
      summary: `API Sync Failure during [${operation}]`,
      details: `${errorMessage} (Downtime: ${downtimeDurationSeconds}s | Consecutive errors: ${this.consecutiveErrors})`
    });

    // Alert if downtime exceeds 5 minutes (300 seconds)
    if (downtimeDurationSeconds >= 300) {
      this.triggerLongDowntimeAlert(downtimeDurationSeconds);
    }
  }

  private redactSensitiveErrorMessage(err: unknown): string {
    const message = err instanceof Error ? err.message : String(err || 'Unknown Admin Panel error');
    const sensitiveValues = [
      this.username,
      process.env.AT_ADMIN_PASSWORD,
      this.authState.accessToken,
      this.authState.refreshToken
    ].filter((value): value is string => Boolean(value && value.length >= 3));

    const withoutKnownValues = sensitiveValues.reduce(
      (redacted, value) => redacted.replaceAll(value, '[REDACTED]'),
      message
    );

    return withoutKnownValues.replace(
      /\b(password|passwd|token|authorization|secret|credential)\s*[:=]\s*(?:Bearer\s+)?(?:"[^"]*"|'[^']*'|[^\s,;]+)/gi,
      '$1=[REDACTED]'
    );
  }

  private triggerLongDowntimeAlert(downtimeSec: number): void {
    console.error(`🚨 [CRITICAL ALERT] Clone Admin Panel API unreachable for ${downtimeSec}s (>5 min). CRM operating in offline-cached state.`);
    // Can also trigger Telegram alert if bot is configured
  }

  private addLog(log: Omit<SyncAuditLog, 'id' | 'timestamp'>): void {
    const newLog: SyncAuditLog = {
      id: `synclog-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      ...log
    };
    this.syncAuditLogs.unshift(newLog);
    if (this.syncAuditLogs.length > 200) {
      this.syncAuditLogs.pop();
    }
  }

  // =========================================================================
  // 5. GETTERS & METADATA
  // =========================================================================

  public getStatus(): IntegrationStatus {
    const isDegraded = this.consecutiveErrors > 0;
    const downtimeSeconds = this.firstFailureTimestamp ? Math.floor((Date.now() - this.firstFailureTimestamp) / 1000) : 0;
    const tokenExpiresInSeconds = this.authState.expiresAt ? Math.max(0, Math.floor((this.authState.expiresAt - Date.now()) / 1000)) : undefined;

    let connectionStatus: any = 'connected';
    if (this.authState.consecutiveAuthErrors > 0) connectionStatus = 'unauthorized';
    else if (this.authState.isRefreshing) connectionStatus = 'refreshing';
    else if (downtimeSeconds > 120) connectionStatus = 'offline';
    else if (isDegraded) connectionStatus = 'degraded';

    return {
      status: connectionStatus,
      statusMessage: connectionStatus === 'connected' 
        ? 'Connected to Accessible Transit Admin Panel' 
        : connectionStatus === 'degraded'
        ? 'Admin Panel is reachable but a data synchronization request failed'
        : connectionStatus === 'unauthorized'
        ? 'Admin Panel authorization error'
        : 'Accessible Transit Admin Panel is unavailable',
      mode: 'live_cloud',
      auth: {
        authenticated: Boolean(this.authState.accessToken),
        tokenExpiresAt: this.authState.expiresAt ? new Date(this.authState.expiresAt).toISOString() : undefined,
        tokenExpiresInSeconds,
        lastTokenRefresh: this.authState.lastRefreshTime || undefined,
        authMethod: this.authMode,
        refreshTokenValid: Boolean(this.authState.refreshToken),
        consecutiveAuthErrors: this.authState.consecutiveAuthErrors
      },
      sync: {
        lastLiveOrdersSync: this.lastLiveOrdersSync || undefined,
        lastDriversSync: this.lastDriversSync || undefined,
        livePollingActive: true,
        pollIntervalSeconds: Math.floor(this.getTripHistoryPollIntervalMs() / 1000),
        profileSyncIntervalMinutes: Math.floor(parseInt(process.env.CLONE_SYNC_PROFILE_INTERVAL_MS || '600000', 10) / 60000),
        totalSyncedDrivers: this.totalSyncedDrivers,
        totalSyncedOrders: this.totalSyncedOrders,
        totalSyncErrors: this.totalSyncErrors,
        lastError: this.lastError || undefined,
        lastErrorTime: this.lastErrorTime || undefined,
        isDegraded,
        downtimeSeconds
      },
      rateLimit: {
        requestsLastMinute: this.rateLimiter.timestamps.length,
        maxPerMinute: this.rateLimiter.maxPerMinute
      }
    };
  }

  public getConfig(): IntegrationConfig {
    return {
      baseUrl: this.baseUrl,
      authMode: this.authMode,
      clientIdMasked: this.clientId ? `${this.clientId.slice(0, 4)}••••${this.clientId.slice(-3)}` : 'Not Set',
      liveOrderPollIntervalMs: this.getTripHistoryPollIntervalMs(),
      driverProfileSyncIntervalMs: parseInt(process.env.CLONE_SYNC_PROFILE_INTERVAL_MS || '600000', 10),
      enableWebhooks: true,
      enableReverseSync: true,
      rateLimitPerMinute: this.rateLimiter.maxPerMinute,
      isConfigured: this.isConfigured
    };
  }

  public getLogs(filter?: { type?: string; status?: string }): SyncAuditLog[] {
    return this.syncAuditLogs.filter(l => {
      if (filter?.type && filter.type !== 'all' && l.type !== filter.type) return false;
      if (filter?.status && filter.status !== 'all' && l.status !== filter.status) return false;
      return true;
    });
  }

  public updateConfig(updates: Partial<IntegrationConfig>): IntegrationConfig {
    if (updates.rateLimitPerMinute) {
      this.rateLimiter.maxPerMinute = Number(updates.rateLimitPerMinute);
    }
    return this.getConfig();
  }
}

export const adminPanelClient = AdminPanelClient.getInstance();
