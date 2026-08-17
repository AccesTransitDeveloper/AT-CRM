export const en = {
  // Top Header & System Stats
  header: {
    crmBadge: "CRM",
    hubLocation: "New York",
    subHeader: "New York City • Queens • Brooklyn • Bronx • Manhattan | AT AI & MTA Brokerage (15%)",
    activeDrivers: "Active Drivers",
    fleet: "fleet",
    activeOrders: "Active Orders",
    inDispatch: "in dispatch",
    atCommission: "AT 15% Commission",
    refreshData: "Refresh Data",
    loggedInAs: "Logged In As",
    switchActiveRole: "Switch Active Role",
    language: "Language",
    english: "English",
    russian: "Russian",
    langEn: "EN",
    langRu: "RU"
  },

  // Roles
  roles: {
    admin: {
      label: "Administrator",
      description: "Full system control, financial management, driver approval, and dispatching",
      badge: "Full Access"
    },
    driver_manager: {
      label: "Driver Manager",
      description: "Driver onboarding, TLC license verification, and document management",
      badge: "Onboarding & TLC"
    },
    dispatcher: {
      label: "Dispatcher",
      description: "Real-time order management, driver assignment, and MTA paratransit routing",
      badge: "Live Operations"
    },
    support: {
      label: "Support Operator",
      description: "Passenger, driver, and broker support tickets & communication",
      badge: "Helpdesk"
    },
    finance: {
      label: "Finance Manager",
      description: "Revenue tracking, broker 15% commissions, and driver settlements",
      badge: "Financial Ledger"
    }
  },

  // Workspace subbar
  workspace: {
    activeWorkspace: "Active Workspace:",
    fleetOnline: "New York TLC Fleet Online",
    brokerageRate: "Brokerage: 15% AT Commission"
  },

  // Navigation Tabs
  nav: {
    drivers: "Drivers",
    driversSub: "Водители & Онбординг",
    orders: "Orders & Dispatch",
    ordersSub: "Заказы & Маршруты",
    brokers: "Brokers & MTA",
    brokersSub: "TripLink & MyLe",
    support: "Helpdesk Support",
    supportSub: "Тикеты & Чат",
    finance: "Finance & 15% Comm",
    financeSub: "Отчёты & Выплаты",
    api: "AT AI & External API",
    apiSub: "REST API & Webhooks",
    moreModules: "More Modules",
    advancedTools: "Advanced Tools",
    compliance: "TLC Compliance",
    marketing: "Marketing & AI",
    appAnalytics: "App Analytics (4 Apps)",
    referrals: "Referral Program"
  },

  // Driver Fleet Management
  drivers: {
    title: "Driver Fleet Management",
    subtitle: "TLC compliance, onboarding pipeline & paratransit WAV vehicle verification",
    countBadge: "{count} Drivers",
    searchPlaceholder: "Search name, TLC #, plate...",
    allStatuses: "All Statuses",
    allVehicleTypes: "All Vehicle Types",
    allNeighborhoods: "All Queens Neighborhoods",
    newDriver: "New Driver",
    tableView: "Table View",
    kanbanView: "Kanban Onboarding Board",
    
    // Table Headers
    thDriver: "Driver & Contacts",
    thLicense: "TLC License & Plate",
    thVehicle: "Vehicle Type",
    thCoverage: "Queens Coverage",
    thStatus: "Status",
    thRating: "Rating & Trips",
    thActions: "Actions",

    // Statuses
    statusApplied: "Application Submitted",
    statusUnderReview: "Under Review",
    statusActive: "Active Driver",
    statusSuspended: "Suspended",
    statusRejected: "Rejected",

    // Actions
    approve: "Approve",
    reject: "Reject",
    suspend: "Suspend",
    reactivate: "Reactivate",
    delete: "Delete Driver",
    editProfile: "Edit Profile",
    viewDetails: "View Details",

    // Stats & counts
    completedTrips: "completed trips",
    plate: "Plate:",
    noDriversFound: "No drivers match the selected filters.",

    // Add Driver Modal
    modalAddTitle: "Add New TLC Driver",
    modalAddSubtitle: "Register driver onboarding application and vehicle specifications",
    fullName: "Full Name",
    phone: "Phone Number",
    email: "Email Address",
    tlcLicense: "TLC Driver License Number",
    vehicleType: "Vehicle Type",
    vehicleMakeModel: "Vehicle Make & Model (e.g. 2023 Toyota Sienna)",
    vehiclePlate: "TLC Vehicle Plate (e.g. T789211C)",
    vehicleYear: "Vehicle Year",
    wheelchairAccessible: "Wheelchair Accessible Vehicle (WAV ramp / lift equipped)",
    operatingNeighborhoods: "Primary Operating Neighborhoods",
    notes: "Internal Onboarding Notes",
    cancel: "Cancel",
    registerDriver: "Register Driver Application",

    // Reject Modal
    modalRejectTitle: "Reject Driver Application",
    rejectPrompt: "Specify the reason for rejecting this driver application:",
    rejectReasonPlaceholder: "e.g. Expired TLC license, insurance document unverified, failed background check...",
    confirmReject: "Confirm Rejection",

    // Detail Drawer
    drawerTitle: "Driver Profile & Compliance",
    tabDetails: "Details & Vehicle",
    tabDocuments: "TLC Documents",
    tabTrips: "Trip History",
    tabReferrals: "Referrals",
    tabFinancials: "Financials & AI",
    contactInfo: "Contact Information",
    licenseDetails: "TLC Credentials",
    vehicleDetails: "Vehicle Specifications",
    assignedBoroughs: "Assigned Operating Neighborhoods",
    quickActions: "Quick Actions",
    statusNote: "Application Status",
    joinedDate: "Registered On",
    totalEarnings: "Total Net Earnings",
    overallRating: "Passenger Rating"
  },

  // Orders View
  orders: {
    title: "Orders & Dispatch Queue",
    subtitle: "Real-time trip dispatch, broker distribution, and paratransit routing",
    countBadge: "{count} Orders",
    searchPlaceholder: "Search order #, passenger, address...",
    allStatuses: "All Order Statuses",
    allSources: "All Sources",
    allTypes: "All Trip Types",
    allNeighborhoods: "All Queens Neighborhoods",
    newOrder: "New Order",
    
    // Headers
    thOrder: "Order & Source",
    thPassenger: "Passenger & Contact",
    thRoute: "Route (Pickup → Dropoff)",
    thVehicle: "Vehicle & Special Needs",
    thFare: "Fare & 15% Comm",
    thDriver: "Assigned Driver",
    thStatus: "Status & Actions",

    // Statuses
    statusPending: "Pending Dispatch",
    statusAssigned: "Driver Assigned",
    statusEnRoute: "En Route",
    statusPickedUp: "Passenger In Car",
    statusCompleted: "Trip Completed",
    statusCancelled: "Cancelled",

    // Actions
    assignDriver: "Assign Driver",
    reassign: "Reassign",
    unassign: "Unassign",
    completeTrip: "Complete Trip",
    cancelOrder: "Cancel Order",
    noDriverAssigned: "Unassigned (Pending Dispatch)",
    
    // Modal
    modalAddTitle: "Dispatch New Trip Order",
    passengerName: "Passenger Name",
    passengerPhone: "Passenger Phone",
    pickupAddress: "Pickup Address",
    pickupNeighborhood: "Pickup Neighborhood",
    dropoffAddress: "Dropoff Address",
    dropoffNeighborhood: "Dropoff Neighborhood",
    fareAmount: "Fare Amount ($)",
    atCommissionAmount: "15% AT Commission ($)",
    driverPayoutAmount: "Driver Payout ($)",
    orderSource: "Order Source",
    tripType: "Trip Type",
    scheduledTime: "Scheduled Pickup Time",
    specialNeeds: "Special Passenger Needs",
    wheelchairRequired: "Wheelchair (WAV) required",
    childSeatRequired: "Child seat required",
    driverNotes: "Special Instructions for Driver",
    dispatchOrder: "Dispatch Order to Queue",
    noOrdersFound: "No orders match the selected filters."
  },

  // Brokers View
  brokers: {
    title: "Brokers & B2B Integration Hub",
    subtitle: "MTA Access-A-Ride, TripLink, MyLe & Healthcare Transportation Partners",
    countBadge: "{count} Brokers",
    activePartnerships: "Active Partnerships",
    totalBrokerageVolume: "Total Brokerage Volume",
    commissionEarned: "15% Brokerage Commission",
    addNewBroker: "Add Partner Broker",
    statusActive: "Active Integration",
    statusPending: "Integration Pending",
    statusSuspended: "Temporarily Suspended",
    brokerName: "Broker Name",
    contactPerson: "Primary Contact",
    phone: "Phone",
    email: "Email",
    commissionRate: "Commission Rate",
    ordersProcessed: "Orders Processed",
    lastDispatch: "Last Dispatch",
    apiConnection: "API Webhook Status",
    connected: "Live & Connected",
    disconnected: "Disconnected",
    viewOrders: "View Orders"
  },

  // Support View
  support: {
    title: "Helpdesk & Customer Support",
    subtitle: "Driver and passenger ticket triage, dispute resolution, and chat",
    countBadge: "{count} Tickets",
    openTickets: "Open Tickets",
    inProgressTickets: "In Progress",
    resolvedTickets: "Resolved",
    newTicket: "Create Support Ticket",
    searchPlaceholder: "Search tickets, subject, sender...",
    filterPriority: "All Priorities",
    filterStatus: "All Ticket Statuses",
    thTicket: "Ticket # & Subject",
    thSender: "Sender & Type",
    thPriority: "Priority",
    thStatus: "Status",
    thLastUpdate: "Last Updated",
    priorityUrgent: "Urgent",
    priorityHigh: "High",
    priorityMedium: "Medium",
    priorityLow: "Low",
    statusOpen: "Open",
    statusInProgress: "In Progress",
    statusResolved: "Resolved",
    statusClosed: "Closed",
    typeDriver: "Driver Issue",
    typePassenger: "Passenger Inquiry",
    typeBroker: "Broker Inquiry",
    typeTechnical: "Technical / App Bug",
    replyInputPlaceholder: "Type your response or internal operational note...",
    sendReply: "Send Response",
    markResolved: "Resolve Ticket",
    reopenTicket: "Reopen Ticket"
  },

  // Finance View
  finance: {
    title: "Finance & 15% Commission Ledger",
    subtitle: "Revenue reconciliation, broker commission settlements, and driver weekly payouts",
    totalGrossFares: "Total Gross Fares",
    atCommissionEarned: "AT 15% Commission",
    netDriverPayouts: "Driver Net Payouts",
    pendingPayouts: "Pending Settlements",
    settlementLedgerTitle: "Weekly Driver Settlement Ledger",
    period: "Settlement Period",
    driverName: "Driver Name",
    completedTripsCount: "Completed Trips",
    grossRevenue: "Gross Revenue",
    atCommissionDeducted: "15% AT Commission",
    netPayable: "Net Payable",
    paymentStatus: "Payout Status",
    statusPending: "Pending Approval",
    statusProcessing: "Processing ACH",
    statusPaid: "Paid & Settled",
    markAsPaid: "Mark as Paid",
    downloadLedger: "Export CSV Ledger"
  },

  // API Explorer View
  apiExplorer: {
    title: "AT AI & External REST API Explorer",
    subtitle: "Public and partner endpoints for AI dispatch voice agents, broker webhooks & mobile apps",
    apiKeyTitle: "Production Integration Header",
    copyKey: "Copy API Key",
    keyCopied: "API Key Copied!",
    endpointsTitle: "Registered API Endpoints",
    method: "Method",
    endpoint: "Endpoint URL",
    description: "Description",
    testRequest: "Test Endpoint",
    samplePayload: "Sample JSON Payload",
    responseHeader: "Real-time API Response",
    sendTest: "Execute Request"
  },

  // Compliance View
  compliance: {
    title: "TLC Fleet Compliance & License Monitoring",
    subtitle: "Document verification, expiration warning tracking & AI OCR scanning",
    compliantCount: "Compliant Drivers",
    expiringCount: "Expiring within 30 Days",
    expiredCount: "Action Required / Expired",
    ocrScanButton: "AI Document OCR Scan",
    sendReminder: "Send Compliance Notice"
  },

  // App Analytics View
  analytics: {
    title: "Mobile App Ecosystem Analytics",
    subtitle: "4 native applications: Passenger & Driver on iOS & Android",
    allApps: "All 4 Applications",
    passengerIos: "Accessible Transit Passenger (iOS)",
    passengerAndroid: "Accessible Transit Passenger (Android)",
    driverIos: "Accessible Transit Driver (iOS)",
    driverAndroid: "Accessible Transit Driver (Android)",
    activeUsers: "Daily Active Users",
    totalInstalls: "Total Installations",
    conversionRate: "Onboarding Conversion",
    storeRating: "App Store Rating",
    timeRange30d: "Last 30 Days",
    timeRange7d: "Last 7 Days",
    timeRange90d: "Last 90 Days"
  },

  // Referral Program View
  referrals: {
    title: "Referral & Loyalty Program",
    subtitle: "Driver & Passenger referral bonuses, thresholds (5/10/5) & commission discounts",
    totalReferred: "Total Referred Users",
    activeBonuses: "Active Bonuses Paid",
    discountRate: "Commission Discount",
    createReferral: "Register New Referral",
    referralCode: "Referral Code",
    shareLink: "Share Invite Link"
  },

  // Marketing View
  marketing: {
    title: "Marketing Intelligence & AI Campaigns",
    subtitle: "Gemini-powered neighborhood demand forecasting and passenger promos",
    generateStrategy: "Generate AI Campaign Strategy",
    activeCampaigns: "Active Promo Campaigns",
    demandHeatmap: "Queens Demand Heatmap",
    promoCode: "Promo Code",
    discountAmount: "Discount"
  },

  // Common UI words
  common: {
    loading: "Loading data...",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    close: "Close",
    actions: "Actions",
    status: "Status",
    date: "Date",
    view: "View",
    search: "Search",
    filter: "Filter",
    all: "All",
    yes: "Yes",
    no: "No",
    online: "Online",
    offline: "Offline",
    exportCsv: "Export CSV",
    success: "Success",
    error: "Error",
    info: "Info",
    items: "items"
  },

  // Footer
  footer: {
    company: "Accessible Transit LLC (AT)",
    tlcLicense: "New York TLC Licensed Dispatch Base",
    queensHub: "Queens Hub (Jackson Heights, Jamaica, Flushing, Kensington)",
    aiReady: "AT AI Ingestion Ready",
    brokeragePortal: "TripLink & MyLe Paratransit Portal",
    commissionRate: "15% Commission Rate"
  },

  // Internal AI Assistant (Jarvis)
  aiAgent: {
    title: "Jarvis AI Assistant",
    subtitle: "Internal CRM Operations & Dispatch Agent",
    statusActive: "AI Active",
    statusInactive: "AI Offline",
    toggleActivate: "Activate AI Agent",
    toggleDeactivate: "Deactivate AI Agent",
    deactivatedNoticeTitle: "AI Assistant is Inactive",
    deactivatedNoticeDesc: "While switched off, Jarvis has no access to CRM databases and cannot execute commands. Toggle the switch above to activate.",
    chatTab: "Live Chat",
    historyTab: "Audit & History",
    placeholder: "Ask about drivers, orders, expiring docs or issue dispatch commands...",
    voiceListening: "Listening to your voice command...",
    voiceStart: "Voice Command",
    voiceStop: "Stop Voice",
    send: "Send",
    clearChat: "Clear Session",
    confirmationTitle: "Confirmation Required",
    confirmAction: "Confirm & Execute",
    cancelAction: "Cancel",
    actionExecuted: "Action successfully executed in CRM",
    actionCancelled: "Action cancelled by operator",
    requiresAdminBadge: "Requires Administrator Role",
    executedViaAgent: "Executed via Jarvis AI",
    quickPromptsTitle: "Suggested Queries & Commands:",
    prompt1: "How much did Tariq Al-Mansoor earn this week?",
    prompt2: "How many active orders in Jamaica right now?",
    prompt3: "Whose insurance or TLC docs expire in 7 days?",
    prompt4: "Top 3 app install sources & conversion",
    prompt5: "Assign driver to pending order in queue",
    filterAll: "All Logs",
    filterActions: "Executed Actions",
    filterQueries: "Info Queries",
    noAuditLogs: "No command history recorded yet.",
    headerBadge: "Jarvis AI",
    welcomeTitle: "Jarvis Internal AI Assistant Ready",
    welcomeText: "I have direct read access to fleet metrics, active orders, brokers, and driver documents. I can also execute dispatch operations on your command.",
    roleAdminAccess: "Full Access (Administrator)",
    roleDispatcherAccess: "Dispatch Access (Orders only)",
    roleRestricted: "Restricted Access",
    voiceNotSupported: "Voice input is not supported in this browser."
  }
};

export type TranslationKey = typeof en;
