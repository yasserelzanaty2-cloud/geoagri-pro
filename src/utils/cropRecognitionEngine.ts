import {
  AreaBreakdown,
  CropDatabaseItem,
  DailyWeatherPoint,
  SoilProfile,
  SpatialGridCell,
  SpectralIndexKey,
} from '../types/agro';
import { CROP_DATABASE } from './agroEngine';

export interface CropSpectralSignatureProfile {
  cropId: string;
  mapColorHex: string;
  targetNdvi: [number, number]; // [min, max] optimal BOA NDVI window
  targetNdwi: [number, number]; // canopy water content window
  targetSavi: [number, number]; // soil-adjusted canopy window
  targetNdmi: [number, number]; // root/leaf SWIR moisture window
  targetEvi: [number, number]; // biomass LAI window
  targetLstC: [number, number]; // typical canopy surface temperature
  leafExGTarget: [number, number]; // Excess Green index (2G - R - B) normalized [0..1]
  canopyTextureContrast: [number, number]; // fine grass leaf vs broadleaf rosette contrast
  signatureDescriptionAr: string;
  signatureDescriptionEn: string;
}

export const CROP_SPECTRAL_SIGNATURES: Record<string, CropSpectralSignatureProfile> = {
  wheat: {
    cropId: 'wheat',
    mapColorHex: '#10b981', // Emerald Green
    targetNdvi: [0.52, 0.78],
    targetNdwi: [0.14, 0.32],
    targetSavi: [0.42, 0.66],
    targetNdmi: [0.18, 0.38],
    targetEvi: [0.38, 0.62],
    targetLstC: [18.5, 25.5],
    leafExGTarget: [0.28, 0.48],
    canopyTextureContrast: [0.12, 0.26],
    signatureDescriptionAr:
      'نسبة انعكاس قريب تحت الحمراء إلى الأحمر (NIR/Red) مرتفعة مع محتوى مائي معتدل للأوراق النجيلية المنتصبة وتبريد نتح منتظم.',
    signatureDescriptionEn:
      'High NIR/Red chlorophyll ratio with moderate erectophile cereal leaf water (NDWI) and steady transpiration cooling.',
  },
  clover: {
    cropId: 'clover',
    mapColorHex: '#047857', // Deep Forest Green
    targetNdvi: [0.64, 0.86],
    targetNdwi: [0.28, 0.52],
    targetSavi: [0.52, 0.74],
    targetNdmi: [0.32, 0.56],
    targetEvi: [0.48, 0.75],
    targetLstC: [17.0, 23.8],
    leafExGTarget: [0.42, 0.65],
    canopyTextureContrast: [0.08, 0.18],
    signatureDescriptionAr:
      'غطاء خضري كثيف جداً يغلق سطح التربة مبكراً مع أعلى محتوى مائي للأوراق (NDWI > 0.28) وانخفاض ملحوظ في حرارة السطح (LST).',
    signatureDescriptionEn:
      'Very dense planophile forage canopy with high leaf liquid water (NDWI > 0.28) and strong evaporative cooling.',
  },
  fava_bean: {
    cropId: 'fava_bean',
    mapColorHex: '#84cc16', // Lime Green
    targetNdvi: [0.46, 0.71],
    targetNdwi: [0.16, 0.35],
    targetSavi: [0.38, 0.61],
    targetNdmi: [0.20, 0.41],
    targetEvi: [0.35, 0.58],
    targetLstC: [19.0, 26.0],
    leafExGTarget: [0.24, 0.44],
    canopyTextureContrast: [0.22, 0.38],
    signatureDescriptionAr:
      'أوراق بقولية عريضة ذات انعكاس متوازن في النطاق الأخضر وتباين نسيجي متوسط بين خطوط الزراعة.',
    signatureDescriptionEn:
      'Broadleaf legume architecture with balanced green-band reflectance and distinct inter-row SAVI signature.',
  },
  sugar_beet: {
    cropId: 'sugar_beet',
    mapColorHex: '#06b6d4', // Cyan-Teal
    targetNdvi: [0.44, 0.72],
    targetNdwi: [0.20, 0.42],
    targetSavi: [0.36, 0.60],
    targetNdmi: [0.22, 0.45],
    targetEvi: [0.34, 0.59],
    targetLstC: [19.5, 27.5],
    leafExGTarget: [0.30, 0.52],
    canopyTextureContrast: [0.25, 0.42],
    signatureDescriptionAr:
      'مجموع خضري قرصي عريض الأوراق عصاري يحتفظ برطوبة عالية (NDMI) ويتحمل الملوحة المرتفعة والأراضي الجيرية.',
    signatureDescriptionEn:
      'Succulent rosette broadleaf canopy with elevated SWIR moisture retention (NDMI) on saline/calcareous soils.',
  },
  potato: {
    cropId: 'potato',
    mapColorHex: '#14b8a6', // Teal
    targetNdvi: [0.48, 0.74],
    targetNdwi: [0.18, 0.38],
    targetSavi: [0.40, 0.63],
    targetNdmi: [0.21, 0.42],
    targetEvi: [0.37, 0.61],
    targetLstC: [18.5, 25.0],
    leafExGTarget: [0.29, 0.49],
    canopyTextureContrast: [0.20, 0.35],
    signatureDescriptionAr:
      'خطوط مصاطب منتظمة تعطي بصمة SAVI مميزة مع حساسية عالية للملوحة ورطوبة جذرية متوازنة.',
    signatureDescriptionEn:
      'Ridged row-crop geometry producing distinct SAVI/NDVI ratio on low-salinity loamy/sandy soils.',
  },
  quinoa: {
    cropId: 'quinoa',
    mapColorHex: '#a855f7', // Purple-Violet
    targetNdvi: [0.28, 0.54],
    targetNdwi: [0.04, 0.22],
    targetSavi: [0.24, 0.46],
    targetNdmi: [0.06, 0.25],
    targetEvi: [0.20, 0.42],
    targetLstC: [21.5, 29.5],
    leafExGTarget: [0.16, 0.34],
    canopyTextureContrast: [0.28, 0.46],
    signatureDescriptionAr:
      'بصمة طيفية متكيفة مع الجفاف والملوحة العالية في الأراضي الرملية مع انعكاس متوسط للغطاء النباتي.',
    signatureDescriptionEn:
      'Halophytic drought-adapted spectral profile with moderate SAVI on high-EC sandy soils.',
  },
  olive: {
    cropId: 'olive',
    mapColorHex: '#65a30d', // Olive Green
    targetNdvi: [0.26, 0.52],
    targetNdwi: [0.02, 0.20],
    targetSavi: [0.22, 0.45],
    targetNdmi: [0.05, 0.24],
    targetEvi: [0.18, 0.39],
    targetLstC: [22.0, 31.0],
    leafExGTarget: [0.15, 0.32],
    canopyTextureContrast: [0.34, 0.55],
    signatureDescriptionAr:
      'أشجار بستانية مستديمة ذات أوراق شمعية فضية-خضراء وتباين مكاني واضح بين مظلة الأشجار والتربة البينية.',
    signatureDescriptionEn:
      'Perennial orchard spacing with waxy sclerophyllous leaves and high spatial texture contrast.',
  },
  tomato: {
    cropId: 'tomato',
    mapColorHex: '#f97316', // Warm Amber-Orange
    targetNdvi: [0.42, 0.68],
    targetNdwi: [0.14, 0.33],
    targetSavi: [0.34, 0.56],
    targetNdmi: [0.16, 0.36],
    targetEvi: [0.31, 0.53],
    targetLstC: [20.0, 27.5],
    leafExGTarget: [0.25, 0.45],
    canopyTextureContrast: [0.24, 0.40],
    signatureDescriptionAr:
      'مصاطب خضر مروية بالتنقيط ذات تغطية نباتية متوسطة إلى عالية ونشاط بخر-نتح متوسط.',
    signatureDescriptionEn:
      'Drip-irrigated vegetable beds with moderate-to-high canopy cover and warm leaf thermal profile.',
  },
  maize: {
    cropId: 'maize',
    mapColorHex: '#22c55e', // Vibrant Green
    targetNdvi: [0.58, 0.84],
    targetNdwi: [0.22, 0.44],
    targetSavi: [0.48, 0.71],
    targetNdmi: [0.25, 0.48],
    targetEvi: [0.45, 0.72],
    targetLstC: [23.0, 31.5],
    leafExGTarget: [0.36, 0.58],
    canopyTextureContrast: [0.16, 0.30],
    signatureDescriptionAr:
      'كتلة حيوية مرتفعة جداً (EVI > 0.45) لنباتات C4 الصيفية طويلة الساق مع استهلاك مائي نشط.',
    signatureDescriptionEn:
      'High C4 summer biomass (EVI > 0.45) with tall leaf architecture and strong NIR reflectance.',
  },
  sorghum: {
    cropId: 'sorghum',
    mapColorHex: '#eab308', // Golden Green
    targetNdvi: [0.42, 0.68],
    targetNdwi: [0.10, 0.28],
    targetSavi: [0.34, 0.56],
    targetNdmi: [0.12, 0.31],
    targetEvi: [0.30, 0.52],
    targetLstC: [25.0, 34.0],
    leafExGTarget: [0.24, 0.42],
    canopyTextureContrast: [0.20, 0.36],
    signatureDescriptionAr:
      'محصول حبوب صيفي ذو طبقة شمعية يقاوم الحرارة العالية والملوحة مع بصمة مائية مقتصدة.',
    signatureDescriptionEn:
      'Waxy-cuticle summer cereal maintaining canopy vigor under high LST and elevated soil EC.',
  },
  cotton: {
    cropId: 'cotton',
    mapColorHex: '#ec4899', // Magenta-Rose
    targetNdvi: [0.50, 0.77],
    targetNdwi: [0.16, 0.36],
    targetSavi: [0.41, 0.64],
    targetNdmi: [0.19, 0.39],
    targetEvi: [0.38, 0.63],
    targetLstC: [24.0, 32.5],
    leafExGTarget: [0.30, 0.50],
    canopyTextureContrast: [0.18, 0.34],
    signatureDescriptionAr:
      'مظلة ورقية مفصصة عريضة ذات جذور وتدية عميقة تحافظ على رطوبة الجذور (NDMI) في الصيف.',
    signatureDescriptionEn:
      'Broad-lobed summer canopy with deep taproot sustaining NDMI hydration in clay/loam soils.',
  },
  rice: {
    cropId: 'rice',
    mapColorHex: '#0284c7', // Deep Water Blue-Green
    targetNdvi: [0.60, 0.85],
    targetNdwi: [0.34, 0.58],
    targetSavi: [0.49, 0.72],
    targetNdmi: [0.36, 0.60],
    targetEvi: [0.46, 0.73],
    targetLstC: [21.0, 28.0],
    leafExGTarget: [0.38, 0.62],
    canopyTextureContrast: [0.06, 0.16],
    signatureDescriptionAr:
      'تراكب فريد بين كثافة الكلوروفيل العالية (NDVI) والتشبع المائي السطحي (NDWI > 0.34) في الأراضي الطينية.',
    signatureDescriptionEn:
      'Unique combination of dense green canopy (NDVI) and flooded surface water signal (NDWI > 0.34).',
  },
};

export interface VisualLeafPhotoAnalysis {
  sourceLabelAr: string;
  sourceLabelEn: string;
  meanR: number;
  meanG: number;
  meanB: number;
  excessGreenExG: number; // Normalized 2G - R - B
  greenFractionPct: number; // % of pixels classified as active chlorophyll tissue
  canopyTextureContrast: number; // local luminance standard deviation
  inferredCropId: string;
  visualConfidenceBoostPct: number;
}

export interface RecognizedCropCandidate {
  crop: CropDatabaseItem;
  signature: CropSpectralSignatureProfile;
  confidencePct: number; // 0 - 99.4%
  spectralMatchPct: number;
  seasonalMatchPct: number;
  soilMatchPct: number;
  visualMatchPct: number;
  detectedStageAr: string;
  detectedStageEn: string;
  cultivatedCellsCount: number;
  cultivatedAreaFeddans: number;
  cultivatedSharePct: number;
  reasoningAr: string;
  reasoningEn: string;
}

export interface CellCropClassification {
  cellId: string;
  isVegetated: boolean;
  landCover: SpatialGridCell['landCover'];
  cropId: string | null;
  cropNameAr: string;
  cropNameEn: string;
  colorHex: string;
  confidencePct: number;
  stageLabelAr: string;
  stageLabelEn: string;
}

export interface ZoneCropRecognitionResult {
  primaryCandidate: RecognizedCropCandidate;
  candidates: RecognizedCropCandidate[];
  cellClassifications: Record<string, CellCropClassification>;
  distributionBreakdown: Array<{
    key: string;
    labelAr: string;
    labelEn: string;
    colorHex: string;
    cellsCount: number;
    sharePct: number;
    areaFeddans: number;
    isCrop: boolean;
  }>;
  cultivatedCellsCount: number;
  bareCellsCount: number;
  urbanCellsCount: number;
  visualAnalysis?: VisualLeafPhotoAnalysis | null;
}

function rangeAffinityScore(val: number, [min, max]: [number, number], toleranceSpan: number): number {
  if (val >= min && val <= max) {
    const mid = (min + max) / 2;
    const half = Math.max(0.01, (max - min) / 2);
    const distFromCenter = Math.abs(val - mid) / half;
    return Math.round(100 - distFromCenter * 8); // 92..100 inside target window
  }
  const distOutside = val < min ? min - val : val - max;
  const ratio = distOutside / Math.max(0.01, toleranceSpan);
  return Math.max(15, Math.round(90 * Math.exp(-ratio * 1.65)));
}

function detectPhenologicalStageFromNdvi(
  ndvi: number,
  savi: number
): { stageAr: string; stageEn: string } {
  if (ndvi < 0.24) {
    return {
      stageAr: 'بداية الإنبات والبادرات (Emergence)',
      stageEn: 'Seedling Emergence Stage',
    };
  }
  if (ndvi < 0.44 || savi < 0.35) {
    return {
      stageAr: 'النمو الخضري المبكر والتفريع (Tillering / Rosette)',
      stageEn: 'Early Vegetative & Tillering Stage',
    };
  }
  if (ndvi < 0.64) {
    return {
      stageAr: 'الاستطالة واكتمال المجموع الخضري (Stem Elongation)',
      stageEn: 'Active Canopy Closure & Stem Elongation',
    };
  }
  return {
    stageAr: 'ذروة الإزهار وامتلاء المحصول (Peak Canopy & Anthesis)',
    stageEn: 'Peak Canopy Vigor & Flowering/Filling',
  };
}

/**
 * Evaluates a single crop candidate against spectral values, soil profile, season, and optional leaf photo.
 */
function scoreCropCandidate(
  crop: CropDatabaseItem,
  sig: CropSpectralSignatureProfile,
  metrics: {
    NDVI: number;
    NDWI: number;
    SAVI: number;
    NDMI: number;
    EVI: number;
    LST: number;
  },
  soil: SoilProfile,
  currentMonth: number,
  visualAnalysis?: VisualLeafPhotoAnalysis | null
): {
  totalConfidencePct: number;
  spectralMatchPct: number;
  seasonalMatchPct: number;
  soilMatchPct: number;
  visualMatchPct: number;
} {
  // 1. Multi-spectral 6-index similarity (NDVI, NDWI, SAVI, NDMI, EVI, LST)
  const sNdvi = rangeAffinityScore(metrics.NDVI, sig.targetNdvi, 0.22);
  const sNdwi = rangeAffinityScore(metrics.NDWI, sig.targetNdwi, 0.20);
  const sSavi = rangeAffinityScore(metrics.SAVI, sig.targetSavi, 0.20);
  const sNdmi = rangeAffinityScore(metrics.NDMI, sig.targetNdmi, 0.20);
  const sEvi = rangeAffinityScore(metrics.EVI, sig.targetEvi, 0.20);
  const sLst = rangeAffinityScore(metrics.LST, sig.targetLstC, 6.5);

  // Check water-to-chlorophyll ratio (NDWI / NDVI) to sharply distinguish Berseem/Rice from Wheat/Fava
  const targetRatio =
    ((sig.targetNdwi[0] + sig.targetNdwi[1]) / 2) /
    Math.max(0.2, (sig.targetNdvi[0] + sig.targetNdvi[1]) / 2);
  const actualRatio = metrics.NDWI / Math.max(0.2, metrics.NDVI);
  const ratioAffinity = Math.max(
    30,
    Math.round(100 * Math.exp(-Math.abs(actualRatio - targetRatio) * 2.4))
  );

  const spectralMatchPct = Math.round(
    sNdvi * 0.24 +
      sNdwi * 0.20 +
      sSavi * 0.16 +
      sNdmi * 0.14 +
      sEvi * 0.12 +
      sLst * 0.06 +
      ratioAffinity * 0.08
  );

  // 2. Agro-climatic Seasonal Phenology Match
  // Winter season in Egypt: Oct (10) - Apr (4); Summer season: May (5) - Sep (9)
  const isWinterMonth = currentMonth >= 10 || currentMonth <= 4;
  let seasonalMatchPct = 78;
  if (crop.season === 'perennial') {
    seasonalMatchPct = 88;
  } else if (crop.season === 'winter' && isWinterMonth) {
    seasonalMatchPct = crop.optimalPlantingMonths.includes(currentMonth) ? 98 : 92;
  } else if (crop.season === 'summer' && !isWinterMonth) {
    seasonalMatchPct = crop.optimalPlantingMonths.includes(currentMonth) ? 98 : 92;
  } else {
    seasonalMatchPct = 52; // off-season crop
  }

  // 3. Soil Texture & Salinity Compatibility
  const textureIndex = crop.preferredSoils.indexOf(soil.texture);
  const textureScore =
    textureIndex === 0 ? 98 : textureIndex === 1 ? 91 : textureIndex >= 2 ? 84 : 62;
  const ecExcess = Math.max(0, soil.salinityEC - crop.maxSalinityEC);
  const ecScore = Math.max(35, Math.round(100 - ecExcess * crop.ecSlopePctPerDsm * 1.4));
  const soilMatchPct = Math.round(textureScore * 0.58 + ecScore * 0.42);

  // 4. Visual Leaf Photo Analysis Match (if user uploaded or selected a plant photo)
  let visualMatchPct = spectralMatchPct;
  if (visualAnalysis) {
    const exgScore = rangeAffinityScore(visualAnalysis.excessGreenExG, sig.leafExGTarget, 0.2);
    const texScore = rangeAffinityScore(
      visualAnalysis.canopyTextureContrast,
      sig.canopyTextureContrast,
      0.18
    );
    const directBonus = visualAnalysis.inferredCropId === crop.id ? 14 : 0;
    visualMatchPct = Math.min(99, Math.round(exgScore * 0.55 + texScore * 0.45 + directBonus));
  }

  const rawCombined = visualAnalysis
    ? spectralMatchPct * 0.44 +
      seasonalMatchPct * 0.22 +
      soilMatchPct * 0.16 +
      visualMatchPct * 0.18
    : spectralMatchPct * 0.54 + seasonalMatchPct * 0.26 + soilMatchPct * 0.20;

  const totalConfidencePct = Number(Math.min(98.8, Math.max(22, rawCombined)).toFixed(1));

  return {
    totalConfidencePct,
    spectralMatchPct,
    seasonalMatchPct,
    soilMatchPct,
    visualMatchPct,
  };
}

/**
 * Automatically identifies the planted agricultural crop(s) inside the active study zone
 * using multi-spectral satellite signatures (NDVI, NDWI, SAVI, NDMI, EVI, LST), seasonal
 * phenology, soil profile, and optional field leaf image analysis.
 */
export function identifyPlantedCropInZone(
  gridCells: SpatialGridCell[],
  farmAverages: Record<SpectralIndexKey, number>,
  soil: SoilProfile,
  area: AreaBreakdown,
  forecast14: DailyWeatherPoint[],
  visualAnalysis?: VisualLeafPhotoAnalysis | null
): ZoneCropRecognitionResult {
  // Determine active month from forecast14 or fallback to November (peak winter cultivation)
  const dateStr = forecast14[0]?.date || '2026-11-08';
  const parsedMonth = Number(dateStr.split('-')[1]) || 11;

  // Separate vegetated agricultural cells from bare soil and urban built-up cells
  const vegetatedCells = gridCells.filter(
    (c) => c.landCover !== 'urban_built' && c.landCover !== 'bare_soil' && c.values.NDVI >= 0.22
  );
  const bareCells = gridCells.filter(
    (c) => c.landCover === 'bare_soil' || (c.landCover !== 'urban_built' && c.values.NDVI < 0.22)
  );
  const urbanCells = gridCells.filter((c) => c.landCover === 'urban_built');

  // Compute mean spectral signature specifically across vegetated crop cells
  const vegMetrics =
    vegetatedCells.length > 0
      ? {
          NDVI: Number(
            (
              vegetatedCells.reduce((s, c) => s + c.values.NDVI, 0) / vegetatedCells.length
            ).toFixed(3)
          ),
          NDWI: Number(
            (
              vegetatedCells.reduce((s, c) => s + c.values.NDWI, 0) / vegetatedCells.length
            ).toFixed(3)
          ),
          SAVI: Number(
            (
              vegetatedCells.reduce((s, c) => s + c.values.SAVI, 0) / vegetatedCells.length
            ).toFixed(3)
          ),
          NDMI: Number(
            (
              vegetatedCells.reduce((s, c) => s + c.values.NDMI, 0) / vegetatedCells.length
            ).toFixed(3)
          ),
          EVI: Number(
            (
              vegetatedCells.reduce((s, c) => s + c.values.EVI, 0) / vegetatedCells.length
            ).toFixed(3)
          ),
          LST: Number(
            (
              vegetatedCells.reduce((s, c) => s + c.values.LST, 0) / vegetatedCells.length
            ).toFixed(1)
          ),
        }
      : {
          NDVI: farmAverages.NDVI,
          NDWI: farmAverages.NDWI,
          SAVI: farmAverages.SAVI,
          NDMI: farmAverages.NDMI,
          EVI: farmAverages.EVI,
          LST: farmAverages.LST,
        };

  // Score all crops in CROP_DATABASE
  const scoredList = CROP_DATABASE.map((crop) => {
    const sig = CROP_SPECTRAL_SIGNATURES[crop.id] || CROP_SPECTRAL_SIGNATURES.wheat;
    const scores = scoreCropCandidate(crop, sig, vegMetrics, soil, parsedMonth, visualAnalysis);
    return {
      crop,
      sig,
      scores,
    };
  }).sort((a, b) => b.scores.totalConfidencePct - a.scores.totalConfidencePct);

  // Classify each individual cell in the zone so the user can view the Crop Distribution Map
  const cellClassifications: Record<string, CellCropClassification> = {};
  const cropCellCounts: Record<string, number> = {};
  const top3Pool = scoredList.slice(0, 3);

  gridCells.forEach((cell) => {
    if (cell.landCover === 'urban_built') {
      cellClassifications[cell.id] = {
        cellId: cell.id,
        isVegetated: false,
        landCover: 'urban_built',
        cropId: null,
        cropNameAr: 'مناطق مبنية وحضر (معزولة)',
        cropNameEn: 'Built-up / Urban Area (Isolated)',
        colorHex: '#dc2626', // Scientific Red for Built-up
        confidencePct: 98,
        stageLabelAr: 'غير زراعي (كتلة عمرانية)',
        stageLabelEn: 'Non-Agricultural Built Block',
      };
      return;
    }

    if (cell.landCover === 'bare_soil' || cell.values.NDVI < 0.22) {
      cellClassifications[cell.id] = {
        cellId: cell.id,
        isVegetated: false,
        landCover: 'bare_soil',
        cropId: null,
        cropNameAr: 'أرض غير مزروعة / تربة مكشوفة',
        cropNameEn: 'Uncultivated / Bare Soil',
        colorHex: '#eab308', // Scientific Yellow for Uncultivated Soil
        confidencePct: 95,
        stageLabelAr: 'بور أو مجهزة للزراعة',
        stageLabelEn: 'Fallow / Pre-Sowing Soil',
      };
      return;
    }

    // Evaluate cell against the top 3 seasonal candidates to capture spatial intra-zone crop patterns
    let bestItem = top3Pool[0];
    let bestCellScore = -1;
    for (const candidate of top3Pool) {
      const cellSc = scoreCropCandidate(
        candidate.crop,
        candidate.sig,
        {
          NDVI: cell.values.NDVI,
          NDWI: cell.values.NDWI,
          SAVI: cell.values.SAVI,
          NDMI: cell.values.NDMI,
          EVI: cell.values.EVI,
          LST: cell.values.LST,
        },
        soil,
        parsedMonth,
        visualAnalysis
      );
      if (cellSc.totalConfidencePct > bestCellScore) {
        bestCellScore = cellSc.totalConfidencePct;
        bestItem = candidate;
      }
    }

    const stage = detectPhenologicalStageFromNdvi(cell.values.NDVI, cell.values.SAVI);
    cropCellCounts[bestItem.crop.id] = (cropCellCounts[bestItem.crop.id] || 0) + 1;

    cellClassifications[cell.id] = {
      cellId: cell.id,
      isVegetated: true,
      landCover: cell.landCover,
      cropId: bestItem.crop.id,
      cropNameAr: bestItem.crop.nameAr.split('(')[0].trim(),
      cropNameEn: bestItem.crop.nameEn.split('(')[0].trim(),
      colorHex: bestItem.sig.mapColorHex,
      confidencePct: bestCellScore,
      stageLabelAr: stage.stageAr,
      stageLabelEn: stage.stageEn,
    };
  });

  const totalCells = Math.max(1, gridCells.length);
  const totalFeddans = Math.max(0.1, area.totalFeddansDecimal);

  const candidates: RecognizedCropCandidate[] = scoredList.slice(0, 4).map((item) => {
    const count = cropCellCounts[item.crop.id] || 0;
    const sharePct = Math.round((count / totalCells) * 100);
    const feddans = Number(((count / totalCells) * totalFeddans).toFixed(2));
    const stage = detectPhenologicalStageFromNdvi(vegMetrics.NDVI, vegMetrics.SAVI);

    const reasoningAr = `${item.sig.signatureDescriptionAr} (تطابق طيفي ${item.scores.spectralMatchPct}% عند NDVI=${vegMetrics.NDVI} و NDWI=${vegMetrics.NDWI} مع ملاءمة موسمية ${item.scores.seasonalMatchPct}%).`;
    const reasoningEn = `${item.sig.signatureDescriptionEn} (Spectral match ${item.scores.spectralMatchPct}% at NDVI=${vegMetrics.NDVI}, NDWI=${vegMetrics.NDWI} & seasonal fit ${item.scores.seasonalMatchPct}%).`;

    return {
      crop: item.crop,
      signature: item.sig,
      confidencePct: item.scores.totalConfidencePct,
      spectralMatchPct: item.scores.spectralMatchPct,
      seasonalMatchPct: item.scores.seasonalMatchPct,
      soilMatchPct: item.scores.soilMatchPct,
      visualMatchPct: item.scores.visualMatchPct,
      detectedStageAr: stage.stageAr,
      detectedStageEn: stage.stageEn,
      cultivatedCellsCount: count,
      cultivatedAreaFeddans: feddans,
      cultivatedSharePct: sharePct,
      reasoningAr,
      reasoningEn,
    };
  });

  // Build spatial distribution breakdown for the map legend & card
  const distributionBreakdown: ZoneCropRecognitionResult['distributionBreakdown'] = [];
  candidates.forEach((cand) => {
    if (cand.cultivatedCellsCount > 0) {
      distributionBreakdown.push({
        key: cand.crop.id,
        labelAr: cand.crop.nameAr.split('(')[0].trim(),
        labelEn: cand.crop.nameEn.split('(')[0].trim(),
        colorHex: cand.signature.mapColorHex,
        cellsCount: cand.cultivatedCellsCount,
        sharePct: cand.cultivatedSharePct,
        areaFeddans: cand.cultivatedAreaFeddans,
        isCrop: true,
      });
    }
  });

  if (bareCells.length > 0) {
    const sharePct = Math.round((bareCells.length / totalCells) * 100);
    distributionBreakdown.push({
      key: 'bare_soil',
      labelAr: 'أراضي غير مزروعة / تربة مكشوفة',
      labelEn: 'Uncultivated / Bare Soil',
      colorHex: '#eab308',
      cellsCount: bareCells.length,
      sharePct,
      areaFeddans: Number(((bareCells.length / totalCells) * totalFeddans).toFixed(2)),
      isCrop: false,
    });
  }

  if (urbanCells.length > 0) {
    const sharePct = Math.round((urbanCells.length / totalCells) * 100);
    distributionBreakdown.push({
      key: 'urban_built',
      labelAr: 'مناطق مبنية وحضر (معزولة)',
      labelEn: 'Built-up / Urban (Isolated)',
      colorHex: '#dc2626',
      cellsCount: urbanCells.length,
      sharePct,
      areaFeddans: Number(((urbanCells.length / totalCells) * totalFeddans).toFixed(2)),
      isCrop: false,
    });
  }

  return {
    primaryCandidate: candidates[0],
    candidates,
    cellClassifications,
    distributionBreakdown,
    cultivatedCellsCount: vegetatedCells.length,
    bareCellsCount: bareCells.length,
    urbanCellsCount: urbanCells.length,
    visualAnalysis,
  };
}

/**
 * Analyzes an uploaded field plant photo using an HTML5 Canvas to compute Excess Green (ExG = 2G - R - B),
 * active chlorophyll pixel fraction, and leaf venation texture contrast.
 */
export async function analyzePlantPhotoDataUrl(
  dataUrl: string,
  fileName: string
): Promise<VisualLeafPhotoAnalysis> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const size = 96;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(buildCalibratedSampleLeafAnalysis('wheat'));
        return;
      }
      ctx.drawImage(img, 0, 0, size, size);
      const { data } = ctx.getImageData(0, 0, size, size);

      let sumR = 0;
      let sumG = 0;
      let sumB = 0;
      let sumExG = 0;
      let greenPixels = 0;
      const lumValues: number[] = [];
      const totalPx = size * size;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i] / 255;
        const g = data[i + 1] / 255;
        const b = data[i + 2] / 255;
        sumR += r;
        sumG += g;
        sumB += b;
        const exg = Math.max(0, 2 * g - r - b);
        sumExG += exg;
        if (g > r * 1.08 && g > b * 1.12) {
          greenPixels++;
        }
        lumValues.push(0.299 * r + 0.587 * g + 0.114 * b);
      }

      const meanR = Number(((sumR / totalPx) * 255).toFixed(1));
      const meanG = Number(((sumG / totalPx) * 255).toFixed(1));
      const meanB = Number(((sumB / totalPx) * 255).toFixed(1));
      const excessGreenExG = Number(Math.min(0.85, Math.max(0.08, sumExG / totalPx)).toFixed(3));
      const greenFractionPct = Math.round((greenPixels / totalPx) * 100);

      const meanLum = lumValues.reduce((a, b) => a + b, 0) / totalPx;
      const variance =
        lumValues.reduce((acc, v) => acc + (v - meanLum) * (v - meanLum), 0) / totalPx;
      const canopyTextureContrast = Number(
        Math.min(0.55, Math.max(0.08, Math.sqrt(variance) * 1.6)).toFixed(3)
      );

      // Infer closest crop from ExG and leaf texture contrast
      let bestCropId = 'wheat';
      let bestDist = Infinity;
      Object.values(CROP_SPECTRAL_SIGNATURES).forEach((sig) => {
        const exgMid = (sig.leafExGTarget[0] + sig.leafExGTarget[1]) / 2;
        const texMid = (sig.canopyTextureContrast[0] + sig.canopyTextureContrast[1]) / 2;
        const d = Math.abs(excessGreenExG - exgMid) * 1.6 + Math.abs(canopyTextureContrast - texMid);
        if (d < bestDist) {
          bestDist = d;
          bestCropId = sig.cropId;
        }
      });

      resolve({
        sourceLabelAr: `صورة حقلية مرفوعة (${fileName})`,
        sourceLabelEn: `Uploaded Field Photo (${fileName})`,
        meanR,
        meanG,
        meanB,
        excessGreenExG,
        greenFractionPct,
        canopyTextureContrast,
        inferredCropId: bestCropId,
        visualConfidenceBoostPct: 6.4,
      });
    };
    img.onerror = () => {
      resolve(buildCalibratedSampleLeafAnalysis('wheat'));
    };
    img.src = dataUrl;
  });
}

/**
 * Provides instant calibrated field leaf optical profiles for testing or field verification.
 */
export function buildCalibratedSampleLeafAnalysis(
  sampleCropId: 'wheat' | 'clover' | 'fava_bean' | 'sugar_beet' | 'maize' | 'rice'
): VisualLeafPhotoAnalysis {
  const presets: Record<string, VisualLeafPhotoAnalysis> = {
    wheat: {
      sourceLabelAr: 'عينة مرجعية: أوراق قمح في طور التفريع (سخا 95)',
      sourceLabelEn: 'Reference Sample: Wheat Tillering Leaves (Sakha 95)',
      meanR: 68,
      meanG: 146,
      meanB: 62,
      excessGreenExG: 0.38,
      greenFractionPct: 84,
      canopyTextureContrast: 0.19,
      inferredCropId: 'wheat',
      visualConfidenceBoostPct: 6.8,
    },
    clover: {
      sourceLabelAr: 'عينة مرجعية: مظلة برسيم مسقاوي كثيف',
      sourceLabelEn: 'Reference Sample: Dense Egyptian Clover Canopy',
      meanR: 48,
      meanG: 164,
      meanB: 54,
      excessGreenExG: 0.54,
      greenFractionPct: 94,
      canopyTextureContrast: 0.12,
      inferredCropId: 'clover',
      visualConfidenceBoostPct: 7.2,
    },
    fava_bean: {
      sourceLabelAr: 'عينة مرجعية: أوراق فول بلدي عريضة (جيزة 716)',
      sourceLabelEn: 'Reference Sample: Broadleaf Fava Bean (Giza 716)',
      meanR: 76,
      meanG: 142,
      meanB: 72,
      excessGreenExG: 0.34,
      greenFractionPct: 78,
      canopyTextureContrast: 0.29,
      inferredCropId: 'fava_bean',
      visualConfidenceBoostPct: 6.5,
    },
    sugar_beet: {
      sourceLabelAr: 'عينة مرجعية: أوراق بنجر السكر القرصية',
      sourceLabelEn: 'Reference Sample: Sugar Beet Rosette Leaves',
      meanR: 64,
      meanG: 152,
      meanB: 68,
      excessGreenExG: 0.41,
      greenFractionPct: 86,
      canopyTextureContrast: 0.33,
      inferredCropId: 'sugar_beet',
      visualConfidenceBoostPct: 6.6,
    },
    maize: {
      sourceLabelAr: 'عينة مرجعية: أوراق ذرة شامية (هجين 168)',
      sourceLabelEn: 'Reference Sample: Maize Hybrid 168 Leaves',
      meanR: 58,
      meanG: 158,
      meanB: 56,
      excessGreenExG: 0.47,
      greenFractionPct: 89,
      canopyTextureContrast: 0.23,
      inferredCropId: 'maize',
      visualConfidenceBoostPct: 6.9,
    },
    rice: {
      sourceLabelAr: 'عينة مرجعية: حقل أرز سوبر 300 مغمور جزئياً',
      sourceLabelEn: 'Reference Sample: Super 300 Rice Paddy Canopy',
      meanR: 52,
      meanG: 162,
      meanB: 64,
      excessGreenExG: 0.50,
      greenFractionPct: 91,
      canopyTextureContrast: 0.11,
      inferredCropId: 'rice',
      visualConfidenceBoostPct: 7.1,
    },
  };
  return presets[sampleCropId] || presets.wheat;
}
