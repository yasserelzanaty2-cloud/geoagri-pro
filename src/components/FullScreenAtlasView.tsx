import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { List, type RowComponentProps } from 'react-window';
import {
  AlertTriangle,
  Bell,
  BellOff,
  BookOpen,
  ChevronDown,
  CloudRain,
  Layers,
  MapPin,
  ShieldCheck,
  Sliders,
  ThermometerSun,
  Waves,
  X,
} from 'lucide-react';
import {
  AreaBreakdown,
  BaseMapStyleId,
  DailyWeatherPoint,
  ElevationColorPalette,
  ElevationDisplayMode,
  GlobalTemperatureSubMode,
  IrrigationSystem,
  Language,
  LatLon,
  MapDisplayProjectionMode,
  OpenMeteoSoilMoistureDepth,
  PresetFarmZone,
  RegionDrawingToolMode,
  SatelliteVintageId,
  SoilProfile,
  SoilTexture,
  SpatialGridCell,
  SpectralIndexKey,
  SubZoneSummary,
  ThematicMapLayerId,
  UserStudyZone,
  VentuskyAtmosphericOptions,
  VentuskyLiveTelemetryNode,
} from '../types/agro';
import {
  CROP_DATABASE,
  OpenMeteoZonePushAlert,
  evaluateEnvironmentalDisasterWarnings,
  getPolygonCentroid,
  resolveCustomCropReference,
  resolveCustomSoilTextureReference,
} from '../utils/agroEngine';
import { resolveZoneCellVegetationOverlayVisual } from '../utils/satellitePixelAnalyzer';
import { BrowserPushPermissionState } from '../services/weatherPushService';
import {
  SoilMoistureGridNode,
  SpatialWindVectorPoint,
  VirtualizedFieldPointRowData,
  buildVirtualizedFieldPointsMatrix,
  evaluateGlobalDayNightSolarAtLatLon,
  evaluateGlobalElevationAtLatLon,
  evaluateGlobalSnowAndBlizzardAtLatLon,
  evaluateGlobalTemperatureAtLatLon,
  evaluateSoilMoistureOverlayAtLatLon,
  evaluateSpatialRainAtLatLon,
  evaluateSpatialSpectralOrSoilAtLatLon,
  evaluateSpatialWindAtLatLon,
  evaluateVentuskyLayerAtLatLon,
  fetchLiveElevationAtLatLon,
  fetchLiveOpenMeteoSoilMoistureGrid,
  fetchLiveSpatialWindGrid,
  fetchLiveVentuskyAirAndSynopticGrid,
  isMarineOrOceanWaterAtLatLon,
} from '../utils/thematicMapRenderer';
import { debounce } from '../utils/debounce';
import {
  evaluateCellForUnifiedLayer,
  resolveUnifiedActiveLayerSpec,
} from '../utils/unifiedLayerManager';
import {
  VisualLeafPhotoAnalysis,
  identifyPlantedCropInZone,
} from '../utils/cropRecognitionEngine';
import { CropRecognitionPanel } from './CropRecognitionPanel';
import {
  AuthUserSummary,
  PendingZoneDraft,
  ZoneDraftConfirmPayload,
} from './MultiZoneManagerBar';
import {
  CesiumEarthStage,
  CesiumFlyTarget,
  CesiumZoomCommand,
} from './CesiumEarthStage';
import {
  InspectedTelemetrySnapshot,
  MapFloatingHud,
} from './MapFloatingHud';
import {
  AuthoritativeSoilGridsReading,
  fetchAuthoritativeSoilGridsAtLatLon,
} from '../services/authoritativeGisService';

interface FullScreenAtlasViewProps {
  language: Language;
  selectedPresetId?: string;
  onSelectPreset?: (preset: PresetFarmZone) => void;
  vertices: LatLon[];
  onChangeVertices: (vertices: LatLon[]) => void;
  soil: SoilProfile;
  onChangeSoil?: (soil: SoilProfile) => void;
  area: AreaBreakdown;
  subZones: SubZoneSummary[];
  gridCells: SpatialGridCell[];
  farmAverages: Record<SpectralIndexKey, number>;
  activeLayer: SpectralIndexKey;
  onChangeActiveLayer: (layer: SpectralIndexKey) => void;
  activeThematicMap: ThematicMapLayerId;
  onChangeThematicMap: (mode: ThematicMapLayerId) => void;
  forecast14: DailyWeatherPoint[];
  selectedMoistureDayIdx: number;
  onChangeMoistureDayIdx: (idx: number) => void;
  onDownloadPdfReport?: () => void;
  radiometricSource: 'satellite-pixel-live' | 'agro-coupled-model';
  zones?: UserStudyZone[];
  activeZoneId?: string | null;
  comparedZoneIds?: string[];
  onSelectActiveZone?: (zoneId: string) => void;
  onToggleCompareZone?: (zoneId: string) => void;
  onCreateZone?: (draft: ZoneDraftConfirmPayload & { vertices: LatLon[] }) => void;
  onSignInAndConfirmPendingDraft?: (
    draft: ZoneDraftConfirmPayload & { vertices: LatLon[] }
  ) => void;
  currentUser?: AuthUserSummary | null;
  isAuthLoading?: boolean;
  onRenameZone?: (zoneId: string, newNameAr: string, newCategoryAr: string) => void;
  onDeleteZone?: (zoneId: string) => void;
  onClearAllZones?: () => void;
  onUpdateZoneSoil?: (zoneId: string, nextSoil: SoilProfile) => void;
  isRefreshingData?: boolean;
  currentCropId?: string;
  customCropLabel?: string;
  onChangeCurrentCrop?: (cropId: string, customCropLabel?: string) => void;
  pushNotificationsEnabled?: boolean;
  onTogglePushNotifications?: () => void;
  notificationPermission?: BrowserPushPermissionState;
  onEnableBrowserPushNotifications?: () => void;
  activePushAlerts?: OpenMeteoZonePushAlert[];
  dismissedPushAlertIds?: string[];
  onDismissPushAlert?: (alertId: string) => void;
}

interface VirtualPointRowExtraProps {
  items: VirtualizedFieldPointRowData[];
  isAr: boolean;
  selectedPointId: string | null;
  onFocusPoint: (pt: VirtualizedFieldPointRowData) => void;
}

const VirtualizedFieldPointRow = ({
  index,
  style,
  items,
  isAr,
  selectedPointId,
  onFocusPoint,
}: RowComponentProps<VirtualPointRowExtraProps>) => {
  const item = items[index];
  if (!item) return null;
  const isSelected = selectedPointId === item.id;
  const isHighRisk = item.waterAccumulationRiskPct >= 68;
  return (
    <div style={style} className="px-1 py-0.5">
      <button
        type="button"
        data-testid={`virtualized-point-row-${index}`}
        onClick={() => onFocusPoint(item)}
        className={`w-full h-full px-2.5 py-1.5 rounded-xl border text-start flex items-center justify-between gap-2 transition-colors cursor-pointer ${
          isSelected
            ? 'bg-cyan-600/25 border-cyan-400 text-white'
            : 'bg-slate-900/90 hover:bg-slate-800 border-white/10 text-slate-200'
        }`}
      >
        <div className="min-w-0 flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-sm shrink-0 border border-white/30"
            style={{ backgroundColor: item.drainageColor }}
          />
          <div className="min-w-0">
            <div className="text-[11px] font-bold flex items-center gap-1.5 truncate">
              <span className="font-mono text-cyan-300">{item.label}</span>
              <span className="text-white font-mono">{item.elevationMeters}m</span>
              <span className="text-slate-400 font-mono">({item.slopePct}%)</span>
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {item.flowArrow}{' '}
              {isAr ? item.flowDirectionAr : `Flows ${item.flowDirectionEn}`} · NDVI {item.ndvi}
            </div>
          </div>
        </div>
        <span
          className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold shrink-0 tabular-nums ${
            isHighRisk
              ? 'bg-blue-600/80 text-white'
              : item.waterAccumulationRiskPct >= 48
              ? 'bg-cyan-700/70 text-cyan-100'
              : 'bg-slate-800 text-lime-300'
          }`}
        >
          {isHighRisk ? (isAr ? 'منخفض ' : 'Low ') : ''}
          {item.waterAccumulationRiskPct}%
        </span>
      </button>
    </div>
  );
};

export const FullScreenAtlasView: React.FC<FullScreenAtlasViewProps> = ({
  language,
  vertices,
  onChangeVertices,
  soil,
  onChangeSoil,
  area,
  subZones,
  gridCells,
  farmAverages,
  activeLayer,
  onChangeActiveLayer,
  activeThematicMap,
  onChangeThematicMap,
  forecast14,
  selectedMoistureDayIdx,
  onChangeMoistureDayIdx,
  onDownloadPdfReport,
  zones = [],
  activeZoneId = null,
  comparedZoneIds = [],
  onSelectActiveZone,
  onToggleCompareZone,
  onCreateZone,
  onSignInAndConfirmPendingDraft,
  currentUser,
  isAuthLoading = false,
  onRenameZone,
  onDeleteZone,
  onClearAllZones,
  onUpdateZoneSoil,
  currentCropId = 'wheat',
  customCropLabel,
  onChangeCurrentCrop,
  pushNotificationsEnabled = true,
  onTogglePushNotifications,
  notificationPermission = 'default',
  onEnableBrowserPushNotifications,
  activePushAlerts = [],
  dismissedPushAlertIds = [],
  onDismissPushAlert,
}) => {
  const isAr = language === 'ar';
  const viewportWrapperRef = useRef<HTMLDivElement | null>(null);
  const [showTopRightHubPopover, setShowTopRightHubPopover] = useState<boolean>(false);
  const [showPushAlertsDrawer, setShowPushAlertsDrawer] = useState<boolean>(false);

  const [baseMapStyle, setBaseMapStyle] = useState<BaseMapStyleId>('hybrid');
  const [activeSatelliteVintageId, setActiveSatelliteVintageId] =
    useState<SatelliteVintageId>('2026_latest');
  const [isComparisonMode, setIsComparisonMode] = useState<boolean>(false);
  const [comparisonBaselineVintageId, setComparisonBaselineVintageId] =
    useState<SatelliteVintageId>('2014');
  const [comparisonTargetVintageId, setComparisonTargetVintageId] =
    useState<SatelliteVintageId>('2026_latest');
  const [isTimeLapsePlaying, setIsTimeLapsePlaying] = useState<boolean>(false);
  const [soilMoistureOverlayEnabled, setSoilMoistureOverlayEnabled] = useState<boolean>(false);
  const [soilMoistureDepthMode, setSoilMoistureDepthMode] =
    useState<OpenMeteoSoilMoistureDepth>('soil_moisture_0cm');
  const [liveSoilMoistureNodes, setLiveSoilMoistureNodes] = useState<SoilMoistureGridNode[]>([]);
  const [liveWindNodes, setLiveWindNodes] = useState<SpatialWindVectorPoint[]>([]);

  const [drawingMode, setDrawingMode] = useState<RegionDrawingToolMode>('none');
  const [pendingDraft, setPendingDraft] = useState<PendingZoneDraft | null>(null);
  const [overlayOpacity, setOverlayOpacity] = useState<number>(0.55);
  const [showSubZoneLabels, setShowSubZoneLabels] = useState<boolean>(true);
  const [gpsStatus, setGpsStatus] = useState<string | null>(null);
  const [showScientificTable, setShowScientificTable] = useState<boolean>(false);

  const [mapDisplayProjection, setMapDisplayProjection] =
    useState<MapDisplayProjectionMode>('globe_3d');
  const [mapRotationDeg, setMapRotationDeg] = useState<number>(0);
  const [viewMode3D, setViewMode3D] = useState<boolean>(true);
  const [mapPitchDeg, setMapPitchDeg] = useState<number>(38);
  const [globalTempSubMode, setGlobalTempSubMode] =
    useState<GlobalTemperatureSubMode>('surface_lst');
  const [elevationDisplayMode, setElevationDisplayMode] =
    useState<ElevationDisplayMode>('3d_color_only');
  const [elevationPalette, setElevationPalette] =
    useState<ElevationColorPalette>('scientific_hypsometric');
  const [terrainExaggeration, setTerrainExaggeration] = useState<number>(2.4);
  const [showGlobalHeatCanvas, setShowGlobalHeatCanvas] = useState<boolean>(true);
  const [utcHourOverride, setUtcHourOverride] = useState<number | null>(null);
  const [blendDayNightOverlay, setBlendDayNightOverlay] = useState<boolean>(false);

  const [liveUtcClock, setLiveUtcClock] = useState<number>(() => {
    const d = new Date();
    return Number((d.getUTCHours() + d.getUTCMinutes() / 60).toFixed(2));
  });
  useEffect(() => {
    if (typeof utcHourOverride === 'number') return;
    const syncClock = () => {
      const d = new Date();
      setLiveUtcClock(Number((d.getUTCHours() + d.getUTCMinutes() / 60).toFixed(2)));
    };
    const timer = window.setInterval(syncClock, 60000);
    return () => window.clearInterval(timer);
  }, [utcHourOverride]);

  const [ventuskyOptions, setVentuskyOptions] = useState<VentuskyAtmosphericOptions>({
    pressureAltitude: '2m',
    airPollutant: 'PM2.5',
    precipAccumWindow: '3h',
    windAltitude: '10m',
    cloudFilter: 'total',
    forecastModel: 'AUTO',
    utcHour: null,
  });
  const [liveVentuskyNodes, setLiveVentuskyNodes] = useState<VentuskyLiveTelemetryNode[]>([]);
  const [showWhiteBorders, setShowWhiteBorders] = useState<boolean>(true);
  const [showStreamlines, setShowStreamlines] = useState<boolean>(true);
  const [showCityMetrics, setShowCityMetrics] = useState<boolean>(true);
  const [timelinePlaying, setTimelinePlaying] = useState<boolean>(false);

  const [flyToTarget, setFlyToTarget] = useState<CesiumFlyTarget | null>(null);
  const [zoomCommand, setZoomCommand] = useState<CesiumZoomCommand | null>(null);
  const [cameraCenter, setCameraCenter] = useState<LatLon>({ lat: 27.0, lng: 28.0 });

  const [activeBottomPopover, setActiveBottomPopover] = useState<'none' | 'legend' | 'telemetry'>(
    'none'
  );
  const [inspectedPointLatLon, setInspectedPointLatLon] = useState<LatLon | null>(null);
  const [inspectedTerrainHeight, setInspectedTerrainHeight] = useState<number | null>(null);
  const [liveElevationOverride, setLiveElevationOverride] = useState<{
    lat: number;
    lng: number;
    meters: number;
  } | null>(null);
  const [liveSoilGridsOverride, setLiveSoilGridsOverride] =
    useState<AuthoritativeSoilGridsReading | null>(null);

  const [floatingInspectorMode, setFloatingInspectorMode] = useState<
    'pixel' | 'zone' | 'soil' | 'points' | null
  >(null);
  const [selectedCell, setSelectedCell] = useState<SpatialGridCell | null>(null);
  const [selectedVirtualPointId, setSelectedVirtualPointId] = useState<string | null>(null);
  const [virtualPointSortBy, setVirtualPointSortBy] = useState<
    'lowest_elevation' | 'highest_risk' | 'grid_order'
  >('lowest_elevation');
  const [selectedZoneTab, setSelectedZoneTab] = useState<'A' | 'B' | 'C'>('C');
  const [visualLeafAnalysis, setVisualLeafAnalysis] = useState<VisualLeafPhotoAnalysis | null>(
    null
  );
  const [customSoilInput, setCustomSoilInput] = useState<string>(soil.customTextureLabel || '');
  const [isCustomSoilMode, setIsCustomSoilMode] = useState<boolean>(
    Boolean(soil.customTextureLabel)
  );
  const [customCropInput, setCustomCropInput] = useState<string>(customCropLabel || '');
  const [isCustomCropMode, setIsCustomCropMode] = useState<boolean>(Boolean(customCropLabel));

  useEffect(() => {
    setCustomSoilInput(soil.customTextureLabel || '');
    setIsCustomSoilMode(Boolean(soil.customTextureLabel));
  }, [soil.customTextureLabel]);

  useEffect(() => {
    setCustomCropInput(customCropLabel || '');
    setIsCustomCropMode(Boolean(customCropLabel));
  }, [customCropLabel]);

  const isSoilMoistureActive =
    soilMoistureOverlayEnabled || activeThematicMap === 'soil_moisture';

  const polygonCentroid = useMemo(() => getPolygonCentroid(vertices), [vertices]);
  const centroid = useMemo(
    () => (vertices.length >= 3 ? polygonCentroid : cameraCenter),
    [vertices.length, polygonCentroid, cameraCenter]
  );
  const activeWeatherDay = forecast14[selectedMoistureDayIdx] || forecast14[0];

  const [showDisasterEarlyWarningDrawer, setShowDisasterEarlyWarningDrawer] =
    useState<boolean>(false);
  const [activeDisasterIdx, setActiveDisasterIdx] = useState<number>(0);

  const disasterWarnings = useMemo(
    () =>
      evaluateEnvironmentalDisasterWarnings(
        forecast14,
        soil,
        isAr ? 'نطاق الرصد الجغرافي' : 'GIS Monitored Zone',
        'GIS Monitored Zone',
        centroid
      ),
    [forecast14, soil, isAr, centroid]
  );

  const topDisaster = disasterWarnings[activeDisasterIdx] || disasterWarnings[0];

  const cropRecognition = useMemo(
    () =>
      identifyPlantedCropInZone(
        gridCells,
        farmAverages,
        soil,
        area,
        forecast14,
        visualLeafAnalysis
      ),
    [gridCells, farmAverages, soil, area, forecast14, visualLeafAnalysis]
  );

  const visiblePushAlerts = useMemo(
    () =>
      pushNotificationsEnabled && vertices.length >= 3
        ? activePushAlerts.filter((a) => !dismissedPushAlertIds.includes(a.id))
        : [],
    [pushNotificationsEnabled, vertices.length, activePushAlerts, dismissedPushAlertIds]
  );

  const zoneCoverCounts = useMemo(() => {
    let activeCrop = 0;
    let fallowClay = 0;
    let excludedBuiltOrWater = 0;
    gridCells.forEach((c) => {
      const v = resolveZoneCellVegetationOverlayVisual(c, 'vegetation', 'NDVI');
      if (!v.shouldColor) excludedBuiltOrWater++;
      else if (v.category === 'fallow_clay') fallowClay++;
      else activeCrop++;
    });
    return { activeCrop, fallowClay, excludedBuiltOrWater };
  }, [gridCells]);

  const effectiveVentuskyOptions = useMemo<VentuskyAtmosphericOptions>(
    () => ({
      ...ventuskyOptions,
      utcHour: typeof utcHourOverride === 'number' ? utcHourOverride : liveUtcClock,
    }),
    [ventuskyOptions, utcHourOverride, liveUtcClock]
  );

  const unifiedSpec = useMemo(
    () =>
      resolveUnifiedActiveLayerSpec(
        isSoilMoistureActive ? 'soil_moisture' : activeThematicMap,
        activeLayer,
        farmAverages,
        gridCells,
        forecast14,
        selectedMoistureDayIdx,
        isAr,
        elevationPalette,
        effectiveVentuskyOptions,
        liveVentuskyNodes
      ),
    [
      isSoilMoistureActive,
      activeThematicMap,
      activeLayer,
      farmAverages,
      gridCells,
      forecast14,
      selectedMoistureDayIdx,
      isAr,
      elevationPalette,
      effectiveVentuskyOptions,
      liveVentuskyNodes,
    ]
  );

  const utcHourOverrideRef = useRef<number | null>(utcHourOverride);
  const liveUtcClockRef = useRef<number>(liveUtcClock);
  const moistureDayIdxRef = useRef<number>(selectedMoistureDayIdx);
  const forecastLenRef = useRef<number>(forecast14.length);

  useEffect(() => {
    utcHourOverrideRef.current = utcHourOverride;
  }, [utcHourOverride]);

  useEffect(() => {
    liveUtcClockRef.current = liveUtcClock;
  }, [liveUtcClock]);

  useEffect(() => {
    moistureDayIdxRef.current = selectedMoistureDayIdx;
  }, [selectedMoistureDayIdx]);

  useEffect(() => {
    forecastLenRef.current = forecast14.length;
  }, [forecast14.length]);

  useEffect(() => {
    if (!timelinePlaying) return;
    const interval = setInterval(() => {
      const cur =
        typeof utcHourOverrideRef.current === 'number'
          ? utcHourOverrideRef.current
          : Math.floor(liveUtcClockRef.current);
      const next = cur + 3;
      if (next >= 24) {
        const curDay = moistureDayIdxRef.current;
        const totalDays = forecastLenRef.current;
        const nextDay = totalDays > 0 && curDay + 1 < totalDays ? curDay + 1 : 0;
        utcHourOverrideRef.current = 0;
        moistureDayIdxRef.current = nextDay;
        setUtcHourOverride(0);
        onChangeMoistureDayIdx(nextDay);
      } else {
        utcHourOverrideRef.current = next;
        setUtcHourOverride(next);
      }
    }, 1150);
    return () => clearInterval(interval);
  }, [timelinePlaying, onChangeMoistureDayIdx]);

  useEffect(() => {
    if (activeThematicMap !== 'wind' && activeThematicMap !== 'wind_gusts') return;
    let cancelled = false;
    fetchLiveSpatialWindGrid(
      {
        south: centroid.lat - 4.5,
        north: centroid.lat + 4.5,
        west: centroid.lng - 4.5,
        east: centroid.lng + 4.5,
      },
      activeWeatherDay
    ).then((nodes) => {
      if (!cancelled) setLiveWindNodes(nodes);
    });
    return () => {
      cancelled = true;
    };
  }, [activeThematicMap, Math.round(centroid.lat * 2), Math.round(centroid.lng * 2), selectedMoistureDayIdx]);

  useEffect(() => {
    const needsSynoptic =
      activeBottomPopover === 'telemetry' ||
      activeThematicMap === 'temperature' ||
      activeThematicMap === 'apparent_temp' ||
      activeThematicMap === 'wind_gusts' ||
      activeThematicMap === 'pressure' ||
      activeThematicMap === 'thunderstorms' ||
      activeThematicMap === 'weather_radar' ||
      activeThematicMap === 'satellite_ir' ||
      activeThematicMap === 'humidity' ||
      activeThematicMap === 'air_quality';
    if (!needsSynoptic) return;
    let cancelled = false;
    fetchLiveVentuskyAirAndSynopticGrid(centroid, activeWeatherDay).then((nodes) => {
      if (!cancelled && nodes.length > 0) setLiveVentuskyNodes(nodes);
    });
    return () => {
      cancelled = true;
    };
  }, [
    activeThematicMap,
    activeBottomPopover,
    Math.round(centroid.lat),
    Math.round(centroid.lng),
    selectedMoistureDayIdx,
  ]);

  useEffect(() => {
    if (!isSoilMoistureActive) return;
    let cancelled = false;
    fetchLiveOpenMeteoSoilMoistureGrid(
      {
        south: centroid.lat - 0.15,
        north: centroid.lat + 0.15,
        west: centroid.lng - 0.15,
        east: centroid.lng + 0.15,
      },
      activeWeatherDay
    ).then((nodes) => {
      if (!cancelled) setLiveSoilMoistureNodes(nodes);
    });
    return () => {
      cancelled = true;
    };
  }, [isSoilMoistureActive, Math.round(centroid.lat * 20), Math.round(centroid.lng * 20), selectedMoistureDayIdx]);

  const targetTelemetryLatLon = inspectedPointLatLon ?? centroid;

  const inspectedTelemetry: InspectedTelemetrySnapshot = useMemo(() => {
    const { lat, lng } = targetTelemetryLatLon;
    const baseElev = evaluateGlobalElevationAtLatLon(lat, lng, 0.02, elevationPalette);
    const resolvedMeters =
      liveElevationOverride &&
      Math.abs(liveElevationOverride.lat - lat) < 0.001 &&
      Math.abs(liveElevationOverride.lng - lng) < 0.001
        ? liveElevationOverride.meters
        : inspectedTerrainHeight !== null && inspectedPointLatLon
        ? inspectedTerrainHeight
        : baseElev.elevationMeters;

    const elev = {
      ...baseElev,
      elevationMeters: resolvedMeters,
    };
    const temp = evaluateGlobalTemperatureAtLatLon(lat, lng, activeWeatherDay, globalTempSubMode);
    const sm = evaluateSoilMoistureOverlayAtLatLon(
      lat,
      lng,
      soilMoistureDepthMode,
      activeWeatherDay,
      liveSoilMoistureNodes
    );
    const wind = evaluateSpatialWindAtLatLon(lat, lng, activeWeatherDay, liveWindNodes);
    const rain = evaluateSpatialRainAtLatLon(lat, lng, forecast14, selectedMoistureDayIdx);
    const snowIce = evaluateGlobalSnowAndBlizzardAtLatLon(
      lat,
      lng,
      activeWeatherDay,
      resolvedMeters
    );
    const dayNight = evaluateGlobalDayNightSolarAtLatLon(lat, lng, utcHourOverride ?? undefined);

    const apparentEval = evaluateVentuskyLayerAtLatLon(lat, lng, 'apparent_temp', effectiveVentuskyOptions, activeWeatherDay, liveVentuskyNodes);
    const gustEval = evaluateVentuskyLayerAtLatLon(lat, lng, 'wind_gusts', effectiveVentuskyOptions, activeWeatherDay, liveVentuskyNodes);
    const pressEval = evaluateVentuskyLayerAtLatLon(lat, lng, 'pressure', effectiveVentuskyOptions, activeWeatherDay, liveVentuskyNodes);
    const capeEval = evaluateVentuskyLayerAtLatLon(lat, lng, 'thunderstorms', effectiveVentuskyOptions, activeWeatherDay, liveVentuskyNodes);
    const radarEval = evaluateVentuskyLayerAtLatLon(lat, lng, 'weather_radar', effectiveVentuskyOptions, activeWeatherDay, liveVentuskyNodes);
    const satEval = evaluateVentuskyLayerAtLatLon(lat, lng, 'satellite_ir', effectiveVentuskyOptions, activeWeatherDay, liveVentuskyNodes);
    const rhEval = evaluateVentuskyLayerAtLatLon(lat, lng, 'humidity', { ...effectiveVentuskyOptions, pressureAltitude: '2m' }, activeWeatherDay, liveVentuskyNodes);
    const dewEval = evaluateVentuskyLayerAtLatLon(lat, lng, 'humidity', { ...effectiveVentuskyOptions, pressureAltitude: 'dew_point' }, activeWeatherDay, liveVentuskyNodes);
    const pm25Eval = evaluateVentuskyLayerAtLatLon(lat, lng, 'air_quality', { ...effectiveVentuskyOptions, airPollutant: 'PM2.5' }, activeWeatherDay, liveVentuskyNodes);
    const dustEval = evaluateVentuskyLayerAtLatLon(lat, lng, 'air_quality', { ...effectiveVentuskyOptions, airPollutant: 'DUST' }, activeWeatherDay, liveVentuskyNodes);
    const uvEval = evaluateVentuskyLayerAtLatLon(lat, lng, 'air_quality', { ...effectiveVentuskyOptions, airPollutant: 'UV' }, activeWeatherDay, liveVentuskyNodes);
    const aqiEval = evaluateVentuskyLayerAtLatLon(lat, lng, 'air_quality', { ...effectiveVentuskyOptions, airPollutant: 'AQI' }, activeWeatherDay, liveVentuskyNodes);

    return {
      lat,
      lng,
      elevation: elev,
      temperature: temp,
      soilMoisture: sm,
      snowIce,
      dayNight,
      windSpeedKmh: wind.speedKmh,
      windCardinal: isAr ? wind.cardinalAr : wind.cardinalEn,
      rainMm: rain.precipMm,
      rainProbPct: rain.precipProbPct,
      cloudCoverPct: activeWeatherDay?.cloudCoverPct ?? 18,
      ndviEstimate:
        !inspectedPointLatLon && vertices.length >= 3
          ? farmAverages.NDVI
          : isMarineOrOceanWaterAtLatLon(lat, lng)
          ? 0.01
          : evaluateSpatialSpectralOrSoilAtLatLon(
              lat,
              lng,
              'NDVI',
              activeWeatherDay,
              resolvedMeters
            ).numericValue,
      apparentTempC: apparentEval.numericValue,
      windGustKmh: gustEval.numericValue,
      pressureHpa: pressEval.numericValue,
      capeJkg: capeEval.numericValue,
      radarDbz: radarEval.numericValue,
      satelliteCloudPct: satEval.numericValue,
      humidityPct: rhEval.numericValue,
      dewPointC: dewEval.numericValue,
      pm25: pm25Eval.numericValue,
      dust: dustEval.numericValue,
      uvIndex: uvEval.numericValue,
      aqi: aqiEval.numericValue,
      soilGrids:
        liveSoilGridsOverride &&
        Math.abs(liveSoilGridsOverride.lat - lat) < 0.01 &&
        Math.abs(liveSoilGridsOverride.lng - lng) < 0.01
          ? liveSoilGridsOverride
          : null,
    };
  }, [
    targetTelemetryLatLon,
    elevationPalette,
    liveElevationOverride,
    liveSoilGridsOverride,
    inspectedTerrainHeight,
    inspectedPointLatLon,
    activeWeatherDay,
    globalTempSubMode,
    soilMoistureDepthMode,
    liveSoilMoistureNodes,
    liveWindNodes,
    liveVentuskyNodes,
    effectiveVentuskyOptions,
    forecast14,
    selectedMoistureDayIdx,
    utcHourOverride,
    isAr,
    vertices.length,
    farmAverages.NDVI,
  ]);

  useEffect(() => {
    if (activeBottomPopover !== 'telemetry') return;
    let cancelled = false;
    const { lat, lng } = targetTelemetryLatLon;
    fetchAuthoritativeSoilGridsAtLatLon(lat, lng).then((sg) => {
      if (!cancelled && sg) {
        setLiveSoilGridsOverride(sg);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [activeBottomPopover, targetTelemetryLatLon.lat, targetTelemetryLatLon.lng]);

  const handleSelectPointOnGlobe = (
    lat: number,
    lng: number,
    terrainHeightMeters: number | null
  ) => {
    setInspectedPointLatLon({ lat, lng });
    setInspectedTerrainHeight(terrainHeightMeters);
    fetchLiveElevationAtLatLon(lat, lng, elevationPalette).then((res) => {
      setLiveElevationOverride({ lat, lng, meters: res.elevationMeters });
    });
    fetchAuthoritativeSoilGridsAtLatLon(lat, lng).then((sg) => {
      if (sg) setLiveSoilGridsOverride(sg);
    });
  };

  const handleSelectThematicMap = (id: ThematicMapLayerId) => {
    setShowGlobalHeatCanvas(true);
    if (id === 'soil_moisture') {
      setSoilMoistureOverlayEnabled(true);
      onChangeThematicMap('soil_moisture');
      if (activeLayer !== 'SM_0_7' && activeLayer !== 'SM_7_28') {
        onChangeActiveLayer('SM_0_7');
      }
    } else {
      setSoilMoistureOverlayEnabled(false);
      onChangeThematicMap(id);
      if (id === 'vegetation' && activeLayer !== 'NDVI') {
        onChangeActiveLayer('NDVI');
      } else if (id === 'temperature' && activeLayer !== 'LST') {
        onChangeActiveLayer('LST');
      } else if (id === 'drought' && activeLayer !== 'SM_0_7' && activeLayer !== 'SM_7_28') {
        onChangeActiveLayer('SM_0_7');
      }
    }
  };

  // Debounced pan & zoom camera synchronization to prevent heavy React/point matrix recalculations while interacting
  const verticesLenRef = useRef(vertices.length);
  verticesLenRef.current = vertices.length;

  const debouncedSyncCameraStatus = useMemo(
    () =>
      debounce((center: LatLon) => {
        if (verticesLenRef.current >= 3) return;
        setCameraCenter((prev) =>
          Math.hypot(prev.lat - center.lat, prev.lng - center.lng) > 0.15 ? center : prev
        );
      }, 180),
    []
  );

  const debouncedZoomCommand = useMemo(
    () =>
      debounce((dir: 'in' | 'out' | 'world') => {
        setZoomCommand({ direction: dir, nonce: Date.now() });
      }, 90),
    []
  );

  useEffect(() => {
    return () => {
      debouncedSyncCameraStatus.cancel();
      debouncedZoomCommand.cancel();
    };
  }, [debouncedSyncCameraStatus, debouncedZoomCommand]);

  const virtualFieldPoints = useMemo(
    () =>
      buildVirtualizedFieldPointsMatrix(
        gridCells,
        targetTelemetryLatLon,
        virtualPointSortBy,
        256
      ),
    [gridCells, targetTelemetryLatLon.lat, targetTelemetryLatLon.lng, virtualPointSortBy]
  );

  const handleFocusVirtualizedPoint = useCallback(
    (pt: VirtualizedFieldPointRowData) => {
      setSelectedVirtualPointId(pt.id);
      setInspectedPointLatLon({ lat: pt.lat, lng: pt.lng });
      setInspectedTerrainHeight(pt.elevationMeters);
      setFlyToTarget({
        lat: pt.lat,
        lng: pt.lng,
        heightMeters: 1650,
        pitchDeg: -56,
        nonce: Date.now(),
      });
    },
    []
  );

  const handleLocateGps = () => {
    if (!navigator.geolocation) {
      setGpsStatus(isAr ? 'المتصفح لا يدعم GPS' : 'GPS not supported');
      return;
    }
    setGpsStatus(isAr ? 'جاري تحديد الموقع...' : 'Locating GPS...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setFlyToTarget({
          lat,
          lng,
          heightMeters: 1800,
          pitchDeg: -65,
          nonce: Date.now(),
        });
        handleSelectPointOnGlobe(lat, lng, null);
        setGpsStatus(isAr ? 'تم التوجيه لموقعك' : 'Centered on GPS');
        setTimeout(() => setGpsStatus(null), 3500);
      },
      () => {
        setGpsStatus(isAr ? 'تعذر قراءة GPS' : 'GPS unavailable');
        setTimeout(() => setGpsStatus(null), 3000);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const activeZoneObj = subZones.find((z) => z.id === selectedZoneTab) || subZones[0];

  return (
    <div
      ref={viewportWrapperRef}
      data-testid="fullscreen-atlas-view"
      className="relative w-full h-full overflow-hidden bg-[#030712] text-slate-100"
    >
      <CesiumEarthStage
        language={language}
        baseMapStyle={baseMapStyle}
        activeThematicMap={activeThematicMap}
        isSoilMoistureActive={isSoilMoistureActive}
        soilMoistureDepthMode={soilMoistureDepthMode}
        elevationDisplayMode={elevationDisplayMode}
        elevationPalette={elevationPalette}
        terrainExaggeration={terrainExaggeration}
        overlayOpacity={overlayOpacity}
        showGlobalFieldOverlay={showGlobalHeatCanvas}
        globalTempSubMode={globalTempSubMode}
        activeLayer={activeLayer}
        projectionMode={mapDisplayProjection}
        rotationDeg={mapRotationDeg}
        pitchDeg={mapPitchDeg}
        viewMode3D={viewMode3D}
        zones={zones}
        activeZoneId={activeZoneId}
        vertices={vertices}
        gridCells={gridCells}
        showSubZoneLabels={showSubZoneLabels}
        drawingMode={drawingMode}
        activeWeatherDay={activeWeatherDay}
        forecast14={forecast14}
        selectedMoistureDayIdx={selectedMoistureDayIdx}
        liveWindNodes={liveWindNodes}
        ventuskyOptions={effectiveVentuskyOptions}
        liveVentuskyNodes={liveVentuskyNodes}
        showWhiteBorders={showWhiteBorders}
        showStreamlines={showStreamlines}
        showCityMetrics={showCityMetrics}
        inspectedLatLon={inspectedPointLatLon}
        utcHourOverride={utcHourOverride}
        blendDayNightOverlay={blendDayNightOverlay}
        flyToTarget={flyToTarget}
        zoomCommand={zoomCommand}
        activeSatelliteVintageId={activeSatelliteVintageId}
        onSelectSatelliteVintage={setActiveSatelliteVintageId}
        isComparisonMode={isComparisonMode}
        onChangeComparisonMode={setIsComparisonMode}
        comparisonBaselineVintageId={comparisonBaselineVintageId}
        onChangeComparisonBaselineVintageId={setComparisonBaselineVintageId}
        comparisonTargetVintageId={comparisonTargetVintageId}
        onChangeComparisonTargetVintageId={setComparisonTargetVintageId}
        isTimeLapsePlaying={isTimeLapsePlaying}
        onChangeTimeLapsePlaying={setIsTimeLapsePlaying}
        hideStandaloneVintageWidget={true}
        onSelectPoint={handleSelectPointOnGlobe}
        onClickGridCell={(cell) => {
          setSelectedCell(cell);
          setFloatingInspectorMode('pixel');
        }}
        onSelectZone={(zid) => {
          onSelectActiveZone?.(zid);
          const found = zones.find((z) => z.id === zid);
          if (found) {
            setFlyToTarget({
              lat: found.centroid.lat,
              lng: found.centroid.lng,
              heightMeters: 2200,
              pitchDeg: -58,
              nonce: Date.now(),
            });
          }
        }}
        onChangeVertices={onChangeVertices}
        onCompleteRectangle={(boxVerts) => {
          onChangeVertices(boxVerts);
          setDrawingMode('none');
          const nextIdx = zones.length + 1;
          setPendingDraft({
            vertices: boxVerts,
            defaultNameAr: `زونة زراعية ${nextIdx}`,
            defaultNameEn: `Study Zone ${nextIdx}`,
          });
        }}
        onCameraStatusChange={(st) => {
          debouncedSyncCameraStatus(st.center);
        }}
      />

      <MapFloatingHud
        language={language}
        activeSatelliteVintageId={activeSatelliteVintageId}
        onSelectSatelliteVintage={setActiveSatelliteVintageId}
        isComparisonMode={isComparisonMode}
        onChangeComparisonMode={setIsComparisonMode}
        comparisonBaselineVintageId={comparisonBaselineVintageId}
        onChangeComparisonBaselineVintageId={setComparisonBaselineVintageId}
        comparisonTargetVintageId={comparisonTargetVintageId}
        onChangeComparisonTargetVintageId={setComparisonTargetVintageId}
        isTimeLapsePlaying={isTimeLapsePlaying}
        onChangeTimeLapsePlaying={setIsTimeLapsePlaying}
        containerRef={viewportWrapperRef}
        isSoilMoistureActive={isSoilMoistureActive}
        activeThematicMap={activeThematicMap}
        onSelectThematicMap={handleSelectThematicMap}
        soilMoistureDepthMode={soilMoistureDepthMode}
        onSelectSoilMoistureDepth={(d) => {
          setSoilMoistureDepthMode(d);
          setSoilMoistureOverlayEnabled(true);
          onChangeThematicMap('soil_moisture');
        }}
        activeLayer={activeLayer}
        onSelectSpectralLayer={(layer) => {
          setShowGlobalHeatCanvas(true);
          onChangeActiveLayer(layer);
          if (layer === 'LST') {
            setSoilMoistureOverlayEnabled(false);
            onChangeThematicMap('temperature');
          } else if (layer === 'SM_0_7') {
            setSoilMoistureOverlayEnabled(true);
            setSoilMoistureDepthMode('soil_moisture_0cm');
            onChangeThematicMap('soil_moisture');
          } else if (layer === 'SM_7_28') {
            setSoilMoistureOverlayEnabled(false);
            setSoilMoistureDepthMode('soil_moisture_7cm');
            onChangeThematicMap('vegetation');
          } else {
            setSoilMoistureOverlayEnabled(false);
            onChangeThematicMap('vegetation');
          }
        }}
        baseMapStyle={baseMapStyle}
        onChangeBaseMapStyle={setBaseMapStyle}
        elevationDisplayMode={elevationDisplayMode}
        onChangeElevationDisplayMode={setElevationDisplayMode}
        elevationPalette={elevationPalette}
        onChangeElevationPalette={setElevationPalette}
        terrainExaggeration={terrainExaggeration}
        onChangeTerrainExaggeration={setTerrainExaggeration}
        overlayOpacity={overlayOpacity}
        onChangeOverlayOpacity={setOverlayOpacity}
        showGlobalFieldOverlay={showGlobalHeatCanvas}
        onToggleGlobalFieldOverlay={() => setShowGlobalHeatCanvas((p) => !p)}
        globalTempSubMode={globalTempSubMode}
        onChangeGlobalTempSubMode={setGlobalTempSubMode}
        projectionMode={mapDisplayProjection}
        onChangeProjectionMode={setMapDisplayProjection}
        viewMode3D={viewMode3D}
        onToggleViewMode3D={() => setViewMode3D((p) => !p)}
        pitchDeg={mapPitchDeg}
        onChangePitchDeg={setMapPitchDeg}
        rotationDeg={mapRotationDeg}
        onChangeRotationDeg={setMapRotationDeg}
        forecast14={forecast14}
        selectedMoistureDayIdx={selectedMoistureDayIdx}
        onChangeMoistureDayIdx={onChangeMoistureDayIdx}
        unifiedSpec={unifiedSpec}
        farmAverages={farmAverages}
        vertices={vertices}
        area={area}
        soil={soil}
        subZones={subZones}
        zones={zones}
        activeZoneId={activeZoneId}
        comparedZoneIds={comparedZoneIds}
        drawingMode={drawingMode}
        onStartDrawingMode={(mode) => {
          if (mode !== 'none') onChangeVertices([]);
          setDrawingMode(mode);
        }}
        onClearSelection={() => {
          setDrawingMode('none');
          setPendingDraft(null);
          onChangeVertices([]);
        }}
        onSaveCurrentPolygonAsDraft={() => {
          setDrawingMode('none');
          const nextIdx = zones.length + 1;
          setPendingDraft({
            vertices,
            defaultNameAr: `زونة زراعية ${nextIdx}`,
            defaultNameEn: `Study Zone ${nextIdx}`,
          });
        }}
        pendingDraft={pendingDraft}
        onConfirmPendingDraft={(config) => {
          if (pendingDraft && onCreateZone) {
            onCreateZone({
              ...config,
              vertices: pendingDraft.vertices,
            });
          }
          setPendingDraft(null);
          setDrawingMode('none');
        }}
        onSignInAndConfirmPendingDraft={(config) => {
          if (pendingDraft && onSignInAndConfirmPendingDraft) {
            onSignInAndConfirmPendingDraft({
              ...config,
              vertices: pendingDraft.vertices,
            });
          }
          setPendingDraft(null);
          setDrawingMode('none');
        }}
        currentUser={currentUser}
        isAuthLoading={isAuthLoading}
        onCancelPendingDraft={() => setPendingDraft(null)}
        onSelectActiveZone={(zid) => {
          onSelectActiveZone?.(zid);
          const found = zones.find((z) => z.id === zid);
          if (found) {
            setFlyToTarget({
              lat: found.centroid.lat,
              lng: found.centroid.lng,
              heightMeters: 2200,
              pitchDeg: -58,
              nonce: Date.now(),
            });
          }
        }}
        onToggleCompareZone={onToggleCompareZone}
        onRenameZone={(zid, newNameAr, newCatAr) => onRenameZone?.(zid, newNameAr, newCatAr)}
        onDeleteZone={onDeleteZone}
        onClearAllZones={onClearAllZones}
        onUpdateZoneSoil={onUpdateZoneSoil}
        onFlyToPresetRegion={(lat, lng, heightMeters, pitch) =>
          setFlyToTarget({ lat, lng, heightMeters, pitchDeg: pitch, nonce: Date.now() })
        }
        onFlyToActiveZone={() => {
          if (vertices.length < 3) return;
          const c = getPolygonCentroid(vertices);
          setFlyToTarget({
            lat: c.lat,
            lng: c.lng,
            heightMeters: 2200,
            pitchDeg: -58,
            nonce: Date.now(),
          });
        }}
        onLocateGps={handleLocateGps}
        onZoomStep={(dir) => debouncedZoomCommand(dir)}
        onOpenZoneInspector={() => setFloatingInspectorMode('zone')}
        onOpenSoilSettings={() => setFloatingInspectorMode('soil')}
        onOpenFieldPointsInspector={() => setFloatingInspectorMode('points')}
        onDownloadPdfReport={onDownloadPdfReport}
        showSubZoneLabels={showSubZoneLabels}
        onToggleSubZoneLabels={() => setShowSubZoneLabels((p) => !p)}
        showScientificTable={showScientificTable}
        onToggleScientificTable={() => setShowScientificTable((p) => !p)}
        inspectedTelemetry={inspectedTelemetry}
        selectedCell={selectedCell}
        activeBottomPopover={activeBottomPopover}
        onChangeBottomPopover={setActiveBottomPopover}
        utcHourOverride={utcHourOverride}
        onChangeUtcHourOverride={setUtcHourOverride}
        blendDayNightOverlay={blendDayNightOverlay}
        onToggleBlendDayNightOverlay={() => setBlendDayNightOverlay((p) => !p)}
        ventuskyOptions={effectiveVentuskyOptions}
        onChangeVentuskyOptions={(patch) =>
          setVentuskyOptions((prev) => ({ ...prev, ...patch }))
        }
        showWhiteBorders={showWhiteBorders}
        onToggleWhiteBorders={() => setShowWhiteBorders((p) => !p)}
        showStreamlines={showStreamlines}
        onToggleStreamlines={() => setShowStreamlines((p) => !p)}
        showCityMetrics={showCityMetrics}
        onToggleCityMetrics={() => setShowCityMetrics((p) => !p)}
        timelinePlaying={timelinePlaying}
        onToggleTimelinePlaying={() => setTimelinePlaying((p) => !p)}
        gpsStatus={gpsStatus}
        detectedCropId={cropRecognition.primaryCandidate?.crop.id}
        detectedCropConfidencePct={cropRecognition.primaryCandidate?.confidencePct}
        hasActiveTopRightDrawer={
          showTopRightHubPopover || showPushAlertsDrawer || showDisasterEarlyWarningDrawer
        }
        onCloseTopRightDrawers={() => {
          setShowTopRightHubPopover(false);
          setShowPushAlertsDrawer(false);
          setShowDisasterEarlyWarningDrawer(false);
        }}
        topRightButtons={
          <div className="flex items-center justify-end">
            <button
              type="button"
              data-testid="top-right-hub-trigger-btn"
              onClick={() => {
                setShowTopRightHubPopover((prev) => {
                  const next = !prev;
                  if (next) {
                    setShowPushAlertsDrawer(false);
                    setShowDisasterEarlyWarningDrawer(false);
                  }
                  return next;
                });
              }}
              className={`pointer-events-auto min-h-[40px] sm:min-h-[42px] px-3 sm:px-3.5 py-1.5 rounded-2xl border backdrop-blur-md shadow-2xl flex items-center gap-2 text-[11px] sm:text-xs font-bold cursor-pointer transition-all whitespace-nowrap ${
                showTopRightHubPopover ||
                showPushAlertsDrawer ||
                showDisasterEarlyWarningDrawer ||
                floatingInspectorMode === 'soil' ||
                floatingInspectorMode === 'points'
                  ? 'bg-emerald-600 border-emerald-300 text-white'
                  : 'bg-slate-950/92 hover:bg-slate-900 border-amber-500/50 text-slate-100'
              }`}
            >
              <Sliders className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>{isAr ? 'مركز الحقل والإنذار' : 'Field & Alerts Hub'}</span>
              {topDisaster && (
                <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white font-mono text-[10px] font-bold tabular-nums shrink-0">
                  {topDisaster.probabilityPct}%
                </span>
              )}
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-150 shrink-0 ${
                  showTopRightHubPopover ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>
        }
        topRightDrawers={
          <>
            {/* Unified Floating Popover Menu for the 4 Merged Top-Right Tabs */}
            {showTopRightHubPopover && (
              <div
                data-testid="top-right-hub-popover"
                className="pointer-events-auto w-full max-w-[min(calc(100vw-20px),360px)] bg-slate-950/96 backdrop-blur-xl border border-white/15 rounded-2xl p-3 shadow-2xl space-y-2 text-xs text-slate-100"
              >
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
                  <span className="font-bold text-emerald-300">
                    {isAr
                      ? 'أدوات الحقل والإنذار المبكر والتربة'
                      : 'Field, Soil & Early Warning Tools'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowTopRightHubPopover(false)}
                    className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                    aria-label={isAr ? 'إغلاق القائمة' : 'Close hub menu'}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex flex-col gap-1.5">
                  {topDisaster && (
                    <button
                      type="button"
                      data-testid="map-disaster-early-warning-toggle"
                      onClick={() => {
                        setShowTopRightHubPopover(false);
                        setShowPushAlertsDrawer(false);
                        setShowDisasterEarlyWarningDrawer((prev) => !prev);
                      }}
                      className={`w-full px-3 py-2.5 rounded-xl border flex items-center justify-between gap-2 text-start font-bold cursor-pointer transition-colors ${
                        showDisasterEarlyWarningDrawer
                          ? 'bg-amber-600/30 border-amber-400 text-white'
                          : 'bg-slate-900/90 hover:bg-slate-800 border-amber-500/45 text-amber-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        <div className="min-w-0">
                          <div className="truncate text-xs">
                            {isAr
                              ? `الإنذار المبكر: ${topDisaster.titleAr.replace('إنذار ', '')}`
                              : `Early Warning: ${topDisaster.titleEn}`}
                          </div>
                          <div className="text-[10px] text-slate-400 font-normal truncate">
                            {isAr
                              ? 'توقعات المخاطر البيئية لـ 14 يوماً وبروتوكول الحماية'
                              : '14-day environmental hazard forecast & protection'}
                          </div>
                        </div>
                      </div>
                      <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white font-mono text-[10px] font-bold tabular-nums shrink-0">
                        {topDisaster.probabilityPct}%
                      </span>
                    </button>
                  )}

                  <button
                    type="button"
                    data-testid="open-meteo-push-toggle"
                    onClick={() => {
                      setShowTopRightHubPopover(false);
                      setShowDisasterEarlyWarningDrawer(false);
                      setShowPushAlertsDrawer((prev) => !prev);
                    }}
                    className={`w-full px-3 py-2.5 rounded-xl border flex items-center justify-between gap-2 text-start font-bold cursor-pointer transition-colors ${
                      showPushAlertsDrawer
                        ? 'bg-sky-600/30 border-sky-400 text-white'
                        : 'bg-slate-900/90 hover:bg-slate-800 border-sky-500/40 text-sky-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {pushNotificationsEnabled ? (
                        <Bell className="w-4 h-4 text-sky-400 shrink-0" />
                      ) : (
                        <BellOff className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="truncate text-xs">
                          {isAr ? 'تنبيهات الطقس والأمطار' : 'Weather Push Alerts'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-normal truncate">
                          {isAr
                            ? 'إشعارات الأمطار الغزيرة وموجات الحر عبر Open-Meteo'
                            : 'Open-Meteo heavy rain & extreme heatwave alerts'}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold shrink-0 ${
                        visiblePushAlerts.length > 0
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {visiblePushAlerts.length > 0
                        ? visiblePushAlerts.length
                        : pushNotificationsEnabled
                        ? 'ON'
                        : 'OFF'}
                    </span>
                  </button>

                  <button
                    type="button"
                    data-testid="open-atlas-soil-editor-btn"
                    onClick={() => {
                      setShowTopRightHubPopover(false);
                      setFloatingInspectorMode((prev) => (prev === 'soil' ? null : 'soil'));
                    }}
                    className={`w-full px-3 py-2.5 rounded-xl border flex items-center justify-between gap-2 text-start font-bold cursor-pointer transition-colors ${
                      floatingInspectorMode === 'soil'
                        ? 'bg-emerald-600/30 border-emerald-400 text-white'
                        : 'bg-slate-900/90 hover:bg-slate-800 border-emerald-500/40 text-emerald-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Sliders className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div className="min-w-0">
                        <div className="truncate text-xs">
                          {isAr ? 'ملف التربة والري' : 'Soil Profile & Irrigation'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-normal truncate">
                          {isAr
                            ? `قوام التربة والملوحة (EC ${soil.salinityEC} · pH ${soil.ph})`
                            : `Texture, EC (${soil.salinityEC} dS/m), pH (${soil.ph}) & Irrigation`}
                        </div>
                      </div>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold shrink-0">
                      EC {soil.salinityEC}
                    </span>
                  </button>

                  <button
                    type="button"
                    data-testid="open-virtualized-points-btn"
                    onClick={() => {
                      setShowTopRightHubPopover(false);
                      setFloatingInspectorMode((prev) => (prev === 'points' ? null : 'points'));
                    }}
                    className={`w-full px-3 py-2.5 rounded-xl border flex items-center justify-between gap-2 text-start font-bold cursor-pointer transition-colors ${
                      floatingInspectorMode === 'points'
                        ? 'bg-cyan-600/30 border-cyan-400 text-white'
                        : 'bg-slate-900/90 hover:bg-slate-800 border-cyan-500/40 text-cyan-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Waves className="w-4 h-4 text-cyan-300 shrink-0" />
                      <div className="min-w-0">
                        <div className="truncate text-xs">
                          {isAr
                            ? `نقاط DEM وصرف المياه (${virtualFieldPoints.length})`
                            : `DEM Drainage Points (${virtualFieldPoints.length})`}
                        </div>
                        <div className="text-[10px] text-slate-400 font-normal truncate">
                          {isAr
                            ? 'مصفوفة ارتفاعات الحقل ومخاطر تجمع المياه'
                            : 'Field elevation matrix & waterlogging depressions'}
                        </div>
                      </div>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-200 font-mono text-[10px] font-bold tabular-nums shrink-0">
                      {virtualFieldPoints.length}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Live Open-Meteo Push Notification Toast Cards for Active Study Zone */}
            {visiblePushAlerts.map((alert) => {
              const isRain = alert.type === 'heavy_rain';
              return (
                <div
                  key={alert.id}
                  data-testid="open-meteo-push-toast"
                  className={`pointer-events-auto w-full max-w-[min(calc(100vw-20px),370px)] rounded-2xl p-3 shadow-2xl border backdrop-blur-md space-y-1.5 text-xs ${
                    isRain
                      ? 'bg-slate-950/96 border-sky-500/60 text-slate-100'
                      : 'bg-slate-950/96 border-amber-500/60 text-slate-100'
                  }`}
                >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 font-bold">
                  {isRain ? (
                    <CloudRain className="w-4 h-4 text-sky-400 shrink-0" />
                  ) : (
                    <ThermometerSun className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                  <span className={isRain ? 'text-sky-300' : 'text-amber-300'}>
                    {isAr ? alert.titleAr : alert.titleEn}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold tabular-nums ${
                      isRain ? 'bg-sky-600 text-white' : 'bg-rose-600 text-white'
                    }`}
                  >
                    {alert.metricBadge}
                  </span>
                  {onDismissPushAlert && (
                    <button
                      type="button"
                      onClick={() => onDismissPushAlert(alert.id)}
                      aria-label={isAr ? 'إغلاق الإشعار' : 'Dismiss alert'}
                      className="p-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {isAr ? alert.bodyAr : alert.bodyEn}
              </p>
            </div>
          );
        })}

        {/* Open-Meteo Push Notification Controls Drawer */}
        {showPushAlertsDrawer && (
          <div
            data-testid="open-meteo-push-drawer"
            className="pointer-events-auto w-full max-w-[min(calc(100vw-20px),370px)] bg-slate-950/96 border border-sky-500/50 rounded-2xl p-3.5 shadow-2xl space-y-2.5 text-xs text-slate-100"
          >
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
              <div className="flex items-center gap-1.5 font-bold text-sky-300">
                <Bell className="w-4 h-4 shrink-0" />
                <span>
                  {isAr
                    ? 'تنبيهات Open-Meteo للزونة النشطة'
                    : 'Open-Meteo Zone Push Alerts'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowPushAlertsDrawer(false)}
                className="p-1 rounded-lg bg-slate-900 hover:bg-rose-600 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-300">
                {isAr ? 'إشعارات الأمطار وموجات الحر' : 'Rain & Heatwave Push'}
              </span>
              {onTogglePushNotifications && (
                <button
                  type="button"
                  onClick={onTogglePushNotifications}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                    pushNotificationsEnabled
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {pushNotificationsEnabled
                    ? isAr
                      ? 'مفعّل'
                      : 'Enabled'
                    : isAr
                    ? 'متوقف'
                    : 'Paused'}
                </button>
              )}
            </div>

            {notificationPermission !== 'granted' &&
              notificationPermission !== 'unsupported' &&
              onEnableBrowserPushNotifications && (
                <button
                  type="button"
                  data-testid="enable-browser-push-btn"
                  onClick={onEnableBrowserPushNotifications}
                  className="w-full py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>
                    {isAr
                      ? 'تفعيل إشعارات الدفع في المتصفح (Web Push)'
                      : 'Enable Browser Web Push Notifications'}
                  </span>
                </button>
              )}

            {notificationPermission === 'granted' && (
              <div className="px-2.5 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[11px]">
                {isAr
                  ? '✓ إشعارات المتصفح مفعّلة وجاهزة لإخطارك تلقائياً.'
                  : '✓ Browser push notifications are active and armed.'}
              </div>
            )}

            <div className="text-[11px] text-slate-400 leading-relaxed">
              {vertices.length < 3
                ? isAr
                  ? 'حدد زونة دراسة على الخريطة ليقوم Open-Meteo برصد الأمطار الغزيرة (≥10 مم) وموجات الحر الشديدة (≥37°م) تلقائياً.'
                  : 'Draw a study zone on the map to monitor Open-Meteo heavy rainfall (≥10 mm) and extreme heatwaves (≥37°C).'
                : activePushAlerts.length === 0
                ? isAr
                  ? '✓ الحالة الجوية مستقرة للزونة المحددة — لا توجد أمطار غزيرة أو موجات حر متوقعة خلال أسبوعين.'
                  : '✓ Weather is calm for your selected study zone — no heavy rain or extreme heatwaves forecast.'
                : isAr
                ? `تم رصد ${activePushAlerts.length} تنبيه جوي حرج مؤثر على زونة الدراسة.`
                : `${activePushAlerts.length} critical weather alert(s) detected for your study zone.`}
            </div>
          </div>
        )}

        {showDisasterEarlyWarningDrawer && topDisaster && (
            <div
              data-testid="map-disaster-early-warning-drawer"
              className="pointer-events-auto w-full max-w-[min(calc(100vw-20px),430px)] max-h-[min(64dvh,520px)] overflow-y-auto bg-slate-950/96 border border-amber-500/50 rounded-2xl p-4 shadow-2xl space-y-3 text-xs text-slate-100"
            >
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
                <div className="flex items-center gap-1.5 font-bold text-amber-400">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>
                    {isAr
                      ? 'منظومة الإنذار المبكر للكوارث البيئية (14 يوماً)'
                      : '14-Day Environmental Disaster Early Warning'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDisasterEarlyWarningDrawer(false)}
                  className="p-1 rounded-lg bg-slate-900 hover:bg-rose-600 text-slate-300 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-wrap gap-1">
                {disasterWarnings.map((w, idx) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => setActiveDisasterIdx(idx)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                      idx === activeDisasterIdx
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {w.disasterType === 'sandstorm_wind'
                      ? isAr
                        ? 'عواصف ورياح'
                        : 'Dust/Wind'
                      : w.disasterType === 'severe_drought'
                      ? isAr
                        ? 'جفاف وملوحة'
                        : 'Drought'
                      : w.disasterType === 'heatwave'
                      ? isAr
                        ? 'موجات حر'
                        : 'Heatwave'
                      : w.disasterType === 'flash_flood'
                      ? isAr
                        ? 'سيول وأمطار'
                        : 'Flash Flood'
                      : isAr
                      ? 'صقيع ليلي'
                      : 'Night Frost'}{' '}
                    ({w.probabilityPct}%)
                  </button>
                ))}
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 border border-white/10 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-white">
                    {isAr ? topDisaster.titleAr : topDisaster.titleEn}
                  </span>
                  <span className="font-mono text-[10px] text-amber-300 shrink-0 tabular-nums">
                    {topDisaster.countdownHours}h
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  {isAr ? topDisaster.triggerMetricsAr : topDisaster.triggerMetricsEn}
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="font-bold text-amber-300 text-[11px]">
                  {isAr
                    ? 'إجراءات الحماية الفورية للحقل (قبل الحدث 72–24 ساعة):'
                    : 'Immediate Field Protection Protocol (Pre-Event 72–24h):'}
                </div>
                <ul className="space-y-1 text-[11px] text-slate-200 list-disc list-inside leading-relaxed">
                  {(isAr
                    ? topDisaster.emergencyProtocol.preEvent72to24hAr
                    : topDisaster.emergencyProtocol.preEvent72to24hEn
                  ).map((st, i) => (
                    <li key={i}>{st}</li>
                  ))}
                </ul>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-1.5">
                <div className="font-bold text-emerald-300 flex items-center gap-1 text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>
                    {isAr
                      ? 'أفضل الأصناف المقاومة لهذه المخاطر (اضغط للاعتماد):'
                      : 'Recommended Hazard-Resilient Cultivars:'}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {topDisaster.resilientCrops.map((rc) => (
                    <div
                      key={rc.cropId}
                      className="p-2 rounded-lg bg-slate-900/90 border border-white/10 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-white truncate">
                          {isAr ? rc.cropNameAr : rc.cropNameEn} —{' '}
                          <span className="text-emerald-400">
                            {isAr ? rc.cultivarAr : rc.cultivarEn}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {isAr ? rc.toleranceMechanismAr : rc.toleranceMechanismEn}
                        </div>
                      </div>
                      {onChangeCurrentCrop && (
                        <button
                          type="button"
                          onClick={() => onChangeCurrentCrop(rc.cropId)}
                          className={`px-2 py-1 rounded text-[10px] font-bold shrink-0 cursor-pointer ${
                            currentCropId === rc.cropId
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-800 text-emerald-300 hover:bg-emerald-600 hover:text-white'
                          }`}
                        >
                          {currentCropId === rc.cropId
                            ? isAr
                              ? '✓ معتمد'
                              : '✓ Active'
                            : isAr
                            ? 'اعتماد'
                            : 'Adopt'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          </>
        }
      />

      {showScientificTable && (
        <div
          data-testid="scientific-standards-modal"
          className="absolute bottom-[68px] sm:bottom-16 left-3 right-3 sm:right-auto sm:w-[520px] max-h-[min(60dvh,500px)] overflow-y-auto z-40 bg-slate-950/96 border border-emerald-500/45 rounded-2xl p-4 shadow-2xl space-y-3"
        >
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" />
                <span>{isAr ? unifiedSpec.titleAr : unifiedSpec.titleEn}</span>
              </h3>
              <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                {unifiedSpec.formulaCode}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowScientificTable(false)}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-600 text-slate-300 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {isAr ? unifiedSpec.methodologyAr : unifiedSpec.methodologyEn}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 text-[11px]">
                  <th className="py-1.5 px-2 text-start">{isAr ? 'اللون' : 'Color'}</th>
                  <th className="py-1.5 px-2 text-start">{isAr ? 'المدى' : 'Range'}</th>
                  <th className="py-1.5 px-2 text-start">{isAr ? 'التصنيف' : 'Class'}</th>
                  <th className="py-1.5 px-2 text-start">{isAr ? 'الدلالة' : 'Meaning'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {unifiedSpec.colorStops.map((stop, idx) => (
                  <tr key={idx}>
                    <td className="py-2 px-2">
                      <span
                        className="inline-block w-4 h-4 rounded-sm border border-white/30"
                        style={{ backgroundColor: stop.color }}
                      />
                    </td>
                    <td className="py-2 px-2 font-mono text-[11px] text-emerald-300 whitespace-nowrap">
                      {stop.rangeLabel}
                    </td>
                    <td className="py-2 px-2 font-bold text-white whitespace-nowrap">
                      {isAr ? stop.labelAr : stop.labelEn}
                    </td>
                    <td className="py-2 px-2 text-slate-300 text-[11px]">
                      {isAr ? stop.meaningAr : stop.meaningEn}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {floatingInspectorMode !== null && (
        <div
          data-testid="atlas-floating-inspector"
          className="absolute bottom-[136px] sm:bottom-16 right-3 left-3 sm:right-20 sm:left-auto sm:w-[405px] max-h-[min(60dvh,500px)] overflow-y-auto z-40 bg-slate-950/96 border border-white/15 rounded-2xl p-4 shadow-2xl space-y-3"
        >
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setFloatingInspectorMode('pixel')}
                className={`px-2 py-1 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer ${
                  floatingInspectorMode === 'pixel'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {isAr ? 'البكسل' : 'Pixel'}
              </button>
              <button
                type="button"
                onClick={() => setFloatingInspectorMode('zone')}
                className={`px-2 py-1 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                  floatingInspectorMode === 'zone'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3 h-3 shrink-0" />
                <span>{isAr ? 'القطاعات' : 'Zones'}</span>
              </button>
              <button
                type="button"
                onClick={() => setFloatingInspectorMode('soil')}
                className={`px-2 py-1 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                  floatingInspectorMode === 'soil'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sliders className="w-3 h-3 shrink-0" />
                <span>{isAr ? 'التربة' : 'Soil'}</span>
              </button>
              <button
                type="button"
                data-testid="inspector-tab-points"
                onClick={() => setFloatingInspectorMode('points')}
                className={`px-2 py-1 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                  floatingInspectorMode === 'points'
                    ? 'bg-cyan-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Waves className="w-3 h-3 shrink-0" />
                <span>{isAr ? 'نقاط DEM' : 'DEM Pts'}</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setFloatingInspectorMode(null)}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-600 text-slate-300 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {floatingInspectorMode === 'points' && (
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                    <Waves className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {isAr
                        ? `مصفوفة صرف المياه والمنخفضات (${virtualFieldPoints.length})`
                        : `DEM Drainage Matrix (${virtualFieldPoints.length} pts)`}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {isAr
                      ? 'قائمة افتراضية (react-window) لتقليل الذاكرة عند التكبير والتحديث'
                      : 'Virtualized via react-window for low-memory zoom & point updates'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1">
                {(
                  [
                    { id: 'lowest_elevation', ar: 'الأقل ارتفاعاً', en: 'Lowest Elev' },
                    { id: 'highest_risk', ar: 'خطر التغدق', en: 'Flood Risk' },
                    { id: 'grid_order', ar: 'ترتيب الحقل', en: 'Grid Order' },
                  ] as const
                ).map((sOpt) => (
                  <button
                    key={sOpt.id}
                    type="button"
                    onClick={() => setVirtualPointSortBy(sOpt.id)}
                    className={`py-1 px-1.5 rounded-lg text-[10px] font-bold border cursor-pointer ${
                      virtualPointSortBy === sOpt.id
                        ? 'bg-cyan-600 border-cyan-400 text-white'
                        : 'bg-slate-900 border-white/10 text-slate-300 hover:text-white'
                    }`}
                  >
                    {isAr ? sOpt.ar : sOpt.en}
                  </button>
                ))}
              </div>

              <div
                data-testid="virtualized-field-points-list"
                className="rounded-xl border border-white/10 bg-slate-950/80 overflow-hidden"
              >
                <List
                  rowComponent={VirtualizedFieldPointRow}
                  rowCount={virtualFieldPoints.length}
                  rowHeight={56}
                  overscanCount={4}
                  rowProps={{
                    items: virtualFieldPoints,
                    isAr,
                    selectedPointId: selectedVirtualPointId,
                    onFocusPoint: handleFocusVirtualizedPoint,
                  }}
                  style={{ height: 248, width: '100%' }}
                />
              </div>
            </div>
          )}

          {floatingInspectorMode === 'pixel' && selectedCell && (
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {isAr ? `زونا ${selectedCell.subZoneId}` : `Zone ${selectedCell.subZoneId}`}
                </span>
                <span className="font-mono text-[11px] text-slate-400">
                  {selectedCell.center.lat.toFixed(4)}°N, {selectedCell.center.lng.toFixed(4)}°E
                </span>
              </div>
              {(() => {
                const vegVisual = resolveZoneCellVegetationOverlayVisual(
                  selectedCell,
                  isSoilMoistureActive ? 'soil_moisture' : activeThematicMap,
                  activeLayer
                );
                const activeEval = evaluateCellForUnifiedLayer(
                  selectedCell,
                  isSoilMoistureActive ? 'soil_moisture' : activeThematicMap,
                  activeLayer,
                  forecast14,
                  selectedMoistureDayIdx,
                  isAr,
                  elevationPalette
                );
                return (
                  <div className="space-y-1.5">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-emerald-500/35 flex items-center justify-between">
                      <span className="font-semibold text-slate-200">{activeLayer}</span>
                      <span className="font-mono font-bold text-emerald-400 tabular-nums">
                        {activeEval.valueFormatted}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900/90 border border-white/10 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-300">
                        {isAr ? vegVisual.labelAr : vegVisual.labelEn}
                      </span>
                      <span
                        className={`w-3 h-3 rounded-sm border border-white/30 shrink-0 ${
                          !vegVisual.shouldColor ? 'bg-transparent' : ''
                        }`}
                        style={
                          vegVisual.colorHex ? { backgroundColor: vegVisual.colorHex } : undefined
                        }
                      />
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {floatingInspectorMode === 'zone' && activeZoneObj && (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-1.5">
                {(['A', 'B', 'C'] as const).map((zid) => (
                  <button
                    key={zid}
                    type="button"
                    onClick={() => setSelectedZoneTab(zid)}
                    className={`py-1.5 rounded-xl font-bold border cursor-pointer ${
                      selectedZoneTab === zid
                        ? 'bg-emerald-600 border-emerald-400 text-white'
                        : 'bg-slate-900 border-white/10 text-slate-300'
                    }`}
                  >
                    {isAr ? `قطاع ${zid}` : `Zone ${zid}`}
                  </button>
                ))}
              </div>
              {gridCells.length > 0 && (
                <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                  <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-500/35 text-center">
                    <div className="font-mono font-bold text-emerald-300 tabular-nums">
                      {zoneCoverCounts.activeCrop}
                    </div>
                    <div className="text-slate-300 truncate">
                      {isAr ? 'زراعي نشط' : 'Active Crop'}
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-lime-950/60 border border-lime-400/35 text-center">
                    <div className="font-mono font-bold text-lime-300 tabular-nums">
                      {zoneCoverCounts.fallowClay}
                    </div>
                    <div className="text-slate-300 truncate">
                      {isAr ? 'بور / طينية' : 'Fallow Clay'}
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-white/15 text-center">
                    <div className="font-mono font-bold text-slate-300 tabular-nums">
                      {zoneCoverCounts.excludedBuiltOrWater}
                    </div>
                    <div className="text-slate-400 truncate">
                      {isAr ? 'مباني مستبعدة' : 'Excluded'}
                    </div>
                  </div>
                </div>
              )}
              <div className="p-3 rounded-xl bg-slate-900 border border-white/10 space-y-1.5">
                <div className="flex justify-between font-bold text-white">
                  <span>{isAr ? activeZoneObj.nameAr : activeZoneObj.nameEn}</span>
                  <span className="font-mono text-emerald-400">
                    {activeZoneObj.areaFeddans} {isAr ? 'فدان' : 'fed'}
                  </span>
                </div>
                <p className="text-slate-300">
                  {isAr ? activeZoneObj.diagnosisAr : activeZoneObj.diagnosisEn}
                </p>
              </div>
              {vertices.length >= 3 && onChangeCurrentCrop && (
                <CropRecognitionPanel
                  language={language}
                  recognition={cropRecognition}
                  currentCropId={currentCropId}
                  onApplyRecognizedCrop={(cid) => onChangeCurrentCrop(cid)}
                  showCropDistributionOnMap={false}
                  onToggleCropDistributionOnMap={() => {}}
                  visualAnalysis={visualLeafAnalysis}
                  onChangeVisualAnalysis={setVisualLeafAnalysis}
                />
              )}
            </div>
          )}

          {floatingInspectorMode === 'soil' && (
            <div data-testid="atlas-soil-profile-editor" className="space-y-3 text-xs">
              {/* Target Delineated Farm Zone Selector */}
              {zones.length > 0 && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {isAr
                      ? 'الزونة الزراعية المستهدفة (تخصيص ملف التربة لكل زونة)'
                      : 'Target Delineated Farm Zone'}
                  </label>
                  <select
                    data-testid="atlas-soil-target-zone-select"
                    value={activeZoneId || zones[0]?.id || ''}
                    onChange={(e) => {
                      const zid = e.target.value;
                      onSelectActiveZone?.(zid);
                    }}
                    className="w-full h-9 px-2.5 rounded-xl bg-slate-900 border border-emerald-500/40 text-white font-semibold"
                  >
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {isAr ? z.nameAr : z.nameEn} ({z.area.feddans} {isAr ? 'فدان' : 'fed'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* 1. Soil Texture (Clay, Loamy, Sandy, Calcareous + Custom) */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {isAr ? 'قوام التربة (Soil Texture)' : 'Soil Texture'}
                </label>
                <div className="grid grid-cols-2 gap-1.5 mb-1.5">
                  {(
                    [
                      { id: 'clay', ar: 'طينية (Clay)', en: 'Clay' },
                      { id: 'loamy', ar: 'طميية (Loamy)', en: 'Loamy' },
                      { id: 'sandy', ar: 'رملية (Sandy)', en: 'Sandy' },
                      { id: 'calcareous', ar: 'جيرية (Calcareous)', en: 'Calcareous' },
                    ] as const
                  ).map((opt) => {
                    const active = !isCustomSoilMode && soil.texture === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        data-testid={`atlas-soil-texture-btn-${opt.id}`}
                        onClick={() => {
                          setIsCustomSoilMode(false);
                          setCustomSoilInput('');
                          const nextSoil: SoilProfile = {
                            ...soil,
                            texture: opt.id,
                            customTextureLabel: undefined,
                          };
                          onChangeSoil?.(nextSoil);
                          if (activeZoneId) onUpdateZoneSoil?.(activeZoneId, nextSoil);
                        }}
                        className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border cursor-pointer transition-colors ${
                          active
                            ? 'bg-emerald-600 border-emerald-400 text-white'
                            : 'bg-slate-900 border-white/15 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {isAr ? opt.ar : opt.en}
                      </button>
                    );
                  })}
                </div>
                <select
                  data-testid="atlas-soil-texture-select"
                  value={isCustomSoilMode ? '__custom__' : soil.texture}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '__custom__') {
                      setIsCustomSoilMode(true);
                    } else {
                      setIsCustomSoilMode(false);
                      setCustomSoilInput('');
                      const nextSoil: SoilProfile = {
                        ...soil,
                        texture: val as SoilTexture,
                        customTextureLabel: undefined,
                      };
                      onChangeSoil?.(nextSoil);
                      if (activeZoneId) onUpdateZoneSoil?.(activeZoneId, nextSoil);
                    }
                  }}
                  className="w-full h-9 px-2.5 rounded-xl bg-slate-900 border border-white/15 text-white"
                >
                  <option value="clay">{isAr ? 'طينية (Clay)' : 'Clay'}</option>
                  <option value="loamy">{isAr ? 'طميية (Loamy)' : 'Loamy'}</option>
                  <option value="sandy">{isAr ? 'رملية (Sandy)' : 'Sandy'}</option>
                  <option value="calcareous">{isAr ? 'جيرية (Calcareous)' : 'Calcareous'}</option>
                  <option value="__custom__">
                    {isAr ? 'أخرى / كتابة قوام مخصص...' : 'Other / Custom texture...'}
                  </option>
                </select>
                {isCustomSoilMode && (
                  <div className="mt-1.5 flex gap-1.5">
                    <input
                      type="text"
                      data-testid="atlas-soil-custom-texture-input"
                      value={customSoilInput}
                      onChange={(e) => setCustomSoilInput(e.target.value)}
                      placeholder={
                        isAr ? 'اكتب قوام التربة يدوياً...' : 'Type custom soil texture...'
                      }
                      className="flex-1 h-8 px-2.5 rounded-lg bg-slate-900 border border-emerald-500/60 text-white outline-none"
                    />
                    <button
                      type="button"
                      data-testid="atlas-soil-custom-texture-apply-btn"
                      onClick={() => {
                        if (!customSoilInput.trim()) return;
                        const resolved = resolveCustomSoilTextureReference(customSoilInput);
                        const nextSoil: SoilProfile = {
                          ...soil,
                          texture: resolved.canonicalTexture,
                          customTextureLabel: resolved.customTextureLabel,
                        };
                        onChangeSoil?.(nextSoil);
                        if (activeZoneId) onUpdateZoneSoil?.(activeZoneId, nextSoil);
                      }}
                      className="px-2.5 h-8 rounded-lg bg-emerald-600 text-white font-bold cursor-pointer"
                    >
                      {isAr ? 'تطبيق' : 'Apply'}
                    </button>
                  </div>
                )}
              </div>

              {/* 2. Salinity (EC dS/m) & Soil pH */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10">
                <div className="space-y-1">
                  <label className="block text-slate-300 font-semibold text-[11px]">
                    {isAr ? 'الملوحة (EC dS/m)' : 'Salinity (EC dS/m)'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="25"
                    data-testid="atlas-soil-ec-input"
                    value={soil.salinityEC}
                    onChange={(e) => {
                      const num = Number(e.target.value);
                      if (!Number.isFinite(num)) return;
                      const clamped = Math.max(0.1, Math.min(25, Number(num.toFixed(2))));
                      const nextSoil: SoilProfile = { ...soil, salinityEC: clamped };
                      onChangeSoil?.(nextSoil);
                      if (activeZoneId) onUpdateZoneSoil?.(activeZoneId, nextSoil);
                    }}
                    className="w-full h-8 px-2 rounded-lg bg-slate-900 border border-white/15 font-mono font-bold text-amber-300 tabular-nums"
                  />
                  <div className="flex flex-wrap gap-1">
                    {[1.2, 2.2, 3.5, 5.2].map((presetEc) => (
                      <button
                        key={presetEc}
                        type="button"
                        data-testid={`atlas-soil-ec-preset-${presetEc}`}
                        onClick={() => {
                          const nextSoil: SoilProfile = { ...soil, salinityEC: presetEc };
                          onChangeSoil?.(nextSoil);
                          if (activeZoneId) onUpdateZoneSoil?.(activeZoneId, nextSoil);
                        }}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer border ${
                          Math.abs(soil.salinityEC - presetEc) < 0.08
                            ? 'bg-amber-500 border-amber-300 text-slate-950'
                            : 'bg-slate-900 border-white/10 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {presetEc}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-300 font-semibold text-[11px]">
                    {isAr ? 'حموضة التربة (pH)' : 'Soil Reaction (pH)'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="4.0"
                    max="9.8"
                    data-testid="atlas-soil-ph-input"
                    value={soil.ph}
                    onChange={(e) => {
                      const num = Number(e.target.value);
                      if (!Number.isFinite(num)) return;
                      const clamped = Math.max(4.0, Math.min(9.8, Number(num.toFixed(2))));
                      const nextSoil: SoilProfile = { ...soil, ph: clamped };
                      onChangeSoil?.(nextSoil);
                      if (activeZoneId) onUpdateZoneSoil?.(activeZoneId, nextSoil);
                    }}
                    className="w-full h-8 px-2 rounded-lg bg-slate-900 border border-white/15 font-mono font-bold text-cyan-300 tabular-nums"
                  />
                  <div className="flex flex-wrap gap-1">
                    {[6.5, 7.2, 7.8, 8.3].map((presetPh) => (
                      <button
                        key={presetPh}
                        type="button"
                        data-testid={`atlas-soil-ph-preset-${presetPh}`}
                        onClick={() => {
                          const nextSoil: SoilProfile = { ...soil, ph: presetPh };
                          onChangeSoil?.(nextSoil);
                          if (activeZoneId) onUpdateZoneSoil?.(activeZoneId, nextSoil);
                        }}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer border ${
                          Math.abs(soil.ph - presetPh) < 0.08
                            ? 'bg-cyan-500 border-cyan-300 text-slate-950'
                            : 'bg-slate-900 border-white/10 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {presetPh}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. Irrigation System Type (Flood, Drip, Sprinkler, Pivot, Rainfed) */}
              <div className="pt-1 border-t border-white/10">
                <label className="block text-slate-300 font-semibold mb-1">
                  {isAr ? 'نظام الري المعتمد (Irrigation System)' : 'Irrigation System Type'}
                </label>
                <div className="grid grid-cols-3 gap-1 mb-1.5">
                  {(
                    [
                      { id: 'drip', ar: 'تنقيط (Drip)', en: 'Drip' },
                      { id: 'pivot', ar: 'بيفوت (Pivot)', en: 'Pivot' },
                      { id: 'sprinkler', ar: 'رشاشات (Sprinkler)', en: 'Sprinkler' },
                      { id: 'flood', ar: 'غمر (Flood)', en: 'Flood' },
                      { id: 'rainfed', ar: 'مطري/بعلي (Rainfed)', en: 'Rainfed' },
                    ] as const
                  ).map((irr) => (
                    <button
                      key={irr.id}
                      type="button"
                      data-testid={`atlas-soil-irrigation-btn-${irr.id}`}
                      onClick={() => {
                        const nextSoil: SoilProfile = { ...soil, irrigation: irr.id };
                        onChangeSoil?.(nextSoil);
                        if (activeZoneId) onUpdateZoneSoil?.(activeZoneId, nextSoil);
                      }}
                      className={`py-1.5 px-1.5 rounded-lg text-[10px] font-bold border cursor-pointer truncate ${
                        soil.irrigation === irr.id
                          ? 'bg-sky-600 border-sky-300 text-white'
                          : 'bg-slate-900 border-white/15 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {isAr ? irr.ar : irr.en}
                    </button>
                  ))}
                </div>
                <select
                  data-testid="atlas-soil-irrigation-select"
                  value={soil.irrigation}
                  onChange={(e) => {
                    const nextSoil: SoilProfile = {
                      ...soil,
                      irrigation: e.target.value as IrrigationSystem,
                    };
                    onChangeSoil?.(nextSoil);
                    if (activeZoneId) onUpdateZoneSoil?.(activeZoneId, nextSoil);
                  }}
                  className="w-full h-9 px-2.5 rounded-xl bg-slate-900 border border-white/15 text-white"
                >
                  <option value="drip">{isAr ? 'تنقيط (Drip)' : 'Drip'}</option>
                  <option value="pivot">{isAr ? 'محوري / بيفوت (Pivot)' : 'Center Pivot'}</option>
                  <option value="sprinkler">{isAr ? 'رشاشات (Sprinkler)' : 'Sprinkler'}</option>
                  <option value="flood">{isAr ? 'غمر سطحي (Flood)' : 'Surface Flood'}</option>
                  <option value="rainfed">{isAr ? 'زراعة مطرية / بعلية (Rainfed)' : 'Rainfed (Dryland)'}</option>
                </select>
              </div>

              {/* Live Coupled Spectral & Soil Impact Preview */}
              <div
                data-testid="atlas-soil-coupled-metrics"
                className="p-2.5 rounded-xl bg-slate-900/95 border border-emerald-500/30 space-y-1.5"
              >
                <div className="text-[10px] font-bold text-emerald-300 flex items-center justify-between">
                  <span>
                    {isAr
                      ? 'الأثر المباشر على التحليل الطيفي والتربة'
                      : 'Coupled Spectral & Soil Readout'}
                  </span>
                  <span className="font-mono text-slate-400">Live</span>
                </div>
                <div className="grid grid-cols-4 gap-1 text-center font-mono text-[10px] tabular-nums">
                  <div className="p-1.5 rounded-lg bg-slate-950 border border-white/10">
                    <div className="text-slate-400">NDVI</div>
                    <div className="font-bold text-emerald-400">{farmAverages.NDVI.toFixed(2)}</div>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-950 border border-white/10">
                    <div className="text-slate-400">SAVI</div>
                    <div className="font-bold text-lime-300">{farmAverages.SAVI.toFixed(2)}</div>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-950 border border-white/10">
                    <div className="text-slate-400">EC</div>
                    <div className="font-bold text-amber-300">{farmAverages.SOIL_EC.toFixed(2)}</div>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-950 border border-white/10">
                    <div className="text-slate-400">pH</div>
                    <div className="font-bold text-cyan-300">{farmAverages.SOIL_PH.toFixed(2)}</div>
                  </div>
                </div>
              </div>

              {onChangeCurrentCrop && (
                <div className="pt-1 border-t border-white/10">
                  <label className="block text-slate-300 font-semibold mb-1">
                    {isAr ? 'المحصول الحالي' : 'Active Crop'}
                  </label>
                  <select
                    value={isCustomCropMode ? '__custom__' : currentCropId}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '__custom__') {
                        setIsCustomCropMode(true);
                      } else {
                        setIsCustomCropMode(false);
                        setCustomCropInput('');
                        onChangeCurrentCrop(val, undefined);
                      }
                    }}
                    className="w-full h-9 px-2.5 rounded-xl bg-slate-900 border border-white/15 text-white"
                  >
                    {CROP_DATABASE.map((c) => (
                      <option key={c.id} value={c.id}>
                        {isAr ? c.nameAr : c.nameEn}
                      </option>
                    ))}
                    <option value="__custom__">
                      {isAr ? 'أخرى / كتابة محصول يدوي...' : 'Other / Custom crop...'}
                    </option>
                  </select>
                  {isCustomCropMode && (
                    <div className="mt-1.5 flex gap-1.5">
                      <input
                        type="text"
                        value={customCropInput}
                        onChange={(e) => setCustomCropInput(e.target.value)}
                        placeholder={
                          isAr ? 'اكتب اسم المحصول يدوياً...' : 'Type custom crop name...'
                        }
                        className="flex-1 h-8 px-2.5 rounded-lg bg-slate-900 border border-emerald-500/60 text-white outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!customCropInput.trim()) return;
                          const resolved = resolveCustomCropReference(customCropInput);
                          onChangeCurrentCrop(resolved.canonicalCropId, resolved.customCropLabel);
                        }}
                        className="px-2.5 h-8 rounded-lg bg-emerald-600 text-white font-bold cursor-pointer"
                      >
                        {isAr ? 'تطبيق' : 'Apply'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
