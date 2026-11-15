import React, { useRef, useState } from 'react';
import {
  Camera,
  Check,
  Eye,
  Layers,
  ScanSearch,
  Sprout,
  Upload,
  X,
} from 'lucide-react';
import { Language } from '../types/agro';
import {
  VisualLeafPhotoAnalysis,
  ZoneCropRecognitionResult,
  analyzePlantPhotoDataUrl,
  buildCalibratedSampleLeafAnalysis,
} from '../utils/cropRecognitionEngine';

interface CropRecognitionPanelProps {
  language: Language;
  recognition: ZoneCropRecognitionResult;
  currentCropId: string;
  onApplyRecognizedCrop: (cropId: string) => void;
  showCropDistributionOnMap: boolean;
  onToggleCropDistributionOnMap: () => void;
  visualAnalysis: VisualLeafPhotoAnalysis | null;
  onChangeVisualAnalysis: (analysis: VisualLeafPhotoAnalysis | null) => void;
}

export const CropRecognitionPanel: React.FC<CropRecognitionPanelProps> = ({
  language,
  recognition,
  currentCropId,
  onApplyRecognizedCrop,
  showCropDistributionOnMap,
  onToggleCropDistributionOnMap,
  visualAnalysis,
  onChangeVisualAnalysis,
}) => {
  const isAr = language === 'ar';
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const primary = recognition.primaryCandidate;
  if (!primary) return null;

  const isAlreadyApplied = currentCropId === primary.crop.id;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result || '');
      setUploadedPreviewUrl(dataUrl);
      const result = await analyzePlantPhotoDataUrl(dataUrl, file.name);
      onChangeVisualAnalysis(result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      {/* Compact Predicted Crop & Map Distribution Bar */}
      <div
        data-testid="predicted-crop-summary-bar"
        className="pointer-events-auto bg-slate-900/95 backdrop-blur-md border border-emerald-500/50 rounded-xl px-3 py-1.5 shadow-lg flex flex-wrap items-center justify-between gap-2 text-xs text-slate-100"
      >
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="flex items-center gap-1.5 font-bold text-emerald-400 whitespace-nowrap shrink-0">
            <ScanSearch className="w-4 h-4 shrink-0" />
            <span>{isAr ? 'المحصول المزروع المكتشف:' : 'Detected Planted Crop:'}</span>
          </span>

          <div
            data-testid="detected-crop-primary-badge"
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-950/90 border border-emerald-500/50 font-bold text-white whitespace-nowrap shrink-0"
          >
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 border border-white/60"
              style={{ backgroundColor: primary.signature.mapColorHex }}
            />
            <span>{isAr ? primary.crop.nameAr : primary.crop.nameEn}</span>
            <span aria-hidden="true" className="text-emerald-400">
              ·
            </span>
            <span
              data-testid="detected-crop-confidence-pct"
              className="font-mono text-emerald-300 tabular-nums"
            >
              {isAr ? `ثقة ${primary.confidencePct}%` : `${primary.confidencePct}% Conf`}
            </span>
          </div>

          <span className="text-[11px] text-slate-300 whitespace-nowrap shrink-0 hidden md:inline">
            {isAr ? primary.detectedStageAr : primary.detectedStageEn}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Toggle Crop Distribution Coloring on Map */}
          <button
            type="button"
            data-testid="toggle-crop-distribution-map-btn"
            onClick={onToggleCropDistributionOnMap}
            className={`min-h-[28px] px-2.5 py-0.5 rounded-lg text-[11px] font-bold flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
              showCropDistributionOnMap
                ? 'bg-emerald-600 text-white ring-1 ring-emerald-300 shadow-xs'
                : 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/40'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>
              {showCropDistributionOnMap
                ? isAr
                  ? 'خريطة توزيع المحاصيل نشطة ✓'
                  : 'Crop Map Active ✓'
                : isAr
                ? 'تلوين توزيع المحاصيل بالزونة'
                : 'Color Crop Distribution'}
            </span>
          </button>

          {/* Open Detailed Crop Recognition & Leaf Photo Card */}
          <button
            type="button"
            data-testid="open-crop-recognition-card-btn"
            onClick={() => setIsExpanded((prev) => !prev)}
            className={`min-h-[28px] px-2.5 py-0.5 rounded-lg text-[11px] font-bold flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
              isExpanded
                ? 'bg-sky-600 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-500/40'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>
              {isAr
                ? 'بطاقة تشخيص المحصول وصورة النبات'
                : 'Crop Diagnosis & Leaf Photo'}
            </span>
          </button>

          {!isAlreadyApplied && (
            <button
              type="button"
              data-testid="quick-apply-detected-crop-btn"
              onClick={() => onApplyRecognizedCrop(primary.crop.id)}
              className="min-h-[28px] px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isAr ? 'اعتماد المحصول للزونة' : 'Apply to Zone'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Expanded Diagnostic Card for Spectral + Seasonal + Visual Leaf Crop Identification */}
      {isExpanded && (
        <div
          data-testid="crop-recognition-card"
          className="pointer-events-auto bg-slate-900/96 backdrop-blur-xl border border-emerald-500/60 rounded-2xl p-4 shadow-2xl text-slate-100 max-w-3xl w-full self-center space-y-3.5 max-h-[74vh] overflow-y-auto"
        >
          <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-2.5">
            <div>
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold">
                <Sprout className="w-4 h-4" />
                <span>
                  {isAr
                    ? 'نظام التعرف الذكي على المحصول المزروع (البصمة الطيفية + الموسم + فحص الورقة)'
                    : 'Intelligent Planted Crop Recognition (Spectral + Season + Leaf Vision)'}
                </span>
              </div>
              <h3 className="text-base font-bold text-white mt-0.5">
                {isAr ? primary.crop.nameAr : primary.crop.nameEn}{' '}
                <span className="text-xs font-mono text-emerald-300">
                  ({primary.crop.scientificName})
                </span>
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Top Metrics Grid: Confidence, Spectral Match, Season Match, Cultivated Area */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-2.5">
              <div className="text-slate-400 text-[11px]">
                {isAr ? 'نسبة الثقة الإجمالية' : 'Overall Confidence'}
              </div>
              <div className="text-lg font-mono font-bold text-emerald-400 tabular-nums mt-0.5">
                {primary.confidencePct}%
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {isAr ? 'مطابقة متعددة الأطياف' : 'Multi-spectral fusion'}
              </div>
            </div>

            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-2.5">
              <div className="text-slate-400 text-[11px]">
                {isAr ? 'تطابق البصمة الفضائية' : 'Satellite Spectral Fit'}
              </div>
              <div className="text-lg font-mono font-bold text-sky-400 tabular-nums mt-0.5">
                {primary.spectralMatchPct}%
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                NDVI · NDWI · SAVI · EVI
              </div>
            </div>

            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-2.5">
              <div className="text-slate-400 text-[11px]">
                {isAr ? 'توافق الموسم والتربة' : 'Season & Soil Fit'}
              </div>
              <div className="text-lg font-mono font-bold text-amber-300 tabular-nums mt-0.5">
                {Math.round((primary.seasonalMatchPct + primary.soilMatchPct) / 2)}%
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {isAr ? primary.crop.seasonAr : primary.crop.seasonEn}
              </div>
            </div>

            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-2.5">
              <div className="text-slate-400 text-[11px]">
                {isAr ? 'المساحة المنزرعة بالمحصول' : 'Cultivated Crop Area'}
              </div>
              <div className="text-lg font-mono font-bold text-white tabular-nums mt-0.5">
                {primary.cultivatedAreaFeddans}{' '}
                <span className="text-xs font-normal text-slate-400">
                  {isAr ? 'فدان' : 'fed'}
                </span>
              </div>
              <div className="text-[10px] text-emerald-400 mt-0.5">
                {primary.cultivatedSharePct}% {isAr ? 'من خلايا الزونة' : 'of zone cells'}
              </div>
            </div>
          </div>

          {/* Scientific Explanation & Stage */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-300">
                {isAr
                  ? `المرحلة العمرية المرصودة: ${primary.detectedStageAr}`
                  : `Detected Growth Stage: ${primary.detectedStageEn}`}
              </span>
              <span className="font-mono text-[11px] text-slate-400">
                {primary.cultivatedCellsCount} {isAr ? 'خلية زراعية' : 'crop cells'}
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              {isAr ? primary.reasoningAr : primary.reasoningEn}
            </p>
          </div>

          {/* Spatial Crop & Land-Cover Distribution inside the Zone */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-200">
                {isAr
                  ? 'خريطة توزيع المحاصيل والغطاء الأرضي داخل خلايا الزونة:'
                  : 'Crop & Land-Cover Distribution Across Zone Cells:'}
              </span>
              <button
                type="button"
                onClick={onToggleCropDistributionOnMap}
                className="text-[11px] font-bold text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>
                  {showCropDistributionOnMap
                    ? isAr
                      ? 'إخفاء تلوين المحاصيل والعودة للمؤشر'
                      : 'Return to Index Color Map'
                    : isAr
                    ? 'عرض تلوين المحاصيل على الخريطة'
                    : 'Show Crop Colors on Map'}
                </span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {recognition.distributionBreakdown.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between bg-slate-950/90 border border-slate-800 rounded-xl px-3 py-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-sm shrink-0 border border-white/40"
                      style={{ backgroundColor: item.colorHex }}
                    />
                    <span className="font-semibold text-white">
                      {isAr ? item.labelAr : item.labelEn}
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-slate-300 tabular-nums">
                    {item.areaFeddans} {isAr ? 'فدان' : 'fed'} ({item.sharePct}%)
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top 4 Candidate Crops Comparison Table */}
          <div className="space-y-1.5">
            <div className="text-xs font-bold text-slate-200">
              {isAr
                ? 'ترتيب المحاصيل المرشحة حسب تطابق البصمة الطيفية والموسم:'
                : 'Candidate Crops Ranked by Spectral & Seasonal Signature:'}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {recognition.candidates.map((cand, idx) => (
                <div
                  key={cand.crop.id}
                  className={`flex items-center justify-between rounded-xl px-3 py-2 border text-xs ${
                    idx === 0
                      ? 'bg-emerald-950/50 border-emerald-500/60'
                      : 'bg-slate-950/70 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cand.signature.mapColorHex }}
                    />
                    <div className="truncate">
                      <div className="font-bold text-white truncate">
                        {idx + 1}. {isAr ? cand.crop.nameAr : cand.crop.nameEn}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {isAr ? 'طيفي:' : 'Spec:'} {cand.spectralMatchPct}% ·{' '}
                        {isAr ? 'موسم:' : 'Season:'} {cand.seasonalMatchPct}%
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono font-bold text-emerald-400 tabular-nums">
                      {cand.confidencePct}%
                    </span>
                    <button
                      type="button"
                      data-testid={`select-recognized-crop-${cand.crop.id}`}
                      onClick={() => onApplyRecognizedCrop(cand.crop.id)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                        currentCropId === cand.crop.id
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                    >
                      {currentCropId === cand.crop.id
                        ? isAr
                          ? 'معتمد ✓'
                          : 'Active ✓'
                        : isAr
                        ? 'اعتماد'
                        : 'Select'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Field Plant Leaf Photo Upload & Optical ExG Analyzer */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5" />
                  <span>
                    {isAr
                      ? 'تأكيد المحصول عبر رفع صورة للنبات أو أوراق الحقل (Excess Green ExG Vision)'
                      : 'Confirm Crop via Field Plant/Leaf Photo (Excess Green ExG Vision)'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {isAr
                    ? 'ارفع صورة لأوراق النبات من الحقل أو اختر عينة مرجعية لدمج البصمة البصرية للورقة مع بيانات القمر الصناعي'
                    : 'Upload a field leaf photo or pick a reference sample to fuse leaf optical ExG with satellite spectra'}
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  data-testid="upload-plant-photo-input"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  data-testid="trigger-upload-plant-photo-btn"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isAr ? 'رفع صورة للنبات' : 'Upload Plant Photo'}</span>
                </button>
                {visualAnalysis && (
                  <button
                    type="button"
                    onClick={() => {
                      setUploadedPreviewUrl(null);
                      onChangeVisualAnalysis(null);
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer"
                  >
                    {isAr ? 'مسح الصورة' : 'Clear'}
                  </button>
                )}
              </div>
            </div>

            {/* Reference Field Leaf Presets for Instant Verification */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-slate-400">
                {isAr ? 'عينات حقلية سريعة المعايرة:' : 'Quick Field Samples:'}
              </span>
              {(
                [
                  { id: 'wheat', ar: 'ورقة قمح (سخا 95)', en: 'Wheat Leaf' },
                  { id: 'clover', ar: 'برسيم مسقاوي', en: 'Clover Canopy' },
                  { id: 'fava_bean', ar: 'ورقة فول بلدي', en: 'Fava Bean Leaf' },
                  { id: 'sugar_beet', ar: 'ورقة بنجر السكر', en: 'Sugar Beet Leaf' },
                ] as const
              ).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  data-testid={`sample-leaf-btn-${s.id}`}
                  onClick={() => {
                    setUploadedPreviewUrl(null);
                    onChangeVisualAnalysis(buildCalibratedSampleLeafAnalysis(s.id));
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] text-slate-200 cursor-pointer"
                >
                  {isAr ? s.ar : s.en}
                </button>
              ))}
            </div>

            {visualAnalysis && (
              <div
                data-testid="visual-leaf-analysis-result"
                className="bg-slate-900 border border-sky-500/40 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  {uploadedPreviewUrl && (
                    <img
                      src={uploadedPreviewUrl}
                      alt="Uploaded crop leaf"
                      referrerPolicy="no-referrer"
                      className="w-11 h-11 rounded-lg object-cover border border-slate-700 shrink-0"
                    />
                  )}
                  <div>
                    <div className="font-bold text-sky-300">
                      {isAr ? visualAnalysis.sourceLabelAr : visualAnalysis.sourceLabelEn}
                    </div>
                    <div className="text-[11px] font-mono text-slate-300 mt-0.5">
                      ExG={visualAnalysis.excessGreenExG} · Chlorophyll={visualAnalysis.greenFractionPct}% · Texture={visualAnalysis.canopyTextureContrast}
                    </div>
                  </div>
                </div>
                <div className="font-mono text-xs font-bold text-emerald-400">
                  +{visualAnalysis.visualConfidenceBoostPct}%{' '}
                  {isAr ? 'دعم بصري للبصمة' : 'Visual Match Boost'}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              data-testid="apply-detected-crop-btn"
              onClick={() => {
                onApplyRecognizedCrop(primary.crop.id);
                setIsExpanded(false);
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>
                {isAr
                  ? `اعتماد «${primary.crop.nameAr.split('(')[0].trim()}» كمحصول الزونة النشطة`
                  : `Apply "${primary.crop.nameEn.split('(')[0].trim()}" to Active Zone`}
              </span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
