import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  X, 
  Share2, 
  Send, 
  Mail, 
  MessageSquare, 
  Copy, 
  Check, 
  Download, 
  ExternalLink, 
  Sparkles, 
  Users, 
  Car, 
  RotateCcw, 
  Eye, 
  ShieldCheck, 
  Award,
  Smartphone,
  Globe
} from 'lucide-react';
import { Driver } from '../../types';

interface ReferralShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  driver?: Driver | null;
  defaultType?: 'passenger' | 'driver';
  referralCode?: string;
  referralUrl?: string;
  onOpenLandingPage?: (code: string) => void;
}

export const ReferralShareModal: React.FC<ReferralShareModalProps> = ({
  isOpen,
  onClose,
  driver,
  defaultType = 'passenger',
  referralCode,
  referralUrl,
  onOpenLandingPage
}) => {
  const [shareType, setShareType] = useState<'passenger' | 'driver'>(defaultType);
  const [copiedField, setCopiedField] = useState<'link' | 'message' | 'code' | null>(null);

  // Derive driver details
  const driverName = driver?.fullName || 'Tariq Al-Mansoor';
  const driverCodeSuffix = driver?.id ? driver.id.replace(/\D/g, '') : '101';
  const driverFirstName = driverName.split(' ')[0].toUpperCase();

  // Active Code & URL
  const currentCode = referralCode || (
    shareType === 'passenger' 
      ? `ATP-${driverFirstName}-${driverCodeSuffix}` 
      : `ATD-${driverFirstName}-${driverCodeSuffix}`
  );

  const currentUrl = referralUrl || `https://accessibletransit.com/ref/${currentCode}`;

  // Default templates as specified
  const defaultPassengerText = `Привет! Пользуюсь Accessible Transit в Нью-Йорке — инклюзивные и стандартные поездки по отличным ценам. Держи скидку на первую поездку по моему промокоду: ${currentCode} или переходи по ссылке: ${currentUrl}`;
  
  const defaultDriverText = `Привет, коллега! Подключайся к парку Accessible Transit: комиссия всего 15% (против 25-30% у Uber/Lyft), постоянные заказы от MTA и госпиталей Квинса. Регистрируйся по моей ссылке: ${currentUrl} (промокод ${currentCode})`;

  const [messageText, setMessageText] = useState(defaultPassengerText);

  // Sync message text when switching type or code
  useEffect(() => {
    if (shareType === 'passenger') {
      setMessageText(defaultPassengerText);
    } else {
      setMessageText(defaultDriverText);
    }
  }, [shareType, currentCode, currentUrl]);

  if (!isOpen) return null;

  const handleCopy = (text: string, field: 'link' | 'message' | 'code') => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleResetMessage = () => {
    setMessageText(shareType === 'passenger' ? defaultPassengerText : defaultDriverText);
  };

  // Messenger links
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(messageText)}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(messageText)}`;
  const smsUrl = `sms:?&body=${encodeURIComponent(messageText)}`;
  
  const emailSubject = shareType === 'passenger' 
    ? `${driverName} приглашает тебя в Accessible Transit (Скидка на 1-ю поездку)`
    : `${driverName} приглашает в парк водителей Accessible Transit (Комиссия 15%)`;
  const mailtoUrl = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(messageText)}`;

  // Download QR Code helper
  const handleDownloadQr = (format: 'png' | 'svg') => {
    const svgEl = document.getElementById('share-modal-qr-svg');
    if (!svgEl) return;

    if (format === 'svg') {
      const svgData = new XMLSerializer().serializeToString(svgEl);
      const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AT_QR_${currentCode}.svg`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    // PNG download with high res
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = 600;
      canvas.height = 600;
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 600, 600);
        ctx.drawImage(img, 30, 30, 540, 540);
      }
      const pngUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = `AT_QR_${currentCode}.png`;
      a.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleOpenLanding = () => {
    if (onOpenLandingPage) {
      onOpenLandingPage(currentCode);
    } else {
      window.open(`/ref/${currentCode}`, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-slate-100 my-auto">
        
        {/* MODAL HEADER */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-sky-500/20 to-emerald-500/20 rounded-2xl border border-sky-500/30 text-sky-400">
              <Share2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">Поделиться реферальной ссылкой</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  Вирусный шеринг
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Водитель: <strong className="text-slate-200">{driverName}</strong> • Персональный лендинг & мессенджеры
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* AUDIENCE SELECTOR TABS */}
          <div className="flex items-center gap-3 p-1.5 bg-slate-950/70 rounded-2xl border border-slate-800">
            <button
              onClick={() => setShareType('passenger')}
              className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2.5 transition-all ${
                shareType === 'passenger'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-900/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Пассажирский реферал</span>
              <span className="text-[10px] py-0.5 px-2 rounded-full bg-white/20 text-white font-mono">
                Скидка $10
              </span>
            </button>

            <button
              onClick={() => setShareType('driver')}
              className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2.5 transition-all ${
                shareType === 'driver'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-900/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Car className="w-4 h-4" />
              <span>Водительский реферал (TLC)</span>
              <span className="text-[10px] py-0.5 px-2 rounded-full bg-white/20 text-white font-mono">
                Комиссия 15%
              </span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT COLUMN: SHARE ACTIONS & EDITABLE TEXT (7 COLS) */}
            <div className="lg:col-span-7 space-y-5">
              
              {/* INSTANT MESSENGER BUTTONS ROW */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                  1. Быстрая отправка в мессенджеры и соцсети
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {/* WhatsApp */}
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-700/60 text-emerald-300 transition-all hover:scale-[1.02] shadow-sm group"
                  >
                    <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-1.5 shadow-sm group-hover:scale-110 transition-transform">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold">WhatsApp</span>
                    <span className="text-[10px] text-emerald-400/80">в 1 клик</span>
                  </a>

                  {/* Telegram */}
                  <a
                    href={telegramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-sky-950/50 hover:bg-sky-900/60 border border-sky-700/60 text-sky-300 transition-all hover:scale-[1.02] shadow-sm group"
                  >
                    <div className="w-9 h-9 rounded-full bg-sky-500 text-white flex items-center justify-center mb-1.5 shadow-sm group-hover:scale-110 transition-transform">
                      <Send className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold">Telegram</span>
                    <span className="text-[10px] text-sky-400/80">канал/чат</span>
                  </a>

                  {/* SMS */}
                  <a
                    href={smsUrl}
                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-indigo-950/50 hover:bg-indigo-900/60 border border-indigo-700/60 text-indigo-300 transition-all hover:scale-[1.02] shadow-sm group"
                  >
                    <div className="w-9 h-9 rounded-full bg-indigo-500 text-white flex items-center justify-center mb-1.5 shadow-sm group-hover:scale-110 transition-transform">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold">SMS</span>
                    <span className="text-[10px] text-indigo-400/80">на телефон</span>
                  </a>

                  {/* Email */}
                  <a
                    href={mailtoUrl}
                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-rose-950/50 hover:bg-rose-900/60 border border-rose-700/60 text-rose-300 transition-all hover:scale-[1.02] shadow-sm group"
                  >
                    <div className="w-9 h-9 rounded-full bg-rose-500 text-white flex items-center justify-center mb-1.5 shadow-sm group-hover:scale-110 transition-transform">
                      <Mail className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold">Email</span>
                    <span className="text-[10px] text-rose-400/80">письмо</span>
                  </a>
                </div>
              </div>

              {/* EDITABLE SHARE MESSAGE */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    2. Текст сообщения перед отправкой
                  </label>
                  <button
                    onClick={handleResetMessage}
                    className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Сбросить текст
                  </button>
                </div>

                <div className="relative">
                  <textarea
                    rows={4}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-xs text-slate-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-hidden font-sans leading-relaxed resize-none"
                    placeholder="Введите текст сообщения..."
                  />
                  <button
                    onClick={() => handleCopy(messageText, 'message')}
                    className="absolute bottom-3 right-3 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    {copiedField === 'message' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Скопировано!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Копировать всё</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* PROMO CODE & LINK BAR */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/50 p-3.5 rounded-xl border border-slate-800">
                {/* Code */}
                <div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Промокод
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-sky-300 bg-sky-950/80 px-2.5 py-1.5 rounded-lg border border-sky-800 flex-1 truncate">
                      {currentCode}
                    </span>
                    <button
                      onClick={() => handleCopy(currentCode, 'code')}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
                      title="Копировать код"
                    >
                      {copiedField === 'code' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Link */}
                <div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Прямая ссылка
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={currentUrl}
                      className="text-xs font-mono bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-300 flex-1 truncate select-all"
                    />
                    <button
                      onClick={() => handleCopy(currentUrl, 'link')}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
                      title="Копировать ссылку"
                    >
                      {copiedField === 'link' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* ACTION: OPEN LANDING PAGE DIRECTLY */}
              <button
                onClick={handleOpenLanding}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-500 hover:to-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-950/50 transition-all hover:scale-[1.01]"
              >
                <Globe className="w-4 h-4" />
                <span>Открыть персональную страницу-лендинг (/ref/{currentCode})</span>
                <ExternalLink className="w-3.5 h-3.5 ml-1 opacity-80" />
              </button>
            </div>

            {/* RIGHT COLUMN: RICH OPEN GRAPH (OG) PREVIEW & QR CODE (5 COLS) */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* SOCIAL MEDIA RICH PREVIEW (OPEN GRAPH SIMULATOR) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Rich Preview в мессенджерах (OG)
                  </span>
                  <span className="text-[10px] text-slate-500">как видят в Telegram/WhatsApp</span>
                </div>

                <div className="bg-slate-950 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
                  {/* Banner Image */}
                  <div className="relative h-32 bg-gradient-to-r from-slate-900 via-sky-950 to-emerald-950 overflow-hidden flex items-center justify-center p-4 border-b border-slate-800">
                    <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:12px_12px]" />
                    <div className="relative z-10 flex items-center gap-3 text-center">
                      <div className="w-12 h-12 rounded-xl bg-sky-500 text-white flex items-center justify-center font-black text-xl shadow-lg border border-sky-300">
                        AT
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-black text-white tracking-tight">ACCESSIBLE TRANSIT</div>
                        <div className="text-[10px] text-sky-300 font-medium">NYC TLC Queens WAV Fleet</div>
                        <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                          {shareType === 'passenger' ? '🎁 Скидка $10 на первую поездку' : '⭐ Комиссия всего 15%'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* OG Card Body */}
                  <div className="p-3.5 bg-slate-900/90 text-left space-y-1.5">
                    <div className="text-[11px] text-sky-400 font-mono flex items-center gap-1 truncate">
                      <span>accessibletransit.com/ref/{currentCode}</span>
                    </div>
                    <div className="text-xs font-bold text-white leading-snug">
                      {shareType === 'passenger' 
                        ? `${driverName} приглашает тебя в Accessible Transit`
                        : `Присоединяйся к команде водителей Accessible Transit (Комиссия 15%)`}
                    </div>
                    <div className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {shareType === 'passenger'
                        ? 'Комфортное инклюзивное такси по всему Квинсу и Нью-Йорку на автомобилях с пандусами (WAV) и гибридах. Получи скидку на первый заказ!'
                        : 'Гарантированная низкая комиссия 15% и постоянный поток заказов от MTA Paratransit и госпиталей Queens.'}
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        Официальный TLC Нью-Йорк
                      </span>
                      <span className="font-mono text-sky-300">Промокод: {currentCode}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* QR CODE CARD WITH DOWNLOAD */}
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex flex-col items-center text-center">
                <div className="bg-white p-2.5 rounded-xl shadow-md border border-slate-300 mb-3">
                  <QRCodeSVG
                    id="share-modal-qr-svg"
                    value={currentUrl}
                    size={120}
                    level="H"
                    includeMargin={true}
                  />
                </div>

                <div className="text-xs font-bold text-slate-200 mb-0.5">
                  QR-код для быстрого перехода
                </div>
                <div className="text-[10px] text-slate-400 mb-3">
                  Сканируйте смартфоном для перехода на лендинг
                </div>

                <div className="grid grid-cols-2 gap-2 w-full">
                  <button
                    onClick={() => handleDownloadQr('png')}
                    className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                  >
                    <Download className="w-3 h-3 text-sky-400" />
                    <span>Скачать PNG</span>
                  </button>
                  <button
                    onClick={() => handleDownloadQr('svg')}
                    className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                  >
                    <Download className="w-3 h-3 text-emerald-400" />
                    <span>Скачать SVG</span>
                  </button>
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Accessible Transit Viral Referral Engine • Queens, NYC TLC Base</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold transition-colors border border-slate-700"
          >
            Закрыть
          </button>
        </div>

      </div>
    </div>
  );
};
