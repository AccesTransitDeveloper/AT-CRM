import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Check, 
  Copy, 
  Download, 
  Star, 
  ShieldCheck, 
  Car, 
  Users, 
  Sparkles, 
  Smartphone, 
  ArrowRight, 
  HeartHandshake, 
  MapPin, 
  Clock, 
  PhoneCall, 
  CheckCircle2, 
  ExternalLink,
  ChevronLeft,
  Share2,
  Award,
  BadgeCheck,
  Shield,
  Zap,
  DollarSign
} from 'lucide-react';
import { ReferralShareModal } from './ReferralShareModal';

interface ReferralLandingPageProps {
  code?: string;
  onBackToCrm?: () => void;
}

interface ReferralLookupData {
  code: string;
  referrerName: string;
  referrerRole: 'driver' | 'passenger';
  referrerAvatarUrl?: string;
  vehicleMakeModel?: string;
  vehiclePlate?: string;
  tlcLicenseNumber?: string;
  driverRating?: number;
  totalTrips?: number;
  codeType: 'passenger' | 'driver';
  discountAmount: string;
  commissionRate: string;
  heroHeadline: string;
  heroSubtitle: string;
  valid: boolean;
}

export const ReferralLandingPage: React.FC<ReferralLandingPageProps> = ({
  code = 'ATP-TARIQ-101',
  onBackToCrm
}) => {
  const [currentCode, setCurrentCode] = useState(code);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  
  // Interactive Claim / Quick Signup Form State
  const [claimPhone, setClaimPhone] = useState('');
  const [claimName, setClaimName] = useState('');
  const [claimSubmitted, setClaimSubmitted] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);

  // Determine audience type from code (ATP = passenger, ATD = driver)
  const isDriverCode = currentCode.toUpperCase().startsWith('ATD');
  const [viewMode, setViewMode] = useState<'passenger' | 'driver'>(isDriverCode ? 'driver' : 'passenger');

  useEffect(() => {
    if (currentCode.toUpperCase().startsWith('ATD')) {
      setViewMode('driver');
    } else {
      setViewMode('passenger');
    }
  }, [currentCode]);

  // Inviter metadata
  const inviter = {
    name: 'Tariq Al-Mansoor',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    tlcLicense: 'TLC-4992104',
    vehicle: 'Toyota Sienna WAV (Рампа)',
    plate: 'T789211C',
    rating: 4.98,
    trips: 1420,
    borough: 'Queens, NYC (Jackson Heights / Jamaica)'
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  const handleDownloadApp = (platform: 'ios' | 'android') => {
    // Auto-copy promo code to clipboard when downloading app as requested
    navigator.clipboard.writeText(currentCode);
    setCopiedCode(true);
    
    // Simulate opening store
    const storeUrl = platform === 'ios' 
      ? 'https://apps.apple.com/app/accessible-transit-client/id1690000000'
      : 'https://play.google.com/store/apps/details?id=com.accessibletransit.client';
    
    // Open in new tab or show confirmation
    window.open(storeUrl, '_blank');
  };

  const handleClaimSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimPhone) return;
    setClaimLoading(true);
    setTimeout(() => {
      setClaimLoading(false);
      setClaimSubmitted(true);
    }, 600);
  };

  const fullUrl = `https://accessibletransit.com/ref/${currentCode}`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-sky-500 selection:text-white flex flex-col">
      
      {/* TOP CRM NAVIGATION BAR (TESTING & PREVIEW CONTROLS) */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-3">
          {onBackToCrm && (
            <button
              onClick={onBackToCrm}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 font-bold rounded-lg flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Вернуться в CRM</span>
            </button>
          )}
          <span className="text-slate-400 font-mono hidden sm:inline">
            URL: <strong className="text-slate-200">accessibletransit.com/ref/{currentCode}</strong>
          </span>
        </div>

        {/* Quick Switch between Passenger and Driver Landing */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-[11px] hidden md:inline">Режим превью:</span>
          <button
            onClick={() => {
              setCurrentCode('ATP-TARIQ-101');
              setViewMode('passenger');
            }}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
              viewMode === 'passenger' 
                ? 'bg-sky-600 text-white shadow-xs' 
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Пассажирский ($10 скидка)
          </button>
          <button
            onClick={() => {
              setCurrentCode('ATD-TARIQ-101');
              setViewMode('driver');
            }}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
              viewMode === 'driver' 
                ? 'bg-amber-600 text-white shadow-xs' 
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Водительский (15% комиссия)
          </button>

          <button
            onClick={() => setIsShareModalOpen(true)}
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-md flex items-center gap-1.5 transition-colors text-xs ml-1"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Поделиться</span>
          </button>
        </div>
      </div>

      {/* COPIED TOAST POPUP */}
      {copiedCode && (
        <div className="fixed top-14 right-4 z-50 animate-in fade-in slide-in-from-top-2">
          <div className="bg-emerald-950 text-emerald-200 border border-emerald-600 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Промокод {currentCode} скопирован в буфер обмена!</span>
          </div>
        </div>
      )}

      {/* PUBLIC HEADER */}
      <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 to-emerald-500 text-white flex items-center justify-center font-black text-xl shadow-md border border-sky-400/40">
              AT
            </div>
            <div>
              <div className="text-base font-black text-white tracking-tight flex items-center gap-2">
                ACCESSIBLE TRANSIT
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  NYC TLC Base #B03411
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Инклюзивное такси и Paratransit сервис • Квинс, Нью-Йорк
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">Поделиться ссылкой</span>
            </button>
            <a
              href="#download"
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-950/50 flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Скачать приложение</span>
            </a>
          </div>
        </div>
      </header>

      {/* HERO SECTION WITH PERSONALIZED INVITATION */}
      <section className="relative overflow-hidden pt-10 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950">
        
        {/* Decorative Background Accents */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(14,165,233,0.18),rgba(255,255,255,0))]" />
        
        <div className="max-w-6xl mx-auto relative z-10">
          
          {/* INVITER PERSONA BADGE */}
          <div className="inline-flex items-center gap-3 p-1.5 pr-4 rounded-full bg-slate-900/90 border border-slate-700 shadow-xl mb-6 backdrop-blur-md">
            <img
              src={inviter.avatarUrl}
              alt={inviter.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-sky-400"
            />
            <div className="text-left text-xs">
              <div className="font-bold text-white flex items-center gap-1.5">
                <span>{inviter.name}</span>
                <BadgeCheck className="w-4 h-4 text-sky-400" />
                <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-0.5">
                  <Star className="w-3 h-3 fill-amber-400" />
                  {inviter.rating}
                </span>
              </div>
              <div className="text-[10px] text-slate-400">
                {inviter.vehicle} • {inviter.plate} • {inviter.trips}+ поездок
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* HERO LEFT: COPY & PROMO CODE & DOWNLOAD BUTTONS (7 COLS) */}
            <div className="lg:col-span-7 text-left space-y-6">
              
              {/* Dynamic Headline depending on Passenger vs Driver */}
              {viewMode === 'passenger' ? (
                <>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Персональный промокод на первую поездку</span>
                  </div>

                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-300">
                      {inviter.name}
                    </span>{' '}
                    приглашает тебя в Accessible Transit
                  </h1>

                  <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
                    Получи <strong className="text-emerald-400 font-bold">скидку $10</strong> на первую поездку на комфортном инклюзивном такси Accessible Transit по всему Квинсу и Нью-Йорку.
                  </p>
                </>
              ) : (
                <>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    <Car className="w-3.5 h-3.5 text-amber-400" />
                    <span>Приглашение для водителей TLC & WAV</span>
                  </div>

                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-emerald-300">
                      {inviter.name}
                    </span>{' '}
                    приглашает тебя в команду водителей Accessible Transit
                  </h1>

                  <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
                    Присоединяйся к команде водителей Accessible Transit — <strong className="text-amber-400 font-bold">гарантированная низкая комиссия 15%</strong> (против 25-30% у Uber/Lyft) и постоянный поток заказов от MTA Paratransit и госпиталей.
                  </p>
                </>
              )}

              {/* PROMO CODE CONTAINER WITH COPY BUTTON */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700 shadow-xl space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" />
                    Твой персональный промокод
                  </span>
                  <span className="text-[11px] text-emerald-400 font-medium">
                    {viewMode === 'passenger' ? 'Даёт скидку $10' : 'Даёт бонус партнёра'}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="w-full sm:w-auto flex-1 bg-slate-950 border border-slate-600 rounded-xl px-4 py-3 font-mono text-xl sm:text-2xl font-black text-sky-300 tracking-wider text-center sm:text-left shadow-inner">
                    {currentCode}
                  </div>

                  <button
                    onClick={handleCopyCode}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all border border-slate-600 shadow-md shrink-0 active:scale-95"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400">Скопировано!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-sky-400" />
                        <span>Скопировать промокод</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Промокод автоматически копируется при нажатии на кнопки «Скачать» ниже</span>
                </div>
              </div>

              {/* STORE DOWNLOAD BUTTONS */}
              <div id="download" className="space-y-3 pt-2">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Скачать официальное приложение:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* iOS App Store */}
                  <button
                    onClick={() => handleDownloadApp('ios')}
                    className="p-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-950 font-bold transition-all shadow-xl hover:scale-[1.02] active:scale-98 flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3 text-left">
                      <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-600 uppercase font-semibold">Загрузите в</div>
                        <div className="text-sm font-black text-slate-900">App Store (iOS)</div>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-700 group-hover:translate-x-1 transition-transform" />
                  </button>

                  {/* Android Google Play */}
                  <button
                    onClick={() => handleDownloadApp('android')}
                    className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all border border-slate-700 shadow-xl hover:scale-[1.02] active:scale-98 flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3 text-left">
                      <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Доступно в</div>
                        <div className="text-sm font-black text-white">Google Play (Android)</div>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>

            </div>

            {/* HERO RIGHT: QR CODE CARD + INTERACTIVE SIMULATOR (5 COLS) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* DESKTOP-TO-MOBILE QR CODE CARD */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6 rounded-3xl border border-slate-700/80 shadow-2xl text-center space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Сканируйте с экрана смартфона</span>
                </div>

                {/* QR Box */}
                <div className="bg-white p-4 rounded-2xl shadow-xl border border-slate-300 inline-block">
                  <QRCodeSVG
                    id="landing-page-qr"
                    value={fullUrl}
                    size={180}
                    level="H"
                    includeMargin={true}
                  />
                </div>

                <div>
                  <div className="text-sm font-bold text-white">
                    Мгновенный переход в приложение
                  </div>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                    Наведите камеру смартфона на QR-код для автоматической активации скидки и перехода в App Store / Google Play
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span className="font-mono text-sky-400">{currentCode}</span>
                  <button
                    onClick={() => setIsShareModalOpen(true)}
                    className="text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Поделиться</span>
                  </button>
                </div>
              </div>

              {/* QUICK CLAIM / BOOKING SIMULATOR FORM */}
              <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-lg text-left">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    {viewMode === 'passenger' ? 'Активировать промокод по номеру' : 'Быстрая заявка в парк'}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold">Без ожидания</span>
                </div>

                {claimSubmitted ? (
                  <div className="p-4 bg-emerald-950/70 border border-emerald-600 rounded-xl text-center space-y-2 animate-in fade-in">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                    <div className="text-sm font-bold text-white">
                      {viewMode === 'passenger' ? 'Скидка $10 успешно зарезервирована!' : 'Заявка успешно принята!'}
                    </div>
                    <p className="text-xs text-emerald-200">
                      Мы отправили SMS с подтверждением на номер {claimPhone}. Скачайте приложение для первой поездки.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleClaimSubmit} className="space-y-3">
                    <div>
                      <input
                        type="text"
                        placeholder="Ваше имя"
                        value={claimName}
                        onChange={(e) => setClaimName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-sky-500 outline-hidden"
                      />
                    </div>
                    <div>
                      <input
                        type="tel"
                        required
                        placeholder="+1 (718) 555-0199 (Телефон)"
                        value={claimPhone}
                        onChange={(e) => setClaimPhone(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-sky-500 outline-hidden font-mono"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={claimLoading}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
                    >
                      {claimLoading ? (
                        <span>Активация...</span>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          <span>{viewMode === 'passenger' ? 'Зарезервировать скидку $10' : 'Отправить заявку водителя'}</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* WHY ACCESSIBLE TRANSIT (VALUE PROPOSITIONS) */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-900 border-t border-slate-800">
        <div className="max-w-6xl mx-auto text-center space-y-12">
          
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30 mb-3">
              <Shield className="w-3.5 h-3.5" />
              Преимущества Accessible Transit
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Почему тысячи жителей и водителей Квинса выбирают AT
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-2xl mx-auto">
              Официальная лицензированная база NYC TLC в Квинсе с собственным парком инклюзивных минивэнов WAV и интеграцией с MTA Access-A-Ride.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            
            {/* Advantage 1 */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-sky-600/20 text-sky-400 border border-sky-500/30 flex items-center justify-center">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Инклюзивность & WAV</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Специализированные автомобили с гидравлическими и складными пандусами для комфортной перевозки пассажиров на инвалидных колясках.
              </p>
            </div>

            {/* Advantage 2 */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Комиссия 15% для водителей</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Самая низкая комиссия в Нью-Йорке. Водители сохраняют 85% стоимости каждого рейса + скидка 3% по реферальной программе.
              </p>
            </div>

            {/* Advantage 3 */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Весь Квинс & Нью-Йорк</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Хабы в Jackson Heights, Jamaica, Flushing, Woodside и Astoria с быстрым временем подачи до 7-10 минут.
              </p>
            </div>

            {/* Advantage 4 */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">TLC & MTA Сертификация</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Все водители проверены по стандартам NYC TLC, имеют сертификаты первой помощи и сопровождения пассажиров.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* OPEN GRAPH (OG) PREVIEW TRANSPARENCY BLOCK */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 bg-slate-950 border-t border-slate-800/80">
        <div className="max-w-4xl mx-auto bg-slate-900/60 p-6 rounded-2xl border border-slate-800 text-xs text-slate-400 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Share2 className="w-4 h-4 text-sky-400" />
              Open Graph (OG) Мета-данные для шеринга
            </span>
            <span className="text-[11px] text-emerald-400">Готово для WhatsApp / Telegram / iMessage</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-[11px] bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div>
              <span className="text-slate-500">og:title:</span>{' '}
              <span className="text-slate-200">
                {viewMode === 'passenger' 
                  ? `${inviter.name} приглашает тебя в Accessible Transit` 
                  : `Присоединяйся к парку Accessible Transit (Комиссия 15%)`}
              </span>
            </div>
            <div>
              <span className="text-slate-500">og:url:</span>{' '}
              <span className="text-sky-300">{fullUrl}</span>
            </div>
            <div>
              <span className="text-slate-500">og:description:</span>{' '}
              <span className="text-slate-200">
                {viewMode === 'passenger' 
                  ? 'Получи скидку $10 на первую поездку на комфортном инклюзивном такси Accessible Transit по всему Квинсу'
                  : 'Гарантированная низкая комиссия 15% и постоянный поток заказов от MTA и госпиталей'}
              </span>
            </div>
            <div>
              <span className="text-slate-500">og:image:</span>{' '}
              <span className="text-emerald-300">https://accessibletransit.com/og-banner-queens.png</span>
            </div>
          </div>
        </div>
      </section>

      {/* PUBLIC FOOTER */}
      <footer className="mt-auto bg-slate-900 border-t border-slate-800 py-8 px-4 sm:px-6 lg:px-8 text-xs text-slate-400">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-sky-500 text-white flex items-center justify-center font-black text-xs">
              AT
            </div>
            <div>
              <div className="text-slate-200 font-bold">Accessible Transit LLC</div>
              <div className="text-[11px] text-slate-400">New York TLC Licensed Dispatch Base • Queens, NY</div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>24/7 Dispatch: (718) 555-0199</span>
            <span>•</span>
            <span>Jackson Heights Base</span>
            <span>•</span>
            <span>MTA Access-A-Ride Partner</span>
          </div>
        </div>
      </footer>

      {/* SHARE MODAL INTEGRATION */}
      <ReferralShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        referralCode={currentCode}
        referralUrl={fullUrl}
        defaultType={viewMode}
      />

    </div>
  );
};
