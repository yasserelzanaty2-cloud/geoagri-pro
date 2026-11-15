import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  CheckSquare,
  Columns,
  Eye,
  GitCompare,
  History,
  Layers,
  MapPin,
  PlusCircle,
  Sprout,
  Square,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import {
  AreaBreakdown,
  CoreSpectralIndexKey,
  GrowthStageInfo,
  HistoricalComparableIndexKey,
  HistoricalSeasonRange,
  Language,
  SoilProfile,
  SpectralIndexKey,
  SpectralTemporalPoint,
  SubZoneSummary,
  UserStudyZone,
} from '../types/agro';
import { buildHistoricalSpectralComparison, computeESI } from '../utils/agroEngine';

interface SpectralIndicesViewProps {
  language: Language;
  farmAverages: Record<SpectralIndexKey, number>;
  subZones: SubZoneSummary[];
  timeSeries: SpectralTemporalPoint[];
  growthStage: GrowthStageInfo;
  cropNameAr: string;
  cropNameEn: string;
  activeLayer: SpectralIndexKey;
  onSelectLayerOnMap: (layer: SpectralIndexKey) => void;
  // Multi-zone & drawn-boundary props
  hasActiveStudyArea?: boolean;
  area?: AreaBreakdown;
  zones?: UserStudyZone[];
  activeZoneId?: string | null;
  comparedZoneIds?: string[];
  onSelectActiveZone?: (zoneId: string) => void;
  onToggleCompareZone?: (zoneId: string) => void;
  onGoToMapToDrawZone?: () => void;
  onSaveDrawnBoundary?: () => void;
  soil?: SoilProfile;
}

interface IndexSpecCard {
  key: SpectralIndexKey;
  titleAr: string;
  titleEn: string;
  formula: string;
  sensor: string;
  value: number;
  unit: string;
  optimalRange: string;
  descriptionAr: string;
  descriptionEn: string;
  interpretationAr: string;
  interpretationEn: string;
}

export const SpectralIndicesView: React.FC<SpectralIndicesViewProps> = ({
  language,
  farmAverages,
  timeSeries,
  growthStage,
  cropNameAr,
  cropNameEn,
  activeLayer,
  onSelectLayerOnMap,
  hasActiveStudyArea = false,
  area,
  zones = [],
  activeZoneId = null,
  comparedZoneIds = [],
  onSelectActiveZone,
  onToggleCompareZone,
  onGoToMapToDrawZone,
  onSaveDrawnBoundary,
  soil,
}) => {
  const isAr = language === 'ar';
  const [selectedChartIndex, setSelectedChartIndex] = useState<CoreSpectralIndexKey>('NDVI');
  const [histIndex, setHistIndex] = useState<HistoricalComparableIndexKey>('NDVI');
  const [histSeasons, setHistSeasons] = useState<HistoricalSeasonRange>(3);
  const [histViewMode, setHistViewMode] = useState<'overlay' | 'side_by_side'>('overlay');
  const esiValue = computeESI(farmAverages.LST, farmAverages.NDVI);

  const historicalComparison = useMemo(
    () => buildHistoricalSpectralComparison(timeSeries, farmAverages, histSeasons, soil),
    [timeSeries, farmAverages, histSeasons, soil]
  );

  const activeZone = zones.find((z) => z.id === activeZoneId) || null;
  const isUnsavedDrawnBoundary = zones.length === 0 && hasActiveStudyArea;
  const zonesToCompare =
    comparedZoneIds.length >= 2
      ? zones.filter((z) => comparedZoneIds.includes(z.id))
      : zones;

  // If neither a saved zone nor a drawn polygon exists yet, show the Zero-State prompt
  if (zones.length === 0 && !hasActiveStudyArea) {
    return (
      <div
        data-testid="indices-zero-zones-state"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center max-w-2xl mx-auto my-8 space-y-4"
      >
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
          <MapPin className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          {isAr
            ? 'لم يتم تحديد أي زونة دراسة على الخريطة بعد'
            : 'No Study Zone Selected on the Map Yet'}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {isAr
            ? 'تطبيق GeoAgri Pro لا يعرض أي بيانات مسبقة إلا بعد أن تحدد بنفسك الزونة أو الزونات التي ترغب في دراستها على الخريطة وتسميتها.'
            : 'GeoAgri Pro displays spectral telemetry only after you draw and name your own study zone(s) on the map.'}
        </p>
        {onGoToMapToDrawZone && (
          <button
            type="button"
            data-testid="indices-go-draw-zone-btn"
            onClick={onGoToMapToDrawZone}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold inline-flex items-center gap-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>
              {isAr ? 'انتقل إلى الخريطة لرسم زونة جديدة' : 'Go to Map to Draw a New Zone'}
            </span>
          </button>
        )}
      </div>
    );
  }

  const indexSpecs: IndexSpecCard[] = [
    {
      key: 'NDVI',
      titleAr: 'مؤشر الاختلاف الطبيعي للغطاء النباتي (NDVI)',
      titleEn: 'Normalized Difference Vegetation Index (NDVI)',
      formula: '(NIR - Red) / (NIR + Red)',
      sensor: 'Sentinel-2 MSI (10m) · Band 8 & Band 4',
      value: farmAverages.NDVI,
      unit: '',
      optimalRange: '0.55 – 0.85',
      descriptionAr: 'يقيس كثافة الكلوروفيل والنشاط الضوئي والكتلة الحيوية ويكتشف البقع المكشوفة.',
      descriptionEn: 'Measures chlorophyll density, photosynthetic vigor, and detects bare-soil gaps.',
      interpretationAr:
        farmAverages.NDVI >= 0.55
          ? 'نشاط كلوروفيل قوي وتغطية خضرية كثيفة في الحقل (اللون الأخضر).'
          : 'تغطية خضرية متوسطة أو تربة غير مزروعة (اللون الأصفر).',
      interpretationEn:
        farmAverages.NDVI >= 0.55
          ? 'Strong chlorophyll activity and dense canopy closure (Green).'
          : 'Moderate canopy vigor or uncultivated soil (Yellow).',
    },
    {
      key: 'NDWI',
      titleAr: 'مؤشر المحتوى المائي للنبات والغدق (NDWI / NWI)',
      titleEn: 'Normalized Difference Water Index (NDWI / NWI)',
      formula: '(Green - NIR)/(Green + NIR) & (NIR - SWIR)/(NIR + SWIR)',
      sensor: 'Sentinel-2 Band 3/8/11 & Landsat-9 OLI',
      value: farmAverages.NDWI,
      unit: '',
      optimalRange: '0.22 – 0.45',
      descriptionAr: 'يتتبع المحتوى المائي داخل خلايا الأوراق ويكتشف العطش المبكر أو تجمع المياه السطحية.',
      descriptionEn: 'Tracks canopy leaf turgor water content, water stress, and surface waterlogging.',
      interpretationAr:
        farmAverages.NDWI >= 0.22
          ? 'امتلاء مائي ممتاز للأوراق دون إجهاد عطش.'
          : 'بداية إجهاد مائي في المجموع الخضري خاصة في الزونا A.',
      interpretationEn:
        farmAverages.NDWI >= 0.22
          ? 'Healthy leaf turgor and balanced canopy water status.'
          : 'Early canopy moisture deficit detected, particularly in Zone A.',
    },
    {
      key: 'SAVI',
      titleAr: 'مؤشر الغطاء النباتي المعدّل للتربة (SAVI)',
      titleEn: 'Soil-Adjusted Vegetation Index (SAVI, L=0.5)',
      formula: '((NIR - Red) / (NIR + Red + 0.5)) × 1.5',
      sensor: 'Sentinel-2 & Landsat 8/9 Surface Reflectance',
      value: farmAverages.SAVI,
      unit: '',
      optimalRange: '0.42 – 0.70',
      descriptionAr: 'يعزل انعكاس سطوع التربة الرملية أو الجيرية المكشوفة في مراحل الإنبات المبكرة.',
      descriptionEn: 'Eliminates bare soil brightness distortion in arid/sandy soils and early emergence.',
      interpretationAr: 'دقيق جداً لقياس نمو البادرات الفعلي بعد استبعاد انعكاس التربة.',
      interpretationEn: 'True plant emergence reading corrected for background soil reflectance.',
    },
    {
      key: 'NDMI',
      titleAr: 'مؤشر رطوبة منطقة الجذور والغطاء (NDMI)',
      titleEn: 'Normalized Difference Moisture Index (NDMI)',
      formula: '(NIR - SWIR1) / (NIR + SWIR1)',
      sensor: 'NASA SMAP (L-Band) + Sentinel-2 SWIR',
      value: farmAverages.NDMI,
      unit: '',
      optimalRange: '0.25 – 0.50',
      descriptionAr: 'يرتبط مباشرة برطوبة منطقة انتشار الجذور (0-28 سم) من بيانات قمر NASA SMAP.',
      descriptionEn: 'Correlates root-zone moisture (0–28cm) with canopy SWIR absorption.',
      interpretationAr: 'تدرج رطوبي واضح من الزونا A (الأقل رطوبة) إلى الزونا C (الأعلى احتفاظاً بالماء).',
      interpretationEn: 'Clear moisture gradient from drier NE Zone A to moisture-retaining SW Zone C.',
    },
    {
      key: 'EVI',
      titleAr: 'مؤشر الغطاء النباتي المحسّن (EVI)',
      titleEn: 'Enhanced Vegetation Index (EVI)',
      formula: '2.5 × (NIR - Red) / (NIR + 6×Red - 7.5×Blue + 1)',
      sensor: 'MODIS Terra/Aqua & Sentinel-2',
      value: farmAverages.EVI,
      unit: '',
      optimalRange: '0.45 – 0.78',
      descriptionAr: 'حساسية عالية للكتلة الحيوية الكثيفة في أراضي الدلتا دون تشبع القراءات.',
      descriptionEn: 'High-biomass sensitivity without saturation in dense Nile Delta canopies.',
      interpretationAr: 'يؤكد كفاءة التمثيل الضوئي في طبقات الأوراق السفلية والعلوية.',
      interpretationEn: 'Confirms photosynthetic efficiency across upper and lower leaf layers.',
    },
    {
      key: 'LST',
      titleAr: 'حرارة سطح الأوراق والإجهاد التبخري (LST & ESI)',
      titleEn: 'Land Surface Temp & Evaporative Stress (ECOSTRESS)',
      formula: 'TIR Brightness Temp + ESI (ET / PET Anomaly)',
      sensor: 'ISS ECOSTRESS Thermal Radiometer (70m)',
      value: farmAverages.LST,
      unit: '°C',
      optimalRange: '21.0°C – 27.5°C',
      descriptionAr: `يكتشف الإجهاد الحراري وإغلاق الثغور قبل ظهور الذبول البصري بـ 4 أيام (مؤشر ESI: ${esiValue}).`,
      descriptionEn: `Detects stomatal closure & thermal canopy stress 4 days before visible wilting (ESI: ${esiValue}).`,
      interpretationAr:
        farmAverages.LST <= 27.5
          ? `تبريد النتح طبيعي في الأوراق (ESI = ${esiValue}).`
          : `ارتفاع حراري فوق المعدل (${farmAverages.LST}°م) يستدعي رية تلطيفية.`,
      interpretationEn:
        farmAverages.LST <= 27.5
          ? `Transpirational leaf cooling is nominal (ESI = ${esiValue}).`
          : `Elevated canopy temperature (${farmAverages.LST}°C) requires cooling irrigation.`,
    },
  ];

  // SVG Chart Geometry
  const svgWidth = 680;
  const svgHeight = 210;
  const padLeft = 42;
  const padRight = 24;
  const padTop = 22;
  const padBottom = 36;
  const plotW = svgWidth - padLeft - padRight;
  const plotH = svgHeight - padTop - padBottom;

  const isLstChart = selectedChartIndex === 'LST';
  const minVal = isLstChart ? 16 : 0;
  const maxVal = isLstChart ? 36 : 0.9;

  const points = timeSeries.map((pt, i) => {
    const x = padLeft + (i / Math.max(1, timeSeries.length - 1)) * plotW;
    const raw = pt[selectedChartIndex];
    const norm = Math.max(0, Math.min(1, (raw - minVal) / (maxVal - minVal)));
    const y = padTop + (1 - norm) * plotH;
    return { x, y, raw, pt };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');
  const areaPath =
    points.length > 0
      ? `M ${points[0].x},${padTop + plotH} L ` +
        points.map((p) => `${p.x},${p.y}`).join(' L ') +
        ` L ${points[points.length - 1].x},${padTop + plotH} Z`
      : '';

  return (
    <div className="space-y-6">
      {/* Section Header + Zone Switcher */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
              {isAr
                ? '02. محرك المؤشرات الطيفية المعاير (Sentinel-2 BOA · NASA GIBS MODIS 250m · ESA WorldCover 10m · SMAP)'
                : '02. Multi-Spectral Satellite Indices Engine'}
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {activeZone
                ? isAr
                  ? `التحليل الطيفي للزونة النشطة: ${activeZone.nameAr} (${cropNameAr})`
                  : `Spectral Diagnostics — Active Zone: ${activeZone.nameEn} (${cropNameEn})`
                : isAr
                ? `التحليل الطيفي للحدود المرسومة (${area ? `${area.feddans} فدان ${area.qirats} قيراط · ` : ''}${cropNameAr})`
                : `Spectral Diagnostics — Drawn Boundary (${area ? `${area.feddans} fed · ` : ''}${cropNameEn})`}
            </h2>

            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                🛰️ Copernicus Sentinel-2 (10m)
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-100 dark:bg-cyan-950/70 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800">
                🛰️ USGS/NASA Landsat 8/9 (30m)
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                🌡️ ISS ECOSTRESS LST (70m)
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                🌱 USDA CropScape / CDL
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
              {isAr ? 'آخر التقاط مداري: 0% سحب · دقة 10 متر' : 'Last Orbital Pass: 0% Cloud · 10m GSD'}
            </span>
            {isUnsavedDrawnBoundary && onSaveDrawnBoundary && (
              <button
                type="button"
                data-testid="indices-save-drawn-zone-btn"
                onClick={onSaveDrawnBoundary}
                className="min-h-[36px] px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{isAr ? 'حفظ الحدود كمزرعة دائمة' : 'Save Boundary as Farm'}</span>
              </button>
            )}
          </div>
        </div>

        {/* User Zones Selector Pills inside Spectral Tab */}
        {zones.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              {isAr ? 'الزونات المضافة:' : 'Study Zones:'}
            </span>
            {zones.map((z) => {
              const isAct = z.id === activeZoneId;
              const isComp = comparedZoneIds.includes(z.id);
              return (
                <div
                  key={z.id}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs transition-all ${
                    isAct
                      ? 'bg-emerald-600 text-white border-emerald-500 font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {onToggleCompareZone && (
                    <button
                      type="button"
                      onClick={() => onToggleCompareZone(z.id)}
                      title={isAr ? 'تحديد للمقارنة' : 'Select for comparison'}
                      className="cursor-pointer"
                    >
                      {isComp ? (
                        <CheckSquare className="w-3.5 h-3.5 text-sky-300" />
                      ) : (
                        <Square className="w-3.5 h-3.5 opacity-60" />
                      )}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onSelectActiveZone?.(z.id)}
                    className="cursor-pointer"
                  >
                    {isAr ? z.nameAr : z.nameEn} ({z.area.feddans} {isAr ? 'فدان' : 'fed'})
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MULTI-ZONE COMPARISON TABLE (Shown when >= 2 zones exist or are selected for comparison) */}
      {zonesToCompare.length >= 2 && (
        <div
          data-testid="indices-zone-comparison-table"
          className="bg-white dark:bg-slate-900 border-2 border-sky-500/40 rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isAr
                  ? `جدول المقارنة العلمية بين الزونات (${zonesToCompare.length} زونات مستقلة)`
                  : `Multi-Zone Scientific Comparison Table (${zonesToCompare.length} Independent Zones)`}
              </h3>
            </div>
            <span className="text-xs font-mono text-sky-600 dark:text-sky-400">
              {isAr ? 'بيانات كل زونة معزولة ومستقلة 100%' : '100% Isolated Per-Zone Telemetry'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  <th className="py-2 px-2.5 text-start">{isAr ? 'المعيار / المؤشر' : 'Metric'}</th>
                  {zonesToCompare.map((z) => (
                    <th
                      key={z.id}
                      className={`py-2 px-2.5 text-start font-bold ${
                        z.id === activeZoneId
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {isAr ? z.nameAr : z.nameEn}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-mono">
                <tr>
                  <td className="py-2 px-2.5 font-sans font-semibold text-slate-600 dark:text-slate-300">
                    {isAr ? 'المساحة (فدان)' : 'Area (Feddans)'}
                  </td>
                  {zonesToCompare.map((z) => (
                    <td key={z.id} className="py-2 px-2.5 font-bold text-emerald-600 dark:text-emerald-400">
                      {z.area.feddans} {isAr ? 'فدان' : 'fed'} ({z.area.hectares} ha)
                    </td>
                  ))}
                </tr>
                {(
                  [
                    { key: 'NDVI', labelAr: 'NDVI الغطاء النباتي', labelEn: 'NDVI Vigor', unit: '' },
                    { key: 'NDWI', labelAr: 'NDWI مياه الأوراق', labelEn: 'NDWI Leaf Water', unit: '' },
                    { key: 'SAVI', labelAr: 'SAVI المعدل للتربة', labelEn: 'SAVI Soil-Adj', unit: '' },
                    { key: 'NDMI', labelAr: 'NDMI رطوبة الجذور', labelEn: 'NDMI Moisture', unit: '' },
                    { key: 'EVI', labelAr: 'EVI الكتلة الحيوية', labelEn: 'EVI Biomass', unit: '' },
                    { key: 'SM_0_7', labelAr: 'رطوبة السطح 0-7 سم', labelEn: 'Soil Moisture 0-7cm', unit: '%' },
                    { key: 'SM_7_28', labelAr: 'رطوبة الجذور 7-28 سم', labelEn: 'Root Moisture 7-28cm', unit: '%' },
                    { key: 'LST', labelAr: 'LST حرارة السطح', labelEn: 'LST Surface Temp', unit: '°C' },
                    { key: 'SOIL_EC', labelAr: 'ملوحة التربة EC', labelEn: 'Salinity EC', unit: ' dS/m' },
                    { key: 'SOIL_PH', labelAr: 'حموضة التربة pH', labelEn: 'Soil pH', unit: '' },
                  ] as Array<{ key: SpectralIndexKey; labelAr: string; labelEn: string; unit: string }>
                ).map((row) => (
                  <tr key={row.key}>
                    <td className="py-2 px-2.5 font-sans font-semibold text-slate-600 dark:text-slate-300">
                      {isAr ? row.labelAr : row.labelEn}
                    </td>
                    {zonesToCompare.map((z) => (
                      <td key={z.id} className="py-2 px-2.5 font-bold text-slate-900 dark:text-slate-100">
                        {z.farmAverages[row.key]}
                        {row.unit}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Crop Growth Stage & Accumulated GDD Tracker */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Sprout className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {isAr
                  ? `تتبع مراحل نمو المحصول والوحدات الحرارية المتجمعة (GDD)`
                  : `Crop Growth Stage & Accumulated GDD Tracker`}
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isAr
                ? `المرحلة الحالية: ${growthStage.stageNameAr} · معامل المحصول المائي Kc = ${growthStage.cropCoefficientKc}`
                : `Current Stage: ${growthStage.stageNameEn} · Crop Coefficient Kc = ${growthStage.cropCoefficientKc}`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-500 dark:text-slate-400">
                {isAr ? 'الوحدات الحرارية GDD:' : 'Accumulated GDD:'}
              </span>{' '}
              <span className="font-bold text-emerald-700 dark:text-emerald-400">
                {growthStage.accumulatedGDD} / {growthStage.targetTotalGDD} °C·d
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400">
                {isAr ? 'التغطية الخضرية:' : 'Canopy Cover:'}
              </span>{' '}
              <span className="font-bold text-slate-900 dark:text-white">
                {growthStage.canopyCoverPct}%
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400">
                {isAr ? 'عمق الجذور الفعال:' : 'Root Depth:'}
              </span>{' '}
              <span className="font-bold text-slate-900 dark:text-white">
                {growthStage.rootDepthCm} cm
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-600 rounded-full transition-all duration-300"
            style={{ width: `${growthStage.completionPct}%` }}
          />
        </div>

        {/* 5 Phenological Stages Stepper */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
          {growthStage.stages.map((st, idx) => {
            const isActive = st.status === 'active';
            const isDone = st.status === 'completed';
            return (
              <div
                key={st.key}
                className={`p-3 rounded-xl border text-xs ${
                  isActive
                    ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-600 text-slate-900 dark:text-white'
                    : isDone
                    ? 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    : 'bg-white dark:bg-slate-900 border-slate-200/70 dark:border-slate-800 text-slate-400 dark:text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span>0{idx + 1}</span>
                  <span dir="ltr">
                    {idx === 0 ? 0 : growthStage.stages[idx - 1].gddThreshold}–{st.gddThreshold} GDD
                  </span>
                </div>
                <div className="font-bold mt-1 text-slate-900 dark:text-slate-100">
                  {isAr ? st.nameAr : st.nameEn}
                </div>
                <div className="mt-1 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                  Kc: {st.kc} ·{' '}
                  {isActive
                    ? isAr
                      ? 'المرحلة الجارية'
                      : 'Active'
                    : isDone
                    ? isAr
                      ? 'مكتملة'
                      : 'Done'
                    : isAr
                    ? 'قادمة'
                    : 'Upcoming'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Multi-Temporal Satellite Curve (SVG Time-Series) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {isAr
                ? 'المنحنى الزمني لمرور الأقمار الصناعية (آخر 35 يوماً)'
                : 'Multi-Temporal Satellite Pass Trajectory (Last 35 Days)'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAr
                ? 'اختر المؤشر لمقارنة تطور النمو الخضري والمحتوى المائي عبر الزمن'
                : 'Select a spectral index to inspect multi-sensor temporal progression'}
            </p>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {(['NDVI', 'NDWI', 'SAVI', 'NDMI', 'EVI', 'LST'] as CoreSpectralIndexKey[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setSelectedChartIndex(k)}
                className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedChartIndex === k
                    ? 'bg-slate-900 dark:bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full overflow-x-auto" dir="ltr">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full min-w-[520px] h-52"
            role="img"
            aria-label={`Time series chart for ${selectedChartIndex}`}
          >
            <defs>
              <linearGradient id="spectralAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.32" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Horizontal reference lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((step, i) => {
              const y = padTop + step * plotH;
              const val = (maxVal - step * (maxVal - minVal)).toFixed(isLstChart ? 0 : 2);
              return (
                <g key={i}>
                  <line
                    x1={padLeft}
                    y1={y}
                    x2={svgWidth - padRight}
                    y2={y}
                    stroke="currentColor"
                    className="text-slate-200 dark:text-slate-800"
                    strokeDasharray="3,3"
                  />
                  <text
                    x={padLeft - 8}
                    y={y + 4}
                    textAnchor="end"
                    className="fill-slate-400 font-mono text-[10px]"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            <path d={areaPath} fill="url(#spectralAreaGrad)" />
            <polyline
              fill="none"
              stroke="#10b981"
              strokeWidth="2.8"
              points={polylinePoints}
            />

            {points.map((p, idx) => {
              const shortSat =
                p.pt.satellite === 'Sentinel-2A'
                  ? 'S2A'
                  : p.pt.satellite === 'Sentinel-2B'
                  ? 'S2B'
                  : p.pt.satellite === 'Landsat-9'
                  ? 'L9'
                  : p.pt.satellite === 'MODIS/SMAP'
                  ? 'SMAP'
                  : 'ECO';
              return (
                <g key={idx}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="4.5"
                    className="fill-emerald-600 stroke-white dark:stroke-slate-900"
                    strokeWidth="2"
                  />
                  <text
                    x={p.x}
                    y={p.y - 10}
                    textAnchor="middle"
                    className="fill-slate-800 dark:fill-slate-200 font-mono text-[10px] font-semibold"
                  >
                    {p.raw}
                  </text>
                  <text
                    x={p.x}
                    y={svgHeight - 12}
                    textAnchor="middle"
                    className="fill-slate-500 font-mono text-[10px]"
                  >
                    {p.pt.date.slice(5)} · {shortSat}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Historical Multi-Season Spectral Comparison (NDVI, NDWI, SAVI) — Overlayed Chart & Side-by-Side View */}
      <div
        data-testid="historical-spectral-comparison-section"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-5"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                <History className="w-4 h-4" />
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {isAr
                  ? 'مقارنة المؤشرات الطيفية التاريخية واكتشاف الشذوذ (آخر 1–3 مواسم)'
                  : 'Historical Multi-Season Spectral Comparison & Anomaly Detection (Last 1–3 Seasons)'}
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAr
                ? 'قارن بيانات الموسم الحالي (NDVI, NDWI, SAVI) بنفس الفترة الزمنية من السنوات السابقة لرصد الشذوذ وتتبع أداء الحقل طويل الأمد'
                : 'Compare current season spectral data (NDVI, NDWI, SAVI) with the same period in previous years using overlayed charts or side-by-side views'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Comparable Spectral Index Selector (NDVI, NDWI, SAVI) */}
            <div className="inline-flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-1 gap-1">
              {(['NDVI', 'NDWI', 'SAVI'] as HistoricalComparableIndexKey[]).map((idxKey) => (
                <button
                  key={idxKey}
                  type="button"
                  data-testid={`hist-index-btn-${idxKey}`}
                  onClick={() => setHistIndex(idxKey)}
                  className={`min-h-[34px] px-3 py-1 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    histIndex === idxKey
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {idxKey}
                </button>
              ))}
            </div>

            {/* Historical Range Selector (1, 2, 3 Seasons) */}
            <div className="inline-flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-1 gap-1">
              {([1, 2, 3] as HistoricalSeasonRange[]).map((sc) => (
                <button
                  key={sc}
                  type="button"
                  data-testid={`hist-season-btn-${sc}`}
                  onClick={() => setHistSeasons(sc)}
                  className={`min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    histSeasons === sc
                      ? 'bg-slate-900 dark:bg-sky-600 text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {sc === 1
                    ? isAr
                      ? 'موسم سابق (1Y)'
                      : 'Last 1 Season'
                    : sc === 2
                    ? isAr
                      ? 'موسمان (2Y)'
                      : 'Last 2 Seasons'
                    : isAr
                    ? '3 مواسم (3Y)'
                    : 'Last 3 Seasons'}
                </button>
              ))}
            </div>

            {/* Display Mode Toggle: Overlayed Chart vs Side-by-Side View */}
            <div className="inline-flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-1 gap-1">
              <button
                type="button"
                data-testid="hist-view-mode-overlay"
                onClick={() => setHistViewMode('overlay')}
                className={`min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                  histViewMode === 'overlay'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>{isAr ? 'مخطط متراكب (Overlay)' : 'Overlayed Chart'}</span>
              </button>
              <button
                type="button"
                data-testid="hist-view-mode-side_by_side"
                onClick={() => setHistViewMode('side_by_side')}
                className={`min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                  histViewMode === 'side_by_side'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                <span>{isAr ? 'عرض جنباً إلى جنب (Side-by-Side)' : 'Side-by-Side View'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3 Anomaly Detection Summary Cards (NDVI, NDWI, SAVI) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {(['NDVI', 'NDWI', 'SAVI'] as HistoricalComparableIndexKey[]).map((k) => {
            const summary = historicalComparison[k];
            const isSelected = histIndex === k;
            const isPos = summary.anomalyStatus === 'positive_anomaly';
            const isNeg = summary.anomalyStatus === 'negative_anomaly';
            return (
              <div
                key={k}
                data-testid={`hist-anomaly-card-${k}`}
                onClick={() => setHistIndex(k)}
                className={`rounded-xl p-3.5 border transition-all cursor-pointer space-y-2 ${
                  isSelected
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500 ring-1 ring-emerald-500/40'
                    : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                      {k}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 ${
                        isPos
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                          : isNeg
                          ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                          : 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30'
                      }`}
                    >
                      {isPos ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : isNeg ? (
                        <TrendingDown className="w-3 h-3" />
                      ) : (
                        <CheckCircle2 className="w-3 h-3" />
                      )}
                      <span>
                        {isPos
                          ? isAr
                            ? 'تفوق إيجابي'
                            : 'Positive Anomaly'
                          : isNeg
                          ? isAr
                            ? 'شذوذ/إجهاد سلبي'
                            : 'Negative Anomaly'
                          : isAr
                          ? 'نطاق طبيعي'
                          : 'Normal Range'}
                      </span>
                    </span>
                  </div>
                  <span
                    dir="ltr"
                    className={`font-mono text-xs font-bold tabular-nums ${
                      summary.deltaPct > 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : summary.deltaPct < 0
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {summary.deltaPct > 0 ? `+${summary.deltaPct}%` : `${summary.deltaPct}%`}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-xs tabular-nums">
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800">
                    <div className="text-[10px] font-sans text-slate-500">
                      {isAr ? 'الموسم الحالي' : 'Current'}
                    </div>
                    <div dir="ltr" className="font-bold text-slate-900 dark:text-white mt-0.5">
                      {summary.currentAvg}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800">
                    <div className="text-[10px] font-sans text-slate-500">
                      {isAr ? `مرجع (${histSeasons}Y)` : `${histSeasons}Y Baseline`}
                    </div>
                    <div className="font-bold text-sky-600 dark:text-sky-400 mt-0.5">
                      {summary.multiYearBaselineAvg}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800">
                    <div className="text-[10px] font-sans text-slate-500">
                      {isAr ? 'قبل عام (-1Y)' : 'Season -1'}
                    </div>
                    <div className="font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                      {summary.season1AgoAvg}
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  {isAr ? summary.diagnosisAr : summary.diagnosisEn}
                </p>
              </div>
            );
          })}
        </div>

        {/* Active Index Comparison Visualization: Overlayed Chart OR Side-by-Side View */}
        {(() => {
          const activeSummary = historicalComparison[histIndex];
          const activeHistPoints = activeSummary.points;
          const allVals = activeHistPoints.flatMap((pt) => {
            const arr = [pt.currentValue, pt.season1AgoValue, pt.historicalMeanValue];
            if (histSeasons >= 2) arr.push(pt.season2AgoValue);
            if (histSeasons >= 3) arr.push(pt.season3AgoValue);
            return arr;
          });
          const rawMin = Math.min(...allVals);
          const rawMax = Math.max(...allVals);
          const hMin = Math.floor((rawMin - 0.06) * 20) / 20;
          const hMax = Math.ceil((rawMax + 0.06) * 20) / 20;
          const hSpan = Math.max(0.12, hMax - hMin);

          const toCoords = (selector: (p: (typeof activeHistPoints)[number]) => number) =>
            activeHistPoints.map((pt, idx) => {
              const x =
                padLeft +
                (idx / Math.max(1, activeHistPoints.length - 1)) *
                  (svgWidth - padLeft - padRight);
              const val = selector(pt);
              const norm = (val - hMin) / hSpan;
              const y = padTop + plotH - norm * plotH;
              return { x, y, val, pt };
            });

          const curCoords = toCoords((p) => p.currentValue);
          const s1Coords = toCoords((p) => p.season1AgoValue);
          const s2Coords = toCoords((p) => p.season2AgoValue);
          const s3Coords = toCoords((p) => p.season3AgoValue);
          const baseCoords = toCoords((p) => p.historicalMeanValue);

          const polyStr = (coords: { x: number; y: number }[]) =>
            coords.map((c) => `${c.x},${c.y}`).join(' ');

          if (histViewMode === 'overlay') {
            return (
              <div data-testid="historical-overlay-chart" className="space-y-4">
                {/* Legend bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 text-xs">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                      <span className="w-3.5 h-1 rounded-full bg-emerald-500 inline-block" />
                      {isAr ? 'الموسم الحالي (2026)' : 'Current Season (2026)'}
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-semibold text-amber-600 dark:text-amber-400">
                      <span className="w-3.5 h-1 rounded-full bg-amber-500 inline-block" />
                      {isAr ? 'الموسم السابق (-1 سنة)' : 'Season -1 (1 Yr Ago)'}
                    </span>
                    {histSeasons >= 2 && (
                      <span className="inline-flex items-center gap-1.5 font-semibold text-sky-600 dark:text-sky-400">
                        <span className="w-3.5 h-1 rounded-full bg-sky-500 inline-block" />
                        {isAr ? 'قبل موسمين (-2 سنة)' : 'Season -2 (2 Yrs Ago)'}
                      </span>
                    )}
                    {histSeasons >= 3 && (
                      <span className="inline-flex items-center gap-1.5 font-semibold text-purple-600 dark:text-purple-400">
                        <span className="w-3.5 h-1 rounded-full bg-purple-500 inline-block" />
                        {isAr ? 'قبل 3 مواسم (-3 سنوات)' : 'Season -3 (3 Yrs Ago)'}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 font-semibold text-slate-500 dark:text-slate-400">
                      <span className="w-3.5 h-0.5 border-b-2 border-dashed border-slate-400 inline-block" />
                      {isAr ? 'المتوسط المرجعي التاريخي' : 'Multi-Year Baseline Mean'}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                    {histIndex} Δ:{' '}
                    {activeSummary.deltaValue > 0
                      ? `+${activeSummary.deltaValue}`
                      : activeSummary.deltaValue}{' '}
                    ({activeSummary.deltaPct > 0 ? `+${activeSummary.deltaPct}%` : `${activeSummary.deltaPct}%`})
                  </span>
                </div>

                {/* Multi-Season Overlay SVG Chart */}
                <div className="w-full overflow-x-auto" dir="ltr">
                  <svg
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                    className="w-full min-w-[540px] h-56"
                    role="img"
                    aria-label={`Historical multi-season overlay chart for ${histIndex}`}
                  >
                    {[0, 0.25, 0.5, 0.75, 1].map((step, i) => {
                      const y = padTop + step * plotH;
                      const val = (hMax - step * hSpan).toFixed(2);
                      return (
                        <g key={i}>
                          <line
                            x1={padLeft}
                            y1={y}
                            x2={svgWidth - padRight}
                            y2={y}
                            stroke="currentColor"
                            className="text-slate-200 dark:text-slate-800"
                            strokeDasharray="3,3"
                          />
                          <text
                            x={padLeft - 8}
                            y={y + 4}
                            textAnchor="end"
                            className="fill-slate-400 font-mono text-[10px]"
                          >
                            {val}
                          </text>
                        </g>
                      );
                    })}

                    {/* Multi-year baseline dashed curve */}
                    <polyline
                      fill="none"
                      stroke="#94a3b8"
                      strokeWidth="1.8"
                      strokeDasharray="5,4"
                      points={polyStr(baseCoords)}
                    />

                    {/* Season -3 curve */}
                    {histSeasons >= 3 && (
                      <polyline
                        fill="none"
                        stroke="#a855f7"
                        strokeWidth="1.8"
                        strokeOpacity="0.8"
                        points={polyStr(s3Coords)}
                      />
                    )}

                    {/* Season -2 curve */}
                    {histSeasons >= 2 && (
                      <polyline
                        fill="none"
                        stroke="#0ea5e9"
                        strokeWidth="2"
                        strokeOpacity="0.85"
                        points={polyStr(s2Coords)}
                      />
                    )}

                    {/* Season -1 curve */}
                    <polyline
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="2.2"
                      points={polyStr(s1Coords)}
                    />

                    {/* Current Season primary curve */}
                    <polyline
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="3"
                      points={polyStr(curCoords)}
                    />

                    {curCoords.map((c, idx) => {
                      const isAnom = c.pt.isAnomalyPass;
                      return (
                        <g key={idx}>
                          <circle
                            cx={s1Coords[idx].x}
                            cy={s1Coords[idx].y}
                            r="3"
                            fill="#f59e0b"
                          />
                          {histSeasons >= 2 && (
                            <circle
                              cx={s2Coords[idx].x}
                              cy={s2Coords[idx].y}
                              r="2.8"
                              fill="#0ea5e9"
                            />
                          )}
                          {histSeasons >= 3 && (
                            <circle
                              cx={s3Coords[idx].x}
                              cy={s3Coords[idx].y}
                              r="2.5"
                              fill="#a855f7"
                            />
                          )}
                          <circle
                            cx={c.x}
                            cy={c.y}
                            r={isAnom ? '5' : '4'}
                            className={
                              c.pt.deltaPct <= -7
                                ? 'fill-rose-500 stroke-white dark:stroke-slate-900'
                                : 'fill-emerald-600 stroke-white dark:stroke-slate-900'
                            }
                            strokeWidth="2"
                          />
                          <text
                            x={c.x}
                            y={c.y - 9}
                            textAnchor="middle"
                            className="fill-slate-800 dark:fill-slate-200 font-mono text-[10px] font-bold"
                          >
                            {c.val.toFixed(2)}
                          </text>
                          <text
                            x={c.x}
                            y={svgHeight - 10}
                            textAnchor="middle"
                            className="fill-slate-500 font-mono text-[10px]"
                          >
                            {c.pt.periodLabelEn}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>
            );
          }

          // Side-by-Side Comparison View
          return (
            <div data-testid="historical-side-by-side-view" className="space-y-4">
              {/* Season Summary Columns Side-by-Side */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/40 space-y-1">
                  <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    {isAr ? 'الموسم الحالي (2026)' : 'Current Season (2026)'}
                  </div>
                  <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                    {activeSummary.currentAvg}
                  </div>
                  <div className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400">
                    {isAr ? 'المرجع الأساسي النشط' : 'Active Field Telemetry'}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1">
                  <div className="text-xs font-bold text-amber-800 dark:text-amber-300">
                    {isAr ? 'قبل موسم واحد (2025)' : '1 Season Ago (2025)'}
                  </div>
                  <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                    {activeSummary.season1AgoAvg}
                  </div>
                  <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400 tabular-nums">
                    {isAr ? 'الفرق عن الحالي:' : 'Vs Current:'}{' '}
                    {(activeSummary.currentAvg - activeSummary.season1AgoAvg).toFixed(2)}
                  </div>
                </div>

                {histSeasons >= 2 && (
                  <div className="p-3.5 rounded-xl bg-sky-500/10 border border-sky-500/30 space-y-1">
                    <div className="text-xs font-bold text-sky-800 dark:text-sky-300">
                      {isAr ? 'قبل موسمين (2024)' : '2 Seasons Ago (2024)'}
                    </div>
                    <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                      {activeSummary.season2AgoAvg}
                    </div>
                    <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400 tabular-nums">
                      {isAr ? 'الفرق عن الحالي:' : 'Vs Current:'}{' '}
                      {(activeSummary.currentAvg - activeSummary.season2AgoAvg).toFixed(2)}
                    </div>
                  </div>
                )}

                {histSeasons >= 3 && (
                  <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30 space-y-1">
                    <div className="text-xs font-bold text-purple-800 dark:text-purple-300">
                      {isAr ? 'قبل 3 مواسم (2023)' : '3 Seasons Ago (2023)'}
                    </div>
                    <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                      {activeSummary.season3AgoAvg}
                    </div>
                    <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400 tabular-nums">
                      {isAr ? 'الفرق عن الحالي:' : 'Vs Current:'}{' '}
                      {(activeSummary.currentAvg - activeSummary.season3AgoAvg).toFixed(2)}
                    </div>
                  </div>
                )}
              </div>

              {/* Pass-by-Pass Side-by-Side Comparison Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                      <th className="py-2.5 px-3 text-start font-bold">
                        {isAr ? 'فترة الرصد الزمنية' : 'Observation Pass'}
                      </th>
                      <th className="py-2.5 px-3 text-center font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {isAr ? 'الحالي (2026)' : 'Current (2026)'}
                      </th>
                      <th className="py-2.5 px-3 text-center font-mono font-bold text-amber-700 dark:text-amber-400">
                        {isAr ? 'موسم -1 (2025)' : 'Season -1 (2025)'}
                      </th>
                      {histSeasons >= 2 && (
                        <th className="py-2.5 px-3 text-center font-mono font-bold text-sky-700 dark:text-sky-400">
                          {isAr ? 'موسم -2 (2024)' : 'Season -2 (2024)'}
                        </th>
                      )}
                      {histSeasons >= 3 && (
                        <th className="py-2.5 px-3 text-center font-mono font-bold text-purple-700 dark:text-purple-400">
                          {isAr ? 'موسم -3 (2023)' : 'Season -3 (2023)'}
                        </th>
                      )}
                      <th className="py-2.5 px-3 text-center font-mono font-bold">
                        {isAr ? 'الانحراف عن المرجع' : 'Baseline Delta'}
                      </th>
                      <th className="py-2.5 px-3 text-end font-bold">
                        {isAr ? 'تشخيص الشذوذ' : 'Anomaly Status'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800 font-mono tabular-nums">
                    {activeHistPoints.map((pt) => {
                      const isPos = pt.deltaPct >= 7;
                      const isNeg = pt.deltaPct <= -7;
                      return (
                        <tr
                          key={pt.date}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                        >
                          <td className="py-2 px-3 font-sans font-semibold text-slate-900 dark:text-white">
                            {isAr ? pt.periodLabelAr : pt.periodLabelEn}
                          </td>
                          <td className="py-2 px-3 text-center font-bold text-emerald-700 dark:text-emerald-400">
                            {pt.currentValue.toFixed(2)}
                          </td>
                          <td className="py-2 px-3 text-center text-slate-700 dark:text-slate-300">
                            {pt.season1AgoValue.toFixed(2)}
                          </td>
                          {histSeasons >= 2 && (
                            <td className="py-2 px-3 text-center text-slate-700 dark:text-slate-300">
                              {pt.season2AgoValue.toFixed(2)}
                            </td>
                          )}
                          {histSeasons >= 3 && (
                            <td className="py-2 px-3 text-center text-slate-700 dark:text-slate-300">
                              {pt.season3AgoValue.toFixed(2)}
                            </td>
                          )}
                          <td
                            className={`py-2 px-3 text-center font-bold ${
                              pt.deltaPct > 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : pt.deltaPct < 0
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-slate-500'
                            }`}
                          >
                            {pt.deltaPct > 0 ? `+${pt.deltaPct}%` : `${pt.deltaPct}%`}
                          </td>
                          <td className="py-2 px-3 text-end font-sans">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                isPos
                                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                  : isNeg
                                  ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              {isNeg && <AlertTriangle className="w-3 h-3" />}
                              {isPos
                                ? isAr
                                  ? 'أعلى من المعتاد'
                                  : 'Above Normal'
                                : isNeg
                                ? isAr
                                  ? 'شذوذ إجهاد'
                                  : 'Stress Anomaly'
                                : isAr
                                ? 'طبيعي'
                                : 'Normal'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}
      </div>

      {/* 6 Multi-Spectral Index Deep-Dive Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {indexSpecs.map((item) => {
          const isCurrentMapLayer = activeLayer === item.key;
          return (
            <div
              key={item.key}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-mono text-emerald-700 dark:text-emerald-400">
                      {item.sensor}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                      {isAr ? item.titleAr : item.titleEn}
                    </h3>
                  </div>
                  <div className="text-right shrink-0" dir="ltr">
                    <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                      {item.value}
                    </span>
                    {item.unit && (
                      <span className="text-xs font-mono text-slate-500 ml-0.5">{item.unit}</span>
                    )}
                  </div>
                </div>

                <div
                  dir="ltr"
                  className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-800 font-mono text-xs text-slate-700 dark:text-slate-300 text-left overflow-x-auto"
                >
                  {item.formula}
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {isAr ? item.descriptionAr : item.descriptionEn}
                </p>

                <div className="text-xs font-medium text-slate-800 dark:text-slate-200 pt-1">
                  {isAr ? item.interpretationAr : item.interpretationEn}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <span className="text-xs font-mono text-slate-500">
                  {isAr ? 'النطاق المثالي:' : 'Target:'} <span dir="ltr">{item.optimalRange}</span>
                </span>
                <button
                  type="button"
                  onClick={() => onSelectLayerOnMap(item.key)}
                  className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                    isCurrentMapLayer
                      ? 'bg-emerald-700 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-emerald-600 hover:text-white'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>
                    {isCurrentMapLayer
                      ? isAr
                        ? 'معروض على الخريطة'
                        : 'Active on Map'
                      : isAr
                      ? 'اعرض على الخريطة'
                      : 'View on Map'}
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
