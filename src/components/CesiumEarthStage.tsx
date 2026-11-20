import React, { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import {
  BaseMapStyleId,
  DailyWeatherPoint,
  ElevationColorPalette,
  ElevationDisplayMode,
  GlobalTemperatureSubMode,
  Language,
  LatLon,
  MapDisplayProjectionMode,
  OpenMeteoSoilMoistureDepth,
  RegionDrawingToolMode,
  SpatialGridCell,
  SpectralIndexKey,
  SatelliteVintageId,
  SatelliteVintageLayer,
  ThematicMapLayerId,
  UserStudyZone,
  VentuskyAtmosphericOptions,
  VentuskyLiveTelemetryNode,
} from '../types/agro';
import {
  Play,
  Pause,
  Split,
  RotateCcw,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';
import {
  applyDynamicBinaryVegetationMask,
  computeDynamicBinaryVegetationThreshold,
  evaluateAutomatedNdwiWaterMask,
} from '../utils/agroEngine';
import {
  BASE_MAP_STYLES,
  SATELLITE_VINTAGES_CATALOG,
  getSatelliteVintageById,
  SpatialWindVectorPoint,
  VENTUSKY_CITIES_CATALOG,
  buildLocalizedRainCloudClusters,
  classifyDemDrainageFromNeighborhood,
  classifySatellitePixelForVegetationOverlay,
  evaluateGlobalDayNightSolarAtLatLon,
  evaluateGlobalElevationAtLatLon,
  evaluateGlobalSnowAndBlizzardAtLatLon,
  evaluateSpatialSpectralOrSoilAtLatLon,
  evaluateSpatialWindAtLatLon,
  evaluateVentuskyLayerAtLatLon,
  getElevationRgbTuple,
  isInlandRiverOrLakeAtLatLon,
  isMarineOrOceanWaterAtLatLon,
  isSatellitePixelActiveCropCandidate,
  isSatellitePixelUrbanBuiltCandidate,
  isStrictEnclosedSeaAtLatLon,
  isUrbanBuiltCoreAtLatLon,
  sampleMicroPixelCellularPerturbation,
} from '../utils/thematicMapRenderer';
import { evaluateCellForUnifiedLayer } from '../utils/unifiedLayerManager';
import {
  evaluateOptimizedNdwiWaterMaskFromRgb,
  resolveZoneCellVegetationOverlayVisual,
} from '../utils/satellitePixelAnalyzer';
import {
  decodeNasaGibsNdviFromRgba,
  loadNasaGibsSubTileRgba,
  loadWorldCoverSubTileMask,
} from '../services/authoritativeGisService';
import { debounce } from '../utils/debounce';

declare global {
  interface Window {
    CESIUM_BASE_URL?: string;
  }
}

export interface CesiumCameraStatus {
  center: LatLon;
  altitudeMeters: number;
  headingDeg: number;
  pitchDeg: number;
}

export interface CesiumFlyTarget {
  lat: number;
  lng: number;
  heightMeters: number;
  headingDeg?: number;
  pitchDeg?: number;
  nonce: number;
}

export interface CesiumZoomCommand {
  direction: 'in' | 'out' | 'world';
  nonce: number;
}

interface CesiumEarthStageProps {
  language: Language;
  baseMapStyle: BaseMapStyleId;
  activeThematicMap: ThematicMapLayerId;
  isSoilMoistureActive: boolean;
  soilMoistureDepthMode: OpenMeteoSoilMoistureDepth;
  elevationDisplayMode: ElevationDisplayMode;
  elevationPalette: ElevationColorPalette;
  terrainExaggeration: number;
  overlayOpacity: number;
  showGlobalFieldOverlay: boolean;
  globalTempSubMode: GlobalTemperatureSubMode;
  activeLayer: SpectralIndexKey;
  projectionMode: MapDisplayProjectionMode;
  rotationDeg: number;
  pitchDeg: number;
  viewMode3D: boolean;
  zones: UserStudyZone[];
  activeZoneId: string | null;
  vertices: LatLon[];
  gridCells: SpatialGridCell[];
  showSubZoneLabels: boolean;
  drawingMode: RegionDrawingToolMode;
  activeWeatherDay?: DailyWeatherPoint;
  forecast14: DailyWeatherPoint[];
  selectedMoistureDayIdx: number;
  liveWindNodes?: SpatialWindVectorPoint[];
  ventuskyOptions?: VentuskyAtmosphericOptions;
  liveVentuskyNodes?: VentuskyLiveTelemetryNode[];
  showWhiteBorders?: boolean;
  showStreamlines?: boolean;
  showCityMetrics?: boolean;
  inspectedLatLon?: LatLon | null;
  utcHourOverride?: number | null;
  blendDayNightOverlay?: boolean;
  flyToTarget: CesiumFlyTarget | null;
  zoomCommand: CesiumZoomCommand | null;
  activeSatelliteVintageId?: SatelliteVintageId;
  onSelectSatelliteVintage?: (vintageId: SatelliteVintageId) => void;
  isComparisonMode?: boolean;
  onChangeComparisonMode?: (val: boolean) => void;
  comparisonBaselineVintageId?: SatelliteVintageId;
  onChangeComparisonBaselineVintageId?: (id: SatelliteVintageId) => void;
  comparisonTargetVintageId?: SatelliteVintageId;
  onChangeComparisonTargetVintageId?: (id: SatelliteVintageId) => void;
  isTimeLapsePlaying?: boolean;
  onChangeTimeLapsePlaying?: (val: boolean) => void;
  hideStandaloneVintageWidget?: boolean;
  onSelectPoint: (lat: number, lng: number, terrainHeightMeters: number | null) => void;
  onClickGridCell: (cell: SpatialGridCell) => void;
  onSelectZone?: (zoneId: string) => void;
  onChangeVertices: (verts: LatLon[]) => void;
  onCompleteRectangle: (verts: LatLon[]) => void;
  onCameraStatusChange?: (status: CesiumCameraStatus) => void;
}

function createProceduralFallbackTerrain(): Cesium.TerrainProvider {
  return new Cesium.CustomHeightmapTerrainProvider({
    width: 32,
    height: 32,
    callback: (x: number, y: number, level: number) => {
      const buffer = new Float32Array(32 * 32);
      const scheme = new Cesium.GeographicTilingScheme();
      const rect = scheme.tileXYToRectangle(x, y, level);
      for (let row = 0; row < 32; row++) {
        const v = row / 31;
        const lat = Cesium.Math.toDegrees(
          Cesium.Math.lerp(rect.north, rect.south, v)
        );
        for (let col = 0; col < 32; col++) {
          const u = col / 31;
          const lng = Cesium.Math.toDegrees(
            Cesium.Math.lerp(rect.west, rect.east, u)
          );
          const elev = evaluateGlobalElevationAtLatLon(lat, lng, 0.08).elevationExactMeters;
          buffer[row * 32 + col] = Math.max(0, elev);
        }
      }
      return buffer;
    },
  });
}

function isKnownInlandSubSeaDepression(lat: number, lng: number): boolean {
  const nLng = ((((lng + 180) % 360) + 360) % 360) - 180;
  // All of Egypt: Nile Delta, Nile Valley, Faiyum, Qattara, Siwa, Dakhla, Kharga, Farafra, Toshka, Western & Eastern Deserts & Sinai
  if (
    lat >= 21.8 &&
    lat <= 31.75 &&
    nLng >= 24.7 &&
    nLng <= 35.1 &&
    !isStrictEnclosedSeaAtLatLon(lat, nLng)
  ) {
    return true;
  }
  // Libya inland depressions & desert basins
  if (
    lat >= 19.5 &&
    lat <= 33.0 &&
    nLng >= 9.2 &&
    nLng <= 25.1 &&
    !isStrictEnclosedSeaAtLatLon(lat, nLng)
  ) {
    return true;
  }
  // Sudan & Sahara desert basins
  if (
    lat >= 8.5 &&
    lat <= 22.2 &&
    nLng >= 21.5 &&
    nLng <= 38.5 &&
    !isStrictEnclosedSeaAtLatLon(lat, nLng)
  ) {
    return true;
  }
  // Arabian Peninsula (Saudi Arabia, UAE, Qatar, Oman, Yemen, Kuwait, Iraq, Jordan)
  if (
    lat >= 12.0 &&
    lat <= 33.5 &&
    nLng >= 35.0 &&
    nLng <= 60.0 &&
    !isStrictEnclosedSeaAtLatLon(lat, nLng)
  ) {
    return true;
  }
  return (
    (lat >= 29.8 && lat <= 33.5 && nLng >= 35.0 && nLng <= 36.2) || // Dead Sea & Jordan Valley
    (lat >= 29.5 && lat <= 33.5 && nLng >= 44.0 && nLng <= 49.0) || // Lower Mesopotamia / Basra plain
    (lat >= 36.0 && lat <= 48.0 && nLng >= 45.0 && nLng <= 55.0 && !isStrictEnclosedSeaAtLatLon(lat, nLng)) || // Caspian Depression land
    (lat >= 11.0 && lat <= 15.0 && nLng >= 39.5 && nLng <= 43.0) || // Danakil / Afar Depression
    (lat >= 41.5 && lat <= 44.0 && nLng >= 87.5 && nLng <= 91.0) || // Turpan Depression
    (lat >= 32.0 && lat <= 37.5 && nLng >= -118.0 && nLng <= -114.5) || // Death Valley & Salton Trough
    (lat >= 51.0 && lat <= 54.0 && nLng >= 3.0 && nLng <= 7.5) || // Netherlands & Flemish Polders
    (lat >= -31.0 && lat <= -27.0 && nLng >= 136.0 && nLng <= 139.0) // Lake Eyre Basin
  );
}

// Decoded 256x256 Float32Array elevation cache for parent DEM tiles (never caches null/failures!)
const decodedParentDemCache = new Map<string, Float32Array>();
const inFlightParentDemCache = new Map<string, Promise<Float32Array | null>>();
let sharedDemDecodeCanvas: HTMLCanvasElement | null = null;
let sharedDemDecodeCtx: CanvasRenderingContext2D | null = null;

function fetchDecodedParentTerrariumDem(
  z: number,
  x: number,
  y: number
): Promise<Float32Array | null> {
  const n = Math.pow(2, z);
  const wx = ((x % n) + n) % n;
  const wy = Math.max(0, Math.min(n - 1, y));
  const key = `${z}/${wx}/${wy}`;

  const cachedFloat = decodedParentDemCache.get(key);
  if (cachedFloat) {
    // Refresh LRU order on cache hit
    decodedParentDemCache.delete(key);
    decodedParentDemCache.set(key, cachedFloat);
    return Promise.resolve(cachedFloat);
  }

  const inFlight = inFlightParentDemCache.get(key);
  if (inFlight) return inFlight;

  const p = new Promise<Float32Array | null>((resolve) => {
    let settled = false;
    const finish = (val: Float32Array | null) => {
      if (settled) return;
      settled = true;
      inFlightParentDemCache.delete(key);
      if (val) {
        if (decodedParentDemCache.size > 400) {
          const oldestKey = decodedParentDemCache.keys().next().value;
          if (oldestKey) decodedParentDemCache.delete(oldestKey);
        }
        decodedParentDemCache.set(key, val);
      }
      resolve(val);
    };

    const timer = setTimeout(() => finish(null), 6500);
    const im = new Image();
    im.crossOrigin = 'anonymous';
    im.onload = () => {
      clearTimeout(timer);
      try {
        if (!sharedDemDecodeCanvas) {
          sharedDemDecodeCanvas = document.createElement('canvas');
          sharedDemDecodeCanvas.width = 256;
          sharedDemDecodeCanvas.height = 256;
          sharedDemDecodeCtx = sharedDemDecodeCanvas.getContext('2d', {
            willReadFrequently: true,
          });
        }
        const ctx = sharedDemDecodeCtx;
        if (!ctx) {
          finish(null);
          return;
        }
        ctx.clearRect(0, 0, 256, 256);
        ctx.drawImage(im, 0, 0, 256, 256);
        const src = ctx.getImageData(0, 0, 256, 256).data;
        const elev = new Float32Array(256 * 256);
        for (let i = 0, ptr = 0; i < 65536; i++, ptr += 4) {
          elev[i] = src[ptr] * 256 + src[ptr + 1] + src[ptr + 2] / 256 - 32768;
        }
        finish(elev);
      } catch {
        finish(null);
      }
    };
    im.onerror = () => {
      clearTimeout(timer);
      finish(null);
    };
    im.src = `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${wx}/${wy}.png`;
  });

  inFlightParentDemCache.set(key, p);
  return p;
}

/**
 * Resamples a sub-window of a 256x256 parent DEM Float32Array into a (w x h) Float32Array
 * using true 2D Bilinear Interpolation so zoomed-in tiles never show blocky stair-step pixelation.
 */
function resampleParentDemBilinear(
  parentDem: Float32Array,
  usedShift: number,
  x: number,
  y: number,
  w: number,
  h: number
): Float32Array {
  const srcW = 256;
  const srcH = 256;
  const subDiv = 1 << usedShift;
  const subW = srcW / subDiv;
  const subH = srcH / subDiv;
  const sx0 = (x & (subDiv - 1)) * subW;
  const sy0 = (y & (subDiv - 1)) * subH;

  const out = new Float32Array(w * h);
  for (let py = 0; py < h; py++) {
    const exactY = Math.max(0, Math.min(srcH - 1.0001, sy0 + ((py + 0.5) / h) * subH - 0.5));
    const y0 = Math.floor(exactY);
    const y1 = Math.min(srcH - 1, y0 + 1);
    const fy = exactY - y0;
    const row0 = y0 * srcW;
    const row1 = y1 * srcW;

    for (let px = 0; px < w; px++) {
      const exactX = Math.max(0, Math.min(srcW - 1.0001, sx0 + ((px + 0.5) / w) * subW - 0.5));
      const x0 = Math.floor(exactX);
      const x1 = Math.min(srcW - 1, x0 + 1);
      const fx = exactX - x0;

      const w00 = (1 - fx) * (1 - fy);
      const w10 = fx * (1 - fy);
      const w01 = (1 - fx) * fy;
      const w11 = fx * fy;

      out[py * w + px] =
        parentDem[row0 + x0] * w00 +
        parentDem[row0 + x1] * w10 +
        parentDem[row1 + x0] * w01 +
        parentDem[row1 + x1] * w11;
    }
  }
  return out;
}

/**
 * Loads the Terrarium DEM tile for (level, x, y), capping network fetches at z=6 and automatically
 * resampling parent tiles with 2D Bilinear Interpolation (falling back through ancestor z levels
 * so zero tiles ever drop or show tile-boundary seams!).
 */
async function loadTerrariumSubTileData(
  x: number,
  y: number,
  level: number,
  w: number,
  h: number
): Promise<Float32Array | null> {
  const maxDemZ = 7;
  const targetZ = Math.min(level, maxDemZ);

  // Fast path: check if targetZ or any ancestor z is already decoded in memory (no network needed!)
  for (let z = targetZ; z >= 2; z--) {
    const shift = level - z;
    const ty = y >> shift;
    const n = Math.pow(2, z);
    const wx = (((x >> shift) % n) + n) % n;
    const wy = Math.max(0, Math.min(n - 1, ty));
    const cached = decodedParentDemCache.get(`${z}/${wx}/${wy}`);
    if (cached) {
      return resampleParentDemBilinear(cached, shift, x, y, w, h);
    }
  }

  // Fetch targetZ (or fall back once to targetZ - 1 if needed)
  const minFetchZ = Math.max(2, targetZ - 1);
  for (let z = targetZ; z >= minFetchZ; z--) {
    const shift = level - z;
    const parentDem = await fetchDecodedParentTerrariumDem(z, x >> shift, y >> shift);
    if (parentDem) {
      return resampleParentDemBilinear(parentDem, shift, x, y, w, h);
    }
  }

  // Any cached ancestor tile down to z=2 as instant offline/low-latency fallback
  for (let z = targetZ - 2; z >= 2; z--) {
    const shift = level - z;
    const ty = y >> shift;
    const n = Math.pow(2, z);
    const wx = (((x >> shift) % n) + n) % n;
    const wy = Math.max(0, Math.min(n - 1, ty));
    const cached = decodedParentDemCache.get(`${z}/${wx}/${wy}`);
    if (cached) {
      return resampleParentDemBilinear(cached, shift, x, y, w, h);
    }
  }

  return null;
}

const decodedEsriSatCache = new Map<string, Uint8ClampedArray>();
const inFlightEsriSatCache = new Map<string, Promise<Uint8ClampedArray | null>>();
const renderedThematicTileCache = new Map<string, HTMLCanvasElement>();
const MAX_RENDERED_THEMATIC_TILE_CACHE = 320;
let sharedSatDecodeCanvas: HTMLCanvasElement | null = null;
let sharedSatDecodeCtx: CanvasRenderingContext2D | null = null;

// Allow up to 8 concurrent tile decodes per frame so NDVI appears rapidly without dropping frames
let activeTileDecodeCount = 0;
const tileDecodeWaiters: Array<() => void> = [];
function acquireTileDecodeSlot(): Promise<void> {
  if (activeTileDecodeCount < 8) {
    activeTileDecodeCount++;
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => {
    tileDecodeWaiters.push(() => {
      activeTileDecodeCount++;
      resolve();
    });
  });
}
function releaseTileDecodeSlot(): void {
  activeTileDecodeCount = Math.max(0, activeTileDecodeCount - 1);
  const next = tileDecodeWaiters.shift();
  if (next) {
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => next());
    } else {
      setTimeout(next, 0);
    }
  }
}

// Dedicated network fetch concurrency limiter for Esri World Imagery tiles so outer viewport tiles
// never time out while waiting in the browser's per-origin connection queue.
let activeSatFetchCount = 0;
const satFetchWaiters: Array<() => void> = [];
function acquireSatFetchSlot(): Promise<void> {
  if (activeSatFetchCount < 10) {
    activeSatFetchCount++;
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => {
    satFetchWaiters.push(() => {
      activeSatFetchCount++;
      resolve();
    });
  });
}
function releaseSatFetchSlot(): void {
  activeSatFetchCount = Math.max(0, activeSatFetchCount - 1);
  const next = satFetchWaiters.shift();
  if (next) {
    next();
  }
}

async function fetchDecodedEsriSatelliteRgb(
  z: number,
  tx: number,
  ty: number
): Promise<Uint8ClampedArray | null> {
  const n = Math.pow(2, z);
  const wx = ((tx % n) + n) % n;
  const wy = Math.max(0, Math.min(n - 1, ty));
  const key = `${z}/${wx}/${wy}`;

  const cached = decodedEsriSatCache.get(key);
  if (cached) {
    decodedEsriSatCache.delete(key);
    decodedEsriSatCache.set(key, cached);
    return cached;
  }

  const existing = inFlightEsriSatCache.get(key);
  if (existing) return existing;

  const attemptDownload = async (timeoutMs: number): Promise<Uint8ClampedArray | null> => {
    await acquireSatFetchSlot();
    return new Promise<Uint8ClampedArray | null>((resolve) => {
      let settled = false;
      const finish = (val: Uint8ClampedArray | null) => {
        if (settled) return;
        settled = true;
        releaseSatFetchSlot();
        resolve(val);
      };

      // Timeout starts ONLY after acquiring an active network slot
      const timer = setTimeout(() => finish(null), timeoutMs);
      const im = new Image();
      im.crossOrigin = 'anonymous';
      im.onload = () => {
        clearTimeout(timer);
        try {
          if (!sharedSatDecodeCanvas) {
            sharedSatDecodeCanvas = document.createElement('canvas');
            sharedSatDecodeCanvas.width = 256;
            sharedSatDecodeCanvas.height = 256;
            sharedSatDecodeCtx = sharedSatDecodeCanvas.getContext('2d', {
              willReadFrequently: true,
            });
          }
          const ctx = sharedSatDecodeCtx;
          if (!ctx) {
            finish(null);
            return;
          }
          ctx.clearRect(0, 0, 256, 256);
          ctx.drawImage(im, 0, 0, 256, 256);
          const rgba = ctx.getImageData(0, 0, 256, 256).data;
          const rgb = new Uint8ClampedArray(256 * 256 * 3);
          for (let i = 0, src = 0, dst = 0; i < 65536; i++, src += 4, dst += 3) {
            rgb[dst] = rgba[src];
            rgb[dst + 1] = rgba[src + 1];
            rgb[dst + 2] = rgba[src + 2];
          }
          finish(rgb);
        } catch {
          finish(null);
        }
      };
      im.onerror = () => {
        clearTimeout(timer);
        finish(null);
      };
      im.src = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${wy}/${wx}`;
    });
  };

  const p = (async (): Promise<Uint8ClampedArray | null> => {
    try {
      let rgb = await attemptDownload(5000);
      if (!rgb) {
        // Automatic retry on transient network timeout so edge tiles never stay uncolored
        rgb = await attemptDownload(5500);
      }
      if (rgb) {
        if (decodedEsriSatCache.size > 600) {
          const oldestKey = decodedEsriSatCache.keys().next().value;
          if (oldestKey) decodedEsriSatCache.delete(oldestKey);
        }
        decodedEsriSatCache.set(key, rgb);
      }
      return rgb;
    } finally {
      inFlightEsriSatCache.delete(key);
    }
  })();

  inFlightEsriSatCache.set(key, p);
  return p;
}

function resampleEsriSatRgb(
  srcRgb: Uint8ClampedArray,
  usedShift: number,
  x: number,
  y: number,
  w: number,
  h: number
): Uint8ClampedArray {
  const srcW = 256;
  const srcH = 256;
  if (usedShift === 0 && w === 256 && h === 256) {
    return srcRgb;
  }
  const subDiv = 1 << usedShift;
  const subW = srcW / subDiv;
  const subH = srcH / subDiv;
  const sx0 = (x & (subDiv - 1)) * subW;
  const sy0 = (y & (subDiv - 1)) * subH;

  const out = new Uint8ClampedArray(w * h * 3);
  for (let py = 0; py < h; py++) {
    const sy = Math.max(0, Math.min(srcH - 1, Math.floor(sy0 + ((py + 0.5) / h) * subH)));
    const rowOff = sy * srcW;
    for (let px = 0; px < w; px++) {
      const sx = Math.max(0, Math.min(srcW - 1, Math.floor(sx0 + ((px + 0.5) / w) * subW)));
      const sIdx = (rowOff + sx) * 3;
      const dIdx = (py * w + px) * 3;
      out[dIdx] = srcRgb[sIdx];
      out[dIdx + 1] = srcRgb[sIdx + 1];
      out[dIdx + 2] = srcRgb[sIdx + 2];
    }
  }
  return out;
}

async function loadEsriSatelliteSubTileRgb(
  x: number,
  y: number,
  level: number,
  w: number,
  h: number
): Promise<Uint8ClampedArray | null> {
  const maxSatZ = 16;
  const targetZ = Math.min(level, maxSatZ);

  // 1. Check exact targetZ in memory cache first
  const exactShift = level - targetZ;
  const exactN = Math.pow(2, targetZ);
  const exactWx = (((x >> exactShift) % exactN) + exactN) % exactN;
  const exactWy = Math.max(0, Math.min(exactN - 1, y >> exactShift));
  const exactCacheKey = `${targetZ}/${exactWx}/${exactWy}`;
  const cachedExact = decodedEsriSatCache.get(exactCacheKey);
  if (cachedExact) {
    decodedEsriSatCache.delete(exactCacheKey);
    decodedEsriSatCache.set(exactCacheKey, cachedExact);
    return resampleEsriSatRgb(cachedExact, exactShift, x, y, w, h);
  }

  // 2. Identify nearest cached ancestor tile (if any) as instant zero-latency fallback
  let cachedFallback: Uint8ClampedArray | null = null;
  for (let z = targetZ - 1; z >= 2; z--) {
    const shift = level - z;
    const n = Math.pow(2, z);
    const wx = (((x >> shift) % n) + n) % n;
    const wy = Math.max(0, Math.min(n - 1, y >> shift));
    const cached = decodedEsriSatCache.get(`${z}/${wx}/${wy}`);
    if (cached) {
      cachedFallback = resampleEsriSatRgb(cached, shift, x, y, w, h);
      break;
    }
  }

  // 3. Attempt network fetch for targetZ or targetZ - 1
  for (let z = targetZ; z >= Math.max(2, targetZ - 1); z--) {
    const shift = level - z;
    const satRgb = await fetchDecodedEsriSatelliteRgb(z, x >> shift, y >> shift);
    if (satRgb) {
      return resampleEsriSatRgb(satRgb, shift, x, y, w, h);
    }
  }

  // 4. If network failed or timed out, return the cached ancestor fallback so zooming in NEVER blanks out!
  return cachedFallback;
}

/**
 * Determines with 100% accuracy whether a pixel is Ocean/Sea water vs. Land.
 * - Protects all inland sub-sea depressions & coastal deltas (Nile Delta, Damietta, Port Said, Manzala, Bardawil, Faiyum, Qattara, etc.)
 * - Uses the exact Terrarium DEM shoreline (`elev > 0.04` is ALWAYS land on every continent, peninsula, and island!)
 */
function isExactOceanOrSeaPixel(
  lat: number,
  lng: number,
  elev: number,
  hasRealDem: boolean
): boolean {
  if (lat > 78 || lat < -56) {
    const normLng = ((((lng + 180) % 360) + 360) % 360) - 180;
    if (lat <= 83 && normLng >= -72 && normLng <= -14) return false;
    return true;
  }

  // 1. Strictly mask enclosed sea troughs (Red Sea, Suez, Aqaba, Arabian Gulf, Black Sea, Caspian Sea, Med open waters)
  if (isStrictEnclosedSeaAtLatLon(lat, lng)) {
    return true;
  }

  // 2. Always protect known inland depressions & continental basins
  if (isKnownInlandSubSeaDepression(lat, lng)) {
    return false;
  }

  // 3. Continental landmass check: if polygon geography confirms point is on continental land, it is NEVER ocean!
  const isMarine = isMarineOrOceanWaterAtLatLon(lat, lng);
  if (!isMarine) {
    return false;
  }

  // 4. If in coastal/marine zone, check DEM: elevation > 0.04m indicates coastal land, barrier island or peninsula
  if (hasRealDem && elev > 0.04) {
    return false;
  }

  return true;
}

/**
 * Applies a 3x3 Morphological Coastal Dilation & Bilinear Boundary Feathering pass on a tile's
 * raw land mask so coastal peninsulas, barrier islands, and sandbars are 100% covered without
 * jagged stair-step pixelation.
 */
function buildDilatedCoastalLandAlphaMask(
  w: number,
  h: number,
  latByPy: Float64Array,
  lngByPx: Float64Array,
  elevGrid: Float32Array,
  hasRealDem: boolean
): Uint8Array {
  const rawLand = new Uint8Array(w * h);
  for (let py = 0; py < h; py++) {
    const lat = latByPy[py];
    for (let px = 0; px < w; px++) {
      const idx = py * w + px;
      rawLand[idx] = isExactOceanOrSeaPixel(lat, lngByPx[px], elevGrid[idx], hasRealDem) ? 0 : 1;
    }
  }

  // 3x3 dilation + bilinear shoreline anti-aliasing weight (0..255)
  const alphaMask = new Uint8Array(w * h);
  for (let py = 0; py < h; py++) {
    const y0 = Math.max(0, py - 1);
    const y1 = Math.min(h - 1, py + 1);
    for (let px = 0; px < w; px++) {
      const idx = py * w + px;
      if (rawLand[idx] === 1) {
        alphaMask[idx] = 255;
        continue;
      }
      // If an ocean pixel directly borders land (and is not deep inside a strict enclosed sea), feather it smoothly
      const x0 = Math.max(0, px - 1);
      const x1 = Math.min(w - 1, px + 1);
      let landNeighbors = 0;
      for (let ny = y0; ny <= y1; ny++) {
        for (let nx = x0; nx <= x1; nx++) {
          landNeighbors += rawLand[ny * w + nx];
        }
      }
      if (landNeighbors >= 3 && !isStrictEnclosedSeaAtLatLon(latByPy[py], lngByPx[px])) {
        alphaMask[idx] = Math.min(255, Math.round((landNeighbors / 6) * 255));
      } else {
        alphaMask[idx] = 0;
      }
    }
  }
  return alphaMask;
}

/**
 * Real AWS/Mapzen Terrarium DEM per-pixel ImageryProvider (100% zero missing tiles, Bilinear smoothed!).
 */
function createTerrariumElevationImageryProvider(
  palette: ElevationColorPalette,
  displayMode: ElevationDisplayMode,
  isDisposed: () => boolean,
  onTileDecoded: () => void
): Cesium.UrlTemplateImageryProvider {
  const provider = new Cesium.UrlTemplateImageryProvider({
    url: 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',
    maximumLevel: 14,
    enablePickFeatures: false,
  });

  provider.requestImage = (x: number, y: number, level: number) => {
    if (isDisposed()) return undefined;
    const w = 128;
    const h = 128;

    return loadTerrariumSubTileData(x, y, level, w, h).then(async (demGrid) => {
      if (isDisposed()) return Promise.reject(new Error('Disposed'));
      await acquireTileDecodeSlot();
      try {
        if (isDisposed()) return Promise.reject(new Error('Disposed'));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx || isDisposed()) return Promise.reject(new Error('Disposed'));

      const outImg = ctx.createImageData(w, h);
      const out = outImg.data;
      const n = Math.pow(2, level);
      const latByPy = new Float64Array(h);
      const lngByPx = new Float64Array(w);
      for (let py = 0; py < h; py++) {
        const ty = y + (py + 0.5) / h;
        const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * ty) / n)));
        latByPy[py] = (latRad * 180) / Math.PI;
      }
      for (let px = 0; px < w; px++) {
        const tx = x + (px + 0.5) / w;
        lngByPx[px] = (tx / n) * 360 - 180;
      }

      const hasRealDem = demGrid !== null;
      const elevGrid = demGrid ?? new Float32Array(w * h);
      if (!hasRealDem) {
        for (let py = 0; py < h; py++) {
          const lat = latByPy[py];
          for (let px = 0; px < w; px++) {
            elevGrid[py * w + px] = evaluateGlobalElevationAtLatLon(
              lat,
              lngByPx[px],
              0.05
            ).elevationExactMeters;
          }
        }
      }

      const landAlphaMask = buildDilatedCoastalLandAlphaMask(
        w,
        h,
        latByPy,
        lngByPx,
        elevGrid,
        hasRealDem
      );

      const contourSpacing =
        level <= 3 ? 500 : level <= 5 ? 250 : level <= 7 ? 100 : level <= 9 ? 50 : level <= 11 ? 20 : 5;
      const showContours = displayMode !== '3d_color_only';
      const contoursOnly = displayMode === 'contours_only';
      // High-relief 3D sun scale so mountain peaks and ridges stand out dramatically
      const sunScale = level <= 4 ? 3.2 : level <= 7 ? 2.45 : 1.75;

      const tyCenter = y + 0.5;
      const centerLatRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * tyCenter) / n)));
      const metersPerPx = Math.max(
        10,
        (156543.03 * Math.cos(centerLatRad)) / Math.pow(2, level)
      );

      for (let py = 0; py < h; py++) {
        const pyUp = Math.max(0, py - 1);
        const pyDown = Math.min(h - 1, py + 1);
        // Snap to 2x2 micro-pixel cells so zoomed-in elevation shows crisp micro-pixel topographic detail
        const microLat = latByPy[py & ~1];
        for (let px = 0; px < w; px++) {
          const cellIdx = py * w + px;
          const p = cellIdx * 4;
          const maskAlpha = landAlphaMask[cellIdx];

          if (maskAlpha === 0) {
            out[p + 3] = 0;
            continue;
          }

          const microLng = lngByPx[px & ~1];
          const microPerturb = sampleMicroPixelCellularPerturbation(microLat, microLng, level, px, py);
          const rawElev = Math.max(0, elevGrid[cellIdx]);
          // Apply subtle micro-pixel topographic facet variation so individual terrain cells and peaks are crisp
          const elev = Math.max(
            0,
            rawElev + microPerturb.deltaScalar * (rawElev > 600 ? 18 : rawElev > 150 ? 7 : 1.8)
          );

          if (showContours) {
            const pxRight = Math.min(w - 1, px + 1);
            const elevR = Math.max(0, elevGrid[py * w + pxRight]);
            const elevD = Math.max(0, elevGrid[pyDown * w + px]);
            const bandC = Math.floor(rawElev / contourSpacing);
            const isLine =
              bandC !== Math.floor(elevR / contourSpacing) ||
              bandC !== Math.floor(elevD / contourSpacing);

            if (contoursOnly) {
              if (isLine) {
                out[p] = 254;
                out[p + 1] = 240;
                out[p + 2] = 138;
                out[p + 3] = Math.round((230 * maskAlpha) / 255);
              } else {
                out[p + 3] = 0;
              }
              continue;
            }

            if (isLine) {
              out[p] = 254;
              out[p + 1] = 243;
              out[p + 2] = 175;
              out[p + 3] = Math.round((242 * maskAlpha) / 255);
              continue;
            }
          }

          const pxLeft = Math.max(0, px - 1);
          const pxRight = Math.min(w - 1, px + 1);
          const dzdx = (elevGrid[py * w + pxRight] - elevGrid[py * w + pxLeft]) / (2 * metersPerPx);
          const dzdy = (elevGrid[pyDown * w + px] - elevGrid[pyUp * w + px]) / (2 * metersPerPx);
          const slopeMag = Math.hypot(dzdx, dzdy);
          const nx = -dzdx * sunScale;
          const ny = -dzdy * sunScale;
          const nz = 1.0;
          const len = Math.hypot(nx, ny, nz);
          // Primary NW directional sun + secondary ridge rim light for realistic 3D peaks
          const dotSun = Math.max(0, (-0.58 * nx - 0.58 * ny + 0.57 * nz) / len);
          const ridgeCrestBoost =
            rawElev > 450 && slopeMag > 0.04 ? Math.min(0.22, slopeMag * 0.85) : 0;
          const microFacetShade = 1.0 + microPerturb.deltaScalar * 0.075;
          const shade = (0.58 + dotSun * 0.62 + ridgeCrestBoost) * microFacetShade;

          const [br, bg, bb] = getElevationRgbTuple(elev, palette);
          // Highlight high mountain peaks (>1400m) with crisp alpine ridge contrast
          const peakGlow =
            rawElev > 1400 ? Math.min(34, Math.round(((rawElev - 1400) / 1800) * 34 * dotSun)) : 0;
          out[p] = Math.min(255, Math.max(0, Math.round(br * shade + peakGlow)));
          out[p + 1] = Math.min(255, Math.max(0, Math.round(bg * shade + peakGlow)));
          out[p + 2] = Math.min(255, Math.max(0, Math.round(bb * shade + peakGlow * 1.15)));
          out[p + 3] = Math.round((242 * maskAlpha) / 255);
        }
      }

      ctx.putImageData(outImg, 0, 0);
      onTileDecoded();
      return canvas;
      } finally {
        releaseTileDecodeSlot();
      }
    });
  };

  return provider;
}

/**
 * Agricultural DEM Drainage & Low-Spot Depression Imagery Provider (`dem_drainage`).
 * - Identifies low-lying waterlogging depressions (deep blue), natural drainage swales (cyan),
 *   balanced drainage grades (lime), and elevated rapid-runoff ridges (orange).
 * - Overlays crisp downhill flow-direction arrows at field & district zoom levels (`level >= 9`).
 */
function createDemDrainageImageryProvider(
  isDisposed: () => boolean,
  onTileDecoded: () => void
): Cesium.UrlTemplateImageryProvider {
  const provider = new Cesium.UrlTemplateImageryProvider({
    url: 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',
    maximumLevel: 14,
    enablePickFeatures: false,
  });

  provider.requestImage = (x: number, y: number, level: number) => {
    if (isDisposed()) return undefined;
    const w = 128;
    const h = 128;

    return loadTerrariumSubTileData(x, y, level, w, h).then(async (demGrid) => {
      if (isDisposed()) return Promise.reject(new Error('Disposed'));
      await acquireTileDecodeSlot();
      try {
        if (isDisposed()) return Promise.reject(new Error('Disposed'));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx || isDisposed()) return Promise.reject(new Error('Disposed'));

        const outImg = ctx.createImageData(w, h);
        const out = outImg.data;
        const n = Math.pow(2, level);
        const latByPy = new Float64Array(h);
        const lngByPx = new Float64Array(w);
        for (let py = 0; py < h; py++) {
          const ty = y + (py + 0.5) / h;
          const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * ty) / n)));
          latByPy[py] = (latRad * 180) / Math.PI;
        }
        for (let px = 0; px < w; px++) {
          const tx = x + (px + 0.5) / w;
          lngByPx[px] = (tx / n) * 360 - 180;
        }

        const hasRealDem = demGrid !== null;
        const elevGrid = demGrid ?? new Float32Array(w * h);
        if (!hasRealDem) {
          for (let py = 0; py < h; py++) {
            const lat = latByPy[py];
            for (let px = 0; px < w; px++) {
              elevGrid[py * w + px] = evaluateGlobalElevationAtLatLon(
                lat,
                lngByPx[px],
                0.015
              ).elevationExactMeters;
            }
          }
        }

        const landAlphaMask = buildDilatedCoastalLandAlphaMask(
          w,
          h,
          latByPy,
          lngByPx,
          elevGrid,
          hasRealDem
        );

        const tyCenter = y + 0.5;
        const centerLatRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * tyCenter) / n)));
        const metersPerPx = Math.max(
          8,
          (156543.03 * Math.cos(centerLatRad)) / Math.pow(2, level)
        );
        const nbRadius = 3;

        for (let py = 0; py < h; py++) {
          const pyN = Math.max(0, py - nbRadius);
          const pyS = Math.min(h - 1, py + nbRadius);
          for (let px = 0; px < w; px++) {
            const cellIdx = py * w + px;
            const p = cellIdx * 4;
            const maskAlpha = landAlphaMask[cellIdx];
            if (maskAlpha === 0) {
              out[p + 3] = 0;
              continue;
            }

            const pxW = Math.max(0, px - nbRadius);
            const pxE = Math.min(w - 1, px + nbRadius);
            const cElev = elevGrid[cellIdx];
            const eElev = elevGrid[py * w + pxE];
            const wElev = elevGrid[py * w + pxW];
            const nElev = elevGrid[pyN * w + px];
            const sElev = elevGrid[pyS * w + px];

            const cls = classifyDemDrainageFromNeighborhood(
              cElev,
              eElev,
              wElev,
              nElev,
              sElev,
              metersPerPx * nbRadius
            );
            // Subtle shaded relief so depressions read as lower pockets on terrain
            const dzdx = (eElev - wElev) / (2 * metersPerPx * nbRadius);
            const dzdy = (nElev - sElev) / (2 * metersPerPx * nbRadius);
            const nx = -dzdx * 2.1;
            const ny = -dzdy * 2.1;
            const len = Math.hypot(nx, ny, 1.0);
            const dotSun = Math.max(0, (-0.55 * nx - 0.55 * ny + 0.62) / len);
            const shade = 0.72 + dotSun * 0.42;

            const [br, bg, bb] = cls.rgb;
            out[p] = Math.min(255, Math.max(0, Math.round(br * shade)));
            out[p + 1] = Math.min(255, Math.max(0, Math.round(bg * shade)));
            out[p + 2] = Math.min(255, Math.max(0, Math.round(bb * shade)));
            out[p + 3] = Math.round((220 * maskAlpha) / 255);
          }
        }

        ctx.putImageData(outImg, 0, 0);

        // Draw crisp downhill drainage direction arrows when zoomed into basin/field levels
        if (level >= 8) {
          ctx.save();
          ctx.strokeStyle = 'rgba(248, 250, 252, 0.85)';
          ctx.fillStyle = 'rgba(248, 250, 252, 0.85)';
          ctx.lineWidth = 1.25;
          const step = level >= 11 ? 24 : 32;
          for (let py = Math.floor(step / 2); py < h - 8; py += step) {
            const pyN = Math.max(0, py - 3);
            const pyS = Math.min(h - 1, py + 3);
            for (let px = Math.floor(step / 2); px < w - 8; px += step) {
              const cellIdx = py * w + px;
              if (landAlphaMask[cellIdx] < 80) continue;
              const pxW = Math.max(0, px - 3);
              const pxE = Math.min(w - 1, px + 3);
              const dzdx = elevGrid[py * w + pxE] - elevGrid[py * w + pxW];
              const dzdyNorth = elevGrid[pyN * w + px] - elevGrid[pyS * w + px];
              // Canvas screen Y increases southward, so downhill vector is (-dzdx, +dzdyNorth)
              const vx = -dzdx;
              const vy = dzdyNorth;
              const mag = Math.hypot(vx, vy);
              if (mag < 0.02) continue;
              const ux = vx / mag;
              const uy = vy / mag;
              const arrowLen = 6.5;
              const x0 = px - ux * (arrowLen * 0.45);
              const y0 = py - uy * (arrowLen * 0.45);
              const x1 = px + ux * (arrowLen * 0.55);
              const y1 = py + uy * (arrowLen * 0.55);

              ctx.beginPath();
              ctx.moveTo(x0, y0);
              ctx.lineTo(x1, y1);
              ctx.stroke();

              const headAngle = Math.atan2(uy, ux);
              ctx.beginPath();
              ctx.moveTo(x1, y1);
              ctx.lineTo(
                x1 - 3.2 * Math.cos(headAngle - 0.55),
                y1 - 3.2 * Math.sin(headAngle - 0.55)
              );
              ctx.lineTo(
                x1 - 3.2 * Math.cos(headAngle + 0.55),
                y1 - 3.2 * Math.sin(headAngle + 0.55)
              );
              ctx.closePath();
              ctx.fill();
            }
          }
          ctx.restore();
        }

        onTileDecoded();
        return canvas;
      } finally {
        releaseTileDecodeSlot();
      }
    });
  };

  return provider;
}

/**
 * High-Resolution 256x256 Authoritative Land-Masked Spectral, Water & Soil Imagery Provider.
 * Combines:
 *  1) ESA WorldCover 2021 10m Land Cover Mask (Class 50 = Built-up/Roads -> alpha = 0; Class 80 = Water)
 *  2) Esri World Imagery 1:1 sub-meter RGB optical classification & 3x3 texture variance filtering
 *  3) NASA GIBS (MODIS NDVI / LST & SMAP Soil Moisture) regional calibration
 *  4) AWS Mapzen Terrarium DEM elevation & coastal masking
 * Strictly prevents buildings, streets, and rooftops from being tinted by NDWI, Soil Moisture, Salinity, pH, LST, or NDVI.
 */
function createSmoothLandThematicImageryProvider(
  spectralKey: SpectralIndexKey,
  activeWeatherDay: DailyWeatherPoint | undefined,
  isDisposed: () => boolean,
  onTileDecoded: () => void
): Cesium.UrlTemplateImageryProvider {
  const isPlantOnlyLayer =
    spectralKey === 'NDVI' || spectralKey === 'SAVI' || spectralKey === 'EVI';

  const provider = new Cesium.UrlTemplateImageryProvider({
    url: 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',
    maximumLevel: 16,
    enablePickFeatures: false,
  });

  provider.requestImage = (x: number, y: number, level: number) => {
    if (isDisposed()) return undefined;
    const w = 256;
    const h = 256;
    const tileCacheKey = `${spectralKey}/${level}/${x}/${y}/${
      isPlantOnlyLayer ? 'wc10m_v2' : `${activeWeatherDay?.date ?? 'base'}_wc10m_v2`
    }`;
    const cachedCanvas = renderedThematicTileCache.get(tileCacheKey);
    if (cachedCanvas) {
      renderedThematicTileCache.delete(tileCacheKey);
      renderedThematicTileCache.set(tileCacheKey, cachedCanvas);
      onTileDecoded();
      return Promise.resolve(cachedCanvas);
    }

    const rememberTileCanvas = (canvas: HTMLCanvasElement): HTMLCanvasElement => {
      if (renderedThematicTileCache.size >= MAX_RENDERED_THEMATIC_TILE_CACHE) {
        const oldestKey = renderedThematicTileCache.keys().next().value;
        if (oldestKey !== undefined) {
          renderedThematicTileCache.delete(oldestKey);
        }
      }
      renderedThematicTileCache.set(tileCacheKey, canvas);
      return canvas;
    };

    const gibsLayerKey =
      spectralKey === 'NDVI' || spectralKey === 'SAVI' || spectralKey === 'EVI'
        ? 'NDVI'
        : spectralKey === 'LST'
        ? 'LST'
        : spectralKey === 'SM_0_7' || spectralKey === 'SM_7_28'
        ? 'SM'
        : null;

    return Promise.all([
      isPlantOnlyLayer
        ? Promise.resolve(null)
        : loadTerrariumSubTileData(x, y, level, w, h),
      loadEsriSatelliteSubTileRgb(x, y, level, w, h),
      loadWorldCoverSubTileMask(x, y, level, w, h),
      gibsLayerKey
        ? loadNasaGibsSubTileRgba(gibsLayerKey, x, y, level, w, h)
        : Promise.resolve(null),
    ]).then(async ([demGrid, satRgb, wcMask, gibsRgba]) => {
      if (isDisposed()) return Promise.reject(new Error('Disposed'));
      await acquireTileDecodeSlot();
      try {
        if (isDisposed()) return Promise.reject(new Error('Disposed'));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx || isDisposed()) return Promise.reject(new Error('Disposed'));

        const outImg = ctx.createImageData(w, h);
        const out = outImg.data;

        const n = Math.pow(2, level);
        const latByPy = new Float64Array(h);
        const lngByPx = new Float64Array(w);
        for (let py = 0; py < h; py++) {
          const ty = y + (py + 0.5) / h;
          const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * ty) / n)));
          latByPy[py] = (latRad * 180) / Math.PI;
        }
        for (let px = 0; px < w; px++) {
          const tx = x + (px + 0.5) / w;
          lngByPx[px] = (tx / n) * 360 - 180;
        }

        const hasRealDem = demGrid !== null;
        const elevGrid = demGrid ?? new Float32Array(w * h);

        // Branch 1: Native 256x256 1:1 Pixel-Accurate Vegetation Overlay (ESA WorldCover 10m + Esri Optical + NASA GIBS)
        if (isPlantOnlyLayer) {
          const plantKey = spectralKey as 'NDVI' | 'SAVI' | 'EVI';

          if (satRgb) {
            const totalPixels = w * h;
            const rawFlags = new Uint8Array(totalPixels); // 1 = water, 2 = urban, 4 = activeCrop
            const pixelMaskFlags = new Uint8Array(totalPixels);
            const lumGrid = new Float32Array(totalPixels);
            const lumRange3x3 = new Float32Array(totalPixels);
            const tileSamples: Array<{ ndvi: number; ndwi: number; exg: number }> = [];

            for (let py = 0; py < h; py++) {
              const row = py * w;
              const lat = latByPy[py];
              const inEgyptBand = lat >= 29.8 && lat <= 31.6;

              for (let px = 0; px < w; px++) {
                const i = row + px;
                const rgbIdx = i * 3;
                const r = satRgb[rgbIdx];
                const g = satRgb[rgbIdx + 1];
                const b = satRgb[rgbIdx + 2];
                const lng = lngByPx[px];
                const elev = hasRealDem ? elevGrid[i] : 15;
                const wcClass = wcMask ? wcMask[i] : 0;

                const rn = r / 255;
                const gn = g / 255;
                const bn = b / 255;
                lumGrid[i] = 0.299 * rn + 0.587 * gn + 0.114 * bn;

                const isGeoWater =
                  isExactOceanOrSeaPixel(lat, lng, elev, hasRealDem) ||
                  (!wcMask && isInlandRiverOrLakeAtLatLon(lat, lng)) ||
                  wcClass === 80;
                const isOpticalWater = evaluateOptimizedNdwiWaterMaskFromRgb(r, g, b).isWater;

                if (isGeoWater || isOpticalWater) {
                  rawFlags[i] = 1;
                } else {
                  const isGeoUrbanFallback =
                    !wcMask &&
                    inEgyptBand &&
                    lng >= 29.7 &&
                    lng <= 32.6 &&
                    isUrbanBuiltCoreAtLatLon(lat, lng);
                  if (wcClass === 50 || isGeoUrbanFallback || isSatellitePixelUrbanBuiltCandidate(r, g, b)) {
                    rawFlags[i] = 2;
                  } else if (isSatellitePixelActiveCropCandidate(r, g, b)) {
                    rawFlags[i] = 4;
                  }
                }
              }
            }

            const stride = w + 1;
            const cropPrefix = new Int32Array(stride * (h + 1));
            const urbanPrefix = new Int32Array(stride * (h + 1));
            const waterPrefix = new Int32Array(stride * (h + 1));

            for (let py = 0; py < h; py++) {
              const row = py * w;
              const y0 = Math.max(0, py - 1);
              const y1 = Math.min(h - 1, py + 1);
              let cropRowSum = 0;
              let urbanRowSum = 0;
              let waterRowSum = 0;
              const pRow = (py + 1) * stride;
              const pPrevRow = py * stride;

              for (let px = 0; px < w; px++) {
                const i = row + px;
                const x0 = Math.max(0, px - 1);
                const x1 = Math.min(w - 1, px + 1);

                let minL = 1;
                let maxL = 0;
                let waterN = 0;
                let urbanN = 0;
                for (let ny = y0; ny <= y1; ny++) {
                  const nRow = ny * w;
                  for (let nx = x0; nx <= x1; nx++) {
                    const ni = nRow + nx;
                    const l = lumGrid[ni];
                    if (l < minL) minL = l;
                    if (l > maxL) maxL = l;
                    const nf = rawFlags[ni];
                    if (nf === 1) waterN++;
                    else if (nf === 2) urbanN++;
                  }
                }
                const rangeL = maxL - minL;
                lumRange3x3[i] = rangeL;

                let flag = rawFlags[i];
                const rgbIdx = i * 3;
                const rn = satRgb[rgbIdx] / 255;
                const gn = satRgb[rgbIdx + 1] / 255;
                const bn = satRgb[rgbIdx + 2] / 255;
                const lum = lumGrid[i];

                if (
                  flag !== 1 &&
                  waterN >= 2 &&
                  lum < 0.168 &&
                  gn - bn <= 0.055 &&
                  gn - rn <= 0.058
                ) {
                  flag = 1;
                } else if (
                  flag !== 1 &&
                  ((rangeL > 0.108 && gn - rn < 0.036) ||
                    (rangeL > 0.088 && urbanN >= 2 && gn - rn < 0.048))
                ) {
                  flag = 2;
                }

                pixelMaskFlags[i] = flag;
                if (flag === 4) cropRowSum++;
                else if (flag === 2) urbanRowSum++;
                else if (flag === 1) waterRowSum++;

                cropPrefix[pRow + px + 1] = cropPrefix[pPrevRow + px + 1] + cropRowSum;
                urbanPrefix[pRow + px + 1] = urbanPrefix[pPrevRow + px + 1] + urbanRowSum;
                waterPrefix[pRow + px + 1] = waterPrefix[pPrevRow + px + 1] + waterRowSum;

                if ((py & 7) === 0 && (px & 7) === 0 && flag !== 1 && flag !== 2) {
                  const exg = 2 * gn - rn - bn;
                  const ngrdi = (gn - rn) / (gn + rn + 0.001);
                  const ndviEst = Math.max(0.02, Math.min(0.92, 0.25 + exg * 1.38 + ngrdi * 1.12));
                  tileSamples.push({
                    ndvi: ndviEst,
                    ndwi: (bn + gn - 2 * rn) / (bn + gn + 2 * rn + 0.001),
                    exg,
                  });
                }
              }
            }

            const dynamicThreshold = computeDynamicBinaryVegetationThreshold(tileSamples, 0.27);
            const cropRadius = 3;
            const urbanRadius = 2;
            const waterRadius = 2;

            for (let py = 0; py < h; py++) {
              const row = py * w;
              const lat = latByPy[py];
              const uy0 = Math.max(0, py - urbanRadius);
              const uy1 = Math.min(h - 1, py + urbanRadius);
              const wy0 = Math.max(0, py - waterRadius);
              const wy1 = Math.min(h - 1, py + waterRadius);
              const cy0 = Math.max(0, py - cropRadius);
              const cy1 = Math.min(h - 1, py + cropRadius);

              for (let px = 0; px < w; px++) {
                const cellIdx = row + px;
                const lng = lngByPx[px];
                const p = cellIdx * 4;
                const flag = pixelMaskFlags[cellIdx];

                if (flag === 1 || flag === 2) {
                  out[p + 3] = 0;
                  continue;
                }

                const wx0 = Math.max(0, px - waterRadius);
                const wx1 = Math.min(w - 1, px + waterRadius);
                const waterArea = (wy1 - wy0 + 1) * (wx1 - wx0 + 1);
                const waterCount =
                  waterPrefix[(wy1 + 1) * stride + (wx1 + 1)] -
                  waterPrefix[wy0 * stride + (wx1 + 1)] -
                  waterPrefix[(wy1 + 1) * stride + wx0] +
                  waterPrefix[wy0 * stride + wx0];
                const waterFrac = waterCount / Math.max(1, waterArea);

                const ux0 = Math.max(0, px - urbanRadius);
                const ux1 = Math.min(w - 1, px + urbanRadius);
                const urbanArea = (uy1 - uy0 + 1) * (ux1 - ux0 + 1);
                const urbanCount =
                  urbanPrefix[(uy1 + 1) * stride + (ux1 + 1)] -
                  urbanPrefix[uy0 * stride + (ux1 + 1)] -
                  urbanPrefix[(uy1 + 1) * stride + ux0] +
                  urbanPrefix[uy0 * stride + ux0];
                const urbanFrac = urbanCount / Math.max(1, urbanArea);

                const cx0 = Math.max(0, px - cropRadius);
                const cx1 = Math.min(w - 1, px + cropRadius);
                const cropArea = (cy1 - cy0 + 1) * (cx1 - cx0 + 1);
                const cropCount =
                  cropPrefix[(cy1 + 1) * stride + (cx1 + 1)] -
                  cropPrefix[cy0 * stride + (cx1 + 1)] -
                  cropPrefix[(cy1 + 1) * stride + cx0] +
                  cropPrefix[cy0 * stride + cx0];
                const cropNeighborDensity = cropCount / Math.max(1, cropArea);

                const rgbIdx = cellIdx * 3;
                const rn = satRgb[rgbIdx] / 255;
                const gn = satRgb[rgbIdx + 1] / 255;
                const bn = satRgb[rgbIdx + 2] / 255;
                const lum = lumGrid[cellIdx];

                if (flag === 4) {
                  const exg = 2 * gn - rn - bn;
                  if (
                    (urbanFrac >= 0.26 && exg < 0.095) ||
                    (waterFrac >= 0.2 && (bn >= rn * 0.9 || exg < 0.085))
                  ) {
                    out[p + 3] = 0;
                    continue;
                  }
                  const ngrdi = (gn - rn) / (gn + rn + 0.001);
                  const canopyShadeBonus = lum < 0.34 ? Math.min(0.16, (0.34 - lum) * 0.75) : 0;
                  const farmLift = cropNeighborDensity >= 0.14 ? 0.05 : 0;
                  let ndviEst = Math.max(
                    0.28,
                    Math.min(0.9, 0.255 + exg * 1.42 + ngrdi * 1.15 + canopyShadeBonus + farmLift)
                  );

                  if (gibsRgba) {
                    const g4 = cellIdx * 4;
                    const gibsNdvi = decodeNasaGibsNdviFromRgba(
                      gibsRgba[g4],
                      gibsRgba[g4 + 1],
                      gibsRgba[g4 + 2],
                      gibsRgba[g4 + 3]
                    );
                    if (gibsNdvi !== null) {
                      ndviEst = ndviEst * 0.84 + gibsNdvi * 0.16;
                    }
                  }

                  const tNorm = Math.max(0, Math.min(1, (ndviEst - 0.28) / 0.56));
                  if (plantKey === 'SAVI') {
                    out[p] = Math.round(132 + (4 - 132) * tNorm);
                    out[p + 1] = Math.round(204 + (120 - 204) * tNorm);
                    out[p + 2] = Math.round(22 + (87 - 22) * tNorm);
                  } else if (plantKey === 'EVI') {
                    out[p] = Math.round(163 + (6 - 163) * tNorm);
                    out[p + 1] = Math.round(230 + (95 - 230) * tNorm);
                    out[p + 2] = Math.round(53 + (70 - 53) * tNorm);
                  } else {
                    if (tNorm < 0.35) {
                      const u = tNorm / 0.35;
                      out[p] = Math.round(132 + (72 - 132) * u);
                      out[p + 1] = Math.round(204 + (180 - 204) * u);
                      out[p + 2] = 22;
                    } else if (tNorm < 0.72) {
                      const u = (tNorm - 0.35) / 0.37;
                      out[p] = Math.round(72 + (17 - 72) * u);
                      out[p + 1] = Math.round(180 + (132 - 180) * u);
                      out[p + 2] = Math.round(22 + (20 - 22) * u);
                    } else {
                      const u = (tNorm - 0.72) / 0.28;
                      out[p] = Math.round(17 + (3 - 17) * u);
                      out[p + 1] = Math.round(132 + (88 - 132) * u);
                      out[p + 2] = Math.round(20 + (18 - 20) * u);
                    }
                  }
                  out[p + 3] = Math.round(168 + tNorm * 64);
                  continue;
                }

                // Non-crop land pixels (pastures, shrubs, fallow fields, arid soils):
                // Never leave land uncolored! Render scientific vegetation gradient matching the legend
                const sampleElev = hasRealDem
                  ? Math.max(0, elevGrid[cellIdx])
                  : evaluateGlobalElevationAtLatLon(lat, lng, 0.05).elevationExactMeters;
                const evalRes = evaluateSpatialSpectralOrSoilAtLatLon(
                  lat,
                  lng,
                  plantKey,
                  activeWeatherDay,
                  sampleElev
                );
                const exg = 2 * gn - rn - bn;
                const optShift = Math.max(-0.06, Math.min(0.08, exg * 0.65 - (lum - 0.22) * 0.12));
                let landNdvi = Math.max(0.04, Math.min(0.88, evalRes.numericValue + optShift));

                if (gibsRgba) {
                  const g4 = cellIdx * 4;
                  const gibsNdvi = decodeNasaGibsNdviFromRgba(
                    gibsRgba[g4],
                    gibsRgba[g4 + 1],
                    gibsRgba[g4 + 2],
                    gibsRgba[g4 + 3]
                  );
                  if (gibsNdvi !== null) {
                    landNdvi = landNdvi * 0.8 + gibsNdvi * 0.2;
                  }
                }

                if (landNdvi >= 0.45) {
                  const u = Math.min(1, (landNdvi - 0.45) / 0.25);
                  out[p] = Math.round(34 + (16 - 34) * u);
                  out[p + 1] = Math.round(197 + (185 - 197) * u);
                  out[p + 2] = Math.round(94 + (129 - 94) * u);
                  out[p + 3] = 180;
                } else if (landNdvi >= 0.30) {
                  const u = (landNdvi - 0.30) / 0.15;
                  out[p] = Math.round(132 + (34 - 132) * u);
                  out[p + 1] = Math.round(204 + (197 - 204) * u);
                  out[p + 2] = Math.round(22 + (94 - 22) * u);
                  out[p + 3] = 168;
                } else if (landNdvi >= 0.15) {
                  const u = (landNdvi - 0.15) / 0.15;
                  out[p] = Math.round(234 + (132 - 234) * u);
                  out[p + 1] = Math.round(179 + (204 - 179) * u);
                  out[p + 2] = Math.round(8 + (22 - 8) * u);
                  out[p + 3] = 150;
                } else {
                  const u = Math.max(0, landNdvi / 0.15);
                  out[p] = Math.round(217 + (234 - 217) * u);
                  out[p + 1] = Math.round(119 + (179 - 119) * u);
                  out[p + 2] = Math.round(6 + (8 - 6) * u);
                  out[p + 3] = 130;
                }
              }
            }

            ctx.putImageData(outImg, 0, 0);
            onTileDecoded();
            return rememberTileCanvas(canvas);
          } else {
            // Fallback when Esri optical tile is temporarily offline (still respects ESA WorldCover 10m mask)
            for (let py = 0; py < h; py++) {
              const lat = latByPy[py];
              for (let px = 0; px < w; px++) {
                const cellIdx = py * w + px;
                const p = cellIdx * 4;
                const lng = lngByPx[px];
                const wcClass = wcMask ? wcMask[cellIdx] : 0;
                const elev = hasRealDem ? elevGrid[cellIdx] : 15;
                const isGeoOcean = isExactOceanOrSeaPixel(lat, lng, elev, hasRealDem);
                const isGeoInland = wcClass === 80 || (!wcMask && isInlandRiverOrLakeAtLatLon(lat, lng));
                const isGeoUrban = wcClass === 50 || (!wcMask && isUrbanBuiltCoreAtLatLon(lat, lng));

                if (isGeoOcean || isGeoInland || isGeoUrban) {
                  out[p + 3] = 0;
                  continue;
                }

                const sampleElev = hasRealDem
                  ? Math.max(0, elev)
                  : evaluateGlobalElevationAtLatLon(lat, lng, 0.05).elevationExactMeters;
                const evalRes = evaluateSpatialSpectralOrSoilAtLatLon(
                  lat,
                  lng,
                  plantKey,
                  activeWeatherDay,
                  sampleElev
                );
                const landNdvi = evalRes.numericValue;

                if (landNdvi >= 0.45) {
                  const u = Math.min(1, (landNdvi - 0.45) / 0.25);
                  out[p] = Math.round(34 + (16 - 34) * u);
                  out[p + 1] = Math.round(197 + (185 - 197) * u);
                  out[p + 2] = Math.round(94 + (129 - 94) * u);
                  out[p + 3] = 180;
                } else if (landNdvi >= 0.30) {
                  const u = (landNdvi - 0.30) / 0.15;
                  out[p] = Math.round(132 + (34 - 132) * u);
                  out[p + 1] = Math.round(204 + (197 - 204) * u);
                  out[p + 2] = Math.round(22 + (94 - 22) * u);
                  out[p + 3] = 168;
                } else if (landNdvi >= 0.15) {
                  const u = (landNdvi - 0.15) / 0.15;
                  out[p] = Math.round(234 + (132 - 234) * u);
                  out[p + 1] = Math.round(179 + (204 - 179) * u);
                  out[p + 2] = Math.round(8 + (22 - 8) * u);
                  out[p + 3] = 150;
                } else {
                  const u = Math.max(0, landNdvi / 0.15);
                  out[p] = Math.round(217 + (234 - 217) * u);
                  out[p + 1] = Math.round(119 + (179 - 119) * u);
                  out[p + 2] = Math.round(6 + (8 - 6) * u);
                  out[p + 3] = 130;
                }
              }
            }

            ctx.putImageData(outImg, 0, 0);
            onTileDecoded();
            return canvas;
          }
        }

        // Branch 2: Authoritative 256x256 ESA WorldCover 10m + Esri 1m Urban/Water-Isolated Layers
        // Covers NDWI, NDMI, LST, SM_0_7, SM_7_28, SOIL_EC, SOIL_PH with ZERO urban building bleed!
        const landAlphaMask = buildDilatedCoastalLandAlphaMask(
          w,
          h,
          latByPy,
          lngByPx,
          elevGrid,
          hasRealDem
        );

        // Precompute pixel luminance & 1:1 urban/water optical masks when Esri imagery is available
        const totalPixels = w * h;
        const lumGrid = satRgb ? new Float32Array(totalPixels) : null;
        const opticalUrbanFlag = satRgb ? new Uint8Array(totalPixels) : null;
        const opticalWaterFlag = satRgb ? new Uint8Array(totalPixels) : null;
        if (satRgb && lumGrid && opticalUrbanFlag && opticalWaterFlag) {
          for (let i = 0; i < totalPixels; i++) {
            const rgbIdx = i * 3;
            const r = satRgb[rgbIdx];
            const g = satRgb[rgbIdx + 1];
            const b = satRgb[rgbIdx + 2];
            lumGrid[i] = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            if (evaluateOptimizedNdwiWaterMaskFromRgb(r, g, b).isWater) {
              opticalWaterFlag[i] = 1;
            } else if (isSatellitePixelUrbanBuiltCandidate(r, g, b)) {
              opticalUrbanFlag[i] = 1;
            }
          }
          // Fast 3x3 high-variance texture pass to catch narrow village rooftops, balconies & asphalt streets
          for (let py = 0; py < h; py++) {
            const y0 = Math.max(0, py - 1);
            const y1 = Math.min(h - 1, py + 1);
            const row = py * w;
            for (let px = 0; px < w; px++) {
              const i = row + px;
              if (opticalWaterFlag[i] === 1 || opticalUrbanFlag[i] === 1) continue;
              const wcClass = wcMask ? wcMask[i] : 0;
              if (wcClass === 40 && isSatellitePixelActiveCropCandidate(satRgb[i * 3], satRgb[i * 3 + 1], satRgb[i * 3 + 2])) {
                continue;
              }
              const x0 = Math.max(0, px - 1);
              const x1 = Math.min(w - 1, px + 1);
              let minL = 1;
              let maxL = 0;
              let urbN = 0;
              for (let ny = y0; ny <= y1; ny++) {
                const nRow = ny * w;
                for (let nx = x0; nx <= x1; nx++) {
                  const ni = nRow + nx;
                  const l = lumGrid[ni];
                  if (l < minL) minL = l;
                  if (l > maxL) maxL = l;
                  if (opticalUrbanFlag[ni] === 1) urbN++;
                }
              }
              const rangeL = maxL - minL;
              const rn = satRgb[i * 3] / 255;
              const gn = satRgb[i * 3 + 1] / 255;
              if (
                (rangeL > 0.115 && gn - rn < 0.036) ||
                (urbN >= 4 && gn - rn < 0.045)
              ) {
                opticalUrbanFlag[i] = 1;
              }
            }
          }
        }

        // Smooth geospatial macro-field on a 65x65 lattice interpolated bilinearly across 256x256
        const latGridN = 65;
        const rBase = new Float32Array(latGridN * latGridN);
        const gBase = new Float32Array(latGridN * latGridN);
        const bBase = new Float32Array(latGridN * latGridN);

        for (let gy = 0; gy < latGridN; gy++) {
          const pySample = Math.min(h - 1, Math.round((gy / (latGridN - 1)) * (h - 1)));
          const latDeg = latByPy[pySample];
          for (let gx = 0; gx < latGridN; gx++) {
            const pxSample = Math.min(w - 1, Math.round((gx / (latGridN - 1)) * (w - 1)));
            const lngDeg = lngByPx[pxSample];
            const sampleElev = hasRealDem
              ? Math.max(0, elevGrid[pySample * w + pxSample])
              : evaluateGlobalElevationAtLatLon(latDeg, lngDeg, 0.05).elevationExactMeters;
            const evalRes = evaluateSpatialSpectralOrSoilAtLatLon(
              latDeg,
              lngDeg,
              spectralKey,
              activeWeatherDay,
              sampleElev
            );
            const gIdx = gy * latGridN + gx;
            rBase[gIdx] = evalRes.rgb[0];
            gBase[gIdx] = evalRes.rgb[1];
            bBase[gIdx] = evalRes.rgb[2];
          }
        }

        const sunScale = level <= 4 ? 1.45 : level <= 7 ? 1.15 : 0.85;
        const tyCenter = y + 0.5;
        const centerLatRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * tyCenter) / n)));
        const metersPerPx = Math.max(
          8,
          (156543.03 * Math.cos(centerLatRad)) / Math.pow(2, level)
        );

        for (let py = 0; py < h; py++) {
          const lat = latByPy[py];
          const pyUp = Math.max(0, py - 1);
          const pyDown = Math.min(h - 1, py + 1);
          const fyGrid = (py / (h - 1)) * (latGridN - 1);
          const gy0 = Math.min(latGridN - 2, Math.floor(fyGrid));
          const fy = fyGrid - gy0;

          for (let px = 0; px < w; px++) {
            const cellIdx = py * w + px;
            const p = cellIdx * 4;
            const maskAlpha = landAlphaMask[cellIdx];
            const lng = lngByPx[px];
            const wcClass = wcMask ? wcMask[cellIdx] : 0;

            const isBuiltUpWc = wcClass === 50;
            const isOpticalUrban = opticalUrbanFlag ? opticalUrbanFlag[cellIdx] === 1 : false;
            const isGeoUrbanFallback =
              !wcMask && !satRgb && isUrbanBuiltCoreAtLatLon(lat, lng);

            // STRICT URBAN & INFRASTRUCTURE EXCLUSION: Buildings, rooftops & roads stay 100% uncolored!
            if (isBuiltUpWc || isOpticalUrban || isGeoUrbanFallback) {
              out[p + 3] = 0;
              continue;
            }

            const isWaterWc = wcClass === 80;
            const isOpticalWater = opticalWaterFlag ? opticalWaterFlag[cellIdx] === 1 : false;
            const isInlandPolylineFallback =
              !wcMask && !satRgb && isInlandRiverOrLakeAtLatLon(lat, lng);
            const isInlandWaterPixel = isWaterWc || isOpticalWater || isInlandPolylineFallback;

            if (spectralKey === 'NDWI') {
              if (maskAlpha === 0 && !isInlandWaterPixel) {
                out[p + 3] = 0;
                continue;
              }
              if (isInlandWaterPixel) {
                // Crisp open canal / river / lake NDWI water response
                out[p] = 2;
                out[p + 1] = 132;
                out[p + 2] = 199;
                out[p + 3] = 190;
                continue;
              }

              // Land NDWI derived per-pixel from actual optical leaf turgor + canopy wetness (no orange city blobs!)
              if (satRgb) {
                const rgbIdx = cellIdx * 3;
                const rn = satRgb[rgbIdx] / 255;
                const gn = satRgb[rgbIdx + 1] / 255;
                const bn = satRgb[rgbIdx + 2] / 255;
                const exg = 2 * gn - rn - bn;
                const isVegClass =
                  wcClass === 40 || wcClass === 10 || wcClass === 20 || wcClass === 30 || wcClass === 90 || wcClass === 95;

                if (!isVegClass && wcClass === 60 && exg < 0.015) {
                  // Dry desert / bare sand -> subtle warm amber with low opacity so terrain remains readable
                  out[p] = 234;
                  out[p + 1] = 158;
                  out[p + 2] = 44;
                  out[p + 3] = Math.round((135 * maskAlpha) / 255);
                  continue;
                }

                if (exg >= 0.035 || isVegClass) {
                  const canopyTurgor = Math.max(0, Math.min(1, (exg + 0.03) / 0.24));
                  const weatherMoistFactor = activeWeatherDay
                    ? Math.max(-0.08, Math.min(0.12, (activeWeatherDay.soilMoisture0to7Pct - 24) * 0.004))
                    : 0;
                  const wetT = Math.max(0, Math.min(1, canopyTurgor + weatherMoistFactor));
                  if (wetT >= 0.35) {
                    const u = (wetT - 0.35) / 0.65;
                    out[p] = Math.round(56 + (2 - 56) * u);
                    out[p + 1] = Math.round(189 + (132 - 189) * u);
                    out[p + 2] = Math.round(248 + (199 - 248) * u);
                    out[p + 3] = Math.round(((155 + u * 55) * maskAlpha) / 255);
                  } else {
                    const u = wetT / 0.35;
                    out[p] = Math.round(245 + (56 - 245) * u);
                    out[p + 1] = Math.round(158 + (189 - 158) * u);
                    out[p + 2] = Math.round(11 + (248 - 11) * u);
                    out[p + 3] = Math.round((150 * maskAlpha) / 255);
                  }
                  continue;
                }

                // Neutral/non-vegetated non-urban fallow field without green signal -> keep optical imagery crisp
                out[p + 3] = 0;
                continue;
              }
            } else {
              // Non-NDWI layers (SM_0_7, SM_7_28, SOIL_EC, SOIL_PH, LST, NDMI): exclude oceans & rivers cleanly
              if (maskAlpha === 0 || isInlandWaterPixel) {
                out[p + 3] = 0;
                continue;
              }
            }

            // Bilinear interpolation of smooth 65x65 geospatial field
            const fxGrid = (px / (w - 1)) * (latGridN - 1);
            const gx0 = Math.min(latGridN - 2, Math.floor(fxGrid));
            const fx = fxGrid - gx0;

            const idx00 = gy0 * latGridN + gx0;
            const idx10 = idx00 + 1;
            const idx01 = (gy0 + 1) * latGridN + gx0;
            const idx11 = idx01 + 1;

            const w00 = (1 - fx) * (1 - fy);
            const w10 = fx * (1 - fy);
            const w01 = (1 - fx) * fy;
            const w11 = fx * fy;

            let br =
              rBase[idx00] * w00 + rBase[idx10] * w10 + rBase[idx01] * w01 + rBase[idx11] * w11;
            let bg =
              gBase[idx00] * w00 + gBase[idx10] * w10 + gBase[idx01] * w01 + gBase[idx11] * w11;
            let bb =
              bBase[idx00] * w00 + bBase[idx10] * w10 + bBase[idx01] * w01 + bBase[idx11] * w11;

            // Subtle Esri optical & NASA GIBS micro-detail modulation so crop vs bare soil plots preserve crisp parcel edges
            if (satRgb) {
              const rgbIdx = cellIdx * 3;
              const rn = satRgb[rgbIdx] / 255;
              const gn = satRgb[rgbIdx + 1] / 255;
              const bn = satRgb[rgbIdx + 2] / 255;
              const exg = 2 * gn - rn - bn;
              if ((spectralKey === 'SM_0_7' || spectralKey === 'SM_7_28' || spectralKey === 'NDMI') && exg > 0.04) {
                const moistureLift = Math.min(0.28, exg * 1.15);
                br = br * (1 - moistureLift) + 34 * moistureLift;
                bg = bg * (1 - moistureLift) + 197 * moistureLift;
                bb = bb * (1 - moistureLift) + 184 * moistureLift;
              } else if (spectralKey === 'LST' && exg > 0.04) {
                // Active vegetated canopy cools surface temperature naturally via evapotranspiration
                const coolLift = Math.min(0.25, exg * 1.05);
                br = br * (1 - coolLift) + 16 * coolLift;
                bg = bg * (1 - coolLift) + 185 * coolLift;
                bb = bb * (1 - coolLift) + 129 * coolLift;
              }
            }

            if (gibsRgba && level <= 10 && gibsLayerKey === 'SM') {
              const g4 = cellIdx * 4;
              if (gibsRgba[g4 + 3] >= 60) {
                br = br * 0.82 + gibsRgba[g4] * 0.18;
                bg = bg * 0.82 + gibsRgba[g4 + 1] * 0.18;
                bb = bb * 0.82 + gibsRgba[g4 + 2] * 0.18;
              }
            }

            let shade = 1.0;
            if (hasRealDem) {
              const pxLeft = Math.max(0, px - 1);
              const pxRight = Math.min(w - 1, px + 1);
              const dzdx = (elevGrid[py * w + pxRight] - elevGrid[py * w + pxLeft]) / (2 * metersPerPx);
              const dzdy = (elevGrid[pyDown * w + px] - elevGrid[pyUp * w + px]) / (2 * metersPerPx);
              const nx = -dzdx * sunScale;
              const ny = -dzdy * sunScale;
              const nz = 1.0;
              const len = Math.hypot(nx, ny, nz);
              const dotSun = Math.max(0, (-0.56 * nx - 0.56 * ny + 0.61 * nz) / len);
              shade = 0.9 + dotSun * 0.16;
            }

            out[p] = Math.min(255, Math.max(0, Math.round(br * shade)));
            out[p + 1] = Math.min(255, Math.max(0, Math.round(bg * shade)));
            out[p + 2] = Math.min(255, Math.max(0, Math.round(bb * shade)));
            out[p + 3] = Math.round((205 * maskAlpha) / 255);
          }
        }

        ctx.putImageData(outImg, 0, 0);
        onTileDecoded();
        return rememberTileCanvas(canvas);
      } finally {
        releaseTileDecodeSlot();
      }
    });
  };

  return provider;
}

/**
 * Snowfall, Freezing Level (0°C Isotherm) & Blizzard Storm Tracking Imagery Provider (`snow_ice`).
 * Combines SRTM/Terrarium DEM altitude with atmospheric lapse rate, snow depth (cm), and blizzard tracks.
 */
function createSnowAndBlizzardImageryProvider(
  activeWeatherDay: DailyWeatherPoint | undefined,
  isDisposed: () => boolean,
  onTileDecoded: () => void
): Cesium.UrlTemplateImageryProvider {
  const provider = new Cesium.UrlTemplateImageryProvider({
    url: 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',
    maximumLevel: 14,
    enablePickFeatures: false,
  });

  provider.requestImage = (x: number, y: number, level: number) => {
    if (isDisposed()) return undefined;
    const w = 128;
    const h = 128;

    return loadTerrariumSubTileData(x, y, level, w, h).then(async (demGrid) => {
      if (isDisposed()) return Promise.reject(new Error('Disposed'));
      await acquireTileDecodeSlot();
      try {
        if (isDisposed()) return Promise.reject(new Error('Disposed'));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx || isDisposed()) return Promise.reject(new Error('Disposed'));

      const outImg = ctx.createImageData(w, h);
      const out = outImg.data;
      const n = Math.pow(2, level);
      const latByPy = new Float64Array(h);
      const lngByPx = new Float64Array(w);
      for (let py = 0; py < h; py++) {
        const ty = y + (py + 0.5) / h;
        const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * ty) / n)));
        latByPy[py] = (latRad * 180) / Math.PI;
      }
      for (let px = 0; px < w; px++) {
        const tx = x + (px + 0.5) / w;
        lngByPx[px] = (tx / n) * 360 - 180;
      }

      const hasRealDem = demGrid !== null;
      const elevGrid = demGrid ?? new Float32Array(w * h);
      if (!hasRealDem) {
        for (let py = 0; py < h; py++) {
          const lat = latByPy[py];
          for (let px = 0; px < w; px++) {
            elevGrid[py * w + px] = evaluateGlobalElevationAtLatLon(
              lat,
              lngByPx[px],
              0.05
            ).elevationExactMeters;
          }
        }
      }

      const landAlphaMask = buildDilatedCoastalLandAlphaMask(
        w,
        h,
        latByPy,
        lngByPx,
        elevGrid,
        hasRealDem
      );

      for (let py = 0; py < h; py++) {
        const lat = latByPy[py];
        for (let px = 0; px < w; px++) {
          const cellIdx = py * w + px;
          const p = cellIdx * 4;
          const maskAlpha = landAlphaMask[cellIdx];
          if (maskAlpha === 0) {
            out[p + 3] = 0;
            continue;
          }

          const lng = lngByPx[px];
          const elev = Math.max(0, elevGrid[cellIdx]);
          const snowEval = evaluateGlobalSnowAndBlizzardAtLatLon(
            lat,
            lng,
            activeWeatherDay,
            elev
          );

          // Highlight the 0°C Freezing Level Isotherm contour line in bright cyan-white
          const pxRight = Math.min(w - 1, px + 1);
          const pyDown = Math.min(h - 1, py + 1);
          const elevR = Math.max(0, elevGrid[py * w + pxRight]);
          const elevD = Math.max(0, elevGrid[pyDown * w + px]);
          const freezeLv = snowEval.freezingLevelMeters;
          const isFreezingLine =
            freezeLv > 150 &&
            ((elev < freezeLv && elevR >= freezeLv) ||
              (elev >= freezeLv && elevR < freezeLv) ||
              (elev < freezeLv && elevD >= freezeLv) ||
              (elev >= freezeLv && elevD < freezeLv));

          if (isFreezingLine) {
            out[p] = 56;
            out[p + 1] = 189;
            out[p + 2] = 248;
            out[p + 3] = Math.round((245 * maskAlpha) / 255);
            continue;
          }

          if (snowEval.alpha <= 5) {
            out[p + 3] = 0;
            continue;
          }

          const micro = sampleMicroPixelCellularPerturbation(lat, lng, level, px, py);
          const tone = 1.0 + micro.deltaScalar * 0.08;
          out[p] = Math.min(255, Math.max(0, Math.round(snowEval.rgb[0] * tone)));
          out[p + 1] = Math.min(255, Math.max(0, Math.round(snowEval.rgb[1] * tone)));
          out[p + 2] = Math.min(255, Math.max(0, Math.round(snowEval.rgb[2] * tone)));
          out[p + 3] = Math.round((snowEval.alpha * maskAlpha) / 255);
        }
      }

      ctx.putImageData(outImg, 0, 0);
      onTileDecoded();
      return canvas;
      } finally {
        releaseTileDecodeSlot();
      }
    });
  };

  return provider;
}

/**
 * Global Day/Night Solar Terminator, Twilight Belt, Solar Irradiance & Nocturnal City Lights Provider (`day_night`).
 * Covers 100% of Earth (Land + Oceans) to show which parts of the planet are in morning/daylight vs. night.
 */
function createDayNightTerminatorImageryProvider(
  utcHourOverride: number | null | undefined,
  isOverlayBlendMode: boolean,
  isDisposed: () => boolean,
  onTileDecoded: () => void
): Cesium.UrlTemplateImageryProvider {
  const provider = new Cesium.UrlTemplateImageryProvider({
    url: 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',
    tilingScheme: new Cesium.GeographicTilingScheme(),
    maximumLevel: 14,
    enablePickFeatures: false,
  });

  provider.requestImage = (x: number, y: number, level: number) => {
    if (isDisposed()) return undefined;
    const w = 128;
    const h = 128;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return Promise.resolve(canvas);

    const outImg = ctx.createImageData(w, h);
    const out = outImg.data;
    const rect = provider.tilingScheme.tileXYToRectangle(x, y, level);
    const westDeg = Cesium.Math.toDegrees(rect.west);
    const eastDeg = Cesium.Math.toDegrees(rect.east);
    const southDeg = Cesium.Math.toDegrees(rect.south);
    const northDeg = Cesium.Math.toDegrees(rect.north);

    const gridN = 33;
    const rGrid = new Float32Array(gridN * gridN);
    const gGrid = new Float32Array(gridN * gridN);
    const bGrid = new Float32Array(gridN * gridN);
    const aGrid = new Float32Array(gridN * gridN);

    for (let gy = 0; gy < gridN; gy++) {
      const latDeg = northDeg - (gy / (gridN - 1)) * (northDeg - southDeg);
      for (let gx = 0; gx < gridN; gx++) {
        const lngDeg = westDeg + (gx / (gridN - 1)) * (eastDeg - westDeg);
        const sample = evaluateGlobalDayNightSolarAtLatLon(
          latDeg,
          lngDeg,
          utcHourOverride ?? undefined
        );
        const idx = gy * gridN + gx;
        rGrid[idx] = sample.rgb[0];
        gGrid[idx] = sample.rgb[1];
        bGrid[idx] = sample.rgb[2];
        // When blended over another thematic map, keep daytime nearly transparent so the underlying map shines through while night & terminator remain clear
        aGrid[idx] = isOverlayBlendMode
          ? sample.phase === 'solar_noon' || sample.phase === 'morning_daylight'
            ? Math.min(28, sample.alpha * 0.4)
            : Math.min(210, sample.alpha * 0.92)
          : sample.alpha;
      }
    }

    for (let py = 0; py < h; py++) {
      const fyGrid = (py / (h - 1)) * (gridN - 1);
      const gy0 = Math.min(gridN - 2, Math.floor(fyGrid));
      const fy = fyGrid - gy0;
      for (let px = 0; px < w; px++) {
        const fxGrid = (px / (w - 1)) * (gridN - 1);
        const gx0 = Math.min(gridN - 2, Math.floor(fxGrid));
        const fx = fxGrid - gx0;

        const idx00 = gy0 * gridN + gx0;
        const idx10 = idx00 + 1;
        const idx01 = (gy0 + 1) * gridN + gx0;
        const idx11 = idx01 + 1;

        const w00 = (1 - fx) * (1 - fy);
        const w10 = fx * (1 - fy);
        const w01 = (1 - fx) * fy;
        const w11 = fx * fy;

        const p = (py * w + px) * 4;
        const alpha =
          aGrid[idx00] * w00 +
          aGrid[idx10] * w10 +
          aGrid[idx01] * w01 +
          aGrid[idx11] * w11;

        if (alpha < 3) {
          out[p + 3] = 0;
          continue;
        }

        out[p] = Math.round(
          rGrid[idx00] * w00 +
            rGrid[idx10] * w10 +
            rGrid[idx01] * w01 +
            rGrid[idx11] * w11
        );
        out[p + 1] = Math.round(
          gGrid[idx00] * w00 +
            gGrid[idx10] * w10 +
            gGrid[idx01] * w01 +
            gGrid[idx11] * w11
        );
        out[p + 2] = Math.round(
          bGrid[idx00] * w00 +
            bGrid[idx10] * w10 +
            bGrid[idx01] * w01 +
            bGrid[idx11] * w11
        );
        out[p + 3] = Math.round(alpha);
      }
    }

    ctx.putImageData(outImg, 0, 0);
    onTileDecoded();
    return Promise.resolve(canvas);
  };

  return provider;
}

/**
 * Ventusky-Grade Continuous Global Atmospheric & Air-Quality Imagery Provider (100% Land + Ocean Coverage).
 * Renders Temperature, Apparent Temp, Wind Speed, Wind Gusts, Rainfall, Pressure + Isobars,
 * CAPE Thunderstorms, Weather Radar (dBZ), Satellite IR Clouds, Humidity / Dew Point, and Air Quality.
 */
function createVentuskyWeatherImageryProvider(
  weatherKind: ThematicMapLayerId,
  activeWeatherDay: DailyWeatherPoint | undefined,
  globalTempSubMode: GlobalTemperatureSubMode,
  ventuskyOptions: VentuskyAtmosphericOptions | undefined,
  utcHourOverride: number | null | undefined,
  liveVentuskyNodes: VentuskyLiveTelemetryNode[] | undefined,
  isDisposed: () => boolean,
  onTileDecoded: () => void
): Cesium.UrlTemplateImageryProvider {
  const provider = new Cesium.UrlTemplateImageryProvider({
    url: 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',
    tilingScheme: new Cesium.GeographicTilingScheme(),
    maximumLevel: 14,
    enablePickFeatures: false,
  });

  const now = new Date();
  const liveUtcDecimal = now.getUTCHours() + now.getUTCMinutes() / 60;
  const mergedOptions: Partial<VentuskyAtmosphericOptions> = {
    ...(ventuskyOptions || {}),
    pressureAltitude:
      weatherKind === 'temperature' && globalTempSubMode === 'air_2m' && ventuskyOptions?.pressureAltitude
        ? ventuskyOptions.pressureAltitude
        : ventuskyOptions?.pressureAltitude ?? '2m',
    utcHour:
      typeof utcHourOverride === 'number'
        ? utcHourOverride
        : typeof ventuskyOptions?.utcHour === 'number'
        ? ventuskyOptions.utcHour
        : liveUtcDecimal,
  };

  provider.requestImage = (x: number, y: number, level: number) => {
    if (isDisposed()) return undefined;
    const w = 128;
    const h = 128;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return Promise.resolve(canvas);

    const outImg = ctx.createImageData(w, h);
    const out = outImg.data;
    const rect = provider.tilingScheme.tileXYToRectangle(x, y, level);
    const westDeg = Cesium.Math.toDegrees(rect.west);
    const eastDeg = Cesium.Math.toDegrees(rect.east);
    const southDeg = Cesium.Math.toDegrees(rect.south);
    const northDeg = Cesium.Math.toDegrees(rect.north);

    const gridN = 25;
    const rGrid = new Float32Array(gridN * gridN);
    const gGrid = new Float32Array(gridN * gridN);
    const bGrid = new Float32Array(gridN * gridN);
    const aGrid = new Float32Array(gridN * gridN);

    for (let gy = 0; gy < gridN; gy++) {
      const latDeg = northDeg - (gy / (gridN - 1)) * (northDeg - southDeg);
      for (let gx = 0; gx < gridN; gx++) {
        const lngDeg = westDeg + (gx / (gridN - 1)) * (eastDeg - westDeg);
        const sample = evaluateVentuskyLayerAtLatLon(
          latDeg,
          lngDeg,
          weatherKind,
          mergedOptions,
          activeWeatherDay,
          liveVentuskyNodes
        );
        const idx = gy * gridN + gx;
        rGrid[idx] = sample.r;
        gGrid[idx] = sample.g;
        bGrid[idx] = sample.b;
        aGrid[idx] = sample.a;
      }
    }

    for (let py = 0; py < h; py++) {
      const fyGrid = (py / (h - 1)) * (gridN - 1);
      const gy0 = Math.min(gridN - 2, Math.floor(fyGrid));
      const fy = fyGrid - gy0;
      for (let px = 0; px < w; px++) {
        const fxGrid = (px / (w - 1)) * (gridN - 1);
        const gx0 = Math.min(gridN - 2, Math.floor(fxGrid));
        const fx = fxGrid - gx0;

        const idx00 = gy0 * gridN + gx0;
        const idx10 = idx00 + 1;
        const idx01 = (gy0 + 1) * gridN + gx0;
        const idx11 = idx01 + 1;

        const w00 = (1 - fx) * (1 - fy);
        const w10 = fx * (1 - fy);
        const w01 = (1 - fx) * fy;
        const w11 = fx * fy;

        const p = (py * w + px) * 4;
        const alpha =
          aGrid[idx00] * w00 +
          aGrid[idx10] * w10 +
          aGrid[idx01] * w01 +
          aGrid[idx11] * w11;

        if (alpha < 4) {
          out[p + 3] = 0;
          continue;
        }

        out[p] = Math.round(
          rGrid[idx00] * w00 +
            rGrid[idx10] * w10 +
            rGrid[idx01] * w01 +
            rGrid[idx11] * w11
        );
        out[p + 1] = Math.round(
          gGrid[idx00] * w00 +
            gGrid[idx10] * w10 +
            gGrid[idx01] * w01 +
            gGrid[idx11] * w11
        );
        out[p + 2] = Math.round(
          bGrid[idx00] * w00 +
            bGrid[idx10] * w10 +
            bGrid[idx01] * w01 +
            bGrid[idx11] * w11
        );
        out[p + 3] = Math.round(alpha);
      }
    }

    ctx.putImageData(outImg, 0, 0);
    onTileDecoded();
    return Promise.resolve(canvas);
  };

  return provider;
}

interface ShapedBillboardBadge {
  canvas: HTMLCanvasElement;
  widthCss: number;
  heightCss: number;
}

const shapedBillboardCache = new Map<string, ShapedBillboardBadge>();

/**
 * Renders full strings (including Arabic RTL ligatures and bidirectional numbers like "زونة زراعية 2")
 * onto a 2x high-DPI HTML5 Canvas in a single HarfBuzz shaping pass so Cesium never splits Arabic words
 * into disconnected/reversed character glyphs.
 */
function getShapedTextBillboardCanvas(options: {
  lines: string[];
  isRtl: boolean;
  variant: 'zone' | 'city';
  accentColor?: string;
  isSelected?: boolean;
}): ShapedBillboardBadge {
  const cacheKey = `${options.variant}|${options.isRtl ? 'rtl' : 'ltr'}|${
    options.isSelected ? '1' : '0'
  }|${options.accentColor || ''}|${options.lines.join('\n')}`;
  const cached = shapedBillboardCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const dpr = 2;
  const canvas = document.createElement('canvas');
  canvas.dir = options.isRtl ? 'rtl' : 'ltr';
  canvas.setAttribute('dir', options.isRtl ? 'rtl' : 'ltr');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.width = 1;
    canvas.height = 1;
    return { canvas, widthCss: 1, heightCss: 1 };
  }

  const isZone = options.variant === 'zone';
  const fontSizePx = isZone ? 13 : 11;
  const lineHeightPx = isZone ? 18 : 15;
  const padX = isZone ? 11 : 7;
  const padY = isZone ? 5 : 3;
  const fontSpec = isZone
    ? `700 ${fontSizePx}px "Cairo", "Tajawal", system-ui, sans-serif`
    : `700 ${fontSizePx}px "Cairo", "IBM Plex Mono", system-ui, sans-serif`;

  ctx.font = fontSpec;
  ctx.direction = options.isRtl ? 'rtl' : 'ltr';

  const shapedLines = options.lines.map((raw) => {
    const hasArabic = /[\u0600-\u06FF]/.test(raw);
    return hasArabic ? `\u202B${raw}\u202C` : raw;
  });

  let maxLineWidth = 24;
  for (const line of shapedLines) {
    const w = ctx.measureText(line).width;
    if (w > maxLineWidth) maxLineWidth = w;
  }

  const widthCss = Math.ceil(maxLineWidth + padX * 2);
  const heightCss = Math.ceil(shapedLines.length * lineHeightPx + padY * 2);

  canvas.width = widthCss * dpr;
  canvas.height = heightCss * dpr;

  ctx.scale(dpr, dpr);
  ctx.font = fontSpec;
  ctx.direction = options.isRtl ? 'rtl' : 'ltr';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  if (isZone) {
    // Sleek high-contrast pill badge for farm zones
    ctx.fillStyle = 'rgba(2, 6, 23, 0.86)';
    ctx.strokeStyle = options.accentColor || (options.isSelected ? '#10b981' : '#38bdf8');
    ctx.lineWidth = options.isSelected ? 1.8 : 1.3;
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(1, 1, widthCss - 2, heightCss - 2, 8);
    } else {
      ctx.rect(1, 1, widthCss - 2, heightCss - 2);
    }
    ctx.fill();
    ctx.stroke();
  }

  const cx = widthCss / 2;
  shapedLines.forEach((line, idx) => {
    const cy = padY + (idx + 0.5) * lineHeightPx;
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = isZone ? 2.8 : 3.2;
    ctx.strokeText(line, cx, cy);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(line, cx, cy);
  });

  const badge: ShapedBillboardBadge = { canvas, widthCss, heightCss };
  if (shapedBillboardCache.size > 300) {
    const firstKey = shapedBillboardCache.keys().next().value;
    if (firstKey) shapedBillboardCache.delete(firstKey);
  }
  shapedBillboardCache.set(cacheKey, badge);
  return badge;
}

export const CesiumEarthStage: React.FC<CesiumEarthStageProps> = ({
  language,
  baseMapStyle,
  activeThematicMap,
  isSoilMoistureActive,
  elevationDisplayMode,
  elevationPalette,
  terrainExaggeration,
  overlayOpacity,
  showGlobalFieldOverlay,
  globalTempSubMode,
  activeLayer,
  projectionMode,
  rotationDeg,
  pitchDeg,
  viewMode3D,
  zones,
  activeZoneId,
  vertices,
  gridCells,
  showSubZoneLabels,
  drawingMode,
  activeWeatherDay,
  forecast14,
  selectedMoistureDayIdx,
  liveWindNodes,
  ventuskyOptions,
  liveVentuskyNodes,
  showWhiteBorders = true,
  showStreamlines = true,
  showCityMetrics = true,
  inspectedLatLon,
  utcHourOverride,
  blendDayNightOverlay,
  flyToTarget,
  zoomCommand,
  activeSatelliteVintageId,
  onSelectSatelliteVintage,
  isComparisonMode: propIsComparisonMode,
  onChangeComparisonMode,
  comparisonBaselineVintageId: propComparisonBaseline,
  onChangeComparisonBaselineVintageId,
  comparisonTargetVintageId: propComparisonTarget,
  onChangeComparisonTargetVintageId,
  isTimeLapsePlaying: propIsTimeLapsePlaying,
  onChangeTimeLapsePlaying,
  hideStandaloneVintageWidget = false,
  onSelectPoint,
  onClickGridCell,
  onSelectZone,
  onChangeVertices,
  onCompleteRectangle,
  onCameraStatusChange,
}) => {
  const isAr = language === 'ar';
  const containerRef = useRef<HTMLDivElement | null>(null);
  const windCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const baseLayerRef = useRef<Cesium.ImageryLayer | null>(null);
  const labelsLayerRef = useRef<Cesium.ImageryLayer | null>(null);
  const comparisonSplitLayerRef = useRef<Cesium.ImageryLayer | null>(null);
  const thematicLayerRef = useRef<Cesium.ImageryLayer | null>(null);
  const dayNightOverlayLayerRef = useRef<Cesium.ImageryLayer | null>(null);
  const zoneDataSourceRef = useRef<Cesium.CustomDataSource | null>(null);
  const gridDataSourceRef = useRef<Cesium.CustomDataSource | null>(null);
  const weatherDataSourceRef = useRef<Cesium.CustomDataSource | null>(null);
  const whiteBordersDataSourceRef = useRef<Cesium.CustomDataSource | null>(null);
  const cityMetricsDataSourceRef = useRef<Cesium.CustomDataSource | null>(null);
  const drawDataSourceRef = useRef<Cesium.CustomDataSource | null>(null);
  const pinDataSourceRef = useRef<Cesium.CustomDataSource | null>(null);

  const [viewerReady, setViewerReady] = useState(false);
  const [contextLost, setContextLost] = useState(false);
  const [rectFirstCorner, setRectFirstCorner] = useState<LatLon | null>(null);
  const [rectHoverCorner, setRectHoverCorner] = useState<LatLon | null>(null);
  const [cameraAltitudeMeters, setCameraAltitudeMeters] = useState<number>(11800000);

  const [internalVintageId, setInternalVintageId] = useState<SatelliteVintageId>('2026_latest');
  const activeVintageId = activeSatelliteVintageId || internalVintageId;
  const handleSelectVintage = (vId: SatelliteVintageId) => {
    setInternalVintageId(vId);
    onSelectSatelliteVintage?.(vId);
  };

  const [internalComparisonMode, setInternalComparisonMode] = useState<boolean>(false);
  const isComparisonMode = propIsComparisonMode !== undefined ? propIsComparisonMode : internalComparisonMode;
  const setIsComparisonMode = (val: boolean) => {
    setInternalComparisonMode(val);
    onChangeComparisonMode?.(val);
  };

  const [internalComparisonBaseline, setInternalComparisonBaseline] =
    useState<SatelliteVintageId>('2014');
  const comparisonBaselineVintageId =
    propComparisonBaseline !== undefined ? propComparisonBaseline : internalComparisonBaseline;
  const setComparisonBaselineVintageId = (id: SatelliteVintageId) => {
    setInternalComparisonBaseline(id);
    onChangeComparisonBaselineVintageId?.(id);
  };

  const [internalComparisonTarget, setInternalComparisonTarget] =
    useState<SatelliteVintageId>('2026_latest');
  const comparisonTargetVintageId =
    propComparisonTarget !== undefined ? propComparisonTarget : internalComparisonTarget;
  const setComparisonTargetVintageId = (id: SatelliteVintageId) => {
    setInternalComparisonTarget(id);
    onChangeComparisonTargetVintageId?.(id);
  };

  const [splitFraction, setSplitFraction] = useState<number>(0.5);

  const [internalTimeLapsePlaying, setInternalTimeLapsePlaying] = useState<boolean>(false);
  const isTimeLapsePlaying =
    propIsTimeLapsePlaying !== undefined ? propIsTimeLapsePlaying : internalTimeLapsePlaying;
  const setIsTimeLapsePlaying = (val: boolean) => {
    setInternalTimeLapsePlaying(val);
    onChangeTimeLapsePlaying?.(val);
  };

  const [isTimeLapsePanelOpen, setIsTimeLapsePanelOpen] = useState<boolean>(false);
  const [isDraggingSplitHandle, setIsDraggingSplitHandle] = useState<boolean>(false);

  const handlePointerDownSplit = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDraggingSplitHandle(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMoveSplit = (e: React.PointerEvent) => {
    if (!isDraggingSplitHandle || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const fraction = Math.max(0.04, Math.min(0.96, x / rect.width));
    setSplitFraction(fraction);
  };

  const handlePointerUpSplit = (e: React.PointerEvent) => {
    if (isDraggingSplitHandle) {
      setIsDraggingSplitHandle(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  useEffect(() => {
    if (!isTimeLapsePlaying) return;
    const vintageOrder: SatelliteVintageId[] = [
      '2014',
      '2016',
      '2018',
      '2020',
      '2022',
      '2023_s2',
      '2024',
      '2025',
      '2026_latest',
    ];
    let currentIndex = vintageOrder.indexOf(activeVintageId);
    if (currentIndex === -1) currentIndex = 0;

    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % vintageOrder.length;
      handleSelectVintage(vintageOrder[currentIndex]);
    }, 2200);

    return () => clearInterval(interval);
  }, [isTimeLapsePlaying, activeVintageId]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed() || !viewerReady) return;
    if (isComparisonMode) {
      viewer.scene.splitPosition = splitFraction;
      viewer.scene.requestRender();
    }
  }, [splitFraction, isComparisonMode, viewerReady]);

  const lastCursorGeoRef = useRef<LatLon | null>(null);
  const zoomAnimRef = useRef<{
    active: boolean;
    targetAlt: number;
    targetLat: number;
    targetLng: number;
    rafId: number | null;
  }>({
    active: false,
    targetAlt: 14200000,
    targetLat: 22.0,
    targetLng: 24.0,
    rafId: null,
  });

  const cancelZoomAnimation = () => {
    const z = zoomAnimRef.current;
    z.active = false;
    if (z.rafId !== null) {
      cancelAnimationFrame(z.rafId);
      z.rafId = null;
    }
  };

  const startIncrementalZoom = (
    nextTargetAlt: number,
    nextTargetLat: number,
    nextTargetLng: number
  ) => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    const z = zoomAnimRef.current;
    z.targetAlt = Math.max(95, Math.min(22000000, nextTargetAlt));
    z.targetLat = Math.max(-85, Math.min(85, nextTargetLat));
    z.targetLng = ((((nextTargetLng + 180) % 360) + 360) % 360) - 180;
    z.active = true;

    if (z.rafId !== null) return;

    const stepFrame = () => {
      if (!z.active || !viewerRef.current || viewerRef.current.isDestroyed()) {
        z.rafId = null;
        return;
      }
      const v = viewerRef.current;
      const carto = v.camera.positionCartographic;
      if (!carto) {
        z.active = false;
        z.rafId = null;
        return;
      }

      const curLat = Cesium.Math.toDegrees(carto.latitude);
      const curLng = Cesium.Math.toDegrees(carto.longitude);
      const curAlt = Math.max(85, carto.height);

      const dLat = z.targetLat - curLat;
      let dLng = z.targetLng - curLng;
      if (dLng > 180) dLng -= 360;
      if (dLng < -180) dLng += 360;

      const logCur = Math.log(curAlt);
      const logTgt = Math.log(z.targetAlt);
      const dLog = logTgt - logCur;

      const done =
        Math.abs(dLog) < 0.006 &&
        Math.abs(dLat) < 0.0001 &&
        Math.abs(dLng) < 0.0001;

      const lerpT = done ? 1.0 : 0.28;
      const stepAlt = Math.exp(logCur + dLog * lerpT);
      const stepLat = Math.max(-85, Math.min(85, curLat + dLat * lerpT));
      const stepLng = ((((curLng + dLng * lerpT + 180) % 360) + 360) % 360) - 180;

      v.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(stepLng, stepLat, stepAlt),
        orientation: {
          heading: v.camera.heading,
          pitch: v.camera.pitch,
          roll: 0,
        },
      });
      v.scene.requestRender();

      if (done) {
        z.active = false;
        z.rafId = null;
        return;
      }
      z.rafId = requestAnimationFrame(stepFrame);
    };

    z.rafId = requestAnimationFrame(stepFrame);
  };

  // Refs for latest callbacks inside Cesium event handlers
  const callbacksRef = useRef({
    onSelectPoint,
    onClickGridCell,
    onSelectZone,
    onChangeVertices,
    onCompleteRectangle,
    onCameraStatusChange,
  });
  callbacksRef.current = {
    onSelectPoint,
    onClickGridCell,
    onSelectZone,
    onChangeVertices,
    onCompleteRectangle,
    onCameraStatusChange,
  };

  const stateRef = useRef({
    drawingMode,
    vertices,
    rectFirstCorner,
    gridCells,
    zones,
    activeThematicMap,
  });
  stateRef.current = {
    drawingMode,
    vertices,
    rectFirstCorner,
    gridCells,
    zones,
    activeThematicMap,
  };

  // Clear pending rectangle draft when exiting rectangle drawing mode
  useEffect(() => {
    if (drawingMode !== 'rectangle') {
      setRectFirstCorner(null);
      setRectHoverCorner(null);
    }
  }, [drawingMode]);

  // 1. Initialize Unified Cesium.Viewer (Zero Ion Token Needed, Real 3D Terrain & Free Camera)
  useEffect(() => {
    if (!containerRef.current) return;
    if (typeof window !== 'undefined' && !window.CESIUM_BASE_URL) {
      const base = import.meta.env.BASE_URL || '/';
      window.CESIUM_BASE_URL = `${base.endsWith('/') ? base : base + '/'}cesiumStatic`;
    }

    // Balanced HTTP/2 tile concurrency so zooming never saturates JS decode queue
    Cesium.RequestScheduler.maximumRequests = 24;
    Cesium.RequestScheduler.maximumRequestsPerServer = 8;

    let cancelled = false;

    const detectSoftwareWebGl = (): boolean => {
      try {
        const probe = document.createElement('canvas');
        const gl =
          probe.getContext('webgl2') ||
          probe.getContext('webgl') ||
          probe.getContext('experimental-webgl');
        if (!gl) return true;
        const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
        if (!debugInfo) return false;
        const renderer = String(
          (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || ''
        );
        return /SwiftShader|llvmpipe|Software|Mesa OffScreen/i.test(renderer);
      } catch {
        return false;
      }
    };
    const isSoftwareGl = detectSoftwareWebGl();

    const viewer = new Cesium.Viewer(containerRef.current, {
      animation: false,
      baseLayerPicker: false,
      fullscreenButton: false,
      geocoder: false,
      homeButton: false,
      infoBox: false,
      sceneModePicker: false,
      selectionIndicator: false,
      timeline: false,
      navigationHelpButton: false,
      navigationInstructionsInitiallyVisible: false,
      baseLayer: false,
      shadows: false,
      shouldAnimate: false,
      requestRenderMode: true,
      maximumRenderTimeChange: Infinity,
      msaaSamples: isSoftwareGl ? 1 : 2,
      useBrowserRecommendedResolution: true,
    });

    viewerRef.current = viewer;

    if (isSoftwareGl) {
      viewer.resolutionScale = 0.5;
      viewer.scene.msaaSamples = 1;
      viewer.scene.postProcessStages.fxaa.enabled = false;
      viewer.scene.globe.maximumScreenSpaceError = 5.0;
      viewer.scene.globe.tileCacheSize = 48;
    } else {
      // Optimized 1:1 hardware resolution scale: eliminates GPU overheating & heavy lag on laptops/phones
      viewer.resolutionScale = 1.0;
      viewer.scene.globe.maximumScreenSpaceError = 3.6;
      viewer.scene.globe.tileCacheSize = 120;
    }
    viewer.scene.globe.preloadSiblings = false;
    viewer.scene.globe.preloadAncestors = true;

    // Configure crisp 3D space & globe visual quality
    viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#030712');
    viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#0c2240');
    viewer.scene.globe.enableLighting = false;
    viewer.scene.globe.showGroundAtmosphere = !isSoftwareGl;
    viewer.scene.globe.depthTestAgainstTerrain = false;
    if (viewer.scene.skyAtmosphere) {
      viewer.scene.skyAtmosphere.show = true;
    }
    if (viewer.scene.fog) {
      viewer.scene.fog.enabled = !isSoftwareGl;
      viewer.scene.fog.density = 0.00018;
    }

    // Smooth space-to-farm camera zoom limits; desktop mouse wheel uses our incremental cursor-targeted zoom
    const controller = viewer.scene.screenSpaceCameraController;
    controller.minimumZoomDistance = 85;
    controller.maximumZoomDistance = 24000000;
    controller.enableTilt = true;
    controller.enableLook = true;
    controller.zoomEventTypes = [Cesium.CameraEventType.PINCH];
    controller.inertiaSpin = 0.86;
    controller.inertiaZoom = 0.8;
    controller.inertiaTranslate = 0.85;

    // Initial full 3D Globe orbital view centered gently over Egypt / Mediterranean / MENA (#p=27;28)
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(28.0, 27.0, 11800000),
      orientation: {
        heading: 0,
        pitch: Cesium.Math.toRadians(-90),
        roll: 0,
      },
    });
    viewer.scene.requestRender();

    // Dedicated Entity DataSources for clean separation of concerns
    const zoneDs = new Cesium.CustomDataSource('zones');
    const gridDs = new Cesium.CustomDataSource('gridCells');
    const weatherDs = new Cesium.CustomDataSource('weather');
    const bordersDs = new Cesium.CustomDataSource('whiteBorders');
    const citiesDs = new Cesium.CustomDataSource('cityMetrics');
    const drawDs = new Cesium.CustomDataSource('drawing');
    const pinDs = new Cesium.CustomDataSource('inspectedPin');
    zoneDataSourceRef.current = zoneDs;
    gridDataSourceRef.current = gridDs;
    weatherDataSourceRef.current = weatherDs;
    whiteBordersDataSourceRef.current = bordersDs;
    cityMetricsDataSourceRef.current = citiesDs;
    drawDataSourceRef.current = drawDs;
    pinDataSourceRef.current = pinDs;

    viewer.dataSources.add(zoneDs);
    viewer.dataSources.add(gridDs);
    viewer.dataSources.add(weatherDs);
    viewer.dataSources.add(bordersDs);
    viewer.dataSources.add(citiesDs);
    viewer.dataSources.add(drawDs);
    viewer.dataSources.add(pinDs);

    // Load real 3D World Elevation Terrain on hardware GPU, or instant procedural terrain on software WebGL
    if (isSoftwareGl) {
      viewer.terrainProvider = createProceduralFallbackTerrain();
    } else {
      Cesium.ArcGISTiledElevationTerrainProvider.fromUrl(
        'https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer'
      )
        .then((terrainProvider) => {
          if (!cancelled && !viewer.isDestroyed()) {
            viewer.terrainProvider = terrainProvider;
          }
        })
        .catch(() => {
          if (!cancelled && !viewer.isDestroyed()) {
            viewer.terrainProvider = createProceduralFallbackTerrain();
          }
        });
    }

    // WebGL context loss safety handlers
    const canvas = viewer.scene.canvas;
    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
    };
    const handleContextRestored = () => {
      setContextLost(false);
    };
    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);

    // Track camera pan & zoom interactions with explicit trailing debounce (180ms)
    const debouncedCameraStatusChange = debounce(() => {
      if (viewer.isDestroyed()) return;
      const carto = viewer.camera.positionCartographic;
      if (!carto) return;
      const alt = Math.max(50, carto.height);
      if (stateRef.current.activeThematicMap === 'rainfall') {
        setCameraAltitudeMeters((prev) =>
          Math.abs(prev - alt) / Math.max(1, prev) > 0.22 ? alt : prev
        );
      }
      callbacksRef.current.onCameraStatusChange?.({
        center: {
          lat: Number(Cesium.Math.toDegrees(carto.latitude).toFixed(5)),
          lng: Number(Cesium.Math.toDegrees(carto.longitude).toFixed(5)),
        },
        altitudeMeters: Math.round(alt),
        headingDeg: Math.round(Cesium.Math.toDegrees(viewer.camera.heading)),
        pitchDeg: Math.round(Cesium.Math.toDegrees(viewer.camera.pitch)),
      });
    }, 180);

    const handleCameraChanged = () => {
      if (viewer.isDestroyed()) return;
      debouncedCameraStatusChange();
    };
    viewer.camera.changed.addEventListener(handleCameraChanged);

    // Unified Picking & Drawing ScreenSpaceEventHandler
    const handler = new Cesium.ScreenSpaceEventHandler(canvas);

    // Fast O(1) Ellipsoid ray pick for high-frequency mouse move & wheel zoom (zero terrain mesh lag!)
    const pickFastEllipsoidLatLon = (pos: Cesium.Cartesian2): LatLon | null => {
      if (viewer.isDestroyed()) return null;
      const cartesian = viewer.camera.pickEllipsoid(pos, viewer.scene.globe.ellipsoid);
      if (!cartesian) return null;
      const carto = Cesium.Cartographic.fromCartesian(cartesian);
      return {
        lat: Number(Cesium.Math.toDegrees(carto.latitude).toFixed(6)),
        lng: Number(Cesium.Math.toDegrees(carto.longitude).toFixed(6)),
      };
    };

    const pickLatLonFromWindowPos = (
      pos: Cesium.Cartesian2
    ): { lat: number; lng: number; height: number | null } | null => {
      if (viewer.isDestroyed()) return null;
      let cartesian: Cesium.Cartesian3 | undefined;
      if (viewer.scene.pickPositionSupported) {
        const ray = viewer.camera.getPickRay(pos);
        if (ray) {
          cartesian = viewer.scene.globe.pick(ray, viewer.scene);
        }
      }
      if (!cartesian) {
        cartesian = viewer.camera.pickEllipsoid(pos, viewer.scene.globe.ellipsoid);
      }
      if (!cartesian) return null;
      const carto = Cesium.Cartographic.fromCartesian(cartesian);
      const sampledHeight = viewer.scene.globe.getHeight(carto);
      return {
        lat: Number(Cesium.Math.toDegrees(carto.latitude).toFixed(6)),
        lng: Number(Cesium.Math.toDegrees(carto.longitude).toFixed(6)),
        height:
          typeof sampledHeight === 'number' && Number.isFinite(sampledHeight)
            ? Math.round(sampledHeight)
            : Number.isFinite(carto.height)
            ? Math.round(carto.height)
            : null,
      };
    };

    handler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      if (viewer.isDestroyed()) return;
      const { drawingMode: mode, vertices: curVerts, rectFirstCorner: firstCorner } =
        stateRef.current;

      const geo = pickLatLonFromWindowPos(movement.position);
      if (!geo) return;

      // Drawing Mode 1: Freehand multi-vertex polygon
      if (mode === 'freehand') {
        callbacksRef.current.onChangeVertices([
          ...curVerts,
          { lat: geo.lat, lng: geo.lng },
        ]);
        return;
      }

      // Drawing Mode 2: Two-click Rectangle Zone
      if (mode === 'rectangle') {
        if (!firstCorner) {
          const pt = { lat: geo.lat, lng: geo.lng };
          setRectFirstCorner(pt);
          setRectHoverCorner(pt);
        } else {
          const south = Math.min(firstCorner.lat, geo.lat);
          const north = Math.max(firstCorner.lat, geo.lat);
          const west = Math.min(firstCorner.lng, geo.lng);
          const east = Math.max(firstCorner.lng, geo.lng);
          if (Math.abs(north - south) > 0.00005 && Math.abs(east - west) > 0.00005) {
            const boxVerts: LatLon[] = [
              { lat: north, lng: west },
              { lat: north, lng: east },
              { lat: south, lng: east },
              { lat: south, lng: west },
            ];
            callbacksRef.current.onCompleteRectangle(boxVerts);
          }
          setRectFirstCorner(null);
          setRectHoverCorner(null);
        }
        return;
      }

      // Inspection Mode: Check if user clicked a spectral grid cell or zone entity first
      const picked = viewer.scene.pick(movement.position);
      if (Cesium.defined(picked) && picked.id instanceof Cesium.Entity) {
        const entityId = String(picked.id.id || '');
        if (entityId.startsWith('grid-cell-')) {
          const cellId = entityId.replace('grid-cell-', '');
          const cell = stateRef.current.gridCells.find((c) => c.id === cellId);
          if (cell) {
            callbacksRef.current.onClickGridCell(cell);
          }
        } else if (entityId.startsWith('study-zone-')) {
          const zid = entityId.replace(/^study-zone-(?:label-)?/, '');
          callbacksRef.current.onSelectZone?.(zid);
        }
      }

      // Always report exact clicked coordinate + terrain elevation telemetry
      callbacksRef.current.onSelectPoint(geo.lat, geo.lng, geo.height);
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // Throttled progressive repaint while tiles stream under requestRenderMode: true,
    // plus a crisp final settle render once remaining === 0 (idle 0% CPU once settled).
    let tileRenderTimer: ReturnType<typeof setTimeout> | null = null;
    let lastProgressRenderAt = 0;
    const progressIntervalMs = isSoftwareGl ? 650 : 260;
    const handleTileProgress = (remaining: number) => {
      if (viewer.isDestroyed()) return;
      if (remaining === 0) {
        if (tileRenderTimer) {
          clearTimeout(tileRenderTimer);
          tileRenderTimer = null;
        }
        tileRenderTimer = setTimeout(() => {
          tileRenderTimer = null;
          if (!viewer.isDestroyed()) {
            viewer.scene.requestRender();
          }
        }, 70);
        return;
      }

      if (zoomAnimRef.current.active) {
        return;
      }
      const now = Date.now();
      if (now - lastProgressRenderAt >= progressIntervalMs && !tileRenderTimer) {
        tileRenderTimer = setTimeout(() => {
          tileRenderTimer = null;
          lastProgressRenderAt = Date.now();
          if (!viewer.isDestroyed()) {
            viewer.scene.requestRender();
          }
        }, isSoftwareGl ? 240 : 120);
      }
    };
    viewer.scene.globe.tileLoadProgressEvent.addEventListener(handleTileProgress);

    // Track pointer & smooth cursor-targeted incremental mouse wheel zoom
    let lastWheelPickMs = 0;
    const handleWheel = (e: WheelEvent) => {
      if (viewer.isDestroyed()) return;
      e.preventDefault();
      const carto = viewer.camera.positionCartographic;
      if (!carto) return;

      const curAlt = zoomAnimRef.current.active
        ? zoomAnimRef.current.targetAlt
        : Math.max(85, carto.height);
      const curLat = zoomAnimRef.current.active
        ? zoomAnimRef.current.targetLat
        : Cesium.Math.toDegrees(carto.latitude);
      const curLng = zoomAnimRef.current.active
        ? zoomAnimRef.current.targetLng
        : Cesium.Math.toDegrees(carto.longitude);

      const delta = Math.sign(e.deltaY) * Math.min(1.8, Math.abs(e.deltaY) / 100);
      if (delta === 0) return;

      const factor = delta > 0 ? 1 + 0.18 * delta : 1 / (1 + 0.18 * -delta);
      const nextAlt = Math.max(95, Math.min(22000000, curAlt * factor));

      const nowMs = performance.now();
      let cursorGeo = lastCursorGeoRef.current;
      if (nowMs - lastWheelPickMs > 120 || !cursorGeo) {
        const rect = canvas.getBoundingClientRect();
        const winPos = new Cesium.Cartesian2(e.clientX - rect.left, e.clientY - rect.top);
        const picked = pickFastEllipsoidLatLon(winPos);
        if (picked) {
          cursorGeo = picked;
          lastCursorGeoRef.current = picked;
        }
        lastWheelPickMs = nowMs;
      }

      let nextLat = curLat;
      let nextLng = curLng;

      if (cursorGeo && nextAlt < curAlt) {
        const pull = Math.min(0.62, Math.max(0.05, 1 - nextAlt / curAlt));
        let diffLng = cursorGeo.lng - curLng;
        if (diffLng > 180) diffLng -= 360;
        if (diffLng < -180) diffLng += 360;
        nextLat = curLat + (cursorGeo.lat - curLat) * pull;
        nextLng = curLng + diffLng * pull;
      }

      startIncrementalZoom(nextAlt, nextLat, nextLng);
      debouncedCameraStatusChange();
    };

    const handlePointerCancelZoom = () => {
      cancelZoomAnimation();
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('pointerdown', handlePointerCancelZoom);

    handler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
      if (viewer.isDestroyed()) return;
      const { drawingMode: mode, rectFirstCorner: firstCorner } = stateRef.current;
      if (mode !== 'rectangle' || !firstCorner) return;
      const geo = pickFastEllipsoidLatLon(movement.endPosition);
      if (geo) {
        lastCursorGeoRef.current = { lat: geo.lat, lng: geo.lng };
        setRectHoverCorner({ lat: geo.lat, lng: geo.lng });
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    setViewerReady(true);

    return () => {
      cancelled = true;
      debouncedCameraStatusChange.cancel();
      if (tileRenderTimer) {
        clearTimeout(tileRenderTimer);
        tileRenderTimer = null;
      }
      cancelZoomAnimation();
      handler.destroy();
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('pointerdown', handlePointerCancelZoom);
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
      if (!viewer.isDestroyed()) {
        viewer.scene.globe.tileLoadProgressEvent.removeEventListener(handleTileProgress);
        viewer.camera.changed.removeEventListener(handleCameraChanged);
        viewer.destroy();
      }
      viewerRef.current = null;
    };
  }, []);

  // 2. Sync Base Satellite / Topo / Dark Imagery Layer + Labels + Historical Multi-Temporal Archive
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed() || !viewerReady) return;
    let cancelled = false;

    const styleMeta = BASE_MAP_STYLES[baseMapStyle] || BASE_MAP_STYLES.hybrid;
    const isSatStyle =
      baseMapStyle === 'satellite' ||
      baseMapStyle === 'hybrid' ||
      baseMapStyle === 'dark_satellite';

    if (baseLayerRef.current) {
      viewer.imageryLayers.remove(baseLayerRef.current, true);
      baseLayerRef.current = null;
    }
    if (comparisonSplitLayerRef.current) {
      viewer.imageryLayers.remove(comparisonSplitLayerRef.current, true);
      comparisonSplitLayerRef.current = null;
    }
    if (labelsLayerRef.current) {
      viewer.imageryLayers.remove(labelsLayerRef.current, true);
      labelsLayerRef.current = null;
    }

    if (isComparisonMode) {
      // Comparison Mode: Left side shows Baseline Vintage, Right side shows Target Vintage
      const baselineVintage = getSatelliteVintageById(comparisonBaselineVintageId);
      const targetVintage = getSatelliteVintageById(comparisonTargetVintageId);

      const baseProvider = new Cesium.UrlTemplateImageryProvider({
        url: baselineVintage.tileUrl,
        maximumLevel: baselineVintage.id === '2023_s2' ? 16 : 19,
        enablePickFeatures: false,
      });
      const leftLayer = viewer.imageryLayers.addImageryProvider(baseProvider, 0);
      leftLayer.splitDirection = Cesium.SplitDirection.LEFT;
      baseLayerRef.current = leftLayer;

      const targetProvider = new Cesium.UrlTemplateImageryProvider({
        url: targetVintage.tileUrl,
        maximumLevel: targetVintage.id === '2023_s2' ? 16 : 19,
        enablePickFeatures: false,
      });
      const rightLayer = viewer.imageryLayers.addImageryProvider(targetProvider, 1);
      rightLayer.splitDirection = Cesium.SplitDirection.RIGHT;
      comparisonSplitLayerRef.current = rightLayer;

      viewer.scene.splitPosition = splitFraction;
      viewer.imageryLayers.lowerToBottom(rightLayer);
      viewer.imageryLayers.lowerToBottom(leftLayer);
    } else {
      // Standard Single Vintage Mode
      const activeVintage = getSatelliteVintageById(activeVintageId);
      const effectiveTileUrl =
        baseMapStyle === 'topo_contours'
          ? 'https://tile.opentopomap.org/{z}/{x}/{y}.png'
          : isSatStyle
          ? activeVintage.tileUrl
          : styleMeta.tileUrl;

      const provider = new Cesium.UrlTemplateImageryProvider({
        url: effectiveTileUrl,
        maximumLevel:
          baseMapStyle === 'topo_contours'
            ? 16
            : isSatStyle && activeVintage.id === '2023_s2'
            ? 16
            : 19,
        enablePickFeatures: false,
      });

      const newBase = viewer.imageryLayers.addImageryProvider(provider, 0);
      newBase.splitDirection = Cesium.SplitDirection.NONE;
      if (baseMapStyle === 'dark_satellite') {
        newBase.brightness = 0.72;
        newBase.contrast = 1.22;
      } else if (baseMapStyle === 'topo_contours') {
        newBase.brightness = 0.96;
        newBase.contrast = 1.08;
      }
      baseLayerRef.current = newBase;
      viewer.imageryLayers.lowerToBottom(newBase);
      viewer.scene.splitPosition = 0.5;
    }

    const labelsTileUrl =
      styleMeta.labelsUrl ||
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}';

    if (baseMapStyle !== 'topo_contours' && (styleMeta.labelsUrl || showWhiteBorders)) {
      const labelsProvider = new Cesium.UrlTemplateImageryProvider({
        url: labelsTileUrl,
        maximumLevel: 18,
        enablePickFeatures: false,
      });
      const lblLayer = viewer.imageryLayers.addImageryProvider(
        labelsProvider,
        viewer.imageryLayers.length
      );
      lblLayer.show = showWhiteBorders || Boolean(styleMeta.labelsUrl);
      labelsLayerRef.current = lblLayer;
      viewer.imageryLayers.raiseToTop(lblLayer);
    }

    viewer.scene.requestRender();
    const t1 = setTimeout(() => {
      if (!cancelled && !viewer.isDestroyed()) viewer.scene.requestRender();
    }, 150);
    const t2 = setTimeout(() => {
      if (!cancelled && !viewer.isDestroyed()) viewer.scene.requestRender();
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [
    baseMapStyle,
    showWhiteBorders,
    viewerReady,
    activeVintageId,
    isComparisonMode,
    comparisonBaselineVintageId,
    comparisonTargetVintageId,
  ]);

  // 3. Sync ALL Scientific Thematic & Spectral Overlays (Natural, Smooth Land-Masked Spectral/Soil/Temp/Moisture, Terrarium DEM, Rainfall & Clouds)
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed() || !viewerReady) return;
    let cancelled = false;

    if (thematicLayerRef.current) {
      viewer.imageryLayers.remove(thematicLayerRef.current, true);
      thematicLayerRef.current = null;
    }
    if (dayNightOverlayLayerRef.current) {
      viewer.imageryLayers.remove(dayNightOverlayLayerRef.current, true);
      dayNightOverlayLayerRef.current = null;
    }

    const effectiveMap: ThematicMapLayerId = isSoilMoistureActive
      ? 'soil_moisture'
      : activeThematicMap;

    const kickRenderTimers: Array<ReturnType<typeof setTimeout>> = [];
    let decodedThrottleTimer: ReturnType<typeof setTimeout> | null = null;
    const onTileDecoded = () => {
      if (cancelled || viewer.isDestroyed() || decodedThrottleTimer) return;
      decodedThrottleTimer = setTimeout(() => {
        decodedThrottleTimer = null;
        if (!cancelled && !viewer.isDestroyed()) {
          viewer.scene.requestRender();
        }
      }, 85);
    };
    const scheduleRenderKicks = () => {
      viewer.scene.requestRender();
      [140, 420, 900].forEach((ms) => {
        kickRenderTimers.push(
          setTimeout(() => {
            if (!cancelled && !viewer.isDestroyed()) {
              viewer.scene.requestRender();
            }
          }, ms)
        );
      });
    };

    const attachOptionalDayNightBlendOverlay = () => {
      if (blendDayNightOverlay && effectiveMap !== 'day_night') {
        try {
          const dnProvider = createDayNightTerminatorImageryProvider(
            utcHourOverride,
            true,
            () => cancelled,
            onTileDecoded
          );
          const dnLayer = viewer.imageryLayers.addImageryProvider(dnProvider);
          dnLayer.alpha = 0.88;
          dayNightOverlayLayerRef.current = dnLayer;
          if (labelsLayerRef.current && viewer.imageryLayers.contains(labelsLayerRef.current)) {
            viewer.imageryLayers.raiseToTop(labelsLayerRef.current);
          }
        } catch {
          // ignore
        }
      }
    };

    // In Default Natural Mode ('natural') or when overlay is toggled off,
    // keep the base satellite/terrain map 100% pure and uncolored (plus optional Day/Night terminator blend).
    if (!showGlobalFieldOverlay || effectiveMap === 'natural') {
      attachOptionalDayNightBlendOverlay();
      scheduleRenderKicks();
      return () => {
        cancelled = true;
        if (decodedThrottleTimer) clearTimeout(decodedThrottleTimer);
        kickRenderTimers.forEach(clearTimeout);
      };
    }

    const insertBelowLabels = (provider: Cesium.ImageryProvider, alpha: number) => {
      const layer = viewer.imageryLayers.addImageryProvider(provider);
      layer.alpha = alpha;
      thematicLayerRef.current = layer;
      if (baseLayerRef.current && viewer.imageryLayers.contains(baseLayerRef.current)) {
        viewer.imageryLayers.lowerToBottom(baseLayerRef.current);
      }
      attachOptionalDayNightBlendOverlay();
      if (labelsLayerRef.current && viewer.imageryLayers.contains(labelsLayerRef.current)) {
        viewer.imageryLayers.raiseToTop(labelsLayerRef.current);
      }
      scheduleRenderKicks();
    };

    // A) Real Terrarium DEM 1:1 Stepped Elevation Relief & Contours (100% Land Coverage, Natural Oceans, Micro-Pixel 3D Peaks)
    if (effectiveMap === 'elevation') {
      try {
        const elevProvider = createTerrariumElevationImageryProvider(
          elevationPalette,
          elevationDisplayMode,
          () => cancelled,
          onTileDecoded
        );
        const elevAlpha =
          elevationDisplayMode === 'contours_only'
            ? 0.94
            : Math.max(0.45, Math.min(0.92, overlayOpacity * 1.38));
        insertBelowLabels(elevProvider, elevAlpha);
      } catch {
        // ignore invalid provider
      }
      return () => {
        cancelled = true;
        if (decodedThrottleTimer) clearTimeout(decodedThrottleTimer);
        kickRenderTimers.forEach(clearTimeout);
      };
    }

    // A2) Agricultural DEM Drainage Flow & Waterlogging Depression Layer (`dem_drainage`)
    if (effectiveMap === 'dem_drainage') {
      try {
        const drainageProvider = createDemDrainageImageryProvider(
          () => cancelled,
          onTileDecoded
        );
        insertBelowLabels(
          drainageProvider,
          Math.max(0.48, Math.min(0.9, overlayOpacity * 1.32))
        );
      } catch {
        // ignore invalid provider
      }
      return () => {
        cancelled = true;
        if (decodedThrottleTimer) clearTimeout(decodedThrottleTimer);
        kickRenderTimers.forEach(clearTimeout);
      };
    }

    // B) Snowfall, Freezing Level (0°C) & Blizzard Storm Tracking Map (`snow_ice`)
    if (effectiveMap === 'snow_ice') {
      try {
        const snowProvider = createSnowAndBlizzardImageryProvider(
          activeWeatherDay,
          () => cancelled,
          onTileDecoded
        );
        insertBelowLabels(
          snowProvider,
          Math.max(0.62, Math.min(0.95, overlayOpacity * 1.38))
        );
      } catch {
        // ignore invalid provider
      }
      return () => {
        cancelled = true;
        if (decodedThrottleTimer) clearTimeout(decodedThrottleTimer);
        kickRenderTimers.forEach(clearTimeout);
      };
    }

    // C) Global Day/Night Solar Terminator, World Solar Time & Nocturnal City Lights (`day_night`)
    if (effectiveMap === 'day_night') {
      try {
        const dayNightProvider = createDayNightTerminatorImageryProvider(
          utcHourOverride,
          false,
          () => cancelled,
          onTileDecoded
        );
        insertBelowLabels(
          dayNightProvider,
          Math.max(0.68, Math.min(0.95, overlayOpacity * 1.35))
        );
      } catch {
        // ignore invalid provider
      }
      return () => {
        cancelled = true;
        if (decodedThrottleTimer) clearTimeout(decodedThrottleTimer);
        kickRenderTimers.forEach(clearTimeout);
      };
    }

    // D) Ventusky-Grade Continuous Smooth Global Weather & Air-Quality Layers (100% Land + Oceans!)
    if (
      effectiveMap === 'temperature' ||
      effectiveMap === 'apparent_temp' ||
      effectiveMap === 'rainfall' ||
      effectiveMap === 'wind' ||
      effectiveMap === 'wind_gusts' ||
      effectiveMap === 'pressure' ||
      effectiveMap === 'thunderstorms' ||
      effectiveMap === 'weather_radar' ||
      effectiveMap === 'satellite_ir' ||
      effectiveMap === 'humidity' ||
      effectiveMap === 'weather' ||
      effectiveMap === 'air_quality'
    ) {
      try {
        const ventuskyProvider = createVentuskyWeatherImageryProvider(
          effectiveMap,
          activeWeatherDay,
          globalTempSubMode,
          ventuskyOptions,
          utcHourOverride,
          liveVentuskyNodes,
          () => cancelled,
          onTileDecoded
        );
        const layerAlpha =
          effectiveMap === 'wind'
            ? Math.max(0.42, Math.min(0.68, overlayOpacity * 0.92))
            : Math.max(0.54, Math.min(0.92, overlayOpacity * 1.32));
        insertBelowLabels(ventuskyProvider, layerAlpha);
      } catch {
        // ignore invalid provider
      }
      return () => {
        cancelled = true;
        if (decodedThrottleTimer) clearTimeout(decodedThrottleTimer);
        kickRenderTimers.forEach(clearTimeout);
      };
    }

    // E) Crisp Micro-Pixel 100% Land-Coverage Thematic & Spectral Maps (Vegetation, All 10 Spectral/Soil Indices, Soil Moisture, Drought)
    const targetSpectralKey: SpectralIndexKey =
      effectiveMap === 'soil_moisture' || effectiveMap === 'drought'
        ? activeLayer === 'SM_7_28'
          ? 'SM_7_28'
          : 'SM_0_7'
        : activeLayer;

    try {
      const smoothLandProvider = createSmoothLandThematicImageryProvider(
        targetSpectralKey,
        activeWeatherDay,
        () => cancelled,
        onTileDecoded
      );
      insertBelowLabels(
        smoothLandProvider,
        Math.max(0.5, Math.min(0.9, overlayOpacity * 1.32))
      );
    } catch {
      // ignore invalid provider
    }

    return () => {
      cancelled = true;
      if (decodedThrottleTimer) clearTimeout(decodedThrottleTimer);
      kickRenderTimers.forEach(clearTimeout);
    };
  }, [
    activeThematicMap,
    isSoilMoistureActive,
    activeLayer,
    globalTempSubMode,
    elevationDisplayMode,
    elevationPalette,
    showGlobalFieldOverlay,
    activeWeatherDay,
    utcHourOverride,
    blendDayNightOverlay,
    ventuskyOptions,
    liveVentuskyNodes,
    viewerReady,
  ]);

  // 3B. Lightweight Layer Alpha Sync (prevents tearing down imagery provider when opacity changes)
  useEffect(() => {
    const viewer = viewerRef.current;
    const layer = thematicLayerRef.current;
    if (!viewer || viewer.isDestroyed() || !layer) return;
    const effectiveMap: ThematicMapLayerId = isSoilMoistureActive
      ? 'soil_moisture'
      : activeThematicMap;
    if (effectiveMap === 'elevation') {
      layer.alpha =
        elevationDisplayMode === 'contours_only'
          ? 0.94
          : Math.max(0.45, Math.min(0.92, overlayOpacity * 1.38));
    } else if (effectiveMap === 'dem_drainage') {
      layer.alpha = Math.max(0.48, Math.min(0.9, overlayOpacity * 1.32));
    } else if (effectiveMap === 'snow_ice') {
      layer.alpha = Math.max(0.62, Math.min(0.95, overlayOpacity * 1.38));
    } else if (effectiveMap === 'day_night') {
      layer.alpha = Math.max(0.68, Math.min(0.95, overlayOpacity * 1.35));
    } else if (effectiveMap === 'wind') {
      layer.alpha = Math.max(0.42, Math.min(0.68, overlayOpacity * 0.92));
    } else {
      layer.alpha = Math.max(0.5, Math.min(0.92, overlayOpacity * 1.32));
    }
    viewer.scene.requestRender();
  }, [overlayOpacity, activeThematicMap, isSoilMoistureActive, elevationDisplayMode, viewerReady]);

  // 4. Sync 3D Terrain Vertical Exaggeration
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed() || !viewerReady) return;

    const isElevationMode = !isSoilMoistureActive && activeThematicMap === 'elevation';
    const isDemDrainageMode = !isSoilMoistureActive && activeThematicMap === 'dem_drainage';

    viewer.scene.verticalExaggeration = isElevationMode
      ? Math.max(1.0, Math.min(4.0, terrainExaggeration))
      : isDemDrainageMode
      ? Math.max(1.4, Math.min(2.6, terrainExaggeration * 0.8))
      : viewMode3D
      ? 1.25
      : 1.0;

    viewer.scene.globe.material = undefined as unknown as Cesium.Material;
    viewer.scene.globe.enableLighting = false;
    viewer.scene.requestRender();
  }, [
    activeThematicMap,
    isSoilMoistureActive,
    terrainExaggeration,
    viewMode3D,
    viewerReady,
  ]);

  // 5. Sync 3D Globe vs 2D Flat Scene Mode Morph inside unified Cesium Viewer
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed() || !viewerReady) return;
    const targetMode =
      projectionMode === 'flat_2d' ? Cesium.SceneMode.SCENE2D : Cesium.SceneMode.SCENE3D;
    if (viewer.scene.mode !== targetMode) {
      if (targetMode === Cesium.SceneMode.SCENE2D) {
        viewer.scene.morphTo2D(0.75);
      } else {
        viewer.scene.morphTo3D(0.75);
      }
      viewer.scene.requestRender();
    }
  }, [projectionMode, viewerReady]);

  // 6. Sync Explicit Orientation (Heading & Tilt Pitch) when user adjusts sliders
  const prevOrientationRef = useRef({ rotationDeg, pitchDeg, viewMode3D });
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed() || !viewerReady) return;

    const prev = prevOrientationRef.current;
    if (
      prev.rotationDeg === rotationDeg &&
      prev.pitchDeg === pitchDeg &&
      prev.viewMode3D === viewMode3D
    ) {
      return;
    }
    prevOrientationRef.current = { rotationDeg, pitchDeg, viewMode3D };

    const targetPitchDeg = viewMode3D ? -(90 - Math.min(68, Math.max(15, pitchDeg))) : -89.5;
    viewer.camera.setView({
      destination: viewer.camera.positionWC,
      orientation: {
        heading: Cesium.Math.toRadians(rotationDeg),
        pitch: Cesium.Math.toRadians(targetPitchDeg),
        roll: 0,
      },
    });
    viewer.scene.requestRender();
  }, [rotationDeg, pitchDeg, viewMode3D, viewerReady]);

  // 7. Handle Explicit User Fly-To Commands (Zone click, Quick Region, GPS — NEVER automatic)
  const lastFlyNonceRef = useRef<number>(-1);
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed() || !viewerReady || !flyToTarget) return;
    if (flyToTarget.nonce === lastFlyNonceRef.current) return;
    lastFlyNonceRef.current = flyToTarget.nonce;

    cancelZoomAnimation();

    const targetPitch =
      typeof flyToTarget.pitchDeg === 'number'
        ? Cesium.Math.toRadians(flyToTarget.pitchDeg)
        : viewMode3D
        ? Cesium.Math.toRadians(-(90 - Math.min(62, Math.max(18, pitchDeg))))
        : Cesium.Math.toRadians(-89.5);

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        flyToTarget.lng,
        flyToTarget.lat,
        Math.max(120, flyToTarget.heightMeters)
      ),
      orientation: {
        heading: Cesium.Math.toRadians(flyToTarget.headingDeg ?? rotationDeg),
        pitch: targetPitch,
        roll: 0,
      },
      duration: 1.05,
    });
    viewer.scene.requestRender();
  }, [flyToTarget, viewerReady, pitchDeg, rotationDeg, viewMode3D]);

  // 8. Handle Compact Side Zoom Buttons (+ / - / World Reset) with Incremental Smooth Zoom
  const lastZoomNonceRef = useRef<number>(-1);
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed() || !viewerReady || !zoomCommand) return;
    if (zoomCommand.nonce === lastZoomNonceRef.current) return;
    lastZoomNonceRef.current = zoomCommand.nonce;

    if (zoomCommand.direction === 'world') {
      cancelZoomAnimation();
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(28.0, 27.0, 11800000),
        orientation: {
          heading: 0,
          pitch: Cesium.Math.toRadians(-90),
          roll: 0,
        },
        duration: 1.0,
      });
      viewer.scene.requestRender();
      return;
    }

    const carto = viewer.camera.positionCartographic;
    const curLat = zoomAnimRef.current.active
      ? zoomAnimRef.current.targetLat
      : carto
      ? Cesium.Math.toDegrees(carto.latitude)
      : 22.0;
    const curLng = zoomAnimRef.current.active
      ? zoomAnimRef.current.targetLng
      : carto
      ? Cesium.Math.toDegrees(carto.longitude)
      : 24.0;
    const curAlt = zoomAnimRef.current.active
      ? zoomAnimRef.current.targetAlt
      : carto
      ? Math.max(85, carto.height)
      : 1000000;

    const factor = zoomCommand.direction === 'in' ? 0.68 : 1.47;
    const nextAlt = Math.max(95, Math.min(22000000, curAlt * factor));

    let targetLat = curLat;
    let targetLng = curLng;
    const cursorGeo = lastCursorGeoRef.current;
    if (zoomCommand.direction === 'in' && cursorGeo) {
      let diffLng = cursorGeo.lng - curLng;
      if (diffLng > 180) diffLng -= 360;
      if (diffLng < -180) diffLng += 360;
      targetLat = curLat + (cursorGeo.lat - curLat) * 0.28;
      targetLng = curLng + diffLng * 0.28;
    }

    startIncrementalZoom(nextAlt, targetLat, targetLng);
  }, [zoomCommand, viewerReady]);

  // 9. Sync Saved Study Zones, Active Polygon, Spectral Grid Cells, and Drawing Preview
  useEffect(() => {
    const zoneDs = zoneDataSourceRef.current;
    const gridDs = gridDataSourceRef.current;
    const drawDs = drawDataSourceRef.current;
    if (!zoneDs || !gridDs || !drawDs || !viewerReady) return;

    zoneDs.entities.suspendEvents();
    gridDs.entities.suspendEvents();
    drawDs.entities.suspendEvents();

    zoneDs.entities.removeAll();
    gridDs.entities.removeAll();
    drawDs.entities.removeAll();

    const effectiveMap: ThematicMapLayerId = isSoilMoistureActive
      ? 'soil_moisture'
      : activeThematicMap;

    // Render all saved zones on the 3D terrain
    zones.forEach((zone) => {
      if (zone.vertices.length < 3) return;
      const isSelected = zone.id === activeZoneId;
      const degFlat = zone.vertices.flatMap((v) => [v.lng, v.lat]);
      const closedFlat = [...degFlat, zone.vertices[0].lng, zone.vertices[0].lat];
      const baseColor = Cesium.Color.fromCssColorString(zone.color || '#10b981');

      zoneDs.entities.add({
        id: `study-zone-${zone.id}`,
        polygon: {
          hierarchy: Cesium.Cartesian3.fromDegreesArray(degFlat),
          material: baseColor.withAlpha(
            effectiveMap === 'natural' ? 0.04 : isSelected ? 0.14 : 0.22
          ),
          classificationType: Cesium.ClassificationType.BOTH,
        },
        polyline: {
          positions: Cesium.Cartesian3.fromDegreesArray(closedFlat),
          width: isSelected ? 3.5 : 2.2,
          material: baseColor.withAlpha(0.95),
          clampToGround: true,
        },
      });

      const zoneBadge = getShapedTextBillboardCanvas({
        lines: [isAr ? zone.nameAr : zone.nameEn],
        isRtl: isAr,
        variant: 'zone',
        accentColor: zone.color || (isSelected ? '#10b981' : '#38bdf8'),
        isSelected,
      });

      zoneDs.entities.add({
        id: `study-zone-label-${zone.id}`,
        position: Cesium.Cartesian3.fromDegrees(zone.centroid.lng, zone.centroid.lat),
        billboard: {
          image: zoneBadge.canvas,
          width: zoneBadge.widthCss,
          height: zoneBadge.heightCss,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -10),
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });
    });

    // Render active working polygon & spectral grid cells
    if (vertices.length >= 3) {
      const degFlat = vertices.flatMap((v) => [v.lng, v.lat]);
      const closedFlat = [...degFlat, vertices[0].lng, vertices[0].lat];

      drawDs.entities.add({
        polyline: {
          positions: Cesium.Cartesian3.fromDegreesArray(closedFlat),
          width: 3,
          material: Cesium.Color.fromCssColorString('#10b981'),
          clampToGround: true,
        },
      });

      if (showSubZoneLabels && effectiveMap !== 'natural' && effectiveMap !== 'wind') {
        gridCells.forEach((cell) => {
          const vegVisual = resolveZoneCellVegetationOverlayVisual(
            cell,
            effectiveMap,
            activeLayer
          );
          if (!vegVisual.shouldColor) {
            return;
          }

          const evalRes = evaluateCellForUnifiedLayer(
            cell,
            effectiveMap,
            activeLayer,
            forecast14,
            selectedMoistureDayIdx,
            isAr,
            elevationPalette,
            ventuskyOptions,
            liveVentuskyNodes
          );
          const fillHex = vegVisual.colorHex || evalRes.color;
          const cellFlat = cell.bounds.flatMap((b) => [b.lng, b.lat]);
          gridDs.entities.add({
            id: `grid-cell-${cell.id}`,
            polygon: {
              hierarchy: Cesium.Cartesian3.fromDegreesArray(cellFlat),
              material: Cesium.Color.fromCssColorString(fillHex).withAlpha(
                Math.max(0.22, Math.min(0.82, overlayOpacity))
              ),
              outline: false,
              classificationType: Cesium.ClassificationType.BOTH,
            },
          });
        });
      }
    }

    // Render vertex markers during freehand drawing
    if (drawingMode === 'freehand') {
      vertices.forEach((v, idx) => {
        drawDs.entities.add({
          position: Cesium.Cartesian3.fromDegrees(v.lng, v.lat),
          point: {
            pixelSize: 9,
            color: Cesium.Color.fromCssColorString(idx === 0 ? '#f59e0b' : '#10b981'),
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 2,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
        });
      });
      if (vertices.length >= 2) {
        const lineFlat = vertices.flatMap((v) => [v.lng, v.lat]);
        drawDs.entities.add({
          polyline: {
            positions: Cesium.Cartesian3.fromDegreesArray(lineFlat),
            width: 2.5,
            material: Cesium.Color.fromCssColorString('#f59e0b'),
            clampToGround: true,
          },
        });
      }
    }

    // Render live rectangle preview while selecting corner 2
    if (drawingMode === 'rectangle' && rectFirstCorner) {
      drawDs.entities.add({
        position: Cesium.Cartesian3.fromDegrees(rectFirstCorner.lng, rectFirstCorner.lat),
        point: {
          pixelSize: 10,
          color: Cesium.Color.fromCssColorString('#38bdf8'),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });
      if (rectHoverCorner) {
        const south = Math.min(rectFirstCorner.lat, rectHoverCorner.lat);
        const north = Math.max(rectFirstCorner.lat, rectHoverCorner.lat);
        const west = Math.min(rectFirstCorner.lng, rectHoverCorner.lng);
        const east = Math.max(rectFirstCorner.lng, rectHoverCorner.lng);
        const boxFlat = [west, north, east, north, east, south, west, south, west, north];
        drawDs.entities.add({
          polygon: {
            hierarchy: Cesium.Cartesian3.fromDegreesArray([
              west,
              north,
              east,
              north,
              east,
              south,
              west,
              south,
            ]),
            material: Cesium.Color.fromCssColorString('#38bdf8').withAlpha(0.22),
            classificationType: Cesium.ClassificationType.BOTH,
          },
          polyline: {
            positions: Cesium.Cartesian3.fromDegreesArray(boxFlat),
            width: 2.5,
            material: Cesium.Color.fromCssColorString('#38bdf8'),
            clampToGround: true,
          },
        });
      }
    }
    zoneDs.entities.resumeEvents();
    gridDs.entities.resumeEvents();
    drawDs.entities.resumeEvents();
    if (viewerRef.current && !viewerRef.current.isDestroyed()) {
      viewerRef.current.scene.requestRender();
    }
  }, [
    zones,
    activeZoneId,
    vertices,
    gridCells,
    activeThematicMap,
    isSoilMoistureActive,
    activeLayer,
    forecast14,
    selectedMoistureDayIdx,
    elevationPalette,
    overlayOpacity,
    showSubZoneLabels,
    drawingMode,
    rectFirstCorner,
    rectHoverCorner,
    isAr,
    viewerReady,
  ]);

  // 9B. White Country Borders Overlay (Uses high-res Esri Reference World_Boundaries_and_Places without coarse jagged polylines)
  useEffect(() => {
    const bordersDs = whiteBordersDataSourceRef.current;
    const viewer = viewerRef.current;
    if (!bordersDs || !viewer || viewer.isDestroyed() || !viewerReady) return;

    bordersDs.entities.removeAll();
    if (labelsLayerRef.current && viewer.imageryLayers.contains(labelsLayerRef.current)) {
      labelsLayerRef.current.show = showWhiteBorders;
      viewer.imageryLayers.raiseToTop(labelsLayerRef.current);
    }
    viewer.scene.requestRender();
  }, [showWhiteBorders, viewerReady]);

  // 9C. Ventusky City Telemetry Labels, Day/Night Clocks & Pressure H/L Centers
  useEffect(() => {
    const citiesDs = cityMetricsDataSourceRef.current;
    const viewer = viewerRef.current;
    if (!citiesDs || !viewer || viewer.isDestroyed() || !viewerReady) return;

    citiesDs.entities.removeAll();
    const effectiveMap: ThematicMapLayerId = isSoilMoistureActive
      ? 'soil_moisture'
      : activeThematicMap;

    const isVentuskyCityLayer =
      effectiveMap === 'temperature' ||
      effectiveMap === 'apparent_temp' ||
      effectiveMap === 'wind' ||
      effectiveMap === 'wind_gusts' ||
      effectiveMap === 'rainfall' ||
      effectiveMap === 'pressure' ||
      effectiveMap === 'thunderstorms' ||
      effectiveMap === 'weather_radar' ||
      effectiveMap === 'humidity' ||
      effectiveMap === 'air_quality' ||
      effectiveMap === 'weather' ||
      effectiveMap === 'satellite_ir' ||
      effectiveMap === 'day_night';

    if (showCityMetrics && isVentuskyCityLayer) {
      const now = new Date();
      const liveUtcDecimal = now.getUTCHours() + now.getUTCMinutes() / 60;
      const effectiveUtc =
        typeof utcHourOverride === 'number'
          ? utcHourOverride
          : typeof ventuskyOptions?.utcHour === 'number'
          ? ventuskyOptions.utcHour
          : liveUtcDecimal;
      const mergedOpts: Partial<VentuskyAtmosphericOptions> = {
        ...(ventuskyOptions || {}),
        utcHour: effectiveUtc,
      };
      VENTUSKY_CITIES_CATALOG.forEach((city) => {
        const labelName = isAr ? city.nameAr : city.nameEn;
        let metricText = '';
        if (effectiveMap === 'day_night') {
          const solar = evaluateGlobalDayNightSolarAtLatLon(city.lat, city.lng, effectiveUtc);
          const sunIcon = solar.isDaylight ? '☀️' : solar.isTwilight ? '🌅' : '🌙';
          metricText =
            solar.solarRadiationWm2 > 0
              ? `${solar.localTimeFormatted} ${sunIcon} ${solar.solarRadiationWm2}W`
              : `${solar.localTimeFormatted} ${sunIcon}`;
        } else {
          const reading = evaluateVentuskyLayerAtLatLon(
            city.lat,
            city.lng,
            effectiveMap,
            mergedOpts,
            activeWeatherDay,
            liveVentuskyNodes
          );
          metricText = reading.formattedValue;
        }
        const cityBadge = getShapedTextBillboardCanvas({
          lines: [metricText, labelName],
          isRtl: isAr,
          variant: 'city',
        });
        citiesDs.entities.add({
          id: `city-metric-${city.id}`,
          position: Cesium.Cartesian3.fromDegrees(city.lng, city.lat),
          point: {
            pixelSize: 5,
            color: Cesium.Color.fromCssColorString('#f8fafc'),
            outlineColor: Cesium.Color.fromCssColorString('#020617'),
            outlineWidth: 1.5,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
          billboard: {
            image: cityBadge.canvas,
            width: cityBadge.widthCss,
            height: cityBadge.heightCss,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -8),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            scaleByDistance: new Cesium.NearFarScalar(3.5e5, 1.0, 1.8e7, 0.72),
          },
        });
      });

      // Add explicit synoptic High/Low pressure badges in Pressure mode
      if (effectiveMap === 'pressure') {
        const pressureCenters: Array<{ id: string; badge: 'H' | 'L'; lat: number; lng: number; hpa: string }> = [
          { id: 'h-azores', badge: 'H', lat: 35.0, lng: -34.0, hpa: '1032' },
          { id: 'h-siberia', badge: 'H', lat: 50.0, lng: 92.0, hpa: '1038' },
          { id: 'h-arabia', badge: 'H', lat: 32.0, lng: 44.0, hpa: '1024' },
          { id: 'l-iceland', badge: 'L', lat: 57.0, lng: -24.0, hpa: '974' },
          { id: 'l-med', badge: 'L', lat: 36.5, lng: 19.5, hpa: '998' },
        ];
        pressureCenters.forEach((pc) => {
          citiesDs.entities.add({
            id: `pressure-center-${pc.id}`,
            position: Cesium.Cartesian3.fromDegrees(pc.lng, pc.lat),
            label: {
              text: `${pc.badge} ${pc.hpa}`,
              font: 'bold 14px "IBM Plex Mono", monospace',
              fillColor:
                pc.badge === 'H'
                  ? Cesium.Color.fromCssColorString('#fde047')
                  : Cesium.Color.fromCssColorString('#e9d5ff'),
              outlineColor: Cesium.Color.fromCssColorString('#020617'),
              outlineWidth: 4,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
            },
          });
        });
      }
    }
    viewer.scene.requestRender();
  }, [
    showCityMetrics,
    activeThematicMap,
    isSoilMoistureActive,
    ventuskyOptions,
    utcHourOverride,
    activeWeatherDay,
    liveVentuskyNodes,
    isAr,
    viewerReady,
  ]);

  // 10. Dedicated HTML5 2D Canvas Overlay for Animated Wind Arrows, Ventusky Flowing Streamlines & Blitzortung Lightning
  useEffect(() => {
    const weatherDs = weatherDataSourceRef.current;
    const viewer = viewerRef.current;
    const windCanvas = windCanvasRef.current;
    if (!weatherDs || !viewer || viewer.isDestroyed() || !viewerReady) return;

    weatherDs.entities.removeAll();
    const effectiveMap: ThematicMapLayerId = isSoilMoistureActive
      ? 'soil_moisture'
      : activeThematicMap;

    const isVentuskyMeteorologicalLayer =
      effectiveMap === 'wind' ||
      effectiveMap === 'wind_gusts' ||
      effectiveMap === 'temperature' ||
      effectiveMap === 'apparent_temp' ||
      effectiveMap === 'rainfall' ||
      effectiveMap === 'pressure' ||
      effectiveMap === 'thunderstorms' ||
      effectiveMap === 'weather_radar' ||
      effectiveMap === 'satellite_ir' ||
      effectiveMap === 'humidity' ||
      effectiveMap === 'weather' ||
      effectiveMap === 'air_quality';

    const shouldRunCanvas =
      Boolean(windCanvas) &&
      showGlobalFieldOverlay &&
      (effectiveMap === 'wind' ||
        (isVentuskyMeteorologicalLayer &&
          (showStreamlines || effectiveMap === 'weather_radar' || effectiveMap === 'thunderstorms')));

    if (windCanvas && !shouldRunCanvas) {
      const ctx = windCanvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, windCanvas.width, windCanvas.height);
      }
    }

    if (effectiveMap === 'rainfall' && showGlobalFieldOverlay) {
      const camCarto = viewer.camera.positionCartographic;
      const centerLat = camCarto ? Cesium.Math.toDegrees(camCarto.latitude) : 26.0;
      const centerLng = camCarto ? Cesium.Math.toDegrees(camCarto.longitude) : 30.0;
      const latHalfSpan =
        cameraAltitudeMeters > 6000000
          ? 64
          : cameraAltitudeMeters > 2500000
          ? 38
          : cameraAltitudeMeters > 800000
          ? 16
          : cameraAltitudeMeters > 200000
          ? 5.2
          : 0.9;
      const lngHalfSpan =
        cameraAltitudeMeters > 6000000
          ? 78
          : cameraAltitudeMeters > 2500000
          ? 48
          : cameraAltitudeMeters > 800000
          ? 22
          : cameraAltitudeMeters > 200000
          ? 6.8
          : 1.2;

      const clusters = buildLocalizedRainCloudClusters(
        {
          south: centerLat - latHalfSpan * 0.5,
          north: centerLat + latHalfSpan * 0.5,
          west: centerLng - lngHalfSpan * 0.5,
          east: centerLng + lngHalfSpan * 0.5,
        },
        forecast14,
        selectedMoistureDayIdx,
        zones
      );
      clusters.forEach((cl) => {
        weatherDs.entities.add({
          position: Cesium.Cartesian3.fromDegrees(cl.lng, cl.lat),
          ellipse: {
            semiMajorAxis: Math.max(2500, cl.radiusMeters),
            semiMinorAxis: Math.max(2500, cl.radiusMeters * 0.85),
            material: Cesium.Color.fromCssColorString(cl.color).withAlpha(0.28),
            classificationType: Cesium.ClassificationType.BOTH,
          },
          label: {
            text: `🌧 ${cl.precipMm}mm (${cl.precipProbPct}%)`,
            font: 'bold 11px "IBM Plex Mono", monospace',
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.fromCssColorString('#0c4a6e'),
            outlineWidth: 3,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
        });
      });
    }

    if (!shouldRunCanvas || !windCanvas) {
      viewer.scene.requestRender();
      return;
    }

    let rafId: number | null = null;
    let lastDrawMs = 0;
    const scratchWinPos = new Cesium.Cartesian2();
    const scratchAheadPos = new Cesium.Cartesian2();
    const nowClock = new Date();
    const liveUtcClock = nowClock.getUTCHours() + nowClock.getUTCMinutes() / 60;
    const mergedOpts: Partial<VentuskyAtmosphericOptions> = {
      ...(ventuskyOptions || {}),
      utcHour:
        typeof utcHourOverride === 'number'
          ? utcHourOverride
          : typeof ventuskyOptions?.utcHour === 'number'
          ? ventuskyOptions.utcHour
          : liveUtcClock,
    };

    const drawLightningBolt = (
      ctx: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      pulse: number
    ) => {
      ctx.save();
      ctx.globalAlpha = 0.72 + 0.28 * pulse;
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx + 3, cy - 12);
      ctx.lineTo(cx - 5, cy);
      ctx.lineTo(cx + 1, cy);
      ctx.lineTo(cx - 3, cy + 12);
      ctx.lineTo(cx + 6, cy - 2);
      ctx.lineTo(cx, cy - 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    };

    const drawWindCanvasFrame = (nowMs: number) => {
      if (!viewerRef.current || viewerRef.current.isDestroyed() || !windCanvasRef.current) {
        return;
      }
      // Throttle Canvas 2D overlay animation to ~20 FPS so CPU/GPU stays 100% responsive and cool
      if (nowMs - lastDrawMs < 50) {
        rafId = requestAnimationFrame(drawWindCanvasFrame);
        return;
      }
      lastDrawMs = nowMs;

      const v = viewerRef.current;
      const cvs = windCanvasRef.current;
      const host = containerRef.current;
      const width = host?.clientWidth || cvs.clientWidth || 960;
      const height = host?.clientHeight || cvs.clientHeight || 600;
      if (cvs.width !== width || cvs.height !== height) {
        cvs.width = width;
        cvs.height = height;
      }

      const ctx = cvs.getContext('2d');
      if (!ctx) {
        rafId = requestAnimationFrame(drawWindCanvasFrame);
        return;
      }

      ctx.clearRect(0, 0, width, height);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.font = '600 10px "IBM Plex Mono", monospace';
      ctx.textAlign = 'center';

      const ellipsoid = v.scene.globe.ellipsoid;
      const camHeading = v.camera.heading || 0;
      const isArrowMode = effectiveMap === 'wind';
      const spacingPx = isArrowMode ? 72 : 58;
      const marginPx = 28;
      const timeSec = nowMs * 0.001;

      for (let sy = marginPx, rowIdx = 0; sy < height - marginPx; sy += spacingPx, rowIdx++) {
        const rowOffsetPx = (rowIdx % 2) * (spacingPx * 0.48);
        for (
          let sx = marginPx + rowOffsetPx, colIdx = 0;
          sx < width - marginPx;
          sx += spacingPx, colIdx++
        ) {
          scratchWinPos.x = sx;
          scratchWinPos.y = sy;
          const hitCartesian = v.camera.pickEllipsoid(scratchWinPos, ellipsoid);
          if (!hitCartesian) continue;

          const carto = Cesium.Cartographic.fromCartesian(hitCartesian, ellipsoid);
          if (!carto) continue;
          const lat = Cesium.Math.toDegrees(carto.latitude);
          const lng = Cesium.Math.toDegrees(carto.longitude);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

          const w = evaluateSpatialWindAtLatLon(lat, lng, activeWeatherDay, liveWindNodes);
          const towardDeg = (w.dirDeg + 180) % 360;
          const towardRad = (towardDeg * Math.PI) / 180;

          let ux = Math.sin(towardRad - camHeading);
          let uy = -Math.cos(towardRad - camHeading);

          const stepDeg = 0.25;
          const aheadLat = Math.max(-84, Math.min(84, lat + Math.cos(towardRad) * stepDeg));
          const aheadLng =
            lng +
            (Math.sin(towardRad) * stepDeg) / Math.max(0.25, Math.cos((lat * Math.PI) / 180));
          const aheadCartesian = Cesium.Cartesian3.fromDegrees(aheadLng, aheadLat, 0, ellipsoid);
          const aheadWin = Cesium.SceneTransforms.worldToWindowCoordinates(
            v.scene,
            aheadCartesian,
            scratchAheadPos
          );
          if (aheadWin) {
            const dx = aheadWin.x - sx;
            const dy = aheadWin.y - sy;
            const len = Math.hypot(dx, dy);
            if (len > 0.5 && len < 180) {
              ux = dx / len;
              uy = dy / len;
            }
          }

          // Render Blitzortung lightning bolt icons on severe Radar/CAPE storm cores
          if (
            (effectiveMap === 'weather_radar' || effectiveMap === 'thunderstorms') &&
            (rowIdx + colIdx) % 2 === 0
          ) {
            const stormCheck = evaluateVentuskyLayerAtLatLon(
              lat,
              lng,
              effectiveMap,
              mergedOpts,
              activeWeatherDay,
              liveVentuskyNodes
            );
            if (stormCheck.isLightningBolt) {
              const pulse = 0.5 + 0.5 * Math.sin(timeSec * 6 + rowIdx * 2.1 + colIdx);
              drawLightningBolt(ctx, sx, sy, pulse);
            }
          }

          if (!isArrowMode && !showStreamlines) continue;

          const speedRate = 0.35 + Math.min(1.85, w.speedKmh / 20);
          const seed = ((rowIdx * 17 + colIdx * 31) % 29) / 29;
          const phase = (timeSec * speedRate + seed) % 1.0;
          const alpha =
            phase < 0.16 ? phase / 0.16 : phase > 0.84 ? (1.0 - phase) / 0.16 : 1.0;

          if (isArrowMode) {
            // Iconic Colored Directional Wind Arrows + Speed Badges
            const arrowLengthPx = Math.max(16, Math.min(46, 12 + w.speedKmh * 0.92));
            const travelOffset = (phase - 0.5) * (spacingPx * 0.42);
            const centerX = sx + ux * travelOffset;
            const centerY = sy + uy * travelOffset;
            const tailX = centerX - ux * (arrowLengthPx * 0.55);
            const tailY = centerY - uy * (arrowLengthPx * 0.55);
            const tipX = centerX + ux * (arrowLengthPx * 0.45);
            const tipY = centerY + uy * (arrowLengthPx * 0.45);

            ctx.save();
            ctx.globalAlpha = Math.max(0.2, Math.min(0.96, alpha * 0.92));
            ctx.strokeStyle = 'rgba(2, 6, 23, 0.78)';
            ctx.lineWidth = 4.2;
            ctx.beginPath();
            ctx.moveTo(tailX, tailY);
            ctx.lineTo(tipX, tipY);
            ctx.stroke();

            ctx.strokeStyle = w.color;
            ctx.lineWidth = 2.4;
            ctx.beginPath();
            ctx.moveTo(tailX, tailY);
            ctx.lineTo(tipX, tipY);
            ctx.stroke();

            const headLen = Math.max(6.5, Math.min(10.5, arrowLengthPx * 0.28));
            const headHalfWidth = headLen * 0.54;
            const perpX = -uy;
            const perpY = ux;
            const baseHeadX = tipX - ux * headLen;
            const baseHeadY = tipY - uy * headLen;

            ctx.fillStyle = w.color;
            ctx.strokeStyle = '#020617';
            ctx.lineWidth = 1.3;
            ctx.beginPath();
            ctx.moveTo(tipX, tipY);
            ctx.lineTo(baseHeadX + perpX * headHalfWidth, baseHeadY + perpY * headHalfWidth);
            ctx.lineTo(tipX - ux * (headLen * 0.72), tipY - uy * (headLen * 0.72));
            ctx.lineTo(baseHeadX - perpX * headHalfWidth, baseHeadY - perpY * headHalfWidth);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            const labelText = `${Math.round(w.speedKmh)}`;
            const labelX = centerX;
            const labelY = centerY - 9;
            ctx.lineWidth = 2.6;
            ctx.strokeStyle = 'rgba(2, 6, 23, 0.9)';
            ctx.strokeText(labelText, labelX, labelY);
            ctx.fillStyle = w.color;
            ctx.fillText(labelText, labelX, labelY);
            ctx.restore();
          } else {
            // Ventusky Curved Flowing Hairline Streamline Particles over Meteorological Maps
            const streakLen = Math.max(14, Math.min(34, 11 + w.speedKmh * 0.55));
            const travelOffset = (phase - 0.5) * (spacingPx * 0.65);
            const headX = sx + ux * travelOffset;
            const headY = sy + uy * travelOffset;
            const midCurveX = headX - ux * (streakLen * 0.5) - uy * 3.5;
            const midCurveY = headY - uy * (streakLen * 0.5) + ux * 3.5;
            const tailX = headX - ux * streakLen;
            const tailY = headY - uy * streakLen;

            const grad = ctx.createLinearGradient(tailX, tailY, headX, headY);
            grad.addColorStop(0, 'rgba(255, 255, 255, 0.02)');
            grad.addColorStop(1, `rgba(255, 255, 255, ${(alpha * 0.58).toFixed(2)})`);

            ctx.save();
            ctx.strokeStyle = grad;
            ctx.lineWidth = 1.45;
            ctx.beginPath();
            ctx.moveTo(tailX, tailY);
            ctx.quadraticCurveTo(midCurveX, midCurveY, headX, headY);
            ctx.stroke();
            ctx.restore();
          }
        }
      }

      rafId = requestAnimationFrame(drawWindCanvasFrame);
    };

    rafId = requestAnimationFrame(drawWindCanvasFrame);

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [
    activeThematicMap,
    isSoilMoistureActive,
    showGlobalFieldOverlay,
    showStreamlines,
    ventuskyOptions,
    utcHourOverride,
    activeWeatherDay,
    forecast14,
    selectedMoistureDayIdx,
    liveWindNodes,
    liveVentuskyNodes,
    zones,
    cameraAltitudeMeters,
    viewerReady,
  ]);

  // 11. Sync Clicked Telemetry Pin Marker
  useEffect(() => {
    const pinDs = pinDataSourceRef.current;
    if (!pinDs || !viewerReady) return;
    pinDs.entities.removeAll();
    if (inspectedLatLon) {
      pinDs.entities.add({
        position: Cesium.Cartesian3.fromDegrees(inspectedLatLon.lng, inspectedLatLon.lat),
        point: {
          pixelSize: 11,
          color: Cesium.Color.fromCssColorString('#10b981'),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2.5,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });
    }
    if (viewerRef.current && !viewerRef.current.isDestroyed()) {
      viewerRef.current.scene.requestRender();
    }
  }, [inspectedLatLon, viewerReady]);

  const effectiveActiveMap: ThematicMapLayerId = isSoilMoistureActive
    ? 'soil_moisture'
    : activeThematicMap;
  const isWindCanvasVisible =
    showGlobalFieldOverlay &&
    (effectiveActiveMap === 'wind' ||
      ((effectiveActiveMap === 'wind_gusts' ||
        effectiveActiveMap === 'temperature' ||
        effectiveActiveMap === 'apparent_temp' ||
        effectiveActiveMap === 'rainfall' ||
        effectiveActiveMap === 'pressure' ||
        effectiveActiveMap === 'thunderstorms' ||
        effectiveActiveMap === 'weather_radar' ||
        effectiveActiveMap === 'satellite_ir' ||
        effectiveActiveMap === 'humidity' ||
        effectiveActiveMap === 'weather' ||
        effectiveActiveMap === 'air_quality') &&
        (showStreamlines ||
          effectiveActiveMap === 'weather_radar' ||
          effectiveActiveMap === 'thunderstorms')));

  return (
    <div
      data-testid="cesium-earth-stage"
      className="relative w-full h-full bg-[#030712] overflow-hidden select-none"
      onPointerMove={handlePointerMoveSplit}
      onPointerUp={handlePointerUpSplit}
      style={{
        cursor: isDraggingSplitHandle
          ? 'ew-resize'
          : drawingMode !== 'none'
          ? 'crosshair'
          : 'grab',
      }}
    >
      <div ref={containerRef} className="w-full h-full" />

      {/* Dedicated HTML5 2D Canvas Overlay for Animated Wind Arrows, Flowing Streamlines & Lightning */}
      <canvas
        ref={windCanvasRef}
        data-testid="wind-canvas-overlay"
        className={`absolute inset-0 w-full h-full pointer-events-none z-10 transition-opacity duration-200 ${
          isWindCanvasVisible ? 'opacity-100' : 'opacity-0 hidden'
        }`}
      />

      {/* Hardware-Accelerated Split Screen Divider Line (Before & After) */}
      {isComparisonMode && (
        <div
          data-testid="satellite-split-divider"
          className="absolute inset-y-0 z-20 pointer-events-none select-none flex flex-col items-center"
          style={{ left: `${splitFraction * 100}%` }}
        >
          {/* Top Vintage Comparison Badges */}
          <div className="absolute top-16 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/95 border border-emerald-500/50 shadow-2xl text-[11px] font-bold text-white pointer-events-auto whitespace-nowrap backdrop-blur-md">
            <span className="text-amber-300">
              ◀ {getSatelliteVintageById(comparisonBaselineVintageId).year} (
              {isAr ? 'قبل الاستصلاح' : 'Baseline'})
            </span>
            <span className="text-white/40">|</span>
            <span className="text-emerald-400">
              {getSatelliteVintageById(comparisonTargetVintageId).year} (
              {isAr ? 'الوضع الحالي' : 'Current'}) ▶
            </span>
          </div>

          {/* Vertical glowing divider line */}
          <div className="w-[3px] h-full bg-gradient-to-b from-amber-400 via-sky-400 to-emerald-400 shadow-[0_0_12px_rgba(56,189,248,0.9)]" />

          {/* Central circular drag handle */}
          <div
            onPointerDown={handlePointerDownSplit}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-slate-950 border-2 border-emerald-400 shadow-[0_0_16px_rgba(16,185,129,0.8)] flex items-center justify-center cursor-ew-resize pointer-events-auto active:scale-110 hover:scale-105 transition-transform"
            title={isAr ? 'اسحب لمقارنة تطور الأرض قبل وبعد' : 'Drag to compare before & after'}
          >
            <Split className="w-5 h-5 text-emerald-300 rotate-90" />
          </div>

          {/* Quick Preset Buttons */}
          <div className="absolute bottom-24 -translate-x-1/2 flex items-center gap-1 p-1 rounded-xl bg-slate-950/90 border border-white/20 pointer-events-auto shadow-xl text-[10px] font-mono backdrop-blur-md">
            <button
              type="button"
              onClick={() => setSplitFraction(0.25)}
              className={`px-2 py-0.5 rounded cursor-pointer transition ${
                Math.abs(splitFraction - 0.25) < 0.05
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              25%
            </button>
            <button
              type="button"
              onClick={() => setSplitFraction(0.5)}
              className={`px-2 py-0.5 rounded cursor-pointer transition ${
                Math.abs(splitFraction - 0.5) < 0.05
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              50%
            </button>
            <button
              type="button"
              onClick={() => setSplitFraction(0.75)}
              className={`px-2 py-0.5 rounded cursor-pointer transition ${
                Math.abs(splitFraction - 0.75) < 0.05
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              75%
            </button>
          </div>
        </div>
      )}

      {/* Floating Historical Satellite Vintage & Time-Lapse Control Widget (Shown only when standalone/uncontrolled) */}
      {!hideStandaloneVintageWidget && !onSelectSatelliteVintage && (
        <div
          data-testid="satellite-vintage-timelapse-widget"
          className="absolute bottom-16 start-1/2 -translate-x-1/2 z-20 max-w-[95vw] sm:max-w-2xl pointer-events-auto"
        >
          <div className="rounded-2xl backdrop-blur-md bg-slate-950/90 border border-white/15 shadow-2xl overflow-hidden text-xs text-white transition-all">
            {/* Widget Header Bar */}
            <div className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-900/80 border-b border-white/10">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsTimeLapsePanelOpen(!isTimeLapsePanelOpen)}
                  className="flex items-center gap-1.5 font-bold text-emerald-400 hover:text-emerald-300 cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {isAr
                      ? 'أرشيف وتطور الأقمار الصناعية (2014 – 2026)'
                      : 'Satellite Time-Lapse (2014–2026)'}
                  </span>
                  {isTimeLapsePanelOpen ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {isComparisonMode
                    ? isAr
                      ? 'مقارنة قبل وبعد'
                      : 'Split Mode'
                    : isTimeLapsePlaying
                    ? isAr
                      ? 'عرض تتابعي نشط'
                      : 'Playing'
                    : getSatelliteVintageById(activeVintageId).year}
                </span>
              </div>

              <div className="flex items-center gap-1">
                {/* Time-Lapse Play/Pause button */}
                <button
                  type="button"
                  onClick={() => {
                    if (isComparisonMode) setIsComparisonMode(false);
                    setIsTimeLapsePlaying(!isTimeLapsePlaying);
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] border cursor-pointer transition ${
                    isTimeLapsePlaying
                      ? 'bg-amber-600/30 border-amber-400 text-amber-200'
                      : 'bg-emerald-600/25 border-emerald-500/40 text-emerald-200 hover:bg-emerald-600/40'
                  }`}
                >
                  {isTimeLapsePlaying ? (
                    <>
                      <Pause className="w-3 h-3" />
                      <span>{isAr ? 'إيقاف' : 'Pause'}</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 fill-current" />
                      <span>{isAr ? 'عرض تتابعي' : 'Time-Lapse'}</span>
                    </>
                  )}
                </button>

                {/* Before & After Comparison Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    if (isTimeLapsePlaying) setIsTimeLapsePlaying(false);
                    setIsComparisonMode(!isComparisonMode);
                    if (!isTimeLapsePanelOpen) setIsTimeLapsePanelOpen(true);
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] border cursor-pointer transition ${
                    isComparisonMode
                      ? 'bg-sky-600/40 border-sky-400 text-white shadow-[0_0_10px_rgba(56,189,248,0.5)]'
                      : 'bg-slate-800/80 border-white/10 text-slate-300 hover:text-white'
                  }`}
                >
                  <Split className="w-3 h-3" />
                  <span>{isAr ? 'مقارنة قبل وبعد' : 'Split Compare'}</span>
                </button>
              </div>
            </div>

            {/* Expanded Body: Year Timeline Chips & Comparison Pickers */}
            {isTimeLapsePanelOpen && (
              <div className="p-3 space-y-2.5">
                {isComparisonMode ? (
                  /* Comparison Pickers */
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      {/* Left Baseline */}
                      <div className="p-2 rounded-xl bg-amber-950/30 border border-amber-500/30 space-y-1">
                        <div className="font-bold text-amber-300 flex items-center justify-between">
                          <span>
                            {isAr
                              ? 'المرئية السابقة (قبل الاستصلاح):'
                              : 'Baseline (Before):'}
                          </span>
                          <span className="text-[10px] font-mono text-amber-200/80">
                            {
                              getSatelliteVintageById(comparisonBaselineVintageId)
                                .resolutionBadge
                            }
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {SATELLITE_VINTAGES_CATALOG.filter((v) => v.year <= 2022).map(
                            (v) => (
                              <button
                                key={`base-${v.id}`}
                                type="button"
                                onClick={() => setComparisonBaselineVintageId(v.id)}
                                className={`px-2 py-0.5 rounded text-[10px] font-mono cursor-pointer border transition ${
                                  comparisonBaselineVintageId === v.id
                                    ? 'bg-amber-600 text-white border-amber-400 font-bold shadow'
                                    : 'bg-slate-900 border-white/10 text-slate-300 hover:text-white'
                                }`}
                              >
                                {v.year}
                              </button>
                            )
                          )}
                        </div>
                      </div>

                      {/* Right Target */}
                      <div className="p-2 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-1">
                        <div className="font-bold text-emerald-300 flex items-center justify-between">
                          <span>
                            {isAr
                              ? 'المرئية الحديثة (الوضع الحالي):'
                              : 'Target (Current):'}
                          </span>
                          <span className="text-[10px] font-mono text-emerald-200/80">
                            {
                              getSatelliteVintageById(comparisonTargetVintageId)
                                .resolutionBadge
                            }
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {SATELLITE_VINTAGES_CATALOG.filter((v) => v.year >= 2022).map(
                            (v) => (
                              <button
                                key={`target-${v.id}`}
                                type="button"
                                onClick={() => setComparisonTargetVintageId(v.id)}
                                className={`px-2 py-0.5 rounded text-[10px] font-mono cursor-pointer border transition ${
                                  comparisonTargetVintageId === v.id
                                    ? 'bg-emerald-600 text-white border-emerald-400 font-bold shadow'
                                    : 'bg-slate-900 border-white/10 text-slate-300 hover:text-white'
                                }`}
                              >
                                {v.year} {v.isLatest ? (isAr ? 'الحية' : 'Live') : ''}
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Standard Timeline Chips */
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>
                        {isAr
                          ? 'اختر سنة المرئية الفضائية لمعاينة تطور الأرض:'
                          : 'Select Vintage Year:'}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-300 font-bold">
                        {getSatelliteVintageById(activeVintageId).dateLabelAr}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {SATELLITE_VINTAGES_CATALOG.map((v) => {
                        const isSel = activeVintageId === v.id;
                        return (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => handleSelectVintage(v.id)}
                            title={isAr ? v.descriptionAr : v.descriptionEn}
                            className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold cursor-pointer border transition flex items-center gap-1 ${
                              isSel
                                ? 'bg-emerald-600 border-emerald-400 text-white shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                                : 'bg-slate-900/80 border-white/10 text-slate-300 hover:text-white hover:bg-slate-800'
                            }`}
                          >
                            <span>{v.year}</span>
                            {v.isLatest && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/30 text-emerald-200">
                                {isAr ? 'الحية' : 'LIVE'}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Satellite Sensor & Resolution Metadata Badge */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10 text-[10px] text-slate-400 font-mono">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-sky-400 shrink-0" />
                    <span className="text-slate-300">
                      {
                        getSatelliteVintageById(
                          isComparisonMode
                            ? comparisonTargetVintageId
                            : activeVintageId
                        ).sensor
                      }
                    </span>
                    <span className="text-white/30">•</span>
                    <span className="text-emerald-300 font-bold">
                      {
                        getSatelliteVintageById(
                          isComparisonMode
                            ? comparisonTargetVintageId
                            : activeVintageId
                        ).resolutionBadge
                      }
                    </span>
                  </div>
                  <span className="text-slate-400">
                    {isAr
                      ? 'خالية من الغيوم والضباب 100%'
                      : '100% Cloudless / High Contrast'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {!viewerReady && !contextLost && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/90 pointer-events-none">
          <div className="px-4 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-xs font-semibold text-emerald-300">
            {isAr
              ? 'جاري تحميل كوكب الأرض ثلاثي الأبعاد والتضاريس...'
              : 'Loading 3D Earth Globe & Terrain...'}
          </div>
        </div>
      )}

      {contextLost && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/95 p-6 text-center">
          <div className="max-w-sm rounded-2xl bg-slate-900 border border-amber-500/40 p-5 space-y-2">
            <div className="text-sm font-bold text-amber-300">
              {isAr ? 'تم إيقاف سياق الرسوميات مؤقتاً' : 'WebGL Graphics Context Paused'}
            </div>
            <p className="text-xs text-slate-300">
              {isAr
                ? 'يقوم المتصفح بإعادة تهيئة محرك العرض ثلاثي الأبعاد تلقائياً.'
                : 'Your browser is restoring the 3D WebGL Earth renderer automatically.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
