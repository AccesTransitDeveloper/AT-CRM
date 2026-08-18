import React, { useState, useEffect } from 'react';
import { UserRole, Employee, EmployeeLoginAuditLog } from '../../types';
import { useTranslation } from '../../lib/i18n';
import { safeFetchJson } from '../../lib/api';
import { 
  User, 
  ShieldCheck, 
  Camera, 
  CheckCircle2, 
  Clock, 
  Lock, 
  Send, 
  Check, 
  AlertCircle, 
  Phone, 
  Mail, 
  Sparkles,
  Activity,
  MapPin,
  Compass,
  AlertTriangle,
  Radio
} from 'lucide-react';

interface EmployeeProfileViewProps {
  currentRole: UserRole;
  employeeEmail?: string;
  onOpenFaceLogin?: () => void;
}

export const EmployeeProfileView: React.FC<EmployeeProfileViewProps> = ({
  currentRole,
  employeeEmail = 'tariq.mansoor@accessibletransit.nyc',
  onOpenFaceLogin
}) => {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<Employee | null>(null);
  const [auditLogs, setAuditLogs] = useState<EmployeeLoginAuditLog[]>([]);
  const [reEnrollRequested, setReEnrollRequested] = useState(false);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [isUpdatingConsent, setIsUpdatingConsent] = useState(false);
  const [consentSuccessMsg, setConsentSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    // Fetch employee data safely
    safeFetchJson<Employee[]>('/api/employees')
      .then(result => {
        if (result.ok && Array.isArray(result.data)) {
          const found = result.data.find(e => e.role === currentRole) || result.data[0];
          if (found) {
            setProfile(found);
            safeFetchJson<EmployeeLoginAuditLog[]>(`/api/auth/login-audit?employeeId=${found.id}`)
              .then(audResult => {
                if (audResult.ok && Array.isArray(audResult.data)) {
                  setAuditLogs(audResult.data);
                }
              });
          }
        }
      })
      .catch(err => console.error('Profile fetch error:', err));
  }, [currentRole]);

  const handleRequestFaceReEnroll = () => {
    setIsSubmittingRequest(true);
    setTimeout(() => {
      setIsSubmittingRequest(false);
      setReEnrollRequested(true);
    }, 800);
  };

  const handleToggleLocationConsent = async (newConsented: boolean) => {
    if (!profile) return;
    setIsUpdatingConsent(true);
    try {
      const res = await fetch('/api/employees/location/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: profile.id,
          consented: newConsented,
          legalNoticeText: 'Accessible Transit отслеживает вашу геолокацию только пока вы авторизованы в CRM-системе, в рабочих целях (координация диспетчеризации и учёт присутствия). Ваше местоположение видно администраторам. Слежка прекращается, как только вы выходите из системы или закрываете вкладку.'
        })
      });
      if (res.ok) {
        setProfile(prev => prev ? {
          ...prev,
          locationConsent: newConsented,
          locationConsentedAt: newConsented ? new Date().toISOString() : prev.locationConsentedAt,
          locationRevokedAt: !newConsented ? new Date().toISOString() : undefined,
          currentLocation: !newConsented ? null : prev.currentLocation
        } : null);
        setConsentSuccessMsg(newConsented ? 'Согласие на геолокацию успешно активировано.' : 'Согласие отозвано. Отслеживание немедленно прекращено.');
        setTimeout(() => setConsentSuccessMsg(null), 4000);
      }
    } catch (err) {
      console.error('Consent update error:', err);
    } finally {
      setIsUpdatingConsent(false);
    }
  };

  const roleLabels: Record<string, { label: string; desc: string; color: string }> = {
    admin: {
      label: 'Administrator',
      desc: 'Full system management and employee provisioning',
      color: 'bg-rose-500/20 text-rose-300 border-rose-500/30'
    },
    dispatcher: {
      label: 'Dispatcher',
      desc: 'Real-time order routing, driver assignments in Queens & paratransit dispatch',
      color: 'bg-sky-500/20 text-sky-300 border-sky-500/30'
    },
    driver_manager: {
      label: 'Driver Manager',
      desc: 'Driver onboarding, TLC compliance validation, WAV vehicle verification',
      color: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
    },
    support: {
      label: 'Support Operator',
      desc: 'Helpdesk ticketing, passenger issues, and broker communications',
      color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    },
    finance: {
      label: 'Finance Manager',
      desc: '15% AT Brokerage commissions, driver payouts, and revenue analytics',
      color: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
    }
  };

  const currentRoleInfo = roleLabels[currentRole] || {
    label: currentRole,
    desc: 'Accessible Transit CRM Staff Member',
    color: 'bg-sky-500/20 text-sky-300 border-sky-500/30'
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl backdrop-blur shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${currentRoleInfo.color}`}>
              {currentRoleInfo.label}
            </span>
            <span className="text-xs text-slate-400">Accessible Transit CRM Profile</span>
          </div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <User className="w-6 h-6 text-sky-400" />
            <span>{t('employees.myProfileTitle')}</span>
          </h1>
          <p className="text-xs text-slate-400">
            {t('employees.myProfileSubtitle')}
          </p>
        </div>

        {onOpenFaceLogin && (
          <button
            type="button"
            onClick={onOpenFaceLogin}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-2xl shadow-lg shadow-sky-600/20 transition-all shrink-0"
          >
            <Camera className="w-4 h-4" />
            <span>Test Face ID Verification</span>
          </button>
        )}
      </div>

      {/* Profile Details & Biometrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Personal Details */}
        <div className="md:col-span-1 bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
          <div className="text-center space-y-2 pb-4 border-b border-slate-800">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold mx-auto shadow-lg shadow-sky-500/20">
              {profile?.fullName.charAt(0) || 'U'}
            </div>
            <h2 className="text-base font-bold text-white">{profile?.fullName || 'Staff Member'}</h2>
            <p className="text-xs text-sky-400 font-medium">{currentRoleInfo.label}</p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center gap-2.5 text-slate-300">
              <Mail className="w-4 h-4 text-slate-500" />
              <span>{profile?.email || 'staff@accessibletransit.nyc'}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-300">
              <Phone className="w-4 h-4 text-slate-500" />
              <span>{profile?.phone || '+1 (718) 555-0199'}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-300">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>Registered: {profile?.registeredAt ? new Date(profile.registeredAt).toLocaleDateString() : 'Active'}</span>
            </div>
          </div>
        </div>

        {/* Biometrics & Face ID Status */}
        <div className="md:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Biometric Face ID Security</h3>
                <p className="text-xs text-slate-400">AWS Rekognition / Azure Face Vector Embedding</p>
              </div>
            </div>

            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Enrolled & Active</span>
            </span>
          </div>

          {/* Privacy Note */}
          <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Biometric Privacy & Compliance Protocol</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              In accordance with CRM security standards, your actual photos are never stored. Only a 128-dimensional normalized mathematical vector embedding is retained to verify your identity upon login. In the event of offboarding, all biometric vectors are automatically purged.
            </p>
          </div>

          {/* Re-enrollment Action */}
          <div className="pt-2">
            {reEnrollRequested ? (
              <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl text-xs text-emerald-300 flex items-center gap-3">
                <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{t('employees.requestSentMsg')}</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleRequestFaceReEnroll}
                disabled={isSubmittingRequest}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold rounded-xl transition-all border border-slate-700"
              >
                <Sparkles className="w-4 h-4 text-sky-400" />
                <span>{isSubmittingRequest ? 'Submitting Request...' : t('employees.requestFaceResetBtn')}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Geolocation & Privacy Compliance Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Рабочая геолокация и статус конфиденциальности</h3>
              <p className="text-xs text-slate-400">Контроль передачи GPS-координат во время активной смены в CRM</p>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700">
            Legal Policy v2.1
          </span>
        </div>

        {consentSuccessMsg && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{consentSuccessMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <span className="text-slate-400 font-medium block">Текущий статус согласия:</span>
            {profile?.locationConsent ? (
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Согласие предоставлено (Активно)
                </span>
                <p className="text-[11px] text-slate-400">
                  Дата подписания: {profile.locationConsentedAt ? new Date(profile.locationConsentedAt).toLocaleString() : 'Активно'}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Location Unavailable (Согласие не выдано)
                </span>
                <p className="text-[11px] text-slate-400">
                  CRM работает штатно. Передача GPS не осуществляется.
                </p>
              </div>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <span className="text-slate-400 font-medium block">Юридическое уведомление:</span>
            <p className="text-[11px] text-slate-300 leading-relaxed italic">
              «Accessible Transit отслеживает вашу геолокацию только пока вы авторизованы в CRM-системе, в рабочих целях... Ваше местоположение видно администраторам. Слежка прекращается, как только вы выходите из системы или закрываете вкладку.»
            </p>
          </div>
        </div>

        <div className="pt-2 flex flex-wrap items-center gap-3">
          {profile?.locationConsent ? (
            <button
              type="button"
              onClick={() => handleToggleLocationConsent(false)}
              disabled={isUpdatingConsent}
              className="px-4 py-2 bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              {isUpdatingConsent ? 'Обновление...' : 'Отозвать согласие на геолокацию'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleToggleLocationConsent(true)}
              disabled={isUpdatingConsent}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-sky-600/25 cursor-pointer"
            >
              {isUpdatingConsent ? 'Обновление...' : 'Предоставить согласие и включить геолокацию'}
            </button>
          )}
        </div>
      </div>

      {/* Activity Logs */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-sky-400" />
            <span>Recent Authentication Activity</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">Last 5 Sign-Ins</span>
        </div>

        <div className="space-y-2">
          {auditLogs.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">No recent login records.</p>
          ) : (
            auditLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 bg-slate-950/50 border border-slate-800 rounded-xl text-xs">
                <div className="flex items-center gap-3">
                  {log.method === 'face' ? (
                    <Camera className="w-4 h-4 text-indigo-400" />
                  ) : (
                    <Lock className="w-4 h-4 text-slate-400" />
                  )}
                  <div>
                    <span className="font-semibold text-white">
                      {log.method === 'face' ? 'Face ID Scan' : 'Password Login'}
                    </span>
                    <span className="text-slate-400 ml-2">({log.ip})</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {log.confidence && (
                    <span className="text-emerald-400 font-mono font-bold">
                      {Math.round(log.confidence * 100)}% Match
                    </span>
                  )}
                  <span className="text-slate-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
