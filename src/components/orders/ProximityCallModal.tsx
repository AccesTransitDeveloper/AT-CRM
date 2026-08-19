import React, { useState, useEffect } from 'react';
import { Order, Driver, ProximityCallLog, ProximityCallSettings } from '../../types';
import { 
  PhoneCall, PhoneOff, PhoneForwarded, Radio, Settings, Play, CheckCircle2, 
  XCircle, AlertTriangle, Send, RefreshCw, X, Shield, Volume2, Info, ArrowRight,
  Sliders, MessageSquare, Bell, Check, Clock
} from 'lucide-react';
import { 
  fetchProximitySettings, 
  updateProximitySettings, 
  fetchProximityCallLogs, 
  triggerProximityCall, 
  simulateDtmfInput, 
  testTelegramAlert,
  evaluateProximityForAllOrders
} from '../../lib/proximityCallApi';

interface ProximityCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  drivers: Driver[];
  selectedOrderId?: string | null;
  onRefreshOrders?: () => Promise<void> | void;
}

export const ProximityCallModal: React.FC<ProximityCallModalProps> = ({
  isOpen,
  onClose,
  orders,
  drivers,
  selectedOrderId,
  onRefreshOrders
}) => {
  const [activeTab, setActiveTab] = useState<'simulator' | 'settings' | 'logs'>('simulator');
  const [settings, setSettings] = useState<ProximityCallSettings | null>(null);
  const [logs, setLogs] = useState<ProximityCallLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Simulator state
  const mtaOrders = orders.filter(o => o.type === 'mta_broker' || o.source === 'broker');
  const [simOrderId, setSimOrderId] = useState<string>(selectedOrderId || mtaOrders[0]?.id || '');
  const [simDistance, setSimDistance] = useState<number>(0.25);
  const [simCalling, setSimCalling] = useState<boolean>(false);
  const [simCallActive, setSimCallActive] = useState<boolean>(false);
  const [simActiveCallLog, setSimActiveCallLog] = useState<ProximityCallLog | null>(null);
  const [simResult, setSimResult] = useState<{ confirmed: boolean; text: string; telegramSent: boolean } | null>(null);

  // Settings form state
  const [radiusInput, setRadiusInput] = useState<number>(0.3);
  const [enabledInput, setEnabledInput] = useState<boolean>(true);
  const [telegramAlertsInput, setTelegramAlertsInput] = useState<boolean>(true);
  const [promptInput, setPromptInput] = useState<string>('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [sett, callLogs] = await Promise.all([
        fetchProximitySettings(),
        fetchProximityCallLogs()
      ]);
      setSettings(sett);
      setRadiusInput(sett.triggerRadiusMiles);
      setEnabledInput(sett.enabled);
      setTelegramAlertsInput(sett.telegramAlertsEnabled);
      setPromptInput(sett.customMessagePrompt);
      setLogs(callLogs);
    } catch (err: any) {
      console.error('Failed to load proximity data:', err);
      setNotice({ text: 'Ошибка загрузки данных: ' + err.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      if (selectedOrderId) {
        setSimOrderId(selectedOrderId);
      }
    }
  }, [isOpen, selectedOrderId]);

  if (!isOpen) return null;

  const currentOrder = orders.find(o => o.id === simOrderId);
  const currentDriver = currentOrder?.driverId ? drivers.find(d => d.id === currentOrder.driverId) : null;

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const updated = await updateProximitySettings({
        triggerRadiusMiles: Number(radiusInput),
        enabled: enabledInput,
        telegramAlertsEnabled: telegramAlertsInput,
        customMessagePrompt: promptInput
      });
      setSettings(updated);
      setNotice({ text: 'Настройки автозвонка успешно сохранены!', type: 'success' });
      setTimeout(() => setNotice(null), 4000);
    } catch (err: any) {
      setNotice({ text: 'Ошибка сохранения: ' + err.message, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestTelegram = async () => {
    setIsLoading(true);
    try {
      const res = await testTelegramAlert();
      if (res.success) {
        setNotice({ 
          text: `Тестовое уведомление успешно ${res.isSimulated ? 'смоделировано в консоли' : 'доставлено в группу диспетчеров Telegram'} (ID: ${res.messageId})`, 
          type: 'success' 
        });
      } else {
        setNotice({ text: 'Ошибка отправки в Telegram: ' + res.error, type: 'error' });
      }
    } catch (err: any) {
      setNotice({ text: 'Сбой Telegram API: ' + err.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerSimCall = async () => {
    if (!currentOrder) {
      setNotice({ text: 'Выберите активный MTA заказ', type: 'error' });
      return;
    }
    setSimCalling(true);
    setSimResult(null);
    try {
      const res = await triggerProximityCall(
        currentOrder.id,
        simDistance,
        `Ручная симуляция приближения (${simDistance} миль)`
      );
      setSimCallActive(true);
      setSimActiveCallLog(res.log);
      setNotice({ 
        text: `Исходящий звонок запущен для ${currentOrder.passengerName} (${currentOrder.passengerPhone})`, 
        type: 'info' 
      });
      if (onRefreshOrders) await onRefreshOrders();
      await loadData();
    } catch (err: any) {
      setNotice({ text: 'Ошибка запуска звонка: ' + err.message, type: 'error' });
    } finally {
      setSimCalling(false);
    }
  };

  const handleSimulateDtmf = async (digit: '1' | '2') => {
    if (!currentOrder) return;
    setIsLoading(true);
    try {
      const res = await simulateDtmfInput(currentOrder.id, digit, simActiveCallLog?.callSid);
      setSimCallActive(false);
      setSimResult({
        confirmed: digit === '1',
        text: res.message || (digit === '1' ? 'Поездка подтверждена' : 'Поездка отменена'),
        telegramSent: res.telegramSent
      });
      setNotice({
        text: digit === '2' 
          ? 'Заказ отменён! Диспетчерская группа Telegram получила уведомление.' 
          : 'Пассажир нажал 1 — выход к автомобилю подтверждён.',
        type: digit === '2' ? 'error' : 'success'
      });
      if (onRefreshOrders) await onRefreshOrders();
      await loadData();
    } catch (err: any) {
      setNotice({ text: 'Ошибка DTMF: ' + err.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEvaluateAll = async () => {
    setIsLoading(true);
    try {
      const res = await evaluateProximityForAllOrders();
      setNotice({ 
        text: `Гео-сканирование завершено: проверено заказов, запущено звонков: ${res.triggeredCount}`, 
        type: 'info' 
      });
      if (onRefreshOrders) await onRefreshOrders();
      await loadData();
    } catch (err: any) {
      setNotice({ text: 'Сбой сканирования: ' + err.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="proximity-call-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div id="proximity-call-modal-card" className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <PhoneCall className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Автозвонок пассажиру (Twilio IVR) & Telegram-оповещение
                </h3>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  MTA Broker
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Автоматический триггер по гео-приближению водителя к точке подачи & DTMF опрос
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="refresh-proximity-btn"
              onClick={loadData}
              disabled={isLoading}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Обновить"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              id="close-proximity-modal-btn"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notice alert */}
        {notice && (
          <div className={`px-6 py-2.5 text-xs flex items-center justify-between ${
            notice.type === 'success' ? 'bg-emerald-500/10 text-emerald-300 border-b border-emerald-500/20' :
            notice.type === 'error' ? 'bg-rose-500/10 text-rose-300 border-b border-rose-500/20' :
            'bg-sky-500/10 text-sky-300 border-b border-sky-500/20'
          }`}>
            <div className="flex items-center gap-2">
              {notice.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
              {notice.type === 'error' && <AlertTriangle className="w-4 h-4" />}
              {notice.type === 'info' && <Info className="w-4 h-4" />}
              <span>{notice.text}</span>
            </div>
            <button onClick={() => setNotice(null)} className="hover:opacity-75">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 px-6 bg-slate-950/40">
          <button
            id="tab-sim-btn"
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-medium border-b-2 transition ${
              activeTab === 'simulator'
                ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Play className="w-4 h-4" />
            <span>Тестирование и Симулятор</span>
          </button>

          <button
            id="tab-settings-btn"
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-medium border-b-2 transition ${
              activeTab === 'settings'
                ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Параметры & Интеграции</span>
          </button>

          <button
            id="tab-logs-btn"
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-medium border-b-2 transition ${
              activeTab === 'logs'
                ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Журнал звонков ({logs.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* TAB 1: SIMULATOR */}
          {activeTab === 'simulator' && (
            <div className="space-y-6">
              
              {/* Top Quick Status Bar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3.5">
                  <div className="text-xs text-slate-400 mb-1 flex items-center justify-between">
                    <span>Порог приближения</span>
                    <Radio className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="text-lg font-bold text-white">
                    {settings?.triggerRadiusMiles ?? 0.3} миль <span className="text-xs text-slate-400 font-normal">(~500 м)</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Статус: <span className={settings?.enabled ? 'text-emerald-400 font-semibold' : 'text-rose-400'}>
                      {settings?.enabled ? 'Включен' : 'Отключен'}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3.5">
                  <div className="text-xs text-slate-400 mb-1 flex items-center justify-between">
                    <span>Twilio Voice API</span>
                    <PhoneCall className="w-3.5 h-3.5 text-sky-400" />
                  </div>
                  <div className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    <span>{settings?.configuredTwilioNumber || '+1 (800) 555-0199'}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {settings?.isTwilioConfigured ? 'Live Credentials Connected' : 'Интерактивный эмулятор активен'}
                  </div>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3.5">
                  <div className="text-xs text-slate-400 mb-1 flex items-center justify-between">
                    <span>Telegram Alert Bot</span>
                    <Send className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <div className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>Группа диспетчеров MTA</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {settings?.isTelegramConfigured ? 'Telegram Bot Active' : 'Эмуляция в CRM и журнале'}
                  </div>
                </div>
              </div>

              {/* Order Selection & Distance Simulator */}
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Radio className="w-4 h-4 text-amber-400" />
                    <span>Выбор MTA-заказа для тестирования</span>
                  </h4>
                  <button
                    onClick={handleEvaluateAll}
                    disabled={isLoading}
                    className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 hover:underline"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Запустить гео-проверку всех заказов</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      MTA Заказ (TripLink / MyLe)
                    </label>
                    <select
                      id="select-mta-sim-order"
                      value={simOrderId}
                      onChange={(e) => {
                        setSimOrderId(e.target.value);
                        setSimCallActive(false);
                        setSimResult(null);
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                    >
                      {mtaOrders.length === 0 && <option value="">Нет активных MTA заказов</option>}
                      {mtaOrders.map(o => (
                        <option key={o.id} value={o.id}>
                          {o.orderNumber} • {o.passengerName} ({o.brokerName || 'MTA'}) — {o.status}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                      <span>Дистанция водителя до подачи:</span>
                      <span className="text-amber-400 font-bold">{simDistance} мили ({Math.round(simDistance * 1609)} м)</span>
                    </label>
                    <input
                      type="range"
                      min="0.05"
                      max="1.5"
                      step="0.05"
                      value={simDistance}
                      onChange={(e) => setSimDistance(parseFloat(e.target.value))}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500 mt-2"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                      <span>0.05 мили (У подъезда)</span>
                      <span className="text-amber-400 font-semibold">0.30 мили (Порог)</span>
                      <span>1.5 мили (Далеко)</span>
                    </div>
                  </div>
                </div>

                {/* Selected Order Summary Card */}
                {currentOrder && (
                  <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <div className="text-slate-400">Пассажир:</div>
                      <div className="font-semibold text-white text-sm">{currentOrder.passengerName}</div>
                      <div className="text-amber-400 font-mono">{currentOrder.passengerPhone}</div>
                      <div className="text-slate-400 mt-2">Точка подачи:</div>
                      <div className="text-slate-200">{currentOrder.pickupAddress}</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Назначенный водитель:</div>
                      <div className="font-semibold text-white text-sm">
                        {currentDriver ? `${currentDriver.fullName} (${currentDriver.vehiclePlate})` : currentOrder.driverName || 'Не назначен'}
                      </div>
                      <div className="text-slate-400 mt-2">Статус звонка:</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {currentOrder.callTriggered ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium">
                            Звонок инициирован ({currentOrder.callResult || currentOrder.callStatus || 'completed'})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                            Ожидает приближения
                          </span>
                        )}
                        <span className={`text-[11px] ${simDistance <= (settings?.triggerRadiusMiles || 0.3) ? 'text-emerald-400 font-bold' : 'text-amber-400'}`}>
                          {simDistance <= (settings?.triggerRadiusMiles || 0.3) ? '✓ Внутри радиуса' : 'Вне радиуса'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Trigger Button */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    id="trigger-proximity-call-btn"
                    onClick={handleTriggerSimCall}
                    disabled={simCalling || !currentOrder}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
                  >
                    <PhoneCall className={`w-4 h-4 ${simCalling ? 'animate-spin' : ''}`} />
                    <span>
                      {simCalling ? 'Вызов Twilio Voice...' : `Инициировать звонок пассажиру (${simDistance} миль)`}
                    </span>
                  </button>

                  <button
                    id="test-telegram-btn"
                    onClick={handleTestTelegram}
                    disabled={isLoading}
                    className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium text-sm flex items-center gap-2 transition"
                    title="Проверить отправку в Telegram"
                  >
                    <Send className="w-4 h-4 text-indigo-400" />
                    <span>Тест Telegram</span>
                  </button>
                </div>
              </div>

              {/* Active Call & DTMF Interactive Pad */}
              {simCallActive && (
                <div className="bg-gradient-to-br from-slate-900 to-slate-950 border-2 border-amber-500/40 rounded-2xl p-5 space-y-4 animate-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center animate-bounce">
                        <PhoneCall className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">Идёт голосовой вызов пассажиру...</div>
                        <div className="text-xs text-amber-400 font-mono">
                          {currentOrder?.passengerPhone} ({currentOrder?.passengerName})
                        </div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold animate-pulse">
                      Live Call In Progress
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/60 text-xs space-y-1.5">
                    <div className="text-slate-400 flex items-center gap-1.5 font-medium">
                      <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Текст голосового робота (TTS):</span>
                    </div>
                    <p className="text-slate-200 italic pl-5">
                      «Здравствуйте, это Accessible Transit. Ваш водитель уже подъезжает. Пожалуйста, выходите. Если хотите отменить поездку, нажмите 2.»
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-300">
                      Симуляция нажатия клавиш на телефоне пассажира (DTMF):
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <button
                        id="dtmf-press-1-btn"
                        onClick={() => handleSimulateDtmf('1')}
                        disabled={isLoading}
                        className="py-3 px-4 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-sm flex items-center justify-center gap-2 transition"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Нажать [ 1 ] — Подтвердить выход</span>
                      </button>

                      <button
                        id="dtmf-press-2-btn"
                        onClick={() => handleSimulateDtmf('2')}
                        disabled={isLoading}
                        className="py-3 px-4 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-rose-500/10"
                      >
                        <PhoneOff className="w-4 h-4 text-rose-400" />
                        <span>Нажать [ 2 ] — Отменить поездку & Алерт в Telegram</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Call Result Box */}
              {simResult && (
                <div className={`p-4 rounded-xl border ${
                  simResult.confirmed 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}>
                  <div className="flex items-start gap-3">
                    {simResult.confirmed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <div className="text-sm font-bold">
                        {simResult.confirmed ? 'Поездка подтверждена пассажиром' : 'Поездка отменена по автозвонку'}
                      </div>
                      <div className="text-xs text-slate-300">{simResult.text}</div>
                      {simResult.telegramSent && (
                        <div className="text-xs text-indigo-300 font-semibold flex items-center gap-1.5 mt-1.5">
                          <Send className="w-3.5 h-3.5" />
                          <span>Алерт успешно отправлен в Telegram-канал диспетчерской службы</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 space-y-5">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  <span>Параметры радиуса и логики автодозвона</span>
                </h4>

                <div className="space-y-4">
                  {/* Enable Switch */}
                  <div className="flex items-center justify-between p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                    <div>
                      <div className="text-sm font-semibold text-white">Автоматический запуск звонков</div>
                      <div className="text-xs text-slate-400">
                        Автодозвон при приближении водителя к точке подачи для всех MTA заказов
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={enabledInput} 
                        onChange={(e) => setEnabledInput(e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>

                  {/* Radius Setting */}
                  <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-white">Радиус срабатывания триггера</div>
                        <div className="text-xs text-slate-400">
                          Расстояние между GPS-координатами водителя и точкой подачи (pickup_location)
                        </div>
                      </div>
                      <span className="text-base font-bold text-amber-400 font-mono">
                        {radiusInput} мили ({Math.round(radiusInput * 1609)} м)
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={radiusInput}
                      onChange={(e) => setRadiusInput(parseFloat(e.target.value))}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>0.10 мили (160 м)</span>
                      <span className="text-amber-400 font-semibold">0.30 мили (500 м — Рекомендуемый)</span>
                      <span>1.00 миля (1600 м)</span>
                    </div>
                  </div>

                  {/* Telegram Notifications Switch */}
                  <div className="flex items-center justify-between p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                    <div>
                      <div className="text-sm font-semibold text-white">Уведомления диспетчеру в Telegram</div>
                      <div className="text-xs text-slate-400">
                        Мгновенная отправка карточки отменённого MTA-заказа в рабочий чат диспетчеров
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={telegramAlertsInput} 
                        onChange={(e) => setTelegramAlertsInput(e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                    </label>
                  </div>

                  {/* Message Prompt */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Текст сообщения голосового робота (TTS Russian & English)
                    </label>
                    <textarea
                      rows={3}
                      value={promptInput}
                      onChange={(e) => setPromptInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500 leading-relaxed font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    id="save-proximity-settings-btn"
                    onClick={handleSaveSettings}
                    disabled={isSaving}
                    className="py-2.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-lg shadow-amber-500/20 flex items-center gap-2 transition disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isSaving ? 'Сохранение...' : 'Сохранить настройки'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-400">
                  Всего зафиксировано автозвонков: <span className="text-white font-semibold">{logs.length}</span>
                </div>
                <button
                  onClick={loadData}
                  className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Обновить журнал</span>
                </button>
              </div>

              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Время (EDT)</th>
                      <th className="py-2.5 px-3">Заказ / Брокер</th>
                      <th className="py-2.5 px-3">Пассажир</th>
                      <th className="py-2.5 px-3">Водитель / Дистанция</th>
                      <th className="py-2.5 px-3">DTMF / Результат</th>
                      <th className="py-2.5 px-3">Telegram</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500">
                          Журнал автозвонков пока пуст
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                            {new Date(log.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-white">{log.orderNumber}</div>
                            <div className="text-[10px] text-slate-400">{log.brokerName}</div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="text-slate-200">{log.passengerName}</div>
                            <div className="text-[10px] text-amber-400 font-mono">{log.passengerPhone}</div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="text-slate-300">{log.driverName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{log.distanceMiles} миль</div>
                          </td>
                          <td className="py-2.5 px-3">
                            {log.callResult === 'cancelled_by_passenger' ? (
                              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-semibold flex items-center gap-1 w-fit">
                                <XCircle className="w-3 h-3" />
                                <span>Отмена (DTMF {log.dtmfPressed || '2'})</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold flex items-center gap-1 w-fit">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Подтверждён (DTMF {log.dtmfPressed || '1'})</span>
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            {log.telegramNotified ? (
                              <span className="text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
                                <Send className="w-3 h-3 text-indigo-400" />
                                <span>Отправлен</span>
                              </span>
                            ) : (
                              <span className="text-slate-500 text-[11px]">—</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-800 bg-slate-900/90 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Accessible Transit MTA Telephony & Dispatch Relay B03669</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition font-medium"
          >
            Закрыть
          </button>
        </div>

      </div>
    </div>
  );
};
