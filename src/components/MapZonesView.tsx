import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, BookOpen, Layers, MapPin, ShieldCheck, Sliders, X } from 'lucide-react';
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
  evaluateEnvironmentalDisasterWarnings,
  getPolygonCentroid,
} from '../utils/agroEngine';
import {
  SoilMoistureGridNode,
  SpatialWindVectorPoint,
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
import { applyBilinearSmoothingToSpatialGridMatrix } from '../utils/satellitePixelAnalyzer';
import {
  evaluateCellForUnifiedLayer,
  resolveUnifiedActiveLayerSpec,
} from '../utils/unifiedLayerManager';
import {
  VisualLeafPhotoAnalysis,
  identifyPlantedCropInZone,
} from '../utils/cropRecognitionEngine';
import { CropRecognitionPanel } from './CropRecognitionPanel';
import { PendingZoneDraft } from './MultiZoneManagerBar';
import {
  CesiumEarthStage,
  CesiumFlyTarget,
  CesiumZoomCommand,
} from './CesiumEarthStage';
import {
  InspectedTelemetrySnapshot,
  MapFloatingHud,
} from './MapFloatingHud';

export type RegionDrawingToolMode = 'none' | 'freehand' | 'rectangle';

/**
 * Dynamic Land-Coverage Correction & 2D Bilinear Interpolation Smoothing Function
 * (`دالة تصحيح ديناميكية وتنعيم Bilinear Interpolation على مصفوفة بيانات Esri Tiles`).
 * Guarantees 100% continuous coverage of all 10 satellite spectral & soil indices
 * (`NDVI`, `SAVI`, `NDWI`, `NDMI`, `EVI`, `LST`, `SM_0_7`, `SM_7_28`, `SOIL_EC`, `SOIL_PH`)
 * across all landmass and coastal boundaries while eliminating blocky pixelation artifacts.
 */
export function applyDynamicLandCoverageAndBilinearTileSmoothing(
  rawCells: SpatialGridCell[],
  vertices: LatLon[],
  soil: SoilProfile,
  activeWeatherDay?: DailyWeatherPoint
): SpatialGridCell[] {
  if (!rawCells || rawCells.length === 0) return [];

  // Step 1: Apply 2D Bilinear Interpolation kernel (1 - u)*(1 - v) over the cropped Esri tile matrix
  const bilinearCells = applyBilinearSmoothingToSpatialGridMatrix(rawCells, vertices, soil);

  // Step 2: Enforce 100% land-boundary coverage & coastal anti-aliasing across all 10 spectral indices
  const spectralKeys: SpectralIndexKey[] = [
    'NDVI',
    'SAVI',
    'NDWI',
    'NDMI',
    'EVI',
    'LST',
    'SM_0_7',
    'SM_7_28',
    'SOIL_EC',
    'SOIL_PH',
  ];

  return bilinearCells.map((cell) => {
    const { lat, lng } = cell.center;
    const isOcean = isMarineOrOceanWaterAtLatLon(lat, lng);
    // Guarantee land coverage even on low-lying coastal / delta / peninsula boundaries
    const correctedValues: Record<SpectralIndexKey, number> = { ...cell.values };

    for (const key of spectralKeys) {
      const currentVal = correctedValues[key];
      const spatialRef = evaluateSpatialSpectralOrSoilAtLatLon(
        lat,
        lng,
        key,
        activeWeatherDay
      ).numericValue;

      if (!Number.isFinite(currentVal)) {
        correctedValues[key] = spatialRef;
      } else if (!isOcean && cell.landCover !== 'urban_built') {
        // Blend 82% Bilinear Esri-tile radiometry + 18% continuous land-boundary reference
        // so coastal/boundary cells never drop out or show stair-step pixelation
        const blended = currentVal * 0.82 + spatialRef * 0.18;
        correctedValues[key] =
          key === 'LST' || key === 'SM_0_7' || key === 'SM_7_28'
            ? Number(blended.toFixed(1))
            : Number(blended.toFixed(2));
      }
    }

    return {
      ...cell,
      values: correctedValues,
    };
  });
}

interface MapZonesViewProps {
  language: Language;
  activeTab: string;
  selectedPresetId?: string;
  onSelectPreset?: (preset: PresetFarmZone) => void;
  vertices: LatLon[];
  onChangeVertices: (vertices: LatLon[]) => void;
  soil: SoilProfile;
  onChangeSoil: (soil: SoilProfile) => void;
  currentCropId: string;
  onChangeCurrentCrop: (cropId: string) => void;
  area: AreaBreakdown;
  subZones: SubZoneSummary[];
  gridCells: SpatialGridCell[];
  farmAverages: Record<SpectralIndexKey, number>;
  activeLayer: SpectralIndexKey;
  onChangeActiveLayer: (layer: SpectralIndexKey) => void;
  activeThematicMap: ThematicMapLayerId;
  onChangeThematicMap: (m: ThematicMapLayerId) => void;
  onOpenFullScreenAtlas: () => void;
  forecast14: DailyWeatherPoint[];
  selectedMoistureDayIdx: number;
  onChangeMoistureDayIdx: (idx: number) => void;
  onDownloadPdfReport: () => void;
  radiometricSource?: 'satellite-tile-pixel-calibrated' | 'agro-coupled-model';
  zones?: UserStudyZone[];
  activeZoneId?: string | null;
  comparedZoneIds?: string[];
  onSelectActiveZone?: (zoneId: string) => void;
  onToggleCompareZone?: (zoneId: string) => void;
  onCreateZone?: (draft: {
    nameAr: string;
    nameEn: string;
    categoryAr: string;
    categoryEn: string;
    soilTexture: SoilTexture;
    cropId: string;
    vertices: LatLon[];
  }) => void;
  onRenameZone?: (zoneId: string, newNameAr: string, newCategoryAr: string) => void;
  onDeleteZone?: (zoneId: string) => void;
  onClearAllZones?: () => void;
  isRefreshingData?: boolean;
}

export const MapZonesView: React.FC<MapZonesViewProps> = ({
  language,
  vertices,
  onChangeVertices,
  soil,
  onChangeSoil,
  currentCropId,
  onChangeCurrentCrop,
  area,
  subZones,
  gridCells,
  farmAverages,
  activeLayer,
  onChangeActiveLayer,
  activeThematicMap,
  onChangeThematicMap,
  onOpenFullScreenAtlas,
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
  onRenameZone,
  onDeleteZone,
  onClearAllZones,
}) => {
  const isAr = language === 'ar';
  const viewportWrapperRef = useRef<HTMLDivElement | null>(null);

  const [baseMapStyle, setBaseMapStyle] = useState<BaseMapStyleId>('hybrid');
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

  // Unified Cesium 3D Globe State (Free camera, zero forced snap-back)
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

  // Ventusky Atmospheric / Air-Quality Sub-Options, Borders, Streamlines & Timeline Scrubber
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

  // Bottom Corner Two-Button Popover State (Hidden by default)
  const [activeBottomPopover, setActiveBottomPopover] = useState<'none' | 'legend' | 'telemetry'>(
    'none'
  );
  const [inspectedPointLatLon, setInspectedPointLatLon] = useState<LatLon | null>(null);
  const [inspectedTerrainHeight, setInspectedTerrainHeight] = useState<number | null>(null);

  // On-demand Floating Inspector State (Pixel / Sub-Zone A-B-C / Soil)
  const [floatingInspectorMode, setFloatingInspectorMode] = useState<
    'pixel' | 'zone' | 'soil' | null
  >(null);
  const [selectedCell, setSelectedCell] = useState<SpatialGridCell | null>(null);
  const [selectedZoneTab, setSelectedZoneTab] = useState<'A' | 'B' | 'C'>('C');
  const [visualLeafAnalysis, setVisualLeafAnalysis] = useState<VisualLeafPhotoAnalysis | null>(
    null
  );

  const isSoilMoistureActive =
    soilMoistureOverlayEnabled || activeThematicMap === 'soil_moisture';

  const polygonCentroid = useMemo(() => getPolygonCentroid(vertices), [vertices]);
  const centroid = useMemo(
    () => (vertices.length >= 3 ? polygonCentroid : cameraCenter),
    [vertices.length, polygonCentroid, cameraCenter]
  );
  const activeWeatherDay = forecast14[selectedMoistureDayIdx] || forecast14[0];

  // Dynamic Land-Boundary Correction & 2D Bilinear Interpolation on the cropped Esri tile cell matrix
  const smoothedGridCells = useMemo(
    () =>
      applyDynamicLandCoverageAndBilinearTileSmoothing(
        gridCells,
        vertices,
        soil,
        activeWeatherDay
      ),
    [gridCells, vertices, soil, activeWeatherDay]
  );

  const cropRecognition = useMemo(
    () =>
      identifyPlantedCropInZone(
        smoothedGridCells,
        farmAverages,
        soil,
        area,
        forecast14,
        visualLeafAnalysis
      ),
    [smoothedGridCells, farmAverages, soil, area, forecast14, visualLeafAnalysis]
  );

  // 14-Day Environmental Disaster Early Warning State on Map
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
        smoothedGridCells,
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
      smoothedGridCells,
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

  // Timeline Play/Pause Progression across hours (00:00 -> 23:00) & 14 Forecast Days
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

  // Fetch live spatial wind & soil moisture around inspected/camera coordinate
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

  // Fetch live Open-Meteo Forecast + CAMS Air-Quality synoptic nodes
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

  // Live Elevation + Telemetry for the clicked point (or active center fallback)
  const targetTelemetryLatLon = inspectedPointLatLon ?? centroid;
  const [liveElevationOverride, setLiveElevationOverride] = useState<{
    lat: number;
    lng: number;
    meters: number;
  } | null>(null);

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
    };
  }, [
    targetTelemetryLatLon,
    elevationPalette,
    liveElevationOverride,
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
      if (id === 'elevation') {
        // Automatically enable realistic 3D relief mode & oblique camera pitch so mountain peaks stand out in 3D
        setViewMode3D(true);
        setMapPitchDeg(48);
        setTerrainExaggeration((prev) => Math.max(2.6, prev));
      } else if (id === 'vegetation' && activeLayer !== 'NDVI') {
        onChangeActiveLayer('NDVI');
      } else if (id === 'temperature' && activeLayer !== 'LST') {
        onChangeActiveLayer('LST');
      } else if (id === 'drought' && activeLayer !== 'SM_0_7' && activeLayer !== 'SM_7_28') {
        onChangeActiveLayer('SM_0_7');
      }
    }
  };

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

  const handleFlyToActiveZone = () => {
    if (vertices.length < 3) return;
    const c = getPolygonCentroid(vertices);
    setFlyToTarget({
      lat: c.lat,
      lng: c.lng,
      heightMeters: 2200,
      pitchDeg: -58,
      nonce: Date.now(),
    });
  };

  const handleCompleteRectangle = (boxVerts: LatLon[]) => {
    onChangeVertices(boxVerts);
    setDrawingMode('none');
    const nextIdx = zones.length + 1;
    setPendingDraft({
      vertices: boxVerts,
      defaultNameAr: `زونة زراعية ${nextIdx}`,
      defaultNameEn: `Study Zone ${nextIdx}`,
    });
  };

  const activeZoneObj = subZones.find((z) => z.id === selectedZoneTab) || subZones[0];

  return (
    <div
      ref={viewportWrapperRef}
      data-testid="map-zones-view"
      className="relative w-full h-full overflow-hidden bg-[#030712] text-slate-100"
    >
      {/* 1. UNIFIED CESIUM.JS 3D GLOBE + REAL 3D TERRAIN + SATELLITE-BLENDED ELEVATION */}
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
        gridCells={smoothedGridCells}
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
        onCompleteRectangle={handleCompleteRectangle}
        onCameraStatusChange={(st) => {
          setCameraCenter((prev) =>
            Math.hypot(st.center.lat - prev.lat, st.center.lng - prev.lng) > 0.08
              ? st.center
              : prev
          );
        }}
      />

      {/* 2. DRAGGABLE FAB + COMPACT VERTICAL DROPDOWN + TWO INTERACTIVE BOTTOM BUTTONS */}
      <MapFloatingHud
        language={language}
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
          if (mode !== 'none') {
            onChangeVertices([]);
          }
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
        onFlyToPresetRegion={(lat, lng, heightMeters, pitch) =>
          setFlyToTarget({
            lat,
            lng,
            heightMeters,
            pitchDeg: pitch,
            nonce: Date.now(),
          })
        }
        onFlyToActiveZone={handleFlyToActiveZone}
        onLocateGps={handleLocateGps}
        onZoomStep={(dir) => setZoomCommand({ direction: dir, nonce: Date.now() })}
        onOpenZoneInspector={() => setFloatingInspectorMode('zone')}
        onOpenSoilSettings={() => setFloatingInspectorMode('soil')}
        onDownloadPdfReport={onDownloadPdfReport}
        onOpenFullScreenAtlas={onOpenFullScreenAtlas}
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
      />

      {/* 2B. PROACTIVE 14-DAY ENVIRONMENTAL DISASTER EARLY WARNING HUD BADGE & DRAWER */}
      {topDisaster && (
        <div
          data-testid="map-disaster-early-warning-banner"
          className="absolute top-3 right-3 z-30 flex flex-col items-end gap-2 pointer-events-none"
        >
          <button
            type="button"
            data-testid="map-disaster-early-warning-toggle"
            onClick={() => setShowDisasterEarlyWarningDrawer((p) => !p)}
            className="pointer-events-auto min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-950/92 hover:bg-slate-900 border border-amber-500/60 shadow-xl flex items-center gap-2 text-xs font-bold text-amber-300 cursor-pointer transition-all"
          >
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="truncate max-w-[230px] sm:max-w-[320px]">
              {isAr
                ? `الإنذار المبكر (14 يوم): ${topDisaster.titleAr.replace('إنذار ', '')}`
                : `14d Early Warning: ${topDisaster.titleEn}`}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white font-mono text-[10px] font-bold tabular-nums shrink-0">
              {topDisaster.probabilityPct}%
            </span>
          </button>

          {showDisasterEarlyWarningDrawer && (
            <div
              data-testid="map-disaster-early-warning-drawer"
              className="pointer-events-auto w-[92vw] sm:w-[430px] max-h-[72vh] overflow-y-auto bg-slate-950/96 border border-amber-500/50 rounded-2xl p-4 shadow-2xl space-y-3 text-xs text-slate-100"
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

              {/* Selector Pills for all 5 Hazards */}
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
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. SCIENTIFIC STANDARDS MODAL (Opened from Color Legend Popover) */}
      {showScientificTable && (
        <div
          data-testid="scientific-standards-modal"
          className="absolute bottom-16 left-3 right-3 sm:right-auto sm:w-[520px] max-h-[64vh] overflow-y-auto z-40 bg-slate-950/96 border border-emerald-500/45 rounded-2xl p-4 shadow-2xl space-y-3"
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

      {/* 4. FLOATING ON-DEMAND ZONE / PIXEL / SOIL INSPECTOR */}
      {floatingInspectorMode !== null && (
        <div
          data-testid="map-floating-inspector"
          className="absolute bottom-16 right-3 left-3 sm:left-auto sm:w-[375px] max-h-[64vh] overflow-y-auto z-40 bg-slate-950/96 border border-white/15 rounded-2xl p-4 shadow-2xl space-y-3"
        >
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setFloatingInspectorMode('pixel')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
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
                className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1 ${
                  floatingInspectorMode === 'zone'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>{isAr ? 'القطاعات' : 'Zones'}</span>
              </button>
              <button
                type="button"
                onClick={() => setFloatingInspectorMode('soil')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1 ${
                  floatingInspectorMode === 'soil'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sliders className="w-3 h-3" />
                <span>{isAr ? 'التربة والمحصول' : 'Soil & Crop'}</span>
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

          {floatingInspectorMode === 'pixel' && (
            <div className="space-y-2.5 text-xs">
              {selectedCell ? (
                <>
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
                    const activeEval = evaluateCellForUnifiedLayer(
                      selectedCell,
                      isSoilMoistureActive ? 'soil_moisture' : activeThematicMap,
                      activeLayer,
                      forecast14,
                      selectedMoistureDayIdx,
                      isAr,
                      elevationPalette,
                      effectiveVentuskyOptions,
                      liveVentuskyNodes
                    );
                    return (
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-emerald-500/35 flex items-center justify-between">
                        <span className="font-semibold text-slate-200">{activeLayer}</span>
                        <span className="font-mono font-bold text-emerald-400">
                          {activeEval.valueFormatted}
                        </span>
                      </div>
                    );
                  })()}
                  <div className="grid grid-cols-2 gap-2 font-mono">
                    <div className="p-2 rounded-xl bg-slate-900">
                      <div className="text-[10px] text-slate-400">NDVI / SAVI</div>
                      <div className="font-bold text-emerald-400">
                        {selectedCell.values.NDVI} / {selectedCell.values.SAVI}
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900">
                      <div className="text-[10px] text-slate-400">SM 0-7 / 7-28%</div>
                      <div className="font-bold text-sky-400">
                        {selectedCell.values.SM_0_7}% / {selectedCell.values.SM_7_28}%
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-slate-400">
                  {isAr
                    ? 'انقر على أي خلية داخل الزونة لعرض قياساتها.'
                    : 'Click any cell inside the study zone to inspect telemetry.'}
                </p>
              )}
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
                <p className="text-emerald-300 font-semibold">
                  {isAr ? activeZoneObj.amendmentAr : activeZoneObj.amendmentEn}
                </p>
              </div>
              {vertices.length >= 3 && (
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
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">
                  {isAr ? 'قوام التربة' : 'Soil Texture'}
                </label>
                <select
                  value={soil.texture}
                  onChange={(e) =>
                    onChangeSoil({ ...soil, texture: e.target.value as SoilTexture })
                  }
                  className="w-full h-9 px-2.5 rounded-xl bg-slate-900 border border-white/15 text-white"
                >
                  <option value="clay">{isAr ? 'طينية (Clay)' : 'Clay'}</option>
                  <option value="loamy">{isAr ? 'طميية (Loamy)' : 'Loamy'}</option>
                  <option value="sandy">{isAr ? 'رملية (Sandy)' : 'Sandy'}</option>
                  <option value="calcareous">{isAr ? 'جيرية (Calcareous)' : 'Calcareous'}</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-300 mb-1">
                  {isAr ? 'نظام الري' : 'Irrigation'}
                </label>
                <select
                  value={soil.irrigation}
                  onChange={(e) =>
                    onChangeSoil({ ...soil, irrigation: e.target.value as IrrigationSystem })
                  }
                  className="w-full h-9 px-2.5 rounded-xl bg-slate-900 border border-white/15 text-white"
                >
                  <option value="drip">{isAr ? 'تنقيط' : 'Drip'}</option>
                  <option value="pivot">{isAr ? 'بيفوت' : 'Pivot'}</option>
                  <option value="sprinkler">{isAr ? 'رشاشات' : 'Sprinkler'}</option>
                  <option value="flood">{isAr ? 'غمر' : 'Flood'}</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-300 mb-1">
                  {isAr ? 'المحصول الحالي' : 'Active Crop'}
                </label>
                <select
                  value={currentCropId}
                  onChange={(e) => onChangeCurrentCrop(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-xl bg-slate-900 border border-white/15 text-white"
                >
                  {CROP_DATABASE.map((c) => (
                    <option key={c.id} value={c.id}>
                      {isAr ? c.nameAr : c.nameEn}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
