export type Language = 'ar' | 'en';

export type MainTabId = 'atlas' | 'indices' | 'weather' | 'crops' | 'advisor';

export type RegionDrawingToolMode = 'none' | 'freehand' | 'rectangle';

export type ThematicMapLayerId =
  | 'natural'
  | 'vegetation'
  | 'soil_moisture'
  | 'wind'
  | 'wind_gusts'
  | 'weather'
  | 'temperature'
  | 'apparent_temp'
  | 'pressure'
  | 'thunderstorms'
  | 'weather_radar'
  | 'satellite_ir'
  | 'humidity'
  | 'air_quality'
  | 'drought'
  | 'rainfall'
  | 'elevation'
  | 'dem_drainage'
  | 'snow_ice'
  | 'day_night';

export type PressureAltitudeLevel = '2m' | '900hPa' | '850hPa' | '700hPa' | 'dew_point';
export type AirPollutantSpecies =
  | 'PM2.5'
  | 'PM10'
  | 'NO2'
  | 'SO2'
  | 'O3'
  | 'DUST'
  | 'CO'
  | 'AQI'
  | 'UV';
export type PrecipAccumWindow = '1h' | '3h' | '24h';
export type WindAltitudeLevel = '10m' | '40m' | '80m' | '850hPa' | '700hPa';
export type CloudLayerFilter = 'total' | 'low_fog' | 'mid' | 'high';
export type ForecastModelId = 'AUTO' | 'ICON' | 'GFS' | 'ECMWF' | 'SILAM';

export interface VentuskyAtmosphericOptions {
  pressureAltitude: PressureAltitudeLevel;
  airPollutant: AirPollutantSpecies;
  precipAccumWindow: PrecipAccumWindow;
  windAltitude: WindAltitudeLevel;
  cloudFilter: CloudLayerFilter;
  forecastModel: ForecastModelId;
  utcHour?: number | null;
}

export interface VentuskyLiveTelemetryNode {
  id: string;
  lat: number;
  lng: number;
  nameAr: string;
  nameEn: string;
  temp2mC: number;
  apparentTempC: number;
  dewPointC: number;
  humidityPct: number;
  pressureHpa: number;
  capeJkg: number;
  windGustKmh: number;
  uvIndex: number;
  pm25: number;
  pm10: number;
  dust: number;
  no2: number;
  so2: number;
  o3: number;
  co: number;
  aqi: number;
}

export type OpenMeteoSoilMoistureDepth = 'soil_moisture_0cm' | 'soil_moisture_7cm';

export type MapToolbarTabId = 'maps' | 'zones' | 'orientation' | 'tools';

export type MapDisplayProjectionMode = 'flat_2d' | 'globe_3d';

export type BaseMapStyleId =
  | 'satellite'
  | 'hybrid'
  | 'terrain'
  | 'topo_contours'
  | 'dark_scientific'
  | 'dark_satellite';

export type GlobalTemperatureSubMode = 'air_2m' | 'surface_lst';

export type ElevationDisplayMode = '3d_contours' | '3d_color_only' | 'contours_only';

export type ElevationColorPalette = 'scientific_hypsometric' | 'classic_topographic';

export type LandCoverClass =
  | 'dense_crop'
  | 'moderate_crop'
  | 'bare_soil'
  | 'urban_built'
  | 'water_canal';

export type SpectralIndexKey =
  | 'NDVI'
  | 'NDWI'
  | 'SAVI'
  | 'NDMI'
  | 'EVI'
  | 'LST'
  | 'SM_0_7'
  | 'SM_7_28'
  | 'SOIL_EC'
  | 'SOIL_PH';

export type CoreSpectralIndexKey = 'NDVI' | 'NDWI' | 'SAVI' | 'NDMI' | 'EVI' | 'LST';

export type SoilTexture = 'clay' | 'loamy' | 'sandy' | 'calcareous';

export type IrrigationSystem = 'flood' | 'drip' | 'sprinkler' | 'pivot' | 'rainfed';

export interface LatLon {
  lat: number;
  lng: number;
}

export interface AreaBreakdown {
  squareMeters: number;
  hectares: number;
  totalFeddansDecimal: number;
  feddans: number;
  qirats: number;
  sahms: number;
}

export interface SoilProfile {
  texture: SoilTexture;
  customTextureLabel?: string;
  salinityEC: number; // dS/m
  ph: number;
  organicMatterPct: number;
  irrigation: IrrigationSystem;
  customIrrigationLabel?: string;
  groundwaterDepthM: number;
}

export interface SubZoneSummary {
  id: 'A' | 'B' | 'C';
  nameAr: string;
  nameEn: string;
  directionAr: string;
  directionEn: string;
  areaFeddans: number;
  ndvi: number;
  ndwi: number;
  savi: number;
  ndmi: number;
  evi: number;
  lstCelsius: number;
  esi: number;
  soilMoisturePct: number; // 0-7cm surface moisture %
  soilMoistureDeepPct: number; // 7-28cm root-zone moisture %
  salinityEC: number; // Zone-specific EC dS/m
  soilPh: number; // Zone-specific pH
  amendmentAr: string;
  amendmentEn: string;
  status: 'optimal' | 'moderate_stress' | 'high_stress';
  diagnosisAr: string;
  diagnosisEn: string;
  actionAr: string;
  actionEn: string;
}

export interface SpatialGridCell {
  id: string;
  bounds: [LatLon, LatLon, LatLon, LatLon];
  center: LatLon;
  subZoneId: 'A' | 'B' | 'C';
  landCover?: LandCoverClass;
  landCoverLabelAr?: string;
  landCoverLabelEn?: string;
  droughtIndexESI?: number;
  rgbSample?: { r: number; g: number; b: number };
  values: Record<SpectralIndexKey, number>;
}

export interface PresetFarmZone {
  id: string;
  nameAr: string;
  nameEn: string;
  regionAr: string;
  regionEn: string;
  governorateAr: string;
  governorateEn: string;
  vertices: LatLon[];
  soil: SoilProfile;
  currentCropId: string;
  plantingDateISO: string;
  baseSpectralBands: {
    blue: number;
    green: number;
    red: number;
    nir: number;
    swir1: number;
    swir2: number;
    lstCelsius: number;
  };
}

export interface SpectralTemporalPoint {
  date: string;
  labelAr: string;
  labelEn: string;
  NDVI: number;
  NDWI: number;
  SAVI: number;
  NDMI: number;
  EVI: number;
  LST: number;
  cloudCoverPct: number;
  satellite: 'Sentinel-2A' | 'Sentinel-2B' | 'Landsat-9' | 'MODIS/SMAP' | 'ECOSTRESS';
}

export interface GrowthStageInfo {
  stageIndex: number; // 0 to 4
  stageKey: 'germination' | 'vegetative' | 'flowering' | 'fruiting' | 'harvest';
  stageNameAr: string;
  stageNameEn: string;
  accumulatedGDD: number;
  targetTotalGDD: number;
  completionPct: number;
  daysElapsed: number;
  daysRemaining: number;
  canopyCoverPct: number;
  rootDepthCm: number;
  cropCoefficientKc: number;
  stages: Array<{
    key: string;
    nameAr: string;
    nameEn: string;
    gddThreshold: number;
    kc: number;
    status: 'completed' | 'active' | 'upcoming';
  }>;
}

export interface DailyWeatherPoint {
  date: string;
  dayLabelAr: string;
  dayLabelEn: string;
  tempMaxC: number;
  tempMinC: number;
  precipProbPct: number;
  precipMm: number;
  et0Mm: number;
  soilMoisture0cmPct?: number;
  soilMoisture7cmPct?: number;
  soilMoisture0to7Pct: number;
  soilMoisture7to28Pct: number;
  windSpeedKmh: number;
  windDirectionDeg?: number;
  windDirectionCardinalAr?: string;
  windDirectionCardinalEn?: string;
  surfacePressureHpa?: number;
  cloudCoverPct?: number;
  droughtIndexESI?: number;
  relativeHumidityPct: number;
  sprayingSafe: boolean;
  solarRadiationMjM2?: number;
  earthSkinTempC?: number;
  nasaGwetTopPct?: number;
  nasaGwetRootPct?: number;
  nasaPrecipMm?: number;
  nasaDataSource?: string;
}

export interface SeasonalMonthPrediction {
  monthKey: string;
  monthNameAr: string;
  monthNameEn: string;
  historicalRainMm: number;
  predictedRainMm: number;
  anomalyPct: number;
  avgTempMaxC: number;
  avgTempMinC: number;
  frostRiskNights: number;
  heatwaveDays: number;
  cropEtcMm: number;
  netDeficitMm: number;
  supplementalIrrigationM3PerFeddan: number;
  windowType: 'rain_surplus' | 'optimal_mild' | 'drought_spell' | 'heat_stress' | 'frost_watch';
  windowNoteAr: string;
  windowNoteEn: string;
}

export interface SmartWeatherAlert {
  id: string;
  severity: 'critical' | 'warning' | 'advisory' | 'positive';
  titleAr: string;
  titleEn: string;
  messageAr: string;
  messageEn: string;
  waterSavedM3PerFeddan: number;
  metricBadge: string;
}

export type BotanicalFamily =
  | 'gramineae' // Wheat, Maize, Rice, Sorghum
  | 'fabaceae' // Fava Bean, Egyptian Clover
  | 'solanaceae' // Potato, Tomato
  | 'chenopodiaceae' // Sugar Beet, Quinoa
  | 'malvaceae' // Cotton
  | 'oleaceae'; // Olive

export interface CropPestOrDiseaseInfo {
  id: string;
  nameAr: string;
  nameEn: string;
  scientificName: string;
  type: 'fungal' | 'insect' | 'nematode' | 'bacterial_viral' | 'parasitic_weed';
  typeLabelAr: string;
  typeLabelEn: string;
  severity: 'high' | 'critical' | 'moderate';
  symptomsAr: string;
  symptomsEn: string;
  rotationMitigationAr: string;
  rotationMitigationEn: string;
}

export interface CropDatabaseItem {
  id: string;
  nameAr: string;
  nameEn: string;
  scientificName: string;
  family?: BotanicalFamily;
  cultivarAr: string;
  cultivarEn: string;
  season: 'winter' | 'summer' | 'nili' | 'perennial';
  seasonAr: string;
  seasonEn: string;
  preferredSoils: SoilTexture[];
  maxSalinityEC: number; // threshold before yield drop
  ecSlopePctPerDsm: number; // FAO Maas-Hoffman yield decline % per dS/m above threshold
  optimalPhRange: [number, number];
  optimalTempRangeC: [number, number];
  baseTempGDD: number;
  totalGDDRequired: number;
  seasonalWaterReqMm: number;
  optimalPlantingStartAr: string;
  optimalPlantingEndAr: string;
  optimalPlantingStartEn: string;
  optimalPlantingEndEn: string;
  optimalPlantingMonths: number[]; // 1-12
  earlyPlantingRiskAr: string;
  earlyPlantingRiskEn: string;
  latePlantingRiskAr: string;
  latePlantingRiskEn: string;
  expectedHarvestDurationDays: number;
  potentialYieldTonPerFeddan: number;
  marketPriceEgpPerTon: number;
  nitrogenFixer: boolean;
  rootDiseaseBreakRole: string;
  qualityFactorsAr: string;
  qualityFactorsEn: string;
  commonPestsAndDiseases?: CropPestOrDiseaseInfo[];
  rotationPestMitigationSummaryAr?: string;
  rotationPestMitigationSummaryEn?: string;
}

export interface ScoredCropRecommendation {
  crop: CropDatabaseItem;
  suitabilityScore: number; // 0-100
  qualityScore: number; // 0-100
  gradeLabel: 'Grade-A Export' | 'Grade-A Local' | 'Grade-B Standard' | 'Marginal';
  breakdown: {
    soilScore: number;
    salinityScore: number;
    climateScore: number;
    waterSynergyScore: number;
    rotationScore: number;
  };
  predictedRainCoverageMm: number;
  predictedRainCoveragePct: number;
  netIrrigationRequiredM3PerFeddan: number;
  totalFarmIrrigationM3: number;
  expectedYieldTonPerFeddan: number;
  totalFarmYieldTons: number;
  estimatedRevenuePerFeddanEgp: number;
  expectedHarvestDateAr: string;
  expectedHarvestDateEn: string;
  whyGradeAAr: string;
  whyGradeAEn: string;
}

export interface RotationPestMitigationEntry {
  cropId: string;
  cropNameAr: string;
  cropNameEn: string;
  targetPestsAr: string;
  targetPestsEn: string;
  mitigationMechanismAr: string;
  mitigationMechanismEn: string;
  riskReductionPct: number;
}

export interface RotationStrategyOption {
  id: 'A' | 'B' | 'C';
  code: string;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  sequenceAr: string[];
  sequenceEn: string[];
  waterUseM3PerFeddanYear: number;
  waterSavingPct: number;
  soilNitrogenDeltaKgPerFeddan: number;
  salinityReductionDsm: number;
  netProfitIndexPct: number;
  nasaEvidence: Array<{
    mission: string;
    parameter: string;
    findingAr: string;
    findingEn: string;
  }>;
  dataGapsAr: string[];
  dataGapsEn: string[];
  agronomistChecklist: Array<{
    id: string;
    labelAr: string;
    labelEn: string;
    defaultChecked: boolean;
  }>;
  pestAndDiseaseMitigation?: RotationPestMitigationEntry[];
}

export interface RotationSeasonSlot {
  slotId: 'past2' | 'past1' | 'current' | 'next1' | 'next2';
  periodAr: string;
  periodEn: string;
  seasonType: 'winter' | 'summer';
  isPast: boolean;
  isCurrent?: boolean;
  monthsSpanAr: string;
  monthsSpanEn: string;
  startMonthIdx: number; // 0-29 across a 30-month timeline
  durationMonths: number;
  cropId: string;
}

export interface ZoneCustomRotationPlan {
  zoneId: 'A' | 'B' | 'C';
  zoneNameAr: string;
  zoneNameEn: string;
  slots: RotationSeasonSlot[];
}

export interface RotationWarning {
  id: string;
  severity: 'critical' | 'warning' | 'positive';
  zoneId: 'A' | 'B' | 'C';
  transitionLabelAr: string;
  transitionLabelEn: string;
  titleAr: string;
  titleEn: string;
  detailAr: string;
  detailEn: string;
  fixSuggestionCropId?: string;
  fixSlotId?: RotationSeasonSlot['slotId'];
}

export interface CustomRotationEvaluation {
  zoneId: 'A' | 'B' | 'C';
  soilHealthScore: number; // 0-100
  pestBreakScore: number; // 0-100
  nitrogenBalanceKgPerFeddan: number;
  avgSeasonalWaterM3PerFeddan: number;
  warnings: RotationWarning[];
}

export interface SavedCustomRotationPreset {
  id: string;
  nameAr: string;
  nameEn: string;
  createdAt: string;
  plans: Record<'A' | 'B' | 'C', ZoneCustomRotationPlan>;
}

export type AdvisorInlineWidgetType =
  | 'pest_radar'
  | 'weekly_checklist'
  | 'spectral_subzones'
  | 'irrigation_npk'
  | 'crop_mcda'
  | 'zone_action_card';

export interface AdvisorCreateZonePayload {
  nameAr: string;
  nameEn: string;
  categoryAr: string;
  categoryEn: string;
  soilTexture: SoilTexture;
  salinityEC?: number;
  ph?: number;
  organicMatterPct?: number;
  irrigation?: IrrigationSystem;
  cropId: string;
  customCropLabel?: string;
  vertices: LatLon[];
  centroid: LatLon;
  requestedFeddans: number;
  regionLabelAr?: string;
  regionLabelEn?: string;
}

export interface AdvisorUpdateSoilOrCropPayload {
  cropId?: string;
  customCropLabel?: string;
  soilTexture?: SoilTexture;
  salinityEC?: number;
  ph?: number;
  organicMatterPct?: number;
  irrigation?: IrrigationSystem;
}

export type AdvisorSiteAction =
  | {
      type: 'CREATE_ZONE';
      zoneDraft: AdvisorCreateZonePayload;
      summaryAr: string;
      summaryEn: string;
    }
  | {
      type: 'UPDATE_ZONE_CONFIG';
      zoneId?: string;
      updates: AdvisorUpdateSoilOrCropPayload;
      summaryAr: string;
      summaryEn: string;
    }
  | {
      type: 'RENAME_ZONE';
      zoneId?: string;
      newNameAr: string;
      newNameEn: string;
      newCategoryAr?: string;
      summaryAr: string;
      summaryEn: string;
    }
  | {
      type: 'SWITCH_MAP_LAYER';
      spectralLayer?: SpectralIndexKey;
      thematicLayer?: ThematicMapLayerId;
      navigateToAtlas?: boolean;
      summaryAr: string;
      summaryEn: string;
    }
  | {
      type: 'SWITCH_ACTIVE_ZONE';
      zoneId: string;
      summaryAr: string;
      summaryEn: string;
    }
  | {
      type: 'TOGGLE_COMPARE_ZONE';
      zoneId?: string;
      mode: 'add' | 'remove' | 'toggle' | 'clear_all';
      summaryAr: string;
      summaryEn: string;
    }
  | {
      type: 'DELETE_ZONE';
      zoneId?: string;
      clearAll?: boolean;
      summaryAr: string;
      summaryEn: string;
    }
  | {
      type: 'CLEAR_DRAWN_VERTICES';
      summaryAr: string;
      summaryEn: string;
    }
  | {
      type: 'NAVIGATE_TAB';
      tabId: MainTabId;
      summaryAr: string;
      summaryEn: string;
    }
  | {
      type: 'EXPORT_PDF_REPORT';
      summaryAr: string;
      summaryEn: string;
    }
  | {
      type: 'ADD_CHECKLIST_TASK';
      titleAr: string;
      titleEn: string;
      detailAr?: string;
      detailEn?: string;
      category?: WeeklyChecklistTask['category'];
      priority?: WeeklyChecklistTask['priority'];
      dayAr?: string;
      dayEn?: string;
      summaryAr: string;
      summaryEn: string;
    }
  | {
      type: 'TOGGLE_CHECKLIST_TASK';
      taskId?: string;
      matchText?: string;
      completed?: boolean;
      markAll?: boolean;
      summaryAr: string;
      summaryEn: string;
    }
  | {
      type: 'DELETE_CHECKLIST_TASK';
      taskId?: string;
      matchText?: string;
      clearAll?: boolean;
      summaryAr: string;
      summaryEn: string;
    }
  | {
      type: 'LOG_PEST_INCIDENT';
      pestId?: string;
      subZoneId?: 'A' | 'B' | 'C';
      severity?: PestSeverity;
      notes?: string;
      summaryAr: string;
      summaryEn: string;
    }
  | {
      type: 'TOGGLE_PEST_INCIDENT_STATUS';
      incidentId?: string;
      status?: 'active' | 'treated';
      markAllTreated?: boolean;
      summaryAr: string;
      summaryEn: string;
    }
  | {
      type: 'DELETE_PEST_INCIDENT';
      incidentId?: string;
      clearAll?: boolean;
      summaryAr: string;
      summaryEn: string;
    }
  | {
      type: 'UPDATE_ROTATION_SLOT';
      subZoneId: 'A' | 'B' | 'C';
      slotId: RotationSeasonSlot['slotId'];
      cropId: string;
      summaryAr: string;
      summaryEn: string;
    }
  | {
      type: 'OPTIMIZE_ROTATION';
      subZoneId: 'A' | 'B' | 'C' | 'ALL';
      summaryAr: string;
      summaryEn: string;
    }
  | {
      type: 'SET_THEME';
      darkMode?: boolean;
      toggle?: boolean;
      summaryAr: string;
      summaryEn: string;
    }
  | {
      type: 'SET_LANGUAGE';
      language: Language;
      summaryAr: string;
      summaryEn: string;
    }
  | {
      type: 'TOGGLE_PUSH_NOTIFICATIONS';
      enabled?: boolean;
      dismissAllAlerts?: boolean;
      summaryAr: string;
      summaryEn: string;
    }
  | {
      type: 'REFRESH_WEATHER';
      summaryAr: string;
      summaryEn: string;
    }
  | {
      type: 'CLEAR_CHAT';
      summaryAr: string;
      summaryEn: string;
    }
  | {
      type: 'CLOSE_FULLSCREEN_CHAT';
      summaryAr: string;
      summaryEn: string;
    }
  | {
      type: 'OPEN_SPACE_DATA_CATALOG';
      summaryAr: string;
      summaryEn: string;
    };

export interface AdvisorMediaAttachment {
  id: string;
  mediaType: 'image' | 'video';
  mimeType: string;
  fileName: string;
  previewUrl: string;
  base64Data: string;
  sizeBytes: number;
}

export interface AdvisorMessage {
  id: string;
  sender: 'user' | 'advisor';
  timestamp: string;
  text: string;
  attachment?: AdvisorMediaAttachment;
  metricsCited?: string[];
  sourceMode?: 'gemini_live' | 'local_scientific_engine';
  inlineWidgets?: AdvisorInlineWidgetType[];
  executedActions?: AdvisorSiteAction[];
}

export interface WeeklyChecklistTask {
  id: string;
  category: 'irrigation' | 'fertilization' | 'scouting' | 'soil';
  dayAr: string;
  dayEn: string;
  titleAr: string;
  titleEn: string;
  detailAr: string;
  detailEn: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'normal';
}

export type PestSeverity = 'low' | 'moderate' | 'high' | 'critical';

export interface RegionalPestCatalogItem {
  id: string;
  nameAr: string;
  nameEn: string;
  scientificName: string;
  category: 'fungal' | 'insect' | 'nematode' | 'bacterial_viral';
  hostCropIds: string[];
  optimalTempRangeC: [number, number];
  minHumidityPct: number;
  symptomsAr: string;
  symptomsEn: string;
  preventativeAr?: string;
  preventativeEn?: string;
  ipmTreatmentAr: string;
  ipmTreatmentEn: string;
}

export interface RegionalPestRiskWarning {
  pestId: string;
  nameAr: string;
  nameEn: string;
  scientificName: string;
  category: 'fungal' | 'insect' | 'nematode' | 'bacterial_viral';
  riskLevel: 'critical' | 'high' | 'moderate' | 'low';
  riskScore: number; // 0-100
  regionalPrevalencePct: number; // 0-100% regional prevalence in 25km radius
  outbreakTrendAr: string;
  outbreakTrendEn: string;
  regionLabelAr: string;
  regionLabelEn: string;
  coordinatesLabel: string;
  triggerReasonAr: string;
  triggerReasonEn: string;
  preventiveActionAr: string;
  preventiveActionEn: string;
  treatmentAlertAr: string;
  treatmentAlertEn: string;
  recommendedSprayWindowAr: string;
  recommendedSprayWindowEn: string;
}

export interface LoggedPestIncident {
  id: string;
  pestId: string;
  pestNameAr: string;
  pestNameEn: string;
  scientificName: string;
  subZoneId: 'A' | 'B' | 'C';
  severity: PestSeverity;
  observedAt: string;
  coordinates: LatLon;
  regionalPrevalencePct: number;
  symptomsObservedAr: string;
  symptomsObservedEn: string;
  notes: string;
  preventativeRecommendationAr: string;
  preventativeRecommendationEn: string;
  prescribedActionAr: string;
  prescribedActionEn: string;
  safeSprayWindowAr: string;
  safeSprayWindowEn: string;
  status: 'active' | 'treated';
}

export interface NpkWeekDose {
  weekNumber: 1 | 2 | 3 | 4;
  weekLabelAr: string;
  weekLabelEn: string;
  stageContextAr: string;
  stageContextEn: string;
  gddWindowLabel: string;
  pureNKgPerFeddan: number;
  pureP2O5KgPerFeddan: number;
  pureK2OKgPerFeddan: number;
  totalFarmNKg: number;
  totalFarmP2O5Kg: number;
  totalFarmK2OKg: number;
  commercialSourceAr: string;
  commercialSourceEn: string;
  applicationMethodAr: string;
  applicationMethodEn: string;
}

export interface FourWeekNpkSchedule {
  cropId: string;
  cropNameAr: string;
  cropNameEn: string;
  soilTexture: SoilTexture;
  stageKey: GrowthStageInfo['stageKey'];
  stageNameAr: string;
  stageNameEn: string;
  accumulatedGDD: number;
  targetTotalGDD: number;
  total4WeekPureNPerFeddan: number;
  total4WeekPureP2O5PerFeddan: number;
  total4WeekPureK2OPerFeddan: number;
  totalFarmPureNKg: number;
  totalFarmPureP2O5Kg: number;
  totalFarmPureK2OKg: number;
  leachingAdjustmentFactor: number;
  agronomicNoteAr: string;
  agronomicNoteEn: string;
  weeks: NpkWeekDose[];
}

export interface UserStudyZone {
  id: string;
  ownerUid?: string;
  nameAr: string;
  nameEn: string;
  categoryAr: string;
  categoryEn: string;
  color: string;
  createdAt: string;
  vertices: LatLon[];
  centroid: LatLon;
  area: AreaBreakdown;
  soil: SoilProfile;
  currentCropId: string;
  customCropLabel?: string;
  plantingDateISO: string;
  subZones: SubZoneSummary[];
  gridCells: SpatialGridCell[];
  farmAverages: Record<SpectralIndexKey, number>;
  forecast14: DailyWeatherPoint[];
  weatherSource: 'open-meteo-live' | 'agro-simulation-fallback';
  nasaSource: 'nasa-power-live' | 'nasa-power-calibrated-cache';
  nasaRainOverride?: Record<number, { rainMm: number; tempC: number }>;
  customRotationPlans: Record<'A' | 'B' | 'C', ZoneCustomRotationPlan>;
  radiometricSource: 'satellite-tile-pixel-calibrated' | 'agro-coupled-model';
}

export interface SpatialWeatherGridNode {
  id: string;
  lat: number;
  lng: number;
  windSpeedKmh: number;
  windDirDeg: number;
  windDirCardinalAr: string;
  windDirCardinalEn: string;
  precipMm: number;
  precipProbPct: number;
  cloudCoverPct: number;
  tempC: number;
  relativeHumidityPct: number;
}

export interface SoilTextureLegendSpec {
  texture: SoilTexture;
  nameAr: string;
  nameEn: string;
  badgeCode: string;
  swatchColor: string;
  gradientCss: string;
  fieldCapacityPct: number;
  wiltingPointPct: number;
  availableWaterMmPerM: number;
  infiltrationRateMmHr: string;
  leachingFactor: string;
  descriptionAr: string;
  descriptionEn: string;
  idealCropsAr: string;
  idealCropsEn: string;
}

export interface DailyGddProjectionPoint {
  dayOffset: number; // 1..30
  dateISO: string;
  dateShortLabel: string;
  tempMaxC: number;
  tempMinC: number;
  tempMeanC: number;
  dailyGdd: number;
  cumulativeGdd: number;
  completionPct: number;
  stageKey: GrowthStageInfo['stageKey'];
  stageNameAr: string;
  stageNameEn: string;
  cropCoefficientKc: number;
  canopyCoverPct: number;
  rootDepthCm: number;
  isStageTransition: boolean;
  transitionToStageAr?: string;
  transitionToStageEn?: string;
}

export interface ThirtyDayGddProjectionSummary {
  cropId: string;
  cropNameAr: string;
  cropNameEn: string;
  baseTempGDD: number;
  targetTotalGDD: number;
  startAccumulatedGDD: number;
  endAccumulatedGDD: number;
  total30DayGddGain: number;
  avgDailyGddRate: number;
  startStageKey: GrowthStageInfo['stageKey'];
  startStageNameAr: string;
  startStageNameEn: string;
  endStageKey: GrowthStageInfo['stageKey'];
  endStageNameAr: string;
  endStageNameEn: string;
  startCompletionPct: number;
  endCompletionPct: number;
  daysToNextStage: number | null;
  nextStageNameAr: string | null;
  nextStageNameEn: string | null;
  stageThresholds: {
    key: GrowthStageInfo['stageKey'];
    nameAr: string;
    nameEn: string;
    gddThreshold: number;
    pctThreshold: number;
    kc: number;
    color: string;
  }[];
  dailyPoints: DailyGddProjectionPoint[];
}

export type MultiYearCycleLength = 3 | 4 | 5;

export type MultiYearRotationFocus =
  | 'soil_regeneration'
  | 'water_conservation'
  | 'economic_maximization';

export interface MultiYearRotationYearPlan {
  yearNumber: number; // 1..5
  yearLabelAr: string;
  yearLabelEn: string;
  winterCropId: string;
  winterCropAr: string;
  winterCropEn: string;
  summerCropId: string;
  summerCropAr: string;
  summerCropEn: string;
  coverOrIntercropAr: string;
  coverOrIntercropEn: string;
  nitrogenDeltaKgPerFeddan: number;
  organicMatterGainPct: number;
  waterUseM3PerFeddan: number;
  pestReductionNoteAr: string;
  pestReductionNoteEn: string;
  expectedNetReturnEgpPerFeddan: number;
}

export interface MultiYearRotationStrategy {
  id: MultiYearRotationFocus;
  code: string;
  cycleYears: MultiYearCycleLength;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  egyptianCropExamplesAr: string[];
  egyptianCropExamplesEn: string[];
  yearlySequence: MultiYearRotationYearPlan[];
  expectedBenefits: {
    soilHealthScoreGainPct: number;
    soilHealthDetailAr: string;
    soilHealthDetailEn: string;
    pestReductionPct: number;
    pestReductionDetailAr: string;
    pestReductionDetailEn: string;
    waterSavingsPct: number;
    waterSavingsM3PerFeddanCycle: number;
    waterSavingsDetailAr: string;
    waterSavingsDetailEn: string;
    cumulativeNitrogenKgPerFeddan: number;
    cumulativeOrganicMatterGainPct: number;
  };
  marketImplications: {
    cumulativeNetProfitPerFeddanEgp: number;
    annualizedRoiPct: number;
    priceStabilityRating: 'high' | 'moderate';
    exportAndContractOpportunitiesAr: string;
    exportAndContractOpportunitiesEn: string;
    inputCostSavingNoteAr: string;
    inputCostSavingNoteEn: string;
  };
}

export interface ProactivePestOutbreakAlert {
  id: string;
  pestId: string;
  cropCategory: 'wheat' | 'maize' | 'cotton' | 'vegetables';
  cropNameAr: string;
  cropNameEn: string;
  pestNameAr: string;
  pestNameEn: string;
  scientificName: string;
  pestType: 'fungal' | 'insect' | 'nematode' | 'bacterial_viral';
  likelihoodPct: number; // 0-100%
  riskLevel: 'critical' | 'high' | 'moderate' | 'low';
  vulnerableSubZones: Array<'A' | 'B' | 'C'>;
  weatherTriggersAr: string;
  weatherTriggersEn: string;
  historicalOutbreakContextAr: string;
  historicalOutbreakContextEn: string;
  preventativeActionsAr: string[];
  preventativeActionsEn: string[];
  advisorPromptAr: string;
  advisorPromptEn: string;
}

export type EnvironmentalDisasterType =
  | 'frost'
  | 'heatwave'
  | 'flash_flood'
  | 'sandstorm_wind'
  | 'severe_drought';

export interface DisasterResilientCropMatch {
  cropId: string;
  cropNameAr: string;
  cropNameEn: string;
  cultivarAr: string;
  cultivarEn: string;
  resilienceScorePct: number;
  toleranceMechanismAr: string;
  toleranceMechanismEn: string;
  recommendedPlantingAdjustmentAr: string;
  recommendedPlantingAdjustmentEn: string;
}

export interface EnvironmentalDisasterWarning {
  id: string;
  disasterType: EnvironmentalDisasterType;
  titleAr: string;
  titleEn: string;
  severity: 'critical' | 'high' | 'moderate' | 'low';
  probabilityPct: number; // 0-100%
  onsetDayIndex: number;
  countdownHours: number;
  windowStartDate: string;
  windowEndDate: string;
  triggerMetricsAr: string;
  triggerMetricsEn: string;
  expectedImpactAr: string;
  expectedImpactEn: string;
  estimatedYieldLossWithoutActionPct: number;
  mitigatedYieldSavedPct: number;
  emergencyProtocol: {
    preEvent72to24hAr: string[];
    preEvent72to24hEn: string[];
    duringEventAr: string[];
    duringEventEn: string[];
    postEventRecoveryAr: string[];
    postEventRecoveryEn: string[];
  };
  resilientCrops: DisasterResilientCropMatch[];
  advisorPromptAr: string;
  advisorPromptEn: string;
}

export interface CropLifecycleGddPoint {
  dayIndex: number;
  dayLabelAr: string;
  dayLabelEn: string;
  cumulativeGdd: number;
  dailyGdd: number;
  tempMeanC: number;
  completionPct: number;
  stageKey: GrowthStageInfo['stageKey'];
  stageNameAr: string;
  stageNameEn: string;
  cropCoefficientKc: number;
  isCurrentFieldMilestone: boolean;
  activeFieldGdd: number | null;
}

export type CropWaterStatus = 'safe' | 'tight' | 'deficit';

export interface FarmWaterBudgetSummary {
  sm0to7Pct: number;
  sm7to28Pct: number;
  weightedMoisturePct: number;
  moistureIndex01: number;
  moistureCondition: 'optimal' | 'moderate' | 'dry';
  soilTexture: SoilTexture;
  salinityOsmoticFactor: number;
  soilMoistureReserveM3PerFeddan: number;
  predictedSeasonalRainM3PerFeddan: number;
  irrigationQuotaM3PerFeddan: number;
  autoSeasonalAllocationM3PerFeddan: number;
  manualOverrideM3PerFeddan: number | null;
  isManualOverride: boolean;
  totalAvailableWaterM3PerFeddan: number;
}

export interface CropWaterEvaluation {
  cropId: string;
  requiredM3PerFeddan: number;
  availableM3PerFeddan: number;
  balanceDeltaM3PerFeddan: number;
  deficitM3PerFeddan: number;
  deficitPct: number;
  usageRatioPct: number;
  status: CropWaterStatus;
}

export type HistoricalComparableIndexKey = 'NDVI' | 'NDWI' | 'SAVI';
export type HistoricalSeasonRange = 1 | 2 | 3;

export interface HistoricalComparisonPoint {
  passIndex: number;
  date: string;
  periodLabelAr: string;
  periodLabelEn: string;
  satellite: SpectralTemporalPoint['satellite'];
  currentValue: number;
  season1AgoValue: number;
  season2AgoValue: number;
  season3AgoValue: number;
  historicalMeanValue: number;
  deltaFromMean: number;
  deltaPct: number;
  isAnomalyPass: boolean;
}

export interface HistoricalIndexAnomalySummary {
  indexKey: HistoricalComparableIndexKey;
  seasonsCount: HistoricalSeasonRange;
  currentAvg: number;
  season1AgoAvg: number;
  season2AgoAvg: number;
  season3AgoAvg: number;
  multiYearBaselineAvg: number;
  deltaValue: number;
  deltaPct: number;
  anomalyStatus: 'positive_anomaly' | 'normal_range' | 'negative_anomaly';
  anomalySeverity: 'optimal' | 'watch' | 'critical';
  headlineAr: string;
  headlineEn: string;
  diagnosisAr: string;
  diagnosisEn: string;
  recommendationAr: string;
  recommendationEn: string;
  points: HistoricalComparisonPoint[];
}

export interface WeatherStagePestAlert {
  id: string;
  pestId: string;
  pestNameAr: string;
  pestNameEn: string;
  scientificName: string;
  pestType: 'fungal' | 'insect' | 'bacterial_viral' | 'nematode';
  targetCropNameAr: string;
  targetCropNameEn: string;
  isActiveCropMatch: boolean;
  riskScorePct: number;
  riskLevel: 'critical' | 'high' | 'moderate' | 'low';
  vulnerableSubZones: Array<'A' | 'B' | 'C'>;
  weatherTriggerBreakdown: {
    tempMaxC: number;
    tempMinC: number;
    meanTempC: number;
    relativeHumidityPct: number;
    rainfall7dMm: number;
    estimatedLeafWetnessHours: number;
    favorableWeatherScorePct: number;
  };
  weatherConditionSummaryAr: string;
  weatherConditionSummaryEn: string;
  growthStageKey: GrowthStageInfo['stageKey'];
  growthStageNameAr: string;
  growthStageNameEn: string;
  growthStageVulnerabilityAr: string;
  growthStageVulnerabilityEn: string;
  regionalHistoryContextAr: string;
  regionalHistoryContextEn: string;
  scoutingActionsAr: string[];
  scoutingActionsEn: string[];
  preventativeMeasuresAr: string[];
  preventativeMeasuresEn: string[];
  safeSprayWindowAr: string;
  safeSprayWindowEn: string;
  advisorPromptAr: string;
  advisorPromptEn: string;
}

export interface WeatherPestRiskSystemSummary {
  regionNameAr: string;
  regionNameEn: string;
  meanTemp7dC: number;
  meanHumidity7dPct: number;
  totalRainfall7dMm: number;
  estimatedLeafWetnessHours: number;
  safeSprayingDaysCount: number;
  nextSafeSprayDayAr: string;
  nextSafeSprayDayEn: string;
  overallRiskLevel: 'critical' | 'high' | 'moderate' | 'low';
  alerts: WeatherStagePestAlert[];
}

