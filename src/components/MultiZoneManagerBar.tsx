import React, { useState } from 'react';
import {
  CheckSquare,
  Cloud,
  Edit3,
  Layers,
  LogIn,
  MapPin,
  Plus,
  Scale,
  Sliders,
  Square,
  Trash2,
  X,
} from 'lucide-react';
import {
  IrrigationSystem,
  Language,
  LatLon,
  SoilProfile,
  SoilTexture,
  UserStudyZone,
} from '../types/agro';
import {
  CROP_DATABASE,
  calculateGeodesicArea,
  resolveCustomCropReference,
  resolveCustomSoilTextureReference,
} from '../utils/agroEngine';

export interface PendingZoneDraft {
  vertices: LatLon[];
  defaultNameAr: string;
  defaultNameEn: string;
}

export interface AuthUserSummary {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export interface ZoneDraftConfirmPayload {
  nameAr: string;
  nameEn: string;
  categoryAr: string;
  categoryEn: string;
  soilTexture: SoilTexture;
  customTextureLabel?: string;
  salinityEC?: number;
  ph?: number;
  organicMatterPct?: number;
  irrigation?: IrrigationSystem;
  cropId: string;
  customCropLabel?: string;
}

interface MultiZoneManagerBarProps {
  language: Language;
  zones: UserStudyZone[];
  activeZoneId: string | null;
  comparedZoneIds: string[];
  onSelectActiveZone: (zoneId: string) => void;
  onToggleCompareZone: (zoneId: string) => void;
  onStartDrawingNewZone: (mode: 'rectangle' | 'polygon') => void;
  onRenameZone: (zoneId: string, newNameAr: string, newCategoryAr: string) => void;
  onUpdateZoneSoil?: (zoneId: string, nextSoil: SoilProfile) => void;
  onDeleteZone: (zoneId: string) => void;
  onClearAllZones: () => void;
  pendingDraft: PendingZoneDraft | null;
  onConfirmPendingDraft: (config: ZoneDraftConfirmPayload) => void;
  onCancelPendingDraft: () => void;
  isDrawingNewZone: boolean;
  drawingMode: 'none' | 'polygon' | 'rectangle';
  detectedCropId?: string;
  detectedCropConfidencePct?: number;
  currentUser?: AuthUserSummary | null;
  isAuthLoading?: boolean;
  onSignInAndConfirmPendingDraft?: (config: ZoneDraftConfirmPayload) => void;
}

const ZONE_CATEGORIES = [
  {
    ar: 'حقل محاصيل حقلية مروي',
    en: 'Irrigated Field Crop Plot',
  },
  {
    ar: 'أرض استصلاح جديدة',
    en: 'New Reclamation Sector',
  },
  {
    ar: 'بستان فاكهة / أشجار مستديمة',
    en: 'Perennial Orchard Zone',
  },
  {
    ar: 'قطاع تجربة وبحث علمي',
    en: 'Scientific Research Plot',
  },
];

const EC_PRESET_OPTIONS = [
  { value: 1.2, ar: 'عذبة (1.2)', en: 'Low (1.2)' },
  { value: 2.2, ar: 'متوسطة (2.2)', en: 'Mod (2.2)' },
  { value: 3.5, ar: 'ملحية (3.5)', en: 'Saline (3.5)' },
  { value: 5.2, ar: 'مرتفعة (5.2)', en: 'High (5.2)' },
];

const PH_PRESET_OPTIONS = [
  { value: 6.5, ar: 'حامضية خفيفة (6.5)', en: '6.5 Mild Acid' },
  { value: 7.2, ar: 'متعادلة مثالية (7.2)', en: '7.2 Neutral' },
  { value: 7.8, ar: 'قلوية خفيفة (7.8)', en: '7.8 Mild Alk' },
  { value: 8.3, ar: 'جيرية قلوية (8.3)', en: '8.3 Calcareous' },
];

const IRRIGATION_OPTIONS: Array<{
  id: IrrigationSystem;
  ar: string;
  en: string;
}> = [
  { id: 'drip', ar: 'تنقيط (Drip)', en: 'Drip' },
  { id: 'pivot', ar: 'بيفوت محوري (Pivot)', en: 'Pivot' },
  { id: 'sprinkler', ar: 'رشاشات (Sprinkler)', en: 'Sprinkler' },
  { id: 'flood', ar: 'غمر تقليدي (Flood)', en: 'Flood' },
  { id: 'rainfed', ar: 'مطري / بعل (Rainfed)', en: 'Rainfed' },
];

export const MultiZoneManagerBar: React.FC<MultiZoneManagerBarProps> = ({
  language,
  zones,
  activeZoneId,
  comparedZoneIds,
  onSelectActiveZone,
  onToggleCompareZone,
  onStartDrawingNewZone,
  onRenameZone,
  onUpdateZoneSoil,
  onDeleteZone,
  onClearAllZones,
  pendingDraft,
  onConfirmPendingDraft,
  onCancelPendingDraft,
  isDrawingNewZone,
  drawingMode,
  detectedCropId,
  detectedCropConfidencePct,
  currentUser,
  isAuthLoading = false,
  onSignInAndConfirmPendingDraft,
}) => {
  const isAr = language === 'ar';
  const [showCompareDrawer, setShowCompareDrawer] = useState<boolean>(false);
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState<string>('');
  const [editCatValue, setEditCatValue] = useState<string>(ZONE_CATEGORIES[0].ar);
  const [editCustomCategory, setEditCustomCategory] = useState<string>('');

  // Per-Zone Interactive Soil Profile Editor Modal State
  const [soilEditZoneId, setSoilEditZoneId] = useState<string | null>(null);
  const [soilEditTextureMode, setSoilEditTextureMode] = useState<SoilTexture | '__custom__'>('clay');
  const [soilEditCustomTexture, setSoilEditCustomTexture] = useState<string>('');
  const [soilEditSalinityEC, setSoilEditSalinityEC] = useState<number>(1.4);
  const [soilEditPh, setSoilEditPh] = useState<number>(7.4);
  const [soilEditOrganicMatter, setSoilEditOrganicMatter] = useState<number>(2.1);
  const [soilEditIrrigation, setSoilEditIrrigation] = useState<IrrigationSystem>('drip');

  // Modal state for newly drawn zone (including manual custom entries + soil profile)
  const [draftName, setDraftName] = useState<string>('');
  const [draftCategoryIdx, setDraftCategoryIdx] = useState<number>(0); // -1 means manual custom entry
  const [draftCustomCategory, setDraftCustomCategory] = useState<string>('');
  const [draftTextureMode, setDraftTextureMode] = useState<SoilTexture | '__custom__'>('clay');
  const [draftCustomTexture, setDraftCustomTexture] = useState<string>('');
  const [draftSalinityEC, setDraftSalinityEC] = useState<number>(1.4);
  const [draftPh, setDraftPh] = useState<number>(7.4);
  const [draftIrrigation, setDraftIrrigation] = useState<IrrigationSystem>('drip');
  const [draftCropId, setDraftCropId] = useState<string>('wheat'); // '__custom__' means manual custom entry
  const [draftCustomCrop, setDraftCustomCrop] = useState<string>('');

  React.useEffect(() => {
    if (pendingDraft) {
      setDraftName(isAr ? pendingDraft.defaultNameAr : pendingDraft.defaultNameEn);
      setDraftCategoryIdx(zones.length % ZONE_CATEGORIES.length);
      setDraftCustomCategory('');
      setDraftTextureMode('clay');
      setDraftCustomTexture('');
      setDraftSalinityEC(1.4);
      setDraftPh(7.4);
      setDraftIrrigation('drip');
      setDraftCustomCrop('');
      if (detectedCropId) {
        setDraftCropId(detectedCropId);
      } else {
        setDraftCropId('wheat');
      }
    }
  }, [pendingDraft, isAr, zones.length, detectedCropId]);

  const openSoilEditorForZone = (z: UserStudyZone) => {
    setSoilEditZoneId(z.id);
    if (z.soil.customTextureLabel) {
      setSoilEditTextureMode('__custom__');
      setSoilEditCustomTexture(z.soil.customTextureLabel);
    } else {
      setSoilEditTextureMode(z.soil.texture);
      setSoilEditCustomTexture('');
    }
    setSoilEditSalinityEC(z.soil.salinityEC);
    setSoilEditPh(z.soil.ph);
    setSoilEditOrganicMatter(z.soil.organicMatterPct ?? 2.0);
    setSoilEditIrrigation(z.soil.irrigation);
  };

  const resolvedCustomSoilPreview = React.useMemo(
    () =>
      draftTextureMode === '__custom__' && draftCustomTexture.trim()
        ? resolveCustomSoilTextureReference(draftCustomTexture)
        : null,
    [draftTextureMode, draftCustomTexture]
  );

  const resolvedCustomCropPreview = React.useMemo(
    () =>
      draftCropId === '__custom__' && draftCustomCrop.trim()
        ? resolveCustomCropReference(draftCustomCrop)
        : null,
    [draftCropId, draftCustomCrop]
  );

  const buildDraftPayload = (): ZoneDraftConfirmPayload => {
    const cleanName = draftName.trim() || (pendingDraft ? pendingDraft.defaultNameAr : 'Study Zone');
    const isCustomCat = draftCategoryIdx === -1;
    const chosenCat = ZONE_CATEGORIES[draftCategoryIdx] || ZONE_CATEGORIES[0];
    const cleanCustomCat = draftCustomCategory.trim() || chosenCat.ar;

    const soilResolution =
      draftTextureMode === '__custom__' && draftCustomTexture.trim()
        ? resolveCustomSoilTextureReference(draftCustomTexture)
        : null;

    const cropResolution =
      draftCropId === '__custom__' && draftCustomCrop.trim()
        ? resolveCustomCropReference(draftCustomCrop)
        : null;

    const boundedEc = Number(
      Math.max(0.2, Math.min(18.0, Number.isFinite(draftSalinityEC) ? draftSalinityEC : 1.4)).toFixed(2)
    );
    const boundedPh = Number(
      Math.max(4.5, Math.min(9.5, Number.isFinite(draftPh) ? draftPh : 7.4)).toFixed(2)
    );

    return {
      nameAr: cleanName,
      nameEn: cleanName,
      categoryAr: isCustomCat ? cleanCustomCat : chosenCat.ar,
      categoryEn: isCustomCat ? cleanCustomCat : chosenCat.en,
      soilTexture: soilResolution
        ? soilResolution.canonicalTexture
        : draftTextureMode === '__custom__'
        ? 'loamy'
        : draftTextureMode,
      ...(soilResolution ? { customTextureLabel: soilResolution.customTextureLabel } : {}),
      salinityEC: boundedEc,
      ph: boundedPh,
      irrigation: draftIrrigation,
      cropId: cropResolution
        ? cropResolution.canonicalCropId
        : draftCropId === '__custom__'
        ? 'wheat'
        : draftCropId,
      ...(cropResolution ? { customCropLabel: cropResolution.customCropLabel } : {}),
    };
  };

  const comparedZones = zones.filter((z) => comparedZoneIds.includes(z.id));
  const draftArea = pendingDraft ? calculateGeodesicArea(pendingDraft.vertices) : null;
  const soilEditTargetZone = zones.find((z) => z.id === soilEditZoneId) || null;

  return (
    <>
      {/* Top Compact Zone Classifier & Selector Bar */}
      <div
        data-testid="multi-zone-classifier-bar"
        className="bg-slate-900/92 backdrop-blur-md border border-slate-700/80 rounded-xl px-2.5 py-1.5 shadow-lg flex flex-wrap items-center justify-between gap-2 text-slate-100"
      >
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 max-w-full">
          <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 whitespace-nowrap shrink-0 px-1">
            <Layers className="w-3.5 h-3.5" />
            {isAr
              ? `مزارعي المسجلة (${zones.length}):`
              : `My Farms (${zones.length}):`}
          </span>

          {zones.length === 0 ? (
            <span
              data-testid="zero-zones-status-badge"
              className="text-[11px] text-amber-300 bg-amber-950/60 border border-amber-500/40 rounded-lg px-2.5 py-1 whitespace-nowrap shrink-0"
            >
              {isDrawingNewZone || drawingMode !== 'none'
                ? isAr
                  ? 'اسحب مستطيلاً على الخريطة أو انقر النقاط لتحديد مزرعتك الأولى...'
                  : 'Drag a rectangle or click points on map to define your first farm...'
                : isAr
                ? 'لا توجد مزارع مسجلة بعد — اضغط «+ إضافة مزرعة» وحدد حدود أرضك على الخريطة'
                : 'No farms defined yet — click "+ Add Farm" to draw your field on map'}
            </span>
          ) : (
            zones.map((z) => {
              const isActive = z.id === activeZoneId;
              const isCompared = comparedZoneIds.includes(z.id);
              return (
                <div
                  key={z.id}
                  data-testid={`zone-chip-${z.id}`}
                  className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] border transition-all whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-emerald-600/95 border-emerald-300 text-white font-bold shadow-sm'
                      : 'bg-slate-800/90 border-slate-700 text-slate-200 hover:border-slate-500'
                  }`}
                >
                  {/* Compare Checkbox */}
                  <button
                    type="button"
                    data-testid={`zone-compare-toggle-${z.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleCompareZone(z.id);
                    }}
                    title={isAr ? 'تحديد هذه الزونة للمقارنة' : 'Select zone for comparison'}
                    className="p-0.5 rounded hover:bg-black/20 text-emerald-200 cursor-pointer"
                  >
                    {isCompared ? (
                      <CheckSquare className="w-3.5 h-3.5 text-amber-300" />
                    ) : (
                      <Square className="w-3.5 h-3.5 opacity-70" />
                    )}
                  </button>

                  {/* Select Active Zone Button */}
                  <button
                    type="button"
                    data-testid={`zone-select-btn-${z.id}`}
                    onClick={() => onSelectActiveZone(z.id)}
                    className="flex items-center gap-1.5 cursor-pointer"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 border border-white/60"
                      style={{ backgroundColor: z.color }}
                    />
                    <span>{isAr ? z.nameAr : z.nameEn}</span>
                    <span className="text-[10px] opacity-80 font-mono tabular-nums">
                      ({z.area.totalFeddansDecimal.toFixed(1)} {isAr ? 'فدان' : 'Fed'} · NDVI{' '}
                      {z.farmAverages.NDVI})
                    </span>
                  </button>

                  {/* Edit Zone Soil Profile Button */}
                  {onUpdateZoneSoil && (
                    <button
                      type="button"
                      data-testid={`zone-soil-edit-btn-${z.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        openSoilEditorForZone(z);
                      }}
                      title={
                        isAr
                          ? 'تحرير ملف التربة والري لهذه الزونة (EC, pH, القوام، الري)'
                          : 'Edit zone soil profile (Texture, EC, pH, Irrigation)'
                      }
                      className="p-0.5 rounded hover:bg-black/25 text-amber-200 cursor-pointer"
                    >
                      <Sliders className="w-3 h-3" />
                    </button>
                  )}

                  {/* Edit Name Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingZoneId(z.id);
                      setEditNameValue(isAr ? z.nameAr : z.nameEn);
                      const isPresetCat = ZONE_CATEGORIES.some((c) => c.ar === z.categoryAr);
                      if (isPresetCat) {
                        setEditCatValue(z.categoryAr);
                        setEditCustomCategory('');
                      } else {
                        setEditCatValue('__custom__');
                        setEditCustomCategory(z.categoryAr);
                      }
                    }}
                    title={isAr ? 'تعديل اسم وتصنيف الزونة' : 'Rename zone'}
                    className="p-0.5 rounded hover:bg-black/25 text-slate-200 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>

                  {/* Delete Single Zone Button */}
                  <button
                    type="button"
                    data-testid={`zone-delete-btn-${z.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteZone(z.id);
                    }}
                    title={isAr ? 'حذف هذه الزونة' : 'Delete this zone'}
                    className="p-0.5 rounded hover:bg-rose-600/80 text-rose-200 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Action Buttons: Add New Zone, Compare Selected Zones, Clear All */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            data-testid="add-new-zone-rect-btn"
            onClick={() => onStartDrawingNewZone('rectangle')}
            className="min-h-[30px] px-2.5 py-1 rounded-lg text-[11px] font-bold bg-sky-600 hover:bg-sky-500 text-white flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAr ? '+ إضافة مزرعة (بمستطيل)' : '+ Add Farm (Rectangle)'}</span>
          </button>

          <button
            type="button"
            data-testid="add-new-zone-poly-btn"
            onClick={() => onStartDrawingNewZone('polygon')}
            className="min-h-[30px] px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer shadow-sm"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>{isAr ? '+ إضافة مزرعة (بنقاط حرة)' : '+ Add Farm (Polygon)'}</span>
          </button>

          {zones.length >= 2 && (
            <button
              type="button"
              data-testid="open-zone-comparison-btn"
              onClick={() => setShowCompareDrawer(!showCompareDrawer)}
              className={`min-h-[30px] px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer border ${
                showCompareDrawer || comparedZones.length >= 2
                  ? 'bg-amber-500 text-slate-950 border-amber-300'
                  : 'bg-slate-800 text-amber-300 border-amber-500/40 hover:bg-slate-700'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>
                {isAr
                  ? `مقارنة مزارعي (${comparedZones.length >= 2 ? comparedZones.length : zones.length})`
                  : `Compare Farms (${comparedZones.length >= 2 ? comparedZones.length : zones.length})`}
              </span>
            </button>
          )}

          {zones.length > 0 && (
            <button
              type="button"
              data-testid="clear-all-zones-btn"
              onClick={onClearAllZones}
              className="min-h-[30px] px-2 py-1 rounded-lg text-[11px] font-bold bg-rose-600/90 hover:bg-rose-500 text-white flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>{isAr ? 'مسح كل المزارع' : 'Clear All'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Naming, Classification & Soil Profile Modal Upon Finishing Drawing a Zone */}
      {pendingDraft && (
        <div
          data-testid="new-zone-naming-modal"
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="w-full max-w-lg max-h-[90dvh] overflow-y-auto bg-slate-900 border border-emerald-500/50 rounded-2xl p-5 text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[11px] font-bold text-emerald-400">
                  {isAr ? 'تم تحديد حدود المزرعة بنجاح' : 'Farm Boundary Captured'}
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {isAr
                    ? 'تسمية المزرعة وإعداد ملف التربة والري'
                    : 'Name Farm & Configure Soil Profile'}
                </h3>
              </div>
              {draftArea && (
                <span className="px-2.5 py-1 rounded-lg bg-emerald-950/90 border border-emerald-500/40 text-xs font-mono font-bold text-emerald-300 tabular-nums">
                  {draftArea.totalFeddansDecimal.toFixed(2)} {isAr ? 'فدان' : 'Fed'} (
                  {draftArea.hectares.toFixed(2)} ha)
                </span>
              )}
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {isAr ? 'اسم المزرعة المخصص:' : 'Custom Farm Name:'}
                </label>
                <input
                  type="text"
                  data-testid="new-zone-name-input"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  placeholder={isAr ? 'مثال: حقل القمح الشمالي - مزرعتي 1' : 'e.g. North Wheat Plot 1'}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-400 rounded-xl px-3 py-2 text-sm text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {isAr ? 'تصنيف المزرعة:' : 'Farm Classification:'}
                </label>
                <select
                  data-testid="new-zone-category-select"
                  value={draftCategoryIdx}
                  onChange={(e) => setDraftCategoryIdx(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
                >
                  {ZONE_CATEGORIES.map((cat, idx) => (
                    <option key={cat.en} value={idx}>
                      {isAr ? cat.ar : cat.en}
                    </option>
                  ))}
                  <option value={-1}>
                    {isAr ? 'أخرى / كتابة تصنيف يدوي...' : 'Other / Type custom classification...'}
                  </option>
                </select>
                {draftCategoryIdx === -1 && (
                  <input
                    type="text"
                    data-testid="new-zone-custom-category-input"
                    value={draftCustomCategory}
                    onChange={(e) => setDraftCustomCategory(e.target.value)}
                    placeholder={
                      isAr
                        ? 'اكتب تصنيف الزونة يدوياً (مثال: صوبة زراعية، مزرعة نخيل، مشتل...)'
                        : 'Type custom classification (e.g., Greenhouse, Palm Grove)...'
                    }
                    className="mt-1.5 w-full bg-slate-950 border border-emerald-500/60 focus:border-emerald-400 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {isAr ? 'قوام التربة (Soil Texture):' : 'Soil Texture:'}
                  </label>
                  <select
                    data-testid="new-zone-soil-select"
                    value={draftTextureMode}
                    onChange={(e) =>
                      setDraftTextureMode(e.target.value as SoilTexture | '__custom__')
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white outline-none"
                  >
                    <option value="clay">{isAr ? 'طينية ثقيلة (Clay)' : 'Clay (Delta)'}</option>
                    <option value="loamy">{isAr ? 'طميية صفراء (Loamy)' : 'Loamy Balanced'}</option>
                    <option value="sandy">{isAr ? 'رملية (Sandy)' : 'Sandy'}</option>
                    <option value="calcareous">{isAr ? 'جيرية كلسية (Calcareous)' : 'Calcareous'}</option>
                    <option value="__custom__">
                      {isAr ? 'أخرى / كتابة قوام يدوي...' : 'Other / Custom texture...'}
                    </option>
                  </select>
                  {draftTextureMode === '__custom__' && (
                    <div className="mt-1.5 space-y-1">
                      <input
                        type="text"
                        data-testid="new-zone-custom-soil-input"
                        value={draftCustomTexture}
                        onChange={(e) => setDraftCustomTexture(e.target.value)}
                        placeholder={
                          isAr
                            ? 'اكتب قوام التربة (مثال: طينية رملية سوداء)...'
                            : 'Type custom soil texture (e.g., Silty Clay Loam)...'
                        }
                        className="w-full bg-slate-950 border border-emerald-500/60 focus:border-emerald-400 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none"
                      />
                      {resolvedCustomSoilPreview && (
                        <div className="text-[10px] text-emerald-300 font-mono">
                          {isAr
                            ? `مرجع علمي مطابق: ${resolvedCustomSoilPreview.canonicalTexture}`
                            : `Scientific match: ${resolvedCustomSoilPreview.canonicalTexture}`}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {isAr ? 'نظام الري (Irrigation System):' : 'Irrigation System:'}
                  </label>
                  <select
                    data-testid="new-zone-irrigation-select"
                    value={draftIrrigation}
                    onChange={(e) => setDraftIrrigation(e.target.value as IrrigationSystem)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white outline-none"
                  >
                    {IRRIGATION_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {isAr ? opt.ar : opt.en}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Salinity EC & Soil pH Predefined Presets + Custom Numeric Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-semibold">
                      {isAr ? 'ملوحة التربة (EC dS/m):' : 'Salinity (EC dS/m):'}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.2"
                      max="18"
                      data-testid="new-zone-ec-input"
                      value={draftSalinityEC}
                      onChange={(e) => setDraftSalinityEC(parseFloat(e.target.value) || 0)}
                      className="w-20 bg-slate-900 border border-slate-700 focus:border-emerald-400 rounded-lg px-2 py-1 text-xs font-mono font-bold text-emerald-300 text-end outline-none tabular-nums"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {EC_PRESET_OPTIONS.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setDraftSalinityEC(p.value)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-mono cursor-pointer border ${
                          Math.abs(draftSalinityEC - p.value) < 0.05
                            ? 'bg-emerald-600 border-emerald-400 text-white font-bold'
                            : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        {isAr ? p.ar : p.en}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-semibold">
                      {isAr ? 'تفاعل التربة (Soil pH):' : 'Soil pH:'}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="4.5"
                      max="9.5"
                      data-testid="new-zone-ph-input"
                      value={draftPh}
                      onChange={(e) => setDraftPh(parseFloat(e.target.value) || 7.0)}
                      className="w-20 bg-slate-900 border border-slate-700 focus:border-emerald-400 rounded-lg px-2 py-1 text-xs font-mono font-bold text-cyan-300 text-end outline-none tabular-nums"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {PH_PRESET_OPTIONS.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setDraftPh(p.value)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-mono cursor-pointer border ${
                          Math.abs(draftPh - p.value) < 0.05
                            ? 'bg-cyan-600 border-cyan-400 text-white font-bold'
                            : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        {isAr ? p.ar : p.en}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {isAr
                    ? 'المحصول المزروع (مكتشف طيفياً):'
                    : 'Planted Crop (Spectrally Detected):'}
                </label>
                <select
                  data-testid="new-zone-crop-select"
                  value={draftCropId}
                  onChange={(e) => setDraftCropId(e.target.value)}
                  className="w-full bg-slate-950 border border-emerald-500/60 rounded-xl px-2.5 py-2 text-xs text-white outline-none"
                >
                  {CROP_DATABASE.map((c) => (
                    <option key={c.id} value={c.id}>
                      {isAr ? c.nameAr : c.nameEn}
                      {detectedCropId === c.id && detectedCropConfidencePct
                        ? isAr
                          ? ` (مكتشف تلقائياً — ثقة ${detectedCropConfidencePct}%)`
                          : ` (Auto-Detected — ${detectedCropConfidencePct}%)`
                        : ''}
                    </option>
                  ))}
                  <option value="__custom__">
                    {isAr ? 'أخرى / كتابة محصول يدوي...' : 'Other / Type custom crop...'}
                  </option>
                </select>
                {draftCropId === '__custom__' && (
                  <div className="mt-1.5 space-y-1">
                    <input
                      type="text"
                      data-testid="new-zone-custom-crop-input"
                      value={draftCustomCrop}
                      onChange={(e) => setDraftCustomCrop(e.target.value)}
                      placeholder={
                        isAr
                          ? 'اكتب اسم المحصول (مثال: عنب، مانجو، فراولة، بصل)...'
                          : 'Type crop name (e.g., Mango, Grapes, Onion)...'
                      }
                      className="w-full bg-slate-950 border border-emerald-500/60 focus:border-emerald-400 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none"
                    />
                    {resolvedCustomCropPreview && (
                      <div className="text-[10px] text-emerald-300 font-mono">
                        {isAr
                          ? `مرجع علمي مطابق: ${resolvedCustomCropPreview.matchedReferenceNameAr}`
                          : `Scientific ref: ${resolvedCustomCropPreview.matchedReferenceNameEn}`}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                data-testid="cancel-new-zone-btn"
                onClick={onCancelPendingDraft}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              >
                {isAr ? 'إلغاء الرسم' : 'Cancel'}
              </button>

              {!currentUser && onSignInAndConfirmPendingDraft && (
                <button
                  type="button"
                  data-testid="google-signin-save-zone-btn"
                  disabled={isAuthLoading}
                  onClick={() => onSignInAndConfirmPendingDraft(buildDraftPayload())}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 disabled:opacity-60 text-white shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>
                    {isAr ? 'حفظ والمزامنة بحساب جوجل' : 'Sign in with Google & Save'}
                  </span>
                </button>
              )}

              <button
                type="button"
                data-testid="confirm-new-zone-btn"
                onClick={() => onConfirmPendingDraft(buildDraftPayload())}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                {currentUser && <Cloud className="w-3.5 h-3.5" />}
                <span>
                  {currentUser
                    ? isAr
                      ? 'حفظ ومزامنة في السحابة'
                      : 'Save & Sync to Cloud'
                    : isAr
                    ? 'حفظ المزرعة وبدء التحليل العلمي'
                    : 'Save Farm & Analyze'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Per-Zone Soil Profile Interactive Editing Modal */}
      {soilEditZoneId && soilEditTargetZone && onUpdateZoneSoil && (
        <div
          data-testid="zone-soil-profile-modal"
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="w-full max-w-md bg-slate-900 border border-emerald-500/50 rounded-2xl p-5 text-slate-100 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div>
                <span className="text-[11px] font-bold text-emerald-400">
                  {isAr ? 'ملف التربة والري المخصص للمزرعة' : 'Farm Soil & Irrigation Profile'}
                </span>
                <h4 className="text-sm font-bold text-white mt-0.5">
                  {isAr ? soilEditTargetZone.nameAr : soilEditTargetZone.nameEn}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSoilEditZoneId(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {isAr ? 'قوام التربة (Soil Texture):' : 'Soil Texture:'}
                </label>
                <select
                  data-testid="zone-soil-modal-texture-select"
                  value={soilEditTextureMode}
                  onChange={(e) =>
                    setSoilEditTextureMode(e.target.value as SoilTexture | '__custom__')
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
                >
                  <option value="clay">{isAr ? 'طينية (Clay)' : 'Clay'}</option>
                  <option value="loamy">{isAr ? 'طميية صفراء (Loamy)' : 'Loamy'}</option>
                  <option value="sandy">{isAr ? 'رملية (Sandy)' : 'Sandy'}</option>
                  <option value="calcareous">{isAr ? 'جيرية (Calcareous)' : 'Calcareous'}</option>
                  <option value="__custom__">
                    {isAr ? 'أخرى / كتابة يدوية...' : 'Other / Custom texture...'}
                  </option>
                </select>
                {soilEditTextureMode === '__custom__' && (
                  <input
                    type="text"
                    data-testid="zone-soil-modal-custom-texture"
                    value={soilEditCustomTexture}
                    onChange={(e) => setSoilEditCustomTexture(e.target.value)}
                    placeholder={
                      isAr ? 'اكتب قوام التربة المخصص...' : 'Enter custom soil texture...'
                    }
                    className="mt-1.5 w-full bg-slate-950 border border-emerald-500/60 rounded-xl px-3 py-1.5 text-xs text-white outline-none"
                  />
                )}
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {isAr ? 'نظام الري (Irrigation System):' : 'Irrigation System:'}
                </label>
                <select
                  data-testid="zone-soil-modal-irrigation-select"
                  value={soilEditIrrigation}
                  onChange={(e) => setSoilEditIrrigation(e.target.value as IrrigationSystem)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
                >
                  {IRRIGATION_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {isAr ? opt.ar : opt.en}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-semibold">
                    {isAr ? 'درجة الملوحة (EC dS/m):' : 'Salinity (EC dS/m):'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.2"
                    max="18"
                    data-testid="zone-soil-modal-ec-input"
                    value={soilEditSalinityEC}
                    onChange={(e) => setSoilEditSalinityEC(parseFloat(e.target.value) || 0)}
                    className="w-24 bg-slate-900 border border-slate-700 focus:border-emerald-400 rounded-lg px-2 py-1 text-xs font-mono font-bold text-emerald-300 text-end outline-none tabular-nums"
                  />
                </div>
                <div className="flex flex-wrap gap-1">
                  {EC_PRESET_OPTIONS.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setSoilEditSalinityEC(p.value)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-mono cursor-pointer border ${
                        Math.abs(soilEditSalinityEC - p.value) < 0.05
                          ? 'bg-emerald-600 border-emerald-400 text-white font-bold'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      {isAr ? p.ar : p.en}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-semibold">
                    {isAr ? 'حموضة/قلوية التربة (pH):' : 'Soil pH:'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="4.5"
                    max="9.5"
                    data-testid="zone-soil-modal-ph-input"
                    value={soilEditPh}
                    onChange={(e) => setSoilEditPh(parseFloat(e.target.value) || 7.0)}
                    className="w-24 bg-slate-900 border border-slate-700 focus:border-emerald-400 rounded-lg px-2 py-1 text-xs font-mono font-bold text-cyan-300 text-end outline-none tabular-nums"
                  />
                </div>
                <div className="flex flex-wrap gap-1">
                  {PH_PRESET_OPTIONS.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setSoilEditPh(p.value)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-mono cursor-pointer border ${
                        Math.abs(soilEditPh - p.value) < 0.05
                          ? 'bg-cyan-600 border-cyan-400 text-white font-bold'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      {isAr ? p.ar : p.en}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <label className="text-slate-300 font-semibold">
                  {isAr ? 'المادة العضوية (%):' : 'Organic Matter (%):'}
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.2"
                  max="8.0"
                  value={soilEditOrganicMatter}
                  onChange={(e) => setSoilEditOrganicMatter(parseFloat(e.target.value) || 1.5)}
                  className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono font-bold text-amber-300 text-end outline-none tabular-nums"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSoilEditZoneId(null)}
                className="px-3 py-1.5 rounded-lg text-xs bg-slate-800 text-slate-300 cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                data-testid="zone-soil-modal-save-btn"
                onClick={() => {
                  const customRes =
                    soilEditTextureMode === '__custom__' && soilEditCustomTexture.trim()
                      ? resolveCustomSoilTextureReference(soilEditCustomTexture)
                      : null;
                  const nextTexture: SoilTexture = customRes
                    ? customRes.canonicalTexture
                    : soilEditTextureMode === '__custom__'
                    ? soilEditTargetZone.soil.texture
                    : soilEditTextureMode;
                  const nextSoil: SoilProfile = {
                    ...soilEditTargetZone.soil,
                    texture: nextTexture,
                    customTextureLabel: customRes
                      ? customRes.customTextureLabel
                      : soilEditTextureMode === '__custom__'
                      ? soilEditCustomTexture.trim() || undefined
                      : undefined,
                    salinityEC: Number(
                      Math.max(0.2, Math.min(18, soilEditSalinityEC || 1.4)).toFixed(2)
                    ),
                    ph: Number(Math.max(4.5, Math.min(9.5, soilEditPh || 7.4)).toFixed(2)),
                    organicMatterPct: Number(
                      Math.max(0.2, Math.min(8, soilEditOrganicMatter || 1.8)).toFixed(2)
                    ),
                    irrigation: soilEditIrrigation,
                  };
                  onUpdateZoneSoil(soilEditZoneId, nextSoil);
                  setSoilEditZoneId(null);
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
              >
                {isAr ? 'حفظ وتحديث المؤشرات والتوصيات' : 'Save & Recalculate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Existing Zone Modal */}
      {editingZoneId && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-4 text-slate-100 space-y-3 shadow-2xl">
            <h4 className="text-sm font-bold text-white">
              {isAr ? 'تعديل اسم وتصنيف المزرعة' : 'Rename & Classify Farm'}
            </h4>
            <input
              type="text"
              value={editNameValue}
              onChange={(e) => setEditNameValue(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
            />
            <select
              value={editCatValue}
              onChange={(e) => setEditCatValue(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
            >
              {ZONE_CATEGORIES.map((c) => (
                <option key={c.ar} value={c.ar}>
                  {isAr ? c.ar : c.en}
                </option>
              ))}
              <option value="__custom__">
                {isAr ? 'أخرى / كتابة تصنيف يدوي...' : 'Other / Custom classification...'}
              </option>
            </select>
            {editCatValue === '__custom__' && (
              <input
                type="text"
                value={editCustomCategory}
                onChange={(e) => setEditCustomCategory(e.target.value)}
                placeholder={isAr ? 'اكتب التصنيف الجديد يدوياً...' : 'Type custom classification...'}
                className="w-full bg-slate-950 border border-emerald-500/60 rounded-xl px-3 py-2 text-xs text-white outline-none"
              />
            )}
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setEditingZoneId(null)}
                className="px-3 py-1.5 rounded-lg text-xs bg-slate-800 text-slate-300 cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  const finalCat =
                    editCatValue === '__custom__'
                      ? editCustomCategory.trim() || ZONE_CATEGORIES[0].ar
                      : editCatValue;
                  if (editNameValue.trim()) {
                    onRenameZone(editingZoneId, editNameValue.trim(), finalCat);
                  }
                  setEditingZoneId(null);
                }}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white cursor-pointer"
              >
                {isAr ? 'حفظ التعديلات' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Multi-Zone Comparison Modal on Map */}
      {showCompareDrawer && zones.length >= 2 && (
        <div
          data-testid="floating-zone-comparison-modal"
          className="fixed inset-x-4 top-28 z-40 max-w-4xl mx-auto bg-slate-900/95 backdrop-blur-xl border border-amber-400/50 rounded-2xl p-4 text-slate-100 shadow-2xl space-y-3 max-h-[70dvh] overflow-y-auto"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">
                {isAr
                  ? 'لوحة المقارنة المباشرة بين مزارعي المحددة'
                  : 'Side-by-Side Multi-Farm Comparison'}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowCompareDrawer(false)}
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/90 text-slate-300 border-b border-slate-800">
                  <th className="p-2 text-start">{isAr ? 'اسم المزرعة' : 'Farm Name'}</th>
                  <th className="p-2 text-start">{isAr ? 'التربة والري' : 'Soil & Irrig'}</th>
                  <th className="p-2 text-start">{isAr ? 'المساحة' : 'Area'}</th>
                  <th className="p-2 text-start">NDVI</th>
                  <th className="p-2 text-start">NDWI</th>
                  <th className="p-2 text-start">SAVI</th>
                  <th className="p-2 text-start">{isAr ? 'رطوبة 0-7سم' : 'SM 0-7cm'}</th>
                  <th className="p-2 text-start">EC dS/m</th>
                  <th className="p-2 text-start">pH</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono tabular-nums">
                {(comparedZones.length >= 2 ? comparedZones : zones).map((z) => (
                  <tr
                    key={z.id}
                    onClick={() => onSelectActiveZone(z.id)}
                    className={`cursor-pointer transition-colors ${
                      z.id === activeZoneId ? 'bg-emerald-950/40' : 'hover:bg-slate-800/50'
                    }`}
                  >
                    <td className="p-2 font-sans font-bold text-white flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: z.color }}
                      />
                      <span>{isAr ? z.nameAr : z.nameEn}</span>
                    </td>
                    <td className="p-2 font-sans text-slate-300">
                      {z.soil.customTextureLabel || z.soil.texture} · {z.soil.irrigation}
                    </td>
                    <td className="p-2 text-emerald-300">
                      {z.area.totalFeddansDecimal.toFixed(2)} {isAr ? 'فدان' : 'Fed'}
                    </td>
                    <td className="p-2 font-bold text-emerald-400">{z.farmAverages.NDVI}</td>
                    <td className="p-2 text-sky-300">{z.farmAverages.NDWI}</td>
                    <td className="p-2 text-lime-300">{z.farmAverages.SAVI}</td>
                    <td className="p-2 text-cyan-300">{z.farmAverages.SM_0_7}%</td>
                    <td className="p-2 text-rose-300">{z.soil.salinityEC}</td>
                    <td className="p-2 text-amber-300">{z.soil.ph}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
};
