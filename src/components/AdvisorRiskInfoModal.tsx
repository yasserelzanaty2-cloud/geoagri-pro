import React, { useEffect } from 'react';
import { Info, ShieldCheck, TrendingDown, X } from 'lucide-react';
import { Language } from '../types/agro';
import { computeRiskMitigationBreakdown } from '../utils/agroEngine';

interface AdvisorRiskInfoModalProps {
  isOpen: boolean;
  language: Language;
  riskTitle?: string;
  yieldLossWithoutActionPct?: number;
  mitigatedRecoveryPct?: number;
  onClose: () => void;
}

export const AdvisorRiskInfoModal: React.FC<AdvisorRiskInfoModalProps> = ({
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
      data-testid="advisor-risk-info-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="advisor-risk-info-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="w-full max-w-xl max-h-[90dvh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
              <Info className="w-4 h-4 shrink-0" />
              <span>
                {isAr
                  ? 'التعريف التشخيصي لمؤشرات المخاطر'
                  : 'Diagnostic Risk Metrics Reference'}
              </span>
            </div>
            <h2
              id="advisor-risk-info-modal-title"
              className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug"
            >
              {isAr
                ? 'خسارة بدون تدخل مقابل الإنقاذ المحتمل بالتدخل'
                : 'Yield Loss (Without Intervention) vs. Potential Recovery (Via Mitigation)'}
            </h2>
            {riskTitle && (
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {riskTitle}
              </p>
            )}
          </div>

          <button
            type="button"
            data-testid="advisor-risk-info-close-btn"
            aria-label={isAr ? 'إغلاق النافذة' : 'Close modal'}
            onClick={onClose}
            className="min-h-[38px] min-w-[38px] p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer shrink-0 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-sm">
          {/* 1) & 2) Diagnostic Categories */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-800/60 bg-rose-50/40 dark:bg-rose-950/20 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-400">
                  <TrendingDown className="w-4 h-4 shrink-0" />
                  <span>
                    {isAr ? (
                      <>
                        1) خسارة بدون تدخل <bdi dir="ltr">(Yield Loss)</bdi>
                      </>
                    ) : (
                      '1) Yield Loss (Without Intervention)'
                    )}
                  </span>
                </span>
                <span
                  dir="ltr"
                  className="inline-block font-mono tabular-nums font-bold text-base text-rose-600 dark:text-rose-400 shrink-0"
                >
                  -{breakdown.yieldLossWithoutActionPct}%
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {isAr
                  ? 'تمثل خط الأساس للخسارة المتوقعة من إجمالي المحصول بناءً على نماذج المناخ الحالية وتوازن التربة في غياب أي تدخل بشري.'
                  : 'Baseline projected damage out of total farm yield based on current climate models and field telemetry if no human intervention is taken.'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>
                    {isAr ? (
                      <>
                        2) الإنقاذ المحتمل <bdi dir="ltr">(Potential Recovery)</bdi>
                      </>
                    ) : (
                      '2) Potential Recovery (Via Mitigation)'
                    )}
                  </span>
                </span>
                <span
                  dir="ltr"
                  className="inline-block font-mono tabular-nums font-bold text-base text-emerald-600 dark:text-emerald-400 shrink-0"
                >
                  +{breakdown.mitigatedRecoveryPct}%
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {isAr
                  ? `تمثل النسبة التي يمكن استعادتها من تلك الخسارة المتوقعة (${breakdown.yieldLossWithoutActionPct}%) فقط عبر تطبيق الممارسات الزراعية الموصى بها.`
                  : `The share of that projected loss (${breakdown.yieldLossWithoutActionPct}%) that can be regained through recommended agronomic mitigation practices.`}
              </p>
            </div>
          </div>

          {/* Bilingual Diagnostic Distinction Explanation (Arabic + English) */}
          <div
            data-testid="advisor-risk-info-bilingual-box"
            className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 space-y-2.5"
          >
            <div dir="rtl" className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
              <strong className="text-slate-900 dark:text-white">
                لماذا لا يُجمع الرقمان إلى 100%؟
              </strong>{' '}
              يمثل هذان المؤشران فئتين تشخيصيتين مستقلتين وليستا أجزاءً متكاملة من نفس الكل؛ فـ
              «خسارة بدون تدخل» تُقاس من إجمالي المحصول الكلي، بينما يقيس «الإنقاذ المحتمل» كفاءة
              التدخل في استرداد الجزء المعرّض للفقد فقط.
            </div>
            <div
              dir="ltr"
              className="pt-2 border-t border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed text-left"
            >
              <strong className="text-slate-900 dark:text-white">
                Why they are not additive parts of 100%:
              </strong>{' '}
              These two values represent distinct diagnostic categories rather than additive slices
              of a single whole—Yield Loss measures baseline exposure against total harvest, whereas
              Potential Recovery measures protocol efficiency within that at-risk loss portion only.
            </div>
          </div>

          {/* Worked Numerical Breakdown */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/80 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-bold text-slate-900 dark:text-white">
                {isAr ? 'التطبيق الحسابي على هذا الخطر' : 'Worked Breakdown for This Alert'}
              </span>
              <span dir="ltr" className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                {breakdown.yieldLossWithoutActionPct}% × {breakdown.mitigatedRecoveryPct}% = +
                {breakdown.preservedFromLossPct}%
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs font-mono tabular-nums">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] font-sans text-slate-500 dark:text-slate-400">
                  {isAr ? 'المُستعاد من الإجمالي' : 'Regained of Total'}
                </div>
                <div
                  dir="ltr"
                  className="inline-block text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5"
                >
                  +{breakdown.preservedFromLossPct}%
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] font-sans text-slate-500 dark:text-slate-400">
                  {isAr ? 'صافي الخسارة المتبقية' : 'Net Residual Loss'}
                </div>
                <div
                  dir="ltr"
                  className="inline-block text-sm font-bold text-rose-600 dark:text-rose-400 mt-0.5"
                >
                  -{breakdown.netResidualLossPct}%
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] font-sans text-slate-500 dark:text-slate-400">
                  {isAr ? 'المحصول المحفوظ نهائياً' : 'Final Preserved Yield'}
                </div>
                <div
                  dir="ltr"
                  className="inline-block text-sm font-bold text-slate-900 dark:text-white mt-0.5"
                >
                  {breakdown.finalHarvestPct}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            data-testid="advisor-risk-info-confirm-btn"
            onClick={onClose}
            className="min-h-[40px] px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer transition-colors"
          >
            {isAr ? 'حسناً، فهمت' : 'Got It'}
          </button>
        </div>
      </div>
    </div>
  );
};
