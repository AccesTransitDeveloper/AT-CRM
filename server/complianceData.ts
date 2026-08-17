import { 
  ComplianceDocument, 
  ComplianceDocType, 
  ComplianceDocStatus, 
  ExpiryStatus, 
  ComplianceAuditLog, 
  DriverConsent, 
  FleetComplianceSummary,
  Driver
} from '../src/types';

// Relative date helper so the simulation always stays live and fresh
export function getRelativeDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function getRelativeIso(days: number, hours: number = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(d.getHours() + hours);
  return d.toISOString();
}

/**
 * Calculates current expiration status compared against today's date
 */
export function calculateExpiryStatus(expiryDate?: string): ExpiryStatus {
  if (!expiryDate) return 'no_expiry';
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const exp = new Date(expiryDate);
  exp.setHours(0, 0, 0, 0);
  
  const diffTime = exp.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'expired';
  if (diffDays <= 7) return 'expiring_7d';
  if (diffDays <= 30) return 'expiring_30d';
  return 'valid';
}

/**
 * Calculates human readable days difference
 */
export function getDaysRemainingText(expiryDate?: string): { days: number; text: string; status: ExpiryStatus } {
  if (!expiryDate) {
    return { days: 999, text: 'No Expiry Set', status: 'no_expiry' };
  }
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const exp = new Date(expiryDate);
  exp.setHours(0, 0, 0, 0);
  
  const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const status = calculateExpiryStatus(expiryDate);
  
  if (diffDays < 0) {
    return { days: diffDays, text: `Expired ${Math.abs(diffDays)}d ago`, status: 'expired' };
  } else if (diffDays === 0) {
    return { days: 0, text: 'Expires Today', status: 'expiring_7d' };
  } else if (diffDays <= 7) {
    return { days: diffDays, text: `Expires in ${diffDays}d`, status: 'expiring_7d' };
  } else if (diffDays <= 30) {
    return { days: diffDays, text: `Expires in ${diffDays}d`, status: 'expiring_30d' };
  } else {
    return { days: diffDays, text: `Valid (${diffDays}d left)`, status: 'valid' };
  }
}

// Sample realistic high-resolution document image templates (Unsplash document/vehicle previews)
const SAMPLE_DOCS = {
  tlcLicense: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1000&auto=format&fit=crop&q=80',
  driverLicense: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1000&auto=format&fit=crop&q=80',
  insurance: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=1000&auto=format&fit=crop&q=80',
  registration: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1000&auto=format&fit=crop&q=80',
  inspection: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1000&auto=format&fit=crop&q=80',
  wavCert: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=1000&auto=format&fit=crop&q=80',
  vehiclePhoto: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1000&auto=format&fit=crop&q=80'
};

export const initialComplianceDocuments: ComplianceDocument[] = [
  // ==========================================
  // DRIVER 101: Tariq Al-Mansoor (WAV Specialist - Full Compliance)
  // ==========================================
  {
    id: 'doc-101-1',
    driverId: 'drv-101',
    driverName: 'Tariq Al-Mansoor',
    docType: 'tlc_license',
    title: 'NYC TLC For-Hire Driver License',
    isMandatory: true,
    fileUrl: SAMPLE_DOCS.tlcLicense,
    fileName: 'TLC_Driver_License_Tariq_Mansoor_2026.pdf',
    fileSize: '1.4 MB',
    fileType: 'application/pdf',
    uploadedAt: getRelativeIso(-180),
    uploadedBy: 'driver',
    expiryDate: getRelativeDate(240),
    status: 'verified',
    verifiedBy: 'Sarah Jenkins (Compliance Mgr)',
    verifiedAt: getRelativeIso(-179),
    reviewerComment: 'Verified with NYC OpenData TLC active license database. Endorsements: WAV Paratransit Qualified.',
    version: 1,
    history: [],
    extractedData: {
      licenseNumber: 'TLC-5829104',
      expiryDate: getRelativeDate(240),
      fullName: 'Tariq Al-Mansoor',
      confidence: 0.98
    }
  },
  {
    id: 'doc-101-2',
    driverId: 'drv-101',
    driverName: 'Tariq Al-Mansoor',
    docType: 'driver_license',
    title: 'NYS DMV Class E Chauffeur Driver License',
    isMandatory: true,
    fileUrl: SAMPLE_DOCS.driverLicense,
    fileName: 'NYS_DMV_ClassE_Mansoor.jpg',
    fileSize: '2.8 MB',
    fileType: 'image/jpeg',
    uploadedAt: getRelativeIso(-180),
    uploadedBy: 'driver',
    expiryDate: getRelativeDate(420),
    status: 'verified',
    verifiedBy: 'Sarah Jenkins (Compliance Mgr)',
    verifiedAt: getRelativeIso(-179),
    version: 1,
    history: []
  },
  {
    id: 'doc-101-3',
    driverId: 'drv-101',
    driverName: 'Tariq Al-Mansoor',
    docType: 'insurance',
    title: 'FHV Commercial Auto Liability Insurance ($1.5M WAV)',
    isMandatory: true,
    fileUrl: SAMPLE_DOCS.insurance,
    fileName: 'AmericanTransit_FHV_Policy_2026.pdf',
    fileSize: '3.1 MB',
    fileType: 'application/pdf',
    uploadedAt: getRelativeIso(-90),
    uploadedBy: 'driver',
    expiryDate: getRelativeDate(180),
    status: 'verified',
    verifiedBy: 'Marcus Chen (Admin)',
    verifiedAt: getRelativeIso(-89),
    reviewerComment: 'American Transit Insurance Co. Policy active with Accessible Transit base endorsement.',
    version: 1,
    history: []
  },
  {
    id: 'doc-101-4',
    driverId: 'drv-101',
    driverName: 'Tariq Al-Mansoor',
    docType: 'registration',
    title: 'NYC TLC Commercial Vehicle Registration',
    isMandatory: true,
    fileUrl: SAMPLE_DOCS.registration,
    fileName: 'TLC_Vehicle_Reg_T789211C.jpg',
    fileSize: '1.9 MB',
    fileType: 'image/jpeg',
    uploadedAt: getRelativeIso(-120),
    uploadedBy: 'driver',
    expiryDate: getRelativeDate(310),
    status: 'verified',
    verifiedBy: 'Sarah Jenkins (Compliance Mgr)',
    verifiedAt: getRelativeIso(-119),
    version: 1,
    history: []
  },
  {
    id: 'doc-101-5',
    driverId: 'drv-101',
    driverName: 'Tariq Al-Mansoor',
    docType: 'inspection',
    title: 'NYC TLC Visual & Mechanical Inspection (Woodside Facility)',
    isMandatory: true,
    fileUrl: SAMPLE_DOCS.inspection,
    fileName: 'TLC_Inspection_Pass_Report_2026.pdf',
    fileSize: '1.1 MB',
    fileType: 'application/pdf',
    uploadedAt: getRelativeIso(-60),
    uploadedBy: 'driver',
    expiryDate: getRelativeDate(150),
    status: 'verified',
    verifiedBy: 'Sarah Jenkins (Compliance Mgr)',
    verifiedAt: getRelativeIso(-59),
    version: 1,
    history: []
  },
  {
    id: 'doc-101-6',
    driverId: 'drv-101',
    driverName: 'Tariq Al-Mansoor',
    docType: 'custom',
    title: 'BraunAbility Wheelchair Securement & ADA Ramp Certificate',
    isMandatory: false,
    fileUrl: SAMPLE_DOCS.wavCert,
    fileName: 'BraunAbility_ADA_Paratransit_Cert.pdf',
    fileSize: '890 KB',
    fileType: 'application/pdf',
    uploadedAt: getRelativeIso(-180),
    uploadedBy: 'driver',
    expiryDate: getRelativeDate(360),
    status: 'verified',
    verifiedBy: 'Sarah Jenkins (Compliance Mgr)',
    verifiedAt: getRelativeIso(-179),
    version: 1,
    history: []
  },

  // ==========================================
  // DRIVER 102: Gulnara Karimova (TLC License Expiring in 5 Days! Warning)
  // ==========================================
  {
    id: 'doc-102-1',
    driverId: 'drv-102',
    driverName: 'Gulnara Karimova',
    docType: 'tlc_license',
    title: 'NYC TLC For-Hire Driver License',
    isMandatory: true,
    fileUrl: SAMPLE_DOCS.tlcLicense,
    fileName: 'Gulnara_Karimova_TLC_2026.pdf',
    fileSize: '1.6 MB',
    fileType: 'application/pdf',
    uploadedAt: getRelativeIso(-350),
    uploadedBy: 'driver',
    expiryDate: getRelativeDate(5), // EXPIRES IN 5 DAYS!
    status: 'verified',
    verifiedBy: 'Sarah Jenkins (Compliance Mgr)',
    verifiedAt: getRelativeIso(-349),
    reviewerComment: 'URGENT: Renewal reminder sent via AT AI SMS. Driver scheduled appointment with TLC Queens office.',
    version: 1,
    history: [],
    extractedData: {
      licenseNumber: 'TLC-5912408',
      expiryDate: getRelativeDate(5),
      fullName: 'Gulnara Karimova',
      confidence: 0.99
    }
  },
  {
    id: 'doc-102-2',
    driverId: 'drv-102',
    driverName: 'Gulnara Karimova',
    docType: 'driver_license',
    title: 'NYS DMV Driver License',
    isMandatory: true,
    fileUrl: SAMPLE_DOCS.driverLicense,
    fileName: 'Gulnara_NYS_DMV.jpg',
    fileSize: '2.1 MB',
    fileType: 'image/jpeg',
    uploadedAt: getRelativeIso(-200),
    uploadedBy: 'driver',
    expiryDate: getRelativeDate(390),
    status: 'verified',
    verifiedBy: 'Sarah Jenkins (Compliance Mgr)',
    verifiedAt: getRelativeIso(-199),
    version: 1,
    history: []
  },
  {
    id: 'doc-102-3',
    driverId: 'drv-102',
    driverName: 'Gulnara Karimova',
    docType: 'insurance',
    title: 'Hereford Insurance FHV Commercial Policy',
    isMandatory: true,
    fileUrl: SAMPLE_DOCS.insurance,
    fileName: 'Hereford_Commercial_Ins_2026.pdf',
    fileSize: '2.4 MB',
    fileType: 'application/pdf',
    uploadedAt: getRelativeIso(-140),
    uploadedBy: 'driver',
    expiryDate: getRelativeDate(120),
    status: 'verified',
    verifiedBy: 'Sarah Jenkins (Compliance Mgr)',
    verifiedAt: getRelativeIso(-139),
    version: 1,
    history: []
  },
  {
    id: 'doc-102-4',
    driverId: 'drv-102',
    driverName: 'Gulnara Karimova',
    docType: 'registration',
    title: 'TLC Green Taxi Vehicle Registration',
    isMandatory: true,
    fileUrl: SAMPLE_DOCS.registration,
    fileName: 'TLC_Reg_T654129C.pdf',
    fileSize: '1.7 MB',
    fileType: 'application/pdf',
    uploadedAt: getRelativeIso(-95),
    uploadedBy: 'driver',
    expiryDate: getRelativeDate(270),
    status: 'verified',
    verifiedBy: 'Sarah Jenkins (Compliance Mgr)',
    verifiedAt: getRelativeIso(-94),
    version: 1,
    history: []
  },

  // ==========================================
  // DRIVER 103: Mateo Hernandez (Insurance Expiring in 22 Days)
  // ==========================================
  {
    id: 'doc-103-1',
    driverId: 'drv-103',
    driverName: 'Mateo Hernandez',
    docType: 'insurance',
    title: 'American Transit Black Car FHV Insurance',
    isMandatory: true,
    fileUrl: SAMPLE_DOCS.insurance,
    fileName: 'Mateo_AmericanTransit_Ins.pdf',
    fileSize: '2.9 MB',
    fileType: 'application/pdf',
    uploadedAt: getRelativeIso(-340),
    uploadedBy: 'driver',
    expiryDate: getRelativeDate(22), // EXPIRES IN 22 DAYS!
    status: 'verified',
    verifiedBy: 'Sarah Jenkins (Compliance Mgr)',
    verifiedAt: getRelativeIso(-339),
    reviewerComment: 'Automated 30-day renewal notice dispatched. Mateo notified to upload renewed policy binder.',
    version: 1,
    history: []
  },
  {
    id: 'doc-103-2',
    driverId: 'drv-103',
    driverName: 'Mateo Hernandez',
    docType: 'tlc_license',
    title: 'NYC TLC For-Hire Driver License',
    isMandatory: true,
    fileUrl: SAMPLE_DOCS.tlcLicense,
    fileName: 'Mateo_TLC_License_TLC5680194.pdf',
    fileSize: '1.8 MB',
    fileType: 'application/pdf',
    uploadedAt: getRelativeIso(-160),
    uploadedBy: 'driver',
    expiryDate: getRelativeDate(190),
    status: 'verified',
    verifiedBy: 'Marcus Chen (Admin)',
    verifiedAt: getRelativeIso(-159),
    version: 1,
    history: []
  },
  {
    id: 'doc-103-3',
    driverId: 'drv-103',
    driverName: 'Mateo Hernandez',
    docType: 'registration',
    title: 'TLC Black XL Vehicle Registration',
    isMandatory: true,
    fileUrl: SAMPLE_DOCS.registration,
    fileName: 'Mateo_Vehicle_Reg_T902144C.jpg',
    fileSize: '2.0 MB',
    fileType: 'image/jpeg',
    uploadedAt: getRelativeIso(-150),
    uploadedBy: 'driver',
    expiryDate: getRelativeDate(210),
    status: 'verified',
    verifiedBy: 'Sarah Jenkins (Compliance Mgr)',
    verifiedAt: getRelativeIso(-149),
    version: 1,
    history: []
  },

  // ==========================================
  // DRIVER 104: Chen Wei (TLC Inspection EXPIRED 8 Days Ago -> SAFETY LOCK / DISPATCH BLOCKED)
  // ==========================================
  {
    id: 'doc-104-1',
    driverId: 'drv-104',
    driverName: 'Chen Wei',
    docType: 'inspection',
    title: 'NYC TLC Annual Safety & Emissions Inspection',
    isMandatory: true,
    fileUrl: SAMPLE_DOCS.inspection,
    fileName: 'ChenWei_Expired_TLC_Inspection.pdf',
    fileSize: '1.3 MB',
    fileType: 'application/pdf',
    uploadedAt: getRelativeIso(-370),
    uploadedBy: 'driver',
    expiryDate: getRelativeDate(-8), // EXPIRED 8 DAYS AGO!
    status: 'verified',
    verifiedBy: 'Sarah Jenkins (Compliance Mgr)',
    verifiedAt: getRelativeIso(-369),
    reviewerComment: 'SAFETY ALERT: Inspection expired. Driver has been auto-locked from dispatch queue until new passing certificate is uploaded.',
    version: 1,
    history: []
  },
  {
    id: 'doc-104-2',
    driverId: 'drv-104',
    driverName: 'Chen Wei',
    docType: 'tlc_license',
    title: 'NYC TLC For-Hire Driver License',
    isMandatory: true,
    fileUrl: SAMPLE_DOCS.tlcLicense,
    fileName: 'Chen_TLC_License_TLC6031945.pdf',
    fileSize: '1.5 MB',
    fileType: 'application/pdf',
    uploadedAt: getRelativeIso(-120),
    uploadedBy: 'driver',
    expiryDate: getRelativeDate(110),
    status: 'verified',
    verifiedBy: 'Sarah Jenkins (Compliance Mgr)',
    verifiedAt: getRelativeIso(-119),
    version: 1,
    history: []
  },
  {
    id: 'doc-104-3',
    driverId: 'drv-104',
    driverName: 'Chen Wei',
    docType: 'insurance',
    title: 'FHV Commercial Liability Insurance',
    isMandatory: true,
    fileUrl: SAMPLE_DOCS.insurance,
    fileName: 'Chen_Insurance_Policy.pdf',
    fileSize: '2.5 MB',
    fileType: 'application/pdf',
    uploadedAt: getRelativeIso(-80),
    uploadedBy: 'driver',
    expiryDate: getRelativeDate(160),
    status: 'verified',
    verifiedBy: 'Sarah Jenkins (Compliance Mgr)',
    verifiedAt: getRelativeIso(-79),
    version: 1,
    history: []
  },
  {
    id: 'doc-104-4',
    driverId: 'drv-104',
    driverName: 'Chen Wei',
    docType: 'registration',
    title: 'TLC Vehicle Registration',
    isMandatory: true,
    fileUrl: SAMPLE_DOCS.registration,
    fileName: 'Chen_Reg_T443912C.jpg',
    fileSize: '1.8 MB',
    fileType: 'image/jpeg',
    uploadedAt: getRelativeIso(-90),
    uploadedBy: 'driver',
    expiryDate: getRelativeDate(200),
    status: 'verified',
    verifiedBy: 'Sarah Jenkins (Compliance Mgr)',
    verifiedAt: getRelativeIso(-89),
    version: 1,
    history: []
  },

  // ==========================================
  // DRIVER 105: Amara Okafor (New Onboarding via AT AI - All Documents Pending Review)
  // ==========================================
  {
    id: 'doc-105-1',
    driverId: 'drv-105',
    driverName: 'Amara Okafor',
    docType: 'tlc_license',
    title: 'NYC TLC For-Hire Driver License',
    isMandatory: true,
    fileUrl: SAMPLE_DOCS.tlcLicense,
    fileName: 'Amara_Okafor_TLC_Lic_Photo.jpg',
    fileSize: '3.4 MB',
    fileType: 'image/jpeg',
    uploadedAt: getRelativeIso(-2, -4),
    uploadedBy: 'at_ai',
    expiryDate: getRelativeDate(320),
    status: 'pending_review',
    version: 1,
    history: [],
    extractedData: {
      licenseNumber: 'TLC-6114892',
      expiryDate: getRelativeDate(320),
      fullName: 'Amara Okafor',
      confidence: 0.96
    }
  },
  {
    id: 'doc-105-2',
    driverId: 'drv-105',
    driverName: 'Amara Okafor',
    docType: 'insurance',
    title: 'FHV Commercial Auto Liability Certificate',
    isMandatory: true,
    fileUrl: SAMPLE_DOCS.insurance,
    fileName: 'Amara_Hereford_FHV_Policy.pdf',
    fileSize: '2.8 MB',
    fileType: 'application/pdf',
    uploadedAt: getRelativeIso(-2, -3),
    uploadedBy: 'at_ai',
    expiryDate: getRelativeDate(175),
    status: 'pending_review',
    version: 1,
    history: [],
    extractedData: {
      fullName: 'Amara Okafor',
      plateNumber: 'T329810C',
      expiryDate: getRelativeDate(175),
      confidence: 0.94
    }
  },
  {
    id: 'doc-105-3',
    driverId: 'drv-105',
    driverName: 'Amara Okafor',
    docType: 'driver_license',
    title: 'NYS DMV Class E Driver License',
    isMandatory: true,
    fileUrl: SAMPLE_DOCS.driverLicense,
    fileName: 'Amara_DMV_License_Front.jpg',
    fileSize: '2.9 MB',
    fileType: 'image/jpeg',
    uploadedAt: getRelativeIso(-2, -2),
    uploadedBy: 'at_ai',
    expiryDate: getRelativeDate(410),
    status: 'pending_review',
    version: 1,
    history: []
  },
  {
    id: 'doc-105-4',
    driverId: 'drv-105',
    driverName: 'Amara Okafor',
    docType: 'registration',
    title: 'NYC TLC Vehicle Registration (WAV BraunAbility)',
    isMandatory: true,
    fileUrl: SAMPLE_DOCS.registration,
    fileName: 'Amara_Registration_T329810C.jpg',
    fileSize: '2.2 MB',
    fileType: 'image/jpeg',
    uploadedAt: getRelativeIso(-2, -1),
    uploadedBy: 'at_ai',
    expiryDate: getRelativeDate(260),
    status: 'pending_review',
    version: 1,
    history: []
  },
  {
    id: 'doc-105-5',
    driverId: 'drv-105',
    driverName: 'Amara Okafor',
    docType: 'custom',
    title: 'MTA Paratransit Wheelchair Hydraulic Ramp Cert',
    isMandatory: false,
    fileUrl: SAMPLE_DOCS.wavCert,
    fileName: 'Amara_Wheelchair_Ramp_Diploma.pdf',
    fileSize: '1.2 MB',
    fileType: 'application/pdf',
    uploadedAt: getRelativeIso(-2),
    uploadedBy: 'at_ai',
    expiryDate: getRelativeDate(365),
    status: 'pending_review',
    version: 1,
    history: []
  },

  // ==========================================
  // DRIVER 106: Dmitry Volkov (Driver License V2 Resubmitted After V1 Rejection)
  // ==========================================
  {
    id: 'doc-106-1',
    driverId: 'drv-106',
    driverName: 'Dmitry Volkov',
    docType: 'driver_license',
    title: 'NYS DMV Driver License (Clean Resubmission)',
    isMandatory: true,
    fileUrl: SAMPLE_DOCS.driverLicense,
    fileName: 'Dmitry_Volkov_DMV_Resubmission_v2.jpg',
    fileSize: '3.6 MB',
    fileType: 'image/jpeg',
    uploadedAt: getRelativeIso(-1, 2),
    uploadedBy: 'driver',
    expiryDate: getRelativeDate(340),
    status: 'pending_review',
    version: 2,
    history: [
      {
        version: 1,
        fileUrl: SAMPLE_DOCS.driverLicense,
        fileName: 'Dmitry_DMV_Blurry_v1.jpg',
        uploadedAt: getRelativeIso(-5),
        uploadedBy: 'driver',
        expiryDate: getRelativeDate(340),
        status: 'rejected',
        verifiedBy: 'Sarah Jenkins (Compliance Mgr)',
        verifiedAt: getRelativeIso(-4),
        reviewerComment: 'Photo was blurry and text on expiration date was illegible. Driver requested to re-photograph in well-lit room.'
      }
    ]
  },
  {
    id: 'doc-106-2',
    driverId: 'drv-106',
    driverName: 'Dmitry Volkov',
    docType: 'tlc_license',
    title: 'NYC TLC For-Hire Driver License',
    isMandatory: true,
    fileUrl: SAMPLE_DOCS.tlcLicense,
    fileName: 'Dmitry_TLC_5778219.pdf',
    fileSize: '1.7 MB',
    fileType: 'application/pdf',
    uploadedAt: getRelativeIso(-5),
    uploadedBy: 'driver',
    expiryDate: getRelativeDate(190),
    status: 'pending_review',
    version: 1,
    history: []
  },
  {
    id: 'doc-106-3',
    driverId: 'drv-106',
    driverName: 'Dmitry Volkov',
    docType: 'insurance',
    title: 'FHV Commercial Auto Insurance',
    isMandatory: true,
    fileUrl: SAMPLE_DOCS.insurance,
    fileName: 'Dmitry_Insurance_Policy.pdf',
    fileSize: '2.1 MB',
    fileType: 'application/pdf',
    uploadedAt: getRelativeIso(-5),
    uploadedBy: 'driver',
    expiryDate: getRelativeDate(150),
    status: 'pending_review',
    version: 1,
    history: []
  },
  {
    id: 'doc-106-4',
    driverId: 'drv-106',
    driverName: 'Dmitry Volkov',
    docType: 'registration',
    title: 'TLC Vehicle Registration',
    isMandatory: true,
    fileUrl: SAMPLE_DOCS.registration,
    fileName: 'Dmitry_Reg_T118492C.jpg',
    fileSize: '1.9 MB',
    fileType: 'image/jpeg',
    uploadedAt: getRelativeIso(-5),
    uploadedBy: 'driver',
    expiryDate: getRelativeDate(290),
    status: 'pending_review',
    version: 1,
    history: []
  },

  // ==========================================
  // DRIVER 107: Fatima Zahra (Plus & WAV - Fully Verified)
  // ==========================================
  {
    id: 'doc-107-1',
    driverId: 'drv-107',
    driverName: 'Fatima Zahra',
    docType: 'tlc_license',
    title: 'NYC TLC For-Hire Driver License',
    isMandatory: true,
    fileUrl: SAMPLE_DOCS.tlcLicense,
    fileName: 'Fatima_TLC_License.pdf',
    fileSize: '1.6 MB',
    fileType: 'application/pdf',
    uploadedAt: getRelativeIso(-100),
    uploadedBy: 'driver',
    expiryDate: getRelativeDate(210),
    status: 'verified',
    verifiedBy: 'Sarah Jenkins (Compliance Mgr)',
    verifiedAt: getRelativeIso(-99),
    version: 1,
    history: []
  },
  {
    id: 'doc-107-2',
    driverId: 'drv-107',
    driverName: 'Fatima Zahra',
    docType: 'insurance',
    title: 'American Transit Commercial FHV Insurance',
    isMandatory: true,
    fileUrl: SAMPLE_DOCS.insurance,
    fileName: 'Fatima_Commercial_Insurance.pdf',
    fileSize: '2.4 MB',
    fileType: 'application/pdf',
    uploadedAt: getRelativeIso(-75),
    uploadedBy: 'driver',
    expiryDate: getRelativeDate(160),
    status: 'verified',
    verifiedBy: 'Sarah Jenkins (Compliance Mgr)',
    verifiedAt: getRelativeIso(-74),
    version: 1,
    history: []
  },
  {
    id: 'doc-107-3',
    driverId: 'drv-107',
    driverName: 'Fatima Zahra',
    docType: 'registration',
    title: 'TLC Vehicle Registration',
    isMandatory: true,
    fileUrl: SAMPLE_DOCS.registration,
    fileName: 'Fatima_Reg_T559812C.jpg',
    fileSize: '1.8 MB',
    fileType: 'image/jpeg',
    uploadedAt: getRelativeIso(-90),
    uploadedBy: 'driver',
    expiryDate: getRelativeDate(245),
    status: 'verified',
    verifiedBy: 'Sarah Jenkins (Compliance Mgr)',
    verifiedAt: getRelativeIso(-89),
    version: 1,
    history: []
  },

  // ==========================================
  // DRIVER 108: Luis Morales (Renewed Insurance with Version 1 History)
  // ==========================================
  {
    id: 'doc-108-1',
    driverId: 'drv-108',
    driverName: 'Luis Morales',
    docType: 'insurance',
    title: 'Hereford Insurance FHV Commercial Policy (Annual Renewal)',
    isMandatory: true,
    fileUrl: SAMPLE_DOCS.insurance,
    fileName: 'Luis_Hereford_Policy_2026_2027.pdf',
    fileSize: '3.0 MB',
    fileType: 'application/pdf',
    uploadedAt: getRelativeIso(-15),
    uploadedBy: 'driver',
    expiryDate: getRelativeDate(350),
    status: 'verified',
    verifiedBy: 'Sarah Jenkins (Compliance Mgr)',
    verifiedAt: getRelativeIso(-14),
    reviewerComment: 'Annual policy renewal confirmed active with Hereford underwriters.',
    version: 2,
    history: [
      {
        version: 1,
        fileUrl: SAMPLE_DOCS.insurance,
        fileName: 'Luis_Hereford_Policy_2025_2026.pdf',
        uploadedAt: getRelativeIso(-380),
        uploadedBy: 'driver',
        expiryDate: getRelativeDate(-15),
        status: 'verified',
        verifiedBy: 'Sarah Jenkins (Compliance Mgr)',
        verifiedAt: getRelativeIso(-379),
        reviewerComment: 'Previous policy term expired and successfully superseded by v2.'
      }
    ]
  },
  {
    id: 'doc-108-2',
    driverId: 'drv-108',
    driverName: 'Luis Morales',
    docType: 'tlc_license',
    title: 'NYC TLC For-Hire Driver License',
    isMandatory: true,
    fileUrl: SAMPLE_DOCS.tlcLicense,
    fileName: 'Luis_TLC_License.pdf',
    fileSize: '1.4 MB',
    fileType: 'application/pdf',
    uploadedAt: getRelativeIso(-120),
    uploadedBy: 'driver',
    expiryDate: getRelativeDate(180),
    status: 'verified',
    verifiedBy: 'Sarah Jenkins (Compliance Mgr)',
    verifiedAt: getRelativeIso(-119),
    version: 1,
    history: []
  }
];

export const initialComplianceAuditLogs: ComplianceAuditLog[] = [
  {
    id: 'aud-001',
    driverId: 'drv-105',
    driverName: 'Amara Okafor',
    documentId: 'doc-105-1',
    docTitle: 'NYC TLC For-Hire Driver License',
    action: 'upload',
    performedBy: 'AT AI Voice Agent',
    role: 'system',
    timestamp: getRelativeIso(-2, -4),
    details: 'Document received via AT AI WhatsApp driver onboarding session. Auto-ingested with 96% OCR confidence score.',
    ipOrChannel: 'AT-AI-VOICE-DISPATCH'
  },
  {
    id: 'aud-002',
    driverId: 'drv-105',
    driverName: 'Amara Okafor',
    action: 'consent_given',
    performedBy: 'Amara Okafor',
    role: 'driver',
    timestamp: getRelativeIso(-2, -4),
    details: 'Driver accepted electronic TLC Data Processing & Background Screening Consent terms (v2026.1).',
    ipOrChannel: '68.194.211.89 (Queens, NY)'
  },
  {
    id: 'aud-003',
    driverId: 'drv-106',
    driverName: 'Dmitry Volkov',
    documentId: 'doc-106-1',
    docTitle: 'NYS DMV Driver License',
    action: 'reject',
    performedBy: 'Sarah Jenkins',
    role: 'driver_manager',
    timestamp: getRelativeIso(-4),
    details: 'Rejected version 1: Photo was blurry and text on expiration date was illegible. Automatic SMS notification dispatched to driver.',
    ipOrChannel: 'CRM Web Portal'
  },
  {
    id: 'aud-004',
    driverId: 'drv-106',
    driverName: 'Dmitry Volkov',
    documentId: 'doc-106-1',
    docTitle: 'NYS DMV Driver License (Clean Resubmission)',
    action: 'reupload',
    performedBy: 'Dmitry Volkov',
    role: 'driver',
    timestamp: getRelativeIso(-1, 2),
    details: 'Uploaded version 2 replacement image via Driver Portal. Placed in priority verification queue.',
    ipOrChannel: '72.229.18.102 (Woodside, NY)'
  },
  {
    id: 'aud-005',
    driverId: 'drv-104',
    driverName: 'Chen Wei',
    documentId: 'doc-104-1',
    docTitle: 'NYC TLC Annual Safety & Emissions Inspection',
    action: 'expired_auto_lock',
    performedBy: 'Accessible Transit Compliance Engine',
    role: 'system',
    timestamp: getRelativeIso(-8),
    details: 'SAFETY LOCK ACTIVATED: Mandatory TLC Inspection expired on ' + getRelativeDate(-8) + '. Driver dispatch access automatically suspended until new passing cert is verified.',
    ipOrChannel: 'System Daemon'
  },
  {
    id: 'aud-006',
    driverId: 'drv-102',
    driverName: 'Gulnara Karimova',
    documentId: 'doc-102-1',
    docTitle: 'NYC TLC For-Hire Driver License',
    action: 'reminder_sent',
    performedBy: 'AT AI Automated Reminder',
    role: 'system',
    timestamp: getRelativeIso(-2),
    details: 'Automated 7-day urgent renewal reminder sent to +1 (347) 555-8832 via SMS & AT AI Push. TLC appointment confirmed.',
    ipOrChannel: 'Twilio SMS Gateway'
  },
  {
    id: 'aud-007',
    driverId: 'drv-108',
    driverName: 'Luis Morales',
    documentId: 'doc-108-1',
    docTitle: 'Hereford Insurance FHV Commercial Policy (Annual Renewal)',
    action: 'verify',
    performedBy: 'Sarah Jenkins',
    role: 'driver_manager',
    timestamp: getRelativeIso(-14),
    details: 'Verified version 2 renewal with Hereford underwriting database. Policy active through ' + getRelativeDate(350) + '.',
    ipOrChannel: 'CRM Web Portal'
  }
];

export const initialDriverConsents: DriverConsent[] = [
  { driverId: 'drv-101', consentGiven: true, consentDate: getRelativeIso(-180), consentVersion: 'v2026.1', ipAddress: '74.108.45.12' },
  { driverId: 'drv-102', consentGiven: true, consentDate: getRelativeIso(-350), consentVersion: 'v2026.1', ipAddress: '69.115.82.91' },
  { driverId: 'drv-103', consentGiven: true, consentDate: getRelativeIso(-340), consentVersion: 'v2026.1', ipAddress: '108.35.19.44' },
  { driverId: 'drv-104', consentGiven: true, consentDate: getRelativeIso(-370), consentVersion: 'v2026.1', ipAddress: '67.245.112.5' },
  { driverId: 'drv-105', consentGiven: true, consentDate: getRelativeIso(-2), consentVersion: 'v2026.1', ipAddress: '68.194.211.89' },
  { driverId: 'drv-106', consentGiven: true, consentDate: getRelativeIso(-5), consentVersion: 'v2026.1', ipAddress: '72.229.18.102' },
  { driverId: 'drv-107', consentGiven: true, consentDate: getRelativeIso(-100), consentVersion: 'v2026.1', ipAddress: '173.56.24.81' },
  { driverId: 'drv-108', consentGiven: true, consentDate: getRelativeIso(-380), consentVersion: 'v2026.1', ipAddress: '64.12.190.22' }
];
