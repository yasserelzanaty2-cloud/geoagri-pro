import React, { useState } from 'react';
import {
  Activity,
  Bot,
  CheckCircle2,
  CheckSquare,
  Compass,
  Crosshair,
  Film,
  FlaskConical,
  HelpCircle,
  Image as ImageIcon,
  Info,
  ShieldAlert,
  Sprout,
  Square,
  User,
  Zap,
} from 'lucide-react';
import {
  AdvisorInlineWidgetType,
  AdvisorMessage,
  DailyWeatherPoint,
  Language,
  LatLon,
  ScoredCropRecommendation,
  SpectralIndexKey,
  SubZoneSummary,
  WeeklyChecklistTask,
} from '../types/agro';
import {
  REGIONAL_PEST_CATALOG,
  createLoggedPestIncident,
  derivePestRiskYieldMetrics,
} from '../utils/agroEngine';
import {
  SharedAdvisorChatHandle,
  getSubZoneCoordinates,
} from '../hooks/useAdvisorChat';

function renderInlineFormatting(text: string): React.ReactNode[] {
  // Split on inline code (`...`), bold (**...**), or italic (*...*)
  const tokens = text.split(/(`[^`\n]+`|\*\*[^*\n]+\*\*|\*[^*\n]+\*)/g);
  return tokens.map((token, idx) => {
    if (token.startsWith('`') && token.endsWith('`') && token.length >= 2) {
      return (
        <code
          key={idx}
          dir="ltr"
          className="inline-block px-1.5 py-0.5 mx-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[11px] text-emerald-700 dark:text-emerald-300"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    if (token.startsWith('**') && token.endsWith('**') && token.length >= 4) {
      return (
        <strong key={idx} className="font-bold text-emerald-700 dark:text-emerald-300">
          {token.slice(2, -2)}
        </strong>
      );
    }
    if (token.startsWith('*') && token.endsWith('*') && token.length >= 3) {
      return (
        <em key={idx} className="italic text-slate-700 dark:text-slate-200 font-medium">
          {token.slice(1, -1)}
        </em>
      );
    }
    return <span key={iSafe(idx)}>{token}</span>;
  });
}

function iSafe(idx: number) {
  return idx;
}

export function formatRichMessageLine(line: string, idx: number): React.ReactNode {
  const trimmed = line.trim();
  if (!trimmed) {
    return <div key={idx} className="h-1.5" />;
  }

  // Markdown Headings (#, ##, ###, ####, #####)
  const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
  if (headingMatch) {
    const level = headingMatch[1].length;
    const content = headingMatch[2].replace(/\*\*/g, '');
    return (
      <h4
        key={idx}
        className={`font-bold text-emerald-800 dark:text-emerald-300 mt-3 first:mt-0 mb-1.5 ${
          level <= 2 ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'
        }`}
      >
        {content}
      </h4>
    );
  }

  // Bullet items (* item, - item, • item)
  const bulletMatch = trimmed.match(/^(?:[*•]|-(?!-))\s+(.+)$/);
  if (bulletMatch) {
    return (
      <div key={idx} className="flex items-start gap-2 mb-1.5 last:mb-0 leading-relaxed">
        <span
          aria-hidden="true"
          className="mt-2 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"
        />
        <span className="flex-1 min-w-0">{renderInlineFormatting(bulletMatch[1])}</span>
      </div>
    );
  }

  return (
    <p key={idx} className="mb-1.5 last:mb-0 leading-relaxed">
      {renderInlineFormatting(line)}
    </p>
  );
}

export interface RiskInfoModalPayload {
  riskTitle: string;
  yieldLossWithoutActionPct: number;
  mitigatedRecoveryPct: number;
}

interface AdvisorInlineWidgetsProps {
  widgetType: AdvisorInlineWidgetType;
  msg: AdvisorMessage;
  language: Language;
  hasActiveZones: boolean;
  centroid: LatLon;
  currentCropId: string;
  customCropLabel?: string;
  subZones: SubZoneSummary[];
  forecast14: DailyWeatherPoint[];
  topCrops: ScoredCropRecommendation[];
  checklist: WeeklyChecklistTask[];
  advisorChat: SharedAdvisorChatHandle;
  onToggleChecklistTask: (taskId: string) => void;
  onGoToAtlas?: () => void;
  onSelectLayerOnMap?: (layer: SpectralIndexKey) => void;
  onAdoptCrop?: (cropId: string, customLabel?: string) => void;
  onOpenRiskInfo: (payload: RiskInfoModalPayload) => void;
  onOpenRiskExplainer: (payload: RiskInfoModalPayload) => void;
}

export const AdvisorInlineWidget: React.FC<AdvisorInlineWidgetsProps> = ({
  widgetType,
  msg,
  language,
  hasActiveZones,
  centroid,
  currentCropId,
  customCropLabel,
  subZones,
  forecast14,
  topCrops,
  checklist,
  advisorChat,
  onToggleChecklistTask,
  onGoToAtlas,
  onSelectLayerOnMap,
  onAdoptCrop,
  onOpenRiskInfo,
  onOpenRiskExplainer,
}) => {
  const isAr = language === 'ar';
  const [hoveredInfoKey, setHoveredInfoKey] = useState<string | null>(null);

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
            onOpenRiskInfo(payload);
          }}
          className="p-1 rounded-full text-slate-500 hover:text-emerald-600 hover:bg-white/80 dark:text-slate-400 dark:hover:text-emerald-400 dark:hover:bg-slate-800/80 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer transition-colors"
        >
          <Info className="w-3.5 h-3.5" />
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

  if (widgetType === 'zone_action_card') {
    const createAct = msg.executedActions?.find((a) => a.type === 'CREATE_ZONE');
    const updateAct = msg.executedActions?.find((a) => a.type === 'UPDATE_ZONE_CONFIG');
    return (
      <div
        data-testid="advisor-inline-zone-action-card"
        className="mt-3 rounded-xl border border-emerald-500/40 bg-emerald-950/10 dark:bg-emerald-950/30 p-3.5 space-y-2.5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>
              {createAct
                ? isAr
                  ? 'بطاقة الزونة الزراعية المضافة عبر GeoAgri ai'
                  : 'GeoAgri ai Created Study Zone Summary'
                : isAr
                ? 'تم تحديث إعدادات الزونة النشطة بنجاح'
                : 'Active Zone Configuration Updated'}
            </span>
          </div>
          {onGoToAtlas && (
            <button
              type="button"
              onClick={onGoToAtlas}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>{isAr ? 'عرض على الخريطة الشاملة' : 'View on Full-Screen Atlas'}</span>
            </button>
          )}
        </div>

        {createAct && createAct.type === 'CREATE_ZONE' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
              <div className="text-[10px] text-slate-400">
                {isAr ? 'الإحداثيات الجغرافية' : 'Coordinates'}
              </div>
              <div className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                {createAct.zoneDraft.centroid.lat.toFixed(4)}°N,{' '}
                {createAct.zoneDraft.centroid.lng.toFixed(4)}°E
              </div>
            </div>
            <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
              <div className="text-[10px] text-slate-400">
                {isAr ? 'المساحة الدقيقة' : 'Exact Area'}
              </div>
              <div className="font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                {Math.round(createAct.zoneDraft.requestedFeddans * 10) / 10}{' '}
                {isAr ? 'فدان' : 'Feddans'}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
              <div className="text-[10px] text-slate-400">
                {isAr ? 'التربة والملوحة' : 'Soil & EC'}
              </div>
              <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                {createAct.zoneDraft.soilTexture} · EC {createAct.zoneDraft.salinityEC} dS/m
              </div>
            </div>
            <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
              <div className="text-[10px] text-slate-400">
                {isAr ? 'المحصول والري' : 'Crop & Irrigation'}
              </div>
              <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                {createAct.zoneDraft.customCropLabel || createAct.zoneDraft.cropId} ·{' '}
                {createAct.zoneDraft.irrigation}
              </div>
            </div>
          </div>
        )}

        {updateAct && updateAct.type === 'UPDATE_ZONE_CONFIG' && (
          <div className="text-xs text-slate-700 dark:text-slate-300 font-medium">
            {isAr ? updateAct.summaryAr : updateAct.summaryEn}
          </div>
        )}
      </div>
    );
  }

  if (!hasActiveZones) return null;

  if (widgetType === 'spectral_subzones' && subZones.length > 0) {
    return (
      <div
        data-testid="advisor-inline-spectral-widget"
        className="mt-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/90 p-3.5 space-y-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
            <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>
              {isAr
                ? 'بطاقة التحليل الطيفي والمائي للزونا الفرعية (A / B / C)'
                : 'Sub-Zone Spectral & Hydro-Salinity Matrix (A / B / C)'}
            </span>
          </div>
          {onSelectLayerOnMap && (
            <div className="flex flex-wrap items-center gap-1">
              {(['NDVI', 'NDWI', 'SAVI', 'LST', 'SOIL_EC'] as SpectralIndexKey[]).map((lyr) => (
                <button
                  key={lyr}
                  type="button"
                  onClick={() => onSelectLayerOnMap(lyr)}
                  className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-[10px] font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  {isAr ? `خريطة ${lyr}` : `${lyr} Map`}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {subZones.map((sz) => (
            <div
              key={sz.id}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 p-3 space-y-2"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {isAr ? `زونا ${sz.id} (${sz.directionAr})` : `Zone ${sz.id} (${sz.directionEn})`}
                </span>
                <span className="text-[11px] font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                  {sz.areaFeddans} {isAr ? 'فدان' : 'fed'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-[11px] font-mono">
                <div className="p-1.5 rounded bg-white dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800">
                  <div className="text-[9px] text-slate-400">NDVI</div>
                  <div className="font-bold text-emerald-600 dark:text-emerald-400">{sz.ndvi}</div>
                </div>
                <div className="p-1.5 rounded bg-white dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800">
                  <div className="text-[9px] text-slate-400">NDWI</div>
                  <div className="font-bold text-sky-600 dark:text-sky-400">{sz.ndwi}</div>
                </div>
                <div className="p-1.5 rounded bg-white dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800">
                  <div className="text-[9px] text-slate-400">LST</div>
                  <div className="font-bold text-amber-600 dark:text-amber-400">
                    {sz.lstCelsius}°C
                  </div>
                </div>
                <div className="p-1.5 rounded bg-white dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800">
                  <div className="text-[9px] text-slate-400">SM 0-7cm</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    {sz.soilMoisturePct}%
                  </div>
                </div>
                <div className="p-1.5 rounded bg-white dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800">
                  <div className="text-[9px] text-slate-400">EC dS/m</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    {sz.salinityEC}
                  </div>
                </div>
                <div className="p-1.5 rounded bg-white dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800">
                  <div className="text-[9px] text-slate-400">pH</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">{sz.soilPh}</div>
                </div>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                {isAr ? sz.actionAr : sz.actionEn}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (widgetType === 'irrigation_npk') {
    const { npkSchedule } = advisorChat;
    return (
      <div
        data-testid="advisor-inline-npk-widget"
        className="mt-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/90 p-3.5 space-y-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
            <FlaskConical className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>
              {isAr
                ? `جدول التسميد NPK لـ 4 أسابيع (${customCropLabel || npkSchedule.cropNameAr} — ${npkSchedule.stageNameAr})`
                : `4-Week Dynamic NPK Schedule (${customCropLabel || npkSchedule.cropNameEn} — ${npkSchedule.stageNameEn})`}
            </span>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold">
            GDD {npkSchedule.accumulatedGDD}/{npkSchedule.targetTotalGDD}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {npkSchedule.weeks.map((wk) => (
            <div
              key={wk.weekNumber}
              className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 space-y-1"
            >
              <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                <span>{isAr ? wk.weekLabelAr : wk.weekLabelEn}</span>
                <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400">
                  N:{wk.pureNKgPerFeddan} · P:{wk.pureP2O5KgPerFeddan} · K:{wk.pureK2OKgPerFeddan}{' '}
                  {isAr ? 'كجم/فدان' : 'kg/fed'}
                </span>
              </div>
              <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                {isAr ? wk.commercialSourceAr : wk.commercialSourceEn}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                {isAr ? wk.applicationMethodAr : wk.applicationMethodEn}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (widgetType === 'pest_radar') {
    const {
      regionalPestRisks,
      selectedPestId,
      setSelectedPestId,
      selectedSubZone,
      setSelectedSubZone,
      incidentNotes,
      setIncidentNotes,
      loggedIncidents,
      setLoggedIncidents,
      handleLogPestIncident,
      handleToggleIncidentStatus,
    } = advisorChat;

    return (
      <div
        data-testid="advisor-inline-pest-radar"
        className="mt-3 rounded-xl border border-amber-500/30 bg-white dark:bg-slate-950/90 p-3.5 space-y-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
            <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>
              {isAr
                ? 'رادار الإنذار المبكر للآفات وتثبيت البؤر بالإحداثيات'
                : 'Regional Pest Radar & Coordinate Pinning'}
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            {centroid.lat.toFixed(4)}°N, {centroid.lng.toFixed(4)}°E
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {regionalPestRisks.map((warning) => {
            const pestYield = derivePestRiskYieldMetrics(warning);
            const pestTitle = isAr ? warning.nameAr : warning.nameEn;
            return (
              <div
                key={warning.pestId}
                data-testid={`advisor-pest-risk-card-${warning.pestId}`}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 p-2.5 flex flex-col justify-between gap-2"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        warning.riskLevel === 'critical'
                          ? 'bg-rose-600 text-white'
                          : 'bg-amber-600 text-white'
                      }`}
                    >
                      {warning.riskScore}% {isAr ? 'خطر' : 'Risk'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {isAr
                        ? `انتشار: ${warning.regionalPrevalencePct}%`
                        : `Prev: ${warning.regionalPrevalencePct}%`}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {pestTitle}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono tabular-nums">
                    <div className="px-2 py-1 rounded-md bg-white dark:bg-slate-950 border border-rose-200 dark:border-rose-800/60">
                      <span className="text-[9px] font-sans text-slate-500 dark:text-slate-400 flex items-center justify-between gap-1">
                        <span className="truncate">
                          {isAr ? 'خسارة بدون تدخل' : 'Yield Loss'}
                        </span>
                        {renderMetricInfoTrigger(`pest-${warning.pestId}-loss`, 'start', {
                          riskTitle: pestTitle,
                          yieldLossWithoutActionPct: pestYield.yieldLossWithoutActionPct,
                          mitigatedRecoveryPct: pestYield.mitigatedRecoveryPct,
                        })}
                      </span>
                      <strong dir="ltr" className="inline-block text-rose-600 dark:text-rose-400">
                        -{pestYield.yieldLossWithoutActionPct}%
                      </strong>
                    </div>
                    <div className="px-2 py-1 rounded-md bg-white dark:bg-slate-950 border border-emerald-200 dark:border-emerald-800/60">
                      <span className="text-[9px] font-sans text-slate-500 dark:text-slate-400 flex items-center justify-between gap-1">
                        <span className="truncate">
                          {isAr ? 'الإنقاذ المحتمل' : 'Potential Recovery'}
                        </span>
                        {renderMetricInfoTrigger(
                          `pest-${warning.pestId}-recovery`,
                          'end',
                          {
                            riskTitle: pestTitle,
                            yieldLossWithoutActionPct: pestYield.yieldLossWithoutActionPct,
                            mitigatedRecoveryPct: pestYield.mitigatedRecoveryPct,
                          }
                        )}
                      </span>
                      <strong
                        dir="ltr"
                        className="inline-block text-emerald-600 dark:text-emerald-400"
                      >
                        +{pestYield.mitigatedRecoveryPct}%
                      </strong>
                    </div>
                  </div>
                  <button
                    type="button"
                    data-testid={`pest-card-explain-${warning.pestId}`}
                    onClick={() =>
                      onOpenRiskExplainer({
                        riskTitle: pestTitle,
                        yieldLossWithoutActionPct: pestYield.yieldLossWithoutActionPct,
                        mitigatedRecoveryPct: pestYield.mitigatedRecoveryPct,
                      })
                    }
                    className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    <HelpCircle className="w-3 h-3 shrink-0" />
                    <span>
                      {isAr
                        ? 'تفسير نسبتي الخسارة والإنقاذ'
                        : 'Why don’t these sum to 100%?'}
                    </span>
                  </button>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                    <strong className="text-emerald-700 dark:text-emerald-400">
                      {isAr ? 'الوقاية: ' : 'Prevent: '}
                    </strong>
                    {isAr ? warning.preventiveActionAr : warning.preventiveActionEn}
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                    <strong className="text-rose-600 dark:text-rose-400">
                      {isAr ? 'العلاج: ' : 'Treat: '}
                    </strong>
                    {isAr ? warning.treatmentAlertAr : warning.treatmentAlertEn}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPestId(warning.pestId);
                    const pinCoords = getSubZoneCoordinates(centroid, selectedSubZone);
                    const newInc = createLoggedPestIncident({
                      pestId: warning.pestId,
                      subZoneId: selectedSubZone,
                      severity: warning.riskLevel === 'critical' ? 'critical' : 'high',
                      notes: isAr
                        ? 'تثبيت مباشر من بطاقة رادار الشات'
                        : 'Pinned directly from chat radar',
                      centroid: pinCoords,
                      forecast14,
                      regionalPrevalencePct: warning.regionalPrevalencePct,
                    });
                    setLoggedIncidents((prev) => [newInc, ...prev]);
                  }}
                  className="w-full py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-emerald-700 dark:bg-slate-800 dark:hover:bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <Crosshair className="w-3 h-3" />
                  <span>
                    {isAr
                      ? `تثبيت دبوس البؤرة (زونا ${selectedSubZone})`
                      : `Pin Focus on Zone ${selectedSubZone}`}
                  </span>
                </button>
              </div>
            );
          })}
        </div>

        <form
          onSubmit={handleLogPestIncident}
          className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800"
        >
          <select
            aria-label={isAr ? 'الآفة' : 'Pest'}
            value={selectedPestId}
            onChange={(e) => setSelectedPestId(e.target.value)}
            className="text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 font-semibold"
          >
            {REGIONAL_PEST_CATALOG.map((p) => (
              <option key={p.id} value={p.id}>
                {isAr ? p.nameAr : p.nameEn}
              </option>
            ))}
          </select>
          <select
            aria-label={isAr ? 'الزونا' : 'Sub-Zone'}
            value={selectedSubZone}
            onChange={(e) => setSelectedSubZone(e.target.value as 'A' | 'B' | 'C')}
            className="text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 font-semibold"
          >
            <option value="A">{isAr ? 'زونا A (شمال شرق)' : 'Zone A (NE)'}</option>
            <option value="B">{isAr ? 'زونا B (وسط)' : 'Zone B (Center)'}</option>
            <option value="C">{isAr ? 'زونا C (جنوب غرب)' : 'Zone C (SW)'}</option>
          </select>
          <input
            type="text"
            value={incidentNotes}
            onChange={(e) => setIncidentNotes(e.target.value)}
            placeholder={isAr ? 'ملاحظة الفحص الميداني...' : 'Scouting note...'}
            className="flex-1 min-w-[140px] text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5"
          />
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
          >
            {isAr ? 'تثبيت الدبوس' : 'Pin Incident'}
          </button>
        </form>

        {loggedIncidents.length > 0 && (
          <div className="space-y-1.5">
            {loggedIncidents.slice(0, 3).map((inc) => (
              <div
                key={inc.id}
                onClick={() => handleToggleIncidentStatus(inc.id)}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex flex-wrap items-center justify-between gap-2 text-xs cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-slate-900 text-white text-[10px] font-bold">
                    {isAr ? `زونا ${inc.subZoneId}` : `Zone ${inc.subZoneId}`}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {isAr ? inc.pestNameAr : inc.pestNameEn}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    ({inc.coordinates.lat.toFixed(4)}°N, {inc.coordinates.lng.toFixed(4)}°E)
                  </span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    inc.status === 'treated'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-600 text-white'
                  }`}
                >
                  {inc.status === 'treated'
                    ? isAr
                      ? 'تم العلاج ✓'
                      : 'Treated ✓'
                    : isAr
                    ? 'نشطة — اضغط لتحديد كمعالجة'
                    : 'Active — Click to mark treated'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (widgetType === 'weekly_checklist') {
    return (
      <div
        data-testid="advisor-inline-checklist-widget"
        className="mt-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/90 p-3.5 space-y-2.5"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>
              {isAr
                ? 'خطة العمل الميدانية للأسبوع القادم (تفاعلية)'
                : 'Interactive Weekly Field Action Plan'}
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            {checklist.filter((c) => c.completed).length}/{checklist.length}{' '}
            {isAr ? 'مكتمل' : 'Done'}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {checklist.map((task) => (
            <div
              key={task.id}
              onClick={() => onToggleChecklistTask(task.id)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                task.completed
                  ? 'bg-slate-50/70 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 opacity-75'
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-500/40'
              }`}
            >
              <button
                type="button"
                aria-label={isAr ? task.titleAr : task.titleEn}
                className="mt-0.5 text-emerald-600 dark:text-emerald-400 shrink-0"
              >
                {task.completed ? (
                  <CheckSquare className="w-4 h-4" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 text-[10px] text-slate-400">
                  <span>{isAr ? task.dayAr : task.dayEn}</span>
                  <span
                    className={
                      task.priority === 'high'
                        ? 'text-amber-600 dark:text-amber-400 font-bold'
                        : ''
                    }
                  >
                    {task.priority === 'high'
                      ? isAr
                        ? 'أولوية قصوى'
                        : 'High Priority'
                      : isAr
                      ? 'مجدول'
                      : 'Scheduled'}
                  </span>
                </div>
                <div
                  className={`text-xs font-bold mt-0.5 ${
                    task.completed
                      ? 'line-through text-slate-400'
                      : 'text-slate-900 dark:text-white'
                  }`}
                >
                  {isAr ? task.titleAr : task.titleEn}
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-snug">
                  {isAr ? task.detailAr : task.detailEn}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (widgetType === 'crop_mcda' && topCrops.length > 0) {
    return (
      <div
        data-testid="advisor-inline-crop-widget"
        className="mt-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/90 p-3.5 space-y-2.5"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
            <Sprout className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>
              {isAr
                ? 'مصفوفة أفضل المحاصيل ملاءمة وعائداً لأرضك (MCDA)'
                : 'Top Matched Crops & Economic Yield Matrix (MCDA)'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {topCrops.slice(0, 3).map((rec, idx) => (
            <div
              key={rec.crop.id}
              className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex flex-col justify-between gap-2"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-600 text-white">
                    #{idx + 1} · {rec.suitabilityScore}%
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                    {rec.gradeLabel}
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  {isAr ? rec.crop.nameAr : rec.crop.nameEn}
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-300">
                  {isAr
                    ? `الإنتاجية: ${rec.expectedYieldTonPerFeddan} طن/فدان · المقنن: ${rec.netIrrigationRequiredM3PerFeddan} م³/فدان`
                    : `Yield: ${rec.expectedYieldTonPerFeddan} t/fed · Water: ${rec.netIrrigationRequiredM3PerFeddan} m³/fed`}
                </div>
              </div>
              {onAdoptCrop && (
                <button
                  type="button"
                  onClick={() => onAdoptCrop(rec.crop.id)}
                  className={`w-full py-1.5 px-2 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                    currentCropId === rec.crop.id
                      ? 'bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-900 hover:bg-emerald-600 text-white'
                  }`}
                >
                  {currentCropId === rec.crop.id
                    ? isAr
                      ? 'المحصول المعتمد حالياً ✓'
                      : 'Active Crop ✓'
                    : isAr
                    ? 'اعتماد هذا المحصول للزونة'
                    : 'Adopt Crop for Zone'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
};

interface AdvisorMessageBubbleProps {
  msg: AdvisorMessage;
  language: Language;
  hasActiveZones: boolean;
  centroid: LatLon;
  currentCropId: string;
  customCropLabel?: string;
  subZones: SubZoneSummary[];
  forecast14: DailyWeatherPoint[];
  topCrops: ScoredCropRecommendation[];
  checklist: WeeklyChecklistTask[];
  advisorChat: SharedAdvisorChatHandle;
  onToggleChecklistTask: (taskId: string) => void;
  onGoToAtlas?: () => void;
  onSelectLayerOnMap?: (layer: SpectralIndexKey) => void;
  onAdoptCrop?: (cropId: string, customLabel?: string) => void;
  onOpenRiskInfo: (payload: RiskInfoModalPayload) => void;
  onOpenRiskExplainer: (payload: RiskInfoModalPayload) => void;
  spacious?: boolean;
}

export const AdvisorMessageBubble: React.FC<AdvisorMessageBubbleProps> = ({
  msg,
  language,
  hasActiveZones,
  centroid,
  currentCropId,
  customCropLabel,
  subZones,
  forecast14,
  topCrops,
  checklist,
  advisorChat,
  onToggleChecklistTask,
  onGoToAtlas,
  onSelectLayerOnMap,
  onAdoptCrop,
  onOpenRiskInfo,
  onOpenRiskExplainer,
  spacious = false,
}) => {
  const isAr = language === 'ar';

  return (
    <div className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
          msg.sender === 'advisor'
            ? 'bg-emerald-600 text-white shadow-sm'
            : 'bg-slate-900 dark:bg-slate-700 text-white'
        }`}
      >
        {msg.sender === 'advisor' ? (
          <Bot className="w-4 h-4" />
        ) : (
          <User className="w-4 h-4" />
        )}
      </div>

      <div
        className={`max-w-[92%] sm:max-w-[85%] rounded-2xl ${
          spacious ? 'p-4 sm:p-5 text-sm sm:text-[15px]' : 'p-3.5 sm:p-4 text-xs sm:text-sm'
        } leading-relaxed ${
          msg.sender === 'advisor'
            ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 shadow-sm'
            : 'bg-emerald-700 text-white font-medium shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between gap-4 mb-1.5 text-[11px] opacity-75 font-mono">
          <div className="flex items-center gap-2">
            <span>
              {msg.sender === 'advisor'
                ? 'GeoAgri ai'
                : isAr
                ? 'أنت'
                : 'You'}
            </span>
            {msg.sender === 'advisor' && msg.sourceMode === 'gemini_live' && (
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[9px] font-bold">
                GeoAgri ai Live
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span>{msg.timestamp}</span>
          </div>
        </div>

        {msg.attachment && (
          <div
            data-testid={`advisor-msg-attachment-${msg.attachment.mediaType}`}
            className="mb-2.5 rounded-xl overflow-hidden border border-white/25 dark:border-slate-700 bg-slate-950/30"
          >
            {msg.attachment.mediaType === 'video' ? (
              <video
                src={msg.attachment.previewUrl}
                controls
                playsInline
                className="max-h-56 w-full object-contain bg-slate-950"
              />
            ) : (
              <img
                src={msg.attachment.previewUrl}
                alt={msg.attachment.fileName}
                className="max-h-56 w-full object-cover"
              />
            )}
            <div className="px-2.5 py-1.5 bg-slate-950/60 text-white text-[10px] font-mono flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 truncate">
                {msg.attachment.mediaType === 'video' ? (
                  <Film className="w-3 h-3 text-emerald-300 shrink-0" />
                ) : (
                  <ImageIcon className="w-3 h-3 text-emerald-300 shrink-0" />
                )}
                <span className="truncate">{msg.attachment.fileName}</span>
              </span>
              <span className="uppercase opacity-75 shrink-0">
                {msg.attachment.mediaType === 'video'
                  ? isAr
                    ? 'فيديو'
                    : 'Video'
                  : isAr
                  ? 'صورة'
                  : 'Image'}
              </span>
            </div>
          </div>
        )}

        {msg.executedActions && msg.executedActions.length > 0 && (
          <div className="mb-2.5 flex flex-wrap gap-1.5">
            {msg.executedActions.map((act, idx) => (
              <span
                key={idx}
                data-testid={`advisor-executed-action-${act.type}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold"
              >
                <Zap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{isAr ? act.summaryAr : act.summaryEn}</span>
              </span>
            ))}
          </div>
        )}

        <div className={spacious ? 'text-sm sm:text-[15px] leading-relaxed' : 'text-xs sm:text-sm leading-relaxed'}>
          {msg.text.split('\n').map((line, i) => formatRichMessageLine(line, i))}
        </div>

        {msg.inlineWidgets &&
          msg.inlineWidgets.length > 0 &&
          msg.inlineWidgets.map((wType) => (
            <AdvisorInlineWidget
              key={wType}
              widgetType={wType}
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
              onOpenRiskInfo={onOpenRiskInfo}
              onOpenRiskExplainer={onOpenRiskExplainer}
            />
          ))}

        {msg.metricsCited && msg.metricsCited.length > 0 && (
          <div className="mt-3 pt-2 border-t border-slate-200/70 dark:border-slate-800 flex flex-wrap gap-1.5">
            {msg.metricsCited.map((m, idx) => (
              <span
                key={idx}
                className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              >
                {m}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
