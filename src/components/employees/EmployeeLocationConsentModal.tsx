import React, { useState } from 'react';
import { 
  ShieldCheck, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  Lock, 
  Eye, 
  Clock, 
  Info,
  Check
} from 'lucide-react';
import { UserRole } from '../../types';

interface EmployeeLocationConsentModalProps {
  isOpen: boolean;
  employeeName: string;
  employeeRole: UserRole;
  employeeId: string;
  onConsent: () => void;
  onDecline: () => void;
}

export const EmployeeLocationConsentModal: React.FC<EmployeeLocationConsentModalProps> = ({
  isOpen,
  employeeName,
  employeeRole,
  employeeId,
  onConsent,
  onDecline
}) => {
  const [isAgreed, setIsAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAccept = async () => {
    if (!isAgreed) return;
    setIsSubmitting(true);
    try {
      await fetch('/api/employees/location/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId,
          consented: true,
          legalNoticeText: 'Accessible Transit отслеживает вашу геолокацию только пока вы авторизованы в CRM-системе, в рабочих целях (координация диспетчеризации и учёт присутствия). Ваше местоположение видно администраторам. Слежка прекращается, как только вы выходите из системы или закрываете вкладку.'
        })
      });
      onConsent();
    } catch (err) {
      console.error('Consent save error:', err);
      onConsent();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDecline = async () => {
    setIsSubmitting(true);
    try {
      await fetch('/api/employees/location/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId,
          consented: false
        })
      });
      onDecline();
    } catch (err) {
      console.error('Decline save error:', err);
      onDecline();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-sky-950/50 via-indigo-950/40 to-slate-900 border-b border-slate-800 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0 shadow-inner">
            <MapPin className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                Рабочая геолокация CRM
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-400 border border-slate-700">
                Compliance v2.1
              </span>
            </div>
            <h3 className="text-xl font-bold text-white mt-1">
              Уведомление и согласие на отслеживание геолокации
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Сотрудник: <strong className="text-slate-200">{employeeName}</strong> ({employeeRole.toUpperCase()})
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[65vh]">
          {/* Main Legal Notice Box */}
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-slate-200 leading-relaxed text-sm shadow-inner">
            <p className="font-medium text-slate-100">
              «Accessible Transit отслеживает вашу геолокацию только пока вы авторизованы в CRM-системе, в рабочих целях (координация диспетчеризации и учёт присутствия). Ваше местоположение видно администраторам. Слежка прекращается, как только вы выходите из системы или закрываете вкладку.»
            </p>
          </div>

          {/* Key Compliance Points */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-200 block">Только активная сессия</span>
                <span className="text-slate-400 leading-tight block mt-0.5">
                  Координаты передаются только при открытой вкладке CRM. При выходе или закрытии вкладки трекинг мгновенно останавливается.
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-2.5">
              <Eye className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-200 block">Доступ только у Admin</span>
                <span className="text-slate-400 leading-tight block mt-0.5">
                  Карта Live Map доступна исключительно Administrator. Другие роли (включая диспетчеров) не имеют доступа к вашим координатам.
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-200 block">Без постоянной истории</span>
                <span className="text-slate-400 leading-tight block mt-0.5">
                  Перезаписывается только текущая точка присутствия. Долгая история перемещений вне смены не накапливается.
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-200 block">Право на отзыв</span>
                <span className="text-slate-400 leading-tight block mt-0.5">
                  Вы можете отозвать согласие в любой момент в личном профиле сотрудника.
                </span>
              </div>
            </div>
          </div>

          {/* Mandatory Checkbox */}
          <div className="p-4 rounded-2xl bg-sky-950/30 border border-sky-800/50 hover:border-sky-500/50 transition-colors">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                id="employee-location-consent-checkbox"
                checked={isAgreed}
                onChange={(e) => setIsAgreed(e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-slate-600 bg-slate-800 text-sky-500 focus:ring-sky-500 focus:ring-offset-slate-900 cursor-pointer accent-sky-500"
              />
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-white block">
                  Я ознакомлен и согласен
                </span>
                <span className="text-xs text-slate-400 block">
                  Подтверждаю согласие на передачу рабочих координат во время активной сессии в CRM Accessible Transit.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 bg-slate-950/60 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            id="btn-decline-location"
            onClick={handleDecline}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-xs font-medium"
          >
            Отклонить (Работать без геолокации)
          </button>

          <button
            type="button"
            id="btn-accept-location-consent"
            onClick={handleAccept}
            disabled={!isAgreed || isSubmitting}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all ${
              isAgreed && !isSubmitting
                ? 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-sky-500/25 cursor-pointer hover:scale-[1.02]'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Сохранение согласия...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Подтвердить и разрешить
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
