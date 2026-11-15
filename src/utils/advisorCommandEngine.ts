import {
  AdvisorCreateZonePayload,
  AdvisorInlineWidgetType,
  AdvisorSiteAction,
  AdvisorUpdateSoilOrCropPayload,
  AreaBreakdown,
  DailyWeatherPoint,
  FourWeekNpkSchedule,
  GrowthStageInfo,
  IrrigationSystem,
  Language,
  LatLon,
  RegionalPestRiskWarning,
  ScoredCropRecommendation,
  SoilProfile,
  SoilTexture,
  SpectralIndexKey,
  SubZoneSummary,
  ThematicMapLayerId,
  UserStudyZone,
} from '../types/agro';
import {
  CROP_DATABASE,
  calculateFourWeekNpkSchedule,
  calculateGeodesicArea,
  calculateGrowthStageAndGDD,
  evaluateRegionalPestRisks,
  generateLocalAgronomistResponse,
  getPolygonCentroid,
} from './agroEngine';

export interface AgroRegionGazetteerEntry {
  keywordsAr: string[];
  keywordsEn: string[];
  labelAr: string;
  labelEn: string;
  center: LatLon;
  defaultSoil: SoilTexture;
  defaultEc: number;
  defaultIrrigation: IrrigationSystem;
}

export const EGYPT_AGRO_REGIONS: AgroRegionGazetteerEntry[] = [
  {
    keywordsAr: ['كفر الشيخ', 'سخا', 'بيلا', 'الحامول', 'دسوق', 'مطوبس', 'سيدي سالم'],
    keywordsEn: ['kafr el sheikh', 'sakha', 'desouk', 'bila'],
    labelAr: 'دلتا النيل — كفر الشيخ (سخا)',
    labelEn: 'Nile Delta — Kafr El-Sheikh (Sakha)',
    center: { lat: 31.1118, lng: 30.9401 },
    defaultSoil: 'clay',
    defaultEc: 2.1,
    defaultIrrigation: 'flood',
  },
  {
    keywordsAr: ['نجع حمادي', 'فرشوط', 'أولاد نجم', 'اولاد نجم', 'قنا', 'دشنا', 'قوص'],
    keywordsEn: ['nag hammadi', 'naj hammadi', 'farshout', 'qena', 'deshna'],
    labelAr: 'وادي النيل الجنوبي — قنا ونجع حمادي',
    labelEn: 'Upper Nile Valley — Qena & Nag Hammadi',
    center: { lat: 26.0542, lng: 32.2411 },
    defaultSoil: 'loamy',
    defaultEc: 1.45,
    defaultIrrigation: 'drip',
  },
  {
    keywordsAr: ['البحيرة', 'دمنهور', 'كفر الدوار', 'إيتاي البارود', 'حوش عيسى', 'أبو المطامير'],
    keywordsEn: ['beheira', 'damanhour', 'abu el matamir', 'hosh issa'],
    labelAr: 'غرب الدلتا — البحيرة',
    labelEn: 'West Delta — El Beheira',
    center: { lat: 30.8481, lng: 30.3436 },
    defaultSoil: 'clay',
    defaultEc: 1.65,
    defaultIrrigation: 'drip',
  },
  {
    keywordsAr: ['النوبارية', 'وادي النطرون', 'البستان', 'السادات', 'الدلتا الجديدة', 'مستقبل مصر'],
    keywordsEn: ['nubaria', 'wadi el natrun', 'sadat', 'new delta', 'mostakbal misr'],
    labelAr: 'الظهير الصحراوي الغربي — النوبارية والدلتا الجديدة',
    labelEn: 'West Delta Reclamation — Nubaria & New Delta',
    center: { lat: 30.5214, lng: 30.0685 },
    defaultSoil: 'sandy',
    defaultEc: 1.95,
    defaultIrrigation: 'pivot',
  },
  {
    keywordsAr: ['الدقهلية', 'المنصورة', 'ميت غمر', 'السنبلاوين', 'شربين', 'بلقاس', 'طلخا'],
    keywordsEn: ['dakahlia', 'mansoura', 'mit ghamr', 'belqas', 'sherbin'],
    labelAr: 'شرق ووسط الدلتا — الدقهلية (المنصورة)',
    labelEn: 'Central/East Delta — Dakahlia (Mansoura)',
    center: { lat: 31.0364, lng: 31.3807 },
    defaultSoil: 'clay',
    defaultEc: 1.4,
    defaultIrrigation: 'flood',
  },
  {
    keywordsAr: ['الشرقية', 'الزقازيق', 'بلبيس', 'فاقوس', 'أبو حماد', 'الحسينية', 'منيا القمح'],
    keywordsEn: ['sharqia', 'zagazig', 'belbeis', 'faqous'],
    labelAr: 'شرق الدلتا — الشرقية',
    labelEn: 'East Delta — Al-Sharqia',
    center: { lat: 30.5877, lng: 31.502 },
    defaultSoil: 'loamy',
    defaultEc: 1.5,
    defaultIrrigation: 'drip',
  },
  {
    keywordsAr: ['الصالحية', 'الإسماعيلية', 'الاسماعيلية', 'القصاصين', 'التل الكبير', 'سرابيوم', 'القنطرة'],
    keywordsEn: ['salhia', 'ismailia', 'qantara', 'tal el kebir'],
    labelAr: 'إقليم القناة — الصالحية الجديدة والإسماعيلية',
    labelEn: 'Suez Canal Belt — New Salhia & Ismailia',
    center: { lat: 30.6382, lng: 32.0124 },
    defaultSoil: 'sandy',
    defaultEc: 1.7,
    defaultIrrigation: 'drip',
  },
  {
    keywordsAr: ['سيناء', 'العريش', 'بئر العبد', 'رابعة', 'الشيخ زويد', 'وسط سيناء', 'طور سيناء'],
    keywordsEn: ['sinai', 'arish', 'bir al-abd', 'el arish'],
    labelAr: 'شبه جزيرة سيناء — محور بئر العبد والعريش',
    labelEn: 'North Sinai — Bir Al-Abd & El-Arish',
    center: { lat: 31.0202, lng: 32.4173 },
    defaultSoil: 'sandy',
    defaultEc: 2.4,
    defaultIrrigation: 'drip',
  },
  {
    keywordsAr: ['الغربية', 'طنطا', 'المحلة', 'كفر الزيات', 'زفتى', 'قطور', 'بسيون'],
    keywordsEn: ['gharbia', 'tanta', 'mahalla', 'kafr el zayat'],
    labelAr: 'قلب الدلتا — الغربية (طنطا)',
    labelEn: 'Heart of Nile Delta — Gharbia (Tanta)',
    center: { lat: 30.7865, lng: 31.0004 },
    defaultSoil: 'clay',
    defaultEc: 1.25,
    defaultIrrigation: 'flood',
  },
  {
    keywordsAr: ['المنوفية', 'شبين الكوم', 'قويسنا', 'الباجور', 'أشمون', 'منوف', 'تلا'],
    keywordsEn: ['menofia', 'monufia', 'shibin el kom', 'ashmoun'],
    labelAr: 'جنوب الدلتا — المنوفية',
    labelEn: 'South Delta — Monufia',
    center: { lat: 30.5526, lng: 31.009 },
    defaultSoil: 'loamy',
    defaultEc: 1.15,
    defaultIrrigation: 'flood',
  },
  {
    keywordsAr: ['الفيوم', 'طامية', 'سنورس', 'إبشواي', 'إطسا', 'يوسف الصديق'],
    keywordsEn: ['fayoum', 'faiyum', 'tamiya', 'sinnuris'],
    labelAr: 'منخفض الفيوم الزراعي',
    labelEn: 'Fayoum Oasis Depression',
    center: { lat: 29.3084, lng: 30.8428 },
    defaultSoil: 'loamy',
    defaultEc: 2.25,
    defaultIrrigation: 'drip',
  },
  {
    keywordsAr: ['بني سويف', 'الواسطى', 'ناصر', 'إهناسيا', 'ببا', 'الفشن', 'سمسطا'],
    keywordsEn: ['beni suef', 'beba', 'el fashn'],
    labelAr: 'شمال الصعيد — بني سويف',
    labelEn: 'North Upper Egypt — Beni Suef',
    center: { lat: 29.0661, lng: 31.0994 },
    defaultSoil: 'loamy',
    defaultEc: 1.4,
    defaultIrrigation: 'drip',
  },
  {
    keywordsAr: ['المنيا', 'غرب المنيا', 'ملوي', 'سمالوط', 'بني مزار', 'مغاغة', 'مطاي', 'أبو قرقاص'],
    keywordsEn: ['minya', 'west minya', 'mallawi', 'samalut', 'maghagha'],
    labelAr: 'عروس الصعيد — المنيا وغرب المنيا',
    labelEn: 'Middle Egypt — Minya & West Minya',
    center: { lat: 28.1099, lng: 30.7503 },
    defaultSoil: 'calcareous',
    defaultEc: 1.85,
    defaultIrrigation: 'pivot',
  },
  {
    keywordsAr: ['أسيوط', 'اسيوط', 'ديروط', 'القوصية', 'منفلوط', 'أبنوب', 'البداري'],
    keywordsEn: ['assiut', 'asyut', 'dayrut', 'manfalut'],
    labelAr: 'وادي أسيوط الزراعي',
    labelEn: 'Assiut Agricultural Valley',
    center: { lat: 27.1783, lng: 31.1859 },
    defaultSoil: 'clay',
    defaultEc: 1.35,
    defaultIrrigation: 'drip',
  },
  {
    keywordsAr: ['سوهاج', 'جرجا', 'أخميم', 'طهطا', 'طما', 'المراغة', 'البلينا'],
    keywordsEn: ['sohag', 'girga', 'tahta', 'akhmim'],
    labelAr: 'وادي سوهاج الزراعي',
    labelEn: 'Sohag Nile Valley',
    center: { lat: 26.5591, lng: 31.6957 },
    defaultSoil: 'loamy',
    defaultEc: 1.4,
    defaultIrrigation: 'drip',
  },
  {
    keywordsAr: ['الأقصر', 'الاقصر', 'إسنا', 'اسنا', 'أرمنت', 'القرنة'],
    keywordsEn: ['luxor', 'esna', 'armant'],
    labelAr: 'جنوب الصعيد — الأقصر وإسنا',
    labelEn: 'Upper Egypt — Luxor & Esna',
    center: { lat: 25.6872, lng: 32.6396 },
    defaultSoil: 'loamy',
    defaultEc: 1.5,
    defaultIrrigation: 'drip',
  },
  {
    keywordsAr: ['أسوان', 'اسوان', 'كوم أمبو', 'كوم امبو', 'إدفو', 'ادفو', 'نصر النوبة'],
    keywordsEn: ['aswan', 'kom ombo', 'edfu'],
    labelAr: 'جنوب الوادي — أسوان وكوم أمبو',
    labelEn: 'Far Upper Egypt — Aswan & Kom Ombo',
    center: { lat: 24.4767, lng: 32.9463 },
    defaultSoil: 'loamy',
    defaultEc: 1.65,
    defaultIrrigation: 'drip',
  },
  {
    keywordsAr: ['توشكى', 'توشكي', 'شرق العوينات', 'العوينات', 'أبو سمبل'],
    keywordsEn: ['toshka', 'east oweinat', 'oweinat', 'abu simbel'],
    labelAr: 'المشروعات القومية الجنوبية — توشكى وشرق العوينات',
    labelEn: 'Southern Mega-Reclamation — Toshka & East Oweinat',
    center: { lat: 22.6145, lng: 31.2812 },
    defaultSoil: 'sandy',
    defaultEc: 1.45,
    defaultIrrigation: 'pivot',
  },
  {
    keywordsAr: ['الوادي الجديد', 'الفرافرة', 'الداخلة', 'الخارجة', 'باريس'],
    keywordsEn: ['new valley', 'farafra', 'dakhla', 'kharga'],
    labelAr: 'الواحات والوادي الجديد — الفرافرة والداخلة',
    labelEn: 'New Valley Oases — Farafra & Dakhla',
    center: { lat: 27.0568, lng: 27.9699 },
    defaultSoil: 'sandy',
    defaultEc: 2.1,
    defaultIrrigation: 'pivot',
  },
  {
    keywordsAr: ['مطروح', 'الساحل الشمالي', 'العلمين', 'سيوة', 'المغرة', 'الحمام', 'براني'],
    keywordsEn: ['matrouh', 'north coast', 'alamein', 'siwa', 'moghra', 'el hamam'],
    labelAr: 'الساحل الشمالي الغربي ومطروح والمغرة',
    labelEn: 'North-West Coast — Matrouh & Moghra',
    center: { lat: 30.8351, lng: 28.9514 },
    defaultSoil: 'calcareous',
    defaultEc: 2.65,
    defaultIrrigation: 'drip',
  },
];

/**
 * Normalizes Eastern Arabic numerals (٠-٩) and Persian numerals to standard ASCII digits (0-9).
 */
export function normalizeArabicDigits(input: string): string {
  return input
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/،/g, ',');
}

/**
 * Generates a 4-vertex geodesic rectangular polygon centered on `center` whose exact
 * geodesic area equals `targetFeddans` (with 4:3 agricultural parcel aspect ratio).
 */
export function buildGeodesicRectangleForFeddans(
  center: LatLon,
  targetFeddans: number
): LatLon[] {
  const clampedFeddans = Math.max(0.5, Math.min(250000, targetFeddans));
  const targetSqMeters = clampedFeddans * 4200.833;
  // Aspect ratio 4:3 (width E-W : height N-S)
  const heightMeters = Math.sqrt(targetSqMeters * 0.75);
  const widthMeters = targetSqMeters / Math.max(1, heightMeters);

  const latRad = (center.lat * Math.PI) / 180;
  const metersPerDegLat = 111132.954 - 559.822 * Math.cos(2 * latRad);
  const metersPerDegLng = Math.max(20000, 111412.84 * Math.cos(latRad));

  let halfLat = heightMeters / 2 / metersPerDegLat;
  let halfLng = widthMeters / 2 / metersPerDegLng;

  const makeRect = (dLat: number, dLng: number): LatLon[] => [
    { lat: Number((center.lat + dLat).toFixed(6)), lng: Number((center.lng - dLng).toFixed(6)) },
    { lat: Number((center.lat + dLat).toFixed(6)), lng: Number((center.lng + dLng).toFixed(6)) },
    { lat: Number((center.lat - dLat).toFixed(6)), lng: Number((center.lng + dLng).toFixed(6)) },
    { lat: Number((center.lat - dLat).toFixed(6)), lng: Number((center.lng - dLng).toFixed(6)) },
  ];

  // Two-step geodesic area calibration so `calculateGeodesicArea` matches `clampedFeddans` accurately
  for (let i = 0; i < 3; i++) {
    const rect = makeRect(halfLat, halfLng);
    const measured = calculateGeodesicArea(rect).totalFeddansDecimal;
    if (measured > 0.001) {
      const scale = Math.sqrt(clampedFeddans / measured);
      halfLat *= scale;
      halfLng *= scale;
    }
  }

  return makeRect(halfLat, halfLng);
}

/**
 * Extracts coordinate pairs (lat, lng) from a natural language string.
 * Supports patterns like:
 * - "30.85, 31.12"
 * - "خط عرض 26.05 وخط طول 32.24"
 * - "lat 30.5 lng 31.2"
 */
export function extractCoordinatesFromText(rawText: string): LatLon[] {
  const text = normalizeArabicDigits(rawText);
  const points: LatLon[] = [];

  // 1. Explicit labeled lat/lng in Arabic or English
  const labeledMatch = text.match(
    /(?:خط\s*عرض|عرض|lat(?:itude)?)\s*[:=]?\s*(-?\d{1,2}(?:\.\d+)?)\s*[,،\sوand&]*\s*(?:خط\s*طول|طول|lng|lon(?:gitude)?)\s*[:=]?\s*(-?\d{1,3}(?:\.\d+)?)/i
  );
  if (labeledMatch) {
    const lat = parseFloat(labeledMatch[1]);
    const lng = parseFloat(labeledMatch[2]);
    if (lat >= -65 && lat <= 68 && lng >= -180 && lng <= 180) {
      points.push({ lat, lng });
    }
  }

  // 2. Pair patterns like (30.123, 31.456) or 26.054, 32.241
  const pairRegex = /(-?\d{2}\.\d{2,8})\s*[,،/\s-]\s*(-?\d{2,3}\.\d{2,8})/g;
  let match: RegExpExecArray | null;
  while ((match = pairRegex.exec(text)) !== null) {
    const a = parseFloat(match[1]);
    const b = parseFloat(match[2]);
    // In Egypt/MENA, lat is ~15..38 and lng is ~20..55
    let lat = a;
    let lng = b;
    if (a > 38 && b >= 15 && b <= 38) {
      lat = b;
      lng = a;
    }
    if (lat >= -65 && lat <= 68 && lng >= -180 && lng <= 180) {
      const duplicate = points.some(
        (p) => Math.abs(p.lat - lat) < 1e-5 && Math.abs(p.lng - lng) < 1e-5
      );
      if (!duplicate) {
        points.push({ lat, lng });
      }
    }
  }

  // 3. Integer/short decimal coordinate pairs right after "إحداثيات" / "احداثيات" / "coordinates"
  if (points.length === 0) {
    const afterKeyword = text.match(
      /(?:إحداثيات|احداثيات|بإحداثيات|باحداثيات|عند|coord(?:inate)?s?|at)\s*[:(]?\s*(\d{2}(?:\.\d+)?)\s*[,،\sو]+\s*(\d{2}(?:\.\d+)?)/i
    );
    if (afterKeyword) {
      const lat = parseFloat(afterKeyword[1]);
      const lng = parseFloat(afterKeyword[2]);
      if (lat >= 15 && lat <= 45 && lng >= 20 && lng <= 60) {
        points.push({ lat, lng });
      }
    }
  }

  return points;
}

/**
 * Extracts requested area in Feddans from natural language (supports Feddans, Hectares, Qirats, Acres).
 */
export function extractAreaFeddansFromText(rawText: string): number | null {
  const text = normalizeArabicDigits(rawText);

  const feddanMatch =
    text.match(/(\d+(?:\.\d+)?)\s*(?:فدان|أفدنة|افدنة|فدانات|feddan|feddans|fed)\b/i) ||
    text.match(/(?:بمساحة|مساحة|مساحتها|area(?:\s*of)?)\s*(\d+(?:\.\d+)?)\s*(?:فدان|feddan)?/i);

  if (feddanMatch) {
    const val = parseFloat(feddanMatch[1]);
    if (Number.isFinite(val) && val > 0) {
      return Math.min(250000, Math.max(0.5, val));
    }
  }

  const hectareMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:هكتار|hectare|hectares|ha)\b/i);
  if (hectareMatch) {
    const ha = parseFloat(hectareMatch[1]);
    if (Number.isFinite(ha) && ha > 0) {
      return Number((ha * 2.38095).toFixed(2));
    }
  }

  // Arabic word numbers
  if (/عشر(?:ة|ه)\s*(?:فدان|أفدنة|افدنة)/.test(text)) return 10;
  if (/عشرين\s*فدان/.test(text)) return 20;
  if (/خمسين\s*فدان/.test(text)) return 50;
  if (/(?:مائة|مية|مئة)\s*فدان/.test(text)) return 100;
  if (/(?:ألف|الف)\s*فدان/.test(text)) return 1000;

  return null;
}

/**
 * Extracts crop selection from natural language (returns `{ cropId, customCropLabel }`).
 */
export function extractCropFromText(rawText: string): {
  cropId?: string;
  customCropLabel?: string;
  cropNameAr?: string;
  cropNameEn?: string;
} {
  const q = rawText.toLowerCase();

  const cropMatchers: Array<{
    id: string;
    patterns: RegExp;
  }> = [
    { id: 'wheat', patterns: /(?:قمح|غلة|سخا\s*95|جيزة\s*171|مصر\s*3|wheat)/i },
    { id: 'maize', patterns: /(?:ذرة\s*شامية|ذره\s*شاميه|ذرة\s*صفراء|ذرة\s*بيضاء|\bmaize\b|\bcorn\b)/i },
    { id: 'sorghum', patterns: /(?:ذرة\s*رفيعة|ذره\s*رفيعه|سورجم|sorghum)/i },
    { id: 'fava_bean', patterns: /(?:فول\s*بلدي|فول|fava\s*bean|broad\s*bean)/i },
    { id: 'sugar_beet', patterns: /(?:بنجر\s*السكر|بنجر\s*سكر|بنجر|شمندر|sugar\s*beet)/i },
    { id: 'potato', patterns: /(?:بطاطس|سبونتا|كارا|برن|potato)/i },
    { id: 'tomato', patterns: /(?:طماطم|بندورة|tomato)/i },
    { id: 'cotton', patterns: /(?:قطن|جيزة\s*94|جيزة\s*95|cotton)/i },
    { id: 'clover', patterns: /(?:برسيم|فحل|مسقاوي|حجازي|clover|berseem|alfalfa)/i },
    { id: 'olive', patterns: /(?:زيتون|عجيزي|بيكوال|كلاماتا|olive)/i },
    { id: 'rice', patterns: /(?:أرز|ارز|رز|سخا\s*108|\brice\b)/i },
    { id: 'quinoa', patterns: /(?:كينوا|quinoa)/i },
  ];

  for (const m of cropMatchers) {
    if (m.patterns.test(q)) {
      const dbCrop = CROP_DATABASE.find((c) => c.id === m.id);
      return {
        cropId: m.id,
        cropNameAr: dbCrop?.nameAr || m.id,
        cropNameEn: dbCrop?.nameEn || m.id,
      };
    }
  }

  // Fallback for generic "ذرة" if not sorghum
  if (/(?:ذرة|ذره)/i.test(q)) {
    const dbCrop = CROP_DATABASE.find((c) => c.id === 'maize');
    return {
      cropId: 'maize',
      cropNameAr: dbCrop?.nameAr || 'ذرة شامية',
      cropNameEn: dbCrop?.nameEn || 'Maize',
    };
  }

  // Check custom high-value crops if explicitly mentioned
  const customCrops: Array<{ labelAr: string; labelEn: string; baseId: string; regex: RegExp }> = [
    { labelAr: 'مانجو (كيت / نعومي)', labelEn: 'Mango Orchard', baseId: 'olive', regex: /(?:مانجو|مانجا|mango)/i },
    { labelAr: 'موالح وبرتقال', labelEn: 'Citrus & Orange', baseId: 'olive', regex: /(?:موالح|برتقال|ليمون|يوسفي|citrus|orange)/i },
    { labelAr: 'نخيل التمر (مجدول / برحي)', labelEn: 'Date Palm (Medjool)', baseId: 'olive', regex: /(?:نخيل|بلح|تمر|مجدول|برحي|date\s*palm)/i },
    { labelAr: 'بصل وثوم تصديري', labelEn: 'Export Onion & Garlic', baseId: 'potato', regex: /(?:بصل|ثوم|توم|onion|garlic)/i },
    { labelAr: 'فراولة تصديرية', labelEn: 'Export Strawberry', baseId: 'tomato', regex: /(?:فراولة|فراوله|strawberry)/i },
    { labelAr: 'فول سوداني وسمسم', labelEn: 'Peanut & Sesame', baseId: 'fava_bean', regex: /(?:سوداني|سمسم|عباد\s*شمس|دوار\s*الشمس|peanut|sesame|sunflower)/i },
    { labelAr: 'فاصوليا وبسلة', labelEn: 'Green Bean & Pea', baseId: 'fava_bean', regex: /(?:فاصوليا|بسلة|لوبيا|green\s*bean)/i },
    { labelAr: 'قصب السكر', labelEn: 'Sugarcane', baseId: 'sorghum', regex: /(?:قصب\s*السكر|قصب|sugarcane)/i },
  ];

  for (const c of customCrops) {
    if (c.regex.test(q)) {
      return {
        cropId: c.baseId,
        customCropLabel: c.labelAr,
        cropNameAr: c.labelAr,
        cropNameEn: c.labelEn,
      };
    }
  }

  return {};
}

/**
 * Extracts soil texture, salinity EC, pH, and irrigation system from natural language.
 */
export function extractSoilAndIrrigationFromText(rawText: string): {
  soilTexture?: SoilTexture;
  salinityEC?: number;
  ph?: number;
  irrigation?: IrrigationSystem;
} {
  const text = normalizeArabicDigits(rawText).toLowerCase();
  let soilTexture: SoilTexture | undefined;
  if (/(?:طينية|طينيه|طيني|سوداء|ثقيلة|clay)/i.test(text)) {
    soilTexture = 'clay';
  } else if (/(?:رملية|رمليه|رملي|صحراوية|خفيفة|sandy|sand)/i.test(text)) {
    soilTexture = 'sandy';
  } else if (/(?:جيرية|جيريه|جيري|كلسية|calcareous|chalk)/i.test(text)) {
    soilTexture = 'calcareous';
  } else if (/(?:صفراء|طميية|طميه|طمي|رسوبية|خليط|loamy|loam|silt)/i.test(text)) {
    soilTexture = 'loamy';
  }

  let irrigation: IrrigationSystem | undefined;
  if (/(?:تنقيط|نقاطات|خرطوم|drip)/i.test(text)) {
    irrigation = 'drip';
  } else if (/(?:بيفوت|محوري|رشاش\s*محوري|pivot)/i.test(text)) {
    irrigation = 'pivot';
  } else if (/(?:رش\s*ثابت|رشاشات|الري\s*بالرش|\bsprinkler\b)/i.test(text)) {
    irrigation = 'sprinkler';
  } else if (/(?:غمر|سطحي|تقليدي|flood)/i.test(text)) {
    irrigation = 'flood';
  } else if (/(?:مطري|بعلي|تعتمد\s*على\s*المطر|rainfed)/i.test(text)) {
    irrigation = 'rainfed';
  }

  let salinityEC: number | undefined;
  const ecMatch = text.match(
    /(?:ملوحة|ملوحه|الاملاح|الأملاح|\bec\b|salinity)\s*(?:التربة|المياه|:|=|تصل\s*إلى|حوالي)?\s*(\d+(?:\.\d+)?)/i
  );
  if (ecMatch) {
    const val = parseFloat(ecMatch[1]);
    // Convert ppm to dS/m if user entered e.g. 1600 ppm
    if (val > 50) {
      salinityEC = Number((val / 640).toFixed(2));
    } else if (val >= 0.2 && val <= 30) {
      salinityEC = Number(val.toFixed(2));
    }
  }

  let ph: number | undefined;
  const phMatch = text.match(/(?:\bph\b|حموضة|قلوية|رقم\s*هيدروجيني)\s*[:=]?\s*(\d+(?:\.\d+)?)/i);
  if (phMatch) {
    const val = parseFloat(phMatch[1]);
    if (val >= 4.0 && val <= 10.5) {
      ph = Number(val.toFixed(2));
    }
  }

  return { soilTexture, salinityEC, ph, irrigation };
}

/**
 * Matches an Egyptian/Arab agricultural region from text if present.
 */
export function matchAgroRegionFromText(rawText: string): AgroRegionGazetteerEntry | null {
  const q = normalizeArabicDigits(rawText).toLowerCase();
  for (const entry of EGYPT_AGRO_REGIONS) {
    if (
      entry.keywordsAr.some((kw) => q.includes(kw.toLowerCase())) ||
      entry.keywordsEn.some((kw) => q.includes(kw.toLowerCase()))
    ) {
      return entry;
    }
  }
  return null;
}

export interface AdvisorExecutionPlan {
  actions: AdvisorSiteAction[];
  inlineWidgets: AdvisorInlineWidgetType[];
  metricsCited: string[];
  deterministicReplyText: string;
}

/**
 * Parses any natural language prompt (Arabic or English) to detect:
 * 1. Site control actions (CREATE_ZONE, UPDATE_ZONE_CONFIG, SWITCH_MAP_LAYER, SWITCH_ACTIVE_ZONE, DELETE_ZONE, NAVIGATE_TAB, EXPORT_PDF_REPORT)
 * 2. On-demand inline analytical widgets to display inside the chat stream
 * 3. A comprehensive, data-grounded agronomic response citing live telemetry
 */
export function evaluateAdvisorAgenticTurn(
  prompt: string,
  context: {
    language: Language;
    hasActiveZones: boolean;
    zoneNameAr: string;
    zoneNameEn: string;
    centroid: LatLon;
    currentCropId: string;
    customCropLabel?: string;
    area: AreaBreakdown;
    soil: SoilProfile;
    farmAverages: Record<SpectralIndexKey, number>;
    subZones: SubZoneSummary[];
    forecast14: DailyWeatherPoint[];
    topCrops: ScoredCropRecommendation[];
    zones?: UserStudyZone[];
    activeZoneId?: string | null;
  }
): AdvisorExecutionPlan {
  const normalizedPrompt = normalizeArabicDigits(prompt).replace(/[\u064B-\u065F\u0670]/g, '');
  const q = normalizedPrompt.toLowerCase();
  const isAr = context.language === 'ar';

  const actions: AdvisorSiteAction[] = [];
  const inlineWidgets: AdvisorInlineWidgetType[] = [];
  const metricsCited = new Set<string>();

  const coords = extractCoordinatesFromText(normalizedPrompt);
  const requestedFeddans = extractAreaFeddansFromText(normalizedPrompt);
  const matchedRegion = matchAgroRegionFromText(normalizedPrompt);
  const cropSpec = extractCropFromText(normalizedPrompt);
  const soilSpec = extractSoilAndIrrigationFromText(normalizedPrompt);

  // -------------------------------------------------------------------------
  // 1. DETECT CREATE / ADD AGRICULTURAL STUDY ZONE COMMAND
  // -------------------------------------------------------------------------
  const explicitCreateVerbAndNoun =
    /(?:أضف|اضف|ضيف|إضافة|اضافة|أنشئ|انشئ|انشاء|إنشاء|اعمل|سجل|ارسم|حدد)\s*(?:لي\s*)?(?:منطقة|منطقه|زونة|زونه|مزرعة|مزرعه|حقل|قطعة\s*أرض|أرض\s*زراعية|أرض)/i.test(
      normalizedPrompt
    ) ||
    /(?:add|create|new|define|register|draw)\s+(?:a\s+)?(?:new\s+)?(?:agricultural\s+|study\s+|farm\s+)?(?:zone|farm|field|parcel|plot|area)/i.test(
      normalizedPrompt
    );

  const hasDeleteRenameSwitchVerb =
    /(?:احذف|امسح|إزالة|ازالة|حذف|شيل|غيّر\s*اسم|غير\s*اسم|عدل\s*اسم|بدل\s*اسم|delete|remove|clear|erase|rename|switch\s+to|activate)/i.test(
      normalizedPrompt
    );

  const explicitCreateZoneIntent =
    explicitCreateVerbAndNoun ||
    (coords.length >= 1 && (requestedFeddans !== null || !context.hasActiveZones)) ||
    (!hasDeleteRenameSwitchVerb &&
      matchedRegion !== null &&
      (requestedFeddans !== null ||
        /(?:أضف|اضف|ضيف|اعمل|انشئ|زونة|مزرعة|أرض|add|create|zone|farm)/i.test(normalizedPrompt)));

  const trimCompoundClause = (raw: string): string => {
    const cleaned = raw
      .split(/\n|[،,;؛|]/)[0]
      .split(
        /\s+(?:ثم\s+|و(?:شغل|افتح|فعل|فعّل|اغلق|اقفل|اطفي|الغي|ألغِ|احذف|امسح|اضف|أضف|ضيف|سجل|انشئ|أنشئ|غير|غيّر|عدل|بدل|حول|ارجع|رجع|خلي|علم|انجز|أنجز|اصدر|أصدر|حمل|نزل|حدث|انتقل|روح|اعرض|سمي|سمّي|حسن|حسّن|رتب|شيل|ازل|أزل)(?=[\s\u0600-\u06FF])|(?:and\s+(?:then\s+)?|then\s+)(?:add|create|delete|remove|clear|rename|switch|enable|disable|turn|set|change|open|go|navigate|export|log|mark|complete|optimize|refresh)\b)/i
      )[0];
    return cleaned.trim().replace(/^["«']|["»']$/g, '').trim();
  };

  if (explicitCreateZoneIntent) {
    const targetFeddans = requestedFeddans ?? 50;
    let targetVertices: LatLon[] = [];
    let targetCenter: LatLon = { lat: 30.8481, lng: 30.9401 };

    if (coords.length >= 3) {
      targetVertices = coords;
      targetCenter = getPolygonCentroid(coords);
    } else if (coords.length >= 1) {
      targetCenter = coords[0];
      targetVertices = buildGeodesicRectangleForFeddans(targetCenter, targetFeddans);
    } else if (matchedRegion) {
      targetCenter = matchedRegion.center;
      targetVertices = buildGeodesicRectangleForFeddans(targetCenter, targetFeddans);
    } else {
      targetCenter = context.hasActiveZones
        ? {
            lat: Number((context.centroid.lat + 0.015).toFixed(5)),
            lng: Number((context.centroid.lng + 0.015).toFixed(5)),
          }
        : EGYPT_AGRO_REGIONS[0].center;
      targetVertices = buildGeodesicRectangleForFeddans(targetCenter, targetFeddans);
    }

    const calibratedArea = calculateGeodesicArea(targetVertices);
    const chosenTexture: SoilTexture =
      soilSpec.soilTexture || matchedRegion?.defaultSoil || 'loamy';
    const chosenEc = soilSpec.salinityEC ?? matchedRegion?.defaultEc ?? 1.45;
    const chosenPh = soilSpec.ph ?? 7.4;
    const chosenIrrigation: IrrigationSystem =
      soilSpec.irrigation || matchedRegion?.defaultIrrigation || 'drip';
    const chosenCropId = cropSpec.cropId || context.currentCropId || 'wheat';
    const dbCrop = CROP_DATABASE.find((c) => c.id === chosenCropId) || CROP_DATABASE[0];

    // Extract custom zone name if user said "باسم ..." or "اسمها ..."
    const customNameMatch =
      normalizedPrompt.match(/(?:باسم|اسمها|تسمى|named|called)\s+["«']?([^"»'،,\n]{2,100})["»']?/i);
    const parsedCustomName = customNameMatch ? trimCompoundClause(customNameMatch[1]) : '';

    const defaultZoneNameAr = parsedCustomName.length >= 2
      ? parsedCustomName
      : matchedRegion
      ? `مزرعة ${matchedRegion.keywordsAr[0]} (${calibratedArea.feddans} فدان)`
      : `مزرعة (${targetCenter.lat.toFixed(3)}°N, ${targetCenter.lng.toFixed(3)}°E — ${calibratedArea.feddans} فدان)`;

    const defaultZoneNameEn = parsedCustomName.length >= 2
      ? parsedCustomName
      : matchedRegion
      ? `${matchedRegion.labelEn} Farm (${calibratedArea.feddans} Feddans)`
      : `Study Zone (${targetCenter.lat.toFixed(3)}°N, ${targetCenter.lng.toFixed(3)}°E — ${calibratedArea.feddans} Fed)`;

    const zoneDraft: AdvisorCreateZonePayload = {
      nameAr: defaultZoneNameAr,
      nameEn: defaultZoneNameEn,
      categoryAr: `حقل ${cropSpec.customCropLabel || dbCrop.nameAr}`,
      categoryEn: `${cropSpec.customCropLabel || dbCrop.nameEn} Plot`,
      soilTexture: chosenTexture,
      salinityEC: chosenEc,
      ph: chosenPh,
      organicMatterPct: 2.2,
      irrigation: chosenIrrigation,
      cropId: chosenCropId,
      ...(cropSpec.customCropLabel ? { customCropLabel: cropSpec.customCropLabel } : {}),
      vertices: targetVertices,
      centroid: targetCenter,
      requestedFeddans: calibratedArea.totalFeddansDecimal,
      regionLabelAr: matchedRegion?.labelAr || `إحداثيات (${targetCenter.lat.toFixed(4)}°N, ${targetCenter.lng.toFixed(4)}°E)`,
      regionLabelEn: matchedRegion?.labelEn || `Coords (${targetCenter.lat.toFixed(4)}°N, ${targetCenter.lng.toFixed(4)}°E)`,
    };

    actions.push({
      type: 'CREATE_ZONE',
      zoneDraft,
      summaryAr: `تم إنشاء وتفعيل "${defaultZoneNameAr}" بمساحة ${calibratedArea.feddans} فدان و${calibratedArea.qirats} قيراط عند (${targetCenter.lat.toFixed(4)}°N, ${targetCenter.lng.toFixed(4)}°E)`,
      summaryEn: `Created & activated "${defaultZoneNameEn}" (${calibratedArea.feddans} Feddans, ${calibratedArea.qirats} Qirats) at (${targetCenter.lat.toFixed(4)}°N, ${targetCenter.lng.toFixed(4)}°E)`,
    });
    inlineWidgets.push('zone_action_card');
    metricsCited.add(`Coordinates ${targetCenter.lat.toFixed(4)}°N, ${targetCenter.lng.toFixed(4)}°E`);
    metricsCited.add(`Area ${calibratedArea.feddans} Feddans (${calibratedArea.hectares} ha)`);
  }

  // -------------------------------------------------------------------------
  // 2. DETECT UPDATE SOIL / CROP / SALINITY / IRRIGATION ON ACTIVE ZONE
  // -------------------------------------------------------------------------
  const explicitUpdateConfigIntent =
    !explicitCreateZoneIntent &&
    context.hasActiveZones &&
    (/(?:غير|عدل|حدث|بدل|حول|خلي|اجعل|اضبط|تغيير|تعديل|اعتماد|اعتمد)\s+(?:ال)?(?:محصول|تربة|قوام\s*التربة|ملوحة|حموضة|قلوية|ري|نظام\s*الري|طريقة\s*الري|زراعة)/i.test(
      normalizedPrompt
    ) ||
      /(?:ملوحة\s*التربة|قوام\s*التربة|نظام\s*الري|\bec\b\s*[:=]|\bph\b\s*[:=])/i.test(
        normalizedPrompt
      ) ||
      /(?:change|update|set|modify|switch|make)\s+(?:the\s+)?(?:crop|soil|salinity|ec|ph|irrigation)/i.test(
        normalizedPrompt
      ));

  if (
    explicitUpdateConfigIntent &&
    (cropSpec.cropId ||
      soilSpec.soilTexture ||
      soilSpec.salinityEC !== undefined ||
      soilSpec.ph !== undefined ||
      soilSpec.irrigation)
  ) {
    const updates: AdvisorUpdateSoilOrCropPayload = {
      ...(cropSpec.cropId ? { cropId: cropSpec.cropId } : {}),
      ...(cropSpec.customCropLabel ? { customCropLabel: cropSpec.customCropLabel } : {}),
      ...(soilSpec.soilTexture ? { soilTexture: soilSpec.soilTexture } : {}),
      ...(soilSpec.salinityEC !== undefined ? { salinityEC: soilSpec.salinityEC } : {}),
      ...(soilSpec.ph !== undefined ? { ph: soilSpec.ph } : {}),
      ...(soilSpec.irrigation ? { irrigation: soilSpec.irrigation } : {}),
    };

    const partsAr: string[] = [];
    const partsEn: string[] = [];
    if (cropSpec.cropNameAr) {
      partsAr.push(`المحصول إلى "${cropSpec.cropNameAr}"`);
      partsEn.push(`crop to "${cropSpec.cropNameEn}"`);
    }
    if (soilSpec.soilTexture) {
      const texAr =
        soilSpec.soilTexture === 'clay'
          ? 'طينية'
          : soilSpec.soilTexture === 'sandy'
          ? 'رملية'
          : soilSpec.soilTexture === 'calcareous'
          ? 'جيرية'
          : 'طميية صفراء';
      partsAr.push(`التربة إلى ${texAr}`);
      partsEn.push(`soil texture to ${soilSpec.soilTexture}`);
    }
    if (soilSpec.salinityEC !== undefined) {
      partsAr.push(`الملوحة EC إلى ${soilSpec.salinityEC} dS/m`);
      partsEn.push(`salinity EC to ${soilSpec.salinityEC} dS/m`);
    }
    if (soilSpec.ph !== undefined) {
      partsAr.push(`الحموضة pH إلى ${soilSpec.ph}`);
      partsEn.push(`soil pH to ${soilSpec.ph}`);
    }
    if (soilSpec.irrigation) {
      partsAr.push(`نظام الري إلى ${soilSpec.irrigation}`);
      partsEn.push(`irrigation to ${soilSpec.irrigation}`);
    }

    actions.push({
      type: 'UPDATE_ZONE_CONFIG',
      updates,
      summaryAr: `تم تحديث إعدادات الزونة النشطة (${partsAr.join('، ')})`,
      summaryEn: `Updated active zone settings (${partsEn.join(', ')})`,
    });
    if (!inlineWidgets.includes('zone_action_card')) {
      inlineWidgets.push('zone_action_card');
    }
  }

  // -------------------------------------------------------------------------
  // 3. DETECT SWITCH ACTIVE ZONE AMONG SAVED USER ZONES
  // -------------------------------------------------------------------------
  if (
    !explicitCreateZoneIntent &&
    context.zones &&
    context.zones.length > 1 &&
    (/(?:فعل|فعّل|اختار|اختر|بدل\s*إلى|انتقل\s*إلى|افتح|اعرض)\s*(?:ال)?(?:مزرعة|مزرعه|زونة|زونه|حقل|منطقة|منطقه)/i.test(
      normalizedPrompt
    ) ||
      /(?:switch\s+to|activate|select|open)\s+(?:zone|farm|plot)/i.test(normalizedPrompt))
  ) {
    let targetZone: UserStudyZone | undefined;
    if (/(?:الأولى|الاولى|أول|اول|رقم\s*1|first|zone\s*1)/i.test(normalizedPrompt)) {
      targetZone = context.zones[0];
    } else if (/(?:الثانية|التانية|ثاني|تاني|رقم\s*2|second|zone\s*2)/i.test(normalizedPrompt)) {
      targetZone = context.zones[1];
    } else if (/(?:الثالثة|التالتة|ثالث|تالت|رقم\s*3|third|zone\s*3)/i.test(normalizedPrompt)) {
      targetZone = context.zones[2];
    } else if (/(?:الأخيرة|الاخيرة|آخر|اخر|last|latest)/i.test(normalizedPrompt)) {
      targetZone = context.zones[context.zones.length - 1];
    } else {
      targetZone = context.zones.find(
        (z) =>
          (z.nameAr && normalizedPrompt.includes(z.nameAr)) ||
          (z.nameEn && q.includes(z.nameEn.toLowerCase()))
      );
    }

    if (targetZone && targetZone.id !== context.activeZoneId) {
      actions.push({
        type: 'SWITCH_ACTIVE_ZONE',
        zoneId: targetZone.id,
        summaryAr: `تم التبديل وتفعيل "${targetZone.nameAr}" (${targetZone.area.feddans} فدان)`,
        summaryEn: `Switched active farm to "${targetZone.nameEn}" (${targetZone.area.feddans} Feddans)`,
      });
    }
  }

  // -------------------------------------------------------------------------
  // 4. DETECT MAP LAYER SWITCH OR TAB NAVIGATION COMMANDS
  // -------------------------------------------------------------------------
  const mapLayerIntent =
    /(?:اعرض|افتح|وريني|شغل|غير|بدل|فعل|انتقل)\s*(?:لي\s*)?(?:إلى\s*|لـ\s*)?(?:طبقة|خريطة|مؤشر|وضع)/i.test(
      normalizedPrompt
    ) ||
    /(?:show|switch|open|display|activate)\s+(?:the\s+)?(?:map|layer|index|ndvi|ndwi|savi|lst|dem|wind|rain)/i.test(
      normalizedPrompt
    );

  if (mapLayerIntent) {
    let spectralLayer: SpectralIndexKey | undefined;
    let thematicLayer: ThematicMapLayerId | undefined;

    if (/\bndwi\b|مؤشر\s*المياه|اجهاد\s*مائي|إجهاد\s*مائي/i.test(q)) {
      spectralLayer = 'NDWI';
    } else if (/\bsavi\b|معدل\s*للتربة/i.test(q)) {
      spectralLayer = 'SAVI';
    } else if (/\bndmi\b/i.test(q)) {
      spectralLayer = 'NDMI';
    } else if (/\bevi\b/i.test(q)) {
      spectralLayer = 'EVI';
    } else if (/\blst\b|حرارة\s*السطح|الحراري/i.test(q)) {
      spectralLayer = 'LST';
      thematicLayer = 'temperature';
    } else if (/رطوبة\s*التربة\s*العميقة|7-28|sm_7_28/i.test(q)) {
      spectralLayer = 'SM_7_28';
      thematicLayer = 'soil_moisture';
    } else if (/رطوبة\s*التربة|soil\s*moisture|sm_0_7/i.test(q)) {
      spectralLayer = 'SM_0_7';
      thematicLayer = 'soil_moisture';
    } else if (/خريطة\s*الملوحة|طبقة\s*الملوحة|مؤشر\s*الملوحة|soil_ec/i.test(q)) {
      spectralLayer = 'SOIL_EC';
    } else if (/خريطة\s*الحموضة|طبقة\s*الحموضة|طبقة\s*ph|soil_ph/i.test(q)) {
      spectralLayer = 'SOIL_PH';
    } else if (/صرف|انحدار|تضاريس|dem/i.test(q)) {
      thematicLayer = 'dem_drainage';
    } else if (/رياح|wind/i.test(q)) {
      thematicLayer = 'wind';
    } else if (/أمطار|امطار|مطر|rainfall/i.test(q)) {
      thematicLayer = 'rainfall';
    } else if (/\bndvi\b|الغطاء\s*النباتي|الخضرة/i.test(q)) {
      spectralLayer = 'NDVI';
      thematicLayer = 'vegetation';
    } else if (/الطبيعي|قمر\s*صناعي\s*طبيعي|natural/i.test(q)) {
      thematicLayer = 'natural';
    }

    if (spectralLayer || thematicLayer) {
      const goToAtlas = /(?:على\s*الخريطة|في\s*الخريطة|افتح\s*الخريطة|on\s*map|open\s*atlas)/i.test(
        normalizedPrompt
      );
      actions.push({
        type: 'SWITCH_MAP_LAYER',
        spectralLayer,
        thematicLayer,
        navigateToAtlas: goToAtlas,
        summaryAr: `تم تفعيل طبقة ${spectralLayer || thematicLayer} على الخريطة${
          goToAtlas ? ' والانتقال إلى الخريطة الشاملة' : ''
        }`,
        summaryEn: `Activated ${spectralLayer || thematicLayer} layer${
          goToAtlas ? ' and opened Full-Screen Atlas' : ''
        }`,
      });
    }
  }

  // Explicit Tab Navigation (when user asks to open/navigate to one of the 5 main platform tabs)
  const navTabIntent =
    !/(?:رادار\s*الآفات|بطاقة|جدول)/i.test(normalizedPrompt) &&
    (/(?:افتح|انتقل\s*إلى|روح\s*(?:لـ|على|إلى)?|اعرض\s*(?:قسم|تبويب|صفحة|شاشة)|وديني)\s*(?:قسم|تبويب|صفحة|شاشة)?/i.test(
      normalizedPrompt
    ) ||
      /(?:navigate\s+to|go\s+to|open|switch\s+to)\s+(?:the\s+)?(?:tab|page|view|section|atlas|indices|weather|crops)/i.test(
        normalizedPrompt
      ));

  if (navTabIntent && !actions.some((a) => a.type === 'SWITCH_MAP_LAYER' && a.navigateToAtlas)) {
    if (/(?:الخريطة\s*الشاملة|صفحة\s*الخريطة|قسم\s*الخريطة|full-?screen\s*atlas|\batlas\s*tab\b|\bgo\s+to\s+map\b)/i.test(q)) {
      actions.push({
        type: 'NAVIGATE_TAB',
        tabId: 'atlas',
        summaryAr: 'تم الانتقال فوراً إلى تبويب الخريطة الشاملة',
        summaryEn: 'Navigated to Full-Screen Atlas tab',
      });
    } else if (/(?:تحليل\s*المؤشرات|قسم\s*المؤشرات|تبويب\s*المؤشرات|صفحة\s*المؤشرات|spectral\s*indices\s*tab|\bindices\s*tab\b)/i.test(q)) {
      actions.push({
        type: 'NAVIGATE_TAB',
        tabId: 'indices',
        summaryAr: 'تم الانتقال فوراً إلى تبويب تحليل المؤشرات الطيفية',
        summaryEn: 'Navigated to Spectral Indices tab',
      });
    } else if (/(?:الأمطار\s*والتنبؤ|قسم\s*الطقس|تبويب\s*الطقس|صفحة\s*الطقس|الأمطار\s*والطقس|weather\s*tab|forecast\s*tab|climate\s*tab)/i.test(q)) {
      actions.push({
        type: 'NAVIGATE_TAB',
        tabId: 'weather',
        summaryAr: 'تم الانتقال فوراً إلى تبويب الأمطار والتنبؤ الجوي',
        summaryEn: 'Navigated to Rain & Climate AI tab',
      });
    } else if (/(?:التوصيات\s*والدورة|توصيات\s*المحاصيل|قسم\s*المحاصيل|تبويب\s*المحاصيل|صفحة\s*المحاصيل|الدورة\s*الزراعية|crops\s*tab|rotation\s*tab)/i.test(q)) {
      actions.push({
        type: 'NAVIGATE_TAB',
        tabId: 'crops',
        summaryAr: 'تم الانتقال فوراً إلى تبويب التوصيات والدورة الزراعية',
        summaryEn: 'Navigated to Best Crops & Rotation tab',
      });
    }
  }

  // Delete zone command (all, active, first, last, or matching saved zone name)
  if (
    /(?:احذف|امسح|إزالة|ازالة|حذف|شيل)\s*(?:لي\s*)?(?:كل\s*|جميع\s*)?(?:ال)?(?:زونة|زونه|زونات|منطقة|منطقه|مناطق|مزرعة|مزرعه|مزارع|حقل|حقول)/i.test(
      normalizedPrompt
    ) ||
    /(?:delete|remove|clear|erase)\s+(?:all\s+|the\s+|first\s+|last\s+|active\s+)?(?:zone|zones|farm|farms|plot|plots)/i.test(
      normalizedPrompt
    )
  ) {
    const clearAll = /(?:كل|جميع|\ball\b)/i.test(normalizedPrompt);
    let targetZoneId: string | undefined = context.activeZoneId || undefined;
    let targetLabelAr = 'الزونة الزراعية النشطة';
    let targetLabelEn = 'active study zone';

    if (!clearAll && context.zones && context.zones.length > 0) {
      let matchedZone: UserStudyZone | undefined;
      if (/(?:الأولى|الاولى|أول|اول|\bfirst\b)/i.test(normalizedPrompt)) {
        matchedZone = context.zones[0];
      } else if (/(?:الثانية|التانية|ثاني|تاني|\bsecond\b)/i.test(normalizedPrompt)) {
        matchedZone = context.zones[1];
      } else if (/(?:الأخيرة|الاخيرة|آخر|اخر|\blast\b|\blatest\b)/i.test(normalizedPrompt)) {
        matchedZone = context.zones[context.zones.length - 1];
      } else {
        matchedZone = context.zones.find(
          (z) =>
            (z.nameAr && normalizedPrompt.includes(z.nameAr)) ||
            (z.nameEn && q.includes(z.nameEn.toLowerCase()))
        );
        if (!matchedZone) {
          const regionHit = matchAgroRegionFromText(normalizedPrompt);
          if (regionHit) {
            matchedZone = context.zones.find((z) =>
              regionHit.keywordsAr.some((kw) => z.nameAr.includes(kw)) ||
              regionHit.keywordsEn.some((kw) => z.nameEn.toLowerCase().includes(kw.toLowerCase()))
            );
          }
        }
      }
      if (matchedZone) {
        targetZoneId = matchedZone.id;
        targetLabelAr = `"${matchedZone.nameAr}"`;
        targetLabelEn = `"${matchedZone.nameEn}"`;
      }
    }

    actions.push({
      type: 'DELETE_ZONE',
      zoneId: clearAll ? undefined : targetZoneId,
      clearAll,
      summaryAr: clearAll
        ? 'تم مسح جميع الزونات الزراعية المسجلة'
        : `تم حذف ${targetLabelAr}`,
      summaryEn: clearAll
        ? 'Cleared all registered study zones'
        : `Deleted ${targetLabelEn}`,
    });
  }

  // Rename zone command
  const renameZoneMatch =
    normalizedPrompt.match(
      /(?:غير\s*اسم|غيّر\s*اسم|عدل\s*اسم|بدل\s*اسم|سمي|سمّي)\s*(?:المزرعة|الزونة|الحقل|المنطقة)?\s*(?:الحالية\s*|النشطة\s*)?(?:إلى|الى|لـ|ل|باسم)?\s*["«']?([^"»'\n]{2,160})["»']?/i
    ) ||
    normalizedPrompt.match(
      /(?:rename)\s+(?:active\s+|current\s+|the\s+)?(?:zone|farm|plot)\s+(?:to|as)\s+["']?([^"'\n]{2,160})["']?/i
    );
  if (renameZoneMatch && !explicitCreateZoneIntent) {
    const newName = trimCompoundClause(renameZoneMatch[1]);
    if (newName.length >= 2) {
      actions.push({
        type: 'RENAME_ZONE',
        zoneId: context.activeZoneId || undefined,
        newNameAr: newName,
        newNameEn: newName,
        summaryAr: `تم تغيير اسم المزرعة النشطة إلى "${newName}"`,
        summaryEn: `Renamed active farm to "${newName}"`,
      });
    }
  }

  // Clear temporary drawn polygon vertices
  if (
    /(?:امسح|احذف|الغي|ألغِ|صفر|أعد\s*رسم)\s*(?:لي\s*)?(?:النقاط|النقط|الحدود\s*المرسومة|المضلع\s*المرسوم|الرسم\s*المؤقت)/i.test(
      normalizedPrompt
    ) ||
    /(?:clear|reset|erase)\s+(?:the\s+)?(?:drawn\s+)?(?:polygon|vertices|boundary\s*points|drawing)/i.test(
      normalizedPrompt
    )
  ) {
    actions.push({
      type: 'CLEAR_DRAWN_VERTICES',
      summaryAr: 'تم مسح نقاط الحدود المرسومة من على الخريطة',
      summaryEn: 'Cleared drawn polygon boundary points',
    });
  }

  // Add weekly checklist task
  const addTaskMatch =
    normalizedPrompt.match(
      /(?:أضف|اضف|ضيف|زود|سجل|انشئ|أنشئ)\s*(?:لي\s*)?(?:مهمة|مهمه|تاسك|نشاط\s*أسبوعي|task|to-?do)(?:\s*(?:جديدة|جديده|أسبوعية|اسبوعية|بعنوان))*\s*[:\-]?\s*(.+)$/i
    ) ||
    normalizedPrompt.match(
      /(?:add|create)\s+(?:a\s+)?(?:new\s+)?(?:weekly\s+)?(?:task|checklist\s*item|to-?do)\s*[:\-]?\s*(.+)$/i
    );
  const taskTitle = addTaskMatch ? trimCompoundClause(addTaskMatch[1]) : '';
  if (taskTitle.length >= 2) {
    actions.push({
      type: 'ADD_CHECKLIST_TASK',
      titleAr: taskTitle,
      titleEn: taskTitle,
      category: /ري|سقاية|irrig/i.test(taskTitle)
        ? 'irrigation'
        : /سماد|تسميد|npk|fert/i.test(taskTitle)
        ? 'fertilization'
        : /تربة|ملوحة|soil/i.test(taskTitle)
        ? 'soil'
        : 'scouting',
      priority: 'high',
      dayAr: 'اليوم / قريباً',
      dayEn: 'Today / Upcoming',
      summaryAr: `تمت إضافة مهمة أسبوعية: "${taskTitle}"`,
      summaryEn: `Added weekly task: "${taskTitle}"`,
    });
    if (!inlineWidgets.includes('weekly_checklist')) {
      inlineWidgets.push('weekly_checklist');
    }
  }

  // Delete weekly checklist task(s)
  const deleteTaskMatch =
    normalizedPrompt.match(
      /(?:امسح|احذف|شيل|أزل|ازل)\s*(?:كل\s*|جميع\s*)?(?:مهام\s*الأسبوع|مهام\s*الاسبوع|المهام|قائمة\s*المهام|مهمة|مهمه|تاسك)\s*[:\-]?\s*(.*)$/i
    ) ||
    normalizedPrompt.match(
      /(?:delete|remove|clear)\s+(?:all\s+)?(?:weekly\s+)?(?:tasks?|checklist(?:\s+items?)?)\s*[:\-]?\s*(.*)$/i
    );
  if (deleteTaskMatch) {
    const rawTail = (deleteTaskMatch[1] || '').trim();
    const tail = trimCompoundClause(rawTail);
    const clearAll =
      /^(?:كل|جميع|الكل|كلها|\ball\b)$/i.test(tail) ||
      (/(?:امسح|احذف|شيل|أزل|ازل)\s*(?:كل|جميع)\s*(?:مهام|المهام|قائمة\s*المهام)/i.test(
        normalizedPrompt
      ) &&
        tail === '') ||
      tail === '';
    actions.push({
      type: 'DELETE_CHECKLIST_TASK',
      ...(clearAll ? { clearAll: true } : { matchText: tail, clearAll: false }),
      summaryAr: clearAll
        ? 'تم مسح جميع المهام الأسبوعية'
        : `تم حذف المهمة "${tail}"`,
      summaryEn: clearAll
        ? 'Cleared all weekly checklist tasks'
        : `Deleted checklist task "${tail}"`,
    });
  }

  // Complete / toggle checklist task
  if (
    /(?:أنجز|انجز|خلص|علم\s*على|تمم|اكمل|أكمل)\s*(?:كل\s*|جميع\s*)?(?:المهام|مهام\s*الأسبوع|مهمة)/i.test(
      normalizedPrompt
    ) ||
    /(?:complete|check\s*off|finish|mark\s*done)\s+(?:all\s+)?(?:weekly\s+)?(?:tasks?|checklist)/i.test(
      normalizedPrompt
    )
  ) {
    const markAll = /(?:كل|جميع|\ball\b)/i.test(normalizedPrompt);
    actions.push({
      type: 'TOGGLE_CHECKLIST_TASK',
      completed: true,
      markAll,
      summaryAr: markAll ? 'تم تحديد جميع المهام الأسبوعية كمكتملة' : 'تم تحديث حالة المهمة كمكتملة',
      summaryEn: markAll ? 'Marked all weekly tasks completed' : 'Marked checklist task completed',
    });
    if (!inlineWidgets.includes('weekly_checklist')) {
      inlineWidgets.push('weekly_checklist');
    }
  }

  // Log pest incident
  if (
    /(?:سجل|أضف|اضف|ضيف|ثبت|بلغ\s*عن)\s*(?:لي\s*)?(?:بؤرة|بؤره|إصابة|اصابة|آفة|حالة\s*آفة)/i.test(
      normalizedPrompt
    ) ||
    /(?:log|add|pin|record|report)\s+(?:a\s+)?(?:pest\s+)?(?:incident|outbreak|hotspot)/i.test(
      normalizedPrompt
    )
  ) {
    let pestId = 'fall_armyworm';
    if (/صدأ|rust/i.test(q)) pestId = 'yellow_rust';
    else if (/ندوة|blight/i.test(q)) pestId = 'late_blight';
    else if (/منّ|aphid/i.test(q)) pestId = 'aphids_virus';
    else if (/نيماتود|nematode/i.test(q)) pestId = 'root_knot_nematode';
    else if (/توتا|ذبابة|whitefly|tuta/i.test(q)) pestId = 'tuta_whitefly';

    const szMatch = normalizedPrompt.match(/(?:زونا|zone|sector)\s*([abcABC])\b/i);
    const subZoneId = (szMatch ? szMatch[1].toUpperCase() : 'A') as 'A' | 'B' | 'C';
    actions.push({
      type: 'LOG_PEST_INCIDENT',
      pestId,
      subZoneId,
      severity: /حرج|خطير|شديد|critical/i.test(q) ? 'critical' : 'high',
      notes: normalizedPrompt.slice(0, 120),
      summaryAr: `تم تثبيت بؤرة آفة (${pestId}) في زونا ${subZoneId}`,
      summaryEn: `Pinned pest incident (${pestId}) in Sub-Zone ${subZoneId}`,
    });
    if (!inlineWidgets.includes('pest_radar')) {
      inlineWidgets.push('pest_radar');
    }
  }

  // Delete pest incidents
  if (
    /(?:امسح|احذف|شيل|أزل)\s*(?:كل\s*|جميع\s*)?(?:البؤر|بؤر\s*الآفات|إصابات\s*الآفات|بؤرة\s*الآفة)/i.test(
      normalizedPrompt
    ) ||
    /(?:delete|clear|remove)\s+(?:all\s+)?(?:pest\s+)?(?:incidents?|outbreaks?|hotspots?)/i.test(
      normalizedPrompt
    )
  ) {
    const clearAll = /(?:كل|جميع|\ball\b|البؤر)/i.test(normalizedPrompt);
    actions.push({
      type: 'DELETE_PEST_INCIDENT',
      clearAll,
      summaryAr: clearAll ? 'تم مسح جميع بؤر الآفات المسجلة' : 'تم حذف أحدث بؤرة آفة مسجلة',
      summaryEn: clearAll ? 'Cleared all logged pest incidents' : 'Deleted latest pest incident',
    });
  }

  // Optimize crop rotation
  if (
    /(?:حسن|حسّن|رتب|اضبط|اعمل\s*تحسين)\s*(?:لي\s*)?(?:الدورة\s*الزراعية|التناوب)/i.test(
      normalizedPrompt
    ) ||
    /(?:auto[\s-]?optimize|optimize)\s+(?:crop\s+)?rotation/i.test(normalizedPrompt)
  ) {
    const szMatch = normalizedPrompt.match(/(?:زونا|zone)\s*([abcABC])\b/i);
    const subZoneId = (szMatch ? szMatch[1].toUpperCase() : 'ALL') as 'A' | 'B' | 'C' | 'ALL';
    actions.push({
      type: 'OPTIMIZE_ROTATION',
      subZoneId,
      summaryAr:
        subZoneId === 'ALL'
          ? 'تم تحسين الدورة الزراعية تلقائياً لكل الزونات (A/B/C)'
          : `تم تحسين الدورة الزراعية تلقائياً لزونا ${subZoneId}`,
      summaryEn: `Auto-optimized crop rotation for ${subZoneId}`,
    });
  }

  // Theme control (Dark / Light mode)
  if (
    /(?:وضع\s*ال?ليلي|دارك\s*مود|مظهر\s*ال?داكن|dark\s*mode|night\s*mode)/i.test(normalizedPrompt) &&
    /(?:شغل|افتح|فعل|حول|بدل|ارجع|رجع|عد|خلي|اقفل|اطفي|الغي|enable|turn\s*on|switch|disable|turn\s*off|toggle|back\s*to)/i.test(
      normalizedPrompt
    )
  ) {
    const turnOff = /(?:اقفل|اطفي|الغي|أوقف|ايقاف|disable|turn\s*off)/i.test(normalizedPrompt);
    actions.push({
      type: 'SET_THEME',
      darkMode: !turnOff,
      summaryAr: turnOff ? 'تم إيقاف الوضع الليلي وتفعيل الوضع النهاري' : 'تم تفعيل الوضع الليلي (Dark Mode)',
      summaryEn: turnOff ? 'Disabled Dark Mode (Light Mode)' : 'Enabled Dark Mode',
    });
  } else if (
    /(?:وضع\s*ال?نهاري|وضع\s*ال?فاتح|لايت\s*مود|light\s*mode|day\s*mode)/i.test(normalizedPrompt) &&
    /(?:شغل|افتح|فعل|حول|ارجع|رجع|عد|خلي|بدل|enable|switch|turn\s*on|back\s*to|restore)/i.test(
      normalizedPrompt
    )
  ) {
    actions.push({
      type: 'SET_THEME',
      darkMode: false,
      summaryAr: 'تم تفعيل الوضع النهاري (Light Mode)',
      summaryEn: 'Enabled Light Mode',
    });
  }

  // Language switch
  if (
    /(?:حول|غير|بدل|خلي)\s*(?:لغة\s*)?(?:الموقع|التطبيق|الشات|الواجهة)?\s*(?:إلى\s*|الى\s*|لـ\s*)?(?:الإنجليزي|الانجليزي|إنجليزي|انجليزي|english)/i.test(
      normalizedPrompt
    ) ||
    /(?:switch|change|set)\s+(?:app\s+|site\s+)?language\s+(?:to\s+)?english/i.test(normalizedPrompt)
  ) {
    actions.push({
      type: 'SET_LANGUAGE',
      language: 'en',
      summaryAr: 'تم تحويل لغة التطبيق إلى الإنجليزية',
      summaryEn: 'Switched application language to English',
    });
  } else if (
    /(?:حول|غير|بدل|خلي)\s*(?:لغة\s*)?(?:الموقع|التطبيق|الشات|الواجهة)?\s*(?:إلى\s*|الى\s*|لـ\s*)?(?:العربي|عربي|العربية|arabic)/i.test(
      normalizedPrompt
    ) ||
    /(?:switch|change|set)\s+(?:app\s+|site\s+)?language\s+(?:to\s+)?arabic/i.test(normalizedPrompt)
  ) {
    actions.push({
      type: 'SET_LANGUAGE',
      language: 'ar',
      summaryAr: 'تم تحويل لغة التطبيق إلى العربية',
      summaryEn: 'Switched application language to Arabic',
    });
  }

  // Weather refresh
  if (
    /(?:حدث|تحديث|اعمل\s*تحديث)\s*(?:بيانات\s*)?(?:الطقس|الأرصاد|الجو|الأمطار)/i.test(
      normalizedPrompt
    ) ||
    /(?:refresh|sync|update)\s+(?:live\s+)?(?:weather|forecast)/i.test(normalizedPrompt)
  ) {
    actions.push({
      type: 'REFRESH_WEATHER',
      summaryAr: 'تم تحديث توقعات الطقس والأمطار الحية من الأقمار الصناعية',
      summaryEn: 'Refreshed live satellite weather & rain telemetry',
    });
  }

  // Clear chat
  if (
    /(?:امسح|احذف|نظف|صفر)\s*(?:سجل\s*)?(?:الشات|المحادثة|المحادثات|الدردشة)/i.test(
      normalizedPrompt
    ) ||
    /(?:clear|reset|wipe)\s+(?:the\s+)?(?:chat|conversation|messages)/i.test(normalizedPrompt)
  ) {
    actions.push({
      type: 'CLEAR_CHAT',
      summaryAr: 'تم مسح سجل المحادثة وبدء جلسة جديدة',
      summaryEn: 'Cleared chat history',
    });
  }

  // PDF Report export command
  if (
    /(?:حمل|تحميل|تصدير|استخراج|اطبع|نزل|أصدر)\s*(?:لي\s*)?(?:تقرير|ملف)?\s*(?:pdf|بي\s*دي\s*اف|التقرير\s*الميداني|تقرير\s*المزرعة|التقرير)/i.test(
      normalizedPrompt
    ) ||
    /(?:download|export|generate|print)\s+(?:the\s+)?(?:field\s+|farm\s+)?(?:pdf\s+)?report/i.test(
      normalizedPrompt
    )
  ) {
    actions.push({
      type: 'EXPORT_PDF_REPORT',
      summaryAr: 'تم توليد وتحميل التقرير الهندسي الشامل (PDF) للزونة النشطة',
      summaryEn: 'Generated and downloaded comprehensive PDF field report',
    });
  }

  // -------------------------------------------------------------------------
  // 5. DETECT ON-DEMAND INLINE ANALYTICAL WIDGETS (ONLY WHEN REQUESTED!)
  // -------------------------------------------------------------------------
  if (
    /(?:آف|افات|آفات|حشر|فطر|مرض|امراض|أمراض|دودة|صدأ|ندوة|منّ|رادار\s*الآفات|دبابيس|pest|disease|blight|rust|armyworm|bollworm|ipm)/i.test(
      q
    )
  ) {
    inlineWidgets.push('pest_radar');
  }

  if (
    /(?:خطة\s*العمل|مهام\s*الأسبوع|مهام\s*الاسبوع|جدول\s*الأعمال|قائمة\s*المهام|الأولويات\s*الميدانية|checklist|weekly\s*plan|weekly\s*tasks|action\s*plan)/i.test(
      q
    )
  ) {
    inlineWidgets.push('weekly_checklist');
  }

  if (
    /(?:مؤشر|مؤشرات|طيفي|\bndvi\b|\bndwi\b|\bsavi\b|\bevi\b|\blst\b|زونا\s*a|زونا\s*b|زونا\s*c|الجزء\s*الشمالي|تباين|spectral|sub-?zone)/i.test(
      q
    )
  ) {
    inlineWidgets.push('spectral_subzones');
  }

  if (
    /(?:تسميد|سماد|\bnpk\b|نيتروجين|أزوت|بوتاسيوم|فوسفور|يوريا|نترات|برنامج\s*التسميد|جدول\s*التسميد|fertig|fertiliz|nutrient)/i.test(
      q
    )
  ) {
    inlineWidgets.push('irrigation_npk');
  }

  if (
    /(?:أفضل\s*محصول|افضل\s*محصول|أحسن\s*محصول|احسن\s*محصول|توصيات\s*المحاصيل|مقارنة\s*المحاصيل|دورة\s*زراعية|ماذا\s*أزرع|ايه\s*احسن\s*محصول|إيه\s*أحسن\s*محصول|best\s*crop|crop\s*recommend|what\s*to\s*plant)/i.test(
      q
    )
  ) {
    inlineWidgets.push('crop_mcda');
  }

  // -------------------------------------------------------------------------
  // 6. COMPOSE FAST EXECUTIVE-SUMMARY DATA-GROUNDED RESPONSE (GeoAgri ai)
  // -------------------------------------------------------------------------
  const createZoneAction = actions.find((a) => a.type === 'CREATE_ZONE');
  const updateConfigAction = actions.find((a) => a.type === 'UPDATE_ZONE_CONFIG');

  if (createZoneAction && createZoneAction.type === 'CREATE_ZONE') {
    const zd = createZoneAction.zoneDraft;
    const areaCalc = calculateGeodesicArea(zd.vertices);
    const dbCrop = CROP_DATABASE.find((c) => c.id === zd.cropId) || CROP_DATABASE[0];
    const cropLabelAr = zd.customCropLabel || dbCrop.nameAr;
    const cropLabelEn = zd.customCropLabel || dbCrop.nameEn;
    const texAr =
      zd.soilTexture === 'clay'
        ? 'طينية ثقيلة'
        : zd.soilTexture === 'sandy'
        ? 'رملية خفيفة'
        : zd.soilTexture === 'calcareous'
        ? 'جيرية كلسية'
        : 'طميية صفراء';

    const extraActionsAr = actions
      .filter((a) => a !== createZoneAction)
      .map((a) => `✅ ${a.summaryAr}`)
      .join(' · ');
    const extraActionsEn = actions
      .filter((a) => a !== createZoneAction)
      .map((a) => `✅ ${a.summaryEn}`)
      .join(' · ');

    const replyAr = `✅ **ملخص تنفيذي (GeoAgri ai) — تم إنشاء وتفعيل "${zd.nameAr}" وحفظها بحسابك:**
• **الموقع والمساحة:** \`${zd.centroid.lat.toFixed(4)}°N, ${zd.centroid.lng.toFixed(4)}°E\` · **${areaCalc.feddans} فدان و${areaCalc.qirats} قيراط** (${areaCalc.hectares} هكتار).
• **التربة والري:** قوام **${texAr}** · ملوحة **EC ${zd.salinityEC} dS/m** · حموضة **pH ${zd.ph}** · نظام ري **${zd.irrigation === 'drip' ? 'تنقيط' : zd.irrigation === 'pivot' ? 'بيفوت محوري' : zd.irrigation === 'sprinkler' ? 'رش' : zd.irrigation === 'flood' ? 'غمر' : 'مطري'}**.
• **المحصول والإنتاجية المستهدفة:** **${cropLabelAr}** · نافذة الزراعة (**${dbCrop.optimalPlantingStartAr} – ${dbCrop.optimalPlantingEndAr}**) · إنتاجية متوقعة **${dbCrop.potentialYieldTonPerFeddan} طن/فدان** (إجمالي **${(dbCrop.potentialYieldTonPerFeddan * areaCalc.totalFeddansDecimal).toFixed(1)} طن**).${extraActionsAr ? `\n• **إجراءات إضافية منفذة:** ${extraActionsAr}` : ''}
• **التوصية المباشرة:** تم تقسيم الأرض إلى (زونا A، B، C)؛ اضغط **"عرض على الخريطة الشاملة"** بالبطاقة أدناه أو اطلب جدول التسميد NPK والري الفوري.`;

    const replyEn = `✅ **Executive Summary (GeoAgri ai) — Created & Activated "${zd.nameEn}":**
• **Location & Area:** \`${zd.centroid.lat.toFixed(4)}°N, ${zd.centroid.lng.toFixed(4)}°E\` · **${areaCalc.feddans} Feddans, ${areaCalc.qirats} Qirats** (${areaCalc.hectares} ha).
• **Soil & Irrigation:** **${zd.soilTexture}** soil · Salinity **EC ${zd.salinityEC} dS/m** · **pH ${zd.ph}** · Irrigation: **${zd.irrigation}**.
• **Crop & Target Yield:** **${cropLabelEn}** (${dbCrop.optimalPlantingStartEn} – ${dbCrop.optimalPlantingEndEn}) · Target **${dbCrop.potentialYieldTonPerFeddan} t/fed** (**${(dbCrop.potentialYieldTonPerFeddan * areaCalc.totalFeddansDecimal).toFixed(1)} tons** total).${extraActionsEn ? `\n• **Additional Actions Executed:** ${extraActionsEn}` : ''}
• **Direct Recommendation:** Sub-zones A, B, and C are calibrated. Click **"View on Full-Screen Atlas"** below or request NPK and irrigation schedules.`;

    return {
      actions,
      inlineWidgets,
      metricsCited: Array.from(metricsCited),
      deterministicReplyText: isAr ? replyAr : replyEn,
    };
  }

  if (updateConfigAction && updateConfigAction.type === 'UPDATE_ZONE_CONFIG') {
    const nextCropId = updateConfigAction.updates.cropId || context.currentCropId;
    const dbCrop = CROP_DATABASE.find((c) => c.id === nextCropId) || CROP_DATABASE[0];
    const nextSoil: SoilProfile = {
      ...context.soil,
      ...(updateConfigAction.updates.soilTexture
        ? { texture: updateConfigAction.updates.soilTexture }
        : {}),
      ...(updateConfigAction.updates.salinityEC !== undefined
        ? { salinityEC: updateConfigAction.updates.salinityEC }
        : {}),
      ...(updateConfigAction.updates.ph !== undefined ? { ph: updateConfigAction.updates.ph } : {}),
      ...(updateConfigAction.updates.irrigation
        ? { irrigation: updateConfigAction.updates.irrigation }
        : {}),
    };
    const growth = calculateGrowthStageAndGDD(
      nextCropId,
      '2026-10-15',
      context.farmAverages.NDVI
    );
    const npk = calculateFourWeekNpkSchedule({
      cropId: nextCropId,
      soilTexture: nextSoil.texture,
      soilPh: nextSoil.ph,
      salinityEC: nextSoil.salinityEC,
      irrigation: nextSoil.irrigation,
      accumulatedGDD: growth.accumulatedGDD,
      areaFeddans: Math.max(1, context.area.totalFeddansDecimal),
    });

    const replyAr = `✅ **ملخص تنفيذي (GeoAgri ai) — ${updateConfigAction.summaryAr} في (${context.zoneNameAr || 'مزرعتك'}):**
• **المحصول والمعامل المائي:** **${updateConfigAction.updates.customCropLabel || dbCrop.nameAr}** · المساحة **${context.area.feddans} فدان و${context.area.qirats} قيراط** · معامل المحصول **Kc = ${growth.cropCoefficientKc}** · عمق الجذور **${growth.rootDepthCm} سم**.
• **اتزان الملوحة والتربة:** ملوحة **EC ${nextSoil.salinityEC} dS/m** مقابل حد تحمل المحصول (**${dbCrop.maxSalinityEC} dS/m**) · الحموضة **pH ${nextSoil.ph}**.
• **الميزانية السمادية (4 أسابيع/فدان):** **${npk.total4WeekPureNPerFeddan} كجم N** · **${npk.total4WeekPureP2O5PerFeddan} كجم P₂O₅** · **${npk.total4WeekPureK2OPerFeddan} كجم K₂O**.
• **التوصية المباشرة:** ${
      nextSoil.salinityEC > dbCrop.maxSalinityEC
        ? `أضف 15% مقنن غسيل ملحي مع حقن حامض الفوسفوريك لتفادي خصم إنتاجي قدره ${((nextSoil.salinityEC - dbCrop.maxSalinityEC) * dbCrop.ecSlopePctPerDsm).toFixed(1)}%.`
        : 'الملوحة ضمن النطاق الآمن؛ التزم بجدول الري والتسميد الأسبوعي لتحقيق أقصى إنتاجية.'
    }`;

    const replyEn = `✅ **Executive Summary (GeoAgri ai) — ${updateConfigAction.summaryEn} (${context.zoneNameEn || 'Study Zone'}):**
• **Active Crop & Kc:** **${updateConfigAction.updates.customCropLabel || dbCrop.nameEn}** · **${context.area.feddans} Fed, ${context.area.qirats} Qirats** · **Kc = ${growth.cropCoefficientKc}** · Root depth **${growth.rootDepthCm} cm**.
• **Salinity & Soil Balance:** Soil EC **${nextSoil.salinityEC} dS/m** vs threshold **${dbCrop.maxSalinityEC} dS/m** · **pH ${nextSoil.ph}**.
• **4-Week Net NPK/Feddan:** **${npk.total4WeekPureNPerFeddan} kg N** · **${npk.total4WeekPureP2O5PerFeddan} kg P₂O₅** · **${npk.total4WeekPureK2OPerFeddan} kg K₂O**.
• **Direct Recommendation:** ${
      nextSoil.salinityEC > dbCrop.maxSalinityEC
        ? 'Apply a +15% leaching fraction and phosphoric acid injection to prevent salinity yield loss.'
        : 'Salinity is within safe tolerance; maintain scheduled fertigation.'
    }`;

    return {
      actions,
      inlineWidgets,
      metricsCited: [
        `Soil EC ${nextSoil.salinityEC} dS/m`,
        `pH ${nextSoil.ph}`,
        `Crop ${dbCrop.nameEn}`,
      ],
      deterministicReplyText: isAr ? replyAr : replyEn,
    };
  }

  // Deep analytical response for active zones or general questions
  const deepReply = buildDeepAnalyticalReplyForQuery(normalizedPrompt, context, actions, inlineWidgets);
  if (context.hasActiveZones) {
    metricsCited.add(`NDVI ${context.farmAverages.NDVI}`);
    metricsCited.add(`NDWI ${context.farmAverages.NDWI}`);
    metricsCited.add(`LST ${context.farmAverages.LST}°C`);
    metricsCited.add(`EC ${context.soil.salinityEC} dS/m`);
    metricsCited.add(`${context.area.feddans} Feddans`);
  }

  return {
    actions,
    inlineWidgets,
    metricsCited: Array.from(metricsCited),
    deterministicReplyText: deepReply,
  };
}

function buildDeepAnalyticalReplyForQuery(
  normalizedPrompt: string,
  context: {
    language: Language;
    hasActiveZones: boolean;
    zoneNameAr: string;
    zoneNameEn: string;
    centroid: LatLon;
    currentCropId: string;
    customCropLabel?: string;
    area: AreaBreakdown;
    soil: SoilProfile;
    farmAverages: Record<SpectralIndexKey, number>;
    subZones: SubZoneSummary[];
    forecast14: DailyWeatherPoint[];
    topCrops: ScoredCropRecommendation[];
    zones?: UserStudyZone[];
  },
  actions: AdvisorSiteAction[],
  inlineWidgets: AdvisorInlineWidgetType[]
): string {
  const q = normalizedPrompt.toLowerCase();
  const isAr = context.language === 'ar';

  const actionHeaderAr =
    actions.length > 0
      ? `✅ **تنفيذ فوري (GeoAgri ai):** ${actions.map((a) => a.summaryAr).join(' | ')}\n\n`
      : '';
  const actionHeaderEn =
    actions.length > 0
      ? `✅ **Instant Execution (GeoAgri ai):** ${actions.map((a) => a.summaryEn).join(' | ')}\n\n`
      : '';

  // If user has no zones yet, confirm executed site actions cleanly first, or provide concise guidance
  if (!context.hasActiveZones || context.subZones.length < 3 || context.area.totalFeddansDecimal <= 0) {
    if (actions.length > 0 && inlineWidgets.length === 0) {
      return isAr
        ? `${actionHeaderAr}تم تنفيذ أمرك بنجاح في المنصة. يمكنك الاستمرار بأي أمر آخر (إضافة مزرعة، تعديل إعدادات، إدارة مهام، أو تغيير المظهر).`
        : `${actionHeaderEn}Your command has been executed across the platform. You can issue any further command at any time.`;
    }
    const baseGeneral = generateLocalAgronomistResponse(normalizedPrompt, {
      ...context,
      hasUserZones: false,
    });
    const agenticHintAr = `\n\n💡 **تحكم فوري عبر GeoAgri ai:** اطلب مني مباشرة إضافة مزرعتك أو تنفيذ أي أمر (مثال: *"أضف مزرعة في أسيوط 30 فدان قمح"* أو *"ضيف مهمة فحص الري"*).`;
    const agenticHintEn = `\n\n💡 **Instant GeoAgri ai Control:** Command me directly to add a farm zone, manage tasks, or control any setting.`;
    return (isAr ? actionHeaderAr : actionHeaderEn) + baseGeneral + (isAr ? agenticHintAr : agenticHintEn);
  }

  const activeCrop =
    CROP_DATABASE.find((c) => c.id === context.currentCropId) || CROP_DATABASE[0];
  const cropDisplayNameAr = context.customCropLabel || activeCrop.nameAr;
  const cropDisplayNameEn = context.customCropLabel || activeCrop.nameEn;
  const growthStage: GrowthStageInfo = calculateGrowthStageAndGDD(
    context.currentCropId,
    '2026-10-15',
    context.farmAverages.NDVI
  );
  const npkSchedule: FourWeekNpkSchedule = calculateFourWeekNpkSchedule({
    cropId: context.currentCropId,
    soilTexture: context.soil.texture,
    soilPh: context.soil.ph,
    salinityEC: context.soil.salinityEC,
    irrigation: context.soil.irrigation,
    accumulatedGDD: growthStage.accumulatedGDD,
    areaFeddans: Math.max(1, context.area.totalFeddansDecimal),
  });
  const pestRisks: RegionalPestRiskWarning[] = evaluateRegionalPestRisks(
    context.centroid,
    context.soil,
    context.forecast14,
    context.currentCropId,
    context.farmAverages
  );

  const zoneA = context.subZones[0];
  const zoneB = context.subZones[1] || context.subZones[0];
  const zoneC = context.subZones[2] || context.subZones[0];
  const bestCrop = context.topCrops[0];
  const secondCrop = context.topCrops[1] || context.topCrops[0];

  const deletedAllOrOnlyZone = actions.some(
    (a) =>
      a.type === 'DELETE_ZONE' &&
      (a.clearAll || !context.zones || context.zones.length <= 1)
  );
  if (deletedAllOrOnlyZone) {
    return isAr
      ? `${actionHeaderAr}تم تنفيذ أمرك بنجاح في المنصة. يمكنك الآن رسم زونة جديدة أو طلب إنشاء مزرعة في أي وقت.`
      : `${actionHeaderEn}Your command has been executed across the platform. You can draw or create a new study zone at any time.`;
  }

  // If pure command action was executed without a specific agronomic question
  const hasAgronomicQuestion =
    /(?:^|[\s،؟?])(?:ما|ماذا|كيف|لماذا|امتى|متى|هل|كم|تحليل|تشخيص|تسميد|الري|سقاية|مطر|أمطار|محصول|آفات|what|how|why|when|should)(?=$|[\s،؟?])/i.test(
      normalizedPrompt
    );
  if (actions.length > 0 && inlineWidgets.length === 0 && !hasAgronomicQuestion) {
    return isAr
      ? `${actionHeaderAr}• **المزرعة النشطة:** **${context.zoneNameAr}** (**${context.area.feddans} فدان و${context.area.qirats} قيراط** — المحصول: **${cropDisplayNameAr}**).\n• **المؤشرات الحية:** NDVI **${context.farmAverages.NDVI}** · NDWI **${context.farmAverages.NDWI}** · حرارة الأوراق LST **${context.farmAverages.LST}°م** · ملوحة التربة **${context.soil.salinityEC} dS/m**.\n• **التوصية المباشرة:** ${zoneA.actionAr}`
      : `${actionHeaderEn}• **Active Farm:** **${context.zoneNameEn}** (**${context.area.feddans} Feddans, ${context.area.qirats} Qirats** — Crop: **${cropDisplayNameEn}**).\n• **Live Telemetry:** NDVI **${context.farmAverages.NDVI}** · NDWI **${context.farmAverages.NDWI}** · LST **${context.farmAverages.LST}°C** · Soil EC **${context.soil.salinityEC} dS/m**.\n• **Direct Recommendation:** ${zoneA.actionEn}`;
  }

  // 1. NPK / Fertilization / Soil Reclamation / Salinity queries
  if (
    /(?:تسميد|سماد|\bnpk\b|نيتروجين|أزوت|بوتاسيوم|فوسفور|ملوحة|غسيل|حموضة|قلوية|\bph\b|\bec\b|جبس|هيوميك|فولفيك|fertig|fertiliz|salinity)/i.test(
      q
    )
  ) {
    if (!inlineWidgets.includes('irrigation_npk')) {
      inlineWidgets.push('irrigation_npk');
    }
    const w1 = npkSchedule.weeks[0];
    const w2 = npkSchedule.weeks[1];
    if (!isAr) {
      return (
        actionHeaderEn +
        `📊 **Executive Summary (GeoAgri ai) — NPK & Soil Plan for ${context.zoneNameEn} (${context.area.feddans} Fed, ${cropDisplayNameEn}):**
• **Thermal Stage:** **${growthStage.stageNameEn}** (${growthStage.accumulatedGDD}/${growthStage.targetTotalGDD} GDD, Kc = ${growthStage.cropCoefficientKc}).
• **Sub-Zone Soil EC/pH:** Zone A (${zoneA.areaFeddans} fed): **EC ${zoneA.salinityEC} dS/m, pH ${zoneA.soilPh}** | Zone B: **EC ${zoneB.salinityEC}** | Zone C: **EC ${zoneC.salinityEC}, Deep SM ${zoneC.soilMoistureDeepPct}%**.
• **4-Week Net NPK Budget/Feddan:** **${npkSchedule.total4WeekPureNPerFeddan} kg N** · **${npkSchedule.total4WeekPureP2O5PerFeddan} kg P₂O₅** · **${npkSchedule.total4WeekPureK2OPerFeddan} kg K₂O** (Week 1: ${w1.pureNKgPerFeddan}N/${w1.pureP2O5KgPerFeddan}P/${w1.pureK2OKgPerFeddan}K · Week 2: ${w2.pureNKgPerFeddan}N/${w2.pureP2O5KgPerFeddan}P/${w2.pureK2OKgPerFeddan}K).
• **Direct Recommendation:** ${zoneA.amendmentEn}; cut basal N by 10% in Zone C to prevent leaching.`
      );
    }

    return (
      actionHeaderAr +
      `📊 **ملخص تنفيذي (GeoAgri ai) — برنامج التسميد والتربة لمزرعة ${context.zoneNameAr} (${context.area.feddans} فدان و${context.area.qirats} قيراط — ${cropDisplayNameAr}):**
• **المرحلة الحرارية (GDD):** **${growthStage.stageNameAr}** (**${growthStage.accumulatedGDD}/${growthStage.targetTotalGDD}** درجة-يوم · اكتمال **${growthStage.completionPct}%** · **Kc = ${growthStage.cropCoefficientKc}**).
• **تباين التربة والملوحة:** زونا A (**${zoneA.salinityEC} dS/m**، pH **${zoneA.soilPh}**) · زونا B (**${zoneB.salinityEC} dS/m**) · زونا C (**${zoneC.salinityEC} dS/m**، رطوبة عميقة **${zoneC.soilMoistureDeepPct}%**).
• **إجمالي الفدان لـ 4 أسابيع:** **${npkSchedule.total4WeekPureNPerFeddan} كجم N** + **${npkSchedule.total4WeekPureP2O5PerFeddan} كجم P₂O₅** + **${npkSchedule.total4WeekPureK2OPerFeddan} كجم K₂O** (الأسبوع 1: ${w1.pureNKgPerFeddan}N / ${w1.pureP2O5KgPerFeddan}P / ${w1.pureK2OKgPerFeddan}K كجم).
• **التوصية المباشرة:** تطبيق **${zoneA.amendmentAr}** في زونا A، وخفض الأزوت الأرضي 10% في زونا C لمنع غسيل النترات.`
    );
  }

  // 2. Weekly Checklist / Action Plan queries
  if (inlineWidgets.includes('weekly_checklist') && actions.length === 0) {
    const total7dRain = context.forecast14
      .slice(0, 7)
      .reduce((acc, d) => acc + d.precipMm, 0)
      .toFixed(1);
    const total7dEt0 = context.forecast14
      .slice(0, 7)
      .reduce((acc, d) => acc + d.et0Mm, 0)
      .toFixed(1);
    return isAr
      ? `📋 **ملخص تنفيذي (GeoAgri ai) — خطة عمل الأسبوع لمزرعة ${context.zoneNameAr} (${context.area.feddans} فدان و${context.area.qirats} قيراط):**\n• **المؤشرات الحاكمة:** NDVI **${context.farmAverages.NDVI}** · حرارة الأوراق LST **${context.farmAverages.LST}°م** · أمطار 7 أيام **${total7dRain} مم** مقابل بخر-نتح **${total7dEt0} مم**.\n• **التوصية المباشرة:** ابدأ بغسيل خطوط زونا A ومعايرة التسميد صباحاً؛ يمكنك التأشير على المهام المنجزة في البطاقة التفاعلية أدناه.`
      : `📋 **Executive Summary (GeoAgri ai) — Weekly Plan for ${context.zoneNameEn} (${context.area.feddans} Fed, ${context.area.qirats} Qirats):**\n• **Key Telemetry:** NDVI **${context.farmAverages.NDVI}** · LST **${context.farmAverages.LST}°C** · 7-Day Rain **${total7dRain} mm** vs ET₀ **${total7dEt0} mm**.\n• **Direct Recommendation:** Prioritize Zone A line flushing and morning fertigation; check off completed tasks below.`;
  }

  // 3. Multi-Zone Comparison if user has multiple zones and asks to compare
  if (
    context.zones &&
    context.zones.length > 1 &&
    /(?:قارن|مقارنة|الفرق\s*بين|كل\s*الزونات|جميع\s*الزونات|compare\s*zones)/i.test(q)
  ) {
    const rowsAr = context.zones
      .map(
        (z, idx) =>
          `• **${idx + 1}. ${z.nameAr}** (${z.area.feddans} فدان): NDVI **${z.farmAverages.NDVI}** · NDWI **${z.farmAverages.NDWI}** · LST **${z.farmAverages.LST}°م** · ملوحة **${z.soil.salinityEC} dS/m**`
      )
      .join('\n');
    const rowsEn = context.zones
      .map(
        (z, idx) =>
          `• **${idx + 1}. ${z.nameEn}** (${z.area.feddans} Fed): NDVI **${z.farmAverages.NDVI}** · NDWI **${z.farmAverages.NDWI}** · LST **${z.farmAverages.LST}°C** · EC **${z.soil.salinityEC} dS/m**`
      )
      .join('\n');
    return isAr
      ? `${actionHeaderAr}📊 **ملخص تنفيذي (GeoAgri ai) — مقارنة زوناتك المسجلة (${context.zones.length} زونات):**\n${rowsAr}\n• **التوصية المباشرة:** وجّه أولوية الري والغسيل الملحي للزونة الأقل في NDWI والأعلى في حرارة الأوراق LST.`
      : `${actionHeaderEn}📊 **Executive Summary (GeoAgri ai) — Multi-Zone Comparison (${context.zones.length} zones):**\n${rowsEn}\n• **Direct Recommendation:** Prioritize irrigation and leaching on the zone with the lowest NDWI and highest LST.`;
  }

  // 4. Delegate to enhanced core scientific response + append concise telemetry insight
  const baseResponse = generateLocalAgronomistResponse(normalizedPrompt, {
    ...context,
    hasUserZones: true,
  });

  const topPest = pestRisks[0];
  const extraInsightAr =
    inlineWidgets.includes('pest_radar') && topPest
      ? `\n• **أعلى خطر حيوي مرصود (${context.centroid.lat.toFixed(4)}°N, ${context.centroid.lng.toFixed(4)}°E):** **${topPest.nameAr}** (خطر **${topPest.riskScore}%** · انتشار إقليمي **${topPest.regionalPrevalencePct}%** · نافذة الرش: ${topPest.recommendedSprayWindowAr}).`
      : inlineWidgets.includes('spectral_subzones')
      ? `\n• **فارق التباين الفضائي:** الفارق في NDVI بين **زونا C (${zoneC.ndvi})** و**زونا A (${zoneA.ndvi})** يبلغ **${Math.abs(zoneC.ndvi - zoneA.ndvi).toFixed(3)}** بسبب ارتفاع حرارة زونا A (**${zoneA.lstCelsius}°م**) وملوحتها (**${zoneA.salinityEC} dS/m**).`
      : inlineWidgets.includes('crop_mcda') && bestCrop
      ? `\n• **العائد الاقتصادي للمحصول الأول (${bestCrop.crop.nameAr}):** **${bestCrop.estimatedRevenuePerFeddanEgp.toLocaleString()} ج.م/فدان** مع تغطية مطرية **${bestCrop.predictedRainCoveragePct}%** مقارنة بـ **${secondCrop.crop.nameAr}** (${secondCrop.suitabilityScore}%).`
      : '';

  const extraInsightEn =
    inlineWidgets.includes('pest_radar') && topPest
      ? `\n• **Top Bio-Risk (${context.centroid.lat.toFixed(4)}°N, ${context.centroid.lng.toFixed(4)}°E):** **${topPest.nameEn}** (**${topPest.riskScore}% risk**, ${topPest.regionalPrevalencePct}% regional prevalence).`
      : '';

  return (isAr ? actionHeaderAr : actionHeaderEn) + baseResponse + (isAr ? extraInsightAr : extraInsightEn);
}

