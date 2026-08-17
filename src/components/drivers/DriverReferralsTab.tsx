import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Driver, 
  DriverReferralSummary, 
  ReferralRecord, 
  CommissionRateLog, 
  ReferralReward 
} from '../../types';
import { api } from '../../lib/api';
import { 
  QrCode, 
  Users, 
  UserCheck, 
  Sparkles, 
  Copy, 
  Check, 
  Download, 
  Printer, 
  Plus, 
  TrendingUp, 
  ShieldCheck, 
  Gift, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Percent, 
  ExternalLink,
  ChevronRight,
  Info,
  Car,
  UserPlus,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';

interface DriverReferralsTabProps {
  driver: Driver;
  onRefreshDriver?: () => void;
}

export const DriverReferralsTab: React.FC<DriverReferralsTabProps> = ({
  driver,
  onRefreshDriver
}) => {
  const [summary, setSummary] = useState<DriverReferralSummary | null>(null);
  const [commissionLogs, setCommissionLogs] = useState<CommissionRateLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedType, setCopiedType] = useState<'psg_url' | 'psg_code' | 'drv_url' | 'drv_code' | null>(null);
  
  // Table filters
  const [filterType, setFilterType] = useState<'all' | 'passenger' | 'driver'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'registered' | 'invited'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Add Test Referral Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addType, setAddType] = useState<'passenger' | 'driver'>('passenger');
  const [addStatus, setAddStatus] = useState<'invited' | 'registered' | 'active'>('active');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // SVG QR references for direct download
  const passengerQrRef = useRef<HTMLDivElement>(null);
  const driverQrRef = useRef<HTMLDivElement>(null);

  // Fetch driver summary and logs
  const fetchReferralData = async () => {
    setIsLoading(true);
    try {
      const [sumRes, logsRes] = await Promise.allSettled([
        api.getDriverReferrals(driver.id),
        api.getCommissionLogs(driver.id)
      ]);

      if (sumRes.status === 'fulfilled' && sumRes.value) {
        setSummary(sumRes.value);
      }
      if (logsRes.status === 'fulfilled' && Array.isArray(logsRes.value)) {
        setCommissionLogs(logsRes.value);
      }
    } catch (err) {
      console.error('Failed to load driver referral data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReferralData();
  }, [driver.id]);

  // Copy to clipboard helper
  const handleCopy = (text: string, type: 'psg_url' | 'psg_code' | 'drv_url' | 'drv_code') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  // Download QR code helper
  const downloadQrCode = (elementId: string, filename: string) => {
    const svgElement = document.getElementById(elementId);
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = 400;
      canvas.height = 400;
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 400, 400);
        ctx.drawImage(img, 20, 20, 360, 360);
      }
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `${filename}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  // Print Handout / Flyer Card
  const handlePrintHandout = (type: 'passenger' | 'driver') => {
    const isPsg = type === 'passenger';
    const code = isPsg ? summary?.passengerReferralCode : summary?.driverReferralCode;
    const url = isPsg ? summary?.passengerReferralUrl : summary?.driverReferralUrl;
    const title = isPsg ? 'Accessible Transit (AT) Rider Pass' : 'Accessible Transit Driver Referral';
    const perk = isPsg 
      ? 'Scan this QR code or use referral code for priority TLC WAV bookings & discounts in Queens!' 
      : 'Join Queens Accessible Transit TLC fleet with special 15% broker dispatch access!';

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>${title} - ${driver.fullName}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; text-align: center; color: #0f172a; }
            .card { max-width: 420px; margin: 0 auto; border: 2px solid #0284c7; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
            h1 { font-size: 24px; color: #0369a1; margin-bottom: 4px; }
            .badge { background: #e0f2fe; color: #0369a1; display: inline-block; padding: 4px 12px; border-radius: 20px; font-weight: bold; font-size: 12px; margin-bottom: 20px; }
            .qr-box { margin: 20px auto; width: 220px; height: 220px; }
            .code-box { background: #f1f5f9; padding: 12px; border-radius: 8px; font-size: 20px; font-weight: bold; letter-spacing: 2px; color: #0f172a; margin: 16px 0; }
            .driver-info { font-size: 14px; color: #64748b; margin-top: 16px; border-top: 1px solid #e2e8f0; padding-top: 12px; }
            .perk { font-size: 13px; color: #334155; line-height: 1.4; margin: 16px 0; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Accessible Transit LLC</h1>
            <div class="badge">Queens TLC & MTA Paratransit Network</div>
            <p class="perk">${perk}</p>
            <div class="code-box">${code}</div>
            <div class="driver-info">
              Invited by Driver: <strong>${driver.fullName}</strong><br/>
              TLC License: ${driver.tlcLicenseNumber} • Vehicle: ${driver.vehiclePlate}
            </div>
            <p style="font-size: 11px; color: #94a3b8; margin-top: 20px;">Download app at: ${url}</p>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Add test referral
  const handleAddReferralSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName || !addPhone) return;

    setIsSubmitting(true);
    try {
      const res = await api.createReferral({
        referrerId: driver.id,
        referredName: addName,
        referredPhone: addPhone,
        referredType: addType,
        status: addStatus
      });

      setActionNotice(`Успешно добавлено: ${addName} (${addStatus.toUpperCase()})!`);
      setTimeout(() => setActionNotice(null), 4000);

      // Reset form and reload
      setAddName('');
      setAddPhone('');
      setIsAddModalOpen(false);
      await fetchReferralData();
      if (onRefreshDriver) onRefreshDriver();
    } catch (err: any) {
      alert(`Ошибка при добавлении: ${err?.message || 'Не удалось создать'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Simulate 1st trip / activation
  const handleActivateReferral = async (referralId: string) => {
    try {
      const res = await api.activateReferral(referralId);
      if (res.milestoneReached) {
        setActionNotice(`🎉 Поздравляем! Достигнут порог наград! Комиссия снижена на 3% (15% -> 12%) на 30 дней.`);
      } else {
        setActionNotice(`Реферал активирован (поездка зачтена).`);
      }
      setTimeout(() => setActionNotice(null), 5000);
      await fetchReferralData();
      if (onRefreshDriver) onRefreshDriver();
    } catch (err) {
      console.error('Failed to activate referral:', err);
    }
  };

  if (isLoading && !summary) {
    return (
      <div className="p-12 text-center text-gray-500">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-3" />
        <p className="text-sm font-medium">Загрузка данных реферальной программы водителя...</p>
      </div>
    );
  }

  const passengerList = summary?.passengersList || [];
  const driverList = summary?.driversList || [];
  const allReferrals = [...passengerList, ...driverList];

  const filteredReferrals = allReferrals.filter(r => {
    if (filterType !== 'all' && r.referredType !== filterType) return false;
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return r.referredName.toLowerCase().includes(q) || r.referredPhone.includes(q) || r.referralCode.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-6">
      {/* NOTIFICATION BANNER */}
      {actionNotice && (
        <div className="bg-emerald-900/90 border border-emerald-500 text-emerald-100 p-4 rounded-xl flex items-center gap-3 shadow-lg animate-in slide-in-from-top-2">
          <Sparkles className="w-5 h-5 text-amber-300 shrink-0" />
          <span className="text-sm font-semibold">{actionNotice}</span>
        </div>
      )}

      {/* TOP SUMMARY BANNER: ACTIVE DISCOUNT & THRESHOLD STATUS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Active Commission Status */}
        <div className={`p-5 rounded-2xl border transition-all ${
          summary?.hasActiveDiscount 
            ? 'bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 border-emerald-500/50 shadow-lg shadow-emerald-950/30 text-white' 
            : 'bg-slate-900 border-slate-800 text-white'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Текущая ставка комиссии</span>
            {summary?.hasActiveDiscount ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                -3% Скидка активна
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                Базовая ставка
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl sm:text-4xl font-black text-white">
              {((summary?.currentCommissionRate || 0.15) * 100).toFixed(0)}%
            </span>
            <span className="text-xs text-slate-400">
              {summary?.hasActiveDiscount ? 'вместо стандартных 15%' : 'стандартная комиссия AT'}
            </span>
          </div>

          {summary?.hasActiveDiscount ? (
            <div className="text-xs text-emerald-300 flex items-center gap-1.5 bg-emerald-900/40 px-3 py-2 rounded-lg border border-emerald-800/60">
              <Clock className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span>Действует до <strong>{summary.commissionDiscountExpiryDate}</strong> (30-дневный период)</span>
            </div>
          ) : (
            <p className="text-xs text-slate-400 leading-relaxed">
              Пригласите <strong>10 активных пассажиров</strong> или <strong>5 активных водителей</strong> для получения <strong>скидки 3% на 30 дней</strong>.
            </p>
          )}
        </div>

        {/* Milestone 1: Invite Passengers (Goal 10) */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl text-white flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Порог: Пассажиры</span>
              </div>
              <span className="text-xs font-mono font-bold text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800">
                {summary?.activePassengersCount || 0} / {summary?.passengerMilestoneTarget || 10} активных
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-3">
              10 активных пассажиров (мин. 1 завершённая поездка) → Скидка 3% на 30 дней
            </p>

            {/* Progress Bar */}
            <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden mb-2 border border-slate-700">
              <div 
                className="bg-gradient-to-r from-sky-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${Math.min(100, (((summary?.activePassengersCount || 0) % (summary?.passengerMilestoneTarget || 10)) / (summary?.passengerMilestoneTarget || 10)) * 100 || (summary?.activePassengersCount && summary.activePassengersCount >= 10 ? 100 : 0))}%` 
                }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
            <span>Всего приглашено: <strong>{(summary?.invitedPassengersCount || 0) + (summary?.registeredPassengersCount || 0) + (summary?.activePassengersCount || 0)}</strong></span>
            <span className="text-emerald-400 font-semibold">
              {(summary?.passengerMilestoneTarget || 10) - ((summary?.activePassengersCount || 0) % (summary?.passengerMilestoneTarget || 10))} до награды
            </span>
          </div>
        </div>

        {/* Milestone 2: Invite Drivers (Goal 5) */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl text-white flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Порог: Водители</span>
              </div>
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                {summary?.activeDriversCount || 0} / {summary?.driverMilestoneTarget || 5} активных
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-3">
              5 активных водителей (прошли TLC-проверку + 1 рейс) → Скидка 3% на 30 дней
            </p>

            {/* Progress Bar */}
            <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden mb-2 border border-slate-700">
              <div 
                className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${Math.min(100, (((summary?.activeDriversCount || 0) % (summary?.driverMilestoneTarget || 5)) / (summary?.driverMilestoneTarget || 5)) * 100 || (summary?.activeDriversCount && summary.activeDriversCount >= 5 ? 100 : 0))}%` 
                }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
            <span>Всего коллег: <strong>{(summary?.invitedDriversCount || 0) + (summary?.registeredDriversCount || 0) + (summary?.activeDriversCount || 0)}</strong></span>
            <span className="text-amber-400 font-semibold">
              {(summary?.driverMilestoneTarget || 5) - ((summary?.activeDriversCount || 0) % (summary?.driverMilestoneTarget || 5))} до награды
            </span>
          </div>
        </div>
      </div>

      {/* DUAL QR CODES CARDS: PASSENGER QR & DRIVER QR */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CARD 1: PASSENGER REFERRAL QR CODE */}
        <div id="card-qr-passenger" className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200 mb-2">
                  <Users className="w-3.5 h-3.5" />
                  Для пассажиров
                </span>
                <h3 className="text-lg font-bold text-gray-900">QR-код приглашения пассажиров</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Водитель может распечатать и наклеить в салоне авто для сканирования пассажирами
                </p>
              </div>
            </div>

            {/* QR Code Container */}
            <div className="flex flex-col sm:flex-row items-center gap-6 my-4 p-4 bg-slate-50 rounded-xl border border-gray-200">
              <div 
                ref={passengerQrRef} 
                id="qr-passenger-box"
                className="bg-white p-3 rounded-xl shadow-xs border border-gray-200 shrink-0 flex items-center justify-center"
              >
                <QRCodeSVG
                  id="svg-qr-passenger"
                  value={summary?.passengerReferralUrl || `https://accessibletransit.com/ref/ATP-${driver.fullName.split(' ')[0].toUpperCase()}-${driver.id.replace(/\D/g, '')}`}
                  size={140}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <div className="space-y-2.5 w-full text-left">
                <div>
                  <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Реферальный промокод</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-base font-bold text-sky-800 bg-sky-100/80 px-3 py-1 rounded-lg border border-sky-200">
                      {summary?.passengerReferralCode || 'ATP-TARIQ-101'}
                    </span>
                    <button
                      onClick={() => handleCopy(summary?.passengerReferralCode || '', 'psg_code')}
                      className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
                      title="Копировать код"
                    >
                      {copiedType === 'psg_code' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Прямая ссылка</div>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      readOnly
                      value={summary?.passengerReferralUrl || ''}
                      className="w-full text-xs font-mono bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-gray-700 truncate select-all"
                    />
                    <button
                      onClick={() => handleCopy(summary?.passengerReferralUrl || '', 'psg_url')}
                      className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors shrink-0"
                      title="Копировать ссылку"
                    >
                      {copiedType === 'psg_url' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
            <button
              onClick={() => downloadQrCode('svg-qr-passenger', `AT_Passenger_QR_${driver.fullName.replace(/\s+/g, '_')}`)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-gray-100 text-gray-800 hover:bg-gray-200 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-gray-600" />
              Скачать PNG
            </button>
            <button
              onClick={() => handlePrintHandout('passenger')}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-sky-600 text-white hover:bg-sky-700 flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              Печать наклейки
            </button>
          </div>
        </div>

        {/* CARD 2: DRIVER REFERRAL QR CODE */}
        <div id="card-qr-driver" className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 mb-2">
                  <Car className="w-3.5 h-3.5" />
                  Для водителей TLC
                </span>
                <h3 className="text-lg font-bold text-gray-900">QR-код приглашения водителей</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Для приглашения коллег-водителей (TLC/WAV) в партнёрский пул Accessible Transit
                </p>
              </div>
            </div>

            {/* QR Code Container */}
            <div className="flex flex-col sm:flex-row items-center gap-6 my-4 p-4 bg-slate-50 rounded-xl border border-gray-200">
              <div 
                ref={driverQrRef} 
                id="qr-driver-box"
                className="bg-white p-3 rounded-xl shadow-xs border border-gray-200 shrink-0 flex items-center justify-center"
              >
                <QRCodeSVG
                  id="svg-qr-driver"
                  value={summary?.driverReferralUrl || `https://accessibletransit.com/ref/ATD-${driver.fullName.split(' ')[0].toUpperCase()}-${driver.id.replace(/\D/g, '')}`}
                  size={140}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <div className="space-y-2.5 w-full text-left">
                <div>
                  <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Реферальный код водителя</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-base font-bold text-amber-900 bg-amber-100/80 px-3 py-1 rounded-lg border border-amber-200">
                      {summary?.driverReferralCode || 'ATD-TARIQ-101'}
                    </span>
                    <button
                      onClick={() => handleCopy(summary?.driverReferralCode || '', 'drv_code')}
                      className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
                      title="Копировать код"
                    >
                      {copiedType === 'drv_code' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Прямая ссылка регистрации</div>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      readOnly
                      value={summary?.driverReferralUrl || ''}
                      className="w-full text-xs font-mono bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-gray-700 truncate select-all"
                    />
                    <button
                      onClick={() => handleCopy(summary?.driverReferralUrl || '', 'drv_url')}
                      className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors shrink-0"
                      title="Копировать ссылку"
                    >
                      {copiedType === 'drv_url' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
            <button
              onClick={() => downloadQrCode('svg-qr-driver', `AT_Driver_Invite_QR_${driver.fullName.replace(/\s+/g, '_')}`)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-gray-100 text-gray-800 hover:bg-gray-200 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-gray-600" />
              Скачать PNG
            </button>
            <button
              onClick={() => handlePrintHandout('driver')}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              Печать листовки
            </button>
          </div>
        </div>
      </div>

      {/* REFERRALS LIST & ACTIONS SECTION */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">Список приглашённых пользователей ({allReferrals.length})</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Статус <span className="text-emerald-600 font-semibold">Active</span> означает завершение 1-й поездки или утверждение документов водителя
            </p>
          </div>

          {/* Action to Add Simulated Referral */}
          <div className="flex items-center gap-2">
            <button
              id="btn-add-test-referral"
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              + Добавить реферала (Тест)
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Поиск по имени или телефону..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs w-56 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Type Filter */}
            <div className="flex items-center bg-white border border-gray-200 rounded-lg p-0.5 text-xs">
              <button
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded-md font-medium ${filterType === 'all' ? 'bg-slate-800 text-white' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Все ({allReferrals.length})
              </button>
              <button
                onClick={() => setFilterType('passenger')}
                className={`px-2.5 py-1 rounded-md font-medium ${filterType === 'passenger' ? 'bg-sky-600 text-white' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Пассажиры ({passengerList.length})
              </button>
              <button
                onClick={() => setFilterType('driver')}
                className={`px-2.5 py-1 rounded-md font-medium ${filterType === 'driver' ? 'bg-amber-600 text-white' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Водители ({driverList.length})
              </button>
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-gray-500 font-medium">Статус:</span>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as any)}
              className="bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-700"
            >
              <option value="all">Все статусы</option>
              <option value="active">Active (Зачтены в порог)</option>
              <option value="registered">Registered (Установили)</option>
              <option value="invited">Invited (Только QR)</option>
            </select>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-100/75 text-gray-600 font-semibold border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Приглашённый</th>
                <th className="py-3 px-4">Тип</th>
                <th className="py-3 px-4">Промокод / QR</th>
                <th className="py-3 px-4">Дата установки</th>
                <th className="py-3 px-4">Статус</th>
                <th className="py-3 px-4">Активация (1-й рейс)</th>
                <th className="py-3 px-4 text-right">Действие</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredReferrals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-400">
                    <Users className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                    <p>Нет рефералов по выбранным фильтрам</p>
                  </td>
                </tr>
              ) : (
                filteredReferrals.map(ref => {
                  const isActive = ref.status === 'active';
                  const isRegistered = ref.status === 'registered';

                  return (
                    <tr key={ref.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900">{ref.referredName}</div>
                        <div className="text-[11px] text-gray-500 font-mono">{ref.referredPhone}</div>
                        {ref.isSuspicious && (
                          <div className="text-[10px] text-rose-600 flex items-center gap-1 mt-0.5 font-medium">
                            <AlertTriangle className="w-3 h-3" />
                            {ref.suspiciousReason}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {ref.referredType === 'passenger' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-sky-100 text-sky-800">
                            <Users className="w-3 h-3" />
                            Пассажир
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-100 text-amber-800">
                            <Car className="w-3 h-3" />
                            Водитель TLC
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-gray-700">
                        {ref.referralCode}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600 font-mono">
                        {ref.dateInstalled ? new Date(ref.dateInstalled).toLocaleDateString('ru-RU') : '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Active
                          </span>
                        ) : isRegistered ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                            Registered
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                            Invited
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {isActive ? (
                          <div>
                            <div className="text-[11px] font-semibold text-emerald-700">
                              {ref.firstOrderId ? `Заказ #${ref.firstOrderId}` : 'Утверждён в системе'}
                            </div>
                            <div className="text-[10px] text-gray-500 font-mono">
                              {ref.dateActivated ? new Date(ref.dateActivated).toLocaleDateString('ru-RU') : ''}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Ожидает 1-й рейс</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {!isActive ? (
                          <button
                            id={`btn-activate-ref-${ref.id}`}
                            onClick={() => handleActivateReferral(ref.id)}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 ml-auto"
                            title="Зачесть 1-й заказ и пересчитать прогресс-бар"
                          >
                            <Sparkles className="w-3 h-3 text-emerald-600" />
                            Симулировать рейс
                          </button>
                        ) : (
                          <span className="text-emerald-600 text-[11px] font-semibold">✓ В зачёте</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* COMMISSION REWARDS & AUDIT LOGS */}
      {commissionLogs.length > 0 && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 text-white">
          <div className="flex items-center gap-2 mb-3">
            <Percent className="w-4 h-4 text-amber-400" />
            <h4 className="text-sm font-bold text-white">История изменений ставки комиссии водителя</h4>
          </div>

          <div className="space-y-2">
            {commissionLogs.map(log => (
              <div key={log.id} className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
                <div>
                  <div className="font-semibold text-slate-200">{log.reason}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Изменил: <strong>{log.changedBy}</strong> • {new Date(log.date).toLocaleString('ru-RU')}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 font-mono">
                  <span className="text-slate-400 line-through">{(log.previousRate * 100).toFixed(0)}%</span>
                  <span className="text-slate-400">→</span>
                  <span className={`font-bold px-2 py-0.5 rounded ${log.newRate < log.previousRate ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-slate-700 text-slate-200'}`}>
                    {(log.newRate * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADD TEST REFERRAL MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200 animate-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Ручное / Тестовое добавление реферала</h3>
            <p className="text-xs text-gray-500 mb-4">
              Добавьте тестового пассажира или водителя для проверки автоматического расчёта прогресс-бара и начисления скидки 3%.
            </p>

            <form onSubmit={handleAddReferralSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Имя и Фамилия</label>
                <input
                  type="text"
                  required
                  placeholder="например, Rustam Kasimdzhanov"
                  value={addName}
                  onChange={e => setAddName(e.target.value)}
                  className="w-full text-xs bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:bg-white focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Телефон</label>
                <input
                  type="tel"
                  required
                  placeholder="+1 (718) 555-1234"
                  value={addPhone}
                  onChange={e => setAddPhone(e.target.value)}
                  className="w-full text-xs bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:bg-white focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Тип реферала</label>
                  <select
                    value={addType}
                    onChange={e => setAddType(e.target.value as any)}
                    className="w-full text-xs bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                  >
                    <option value="passenger">Пассажир (Goal 10)</option>
                    <option value="driver">Водитель TLC (Goal 5)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Статус</label>
                  <select
                    value={addStatus}
                    onChange={e => setAddStatus(e.target.value as any)}
                    className="w-full text-xs bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                  >
                    <option value="active">Active (1-й заказ совершён)</option>
                    <option value="registered">Registered (Только App)</option>
                    <option value="invited">Invited (Только QR)</option>
                  </select>
                </div>
              </div>

              <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-xs text-sky-800">
                <div className="font-semibold mb-0.5">Автоматическая проверка антифрода:</div>
                <div className="text-[11px] text-sky-700">
                  Система сверяет номер телефона водителя ({driver.phone}) и предотвращает самоприглашение.
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Добавление...' : 'Добавить реферала'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
