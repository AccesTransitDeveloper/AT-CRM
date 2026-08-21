import { adminPanelClient } from './adminPanelClient.js';
import { db } from './db.js';
import { 
  Driver, 
  Order, 
  ExternalCloneDriverPayload, 
  ExternalCloneOrderPayload,
  FieldMappingDefinition,
  DriverStatus,
  VehicleType,
  OrderStatus
} from '../src/types';

/**
 * SyncEngine - Integration & Data Synchronization Engine
 * 
 * Manages:
 * 1. Live Orders & Dispatch polling (every 15-30 seconds)
 * 2. Background Driver & Profile reconciliation (every 10-15 minutes)
 * 3. Exact field mapping between Clone Admin Panel API and CRM
 * 4. Conflict resolution policies (Source of Truth rules)
 * 5. Reverse sync triggers (CRM Manager action -> Admin Panel API)
 */
export class SyncEngine {
  private static instance: SyncEngine;
  
  private liveOrderPollTimer: NodeJS.Timeout | null = null;
  private profileSyncTimer: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  private constructor() {}

  public static getInstance(): SyncEngine {
    if (!SyncEngine.instance) {
      SyncEngine.instance = new SyncEngine();
    }
    return SyncEngine.instance;
  }

  // =========================================================================
  // 1. ENGINE LIFECYCLE & BACKGROUND SCHEDULER
  // =========================================================================

  public async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    console.log('[SyncEngine] Starting background synchronization workers...');

    // 1. Initial Authentication & First Sync Batch
    try {
      await adminPanelClient.authenticate();
      await this.syncDrivers();
      await this.syncLiveOrders();
    } catch (err: any) {
      console.warn('[SyncEngine] Initial sync warmup encountered warning:', err.message);
    }

    // 2. Schedule trip-history reconciliation. The verified history service
    // returns complete pages rather than an incremental cursor, so use a
    // conservative cadence to protect the upstream operational API.
    const requestedPollIntervalMs = parseInt(process.env.CLONE_SYNC_POLL_INTERVAL_MS || '600000', 10);
    const pollIntervalMs = Math.max(
      Number.isFinite(requestedPollIntervalMs) ? requestedPollIntervalMs : 600000,
      600000
    );
    this.liveOrderPollTimer = setInterval(() => {
      this.syncLiveOrders().catch(err => {
        console.error('[SyncEngine] Error in live order poll:', err.message);
      });
    }, pollIntervalMs);

    // 3. Schedule Background Profile Sync (default: 10m)
    const profileIntervalMs = parseInt(process.env.CLONE_SYNC_PROFILE_INTERVAL_MS || '600000', 10);
    this.profileSyncTimer = setInterval(() => {
      this.syncDrivers().catch(err => {
        console.error('[SyncEngine] Error in profile sync:', err.message);
      });
    }, profileIntervalMs);

    console.log(`[SyncEngine] Live order polling active (${pollIntervalMs / 1000}s). Profile sync active (${profileIntervalMs / 60000}m).`);
  }

  public stop(): void {
    if (this.liveOrderPollTimer) clearInterval(this.liveOrderPollTimer);
    if (this.profileSyncTimer) clearInterval(this.profileSyncTimer);
    this.liveOrderPollTimer = null;
    this.profileSyncTimer = null;
    this.isRunning = false;
    console.log('[SyncEngine] Background synchronization stopped.');
  }

  // =========================================================================
  // 2. DRIVER PROFILE RECONCILIATION & FIELD MAPPING
  // =========================================================================

  /**
   * Reconcile Driver Profiles from Clone Admin Panel
   */
  public async syncDrivers(): Promise<{ created: number; updated: number; total: number }> {
    const rawExternalDrivers = await adminPanelClient.fetchDrivers();
    let createdCount = 0;
    let updatedCount = 0;

    const existingDrivers = db.getDrivers();

    for (const extDriver of rawExternalDrivers) {
      // 1. Match by external_id (or license number as fallback)
      const existing = existingDrivers.find(d => 
        d.external_id === extDriver.id || 
        d.externalId === extDriver.id || 
        d.tlcLicenseNumber === extDriver.tlc_license_number ||
        d.phone === extDriver.phone
      );

      if (existing) {
        // CONFLICT RESOLUTION RULE:
        // - Admin Panel is Source of Truth for base profile & vehicle specs
        // - CRM is Source of Truth for Compliance docs, AI assessment, Notes, Risk level
        const updates: Partial<Driver> = {
          external_id: extDriver.id,
          externalId: extDriver.id,
          fullName: extDriver.full_name,
          phone: extDriver.phone,
          email: extDriver.email || existing.email,
          tlcLicenseNumber: extDriver.tlc_license_number,
          status: this.mapDriverStatus(extDriver.status),
          vehicleType: this.mapVehicleType(extDriver.vehicle?.type),
          vehicleMakeModel: extDriver.vehicle?.make_model || existing.vehicleMakeModel,
          vehiclePlate: extDriver.vehicle?.plate || existing.vehiclePlate,
          vehicleYear: extDriver.vehicle?.year || existing.vehicleYear,
          isWheelchairAccessible: Boolean(extDriver.vehicle?.is_wheelchair_accessible),
          rating: extDriver.rating !== undefined ? extDriver.rating : existing.rating,
          totalTrips: extDriver.total_trips !== undefined ? extDriver.total_trips : existing.totalTrips,
          isOnline: extDriver.is_online !== undefined ? extDriver.is_online : existing.isOnline,
          operatingBoroughs: extDriver.operating_boroughs && extDriver.operating_boroughs.length > 0 
            ? extDriver.operating_boroughs 
            : existing.operatingBoroughs
        };

        // Live location update from external app if provided
        if (extDriver.location) {
          updates.currentLocation = {
            neighborhood: extDriver.location.neighborhood,
            lat: extDriver.location.lat,
            lng: extDriver.location.lng,
            lastUpdated: extDriver.location.updated_at
          };
        }

        db.updateDriver(existing.id, updates);
        updatedCount++;
      } else {
        // Create new driver in CRM with deterministic external id mapping
        const mappedNewDriver: Partial<Driver> = {
          id: `drv-${extDriver.id.toLowerCase().replace(/[^a-z0-9_-]/g, '-')}`,
          external_id: extDriver.id,
          externalId: extDriver.id,
          fullName: extDriver.full_name,
          phone: extDriver.phone,
          email: extDriver.email || '',
          tlcLicenseNumber: extDriver.tlc_license_number,
          vehicleType: this.mapVehicleType(extDriver.vehicle?.type),
          vehicleMakeModel: extDriver.vehicle?.make_model || '',
          vehiclePlate: extDriver.vehicle?.plate || '',
          vehicleYear: extDriver.vehicle?.year || 0,
          isWheelchairAccessible: Boolean(extDriver.vehicle?.is_wheelchair_accessible),
          status: this.mapDriverStatus(extDriver.status),
          rating: extDriver.rating || 5.0,
          totalTrips: extDriver.total_trips || 0,
          isOnline: Boolean(extDriver.is_online),
          operatingBoroughs: extDriver.operating_boroughs || []
        };

        const created = db.createDriver(mappedNewDriver);
        existingDrivers.push(created);
        createdCount++;
      }
    }

    return {
      created: createdCount,
      updated: updatedCount,
      total: rawExternalDrivers.length
    };
  }

  // =========================================================================
  // 3. LIVE ORDERS & DISPATCH SYNCHRONIZATION
  // =========================================================================

  /**
   * Poll Live Orders from Clone Admin Panel
   */
  public async syncLiveOrders(): Promise<{ created: number; updated: number; total: number }> {
    const rawExternalOrders = await adminPanelClient.fetchLiveOrders();
    let createdCount = 0;
    let updatedCount = 0;

    const existingOrders = db.getOrders();
    const existingDrivers = db.getDrivers();

    for (const extOrder of rawExternalOrders) {
      // Match by external_id
      const existing = existingOrders.find(o => 
        o.external_id === extOrder.id || 
        o.externalId === extOrder.id || 
        o.orderNumber === extOrder.order_code
      );

      // Resolve associated driver in CRM
      let assignedDriverId = existing?.driverId;
      let assignedDriverName = existing?.driverName;
      let assignedDriverPhone = existing?.driverPhone;

      if (extOrder.driver?.external_id) {
        const foundDriver = existingDrivers.find(d => 
          d.external_id === extOrder.driver?.external_id || 
          d.externalId === extOrder.driver?.external_id ||
          (d.phone && d.phone === extOrder.driver?.phone)
        );
        if (foundDriver) {
          assignedDriverId = foundDriver.id;
          assignedDriverName = foundDriver.fullName;
          assignedDriverPhone = foundDriver.phone;
        }
      }

      if (existing) {
        // Update existing order status & live lifecycle
        const mappedStatus = this.mapOrderStatus(extOrder.status);
        const updates: Partial<Order> = {
          external_id: extOrder.id,
          externalId: extOrder.id,
          status: mappedStatus,
          driverId: assignedDriverId || existing.driverId,
          driverName: assignedDriverName || existing.driverName,
          driverPhone: assignedDriverPhone || existing.driverPhone,
          updatedAt: extOrder.updated_at || new Date().toISOString()
        };

        if (mappedStatus === 'completed' && !existing.completedAt) {
          updates.completedAt = extOrder.completed_at || new Date().toISOString();
        }

        db.updateOrder(existing.id, updates);
        updatedCount++;
      } else {
        // Create new incoming order ingested from external clone app
        const mappedStatus = this.mapOrderStatus(extOrder.status);
        const totalFare = Number(extOrder.fare?.total_amount || 0);
        const rate = Number(extOrder.fare?.rate || totalFare);
        const copay = Number(extOrder.fare?.copay || 0.00);
        const atCommissionRate = extOrder.fare?.commission_rate || 0.15;
        const atCommissionAmount = Number((totalFare * atCommissionRate).toFixed(2));
        const driverPayout = Number((rate - atCommissionAmount).toFixed(2));

        const newOrder: Partial<Order> = {
          id: `ord-${extOrder.id.toLowerCase().replace(/[^a-z0-9_-]/g, '-')}`,
          external_id: extOrder.id,
          externalId: extOrder.id,
          orderNumber: extOrder.order_code,
          passengerName: extOrder.passenger?.name || '',
          passengerPhone: extOrder.passenger?.phone || '',
          pickupAddress: extOrder.pickup?.address || '',
          pickupNeighborhood: extOrder.pickup?.neighborhood || '',
          dropoffAddress: extOrder.dropoff?.address || '',
          dropoffNeighborhood: extOrder.dropoff?.neighborhood || '',
          driverId: assignedDriverId,
          driverName: assignedDriverName,
          driverPhone: assignedDriverPhone,
          vehicleType: this.mapVehicleType(extOrder.vehicle_type),
          requiresWav: Boolean(extOrder.requires_wav || extOrder.vehicle_type === 'WAV'),
          status: mappedStatus,
          type: 'standard',
          source: 'app',
          rate,
          copay,
          fareAmount: totalFare,
          atCommissionRate,
          atCommissionAmount,
          driverPayout,
          createdAt: extOrder.created_at || new Date().toISOString(),
          updatedAt: extOrder.updated_at || new Date().toISOString(),
          completedAt: extOrder.completed_at
        };

        const created = db.createOrder(newOrder);
        existingOrders.push(created);
        createdCount++;
      }
    }

    return {
      created: createdCount,
      updated: updatedCount,
      total: rawExternalOrders.length
    };
  }

  // =========================================================================
  // 4. FIELD CONVERTERS & MAPPINGS
  // =========================================================================

  private mapVehicleType(externalType?: string): VehicleType {
    if (!externalType) return 'Green';
    const normalized = externalType.trim().toUpperCase();
    if (normalized.includes('WAV') || normalized.includes('WHEELCHAIR') || normalized.includes('RAMP')) return 'WAV';
    if (normalized.includes('BLACK XL')) return 'Black XL';
    if (normalized.includes('BLACK')) return 'Black';
    if (normalized.includes('XL')) return 'XL';
    if (normalized.includes('PLUS')) return 'Plus';
    if (normalized.includes('GO')) return 'Go';
    return 'Green';
  }

  private mapDriverStatus(externalStatus?: string): DriverStatus {
    if (!externalStatus) return 'applied';
    switch (externalStatus.toLowerCase()) {
      case 'active':
      case 'approved':
        return 'active';
      case 'pending_approval':
      case 'under_review':
        return 'under_review';
      case 'suspended':
      case 'blocked':
        return 'suspended';
      case 'rejected':
        return 'rejected';
      default:
        return 'applied';
    }
  }

  private mapOrderStatus(externalStatus?: string): OrderStatus {
    if (!externalStatus) return 'created';
    switch (externalStatus.toUpperCase()) {
      case 'NEW':
      case 'CREATED':
      case 'SEARCHING_DRIVER':
        return 'created';
      case 'ACCEPTED':
      case 'DRIVER_ASSIGNED':
        return 'driver_assigned';
      case 'EN_ROUTE':
      case 'ARRIVING':
        return 'en_route';
      case 'ON_TRIP':
      case 'IN_PROGRESS':
        return 'on_trip';
      case 'COMPLETED':
      case 'FINISHED':
        return 'completed';
      case 'CANCELLED':
      case 'REJECTED':
        return 'cancelled';
      default:
        return 'created';
    }
  }

  // =========================================================================
  // 5. FIELD MAPPING DOCUMENTATION SCHEMA
  // =========================================================================

  public getFieldMappings(): FieldMappingDefinition[] {
    return [
      // DRIVERS MAPPINGS
      { entity: 'Driver', crmField: 'external_id', externalField: '_id', dataType: 'String (ObjectId)', sourceOfTruth: 'clone_admin_panel', description: 'Primary sync key from /api/user/3' },
      { entity: 'Driver', crmField: 'fullName', externalField: 'firstName + lastName', dataType: 'String', sourceOfTruth: 'clone_admin_panel', description: 'Driver profile name' },
      { entity: 'Driver', crmField: 'phone', externalField: 'countryPhoneCode + phone', dataType: 'String (E.164)', sourceOfTruth: 'clone_admin_panel', description: 'Primary phone contact' },
      { entity: 'Driver', crmField: 'status', externalField: 'status (numeric)', dataType: 'Enum', sourceOfTruth: 'bidirectional', description: 'Admin status codes: 1 active, 2 inactive, 3 unapproved, 4 rejected' },
      { entity: 'Driver', crmField: 'status', externalField: 'status', dataType: 'Enum', sourceOfTruth: 'bidirectional', description: 'Driver active/suspended lifecycle' },
      { entity: 'Driver', crmField: 'vehicleType', externalField: 'vehicle.type', dataType: 'Enum (WAV/Green/etc)', sourceOfTruth: 'clone_admin_panel', description: 'Fleet classification' },
      { entity: 'Driver', crmField: 'vehiclePlate', externalField: 'vehicle.plate', dataType: 'String', sourceOfTruth: 'clone_admin_panel', description: 'NYS TLC Vehicle Plate' },
      { entity: 'Driver', crmField: 'currentLocation', externalField: 'location', dataType: 'Object (lat, lng, zone)', sourceOfTruth: 'clone_admin_panel', description: 'Live GPS telemetry' },
      { entity: 'Driver', crmField: 'complianceDocuments', externalField: 'N/A (CRM-Managed)', dataType: 'Array<Document>', sourceOfTruth: 'crm', description: 'TLC compliance verification & OCR' },
      { entity: 'Driver', crmField: 'latestRiskLevel', externalField: 'N/A (CRM-Managed)', dataType: 'Enum (low/med/high)', sourceOfTruth: 'crm', description: 'AI Risk Assessment Engine' },

      // ORDERS MAPPINGS
      { entity: 'Order', crmField: 'external_id', externalField: '_id', dataType: 'String (ObjectId)', sourceOfTruth: 'clone_admin_panel', description: 'Trip ID from /api/booking_history' },
      { entity: 'Order', crmField: 'orderNumber', externalField: 'uniqueId', dataType: 'String', sourceOfTruth: 'clone_admin_panel', description: 'Public booking identifier' },
      { entity: 'Order', crmField: 'status', externalField: 'status', dataType: 'Enum', sourceOfTruth: 'clone_admin_panel', description: 'Real-time ride status' },
      { entity: 'Order', crmField: 'passengerName', externalField: 'customerDetail.name', dataType: 'String', sourceOfTruth: 'clone_admin_panel', description: 'Passenger rider name' },
      { entity: 'Order', crmField: 'passengerPhone', externalField: 'customerDetail.phone', dataType: 'String', sourceOfTruth: 'clone_admin_panel', description: 'Passenger contact number' },
      { entity: 'Order', crmField: 'fareAmount', externalField: 'bookingInvoice.actual.total', dataType: 'Currency (USD)', sourceOfTruth: 'clone_admin_panel', description: 'Actual gross trip fare' },
      { entity: 'Order', crmField: 'pickupAddress', externalField: 'pickupAddress.address', dataType: 'String', sourceOfTruth: 'clone_admin_panel', description: 'Pickup location street address' },
      { entity: 'Order', crmField: 'dropoffAddress', externalField: 'destinationAddresses[last].address', dataType: 'String', sourceOfTruth: 'clone_admin_panel', description: 'Final dropoff street address' },
      { entity: 'Order', crmField: 'atCommissionAmount', externalField: 'N/A (Calculated 15%)', dataType: 'Currency (USD)', sourceOfTruth: 'crm', description: 'Accessible Transit 15% split' }
    ];
  }
}

export const syncEngine = SyncEngine.getInstance();
