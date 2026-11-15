import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Beaker,
  Bot,
  Bug,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Droplets,
  Download,
  Flame,
  HelpCircle,
  Layers,
  Plus,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Sprout,
  TrendingUp,
  Wand2,
} from 'lucide-react';
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AreaBreakdown,
  CustomRotationEvaluation,
  DailyWeatherPoint,
  EnvironmentalDisasterType,
  GrowthStageInfo,
  Language,
  LatLon,
  MultiYearCycleLength,
  MultiYearRotationFocus,
  RotationSeasonSlot,
  RotationStrategyOption,
  SavedCustomRotationPreset,
  ScoredCropRecommendation,
  SoilProfile,
  SoilTexture,
  SpectralIndexKey,
  SubZoneSummary,
  ZoneCustomRotationPlan,
} from '../types/agro';
import {
  CROP_DATABASE,
  buildFallback14DayForecast,
  calculateFourWeekNpkSchedule,
  getCropPhenologyStageDefs,
  evaluateCropWaterDeficit,
  evaluateEnvironmentalDisasterWarnings,
  evaluateFarmWaterBudget,
  evaluateZonePestOutbreakAlerts,
  findWaterSafeAlternativeCrops,
  generateMultiYearRotationStrategies,
  getCropFamily,
} from '../utils/agroEngine';
import {
  EXPORTABLE_SPECTRAL_METRICS_META,
  ExportableSpectralMetricKey,
  GDD_LIFECYCLE_PHASE_PRESETS,
  GddLifecyclePhaseFilter,
  buildCropLifecycleGddSeries,
  buildCropRecommenderCsv,
  downloadCsvFile,
  filterGddLifecyclePointsByRange,
} from '../utils/csvExport';
import { RiskMetricsExplainerModal } from './RiskMetricsExplainerModal';

interface CropRecommenderViewProps {
  language: Language;
  area: AreaBreakdown;
  soil: SoilProfile;
  growthStage: GrowthStageInfo;
  recommendations: ScoredCropRecommendation[];
  rotationStrategies: RotationStrategyOption[];
  selectedCropId: string;
  onAdoptCrop: (cropId: string) => void;
  customRotationPlans: Record<'A' | 'B' | 'C', ZoneCustomRotationPlan>;
  rotationEvaluations: Record<'A' | 'B' | 'C', CustomRotationEvaluation>;
  onUpdateZoneCropSlot: (
    zoneId: 'A' | 'B' | 'C',
    slotId: RotationSeasonSlot['slotId'],
    newCropId: string
  ) => void;
  onAutoOptimizeZone: (zoneId: 'A' | 'B' | 'C') => void;
  onDownloadPdfReport: () => void;
  centroid?: LatLon;
  forecast14?: DailyWeatherPoint[];
  farmAverages?: Record<SpectralIndexKey, number>;
  subZones?: SubZoneSummary[];
  onConsultAgronomistWithPrompt?: (promptText: string) => void;
}

type RecommenderSubTab = 'overview' | 'rotation' | 'npk_gdd' | 'risks';
type RotationSubMode = 'custom' | 'multi_year' | 'nasa_matrix';
type RiskSubMode = 'disasters' | 'pests' | 'strategic_guide';

const FAMILY_COLORS: Record<string, { bg: string; border: string; labelAr: string; labelEn: string }> = {
  gramineae: {
    bg: 'bg-amber-500/15 dark:bg-amber-500/20 text-amber-900 dark:text-amber-200',
    border: 'border-amber-500',
    labelAr: 'نجيليات (حبوب)',
    labelEn: 'Gramineae (Cereal)',
  },
  fabaceae: {
    bg: 'bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-900 dark:text-emerald-200',
    border: 'border-emerald-600',
    labelAr: 'بقوليات (+أزوت)',
    labelEn: 'Fabaceae (+N Fixer)',
  },
  solanaceae: {
    bg: 'bg-rose-500/15 dark:bg-rose-500/20 text-rose-900 dark:text-rose-200',
    border: 'border-rose-500',
    labelAr: 'باذنجانيات (درنات/خضر)',
    labelEn: 'Solanaceae (Tuber/Veg)',
  },
  chenopodiaceae: {
    bg: 'bg-cyan-500/15 dark:bg-cyan-500/20 text-cyan-900 dark:text-cyan-200',
    border: 'border-cyan-600',
    labelAr: 'رمراميات (مقاوم ملوحة)',
    labelEn: 'Chenopodiaceae (Halophyte)',
  },
  malvaceae: {
    bg: 'bg-indigo-500/15 dark:bg-indigo-500/20 text-indigo-900 dark:text-indigo-200',
    border: 'border-indigo-500',
    labelAr: 'خبازيات (ألياف)',
    labelEn: 'Malvaceae (Fiber)',
  },
  oleaceae: {
    bg: 'bg-lime-500/15 dark:bg-lime-500/20 text-lime-900 dark:text-lime-200',
    border: 'border-lime-600',
    labelAr: 'زيتونيات (بستاني)',
    labelEn: 'Oleaceae (Orchard)',
  },
};

export const CropRecommenderView: React.FC<CropRecommenderViewProps> = ({
  language,
  area,
  soil,
  growthStage,
  recommendations,
  rotationStrategies,
  selectedCropId,
  onAdoptCrop,
  customRotationPlans,
  rotationEvaluations,
  onUpdateZoneCropSlot,
  onAutoOptimizeZone,
  onDownloadPdfReport,
  centroid,
  forecast14,
  farmAverages,
  subZones,
  onConsultAgronomistWithPrompt,
}) => {
  const isAr = language === 'ar';

  // Organized 4-Tab Navigation State
  const [activeSubTab, setActiveSubTab] = useState<RecommenderSubTab>('overview');
  const [rotationSubMode, setRotationSubMode] = useState<RotationSubMode>('custom');
  const [riskSubMode, setRiskSubMode] = useState<RiskSubMode>('disasters');

  // Progressive Disclosure States
  const [expandedCropIds, setExpandedCropIds] = useState<Record<string, boolean>>({});
  const [expandedDisasterIds, setExpandedDisasterIds] = useState<Record<string, boolean>>({});
  const [expandedPestAlertIds, setExpandedPestAlertIds] = useState<Record<string, boolean>>({});
  const [showNpkDetailedTable, setShowNpkDetailedTable] = useState(false);
  const [showMultiZoneCalendar, setShowMultiZoneCalendar] = useState(false);
  const [showMultiYearDetails, setShowMultiYearDetails] = useState(false);
  const [showNasaMatrixDetails, setShowNasaMatrixDetails] = useState(false);

  // Filters & Selection States
  const [seasonFilter, setSeasonFilter] = useState<'all' | 'winter' | 'summer' | 'perennial'>('all');
  const [waterSafeOnlyFilter, setWaterSafeOnlyFilter] = useState<boolean>(false);
  const [manualWaterQuotaInput, setManualWaterQuotaInput] = useState<string>('');
  const [activeZoneId, setActiveZoneId] = useState<'A' | 'B' | 'C'>('A');
  const [activeRotationId, setActiveRotationId] = useState<'A' | 'B' | 'C'>('B');
  const [customPlanName, setCustomPlanName] = useState('');
  const [savedPresets, setSavedPresets] = useState<SavedCustomRotationPreset[]>([]);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({
    'chk-a1': true,
    'chk-b1': true,
    'chk-b2': true,
    'chk-c1': true,
    'chk-c2': true,
  });

  // Advanced Multi-Year (3–5 Year) Crop Rotation Strategy State
  const [multiYearCycle, setMultiYearCycle] = useState<MultiYearCycleLength>(5);
  const [activeMultiYearFocus, setActiveMultiYearFocus] =
    useState<MultiYearRotationFocus>('soil_regeneration');

  // Proactive Pest & Disease Outbreak Alert Filter State
  const [pestCropFilter, setPestCropFilter] = useState<
    'all' | 'wheat' | 'maize' | 'cotton' | 'vegetables'
  >('all');

  const effectiveCentroid = centroid || { lat: 30.7285, lng: 31.275 };
  const effectiveForecast = useMemo(
    () =>
      forecast14 && forecast14.length > 0
        ? forecast14
        : buildFallback14DayForecast(effectiveCentroid),
    [forecast14, effectiveCentroid.lat, effectiveCentroid.lng]
  );
  const effectiveAverages = useMemo<Record<SpectralIndexKey, number>>(
    () =>
      farmAverages && farmAverages.NDVI > 0
        ? farmAverages
        : {
            NDVI: 0.68,
            NDWI: 0.31,
            SAVI: 0.62,
            NDMI: 0.29,
            EVI: 0.59,
            LST: 26.8,
            SM_0_7: 28.4,
            SM_7_28: 33.2,
            SOIL_EC: soil.salinityEC,
            SOIL_PH: soil.ph,
          },
    [farmAverages, soil.salinityEC, soil.ph]
  );

  const multiYearStrategies = useMemo(
    () =>
      generateMultiYearRotationStrategies(
        soil,
        effectiveAverages,
        area.totalFeddansDecimal || 5,
        multiYearCycle
      ),
    [soil, effectiveAverages, area.totalFeddansDecimal, multiYearCycle]
  );

  const activeMultiYearStrategy =
    multiYearStrategies.find((s) => s.id === activeMultiYearFocus) || multiYearStrategies[0];

  const proactivePestAlerts = useMemo(
    () =>
      evaluateZonePestOutbreakAlerts(
        effectiveCentroid,
        soil,
        effectiveForecast,
        selectedCropId,
        effectiveAverages,
        subZones || []
      ),
    [effectiveCentroid, soil, effectiveForecast, selectedCropId, effectiveAverages, subZones]
  );

  const filteredPestAlerts = useMemo(
    () =>
      proactivePestAlerts.filter((a) =>
        pestCropFilter === 'all' ? true : a.cropCategory === pestCropFilter
      ),
    [proactivePestAlerts, pestCropFilter]
  );

  // 14-Day Environmental & Climatic Disaster Early Warning State
  const [selectedDisasterType, setSelectedDisasterType] = useState<
    'all' | EnvironmentalDisasterType
  >('all');
  const [explainerModalState, setExplainerModalState] = useState<{
    isOpen: boolean;
    riskTitle?: string;
    yieldLossWithoutActionPct?: number;
    mitigatedRecoveryPct?: number;
  }>({ isOpen: false });

  const environmentalDisasterWarnings = useMemo(
    () =>
      evaluateEnvironmentalDisasterWarnings(
        effectiveForecast,
        soil,
        isAr ? 'نطاق مزرعتك المحددة' : 'Active Farm Zone',
        'Active Farm Zone',
        effectiveCentroid
      ),
    [effectiveForecast, soil, isAr, effectiveCentroid]
  );

  const filteredDisasterWarnings = useMemo(
    () =>
      environmentalDisasterWarnings.filter((w) =>
        selectedDisasterType === 'all' ? true : w.disasterType === selectedDisasterType
      ),
    [environmentalDisasterWarnings, selectedDisasterType]
  );

  // 4-Week NPK Nutrient Requirement Calculator State
  const [npkCropId, setNpkCropId] = useState<string>(selectedCropId);
  const [npkSoilTexture, setNpkSoilTexture] = useState<SoilTexture>(soil.texture);
  const [npkGdd, setNpkGdd] = useState<number>(growthStage.accumulatedGDD);

  useEffect(() => {
    setNpkCropId(selectedCropId);
  }, [selectedCropId]);

  useEffect(() => {
    setNpkSoilTexture(soil.texture);
  }, [soil.texture]);

  useEffect(() => {
    setNpkGdd(growthStage.accumulatedGDD);
  }, [growthStage.accumulatedGDD]);

  const npkSchedule = useMemo(
    () =>
      calculateFourWeekNpkSchedule({
        cropId: npkCropId,
        soilTexture: npkSoilTexture,
        soilPh: soil.ph,
        salinityEC: soil.salinityEC,
        irrigation: soil.irrigation,
        accumulatedGDD: npkGdd,
        areaFeddans: area.totalFeddansDecimal,
      }),
    [npkCropId, npkSoilTexture, soil.ph, soil.salinityEC, soil.irrigation, npkGdd, area.totalFeddansDecimal]
  );

  // Growing Degree Day (GDD) Trend Chart State, Lifecycle Phase Range Slider & Granular CSV Options
  const [gddChartMode, setGddChartMode] = useState<'lifecycle' | '30day'>('lifecycle');
  const [gddPhasePreset, setGddPhasePreset] = useState<GddLifecyclePhaseFilter>('all');
  const [gddRangeMinPct, setGddRangeMinPct] = useState<number>(0);
  const [gddRangeMaxPct, setGddRangeMaxPct] = useState<number>(100);

  const [csvExported, setCsvExported] = useState(false);
  const [showCsvOptions, setShowCsvOptions] = useState(false);
  const [csvStartDate, setCsvStartDate] = useState<string>('');
  const [csvEndDate, setCsvEndDate] = useState<string>('');
  const [selectedCsvMetrics, setSelectedCsvMetrics] = useState<ExportableSpectralMetricKey[]>([
    'NDVI',
    'LST',
    'SM_0_7',
    'SM_7_28',
  ]);
  const csvTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (csvTimerRef.current) clearTimeout(csvTimerRef.current);
    };
  }, []);

  const gddSeries = useMemo(
    () =>
      buildCropLifecycleGddSeries({
        cropId: npkCropId,
        accumulatedGDD: npkGdd,
        forecast14: effectiveForecast,
        startDateISO: effectiveForecast[0]?.date,
      }),
    [npkCropId, npkGdd, effectiveForecast]
  );

  useEffect(() => {
    const pts = gddSeries.thirtyDaySummary.dailyPoints;
    if (pts.length > 0) {
      setCsvStartDate((prev) =>
        prev && pts.some((p) => p.dateISO === prev) ? prev : pts[0].dateISO
      );
      setCsvEndDate((prev) =>
        prev && pts.some((p) => p.dateISO === prev) ? prev : pts[pts.length - 1].dateISO
      );
    }
  }, [gddSeries.thirtyDaySummary.dailyPoints]);

  const gddFilteredWindow = useMemo(
    () =>
      filterGddLifecyclePointsByRange(gddSeries, {
        minPct: gddRangeMinPct,
        maxPct: gddRangeMaxPct,
      }),
    [gddSeries, gddRangeMinPct, gddRangeMaxPct]
  );

  const handleSelectGddPhasePreset = (presetKey: Exclude<GddLifecyclePhaseFilter, 'custom'>) => {
    const meta = GDD_LIFECYCLE_PHASE_PRESETS[presetKey];
    setGddPhasePreset(presetKey);
    setGddRangeMinPct(meta.minPct);
    setGddRangeMaxPct(meta.maxPct);
  };

  const toggleCsvMetric = (metric: ExportableSpectralMetricKey) => {
    setSelectedCsvMetrics((prev) =>
      prev.includes(metric) ? prev.filter((m) => m !== metric) : [...prev, metric]
    );
  };

  const gddChartData = useMemo(() => {
    if (gddChartMode === '30day') {
      return gddFilteredWindow.filteredThirtyDayPoints.map((pt) => ({
        xLabel: pt.dateShortLabel,
        cumulativeGdd: pt.cumulativeGdd,
        activeFieldGdd: pt.cumulativeGdd,
        dailyGdd: pt.dailyGdd,
        tempMeanC: pt.tempMeanC,
        completionPct: pt.completionPct,
        stageName: isAr ? pt.stageNameAr : pt.stageNameEn,
        kc: pt.cropCoefficientKc,
      }));
    }
    return gddFilteredWindow.filteredLifecyclePoints.map((pt) => ({
      xLabel: isAr ? pt.dayLabelAr : pt.dayLabelEn,
      cumulativeGdd: pt.cumulativeGdd,
      activeFieldGdd: pt.activeFieldGdd,
      dailyGdd: pt.dailyGdd,
      tempMeanC: pt.tempMeanC,
      completionPct: pt.completionPct,
      stageName: isAr ? pt.stageNameAr : pt.stageNameEn,
      kc: pt.cropCoefficientKc,
    }));
  }, [gddChartMode, gddFilteredWindow, isAr]);

  const currentLifecycleMarkerLabel = useMemo(() => {
    const activePt = gddFilteredWindow.filteredLifecyclePoints.find(
      (pt) => pt.isCurrentFieldMilestone
    );
    if (!activePt) return undefined;
    return isAr ? activePt.dayLabelAr : activePt.dayLabelEn;
  }, [gddFilteredWindow.filteredLifecyclePoints, isAr]);

  const handleExportCropCsv = () => {
    const csv = buildCropRecommenderCsv({
      language,
      area,
      soil,
      recommendations,
      npkSchedule,
      gddSeries,
      exportOptions: {
        startDateISO: csvStartDate,
        endDateISO: csvEndDate,
        selectedMetrics: selectedCsvMetrics,
        farmAverages: effectiveAverages,
        subZones,
        gddPhaseRange: {
          minPct: gddFilteredWindow.minPct,
          maxPct: gddFilteredWindow.maxPct,
        },
      },
    });
    downloadCsvFile(`agro-crop-recommender-${npkCropId}.csv`, csv);
    setCsvExported(true);
    if (csvTimerRef.current) clearTimeout(csvTimerRef.current);
    csvTimerRef.current = setTimeout(() => setCsvExported(false), 2400);
  };

  const parsedManualWaterQuota = useMemo(() => {
    const trimmed = manualWaterQuotaInput.trim();
    if (!trimmed) return null;
    const val = Number(trimmed);
    return Number.isFinite(val) && val > 0 ? val : null;
  }, [manualWaterQuotaInput]);

  const farmWaterBudget = useMemo(
    () =>
      evaluateFarmWaterBudget(
        soil,
        effectiveAverages,
        effectiveForecast,
        undefined,
        parsedManualWaterQuota
      ),
    [soil, effectiveAverages, effectiveForecast, parsedManualWaterQuota]
  );

  const cropWaterById = useMemo(() => {
    const map: Record<string, ReturnType<typeof evaluateCropWaterDeficit>> = {};
    recommendations.forEach((rec) => {
      map[rec.crop.id] = evaluateCropWaterDeficit(rec, farmWaterBudget);
    });
    return map;
  }, [recommendations, farmWaterBudget]);

  const waterDeficitCropCount = useMemo(
    () =>
      recommendations.filter((rec) => cropWaterById[rec.crop.id]?.status === 'deficit').length,
    [recommendations, cropWaterById]
  );

  const filteredCrops = recommendations.filter((item) => {
    const seasonMatch = seasonFilter === 'all' ? true : item.crop.season === seasonFilter;
    if (!seasonMatch) return false;
    if (!waterSafeOnlyFilter) return true;
    const wStatus = cropWaterById[item.crop.id]?.status;
    return wStatus !== 'deficit';
  });

  const topCrop = recommendations[0];
  const activeCropRec =
    recommendations.find((r) => r.crop.id === selectedCropId) || topCrop;
  const activeCropWaterEval = activeCropRec
    ? cropWaterById[activeCropRec.crop.id] ??
      evaluateCropWaterDeficit(activeCropRec, farmWaterBudget)
    : null;
  const waterSafeAlternatives = useMemo(
    () =>
      findWaterSafeAlternativeCrops(
        recommendations,
        farmWaterBudget,
        activeCropRec?.crop.id,
        2
      ),
    [recommendations, farmWaterBudget, activeCropRec?.crop.id]
  );

  const activeRotation =
    rotationStrategies.find((r) => r.id === activeRotationId) || rotationStrategies[1];

  const activeZonePlan = customRotationPlans[activeZoneId];
  const activeZoneEval = rotationEvaluations[activeZoneId];

  const highRiskCount = useMemo(() => {
    const critDisasters = environmentalDisasterWarnings.filter(
      (w) => w.severity === 'critical' || w.severity === 'high'
    ).length;
    const critPests = proactivePestAlerts.filter(
      (a) => a.riskLevel === 'critical' || a.riskLevel === 'high'
    ).length;
    return critDisasters + critPests;
  }, [environmentalDisasterWarnings, proactivePestAlerts]);

  const toggleCheck = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleCropExpanded = (cropId: string) => {
    setExpandedCropIds((prev) => ({ ...prev, [cropId]: !prev[cropId] }));
  };

  const toggleDisasterExpanded = (id: string) => {
    setExpandedDisasterIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const togglePestAlertExpanded = (id: string) => {
    setExpandedPestAlertIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSaveCustomPreset = (e: React.FormEvent) => {
    e.preventDefault();
    const title =
      customPlanName.trim() ||
      (isAr
        ? `خطة دورة مخصصة #${savedPresets.length + 1}`
        : `Custom Rotation Plan #${savedPresets.length + 1}`);
    const newPreset: SavedCustomRotationPreset = {
      id: `preset-${Date.now()}`,
      nameAr: title,
      nameEn: title,
      createdAt: new Date().toTimeString().slice(0, 5),
      plans: JSON.parse(JSON.stringify(customRotationPlans)),
    };
    setSavedPresets((prev) => [newPreset, ...prev]);
    setCustomPlanName('');
  };

  const handleLoadSavedPreset = (preset: SavedCustomRotationPreset) => {
    (['A', 'B', 'C'] as const).forEach((zId) => {
      preset.plans[zId].slots.forEach((slot) => {
        onUpdateZoneCropSlot(zId, slot.slotId, slot.cropId);
      });
    });
  };

  const subTabs: Array<{
    id: RecommenderSubTab;
    num: string;
    ar: string;
    en: string;
    icon: React.ReactNode;
    badge?: number | string;
  }> = [
    {
      id: 'overview',
      num: '01',
      ar: 'أفضل المحاصيل والملخص',
      en: 'Best Crops & Overview',
      icon: <Sprout className="w-4 h-4 shrink-0" />,
      badge: recommendations.length,
    },
    {
      id: 'rotation',
      num: '02',
      ar: 'الدورة الزراعية',
      en: 'Crop Rotation',
      icon: <RotateCcw className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'npk_gdd',
      num: '03',
      ar: 'التسميد NPK وGDD',
      en: 'NPK & GDD Curve',
      icon: <Beaker className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'risks',
      num: '04',
      ar: 'رادار المخاطر والآفات',
      en: 'Risk & Pest Radar',
      icon: <ShieldAlert className="w-4 h-4 shrink-0" />,
      badge: highRiskCount > 0 ? highRiskCount : undefined,
    },
  ];

  return (
    <div className="space-y-5">
      {/* ===================================================================== */}
      {/* COMPACT TOP SUMMARY BAR + 4 ORGANIZED SUB-TABS                        */}
      {/* ===================================================================== */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                {isAr ? '04. مركز التوصيات والدورة' : '04. Crop & Rotation Hub'}
              </span>
              <span>·</span>
              <span className="font-mono tabular-nums">
                {area.feddans} {isAr ? 'فدان' : 'Fed'} {area.qirats} {isAr ? 'قيراط' : 'Qir'}
              </span>
              <span>·</span>
              <span className="font-mono tabular-nums">
                {soil.texture} · EC {soil.salinityEC} dS/m
              </span>
              {activeCropRec && (
                <>
                  <span>·</span>
                  <span className="text-slate-800 dark:text-slate-200 font-semibold">
                    {isAr ? 'النشط:' : 'Active:'}{' '}
                    {isAr ? activeCropRec.crop.nameAr.split(' (')[0] : activeCropRec.crop.nameEn.split(' (')[0]}
                  </span>
                </>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
              {isAr
                ? 'توصيات المحاصيل والتسميد والدورة الزراعية المبسطة'
                : 'Streamlined Crop Suitability, NPK & Rotation Planner'}
            </h2>
          </div>

          {/* Global Export Actions (CSV Customizer + Export + PDF) */}
          <div className="flex flex-wrap items-center gap-2 self-start">
            <button
              type="button"
              data-testid="crop-csv-options-toggle"
              onClick={() => setShowCsvOptions((prev) => !prev)}
              className={`min-h-[38px] px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                showCsvOptions
                  ? 'bg-emerald-700 text-white border-emerald-700'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{isAr ? 'تخصيص CSV' : 'CSV Options'}</span>
            </button>

            <button
              type="button"
              data-testid="crop-export-csv-btn"
              onClick={handleExportCropCsv}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              {csvExported ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>
                {csvExported
                  ? isAr
                    ? 'تم التصدير (CSV)'
                    : 'Exported CSV'
                  : isAr
                  ? 'تصدير CSV'
                  : 'Export CSV'}
              </span>
            </button>

            <button
              type="button"
              onClick={onDownloadPdfReport}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 hover:opacity-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isAr ? 'تقرير PDF' : 'PDF Report'}</span>
            </button>
          </div>
        </div>

        {/* Granular CSV Export Customizer Drawer (On Demand) */}
        {showCsvOptions && (
          <div
            data-testid="crop-csv-options-panel"
            className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                <Calendar className="w-4 h-4" />
                <span>
                  {isAr
                    ? 'تخصيص تقرير CSV: النطاق الزمني والمؤشرات الطيفية (NDVI · LST · رطوبة التربة)'
                    : 'Granular CSV Export: Date Window & Spectral Metrics (NDVI · LST · Soil Moisture)'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    const pts = gddSeries.thirtyDaySummary.dailyPoints;
                    if (pts.length > 0) {
                      setCsvStartDate(pts[0].dateISO);
                      setCsvEndDate(pts[Math.min(13, pts.length - 1)].dateISO);
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300 hover:border-emerald-500 cursor-pointer"
                >
                  {isAr ? 'أول 14 يوماً' : 'First 14 Days'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const pts = gddSeries.thirtyDaySummary.dailyPoints;
                    if (pts.length > 0) {
                      setCsvStartDate(pts[0].dateISO);
                      setCsvEndDate(pts[pts.length - 1].dateISO);
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300 hover:border-emerald-500 cursor-pointer"
                >
                  {isAr ? 'كامل الـ 30 يوماً' : 'Full 30 Days'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-4 grid grid-cols-2 gap-2.5">
                <div>
                  <label
                    htmlFor="crop-csv-start-date"
                    className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    {isAr ? 'من تاريخ:' : 'Start Date:'}
                  </label>
                  <select
                    id="crop-csv-start-date"
                    data-testid="crop-csv-start-date"
                    value={csvStartDate}
                    onChange={(e) => {
                      const nextStart = e.target.value;
                      setCsvStartDate(nextStart);
                      if (csvEndDate && nextStart > csvEndDate) {
                        setCsvEndDate(nextStart);
                      }
                    }}
                    className="w-full min-h-[38px] px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white"
                  >
                    {gddSeries.thirtyDaySummary.dailyPoints.map((pt) => (
                      <option key={pt.dateISO} value={pt.dateISO}>
                        {pt.dateISO} (D+{pt.dayOffset})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="crop-csv-end-date"
                    className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    {isAr ? 'إلى تاريخ:' : 'End Date:'}
                  </label>
                  <select
                    id="crop-csv-end-date"
                    data-testid="crop-csv-end-date"
                    value={csvEndDate}
                    onChange={(e) => {
                      const nextEnd = e.target.value;
                      setCsvEndDate(nextEnd);
                      if (csvStartDate && nextEnd < csvStartDate) {
                        setCsvStartDate(nextEnd);
                      }
                    }}
                    className="w-full min-h-[38px] px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white"
                  >
                    {gddSeries.thirtyDaySummary.dailyPoints.map((pt) => (
                      <option key={pt.dateISO} value={pt.dateISO}>
                        {pt.dateISO} (D+{pt.dayOffset})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="lg:col-span-8 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    {isAr
                      ? 'المؤشرات الطيفية المضمنة (NDVI, LST, Soil Moisture):'
                      : 'Included Spectral Metrics:'}
                  </span>
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setSelectedCsvMetrics(['NDVI', 'LST', 'SM_0_7', 'SM_7_28'])}
                      className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline cursor-pointer"
                    >
                      {isAr ? 'الأساسية (4)' : 'Core (4)'}
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedCsvMetrics(EXPORTABLE_SPECTRAL_METRICS_META.map((m) => m.key))
                      }
                      className="text-sky-700 dark:text-sky-400 font-semibold hover:underline cursor-pointer"
                    >
                      {isAr ? 'الكل (10)' : 'All (10)'}
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {EXPORTABLE_SPECTRAL_METRICS_META.map((meta) => {
                    const checked = selectedCsvMetrics.includes(meta.key);
                    return (
                      <button
                        key={meta.key}
                        type="button"
                        data-testid={`crop-csv-metric-${meta.key}`}
                        onClick={() => toggleCsvMetric(meta.key)}
                        className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                          checked
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span className="w-3 h-3 rounded-xs border border-current inline-flex items-center justify-center text-[9px]">
                          {checked ? '✓' : ''}
                        </span>
                        <span>{meta.key}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4 Organized Sub-Tabs Navigation Strip */}
        <div
          data-testid="recommender-subtabs-bar"
          className="flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 overflow-x-auto"
        >
          {subTabs.map((tab) => {
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                data-testid={`subtab-${tab.id}`}
                onClick={() => setActiveSubTab(tab.id)}
                className={`min-h-[42px] px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 flex-1 justify-center ${
                  isActive
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs border border-slate-200/80 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {tab.icon}
                <span className="font-mono text-[11px] opacity-60">{tab.num}</span>
                <span>{isAr ? tab.ar : tab.en}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 rounded-md font-mono text-[10px] font-bold tabular-nums ${
                      tab.id === 'risks'
                        ? isActive
                          ? 'bg-rose-600 text-white'
                          : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                        : isActive
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                        : 'bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SUB-TAB 1 (DEFAULT): BEST CROPS & QUICK SUMMARY                       */}
      {/* ===================================================================== */}
      {activeSubTab === 'overview' && (
        <div className="space-y-5" data-testid="subtab-panel-overview">
          {/* Active Crop Water Deficit Top Alert Banner */}
          {activeCropRec &&
            activeCropWaterEval &&
            activeCropWaterEval.status !== 'safe' && (
              <div
                role="alert"
                data-testid="active-crop-water-alert"
                className={`rounded-2xl border p-4 sm:p-5 space-y-3 ${
                  activeCropWaterEval.status === 'deficit'
                    ? 'bg-rose-50/90 dark:bg-rose-950/35 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-100'
                    : 'bg-amber-50/90 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-100'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                      <AlertTriangle
                        className={`w-4 h-4 shrink-0 ${
                          activeCropWaterEval.status === 'deficit'
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      />
                      <span>
                        {activeCropWaterEval.status === 'deficit'
                          ? isAr
                            ? 'تحذير عجز مائي: احتياج المحصول النشط يتجاوز الموارد المتاحة'
                            : 'Water Deficit Alert: Active Crop Exceeds Available Water'
                          : isAr
                          ? 'تنبيه مائي: المحصول النشط قريب من الحد الأقصى للمياه المتاحة'
                          : 'Tight Water Margin: Active Crop Approaches Available Water Limit'}
                      </span>
                      <span
                        className={`font-mono text-[11px] px-2 py-0.5 rounded border tabular-nums ${
                          activeCropWaterEval.status === 'deficit'
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-amber-600 text-white border-amber-600'
                        }`}
                      >
                        {activeCropWaterEval.status === 'deficit'
                          ? isAr
                            ? `عجز ${activeCropWaterEval.deficitM3PerFeddan.toLocaleString()} م³/فدان (${activeCropWaterEval.deficitPct}%)`
                            : `-${activeCropWaterEval.deficitM3PerFeddan.toLocaleString()} m³/fed (${activeCropWaterEval.deficitPct}% deficit)`
                          : isAr
                          ? `استهلاك ${activeCropWaterEval.usageRatioPct}% من المتاح`
                          : `${activeCropWaterEval.usageRatioPct}% of water quota`}
                      </span>
                    </div>

                    <p className="text-xs leading-relaxed opacity-90">
                      {isAr
                        ? `المحصول المعتمد «${activeCropRec.crop.nameAr}» يحتاج ${activeCropWaterEval.requiredM3PerFeddan.toLocaleString()} م³/فدان موسمياً، بينما الموارد المائية المتاحة حالياً ${activeCropWaterEval.availableM3PerFeddan.toLocaleString()} م³/فدان بناءً على تحليل رطوبة التربة (السطحية ${farmWaterBudget.sm0to7Pct}% · الجذرية ${farmWaterBudget.sm7to28Pct}%) وهطول الأمطار المتوقع.`
                        : `Active crop "${activeCropRec.crop.nameEn}" requires ${activeCropWaterEval.requiredM3PerFeddan.toLocaleString()} m³/fed seasonally, while estimated available water is ${activeCropWaterEval.availableM3PerFeddan.toLocaleString()} m³/fed based on soil moisture (0–7cm ${farmWaterBudget.sm0to7Pct}% · 7–28cm ${farmWaterBudget.sm7to28Pct}%) and predicted rainfall.`}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {waterSafeAlternatives[0] && (
                      <button
                        type="button"
                        data-testid="adopt-water-safe-alt-btn"
                        onClick={() => onAdoptCrop(waterSafeAlternatives[0].recommendation.crop.id)}
                        className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <Sprout className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {isAr
                            ? `اعتماد بديل موفر (${waterSafeAlternatives[0].recommendation.crop.nameAr.split(' (')[0]})`
                            : `Switch to ${waterSafeAlternatives[0].recommendation.crop.nameEn.split(' (')[0]}`}
                        </span>
                      </button>
                    )}

                    {onConsultAgronomistWithPrompt && (
                      <button
                        type="button"
                        data-testid="consult-advisor-water-deficit-btn"
                        onClick={() =>
                          onConsultAgronomistWithPrompt(
                            isAr
                              ? `لدي عجز مائي للمحصول النشط (${activeCropRec.crop.nameAr}): يحتاج ${activeCropWaterEval.requiredM3PerFeddan} م³/فدان والمتاح ${activeCropWaterEval.availableM3PerFeddan} م³/فدان (رطوبة التربة الجذرية ${farmWaterBudget.sm7to28Pct}%). ما خطة الري الناقص والتسميد أو البديل الأنسب؟`
                              : `My active crop (${activeCropRec.crop.nameEn}) exceeds available water: requires ${activeCropWaterEval.requiredM3PerFeddan} m³/fed vs ${activeCropWaterEval.availableM3PerFeddan} m³/fed available (root-zone moisture ${farmWaterBudget.sm7to28Pct}%). Recommend deficit irrigation schedule or low-water alternatives.`
                          )
                        }
                        className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:opacity-90 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <Bot className="w-3.5 h-3.5 shrink-0" />
                        <span>{isAr ? 'استشارة المستشار لخطة الري' : 'Consult Advisor'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

          {/* Soil-Moisture Water Budget Calibration Bar */}
          <div
            data-testid="farm-water-budget-panel"
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                  <Droplets className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                  <span>
                    {isAr
                      ? 'الميزان المائي التلقائي للمزرعة (تحليل رطوبة التربة + الأمطار الفضائية)'
                      : 'Farm Seasonal Water Budget (Soil Moisture + Satellite Rainfall)'}
                  </span>
                  <span
                    className={`font-mono text-[10px] px-2 py-0.5 rounded border tabular-nums ${
                      farmWaterBudget.moistureCondition === 'dry'
                        ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                        : farmWaterBudget.moistureCondition === 'moderate'
                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                        : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    }`}
                  >
                    {farmWaterBudget.moistureCondition === 'dry'
                      ? isAr
                        ? 'رطوبة التربة: جافة / إجهاد'
                        : 'Soil Moisture: Dry Stress'
                      : farmWaterBudget.moistureCondition === 'moderate'
                      ? isAr
                        ? 'رطوبة التربة: متوسطة'
                        : 'Soil Moisture: Moderate'
                      : isAr
                        ? 'رطوبة التربة: مثالية'
                        : 'Soil Moisture: Optimal'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                  {isAr
                    ? `سطحية (0–7 سم): ${farmWaterBudget.sm0to7Pct}% · جذرية (7–28 سم): ${farmWaterBudget.sm7to28Pct}% · مخزون التربة: ${farmWaterBudget.soilMoistureReserveM3PerFeddan} م³ · الأمطار: ${farmWaterBudget.predictedSeasonalRainM3PerFeddan} م³ · حصة الري: ${farmWaterBudget.irrigationQuotaM3PerFeddan} م³`
                    : `Surface (0–7cm): ${farmWaterBudget.sm0to7Pct}% · Root (7–28cm): ${farmWaterBudget.sm7to28Pct}% · Soil Reserve: ${farmWaterBudget.soilMoistureReserveM3PerFeddan} m³ · Rain: ${farmWaterBudget.predictedSeasonalRainM3PerFeddan} m³ · System Quota: ${farmWaterBudget.irrigationQuotaM3PerFeddan} m³`}
                </p>
              </div>

              {/* Manual Quota Override Control */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <div className="px-3 py-1.5 rounded-xl bg-sky-50/80 dark:bg-sky-950/35 border border-sky-200 dark:border-sky-800 text-xs">
                  <span className="text-slate-600 dark:text-slate-300">
                    {isAr ? 'المتاح المعتمد:' : 'Available:'}{' '}
                  </span>
                  <strong
                    data-testid="farm-total-available-water"
                    className="font-mono tabular-nums text-sky-800 dark:text-sky-300"
                  >
                    {farmWaterBudget.totalAvailableWaterM3PerFeddan.toLocaleString()}{' '}
                    {isAr ? 'م³/فدان' : 'm³/fed'}
                  </strong>
                </div>

                <div className="flex items-center gap-1.5">
                  <label
                    htmlFor="manual-water-quota-input"
                    className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap"
                  >
                    {isAr ? 'تعديل الحصة يدوياً:' : 'Manual Quota:'}
                  </label>
                  <input
                    id="manual-water-quota-input"
                    data-testid="manual-water-quota-input"
                    type="number"
                    min={200}
                    max={10000}
                    step={50}
                    value={manualWaterQuotaInput}
                    onChange={(e) => setManualWaterQuotaInput(e.target.value)}
                    placeholder={String(farmWaterBudget.autoSeasonalAllocationM3PerFeddan)}
                    className="w-28 min-h-[36px] px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-mono tabular-nums text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                  />
                  {farmWaterBudget.isManualOverride && (
                    <button
                      type="button"
                      data-testid="reset-water-quota-btn"
                      onClick={() => setManualWaterQuotaInput('')}
                      className="min-h-[36px] px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-200 cursor-pointer whitespace-nowrap"
                    >
                      {isAr ? 'استعادة التلقائي' : 'Auto Reset'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Hero Top Pick Summary Banner */}
          {topCrop && (
            <div
              data-testid="top-crop-hero-summary"
              className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl p-4 sm:p-5 space-y-4"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>
                      {isAr
                        ? 'المحصول الأعلى توافقاً لأرضك (التوصية الأولى #01)'
                        : 'Top Recommended Crop for Your Land (#01 Pick)'}
                    </span>
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800">
                      {topCrop.gradeLabel}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                    {isAr ? topCrop.crop.nameAr : topCrop.crop.nameEn}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isAr ? topCrop.crop.cultivarAr : topCrop.crop.cultivarEn} ·{' '}
                    {isAr ? 'التوقيت الذهبي:' : 'Golden Window:'}{' '}
                    <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                      {isAr
                        ? `${topCrop.crop.optimalPlantingStartAr} – ${topCrop.crop.optimalPlantingEndAr}`
                        : `${topCrop.crop.optimalPlantingStartEn} – ${topCrop.crop.optimalPlantingEndEn}`}
                    </span>
                  </p>
                </div>

                {/* Quick Cross-Tab Action Shortcuts */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onAdoptCrop(topCrop.crop.id)}
                    className={`min-h-[40px] px-4 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                      selectedCropId === topCrop.crop.id
                        ? 'bg-emerald-700 text-white'
                        : 'bg-slate-900 dark:bg-emerald-700 text-white hover:opacity-90'
                    }`}
                  >
                    {selectedCropId === topCrop.crop.id
                      ? isAr
                        ? '✓ معتمد لمزرعتك'
                        : '✓ Active Crop'
                      : isAr
                      ? 'اعتماد هذا المحصول'
                      : 'Adopt Top Pick'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('npk_gdd')}
                    className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer whitespace-nowrap"
                  >
                    {isAr ? 'حاسبة التسميد NPK ←' : 'NPK Schedule →'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('rotation')}
                    className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer whitespace-nowrap"
                  >
                    {isAr ? 'الدورة الزراعية ←' : 'Crop Rotation →'}
                  </button>
                </div>
              </div>

              {/* 4 Vital Summary Numbers Only */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/60">
                  <div className="text-[11px] text-emerald-900 dark:text-emerald-300">
                    {isAr ? 'نسبة الملاءمة والجودة' : 'Suitability Score'}
                  </div>
                  <div className="mt-0.5 text-2xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                    {topCrop.suitabilityScore}%
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isAr ? 'الإنتاجية المتوقعة' : 'Expected Yield'}
                  </div>
                  <div className="mt-0.5 text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                    {topCrop.expectedYieldTonPerFeddan}{' '}
                    <span className="text-xs font-normal">{isAr ? 'طن/فدان' : 't/fed'}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isAr ? 'العائد التقديري للفدان' : 'Est. Revenue / Fed'}
                  </div>
                  <div className="mt-0.5 text-xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                    {topCrop.estimatedRevenuePerFeddanEgp.toLocaleString()}{' '}
                    <span className="text-xs font-normal">EGP</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isAr ? 'المقنن المائي التكميلي' : 'Net Irrigation Req.'}
                  </div>
                  <div className="mt-0.5 text-xl font-bold font-mono tabular-nums text-sky-700 dark:text-sky-400">
                    {topCrop.netIrrigationRequiredM3PerFeddan}{' '}
                    <span className="text-xs font-normal">m³/{isAr ? 'فدان' : 'fed'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Season & Water Safety Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              {isAr
                ? `جميع المحاصيل المرشحة (${filteredCrops.length}) — ${
                    waterDeficitCropCount > 0
                      ? `${waterDeficitCropCount} محاصيل تتجاوز الموارد المائية المتاحة`
                      : 'جميعها ضمن الحد المائي المتاح'
                  }`
                : `Ranked Crop Candidates (${filteredCrops.length}) — ${
                    waterDeficitCropCount > 0
                      ? `${waterDeficitCropCount} exceed available water resources`
                      : 'All within available water budget'
                  }`}
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start">
              <button
                type="button"
                data-testid="filter-water-safe-btn"
                onClick={() => setWaterSafeOnlyFilter((prev) => !prev)}
                className={`min-h-[36px] px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                  waterSafeOnlyFilter
                    ? 'bg-sky-700 text-white border-sky-700'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-sky-500/60'
                }`}
              >
                <Droplets className="w-3.5 h-3.5 shrink-0" />
                <span>{isAr ? 'الملائم مائياً فقط' : 'Water-Safe Only'}</span>
              </button>

              <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto">
                {(
                  [
                    { id: 'all', ar: 'كل المواسم (12)', en: 'All Crops (12)' },
                    { id: 'winter', ar: 'شتوي', en: 'Winter' },
                    { id: 'summer', ar: 'صيفي/نيلي', en: 'Summer' },
                    { id: 'perennial', ar: 'بستاني مستديم', en: 'Perennial' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSeasonFilter(tab.id)}
                    className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      seasonFilter === tab.id
                        ? 'bg-emerald-700 text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {isAr ? tab.ar : tab.en}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Simplified Progressive-Disclosure Crop Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" data-testid="recommended-crops-grid">
            {filteredCrops.map((item, rankIdx) => {
              const isAdopted = selectedCropId === item.crop.id;
              const isExpanded = !!expandedCropIds[item.crop.id];
              const waterEval =
                cropWaterById[item.crop.id] ?? evaluateCropWaterDeficit(item, farmWaterBudget);
              return (
                <div
                  key={item.crop.id}
                  data-testid={`crop-recommendation-card-${item.crop.id}`}
                  className={`bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border transition-colors flex flex-col justify-between space-y-3.5 ${
                    isAdopted
                      ? 'border-emerald-600 dark:border-emerald-500 ring-1 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Concise Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400">
                          {String(rankIdx + 1).padStart(2, '0')} · {item.gradeLabel}
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5 truncate">
                          {isAr ? item.crop.nameAr : item.crop.nameEn}
                        </h3>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {isAr ? item.crop.cultivarAr : item.crop.cultivarEn}
                        </div>
                      </div>

                      <div className="text-end shrink-0">
                        <div className="text-2xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                          {item.suitabilityScore}%
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {isAr ? 'الملاءمة' : 'Suitability'}
                        </div>
                      </div>
                    </div>

                    {/* Golden Window Strip */}
                    <div className="px-3 py-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/60 flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        {isAr ? 'التوقيت الذهبي:' : 'Golden Window:'}
                      </span>
                      <span className="font-mono font-bold text-emerald-800 dark:text-emerald-200 tabular-nums">
                        {isAr
                          ? `${item.crop.optimalPlantingStartAr} – ${item.crop.optimalPlantingEndAr}`
                          : `${item.crop.optimalPlantingStartEn} – ${item.crop.optimalPlantingEndEn}`}
                      </span>
                    </div>

                    {/* 3 Core Summary KPIs */}
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {isAr ? 'المطر / الري' : 'Rain / Irrig.'}
                        </div>
                        <div className="font-mono font-bold text-slate-900 dark:text-white mt-0.5 tabular-nums">
                          {item.predictedRainCoveragePct}% · {item.netIrrigationRequiredM3PerFeddan}m³
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {isAr ? 'الإنتاجية' : 'Yield'}
                        </div>
                        <div className="font-mono font-bold text-slate-900 dark:text-white mt-0.5 tabular-nums">
                          {item.expectedYieldTonPerFeddan} {isAr ? 'ط/ف' : 't/fed'}
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {isAr ? 'العائد/فدان' : 'Revenue/Fed'}
                        </div>
                        <div className="font-mono font-bold text-emerald-700 dark:text-emerald-400 mt-0.5 tabular-nums">
                          {item.estimatedRevenuePerFeddanEgp.toLocaleString()} EGP
                        </div>
                      </div>
                    </div>

                    {/* Per-Card Water Availability vs Requirement Status Warning Badge */}
                    <div
                      data-testid={`crop-water-badge-${item.crop.id}`}
                      data-water-status={waterEval.status}
                      className={`px-3 py-2 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                        waterEval.status === 'deficit'
                          ? 'bg-rose-50/85 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                          : waterEval.status === 'tight'
                          ? 'bg-amber-50/85 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                          : 'bg-emerald-50/70 dark:bg-emerald-950/25 border-emerald-200 dark:border-emerald-800/70 text-emerald-900 dark:text-emerald-200'
                      }`}
                    >
                      <span className="flex items-center gap-1.5 font-semibold min-w-0">
                        {waterEval.status === 'deficit' ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                        ) : waterEval.status === 'tight' ? (
                          <Droplets className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                        ) : (
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        )}
                        <span className="truncate">
                          {waterEval.status === 'deficit'
                            ? isAr
                              ? 'تحذير: يتجاوز الموارد المائية المتاحة'
                              : 'Warning: Exceeds Available Water'
                            : waterEval.status === 'tight'
                            ? isAr
                              ? 'تنبيه: قريب من الحد المائي'
                              : 'Caution: Near Water Quota Limit'
                            : isAr
                            ? 'متوافق مع الموارد المائية'
                            : 'Within Available Water Budget'}
                        </span>
                      </span>

                      <span className="font-mono font-bold tabular-nums shrink-0 text-[11px]" dir="ltr">
                        {waterEval.status === 'deficit'
                          ? `-${waterEval.deficitM3PerFeddan.toLocaleString()} m³ (-${waterEval.deficitPct}%)`
                          : `+${waterEval.balanceDeltaM3PerFeddan.toLocaleString()} m³`}
                      </span>
                    </div>

                    {/* Progressive Disclosure: Deep MCDA Breakdown, Planting Risks & Pests */}
                    {isExpanded && (
                      <div
                        data-testid={`crop-details-drawer-${item.crop.id}`}
                        className="pt-2 space-y-3 border-t border-slate-100 dark:border-slate-800"
                      >
                        {/* 5-Factor MCDA Score */}
                        <div className="grid grid-cols-5 gap-1.5 text-[11px] font-mono tabular-nums">
                          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/70 text-center">
                            <div className="text-slate-400">{isAr ? 'التربة' : 'Soil'}</div>
                            <div className="font-bold text-slate-900 dark:text-white">
                              {item.breakdown.soilScore}%
                            </div>
                          </div>
                          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/70 text-center">
                            <div className="text-slate-400">{isAr ? 'الملوحة' : 'Salt'}</div>
                            <div className="font-bold text-slate-900 dark:text-white">
                              {item.breakdown.salinityScore}%
                            </div>
                          </div>
                          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/70 text-center">
                            <div className="text-slate-400">{isAr ? 'المناخ' : 'Climate'}</div>
                            <div className="font-bold text-slate-900 dark:text-white">
                              {item.breakdown.climateScore}%
                            </div>
                          </div>
                          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/70 text-center">
                            <div className="text-slate-400">{isAr ? 'المياه' : 'Water'}</div>
                            <div className="font-bold text-slate-900 dark:text-white">
                              {item.breakdown.waterSynergyScore}%
                            </div>
                          </div>
                          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/70 text-center">
                            <div className="text-slate-400">{isAr ? 'الدورة' : 'Rot.'}</div>
                            <div className="font-bold text-slate-900 dark:text-white">
                              {item.breakdown.rotationScore}%
                            </div>
                          </div>
                        </div>

                        {/* Why Grade-A & Early/Late Risks */}
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70 space-y-2 text-xs">
                          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                            <strong className="text-slate-900 dark:text-white">
                              {isAr ? 'لماذا يحقق جودة Grade-A؟' : 'Why Grade-A?'}
                            </strong>{' '}
                            {isAr ? item.whyGradeAAr : item.whyGradeAEn}
                          </p>
                          <div className="pt-1.5 border-t border-slate-200/70 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                            <div>
                              <span className="font-semibold text-amber-700 dark:text-amber-400">
                                {isAr ? 'مخاطر التبكير:' : 'Early Risk:'}
                              </span>{' '}
                              {isAr ? item.crop.earlyPlantingRiskAr : item.crop.earlyPlantingRiskEn}
                            </div>
                            <div>
                              <span className="font-semibold text-rose-700 dark:text-rose-400">
                                {isAr ? 'مخاطر التأخير:' : 'Late Risk:'}
                              </span>{' '}
                              {isAr ? item.crop.latePlantingRiskAr : item.crop.latePlantingRiskEn}
                            </div>
                          </div>
                        </div>

                        {/* Common Pests & Rotation Mitigation */}
                        {item.crop.commonPestsAndDiseases &&
                          item.crop.commonPestsAndDiseases.length > 0 && (
                            <div
                              data-testid={`crop-pests-section-${item.crop.id}`}
                              className="p-3 rounded-xl bg-rose-50/40 dark:bg-slate-800/70 border border-rose-200/70 dark:border-slate-700 space-y-2"
                            >
                              <div className="text-xs font-bold text-rose-900 dark:text-rose-300 flex items-center gap-1.5">
                                <Bug className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                                {isAr
                                  ? 'الآفات الشائعة وآلية كسرها بالدورة:'
                                  : 'Common Pests & Rotation Mitigation:'}
                              </div>

                              <div className="space-y-1.5">
                                {item.crop.commonPestsAndDiseases.map((pest, pIdx) => (
                                  <div
                                    key={pIdx}
                                    className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-[11px] space-y-0.5"
                                  >
                                    <div className="flex flex-wrap items-center justify-between gap-1 font-bold text-slate-900 dark:text-white">
                                      <span>{isAr ? pest.nameAr : pest.nameEn}</span>
                                      <span className="text-[10px] font-mono text-rose-700 dark:text-rose-300">
                                        {isAr ? pest.typeLabelAr : pest.typeLabelEn}
                                      </span>
                                    </div>
                                    <p className="text-slate-600 dark:text-slate-400">
                                      {isAr ? pest.symptomsAr : pest.symptomsEn}
                                    </p>
                                    <p className="text-emerald-800 dark:text-emerald-300 font-medium">
                                      🛡️ {isAr ? pest.rotationMitigationAr : pest.rotationMitigationEn}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                      </div>
                    )}
                  </div>

                  {/* Card Footer: Harvest + Expand Toggle + Adopt */}
                  <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-slate-500">
                      {isAr ? 'الحصاد:' : 'Harvest:'}{' '}
                      {isAr ? item.expectedHarvestDateAr : item.expectedHarvestDateEn}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        data-testid={`toggle-crop-details-${item.crop.id}`}
                        onClick={() => toggleCropExpanded(item.crop.id)}
                        className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer whitespace-nowrap"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-3.5 h-3.5" />
                            <span>{isAr ? 'إخفاء التفاصيل' : 'Hide Details'}</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3.5 h-3.5" />
                            <span>{isAr ? 'التفاصيل والآفات' : 'Details & Pests'}</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => onAdoptCrop(item.crop.id)}
                        className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                          isAdopted
                            ? 'bg-emerald-700 text-white'
                            : 'bg-slate-900 dark:bg-slate-800 text-white hover:bg-emerald-700'
                        }`}
                      >
                        {isAdopted
                          ? isAr
                            ? '✓ معتمد'
                            : '✓ Active'
                          : isAr
                          ? 'اعتماد المحصول'
                          : 'Adopt Crop'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUB-TAB 2: CROP ROTATION (CUSTOM ZONES / MULTI-YEAR / NASA MATRIX)    */}
      {/* ===================================================================== */}
      {activeSubTab === 'rotation' && (
        <div className="space-y-5" data-testid="subtab-panel-rotation">
          {/* Segmented Rotation Tool Switcher */}
          <div
            data-testid="rotation-mode-switcher"
            className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>
                {isAr
                  ? 'اختر أداة تخطيط الدورة الزراعية:'
                  : 'Select Rotation Planning Workspace:'}
              </span>
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto">
              {(
                [
                  {
                    id: 'custom',
                    ar: '1. مخطط الزونا التفاعلي (A/B/C)',
                    en: '1. Interactive Zone Planner',
                  },
                  {
                    id: 'multi_year',
                    ar: '2. استراتيجية 3–5 سنوات',
                    en: '2. 3–5 Year Strategy',
                  },
                  {
                    id: 'nasa_matrix',
                    ar: '3. مصفوفة المقارنة المرجعية',
                    en: '3. Reference Matrix (A/B/C)',
                  },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  data-testid={`rotation-mode-${m.id}`}
                  onClick={() => setRotationSubMode(m.id)}
                  className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    rotationSubMode === m.id
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {isAr ? m.ar : m.en}
                </button>
              ))}
            </div>
          </div>

          {/* VIEW 2A: INTERACTIVE CUSTOM CROP ROTATION PLANNER */}
          {rotationSubMode === 'custom' && (
            <div
              data-testid="custom-rotation-planner"
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-5"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <div className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    {isAr
                      ? 'مخطط الدورة الزراعية المخصصة لكل زونا (Zones A / B / C)'
                      : 'Interactive Custom Crop Rotation Strategy Builder'}
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                    {isAr
                      ? 'اختر محاصيل المواسم السابقة والقادمة واحصل على فحص التربة والآفات فوراً'
                      : 'Configure Past & Future Crops with Instant Soil & Pest Diagnostics'}
                  </h3>
                </div>

                {/* Zone Selector Tabs + Auto-Optimize */}
                <div className="flex flex-wrap items-center gap-2">
                  {(['A', 'B', 'C'] as const).map((zId) => {
                    const ev = rotationEvaluations[zId];
                    const hasCrit = ev.warnings.some((w) => w.severity === 'critical');
                    return (
                      <button
                        key={zId}
                        type="button"
                        onClick={() => setActiveZoneId(zId)}
                        className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                          activeZoneId === zId
                            ? 'bg-emerald-700 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        <span>{isAr ? `زونا ${zId}` : `Zone ${zId}`}</span>
                        <span className="font-mono text-[11px] opacity-90 tabular-nums">
                          ({ev.soilHealthScore}%{hasCrit ? ' ⚠️' : ''})
                        </span>
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => onAutoOptimizeZone(activeZoneId)}
                    data-testid="auto-optimize-rotation-btn"
                    className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>
                      {isAr
                        ? `تحسين زونا ${activeZoneId} تلقائياً`
                        : `Auto-Optimize Zone ${activeZoneId}`}
                    </span>
                  </button>
                </div>
              </div>

              {/* 4 KPI Summary Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {isAr ? `صحة التربة (زونا ${activeZoneId})` : `Soil Health (Zone ${activeZoneId})`}
                  </div>
                  <div
                    data-testid="rotation-soil-health-score"
                    className="mt-1 text-2xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400"
                  >
                    {activeZoneEval.soilHealthScore}%
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {isAr ? 'كسر دورة الآفات' : 'Pest Break Score'}
                  </div>
                  <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                    {activeZoneEval.pestBreakScore}%
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {isAr ? 'رصيد النيتروجين' : 'Nitrogen Balance'}
                  </div>
                  <div
                    className={`mt-1 text-2xl font-bold font-mono tabular-nums ${
                      activeZoneEval.nitrogenBalanceKgPerFeddan >= 0
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {activeZoneEval.nitrogenBalanceKgPerFeddan > 0 ? '+' : ''}
                    {activeZoneEval.nitrogenBalanceKgPerFeddan} kg
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {isAr ? 'الاستهلاك المائي/موسم' : 'Seasonal Water'}
                  </div>
                  <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-sky-600 dark:text-sky-400">
                    {activeZoneEval.avgSeasonalWaterM3PerFeddan} m³
                  </div>
                </div>
              </div>

              {/* 5-Season Crop Sequence Selector Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {activeZonePlan.slots.map((slot, idx) => {
                  const cropObj =
                    CROP_DATABASE.find((c) => c.id === slot.cropId) || CROP_DATABASE[0];
                  const fam = getCropFamily(cropObj.id);
                  const famMeta = FAMILY_COLORS[fam] || FAMILY_COLORS.gramineae;

                  return (
                    <div
                      key={slot.slotId}
                      className={`p-3.5 rounded-xl border space-y-2 ${
                        slot.isCurrent
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-600'
                          : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">
                        0{idx + 1} · {isAr ? slot.periodAr : slot.periodEn}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        {isAr ? slot.monthsSpanAr : slot.monthsSpanEn}
                      </div>

                      <select
                        id={`rotation-slot-${activeZoneId}-${slot.slotId}`}
                        data-testid={`rotation-select-${activeZoneId}-${slot.slotId}`}
                        value={slot.cropId}
                        onChange={(e) =>
                          onUpdateZoneCropSlot(activeZoneId, slot.slotId, e.target.value)
                        }
                        className="w-full min-h-[40px] px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                      >
                        {CROP_DATABASE.map((c) => (
                          <option key={c.id} value={c.id}>
                            {isAr ? c.nameAr : c.nameEn}
                          </option>
                        ))}
                      </select>

                      <div className={`px-2 py-1 rounded text-[11px] font-medium ${famMeta.bg}`}>
                        {isAr ? famMeta.labelAr : famMeta.labelEn}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Scientific Agro-Warnings & One-Click Remedies */}
              <div className="space-y-2" data-testid="rotation-warnings-list">
                {activeZoneEval.warnings.map((w) => {
                  const isCrit = w.severity === 'critical';
                  const isWarn = w.severity === 'warning';
                  const fixCrop = w.fixSuggestionCropId
                    ? CROP_DATABASE.find((c) => c.id === w.fixSuggestionCropId)
                    : undefined;

                  return (
                    <div
                      key={w.id}
                      className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isCrit
                          ? 'bg-rose-50/90 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800'
                          : isWarn
                          ? 'bg-amber-50/90 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
                          : 'bg-emerald-50/90 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {isCrit || isWarn ? (
                            <AlertTriangle
                              className={`w-4 h-4 shrink-0 ${
                                isCrit ? 'text-rose-600' : 'text-amber-600'
                              }`}
                            />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}
                          <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                            [{isAr ? w.transitionLabelAr : w.transitionLabelEn}]
                          </span>
                          <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                            {isAr ? w.titleAr : w.titleEn}
                          </h5>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                          {isAr ? w.detailAr : w.detailEn}
                        </p>
                      </div>

                      {fixCrop && w.fixSlotId && (
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateZoneCropSlot(activeZoneId, w.fixSlotId!, fixCrop.id)
                          }
                          className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-emerald-700 text-white text-xs font-semibold hover:opacity-90 whitespace-nowrap shrink-0 cursor-pointer self-start sm:self-center"
                        >
                          {isAr
                            ? `استبدال بـ ${fixCrop.nameAr.split(' (')[0]}`
                            : `Switch to ${fixCrop.nameEn.split(' (')[0]}`}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Progressive Disclosure Toggle for Multi-Zone Visual Calendar */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowMultiZoneCalendar((p) => !p)}
                  className="min-h-[38px] px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                >
                  <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    {showMultiZoneCalendar
                      ? isAr
                        ? 'إخفاء التقويم الزمني المقارن للزونات A/B/C'
                        : 'Hide Multi-Zone Calendar Timeline'
                      : isAr
                      ? 'عرض التقويم الزمني المقارن للزونات A/B/C (2025–2028)'
                      : 'Show Multi-Zone Calendar Timeline (2025–2028)'}
                  </span>
                  {showMultiZoneCalendar ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>

                {showMultiZoneCalendar && (
                  <div className="mt-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 overflow-x-auto">
                    <div className="min-w-[680px] space-y-2.5">
                      {(['A', 'B', 'C'] as const).map((zId) => {
                        const plan = customRotationPlans[zId];
                        const ev = rotationEvaluations[zId];
                        return (
                          <div
                            key={zId}
                            className={`p-2.5 rounded-xl border ${
                              activeZoneId === zId
                                ? 'bg-white dark:bg-slate-900 border-emerald-600'
                                : 'bg-white/70 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2 text-xs">
                              <span className="font-bold text-slate-900 dark:text-white">
                                {isAr ? `زونا ${zId}` : `Zone ${zId}`} —{' '}
                                <span className="font-mono text-emerald-700 dark:text-emerald-400">
                                  {ev.soilHealthScore}%
                                </span>
                              </span>
                              <span className="font-mono text-[11px] text-slate-500">
                                N: {ev.nitrogenBalanceKgPerFeddan > 0 ? '+' : ''}
                                {ev.nitrogenBalanceKgPerFeddan} kg/fed · {ev.avgSeasonalWaterM3PerFeddan} m³
                              </span>
                            </div>
                            <div className="grid grid-cols-5 gap-2">
                              {plan.slots.map((slot) => {
                                const c =
                                  CROP_DATABASE.find((item) => item.id === slot.cropId) ||
                                  CROP_DATABASE[0];
                                const fam = getCropFamily(c.id);
                                const famStyle = FAMILY_COLORS[fam] || FAMILY_COLORS.gramineae;
                                return (
                                  <div
                                    key={slot.slotId}
                                    className={`p-2 rounded-lg border-s-4 ${famStyle.bg} ${famStyle.border} text-xs`}
                                  >
                                    <div className="font-mono text-[10px] opacity-75">
                                      {isAr ? slot.monthsSpanAr : slot.monthsSpanEn}
                                    </div>
                                    <div className="font-bold truncate mt-0.5">
                                      {isAr ? c.nameAr.split(' (')[0] : c.nameEn.split(' (')[0]}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Save & Manage Custom Rotation Presets */}
              <form
                onSubmit={handleSaveCustomPreset}
                className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2 flex-1">
                  <input
                    id="custom-rotation-name-input"
                    type="text"
                    value={customPlanName}
                    onChange={(e) => setCustomPlanName(e.target.value)}
                    placeholder={
                      isAr
                        ? 'احفظ هذه الخطة باسم مخصص (مثال: دورة التصدير 2027)...'
                        : 'Save custom plan name (e.g. Export Plan 2027)...'
                    }
                    className="flex-1 min-h-[40px] px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                  <button
                    type="submit"
                    className="min-h-[40px] px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isAr ? 'حفظ الخطة' : 'Save Plan'}</span>
                  </button>
                </div>

                {savedPresets.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs text-slate-500">
                      {isAr ? 'المحفوظة:' : 'Saved:'}
                    </span>
                    {savedPresets.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleLoadSavedPreset(p)}
                        className="min-h-[34px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 hover:border-emerald-600 cursor-pointer"
                      >
                        {isAr ? p.nameAr : p.nameEn}
                      </button>
                    ))}
                  </div>
                )}
              </form>
            </div>
          )}

          {/* VIEW 2B: MULTI-YEAR (3–5 YEAR) CROP ROTATION STRATEGY GENERATOR */}
          {rotationSubMode === 'multi_year' && (
            <div
              data-testid="multi-year-rotation-strategies-panel"
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-5"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    <RotateCcw className="w-4 h-4" />
                    <span>
                      {isAr
                        ? 'استراتيجيات الدورة الزراعية طويلة المدى (3–5 سنوات)'
                        : 'Multi-Year (3–5 Year) Strategic Crop Rotation Generator'}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                    {isAr
                      ? `خطط تعاقب ${multiYearCycle} سنوات: القمح والبرسيم والقطن`
                      : `${multiYearCycle}-Year Crop Rotation Strategies`}
                  </h3>
                </div>

                {/* 3–5 Year Cycle Length Selector */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl self-start">
                  {([3, 4, 5] as const).map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      data-testid={`multi-year-cycle-btn-${yr}`}
                      onClick={() => setMultiYearCycle(yr)}
                      className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                        multiYearCycle === yr
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {isAr ? `${yr} سنوات` : `${yr} Years`}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3 Focus Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {multiYearStrategies.map((strat) => {
                  const isActive = strat.id === activeMultiYearFocus;
                  const iconEl =
                    strat.id === 'soil_regeneration' ? (
                      <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ) : strat.id === 'water_conservation' ? (
                      <Droplets className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    ) : (
                      <TrendingUp className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    );

                  return (
                    <button
                      key={strat.id}
                      type="button"
                      data-testid={`multi-year-focus-tab-${strat.id}`}
                      onClick={() => setActiveMultiYearFocus(strat.id)}
                      className={`p-4 rounded-xl border text-start transition-all cursor-pointer flex flex-col justify-between space-y-2.5 ${
                        isActive
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/35 border-emerald-600 ring-1 ring-emerald-600/30'
                          : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300">
                            {iconEl}
                            {strat.code}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                            ROI {strat.marketImplications.annualizedRoiPct}%
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {isAr ? strat.titleAr : strat.titleEn}
                        </h4>
                      </div>

                      <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700/70 grid grid-cols-3 gap-1.5 text-[11px] font-mono tabular-nums">
                        <div>
                          <span className="text-slate-400 block">{isAr ? 'أزوت' : 'Soil N'}</span>
                          <strong className="text-emerald-700 dark:text-emerald-400">
                            +{strat.expectedBenefits.cumulativeNitrogenKgPerFeddan}kg
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block">{isAr ? 'المياه' : 'Water'}</span>
                          <strong className="text-sky-700 dark:text-sky-400">
                            -{strat.expectedBenefits.waterSavingsPct}%
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block">{isAr ? 'الآفات' : 'Pests'}</span>
                          <strong className="text-amber-700 dark:text-amber-400">
                            -{strat.expectedBenefits.pestReductionPct}%
                          </strong>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Yearly Sequence Cards */}
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    {isAr
                      ? `التعاقب السنوي على مدار ${activeMultiYearStrategy.cycleYears} سنوات:`
                      : `${activeMultiYearStrategy.cycleYears}-Year Crop Sequence:`}
                  </h4>
                  <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                    {isAr ? 'صافي عائد الدورة/فدان:' : 'Cycle Net Return/Fed:'}{' '}
                    {activeMultiYearStrategy.marketImplications.cumulativeNetProfitPerFeddanEgp.toLocaleString()}{' '}
                    EGP
                  </span>
                </div>

                <div
                  data-testid="multi-year-sequence-grid"
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5"
                >
                  {activeMultiYearStrategy.yearlySequence.map((yr) => (
                    <div
                      key={yr.yearNumber}
                      data-testid={`multi-year-card-${yr.yearNumber}`}
                      className="p-4 rounded-xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-2.5"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-700 pb-2">
                          <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400">
                            {isAr ? yr.yearLabelAr : yr.yearLabelEn}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-emerald-600/15 text-emerald-800 dark:text-emerald-300 font-mono text-[11px] font-bold">
                            +{yr.nitrogenDeltaKgPerFeddan} kg N
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs">
                          <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                            <span className="text-[10px] font-mono text-sky-700 dark:text-sky-400 font-bold block">
                              {isAr ? 'شتوي:' : 'Winter:'}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {isAr ? yr.winterCropAr : yr.winterCropEn}
                            </span>
                          </div>
                          <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                            <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400 font-bold block">
                              {isAr ? 'صيفي/نيلي:' : 'Summer:'}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {isAr ? yr.summerCropAr : yr.summerCropEn}
                            </span>
                          </div>
                          <div className="px-2 py-1.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/60 text-[11px] text-emerald-900 dark:text-emerald-300">
                            {isAr ? yr.coverOrIntercropAr : yr.coverOrIntercropEn}
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700 flex items-center justify-between text-[11px] font-mono tabular-nums">
                        <span className="text-sky-700 dark:text-sky-400">
                          💧 {yr.waterUseM3PerFeddan} m³
                        </span>
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                          {yr.expectedNetReturnEgpPerFeddan.toLocaleString()} EGP
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Progressive Disclosure for Benefits & Egyptian Examples */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowMultiYearDetails((p) => !p)}
                  className="min-h-[38px] px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                >
                  <span>
                    {showMultiYearDetails
                      ? isAr
                        ? 'إخفاء الأمثلة المصرية والمنافع التفصيلية'
                        : 'Hide Egyptian Examples & Market Details'
                      : isAr
                      ? 'عرض الأمثلة التطبيقية المصرية (قمح/برسيم/قطن) والمنافع الاقتصادية'
                      : 'Show Egyptian Crop Examples & Economic Details'}
                  </span>
                  {showMultiYearDetails ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>

                {showMultiYearDetails && (
                  <div className="mt-3 space-y-3">
                    <div
                      data-testid="multi-year-egyptian-examples"
                      className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs"
                    >
                      {(isAr
                        ? activeMultiYearStrategy.egyptianCropExamplesAr
                        : activeMultiYearStrategy.egyptianCropExamplesEn
                      ).map((ex, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-800/70 text-slate-700 dark:text-slate-300 leading-relaxed"
                        >
                          {ex}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                        <div className="font-bold text-emerald-700 dark:text-emerald-400">
                          {isAr ? 'تحسين التربة:' : 'Soil Health:'} +
                          {activeMultiYearStrategy.expectedBenefits.soilHealthScoreGainPct}%
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300">
                          {isAr
                            ? activeMultiYearStrategy.expectedBenefits.soilHealthDetailAr
                            : activeMultiYearStrategy.expectedBenefits.soilHealthDetailEn}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                        <div className="font-bold text-amber-700 dark:text-amber-400">
                          {isAr ? 'خفض الآفات:' : 'Pest Break:'} -
                          {activeMultiYearStrategy.expectedBenefits.pestReductionPct}%
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300">
                          {isAr
                            ? activeMultiYearStrategy.expectedBenefits.pestReductionDetailAr
                            : activeMultiYearStrategy.expectedBenefits.pestReductionDetailEn}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                        <div className="font-bold text-sky-700 dark:text-sky-400">
                          {isAr ? 'الوفر المائي:' : 'Water Saved:'}{' '}
                          {activeMultiYearStrategy.expectedBenefits.waterSavingsM3PerFeddanCycle.toLocaleString()} m³
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300">
                          {isAr
                            ? activeMultiYearStrategy.expectedBenefits.waterSavingsDetailAr
                            : activeMultiYearStrategy.expectedBenefits.waterSavingsDetailEn}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {isAr ? 'التسويق والتصدير:' : 'Market & Export:'} ROI{' '}
                          {activeMultiYearStrategy.marketImplications.annualizedRoiPct}%
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300">
                          {isAr
                            ? activeMultiYearStrategy.marketImplications.exportAndContractOpportunitiesAr
                            : activeMultiYearStrategy.marketImplications.exportAndContractOpportunitiesEn}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW 2C: NASA SPACE APPS 3-ROTATION REFERENCE MATRIX */}
          {rotationSubMode === 'nasa_matrix' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    {isAr
                      ? 'مصفوفة مقارنة استراتيجيات الدورة الزراعية المرجعية (NASA / ESA)'
                      : 'Reference Crop Rotation Comparison Matrix (A vs B vs C)'}
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                    {isAr
                      ? '(A) خط الأساس مقابل (B) المجددة للتربة مقابل (C) الذكية مناخياً'
                      : '(A) Baseline vs (B) Soil-Regenerative vs (C) Climate-Resilient'}
                  </h3>
                </div>

                <div className="flex items-center gap-1.5">
                  {rotationStrategies.map((rot) => (
                    <button
                      key={rot.id}
                      type="button"
                      onClick={() => setActiveRotationId(rot.id)}
                      className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                        activeRotationId === rot.id
                          ? 'bg-emerald-700 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {isAr ? `الاستراتيجية (${rot.id})` : `Strategy (${rot.id})`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {rotationStrategies.map((rot) => {
                  const isSelected = rot.id === activeRotationId;
                  return (
                    <div
                      key={rot.id}
                      onClick={() => setActiveRotationId(rot.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-colors space-y-2.5 ${
                        isSelected
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-600'
                          : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-mono font-bold">
                        <span className="text-emerald-700 dark:text-emerald-400">{rot.code}</span>
                        <span className="text-slate-900 dark:text-white tabular-nums">
                          {isAr ? `ربحية ${rot.netProfitIndexPct}%` : `Profit ${rot.netProfitIndexPct}%`}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {isAr ? rot.titleAr : rot.titleEn}
                      </h4>

                      <ol className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                        {(isAr ? rot.sequenceAr : rot.sequenceEn).map((step, i) => (
                          <li key={i} className="font-medium">
                            {step}
                          </li>
                        ))}
                      </ol>

                      <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700 flex items-center justify-between text-xs font-mono tabular-nums">
                        <span>{rot.waterUseM3PerFeddanYear} m³</span>
                        <span
                          className={
                            rot.soilNitrogenDeltaKgPerFeddan >= 0
                              ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                              : 'text-rose-600'
                          }
                        >
                          N: {rot.soilNitrogenDeltaKgPerFeddan > 0 ? '+' : ''}
                          {rot.soilNitrogenDeltaKgPerFeddan} kg/fed
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Progressive Disclosure for Evidence, Gaps, Checklist & Pest Mitigation */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowNasaMatrixDetails((p) => !p)}
                  className="min-h-[38px] px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                >
                  <span>
                    {showNasaMatrixDetails
                      ? isAr
                        ? 'إخفاء الأدلة الفضائية وقائمة التحقق وكسر الآفات'
                        : 'Hide Satellite Evidence, Checklist & Pest Mitigation'
                      : isAr
                      ? `عرض الأدلة الفضائية وقائمة التحقق وكسر الآفات للاستراتيجية (${activeRotation.id})`
                      : `Show Satellite Evidence, Checklist & Pest Mitigation (${activeRotation.id})`}
                  </span>
                  {showNasaMatrixDetails ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>

                {showNasaMatrixDetails && (
                  <div className="mt-4 space-y-4">
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          {isAr ? '1. الأدلة الفضائية (NASA / ESA)' : '1. Satellite Data Evidence'}
                        </h4>
                        {activeRotation.nasaEvidence.map((ev, i) => (
                          <div
                            key={i}
                            className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs space-y-1"
                          >
                            <div className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                              {ev.mission} · {ev.parameter}
                            </div>
                            <p className="text-slate-600 dark:text-slate-300">
                              {isAr ? ev.findingAr : ev.findingEn}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          {isAr ? '2. القيود الميدانية' : '2. Field Data Gaps'}
                        </h4>
                        <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                          {(isAr ? activeRotation.dataGapsAr : activeRotation.dataGapsEn).map(
                            (gap, i) => (
                              <li
                                key={i}
                                className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800"
                              >
                                ⚠️ {gap}
                              </li>
                            )
                          )}
                        </ul>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          {isAr ? '3. قائمة مراجعة المهندس' : '3. Agronomist Checklist'}
                        </h4>
                        <div className="space-y-2">
                          {activeRotation.agronomistChecklist.map((chk) => {
                            const checked = !!checkedItems[chk.id];
                            return (
                              <label
                                key={chk.id}
                                className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-start gap-2 text-xs cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleCheck(chk.id)}
                                  className="mt-0.5 w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                                />
                                <span
                                  className={
                                    checked
                                      ? 'text-slate-900 dark:text-white font-medium'
                                      : 'text-slate-600 dark:text-slate-400'
                                  }
                                >
                                  {isAr ? chk.labelAr : chk.labelEn}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {activeRotation.pestAndDiseaseMitigation &&
                      activeRotation.pestAndDiseaseMitigation.length > 0 && (
                        <div
                          data-testid="rotation-strategy-pest-mitigation"
                          className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/70 space-y-3"
                        >
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                            {isAr
                              ? `أثر ${activeRotation.titleAr} في كسر دورة الآفات:`
                              : `Pest Mitigation Impact of ${activeRotation.titleEn}:`}
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {activeRotation.pestAndDiseaseMitigation.map((pm, idx) => (
                              <div
                                key={idx}
                                className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-bold text-slate-900 dark:text-white">
                                    {isAr ? pm.cropNameAr : pm.cropNameEn}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                                    -{pm.riskReductionPct}%
                                  </span>
                                </div>
                                <div className="text-[11px] text-rose-700 dark:text-rose-400 font-medium">
                                  {isAr ? pm.targetPestsAr : pm.targetPestsEn}
                                </div>
                                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                                  {isAr ? pm.mitigationMechanismAr : pm.mitigationMechanismEn}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUB-TAB 3: 4-WEEK NPK CALCULATOR & GDD HEAT TREND CHART               */}
      {/* ===================================================================== */}
      {activeSubTab === 'npk_gdd' && (
        <div className="space-y-5" data-testid="subtab-panel-npk-gdd">
          {/* 4-WEEK NPK NUTRIENT REQUIREMENT CALCULATOR */}
          <div
            data-testid="npk-calculator-module"
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-5"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  <Beaker className="w-4 h-4" />
                  <span>
                    {isAr
                      ? 'حاسبة المقننات السمادية لـ 4 أسابيع (N - P₂O₅ - K₂O)'
                      : '4-Week NPK Nutrient Calculator & Fertigation Schedule'}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  {isAr
                    ? `برنامج التسميد لمحصول ${npkSchedule.cropNameAr}`
                    : `4-Week NPK Schedule for ${npkSchedule.cropNameEn}`}
                </h3>
              </div>

              <div className="text-xs font-mono bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-xl text-emerald-800 dark:text-emerald-300 self-start tabular-nums">
                {isAr
                  ? `المرحلة: ${npkSchedule.stageNameAr} (${npkSchedule.accumulatedGDD} GDD)`
                  : `Stage: ${npkSchedule.stageNameEn} (${npkSchedule.accumulatedGDD} GDD)`}
              </div>
            </div>

            {/* 3 Interactive Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <div className="space-y-1.5">
                <label
                  htmlFor="npk-crop-select"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  {isAr ? '1. المحصول المستهدف:' : '1. Selected Crop:'}
                </label>
                <select
                  id="npk-crop-select"
                  data-testid="npk-crop-select"
                  value={npkCropId}
                  onChange={(e) => {
                    const newId = e.target.value;
                    setNpkCropId(newId);
                    const newCrop = CROP_DATABASE.find((c) => c.id === newId);
                    if (newCrop && npkGdd > newCrop.totalGDDRequired) {
                      setNpkGdd(Math.round(newCrop.totalGDDRequired * 0.35));
                    }
                  }}
                  className="w-full min-h-[40px] px-3 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  {CROP_DATABASE.map((c) => (
                    <option key={c.id} value={c.id}>
                      {isAr ? c.nameAr : c.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="npk-soil-select"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  {isAr ? '2. قوام التربة:' : '2. Soil Texture:'}
                </label>
                <select
                  id="npk-soil-select"
                  data-testid="npk-soil-select"
                  value={npkSoilTexture}
                  onChange={(e) => setNpkSoilTexture(e.target.value as SoilTexture)}
                  className="w-full min-h-[40px] px-3 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="clay">
                    {isAr ? 'طينية رسوبية (Clay)' : 'Alluvial Clay'}
                  </option>
                  <option value="loamy">
                    {isAr ? 'صفراء طميية (Loamy)' : 'Loamy (Balanced)'}
                  </option>
                  <option value="sandy">
                    {isAr ? 'رملية خفيفة (Sandy +20% N)' : 'Sandy (+20% N)'}
                  </option>
                  <option value="calcareous">
                    {isAr ? 'جيرية (Calcareous +22% P)' : 'Calcareous (+22% P)'}
                  </option>
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label
                    htmlFor="npk-gdd-slider"
                    className="font-bold text-slate-700 dark:text-slate-300"
                  >
                    {isAr ? '3. التراكم الحراري GDD:' : '3. Growth Stage GDD:'}
                  </label>
                  <span
                    data-testid="npk-current-gdd-display"
                    className="font-mono font-bold text-emerald-700 dark:text-emerald-400 tabular-nums"
                  >
                    {npkSchedule.accumulatedGDD} / {npkSchedule.targetTotalGDD}
                  </span>
                </div>

                <input
                  id="npk-gdd-slider"
                  data-testid="npk-gdd-slider"
                  type="range"
                  min={50}
                  max={npkSchedule.targetTotalGDD}
                  step={25}
                  value={npkSchedule.accumulatedGDD}
                  onChange={(e) => setNpkGdd(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />

                <div className="flex items-center justify-between gap-1">
                  {getCropPhenologyStageDefs(npkCropId).map((st, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() =>
                        setNpkGdd(
                          Math.round(npkSchedule.targetTotalGDD * (st.defaultStartPct / 100))
                        )
                      }
                      className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-semibold text-slate-700 dark:text-slate-300 hover:border-emerald-600 cursor-pointer"
                    >
                      {isAr ? st.shortAr : st.shortEn}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3 Pure NPK Summary KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-emerald-900 dark:text-emerald-300">
                    {isAr ? 'النيتروجين الصافي (N)' : 'Pure Nitrogen (N)'}
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 mt-0.5 tabular-nums">
                    {npkSchedule.totalFarmPureNKg >= 1000
                      ? isAr
                        ? `للمزرعة: ${(npkSchedule.totalFarmPureNKg / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })} طن (${npkSchedule.totalFarmPureNKg} كجم)`
                        : `Farm: ${(npkSchedule.totalFarmPureNKg / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })} t (${npkSchedule.totalFarmPureNKg} kg)`
                      : isAr
                      ? `للمزرعة: ${npkSchedule.totalFarmPureNKg} كجم`
                      : `Farm: ${npkSchedule.totalFarmPureNKg} kg`}
                  </div>
                </div>
                <div
                  data-testid="npk-total-n-per-feddan"
                  className="text-2xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400"
                >
                  {npkSchedule.total4WeekPureNPerFeddan}{' '}
                  <span className="text-xs font-normal">kg/{isAr ? 'ف' : 'fed'}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-amber-900 dark:text-amber-300">
                    {isAr ? 'الفوسفور الصافي (P₂O₅)' : 'Pure Phosphorus (P₂O₅)'}
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 mt-0.5 tabular-nums">
                    {npkSchedule.totalFarmPureP2O5Kg >= 1000
                      ? isAr
                        ? `للمزرعة: ${(npkSchedule.totalFarmPureP2O5Kg / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })} طن (${npkSchedule.totalFarmPureP2O5Kg} كجم)`
                        : `Farm: ${(npkSchedule.totalFarmPureP2O5Kg / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })} t (${npkSchedule.totalFarmPureP2O5Kg} kg)`
                      : isAr
                      ? `للمزرعة: ${npkSchedule.totalFarmPureP2O5Kg} كجم`
                      : `Farm: ${npkSchedule.totalFarmPureP2O5Kg} kg`}
                  </div>
                </div>
                <div
                  data-testid="npk-total-p-per-feddan"
                  className="text-2xl font-bold font-mono tabular-nums text-amber-700 dark:text-amber-400"
                >
                  {npkSchedule.total4WeekPureP2O5PerFeddan}{' '}
                  <span className="text-xs font-normal">kg/{isAr ? 'ف' : 'fed'}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/80 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-sky-900 dark:text-sky-300">
                    {isAr ? 'البوتاسيوم الصافي (K₂O)' : 'Pure Potassium (K₂O)'}
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 mt-0.5 tabular-nums">
                    {npkSchedule.totalFarmPureK2OKg >= 1000
                      ? isAr
                        ? `للمزرعة: ${(npkSchedule.totalFarmPureK2OKg / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })} طن (${npkSchedule.totalFarmPureK2OKg} كجم)`
                        : `Farm: ${(npkSchedule.totalFarmPureK2OKg / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })} t (${npkSchedule.totalFarmPureK2OKg} kg)`
                      : isAr
                      ? `للمزرعة: ${npkSchedule.totalFarmPureK2OKg} كجم`
                      : `Farm: ${npkSchedule.totalFarmPureK2OKg} kg`}
                  </div>
                </div>
                <div
                  data-testid="npk-total-k-per-feddan"
                  className="text-2xl font-bold font-mono tabular-nums text-sky-700 dark:text-sky-400"
                >
                  {npkSchedule.total4WeekPureK2OPerFeddan}{' '}
                  <span className="text-xs font-normal">kg/{isAr ? 'ف' : 'fed'}</span>
                </div>
              </div>
            </div>

            {/* 4-Week Concise NPK Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {npkSchedule.weeks.map((wk) => {
                const maxBar = Math.max(
                  15,
                  wk.pureNKgPerFeddan + wk.pureP2O5KgPerFeddan + wk.pureK2OKgPerFeddan
                );
                const nPct = Math.round((wk.pureNKgPerFeddan / maxBar) * 100);
                const pPct = Math.round((wk.pureP2O5KgPerFeddan / maxBar) * 100);
                const kPct = Math.round((wk.pureK2OKgPerFeddan / maxBar) * 100);

                return (
                  <div
                    key={wk.weekNumber}
                    data-testid={`npk-week-card-${wk.weekNumber}`}
                    className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {isAr ? wk.weekLabelAr : wk.weekLabelEn}
                        </span>
                        <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400">
                          {wk.gddWindowLabel}
                        </span>
                      </div>

                      <div className="space-y-1.5 font-mono text-xs tabular-nums">
                        <div>
                          <div className="flex justify-between text-[11px]">
                            <span className="text-emerald-700 dark:text-emerald-400 font-bold">N</span>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {wk.pureNKgPerFeddan} kg/{isAr ? 'ف' : 'fed'}
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-0.5">
                            <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${nPct}%` }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px]">
                            <span className="text-amber-700 dark:text-amber-400 font-bold">P₂O₅</span>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {wk.pureP2O5KgPerFeddan} kg/{isAr ? 'ف' : 'fed'}
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-0.5">
                            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${pPct}%` }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px]">
                            <span className="text-sky-700 dark:text-sky-400 font-bold">K₂O</span>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {wk.pureK2OKgPerFeddan} kg/{isAr ? 'ف' : 'fed'}
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-0.5">
                            <div className="h-full bg-sky-500 rounded-full" style={{ width: `${kPct}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/80 text-[11px] text-slate-600 dark:text-slate-300">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {isAr ? wk.commercialSourceAr : wk.commercialSourceEn}
                      </div>
                      <div className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                        {isAr ? wk.applicationMethodAr : wk.applicationMethodEn}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Progressive Disclosure Toggle for Visual Chart & Commercial Table */}
            <div>
              <button
                type="button"
                data-testid="toggle-npk-details-btn"
                onClick={() => setShowNpkDetailedTable((p) => !p)}
                className="min-h-[38px] px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
              >
                <span>
                  {showNpkDetailedTable
                    ? isAr
                      ? 'إخفاء الرسم البياني وجدول الأسمدة التجارية'
                      : 'Hide NPK Chart & Commercial Schedule Table'
                    : isAr
                    ? 'عرض الرسم البياني والجدول التجاري الكامل للمزرعة'
                    : 'Show NPK Visual Dashboard & Full Commercial Table'}
                </span>
                {showNpkDetailedTable ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {showNpkDetailedTable && (
                <div className="mt-4 space-y-4">
                  <div className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                    <strong>{isAr ? 'المعايرة العلمية:' : 'Agronomic Calibration:'}</strong>{' '}
                    {isAr ? npkSchedule.agronomicNoteAr : npkSchedule.agronomicNoteEn}
                  </div>

                  {/* SVG Grouped Bar Chart */}
                  {(() => {
                    const maxSingleNutrientVal = Math.max(
                      12,
                      ...npkSchedule.weeks.flatMap((w) => [
                        w.pureNKgPerFeddan,
                        w.pureP2O5KgPerFeddan,
                        w.pureK2OKgPerFeddan,
                      ])
                    );

                    return (
                      <div
                        data-testid="npk-visual-dashboard"
                        className="p-4 rounded-xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 overflow-x-auto"
                      >
                        <svg
                          viewBox="0 0 680 175"
                          className="w-full h-40 overflow-visible"
                          role="img"
                          aria-label="4-Week NPK Nutrient Bar Chart"
                        >
                          {[0, 0.5, 1].map((t, i) => {
                            const y = 135 - t * 105;
                            const val = Math.round(t * maxSingleNutrientVal);
                            return (
                              <g key={i}>
                                <line
                                  x1={45}
                                  x2={650}
                                  y1={y}
                                  y2={y}
                                  stroke="currentColor"
                                  className="text-slate-200 dark:text-slate-700"
                                  strokeDasharray="3 3"
                                  strokeWidth={1}
                                />
                                <text
                                  x={38}
                                  y={y + 4}
                                  textAnchor="end"
                                  className="fill-slate-400 text-[10px] font-mono"
                                >
                                  {val}kg
                                </text>
                              </g>
                            );
                          })}

                          {npkSchedule.weeks.map((wk, idx) => {
                            const groupX = 85 + idx * 145;
                            const nH = Math.max(4, (wk.pureNKgPerFeddan / maxSingleNutrientVal) * 105);
                            const pH = Math.max(4, (wk.pureP2O5KgPerFeddan / maxSingleNutrientVal) * 105);
                            const kH = Math.max(4, (wk.pureK2OKgPerFeddan / maxSingleNutrientVal) * 105);

                            return (
                              <g key={wk.weekNumber}>
                                <rect x={groupX} y={135 - nH} width={24} height={nH} rx={4} className="fill-emerald-600" />
                                <text x={groupX + 12} y={130 - nH} textAnchor="middle" className="fill-emerald-700 dark:fill-emerald-400 text-[10px] font-mono font-bold">
                                  {wk.pureNKgPerFeddan}
                                </text>
                                <rect x={groupX + 28} y={135 - pH} width={24} height={pH} rx={4} className="fill-amber-500" />
                                <text x={groupX + 40} y={130 - pH} textAnchor="middle" className="fill-amber-700 dark:fill-amber-400 text-[10px] font-mono font-bold">
                                  {wk.pureP2O5KgPerFeddan}
                                </text>
                                <rect x={groupX + 56} y={135 - kH} width={24} height={kH} rx={4} className="fill-sky-500" />
                                <text x={groupX + 68} y={130 - kH} textAnchor="middle" className="fill-sky-700 dark:fill-sky-400 text-[10px] font-mono font-bold">
                                  {wk.pureK2OKgPerFeddan}
                                </text>
                                <text x={groupX + 40} y={153} textAnchor="middle" className="fill-slate-800 dark:fill-slate-200 text-[11px] font-bold">
                                  {isAr ? wk.weekLabelAr : wk.weekLabelEn}
                                </text>
                              </g>
                            );
                          })}
                        </svg>
                      </div>
                    );
                  })()}

                  {/* Full 4-Week Table */}
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table
                      data-testid="npk-schedule-table"
                      className="w-full text-xs text-start border-collapse"
                    >
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700">
                          <th className="py-3 px-3.5 font-bold text-start whitespace-nowrap">
                            {isAr ? 'الأسبوع / النافذة' : 'Week / GDD'}
                          </th>
                          <th className="py-3 px-3.5 font-bold text-start">
                            {isAr ? 'المرحلة الفسيولوجية' : 'Stage Target'}
                          </th>
                          <th className="py-3 px-3.5 font-bold text-start whitespace-nowrap text-emerald-800 dark:text-emerald-400">
                            N
                          </th>
                          <th className="py-3 px-3.5 font-bold text-start whitespace-nowrap text-amber-800 dark:text-amber-400">
                            P₂O₅
                          </th>
                          <th className="py-3 px-3.5 font-bold text-start whitespace-nowrap text-sky-800 dark:text-sky-400">
                            K₂O
                          </th>
                          <th className="py-3 px-3.5 font-bold text-start">
                            {isAr ? 'المكافئ التجاري / فدان' : 'Commercial Equivalent'}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                        {npkSchedule.weeks.map((wk) => (
                          <tr key={wk.weekNumber} data-testid={`npk-table-row-${wk.weekNumber}`}>
                            <td className="py-3 px-3.5 whitespace-nowrap">
                              <div className="font-bold text-slate-900 dark:text-white">
                                {isAr ? wk.weekLabelAr : wk.weekLabelEn}
                              </div>
                              <div className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400">
                                {wk.gddWindowLabel}
                              </div>
                            </td>
                            <td className="py-3 px-3.5 text-slate-700 dark:text-slate-300">
                              {isAr ? wk.stageContextAr : wk.stageContextEn}
                            </td>
                            <td className="py-3 px-3.5 font-mono font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap tabular-nums">
                              {wk.pureNKgPerFeddan} kg ({wk.totalFarmNKg} kg)
                            </td>
                            <td className="py-3 px-3.5 font-mono font-bold text-amber-700 dark:text-amber-400 whitespace-nowrap tabular-nums">
                              {wk.pureP2O5KgPerFeddan} kg ({wk.totalFarmP2O5Kg} kg)
                            </td>
                            <td className="py-3 px-3.5 font-mono font-bold text-sky-700 dark:text-sky-400 whitespace-nowrap tabular-nums">
                              {wk.pureK2OKgPerFeddan} kg ({wk.totalFarmK2OKg} kg)
                            </td>
                            <td className="py-3 px-3.5 text-slate-700 dark:text-slate-300">
                              {isAr ? wk.commercialSourceAr : wk.commercialSourceEn}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* GROWING DEGREE DAY (GDD) HEAT ACCUMULATION TREND CHART */}
          <div
            data-testid="crop-gdd-trend-chart-card"
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-400">
                  <Flame className="w-4 h-4" />
                  <span>
                    {isAr
                      ? 'منحنى الوحدات الحرارية الفعالة GDD ونوافذ النمو'
                      : 'Crop Lifecycle GDD Heat Accumulation Chart'}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  {isAr
                    ? `${gddSeries.cropNameAr} (${gddSeries.currentAccumulatedGDD} / ${gddSeries.targetTotalGDD} °C·d)`
                    : `${gddSeries.cropNameEn} (${gddSeries.currentAccumulatedGDD} / ${gddSeries.targetTotalGDD} °C·d)`}
                </h3>
              </div>

              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl self-start">
                <button
                  type="button"
                  data-testid="gdd-mode-lifecycle"
                  onClick={() => setGddChartMode('lifecycle')}
                  className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    gddChartMode === 'lifecycle'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {isAr ? 'دورة الحياة الكاملة' : 'Full Lifecycle'}
                </button>
                <button
                  type="button"
                  data-testid="gdd-mode-30day"
                  onClick={() => setGddChartMode('30day')}
                  className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    gddChartMode === '30day'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {isAr ? 'توقع 30 يوماً' : '30-Day Weather GDD'}
                </button>
              </div>
            </div>

            {/* 4 GDD KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/70">
                <div className="text-[11px] font-medium text-amber-900 dark:text-amber-300">
                  {isAr ? 'التراكم الحراري الحالي' : 'Accumulated GDD'}
                </div>
                <div className="mt-1 flex items-baseline gap-1.5 tabular-nums">
                  <span
                    data-testid="gdd-chart-current-value"
                    className="text-xl font-bold font-mono text-amber-700 dark:text-amber-400"
                  >
                    {gddSeries.currentAccumulatedGDD}
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    / {gddSeries.targetTotalGDD} ({gddSeries.currentCompletionPct}%)
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/70">
                <div className="text-[11px] font-medium text-emerald-900 dark:text-emerald-300">
                  {isAr ? 'المرحلة النشطة' : 'Active Stage'}
                </div>
                <div className="mt-1 text-sm font-bold text-emerald-800 dark:text-emerald-300 truncate">
                  {isAr ? gddSeries.currentStageNameAr : gddSeries.currentStageNameEn}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                  {isAr ? 'الكسب الحراري اليومي' : 'Avg Daily Gain'}
                </div>
                <div className="mt-1 text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {gddSeries.thirtyDaySummary.avgDailyGddRate}{' '}
                  <span className="text-xs font-normal text-slate-500">GDD/d</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/70">
                <div className="text-[11px] font-medium text-sky-900 dark:text-sky-300">
                  {isAr ? 'المرحلة القادمة' : 'Next Stage'}
                </div>
                <div className="mt-1 text-xs font-bold text-sky-800 dark:text-sky-300 truncate">
                  {gddSeries.thirtyDaySummary.daysToNextStage !== null
                    ? isAr
                      ? `خلال ${gddSeries.thirtyDaySummary.daysToNextStage} يوم (${gddSeries.thirtyDaySummary.nextStageNameAr})`
                      : `In ${gddSeries.thirtyDaySummary.daysToNextStage}d (${gddSeries.thirtyDaySummary.nextStageNameEn})`
                    : isAr
                    ? 'مرحلة النضج والحصاد'
                    : 'Harvest Ready'}
                </div>
              </div>
            </div>

            {/* Lifecycle Phase Range Slider */}
            <div
              data-testid="gdd-lifecycle-range-filter-panel"
              className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-3"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>
                      {isAr
                        ? 'فلتر مراحل النمو ونوافذ الحرارة (Lifecycle Phase Slider):'
                        : 'Filter GDD by Lifecycle Phase & Heat Window:'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                    {gddFilteredWindow.minPct}% – {gddFilteredWindow.maxPct}% (
                    {gddFilteredWindow.minGddBound} – {gddFilteredWindow.maxGddBound} °C·d · ~
                    {gddFilteredWindow.windowDaysSpan} {isAr ? 'يوم' : 'days'})
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {(
                    ['all', 'establishment', 'vegetative', 'reproductive', 'ripening'] as const
                  ).map((phaseKey) => {
                    const preset = GDD_LIFECYCLE_PHASE_PRESETS[phaseKey];
                    const isSelected =
                      gddPhasePreset === phaseKey &&
                      gddRangeMinPct === preset.minPct &&
                      gddRangeMaxPct === preset.maxPct;
                    return (
                      <button
                        key={phaseKey}
                        type="button"
                        data-testid={`gdd-phase-preset-${phaseKey}`}
                        onClick={() => handleSelectGddPhasePreset(phaseKey)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                          isSelected
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-amber-500'
                        }`}
                      >
                        {isAr ? preset.labelAr : preset.labelEn}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <label
                      htmlFor="gdd-range-min-slider"
                      className="font-semibold text-slate-700 dark:text-slate-300"
                    >
                      {isAr ? 'بداية النافذة (Min %):' : 'Window Start (Min %):'}
                    </label>
                    <span
                      data-testid="gdd-range-min-value"
                      className="font-mono font-bold text-amber-700 dark:text-amber-400 tabular-nums"
                    >
                      {gddFilteredWindow.minPct}% ({gddFilteredWindow.minGddBound} GDD)
                    </span>
                  </div>
                  <input
                    id="gdd-range-min-slider"
                    data-testid="gdd-range-min-slider"
                    type="range"
                    min={0}
                    max={90}
                    step={5}
                    value={gddRangeMinPct}
                    onChange={(e) => {
                      const nextMin = Number(e.target.value);
                      setGddPhasePreset('custom');
                      setGddRangeMinPct(nextMin);
                      if (nextMin >= gddRangeMaxPct - 5) {
                        setGddRangeMaxPct(Math.min(100, nextMin + 10));
                      }
                    }}
                    className="w-full accent-amber-600 cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <label
                      htmlFor="gdd-range-max-slider"
                      className="font-semibold text-slate-700 dark:text-slate-300"
                    >
                      {isAr ? 'نهاية النافذة (Max %):' : 'Window End (Max %):'}
                    </label>
                    <span
                      data-testid="gdd-range-max-value"
                      className="font-mono font-bold text-emerald-700 dark:text-emerald-400 tabular-nums"
                    >
                      {gddFilteredWindow.maxPct}% ({gddFilteredWindow.maxGddBound} GDD)
                    </span>
                  </div>
                  <input
                    id="gdd-range-max-slider"
                    data-testid="gdd-range-max-slider"
                    type="range"
                    min={10}
                    max={100}
                    step={5}
                    value={gddRangeMaxPct}
                    onChange={(e) => {
                      const nextMax = Number(e.target.value);
                      setGddPhasePreset('custom');
                      setGddRangeMaxPct(nextMax);
                      if (nextMax <= gddRangeMinPct + 5) {
                        setGddRangeMinPct(Math.max(0, nextMax - 10));
                      }
                    }}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                </div>
              </div>

              <div
                data-testid="gdd-heat-window-banner"
                className="px-3 py-2 rounded-lg bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/70 text-[11px] text-amber-950 dark:text-amber-200 flex items-center justify-between gap-2"
              >
                <span>
                  {isAr
                    ? gddFilteredWindow.heatSensitiveWindowWarningAr
                    : gddFilteredWindow.heatSensitiveWindowWarningEn}
                </span>
                <span className="font-mono font-bold whitespace-nowrap shrink-0 text-amber-800 dark:text-amber-300 tabular-nums">
                  {gddChartData.length} {isAr ? 'نقطة' : 'pts'}
                </span>
              </div>
            </div>

            {/* Recharts ComposedChart */}
            <div
              data-testid="gdd-recharts-container"
              className="w-full h-[320px] min-w-0 bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl p-2 sm:p-3"
              dir="ltr"
            >
              <ResponsiveContainer width="100%" height={294}>
                <ComposedChart
                  data={gddChartData}
                  margin={{ top: 24, right: 20, left: 8, bottom: 8 }}
                >
                  <defs>
                    <linearGradient id="gddCumulativeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.25} />
                  <XAxis
                    dataKey="xLabel"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    interval="preserveStartEnd"
                    minTickGap={22}
                  />
                  <YAxis
                    yAxisId="gdd"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    domain={[
                      Math.max(0, Math.floor(gddFilteredWindow.minGddBound * 0.9)),
                      Math.max(
                        100,
                        Math.round(
                          Math.max(gddFilteredWindow.maxGddBound, gddSeries.currentAccumulatedGDD) *
                            1.12
                        )
                      ),
                    ]}
                  />
                  <YAxis
                    yAxisId="daily"
                    orientation="right"
                    tick={{ fontSize: 11, fill: '#d97706' }}
                    domain={[0, 35]}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload || payload.length === 0) return null;
                      const point = payload[0]?.payload as {
                        cumulativeGdd: number;
                        dailyGdd: number;
                        tempMeanC: number;
                        completionPct: number;
                        stageName: string;
                        kc: number;
                      };
                      return (
                        <div
                          dir={isAr ? 'rtl' : 'ltr'}
                          className="rounded-xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700 shadow-lg p-3 text-xs space-y-1 min-w-[200px]"
                        >
                          <div className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1">
                            {label} · {point.stageName}
                          </div>
                          <div className="flex justify-between gap-4 font-mono tabular-nums">
                            <span className="text-emerald-700 dark:text-emerald-400">
                              {isAr ? 'التراكمي GDD:' : 'Cumulative:'}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {point.cumulativeGdd} ({point.completionPct}%)
                            </span>
                          </div>
                          <div className="flex justify-between gap-4 font-mono tabular-nums">
                            <span className="text-amber-600 dark:text-amber-400">
                              {isAr ? 'اليومي:' : 'Daily:'}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white">
                              +{point.dailyGdd} °C·d
                            </span>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />

                  {gddSeries.stageThresholds
                    .filter((st) => st.key === 'vegetative' || st.key === 'flowering' || st.key === 'harvest')
                    .map((st) => (
                      <ReferenceLine
                        key={st.key}
                        yAxisId="gdd"
                        y={st.gddThreshold}
                        stroke={st.color}
                        strokeDasharray="4 4"
                        strokeOpacity={0.75}
                      />
                    ))}

                  {gddChartMode === 'lifecycle' && currentLifecycleMarkerLabel && (
                    <ReferenceLine
                      yAxisId="gdd"
                      x={currentLifecycleMarkerLabel}
                      stroke="#0284c7"
                      strokeWidth={2}
                      strokeDasharray="3 3"
                    />
                  )}

                  <Bar
                    yAxisId="daily"
                    dataKey="dailyGdd"
                    name={isAr ? 'الكسب الحراري اليومي' : 'Daily GDD Gain'}
                    fill="#f59e0b"
                    fillOpacity={0.55}
                    radius={[3, 3, 0, 0]}
                    barSize={10}
                  />
                  <Area
                    yAxisId="gdd"
                    type="monotone"
                    dataKey="cumulativeGdd"
                    name={isAr ? 'التراكم الحراري الكلي' : 'Cumulative GDD'}
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fill="url(#gddCumulativeGrad)"
                  />
                  {gddChartMode === 'lifecycle' && (
                    <Line
                      yAxisId="gdd"
                      type="monotone"
                      dataKey="activeFieldGdd"
                      name={isAr ? 'التقدم الفعلي بالحقل' : 'Field GDD Progress'}
                      stroke="#0284c7"
                      strokeWidth={3}
                      dot={{ r: 3, fill: '#0284c7' }}
                      connectNulls={false}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUB-TAB 4: RISK, DISASTER EARLY WARNING & PEST RADAR                  */}
      {/* ===================================================================== */}
      {activeSubTab === 'risks' && (
        <div className="space-y-5" data-testid="subtab-panel-risks">
          {/* Segmented Risk Mode Switcher */}
          <div
            data-testid="risks-mode-switcher"
            className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>
                {isAr ? 'اختر نطاق الرصد الوقائي:' : 'Select Risk & Pest Intelligence Module:'}
              </span>
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto">
              {(
                [
                  {
                    id: 'disasters',
                    ar: `1. الكوارث المناخية (${environmentalDisasterWarnings.length})`,
                    en: `1. 14-Day Hazards (${environmentalDisasterWarnings.length})`,
                  },
                  {
                    id: 'pests',
                    ar: `2. رادار الآفات الاستباقي (${proactivePestAlerts.length})`,
                    en: `2. Pest Outbreak Radar (${proactivePestAlerts.length})`,
                  },
                  {
                    id: 'strategic_guide',
                    ar: '3. دليل آفات القمح والذرة والقطن',
                    en: '3. Egyptian Strategic Crops Guide',
                  },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  data-testid={`risk-mode-${m.id}`}
                  onClick={() => setRiskSubMode(m.id)}
                  className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    riskSubMode === m.id
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {isAr ? m.ar : m.en}
                </button>
              ))}
            </div>
          </div>

          {/* VIEW 4A: 14-DAY ENVIRONMENTAL DISASTER EARLY WARNING */}
          {riskSubMode === 'disasters' && (
            <div
              data-testid="environmental-disaster-early-warning-panel"
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>
                      {isAr
                        ? 'الإنذار المبكر للكوارث المناخية (14 يوماً)'
                        : '14-Day Climatic Disaster Early Warning'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {isAr
                      ? 'اضغط "بروتوكول الطوارئ والأصناف المقاومة" داخل أي إنذار لعرض الخطوات الثلاثية.'
                      : 'Expand any hazard alert for its 3-phase emergency protocol & resilient crop picks.'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 self-start">
                  {(
                    [
                      { id: 'all', ar: 'الكل (5)', en: 'All (5)' },
                      { id: 'sandstorm_wind', ar: 'الرياح والعواصف', en: 'Wind & Dust' },
                      { id: 'severe_drought', ar: 'الجفاف', en: 'Drought' },
                      { id: 'heatwave', ar: 'الحر', en: 'Heatwave' },
                      { id: 'flash_flood', ar: 'السيول', en: 'Floods' },
                      { id: 'frost', ar: 'الصقيع', en: 'Frost' },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      data-testid={`disaster-filter-${tab.id}`}
                      onClick={() => setSelectedDisasterType(tab.id)}
                      className={`min-h-[34px] px-2.5 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                        selectedDisasterType === tab.id
                          ? 'bg-amber-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {isAr ? tab.ar : tab.en}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3.5">
                {filteredDisasterWarnings.map((warn) => {
                  const isCrit = warn.severity === 'critical';
                  const isHigh = warn.severity === 'high';
                  const isExpanded = !!expandedDisasterIds[warn.id];
                  return (
                    <div
                      key={warn.id}
                      data-testid={`disaster-warning-card-${warn.disasterType}`}
                      className={`p-4 rounded-xl border space-y-3 ${
                        isCrit
                          ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800/80'
                          : isHigh
                          ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/80'
                          : 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {/* Concise Summary Header */}
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold text-white tabular-nums ${
                                isCrit ? 'bg-rose-600' : isHigh ? 'bg-amber-600' : 'bg-slate-700'
                              }`}
                            >
                              {warn.probabilityPct}%
                            </span>
                            <span className="px-2 py-0.5 rounded bg-slate-900 dark:bg-slate-800 text-amber-300 font-mono text-[11px] font-bold tabular-nums">
                              {isAr ? `خلال ${warn.countdownHours} ساعة` : `In ${warn.countdownHours}h`}
                            </span>
                            <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                              {isAr ? warn.titleAr : warn.titleEn}
                            </h4>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300">
                            {isAr ? warn.triggerMetricsAr : warn.triggerMetricsEn}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 tabular-nums font-mono text-xs">
                          <div
                            title={
                              isAr
                                ? 'نسبة الخسارة المتوقعة من إجمالي المحصول إذا لم يُتخذ أي إجراء وقائي'
                                : 'Expected total yield loss if no preventive action is taken'
                            }
                            className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800/60"
                          >
                            <span className="text-[10px] font-sans text-slate-500 dark:text-slate-400 block whitespace-nowrap">
                              {isAr ? 'خسارة بدون تدخل' : 'Unmitigated Loss'}
                            </span>
                            <strong dir="ltr" className="inline-block text-rose-600 dark:text-rose-400">
                              -{warn.estimatedYieldLossWithoutActionPct}%
                            </strong>
                          </div>
                          <div
                            title={
                              isAr
                                ? 'كفاءة بروتوكول الطوارئ في إنقاذ هذه النسبة من الفاقد المتوقع'
                                : 'Percentage of that expected loss prevented by following the protocol'
                            }
                            className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/60"
                          >
                            <span className="text-[10px] font-sans text-slate-500 dark:text-slate-400 block whitespace-nowrap">
                              {isAr ? 'إنقاذ من الفاقد' : 'Loss Mitigated'}
                            </span>
                            <strong dir="ltr" className="inline-block text-emerald-600 dark:text-emerald-400">
                              +{warn.mitigatedYieldSavedPct}%
                            </strong>
                          </div>
                          <button
                            type="button"
                            data-testid={`disaster-explain-${warn.disasterType}`}
                            onClick={() =>
                              setExplainerModalState({
                                isOpen: true,
                                riskTitle: isAr ? warn.titleAr : warn.titleEn,
                                yieldLossWithoutActionPct: warn.estimatedYieldLossWithoutActionPct,
                                mitigatedRecoveryPct: warn.mitigatedYieldSavedPct,
                              })
                            }
                            aria-label={
                              isAr
                                ? 'تفسير نسبتي الخسارة والإنقاذ'
                                : 'Explain Yield Loss and Potential Recovery'
                            }
                            title={
                              isAr
                                ? 'لماذا لا يساوي مجموع النسبتين 100%؟'
                                : 'Why don’t these two metrics sum to 100%?'
                            }
                            className="min-h-[38px] min-w-[38px] p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-center"
                          >
                            <HelpCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Expandable Actions Row */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/70 dark:border-slate-700/70">
                        <button
                          type="button"
                          onClick={() => toggleDisasterExpanded(warn.id)}
                          className="min-h-[36px] px-3 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-3.5 h-3.5" />
                              <span>{isAr ? 'إخفاء البروتوكول' : 'Hide Protocol'}</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3.5 h-3.5" />
                              <span>
                                {isAr
                                  ? 'بروتوكول الطوارئ والأصناف المقاومة'
                                  : 'Emergency Protocol & Resilient Crops'}
                              </span>
                            </>
                          )}
                        </button>

                        {onConsultAgronomistWithPrompt && (
                          <button
                            type="button"
                            data-testid={`disaster-consult-ai-${warn.disasterType}`}
                            onClick={() =>
                              onConsultAgronomistWithPrompt(
                                isAr ? warn.advisorPromptAr : warn.advisorPromptEn
                              )
                            }
                            className="min-h-[36px] px-3 py-1 rounded-xl bg-slate-900 dark:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:opacity-95"
                          >
                            <Bot className="w-3.5 h-3.5" />
                            <span>{isAr ? 'استشارة GeoAgri ai' : 'Ask GeoAgri ai'}</span>
                          </button>
                        )}
                      </div>

                      {/* Progressive Disclosure Details */}
                      {isExpanded && (
                        <div className="space-y-3 pt-2">
                          <div className="p-3 rounded-lg bg-white/90 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                            <strong className="text-rose-700 dark:text-rose-400">
                              {isAr ? 'التأثير المتوقع:' : 'Expected Impact:'}
                            </strong>{' '}
                            {isAr ? warn.expectedImpactAr : warn.expectedImpactEn}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/60 space-y-1.5">
                              <div className="text-xs font-bold text-amber-800 dark:text-amber-300">
                                {isAr ? '1. قبل الحدث (72–24 ساعة)' : '1. Pre-Event (72–24h)'}
                              </div>
                              <ul className="space-y-1 text-[11px] text-slate-700 dark:text-slate-300 list-disc list-inside">
                                {(isAr
                                  ? warn.emergencyProtocol.preEvent72to24hAr
                                  : warn.emergencyProtocol.preEvent72to24hEn
                                ).map((step, idx) => (
                                  <li key={idx}>{step}</li>
                                ))}
                              </ul>
                            </div>

                            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800/60 space-y-1.5">
                              <div className="text-xs font-bold text-rose-800 dark:text-rose-300">
                                {isAr ? '2. أثناء الذروة (طوارئ)' : '2. During Peak'}
                              </div>
                              <ul className="space-y-1 text-[11px] text-slate-700 dark:text-slate-300 list-disc list-inside">
                                {(isAr
                                  ? warn.emergencyProtocol.duringEventAr
                                  : warn.emergencyProtocol.duringEventEn
                                ).map((step, idx) => (
                                  <li key={idx}>{step}</li>
                                ))}
                              </ul>
                            </div>

                            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/60 space-y-1.5">
                              <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                                {isAr ? '3. التعافي بعد الموجة' : '3. Post-Event Recovery'}
                              </div>
                              <ul className="space-y-1 text-[11px] text-slate-700 dark:text-slate-300 list-disc list-inside">
                                {(isAr
                                  ? warn.emergencyProtocol.postEventRecoveryAr
                                  : warn.emergencyProtocol.postEventRecoveryEn
                                ).map((step, idx) => (
                                  <li key={idx}>{step}</li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                            {warn.resilientCrops.map((rc) => {
                              const isAdopted = selectedCropId === rc.cropId;
                              return (
                                <div
                                  key={`${warn.id}-${rc.cropId}`}
                                  className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-2"
                                >
                                  <div>
                                    <div className="flex items-center justify-between gap-1 text-xs font-bold text-slate-900 dark:text-white">
                                      <span>{isAr ? rc.cropNameAr : rc.cropNameEn}</span>
                                      <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400">
                                        {rc.resilienceScorePct}%
                                      </span>
                                    </div>
                                    <div className="text-[11px] text-emerald-700 dark:text-emerald-400">
                                      {isAr ? rc.cultivarAr : rc.cultivarEn}
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => onAdoptCrop(rc.cropId)}
                                    className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer self-end ${
                                      isAdopted
                                        ? 'bg-emerald-700 text-white'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-emerald-600 hover:text-white'
                                    }`}
                                  >
                                    {isAdopted
                                      ? isAr
                                        ? '✓ معتمد'
                                        : '✓ Adopted'
                                      : isAr
                                      ? 'اعتماد الصنف'
                                      : 'Adopt'}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW 4B: PROACTIVE PEST & DISEASE OUTBREAK ALERT SYSTEM */}
          {riskSubMode === 'pests' && (
            <div
              data-testid="pest-outbreak-alert-system"
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span>
                      {isAr
                        ? 'رادار الإنذار الاستباقي للآفات والأمراض'
                        : 'Proactive Pest & Disease Outbreak Radar'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {isAr
                      ? `مربوط بإحداثيات مزرعتك (${effectiveCentroid.lat.toFixed(3)}°N, ${effectiveCentroid.lng.toFixed(3)}°E) والطقس الحالي.`
                      : `Calibrated to live weather telemetry at (${effectiveCentroid.lat.toFixed(3)}°N, ${effectiveCentroid.lng.toFixed(3)}°E).`}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 self-start">
                  {(
                    [
                      { id: 'all', ar: 'الكل (6)', en: 'All (6)' },
                      { id: 'wheat', ar: 'القمح', en: 'Wheat' },
                      { id: 'maize', ar: 'الذرة', en: 'Maize' },
                      { id: 'cotton', ar: 'القطن', en: 'Cotton' },
                      { id: 'vegetables', ar: 'الخضر', en: 'Vegetables' },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      data-testid={`pest-alert-filter-${f.id}`}
                      onClick={() => setPestCropFilter(f.id)}
                      className={`min-h-[34px] px-2.5 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                        pestCropFilter === f.id
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {isAr ? f.ar : f.en}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredPestAlerts.map((alert) => {
                  const isCrit = alert.riskLevel === 'critical';
                  const isHigh = alert.riskLevel === 'high';
                  const isExpanded = !!expandedPestAlertIds[alert.id];
                  return (
                    <div
                      key={alert.id}
                      data-testid={`proactive-pest-alert-card-${alert.id}`}
                      className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 ${
                        isCrit
                          ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
                          : isHigh
                          ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                          : 'bg-slate-50/80 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold text-white tabular-nums ${
                                isCrit ? 'bg-rose-600' : isHigh ? 'bg-amber-600' : 'bg-slate-700'
                              }`}
                            >
                              {alert.likelihoodPct}%
                            </span>
                            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400">
                              {isAr ? alert.cropNameAr : alert.cropNameEn}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            {alert.vulnerableSubZones.map((z) => (
                              <span
                                key={z}
                                className="px-1.5 py-0.5 rounded bg-slate-900 dark:bg-slate-700 text-white font-mono text-[10px] font-bold"
                              >
                                {isAr ? `زونا ${z}` : `Z-${z}`}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                            {isAr ? alert.pestNameAr : alert.pestNameEn}
                          </h4>
                          <span className="text-[11px] font-mono text-slate-500">
                            {alert.scientificName}
                          </span>
                        </div>

                        <p className="text-xs text-slate-700 dark:text-slate-300">
                          <strong className="text-amber-800 dark:text-amber-400">
                            {isAr ? 'المسبب المناخي:' : 'Weather Trigger:'}
                          </strong>{' '}
                          {isAr ? alert.weatherTriggersAr : alert.weatherTriggersEn}
                        </p>

                        {isExpanded && (
                          <div className="pt-2 space-y-2 border-t border-slate-200/70 dark:border-slate-700/70 text-xs">
                            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                              <strong className="text-slate-900 dark:text-white">
                                {isAr ? 'السجل الوبائي:' : 'Historical Context:'}
                              </strong>{' '}
                              {isAr
                                ? alert.historicalOutbreakContextAr
                                : alert.historicalOutbreakContextEn}
                            </div>

                            <div className="space-y-1">
                              <div className="font-bold text-emerald-800 dark:text-emerald-400">
                                {isAr ? '🛡️ الإجراءات الوقائية:' : '🛡️ Preventative Actions:'}
                              </div>
                              <ul className="space-y-1 text-slate-700 dark:text-slate-300 list-disc list-inside">
                                {(isAr
                                  ? alert.preventativeActionsAr
                                  : alert.preventativeActionsEn
                                ).map((act, idx) => (
                                  <li key={idx}>{act}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="pt-2.5 border-t border-slate-200/70 dark:border-slate-700/70 flex flex-wrap items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => togglePestAlertExpanded(alert.id)}
                          className="min-h-[36px] px-3 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-3.5 h-3.5" />
                              <span>{isAr ? 'إخفاء الوقاية' : 'Hide Actions'}</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3.5 h-3.5" />
                              <span>{isAr ? 'الوقاية والسجل' : 'Actions & History'}</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          data-testid={`ask-agronomist-pest-btn-${alert.id}`}
                          onClick={() =>
                            onConsultAgronomistWithPrompt?.(
                              isAr ? alert.advisorPromptAr : alert.advisorPromptEn
                            )
                          }
                          className="min-h-[36px] px-3.5 py-1 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                        >
                          <Bot className="w-3.5 h-3.5" />
                          <span>{isAr ? 'استشارة GeoAgri ai' : 'Ask GeoAgri ai'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW 4C: EGYPTIAN STRATEGIC CROPS PEST GUIDE */}
          {riskSubMode === 'strategic_guide' && (
            <div
              data-testid="egyptian-strategic-crops-pests-panel"
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                    <span>
                      {isAr
                        ? 'دليل آفات المحاصيل الاستراتيجية (القمح · الذرة · القطن) وكسرها بالدورة'
                        : 'Egyptian Strategic Crops Pest & Rotation Mitigation Guide'}
                    </span>
                  </h3>
                </div>
                <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 self-start">
                  ARC Egypt
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {(['wheat', 'maize', 'cotton'] as const).map((keyCropId) => {
                  const cObj = CROP_DATABASE.find((c) => c.id === keyCropId);
                  if (!cObj) return null;
                  return (
                    <div
                      key={cObj.id}
                      data-testid={`strategic-crop-pest-card-${cObj.id}`}
                      className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-400">
                              {cObj.scientificName}
                            </span>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                              {isAr ? cObj.nameAr : cObj.nameEn}
                            </h4>
                          </div>
                          <button
                            type="button"
                            onClick={() => onAdoptCrop(cObj.id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-semibold cursor-pointer shrink-0"
                          >
                            {isAr ? 'اعتماد' : 'Select'}
                          </button>
                        </div>

                        <div className="space-y-2">
                          {cObj.commonPestsAndDiseases?.map((pest, pIdx) => (
                            <div
                              key={pIdx}
                              className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 space-y-1 text-xs"
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1">
                                  <Bug className="w-3.5 h-3.5 shrink-0" />
                                  {isAr ? pest.nameAr : pest.nameEn}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                                {isAr ? pest.symptomsAr : pest.symptomsEn}
                              </p>
                              <p className="text-[11px] text-emerald-800 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/30 px-2 py-1 rounded">
                                🛡️ {isAr ? pest.rotationMitigationAr : pest.rotationMitigationEn}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
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
    </div>
  );
};
