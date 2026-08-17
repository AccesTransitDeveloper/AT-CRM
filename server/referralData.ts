import { 
  ReferralRecord, 
  ReferralReward, 
  CommissionRateLog, 
  ReferralProgramSettings, 
  DriverReferralSummary,
  ReferralDashboardStats,
  Driver
} from '../src/types';

// Default Referral Program Settings
export const initialReferralSettings: ReferralProgramSettings = {
  isEnabled: true,
  baseUrl: 'https://accessibletransit.com/ref/{code}',
  passengerThreshold: 5,
  passengerRewardType: 'free_trip',
  passengerDiscountPercent: 25,
  driverPassengerThreshold: 10,
  driverPassengerCommissionDiscount: 3, // 3%
  driverDriverThreshold: 5,
  driverDriverCommissionDiscount: 3, // 3%
  commissionDiscountDurationDays: 30,
  antiFraudDuplicatePhoneCheck: true,
  antiFraudSameDeviceCheck: true,
  maxAccountsPerIp: 3
};

// Generate referral code helper
export function generateReferralCode(userName: string, type: 'passenger' | 'driver', id: string): string {
  const cleanName = userName.split(' ')[0].toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6) || 'USER';
  const prefix = type === 'passenger' ? 'ATP' : 'ATD';
  const shortId = id.replace(/[^0-9]/g, '').slice(-3) || Math.floor(100 + Math.random() * 900).toString();
  return `${prefix}-${cleanName}-${shortId}`;
}

export function formatReferralUrl(baseUrl: string, code: string): string {
  if (baseUrl.includes('{code}')) {
    return baseUrl.replace('{code}', code);
  }
  return `${baseUrl.replace(/\/$/, '')}/${code}`;
}

// Initial Mock Referrals Data
export const initialReferrals: ReferralRecord[] = [
  // Tariq Al-Mansoor (drv-101) - 7 active passengers, 2 registered, 1 invited = 10 total; 3 active drivers, 1 registered, 1 invited = 5 total
  {
    id: 'ref-1001',
    referrerId: 'drv-101',
    referrerName: 'Tariq Al-Mansoor',
    referrerType: 'driver',
    referredId: 'psg-901',
    referredName: 'Maria Rodriguez',
    referredPhone: '+1 (718) 555-3921',
    referredType: 'passenger',
    codeType: 'driver_to_passenger',
    referralCode: 'ATP-TARIQ-101',
    dateInstalled: '2026-07-15T10:30:00.000Z',
    dateActivated: '2026-07-16T14:15:00.000Z',
    status: 'active',
    firstOrderId: 'ord-881',
    firstOrderDate: '2026-07-16',
    ipAddress: '68.194.22.11',
    deviceFingerprint: 'dev-ios-mrodriguez'
  },
  {
    id: 'ref-1002',
    referrerId: 'drv-101',
    referrerName: 'Tariq Al-Mansoor',
    referrerType: 'driver',
    referredId: 'psg-902',
    referredName: 'David Chen',
    referredPhone: '+1 (917) 555-8841',
    referredType: 'passenger',
    codeType: 'driver_to_passenger',
    referralCode: 'ATP-TARIQ-101',
    dateInstalled: '2026-07-18T16:20:00.000Z',
    dateActivated: '2026-07-19T09:40:00.000Z',
    status: 'active',
    firstOrderId: 'ord-892',
    firstOrderDate: '2026-07-19',
    ipAddress: '108.45.19.74',
    deviceFingerprint: 'dev-and-dchen'
  },
  {
    id: 'ref-1003',
    referrerId: 'drv-101',
    referrerName: 'Tariq Al-Mansoor',
    referrerType: 'driver',
    referredId: 'psg-903',
    referredName: 'Sarah Goldstein',
    referredPhone: '+1 (347) 555-1209',
    referredType: 'passenger',
    codeType: 'driver_to_passenger',
    referralCode: 'ATP-TARIQ-101',
    dateInstalled: '2026-07-22T11:10:00.000Z',
    dateActivated: '2026-07-23T18:05:00.000Z',
    status: 'active',
    firstOrderId: 'ord-904',
    firstOrderDate: '2026-07-23',
    ipAddress: '74.108.92.15',
    deviceFingerprint: 'dev-ios-sgold'
  },
  {
    id: 'ref-1004',
    referrerId: 'drv-101',
    referrerName: 'Tariq Al-Mansoor',
    referrerType: 'driver',
    referredId: 'psg-904',
    referredName: 'Anil Kapoor',
    referredPhone: '+1 (718) 555-7744',
    referredType: 'passenger',
    codeType: 'driver_to_passenger',
    referralCode: 'ATP-TARIQ-101',
    dateInstalled: '2026-07-28T08:50:00.000Z',
    dateActivated: '2026-07-29T12:30:00.000Z',
    status: 'active',
    firstOrderId: 'ord-919',
    firstOrderDate: '2026-07-29',
    ipAddress: '69.115.44.82',
    deviceFingerprint: 'dev-and-akapoor'
  },
  {
    id: 'ref-1005',
    referrerId: 'drv-101',
    referrerName: 'Tariq Al-Mansoor',
    referrerType: 'driver',
    referredId: 'psg-905',
    referredName: 'Evelyn Taylor',
    referredPhone: '+1 (929) 555-6611',
    referredType: 'passenger',
    codeType: 'driver_to_passenger',
    referralCode: 'ATP-TARIQ-101',
    dateInstalled: '2026-08-01T14:40:00.000Z',
    dateActivated: '2026-08-02T16:20:00.000Z',
    status: 'active',
    firstOrderId: 'ord-935',
    firstOrderDate: '2026-08-02',
    ipAddress: '70.22.181.9',
    deviceFingerprint: 'dev-ios-etaylor'
  },
  {
    id: 'ref-1006',
    referrerId: 'drv-101',
    referrerName: 'Tariq Al-Mansoor',
    referrerType: 'driver',
    referredId: 'psg-906',
    referredName: 'Mohammad Al-Jamil',
    referredPhone: '+1 (718) 555-4301',
    referredType: 'passenger',
    codeType: 'driver_to_passenger',
    referralCode: 'ATP-TARIQ-101',
    dateInstalled: '2026-08-05T09:15:00.000Z',
    dateActivated: '2026-08-06T11:00:00.000Z',
    status: 'active',
    firstOrderId: 'ord-951',
    firstOrderDate: '2026-08-06',
    ipAddress: '108.28.66.12',
    deviceFingerprint: 'dev-and-maljamil'
  },
  {
    id: 'ref-1007',
    referrerId: 'drv-101',
    referrerName: 'Tariq Al-Mansoor',
    referrerType: 'driver',
    referredId: 'psg-907',
    referredName: 'Grace Van Der Bilt',
    referredPhone: '+1 (917) 555-9088',
    referredType: 'passenger',
    codeType: 'driver_to_passenger',
    referralCode: 'ATP-TARIQ-101',
    dateInstalled: '2026-08-09T17:00:00.000Z',
    dateActivated: '2026-08-10T15:30:00.000Z',
    status: 'active',
    firstOrderId: 'ord-972',
    firstOrderDate: '2026-08-10',
    ipAddress: '68.199.112.5',
    deviceFingerprint: 'dev-ios-gracev'
  },
  {
    id: 'ref-1008',
    referrerId: 'drv-101',
    referrerName: 'Tariq Al-Mansoor',
    referrerType: 'driver',
    referredId: 'psg-908',
    referredName: 'Jose Santana',
    referredPhone: '+1 (347) 555-7319',
    referredType: 'passenger',
    codeType: 'driver_to_passenger',
    referralCode: 'ATP-TARIQ-101',
    dateInstalled: '2026-08-12T12:10:00.000Z',
    dateActivated: null,
    status: 'registered',
    ipAddress: '108.45.99.33',
    deviceFingerprint: 'dev-and-jsantana'
  },
  {
    id: 'ref-1009',
    referrerId: 'drv-101',
    referrerName: 'Tariq Al-Mansoor',
    referrerType: 'driver',
    referredId: 'psg-909',
    referredName: 'Hannah Kim',
    referredPhone: '+1 (718) 555-2244',
    referredType: 'passenger',
    codeType: 'driver_to_passenger',
    referralCode: 'ATP-TARIQ-101',
    dateInstalled: '2026-08-14T19:30:00.000Z',
    dateActivated: null,
    status: 'registered',
    ipAddress: '72.229.14.90',
    deviceFingerprint: 'dev-ios-hkim'
  },
  {
    id: 'ref-1010',
    referrerId: 'drv-101',
    referrerName: 'Tariq Al-Mansoor',
    referrerType: 'driver',
    referredId: 'psg-910',
    referredName: 'Robert Walsh',
    referredPhone: '+1 (929) 555-8120',
    referredType: 'passenger',
    codeType: 'driver_to_passenger',
    referralCode: 'ATP-TARIQ-101',
    dateInstalled: '2026-08-15T09:00:00.000Z',
    dateActivated: null,
    status: 'invited',
    ipAddress: '68.194.22.11'
  },
  // Tariq Driver Referrals (3 active, 1 registered, 1 invited)
  {
    id: 'ref-1011',
    referrerId: 'drv-101',
    referrerName: 'Tariq Al-Mansoor',
    referrerType: 'driver',
    referredId: 'drv-105',
    referredName: 'Elena Rostova',
    referredPhone: '+1 (917) 555-3390',
    referredType: 'driver',
    codeType: 'driver_to_driver',
    referralCode: 'ATD-TARIQ-101',
    dateInstalled: '2026-06-10T10:00:00.000Z',
    dateActivated: '2026-06-18T14:00:00.000Z',
    status: 'active',
    firstOrderId: 'ord-702',
    firstOrderDate: '2026-06-18',
    ipAddress: '74.108.15.22',
    deviceFingerprint: 'dev-drv-elena'
  },
  {
    id: 'ref-1012',
    referrerId: 'drv-101',
    referrerName: 'Tariq Al-Mansoor',
    referrerType: 'driver',
    referredId: 'drv-106',
    referredName: 'Marcus Vance',
    referredPhone: '+1 (718) 555-9012',
    referredType: 'driver',
    codeType: 'driver_to_driver',
    referralCode: 'ATD-TARIQ-101',
    dateInstalled: '2026-06-25T11:30:00.000Z',
    dateActivated: '2026-07-02T16:15:00.000Z',
    status: 'active',
    firstOrderId: 'ord-755',
    firstOrderDate: '2026-07-02',
    ipAddress: '108.28.44.11',
    deviceFingerprint: 'dev-drv-marcus'
  },
  {
    id: 'ref-1013',
    referrerId: 'drv-101',
    referrerName: 'Tariq Al-Mansoor',
    referrerType: 'driver',
    referredId: 'drv-107',
    referredName: 'Carlos Mendez',
    referredPhone: '+1 (347) 555-6678',
    referredType: 'driver',
    codeType: 'driver_to_driver',
    referralCode: 'ATD-TARIQ-101',
    dateInstalled: '2026-07-10T09:00:00.000Z',
    dateActivated: '2026-07-16T12:00:00.000Z',
    status: 'active',
    firstOrderId: 'ord-810',
    firstOrderDate: '2026-07-16',
    ipAddress: '69.115.88.99',
    deviceFingerprint: 'dev-drv-carlos'
  },
  {
    id: 'ref-1014',
    referrerId: 'drv-101',
    referrerName: 'Tariq Al-Mansoor',
    referrerType: 'driver',
    referredId: 'drv-108',
    referredName: 'Fatima Zahra',
    referredPhone: '+1 (929) 555-4433',
    referredType: 'driver',
    codeType: 'driver_to_driver',
    referralCode: 'ATD-TARIQ-101',
    dateInstalled: '2026-08-01T15:20:00.000Z',
    dateActivated: null,
    status: 'registered',
    ipAddress: '70.22.45.18',
    deviceFingerprint: 'dev-drv-fatima'
  },
  {
    id: 'ref-1015',
    referrerId: 'drv-101',
    referrerName: 'Tariq Al-Mansoor',
    referrerType: 'driver',
    referredId: 'drv-109',
    referredName: 'Sergei Volkov',
    referredPhone: '+1 (718) 555-0988',
    referredType: 'driver',
    codeType: 'driver_to_driver',
    referralCode: 'ATD-TARIQ-101',
    dateInstalled: '2026-08-11T18:40:00.000Z',
    dateActivated: null,
    status: 'invited',
    ipAddress: '68.194.22.11'
  },

  // Elena Rostova (drv-105) - 12 active passengers, 1 registered -> Earned 3% commission discount!
  {
    id: 'ref-1020',
    referrerId: 'drv-105',
    referrerName: 'Elena Rostova',
    referrerType: 'driver',
    referredId: 'psg-920',
    referredName: 'Oksana Petrova',
    referredPhone: '+1 (718) 555-6677',
    referredType: 'passenger',
    codeType: 'driver_to_passenger',
    referralCode: 'ATP-ELENA-105',
    dateInstalled: '2026-07-01T10:00:00.000Z',
    dateActivated: '2026-07-02T11:00:00.000Z',
    status: 'active',
    firstOrderId: 'ord-710',
    firstOrderDate: '2026-07-02',
    ipAddress: '108.45.22.19'
  },
  {
    id: 'ref-1021',
    referrerId: 'drv-105',
    referrerName: 'Elena Rostova',
    referrerType: 'driver',
    referredId: 'psg-921',
    referredName: 'Viktor Smirnov',
    referredPhone: '+1 (917) 555-3321',
    referredType: 'passenger',
    codeType: 'driver_to_passenger',
    referralCode: 'ATP-ELENA-105',
    dateInstalled: '2026-07-03T12:00:00.000Z',
    dateActivated: '2026-07-04T15:30:00.000Z',
    status: 'active',
    firstOrderId: 'ord-722',
    firstOrderDate: '2026-07-04',
    ipAddress: '74.108.19.82'
  },
  {
    id: 'ref-1022',
    referrerId: 'drv-105',
    referrerName: 'Elena Rostova',
    referrerType: 'driver',
    referredId: 'psg-922',
    referredName: 'Yulia Kuznetsova',
    referredPhone: '+1 (347) 555-9988',
    referredType: 'passenger',
    codeType: 'driver_to_passenger',
    referralCode: 'ATP-ELENA-105',
    dateInstalled: '2026-07-05T09:30:00.000Z',
    dateActivated: '2026-07-06T14:10:00.000Z',
    status: 'active',
    firstOrderId: 'ord-735',
    firstOrderDate: '2026-07-06',
    ipAddress: '69.115.33.10'
  },
  {
    id: 'ref-1023',
    referrerId: 'drv-105',
    referrerName: 'Elena Rostova',
    referrerType: 'driver',
    referredId: 'psg-923',
    referredName: 'Dmitri Belov',
    referredPhone: '+1 (718) 555-4411',
    referredType: 'passenger',
    codeType: 'driver_to_passenger',
    referralCode: 'ATP-ELENA-105',
    dateInstalled: '2026-07-08T16:00:00.000Z',
    dateActivated: '2026-07-09T18:00:00.000Z',
    status: 'active',
    firstOrderId: 'ord-749',
    firstOrderDate: '2026-07-09',
    ipAddress: '70.22.90.11'
  },
  {
    id: 'ref-1024',
    referrerId: 'drv-105',
    referrerName: 'Elena Rostova',
    referrerType: 'driver',
    referredId: 'psg-924',
    referredName: 'Ekaterina Morozova',
    referredPhone: '+1 (929) 555-7722',
    referredType: 'passenger',
    codeType: 'driver_to_passenger',
    referralCode: 'ATP-ELENA-105',
    dateInstalled: '2026-07-12T11:20:00.000Z',
    dateActivated: '2026-07-13T13:40:00.000Z',
    status: 'active',
    firstOrderId: 'ord-766',
    firstOrderDate: '2026-07-13',
    ipAddress: '108.28.11.44'
  },
  {
    id: 'ref-1025',
    referrerId: 'drv-105',
    referrerName: 'Elena Rostova',
    referrerType: 'driver',
    referredId: 'psg-925',
    referredName: 'Alexander Popov',
    referredPhone: '+1 (917) 555-1100',
    referredType: 'passenger',
    codeType: 'driver_to_passenger',
    referralCode: 'ATP-ELENA-105',
    dateInstalled: '2026-07-15T14:10:00.000Z',
    dateActivated: '2026-07-16T17:20:00.000Z',
    status: 'active',
    firstOrderId: 'ord-780',
    firstOrderDate: '2026-07-16',
    ipAddress: '68.199.30.9'
  },
  {
    id: 'ref-1026',
    referrerId: 'drv-105',
    referrerName: 'Elena Rostova',
    referrerType: 'driver',
    referredId: 'psg-926',
    referredName: 'Irina Vasilyeva',
    referredPhone: '+1 (347) 555-5544',
    referredType: 'passenger',
    codeType: 'driver_to_passenger',
    referralCode: 'ATP-ELENA-105',
    dateInstalled: '2026-07-18T10:00:00.000Z',
    dateActivated: '2026-07-19T12:15:00.000Z',
    status: 'active',
    firstOrderId: 'ord-795',
    firstOrderDate: '2026-07-19',
    ipAddress: '72.229.88.14'
  },
  {
    id: 'ref-1027',
    referrerId: 'drv-105',
    referrerName: 'Elena Rostova',
    referrerType: 'driver',
    referredId: 'psg-927',
    referredName: 'Mikhail Sokolov',
    referredPhone: '+1 (718) 555-8833',
    referredType: 'passenger',
    codeType: 'driver_to_passenger',
    referralCode: 'ATP-ELENA-105',
    dateInstalled: '2026-07-21T15:30:00.000Z',
    dateActivated: '2026-07-22T16:50:00.000Z',
    status: 'active',
    firstOrderId: 'ord-812',
    firstOrderDate: '2026-07-22',
    ipAddress: '108.45.10.77'
  },
  {
    id: 'ref-1028',
    referrerId: 'drv-105',
    referrerName: 'Elena Rostova',
    referrerType: 'driver',
    referredId: 'psg-928',
    referredName: 'Svetlana Fedorova',
    referredPhone: '+1 (929) 555-2299',
    referredType: 'passenger',
    codeType: 'driver_to_passenger',
    referralCode: 'ATP-ELENA-105',
    dateInstalled: '2026-07-25T12:00:00.000Z',
    dateActivated: '2026-07-26T14:30:00.000Z',
    status: 'active',
    firstOrderId: 'ord-830',
    firstOrderDate: '2026-07-26',
    ipAddress: '74.108.44.20'
  },
  {
    id: 'ref-1029',
    referrerId: 'drv-105',
    referrerName: 'Elena Rostova',
    referrerType: 'driver',
    referredId: 'psg-929',
    referredName: 'Natalia Ivanova',
    referredPhone: '+1 (917) 555-6688',
    referredType: 'passenger',
    codeType: 'driver_to_passenger',
    referralCode: 'ATP-ELENA-105',
    dateInstalled: '2026-07-28T09:10:00.000Z',
    dateActivated: '2026-07-29T11:45:00.000Z',
    status: 'active',
    firstOrderId: 'ord-845',
    firstOrderDate: '2026-07-29',
    ipAddress: '69.115.11.90'
  },

  // Gulnara Karimova (drv-102) - 6 active passengers, 2 active drivers
  {
    id: 'ref-1030',
    referrerId: 'drv-102',
    referrerName: 'Gulnara Karimova',
    referrerType: 'driver',
    referredId: 'psg-930',
    referredName: 'Alisher Usmanov',
    referredPhone: '+1 (347) 555-7711',
    referredType: 'passenger',
    codeType: 'driver_to_passenger',
    referralCode: 'ATP-GULNARA-102',
    dateInstalled: '2026-07-10T14:00:00.000Z',
    dateActivated: '2026-07-11T16:00:00.000Z',
    status: 'active',
    firstOrderId: 'ord-801',
    firstOrderDate: '2026-07-11',
    ipAddress: '70.22.19.80'
  },
  {
    id: 'ref-1031',
    referrerId: 'drv-102',
    referrerName: 'Gulnara Karimova',
    referrerType: 'driver',
    referredId: 'psg-931',
    referredName: 'Zarina Khasanova',
    referredPhone: '+1 (718) 555-9900',
    referredType: 'passenger',
    codeType: 'driver_to_passenger',
    referralCode: 'ATP-GULNARA-102',
    dateInstalled: '2026-07-14T11:30:00.000Z',
    dateActivated: '2026-07-15T15:20:00.000Z',
    status: 'active',
    firstOrderId: 'ord-818',
    firstOrderDate: '2026-07-15',
    ipAddress: '108.28.33.91'
  },
  {
    id: 'ref-1032',
    referrerId: 'drv-102',
    referrerName: 'Gulnara Karimova',
    referrerType: 'driver',
    referredId: 'psg-932',
    referredName: 'Shavkat Mirzoyev',
    referredPhone: '+1 (917) 555-4455',
    referredType: 'passenger',
    codeType: 'driver_to_passenger',
    referralCode: 'ATP-GULNARA-102',
    dateInstalled: '2026-07-20T08:45:00.000Z',
    dateActivated: '2026-07-21T10:30:00.000Z',
    status: 'active',
    firstOrderId: 'ord-833',
    firstOrderDate: '2026-07-21',
    ipAddress: '68.199.44.12'
  },
  {
    id: 'ref-1033',
    referrerId: 'drv-102',
    referrerName: 'Gulnara Karimova',
    referrerType: 'driver',
    referredId: 'psg-933',
    referredName: 'Nodira Azimova',
    referredPhone: '+1 (929) 555-8822',
    referredType: 'passenger',
    codeType: 'driver_to_passenger',
    referralCode: 'ATP-GULNARA-102',
    dateInstalled: '2026-07-26T16:10:00.000Z',
    dateActivated: '2026-07-27T18:00:00.000Z',
    status: 'active',
    firstOrderId: 'ord-852',
    firstOrderDate: '2026-07-27',
    ipAddress: '72.229.19.40'
  },
  {
    id: 'ref-1034',
    referrerId: 'drv-102',
    referrerName: 'Gulnara Karimova',
    referrerType: 'driver',
    referredId: 'psg-934',
    referredName: 'Rustam Kasimdzhanov',
    referredPhone: '+1 (347) 555-3311',
    referredType: 'passenger',
    codeType: 'driver_to_passenger',
    referralCode: 'ATP-GULNARA-102',
    dateInstalled: '2026-08-03T12:00:00.000Z',
    dateActivated: '2026-08-04T14:40:00.000Z',
    status: 'active',
    firstOrderId: 'ord-870',
    firstOrderDate: '2026-08-04',
    ipAddress: '108.45.66.88'
  },
  {
    id: 'ref-1035',
    referrerId: 'drv-102',
    referrerName: 'Gulnara Karimova',
    referrerType: 'driver',
    referredId: 'psg-935',
    referredName: 'Dilnoza Kubayeva',
    referredPhone: '+1 (718) 555-0099',
    referredType: 'passenger',
    codeType: 'driver_to_passenger',
    referralCode: 'ATP-GULNARA-102',
    dateInstalled: '2026-08-10T10:20:00.000Z',
    dateActivated: '2026-08-11T13:10:00.000Z',
    status: 'active',
    firstOrderId: 'ord-895',
    firstOrderDate: '2026-08-11',
    ipAddress: '74.108.77.30'
  },

  // Passenger to Passenger Referrals (Maria Rodriguez has 6 active passengers -> Free trip reward!)
  {
    id: 'ref-1040',
    referrerId: 'psg-901',
    referrerName: 'Maria Rodriguez',
    referrerType: 'passenger',
    referredId: 'psg-940',
    referredName: 'Carmen Ortiz',
    referredPhone: '+1 (718) 555-6610',
    referredType: 'passenger',
    codeType: 'passenger_to_passenger',
    referralCode: 'ATP-MARIA-901',
    dateInstalled: '2026-07-20T11:00:00.000Z',
    dateActivated: '2026-07-21T14:00:00.000Z',
    status: 'active',
    firstOrderId: 'ord-840',
    firstOrderDate: '2026-07-21',
    ipAddress: '68.194.88.19'
  },
  {
    id: 'ref-1041',
    referrerId: 'psg-901',
    referrerName: 'Maria Rodriguez',
    referrerType: 'passenger',
    referredId: 'psg-941',
    referredName: 'Hector Delgado',
    referredPhone: '+1 (917) 555-2288',
    referredType: 'passenger',
    codeType: 'passenger_to_passenger',
    referralCode: 'ATP-MARIA-901',
    dateInstalled: '2026-07-23T15:30:00.000Z',
    dateActivated: '2026-07-24T17:15:00.000Z',
    status: 'active',
    firstOrderId: 'ord-855',
    firstOrderDate: '2026-07-24',
    ipAddress: '108.45.33.12'
  },
  {
    id: 'ref-1042',
    referrerId: 'psg-901',
    referrerName: 'Maria Rodriguez',
    referrerType: 'passenger',
    referredId: 'psg-942',
    referredName: 'Luisa Morales',
    referredPhone: '+1 (347) 555-4477',
    referredType: 'passenger',
    codeType: 'passenger_to_passenger',
    referralCode: 'ATP-MARIA-901',
    dateInstalled: '2026-07-28T09:00:00.000Z',
    dateActivated: '2026-07-29T11:30:00.000Z',
    status: 'active',
    firstOrderId: 'ord-872',
    firstOrderDate: '2026-07-29',
    ipAddress: '74.108.55.90'
  },
  {
    id: 'ref-1043',
    referrerId: 'psg-901',
    referrerName: 'Maria Rodriguez',
    referrerType: 'passenger',
    referredId: 'psg-943',
    referredName: 'Fernando Gomez',
    referredPhone: '+1 (929) 555-8811',
    referredType: 'passenger',
    codeType: 'passenger_to_passenger',
    referralCode: 'ATP-MARIA-901',
    dateInstalled: '2026-08-02T13:40:00.000Z',
    dateActivated: '2026-08-03T16:00:00.000Z',
    status: 'active',
    firstOrderId: 'ord-888',
    firstOrderDate: '2026-08-03',
    ipAddress: '69.115.77.20'
  },
  {
    id: 'ref-1044',
    referrerId: 'psg-901',
    referrerName: 'Maria Rodriguez',
    referrerType: 'passenger',
    referredId: 'psg-944',
    referredName: 'Sofia Castillo',
    referredPhone: '+1 (718) 555-1199',
    referredType: 'passenger',
    codeType: 'passenger_to_passenger',
    referralCode: 'ATP-MARIA-901',
    dateInstalled: '2026-08-06T10:15:00.000Z',
    dateActivated: '2026-08-07T12:45:00.000Z',
    status: 'active',
    firstOrderId: 'ord-902',
    firstOrderDate: '2026-08-07',
    ipAddress: '70.22.33.60'
  },
  {
    id: 'ref-1045',
    referrerId: 'psg-901',
    referrerName: 'Maria Rodriguez',
    referrerType: 'passenger',
    referredId: 'psg-945',
    referredName: 'Diego Navarro',
    referredPhone: '+1 (917) 555-9922',
    referredType: 'passenger',
    codeType: 'passenger_to_passenger',
    referralCode: 'ATP-MARIA-901',
    dateInstalled: '2026-08-11T14:30:00.000Z',
    dateActivated: '2026-08-12T17:00:00.000Z',
    status: 'active',
    firstOrderId: 'ord-920',
    firstOrderDate: '2026-08-12',
    ipAddress: '108.28.99.11'
  },

  // SUSPICIOUS ANTI-FRAUD EXAMPLES (for manual admin review)
  {
    id: 'ref-9001',
    referrerId: 'drv-104',
    referrerName: 'Bakhtiyor Rakhmonov',
    referrerType: 'driver',
    referredId: 'psg-991',
    referredName: 'Bakhtiyor Rakhmonov (Alt)',
    referredPhone: '+1 (718) 555-4920', // Same phone as driver
    referredType: 'passenger',
    codeType: 'driver_to_passenger',
    referralCode: 'ATP-BAKHTIYOR-104',
    dateInstalled: '2026-08-14T11:00:00.000Z',
    dateActivated: null,
    status: 'invited',
    isSuspicious: true,
    suspiciousReason: 'Self-referral attempt: Matching phone number and device identifier',
    ipAddress: '68.194.22.11',
    deviceFingerprint: 'dev-drv-bakhtiyor'
  },
  {
    id: 'ref-9002',
    referrerId: 'drv-103',
    referrerName: 'Dmitry Sokolov',
    referrerType: 'driver',
    referredId: 'psg-992',
    referredName: 'Bot User 102',
    referredPhone: '+1 (917) 555-0012',
    referredType: 'passenger',
    codeType: 'driver_to_passenger',
    referralCode: 'ATP-DMITRY-103',
    dateInstalled: '2026-08-15T03:12:00.000Z',
    dateActivated: null,
    status: 'registered',
    isSuspicious: true,
    suspiciousReason: 'Rapid registration burst: 4 accounts registered within 3 minutes from same IP (194.26.29.112)',
    ipAddress: '194.26.29.112',
    deviceFingerprint: 'dev-emulator-992'
  }
];

// Initial Referral Rewards
export const initialReferralRewards: ReferralReward[] = [
  {
    id: 'rwd-501',
    userId: 'drv-105',
    userName: 'Elena Rostova',
    userType: 'driver',
    rewardType: 'commission_discount',
    rewardValue: 3, // 3%
    description: '3% Commission Discount for inviting 10 Active Passengers (15% -> 12%)',
    earnedDate: '2026-07-29T12:00:00.000Z',
    expiryDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Active for 12 more days
    status: 'active',
    triggerMilestone: '10 Active Passengers Milestone',
    appliedToCommissionRate: 0.12
  },
  {
    id: 'rwd-502',
    userId: 'psg-901',
    userName: 'Maria Rodriguez',
    userType: 'passenger',
    rewardType: 'free_trip',
    rewardValue: 100, // 100% Free Trip up to $35
    description: '1 Free MTA Paratransit/Local Trip (Up to $35.00) for inviting 5 Active Passengers',
    earnedDate: '2026-08-07T13:00:00.000Z',
    expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'active',
    triggerMilestone: '5 Active Passengers Milestone'
  }
];

// Initial Commission Rate Logs
export const initialCommissionLogs: CommissionRateLog[] = [
  {
    id: 'cml-101',
    driverId: 'drv-105',
    driverName: 'Elena Rostova',
    date: '2026-07-29T12:00:00.000Z',
    previousRate: 0.15,
    newRate: 0.12,
    reason: 'Referral Reward Activated: 10 Active Passengers Milestone (-3% Commission for 30 Days)',
    rewardId: 'rwd-501',
    changedBy: 'System Automation'
  }
];

/**
 * Calculates a single driver's referral summary including progress bars, active discounts, and QR codes
 */
export function calculateDriverReferralSummary(
  driver: Driver,
  referrals: ReferralRecord[],
  rewards: ReferralReward[],
  settings: ReferralProgramSettings
): DriverReferralSummary {
  const driverReferrals = referrals.filter(r => r.referrerId === driver.id && !r.isSuspicious);

  const passengerCode = generateReferralCode(driver.fullName, 'passenger', driver.id);
  const driverCode = generateReferralCode(driver.fullName, 'driver', driver.id);
  
  const passengerUrl = formatReferralUrl(settings.baseUrl, passengerCode);
  const driverUrl = formatReferralUrl(settings.baseUrl, driverCode);

  const passengers = driverReferrals.filter(r => r.referredType === 'passenger');
  const drivers = driverReferrals.filter(r => r.referredType === 'driver');

  const activePassengers = passengers.filter(p => p.status === 'active');
  const registeredPassengers = passengers.filter(p => p.status === 'registered');
  const invitedPassengers = passengers.filter(p => p.status === 'invited');

  const activeDrivers = drivers.filter(d => d.status === 'active');
  const registeredDrivers = drivers.filter(d => d.status === 'registered');
  const invitedDrivers = drivers.filter(d => d.status === 'invited');

  // Check active rewards
  const activeRewards = rewards.filter(r => r.userId === driver.id && r.status === 'active' && r.rewardType === 'commission_discount');
  
  let hasActiveDiscount = false;
  let activeCommissionDiscount = 0;
  let commissionDiscountExpiryDate: string | null = null;

  if (activeRewards.length > 0) {
    hasActiveDiscount = true;
    activeCommissionDiscount = activeRewards[0].rewardValue; // e.g. 3%
    commissionDiscountExpiryDate = activeRewards[0].expiryDate;
  }

  const currentCommissionRate = hasActiveDiscount ? Math.max(0.05, 0.15 - (activeCommissionDiscount / 100)) : 0.15;

  return {
    driverId: driver.id,
    driverName: driver.fullName,
    passengerReferralCode: passengerCode,
    driverReferralCode: driverCode,
    passengerReferralUrl: passengerUrl,
    driverReferralUrl: driverUrl,
    invitedPassengersCount: invitedPassengers.length,
    registeredPassengersCount: registeredPassengers.length,
    activePassengersCount: activePassengers.length,
    invitedDriversCount: invitedDrivers.length,
    registeredDriversCount: registeredDrivers.length,
    activeDriversCount: activeDrivers.length,
    passengerMilestoneTarget: settings.driverPassengerThreshold,
    passengerMilestoneProgress: activePassengers.length % settings.driverPassengerThreshold === 0 && activePassengers.length > 0
      ? settings.driverPassengerThreshold 
      : activePassengers.length % settings.driverPassengerThreshold,
    driverMilestoneTarget: settings.driverDriverThreshold,
    driverMilestoneProgress: activeDrivers.length % settings.driverDriverThreshold === 0 && activeDrivers.length > 0
      ? settings.driverDriverThreshold
      : activeDrivers.length % settings.driverDriverThreshold,
    activeCommissionDiscount,
    currentCommissionRate,
    commissionDiscountExpiryDate,
    hasActiveDiscount,
    rewards: rewards.filter(r => r.userId === driver.id),
    passengersList: passengers,
    driversList: drivers
  };
}

/**
 * Calculates overall referral program metrics, leaderboards, growth chart, and suspicious list
 */
export function calculateReferralDashboardStats(
  drivers: Driver[],
  referrals: ReferralRecord[],
  rewards: ReferralReward[],
  settings: ReferralProgramSettings
): ReferralDashboardStats {
  const validReferrals = referrals.filter(r => !r.isSuspicious);
  const totalInvitationsSent = referrals.length + 48; // Realistic QR scans/invites
  const totalQrScans = totalInvitationsSent * 3 + 85;
  const totalInstalls = referrals.filter(r => r.status === 'registered' || r.status === 'active').length + 15;
  const totalActiveUsers = referrals.filter(r => r.status === 'active').length;

  const conversionRateInstallToActivePct = totalInstalls > 0 ? (totalActiveUsers / totalInstalls) * 100 : 0;
  const conversionRateInviteToActivePct = totalInvitationsSent > 0 ? (totalActiveUsers / totalInvitationsSent) * 100 : 0;

  const activeDriverDiscountsCount = rewards.filter(r => r.status === 'active' && r.rewardType === 'commission_discount').length;
  const totalCommissionSavingsGranted = activeDriverDiscountsCount * 380 + 420; // in USD
  const totalFreeTripsGranted = rewards.filter(r => r.rewardType === 'free_trip').length;

  // Top Driver Referrers (Passengers)
  const driverPassengerMap = new Map<string, { driver: Driver; totalInvited: number; activeCount: number }>();
  drivers.forEach(d => {
    driverPassengerMap.set(d.id, { driver: d, totalInvited: 0, activeCount: 0 });
  });

  validReferrals.filter(r => r.referrerType === 'driver' && r.referredType === 'passenger').forEach(r => {
    const entry = driverPassengerMap.get(r.referrerId);
    if (entry) {
      entry.totalInvited++;
      if (r.status === 'active') entry.activeCount++;
    }
  });

  const topDriverReferrersPassengers = Array.from(driverPassengerMap.values())
    .map(e => ({
      driverId: e.driver.id,
      driverName: e.driver.fullName,
      avatarUrl: e.driver.avatarUrl,
      phone: e.driver.phone,
      vehicleType: e.driver.vehicleType,
      totalInvited: e.totalInvited,
      activeCount: e.activeCount,
      rewardsEarned: rewards.filter(rw => rw.userId === e.driver.id).length
    }))
    .sort((a, b) => b.activeCount - a.activeCount || b.totalInvited - a.totalInvited)
    .slice(0, 10);

  // Top Driver Referrers (Drivers)
  const driverDriverMap = new Map<string, { driver: Driver; totalInvited: number; activeCount: number }>();
  drivers.forEach(d => {
    driverDriverMap.set(d.id, { driver: d, totalInvited: 0, activeCount: 0 });
  });

  validReferrals.filter(r => r.referrerType === 'driver' && r.referredType === 'driver').forEach(r => {
    const entry = driverDriverMap.get(r.referrerId);
    if (entry) {
      entry.totalInvited++;
      if (r.status === 'active') entry.activeCount++;
    }
  });

  const topDriverReferrersDrivers = Array.from(driverDriverMap.values())
    .map(e => ({
      driverId: e.driver.id,
      driverName: e.driver.fullName,
      avatarUrl: e.driver.avatarUrl,
      phone: e.driver.phone,
      vehicleType: e.driver.vehicleType,
      totalInvited: e.totalInvited,
      activeCount: e.activeCount,
      rewardsEarned: rewards.filter(rw => rw.userId === e.driver.id && rw.triggerMilestone.includes('Driver')).length
    }))
    .sort((a, b) => b.activeCount - a.activeCount || b.totalInvited - a.totalInvited)
    .slice(0, 10);

  // Top Passenger Referrers
  const passengerReferrerMap = new Map<string, { passengerId: string; passengerName: string; phone: string; totalInvited: number; activeCount: number }>();
  
  validReferrals.filter(r => r.referrerType === 'passenger').forEach(r => {
    let entry = passengerReferrerMap.get(r.referrerId);
    if (!entry) {
      entry = {
        passengerId: r.referrerId,
        passengerName: r.referrerName,
        phone: r.referredPhone,
        totalInvited: 0,
        activeCount: 0
      };
      passengerReferrerMap.set(r.referrerId, entry);
    }
    entry.totalInvited++;
    if (r.status === 'active') entry.activeCount++;
  });

  // Add a few realistic top passenger referrers if empty
  if (passengerReferrerMap.size < 3) {
    passengerReferrerMap.set('psg-901', {
      passengerId: 'psg-901',
      passengerName: 'Maria Rodriguez',
      phone: '+1 (718) 555-3921',
      totalInvited: 8,
      activeCount: 6
    });
    passengerReferrerMap.set('psg-902', {
      passengerId: 'psg-902',
      passengerName: 'David Chen',
      phone: '+1 (917) 555-8841',
      totalInvited: 5,
      activeCount: 4
    });
    passengerReferrerMap.set('psg-903', {
      passengerId: 'psg-903',
      passengerName: 'Sarah Goldstein',
      phone: '+1 (347) 555-1209',
      totalInvited: 4,
      activeCount: 3
    });
  }

  const topPassengerReferrers = Array.from(passengerReferrerMap.values())
    .map(p => ({
      passengerId: p.passengerId,
      passengerName: p.passengerName,
      phone: p.phone,
      totalInvited: p.totalInvited,
      activeCount: p.activeCount,
      freeTripsEarned: rewards.filter(rw => rw.userId === p.passengerId && rw.rewardType === 'free_trip').length || (p.activeCount >= 5 ? 1 : 0)
    }))
    .sort((a, b) => b.activeCount - a.activeCount)
    .slice(0, 10);

  // Organic vs Referral Growth by Week
  const organicVsReferralGrowth = [
    { week: 'W1 (Jul 01)', organicInstalls: 45, referralInstalls: 8, organicActive: 38, referralActive: 7 },
    { week: 'W2 (Jul 08)', organicInstalls: 52, referralInstalls: 14, organicActive: 44, referralActive: 12 },
    { week: 'W3 (Jul 15)', organicInstalls: 48, referralInstalls: 22, organicActive: 40, referralActive: 19 },
    { week: 'W4 (Jul 22)', organicInstalls: 60, referralInstalls: 35, organicActive: 51, referralActive: 31 },
    { week: 'W5 (Jul 29)', organicInstalls: 58, referralInstalls: 48, organicActive: 49, referralActive: 42 },
    { week: 'W6 (Aug 05)', organicInstalls: 65, referralInstalls: 62, organicActive: 56, referralActive: 55 },
    { week: 'W7 (Aug 12)', organicInstalls: 72, referralInstalls: 78, organicActive: 62, referralActive: 69 }
  ];

  const suspiciousReferrals = referrals.filter(r => r.isSuspicious);

  return {
    totalInvitationsSent,
    totalQrScans,
    totalInstalls,
    totalActiveUsers,
    conversionRateInstallToActivePct: Number(conversionRateInstallToActivePct.toFixed(1)),
    conversionRateInviteToActivePct: Number(conversionRateInviteToActivePct.toFixed(1)),
    activeDriverDiscountsCount,
    totalCommissionSavingsGranted,
    totalFreeTripsGranted,
    topDriverReferrersPassengers,
    topDriverReferrersDrivers,
    topPassengerReferrers,
    organicVsReferralGrowth,
    suspiciousReferrals
  };
}
