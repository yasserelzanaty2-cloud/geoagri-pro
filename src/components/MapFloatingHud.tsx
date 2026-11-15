import React, { useEffect, useRef, useState } from 'react';
import {
  Activity,
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Cloud,
  CloudLightning,
  CloudRain,
  Compass,
  Crosshair,
  Download,
  Droplets,
  Edit3,
  Eraser,
  Flame,
  Gauge,
  Globe,
  GripVertical,
  Layers,
  MapPin,
  Maximize2,
  Minus,
  Mountain,
  Navigation,
  Pause,
  Play,
  Plus,
  Radio,
  RotateCcw,
  Satellite,
  SkipBack,
  SkipForward,
  Sliders,
  Snowflake,
  Sparkles,
  Sprout,
  Square,
  Sun,
  Thermometer,
  Waves,
  Wind,
  X,
} from 'lucide-react';
import {
  AirPollutantSpecies,
  AreaBreakdown,
  BaseMapStyleId,
  CloudLayerFilter,
  DailyWeatherPoint,
  ElevationColorPalette,
  ElevationDisplayMode,
  ForecastModelId,
  GlobalTemperatureSubMode,
  Language,
  LatLon,
  MapDisplayProjectionMode,
  OpenMeteoSoilMoistureDepth,
  PrecipAccumWindow,
  PressureAltitudeLevel,
  SoilProfile,
  SoilTexture,
  SpatialGridCell,
  SpectralIndexKey,
  SubZoneSummary,
  ThematicMapLayerId,
  UserStudyZone,
  VentuskyAtmosphericOptions,
  WindAltitudeLevel,
} from '../types/agro';
import {
  BASE_MAP_STYLES,
  GlobalDayNightSolarReading,
  GlobalElevationPointReading,
  GlobalSnowAndBlizzardReading,
  GlobalTemperaturePointReading,
  SoilMoisturePointReading,
  THEMATIC_MAPS_META,
  evaluateDemDrainageAtLatLon,
  evaluateGlobalDayNightSolarAtLatLon,
  evaluateGlobalSnowAndBlizzardAtLatLon,
  evaluateSpatialSpectralOrSoilAtLatLon,
} from '../utils/thematicMapRenderer';
import {
  getSatelliteMissionCatalog,
  resolveActiveSatelliteSelectionMeta,
  SPECTRAL_SCIENTIFIC_SPECS,
  SatelliteMissionChoice,
  UnifiedActiveLayerSpec,
} from '../utils/unifiedLayerManager';
import {
  MultiZoneManagerBar,
  AuthUserSummary,
  PendingZoneDraft,
  ZoneDraftConfirmPayload,
} from './MultiZoneManagerBar';
import { RegionDrawingToolMode } from '../types/agro';
import {
  AuthoritativeSoilGridsReading,
  getAuthoritativeLayerSourceMeta,
} from '../services/authoritativeGisService';

export interface InspectedTelemetrySnapshot {
  lat: number;
  lng: number;
  elevation: GlobalElevationPointReading;
  temperature: GlobalTemperaturePointReading;
  soilMoisture: SoilMoisturePointReading;
  snowIce?: GlobalSnowAndBlizzardReading;
  dayNight?: GlobalDayNightSolarReading;
  windSpeedKmh: number;
  windCardinal: string;
  rainMm: number;
  rainProbPct: number;
  cloudCoverPct?: number;
  ndviEstimate: number;
  apparentTempC?: number;
  windGustKmh?: number;
  pressureHpa?: number;
  capeJkg?: number;
  radarDbz?: number;
  satelliteCloudPct?: number;
  humidityPct?: number;
  dewPointC?: number;
  pm25?: number;
  dust?: number;
  uvIndex?: number;
  aqi?: number;
  soilGrids?: AuthoritativeSoilGridsReading | null;
}

function resolveActiveLegendStop(
  unifiedSpec: UnifiedActiveLayerSpec,
  telemetry: InspectedTelemetrySnapshot,
  selectedCell: SpatialGridCell | null,
  activeWeatherDay: DailyWeatherPoint | undefined,
  farmAverages: Record<SpectralIndexKey, number>,
  isAr: boolean
): {
  stopIndex: number;
  stopColor: string;
  readingFormatted: string;
} {
  const stops = unifiedSpec.colorStops;
  if (stops.length === 0) {
    return { stopIndex: 0, stopColor: '#10b981', readingFormatted: '--' };
  }

  let idx = 0;
  let readingFormatted = '--';

  if (unifiedSpec.selectionType === 'thematic') {
    switch (unifiedSpec.activeThematicMap) {
      case 'natural': {
        const ndvi = telemetry.ndviEstimate;
        readingFormatted = isAr ? 'الوضع الافتراضي' : 'Default View';
        idx =
          telemetry.elevation.elevationMeters <= 0
            ? 0
            : ndvi < 0.16
            ? 1
            : ndvi < 0.45
            ? 2
            : 3;
        break;
      }
      case 'vegetation': {
        const val = selectedCell ? selectedCell.values.NDVI : telemetry.ndviEstimate;
        readingFormatted = `${val.toFixed(2)} NDVI`;
        idx = val < 0.125 ? 0 : val < 0.255 ? 1 : val < 0.425 ? 2 : val < 0.655 ? 3 : 4;
        break;
      }
      case 'wind': {
        const val = telemetry.windSpeedKmh;
        readingFormatted = `${val} km/h (${telemetry.windCardinal})`;
        idx = val < 12 ? 0 : val < 18 ? 1 : val < 24 ? 2 : val < 32 ? 3 : 4;
        break;
      }
      case 'weather': {
        const cloud = telemetry.cloudCoverPct ?? activeWeatherDay?.cloudCoverPct ?? 12;
        readingFormatted = isAr ? `${Math.round(cloud)}% غطاء سحابي` : `${Math.round(cloud)}% Cloud`;
        idx = cloud <= 18 ? 0 : cloud <= 38 ? 1 : cloud <= 60 ? 2 : cloud <= 82 ? 3 : 4;
        break;
      }
      case 'temperature': {
        const val = telemetry.temperature.activeValueC;
        readingFormatted = `${val}°C`;
        idx = val < 0 ? 0 : val < 15 ? 1 : val < 28 ? 2 : val < 40 ? 3 : 4;
        break;
      }
      case 'drought':
      case 'soil_moisture': {
        const val = telemetry.soilMoisture.activeVolumetricPct;
        readingFormatted = `${val}% SM`;
        idx = val < 10 ? 0 : val < 20 ? 1 : val < 30 ? 2 : val <= 42 ? 3 : 4;
        break;
      }
      case 'rainfall': {
        const mm = telemetry.rainMm;
        const rateApprox = mm > 0 ? Number((mm / 6).toFixed(2)) : 0;
        readingFormatted =
          mm <= 0.1
            ? isAr
              ? '0.0 مم (جاف/صافي)'
              : '0.0 mm (Dry)'
            : `${rateApprox} mm/hr · ${mm} mm`;
        const val = rateApprox > 0 ? rateApprox : mm;
        idx = val < 0.3 ? 0 : val < 1.5 ? 1 : val < 4.0 ? 2 : val <= 12.0 ? 3 : 4;
        break;
      }
      case 'elevation': {
        const h = telemetry.elevation.elevationMeters;
        readingFormatted = `${h} m ASL`;
        idx =
          h < 0
            ? 0
            : h < 50
            ? 1
            : h < 200
            ? 2
            : h < 500
            ? 3
            : h < 1000
            ? 4
            : h < 2000
            ? 5
            : h < 3500
            ? 6
            : 7;
        break;
      }
      case 'dem_drainage': {
        const dem = evaluateDemDrainageAtLatLon(
          telemetry.lat,
          telemetry.lng,
          0.0028,
          telemetry.elevation.elevationMeters
        );
        readingFormatted = isAr
          ? `${dem.elevationMeters}m · ${dem.flowArrow} ${dem.flowDirectionAr} (${dem.slopePct}%)`
          : `${dem.elevationMeters}m · ${dem.flowArrow} ${dem.flowDirectionEn} (${dem.slopePct}%)`;
        idx =
          dem.drainageClass === 'waterlogging_depression'
            ? 0
            : dem.drainageClass === 'drainage_channel'
            ? 1
            : dem.drainageClass === 'balanced_drainage'
            ? 2
            : 3;
        break;
      }
      case 'snow_ice': {
        const snow =
          telemetry.snowIce ??
          evaluateGlobalSnowAndBlizzardAtLatLon(
            telemetry.lat,
            telemetry.lng,
            activeWeatherDay,
            telemetry.elevation.elevationMeters
          );
        readingFormatted =
          snow.snowDepthCm > 0
            ? `${snow.snowDepthCm} cm · ${snow.criticalFrostTempC}°C (0°C @ ${snow.freezingLevelMeters}m)`
            : `${snow.criticalFrostTempC}°C · 0 cm (0°C @ ${snow.freezingLevelMeters}m)`;
        idx =
          snow.zoneClass === 'blizzard_storm' || snow.snowDepthCm > 28
            ? 4
            : snow.snowDepthCm > 8
            ? 3
            : snow.snowDepthCm >= 1
            ? 2
            : snow.criticalFrostTempC <= 3.5
            ? 1
            : 0;
        break;
      }
      case 'day_night': {
        const dn =
          telemetry.dayNight ??
          evaluateGlobalDayNightSolarAtLatLon(telemetry.lat, telemetry.lng);
        readingFormatted = `${dn.localTimeFormatted} · ${dn.solarRadiationWm2} W/m² (${
          isAr ? dn.periodLabelAr : dn.periodLabelEn
        })`;
        idx =
          dn.solarElevationDeg < -12
            ? 0
            : dn.solarElevationDeg < -1
            ? 1
            : dn.solarElevationDeg < 6
            ? 2
            : dn.solarElevationDeg < 35
            ? 3
            : 4;
        break;
      }
      case 'apparent_temp': {
        const val = telemetry.apparentTempC ?? telemetry.temperature.airTemp2mC;
        readingFormatted = `${val}°C`;
        idx = val < -10 ? 0 : val < 15 ? 1 : val < 26 ? 2 : val < 35 ? 3 : 4;
        break;
      }
      case 'wind_gusts': {
        const val = telemetry.windGustKmh ?? Math.round(telemetry.windSpeedKmh * 1.5);
        readingFormatted = `${val} km/h`;
        idx = val < 20 ? 0 : val < 40 ? 1 : val < 60 ? 2 : val < 85 ? 3 : 4;
        break;
      }
      case 'pressure': {
        const val = telemetry.pressureHpa ?? 1014;
        readingFormatted = `${val} hPa`;
        idx = val < 985 ? 0 : val < 1005 ? 1 : val < 1016 ? 2 : val < 1026 ? 3 : 4;
        break;
      }
      case 'thunderstorms': {
        const val = telemetry.capeJkg ?? 80;
        readingFormatted = `${val} J/kg`;
        idx = val < 200 ? 0 : val < 800 ? 1 : val < 1600 ? 2 : val < 2800 ? 3 : 4;
        break;
      }
      case 'weather_radar': {
        const val = telemetry.radarDbz ?? 0;
        readingFormatted = `${val} dBZ`;
        idx = val < 8 ? 0 : val < 22 ? 1 : val < 36 ? 2 : val < 48 ? 3 : 4;
        break;
      }
      case 'satellite_ir': {
        const val = telemetry.satelliteCloudPct ?? telemetry.cloudCoverPct ?? 20;
        readingFormatted = `${val}% IR`;
        idx = val < 18 ? 0 : val < 45 ? 1 : val < 75 ? 2 : 3;
        break;
      }
      case 'humidity': {
        const val = telemetry.humidityPct ?? 54;
        readingFormatted = `${val}% (${telemetry.dewPointC ?? 11}°C)`;
        idx = val < 30 ? 0 : val < 55 ? 1 : val < 75 ? 2 : val < 90 ? 3 : 4;
        break;
      }
      case 'air_quality': {
        const val = telemetry.pm25 ?? 18;
        readingFormatted = `${val}${unifiedSpec.unit} (AQI ${telemetry.aqi ?? 32})`;
        idx = val < 15 ? 0 : val < 35 ? 1 : val < 65 ? 2 : val < 120 ? 3 : 4;
        break;
      }
    }
  } else {
    const key = unifiedSpec.activeLayer;
    const spatialPointEval = evaluateSpatialSpectralOrSoilAtLatLon(
      telemetry.lat,
      telemetry.lng,
      key,
      activeWeatherDay,
      telemetry.elevation.elevationMeters
    );
    const val = selectedCell
      ? selectedCell.values[key]
      : Number.isFinite(spatialPointEval.numericValue)
      ? spatialPointEval.numericValue
      : farmAverages[key];
    readingFormatted = `${val}${unifiedSpec.unit}`;

    if (key === 'NDVI' || key === 'SAVI') {
      idx = val < 0.09 ? 0 : val < 0.25 ? 1 : val < 0.43 ? 2 : val < 0.6 ? 3 : 4;
    } else if (key === 'EVI') {
      idx = val < 0.08 ? 0 : val < 0.21 ? 1 : val < 0.39 ? 2 : val < 0.57 ? 3 : 4;
    } else if (key === 'NDWI') {
      idx = val <= -0.18 ? 0 : val <= 0.02 ? 1 : val <= 0.18 ? 2 : val <= 0.35 ? 3 : 4;
    } else if (key === 'NDMI') {
      idx = val <= -0.15 ? 0 : val <= 0.05 ? 1 : val <= 0.25 ? 2 : val <= 0.44 ? 3 : 4;
    } else if (key === 'LST') {
      idx = val <= 21.5 ? 0 : val <= 24.5 ? 1 : val <= 27.5 ? 2 : val <= 30.0 ? 3 : 4;
    } else if (key === 'SM_0_7') {
      idx = val < 7 ? 0 : val <= 17.5 ? 1 : val <= 25.5 ? 2 : val <= 33.5 ? 3 : 4;
    } else if (key === 'SM_7_28') {
      idx = val < 8 ? 0 : val <= 20.0 ? 1 : val <= 28.0 ? 2 : val <= 36.0 ? 3 : 4;
    } else if (key === 'SOIL_EC') {
      idx = val <= 1.8 ? 0 : val <= 2.8 ? 1 : val <= 4.2 ? 2 : val <= 6.0 ? 3 : 4;
    } else if (key === 'SOIL_PH') {
      idx = val < 6.5 ? 0 : val <= 7.4 ? 1 : val <= 7.9 ? 2 : val <= 8.3 ? 3 : 4;
    }
  }

  const clampedIdx = Math.max(0, Math.min(stops.length - 1, idx));
  return {
    stopIndex: clampedIdx,
    stopColor: stops[clampedIdx].color,
    readingFormatted,
  };
}

interface MapFloatingHudProps {
  language: Language;
  containerRef: React.RefObject<HTMLDivElement | null>;
  isSoilMoistureActive: boolean;
  activeThematicMap: ThematicMapLayerId;
  onSelectThematicMap: (id: ThematicMapLayerId) => void;
  soilMoistureDepthMode: OpenMeteoSoilMoistureDepth;
  onSelectSoilMoistureDepth: (depth: OpenMeteoSoilMoistureDepth) => void;
  activeLayer: SpectralIndexKey;
  onSelectSpectralLayer: (layer: SpectralIndexKey) => void;
  baseMapStyle: BaseMapStyleId;
  onChangeBaseMapStyle: (style: BaseMapStyleId) => void;
  elevationDisplayMode: ElevationDisplayMode;
  onChangeElevationDisplayMode: (mode: ElevationDisplayMode) => void;
  elevationPalette: ElevationColorPalette;
  onChangeElevationPalette: (palette: ElevationColorPalette) => void;
  terrainExaggeration: number;
  onChangeTerrainExaggeration: (val: number) => void;
  overlayOpacity: number;
  onChangeOverlayOpacity: (val: number) => void;
  showGlobalFieldOverlay: boolean;
  onToggleGlobalFieldOverlay: () => void;
  globalTempSubMode: GlobalTemperatureSubMode;
  onChangeGlobalTempSubMode: (mode: GlobalTemperatureSubMode) => void;
  projectionMode: MapDisplayProjectionMode;
  onChangeProjectionMode: (mode: MapDisplayProjectionMode) => void;
  viewMode3D: boolean;
  onToggleViewMode3D: () => void;
  pitchDeg: number;
  onChangePitchDeg: (deg: number) => void;
  rotationDeg: number;
  onChangeRotationDeg: (deg: number) => void;
  forecast14: DailyWeatherPoint[];
  selectedMoistureDayIdx: number;
  onChangeMoistureDayIdx: (idx: number) => void;
  unifiedSpec: UnifiedActiveLayerSpec;
  farmAverages: Record<SpectralIndexKey, number>;
  vertices: LatLon[];
  area: AreaBreakdown;
  soil: SoilProfile;
  subZones: SubZoneSummary[];
  zones: UserStudyZone[];
  activeZoneId: string | null;
  comparedZoneIds: string[];
  drawingMode: RegionDrawingToolMode;
  onStartDrawingMode: (mode: RegionDrawingToolMode) => void;
  onClearSelection: () => void;
  onSaveCurrentPolygonAsDraft: () => void;
  pendingDraft: PendingZoneDraft | null;
  onConfirmPendingDraft: (config: ZoneDraftConfirmPayload) => void;
  onCancelPendingDraft: () => void;
  currentUser?: AuthUserSummary | null;
  isAuthLoading?: boolean;
  onSignInAndConfirmPendingDraft?: (config: ZoneDraftConfirmPayload) => void;
  onSelectActiveZone?: (zoneId: string) => void;
  onToggleCompareZone?: (zoneId: string) => void;
  onRenameZone?: (zoneId: string, newNameAr: string, newCategoryAr: string) => void;
  onDeleteZone?: (zoneId: string) => void;
  onClearAllZones?: () => void;
  onUpdateZoneSoil?: (zoneId: string, nextSoil: SoilProfile) => void;
  onFlyToPresetRegion: (lat: number, lng: number, heightMeters: number, pitch?: number) => void;
  onFlyToActiveZone: () => void;
  onLocateGps: () => void;
  onZoomStep: (dir: 'in' | 'out' | 'world') => void;
  onOpenZoneInspector?: () => void;
  onOpenSoilSettings?: () => void;
  onOpenFieldPointsInspector?: () => void;
  onDownloadPdfReport?: () => void;
  onOpenFullScreenAtlas?: () => void;
  showSubZoneLabels: boolean;
  onToggleSubZoneLabels: () => void;
  showScientificTable: boolean;
  onToggleScientificTable: () => void;
  inspectedTelemetry: InspectedTelemetrySnapshot;
  selectedCell: SpatialGridCell | null;
  activeBottomPopover: 'none' | 'legend' | 'telemetry';
  onChangeBottomPopover: (next: 'none' | 'legend' | 'telemetry') => void;
  utcHourOverride?: number | null;
  onChangeUtcHourOverride?: (hour: number | null) => void;
  blendDayNightOverlay?: boolean;
  onToggleBlendDayNightOverlay?: () => void;
  ventuskyOptions?: VentuskyAtmosphericOptions;
  onChangeVentuskyOptions?: (patch: Partial<VentuskyAtmosphericOptions>) => void;
  showWhiteBorders?: boolean;
  onToggleWhiteBorders?: () => void;
  showStreamlines?: boolean;
  onToggleStreamlines?: () => void;
  showCityMetrics?: boolean;
  onToggleCityMetrics?: () => void;
  timelinePlaying?: boolean;
  onToggleTimelinePlaying?: () => void;
  gpsStatus: string | null;
  detectedCropId?: string;
  detectedCropConfidencePct?: number;
  topRightButtons?: React.ReactNode;
  topRightDrawers?: React.ReactNode;
  hasActiveTopRightDrawer?: boolean;
  onCloseTopRightDrawers?: () => void;
}

type DropdownSection = 'maps' | 'satellites' | 'zones' | 'view';

export const MapFloatingHud: React.FC<MapFloatingHudProps> = ({
  language,
  containerRef,
  isSoilMoistureActive,
  activeThematicMap,
  onSelectThematicMap,
  soilMoistureDepthMode,
  onSelectSoilMoistureDepth,
  activeLayer,
  onSelectSpectralLayer,
  baseMapStyle,
  onChangeBaseMapStyle,
  elevationDisplayMode,
  onChangeElevationDisplayMode,
  elevationPalette,
  onChangeElevationPalette,
  terrainExaggeration,
  onChangeTerrainExaggeration,
  overlayOpacity,
  onChangeOverlayOpacity,
  showGlobalFieldOverlay,
  onToggleGlobalFieldOverlay,
  projectionMode,
  onChangeProjectionMode,
  viewMode3D,
  onToggleViewMode3D,
  pitchDeg,
  onChangePitchDeg,
  rotationDeg,
  onChangeRotationDeg,
  forecast14,
  selectedMoistureDayIdx,
  onChangeMoistureDayIdx,
  unifiedSpec,
  farmAverages,
  vertices,
  area,
  zones,
  activeZoneId,
  comparedZoneIds,
  drawingMode,
  onStartDrawingMode,
  onClearSelection,
  onSaveCurrentPolygonAsDraft,
  pendingDraft,
  onConfirmPendingDraft,
  onCancelPendingDraft,
  currentUser,
  isAuthLoading,
  onSignInAndConfirmPendingDraft,
  onSelectActiveZone,
  onToggleCompareZone,
  onRenameZone,
  onDeleteZone,
  onClearAllZones,
  onUpdateZoneSoil,
  onFlyToPresetRegion,
  onFlyToActiveZone,
  onLocateGps,
  onZoomStep,
  onOpenZoneInspector,
  onOpenSoilSettings,
  onOpenFieldPointsInspector,
  onDownloadPdfReport,
  onOpenFullScreenAtlas,
  showSubZoneLabels,
  onToggleSubZoneLabels,
  showScientificTable,
  onToggleScientificTable,
  inspectedTelemetry,
  selectedCell,
  activeBottomPopover,
  onChangeBottomPopover,
  utcHourOverride,
  onChangeUtcHourOverride,
  blendDayNightOverlay,
  onToggleBlendDayNightOverlay,
  ventuskyOptions,
  onChangeVentuskyOptions,
  showWhiteBorders = true,
  onToggleWhiteBorders,
  showStreamlines = true,
  onToggleStreamlines,
  showCityMetrics = true,
  onToggleCityMetrics,
  timelinePlaying = false,
  onToggleTimelinePlaying,
  gpsStatus,
  detectedCropId,
  detectedCropConfidencePct,
  topRightButtons,
  topRightDrawers,
  hasActiveTopRightDrawer = false,
  onCloseTopRightDrawers,
}) => {
  const isAr = language === 'ar';
  const [menuOpen, setMenuOpen] = useState(false);
  const [satellitePickerOpen, setSatellitePickerOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<DropdownSection>('maps');
  const [isBottomTabsPopupOpen, setIsBottomTabsPopupOpen] = useState(false);
  const [showTimelineInDock, setShowTimelineInDock] = useState(true);
  const [isDesktopLg, setIsDesktopLg] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(min-width: 1024px)');
    const sync = () => setIsDesktopLg(mql.matches);
    sync();
    mql.addEventListener('change', sync);
    return () => mql.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (hasActiveTopRightDrawer) {
      setMenuOpen(false);
      setSatellitePickerOpen(false);
    }
  }, [hasActiveTopRightDrawer]);

  // Synchronized Real-Time Browser Clock (updates every 30s when in Live mode)
  const [liveNow, setLiveNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setLiveNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const tzOffsetHours = -liveNow.getTimezoneOffset() / 60;
  const liveUtcDecimal = liveNow.getUTCHours() + liveNow.getUTCMinutes() / 60;
  const isLiveTime = utcHourOverride === null || utcHourOverride === undefined;
  const effectiveUtcHour = isLiveTime ? liveUtcDecimal : ((utcHourOverride % 24) + 24) % 24;
  const effectiveLocalHour = (((effectiveUtcHour + tzOffsetHours) % 24) + 24) % 24;

  const formatHhMm = (hourDec: number) => {
    const totalMin = Math.round(((hourDec % 24) + 24) % 24 * 60) % (24 * 60);
    const hh = Math.floor(totalMin / 60);
    const mm = totalMin % 60;
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  };
  const displayLocalTimeStr = formatHhMm(effectiveLocalHour);
  const displayUtcTimeStr = formatHhMm(effectiveUtcHour);

  const localHourToUtc = (localH: number) => {
    const normUtc = (((localH - tzOffsetHours) % 24) + 24) % 24;
    return Number(normUtc.toFixed(2));
  };

  const formatScaleTick = (rangeLabel: string): string => {
    if (rangeLabel.includes('-12°') && rangeLabel.includes('Elev')) return '<-12°';
    if (rangeLabel.includes('-12°') && rangeLabel.includes('-1°')) return '-12°';
    if (rangeLabel.includes('-1°') && rangeLabel.includes('+6°')) return '🌅0°';
    if (rangeLabel.includes('+6°') && rangeLabel.includes('+35°')) return '+20°';
    if (rangeLabel.includes('+35°') && rangeLabel.includes('90°')) return '☀90°';
    const compact = rangeLabel
      .replace(/\(.*?\)/g, '')
      .trim()
      .split(' ')[0]
      .replace(/[–—]$/, '');
    if (compact === '<' || compact === '>') {
      const second = rangeLabel.replace(/\(.*?\)/g, '').trim().split(' ')[1] || '';
      return `${compact}${second}`.slice(0, 5);
    }
    return compact.slice(0, 5);
  };

  // Draggable FAB coordinates relative to viewport container
  const [fabPos, setFabPos] = useState<{ x: number; y: number }>({ x: 14, y: 14 });
  const dragRef = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    moved: boolean;
  } | null>(null);

  // Draggable Bottom Dock & Popover coordinates so user can freely drag the bottom tabs launcher and popup anywhere over the map
  const [popoverOffset, setPopoverOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const popoverDragRef = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    moved: boolean;
  } | null>(null);

  useEffect(() => {
    if (activeBottomPopover !== 'none') {
      setIsBottomTabsPopupOpen(true);
    }
  }, [activeBottomPopover]);

  const handlePopoverHeaderPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Do not start drag if user clicked a button inside the header
    if ((e.target as HTMLElement).closest('button')) return;
    popoverDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: popoverOffset.x,
      origY: popoverOffset.y,
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePopoverHeaderPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = popoverDragRef.current;
    if (!drag) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (Math.hypot(dx, dy) > 4) drag.moved = true;
    const bounds = containerRef.current?.getBoundingClientRect();
    const halfW = bounds ? Math.max(140, bounds.width * 0.46) : window.innerWidth * 0.46;
    const maxUp = bounds ? Math.max(180, bounds.height - 90) : window.innerHeight - 90;
    setPopoverOffset({
      x: Math.max(-halfW, Math.min(halfW, drag.origX + dx)),
      y: Math.min(12, Math.max(-maxUp, drag.origY + dy)),
    });
  };

  const handlePopoverHeaderPointerUp = () => {
    popoverDragRef.current = null;
  };

  const handleBottomTriggerPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    popoverDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: popoverOffset.x,
      origY: popoverOffset.y,
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleBottomTriggerPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const drag = popoverDragRef.current;
    if (!drag) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (Math.hypot(dx, dy) > 5) drag.moved = true;
    const bounds = containerRef.current?.getBoundingClientRect();
    const halfW = bounds ? Math.max(140, bounds.width * 0.46) : window.innerWidth * 0.46;
    const maxUp = bounds ? Math.max(180, bounds.height - 90) : window.innerHeight - 90;
    setPopoverOffset({
      x: Math.max(-halfW, Math.min(halfW, drag.origX + dx)),
      y: Math.min(12, Math.max(-maxUp, drag.origY + dy)),
    });
  };

  const handleBottomTriggerPointerUp = () => {
    const drag = popoverDragRef.current;
    popoverDragRef.current = null;
    if (drag && !drag.moved) {
      setIsBottomTabsPopupOpen((prev) => !prev);
    }
  };

  const handleFabPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDesktopLg) return;
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: fabPos.x,
      origY: fabPos.y,
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleFabPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDesktopLg) return;
    const drag = dragRef.current;
    if (!drag) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (Math.hypot(dx, dy) > 5) drag.moved = true;

    const bounds = containerRef.current?.getBoundingClientRect();
    const maxW = bounds ? Math.max(120, bounds.width - 175) : window.innerWidth - 175;
    const maxH = bounds ? Math.max(120, bounds.height - 68) : window.innerHeight - 160;
    setFabPos({
      x: Math.max(10, Math.min(maxW, drag.origX + dx)),
      y: Math.max(10, Math.min(maxH, drag.origY + dy)),
    });
  };

  const handleFabPointerUp = () => {
    if (!isDesktopLg) {
      setMenuOpen((prev) => {
        const next = !prev;
        if (next) {
          setSatellitePickerOpen(false);
          onCloseTopRightDrawers?.();
        }
        return next;
      });
      return;
    }
    const drag = dragRef.current;
    dragRef.current = null;
    if (drag && !drag.moved) {
      setMenuOpen((prev) => {
        const next = !prev;
        if (next) {
          setSatellitePickerOpen(false);
          onCloseTopRightDrawers?.();
        }
        return next;
      });
    }
  };

  // Determine smart placement for vertical dropdown beside/below the draggable FAB
  const [dropdownSide, setDropdownSide] = useState<'right' | 'left'>('right');
  const [dropdownVert, setDropdownVert] = useState<'down' | 'up'>('down');

  useEffect(() => {
    const bounds = containerRef.current?.getBoundingClientRect();
    const w = bounds?.width || window.innerWidth;
    const h = bounds?.height || window.innerHeight;
    setDropdownSide(fabPos.x > w * 0.52 ? 'left' : 'right');
    setDropdownVert(fabPos.y > h * 0.56 ? 'up' : 'down');
  }, [fabPos, menuOpen, containerRef]);

  const ventuskyMapButtons: Array<{
    id: ThematicMapLayerId;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'temperature', icon: Thermometer },
    { id: 'apparent_temp', icon: Thermometer },
    { id: 'rainfall', icon: CloudRain },
    { id: 'wind', icon: Wind },
    { id: 'wind_gusts', icon: Wind },
    { id: 'pressure', icon: Gauge },
    { id: 'thunderstorms', icon: CloudLightning },
    { id: 'weather_radar', icon: Radio },
    { id: 'satellite_ir', icon: Satellite },
    { id: 'humidity', icon: Droplets },
    { id: 'weather', icon: Cloud },
    { id: 'air_quality', icon: Activity },
  ];

  const agriMapButtons: Array<{
    id: ThematicMapLayerId;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'vegetation', icon: Sprout },
    { id: 'soil_moisture', icon: Droplets },
    { id: 'drought', icon: Flame },
    { id: 'elevation', icon: Mountain },
    { id: 'dem_drainage', icon: Waves },
    { id: 'snow_ice', icon: Snowflake },
    { id: 'day_night', icon: Sun },
  ];

  const effectiveMapId: ThematicMapLayerId = isSoilMoistureActive
    ? 'soil_moisture'
    : activeThematicMap;

  const activeWeatherDay = forecast14[selectedMoistureDayIdx] || forecast14[0];
  const authoritativeSourceMeta = getAuthoritativeLayerSourceMeta(effectiveMapId, activeLayer);
  const activeBaseStyleMeta = BASE_MAP_STYLES[baseMapStyle] || BASE_MAP_STYLES.hybrid;
  const activeSatelliteMeta = resolveActiveSatelliteSelectionMeta(
    effectiveMapId,
    activeLayer,
    activeBaseStyleMeta.labelAr.split('(')[0].trim(),
    activeBaseStyleMeta.labelEn.split('(')[0].trim()
  );
  const satelliteCatalogGroups = getSatelliteMissionCatalog();

  const handleChooseSatelliteMission = (choice: SatelliteMissionChoice) => {
    if (choice.actionType === 'spectral' && choice.spectralIndexKey) {
      onSelectSpectralLayer(choice.spectralIndexKey);
    } else if (choice.thematicMapId) {
      onSelectThematicMap(choice.thematicMapId);
    }
    setSatellitePickerOpen(false);
  };

  const matchedLegendStop = resolveActiveLegendStop(
    unifiedSpec,
    inspectedTelemetry,
    selectedCell,
    activeWeatherDay,
    farmAverages,
    isAr
  );

  const launcherButtons = (
    <div className="pointer-events-auto flex flex-row items-center gap-1.5 min-w-0">
      {/* Unified Single Compact Floating Top-Left Tab (Merges Map Controls + Satellite Mission Picker) */}
      <button
        type="button"
        data-testid="draggable-floating-launcher-btn"
        onPointerDown={handleFabPointerDown}
        onPointerMove={handleFabPointerMove}
        onPointerUp={handleFabPointerUp}
        onClick={() => {
          if (!isDesktopLg) return;
        }}
        title={
          isDesktopLg
            ? isAr
              ? 'اسحب للتحريك · اضغط لفتح الخرائط والأقمار الصناعية وأدوات الرسم'
              : 'Drag to move · Click for Maps, Satellites & Drawing Tools'
            : undefined
        }
        className={`min-h-[40px] sm:min-h-[42px] px-3 sm:px-3.5 rounded-2xl border backdrop-blur-md shadow-2xl flex items-center gap-2 text-[11px] sm:text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
          isDesktopLg ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
        } ${
          menuOpen || satellitePickerOpen
            ? 'bg-emerald-600 text-white border-emerald-300/70'
            : 'bg-slate-950/92 text-white border-emerald-400/45 hover:bg-slate-900'
        }`}
      >
        {isDesktopLg && <GripVertical className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
        <Layers className="w-4 h-4 text-emerald-300 shrink-0" />
        <span>{isAr ? 'الخرائط والأقمار والأدوات' : 'Maps, Satellites & Tools'}</span>
        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-sky-300 shrink-0">
          {activeSatelliteMeta.isDefaultNatural
            ? 'RGB'
            : activeSatelliteMeta.resolutionBadge}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-150 shrink-0 ${
            menuOpen || satellitePickerOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
    </div>
  );

  const satellitePickerContentNode = (
    <div data-testid="satellite-picker-popover" className="space-y-2.5">
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
        <div className="min-w-0">
          <div className="text-xs font-bold text-white flex items-center gap-1.5">
            <Satellite className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="truncate">
              {isAr
                ? 'اختيار القمر الصناعي ونوع البيانات'
                : 'Select Satellite Mission & Data'}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 truncate mt-0.5">
            {isAr
              ? 'اختر القمر الصناعي ومصدر البيانات المناسب لتحليلك'
              : 'Pick any satellite sensor or base imagery below'}
          </div>
        </div>
        {!activeSatelliteMeta.isDefaultNatural && (
          <button
            type="button"
            data-testid="sat-reset-default-btn"
            onClick={() => {
              onSelectThematicMap('natural');
              setSatellitePickerOpen(false);
            }}
            className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-emerald-600/30 border border-emerald-400/40 text-[10px] font-bold text-emerald-300 cursor-pointer whitespace-nowrap shrink-0"
          >
            {isAr ? 'الوضع الافتراضي' : 'Reset Default'}
          </button>
        )}
      </div>

      {/* Default Pure Earth / Natural Base Map Selector */}
      <div className="space-y-1.5">
        <button
          type="button"
          data-testid="sat-choice-natural"
          onClick={() => {
            onSelectThematicMap('natural');
            setSatellitePickerOpen(false);
          }}
          className={`w-full px-2.5 py-2 rounded-xl text-[11px] font-bold flex items-center justify-between gap-2 border transition-colors cursor-pointer ${
            activeSatelliteMeta.isDefaultNatural
              ? 'bg-emerald-600/25 border-emerald-400 text-emerald-200'
              : 'bg-slate-900/90 border-white/10 text-slate-200 hover:bg-slate-800'
          }`}
        >
          <span className="flex items-center gap-2 min-w-0">
            <Globe className="w-4 h-4 text-sky-400 shrink-0" />
            <span className="truncate">
              {isAr
                ? 'الوضع الافتراضي (صورة الأرض الطبيعية بدون طبقات)'
                : 'Default Mode (Pure Earth Satellite — No Overlay)'}
            </span>
          </span>
          {activeSatelliteMeta.isDefaultNatural && (
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/25 text-emerald-200 shrink-0">
              {isAr ? 'نشط' : 'ACTIVE'}
            </span>
          )}
        </button>

        {/* Quick Base Imagery Switcher */}
        <div className="flex flex-wrap items-center gap-1">
          {Object.values(BASE_MAP_STYLES).map((st) => (
            <button
              key={st.id}
              type="button"
              data-testid={`sat-basemap-${st.id}`}
              onClick={() => onChangeBaseMapStyle(st.id)}
              className={`px-2 py-1 rounded-lg text-[10px] font-semibold border cursor-pointer transition-colors ${
                baseMapStyle === st.id
                  ? 'bg-sky-600/30 border-sky-400 text-sky-200'
                  : 'bg-slate-900/80 border-white/10 text-slate-300 hover:text-white'
              }`}
            >
              {isAr ? st.labelAr.split('(')[0].trim() : st.labelEn.split('(')[0].trim()}
            </button>
          ))}
        </div>
      </div>

      {/* Organized Satellite Missions Catalog */}
      {satelliteCatalogGroups.map((group) => (
        <div key={group.id} className="space-y-1.5 pt-2 border-t border-white/10">
          <div className="text-[10px] font-bold text-slate-300">
            {isAr ? group.titleAr : group.titleEn}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {group.choices.map((ch) => {
              const isActive =
                !activeSatelliteMeta.isDefaultNatural &&
                activeSatelliteMeta.activeChoiceId === ch.id;
              return (
                <button
                  key={ch.id}
                  type="button"
                  data-testid={`sat-choice-${ch.id}`}
                  onClick={() => handleChooseSatelliteMission(ch)}
                  className={`px-2.5 py-2 rounded-xl border text-start transition-colors cursor-pointer flex flex-col gap-0.5 ${
                    isActive
                      ? 'bg-emerald-600/25 border-emerald-400 text-white'
                      : 'bg-slate-900/85 border-white/10 text-slate-200 hover:bg-slate-800 hover:border-white/25'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5 w-full">
                    <span className="text-[10px] font-mono font-bold text-sky-300 truncate">
                      {isAr ? ch.satelliteAr : ch.satelliteEn}
                    </span>
                    <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-black/40 text-slate-300 shrink-0">
                      {ch.resolutionBadge}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold leading-snug truncate">
                    {isAr ? ch.dataNameAr : ch.dataNameEn}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  const satellitePickerPopoverNode = null;

  const verticalDropdownNode =
    menuOpen || satellitePickerOpen ? (
      <div
        data-testid="floating-vertical-dropdown"
        className={`${
          isDesktopLg
            ? `absolute w-[380px] ${
                dropdownSide === 'right' ? 'left-0 top-12' : 'right-0 top-12'
              }`
            : 'pointer-events-auto w-full max-w-[min(calc(100vw-20px),395px)] self-start'
        } max-h-[min(66dvh,550px)] overflow-y-auto [scrollbar-width:thin] [scrollbar-color:#334155_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full bg-slate-950/96 border border-white/15 rounded-2xl shadow-2xl p-3 text-slate-100 flex flex-col gap-2.5 z-50`}
      >
        {/* Dropdown Header */}
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
          <div className="min-w-0">
            <div className="text-xs font-bold text-white truncate">
              {isAr ? unifiedSpec.shortAr : unifiedSpec.shortEn}
            </div>
            <div className="text-[10px] font-mono text-emerald-400 truncate">
              {activeSatelliteMeta.isDefaultNatural
                ? isAr
                  ? 'الوضع الافتراضي (RGB)'
                  : 'Default RGB'
                : `${
                    isAr
                      ? activeSatelliteMeta.satelliteShortAr
                      : activeSatelliteMeta.satelliteShortEn
                  } (${activeSatelliteMeta.resolutionBadge})`}
              {vertices.length >= 3 ? ` · ${area.feddans} ${isAr ? 'فدان' : 'fed'}` : ''}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              setSatellitePickerOpen(false);
            }}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
            aria-label={isAr ? 'إغلاق القائمة' : 'Close menu'}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Unified 4-Section Switcher (Maps, Satellites, Zones, 3D View) */}
        <div className="grid grid-cols-4 gap-1 bg-slate-900/90 p-1 rounded-xl border border-white/10">
          {(
            [
              { id: 'maps', ar: 'الخرائط', en: 'Maps', testId: 'dropdown-section-maps' },
              {
                id: 'satellites',
                ar: 'الأقمار',
                en: 'Satellites',
                testId: 'satellite-mission-picker-btn',
              },
              { id: 'zones', ar: 'الزونات', en: 'Zones', testId: 'dropdown-section-zones' },
              { id: 'view', ar: 'العرض 3D', en: '3D View', testId: 'dropdown-section-view' },
            ] as const
          ).map((sec) => (
            <button
              key={sec.id}
              type="button"
              data-testid={sec.testId}
              onClick={() => {
                setActiveSection(sec.id);
                setSatellitePickerOpen(false);
              }}
              className={`py-1.5 px-1.5 rounded-lg text-[11px] font-bold transition-colors whitespace-nowrap cursor-pointer ${
                activeSection === sec.id
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              {isAr ? sec.ar : sec.en}
            </button>
          ))}
        </div>

        {/* SECTION 0: SATELLITE MISSIONS & BASE IMAGERY */}
        {activeSection === 'satellites' && satellitePickerContentNode}

        {/* SECTION 1: MAPS & SPECTRAL LAYERS */}
        {activeSection === 'maps' && (
                <div className="space-y-3">
                  <div>
                    <div className="text-[11px] font-semibold text-slate-400 mb-1.5">
                      {isAr ? 'الوضع الطبيعي وخرائط الطقس والغلاف الجوي' : 'Natural & Ventusky Atmospheric GIS'}
                    </div>

                    {/* Default Natural Mode Button */}
                    <button
                      type="button"
                      data-testid="thematic-map-tab-natural"
                      onClick={() => onSelectThematicMap('natural')}
                      className={`w-full mb-2 px-2.5 py-2 rounded-xl text-[11px] font-bold flex items-center justify-between gap-2 border transition-colors cursor-pointer ${
                        effectiveMapId === 'natural'
                          ? 'bg-emerald-600/25 border-emerald-400 text-emerald-200'
                          : 'bg-slate-900/90 border-white/10 text-slate-200 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <span className="flex items-center gap-1.5 min-w-0">
                        <Globe className="w-3.5 h-3.5 shrink-0 text-sky-400" />
                        <span className="truncate">
                          {isAr
                            ? 'الوضع الافتراضي (شكل الخريطة الطبيعي بدون ألوان)'
                            : 'Default (Natural Map — No Color Overlays)'}
                        </span>
                      </span>
                      {effectiveMapId === 'natural' && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 shrink-0">
                          {isAr ? 'نشط' : 'ACTIVE'}
                        </span>
                      )}
                    </button>

                    {/* Group A: Ventusky Atmospheric, Radar, Pressure & Air Quality Maps */}
                    <div className="grid grid-cols-2 gap-1.5 mb-2.5">
                      {ventuskyMapButtons.map(({ id, icon: Icon }) => {
                        const meta = THEMATIC_MAPS_META[id];
                        const active = effectiveMapId === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            data-testid={`thematic-map-tab-${id}`}
                            onClick={() => onSelectThematicMap(id)}
                            className={`px-2 py-1.5 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 border transition-colors cursor-pointer text-start ${
                              active
                                ? 'bg-sky-600/25 border-sky-400 text-sky-200'
                                : 'bg-slate-900/80 border-white/10 text-slate-300 hover:bg-slate-800 hover:text-white'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5 shrink-0 text-sky-400" />
                            <span className="truncate">
                              {isAr ? meta.shortAr : meta.shortEn}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Group B: Precision Agriculture, Soil Moisture, 3D Relief & Solar Terminator */}
                    <div className="text-[11px] font-semibold text-emerald-400/90 mb-1.5">
                      {isAr ? 'الخرائط الزراعية والتربة والأرض (Agri GIS)' : 'Precision Agriculture, Soil & Earth'}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {agriMapButtons.map(({ id, icon: Icon }) => {
                        const meta = THEMATIC_MAPS_META[id];
                        const active =
                          effectiveMapId === id &&
                          (id !== 'vegetation' || activeLayer === 'NDVI');
                        return (
                          <button
                            key={id}
                            type="button"
                            data-testid={`thematic-map-tab-${id}`}
                            onClick={() => onSelectThematicMap(id)}
                            className={`px-2 py-1.5 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 border transition-colors cursor-pointer text-start ${
                              active
                                ? 'bg-emerald-600/25 border-emerald-400 text-emerald-200'
                                : 'bg-slate-900/80 border-white/10 text-slate-300 hover:bg-slate-800 hover:text-white'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                            <span className="truncate">
                              {isAr ? meta.shortAr : meta.shortEn}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Ventusky Sub-Controls Strictly Inside Sidebar Menu (Altitudes, Pollutants, Accumulation, Model, Overlays) */}
                  {onChangeVentuskyOptions && ventuskyOptions && (
                    <div
                      data-testid="ventusky-sidebar-subcontrols"
                      className="space-y-2 pt-2 border-t border-white/10"
                    >
                      {/* Pressure Level / Dew Point Selector (Temperature & Humidity) */}
                      {(effectiveMapId === 'temperature' ||
                        effectiveMapId === 'apparent_temp' ||
                        effectiveMapId === 'humidity') && (
                        <div className="space-y-1">
                          <div className="text-[10px] font-semibold text-sky-300">
                            {isAr ? 'مستوى الارتفاع والضغط الجوي:' : 'Altitude / Pressure Level:'}
                          </div>
                          <div className="grid grid-cols-3 gap-1">
                            {(
                              [
                                { id: '2m', ar: '2م سطح الأرض', en: '2m Surface' },
                                { id: '900hPa', ar: '900 hPa', en: '900 hPa' },
                                { id: '850hPa', ar: '850 hPa', en: '850 hPa' },
                                { id: '700hPa', ar: '700 hPa', en: '700 hPa' },
                                { id: 'dew_point', ar: 'نقطة الندى', en: 'Dew Point' },
                              ] as Array<{ id: PressureAltitudeLevel; ar: string; en: string }>
                            ).map((lvl) => (
                              <button
                                key={lvl.id}
                                type="button"
                                data-testid={`ventusky-altitude-${lvl.id}`}
                                onClick={() => onChangeVentuskyOptions({ pressureAltitude: lvl.id })}
                                className={`py-1 px-1.5 rounded-lg text-[10px] font-mono font-bold border cursor-pointer truncate ${
                                  ventuskyOptions.pressureAltitude === lvl.id
                                    ? 'bg-sky-600 border-sky-400 text-white'
                                    : 'bg-slate-900 border-white/10 text-slate-300 hover:text-white'
                                }`}
                              >
                                {isAr ? lvl.ar : lvl.en}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Air Pollutant Species Selector (PM2.5, PM10, NO2, SO2, O3, Dust, CO, AQI, UV) */}
                      {effectiveMapId === 'air_quality' && (
                        <div className="space-y-1">
                          <div className="text-[10px] font-semibold text-amber-300">
                            {isAr ? 'نوع الملوثات أو الغبار (SILAM/CAMS):' : 'Pollutant / Aerosol Species:'}
                          </div>
                          <div className="grid grid-cols-3 gap-1">
                            {(
                              ['PM2.5', 'PM10', 'DUST', 'NO2', 'SO2', 'O3', 'CO', 'AQI', 'UV'] as AirPollutantSpecies[]
                            ).map((sp) => (
                              <button
                                key={sp}
                                type="button"
                                data-testid={`ventusky-pollutant-${sp}`}
                                onClick={() => onChangeVentuskyOptions({ airPollutant: sp })}
                                className={`py-1 px-1.5 rounded-lg text-[10px] font-mono font-bold border cursor-pointer ${
                                  ventuskyOptions.airPollutant === sp
                                    ? 'bg-amber-600 border-amber-400 text-white'
                                    : 'bg-slate-900 border-white/10 text-slate-300 hover:text-white'
                                }`}
                              >
                                {sp === 'DUST' ? (isAr ? 'غبار DUST' : 'DUST') : sp}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Precipitation Accumulation Window (1h / 3h / 24h) */}
                      {effectiveMapId === 'rainfall' && (
                        <div className="space-y-1">
                          <div className="text-[10px] font-semibold text-sky-300">
                            {isAr ? 'فترة التراكم المطري:' : 'Accumulation Window:'}
                          </div>
                          <div className="grid grid-cols-3 gap-1">
                            {(
                              [
                                { id: '1h', ar: 'ساعة 1', en: '1 hour' },
                                { id: '3h', ar: 'ساعات 3', en: '3 hours' },
                                { id: '24h', ar: '24 ساعة', en: '24 hours' },
                              ] as Array<{ id: PrecipAccumWindow; ar: string; en: string }>
                            ).map((win) => (
                              <button
                                key={win.id}
                                type="button"
                                onClick={() => onChangeVentuskyOptions({ precipAccumWindow: win.id })}
                                className={`py-1 px-1.5 rounded-lg text-[10px] font-bold border cursor-pointer ${
                                  ventuskyOptions.precipAccumWindow === win.id
                                    ? 'bg-sky-600 border-sky-400 text-white'
                                    : 'bg-slate-900 border-white/10 text-slate-300'
                                }`}
                              >
                                {isAr ? win.ar : win.en}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Wind Altitude Selector */}
                      {(effectiveMapId === 'wind' || effectiveMapId === 'wind_gusts') && (
                        <div className="space-y-1">
                          <div className="text-[10px] font-semibold text-emerald-300">
                            {isAr ? 'ارتفاع قياس الرياح:' : 'Wind Measurement Altitude:'}
                          </div>
                          <div className="grid grid-cols-5 gap-1">
                            {(['10m', '40m', '80m', '850hPa', '700hPa'] as WindAltitudeLevel[]).map((alt) => (
                              <button
                                key={alt}
                                type="button"
                                onClick={() => onChangeVentuskyOptions({ windAltitude: alt })}
                                className={`py-1 px-1 rounded-lg text-[10px] font-mono font-bold border cursor-pointer ${
                                  ventuskyOptions.windAltitude === alt
                                    ? 'bg-emerald-600 border-emerald-400 text-white'
                                    : 'bg-slate-900 border-white/10 text-slate-300'
                                }`}
                              >
                                {alt}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Cloud Filter */}
                      {(effectiveMapId === 'weather' || effectiveMapId === 'satellite_ir') && (
                        <div className="space-y-1">
                          <div className="text-[10px] font-semibold text-slate-300">
                            {isAr ? 'تصنيف السحب والضباب:' : 'Cloud Layer Filter:'}
                          </div>
                          <div className="grid grid-cols-3 gap-1">
                            {(
                              [
                                { id: 'total', ar: 'كلي', en: 'Total' },
                                { id: 'low_fog', ar: 'منخفضة وضباب', en: 'Low/Fog' },
                                { id: 'high', ar: 'عالية ركامية', en: 'High Clouds' },
                              ] as Array<{ id: CloudLayerFilter; ar: string; en: string }>
                            ).map((cf) => (
                              <button
                                key={cf.id}
                                type="button"
                                onClick={() => onChangeVentuskyOptions({ cloudFilter: cf.id })}
                                className={`py-1 px-1.5 rounded-lg text-[10px] font-bold border cursor-pointer ${
                                  ventuskyOptions.cloudFilter === cf.id
                                    ? 'bg-sky-600 border-sky-400 text-white'
                                    : 'bg-slate-900 border-white/10 text-slate-300'
                                }`}
                              >
                                {isAr ? cf.ar : cf.en}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Forecast Model & Map Overlays (White Borders / Streamlines / Cities) */}
                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1">
                            {isAr ? 'نموذج التوقعات' : 'Forecast Model'}
                          </label>
                          <select
                            aria-label={isAr ? 'نموذج التوقعات' : 'Forecast Model'}
                            value={ventuskyOptions.forecastModel}
                            onChange={(e) =>
                              onChangeVentuskyOptions({
                                forecastModel: e.target.value as ForecastModelId,
                              })
                            }
                            className="w-full h-8 px-2 rounded-lg bg-slate-900 border border-white/15 text-[11px] font-mono text-white cursor-pointer"
                          >
                            <option value="AUTO">{isAr ? 'تلقائي (ICON / Open-Meteo)' : 'AUTO (ICON)'}</option>
                            <option value="ICON">ICON (DWD 7km)</option>
                            <option value="GFS">GFS (NOAA 13km)</option>
                            <option value="ECMWF">ECMWF (IFS 9km)</option>
                            <option value="SILAM">SILAM / CAMS Air</option>
                          </select>
                        </div>

                        <div className="flex flex-col justify-end gap-1">
                          {onToggleWhiteBorders && (
                            <button
                              type="button"
                              data-testid="toggle-white-borders-btn"
                              onClick={onToggleWhiteBorders}
                              className={`h-8 px-2 rounded-lg text-[10px] font-bold border flex items-center justify-between cursor-pointer ${
                                showWhiteBorders
                                  ? 'bg-emerald-600/25 border-emerald-400 text-emerald-200'
                                  : 'bg-slate-900 border-white/10 text-slate-400'
                              }`}
                            >
                              <span className="truncate">{isAr ? 'حدود بيضاء' : 'White Borders'}</span>
                              <span className="font-mono">{showWhiteBorders ? 'ON' : 'OFF'}</span>
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5">
                        {onToggleStreamlines && (
                          <button
                            type="button"
                            data-testid="toggle-streamlines-btn"
                            onClick={onToggleStreamlines}
                            className={`h-7 px-2 rounded-lg text-[10px] font-bold border flex items-center justify-between cursor-pointer ${
                              showStreamlines
                                ? 'bg-sky-600/25 border-sky-400 text-sky-200'
                                : 'bg-slate-900 border-white/10 text-slate-400'
                            }`}
                          >
                            <span className="truncate">{isAr ? 'انسياب الرياح' : 'Streamlines'}</span>
                            <span className="font-mono">{showStreamlines ? 'ON' : 'OFF'}</span>
                          </button>
                        )}
                        {onToggleCityMetrics && (
                          <button
                            type="button"
                            data-testid="toggle-city-metrics-btn"
                            onClick={onToggleCityMetrics}
                            className={`h-7 px-2 rounded-lg text-[10px] font-bold border flex items-center justify-between cursor-pointer ${
                              showCityMetrics
                                ? 'bg-sky-600/25 border-sky-400 text-sky-200'
                                : 'bg-slate-900 border-white/10 text-slate-400'
                            }`}
                          >
                            <span className="truncate">{isAr ? 'قراءات المدن' : 'City Values'}</span>
                            <span className="font-mono">{showCityMetrics ? 'ON' : 'OFF'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Elevation Controls: Natural Satellite + Smooth Elevation Gradient */}
                  {effectiveMapId === 'elevation' && (
                    <div className="space-y-2 pt-2 border-t border-white/10">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-300 font-semibold">
                          {isAr ? 'نمط دمج الارتفاعات 3D' : '3D Elevation Blend'}
                        </span>
                        <button
                          type="button"
                          onClick={onToggleGlobalFieldOverlay}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer ${
                            showGlobalFieldOverlay
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {showGlobalFieldOverlay
                            ? isAr
                              ? 'مفعل'
                              : 'ON'
                            : isAr
                            ? 'مخفي'
                            : 'OFF'}
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-1">
                        {(
                          [
                            { id: '3d_color_only', ar: 'قمر + تدرج', en: 'Sat + Ramp' },
                            { id: '3d_contours', ar: 'تدرج + كنتور', en: 'Ramp + Lines' },
                            { id: 'contours_only', ar: 'كنتور فقط', en: 'Lines Only' },
                          ] as const
                        ).map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => onChangeElevationDisplayMode(opt.id)}
                            className={`py-1.5 px-1.5 rounded-lg text-[10px] font-bold border cursor-pointer whitespace-nowrap ${
                              elevationDisplayMode === opt.id
                                ? 'bg-emerald-600 border-emerald-400 text-white'
                                : 'bg-slate-900 border-white/10 text-slate-300 hover:text-white'
                            }`}
                          >
                            {isAr ? opt.ar : opt.en}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => onChangeElevationPalette('scientific_hypsometric')}
                          className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border cursor-pointer ${
                            elevationPalette === 'scientific_hypsometric'
                              ? 'bg-amber-600/30 border-amber-400 text-amber-200'
                              : 'bg-slate-900 border-white/10 text-slate-300'
                          }`}
                        >
                          {isAr ? 'تدرج علمي طبيعي' : 'Scientific Relief'}
                        </button>
                        <button
                          type="button"
                          onClick={() => onChangeElevationPalette('classic_topographic')}
                          className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border cursor-pointer ${
                            elevationPalette === 'classic_topographic'
                              ? 'bg-amber-600/30 border-amber-400 text-amber-200'
                              : 'bg-slate-900 border-white/10 text-slate-300'
                          }`}
                        >
                          {isAr ? 'طوبوغرافي تقليدي' : 'Classic Topo'}
                        </button>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-300">
                          <span>{isAr ? 'بروز التضاريس 3D' : '3D Relief Height'}</span>
                          <span className="font-mono text-emerald-400">
                            {terrainExaggeration.toFixed(1)}x
                          </span>
                        </div>
                        <input
                          type="range"
                          min={1.0}
                          max={3.5}
                          step={0.1}
                          value={terrainExaggeration}
                          onChange={(e) => onChangeTerrainExaggeration(Number(e.target.value))}
                          className="w-full accent-emerald-500 cursor-pointer h-1.5"
                        />
                      </div>
                    </div>
                  )}

                  {/* DEM Water Drainage Flow & Low-Spot Depression Panel */}
                  {effectiveMapId === 'dem_drainage' && (() => {
                    const demInfo = evaluateDemDrainageAtLatLon(
                      inspectedTelemetry.lat,
                      inspectedTelemetry.lng,
                      0.0028,
                      inspectedTelemetry.elevation.elevationMeters
                    );
                    return (
                      <div
                        data-testid="dem-drainage-controls-panel"
                        className="pt-2 border-t border-white/10 space-y-2"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-cyan-300 flex items-center gap-1">
                            <Waves className="w-3.5 h-3.5 text-cyan-400" />
                            <span>
                              {isAr
                                ? 'تحليل صرف المياه والمنخفضات (DEM)'
                                : 'DEM Flow & Low-Spot Analysis'}
                            </span>
                          </span>
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-cyan-500/40 text-cyan-200">
                            {demInfo.flowArrow} {demInfo.flowAzimuthDeg}°
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                          <div className="bg-slate-900/90 border border-white/10 rounded-lg p-1.5">
                            <div className="text-slate-400">
                              {isAr ? 'الارتفاع' : 'Elev'}
                            </div>
                            <div className="font-mono font-bold text-white mt-0.5">
                              {demInfo.elevationMeters} m
                            </div>
                          </div>
                          <div className="bg-slate-900/90 border border-white/10 rounded-lg p-1.5">
                            <div className="text-slate-400">
                              {isAr ? 'اتجاه الصرف' : 'Drain Dir'}
                            </div>
                            <div className="font-bold text-cyan-300 mt-0.5 truncate">
                              {demInfo.flowArrow} {isAr ? demInfo.flowDirectionAr.replace('باتجاه ', '') : demInfo.flowDirectionEn}
                            </div>
                          </div>
                          <div className="bg-slate-900/90 border border-white/10 rounded-lg p-1.5">
                            <div className="text-slate-400">
                              {isAr ? 'تجمع المياه' : 'Pool Risk'}
                            </div>
                            <div
                              className={`font-mono font-bold mt-0.5 ${
                                demInfo.waterAccumulationRiskPct >= 68
                                  ? 'text-blue-400'
                                  : demInfo.waterAccumulationRiskPct >= 48
                                  ? 'text-cyan-300'
                                  : 'text-lime-300'
                              }`}
                            >
                              {demInfo.waterAccumulationRiskPct}% ({demInfo.slopePct}%)
                            </div>
                          </div>
                        </div>
                        <div className="text-[10px] text-slate-300 bg-slate-900/80 border border-white/10 rounded-lg px-2 py-1.5 leading-relaxed">
                          {isAr ? demInfo.drainageAdviceAr : demInfo.drainageAdviceEn}
                        </div>
                        {onOpenFieldPointsInspector && (
                          <button
                            type="button"
                            onClick={() => {
                              onOpenFieldPointsInspector();
                              setMenuOpen(false);
                            }}
                            className="w-full py-1.5 px-2.5 rounded-lg bg-cyan-600/25 hover:bg-cyan-600/40 border border-cyan-400/50 text-[11px] font-bold text-cyan-200 flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Waves className="w-3.5 h-3.5" />
                            <span>
                              {isAr
                                ? 'قائمة أدنى نقاط الحقل والمصارف (Virtual)'
                                : 'Open Field Low-Spot Matrix (Virtual)'}
                            </span>
                          </button>
                        )}
                      </div>
                    );
                  })()}

                  {/* Soil Moisture Depth Switcher */}
                  {effectiveMapId === 'soil_moisture' && (
                    <div className="pt-2 border-t border-white/10 space-y-1.5">
                      <div className="text-[11px] font-semibold text-sky-300">
                        {isAr ? 'عمق رطوبة التربة (Open-Meteo)' : 'Soil Moisture Depth'}
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectSoilMoistureDepth('soil_moisture_0cm')}
                          className={`py-1.5 px-2 rounded-lg text-[11px] font-mono font-bold border cursor-pointer ${
                            soilMoistureDepthMode === 'soil_moisture_0cm'
                              ? 'bg-sky-600 border-sky-400 text-white'
                              : 'bg-slate-900 border-white/10 text-slate-300'
                          }`}
                        >
                          0cm ({isAr ? 'سطحي' : 'Surface'})
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectSoilMoistureDepth('soil_moisture_7cm')}
                          className={`py-1.5 px-2 rounded-lg text-[11px] font-mono font-bold border cursor-pointer ${
                            soilMoistureDepthMode === 'soil_moisture_7cm'
                              ? 'bg-sky-600 border-sky-400 text-white'
                              : 'bg-slate-900 border-white/10 text-slate-300'
                          }`}
                        >
                          7cm ({isAr ? 'الجذور' : 'Root'})
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Snowfall, Freezing Level (0°C) & Blizzard Storm Tracking Controls */}
                  {effectiveMapId === 'snow_ice' && (
                    <div
                      data-testid="snow-blizzard-controls-panel"
                      className="pt-2 border-t border-white/10 space-y-2"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-sky-300 flex items-center gap-1">
                          <Snowflake className="w-3.5 h-3.5 text-sky-400" />
                          <span>
                            {isAr
                              ? 'تتبع الثلوج وخط التجمد (0°C) والعواصف'
                              : 'Snow, Freezing Level & Blizzard Tracker'}
                          </span>
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                        <div className="bg-slate-900/90 border border-sky-500/30 rounded-lg p-1.5">
                          <div className="text-slate-400">
                            {isAr ? 'تراكم الثلوج' : 'Snow Depth'}
                          </div>
                          <div className="font-mono font-bold text-white mt-0.5">
                            {inspectedTelemetry.snowIce?.snowDepthCm ?? 0} cm
                          </div>
                        </div>
                        <div className="bg-slate-900/90 border border-sky-500/30 rounded-lg p-1.5">
                          <div className="text-slate-400">
                            {isAr ? 'خط التجمد 0°C' : '0°C Level'}
                          </div>
                          <div className="font-mono font-bold text-sky-300 mt-0.5">
                            {inspectedTelemetry.snowIce?.freezingLevelMeters ?? 2150}m
                          </div>
                        </div>
                        <div className="bg-slate-900/90 border border-sky-500/30 rounded-lg p-1.5">
                          <div className="text-slate-400">
                            {isAr ? 'حرارة الصقيع' : 'Frost Temp'}
                          </div>
                          <div className="font-mono font-bold text-amber-300 mt-0.5">
                            {inspectedTelemetry.snowIce?.criticalFrostTempC ?? 6.5}°C
                          </div>
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-300 bg-slate-900/80 border border-white/10 rounded-lg px-2 py-1.5">
                        {isAr
                          ? `الحالة: ${inspectedTelemetry.snowIce?.statusAr || 'أرض دافئة خالية من الثلوج'} · حد الصقيع الحرج للمحصول: ${inspectedTelemetry.snowIce?.criticalFrostTempC ?? 2.0}°C`
                          : `Status: ${inspectedTelemetry.snowIce?.statusEn || 'Warm Snow-Free'} · Critical Crop Frost: ${inspectedTelemetry.snowIce?.criticalFrostTempC ?? 2.0}°C`}
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] text-slate-400">
                          {isAr
                            ? 'انتقال سريع لمناطق الثلوج والقمم الجليدية:'
                            : 'Quick Jump to Snow & Blizzard Peaks:'}
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                          {(
                            [
                              { ar: 'سانت كاترين (سيناء)', en: 'St. Catherine', lat: 28.55, lng: 33.97, h: 36000, p: -42 },
                              { ar: 'جبال لبنان والشيخ', en: 'Mt. Lebanon', lat: 34.24, lng: 36.05, h: 55000, p: -42 },
                              { ar: 'جبال الأطلس (المغرب)', en: 'High Atlas', lat: 31.06, lng: -7.91, h: 75000, p: -42 },
                              { ar: 'جبال الألب (أوروبا)', en: 'Swiss Alps', lat: 46.55, lng: 8.55, h: 115000, p: -44 },
                            ] as const
                          ).map((pk) => (
                            <button
                              key={pk.en}
                              type="button"
                              onClick={() => onFlyToPresetRegion(pk.lat, pk.lng, pk.h, pk.p)}
                              className="py-1 px-2 rounded-lg bg-slate-900 hover:bg-sky-950/80 border border-sky-500/30 text-[10px] font-semibold text-sky-200 flex items-center gap-1 cursor-pointer truncate"
                            >
                              <Snowflake className="w-3 h-3 text-sky-400 shrink-0" />
                              <span className="truncate">{isAr ? pk.ar : pk.en}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Day/Night Solar Terminator, World Solar Time & Blend Controls */}
                  {effectiveMapId === 'day_night' && (
                    <div
                      data-testid="day-night-controls-panel"
                      className="pt-2 border-t border-white/10 space-y-2"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-amber-300 flex items-center gap-1">
                          <Sun className="w-3.5 h-3.5 text-amber-400" />
                          <span>
                            {isAr
                              ? 'خريطة الوقت والنهار والليل والإشعاع الشمسي'
                              : 'World Solar Time & Day/Night Terminator'}
                          </span>
                        </span>
                        {onChangeUtcHourOverride && (
                          <button
                            type="button"
                            onClick={() => onChangeUtcHourOverride(null)}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer ${
                              utcHourOverride === null || utcHourOverride === undefined
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-slate-800 text-slate-300 hover:text-white'
                            }`}
                          >
                            {isAr ? 'الوقت الحي الآن' : 'Live Now'}
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                        <div className="bg-slate-900/90 border border-amber-500/30 rounded-lg p-1.5">
                          <div className="text-slate-400">
                            {isAr ? 'التوقيت المحلي' : 'Local Time'}
                          </div>
                          <div className="font-mono font-bold text-white mt-0.5">
                            {inspectedTelemetry.dayNight?.localTimeFormatted || '12:00'}
                          </div>
                        </div>
                        <div className="bg-slate-900/90 border border-amber-500/30 rounded-lg p-1.5">
                          <div className="text-slate-400">
                            {isAr ? 'طول النهار' : 'Daylight'}
                          </div>
                          <div className="font-mono font-bold text-amber-300 mt-0.5">
                            {inspectedTelemetry.dayNight?.daylightHours ?? 11.4}h
                          </div>
                        </div>
                        <div className="bg-slate-900/90 border border-amber-500/30 rounded-lg p-1.5">
                          <div className="text-slate-400">
                            {isAr ? 'الإشعاع الشمسي' : 'Irradiance'}
                          </div>
                          <div className="font-mono font-bold text-emerald-300 mt-0.5">
                            {inspectedTelemetry.dayNight?.solarRadiationWm2 ?? 540} W/m²
                          </div>
                        </div>
                      </div>

                      {onChangeUtcHourOverride && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-slate-300">
                            <span>
                              {isAr
                                ? 'محاكاة حركة الشمس (خط الفجر والغروب UTC)'
                                : 'Solar Terminator Time Slider (UTC)'}
                            </span>
                            <span className="font-mono text-amber-300" dir="ltr">
                              {isLiveTime
                                ? `${isAr ? 'مباشر' : 'LIVE'} ${displayLocalTimeStr} (${displayUtcTimeStr} UTC)`
                                : `${displayLocalTimeStr} (${displayUtcTimeStr} UTC)`}
                            </span>
                          </div>
                          <input
                            type="range"
                            dir="ltr"
                            data-testid="day-night-utc-slider"
                            min={0}
                            max={23.75}
                            step={0.25}
                            value={Number(effectiveUtcHour.toFixed(2))}
                            onChange={(e) => onChangeUtcHourOverride(Number(e.target.value))}
                            className="w-full accent-amber-400 cursor-pointer h-1.5"
                          />
                        </div>
                      )}

                      {onToggleBlendDayNightOverlay && (
                        <button
                          type="button"
                          data-testid="toggle-blend-day-night-btn"
                          onClick={onToggleBlendDayNightOverlay}
                          className={`w-full py-1.5 px-2.5 rounded-xl text-[10px] font-bold border flex items-center justify-between cursor-pointer ${
                            blendDayNightOverlay
                              ? 'bg-amber-500/25 border-amber-400 text-amber-200'
                              : 'bg-slate-900 border-white/10 text-slate-300 hover:text-white'
                          }`}
                        >
                          <span>
                            {isAr
                              ? 'دمج إضاءة الليل والنهار فوق جميع الخرائط الفضائية'
                              : 'Blend Day/Night Illumination Over All Maps'}
                          </span>
                          <span className="font-mono px-1.5 py-0.5 rounded bg-slate-950/70">
                            {blendDayNightOverlay
                              ? isAr
                                ? 'مفعل'
                                : 'ON'
                              : isAr
                              ? 'مغلق'
                              : 'OFF'}
                          </span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Spectral Indices Selector when zone exists or in Vegetation/Temp/Drought */}
                  <div className="pt-2 border-t border-white/10 space-y-1.5">
                    <div className="text-[11px] font-semibold text-slate-400">
                      {isAr ? 'المؤشر الطيفي للحقل' : 'Field Spectral Index'}
                    </div>
                    <select
                      aria-label={isAr ? 'المؤشر الطيفي للحقل' : 'Spectral Index'}
                      value={activeLayer}
                      onChange={(e) => onSelectSpectralLayer(e.target.value as SpectralIndexKey)}
                      className="w-full h-9 px-2.5 rounded-xl bg-slate-900 border border-white/15 text-xs text-white cursor-pointer"
                    >
                      {(
                        [
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
                        ] as SpectralIndexKey[]
                      ).map((k) => {
                        const spec = SPECTRAL_SCIENTIFIC_SPECS[k];
                        return (
                          <option key={k} value={k}>
                            {isAr ? spec.shortAr : spec.shortEn} ({k})
                            {vertices.length >= 3 ? ` — ${farmAverages[k]}${spec.unit}` : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Base Map Style & Forecast Day */}
                  <div className="pt-2 border-t border-white/10 space-y-2">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">
                        {isAr ? 'خلفية القمر الصناعي' : 'Base Imagery'}
                      </label>
                      <select
                        aria-label={isAr ? 'خلفية القمر الصناعي' : 'Base Imagery'}
                        value={baseMapStyle}
                        onChange={(e) => onChangeBaseMapStyle(e.target.value as BaseMapStyleId)}
                        className="w-full h-8 px-2 rounded-lg bg-slate-900 border border-white/15 text-[11px] text-slate-200 cursor-pointer"
                      >
                        {Object.values(BASE_MAP_STYLES).map((st) => (
                          <option key={st.id} value={st.id}>
                            {isAr ? st.labelAr.split('(')[0] : st.labelEn.split('(')[0]}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">
                        {isAr ? 'اليوم والتوقعات المناخية' : 'Forecast Day'}
                      </label>
                      <select
                        aria-label={isAr ? 'اليوم والتوقعات المناخية' : 'Forecast Day'}
                        value={selectedMoistureDayIdx}
                        onChange={(e) => onChangeMoistureDayIdx(Number(e.target.value))}
                        className="w-full h-8 px-2 rounded-lg bg-slate-900 border border-white/15 text-[11px] font-mono text-sky-300 cursor-pointer"
                      >
                        {forecast14.map((d, idx) => (
                          <option key={d.date} value={idx}>
                            {isAr ? d.dayLabelAr : d.dayLabelEn} ({d.date.slice(5)}) · SM:{d.soilMoisture0to7Pct}%
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>{isAr ? 'شفافية الدمج اللوني' : 'Layer Blend Opacity'}</span>
                        <span className="font-mono text-emerald-400">
                          {Math.round(overlayOpacity * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        aria-label={isAr ? 'شفافية الدمج اللوني' : 'Layer Blend Opacity'}
                        min={0.15}
                        max={0.9}
                        step={0.05}
                        value={overlayOpacity}
                        onChange={(e) => onChangeOverlayOpacity(Number(e.target.value))}
                        className="w-full accent-emerald-500 cursor-pointer h-1.5"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 2: ZONES & DRAWING */}
              {activeSection === 'zones' && (
                <div className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      data-testid="draw-mode-freehand-btn"
                      onClick={() =>
                        onStartDrawingMode(drawingMode === 'freehand' ? 'none' : 'freehand')
                      }
                      className={`py-2 px-2.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 border cursor-pointer ${
                        drawingMode === 'freehand'
                          ? 'bg-amber-600 border-amber-400 text-white'
                          : 'bg-slate-900 border-white/10 text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{isAr ? 'نقر حر 3D' : 'Freehand'}</span>
                    </button>

                    <button
                      type="button"
                      data-testid="draw-mode-rectangle-btn"
                      onClick={() =>
                        onStartDrawingMode(drawingMode === 'rectangle' ? 'none' : 'rectangle')
                      }
                      className={`py-2 px-2.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 border cursor-pointer ${
                        drawingMode === 'rectangle'
                          ? 'bg-sky-600 border-sky-400 text-white'
                          : 'bg-slate-900 border-white/10 text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <Square className="w-3.5 h-3.5" />
                      <span>{isAr ? 'مربع زونة' : 'Box Zone'}</span>
                    </button>
                  </div>

                  {vertices.length >= 3 && (
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={onSaveCurrentPolygonAsDraft}
                        className="py-1.5 px-2.5 rounded-xl text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{isAr ? 'حفظ الزونة' : 'Save Zone'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={onClearSelection}
                        className="py-1.5 px-2.5 rounded-xl text-[11px] font-bold bg-rose-600/85 hover:bg-rose-600 text-white flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Eraser className="w-3.5 h-3.5" />
                        <span>{isAr ? 'مسح الرسم' : 'Clear'}</span>
                      </button>
                    </div>
                  )}

                  {onSelectActiveZone &&
                    onToggleCompareZone &&
                    onRenameZone &&
                    onDeleteZone &&
                    onClearAllZones && (
                      <MultiZoneManagerBar
                        language={language}
                        zones={zones}
                        activeZoneId={activeZoneId}
                        comparedZoneIds={comparedZoneIds}
                        onSelectActiveZone={(zid) => {
                          onSelectActiveZone(zid);
                        }}
                        onToggleCompareZone={onToggleCompareZone}
                        onStartDrawingNewZone={(mode) => {
                          onStartDrawingMode(mode === 'polygon' ? 'freehand' : 'rectangle');
                        }}
                        onDeleteZone={onDeleteZone}
                        onRenameZone={onRenameZone}
                        onClearAllZones={onClearAllZones}
                        pendingDraft={pendingDraft}
                        onConfirmPendingDraft={onConfirmPendingDraft}
                        onCancelPendingDraft={onCancelPendingDraft}
                        isDrawingNewZone={drawingMode !== 'none'}
                        drawingMode={
                          drawingMode === 'freehand'
                            ? 'polygon'
                            : drawingMode === 'rectangle'
                            ? 'rectangle'
                            : 'none'
                        }
                        detectedCropId={detectedCropId}
                        detectedCropConfidencePct={detectedCropConfidencePct}
                        currentUser={currentUser}
                        isAuthLoading={isAuthLoading}
                        onSignInAndConfirmPendingDraft={onSignInAndConfirmPendingDraft}
                        onUpdateZoneSoil={onUpdateZoneSoil}
                      />
                    )}

                  {vertices.length >= 3 && (
                    <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-1.5">
                      {onOpenZoneInspector && (
                        <button
                          type="button"
                          onClick={() => {
                            onOpenZoneInspector();
                            setMenuOpen(false);
                          }}
                          className="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/10 text-[11px] font-semibold text-amber-300 flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span>{isAr ? 'قطاعات A/B/C' : 'Sub-Zones'}</span>
                        </button>
                      )}
                      {onOpenSoilSettings && (
                        <button
                          type="button"
                          onClick={() => {
                            onOpenSoilSettings();
                            setMenuOpen(false);
                          }}
                          className="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/10 text-[11px] font-semibold text-emerald-300 flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          <span>{isAr ? 'التربة والمحصول' : 'Soil & Crop'}</span>
                        </button>
                      )}
                      {onOpenFieldPointsInspector && (
                        <button
                          type="button"
                          onClick={() => {
                            onOpenFieldPointsInspector();
                            setMenuOpen(false);
                          }}
                          className="col-span-2 py-1.5 px-2 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 text-[11px] font-semibold text-cyan-200 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Waves className="w-3.5 h-3.5" />
                          <span>{isAr ? 'نقاط الارتفاعات وصرف المياه (Virtual)' : 'Field DEM & Drainage Points (Virtual)'}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* SECTION 3: 3D ORIENTATION & QUICK JUMP */}
              {activeSection === 'view' && (
                <div className="space-y-3">
                  {/* Cesium 3D Globe vs 2D Scene Morph */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => onChangeProjectionMode('globe_3d')}
                      className={`py-2 px-2 rounded-xl text-[11px] font-bold border flex items-center justify-center gap-1.5 cursor-pointer ${
                        projectionMode === 'globe_3d'
                          ? 'bg-emerald-600 border-emerald-400 text-white'
                          : 'bg-slate-900 border-white/10 text-slate-300'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>{isAr ? 'كوكب 3D' : '3D Globe'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onChangeProjectionMode('flat_2d')}
                      className={`py-2 px-2 rounded-xl text-[11px] font-bold border flex items-center justify-center gap-1.5 cursor-pointer ${
                        projectionMode === 'flat_2d'
                          ? 'bg-emerald-600 border-emerald-400 text-white'
                          : 'bg-slate-900 border-white/10 text-slate-300'
                      }`}
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>{isAr ? 'مسطح 2D' : '2D Flat'}</span>
                    </button>
                  </div>

                  {/* Camera Tilt & Compass */}
                  <div className="space-y-2 pt-2 border-t border-white/10">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-300 font-semibold">
                        {isAr ? 'منظور الميل الجبلي' : '3D Tilt Angle'}
                      </span>
                      <button
                        type="button"
                        onClick={onToggleViewMode3D}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer ${
                          viewMode3D
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {viewMode3D ? `${pitchDeg}° 3D` : isAr ? 'عمودي 0°' : 'Top 0°'}
                      </button>
                    </div>
                    {viewMode3D && (
                      <input
                        type="range"
                        min={15}
                        max={65}
                        step={5}
                        value={pitchDeg}
                        onChange={(e) => onChangePitchDeg(Number(e.target.value))}
                        className="w-full accent-indigo-500 cursor-pointer h-1.5"
                      />
                    )}

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-300 font-semibold flex items-center gap-1">
                        <Compass className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{isAr ? 'الاتجاه (البوصلة)' : 'Heading'}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => onChangeRotationDeg(0)}
                        className="text-[10px] font-mono text-emerald-400 hover:underline cursor-pointer"
                      >
                        {rotationDeg}° · {isAr ? 'شمال 0°' : 'Reset N'}
                      </button>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={360}
                      step={5}
                      value={rotationDeg}
                      onChange={(e) => onChangeRotationDeg(Number(e.target.value))}
                      className="w-full accent-emerald-500 cursor-pointer h-1.5"
                    />
                  </div>

                  {/* Quick Geographic Jumps (Only executes when explicitly clicked!) */}
                  <div className="pt-2 border-t border-white/10 space-y-1.5">
                    <div className="text-[11px] font-semibold text-slate-400">
                      {isAr ? 'انتقال سريع على الكوكب' : 'Quick Fly-To'}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(
                        [
                          { ar: 'الكوكب الكامل', en: 'Full Earth', lat: 22, lng: 24, h: 14200000, p: -90 },
                          { ar: 'مصر والدلتا', en: 'Egypt & Delta', lat: 30.72, lng: 31.26, h: 280000, p: -68 },
                          { ar: 'جبال سانت كاترين', en: 'Sinai Peaks', lat: 28.54, lng: 33.97, h: 42000, p: -38 },
                          { ar: 'جبال أطلس (المغرب)', en: 'Atlas Peaks', lat: 31.06, lng: -7.91, h: 95000, p: -38 },
                          { ar: 'جبال الألب', en: 'European Alps', lat: 46.5, lng: 9.8, h: 145000, p: -40 },
                          { ar: 'الأمريكتين', en: 'Americas', lat: 36.0, lng: -105.0, h: 4800000, p: -75 },
                        ] as const
                      ).map((loc) => (
                        <button
                          key={loc.en}
                          type="button"
                          onClick={() => {
                            onFlyToPresetRegion(loc.lat, loc.lng, loc.h, loc.p);
                            setMenuOpen(false);
                          }}
                          className="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/10 text-[10px] font-semibold text-slate-200 flex items-center gap-1 cursor-pointer truncate"
                        >
                          <Navigation className="w-3 h-3 text-sky-400 shrink-0" />
                          <span className="truncate">{isAr ? loc.ar : loc.en}</span>
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          onLocateGps();
                          setMenuOpen(false);
                        }}
                        className="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/10 text-[11px] font-semibold text-emerald-300 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Crosshair className="w-3.5 h-3.5" />
                        <span>{isAr ? 'موقعي GPS' : 'My GPS'}</span>
                      </button>

                      {vertices.length >= 3 && (
                        <button
                          type="button"
                          onClick={() => {
                            onFlyToActiveZone();
                            setMenuOpen(false);
                          }}
                          className="py-1.5 px-2 rounded-lg bg-emerald-600/25 hover:bg-emerald-600/40 border border-emerald-400/50 text-[11px] font-bold text-emerald-200 flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{isAr ? 'تقريب للزونة' : 'Zoom Zone'}</span>
                        </button>
                      )}
                    </div>

                    {(onDownloadPdfReport || onOpenFullScreenAtlas) && (
                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        {onDownloadPdfReport && vertices.length >= 3 && (
                          <button
                            type="button"
                            onClick={onDownloadPdfReport}
                            className="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/10 text-[10px] font-semibold text-white flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Download className="w-3 h-3" />
                            <span>{isAr ? 'تقرير PDF' : 'PDF Report'}</span>
                          </button>
                        )}
                        {onOpenFullScreenAtlas && (
                          <button
                            type="button"
                            onClick={onOpenFullScreenAtlas}
                            className="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/10 text-[10px] font-semibold text-sky-300 flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Maximize2 className="w-3 h-3" />
                            <span>{isAr ? 'الأطلس الشامل' : 'Full Atlas'}</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
  ) : null;

  const drawingGuidanceBannerNode =
    drawingMode !== 'none' ? (
      <div
        data-testid="active-drawing-guidance-banner"
        className={`${
          isDesktopLg ? 'absolute top-16 right-3 z-30' : 'pointer-events-auto self-center'
        } bg-slate-950/92 backdrop-blur-md border border-emerald-400/60 rounded-xl px-3 py-2 shadow-xl flex flex-wrap items-center gap-2 text-xs max-w-[calc(100vw-24px)]`}
      >
        <span className="font-bold text-emerald-300">
          {drawingMode === 'rectangle'
            ? isAr
              ? 'وضع المربع: انقر الزاوية الأولى ثم الزاوية المقابلة على الكوكب'
              : 'Box Mode: Click corner 1 then corner 2 on globe'
            : isAr
            ? `نقر حر (${vertices.length} نقاط): انقر لتحديد رؤوس الزونة`
            : `Freehand (${vertices.length} pts): Click vertices on globe`}
        </span>
        {vertices.length >= 3 && (
          <button
            type="button"
            onClick={onSaveCurrentPolygonAsDraft}
            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
          >
            {isAr ? 'اعتماد الزونة' : 'Confirm Zone'}
          </button>
        )}
        <button
          type="button"
          onClick={() => onStartDrawingMode('none')}
          className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
        >
          {isAr ? 'إلغاء' : 'Cancel'}
        </button>
      </div>
    ) : null;

  return (
    <>
      {/* 1. UNIFIED RESPONSIVE TOP HUD (<1024px FLEX CONTAINER / >=1024px DRAGGABLE FAB + TOP-RIGHT CLUSTER) */}
      {isDesktopLg ? (
        <>
          <div
            className="absolute z-40 pointer-events-none"
            style={{ left: `${fabPos.x}px`, top: `${fabPos.y}px` }}
          >
            <div className="relative pointer-events-auto flex flex-row flex-wrap items-start gap-1.5">
              {launcherButtons}
              {satellitePickerPopoverNode}
              {verticalDropdownNode}
            </div>
          </div>

          {(topRightButtons || topRightDrawers) && (
            <div
              data-testid="map-disaster-early-warning-banner"
              className="absolute top-3 right-3 z-30 flex flex-col items-end gap-2 pointer-events-none max-w-[calc(100vw-420px)]"
            >
              {topRightButtons}
              {topRightDrawers}
            </div>
          )}

          {drawingGuidanceBannerNode}
        </>
      ) : (
        <div
          data-testid="unified-map-top-hud"
          className="absolute inset-x-2.5 top-2.5 z-40 pointer-events-none flex flex-col gap-2"
        >
          <div className="flex flex-wrap items-start justify-between gap-1.5 w-full">
            {launcherButtons}
            {topRightButtons && (
              <div
                data-testid="map-disaster-early-warning-banner"
                className="pointer-events-auto flex flex-wrap items-center justify-end gap-1.5"
              >
                {topRightButtons}
              </div>
            )}
          </div>
          {satellitePickerPopoverNode}
          {verticalDropdownNode}
          {topRightDrawers && (
            <div className="pointer-events-auto self-end w-full max-w-[min(calc(100vw-20px),420px)] flex flex-col items-end gap-2">
              {topRightDrawers}
            </div>
          )}
          {drawingGuidanceBannerNode}
        </div>
      )}

      {gpsStatus && (
        <div
          className={`absolute left-3.5 z-30 bg-slate-950/90 text-emerald-300 px-3 py-1 rounded-xl text-[11px] font-mono border border-emerald-500/40 ${
            isDesktopLg ? 'top-16' : 'top-[128px] sm:top-[108px]'
          }`}
        >
          {gpsStatus}
        </div>
      )}

      {/* 3. RIGHT-EDGE ZOOM RAIL + SLIM VENTUSKY VERTICAL COLOR SCALE BAR */}
      <div
        className={`absolute right-2.5 sm:right-3 z-30 flex flex-col items-end gap-2 pointer-events-none ${
          isDesktopLg ? 'top-16' : 'top-[132px] sm:top-[112px]'
        }`}
      >
        <div className="pointer-events-auto flex flex-col gap-1 bg-slate-950/88 backdrop-blur-md border border-white/15 rounded-2xl p-1 shadow-xl">
          <button
            type="button"
            onClick={() => onZoomStep('in')}
            title={isAr ? 'تقريب' : 'Zoom In'}
            className="w-8 h-8 rounded-xl hover:bg-slate-800 text-slate-200 flex items-center justify-center cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onZoomStep('out')}
            title={isAr ? 'تبعيد' : 'Zoom Out'}
            className="w-8 h-8 rounded-xl hover:bg-slate-800 text-slate-200 flex items-center justify-center cursor-pointer"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onZoomStep('world')}
            title={isAr ? 'عرض كوكب الأرض الكامل' : 'Reset Full Earth View'}
            className="w-8 h-8 rounded-xl hover:bg-slate-800 text-emerald-400 flex items-center justify-center cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Slim Right-Side Vertical Color Scale Bar (Ventusky-style compact bar) */}
        {showGlobalFieldOverlay && effectiveMapId !== 'natural' && (
          <div
            data-testid="right-vertical-color-scale"
            className="pointer-events-auto w-[46px] max-h-[calc(100dvh-310px)] lg:max-h-[calc(100dvh-260px)] overflow-y-auto rounded-xl bg-slate-950/90 border border-white/15 p-1 shadow-xl flex flex-col items-stretch gap-0.5 text-[9px] font-mono tabular-nums text-white select-none"
          >
            <div className="text-center text-slate-300 font-bold pb-0.5 border-b border-white/10 truncate">
              {unifiedSpec.unit.trim() || unifiedSpec.badgeCode.slice(0, 4)}
            </div>
            {[...unifiedSpec.colorStops].reverse().map((st, sIdx) => {
              const shortTick = formatScaleTick(st.rangeLabel);
              return (
                <div
                  key={sIdx}
                  dir="ltr"
                  title={`${isAr ? st.labelAr : st.labelEn}: ${st.rangeLabel}`}
                  className="px-1 py-1 rounded text-center font-bold leading-none truncate border border-black/25 shadow-sm"
                  style={{
                    backgroundColor: st.color,
                    color: '#ffffff',
                    textShadow: '0 1px 2px rgba(0,0,0,0.9)',
                  }}
                >
                  {shortTick}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. UNIFIED DRAGGABLE COLLAPSIBLE BOTTOM TABS POPUP DOCK (HIDES ALL BOTTOM TABS UNTIL CLICKED) */}
      <div
        data-testid="draggable-bottom-tabs-dock"
        className="absolute bottom-3 left-1/2 z-[70] pointer-events-none flex flex-col items-center gap-2 w-[clamp(280px,94vw,680px)]"
        style={{
          transform: `translate3d(calc(-50% + ${popoverOffset.x}px), ${popoverOffset.y}px, 0)`,
        }}
      >
        {isBottomTabsPopupOpen && (
          <div
            data-testid="draggable-bottom-tabs-popup"
            className="pointer-events-auto w-full max-h-[min(78dvh,560px)] overflow-y-auto bg-slate-950/96 backdrop-blur-xl border border-emerald-400/40 rounded-2xl p-3 sm:p-3.5 shadow-[0_24px_64px_rgba(0,0,0,0.88)] space-y-2.5 text-xs"
          >
            {/* Draggable Popup Header */}
            <div
              onPointerDown={handlePopoverHeaderPointerDown}
              onPointerMove={handlePopoverHeaderPointerMove}
              onPointerUp={handlePopoverHeaderPointerUp}
              title={
                isAr
                  ? 'اسحب لتحريك نافذة التبويبات السفلية بحرية في أي مكان على الشاشة'
                  : 'Drag to move the Bottom Tabs window freely anywhere on screen'
              }
              className="flex items-center justify-between gap-2 pb-2 border-b border-white/10 cursor-grab active:cursor-grabbing select-none"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <GripVertical className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-bold text-emerald-300 truncate">
                  {isAr
                    ? 'أدوات الخريطة السفلية (قابلة للسحب)'
                    : 'Draggable Map Tools Dock'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {(popoverOffset.x !== 0 || popoverOffset.y !== 0) && (
                  <button
                    type="button"
                    onClick={() => setPopoverOffset({ x: 0, y: 0 })}
                    title={isAr ? 'إعادة موضع الأداة للمنتصف' : 'Reset dock position'}
                    className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  aria-label={isAr ? 'إخفاء أدوات الخريطة' : 'Collapse map tools'}
                  onClick={() => {
                    setIsBottomTabsPopupOpen(false);
                    onChangeBottomPopover('none');
                  }}
                  className="p-1 rounded-lg bg-slate-900 hover:bg-rose-600 text-slate-300 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Map Bottom Tool Tabs (Color Legend, Point Telemetry, Timeline Scrubber, DEM Points, Zones) */}
            <div
              data-testid="bottom-compact-pills-bar"
              className="flex flex-wrap items-center gap-1.5"
            >
              <button
                type="button"
                data-testid="bottom-legend-pill-toggle-btn"
                onClick={() =>
                  onChangeBottomPopover(activeBottomPopover === 'legend' ? 'none' : 'legend')
                }
                className={`h-8 px-2.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  activeBottomPopover === 'legend'
                    ? 'bg-emerald-600 text-white border-emerald-300'
                    : 'bg-slate-900 text-slate-100 border-white/15 hover:bg-slate-800'
                }`}
              >
                <span
                  className="w-4 h-2 rounded-full border border-white/30 shrink-0"
                  style={{ background: unifiedSpec.gradientCss }}
                />
                <span>{isAr ? 'المفتاح اللوني' : 'Color Legend'}</span>
                {activeBottomPopover === 'legend' ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronUp className="w-3.5 h-3.5" />
                )}
              </button>

              <button
                type="button"
                data-testid="bottom-telemetry-pill-toggle-btn"
                onClick={() =>
                  onChangeBottomPopover(activeBottomPopover === 'telemetry' ? 'none' : 'telemetry')
                }
                className={`h-8 px-2.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  activeBottomPopover === 'telemetry'
                    ? 'bg-sky-600 text-white border-sky-300'
                    : 'bg-slate-900 text-sky-200 border-white/15 hover:bg-slate-800'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full border border-white/40 shrink-0"
                  style={{ backgroundColor: matchedLegendStop.stopColor }}
                />
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{isAr ? 'بيانات النقطة' : 'Point Data'}</span>
                <span className="font-mono text-[10px] text-emerald-300 tabular-nums">
                  {inspectedTelemetry.elevation.elevationMeters}m
                </span>
                {activeBottomPopover === 'telemetry' ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronUp className="w-3.5 h-3.5" />
                )}
              </button>

              <button
                type="button"
                data-testid="bottom-timeline-pill-toggle-btn"
                onClick={() => setShowTimelineInDock((prev) => !prev)}
                className={`h-8 px-2.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  showTimelineInDock
                    ? 'bg-amber-500/20 text-amber-300 border-amber-400/60'
                    : 'bg-slate-900 text-slate-200 border-white/15 hover:bg-slate-800'
                }`}
              >
                <Play className="w-3 h-3 text-amber-400 shrink-0" />
                <span>{isAr ? 'شريط الزمن والتوقيت' : 'Timeline Bar'}</span>
              </button>

              {onOpenFieldPointsInspector && (
                <button
                  type="button"
                  data-testid="bottom-dem-points-pill-btn"
                  onClick={onOpenFieldPointsInspector}
                  className="h-8 px-2.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 border bg-slate-900 text-cyan-200 border-cyan-500/40 hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Waves className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>{isAr ? 'نقاط DEM' : 'DEM Points'}</span>
                </button>
              )}

              {onOpenZoneInspector && (
                <button
                  type="button"
                  data-testid="bottom-zone-inspector-pill-btn"
                  onClick={onOpenZoneInspector}
                  className="h-8 px-2.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 border bg-slate-900 text-emerald-200 border-emerald-500/40 hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Layers className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{isAr ? 'القطاعات A/B/C' : 'Sub-Zones'}</span>
                </button>
              )}

              {onOpenSoilSettings && (
                <button
                  type="button"
                  data-testid="bottom-soil-profile-pill-btn"
                  onClick={onOpenSoilSettings}
                  className="h-8 px-2.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 border bg-slate-900 text-amber-200 border-amber-500/40 hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Sliders className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{isAr ? 'تحرير ملف التربة والري' : 'Soil Profile & Irrigation'}</span>
                </button>
              )}
            </div>

            {/* Embedded Timeline Scrubber inside Draggable Popup Dock */}
            {showTimelineInDock && (
              <div
                data-testid="ventusky-bottom-timeline-scrubber"
                dir="ltr"
                className="bg-slate-900/95 border border-white/15 rounded-xl px-2.5 py-2 flex flex-wrap sm:flex-nowrap items-center gap-2 text-[11px]"
              >
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    data-testid="timeline-prev-btn"
                    onClick={() => {
                      const curH = Math.round(effectiveLocalHour);
                      if (curH >= 3) {
                        onChangeUtcHourOverride?.(localHourToUtc(curH - 3));
                      } else {
                        onChangeUtcHourOverride?.(localHourToUtc(21));
                        onChangeMoistureDayIdx(Math.max(0, selectedMoistureDayIdx - 1));
                      }
                    }}
                    className="h-7 px-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-white/10 text-slate-200 flex items-center gap-1 cursor-pointer font-semibold"
                  >
                    <SkipBack className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">{isAr ? 'السابق' : 'Prev'}</span>
                  </button>

                  {onToggleTimelinePlaying && (
                    <button
                      type="button"
                      data-testid="timeline-play-btn"
                      onClick={onToggleTimelinePlaying}
                      className={`h-7 px-2.5 rounded-lg border flex items-center gap-1 cursor-pointer font-bold ${
                        timelinePlaying
                          ? 'bg-emerald-600 border-emerald-400 text-white'
                          : 'bg-slate-950 hover:bg-slate-800 border-white/15 text-emerald-300'
                      }`}
                    >
                      {timelinePlaying ? (
                        <Pause className="w-3.5 h-3.5" />
                      ) : (
                        <Play className="w-3.5 h-3.5" />
                      )}
                      <span className="hidden md:inline">
                        {timelinePlaying ? (isAr ? 'إيقاف' : 'Pause') : isAr ? 'تشغيل' : 'Play'}
                      </span>
                    </button>
                  )}

                  {onChangeUtcHourOverride && (
                    <button
                      type="button"
                      data-testid="timeline-live-btn"
                      onClick={() => {
                        onChangeUtcHourOverride(null);
                        onChangeMoistureDayIdx(0);
                      }}
                      title={isAr ? 'الرجوع للوقت الحي الآن' : 'Snap to Live Local Time'}
                      className={`h-7 px-2 rounded-lg border text-[10px] font-bold cursor-pointer whitespace-nowrap ${
                        isLiveTime && selectedMoistureDayIdx === 0
                          ? 'bg-amber-500 border-amber-300 text-slate-950'
                          : 'bg-slate-950 hover:bg-slate-800 border-white/15 text-amber-300'
                      }`}
                    >
                      {isAr ? 'الآن' : 'LIVE'}
                    </button>
                  )}

                  <select
                    aria-label={isAr ? 'تغيير التاريخ' : 'Change Date'}
                    data-testid="timeline-date-select"
                    value={selectedMoistureDayIdx}
                    onChange={(e) => onChangeMoistureDayIdx(Number(e.target.value))}
                    className="h-7 px-2 rounded-lg bg-white text-slate-900 font-bold text-[11px] font-mono cursor-pointer border border-white/30"
                  >
                    {forecast14.map((d, idx) => (
                      <option key={d.date} value={idx}>
                        {isAr ? d.dayLabelAr : d.dayLabelEn} · {d.date.slice(5)}
                      </option>
                    ))}
                  </select>
                </div>

                <span
                  data-testid="timeline-current-time-badge"
                  title={`UTC ${displayUtcTimeStr}`}
                  className={`font-mono text-[10px] font-bold tabular-nums shrink-0 px-2 py-0.5 rounded-lg border whitespace-nowrap ${
                    isLiveTime
                      ? 'bg-amber-500/15 border-amber-400/50 text-amber-300'
                      : 'bg-slate-950 border-white/10 text-sky-300'
                  }`}
                >
                  {isLiveTime
                    ? isAr
                      ? `مباشر ${displayLocalTimeStr}`
                      : `LIVE ${displayLocalTimeStr}`
                    : displayLocalTimeStr}
                </span>

                <div className="flex-1 min-w-[150px] flex flex-col gap-0.5 px-1" dir="ltr">
                  <input
                    type="range"
                    dir="ltr"
                    data-testid="timeline-hour-slider"
                    min={0}
                    max={23}
                    step={0.25}
                    value={Math.min(23, Math.max(0, Number(effectiveLocalHour.toFixed(2))))}
                    onChange={(e) =>
                      onChangeUtcHourOverride?.(localHourToUtc(Number(e.target.value)))
                    }
                    className="w-full accent-sky-400 cursor-pointer h-1.5"
                  />
                  <div className="hidden md:block relative h-3.5 text-[9px] font-mono text-slate-400 tabular-nums select-none">
                    {[0, 3, 6, 9, 12, 15, 18, 21, 23].map((hr) => (
                      <button
                        key={hr}
                        type="button"
                        onClick={() => onChangeUtcHourOverride?.(localHourToUtc(hr))}
                        style={{
                          left: `${(hr / 23) * 100}%`,
                          transform:
                            hr === 0
                              ? 'translateX(0%)'
                              : hr === 23
                              ? 'translateX(-100%)'
                              : 'translateX(-50%)',
                        }}
                        className={`absolute top-0 hover:text-white cursor-pointer whitespace-nowrap ${
                          Math.abs(effectiveLocalHour - hr) < 1.2 ? 'text-sky-300 font-bold' : ''
                        }`}
                      >
                        {`${String(hr).padStart(2, '0')}:00`}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  data-testid="timeline-next-btn"
                  onClick={() => {
                    const curH = Math.round(effectiveLocalHour);
                    if (curH <= 20) {
                      onChangeUtcHourOverride?.(localHourToUtc(curH + 3));
                    } else {
                      onChangeUtcHourOverride?.(localHourToUtc(0));
                      onChangeMoistureDayIdx(
                        selectedMoistureDayIdx + 1 < forecast14.length
                          ? selectedMoistureDayIdx + 1
                          : 0
                      );
                    }
                  }}
                  className="h-7 px-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-white/10 text-slate-200 flex items-center gap-1 cursor-pointer font-semibold shrink-0"
                >
                  <span className="hidden md:inline">{isAr ? 'التالي' : 'Next'}</span>
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Popover 1: Color Legend inside Draggable Popup Dock */}
            {activeBottomPopover === 'legend' && (
              <div
                data-testid="synchronized-bottom-legend"
                className="bg-slate-900/95 border border-emerald-400/35 rounded-xl p-3 space-y-2 text-xs"
              >
                <div className="flex items-start justify-between gap-2 pb-1.5 border-b border-white/10">
                  <div className="min-w-0">
                    <div className="font-bold text-emerald-400 leading-snug truncate">
                      {isAr ? unifiedSpec.shortAr : unifiedSpec.shortEn}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {isAr ? authoritativeSourceMeta.providerAr : authoritativeSourceMeta.providerEn}{' '}
                      · {authoritativeSourceMeta.resolutionLabel}
                    </div>
                    <div className="text-[11px] font-mono text-slate-300 tabular-nums truncate">
                      {isAr ? 'قراءة النقطة:' : 'Point:'}{' '}
                      <span className="text-white font-bold">
                        {matchedLegendStop.readingFormatted}
                      </span>
                      {vertices.length >= 3 && (
                        <span className="text-emerald-300">
                          {' '}
                          · {isAr ? 'متوسط الحقل:' : 'Mean:'} {unifiedSpec.meanValueFormatted}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={onToggleSubZoneLabels}
                      className="px-2 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-[10px] text-slate-300 border border-white/10 cursor-pointer whitespace-nowrap"
                    >
                      {showSubZoneLabels
                        ? isAr
                          ? 'إخفاء الشبكة'
                          : 'Hide Grid'
                        : isAr
                        ? 'الشبكة'
                        : 'Grid'}
                    </button>
                    <button
                      type="button"
                      data-testid="toggle-scientific-standards-btn"
                      onClick={onToggleScientificTable}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                        showScientificTable
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-950 hover:bg-slate-800 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      <BookOpen className="w-3 h-3" />
                      <span>{isAr ? 'المعايير' : 'Scale'}</span>
                    </button>
                    <button
                      type="button"
                      aria-label={isAr ? 'إغلاق دليل الألوان' : 'Close color legend'}
                      onClick={() => onChangeBottomPopover('none')}
                      className="p-1 rounded-lg bg-slate-950 hover:bg-rose-600 text-slate-300 hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-mono text-[10px] text-slate-300">
                  <span className="shrink-0">
                    {isAr ? unifiedSpec.minLabelAr : unifiedSpec.minLabelEn}
                  </span>
                  <div
                    className="flex-1 h-2.5 rounded-full border border-white/25"
                    style={{ background: unifiedSpec.gradientCss }}
                  />
                  <span className="shrink-0">
                    {isAr ? unifiedSpec.maxLabelAr : unifiedSpec.maxLabelEn}
                  </span>
                </div>

                <div className="flex flex-col gap-1 max-h-[min(24vh,180px)] overflow-y-auto pr-0.5">
                  {unifiedSpec.colorStops.map((stop, idx) => {
                    const isActiveStop = idx === matchedLegendStop.stopIndex;
                    return (
                      <div
                        key={idx}
                        data-testid={isActiveStop ? 'active-legend-color-stop' : undefined}
                        className={`flex items-start gap-2 p-1.5 rounded-xl border transition-colors ${
                          isActiveStop
                            ? 'bg-emerald-500/15 border-emerald-400/70 ring-1 ring-emerald-400/60'
                            : 'bg-slate-950/70 border-white/10'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-sm shrink-0 border border-white/35 mt-0.5"
                          style={{ backgroundColor: stop.color }}
                        />
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
                            <span className="font-bold text-white text-[11px] leading-snug">
                              {isAr ? stop.labelAr : stop.labelEn}
                            </span>
                            <span className="font-mono text-[10px] text-emerald-300 tabular-nums shrink-0">
                              {stop.rangeLabel}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-300 leading-relaxed">
                            {isAr ? stop.meaningAr : stop.meaningEn}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Popover 2: Point Telemetry Card inside Draggable Popup Dock */}
            {activeBottomPopover === 'telemetry' && (
              <div
                data-testid="point-telemetry-popover"
                className="bg-slate-900/95 border border-sky-400/35 rounded-xl p-3 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-white/10">
                  <div className="min-w-0">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">
                        {isAr
                          ? 'بيانات النقطة والأقمار الصناعية (NASA POWER & DEM)'
                          : 'Point Elevation & Satellite Telemetry'}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-sky-300 mt-0.5 tabular-nums flex flex-wrap items-center gap-1.5">
                      <span>
                        {inspectedTelemetry.lat.toFixed(4)}°N, {inspectedTelemetry.lng.toFixed(4)}°E
                      </span>
                      <span className="text-slate-500">·</span>
                      <span className="text-emerald-300">
                        {isAr
                          ? inspectedTelemetry.elevation.landformAr
                          : inspectedTelemetry.elevation.landformEn}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label={isAr ? 'إغلاق بيانات النقطة' : 'Close point telemetry'}
                    onClick={() => onChangeBottomPopover('none')}
                    className="p-1 rounded-lg bg-slate-950 hover:bg-rose-600 text-slate-300 hover:text-white cursor-pointer shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                  <div className="bg-slate-950/90 border border-white/10 rounded-lg p-1.5">
                    <div className="text-slate-400 text-[10px]">
                      {isAr ? 'الارتفاع عن البحر' : 'Elevation'}
                    </div>
                    <div className="font-mono font-bold text-emerald-300 mt-0.5 tabular-nums">
                      {inspectedTelemetry.elevation.elevationMeters} m
                    </div>
                  </div>
                  <div className="bg-slate-950/90 border border-white/10 rounded-lg p-1.5">
                    <div className="text-slate-400 text-[10px]">
                      {isAr ? 'الحرارة / المحسوسة' : 'Temp / Feels'}
                    </div>
                    <div className="font-mono font-bold text-white mt-0.5 tabular-nums">
                      {inspectedTelemetry.temperature.airTemp2mC}° /{' '}
                      {inspectedTelemetry.apparentTempC ?? inspectedTelemetry.temperature.airTemp2mC}
                      °C
                    </div>
                  </div>
                  <div className="bg-slate-950/90 border border-white/10 rounded-lg p-1.5">
                    <div className="text-slate-400 text-[10px]">
                      {isAr ? 'رطوبة التربة 0/7cm' : 'Soil SM'}
                    </div>
                    <div className="font-mono font-bold text-sky-300 mt-0.5 tabular-nums">
                      {inspectedTelemetry.soilMoisture.moisture0cmPct}% /{' '}
                      {inspectedTelemetry.soilMoisture.moisture7cmPct}%
                    </div>
                  </div>
                  <div className="bg-slate-950/90 border border-white/10 rounded-lg p-1.5">
                    <div className="text-slate-400 text-[10px]">
                      {isAr ? 'الرطوبة / الندى' : 'RH% / Dew Pt'}
                    </div>
                    <div className="font-mono font-bold text-sky-300 mt-0.5 tabular-nums">
                      {inspectedTelemetry.humidityPct ?? 54}% · {inspectedTelemetry.dewPointC ?? 11}
                      °C
                    </div>
                  </div>
                  <div className="bg-slate-950/90 border border-white/10 rounded-lg p-1.5">
                    <div className="text-slate-400 text-[10px]">
                      {isAr ? 'الرياح / الهبات' : 'Wind / Gust'}
                    </div>
                    <div className="font-mono font-bold text-emerald-200 mt-0.5 tabular-nums">
                      {inspectedTelemetry.windSpeedKmh} /{' '}
                      {inspectedTelemetry.windGustKmh ??
                        Math.round(inspectedTelemetry.windSpeedKmh * 1.45)}{' '}
                      km/h
                    </div>
                  </div>
                  <div className="bg-slate-950/90 border border-white/10 rounded-lg p-1.5">
                    <div className="text-slate-400 text-[10px]">
                      {isAr ? 'الضغط الجوي' : 'Pressure MSL'}
                    </div>
                    <div className="font-mono font-bold text-amber-300 mt-0.5 tabular-nums">
                      {inspectedTelemetry.pressureHpa ?? 1014} hPa
                    </div>
                  </div>
                </div>
                {inspectedTelemetry.soilGrids && (
                  <div className="grid grid-cols-3 gap-1.5 text-[11px] pt-1 border-t border-white/10">
                    <div className="bg-slate-950/90 border border-white/10 rounded-lg p-1.5">
                      <div className="text-slate-400 text-[10px]">SoilGrids pH</div>
                      <div className="font-mono font-bold text-emerald-300 mt-0.5 tabular-nums">
                        {inspectedTelemetry.soilGrids.ph}
                      </div>
                    </div>
                    <div className="bg-slate-950/90 border border-white/10 rounded-lg p-1.5">
                      <div className="text-slate-400 text-[10px]">
                        {isAr ? 'المادة العضوية' : 'Organic Matter'}
                      </div>
                      <div className="font-mono font-bold text-lime-300 mt-0.5 tabular-nums">
                        {inspectedTelemetry.soilGrids.organicMatterPct}%
                      </div>
                    </div>
                    <div className="bg-slate-950/90 border border-white/10 rounded-lg p-1.5">
                      <div className="text-slate-400 text-[10px]">
                        {isAr ? 'طين / رمل' : 'Clay / Sand'}
                      </div>
                      <div className="font-mono font-bold text-amber-200 mt-0.5 tabular-nums">
                        {inspectedTelemetry.soilGrids.clayPct}% / {inspectedTelemetry.soilGrids.sandPct}%
                      </div>
                    </div>
                  </div>
                )}
                <div className="text-[10px] text-slate-400 pt-1 border-t border-white/10 truncate">
                  {isAr ? authoritativeSourceMeta.providerAr : authoritativeSourceMeta.providerEn}{' '}
                  ·{' '}
                  {isAr
                    ? authoritativeSourceMeta.urbanMaskLabelAr
                    : authoritativeSourceMeta.urbanMaskLabelEn}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Single Compact Draggable Floating Trigger Pill (Only Visible Element When Collapsed) */}
        <button
          type="button"
          data-testid="draggable-bottom-tabs-trigger"
          onPointerDown={handleBottomTriggerPointerDown}
          onPointerMove={handleBottomTriggerPointerMove}
          onPointerUp={handleBottomTriggerPointerUp}
          title={
            isDesktopLg
              ? isAr
                ? 'اضغط لإظهار أو إخفاء أدوات الخريطة — اسحب لتحريك الزر في أي مكان'
                : 'Click to toggle map tools dock — Drag to move anywhere'
              : undefined
          }
          className={`pointer-events-auto min-h-[44px] px-3.5 py-1.5 rounded-full border backdrop-blur-xl shadow-2xl flex items-center gap-2 text-xs font-bold transition-colors cursor-grab active:cursor-grabbing select-none ${
            isBottomTabsPopupOpen
              ? 'bg-emerald-600 text-white border-emerald-300'
              : 'bg-slate-950/92 text-slate-100 border-emerald-400/50 hover:bg-slate-900'
          }`}
        >
          <GripVertical className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
          <Layers className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="whitespace-nowrap">
            {isAr ? 'أدوات الخريطة' : 'Map Tools'}
          </span>
          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-full bg-black/35 text-emerald-300 tabular-nums">
            {matchedLegendStop.readingFormatted}
          </span>
          {isBottomTabsPopupOpen ? (
            <ChevronDown className="w-4 h-4 shrink-0" />
          ) : (
            <ChevronUp className="w-4 h-4 shrink-0" />
          )}
        </button>
      </div>
    </>
  );
};
