import {
  AreaBreakdown,
  CropLifecycleGddPoint,
  DailyWeatherPoint,
  FourWeekNpkSchedule,
  GrowthStageInfo,
  Language,
  LatLon,
  ScoredCropRecommendation,
  SeasonalMonthPrediction,
  SoilProfile,
  SubZoneSummary,
  ThirtyDayGddProjectionSummary,
} from '../types/agro';
import {
  CROP_DATABASE,
  calculateThirtyDayGddProjection,
  getCropFamily,
} from './agroEngine';

/**
 * Escapes a single CSV cell according to RFC 4180.
 * Wraps strings containing commas, quotes, CR, or LF in double quotes and doubles internal quotes.
 */
export function escapeCsvCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Serializes headers and rows into an Excel/Google-Sheets friendly CSV string
 * with UTF-8 BOM (\uFEFF) and CRLF line endings.
 */
export function serializeCsvRows(
  headers: string[],
  rows: Array<Array<string | number | boolean | null | undefined>>,
  includeBom = true
): string {
  const lines: string[] = [];
  if (headers.length > 0) {
    lines.push(headers.map(escapeCsvCell).join(','));
  }
  for (const row of rows) {
    lines.push(row.map(escapeCsvCell).join(','));
  }
  const body = lines.join('\r\n');
  return includeBom ? `\uFEFF${body}` : body;
}

/**
 * Triggers a clean browser download of a CSV string using Blob + anchor click.
 */
export function downloadCsvFile(filename: string, csvContent: string): void {
  if (typeof document === 'undefined' || typeof URL === 'undefined') return;
  const safeContent = csvContent.startsWith('\uFEFF') ? csvContent : `\uFEFF${csvContent}`;
  const blob = new Blob([safeContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export type ExportableSpectralMetricKey =
  | 'NDVI'
  | 'LST'
  | 'SM_0_7'
  | 'SM_7_28'
  | 'NDWI'
  | 'SAVI'
  | 'NDMI'
  | 'EVI'
  | 'SOIL_EC'
  | 'SOIL_PH';

export interface ExportableSpectralMetricMeta {
  key: ExportableSpectralMetricKey;
  labelAr: string;
  labelEn: string;
  unit: string;
  category: 'vegetation' | 'thermal' | 'moisture' | 'soil';
}

export const EXPORTABLE_SPECTRAL_METRICS_META: ExportableSpectralMetricMeta[] = [
  {
    key: 'NDVI',
    labelAr: 'مؤشر الغطاء النباتي (NDVI)',
    labelEn: 'Normalized Difference Vegetation Index (NDVI)',
    unit: 'index',
    category: 'vegetation',
  },
  {
    key: 'LST',
    labelAr: 'حرارة سطح التربة والمحصول (LST)',
    labelEn: 'Land Surface Temperature (LST)',
    unit: '°C',
    category: 'thermal',
  },
  {
    key: 'SM_0_7',
    labelAr: 'رطوبة التربة السطحية 0-7 سم (SM 0-7cm)',
    labelEn: 'Surface Soil Moisture 0-7cm',
    unit: '%',
    category: 'moisture',
  },
  {
    key: 'SM_7_28',
    labelAr: 'رطوبة منطقة الجذور 7-28 سم (SM 7-28cm)',
    labelEn: 'Root-Zone Soil Moisture 7-28cm',
    unit: '%',
    category: 'moisture',
  },
  {
    key: 'NDWI',
    labelAr: 'مؤشر المحتوى المائي (NDWI)',
    labelEn: 'Normalized Difference Water Index (NDWI)',
    unit: 'index',
    category: 'moisture',
  },
  {
    key: 'SAVI',
    labelAr: 'مؤشر الغطاء النباتي المعدل للتربة (SAVI)',
    labelEn: 'Soil-Adjusted Vegetation Index (SAVI)',
    unit: 'index',
    category: 'vegetation',
  },
  {
    key: 'NDMI',
    labelAr: 'مؤشر رطوبة المجموع الخضري (NDMI)',
    labelEn: 'Normalized Difference Moisture Index (NDMI)',
    unit: 'index',
    category: 'moisture',
  },
  {
    key: 'EVI',
    labelAr: 'مؤشر الغطاء النباتي المحسن (EVI)',
    labelEn: 'Enhanced Vegetation Index (EVI)',
    unit: 'index',
    category: 'vegetation',
  },
  {
    key: 'SOIL_EC',
    labelAr: 'ملوحة التربة (Soil EC)',
    labelEn: 'Soil Electrical Conductivity (EC)',
    unit: 'dS/m',
    category: 'soil',
  },
  {
    key: 'SOIL_PH',
    labelAr: 'حموضة التربة (Soil pH)',
    labelEn: 'Soil Reaction (pH)',
    unit: 'pH',
    category: 'soil',
  },
];

export type GddLifecyclePhaseFilter =
  | 'all'
  | 'establishment'
  | 'vegetative'
  | 'reproductive'
  | 'ripening'
  | 'custom';

export interface GddLifecyclePhasePresetMeta {
  id: Exclude<GddLifecyclePhaseFilter, 'custom'>;
  minPct: number;
  maxPct: number;
  labelAr: string;
  labelEn: string;
  criticalMaxTempC: number;
  heatSensitivityNoteAr: string;
  heatSensitivityNoteEn: string;
}

export const GDD_LIFECYCLE_PHASE_PRESETS: Record<
  Exclude<GddLifecyclePhaseFilter, 'custom'>,
  GddLifecyclePhasePresetMeta
> = {
  all: {
    id: 'all',
    minPct: 0,
    maxPct: 100,
    labelAr: 'كامل الدورة (0–100%)',
    labelEn: 'Full Lifecycle (0–100%)',
    criticalMaxTempC: 35,
    heatSensitivityNoteAr: 'عرض شامل لتراكم الوحدات الحرارية من البذر حتى الحصاد.',
    heatSensitivityNoteEn: 'Complete thermal time trajectory from sowing to harvest maturity.',
  },
  establishment: {
    id: 'establishment',
    minPct: 0,
    maxPct: 18,
    labelAr: 'الإنبات والتأسيس (0–18%)',
    labelEn: 'Emergence & Establishment (0–18%)',
    criticalMaxTempC: 32,
    heatSensitivityNoteAr: 'نافذة حساسة لرطوبة مرقد البذرة؛ تجنب موجات الحر أو الصقيع المبكر أثناء البزوغ.',
    heatSensitivityNoteEn: 'Seedbed emergence window; sensitive to surface crusting and early thermal shock.',
  },
  vegetative: {
    id: 'vegetative',
    minPct: 15,
    maxPct: 50,
    labelAr: 'النمو الخضري والتفريع (15–50%)',
    labelEn: 'Vegetative Canopy Growth (15–50%)',
    criticalMaxTempC: 34,
    heatSensitivityNoteAr: 'ذروة بناء المساحة الورقية واستجابة المحصول للآزوت؛ الحرارة المعتدلة تسرع التفريع.',
    heatSensitivityNoteEn: 'Peak leaf area expansion and nitrogen uptake; optimal thermal window drives tillering.',
  },
  reproductive: {
    id: 'reproductive',
    minPct: 45,
    maxPct: 85,
    labelAr: 'التزهير والعقد والامتلاء (45–85%)',
    labelEn: 'Reproductive & Flowering (45–85%)',
    criticalMaxTempC: 31,
    heatSensitivityNoteAr: 'أخطر نافذة حساسة للحرارة (التلقيح والإخصاب)؛ تجاوز 31–33°C يسبب تساقط الأزهار وضمور الحبوب.',
    heatSensitivityNoteEn: 'Most heat-sensitive stage (pollination & grain set); >31–33°C risks floral abortion.',
  },
  ripening: {
    id: 'ripening',
    minPct: 80,
    maxPct: 100,
    labelAr: 'النضج الفسيولوجي والحصاد (80–100%)',
    labelEn: 'Ripening & Senescence (80–100%)',
    criticalMaxTempC: 36,
    heatSensitivityNoteAr: 'مرحلة انتقال النشويات وجفاف الحبوب؛ الحرارة الجافة المعتدلة تسرع النضج وتقلل أعفان ما قبل الحصاد.',
    heatSensitivityNoteEn: 'Dry-matter translocation and dry-down; warm dry conditions favor clean harvest.',
  },
};

export interface GranularCsvExportOptions {
  /** Inclusive start date filter in YYYY-MM-DD format */
  startDateISO?: string;
  /** Inclusive end date filter in YYYY-MM-DD format */
  endDateISO?: string;
  /** Subset of spectral & biophysical metrics to export (e.g., ['NDVI', 'LST', 'SM_0_7', 'SM_7_28']) */
  selectedMetrics?: ExportableSpectralMetricKey[];
  /** Optional farm-wide spectral index averages to include in the spectral metrics table */
  farmAverages?: Partial<Record<ExportableSpectralMetricKey, number>>;
  /** Optional spatial sub-zones (A, B, C) for per-zone spectral metric breakdown */
  subZones?: SubZoneSummary[];
  /** Optional GDD lifecycle completion % filter window [minPct, maxPct] */
  gddPhaseRange?: {
    minPct: number;
    maxPct: number;
  };
}

function buildSpectralMetricsCsvSection(
  isAr: boolean,
  soil: SoilProfile,
  selectedMetrics: ExportableSpectralMetricKey[],
  farmAverages?: Partial<Record<ExportableSpectralMetricKey, number>>,
  subZones?: SubZoneSummary[]
): string[] {
  if (!selectedMetrics || selectedMetrics.length === 0) return [];

  const metaList = selectedMetrics
    .map((key) => EXPORTABLE_SPECTRAL_METRICS_META.find((m) => m.key === key))
    .filter((m): m is ExportableSpectralMetricMeta => Boolean(m));

  if (metaList.length === 0) return [];

  const resolveFarmVal = (key: ExportableSpectralMetricKey): number => {
    const raw = farmAverages?.[key];
    if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
    switch (key) {
      case 'NDVI':
        return 0.68;
      case 'LST':
        return 26.8;
      case 'SM_0_7':
        return 28.4;
      case 'SM_7_28':
        return 33.2;
      case 'NDWI':
        return 0.31;
      case 'SAVI':
        return 0.62;
      case 'NDMI':
        return 0.29;
      case 'EVI':
        return 0.59;
      case 'SOIL_EC':
        return soil.salinityEC;
      case 'SOIL_PH':
        return soil.ph;
    }
  };

  const resolveSubZoneVal = (
    sz: SubZoneSummary,
    key: ExportableSpectralMetricKey
  ): number => {
    switch (key) {
      case 'NDVI':
        return sz.ndvi;
      case 'LST':
        return sz.lstCelsius;
      case 'SM_0_7':
        return sz.soilMoisturePct;
      case 'SM_7_28':
        return sz.soilMoistureDeepPct;
      case 'NDWI':
        return sz.ndwi;
      case 'SAVI':
        return sz.savi;
      case 'NDMI':
        return sz.ndmi;
      case 'EVI':
        return sz.evi;
      case 'SOIL_EC':
        return sz.salinityEC;
      case 'SOIL_PH':
        return sz.soilPh;
    }
  };

  const sectionLines: string[] = [];
  sectionLines.push('');
  sectionLines.push(
    escapeCsvCell(
      isAr
        ? `### المؤشرات الطيفية والفيزيائية المختارة (${metaList.map((m) => m.key).join(', ')})`
        : `### Selected Spectral & Biophysical Metrics (${metaList.map((m) => m.key).join(', ')})`
    )
  );

  const headers = [
    isAr ? 'النطاق / الزونا' : 'Zone / Scope',
    isAr ? 'المساحة (فدان)' : 'Area (Feddans)',
    ...metaList.map((m) => `${isAr ? m.labelAr : m.labelEn} [${m.unit}]`),
  ];

  const rows: Array<Array<string | number>> = [
    [
      isAr ? 'متوسط المزرعة الكلي' : 'Whole-Farm Average',
      '-',
      ...metaList.map((m) => resolveFarmVal(m.key)),
    ],
  ];

  if (subZones && subZones.length > 0) {
    for (const sz of subZones) {
      rows.push([
        isAr ? sz.nameAr : sz.nameEn,
        sz.areaFeddans.toFixed(2),
        ...metaList.map((m) => resolveSubZoneVal(sz, m.key)),
      ]);
    }
  }

  sectionLines.push(serializeCsvRows(headers, rows, false));
  return sectionLines;
}

export interface WeatherForecastCsvParams {
  language: Language;
  centroid: LatLon;
  area: AreaBreakdown;
  soil: SoilProfile;
  forecast14: DailyWeatherPoint[];
  seasonal6Months: SeasonalMonthPrediction[];
  exportOptions?: GranularCsvExportOptions;
}

/**
 * Builds a structured multi-section CSV file for the Weather Forecast & Water Balance view:
 * 1) Site & Summary Metadata (filtered by optional date range)
 * 2) Daily Weather, ET0, Soil Moisture & Spray Safety (filtered by startDateISO..endDateISO and selectedMetrics)
 * 3) Selected Spectral & Biophysical Metrics (NDVI, LST, Soil Moisture, etc.) when requested
 * 4) 6-Month Seasonal Climate & Supplemental Irrigation Projection
 */
export function buildWeatherForecastCsv(params: WeatherForecastCsvParams): string {
  const { language, centroid, area, soil, forecast14, seasonal6Months, exportOptions } = params;
  const isAr = language === 'ar';

  const startISO = exportOptions?.startDateISO?.trim() || '';
  const endISO = exportOptions?.endDateISO?.trim() || '';

  const filteredForecast = forecast14.filter((d) => {
    if (startISO && d.date < startISO) return false;
    if (endISO && d.date > endISO) return false;
    return true;
  });

  const activeForecast = filteredForecast.length > 0 ? filteredForecast : forecast14;
  const selectedMetrics = exportOptions?.selectedMetrics;
  const includeSm07 = !selectedMetrics || selectedMetrics.includes('SM_0_7');
  const includeSm728 = !selectedMetrics || selectedMetrics.includes('SM_7_28');
  const includeLstEst = Boolean(selectedMetrics && selectedMetrics.includes('LST'));

  const totalRainMm = Number(activeForecast.reduce((acc, d) => acc + d.precipMm, 0).toFixed(1));
  const totalEt0Mm = Number(activeForecast.reduce((acc, d) => acc + d.et0Mm, 0).toFixed(1));
  const netIrrig = Math.max(0, Math.round((totalEt0Mm * 0.9 - totalRainMm * 0.8) * 4.2));
  const dateRangeLabel =
    activeForecast.length > 0
      ? `${activeForecast[0].date} -> ${activeForecast[activeForecast.length - 1].date}`
      : '14d';

  const lines: string[] = [];

  // Section 0: Metadata
  lines.push(
    serializeCsvRows(
      [
        isAr ? 'القسم' : 'Section',
        isAr ? 'خط العرض' : 'Latitude',
        isAr ? 'خط الطول' : 'Longitude',
        isAr ? 'المساحة (فدان)' : 'Area (Feddans)',
        isAr ? 'نوع التربة' : 'Soil Texture',
        isAr ? 'نظام الري' : 'Irrigation System',
        isAr ? 'النطاق الزمني' : 'Date Window',
        isAr ? 'إجمالي أمطار 14 يوم (مم)' : '14d Cumulative Rain (mm)',
        isAr ? 'إجمالي ET0 14 يوم (مم)' : '14d Reference ET0 (mm)',
        isAr ? 'صافي الري 14 يوم (م³/فدان)' : 'Net 14d Irrigation (m³/fed)',
      ],
      [
        [
          isAr ? 'ملخص النطاق المناخي' : 'Agro-Weather Site Summary',
          centroid.lat.toFixed(5),
          centroid.lng.toFixed(5),
          area.totalFeddansDecimal.toFixed(2),
          soil.texture,
          soil.irrigation,
          dateRangeLabel,
          totalRainMm,
          totalEt0Mm,
          netIrrig,
        ],
      ],
      false
    )
  );

  lines.push('');

  // Section 1: Daily Forecast (filtered by selected date range & metrics)
  lines.push(
    escapeCsvCell(
      isAr
        ? `### التوقعات اليومية الدقيقة لمدة 14 يوماً (${activeForecast.length} يوم: ${dateRangeLabel})`
        : `### 14-Day Daily Precision Forecast (${activeForecast.length}d: ${dateRangeLabel})`
    )
  );

  const dailyHeaders: string[] = [
    isAr ? 'التاريخ' : 'Date',
    isAr ? 'اليوم' : 'Day Label',
    isAr ? 'العظمى (°C)' : 'Temp Max (°C)',
    isAr ? 'الصغرى (°C)' : 'Temp Min (°C)',
    ...(includeLstEst ? [isAr ? 'حرارة سطح التربة LST (°C)' : 'Surface LST (°C)'] : []),
    isAr ? 'المطر (مم)' : 'Precip (mm)',
    isAr ? 'احتمال المطر (%)' : 'Precip Prob (%)',
    isAr ? 'البخر-نتح ET0 (مم)' : 'Reference ET0 (mm)',
    isAr ? 'سرعة الرياح (كم/س)' : 'Wind Speed (km/h)',
    isAr ? 'اتجاه الرياح (°)' : 'Wind Dir (°)',
    isAr ? 'الرطوبة النسبية (%)' : 'Relative Humidity (%)',
    ...(includeSm07 ? [isAr ? 'رطوبة سطحية 0-7سم (%)' : 'Soil Moisture 0-7cm (%)'] : []),
    ...(includeSm728 ? [isAr ? 'رطوبة جذور 7-28سم (%)' : 'Soil Moisture 7-28cm (%)'] : []),
    isAr ? 'الإشعاع الشمسي (MJ/m²)' : 'Solar Radiation (MJ/m²)',
    isAr ? 'مأمونية الرش' : 'Foliar Spray Safe',
  ];

  lines.push(
    serializeCsvRows(
      dailyHeaders,
      activeForecast.map((d) => {
        const estLst = Number(((d.tempMaxC * 0.72 + d.tempMinC * 0.28) + 1.8).toFixed(1));
        return [
          d.date,
          isAr ? d.dayLabelAr : d.dayLabelEn,
          d.tempMaxC,
          d.tempMinC,
          ...(includeLstEst ? [estLst] : []),
          d.precipMm,
          d.precipProbPct,
          d.et0Mm,
          d.windSpeedKmh,
          d.windDirectionDeg,
          d.relativeHumidityPct,
          ...(includeSm07 ? [d.soilMoisture0to7Pct] : []),
          ...(includeSm728 ? [d.soilMoisture7to28Pct] : []),
          d.solarRadiationMjM2 ?? '',
          d.sprayingSafe ? (isAr ? 'آمن' : 'Safe') : isAr ? 'غير آمن' : 'Unsafe',
        ];
      }),
      false
    )
  );

  // Optional Section: Selected Spectral & Biophysical Metrics
  if (selectedMetrics && selectedMetrics.length > 0) {
    lines.push(
      ...buildSpectralMetricsCsvSection(
        isAr,
        soil,
        selectedMetrics,
        exportOptions?.farmAverages,
        exportOptions?.subZones
      )
    );
  }

  lines.push('');

  // Section 2: 6-Month Seasonal Projection
  lines.push(escapeCsvCell(isAr ? '### النموذج التنبؤي الموسمي لـ 6 أشهر' : '### 6-Month Seasonal Climate & Irrigation Projection'));
  lines.push(
    serializeCsvRows(
      [
        isAr ? 'رمز الشهر' : 'Month Key',
        isAr ? 'الشهر' : 'Month',
        isAr ? 'المطر التاريخي (مم)' : 'Historical Rain (mm)',
        isAr ? 'المطر المتوقع (مم)' : 'Predicted Rain (mm)',
        isAr ? 'متوسط العظمى (°C)' : 'Avg Temp Max (°C)',
        isAr ? 'متوسط الصغرى (°C)' : 'Avg Temp Min (°C)',
        isAr ? 'ليالي الصقيع' : 'Frost Risk Nights',
        isAr ? 'أيام موجات الحر' : 'Heatwave Days',
        isAr ? 'استهلاك المحصول ETc (مم)' : 'Crop ETc (mm)',
        isAr ? 'الري التكميلي (م³/فدان)' : 'Supplemental Irrigation (m³/fed)',
        isAr ? 'التشخيص المناخي' : 'Climatic Window Note',
      ],
      seasonal6Months.map((m) => [
        m.monthKey,
        isAr ? m.monthNameAr : m.monthNameEn,
        m.historicalRainMm,
        m.predictedRainMm,
        m.avgTempMaxC,
        m.avgTempMinC,
        m.frostRiskNights,
        m.heatwaveDays,
        m.cropEtcMm,
        m.supplementalIrrigationM3PerFeddan,
        isAr ? m.windowNoteAr : m.windowNoteEn,
      ]),
      false
    )
  );

  return `\uFEFF${lines.join('\r\n')}`;
}

export interface CropLifecycleGddSeriesResult {
  cropId: string;
  cropNameAr: string;
  cropNameEn: string;
  baseTempGDD: number;
  targetTotalGDD: number;
  currentAccumulatedGDD: number;
  currentCompletionPct: number;
  currentStageKey: GrowthStageInfo['stageKey'];
  currentStageNameAr: string;
  currentStageNameEn: string;
  estimatedTotalLifecycleDays: number;
  estimatedCurrentDay: number;
  stageThresholds: ThirtyDayGddProjectionSummary['stageThresholds'];
  lifecyclePoints: CropLifecycleGddPoint[];
  thirtyDaySummary: ThirtyDayGddProjectionSummary;
}

export interface FilteredGddLifecycleWindowResult {
  minPct: number;
  maxPct: number;
  minGddBound: number;
  maxGddBound: number;
  windowGddSpan: number;
  windowDaysSpan: number;
  filteredLifecyclePoints: CropLifecycleGddPoint[];
  filteredThirtyDayPoints: ThirtyDayGddProjectionSummary['dailyPoints'];
  heatSensitiveWindowWarningAr: string;
  heatSensitiveWindowWarningEn: string;
}

/**
 * Filters a crop's GDD lifecycle and 30-day projection series by a specific completion percentage
 * range [minPct, maxPct] (corresponding to lifecycle phases such as vegetative, reproductive, ripening).
 */
export function filterGddLifecyclePointsByRange(
  series: CropLifecycleGddSeriesResult,
  range: { minPct: number; maxPct: number }
): FilteredGddLifecycleWindowResult {
  const rawMin = Number.isFinite(range.minPct) ? range.minPct : 0;
  const rawMax = Number.isFinite(range.maxPct) ? range.maxPct : 100;
  const minPct = Math.max(0, Math.min(95, Math.min(rawMin, rawMax)));
  const maxPct = Math.min(100, Math.max(minPct + 5, Math.max(rawMin, rawMax)));

  const minGddBound = Math.round((minPct / 100) * series.targetTotalGDD);
  const maxGddBound = Math.round((maxPct / 100) * series.targetTotalGDD);
  const windowGddSpan = Math.max(0, maxGddBound - minGddBound);

  const exactLifecycle = series.lifecyclePoints.filter(
    (pt) => pt.completionPct >= minPct - 0.5 && pt.completionPct <= maxPct + 0.5
  );
  const filteredLifecyclePoints =
    exactLifecycle.length >= 2
      ? exactLifecycle
      : series.lifecyclePoints.slice(0, Math.max(2, series.lifecyclePoints.length));

  const windowDaysSpan =
    filteredLifecyclePoints.length >= 2
      ? Math.max(
          1,
          filteredLifecyclePoints[filteredLifecyclePoints.length - 1].dayIndex -
            filteredLifecyclePoints[0].dayIndex
        )
      : Math.round(((maxPct - minPct) / 100) * series.estimatedTotalLifecycleDays);

  const exactThirtyDay = series.thirtyDaySummary.dailyPoints.filter(
    (pt) => pt.completionPct >= minPct - 0.5 && pt.completionPct <= maxPct + 0.5
  );
  const filteredThirtyDayPoints =
    exactThirtyDay.length > 0 ? exactThirtyDay : series.thirtyDaySummary.dailyPoints;

  // Determine heat sensitivity diagnostic based on whether reproductive/flowering window (45-85%) is included
  const overlapsReproductive = minPct <= 75 && maxPct >= 48;
  const overlapsEstablishment = minPct <= 15;

  const heatSensitiveWindowWarningAr = overlapsReproductive
    ? `نافذة حساسة للحرارة (التزهير والعقد ${minGddBound}–${maxGddBound} GDD · ~${windowDaysSpan} يوم): حافظ على رطوبة الجذور وتجنب الإجهاد الحراري فوق 32°C لحماية التلقيح.`
    : overlapsEstablishment
    ? `نافذة التأسيس والإنبات (${minGddBound}–${maxGddBound} GDD · ~${windowDaysSpan} يوم): اضبط موعد الزراعة لتفادي الصقيع أو موجات الحر السطحية.`
    : `النافذة الحرارية المحددة (${minGddBound}–${maxGddBound} GDD · ~${windowDaysSpan} يوم): مثالية لإدارة التسميد والري المرحلي.`;

  const heatSensitiveWindowWarningEn = overlapsReproductive
    ? `Heat-Sensitive Reproductive Window (${minGddBound}–${maxGddBound} GDD · ~${windowDaysSpan}d): Maintain root moisture & avoid >32°C canopy stress to protect pollination.`
    : overlapsEstablishment
    ? `Establishment Window (${minGddBound}–${maxGddBound} GDD · ~${windowDaysSpan}d): Align sowing date to avoid surface heat shock or early frost.`
    : `Selected Thermal Window (${minGddBound}–${maxGddBound} GDD · ~${windowDaysSpan}d): Optimal for stage-targeted fertigation and irrigation scheduling.`;

  return {
    minPct,
    maxPct,
    minGddBound,
    maxGddBound,
    windowGddSpan,
    windowDaysSpan,
    filteredLifecyclePoints,
    filteredThirtyDayPoints,
    heatSensitiveWindowWarningAr,
    heatSensitiveWindowWarningEn,
  };
}

/**
 * Computes a complete thermal-time (Growing Degree Day) trend dataset across
 * both the crop's full sowing-to-harvest lifecycle and the 30-day live weather forecast window.
 */
export function buildCropLifecycleGddSeries(params: {
  cropId: string;
  accumulatedGDD: number;
  forecast14?: DailyWeatherPoint[];
  startDateISO?: string;
}): CropLifecycleGddSeriesResult {
  const crop = CROP_DATABASE.find((c) => c.id === params.cropId) || CROP_DATABASE[0];
  const targetTotalGDD = crop.totalGDDRequired;
  const clampedGdd = Math.max(0, Math.min(targetTotalGDD, Math.round(params.accumulatedGDD)));

  const thirtyDaySummary = calculateThirtyDayGddProjection({
    cropId: crop.id,
    accumulatedGDD: clampedGdd,
    forecast14: params.forecast14,
    startDateISO: params.startDateISO,
  });

  const stageDefs = thirtyDaySummary.stageThresholds;
  const resolveStage = (gdd: number) => {
    const pct = Math.min(100, (gdd / targetTotalGDD) * 100);
    const match = stageDefs.find((s) => pct <= s.pctThreshold) || stageDefs[stageDefs.length - 1];
    return match;
  };

  const [optMin, optMax] = crop.optimalTempRangeC;
  const meanOptimalTemp = (optMin + optMax) / 2;
  const avgDailyBaselineGdd = Math.max(
    4.5,
    thirtyDaySummary.avgDailyGddRate > 0 ? thirtyDaySummary.avgDailyGddRate : meanOptimalTemp - crop.baseTempGDD
  );

  // Typical crop cycle steps (approx. 120–170 days represented in 25 balanced intervals)
  const estimatedTotalLifecycleDays = Math.max(
    60,
    Math.min(260, Math.round(targetTotalGDD / avgDailyBaselineGdd))
  );
  const sampleCount = 25; // Day 0 .. estimatedTotalLifecycleDays
  const lifecyclePoints: CropLifecycleGddPoint[] = [];

  let closestCurrentIdx = 0;
  let minDiff = Infinity;

  for (let i = 0; i <= sampleCount; i++) {
    const progress = i / sampleCount; // 0 .. 1
    // Mild sigmoid seasonal acceleration curve reflecting cooler early/late tails & peak mid-canopy growth
    const curvedProgress =
      progress === 0
        ? 0
        : progress === 1
        ? 1
        : Math.min(1, Math.max(0, 0.85 * progress + 0.15 * (0.5 - 0.5 * Math.cos(Math.PI * progress))));

    const cumulativeGdd = Math.round(curvedProgress * targetTotalGDD);
    const dayIndex = Math.round(progress * estimatedTotalLifecycleDays);
    const stage = resolveStage(cumulativeGdd);
    const completionPct = Number(Math.min(100, (cumulativeGdd / targetTotalGDD) * 100).toFixed(1));

    // Estimate daily thermal gain around this point in the crop cycle
    const seasonalSwingC = Math.sin(progress * Math.PI) * 3.2;
    const tempMeanC = Number((meanOptimalTemp - 1.4 + seasonalSwingC).toFixed(1));
    const stageVigor =
      stage.key === 'flowering'
        ? 1.12
        : stage.key === 'vegetative'
        ? 1.06
        : stage.key === 'fruiting'
        ? 1.0
        : stage.key === 'germination'
        ? 0.92
        : 0.85;
    const dailyGdd =
      i === 0 ? 0 : Number((Math.max(3.5, tempMeanC - crop.baseTempGDD) * stageVigor).toFixed(1));

    const diff = Math.abs(cumulativeGdd - clampedGdd);
    if (diff < minDiff) {
      minDiff = diff;
      closestCurrentIdx = i;
    }

    lifecyclePoints.push({
      dayIndex,
      dayLabelAr: `يوم ${dayIndex}`,
      dayLabelEn: `Day ${dayIndex}`,
      cumulativeGdd,
      dailyGdd,
      tempMeanC,
      completionPct,
      stageKey: stage.key,
      stageNameAr: stage.nameAr,
      stageNameEn: stage.nameEn,
      cropCoefficientKc: stage.kc,
      isCurrentFieldMilestone: false,
      activeFieldGdd: null,
    });
  }

  lifecyclePoints[closestCurrentIdx] = {
    ...lifecyclePoints[closestCurrentIdx],
    isCurrentFieldMilestone: true,
    activeFieldGdd: clampedGdd,
  };

  // Overlay actual field progress up to the current milestone so users see completed vs remaining curve
  for (let i = 0; i <= closestCurrentIdx; i++) {
    lifecyclePoints[i].activeFieldGdd =
      i === closestCurrentIdx ? clampedGdd : lifecyclePoints[i].cumulativeGdd;
  }

  const currentStage = resolveStage(clampedGdd);

  return {
    cropId: crop.id,
    cropNameAr: crop.nameAr,
    cropNameEn: crop.nameEn,
    baseTempGDD: crop.baseTempGDD,
    targetTotalGDD,
    currentAccumulatedGDD: clampedGdd,
    currentCompletionPct: Number(Math.min(100, (clampedGdd / targetTotalGDD) * 100).toFixed(1)),
    currentStageKey: currentStage.key,
    currentStageNameAr: currentStage.nameAr,
    currentStageNameEn: currentStage.nameEn,
    estimatedTotalLifecycleDays,
    estimatedCurrentDay: lifecyclePoints[closestCurrentIdx]?.dayIndex ?? 0,
    stageThresholds: stageDefs,
    lifecyclePoints,
    thirtyDaySummary,
  };
}

export interface CropRecommenderCsvParams {
  language: Language;
  area: AreaBreakdown;
  soil: SoilProfile;
  recommendations: ScoredCropRecommendation[];
  npkSchedule: FourWeekNpkSchedule;
  gddSeries: CropLifecycleGddSeriesResult;
  exportOptions?: GranularCsvExportOptions;
}

/**
 * Builds a structured CSV export for the Crop Recommender & GDD Analysis view:
 * 1) Farm Context & Soil Summary
 * 2) Selected Spectral & Biophysical Metrics (NDVI, LST, Soil Moisture, etc.) when requested
 * 3) Ranked MCDA Crop Recommendations
 * 4) 4-Week NPK Fertigation Schedule for Selected Crop
 * 5) Filtered Lifecycle Phase GDD Window & 30-Day Heat Accumulation Projection (filtered by date range / phase range)
 */
export function buildCropRecommenderCsv(params: CropRecommenderCsvParams): string {
  const { language, area, soil, recommendations, npkSchedule, gddSeries, exportOptions } = params;
  const isAr = language === 'ar';

  const phaseRange = exportOptions?.gddPhaseRange || { minPct: 0, maxPct: 100 };
  const filteredPhaseWindow = filterGddLifecyclePointsByRange(gddSeries, phaseRange);

  const startISO = exportOptions?.startDateISO?.trim() || '';
  const endISO = exportOptions?.endDateISO?.trim() || '';

  const filteredThirtyDay = gddSeries.thirtyDaySummary.dailyPoints.filter((pt) => {
    if (startISO && pt.dateISO < startISO) return false;
    if (endISO && pt.dateISO > endISO) return false;
    return true;
  });
  const activeThirtyDayPoints =
    filteredThirtyDay.length > 0 ? filteredThirtyDay : gddSeries.thirtyDaySummary.dailyPoints;

  const lines: string[] = [];

  // Section 0: Farm Context
  lines.push(
    serializeCsvRows(
      [
        isAr ? 'القسم' : 'Section',
        isAr ? 'المساحة (فدان)' : 'Area (Feddans)',
        isAr ? 'التربة' : 'Soil Texture',
        isAr ? 'الحموضة pH' : 'Soil pH',
        isAr ? 'الملوحة EC (dS/m)' : 'Salinity EC (dS/m)',
        isAr ? 'نظام الري' : 'Irrigation',
        isAr ? 'المحصول النشط للسماد/GDD' : 'Active NPK/GDD Crop',
        isAr ? 'الوحدات الحرارية المتراكمة' : 'Accumulated GDD (°C·d)',
        isAr ? 'الهدف الحراري للنضج' : 'Target Maturity GDD (°C·d)',
        isAr ? 'فلتر المرحلة الحرارية (%)' : 'Filtered GDD Phase Window (%)',
      ],
      [
        [
          isAr ? 'ملخص توصيات المحاصيل والمغذيات' : 'Crop Recommender & GDD Summary',
          area.totalFeddansDecimal.toFixed(2),
          soil.texture,
          soil.ph,
          soil.salinityEC,
          soil.irrigation,
          isAr ? npkSchedule.cropNameAr : npkSchedule.cropNameEn,
          gddSeries.currentAccumulatedGDD,
          gddSeries.targetTotalGDD,
          `${filteredPhaseWindow.minPct}% - ${filteredPhaseWindow.maxPct}% (${filteredPhaseWindow.minGddBound}-${filteredPhaseWindow.maxGddBound} GDD)`,
        ],
      ],
      false
    )
  );

  // Optional Section: Selected Spectral & Biophysical Metrics (NDVI, LST, Soil Moisture, etc.)
  if (exportOptions?.selectedMetrics && exportOptions.selectedMetrics.length > 0) {
    lines.push(
      ...buildSpectralMetricsCsvSection(
        isAr,
        soil,
        exportOptions.selectedMetrics,
        exportOptions.farmAverages,
        exportOptions.subZones
      )
    );
  }

  lines.push('');

  // Section 1: Ranked Crop Suitability Recommendations
  lines.push(escapeCsvCell(isAr ? '### ترتيب المحاصيل الموصى بها (MCDA)' : '### Ranked MCDA Crop Suitability Recommendations'));
  lines.push(
    serializeCsvRows(
      [
        isAr ? 'الترتيب' : 'Rank',
        isAr ? 'كود المحصول' : 'Crop ID',
        isAr ? 'اسم المحصول' : 'Crop Name',
        isAr ? 'العائلة النباتية' : 'Plant Family',
        isAr ? 'الموسم' : 'Season',
        isAr ? 'نسبة الملاءمة (/100)' : 'Suitability Score (/100)',
        isAr ? 'التصنيف التجاري' : 'Grade Rating',
        isAr ? 'الإنتاجية المتوقعة (طن/فدان)' : 'Estimated Yield (t/fed)',
        isAr ? 'إنتاجية المزرعة (طن)' : 'Farm Total Yield (tons)',
        isAr ? 'صافي الري المطلوب (م³/فدان)' : 'Net Irrigation (m³/fed)',
        isAr ? 'الوحدات الحرارية المطلوبة (GDD)' : 'Target GDD Required',
        isAr ? 'صافي الإيراد المقدر (جنيه/فدان)' : 'Est. Revenue (EGP/fed)',
        isAr ? 'موعد الحصاد المتوقع' : 'Expected Harvest',
        isAr ? 'المبرر العلمي' : 'Scientific Justification',
      ],
      recommendations.map((item, idx) => [
        idx + 1,
        item.crop.id,
        isAr ? item.crop.nameAr : item.crop.nameEn,
        getCropFamily(item.crop.id),
        item.crop.season,
        item.suitabilityScore,
        item.gradeLabel,
        item.expectedYieldTonPerFeddan,
        item.totalFarmYieldTons,
        item.netIrrigationRequiredM3PerFeddan,
        item.crop.totalGDDRequired,
        item.estimatedRevenuePerFeddanEgp,
        isAr ? item.expectedHarvestDateAr : item.expectedHarvestDateEn,
        isAr ? item.whyGradeAAr : item.whyGradeAEn,
      ]),
      false
    )
  );

  lines.push('');

  // Section 2: 4-Week NPK Schedule
  lines.push(
    escapeCsvCell(
      isAr
        ? `### جدول التسميد لـ 4 أسابيع (${npkSchedule.cropNameAr})`
        : `### 4-Week NPK Fertigation Schedule (${npkSchedule.cropNameEn})`
    )
  );
  lines.push(
    serializeCsvRows(
      [
        isAr ? 'الأسبوع' : 'Week',
        isAr ? 'المرحلة الفينولوجية' : 'Stage Context',
        isAr ? 'نطاق GDD' : 'GDD Window',
        isAr ? 'نيتروجين N (كجم/فدان)' : 'Pure N (kg/fed)',
        isAr ? 'فوسفور P2O5 (كجم/فدان)' : 'Pure P2O5 (kg/fed)',
        isAr ? 'بوتاسيوم K2O (كجم/فدان)' : 'Pure K2O (kg/fed)',
        isAr ? 'إجمالي N للمزرعة (كجم)' : 'Farm Total N (kg)',
        isAr ? 'إجمالي P2O5 للمزرعة (كجم)' : 'Farm Total P2O5 (kg)',
        isAr ? 'إجمالي K2O للمزرعة (كجم)' : 'Farm Total K2O (kg)',
        isAr ? 'المصدر التجاري المكافئ' : 'Commercial Equivalent Source',
        isAr ? 'طريقة الإضافة' : 'Application Method',
      ],
      npkSchedule.weeks.map((w) => [
        isAr ? w.weekLabelAr : w.weekLabelEn,
        isAr ? w.stageContextAr : w.stageContextEn,
        w.gddWindowLabel,
        w.pureNKgPerFeddan,
        w.pureP2O5KgPerFeddan,
        w.pureK2OKgPerFeddan,
        w.totalFarmNKg,
        w.totalFarmP2O5Kg,
        w.totalFarmK2OKg,
        isAr ? w.commercialSourceAr : w.commercialSourceEn,
        isAr ? w.applicationMethodAr : w.applicationMethodEn,
      ]),
      false
    )
  );

  lines.push('');

  // Section 3: Filtered Lifecycle Phase GDD Curve
  lines.push(
    escapeCsvCell(
      isAr
        ? `### منحنى مراحل النمو الحراري المفلتر (${filteredPhaseWindow.minPct}%–${filteredPhaseWindow.maxPct}% · ${filteredPhaseWindow.minGddBound}–${filteredPhaseWindow.maxGddBound} GDD)`
        : `### Filtered Lifecycle Phase GDD Curve (${filteredPhaseWindow.minPct}%–${filteredPhaseWindow.maxPct}% · ${filteredPhaseWindow.minGddBound}–${filteredPhaseWindow.maxGddBound} GDD)`
    )
  );
  lines.push(
    serializeCsvRows(
      [
        isAr ? 'يوم الدورة' : 'Lifecycle Day',
        isAr ? 'التراكمي (GDD)' : 'Cumulative GDD',
        isAr ? 'الكسب اليومي (GDD)' : 'Daily GDD Gain',
        isAr ? 'متوسط الحرارة (°C)' : 'Mean Temp (°C)',
        isAr ? 'نسبة الاكتمال (%)' : 'Completion (%)',
        isAr ? 'المرحلة الفينولوجية' : 'Phenological Stage',
        isAr ? 'معامل المحصول Kc' : 'Crop Coefficient Kc',
      ],
      filteredPhaseWindow.filteredLifecyclePoints.map((pt) => [
        pt.dayIndex,
        pt.cumulativeGdd,
        pt.dailyGdd,
        pt.tempMeanC,
        pt.completionPct,
        isAr ? pt.stageNameAr : pt.stageNameEn,
        pt.cropCoefficientKc,
      ]),
      false
    )
  );

  lines.push('');

  // Section 4: 30-Day GDD Accumulation Forecast Curve (filtered by date range)
  lines.push(
    escapeCsvCell(
      isAr
        ? `### منحنى تراكم الوحدات الحرارية 30 يوماً (${gddSeries.cropNameAr})`
        : `### 30-Day GDD Heat Accumulation Projection (${gddSeries.cropNameEn})`
    )
  );
  lines.push(
    serializeCsvRows(
      [
        isAr ? 'اليوم' : 'Day Offset',
        isAr ? 'التاريخ' : 'Date',
        isAr ? 'العظمى (°C)' : 'Temp Max (°C)',
        isAr ? 'الصغرى (°C)' : 'Temp Min (°C)',
        isAr ? 'المتوسط (°C)' : 'Temp Mean (°C)',
        isAr ? 'الكسب الحراري اليومي (GDD)' : 'Daily GDD Gain',
        isAr ? 'التراكمي (GDD)' : 'Cumulative GDD',
        isAr ? 'نسبة الاكتمال (%)' : 'Lifecycle Completion (%)',
        isAr ? 'المرحلة الفينولوجية' : 'Phenological Stage',
        isAr ? 'معامل المحصول Kc' : 'Crop Coefficient Kc',
      ],
      activeThirtyDayPoints.map((pt) => [
        pt.dayOffset,
        pt.dateISO,
        pt.tempMaxC,
        pt.tempMinC,
        pt.tempMeanC,
        pt.dailyGdd,
        pt.cumulativeGdd,
        pt.completionPct,
        isAr ? pt.stageNameAr : pt.stageNameEn,
        pt.cropCoefficientKc,
      ]),
      false
    )
  );

  return `\uFEFF${lines.join('\r\n')}`;
}

