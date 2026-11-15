import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  Bug,
  CheckCircle2,
  Compass,
  FlaskConical,
  MapPin,
  PlusCircle,
  Sprout,
} from 'lucide-react';
import {
  AdvisorInlineWidgetType,
  AdvisorMediaAttachment,
  AdvisorMessage,
  AdvisorSiteAction,
  AreaBreakdown,
  DailyWeatherPoint,
  Language,
  LatLon,
  LoggedPestIncident,
  MainTabId,
  PestSeverity,
  RegionalPestRiskWarning,
  ScoredCropRecommendation,
  SoilProfile,
  SpectralIndexKey,
  SubZoneSummary,
  ThematicMapLayerId,
  UserStudyZone,
  WeeklyChecklistTask,
} from '../types/agro';
import {
  CROP_DATABASE,
  calculateFourWeekNpkSchedule,
  calculateGrowthStageAndGDD,
  createLoggedPestIncident,
  evaluateRegionalPestRisks,
} from '../utils/agroEngine';
import { evaluateAdvisorAgenticTurn } from '../utils/advisorCommandEngine';
import { AdvisorSiteInventory } from '../utils/advisorToolMapper';
import {
  SpeechResultListLike,
  combineVoiceTranscript,
  extractTranscriptFromResults,
} from '../utils/voiceTranscriptHelper';

const VOICE_SILENCE_AUTO_STOP_MS = 3000;

interface BrowserSpeechRecognitionEvent {
  resultIndex?: number;
  results: SpeechResultListLike;
}

interface BrowserSpeechRecognitionErrorEvent {
  error?: string;
}

interface BrowserSpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  onspeechstart?: (() => void) | null;
  onspeechend?: (() => void) | null;
  onerror: ((event?: BrowserSpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort?: () => void;
}

export interface AdvisorQuickChip {
  id: string;
  labelAr: string;
  labelEn: string;
  promptAr: string;
  promptEn: string;
  widget?: AdvisorInlineWidgetType;
  icon: React.ComponentType<{ className?: string }>;
}

export function getSubZoneCoordinates(
  baseCentroid: LatLon,
  subZoneId: 'A' | 'B' | 'C'
): LatLon {
  if (subZoneId === 'A') {
    return {
      lat: Number((baseCentroid.lat + 0.0012).toFixed(4)),
      lng: Number((baseCentroid.lng + 0.0014).toFixed(4)),
    };
  }
  if (subZoneId === 'C') {
    return {
      lat: Number((baseCentroid.lat - 0.0012).toFixed(4)),
      lng: Number((baseCentroid.lng - 0.0014).toFixed(4)),
    };
  }
  return {
    lat: Number(baseCentroid.lat.toFixed(4)),
    lng: Number(baseCentroid.lng.toFixed(4)),
  };
}

export interface UseAdvisorChatParams {
  language: Language;
  hasActiveZones: boolean;
  zoneNameAr: string;
  zoneNameEn: string;
  centroid: LatLon;
  currentCropId: string;
  customCropLabel?: string;
  area: AreaBreakdown;
  soil: SoilProfile;
  farmAverages: Record<SpectralIndexKey, number>;
  subZones: SubZoneSummary[];
  forecast14: DailyWeatherPoint[];
  topCrops: ScoredCropRecommendation[];
  zones: UserStudyZone[];
  activeZoneId: string | null;
  checklist?: WeeklyChecklistTask[];
  darkMode?: boolean;
  activeTab?: MainTabId;
  activeLayer?: SpectralIndexKey;
  activeThematicMap?: ThematicMapLayerId;
  drawnVerticesCount?: number;
  pushNotificationsEnabled?: boolean;
  comparedZoneIds?: string[];
  pendingAdvisorPrompt?: string | null;
  onClearPendingAdvisorPrompt?: () => void;
  onExecuteSiteActions?: (actions: AdvisorSiteAction[]) => void;
}

export function useAdvisorChat({
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
  checklist = [],
  darkMode = false,
  activeTab = 'advisor',
  activeLayer = 'NDVI',
  activeThematicMap = 'natural',
  drawnVerticesCount = 0,
  pushNotificationsEnabled = false,
  comparedZoneIds = [],
  pendingAdvisorPrompt,
  onClearPendingAdvisorPrompt,
  onExecuteSiteActions,
}: UseAdvisorChatParams) {
  const isAr = language === 'ar';
  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [silenceCountdownSec, setSilenceCountdownSec] = useState<number | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [pendingAttachment, setPendingAttachment] = useState<AdvisorMediaAttachment | null>(null);

  const recognitionRef = useRef<BrowserSpeechRecognitionInstance | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const silenceMonitorIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastActivityTsRef = useRef<number>(0);
  const isListeningRef = useRef(false);
  const manualStopRef = useRef(false);
  const shouldSubmitMediaRef = useRef(true);
  const prefixTextRef = useRef('');
  const currentSegmentFinalRef = useRef('');
  const latestTranscriptRef = useRef('');
  const hasSpokenRef = useRef(false);
  const sendQueryRef = useRef<
    (
      queryText: string,
      forcedWidget?: AdvisorInlineWidgetType,
      attachmentOverride?: AdvisorMediaAttachment | null
    ) => Promise<void>
  >(async () => {});

  const [selectedPestId, setSelectedPestId] = useState<string>('fall_armyworm');
  const [selectedSubZone, setSelectedSubZone] = useState<'A' | 'B' | 'C'>('A');
  const [selectedSeverity, setSelectedSeverity] = useState<PestSeverity>('high');
  const [incidentNotes, setIncidentNotes] = useState<string>('');
  const [loggedIncidents, setLoggedIncidents] = useState<LoggedPestIncident[]>(() => [
    createLoggedPestIncident({
      pestId: 'fall_armyworm',
      subZoneId: 'A',
      severity: 'high',
      notes:
        language === 'ar'
          ? 'بؤرة أولية مرصودة عند أطراف الزونا الشمالية الشرقية'
          : 'Initial focus scouted along North-East sector edge',
      centroid: getSubZoneCoordinates(centroid, 'A'),
      forecast14,
      regionalPrevalencePct: 74,
    }),
  ]);

  const activeCropObj = useMemo(
    () => CROP_DATABASE.find((c) => c.id === currentCropId) || CROP_DATABASE[0],
    [currentCropId]
  );

  const growthStage = useMemo(
    () => calculateGrowthStageAndGDD(currentCropId, '2026-10-15', farmAverages.NDVI),
    [currentCropId, farmAverages.NDVI]
  );

  const npkSchedule = useMemo(
    () =>
      calculateFourWeekNpkSchedule({
        cropId: currentCropId,
        soilTexture: soil.texture,
        soilPh: soil.ph,
        salinityEC: soil.salinityEC,
        irrigation: soil.irrigation,
        accumulatedGDD: growthStage.accumulatedGDD,
        areaFeddans: Math.max(1, area.totalFeddansDecimal),
      }),
    [currentCropId, soil, growthStage.accumulatedGDD, area.totalFeddansDecimal]
  );

  const regionalPestRisks: RegionalPestRiskWarning[] = useMemo(
    () => evaluateRegionalPestRisks(centroid, soil, forecast14, currentCropId, farmAverages),
    [centroid.lat, centroid.lng, currentCropId, soil, farmAverages, forecast14]
  );

  const buildWelcomeMessage = (): AdvisorMessage => {
    if (!hasActiveZones) {
      return {
        id: 'msg-init-zero',
        sender: 'advisor',
        timestamp: '09:00',
        sourceMode: 'local_scientific_engine',
        text: isAr
          ? `مرحباً بك في **GeoAgri ai** — تحكم كامل وفوري بالموقع بالمحادثة الكتابية.
• **تحدث بالصوت أو أرسل صوراً وفيديو:** يمكنك التحدث عبر الميكروفون أو إرفاق **صورة أو فيديو** للنبات أو التربة لتحليلها كتابياً فوراً.
• **إنشاء المزارع بالأوامر:** اطلب مثلاً *"أضف منطقة زراعية في كفر الشيخ 50 فدان تربة طينية محصول قمح"* أو بالإحداثيات *"أضف مزرعة عند 26.054, 32.241 بمساحة 80 فدان ري بالتنقيط"*.
• **التحكم الشامل:** يمكنك أمري بتبديل طبقات الخريطة (` +
            '`NDVI`, `NDWI`, `LST`, `DEM`' +
            `)، فتح أي تبويب، أو الإجابة السريعة بالأرقام عن أي استشارة زراعية.`
          : `Welcome to **GeoAgri ai** — Full Programmatic Site Control & Written Agronomy Chat.
• **Voice Input & Image/Video Analysis:** Speak via microphone or attach a **photo or video** of your crop/soil for instant written diagnosis.
• **Create Zones via Chat:** Try *"Add a 50 feddan wheat farm in Kafr El Sheikh with clay soil"* or *"Create a 65 feddan farm at 26.054, 32.241 with drip irrigation"*.
• **Full Platform Control:** Ask me to switch map layers, navigate tabs, export PDF reports, or answer any agronomic question with concise numbers.`,
        metricsCited: ['GeoAgri ai', isAr ? 'تحليل صور وفيديو + تحكم كامل' : 'Media Analysis + Full Control'],
      };
    }

    const bestCrop = topCrops[0];
    return {
      id: 'msg-init-active',
      sender: 'advisor',
      timestamp: '09:00',
      sourceMode: 'local_scientific_engine',
      text: isAr
        ? `مرحباً بك في **GeoAgri ai**! الملخص التنفيذي الحي لمزرعتك **${zoneNameAr}** (${area.feddans} فدان و${area.qirats} قيراط — المحصول: **${customCropLabel || activeCropObj.nameAr}**):
• **المؤشرات الفضائية والتربة:** NDVI **${farmAverages.NDVI}** · NDWI **${farmAverages.NDWI}** · حرارة الأوراق LST **${farmAverages.LST}°م** · ملوحة التربة **${soil.salinityEC} dS/m** · pH **${soil.ph}**.
• **أعلى محصول متوافق للموسم:** **${bestCrop?.crop.nameAr || activeCropObj.nameAr}** (${bestCrop?.suitabilityScore ?? 92}%).
• **تحليل الصور والفيديو + تحكم فوري بالموقع:** أرفق صورة أو فيديو للمحصول لتحليلها كتابياً، أو اطلب مني مباشرة إضافة زونة، تعديل التربة/الملوحة/الري/المحصول، تبديل طبقات الخريطة، الانتقال لأي قسم، أو تصدير تقرير PDF.`
        : `Welcome to **GeoAgri ai**! Executive telemetry for **${zoneNameEn}** (${area.feddans} Feddans, ${area.qirats} Qirats — Crop: **${customCropLabel || activeCropObj.nameEn}**):
• **Live Satellite & Soil Metrics:** NDVI **${farmAverages.NDVI}** · NDWI **${farmAverages.NDWI}** · Canopy LST **${farmAverages.LST}°C** · Soil EC **${soil.salinityEC} dS/m** · pH **${soil.ph}**.
• **Top Seasonal Match:** **${bestCrop?.crop.nameEn || activeCropObj.nameEn}** (${bestCrop?.suitabilityScore ?? 92}%).
• **Image/Video Diagnosis + Full Site Control:** Attach a crop photo or video for written analysis, or command me to add/switch zones, update soil/EC/irrigation/crop, switch map layers, navigate tabs, or export PDF reports.`,
      metricsCited: [
        'GeoAgri ai',
        `NDVI ${farmAverages.NDVI}`,
        `NDWI ${farmAverages.NDWI}`,
        `EC ${soil.salinityEC} dS/m`,
        `${area.feddans} ${isAr ? 'فدان' : 'Feddans'}`,
      ],
    };
  };

  const [messages, setMessages] = useState<AdvisorMessage[]>(() => [buildWelcomeMessage()]);

  useEffect(() => {
    const freshWelcome = buildWelcomeMessage();
    setMessages((prev) => {
      if (prev.length === 0) {
        return [freshWelcome];
      }
      if (prev[0]?.id === 'msg-init-active' || prev[0]?.id === 'msg-init-zero') {
        return [freshWelcome, ...prev.slice(1)];
      }
      return prev;
    });
  }, [
    hasActiveZones,
    zoneNameAr,
    zoneNameEn,
    language,
    area.feddans,
    area.qirats,
    currentCropId,
    customCropLabel,
    soil.salinityEC,
    soil.ph,
    soil.texture,
    soil.irrigation,
    farmAverages.NDVI,
    farmAverages.NDWI,
    farmAverages.LST,
    farmAverages.SAVI,
    farmAverages.NDMI,
    farmAverages.EVI,
  ]);

  const handleSelectMediaFile = (file: File | null) => {
    if (!file) return;
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    if (!isVideo && !isImage) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      const base64Index = dataUrl.indexOf('base64,');
      const base64Data = base64Index >= 0 ? dataUrl.slice(base64Index + 7) : '';
      setPendingAttachment({
        id: `media-${Date.now()}`,
        mediaType: isVideo ? 'video' : 'image',
        mimeType: file.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
        fileName: file.name,
        previewUrl: dataUrl,
        base64Data,
        sizeBytes: file.size,
      });
    };
    reader.readAsDataURL(file);
  };

  const clearPendingAttachment = () => {
    setPendingAttachment(null);
  };

  const buildLocalMediaAnalysisReply = (
    attachment: AdvisorMediaAttachment,
    userText: string,
    deterministicReply: string,
    hasExecutedActions: boolean
  ): string => {
    const cropLabel = customCropLabel || (isAr ? activeCropObj.nameAr : activeCropObj.nameEn);
    const topPest = regionalPestRisks[0];
    const mediaLabelAr = attachment.mediaType === 'video' ? 'الفيديو الميداني' : 'الصورة الزراعية';
    const mediaLabelEn = attachment.mediaType === 'video' ? 'field video' : 'agricultural image';

    if (isAr) {
      const actionLine = hasExecutedActions
        ? `\n• **تنفيذ أوامر الموقع:** ${deterministicReply}`
        : '';
      return `### التشخيص البصري السريع من GeoAgri ai (${mediaLabelAr}: \`${attachment.fileName}\`)
• **فحص المجموع الخضري والأوراق (${cropLabel}):** تم ربط ${mediaLabelAr} مع قراءات مزرعتك الحية (**NDVI ${farmAverages.NDVI}** · **NDWI ${farmAverages.NDWI}** · حرارة الأوراق **${farmAverages.LST}°م**).
• **تقييم الإجهاد والآفات المحتملة:** ${
        topPest
          ? `أعلى خطر حيوي مرصود في نطاقك هو **${topPest.nameAr}** (احتمال **${topPest.riskScore}%**) مع ملوحة تربة **${soil.salinityEC} dS/m**.`
          : `ملوحة التربة الحالية **${soil.salinityEC} dS/m** ودرجة الحموضة **pH ${soil.ph}**.`
      }
• **التوصية التنفيذية الفورية:** ${
        topPest
          ? topPest.preventiveActionAr
          : 'فحص حواف الأوراق السفلية وضبط الري وفق رطوبة الجذور الحالية لتفادي الإجهاد المائي.'
      }${actionLine}${userText ? `\n• **ملاحظة سؤالك:** تم تحليل طلبك *"${userText}"* كتابياً بالكامل.` : ''}`;
    }

    const actionLineEn = hasExecutedActions
      ? `\n• **Site Command Execution:** ${deterministicReply}`
      : '';
    return `### GeoAgri ai Visual Diagnosis (${mediaLabelEn}: \`${attachment.fileName}\`)
• **Canopy & Leaf Inspection (${cropLabel}):** Cross-referenced ${mediaLabelEn} with live field telemetry (**NDVI ${farmAverages.NDVI}** · **NDWI ${farmAverages.NDWI}** · Canopy **LST ${farmAverages.LST}°C**).
• **Stress & Pest Assessment:** ${
      topPest
        ? `Primary regional biological risk is **${topPest.nameEn}** (**${topPest.riskScore}%** risk score) at soil EC **${soil.salinityEC} dS/m**.`
        : `Current soil salinity is **${soil.salinityEC} dS/m** with **pH ${soil.ph}**.`
    }
• **Immediate Action Recommendation:** ${
      topPest
        ? topPest.preventiveActionEn
        : 'Inspect lower leaf margins and calibrate irrigation to root-zone moisture.'
    }${actionLineEn}`;
  };

  const sendQuery = async (
    queryText: string,
    forcedWidget?: AdvisorInlineWidgetType,
    attachmentOverride?: AdvisorMediaAttachment | null
  ) => {
    const activeAttachment =
      attachmentOverride !== undefined ? attachmentOverride : pendingAttachment;
    const trimmedQuery = queryText.trim();

    if ((!trimmedQuery && !activeAttachment) || isLoading) return;

    if (isListeningRef.current) {
      manualStopRef.current = true;
      shouldSubmitMediaRef.current = false;
      isListeningRef.current = false;
      setIsListening(false);
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // ignore
        }
      }
    }

    const effectivePrompt =
      trimmedQuery ||
      (activeAttachment?.mediaType === 'video'
        ? isAr
          ? 'حلل هذا الفيديو الميداني وشخص حالة المحصول والري والآفات مع التوصية المباشرة.'
          : 'Analyze this field video and diagnose crop health, irrigation, and pests with actionable recommendations.'
        : isAr
        ? 'حلل هذه الصورة الزراعية وشخص حالة النبات أو التربة أو الآفات مع التوصية المباشرة.'
        : 'Analyze this agricultural image and diagnose plant, soil, or pest status with actionable recommendations.');

    const nowTime = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const userMsg: AdvisorMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      timestamp: nowTime,
      text: effectivePrompt,
      attachment: activeAttachment || undefined,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setPendingAttachment(null);
    setIsLoading(true);

    const plan = evaluateAdvisorAgenticTurn(effectivePrompt, {
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
    });

    if (forcedWidget && !plan.inlineWidgets.includes(forcedWidget)) {
      plan.inlineWidgets.push(forcedWidget);
    }

    const siteInventory: AdvisorSiteInventory = {
      language,
      darkMode,
      activeTab,
      activeLayer,
      activeThematicMap,
      activeZoneId,
      activeCropId: currentCropId,
      activeCentroid: centroid,
      drawnVerticesCount,
      hasActiveZones,
      pushNotificationsEnabled,
      comparedZoneIds,
      zones: zones.map((z) => ({
        id: z.id,
        nameAr: z.nameAr,
        nameEn: z.nameEn,
        feddans: z.area.feddans,
        cropId: z.currentCropId,
        customCropLabel: z.customCropLabel,
        soilTexture: z.soil.texture,
        salinityEC: z.soil.salinityEC,
        ph: z.soil.ph,
        irrigation: z.soil.irrigation,
        centroid: z.centroid,
      })),
      checklist: checklist.map((t) => ({
        id: t.id,
        titleAr: t.titleAr,
        titleEn: t.titleEn,
        completed: t.completed,
        category: t.category,
        priority: t.priority,
      })),
      incidents: loggedIncidents.map((inc) => ({
        id: inc.id,
        pestId: inc.pestId,
        pestNameAr: inc.pestNameAr,
        pestNameEn: inc.pestNameEn,
        subZoneId: inc.subZoneId,
        severity: inc.severity,
        status: inc.status,
      })),
    };

    let replyText = activeAttachment
      ? buildLocalMediaAnalysisReply(
          activeAttachment,
          trimmedQuery,
          plan.deterministicReplyText,
          plan.actions.length > 0
        )
      : plan.deterministicReplyText;
    let sourceMode: 'gemini_live' | 'local_scientific_engine' = 'local_scientific_engine';
    let executedActions: AdvisorSiteAction[] = plan.actions;
    let finalWidgets: AdvisorInlineWidgetType[] = [...plan.inlineWidgets];

    try {
      const res = await fetch('/api/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(activeAttachment ? 45000 : 32000),
        body: JSON.stringify({
          prompt: effectivePrompt,
          language,
          siteInventory,
          attachment: activeAttachment
            ? {
                mediaType: activeAttachment.mediaType,
                mimeType: activeAttachment.mimeType,
                base64Data: activeAttachment.base64Data,
                fileName: activeAttachment.fileName,
              }
            : undefined,
          conversationHistory: messages.slice(-8).map((m) => ({
            sender: m.sender,
            text: m.text,
          })),
          farmContext: hasActiveZones
            ? {
                hasActiveZones: true,
                zoneName: isAr ? zoneNameAr : zoneNameEn,
                coordinates: centroid,
                areaFeddans: area.feddans,
                areaQirats: area.qirats,
                hectares: area.hectares,
                activeCrop:
                  customCropLabel ||
                  (isAr ? activeCropObj.nameAr : activeCropObj.nameEn),
                growthStage: {
                  stageName: isAr ? growthStage.stageNameAr : growthStage.stageNameEn,
                  accumulatedGDD: growthStage.accumulatedGDD,
                  targetTotalGDD: growthStage.targetTotalGDD,
                  completionPct: growthStage.completionPct,
                  kc: growthStage.cropCoefficientKc,
                },
                soil,
                farmAverages,
                subZones: subZones.map((z) => ({
                  id: z.id,
                  areaFeddans: z.areaFeddans,
                  ndvi: z.ndvi,
                  ndwi: z.ndwi,
                  savi: z.savi,
                  lstCelsius: z.lstCelsius,
                  soilMoisturePct: z.soilMoisturePct,
                  soilMoistureDeepPct: z.soilMoistureDeepPct,
                  salinityEC: z.salinityEC,
                  soilPh: z.soilPh,
                })),
                next7DaysForecast: forecast14.slice(0, 7),
                topRecommendedCrops: topCrops.slice(0, 3).map((c) => ({
                  name: isAr ? c.crop.nameAr : c.crop.nameEn,
                  score: c.suitabilityScore,
                  grade: c.gradeLabel,
                  netIrrigationM3: c.netIrrigationRequiredM3PerFeddan,
                  expectedYieldTonPerFeddan: c.expectedYieldTonPerFeddan,
                })),
                regionalPestRisks: regionalPestRisks.map((p) => ({
                  name: isAr ? p.nameAr : p.nameEn,
                  riskScore: p.riskScore,
                  prevalencePct: p.regionalPrevalencePct,
                })),
                totalZonesCount: zones.length,
              }
            : {
                hasActiveZones: false,
                mode: 'general_agronomic_guidance_with_site_control',
              },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.mode === 'gemini_live') {
          sourceMode = 'gemini_live';
          const liveToolActions: AdvisorSiteAction[] = Array.isArray(data.toolActions)
            ? data.toolActions
            : [];
          const liveWidgets: AdvisorInlineWidgetType[] = Array.isArray(data.inlineWidgets)
            ? data.inlineWidgets
            : [];

          if (liveToolActions.length > 0) {
            executedActions = liveToolActions;
            finalWidgets = [...liveWidgets];
            if (forcedWidget && !finalWidgets.includes(forcedWidget)) {
              finalWidgets.push(forcedWidget);
            }
          } else if (data.text) {
            executedActions = [];
            finalWidgets = forcedWidget ? [forcedWidget] : [];
            for (const w of liveWidgets) {
              if (!finalWidgets.includes(w)) finalWidgets.push(w);
            }
          }

          if (data.text) {
            replyText = data.text;
          } else if (liveToolActions.length > 0) {
            replyText = liveToolActions
              .map((a) => `✅ ${isAr ? a.summaryAr : a.summaryEn}`)
              .join('\n');
          }
        }
      }
    } catch {
      // Fallback seamlessly to local deterministic plan & replyText
    }

    // Apply chat-local & pest-radar mutations immediately, and forward app-level actions to App.tsx
    const appActions: AdvisorSiteAction[] = [];
    let shouldClearChat = false;

    for (const act of executedActions) {
      if (act.type === 'LOG_PEST_INCIDENT') {
        const targetSubZone = act.subZoneId || 'A';
        const targetPestId = act.pestId || 'fall_armyworm';
        const targetSeverity = act.severity || 'high';
        const pinCoords = getSubZoneCoordinates(centroid, targetSubZone);
        const matchingWarning = regionalPestRisks.find((w) => w.pestId === targetPestId);
        const newIncident = createLoggedPestIncident({
          pestId: targetPestId,
          subZoneId: targetSubZone,
          severity: targetSeverity,
          notes:
            act.notes ||
            (isAr ? 'تم الرصد والتثبيت عبر GeoAgri ai' : 'Pinned via GeoAgri ai'),
          centroid: pinCoords,
          forecast14,
          regionalPrevalencePct: matchingWarning?.regionalPrevalencePct,
        });
        setLoggedIncidents((prev) => [newIncident, ...prev]);
      } else if (act.type === 'TOGGLE_PEST_INCIDENT_STATUS') {
        const nextStatus: 'active' | 'treated' = act.status || 'treated';
        setLoggedIncidents((prev) => {
          if (prev.length === 0) return prev;
          if (act.markAllTreated) {
            return prev.map((inc) => ({ ...inc, status: nextStatus }));
          }
          if (act.incidentId) {
            return prev.map((inc) =>
              inc.id === act.incidentId ? { ...inc, status: nextStatus } : inc
            );
          }
          return prev.map((inc, idx) =>
            idx === 0 ? { ...inc, status: nextStatus } : inc
          );
        });
      } else if (act.type === 'DELETE_PEST_INCIDENT') {
        setLoggedIncidents((prev) => {
          if (act.clearAll) return [];
          if (act.incidentId) {
            return prev.filter((inc) => inc.id !== act.incidentId);
          }
          return prev.slice(1);
        });
      } else if (act.type === 'CLEAR_CHAT') {
        shouldClearChat = true;
      } else {
        appActions.push(act);
      }
    }

    if (appActions.length > 0 && onExecuteSiteActions) {
      onExecuteSiteActions(appActions);
    }

    const metrics = [...plan.metricsCited];
    if (activeAttachment) {
      metrics.unshift(
        activeAttachment.mediaType === 'video'
          ? isAr
            ? 'تحليل فيديو ميداني'
            : 'Field Video Analyzed'
          : isAr
          ? 'تحليل صورة زراعية'
          : 'Crop Image Analyzed'
      );
    }

    const botMsg: AdvisorMessage = {
      id: `bot-${Date.now()}`,
      sender: 'advisor',
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      text: replyText,
      sourceMode,
      metricsCited: metrics,
      inlineWidgets: finalWidgets.length > 0 ? finalWidgets : undefined,
      executedActions: executedActions.length > 0 ? executedActions : undefined,
    };

    if (shouldClearChat) {
      setMessages([buildWelcomeMessage(), botMsg]);
    } else {
      setMessages((prev) => [...prev, botMsg]);
    }
    setIsLoading(false);
  };
  sendQueryRef.current = sendQuery;

  useEffect(() => {
    if (pendingAdvisorPrompt && pendingAdvisorPrompt.trim()) {
      const promptToRun = pendingAdvisorPrompt.trim();
      onClearPendingAdvisorPrompt?.();
      void sendQuery(promptToRun);
    }
  }, [pendingAdvisorPrompt]);

  const clearVoiceTimersAndAudio = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (silenceMonitorIntervalRef.current) {
      clearInterval(silenceMonitorIntervalRef.current);
      silenceMonitorIntervalRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => undefined);
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setSilenceCountdownSec(null);
  }, []);

  const resetChat = () => {
    manualStopRef.current = true;
    shouldSubmitMediaRef.current = false;
    isListeningRef.current = false;
    setIsListening(false);
    setVoiceError(null);
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore
    }
    recognitionRef.current = null;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    mediaRecorderRef.current = null;
    clearVoiceTimersAndAudio();
    setPendingAttachment(null);
    setMessages([buildWelcomeMessage()]);
  };

  const stopVoiceCaptureAndSubmit = useCallback(
    (shouldSubmit: boolean) => {
      manualStopRef.current = true;
      shouldSubmitMediaRef.current = shouldSubmit;
      isListeningRef.current = false;
      setIsListening(false);
      setSilenceCountdownSec(null);

      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }

      const activeRec = recognitionRef.current;
      recognitionRef.current = null;
      if (activeRec) {
        try {
          activeRec.stop();
        } catch {
          // ignore
        }
      }

      const activeRecorder = mediaRecorderRef.current;
      if (activeRecorder && activeRecorder.state !== 'inactive') {
        if (!shouldSubmit) {
          latestTranscriptRef.current = '';
        }
        try {
          activeRecorder.stop();
        } catch {
          clearVoiceTimersAndAudio();
        }
        return;
      }

      clearVoiceTimersAndAudio();
      if (activeRec) {
        const captured = latestTranscriptRef.current.trim();
        if (shouldSubmit && captured) {
          void sendQueryRef.current(captured);
        }
      }
    },
    [clearVoiceTimersAndAudio]
  );

  const scheduleSilenceAutoStop = useCallback(
    (delayMs = VOICE_SILENCE_AUTO_STOP_MS) => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      const startedSilenceAt = performance.now();
      setSilenceCountdownSec(null);

      countdownIntervalRef.current = setInterval(() => {
        if (!isListeningRef.current || manualStopRef.current) return;
        const elapsed = performance.now() - startedSilenceAt;
        if (elapsed >= 600) {
          const remaining = Math.max(1, Math.ceil((delayMs - elapsed) / 1000));
          setSilenceCountdownSec(remaining);
        }
      }, 150);

      silenceTimerRef.current = setTimeout(() => {
        if (isListeningRef.current && !manualStopRef.current) {
          stopVoiceCaptureAndSubmit(true);
        }
      }, delayMs);
    },
    [stopVoiceCaptureAndSubmit]
  );

  const launchPreviewRecognitionForRecorder = (
    SpeechRec: new () => BrowserSpeechRecognitionInstance
  ) => {
    if (!isListeningRef.current || manualStopRef.current) return;

    const previewRec = new SpeechRec();
    previewRec.lang = isAr ? 'ar-EG' : 'en-US';
    previewRec.continuous = true;
    previewRec.interimResults = true;
    previewRec.maxAlternatives = 1;
    recognitionRef.current = previewRec;

    previewRec.onresult = (event: BrowserSpeechRecognitionEvent) => {
      if (manualStopRef.current || !isListeningRef.current) return;
      const extracted = extractTranscriptFromResults(event.results);
      currentSegmentFinalRef.current = extracted.finalText;

      const combined = combineVoiceTranscript(
        prefixTextRef.current,
        extracted.finalText,
        extracted.interimText
      );

      latestTranscriptRef.current = combined;
      setInputVal(combined);

      if (extracted.hasContent) {
        hasSpokenRef.current = true;
        lastActivityTsRef.current = performance.now();
        setSilenceCountdownSec(null);
      }
    };

    previewRec.onspeechstart = () => {
      if (isListeningRef.current && !manualStopRef.current) {
        lastActivityTsRef.current = performance.now();
        setSilenceCountdownSec(null);
      }
    };

    previewRec.onerror = () => {
      // Non-fatal in hybrid mode: MediaRecorder + RMS silence detector remain authoritative
    };

    previewRec.onend = () => {
      if (recognitionRef.current !== previewRec) return;
      recognitionRef.current = null;
      if (manualStopRef.current || !isListeningRef.current) return;

      if (currentSegmentFinalRef.current) {
        prefixTextRef.current = combineVoiceTranscript(
          prefixTextRef.current,
          currentSegmentFinalRef.current
        );
        currentSegmentFinalRef.current = '';
      }

      restartTimeoutRef.current = setTimeout(() => {
        if (!isListeningRef.current || manualStopRef.current) return;
        try {
          launchPreviewRecognitionForRecorder(SpeechRec);
        } catch {
          // ignore preview restart error
        }
      }, 150);
    };

    try {
      previewRec.start();
    } catch {
      recognitionRef.current = null;
    }
  };

  const launchSpeechRecognitionCycle = (
    SpeechRec: new () => BrowserSpeechRecognitionInstance
  ) => {
    if (!isListeningRef.current || manualStopRef.current) return;

    const recognition = new SpeechRec();
    recognition.lang = isAr ? 'ar-EG' : 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onresult = (event: BrowserSpeechRecognitionEvent) => {
      if (manualStopRef.current || !isListeningRef.current) return;
      const extracted = extractTranscriptFromResults(event.results);
      currentSegmentFinalRef.current = extracted.finalText;

      const combined = combineVoiceTranscript(
        prefixTextRef.current,
        extracted.finalText,
        extracted.interimText
      );

      latestTranscriptRef.current = combined;
      setInputVal(combined);

      if (extracted.hasContent) {
        hasSpokenRef.current = true;
        scheduleSilenceAutoStop(VOICE_SILENCE_AUTO_STOP_MS);
      }
    };

    recognition.onspeechstart = () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      setSilenceCountdownSec(null);
    };

    recognition.onspeechend = () => {
      if (hasSpokenRef.current && isListeningRef.current && !manualStopRef.current) {
        scheduleSilenceAutoStop(VOICE_SILENCE_AUTO_STOP_MS);
      }
    };

    recognition.onerror = (errEvent?: BrowserSpeechRecognitionErrorEvent) => {
      const errCode = errEvent?.error || '';
      if (errCode === 'aborted' || manualStopRef.current) {
        return;
      }
      if (errCode === 'no-speech') {
        return;
      }
      if (errCode === 'not-allowed') {
        manualStopRef.current = true;
        isListeningRef.current = false;
        setIsListening(false);
        recognitionRef.current = null;
        clearVoiceTimersAndAudio();
        setVoiceError(
          isAr
            ? 'يرجى السماح بصلاحية الميكروفون من المتصفح لتسجيل صوتك.'
            : 'Please allow microphone access in your browser to use voice input.'
        );
        return;
      }
      if (errCode === 'network' || errCode === 'service-not-allowed' || errCode === 'audio-capture') {
        manualStopRef.current = true;
        recognitionRef.current = null;
        clearVoiceTimersAndAudio();
        isListeningRef.current = false;
        setIsListening(false);
        setVoiceError(
          isAr
            ? 'تعذر الوصول إلى خدمة التعرف على الصوت. تأكد من صلاحية الميكروفون واتصال الإنترنت.'
            : 'Speech recognition service is unavailable. Please check mic permission and internet.'
        );
      }
    };

    recognition.onend = () => {
      if (recognitionRef.current !== recognition) return;
      recognitionRef.current = null;

      if (manualStopRef.current || !isListeningRef.current) {
        return;
      }

      if (currentSegmentFinalRef.current) {
        prefixTextRef.current = combineVoiceTranscript(
          prefixTextRef.current,
          currentSegmentFinalRef.current
        );
        currentSegmentFinalRef.current = '';
      }

      restartTimeoutRef.current = setTimeout(() => {
        if (!isListeningRef.current || manualStopRef.current) return;
        try {
          launchSpeechRecognitionCycle(SpeechRec);
        } catch {
          stopVoiceCaptureAndSubmit(true);
        }
      }, 120);
    };

    recognition.start();
  };

  const startMediaRecorderHybrid = async (
    SpeechRec?: new () => BrowserSpeechRecognitionInstance
  ): Promise<boolean> => {
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.getUserMedia !== 'function' ||
      typeof MediaRecorder === 'undefined'
    ) {
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const preferredMime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';

      const recorder = preferredMime
        ? new MediaRecorder(stream, { mimeType: preferredMime })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      const audioChunks: BlobPart[] = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          audioChunks.push(ev.data);
        }
      };

      recorder.onstop = async () => {
        const mimeType = recorder.mimeType || preferredMime || 'audio/webm';
        mediaRecorderRef.current = null;
        const previewFallback = latestTranscriptRef.current.trim();
        clearVoiceTimersAndAudio();
        isListeningRef.current = false;
        setIsListening(false);

        if (!shouldSubmitMediaRef.current) return;

        if (audioChunks.length === 0) {
          if (previewFallback) {
            setInputVal(previewFallback);
            void sendQueryRef.current(previewFallback);
          }
          return;
        }

        const blob = new Blob(audioChunks, { type: mimeType });
        if (blob.size < 400) {
          if (previewFallback) {
            setInputVal(previewFallback);
            void sendQueryRef.current(previewFallback);
          }
          return;
        }

        setIsTranscribing(true);
        try {
          const base64Audio = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const res = typeof reader.result === 'string' ? reader.result : '';
              const idx = res.indexOf('base64,');
              resolve(idx >= 0 ? res.slice(idx + 7) : '');
            };
            reader.onerror = () => reject(new Error('Failed to read audio'));
            reader.readAsDataURL(blob);
          });

          const resp = await fetch('/api/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(25000),
            body: JSON.stringify({
              audioBase64: base64Audio,
              mimeType,
              language,
            }),
          });

          if (resp.ok) {
            const data = await resp.json();
            const transcript = typeof data?.transcript === 'string' ? data.transcript.trim() : '';
            if (transcript) {
              const combined = combineVoiceTranscript(prefixTextRef.current, transcript);
              setInputVal(combined);
              void sendQueryRef.current(combined);
              return;
            }
          }

          if (previewFallback) {
            setInputVal(previewFallback);
            void sendQueryRef.current(previewFallback);
          } else {
            setVoiceError(
              isAr
                ? 'لم يتم التقاط كلام واضح، حاول التحدث بالقرب من الميكروفون.'
                : 'No clear speech was detected. Please try speaking closer to the mic.'
            );
          }
        } catch {
          if (previewFallback) {
            setInputVal(previewFallback);
            void sendQueryRef.current(previewFallback);
          } else {
            setVoiceError(
              isAr
                ? 'تعذر تحويل الصوت إلى نص الآن. يرجى التحقق من الاتصال والمحاولة مجدداً.'
                : 'Could not transcribe audio right now. Please check your connection and retry.'
            );
          }
        } finally {
          setIsTranscribing(false);
        }
      };

      // Monitor live RMS audio energy with adaptive ambient noise floor to auto-stop strictly after 3.0s of silence
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        if (audioCtx.state === 'suspended') {
          void audioCtx.resume().catch(() => undefined);
        }
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 1024;
        source.connect(analyser);
        const dataArray = new Float32Array(analyser.fftSize);
        let speechDetected = false;
        let calibrationTicks = 0;
        let noiseSum = 0;
        let dynamicThreshold = 0.012;
        lastActivityTsRef.current = performance.now();

        silenceMonitorIntervalRef.current = setInterval(() => {
          if (!isListeningRef.current || manualStopRef.current) return;
          analyser.getFloatTimeDomainData(dataArray);
          let sumSq = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sumSq += dataArray[i] * dataArray[i];
          }
          const rms = Math.sqrt(sumSq / dataArray.length);

          if (calibrationTicks < 4 && rms < 0.04) {
            calibrationTicks++;
            noiseSum += rms;
            const avgNoise = noiseSum / calibrationTicks;
            dynamicThreshold = Math.min(0.022, Math.max(0.008, avgNoise * 1.8));
          }

          if (rms > dynamicThreshold) {
            speechDetected = true;
            hasSpokenRef.current = true;
            lastActivityTsRef.current = performance.now();
            setSilenceCountdownSec(null);
          } else if (speechDetected || hasSpokenRef.current) {
            const silentMs = performance.now() - lastActivityTsRef.current;
            if (silentMs >= VOICE_SILENCE_AUTO_STOP_MS) {
              stopVoiceCaptureAndSubmit(true);
            } else if (silentMs >= 600) {
              const remaining = Math.max(
                1,
                Math.ceil((VOICE_SILENCE_AUTO_STOP_MS - silentMs) / 1000)
              );
              setSilenceCountdownSec(remaining);
            }
          }
        }, 100);
      }

      manualStopRef.current = false;
      shouldSubmitMediaRef.current = true;
      isListeningRef.current = true;
      setIsListening(true);
      recorder.start(250);

      if (SpeechRec) {
        launchPreviewRecognitionForRecorder(SpeechRec);
      }
      return true;
    } catch (err: unknown) {
      clearVoiceTimersAndAudio();
      const errName = err instanceof Error ? err.name : '';
      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        isListeningRef.current = false;
        setIsListening(false);
        setVoiceError(
          isAr
            ? 'تم رفض صلاحية الميكروفون. يرجى السماح بالوصول إلى الميكروفون من إعدادات المتصفح.'
            : 'Microphone permission was denied. Please allow microphone access in browser settings.'
        );
        return true;
      }
      return false;
    }
  };

  const handleVoiceInput = () => {
    setVoiceError(null);

    if (isListeningRef.current) {
      stopVoiceCaptureAndSubmit(true);
      return;
    }

    prefixTextRef.current = inputVal.trim();
    currentSegmentFinalRef.current = '';
    latestTranscriptRef.current = inputVal.trim();
    hasSpokenRef.current = false;
    manualStopRef.current = false;
    shouldSubmitMediaRef.current = true;

    const win = window as unknown as {
      SpeechRecognition?: new () => BrowserSpeechRecognitionInstance;
      webkitSpeechRecognition?: new () => BrowserSpeechRecognitionInstance;
    };
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;

    void (async () => {
      const startedHybrid = await startMediaRecorderHybrid(SpeechRec);
      if (startedHybrid) return;

      if (!SpeechRec) {
        isListeningRef.current = false;
        setIsListening(false);
        setVoiceError(
          isAr
            ? 'المتصفح الحالي لا يدعم الوصول إلى الميكروفون.'
            : 'This browser does not support microphone capture.'
        );
        return;
      }

      try {
        isListeningRef.current = true;
        setIsListening(true);
        launchSpeechRecognitionCycle(SpeechRec);
      } catch {
        isListeningRef.current = false;
        setIsListening(false);
        setVoiceError(
          isAr
            ? 'تعذر بدء تسجيل الصوت عبر الميكروفون.'
            : 'Could not start microphone voice capture.'
        );
      }
    })();
  };

  const clearVoiceError = () => setVoiceError(null);

  useEffect(() => {
    return () => {
      manualStopRef.current = true;
      isListeningRef.current = false;
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // ignore
        }
      }
      clearVoiceTimersAndAudio();
    };
  }, [clearVoiceTimersAndAudio]);

  const handleLogPestIncident = (e: React.FormEvent) => {
    e.preventDefault();
    const pinCoords = getSubZoneCoordinates(centroid, selectedSubZone);
    const matchingWarning = regionalPestRisks.find((w) => w.pestId === selectedPestId);
    const newIncident = createLoggedPestIncident({
      pestId: selectedPestId,
      subZoneId: selectedSubZone,
      severity: selectedSeverity,
      notes: incidentNotes,
      centroid: pinCoords,
      forecast14,
      regionalPrevalencePct: matchingWarning?.regionalPrevalencePct,
    });
    setLoggedIncidents((prev) => [newIncident, ...prev]);
    setIncidentNotes('');
  };

  const handleToggleIncidentStatus = (incidentId: string) => {
    setLoggedIncidents((prev) =>
      prev.map((inc) =>
        inc.id === incidentId
          ? { ...inc, status: inc.status === 'active' ? 'treated' : 'active' }
          : inc
      )
    );
  };

  const quickOnDemandChips: AdvisorQuickChip[] = hasActiveZones
    ? [
        {
          id: 'chip-spectral',
          labelAr: 'تحليل المؤشرات (زونا A/B/C)',
          labelEn: 'Sub-Zone Spectral Analysis',
          promptAr:
            'اعرض لي تحليل المؤشرات الطيفية NDVI وNDWI وLST للزونا A وB وC ولماذا يوجد تباين بينهم؟',
          promptEn:
            'Show me the spectral indices analysis (NDVI, NDWI, LST) across Sub-Zones A, B, and C.',
          widget: 'spectral_subzones',
          icon: Activity,
        },
        {
          id: 'chip-npk',
          labelAr: 'جدول التسميد NPK والري',
          labelEn: 'NPK & Irrigation Schedule',
          promptAr: 'اعرض جدول التسميد NPK للأربعة أسابيع القادمة مع قرار الري والأمطار لمزرعتي',
          promptEn:
            'Show the 4-week NPK fertigation schedule and rain-aware irrigation plan for my farm.',
          widget: 'irrigation_npk',
          icon: FlaskConical,
        },
        {
          id: 'chip-pest',
          labelAr: 'رادار الآفات وتثبيت البؤر',
          labelEn: 'Pest Radar & Pinning',
          promptAr: 'افتح رادار الآفات والأمراض لإحداثيات مزرعتي وخطة الوقاية والعلاج الفورية',
          promptEn: 'Open the regional pest & disease radar for my farm coordinates with IPM treatments.',
          widget: 'pest_radar',
          icon: Bug,
        },
        {
          id: 'chip-checklist',
          labelAr: 'خطة العمل الأسبوعية',
          labelEn: 'Weekly Action Checklist',
          promptAr: 'اعرض خطة العمل الميدانية ومهام الأسبوع القادم لمزرعتي',
          promptEn: 'Show the prioritized weekly field action checklist for my farm.',
          widget: 'weekly_checklist',
          icon: CheckCircle2,
        },
        {
          id: 'chip-crops',
          labelAr: 'أفضل محصول ودورة زراعية',
          labelEn: 'Best Crops & Rotation',
          promptAr: 'إيه أحسن محصول أزرعه بأعلى جودة وعائد اقتصادي في أرضي؟',
          promptEn: 'What is the highest quality and most profitable crop to plant on my land?',
          widget: 'crop_mcda',
          icon: Sprout,
        },
        {
          id: 'chip-add-zone',
          labelAr: '+ إضافة منطقة زراعية بالشات',
          labelEn: '+ Add Farm Zone via Chat',
          promptAr: 'أضف منطقة زراعية في كفر الشيخ بمساحة 45 فدان تربة طينية محصول قمح ري بالتنقيط',
          promptEn:
            'Add a 45 feddan wheat farm in Kafr El Sheikh with clay soil and drip irrigation',
          widget: 'zone_action_card',
          icon: PlusCircle,
        },
      ]
    : [
        {
          id: 'chip-create-delta',
          labelAr: '+ أضف مزرعة في كفر الشيخ (50 فدان قمح)',
          labelEn: '+ Add 50 Feddan Wheat Farm in Kafr El-Sheikh',
          promptAr: 'أضف منطقة زراعية في كفر الشيخ بمساحة 50 فدان تربة طينية محصول قمح ري بالتنقيط',
          promptEn:
            'Add a 50 feddan wheat farm in Kafr El Sheikh with clay soil and drip irrigation',
          widget: 'zone_action_card',
          icon: PlusCircle,
        },
        {
          id: 'chip-create-qena',
          labelAr: '+ أضف مزرعة في قنا ونجع حمادي (65 فدان)',
          labelEn: '+ Add 65 Feddan Farm in Qena / Nag Hammadi',
          promptAr:
            'أضف منطقة زراعية عند إحداثيات 26.0542, 32.2411 في نجع حمادي بمساحة 65 فدان تربة طميية محصول قمح',
          promptEn:
            'Create a 65 feddan farm zone at coordinates 26.0542, 32.2411 in Nag Hammadi with loamy soil',
          widget: 'zone_action_card',
          icon: MapPin,
        },
        {
          id: 'chip-create-sinai',
          labelAr: '+ أضف مزرعة في سيناء (80 فدان زيتون)',
          labelEn: '+ Add 80 Feddan Olive Farm in Sinai',
          promptAr:
            'أضف منطقة زراعية عند إحداثيات 31.0202, 32.4173 في سيناء بمساحة 80 فدان تربة رملية محصول زيتون ري بالتنقيط',
          promptEn:
            'Add an 80 feddan olive farm at 31.0202, 32.4173 in North Sinai with sandy soil and drip irrigation',
          widget: 'zone_action_card',
          icon: Compass,
        },
        {
          id: 'chip-general-advice',
          labelAr: 'كيف أختار المحصول المناسب لنوع تربتي؟',
          labelEn: 'How to choose the best crop for my soil?',
          promptAr: 'ما هي القواعد العلمية لاختيار المحصول المناسب حسب قوام التربة وملوحتها؟',
          promptEn:
            'What are the scientific rules for selecting crops by soil texture and EC salinity?',
          icon: Sprout,
        },
      ];

  return {
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
    selectedPestId,
    setSelectedPestId,
    selectedSubZone,
    setSelectedSubZone,
    selectedSeverity,
    setSelectedSeverity,
    incidentNotes,
    setIncidentNotes,
    loggedIncidents,
    setLoggedIncidents,
    handleLogPestIncident,
    handleToggleIncidentStatus,
    activeCropObj,
    growthStage,
    npkSchedule,
    regionalPestRisks,
    quickOnDemandChips,
  };
}

export type SharedAdvisorChatHandle = ReturnType<typeof useAdvisorChat>;
