import {
  DailyWeatherPoint,
  Language,
  LatLon,
  MainTabId,
  SoilProfile,
  UserStudyZone,
} from '../types/agro';
import {
  PRESET_FARM_ZONES,
  buildDefaultCustomRotationPlans,
  buildFallback14DayForecast,
  calculateGeodesicArea,
  generateSubZonesAndGrid,
  getPolygonCentroid,
} from '../utils/agroEngine';

export const LOCAL_FARM_STATE_STORAGE_KEY = 'geoagri_pro_farm_state_v1';

const VALID_MAIN_TABS: ReadonlySet<MainTabId> = new Set([
  'atlas',
  'indices',
  'weather',
  'crops',
  'advisor',
]);

const VALID_SOIL_TEXTURES: ReadonlySet<SoilProfile['texture']> = new Set([
  'clay',
  'loamy',
  'sandy',
  'calcareous',
]);

const VALID_IRRIGATION_TYPES: ReadonlySet<SoilProfile['irrigation']> = new Set([
  'drip',
  'sprinkler',
  'flood',
  'pivot',
  'rainfed',
]);

export const DEFAULT_LOCAL_SOIL_PROFILE: SoilProfile = {
  texture: 'clay',
  irrigation: 'drip',
  salinityEC: 1.25,
  ph: 7.4,
  organicMatterPct: 2.3,
  groundwaterDepthM: 1.6,
};

export interface PersistedFarmState {
  zones: UserStudyZone[];
  activeZoneId: string | null;
  vertices: LatLon[];
  soil: SoilProfile;
  currentCropId: string;
  customCropLabel?: string;
  activeTab: MainTabId;
  deletedZoneIds: string[];
  language?: Language;
  updatedAtISO?: string;
}

export function isValidLatLon(pt: unknown): pt is LatLon {
  if (!pt || typeof pt !== 'object') return false;
  const candidate = pt as Record<string, unknown>;
  const lat = Number(candidate.lat);
  const lng = Number(candidate.lng);
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export function sanitizeSoilProfile(raw: unknown): SoilProfile {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_LOCAL_SOIL_PROFILE };
  const r = raw as Record<string, unknown>;
  const texture = VALID_SOIL_TEXTURES.has(r.texture as SoilProfile['texture'])
    ? (r.texture as SoilProfile['texture'])
    : DEFAULT_LOCAL_SOIL_PROFILE.texture;
  const irrigation = VALID_IRRIGATION_TYPES.has(r.irrigation as SoilProfile['irrigation'])
    ? (r.irrigation as SoilProfile['irrigation'])
    : DEFAULT_LOCAL_SOIL_PROFILE.irrigation;

  const numOr = (val: unknown, fallback: number, min: number, max: number) => {
    const n = Number(val);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, n));
  };

  return {
    texture,
    irrigation,
    salinityEC: numOr(r.salinityEC, DEFAULT_LOCAL_SOIL_PROFILE.salinityEC, 0.1, 25),
    ph: numOr(r.ph, DEFAULT_LOCAL_SOIL_PROFILE.ph, 3.5, 10.5),
    organicMatterPct: numOr(
      r.organicMatterPct,
      DEFAULT_LOCAL_SOIL_PROFILE.organicMatterPct,
      0.1,
      15
    ),
    groundwaterDepthM: numOr(
      r.groundwaterDepthM,
      DEFAULT_LOCAL_SOIL_PROFILE.groundwaterDepthM,
      0.2,
      50
    ),
    ...(typeof r.customTextureLabel === 'string' && r.customTextureLabel.trim()
      ? { customTextureLabel: r.customTextureLabel.trim().slice(0, 120) }
      : {}),
    ...(typeof r.customIrrigationLabel === 'string' && r.customIrrigationLabel.trim()
      ? { customIrrigationLabel: r.customIrrigationLabel.trim().slice(0, 120) }
      : {}),
  };
}

export function hydrateStudyZoneFromCompactRecord(raw: unknown): UserStudyZone | null {
  if (!raw || typeof raw !== 'object') return null;
  const rec = raw as Record<string, unknown>;
  if (typeof rec.id !== 'string' || !rec.id.trim()) return null;

  const rawVerts = Array.isArray(rec.vertices) ? rec.vertices.filter(isValidLatLon) : [];
  if (rawVerts.length < 3) return null;

  const vertices: LatLon[] = rawVerts.slice(0, 120).map((v) => ({
    lat: Number(v.lat),
    lng: Number(v.lng),
  }));

  const centroid = isValidLatLon(rec.centroid)
    ? { lat: Number(rec.centroid.lat), lng: Number(rec.centroid.lng) }
    : getPolygonCentroid(vertices);

  const area =
    rec.area &&
    typeof rec.area === 'object' &&
    typeof (rec.area as Record<string, unknown>).feddans === 'number'
      ? (rec.area as UserStudyZone['area'])
      : calculateGeodesicArea(vertices);

  const soil = sanitizeSoilProfile(rec.soil);
  const currentCropId =
    typeof rec.currentCropId === 'string' && rec.currentCropId.trim()
      ? rec.currentCropId.trim().slice(0, 64)
      : 'wheat';

  const forecast14: DailyWeatherPoint[] =
    Array.isArray(rec.forecast14) && rec.forecast14.length > 0
      ? (rec.forecast14 as DailyWeatherPoint[])
      : buildFallback14DayForecast(centroid);

  const spatial = generateSubZonesAndGrid(
    vertices,
    soil,
    PRESET_FARM_ZONES[0].baseSpectralBands,
    {
      sm0to7Pct: forecast14[0]?.soilMoisture0to7Pct ?? 26,
      sm7to28Pct: forecast14[0]?.soilMoisture7to28Pct ?? 31,
    }
  );

  const farmAverages =
    rec.farmAverages &&
    typeof rec.farmAverages === 'object' &&
    typeof (rec.farmAverages as Record<string, unknown>).NDVI === 'number'
      ? (rec.farmAverages as UserStudyZone['farmAverages'])
      : spatial.farmAverages;

  const subZones =
    Array.isArray(rec.subZones) && rec.subZones.length > 0
      ? (rec.subZones as UserStudyZone['subZones'])
      : spatial.subZones;

  const customRotationPlans =
    rec.customRotationPlans && typeof rec.customRotationPlans === 'object'
      ? (rec.customRotationPlans as UserStudyZone['customRotationPlans'])
      : buildDefaultCustomRotationPlans(currentCropId);

  return {
    id: rec.id.trim().slice(0, 128),
    ...(typeof rec.ownerUid === 'string' && rec.ownerUid.trim()
      ? { ownerUid: rec.ownerUid.trim() }
      : {}),
    nameAr:
      typeof rec.nameAr === 'string' && rec.nameAr.trim()
        ? rec.nameAr.trim().slice(0, 120)
        : 'مزرعة محددة',
    nameEn:
      typeof rec.nameEn === 'string' && rec.nameEn.trim()
        ? rec.nameEn.trim().slice(0, 120)
        : 'Study Zone',
    categoryAr:
      typeof rec.categoryAr === 'string' ? rec.categoryAr.slice(0, 120) : 'حقل محاصيل',
    categoryEn:
      typeof rec.categoryEn === 'string' ? rec.categoryEn.slice(0, 120) : 'Crop Plot',
    color: typeof rec.color === 'string' && rec.color.trim() ? rec.color : '#10b981',
    createdAt:
      typeof rec.createdAt === 'string' && rec.createdAt.trim()
        ? rec.createdAt
        : new Date().toISOString(),
    vertices,
    centroid,
    area,
    soil,
    currentCropId,
    ...(typeof rec.customCropLabel === 'string' && rec.customCropLabel.trim()
      ? { customCropLabel: rec.customCropLabel.trim().slice(0, 120) }
      : {}),
    plantingDateISO:
      typeof rec.plantingDateISO === 'string' && rec.plantingDateISO.trim()
        ? rec.plantingDateISO
        : '2026-10-10',
    subZones,
    gridCells:
      Array.isArray(rec.gridCells) && rec.gridCells.length > 0
        ? (rec.gridCells as UserStudyZone['gridCells'])
        : spatial.gridCells,
    farmAverages,
    forecast14,
    weatherSource:
      rec.weatherSource === 'open-meteo-live'
        ? 'open-meteo-live'
        : 'agro-simulation-fallback',
    nasaSource:
      rec.nasaSource === 'nasa-power-live'
        ? 'nasa-power-live'
        : 'nasa-power-calibrated-cache',
    customRotationPlans,
    radiometricSource:
      rec.radiometricSource === 'satellite-tile-pixel-calibrated'
        ? 'satellite-tile-pixel-calibrated'
        : 'agro-coupled-model',
  };
}

/**
 * Strips heavy spatial grid arrays before writing to localStorage so storage stays compact (~2KB per farm).
 */
export function serializeZoneForCompactStorage(zone: UserStudyZone): Record<string, unknown> {
  return {
    id: zone.id,
    ...(zone.ownerUid ? { ownerUid: zone.ownerUid } : {}),
    nameAr: zone.nameAr,
    nameEn: zone.nameEn,
    categoryAr: zone.categoryAr,
    categoryEn: zone.categoryEn,
    color: zone.color,
    createdAt: zone.createdAt,
    vertices: zone.vertices.slice(0, 100),
    centroid: zone.centroid,
    area: zone.area,
    soil: zone.soil,
    currentCropId: zone.currentCropId,
    ...(zone.customCropLabel ? { customCropLabel: zone.customCropLabel } : {}),
    plantingDateISO: zone.plantingDateISO,
    subZones: zone.subZones.slice(0, 6),
    farmAverages: zone.farmAverages,
    weatherSource: zone.weatherSource,
    nasaSource: zone.nasaSource,
    customRotationPlans: zone.customRotationPlans,
    radiometricSource: zone.radiometricSource,
  };
}

/**
 * Merges zone lists across persistence layers (LocalStorage, Cloud SQL, Firestore) additively by ID.
 * An empty response from one source NEVER erases zones from another source; only explicit deletions filter zones out.
 */
export function mergeStudyZonesAdditively(
  sources: ReadonlyArray<ReadonlyArray<UserStudyZone>>,
  deletedZoneIds?: Iterable<string>
): UserStudyZone[] {
  const deletedSet = new Set<string>(deletedZoneIds || []);
  const byId = new Map<string, UserStudyZone>();

  for (const list of sources) {
    if (!Array.isArray(list)) continue;
    for (const z of list) {
      if (!z || typeof z.id !== 'string' || !z.id.trim()) continue;
      if (deletedSet.has(z.id)) continue;
      if (!Array.isArray(z.vertices) || z.vertices.length < 3) continue;

      const existing = byId.get(z.id);
      if (!existing) {
        byId.set(z.id, z);
        continue;
      }

      // Prefer the richer record (ownerUid attached, calibrated pixels, or more sub-zones/gridCells)
      const existingScore =
        (existing.ownerUid ? 4 : 0) +
        (existing.radiometricSource === 'satellite-tile-pixel-calibrated' ? 2 : 0) +
        (existing.gridCells.length > 0 ? 1 : 0);
      const nextScore =
        (z.ownerUid ? 4 : 0) +
        (z.radiometricSource === 'satellite-tile-pixel-calibrated' ? 2 : 0) +
        (z.gridCells.length > 0 ? 1 : 0);

      if (nextScore >= existingScore) {
        byId.set(z.id, {
          ...existing,
          ...z,
          gridCells: z.gridCells.length > 0 ? z.gridCells : existing.gridCells,
          forecast14: z.forecast14.length > 0 ? z.forecast14 : existing.forecast14,
        });
      }
    }
  }

  return Array.from(byId.values()).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function resolvePreferredActiveZone(
  zones: ReadonlyArray<UserStudyZone>,
  candidateIds: ReadonlyArray<string | null | undefined>
): UserStudyZone | null {
  if (!Array.isArray(zones) || zones.length === 0) return null;
  for (const candidate of candidateIds) {
    if (typeof candidate !== 'string' || !candidate.trim()) continue;
    const found = zones.find((z) => z.id === candidate.trim());
    if (found) return found;
  }
  return zones[0];
}

function getSafeLocalStorage(): Storage | null {
  try {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
      return null;
    }
    return window.localStorage;
  } catch {
    return null;
  }
}

export function createEmptyPersistedFarmState(): PersistedFarmState {
  return {
    zones: [],
    activeZoneId: null,
    vertices: [],
    soil: { ...DEFAULT_LOCAL_SOIL_PROFILE },
    currentCropId: 'wheat',
    customCropLabel: undefined,
    activeTab: 'atlas',
    deletedZoneIds: [],
  };
}

export function loadPersistedFarmState(storageOverride?: Storage | null): PersistedFarmState {
  const storage = storageOverride !== undefined ? storageOverride : getSafeLocalStorage();
  const empty = createEmptyPersistedFarmState();
  if (!storage) return empty;

  try {
    const rawJson = storage.getItem(LOCAL_FARM_STATE_STORAGE_KEY);
    if (!rawJson) return empty;
    const parsed = JSON.parse(rawJson) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object') return empty;

    const deletedZoneIds = Array.isArray(parsed.deletedZoneIds)
      ? parsed.deletedZoneIds.filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
      : [];
    const deletedSet = new Set(deletedZoneIds);

    const rawZones = Array.isArray(parsed.zones) ? parsed.zones : [];
    const hydratedZones: UserStudyZone[] = [];
    for (const item of rawZones) {
      const hz = hydrateStudyZoneFromCompactRecord(item);
      if (hz && !deletedSet.has(hz.id)) {
        hydratedZones.push(hz);
      }
    }

    const activeTab: MainTabId = VALID_MAIN_TABS.has(parsed.activeTab as MainTabId)
      ? (parsed.activeTab as MainTabId)
      : 'atlas';

    const requestedActiveId =
      typeof parsed.activeZoneId === 'string' && parsed.activeZoneId.trim()
        ? parsed.activeZoneId.trim()
        : null;

    const matchedActiveZone = resolvePreferredActiveZone(hydratedZones, [requestedActiveId]);
    const activeZoneId = matchedActiveZone ? matchedActiveZone.id : null;

    const rawVertices = Array.isArray(parsed.vertices)
      ? parsed.vertices.filter(isValidLatLon).map((v) => ({ lat: Number(v.lat), lng: Number(v.lng) }))
      : [];

    const vertices =
      rawVertices.length >= 3
        ? rawVertices
        : matchedActiveZone
        ? matchedActiveZone.vertices
        : rawVertices;

    const soil = matchedActiveZone
      ? matchedActiveZone.soil
      : sanitizeSoilProfile(parsed.soil);

    const currentCropId = matchedActiveZone
      ? matchedActiveZone.currentCropId
      : typeof parsed.currentCropId === 'string' && parsed.currentCropId.trim()
      ? parsed.currentCropId.trim().slice(0, 64)
      : 'wheat';

    const customCropLabel = matchedActiveZone
      ? matchedActiveZone.customCropLabel
      : typeof parsed.customCropLabel === 'string' && parsed.customCropLabel.trim()
      ? parsed.customCropLabel.trim().slice(0, 120)
      : undefined;

    return {
      zones: hydratedZones,
      activeZoneId,
      vertices,
      soil,
      currentCropId,
      customCropLabel,
      activeTab,
      deletedZoneIds,
      language: parsed.language === 'en' ? 'en' : 'ar',
      updatedAtISO: typeof parsed.updatedAtISO === 'string' ? parsed.updatedAtISO : undefined,
    };
  } catch {
    return empty;
  }
}

export function savePersistedFarmState(
  state: PersistedFarmState,
  storageOverride?: Storage | null
): boolean {
  const storage = storageOverride !== undefined ? storageOverride : getSafeLocalStorage();
  if (!storage) return false;

  try {
    const compactPayload = {
      zones: (state.zones || []).slice(0, 40).map(serializeZoneForCompactStorage),
      activeZoneId: state.activeZoneId || null,
      vertices: (state.vertices || []).filter(isValidLatLon).slice(0, 100),
      soil: sanitizeSoilProfile(state.soil),
      currentCropId: state.currentCropId || 'wheat',
      ...(state.customCropLabel ? { customCropLabel: state.customCropLabel } : {}),
      activeTab: VALID_MAIN_TABS.has(state.activeTab) ? state.activeTab : 'atlas',
      deletedZoneIds: Array.from(new Set(state.deletedZoneIds || [])).slice(-100),
      ...(state.language ? { language: state.language } : {}),
      updatedAtISO: new Date().toISOString(),
    };
    storage.setItem(LOCAL_FARM_STATE_STORAGE_KEY, JSON.stringify(compactPayload));
    return true;
  } catch {
    return false;
  }
}
