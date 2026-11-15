import React, { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Circle,
  Droplets,
  Film,
  HelpCircle,
  ImagePlus,
  Info,
  Loader2,
  MapPin,
  Maximize2,
  Mic,
  MicOff,
  PanelRightClose,
  PanelRightOpen,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingDown,
  X,
} from 'lucide-react';
import {
  AdvisorSiteAction,
  AreaBreakdown,
  DailyWeatherPoint,
  Language,
  LatLon,
  ScoredCropRecommendation,
  SoilProfile,
  SpectralIndexKey,
  SubZoneSummary,
  UserStudyZone,
  WeeklyChecklistTask,
} from '../types/agro';
import {
  derivePestRiskYieldMetrics,
  evaluateCropWaterDeficit,
  evaluateEnvironmentalDisasterWarnings,
  evaluateFarmWaterBudget,
} from '../utils/agroEngine';
import {
  SharedAdvisorChatHandle,
  useAdvisorChat,
} from '../hooks/useAdvisorChat';
import {
  AdvisorMessageBubble,
  RiskInfoModalPayload,
} from './AdvisorRichMessage';
import { RiskMetricsExplainerModal } from './RiskMetricsExplainerModal';
import { AdvisorRiskInfoModal } from './AdvisorRiskInfoModal';

interface AdvisorConsultantViewProps {
  language: Language;
  hasActiveZones?: boolean;
  zoneNameAr: string;
  zoneNameEn: string;
  centroid?: LatLon;
  currentCropId?: string;
  customCropLabel?: string;
  area: AreaBreakdown;
  soil: SoilProfile;
  farmAverages: Record<SpectralIndexKey, number>;
  subZones: SubZoneSummary[];
  forecast14: DailyWeatherPoint[];
  topCrops: ScoredCropRecommendation[];
  checklist: WeeklyChecklistTask[];
  onToggleChecklistTask: (taskId: string) => void;
  onGoToAtlas?: () => void;
  pendingAdvisorPrompt?: string | null;
  onClearPendingAdvisorPrompt?: () => void;
  zones?: UserStudyZone[];
  activeZoneId?: string | null;
  onExecuteSiteActions?: (actions: AdvisorSiteAction[]) => void;
  onSelectLayerOnMap?: (layer: SpectralIndexKey) => void;
  onAdoptCrop?: (cropId: string, customLabel?: string) => void;
  advisorChat?: SharedAdvisorChatHandle;
  onOpenFullPageChat?: () => void;
}

type DrawerSectionTab = 'risks' | 'telemetry';

export const AdvisorConsultantView: React.FC<AdvisorConsultantViewProps> = ({
  language,
  hasActiveZones = true,
  zoneNameAr,
  zoneNameEn,
  centroid = { lat: 30.45, lng: 31.12 },
  currentCropId = 'wheat',
  customCropLabel,
  area,
  soil,
  farmAverages,
  subZones,
  forecast14,
  topCrops,
  checklist,
  onToggleChecklistTask,
  onGoToAtlas,
  pendingAdvisorPrompt,
  onClearPendingAdvisorPrompt,
  zones = [],
  activeZoneId = null,
  onExecuteSiteActions,
  onSelectLayerOnMap,
  onAdoptCrop,
  advisorChat: externalAdvisorChat,
  onOpenFullPageChat,
}) => {
  const isAr = language === 'ar';
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Use shared chat handle when supplied from App, otherwise fall back to local hook
  const internalAdvisorChat = useAdvisorChat({
    language,
    hasActiveZones,
    zoneNameAr,
    zoneNameEn,
    centroid,
    currentCropId,
    customCropLabel,
    area,
    soil,
    farmAverages,
    subZones,
    forecast14,
    topCrops,
    zones,
    activeZoneId,
    pendingAdvisorPrompt: externalAdvisorChat ? null : pendingAdvisorPrompt,
    onClearPendingAdvisorPrompt: externalAdvisorChat
      ? undefined
      : onClearPendingAdvisorPrompt,
    onExecuteSiteActions,
  });

  const advisorChat = externalAdvisorChat ?? internalAdvisorChat;
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
    regionalPestRisks,
    quickOnDemandChips,
  } = advisorChat;
  const mediaInputRef = useRef<HTMLInputElement | null>(null);

  // Desktop opens intelligence drawer beside spacious chat by default; narrow viewports start full-chat
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );
  const [drawerTab, setDrawerTab] = useState<DrawerSectionTab>('risks');
  const [showQuickPrompts, setShowQuickPrompts] = useState<boolean>(false);
  const [hoveredInfoKey, setHoveredInfoKey] = useState<string | null>(null);
  const [explainerModalState, setExplainerModalState] = useState<{
    isOpen: boolean;
  } & Partial<RiskInfoModalPayload>>({ isOpen: false });
  const [infoModalState, setInfoModalState] = useState<{
    isOpen: boolean;
  } & Partial<RiskInfoModalPayload>>({ isOpen: false });

  const renderMetricInfoTrigger = (
    keyId: string,
    alignSide: 'start' | 'end',
    payload: RiskInfoModalPayload
  ) => {
    const isHovered = hoveredInfoKey === keyId;
    return (
      <span
        className="relative inline-flex items-center shrink-0"
        onMouseEnter={() => setHoveredInfoKey(keyId)}
        onMouseLeave={() =>
          setHoveredInfoKey((prev) => (prev === keyId ? null : prev))
        }
      >
        <button
          type="button"
          data-testid={`info-icon-${keyId}`}
          aria-label={
            isAr
              ? 'معلومات عن مؤشر الخسارة والإنقاذ'
              : 'About Yield Loss and Potential Recovery'
          }
          onMouseEnter={() => setHoveredInfoKey(keyId)}
          onMouseLeave={() =>
            setHoveredInfoKey((prev) => (prev === keyId ? null : prev))
          }
          onFocus={() => setHoveredInfoKey(keyId)}
          onBlur={() =>
            setHoveredInfoKey((prev) => (prev === keyId ? null : prev))
          }
          onClick={(e) => {
            e.stopPropagation();
            setHoveredInfoKey(null);
            setInfoModalState({
              isOpen: true,
              ...payload,
            });
          }}
          className="p-1 rounded-full text-slate-500 hover:text-emerald-600 hover:bg-white/80 dark:text-slate-400 dark:hover:text-emerald-400 dark:hover:bg-slate-800/80 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer transition-colors"
        >
          <Info className="w-3 h-3" />
        </button>

        {isHovered && (
          <div
            role="tooltip"
            data-testid={`info-popover-${keyId}`}
            className={`absolute top-full mt-1.5 ${
              alignSide === 'start' ? 'start-0' : 'end-0'
            } z-50 w-60 p-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white border border-slate-700 shadow-xl text-[11px] font-sans font-normal leading-snug pointer-events-none`}
          >
            {isAr
              ? '«خسارة بدون تدخل» هي الضرر المتوقع من إجمالي المحصول دون تدخل بشري، بينما «الإنقاذ المحتمل» هو المكسب المستعاد من الخسارة عبر الإجراءات الموصى بها (فئتان مستقلتان لا تُجمعان إلى 100%).'
              : '“Yield Loss” is the projected damage without human intervention, while “Potential Recovery” is the gain achievable via recommended actions—distinct metrics that don’t sum to 100%.'}
          </div>
        )}
      </span>
    );
  };

  const environmentalDisasterRisks = useMemo(
    () =>
      evaluateEnvironmentalDisasterWarnings(
        forecast14,
        soil,
        zoneNameAr || 'نطاق مزرعتك المحددة',
        zoneNameEn || 'Active Farm Zone',
        centroid
      ),
    [forecast14, soil, zoneNameAr, zoneNameEn, centroid.lat, centroid.lng]
  );

  const advisorRiskCards = useMemo(() => {
    const hazardCards = environmentalDisasterRisks.slice(0, 2).map((warn) => ({
      id: `hazard-${warn.id}`,
      severity: warn.severity,
      badgeText: `${warn.probabilityPct}%`,
      title: isAr ? warn.titleAr : warn.titleEn,
      subtitle: isAr
        ? `خلال ${warn.countdownHours} ساعة`
        : `In ${warn.countdownHours}h`,
      yieldLossWithoutActionPct: warn.estimatedYieldLossWithoutActionPct,
      mitigatedRecoveryPct: warn.mitigatedYieldSavedPct,
      consultPrompt: isAr ? warn.advisorPromptAr : warn.advisorPromptEn,
    }));

    const topPest = regionalPestRisks[0];
    if (topPest) {
      const pestMetrics = derivePestRiskYieldMetrics(topPest);
      hazardCards.push({
        id: `pest-${topPest.pestId}`,
        severity: topPest.riskLevel === 'critical' ? 'critical' : 'high',
        badgeText: `${topPest.riskScore}%`,
        title: isAr ? `خطر آفة: ${topPest.nameAr}` : `Pest Risk: ${topPest.nameEn}`,
        subtitle: isAr
          ? `انتشار إقليمي ${topPest.regionalPrevalencePct}%`
          : `${topPest.regionalPrevalencePct}% regional prevalence`,
        yieldLossWithoutActionPct: pestMetrics.yieldLossWithoutActionPct,
        mitigatedRecoveryPct: pestMetrics.mitigatedRecoveryPct,
        consultPrompt: isAr
          ? `ما خطة الوقاية والعلاج الفورية لآفة ${topPest.nameAr}؟`
          : `What is the immediate prevention and treatment plan for ${topPest.nameEn}?`,
      });
    }

    return hazardCards;
  }, [environmentalDisasterRisks, regionalPestRisks, isAr]);

  const farmWaterBudget = useMemo(
    () => evaluateFarmWaterBudget(soil, farmAverages, forecast14),
    [soil, farmAverages, forecast14]
  );

  const activeCropRec = useMemo(
    () => topCrops.find((c) => c.crop.id === currentCropId) || topCrops[0] || null,
    [topCrops, currentCropId]
  );

  const activeCropWaterEval = useMemo(
    () => (activeCropRec ? evaluateCropWaterDeficit(activeCropRec, farmWaterBudget) : null),
    [activeCropRec, farmWaterBudget]
  );

  const pendingChecklistCount = useMemo(
    () => checklist.filter((item) => !item.completed).length,
    [checklist]
  );

  const handleSendAndScroll = async (
    queryText: string,
    forcedWidget?: Parameters<typeof sendQuery>[1]
  ) => {
    setShowQuickPrompts(false);
    await sendQuery(queryText, forcedWidget);
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 80);
  };

  return (
    <section
      aria-label="GeoAgri ai"
      data-testid="smart-advisor-clean-workspace"
      className="max-w-7xl mx-auto px-[clamp(0.5rem,1.5vw,1.25rem)] py-[clamp(0.35rem,0.9vh,0.75rem)] flex flex-col h-[calc(100dvh-6.1rem)] min-h-[540px]"
    >
      {/* Full-Height Split Workspace Frame */}
      <div className="flex-1 min-h-0 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        {/* Slim Unified Single-Row Top Bar */}
        <header className="px-3.5 sm:px-5 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-600/12 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  GeoAgri ai
                </h1>
                <span className="hidden md:inline-block text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                  · {isAr ? 'تحكم كامل بالموقع' : 'Full Site Control'}
                </span>
              </div>
              <p className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400 truncate">
                {hasActiveZones
                  ? isAr
                    ? `${zoneNameAr} · ${area.feddans} فدان · NDVI ${farmAverages.NDVI} · رطوبة جذرية ${farmWaterBudget.sm7to28Pct}% · EC ${soil.salinityEC}`
                    : `${zoneNameEn} · ${area.feddans} Fed · NDVI ${farmAverages.NDVI} · Root SM ${farmWaterBudget.sm7to28Pct}% · EC ${soil.salinityEC}`
                  : isAr
                  ? 'اطلب إضافة زونة بالإحداثيات أو المحافظة، أو اسألني أي سؤال زراعي'
                  : 'Ask me to create a study zone or ask any agronomic question'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {(hasActiveZones || checklist.length > 0) && (
              <button
                type="button"
                data-testid="advisor-drawer-toggle-btn"
                aria-expanded={isDrawerOpen}
                onClick={() => setIsDrawerOpen((prev) => !prev)}
                className={`min-h-[34px] px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  isDrawerOpen
                    ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {isDrawerOpen ? (
                  <PanelRightClose className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                ) : (
                  <PanelRightOpen className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                )}
                <span className="hidden sm:inline">
                  {isAr ? 'لوحة المخاطر والمؤشرات' : 'Insights'}
                </span>
                {advisorRiskCards.length > 0 && (
                  <span
                    className="px-1.5 py-0.5 rounded bg-rose-600 text-white font-mono text-[10px] font-bold tabular-nums leading-none"
                    aria-label={isAr ? 'عدد المخاطر' : 'Risk count'}
                  >
                    {advisorRiskCards.length}
                  </span>
                )}
              </button>
            )}

            {onOpenFullPageChat && (
              <button
                type="button"
                data-testid="advisor-expand-fullscreen-chat-btn"
                onClick={onOpenFullPageChat}
                className="min-h-[34px] px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Maximize2 className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">
                  {isAr ? 'صفحة كاملة' : 'Expand'}
                </span>
              </button>
            )}

            {messages.length > 1 && (
              <button
                type="button"
                onClick={resetChat}
                title={isAr ? 'بدء محادثة نظيفة' : 'Reset Chat'}
                className="min-h-[34px] px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden md:inline">{isAr ? 'مسح' : 'Clear'}</span>
              </button>
            )}

            {onGoToAtlas && (
              <button
                type="button"
                onClick={onGoToAtlas}
                className="min-h-[34px] px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
              >
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">{isAr ? 'الخريطة' : 'Atlas'}</span>
              </button>
            )}
          </div>
        </header>

        {/* Main Workspace Split: Full-Height Chat Column + Collapsible Side Intelligence Drawer */}
        <div className="flex-1 min-h-0 flex relative overflow-hidden">
          {/* Primary Column: Spacious Full-Height Conversation Canvas */}
          <div className="flex-1 min-w-0 flex flex-col min-h-0 bg-slate-50/35 dark:bg-slate-950/30">
            <div
              data-testid="advisor-chat-messages-stream"
              className="flex-1 min-h-0 overflow-y-auto px-3.5 sm:px-6 py-5"
            >
              <div className="max-w-3xl mx-auto space-y-5">
                {messages.map((msg) => (
                  <AdvisorMessageBubble
                    key={msg.id}
                    msg={msg}
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
                    onGoToAtlas={onGoToAtlas}
                    onSelectLayerOnMap={onSelectLayerOnMap}
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
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 px-3 py-2">
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

            {/* Bottom Sticky Composer with On-Demand Collapsible Quick Prompts */}
            <div className="shrink-0 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 sm:px-6 py-3">
              <div className="max-w-3xl mx-auto space-y-2.5">
                {showQuickPrompts && (
                  <div
                    data-testid="advisor-quick-chips-bar"
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-1.5"
                  >
                    {quickOnDemandChips.map((chip) => {
                      const Icon = chip.icon;
                      return (
                        <button
                          key={chip.id}
                          type="button"
                          data-testid={chip.id}
                          onClick={() =>
                            void handleSendAndScroll(
                              isAr ? chip.promptAr : chip.promptEn,
                              chip.widget
                            )
                          }
                          disabled={isLoading}
                          className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-emerald-50 dark:bg-slate-900 dark:hover:bg-emerald-950/50 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <Icon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>{isAr ? chip.labelAr : chip.labelEn}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {isListening && (
                  <div
                    data-testid="advisor-voice-listening-banner"
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
                          data-testid="advisor-voice-silence-countdown"
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
                        data-testid="advisor-voice-stop-send-btn"
                        onClick={() => stopVoiceCaptureAndSubmit(true)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-bold cursor-pointer transition-colors"
                      >
                        {isAr ? 'إيقاف وإرسال' : 'Stop & Send'}
                      </button>
                      <button
                        type="button"
                        data-testid="advisor-voice-cancel-btn"
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
                    data-testid="advisor-voice-transcribing-banner"
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
                    data-testid="advisor-voice-error-banner"
                    role="alert"
                    className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/70 flex items-center justify-between gap-2 text-xs text-amber-900 dark:text-amber-200"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span className="truncate">{voiceError}</span>
                    </div>
                    <button
                      type="button"
                      data-testid="advisor-voice-error-dismiss-btn"
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
                    data-testid="advisor-pending-attachment-preview"
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
                      data-testid="advisor-clear-attachment-btn"
                      onClick={clearPendingAttachment}
                      aria-label={isAr ? 'إزالة المرفق' : 'Remove attachment'}
                      className="p-1.5 rounded-lg hover:bg-rose-500/15 text-slate-500 hover:text-rose-600 dark:text-slate-300 transition-colors cursor-pointer shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void handleSendAndScroll(inputVal);
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    ref={mediaInputRef}
                    type="file"
                    accept="image/*,video/*"
                    data-testid="advisor-media-file-input"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      handleSelectMediaFile(file);
                      e.currentTarget.value = '';
                    }}
                  />

                  <button
                    type="button"
                    data-testid="advisor-quick-prompts-toggle"
                    onClick={() => setShowQuickPrompts((prev) => !prev)}
                    aria-expanded={showQuickPrompts}
                    title={isAr ? 'أوامر وتحليلات سريعة' : 'Quick Analysis Actions'}
                    className={`min-h-[42px] px-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                      showQuickPrompts
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-emerald-500/50'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span className="hidden md:inline">
                      {isAr ? 'أوامر سريعة' : 'Quick'}
                    </span>
                  </button>

                  <button
                    type="button"
                    data-testid="advisor-attach-media-btn"
                    onClick={() => mediaInputRef.current?.click()}
                    title={isAr ? 'إرفاق صورة أو فيديو للتحليل' : 'Attach image or video for analysis'}
                    aria-label={isAr ? 'إرفاق صورة أو فيديو للتحليل' : 'Attach image or video for analysis'}
                    className={`min-h-[42px] w-[42px] flex items-center justify-center rounded-xl border transition-all cursor-pointer shrink-0 ${
                      pendingAttachment
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-emerald-500/50'
                    }`}
                  >
                    <ImagePlus className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    data-testid="advisor-voice-input-btn"
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
                    className={`min-h-[42px] w-[42px] flex items-center justify-center rounded-xl border transition-all cursor-pointer shrink-0 disabled:opacity-50 ${
                      isListening
                        ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-emerald-500/50'
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
                    type="text"
                    data-testid="advisor-chat-input"
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    placeholder={
                      isAr
                        ? 'اكتب سؤالك، تحدث بالصوت، أو أرفق صورة/فيديو لتحليلها...'
                        : 'Ask a question, speak by voice, or attach a crop image/video...'
                    }
                    className="flex-1 min-h-[42px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />

                  <button
                    type="submit"
                    data-testid="advisor-chat-submit"
                    disabled={isLoading || (!inputVal.trim() && !pendingAttachment)}
                    className="min-h-[42px] px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isAr ? 'إرسال' : 'Send'}</span>
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Mobile Overlay Backdrop when Drawer is Open */}
          {(hasActiveZones || checklist.length > 0) && isDrawerOpen && (
            <div
              className="fixed inset-0 z-20 bg-slate-950/40 lg:hidden"
              onClick={() => setIsDrawerOpen(false)}
              aria-hidden="true"
            />
          )}

          {/* Collapsible Side Intelligence Drawer (Risks + Soil/Water Telemetry + Weekly Tasks) */}
          {(hasActiveZones || checklist.length > 0) && isDrawerOpen && (
            <aside
              data-testid="advisor-intelligence-drawer"
              aria-label={isAr ? 'لوحة المخاطر والمؤشرات' : 'Risk & Telemetry Insights'}
              className="fixed inset-y-0 end-0 z-30 w-[min(90vw,356px)] lg:static lg:z-auto lg:w-[336px] xl:w-[364px] shrink-0 border-s border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col min-h-0"
            >
              {/* Drawer Header & Segmented View Switcher */}
              <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5 shrink-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>
                      {isAr ? 'الاستخبارات والمخاطر الحية' : 'Live Field Intelligence'}
                    </span>
                  </div>
                  <button
                    type="button"
                    data-testid="advisor-drawer-close-btn"
                    onClick={() => setIsDrawerOpen(false)}
                    aria-label={isAr ? 'طي اللوحة الجانبية' : 'Collapse side panel'}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
                  <button
                    type="button"
                    data-testid="drawer-tab-risks"
                    onClick={() => setDrawerTab('risks')}
                    className={`py-1.5 px-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      drawerTab === 'risks'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200/80 dark:border-slate-700'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span>{isAr ? 'الإنذارات' : 'Risks'}</span>
                    <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-rose-600 text-white tabular-nums">
                      {advisorRiskCards.length}
                    </span>
                  </button>
                  <button
                    type="button"
                    data-testid="drawer-tab-telemetry"
                    onClick={() => setDrawerTab('telemetry')}
                    className={`py-1.5 px-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      drawerTab === 'telemetry'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200/80 dark:border-slate-700'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span>{isAr ? 'المياه والمهام' : 'Water & Tasks'}</span>
                    {pendingChecklistCount > 0 && (
                      <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-emerald-700 text-white tabular-nums">
                        {pendingChecklistCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Drawer Scrollable Content */}
              <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3">
                {drawerTab === 'risks' ? (
                  <>
                    <div className="flex items-center justify-between gap-2 px-1">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        {isAr ? 'الخسارة مقابل الإنقاذ' : 'Loss vs. Recovery'}
                      </span>
                      {advisorRiskCards.length > 0 && (
                        <button
                          type="button"
                          data-testid="advisor-risk-explain-global-btn"
                          onClick={() =>
                            setExplainerModalState({
                              isOpen: true,
                              riskTitle: advisorRiskCards[0].title,
                              yieldLossWithoutActionPct:
                                advisorRiskCards[0].yieldLossWithoutActionPct,
                              mitigatedRecoveryPct: advisorRiskCards[0].mitigatedRecoveryPct,
                            })
                          }
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                        >
                          <HelpCircle className="w-3 h-3 shrink-0" />
                          <span>
                            {isAr ? 'لماذا لا يساوي المجموع 100%؟' : 'Why not 100%?'}
                          </span>
                        </button>
                      )}
                    </div>

                    {advisorRiskCards.length === 0 ? (
                      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-500 dark:text-slate-400 text-center">
                        {isAr
                          ? 'لا توجد إنذارات حرجة للمزرعة النشطة حالياً.'
                          : 'No critical hazards active for this farm.'}
                      </div>
                    ) : (
                      advisorRiskCards.map((card, idx) => {
                        const isCrit = card.severity === 'critical';
                        return (
                          <div
                            key={card.id}
                            data-testid={`advisor-risk-card-${idx}`}
                            className={`rounded-xl border p-3 bg-white dark:bg-slate-900 space-y-2.5 ${
                              isCrit
                                ? 'border-rose-300 dark:border-rose-800/70'
                                : 'border-amber-300/80 dark:border-amber-800/60'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-white tabular-nums ${
                                  isCrit ? 'bg-rose-600' : 'bg-amber-600'
                                }`}
                              >
                                {card.badgeText}
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                                {card.subtitle}
                              </span>
                            </div>

                            <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                              {card.title}
                            </h3>

                            <div className="grid grid-cols-2 gap-1.5 font-mono tabular-nums text-xs">
                              <div className="px-2 py-1.5 rounded-lg bg-rose-50/70 dark:bg-rose-950/25 border border-rose-200 dark:border-rose-800/60">
                                <div className="text-[10px] font-sans text-slate-600 dark:text-slate-300 flex items-center justify-between gap-0.5">
                                  <span className="inline-flex items-center gap-0.5 min-w-0">
                                    <TrendingDown className="w-3 h-3 text-rose-500 shrink-0" />
                                    <span className="truncate">
                                      {isAr ? 'خسارة بدون تدخل' : 'Yield Loss'}
                                    </span>
                                  </span>
                                  {renderMetricInfoTrigger(`card-${idx}-loss`, 'start', {
                                    riskTitle: card.title,
                                    yieldLossWithoutActionPct:
                                      card.yieldLossWithoutActionPct,
                                    mitigatedRecoveryPct: card.mitigatedRecoveryPct,
                                  })}
                                </div>
                                <strong
                                  dir="ltr"
                                  className="inline-block text-rose-600 dark:text-rose-400 mt-0.5"
                                >
                                  -{card.yieldLossWithoutActionPct}%
                                </strong>
                              </div>

                              <div className="px-2 py-1.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-800/60">
                                <div className="text-[10px] font-sans text-slate-600 dark:text-slate-300 flex items-center justify-between gap-0.5">
                                  <span className="inline-flex items-center gap-0.5 min-w-0">
                                    <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                    <span className="truncate">
                                      {isAr ? 'الإنقاذ المحتمل' : 'Recovery'}
                                    </span>
                                  </span>
                                  {renderMetricInfoTrigger(`card-${idx}-recovery`, 'end', {
                                    riskTitle: card.title,
                                    yieldLossWithoutActionPct:
                                      card.yieldLossWithoutActionPct,
                                    mitigatedRecoveryPct: card.mitigatedRecoveryPct,
                                  })}
                                </div>
                                <strong
                                  dir="ltr"
                                  className="inline-block text-emerald-600 dark:text-emerald-400 mt-0.5"
                                >
                                  +{card.mitigatedRecoveryPct}%
                                </strong>
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                              <button
                                type="button"
                                data-testid={`advisor-risk-explain-trigger-${idx}`}
                                onClick={() =>
                                  setExplainerModalState({
                                    isOpen: true,
                                    riskTitle: card.title,
                                    yieldLossWithoutActionPct:
                                      card.yieldLossWithoutActionPct,
                                    mitigatedRecoveryPct: card.mitigatedRecoveryPct,
                                  })
                                }
                                className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                              >
                                <HelpCircle className="w-3 h-3 shrink-0" />
                                <span>{isAr ? 'شرح النسبتين' : 'Explain'}</span>
                              </button>

                              <button
                                type="button"
                                disabled={isLoading}
                                onClick={() => void handleSendAndScroll(card.consultPrompt)}
                                className="px-2.5 py-1 rounded-lg bg-slate-900 dark:bg-slate-800 hover:bg-emerald-700 text-white text-[11px] font-bold cursor-pointer transition-colors disabled:opacity-50"
                              >
                                {isAr ? 'خطة الإنقاذ' : 'Mitigate'}
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </>
                ) : (
                  <div className="space-y-3" data-testid="drawer-telemetry-panel">
                    {/* Soil Moisture & Crop Water Budget Card */}
                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Droplets className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                          <span>
                            {isAr ? 'رطوبة التربة والميزان المائي' : 'Soil Moisture & Water'}
                          </span>
                        </span>
                        <span className="font-mono text-[11px] font-bold text-sky-700 dark:text-sky-400 tabular-nums">
                          {farmWaterBudget.totalAvailableWaterM3PerFeddan.toLocaleString()} m³
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono tabular-nums">
                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/70">
                          <div className="font-sans text-[10px] text-slate-500">
                            {isAr ? 'سطحية 0–7 سم' : 'Surface 0–7cm'}
                          </div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {farmWaterBudget.sm0to7Pct}%
                          </div>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/70">
                          <div className="font-sans text-[10px] text-slate-500">
                            {isAr ? 'جذرية 7–28 سم' : 'Root 7–28cm'}
                          </div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {farmWaterBudget.sm7to28Pct}%
                          </div>
                        </div>
                      </div>

                      {activeCropRec && activeCropWaterEval && (
                        <div
                          className={`p-2 rounded-lg border text-[11px] space-y-1.5 ${
                            activeCropWaterEval.status === 'deficit'
                              ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                              : activeCropWaterEval.status === 'tight'
                              ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                              : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                          }`}
                        >
                          <div className="font-bold flex items-center justify-between gap-1">
                            <span className="truncate">
                              {isAr ? activeCropRec.crop.nameAr : activeCropRec.crop.nameEn}
                            </span>
                            <span className="font-mono tabular-nums shrink-0" dir="ltr">
                              {activeCropWaterEval.requiredM3PerFeddan} /{' '}
                              {activeCropWaterEval.availableM3PerFeddan} m³
                            </span>
                          </div>
                          {activeCropWaterEval.status !== 'safe' && (
                            <button
                              type="button"
                              disabled={isLoading}
                              onClick={() =>
                                void handleSendAndScroll(
                                  isAr
                                    ? `لدي عجز مائي لمحصول ${activeCropRec.crop.nameAr} (${activeCropWaterEval.deficitM3PerFeddan} م³/فدان). ما تعديل جدول الري الأنسب؟`
                                    : `Water deficit detected for ${activeCropRec.crop.nameEn} (-${activeCropWaterEval.deficitM3PerFeddan} m³/fed). How should I adjust irrigation?`
                                )
                              }
                              className="w-full py-1 px-2 rounded bg-slate-900 dark:bg-slate-800 text-white text-[10px] font-bold hover:bg-emerald-700 cursor-pointer"
                            >
                              {isAr
                                ? 'اطلب خطة معالجة العجز المائي'
                                : 'Ask Advisor to Resolve Deficit'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Weekly Field Checklist */}
                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                        <span>{isAr ? 'مهام الأسبوع الحقلية' : 'Weekly Field Tasks'}</span>
                        <span className="font-mono text-[10px] text-slate-500 tabular-nums">
                          {checklist.filter((t) => t.completed).length}/{checklist.length}
                        </span>
                      </div>

                      <div className="space-y-1.5" data-testid="drawer-weekly-checklist-list">
                        {checklist.length === 0 ? (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 py-2 text-center">
                            {isAr
                              ? 'لا توجد مهام حقلية حالياً — اطلب من GeoAgri ai إضافة مهمة.'
                              : 'No weekly tasks yet — ask GeoAgri ai to add one.'}
                          </p>
                        ) : (
                          checklist.slice(0, 15).map((task) => (
                            <button
                              key={task.id}
                              type="button"
                              onClick={() => onToggleChecklistTask(task.id)}
                              className="w-full text-start p-2 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-start gap-2 cursor-pointer transition-colors"
                            >
                              {task.completed ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              ) : (
                                <Circle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                              )}
                              <div className="min-w-0">
                                <div
                                  className={`text-[11px] font-semibold ${
                                    task.completed
                                      ? 'line-through text-slate-400'
                                      : 'text-slate-800 dark:text-slate-200'
                                  }`}
                                >
                                  {isAr ? task.titleAr : task.titleEn}
                                </div>
                                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                  {isAr ? task.dayAr : task.dayEn}
                                </div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </aside>
          )}
        </div>
      </div>

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
    </section>
  );
};
