import {
  AdvisorCreateZonePayload,
  AdvisorInlineWidgetType,
  AdvisorSiteAction,
  AdvisorUpdateSoilOrCropPayload,
  IrrigationSystem,
  Language,
  LatLon,
  MainTabId,
  PestSeverity,
  RotationSeasonSlot,
  SoilTexture,
  SpectralIndexKey,
  ThematicMapLayerId,
  WeeklyChecklistTask,
} from '../types/agro';
import {
  CROP_DATABASE,
  REGIONAL_PEST_CATALOG,
  calculateGeodesicArea,
} from './agroEngine';
import {
  EGYPT_AGRO_REGIONS,
  buildGeodesicRectangleForFeddans,
  extractCropFromText,
  extractSoilAndIrrigationFromText,
  matchAgroRegionFromText,
  normalizeArabicDigits,
} from './advisorCommandEngine';

export interface AdvisorInventoryZoneItem {
  id: string;
  nameAr: string;
  nameEn: string;
  feddans: number;
  cropId: string;
  customCropLabel?: string;
  soilTexture: SoilTexture;
  salinityEC: number;
  ph: number;
  irrigation: IrrigationSystem;
  centroid: LatLon;
}

export interface AdvisorInventoryTaskItem {
  id: string;
  titleAr: string;
  titleEn: string;
  completed: boolean;
  category: WeeklyChecklistTask['category'];
  priority: WeeklyChecklistTask['priority'];
}

export interface AdvisorInventoryIncidentItem {
  id: string;
  pestId: string;
  pestNameAr: string;
  pestNameEn: string;
  subZoneId: 'A' | 'B' | 'C';
  severity: PestSeverity;
  status: 'active' | 'treated';
}

export interface AdvisorSiteInventory {
  language: Language;
  darkMode: boolean;
  activeTab: MainTabId;
  activeLayer: SpectralIndexKey;
  activeThematicMap: ThematicMapLayerId;
  activeZoneId: string | null;
  activeCropId: string;
  activeCentroid: LatLon;
  drawnVerticesCount: number;
  hasActiveZones: boolean;
  pushNotificationsEnabled: boolean;
  comparedZoneIds: string[];
  zones: AdvisorInventoryZoneItem[];
  checklist: AdvisorInventoryTaskItem[];
  incidents: AdvisorInventoryIncidentItem[];
}

export interface GeminiFunctionCallInput {
  id?: string;
  name?: string;
  args?: Record<string, unknown>;
}

export interface GeminiToolExecutionMapping {
  toolActions: AdvisorSiteAction[];
  inlineWidgets: AdvisorInlineWidgetType[];
  functionResponses: Array<{
    id?: string;
    name: string;
    response: {
      ok: boolean;
      result: string;
      details?: Record<string, unknown>;
    };
  }>;
}

const VALID_SPECTRAL_LAYERS: SpectralIndexKey[] = [
  'NDVI',
  'NDWI',
  'SAVI',
  'NDMI',
  'EVI',
  'LST',
  'SM_0_7',
  'SM_7_28',
  'SOIL_EC',
  'SOIL_PH',
];

const VALID_THEMATIC_LAYERS: ThematicMapLayerId[] = [
  'natural',
  'vegetation',
  'soil_moisture',
  'temperature',
  'rainfall',
  'wind',
  'dem_drainage',
];

const VALID_TABS: MainTabId[] = ['atlas', 'indices', 'weather', 'crops', 'advisor'];
const VALID_SLOT_IDS: RotationSeasonSlot['slotId'][] = [
  'past2',
  'past1',
  'current',
  'next1',
  'next2',
];

function strVal(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function numVal(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const parsed = Number(normalizeArabicDigits(v.trim()));
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function boolVal(v: unknown): boolean | undefined {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') {
    const low = v.trim().toLowerCase();
    if (low === 'true') return true;
    if (low === 'false') return false;
  }
  return undefined;
}

export function resolveSoilTextureInput(raw?: string): SoilTexture | undefined {
  if (!raw) return undefined;
  const low = raw.trim().toLowerCase();
  if (low === 'clay' || low === 'sandy' || low === 'loamy' || low === 'calcareous') {
    return low;
  }
  return extractSoilAndIrrigationFromText(raw).soilTexture;
}

export function resolveIrrigationInput(raw?: string): IrrigationSystem | undefined {
  if (!raw) return undefined;
  const low = raw.trim().toLowerCase();
  if (
    low === 'drip' ||
    low === 'pivot' ||
    low === 'sprinkler' ||
    low === 'flood' ||
    low === 'rainfed'
  ) {
    return low;
  }
  return extractSoilAndIrrigationFromText(raw).irrigation;
}

export function resolveCropInput(
  rawCropId?: string,
  rawCustomLabel?: string
): {
  cropId?: string;
  customCropLabel?: string;
  cropNameAr?: string;
  cropNameEn?: string;
} {
  const combined = [rawCropId, rawCustomLabel].filter(Boolean).join(' ').trim();
  if (!combined) return {};

  if (rawCropId) {
    const directId = CROP_DATABASE.find(
      (c) => c.id.toLowerCase() === rawCropId.trim().toLowerCase()
    );
    if (directId) {
      return {
        cropId: directId.id,
        ...(rawCustomLabel?.trim() ? { customCropLabel: rawCustomLabel.trim() } : {}),
        cropNameAr: rawCustomLabel?.trim() || directId.nameAr,
        cropNameEn: rawCustomLabel?.trim() || directId.nameEn,
      };
    }
  }

  const extracted = extractCropFromText(combined);
  if (extracted.cropId) {
    return {
      cropId: extracted.cropId,
      customCropLabel: rawCustomLabel?.trim() || extracted.customCropLabel,
      cropNameAr: rawCustomLabel?.trim() || extracted.cropNameAr,
      cropNameEn: rawCustomLabel?.trim() || extracted.cropNameEn,
    };
  }

  if (rawCustomLabel?.trim()) {
    return {
      cropId: 'wheat',
      customCropLabel: rawCustomLabel.trim(),
      cropNameAr: rawCustomLabel.trim(),
      cropNameEn: rawCustomLabel.trim(),
    };
  }

  return {};
}

export function resolvePestIdInput(raw?: string): string {
  if (!raw) return REGIONAL_PEST_CATALOG[0].id;
  const q = raw.trim().toLowerCase();
  const byId = REGIONAL_PEST_CATALOG.find((p) => p.id.toLowerCase() === q);
  if (byId) return byId.id;

  if (/صدأ|rust/i.test(q)) return 'yellow_rust';
  if (/حشد|دودة|armyworm|faw/i.test(q)) return 'fall_armyworm';
  if (/ندوة|لفحة|blight/i.test(q)) return 'late_blight';
  if (/منّ|من\b|تبقع|aphid|chocolate/i.test(q)) return 'aphids_virus';
  if (/نيماتود|جذور|nematode/i.test(q)) return 'root_knot_nematode';
  if (/توتا|ذبابة\s*بيضاء|حافرة|tuta|whitefly/i.test(q)) return 'tuta_whitefly';

  const byText = REGIONAL_PEST_CATALOG.find(
    (p) =>
      p.nameAr.toLowerCase().includes(q) ||
      p.nameEn.toLowerCase().includes(q) ||
      p.scientificName.toLowerCase().includes(q)
  );
  return byText?.id || REGIONAL_PEST_CATALOG[0].id;
}

export function resolveTargetZoneFromInventory(
  inventory: AdvisorSiteInventory,
  opts: {
    zoneId?: string;
    zoneNameQuery?: string;
    target?: string;
    index?: number;
  }
): AdvisorInventoryZoneItem | undefined {
  const zones = inventory.zones || [];
  if (zones.length === 0) return undefined;

  if (opts.zoneId) {
    const byId = zones.find((z) => z.id === opts.zoneId);
    if (byId) return byId;
  }

  if (typeof opts.index === 'number' && Number.isFinite(opts.index)) {
    const idx = Math.max(0, Math.min(zones.length - 1, Math.round(opts.index) - 1));
    return zones[idx];
  }

  if (opts.zoneNameQuery && opts.zoneNameQuery.trim()) {
    const query = normalizeArabicDigits(opts.zoneNameQuery.trim()).toLowerCase();
    if (/^(?:active|current|الحالية|النشطة)$/i.test(query)) {
      return zones.find((z) => z.id === inventory.activeZoneId) || zones[0];
    }
    if (/^(?:first|الاولى|الأولى|اول|أول|1)$/i.test(query)) {
      return zones[0];
    }
    if (/^(?:last|latest|الاخيرة|الأخيرة|اخر|آخر)$/i.test(query)) {
      return zones[zones.length - 1];
    }
    const exactOrSub = zones.find(
      (z) =>
        z.nameAr.toLowerCase().includes(query) ||
        z.nameEn.toLowerCase().includes(query) ||
        query.includes(z.nameAr.toLowerCase()) ||
        query.includes(z.nameEn.toLowerCase())
    );
    if (exactOrSub) return exactOrSub;
  }

  const targetNorm = (opts.target || '').trim().toLowerCase();
  if (targetNorm === 'first') return zones[0];
  if (targetNorm === 'last' || targetNorm === 'latest') return zones[zones.length - 1];
  if (targetNorm === 'active' || targetNorm === 'current') {
    const active = zones.find((z) => z.id === inventory.activeZoneId);
    if (active) return active;
  }

  return zones.find((z) => z.id === inventory.activeZoneId) || zones[0];
}

function addWidgetUnique(
  list: AdvisorInlineWidgetType[],
  widget: AdvisorInlineWidgetType | undefined
) {
  if (widget && !list.includes(widget)) {
    list.push(widget);
  }
}

export function mapGeminiToolCallsToSiteActions(
  functionCalls: GeminiFunctionCallInput[],
  inventory: AdvisorSiteInventory
): GeminiToolExecutionMapping {
  const toolActions: AdvisorSiteAction[] = [];
  const inlineWidgets: AdvisorInlineWidgetType[] = [];
  const functionResponses: GeminiToolExecutionMapping['functionResponses'] = [];

  for (const call of functionCalls) {
    const name = strVal(call.name);
    const args = (call.args && typeof call.args === 'object' ? call.args : {}) as Record<
      string,
      unknown
    >;

    if (!name) continue;

    switch (name) {
      case 'create_farm_zone': {
        const locationText = strVal(args.locationOrRegion);
        const matchedRegion = locationText ? matchAgroRegionFromText(locationText) : null;
        const rawLat = numVal(args.latitude);
        const rawLng = numVal(args.longitude);
        const hasCoords =
          rawLat !== undefined &&
          rawLng !== undefined &&
          rawLat >= -65 &&
          rawLat <= 68 &&
          rawLng >= -180 &&
          rawLng <= 180;

        const targetCenter: LatLon = hasCoords
          ? { lat: Number(rawLat.toFixed(6)), lng: Number(rawLng.toFixed(6)) }
          : matchedRegion
          ? matchedRegion.center
          : inventory.hasActiveZones
          ? {
              lat: Number((inventory.activeCentroid.lat + 0.015).toFixed(5)),
              lng: Number((inventory.activeCentroid.lng + 0.015).toFixed(5)),
            }
          : EGYPT_AGRO_REGIONS[0].center;

        const requestedFeddans = Math.max(0.5, Math.min(250000, numVal(args.areaFeddans) ?? 50));
        const vertices = buildGeodesicRectangleForFeddans(targetCenter, requestedFeddans);
        const areaCalc = calculateGeodesicArea(vertices);

        const cropSpec = resolveCropInput(
          strVal(args.cropId),
          strVal(args.customCropLabel)
        );
        const chosenCropId = cropSpec.cropId || inventory.activeCropId || 'wheat';
        const dbCrop = CROP_DATABASE.find((c) => c.id === chosenCropId) || CROP_DATABASE[0];

        const chosenTexture: SoilTexture =
          resolveSoilTextureInput(strVal(args.soilTexture)) ||
          matchedRegion?.defaultSoil ||
          'loamy';
        const chosenEc = Math.max(
          0.2,
          Math.min(30, numVal(args.salinityEC) ?? matchedRegion?.defaultEc ?? 1.45)
        );
        const chosenPh = Math.max(4.0, Math.min(10.5, numVal(args.ph) ?? 7.4));
        const chosenIrrigation: IrrigationSystem =
          resolveIrrigationInput(strVal(args.irrigation)) ||
          matchedRegion?.defaultIrrigation ||
          'drip';

        const providedNameAr = strVal(args.nameAr);
        const providedNameEn = strVal(args.nameEn);
        const zoneNameAr =
          providedNameAr ||
          (matchedRegion
            ? `مزرعة ${matchedRegion.keywordsAr[0]} (${areaCalc.feddans} فدان)`
            : locationText
            ? `مزرعة ${locationText} (${areaCalc.feddans} فدان)`
            : `مزرعة (${targetCenter.lat.toFixed(3)}°N, ${targetCenter.lng.toFixed(3)}°E — ${areaCalc.feddans} فدان)`);
        const zoneNameEn =
          providedNameEn ||
          providedNameAr ||
          (matchedRegion
            ? `${matchedRegion.labelEn} Farm (${areaCalc.feddans} Feddans)`
            : `Study Zone (${targetCenter.lat.toFixed(3)}°N, ${targetCenter.lng.toFixed(3)}°E — ${areaCalc.feddans} Fed)`);

        const zoneDraft: AdvisorCreateZonePayload = {
          nameAr: zoneNameAr,
          nameEn: zoneNameEn,
          categoryAr: `حقل ${cropSpec.customCropLabel || dbCrop.nameAr}`,
          categoryEn: `${cropSpec.customCropLabel || dbCrop.nameEn} Plot`,
          soilTexture: chosenTexture,
          salinityEC: Number(chosenEc.toFixed(2)),
          ph: Number(chosenPh.toFixed(2)),
          organicMatterPct: 2.2,
          irrigation: chosenIrrigation,
          cropId: chosenCropId,
          ...(cropSpec.customCropLabel ? { customCropLabel: cropSpec.customCropLabel } : {}),
          vertices,
          centroid: targetCenter,
          requestedFeddans: areaCalc.totalFeddansDecimal,
          regionLabelAr: matchedRegion?.labelAr || locationText || zoneNameAr,
          regionLabelEn: matchedRegion?.labelEn || locationText || zoneNameEn,
        };

        toolActions.push({
          type: 'CREATE_ZONE',
          zoneDraft,
          summaryAr: `تم إنشاء وتفعيل "${zoneNameAr}" بمساحة ${areaCalc.feddans} فدان و${areaCalc.qirats} قيراط عند (${targetCenter.lat.toFixed(4)}°N, ${targetCenter.lng.toFixed(4)}°E)`,
          summaryEn: `Created & activated "${zoneNameEn}" (${areaCalc.feddans} Feddans, ${areaCalc.qirats} Qirats) at (${targetCenter.lat.toFixed(4)}°N, ${targetCenter.lng.toFixed(4)}°E)`,
        });
        addWidgetUnique(inlineWidgets, 'zone_action_card');
        functionResponses.push({
          id: call.id,
          name,
          response: {
            ok: true,
            result: `Created zone "${zoneNameAr}" (${areaCalc.feddans} feddans, crop=${cropSpec.cropNameEn || dbCrop.nameEn}, soil=${chosenTexture}, EC=${chosenEc} dS/m, irrigation=${chosenIrrigation}) at ${targetCenter.lat}, ${targetCenter.lng}.`,
            details: { zoneNameAr, zoneNameEn, feddans: areaCalc.feddans, cropId: chosenCropId },
          },
        });
        break;
      }

      case 'delete_farm_zone': {
        const target = strVal(args.target).toLowerCase();
        const clearAll = target === 'all' || boolVal(args.clearAll) === true;

        if (clearAll) {
          toolActions.push({
            type: 'DELETE_ZONE',
            clearAll: true,
            summaryAr: 'تم مسح جميع الزونات والمزارع المسجلة',
            summaryEn: 'Cleared all registered study zones',
          });
          functionResponses.push({
            id: call.id,
            name,
            response: { ok: true, result: `Deleted all ${inventory.zones.length} study zones.` },
          });
          break;
        }

        const resolved = resolveTargetZoneFromInventory(inventory, {
          zoneId: strVal(args.zoneId) || undefined,
          zoneNameQuery: strVal(args.zoneNameQuery) || undefined,
          target: target || undefined,
          index: numVal(args.index),
        });

        if (!resolved) {
          functionResponses.push({
            id: call.id,
            name,
            response: {
              ok: false,
              result: 'There are no saved study zones to delete.',
            },
          });
          break;
        }

        toolActions.push({
          type: 'DELETE_ZONE',
          zoneId: resolved.id,
          clearAll: false,
          summaryAr: `تم حذف "${resolved.nameAr}" (${resolved.feddans} فدان)`,
          summaryEn: `Deleted study zone "${resolved.nameEn}" (${resolved.feddans} Feddans)`,
        });
        functionResponses.push({
          id: call.id,
          name,
          response: {
            ok: true,
            result: `Deleted zone "${resolved.nameAr}" (id=${resolved.id}).`,
          },
        });
        break;
      }

      case 'rename_farm_zone': {
        const resolved = resolveTargetZoneFromInventory(inventory, {
          zoneId: strVal(args.zoneId) || undefined,
          zoneNameQuery: strVal(args.zoneNameQuery) || undefined,
        });
        const newNameAr = strVal(args.newNameAr) || strVal(args.newNameEn);
        const newNameEn = strVal(args.newNameEn) || strVal(args.newNameAr);
        const newCategoryAr = strVal(args.newCategoryAr) || undefined;

        if (!resolved || !newNameAr) {
          functionResponses.push({
            id: call.id,
            name,
            response: {
              ok: false,
              result: resolved ? 'New zone name is required.' : 'No saved zone found to rename.',
            },
          });
          break;
        }

        toolActions.push({
          type: 'RENAME_ZONE',
          zoneId: resolved.id,
          newNameAr,
          newNameEn,
          ...(newCategoryAr ? { newCategoryAr } : {}),
          summaryAr: `تم تغيير اسم "${resolved.nameAr}" إلى "${newNameAr}"`,
          summaryEn: `Renamed "${resolved.nameEn}" to "${newNameEn}"`,
        });
        functionResponses.push({
          id: call.id,
          name,
          response: { ok: true, result: `Renamed "${resolved.nameAr}" to "${newNameAr}".` },
        });
        break;
      }

      case 'switch_active_farm_zone': {
        const resolved = resolveTargetZoneFromInventory(inventory, {
          zoneId: strVal(args.zoneId) || undefined,
          zoneNameQuery: strVal(args.zoneNameQuery) || undefined,
          target: strVal(args.target) || undefined,
          index: numVal(args.index),
        });

        if (!resolved) {
          functionResponses.push({
            id: call.id,
            name,
            response: { ok: false, result: 'No matching saved zone found.' },
          });
          break;
        }

        toolActions.push({
          type: 'SWITCH_ACTIVE_ZONE',
          zoneId: resolved.id,
          summaryAr: `تم التبديل وتفعيل "${resolved.nameAr}" (${resolved.feddans} فدان)`,
          summaryEn: `Switched active farm to "${resolved.nameEn}" (${resolved.feddans} Feddans)`,
        });
        functionResponses.push({
          id: call.id,
          name,
          response: { ok: true, result: `Activated zone "${resolved.nameAr}" (id=${resolved.id}).` },
        });
        break;
      }

      case 'compare_farm_zone': {
        const modeRaw = strVal(args.mode).toLowerCase();
        const mode: 'add' | 'remove' | 'toggle' | 'clear_all' =
          modeRaw === 'add' || modeRaw === 'remove' || modeRaw === 'clear_all'
            ? modeRaw
            : 'toggle';

        if (mode === 'clear_all') {
          toolActions.push({
            type: 'TOGGLE_COMPARE_ZONE',
            mode: 'clear_all',
            summaryAr: 'تم إلغاء مقارنة المزارع',
            summaryEn: 'Cleared zone comparison selection',
          });
          functionResponses.push({
            id: call.id,
            name,
            response: { ok: true, result: 'Cleared all compared zones.' },
          });
          break;
        }

        const resolved = resolveTargetZoneFromInventory(inventory, {
          zoneId: strVal(args.zoneId) || undefined,
          zoneNameQuery: strVal(args.zoneNameQuery) || undefined,
          target: 'active',
        });
        if (!resolved) {
          functionResponses.push({
            id: call.id,
            name,
            response: { ok: false, result: 'No saved zone found to compare.' },
          });
          break;
        }

        toolActions.push({
          type: 'TOGGLE_COMPARE_ZONE',
          zoneId: resolved.id,
          mode,
          summaryAr:
            mode === 'remove'
              ? `تمت إزالة "${resolved.nameAr}" من المقارنة`
              : `تمت إضافة/تبديل "${resolved.nameAr}" في لوحة المقارنة`,
          summaryEn:
            mode === 'remove'
              ? `Removed "${resolved.nameEn}" from comparison`
              : `Toggled "${resolved.nameEn}" in comparison`,
        });
        functionResponses.push({
          id: call.id,
          name,
          response: { ok: true, result: `Updated comparison state (${mode}) for "${resolved.nameAr}".` },
        });
        break;
      }

      case 'update_farm_settings': {
        const cropSpec = resolveCropInput(strVal(args.cropId), strVal(args.customCropLabel));
        const soilTexture = resolveSoilTextureInput(strVal(args.soilTexture));
        const irrigation = resolveIrrigationInput(strVal(args.irrigation));
        const ecVal = numVal(args.salinityEC);
        const phVal = numVal(args.ph);
        const omVal = numVal(args.organicMatterPct);

        const updates: AdvisorUpdateSoilOrCropPayload = {
          ...(cropSpec.cropId ? { cropId: cropSpec.cropId } : {}),
          ...(cropSpec.customCropLabel ? { customCropLabel: cropSpec.customCropLabel } : {}),
          ...(soilTexture ? { soilTexture } : {}),
          ...(ecVal !== undefined
            ? { salinityEC: Number(Math.max(0.2, Math.min(30, ecVal)).toFixed(2)) }
            : {}),
          ...(phVal !== undefined
            ? { ph: Number(Math.max(4.0, Math.min(10.5, phVal)).toFixed(2)) }
            : {}),
          ...(omVal !== undefined
            ? { organicMatterPct: Number(Math.max(0.1, Math.min(15, omVal)).toFixed(2)) }
            : {}),
          ...(irrigation ? { irrigation } : {}),
        };

        if (Object.keys(updates).length === 0) {
          functionResponses.push({
            id: call.id,
            name,
            response: { ok: false, result: 'No valid farm settings parameters were supplied.' },
          });
          break;
        }

        const resolvedTarget =
          strVal(args.zoneId) || strVal(args.zoneNameQuery)
            ? resolveTargetZoneFromInventory(inventory, {
                zoneId: strVal(args.zoneId) || undefined,
                zoneNameQuery: strVal(args.zoneNameQuery) || undefined,
              })
            : undefined;

        const partsAr: string[] = [];
        const partsEn: string[] = [];
        if (cropSpec.cropNameAr) {
          partsAr.push(`المحصول: ${cropSpec.cropNameAr}`);
          partsEn.push(`crop: ${cropSpec.cropNameEn}`);
        }
        if (soilTexture) {
          partsAr.push(`التربة: ${soilTexture}`);
          partsEn.push(`soil: ${soilTexture}`);
        }
        if (updates.salinityEC !== undefined) {
          partsAr.push(`EC ${updates.salinityEC} dS/m`);
          partsEn.push(`EC ${updates.salinityEC} dS/m`);
        }
        if (updates.ph !== undefined) {
          partsAr.push(`pH ${updates.ph}`);
          partsEn.push(`pH ${updates.ph}`);
        }
        if (updates.organicMatterPct !== undefined) {
          partsAr.push(`المادة العضوية ${updates.organicMatterPct}%`);
          partsEn.push(`OM ${updates.organicMatterPct}%`);
        }
        if (irrigation) {
          partsAr.push(`الري: ${irrigation}`);
          partsEn.push(`irrigation: ${irrigation}`);
        }

        toolActions.push({
          type: 'UPDATE_ZONE_CONFIG',
          ...(resolvedTarget ? { zoneId: resolvedTarget.id } : {}),
          updates,
          summaryAr: `تم تحديث إعدادات المزرعة (${partsAr.join(' · ')})`,
          summaryEn: `Updated farm settings (${partsEn.join(' · ')})`,
        });
        addWidgetUnique(inlineWidgets, 'zone_action_card');
        functionResponses.push({
          id: call.id,
          name,
          response: { ok: true, result: `Updated farm settings: ${partsEn.join(', ')}.` },
        });
        break;
      }

      case 'clear_drawn_polygon': {
        toolActions.push({
          type: 'CLEAR_DRAWN_VERTICES',
          summaryAr: 'تم مسح نقاط الحدود المرسومة مؤقتاً على الخريطة',
          summaryEn: 'Cleared drawn polygon boundary points from map',
        });
        functionResponses.push({
          id: call.id,
          name,
          response: { ok: true, result: 'Cleared drawn polygon vertices on map.' },
        });
        break;
      }

      case 'switch_map_layer': {
        const spectralRaw = strVal(args.spectralLayer).toUpperCase() as SpectralIndexKey;
        const thematicRaw = strVal(args.thematicLayer).toLowerCase() as ThematicMapLayerId;
        const spectralLayer = VALID_SPECTRAL_LAYERS.includes(spectralRaw)
          ? spectralRaw
          : undefined;
        const thematicLayer = VALID_THEMATIC_LAYERS.includes(thematicRaw)
          ? thematicRaw
          : undefined;
        const navigateToAtlas = boolVal(args.navigateToAtlas) ?? false;

        if (!spectralLayer && !thematicLayer) {
          functionResponses.push({
            id: call.id,
            name,
            response: { ok: false, result: 'Specify a valid spectralLayer or thematicLayer.' },
          });
          break;
        }

        toolActions.push({
          type: 'SWITCH_MAP_LAYER',
          spectralLayer,
          thematicLayer,
          navigateToAtlas,
          summaryAr: `تم تفعيل طبقة ${spectralLayer || thematicLayer} على الخريطة${
            navigateToAtlas ? ' والانتقال إلى الخريطة الشاملة' : ''
          }`,
          summaryEn: `Switched map layer to ${spectralLayer || thematicLayer}${
            navigateToAtlas ? ' and opened Full-Screen Atlas' : ''
          }`,
        });
        functionResponses.push({
          id: call.id,
          name,
          response: {
            ok: true,
            result: `Switched layer to ${spectralLayer || thematicLayer} (navigateToAtlas=${navigateToAtlas}).`,
          },
        });
        break;
      }

      case 'navigate_app_tab': {
        const tabRaw = strVal(args.tabId).toLowerCase() as MainTabId;
        const tabId = VALID_TABS.includes(tabRaw) ? tabRaw : undefined;
        if (!tabId) {
          functionResponses.push({
            id: call.id,
            name,
            response: { ok: false, result: 'Invalid tabId.' },
          });
          break;
        }
        const labelsAr: Record<MainTabId, string> = {
          atlas: 'الخريطة الشاملة',
          indices: 'تحليل المؤشرات الطيفية',
          weather: 'الأمطار والتنبؤ الجوي',
          crops: 'التوصيات والدورة الزراعية',
          advisor: 'GeoAgri ai',
        };
        toolActions.push({
          type: 'NAVIGATE_TAB',
          tabId,
          summaryAr: `تم الانتقال إلى قسم ${labelsAr[tabId]}`,
          summaryEn: `Navigated to ${tabId} tab`,
        });
        functionResponses.push({
          id: call.id,
          name,
          response: { ok: true, result: `Navigated to ${tabId} tab.` },
        });
        break;
      }

      case 'manage_weekly_task': {
        const op = strVal(args.operation).toLowerCase();
        const title = strVal(args.title);
        const detail = strVal(args.detail) || undefined;
        const taskId = strVal(args.taskId) || undefined;
        const matchText = strVal(args.matchText) || title || undefined;
        const catRaw = strVal(args.category).toLowerCase();
        const category: WeeklyChecklistTask['category'] =
          catRaw === 'irrigation' ||
          catRaw === 'fertilization' ||
          catRaw === 'scouting' ||
          catRaw === 'soil'
            ? catRaw
            : 'scouting';
        const prioRaw = strVal(args.priority).toLowerCase();
        const priority: WeeklyChecklistTask['priority'] =
          prioRaw === 'high' || prioRaw === 'medium' || prioRaw === 'normal'
            ? prioRaw
            : 'high';
        const dayLabel = strVal(args.dayLabel);

        if (op === 'add') {
          const finalTitle = title || (inventory.language === 'ar' ? 'مهمة حقلية مضافة' : 'New Field Task');
          toolActions.push({
            type: 'ADD_CHECKLIST_TASK',
            titleAr: finalTitle,
            titleEn: finalTitle,
            ...(detail ? { detailAr: detail, detailEn: detail } : {}),
            category,
            priority,
            dayAr: dayLabel || 'اليوم / قريباً',
            dayEn: dayLabel || 'Today / Upcoming',
            summaryAr: `تمت إضافة مهمة أسبوعية: "${finalTitle}"`,
            summaryEn: `Added weekly task: "${finalTitle}"`,
          });
          addWidgetUnique(inlineWidgets, 'weekly_checklist');
          functionResponses.push({
            id: call.id,
            name,
            response: { ok: true, result: `Added weekly checklist task "${finalTitle}".` },
          });
        } else if (op === 'delete' || op === 'clear_all') {
          const clearAll = op === 'clear_all' || boolVal(args.clearAll) === true;
          toolActions.push({
            type: 'DELETE_CHECKLIST_TASK',
            ...(taskId ? { taskId } : {}),
            ...(matchText ? { matchText } : {}),
            clearAll,
            summaryAr: clearAll
              ? 'تم مسح جميع المهام الأسبوعية'
              : `تم حذف المهمة "${matchText || taskId || 'المحددة'}"`,
            summaryEn: clearAll
              ? 'Cleared all weekly checklist tasks'
              : `Deleted checklist task "${matchText || taskId || 'selected'}"`,
          });
          functionResponses.push({
            id: call.id,
            name,
            response: {
              ok: true,
              result: clearAll
                ? 'Cleared all weekly tasks.'
                : `Deleted checklist task matching "${matchText || taskId}".`,
            },
          });
        } else {
          const completed =
            op === 'complete' ? true : op === 'uncomplete' ? false : boolVal(args.completed);
          const markAll = boolVal(args.markAll) ?? false;
          toolActions.push({
            type: 'TOGGLE_CHECKLIST_TASK',
            ...(taskId ? { taskId } : {}),
            ...(matchText ? { matchText } : {}),
            ...(completed !== undefined ? { completed } : {}),
            markAll,
            summaryAr: markAll
              ? 'تم تحديث حالة جميع مهام الأسبوع'
              : `تم تحديث حالة المهمة "${matchText || taskId || 'الأولى'}"`,
            summaryEn: markAll
              ? 'Updated all weekly tasks'
              : `Updated task "${matchText || taskId || 'first'}"`,
          });
          addWidgetUnique(inlineWidgets, 'weekly_checklist');
          functionResponses.push({
            id: call.id,
            name,
            response: { ok: true, result: `Updated checklist task status (${op}).` },
          });
        }
        break;
      }

      case 'manage_pest_incident': {
        const op = strVal(args.operation).toLowerCase();
        if (op === 'log' || op === 'add') {
          const pestId = resolvePestIdInput(strVal(args.pestId));
          const pestObj = REGIONAL_PEST_CATALOG.find((p) => p.id === pestId);
          const szRaw = strVal(args.subZoneId).toUpperCase();
          const subZoneId: 'A' | 'B' | 'C' =
            szRaw === 'A' || szRaw === 'B' || szRaw === 'C' ? szRaw : 'A';
          const sevRaw = strVal(args.severity).toLowerCase();
          const severity: PestSeverity =
            sevRaw === 'low' ||
            sevRaw === 'moderate' ||
            sevRaw === 'high' ||
            sevRaw === 'critical'
              ? sevRaw
              : 'high';
          const notes = strVal(args.notes) || undefined;

          toolActions.push({
            type: 'LOG_PEST_INCIDENT',
            pestId,
            subZoneId,
            severity,
            ...(notes ? { notes } : {}),
            summaryAr: `تم تثبيت بؤرة "${pestObj?.nameAr || pestId}" في زونا ${subZoneId}`,
            summaryEn: `Pinned pest incident "${pestObj?.nameEn || pestId}" in Sub-Zone ${subZoneId}`,
          });
          addWidgetUnique(inlineWidgets, 'pest_radar');
          functionResponses.push({
            id: call.id,
            name,
            response: {
              ok: true,
              result: `Logged pest incident ${pestId} in Sub-Zone ${subZoneId} (severity=${severity}).`,
            },
          });
        } else if (op === 'delete' || op === 'clear_all') {
          const clearAll = op === 'clear_all' || boolVal(args.clearAll) === true;
          const incidentId = strVal(args.incidentId) || undefined;
          toolActions.push({
            type: 'DELETE_PEST_INCIDENT',
            ...(incidentId ? { incidentId } : {}),
            clearAll,
            summaryAr: clearAll ? 'تم مسح جميع بؤر الآفات المسجلة' : 'تم حذف بؤرة الآفة المحددة',
            summaryEn: clearAll ? 'Cleared all logged pest incidents' : 'Deleted selected pest incident',
          });
          functionResponses.push({
            id: call.id,
            name,
            response: {
              ok: true,
              result: clearAll ? 'Cleared all logged pest incidents.' : `Deleted pest incident ${incidentId || 'latest'}.`,
            },
          });
        } else {
          const markAllTreated = op === 'mark_all_treated' || boolVal(args.markAll) === true;
          const status: 'active' | 'treated' = op === 'mark_active' ? 'active' : 'treated';
          const incidentId = strVal(args.incidentId) || undefined;
          toolActions.push({
            type: 'TOGGLE_PEST_INCIDENT_STATUS',
            ...(incidentId ? { incidentId } : {}),
            status,
            markAllTreated,
            summaryAr:
              status === 'treated'
                ? 'تم تحديث حالة بؤرة الآفة إلى "تمت المعالجة"'
                : 'تمت إعادة تفعيل بؤرة الآفة للمتابعة',
            summaryEn:
              status === 'treated'
                ? 'Marked pest incident as treated'
                : 'Marked pest incident as active',
          });
          addWidgetUnique(inlineWidgets, 'pest_radar');
          functionResponses.push({
            id: call.id,
            name,
            response: { ok: true, result: `Updated pest incident status to ${status}.` },
          });
        }
        break;
      }

      case 'manage_crop_rotation': {
        const op = strVal(args.operation).toLowerCase();
        const szRaw = strVal(args.subZoneId).toUpperCase();
        const subZoneId =
          szRaw === 'A' || szRaw === 'B' || szRaw === 'C' || szRaw === 'ALL' ? szRaw : 'ALL';

        if (op === 'optimize') {
          toolActions.push({
            type: 'OPTIMIZE_ROTATION',
            subZoneId,
            summaryAr:
              subZoneId === 'ALL'
                ? 'تم التحسين العلمي التلقائي للدورة الزراعية لكل الزونات (A/B/C)'
                : `تم تحسين الدورة الزراعية تلقائياً لزونا ${subZoneId}`,
            summaryEn:
              subZoneId === 'ALL'
                ? 'Auto-optimized crop rotation across Sub-Zones A, B, and C'
                : `Auto-optimized crop rotation for Sub-Zone ${subZoneId}`,
          });
          functionResponses.push({
            id: call.id,
            name,
            response: { ok: true, result: `Optimized rotation for ${subZoneId}.` },
          });
        } else {
          const slotRaw = strVal(args.slotId) as RotationSeasonSlot['slotId'];
          const slotId: RotationSeasonSlot['slotId'] = VALID_SLOT_IDS.includes(slotRaw)
            ? slotRaw
            : 'current';
          const cropSpec = resolveCropInput(strVal(args.cropId), strVal(args.cropId));
          const cropId = cropSpec.cropId || 'wheat';
          const targetZone: 'A' | 'B' | 'C' =
            subZoneId === 'B' || subZoneId === 'C' ? subZoneId : 'A';
          toolActions.push({
            type: 'UPDATE_ROTATION_SLOT',
            subZoneId: targetZone,
            slotId,
            cropId,
            summaryAr: `تم تعديل محصول فترة ${slotId} في زونا ${targetZone} إلى ${cropSpec.cropNameAr || cropId}`,
            summaryEn: `Updated rotation slot ${slotId} in Zone ${targetZone} to ${cropSpec.cropNameEn || cropId}`,
          });
          functionResponses.push({
            id: call.id,
            name,
            response: {
              ok: true,
              result: `Set rotation slot ${slotId} in Zone ${targetZone} to ${cropId}.`,
            },
          });
        }
        break;
      }

      case 'control_app_preferences': {
        const notes: string[] = [];
        const darkModeVal = boolVal(args.darkMode);
        const toggleDark = boolVal(args.toggleDarkMode);
        if (darkModeVal !== undefined || toggleDark) {
          toolActions.push({
            type: 'SET_THEME',
            ...(darkModeVal !== undefined ? { darkMode: darkModeVal } : { toggle: true }),
            summaryAr:
              darkModeVal === true
                ? 'تم تفعيل الوضع الليلي (Dark Mode)'
                : darkModeVal === false
                ? 'تم تفعيل الوضع النهاري (Light Mode)'
                : 'تم تبديل مظهر الموقع (الوضع الليلي/النهاري)',
            summaryEn:
              darkModeVal === true
                ? 'Enabled Dark Mode'
                : darkModeVal === false
                ? 'Enabled Light Mode'
                : 'Toggled Dark/Light Mode',
          });
          notes.push('theme updated');
        }

        const langRaw = strVal(args.language).toLowerCase();
        if (langRaw === 'ar' || langRaw === 'en') {
          toolActions.push({
            type: 'SET_LANGUAGE',
            language: langRaw,
            summaryAr:
              langRaw === 'en' ? 'تم تحويل لغة الموقع إلى الإنجليزية' : 'تم تحويل لغة الموقع إلى العربية',
            summaryEn:
              langRaw === 'en' ? 'Switched app language to English' : 'Switched app language to Arabic',
          });
          notes.push(`language=${langRaw}`);
        }

        const pushEnabled = boolVal(args.pushNotificationsEnabled);
        const dismissAlerts = boolVal(args.dismissWeatherAlerts);
        if (pushEnabled !== undefined || dismissAlerts) {
          toolActions.push({
            type: 'TOGGLE_PUSH_NOTIFICATIONS',
            ...(pushEnabled !== undefined ? { enabled: pushEnabled } : {}),
            ...(dismissAlerts ? { dismissAllAlerts: true } : {}),
            summaryAr: dismissAlerts
              ? 'تم إخفاء تنبيهات الطقس الحالية'
              : pushEnabled
              ? 'تم تفعيل إشعارات الطقس الفورية'
              : 'تم إيقاف إشعارات الطقس الفورية',
            summaryEn: dismissAlerts
              ? 'Dismissed current weather alerts'
              : pushEnabled
              ? 'Enabled live weather push notifications'
              : 'Disabled weather push notifications',
          });
          notes.push('notifications updated');
        }

        if (boolVal(args.refreshWeather)) {
          toolActions.push({
            type: 'REFRESH_WEATHER',
            summaryAr: 'جاري تحديث بيانات الطقس الحية من الأقمار الصناعية',
            summaryEn: 'Refreshed live Open-Meteo & NASA POWER weather data',
          });
          notes.push('weather refresh triggered');
        }

        if (boolVal(args.exportPdfReport)) {
          toolActions.push({
            type: 'EXPORT_PDF_REPORT',
            summaryAr: 'تم توليد وتحميل التقرير الهندسي الشامل (PDF) للمزرعة النشطة',
            summaryEn: 'Generated and downloaded comprehensive PDF field report',
          });
          notes.push('PDF report exported');
        }

        if (boolVal(args.clearChat)) {
          toolActions.push({
            type: 'CLEAR_CHAT',
            summaryAr: 'تم مسح سجل المحادثة وبدء جلسة نظيفة',
            summaryEn: 'Cleared chat history and started a clean session',
          });
          notes.push('chat cleared');
        }

        if (boolVal(args.closeFullscreenChat)) {
          toolActions.push({
            type: 'CLOSE_FULLSCREEN_CHAT',
            summaryAr: 'تم إغلاق نافذة المحادثة المكبرة',
            summaryEn: 'Closed expanded chat overlay',
          });
          notes.push('fullscreen chat closed');
        }

        if (boolVal(args.openSpaceDataCatalog)) {
          toolActions.push({
            type: 'OPEN_SPACE_DATA_CATALOG',
            summaryAr: 'تم فتح دليل بيانات ناسا ووكالات الفضاء المعتمدة (24 منظومة فضائية وعلمية)',
            summaryEn: 'Opened official NASA & Space Agency Data Foundations catalog (24 sources)',
          });
          notes.push('space data catalog opened');
        }

        const widgetReq = strVal(args.showInlineWidget) as AdvisorInlineWidgetType;
        if (
          widgetReq &&
          [
            'pest_radar',
            'weekly_checklist',
            'spectral_subzones',
            'irrigation_npk',
            'crop_mcda',
            'zone_action_card',
          ].includes(widgetReq)
        ) {
          addWidgetUnique(inlineWidgets, widgetReq);
          notes.push(`widget=${widgetReq}`);
        }

        functionResponses.push({
          id: call.id,
          name,
          response: {
            ok: notes.length > 0,
            result: notes.length > 0 ? `Executed: ${notes.join(', ')}.` : 'No preference flags specified.',
          },
        });
        break;
      }

      case 'open_space_data_catalog': {
        toolActions.push({
          type: 'OPEN_SPACE_DATA_CATALOG',
          summaryAr: 'تم فتح دليل بيانات ناسا ووكالات الفضاء المعتمدة (24 منظومة فضائية وعلمية)',
          summaryEn: 'Opened official NASA & Partner Space Agency Data Foundations catalog (24 sources)',
        });
        functionResponses.push({
          id: call.id,
          name,
          response: {
            ok: true,
            result: 'Opened NASA & Space Agency Data Foundations catalog with 24 authoritative datasets.',
          },
        });
        break;
      }

      default:
        functionResponses.push({
          id: call.id,
          name,
          response: { ok: false, result: `Unknown tool "${name}".` },
        });
    }
  }

  return { toolActions, inlineWidgets, functionResponses };
}
