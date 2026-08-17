import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Sparkles, 
  Power, 
  Send, 
  Mic, 
  MicOff, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  RotateCcw, 
  Shield, 
  ChevronRight, 
  UserCheck, 
  Car, 
  FileText, 
  X, 
  RefreshCw, 
  SlidersHorizontal,
  ArrowRight,
  Database,
  Check
} from 'lucide-react';
import { useI18n } from '../lib/i18n';
import { api } from '../lib/api';
import { 
  UserRole, 
  AiAgentMessage, 
  AiAgentProposedAction, 
  AiAgentAuditLog 
} from '../types';

interface AiAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isActive: boolean;
  onToggleActive: (active: boolean) => void;
  currentRole: UserRole;
  actorName: string;
}

export const AiAssistantPanel: React.FC<AiAssistantPanelProps> = ({
  isOpen,
  onClose,
  isActive,
  onToggleActive,
  currentRole,
  actorName
}) => {
  const { t, language } = useI18n();
  const [activeTab, setActiveTab] = useState<'chat' | 'history'>('chat');
  const [messages, setMessages] = useState<AiAgentMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  // History / Audit state
  const [auditLogs, setAuditLogs] = useState<AiAgentAuditLog[]>([]);
  const [auditFilter, setAuditFilter] = useState<'all' | 'actions' | 'queries'>('all');
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);

  // Action execution state tracking
  const [executingActionId, setExecutingActionId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcome: AiAgentMessage = {
        id: 'welcome-msg',
        sender: 'agent',
        text: language === 'ru'
          ? `Здравствуйте, **${actorName}**! Я **Jarvis** — ваш внутренний AI-ассистент диспетчерской Accessible Transit (Нью-Йорк, TLC Base).\n\nЯ имею прямой доступ к показателям автопарка, активным заказам (Queens, Brooklyn, Manhattan), документам комплаенса и брокерским каналам MTA. Вы можете задать мне вопрос или дать команду диспетчера.`
          : `Hello **${actorName}**! I am **Jarvis**, your internal Accessible Transit operations & dispatch AI assistant.\n\nI have live access to fleet telemetry, active bookings across Queens & NYC boroughs, TLC compliance records, and MTA brokerage metrics. Ask me a question or issue a dispatch command.`,
        timestamp: new Date().toISOString()
      };
      setMessages([welcome]);
    }
  }, [language, actorName]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  // Load audit logs when tab is switched to history
  useEffect(() => {
    if (activeTab === 'history' && isOpen) {
      loadAuditLogs();
    }
  }, [activeTab, isOpen]);

  const loadAuditLogs = async () => {
    try {
      setIsLoadingAudit(true);
      const logs = await api.getAiAgentAuditLogs();
      setAuditLogs(logs);
    } catch (err) {
      console.error('Failed to load AI audit logs:', err);
    } finally {
      setIsLoadingAudit(false);
    }
  };

  // Web Speech API Voice Recognition setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === 'ru' ? 'ru-RU' : 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputText(transcript);
          handleSendCommand(transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        setSpeechError(event.error === 'not-allowed' ? 'Microphone permission denied' : 'Speech recognition error');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [language]);

  const toggleVoiceInput = () => {
    if (!isActive) return;
    if (!recognitionRef.current) {
      alert(t('aiAgent.voiceNotSupported'));
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn('Could not start recognition:', err);
      }
    }
  };

  const handleSendCommand = async (textToSend?: string) => {
    const cmd = (textToSend || inputText).trim();
    if (!cmd || isLoading || !isActive) return;

    // Add user message
    const userMsg: AiAgentMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: cmd,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await api.sendAiAgentCommand({
        command: cmd,
        currentRole,
        actorName,
        language: language === 'ru' ? 'ru' : 'en'
      });

      const agentMsg: AiAgentMessage = {
        id: `agent-${Date.now()}`,
        sender: 'agent',
        text: response.reply,
        proposedAction: response.proposedAction,
        isReport: response.isReport,
        reportData: response.reportData,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, agentMsg]);
    } catch (err: any) {
      const errMsg: AiAgentMessage = {
        id: `agent-err-${Date.now()}`,
        sender: 'agent',
        text: language === 'ru'
          ? `⚠️ Ошибка выполнения запроса: ${err.message || 'Не удалось связаться с сервером.'}`
          : `⚠️ Error executing command: ${err.message || 'Failed to communicate with server.'}`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAction = async (messageId: string, action: AiAgentProposedAction) => {
    if (!isActive) return;
    setExecutingActionId(action.id);

    try {
      const result = await api.executeAiAgentAction({
        action,
        currentRole,
        actorName
      });

      // Update message proposedAction status in UI
      setMessages(prev => prev.map(m => {
        if (m.id === messageId && m.proposedAction) {
          return {
            ...m,
            proposedAction: {
              ...m.proposedAction,
              status: 'confirmed'
            }
          };
        }
        return m;
      }));

      // Add feedback message
      const confirmNotice: AiAgentMessage = {
        id: `agent-exec-${Date.now()}`,
        sender: 'agent',
        text: `✅ **${result.message || (language === 'ru' ? 'Действие успешно выполнено.' : 'Action executed successfully.')}**`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, confirmNotice]);
    } catch (err: any) {
      alert(`Execution failed: ${err.message}`);
    } finally {
      setExecutingActionId(null);
    }
  };

  const handleCancelAction = (messageId: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id === messageId && m.proposedAction) {
        return {
          ...m,
          proposedAction: {
            ...m.proposedAction,
            status: 'cancelled'
          }
        };
      }
      return m;
    }));
  };

  const handleClearSession = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'agent',
        text: language === 'ru'
          ? `Сессия очищена. Чем я могу помочь вам сейчас, **${actorName}**?`
          : `Session cleared. How can I assist you now, **${actorName}**?`,
        timestamp: new Date().toISOString()
      }
    ]);
  };

  const filteredLogs = auditLogs.filter(log => {
    if (auditFilter === 'actions') return log.actionType && log.actionType !== 'info_query';
    if (auditFilter === 'queries') return !log.actionType || log.actionType === 'info_query';
    return true;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" id="ai-assistant-modal-root">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        id="ai-assistant-backdrop"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div 
          className="w-screen max-w-md md:max-w-lg bg-white shadow-2xl flex flex-col border-l border-slate-200"
          id="ai-assistant-drawer"
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-200 bg-slate-900 text-white flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    isActive ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-slate-700 text-slate-400'
                  }`}>
                    <Bot className="w-5 h-5" />
                  </div>
                  {isActive && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-slate-900"></span>
                    </span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white text-base leading-tight">
                      {t('aiAgent.title')}
                    </h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      isActive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {isActive ? t('aiAgent.statusActive') : t('aiAgent.statusInactive')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {t('aiAgent.subtitle')}
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                id="close-ai-assistant-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Toggle & Role Badge Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
              {/* Activation Switch */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onToggleActive(!isActive)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-hidden ${
                    isActive ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                  id="ai-agent-toggle-btn"
                  title={isActive ? t('aiAgent.toggleDeactivate') : t('aiAgent.toggleActivate')}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isActive ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="font-medium text-slate-300">
                  {isActive ? t('aiAgent.toggleDeactivate') : t('aiAgent.toggleActivate')}
                </span>
              </div>

              {/* Role Badge */}
              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300">
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                <span>
                  {currentRole === 'admin' ? t('aiAgent.roleAdminAccess') : t('aiAgent.roleDispatcherAccess')}
                </span>
              </div>
            </div>

            {/* Tab Navigation */}
            {isActive && (
              <div className="flex items-center bg-slate-800/80 p-1 rounded-lg border border-slate-700/60 mt-1">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'chat' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  id="ai-tab-chat"
                >
                  <Bot className="w-3.5 h-3.5" />
                  {t('aiAgent.chatTab')}
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'history' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  id="ai-tab-history"
                >
                  <Clock className="w-3.5 h-3.5" />
                  {t('aiAgent.historyTab')}
                </button>
              </div>
            )}
          </div>

          {/* Main Body */}
          {!isActive ? (
            /* Deactivated State */
            <div className="flex-1 p-6 flex flex-col items-center justify-center text-center bg-slate-50">
              <div className="w-16 h-16 rounded-2xl bg-slate-200 flex items-center justify-center text-slate-400 mb-4 shadow-inner">
                <Power className="w-8 h-8" />
              </div>
              <h4 className="text-base font-semibold text-slate-800 mb-2">
                {t('aiAgent.deactivatedNoticeTitle')}
              </h4>
              <p className="text-sm text-slate-600 max-w-xs mb-6 leading-relaxed">
                {t('aiAgent.deactivatedNoticeDesc')}
              </p>
              <button
                onClick={() => onToggleActive(true)}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2"
                id="ai-agent-activate-large-btn"
              >
                <Power className="w-4 h-4" />
                {t('aiAgent.toggleActivate')}
              </button>
            </div>
          ) : activeTab === 'chat' ? (
            /* Live Chat Tab */
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
              {/* Messages Scroll Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4" id="ai-chat-messages-container">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-start gap-2 max-w-[90%]">
                      {msg.sender === 'agent' && (
                        <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}
                      
                      <div
                        className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-blue-600 text-white rounded-tr-xs shadow-xs'
                            : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs shadow-xs'
                        }`}
                      >
                        <div className="whitespace-pre-wrap font-sans">
                          {msg.text.split('\n').map((line, i) => {
                            // Bold formatter helper
                            const parts = line.split(/(\*\*.*?\*\*)/g);
                            return (
                              <p key={i} className={i > 0 ? 'mt-1' : ''}>
                                {parts.map((part, pIdx) => {
                                  if (part.startsWith('**') && part.endsWith('**')) {
                                    return <strong key={pIdx} className="font-semibold">{part.slice(2, -2)}</strong>;
                                  }
                                  if (part.startsWith('• ')) {
                                    return <span key={pIdx} className="text-slate-700">{part}</span>;
                                  }
                                  return part;
                                })}
                              </p>
                            );
                          })}
                        </div>

                        {/* Interactive Proposed Action Card */}
                        {msg.proposedAction && (
                          <div className="mt-3 pt-3 border-t border-slate-200 bg-amber-50/70 p-3 rounded-xl border border-amber-200/80 text-slate-800">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 uppercase tracking-wider mb-1">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                              {t('aiAgent.confirmationTitle')}
                            </div>
                            <h5 className="font-bold text-slate-900 text-sm">
                              {msg.proposedAction.title}
                            </h5>
                            <p className="text-xs text-slate-600 mt-1 leading-normal">
                              {msg.proposedAction.description}
                            </p>

                            {msg.proposedAction.requiresAdmin && (
                              <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-purple-100 text-purple-700 border border-purple-200">
                                <Shield className="w-3 h-3" />
                                {t('aiAgent.requiresAdminBadge')}
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="mt-3 flex items-center gap-2">
                              {msg.proposedAction.status === 'pending' ? (
                                <>
                                  <button
                                    onClick={() => handleConfirmAction(msg.id, msg.proposedAction!)}
                                    disabled={executingActionId === msg.proposedAction.id}
                                    className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                                    id={`confirm-action-btn-${msg.proposedAction.id}`}
                                  >
                                    {executingActionId === msg.proposedAction.id ? (
                                      <>
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                        <span>Executing...</span>
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        {t('aiAgent.confirmAction')}
                                      </>
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleCancelAction(msg.id)}
                                    className="py-1.5 px-3 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium transition-colors"
                                    id={`cancel-action-btn-${msg.proposedAction.id}`}
                                  >
                                    {t('aiAgent.cancelAction')}
                                  </button>
                                </>
                              ) : msg.proposedAction.status === 'confirmed' ? (
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-lg w-full">
                                  <Check className="w-4 h-4 text-emerald-600" />
                                  {t('aiAgent.actionExecuted')}
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-200/80 px-2.5 py-1 rounded-lg w-full">
                                  <XCircle className="w-4 h-4 text-slate-400" />
                                  {t('aiAgent.actionCancelled')}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 px-1">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-start gap-2 max-w-[80%]">
                    <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 rounded-tl-xs shadow-xs text-xs text-slate-500 flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                      <span>Jarvis is analyzing CRM telemetry...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompts Carousel */}
              <div className="p-2.5 bg-white border-t border-slate-200">
                <div className="text-[11px] font-medium text-slate-500 mb-1.5 px-1 flex items-center justify-between">
                  <span>{t('aiAgent.quickPromptsTitle')}</span>
                  <button
                    onClick={handleClearSession}
                    className="text-slate-400 hover:text-slate-600 text-[10px] flex items-center gap-1"
                    title={t('aiAgent.clearChat')}
                  >
                    <RotateCcw className="w-3 h-3" />
                    {t('aiAgent.clearChat')}
                  </button>
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {[
                    t('aiAgent.prompt1'),
                    t('aiAgent.prompt2'),
                    t('aiAgent.prompt3'),
                    t('aiAgent.prompt4'),
                    t('aiAgent.prompt5')
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendCommand(p)}
                      className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-xs transition-colors border border-slate-200/70"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Bar */}
              <div className="p-3 bg-white border-t border-slate-200">
                {isListening && (
                  <div className="mb-2 p-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center justify-between animate-pulse">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                      <span>{t('aiAgent.voiceListening')}</span>
                    </div>
                    <button
                      onClick={toggleVoiceInput}
                      className="text-xs font-semibold text-red-800 underline"
                    >
                      {t('aiAgent.voiceStop')}
                    </button>
                  </div>
                )}

                {speechError && (
                  <div className="mb-2 p-1.5 rounded bg-amber-50 border border-amber-200 text-[11px] text-amber-700">
                    {speechError}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {/* Voice Button */}
                  <button
                    onClick={toggleVoiceInput}
                    className={`p-2.5 rounded-xl transition-all ${
                      isListening
                        ? 'bg-red-600 text-white ring-2 ring-red-300 animate-pulse'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                    id="ai-voice-input-btn"
                    title={isListening ? t('aiAgent.voiceStop') : t('aiAgent.voiceStart')}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>

                  {/* Text Input */}
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendCommand();
                      }
                    }}
                    placeholder={t('aiAgent.placeholder')}
                    className="flex-1 py-2.5 px-3.5 bg-slate-100 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 placeholder-slate-400"
                    id="ai-agent-input"
                  />

                  {/* Send Button */}
                  <button
                    onClick={() => handleSendCommand()}
                    disabled={!inputText.trim() || isLoading}
                    className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white transition-colors shadow-xs"
                    id="ai-agent-send-btn"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* History & Audit Tab */
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
              {/* Filter and Refresh Bar */}
              <div className="p-3 bg-white border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setAuditFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      auditFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {t('aiAgent.filterAll')}
                  </button>
                  <button
                    onClick={() => setAuditFilter('actions')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      auditFilter === 'actions' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {t('aiAgent.filterActions')}
                  </button>
                  <button
                    onClick={() => setAuditFilter('queries')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      auditFilter === 'queries' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {t('aiAgent.filterQueries')}
                  </button>
                </div>

                <button
                  onClick={loadAuditLogs}
                  disabled={isLoadingAudit}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                  title="Refresh Logs"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingAudit ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Logs List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {filteredLogs.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-sm">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    {t('aiAgent.noAuditLogs')}
                  </div>
                ) : (
                  filteredLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-medium text-slate-900">
                          <span className="font-semibold">{log.actorName}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase font-mono">
                            {log.actorRole}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(log.timestamp).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>

                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 font-mono text-[11px] text-slate-700">
                        &gt; {log.command}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-600">
                        <span>{log.details || log.resultSummary}</span>
                        <span className={`px-2 py-0.5 rounded-full font-medium text-[10px] ${
                          log.status === 'executed' ? 'bg-emerald-100 text-emerald-700' :
                          log.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                          log.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {log.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
