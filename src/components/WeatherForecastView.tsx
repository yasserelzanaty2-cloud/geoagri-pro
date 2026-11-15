import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Bug,
  Calendar,
  Check,
  CheckCircle2,
  CloudRain,
  Download,
  Droplets,
  Flame,
  Microscope,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Snowflake,
  Sparkles,
  Sprout,
  Sun,
  Wind,
} from 'lucide-react';
import {
  AreaBreakdown,
  DailyWeatherPoint,
  GrowthStageInfo,
  Language,
  LatLon,
  SeasonalMonthPrediction,
  SmartWeatherAlert,
  SoilProfile,
  SpectralIndexKey,
  SubZoneSummary,
} from '../types/agro';
import {
  CROP_DATABASE,
  calculateGrowthStageAndGDD,
  getCropPhenologyStageDefs,
  evaluateWeatherPestAndDiseaseAlertSystem,
} from '../utils/agroEngine';
import {
  EXPORTABLE_SPECTRAL_METRICS_META,
  ExportableSpectralMetricKey,
  buildWeatherForecastCsv,
  downloadCsvFile,
} from '../utils/csvExport';

interface WeatherForecastViewProps {
  language: Language;
  centroid: LatLon;
  area: AreaBreakdown;
  soil: SoilProfile;
  forecast14: DailyWeatherPoint[];
  seasonal6Months: SeasonalMonthPrediction[];
  alerts: SmartWeatherAlert[];
  weatherSource: 'open-meteo-live' | 'agro-simulation-fallback';
  nasaSource: 'nasa-power-live' | 'nasa-power-calibrated-cache';
  isRefreshing: boolean;
  onRefreshWeather: () => void;
  farmAverages?: Record<SpectralIndexKey, number>;
  subZones?: SubZoneSummary[];
  growthStage?: GrowthStageInfo;
  currentCropId?: string;
  customCropLabel?: string;
  onConsultAgronomistWithPrompt?: (prompt: string) => void;
}

export const WeatherForecastView: React.FC<WeatherForecastViewProps> = ({
  language,
  centroid,
  area,
  soil,
  forecast14,
  seasonal6Months,
  alerts,
  weatherSource,
  nasaSource,
  isRefreshing,
  onRefreshWeather,
  farmAverages,
  subZones,
  growthStage,
  currentCropId = 'wheat',
  customCropLabel,
  onConsultAgronomistWithPrompt,
}) => {
  const isAr = language === 'ar';
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [pestCategoryFilter, setPestCategoryFilter] = useState<'all' | 'fungal' | 'insect'>('all');
  const [stageOverrideKey, setStageOverrideKey] = useState<
    'auto' | GrowthStageInfo['stageKey']
  >('auto');
  const [completedScoutingIds, setCompletedScoutingIds] = useState<string[]>([]);

  const effectiveGrowthStage = useMemo<GrowthStageInfo>(() => {
    const baseStage =
      growthStage ||
      calculateGrowthStageAndGDD(currentCropId, '2026-09-15', farmAverages?.NDVI ?? 0.62);
    if (stageOverrideKey === 'auto') return baseStage;
    const cropStages = getCropPhenologyStageDefs(currentCropId);
    const matchedIdx = cropStages.findIndex((s) => s.key === stageOverrideKey);
    const matched = cropStages[matchedIdx >= 0 ? matchedIdx : 0];
    return {
      ...baseStage,
      stageIndex: matchedIdx >= 0 ? matchedIdx : 0,
      stageKey: stageOverrideKey,
      stageNameAr: matched.nameAr,
      stageNameEn: matched.nameEn,
      cropCoefficientKc: matched.kc,
      completionPct: matched.pctThreshold,
    };
  }, [growthStage, currentCropId, farmAverages, stageOverrideKey]);

  const pestAlertSystem = useMemo(
    () =>
      evaluateWeatherPestAndDiseaseAlertSystem(
        forecast14,
        effectiveGrowthStage,
        currentCropId,
        centroid,
        soil,
        farmAverages,
        subZones
      ),
    [forecast14, effectiveGrowthStage, currentCropId, centroid, soil, farmAverages, subZones]
  );

  const filteredPestAlerts = useMemo(
    () =>
      pestAlertSystem.alerts.filter((al) =>
        pestCategoryFilter === 'all' ? true : al.pestType === pestCategoryFilter
      ),
    [pestAlertSystem.alerts, pestCategoryFilter]
  );

  const activeCropObj =
    CROP_DATABASE.find((c) => c.id === currentCropId) || CROP_DATABASE[0];
  const displayCropName = customCropLabel
    ? customCropLabel
    : isAr
    ? activeCropObj.nameAr
    : activeCropObj.nameEn;

  const toggleChecklistAction = (actionKey: string) => {
    setCompletedScoutingIds((prev) =>
      prev.includes(actionKey) ? prev.filter((k) => k !== actionKey) : [...prev, actionKey]
    );
  };
  const [csvExported, setCsvExported] = useState(false);
  const [showCsvOptions, setShowCsvOptions] = useState(false);
  const [csvStartDate, setCsvStartDate] = useState<string>(() => forecast14[0]?.date || '');
  const [csvEndDate, setCsvEndDate] = useState<string>(
    () => forecast14[forecast14.length - 1]?.date || ''
  );
  const [selectedCsvMetrics, setSelectedCsvMetrics] = useState<ExportableSpectralMetricKey[]>([
    'NDVI',
    'LST',
    'SM_0_7',
    'SM_7_28',
  ]);
  const exportTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (forecast14.length > 0) {
      setCsvStartDate((prev) =>
        prev && forecast14.some((d) => d.date === prev) ? prev : forecast14[0].date
      );
      setCsvEndDate((prev) =>
        prev && forecast14.some((d) => d.date === prev)
          ? prev
          : forecast14[forecast14.length - 1].date
      );
    }
  }, [forecast14]);

  useEffect(() => {
    return () => {
      if (exportTimerRef.current) clearTimeout(exportTimerRef.current);
    };
  }, []);

  const toggleCsvMetric = (metric: ExportableSpectralMetricKey) => {
    setSelectedCsvMetrics((prev) =>
      prev.includes(metric) ? prev.filter((m) => m !== metric) : [...prev, metric]
    );
  };

  const handleExportWeatherCsv = () => {
    const csv = buildWeatherForecastCsv({
      language,
      centroid,
      area,
      soil,
      forecast14,
      seasonal6Months,
      exportOptions: {
        startDateISO: csvStartDate,
        endDateISO: csvEndDate,
        selectedMetrics: selectedCsvMetrics,
        farmAverages,
        subZones,
      },
    });
    const stamp = csvStartDate || forecast14[0]?.date || new Date().toISOString().slice(0, 10);
    downloadCsvFile(`agro-weather-forecast-${stamp}.csv`, csv);
    setCsvExported(true);
    if (exportTimerRef.current) clearTimeout(exportTimerRef.current);
    exportTimerRef.current = setTimeout(() => setCsvExported(false), 2400);
  };

  const selectedDay = forecast14[selectedDayIdx] || forecast14[0];
  const total14dRainMm = Number(
    forecast14.reduce((acc, d) => acc + d.precipMm, 0).toFixed(1)
  );
  const total14dEt0Mm = Number(
    forecast14.reduce((acc, d) => acc + d.et0Mm, 0).toFixed(1)
  );
  const net14dIrrigationM3PerFeddan = Math.max(
    0,
    Math.round((total14dEt0Mm * 0.9 - total14dRainMm * 0.8) * 4.2)
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
              {isAr
                ? '03. التنبؤ بالأمطار والمناخ الزراعي (Open-Meteo + NASA POWER Climatology)'
                : '03. Predictive Rainfall & Agro-Weather Engine'}
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {isAr
                ? 'التنبؤ الدقيق بالأمطار والميزان المائي وجدولة الري'
                : 'Precision Rainfall Forecast, ET₀ Balance & Irrigation Scheduler'}
            </h2>
            <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1">
              {isAr ? 'إحداثيات الرصد الجوي:' : 'Centroid Coordinates:'} {centroid.lat.toFixed(4)}°N,{' '}
              {centroid.lng.toFixed(4)}°E ·{' '}
              {weatherSource === 'open-meteo-live'
                ? isAr
                  ? 'اتصال مباشر بـ Open-Meteo'
                  : 'Open-Meteo Live Feed'
                : isAr
                ? 'نموذج مناخي معاير'
                : 'Calibrated Synoptic Model'}{' '}
              ·{' '}
              {nasaSource === 'nasa-power-live'
                ? 'NASA POWER Live'
                : 'NASA POWER Agro-Archive'}
            </p>

            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-100 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
                🛰️ NASA POWER (Agroclimatology)
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                🌧️ NASA GPM IMERG (0.1° Rain)
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                💧 NASA SMAP (9km Soil Moisture)
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 dark:indigo-950/70 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
                🌍 ECMWF ERA5-Land Reanalysis
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              type="button"
              data-testid="weather-csv-options-toggle"
              onClick={() => setShowCsvOptions((prev) => !prev)}
              className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                showCsvOptions
                  ? 'bg-emerald-700 text-white border-emerald-700'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{isAr ? 'خيارات CSV (التاريخ والمؤشرات)' : 'CSV Filters & Metrics'}</span>
            </button>

            <button
              type="button"
              data-testid="weather-export-csv-btn"
              onClick={handleExportWeatherCsv}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              {csvExported ? (
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>
                {csvExported
                  ? isAr
                    ? 'تم التصدير (CSV)'
                    : 'Exported CSV'
                  : isAr
                  ? 'تصدير CSV للتحليل'
                  : 'Export CSV'}
              </span>
            </button>

            <button
              type="button"
              onClick={onRefreshWeather}
              disabled={isRefreshing}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-900 dark:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isAr ? 'تحديث بيانات الطقس الحية' : 'Sync Live Weather API'}</span>
            </button>
          </div>
        </div>

        {/* Granular CSV Export Customizer Panel (Date Range + Spectral Metrics NDVI, LST, Soil Moisture) */}
        {showCsvOptions && (
          <div
            data-testid="weather-csv-options-panel"
            className="mt-4 p-4 rounded-xl bg-emerald-50/50 dark:bg-slate-800/70 border border-emerald-200 dark:border-slate-700 space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/70 dark:border-slate-700 pb-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 dark:text-emerald-300">
                <Calendar className="w-4 h-4" />
                <span>
                  {isAr
                    ? 'تخصيص تقرير CSV قبل التحميل: النطاق الزمني والمؤشرات الطيفية (NDVI · LST · رطوبة التربة)'
                    : 'Granular CSV Report Configuration: Date Window & Spectral Metrics (NDVI · LST · Soil Moisture)'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    if (forecast14.length > 0) {
                      setCsvStartDate(forecast14[0].date);
                      setCsvEndDate(forecast14[Math.min(6, forecast14.length - 1)].date);
                    }
                  }}
                  className="px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300 hover:border-emerald-500 cursor-pointer"
                >
                  {isAr ? 'أول 7 أيام' : 'First 7 Days'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (forecast14.length > 0) {
                      setCsvStartDate(forecast14[0].date);
                      setCsvEndDate(forecast14[forecast14.length - 1].date);
                    }
                  }}
                  className="px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300 hover:border-emerald-500 cursor-pointer"
                >
                  {isAr ? 'كامل الـ 14 يوماً' : 'Full 14 Days'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Date Range Selectors */}
              <div className="lg:col-span-4 grid grid-cols-2 gap-2.5">
                <div>
                  <label
                    htmlFor="weather-csv-start-date"
                    className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    {isAr ? 'من تاريخ (Start Date):' : 'Start Date:'}
                  </label>
                  <select
                    id="weather-csv-start-date"
                    data-testid="weather-csv-start-date"
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
                    {forecast14.map((d) => (
                      <option key={d.date} value={d.date}>
                        {d.date} ({isAr ? d.dayLabelAr : d.dayLabelEn})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="weather-csv-end-date"
                    className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    {isAr ? 'إلى تاريخ (End Date):' : 'End Date:'}
                  </label>
                  <select
                    id="weather-csv-end-date"
                    data-testid="weather-csv-end-date"
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
                    {forecast14.map((d) => (
                      <option key={d.date} value={d.date}>
                        {d.date} ({isAr ? d.dayLabelAr : d.dayLabelEn})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Spectral & Biophysical Metrics Checkboxes */}
              <div className="lg:col-span-8 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    {isAr
                      ? 'المؤشرات الطيفية والفيزيائية المضمنة في التقرير (NDVI, LST, Soil Moisture):'
                      : 'Included Spectral & Biophysical Metrics (NDVI, LST, Soil Moisture):'}
                  </span>
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setSelectedCsvMetrics(['NDVI', 'LST', 'SM_0_7', 'SM_7_28'])}
                      className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline cursor-pointer"
                    >
                      {isAr ? 'الأساسية (NDVI+LST+الرطوبة)' : 'Core (NDVI+LST+Moisture)'}
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedCsvMetrics(EXPORTABLE_SPECTRAL_METRICS_META.map((m) => m.key))
                      }
                      className="text-sky-700 dark:text-sky-400 font-semibold hover:underline cursor-pointer"
                    >
                      {isAr ? 'تحديد الكل (10)' : 'Select All (10)'}
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
                        data-testid={`weather-csv-metric-${meta.key}`}
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

        {/* Summary KPI Strip */}
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {isAr ? 'إجمالي أمطار 14 يوماً' : '14-Day Cumulative Rain'}
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono tabular-nums text-sky-600 dark:text-sky-400">
                {total14dRainMm}
              </span>
              <span className="text-xs font-mono text-slate-500">mm</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {isAr ? 'البخر-نتح المرجعي (14 يوم ET₀)' : '14-Day Reference ET₀'}
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400">
                {total14dEt0Mm}
              </span>
              <span className="text-xs font-mono text-slate-500">mm</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {isAr ? 'صافي الري المطلوب (14 يوم)' : 'Net Irrigation (14d)'}
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                {net14dIrrigationM3PerFeddan}
              </span>
              <span className="text-xs font-mono text-slate-500">
                {isAr ? 'م³/فدان' : 'm³/fed'}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {isAr ? 'رطوبة الجذور الحالية (7-28 سم)' : 'Root Moisture (7-28cm)'}
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                {selectedDay?.soilMoisture7to28Pct ?? 29}%
              </span>
              <span className="text-xs font-mono text-slate-500">
                (0-7cm: {selectedDay?.soilMoisture0to7Pct ?? 25}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Smart Rainfall Action Alerts */}
      <div className="space-y-3">
        {alerts.map((al) => {
          const isWarn = al.severity === 'warning' || al.severity === 'critical';
          return (
            <div
              key={al.id}
              className={`p-4 rounded-2xl border ${
                isWarn
                  ? 'bg-amber-50/90 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
                  : 'bg-emerald-50/90 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle
                    className={`w-5 h-5 shrink-0 ${
                      isWarn ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600'
                    }`}
                  />
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    {isAr ? al.titleAr : al.titleEn}
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                  {al.metricBadge}
                </span>
              </div>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                {isAr ? al.messageAr : al.messageEn}
              </p>
            </div>
          );
        })}
      </div>

      {/* Proactive Pest & Disease Risk Alert System (Weather + Crop Growth Stage + Regional Outbreak History) */}
      <div
        data-testid="weather-pest-disease-alert-system"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-5"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="p-1.5 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400">
                <ShieldAlert className="w-4 h-4" />
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {isAr
                  ? 'منظومة الإنذار المبكر لمخاطر الآفات والأمراض النباتية'
                  : 'Proactive Pest & Disease Risk Alert System'}
              </h3>
              <span
                data-testid="pest-overall-risk-badge"
                className={`px-2.5 py-0.5 rounded-md text-xs font-mono font-bold tabular-nums ${
                  pestAlertSystem.overallRiskLevel === 'critical' ||
                  pestAlertSystem.overallRiskLevel === 'high'
                    ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                    : pestAlertSystem.overallRiskLevel === 'moderate'
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {pestAlertSystem.overallRiskLevel === 'critical' ||
                pestAlertSystem.overallRiskLevel === 'high'
                  ? isAr
                    ? `خطر مرتفع (${pestAlertSystem.alerts[0]?.riskScorePct ?? 78}%)`
                    : `High Risk (${pestAlertSystem.alerts[0]?.riskScorePct ?? 78}%)`
                  : pestAlertSystem.overallRiskLevel === 'moderate'
                  ? isAr
                    ? `خطر متوسط (${pestAlertSystem.alerts[0]?.riskScorePct ?? 58}%)`
                    : `Moderate Risk (${pestAlertSystem.alerts[0]?.riskScorePct ?? 58}%)`
                  : isAr
                  ? `خطر منخفض (${pestAlertSystem.alerts[0]?.riskScorePct ?? 35}%)`
                  : `Low Risk (${pestAlertSystem.alerts[0]?.riskScorePct ?? 35}%)`}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAr
                ? 'تحليل ثلاثي يدمج الأرصاد الجوية الحية (الحرارة، الرطوبة النسبية، الأمطار، بلل الأوراق) مع مرحلة نمو المحصول وسجل التفشي الإقليمي'
                : 'Tri-factor engine combining live weather (temp, RH%, rainfall, leaf wetness), crop growth stage susceptibility, and regional outbreak history'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Growth Stage Inspector / Override */}
            <div className="flex items-center gap-1.5">
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                {isAr ? 'مرحلة النمو:' : 'Growth Stage:'}
              </label>
              <select
                data-testid="pest-stage-override-select"
                value={stageOverrideKey}
                onChange={(e) =>
                  setStageOverrideKey(
                    e.target.value as 'auto' | GrowthStageInfo['stageKey']
                  )
                }
                className="h-8 px-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <option value="auto">
                  {isAr ? 'تلقائي (حسب GDD و NDVI)' : 'Auto (GDD & NDVI Synced)'}
                </option>
                {getCropPhenologyStageDefs(currentCropId).map((st) => (
                  <option key={st.key} value={st.key}>
                    {isAr ? st.nameAr : st.nameEn}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter Buttons */}
            <div className="inline-flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-1 gap-1">
              {(
                [
                  { id: 'all', ar: 'الكل', en: 'All Threats' },
                  { id: 'fungal', ar: 'أمراض فطرية', en: 'Fungal Diseases' },
                  { id: 'insect', ar: 'آفات حشرية', en: 'Insect Pests' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  data-testid={`pest-alert-filter-${f.id}`}
                  onClick={() => setPestCategoryFilter(f.id)}
                  className={`min-h-[32px] px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    pestCategoryFilter === f.id
                      ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {isAr ? f.ar : f.en}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tri-Factor Diagnostic Summary Strip (Weather + Crop Stage + Regional Outbreak Archive) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Factor 1: Live Microclimate Triggers */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
              <span className="flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-sky-500" />
                {isAr ? '1. محفزات الطقس والمناخ الدقيق' : '1. Microclimate Weather Triggers'}
              </span>
              <span className="font-mono text-[11px] text-sky-600 dark:text-sky-400">7-Day Window</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5 font-mono text-xs tabular-nums text-center">
              <div className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800">
                <div className="text-[10px] font-sans text-slate-500">
                  {isAr ? 'الحرارة' : 'Temp'}
                </div>
                <div className="font-bold text-slate-900 dark:text-white">
                  {pestAlertSystem.meanTemp7dC}°C
                </div>
              </div>
              <div className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800">
                <div className="text-[10px] font-sans text-slate-500">
                  {isAr ? 'الرطوبة' : 'RH%'}
                </div>
                <div className="font-bold text-sky-600 dark:text-sky-400">
                  {pestAlertSystem.meanHumidity7dPct}%
                </div>
              </div>
              <div className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800">
                <div className="text-[10px] font-sans text-slate-500">
                  {isAr ? 'أمطار 7d' : '7d Rain'}
                </div>
                <div className="font-bold text-indigo-600 dark:text-indigo-400">
                  {pestAlertSystem.totalRainfall7dMm}mm
                </div>
              </div>
              <div className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800">
                <div className="text-[10px] font-sans text-slate-500">
                  {isAr ? 'بلل الورقة' : 'Wetness'}
                </div>
                <div className="font-bold text-amber-600 dark:text-amber-400">
                  {pestAlertSystem.estimatedLeafWetnessHours}h/d
                </div>
              </div>
            </div>
          </div>

          {/* Factor 2: Crop Growth Stage Vulnerability */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
              <span className="flex items-center gap-1.5">
                <Sprout className="w-4 h-4 text-emerald-500" />
                {isAr ? '2. حساسية مرحلة نمو المحصول' : '2. Crop Stage Susceptibility'}
              </span>
              <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
                Kc {effectiveGrowthStage.cropCoefficientKc} · {effectiveGrowthStage.completionPct}%
              </span>
            </div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              {displayCropName} —{' '}
              <span className="text-emerald-700 dark:text-emerald-400">
                {isAr ? effectiveGrowthStage.stageNameAr : effectiveGrowthStage.stageNameEn}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${effectiveGrowthStage.completionPct}%` }}
              />
            </div>
          </div>

          {/* Factor 3: Regional Outbreak Context & Safe Spray Window */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
              <span className="flex items-center gap-1.5">
                <Microscope className="w-4 h-4 text-amber-500" />
                {isAr ? '3. السجل الوبائي الإقليمي' : '3. Regional Outbreak History'}
              </span>
              <span className="font-mono text-[10px] text-slate-500 tabular-nums">
                {centroid.lat.toFixed(2)}°N, {centroid.lng.toFixed(2)}°E
              </span>
            </div>
            <div className="text-xs font-bold text-amber-700 dark:text-amber-400">
              {isAr ? pestAlertSystem.regionNameAr : pestAlertSystem.regionNameEn}
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
              {isAr
                ? `أقرب نافذة رش آمنة: ${pestAlertSystem.nextSafeSprayDayAr}`
                : `Next Safe Spray Window: ${pestAlertSystem.nextSafeSprayDayEn}`}
            </p>
          </div>
        </div>

        {/* Proactive Pest & Disease Alert Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredPestAlerts.map((alert) => {
            const isHigh = alert.riskLevel === 'critical' || alert.riskLevel === 'high';
            const isMod = alert.riskLevel === 'moderate';
            const isFungal = alert.pestType === 'fungal';
            return (
              <div
                key={alert.id}
                data-testid={`weather-pest-alert-card-${alert.id}`}
                className={`rounded-2xl p-4 border flex flex-col justify-between space-y-3.5 transition-all ${
                  isHigh
                    ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800/80'
                    : isMod
                    ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/80'
                    : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="space-y-3">
                  {/* Alert Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            isFungal
                              ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300'
                              : 'bg-orange-500/15 text-orange-700 dark:text-orange-300'
                          }`}
                        >
                          {isFungal ? (
                            <Microscope className="w-3 h-3" />
                          ) : (
                            <Bug className="w-3 h-3" />
                          )}
                          {isFungal
                            ? isAr
                              ? 'مرض فطري'
                              : 'Fungal Pathogen'
                            : isAr
                            ? 'آفة حشرية'
                            : 'Insect Pest'}
                        </span>
                        <span className="text-[11px] font-mono italic text-slate-500 dark:text-slate-400">
                          {alert.scientificName}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">
                        {isAr ? alert.pestNameAr : alert.pestNameEn}
                      </h4>
                    </div>

                    <div className="text-end shrink-0">
                      <div
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl font-mono text-sm font-bold tabular-nums ${
                          isHigh
                            ? 'bg-rose-600 text-white'
                            : isMod
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-emerald-600 text-white'
                        }`}
                      >
                        {alert.riskScorePct}%
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                        {isAr
                          ? `نقاط معرضة: ${alert.vulnerableSubZones.join(', ')}`
                          : `Zones: ${alert.vulnerableSubZones.join(', ')}`}
                      </div>
                    </div>
                  </div>

                  {/* Tri-Factor Breakdown Box */}
                  <div className="p-3 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
                    <div>
                      <span className="font-bold text-sky-700 dark:text-sky-400">
                        {isAr ? 'محفز الطقس الحالي: ' : 'Weather Trigger: '}
                      </span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {isAr ? alert.weatherConditionSummaryAr : alert.weatherConditionSummaryEn}
                      </span>
                    </div>
                    <div>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">
                        {isAr ? 'ارتباط مرحلة النمو: ' : 'Growth Stage Factor: '}
                      </span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {isAr ? alert.growthStageVulnerabilityAr : alert.growthStageVulnerabilityEn}
                      </span>
                    </div>
                    <div>
                      <span className="font-bold text-amber-700 dark:text-amber-400">
                        {isAr ? 'سجل التفشي الإقليمي: ' : 'Regional Outbreak Record: '}
                      </span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {isAr ? alert.regionalHistoryContextAr : alert.regionalHistoryContextEn}
                      </span>
                    </div>
                  </div>

                  {/* Interactive Scouting Actions & Preventative Measures */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 space-y-1.5">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>
                          {isAr ? 'إجراءات الفحص الميداني (Scouting)' : 'Field Scouting Actions'}
                        </span>
                      </div>
                      <ul className="space-y-1 text-[11px] text-slate-700 dark:text-slate-300">
                        {(isAr ? alert.scoutingActionsAr : alert.scoutingActionsEn).map(
                          (act, idx) => {
                            const key = `${alert.id}-scout-${idx}`;
                            const done = completedScoutingIds.includes(key);
                            return (
                              <li key={key}>
                                <button
                                  type="button"
                                  data-testid={`pest-scout-check-${alert.id}-${idx}`}
                                  onClick={() => toggleChecklistAction(key)}
                                  className={`w-full text-start flex items-start gap-1.5 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer ${
                                    done ? 'line-through opacity-65 text-emerald-600' : ''
                                  }`}
                                >
                                  <span
                                    className={`mt-0.5 w-3.5 h-3.5 rounded border shrink-0 flex items-center justify-center text-[9px] ${
                                      done
                                        ? 'bg-emerald-600 border-emerald-600 text-white'
                                        : 'border-slate-400'
                                    }`}
                                  >
                                    {done ? '✓' : ''}
                                  </span>
                                  <span>{act}</span>
                                </button>
                              </li>
                            );
                          }
                        )}
                      </ul>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 space-y-1.5">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>
                          {isAr ? 'التدابير الوقائية الموصى بها' : 'Preventative Measures'}
                        </span>
                      </div>
                      <ul className="space-y-1 text-[11px] text-slate-700 dark:text-slate-300">
                        {(isAr ? alert.preventativeMeasuresAr : alert.preventativeMeasuresEn).map(
                          (meas, idx) => {
                            const key = `${alert.id}-prev-${idx}`;
                            const done = completedScoutingIds.includes(key);
                            return (
                              <li key={key}>
                                <button
                                  type="button"
                                  data-testid={`pest-prevent-check-${alert.id}-${idx}`}
                                  onClick={() => toggleChecklistAction(key)}
                                  className={`w-full text-start flex items-start gap-1.5 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer ${
                                    done ? 'line-through opacity-65 text-emerald-600' : ''
                                  }`}
                                >
                                  <span
                                    className={`mt-0.5 w-3.5 h-3.5 rounded border shrink-0 flex items-center justify-center text-[9px] ${
                                      done
                                        ? 'bg-emerald-600 border-emerald-600 text-white'
                                        : 'border-slate-400'
                                    }`}
                                  >
                                    {done ? '✓' : ''}
                                  </span>
                                  <span>{meas}</span>
                                </button>
                              </li>
                            );
                          }
                        )}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Safe Spray Window & AI Consult Footer */}
                <div className="pt-2.5 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <Wind className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {isAr ? alert.safeSprayWindowAr : alert.safeSprayWindowEn}
                    </span>
                  </div>

                  {onConsultAgronomistWithPrompt && (
                    <button
                      type="button"
                      data-testid={`pest-consult-ai-btn-${alert.id}`}
                      onClick={() =>
                        onConsultAgronomistWithPrompt(
                          isAr ? alert.advisorPromptAr : alert.advisorPromptEn
                        )
                      }
                      className="min-h-[34px] px-3 py-1 rounded-lg bg-slate-900 dark:bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isAr ? 'استشر الخبير الذكي' : 'Ask AI Agronomist'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 14-Day Precision Rainfall & ET0 Daily Selector */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {isAr
                ? 'التوقعات اليومية الدقيقة لمدة 14 يوماً (الأمطار · الحرارة · البخر-نتح · أمان الرش)'
                : '14-Day Daily Precision Forecast (Rain Prob, mm, ET₀ & Spray Safety)'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAr
                ? 'اضغط على أي يوم لعرض تفاصيل رطوبة التربة وسرعة الرياح ومأمونية رش المبيدات'
                : 'Tap any day card to inspect hourly soil moisture, wind speed, and spraying window'}
            </p>
          </div>
        </div>

        {/* Horizontal Day Scroller */}
        <div className="flex items-stretch gap-2.5 overflow-x-auto no-scrollbar pb-2">
          {forecast14.map((d, idx) => {
            const active = idx === selectedDayIdx;
            const hasRain = d.precipMm >= 1.0 || d.precipProbPct >= 50;
            return (
              <button
                key={d.date}
                type="button"
                onClick={() => setSelectedDayIdx(idx)}
                className={`min-w-[112px] p-3 rounded-xl border text-start transition-colors shrink-0 cursor-pointer ${
                  active
                    ? 'bg-slate-900 dark:bg-emerald-800 text-white border-slate-900 dark:border-emerald-600'
                    : 'bg-slate-50 dark:bg-slate-800/70 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="text-xs font-bold truncate">
                  {isAr ? d.dayLabelAr : d.dayLabelEn}
                </div>
                <div className="text-[11px] font-mono opacity-75">{d.date.slice(5)}</div>

                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm font-mono font-bold">
                    {d.tempMaxC}° / {d.tempMinC}°
                  </span>
                  {hasRain ? (
                    <CloudRain className="w-4 h-4 text-sky-400 shrink-0" />
                  ) : (
                    <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                </div>

                <div className="mt-1.5 flex items-center justify-between text-[11px] font-mono">
                  <span className={hasRain ? 'text-sky-400 font-bold' : 'opacity-75'}>
                    {d.precipMm} mm ({d.precipProbPct}%)
                  </span>
                </div>
                <div className="mt-0.5 text-[10px] font-mono opacity-75">
                  ET₀: {d.et0Mm} mm
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Day Detailed Telemetry Bar */}
        {selectedDay && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">
                {isAr ? 'اليوم المحدد' : 'Selected Day'}
              </span>
              <span className="font-bold text-slate-900 dark:text-white">
                {isAr ? selectedDay.dayLabelAr : selectedDay.dayLabelEn} ({selectedDay.date})
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">
                {isAr ? 'كمية واحتمال المطر' : 'Rainfall & Prob'}
              </span>
              <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                {selectedDay.precipMm} mm ({selectedDay.precipProbPct}%)
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">
                {isAr ? 'البخر-نتح FAO ET₀' : 'FAO Penman ET₀'}
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {selectedDay.et0Mm} mm/day ({Math.round(selectedDay.et0Mm * 4.2)}{' '}
                {isAr ? 'م³/فدان' : 'm³/fed'})
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">
                {isAr ? 'الرياح والرطوبة النسبية' : 'Wind & Humidity'}
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {selectedDay.windSpeedKmh} km/h · RH {selectedDay.relativeHumidityPct}%
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">
                {isAr ? 'أمان رش المبيدات والورقي' : 'Foliar Spray Safety'}
              </span>
              <span
                className={`font-bold ${
                  selectedDay.sprayingSafe
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {selectedDay.sprayingSafe
                  ? isAr
                    ? '● آمن للرش الصباحي'
                    : '● Safe Spray Window'
                  : isAr
                  ? '✖ غير آمن (رياح/أمطار)'
                  : '✖ Unsafe (Wind/Rain)'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 6-Month Seasonal Predictive Model (NASA POWER + Sinusoidal Harmonic Projection) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {isAr
                ? 'النموذج التنبؤي الموسمي للـ 6 أشهر القادمة (NASA POWER + Harmonic Projection)'
                : '6-Month Seasonal Predictive Model (Rainfall, Frost Nights & Net Water Balance)'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAr
                ? `حساب صافي الاحتياج الإروائي بالمتر المكعب للفدان (مراعيًا كفاءة نظام الري: ${soil.irrigation})`
                : `Calculates net supplemental irrigation in m³/feddan adjusted for ${soil.irrigation} efficiency`}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <th className="py-2.5 px-3 text-start font-semibold">
                  {isAr ? 'الشهر' : 'Month'}
                </th>
                <th className="py-2.5 px-3 text-start font-semibold">
                  {isAr ? 'المطر المتوقع (مم)' : 'Predicted Rain'}
                </th>
                <th className="py-2.5 px-3 text-start font-semibold">
                  {isAr ? 'الحرارة (عظمى/صغرى)' : 'Temp (Max/Min)'}
                </th>
                <th className="py-2.5 px-3 text-start font-semibold">
                  {isAr ? 'ليالي الصقيع / الحر' : 'Frost / Heat'}
                </th>
                <th className="py-2.5 px-3 text-start font-semibold">
                  {isAr ? 'استهلاك المحصول ETc' : 'Crop ETc'}
                </th>
                <th className="py-2.5 px-3 text-start font-semibold">
                  {isAr ? 'الري التكميلي المطلوب' : 'Supplemental Irrigation'}
                </th>
                <th className="py-2.5 px-3 text-start font-semibold">
                  {isAr ? 'التشخيص المناخي' : 'Climatic Window'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {seasonal6Months.map((m) => (
                <tr key={m.monthKey} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-3 font-sans font-bold text-slate-900 dark:text-white whitespace-nowrap">
                    {isAr ? m.monthNameAr : m.monthNameEn}
                  </td>
                  <td className="py-3 px-3 text-sky-600 dark:text-sky-400 font-bold whitespace-nowrap">
                    {m.predictedRainMm} mm{' '}
                    <span className="text-[11px] font-normal text-slate-400">
                      (hist: {m.historicalRainMm})
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    {m.avgTempMaxC}°C / {m.avgTempMinC}°C
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    {m.frostRiskNights > 0 ? (
                      <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                        ❄️ {m.frostRiskNights} {isAr ? 'ليالي صقيع' : 'frost nights'}
                      </span>
                    ) : m.heatwaveDays > 0 ? (
                      <span className="text-rose-600 dark:text-rose-400 font-semibold">
                        ☀️ {m.heatwaveDays} {isAr ? 'أيام حارة' : 'hot days'}
                      </span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {isAr ? 'آمن حرارياً' : 'Nominal'}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    {m.cropEtcMm} mm
                  </td>
                  <td className="py-3 px-3 font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                    {m.supplementalIrrigationM3PerFeddan} {isAr ? 'م³/فدان' : 'm³/fed'}
                    <span className="block text-[10px] font-normal text-slate-400">
                      ({Math.round(m.supplementalIrrigationM3PerFeddan * Math.max(1, area.totalFeddansDecimal)).toLocaleString()}{' '}
                      {isAr ? 'م³ للمزرعة' : 'm³ farm'})
                    </span>
                  </td>
                  <td className="py-3 px-3 font-sans text-slate-600 dark:text-slate-300 min-w-[220px]">
                    {isAr ? m.windowNoteAr : m.windowNoteEn}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
