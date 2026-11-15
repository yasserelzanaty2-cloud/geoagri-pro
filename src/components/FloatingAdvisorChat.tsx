import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  ChevronDown,
  ChevronUp,
  Film,
  ImagePlus,
  Key,
  Loader2,
  MapPin,
  Mic,
  MicOff,
  Minimize2,
  Send,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import {
  AreaBreakdown,
  DailyWeatherPoint,
  Language,
  LatLon,
  ScoredCropRecommendation,
  SpectralIndexKey,
  SubZoneSummary,
  WeeklyChecklistTask,
} from '../types/agro';
import { SharedAdvisorChatHandle } from '../hooks/useAdvisorChat';
import {
  AdvisorMessageBubble,
  RiskInfoModalPayload,
} from './AdvisorRichMessage';
import { RiskMetricsExplainerModal } from './RiskMetricsExplainerModal';
import { AdvisorRiskInfoModal } from './AdvisorRiskInfoModal';
import { GeminiApiKeyModal } from './GeminiApiKeyModal';
import { hasGeminiApiKey } from '../services/geminiService';

interface FloatingAdvisorChatProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  hideBubble?: boolean;
  isAtlasTab?: boolean;
  language: Language;
  hasActiveZones: boolean;
  zoneNameAr: string;
  zoneNameEn: string;
  centroid: LatLon;
  currentCropId: string;
  customCropLabel?: string;
  area: AreaBreakdown;
  farmAverages: Record<SpectralIndexKey, number>;
  soilSalinityEC: number;
  subZones: SubZoneSummary[];
  forecast14: DailyWeatherPoint[];
  topCrops: ScoredCropRecommendation[];
  checklist: WeeklyChecklistTask[];
  advisorChat: SharedAdvisorChatHandle;
  onToggleChecklistTask: (taskId: string) => void;
  onGoToAtlas?: () => void;
  onSelectLayerOnMap?: (layer: SpectralIndexKey) => void;
  onAdoptCrop?: (cropId: string, customLabel?: string) => void;
}

const BUBBLE_SIZE = 44;
const EDGE_PADDING = 8;
const DEFAULT_MARGIN_EDGE = 16;

function clampBubblePosition(x: number, y: number) {
  if (typeof window === 'undefined') return { x: 16, y: 16 };
  const minX = EDGE_PADDING;
  const maxX = Math.max(minX, window.innerWidth - BUBBLE_SIZE - EDGE_PADDING);
  const minY = EDGE_PADDING;
  const maxY = Math.max(minY, window.innerHeight - BUBBLE_SIZE - EDGE_PADDING);
  return {
    x: Math.max(minX, Math.min(maxX, x)),
    y: Math.max(minY, Math.min(maxY, y)),
  };
}

function getDefaultBottomRightPos(): { x: number; y: number } {
  if (typeof window === 'undefined') return { x: 1200, y: 760 };
  return {
    x: Math.max(EDGE_PADDING, window.innerWidth - BUBBLE_SIZE - DEFAULT_MARGIN_EDGE),
    y: Math.max(EDGE_PADDING, window.innerHeight - BUBBLE_SIZE - DEFAULT_MARGIN_EDGE),
  };
}

export const FloatingAdvisorChat: React.FC<FloatingAdvisorChatProps> = ({
  isOpen,
  onOpenChange,
  hideBubble = false,
  isAtlasTab = false,
  language,
  hasActiveZones,
  zoneNameAr,
  zoneNameEn,
  centroid,
  currentCropId,
  customCropLabel,
  area,
  farmAverages,
  soilSalinityEC,
  subZones,
  forecast14,
  topCrops,
  checklist,
  advisorChat,
  onToggleChecklistTask,
  onGoToAtlas,
  onSelectLayerOnMap,
  onAdoptCrop,
}) => {
  const isAr = language === 'ar';
  const [showQuickChips, setShowQuickChips] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [hasUserMoved, setHasUserMoved] = useState<boolean>(false);
  const [bubblePos, setBubblePos] = useState<{ x: number; y: number }>(getDefaultBottomRightPos);

  const dragRef = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    moved: boolean;
  } | null>(null);

  const [explainerModalState, setExplainerModalState] = useState<{
    isOpen: boolean;
  } & Partial<RiskInfoModalPayload>>({ isOpen: false });
  const [infoModalState, setInfoModalState] = useState<{
    isOpen: boolean;
  } & Partial<RiskInfoModalPayload>>({ isOpen: false });
  const [showGeminiModal, setShowGeminiModal] = useState<boolean>(false);

  // Keep bubble anchored in the bottom-right corner on resize until the user manually drags it
  useEffect(() => {
    const handleResize = () => {
      setBubblePos((prev) => {
        if (!hasUserMoved) {
          return getDefaultBottomRightPos();
        }
        return clampBubblePosition(prev.x, prev.y);
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [hasUserMoved]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 60);
    return () => clearTimeout(timer);
  }, [isOpen, advisorChat.messages.length, advisorChat.isLoading]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (explainerModalState.isOpen || infoModalState.isOpen) return;
        onOpenChange(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onOpenChange, explainerModalState.isOpen, infoModalState.isOpen]);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: bubblePos.x,
      origY: bubblePos.y,
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) > 5) {
      drag.moved = true;
      setHasUserMoved(true);
    }
    if (drag.moved) {
      setBubblePos(clampBubblePosition(drag.origX + dx, drag.origY + dy));
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    dragRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    if (drag && !drag.moved) {
      onOpenChange(true);
    }
  };

  const {
    messages,
    inputVal,
    setInputVal,
    isLoading,
    isListening,
    isTranscribing,
    silenceCountdownSec,
    voiceError,
    clearVoiceError,
    pendingAttachment,
    handleSelectMediaFile,
    clearPendingAttachment,
    sendQuery,
    resetChat,
    handleVoiceInput,
    stopVoiceCaptureAndSubmit,
    quickOnDemandChips,
  } = advisorChat;
  const mediaInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <>
      {/* Draggable Floating AI Bubble */}
      {!isOpen && !hideBubble && (
        <div
          className="fixed z-[85] pointer-events-auto"
          style={{ left: `${bubblePos.x}px`, top: `${bubblePos.y}px` }}
        >
          <button
            type="button"
            data-testid="floating-ai-chat-bubble"
            aria-label={
              isAr
                ? 'فتح GeoAgri ai في صفحة كبيرة'
                : 'Open GeoAgri ai in full-page chat'
            }
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpenChange(true);
              }
            }}
            className="relative w-[44px] h-[44px] rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40 border-2 border-white/90 dark:border-slate-800 flex flex-col items-center justify-center touch-none select-none cursor-grab active:cursor-grabbing transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            <Bot className="w-4.5 h-4.5 text-white" />
            <span className="text-[6.5px] font-mono font-bold leading-none mt-0.5 tracking-tight text-white/95">
              GeoAgri
            </span>
            {messages.length > 1 && (
              <span
                aria-hidden="true"
                className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-slate-900 dark:bg-emerald-300 text-white dark:text-slate-950 text-[9px] font-mono font-bold flex items-center justify-center border border-white dark:border-slate-900 shadow-sm"
              >
                {messages.length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Spacious Full-Page AI Chat Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[90] bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={
            isAr
              ? 'محادثة GeoAgri ai بصفحة كبيرة'
              : 'GeoAgri ai Full-Page Chat'
          }
          data-testid="floating-ai-chat-expanded-page"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onOpenChange(false);
            }
          }}
        >
          <div className="w-full h-full max-w-6xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Compact 1-Line Top Bar */}
            <header className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-950/90 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                      GeoAgri ai
                    </h2>
                    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                      <Sparkles className="w-3 h-3" />
                      <span>{isAr ? 'تحكم كامل بالموقع' : 'Full Site Control'}</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {hasActiveZones
                      ? isAr
                        ? `${zoneNameAr} · ${area.feddans} فدان · NDVI ${farmAverages.NDVI} · ملوحة ${soilSalinityEC} dS/m`
                        : `${zoneNameEn} · ${area.feddans} Feddans · NDVI ${farmAverages.NDVI} · EC ${soilSalinityEC} dS/m`
                      : isAr
                      ? 'متصل بكامل أدوات المنصة — اسألني أو اطلب إضافة زونة جديدة'
                      : 'Connected to platform controls — ask or create study zones'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowGeminiModal(true)}
                  title={isAr ? 'إعدادات ذكاء Google Gemini 2.5 Flash' : 'Google Gemini 2.5 Flash Settings'}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition ${
                    hasGeminiApiKey()
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-500/40'
                  }`}
                >
                  <Key className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden sm:inline">
                    {hasGeminiApiKey()
                      ? isAr
                        ? 'Gemini 2.5 Flash'
                        : 'Gemini 2.5 Flash'
                      : isAr
                      ? 'تفعيل Gemini'
                      : 'Gemini AI'}
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      hasGeminiApiKey() ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
                    }`}
                  />
                </button>

                <button
                  type="button"
                  data-testid="floating-chat-toggle-chips-btn"
                  onClick={() => setShowQuickChips((prev) => !prev)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1 cursor-pointer"
                >
                  <span>{isAr ? 'أوامر سريعة' : 'Quick Actions'}</span>
                  {showQuickChips ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>

                {messages.length > 1 && (
                  <button
                    type="button"
                    onClick={resetChat}
                    title={isAr ? 'بدء محادثة جديدة' : 'Clear Chat'}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{isAr ? 'مسح' : 'Clear'}</span>
                  </button>
                )}

                {onGoToAtlas && (
                  <button
                    type="button"
                    onClick={() => {
                      onGoToAtlas();
                      onOpenChange(false);
                    }}
                    className="hidden sm:inline-flex px-2.5 py-1.5 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold items-center gap-1 cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{isAr ? 'الخريطة' : 'Atlas'}</span>
                  </button>
                )}

                <button
                  type="button"
                  data-testid="floating-ai-chat-close-btn"
                  aria-label={isAr ? 'تصغير وإغلاق صفحة الشات' : 'Minimize and close chat'}
                  onClick={() => onOpenChange(false)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Minimize2 className="w-3.5 h-3.5 hidden sm:inline" />
                  <X className="w-3.5 h-3.5 sm:hidden" />
                  <span className="hidden sm:inline">{isAr ? 'تصغير' : 'Minimize'}</span>
                </button>
              </div>
            </header>

            {/* Optional Collapsible 1-Row Quick Chips Strip */}
            {showQuickChips && (
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                {quickOnDemandChips.map((chip) => {
                  const Icon = chip.icon;
                  return (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => {
                        void sendQuery(isAr ? chip.promptAr : chip.promptEn, chip.widget);
                        setShowQuickChips(false);
                      }}
                      disabled={isLoading}
                      className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-emerald-50 dark:bg-slate-800/90 dark:hover:bg-emerald-950/50 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Icon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{isAr ? chip.labelAr : chip.labelEn}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Large Centered Chat Reading Stream */}
            <div
              data-testid="floating-ai-chat-messages-stream"
              className="flex-1 overflow-y-auto px-3 sm:px-8 py-5 bg-slate-50/50 dark:bg-slate-950/40"
            >
              <div className="max-w-4xl mx-auto space-y-5">
                {messages.map((msg) => (
                  <AdvisorMessageBubble
                    key={msg.id}
                    msg={msg}
                    spacious
                    language={language}
                    hasActiveZones={hasActiveZones}
                    centroid={centroid}
                    currentCropId={currentCropId}
                    customCropLabel={customCropLabel}
                    subZones={subZones}
                    forecast14={forecast14}
                    topCrops={topCrops}
                    checklist={checklist}
                    advisorChat={advisorChat}
                    onToggleChecklistTask={onToggleChecklistTask}
                    onGoToAtlas={() => {
                      onGoToAtlas?.();
                      onOpenChange(false);
                    }}
                    onSelectLayerOnMap={(layer) => {
                      onSelectLayerOnMap?.(layer);
                      onOpenChange(false);
                    }}
                    onAdoptCrop={onAdoptCrop}
                    onOpenRiskInfo={(payload) =>
                      setInfoModalState({ isOpen: true, ...payload })
                    }
                    onOpenRiskExplainer={(payload) =>
                      setExplainerModalState({ isOpen: true, ...payload })
                    }
                  />
                ))}

                {isLoading && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 px-3 py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                    <span>
                      {isAr
                        ? 'جاري تحليل قراءات الأقمار الصناعية والطقس وتنفيذ الأوامر...'
                        : 'Analyzing live satellite telemetry and executing commands...'}
                    </span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            </div>

            {/* Bottom Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void sendQuery(inputVal);
              }}
              className="px-3 sm:px-8 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0"
            >
              <div className="max-w-4xl mx-auto space-y-2.5">
                {isListening && (
                  <div
                    data-testid="floating-chat-voice-listening-banner"
                    className="px-3 py-2 rounded-xl bg-rose-50/90 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800/70 flex flex-wrap items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2 text-rose-800 dark:text-rose-200 font-semibold min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping shrink-0" />
                      <span className="truncate">
                        {isAr
                          ? 'جاري الاستماع لكل كلمة... سيتم الإرسال تلقائياً بعد 3 ثوانٍ من الصمت أو عند إغلاق الميكروفون'
                          : 'Listening to every word... auto-sends after 3s of silence or when you stop'}
                      </span>
                      {silenceCountdownSec !== null && (
                        <span
                          data-testid="floating-chat-voice-silence-countdown"
                          className="px-2 py-0.5 rounded-md bg-rose-600 text-white font-mono text-[11px] font-bold tabular-nums shrink-0"
                        >
                          {isAr
                            ? `إرسال خلال ${silenceCountdownSec}ث`
                            : `Sending in ${silenceCountdownSec}s`}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        data-testid="floating-chat-voice-stop-send-btn"
                        onClick={() => stopVoiceCaptureAndSubmit(true)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-bold cursor-pointer transition-colors"
                      >
                        {isAr ? 'إيقاف وإرسال' : 'Stop & Send'}
                      </button>
                      <button
                        type="button"
                        data-testid="floating-chat-voice-cancel-btn"
                        onClick={() => stopVoiceCaptureAndSubmit(false)}
                        aria-label={isAr ? 'إلغاء التسجيل الصوتي' : 'Cancel voice input'}
                        className="p-1 rounded-lg border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {isTranscribing && (
                  <div
                    data-testid="floating-chat-voice-transcribing-banner"
                    className="px-3 py-2 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/35 border border-emerald-500/40 flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-200"
                  >
                    <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                    <span>
                      {isAr
                        ? 'جاري تحويل الصوت إلى نص بدقة...'
                        : 'Transcribing captured speech accurately...'}
                    </span>
                  </div>
                )}

                {voiceError && (
                  <div
                    data-testid="floating-chat-voice-error-banner"
                    role="alert"
                    className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/70 flex items-center justify-between gap-2 text-xs text-amber-900 dark:text-amber-200"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span className="truncate">{voiceError}</span>
                    </div>
                    <button
                      type="button"
                      data-testid="floating-chat-voice-error-dismiss-btn"
                      onClick={clearVoiceError}
                      aria-label={isAr ? 'إغلاق التنبيه' : 'Dismiss alert'}
                      className="p-1 rounded-lg hover:bg-amber-200/50 dark:hover:bg-amber-900/50 cursor-pointer shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {pendingAttachment && (
                  <div
                    data-testid="floating-chat-pending-attachment-preview"
                    className="p-2 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/35 border border-emerald-500/40 flex items-center justify-between gap-2.5"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {pendingAttachment.mediaType === 'video' ? (
                        <div className="w-10 h-10 rounded-lg bg-slate-900 text-emerald-400 flex items-center justify-center shrink-0">
                          <Film className="w-5 h-5" />
                        </div>
                      ) : (
                        <img
                          src={pendingAttachment.previewUrl}
                          alt={pendingAttachment.fileName}
                          className="w-10 h-10 rounded-lg object-cover border border-emerald-500/40 shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {pendingAttachment.fileName}
                        </div>
                        <div className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300">
                          {pendingAttachment.mediaType === 'video'
                            ? isAr
                              ? 'فيديو جاهز للتحليل البصري'
                              : 'Video ready for visual diagnosis'
                            : isAr
                            ? 'صورة جاهزة للتحليل البصري'
                            : 'Image ready for visual diagnosis'}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      data-testid="floating-chat-clear-attachment-btn"
                      onClick={clearPendingAttachment}
                      aria-label={isAr ? 'إزالة المرفق' : 'Remove attachment'}
                      className="p-1.5 rounded-lg hover:bg-rose-500/15 text-slate-500 hover:text-rose-600 dark:text-slate-300 transition-colors cursor-pointer shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    ref={mediaInputRef}
                    type="file"
                    accept="image/*,video/*"
                    data-testid="floating-chat-media-file-input"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      handleSelectMediaFile(file);
                      e.currentTarget.value = '';
                    }}
                  />

                  <button
                    type="button"
                    data-testid="floating-chat-attach-media-btn"
                    onClick={() => mediaInputRef.current?.click()}
                    title={isAr ? 'إرفاق صورة أو فيديو للتحليل' : 'Attach image or video for analysis'}
                    aria-label={isAr ? 'إرفاق صورة أو فيديو للتحليل' : 'Attach image or video for analysis'}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
                      pendingAttachment
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-emerald-500/50'
                    }`}
                  >
                    <ImagePlus className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    data-testid="floating-chat-voice-input-btn"
                    aria-pressed={isListening}
                    disabled={isTranscribing}
                    onClick={handleVoiceInput}
                    title={
                      isListening
                        ? isAr
                          ? 'إيقاف الميكروفون وإرسال الكلام'
                          : 'Stop mic and send speech'
                        : isAr
                        ? 'تحدث بالصوت إلى GeoAgri ai'
                        : 'Voice Input to GeoAgri ai'
                    }
                    aria-label={
                      isListening
                        ? isAr
                          ? 'إيقاف الميكروفون وإرسال الكلام'
                          : 'Stop mic and send speech'
                        : isAr
                        ? 'تحدث بالصوت إلى GeoAgri ai'
                        : 'Voice Input to GeoAgri ai'
                    }
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer shrink-0 disabled:opacity-50 ${
                      isListening
                        ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-emerald-500/50'
                    }`}
                  >
                    {isTranscribing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isListening ? (
                      <MicOff className="w-4 h-4" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </button>

                  <input
                    ref={inputRef}
                    type="text"
                    data-testid="floating-ai-chat-input"
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    placeholder={
                      isAr
                        ? 'اكتب سؤالك، تحدث بالصوت، أو أرفق صورة/فيديو لتحليلها...'
                        : 'Ask a question, speak by voice, or attach a crop image/video...'
                    }
                    className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />

                  <button
                    type="submit"
                    data-testid="floating-ai-chat-submit"
                    disabled={isLoading || (!inputVal.trim() && !pendingAttachment)}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isAr ? 'إرسال' : 'Send'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <RiskMetricsExplainerModal
        isOpen={explainerModalState.isOpen}
        language={language}
        riskTitle={explainerModalState.riskTitle}
        yieldLossWithoutActionPct={explainerModalState.yieldLossWithoutActionPct}
        mitigatedRecoveryPct={explainerModalState.mitigatedRecoveryPct}
        onClose={() => setExplainerModalState((prev) => ({ ...prev, isOpen: false }))}
      />

      <AdvisorRiskInfoModal
        isOpen={infoModalState.isOpen}
        language={language}
        riskTitle={infoModalState.riskTitle}
        yieldLossWithoutActionPct={infoModalState.yieldLossWithoutActionPct}
        mitigatedRecoveryPct={infoModalState.mitigatedRecoveryPct}
        onClose={() => setInfoModalState((prev) => ({ ...prev, isOpen: false }))}
      />

      <GeminiApiKeyModal
        isOpen={showGeminiModal}
        language={language}
        onClose={() => setShowGeminiModal(false)}
      />
    </>
  );
};
