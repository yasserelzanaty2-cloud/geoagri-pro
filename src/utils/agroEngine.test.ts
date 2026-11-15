import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CROP_DATABASE,
  PRESET_FARM_ZONES,
  calculateGeodesicArea,
  computeNDVI,
  computeNDWI,
  computeSAVI,
  computeNDMI,
  computeEVI,
  computeESI,
  generateSubZonesAndGrid,
  calculateGrowthStageAndGDD,
  buildFallback14DayForecast,
  generateSeasonal6MonthForecast,
  generateSmartWeatherAlerts,
  scoreCropsForFarm,
  buildRotationStrategies,
  generateLocalAgronomistResponse,
  getPolygonCentroid,
  buildDefaultCustomRotationPlans,
  evaluateCustomRotationPlan,
  optimizeZoneRotationPlan,
  getSpectralColor,
  evaluateRegionalPestRisks,
  createLoggedPestIncident,
  calculateFourWeekNpkSchedule,
  generateMultiYearRotationStrategies,
  evaluateZonePestOutbreakAlerts,
  evaluateEnvironmentalDisasterWarnings,
  evaluateAutomatedNdwiWaterMask,
  computeDynamicBinaryVegetationThreshold,
  applyDynamicBinaryVegetationMask,
  resolveCustomCropReference,
  resolveCustomSoilTextureReference,
  evaluateOpenMeteoZonePushAlerts,
  computeRiskMitigationBreakdown,
  derivePestRiskYieldMetrics,
  evaluateFarmWaterBudget,
  evaluateCropWaterDeficit,
  findWaterSafeAlternativeCrops,
  generateSpectralTimeSeries,
  buildHistoricalSpectralComparison,
  evaluateWeatherPestAndDiseaseAlertSystem,
} from './agroEngine';
import { buildReportSummaryLines, buildValidPdfDocumentBytes } from './pdfReportGenerator';
import {
  GDD_LIFECYCLE_PHASE_PRESETS,
  buildCropLifecycleGddSeries,
  buildCropRecommenderCsv,
  buildWeatherForecastCsv,
  escapeCsvCell,
  filterGddLifecyclePointsByRange,
  serializeCsvRows,
} from './csvExport';
import {
  buildGeodesicRectangleForFeddans,
  evaluateAdvisorAgenticTurn,
  extractAreaFeddansFromText,
  extractCoordinatesFromText,
} from './advisorCommandEngine';
import {
  AdvisorSiteInventory,
  mapGeminiToolCallsToSiteActions,
} from './advisorToolMapper';
import {
  applyBilinearSmoothingToSpatialGridMatrix,
  classifyRgbReflectance,
  clearPixelAnalyzerCache,
  evaluateMultiIndexEdgeThresholdWindow,
  evaluateOptimizedNdwiWaterMaskFromRgb,
  getPixelAnalyzerCacheStats,
  normalizeToaToBoaSentinel2,
  processGridCellsInParallelChunks,
  recomputeSubZonesAndAveragesFromCells,
  resolveZoneCellVegetationOverlayVisual,
  sampleBilinearRgbFromEsriTile,
  sampleMemoized5x5SubPixelWindow,
} from './satellitePixelAnalyzer';
import {
  BASE_MAP_STYLES,
  GLOBAL_WHITE_BORDER_POLYLINES,
  THEMATIC_MAPS_META,
  VENTUSKY_CITIES_CATALOG,
  buildLocalizedRainCloudClusters,
  buildRegionalAndGlobalTelemetryNodes,
  buildVirtualizedFieldPointsMatrix,
  classifyDemDrainageFromNeighborhood,
  classifySatellitePixelForVegetationOverlay,
  evaluateDemDrainageAtLatLon,
  evaluateGlobalDayNightSolarAtLatLon,
  evaluateGlobalElevationAtLatLon,
  evaluateGlobalSnowAndBlizzardAtLatLon,
  evaluateGlobalTemperatureAtLatLon,
  evaluateSoilMoistureOverlayAtLatLon,
  evaluateSpatialRainAtLatLon,
  evaluateSpatialSpectralOrSoilAtLatLon,
  evaluateSpatialWindAtLatLon,
  evaluateVentuskyAtmosphericFieldAtLatLon,
  evaluateVentuskyLayerAtLatLon,
  getGlobalTemperatureColor,
  getRecentFullModisDateIso,
  getScientificTileOverlayForThematicMap,
  getSmoothElevationRgbTuple,
  getSoilMoistureColorAndRgb,
  getWindSpeedColor,
  isInlandRiverOrLakeAtLatLon,
  isMarineOrOceanWaterAtLatLon,
  isStrictEnclosedSeaAtLatLon,
  isUrbanBuiltCoreAtLatLon,
  sampleMicroPixelCellularPerturbation,
} from './thematicMapRenderer';
import {
  CLASSIC_TOPO_ELEVATION_COLOR_STOPS,
  THEMATIC_COLOR_STOPS,
  evaluateCellForUnifiedLayer,
  getSatelliteMissionCatalog,
  resolveActiveSatelliteSelectionMeta,
  resolveUnifiedActiveLayerSpec,
} from './unifiedLayerManager';
import {
  buildCalibratedSampleLeafAnalysis,
  identifyPlantedCropInZone,
} from './cropRecognitionEngine';
import { computeZonePrincipalAlignmentAngle } from './mapOrientationUtils';
import { debounce } from './debounce';
import {
  hydrateStudyZoneFromCompactRecord,
  loadPersistedFarmState,
  mergeStudyZonesAdditively,
  resolvePreferredActiveZone,
  savePersistedFarmState,
} from '../services/localZonesStorage';
import {
  buildEsaWorldCoverTileUrl,
  buildNasaGibsTileUrl,
  buildSentinel2LandCover10mTileUrl,
  classifyWorldCoverRgbPixel,
  getAuthoritativeLayerSourceMeta,
  getWorldCoverClassLabel,
  parseSoilGridsApiResponse,
} from '../services/authoritativeGisService';
import {
  combineVoiceTranscript,
  extractTranscriptFromResults,
} from './voiceTranscriptHelper';

test('Geodesic area calculation converts m² into Feddans, Qirats, Sahms, and Hectares accurately', () => {
  const mitGhamr = PRESET_FARM_ZONES[0];
  const area = calculateGeodesicArea(mitGhamr.vertices);
  assert.ok(area.squareMeters > 10000, 'Area should be greater than 10,000 m²');
  assert.ok(area.totalFeddansDecimal > 2.5, 'Area should be multiple feddans');
  assert.ok(area.qirats >= 0 && area.qirats < 24, 'Qirats must be between 0 and 23');
  assert.ok(area.sahms >= 0 && area.sahms < 24, 'Sahms must be between 0 and 23');
  assert.equal(
    Number((area.squareMeters / 10000).toFixed(3)),
    area.hectares,
    'Hectares should equal m² / 10,000'
  );
});

test('Multi-spectral remote sensing indices follow exact physical equations', () => {
  const nir = 0.45;
  const red = 0.09;
  const green = 0.11;
  const blue = 0.05;
  const swir1 = 0.18;

  const ndvi = computeNDVI(nir, red);
  assert.equal(ndvi, Number(((0.45 - 0.09) / (0.45 + 0.09)).toFixed(3)));

  const savi = computeSAVI(nir, red, 0.5);
  assert.equal(savi, Number((((0.45 - 0.09) / (0.45 + 0.09 + 0.5)) * 1.5).toFixed(3)));

  const ndmi = computeNDMI(nir, swir1);
  assert.equal(ndmi, Number(((0.45 - 0.18) / (0.45 + 0.18)).toFixed(3)));

  const ndwi = computeNDWI(green, nir, swir1);
  assert.ok(ndwi > -1 && ndwi < 1);

  const evi = computeEVI(nir, red, blue);
  assert.ok(evi > 0.3 && evi < 0.9);

  const esi = computeESI(25.0, ndvi);
  assert.ok(esi >= -2 && esi <= 2);
});

test('Sub-Zone subdivision generates Zone A, B, C with Soil Moisture (0-7cm & 7-28cm), EC, and pH heatmaps', () => {
  const preset = PRESET_FARM_ZONES[0];
  const { subZones, gridCells, farmAverages } = generateSubZonesAndGrid(
    preset.vertices,
    preset.soil,
    preset.baseSpectralBands,
    { sm0to7Pct: 24.5, sm7to28Pct: 31.2 }
  );
  assert.equal(subZones.length, 3);
  assert.equal(subZones[0].id, 'A');
  assert.equal(subZones[1].id, 'B');
  assert.equal(subZones[2].id, 'C');
  assert.ok(gridCells.length >= 3, 'Should generate clipped grid cells inside polygon');
  assert.ok(subZones[2].ndvi > subZones[0].ndvi, 'SW Zone C should have higher vigor than NE Zone A');
  assert.ok(farmAverages.NDVI > 0.2 && farmAverages.NDVI < 0.95);

  // Verify real-time soil moisture & soil EC/pH metrics
  assert.ok(farmAverages.SM_0_7 > 10 && farmAverages.SM_0_7 < 48);
  assert.ok(farmAverages.SM_7_28 > farmAverages.SM_0_7, 'Deep root moisture 7-28cm should exceed surface 0-7cm');
  assert.ok(subZones[0].salinityEC > subZones[2].salinityEC, 'NE Zone A has higher salinity stress than SW Zone C');
  assert.ok(subZones[0].soilPh > subZones[2].soilPh, 'NE Zone A has higher pH alkalinity than SW Zone C');
  assert.ok(subZones[0].amendmentAr.length > 10 && subZones[0].amendmentEn.length > 10);

  // Verify color mapping for new heatmap layers
  assert.ok(getSpectralColor('SM_0_7', 28).startsWith('#'));
  assert.ok(getSpectralColor('SM_7_28', 32).startsWith('#'));
  assert.ok(getSpectralColor('SOIL_EC', 4.8).startsWith('#'));
  assert.ok(getSpectralColor('SOIL_PH', 8.3).startsWith('#'));
});

test('Growth stage & GDD tracker maps accumulated thermal units to 5 crop stages', () => {
  const gddInfo = calculateGrowthStageAndGDD('wheat', '2026-10-01', 0.65, 22);
  assert.equal(gddInfo.stages.length, 5);
  assert.ok(gddInfo.accumulatedGDD > 0);
  assert.ok(gddInfo.completionPct >= 5 && gddInfo.completionPct <= 100);
});

test('Custom Crop Rotation evaluator detects pathological/soil hazards and auto-optimizes sequence', () => {
  const preset = PRESET_FARM_ZONES[0];

  // 1. Default Zone B rotation includes a legume and has high soilHealthScore
  const defaultPlans = buildDefaultCustomRotationPlans('wheat');
  const evalDefaultB = evaluateCustomRotationPlan(defaultPlans.B, preset.soil);
  assert.ok(evalDefaultB.soilHealthScore >= 80, 'Default Zone B plan should have high soil health score');
  assert.ok(evalDefaultB.nitrogenBalanceKgPerFeddan > -50);

  // 2. Default Zone A rotation starts with Wheat -> Maize -> Wheat -> Sorghum (consecutive cereal warnings)
  const evalDefaultA = evaluateCustomRotationPlan(defaultPlans.A, preset.soil);
  assert.ok(
    evalDefaultA.warnings.some((w) => w.id.includes('gramineae')),
    'Zone A baseline cereal sequence should flag consecutive Gramineae warning'
  );

  // 3. Hazardous Solanaceae succession: Potato -> Tomato back-to-back
  const solanaceaeHazardPlan = {
    ...defaultPlans.A,
    slots: defaultPlans.A.slots.map((s, idx) =>
      idx === 0 ? { ...s, cropId: 'potato' } : idx === 1 ? { ...s, cropId: 'tomato' } : s
    ),
  };
  const evalSolanaceae = evaluateCustomRotationPlan(solanaceaeHazardPlan, preset.soil);
  assert.ok(
    evalSolanaceae.warnings.some((w) => w.id.includes('solanaceae')),
    'Should detect Solanaceae Potato -> Tomato succession hazard'
  );

  // 4. Auto-Optimizer repairs future sequence and improves soil health & N balance
  const optimizedPlan = optimizeZoneRotationPlan(defaultPlans.A, preset.soil);
  const evalOptimized = evaluateCustomRotationPlan(optimizedPlan, preset.soil);
  assert.ok(
    evalOptimized.soilHealthScore > evalDefaultA.soilHealthScore,
    'Optimized rotation must improve soilHealthScore'
  );
  assert.ok(
    evalOptimized.nitrogenBalanceKgPerFeddan > evalDefaultA.nitrogenBalanceKgPerFeddan,
    'Optimized rotation must improve biological nitrogen balance'
  );
});

test('Offline PDF Report Generator constructs valid %PDF-1.4 binary document', () => {
  const preset = PRESET_FARM_ZONES[0];
  const centroid = getPolygonCentroid(preset.vertices);
  const area = calculateGeodesicArea(preset.vertices);
  const { subZones, farmAverages } = generateSubZonesAndGrid(
    preset.vertices,
    preset.soil,
    preset.baseSpectralBands
  );
  const forecast14 = buildFallback14DayForecast(centroid);
  const seasonal6 = generateSeasonal6MonthForecast(centroid, preset.soil, 0.95);
  const scored = scoreCropsForFarm(
    preset.soil,
    farmAverages,
    seasonal6,
    area.totalFeddansDecimal,
    preset.currentCropId
  );
  const customRotationPlans = buildDefaultCustomRotationPlans(preset.currentCropId);
  const rotationEvaluations = {
    A: evaluateCustomRotationPlan(customRotationPlans.A, preset.soil),
    B: evaluateCustomRotationPlan(customRotationPlans.B, preset.soil),
    C: evaluateCustomRotationPlan(customRotationPlans.C, preset.soil),
  };

  const lines = buildReportSummaryLines({
    language: 'ar',
    zoneNameAr: preset.nameAr,
    zoneNameEn: preset.nameEn,
    centroid,
    area,
    soil: preset.soil,
    farmAverages,
    subZones,
    forecast14,
    seasonal6Months: seasonal6,
    topCrops: scored,
    customRotationPlans,
    rotationEvaluations,
  });
  assert.ok(lines.length > 15, 'Summary report should contain comprehensive lines');

  const pdfBytes = buildValidPdfDocumentBytes(lines);
  const headerStr = new TextDecoder().decode(pdfBytes.slice(0, 8));
  const footerStr = new TextDecoder().decode(pdfBytes.slice(pdfBytes.length - 10));
  assert.ok(headerStr.startsWith('%PDF-1.4'), 'PDF binary must start with %PDF-1.4 header');
  assert.ok(footerStr.includes('%%EOF'), 'PDF binary must end with %%EOF marker');
});

test('Weather forecasting & MCDA crop scoring engine ranks crops and rotation strategies', () => {
  const preset = PRESET_FARM_ZONES[0];
  const centroid = getPolygonCentroid(preset.vertices);
  const area = calculateGeodesicArea(preset.vertices);
  const { subZones, farmAverages } = generateSubZonesAndGrid(
    preset.vertices,
    preset.soil,
    preset.baseSpectralBands
  );

  const forecast14 = buildFallback14DayForecast(centroid);
  assert.equal(forecast14.length, 14);

  const seasonal6 = generateSeasonal6MonthForecast(centroid, preset.soil, 0.95);
  assert.equal(seasonal6.length, 6);
  assert.ok(seasonal6[0].supplementalIrrigationM3PerFeddan >= 0);

  const alerts = generateSmartWeatherAlerts(forecast14, area.totalFeddansDecimal);
  assert.ok(alerts.length >= 1);

  const scored = scoreCropsForFarm(
    preset.soil,
    farmAverages,
    seasonal6,
    area.totalFeddansDecimal,
    preset.currentCropId
  );
  assert.equal(scored.length, 12);
  assert.ok(scored[0].suitabilityScore >= scored[1].suitabilityScore);
  assert.ok(scored[0].suitabilityScore > 70 && scored[0].suitabilityScore <= 100);

  const rotations = buildRotationStrategies(preset.soil, farmAverages);
  assert.equal(rotations.length, 3);

  const advisorReply = generateLocalAgronomistResponse('إيه أحسن محصول أزرعه؟', {
    zoneNameAr: preset.nameAr,
    zoneNameEn: preset.nameEn,
    area,
    soil: preset.soil,
    farmAverages,
    subZones,
    forecast14,
    topCrops: scored,
    language: 'ar',
  });
  assert.ok(advisorReply.length > 50);
});

test('Coordinate-based Regional Pest Risk Radar & Field Incident Logger evaluate local threats accurately', () => {
  const deltaPreset = PRESET_FARM_ZONES[0]; // Mit Ghamr Nile Delta (wheat, clay)
  const sinaiPreset = PRESET_FARM_ZONES[1]; // Bir al-Abd North Sinai (sandy)

  const deltaCentroid = getPolygonCentroid(deltaPreset.vertices);
  const deltaForecast = buildFallback14DayForecast(deltaCentroid);
  const { farmAverages } = generateSubZonesAndGrid(
    deltaPreset.vertices,
    deltaPreset.soil,
    deltaPreset.baseSpectralBands
  );

  const deltaRisks = evaluateRegionalPestRisks(
    deltaCentroid,
    deltaPreset.soil,
    deltaForecast,
    'wheat',
    farmAverages
  );
  assert.equal(deltaRisks.length, 6);
  assert.ok(
    deltaRisks[0].riskScore >= deltaRisks[1].riskScore,
    'Pest risks should be sorted descending by riskScore'
  );
  assert.ok(
    deltaRisks.some((r) => r.pestId === 'yellow_rust' && r.riskScore >= 65),
    'Nile Delta wheat should flag high/critical risk for Yellow Stripe Rust'
  );

  // Sandy Sinai potato should boost Root-Knot Nematode risk
  const sinaiCentroid = getPolygonCentroid(sinaiPreset.vertices);
  const sinaiRisks = evaluateRegionalPestRisks(
    sinaiCentroid,
    sinaiPreset.soil,
    deltaForecast,
    'potato',
    farmAverages
  );
  const nematodeSinai = sinaiRisks.find((r) => r.pestId === 'root_knot_nematode')!;
  const nematodeDelta = deltaRisks.find((r) => r.pestId === 'root_knot_nematode')!;
  assert.ok(
    nematodeSinai.riskScore > nematodeDelta.riskScore,
    'Sandy North Sinai potato must have higher Root-Knot Nematode risk than Delta clay wheat'
  );

  // Field Incident Logging & Pinning to Zone Coordinates with Regional Prevalence
  assert.ok(
    deltaRisks[0].regionalPrevalencePct >= 14 && deltaRisks[0].regionalPrevalencePct <= 94,
    'Regional prevalence percentage must be within realistic 14-94% range'
  );
  assert.ok(deltaRisks[0].outbreakTrendAr.length > 10);
  assert.ok(deltaRisks[0].preventiveActionAr.length > 15);
  assert.ok(deltaRisks[0].treatmentAlertAr.length > 15);

  const logged = createLoggedPestIncident({
    pestId: 'fall_armyworm',
    subZoneId: 'A',
    severity: 'critical',
    notes: 'يرقات نشطة في بلعوم الذرة',
    centroid: deltaCentroid,
    forecast14: deltaForecast,
  });
  assert.equal(logged.subZoneId, 'A');
  assert.equal(logged.severity, 'critical');
  assert.equal(logged.status, 'active');
  assert.ok(logged.regionalPrevalencePct >= 14 && logged.regionalPrevalencePct <= 94);
  assert.ok(logged.preventativeRecommendationAr.length > 15);
  assert.ok(logged.prescribedActionAr.length > 20);
  assert.ok(logged.coordinates.lat > 30);
});

test('4-Week NPK Nutrient Calculator adapts schedule by crop type, soil texture, and GDD stage', () => {
  // 1. Wheat in Vegetative stage (380 GDD) on Clay vs Sandy soil
  const wheatClayVeg = calculateFourWeekNpkSchedule({
    cropId: 'wheat',
    soilTexture: 'clay',
    accumulatedGDD: 380,
    areaFeddans: 10,
  });
  assert.equal(wheatClayVeg.weeks.length, 4);
  assert.equal(wheatClayVeg.stageKey, 'vegetative');
  assert.ok(wheatClayVeg.total4WeekPureNPerFeddan > wheatClayVeg.total4WeekPureP2O5PerFeddan);

  const wheatSandyVeg = calculateFourWeekNpkSchedule({
    cropId: 'wheat',
    soilTexture: 'sandy',
    accumulatedGDD: 380,
    areaFeddans: 10,
  });
  assert.ok(
    wheatSandyVeg.total4WeekPureNPerFeddan > wheatClayVeg.total4WeekPureNPerFeddan,
    'Sandy soil must increase 4-week N allocation to compensate for leaching'
  );

  // 2. Nitrogen-fixing legume (Fava Bean) requires starter N only compared to Cereal
  const favaBeanVeg = calculateFourWeekNpkSchedule({
    cropId: 'fava_bean',
    soilTexture: 'clay',
    accumulatedGDD: 350,
    areaFeddans: 10,
  });
  assert.ok(
    favaBeanVeg.total4WeekPureNPerFeddan < wheatClayVeg.total4WeekPureNPerFeddan * 0.4,
    'Legume crop must require <40% synthetic Nitrogen compared to Wheat'
  );

  // 3. Potato in Fruiting/Tuber Bulking stage (1150 GDD) shifts priority to Potassium (K2O)
  const potatoBulking = calculateFourWeekNpkSchedule({
    cropId: 'potato',
    soilTexture: 'loamy',
    accumulatedGDD: 1150,
    areaFeddans: 5,
  });
  assert.equal(potatoBulking.stageKey, 'fruiting');
  assert.ok(
    potatoBulking.total4WeekPureK2OPerFeddan > potatoBulking.total4WeekPureNPerFeddan,
    'Tuber bulking stage must prioritize Potassium (K2O) over Nitrogen (N)'
  );
});

test('Sentinel-2 BOA atmospheric normalization & 9x9 spatial texture classifier 100% isolate residential villages (e.g. Mit Mohsen) from green crops', () => {
  const claySoil = PRESET_FARM_ZONES[0].soil;

  // 0. Verify Sentinel-2 TOA-to-BOA atmospheric correction (AOD τ550 = 0.18)
  const boaGreen = normalizeToaToBoaSentinel2(42, 96, 48, { aod550: 0.18 });
  assert.ok(
    boaGreen.b3GreenBoa > boaGreen.b4RedBoa * 1.3,
    'BOA Green Band 3 must strongly exceed BOA Red Band 4 for chlorophyll canopy'
  );
  assert.ok(boaGreen.ngrdiBoa > 0.12);

  // 1. Healthy green agricultural field pixel (Sentinel-2 / Esri dark chlorophyll canopy)
  const greenCropCell = classifyRgbReflectance(42, 96, 48, claySoil, 24.5, {
    sm0to7Pct: 28.5,
    sm7to28Pct: 33.8,
  });
  assert.equal(greenCropCell.landCover, 'dense_crop');
  assert.ok(
    greenCropCell.values.NDVI >= 0.65,
    `Green agricultural crop must have high NDVI >= 0.65 (got ${greenCropCell.values.NDVI})`
  );
  assert.ok(
    greenCropCell.values.NDWI > 0.15,
    `Green agricultural crop must have positive canopy water NDWI > 0.15 (got ${greenCropCell.values.NDWI})`
  );
  assert.ok(
    greenCropCell.values.SM_0_7 >= 26,
    `Irrigated green field must show moist surface soil >= 26% (got ${greenCropCell.values.SM_0_7}%)`
  );
  assert.ok(
    greenCropCell.values.SM_7_28 >= 30,
    `Irrigated green field must show moist root-zone >= 30% (got ${greenCropCell.values.SM_7_28}%)`
  );

  // 2. Concrete building / warehouse / asphalt road pixel (impervious non-green surface)
  const buildingCell = classifyRgbReflectance(182, 176, 168, claySoil, 24.5, {
    sm0to7Pct: 28.5,
    sm7to28Pct: 33.8,
  });
  assert.equal(buildingCell.landCover, 'urban_built');
  assert.ok(
    buildingCell.values.NDVI <= 0.08,
    `Building/road pixel must have near-zero NDVI <= 0.08 (got ${buildingCell.values.NDVI})`
  );
  assert.ok(
    buildingCell.values.NDWI < -0.18,
    `Building/road pixel must have strongly negative NDWI (got ${buildingCell.values.NDWI})`
  );
  assert.ok(
    buildingCell.values.SM_0_7 < 5.0,
    `Impervious building/road must NEVER show wet soil moisture; must be < 5% (got ${buildingCell.values.SM_0_7}%)`
  );

  // 2b. Shadowed Residential Village Block (like Mit Mohsen ميت محسن where dark street shadows mix with dusty roofs: R≈78, G≈76, B≈70)
  const mitMohsenShadowedAlley = classifyRgbReflectance(78, 76, 70, claySoil, 24.5, {
    sm0to7Pct: 28.5,
    sm7to28Pct: 33.8,
  });
  assert.equal(
    mitMohsenShadowedAlley.landCover,
    'urban_built',
    'Shadowed residential village streets (Mit Mohsen) must NEVER be misclassified as green vegetation'
  );
  assert.ok(mitMohsenShadowedAlley.values.NDVI <= 0.07);
  assert.ok(mitMohsenShadowedAlley.values.SM_0_7 < 4.5);

  // 2c. Mixed urban roof+tree-shadow 9x9 window rejection test
  const mixedUrbanWindow = classifyRgbReflectance(
    68,
    76,
    62,
    claySoil,
    24.5,
    { sm0to7Pct: 28.5, sm7to28Pct: 33.8 },
    {
      luminanceStdDev: 0.088,
      brightRoofFraction: 0.32,
      trueGreenPixelFraction: 0.18,
    }
  );
  assert.equal(
    mixedUrbanWindow.landCover,
    'urban_built',
    '9x9 window with concrete rooftops and high luminance variance must be isolated as urban_built'
  );

  // 3. Bare dry uncultivated soil pixel (warm iron-oxide brown soil R > G > B)
  const bareSoilCell = classifyRgbReflectance(118, 86, 52, claySoil, 24.5, {
    sm0to7Pct: 28.5,
    sm7to28Pct: 33.8,
  });
  assert.equal(bareSoilCell.landCover, 'bare_soil');
  assert.ok(
    bareSoilCell.values.NDVI >= 0.11 && bareSoilCell.values.NDVI <= 0.2,
    `Bare soil NDVI must be between 0.11 and 0.20 (got ${bareSoilCell.values.NDVI})`
  );
  assert.ok(
    bareSoilCell.values.SM_0_7 < 16.5,
    `Bare uncultivated soil must show dry surface moisture < 16.5% (got ${bareSoilCell.values.SM_0_7}%)`
  );
});

test('Unified State-Driven Layer Manager synchronizes values, colors, and scientific color-stop legends across all maps and indices', () => {
  const mapKeys = Object.keys(THEMATIC_MAPS_META);
  assert.deepEqual(mapKeys, [
    'natural',
    'vegetation',
    'wind',
    'weather',
    'temperature',
    'drought',
    'rainfall',
    'elevation',
    'dem_drainage',
    'soil_moisture',
    'snow_ice',
    'day_night',
    'apparent_temp',
    'wind_gusts',
    'pressure',
    'thunderstorms',
    'weather_radar',
    'satellite_ir',
    'humidity',
    'air_quality',
  ]);

  const preset = PRESET_FARM_ZONES[0];
  const centroid = getPolygonCentroid(preset.vertices);
  const forecast = buildFallback14DayForecast(centroid);
  const nodes = buildRegionalAndGlobalTelemetryNodes(centroid, forecast[0], 0.75);
  assert.ok(nodes.length >= 6);

  const baseline = generateSubZonesAndGrid(
    preset.vertices,
    preset.soil,
    preset.baseSpectralBands
  );
  const recomputed = recomputeSubZonesAndAveragesFromCells(
    preset.vertices,
    preset.soil,
    baseline.gridCells,
    baseline.subZones
  );
  assert.equal(recomputed.subZones.length, 3);
  assert.ok(recomputed.farmAverages.NDVI > 0.45);

  // Verify Unified Layer Manager updates dynamically when switching between rainfall, wind, weather, and NDVI
  const ndviSpec = resolveUnifiedActiveLayerSpec(
    'vegetation',
    'NDVI',
    recomputed.farmAverages,
    baseline.gridCells,
    forecast,
    0,
    true
  );
  const rainSpec = resolveUnifiedActiveLayerSpec(
    'rainfall',
    'NDVI',
    recomputed.farmAverages,
    baseline.gridCells,
    forecast,
    0,
    true
  );
  const windSpec = resolveUnifiedActiveLayerSpec(
    'wind',
    'NDVI',
    recomputed.farmAverages,
    baseline.gridCells,
    forecast,
    0,
    true
  );

  assert.notEqual(
    ndviSpec.shortAr,
    rainSpec.shortAr,
    'Switching from NDVI to Rainfall must update legend title'
  );
  assert.notEqual(
    ndviSpec.gradientCss,
    rainSpec.gradientCss,
    'Switching from NDVI to Rainfall must update legend color gradient'
  );
  assert.notEqual(
    ndviSpec.meanValueFormatted,
    windSpec.meanValueFormatted,
    'Switching from NDVI to Wind must update active mean value readout'
  );
  assert.equal(ndviSpec.colorStops.length, 5);
  assert.equal(rainSpec.colorStops.length, 5);
  assert.equal(windSpec.colorStops.length, 5);

  const sampleCell = baseline.gridCells[0];
  const cellRainEval = evaluateCellForUnifiedLayer(
    sampleCell,
    'rainfall',
    'NDVI',
    forecast,
    0,
    true
  );
  assert.ok(cellRainEval.valueFormatted.includes('mm'));
  assert.ok(cellRainEval.color.startsWith('#'));

  // Verify RTL vs LTR gradient direction so RTL labels on the right match the 0% color stop
  const windSpecRtl = resolveUnifiedActiveLayerSpec(
    'wind',
    'NDVI',
    recomputed.farmAverages,
    baseline.gridCells,
    forecast,
    0,
    true
  );
  const windSpecLtr = resolveUnifiedActiveLayerSpec(
    'wind',
    'NDVI',
    recomputed.farmAverages,
    baseline.gridCells,
    forecast,
    0,
    false
  );
  assert.ok(
    windSpecRtl.gradientCss.includes('to left'),
    'RTL legend gradient must flow to left so minimum label on the right aligns with 0% color stop'
  );
  assert.ok(
    windSpecLtr.gradientCss.includes('to right'),
    'LTR legend gradient must flow to right'
  );

  // Verify semantic color scale: Dark Green for dense vegetation, Emerald Green for cropland, Yellow for bare soil, Red for urban built-up, Blue for high moisture
  assert.equal(getSpectralColor('NDVI', 0.72), '#047857', 'Dense vegetation must be Dark Forest Green');
  assert.equal(getSpectralColor('NDVI', 0.55), '#10b981', 'Agricultural cropland must be Emerald Green');
  assert.equal(getSpectralColor('NDVI', 0.14), '#eab308', 'Bare uncultivated land must be Yellow');
  assert.equal(getSpectralColor('NDVI', 0.04), '#dc2626', 'Impervious urban surface must be Red');
  assert.equal(getSpectralColor('NDWI', 0.35), '#0284c7', 'High canopy water content must be Cobalt Blue');
  assert.equal(getSpectralColor('NDWI', 0.48), '#1d4ed8', 'Saturated canopy water content must be Deep Royal Blue');
  assert.equal(getSpectralColor('LST', 20.0), '#10b981', 'Safe cool canopy LST must be Green');
  assert.equal(getSpectralColor('LST', 34.0), '#ef4444', 'Extreme heat stress LST must be Red');

  // Verify urban_built cell is isolated in Red (#dc2626) ONLY in vegetation mode, and colored by climatic value in Wind mode
  const urbanCell = {
    ...sampleCell,
    landCover: 'urban_built' as const,
    values: { ...sampleCell.values, NDVI: 0.04 },
  };
  const urbanInVeg = evaluateCellForUnifiedLayer(
    urbanCell,
    'vegetation',
    'NDVI',
    forecast,
    0,
    true
  );
  const urbanInWind = evaluateCellForUnifiedLayer(
    urbanCell,
    'wind',
    'NDVI',
    forecast,
    0,
    true
  );
  assert.equal(urbanInVeg.color, '#dc2626', 'Urban cell must be Red (#dc2626) in vegetation mode');
  assert.notEqual(
    urbanInWind.color,
    '#dc2626',
    'Urban cell in Wind mode must be colored by wind speed, not isolated as red urban'
  );
});

test('Spatial Wind Vector Field varies direction & speed geographically and Localized Rain Clouds isolate wet vs dry zones', () => {
  const preset = PRESET_FARM_ZONES[0];
  const centroid = getPolygonCentroid(preset.vertices);
  const forecast = buildFallback14DayForecast(centroid);

  // 1. Spatially varying wind vectors
  const w1 = evaluateSpatialWindAtLatLon(
    centroid.lat - 0.006,
    centroid.lng - 0.006,
    forecast[0]
  );
  const w2 = evaluateSpatialWindAtLatLon(
    centroid.lat + 0.006,
    centroid.lng + 0.006,
    forecast[0]
  );
  assert.ok(
    w1.dirDeg !== w2.dirDeg || w1.speedKmh !== w2.speedKmh,
    'Wind vectors at distinct coordinates must vary in direction and/or speed'
  );
  assert.equal(getWindSpeedColor(9), '#10b981', 'Calm wind (<12 km/h) must be safe Green');
  assert.equal(getWindSpeedColor(35), '#ef4444', 'Gale wind (>32 km/h) must be hazard Red');

  // 2. Localized Rain Cloud clusters only over precipitation zones
  const rainyDay = { ...forecast[0], precipMm: 6.5, precipProbPct: 72 };
  const clusters = buildLocalizedRainCloudClusters(
    {
      south: centroid.lat - 0.05,
      north: centroid.lat + 0.05,
      west: centroid.lng - 0.05,
      east: centroid.lng + 0.05,
    },
    [rainyDay, ...forecast.slice(1)],
    0,
    [{ id: 'z1', nameAr: 'زونة 1', nameEn: 'Zone 1', centroid }]
  );
  assert.ok(clusters.length >= 1 && clusters.length <= 6, 'Should build localized rain cloud clusters');
  assert.ok(clusters[0].precipMm > 0 && clusters[0].precipProbPct >= 25);

  // Distant dry coordinate should report isRaining === false
  const drySpot = evaluateSpatialRainAtLatLon(
    centroid.lat + 2.5,
    centroid.lng + 2.5,
    [{ ...forecast[0], precipMm: 0, precipProbPct: 5 }],
    0
  );
  assert.equal(drySpot.isRaining, false, 'Distant dry spot must report Clear/Dry sky (isRaining = false)');
  assert.equal(drySpot.precipMm, 0);
});

test('Dark Scientific Map avoids Carto API KEY REQUIRED, Topo Contours avoids OpenTopoMap road clutter, Global Elevation & Dual Temperature Maps work, Map Auto-Straighten & Crop Recognition succeed', () => {
  // 1. Dark Scientific Map must use open Esri Dark Gray Canvas, never cartocdn.com
  assert.ok(
    !BASE_MAP_STYLES.dark_scientific.tileUrl.includes('cartocdn.com'),
    'Dark scientific map must not use CartoDB tiles that display API KEY REQUIRED'
  );
  assert.ok(
    !BASE_MAP_STYLES.topo_contours.tileUrl.includes('opentopomap.org') &&
      Boolean(BASE_MAP_STYLES.topo_contours.hillshadeUrl?.includes('World_Hillshade')),
    'Topo contours style must use satellite terrain + Esri World Hillshade instead of cluttered OpenTopoMap road tiles'
  );

  // 2. Global Elevation evaluator returns accurate elevation & slope for Nile Delta vs Cairo/New Cairo escarpment vs Sinai highlands
  const deltaElev = evaluateGlobalElevationAtLatLon(30.728, 31.275, 0.001, 'scientific_hypsometric');
  const newCairoElev = evaluateGlobalElevationAtLatLon(30.02, 31.52, 0.001, 'scientific_hypsometric');
  const sinaiElevSci = evaluateGlobalElevationAtLatLon(28.55, 33.95, 0.02, 'scientific_hypsometric');
  const sinaiElevClassic = evaluateGlobalElevationAtLatLon(28.55, 33.95, 0.02, 'classic_topographic');
  assert.ok(deltaElev.elevationMeters >= 1 && deltaElev.elevationMeters <= 30);
  assert.ok(
    newCairoElev.elevationExactMeters > deltaElev.elevationExactMeters + 25,
    'New Cairo / Mokattam ridge must rise significantly above Nile Delta floor'
  );
  assert.ok(sinaiElevSci.elevationMeters > 450, 'Sinai mountains should be high elevation');
  assert.notEqual(
    sinaiElevSci.color,
    sinaiElevClassic.color,
    'Scientific hypsometric and Classic topographic palettes should produce distinct ridge colors'
  );

  // 3. Global Temperature evaluator supports both 2m Air and Surface/Soil LST modes
  const preset = PRESET_FARM_ZONES[0];
  const centroid = getPolygonCentroid(preset.vertices);
  const forecast = buildFallback14DayForecast(centroid);
  const tempLst = evaluateGlobalTemperatureAtLatLon(30.7, 31.2, forecast[0], 'surface_lst');
  const tempAir = evaluateGlobalTemperatureAtLatLon(30.7, 31.2, forecast[0], 'air_2m');
  assert.ok(tempLst.surfaceLstC > tempAir.airTemp2mC);
  assert.equal(tempLst.activeValueC, tempLst.surfaceLstC);
  assert.equal(tempAir.activeValueC, tempAir.airTemp2mC);

  // 4. Map Auto-Straighten computes a valid 0..360 rotation angle for a tilted polygon
  const tiltedPoly = [
    { lat: 30.72, lng: 31.27 },
    { lat: 30.724, lng: 31.278 },
    { lat: 30.718, lng: 31.281 },
    { lat: 30.714, lng: 31.273 },
  ];
  const alignRes = computeZonePrincipalAlignmentAngle(tiltedPoly, 0);
  assert.ok(alignRes.recommendedRotationDeg >= 0 && alignRes.recommendedRotationDeg < 360);
  assert.ok(alignRes.longestEdgeLengthMeters > 100);

  // 5. Intelligent Planted Crop Recognition & Calibrated Leaf Sample Analysis
  const area = calculateGeodesicArea(preset.vertices);
  const baseline = generateSubZonesAndGrid(
    preset.vertices,
    preset.soil,
    preset.baseSpectralBands
  );
  const cloverLeaf = buildCalibratedSampleLeafAnalysis('clover');
  const recognition = identifyPlantedCropInZone(
    baseline.gridCells,
    baseline.farmAverages,
    preset.soil,
    area,
    forecast,
    cloverLeaf
  );
  assert.ok(recognition.primaryCandidate, 'Should identify a primary planted crop candidate');
  assert.ok(
    recognition.primaryCandidate.confidencePct >= 50 &&
      recognition.primaryCandidate.confidencePct <= 99
  );
  assert.ok(
    Object.keys(recognition.cellClassifications).length === baseline.gridCells.length,
    'Every cell in the zone should have a crop/land-cover classification'
  );
});

test('Egyptian Strategic Crops (Wheat, Maize, Cotton) Pest & Disease Rotation Mitigation, Open-Meteo soil_moisture_0cm / soil_moisture_7cm Overlay, and Continental Land/Ocean Masking succeed', () => {
  // 1. Verify Wheat, Maize, and Cotton have commonPestsAndDiseases and rotation mitigation summaries
  for (const cropId of ['wheat', 'maize', 'cotton']) {
    const crop = CROP_DATABASE.find((c) => c.id === cropId);
    assert.ok(crop, `Crop ${cropId} must exist in CROP_DATABASE`);
    assert.ok(
      crop.commonPestsAndDiseases && crop.commonPestsAndDiseases.length >= 2,
      `Crop ${cropId} must have at least 2 common pests and diseases`
    );
    assert.ok(
      crop.rotationPestMitigationSummaryAr && crop.rotationPestMitigationSummaryAr.length > 20,
      `Crop ${cropId} must have Arabic rotation pest mitigation summary`
    );
    assert.ok(
      crop.rotationPestMitigationSummaryEn && crop.rotationPestMitigationSummaryEn.length > 20,
      `Crop ${cropId} must have English rotation pest mitigation summary`
    );
  }

  // 2. Verify Rotation Strategies include pestAndDiseaseMitigation entries
  const preset = PRESET_FARM_ZONES[0];
  const baseline = generateSubZonesAndGrid(
    preset.vertices,
    preset.soil,
    preset.baseSpectralBands
  );
  const strategies = buildRotationStrategies(preset.soil, baseline.farmAverages);
  for (const strat of strategies) {
    assert.ok(
      strat.pestAndDiseaseMitigation && strat.pestAndDiseaseMitigation.length >= 3,
      `Rotation strategy ${strat.id} must include pestAndDiseaseMitigation entries`
    );
  }

  // 3. Verify Open-Meteo soil_moisture_0cm vs soil_moisture_7cm overlay evaluation
  const centroid = getPolygonCentroid(preset.vertices);
  const forecast = buildFallback14DayForecast(centroid);
  const sm0 = evaluateSoilMoistureOverlayAtLatLon(
    centroid.lat,
    centroid.lng,
    'soil_moisture_0cm',
    forecast[0]
  );
  const sm7 = evaluateSoilMoistureOverlayAtLatLon(
    centroid.lat,
    centroid.lng,
    'soil_moisture_7cm',
    forecast[0]
  );
  assert.ok(sm0.moisture0cmPct > 5 && sm0.moisture0cmPct < 50);
  assert.ok(
    sm7.moisture7cmPct > sm0.moisture0cmPct,
    'Root-zone soil_moisture_7cm should retain higher volumetric moisture than surface soil_moisture_0cm'
  );
  assert.equal(sm0.activeVolumetricPct, sm0.moisture0cmPct);
  assert.equal(sm7.activeVolumetricPct, sm7.moisture7cmPct);

  // 4. Verify High-Precision Continental Land/Ocean Mask prevents ocean/sea painting
  assert.equal(
    isMarineOrOceanWaterAtLatLon(33.5, 28.0),
    true,
    'Eastern Mediterranean Sea (33.5N, 28.0E) must be masked as marine water'
  );
  assert.equal(
    isMarineOrOceanWaterAtLatLon(24.0, 36.2),
    true,
    'Red Sea axis (24.0N, 36.2E) must be masked as marine water'
  );
  assert.equal(
    isMarineOrOceanWaterAtLatLon(15.0, -40.0),
    true,
    'Mid-Atlantic Ocean must be masked as marine water'
  );
  assert.equal(
    isMarineOrOceanWaterAtLatLon(0.0, -140.0),
    true,
    'Pacific Ocean must be masked as marine water'
  );
  assert.equal(
    isMarineOrOceanWaterAtLatLon(30.728, 31.275),
    false,
    'Mit Ghamr Nile Delta agricultural land must NOT be masked as marine water'
  );
  assert.equal(
    isMarineOrOceanWaterAtLatLon(30.044, 31.235),
    false,
    'Cairo mainland must NOT be masked as marine water'
  );

  // 5. Verify Georeferenced Scientific Tile Overlay specs (including NASA GIBS IMERG & MODIS Cloud)
  const elevSciTile = getScientificTileOverlayForThematicMap('elevation', '3d_contours');
  const smSciTile = getScientificTileOverlayForThematicMap('soil_moisture');
  const rainSciTile = getScientificTileOverlayForThematicMap('rainfall');
  const weatherSciTile = getScientificTileOverlayForThematicMap('weather');
  assert.ok(elevSciTile?.tileUrl.includes('World_Hillshade'));
  assert.ok(elevSciTile?.secondaryTileUrl?.includes('opentopomap.org'));
  assert.ok(smSciTile?.tileUrl.includes('SMAP_L4_Analyzed_Root_Zone_Soil_Moisture'));
  assert.ok(rainSciTile?.tileUrl.includes('IMERG_Precipitation_Rate'));
  assert.ok(weatherSciTile?.tileUrl.includes('MODIS_Terra_Cloud_Fraction_Day'));

  // 6. Verify dry days (0mm, 8% prob) produce ZERO fake rain cloud clusters even when future days have rain
  assert.equal(forecast[0].precipMm, 0, 'Day 0 (Today) should be dry 0mm in baseline forecast');
  assert.ok(
    typeof forecast[0].solarRadiationMjM2 === 'number' && forecast[0].solarRadiationMjM2 > 8,
    'Forecast must include NASA POWER solarRadiationMjM2'
  );
  assert.ok(
    typeof forecast[0].earthSkinTempC === 'number',
    'Forecast must include NASA POWER earthSkinTempC (TS)'
  );
  const dryDayClusters = buildLocalizedRainCloudClusters(
    {
      south: centroid.lat - 0.05,
      north: centroid.lat + 0.05,
      west: centroid.lng - 0.05,
      east: centroid.lng + 0.05,
    },
    forecast,
    0,
    [{ id: 'z1', nameAr: 'ميت غمر', nameEn: 'Mit Ghamr', centroid }]
  );
  assert.equal(
    dryDayClusters.length,
    0,
    'Dry day (0mm / 8%) must produce ZERO rain cloud clusters — never fake >70% clouds'
  );
});

test('All 8 thematic maps synchronize gap-free NASA GIBS endpoints, calibrated 1:1 official colormap stops without bleeding, and elevation palettes 100%', () => {
  // 1. All composite GIBS layers use /default/default/ & Temperature uses gap-free 8-day LST; Weather uses full STD date
  for (const mapId of ['vegetation', 'rainfall', 'temperature', 'soil_moisture', 'drought'] as const) {
    const spec = getScientificTileOverlayForThematicMap(mapId);
    assert.ok(spec, `Expected tile overlay spec for ${mapId}`);
    assert.ok(
      spec.tileUrl.includes('/default/default/'),
      `GIBS endpoint for ${mapId} must use live /default/default/ path (got ${spec.tileUrl})`
    );
    assert.ok(
      !spec.tileUrl.includes('2024-10-16'),
      `GIBS endpoint for ${mapId} must not contain stale 2024-10-16 date`
    );
  }
  const tempSpec = getScientificTileOverlayForThematicMap('temperature');
  assert.ok(
    tempSpec?.tileUrl.includes('MODIS_Terra_L3_Land_Surface_Temp_8Day_Day'),
    'Temperature layer must use gap-free 8-day composite MODIS LST'
  );
  const weatherSpec = getScientificTileOverlayForThematicMap('weather');
  assert.ok(
    weatherSpec?.tileUrl.includes(`MODIS_Terra_Cloud_Fraction_Day/default/${getRecentFullModisDateIso(4)}/`),
    'Weather cloud layer must use recent full-orbit STD date instead of partial daily NRT strips'
  );

  // 2. Verify exact official NASA RGB stops in THEMATIC_COLOR_STOPS & resolveUnifiedActiveLayerSpec
  const preset = PRESET_FARM_ZONES[0];
  const centroid = getPolygonCentroid(preset.vertices);
  const forecast = buildFallback14DayForecast(centroid);
  const baseline = generateSubZonesAndGrid(
    preset.vertices,
    preset.soil,
    preset.baseSpectralBands
  );

  const expectedMarkers: Record<keyof typeof THEMATIC_COLOR_STOPS, string[]> = {
    natural: ['#1e3a8a', '#15803d'],
    vegetation: ['#dfcec2', '#056400'],
    rainfall: ['#00764e', '#f30000'],
    temperature: ['#006bff', '#ff6a00'],
    soil_moisture: ['#ffa200', '#008eff'],
    drought: ['#ffa200', '#008eff'],
    weather: ['#64748b', '#ff0005'],
    wind: ['#10b981', '#ef4444'],
    elevation: ['#0d9488', '#f8fafc'],
    dem_drainage: ['#1d4ed8', '#ea580c'],
    snow_ice: ['#0f172a', '#f8fafc'],
    day_night: ['#020617', '#fef08a'],
    apparent_temp: ['#c084fc', '#dc2626'],
    wind_gusts: ['#475569', '#7f1d1d'],
    pressure: ['#4c1d95', '#7f1d1d'],
    thunderstorms: ['#475569', '#dc2626'],
    weather_radar: ['#475569', '#dc2626'],
    satellite_ir: ['#0f172a', '#f8fafc'],
    humidity: ['#786028', '#ffffff'],
    air_quality: ['#3b82f6', '#450a0a'],
  };

  for (const mapId of Object.keys(expectedMarkers) as Array<keyof typeof THEMATIC_COLOR_STOPS>) {
    const stops = THEMATIC_COLOR_STOPS[mapId];
    const resolvedRtl = resolveUnifiedActiveLayerSpec(
      mapId,
      'NDVI',
      baseline.farmAverages,
      baseline.gridCells,
      forecast,
      0,
      true,
      'scientific_hypsometric'
    );
    const resolvedLtr = resolveUnifiedActiveLayerSpec(
      mapId,
      'NDVI',
      baseline.farmAverages,
      baseline.gridCells,
      forecast,
      0,
      false,
      'scientific_hypsometric'
    );
    assert.equal(resolvedRtl.colorStops.length, stops.length);
    assert.equal(resolvedRtl.colorStops[0].color, expectedMarkers[mapId][0]);
    assert.equal(
      resolvedRtl.colorStops[resolvedRtl.colorStops.length - 1].color,
      expectedMarkers[mapId][1]
    );
    assert.ok(resolvedRtl.gradientCss.includes('to left'));
    assert.ok(resolvedLtr.gradientCss.includes('to right'));
  }

  // 3. Elevation Classic Topographic palette synchronizes legend & stops and 1:1 non-bleeding RGB tuples
  const elevClassic = resolveUnifiedActiveLayerSpec(
    'elevation',
    'NDVI',
    baseline.farmAverages,
    baseline.gridCells,
    forecast,
    0,
    true,
    'classic_topographic'
  );
  assert.equal(elevClassic.colorStops.length, CLASSIC_TOPO_ELEVATION_COLOR_STOPS.length);
  assert.equal(elevClassic.colorStops[0].color, '#0f766e');
  assert.equal(elevClassic.colorStops[elevClassic.colorStops.length - 1].color, '#e2e8f0');
  assert.deepEqual(getSmoothElevationRgbTuple(30, 'scientific_hypsometric'), [22, 163, 74]);
  assert.deepEqual(getSmoothElevationRgbTuple(1500, 'scientific_hypsometric'), [220, 38, 38]);

  // 4. Verify 1:1 non-bleeding NASA colormaps for Rainfall, Drought/SM, Temperature, and Wind evaluators & cells
  assert.equal(getGlobalTemperatureColor(-4), '#006bff');
  assert.equal(getGlobalTemperatureColor(22), '#afff00');
  assert.equal(getGlobalTemperatureColor(44), '#ff6a00');
  assert.equal(getSoilMoistureColorAndRgb(6).color, '#ffa200');
  assert.equal(getSoilMoistureColorAndRgb(25).color, '#53a900');
  assert.equal(getSoilMoistureColorAndRgb(46).color, '#008eff');
  assert.equal(getWindSpeedColor(15), '#06b6d4');
  assert.equal(getWindSpeedColor(28), '#f59e0b');

  const rainEvaluated = evaluateSpatialRainAtLatLon(
    centroid.lat,
    centroid.lng,
    [{ ...forecast[0], precipMm: 6.0, precipProbPct: 80 }],
    0
  );
  assert.ok(
    ['#00764e', '#68cb00', '#f7d900', '#ff5f25', '#f30000'].includes(rainEvaluated.color),
    `Expected NASA GPM IMERG rain hex, got ${rainEvaluated.color}`
  );
  const sampleCellRain = evaluateCellForUnifiedLayer(
    baseline.gridCells[0],
    'rainfall',
    'NDVI',
    [{ ...forecast[0], precipMm: 6.0, precipProbPct: 80 }],
    0,
    true
  );
  assert.ok(
    ['#00764e', '#68cb00', '#f7d900', '#ff5f25', '#f30000'].includes(sampleCellRain.color),
    `Expected NASA GPM IMERG cell color, got ${sampleCellRain.color}`
  );
  const sampleCellDrought = evaluateCellForUnifiedLayer(
    baseline.gridCells[0],
    'drought',
    'SM_0_7',
    forecast,
    0,
    true
  );
  assert.ok(
    ['#ffa200', '#fff800', '#53a900', '#00ca95', '#008eff'].includes(sampleCellDrought.color),
    `Expected NASA SMAP cell color for drought, got ${sampleCellDrought.color}`
  );
});

test('Multi-Year (3–5 Year) Crop Rotation Strategies, Proactive Pest & Disease Outbreak Alert System, and All 10 Spectral/Soil Spatial Map Evaluators work accurately', () => {
  const preset = PRESET_FARM_ZONES[0];
  const centroid = getPolygonCentroid(preset.vertices);
  const forecast = buildFallback14DayForecast(centroid);
  const baseline = generateSubZonesAndGrid(
    preset.vertices,
    preset.soil,
    preset.baseSpectralBands
  );

  // 1. Verify 3, 4, and 5-year Multi-Year Crop Rotation Strategies
  for (const cycleYears of [3, 4, 5] as const) {
    const strategies = generateMultiYearRotationStrategies(
      preset.soil,
      baseline.farmAverages,
      5,
      cycleYears
    );
    assert.equal(strategies.length, 3);
    assert.deepEqual(
      strategies.map((s) => s.id),
      ['soil_regeneration', 'water_conservation', 'economic_maximization']
    );
    for (const strat of strategies) {
      assert.equal(strat.yearlySequence.length, cycleYears);
      assert.equal(strat.egyptianCropExamplesAr.length, 3);
      assert.equal(strat.egyptianCropExamplesEn.length, 3);
      assert.ok(strat.expectedBenefits.soilHealthScoreGainPct > 20);
      assert.ok(strat.expectedBenefits.pestReductionPct >= 75);
      assert.ok(strat.expectedBenefits.waterSavingsPct >= 20);
      assert.ok(strat.marketImplications.cumulativeNetProfitPerFeddanEgp > 150000);
    }
  }

  // 2. Verify Proactive Pest & Disease Outbreak Alert System across Wheat, Maize, Cotton & Vegetables
  const outbreakAlerts = evaluateZonePestOutbreakAlerts(
    centroid,
    preset.soil,
    forecast,
    'wheat',
    baseline.farmAverages,
    baseline.subZones
  );
  assert.equal(outbreakAlerts.length, 6);
  assert.equal(
    outbreakAlerts[0].cropCategory,
    'wheat',
    'When currentCropId is wheat, wheat alerts must be prioritized at the top'
  );
  for (const alert of outbreakAlerts) {
    assert.ok(alert.likelihoodPct >= 40 && alert.likelihoodPct <= 98);
    assert.ok(alert.vulnerableSubZones.length >= 1);
    assert.ok(alert.preventativeActionsAr.length >= 3);
    assert.ok(alert.preventativeActionsEn.length >= 3);
    assert.ok(alert.advisorPromptAr.length > 20);
    assert.ok(alert.advisorPromptEn.length > 20);
  }

  // Verify AI Agronomist responds with detailed IPM protocol when queried from a pest alert
  const scored = scoreCropsForFarm(
    preset.soil,
    baseline.farmAverages,
    generateSeasonal6MonthForecast(centroid, preset.soil, 0.95),
    5,
    'wheat'
  );
  const ipmReplyAr = generateLocalAgronomistResponse(outbreakAlerts[0].advisorPromptAr, {
    zoneNameAr: preset.nameAr,
    zoneNameEn: preset.nameEn,
    area: calculateGeodesicArea(preset.vertices),
    soil: preset.soil,
    farmAverages: baseline.farmAverages,
    subZones: baseline.subZones,
    forecast14: forecast,
    topCrops: scored,
    language: 'ar',
  });
  assert.ok(
    ipmReplyAr.includes('IPM') && ipmReplyAr.includes('زونا C'),
    'AI Agronomist must provide zone-targeted IPM guidance for pest alerts'
  );

  // 3. Verify all 10 Spectral/Soil Indices evaluate smoothly on land & respect northern Nile Delta coastline
  assert.equal(
    isMarineOrOceanWaterAtLatLon(31.48, 31.05),
    false,
    'Northern Nile Delta coast (Baltim/Kafr El Sheikh at 31.48N, 31.05E) must be classified as land, not sea'
  );
  const all10Keys = [
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
  ] as const;
  for (const key of all10Keys) {
    const res = evaluateSpatialSpectralOrSoilAtLatLon(
      centroid.lat,
      centroid.lng,
      key,
      forecast[0],
      12
    );
    assert.ok(res.colorHex.startsWith('#'), `Expected hex color for ${key}`);
    assert.equal(res.rgb.length, 3, `Expected RGB tuple for ${key}`);
    assert.ok(res.formattedValue.length > 0, `Expected formatted readout for ${key}`);
  }
});

test('14-Day Environmental Disaster Early Warning Engine, Ventusky Continuous Land+Ocean Weather Field, and 100% Continental Land Coverage succeed', () => {
  const preset = PRESET_FARM_ZONES[0];
  const centroid = getPolygonCentroid(preset.vertices);
  const forecast = buildFallback14DayForecast(centroid);

  // 1. Verify 14-Day Environmental Disaster Early Warning Engine covers all 5 major hazards
  const warnings = evaluateEnvironmentalDisasterWarnings(
    forecast,
    preset.soil,
    preset.nameAr,
    preset.nameEn,
    centroid
  );
  assert.equal(warnings.length, 5, 'Must generate all 5 environmental disaster warnings');
  const hazardTypes = warnings.map((w) => w.disasterType).sort();
  assert.deepEqual(hazardTypes, [
    'flash_flood',
    'frost',
    'heatwave',
    'sandstorm_wind',
    'severe_drought',
  ]);

  for (const w of warnings) {
    assert.ok(w.probabilityPct >= 40 && w.probabilityPct <= 98);
    assert.ok(w.countdownHours >= 12);
    assert.ok(w.emergencyProtocol.preEvent72to24hAr.length >= 2);
    assert.ok(w.emergencyProtocol.duringEventAr.length >= 2);
    assert.ok(w.emergencyProtocol.postEventRecoveryAr.length >= 2);
    assert.ok(w.resilientCrops.length >= 3, 'Each disaster must recommend at least 3 resilient Egyptian cultivars');
  }

  // 2. Verify Ventusky-style Atmospheric Field renders across BOTH Land and Ocean (100% coverage for Weather maps)
  const medSeaTemp = evaluateVentuskyAtmosphericFieldAtLatLon(33.5, 28.0, 'temperature', forecast[0]);
  const nileDeltaTemp = evaluateVentuskyAtmosphericFieldAtLatLon(30.7, 31.2, 'temperature', forecast[0]);
  assert.ok(medSeaTemp.a > 150, 'Ventusky temperature layer must render over Mediterranean Sea');
  assert.ok(nileDeltaTemp.a > 150, 'Ventusky temperature layer must render over Nile Delta land');

  const itczRain = evaluateVentuskyAtmosphericFieldAtLatLon(4.0, 20.0, 'rainfall', forecast[0]);
  assert.ok(itczRain.a > 50, 'Equatorial rain belt must show active precipitation alpha');

  const cloudField = evaluateVentuskyAtmosphericFieldAtLatLon(50.0, 10.0, 'weather', forecast[0]);
  assert.ok(cloudField.r >= 0 && cloudField.g >= 0 && cloudField.b >= 0);

  // 3. Verify 100% Continental Land Coverage without Sinai, Arabia, Turkey, or Nile Delta polygon self-intersection holes
  const criticalLandPoints: Array<{ name: string; lat: number; lng: number }> = [
    { name: 'Central Nile Delta (Tanta)', lat: 30.78, lng: 31.0 },
    { name: 'North Nile Delta (Kafr El Sheikh)', lat: 31.35, lng: 30.95 },
    { name: 'North Sinai (El Arish)', lat: 31.05, lng: 33.8 },
    { name: 'Central Sinai', lat: 29.5, lng: 33.7 },
    { name: 'South Sinai (Saint Catherine)', lat: 28.55, lng: 33.95 },
    { name: 'Central Saudi Arabia (Riyadh)', lat: 24.7, lng: 46.7 },
    { name: 'Central Turkey (Anatolia)', lat: 39.0, lng: 35.0 },
    { name: 'Faiyum Depression Egypt', lat: 29.3, lng: 30.8 },
  ];
  for (const pt of criticalLandPoints) {
    assert.equal(
      isMarineOrOceanWaterAtLatLon(pt.lat, pt.lng),
      false,
      `${pt.name} (${pt.lat}, ${pt.lng}) must be classified as 100% Land, never ocean`
    );
    assert.equal(
      isStrictEnclosedSeaAtLatLon(pt.lat, pt.lng),
      false,
      `${pt.name} (${pt.lat}, ${pt.lng}) must never be inside strict enclosed sea mask`
    );
  }
});

test('Esri Tile 2D Bilinear Interpolation, MapZonesView Dynamic Land-Boundary Correction, and Open-Meteo Wind Vector Coverage succeed', () => {
  // 1. Verify sub-pixel 2D Bilinear Interpolation on a 256x256 synthetic Esri World Imagery RGBA buffer
  const width = 256;
  const height = 256;
  const data = new Uint8ClampedArray(width * height * 4);
  const setPx = (x: number, y: number, r: number, g: number, b: number) => {
    const idx = (y * width + x) * 4;
    data[idx] = r;
    data[idx + 1] = g;
    data[idx + 2] = b;
    data[idx + 3] = 255;
  };
  setPx(10, 10, 40, 100, 40);
  setPx(11, 10, 80, 140, 60);
  setPx(10, 11, 60, 120, 50);
  setPx(11, 11, 100, 160, 70);

  const midBilinear = sampleBilinearRgbFromEsriTile(
    { data, width, height } as unknown as ImageData,
    10.5,
    10.5
  );
  // Exact bilinear mean of (40,80,60,100)=70, (100,140,120,160)=130, (40,60,50,70)=55
  assert.equal(Math.round(midBilinear.r), 70);
  assert.equal(Math.round(midBilinear.g), 130);
  assert.equal(Math.round(midBilinear.b), 55);

  // 2. Verify applyBilinearSmoothingToSpatialGridMatrix & applyDynamicLandCoverageAndBilinearTileSmoothing
  const preset = PRESET_FARM_ZONES[0];
  const centroid = getPolygonCentroid(preset.vertices);
  const forecast = buildFallback14DayForecast(centroid);
  const baseline = generateSubZonesAndGrid(
    preset.vertices,
    preset.soil,
    preset.baseSpectralBands
  );

  // Inject a sharp artificial spike in one vegetation cell to verify Bilinear smoothing attenuates pixelation
  const rawCells = baseline.gridCells.map((c, idx) =>
    idx === 0
      ? {
          ...c,
          landCover: 'dense_crop' as const,
          values: { ...c.values, NDVI: 0.92, SAVI: 0.78 },
        }
      : {
          ...c,
          landCover: 'moderate_crop' as const,
          values: { ...c.values, NDVI: 0.48, SAVI: 0.38 },
        }
  );

  const bilinearSmoothed = applyBilinearSmoothingToSpatialGridMatrix(
    rawCells,
    preset.vertices,
    preset.soil
  );
  assert.equal(bilinearSmoothed.length, rawCells.length);
  assert.ok(
    bilinearSmoothed[0].values.NDVI < 0.92 && bilinearSmoothed[0].values.NDVI > 0.48,
    `Bilinear kernel must smooth sharp neighboring cell jumps (got ${bilinearSmoothed[0].values.NDVI})`
  );
  for (const cell of bilinearSmoothed) {
    assert.ok(Number.isFinite(cell.values.NDVI) && cell.values.NDVI > 0);
    assert.ok(Number.isFinite(cell.values.SAVI) && cell.values.SAVI > 0);
    assert.ok(Number.isFinite(cell.values.SM_0_7) && cell.values.SM_0_7 > 0);
  }

  // 3. Verify Port Said (31.26N, 32.30E) and Damietta / Ras El Bar (31.51N, 31.83E) are 100% preserved as land
  assert.equal(
    isMarineOrOceanWaterAtLatLon(31.26, 32.3),
    false,
    'Port Said (31.26N, 32.30E) must be classified as Land'
  );
  assert.equal(
    isMarineOrOceanWaterAtLatLon(31.51, 31.83),
    false,
    'Damietta / Ras El Bar (31.51N, 31.83E) must be classified as Land'
  );

  // 4. Verify Open-Meteo wind speed, direction, and color evaluation across both Land and Oceans
  const landWind = evaluateSpatialWindAtLatLon(30.8, 31.0, forecast[0]);
  const oceanWind = evaluateSpatialWindAtLatLon(34.2, 26.5, forecast[0]);
  assert.ok(landWind.speedKmh >= 5 && landWind.speedKmh <= 45);
  assert.ok(oceanWind.speedKmh >= 5 && oceanWind.speedKmh <= 45);
  assert.ok(landWind.dirDeg >= 0 && landWind.dirDeg <= 360);
  assert.ok(oceanWind.dirDeg >= 0 && oceanWind.dirDeg <= 360);
  assert.ok(landWind.color.startsWith('#'));
  assert.ok(oceanWind.color.startsWith('#'));
});

test('Snow & Blizzard Tracking Map (snow_ice), Day/Night Solar Terminator Map (day_night), and Micro-Pixel Cellular Perturbation succeed', () => {
  const preset = PRESET_FARM_ZONES[0];
  const centroid = getPolygonCentroid(preset.vertices);
  const forecast = buildFallback14DayForecast(centroid);
  const baseline = generateSubZonesAndGrid(
    preset.vertices,
    preset.soil,
    preset.baseSpectralBands
  );

  // 1. Snow & Blizzard evaluator distinguishes warm lowland Delta vs cold snowy St. Catherine / Alps peaks
  const warmDeltaWeather = { ...forecast[0], tempMinC: 12, tempMaxC: 24, precipMm: 0, windSpeedKmh: 14 };
  const coldAlpsWeather = { ...forecast[0], tempMinC: -6, tempMaxC: -1, precipMm: 18, windSpeedKmh: 48 };
  const deltaSnow = evaluateGlobalSnowAndBlizzardAtLatLon(30.72, 31.26, warmDeltaWeather, 14);
  const sinaiPeakSnow = evaluateGlobalSnowAndBlizzardAtLatLon(28.55, 33.97, forecast[0], 2629);
  const alpsBlizzard = evaluateGlobalSnowAndBlizzardAtLatLon(46.55, 8.55, coldAlpsWeather, 3450);

  assert.equal(deltaSnow.snowDepthCm, 0, 'Warm Nile Delta lowland must have 0 cm snow');
  assert.ok(deltaSnow.freezingLevelMeters > 1000, 'Freezing level must be reported in meters ASL');
  assert.ok(
    sinaiPeakSnow.snowDepthCm > 0 || sinaiPeakSnow.criticalFrostTempC <= 5,
    'High Sinai Saint Catherine peak (2629m) must show highland chill/frost or snow accumulation'
  );
  assert.ok(
    alpsBlizzard.snowDepthCm >= 15 && alpsBlizzard.zoneClass === 'blizzard_storm',
    'High Alps under strong winds and precipitation must report blizzard & snow depth >= 15 cm'
  );

  // 2. Day/Night Solar Terminator evaluator accurately separates sunlit noon from deep night
  const cairoNoonUtc10 = evaluateGlobalDayNightSolarAtLatLon(30.04, 31.23, 10.0); // 12:00 Local in Egypt
  const cairoMidnightUtc22 = evaluateGlobalDayNightSolarAtLatLon(30.04, 31.23, 22.0); // 00:00 Local in Egypt
  assert.ok(
    cairoNoonUtc10.solarElevationDeg > 25 && cairoNoonUtc10.solarRadiationWm2 > 400,
    `Cairo at 10:00 UTC (12:00 local) must be in bright daylight (got elev ${cairoNoonUtc10.solarElevationDeg}°, ${cairoNoonUtc10.solarRadiationWm2} W/m²)`
  );
  assert.ok(
    cairoMidnightUtc22.solarElevationDeg < -15 && cairoMidnightUtc22.solarRadiationWm2 === 0,
    `Cairo at 22:00 UTC (00:00 local) must be in deep night with 0 W/m² (got elev ${cairoMidnightUtc22.solarElevationDeg}°)`
  );
  assert.equal(cairoMidnightUtc22.phase, 'night');
  assert.ok(cairoNoonUtc10.daylightHours >= 9 && cairoNoonUtc10.daylightHours <= 15);

  // 3. Micro-pixel cellular perturbation produces deterministic high-detail variation in [-1, 1]
  const p1 = sampleMicroPixelCellularPerturbation(30.7281, 31.2751, 8, 10, 12);
  const p2 = sampleMicroPixelCellularPerturbation(30.7295, 31.2768, 8, 14, 16);
  assert.ok(p1.deltaScalar >= -1 && p1.deltaScalar <= 1 && p2.deltaScalar >= -1 && p2.deltaScalar <= 1);
  assert.notEqual(
    p1.microCellId,
    p2.microCellId,
    'Adjacent micro-cells must have distinct micro-pixel texture cell IDs'
  );

  // 4. Unified Layer Manager resolves snow_ice and day_night specs & 5 color stops each
  const snowSpec = resolveUnifiedActiveLayerSpec(
    'snow_ice',
    'NDVI',
    baseline.farmAverages,
    baseline.gridCells,
    forecast,
    0,
    true
  );
  const dayNightSpec = resolveUnifiedActiveLayerSpec(
    'day_night',
    'NDVI',
    baseline.farmAverages,
    baseline.gridCells,
    forecast,
    0,
    true
  );
  assert.equal(snowSpec.colorStops.length, 5);
  assert.equal(dayNightSpec.colorStops.length, 5);
  assert.ok(snowSpec.shortAr.includes('الثلوج'));
  assert.ok(dayNightSpec.shortAr.includes('الوقت'));
});

test('Ventusky Atmospheric, Radar/Lightning, Isobar Pressure, Altitude Levels, Air Quality/UV & White Borders succeed', () => {
  const preset = PRESET_FARM_ZONES[0];
  const centroid = getPolygonCentroid(preset.vertices);
  const forecast = buildFallback14DayForecast(centroid);
  const baseline = generateSubZonesAndGrid(
    preset.vertices,
    preset.soil,
    preset.baseSpectralBands
  );

  // 1. Pressure altitude switching on Temperature (2m vs 850 hPa vs 700 hPa)
  const temp2m = evaluateVentuskyLayerAtLatLon(30.04, 31.23, 'temperature', { pressureAltitude: '2m', utcHour: 12 }, forecast[0]);
  const temp850 = evaluateVentuskyLayerAtLatLon(30.04, 31.23, 'temperature', { pressureAltitude: '850hPa', utcHour: 12 }, forecast[0]);
  const temp700 = evaluateVentuskyLayerAtLatLon(30.04, 31.23, 'temperature', { pressureAltitude: '700hPa', utcHour: 12 }, forecast[0]);
  assert.ok(temp2m.numericValue > temp850.numericValue + 5, '850 hPa upper air must be colder than 2m surface');
  assert.ok(temp850.numericValue > temp700.numericValue + 5, '700 hPa must be colder than 850 hPa');

  // 2. Apparent temp, wind gusts, MSL pressure & H/L centers
  const appTemp = evaluateVentuskyLayerAtLatLon(30.04, 31.23, 'apparent_temp', { utcHour: 14 }, forecast[0]);
  assert.equal(appTemp.unit, '°C');
  const gust = evaluateVentuskyLayerAtLatLon(34.5, 27.5, 'wind_gusts', { utcHour: 12 }, forecast[0]);
  const sustainedWind = evaluateVentuskyLayerAtLatLon(34.5, 27.5, 'wind', { utcHour: 12 }, forecast[0]);
  assert.ok(gust.numericValue >= sustainedWind.numericValue, 'Wind gusts must exceed or match sustained wind speed');

  const siberianHigh = evaluateVentuskyLayerAtLatLon(50.0, 92.0, 'pressure', { utcHour: 12 }, forecast[0]);
  const northAtlanticLow = evaluateVentuskyLayerAtLatLon(57.0, -24.0, 'pressure', { utcHour: 12 }, forecast[0]);
  assert.ok(siberianHigh.numericValue >= 1020 && siberianHigh.numericValue <= 1054);
  assert.ok(northAtlanticLow.numericValue >= 940 && northAtlanticLow.numericValue <= 1000);

  // 3. Weather Radar dBZ & Blitzortung lightning bolt trigger in storm core
  const stormRadar = evaluateVentuskyLayerAtLatLon(26.5, -78.0, 'weather_radar', { utcHour: 12 }, forecast[0]);
  assert.ok(stormRadar.numericValue >= 20, 'Tropical storm core must show active radar dBZ echo');
  const capeCore = evaluateVentuskyLayerAtLatLon(2.5, 20.0, 'thunderstorms', { utcHour: 12 }, forecast[0]);
  assert.ok(capeCore.numericValue > 500, 'Equatorial convective belt must show elevated CAPE J/kg');

  // 4. Relative Humidity 2m vs Dew Point
  const rh2m = evaluateVentuskyLayerAtLatLon(30.04, 31.23, 'humidity', { pressureAltitude: '2m', utcHour: 12 }, forecast[0]);
  const dewPt = evaluateVentuskyLayerAtLatLon(30.04, 31.23, 'humidity', { pressureAltitude: 'dew_point', utcHour: 12 }, forecast[0]);
  assert.equal(rh2m.unit, '%');
  assert.equal(dewPt.unit, '°C');
  assert.ok(rh2m.numericValue >= 8 && rh2m.numericValue <= 99);

  // 5. Air quality pollutants: Dust over Sahara/Egypt, PM2.5, and UV diurnal shift
  const saharaDust = evaluateVentuskyLayerAtLatLon(21.5, 6.0, 'air_quality', { airPollutant: 'DUST', utcHour: 12 }, forecast[0]);
  const oceanClean = evaluateVentuskyLayerAtLatLon(0.0, -140.0, 'air_quality', { airPollutant: 'DUST', utcHour: 12 }, forecast[0]);
  assert.ok(saharaDust.numericValue > oceanClean.numericValue + 20, 'Sahara desert belt must have higher Dust concentration than mid-Pacific');
  const cairoNoonUv = evaluateVentuskyLayerAtLatLon(30.04, 31.23, 'air_quality', { airPollutant: 'UV', utcHour: 10 }, forecast[0]);
  const cairoNightUv = evaluateVentuskyLayerAtLatLon(30.04, 31.23, 'air_quality', { airPollutant: 'UV', utcHour: 22 }, forecast[0]);
  assert.ok(cairoNoonUv.numericValue > 3 && cairoNightUv.numericValue === 0, 'UV Index must peak during midday and drop to 0 at midnight');

  // 6. Unified Layer Manager switches units cleanly for Ventusky options
  const uvSpec = resolveUnifiedActiveLayerSpec(
    'air_quality',
    'NDVI',
    baseline.farmAverages,
    baseline.gridCells,
    forecast,
    0,
    true,
    'scientific_hypsometric',
    { airPollutant: 'UV' }
  );
  const dewSpec = resolveUnifiedActiveLayerSpec(
    'humidity',
    'NDVI',
    baseline.farmAverages,
    baseline.gridCells,
    forecast,
    0,
    true,
    'scientific_hypsometric',
    { pressureAltitude: 'dew_point' }
  );
  assert.equal(uvSpec.unit.trim(), 'UV');
  assert.equal(dewSpec.unit.trim(), '°C');

  // 7. Crisp White Borders & Ventusky Cities Catalog are populated
  assert.ok(GLOBAL_WHITE_BORDER_POLYLINES.length >= 15);
  assert.ok(VENTUSKY_CITIES_CATALOG.length >= 15);
});

test('Egypt, France, and Palestine remain Land with distinct regional & dynamic time/day variations', () => {
  const forecast = buildFallback14DayForecast({ lat: 30.04, lng: 31.23 });
  const todayIso = new Date().toISOString().slice(0, 10);
  assert.equal(forecast[0].date, todayIso, 'Day 0 forecast must start on current UTC date');

  // Land classification across France, Palestine, and Egypt
  assert.equal(isMarineOrOceanWaterAtLatLon(48.85, 2.35), false, 'Paris France must be Land');
  assert.equal(isMarineOrOceanWaterAtLatLon(48.1, -3.5), false, 'Brittany France must be Land');
  assert.equal(isMarineOrOceanWaterAtLatLon(43.3, 5.37), false, 'Marseille France must be Land');
  assert.equal(isMarineOrOceanWaterAtLatLon(31.77, 35.21), false, 'Jerusalem Palestine must be Land');
  assert.equal(isMarineOrOceanWaterAtLatLon(31.5, 34.47), false, 'Gaza Palestine must be Land');
  assert.equal(isMarineOrOceanWaterAtLatLon(32.72, 35.32), false, 'Galilee Palestine must be Land');
  assert.equal(isMarineOrOceanWaterAtLatLon(30.04, 31.23), false, 'Cairo Egypt must be Land');

  // Regional agricultural & soil differentiation (France humid vs Palestine fertile/Negev vs Egypt Delta/Desert)
  const parisNdvi = evaluateSpatialSpectralOrSoilAtLatLon(48.3, 1.8, 'NDVI', forecast[0], 110);
  const alpsNdvi = evaluateSpatialSpectralOrSoilAtLatLon(45.6, 6.4, 'NDVI', forecast[0], 2600);
  assert.ok(parisNdvi.numericValue > alpsNdvi.numericValue + 0.15, 'Paris Basin farmland must exceed high Alps NDVI');

  const parisEc = evaluateSpatialSpectralOrSoilAtLatLon(48.3, 1.8, 'SOIL_EC', forecast[0], 110);
  const qattaraEc = evaluateSpatialSpectralOrSoilAtLatLon(29.75, 27.3, 'SOIL_EC', forecast[0], -50);
  assert.ok(parisEc.numericValue < 1.5, 'Temperate France soil EC must be low (<1.5 dS/m)');
  assert.ok(qattaraEc.numericValue > 3.5, 'Qattara salt flat EC must exceed 3.5 dS/m');

  const galileeNdvi = evaluateSpatialSpectralOrSoilAtLatLon(32.72, 35.32, 'NDVI', forecast[0], 250);
  const negevNdvi = evaluateSpatialSpectralOrSoilAtLatLon(30.65, 34.85, 'NDVI', forecast[0], 350);
  assert.ok(galileeNdvi.numericValue > negevNdvi.numericValue + 0.2, 'Galilee must be greener than Negev');

  // Dynamic UTC time and day progression across Egypt, France & Palestine (never frozen)
  const parisTempMorning = evaluateVentuskyLayerAtLatLon(48.85, 2.35, 'temperature', { utcHour: 5 }, forecast[0]);
  const parisTempAfternoon = evaluateVentuskyLayerAtLatLon(48.85, 2.35, 'temperature', { utcHour: 14 }, forecast[0]);
  assert.ok(parisTempAfternoon.numericValue > parisTempMorning.numericValue + 2, 'Paris temp must warm significantly between 05:00 and 14:00 UTC');

  const jerusalemDawn = evaluateGlobalDayNightSolarAtLatLon(31.77, 35.21, 4.5);
  const jerusalemNight = evaluateGlobalDayNightSolarAtLatLon(31.77, 35.21, 20.0);
  assert.ok(jerusalemDawn.solarElevationDeg > jerusalemNight.solarElevationDeg + 20);
  assert.ok(jerusalemNight.alpha < 180, 'Night shadow must stay translucent so country borders & geography remain visible');
});

test('Plant-Only Vegetation Mask isolates true plants and excludes barren Mediterranean coasts, rivers, lakes, and urban buildings', () => {
  const forecast = buildFallback14DayForecast({ lat: 30.72, lng: 31.27 });

  // 1. No fake Mediterranean coastal green belt over desert shorelines
  const matruhCoast = evaluateSpatialSpectralOrSoilAtLatLon(31.35, 27.24, 'NDVI', forecast[0], 10);
  const alameinCoast = evaluateSpatialSpectralOrSoilAtLatLon(30.84, 28.95, 'NDVI', forecast[0], 8);
  const sinaiDesertCoast = evaluateSpatialSpectralOrSoilAtLatLon(31.12, 33.65, 'NDVI', forecast[0], 12);
  assert.ok(matruhCoast.numericValue <= 0.16, `Marsa Matruh desert coast must not be green (got ${matruhCoast.numericValue})`);
  assert.ok(alameinCoast.numericValue <= 0.16, `El Alamein desert coast must not be green (got ${alameinCoast.numericValue})`);
  assert.ok(sinaiDesertCoast.numericValue <= 0.16, `North Sinai desert coast must not be green (got ${sinaiDesertCoast.numericValue})`);

  // 2. Real Egyptian farmlands remain fertile while rivers, lakes & metropolitan cores are isolated out
  const mitGhamrFarm = evaluateSpatialSpectralOrSoilAtLatLon(30.728, 31.275, 'NDVI', forecast[0], 12);
  const cairoUrban = evaluateSpatialSpectralOrSoilAtLatLon(30.055, 31.245, 'NDVI', forecast[0], 25);
  const nileChannel = evaluateSpatialSpectralOrSoilAtLatLon(27.18, 31.20, 'NDVI', forecast[0], 40);
  const lakeBurullus = evaluateSpatialSpectralOrSoilAtLatLon(31.49, 30.85, 'NDVI', forecast[0], 1);
  assert.ok(mitGhamrFarm.numericValue >= 0.50, `Mit Ghamr cropland must stay high NDVI (got ${mitGhamrFarm.numericValue})`);
  assert.equal(isUrbanBuiltCoreAtLatLon(30.055, 31.245), true);
  assert.equal(isInlandRiverOrLakeAtLatLon(27.18, 31.20), true);
  assert.equal(isInlandRiverOrLakeAtLatLon(31.49, 30.85), true);
  assert.ok(cairoUrban.numericValue <= 0.06, `Cairo urban core must be masked out (got ${cairoUrban.numericValue})`);
  assert.ok(nileChannel.numericValue <= 0.05, `Nile River channel must be masked out (got ${nileChannel.numericValue})`);
  assert.ok(lakeBurullus.numericValue <= 0.05, `Lake Burullus must be masked out (got ${lakeBurullus.numericValue})`);

  // 3. Satellite RGB plant-only pixel classifier rejects desert, buildings, asphalt, rivers & coastal lagoons
  const cropPx = classifySatellitePixelForVegetationOverlay(44, 96, 36, 30.728, 31.275, 0, 'NDVI');
  const forestPx = classifySatellitePixelForVegetationOverlay(26, 62, 24, 48.2, 2.1, 0, 'NDVI');
  assert.equal(cropPx.isPlant, true, 'Chlorophyll cropland pixel must be classified as plant');
  assert.ok(cropPx.alpha >= 160 && cropPx.rgb[1] > cropPx.rgb[0]);
  assert.equal(forestPx.isPlant, true, 'Dark forest canopy pixel must be classified as plant');

  const desertPx = classifySatellitePixelForVegetationOverlay(198, 172, 134, 27.5, 29.5, 0, 'NDVI');
  const beachPx = classifySatellitePixelForVegetationOverlay(215, 200, 172, 31.34, 27.25, 0, 'NDVI');
  const roofPx = classifySatellitePixelForVegetationOverlay(152, 148, 144, 30.05, 31.25, 0.7, 'NDVI');
  const roadPx = classifySatellitePixelForVegetationOverlay(64, 66, 68, 30.73, 31.27, 0.5, 'NDVI');
  const riverPx = classifySatellitePixelForVegetationOverlay(24, 42, 48, 28.11, 30.76, 0, 'NDVI');
  const turbidRiverPx = classifySatellitePixelForVegetationOverlay(52, 58, 48, 30.40, 31.18, 0, 'NDVI');
  const cyanLagoonPx = classifySatellitePixelForVegetationOverlay(32, 76, 70, 31.45, 30.85, 0, 'NDVI');

  for (const [label, res] of [
    ['Desert sand', desertPx],
    ['Coastal beach', beachPx],
    ['Urban building roof', roofPx],
    ['Asphalt road', roadPx],
    ['Nile river water', riverPx],
    ['Turbid river water', turbidRiverPx],
    ['Cyan coastal lagoon', cyanLagoonPx],
  ] as const) {
    assert.equal(res.isPlant, false, `${label} must NOT be painted as vegetation`);
    assert.equal(res.alpha, 0, `${label} must have alpha=0 (transparent)`);
  }
});

test('Automated NDWI Water Mask and Dynamic Binary Vegetation Mask isolate active crops cleanly', () => {
  // 1. Geo-flagged marine & inland water surfaces must yield positive NDWI and exclude water
  const marineRes = evaluateAutomatedNdwiWaterMask({
    green: 0.12,
    red: 0.08,
    blue: 0.22,
    isGeographyMarine: true,
  });
  assert.equal(marineRes.isWaterSurface, true);
  assert.equal(marineRes.waterSourceReason, 'coastal_marine');
  assert.ok(marineRes.ndwiValue > 0.4);

  const riverRes = evaluateAutomatedNdwiWaterMask({
    green: 0.14,
    nir: 0.05,
    isGeographyInlandWater: false,
  });
  assert.equal(riverRes.isWaterSurface, true, 'Spectral NIR<Green must trigger NDWI water exclusion');
  assert.equal(riverRes.waterSourceReason, 'spectral_ndwi_water');
  assert.ok(riverRes.ndwiValue > 0.3);

  const cropNdwiRes = evaluateAutomatedNdwiWaterMask({
    green: 0.11,
    nir: 0.48,
    red: 0.07,
    blue: 0.06,
  });
  assert.equal(cropNdwiRes.isWaterSurface, false, 'Healthy crop NIR reflectance must remain land surface');
  assert.ok(cropNdwiRes.ndwiValue < 0);

  // 2. Dynamic thresholding computes Otsu-blended vegetation floor across bimodal samples
  const bimodalSamples = [
    ...Array.from({ length: 12 }, (_, i) => ({ ndvi: 0.08 + i * 0.008, ndwi: -0.22 })),
    ...Array.from({ length: 12 }, (_, i) => ({ ndvi: 0.46 + i * 0.02, ndwi: -0.35 })),
    { ndvi: -0.2, ndwi: 0.55 }, // water sample ignored in threshold calibration
  ];
  const dynamicThresh = computeDynamicBinaryVegetationThreshold(bimodalSamples);
  assert.ok(dynamicThresh >= 0.25 && dynamicThresh <= 0.36, `Unexpected threshold: ${dynamicThresh}`);

  // 3. Binary mask filter produces 1 strictly for active crops and 0 for water, urban, and bare soil
  const activeCropMask = applyDynamicBinaryVegetationMask({
    ndvi: 0.64,
    ndwi: -0.34,
    dynamicThreshold: dynamicThresh,
  });
  assert.equal(activeCropMask.binaryMask, 1);
  assert.equal(activeCropMask.landClass, 'active_crop');
  assert.equal(activeCropMask.maskedNdvi, 0.64);

  const waterMask = applyDynamicBinaryVegetationMask({
    ndvi: 0.35,
    ndwi: 0.18,
    dynamicThreshold: dynamicThresh,
  });
  assert.equal(waterMask.binaryMask, 0);
  assert.equal(waterMask.isWaterExcluded, true);
  assert.equal(waterMask.landClass, 'excluded_water');
  assert.equal(waterMask.maskedNdvi, 0);

  const urbanMask = applyDynamicBinaryVegetationMask({
    ndvi: 0.22,
    ndwi: -0.15,
    isGeographyUrbanCore: true,
    dynamicThreshold: dynamicThresh,
  });
  assert.equal(urbanMask.binaryMask, 0);
  assert.equal(urbanMask.isUrbanExcluded, true);
  assert.equal(urbanMask.landClass, 'excluded_urban');

  const bareSoilMask = applyDynamicBinaryVegetationMask({
    ndvi: 0.14,
    ndwi: -0.21,
    dynamicThreshold: dynamicThresh,
  });
  assert.equal(bareSoilMask.binaryMask, 0);
  assert.equal(bareSoilMask.isBarrenExcluded, true);
  assert.equal(bareSoilMask.landClass, 'excluded_bare_soil');
});

test('Manual custom crop & soil inputs map to scientific references while preserving exact labels', () => {
  const grapeRef = resolveCustomCropReference('عنب سبيريور');
  assert.equal(grapeRef.customCropLabel, 'عنب سبيريور');
  assert.equal(grapeRef.canonicalCropId, 'olive');

  const mangoRef = resolveCustomCropReference('Mango Keitt');
  assert.equal(mangoRef.customCropLabel, 'Mango Keitt');
  assert.equal(mangoRef.canonicalCropId, 'olive');

  const barleyRef = resolveCustomCropReference('شعير صحراوي');
  assert.equal(barleyRef.customCropLabel, 'شعير صحراوي');
  assert.equal(barleyRef.canonicalCropId, 'wheat');

  const clayRef = resolveCustomSoilTextureReference('طينية ثقيلة سوداء');
  assert.equal(clayRef.customTextureLabel, 'طينية ثقيلة سوداء');
  assert.equal(clayRef.canonicalTexture, 'clay');

  const sandyRef = resolveCustomSoilTextureReference('رملية صحراوية ناعمة');
  assert.equal(sandyRef.customTextureLabel, 'رملية صحراوية ناعمة');
  assert.equal(sandyRef.canonicalTexture, 'sandy');

  const calcRef = resolveCustomSoilTextureReference('تربة جيرية كلسية');
  assert.equal(calcRef.customTextureLabel, 'تربة جيرية كلسية');
  assert.equal(calcRef.canonicalTexture, 'calcareous');
});

test('AI Advisor operates in mock-free general agronomy mode when hasUserZones is false', () => {
  const dummyZone = PRESET_FARM_ZONES[0];
  const dummyArea = calculateGeodesicArea(dummyZone.vertices);
  const dummyForecast = buildFallback14DayForecast({ lat: 27.0, lng: 28.0 });
  const dummyGen = generateSubZonesAndGrid(dummyZone.vertices, dummyZone.soil, dummyZone.baseSpectralBands);
  const dummySeasonal = generateSeasonal6MonthForecast({ lat: 27.0, lng: 28.0 }, dummyZone.soil);
  const dummyTopCrops = scoreCropsForFarm(
    dummyZone.soil,
    dummyGen.farmAverages,
    dummySeasonal,
    dummyArea.totalFeddansDecimal
  );

  const arGeneral = generateLocalAgronomistResponse('ما هو أفضل محصول شتوي؟', {
    zoneNameAr: 'زونة غير مضافة',
    zoneNameEn: 'None',
    area: dummyArea,
    soil: dummyZone.soil,
    farmAverages: dummyGen.farmAverages,
    subZones: dummyGen.subZones,
    forecast14: dummyForecast,
    topCrops: dummyTopCrops,
    language: 'ar',
    hasUserZones: false,
  });
  assert.ok(arGeneral.includes('لا توجد زونة مضافة'), 'Arabic response must clearly state general mode without user zones');
  assert.ok(!arGeneral.includes('ميت غمر'), 'Must NOT contain hardcoded Mit Ghamr mock data');

  const enGeneral = generateLocalAgronomistResponse('How should I schedule irrigation?', {
    zoneNameAr: 'None',
    zoneNameEn: 'None',
    area: dummyArea,
    soil: dummyZone.soil,
    farmAverages: dummyGen.farmAverages,
    subZones: dummyGen.subZones,
    forecast14: dummyForecast,
    topCrops: dummyTopCrops,
    language: 'en',
    hasUserZones: false,
  });
  assert.ok(enGeneral.includes('No study zone defined yet'), 'English response must state general mode without user zones');
  assert.ok(!enGeneral.includes('Mit Ghamr'), 'Must NOT contain hardcoded Mit Ghamr mock data');
});

test('Farmland-Aware Vegetation Classifier colors olive crops green, inner fallow yellow/muddy plots light green, and leaves buildings/open desert uncolored', () => {
  // 1. Moderate olive-green field crop (e.g. Beheira / West Delta emerging wheat or orchard) -> Active Green Crop
  const oliveCrop = classifySatellitePixelForVegetationOverlay(
    78,
    92,
    48,
    30.65,
    30.52,
    0,
    'NDVI',
    0.27,
    0.22
  );
  assert.equal(oliveCrop.isPlant, true, 'Olive-green active cropland must be included in vegetation cover');
  assert.equal(oliveCrop.isFallowFarmland, false);
  assert.ok(oliveCrop.alpha >= 160 && oliveCrop.rgb[1] > oliveCrop.rgb[0]);

  // 2. Fallow / unplanted yellow-clay plot surrounded by active farms (cropNeighborDensity = 0.22) -> Light Green
  const fallowYellowFarm = classifySatellitePixelForVegetationOverlay(
    158,
    132,
    82,
    30.64,
    30.51,
    0,
    'NDVI',
    0.27,
    0.22
  );
  assert.equal(fallowYellowFarm.isPlant, true, 'Yellow/clay plot inside farmland must receive light-green tint');
  assert.equal(fallowYellowFarm.isFallowFarmland, true);
  assert.ok(fallowYellowFarm.rgb[1] >= 225 && fallowYellowFarm.rgb[0] >= 160, 'Expected bright light-green tint');
  assert.ok(fallowYellowFarm.alpha > 0);

  const muddyTilledFarm = classifySatellitePixelForVegetationOverlay(
    114,
    94,
    62,
    30.66,
    30.54,
    0.05,
    'NDVI',
    0.27,
    0.18
  );
  assert.equal(muddyTilledFarm.isPlant, true, 'Muddy tilled farmland amidst crops must receive light-green tint');
  assert.equal(muddyTilledFarm.isFallowFarmland, true);

  // 3. Same yellow sand pixel in open desert (cropNeighborDensity = 0.0) -> Uncolored / Transparent
  const openDesert = classifySatellitePixelForVegetationOverlay(
    158,
    132,
    82,
    27.4,
    29.1,
    0,
    'NDVI',
    0.27,
    0.0
  );
  assert.equal(openDesert.isPlant, false, 'Open desert outside agricultural clusters must remain uncolored');
  assert.equal(openDesert.alpha, 0);

  // 4. Buildings & concrete rooftops even directly adjacent to farms -> Strictly uncolored (alpha = 0)
  const buildingNearFarms = classifySatellitePixelForVegetationOverlay(
    154,
    152,
    148,
    30.65,
    30.53,
    0.1,
    'NDVI',
    0.27,
    0.35
  );
  assert.equal(buildingNearFarms.isPlant, false, 'Buildings near farms must remain completely uncolored');
  assert.equal(buildingNearFarms.alpha, 0);

  // 5. Color Legend updated with light green stop for unplanted farmland
  assert.equal(THEMATIC_COLOR_STOPS.vegetation[1].color, '#bef264');
});

test('Zone cell vegetation overlay colors active crops green, fallow/clay soil light green, and excludes buildings/water from coloring', () => {
  const preset = PRESET_FARM_ZONES[0];
  const baseline = generateSubZonesAndGrid(preset.vertices, preset.soil, preset.baseSpectralBands);
  const templateCell = baseline.gridCells[0];

  // 1. Yellow/muddy unplanted clay plot classification in satellitePixelAnalyzer
  const muddyFallowCell = classifyRgbReflectance(166, 140, 102, preset.soil, 24.5, {
    sm0to7Pct: 28,
    sm7to28Pct: 33,
  });
  assert.equal(muddyFallowCell.landCover, 'bare_soil');
  assert.ok(muddyFallowCell.values.NDVI >= 0.11 && muddyFallowCell.values.NDVI <= 0.20);

  // 2. Olive orchard / emerging green crop classification in satellitePixelAnalyzer
  const oliveOrchardCell = classifyRgbReflectance(84, 88, 52, preset.soil, 24.5, {
    sm0to7Pct: 28,
    sm7to28Pct: 33,
  });
  assert.ok(
    oliveOrchardCell.landCover === 'moderate_crop' || oliveOrchardCell.landCover === 'dense_crop',
    `Olive crop pixel should classify as active crop (got ${oliveOrchardCell.landCover})`
  );

  // 3. Visual overlay mapping for vegetation layer
  const denseVis = resolveZoneCellVegetationOverlayVisual(
    { ...templateCell, landCover: 'dense_crop', values: { ...templateCell.values, NDVI: 0.72 } },
    'vegetation',
    'NDVI'
  );
  assert.equal(denseVis.shouldColor, true);
  assert.equal(denseVis.colorHex, '#118414');

  const modVis = resolveZoneCellVegetationOverlayVisual(
    { ...templateCell, landCover: 'moderate_crop', values: { ...templateCell.values, NDVI: 0.42 } },
    'vegetation',
    'NDVI'
  );
  assert.equal(modVis.shouldColor, true);
  assert.equal(modVis.colorHex, '#48b416');

  const fallowVis = resolveZoneCellVegetationOverlayVisual(
    { ...templateCell, landCover: 'bare_soil', values: { ...templateCell.values, NDVI: 0.16 } },
    'vegetation',
    'NDVI'
  );
  assert.equal(fallowVis.shouldColor, true);
  assert.equal(fallowVis.colorHex, '#bef264');
  assert.equal(fallowVis.category, 'fallow_clay');

  const builtVis = resolveZoneCellVegetationOverlayVisual(
    { ...templateCell, landCover: 'urban_built', values: { ...templateCell.values, NDVI: 0.04 } },
    'vegetation',
    'NDVI'
  );
  assert.equal(builtVis.shouldColor, false, 'Buildings must be excluded from vegetation coloring');
  assert.equal(builtVis.colorHex, null);

  const waterVis = resolveZoneCellVegetationOverlayVisual(
    { ...templateCell, landCover: 'water_canal', values: { ...templateCell.values, NDVI: 0.02 } },
    'vegetation',
    'NDVI'
  );
  assert.equal(waterVis.shouldColor, false, 'Water surfaces must be excluded from vegetation coloring');
  assert.equal(waterVis.colorHex, null);
});

test('Open-Meteo zone push alert evaluator triggers on heavy rainfall or extreme heatwaves only when a study zone is active', () => {
  const baseForecast = buildFallback14DayForecast({ lat: 30.728, lng: 31.275 }).map((d) => ({
    ...d,
    precipMm: 0.2,
    precipProbPct: 10,
    tempMaxC: 28.5,
  }));

  // 1. Calm weather -> 0 push alerts
  const calmAlerts = evaluateOpenMeteoZonePushAlerts(
    baseForecast,
    'مزرعة الدلتا',
    'Delta Farm',
    'z-1',
    true
  );
  assert.equal(calmAlerts.length, 0, 'Calm forecast must produce zero push alerts');

  // 2. Extreme weather when NO study zone is active -> 0 push alerts
  const stormyForecast = baseForecast.map((d, idx) =>
    idx === 2
      ? { ...d, precipMm: 18.4, precipProbPct: 88 }
      : idx === 5
      ? { ...d, tempMaxC: 41.5, et0Mm: 8.6 }
      : d
  );
  const noZoneAlerts = evaluateOpenMeteoZonePushAlerts(
    stormyForecast,
    'مزرعة الدلتا',
    'Delta Farm',
    null,
    false
  );
  assert.equal(noZoneAlerts.length, 0, 'Must not fire push alerts when no study zone is defined');

  // 3. Heavy rain + extreme heatwave for active study zone -> triggers both alerts with Arabic/English copy
  const activeAlerts = evaluateOpenMeteoZonePushAlerts(
    stormyForecast,
    'مزرعة الدلتا',
    'Delta Farm',
    'z-1',
    true
  );
  assert.equal(activeAlerts.length, 2, 'Expected both heavy_rain and heatwave push alerts');
  const rainAlert = activeAlerts.find((a) => a.type === 'heavy_rain');
  const heatAlert = activeAlerts.find((a) => a.type === 'heatwave');
  assert.ok(rainAlert && rainAlert.metricBadge === '18.4 mm' && rainAlert.titleAr.includes('مزرعة الدلتا'));
  assert.ok(heatAlert && heatAlert.metricBadge === '41.5°C' && heatAlert.severity === 'critical');
});

test('DEM Drainage layer classifies field depressions, computes downhill flow azimuth, and generates virtualized field points matrix', () => {
  // 1. Low-lying concave basin surrounded by higher ground -> waterlogging_depression (#1d4ed8)
  const basin = classifyDemDrainageFromNeighborhood(10.0, 11.4, 11.2, 11.5, 10.7, 100);
  assert.equal(basin.drainageClass, 'waterlogging_depression');
  assert.equal(basin.color, '#1d4ed8');
  assert.ok(basin.relativeDepressionMeters > 0.35);
  assert.ok(basin.waterAccumulationRiskPct >= 68);
  assert.ok(basin.flowAzimuthDeg >= 0 && basin.flowAzimuthDeg < 360);

  // 2. Elevated ridge shedding water southward/downhill -> elevated_runoff (#ea580c)
  const ridge = classifyDemDrainageFromNeighborhood(26.0, 24.0, 24.2, 24.5, 17.0, 60);
  assert.equal(ridge.drainageClass, 'elevated_runoff');
  assert.equal(ridge.color, '#ea580c');
  assert.ok(ridge.slopePct >= 6.0);

  // 3. Coordinate evaluator & Unified Layer Manager integration
  const pointDem = evaluateDemDrainageAtLatLon(30.728, 31.275, 0.0028);
  assert.ok(Number.isFinite(pointDem.elevationMeters));
  assert.ok(pointDem.drainageAdviceAr.length > 10);

  const preset = PRESET_FARM_ZONES[0];
  const centroid = getPolygonCentroid(preset.vertices);
  const forecast = buildFallback14DayForecast(centroid);
  const baseline = generateSubZonesAndGrid(preset.vertices, preset.soil, preset.baseSpectralBands);
  const cellEval = evaluateCellForUnifiedLayer(
    baseline.gridCells[0],
    'dem_drainage',
    'NDVI',
    forecast,
    0,
    true
  );
  assert.ok(['#1d4ed8', '#06b6d4', '#84cc16', '#ea580c'].includes(cellEval.color));
  assert.ok(cellEval.valueFormatted.includes('m'));

  const spec = resolveUnifiedActiveLayerSpec(
    'dem_drainage',
    'NDVI',
    baseline.farmAverages,
    baseline.gridCells,
    forecast,
    0,
    true
  );
  assert.equal(spec.colorStops.length, 4);
  assert.ok(spec.formulaCode.includes('D8_Flow'));

  // 4. Virtualized field points matrix sorted lowest-elevation-first with unique IDs
  const matrix = buildVirtualizedFieldPointsMatrix([], centroid, 'lowest_elevation', 256);
  assert.equal(matrix.length, 256);
  const uniqueIds = new Set(matrix.map((r) => r.id));
  assert.equal(uniqueIds.size, 256);
  for (let i = 1; i < matrix.length; i++) {
    assert.ok(matrix[i].elevationMeters >= matrix[i - 1].elevationMeters);
  }
});

test('Debounce utility coalesces rapid zoom/pan callbacks and supports cancel & flush', async () => {
  let calls = 0;
  let lastVal = '';
  const debouncedFn = debounce((val: string) => {
    calls++;
    lastVal = val;
  }, 40);

  debouncedFn('z1');
  debouncedFn('z2');
  debouncedFn('z3');
  assert.equal(calls, 0, 'Trailing debounce must not fire synchronously');

  await new Promise((resolve) => setTimeout(resolve, 80));
  assert.equal(calls, 1, 'Rapid zoom/pan bursts should coalesce into one invocation');
  assert.equal(lastVal, 'z3');

  debouncedFn('cancelled');
  debouncedFn.cancel();
  await new Promise((resolve) => setTimeout(resolve, 60));
  assert.equal(calls, 1, 'Cancelled debounced call must not execute');

  debouncedFn('flushed');
  debouncedFn.flush();
  assert.equal(calls, 2);
  assert.equal(lastVal, 'flushed');
});

test('CSV serialization properly escapes commas, quotes, newlines and includes UTF-8 BOM', () => {
  assert.equal(escapeCsvCell('simple'), 'simple');
  assert.equal(escapeCsvCell(42.5), '42.5');
  assert.equal(escapeCsvCell('wheat, clover'), '"wheat, clover"');
  assert.equal(escapeCsvCell('quote "here"'), '"quote ""here"""');
  assert.equal(escapeCsvCell('line1\nline2'), '"line1\nline2"');

  const csv = serializeCsvRows(['Crop', 'Note'], [['Wheat', 'Yield 2.9, "Sakha 95"']]);
  assert.ok(csv.startsWith('\uFEFF'), 'CSV output must start with UTF-8 BOM for Arabic/Excel support');
  assert.ok(csv.includes('Crop,Note\r\nWheat,"Yield 2.9, ""Sakha 95"""'));
});

test('buildWeatherForecastCsv exports 14-day forecast and 6-month seasonal table in both languages', () => {
  const preset = PRESET_FARM_ZONES[0];
  const centroid = getPolygonCentroid(preset.vertices);
  const area = calculateGeodesicArea(preset.vertices);
  const forecast14 = buildFallback14DayForecast(centroid);
  const seasonal6Months = generateSeasonal6MonthForecast(centroid, preset.soil, 0.95);

  const csvEn = buildWeatherForecastCsv({
    language: 'en',
    centroid,
    area,
    soil: preset.soil,
    forecast14,
    seasonal6Months,
  });
  assert.ok(csvEn.startsWith('\uFEFF'));
  assert.ok(csvEn.includes('14-Day Daily Precision Forecast'));
  assert.ok(csvEn.includes('6-Month Seasonal Climate & Irrigation Projection'));
  assert.ok(csvEn.includes(forecast14[0].date));
  assert.ok(csvEn.includes(seasonal6Months[0].monthKey));

  const csvAr = buildWeatherForecastCsv({
    language: 'ar',
    centroid,
    area,
    soil: preset.soil,
    forecast14,
    seasonal6Months,
  });
  assert.ok(csvAr.includes('التوقعات اليومية الدقيقة لمدة 14 يوماً'));
  assert.ok(csvAr.includes('النموذج التنبؤي الموسمي لـ 6 أشهر'));
});

test('buildCropLifecycleGddSeries and buildCropRecommenderCsv generate monotonic GDD curves and full CSV sections', () => {
  const preset = PRESET_FARM_ZONES[0];
  const centroid = getPolygonCentroid(preset.vertices);
  const area = calculateGeodesicArea(preset.vertices);
  const forecast14 = buildFallback14DayForecast(centroid);
  const { farmAverages } = generateSubZonesAndGrid(
    preset.vertices,
    preset.soil,
    preset.baseSpectralBands
  );
  const gddSeries = buildCropLifecycleGddSeries({
    cropId: 'wheat',
    accumulatedGDD: 720,
    forecast14,
  });

  assert.equal(gddSeries.cropId, 'wheat');
  assert.equal(gddSeries.lifecyclePoints[0].cumulativeGdd, 0);
  assert.equal(
    gddSeries.lifecyclePoints[gddSeries.lifecyclePoints.length - 1].cumulativeGdd,
    gddSeries.targetTotalGDD
  );
  for (let i = 1; i < gddSeries.lifecyclePoints.length; i++) {
    assert.ok(
      gddSeries.lifecyclePoints[i].cumulativeGdd >= gddSeries.lifecyclePoints[i - 1].cumulativeGdd,
      'Lifecycle GDD curve must increase monotonically'
    );
  }
  const milestoneCount = gddSeries.lifecyclePoints.filter((p) => p.isCurrentFieldMilestone).length;
  assert.equal(milestoneCount, 1, 'Exactly one milestone marker must represent current field progress');
  assert.equal(gddSeries.thirtyDaySummary.dailyPoints.length, 30);

  const seasonal6 = generateSeasonal6MonthForecast(centroid, preset.soil, 0.95);
  const recommendations = scoreCropsForFarm(
    preset.soil,
    farmAverages,
    seasonal6,
    area.totalFeddansDecimal,
    preset.currentCropId
  );
  const npkSchedule = calculateFourWeekNpkSchedule({
    cropId: 'wheat',
    soilTexture: preset.soil.texture,
    soilPh: preset.soil.ph,
    salinityEC: preset.soil.salinityEC,
    irrigation: preset.soil.irrigation,
    accumulatedGDD: 720,
    areaFeddans: area.totalFeddansDecimal,
  });

  const csv = buildCropRecommenderCsv({
    language: 'en',
    area,
    soil: preset.soil,
    recommendations,
    npkSchedule,
    gddSeries,
  });
  assert.ok(csv.startsWith('\uFEFF'));
  assert.ok(csv.includes('Ranked MCDA Crop Suitability Recommendations'));
  assert.ok(csv.includes('4-Week NPK Fertigation Schedule'));
  assert.ok(csv.includes('30-Day GDD Heat Accumulation Projection'));
  assert.ok(csv.includes('wheat'));
});

test('Optimized NDWI water mask excludes green-tinted turbid river/canal water from NDVI vegetation while preserving active crops and LRU pixel cache hits', () => {
  const preset = PRESET_FARM_ZONES[0];
  clearPixelAnalyzerCache();
  assert.equal(getPixelAnalyzerCacheStats().pixelCacheSize, 0);

  // 1. Green-tinted turbid Nile / irrigation canal water (G > B > R, e.g., R=36, G=64, B=54)
  // Previously misclassified as vegetation because G > B; now strictly masked by NDWI water detector
  const turbidRiverMask = evaluateOptimizedNdwiWaterMaskFromRgb(36, 64, 54);
  assert.equal(
    turbidRiverMask.isWater,
    true,
    'Green-tinted turbid river/canal water (R=36, G=64, B=54) must be masked as water'
  );
  const turbidRiverClassified = classifyRgbReflectance(36, 64, 54, preset.soil, 28, {
    sm0to7Pct: 28,
    sm7to28Pct: 33,
  });
  assert.equal(
    turbidRiverClassified.landCover,
    'water_canal',
    'Turbid green-tinted river pixel must classify as water_canal, never active crop'
  );
  assert.ok(
    turbidRiverClassified.values.NDVI <= 0.05 && turbidRiverClassified.values.NDWI >= 0.42,
    `Water body must have non-vegetated NDVI <= 0.05 and positive NDWI >= 0.42 (got NDVI=${turbidRiverClassified.values.NDVI}, NDWI=${turbidRiverClassified.values.NDWI})`
  );

  // 2. Clear blue water & dark drainage canal
  assert.equal(evaluateOptimizedNdwiWaterMaskFromRgb(22, 58, 92).isWater, true);
  assert.equal(evaluateOptimizedNdwiWaterMaskFromRgb(18, 28, 34).isWater, true);

  // 3. True active chlorophyll vegetation (Blue strongly absorbed: B < R and B/G < 0.60)
  const wheatCanopyMask = evaluateOptimizedNdwiWaterMaskFromRgb(46, 126, 40);
  assert.equal(wheatCanopyMask.isWater, false, 'Healthy green crop canopy must NOT be masked as water');
  const wheatClassified = classifyRgbReflectance(46, 126, 40, preset.soil, 28, {
    sm0to7Pct: 28,
    sm7to28Pct: 33,
  });
  assert.ok(
    wheatClassified.landCover === 'dense_crop' || wheatClassified.landCover === 'moderate_crop',
    `Expected active crop landCover, got ${wheatClassified.landCover}`
  );
  assert.ok(wheatClassified.values.NDVI >= 0.5, `Expected healthy crop NDVI >= 0.5, got ${wheatClassified.values.NDVI}`);

  // 4. Olive / date palm orchard (warm olive green: R=82, G=104, B=50)
  const oliveClassified = classifyRgbReflectance(82, 104, 50, preset.soil, 28, {
    sm0to7Pct: 28,
    sm7to28Pct: 33,
  });
  assert.ok(
    oliveClassified.landCover === 'dense_crop' || oliveClassified.landCover === 'moderate_crop',
    `Expected olive crop landCover, got ${oliveClassified.landCover}`
  );

  // 5. Verify LRU pixel cache records hits on repeated pixel samples
  const statsBeforeRepeat = getPixelAnalyzerCacheStats();
  assert.equal(statsBeforeRepeat.pixelHits, 0);
  assert.ok(statsBeforeRepeat.pixelMisses >= 3);

  const repeatedWheat = classifyRgbReflectance(46, 126, 40, preset.soil, 28, {
    sm0to7Pct: 28,
    sm7to28Pct: 33,
  });
  const repeatedRiver = classifyRgbReflectance(36, 64, 54, preset.soil, 28, {
    sm0to7Pct: 28,
    sm7to28Pct: 33,
  });
  assert.equal(repeatedWheat.values.NDVI, wheatClassified.values.NDVI);
  assert.equal(repeatedRiver.landCover, 'water_canal');

  const statsAfterRepeat = getPixelAnalyzerCacheStats();
  assert.equal(statsAfterRepeat.pixelHits, 2, 'Repeated pixel classifications must hit the LRU cache');
});

test('Nag Hammadi / Qena Esri World Imagery ground-truth: masks Nile bend water & town buildings while coloring dark sugarcane and wheat fields', () => {
  const preset = PRESET_FARM_ZONES[0];

  // 1. East-West Qena -> Nag Hammadi Nile River U-turn centerline coordinates must be masked geographically
  assert.equal(isInlandRiverOrLakeAtLatLon(26.058, 32.256), true, 'Nag Hammadi West Nile bend must be masked');
  assert.equal(isInlandRiverOrLakeAtLatLon(26.026, 32.310), true, 'Nag Hammadi South Nile U-turn must be masked');
  assert.equal(isInlandRiverOrLakeAtLatLon(26.128, 32.545), true, 'Dishna-Qena East-West Nile channel must be masked');

  // 2. Ground-truth Nile River water pixels from Esri tile/12/1740/2415 at Nag Hammadi
  const nileWaterSamples: Array<[number, number, number]> = [
    [2, 4, 2],
    [13, 24, 17],
    [22, 28, 24],
    [26, 37, 30],
  ];
  for (const [r, g, b] of nileWaterSamples) {
    assert.equal(
      evaluateOptimizedNdwiWaterMaskFromRgb(r, g, b).isWater,
      true,
      `Nile River pixel [${r},${g},${b}] must be masked as water`
    );
    const overlay = classifySatellitePixelForVegetationOverlay(r, g, b, 26.07, 32.28, 0, 'NDVI', 0.27, 0.45);
    assert.equal(overlay.isPlant, false, `Nile River pixel [${r},${g},${b}] must not be colored as plant`);
    assert.equal(overlay.alpha, 0, `Nile River pixel [${r},${g},${b}] must have alpha = 0`);
  }

  // 3. Ground-truth dusty brick & concrete town buildings from Madinat Naj Hammadi, Farshout, and Awlad Negm
  const townBuildingSamples: Array<[number, number, number]> = [
    [108, 98, 81],
    [114, 106, 85],
    [119, 113, 97],
    [139, 129, 103],
    [151, 134, 109],
  ];
  for (const [r, g, b] of townBuildingSamples) {
    const overlay = classifySatellitePixelForVegetationOverlay(r, g, b, 26.05, 32.24, 0.05, 'NDVI', 0.27, 0.40);
    assert.equal(
      overlay.isPlant,
      false,
      `Town building roof [${r},${g},${b}] must NEVER be painted green or light-green`
    );
    assert.equal(overlay.alpha, 0);
    const cell = classifyRgbReflectance(r, g, b, preset.soil, 28);
    assert.equal(
      cell.landCover,
      'urban_built',
      `Town building roof [${r},${g},${b}] must classify as urban_built, got ${cell.landCover}`
    );
  }

  // 4. Ground-truth dark sugarcane, wheat, and alfalfa fields from Nag Hammadi / Farshout / Abu Tesht
  const upperEgyptCropSamples: Array<[number, number, number]> = [
    [20, 57, 30],
    [20, 47, 29],
    [39, 59, 41],
    [48, 71, 53],
    [46, 61, 46],
    [59, 62, 51],
    [69, 71, 50],
  ];
  for (const [r, g, b] of upperEgyptCropSamples) {
    assert.equal(
      evaluateOptimizedNdwiWaterMaskFromRgb(r, g, b).isWater,
      false,
      `Active crop pixel [${r},${g},${b}] must NOT be masked as water`
    );
    const overlay = classifySatellitePixelForVegetationOverlay(r, g, b, 26.06, 32.22, 0, 'NDVI', 0.27, 0.35);
    assert.equal(overlay.isPlant, true, `Active crop pixel [${r},${g},${b}] must be detected as plant`);
    assert.equal(overlay.isFallowFarmland, false, `Active crop pixel [${r},${g},${b}] must be active crop, not fallow`);
    assert.ok(overlay.alpha > 0);
  }
});

test('Multi-Index Sobel Edge-Detection, Sub-Pixel Window Memoization, and Parallel Chunked Processing work accurately', async () => {
  const preset = PRESET_FARM_ZONES[0];
  clearPixelAnalyzerCache();

  // 1. Homogeneous green crop 5x5 sub-pixel window -> low edge gradient, high vegetation score, not excluded
  const homogeneousCropGrid = Array.from({ length: 25 }, (_, i) => ({
    r: 38 + (i % 3),
    g: 86 + (i % 4),
    b: 44 + (i % 3),
    weight: 1,
  }));
  const cropEval = evaluateMultiIndexEdgeThresholdWindow(homogeneousCropGrid);
  assert.equal(cropEval.isWaterExcluded, false);
  assert.equal(cropEval.isEdgeOrInfrastructureExcluded, false);
  assert.ok((cropEval.edgeGradientMagnitude ?? 1) < 0.03, 'Homogeneous crop field must have low Sobel edge gradient');
  assert.ok(cropEval.trueGreenPixelFraction >= 0.9, 'Homogeneous crop field must have high true green fraction');
  assert.ok(cropEval.multiIndexVegetationScore > 0.2, 'Homogeneous crop field must have positive multi-index vegetation score');

  // 2. Residential block / road edge 5x5 window alternating bright concrete roofs and dark street shadows
  const residentialEdgeGrid = Array.from({ length: 25 }, (_, i) => {
    const row = Math.floor(i / 5);
    const col = i % 5;
    const isBrightRoof = (row + col) % 2 === 0;
    return isBrightRoof
      ? { r: 175, g: 168, b: 158, weight: 1 }
      : { r: 42, g: 45, b: 40, weight: 1 };
  });
  const edgeEval = evaluateMultiIndexEdgeThresholdWindow(residentialEdgeGrid);
  assert.equal(edgeEval.isEdgeOrInfrastructureExcluded, true, 'High-contrast residential roof/shadow boundary must be excluded by Sobel edge detector');
  assert.ok((edgeEval.edgeGradientMagnitude ?? 0) >= 0.115, `Expected high Sobel gradient >= 0.115, got ${edgeEval.edgeGradientMagnitude}`);
  assert.ok((edgeEval.edgePixelFraction ?? 0) >= 0.32, `Expected high edgePixelFraction >= 0.32, got ${edgeEval.edgePixelFraction}`);

  // Verify classifyRgbReflectance strictly classifies a mixed edge pixel as urban_built when edge metrics are high
  const edgeClassified = classifyRgbReflectance(
    78,
    82,
    70,
    preset.soil,
    27,
    { sm0to7Pct: 28, sm7to28Pct: 33 },
    {
      luminanceStdDev: edgeEval.luminanceStdDev,
      brightRoofFraction: edgeEval.brightRoofFraction,
      trueGreenPixelFraction: edgeEval.trueGreenPixelFraction,
      edgeGradientMagnitude: edgeEval.edgeGradientMagnitude,
      edgePixelFraction: edgeEval.edgePixelFraction,
      waterSubPixelFraction: edgeEval.waterSubPixelFraction,
    }
  );
  assert.equal(edgeClassified.landCover, 'urban_built', 'Built-in Sobel edge detector must force mixed infrastructure edge cell to urban_built');
  assert.ok(edgeClassified.values.NDVI <= 0.08, `Infrastructure edge cell NDVI must be <= 0.08, got ${edgeClassified.values.NDVI}`);

  // 3. Sub-pixel NDWI water-dominated 5x5 window (canal bank with 48% water sub-pixels)
  const canalBankGrid = Array.from({ length: 25 }, (_, i) =>
    i < 12
      ? { r: 24, g: 52, b: 56, weight: 1 } // turbid canal water
      : { r: 58, g: 76, b: 52, weight: 1 } // vegetated bank
  );
  const waterEval = evaluateMultiIndexEdgeThresholdWindow(canalBankGrid);
  assert.equal(waterEval.isWaterExcluded, true, 'Window with >=35% NDWI water sub-pixels must be excluded as water');
  const waterBankClassified = classifyRgbReflectance(
    waterEval.avgR,
    waterEval.avgG,
    waterEval.avgB,
    preset.soil,
    27,
    { sm0to7Pct: 28, sm7to28Pct: 33 },
    waterEval
  );
  assert.equal(waterBankClassified.landCover, 'water_canal', 'Canal bank window dominated by water sub-pixels must classify as water_canal');
  assert.ok(waterBankClassified.values.NDVI <= 0.05, 'Water-masked window must have non-vegetated NDVI <= 0.05');
  assert.ok(waterBankClassified.values.NDWI >= 0.42, 'Water-masked window must have positive NDWI >= 0.42');

  // 4. Memoized 5x5 sub-pixel window sampler hits LRU cache on repeated/nearby sub-pixel coordinates
  const mockTileData = new Uint8ClampedArray(256 * 256 * 4);
  for (let i = 0; i < 256 * 256; i++) {
    mockTileData[i * 4] = 42;
    mockTileData[i * 4 + 1] = 92;
    mockTileData[i * 4 + 2] = 46;
    mockTileData[i * 4 + 3] = 255;
  }
  const mockImg = { data: mockTileData, width: 256, height: 256 };
  const wSample1 = sampleMemoized5x5SubPixelWindow(mockImg, 16, 38410, 27120, 128.04, 64.02);
  const wSample2 = sampleMemoized5x5SubPixelWindow(mockImg, 16, 38410, 27120, 128.08, 64.05); // quantizes to same 0.25-pixel cell
  assert.equal(wSample1.avgG, wSample2.avgG);
  const stats = getPixelAnalyzerCacheStats();
  assert.equal(stats.windowMisses, 1, 'First 5x5 sub-pixel window sample should record 1 miss');
  assert.equal(stats.windowHits, 1, 'Second quantized 5x5 sub-pixel window sample should hit LRU cache');

  // 5. Parallel chunked grid processor preserves exact order across multiple async batches
  const largeInput = Array.from({ length: 200 }, (_, idx) => idx);
  const processed = await processGridCellsInParallelChunks(
    largeInput,
    (val, idx) => val * 2 + idx,
    48
  );
  assert.equal(processed.length, 200);
  assert.equal(processed[0], 0);
  assert.equal(processed[199], 199 * 3);
});

test('GDD Lifecycle Phase Range Slider filter and Granular CSV Export (Date Ranges + NDVI/LST/Soil Moisture Metrics) work accurately', () => {
  const preset = PRESET_FARM_ZONES[0];
  const centroid = getPolygonCentroid(preset.vertices);
  const area = calculateGeodesicArea(preset.vertices);
  const forecast = buildFallback14DayForecast(centroid);
  const seasonal = generateSeasonal6MonthForecast(centroid, preset.soil);

  // 1. Test GDD Lifecycle Phase Range Filtering (Vegetative, Reproductive, Ripening)
  const gddSeries = buildCropLifecycleGddSeries({
    cropId: 'wheat',
    accumulatedGDD: 820,
    forecast14: forecast,
    startDateISO: forecast[0].date,
  });

  const vegPreset = GDD_LIFECYCLE_PHASE_PRESETS.vegetative; // 15% .. 50%
  const vegFiltered = filterGddLifecyclePointsByRange(gddSeries, {
    minPct: vegPreset.minPct,
    maxPct: vegPreset.maxPct,
  });
  assert.equal(vegFiltered.minPct, 15);
  assert.equal(vegFiltered.maxPct, 50);
  assert.ok(
    vegFiltered.filteredLifecyclePoints.length < gddSeries.lifecyclePoints.length,
    'Vegetative phase filter must return a subset of full lifecycle points'
  );
  for (const pt of vegFiltered.filteredLifecyclePoints) {
    assert.ok(
      pt.completionPct >= 14.5 && pt.completionPct <= 50.5,
      `Filtered vegetative point completionPct ${pt.completionPct}% must fall within 15..50%`
    );
  }

  const reproPreset = GDD_LIFECYCLE_PHASE_PRESETS.reproductive; // 45% .. 85%
  const reproFiltered = filterGddLifecyclePointsByRange(gddSeries, {
    minPct: reproPreset.minPct,
    maxPct: reproPreset.maxPct,
  });
  assert.ok(
    reproFiltered.heatSensitiveWindowWarningEn.includes('Heat-Sensitive Reproductive Window'),
    'Reproductive phase window must emit heat-sensitive pollination warning'
  );

  // 2. Test Granular Weather CSV Export with custom 5-day date window and selected metrics (NDVI, LST, Soil Moisture)
  const startDate = forecast[2].date;
  const endDate = forecast[6].date;
  const weatherCsv = buildWeatherForecastCsv({
    language: 'en',
    centroid,
    area,
    soil: preset.soil,
    forecast14: forecast,
    seasonal6Months: seasonal,
    exportOptions: {
      startDateISO: startDate,
      endDateISO: endDate,
      selectedMetrics: ['NDVI', 'LST', 'SM_0_7', 'SM_7_28'],
      farmAverages: { NDVI: 0.74, LST: 25.6, SM_0_7: 29.1, SM_7_28: 34.8 },
    },
  });

  assert.ok(
    weatherCsv.includes(`5d: ${startDate} -> ${endDate}`),
    'Filtered Weather CSV must reflect the exact 5-day date window'
  );
  assert.ok(
    !weatherCsv.includes(forecast[0].date) && !weatherCsv.includes(forecast[10].date),
    'Filtered Weather CSV must exclude dates outside [startDateISO, endDateISO]'
  );
  assert.ok(
    weatherCsv.includes('Selected Spectral & Biophysical Metrics (NDVI, LST, SM_0_7, SM_7_28)'),
    'Weather CSV must include the Selected Spectral & Biophysical Metrics section'
  );
  assert.ok(weatherCsv.includes('0.74') && weatherCsv.includes('25.6'), 'Weather CSV must include farm average NDVI and LST');

  // 3. Test Granular Crop Recommender CSV Export with reproductive GDD phase filter, date window, and NDVI/LST metrics
  const recommendations = scoreCropsForFarm(
    preset.soil,
    { NDVI: 0.74, NDWI: 0.32, SAVI: 0.65, NDMI: 0.31, EVI: 0.62, LST: 25.6, SM_0_7: 29.1, SM_7_28: 34.8, SOIL_EC: preset.soil.salinityEC, SOIL_PH: preset.soil.ph },
    seasonal,
    area.totalFeddansDecimal
  );
  const npkSchedule = calculateFourWeekNpkSchedule({
    cropId: 'wheat',
    soilTexture: preset.soil.texture,
    soilPh: preset.soil.ph,
    salinityEC: preset.soil.salinityEC,
    irrigation: preset.soil.irrigation,
    accumulatedGDD: 820,
    areaFeddans: area.totalFeddansDecimal,
  });

  const gddPts = gddSeries.thirtyDaySummary.dailyPoints;
  const cropCsv = buildCropRecommenderCsv({
    language: 'ar',
    area,
    soil: preset.soil,
    recommendations,
    npkSchedule,
    gddSeries,
    exportOptions: {
      startDateISO: gddPts[0].dateISO,
      endDateISO: gddPts[6].dateISO,
      selectedMetrics: ['NDVI', 'LST', 'SM_0_7'],
      farmAverages: { NDVI: 0.74, LST: 25.6, SM_0_7: 29.1 },
      gddPhaseRange: { minPct: 45, maxPct: 85 },
    },
  });

  assert.ok(
    cropCsv.includes('45% - 85%'),
    'Crop Recommender CSV must include the active 45% - 85% GDD phase window'
  );
  assert.ok(
    cropCsv.includes('المؤشرات الطيفية والفيزيائية المختارة (NDVI, LST, SM_0_7)'),
    'Crop Recommender CSV must include the Arabic selected spectral metrics section'
  );
  assert.ok(
    !cropCsv.includes(gddPts[15].dateISO),
    'Crop Recommender CSV 30-day projection section must exclude dates after endDateISO'
  );
});

test('Smart Agentic Advisor: Natural-Language Site Control (Zone Creation by Coords/Region/Vertices, Soil/Crop Updates, Layer Switching) and On-Demand Analytical Widgets succeed', () => {
  const preset = PRESET_FARM_ZONES[0];
  const centroid = getPolygonCentroid(preset.vertices);
  const area = calculateGeodesicArea(preset.vertices);
  const forecast = buildFallback14DayForecast(centroid);
  const seasonal = generateSeasonal6MonthForecast(centroid, preset.soil, 1.15);
  const baseline = generateSubZonesAndGrid(
    preset.vertices,
    preset.soil,
    preset.baseSpectralBands
  );
  const scored = scoreCropsForFarm(
    preset.soil,
    baseline.farmAverages,
    seasonal,
    area.totalFeddansDecimal
  );

  // 1. Geodesic rectangle calibration for target Feddans
  const rect65 = buildGeodesicRectangleForFeddans({ lat: 26.0542, lng: 32.2411 }, 65);
  const measured65 = calculateGeodesicArea(rect65);
  assert.ok(
    Math.abs(measured65.totalFeddansDecimal - 65) < 0.5,
    `Expected ~65 Feddans, got ${measured65.totalFeddansDecimal}`
  );

  // 2. Coordinate & Feddan extraction with Arabic numerals
  const extractedCoords = extractCoordinatesFromText('أضف مزرعة عند إحداثيات ٢٦.٠٥٤٢، ٣٢.٢٤١١ بمساحة ٨٠ فدان');
  assert.equal(extractedCoords.length, 1);
  assert.equal(extractedCoords[0].lat, 26.0542);
  assert.equal(extractedCoords[0].lng, 32.2411);
  assert.equal(extractAreaFeddansFromText('أضف مزرعة بمساحة ٨٠ فدان'), 80);

  // 3. Create zone command by region name + feddans + soil + crop
  const createTurn = evaluateAdvisorAgenticTurn(
    'أضف منطقة زراعية في كفر الشيخ بمساحة 50 فدان تربة طينية محصول قمح ري بالتنقيط',
    {
      language: 'ar',
      hasActiveZones: false,
      zoneNameAr: '',
      zoneNameEn: '',
      centroid,
      currentCropId: 'wheat',
      area,
      soil: preset.soil,
      farmAverages: baseline.farmAverages,
      subZones: [],
      forecast14: forecast,
      topCrops: [],
    }
  );
  assert.equal(createTurn.actions.length, 1);
  assert.equal(createTurn.actions[0].type, 'CREATE_ZONE');
  if (createTurn.actions[0].type === 'CREATE_ZONE') {
    assert.equal(createTurn.actions[0].zoneDraft.cropId, 'wheat');
    assert.equal(createTurn.actions[0].zoneDraft.soilTexture, 'clay');
    assert.equal(createTurn.actions[0].zoneDraft.irrigation, 'drip');
    assert.ok(Math.abs(createTurn.actions[0].zoneDraft.requestedFeddans - 50) < 0.5);
  }
  assert.ok(createTurn.inlineWidgets.includes('zone_action_card'));

  // 4. Update active zone configuration (crop, soil salinity, irrigation)
  const updateTurn = evaluateAdvisorAgenticTurn(
    'غير المحصول إلى بطاطس وخلي ملوحة التربة 2.4 والري بالتنقيط',
    {
      language: 'ar',
      hasActiveZones: true,
      zoneNameAr: preset.nameAr,
      zoneNameEn: preset.nameEn,
      centroid,
      currentCropId: 'wheat',
      area,
      soil: preset.soil,
      farmAverages: baseline.farmAverages,
      subZones: baseline.subZones,
      forecast14: forecast,
      topCrops: scored,
    }
  );
  const updateAction = updateTurn.actions.find((a) => a.type === 'UPDATE_ZONE_CONFIG');
  assert.ok(updateAction && updateAction.type === 'UPDATE_ZONE_CONFIG');
  if (updateAction && updateAction.type === 'UPDATE_ZONE_CONFIG') {
    assert.equal(updateAction.updates.cropId, 'potato');
    assert.equal(updateAction.updates.salinityEC, 2.4);
    assert.equal(updateAction.updates.irrigation, 'drip');
  }

  // 5. On-demand inline analytical widgets (only attached when asked)
  const pestTurn = evaluateAdvisorAgenticTurn(
    'افتح رادار الآفات والأمراض لإحداثيات مزرعتي',
    {
      language: 'ar',
      hasActiveZones: true,
      zoneNameAr: preset.nameAr,
      zoneNameEn: preset.nameEn,
      centroid,
      currentCropId: 'wheat',
      area,
      soil: preset.soil,
      farmAverages: baseline.farmAverages,
      subZones: baseline.subZones,
      forecast14: forecast,
      topCrops: scored,
    }
  );
  assert.ok(pestTurn.inlineWidgets.includes('pest_radar'));
  assert.ok(!pestTurn.inlineWidgets.includes('weekly_checklist'));

  // 6. Full site control: Tab navigation, Map layer switching, and PDF Report export
  const navAndExportTurn = evaluateAdvisorAgenticTurn(
    'اعرض طبقة NDWI وافتح قسم تحليل المؤشرات وحمل تقرير PDF',
    {
      language: 'ar',
      hasActiveZones: true,
      zoneNameAr: preset.nameAr,
      zoneNameEn: preset.nameEn,
      centroid,
      currentCropId: 'wheat',
      area,
      soil: preset.soil,
      farmAverages: baseline.farmAverages,
      subZones: baseline.subZones,
      forecast14: forecast,
      topCrops: scored,
    }
  );
  assert.ok(navAndExportTurn.actions.some((a) => a.type === 'SWITCH_MAP_LAYER' && a.spectralLayer === 'NDWI'));
  assert.ok(navAndExportTurn.actions.some((a) => a.type === 'NAVIGATE_TAB' && a.tabId === 'indices'));
  assert.ok(navAndExportTurn.actions.some((a) => a.type === 'EXPORT_PDF_REPORT'));
  assert.ok(navAndExportTurn.deterministicReplyText.includes('GeoAgri ai'));
});

test('Dual-layer persistence (localZonesStorage): save/load with activeZoneId recovery and additive multi-source merging work reliably', () => {
  const preset = PRESET_FARM_ZONES[0];
  const zoneA = hydrateStudyZoneFromCompactRecord({
    id: 'zone-mansoura-1',
    nameAr: 'مزرعة المنصورة ١',
    nameEn: 'Mansoura Farm 1',
    vertices: preset.vertices,
    soil: preset.soil,
    currentCropId: 'wheat',
    createdAt: '2026-11-10T08:00:00.000Z',
  });
  const zoneB = hydrateStudyZoneFromCompactRecord({
    id: 'zone-tanta-2',
    nameAr: 'مزرعة طنطا ٢',
    nameEn: 'Tanta Farm 2',
    vertices: preset.vertices,
    soil: { ...preset.soil, texture: 'loamy' },
    currentCropId: 'potato',
    createdAt: '2026-11-11T08:00:00.000Z',
  });
  assert.ok(zoneA && zoneB);

  const memMap = new Map<string, string>();
  const mockStorage = {
    getItem: (k: string) => memMap.get(k) ?? null,
    setItem: (k: string, v: string) => {
      memMap.set(k, v);
    },
    removeItem: (k: string) => {
      memMap.delete(k);
    },
    clear: () => {
      memMap.clear();
    },
    key: (i: number) => Array.from(memMap.keys())[i] ?? null,
    get length() {
      return memMap.size;
    },
  } as Storage;

  const saved = savePersistedFarmState(
    {
      zones: [zoneA, zoneB],
      activeZoneId: zoneB.id,
      vertices: zoneB.vertices,
      soil: zoneB.soil,
      currentCropId: 'potato',
      activeTab: 'indices',
      deletedZoneIds: [],
      language: 'ar',
    },
    mockStorage
  );
  assert.equal(saved, true);

  const loaded = loadPersistedFarmState(mockStorage);
  assert.equal(loaded.zones.length, 2);
  assert.equal(loaded.activeZoneId, zoneB.id);
  assert.equal(loaded.activeTab, 'indices');
  assert.equal(loaded.currentCropId, 'potato');
  assert.equal(loaded.vertices.length, zoneB.vertices.length);
  assert.ok(loaded.zones[1].gridCells.length > 0, 'Hydrated zones must restore gridCells for analysis');

  // Empty cloud snapshot must NEVER erase saved local/SQL zones
  const merged = mergeStudyZonesAdditively([[zoneA, zoneB], []], []);
  assert.equal(merged.length, 2);

  // Explicit deletion removes only the deleted zone
  const mergedAfterDelete = mergeStudyZonesAdditively([[zoneA, zoneB]], [zoneA.id]);
  assert.equal(mergedAfterDelete.length, 1);
  assert.equal(mergedAfterDelete[0].id, zoneB.id);

  // Preferred active zone resolver matches saved ID or falls back cleanly
  const preferred = resolvePreferredActiveZone(merged, [null, zoneB.id, zoneA.id]);
  assert.equal(preferred?.id, zoneB.id);
});

test('Authoritative GIS layers: ESA WorldCover 10m urban/water pixel classifier, NASA GIBS WMTS, and ISRIC SoilGrids v2.0 parser work accurately', () => {
  // 1. ESA WorldCover 2021 10m RGB classification
  assert.equal(classifyWorldCoverRgbPixel(250, 0, 0, 255), 50, 'Red #fa0000 must classify as Built-up (50)');
  assert.equal(classifyWorldCoverRgbPixel(240, 150, 255, 255), 40, 'Magenta #f096ff must classify as Cropland (40)');
  assert.equal(classifyWorldCoverRgbPixel(0, 100, 200, 255), 80, 'Blue #0064c8 must classify as Permanent Water (80)');
  assert.equal(classifyWorldCoverRgbPixel(0, 100, 0, 255), 10, 'Dark Green #006400 must classify as Tree Cover (10)');
  assert.equal(classifyWorldCoverRgbPixel(237, 2, 42, 255), 50, 'Sentinel-2 10m Built Area #ed022a must classify as Built-up (50)');
  assert.equal(classifyWorldCoverRgbPixel(255, 219, 92, 255), 40, 'Sentinel-2 10m Crops #ffdb5c must classify as Cropland (40)');
  assert.equal(classifyWorldCoverRgbPixel(26, 91, 171, 255), 80, 'Sentinel-2 10m Water #1a5bab must classify as Permanent Water (80)');
  assert.equal(classifyWorldCoverRgbPixel(250, 0, 0, 0), 0, 'Transparent pixel must remain unclassified (0)');
  assert.ok(getWorldCoverClassLabel(50, 'ar').includes('عمرانية'));

  // 2. Authoritative WMTS & 10m ImageServer Tile URL builders
  const wcUrl = buildEsaWorldCoverTileUrl(14, 9620, 6670);
  assert.ok(wcUrl.includes('services.terrascope.be/wmts/v2') && wcUrl.includes('WORLDCOVER_2021_MAP'));
  const s2Url = buildSentinel2LandCover10mTileUrl(14, 9620, 6670);
  assert.ok(s2Url.includes('Sentinel2_10m_LandCover/ImageServer/exportImage') && s2Url.includes('RSP_NearestNeighbor'));
  const gibsNdviUrl = buildNasaGibsTileUrl('NDVI', 9, 300, 210);
  const gibsSmUrl = buildNasaGibsTileUrl('SM', 6, 37, 26);
  assert.ok(gibsNdviUrl.includes('MODIS_Terra_NDVI_8Day'));
  assert.ok(gibsSmUrl.includes('SMAP_L4_Analyzed_Root_Zone_Soil_Moisture'));

  // 3. ISRIC SoilGrids v2.0 REST API unit conversion parser
  const parsedSoil = parseSoilGridsApiResponse(31.04, 31.37, {
    properties: {
      layers: [
        { name: 'phh2o', depths: [{ values: { mean: 78 } }] }, // 7.8 pH
        { name: 'soc', depths: [{ values: { mean: 145 } }] }, // 145 dg/kg * 0.01724 = 2.50 OM%
        { name: 'clay', depths: [{ values: { mean: 410 } }] }, // 41.0% clay
        { name: 'sand', depths: [{ values: { mean: 220 } }] }, // 22.0% sand
      ],
    },
  });
  assert.ok(parsedSoil);
  assert.equal(parsedSoil.ph, 7.8);
  assert.equal(parsedSoil.organicMatterPct, 2.5);
  assert.equal(parsedSoil.clayPct, 41);
  assert.equal(parsedSoil.sandPct, 22);
  assert.equal(parsedSoil.source, 'ISRIC SoilGrids v2.0 (250m)');

  // 4. Positive NDWI on inland water bodies (never drought orange)
  const nileWaterNdwi = evaluateSpatialSpectralOrSoilAtLatLon(30.04, 31.225, 'NDWI');
  assert.ok(nileWaterNdwi.numericValue > 0.35, `Nile channel NDWI must be positive water, got ${nileWaterNdwi.numericValue}`);

  // 5. Source attribution metadata
  const soilMeta = getAuthoritativeLayerSourceMeta('vegetation', 'SOIL_PH');
  assert.ok(soilMeta.providerEn.includes('SoilGrids') && soilMeta.urbanMaskLabelEn.includes('WorldCover 10m'));
});

test('Risk mitigation breakdown proves Yield Loss (without intervention) and Potential Recovery are independent metrics that do not sum to 100%', () => {
  const breakdown = computeRiskMitigationBreakdown(30, 85);
  assert.equal(breakdown.yieldLossWithoutActionPct, 30);
  assert.equal(breakdown.mitigatedRecoveryPct, 85);
  assert.equal(breakdown.rawCombinedSumPct, 115);
  assert.equal(breakdown.safeBaselinePct, 70);
  assert.equal(breakdown.preservedFromLossPct, 25.5);
  assert.equal(breakdown.netResidualLossPct, 4.5);
  assert.equal(breakdown.finalHarvestPct, 95.5);
  assert.equal(
    Number(
      (
        breakdown.safeBaselinePct +
        breakdown.preservedFromLossPct +
        breakdown.netResidualLossPct
      ).toFixed(1)
    ),
    100
  );

  const highRiskPest = derivePestRiskYieldMetrics({ riskScore: 80, riskLevel: 'critical' });
  assert.ok(highRiskPest.yieldLossWithoutActionPct >= 30 && highRiskPest.yieldLossWithoutActionPct <= 46);
  assert.equal(highRiskPest.mitigatedRecoveryPct, 86);

  const modRiskPest = derivePestRiskYieldMetrics({ riskScore: 45, riskLevel: 'moderate' });
  assert.ok(modRiskPest.yieldLossWithoutActionPct < highRiskPest.yieldLossWithoutActionPct);
  assert.equal(modRiskPest.mitigatedRecoveryPct, 82);
});

test('Default Natural Mode starts clean without NDVI bias, and Satellite Mission Catalog resolves on-demand satellite choices', () => {
  const preset = PRESET_FARM_ZONES[0];
  const centroid = getPolygonCentroid(preset.vertices);
  const forecast = buildFallback14DayForecast(centroid);
  const baseline = generateSubZonesAndGrid(
    preset.vertices,
    preset.soil,
    preset.baseSpectralBands
  );

  // 1. In Default Natural Mode ('natural'), unified spec must report true-color natural view without forcing NDVI overlay
  const naturalSpec = resolveUnifiedActiveLayerSpec(
    'natural',
    'NDVI',
    baseline.farmAverages,
    baseline.gridCells,
    forecast,
    0,
    true
  );
  assert.equal(naturalSpec.activeThematicMap, 'natural');
  assert.equal(naturalSpec.badgeCode, 'NATURAL');
  assert.ok(naturalSpec.meanValueFormatted.includes('طبيعية'));

  // 2. Active satellite resolver reports default natural cleanly
  const defaultSatMeta = resolveActiveSatelliteSelectionMeta(
    'natural',
    'NDVI',
    'قمر صناعي هجين',
    'Hybrid Satellite'
  );
  assert.equal(defaultSatMeta.isDefaultNatural, true);
  assert.equal(defaultSatMeta.activeChoiceId, 'natural');
  assert.equal(defaultSatMeta.resolutionBadge, 'RGB');

  // 3. Catalog covers Optical/Vegetation, Soil, Weather, and DEM Terrain missions
  const catalog = getSatelliteMissionCatalog();
  assert.equal(catalog.length, 4);

  // 4. Choosing Sentinel-2 NDWI resolves Sentinel-2 Optical + NDWI spectral spec
  const ndwiMeta = resolveActiveSatelliteSelectionMeta(
    'vegetation',
    'NDWI',
    'قمر صناعي هجين',
    'Hybrid Satellite'
  );
  assert.equal(ndwiMeta.isDefaultNatural, false);
  assert.equal(ndwiMeta.activeChoiceId, 'NDWI');
  assert.ok(ndwiMeta.satelliteShortEn.includes('Sentinel-2'));

  // 5. Choosing NASA SMAP Soil Moisture or NASA GPM Rainfall resolves exact sensor mission
  const smapMeta = resolveActiveSatelliteSelectionMeta(
    'soil_moisture',
    'SM_0_7',
    'قمر صناعي هجين',
    'Hybrid Satellite'
  );
  assert.equal(smapMeta.isDefaultNatural, false);
  assert.equal(smapMeta.activeChoiceId, 'soil_moisture');
  assert.ok(smapMeta.satelliteShortEn.includes('SMAP'));

  const gpmMeta = resolveActiveSatelliteSelectionMeta(
    'rainfall',
    'NDVI',
    'قمر صناعي هجين',
    'Hybrid Satellite'
  );
  assert.equal(gpmMeta.isDefaultNatural, false);
  assert.equal(gpmMeta.activeChoiceId, 'rainfall');
  assert.ok(gpmMeta.satelliteShortEn.includes('GPM'));
});

test('Soil-moisture-driven farm water budget detects crop water deficits, responds to manual quota, and recommends water-safe alternatives', () => {
  const deltaPreset = PRESET_FARM_ZONES[0];
  const centroid = getPolygonCentroid(deltaPreset.vertices);
  const forecast = buildFallback14DayForecast(centroid);
  const area = calculateGeodesicArea(deltaPreset.vertices);
  const seasonal6 = generateSeasonal6MonthForecast(centroid, deltaPreset.soil, 0.9);
  const { farmAverages } = generateSubZonesAndGrid(
    deltaPreset.vertices,
    deltaPreset.soil,
    deltaPreset.baseSpectralBands
  );

  // 1. Dry soil moisture profile (low SM_0_7 & SM_7_28) lowers available water vs moist soil
  const dryAverages = { ...farmAverages, SM_0_7: 11.2, SM_7_28: 13.5 };
  const wetAverages = { ...farmAverages, SM_0_7: 34.0, SM_7_28: 38.5 };

  const dryBudget = evaluateFarmWaterBudget(deltaPreset.soil, dryAverages, forecast, seasonal6, null);
  const wetBudget = evaluateFarmWaterBudget(deltaPreset.soil, wetAverages, forecast, seasonal6, null);

  assert.equal(dryBudget.moistureCondition, 'dry');
  assert.equal(wetBudget.moistureCondition, 'optimal');
  assert.ok(
    wetBudget.totalAvailableWaterM3PerFeddan > dryBudget.totalAvailableWaterM3PerFeddan,
    'Higher root-zone & surface soil moisture must yield higher available water reserve'
  );
  assert.equal(dryBudget.isManualOverride, false);

  // 2. Score crops and verify Maize triggers water deficit while Quinoa remains water-safe under dry budget
  const scored = scoreCropsForFarm(
    deltaPreset.soil,
    dryAverages,
    seasonal6,
    area.totalFeddansDecimal,
    'maize'
  );
  const maizeRec = scored.find((c) => c.crop.id === 'maize')!;
  const quinoaRec = scored.find((c) => c.crop.id === 'quinoa')!;

  const maizeWaterEval = evaluateCropWaterDeficit(maizeRec, dryBudget);
  const quinoaWaterEval = evaluateCropWaterDeficit(quinoaRec, dryBudget);

  assert.equal(maizeWaterEval.status, 'deficit', 'Maize should trigger deficit under dry soil budget');
  assert.ok(maizeWaterEval.deficitM3PerFeddan > 0 && maizeWaterEval.deficitPct > 0);
  assert.equal(quinoaWaterEval.status, 'safe', 'Quinoa should remain water-safe under dry budget');
  assert.ok(quinoaWaterEval.balanceDeltaM3PerFeddan > 0);

  // 3. Water-safe alternatives helper recommends safe crops excluding deficit crop
  const alternatives = findWaterSafeAlternativeCrops(scored, dryBudget, 'maize', 2);
  assert.ok(alternatives.length >= 1);
  assert.ok(
    alternatives.every((a) => a.recommendation.crop.id !== 'maize' && a.waterEval.status === 'safe'),
    'Recommended alternatives must be water-safe and exclude active deficit crop'
  );

  // 4. Manual seasonal quota override replaces auto calculation cleanly
  const manualBudget = evaluateFarmWaterBudget(deltaPreset.soil, dryAverages, forecast, seasonal6, 1500);
  assert.equal(manualBudget.isManualOverride, true);
  assert.equal(manualBudget.totalAvailableWaterM3PerFeddan, 1500);
  const wheatRec = scored.find((c) => c.crop.id === 'wheat')!;
  const wheatUnderTightManual = evaluateCropWaterDeficit(wheatRec, manualBudget);
  assert.equal(wheatUnderTightManual.status, 'deficit');
});

test('Module 1 Soil Profile Editing (Texture, Salinity EC dS/m, pH, and 5 Irrigation Systems including Rainfed) propagates into Spectral Indices and Crop Recommendations', () => {
  const preset = PRESET_FARM_ZONES[0];
  const centroid = getPolygonCentroid(preset.vertices);
  const seasonal6 = generateSeasonal6MonthForecast(centroid, preset.soil, 0.9);

  const loamyDripLowEc = {
    texture: 'loamy' as const,
    salinityEC: 1.2,
    ph: 7.1,
    organicMatterPct: 2.2,
    groundwaterDepthM: 1.8,
    irrigation: 'drip' as const,
  };
  const calcareousRainfedHighEc = {
    texture: 'calcareous' as const,
    salinityEC: 5.8,
    ph: 8.5,
    organicMatterPct: 1.1,
    groundwaterDepthM: 3.5,
    irrigation: 'rainfed' as const,
  };

  const spatialOptimal = generateSubZonesAndGrid(
    preset.vertices,
    loamyDripLowEc,
    preset.baseSpectralBands
  );
  const spatialStressed = generateSubZonesAndGrid(
    preset.vertices,
    calcareousRainfedHighEc,
    preset.baseSpectralBands
  );

  // Verify spectral and soil indices respond directly to soil profile changes
  assert.ok(
    spatialOptimal.farmAverages.NDVI > spatialStressed.farmAverages.NDVI,
    'Optimal Loamy+Drip+LowEC soil must produce higher NDVI than Calcareous+Rainfed+HighEC soil'
  );
  assert.ok(
    spatialOptimal.farmAverages.SAVI > spatialStressed.farmAverages.SAVI,
    'SAVI must reflect soil-adjusted brightness L factor and salinity/pH stress'
  );
  assert.ok(
    spatialStressed.farmAverages.SOIL_EC > spatialOptimal.farmAverages.SOIL_EC + 3.0,
    'SOIL_EC farm average must reflect custom salinityEC input'
  );
  assert.ok(
    spatialStressed.farmAverages.SOIL_PH > spatialOptimal.farmAverages.SOIL_PH + 1.0,
    'SOIL_PH farm average must reflect custom pH input'
  );

  // Verify crop recommendations respond to soil texture, EC, pH, and irrigation (including rainfed)
  const cropsOptimal = scoreCropsForFarm(
    loamyDripLowEc,
    spatialOptimal.farmAverages,
    seasonal6,
    10,
    'wheat'
  );
  const cropsStressed = scoreCropsForFarm(
    calcareousRainfedHighEc,
    spatialStressed.farmAverages,
    seasonal6,
    10,
    'wheat'
  );
  const tomatoOptimal = cropsOptimal.find((c) => c.crop.id === 'tomato')!;
  const tomatoStressed = cropsStressed.find((c) => c.crop.id === 'tomato')!;
  assert.ok(
    tomatoOptimal.suitabilityScore > tomatoStressed.suitabilityScore + 15,
    'Salt-sensitive & drip-dependent crops must score significantly higher on Loamy/Drip/LowEC than Calcareous/Rainfed/HighEC'
  );
});

test('Module 2 Historical Spectral Comparison compares current NDVI, NDWI, and SAVI across 1–3 seasons and detects anomalies', () => {
  const preset = PRESET_FARM_ZONES[0];
  const { farmAverages } = generateSubZonesAndGrid(
    preset.vertices,
    preset.soil,
    preset.baseSpectralBands
  );
  const timeSeries = generateSpectralTimeSeries(farmAverages);

  const comp1 = buildHistoricalSpectralComparison(timeSeries, farmAverages, 1, preset.soil);
  const comp3 = buildHistoricalSpectralComparison(timeSeries, farmAverages, 3, preset.soil);

  assert.equal(comp1.NDVI.seasonsCount, 1);
  assert.equal(comp3.NDVI.seasonsCount, 3);
  assert.equal(comp3.NDVI.points.length, timeSeries.length);
  assert.equal(comp3.NDWI.points.length, timeSeries.length);
  assert.equal(comp3.SAVI.points.length, timeSeries.length);

  // Verify anomaly detection when current NDVI is severely depressed vs historical baseline
  const stressedAverages = { ...farmAverages, NDVI: 0.24, NDWI: -0.05, SAVI: 0.21 };
  const stressedSeries = timeSeries.map((pt) => ({
    ...pt,
    NDVI: Number((pt.NDVI * 0.65).toFixed(2)),
    NDWI: Number((pt.NDWI - 0.12).toFixed(2)),
    SAVI: Number((pt.SAVI * 0.65).toFixed(2)),
  }));
  const stressedComp = buildHistoricalSpectralComparison(
    stressedSeries,
    stressedAverages,
    3,
    preset.soil
  );
  assert.equal(
    stressedComp.NDVI.anomalyStatus,
    'negative_anomaly',
    'Depressed current season NDVI vs 3-year baseline must trigger negative_anomaly'
  );
  assert.ok(stressedComp.NDVI.deltaPct < -6);
});

test('Module 3 Pest & Disease Risk Alert System analyzes weather (temp, humidity, rain), crop growth stage, and regional history', () => {
  const preset = PRESET_FARM_ZONES[0];
  const centroid = getPolygonCentroid(preset.vertices);
  const baseForecast = buildFallback14DayForecast(centroid);
  const { farmAverages, subZones } = generateSubZonesAndGrid(
    preset.vertices,
    preset.soil,
    preset.baseSpectralBands
  );

  // Simulate humid/wet weather conducive to fungal diseases during flowering
  const humidRainyForecast = baseForecast.map((d, i) =>
    i < 7
      ? {
          ...d,
          tempMaxC: 22,
          tempMinC: 14,
          precipMm: 6.5,
          precipProbPct: 80,
          relativeHumidityPct: 84,
        }
      : d
  );

  const baseStage = calculateGrowthStageAndGDD('wheat', '2026-09-15', farmAverages.NDVI);
  const floweringStage = {
    ...baseStage,
    stageIndex: 2,
    stageKey: 'flowering' as const,
    stageNameAr: 'طرد السنابل والتزهير',
    stageNameEn: 'Heading & Flowering',
    completionPct: 75,
    cropCoefficientKc: 1.15,
  };

  const germinationStage = {
    ...baseStage,
    stageIndex: 0,
    stageKey: 'germination' as const,
    stageNameAr: 'الإنبات',
    stageNameEn: 'Germination',
    completionPct: 18,
    cropCoefficientKc: 0.4,
  };

  const midEval = evaluateWeatherPestAndDiseaseAlertSystem(
    humidRainyForecast,
    floweringStage,
    'wheat',
    centroid,
    preset.soil,
    farmAverages,
    subZones
  );
  const initEval = evaluateWeatherPestAndDiseaseAlertSystem(
    humidRainyForecast,
    germinationStage,
    'wheat',
    centroid,
    preset.soil,
    farmAverages,
    subZones
  );

  assert.ok(midEval.alerts.length >= 3, 'Must return proactive pest and disease alerts');
  assert.ok(
    midEval.totalRainfall7dMm > 20 && midEval.meanHumidity7dPct >= 75,
    'Weather summary must reflect 7-day rainfall and relative humidity'
  );
  const rustMid = midEval.alerts.find((a) => a.id.includes('rust'))!;
  const rustInit = initEval.alerts.find((a) => a.id.includes('rust'))!;
  assert.ok(
    rustMid.riskScorePct > rustInit.riskScorePct,
    'Wheat Rust risk must be higher during flowering/heading than germination stage'
  );
  assert.ok(
    rustMid.scoutingActionsEn.length >= 2 && rustMid.preventativeMeasuresEn.length >= 2,
    'Each alert must provide actionable scouting steps and preventative measures'
  );
});

test('Voice transcript helper captures all cumulative final + live interim words across recognition restarts without truncation', () => {
  const empty = extractTranscriptFromResults(null);
  assert.equal(empty.hasContent, false);
  assert.equal(empty.finalText, '');
  assert.equal(empty.interimText, '');

  const resultsLike = {
    length: 3,
    0: { isFinal: true, 0: { transcript: '  أضف   منطقة   زراعية ' } },
    1: { isFinal: true, 0: { transcript: 'في كفر الشيخ 50 فدان' } },
    2: { isFinal: false, 0: { transcript: ' محصول   قمح ' } },
  };

  const extracted = extractTranscriptFromResults(resultsLike);
  assert.equal(extracted.hasContent, true);
  assert.equal(extracted.finalText, 'أضف منطقة زراعية في كفر الشيخ 50 فدان');
  assert.equal(extracted.interimText, 'محصول قمح');

  // Combines existing input prefix + finalized segment + live interim words cleanly
  const combined = combineVoiceTranscript(
    'من فضلك',
    extracted.finalText,
    extracted.interimText
  );
  assert.equal(
    combined,
    'من فضلك أضف منطقة زراعية في كفر الشيخ 50 فدان محصول قمح'
  );
});

test('Local agronomist fallback never false-triggers irrigation on Arabic substring "ظهري" or conversational mic checks', () => {
  const preset = PRESET_FARM_ZONES[0];
  const centroid = getPolygonCentroid(preset.vertices);
  const area = calculateGeodesicArea(preset.vertices);
  const { subZones, farmAverages } = generateSubZonesAndGrid(
    preset.vertices,
    preset.soil,
    preset.baseSpectralBands
  );
  const forecast14 = buildFallback14DayForecast(centroid);
  const seasonal6 = generateSeasonal6MonthForecast(centroid, preset.soil, 0.95);
  const scored = scoreCropsForFarm(
    preset.soil,
    farmAverages,
    seasonal6,
    area.totalFeddansDecimal,
    preset.currentCropId
  );

  const micCheckReplyAr = generateLocalAgronomistResponse('Zero. سامعني كويس يا ظهري؟', {
    zoneNameAr: preset.nameAr,
    zoneNameEn: preset.nameEn,
    area,
    soil: preset.soil,
    farmAverages,
    subZones,
    forecast14,
    topCrops: scored,
    language: 'ar',
    hasUserZones: true,
  });

  assert.ok(
    !micCheckReplyAr.includes('قرار الري والأمطار الذكي'),
    'Mic check containing "ظهري" (substring "ري") must NOT return irrigation schedule'
  );
  assert.ok(
    micCheckReplyAr.includes('سامعك') || micCheckReplyAr.includes('أهلاً'),
    'Mic check should return a natural conversational confirmation'
  );

  const greetingReplyAr = generateLocalAgronomistResponse('أهلاً، سامعني كويس؟', {
    zoneNameAr: preset.nameAr,
    zoneNameEn: preset.nameEn,
    area,
    soil: preset.soil,
    farmAverages,
    subZones,
    forecast14,
    topCrops: scored,
    language: 'ar',
    hasUserZones: false,
  });
  assert.ok(!greetingReplyAr.includes('قرار الري والأمطار الذكي'));
  assert.ok(greetingReplyAr.includes('أهلاً') && greetingReplyAr.includes('سامعك'));

  const micCheckReplyEn = generateLocalAgronomistResponse('Hello, can you hear me?', {
    zoneNameAr: preset.nameAr,
    zoneNameEn: preset.nameEn,
    area,
    soil: preset.soil,
    farmAverages,
    subZones,
    forecast14,
    topCrops: scored,
    language: 'en',
    hasUserZones: true,
  });
  assert.ok(!micCheckReplyEn.includes('Hydro-Meteorological Decision'));
  assert.ok(micCheckReplyEn.includes('here'));

  const realIrrigationReplyAr = generateLocalAgronomistResponse('هل أروي بكرة ولا في أمطار؟', {
    zoneNameAr: preset.nameAr,
    zoneNameEn: preset.nameEn,
    area,
    soil: preset.soil,
    farmAverages,
    subZones,
    forecast14,
    topCrops: scored,
    language: 'ar',
    hasUserZones: true,
  });
  assert.ok(
    realIrrigationReplyAr.includes('قرار الري والأمطار الذكي'),
    'Genuine irrigation question must still return irrigation decision'
  );
});

test('mapGeminiToolCallsToSiteActions maps all 13 full-control Gemini tools to executable site actions and Turn-2 responses', () => {
  const sampleInventory: AdvisorSiteInventory = {
    language: 'ar',
    darkMode: false,
    activeTab: 'advisor',
    activeLayer: 'NDVI',
    activeThematicMap: 'natural',
    activeZoneId: 'zone-1',
    activeCropId: 'wheat',
    activeCentroid: { lat: 31.11, lng: 30.94 },
    drawnVerticesCount: 4,
    hasActiveZones: true,
    pushNotificationsEnabled: false,
    comparedZoneIds: [],
    zones: [
      {
        id: 'zone-1',
        nameAr: 'مزرعة كفر الشيخ',
        nameEn: 'Kafr El Sheikh Farm',
        feddans: 50,
        cropId: 'wheat',
        soilTexture: 'clay',
        salinityEC: 1.4,
        ph: 7.4,
        irrigation: 'drip',
        centroid: { lat: 31.11, lng: 30.94 },
      },
      {
        id: 'zone-2',
        nameAr: 'مزرعة أسيوط الشمالية',
        nameEn: 'North Assiut Farm',
        feddans: 75,
        cropId: 'maize',
        soilTexture: 'loamy',
        salinityEC: 1.8,
        ph: 7.6,
        irrigation: 'pivot',
        centroid: { lat: 27.18, lng: 31.18 },
      },
    ],
    checklist: [
      {
        id: 'task-1',
        titleAr: 'فحص رطوبة التربة',
        titleEn: 'Inspect soil moisture',
        completed: false,
        category: 'irrigation',
        priority: 'high',
      },
    ],
    incidents: [
      {
        id: 'inc-1',
        pestId: 'fall_armyworm',
        pestNameAr: 'دودة الحشد الخريفية',
        pestNameEn: 'Fall Armyworm',
        subZoneId: 'A',
        severity: 'high',
        status: 'active',
      },
    ],
  };

  const mapped = mapGeminiToolCallsToSiteActions(
    [
      {
        id: 'call-1',
        name: 'create_farm_zone',
        args: {
          locationOrRegion: 'أسيوط',
          areaFeddans: 80,
          cropId: 'wheat',
          soilTexture: 'loamy',
          salinityEC: 2.1,
          irrigation: 'drip',
        },
      },
      {
        id: 'call-2',
        name: 'rename_farm_zone',
        args: { zoneNameQuery: 'كفر الشيخ', newNameAr: 'حقل الدلتا الذهبي' },
      },
      {
        id: 'call-3',
        name: 'switch_active_farm_zone',
        args: { target: 'last' },
      },
      {
        id: 'call-4',
        name: 'compare_farm_zone',
        args: { mode: 'add', zoneNameQuery: 'أسيوط' },
      },
      {
        id: 'call-5',
        name: 'update_farm_settings',
        args: { salinityEC: 3.4, irrigation: 'sprinkler', customCropLabel: 'مانجو' },
      },
      {
        id: 'call-6',
        name: 'clear_drawn_polygon',
        args: { confirm: true },
      },
      {
        id: 'call-7',
        name: 'switch_map_layer',
        args: { spectralLayer: 'NDWI', thematicLayer: 'soil_moisture', navigateToAtlas: true },
      },
      {
        id: 'call-8',
        name: 'navigate_app_tab',
        args: { tabId: 'crops' },
      },
      {
        id: 'call-9',
        name: 'manage_weekly_task',
        args: {
          operation: 'add',
          title: 'رش بوتاسيوم وقائي',
          category: 'fertilization',
          priority: 'high',
          dayLabel: 'غداً',
        },
      },
      {
        id: 'call-10',
        name: 'manage_weekly_task',
        args: { operation: 'complete', matchText: 'رطوبة' },
      },
      {
        id: 'call-11',
        name: 'manage_weekly_task',
        args: { operation: 'delete', matchText: 'بوتاسيوم' },
      },
      {
        id: 'call-12',
        name: 'manage_pest_incident',
        args: {
          operation: 'log',
          pestId: 'الصدأ الأصفر',
          subZoneId: 'B',
          severity: 'critical',
          notes: 'بؤرة على الحافة الشرقية',
        },
      },
      {
        id: 'call-13',
        name: 'manage_pest_incident',
        args: { operation: 'mark_treated', incidentId: 'inc-1' },
      },
      {
        id: 'call-14',
        name: 'manage_pest_incident',
        args: { operation: 'clear_all' },
      },
      {
        id: 'call-15',
        name: 'manage_crop_rotation',
        args: { operation: 'set_slot', subZoneId: 'B', slotId: 'next1', cropId: 'maize' },
      },
      {
        id: 'call-16',
        name: 'manage_crop_rotation',
        args: { operation: 'optimize', subZoneId: 'ALL' },
      },
      {
        id: 'call-17',
        name: 'control_app_preferences',
        args: {
          darkMode: true,
          language: 'en',
          pushNotificationsEnabled: true,
          dismissWeatherAlerts: true,
          refreshWeather: true,
          exportPdfReport: true,
          clearChat: true,
          closeFullscreenChat: true,
          showInlineWidget: 'crop_mcda',
        },
      },
      {
        id: 'call-18',
        name: 'delete_farm_zone',
        args: { zoneNameQuery: 'أسيوط' },
      },
    ],
    sampleInventory
  );

  assert.equal(mapped.functionResponses.length, 18);
  assert.ok(mapped.functionResponses.every((fr) => fr.response.ok === true));

  const actionTypes = mapped.toolActions.map((a) => a.type);
  assert.ok(actionTypes.includes('CREATE_ZONE'));
  assert.ok(actionTypes.includes('RENAME_ZONE'));
  assert.ok(actionTypes.includes('SWITCH_ACTIVE_ZONE'));
  assert.ok(actionTypes.includes('TOGGLE_COMPARE_ZONE'));
  assert.ok(actionTypes.includes('UPDATE_ZONE_CONFIG'));
  assert.ok(actionTypes.includes('CLEAR_DRAWN_VERTICES'));
  assert.ok(actionTypes.includes('SWITCH_MAP_LAYER'));
  assert.ok(actionTypes.includes('NAVIGATE_TAB'));
  assert.ok(actionTypes.includes('ADD_CHECKLIST_TASK'));
  assert.ok(actionTypes.includes('TOGGLE_CHECKLIST_TASK'));
  assert.ok(actionTypes.includes('DELETE_CHECKLIST_TASK'));
  assert.ok(actionTypes.includes('LOG_PEST_INCIDENT'));
  assert.ok(actionTypes.includes('TOGGLE_PEST_INCIDENT_STATUS'));
  assert.ok(actionTypes.includes('DELETE_PEST_INCIDENT'));
  assert.ok(actionTypes.includes('UPDATE_ROTATION_SLOT'));
  assert.ok(actionTypes.includes('OPTIMIZE_ROTATION'));
  assert.ok(actionTypes.includes('SET_THEME'));
  assert.ok(actionTypes.includes('SET_LANGUAGE'));
  assert.ok(actionTypes.includes('TOGGLE_PUSH_NOTIFICATIONS'));
  assert.ok(actionTypes.includes('REFRESH_WEATHER'));
  assert.ok(actionTypes.includes('EXPORT_PDF_REPORT'));
  assert.ok(actionTypes.includes('CLEAR_CHAT'));
  assert.ok(actionTypes.includes('CLOSE_FULLSCREEN_CHAT'));
  assert.ok(actionTypes.includes('DELETE_ZONE'));

  const deleteByName = mapped.toolActions.find((a) => a.type === 'DELETE_ZONE');
  assert.equal(deleteByName?.type === 'DELETE_ZONE' && deleteByName.zoneId, 'zone-2');

  const renameAction = mapped.toolActions.find((a) => a.type === 'RENAME_ZONE');
  assert.equal(renameAction?.type === 'RENAME_ZONE' && renameAction.zoneId, 'zone-1');
  assert.equal(
    renameAction?.type === 'RENAME_ZONE' && renameAction.newNameAr,
    'حقل الدلتا الذهبي'
  );

  // Empty inventory delete fails gracefully without throwing
  const emptyInv: AdvisorSiteInventory = {
    ...sampleInventory,
    zones: [],
    activeZoneId: null,
    hasActiveZones: false,
  };
  const emptyDelete = mapGeminiToolCallsToSiteActions(
    [{ id: 'del-empty', name: 'delete_farm_zone', args: { target: 'active' } }],
    emptyInv
  );
  assert.equal(emptyDelete.functionResponses[0].response.ok, false);
  assert.equal(emptyDelete.toolActions.length, 0);
});

test('evaluateAdvisorAgenticTurn deterministic fallback handles Add, Update, Rename, Optimize, and Delete commands', () => {
  const preset = PRESET_FARM_ZONES[0];
  const centroid = getPolygonCentroid(preset.vertices);
  const area = calculateGeodesicArea(preset.vertices);
  const { subZones, farmAverages } = generateSubZonesAndGrid(
    preset.vertices,
    preset.soil,
    preset.baseSpectralBands
  );
  const forecast14 = buildFallback14DayForecast(centroid);
  const seasonal6 = generateSeasonal6MonthForecast(centroid, preset.soil, 0.95);
  const topCrops = scoreCropsForFarm(
    preset.soil,
    farmAverages,
    seasonal6,
    area.totalFeddansDecimal,
    preset.currentCropId
  );

  const zonesList = [
    {
      id: 'z-1',
      nameAr: 'مزرعة كفر الشيخ',
      nameEn: 'Kafr El Sheikh Farm',
      categoryAr: 'حقل قمح',
      categoryEn: 'Wheat Plot',
      color: '#10b981',
      createdAt: '2026-01-01T00:00:00Z',
      vertices: preset.vertices,
      centroid,
      area,
      soil: preset.soil,
      currentCropId: 'wheat',
      plantingDateISO: '2026-01-01',
      gridCells: [],
      subZones,
      farmAverages,
      forecast14,
      weatherSource: 'open-meteo-live' as const,
      nasaSource: 'nasa-power-live' as const,
      customRotationPlans: buildDefaultCustomRotationPlans('wheat'),
      radiometricSource: 'agro-coupled-model' as const,
    },
    {
      id: 'z-2',
      nameAr: 'مزرعة أسيوط',
      nameEn: 'Assiut Farm',
      categoryAr: 'حقل ذرة',
      categoryEn: 'Maize Plot',
      color: '#0ea5e9',
      createdAt: '2026-01-02T00:00:00Z',
      vertices: preset.vertices,
      centroid: { lat: 27.18, lng: 31.18 },
      area,
      soil: preset.soil,
      currentCropId: 'maize',
      plantingDateISO: '2026-01-02',
      gridCells: [],
      subZones,
      farmAverages,
      forecast14,
      weatherSource: 'open-meteo-live' as const,
      nasaSource: 'nasa-power-live' as const,
      customRotationPlans: buildDefaultCustomRotationPlans('maize'),
      radiometricSource: 'agro-coupled-model' as const,
    },
  ];

  const baseCtx = {
    language: 'ar' as const,
    hasActiveZones: true,
    zoneNameAr: zonesList[0].nameAr,
    zoneNameEn: zonesList[0].nameEn,
    centroid,
    currentCropId: 'wheat',
    area,
    soil: preset.soil,
    farmAverages,
    subZones,
    forecast14,
    topCrops,
    zones: zonesList,
    activeZoneId: 'z-1',
  };

  // 1. Add task
  const addTaskTurn = evaluateAdvisorAgenticTurn('أضف مهمة فحص رشاشات الري غداً', baseCtx);
  assert.equal(addTaskTurn.actions[0]?.type, 'ADD_CHECKLIST_TASK');

  // 2. Delete task
  const delTaskTurn = evaluateAdvisorAgenticTurn('امسح مهمة رشاشات الري', baseCtx);
  assert.equal(delTaskTurn.actions[0]?.type, 'DELETE_CHECKLIST_TASK');

  // 3. Delete zone by name
  const delZoneByName = evaluateAdvisorAgenticTurn('احذف مزرعة أسيوط', baseCtx);
  assert.equal(delZoneByName.actions[0]?.type, 'DELETE_ZONE');
  assert.equal(
    delZoneByName.actions[0]?.type === 'DELETE_ZONE' && delZoneByName.actions[0].zoneId,
    'z-2'
  );

  // 4. Rename active zone
  const renameTurn = evaluateAdvisorAgenticTurn('غيّر اسم المزرعة إلى مزرعة الوادي', baseCtx);
  assert.equal(renameTurn.actions[0]?.type, 'RENAME_ZONE');
  assert.equal(
    renameTurn.actions[0]?.type === 'RENAME_ZONE' && renameTurn.actions[0].newNameAr,
    'مزرعة الوادي'
  );

  // 5. Dark mode + English + Optimize rotation
  const themeTurn = evaluateAdvisorAgenticTurn('فعّل الوضع الليلي', baseCtx);
  assert.equal(themeTurn.actions[0]?.type, 'SET_THEME');
  assert.equal(
    themeTurn.actions[0]?.type === 'SET_THEME' && themeTurn.actions[0].darkMode,
    true
  );

  const optTurn = evaluateAdvisorAgenticTurn('حسّن الدورة الزراعية تلقائياً', baseCtx);
  assert.equal(optTurn.actions[0]?.type, 'OPTIMIZE_ROTATION');

  // 6. Zero-zone confirmation reply executes cleanly when an action runs with no zones
  const zeroZoneTaskTurn = evaluateAdvisorAgenticTurn('Add task inspect pump pressure', {
    ...baseCtx,
    language: 'en',
    hasActiveZones: false,
    zones: [],
    activeZoneId: null,
  });
  assert.equal(zeroZoneTaskTurn.actions[0]?.type, 'ADD_CHECKLIST_TASK');
  assert.ok(zeroZoneTaskTurn.deterministicReplyText.includes('Added weekly task'));
});

test('51. evaluateAdvisorAgenticTurn parses multi-clause compound Arabic commands cleanly without over-capturing', () => {
  const preset = PRESET_FARM_ZONES[0];
  const area = calculateGeodesicArea(preset.vertices);
  const centroid = getPolygonCentroid(preset.vertices);
  const forecast14 = buildFallback14DayForecast(centroid);
  const { subZones, farmAverages, gridCells } = generateSubZonesAndGrid(
    preset.vertices,
    preset.soil,
    preset.baseSpectralBands
  );
  const seasonal6 = generateSeasonal6MonthForecast(centroid, preset.soil, 0.95);
  const topCrops = scoreCropsForFarm(
    preset.soil,
    farmAverages,
    seasonal6,
    area.totalFeddansDecimal,
    'wheat'
  );
  const zonesList = [
    {
      id: 'z-1',
      nameAr: 'مزرعة أسيوط (55 فدان)',
      nameEn: 'Assiut Farm (55 Fed)',
      categoryAr: 'حقل قمح',
      categoryEn: 'Wheat Plot',
      color: '#10b981',
      createdAt: '2026-10-15T00:00:00.000Z',
      vertices: preset.vertices,
      centroid,
      area,
      soil: preset.soil,
      currentCropId: 'wheat',
      plantingDateISO: '2026-10-15',
      gridCells,
      subZones,
      farmAverages,
      forecast14,
      weatherSource: 'agro-simulation-fallback' as const,
      nasaSource: 'nasa-power-calibrated-cache' as const,
      customRotationPlans: buildDefaultCustomRotationPlans('wheat'),
      radiometricSource: 'agro-coupled-model' as const,
    },
  ];
  const baseCtx = {
    language: 'ar' as const,
    hasActiveZones: true,
    zoneNameAr: zonesList[0].nameAr,
    zoneNameEn: zonesList[0].nameEn,
    centroid,
    currentCropId: 'wheat',
    area,
    soil: preset.soil,
    farmAverages,
    subZones,
    forecast14,
    topCrops,
    zones: zonesList,
    activeZoneId: 'z-1',
  };

  // Compound Create + Add Task
  const compoundStep1 = evaluateAdvisorAgenticTurn(
    'أضف مزرعة جديدة في أسيوط مساحة 55 فدان قمح وأضف مهمة أسبوعية جديدة بعنوان فحص رشاشات التسميد',
    { ...baseCtx, hasActiveZones: false, zones: [], activeZoneId: null }
  );
  assert.ok(compoundStep1.actions.some((a) => a.type === 'CREATE_ZONE'));
  const addAct = compoundStep1.actions.find((a) => a.type === 'ADD_CHECKLIST_TASK');
  assert.ok(addAct && addAct.type === 'ADD_CHECKLIST_TASK');
  assert.equal(addAct.titleAr, 'فحص رشاشات التسميد');

  // Compound Rename + Dark Mode + Delete Task
  const compoundStep2 = evaluateAdvisorAgenticTurn(
    'غير اسم المزرعة إلى حقل النيل وشغل الوضع الليلي واحذف مهمة فحص رشاشات التسميد',
    baseCtx
  );
  const renameAct = compoundStep2.actions.find((a) => a.type === 'RENAME_ZONE');
  assert.ok(renameAct && renameAct.type === 'RENAME_ZONE');
  assert.equal(renameAct.newNameAr, 'حقل النيل');

  const darkAct = compoundStep2.actions.find((a) => a.type === 'SET_THEME');
  assert.ok(darkAct && darkAct.type === 'SET_THEME');
  assert.equal(darkAct.darkMode, true);

  const delTaskAct = compoundStep2.actions.find((a) => a.type === 'DELETE_CHECKLIST_TASK');
  assert.ok(delTaskAct && delTaskAct.type === 'DELETE_CHECKLIST_TASK');
  assert.equal(delTaskAct.clearAll, false);
  assert.equal(delTaskAct.matchText, 'فحص رشاشات التسميد');
  assert.equal(
    compoundStep2.actions.some((a) => a.type === 'UPDATE_ZONE_CONFIG'),
    false
  );

  // Compound Delete Active Zone + Return to Light Mode
  const compoundStep3 = evaluateAdvisorAgenticTurn(
    'امسح المزرعة الحالية وارجع للوضع النهاري',
    baseCtx
  );
  const delZoneAct = compoundStep3.actions.find((a) => a.type === 'DELETE_ZONE');
  assert.ok(delZoneAct && delZoneAct.type === 'DELETE_ZONE');
  assert.equal(delZoneAct.clearAll, false);
  assert.equal(delZoneAct.zoneId, 'z-1');

  const lightAct = compoundStep3.actions.find((a) => a.type === 'SET_THEME');
  assert.ok(lightAct && lightAct.type === 'SET_THEME');
  assert.equal(lightAct.darkMode, false);
  assert.equal(compoundStep3.deterministicReplyText.includes('برنامج التسميد'), false);
});


