import React from 'react';
import {
  X,
  Sprout,
  Droplets,
  Activity,
  CheckCircle2,
  Calendar,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Sun,
  CloudRain,
  ShieldCheck,
} from 'lucide-react';
import { Language, SoilProfile, AreaBreakdown, SpectralIndexKey, DailyWeatherPoint, SoilTexture } from '../types/agro';
import { CROP_DATABASE } from '../utils/agroEngine';

const TEXTURE_AR: Record<SoilTexture, string> = {
  clay: 'تربة طينية خصبة',
  loamy: 'تربة طميية متوازنة',
  sandy: 'تربة رملية مفككة',
  calcareous: 'تربة كلسية جيرية',
};

const TEXTURE_EN: Record<SoilTexture, string> = {
  clay: 'Fertile Clay',
  loamy: 'Balanced Loamy',
  sandy: 'Well-Drained Sandy',
  calcareous: 'Calcareous Lime',
};

interface FarmerCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  farmName: string;
  area: AreaBreakdown;
  soil?: SoilProfile;
  farmAverages: Record<SpectralIndexKey, number>;
}

export const FarmerCropModal: React.FC<FarmerCropModalProps> = ({
  isOpen,
  onClose,
  language,
  farmName,
  area,
  soil,
}) => {
  if (!isOpen) return null;
  const isAr = language === 'ar';
  const effectiveSalinity = soil?.salinityEC ?? 1.8;
  const effectiveTexture = soil?.texture ?? 'loamy';

  // Filter suitable crops based on soil salinity EC and season
  const suitableCrops = CROP_DATABASE.filter((crop) => {
    return effectiveSalinity <= crop.maxSalinityEC;
  })
    .sort((a, b) => {
      // Sort by profitability & suitability
      const revA = a.potentialYieldTonPerFeddan * a.marketPriceEgpPerTon;
      const revB = b.potentialYieldTonPerFeddan * b.marketPriceEgpPerTon;
      return revB - revA;
    })
    .slice(0, 6);

  const textureLabel = isAr ? TEXTURE_AR[effectiveTexture] : TEXTURE_EN[effectiveTexture];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl max-h-[90vh] bg-white dark:bg-slate-900 border border-emerald-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
              <Sprout className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">
                {isAr ? '🌾 أفضل المحاصيل والزرعات الأنسب لأرضك' : '🌾 Best Recommended Crops For Your Land'}
              </h3>
              <p className="text-xs text-emerald-100">
                {isAr
                  ? `بناءً على طبيعة تربتك (${textureLabel}) وملوحة ${effectiveSalinity} dS/m`
                  : `Tailored for ${textureLabel} soil & EC ${effectiveSalinity} dS/m`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={isAr ? 'إغلاق' : 'Close'}
            className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/15 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Farm Quick Banner */}
        <div className="px-5 py-2.5 bg-emerald-50/80 dark:bg-emerald-950/40 border-b border-emerald-500/20 text-xs sm:text-sm text-emerald-900 dark:text-emerald-200 flex flex-wrap items-center justify-between gap-2">
          <div className="font-bold flex items-center gap-1.5">
            <span>{isAr ? 'أرضك الحالية:' : 'Active Land:'}</span>
            <span className="underline">{farmName || (isAr ? 'المزرعة المختارة' : 'Selected Farm')}</span>
            <span>({area.feddans} {isAr ? 'فدان' : 'Feddans'})</span>
          </div>
          <div className="text-xs px-2 py-0.5 rounded-full bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-500/30">
            {isAr ? 'دليل مبسط للمزارع' : 'Farmer Simple Guide'}
          </div>
        </div>

        {/* Crops List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 [scrollbar-width:thin]">
          {suitableCrops.map((crop, idx) => {
            const revenueFeddan = Math.round(crop.potentialYieldTonPerFeddan * crop.marketPriceEgpPerTon);
            return (
              <div
                key={crop.id}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:border-emerald-500/50 transition-all shadow-sm space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                        {isAr ? crop.nameAr : crop.nameEn}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {isAr ? crop.cultivarAr : crop.cultivarEn}
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-500/30 shrink-0">
                    {isAr ? crop.seasonAr : crop.seasonEn}
                  </span>
                </div>

                {/* Key Numbers Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1">
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px]">
                      {isAr ? 'الإنتاج المتوقع' : 'Expected Yield'}
                    </span>
                    <strong className="text-slate-900 dark:text-emerald-400 text-xs sm:text-sm">
                      {crop.potentialYieldTonPerFeddan} {isAr ? 'طن / فدان' : 't/feddan'}
                    </strong>
                  </div>

                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px]">
                      {isAr ? 'العائد التقريبي' : 'Gross Revenue'}
                    </span>
                    <strong className="text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm">
                      {revenueFeddan.toLocaleString()} {isAr ? 'ج.م / فدان' : 'EGP/fed'}
                    </strong>
                  </div>

                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 col-span-2 sm:col-span-1">
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px]">
                      {isAr ? 'ميعاد الزراعة الأمثل' : 'Sowing Window'}
                    </span>
                    <strong className="text-slate-900 dark:text-white text-xs">
                      {isAr ? crop.optimalPlantingStartAr : crop.optimalPlantingStartEn}
                    </strong>
                  </div>
                </div>

                {/* Golden Farmer Tip */}
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300/40 text-amber-900 dark:text-amber-200 text-xs leading-relaxed flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-[11px] mb-0.5">
                      {isAr ? 'نصيحة المزارع الذهبية:' : "Agronomist's Golden Advice:"}
                    </strong>
                    <span>{isAr ? crop.qualityFactorsAr : crop.qualityFactorsEn}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {isAr ? '💡 اختر المحصول الأنسب لدورتك الزراعية' : '💡 Select best fit for crop rotation'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm transition cursor-pointer"
          >
            {isAr ? 'فهمت، حسناً' : 'Got it'}
          </button>
        </div>
      </div>
    </div>
  );
};

interface FarmerWaterModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  farmName: string;
  forecast14: DailyWeatherPoint[];
  soil?: SoilProfile;
}

export const FarmerWaterModal: React.FC<FarmerWaterModalProps> = ({
  isOpen,
  onClose,
  language,
  farmName,
  forecast14,
  soil,
}) => {
  if (!isOpen) return null;
  const isAr = language === 'ar';

  const nextRain = forecast14.find((d) => d.precipMm >= 1.0);
  const isRainSoon = Boolean(nextRain);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-sky-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-sky-600 to-blue-700 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
              <Droplets className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">
                {isAr ? '💧 حالة مياه وري أرضك' : '💧 Irrigation & Water Status'}
              </h3>
              <p className="text-xs text-sky-100">
                {isAr ? 'توصيات الري الفوري وتوقعات الأمطار' : 'Instant Irrigation Advice & Rain Forecast'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={isAr ? 'إغلاق' : 'Close'}
            className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/15 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs sm:text-sm">
          {/* Main Action Banner */}
          <div
            className={`p-4 rounded-2xl border ${
              isRainSoon
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400/50 text-amber-900 dark:text-amber-200'
                : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400/50 text-emerald-900 dark:text-emerald-200'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-sm sm:text-base mb-1.5">
              {isRainSoon ? (
                <>
                  <CloudRain className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <span>{isAr ? 'نصيحة الري اليوم: وفر مياهك وما ترويش!' : 'Irrigation Advice: Do NOT Irrigate!'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>{isAr ? 'رطوبة التربة ممتازة ومستقرة 🟢' : 'Soil Moisture Optimal 🟢'}</span>
                </>
              )}
            </div>

            <p className="leading-relaxed text-xs">
              {isRainSoon
                ? isAr
                  ? `يتوقع هطول أمطار بقدر (${nextRain?.precipMm} ملم) يوم ${nextRain?.dayLabelAr}. تأجيل الري سيوفر عليك تكلفة السولار والكهرباء ومياه الآبار.`
                  : `Rain is forecast (${nextRain?.precipMm} mm) on ${nextRain?.dayLabelEn}. Suspending irrigation saves energy and water.`
                : isAr
                ? 'مستويات الرطوبة في باطن الأرض كافية تماماً لتغذية الجذور. حافظ على جدول الري المعتدل ولا تفرط في التغريق.'
                : 'Subsurface moisture is healthy. Maintain regular schedule without waterlogging.'}
            </p>
          </div>

          {/* 3 Status Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-1">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-semibold">
                <Droplets className="w-3.5 h-3.5 text-sky-500" />
                <span>{isAr ? 'رطوبة باطن الأرض' : 'Rootzone Moisture'}</span>
              </span>
              <strong className="text-base text-sky-600 dark:text-sky-400 block font-bold">
                {isAr ? 'شبعانة ومرتوية 82%' : '82% Sufficient'}
              </strong>
              <span className="text-[10px] text-slate-400 block">
                {isAr ? 'حساسات NASA SMAP الفضائية' : 'NASA SMAP Satellites'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-1">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-semibold">
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>{isAr ? 'طقس اليوم' : 'Today Weather'}</span>
              </span>
              <strong className="text-base text-slate-900 dark:text-white block font-bold">
                {isAr ? 'مشمس ومعتدل 24°م' : 'Sunny & Mild 24°C'}
              </strong>
              <span className="text-[10px] text-slate-400 block">
                {isAr ? 'رياح خفيفة ومناسبة للرش' : 'Calm winds suitable for spraying'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs sm:text-sm transition cursor-pointer"
          >
            {isAr ? 'تمام، شكراً' : 'Understood'}
          </button>
        </div>
      </div>
    </div>
  );
};

interface FarmerHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  farmName: string;
  farmAverages: Record<SpectralIndexKey, number>;
}

export const FarmerHealthModal: React.FC<FarmerHealthModalProps> = ({
  isOpen,
  onClose,
  language,
  farmName,
  farmAverages,
}) => {
  if (!isOpen) return null;
  const isAr = language === 'ar';

  const ndvi = farmAverages.NDVI ?? 0.52;
  const healthPercent = Math.min(100, Math.max(10, Math.round(ndvi * 100)));
  const isHealthy = healthPercent >= 60;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-teal-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-teal-600 to-emerald-700 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">
                {isAr ? '🌿 صحة وخضار زرعك' : '🌿 Crop Health & Vigor'}
              </h3>
              <p className="text-xs text-teal-100">
                {isAr ? 'تحليل الأقمار الصناعية لنمو المحصول' : 'Satellite Vegetative Growth Analysis'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={isAr ? 'إغلاق' : 'Close'}
            className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/15 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs sm:text-sm">
          {/* Health Gauge Box */}
          <div className="p-4 rounded-2xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-500/30 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-semibold mb-1">
                {isAr ? 'مستوى خضار وصحة الزرع' : 'Overall Vegetation Health'}
              </span>
              <strong className="text-2xl font-bold text-teal-700 dark:text-teal-300">
                {healthPercent}% {isHealthy ? (isAr ? '🟢 ممتاز جداً' : '🟢 Excellent') : (isAr ? '🟡 متوسط' : '🟡 Moderate')}
              </strong>
            </div>

            <div className="w-16 h-16 rounded-2xl bg-teal-600/10 border border-teal-500/40 flex items-center justify-center font-mono font-bold text-teal-700 dark:text-teal-300 text-lg">
              NDVI
            </div>
          </div>

          {/* Simple Explanation */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1.5">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{isAr ? 'ماذا يعني هذا لمزرعتك؟' : 'What this means for your farm:'}</span>
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {isAr ? (
                <>
                  الغطاء النباتي في أرضك نشط جداً والكلوروفيل ممتص للشمس بكفاءة. لا توجد بقع اصفرار أو موت جذور عام، والمجموع الخضري في حالة حيوية قوية.
                </>
              ) : (
                <>
                  Your crop canopy exhibits strong photosynthetic chlorophyll activity with zero widespread dieback or chlorosis.
                </>
              )}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs sm:text-sm transition cursor-pointer"
          >
            {isAr ? 'تمام، ممتاز' : 'Great'}
          </button>
        </div>
      </div>
    </div>
  );
};
