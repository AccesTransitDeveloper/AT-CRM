import { TranslationKey } from './en';

export const ru: TranslationKey = {
  // Top Header & System Stats
  header: {
    crmBadge: "CRM",
    hubLocation: "New York",
    subHeader: "Нью-Йорк • Квинс • Бруклин • Бронкс • Манхэттен | AT AI & MTA Брокеридж (15%)",
    activeDrivers: "Активные водители",
    fleet: "автопарк",
    activeOrders: "Активные заказы",
    inDispatch: "в диспетчерской",
    atCommission: "Комиссия AT 15%",
    refreshData: "Обновить данные",
    loggedInAs: "Роль в системе",
    switchActiveRole: "Сменить активную роль",
    language: "Язык",
    english: "Английский",
    russian: "Русский",
    langEn: "EN",
    langRu: "RU"
  },

  // Roles
  roles: {
    admin: {
      label: "Администратор",
      description: "Полный контроль системы, управление финансами, одобрение водителей и диспетчеризация",
      badge: "Полный доступ"
    },
    driver_manager: {
      label: "Менеджер водителей",
      description: "Онбординг водителей, проверка лицензий TLC и управление документами",
      badge: "Онбординг & TLC"
    },
    dispatcher: {
      label: "Диспетчер",
      description: "Управление заказами в реальном времени, назначение водителей и маршруты MTA",
      badge: "Операции"
    },
    support: {
      label: "Оператор поддержки",
      description: "Обработка обращений пассажиров, водителей и брокеров",
      badge: "Поддержка"
    },
    finance: {
      label: "Финансовый менеджер",
      description: "Учёт выручки, брокерских комиссий 15% и расчеты с водителями",
      badge: "Финансы"
    }
  },

  // Workspace subbar
  workspace: {
    activeWorkspace: "Рабочая область:",
    fleetOnline: "Автопарк NYC TLC Онлайн",
    brokerageRate: "Brokerage: 15% AT Commission"
  },

  // Navigation Tabs
  nav: {
    drivers: "Водители",
    driversSub: "Онбординг & Автопарк",
    orders: "Заказы & Маршруты",
    ordersSub: "Диспетчеризация",
    brokers: "Брокеры & MTA",
    brokersSub: "TripLink & MyLe",
    support: "Служба поддержки",
    supportSub: "Тикеты & Чат",
    finance: "Финансы & 15% Comm",
    financeSub: "Отчёты & Выплаты",
    api: "AT AI & Внешний API",
    apiSub: "REST API & Вебхуки",
    moreModules: "Другие модули",
    advancedTools: "Расширенные инструменты",
    compliance: "Комплаенс TLC",
    marketing: "Маркетинг & ИИ",
    appAnalytics: "Аналитика (4 Приложения)",
    referrals: "Реферальная программа",
    employees: "Сотрудники",
    employeesSub: "Доступ & Face ID",
    profile: "Мой профиль"
  },

  // Driver Fleet Management
  drivers: {
    title: "Управление автопарком водителей",
    subtitle: "Соответствие стандартам TLC, онбординг и проверка спецтранспорта WAV",
    countBadge: "{count} Водителей",
    searchPlaceholder: "Поиск по имени, TLC #, номеру...",
    allStatuses: "Все статусы",
    allVehicleTypes: "Все типы ТС",
    allNeighborhoods: "Все районы Queens",
    newDriver: "Новый водитель",
    tableView: "Таблица",
    kanbanView: "Канбан-доска онбординга",
    
    // Table Headers
    thDriver: "Водитель и контакты",
    thLicense: "Лицензия TLC и номер",
    thVehicle: "Класс ТС",
    thCoverage: "Зоны Queens",
    thStatus: "Статус",
    thRating: "Рейтинг и поездки",
    thActions: "Действия",

    // Statuses
    statusApplied: "Заявка подана",
    statusUnderReview: "На проверке",
    statusActive: "Активный водитель",
    statusSuspended: "Заблокирован",
    statusRejected: "Отклонен",

    // Actions
    approve: "Одобрить",
    reject: "Отклонить",
    suspend: "Заблокировать",
    reactivate: "Активировать",
    delete: "Удалить водителя",
    editProfile: "Редактировать профиль",
    viewDetails: "Просмотреть профиль",

    // Stats & counts
    completedTrips: "завершенных поездок",
    plate: "Номер:",
    noDriversFound: "Нет водителей, соответствующих выбранным фильтрам.",

    // Add Driver Modal
    modalAddTitle: "Регистрация водителя TLC",
    modalAddSubtitle: "Заполнение анкеты онбординга и параметров транспортного средства",
    fullName: "ФИО водителя",
    phone: "Номер телефона",
    email: "Электронная почта",
    tlcLicense: "Номер лицензии TLC",
    vehicleType: "Класс автомобиля",
    vehicleMakeModel: "Марка и модель (например: 2023 Toyota Sienna)",
    vehiclePlate: "Госномер ТС TLC (например: T789211C)",
    vehicleYear: "Год выпуска ТС",
    wheelchairAccessible: "Спецтранспорт для инвалидных колясок (WAV пандус / подъемник)",
    operatingNeighborhoods: "Основные зоны работы в Queens",
    notes: "Внутренние примечания по онбордингу",
    cancel: "Отмена",
    registerDriver: "Зарегистрировать заявку",

    // Reject Modal
    modalRejectTitle: "Отклонить заявку водителя",
    rejectPrompt: "Укажите причину отклонения заявки кандидата:",
    rejectReasonPlaceholder: "например: Истёк срок лицензии TLC, страховка не верифицирована...",
    confirmReject: "Подтвердить отклонение",

    // Detail Drawer
    drawerTitle: "Профиль водителя и комплаенс",
    tabDetails: "Профиль и ТС",
    tabDocuments: "Документы TLC",
    tabTrips: "История поездок",
    tabReferrals: "Рефералы",
    tabFinancials: "Финансы и ИИ",
    contactInfo: "Контактная информация",
    licenseDetails: "Лицензии TLC",
    vehicleDetails: "Характеристики автомобиля",
    assignedBoroughs: "Закрепленные районы Queens",
    quickActions: "Быстрые действия",
    statusNote: "Статус заявки",
    joinedDate: "Дата регистрации",
    totalEarnings: "Суммарный доход",
    overallRating: "Оценка пассажиров"
  },

  // Orders View
  orders: {
    title: "Очередь заказов и диспетчеризация",
    subtitle: "Диспетчеризация поездок в реальном времени, брокерские заказы и маршруты",
    countBadge: "{count} Заказов",
    searchPlaceholder: "Поиск по номеру заказа, пассажиру, адресу...",
    allStatuses: "Все статусы заказов",
    allSources: "Все источники",
    allTypes: "Все типы поездок",
    allNeighborhoods: "Все районы Queens",
    newOrder: "Новый заказ",
    
    // Headers
    thOrder: "Заказ и источник",
    thPassenger: "Пассажир и контакты",
    thRoute: "Маршрут (Посадка → Высадка)",
    thVehicle: "Класс ТС и пожелания",
    thFare: "Стоимость и комиссия 15%",
    thDriver: "Назначенный водитель",
    thStatus: "Статус и действия",

    // Statuses
    statusPending: "В очереди на отправку",
    statusAssigned: "Водитель назначен",
    statusEnRoute: "Водитель в пути",
    statusPickedUp: "Пассажир в машине",
    statusCompleted: "Поездка завершена",
    statusCancelled: "Отменен",

    // Actions
    assignDriver: "Назначить водителя",
    reassign: "Переназначить",
    unassign: "Снять водителя",
    completeTrip: "Завершить поездку",
    cancelOrder: "Отменить заказ",
    noDriverAssigned: "Не назначен (в очереди)",
    
    // Modal
    modalAddTitle: "Создание нового заказа",
    passengerName: "Имя пассажира",
    passengerPhone: "Телефон пассажира",
    pickupAddress: "Адрес посадки",
    pickupNeighborhood: "Район посадки",
    dropoffAddress: "Адрес высадки",
    dropoffNeighborhood: "Район высадки",
    fareAmount: "Стоимость поездки ($)",
    atCommissionAmount: "Комиссия AT 15% ($)",
    driverPayoutAmount: "Выплата водителю ($)",
    orderSource: "Источник заказа",
    tripType: "Тип поездки",
    scheduledTime: "Запланированное время посадки",
    specialNeeds: "Особые требования",
    wheelchairRequired: "Требуется спецтранспорт WAV для коляски",
    childSeatRequired: "Требуется детское кресло",
    driverNotes: "Инструкции для водителя",
    dispatchOrder: "Отправить заказ в диспетчерскую",
    noOrdersFound: "Нет заказов, соответствующих выбранным фильтрам."
  },

  // Brokers View
  brokers: {
    title: "Брокерские интеграции и B2B партнеры",
    subtitle: "MTA Access-A-Ride, TripLink, MyLe и медицинские транспортные партнеры",
    countBadge: "{count} Брокеров",
    activePartnerships: "Активные партнерства",
    totalBrokerageVolume: "Общий объем брокерских заказов",
    commissionEarned: "Комиссия 15% брокерских услуг",
    addNewBroker: "Добавить партнера-брокера",
    statusActive: "Активная интеграция",
    statusPending: "Ожидает подключения",
    statusSuspended: "Временно приостановлен",
    brokerName: "Название брокера",
    contactPerson: "Контактное лицо",
    phone: "Телефон",
    email: "Электронная почта",
    commissionRate: "Ставка комиссии",
    ordersProcessed: "Обработано заказов",
    lastDispatch: "Последняя отправка",
    apiConnection: "Статус API вебхука",
    connected: "Подключено и работает",
    disconnected: "Отключено",
    viewOrders: "Просмотреть заказы"
  },

  // Support View
  support: {
    title: "Служба поддержки и помощь водителям",
    subtitle: "Обработка обращений, решение спорных ситуаций и чат",
    countBadge: "{count} Тикетов",
    openTickets: "Открытые тикеты",
    inProgressTickets: "В работе",
    resolvedTickets: "Решенные",
    newTicket: "Создать обращение",
    searchPlaceholder: "Поиск по тикетам, теме, отправителю...",
    filterPriority: "Все приоритеты",
    filterStatus: "Все статусы тикетов",
    thTicket: "Тикет # и тема",
    thSender: "Отправитель и тип",
    thPriority: "Приоритет",
    thStatus: "Статус",
    thLastUpdate: "Обновлено",
    priorityUrgent: "Срочный",
    priorityHigh: "Высокий",
    priorityMedium: "Средний",
    priorityLow: "Низкий",
    statusOpen: "Открыт",
    statusInProgress: "В работе",
    statusResolved: "Решен",
    statusClosed: "Закрыт",
    typeDriver: "Вопрос водителя",
    typePassenger: "Вопрос пассажира",
    typeBroker: "Вопрос брокера",
    typeTechnical: "Техническая проблема / Приложение",
    replyInputPlaceholder: "Введите ответ клиенту или внутреннюю заметку...",
    sendReply: "Отправить ответ",
    markResolved: "Закрыть тикет",
    reopenTicket: "Переоткрыть тикет"
  },

  // Finance View
  finance: {
    title: "Финансовый учет и ведомость комиссии 15%",
    subtitle: "Сверка выручки, расчет комиссий брокеров и еженедельные выплаты водителям",
    totalGrossFares: "Общий объем заказов (Gross)",
    atCommissionEarned: "Комиссия AT 15%",
    netDriverPayouts: "Выплаты водителям (Net)",
    pendingPayouts: "Ожидают выплаты",
    settlementLedgerTitle: "Еженедельная ведомость выплат водителям",
    period: "Период сверки",
    driverName: "ФИО водителя",
    completedTripsCount: "Завершенных поездок",
    grossRevenue: "Выручка (Gross)",
    atCommissionDeducted: "Комиссия AT 15%",
    netPayable: "К выплате водителю",
    paymentStatus: "Статус выплаты",
    statusPending: "Ожидает подтверждения",
    statusProcessing: "Обработка ACH",
    statusPaid: "Выплачено",
    markAsPaid: "Отметить как выплачено",
    downloadLedger: "Экспорт CSV ведомости"
  },

  // API Explorer View
  apiExplorer: {
    title: "Проводник REST API и интеграций AT AI",
    subtitle: "Эндпоинты для голосовых ИИ-агентов, вебхуков брокеров и мобильных приложений",
    apiKeyTitle: "Заголовок производственной интеграции",
    copyKey: "Скопировать API-ключ",
    keyCopied: "API-ключ скопирован!",
    endpointsTitle: "Зарегистрированные API эндпоинты",
    method: "Метод",
    endpoint: "URL эндпоинта",
    description: "Описание",
    testRequest: "Тестировать эндпоинт",
    samplePayload: "Пример JSON запроса",
    responseHeader: "Ответ API в реальном времени",
    sendTest: "Выполнить запрос"
  },

  // Compliance View
  compliance: {
    title: "Мониторинг комплаенса и лицензий TLC",
    subtitle: "Проверка документов, уведомления об окончании сроков и ИИ-сканирование",
    compliantCount: "Соответствуют нормам",
    expiringCount: "Истекают в течение 30 дней",
    expiredCount: "Требуется действие / Истекли",
    ocrScanButton: "ИИ-сканирование документа",
    sendReminder: "Отправить уведомление о сроках"
  },

  // App Analytics View
  analytics: {
    title: "Аналитика экосистемы мобильных приложений",
    subtitle: "4 нативных приложения: Пассажир и Водитель для iOS и Android",
    allApps: "Все 4 приложения",
    passengerIos: "Accessible Transit Пассажир (iOS)",
    passengerAndroid: "Accessible Transit Пассажир (Android)",
    driverIos: "Accessible Transit Водитель (iOS)",
    driverAndroid: "Accessible Transit Водитель (Android)",
    activeUsers: "Активных пользователей в день",
    totalInstalls: "Всего установок",
    conversionRate: "Конверсия онбординга",
    storeRating: "Рейтинг в App Store / Google Play",
    timeRange30d: "Последние 30 дней",
    timeRange7d: "Последние 7 дней",
    timeRange90d: "Последние 90 дней"
  },

  // Referral Program View
  referrals: {
    title: "Программа лояльности и рефералы",
    subtitle: "Бонусы за привлечение водителей и пассажиров, пороги (5/10/5) и скидки",
    totalReferred: "Всего рефералов",
    activeBonuses: "Выплачено бонусов",
    discountRate: "Скидка на комиссию",
    createReferral: "Зарегистрировать реферала",
    referralCode: "Реферальный промокод",
    shareLink: "Скопировать пригласительную ссылку"
  },

  // Marketing View
  marketing: {
    title: "Маркетинговая аналитика и ИИ-кампании",
    subtitle: "Прогнозирование спроса в районах и привлечение пассажиров через Gemini",
    generateStrategy: "Сгенерировать стратегию кампании",
    activeCampaigns: "Активные промо-кампании",
    demandHeatmap: "Тепловая карта спроса в Queens",
    promoCode: "Промокод",
    discountAmount: "Скидка"
  },

  // Common UI words
  common: {
    loading: "Загрузка данных...",
    save: "Сохранить",
    cancel: "Отмена",
    delete: "Удалить",
    edit: "Редактировать",
    close: "Закрыть",
    actions: "Действия",
    status: "Статус",
    date: "Дата",
    view: "Просмотр",
    search: "Поиск",
    filter: "Фильтр",
    all: "Все",
    yes: "Да",
    no: "Нет",
    online: "В сети",
    offline: "Не в сети",
    exportCsv: "Экспорт в CSV",
    success: "Успешно",
    error: "Ошибка",
    info: "Инфо",
    items: "записей"
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
    title: "Jarvis AI-помощник",
    subtitle: "Внутренний ассистент диспетчерской и операций",
    statusActive: "AI активен",
    statusInactive: "AI отключен",
    toggleActivate: "Включить AI-агента",
    toggleDeactivate: "Выключить AI-агента",
    deactivatedNoticeTitle: "AI-ассистент отключен",
    deactivatedNoticeDesc: "Пока ассистент выключен, Jarvis не имеет доступа к данным CRM и не выполняет команды. Включите тумблер сверху для активации.",
    chatTab: "Интерактивный чат",
    historyTab: "История команд и аудит",
    placeholder: "Спросите о водителях, заказах, документах или дайте команду диспетчера...",
    voiceListening: "Слушаю голосовую команду...",
    voiceStart: "Голосовой ввод",
    voiceStop: "Остановить",
    send: "Отправить",
    clearChat: "Очистить чат",
    confirmationTitle: "Требуется подтверждение действия",
    confirmAction: "Подтвердить и выполнить",
    cancelAction: "Отмена",
    actionExecuted: "Действие успешно выполнено в CRM",
    actionCancelled: "Действие отменено оператором",
    requiresAdminBadge: "Требуются права Администратора",
    executedViaAgent: "Выполнено через Jarvis AI",
    quickPromptsTitle: "Примеры быстрых запросов и команд:",
    prompt1: "Сколько заработал Tariq Al-Mansoor за эту неделю?",
    prompt2: "Сколько активных заказов сейчас в Jamaica?",
    prompt3: "У кого из водителей истекает страховка или TLC через 7 дней?",
    prompt4: "Топ-3 источника установок приложения и конверсия",
    prompt5: "Назначь водителя на заказ в очереди",
    filterAll: "Все записи",
    filterActions: "Выполненные действия",
    filterQueries: "Информационные запросы",
    noAuditLogs: "История команд пока пуста.",
    headerBadge: "Jarvis AI",
    welcomeTitle: "Внутренний AI-ассистент Jarvis готов к работе",
    welcomeText: "У меня есть прямой доступ к показателям автопарка, активным заказам, брокерам и документам водителей. Также я могу выполнять диспетчерские операции по вашей команде.",
    roleAdminAccess: "Полный доступ (Администратор)",
    roleDispatcherAccess: "Диспетчерский доступ (только заказы)",
    roleRestricted: "Ограниченный доступ",
    voiceNotSupported: "Голосовой ввод не поддерживается данным браузером."
  },

  // Employees, Invitations & Biometrics
  employees: {
    title: "Управление сотрудниками и доступом",
    subtitle: "Список команды CRM, одноразовые ссылки-приглашения с фиксацией IP и биометрический вход Face ID через AWS Rekognition / Azure Face API",
    adminOnlyBadge: "Только для Администратора",
    tabEmployees: "Список сотрудников",
    tabInvitations: "Активные приглашения",
    tabAudit: "Журнал входов и Face ID",
    inviteBtn: "Пригласить сотрудника",
    testSelfRegister: "Открыть форму саморегистрации",
    statsTotal: "Всего сотрудников",
    statsActive: "Активных учетных записей",
    statsFaceEnrolled: "Face ID настроен",
    statsPendingInvites: "Ожидающих приглашений",
    
    // Table Headers
    thEmployee: "Сотрудник",
    thRole: "Роль в CRM",
    thStatus: "Статус",
    thFaceId: "Биометрия Face ID",
    thRegistered: "Дата регистрации",
    thLastLogin: "Последний вход",
    thActions: "Действия",

    // Statuses
    statusActive: "Активен",
    statusInvited: "Приглашён",
    statusSuspended: "Приостановлен",
    statusBlocked: "Заблокирован",

    // Face ID Badges
    faceEnrolled: "Настроен (Активен)",
    faceNotEnrolled: "Не настроен",
    faceLocked: "Заблокирован (15 мин)",
    reEnrollFace: "Сбросить / Пересдать Face ID",
    blockUser: "Заблокировать доступ",
    unblockUser: "Разблокировать",
    deleteUser: "Удалить и стереть биометрию",
    deleteConfirm: "Вы уверены? Аккаунт будет удален, а числовые embedding-векторы лица будут автоматически стёрты из базы в строгом соответствии с политикой конфиденциальности.",
    
    // Invitations Tab
    invitationsTitle: "Одноразовые ссылки-приглашения (срок 48 часов)",
    invitationsSubtitle: "Ссылка автоматически аннулируется после первого использования или через 48 часов. Первичный IP устройства фиксируется для защиты от перехвата.",
    thLink: "Токен и ссылка",
    thTarget: "Кому предназначена",
    thRoleAssigned: "Назначаемая роль",
    thExpiresIn: "Срок действия (TTL)",
    thFirstSeenIp: "Проверка IP устройства",
    thCreatedBy: "Кем выдана",
    thInvStatus: "Статус ссылки",
    revokeBtn: "Отозвать ссылку",
    copyLink: "Копировать ссылку",
    linkCopied: "Ссылка-приглашение скопирована в буфер обмена!",
    ipMismatchWarning: "Внимание: сменился IP",
    ipMatched: "IP совпадает",
    ipNotOpenedYet: "Ещё не открывалась",
    statusPending: "Активна (Ожидает)",
    statusUsed: "Использована",
    statusRevoked: "Отозвана админом",
    statusExpired: "Протухла (>48ч)",

    // Invite Modal
    modalInviteTitle: "Генерация ссылки-приглашения для сотрудника",
    modalInviteSubtitle: "Выберите роль для нового члена команды. Будет сгенерирован одноразовый защищенный токен со сроком действия 48 часов.",
    formRoleLabel: "Роль в системе CRM",
    formTargetEmail: "Email сотрудника (необязательно)",
    formTargetName: "ФИО сотрудника (необязательно)",
    generateLinkBtn: "Сгенерировать защищенную 48ч ссылку",
    generatedLinkReady: "Одноразовая ссылка-приглашение создана:",
    linkSecurityNotice: "Безопасность: Ссылка может быть использована только 1 раз. При регистрации система зафиксирует IP устройства и предупредит администратора при несовпадении.",
    shareEmailBtn: "Имитировать отправку по Email",

    // Face Enrollment & Registration Flow
    enrollmentTitle: "Accessible Transit CRM • Регистрация сотрудника",
    enrollmentSubtitle: "Заполните персональные данные и пройдите биометрическую настройку Face ID",
    step1Title: "1. Учётные данные сотрудника",
    step2Title: "2. Настройка Face ID и проверка живости (Liveness)",
    step3Title: "3. Завершение и активация",
    formFullName: "ФИО (Полное имя)",
    formEmail: "Рабочий Email",
    formPhone: "Контактный телефон",
    formPassword: "Придумайте пароль",
    formPasswordHint: "Пароль используется как резервный способ входа при проблемах с камерой или освещением",
    nextStepBtn: "Перейти к Face Verification Setup",
    
    // Biometric Consent & Camera
    consentTitle: "Согласие на обработку биометрических данных",
    consentCheckbox: "Я согласен на обработку биометрических данных (изображение лица) для целей аутентификации в системе AT CRM. Я проинформирован, что само фото в базе не хранится, а сохраняется лишь числовой embedding лица от сервиса распознавания, который автоматически удаляется при увольнении.",
    consentRequiredError: "Необходимо подтвердить согласие на обработку биометрии для перехода к камере.",
    cameraNotice: "Убедитесь, что ваше лицо хорошо освещено, и посмотрите прямо в камеру.",
    startCameraBtn: "Включить камеру и начать проверку",
    cameraPermissionDenied: "Доступ к камере отклонен или устройство недоступно. Разрешите доступ к камере в браузере.",
    livenessPrompt1: "Посмотрите прямо в камеру",
    livenessPrompt2: "Моргните глазами...",
    livenessPrompt3: "Слегка поверните голову влево/вправо",
    livenessSuccess: "Проверка на живость (Liveness) успешно пройдена! Готово к созданию embedding.",
    captureAndRegisterBtn: "Сделать снимок и завершить Face ID",
    processingBiometrics: "Обработка биометрии через AWS Rekognition / Azure Face API...",
    registrationSuccessTitle: "Регистрация и Face ID успешно завершены!",
    registrationSuccessSubtitle: "Ваш аккаунт активирован с назначенной ролью. Теперь вы можете мгновенно входить по Face ID или использовать пароль.",
    proceedToLoginBtn: "Войти в систему AT CRM",

    // Face Login Dialog / Switcher
    loginTitle: "Вход в систему Accessible Transit CRM",
    loginSubtitle: "Авторизация в Queens Central Dispatch по Face ID или резервному паролю",
    tabFaceId: "Вход по лицу (Face ID)",
    tabPassword: "Вход по паролю",
    faceScanning: "Поместите лицо в контур овала для распознавания...",
    scanNowBtn: "Распознать лицо и войти",
    verifyingFace: "Сравнение биометрического embedding с базой CRM...",
    matchSuccess: "Лицо подтверждено! Добро пожаловать.",
    faceAttemptsRemaining: "Неудачных попыток: {count}/3. (После 3 попыток — блокировка Face ID на 15 минут).",
    faceLockedMsg: "Вход по Face ID временно заблокирован на 15 минут из-за 3 несовпадений. Войдите по паролю.",
    fallbackPasswordBtn: "Войти по резервному паролю",
    passwordLoginBtn: "Войти по паролю",
    loginSuccessRedirect: "Вход выполнен успешно. Перенаправление...",
    
    // Profile View (for Non-Admin)
    myProfileTitle: "Личный профиль сотрудника",
    myProfileSubtitle: "Просмотр назначенной роли, параметров безопасности и статуса биометрии Face ID",
    requestFaceResetBtn: "Запросить пересдачу Face ID у Администратора",
    requestSentMsg: "Запрос на пересдачу Face ID отправлен администратору Elena Rostova."
  }
};
