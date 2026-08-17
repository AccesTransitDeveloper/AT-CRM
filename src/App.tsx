import React, { useState, useEffect, useCallback } from 'react';
import { UserRole, Driver, Order, Broker, Ticket, CommissionSettlement, SystemStats, DriverStatus, OrderStatus, BrokerConfirmationStatus } from './types';
import { api } from './lib/api';
import { Header, roleStyleConfig } from './components/Header';
import { Navigation, ActiveTab } from './components/Navigation';
import { DriversView } from './components/drivers/DriversView';
import { OrdersView } from './components/orders/OrdersView';
import { BrokersView } from './components/brokers/BrokersView';
import { SupportView } from './components/support/SupportView';
import { FinanceView } from './components/finance/FinanceView';
import { MarketingView } from './components/marketing/MarketingView';
import { ComplianceView } from './components/compliance/ComplianceView';
import { AppAnalyticsView } from './components/analytics/AppAnalyticsView';
import { ReferralProgramDashboard } from './components/referrals/ReferralProgramDashboard';
import { ApiExplorerView } from './components/api-explorer/ApiExplorerView';
import { EmployeesView } from './components/employees/EmployeesView';
import { EmployeeProfileView } from './components/employees/EmployeeProfileView';
import { FaceLoginModal } from './components/auth/FaceLoginModal';
import { SelfRegistrationModal } from './components/employees/SelfRegistrationModal';
import { AiAssistantPanel } from './components/AiAssistantPanel';
import { initialDrivers, initialOrders, initialBrokers, initialTickets, sampleSettlements } from '../server/db';
import { Shield, Sparkles, CheckCircle2, AlertCircle, Camera } from 'lucide-react';
import { useTranslation } from './lib/i18n';

export default function App() {
  const { t } = useTranslation();
  // Current user role in CRM
  const [currentRole, setCurrentRole] = useState<UserRole>('admin');
  const [activeTab, setActiveTab] = useState<ActiveTab>('drivers');

  // Application Data States
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>(initialDrivers);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [brokers, setBrokers] = useState<Broker[]>(initialBrokers);
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [settlements, setSettlements] = useState<CommissionSettlement[]>(sampleSettlements);
  const [pendingInvitationsCount, setPendingInvitationsCount] = useState(2);
  
  // Modals for Face Login & URL Invitation Link Detection
  const [isFaceLoginModalOpen, setIsFaceLoginModalOpen] = useState(false);
  const [activeInviteToken, setActiveInviteToken] = useState<string | null>(null);

  // AI Agent (Jarvis) Drawer & Activation States
  const [isAiAgentOpen, setIsAiAgentOpen] = useState(false);
  const [isAiAgentActive, setIsAiAgentActive] = useState(true);
  
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Check URL params for ?invite=token or ?role=...
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const inviteToken = urlParams.get('invite') || urlParams.get('token');
      if (inviteToken) {
        setActiveInviteToken(inviteToken);
      }
    } catch {
      // ignore
    }
  }, []);

  // Fetch all state from REST backend
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [statsRes, driversRes, ordersRes, brokersRes, ticketsRes, settlementsRes] = await Promise.allSettled([
        api.getStats(),
        api.getDrivers(),
        api.getOrders(),
        api.getBrokers(),
        api.getTickets(),
        api.getSettlements()
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value) setStats(statsRes.value);
      if (driversRes.status === 'fulfilled' && Array.isArray(driversRes.value)) setDrivers(driversRes.value);
      if (ordersRes.status === 'fulfilled' && Array.isArray(ordersRes.value)) setOrders(ordersRes.value);
      if (brokersRes.status === 'fulfilled' && Array.isArray(brokersRes.value)) setBrokers(brokersRes.value);
      if (ticketsRes.status === 'fulfilled' && Array.isArray(ticketsRes.value)) setTickets(ticketsRes.value);
      if (settlementsRes.status === 'fulfilled' && Array.isArray(settlementsRes.value)) setSettlements(settlementsRes.value);
    } catch (err) {
      console.warn('API sync warning, using optimistic client store', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // DRIVERS ACTIONS
  const handleUpdateDriverStatus = async (id: string, status: DriverStatus, reason?: string) => {
    try {
      const updated = await api.updateDriverStatus(id, status, reason);
      setDrivers(prev => prev.map(d => d.id === id ? updated : d));
      showToast(`Driver status changed to "${status.toUpperCase()}"`, 'success');
      loadData();
    } catch {
      setDrivers(prev => prev.map(d => d.id === id ? { ...d, status, rejectionReason: reason } : d));
      showToast(`Driver status updated to "${status.toUpperCase()}"`, 'success');
    }
  };

  const handleCreateDriver = async (driverData: Partial<Driver>) => {
    try {
      const created = await api.createDriver(driverData);
      setDrivers(prev => [created, ...prev]);
      showToast(`New driver application for "${created.fullName}" registered!`, 'success');
      loadData();
    } catch {
      const newD: Driver = {
        id: `drv-${Date.now()}`,
        fullName: driverData.fullName || 'New Driver',
        phone: driverData.phone || '',
        email: driverData.email || '',
        tlcLicenseNumber: driverData.tlcLicenseNumber || `TLC-${Math.floor(1000000 + Math.random() * 9000000)}`,
        vehicleType: driverData.vehicleType || 'Green',
        vehicleMakeModel: driverData.vehicleMakeModel || 'Toyota Prius Hybrid',
        vehiclePlate: driverData.vehiclePlate || 'T992104C',
        vehicleYear: driverData.vehicleYear || 2023,
        isWheelchairAccessible: driverData.vehicleType === 'WAV',
        documents: {
          driverLicense: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&auto=format&fit=crop&q=80',
          insurance: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600&auto=format&fit=crop&q=80',
          registration: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80'
        },
        operatingBoroughs: driverData.operatingBoroughs || ['Jackson Heights'],
        status: driverData.status || 'applied',
        rating: 5.0,
        totalTrips: 0,
        joinedDate: new Date().toISOString().split('T')[0],
        isOnline: false
      };
      setDrivers(prev => [newD, ...prev]);
      showToast(`New driver "${newD.fullName}" added!`, 'success');
    }
  };

  const handleUpdateDriver = async (id: string, updates: Partial<Driver>) => {
    try {
      const updated = await api.updateDriver(id, updates);
      setDrivers(prev => prev.map(d => d.id === id ? updated : d));
      showToast('Driver profile updated', 'success');
      loadData();
    } catch {
      setDrivers(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
    }
  };

  const handleDeleteDriver = async (id: string) => {
    try {
      await api.deleteDriver(id);
      setDrivers(prev => prev.filter(d => d.id !== id));
      showToast('Driver removed from fleet', 'info');
      loadData();
    } catch {
      setDrivers(prev => prev.filter(d => d.id !== id));
    }
  };

  const handleFetchDriverTrips = async (driverId: string) => {
    try {
      return await api.getDriverTrips(driverId);
    } catch {
      return [];
    }
  };

  // ORDERS ACTIONS
  const handleCreateOrder = async (orderData: Partial<Order>) => {
    try {
      const created = await api.createOrder(orderData);
      setOrders(prev => [created, ...prev]);
      showToast(`Order ${created.orderNumber} dispatched to queue!`, 'success');
      loadData();
    } catch {
      const fare = Number(orderData.fareAmount) || 45;
      const comm = Number((fare * 0.15).toFixed(2));
      const newO: Order = {
        id: `ord-${Date.now()}`,
        orderNumber: `AT-2026-${orders.length + 825}`,
        passengerName: orderData.passengerName || 'Passenger',
        passengerPhone: orderData.passengerPhone || '+1 (718) 555-0000',
        pickupAddress: orderData.pickupAddress || '37th Ave, Jackson Heights',
        pickupNeighborhood: orderData.pickupNeighborhood || 'Jackson Heights',
        dropoffAddress: orderData.dropoffAddress || 'Jamaica, Queens',
        dropoffNeighborhood: orderData.dropoffNeighborhood || 'Jamaica',
        driverId: orderData.driverId,
        driverName: orderData.driverName,
        driverPhone: orderData.driverPhone,
        vehicleType: orderData.vehicleType || 'WAV',
        requiresWav: Boolean(orderData.requiresWav),
        status: orderData.driverId ? 'driver_assigned' : 'created',
        type: orderData.type || 'mta_broker',
        source: orderData.source || 'broker',
        brokerId: orderData.brokerId,
        brokerName: orderData.brokerName,
        brokerConfirmationStatus: orderData.brokerId ? 'finding_driver' : undefined,
        fareAmount: fare,
        atCommissionRate: 0.15,
        atCommissionAmount: comm,
        driverPayout: Number((fare - comm).toFixed(2)),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        specialAssistanceNotes: orderData.specialAssistanceNotes
      };
      setOrders(prev => [newO, ...prev]);
      showToast(`Order ${newO.orderNumber} created!`, 'success');
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus, brokerStatus?: BrokerConfirmationStatus) => {
    try {
      const updated = await api.updateOrderStatus(orderId, status, brokerStatus);
      setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
      showToast(`Order status updated to "${status.toUpperCase()}"`, 'success');
      loadData();
    } catch {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status, brokerConfirmationStatus: brokerStatus || o.brokerConfirmationStatus } : o));
    }
  };

  const handleAssignDriver = async (orderId: string, driverId: string) => {
    try {
      const updated = await api.assignDriver(orderId, driverId);
      setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
      showToast(`Driver assigned to order!`, 'success');
      loadData();
    } catch {
      const drv = drivers.find(d => d.id === driverId);
      setOrders(prev => prev.map(o => o.id === orderId ? {
        ...o,
        driverId,
        driverName: drv?.fullName,
        driverPhone: drv?.phone,
        status: o.status === 'created' ? 'driver_assigned' : o.status
      } : o));
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await api.deleteOrder(orderId);
      setOrders(prev => prev.filter(o => o.id !== orderId));
      showToast('Order cancelled and deleted', 'info');
      loadData();
    } catch {
      setOrders(prev => prev.filter(o => o.id !== orderId));
    }
  };

  // BROKERS ACTIONS
  const handleCreateBroker = async (brokerData: Partial<Broker>) => {
    try {
      const created = await api.createBroker(brokerData);
      setBrokers(prev => [...prev, created]);
      showToast(`Partner broker "${created.name}" registered!`, 'success');
      loadData();
    } catch {
      const newB: Broker = {
        id: `brk-${Date.now()}`,
        name: brokerData.name || 'New Brokerage',
        code: brokerData.code || 'BRK',
        contactPerson: brokerData.contactPerson || '',
        email: brokerData.email || '',
        phone: brokerData.phone || '',
        commissionRate: 0.15,
        portalUrl: brokerData.portalUrl,
        activeOrdersCount: 0,
        totalOrdersCount: 0,
        totalSettledAmount: 0,
        status: 'active',
        createdAt: new Date().toISOString().split('T')[0]
      };
      setBrokers(prev => [...prev, newB]);
      showToast(`Partner broker "${newB.name}" registered!`, 'success');
    }
  };

  // TICKETS ACTIONS
  const handleCreateTicket = async (ticketData: Partial<Ticket>) => {
    try {
      const created = await api.createTicket(ticketData);
      setTickets(prev => [created, ...prev]);
      showToast(`Support ticket ${created.ticketNumber} opened!`, 'success');
      loadData();
    } catch {
      const newT: Ticket = {
        id: `tkt-${Date.now()}`,
        ticketNumber: `TCK-2026-${tickets.length + 109}`,
        subject: ticketData.subject || 'Support Issue',
        userType: ticketData.userType || 'passenger',
        userName: ticketData.userName || 'Customer',
        userContact: ticketData.userContact || '',
        priority: ticketData.priority || 'medium',
        status: 'open',
        assignedTo: ticketData.assignedTo || 'Support Desk',
        category: ticketData.category || 'other',
        messages: [
          {
            id: `msg-${Date.now()}`,
            senderName: ticketData.userName || 'Customer',
            senderRole: ticketData.userType === 'driver' ? 'driver' : 'user',
            content: ticketData.subject || 'Issue created',
            timestamp: new Date().toISOString()
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setTickets(prev => [newT, ...prev]);
    }
  };

  const handleUpdateTicket = async (id: string, updates: Partial<Ticket>) => {
    try {
      const updated = await api.updateTicket(id, updates);
      setTickets(prev => prev.map(t => t.id === id ? updated : t));
      loadData();
    } catch {
      setTickets(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    }
  };

  const handleAddTicketMessage = async (ticketId: string, message: any) => {
    try {
      const updated = await api.addTicketMessage(ticketId, message);
      setTickets(prev => prev.map(t => t.id === ticketId ? updated : t));
      loadData();
    } catch {
      const newM = { id: `msg-${Date.now()}`, ...message, timestamp: new Date().toISOString() };
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, messages: [...t.messages, newM] } : t));
    }
  };

  // FINANCE ACTIONS
  const handleUpdateSettlementStatus = async (id: string, status: CommissionSettlement['status']) => {
    try {
      const updated = await api.updateSettlementStatus(id, status);
      setSettlements(prev => prev.map(s => s.id === id ? updated : s));
      showToast(`Settlement status marked as "${status.toUpperCase()}"`, 'success');
      loadData();
    } catch {
      setSettlements(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    }
  };

  // Calculate live notification badges
  const pendingDriversCount = (drivers || []).filter(d => d.status === 'applied' || d.status === 'under_review').length;
  const activeOrdersCount = (orders || []).filter(o => ['created', 'driver_assigned', 'en_route', 'on_trip'].includes(o.status)).length;
  const openTicketsCount = (tickets || []).filter(t => t.status === 'open' || t.status === 'in_progress').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* Toast Notification Banner */}
      {notification && (
        <div className="fixed top-3 right-4 z-70 animate-in fade-in slide-in-from-top-2">
          <div className={`px-4 py-2.5 rounded-xl shadow-2xl border text-xs font-semibold flex items-center gap-2 ${
            notification.type === 'success' ? 'bg-emerald-950 text-emerald-200 border-emerald-700' :
            notification.type === 'error' ? 'bg-rose-950 text-rose-200 border-rose-700' :
            'bg-sky-950 text-sky-200 border-sky-700'
          }`}>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Main App Bar */}
      <Header
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        stats={stats}
        onRefresh={loadData}
        isLoading={isLoading}
        isAiAgentOpen={isAiAgentOpen}
        onToggleAiAgentOpen={() => setIsAiAgentOpen(prev => !prev)}
        isAiAgentActive={isAiAgentActive}
        onToggleAiAgentActive={setIsAiAgentActive}
        onOpenFaceLogin={() => setIsFaceLoginModalOpen(true)}
      />

      {/* Module Navigation Tabs */}
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentRole={currentRole}
        counts={{
          pendingDrivers: pendingDriversCount,
          activeOrders: activeOrdersCount,
          openTickets: openTicketsCount,
          pendingComplianceDocs: stats?.pendingComplianceDocs || 0,
          expiringComplianceDocs: stats?.expiringComplianceDocs || 0,
          pendingInvitations: pendingInvitationsCount
        }}
      />


      {/* Active Role Notice Bar */}
      <div className="bg-slate-900/40 border-b border-slate-800/70 px-3 sm:px-5 lg:px-7 py-1.5 text-xs text-slate-400">
        <div className="w-full flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-300 text-xs">{t('workspace.activeWorkspace')}</span>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${roleStyleConfig[currentRole].color}`}>
              {t(`roles.${currentRole}.label`)}
            </span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="text-slate-400 text-xs hidden sm:inline">{t(`roles.${currentRole}.description`)}</span>
          </div>

          <div className="flex items-center space-x-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              {t('workspace.fleetOnline')}
            </span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="text-slate-300 font-mono text-[11px]">{t('workspace.brokerageRate')}</span>
          </div>
        </div>
      </div>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'drivers' && (
          <DriversView
            drivers={drivers}
            currentRole={currentRole}
            orders={orders}
            tickets={tickets}
            onUpdateStatus={handleUpdateDriverStatus}
            onCreateDriver={handleCreateDriver}
            onUpdateDriver={handleUpdateDriver}
            onDeleteDriver={handleDeleteDriver}
            onFetchTrips={handleFetchDriverTrips}
          />
        )}

        {activeTab === 'compliance' && (
          <ComplianceView
            currentRole={currentRole}
            onSelectDriver={(driverId) => {
              setActiveTab('drivers');
            }}
          />
        )}

        {activeTab === 'orders' && (
          <OrdersView
            orders={orders}
            drivers={drivers}
            brokers={brokers}
            currentRole={currentRole}
            onCreateOrder={handleCreateOrder}
            onUpdateStatus={handleUpdateOrderStatus}
            onAssignDriver={handleAssignDriver}
            onDeleteOrder={handleDeleteOrder}
          />
        )}

        {activeTab === 'brokers' && (
          <BrokersView
            brokers={brokers}
            orders={orders}
            currentRole={currentRole}
            onCreateBroker={handleCreateBroker}
            onUpdateOrderStatus={handleUpdateOrderStatus}
          />
        )}

        {activeTab === 'support' && (
          <SupportView
            tickets={tickets}
            currentRole={currentRole}
            onCreateTicket={handleCreateTicket}
            onUpdateTicket={handleUpdateTicket}
            onAddMessage={handleAddTicketMessage}
          />
        )}

        {activeTab === 'finance' && (
          <FinanceView
            stats={stats}
            settlements={settlements}
            currentRole={currentRole}
            onUpdateSettlementStatus={handleUpdateSettlementStatus}
          />
        )}

        {activeTab === 'employees' && currentRole === 'admin' && (
          <EmployeesView
            currentRole={currentRole}
            onOpenSelfRegisterWithToken={(token) => setActiveInviteToken(token)}
          />
        )}

        {(activeTab === 'profile' || (activeTab === 'employees' && currentRole !== 'admin')) && (
          <EmployeeProfileView
            currentRole={currentRole}
            onOpenFaceLogin={() => setIsFaceLoginModalOpen(true)}
          />
        )}

        {activeTab === 'marketing' && (
          <MarketingView
            currentRole={currentRole}
            onNavigateToTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'app_analytics' && (
          <AppAnalyticsView />
        )}

        {activeTab === 'referrals' && (
          <ReferralProgramDashboard 
            currentRole={currentRole}
            drivers={drivers}
          />
        )}

        {activeTab === 'api' && (
          <ApiExplorerView onRefreshAll={loadData} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-500 text-xs py-4 px-4 sm:px-6 lg:px-8 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-400">Accessible Transit LLC (AT)</span>
            <span>•</span>
            <span>New York TLC Licensed Dispatch Base</span>
            <span>•</span>
            <span>Queens Hub (Jackson Heights, Jamaica, Flushing, Kensington)</span>
          </div>
          <div className="flex items-center space-x-3 text-[11px]">
            <span>AT AI Ingestion Ready</span>
            <span>•</span>
            <span>TripLink & MyLe Paratransit Portal</span>
            <span>•</span>
            <span>15% Commission Rate</span>
          </div>
        </div>
      </footer>

      {/* Face ID Login Modal */}
      <FaceLoginModal
        isOpen={isFaceLoginModalOpen}
        onClose={() => setIsFaceLoginModalOpen(false)}
        onLoginSuccess={(employee, role) => {
          setCurrentRole(role);
          showToast(`Authenticated as ${employee.fullName} (${role.toUpperCase()}) via Biometric Face ID!`, 'success');
        }}
      />

      {/* Self Registration with Invitation Link Modal */}
      <SelfRegistrationModal
        isOpen={!!activeInviteToken}
        token={activeInviteToken}
        onClose={() => {
          setActiveInviteToken(null);
          // Clean URL parameter
          if (window.history.replaceState) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }}
        onRegistrationComplete={(employee) => {
          setCurrentRole(employee.role);
          showToast(`Welcome ${employee.fullName}! Your account and Face ID biometrics are now active.`, 'success');
          loadData();
        }}
      />

      {/* Internal AI Assistant (Jarvis) Drawer */}
      <AiAssistantPanel
        isOpen={isAiAgentOpen}
        onClose={() => setIsAiAgentOpen(false)}
        isActive={isAiAgentActive}
        onToggleActive={setIsAiAgentActive}
        currentRole={currentRole}
        actorName={
          currentRole === 'admin' 
            ? 'Elena Rostova (Admin)' 
            : currentRole === 'dispatcher' 
            ? 'Marcus Vance (Dispatcher)' 
            : 'CRM Operator'
        }
      />
    </div>
  );
}
