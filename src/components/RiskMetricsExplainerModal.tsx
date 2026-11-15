import React, { useEffect } from 'react';
import { HelpCircle, ShieldCheck, TrendingDown, X } from 'lucide-react';
import { Language } from '../types/agro';
import { computeRiskMitigationBreakdown } from '../utils/agroEngine';

interface RiskMetricsExplainerModalProps {
  isOpen: boolean;
  language: Language;
  riskTitle?: string;
  yieldLossWithoutActionPct?: number;
  mitigatedRecoveryPct?: number;
  onClose: () => void;
}

export const RiskMetricsExplainerModal: React.FC<RiskMetricsExplainerModalProps> = ({
  isOpen,
  language,
  riskTitle,
  yieldLossWithoutActionPct = 30,
  mitigatedRecoveryPct = 85,
  onClose,
}) => {
  const isAr = language === 'ar';

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const breakdown = computeRiskMitigationBreakdown(
    yieldLossWithoutActionPct,
    mitigatedRecoveryPct
  );

  return (
    <div
      data-testid="risk-metrics-explainer-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="risk-explainer-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[100] bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
              <HelpCircle className="w-4 h-4 shrink-0" />
              <span>
                {isAr ? 'دليل قراءة مؤشرات الخطر الزراعي' : 'Agronomic Risk Metrics Guide'}
              </span>
            </div>
            <h2
              id="risk-explainer-modal-title"
              className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug"
            >
              {isAr
                ? 'لماذا لا يساوي مجموع نسبتي الخسارة والإنقاذ 100%؟'
                : 'Why Yield Loss & Potential Recovery Don’t Sum to 100%'}
            </h2>
            {riskTitle && (
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {riskTitle}
              </p>
            )}
          </div>

          <button
            type="button"
            data-testid="risk-explainer-close-btn"
            aria-label={isAr ? 'إغلاق النافذة' : 'Close dialog'}
            onClick={onClose}
            className="min-h-[38px] min-w-[38px] p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer shrink-0 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-sm">
          {/* Two Independent Metrics Comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-800/60 bg-rose-50/40 dark:bg-rose-950/20 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-400">
                  <TrendingDown className="w-4 h-4 shrink-0" />
                  <span>
                    {isAr ? 'خسارة بدون تدخل' : 'Yield Loss (without intervention)'}
                  </span>
                </span>
                <span
                  dir="ltr"
                  className="inline-block font-mono tabular-nums font-bold text-base text-rose-600 dark:text-rose-400"
                >
                  -{breakdown.yieldLossWithoutActionPct}%
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {isAr
                  ? 'تُقاس من إجمالي المحصول الكلي (100%). تعني أن هذا الجزء من إنتاج الأرض مهدد بالضياع إذا لم يُتخذ أي إجراء وقائي.'
                  : 'Measured against 100% of total farm yield. Represents the share of your total harvest at risk if no preventive action is taken.'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>
                    {isAr ? 'الإنقاذ المحتمل بالتدخل' : 'Potential Recovery (via mitigation)'}
                  </span>
                </span>
                <span
                  dir="ltr"
                  className="inline-block font-mono tabular-nums font-bold text-base text-emerald-600 dark:text-emerald-400"
                >
                  +{breakdown.mitigatedRecoveryPct}%
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {isAr
                  ? `تُقاس من الجزء المهدد بالفقد (${breakdown.yieldLossWithoutActionPct}%) فقط، وليس من إجمالي المحصول. تمثل كفاءة البروتوكول الوقائي في إنقاذ الخسارة.`
                  : `Measured solely against the at-risk portion (${breakdown.yieldLossWithoutActionPct}%), not total crop yield. It reflects mitigation protocol effectiveness.`}
              </p>
            </div>
          </div>

          {/* Worked Visual & Mathematical Breakdown */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-bold text-slate-900 dark:text-white">
                {isAr
                  ? 'التفصيل الحسابي على إجمالي المحصول (100%)'
                  : 'Worked Breakdown Across 100% Total Harvest'}
              </span>
              <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                {breakdown.yieldLossWithoutActionPct}% + {breakdown.mitigatedRecoveryPct}% ={' '}
                {breakdown.rawCombinedSumPct}% ({isAr ? 'مقياسان مستقلان' : 'independent scales'})
              </span>
            </div>

            {/* Proportional Stacked Bar */}
            <div
              aria-label={isAr ? 'توزيع المحصول المحفوظ والفاقد الصافي' : 'Harvest preservation bar'}
              className="h-4 w-full rounded-full overflow-hidden flex bg-slate-200 dark:bg-slate-800 border border-slate-300/60 dark:border-slate-700"
            >
              <div
                style={{ width: `${breakdown.safeBaselinePct}%` }}
                className="bg-slate-600 dark:bg-slate-500 h-full transition-all"
                title={
                  isAr
                    ? `محصول آمن أصلاً: ${breakdown.safeBaselinePct}%`
                    : `Unaffected yield: ${breakdown.safeBaselinePct}%`
                }
              />
              <div
                style={{ width: `${breakdown.preservedFromLossPct}%` }}
                className="bg-emerald-600 h-full transition-all"
                title={
                  isAr
                    ? `تم إنقاذه بالتدخل: +${breakdown.preservedFromLossPct}%`
                    : `Recovered via mitigation: +${breakdown.preservedFromLossPct}%`
                }
              />
              <div
                style={{ width: `${breakdown.netResidualLossPct}%` }}
                className="bg-rose-600 h-full transition-all"
                title={
                  isAr
                    ? `صافي الفاقد المتبقي: -${breakdown.netResidualLossPct}%`
                    : `Net residual loss: -${breakdown.netResidualLossPct}%`
                }
              />
            </div>

            {/* Proportional Bar Color Key */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600 dark:text-slate-300">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-600 dark:bg-slate-500 inline-block" />
                <span>{isAr ? 'آمن أصلاً' : 'Unaffected'}:</span>
                <strong dir="ltr" className="font-mono tabular-nums">
                  {breakdown.safeBaselinePct}%
                </strong>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600 inline-block" />
                <span>{isAr ? 'تم إنقاذه' : 'Saved'}:</span>
                <strong dir="ltr" className="font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                  +{breakdown.preservedFromLossPct}%
                </strong>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-600 inline-block" />
                <span>{isAr ? 'فاقد صافي' : 'Net Loss'}:</span>
                <strong dir="ltr" className="font-mono tabular-nums text-rose-600 dark:text-rose-400">
                  -{breakdown.netResidualLossPct}%
                </strong>
              </span>
            </div>

            {/* Three-Column Summary Strip */}
            <div className="grid grid-cols-3 gap-2 text-xs font-mono tabular-nums pt-1">
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] font-sans text-slate-500 dark:text-slate-400">
                  {isAr ? 'تم إنقاذه من الإجمالي' : 'Saved of Total'}
                </div>
                <div
                  dir="ltr"
                  className="inline-block text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5"
                >
                  +{breakdown.preservedFromLossPct}%
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] font-sans text-slate-500 dark:text-slate-400">
                  {isAr ? 'صافي الخسارة بعد التدخل' : 'Net Residual Loss'}
                </div>
                <div
                  dir="ltr"
                  className="inline-block text-sm font-bold text-rose-600 dark:text-rose-400 mt-0.5"
                >
                  -{breakdown.netResidualLossPct}%
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] font-sans text-slate-500 dark:text-slate-400">
                  {isAr ? 'المحصول النهائي المحفوظ' : 'Final Preserved Yield'}
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                  {breakdown.finalHarvestPct}%
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {isAr
                ? `الحسبة الفعلية: خسارة محتملة (${breakdown.yieldLossWithoutActionPct}%) × كفاءة البروتوكول (${breakdown.mitigatedRecoveryPct}%) = إنقاذ ${breakdown.preservedFromLossPct}% من إجمالي المحصول، فينخفض الضرر الفعلي من ${breakdown.yieldLossWithoutActionPct}% إلى ${breakdown.netResidualLossPct}% فقط.`
                : `Worked equation: ${breakdown.yieldLossWithoutActionPct}% at-risk loss × ${breakdown.mitigatedRecoveryPct}% protocol efficiency = ${breakdown.preservedFromLossPct}% of total harvest rescued, cutting actual net loss from ${breakdown.yieldLossWithoutActionPct}% down to ${breakdown.netResidualLossPct}%.`}
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            data-testid="risk-explainer-confirm-btn"
            onClick={onClose}
            className="min-h-[40px] px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer transition-colors"
          >
            {isAr ? 'فهمت المعادلة' : 'Got It'}
          </button>
        </div>
      </div>
    </div>
  );
};
