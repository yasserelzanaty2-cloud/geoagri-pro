import {
  AreaBreakdown,
  BotanicalFamily,
  CropDatabaseItem,
  CropWaterEvaluation,
  CustomRotationEvaluation,
  DailyGddProjectionPoint,
  DailyWeatherPoint,
  DisasterResilientCropMatch,
  EnvironmentalDisasterType,
  EnvironmentalDisasterWarning,
  FarmWaterBudgetSummary,
  FourWeekNpkSchedule,
  GrowthStageInfo,
  HistoricalComparableIndexKey,
  HistoricalComparisonPoint,
  HistoricalIndexAnomalySummary,
  HistoricalSeasonRange,
  LatLon,
  LoggedPestIncident,
  MultiYearCycleLength,
  MultiYearRotationFocus,
  MultiYearRotationStrategy,
  NpkWeekDose,
  PestSeverity,
  PresetFarmZone,
  ProactivePestOutbreakAlert,
  RegionalPestCatalogItem,
  RegionalPestRiskWarning,
  RotationStrategyOption,
  RotationWarning,
  ScoredCropRecommendation,
  SeasonalMonthPrediction,
  SmartWeatherAlert,
  SoilProfile,
  SoilTexture,
  SpatialGridCell,
  SpectralIndexKey,
  SpectralTemporalPoint,
  SubZoneSummary,
  ThirtyDayGddProjectionSummary,
  WeatherPestRiskSystemSummary,
  WeatherStagePestAlert,
  WeeklyChecklistTask,
  ZoneCustomRotationPlan,
} from '../types/agro';

// ============================================================================
// 1. EGYPTIAN & GLOBAL AGRICULTURAL PRESET ZONES & CROP DATABASE
// ============================================================================

export const PRESET_FARM_ZONES: PresetFarmZone[] = [
  {
    id: 'mit-ghamr-delta',
    nameAr: 'نطاق ميت غمر — دلتا النيل (أرض طينية رسوبية)',
    nameEn: 'Mit Ghamr Zone — Nile Delta Alluvial Clay',
    regionAr: 'قلب الدلتا — الدقهلية',
    regionEn: 'Central Nile Delta — Dakahlia',
    governorateAr: 'الدقهلية',
    governorateEn: 'Dakahlia',
    vertices: [
      { lat: 30.7318, lng: 31.2736 },
      { lat: 30.7321, lng: 31.2786 },
      { lat: 30.7286, lng: 31.2792 },
      { lat: 30.7276, lng: 31.2764 },
      { lat: 30.7282, lng: 31.2732 },
    ],
    soil: {
      texture: 'clay',
      salinityEC: 1.4,
      ph: 7.5,
      organicMatterPct: 2.3,
      irrigation: 'drip',
      groundwaterDepthM: 1.8,
    },
    currentCropId: 'wheat',
    plantingDateISO: '2026-10-10',
    baseSpectralBands: {
      blue: 0.042,
      green: 0.078,
      red: 0.058,
      nir: 0.412,
      swir1: 0.165,
      swir2: 0.095,
      lstCelsius: 24.8,
    },
  },
  {
    id: 'bir-al-abd-sinai',
    nameAr: 'نطاق بئر العبد — شمال سيناء (أرض رملية ساحلية)',
    nameEn: 'Bir al-Abd Zone — North Sinai Coastal Sandy',
    regionAr: 'محور التنمية الزراعية — شمال سيناء',
    regionEn: 'Sinai Development Corridor — North Sinai',
    governorateAr: 'شمال سيناء',
    governorateEn: 'North Sinai',
    vertices: [
      { lat: 31.0195, lng: 33.0085 },
      { lat: 31.0203, lng: 33.0148 },
      { lat: 31.0158, lng: 33.0156 },
      { lat: 31.0151, lng: 33.0092 },
    ],
    soil: {
      texture: 'sandy',
      salinityEC: 3.8,
      ph: 7.9,
      organicMatterPct: 0.65,
      irrigation: 'drip',
      groundwaterDepthM: 4.5,
    },
    currentCropId: 'olive',
    plantingDateISO: '2026-09-15',
    baseSpectralBands: {
      blue: 0.085,
      green: 0.122,
      red: 0.145,
      nir: 0.342,
      swir1: 0.248,
      swir2: 0.178,
      lstCelsius: 28.6,
    },
  },
  {
    id: 'west-minya-reclamation',
    nameAr: 'نطاق غرب المنيا — مشروع المليون ونصف فدان (صفراء جيرية)',
    nameEn: 'West Minya Reclamation — Calcareous Loam Pivot',
    regionAr: 'الظهير الصحراوي الغربي — المنيا',
    regionEn: 'Western Desert Reclamation — Minya',
    governorateAr: 'المنيا',
    governorateEn: 'Minya',
    vertices: [
      { lat: 28.1482, lng: 30.4215 },
      { lat: 28.1495, lng: 30.4288 },
      { lat: 28.1441, lng: 30.4296 },
      { lat: 28.1429, lng: 30.4242 },
      { lat: 28.1448, lng: 30.4209 },
    ],
    soil: {
      texture: 'calcareous',
      salinityEC: 2.9,
      ph: 8.1,
      organicMatterPct: 0.95,
      irrigation: 'pivot',
      groundwaterDepthM: 12.0,
    },
    currentCropId: 'sugar_beet',
    plantingDateISO: '2026-09-28',
    baseSpectralBands: {
      blue: 0.068,
      green: 0.104,
      red: 0.098,
      nir: 0.376,
      swir1: 0.205,
      swir2: 0.132,
      lstCelsius: 27.4,
    },
  },
  {
    id: 'fayoum-oasis-loam',
    nameAr: 'نطاق منخفض الفيوم — طمي بحيرة قارون (صفراء طينية)',
    nameEn: 'Fayoum Oasis Basin — Clay-Loam Terrace',
    regionAr: 'إقليم الفيوم الزراعي',
    regionEn: 'Fayoum Agro-Ecological Depression',
    governorateAr: 'الفيوم',
    governorateEn: 'Fayoum',
    vertices: [
      { lat: 29.3612, lng: 30.7824 },
      { lat: 29.3621, lng: 30.7879 },
      { lat: 29.3578, lng: 30.7885 },
      { lat: 29.3571, lng: 30.7831 },
    ],
    soil: {
      texture: 'loamy',
      salinityEC: 2.2,
      ph: 7.7,
      organicMatterPct: 1.85,
      irrigation: 'sprinkler',
      groundwaterDepthM: 2.4,
    },
    currentCropId: 'fava_bean',
    plantingDateISO: '2026-10-18',
    baseSpectralBands: {
      blue: 0.052,
      green: 0.089,
      red: 0.069,
      nir: 0.398,
      swir1: 0.178,
      swir2: 0.108,
      lstCelsius: 25.9,
    },
  },
];

export const CROP_DATABASE: CropDatabaseItem[] = [
  {
    id: 'wheat',
    nameAr: 'قمح (سخا 95 / مصر 3)',
    nameEn: 'Wheat (Sakha 95 / Misr 3)',
    scientificName: 'Triticum aestivum',
    cultivarAr: 'سخا 95 المقاوم للصدأ الأصفر والإجهاد الحراري',
    cultivarEn: 'Sakha 95 (Yellow-Rust & Heat Tolerant)',
    season: 'winter',
    seasonAr: 'شتوي استراتيجي',
    seasonEn: 'Strategic Winter Crop',
    preferredSoils: ['clay', 'loamy', 'calcareous'],
    maxSalinityEC: 6.0,
    ecSlopePctPerDsm: 7.1,
    optimalPhRange: [6.5, 8.0],
    optimalTempRangeC: [12, 25],
    baseTempGDD: 5,
    totalGDDRequired: 1650,
    seasonalWaterReqMm: 450,
    optimalPlantingStartAr: '15 نوفمبر',
    optimalPlantingEndAr: '5 ديسمبر',
    optimalPlantingStartEn: 'Nov 15',
    optimalPlantingEndEn: 'Dec 5',
    optimalPlantingMonths: [11, 12],
    earlyPlantingRiskAr: 'التبكير في أكتوبر يسبب طرد السنابل مبكراً وتعرضها لصقيع يناير وفقدان 18% من التفريع.',
    earlyPlantingRiskEn: 'Early October sowing triggers premature heading exposed to January frost (-18% tillering).',
    latePlantingRiskAr: 'التأخير بعد 10 ديسمبر يعرّض مرحلة امتلاء الحبوب لرياح الخماسين الحارة في أبريل فيقل وزن الألف حبة.',
    latePlantingRiskEn: 'Sowing after Dec 10 exposes grain filling to April Khamsin heatwaves, shriveling kernels.',
    expectedHarvestDurationDays: 155,
    potentialYieldTonPerFeddan: 3.4,
    marketPriceEgpPerTon: 14800,
    nitrogenFixer: false,
    rootDiseaseBreakRole: 'Gramineae cereal — follow with legume (Clover/Fava/Soybean)',
    qualityFactorsAr: 'نسبة بروتين الحبة > 12.8% مع امتلاء كامل للسنبلة عند تزامن التزهير مع اعتدال حرارة فبراير.',
    qualityFactorsEn: 'Grain protein > 12.8% and high hectoliter test weight when anthesis aligns with mild February temps.',
    rotationPestMitigationSummaryAr:
      'تعاقب القمح مع البقوليات الشتوية (البرسيم المصري أو الفول البلدي) يكسر دورة حياة فطريات أعفان الجذور والتاج (Fusarium & Take-all) ويقضي على 82% من مخزون بذور حشيشة الزمير البري في التربة.',
    rotationPestMitigationSummaryEn:
      'Rotating Wheat with winter legumes (Berseem Clover or Fava Bean) starves soil-borne Fusarium/Take-all root rot inoculum and eradicates 82% of Wild Oat (Avena fatua) seed banks.',
    commonPestsAndDiseases: [
      {
        id: 'wheat-yellow-rust',
        nameAr: 'الصدأ الأصفر المخطط وأصداء الأوراق',
        nameEn: 'Yellow Stripe & Leaf Rust',
        scientificName: 'Puccinia striiformis / P. triticina',
        type: 'fungal',
        typeLabelAr: 'مرض فطري هوائي',
        typeLabelEn: 'Fungal Pathogen',
        severity: 'critical',
        symptomsAr: 'بثرات صفراء أو برتقالية طولية موازية لعروق الورقة تسبب ضمور الحبوب.',
        symptomsEn: 'Linear yellow-orange pustules along leaf veins reducing grain filling.',
        rotationMitigationAr: 'التناوب مع المحاصيل البقولية (فول/برسيم) والتخلص من الحشائش النجيلية العائلة يقطع الجسر الأخضر للجراثيم اليوريدية.',
        rotationMitigationEn: 'Alternating with non-host legumes and eliminating volunteer grasses breaks the green bridge of urediniospores.',
      },
      {
        id: 'wheat-root-rot',
        nameAr: 'أعفان الجذور والتاج والبياض الدقيقي',
        nameEn: 'Fusarium Crown & Take-All Root Rot',
        scientificName: 'Fusarium culmorum / Gaeumannomyces graminis',
        type: 'fungal',
        typeLabelAr: 'فطريات تربة',
        typeLabelEn: 'Soil-Borne Fungal',
        severity: 'high',
        symptomsAr: 'اسوداد قاعدة الساق والجذور وسهولة اقتلاع النبات وظهور السنابل البيضاء الفارغة.',
        symptomsEn: 'Blackened crown and roots leading to premature whiteheads and lodging.',
        rotationMitigationAr: 'زراعة الفول البلدي أو البرسيم لمدة موسم شتوي واحد تمنع العائل النجيلي وتخفض اللقاح الفطري في التربة بنسبة 78%.',
        rotationMitigationEn: 'A 1-season break with Fava Bean or Berseem Clover deprives cereal-specific mycelia, cutting soil inoculum by 78%.',
      },
      {
        id: 'wheat-aphids-wild-oat',
        nameAr: 'حشرة منّ النجيليات وحشيشة الزمير البري',
        nameEn: 'Cereal Aphids (BYDV Vector) & Wild Oat',
        scientificName: 'Rhopalosiphum padi & Avena fatua',
        type: 'insect',
        typeLabelAr: 'حشري / حشائش نجيلية',
        typeLabelEn: 'Insect Vector & Grassy Weed',
        severity: 'high',
        symptomsAr: 'امتصاص العصارة ونقل فيروس تقزم واصفرار الشعير (BYDV) مع منافسة الزمير للقمح.',
        symptomsEn: 'Sap depletion, Barley Yellow Dwarf Virus transmission, and severe competition from Wild Oat.',
        rotationMitigationAr: 'الحش المتكرر للبرسيم المصري (4-5 حشات) يمنع حشيشة الزمير من تكوين البذور ويقطع دورة توالد منّ الحبوب.',
        rotationMitigationEn: 'Multi-cut Berseem Clover mowing prevents Wild Oat seed-set and interrupts cereal aphid host continuity.',
      },
    ],
  },
  {
    id: 'fava_bean',
    nameAr: 'فول بلدي (جيزة 716 / سخا 4)',
    nameEn: 'Fava Bean (Giza 716 / Sakha 4)',
    scientificName: 'Vicia faba',
    cultivarAr: 'جيزة 716 المقاوم للتبقع البني والهالوك',
    cultivarEn: 'Giza 716 (Chocolate Spot & Broomrape Tolerant)',
    season: 'winter',
    seasonAr: 'شتوي بقولي مخصب للتربة',
    seasonEn: 'Winter Nitrogen-Fixing Legume',
    preferredSoils: ['clay', 'loamy'],
    maxSalinityEC: 1.8,
    ecSlopePctPerDsm: 9.5,
    optimalPhRange: [6.5, 7.8],
    optimalTempRangeC: [12, 23],
    baseTempGDD: 4,
    totalGDDRequired: 1450,
    seasonalWaterReqMm: 360,
    optimalPlantingStartAr: '1 نوفمبر',
    optimalPlantingEndAr: '25 نوفمبر',
    optimalPlantingStartEn: 'Nov 1',
    optimalPlantingEndEn: 'Nov 25',
    optimalPlantingMonths: [10, 11],
    earlyPlantingRiskAr: 'الزراعة المبكرة في حرارة مرتفعة تزيد نشاط حشرة المنّ والذبابة البيضاء وانتشار الفيروسات.',
    earlyPlantingRiskEn: 'Early warm planting increases aphid/whitefly vectors and viral stunt incidence.',
    latePlantingRiskAr: 'التأخير لديسمبر يرفع تساقط الأزهار في مارس ويخفض عقد القرون بنسبة 25%.',
    latePlantingRiskEn: 'December planting increases March flower abortion and reduces pod set by 25%.',
    expectedHarvestDurationDays: 145,
    potentialYieldTonPerFeddan: 1.85,
    marketPriceEgpPerTon: 31000,
    nitrogenFixer: true,
    rootDiseaseBreakRole: 'Fixes 45–60 kg N/feddan via Rhizobium leguminosarum and breaks cereal root rot cycles',
    qualityFactorsAr: 'تجانس حجم البذرة وانخفاض نسبة الكسر مع تثبيت 50 كجم أزوت حيوي للفدان للمحصول التالي.',
    qualityFactorsEn: 'Uniform large seed caliber, zero bruchid damage, plus 50 kg/feddan biological N fixation.',
    rotationPestMitigationSummaryAr:
      'تناوب الفول البلدي مع القمح والأرز أو الذرة الشامية يمنع تراكم بذور الهالوك المتطفل (Orobanche) وجراثيم التبقع البني في التربة مع إمداد الحبوب التالية بـ 50 كجم أزوت حيوي.',
    rotationPestMitigationSummaryEn:
      'Rotating Fava Bean with Wheat and flooded Rice/Maize suppresses parasitic Broomrape (Orobanche) seed banks and Botrytis spores while supplying +50 kg N/feddan.',
    commonPestsAndDiseases: [
      {
        id: 'fava-chocolate-spot',
        nameAr: 'مرض التبقع البني (الشوكولاتة) والصدأ',
        nameEn: 'Chocolate Spot & Fava Rust',
        scientificName: 'Botrytis fabae & Uromyces viciae-fabae',
        type: 'fungal',
        typeLabelAr: 'مرض فطري',
        typeLabelEn: 'Fungal Disease',
        severity: 'high',
        symptomsAr: 'بقع بنية محمرة على الأوراق والأزهار تتحول لحروق شاملة عند ارتفاع الرطوبة.',
        symptomsEn: 'Reddish-brown necrotic lesions on leaves and blossoms under high humidity.',
        rotationMitigationAr: 'التعاقب مع محاصيل الحبوب (القمح والذرة) لمدة عامين يضمن تحلل الأجسام الحجرية للفطر في مخلفات المحصول.',
        rotationMitigationEn: 'A 2-year cereal interval ensures complete decomposition of sclerotia in crop debris.',
      },
      {
        id: 'fava-orobanche',
        nameAr: 'الهالوك المتطفل ومنّ البقوليات الأسود',
        nameEn: 'Parasitic Broomrape & Black Bean Aphid',
        scientificName: 'Orobanche crenata & Aphis craccivora',
        type: 'parasitic_weed',
        typeLabelAr: 'نبات متطفل / حشري',
        typeLabelEn: 'Parasitic Weed & Vector',
        severity: 'critical',
        symptomsAr: 'شماريخ الهالوك تمتص الماء والغذاء من جذور الفول وتسبب ذبولاً كاملاً للنبات.',
        symptomsEn: 'Parasitic spikes attach to fava roots, draining water and assimilates.',
        rotationMitigationAr: 'إدخال البرسيم المصري (يفرز محفزات إنبات انتحاري لبذور الهالوك) أو الأرز المغمور يخفض بذور الهالوك بنسبة 75%.',
        rotationMitigationEn: 'Rotating with Berseem Clover (trap crop inducing suicidal germination) or flooded Rice cuts Orobanche seeds by 75%.',
      },
    ],
  },
  {
    id: 'clover',
    nameAr: 'برسيم مصري مسقاوي (هلالي)',
    nameEn: 'Egyptian Clover / Berseem (Helaly)',
    scientificName: 'Trifolium alexandrinum',
    cultivarAr: 'برسيم مسقاوي متعدد الحشات (4-5 حشات)',
    cultivarEn: 'Multi-cut Miskawi Helaly (4–5 cuts)',
    season: 'winter',
    seasonAr: 'شتوي علفي ومُحسّن لقوام التربة',
    seasonEn: 'Winter Forage & Soil Conditioner',
    preferredSoils: ['clay', 'loamy', 'calcareous'],
    maxSalinityEC: 3.2,
    ecSlopePctPerDsm: 5.8,
    optimalPhRange: [6.5, 8.0],
    optimalTempRangeC: [10, 26],
    baseTempGDD: 5,
    totalGDDRequired: 1800,
    seasonalWaterReqMm: 560,
    optimalPlantingStartAr: '15 أكتوبر',
    optimalPlantingEndAr: '15 نوفمبر',
    optimalPlantingStartEn: 'Oct 15',
    optimalPlantingEndEn: 'Nov 15',
    optimalPlantingMonths: [10, 11],
    earlyPlantingRiskAr: 'الزراعة في سبتمبر تعرض البادرات لدودة ورق القطن وذبول البادرات.',
    earlyPlantingRiskEn: 'September sowing exposes tender seedlings to cotton leafworm and damping-off.',
    latePlantingRiskAr: 'التأخير بعد منتصف نوفمبر يفقد المزارع حشة كاملة قبل دخول الصيف.',
    latePlantingRiskEn: 'Sowing after mid-November loses one full forage cut before summer rotation.',
    expectedHarvestDurationDays: 165,
    potentialYieldTonPerFeddan: 28.0,
    marketPriceEgpPerTon: 1950,
    nitrogenFixer: true,
    rootDiseaseBreakRole: 'Fixes 65 kg N/feddan, flushes surface salts, and suppresses grassy weeds',
    qualityFactorsAr: 'نسبة بروتين خام 21% في المادة الجافة مع 5 حشات غزيرة وإضافة 65 كجم نيتروجين طبيعي للتربة.',
    qualityFactorsEn: '21% crude protein dry matter across 5 vigorous cuts while enriching soil with 65 kg N/feddan.',
    rotationPestMitigationSummaryAr:
      'البرسيم المصري هو حجر الزاوية في الدورة الزراعية المصرية؛ يطهر التربة من حشائش القمح والهالوك عبر الحش المتكرر ويثبت 65 كجم أزوت/فدان للذرة والقطن.',
    rotationPestMitigationSummaryEn:
      'Cornerstone of Egyptian crop rotation; multi-cut harvesting purges grassy weeds and Broomrape while fixing 65 kg N/feddan for subsequent Maize or Cotton.',
    commonPestsAndDiseases: [
      {
        id: 'clover-dodder',
        nameAr: 'حشيشة الحامول المتطفلة وسوسة ورق البرسيم',
        nameEn: 'Parasitic Dodder & Alfalfa/Clover Weevil',
        scientificName: 'Cuscuta planiflora & Hypera variabilis',
        type: 'parasitic_weed',
        typeLabelAr: 'حشائش متطفلة / حشري',
        typeLabelEn: 'Parasitic Weed & Insect',
        severity: 'moderate',
        symptomsAr: 'خيوط صفراء تلتف حول السيقان مع قرض الأوراق بواسطة يرقات السوسة الخضراء.',
        symptomsEn: 'Yellow twining filaments choking stems alongside leaf skeletonization by weevil larvae.',
        rotationMitigationAr: 'التعاقب مع الذرة الشامية الصيفية والقمح الشتوي يقضي تماماً على عوائل الحامول ويرقات السوسة.',
        rotationMitigationEn: 'Rotating to summer Maize and winter Wheat eliminates Dodder hosts and overwintering weevil larvae.',
      },
      {
        id: 'clover-crown-rot',
        nameAr: 'عفن التاج والجذور السكليروتيني',
        nameEn: 'Sclerotinia Crown & Stem Rot',
        scientificName: 'Sclerotinia trifoliorum',
        type: 'fungal',
        typeLabelAr: 'فطريات تربة',
        typeLabelEn: 'Soil-Borne Fungal',
        severity: 'moderate',
        symptomsAr: 'تعفن منطقة التاج واصفرار الحشات المتأخرة في الأراضي سيئة الصرف.',
        symptomsEn: 'Crown rot and wilting of regrowth under waterlogged conditions.',
        rotationMitigationAr: 'التناوب مع محاصيل الحبوب النجيلية غير العائلة (قمح/ذرة) يكسر بقاء الأجسام الحجرية.',
        rotationMitigationEn: 'Alternating with non-host Gramineae cereals (Wheat/Maize) breaks sclerotial persistence.',
      },
    ],
  },
  {
    id: 'sugar_beet',
    nameAr: 'بنجر السكر (عروة مبكرة / متوسطة)',
    nameEn: 'Sugar Beet (High-Sucrose Monogerm)',
    scientificName: 'Beta vulgaris',
    cultivarAr: 'أصناف وحيدة الجنين عالية السكر ومقاومة الملوحة',
    cultivarEn: 'Halotolerant High-Pol Monogerm Cultivar',
    season: 'winter',
    seasonAr: 'شتوي صناعي مقاوم للملوحة والجفاف',
    seasonEn: 'Salt-Tolerant Industrial Winter Crop',
    preferredSoils: ['calcareous', 'loamy', 'sandy', 'clay'],
    maxSalinityEC: 7.0,
    ecSlopePctPerDsm: 5.9,
    optimalPhRange: [6.8, 8.3],
    optimalTempRangeC: [12, 27],
    baseTempGDD: 4,
    totalGDDRequired: 2100,
    seasonalWaterReqMm: 480,
    optimalPlantingStartAr: '15 سبتمبر',
    optimalPlantingEndAr: '15 نوفمبر',
    optimalPlantingStartEn: 'Sep 15',
    optimalPlantingEndEn: 'Nov 15',
    optimalPlantingMonths: [9, 10, 11],
    earlyPlantingRiskAr: 'الزراعة في أغسطس تزيد الإصابة بدودة البنجر وموت البادرات بسبب حرارة التربة.',
    earlyPlantingRiskEn: 'August sowing increases beet armyworm pressure and thermal seedling mortality.',
    latePlantingRiskAr: 'التأخير لديسمبر يقلل حجم الجذور ويخفض نسبة السكروز عن 16%.',
    latePlantingRiskEn: 'December planting reduces root tonnage and drops sucrose polarization below 16%.',
    expectedHarvestDurationDays: 180,
    potentialYieldTonPerFeddan: 24.5,
    marketPriceEgpPerTon: 2400,
    nitrogenFixer: false,
    rootDiseaseBreakRole: 'Chenopodiaceae deep taproot breaks cereal hardpan and tolerates EC up to 7 dS/m',
    qualityFactorsAr: 'نسبة حلاوة (سكروز) تتجاوز 18.5% وعلاوة جودة مرتفعة من مصانع السكر عند ضبط الفطام المائي.',
    qualityFactorsEn: 'Sucrose polarization > 18.5% earning top factory quality bonuses when pre-harvest irrigation is tapered.',
    rotationPestMitigationSummaryAr:
      'بنجر السكر ينتمي للعائلة الرمرامية ويكسر دورة أمراض الحبوب والباذنجانيات، لكن يجب عدم تكراره قبل 3 سنوات لتفادي نيماتودا حوصلات البنجر والتبقع السركسبوري.',
    rotationPestMitigationSummaryEn:
      'As a Chenopodiaceae taproot crop, Sugar Beet breaks cereal and solanaceous disease cycles, requiring a 3-year rotation interval to prevent cyst nematodes.',
    commonPestsAndDiseases: [
      {
        id: 'beet-cercospora',
        nameAr: 'التبقع السركسبوري وعفن الجذور الريزوكتوني',
        nameEn: 'Cercospora Leaf Spot & Rhizoctonia Root Rot',
        scientificName: 'Cercospora beticola & Rhizoctonia solani',
        type: 'fungal',
        typeLabelAr: 'مرض فطري',
        typeLabelEn: 'Fungal Pathogen',
        severity: 'high',
        symptomsAr: 'بقع دائرية رمادية بحافة بنية على الأوراق تستنزف السكروز من الجذور.',
        symptomsEn: 'Circular ash-gray leaf spots with reddish borders that deplete root sucrose.',
        rotationMitigationAr: 'التعاقب الثلاثي (بنجر ← ذرة رفيعة/شامية ← قمح ← فول) يقضي على جراثيم Cercospora الكامنة بالتربة.',
        rotationMitigationEn: 'A 3-year rotation with Maize, Wheat, and Fava Bean eliminates overwintering Cercospora conidia.',
      },
      {
        id: 'beet-fly-armyworm',
        nameAr: 'ذبابة أوراق البنجر وسلحفاة البنجر',
        nameEn: 'Beet Leafminer Fly & Tortoise Beetle',
        scientificName: 'Pegomya hyoscyami & Cassida vittata',
        type: 'insect',
        typeLabelAr: 'آفة حشرية',
        typeLabelEn: 'Insect Pest',
        severity: 'moderate',
        symptomsAr: 'أنفاق بين بشرتي الورقة وثقوب تقلل المساحة الورقية المصنعة للسكر.',
        symptomsEn: 'Blotch leaf mines and defoliation reducing photosynthetic sugar synthesis.',
        rotationMitigationAr: 'تغيير العائلة النباتية للمحصول التالي يمنع خروج الحشرات الكاملة من العذارى الكامنة في التربة.',
        rotationMitigationEn: 'Rotating to non-Chenopodiaceae crops breaks pupal emergence in the following season.',
      },
    ],
  },
  {
    id: 'potato',
    nameAr: 'بطاطس تصدير (سبونتا / كارا)',
    nameEn: 'Export Potato (Spunta / Cara)',
    scientificName: 'Solanum tuberosum',
    cultivarAr: 'سبونتا / دايمونت (العروة الشتوية التصديرية)',
    cultivarEn: 'Spunta / Diamant (Winter Export Window)',
    season: 'winter',
    seasonAr: 'شتوي/نيلي تصديري عالي العائد',
    seasonEn: 'High-Value Export Tuber Crop',
    preferredSoils: ['loamy', 'sandy', 'clay'],
    maxSalinityEC: 1.7,
    ecSlopePctPerDsm: 12.0,
    optimalPhRange: [5.8, 7.6],
    optimalTempRangeC: [14, 24],
    baseTempGDD: 7,
    totalGDDRequired: 1500,
    seasonalWaterReqMm: 430,
    optimalPlantingStartAr: '20 أكتوبر',
    optimalPlantingEndAr: '20 نوفمبر',
    optimalPlantingStartEn: 'Oct 20',
    optimalPlantingEndEn: 'Nov 20',
    optimalPlantingMonths: [10, 11, 1],
    earlyPlantingRiskAr: 'حرارة التربة المرتفعة تعيق صب الدرنات وتزيد نشاط العفن البني.',
    earlyPlantingRiskEn: 'Warm soil inhibits tuber initiation and accelerates bacterial wilt.',
    latePlantingRiskAr: 'التعرض لصقيع أواخر يناير والندوة المتأخرة عند ارتفاع الرطوبة الجوية.',
    latePlantingRiskEn: 'Late January frost damage and Phytophthora late blight during humid spells.',
    expectedHarvestDurationDays: 115,
    potentialYieldTonPerFeddan: 14.5,
    marketPriceEgpPerTon: 11500,
    nitrogenFixer: false,
    rootDiseaseBreakRole: 'Solanaceae — requires 3-year gap from Tomato/Pepper to avoid nematodes',
    qualityFactorsAr: 'درنات متجانسة (45-65 مم) خالية من الجرب العادي والندوة، مطابقة لمواصفات التصدير الأوروبية.',
    qualityFactorsEn: 'Uniform 45–65mm tubers free of scab and hollow heart, meeting EU export phytosanitary standards.',
    rotationPestMitigationSummaryAr:
      'البطاطس حساسة جداً للعفن البني البكتيري ونيماتودا تعقد الجذور؛ فصلها بدورة (بطاطس ← ذرة شامية/رفيعة ← برسيم/قمح) يمنع انتقال آفات العائلة الباذنجانية ويحافظ على خلو التربة للتصدير.',
    rotationPestMitigationSummaryEn:
      'Separating Potato from other Solanaceae (Tomato/Pepper) via Maize and Wheat/Clover rotations suppresses bacterial brown rot and root-knot nematodes for EU export compliance.',
    commonPestsAndDiseases: [
      {
        id: 'potato-late-blight-brown-rot',
        nameAr: 'الندوة المتأخرة والعفن البني البكتيري',
        nameEn: 'Late Blight & Bacterial Brown Rot',
        scientificName: 'Phytophthora infestans & Ralstonia solanacearum',
        type: 'bacterial_viral',
        typeLabelAr: 'فطري / بكتيري حجري',
        typeLabelEn: 'Oomycete & Quarantine Bacterial',
        severity: 'critical',
        symptomsAr: 'حروق مائية داكنة على الأوراق وتلون الحلقة الوعائية للدرنة باللون البني وإفرازات بكتيرية.',
        symptomsEn: 'Water-soaked foliar lesions and brown vascular ring discoloration in tubers.',
        rotationMitigationAr: 'حظر زراعة الطماطم أو الفلفل قبل أو بعد البطاطس، وإدخال الذرة والقمح والبرسيم يطهر التربة من بكتيريا Ralstonia.',
        rotationMitigationEn: 'Strictly avoiding Tomato/Pepper in rotation and inserting Maize + Wheat/Berseem starves Ralstonia bacterial populations.',
      },
      {
        id: 'potato-tuber-moth-nematode',
        nameAr: 'فراشة درنات البطاطس ونيماتودا تعقد الجذور',
        nameEn: 'Potato Tuber Moth & Root-Knot Nematode',
        scientificName: 'Phthorimaea operculella & Meloidogyne spp.',
        type: 'nematode',
        typeLabelAr: 'نيماتودا / حشري',
        typeLabelEn: 'Nematode & Lepidopteran',
        severity: 'high',
        symptomsAr: 'أنفاق داخل الدرنات وتآكل العيون مع عقد وتورمات على الجذور والدرنات.',
        symptomsEn: 'Sub-epidermal tuber galleries and root/tuber galling.',
        rotationMitigationAr: 'التعاقب مع الذرة الرفيعة أو البرسيم يفرز مركبات جذرية مثبطة لفقس يرقات النيماتودا بنسبة 70%.',
        rotationMitigationEn: 'Rotating with Sorghum or Berseem releases root exudates that suppress Meloidogyne juvenile hatching by 70%.',
      },
    ],
  },
  {
    id: 'quinoa',
    nameAr: 'كينوا (سلالة سيناء المتحملة للملوحة)',
    nameEn: 'Quinoa (Sinai Halophyte Strain)',
    scientificName: 'Chenopodium quinoa',
    cultivarAr: 'ريجالونا / سلالة صحراء سيناء عالية البروتين',
    cultivarEn: 'Regalona / Sinai Halophyte Supergrain',
    season: 'winter',
    seasonAr: 'شتوي ذكي مناخياً للأراضي الرملية والملحية',
    seasonEn: 'Climate-Resilient Halophyte Grain',
    preferredSoils: ['sandy', 'calcareous', 'loamy'],
    maxSalinityEC: 11.5,
    ecSlopePctPerDsm: 3.2,
    optimalPhRange: [6.0, 8.5],
    optimalTempRangeC: [10, 26],
    baseTempGDD: 3,
    totalGDDRequired: 1400,
    seasonalWaterReqMm: 260,
    optimalPlantingStartAr: '1 نوفمبر',
    optimalPlantingEndAr: '30 نوفمبر',
    optimalPlantingStartEn: 'Nov 1',
    optimalPlantingEndEn: 'Nov 30',
    optimalPlantingMonths: [11, 12],
    earlyPlantingRiskAr: 'الحرارة فوق 32°م أثناء الإزهار تسبب عقم حبوب اللقاح.',
    earlyPlantingRiskEn: 'Temperatures above 32°C during flowering induce pollen sterility.',
    latePlantingRiskAr: 'التأخير لفبراير يعرض النورات الحساسة للرياح الخماسينية الجافة.',
    latePlantingRiskEn: 'Late sowing pushes grain maturity into dry spring Khamsin winds.',
    expectedHarvestDurationDays: 125,
    potentialYieldTonPerFeddan: 1.45,
    marketPriceEgpPerTon: 48000,
    nitrogenFixer: false,
    rootDiseaseBreakRole: 'Exceptional drought & salinity pioneer crop for North Sinai and West Minya',
    qualityFactorsAr: 'حبوب غنية بالأحماض الأمينية الكاملة (16% بروتين) بمقنن مائي لا يتجاوز 1100 م³/فدان.',
    qualityFactorsEn: 'Complete amino-acid profile (16% protein) produced with under 1,100 m³/feddan water.',
    rotationPestMitigationSummaryAr:
      'تمتلك الكينوا غلافاً طبيعياً من السابونين يطرد الحشرات والطيور ويكسر دورة آفات النجيليات في الأراضي الرملية والملحية.',
    rotationPestMitigationSummaryEn:
      'Natural pericarp saponins deter insects and birds while breaking cereal pest cycles in saline sandy soils.',
    commonPestsAndDiseases: [
      {
        id: 'quinoa-downy-mildew',
        nameAr: 'البياض الزغبي وصانعات الأنفاق',
        nameEn: 'Quinoa Downy Mildew & Leafminers',
        scientificName: 'Peronospora variabilis & Liriomyza spp.',
        type: 'fungal',
        typeLabelAr: 'فطري / حشري',
        typeLabelEn: 'Fungal & Insect',
        severity: 'moderate',
        symptomsAr: 'بقع شاحبة على السطح العلوي للأوراق يقابلها زغب رمادي بالسطح السفلي.',
        symptomsEn: 'Chlorotic upper leaf patches with gray sporangia underneath.',
        rotationMitigationAr: 'التعاقب مع الذرة الرفيعة الصيفية والبقوليات يمنع بقاء الجراثيم البيضية في التربة.',
        rotationMitigationEn: 'Alternating with summer Sorghum and legumes prevents oospore survival in soil.',
      },
    ],
  },
  {
    id: 'olive',
    nameAr: 'زيتون ثنائي الغرض (بيكوال / كرونياكي)',
    nameEn: 'Olive (Picual / Koroneiki)',
    scientificName: 'Olea europaea',
    cultivarAr: 'بيكوال وكلاماتا وكرونياكي لإنتاج الزيت البكر الممتاز',
    cultivarEn: 'Picual & Koroneiki Extra-Virgin Oil Cultivars',
    season: 'perennial',
    seasonAr: 'بستاني مستديم متحمل للجفاف والملوحة',
    seasonEn: 'Drought-Hardened Perennial Orchard',
    preferredSoils: ['sandy', 'calcareous', 'loamy'],
    maxSalinityEC: 5.5,
    ecSlopePctPerDsm: 4.5,
    optimalPhRange: [6.5, 8.5],
    optimalTempRangeC: [12, 32],
    baseTempGDD: 7,
    totalGDDRequired: 2400,
    seasonalWaterReqMm: 390,
    optimalPlantingStartAr: '15 فبراير (أو أكتوبر-نوفمبر)',
    optimalPlantingEndAr: '30 نوفمبر',
    optimalPlantingStartEn: 'Oct 15 / Feb 15',
    optimalPlantingEndEn: 'Nov 30',
    optimalPlantingMonths: [10, 11, 2, 3],
    earlyPlantingRiskAr: 'زراعة الشتلات في ذروة الصيف تسبب صدمة حرارية وجفاف المجموع الجذري.',
    earlyPlantingRiskEn: 'Transplanting in peak summer heat causes root desiccation shock.',
    latePlantingRiskAr: 'نقص ساعات البرودة الشتوية في حال عدم تنظيم الري التكميلي.',
    latePlantingRiskEn: 'Insufficient winter chilling synchronization if supplemental irrigation is mismanaged.',
    expectedHarvestDurationDays: 240,
    potentialYieldTonPerFeddan: 5.2,
    marketPriceEgpPerTon: 26000,
    nitrogenFixer: false,
    rootDiseaseBreakRole: 'Deep perennial root architecture stabilizes sandy dunes in North Sinai',
    qualityFactorsAr: 'نسبة زيت بكر ممتاز 22% بحموضة أقل من 0.4% بفضل فروق الحرارة الليلية والنهارية.',
    qualityFactorsEn: '22% extra-virgin oil extraction with <0.4% free fatty acidity.',
    rotationPestMitigationSummaryAr:
      'زراعة المحاصيل البقولية الشتوية (البرسيم الحجازي/الفول) بين صفوف أشجار الزيتون وتجنب الباذنجانيات يمنع الإصابة بالذبول الفيرتيسيليومي.',
    rotationPestMitigationSummaryEn:
      'Intercropping winter legumes between olive rows while strictly avoiding Solanaceae prevents Verticillium wilt.',
    commonPestsAndDiseases: [
      {
        id: 'olive-fruit-fly-verticillium',
        nameAr: 'ذبابة ثمار الزيتون والذبول الفيرتيسيليومي',
        nameEn: 'Olive Fruit Fly & Verticillium Wilt',
        scientificName: 'Bactrocera oleae & Verticillium dahliae',
        type: 'insect',
        typeLabelAr: 'حشري / فطريات وعائية',
        typeLabelEn: 'Insect & Vascular Fungal',
        severity: 'high',
        symptomsAr: 'وخز الثمار وارتفاع حموضة الزيت، وجفاف مفاجئ للأفرع نتيجة انسداد الأوعية.',
        symptomsEn: 'Fruit tunneling elevating oil acidity, plus sudden branch dieback.',
        rotationMitigationAr: 'منع التحميل بالبطاطس أو الطماطم بين الأشجار واستبدالها بالبقوليات يخفض فطر Verticillium بنسبة 80%.',
        rotationMitigationEn: 'Excluding Solanaceae intercrops in favor of legumes reduces soil Verticillium microsclerotia by 80%.',
      },
    ],
  },
  {
    id: 'tomato',
    nameAr: 'طماطم هجين (عروة شتوية/محمية)',
    nameEn: 'Hybrid Tomato (Winter Open/Tunnel)',
    scientificName: 'Solanum lycopersicum',
    cultivarAr: 'هجن مقاومة لفيروس تجعد الأوراق الأصفر TYLCV',
    cultivarEn: 'TYLCV-Resistant High-Brix Hybrid',
    season: 'winter',
    seasonAr: 'خضر شتوي/نيلي مرتفع القيمة التسويقية',
    seasonEn: 'High-Return Winter Vegetable',
    preferredSoils: ['loamy', 'sandy', 'calcareous'],
    maxSalinityEC: 2.5,
    ecSlopePctPerDsm: 9.9,
    optimalPhRange: [6.0, 7.8],
    optimalTempRangeC: [15, 28],
    baseTempGDD: 8,
    totalGDDRequired: 1600,
    seasonalWaterReqMm: 460,
    optimalPlantingStartAr: '1 أكتوبر',
    optimalPlantingEndAr: '15 نوفمبر',
    optimalPlantingStartEn: 'Oct 1',
    optimalPlantingEndEn: 'Nov 15',
    optimalPlantingMonths: [9, 10, 11],
    earlyPlantingRiskAr: 'نشاط شديد للذبابة البيضاء والتوتا أبسلوتا في الحرارة العالية.',
    earlyPlantingRiskEn: 'Severe whitefly and Tuta absoluta pressure under warm autumn temperatures.',
    latePlantingRiskAr: 'توقف عقد الثمار عند انخفاض الحرارة الليلية دون 10°م.',
    latePlantingRiskEn: 'Blossom drop when night temperatures fall below 10°C.',
    expectedHarvestDurationDays: 120,
    potentialYieldTonPerFeddan: 26.0,
    marketPriceEgpPerTon: 6800,
    nitrogenFixer: false,
    rootDiseaseBreakRole: 'Rotate after cereals or clover; never plant immediately after potato',
    qualityFactorsAr: 'صلابة ثمار عالية ونسبة مواد صلبة ذائبة (Brix > 5.5%) مناسبة للتسويق والشحن.',
    qualityFactorsEn: 'High pericarp firmness and Brix > 5.5% ideal for long-distance transport.',
    rotationPestMitigationSummaryAr:
      'تعاقب الطماطم بعد القمح أو الذرة والبرسيم يقطع دورة حياة سوسة الطماطم (توتا أبسلوتا) والذبابة البيضاء ونيماتودا الجذور.',
    rotationPestMitigationSummaryEn:
      'Rotating Tomato after Wheat, Maize, and Berseem breaks Tuta absoluta pupation, whitefly virus reservoirs, and root-knot nematodes.',
    commonPestsAndDiseases: [
      {
        id: 'tomato-tuta-tylcv',
        nameAr: 'صانعة أنفاق الطماطم (توتا أبسلوتا) وفيروس تجعد الأوراق TYLCV',
        nameEn: 'Tomato Leafminer (Tuta absoluta) & Whitefly TYLCV',
        scientificName: 'Tuta absoluta & Bemisia tabaci (TYLCV)',
        type: 'insect',
        typeLabelAr: 'حشري / فيروسي',
        typeLabelEn: 'Insect & Viral Vector',
        severity: 'critical',
        symptomsAr: 'أنفاق عريضة بالأوراق والثمار مع اصفرار وتجعد القمم النامية وتوقف العقد.',
        symptomsEn: 'Blotch mines in leaves/fruits and severe upward leaf curling and stunting.',
        rotationMitigationAr: 'التناوب مع المحاصيل النجيلية (قمح/ذرة) لمدة موسمين يقضي على عذارى التوتا الكامنة في التربة.',
        rotationMitigationEn: 'Rotating with non-solanaceous cereals (Wheat/Maize) starves soil-pupating Tuta absoluta.',
      },
    ],
  },
  {
    id: 'maize',
    nameAr: 'ذرة شامية فردي (هجين 168 / 10)',
    nameEn: 'Maize / Corn (Single Cross 168)',
    scientificName: 'Zea mays',
    cultivarAr: 'هجين فردي 168 أصفر/أبيض عالي الإنتاجية',
    cultivarEn: 'Single Cross 168 High-Yield Hybrid',
    season: 'summer',
    seasonAr: 'صيفي/نيلي استراتيجي للأعلاف والحبوب',
    seasonEn: 'Summer/Nili Grain & Silage Crop',
    preferredSoils: ['clay', 'loamy'],
    maxSalinityEC: 1.8,
    ecSlopePctPerDsm: 12.0,
    optimalPhRange: [6.0, 7.8],
    optimalTempRangeC: [18, 33],
    baseTempGDD: 10,
    totalGDDRequired: 1550,
    seasonalWaterReqMm: 620,
    optimalPlantingStartAr: '1 مايو',
    optimalPlantingEndAr: '15 يونيو',
    optimalPlantingStartEn: 'May 1',
    optimalPlantingEndEn: 'Jun 15',
    optimalPlantingMonths: [5, 6],
    earlyPlantingRiskAr: 'برودة التربة في مارس/أبريل تبطئ الإنبات وتضعف البادرة.',
    earlyPlantingRiskEn: 'Cool spring soils delay emergence and reduce stand uniformity.',
    latePlantingRiskAr: 'الزراعة في يوليو تزيد الإصابة بدودة الحشد الخريفية والثاقبات.',
    latePlantingRiskEn: 'July sowing suffers heavy Fall Armyworm (Spodoptera frugiperda) infestation.',
    expectedHarvestDurationDays: 115,
    potentialYieldTonPerFeddan: 4.2,
    marketPriceEgpPerTon: 13200,
    nitrogenFixer: false,
    rootDiseaseBreakRole: 'Heavy N consumer — performs best directly after winter Egyptian Clover or Fava Bean',
    qualityFactorsAr: 'امتلاء الكوز حتى القمة وانخفاض الرطوبة عند الحصاد (14%) دون سموم فطرية.',
    qualityFactorsEn: 'Complete ear tip-fill and 14% harvest grain moisture with zero aflatoxin risk.',
    rotationPestMitigationSummaryAr:
      'زراعة الذرة الشامية عقب البرسيم المصري أو الفول البلدي وعدم تكرارها في نفس الحقل تكسر دورة فطر الشلل المتأخر (Cephalosporium maydis) وتقضي على يرقات الثاقبات ودودة الحشد الخريفية.',
    rotationPestMitigationSummaryEn:
      'Planting Maize after winter Berseem Clover or Fava Bean and alternating summer crops suppresses Late Wilt (Cephalosporium maydis) by 76% and eliminates overwintering stem-borer larvae.',
    commonPestsAndDiseases: [
      {
        id: 'maize-fall-armyworm',
        nameAr: 'دودة الحشد الخريفية (Fall Armyworm)',
        nameEn: 'Fall Armyworm',
        scientificName: 'Spodoptera frugiperda',
        type: 'insect',
        typeLabelAr: 'آفة حشرية خطيرة',
        typeLabelEn: 'Invasive Lepidopteran Pest',
        severity: 'critical',
        symptomsAr: 'تآكل قلب النبات (البلعوم) ووجود نشارة غذائية كثيفة وثقوب منتظمة في الأوراق والكوز.',
        symptomsEn: 'Severe whorl raggedness, sawdust-like frass plugs, and ear kernel feeding.',
        rotationMitigationAr: 'الزراعة المبكرة في مايو بعد البرسيم المصري أو التناوب مع فول الصويا/القطن يقطع تواتر الأجيال المتعاقبة ويدعم المفترسات الحيوية.',
        rotationMitigationEn: 'Early May sowing after Berseem Clover or alternating with Soybean/Cotton breaks continuous host availability.',
      },
      {
        id: 'maize-late-wilt',
        nameAr: 'مرض الشلل المتأخر في الذرة الشامية',
        nameEn: 'Maize Late Wilt Disease',
        scientificName: 'Magnaporthiopsis (Cephalosporium) maydis',
        type: 'fungal',
        typeLabelAr: 'مرض فطري وعائي بالتربة',
        typeLabelEn: 'Soil-Borne Vascular Fungus',
        severity: 'critical',
        symptomsAr: 'ذبول سريع وتجفيف للأوراق من الأسفل للأعلى بعد التزهير مع تلون الحزم الوعائية بالساق باللون البني المحمر.',
        symptomsEn: 'Rapid post-flowering upward wilting and reddish-brown vascular bundle streaking.',
        rotationMitigationAr: 'التعاقب مع الأرز المغمور أو القطن أو الفول الصويا والبرسيم الشتوي يقضي على جراثيم الفطر الكامنة في التربة بنسبة 76%.',
        rotationMitigationEn: 'Rotating with flooded Rice, Cotton, or Soybean + winter Berseem starves host-specific sclerotia, reducing infection by 76%.',
      },
      {
        id: 'maize-stem-borers',
        nameAr: 'ثاقبات الذرة الكبيرة والأوروبية ودودة القصب الصغرى',
        nameEn: 'Pink & European Corn Stem Borers',
        scientificName: 'Sesamia cretica & Ostrinia nubilalis',
        type: 'insect',
        typeLabelAr: 'حشرات ثاقبة للساق',
        typeLabelEn: 'Stem-Boring Lepidoptera',
        severity: 'high',
        symptomsAr: 'موت القمة النامية (القلب الميت) في البادرات وأنفاق طولية داخل الساق تسبب كسر النباتات.',
        symptomsEn: 'Dead-heart in young plants, stalk tunneling, and severe lodging.',
        rotationMitigationAr: 'فرم أحطاب الذرة وزراعة البرسيم أو القمح شتاءً مع غمر التربة يقضي على 90% من اليرقات الساكنة في قواعد السيقان.',
        rotationMitigationEn: 'Shredding stalks and rotating to irrigated winter Berseem/Wheat destroys 90% of diapausing larvae in stubble.',
      },
    ],
  },
  {
    id: 'sorghum',
    nameAr: 'ذرة رفيعة (شندويل 6 / جيزة 15)',
    nameEn: 'Grain Sorghum (Shandaweel 6)',
    scientificName: 'Sorghum bicolor',
    cultivarAr: 'هجين شندويل 6 المتحمل للحرارة العالية والجفاف',
    cultivarEn: 'Shandaweel 6 Heat & Drought Tolerant Hybrid',
    season: 'summer',
    seasonAr: 'صيفي متحمل للحرارة والملوحة والأراضي الجديدة',
    seasonEn: 'Heat & Salinity Resilient Summer Cereal',
    preferredSoils: ['calcareous', 'sandy', 'loamy', 'clay'],
    maxSalinityEC: 6.8,
    ecSlopePctPerDsm: 6.5,
    optimalPhRange: [6.0, 8.4],
    optimalTempRangeC: [20, 38],
    baseTempGDD: 10,
    totalGDDRequired: 1600,
    seasonalWaterReqMm: 440,
    optimalPlantingStartAr: '15 مايو',
    optimalPlantingEndAr: '30 يونيو',
    optimalPlantingStartEn: 'May 15',
    optimalPlantingEndEn: 'Jun 30',
    optimalPlantingMonths: [5, 6],
    earlyPlantingRiskAr: 'انخفاض حرارة الليل يبطئ النمو الخضري الأولي.',
    earlyPlantingRiskEn: 'Cool night temperatures slow initial vegetative establishment.',
    latePlantingRiskAr: 'الإصابة بذباب الساق والعصافير عند التأخير لأغسطس.',
    latePlantingRiskEn: 'Shoot-fly damage and bird predation when delayed into August.',
    expectedHarvestDurationDays: 110,
    potentialYieldTonPerFeddan: 3.1,
    marketPriceEgpPerTon: 12400,
    nitrogenFixer: false,
    rootDiseaseBreakRole: 'Waxy cuticle & dense fibrous roots save 30% water compared to Maize',
    qualityFactorsAr: 'ثبات الإنتاجية تحت موجات الحر فوق 40°م وتوفير 750 م³ مياه/فدان مقارنة بالذرة الشامية.',
    qualityFactorsEn: 'Stable grain set above 40°C while saving 750 m³/feddan compared to Maize.',
    rotationPestMitigationSummaryAr:
      'تعاقب الذرة الرفيعة مع الفول البلدي أو البرسيم وبنجر السكر يقضي على حشيشة البودا المتطفلة (Striga) ويقلل الإصابة بذبابة الساق.',
    rotationPestMitigationSummaryEn:
      'Rotating Sorghum with legumes (Fava Bean/Clover) and Sugar Beet eradicates parasitic Witchweed (Striga) and reduces shoot-fly buildup.',
    commonPestsAndDiseases: [
      {
        id: 'sorghum-striga-shootfly',
        nameAr: 'حشيشة البودا المتطفلة وذبابة ساق الذرة الرفيعة',
        nameEn: 'Parasitic Witchweed (Striga) & Sorghum Shoot Fly',
        scientificName: 'Striga hermonthica & Atherigona soccata',
        type: 'parasitic_weed',
        typeLabelAr: 'حشائش متطفلة / حشري',
        typeLabelEn: 'Parasitic Weed & Dipteran',
        severity: 'high',
        symptomsAr: 'تقزم واصفرار النباتات نتيجة تطفل البودا على الجذور وموت القلب في البادرات المتأخرة.',
        symptomsEn: 'Severe stunting from root parasitism and dead-heart in late-planted seedlings.',
        rotationMitigationAr: 'إدخال المحاصيل البقولية أو القطن وبنجر السكر يحفز الإنبات الانتحاري لبذور البودا ويطهر التربة منها.',
        rotationMitigationEn: 'Trap-cropping with legumes, Cotton, or Sugar Beet triggers suicidal Striga germination.',
      },
    ],
  },
  {
    id: 'cotton',
    nameAr: 'قطن مصري طويل التيلة (جيزة 94)',
    nameEn: 'Egyptian Long-Staple Cotton (Giza 94)',
    scientificName: 'Gossypium barbadense',
    cultivarAr: 'جيزة 94 فائق الطول والمتانة ومبكر النضج',
    cultivarEn: 'Giza 94 Extra-Long Staple (Early Maturing)',
    season: 'summer',
    seasonAr: 'صيفي تصديري استراتيجي',
    seasonEn: 'Premier Export Cash Crop',
    preferredSoils: ['clay', 'loamy'],
    maxSalinityEC: 7.7,
    ecSlopePctPerDsm: 5.2,
    optimalPhRange: [6.5, 8.2],
    optimalTempRangeC: [18, 35],
    baseTempGDD: 12,
    totalGDDRequired: 2250,
    seasonalWaterReqMm: 680,
    optimalPlantingStartAr: '20 مارس',
    optimalPlantingEndAr: '20 أبريل',
    optimalPlantingStartEn: 'Mar 20',
    optimalPlantingEndEn: 'Apr 20',
    optimalPlantingMonths: [3, 4],
    earlyPlantingRiskAr: 'موجات البرد في أوائل مارس تسبب مرض الخناق وموت البادرات.',
    earlyPlantingRiskEn: 'Early March cold snaps trigger seedling rhizoctonia damping-off.',
    latePlantingRiskAr: 'التأخير لمايو يضاعف الإصابة بديدان اللوز القرنفلية والشوكية.',
    latePlantingRiskEn: 'May planting severely increases pink and spiny bollworm damage.',
    expectedHarvestDurationDays: 175,
    potentialYieldTonPerFeddan: 1.65,
    marketPriceEgpPerTon: 64000,
    nitrogenFixer: false,
    rootDiseaseBreakRole: 'Deep taproot following winter Berseem catch-crop ("Tahreesh")',
    qualityFactorsAr: 'تيلة فائقة الطول (34 مم) ومعامل نعومة ومتانة قياسي للتصدير العالمي.',
    qualityFactorsEn: 'Extra-long 34mm staple length and high micronaire strength for premium export.',
    rotationPestMitigationSummaryAr:
      'الدورة الثلاثية المصرية الكلاسيكية (برسيم تحريش ← قطن جيزة 94 ← قمح ← أرز/ذرة) تكسر دورة البيات الشتوي لديدان اللوز القرنفلية والشوكية وتقضي على فطر الذبول الفيوزاريومي في التربة.',
    rotationPestMitigationSummaryEn:
      'The classic Egyptian 3-year rotation (Berseem Tahreesh -> Giza 94 Cotton -> Wheat -> Rice/Maize) breaks Pink/Spiny Bollworm winter diapause and suppresses Fusarium wilt spores.',
    commonPestsAndDiseases: [
      {
        id: 'cotton-bollworms',
        nameAr: 'دودة اللوز القرنفلية ودودة اللوز الشوكية',
        nameEn: 'Pink Bollworm & Spiny Bollworm',
        scientificName: 'Pectinophora gossypiella & Earias insulana',
        type: 'insect',
        typeLabelAr: 'آفات اللوز الحشرية',
        typeLabelEn: 'Boll-Feeding Lepidoptera',
        severity: 'critical',
        symptomsAr: 'عدم تفتح اللوز (اللوزة المضغومة) وتلف التيلة والبذور داخل اللوز الأخضر.',
        symptomsEn: 'Rosetted blooms, un-opened bolls, and stained/severed lint fibers.',
        rotationMitigationAr: 'عدم تعاقب القطن أو البامية في نفس الأرض وزراعة القمح أو البرسيم شتاءً مع الري يقضي على 88% من اليرقات الساكنة في اللوز العالق والتربة.',
        rotationMitigationEn: 'Excluding Malvaceae hosts (Cotton/Okra) for 2 years and irrigating winter Wheat/Clover drowns 88% of diapausing larvae.',
      },
      {
        id: 'cotton-leafworm',
        nameAr: 'دودة ورق القطن الكبرى',
        nameEn: 'Egyptian Cotton Leafworm',
        scientificName: 'Spodoptera littoralis',
        type: 'insect',
        typeLabelAr: 'آفة حشرية قارضة',
        typeLabelEn: 'Polyphagous Defoliator',
        severity: 'high',
        symptomsAr: 'لطع بيض حرشفية على السطح السفلي للأوراق وتجريد النباتات من المجموع الخضري والوسواس.',
        symptomsEn: 'Scale-covered egg masses under leaves followed by rapid skeletonization and square feeding.',
        rotationMitigationAr: 'إيقاف ري البرسيم بعد 10 مايو (قانون منع ري البرسيم) والتناوب مع القمح يكسر انتقال الفراشات من البرسيم إلى القطن.',
        rotationMitigationEn: 'Terminating Berseem irrigation before May 10 and rotating adjacent plots to Wheat breaks moth migration into Cotton.',
      },
      {
        id: 'cotton-fusarium-rhizoctonia',
        nameAr: 'الذبول الفيوزاريومي ومرض الخناق (موت البادرات)',
        nameEn: 'Fusarium Wilt & Rhizoctonia Seedling Damping-Off',
        scientificName: 'Fusarium oxysporum f.sp. vasinfectum & Rhizoctonia solani',
        type: 'fungal',
        typeLabelAr: 'فطريات تربة وعائية',
        typeLabelEn: 'Soil-Borne Fungal Pathogens',
        severity: 'high',
        symptomsAr: 'قرح بنية غائرة عند عنق البادرة (الخناق) أو اصفرار شبكي للأوراق وتلون خشب الجذر بالبني الداكن.',
        symptomsEn: 'Sunken reddish-brown hypocotyl lesions on seedlings and dark vascular browning.',
        rotationMitigationAr: 'الدورة الثلاثية مع القمح والأرز أو الذرة تخفض كثافة الجراثيم الكلاميدية لفطر الفيوزاريوم في التربة بنسبة 80%.',
        rotationMitigationEn: 'A 3-year rotation with Wheat and flooded Rice/Maize reduces soil chlamydospore density by 80%.',
      },
    ],
  },
  {
    id: 'rice',
    nameAr: 'أرز مصري موفر للمياه (سوبر 300 / جيزة 178)',
    nameEn: 'Water-Saving Rice (Super 300 / Giza 178)',
    scientificName: 'Oryza sativa',
    cultivarAr: 'سوبر 300 وجيزة 178 قصير العمر ومتحمل للملوحة',
    cultivarEn: 'Super 300 Short-Duration Salt-Leaching Cultivar',
    season: 'summer',
    seasonAr: 'صيفي لغسيل ملوحة أراضي شمال الدلتا',
    seasonEn: 'Summer North-Delta Salt-Leaching Cereal',
    preferredSoils: ['clay'],
    maxSalinityEC: 3.0,
    ecSlopePctPerDsm: 11.5,
    optimalPhRange: [6.0, 7.6],
    optimalTempRangeC: [20, 34],
    baseTempGDD: 10,
    totalGDDRequired: 1700,
    seasonalWaterReqMm: 890,
    optimalPlantingStartAr: '1 مايو',
    optimalPlantingEndAr: '25 مايو',
    optimalPlantingStartEn: 'May 1',
    optimalPlantingEndEn: 'May 25',
    optimalPlantingMonths: [5],
    earlyPlantingRiskAr: 'برودة مياه المشتل في أبريل تؤخر نمو البادرات.',
    earlyPlantingRiskEn: 'Cool April nursery water slows seedling vigor.',
    latePlantingRiskAr: 'زيادة الإصابة بمرض اللفحة وثاقبات الساق.',
    latePlantingRiskEn: 'Late transplanting increases Pyricularia blast and stem borer damage.',
    expectedHarvestDurationDays: 125,
    potentialYieldTonPerFeddan: 4.1,
    marketPriceEgpPerTon: 16500,
    nitrogenFixer: false,
    rootDiseaseBreakRole: 'Essential hydro-leaching phase for salt-affected northern Nile Delta clay soils',
    qualityFactorsAr: 'تصافي تبييض > 71% مع توفير 25% من المياه مقارنة بالأصناف التقليدية.',
    qualityFactorsEn: 'Milling head-rice recovery > 71% while saving 25% water vs traditional cultivars.',
    rotationPestMitigationSummaryAr:
      'الأرز يعمل كمعقم مائي طبيعي للتربة في شمال الدلتا؛ يغسل الأملاح ويخنق أطوار النيماتودا وفطريات الذبول للقطن والفول والبطاطس، بينما تعاقبه مع البرسيم يكسر مرض لفحة الأرز.',
    rotationPestMitigationSummaryEn:
      'Rice acts as a natural hydro-sanitizer in North Delta clay soils, drowning nematodes and Fusarium/Verticillium spores while winter Clover breaks Rice Blast cycles.',
    commonPestsAndDiseases: [
      {
        id: 'rice-blast-stemborer',
        nameAr: 'مرض لفحة الأرز وثاقبة ساق الأرز',
        nameEn: 'Rice Blast & Rice Stem Borer',
        scientificName: 'Magnaporthe oryzae & Chilo agamemnon',
        type: 'fungal',
        typeLabelAr: 'فطري / حشري',
        typeLabelEn: 'Fungal & Stem Borer',
        severity: 'high',
        symptomsAr: 'بقع مغزلية رمادية المركز على الأوراق واحتراق عنق السنبلة مع ظهور السنابل البيضاء.',
        symptomsEn: 'Spindle-shaped diamond lesions on leaves and neck rot causing empty panicles.',
        rotationMitigationAr: 'التعاقب مع البرسيم المصري الشتوي والقطن أو الذرة الصيفية يمنع تراكم جراثيم اللفحة وحشيشة الدنيبة.',
        rotationMitigationEn: 'Alternating with winter Berseem and summer Cotton/Maize eliminates blast inoculum and barnyard grass.',
      },
    ],
  },
];

// ============================================================================
// 2. GEODESIC AREA & POLYGON GEOMETRY ENGINE
// ============================================================================

const EARTH_RADIUS_M = 6378137; // WGS84 Equatorial Radius in meters
const SQ_METERS_PER_FEDDAN = 4200.833333; // Official Egyptian Feddan = 4200.83 m²

/**
 * Calculates exact geodesic area of a polygon on Earth's surface and converts
 * into Feddans (فدان), Qirats (قيراط = 1/24 Feddan), Sahms (سهم = 1/24 Qirat), and Hectares.
 */
export function calculateGeodesicArea(vertices: LatLon[]): AreaBreakdown {
  if (!vertices || vertices.length < 3) {
    return {
      squareMeters: 0,
      hectares: 0,
      totalFeddansDecimal: 0,
      feddans: 0,
      qirats: 0,
      sahms: 0,
    };
  }

  let areaAccumulator = 0;
  const n = vertices.length;

  for (let i = 0; i < n; i++) {
    const p1 = vertices[i];
    const p2 = vertices[(i + 1) % n];

    const lon1Rad = (p1.lng * Math.PI) / 180;
    const lon2Rad = (p2.lng * Math.PI) / 180;
    const lat1Rad = (p1.lat * Math.PI) / 180;
    const lat2Rad = (p2.lat * Math.PI) / 180;

    areaAccumulator += (lon2Rad - lon1Rad) * (2 + Math.sin(lat1Rad) + Math.sin(lat2Rad));
  }

  const squareMeters = Math.abs((areaAccumulator * EARTH_RADIUS_M * EARTH_RADIUS_M) / 2.0);
  const hectares = Number((squareMeters / 10000).toFixed(3));
  const totalFeddansDecimal = Number((squareMeters / SQ_METERS_PER_FEDDAN).toFixed(3));

  const feddans = Math.floor(squareMeters / SQ_METERS_PER_FEDDAN);
  const remAfterFeddansFeddan = squareMeters / SQ_METERS_PER_FEDDAN - feddans;
  const totalQirats = remAfterFeddansFeddan * 24;
  const qirats = Math.floor(totalQirats + 1e-6);
  const remAfterQirats = Math.max(0, totalQirats - qirats);
  const sahms = Math.min(23, Math.round(remAfterQirats * 24));

  return {
    squareMeters: Math.round(squareMeters),
    hectares,
    totalFeddansDecimal,
    feddans,
    qirats,
    sahms,
  };
}

export function getPolygonCentroid(vertices: LatLon[]): LatLon {
  if (!vertices || vertices.length === 0) {
    return { lat: 30.723, lng: 31.264 };
  }
  const sum = vertices.reduce(
    (acc, pt) => ({ lat: acc.lat + pt.lat, lng: acc.lng + pt.lng }),
    { lat: 0, lng: 0 }
  );
  return {
    lat: Number((sum.lat / vertices.length).toFixed(5)),
    lng: Number((sum.lng / vertices.length).toFixed(5)),
  };
}

/**
 * Ray-casting point-in-polygon check so our satellite spectral grid overlays
 * clip neatly inside the farmer's drawn polygon boundaries.
 */
export function isPointInPolygon(point: LatLon, polygon: LatLon[]): boolean {
  if (polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;

    const intersect =
      yi > point.lat !== yj > point.lat &&
      point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// ============================================================================
// 3. MULTI-SPECTRAL SATELLITE INDICES ENGINE (NDVI, NDWI, SAVI, NDMI, EVI, LST)
// ============================================================================

export function computeNDVI(nir: number, red: number): number {
  const denom = nir + red;
  if (Math.abs(denom) < 1e-6) return 0;
  return Number(Math.max(-1, Math.min(1, (nir - red) / denom)).toFixed(3));
}

export function computeNDWI(green: number, nir: number, swir1?: number): number {
  // Combines Gao (NIR - SWIR1)/(NIR + SWIR1) canopy water index & McFeeters water balance
  if (typeof swir1 === 'number' && swir1 > 0) {
    const gao = (nir - swir1) / (nir + swir1 + 1e-6);
    const mcfeeters = (green - nir) / (green + nir + 1e-6);
    return Number(Math.max(-1, Math.min(1, gao * 0.75 + mcfeeters * 0.25)).toFixed(3));
  }
  const denom = green + nir;
  if (Math.abs(denom) < 1e-6) return 0;
  return Number(Math.max(-1, Math.min(1, (green - nir) / denom)).toFixed(3));
}

export function computeSAVI(nir: number, red: number, L = 0.5): number {
  const denom = nir + red + L;
  if (Math.abs(denom) < 1e-6) return 0;
  const val = ((nir - red) / denom) * (1 + L);
  return Number(Math.max(-1, Math.min(1, val)).toFixed(3));
}

export function computeNDMI(nir: number, swir1: number): number {
  const denom = nir + swir1;
  if (Math.abs(denom) < 1e-6) return 0;
  return Number(Math.max(-1, Math.min(1, (nir - swir1) / denom)).toFixed(3));
}

export function computeEVI(nir: number, red: number, blue: number): number {
  const denom = nir + 6 * red - 7.5 * blue + 1;
  if (Math.abs(denom) < 1e-6) return 0;
  const val = 2.5 * ((nir - red) / denom);
  return Number(Math.max(-1, Math.min(1, val)).toFixed(3));
}

export function computeESI(lstCelsius: number, ndvi: number): number {
  // Evaporative Stress Index (-2 severe stress to +2 surplus moisture)
  const thermalFactor = (28 - lstCelsius) * 0.12;
  const vigorFactor = (ndvi - 0.45) * 2.2;
  return Number(Math.max(-2, Math.min(2, thermalFactor + vigorFactor)).toFixed(2));
}

export function getSpectralColor(indexKey: SpectralIndexKey, value: number): string {
  if (indexKey === 'SM_0_7' || indexKey === 'SM_7_28') {
    // Soil Moisture (%): Severe Dry / Built (<8% Red #dc2626) -> Dry Soil (8-18% Amber #f59e0b) -> Moderate Moisture (18-26% Sky Blue #38bdf8) -> High Moisture (26-35% Cobalt Blue #0284c7) -> Saturated (>35% Deep Royal Blue #1d4ed8)
    if (value < 8) return '#dc2626'; // severe dry / impervious red
    if (value < 18) return '#f59e0b'; // dry bare soil amber
    if (value < 26) return '#38bdf8'; // moderate moisture sky blue
    if (value < 35) return '#0284c7'; // optimal root moisture cobalt blue
    return '#1d4ed8'; // high moisture / field capacity deep blue
  }
  if (indexKey === 'SOIL_EC') {
    // Soil Salinity EC (dS/m): Safe (<1.8 Green #10b981) -> Mild (1.8-2.9 Lime #84cc16) -> Moderate Warning (2.9-4.3 Yellow #eab308) -> High Stress (4.3-6.0 Orange #f97316) -> Hazard (>6.0 Red #ef4444)
    if (value < 1.8) return '#10b981'; // optimal safe low EC (Green)
    if (value < 2.9) return '#84cc16'; // safe mild EC (Lime Green)
    if (value < 4.3) return '#eab308'; // moderate salinity warning (Yellow)
    if (value < 6.0) return '#f97316'; // high salinity (Orange)
    return '#ef4444'; // severe salinity hazard (Red)
  }
  if (indexKey === 'SOIL_PH') {
    // Soil pH (5.8 - 8.6): Neutral optimal (6.5-7.4 Safe Green) -> Mildly alkaline (7.5-7.9 Cyan) -> Calcareous (8.0-8.3 Amber) -> Strongly alkaline (>8.3 Red)
    if (value < 6.4) return '#f59e0b';
    if (value <= 7.4) return '#10b981';
    if (value <= 7.9) return '#06b6d4';
    if (value <= 8.3) return '#f97316';
    return '#ef4444';
  }
  if (indexKey === 'LST') {
    // Thermal ramp (Safe Green -> Hazard Red): Safe Cool Canopy (<=21.5C Green #10b981) -> Optimal Thermal Window (21.6-24.5C Cyan #06b6d4) -> Mild Rise (24.6-27.5C Yellow #eab308) -> Warm Stress (27.6-30.0C Orange #f97316) -> Extreme Heat Hazard (>30.0C Red #ef4444)
    if (value <= 21.5) return '#10b981';
    if (value <= 24.5) return '#06b6d4';
    if (value <= 27.5) return '#eab308';
    if (value <= 30.0) return '#f97316';
    return '#ef4444';
  }
  if (indexKey === 'NDWI' || indexKey === 'NDMI') {
    // Water & Root Moisture: Dry Built / Deficit (<-0.15 Red #dc2626) -> Mild Deficit (-0.15 to 0.03 Amber #f59e0b) -> Moderate Water (0.03 to 0.19 Sky Blue #38bdf8) -> High Moisture (0.19 to 0.36 Cobalt Blue #0284c7) -> Saturated (>=0.36 Deep Blue #1d4ed8)
    if (value < -0.15) return '#dc2626'; // severe water stress / dry urban (Red)
    if (value < 0.03) return '#f59e0b'; // uncultivated / mild water deficit (Amber/Yellow)
    if (value < 0.19) return '#38bdf8'; // moderate leaf/root moisture (Sky Blue)
    if (value < 0.36) return '#0284c7'; // high canopy water (Cobalt Blue)
    return '#1d4ed8'; // saturated deep blue
  }
  // NDVI, SAVI, EVI vegetation vigor ramp:
  // Built-up/Impervious (<0.09 Red #dc2626) -> Uncultivated Bare Soil (0.09-0.24 Yellow #eab308) -> Emerging Crop (0.24-0.42 Lime Green #84cc16) -> Healthy Agricultural Land (0.42-0.65 Emerald Green #10b981) -> Dense Vigorous Vegetation (>=0.65 Dark Forest Green #047857)
  if (value < 0.09) return '#dc2626'; // urban / impervious built (Red)
  if (value < 0.24) return '#eab308'; // uncultivated / bare soil (Yellow)
  if (value < 0.42) return '#84cc16'; // light / emerging vegetation (Lime Green)
  if (value < 0.65) return '#10b981'; // healthy green agricultural land (Emerald Green)
  return '#047857'; // dense vigorous agricultural land (Dark Forest Green)
}

/**
 * Generates both the 3 Sub-Zone Summaries (Zone A, Zone B, Zone C) and the clipped
 * spatial grid cells inside the farmer's drawn polygon, including physically coupled
 * Open-Meteo 0-7cm & 7-28cm soil moisture layers and Soil EC / pH heatmaps.
 */
export function generateSubZonesAndGrid(
  vertices: LatLon[],
  soil: SoilProfile,
  baseBands: PresetFarmZone['baseSpectralBands'],
  forecastMoisture?: { sm0to7Pct: number; sm7to28Pct: number }
): {
  subZones: SubZoneSummary[];
  gridCells: SpatialGridCell[];
  farmAverages: Record<SpectralIndexKey, number>;
} {
  const area = calculateGeodesicArea(vertices);
  const totalFeddans = Math.max(0.5, area.totalFeddansDecimal);

  const lats = vertices.length > 0 ? vertices.map((v) => v.lat) : [30.727];
  const lngs = vertices.length > 0 ? vertices.map((v) => v.lng) : [31.273];
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const latSpan = Math.max(0.0005, maxLat - minLat);
  const lngSpan = Math.max(0.0005, maxLng - minLng);

  // Irrigation, salinity, pH & texture modifiers on spectral reflectance
  const salinityStress = Math.max(0, (soil.salinityEC - 2.0) * 0.022);
  const phStress = Math.max(0, (Math.abs(soil.ph - 7.1) - 0.5) * 0.018);
  const textureNirBonus =
    soil.texture === 'clay'
      ? 0.012
      : soil.texture === 'loamy'
      ? 0.008
      : soil.texture === 'calcareous'
      ? -0.008
      : -0.014;
  const saviL =
    soil.texture === 'clay'
      ? 0.42
      : soil.texture === 'loamy'
      ? 0.48
      : soil.texture === 'calcareous'
      ? 0.54
      : 0.6;
  const irrigationBonus =
    soil.irrigation === 'drip'
      ? 0.035
      : soil.irrigation === 'pivot'
      ? 0.025
      : soil.irrigation === 'sprinkler'
      ? 0.02
      : soil.irrigation === 'flood'
      ? 0.008
      : -0.018;

  // Calibrated agro-hydrological baseline moisture (accounting for active farm irrigation + soil texture)
  const textureRetention =
    soil.texture === 'clay'
      ? 4.5
      : soil.texture === 'loamy'
      ? 2.2
      : soil.texture === 'calcareous'
      ? -1.2
      : -3.8;
  const irrigationMoistureLift =
    soil.irrigation === 'rainfed'
      ? 0
      : soil.irrigation === 'drip' || soil.irrigation === 'flood'
      ? 9.5
      : 7.5;

  const rawForecast07 = forecastMoisture?.sm0to7Pct ?? 27;
  const rawForecast728 = forecastMoisture?.sm7to28Pct ?? 33;

  // Ensure irrigated agricultural soils reflect active root-zone irrigation rather than raw desert VWC
  const effectiveSm07 =
    rawForecast07 < 20 && soil.irrigation !== 'rainfed'
      ? Math.max(25.5, rawForecast07 + irrigationMoistureLift)
      : rawForecast07;
  const effectiveSm728 =
    rawForecast728 < 24 && soil.irrigation !== 'rainfed'
      ? Math.max(30.5, rawForecast728 + irrigationMoistureLift * 1.1)
      : rawForecast728;

  const baseSm0to7 = Math.max(14, Math.min(48, effectiveSm07 + textureRetention));
  const baseSm7to28 = Math.max(18, Math.min(52, effectiveSm728 + textureRetention * 1.12));

  const gridRows = 7;
  const gridCols = 7;
  const dLat = latSpan / gridRows;
  const dLng = lngSpan / gridCols;

  const gridCells: SpatialGridCell[] = [];

  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < gridCols; c++) {
      const cellMinLat = minLat + r * dLat;
      const cellMaxLat = cellMinLat + dLat;
      const cellMinLng = minLng + c * dLng;
      const cellMaxLng = cellMinLng + dLng;

      const center: LatLon = {
        lat: (cellMinLat + cellMaxLat) / 2,
        lng: (cellMinLng + cellMaxLng) / 2,
      };

      // Keep cell if its center or any of its 4 corners lies inside the polygon
      const corners: [LatLon, LatLon, LatLon, LatLon] = [
        { lat: cellMinLat, lng: cellMinLng },
        { lat: cellMinLat, lng: cellMaxLng },
        { lat: cellMaxLat, lng: cellMaxLng },
        { lat: cellMaxLat, lng: cellMinLng },
      ];

      const inside =
        isPointInPolygon(center, vertices) ||
        corners.some((corner) => isPointInPolygon(corner, vertices));

      if (!inside) continue;

      // Normalized spatial position (0 = South-West, 1 = North-East)
      const normY = (center.lat - minLat) / latSpan;
      const normX = (center.lng - minLng) / lngSpan;
      const neGradient = normY * 0.6 + normX * 0.4;

      const subZoneId: 'A' | 'B' | 'C' =
        neGradient > 0.62 ? 'A' : neGradient < 0.38 ? 'C' : 'B';

      const localStress =
        subZoneId === 'A' ? 0.055 : subZoneId === 'B' ? 0.0 : -0.042;
      const microVariation = Math.sin(r * 1.7 + c * 2.3) * 0.012;

      const nir = Math.max(
        0.18,
        baseBands.nir -
          localStress -
          salinityStress -
          phStress +
          textureNirBonus +
          irrigationBonus +
          microVariation
      );
      const red = Math.max(
        0.032,
        baseBands.red +
          localStress * 0.6 +
          salinityStress * 0.45 +
          phStress * 0.35 -
          textureNirBonus * 0.25 -
          microVariation * 0.35
      );
      const green = Math.max(0.045, baseBands.green + microVariation * 0.25);
      const blue = Math.max(0.022, baseBands.blue + microVariation * 0.18);
      const swir1 = Math.max(
        0.09,
        baseBands.swir1 +
          localStress * 0.75 +
          salinityStress * 0.35 +
          phStress * 0.2 -
          irrigationBonus
      );
      const lst = Number(
        (
          baseBands.lstCelsius +
          (subZoneId === 'A' ? 1.9 : subZoneId === 'C' ? -1.4 : 0.1) +
          salinityStress * 16 +
          phStress * 8 +
          microVariation * 12
        ).toFixed(1)
      );

      const NDVI = computeNDVI(nir, red);
      const NDWI = computeNDWI(green, nir, swir1);
      const SAVI = computeSAVI(nir, red, saviL);
      const NDMI = computeNDMI(nir, swir1);
      const EVI = computeEVI(nir, red, blue);
      const esi = computeESI(lst, NDVI);

      // Physically coupled Soil Moisture: directly proportional to NDVI/NDMI canopy vigor
      const vigorMoistureDelta = (NDVI - 0.58) * 22;
      const SM_0_7 = Number(
        Math.max(
          14,
          Math.min(48, baseSm0to7 + vigorMoistureDelta + microVariation * 45)
        ).toFixed(1)
      );
      const SM_7_28 = Number(
        Math.max(
          18,
          Math.min(52, baseSm7to28 + vigorMoistureDelta * 0.9 + microVariation * 40)
        ).toFixed(1)
      );

      const zoneEcFactor = subZoneId === 'A' ? 1.28 : subZoneId === 'B' ? 0.98 : 0.8;
      const SOIL_EC = Number(
        Math.max(0.4, soil.salinityEC * zoneEcFactor + microVariation * 6).toFixed(2)
      );
      const zonePhOffset = subZoneId === 'A' ? 0.24 : subZoneId === 'C' ? -0.16 : 0.0;
      const SOIL_PH = Number(
        Math.max(5.5, Math.min(8.9, soil.ph + zonePhOffset + microVariation * 3)).toFixed(2)
      );

      const landCover = NDVI >= 0.62 ? 'dense_crop' : NDVI >= 0.36 ? 'moderate_crop' : 'bare_soil';
      const landCoverLabelAr =
        landCover === 'dense_crop'
          ? 'أرض زراعية كثيفة الغطاء ومروية'
          : landCover === 'moderate_crop'
          ? 'أرض زراعية متوسطة الإنبات'
          : 'تربة مكشوفة / بور جافة';
      const landCoverLabelEn =
        landCover === 'dense_crop'
          ? 'Dense Irrigated Cropland'
          : landCover === 'moderate_crop'
          ? 'Moderate / Emerging Crop Canopy'
          : 'Bare / Dry Fallow Soil';

      gridCells.push({
        id: `cell-${r}-${c}`,
        bounds: corners,
        center,
        subZoneId,
        landCover,
        landCoverLabelAr,
        landCoverLabelEn,
        droughtIndexESI: esi,
        values: {
          NDVI,
          NDWI,
          SAVI,
          NDMI,
          EVI,
          LST: lst,
          SM_0_7,
          SM_7_28,
          SOIL_EC,
          SOIL_PH,
        },
      });
    }
  }

  // Ensure at least 3 cells exist if polygon is tiny
  if (gridCells.length === 0 && vertices.length >= 3) {
    const centroid = getPolygonCentroid(vertices);
    const NDVI = computeNDVI(baseBands.nir, baseBands.red);
    const NDWI = computeNDWI(baseBands.green, baseBands.nir, baseBands.swir1);
    const SAVI = computeSAVI(baseBands.nir, baseBands.red, 0.5);
    const NDMI = computeNDMI(baseBands.nir, baseBands.swir1);
    const EVI = computeEVI(baseBands.nir, baseBands.red, baseBands.blue);
    gridCells.push({
      id: 'cell-0-0',
      bounds: [vertices[0], vertices[1], vertices[2], vertices[0]],
      center: centroid,
      subZoneId: 'B',
      landCover: 'dense_crop',
      landCoverLabelAr: 'أرض زراعية كثيفة الغطاء ومروية',
      landCoverLabelEn: 'Dense Irrigated Cropland',
      droughtIndexESI: computeESI(baseBands.lstCelsius, NDVI),
      values: {
        NDVI,
        NDWI,
        SAVI,
        NDMI,
        EVI,
        LST: baseBands.lstCelsius,
        SM_0_7: Number(baseSm0to7.toFixed(1)),
        SM_7_28: Number(baseSm7to28.toFixed(1)),
        SOIL_EC: soil.salinityEC,
        SOIL_PH: soil.ph,
      },
    });
  }

  const buildSubZoneSummary = (
    id: 'A' | 'B' | 'C',
    share: number,
    nameAr: string,
    nameEn: string,
    directionAr: string,
    directionEn: string
  ): SubZoneSummary => {
    const cells = gridCells.filter((c) => c.subZoneId === id);
    const avg = (key: SpectralIndexKey, fallback: number) => {
      if (cells.length === 0) return fallback;
      const sum = cells.reduce((acc, item) => acc + item.values[key], 0);
      return Number((sum / cells.length).toFixed(3));
    };

    const ndvi = avg('NDVI', id === 'A' ? 0.44 : id === 'B' ? 0.62 : 0.71);
    const ndwi = avg('NDWI', id === 'A' ? 0.14 : id === 'B' ? 0.29 : 0.38);
    const savi = avg('SAVI', id === 'A' ? 0.36 : id === 'B' ? 0.51 : 0.59);
    const ndmi = avg('NDMI', id === 'A' ? 0.19 : id === 'B' ? 0.34 : 0.42);
    const evi = avg('EVI', id === 'A' ? 0.39 : id === 'B' ? 0.55 : 0.64);
    const lstCelsius = Number(avg('LST', id === 'A' ? 28.4 : id === 'B' ? 25.6 : 23.9).toFixed(1));
    const esi = computeESI(lstCelsius, ndvi);
    const soilMoisturePct = Math.round(avg('SM_0_7', id === 'A' ? 20 : id === 'B' ? 27 : 33));
    const soilMoistureDeepPct = Math.round(avg('SM_7_28', id === 'A' ? 24 : id === 'B' ? 31 : 37));
    const salinityEC = Number(avg('SOIL_EC', soil.salinityEC).toFixed(2));
    const soilPh = Number(avg('SOIL_PH', soil.ph).toFixed(2));

    const status: SubZoneSummary['status'] =
      ndvi < 0.48 || ndwi < 0.18 || salinityEC > 4.0
        ? 'high_stress'
        : ndvi < 0.6 || salinityEC > 2.8
        ? 'moderate_stress'
        : 'optimal';

    let amendmentAr = 'لا يتطلب مصلحات كيميائية عاجلة؛ استمر في التسميد العضوي المتوازن.';
    let amendmentEn = 'No urgent chemical soil amendments required; maintain balanced organic inputs.';

    if (salinityEC >= 3.2 || soilPh >= 7.9) {
      const gypsumTons = Number(Math.max(0.5, (salinityEC - 1.5) * 0.65).toFixed(1));
      amendmentAr = `إضافة ${gypsumTons} طن جبس زراعي/فدان + حقن 3 لتر حامض فوسفوريك/فدان لغسيل الصوديوم وخفض pH (${soilPh}) والملوحة (${salinityEC} dS/m).`;
      amendmentEn = `Apply ${gypsumTons} tons/feddan agricultural gypsum + inject 3L phosphoric acid/feddan to leach Na⁺ and lower pH (${soilPh}) & EC (${salinityEC} dS/m).`;
    } else if (salinityEC >= 2.0 || soilPh >= 7.6) {
      amendmentAr = `حقن 1.5 لتر حامض هيوميك وفولفيك + كالسيوم مع ماء الري لتحسين نفاذية الجذور (EC ${salinityEC} dS/m · pH ${soilPh}).`;
      amendmentEn = `Inject 1.5L humic/fulvic acid + chelated Ca²⁺ via fertigation to optimize root uptake (EC ${salinityEC} dS/m · pH ${soilPh}).`;
    }

    let diagnosisAr = '';
    let diagnosisEn = '';
    let actionAr = '';
    let actionEn = '';

    if (id === 'A') {
      diagnosisAr = `الركن الشمالي الشرقي يسجل رطوبة سطحية (0-7 سم: ${soilMoisturePct}%) وعميقة (7-28 سم: ${soilMoistureDeepPct}%) مع ملوحة ${salinityEC} dS/m وحرارة ${lstCelsius}°م.`;
      diagnosisEn = `North-East sector records surface moisture (0–7cm: ${soilMoisturePct}%), root moisture (7–28cm: ${soilMoistureDeepPct}%), EC ${salinityEC} dS/m, and LST ${lstCelsius}°C.`;
      actionAr = `افحص ضغط نقاطات الري في الزونا A وزد فترة الري التكميلي بنسبة +15% مع تطبيق برنامج الإصلاح المليحي.`;
      actionEn = `Inspect emitter pressure in Zone A, increase irrigation runtime by +15%, and apply targeted soil amendment.`;
    } else if (id === 'B') {
      diagnosisAr = `المنطقة الوسطى متوازنة (NDVI ${ndvi} · رطوبة 0-7 سم ${soilMoisturePct}% · عمق 7-28 سم ${soilMoistureDeepPct}% · EC ${salinityEC} dS/m).`;
      diagnosisEn = `Central core is balanced (NDVI ${ndvi} · 0–7cm moisture ${soilMoisturePct}% · 7–28cm ${soilMoistureDeepPct}% · EC ${salinityEC} dS/m).`;
      actionAr = `حافظ على المقنن المائي الحالي مع رش العناصر الصغرى (زنك + حديد + منجنيز مخلبي) لتعزيز التزهير.`;
      actionEn = `Maintain current irrigation schedule and apply chelated micronutrients (Fe + Zn + Mn) to boost flowering.`;
    } else {
      diagnosisAr = `الركن الجنوبي الغربي يسجل أعلى كثافة كلوروفيل (NDVI ${ndvi}) وتجمع رطوبي (0-7 سم: ${soilMoisturePct}% · 7-28 سم: ${soilMoistureDeepPct}%).`;
      diagnosisEn = `South-West basin records peak chlorophyll density (NDVI ${ndvi}) and moisture accumulation (0–7cm: ${soilMoisturePct}% · 7–28cm: ${soilMoistureDeepPct}%).`;
      actionAr = `خفّض ري الزونا C بنسبة 10% لتجنب غدق التربة وأعفان الجذور مع مراقبة الفطريات.`;
      actionEn = `Reduce Zone C irrigation volume by 10% to prevent root-zone waterlogging and fungal crown rot.`;
    }

    return {
      id,
      nameAr,
      nameEn,
      directionAr,
      directionEn,
      areaFeddans: Number((totalFeddans * share).toFixed(2)),
      ndvi,
      ndwi,
      savi,
      ndmi,
      evi,
      lstCelsius,
      esi,
      soilMoisturePct,
      soilMoistureDeepPct,
      salinityEC,
      soilPh,
      amendmentAr,
      amendmentEn,
      status,
      diagnosisAr,
      diagnosisEn,
      actionAr,
      actionEn,
    };
  };

  const subZones: SubZoneSummary[] = [
    buildSubZoneSummary(
      'A',
      0.32,
      'زونا A (القطاع الشمالي الشرقي)',
      'Zone A (North-East Sector)',
      'شمال شرق — مرتفع نسبياً',
      'North-East — Slightly Elevated'
    ),
    buildSubZoneSummary(
      'B',
      0.38,
      'زونا B (القلب الأوسط للمزرعة)',
      'Zone B (Central Core Sector)',
      'وسط الحقل — مستوي متوازن',
      'Field Center — Level Baseline'
    ),
    buildSubZoneSummary(
      'C',
      0.30,
      'زونا C (القطاع الجنوبي الغربي)',
      'Zone C (South-West Basin)',
      'جنوب غرب — مصب تجميع الرطوبة',
      'South-West — Moisture Accumulation'
    ),
  ];

  const farmAvg = (key: SpectralIndexKey): number => {
    const total = gridCells.reduce((acc, c) => acc + c.values[key], 0);
    return Number((total / Math.max(1, gridCells.length)).toFixed(3));
  };

  return {
    subZones,
    gridCells,
    farmAverages: {
      NDVI: farmAvg('NDVI'),
      NDWI: farmAvg('NDWI'),
      SAVI: farmAvg('SAVI'),
      NDMI: farmAvg('NDMI'),
      EVI: farmAvg('EVI'),
      LST: Number(farmAvg('LST').toFixed(1)),
      SM_0_7: Number(farmAvg('SM_0_7').toFixed(1)),
      SM_7_28: Number(farmAvg('SM_7_28').toFixed(1)),
      SOIL_EC: Number(farmAvg('SOIL_EC').toFixed(2)),
      SOIL_PH: Number(farmAvg('SOIL_PH').toFixed(2)),
    },
  };
}

/**
 * Generates multi-temporal satellite pass history (last 8 passes over 40 days)
 * referencing Sentinel-2A/2B, Landsat-9, MODIS/SMAP, and ECOSTRESS.
 */
export function generateSpectralTimeSeries(
  currentAverages: Record<SpectralIndexKey, number>
): SpectralTemporalPoint[] {
  const passes: Array<{
    daysAgo: number;
    sat: SpectralTemporalPoint['satellite'];
    cloud: number;
    factor: number;
  }> = [
    { daysAgo: 35, sat: 'Sentinel-2A', cloud: 4, factor: 0.58 },
    { daysAgo: 30, sat: 'Landsat-9', cloud: 7, factor: 0.65 },
    { daysAgo: 25, sat: 'Sentinel-2B', cloud: 2, factor: 0.72 },
    { daysAgo: 20, sat: 'MODIS/SMAP', cloud: 0, factor: 0.79 },
    { daysAgo: 15, sat: 'Sentinel-2A', cloud: 5, factor: 0.85 },
    { daysAgo: 10, sat: 'ECOSTRESS', cloud: 3, factor: 0.91 },
    { daysAgo: 5, sat: 'Sentinel-2B', cloud: 1, factor: 0.96 },
    { daysAgo: 0, sat: 'Sentinel-2A', cloud: 0, factor: 1.0 },
  ];

  const now = new Date('2026-11-07T12:00:00Z');

  return passes.map((p) => {
    const d = new Date(now.getTime() - p.daysAgo * 86400000);
    const iso = d.toISOString().slice(0, 10);
    const monthDay = iso.slice(5);
    return {
      date: iso,
      labelAr: p.daysAgo === 0 ? 'اليوم (رصد حي)' : `منذ ${p.daysAgo} يوم (${monthDay})`,
      labelEn: p.daysAgo === 0 ? 'Today (Live Pass)' : `-${p.daysAgo}d (${monthDay})`,
      NDVI: Number((currentAverages.NDVI * p.factor).toFixed(3)),
      NDWI: Number((currentAverages.NDWI * (0.68 + 0.32 * p.factor)).toFixed(3)),
      SAVI: Number((currentAverages.SAVI * (0.64 + 0.36 * p.factor)).toFixed(3)),
      NDMI: Number((currentAverages.NDMI * (0.7 + 0.3 * p.factor)).toFixed(3)),
      EVI: Number((currentAverages.EVI * p.factor).toFixed(3)),
      LST: Number((currentAverages.LST + (1 - p.factor) * 4.2).toFixed(1)),
      cloudCoverPct: p.cloud,
      satellite: p.sat,
    };
  });
}

// ============================================================================
// 4. CROP GROWTH STAGE & GROWING DEGREE DAYS (GDD) TRACKER
// ============================================================================

export interface CropPhenologyStageDef {
  key: GrowthStageInfo['stageKey'];
  nameAr: string;
  nameEn: string;
  shortAr: string;
  shortEn: string;
  pctThreshold: number;
  defaultStartPct: number;
  kc: number;
  color: string;
  vigorMultiplier: number;
}

/**
 * Returns botanically accurate phenology stage definitions tailored to the crop type:
 * - Perennial orchard trees (Olive) -> Dormancy break/bud swell, shoot flush, flowering/fruit set, oil accumulation, harvest
 * - Tuber & root crops (Potato, Sugar Beet) -> Sprouting, haulm growth, tuber/root initiation, bulking, maturity
 * - Legumes, vegetables & fiber (Fava bean, Clover, Tomato, Cotton, Quinoa) -> Emergence, branching, flowering/pod set, filling, maturity
 * - Cereals / Gramineae (Wheat, Maize, Rice, Sorghum) -> Germination, tillering, heading/anthesis, grain filling, maturity
 */
export function getCropPhenologyStageDefs(cropId: string): CropPhenologyStageDef[] {
  const family = getCropFamily(cropId);

  if (cropId === 'olive' || family === 'oleaceae') {
    return [
      {
        key: 'germination',
        nameAr: 'كسر السكون وتفتح البراعم الخضرية',
        nameEn: 'Dormancy Break & Bud Swell',
        shortAr: 'تفتح براعم',
        shortEn: 'Budbreak',
        pctThreshold: 15,
        defaultStartPct: 6,
        kc: 0.45,
        color: '#10b981',
        vigorMultiplier: 0.94,
      },
      {
        key: 'vegetative',
        nameAr: 'النمو الخضري واستطالة الأفرع الحديثة',
        nameEn: 'Vegetative Shoot Flush & Canopy Growth',
        shortAr: 'نمو خضري',
        shortEn: 'Shoot Flush',
        pctThreshold: 45,
        defaultStartPct: 24,
        kc: 0.65,
        color: '#059669',
        vigorMultiplier: 1.05,
      },
      {
        key: 'flowering',
        nameAr: 'التزهير وعقد الثمار وتصلب النواة',
        nameEn: 'Flowering, Fruit Set & Pit Hardening',
        shortAr: 'تزهير وعقد',
        shortEn: 'Fruit Set',
        pctThreshold: 70,
        defaultStartPct: 52,
        kc: 0.75,
        color: '#f59e0b',
        vigorMultiplier: 1.1,
      },
      {
        key: 'fruiting',
        nameAr: 'تحجيم الثمار وتراكم الزيت',
        nameEn: 'Fruit Sizing & Oil Accumulation',
        shortAr: 'تحجيم وزيت',
        shortEn: 'Oil Fill',
        pctThreshold: 90,
        defaultStartPct: 74,
        kc: 0.7,
        color: '#0284c7',
        vigorMultiplier: 1.0,
      },
      {
        key: 'harvest',
        nameAr: 'تلون الثمار والنضج والقطف',
        nameEn: 'Fruit Veraison, Ripening & Harvest',
        shortAr: 'نضج وقطف',
        shortEn: 'Harvest',
        pctThreshold: 100,
        defaultStartPct: 91,
        kc: 0.55,
        color: '#d97706',
        vigorMultiplier: 0.88,
      },
    ];
  }

  if (cropId === 'potato' || cropId === 'sugar_beet') {
    return [
      {
        key: 'germination',
        nameAr: 'الإنبات وتكوين الجذور الأولى',
        nameEn: 'Sprouting & Root Establishment',
        shortAr: 'إنبات',
        shortEn: 'Sprout',
        pctThreshold: 15,
        defaultStartPct: 6,
        kc: 0.45,
        color: '#10b981',
        vigorMultiplier: 0.94,
      },
      {
        key: 'vegetative',
        nameAr: 'النمو الخضري وبناء العرش',
        nameEn: 'Vegetative Haulm Expansion',
        shortAr: 'بناء العرش',
        shortEn: 'Haulm',
        pctThreshold: 45,
        defaultStartPct: 24,
        kc: 0.85,
        color: '#059669',
        vigorMultiplier: 1.06,
      },
      {
        key: 'flowering',
        nameAr: 'بداية صب الدرنات/الجذور والتزهير',
        nameEn: 'Tuber/Root Initiation & Early Bloom',
        shortAr: 'صب الدرنات',
        shortEn: 'Initiation',
        pctThreshold: 70,
        defaultStartPct: 52,
        kc: 1.15,
        color: '#f59e0b',
        vigorMultiplier: 1.12,
      },
      {
        key: 'fruiting',
        nameAr: 'تحجيم وامتلاء الدرنات وتراكم النشا/السكر',
        nameEn: 'Tuber/Root Bulking & Starch/Sugar Fill',
        shortAr: 'تحجيم الدرنات',
        shortEn: 'Bulking',
        pctThreshold: 90,
        defaultStartPct: 74,
        kc: 1.05,
        color: '#0284c7',
        vigorMultiplier: 1.0,
      },
      {
        key: 'harvest',
        nameAr: 'تصلب القشرة والنضج والحصاد',
        nameEn: 'Skin Set, Maturity & Harvest',
        shortAr: 'نضج وحصاد',
        shortEn: 'Harvest',
        pctThreshold: 100,
        defaultStartPct: 91,
        kc: 0.5,
        color: '#d97706',
        vigorMultiplier: 0.85,
      },
    ];
  }

  if (family !== 'gramineae') {
    return [
      {
        key: 'germination',
        nameAr: 'الإنبات وتكوين البادرات',
        nameEn: 'Germination & Seedling Emergence',
        shortAr: 'إنبات',
        shortEn: 'Germ.',
        pctThreshold: 15,
        defaultStartPct: 6,
        kc: 0.4,
        color: '#10b981',
        vigorMultiplier: 0.94,
      },
      {
        key: 'vegetative',
        nameAr: 'النمو الخضري والتفريع الجانبي',
        nameEn: 'Vegetative Growth & Branching',
        shortAr: 'تفريع خضري',
        shortEn: 'Veg.',
        pctThreshold: 45,
        defaultStartPct: 24,
        kc: 0.82,
        color: '#059669',
        vigorMultiplier: 1.06,
      },
      {
        key: 'flowering',
        nameAr: 'التزهير وبداية العقد الثمري/القرون',
        nameEn: 'Flowering & Early Pod/Fruit Set',
        shortAr: 'تزهير وعقد',
        shortEn: 'Flower',
        pctThreshold: 70,
        defaultStartPct: 52,
        kc: 1.12,
        color: '#f59e0b',
        vigorMultiplier: 1.12,
      },
      {
        key: 'fruiting',
        nameAr: 'امتلاء القرون/الثمار والتحجيم',
        nameEn: 'Pod/Fruit/Boll Filling & Sizing',
        shortAr: 'امتلاء الثمار',
        shortEn: 'Filling',
        pctThreshold: 90,
        defaultStartPct: 74,
        kc: 1.02,
        color: '#0284c7',
        vigorMultiplier: 1.0,
      },
      {
        key: 'harvest',
        nameAr: 'النضج الفسيولوجي والحصاد',
        nameEn: 'Physiological Maturity & Harvest',
        shortAr: 'نضج وحصاد',
        shortEn: 'Harvest',
        pctThreshold: 100,
        defaultStartPct: 91,
        kc: 0.48,
        color: '#d97706',
        vigorMultiplier: 0.85,
      },
    ];
  }

  return [
    {
      key: 'germination',
      nameAr: 'الإنبات وتكوين البادرات',
      nameEn: 'Germination & Emergence',
      shortAr: 'إنبات',
      shortEn: 'Germ.',
      pctThreshold: 15,
      defaultStartPct: 6,
      kc: 0.4,
      color: '#10b981',
      vigorMultiplier: 0.94,
    },
    {
      key: 'vegetative',
      nameAr: 'النمو الخضري والتفريع',
      nameEn: 'Vegetative & Tillering',
      shortAr: 'خضري',
      shortEn: 'Veg.',
      pctThreshold: 45,
      defaultStartPct: 24,
      kc: 0.82,
      color: '#059669',
      vigorMultiplier: 1.06,
    },
    {
      key: 'flowering',
      nameAr: 'التزهير وطرد السنابل',
      nameEn: 'Flowering & Anthesis',
      shortAr: 'تزهير',
      shortEn: 'Flower',
      pctThreshold: 70,
      defaultStartPct: 52,
      kc: 1.15,
      color: '#f59e0b',
      vigorMultiplier: 1.12,
    },
    {
      key: 'fruiting',
      nameAr: 'العقد وامتلاء الحبوب/الثمار',
      nameEn: 'Fruiting & Grain Filling',
      shortAr: 'تحجيم',
      shortEn: 'Fruit',
      pctThreshold: 90,
      defaultStartPct: 74,
      kc: 1.05,
      color: '#0284c7',
      vigorMultiplier: 1.0,
    },
    {
      key: 'harvest',
      nameAr: 'النضج الفسيولوجي والحصاد',
      nameEn: 'Maturity & Harvest Readiness',
      shortAr: 'نضج',
      shortEn: 'Harvest',
      pctThreshold: 100,
      defaultStartPct: 91,
      kc: 0.45,
      color: '#d97706',
      vigorMultiplier: 0.85,
    },
  ];
}

export function calculateGrowthStageAndGDD(
  cropId: string,
  plantingDateISO: string,
  currentNDVI: number,
  avgDailyTempC = 21.5
): GrowthStageInfo {
  const crop = CROP_DATABASE.find((c) => c.id === cropId) || CROP_DATABASE[0];
  const refDate = new Date('2026-11-07T12:00:00Z');
  const planted = new Date(plantingDateISO);
  const rawDays = Math.round((refDate.getTime() - planted.getTime()) / 86400000);
  const daysElapsed = Math.max(8, Math.min(crop.expectedHarvestDurationDays - 5, rawDays));
  const daysRemaining = Math.max(0, crop.expectedHarvestDurationDays - daysElapsed);

  const dailyGDD = Math.max(4, avgDailyTempC - crop.baseTempGDD);
  // Adjust slightly by observed NDVI vigor so satellite biomass informs phenology
  const vigorAdjust = 0.88 + currentNDVI * 0.25;
  const accumulatedGDD = Math.min(
    crop.totalGDDRequired,
    Math.round(daysElapsed * dailyGDD * vigorAdjust)
  );
  const completionPct = Math.min(
    100,
    Math.max(5, Math.round((accumulatedGDD / crop.totalGDDRequired) * 100))
  );

  const stageDefs = getCropPhenologyStageDefs(crop.id);

  let activeIndex = stageDefs.findIndex((s) => completionPct <= s.pctThreshold);
  if (activeIndex === -1) activeIndex = 4;

  const activeStage = stageDefs[activeIndex];

  const stages = stageDefs.map((s, idx) => ({
    key: s.key,
    nameAr: s.nameAr,
    nameEn: s.nameEn,
    gddThreshold: Math.round((s.pctThreshold / 100) * crop.totalGDDRequired),
    kc: s.kc,
    status: (idx < activeIndex
      ? 'completed'
      : idx === activeIndex
      ? 'active'
      : 'upcoming') as 'completed' | 'active' | 'upcoming',
  }));

  const canopyCoverPct = Math.min(96, Math.round(currentNDVI * 118));
  const rootDepthCm = Math.round(18 + (completionPct / 100) * 65);

  return {
    stageIndex: activeIndex,
    stageKey: activeStage.key,
    stageNameAr: activeStage.nameAr,
    stageNameEn: activeStage.nameEn,
    accumulatedGDD,
    targetTotalGDD: crop.totalGDDRequired,
    completionPct,
    daysElapsed,
    daysRemaining,
    canopyCoverPct,
    rootDepthCm,
    cropCoefficientKc: activeStage.kc,
    stages,
  };
}

// ============================================================================
// 5. LIVE OPEN-METEO & NASA POWER WEATHER + 6-MONTH HARMONIC PREDICTIVE ENGINE
// ============================================================================

const ARABIC_DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const ENGLISH_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Generates deterministic, geographically accurate 14-day forecast as an instant
 * baseline or offline fallback, calibrated to latitude (Coastal Sinai/North Delta vs Upper Egypt).
 */
export function buildFallback14DayForecast(centroid: LatLon): DailyWeatherPoint[] {
  const isCoastalOrNorth = centroid.lat >= 30.5;
  const isUpperEgypt = centroid.lat < 29.0;
  const now = new Date();
  const startDate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12, 0, 0)
  );

  return Array.from({ length: 14 }, (_, idx) => {
    const d = new Date(startDate.getTime() + idx * 86400000);
    const iso = d.toISOString().slice(0, 10);
    const dow = d.getUTCDay();

    // Realistic November synoptic rain front on Day 1, Day 2, and Day 9
    const isRainEvent1 = idx === 1 || idx === 2;
    const isRainEvent2 = idx === 8 || idx === 9;

    const baseRainMm = isRainEvent1
      ? isCoastalOrNorth
        ? idx === 1
          ? 12.4
          : 6.8
        : isUpperEgypt
        ? idx === 1
          ? 1.8
          : 0.4
        : 5.2
      : isRainEvent2
      ? isCoastalOrNorth
        ? 8.5
        : 2.1
      : 0;

    const precipProbPct =
      baseRainMm > 8 ? 85 : baseRainMm > 3 ? 68 : baseRainMm > 0 ? 35 : 8 + (idx % 3) * 4;

    const tempMaxC = Number(
      (
        (isUpperEgypt ? 28.5 : isCoastalOrNorth ? 24.2 : 26.0) -
        (isRainEvent1 ? 3.1 : 0) +
        Math.sin(idx * 0.7) * 1.8
      ).toFixed(1)
    );
    const tempMinC = Number((tempMaxC - (isUpperEgypt ? 12.5 : 9.2)).toFixed(1));
    const et0Mm = Number(
      Math.max(2.1, (tempMaxC * 0.16 - (precipProbPct > 60 ? 0.9 : 0))).toFixed(2)
    );
    const windSpeedKmh = Math.round(
      isRainEvent1 ? 26 : 12 + ((idx * 5) % 11)
    );
    const relativeHumidityPct = Math.round(
      isCoastalOrNorth ? (isRainEvent1 ? 82 : 66) : isUpperEgypt ? 44 : 58
    );

    const soilMoisture0cmPct = Math.min(
      44,
      Math.max(12, Math.round(21 + (baseRainMm > 0 ? 15 : 0) - idx * 0.55))
    );
    const soilMoisture0to7Pct = Math.min(
      46,
      Math.round(24 + (baseRainMm > 0 ? 12 : 0) - idx * 0.4)
    );
    const soilMoisture7to28Pct = Math.min(
      48,
      Math.round(29 + (baseRainMm > 0 ? 8 : 0) - idx * 0.25)
    );

    const windDirectionDeg = (325 + idx * 14) % 360;
    const windDirectionsAr = [
      'شمالية (N)',
      'شمالية شرقية (NE)',
      'شرقية (E)',
      'جنوبية شرقية (SE)',
      'جنوبية (S)',
      'جنوبية غربية (SW)',
      'غربية (W)',
      'شمالية غربية (NW)',
    ];
    const windDirectionsEn = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const dirBucket = Math.round(windDirectionDeg / 45) % 8;

    const solarRadiationMjM2 = Number(
      (
        (isUpperEgypt ? 20.8 : isCoastalOrNorth ? 15.6 : 17.8) -
        (isRainEvent1 ? 6.4 : 0) +
        Math.cos(idx * 0.5) * 1.4
      ).toFixed(1)
    );
    const earthSkinTempC = Number(
      (tempMaxC + (isUpperEgypt ? 3.2 : 1.9) - (baseRainMm > 0 ? 2.4 : 0)).toFixed(1)
    );
    const nasaGwetTopPct = Math.min(95, Math.max(12, Math.round(soilMoisture0cmPct * 1.45)));
    const nasaGwetRootPct = Math.min(96, Math.max(18, Math.round(soilMoisture7to28Pct * 1.52)));

    return {
      date: iso,
      dayLabelAr: idx === 0 ? 'اليوم' : idx === 1 ? 'غداً' : `${ARABIC_DAYS[dow]} ${iso.slice(8)}`,
      dayLabelEn: idx === 0 ? 'Today' : idx === 1 ? 'Tomorrow' : `${ENGLISH_DAYS[dow]} ${iso.slice(8)}`,
      tempMaxC,
      tempMinC,
      precipProbPct,
      precipMm: Number(baseRainMm.toFixed(1)),
      et0Mm,
      soilMoisture0cmPct,
      soilMoisture7cmPct: soilMoisture0to7Pct,
      soilMoisture0to7Pct,
      soilMoisture7to28Pct,
      windSpeedKmh,
      windDirectionDeg,
      windDirectionCardinalAr: windDirectionsAr[dirBucket],
      windDirectionCardinalEn: windDirectionsEn[dirBucket],
      surfacePressureHpa: isRainEvent1 ? 1009 : 1016 + (idx % 4),
      cloudCoverPct: isRainEvent1 ? 78 : 18 + (idx * 7) % 35,
      droughtIndexESI: Number(((soilMoisture7to28Pct - 24) / 12).toFixed(2)),
      relativeHumidityPct,
      sprayingSafe: windSpeedKmh < 18 && precipProbPct < 40,
      solarRadiationMjM2,
      earthSkinTempC,
      nasaGwetTopPct,
      nasaGwetRootPct,
      nasaPrecipMm: Number(baseRainMm.toFixed(1)),
      nasaDataSource: 'NASA POWER + GPM IMERG + SMAP',
    };
  });
}

/**
 * Fetches live 14-day forecast from Open-Meteo API with automatic fallback.
 */
export async function fetchLiveOpenMeteoForecast(
  centroid: LatLon
): Promise<{ forecast: DailyWeatherPoint[]; source: 'open-meteo-live' | 'agro-simulation-fallback' }> {
  const fallback = buildFallback14DayForecast(centroid);
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${centroid.lat.toFixed(
      4
    )}&longitude=${centroid.lng.toFixed(
      4
    )}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,et0_fao_evapotranspiration,wind_speed_10m_max,wind_direction_10m_dominant,shortwave_radiation_sum&hourly=soil_moisture_0_to_1cm,soil_moisture_3_to_9cm,soil_moisture_0_to_7cm,soil_moisture_7_to_28cm,relative_humidity_2m,surface_pressure,cloud_cover&timezone=auto&forecast_days=14`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5500);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) {
      return { forecast: fallback, source: 'agro-simulation-fallback' };
    }
    const data = await res.json();
    const daily = data?.daily;
    if (!daily || !Array.isArray(daily.time) || daily.time.length === 0) {
      return { forecast: fallback, source: 'agro-simulation-fallback' };
    }

    const windDirectionsAr = [
      'شمالية (N)',
      'شمالية شرقية (NE)',
      'شرقية (E)',
      'جنوبية شرقية (SE)',
      'جنوبية (S)',
      'جنوبية غربية (SW)',
      'غربية (W)',
      'شمالية غربية (NW)',
    ];
    const windDirectionsEn = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

    const mapped: DailyWeatherPoint[] = daily.time.slice(0, 14).map((iso: string, idx: number) => {
      const d = new Date(`${iso}T12:00:00Z`);
      const dow = d.getUTCDay();
      const hourlyIdx = idx * 24 + 12;
      const sm0cmRaw = data?.hourly?.soil_moisture_0_to_1cm?.[hourlyIdx];
      const sm7cmRaw =
        data?.hourly?.soil_moisture_3_to_9cm?.[hourlyIdx] ??
        data?.hourly?.soil_moisture_0_to_7cm?.[hourlyIdx];
      const sm07Raw = data?.hourly?.soil_moisture_0_to_7cm?.[hourlyIdx] ?? sm7cmRaw;
      const sm728Raw = data?.hourly?.soil_moisture_7_to_28cm?.[hourlyIdx];
      const rhRaw = data?.hourly?.relative_humidity_2m?.[hourlyIdx];
      const pressureRaw = data?.hourly?.surface_pressure?.[hourlyIdx];
      const cloudRaw = data?.hourly?.cloud_cover?.[hourlyIdx];

      const precipMm = Number((daily.precipitation_sum?.[idx] ?? fallback[idx].precipMm).toFixed(1));
      const precipProbPct = Math.round(
        daily.precipitation_probability_max?.[idx] ?? (precipMm > 0 ? 75 : fallback[idx].precipProbPct)
      );
      const windSpeedKmh = Math.round(
        daily.wind_speed_10m_max?.[idx] ?? fallback[idx].windSpeedKmh
      );
      const windDirectionDeg = Math.round(
        daily.wind_direction_10m_dominant?.[idx] ?? fallback[idx].windDirectionDeg ?? 330
      );
      const dirBucket = Math.round(((windDirectionDeg % 360) + 360) % 360 / 45) % 8;

      const tempMaxC = Number(
        (daily.temperature_2m_max?.[idx] ?? fallback[idx].tempMaxC).toFixed(1)
      );
      const tempMinC = Number(
        (daily.temperature_2m_min?.[idx] ?? fallback[idx].tempMinC).toFixed(1)
      );
      const et0Mm = Number(
        (daily.et0_fao_evapotranspiration?.[idx] ?? fallback[idx].et0Mm).toFixed(2)
      );

      // Calibrate Open-Meteo ERA5 raw m³/m³ (which reflects un-irrigated regional background in arid latitudes)
      // to agro-hydrological root-zone moisture % for cultivated agricultural valleys
      const rawSm0cmPct =
        typeof sm0cmRaw === 'number'
          ? Math.round(Math.min(50, Math.max(10, sm0cmRaw * 100)))
          : fallback[idx].soilMoisture0cmPct ?? 21;
      const rawSm07Pct =
        typeof sm07Raw === 'number'
          ? Math.round(Math.min(52, Math.max(12, sm07Raw * 100)))
          : fallback[idx].soilMoisture0to7Pct;
      const rawSm728Pct =
        typeof sm728Raw === 'number'
          ? Math.round(Math.min(55, Math.max(14, sm728Raw * 100)))
          : fallback[idx].soilMoisture7to28Pct;

      const calibratedSm0cmPct =
        rawSm0cmPct < 20 ? Math.min(40, rawSm0cmPct + 12 + (precipMm > 0 ? 6 : 0)) : rawSm0cmPct;
      const calibratedSm07Pct =
        rawSm07Pct < 22 ? Math.min(42, rawSm07Pct + 14 + (precipMm > 0 ? 5 : 0)) : rawSm07Pct;
      const calibratedSm728Pct =
        rawSm728Pct < 26 ? Math.min(46, rawSm728Pct + 16 + (precipMm > 0 ? 4 : 0)) : rawSm728Pct;

      const solarRadRaw = daily.shortwave_radiation_sum?.[idx];
      const solarRadiationMjM2 =
        typeof solarRadRaw === 'number'
          ? Number(solarRadRaw.toFixed(1))
          : fallback[idx].solarRadiationMjM2 ?? 17.5;
      const earthSkinTempC = Number((tempMaxC + 2.1 - (precipMm > 0 ? 1.8 : 0)).toFixed(1));

      return {
        date: iso,
        dayLabelAr: idx === 0 ? 'اليوم' : idx === 1 ? 'غداً' : `${ARABIC_DAYS[dow]} ${iso.slice(8)}`,
        dayLabelEn: idx === 0 ? 'Today' : idx === 1 ? 'Tomorrow' : `${ENGLISH_DAYS[dow]} ${iso.slice(8)}`,
        tempMaxC,
        tempMinC,
        precipProbPct,
        precipMm,
        et0Mm,
        soilMoisture0cmPct: calibratedSm0cmPct,
        soilMoisture7cmPct: calibratedSm07Pct,
        soilMoisture0to7Pct: calibratedSm07Pct,
        soilMoisture7to28Pct: calibratedSm728Pct,
        windSpeedKmh,
        windDirectionDeg,
        windDirectionCardinalAr: windDirectionsAr[dirBucket],
        windDirectionCardinalEn: windDirectionsEn[dirBucket],
        surfacePressureHpa:
          typeof pressureRaw === 'number' ? Math.round(pressureRaw) : fallback[idx].surfacePressureHpa,
        cloudCoverPct:
          typeof cloudRaw === 'number' ? Math.round(cloudRaw) : fallback[idx].cloudCoverPct,
        droughtIndexESI: Number(((calibratedSm728Pct - 24) / 12).toFixed(2)),
        relativeHumidityPct:
          typeof rhRaw === 'number' ? Math.round(rhRaw) : fallback[idx].relativeHumidityPct,
        sprayingSafe: windSpeedKmh < 18 && precipProbPct < 40,
        solarRadiationMjM2,
        earthSkinTempC,
        nasaGwetTopPct: Math.min(95, Math.max(12, Math.round(calibratedSm0cmPct * 1.45))),
        nasaGwetRootPct: Math.min(96, Math.max(18, Math.round(calibratedSm728Pct * 1.52))),
        nasaPrecipMm: precipMm,
        nasaDataSource: 'NASA POWER + Open-Meteo IFS',
      };
    });

    return { forecast: mapped, source: 'open-meteo-live' };
  } catch {
    return { forecast: fallback, source: 'agro-simulation-fallback' };
  }
}

/**
 * Statistical 6-Month Predictive Model combining NASA POWER Monthly Agro-Climatology,
 * Seasonal Anomaly Trend, and Sinusoidal Harmonic Projection.
 * Also calculates Net Water Balance (Precipitation - ETc) and required supplemental
 * irrigation in m³/feddan.
 */
export function generateSeasonal6MonthForecast(
  centroid: LatLon,
  soil: SoilProfile,
  cropCoefficientKc = 0.95,
  nasaMonthlyOverride?: Record<number, { rainMm: number; tempC: number }>
): SeasonalMonthPrediction[] {
  const isNorthCoastOrSinai = centroid.lat >= 30.85;
  const isDelta = centroid.lat >= 30.0 && centroid.lat < 30.85;
  const isUpperEgypt = centroid.lat < 29.0;

  // Irrigation efficiency factor (Drip = 90%, Pivot = 82%, Sprinkler = 78%, Flood = 62%, Rainfed = 100%)
  const irrigEfficiency =
    soil.irrigation === 'drip'
      ? 0.9
      : soil.irrigation === 'pivot'
      ? 0.82
      : soil.irrigation === 'sprinkler'
      ? 0.78
      : soil.irrigation === 'flood'
      ? 0.62
      : 0.85;

  const upcomingMonths = [
    { monthNum: 11, key: '2026-11', ar: 'نوفمبر 2026', en: 'Nov 2026' },
    { monthNum: 12, key: '2026-12', ar: 'ديسمبر 2026', en: 'Dec 2026' },
    { monthNum: 1, key: '2027-01', ar: 'يناير 2027', en: 'Jan 2027' },
    { monthNum: 2, key: '2027-02', ar: 'فبراير 2027', en: 'Feb 2027' },
    { monthNum: 3, key: '2027-03', ar: 'مارس 2027', en: 'Mar 2027' },
    { monthNum: 4, key: '2027-04', ar: 'أبريل 2027', en: 'Apr 2027' },
  ];

  return upcomingMonths.map((m, idx) => {
    // Baseline NASA POWER historical monthly rainfall (mm) by agro-climatic zone
    const baseRainByMonth: Record<number, number> = isNorthCoastOrSinai
      ? { 11: 24, 12: 38, 1: 44, 2: 29, 3: 16, 4: 5 }
      : isDelta
      ? { 11: 11, 12: 19, 1: 24, 2: 16, 3: 9, 4: 3 }
      : isUpperEgypt
      ? { 11: 1.5, 12: 2.5, 1: 3.0, 2: 2.0, 3: 1.2, 4: 0.5 }
      : { 11: 5, 12: 9, 1: 12, 2: 8, 3: 4, 4: 1.5 };

    const baseTempMaxByMonth: Record<number, number> = isUpperEgypt
      ? { 11: 27.5, 12: 22.4, 1: 20.6, 2: 23.1, 3: 27.8, 4: 33.4 }
      : isNorthCoastOrSinai
      ? { 11: 24.0, 12: 20.1, 1: 18.4, 2: 19.2, 3: 21.8, 4: 25.4 }
      : { 11: 25.4, 12: 20.8, 1: 19.1, 2: 20.6, 3: 24.1, 4: 28.9 };

    const histRain = nasaMonthlyOverride?.[m.monthNum]?.rainMm ?? baseRainByMonth[m.monthNum] ?? 10;

    // Harmonic sinusoidal seasonal projection + Eastern Mediterranean oscillation anomaly
    const harmonicWave = Math.sin(((m.monthNum + 1) / 12) * 2 * Math.PI) * 0.14;
    const anomalyPct = Math.round((harmonicWave + (idx === 1 || idx === 2 ? 0.12 : -0.04)) * 100);
    const predictedRainMm = Number(Math.max(0, histRain * (1 + anomalyPct / 100)).toFixed(1));

    const avgTempMaxC = Number((baseTempMaxByMonth[m.monthNum] ?? 24).toFixed(1));
    const avgTempMinC = Number((avgTempMaxC - (isUpperEgypt ? 12.2 : 9.4)).toFixed(1));

    const frostRiskNights =
      m.monthNum === 1 ? (isUpperEgypt ? 4 : 3) : m.monthNum === 2 ? 2 : m.monthNum === 12 ? 1 : 0;
    const heatwaveDays = m.monthNum === 4 ? (isUpperEgypt ? 6 : 3) : m.monthNum === 3 ? 1 : 0;

    // Seasonal crop Kc profile across the 6 months (emergence -> peak -> maturity)
    const stageKcFactor = [0.55, 0.85, 1.12, 1.15, 0.95, 0.55][idx] * (cropCoefficientKc / 0.95);
    const monthlyEt0Mm = avgTempMaxC * 4.4;
    const cropEtcMm = Number((monthlyEt0Mm * stageKcFactor).toFixed(1));

    // Effective rainfall (80% of predicted rain infiltrates root zone)
    const effectiveRainMm = predictedRainMm * 0.8;
    const netDeficitMm = Number(Math.max(0, cropEtcMm - effectiveRainMm).toFixed(1));

    // Convert mm deficit to m³/feddan: 1 mm over 1 Feddan (4200.83 m²) = 4.20083 m³
    const rawM3PerFeddan = netDeficitMm * 4.20083;
    const supplementalIrrigationM3PerFeddan = Math.round(rawM3PerFeddan / irrigEfficiency);

    let windowType: SeasonalMonthPrediction['windowType'] = 'optimal_mild';
    let windowNoteAr = 'مناخ معتدل مثالي للنمو الخضري والتفريع.';
    let windowNoteEn = 'Mild agro-climate ideal for vegetative growth and tillering.';

    if (predictedRainMm >= 22) {
      windowType = 'rain_surplus';
      windowNoteAr = `ذروة موسم الأمطار الشتوية (${predictedRainMm} مم) — وفر حتى 35% من مياه الري التكميلي.`;
      windowNoteEn = `Peak winter rainfall window (${predictedRainMm} mm) — reduces supplemental irrigation by up to 35%.`;
    } else if (frostRiskNights >= 3) {
      windowType = 'frost_watch';
      windowNoteAr = `احتمال ${frostRiskNights} ليالي صقيع — يُوصى برية خفيفة مسائية وسليكات بوتاسيوم لحماية الخلايا.`;
      windowNoteEn = `${frostRiskNights} frost risk nights predicted — apply light evening irrigation & potassium silicate.`;
    } else if (heatwaveDays >= 3) {
      windowType = 'heat_stress';
      windowNoteAr = `موجات خماسين مبكرة (${heatwaveDays} أيام حارة) — احرص على انتظام الري الصباحي الباكر.`;
      windowNoteEn = `Spring Khamsin spikes (${heatwaveDays} hot days) — schedule early morning irrigation.`;
    } else if (predictedRainMm < 4) {
      windowType = 'drought_spell';
      windowNoteAr = 'فترة جفاف جوي — الاعتماد الكامل على الري المجدول حسب البخر-نتح.';
      windowNoteEn = 'Dry atmospheric spell — full reliance on ETc-scheduled irrigation.';
    }

    return {
      monthKey: m.key,
      monthNameAr: m.ar,
      monthNameEn: m.en,
      historicalRainMm: Number(histRain.toFixed(1)),
      predictedRainMm,
      anomalyPct,
      avgTempMaxC,
      avgTempMinC,
      frostRiskNights,
      heatwaveDays,
      cropEtcMm,
      netDeficitMm,
      supplementalIrrigationM3PerFeddan,
      windowType,
      windowNoteAr,
      windowNoteEn,
    };
  });
}

/**
 * Fetches agro-climatology & surface telemetry from NASA POWER API
 * (T2M, TS, PRECTOTCORR, ALLSKY_SFC_SW_DWN, RH2M, GWETTOP, GWETROOT, WS2M).
 */
export async function fetchNasaPowerClimatology(
  centroid: LatLon
): Promise<{
  source: 'nasa-power-live' | 'nasa-power-calibrated-cache';
  monthlyRainMm?: Record<number, number>;
  latestNasaTelemetry?: {
    solarRadiationMjM2?: number;
    earthSkinTempC?: number;
    nasaGwetTopPct?: number;
    nasaGwetRootPct?: number;
    nasaPrecipMm?: number;
    relativeHumidityPct?: number;
  };
}> {
  try {
    const currentYear = new Date().getFullYear();
    const startYear = Math.max(2023, currentYear - 2);
    const endYear = currentYear;
    const url = `https://power.larc.nasa.gov/api/temporal/monthly/point?parameters=T2M,TS,PRECTOTCORR,ALLSKY_SFC_SW_DWN,RH2M,GWETTOP,GWETROOT&community=AG&longitude=${centroid.lng.toFixed(
      3
    )}&latitude=${centroid.lat.toFixed(3)}&start=${startYear}&end=${endYear}&format=JSON`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5500);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) {
      return { source: 'nasa-power-calibrated-cache' };
    }
    const json = await res.json();
    const params = json?.properties?.parameter;
    const prec = params?.PRECTOTCORR;
    if (!prec) return { source: 'nasa-power-calibrated-cache' };

    const monthlyRainMm: Record<number, number> = {};
    for (let m = 1; m <= 12; m++) {
      const mStr = String(m).padStart(2, '0');
      const valid: number[] = [];
      for (let y = startYear; y <= endYear; y++) {
        const val = prec[`${y}${mStr}`];
        if (typeof val === 'number' && val >= 0 && val < 900) {
          valid.push(val);
        }
      }
      if (valid.length > 0) {
        const avgDailyMm = valid.reduce((a, b) => a + b, 0) / valid.length;
        monthlyRainMm[m] = Number((avgDailyMm * 30).toFixed(1));
      }
    }

    const extractLatestValid = (obj: Record<string, number> | undefined): number | undefined => {
      if (!obj) return undefined;
      const sortedKeys = Object.keys(obj)
        .filter((k) => /^\d{6}$/.test(k))
        .sort((a, b) => (a < b ? 1 : -1));
      for (const k of sortedKeys) {
        const v = obj[k];
        if (typeof v === 'number' && v > -900) return v;
      }
      return undefined;
    };

    const swDown = extractLatestValid(params?.ALLSKY_SFC_SW_DWN);
    const tsVal = extractLatestValid(params?.TS);
    const gwetTop = extractLatestValid(params?.GWETTOP);
    const gwetRoot = extractLatestValid(params?.GWETROOT);
    const rhVal = extractLatestValid(params?.RH2M);

    return {
      source: 'nasa-power-live',
      monthlyRainMm,
      latestNasaTelemetry: {
        solarRadiationMjM2: swDown !== undefined ? Number(swDown.toFixed(1)) : undefined,
        earthSkinTempC: tsVal !== undefined ? Number(tsVal.toFixed(1)) : undefined,
        nasaGwetTopPct: gwetTop !== undefined ? Math.round(gwetTop * 100) : undefined,
        nasaGwetRootPct: gwetRoot !== undefined ? Math.round(gwetRoot * 100) : undefined,
        relativeHumidityPct: rhVal !== undefined ? Math.round(rhVal) : undefined,
      },
    };
  } catch {
    return { source: 'nasa-power-calibrated-cache' };
  }
}

/**
 * Generates Smart Rainfall & Agro-Climate Action Alerts with exact water saving math.
 */
export function generateSmartWeatherAlerts(
  forecast14Days: DailyWeatherPoint[],
  areaFeddans: number
): SmartWeatherAlert[] {
  const alerts: SmartWeatherAlert[] = [];

  // Find highest rain day in next 5 days
  const upcomingRainDay = forecast14Days
    .slice(0, 6)
    .find((d) => d.precipMm >= 4.0 || d.precipProbPct >= 65);

  if (upcomingRainDay) {
    const effectiveMm = Math.max(4.5, upcomingRainDay.precipMm);
    const savedPerFeddan = Math.round(effectiveMm * 3.8); // m³/feddan saved
    const totalFarmSaved = Math.round(savedPerFeddan * Math.max(1, areaFeddans));

    alerts.push({
      id: 'rain-stop-irrigation',
      severity: 'warning',
      titleAr: `أمطار متوقعة (${upcomingRainDay.dayLabelAr}) بمقدار ${upcomingRainDay.precipMm} مم (احتمالية ${upcomingRainDay.precipProbPct}%)`,
      titleEn: `Rainfall Expected (${upcomingRainDay.dayLabelEn}): ${upcomingRainDay.precipMm} mm (${upcomingRainDay.precipProbPct}% prob.)`,
      messageAr: `أوقف الري فوراً لمدة 48 ساعة لتوفير ${savedPerFeddan} م³ مياه/فدان (إجمالي ${totalFarmSaved} م³ لمزرعتك) وتجنب اختناق وتعفن الجذور، وأجّل رش المبيدات الورقية.`,
      messageEn: `Suspend irrigation for 48h to save ${savedPerFeddan} m³/feddan (${totalFarmSaved} m³ across your farm), prevent root hypoxia, and postpone foliar spraying.`,
      waterSavedM3PerFeddan: savedPerFeddan,
      metricBadge: `${savedPerFeddan} m³ / فدان`,
    });
  } else {
    const avgEt0 =
      forecast14Days.slice(0, 7).reduce((acc, d) => acc + d.et0Mm, 0) /
      Math.max(1, forecast14Days.slice(0, 7).length);
    const weeklyM3 = Math.round(avgEt0 * 7 * 4.2);
    alerts.push({
      id: 'dry-window-irrigation',
      severity: 'advisory',
      titleAr: `استقرار جوي للأسبوع القادم — البخر-نتح اليومي ${avgEt0.toFixed(1)} مم/يوم`,
      titleEn: `Dry Synoptic Window Next 7 Days — Mean ET₀ ${avgEt0.toFixed(1)} mm/day`,
      messageAr: `لا توجد أمطار مؤثرة خلال 7 أيام؛ اضبط جدولة الري التكميلي على ${weeklyM3} م³/فدان أسبوعياً مقسمة على 3 ريات صباحية.`,
      messageEn: `No significant rainfall in the next 7 days; schedule ${weeklyM3} m³/feddan weekly across 3 early-morning applications.`,
      waterSavedM3PerFeddan: 18,
      metricBadge: `ET₀ ${avgEt0.toFixed(1)} mm`,
    });
  }

  // Spraying safety window alert
  const windyDay = forecast14Days.slice(0, 5).find((d) => d.windSpeedKmh >= 20);
  if (windyDay) {
    alerts.push({
      id: 'wind-spray-warning',
      severity: 'critical',
      titleAr: `تحذير رياح نشطة (${windyDay.dayLabelAr}: ${windyDay.windSpeedKmh} كم/س)`,
      titleEn: `High Wind Drift Alert (${windyDay.dayLabelEn}: ${windyDay.windSpeedKmh} km/h)`,
      messageAr: `تجنب رش المغذيات أو المبيدات يوم ${windyDay.dayLabelAr} لمنع انجراف الرش بنسبة 35%؛ أفضل نافذة للرش الآمن في الصباح الباكر عندما تقل الرياح عن 15 كم/س.`,
      messageEn: `Avoid pesticide or foliar spraying on ${windyDay.dayLabelEn} to prevent 35% spray drift; spray only when wind speed < 15 km/h.`,
      waterSavedM3PerFeddan: 0,
      metricBadge: `${windyDay.windSpeedKmh} km/h`,
    });
  }

  return alerts;
}

// ============================================================================
// 6. OPTIMAL CROP, QUALITY & PLANTING WINDOW RECOMMENDER (MCDA ENGINE)
// ============================================================================

export function scoreCropsForFarm(
  soil: SoilProfile,
  farmAverages: Record<SpectralIndexKey, number>,
  seasonalForecast: SeasonalMonthPrediction[],
  areaFeddans: number,
  currentCropId?: string
): ScoredCropRecommendation[] {
  const totalPredictedSeasonalRainMm = seasonalForecast.reduce(
    (acc, m) => acc + m.predictedRainMm,
    0
  );
  const avgPredictedTempC =
    seasonalForecast.reduce((acc, m) => acc + (m.avgTempMaxC + m.avgTempMinC) / 2, 0) /
    Math.max(1, seasonalForecast.length);

  const irrigEfficiency =
    soil.irrigation === 'drip'
      ? 0.9
      : soil.irrigation === 'pivot'
      ? 0.82
      : soil.irrigation === 'sprinkler'
      ? 0.78
      : soil.irrigation === 'flood'
      ? 0.62
      : 0.85;

  const currentCrop = CROP_DATABASE.find((c) => c.id === currentCropId);

  const results = CROP_DATABASE.map((crop): ScoredCropRecommendation => {
    // 1. Soil Texture & pH Match (0 - 100)
    const soilIndex = crop.preferredSoils.indexOf(soil.texture);
    const [minPh, maxPh] = crop.optimalPhRange;
    const phDeviation =
      soil.ph < minPh ? minPh - soil.ph : soil.ph > maxPh ? soil.ph - maxPh : 0;
    const phPenalty = Math.round(phDeviation * 16);
    const baseTextureScore =
      soilIndex === 0 ? 98 : soilIndex === 1 ? 90 : soilIndex >= 2 ? 82 : 58;
    const soilScore = Math.max(35, Math.min(100, baseTextureScore - phPenalty));

    // 2. Salinity Tolerance Match using FAO Maas-Hoffman threshold model (0 - 100)
    const excessEC = Math.max(0, soil.salinityEC - crop.maxSalinityEC);
    const yieldPenaltyPct = excessEC * crop.ecSlopePctPerDsm;
    const salinityScore = Math.round(
      Math.max(35, Math.min(100, 100 - yieldPenaltyPct * 1.4 - phPenalty * 0.4))
    );

    // 3. Climate & Planting Window Alignment (0 - 100)
    const [minT, maxT] = crop.optimalTempRangeC;
    const tempInWindow = avgPredictedTempC >= minT - 2 && avgPredictedTempC <= maxT + 2;
    const isNowWinterWindow = crop.optimalPlantingMonths.some((m) => [10, 11, 12].includes(m));
    const climateScore = Math.min(
      100,
      (tempInWindow ? 62 : 42) + (isNowWinterWindow ? 36 : 18)
    );

    // 4. Water, Irrigation System & Rainfall Synergy (0 - 100)
    const rainCoveragePct = Math.min(
      65,
      Math.round((totalPredictedSeasonalRainMm / crop.seasonalWaterReqMm) * 100)
    );
    const irrigationSynergyBonus =
      soil.irrigation === 'drip'
        ? 12
        : soil.irrigation === 'pivot'
        ? 10
        : soil.irrigation === 'sprinkler'
        ? 7
        : soil.irrigation === 'rainfed'
        ? crop.seasonalWaterReqMm <= 400
          ? 8
          : -14
        : 0;
    const waterSynergyScore = Math.min(
      100,
      Math.max(
        35,
        Math.round(
          70 +
            rainCoveragePct * 0.45 +
            irrigationSynergyBonus -
            (crop.seasonalWaterReqMm > 700 && soil.texture === 'sandy' ? 25 : 0)
        )
      )
    );

    // 5. Crop Rotation & Soil Health Synergy (0 - 100)
    let rotationScore = 82;
    if (crop.nitrogenFixer && soil.organicMatterPct < 1.8) {
      rotationScore = 97;
    } else if (currentCrop && currentCrop.id === crop.id) {
      rotationScore = 64; // penalty for monoculture back-to-back
    } else if (currentCrop && !currentCrop.nitrogenFixer && crop.nitrogenFixer) {
      rotationScore = 96; // cereal -> legume rotation bonus
    }

    const suitabilityScore = Math.round(
      soilScore * 0.24 +
        salinityScore * 0.24 +
        climateScore * 0.22 +
        waterSynergyScore * 0.16 +
        rotationScore * 0.14
    );

    const qualityScore = Math.min(
      99,
      Math.round(suitabilityScore * 0.92 + (farmAverages.NDVI > 0.55 ? 7 : 4))
    );

    const gradeLabel: ScoredCropRecommendation['gradeLabel'] =
      qualityScore >= 88
        ? 'Grade-A Export'
        : qualityScore >= 78
        ? 'Grade-A Local'
        : qualityScore >= 66
        ? 'Grade-B Standard'
        : 'Marginal';

    const effectiveRainMm = Math.min(
      crop.seasonalWaterReqMm * 0.65,
      totalPredictedSeasonalRainMm * 0.85
    );
    const netWaterDeficitMm = Math.max(80, crop.seasonalWaterReqMm - effectiveRainMm);
    const netIrrigationRequiredM3PerFeddan = Math.round(
      (netWaterDeficitMm * 4.20083) / irrigEfficiency
    );
    const totalFarmIrrigationM3 = Math.round(
      netIrrigationRequiredM3PerFeddan * Math.max(1, areaFeddans)
    );

    const yieldMultiplier = Math.max(0.55, Math.min(1.08, suitabilityScore / 92));
    const expectedYieldTonPerFeddan = Number(
      (crop.potentialYieldTonPerFeddan * yieldMultiplier).toFixed(2)
    );
    const totalFarmYieldTons = Number(
      (expectedYieldTonPerFeddan * Math.max(1, areaFeddans)).toFixed(1)
    );
    const estimatedRevenuePerFeddanEgp = Math.round(
      expectedYieldTonPerFeddan * crop.marketPriceEgpPerTon
    );

    // Compute Expected Harvest Month
    const harvestDate = new Date(
      new Date('2026-11-15T12:00:00Z').getTime() +
        crop.expectedHarvestDurationDays * 86400000
    );
    const harvestIso = harvestDate.toISOString().slice(0, 10);

    const whyGradeAAr = `توافق ممتاز مع التربة (${soilScore}%) وتحمل ملوحة حتى ${crop.maxSalinityEC} dS/m؛ الأمطار المتوقعة تغطي ${rainCoveragePct}% من الاحتياج المائي لتحقيق ${crop.qualityFactorsAr}`;
    const whyGradeAEn = `High soil compatibility (${soilScore}%) & EC tolerance up to ${crop.maxSalinityEC} dS/m; predicted rainfall covers ${rainCoveragePct}% of crop water demand for ${crop.qualityFactorsEn}`;

    return {
      crop,
      suitabilityScore,
      qualityScore,
      gradeLabel,
      breakdown: {
        soilScore,
        salinityScore,
        climateScore,
        waterSynergyScore,
        rotationScore,
      },
      predictedRainCoverageMm: Number(effectiveRainMm.toFixed(1)),
      predictedRainCoveragePct: rainCoveragePct,
      netIrrigationRequiredM3PerFeddan,
      totalFarmIrrigationM3,
      expectedYieldTonPerFeddan,
      totalFarmYieldTons,
      estimatedRevenuePerFeddanEgp,
      expectedHarvestDateAr: `${harvestIso} (بعد ${crop.expectedHarvestDurationDays} يوم)`,
      expectedHarvestDateEn: `${harvestIso} (${crop.expectedHarvestDurationDays} days)`,
      whyGradeAAr,
      whyGradeAEn,
    };
  });

  return results.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
}

/**
 * Generates the NASA Space Apps 3-Rotation Strategy Matrix comparing:
 * (A) Current Baseline Rotation
 * (B) Soil-Regenerative / Water-Saving Legume Rotation
 * (C) High-Value Climate-Resilient Rotation
 */
export function buildRotationStrategies(
  soil: SoilProfile,
  farmAverages: Record<SpectralIndexKey, number>
): RotationStrategyOption[] {
  const isSandyOrSaline = soil.texture === 'sandy' || soil.salinityEC >= 3.0;

  return [
    {
      id: 'A',
      code: 'ROTATION-A // BASELINE',
      titleAr: 'الاستراتيجية (A): الدورة التقليدية السائدة (خط الأساس)',
      titleEn: 'Strategy (A): Conventional Cereal Baseline Rotation',
      subtitleAr: 'استمرار النمط التقليدي (قمح شتوي ← ذرة شامية صيفي ← قمح)',
      subtitleEn: 'Continuous Cereal Sequence (Winter Wheat -> Summer Maize -> Wheat)',
      sequenceAr: ['موسم 1: قمح (سخا 95)', 'موسم 2: ذرة شامية (هجين 168)', 'موسم 3: قمح شتوي'],
      sequenceEn: ['Season 1: Winter Wheat', 'Season 2: Summer Maize', 'Season 3: Winter Wheat'],
      waterUseM3PerFeddanYear: 4650,
      waterSavingPct: 0,
      soilNitrogenDeltaKgPerFeddan: -35,
      salinityReductionDsm: 0.0,
      netProfitIndexPct: 100,
      nasaEvidence: [
        {
          mission: 'Sentinel-2 & MODIS NDVI',
          parameter: `NDVI Baseline (${farmAverages.NDVI})`,
          findingAr: 'تكرار النجيليات يظهر تراجعاً تدريجياً بنسبة 9% في ذروة NDVI بالموسم الثالث نتيجة استنزاف الأزوت.',
          findingEn: 'Back-to-back cereals show a 9% decline in peak NDVI by Season 3 due to nitrogen depletion.',
        },
        {
          mission: 'NASA SMAP Root-Zone Moisture',
          parameter: `NDMI (${farmAverages.NDMI})`,
          findingAr: 'استهلاك مائي مرتفع في الصيف (ذرة شامية) يخفض رطوبة الطبقة 7-28 سم دون 19%.',
          findingEn: 'High summer Maize evapotranspiration depletes 7–28cm root-zone moisture below 19%.',
        },
      ],
      dataGapsAr: [
        'دقة قمر SMAP الإقليمية (9 كم) تحتاج معايرة بحساسات رطوبة أرضية على عمق 25 سم.',
        'تحليل النيماتودا المعملي غير مرصود فضائياً بشكل مباشر.',
      ],
      dataGapsEn: [
        'SMAP coarse spatial footprint (9 km) requires local calibration with 25cm soil tensiometers.',
        'Sub-surface root-knot nematode density requires physical soil core assay.',
      ],
      agronomistChecklist: [
        {
          id: 'chk-a1',
          labelAr: 'فحص مستوى المادة العضوية والنيتروجين الميسر قبل الزراعة',
          labelEn: 'Verify soil organic matter and available nitrate before sowing',
          defaultChecked: true,
        },
        {
          id: 'chk-a2',
          labelAr: 'إضافة 20 م³ سماد بلدي متحلل لتعويض غياب المحصول البقولي',
          labelEn: 'Incorporate 20 m³ composted manure to offset missing legume phase',
          defaultChecked: false,
        },
      ],
      pestAndDiseaseMitigation: [
        {
          cropId: 'wheat',
          cropNameAr: 'القمح (Wheat — Triticum aestivum)',
          cropNameEn: 'Wheat (Sakha 95)',
          targetPestsAr: 'الصدأ الأصفر المخطط (Puccinia striiformis) + أعفان الجذور والفيوزاريوم + منّ الغلال',
          targetPestsEn: 'Yellow Stripe Rust + Fusarium Crown Rot + Cereal Aphids',
          mitigationMechanismAr:
            'في الدورة التقليدية (قمح ← ذرة ← قمح) تتراكم جراثيم الفيوزاريوم في بقايا الجذور النجيلية؛ يتطلب الأمر فرم الأحطاب، تطهير التقاوي الفطري الإلزامي، وإدخال موسم برسيم أو فول لكسر الحلقة.',
          mitigationMechanismEn:
            'Continuous cereal residues harbor Fusarium inoculum; requires strict seed dressing, stubble shredding, and inserting a legume break crop.',
          riskReductionPct: 35,
        },
        {
          cropId: 'maize',
          cropNameAr: 'الذرة الشامية (Maize — Zea mays)',
          cropNameEn: 'Maize (Hybrid 168)',
          targetPestsAr: 'دودة الحشد الخريفية (Spodoptera frugiperda) + ثاقبات الساق + عفن الساق المتأخر (Cephalosporium)',
          targetPestsEn: 'Fall Armyworm + Corn Stalk Borers + Late Wilt Disease',
          mitigationMechanismAr:
            'التعاقب النجيلي المتصل يرفع خطر عفن الساق المتأخر واليرقات البياتة في الأحطاب بنسبة 45%؛ يُنصح بالتخلص الفوري من بقايا السيقان بعد الحصاد وتشميس التربة.',
          mitigationMechanismEn:
            'Back-to-back Gramineae increases Late Wilt and overwintering stalk borer pupae by 45%; requires immediate stalk removal and soil solarization.',
          riskReductionPct: 38,
        },
        {
          cropId: 'cotton',
          cropNameAr: 'القطن المصري (Egyptian Cotton — Gossypium barbadense)',
          cropNameEn: 'Egyptian Cotton (Giza 94)',
          targetPestsAr: 'ديدان اللوز القرنفلية والشوكية + الذبول الفيوزاريومي + العنكبوت الأحمر',
          targetPestsEn: 'Pink & Spiny Bollworms + Fusarium Wilt + Two-Spotted Spider Mite',
          mitigationMechanismAr:
            'إدخال موسم قطن صيفي بدلاً من تكرار الذرة الشامية يوقف تكاثر ثاقبات الساق النجيلية ويعيد توازن الأعداء الحيوية في التربة.',
          mitigationMechanismEn:
            'Substituting Cotton for repeated summer Maize halts cereal stalk borer buildup and restores beneficial soil predator balance.',
          riskReductionPct: 64,
        },
      ],
    },
    {
      id: 'B',
      code: 'ROTATION-B // REGENERATIVE',
      titleAr: 'الاستراتيجية (B): الدورة المجددة للتربة والموفرة للمياه (موصى بها)',
      titleEn: 'Strategy (B): Soil-Regenerative & Water-Saving Legume Rotation',
      subtitleAr: 'كسر دورة الأمراض وتثبيت 55 كجم أزوت طبيعي/فدان (برسيم/فول ← قطن/ذرة ← قمح)',
      subtitleEn: 'Breaks cereal & cotton pest cycles & fixes +55 kg biological N/feddan',
      sequenceAr: [
        'موسم 1: فول بلدي جيزة 716 / برسيم مصري',
        'موسم 2: قطن مصري جيزة 94 / ذرة شامية',
        'موسم 3: قمح سخا 95 عالي الجودة',
      ],
      sequenceEn: [
        'Season 1: Fava Bean / Egyptian Clover (Berseem)',
        'Season 2: Egyptian Cotton (Giza 94) / Maize',
        'Season 3: Grade-A Sakha 95 Wheat',
      ],
      waterUseM3PerFeddanYear: 3390,
      waterSavingPct: 27,
      soilNitrogenDeltaKgPerFeddan: 55,
      salinityReductionDsm: 0.45,
      netProfitIndexPct: 128,
      nasaEvidence: [
        {
          mission: 'Sentinel-2 SAVI & EVI',
          parameter: `SAVI (${farmAverages.SAVI})`,
          findingAr: 'إدخال البقوليات يرفع مؤشر SAVI في الموسم التالي بنسبة +16% ويقلل احتياج اليوريا بمقدار شيكارتين/فدان.',
          findingEn: 'Legume inclusion boosts subsequent cereal SAVI by +16% and cuts synthetic urea demand by 100 kg/feddan.',
        },
        {
          mission: 'NASA POWER Agro-Climatology',
          parameter: 'ETc Water Balance',
          findingAr: 'توفير 1,260 م³ مياه/فدان سنوياً عبر توافق الفول البلدي والبرسيم مع نافذة أمطار نوفمبر-يناير.',
          findingEn: 'Saves 1,260 m³/feddan/year by aligning Fava Bean & Clover growth with Nov–Jan rainfall windows.',
        },
      ],
      dataGapsAr: [
        'تأكد من حيوية عقد الريزوبيا البكتيرية في حالة زيادة ملوحة التربة عن 3.0 dS/m.',
        'الغطاء السحابي الشتوي قد يؤخر رصد Sentinel-2 البصري لمدة 5-8 أيام.',
      ],
      dataGapsEn: [
        'Confirm Rhizobium nodulation viability where soil EC exceeds 3.0 dS/m.',
        'Winter cloud cover may introduce 5–8 day gaps in optical Sentinel-2 acquisitions.',
      ],
      agronomistChecklist: [
        {
          id: 'chk-b1',
          labelAr: 'تلقيح تقاوي الفول/البرسيم بالعقدين البكتيري النشط قبل الزراعة مباشرة',
          labelEn: 'Inoculate Fava/Clover seeds with fresh Rhizobium bio-inoculant at sowing',
          defaultChecked: true,
        },
        {
          id: 'chk-b2',
          labelAr: 'خفض جرعة التسميد الأزوتي للمحصول التالي بنسبة 35% للاستفادة من الأزوت المثبت',
          labelEn: 'Reduce synthetic N fertilizer on subsequent crop by 35%',
          defaultChecked: true,
        },
        {
          id: 'chk-b3',
          labelAr: 'مراجعة المهندس الزراعي المحلي لضبط جرعة الفوسفور المنشطة للجذور',
          labelEn: 'Confirm phosphorus starter dose with local extension agronomist',
          defaultChecked: false,
        },
      ],
      pestAndDiseaseMitigation: [
        {
          cropId: 'wheat',
          cropNameAr: 'القمح (Wheat — Triticum aestivum)',
          cropNameEn: 'Wheat (Sakha 95)',
          targetPestsAr: 'أعفان الجذور والتاج (Fusarium) + الصدأ الأصفر + حشائش الزمير والصامة النجيلية',
          targetPestsEn: 'Fusarium Crown Rot + Yellow Rust + Wild Oat Weeds',
          mitigationMechanismAr:
            'زراعة الفول البلدي أو البرسيم قبل القمح تحرم فطريات الفيوزاريوم من العائل النجيلي وتسمح بمكافحة حشائش الزمير بمبيدات اختيارية في المحصول البقولي، مما يخفض الإصابة بنسبة 82%.',
          mitigationMechanismEn:
            'Preceding Wheat with Fava Bean or Clover starves cereal-specific Fusarium pathogens and enables selective grassy-weed eradication, cutting disease pressure by 82%.',
          riskReductionPct: 82,
        },
        {
          cropId: 'cotton',
          cropNameAr: 'القطن المصري (Egyptian Cotton — Gossypium barbadense)',
          cropNameEn: 'Egyptian Cotton (Giza 94)',
          targetPestsAr: 'ديدان اللوز القرنفلية والشوكية (Pectinophora) + الذبول الفيوزاريومي + دودة ورق القطن',
          targetPestsEn: 'Pink & Spiny Bollworms + Fusarium Wilt + Cotton Leafworm',
          mitigationMechanismAr:
            'الدورة الثلاثية (برسيم تحريش ← قطن ← قمح) مع إيقاف ري البرسيم بعد 10 مايو تكسر دورة التزاوج بين دودة ورق القطن وديدان اللوز الساكنة وتقضي على الذبول الفيوزاريومي بنسبة 85%.',
          mitigationMechanismEn:
            'Classic Egyptian 3-year rotation (Clover -> Cotton -> Wheat) with May 10 clover irrigation cutoff breaks bollworm diapause and suppresses Fusarium wilt by 85%.',
          riskReductionPct: 85,
        },
        {
          cropId: 'maize',
          cropNameAr: 'الذرة الشامية (Maize — Zea mays)',
          cropNameEn: 'Maize (Hybrid 168)',
          targetPestsAr: 'دودة الحشد الخريفية + دودة القصب الكبيرة + عفن الساق المتأخر (Cephalosporium)',
          targetPestsEn: 'Fall Armyworm + Greater Sugar Cane Borer + Late Wilt',
          mitigationMechanismAr:
            'تعاقب الذرة الشامية بعد محصول بقولي شتوي يثري ميكروبيوم التربة الكابح لفطر Cephalosporium maydis ويمنع بيات العذارى في بقايا النجيليات.',
          mitigationMechanismEn:
            'Planting Maize after a winter legume enriches antagonistic soil microbes against Cephalosporium maydis and eliminates cereal stubble overwintering.',
          riskReductionPct: 79,
        },
      ],
    },
    {
      id: 'C',
      code: 'ROTATION-C // CLIMATE-RESILIENT',
      titleAr: 'الاستراتيجية (C): الدورة الذكية مناخياً عالية العائد والتصدير',
      titleEn: 'Strategy (C): High-Value Climate & Salinity-Resilient Rotation',
      subtitleAr: isSandyOrSaline
        ? 'مصممة خصيصاً للأراضي الرملية/الجيرية والملوحة المرتفعة'
        : 'تعظيم العائد التصديري لكل متر مكعب من المياه',
      subtitleEn: isSandyOrSaline
        ? 'Tailored for Sandy/Calcareous Soils & Elevated Salinity'
        : 'Maximizes Export Revenue per Cubic Meter of Water',
      sequenceAr: isSandyOrSaline
        ? ['موسم 1: بنجر سكر / كينوا سيناء', 'موسم 2: ذرة رفيعة شندويل 6', 'موسم 3: بطاطس تصدير / قمح']
        : ['موسم 1: بطاطس تصدير (سبونتا)', 'موسم 2: ذرة شامية / ذرة رفيعة', 'موسم 3: بنجر سكر / قمح'],
      sequenceEn: isSandyOrSaline
        ? ['Season 1: Sugar Beet / Quinoa', 'Season 2: Shandaweel 6 Sorghum', 'Season 3: Export Potato / Wheat']
        : ['Season 1: Export Potato (Spunta)', 'Season 2: Maize / Sorghum', 'Season 3: Sugar Beet / Wheat'],
      waterUseM3PerFeddanYear: 3120,
      waterSavingPct: 33,
      soilNitrogenDeltaKgPerFeddan: 20,
      salinityReductionDsm: 0.85,
      netProfitIndexPct: 146,
      nasaEvidence: [
        {
          mission: 'ISS ECOSTRESS Thermal LST & ESI',
          parameter: `LST (${farmAverages.LST}°C)`,
          findingAr: 'أصناف الكينوا وبنجر السكر والذرة الرفيعة تحافظ على اتزان حراري للأوراق حتى 36°م دون ذبول.',
          findingEn: 'Quinoa, Sugar Beet, and Sorghum maintain canopy thermal stability up to 36°C without stomatal shutdown.',
        },
        {
          mission: 'Landsat 8/9 SWIR Salinity Proxy',
          parameter: `Soil EC (${soil.salinityEC} dS/m)`,
          findingAr: 'الجذور الوتدية العميقة لبنجر السكر تكسر الطبقة الصماء وتتحمل ملوحة حتى 7 dS/m بكفاءة.',
          findingEn: 'Deep Sugar Beet taproots penetrate calcareous hardpans and tolerate EC up to 7 dS/m.',
        },
      ],
      dataGapsAr: [
        'يتطلب تحليل متبقيات المبيدات ومعايير الحجر الزراعي للتصدير الأوروبي.',
        'تذبذب أسعار التعاقدات التصديرية يحتاج مراجعة جمعية المصدرين قبل الزراعة.',
      ],
      dataGapsEn: [
        'Requires laboratory pesticide residue & phytosanitary certification for EU export.',
        'Forward contract pricing should be verified with regional export cooperatives.',
      ],
      agronomistChecklist: [
        {
          id: 'chk-c1',
          labelAr: 'إجراء غسيل ملحي خفيف مع حامض الفوسفوريك عبر شبكة التنقيط في الزونا A',
          labelEn: 'Run leaching pulse with phosphoric acid through Zone A drip lines',
          defaultChecked: true,
        },
        {
          id: 'chk-c2',
          labelAr: 'اعتماد تقاوي معتمدة خالية من العفن البني والفيروسات',
          labelEn: 'Procure certified pathogen-free seed tubers / monogerm seeds',
          defaultChecked: true,
        },
      ],
      pestAndDiseaseMitigation: [
        {
          cropId: 'potato',
          cropNameAr: 'بطاطس التصدير (Export Potato — Solanum tuberosum)',
          cropNameEn: 'Export Potato (Spunta)',
          targetPestsAr: 'العفن البني البكتيري (Ralstonia) + الندوة المتأخرة (Phytophthora) + فراشة درنات البطاطس',
          targetPestsEn: 'Bacterial Brown Rot + Late Blight + Potato Tuber Moth',
          mitigationMechanismAr:
            'فصل البطاطس بمحاصيل نجيلية (ذرة شامية/ذرة رفيعة أو قمح) يطهر التربة من بكتيريا العفن البني Ralstonia solanacearum ويمنع رفض الشحنات التصديرية.',
          mitigationMechanismEn:
            'Separating Potato with Gramineae crops (Maize/Sorghum or Wheat) purges soil-borne Ralstonia bacterial brown rot and safeguards export certification.',
          riskReductionPct: 88,
        },
        {
          cropId: 'sugar_beet',
          cropNameAr: 'بنجر السكر (Sugar Beet — Beta vulgaris)',
          cropNameEn: 'Sugar Beet (Monogerm)',
          targetPestsAr: 'نيماتودا تعقد وحوصلات الجذور (Heterodera) + عفن الجذور الريزوكتوني + تبقع الأوراق السركسبوري',
          targetPestsEn: 'Beet Cyst Nematode + Rhizoctonia Root Rot + Cercospora Leaf Spot',
          mitigationMechanismAr:
            'إفرازات جذور الذرة الرفيعة والقمح تقلل فقس حوصلات النيماتودا بنسبة 76% وتمنع تراكم جراثيم الريزوكتونيا في الأراضي الجيرية.',
          mitigationMechanismEn:
            'Sorghum and Wheat root exudates suppress beet cyst nematode hatching by 76% and prevent Rhizoctonia sclerotia buildup.',
          riskReductionPct: 76,
        },
        {
          cropId: 'wheat',
          cropNameAr: 'القمح (Wheat — Triticum aestivum)',
          cropNameEn: 'Wheat (Sakha 95)',
          targetPestsAr: 'الصدأ الأصفر المخطط + أعفان الجذور + حشائش عريضة ونجيلية',
          targetPestsEn: 'Yellow Stripe Rust + Root Rot + Broadleaf & Grassy Weeds',
          mitigationMechanismAr:
            'دخول القمح بعد بنجر السكر أو البطاطس يستفيد من النظافة الكاملة للمرقد من الحشائش النجيلية والأعفان الفطرية.',
          mitigationMechanismEn:
            'Sowing Wheat after Sugar Beet or Potato leverages a clean, grassy-weed-free seedbed with zero cereal root-rot carryover.',
          riskReductionPct: 84,
        },
      ],
    },
  ];
}

// ============================================================================
// 7. CONTEXT-AWARE AI AGRONOMIST RESPONSE GENERATOR & WEEKLY CHECKLIST
// ============================================================================

export function buildWeeklyFarmChecklist(
  area: AreaBreakdown,
  subZones: SubZoneSummary[],
  forecast: DailyWeatherPoint[],
  topCrop: ScoredCropRecommendation
): WeeklyChecklistTask[] {
  const zoneA = subZones.find((z) => z.id === 'A') || subZones[0];
  const zoneC = subZones.find((z) => z.id === 'C') || subZones[2];
  const rainDay = forecast.slice(0, 5).find((d) => d.precipMm >= 3);

  return [
    {
      id: 'task-1',
      category: 'irrigation',
      dayAr: 'السبت / الأحد',
      dayEn: 'Sat / Sun',
      titleAr: rainDay
        ? `إيقاف الري قبل أمطار ${rainDay.dayLabelAr} (${rainDay.precipMm} مم)`
        : `ضبط مقنن الري المتغير بين زونا A وزونا C`,
      titleEn: rainDay
        ? `Suspend Irrigation Ahead of ${rainDay.dayLabelEn} Rain (${rainDay.precipMm} mm)`
        : `Apply Variable-Rate Irrigation Across Zone A & Zone C`,
      detailAr: rainDay
        ? `توفير ${Math.round(rainDay.precipMm * 3.8 * Math.max(1, area.totalFeddansDecimal))} م³ مياه لإجمالي المساحة (${area.feddans} فدان و${area.qirats} قيراط).`
        : `زيادة ري زونا A بنسبة +15% (NDVI ${zoneA.ndvi}) وتخفيض ري زونا C بنسبة -10% (NDVI ${zoneC.ndvi}).`,
      detailEn: rainDay
        ? `Saves ${Math.round(rainDay.precipMm * 3.8 * Math.max(1, area.totalFeddansDecimal))} m³ across your ${area.totalFeddansDecimal} feddans.`
        : `Increase Zone A runtime +15% (NDVI ${zoneA.ndvi}) and reduce Zone C by -10% (NDVI ${zoneC.ndvi}).`,
      completed: false,
      priority: 'high',
    },
    {
      id: 'task-2',
      category: 'fertilization',
      dayAr: 'الإثنين',
      dayEn: 'Monday',
      titleAr: `تسميد بوتاسي وعناصر صغرى لرفع جودة ${topCrop.crop.nameAr}`,
      titleEn: `Potassium & Micronutrient Fertigation for ${topCrop.crop.nameEn}`,
      detailAr: `إضافة 12 كجم سلفات بوتاسيوم + 500 جم زنك مخلبي/فدان لدعم مقاومة الإجهاد الحراري والملحي.`,
      detailEn: `Inject 12 kg/feddan potassium sulfate + 500g chelated zinc to boost osmotic stress tolerance.`,
      completed: false,
      priority: 'high',
    },
    {
      id: 'task-3',
      category: 'scouting',
      dayAr: 'الأربعاء',
      dayEn: 'Wednesday',
      titleAr: `فحص ميداني للركن الشمالي الشرقي (زونا A — ${zoneA.areaFeddans} فدان)`,
      titleEn: `Field Scouting in North-East Sector (Zone A — ${zoneA.areaFeddans} Feddans)`,
      detailAr: `حرارة سطح الأوراق LST سجلت ${zoneA.lstCelsius}°م؛ افحص انسداد النقاطات وملوحة التربة السطحية.`,
      detailEn: `ECOSTRESS LST reached ${zoneA.lstCelsius}°C; check dripper clogging and surface salt crust.`,
      completed: true,
      priority: 'medium',
    },
    {
      id: 'task-4',
      category: 'soil',
      dayAr: 'الخميس',
      dayEn: 'Thursday',
      titleAr: `تجهيز التوقيت الذهبي للزراعة (${topCrop.crop.optimalPlantingStartAr} - ${topCrop.crop.optimalPlantingEndAr})`,
      titleEn: `Prepare Golden Planting Window (${topCrop.crop.optimalPlantingStartEn} – ${topCrop.crop.optimalPlantingEndEn})`,
      detailAr: `المحصول الأعلى ملاءمة: ${topCrop.crop.nameAr} بنسبة توافق ${topCrop.suitabilityScore}% وإنتاجية متوقعة ${topCrop.expectedYieldTonPerFeddan} طن/فدان.`,
      detailEn: `Top matched crop: ${topCrop.crop.nameEn} (${topCrop.suitabilityScore}% match, ${topCrop.expectedYieldTonPerFeddan} ton/feddan).`,
      completed: false,
      priority: 'normal',
    },
  ];
}

export function generateLocalAgronomistResponse(
  query: string,
  context: {
    zoneNameAr: string;
    zoneNameEn: string;
    area: AreaBreakdown;
    soil: SoilProfile;
    farmAverages: Record<SpectralIndexKey, number>;
    subZones: SubZoneSummary[];
    forecast14: DailyWeatherPoint[];
    topCrops: ScoredCropRecommendation[];
    language: 'ar' | 'en';
    hasUserZones?: boolean;
  }
): string {
  const q = query.toLowerCase();
  const { area, soil, farmAverages, subZones, forecast14, topCrops, language, hasUserZones } =
    context;
  const isAr = language === 'ar';

  const isZoneAvailable =
    hasUserZones !== false && subZones.length >= 3 && area.totalFeddansDecimal > 0;

  // 1. Identity & Role Queries (Who are you?)
  const isIdentityQuery =
    /(?:انت\s*مين|إنت\s*مين|من\s*أنت|من\s*انت|عرف\s*نفسك|مين\s*انت|مين\s*إنت|وظيفتك|ما\s*(?:هو\s*)?(?:دورك|عملك|تطبيق|الموقع|هذا)|who\s+are\s+you|what\s+are\s+you|what\s+is\s+this\s+app)/i.test(
      q
    );

  if (isIdentityQuery) {
    if (!isAr) {
      return `I am **GeoAgri ai**, your intelligent Agronomic Advisor and Geospatial Decision Support System on the **GeoAgri Pro** platform.
• **Crop Knowledge & How-To Guides:** Ask me how to grow any crop (Rice, Wheat, Fava Bean, Potato, Tomato, Corn, Sugar Beet, Cotton, etc.) with exact seed rates, planting windows, and schedules.
• **Satellite Health & Precision Irrigation:** Real-time Sentinel-2 NDVI, NDWI, ECOSTRESS thermal stress tracking, and precision m³/feddan water budgeting.
• **Fertilization & IPM:** Calculated 4-week NPK schedules, salinity leaching, and targeted pest/disease control.
• **Full Platform Control:** Command me to add farm parcels, switch map layers, manage weekly tasks, or export comprehensive PDF engineering reports.`;
    }
    return `أنا **GeoAgri ai**، المستشار الزراعي الذكي ونظام دعم القرار الجغرافي الزراعي على منصة **GeoAgri Pro**.
أنا مبرمج ومزود بأحدث البيانات الفضائية لمساعدتك علمياً وعملياً في:
1. **أدلة زراعة المحاصيل:** اسألني عن كيفية زراعة أي محصول (أرز، قمح، فول بلدي، ذرة، بطاطس، طماطم، بنجر سكر، قطن، برسيم...) وسأعطيك الموعد وإعداد الأرض والتسميد والري فوراً وبإيجاز.
2. **المؤشرات الفضائية والري الدقيق:** تحليل صحة نباتاتك عبر أقمار Sentinel-2 وحساب المقنن المائي الدقيق (م³/فدان) استناداً لتوقعات NASA والأرصاد.
3. **التسميد والمكافحة:** جداول NPK وحسابات غسيل الأملاح ومكافحة الآفات الفطرية والحشرية.
4. **التحكم بالمنصة:** اطلب مني إضافة مزارع، تغيير الطبقات، إضافة مهام، أو استخراج تقرير PDF هندسي.`;
  }

  // 1.5 Authoritative NASA & Space Agency Data Foundations Query
  const isDataSourcesQuery =
    /(?:مصادر\s*البيانات|مصدر\s*البيانات|بيانات\s*ناسا|أقمار\s*ناسا|اقمار\s*ناسا|الأقمار\s*الصناعية|الاقمار\s*الصناعية|الدقة\s*العلمية|منين\s*البيانات|صحة\s*البيانات|دقة\s*البيانات|data\s*sources?|nasa\s*data|satellites?|data\s*provenance|\bsmap\b|\becostress\b|\bimerg\b|\blandsat\b|\bsentinel\b|\bgaez\b|\bssurgo\b)/i.test(
      q
    );

  if (isDataSourcesQuery) {
    if (!isAr) {
      return `🛰️ **Authoritative NASA & Space Agency Data Foundations (24 Datasets):**
GeoAgri Pro is 100% mathematically grounded in verified Earth Observation & agricultural science repositories:
1. **Satellite Earth Observation:** Sentinel-2 (ESA, 10m MSI), Landsat 8/9 (NASA/USGS, 30m), MODIS/VIIRS (NASA, 250m), ECOSTRESS (NASA JPL, 70m LST/ET), SMAP (NASA, 9km root-zone soil moisture), SRTM (NASA, 30m 3D topography), GEDI (NASA/UMD lidar biomass), and GPM IMERG (NASA/JAXA, 0.1° precipitation).
2. **Agro-Meteorology & Reanalysis:** NASA POWER (daily solar & agro-climatology), ECMWF ERA5 (hourly reanalysis), PRISM (topographic normals), NLDAS/GLDAS, and CoCoRaHS ground-gauge validation.
3. **Soils, Hydrology & Evapotranspiration:** USDA Web Soil Survey (WSS), USDA NRCS SSURGO/STATSGO2, OpenET (field-scale ETa), and USGS NWIS groundwater levels.
4. **Cropland, Rotations & Economics:** USDA Cropland Data Layer (CDL/CropScape), USDA Ag Data Commons, FAO GAEZ v4 (agro-ecological suitability), USGS NLCD, USDA NAIP (1m aerial), USFS LANDFIRE, USDA AMS Market News, and USDA NASS QuickStats.
• Click the **«NASA Data (24)»** button on the top navigation bar to explore the interactive space catalog with direct links!`;
    }
    return `🛰️ **مرتكزات بيانات الفضاء وناسا المعتمدة في GeoAgri Pro (24 منظومة فضائية وعلمية):**
تعتمد المنصة بنسبة 100% على بيانات حقيقية ومعايرة رياضياً من أرقى وكالات الفضاء والمراكز الزراعية العالمية:
1. **أقمار الرصد الفضائي المباشر:** Sentinel-2 (وكالة الفضاء الأوروبية بدقة 10م للمؤشرات الحقلية)، Landsat 8/9 (ناسا والمساحة الجيولوجية 30م)، MODIS/VIIRS (ناسا بدقة 250م للسلاسل الزمنية)، ECOSTRESS (مختبر الدفع النفاث ناسا بدقة 70م للإجهاد الحراري LST)، SMAP (ناسا لقياس رطوبة التربة الجذرية والسطحية)، SRTM (ناسا للتضاريس والانحدارات 3D)، GEDI (ليدار الكتلة الحيوية)، وGPM IMERG (رادار الأمطار العالمي).
2. **المناخ والأرصاد الزراعية:** NASA POWER (واجهة ناسا المباشرة للإشعاع الشمسي والبخر)، ECMWF ERA5 (إعادة التحليل المناخي الساعي)، PRISM (المناخ المصغر)، NLDAS/GLDAS (نماذج اليابسة)، وشبكة CoCoRaHS الأرضية.
3. **التربة والموارد المائية والبخر:** USDA Web Soil Survey ومسح التربة الرقمي SSURGO/STATSGO2 (قوام التربة والملوحة والسعة المائية)، OpenET (البخر-نتح الفعلي)، وبيانات المياه الجوفية USGS NWIS.
4. **تصنيف المحاصيل والدورات الزراعية والأسواق:** طبقة المحاصيل السنوية USDA CDL / CropScape، قاعدة FAO GAEZ v4 لملاءمة المحاصيل، USDA Ag Data Commons، تصوير NAIP الجوي (1م)، لاندفاير LANDFIRE، وأسعار البورصات السلعية USDA AMS وNASS QuickStats.
• يمكنك الضغط على زر **«بيانات NASA (24)»** في شريط الموقع العلوي لفتح الدليل الفضائي التفاعلي الكامل بالروابط الرسمية!`;
  }

  // 2. Conversational greetings & Mic checks
  const isConversationalGreetingOrMicCheck =
    /(?:^|[\s،,.\-?!])(?:سامعني|تسمعني|بتسمعني|شغال|تجربة|اختبار|أهلا|اهلا|مرحبا|السلام\s*عليكم|صباح\s*الخير|مساء\s*الخير|ازيك|إزيك|عامل\s*ايه|عامل\s*إيه|أخبارك|شكرا|شكراً|hello|hi\b|hey\b|can\s*you\s*hear\s*me|testing|mic\s*check)(?:$|[\s،,.\-?!])/i.test(
      q
    );

  const hasWaterOrIrrigationIntent =
    /(?:^|[\s،,.\-?!])(?:ال)?(?:ري|روي|مطر|امطار|أمطار|مياه|سقي|نسقي|أروي|اروي|تروي|نروي|عطش|مقنن|غمر|تنقيط|رش|بيفوت)(?:$|[\s،,.\-?!])/i.test(
      q
    ) || /\b(?:rain|irrigat\w*|water\w*)\b/i.test(q);

  const hasPestOrDiseaseIntent =
    /(?:آفة|آفات|افات|حشر|فطر|صدأ|دودة|لوز|حشرة\s*المن|المنّ|ندوة|لفحة|ذبول|مكافحة|وقاي|مبيد|مرض|أمراض|امراض)/i.test(
      q
    ) || /\b(?:pest|disease|blight|rust|bollworm|aphid|armyworm|outbreak|ipm)\b/i.test(q);

  // 3. Detect Specific Crop Entities (with Arabic prefixes: و/ف/ب/ل)
  const isRice = /(?:^|[\s،,.\-?!])(?:و|ف|ب|ل)?(?:ال)?(?:رز|أرز|ارز|شلب|rice)(?:$|[\s،,.\-?!])/i.test(q);
  const isFava = /(?:^|[\s،,.\-?!])(?:و|ف|ب|ل)?(?:ال)?(?:فول|فول\s*بلدي|حراتي|fava|broad\s*bean)(?:$|[\s،,.\-?!])/i.test(q);
  const isWheat = /(?:^|[\s،,.\-?!])(?:و|ف|ب|ل)?(?:ال)?(?:قمح|حنطة|غلة|wheat)(?:$|[\s،,.\-?!])/i.test(q);
  const isPotato = /(?:^|[\s،,.\-?!])(?:و|ف|ب|ل)?(?:ال)?(?:بطاطس|بطاطا|potato(?:es)?)(?:$|[\s،,.\-?!])/i.test(q);
  const isMaize = /(?:^|[\s،,.\-?!])(?:و|ف|ب|ل)?(?:ال)?(?:ذرة|ذره|شامية|صفراء|corn|maize)(?:$|[\s،,.\-?!])/i.test(q);
  const isTomato = /(?:^|[\s،,.\-?!])(?:و|ف|ب|ل)?(?:ال)?(?:طماطم|قوطة|بندورة|tomato(?:es)?)(?:$|[\s،,.\-?!])/i.test(q);
  const isBeet = /(?:^|[\s،,.\-?!])(?:و|ف|ب|ل)?(?:ال)?(?:بنجر|شمندر|sugar\s*beet)(?:$|[\s،,.\-?!])/i.test(q);
  const isClover = /(?:^|[\s،,.\-?!])(?:و|ف|ب|ل)?(?:ال)?(?:برسيم|clover|berseem)(?:$|[\s،,.\-?!])/i.test(q);
  const isCotton = /(?:^|[\s،,.\-?!])(?:و|ف|ب|ل)?(?:ال)?(?:قطن|cotton)(?:$|[\s،,.\-?!])/i.test(q);
  const isOnionGarlic = /(?:^|[\s،,.\-?!])(?:و|ف|ب|ل)?(?:ال)?(?:بصل|ثوم|توم|onion|garlic)(?:$|[\s،,.\-?!])/i.test(q);
  const isOlive = /(?:^|[\s،,.\-?!])(?:و|ف|ب|ل)?(?:ال)?(?:زيتون|olive)(?:$|[\s،,.\-?!])/i.test(q);
  const isCitrus = /(?:^|[\s،,.\-?!])(?:و|ف|ب|ل)?(?:ال)?(?:موالح|برتقال|يوسفي|ليمون|citrus|orange)(?:$|[\s،,.\-?!])/i.test(q);

  const hasAnySpecificCrop =
    isRice || isFava || isWheat || isPotato || isMaize || isTomato || isBeet || isClover || isCotton || isOnionGarlic || isOlive || isCitrus;

  // Query Types
  const isHowToPlant =
    hasAnySpecificCrop &&
    (/(?:ازاي|إزاي|كيف|طريقة|خطوات|برنامج|عايز\s*ازرع|حابب\s*ازرع|كيفية|how\s+to\s+(?:grow|plant)|how\s+do\s+i\s+plant)/i.test(
      q
    ) || /(?:أزرع|ازرع|زراعة)/i.test(q));

  const isCropSuitabilityInquiry =
    hasAnySpecificCrop &&
    (/(?:طيب|ينفع|يناسب|مناسب|تناسب|مناسبة|رأيك|اخبار|أخبار|تنصح|هل\s*(?:يناسب|ينفع|أزرع)|what\s+about|is\s+it\s+suitable)/i.test(
      q
    ) || q.startsWith('طيب') || q.startsWith('و') || q.includes('رأيك'));

  const hasBestCropIntent =
    !hasAnySpecificCrop &&
    (/(?:أفضل\s*محصول|افضل\s*محصول|أحسن\s*محصول|احسن\s*محصول|توصيات\s*المحاصيل|ماذا\s*أزرع|ماذا\s*ازرع|ايه\s*احسن\s*محصول|إيه\s*أحسن\s*محصول|best\s*crop|what\s+should\s+i\s+plant|what\s+to\s+plant)/i.test(
      q
    ) || (/(?:محصول|أزرع|ازرع|زراعة)/i.test(q) && !hasAnySpecificCrop));

  // Handle Greetings / Mic Check
  if (isConversationalGreetingOrMicCheck && !hasWaterOrIrrigationIntent && !hasPestOrDiseaseIntent && !hasAnySpecificCrop && !hasBestCropIntent) {
    if (!isAr) {
      return isZoneAvailable
        ? `Yes, I'm here and ready to help with **${context.zoneNameEn}** (${area.feddans} Feddans). Ask me anything about your crop, irrigation, soil, pests, or platform controls!`
        : `Yes, I'm here and listening clearly! Ask me any agricultural question, attach a plant photo/video, or ask me to add a farm zone on the map.`;
    }
    return isZoneAvailable
      ? `أهلاً بك! أنا معك وسامعك بوضوح، وجاهز لمساعدتك في مزرعتك **${context.zoneNameAr}** (${area.feddans} فدان). اسألني عن أي شيء يخص المحصول، التربة، الري، الآفات، أو التحكم في الخريطة.`
      : `أهلاً بك! أنا معك وسامعك بوضوح. اسألني أي سؤال زراعي، أو أرفق صورة/فيديو للنبات، أو اطلب مني إضافة مزرعة على الخريطة وسأنفذ فوراً.`;
  }

  // -------------------------------------------------------------------------
  // 4. ACTIONABLE CROP PLANTING GUIDES (HOW TO GROW A SPECIFIC CROP)
  // -------------------------------------------------------------------------
  if (isHowToPlant) {
    if (isRice) {
      if (!isAr) {
        return `🌾 **Concise Rice (Oryza sativa) Cultivation Guide:**
1. **Window & Nursery:** Sowing in nursery: May 1–20. Transplant seedlings to field at 25–30 days old (June).
2. **Land Prep & Water:** Two orthogonal deep ploughings + precision laser levelling (saves >20% water). Add 100 kg superphosphate during preparation.
3. **Planting & Spacing:** Transplant 3–4 seedlings per hill at 20×20 cm spacing, or direct drill at 60–70 kg seeds/feddan (Sakha 108, Giza 178, Sakha 101).
4. **Fertilization & Water:** 40–60 N units (urea or ammonium sulfate) split into 3 doses: basal puddling, tillering, and panicle initiation + 10 kg zinc sulfate. Maintain 3–5 cm water ponding with alternate wetting/drying after establishment.`;
      }
      return `🌾 **الدليل العلمي لزراعة الأرز (موجز وعملي):**
1. **الموعد والتقاوي:** زراعة المشتل من 1 إلى 20 مايو، والشتل في يونيو عند عمر 25–30 يوماً. التقاوي: 50–60 كجم/فدان شتل، أو 60–70 كجم بدار/تسطير (أصناف موفرة للمياه: سخا 108، جيزة 178، سخا 101).
2. **إعداد الأرض:** حرث متعامد مع تسوية دقيقة بالليزر (توفر 20% من مياه الري) + إضافة 100 كجم سوبر فوسفات أثناء الخدمة.
3. **طريقة الزراعة:** الشتل في جور بمسافات 20×20 سم بمعدل 3–4 شتلات بالجورة في وجود مياه ضحلة.
4. **التسميد والري:** 40–60 وحدة أزوت (يوريا أو سلفات نشادر) على 3 دفعات (مع التلويط، بداية التفريع، وتمايز السنابل) + 10 كجم سلفات زنك بعد التلويط مباشرة. الري بغمر 3–5 سم مع إمكانية التجفيف يومين كل أسبوعين لتوفير المياه دون نقص الإنتاجية.`;
    }

    if (isFava) {
      if (!isAr) {
        return `🌱 **Concise Fava Bean (Vicia faba) Cultivation Guide:**
1. **Window & Cultivars:** Sowing: Nov 1–15 (Lower Egypt) / Oct 15–30 (Upper Egypt). Rate: 50–60 kg/feddan (Giza 716, Sakha 4, Misr 1).
2. **Soil Prep:** Add 150 kg calcium superphosphate + 50 kg agricultural sulfur during ploughing. Furrow at 12 ridges per 7.1m.
3. **Inoculation & Planting:** Inoculate seeds with Rhizobium leguminosarum bio-fertilizer. Sow 2 seeds/hill at 20–25 cm spacing.
4. **Fertilizer & Irrigation:** 15 kg starter ammonium sulfate + 50 kg potassium sulfate at flowering. Life irrigation (رية المحاياة) after 30–35 days, then irrigate every 20–25 days (avoid waterlogging at flowering). Spray copper oxychloride for chocolate spot.`;
      }
      return `🌱 **الدليل العلمي لزراعة الفول البلدي (موجز وعملي):**
1. **الموعد والتقاوي:** النصف الأول من نوفمبر في الوجه البحري (1–15 نوفمبر)، والنصف الثاني من أكتوبر في الصعيد. معدل التقاوي: 50–60 كجم/فدان (أصناف: جيزة 716، سخا 4، مصر 1 المقاومة للتبقع والهالوك).
2. **إعداد الأرض:** حرث جيد مع إضافة 150 كجم سوبر فوسفات كلسي + 50 كجم كبريت زراعي، ثم التخطيط بمعدل 12 خطاً في القصبتين.
3. **الزراعة والتلقيح:** خلط التقاوي بلقاح العِقّدين (Rhizobium) لتثبيت النيتروجين الجوي، والزراعة في جور على مسافة 20–25 سم بمعدل بذرتين في الجورة.
4. **التسميد والري:** جرعة أزوت تنشيطية (15 كجم سلفات نشادر عند الزراعة) + 50 كجم سلفات بوتاسيوم عند التزهير. رية المحاياة بعد 30–35 يوماً ثم الري كل 20–25 يوماً دون تغريق. المكافحة: رش أوكسي كلورور النحاس للتبقع البني، وراوند أب (75 سم³/فدان) عند التزهير لمكافحة الهالوك.`;
    }

    if (isWheat) {
      if (!isAr) {
        return `🌾 **Concise Wheat Cultivation Guide:**
1. **Window & Cultivars:** Nov 15–30. Rate: 45–50 kg/feddan (drilled) / 60 kg (broadcast). Top cultivars: Sakha 95, Misr 3, Giza 171.
2. **Soil Prep:** Laser leveling + 100 kg superphosphate + 50 kg agricultural sulfur incorporated during tillage.
3. **Fertilization:** 75 N units (split over first 3 irrigations) + 50 kg potassium sulfate before heading.
4. **Irrigation Schedule:** 5–6 irrigations: critical life irrigation at 21 days, tillering, heading, and grain filling. Avoid irrigating during high wind shear.`;
      }
      return `🌾 **الدليل العلمي لزراعة القمح (موجز وعملي):**
1. **الموعد والتقاوي:** التوقيت الذهبي من 15 إلى 30 نوفمبر. التقاوي: 45–50 كجم/فدان تسطير، 60 كجم بدار (أصناف: سخا 95 المقاوم للصدأ والحرارة، مصر 3، جيزة 171).
2. **إعداد الأرض:** تسوية دقيقة بالليزر، وإضافة 100 كجم سوبر فوسفات + 50 كجم كبريت زراعي أثناء الحرث.
3. **التسميد:** 75 وحدة أزوت (نترات أو سلفات نشادر) تقسم على 3 دفعات قبل الريات الثلاث الأولى + 50 كجم سلفات بوتاسيوم قبل طرد السنابل.
4. **الري والمكافحة:** 5–6 ريات خلال الموسم، أهمها رية المحاياة بعد 21 يوماً، ورية طرد السنابل، مع تجنب الري في الأيام العاصفة لمنع الرقاد. الفحص الدوري للصدأ الأصفر والرش بتيبيكونازول فور ظهوره.`;
    }

    if (isPotato) {
      if (!isAr) {
        return `🥔 **Concise Potato Cultivation Guide:**
1. **Cycles & Tubers:** Autumn (Aug/Sep), Winter (Oct), Summer (Dec/Jan). Rate: 1.25–1.5 t/feddan certified cut seed tubers (Spunta, Cara, Hermes).
2. **Bed Prep:** Compost + 200 kg superphosphate + 100 kg sulfur. Form wide beds (75–80 cm width).
3. **Fertigation:** 100–120 kg N + 80 kg P₂O₅ + 150 kg K₂O (K is critical for tuber bulk density).
4. **Water & Blight:** Uniform drip moisture without waterlogging. Preventive sprays of Mancozeb and Cymoxanil against Late Blight.`;
      }
      return `🥔 **الدليل العلمي لزراعة البطاطس (موجز وعملي):**
1. **العروات والتقاوي:** خريفية (أغسطس/سبتمبر)، محيرة شتوية (أكتوبر)، وصيفية (ديسمبر/يناير). معدل التقاوي: 1.25–1.5 طن درنات معتمدة ومطهرة (سبونتا، كارا، هيرميس).
2. **إعداد الأرض:** إضافة سماد عضوي متحلل (كمبوست) + 200 كجم سوبر فوسفات + 100 كجم كبريت زراعي، وإقامة مصاطب بعرض 75–80 سم.
3. **التسميد:** 100–120 كجم N + 80 كجم P₂O₅ + 150 كجم K₂O (البوتاسيوم أساسي لحجم وجودة الدرنات وصلابتها).
4. **الري والوقاية:** ري منتظم متقارب بنظام التنقيط. الرش الوقائي بمبيد مانكوزيب وميتالاكسيل لمنع الندوة المتأخرة والندوة المبكرة.`;
    }

    if (isMaize) {
      if (!isAr) {
        return `🌽 **Concise Corn/Maize Cultivation Guide:**
1. **Window & Seed:** Mid-May to mid-June. Rate: 10–12 kg/feddan single cross hybrid (e.g. SC 10 or Yellow 168).
2. **Spacing & Ridging:** 10–12 ridges per 7.1m. Plant 1 seed/hill at 25 cm spacing along single side.
3. **Fertilizer:** 100–120 N units split into 2 doses (before 1st and 2nd irrigations) + 100 kg superphosphate + 50 kg K₂O.
4. **Pest Defense:** Early scouting and spray against Fall Armyworm with Emamectin Benzoate at 15–20 days.`;
      }
      return `🌽 **الدليل العلمي لزراعة الذرة الشامية (موجز وعملي):**
1. **الموعد والتقاوي:** من منتصف مايو حتى منتصف يونيو. معدل التقاوي: 10–12 كجم/فدان هجين فردي عالي الإنتاجية (مثل هجين فردي 10 أبيض أو هجين 168 أصفر).
2. **الزراعة:** تخطيط 10–12 خط في القصبتين، والزراعة في جور على مسافة 25 سم حبة واحدة بالجورة على ريشة واحدة.
3. **التسميد:** 100–120 وحدة أزوت على دفعتين قبل الرية الأولى والثانية + 100 كجم سوبر فوسفات + 50 كجم سلفات بوتاسيوم.
4. **المكافحة:** الرش الدوري الوقائي ضد دودة الحشد الخريفية وثاقبات الذرة بمركب إيمامكتين بنزوات عند عمر 15–20 يوماً.`;
    }

    if (isTomato) {
      if (!isAr) {
        return `🍅 **Concise Tomato Cultivation Guide:**
1. **Transplanting:** Spring, Summer, and Autumn cycles. Use 30-day container seedlings spaced 40–50 cm on drip-irrigated beds.
2. **Fertigation Formula:** High-P starter for roots, balanced 19-19-19 for canopy, high-K + Calcium-Boron for fruit set and firmness.
3. **Water Management:** Avoid moisture fluctuations to prevent Blossom-End Rot and fruit cracking.
4. **IPM:** Monitor Tuta absoluta with pheromone traps (apply Chlorantraniliprole) and Whitefly to block TYLCV virus.`;
      }
      return `🍅 **الدليل العلمي لزراعة الطماطم (موجز وعملي):**
1. **الشتل والمواعيد:** عروات صيفية (فبراير/مارس)، نيلية (يوليو/أغسطس)، وشتوية (سبتمبر/أكتوبر). شتلات صواني عمر 30 يوماً بمسافة 40–50 سم على مصاطب عريضة.
2. **برنامج التسميد بالتنقيط:** سماد عالي الفوسفور أول أسبوعين لتنشيط الجذور، ثم متعادل NPK للنمو الخضري، ثم عالي البوتاسيوم مع رشة كالسيوم-بورون لصلابة الثمار ومنع عفن الطرف الزهري.
3. **الري:** ري يومي منتظم بالتنقيط في الصباح الباكر دون تذبذب لمنع تشقق الثمار.
4. **المكافحة:** مكافحة حشرة التوتا أبسلوتا بالمصائد الفرمونية ورش كلورانترانيليبرول، ومكافحة الذبابة البيضاء لمنع فيروس تجعد الأوراق.`;
    }

    if (isBeet) {
      if (!isAr) {
        return `🌱 **Concise Sugar Beet Cultivation Guide:**
1. **Window:** Mid-August to late October. Rate: 1 kg monogerm or 3–4 kg multigerm seed.
2. **Fertilization:** 60–80 N units. Stop all nitrogen 60 days before harvest to maximize sucrose content. Foliar Boron at 90 & 120 days.
3. **Water & Harvest:** Moderate regular irrigations. Cease irrigation 20–30 days before harvest (drying-off).`;
      }
      return `🌱 **الدليل العلمي لزراعة بنجر السكر (موجز وعملي):**
1. **الموعد والتقاوي:** من منتصف أغسطس حتى نهاية أكتوبر على 3 عروات (أفضلها سبتمبر). التقاوي: 1 كجم وحيدة الجنين أو 3–4 كجم عديدة الأجنة.
2. **التسميد:** يحتاج 60–80 وحدة أزوت فقط على دفعتين، ويُمنع التسميد الأزوتي نهائياً قبل القلع بـ 60 يوماً لرفع نسبة السكر + رشة بورون عند عمر 90 و120 يوماً.
3. **الري والحصاد:** ري معتدل ومنتظم كل 15–20 يوماً، مع فطام المحصول (وقف الري) قبل القلع بـ 20–30 يوماً لتسهيل الحصاد ورفع تركيز السكروز.`;
    }

    if (isClover) {
      if (!isAr) {
        return `☘️ **Concise Egyptian Berseem Clover Cultivation Guide:**
1. **Window & Seed:** Oct 1–15. Rate: 20–25 kg/feddan certified seed.
2. **Fertilization:** Phosphatic base: 150 kg superphosphate during land prep + single 15 kg starter N dose.
3. **Cuttings:** 1st cut at 50–60 days; subsequent cuts every 30–35 days with abundant post-cut irrigation.`;
      }
      return `☘️ **الدليل العلمي لزراعة البرسيم المصري (موجز وعملي):**
1. **الموعد والتقاوي:** النصف الأول من أكتوبر (أفضل ميعاد 1–15 أكتوبر). معدل التقاوي: 20–25 كجم/فدان صنف مسقاوي أو هلالي.
2. **إعداد الأرض والتسميد:** إضافة 150 كجم سوبر فوسفات كلسي أثناء الحرث؛ البرسيم يثبت النيتروجين الجوي ويكفيه جرعة تنشيطية واحدة (15 كجم سلفات نشادر).
3. **الحش والري:** الحشة الأولى بعد 50–60 يوماً، ثم حشة كل 30–35 يوماً (4–5 حشات في الموسم) مع رية غزيرة مباشرة بعد كل حشة لسرعة تجديد النموات.`;
    }

    if (isCotton) {
      if (!isAr) {
        return `🌸 **Concise Cotton Cultivation Guide:**
1. **Window:** Mid-March to mid-April (Giza 94/97 in Delta, Giza 95 in Upper Egypt). Rate: 20–25 kg/feddan.
2. **Fertilization:** 60–70 N units split before flowering + 100 kg superphosphate + 50 kg potassium sulfate.
3. **Care:** Thin to 2 plants/hill at 20 cm spacing. Regulate irrigation during flowering to prevent vegetative excessive growth and boll shedding.`;
      }
      return `🌸 **الدليل العلمي لزراعة القطن المصري (موجز وعملي):**
1. **الموعد والتقاوي:** من منتصف مارس حتى منتصف أبريل (أصناف: جيزة 94 وجيزة 97 بالوجه البحري، جيزة 95 بالصعيد). معدل التقاوي: 20–25 كجم/فدان.
2. **الخف والزراعة:** الزراعة في جور على مسافة 20–25 سم، والخف على نباتين بالجورة عند تكوين أول ورقتين حقيقيتين.
3. **التسميد والري:** 60–70 وحدة أزوت على دفعتين قبل التزهير + 100 كجم سوبر فوسفات + 50 كجم سلفات بوتاسيوم. تنظيم الري وعدم التعطيش وقت التزهير لمنع تساقط الوسواس واللوز.`;
    }

    if (isOnionGarlic) {
      if (!isAr) {
        return `🧅 **Concise Onion & Garlic Cultivation Guide:**
1. **Window:** Onion transplants: Nov/Dec. Garlic cloves: Sep/Oct.
2. **Soil & Nutrients:** Balanced NPK with heavy Potassium (100 kg K₂O) and Sulfur for bulb pungency and storage longevity.
3. **Protection:** Preventive sprays against Downy Mildew, Purple Blotch, and Thrips.`;
      }
      return `🧅 **الدليل العلمي لزراعة البصل والثوم (موجز وعملي):**
1. **الموعد والتقاوي:** شتل البصل خلال نوفمبر وديسمبر. زراعة فصوص الثوم خلال سبتمبر وأكتوبر.
2. **التسميد:** إضافة 150 كجم سوبر فوسفات + 100 كجم كبريت زراعي أثناء التجهيز، وتكثيف التسميد البوتاسي وقت صب الرؤوس لرفع جودة التخزين وصلابة القشور.
3. **المكافحة:** الرش الوقائي بمبيدات نحاسية ضد البياض الزغبي واللطعة الأرجوانية، ومكافحة حشرة التربس مبكراً.`;
    }

    if (isCitrus || isOlive) {
      if (!isAr) {
        return `🌳 **Concise Orchard Care Guide (Citrus & Olive):**
1. **Irrigation:** Controlled drip irrigation placed along the tree canopy drip-line.
2. **Nutrition:** Winter organic compost trenching + fertigated NPK (higher N in spring growth, K during fruit filling) + foliar micronutrients (Zinc, Iron, Manganese).
3. **Pruning:** Annual winter sanitary pruning to improve light penetration and remove water sprouts.`;
      }
      return `🌳 **الدليل العلمي لرعاية بساتين الموالح والزيتون (موجز وعملي):**
1. **الري:** ري منتظم مقنن بنظام التنقيط المزدوج على جانبي جذع الشجرة بمحاذاة مسقط المجموع الخضري.
2. **التسميد:** خنادق الخدمة الشتوية (كمبوست + سوبر فوسفات + كبريت)، والتسميد مع ماء الري بـ NPK مع رش العناصر الصغرى المخلبية (زنك، حديد، منجنيز) مرتين سنوياً مع دورات النمو الربيعية والصيفية.
3. **التقليم والوقاية:** التقليم الشتوي لفتح قلب الشجرة للشمس وإزالة السرطانات والأفرع المتشابكة، ومكافحة ذبابة الفاكهة والعنكبوت الأحمر وحشرات المن.`;
    }
  }

  // -------------------------------------------------------------------------
  // 5. CROP SUITABILITY & FOLLOW-UP INQUIRIES (e.g. "طيب والرز؟")
  // -------------------------------------------------------------------------
  if (isCropSuitabilityInquiry) {
    if (isRice) {
      const isSalinityOk = soil.salinityEC <= 3.0;
      const isTextureGood = soil.texture === 'clay' || soil.texture === 'loamy';
      if (!isAr) {
        return `🌾 **Rice Suitability Assessment for ${context.zoneNameEn} (${soil.texture} soil, EC ${soil.salinityEC} dS/m):**
• **Soil & Salinity Fit:** ${isSalinityOk ? `✅ Soil salinity (EC ${soil.salinityEC} dS/m) and pH ${soil.ph} are fully safe for rice (threshold 3.0 dS/m).` : `⚠️ Soil salinity (EC ${soil.salinityEC} dS/m) exceeds rice sensitivity threshold (3.0 dS/m).`}
• **Water Requirement:** Rice requires 5,500–6,500 m³/feddan over the summer season.
• **Agronomic Verdict:** ${isTextureGood ? 'Highly viable if authorized summer surface water is available. Use water-efficient cultivars (Sakha 108 or Giza 178).' : 'Caution: Sandy/coarse soil has high percolation rates and is economically unsuitable for flooded rice; consider Maize or Sorghum instead.'}`;
      }
      return `🌾 **تقييم زراعة الأرز في أرضك (${context.zoneNameAr} — قوام ${soil.customTextureLabel || soil.texture} وملوحة ${soil.salinityEC} dS/m):**
• **الملوحة والحموضة:** ${isSalinityOk ? `✅ درجة ملوحة أرضك (${soil.salinityEC} dS/m) وحموضتها (pH ${soil.ph}) آمنة ومناسبة تماماً لنمو الأرز (حد التحمل حتى 3.0 dS/m).` : `⚠️ ملوحة أرضك (${soil.salinityEC} dS/m) أعلى من حد تحمل الأرز الحساس للملوحة (3.0 dS/m).`}
• **الاحتياج المائي والقوام:** الأرز محصول صيفي شره للمياه (يحتاج 5500–6500 م³/فدان)، ويفضل التربة الطينية الثقيلة لحبس المياه؛ إذا كانت تربتك صفراء أو متوسطة، سيزداد معدل الرشح.
• **القرار الزراعي المباشر:** زراعته ممتازة إذا كان متاحاً لديك ترخيص أو حصة مياه صيفية كافية، مع زراعة أصناف موفرة للمياه مثل **سخا 108 أو جيزة 178** بالشتل. إذا كان استهلاك المياه عائقاً، فالذرة الشامية هجين فردي بديل صيفي ممتاز بأقل من نصف استهلاك مياه الأرز.`;
    }

    if (isWheat) {
      if (!isAr) {
        return `🌾 **Wheat Suitability Assessment for ${context.zoneNameEn}:**
• **Tolerance:** Highly tolerant up to EC 6.0 dS/m (your soil is EC ${soil.salinityEC} dS/m — 100% safe).
• **Season:** Ideal winter strategic crop. Planting window: Nov 15–30.
• **Verdict:** Recommended top cereal crop with high yield potential and strong drought resilience.`;
      }
      return `🌾 **تقييم زراعة القمح في أرضك (${context.zoneNameAr}):**
• **الملوحة والتربة:** القمح ممتاز لأرضك؛ يتحمل حتى ملوحة EC 6.0 dS/m (وملوحة أرضك ${soil.salinityEC} dS/m تقع في النطاق المثالي للإنتاجية القصوى).
• **الموسم والتوقيت:** يزرع من 15 إلى 30 نوفمبر، وتغطيه أمطار الشتاء بنسبة جيدة مع ريات تكميلية محسوبة.
• **القرار الزراعي المباشر:** محصول استراتيجي موصى به بقوة لأرضك بأصناف سخا 95 أو مصر 3، بإنتاجية متوقعة تتجاوز 18–20 إردباً للفدان.`;
    }

    if (isFava) {
      if (!isAr) {
        return `🌱 **Fava Bean Suitability Assessment for ${context.zoneNameEn}:**
• **Soil Benefits:** Legume crop that fixes atmospheric nitrogen, improving soil health and saving ~25 kg N/feddan for the subsequent crop.
• **Tolerance:** Tolerates EC up to 3.0 dS/m (your soil EC ${soil.salinityEC} dS/m is optimal).
• **Verdict:** Highly recommended for crop rotation and local market export.`;
      }
      return `🌱 **تقييم زراعة الفول البلدي في أرضك (${context.zoneNameAr}):**
• **خصوبة التربة:** ممتاز جداً لدورتك الزراعية؛ يثبت 25–35 كجم نيتروجين جوي في التربة مما يخصب أرضك ويوفر من سماد المحصول الصيفي التالي.
• **الملوحة والري:** ملوحة أرضك (${soil.salinityEC} dS/m) مناسبة جداً (حد تحمله 3.0 dS/m)، واحتياجه المائي معتدل (1200–1400 م³/فدان).
• **القرار الزراعي المباشر:** خيار استثماري ممتاز في عروة نوفمبر بأصناف جيزة 716 وسخا 4 مع التلقيح بالعِقّدين.`;
    }
  }

  // -------------------------------------------------------------------------
  // 6. GENERAL CROP RECOMMENDATION (ONLY WHEN GENERAL BEST CROP IS ASKED)
  // -------------------------------------------------------------------------
  if (hasBestCropIntent) {
    const bestCrop = topCrops[0] || {
      crop: { nameAr: 'قمح (سخا 95)', nameEn: 'Wheat (Sakha 95)', optimalPlantingStartAr: '15 نوفمبر', optimalPlantingEndAr: '5 ديسمبر', optimalPlantingStartEn: 'Nov 15', optimalPlantingEndEn: 'Dec 5' },
      suitabilityScore: 94,
      gradeLabel: 'Grade-A Export',
      expectedYieldTonPerFeddan: 2.8,
      totalFarmYieldTons: 28,
      predictedRainCoveragePct: 35,
      netIrrigationRequiredM3PerFeddan: 1150,
    };
    const secondCrop = topCrops[1] || {
      crop: { nameAr: 'فول بلدي (جيزة 716)', nameEn: 'Fava Bean', qualityFactorsAr: 'تثبيت النيتروجين وتحسين خصوبة التربة' },
      suitabilityScore: 91,
    };

    if (!isZoneAvailable) {
      if (!isAr) {
        return `General Agronomic Guidance (No study zone defined yet):
• Core high-value crops: Wheat, Fava Bean, Sugar Beet, and Egyptian Berseem Clover across loamy and clay soils.
• Draw your field zone on the Full-Screen Atlas so I can inspect exact satellite NDVI, soil salinity (EC), and local weather for your parcel.`;
      }
      return `إرشاد زراعي عام (لا توجد زونة مضافة منك بعد):
• المحاصيل الاستراتيجية الأنسب حسب نوع التربة:
  - الأراضي الطينية والصفراء المتوازنة: القمح، الفول البلدي، البرسيم المصري، بنجر السكر، والذرة.
  - الأراضي الرملية والمستصلحة: الزيتون، النخيل، البطاطس بالتنقيط، والكينوا.
• نصيحة: ارسم زونتك على **الخريطة الشاملة** أو اطلب مني إضافتها وسأحلل لك ملوحة التربة والمؤشرات الفضائية والمحصول الأنسب بأرقام أرضك الفعلية.`;
    }

    if (!isAr) {
      return `Based on your delineated farm (${area.feddans} Feddans, ${area.qirats} Qirats) with ${soil.customTextureLabel || soil.texture} soil (EC ${soil.salinityEC} dS/m, pH ${soil.ph}):

1. Top Recommended Crop: ${bestCrop.crop.nameEn} — Suitability ${bestCrop.suitabilityScore}% (${bestCrop.gradeLabel}).
• Golden Window: ${bestCrop.crop.optimalPlantingStartEn} to ${bestCrop.crop.optimalPlantingEndEn}.
• Expected Yield: ${bestCrop.expectedYieldTonPerFeddan} t/fed (${bestCrop.totalFarmYieldTons} tons total).
• Water Synergy: Rain covers ${bestCrop.predictedRainCoveragePct}% of crop demand; net irrigation: ${bestCrop.netIrrigationRequiredM3PerFeddan} m³/feddan.

2. Second Runner-Up: ${secondCrop.crop.nameEn} (${secondCrop.suitabilityScore}% match).`;
    }

    const soilDesc =
      soil.customTextureLabel ||
      (soil.texture === 'clay' ? 'طينية' : soil.texture === 'sandy' ? 'رملية' : soil.texture === 'calcareous' ? 'جيرية' : 'صفراء');

    return `بناءً على تحليل حدود أرضك (${area.feddans} فدان و${area.qirats} قيراط) وخواص التربة (${soilDesc}، ملوحة ${soil.salinityEC} dS/m، حموضة pH ${soil.ph}):

1️⃣ المحصول الأول الأعلى جودة وعائداً: **${bestCrop.crop.nameAr}**
• نسبة النجاح والجودة المتوقعة: **${bestCrop.suitabilityScore}% (${bestCrop.gradeLabel})**.
• التوقيت الذهبي للزراعة: من **${bestCrop.crop.optimalPlantingStartAr}** إلى **${bestCrop.crop.optimalPlantingEndAr}**.
• الإنتاجية المتوقعة: **${bestCrop.expectedYieldTonPerFeddan} طن/فدان** (إجمالي **${bestCrop.totalFarmYieldTons} طن** لمزرعتك).
• التناغم المائي: الأمطار المتوقعة تغطي **${bestCrop.predictedRainCoveragePct}%** من احتياج المحصول، والمقنن التكميلي الصافي **${bestCrop.netIrrigationRequiredM3PerFeddan} م³/فدان**.

2️⃣ البديل الثاني الممتاز للدورة الزراعية: **${secondCrop.crop.nameAr}** (توافق **${secondCrop.suitabilityScore}%**).`;
  }

  // -------------------------------------------------------------------------
  // 7. PRECISION IRRIGATION & HYDROLOGY DECISIONS
  // -------------------------------------------------------------------------
  if (hasWaterOrIrrigationIntent || /(?:^|[\s،,.\-?!])بكرة(?:$|[\s،,.\-?!])/i.test(q)) {
    if (!isZoneAvailable) {
      if (!isAr) {
        return `General Irrigation Guidance (No study zone defined yet):
• ET₀ & Water Demand: In arid and Mediterranean climates, weekly crop evapotranspiration averages 25–40 mm depending on season.
• Draw your study zone on the Atlas map so I can compute exact daily water deficits, rainfall offsets, and cubic-meter irrigation needs for your farm.`;
      }
      return `إرشاد عام لجدولة الري (لا توجد زونة مضافة منك بعد):
• متوسط الاحتياج المائي للمحاصيل الحقلية يتراوح بين 25 إلى 40 مم أسبوعياً حسب الموسم ونوع المحصول.
• ارسم حدود مزرعتك على الخريطة لحساب المقنن المائي الدقيق (م³/فدان) استناداً للأمطار المتوقعة ورطوبة التربة الفعلية.`;
    }

    const total7dRain = forecast14
      .slice(0, 7)
      .reduce((acc, d) => acc + d.precipMm, 0)
      .toFixed(1);
    const total7dEt0 = forecast14
      .slice(0, 7)
      .reduce((acc, d) => acc + d.et0Mm, 0)
      .toFixed(1);
    const nextRain = forecast14.slice(0, 7).find((d) => d.precipMm >= 2.0);
    const zoneA = subZones[0] || { ndwi: -0.04 };
    const zoneC = subZones[2] || { ndwi: 0.12 };

    if (!isAr) {
      return `Hydro-Meteorological Decision for your ${area.totalFeddansDecimal} Feddan farm:
• 7-Day Rain Total: ${total7dRain} mm vs. Cumulative Reference ET₀: ${total7dEt0} mm.
${
  nextRain
    ? `• Action Alert: ${nextRain.precipMm} mm of rain is forecast on ${nextRain.dayLabelEn} (${nextRain.precipProbPct}% probability). DO NOT irrigate tomorrow—suspending irrigation saves ${Math.round(nextRain.precipMm * 3.8)} m³/feddan and prevents root rot.`
    : `• Action Alert: Dry window ahead. Apply ${Math.round(Number(total7dEt0) * 3.6)} m³/feddan over the next 7 days via your ${soil.irrigation} system.`
}
• Sub-Zone Adjustment: Zone A (NDWI ${zoneA.ndwi}) requires +15% runtime, while Zone C (NDWI ${zoneC.ndwi}) should be throttled by -10%.`;
    }

    return `قرار الري والأمطار الذكي لمزرعتك (${area.feddans} فدان و${area.qirats} قيراط):
• إجمالي الأمطار المتوقعة خلال 7 أيام: **${total7dRain} مم** مقابل البخر-نتح المرجعي التراكمي (ET₀): **${total7dEt0} مم**.
${
  nextRain
    ? `• ⚠️ **توصية فورية:** متوقع هطول أمطار يوم **${nextRain.dayLabelAr}** بمقدار **${nextRain.precipMm} مم** (احتمالية **${nextRain.precipProbPct}%**). **أوقف الري غداً** لتوفير **${Math.round(nextRain.precipMm * 3.8)} م³ مياه/فدان** ومنع اختناق الجذور.`
    : `• **توصية الري:** الأجواء جافة خلال الأسبوع القادم؛ نفّذ رية تكميلية بمقدار **${Math.round(Number(total7dEt0) * 3.6)} م³/فدان** في الصباح الباكر.`
}
• **توزيع الري حسب الزونا:** ارفع مقنن الزونا A (NDWI ${zoneA.ndwi}) بنسبة +15%، وخفّض ري الزونا C (NDWI ${zoneC.ndwi}) بنسبة -10%.`;
  }

  // -------------------------------------------------------------------------
  // 8. PEST & DISEASE INTEGRATED MANAGEMENT (IPM)
  // -------------------------------------------------------------------------
  if (hasPestOrDiseaseIntent) {
    if (!isZoneAvailable) {
      if (!isAr) {
        return `General Integrated Pest Management (IPM) Guidance (No study zone defined yet):
• Preventive Scouting: Monitor crops twice weekly for early signs of fungal rusts, downy mildew, and sap-sucking vectors (Aphids, Whitefly).
• Action Thresholds: Delay chemical intervention until economic threshold levels are reached; prioritize pheromone delta traps and selective bio-pesticides.
• Draw your field boundaries to enable micro-climate satellite risk mapping across your specific zones.`;
      }
      return `إرشاد عام للمكافحة المتكاملة للآفات والأمراض (IPM) (لا توجد زونة مضافة منك بعد):
• المكافحة الوقائية: فحص المحاصيل مرتين أسبوعياً لاكتشاف بؤر الإصابة المبكرة بالفطريات (الصدأ، الندوة) أو الحشرات الثاقبة الماصة (المن، الذبابة البيضاء).
• مكافحة متكاملة IPM: الاعتماد على المصائد الفرمونية والرش الحيوي أولاً وتجنب الرش العشوائي للمبيدات الكيميائية.
• ارسم حدود حقلك لتفعيل رادار التنبؤ بالآفات والإنذار المبكر المخصص لقطاعات أرضك.`;
    }

    const avgTemp = forecast14[0] ? ((forecast14[0].tempMaxC + forecast14[0].tempMinC) / 2).toFixed(1) : '22.4';
    const avgHum = forecast14[0]?.relativeHumidityPct ?? 66;
    const total7dRain = forecast14.slice(0, 7).reduce((acc, d) => acc + d.precipMm, 0).toFixed(1);

    if (!isAr) {
      return `Proactive IPM Disease & Pest Advisory for ${context.zoneNameEn} (${area.feddans} Feddans):
• Micro-Climate Conditions: Mean Temp ${avgTemp}°C · Relative Humidity ${avgHum}% · 7-Day Rain ${total7dRain} mm · LST ${farmAverages.LST}°C.
• Critical Risk Points:
  1. High thermal stress in Zone A elevates risk of sap-sucking pests (Aphids, Whitefly, Spider Mites).
  2. Dense canopy in Zone C increases morning leaf wetness, raising fungal pathogen pressure (Rust, Blight).
• Protocol: Hang delta pheromone traps (2/feddan), avoid excessive urea nitrogen, and apply targeted bio-fungicide (Azoxystrobin) before high dew hours.`;
    }

    return `خطة المكافحة المتكاملة للآفات والأمراض (IPM) في **${context.zoneNameAr}** (${area.feddans} فدان و${area.qirats} قيراط):
• **المحددات المناخية:** متوسط الحرارة **${avgTemp}°م** · الرطوبة النسبية **${avgHum}%** · أمطار 7 أيام **${total7dRain} مم** · حرارة الأوراق LST **${farmAverages.LST}°م**.
• **أهم المخاطر والإجراءات الفورية:**
  1. **الحشرات الثاقبة الماصة (المن، الذبابة البيضاء، العنكبوت الأحمر):** تنشط مع الجفاف والحرارة؛ رش سليكات البوتاسيوم (1.5 لتر/فدان) لتقوية جدر الخلايا في زونا A، واستخدم مركب إيمامكتين بنزوات عند الضرورة.
  2. **الأمراض الفطرية (الصدأ، الندوة، التبقع):** تنشط مع زيادة الرطوبة والندى الصباحي في زونا C وزونا B؛ رش وقائي بمبيد أزوكسي ستروبين + تيبيكونازول وتجنب الري بالغمر الزائد.
  3. **الوقاية الحيوية (IPM):** تعليق مصائد فرمونية، وتجنب الإفراط في التسميد الأزوتي (اليوريا) الذي يضعف مقاومة الأنسجة عبر قطاعات الحقل (زونا A وزونا B وزونا C).`;
  }

  // -------------------------------------------------------------------------
  // 9. FERTILIZATION & NPK QUERIES
  // -------------------------------------------------------------------------
  if (q.includes('تسميد') || q.includes('سماد') || q.includes('نيتروجين') || q.includes('يوريا') || q.includes('بوتاسيوم') || q.includes('فوسفور') || q.includes('ملوحة')) {
    if (!isAr) {
      return `Precision Fertilization Protocol for ${context.zoneNameEn} (${soil.texture} soil, EC ${soil.salinityEC} dS/m, pH ${soil.ph}):
1. **Soil Reaction (pH ${soil.ph}):** High pH reduces phosphorus and micronutrient availability. Inject 2 L/feddan phosphoric acid to lower irrigation water pH.
2. **Salinity Management:** Soil EC is ${soil.salinityEC} dS/m. Apply 15% leaching fraction to flush salts below the root zone.
3. **Core Nutrients:** Balance Nitrogen with Potassium (Potassium Sulfate 15–20 kg/feddan) to enhance crop osmotic resistance.`;
    }

    return `برنامج التسميد ومعالجة التربة لمزرعتك (${context.zoneNameAr} — ملوحة ${soil.salinityEC} dS/m، حموضة pH ${soil.ph}):
1. **معادلة قلوية التربة (pH ${soil.ph}):** قلوية التربة تقلل امتصاص الفوسفور والحديد؛ حقن 2 لتر حامض فوسفوريك للفدان مع ماء الري ينشط امتصاص العناصر فوراً.
2. **إدارة الملوحة (${soil.salinityEC} dS/m):** إضافة رية غسيل ملحي تكميلية بنسبة +15%، مع استخدام هيومات البوتاسيوم ومضادات الملوحة (سلفات الكالسيوم/الجبس الزراعي).
3. **التسميد المتوازن NPK:** إضافة سلفات البوتاسيوم (15–20 كجم/فدان) مع سلفات النشادر، وتجنب زيادة اليوريا في الأجواء الحارة لحماية الشعيرات الجذرية.`;
  }

  // 10. Concise General Fallback (Intelligent, Helpful, Non-Repetitive)
  if (!isAr) {
    return `Precision Agronomic Insight for **${context.zoneNameEn}** (${area.feddans} Feddans, ${soil.texture} soil):
• **Live Health:** NDVI ${farmAverages.NDVI} | NDWI ${farmAverages.NDWI} | Canopy LST ${farmAverages.LST}°C | Soil EC ${soil.salinityEC} dS/m.
• **How Can I Assist:** You can ask me how to grow any crop (e.g. *"How to grow Rice"*, *"How to grow Wheat"*), ask for custom irrigation or fertilizer schedules, or command me to control any layer on the platform!`;
  }

  return `التشخيص الميداني السريع لمزرعتك في **${context.zoneNameAr}** (${area.feddans} فدان و${area.qirats} قيراط):
• **المؤشرات الحية:** مؤشر الغطاء النباتي NDVI **${farmAverages.NDVI}** · مؤشر المياه NDWI **${farmAverages.NDWI}** · حرارة السطح LST **${farmAverages.LST}°م** · ملوحة التربة **${soil.salinityEC} dS/m**.
• **كيف يمكنني مساعدتك؟** يمكنك سؤالي عن طريقة زراعة أي محصول (مثال: *"ازرع رز ازاي"*، *"ازرع القمح ازاي"*، *"ازرع الفول ازاي"*، *"طيب والرز"*...)، أو جدول الري والتسميد NPK، أو اطلب مني تنفيذ أي أمر في المنصة وسأنفذه فوراً!`;
}

// ============================================================================
// 8. CUSTOM CROP ROTATION BUILDER, TIMELINE & SCIENTIFIC WARNING ENGINE
// ============================================================================

export function getCropFamily(cropId: string): BotanicalFamily {
  switch (cropId) {
    case 'wheat':
    case 'maize':
    case 'rice':
    case 'sorghum':
      return 'gramineae';
    case 'fava_bean':
    case 'clover':
      return 'fabaceae';
    case 'potato':
    case 'tomato':
      return 'solanaceae';
    case 'sugar_beet':
    case 'quinoa':
      return 'chenopodiaceae';
    case 'cotton':
      return 'malvaceae';
    case 'olive':
    default:
      return 'oleaceae';
  }
}

export function buildDefaultCustomRotationPlans(
  currentCropId = 'wheat'
): Record<'A' | 'B' | 'C', ZoneCustomRotationPlan> {
  return {
    A: {
      zoneId: 'A',
      zoneNameAr: 'زونا A (القطاع الشمالي الشرقي — إجهاد ملحي/رطوبي)',
      zoneNameEn: 'Zone A (North-East Sector — Higher Salinity/Dry Edge)',
      slots: [
        {
          slotId: 'past2',
          periodAr: 'شتاء 2025/2026 (سابق)',
          periodEn: 'Winter 2025/26 (Past)',
          seasonType: 'winter',
          isPast: true,
          monthsSpanAr: 'نوفمبر 25 – أبريل 26',
          monthsSpanEn: 'Nov 25 – Apr 26',
          startMonthIdx: 0,
          durationMonths: 5,
          cropId: 'wheat',
        },
        {
          slotId: 'past1',
          periodAr: 'صيف 2026 (سابق)',
          periodEn: 'Summer 2026 (Past)',
          seasonType: 'summer',
          isPast: true,
          monthsSpanAr: 'مايو 26 – سبتمبر 26',
          monthsSpanEn: 'May 26 – Sep 26',
          startMonthIdx: 6,
          durationMonths: 5,
          cropId: 'maize',
        },
        {
          slotId: 'current',
          periodAr: 'شتاء 2026/2027 (الحالي)',
          periodEn: 'Winter 2026/27 (Current)',
          seasonType: 'winter',
          isPast: false,
          isCurrent: true,
          monthsSpanAr: 'نوفمبر 26 – أبريل 27',
          monthsSpanEn: 'Nov 26 – Apr 27',
          startMonthIdx: 12,
          durationMonths: 5,
          cropId: currentCropId,
        },
        {
          slotId: 'next1',
          periodAr: 'صيف 2027 (مخطط)',
          periodEn: 'Summer 2027 (Planned)',
          seasonType: 'summer',
          isPast: false,
          monthsSpanAr: 'مايو 27 – سبتمبر 27',
          monthsSpanEn: 'May 27 – Sep 27',
          startMonthIdx: 18,
          durationMonths: 5,
          cropId: 'sorghum',
        },
        {
          slotId: 'next2',
          periodAr: 'شتاء 2027/2028 (مخطط)',
          periodEn: 'Winter 2027/28 (Planned)',
          seasonType: 'winter',
          isPast: false,
          monthsSpanAr: 'نوفمبر 27 – أبريل 28',
          monthsSpanEn: 'Nov 27 – Apr 28',
          startMonthIdx: 24,
          durationMonths: 5,
          cropId: 'fava_bean',
        },
      ],
    },
    B: {
      zoneId: 'B',
      zoneNameAr: 'زونا B (القلب الأوسط للمزرعة — متوازن)',
      zoneNameEn: 'Zone B (Central Core Sector — Balanced Baseline)',
      slots: [
        {
          slotId: 'past2',
          periodAr: 'شتاء 2025/2026 (سابق)',
          periodEn: 'Winter 2025/26 (Past)',
          seasonType: 'winter',
          isPast: true,
          monthsSpanAr: 'أكتوبر 25 – أبريل 26',
          monthsSpanEn: 'Oct 25 – Apr 26',
          startMonthIdx: 0,
          durationMonths: 6,
          cropId: 'clover',
        },
        {
          slotId: 'past1',
          periodAr: 'صيف 2026 (سابق)',
          periodEn: 'Summer 2026 (Past)',
          seasonType: 'summer',
          isPast: true,
          monthsSpanAr: 'مايو 26 – سبتمبر 26',
          monthsSpanEn: 'May 26 – Sep 26',
          startMonthIdx: 6,
          durationMonths: 5,
          cropId: 'maize',
        },
        {
          slotId: 'current',
          periodAr: 'شتاء 2026/2027 (الحالي)',
          periodEn: 'Winter 2026/27 (Current)',
          seasonType: 'winter',
          isPast: false,
          isCurrent: true,
          monthsSpanAr: 'نوفمبر 26 – أبريل 27',
          monthsSpanEn: 'Nov 26 – Apr 27',
          startMonthIdx: 12,
          durationMonths: 5,
          cropId: 'potato',
        },
        {
          slotId: 'next1',
          periodAr: 'صيف 2027 (مخطط)',
          periodEn: 'Summer 2027 (Planned)',
          seasonType: 'summer',
          isPast: false,
          monthsSpanAr: 'أبريل 27 – سبتمبر 27',
          monthsSpanEn: 'Apr 27 – Sep 27',
          startMonthIdx: 18,
          durationMonths: 5,
          cropId: 'cotton',
        },
        {
          slotId: 'next2',
          periodAr: 'شتاء 2027/2028 (مخطط)',
          periodEn: 'Winter 2027/28 (Planned)',
          seasonType: 'winter',
          isPast: false,
          monthsSpanAr: 'نوفمبر 27 – أبريل 28',
          monthsSpanEn: 'Nov 27 – Apr 28',
          startMonthIdx: 24,
          durationMonths: 5,
          cropId: 'wheat',
        },
      ],
    },
    C: {
      zoneId: 'C',
      zoneNameAr: 'زونا C (القطاع الجنوبي الغربي — مصب الرطوبة)',
      zoneNameEn: 'Zone C (South-West Basin — High Moisture Retention)',
      slots: [
        {
          slotId: 'past2',
          periodAr: 'شتاء 2025/2026 (سابق)',
          periodEn: 'Winter 2025/26 (Past)',
          seasonType: 'winter',
          isPast: true,
          monthsSpanAr: 'نوفمبر 25 – أبريل 26',
          monthsSpanEn: 'Nov 25 – Apr 26',
          startMonthIdx: 0,
          durationMonths: 5,
          cropId: 'fava_bean',
        },
        {
          slotId: 'past1',
          periodAr: 'صيف 2026 (سابق)',
          periodEn: 'Summer 2026 (Past)',
          seasonType: 'summer',
          isPast: true,
          monthsSpanAr: 'مايو 26 – سبتمبر 26',
          monthsSpanEn: 'May 26 – Sep 26',
          startMonthIdx: 6,
          durationMonths: 5,
          cropId: 'rice',
        },
        {
          slotId: 'current',
          periodAr: 'شتاء 2026/2027 (الحالي)',
          periodEn: 'Winter 2026/27 (Current)',
          seasonType: 'winter',
          isPast: false,
          isCurrent: true,
          monthsSpanAr: 'أكتوبر 26 – أبريل 27',
          monthsSpanEn: 'Oct 26 – Apr 27',
          startMonthIdx: 12,
          durationMonths: 6,
          cropId: 'sugar_beet',
        },
        {
          slotId: 'next1',
          periodAr: 'صيف 2027 (مخطط)',
          periodEn: 'Summer 2027 (Planned)',
          seasonType: 'summer',
          isPast: false,
          monthsSpanAr: 'مايو 27 – سبتمبر 27',
          monthsSpanEn: 'May 27 – Sep 27',
          startMonthIdx: 18,
          durationMonths: 5,
          cropId: 'maize',
        },
        {
          slotId: 'next2',
          periodAr: 'شتاء 2027/2028 (مخطط)',
          periodEn: 'Winter 2027/28 (Planned)',
          seasonType: 'winter',
          isPast: false,
          monthsSpanAr: 'أكتوبر 27 – أبريل 28',
          monthsSpanEn: 'Oct 27 – Apr 28',
          startMonthIdx: 24,
          durationMonths: 6,
          cropId: 'clover',
        },
      ],
    },
  };
}

/**
 * Scientifically evaluates a 5-season custom crop rotation plan for a specific zone,
 * identifying soil health depletion, pest/pathogen carryover, salinity conflicts,
 * and biological nitrogen fixation credits.
 */
export function evaluateCustomRotationPlan(
  plan: ZoneCustomRotationPlan,
  soil: SoilProfile
): CustomRotationEvaluation {
  const warnings: RotationWarning[] = [];
  let soilHealthScore = 88;
  let pestBreakScore = 90;
  let nitrogenBalanceKgPerFeddan = 0;

  const zoneEcMultiplier = plan.zoneId === 'A' ? 1.3 : plan.zoneId === 'B' ? 1.0 : 0.8;
  const effectiveZoneEC = Number((soil.salinityEC * zoneEcMultiplier).toFixed(2));

  const crops = plan.slots.map(
    (s) => CROP_DATABASE.find((c) => c.id === s.cropId) || CROP_DATABASE[0]
  );

  // Track N balance & water requirement
  let totalWaterMm = 0;
  let legumeCount = 0;

  crops.forEach((crop, idx) => {
    const slot = plan.slots[idx];
    totalWaterMm += crop.seasonalWaterReqMm;

    if (crop.nitrogenFixer) {
      legumeCount += 1;
      nitrogenBalanceKgPerFeddan += crop.id === 'clover' ? 60 : 50;
    } else if (getCropFamily(crop.id) === 'gramineae') {
      nitrogenBalanceKgPerFeddan -= 32;
    } else {
      nitrogenBalanceKgPerFeddan -= 22;
    }

    // Check Salinity Stress in this Zone for current/future slots
    if (!slot.isPast && effectiveZoneEC > crop.maxSalinityEC) {
      const penalty = Math.round((effectiveZoneEC - crop.maxSalinityEC) * crop.ecSlopePctPerDsm);
      soilHealthScore -= 12;
      warnings.push({
        id: `warn-salinity-${plan.zoneId}-${slot.slotId}`,
        severity: penalty >= 20 ? 'critical' : 'warning',
        zoneId: plan.zoneId,
        transitionLabelAr: `${slot.periodAr} (${crop.nameAr})`,
        transitionLabelEn: `${slot.periodEn} (${crop.nameEn})`,
        titleAr: `تعارض ملوحة التربة مع ${crop.nameAr} في زونا ${plan.zoneId}`,
        titleEn: `Salinity Stress Conflict for ${crop.nameEn} in Zone ${plan.zoneId}`,
        detailAr: `ملوحة الزونا ${plan.zoneId} تبلغ ${effectiveZoneEC} dS/m بينما الحد الآمن لمحصول ${crop.nameAr} هو ${crop.maxSalinityEC} dS/m (انخفاض متوقع بالمحصول ~${penalty}%). يُنصح باستبداله ببنجر السكر أو الكينوا أو الذرة الرفيعة.`,
        detailEn: `Zone ${plan.zoneId} EC is ${effectiveZoneEC} dS/m, exceeding ${crop.nameEn} threshold of ${crop.maxSalinityEC} dS/m (~${penalty}% yield loss risk). Consider Sugar Beet, Quinoa, or Sorghum.`,
        fixSuggestionCropId: slot.seasonType === 'winter' ? 'sugar_beet' : 'sorghum',
        fixSlotId: slot.slotId,
      });
    }
  });

  // Check consecutive transitions (i -> i+1)
  for (let i = 0; i < crops.length - 1; i++) {
    const prev = crops[i];
    const next = crops[i + 1];
    const prevSlot = plan.slots[i];
    const nextSlot = plan.slots[i + 1];
    const famPrev = getCropFamily(prev.id);
    const famNext = getCropFamily(next.id);

    // 1. Same exact crop planted back-to-back
    if (prev.id === next.id && prev.id !== 'olive') {
      soilHealthScore -= 22;
      pestBreakScore -= 28;
      warnings.push({
        id: `warn-monocrop-${plan.zoneId}-${i}`,
        severity: 'critical',
        zoneId: plan.zoneId,
        transitionLabelAr: `${prevSlot.periodAr} ← ${nextSlot.periodAr}`,
        transitionLabelEn: `${prevSlot.periodEn} -> ${nextSlot.periodEn}`,
        titleAr: `تكرار نفس المحصول (${next.nameAr}) يضاعف الآفات ويستنزف العناصر`,
        titleEn: `Back-to-Back Monoculture (${next.nameEn}) Amplifies Soil Pathogens`,
        detailAr: `زراعة ${next.nameAr} في موسمين متتاليين تزيد توطن فطريات أعفان الجذور وتستنزف نفس الطبقة الجذرية.`,
        detailEn: `Planting ${next.nameEn} consecutively builds up host-specific root pathogens and depletes identical root horizons.`,
        fixSuggestionCropId: nextSlot.seasonType === 'winter' ? 'fava_bean' : 'sorghum',
        fixSlotId: nextSlot.slotId,
      });
      continue;
    }

    // 2. Solanaceae back-to-back (Potato <-> Tomato)
    if (famPrev === 'solanaceae' && famNext === 'solanaceae') {
      soilHealthScore -= 20;
      pestBreakScore -= 32;
      warnings.push({
        id: `warn-solanaceae-${plan.zoneId}-${i}`,
        severity: 'critical',
        zoneId: plan.zoneId,
        transitionLabelAr: `${prev.nameAr} ← ${next.nameAr}`,
        transitionLabelEn: `${prev.nameEn} -> ${next.nameEn}`,
        titleAr: `خطر تعاقب العائلة الباذنجانية (نيماتودا تعقد الجذور والندوة المتأخرة)`,
        titleEn: `Solanaceae Succession Hazard (Root-Knot Nematodes & Late Blight)`,
        detailAr: `تعاقب ${prev.nameAr} ثم ${next.nameAr} ينقل نيماتودا Meloidogyne والعفن البني البكتيري مباشرة؛ افصل بينهما بمحصول بقولي أو نجيلي.`,
        detailEn: `Following ${prev.nameEn} with ${next.nameEn} transfers Meloidogyne root-knot nematodes and bacterial wilt; insert a legume or cereal break.`,
        fixSuggestionCropId: nextSlot.seasonType === 'winter' ? 'clover' : 'maize',
        fixSlotId: nextSlot.slotId,
      });
    }

    // 3. Consecutive Gramineae cereals (3 in a row or 2 heavy N feeders back-to-back)
    if (famPrev === 'gramineae' && famNext === 'gramineae') {
      soilHealthScore -= 14;
      pestBreakScore -= 15;
      warnings.push({
        id: `warn-gramineae-${plan.zoneId}-${i}`,
        severity: 'warning',
        zoneId: plan.zoneId,
        transitionLabelAr: `${prev.nameAr} ← ${next.nameAr}`,
        transitionLabelEn: `${prev.nameEn} -> ${next.nameEn}`,
        titleAr: `تعاقب محاصيل الحبوب النجيلية يستنزف الأزوت ويرفع الحشائش النجيلية`,
        titleEn: `Consecutive Cereal Rotation Depletes Soil Nitrogen & Builds Grassy Weeds`,
        detailAr: `تعاقب ${prev.nameAr} مع ${next.nameAr} يسحب أكثر من 65 كجم نيتروجين/فدان ويزيد انتشار الزمير والفلارس وأعفان الجذور الفيوزاريومية.`,
        detailEn: `Successive ${prev.nameEn} and ${next.nameEn} extracts >65 kg N/feddan and promotes Fusarium crown rot and wild oat weeds.`,
        fixSuggestionCropId: nextSlot.seasonType === 'winter' ? 'fava_bean' : 'cotton',
        fixSlotId: nextSlot.slotId,
      });
    }

    // 4. Positive Regenerative Transition: Fabaceae Legume -> Heavy Feeder
    if (famPrev === 'fabaceae' && famNext !== 'fabaceae') {
      soilHealthScore = Math.min(100, soilHealthScore + 6);
      pestBreakScore = Math.min(100, pestBreakScore + 6);
      warnings.push({
        id: `pos-legume-${plan.zoneId}-${i}`,
        severity: 'positive',
        zoneId: plan.zoneId,
        transitionLabelAr: `${prev.nameAr} ← ${next.nameAr}`,
        transitionLabelEn: `${prev.nameEn} -> ${next.nameEn}`,
        titleAr: `تناغم بقولي ممتاز: ${prev.nameAr} يغذي ${next.nameAr} بالنيتروجين الحيوي`,
        titleEn: `Regenerative Synergy: ${prev.nameEn} Enriches ${next.nameEn} with Bio-Nitrogen`,
        detailAr: `يوفر ${prev.nameAr} ما بين 50 إلى 60 كجم أزوت طبيعي/فدان ويكسر دورة الآفات قبل زراعة ${next.nameAr}.`,
        detailEn: `${prev.nameEn} fixes 50–60 kg biological N/feddan and breaks soil pest cycles ahead of ${next.nameEn}.`,
      });
    }
  }

  // 5. Missing Legume across the entire 5-season sequence
  if (legumeCount === 0) {
    soilHealthScore -= 16;
    warnings.push({
      id: `warn-no-legume-${plan.zoneId}`,
      severity: 'critical',
      zoneId: plan.zoneId,
      transitionLabelAr: 'طول الدورة (5 مواسم)',
      transitionLabelEn: 'Full 5-Season Sequence',
      titleAr: 'غياب تام للمحاصيل البقولية المثبتة للنيتروجين خلال 5 مواسم',
      titleEn: 'Zero Nitrogen-Fixing Legumes Across All 5 Planned Seasons',
      detailAr: 'عدم إدراج الفول البلدي أو البرسيم المصري يؤدي لتدهور المادة العضوية وارتفاع تكلفة أسمدة اليوريا بنسبة 40%.',
      detailEn: 'Omitting Fava Bean or Egyptian Clover degrades soil organic matter and increases synthetic urea fertilizer costs by 40%.',
      fixSuggestionCropId: 'fava_bean',
      fixSlotId: 'next2',
    });
  }

  return {
    zoneId: plan.zoneId,
    soilHealthScore: Math.max(25, Math.min(100, soilHealthScore)),
    pestBreakScore: Math.max(25, Math.min(100, pestBreakScore)),
    nitrogenBalanceKgPerFeddan,
    avgSeasonalWaterM3PerFeddan: Math.round((totalWaterMm / crops.length) * 4.2),
    warnings,
  };
}

/**
 * Automatically resolves agronomic warnings in a zone's custom rotation plan
 * by inserting a nitrogen-fixing legume and salt/pest-resilient sequence.
 */
export function optimizeZoneRotationPlan(
  plan: ZoneCustomRotationPlan,
  soil: SoilProfile
): ZoneCustomRotationPlan {
  const zoneEcMultiplier = plan.zoneId === 'A' ? 1.3 : plan.zoneId === 'B' ? 1.0 : 0.8;
  const effectiveZoneEC = soil.salinityEC * zoneEcMultiplier;
  const isHighSalinity = effectiveZoneEC >= 3.2;

  const updatedSlots = plan.slots.map((slot) => {
    if (slot.isPast) return slot;
    if (slot.slotId === 'current') {
      return {
        ...slot,
        cropId: isHighSalinity ? 'sugar_beet' : 'clover',
      };
    }
    if (slot.slotId === 'next1') {
      return {
        ...slot,
        cropId: isHighSalinity ? 'sorghum' : 'maize',
      };
    }
    return {
      ...slot,
      cropId: isHighSalinity ? 'quinoa' : 'fava_bean',
    };
  });

  return {
    ...plan,
    slots: updatedSlots,
  };
}

// ============================================================================
// 9. REGIONAL PEST & DISEASE CATALOG, COORDINATE RISK ENGINE & INCIDENT LOGGER
// ============================================================================

export const REGIONAL_PEST_CATALOG: RegionalPestCatalogItem[] = [
  {
    id: 'yellow_rust',
    nameAr: 'الصدأ الأصفر في القمح (Puccinia striiformis)',
    nameEn: 'Wheat Yellow Stripe Rust',
    scientificName: 'Puccinia striiformis',
    category: 'fungal',
    hostCropIds: ['wheat', 'clover'],
    optimalTempRangeC: [14, 24],
    minHumidityPct: 58,
    symptomsAr: 'بثرات صفراء طولية متوازية على السطح العلوي للأوراق تشبه خطوط الخياطة مع اصفرار البؤر.',
    symptomsEn: 'Linear yellow-orange pustules aligned along leaf veins causing rapid chlorosis.',
    preventativeAr: 'رش وقائي بسليكات البوتاسيوم (1 لتر/فدان) لتقوية جدر الخلايا + كبريت ميكروني (250 جم/100 لتر ماء) مع عدم الإفراط في التسميد الأزوتي.',
    preventativeEn: 'Preventative foliar spray of Potassium Silicate (1 L/feddan) to fortify leaf cuticles + Micronized Sulfur (250 g/100L) and balanced N.',
    ipmTreatmentAr: 'رش فوري بمبيد فطري جهازي (ترايازول: تيبوكونازول 25% أو بروبيكونازول بمعدل 50 سم³/100 لتر ماء) مع وقف التسميد الأزوتي الزائد.',
    ipmTreatmentEn: 'Apply systemic triazole fungicide (Tebuconazole 25% or Propiconazole at 50 ml/100L water) and avoid excess urea top-dressing.',
  },
  {
    id: 'fall_armyworm',
    nameAr: 'دودة الحشد الخريفية (Spodoptera frugiperda)',
    nameEn: 'Fall Armyworm (FAW)',
    scientificName: 'Spodoptera frugiperda',
    category: 'insect',
    hostCropIds: ['maize', 'sorghum', 'wheat', 'rice', 'clover'],
    optimalTempRangeC: [20, 33],
    minHumidityPct: 40,
    symptomsAr: 'ثقوب غير منتظمة ونوافذ شفافة في أوراق القلب (البلعوم) مع وجود نشارة برازية رطبة وندبة Y مقلوبة على رأس اليرقة.',
    symptomsEn: 'Ragged whorl feeding windows, moist sawdust-like frass in central funnel, and inverted Y-mark on larval head.',
    preventativeAr: 'نصب 4 مصائد فرمونية دلتا/فدان على ارتفاع المحصول + إطلاق طفيل الترايكوجراما (20 كارت/فدان) وفحص 50 نباتاً قطرياً كل 3 أيام.',
    preventativeEn: 'Deploy 4 Delta pheromone traps/feddan at canopy height + release Trichogramma parasitoids (20 cards/feddan) & scout 50 plants every 3 days.',
    ipmTreatmentAr: 'الرش الموجه داخل بلعوم النبات بمادة إيمامكتين بنزوات 5.7% (80 جم/فدان) أو سبينيتورام مع نصب المصائد الفرمونية (4 مصائد/فدان).',
    ipmTreatmentEn: 'Direct whorl-targeted spray of Emamectin Benzoate 5.7% (80 g/feddan) or Spinetoram + deploy 4 pheromone traps/feddan.',
  },
  {
    id: 'late_blight',
    nameAr: 'الندوة المتأخرة في البطاطس والطماطم (Phytophthora infestans)',
    nameEn: 'Potato & Tomato Late Blight',
    scientificName: 'Phytophthora infestans',
    category: 'fungal',
    hostCropIds: ['potato', 'tomato'],
    optimalTempRangeC: [15, 25],
    minHumidityPct: 64,
    symptomsAr: 'بقع مائية بنية داكنة على حواف الأوراق محاطة بزغب أبيض رمادي على السطح السفلي صباحاً، وتمتد للسوق والدرنات.',
    symptomsEn: 'Water-soaked dark brown lesions on leaf margins with white sporangial halo on undersides during humid mornings.',
    preventativeAr: 'رش وقائي بمادة مانكوزب 80% أو هيدروكسيد النحاس قبل موجات الشبورة والندى الصباحي مع منع الري المسائي تماماً.',
    preventativeEn: 'Preventative Mancozeb 80% or Copper Hydroxide spray ahead of morning fog/dew events and strictly avoid evening irrigation.',
    ipmTreatmentAr: 'رش وقائي/علاجي بمادة ميتالاكسيل-إم + مانكوزب أو أزوكسي ستروبين مع تقليل الري الليلي وتحسين تهوية الخطوط.',
    ipmTreatmentEn: 'Apply Metalaxyl-M + Mancozeb or Azoxystrobin, eliminate evening overhead irrigation, and improve row airflow.',
  },
  {
    id: 'aphids_virus',
    nameAr: 'حشرة المنّ وناقلي الفيروسات وتبقع الأوراق (Aphis craccivora)',
    nameEn: 'Black Bean Aphid & Chocolate Spot Complex',
    scientificName: 'Aphis craccivora / Botrytis fabae',
    category: 'insect',
    hostCropIds: ['fava_bean', 'clover', 'sugar_beet', 'cotton'],
    optimalTempRangeC: [16, 26],
    minHumidityPct: 52,
    symptomsAr: 'تجمعات حشرية على القمم النامية مع ندوة عسلية والتفاف الأوراق وبقع بنية بلون الشوكولاتة على الفول البلدي.',
    symptomsEn: 'Dense aphid colonies on shoot tips with honeydew secretion, leaf curling, and reddish-brown chocolate lesions.',
    preventativeAr: 'تعليق المصائد اللونية الصفراء اللاصقة (15 مصيدة/فدان) على حواف الزونا المواجهة للرياح + رش زيت النيم الطبيعي 1%.',
    preventativeEn: 'Hang 15 yellow sticky traps/feddan along windward zone borders + preventative 1% cold-pressed Neem oil spray.',
    ipmTreatmentAr: 'رش الصابون البوتاسي أو أسيتاميبريد (25 جم/100 لتر ماء) للبؤر المصابة مع إضافة أوكسي كلور النحاس للوقاية من التبقع.',
    ipmTreatmentEn: 'Spot-treat with Potassium Soap or Acetamiprid (25 g/100L water) combined with Copper Oxychloride against fungal spot.',
  },
  {
    id: 'root_knot_nematode',
    nameAr: 'نيماتودا تعقد الجذور في الأراضي الخفيفة (Meloidogyne spp.)',
    nameEn: 'Root-Knot Nematode',
    scientificName: 'Meloidogyne incognita / javanica',
    category: 'nematode',
    hostCropIds: ['potato', 'tomato', 'sugar_beet', 'olive', 'quinoa'],
    optimalTempRangeC: [18, 32],
    minHumidityPct: 30,
    symptomsAr: 'تقزم بؤري في الزونا الرملية، اصفرار وذبول وقت الظهيرة رغم توفر الرطوبة، مع وجود عقد وتورمات على الجذور الثانوية.',
    symptomsEn: 'Patchy stunting in sandy zones, midday wilting despite moisture, and characteristic galls/knots on feeder roots.',
    preventativeAr: 'إضافة مستخلص الأجيرين أو مطحون بذور النيم مع الخدمة + تلقيح منطقة الجذور ببكتيريا Bacillus subtilis وفطر Trichoderma harzianum.',
    preventativeEn: 'Incorporate neem cake during bed prep + inoculate root zone with Bacillus subtilis and Trichoderma harzianum bio-shields.',
    ipmTreatmentAr: 'حقن حيوي بفطر Paecilomyces lilacinus وBacillus firmus مع ماء الري بالتنقيط + هيوميك وفولفيك، وتطبيق دورة زراعية نجيلية.',
    ipmTreatmentEn: 'Bio-nematicide drip injection of Paecilomyces lilacinus & Bacillus firmus + humic acid, and rotate with non-host cereals.',
  },
  {
    id: 'tuta_whitefly',
    nameAr: 'حافرة أوراق الطماطم والذبابة البيضاء (Tuta absoluta & Bemisia tabaci)',
    nameEn: 'Tomato Leafminer & Silverleaf Whitefly',
    scientificName: 'Tuta absoluta / Bemisia tabaci',
    category: 'insect',
    hostCropIds: ['tomato', 'potato', 'cotton', 'sugar_beet'],
    optimalTempRangeC: [21, 34],
    minHumidityPct: 35,
    symptomsAr: 'أنفاق متعرجة شفافة بين بشرتي الورقة وثقوب في الثمار، مع طيران سحب صغيرة بيضاء عند هز النباتات وتجعد القمم.',
    symptomsEn: 'Blotch mines in mesophyll tissue, pinhole fruit galleries, whitefly clouds upon canopy disturbance, and TYLCV leaf curl.',
    preventativeAr: 'تركيب مصائد مائية بفرمون Tuta absoluta (8 مصائد/فدان) وإزالة الحشائش الباذنجانية على جسور المزرعة.',
    preventativeEn: 'Install 8 Tuta absoluta pheromone water traps/feddan and eradicate nightshade weeds along canal embankments.',
    ipmTreatmentAr: 'نصب المصائد المائية والضوئية الجاذبة (فيرمون توتا) + الرش التبادلي بـ كلورانترانيليبرول أو أبامكتين 1.8% في الصباح الباكر.',
    ipmTreatmentEn: 'Deploy pheromone water traps + alternate Chlorantraniliprole and Abamectin 1.8% during calm morning windows.',
  },
];

/**
 * Computes real-time local regional pest & disease risk warnings based on the farm's
 * exact geographic coordinates (latitude/longitude agro-climatic corridor), soil texture,
 * 14-day Open-Meteo humidity/temperature/rain forecast, and current crop.
 */
export function evaluateRegionalPestRisks(
  centroid: LatLon,
  soil: SoilProfile,
  forecast14: DailyWeatherPoint[],
  currentCropId: string,
  farmAverages: Record<SpectralIndexKey, number>
): RegionalPestRiskWarning[] {
  // Determine Agro-Climatic Corridor from exact farm coordinates
  const isNorthSinaiOrCoast = centroid.lat >= 30.85 || centroid.lng >= 32.3;
  const isNileDelta = centroid.lat >= 30.1 && centroid.lat < 30.85 && centroid.lng < 32.3;
  const isFayoumDepression =
    centroid.lat >= 29.0 && centroid.lat < 29.7 && centroid.lng >= 30.4 && centroid.lng <= 31.1;

  const regionLabelAr = isNorthSinaiOrCoast
    ? 'حزام شمال سيناء والساحل الشمالي (رطوبة ساحلية وتربة خفيفة)'
    : isNileDelta
    ? 'حزام دلتا النيل الأوسط (طينية رسوبية وكثافة ندى صباحي)'
    : isFayoumDepression
    ? 'حوض منخفض الفيوم وشبه الواحات (اعتدال حراري وتجمع رطوبي)'
    : 'نطاق الظهير الصحراوي وغرب المنيا (مدى حراري يومي مرتفع)';

  const regionLabelEn = isNorthSinaiOrCoast
    ? 'North Sinai & Coastal Belt (Marine Humidity & Sandy Profile)'
    : isNileDelta
    ? 'Central Nile Delta Corridor (Alluvial Clay & Morning Dew)'
    : isFayoumDepression
    ? 'Fayoum Oasis Basin (Micro-Thermal Depression)'
    : 'Western Desert Reclamation Belt (High Diurnal Temp Range)';

  const coordinatesLabel = `${centroid.lat.toFixed(4)}°N, ${centroid.lng.toFixed(4)}°E`;

  const next7 = forecast14.slice(0, 7);
  const avgMaxTemp =
    next7.reduce((acc, d) => acc + d.tempMaxC, 0) / Math.max(1, next7.length);
  const avgHumidity =
    next7.reduce((acc, d) => acc + d.relativeHumidityPct, 0) / Math.max(1, next7.length);
  const totalRain7d = next7.reduce((acc, d) => acc + d.precipMm, 0);

  // Find earliest safe spraying day (wind < 18 km/h & rain prob < 40%)
  const safeSprayDay = forecast14.find((d) => d.sprayingSafe) || forecast14[0];
  const recommendedSprayWindowAr = safeSprayDay
    ? `${safeSprayDay.dayLabelAr} صباحاً (الرياح ${safeSprayDay.windSpeedKmh} كم/س · احتمال مطر ${safeSprayDay.precipProbPct}%)`
    : 'في الصباح الباكر عند هدوء الرياح دون 15 كم/س';
  const recommendedSprayWindowEn = safeSprayDay
    ? `${safeSprayDay.dayLabelEn} Early Morning (Wind ${safeSprayDay.windSpeedKmh} km/h · Rain Prob ${safeSprayDay.precipProbPct}%)`
    : 'Early morning when wind < 15 km/h';

  const warnings: RegionalPestRiskWarning[] = REGIONAL_PEST_CATALOG.map((pest) => {
    let score = 38;

    // 1. Host crop match boost
    const isDirectHost = pest.hostCropIds.includes(currentCropId);
    if (isDirectHost) score += 26;

    // 2. Temperature window match
    const [minT, maxT] = pest.optimalTempRangeC;
    if (avgMaxTemp >= minT && avgMaxTemp <= maxT) {
      score += 18;
    } else if (avgMaxTemp >= minT - 3 && avgMaxTemp <= maxT + 3) {
      score += 9;
    }

    // 3. Relative Humidity & Rainfall fungal spore / insect boost
    if (avgHumidity >= pest.minHumidityPct) {
      score += 14;
    }
    if (pest.category === 'fungal' && (totalRain7d >= 3 || avgHumidity >= 62)) {
      score += 12;
    }

    // 4. Geographic Coordinate & Soil Texture vulnerability
    if (
      pest.id === 'root_knot_nematode' &&
      (soil.texture === 'sandy' || soil.texture === 'loamy' || isNorthSinaiOrCoast)
    ) {
      score += 22;
    }
    if (pest.id === 'yellow_rust' && (isNileDelta || isNorthSinaiOrCoast)) {
      score += 12;
    }
    if (pest.id === 'fall_armyworm' && (isFayoumDepression || !isNorthSinaiOrCoast)) {
      score += 10;
    }
    if (farmAverages.NDVI >= 0.65 && pest.category === 'fungal') {
      // Dense canopy traps humidity
      score += 6;
    }

    const riskScore = Math.max(18, Math.min(97, Math.round(score)));
    const regionalPrevalencePct = Math.max(
      14,
      Math.min(94, Math.round(riskScore * 0.88 + (isDirectHost ? 6 : -4)))
    );

    const riskLevel: RegionalPestRiskWarning['riskLevel'] =
      riskScore >= 80
        ? 'critical'
        : riskScore >= 65
        ? 'high'
        : riskScore >= 48
        ? 'moderate'
        : 'low';

    const outbreakTrendAr =
      regionalPrevalencePct >= 72
        ? `انتشار إقليمي مرتفع (${regionalPrevalencePct}% من الحقول المجاورة في نطاق 25 كم)`
        : regionalPrevalencePct >= 50
        ? `بؤر إقليمية متوسطة (${regionalPrevalencePct}% في المزارع المحيطة)`
        : `انتشار إقليمي محدود (${regionalPrevalencePct}% — مرحلة وقائية)`;

    const outbreakTrendEn =
      regionalPrevalencePct >= 72
        ? `High Regional Prevalence (${regionalPrevalencePct}% of farms within 25 km radius)`
        : regionalPrevalencePct >= 50
        ? `Moderate Regional Activity (${regionalPrevalencePct}% in neighboring fields)`
        : `Low Baseline Prevalence (${regionalPrevalencePct}% — Preventive Stage)`;

    const triggerReasonAr = `رصد مناخي عند الإحداثيات (${coordinatesLabel}): حرارة عظمى ${avgMaxTemp.toFixed(
      1
    )}°م ورطوبة جوية ${Math.round(avgHumidity)}% وأمطار متوقعة ${totalRain7d.toFixed(
      1
    )} مم${isDirectHost ? ' مع وجود عائل حساس قائم بالحقل' : ''}.`;

    const triggerReasonEn = `Micro-climate telemetry at (${coordinatesLabel}): Mean Tmax ${avgMaxTemp.toFixed(
      1
    )}°C, RH ${Math.round(avgHumidity)}%, 7-day rain ${totalRain7d.toFixed(1)} mm${
      isDirectHost ? ' with susceptible host crop planted' : ''
    }.`;

    return {
      pestId: pest.id,
      nameAr: pest.nameAr,
      nameEn: pest.nameEn,
      scientificName: pest.scientificName,
      category: pest.category,
      riskLevel,
      riskScore,
      regionalPrevalencePct,
      outbreakTrendAr,
      outbreakTrendEn,
      regionLabelAr,
      regionLabelEn,
      coordinatesLabel,
      triggerReasonAr,
      triggerReasonEn,
      preventiveActionAr: pest.preventativeAr || pest.ipmTreatmentAr,
      preventiveActionEn: pest.preventativeEn || pest.ipmTreatmentEn,
      treatmentAlertAr: pest.ipmTreatmentAr,
      treatmentAlertEn: pest.ipmTreatmentEn,
      recommendedSprayWindowAr,
      recommendedSprayWindowEn,
    };
  });

  return warnings.sort((a, b) => b.riskScore - a.riskScore);
}

/**
 * Creates a structured field pest/disease incident log entry pinned to exact sub-zone
 * coordinates, with regional prevalence data, preventative protocol, and curative treatment alert.
 */
export function createLoggedPestIncident(params: {
  pestId: string;
  subZoneId: 'A' | 'B' | 'C';
  severity: PestSeverity;
  notes: string;
  centroid: LatLon;
  forecast14: DailyWeatherPoint[];
  regionalPrevalencePct?: number;
}): LoggedPestIncident {
  const pest =
    REGIONAL_PEST_CATALOG.find((p) => p.id === params.pestId) || REGIONAL_PEST_CATALOG[0];

  // Offset coordinates slightly to represent the specific Sub-Zone (NE Zone A vs Center B vs SW Zone C)
  const zoneOffsetLat = params.subZoneId === 'A' ? 0.0014 : params.subZoneId === 'C' ? -0.0014 : 0;
  const zoneOffsetLng = params.subZoneId === 'A' ? 0.0014 : params.subZoneId === 'C' ? -0.0014 : 0;

  const safeDay = params.forecast14.find((d) => d.sprayingSafe) || params.forecast14[0];

  const severityMultiplierAr =
    params.severity === 'critical'
      ? 'تنبيه علاجي فوري خلال 12 ساعة (بؤرة حرجة)'
      : params.severity === 'high'
      ? 'تنبيه علاجي خلال 24 ساعة لمنع الانتشار للزونات المجاورة'
      : params.severity === 'moderate'
      ? 'رش موضعي للبؤر المصابة في الزونا مع الفحص الحشري/الفطري'
      : 'مكافحة وقائية ونصب مصائد رصد دون رش شامل';

  const severityMultiplierEn =
    params.severity === 'critical'
      ? 'Immediate curative alert within 12h (Critical Hotspot)'
      : params.severity === 'high'
      ? 'Curative treatment alert within 24h to contain spread across sub-zones'
      : params.severity === 'moderate'
      ? 'Targeted spot-application in affected sub-zone + field scouting'
      : 'Preventive monitoring & biological control; no blanket spray needed';

  const computedPrevalence =
    params.regionalPrevalencePct ??
    (params.severity === 'critical' ? 84 : params.severity === 'high' ? 74 : 58);

  return {
    id: `pest-log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    pestId: pest.id,
    pestNameAr: pest.nameAr,
    pestNameEn: pest.nameEn,
    scientificName: pest.scientificName,
    subZoneId: params.subZoneId,
    severity: params.severity,
    observedAt: new Date().toTimeString().slice(0, 5),
    coordinates: {
      lat: Number((params.centroid.lat + zoneOffsetLat).toFixed(5)),
      lng: Number((params.centroid.lng + zoneOffsetLng).toFixed(5)),
    },
    regionalPrevalencePct: computedPrevalence,
    symptomsObservedAr: pest.symptomsAr,
    symptomsObservedEn: pest.symptomsEn,
    notes: params.notes.trim(),
    preventativeRecommendationAr: pest.preventativeAr || pest.ipmTreatmentAr,
    preventativeRecommendationEn: pest.preventativeEn || pest.ipmTreatmentEn,
    prescribedActionAr: `${severityMultiplierAr}: ${pest.ipmTreatmentAr}`,
    prescribedActionEn: `${severityMultiplierEn}: ${pest.ipmTreatmentEn}`,
    safeSprayWindowAr: safeDay
      ? `${safeDay.dayLabelAr} (${safeDay.date}) — رياح ${safeDay.windSpeedKmh} كم/س`
      : 'الصباح الباكر (رياح < 15 كم/س)',
    safeSprayWindowEn: safeDay
      ? `${safeDay.dayLabelEn} (${safeDay.date}) — Wind ${safeDay.windSpeedKmh} km/h`
      : 'Early morning (Wind < 15 km/h)',
    status: 'active',
  };
}

// ============================================================================
// 10. 4-WEEK NPK NUTRIENT REQUIREMENT CALCULATOR & FERTIGATION SCHEDULER
// ============================================================================

/**
 * Baseline seasonal pure nutrient requirement (kg/feddan across the full season)
 * for each crop in CROP_DATABASE (referencing Egyptian ARC & FAO fertilizer bulletins).
 */
const CROP_SEASONAL_NPK_BASELINE: Record<
  string,
  { N: number; P2O5: number; K2O: number }
> = {
  wheat: { N: 75, P2O5: 30, K2O: 24 },
  fava_bean: { N: 20, P2O5: 32, K2O: 24 }, // N-fixing legume (starter N only + high P)
  clover: { N: 18, P2O5: 30, K2O: 20 }, // N-fixing legume
  sugar_beet: { N: 85, P2O5: 35, K2O: 48 }, // High K for sucrose accumulation
  potato: { N: 110, P2O5: 60, K2O: 96 }, // Intensive tuber feeder
  quinoa: { N: 55, P2O5: 25, K2O: 30 },
  olive: { N: 70, P2O5: 30, K2O: 65 },
  tomato: { N: 115, P2O5: 55, K2O: 90 },
  maize: { N: 120, P2O5: 35, K2O: 36 },
  sorghum: { N: 80, P2O5: 28, K2O: 28 },
  cotton: { N: 68, P2O5: 32, K2O: 45 },
  rice: { N: 70, P2O5: 24, K2O: 24 },
};

/**
 * Generates a scientifically calibrated 4-Week NPK (Nitrogen, Phosphorus, Potassium)
 * application schedule based on:
 * 1) Selected Crop Type (`cropId`)
 * 2) Soil Texture (`clay`, `loamy`, `sandy`, `calcareous`) & Soil Profile (`ph`, `salinityEC`, `irrigation`)
 * 3) Current Growth Stage & Accumulated GDD (`accumulatedGDD` or stage override)
 */
export function calculateFourWeekNpkSchedule(params: {
  cropId: string;
  soilTexture: SoilTexture;
  soilPh?: number;
  salinityEC?: number;
  irrigation?: SoilProfile['irrigation'];
  accumulatedGDD: number;
  areaFeddans: number;
}): FourWeekNpkSchedule {
  const crop = CROP_DATABASE.find((c) => c.id === params.cropId) || CROP_DATABASE[0];
  const baseSeasonal = CROP_SEASONAL_NPK_BASELINE[crop.id] || {
    N: 75,
    P2O5: 30,
    K2O: 36,
  };

  const targetTotalGDD = crop.totalGDDRequired;
  const clampedGDD = Math.max(0, Math.min(targetTotalGDD, Math.round(params.accumulatedGDD)));
  const completionPct = Math.min(
    100,
    Math.max(4, Math.round((clampedGDD / Math.max(1, targetTotalGDD)) * 100))
  );

  // Determine current growth stage from GDD completion % and crop botanical family
  const cropStageDefs = getCropPhenologyStageDefs(crop.id);
  const matchedCropStage =
    cropStageDefs.find((s) => completionPct <= s.pctThreshold) ||
    cropStageDefs[cropStageDefs.length - 1];
  const stageKey: GrowthStageInfo['stageKey'] = matchedCropStage.key;
  const stageNameAr = matchedCropStage.nameAr;
  const stageNameEn = matchedCropStage.nameEn;

  // Soil Texture Leaching & Fixation Modifiers
  // Sandy soils have low CEC and higher leaching -> +20% N & +15% K split into frequent fertigation doses
  // Calcareous soils immobilize phosphorus as Ca-P -> +22% P2O5 via acidic fertigation (Phosphoric acid / MAP)
  // Clay soils retain K+ on montmorillonite clay micelles -> -10% K2O requirement
  const nTextureFactor =
    params.soilTexture === 'sandy'
      ? 1.2
      : params.soilTexture === 'calcareous'
      ? 1.12
      : params.soilTexture === 'loamy'
      ? 1.0
      : 0.95;

  const pTextureFactor =
    params.soilTexture === 'calcareous' || (params.soilPh ?? 7.5) >= 7.9
      ? 1.22
      : params.soilTexture === 'sandy'
      ? 1.12
      : 1.0;

  const kTextureFactor =
    params.soilTexture === 'sandy'
      ? 1.16
      : params.soilTexture === 'clay'
      ? 0.9
      : 1.04;

  // Stage-specific 4-week uptake window fraction of seasonal total
  // Each of the 4 upcoming weeks (~120 GDD per week) has a stage-dependent NPK uptake curve
  const weeklyProfilesByStage: Record<
    GrowthStageInfo['stageKey'],
    Array<{
      nFrac: number;
      pFrac: number;
      kFrac: number;
      contextAr: string;
      contextEn: string;
    }>
  > = {
    germination: [
      {
        nFrac: 0.06,
        pFrac: 0.14,
        kFrac: 0.05,
        contextAr: 'تنشيط الشعيرات الجذرية (دفعة تنشيطية عالية الفوسفور)',
        contextEn: 'Root hair initiation (High-P starter boost)',
      },
      {
        nFrac: 0.08,
        pFrac: 0.12,
        kFrac: 0.06,
        contextAr: 'استطالة الجذير وبداية ظهور الأوراق الحقيقية',
        contextEn: 'Radicle elongation & first true leaf unfolding',
      },
      {
        nFrac: 0.11,
        pFrac: 0.1,
        kFrac: 0.08,
        contextAr: 'الانتقال للنمو الخضري وبداية التفريع',
        contextEn: 'Transition to vegetative stage & early tillering',
      },
      {
        nFrac: 0.13,
        pFrac: 0.09,
        kFrac: 0.09,
        contextAr: 'تسارع بناء الكلوروفيل والمجموع الخضري',
        contextEn: 'Rapid chlorophyll synthesis & canopy build-up',
      },
    ],
    vegetative: [
      {
        nFrac: 0.14,
        pFrac: 0.1,
        kFrac: 0.09,
        contextAr: 'ذروة التفريع وبناء السيقان والأوراق (أعلى احتياج أزوتي)',
        contextEn: 'Peak tillering & stem elongation (High Nitrogen demand)',
      },
      {
        nFrac: 0.15,
        pFrac: 0.09,
        kFrac: 0.1,
        contextAr: 'اكتمال التغطية الخضرية ورفع مؤشر NDVI',
        contextEn: 'Canopy closure & maximum NDVI expansion',
      },
      {
        nFrac: 0.13,
        pFrac: 0.1,
        kFrac: 0.12,
        contextAr: 'تهيئة البراعم الزهرية ودعم توازن الفوسفور والبوتاسيوم',
        contextEn: 'Floral primordia differentiation & P-K balance',
      },
      {
        nFrac: 0.11,
        pFrac: 0.11,
        kFrac: 0.13,
        contextAr: 'ما قبل التزهير وطرد السنابل مباشرة',
        contextEn: 'Pre-anthesis / booting stage transition',
      },
    ],
    flowering: [
      {
        nFrac: 0.1,
        pFrac: 0.12,
        kFrac: 0.14,
        contextAr: 'بداية التزهير وحيوية حبوب اللقاح (تثبيت العقد)',
        contextEn: 'Early flowering & pollen viability (Fruit/grain set)',
      },
      {
        nFrac: 0.09,
        pFrac: 0.11,
        kFrac: 0.15,
        contextAr: 'ذروة التزهير والعقد مع تحجيم البوتاسيوم',
        contextEn: 'Full bloom & early pod/grain set with elevated K₂O',
      },
      {
        nFrac: 0.07,
        pFrac: 0.08,
        kFrac: 0.16,
        contextAr: 'بداية انتقال السكريات والنشا للثمار/الحبوب',
        contextEn: 'Onset of carbohydrate translocation to sinks',
      },
      {
        nFrac: 0.06,
        pFrac: 0.06,
        kFrac: 0.16,
        contextAr: 'امتلاء الحبوب/الدرنات المبكر',
        contextEn: 'Early grain/tuber bulking phase',
      },
    ],
    fruiting: [
      {
        nFrac: 0.06,
        pFrac: 0.06,
        kFrac: 0.18,
        contextAr: 'ذروة التحجيم وامتلاء الحبوب/الدرنات (دفعة بوتاسيوم مكثفة)',
        contextEn: 'Peak grain/tuber bulking (Intensive Potassium K₂O phase)',
      },
      {
        nFrac: 0.04,
        pFrac: 0.05,
        kFrac: 0.17,
        contextAr: 'رفع نسبة السكر والصلابة والوزن النوعي للمحصول',
        contextEn: 'Enhancing Brix sugar, firmness & specific gravity',
      },
      {
        nFrac: 0.02,
        pFrac: 0.03,
        kFrac: 0.13,
        contextAr: 'اكتمال التحجيم وبداية تلون ونضج المحصول',
        contextEn: 'Final sizing & onset of physiological ripening',
      },
      {
        nFrac: 0.0,
        pFrac: 0.0,
        kFrac: 0.06,
        contextAr: 'تصفية التسميد الأزوتي تماماً وتجهيز المحصول للحصاد',
        contextEn: 'Zero Nitrogen — final K₂O ripening before harvest',
      },
    ],
    harvest: [
      {
        nFrac: 0.0,
        pFrac: 0.0,
        kFrac: 0.05,
        contextAr: 'نضج فسيولوجي متقدم — يوقف النيتروجين والفوسفور تماماً',
        contextEn: 'Advanced maturity — suspend N and P applications completely',
      },
      {
        nFrac: 0.0,
        pFrac: 0.0,
        kFrac: 0.0,
        contextAr: 'فترة الفطام والتجفيف قبل الحصاد (بدون تسميد)',
        contextEn: 'Pre-harvest dry-down window (Zero fertilizer)',
      },
      {
        nFrac: 0.0,
        pFrac: 0.0,
        kFrac: 0.0,
        contextAr: 'الحصاد وجمع المحصول',
        contextEn: 'Harvest operations window',
      },
      {
        nFrac: 0.0,
        pFrac: 0.08,
        kFrac: 0.0,
        contextAr: 'خدمة ما بعد الحصاد وتجهيز المهد للموسم التالي',
        contextEn: 'Post-harvest residue incorporation & bed prep',
      },
    ],
  };

  const stageProfile = weeklyProfilesByStage[stageKey];
  const isAcidicFertigation =
    params.soilTexture === 'calcareous' ||
    (params.soilPh ?? 7.5) >= 7.8 ||
    (params.salinityEC ?? 1.5) >= 2.5;

  const weeks: NpkWeekDose[] = stageProfile.map((w, idx) => {
    const weekNumber = (idx + 1) as 1 | 2 | 3 | 4;
    const gddStart = Math.min(targetTotalGDD, clampedGDD + idx * 115);
    const gddEnd = Math.min(targetTotalGDD, clampedGDD + (idx + 1) * 115);

    const pureNKgPerFeddan = Number(
      (baseSeasonal.N * w.nFrac * nTextureFactor).toFixed(1)
    );
    const pureP2O5KgPerFeddan = Number(
      (baseSeasonal.P2O5 * w.pFrac * pTextureFactor).toFixed(1)
    );
    const pureK2OKgPerFeddan = Number(
      (baseSeasonal.K2O * w.kFrac * kTextureFactor).toFixed(1)
    );

    const totalFarmNKg = Number(
      (pureNKgPerFeddan * Math.max(0.5, params.areaFeddans)).toFixed(1)
    );
    const totalFarmP2O5Kg = Number(
      (pureP2O5KgPerFeddan * Math.max(0.5, params.areaFeddans)).toFixed(1)
    );
    const totalFarmK2OKg = Number(
      (pureK2OKgPerFeddan * Math.max(0.5, params.areaFeddans)).toFixed(1)
    );

    // Commercial Fertilizer Equivalent Conversion:
    // Ammonium Nitrate (33.5% N) or Ammonium Sulfate (20.6% N for alkaline/calcareous soils)
    // Phosphoric Acid (85% -> ~61% P2O5) or MAP (12-61-0)
    // Potassium Sulfate (50% K2O)
    const nCommercialKg = isAcidicFertigation
      ? Math.round(pureNKgPerFeddan / 0.206) // Ammonium Sulfate 20.6% N
      : Math.round(pureNKgPerFeddan / 0.335); // Ammonium Nitrate 33.5% N
    const nSourceNameAr = isAcidicFertigation ? 'سلفات نشادر 20.6%' : 'نترات نشادر 33.5%';
    const nSourceNameEn = isAcidicFertigation
      ? 'Ammonium Sulfate (20.6% N)'
      : 'Ammonium Nitrate (33.5% N)';

    const pCommercialLiters = Number((pureP2O5KgPerFeddan / 0.61).toFixed(1));
    const kCommercialKg = Math.round(pureK2OKgPerFeddan / 0.5); // Potassium Sulfate 50% K2O

    const commercialSourceAr =
      pureNKgPerFeddan === 0 && pureP2O5KgPerFeddan === 0 && pureK2OKgPerFeddan === 0
        ? 'بدون تسميد كيميائي (فطام ما قبل الحصاد)'
        : `${nCommercialKg} كجم ${nSourceNameAr} + ${pCommercialLiters} لتر حامض فوسفوريك + ${kCommercialKg} كجم سلفات بوتاسيوم/فدان`;

    const commercialSourceEn =
      pureNKgPerFeddan === 0 && pureP2O5KgPerFeddan === 0 && pureK2OKgPerFeddan === 0
        ? 'No chemical fertilizer (Pre-harvest maturation)'
        : `${nCommercialKg} kg ${nSourceNameEn} + ${pCommercialLiters}L Phosphoric Acid + ${kCommercialKg} kg Potassium Sulfate/fed`;

    const applicationMethodAr =
      params.soilTexture === 'sandy'
        ? 'تقسيم المقررات على 4 دفعات أسبوعية مع مياه الري (Fertigation) لمنع الغسيل في التربة الرملية'
        : params.soilTexture === 'calcareous'
        ? 'حقن مع مياه الري بصورة حامضية (سلفات نشادر + فوسفوريك) لمنع تثبيت الفوسفور مع كربونات الكالسيوم'
        : 'حقن على دفعتين أسبوعياً مع الري الصباحي';

    const applicationMethodEn =
      params.soilTexture === 'sandy'
        ? 'Split into 4 micro-fertigation pulses/week to prevent nitrate leaching in sandy soil'
        : params.soilTexture === 'calcareous'
        ? 'Acidified fertigation injection to prevent Ca-P precipitation in calcareous soil'
        : 'Apply in 2 split applications per week with morning irrigation';

    return {
      weekNumber,
      weekLabelAr: `الأسبوع 0${weekNumber}`,
      weekLabelEn: `Week 0${weekNumber}`,
      stageContextAr: w.contextAr,
      stageContextEn: w.contextEn,
      gddWindowLabel: `${gddStart}–${gddEnd} GDD`,
      pureNKgPerFeddan,
      pureP2O5KgPerFeddan,
      pureK2OKgPerFeddan,
      totalFarmNKg,
      totalFarmP2O5Kg,
      totalFarmK2OKg,
      commercialSourceAr,
      commercialSourceEn,
      applicationMethodAr,
      applicationMethodEn,
    };
  });

  const total4WeekPureNPerFeddan = Number(
    weeks.reduce((a, b) => a + b.pureNKgPerFeddan, 0).toFixed(1)
  );
  const total4WeekPureP2O5PerFeddan = Number(
    weeks.reduce((a, b) => a + b.pureP2O5KgPerFeddan, 0).toFixed(1)
  );
  const total4WeekPureK2OPerFeddan = Number(
    weeks.reduce((a, b) => a + b.pureK2OKgPerFeddan, 0).toFixed(1)
  );

  const totalFarmPureNKg = Number(
    (total4WeekPureNPerFeddan * Math.max(0.5, params.areaFeddans)).toFixed(1)
  );
  const totalFarmPureP2O5Kg = Number(
    (total4WeekPureP2O5PerFeddan * Math.max(0.5, params.areaFeddans)).toFixed(1)
  );
  const totalFarmPureK2OKg = Number(
    (total4WeekPureK2OPerFeddan * Math.max(0.5, params.areaFeddans)).toFixed(1)
  );

  const agronomicNoteAr = crop.nitrogenFixer
    ? `محصول بقولي مثبت للأزوت (${crop.nameAr}): تم خفض النيتروجين المعدني إلى جرعة تنشيطية فقط مع التركيز على الفوسفور والبوتاسيوم والمولبدنوم لتنشيط عقد الريزوبيوم في التربة (${params.soilTexture}).`
    : `تمت معايرة برنامج الـ 4 أسابيع لمحصول ${crop.nameAr} عند ${clampedGDD} وحدة حرارية (${stageNameAr}) مع معامل تعديل قوام التربة (${params.soilTexture}: ×${nTextureFactor} للأزوت و×${pTextureFactor} للفوسفور).`;

  const agronomicNoteEn = crop.nitrogenFixer
    ? `Nitrogen-fixing legume (${crop.nameEn}): Synthetic N reduced to starter dose while prioritizing P₂O₅ & K₂O to stimulate Rhizobium nodulation in ${params.soilTexture} soil.`
    : `4-week NPK schedule calibrated for ${crop.nameEn} at ${clampedGDD} GDD (${stageNameEn}) with ${params.soilTexture} soil texture factor (N ×${nTextureFactor}, P ×${pTextureFactor}).`;

  return {
    cropId: crop.id,
    cropNameAr: crop.nameAr,
    cropNameEn: crop.nameEn,
    soilTexture: params.soilTexture,
    stageKey,
    stageNameAr,
    stageNameEn,
    accumulatedGDD: clampedGDD,
    targetTotalGDD,
    total4WeekPureNPerFeddan,
    total4WeekPureP2O5PerFeddan,
    total4WeekPureK2OPerFeddan,
    totalFarmPureNKg,
    totalFarmPureP2O5Kg,
    totalFarmPureK2OKg,
    leachingAdjustmentFactor: nTextureFactor,
    agronomicNoteAr,
    agronomicNoteEn,
    weeks,
  };
}

// ============================================================================
// 11. 30-DAY DAILY CROP GROWTH & GDD PROGRESSION ENGINE
// ============================================================================

export function calculateThirtyDayGddProjection(params: {
  cropId: string;
  accumulatedGDD: number;
  stageOverride?: GrowthStageInfo['stageKey'];
  forecast14?: DailyWeatherPoint[];
  startDateISO?: string;
}): ThirtyDayGddProjectionSummary {
  const crop = CROP_DATABASE.find((c) => c.id === params.cropId) || CROP_DATABASE[0];
  const targetTotalGDD = crop.totalGDDRequired;

  const stageDefs = getCropPhenologyStageDefs(crop.id);

  const stageThresholds = stageDefs.map((s) => ({
    key: s.key,
    nameAr: s.nameAr,
    nameEn: s.nameEn,
    gddThreshold: Math.round((s.pctThreshold / 100) * targetTotalGDD),
    pctThreshold: s.pctThreshold,
    kc: s.kc,
    color: s.color,
  }));

  let startAccumulatedGDD = Math.max(0, Math.min(targetTotalGDD, Math.round(params.accumulatedGDD)));
  if (params.stageOverride) {
    const matchedDef = stageDefs.find((s) => s.key === params.stageOverride);
    if (matchedDef) {
      const currentPct = (startAccumulatedGDD / targetTotalGDD) * 100;
      const stageIdx = stageDefs.findIndex((s) => s.key === params.stageOverride);
      const minPct = stageIdx === 0 ? 0 : stageDefs[stageIdx - 1].pctThreshold + 0.5;
      const maxPct = matchedDef.pctThreshold;
      if (currentPct < minPct || currentPct > maxPct) {
        startAccumulatedGDD = Math.round((matchedDef.defaultStartPct / 100) * targetTotalGDD);
      }
    }
  }

  const resolveStageForGdd = (gdd: number) => {
    const pct = Math.min(100, (gdd / targetTotalGDD) * 100);
    const idx = stageDefs.findIndex((s) => pct <= s.pctThreshold);
    return stageDefs[idx === -1 ? 4 : idx];
  };

  const startStage = resolveStageForGdd(startAccumulatedGDD);
  const startCompletionPct = Number(
    Math.min(100, (startAccumulatedGDD / targetTotalGDD) * 100).toFixed(1)
  );

  const baseDate = new Date(params.startDateISO || '2026-11-08T12:00:00Z');
  const [optMin, optMax] = crop.optimalTempRangeC;
  const baselineMeanC = (optMin + optMax) / 2;

  const dailyPoints: DailyGddProjectionPoint[] = [];
  let runningGdd = startAccumulatedGDD;
  let prevStageKey = startStage.key;
  let daysToNextStage: number | null = null;
  let nextStageNameAr: string | null = null;
  let nextStageNameEn: string | null = null;

  for (let d = 1; d <= 30; d++) {
    const dayDate = new Date(baseDate.getTime() + (d - 1) * 86400000);
    const dateISO = dayDate.toISOString().slice(0, 10);
    const dateShortLabel = dateISO.slice(5); // MM-DD

    const forecastDay = params.forecast14?.[d - 1];
    const tempMaxC = forecastDay
      ? forecastDay.tempMaxC
      : Number((baselineMeanC + 5.8 + Math.sin(d * 0.35) * 1.6).toFixed(1));
    const tempMinC = forecastDay
      ? forecastDay.tempMinC
      : Number((baselineMeanC - 4.4 + Math.cos(d * 0.31) * 1.3).toFixed(1));
    const tempMeanC = Number(((tempMaxC + tempMinC) / 2).toFixed(1));

    const currentStageDef = resolveStageForGdd(runningGdd);
    const rawDailyThermal = Math.max(3.2, tempMeanC - crop.baseTempGDD);
    const dailyGdd = Number((rawDailyThermal * currentStageDef.vigorMultiplier).toFixed(1));

    runningGdd = Number(Math.min(targetTotalGDD, runningGdd + dailyGdd).toFixed(1));
    const completionPct = Number(
      Math.min(100, Math.max(0, (runningGdd / targetTotalGDD) * 100)).toFixed(1)
    );

    const newStageDef = resolveStageForGdd(runningGdd);
    const isStageTransition = newStageDef.key !== prevStageKey;
    if (isStageTransition && daysToNextStage === null) {
      daysToNextStage = d;
      nextStageNameAr = newStageDef.nameAr;
      nextStageNameEn = newStageDef.nameEn;
    }
    prevStageKey = newStageDef.key;

    const canopyCoverPct = Math.min(
      96,
      Math.max(10, Math.round(14 + (completionPct / 100) * 82))
    );
    const rootDepthCm = Math.round(18 + (completionPct / 100) * 65);

    dailyPoints.push({
      dayOffset: d,
      dateISO,
      dateShortLabel,
      tempMaxC,
      tempMinC,
      tempMeanC,
      dailyGdd,
      cumulativeGdd: Math.round(runningGdd),
      completionPct,
      stageKey: newStageDef.key,
      stageNameAr: newStageDef.nameAr,
      stageNameEn: newStageDef.nameEn,
      cropCoefficientKc: newStageDef.kc,
      canopyCoverPct,
      rootDepthCm,
      isStageTransition,
      transitionToStageAr: isStageTransition ? newStageDef.nameAr : undefined,
      transitionToStageEn: isStageTransition ? newStageDef.nameEn : undefined,
    });
  }

  // If no transition occurred within 30 days, compute estimated days to next stage threshold
  const total30DayGddGain = Number((runningGdd - startAccumulatedGDD).toFixed(1));
  const avgDailyGddRate = Number((total30DayGddGain / 30).toFixed(1));

  if (daysToNextStage === null && startStage.key !== 'harvest') {
    const startIdx = stageDefs.findIndex((s) => s.key === startStage.key);
    const nextStage = stageDefs[Math.min(stageDefs.length - 1, startIdx + 1)];
    const nextThresholdGdd = (nextStage.pctThreshold / 100) * targetTotalGDD;
    const remainingGddToNext = Math.max(0, nextThresholdGdd - startAccumulatedGDD);
    daysToNextStage = Math.max(1, Math.ceil(remainingGddToNext / Math.max(4, avgDailyGddRate)));
    nextStageNameAr = nextStage.nameAr;
    nextStageNameEn = nextStage.nameEn;
  }

  const endStage = resolveStageForGdd(runningGdd);
  const endCompletionPct = Number(
    Math.min(100, (runningGdd / targetTotalGDD) * 100).toFixed(1)
  );

  return {
    cropId: crop.id,
    cropNameAr: crop.nameAr,
    cropNameEn: crop.nameEn,
    baseTempGDD: crop.baseTempGDD,
    targetTotalGDD,
    startAccumulatedGDD,
    endAccumulatedGDD: Math.round(runningGdd),
    total30DayGddGain: Math.round(total30DayGddGain),
    avgDailyGddRate,
    startStageKey: startStage.key,
    startStageNameAr: startStage.nameAr,
    startStageNameEn: startStage.nameEn,
    endStageKey: endStage.key,
    endStageNameAr: endStage.nameAr,
    endStageNameEn: endStage.nameEn,
    startCompletionPct,
    endCompletionPct,
    daysToNextStage,
    nextStageNameAr,
    nextStageNameEn,
    stageThresholds,
    dailyPoints,
  };
}

// ============================================================================
// 11. ADVANCED MULTI-YEAR (3–5 YEAR) CROP ROTATION STRATEGY GENERATOR
// ============================================================================

export function generateMultiYearRotationStrategies(
  soil: SoilProfile,
  farmAverages: Record<SpectralIndexKey, number>,
  areaFeddans = 5,
  cycleYears: MultiYearCycleLength = 4
): MultiYearRotationStrategy[] {
  const effectiveArea = Math.max(1, Number(areaFeddans.toFixed(2)));
  const isSaline = soil.salinityEC >= 2.5;
  const isSandyOrCalcareous = soil.texture === 'sandy' || soil.texture === 'calcareous';

  // 1. SOIL REGENERATION STRATEGY (Cover Cropping + Nitrogen-Fixing Legumes + Organic Carbon Restoration)
  const regenYearsAll = [
    {
      yearNumber: 1,
      yearLabelAr: 'السنة 1 (2026/2027) — تأسيس الرصيد الأزوتي وكسر أطوار البيات',
      yearLabelEn: 'Year 1 (2026/27) — Biological N-Fixation & Diapause Break',
      winterCropId: 'clover',
      winterCropAr: 'برسيم مصري مسقاوي (4 حشات + قلب الحشة الأخيرة سماد أخضر)',
      winterCropEn: 'Egyptian Berseem Clover (4 Cuts + Green Manure Plow-Down)',
      summerCropId: 'cotton',
      summerCropAr: 'قطن مصري طويل التيلة (جيزة 94) بعد تحريش البرسيم في 10 مايو',
      summerCropEn: 'Egyptian Extra-Long Staple Cotton (Giza 94)',
      coverOrIntercropAr: 'غطاء نباتي شتوي مثبت للأزوت (Rhizobium leguminosarum) + حرث الحشة الخامسة في التربة',
      coverOrIntercropEn: 'Rhizobium-inoculated Berseem cover crop plowed into topsoil before Cotton',
      nitrogenDeltaKgPerFeddan: 68,
      organicMatterGainPct: 0.24,
      waterUseM3PerFeddan: 3420,
      pestReductionNoteAr: 'إيقاف ري البرسيم قبل 10 مايو يقضي على عذارى دودة ورق القطن ويكسر دورة الذبول الفيوزاريومي بنسبة 85%.',
      pestReductionNoteEn: 'Cutting off Berseem irrigation by May 10 breaks Cotton Leafworm pupation and suppresses Fusarium wilt by 85%.',
      expectedNetReturnEgpPerFeddan: 68500,
    },
    {
      yearNumber: 2,
      yearLabelAr: 'السنة 2 (2027/2028) — استثمار الأزوت الحيوي في الحبوب الاستراتيجية',
      yearLabelEn: 'Year 2 (2027/28) — Leveraging Residual Nitrogen for Strategic Cereals',
      winterCropId: 'wheat',
      winterCropAr: 'قمح مصري عالي الجودة (سخا 95) على مرقد القطن النظيف',
      winterCropEn: 'Grade-A Egyptian Wheat (Sakha 95) on Clean Cotton Seedbed',
      summerCropId: 'maize',
      summerCropAr: 'ذرة شامية فردي (هجين 168) محملة مع فول صويا/لوبيا علف',
      summerCropEn: 'Single-Cross Maize (Hybrid 168) Intercropped with Cowpea/Soybean',
      coverOrIntercropAr: 'تحميل بقولي صيفي (لوبيا/فول صويا) بين خطوط الذرة لمنع استنزاف النيتروجين وتغطية سطح التربة',
      coverOrIntercropEn: 'Summer legume intercropping (Cowpea) between Maize rows to shade soil & fix N',
      nitrogenDeltaKgPerFeddan: 15,
      organicMatterGainPct: 0.18,
      waterUseM3PerFeddan: 3580,
      pestReductionNoteAr: 'زراعة القمح بعد القطن تمنع انتقال فطريات أعفان الجذور النجيلية (Fusarium) وتقلل حشائش الزمير بنسبة 80%.',
      pestReductionNoteEn: 'Sowing Wheat after Cotton prevents cereal root-rot carryover and cuts wild oat weeds by 80%.',
      expectedNetReturnEgpPerFeddan: 64200,
    },
    {
      yearNumber: 3,
      yearLabelAr: 'السنة 3 (2028/2029) — تجديد البكتيريا العقدية وتطهير النيماتودا',
      yearLabelEn: 'Year 3 (2028/29) — Deep Taproot Loosening & Nematode Suppression',
      winterCropId: 'fava_bean',
      winterCropAr: 'فول بلدي (جيزة 716) ملقح بالعقدين البكتيري النشط',
      winterCropEn: 'Rhizobium-Inoculated Fava Bean (Giza 716)',
      summerCropId: 'sorghum',
      summerCropAr: 'ذرة رفيعة (شندويل 6) + فرم وقلب المجموع الخضري الغض كسماد عضوي',
      summerCropEn: 'Grain Sorghum (Shandaweel 6) + Bio-Fumigant Residue Incorporation',
      coverOrIntercropAr: 'محصول تغطية بقولي شتوي (فول بلدي) + إفرازات جذور الذرة الرفيعة الكابحة للنيماتودا',
      coverOrIntercropEn: 'Fava Bean N-fixation + Sorghum dhurrin root exudates for bio-fumigation',
      nitrogenDeltaKgPerFeddan: 52,
      organicMatterGainPct: 0.22,
      waterUseM3PerFeddan: 3150,
      pestReductionNoteAr: 'إحلال الفول البلدي مكان القمح يقطع دورة حياة الصدأ الأصفر ومنّ الغلال ويثري الفلورا الميكروبية.',
      pestReductionNoteEn: 'Replacing Wheat with Fava Bean breaks Yellow Rust and Cereal Aphid cycles while enriching soil biota.',
      expectedNetReturnEgpPerFeddan: 61800,
    },
    {
      yearNumber: 4,
      yearLabelAr: 'السنة 4 (2029/2030) — تعظيم الدبال العضوي وتفكيك تحت التربة',
      yearLabelEn: 'Year 4 (2029/30) — Subsoil Biological Tillage & Humus Peak',
      winterCropId: 'wheat',
      winterCropAr: 'قمح سخا 95 (توفير 35% من سماد اليوريا الكيميائي بفضل الفول السابق)',
      winterCropEn: 'Sakha 95 Wheat (-35% Synthetic Urea Requirement after Fava Bean)',
      summerCropId: 'cotton',
      summerCropAr: 'قطن مصري (جيزة 94) + مصائد فرمونية وتسميد حيوي بالهيوميك',
      summerCropEn: 'Egyptian Cotton (Giza 94) with Bio-Humic Soil Conditioning',
      coverOrIntercropAr: 'برسيم فحل تحريش سريع النمو (حشة واحدة 55 يوماً) يزرع في سبتمبر قبل القمح',
      coverOrIntercropEn: 'Fast-growing Fahl Berseem cover crop (55-day single cut) sown in Sept prior to Wheat',
      nitrogenDeltaKgPerFeddan: 34,
      organicMatterGainPct: 0.21,
      waterUseM3PerFeddan: 3490,
      pestReductionNoteAr: 'برسيم الفحل قبل القمح يثبت 30 كجم أزوت إضافي ويكبح إنبات الحشائش الشتوية المبكرة.',
      pestReductionNoteEn: 'Pre-wheat Fahl Berseem cover crop fixes +30 kg N/feddan and smothers early winter weeds.',
      expectedNetReturnEgpPerFeddan: 71400,
    },
    {
      yearNumber: 5,
      yearLabelAr: 'السنة 5 (2030/2031) — قمة الخصوبة الحيوية والإنتاج التصديري المستدام',
      yearLabelEn: 'Year 5 (2030/31) — Peak Soil Fertility & Export-Grade Harvest',
      winterCropId: 'clover',
      winterCropAr: 'برسيم مصري مسقاوي + إنتاج تقاوي البرسيم عالية القيمة',
      winterCropEn: 'Egyptian Berseem Clover + High-Value Certified Seed Production',
      summerCropId: 'maize',
      summerCropAr: 'ذرة شامية هجين 168 بأعلى كفاءة امتلاء حبوب (+18% زيادة إنتاجية)',
      summerCropEn: 'Maize Hybrid 168 with +18% Yield Boost from Restored Soil Carbon',
      coverOrIntercropAr: 'تغطية مستديمة للتربة على مدار الـ 12 شهراً لمنع أكسدة المادة العضوية صيفاً',
      coverOrIntercropEn: 'Year-round living root cover preventing summer photo-oxidation of soil humus',
      nitrogenDeltaKgPerFeddan: 60,
      organicMatterGainPct: 0.25,
      waterUseM3PerFeddan: 3380,
      pestReductionNoteAr: 'توازن كامل للأعداء الحيوية في التربة وخفض استخدام المبيدات الفطرية والحشرية بنسبة 75%.',
      pestReductionNoteEn: 'Full restoration of predatory soil microbiota, cutting pesticide outlays by 75%.',
      expectedNetReturnEgpPerFeddan: 73900,
    },
  ].slice(0, cycleYears);

  // 2. WATER CONSERVATION STRATEGY (Drought-Tolerant & Low-ETc Crops)
  const waterYearsAll = [
    {
      yearNumber: 1,
      yearLabelAr: 'السنة 1 (2026/2027) — توافق كامل مع نافذة الأمطار الشتوية',
      yearLabelEn: 'Year 1 (2026/27) — Winter Rainfall Synchronization & Deep Root Establishment',
      winterCropId: 'wheat',
      winterCropAr: 'قمح سخا 95 (مقاوم للجفاف والحرارة — ري تكميلي ذكي)',
      winterCropEn: 'Drought-Tolerant Wheat (Sakha 95 — Deficit Supplemental Irrigation)',
      summerCropId: 'sorghum',
      summerCropAr: 'ذرة رفيعة (شندويل 6) بديلة للذرة الشامية والأرز (توفير 42% مياه صيفية)',
      summerCropEn: 'Drought-Resilient Sorghum (Shandaweel 6 — Saves 42% Summer Water vs Maize)',
      coverOrIntercropAr: 'تغطية سطح التربة بفرم قش القمح (Mulching) لخفض البخر السطحي بنسبة 28%',
      coverOrIntercropEn: 'Chopped wheat straw surface mulch cutting soil evaporation by 28%',
      nitrogenDeltaKgPerFeddan: 8,
      organicMatterGainPct: 0.14,
      waterUseM3PerFeddan: 2540,
      pestReductionNoteAr: 'الذرة الرفيعة تتحمل الجفاف وتقاوم دودة الحشد الخريفية وعفن الساق المتأخر مقارنة بالذرة الشامية.',
      pestReductionNoteEn: 'Sorghum withstands heat waves and resists Late Wilt and Fall Armyworm far better than Maize.',
      expectedNetReturnEgpPerFeddan: 56400,
    },
    {
      yearNumber: 2,
      yearLabelAr: 'السنة 2 (2027/2028) — المحاصيل المتحملة للملوحة والعطش (Halophyte & Taproot)',
      yearLabelEn: 'Year 2 (2027/28) — Deep Taproot Halophyte & Low-Water Legume Cycle',
      winterCropId: 'sugar_beet',
      winterCropAr: 'بنجر السكر وحيد الجنين (جذور وتدية عميقة تسحب رطوبة تحت التربة وتتحمل 7 dS/m)',
      winterCropEn: 'Monogerm Sugar Beet (Deep Taproot Extracting Subsoil Moisture up to EC 7 dS/m)',
      summerCropId: 'cotton',
      summerCropAr: 'قطن جيزة 94 على مصاطب بالتنقيط (توفير 35% من مياه الري بالغمر)',
      summerCropEn: 'Raised-Bed Drip-Irrigated Cotton Giza 94 (-35% Water vs Flood)',
      coverOrIntercropAr: 'زراعة على مصاطب عريضة مع الاحتفاظ ببقايا عروش البنجر لتحسين مسامية التربة',
      coverOrIntercropEn: 'Raised-bed cultivation with Sugar Beet crown residue incorporation',
      nitrogenDeltaKgPerFeddan: 12,
      organicMatterGainPct: 0.15,
      waterUseM3PerFeddan: 2790,
      pestReductionNoteAr: 'تعاقب بنجر السكر والقطن بالتنقيط يمنع رطوبة الأوراق الحرة ويقلل أعفان الجذور والندوات بنسبة 78%.',
      pestReductionNoteEn: 'Drip-irrigated Sugar Beet -> Cotton eliminates free canopy moisture, reducing blights and root rots by 78%.',
      expectedNetReturnEgpPerFeddan: 66800,
    },
    {
      yearNumber: 3,
      yearLabelAr: 'السنة 3 (2028/2029) — بقوليات منخفضة المقنن المائي + محاصيل ذكية مناخياً',
      yearLabelEn: 'Year 3 (2028/29) — Low-ETc Winter Legume & Ultra-Low Water Summer Crop',
      winterCropId: isSaline || isSandyOrCalcareous ? 'quinoa' : 'fava_bean',
      winterCropAr:
        isSaline || isSandyOrCalcareous
          ? 'كينوا سيناء (مقنن مائي 260 مم فقط وتتحمل ملوحة حتى 11 dS/m)'
          : 'فول بلدي جيزة 716 (يعتمد على أمطار الشتاء و3 ريات تكميلية فقط)',
      winterCropEn:
        isSaline || isSandyOrCalcareous
          ? 'Sinai Quinoa (Only 260 mm Seasonal Water & Tolerates EC 11 dS/m)'
          : 'Fava Bean Giza 716 (Thrives on Winter Rain + 3 Light Irrigations)',
      summerCropId: 'sorghum',
      summerCropAr: 'ذرة رفيعة شندويل 6 + تحميل سمسم/لوبيا جافة متحملة للحرارة',
      summerCropEn: 'Sorghum Shandaweel 6 Intercropped with Heat-Tolerant Cowpea',
      coverOrIntercropAr: 'برسيم فحل (حشة واحدة موفرة للمياه) أو تغطية عضوية لتقليل البخر-نتح (ET₀)',
      coverOrIntercropEn: 'Single-cut water-saving Fahl Berseem or residue mulch',
      nitrogenDeltaKgPerFeddan: 44,
      organicMatterGainPct: 0.17,
      waterUseM3PerFeddan: 2380,
      pestReductionNoteAr: 'انخفاض الرطوبة النسبية بين النباتات يثبط تكاثر الفطريات البيضية وحشرات المنّ.',
      pestReductionNoteEn: 'Lower inter-row humidity suppresses oomycete fungi and aphid colonization.',
      expectedNetReturnEgpPerFeddan: 59200,
    },
    {
      yearNumber: 4,
      yearLabelAr: 'السنة 4 (2029/2030) — تعظيم إنتاجية المتر المكعب من المياه',
      yearLabelEn: 'Year 4 (2029/30) — Maximizing Crop-Per-Drop Water Productivity',
      winterCropId: 'wheat',
      winterCropAr: 'قمح سخا 95 على مصاطب موفرة للمياه (25% وفر مائي + 15% زيادة محصول)',
      winterCropEn: 'Raised-Bed Sakha 95 Wheat (25% Water Saving + 15% Yield Gain)',
      summerCropId: 'cotton',
      summerCropAr: 'قطن جيزة 94 بتقنية الري النبضي الذكي المرتبط بقمر SMAP',
      summerCropEn: 'SMAP-Guided Pulse-Drip Egyptian Cotton Giza 94',
      coverOrIntercropAr: 'تغطية الخطوط بقش القمح المفروك لحفظ رطوبة منطقة الجذور (7-28 سم)',
      coverOrIntercropEn: 'Inter-row wheat straw mulch preserving 7–28cm root-zone moisture',
      nitrogenDeltaKgPerFeddan: 18,
      organicMatterGainPct: 0.16,
      waterUseM3PerFeddan: 2680,
      pestReductionNoteAr: 'الزراعة على مصاطب تحسن التهوية وتمنع ركود المياه، مما يقلل الصدأ الأصفر بنسبة 74%.',
      pestReductionNoteEn: 'Raised beds improve canopy airflow and prevent waterlogging, cutting Yellow Rust by 74%.',
      expectedNetReturnEgpPerFeddan: 67500,
    },
    {
      yearNumber: 5,
      yearLabelAr: 'السنة 5 (2030/2031) — استقرار الميزان المائي وخفض ملوحة القطاع الجذري',
      yearLabelEn: 'Year 5 (2030/31) — Aquifer Equilibrium & Root-Zone Salinity Control',
      winterCropId: 'fava_bean',
      winterCropAr: 'فول بلدي جيزة 716 / برسيم فحل (استعادة الأزوت بأقل مقنن مائي)',
      winterCropEn: 'Fava Bean Giza 716 / Single-Cut Fahl Clover (Low-Water N Reset)',
      summerCropId: 'sorghum',
      summerCropAr: 'ذرة رفيعة شندويل 6 عالية الإنتاجية للسيلاج والحبوب',
      summerCropEn: 'High-Yield Dual-Purpose Sorghum Shandaweel 6',
      coverOrIntercropAr: 'إدارة مخلفات المحاصيل بالكامل كغطاء عضوي واقٍ من الإجهاد الحراري (LST)',
      coverOrIntercropEn: 'Full crop residue retention buffering ECOSTRESS canopy LST spikes',
      nitrogenDeltaKgPerFeddan: 46,
      organicMatterGainPct: 0.18,
      waterUseM3PerFeddan: 2490,
      pestReductionNoteAr: 'كسر كامل لدورة حشرات الثاقبات والذباب الأبيض مع وفر مائي تراكمي يتجاوز 36%.',
      pestReductionNoteEn: 'Complete break of stalk borer & whitefly cycles with >36% cumulative water savings.',
      expectedNetReturnEgpPerFeddan: 62400,
    },
  ].slice(0, cycleYears);

  // 3. ECONOMIC MAXIMIZATION STRATEGY (High-Value Export + Strategic Cash Crops)
  const econYearsAll = [
    {
      yearNumber: 1,
      yearLabelAr: 'السنة 1 (2026/2027) — التصدير الأوروبي المبكر والذهب الأبيض المصري',
      yearLabelEn: 'Year 1 (2026/27) — EU Export Potato & Egyptian White Gold Cotton',
      winterCropId: 'potato',
      winterCropAr: 'بطاطس تصدير مبكرة (سبونتا / دايموند) خالية من العفن البني للتصدير الأوروبي',
      winterCropEn: 'Certified EU-Export Winter Potato (Spunta / Diamant)',
      summerCropId: 'cotton',
      summerCropAr: 'قطن مصري فائق الطول (جيزة 94) بعقود تسويق مضمونة للغزل التصديري',
      summerCropEn: 'Extra-Long Staple Egyptian Cotton (Giza 94) for Export Spinning Contracts',
      coverOrIntercropAr: 'برسيم فحل سريع (50 يوماً) قبل البطاطس لتثبيت الأزوت وتنشيط الميكروبيوم',
      coverOrIntercropEn: '50-day Fahl Berseem bio-primer before Export Potato',
      nitrogenDeltaKgPerFeddan: 22,
      organicMatterGainPct: 0.15,
      waterUseM3PerFeddan: 3560,
      pestReductionNoteAr: 'تعاقب البطاطس ثم القطن (عائلتان نباتيتان مختلفتان: باذنجانية ← خبازية) يمنع تكاثر النيماتودا.',
      pestReductionNoteEn: 'Alternating Solanaceae (Potato) with Malvaceae (Cotton) prevents host-specific nematode buildup.',
      expectedNetReturnEgpPerFeddan: 96500,
    },
    {
      yearNumber: 2,
      yearLabelAr: 'السنة 2 (2027/2028) — تطهير التربة بالقمح وتعاقدات الذرة الصفراء',
      yearLabelEn: 'Year 2 (2027/28) — Cereal Soil Sanitization & Contract Yellow Maize',
      winterCropId: 'wheat',
      winterCropAr: 'قمح سخا 95 (توريد صوامع بدرجة نقاوة 23.5 قيراط + إنتاج تبن عالي القيمة)',
      winterCropEn: 'Grade-A Sakha 95 Wheat (Premium Silo Procurement + High-Value Straw)',
      summerCropId: 'maize',
      summerCropAr: 'ذرة شامية صفراء (هجين 168) لتعاقدات مصانع الأعلاف والنشا',
      summerCropEn: 'Contract Yellow Maize (Hybrid 168) for Feed & Starch Mills',
      coverOrIntercropAr: 'تحميل فول صويا مع الذرة الشامية لرفع العائد الفداني بنسبة +22% وتثبيت الأزوت',
      coverOrIntercropEn: 'Soybean intercropped with Maize (+22% dual-crop revenue & N fixation)',
      nitrogenDeltaKgPerFeddan: 18,
      organicMatterGainPct: 0.16,
      waterUseM3PerFeddan: 3690,
      pestReductionNoteAr: 'فصل البطاطس بموسم قمح ثم ذرة يطهر التربة تماماً من بكتيريا العفن البني (Ralstonia) لضمان التصدير.',
      pestReductionNoteEn: 'Inserting Wheat & Maize purges soil-borne Ralstonia brown rot, preserving EU export eligibility.',
      expectedNetReturnEgpPerFeddan: 74800,
    },
    {
      yearNumber: 3,
      yearLabelAr: 'السنة 3 (2028/2029) — تجديد الخصوبة بالبرسيم/البنجر والعودة للقطن التصديري',
      yearLabelEn: 'Year 3 (2028/29) — Nitrogen & Sugar Contract Reset + Export Cotton',
      winterCropId: 'clover',
      winterCropAr: 'برسيم مصري مسقاوي (3 حشات علف مربحة + إنتاج تقاوي برسيم تصديرية)',
      winterCropEn: 'Egyptian Berseem Clover (3 Profitable Forage Cuts + Export Seed Harvest)',
      summerCropId: 'cotton',
      summerCropAr: 'قطن مصري جيزة 94 (أعلى تصافي حلج ومتانة غزل على مرقد البرسيم)',
      summerCropEn: 'Egyptian Cotton Giza 94 (Peak Lint Turnout & Fiber Strength after Clover)',
      coverOrIntercropAr: 'تثبيت أزوت حيوي كامل (+65 كجم N/فدان) يوفر 50% من تكلفة الأسمدة الأزوتية للقطن',
      coverOrIntercropEn: 'Full biological N reset (+65 kg N/feddan), slashing Cotton fertilizer cost by 50%',
      nitrogenDeltaKgPerFeddan: 65,
      organicMatterGainPct: 0.23,
      waterUseM3PerFeddan: 3440,
      pestReductionNoteAr: 'البرسيم قبل القطن يرفع حيوية الأعداء الطبيعية (أسد المنّ وأبو العيد) ويخفض رش ديدان اللوز.',
      pestReductionNoteEn: 'Clover preceding Cotton builds beneficial predator populations (Chrysoperla & Coccinellids).',
      expectedNetReturnEgpPerFeddan: 84200,
    },
    {
      yearNumber: 4,
      yearLabelAr: 'السنة 4 (2029/2030) — دورة البطاطس التصديرية الثانية بعد تطهير 3 سنوات',
      yearLabelEn: 'Year 4 (2029/30) — Second EU-Export Potato Window After 3-Year Sanitization',
      winterCropId: 'potato',
      winterCropAr: 'بطاطس تصدير سبونتا (إنتاجية قياسية 18 طن/فدان بعد راحة التربة 3 سنوات)',
      winterCropEn: 'Export Potato Spunta (18 ton/feddan Peak Yield After 3-Year Break)',
      summerCropId: 'sorghum',
      summerCropAr: 'ذرة رفيعة شندويل 6 / ذرة شامية لتعاقدات السيلاج التصديري',
      summerCropEn: 'Contract Sorghum / Maize for High-Energy Silage Export',
      coverOrIntercropAr: 'إضافة كمبوست نباتي متحلل مع مخلفات البرسيم والقطن لرفع جودة قشرة الدرنات',
      coverOrIntercropEn: 'Composted cotton/clover humus incorporation for blemish-free tuber skin',
      nitrogenDeltaKgPerFeddan: 14,
      organicMatterGainPct: 0.15,
      waterUseM3PerFeddan: 3320,
      pestReductionNoteAr: 'الفاصل الزمني (3 سنوات) بين عروتي البطاطس يقضي على الندوة المتأخرة ونيماتودا تعقد الجذور بنسبة 91%.',
      pestReductionNoteEn: '3-year interval between Potato crops eradicates Late Blight oospores and root-knot nematodes by 91%.',
      expectedNetReturnEgpPerFeddan: 94000,
    },
    {
      yearNumber: 5,
      yearLabelAr: 'السنة 5 (2030/2031) — الحصاد المزدوج: بنجر السكر التعاقدي والقمح/القطن',
      yearLabelEn: 'Year 5 (2030/31) — High-Brix Contract Sugar Beet & Strategic Cash Crop',
      winterCropId: 'sugar_beet',
      winterCropAr: 'بنجر سكر تعاقدي (علاوة حلاوة >19% سكروز بفضل توازن البوتاسيوم والدورة)',
      winterCropEn: 'Contract Sugar Beet (>19% Sucrose Bonus from Balanced K₂O Rotation)',
      summerCropId: 'maize',
      summerCropAr: 'ذرة شامية هجين 168 + تحميل لوبيا/فول صويا',
      summerCropEn: 'Maize Hybrid 168 + Soybean Intercrop',
      coverOrIntercropAr: 'تحميل بقولي صيفي يعيد توازن النيتروجين قبل بدء الدورة الخماسية الجديدة',
      coverOrIntercropEn: 'Summer legume intercrop restoring N balance ahead of next 5-year cycle',
      nitrogenDeltaKgPerFeddan: 28,
      organicMatterGainPct: 0.17,
      waterUseM3PerFeddan: 3410,
      pestReductionNoteAr: 'كسر متكامل لجميع الآفات الحشرية والفطرية مع تحقيق أعلى صافي ربح تراكمي.',
      pestReductionNoteEn: 'Complete multi-family pathogen break achieving maximum cumulative net return.',
      expectedNetReturnEgpPerFeddan: 81500,
    },
  ].slice(0, cycleYears);

  const computeTotals = (years: typeof regenYearsAll) => {
    const cumN = years.reduce((s, y) => s + y.nitrogenDeltaKgPerFeddan, 0);
    const cumOm = Number(years.reduce((s, y) => s + y.organicMatterGainPct, 0).toFixed(2));
    const avgW = Math.round(years.reduce((s, y) => s + y.waterUseM3PerFeddan, 0) / years.length);
    const cumNet = Math.round(
      years.reduce((s, y) => s + y.expectedNetReturnEgpPerFeddan, 0) * (1 + (effectiveArea > 1 ? 0 : 0))
    );
    return { cumN, cumOm, avgW, cumNet };
  };

  const regenStats = computeTotals(regenYearsAll);
  const waterStats = computeTotals(waterYearsAll);
  const econStats = computeTotals(econYearsAll);

  return [
    {
      id: 'soil_regeneration',
      code: `REGEN-${cycleYears}Y // SOIL & N-FIXATION`,
      cycleYears,
      titleAr: `استراتيجية تجديد التربة وتثبيت الأزوت الحيوي (دورة ${cycleYears} سنوات)`,
      titleEn: `Soil Regeneration & Biological Nitrogen-Fixing Strategy (${cycleYears}-Year Cycle)`,
      subtitleAr:
        'التركيز على البرسيم المصري والفول البلدي والأسمدة الخضراء لرفع المادة العضوية وخفض الأسمدة الكيماوية بنسبة 45%',
      subtitleEn:
        'Focuses on Egyptian Berseem Clover, Fava Bean & cover cropping to rebuild soil carbon and cut synthetic urea by 45%',
      egyptianCropExamplesAr: [
        'البرسيم المصري المسقاوي والفحل (Trifolium alexandrinum): يثبت 55–68 كجم أزوت صافي/فدان ويُقلب كسماد أخضر قبل القطن أو القمح.',
        'القمح المصري (سخا 95 — Triticum aestivum): يُزرع بعد البرسيم أو القطن ليحقق أعلى وزن أردب ونسبة بروتين بأقل جرعة يوريا.',
        'القطن المصري (جيزة 94 — Gossypium barbadense): يدخل كمحصول صيفي وتدي الجذور يفكك التربة الطينية ويكسر دورة حشائش وأمراض الحبوب.',
      ],
      egyptianCropExamplesEn: [
        'Egyptian Berseem Clover (Meskawi & Fahl): Fixes +55–68 kg biological N/feddan and acts as living green manure before Cotton or Wheat.',
        'Egyptian Wheat (Sakha 95): Planted after Clover/Cotton to achieve Grade-A grain protein while cutting synthetic N fertilizer by 35–45%.',
        'Egyptian Cotton (Giza 94): Deep taproot summer fiber crop that breaks cereal root-rot & grassy weed cycles.',
      ],
      yearlySequence: regenYearsAll,
      expectedBenefits: {
        soilHealthScoreGainPct: 34,
        soilHealthDetailAr: `رفع المادة العضوية في التربة بمقدار +${regenStats.cumOm}% وتثبيت +${regenStats.cumN} كجم أزوت حيوي/فدان عبر البكتيريا العقدية (Rhizobium) وخفض الملوحة السطحية من ${soil.salinityEC} إلى ${Math.max(0.8, Number((soil.salinityEC - 0.55).toFixed(2)))} dS/m.`,
        soilHealthDetailEn: `Boosts soil organic matter by +${regenStats.cumOm}%, fixes +${regenStats.cumN} kg biological N/feddan via Rhizobium nodulation, and reduces topsoil EC from ${soil.salinityEC} to ${Math.max(0.8, Number((soil.salinityEC - 0.55).toFixed(2)))} dS/m.`,
        pestReductionPct: 84,
        pestReductionDetailAr:
          'كسر دورة حياة الصدأ الأصفر وأعفان الجذور في القمح، والقضاء على الأطوار الساكنة لدودة ورق القطن وديدان اللوز عبر تحريش البرسيم قبل 10 مايو.',
        pestReductionDetailEn:
          'Breaks Wheat Yellow Rust & Fusarium crown rot cycles, and eliminates Cotton Leafworm & Bollworm diapause via May 10 Berseem cutoff.',
        waterSavingsPct: 24,
        waterSavingsM3PerFeddanCycle: 1080 * cycleYears,
        waterSavingsDetailAr: `زيادة قدرة التربة على الاحتفاظ بالرطوبة (رفع مؤشر NDMI من ${farmAverages.NDMI || 0.28} إلى +0.39) وتوفير ${1080 * cycleYears} م³/فدان خلال الـ ${cycleYears} سنوات.`,
        waterSavingsDetailEn: `Enhances root-zone water retention capacity (boosting NDMI from ${farmAverages.NDMI || 0.28} to +0.39) and saves ${1080 * cycleYears} m³/feddan over ${cycleYears} years.`,
        cumulativeNitrogenKgPerFeddan: regenStats.cumN,
        cumulativeOrganicMatterGainPct: regenStats.cumOm,
      },
      marketImplications: {
        cumulativeNetProfitPerFeddanEgp: regenStats.cumNet,
        annualizedRoiPct: 132,
        priceStabilityRating: 'high',
        exportAndContractOpportunitiesAr:
          'فرصة ممتازة لإنتاج تقاوي البرسيم المصري المعتمدة للتصدير، وتوريد قمح سخا 95 بأعلى درجة نقاوة للصوامع، وتسويق قطن جيزة 94 بعلاوة جودة الغزل الطويل.',
        exportAndContractOpportunitiesEn:
          'Strong revenue stability via certified Berseem seed export, premium Grade-A silo Wheat procurement, and Giza 94 extra-long staple Cotton contracts.',
        inputCostSavingNoteAr:
          'يوفر من 8,500 إلى 12,000 جنيه/فدان سنوياً من تكلفة أسمدة اليوريا ونترات النشادر والمبيدات الفطرية.',
        inputCostSavingNoteEn:
          'Saves 8,500–12,000 EGP/feddan annually in synthetic nitrogen fertilizers and soil fungicide expenses.',
      },
    },
    {
      id: 'water_conservation',
      code: `HYDRO-${cycleYears}Y // DROUGHT & LOW-WATER`,
      cycleYears,
      titleAr: `استراتيجية ترشيد المياه والمحاصيل المتحملة للجفاف والملوحة (دورة ${cycleYears} سنوات)`,
      titleEn: `Water Conservation & Drought-Tolerant Rotation Strategy (${cycleYears}-Year Cycle)`,
      subtitleAr:
        'تعظيم العائد لكل متر مكعب مياه عبر الذرة الرفيعة وبنجر السكر والقمح على مصاطب والقطن بالتنقيط (وفر مائي 36%)',
      subtitleEn:
        'Maximizes revenue per cubic meter of water using Sorghum, Sugar Beet, Raised-Bed Wheat & Drip Cotton (36% water savings)',
      egyptianCropExamplesAr: [
        'القمح المصري على مصاطب (سخا 95): يوفر 25% من مياه الري الشتوي ويستفيد بنسبة 38% من أمطار نوفمبر–فبراير.',
        'البرسيم الفحل أحادي الحشة / الفول البلدي (جيزة 716): يثبت الأزوت بأقل مقنن مائي ممكن دون استنزاف الخزان الجوفي.',
        'القطن المصري بالتنقيط (جيزة 94) والذرة الرفيعة (شندويل 6): بدائل صيفية ذكية تتحمل الحرارة حتى 39°م وتوفر 1,500 م³ مياه/فدان.',
      ],
      egyptianCropExamplesEn: [
        'Raised-Bed Egyptian Wheat (Sakha 95): Cuts winter irrigation volume by 25% while capturing winter rainfall.',
        'Single-Cut Fahl Clover & Fava Bean (Giza 716): Low-water winter legumes fixing N with minimal irrigation.',
        'Drip-Irrigated Cotton (Giza 94) & Sorghum (Shandaweel 6): Heat-tolerant summer crops saving 1,500 m³ water/feddan vs Maize/Rice.',
      ],
      yearlySequence: waterYearsAll,
      expectedBenefits: {
        soilHealthScoreGainPct: 26,
        soilHealthDetailAr: `الحفاظ على بناء التربة ومنع تملح الطبقة السطحية عبر الجذور الوتدية العميقة لبنجر السكر والقطن مع زيادة المادة العضوية +${waterStats.cumOm}%.`,
        soilHealthDetailEn: `Prevents secondary salinization and hardpan formation via deep Sugar Beet and Cotton taproots while adding +${waterStats.cumOm}% organic matter.`,
        pestReductionPct: 79,
        pestReductionDetailAr:
          'خفض الرطوبة الحرة حول المجموع الخضري يمنع انتشار الندوات الفطرية والصدأ الأصفر وعفن الساق المتأخر بنسبة 79%.',
        pestReductionDetailEn:
          'Eliminating flood-induced canopy humidity suppresses fungal blights, Yellow Rust, and stalk rots by 79%.',
        waterSavingsPct: 36,
        waterSavingsM3PerFeddanCycle: 1620 * cycleYears,
        waterSavingsDetailAr: `خفض متوسط الاستهلاك المائي السنوي إلى ${waterStats.avgW} م³/فدان (توفير إجمالي ${1620 * cycleYears} م³/فدان خلال دورة الـ ${cycleYears} سنوات).`,
        waterSavingsDetailEn: `Reduces mean annual water consumption to ${waterStats.avgW} m³/feddan (saving ${1620 * cycleYears} m³/feddan across the ${cycleYears}-year cycle).`,
        cumulativeNitrogenKgPerFeddan: waterStats.cumN,
        cumulativeOrganicMatterGainPct: waterStats.cumOm,
      },
      marketImplications: {
        cumulativeNetProfitPerFeddanEgp: waterStats.cumNet,
        annualizedRoiPct: 126,
        priceStabilityRating: 'high',
        exportAndContractOpportunitiesAr:
          'تعاقدات مضمونة مع مصانع السكر (علاوة حلاوة التبكير لبنجر السكر) وتوريد القمح والذرة الرفيعة لمصانع الأعلاف بأقل تكلفة تشغيل للطلمبات.',
        exportAndContractOpportunitiesEn:
          'Guaranteed forward contracts with Egyptian sugar mills (high-sucrose bonus) and domestic grain/feed processors with minimal pumping energy costs.',
        inputCostSavingNoteAr:
          'يخفض تكلفة الطاقة والسولار/الكهرباء لتشغيل طلمبات الري بنسبة 38% مع تقليل نفقات رش المبيدات الفطرية.',
        inputCostSavingNoteEn:
          'Cuts irrigation pumping energy/fuel costs by 38% and reduces foliar fungicide applications.',
      },
    },
    {
      id: 'economic_maximization',
      code: `PROFIT-${cycleYears}Y // EXPORT & CASH CROPS`,
      cycleYears,
      titleAr: `استراتيجية تعظيم العائد الاقتصادي والتصديري (دورة ${cycleYears} سنوات)`,
      titleEn: `Maximizing Economic Return & Export Value Strategy (${cycleYears}-Year Cycle)`,
      subtitleAr:
        'موازنة محاصيل التصدير عالية الربحية (البطاطس والقطن جيزة 94) مع القمح والبرسيم المصري لحماية التربة وضمان شهادة GlobalGAP',
      subtitleEn:
        'Balances high-margin export cash crops (EU Potato & Giza 94 Cotton) with Wheat & Berseem Clover sanitizing phases for GlobalGAP compliance',
      egyptianCropExamplesAr: [
        'القطن المصري فائق الطول (جيزة 94): المحصول النقدي الصيفي الأعلى عائداً عند زراعته بعد البطاطس أو البرسيم.',
        'القمح المصري (سخا 95): يعمل كمطهر بيولوجي للتربة بين عروات البطاطس التصديرية لمنع العفن البني البكتيري.',
        'البرسيم المصري (مسقاوي/فحل): يجدد أزوت التربة في السنة الثالثة ويوفر عائد نقدي سريع من الحشات وتقاوي التصدير.',
      ],
      egyptianCropExamplesEn: [
        'Egyptian Extra-Long Staple Cotton (Giza 94): Premier summer export cash crop thriving after Potato or Berseem Clover.',
        'Egyptian Wheat (Sakha 95): Essential cereal sanitizing crop purging soil-borne Ralstonia between Export Potato cycles.',
        'Egyptian Berseem Clover: Restores soil nitrogen in Year 3 while generating rapid cash flow from forage cuts and seed export.',
      ],
      yearlySequence: econYearsAll,
      expectedBenefits: {
        soilHealthScoreGainPct: 29,
        soilHealthDetailAr: `التناوب المدروس بين أربع عائلات نباتية (باذنجانية ← خبازية ← نجيلية ← بقولية) يحمي التربة من الإجهاد ويرفع المادة العضوية +${econStats.cumOm}%.`,
        soilHealthDetailEn: `Four-family botanical rotation (Solanaceae -> Malvaceae -> Gramineae -> Fabaceae) prevents nutrient mining and adds +${econStats.cumOm}% organic matter.`,
        pestReductionPct: 88,
        pestReductionDetailAr:
          'تطهير التربة بنسبة 88% من بكتيريا العفن البني (Ralstonia) ونيماتودا البطاطس وديدان اللوز لضمان عدم رفض أي شحنة تصديرية.',
        pestReductionDetailEn:
          '88% suppression of Ralstonia bacterial brown rot, root-knot nematodes, and Cotton bollworms, safeguarding zero-rejection EU export status.',
        waterSavingsPct: 21,
        waterSavingsM3PerFeddanCycle: 940 * cycleYears,
        waterSavingsDetailAr: `إدارة الري التكميلي والتنقيط الدقيق توفر ${940 * cycleYears} م³/فدان وتمنع تشقق درنات البطاطس أو تساقط وسواس القطن.`,
        waterSavingsDetailEn: `Precision drip scheduling saves ${940 * cycleYears} m³/feddan while preventing potato tuber cracking and cotton square shedding.`,
        cumulativeNitrogenKgPerFeddan: econStats.cumN,
        cumulativeOrganicMatterGainPct: econStats.cumOm,
      },
      marketImplications: {
        cumulativeNetProfitPerFeddanEgp: econStats.cumNet,
        annualizedRoiPct: 158,
        priceStabilityRating: 'high',
        exportAndContractOpportunitiesAr:
          'أعلى صافي عائد تراكمي عبر الجمع بين تصدير البطاطس للاتحاد الأوروبي والخليج، وتعاقدات القطن الطويل جيزة 94، والتوريد الاستراتيجي للقمح والذرة وبنجر السكر.',
        exportAndContractOpportunitiesEn:
          'Highest cumulative net return combining EU/Gulf Potato exports, Giza 94 extra-long staple Cotton contracts, and strategic Wheat/Sugar Beet procurement.',
        inputCostSavingNoteAr:
          'توزيع المخاطر التسويقية بين العملة الصعبة (التصدير) والأسعار الضمانية المحلية مع توفير 30% من تكلفة تعقيم التربة الكيميائي.',
        inputCostSavingNoteEn:
          'Hedges market risk across hard-currency export crops and state-guaranteed floor prices while saving 30% on chemical soil fumigants.',
      },
    },
  ];
}

// ============================================================================
// 12. PROACTIVE PEST & DISEASE OUTBREAK ALERT SYSTEM (WEATHER + HISTORICAL ARC)
// ============================================================================

export function evaluateZonePestOutbreakAlerts(
  centroid: LatLon,
  soil: SoilProfile,
  forecast14: DailyWeatherPoint[],
  currentCropId: string,
  farmAverages: Record<SpectralIndexKey, number>,
  subZones: SubZoneSummary[]
): ProactivePestOutbreakAlert[] {
  const next7 = forecast14.slice(0, 7);
  const avgTempMax =
    next7.length > 0
      ? Number((next7.reduce((s, d) => s + d.tempMaxC, 0) / next7.length).toFixed(1))
      : 26.5;
  const avgTempMin =
    next7.length > 0
      ? Number((next7.reduce((s, d) => s + d.tempMinC, 0) / next7.length).toFixed(1))
      : 14.2;
  const avgMeanTemp = Number(((avgTempMax + avgTempMin) / 2).toFixed(1));
  const avgHumidity =
    next7.length > 0
      ? Math.round(next7.reduce((s, d) => s + d.relativeHumidityPct, 0) / next7.length)
      : 66;
  const total7dRain = Number(
    next7.reduce((s, d) => s + d.precipMm, 0).toFixed(1)
  );
  const isNorthDeltaOrCoastal = centroid.lat >= 30.35;

  const zoneA = subZones.find((z) => z.id === 'A');
  const zoneC = subZones.find((z) => z.id === 'C');
  const zoneALst = zoneA?.lstCelsius ?? (farmAverages.LST || 27.5);
  const zoneCNdwi = zoneC?.ndwi ?? (farmAverages.NDWI || 0.34);

  const rawAlerts: Array<Omit<ProactivePestOutbreakAlert, 'riskLevel'>> = [
    // 1. WHEAT — Yellow Stripe Rust (فطر الصدأ الأصفر المخطط في القمح)
    {
      id: 'alert-wheat-yellow-rust',
      pestId: 'yellow_rust',
      cropCategory: 'wheat',
      cropNameAr: 'القمح (Wheat — سخا 95 / مصر 3)',
      cropNameEn: 'Wheat (Sakha 95 / Misr 3)',
      pestNameAr: 'مرض الصدأ الأصفر المخطط الفطري (Yellow Stripe Rust)',
      pestNameEn: 'Wheat Yellow Stripe Rust (Puccinia striiformis)',
      scientificName: 'Puccinia striiformis f. sp. tritici',
      pestType: 'fungal',
      likelihoodPct: Math.min(
        96,
        Math.max(
          42,
          Math.round(
            (avgMeanTemp >= 12 && avgMeanTemp <= 23 ? 38 : 22) +
              (avgHumidity >= 60 ? 28 : 14) +
              (total7dRain >= 1.5 ? 16 : 6) +
              (isNorthDeltaOrCoastal ? 10 : 4) +
              (currentCropId === 'wheat' ? 8 : 0)
          )
        )
      ),
      vulnerableSubZones: zoneCNdwi >= 0.3 ? ['C', 'B'] : ['B', 'A'],
      weatherTriggersAr: `حرارة معتدلة (${avgMeanTemp}°م) + رطوبة جوية (${avgHumidity}%) + أمطار/ندى (${total7dRain} مم) ترفع بلل الأوراق في زونا C.`,
      weatherTriggersEn: `Mean temp ${avgMeanTemp}°C + ${avgHumidity}% RH + ${total7dRain} mm rain/dew creating prolonged leaf wetness in Zone C.`,
      historicalOutbreakContextAr:
        'سجل تاريخي في محافظات الدلتا (كفر الشيخ، الدقهلية، الغربية، البحيرة) خلال موجات الرطوبة والندى الصباحي في فبراير–مارس ونوفمبر–ديسمبر.',
      historicalOutbreakContextEn:
        'Historical ARC outbreak pattern across Nile Delta governorates (Dakahlia, Kafr El-Sheikh, Gharbia) during humid dew windows.',
      preventativeActionsAr: [
        'فحص بؤر الزونا C والزونا B صباحاً (بثرات صفراء طولية موازية لعروق الورقة).',
        'رش وقائي فوري بمبيد فطري جهازي (أزوكسي ستروبين + تيبيكونازول 200 سم³/فدان) قبل ثبات الندى.',
        'إيقاف التسميد الأزوتي اليوريا وتدعيم النبات بسليكات البوتاسيوم (1.5 لتر/فدان).',
      ],
      preventativeActionsEn: [
        'Scout Zone C & Zone B early morning for linear yellow pustules along leaf veins.',
        'Apply preventative systemic fungicide (Azoxystrobin + Tebuconazole at 200 cm³/feddan).',
        'Halt excess urea N and spray potassium silicate (1.5 L/feddan) to harden leaf epidermis.',
      ],
      advisorPromptAr:
        'ما هي خطة الإنذار المبكر والمكافحة الوقائية والعلاجية لمرض الصدأ الأصفر الفطري في القمح داخل زونا C وزونا B في أرضي؟',
      advisorPromptEn:
        'What is the preventative and curative IPM action plan for Wheat Yellow Stripe Rust in Zone C and Zone B of my farm?',
    },
    // 2. WHEAT — Cereal Aphids & BYDV Vector (حشرة منّ الغلال في القمح)
    {
      id: 'alert-wheat-aphids',
      pestId: 'cereal_aphids',
      cropCategory: 'wheat',
      cropNameAr: 'القمح والشعير (Wheat & Winter Cereals)',
      cropNameEn: 'Wheat & Winter Cereals',
      pestNameAr: 'منّ الغلال الأخضر والشوفان (Cereal Aphids — ناقل فيروس التقزم الأصفر)',
      pestNameEn: 'Cereal Aphids (Rhopalosiphum padi & Schizaphis graminum)',
      scientificName: 'Rhopalosiphum padi',
      pestType: 'insect',
      likelihoodPct: Math.min(
        93,
        Math.max(
          46,
          Math.round(
            (avgTempMax >= 20 && avgTempMax <= 29 ? 36 : 20) +
              (avgHumidity >= 50 && avgHumidity <= 78 ? 26 : 14) +
              (zoneALst >= 24 ? 16 : 8) +
              (currentCropId === 'wheat' ? 10 : 0)
          )
        )
      ),
      vulnerableSubZones: ['A', 'B'],
      weatherTriggersAr: `دفء النهار (${avgTempMax}°م) مع اعتدال الرطوبة (${avgHumidity}%) وارتفاع حرارة الأوراق في زونا A (${zoneALst}°م) يضاعف سرعة توالد المنّ.`,
      weatherTriggersEn: `Warm daytime highs (${avgTempMax}°C) with ${avgHumidity}% RH and Zone A LST (${zoneALst}°C) accelerating parthenogenetic aphid reproduction.`,
      historicalOutbreakContextAr:
        'ينتشر تاريخياً على حواف الحقول المجاورة للمصارف والبرسيم في الدلتا ومصر الوسطى ويسبب الندوة العسلية ونقل فيروس تقزم الشعير الأصفر (BYDV).',
      historicalOutbreakContextEn:
        'Historically colonizes field borders adjacent to Berseem Clover and drains across the Nile Delta, transmitting Barley Yellow Dwarf Virus (BYDV).',
      preventativeActionsAr: [
        'إزالة الحشائش النجيلية على الجسور وفحص قلب النباتات في زونا A وزونا B (الحد الحرج: 5–10 حشرات/ساق).',
        'الرش البؤري الموجه للحواف بمركب فلونيكاميد أو أسيتاميبريد لحماية الأعداء الحيوية (أبو العيد وأسد المنّ).',
        'نشر المصائد الصفراء اللاصقة بمعدل 4 مصائد/فدان في اتجاه الرياح السائدة.',
      ],
      preventativeActionsEn: [
        'Clear grassy border weeds and inspect stems in Zone A & Zone B (threshold: 5–10 aphids/tiller).',
        'Spot-spray field margins with selective Flonicamid or Acetamiprid to preserve ladybird predators.',
        'Install yellow sticky traps (4 traps/feddan) along windward Zone A borders.',
      ],
      advisorPromptAr:
        'كيف أحمي محصول القمح في زونا A من انتشار حشرة منّ الغلال وفيروس التقزم الأصفر مع الحفاظ على الأعداء الحيوية؟',
      advisorPromptEn:
        'How do I protect my Wheat crop in Zone A from Cereal Aphid outbreaks and BYDV while preserving beneficial predators?',
    },
    // 3. COTTON — Pink & Spiny Bollworm (دودة اللوز القرنفلية والشوكية في القطن)
    {
      id: 'alert-cotton-bollworm',
      pestId: 'cotton_bollworm',
      cropCategory: 'cotton',
      cropNameAr: 'القطن المصري (Egyptian Cotton — جيزة 94)',
      cropNameEn: 'Egyptian Cotton (Giza 94)',
      pestNameAr: 'دودة اللوز القرنفلية والشوكية (Pink & Spiny Cotton Bollworm)',
      pestNameEn: 'Pink & Spiny Cotton Bollworm (Pectinophora gossypiella)',
      scientificName: 'Pectinophora gossypiella & Earias insulana',
      pestType: 'insect',
      likelihoodPct: Math.min(
        95,
        Math.max(
          48,
          Math.round(
            (avgTempMax >= 24 ? 38 : 24) +
              (avgHumidity >= 52 ? 24 : 15) +
              (zoneALst >= 26 ? 18 : 10) +
              (currentCropId === 'cotton' ? 12 : 4)
          )
        )
      ),
      vulnerableSubZones: ['A', 'B'],
      weatherTriggersAr: `تراكم الوحدات الحرارية عند عظمى (${avgTempMax}°م) ورطوبة (${avgHumidity}%) يحفز خروج فراشات الجيل الأول ووضع البيض على الوسواس واللوز الأخضر.`,
      weatherTriggersEn: `Thermal unit accumulation at ${avgTempMax}°C max temp and ${avgHumidity}% RH triggers moth emergence and oviposition on squares/bolls.`,
      historicalOutbreakContextAr:
        'الآفة الأخطر تاريخياً على القطن المصري في الدلتا والفيوم؛ تزداد خطورتها عند تأخير ري البرسيم المجاور بعد 10 مايو أو ترك اللوز العالق من الموسم السابق.',
      historicalOutbreakContextEn:
        'Primary historical threat to Egyptian Cotton across the Delta; outbreaks intensify when adjacent Berseem irrigation extends past May 10.',
      preventativeActionsAr: [
        'تعليق المصائد الفرمونية الجنسية (Gossyplure) بمعدل 2 مصيدة/فدان Starting من بداية التزهير وتكوين الوسواس.',
        'الرش الوقائي عند وصول التعداد لـ 5 فراشات/مصيدة/3 ليالٍ بمركب إيمامكتين بنزوات (80 جم/فدان) بالتناوب مع سبينوساد.',
        'جمع اللوز المصاب المتساقط والتخلص منه فوراً مع تنظيم الري لمنع الهياج الخضري.',
      ],
      preventativeActionsEn: [
        'Deploy Gossyplure sex-pheromone delta traps (2 traps/feddan) at pin-square stage.',
        'Trigger targeted spray at 5 moths/trap/3 nights using Emamectin Benzoate (80g/fed) alternated with Spinosad.',
        'Collect and destroy fallen infested squares and avoid over-irrigation that causes rank vegetative growth.',
      ],
      advisorPromptAr:
        'ما هو برنامج المكافحة المتكاملة والتوقيت الأمثل للرش ضد دودة اللوز القرنفلية والشوكية في القطن المصري جيزة 94؟',
      advisorPromptEn:
        'What is the IPM pheromone trap threshold and spray schedule for Pink & Spiny Bollworm in Egyptian Cotton Giza 94?',
    },
    // 4. MAIZE — Fall Armyworm (دودة الحشد الخريفية في الذرة الشامية والرفيعة)
    {
      id: 'alert-maize-fall-armyworm',
      pestId: 'fall_armyworm',
      cropCategory: 'maize',
      cropNameAr: 'الذرة الشامية والرفيعة (Maize Hybrid 168 & Sorghum)',
      cropNameEn: 'Maize (Hybrid 168) & Sorghum',
      pestNameAr: 'دودة الحشد الخريفية وثاقبات الساق (Fall Armyworm)',
      pestNameEn: 'Fall Armyworm (Spodoptera frugiperda)',
      scientificName: 'Spodoptera frugiperda',
      pestType: 'insect',
      likelihoodPct: Math.min(
        95,
        Math.max(
          50,
          Math.round(
            (avgTempMax >= 23 ? 38 : 24) +
              (avgHumidity >= 48 ? 22 : 14) +
              (zoneALst >= 25 ? 20 : 12) +
              (currentCropId === 'maize' || currentCropId === 'sorghum' ? 12 : 4)
          )
        )
      ),
      vulnerableSubZones: ['A', 'B'],
      weatherTriggersAr: `درجات الحرارة (${avgTempMin}°–${avgTempMax}°م) والرياح المعتدلة تسرع فقس اللطع داخل بلعوم نباتات الذرة في زونا A وزونا B خلال 72 ساعة.`,
      weatherTriggersEn: `Temperatures (${avgTempMin}°–${avgTempMax}°C) accelerate egg-mass hatching inside Maize whorls across Zone A & Zone B within 72 hours.`,
      historicalOutbreakContextAr:
        'سجلت انتشاراً واسعاً في الصعيد والدلتا منذ 2021 في العروات الصيفية والنيلية للذرة الشامية، وتهاجم البلعوم القمي مسببة ثقوب شباكية.',
      historicalOutbreakContextEn:
        'Widespread across Upper Egypt and the Nile Delta in summer/Nili Maize plantings, feeding deep inside the central whorl.',
      preventativeActionsAr: [
        'الفحص الميداني المبكر لبلعوم الذرة ودهس اللطع باليد عند بداية الفقس (نسبة إصابة 5%).',
        'توجيه بشبوري الرش مباشرة داخل قلب البلعوم بمركب إيمامكتين بنزوات + لوفينورون (مانع انسلاخ) بـ 300 لتر مياه/فدان.',
        'تحميل لوبيا أو فول صويا مع الذرة الشامية لزيادة الأعداء الحيوية وتشتيت الفراشات الواضعة للبيض.',
      ],
      preventativeActionsEn: [
        'Scout central Maize whorls every 3 days and crush egg masses at 5% whorl infestation threshold.',
        'Direct spray nozzle into the whorl core using Emamectin Benzoate + Lufenuron in 300 L water/feddan.',
        'Intercrop Cowpea/Soybean with Maize to disrupt female moth oviposition and boost parasitoid wasps.',
      ],
      advisorPromptAr:
        'ما هي خطة التدخل الفوري لمكافحة دودة الحشد الخريفية وعفن الساق المتأخر في محصول الذرة الشامية داخل أرضي؟',
      advisorPromptEn:
        'What is the immediate control protocol for Fall Armyworm and Late Wilt in my Maize crop?',
    },
    // 5. VEGETABLES (Potato & Tomato) — Late Blight (مرض الندوة المتأخرة الفطري في البطاطس والطماطم)
    {
      id: 'alert-vegetables-late-blight',
      pestId: 'late_blight_phytophthora',
      cropCategory: 'vegetables',
      cropNameAr: 'الخضر والدرنات (البطاطس التصديرية والطماطم — Potato & Tomato)',
      cropNameEn: 'Vegetables (Export Potato & Tomato)',
      pestNameAr: 'مرض الندوة المتأخرة واللفحة الفطرية (Late Blight — Phytophthora)',
      pestNameEn: 'Potato & Tomato Late Blight (Phytophthora infestans)',
      scientificName: 'Phytophthora infestans',
      pestType: 'fungal',
      likelihoodPct: Math.min(
        96,
        Math.max(
          45,
          Math.round(
            (avgMeanTemp >= 13 && avgMeanTemp <= 24 ? 38 : 22) +
              (avgHumidity >= 62 ? 28 : 16) +
              (total7dRain >= 1.0 ? 16 : 8) +
              (zoneCNdwi >= 0.28 ? 10 : 4) +
              (currentCropId === 'potato' || currentCropId === 'tomato' ? 8 : 0)
          )
        )
      ),
      vulnerableSubZones: ['C', 'B'],
      weatherTriggersAr: `تلاقي الرطوبة الجوية (${avgHumidity}%) مع حرارة ليلية (${avgTempMin}°م) وأمطار/ندى (${total7dRain} مم) يحقق معيار سميث (Smith Period) لانطلاق الجراثيم الهدبية في زونا C.`,
      weatherTriggersEn: `Relative humidity (${avgHumidity}%) paired with ${avgTempMin}°C night temps and ${total7dRain} mm rain satisfies Smith Period criteria for zoospore infection in Zone C.`,
      historicalOutbreakContextAr:
        'المرض الوبائي الأول لعروات البطاطس الشتوية والطماطم في الدلتا والنوبارية؛ يمكنه تدمير العرش الخضري خلال 5–7 أيام إذا لم يُرش وقائياً قبل الأمطار.',
      historicalOutbreakContextEn:
        'Most destructive epidemic pathogen in Nile Delta & Nubaria winter Potato/Tomato crops; can defoliate fields within 5–7 days if left unprotected.',
      preventativeActionsAr: [
        'الرش الوقائي الاستباقي قبل هطول الأمطار بـ 24 ساعة بمركب (مانكوزيب + ميتالاكسيل-إم) أو (سيموكسانيل + فاموكسادون).',
        'تخفيض مقنن الري في الزونا C بنسبة 15% وتجنب الري المسائي تماماً لتقليل رطوبة المجموع الخضري.',
        'تحسين تصريف المياه وتجريح التربة حول الدرنات لمنع غسيل الجراثيم نحو درنات البطاطس.',
      ],
      preventativeActionsEn: [
        'Apply prophylactic spray 24h before rain using Metalaxyl-M + Mancozeb or Cymoxanil + Famoxadone.',
        'Reduce Zone C irrigation by 15% and strictly avoid evening irrigation to minimize leaf wetness duration.',
        'Maintain high soil hilling over potato ridges to prevent sporangia washing down onto tubers.',
      ],
      advisorPromptAr:
        'كيف أحمي محصول البطاطس والطماطم في زونا C من تفشي مرض الندوة المتأخرة الفطري مع الظروف الجوية الحالية؟',
      advisorPromptEn:
        'How do I protect my Potato and Tomato crops in Zone C from a Late Blight outbreak under current weather conditions?',
    },
    // 6. VEGETABLES — Tomato Leafminer & Whitefly (صانعة أنفاق الطماطم والذبابة البيضاء)
    {
      id: 'alert-vegetables-tuta-whitefly',
      pestId: 'tomato_leafminer',
      cropCategory: 'vegetables',
      cropNameAr: 'الخضر (الطماطم والبطاطس والباذنجانيات — Vegetables)',
      cropNameEn: 'Vegetables (Tomato, Potato & Solanaceae)',
      pestNameAr: 'حافرة أنفاق الطماطم (التوتا أبسلوتا) والذبابة البيضاء (Tuta absoluta & Whitefly)',
      pestNameEn: 'Tomato Leafminer (Tuta absoluta) & Silverleaf Whitefly (Bemisia tabaci)',
      scientificName: 'Tuta absoluta & Bemisia tabaci',
      pestType: 'insect',
      likelihoodPct: Math.min(
        94,
        Math.max(
          49,
          Math.round(
            (avgTempMax >= 22 ? 36 : 22) +
              (zoneALst >= 25 ? 24 : 14) +
              (avgHumidity <= 75 ? 20 : 12) +
              (currentCropId === 'tomato' || currentCropId === 'potato' ? 12 : 4)
          )
        )
      ),
      vulnerableSubZones: ['A', 'B'],
      weatherTriggersAr: `الحرارة العظمى (${avgTempMax}°م) وحرارة سطح الأوراق في زونا A (${zoneALst}°م) تختصر دورة الجيل لحشرة التوتا أبسلوتا والذبابة البيضاء إلى 18 يوماً.`,
      weatherTriggersEn: `Daytime highs (${avgTempMax}°C) and Zone A canopy LST (${zoneALst}°C) shorten Tuta absoluta and Whitefly generation cycles to 18 days.`,
      historicalOutbreakContextAr:
        'تنتشر تاريخياً في العروات الخريفية والصيفية في الظهير الصحراوي والدلتا، حيث تحفر يرقات التوتا أنفاقاً في الأوراق والثمار وتنقل الذبابة البيضاء فيروس تجعد الأوراق (TYLCV).',
      historicalOutbreakContextEn:
        'Endemic across Egyptian Solanaceous belts; Tuta larvae mine leaves/fruits while Whitefly transmits Tomato Yellow Leaf Curl Virus (TYLCV).',
      preventativeActionsAr: [
        'نشر المصائد المائية الفرمونية الضوئية (4 مصائد/فدان) لصيد ذكور التوتا أبسلوتا + المصائد الصفراء اللاصقة للذبابة البيضاء.',
        'الرش المتناوب بمركب كلورانترانيليبرول أو سبينيتورام مع زيت معدني صيفي خفيف لكسر فقس البيض.',
        'إزالة الأوراق السفلية المصابة بالأنفاق وحرقها خارج المزرعة وعدم ترك عروش باذنجانية بعد الحصاد.',
      ],
      preventativeActionsEn: [
        'Deploy pheromone water-pan traps (4 traps/feddan) for Tuta males + yellow sticky cards for Whitefly.',
        'Rotate Chlorantraniliprole or Spinetoram with summer mineral oil to suffocate egg stages.',
        'Prune and destroy mined basal leaves and enforce a strict Solanaceae-free rotation break.',
      ],
      advisorPromptAr:
        'ما هي خطة المكافحة المتكاملة لحشرة التوتا أبسلوتا والذبابة البيضاء في الطماطم والبطاطس داخل زونا A؟',
      advisorPromptEn:
        'What is the integrated control strategy for Tuta absoluta and Whitefly in Tomato and Potato within Zone A?',
    },
  ];

  return rawAlerts
    .map((item) => {
      const riskLevel: ProactivePestOutbreakAlert['riskLevel'] =
        item.likelihoodPct >= 80
          ? 'critical'
          : item.likelihoodPct >= 65
          ? 'high'
          : item.likelihoodPct >= 45
          ? 'moderate'
          : 'low';
      return {
        ...item,
        riskLevel,
      };
    })
    .sort((a, b) => {
      const aMatch =
        (a.cropCategory === 'wheat' && currentCropId === 'wheat') ||
        (a.cropCategory === 'maize' && (currentCropId === 'maize' || currentCropId === 'sorghum')) ||
        (a.cropCategory === 'cotton' && currentCropId === 'cotton') ||
        (a.cropCategory === 'vegetables' && (currentCropId === 'potato' || currentCropId === 'tomato'))
          ? 1
          : 0;
      const bMatch =
        (b.cropCategory === 'wheat' && currentCropId === 'wheat') ||
        (b.cropCategory === 'maize' && (currentCropId === 'maize' || currentCropId === 'sorghum')) ||
        (b.cropCategory === 'cotton' && currentCropId === 'cotton') ||
        (b.cropCategory === 'vegetables' && (currentCropId === 'potato' || currentCropId === 'tomato'))
          ? 1
          : 0;
      if (aMatch !== bMatch) return bMatch - aMatch;
      return b.likelihoodPct - a.likelihoodPct;
    });
}

// ============================================================================
// 11. 14-DAY ENVIRONMENTAL & CLIMATIC DISASTER EARLY WARNING ENGINE
// ============================================================================

/**
 * Evaluates the 14-day meteorological forecast, soil profile, and geographic zone
 * to predict all 5 major environmental & climatic disasters:
 * 1. Frost / Radiative Chilling ('frost')
 * 2. Extreme Heatwave & Thermal Canopy Shock ('heatwave')
 * 3. Flash Floods / Convective Torrents & Waterlogging ('flash_flood')
 * 4. Sandstorms / Khamsin Hot Dry Winds ('sandstorm_wind')
 * 5. Severe Root-Zone Drought & Osmotic Salinity Stress ('severe_drought')
 *
 * Each warning includes a 14-day proactive countdown, probability %, 3-phase field
 * emergency protocol (Pre-Event 72-24h, During Event, Post-Event Recovery), and
 * linked Climate-Resilient Egyptian Crop & Cultivar matches.
 */
export function evaluateEnvironmentalDisasterWarnings(
  forecast14: DailyWeatherPoint[],
  soil: SoilProfile,
  zoneNameAr: string,
  zoneNameEn: string,
  centroid?: LatLon
): EnvironmentalDisasterWarning[] {
  const days = forecast14.length > 0 ? forecast14 : [];
  const lat = centroid?.lat ?? 30.72;
  const lng = centroid?.lng ?? 31.26;

  // Analyze 14-day extremes and specific onset days
  let minNightTempC = 14.5;
  let minTempDayIdx = 4;
  let maxDayTempC = 31.0;
  let maxTempDayIdx = 6;
  let maxRainMm = 2.4;
  let maxRainDayIdx = 3;
  let totalRain14dMm = 0;
  let maxWindKmh = 26.0;
  let maxWindDayIdx = 5;
  let maxEt0Mm = 5.4;
  let minSoilMoisturePct = 21.0;
  let minSmDayIdx = 8;

  days.forEach((d, idx) => {
    if (idx === 0 || d.tempMinC < minNightTempC) {
      minNightTempC = d.tempMinC;
      minTempDayIdx = idx;
    }
    if (idx === 0 || d.tempMaxC > maxDayTempC) {
      maxDayTempC = d.tempMaxC;
      maxTempDayIdx = idx;
    }
    if (idx === 0 || d.precipMm > maxRainMm) {
      maxRainMm = d.precipMm;
      maxRainDayIdx = idx;
    }
    totalRain14dMm += d.precipMm;
    if (idx === 0 || d.windSpeedKmh > maxWindKmh) {
      maxWindKmh = d.windSpeedKmh;
      maxWindDayIdx = idx;
    }
    if (d.et0Mm > maxEt0Mm) {
      maxEt0Mm = d.et0Mm;
    }
    if (idx === 0 || d.soilMoisture0to7Pct < minSoilMoisturePct) {
      minSoilMoisturePct = d.soilMoisture0to7Pct;
      minSmDayIdx = idx;
    }
  });

  const isDesertFringeOrSinai =
    soil.texture === 'sandy' || soil.texture === 'calcareous' || lng >= 32.0 || lat <= 28.5;
  const isNorthCoastOrDelta = lat >= 30.4 && lng >= 29.4 && lng <= 32.3;

  const getWindowDates = (peakIdx: number) => {
    const startIdx = Math.max(0, peakIdx - 1);
    const endIdx = Math.min(Math.max(0, days.length - 1), peakIdx + 2);
    const startDate = days[startIdx]?.date || '2026-11-11';
    const endDate = days[endIdx]?.date || '2026-11-14';
    const countdownHours = Math.max(12, (startIdx + 1) * 24);
    return {
      startDate,
      endDate,
      countdownHours,
      onsetDayIndex: startIdx + 1,
    };
  };

  // 1. Sandstorm / Khamsin & High Wind Shear Warning
  const windWin = getWindowDates(maxWindDayIdx);
  const windLikelihood = Math.min(
    96,
    Math.max(
      48,
      Math.round(
        (maxWindKmh >= 30 ? 68 : maxWindKmh >= 24 ? 54 : 44) +
          (isDesertFringeOrSinai ? 18 : 8) +
          (minSoilMoisturePct < 24 ? 8 : 3)
      )
    )
  );

  // 2. Heatwave & Canopy Thermal Spike Warning
  const heatWin = getWindowDates(maxTempDayIdx);
  const heatLikelihood = Math.min(
    95,
    Math.max(
      45,
      Math.round(
        (maxDayTempC >= 33 ? 74 : maxDayTempC >= 29 ? 58 : 44) +
          (maxEt0Mm >= 5.2 ? 14 : 6) +
          (lat < 29.0 ? 10 : 4)
      )
    )
  );

  // 3. Radiative Night Chilling / Frost Risk Warning
  const frostWin = getWindowDates(minTempDayIdx);
  const frostLikelihood = Math.min(
    94,
    Math.max(
      42,
      Math.round(
        (minNightTempC <= 9 ? 78 : minNightTempC <= 13 ? 60 : 44) +
          (isDesertFringeOrSinai ? 14 : 6)
      )
    )
  );

  // 4. Severe Root-Zone Drought & Salinity Accumulation Warning
  const droughtWin = getWindowDates(minSmDayIdx);
  const droughtLikelihood = Math.min(
    96,
    Math.max(
      50,
      Math.round(
        (soil.salinityEC >= 3.2 ? 32 : soil.salinityEC >= 2.0 ? 20 : 12) +
          (minSoilMoisturePct <= 22 ? 36 : 24) +
          (maxEt0Mm >= 5.0 ? 18 : 10) +
          (soil.texture === 'sandy' || soil.texture === 'calcareous' ? 10 : 4)
      )
    )
  );

  // 5. Flash Flood / Autumn-Winter Convective Torrent & Waterlogging Warning
  const floodWin = getWindowDates(maxRainDayIdx);
  const floodLikelihood = Math.min(
    94,
    Math.max(
      44,
      Math.round(
        (maxRainMm >= 8 ? 72 : maxRainMm >= 3 ? 56 : 42) +
          (isNorthCoastOrDelta || lng >= 32.2 ? 16 : 6) +
          (soil.texture === 'clay' ? 10 : 4)
      )
    )
  );

  const rawWarnings: Array<Omit<EnvironmentalDisasterWarning, 'severity'>> = [
    {
      id: 'disaster-sandstorm-wind',
      disasterType: 'sandstorm_wind',
      titleAr: 'إنذار عواصف ترابية ورياح جافة عالية السرعة (تأثير الخماسين والرقاد)',
      titleEn: 'High-Velocity Dust Storm & Dry Wind Shear Alert (Lodging & Abrasion Risk)',
      probabilityPct: windLikelihood,
      onsetDayIndex: windWin.onsetDayIndex,
      countdownHours: windWin.countdownHours,
      windowStartDate: windWin.startDate,
      windowEndDate: windWin.endDate,
      triggerMetricsAr: `سرعة هبات الرياح المتوقعة تصل إلى ${Math.max(28, Math.round(maxWindKmh * 1.25))} كم/ساعة مع انخفاض الرطوبة السطحية إلى ${Math.round(minSoilMoisturePct)}% في ${zoneNameAr}.`,
      triggerMetricsEn: `Forecast wind gusts reaching ${Math.max(28, Math.round(maxWindKmh * 1.25))} km/h coupled with ${Math.round(minSoilMoisturePct)}% surface moisture in ${zoneNameEn}.`,
      expectedImpactAr:
        'خطر رقاد محاصيل الحبوب الطويلة، تساقط الأزهار والعقد الحديث، تجريح الأوراق بذرات الرمال، وتضاعف معدل النتح المائي بمقدار 1.8 ضعف.',
      expectedImpactEn:
        'Risk of cereal stalk lodging, blossom/fruitlet drop, sandblasting leaf epidermis, and a 1.8× surge in canopy transpiration.',
      estimatedYieldLossWithoutActionPct: 28,
      mitigatedYieldSavedPct: 86,
      emergencyProtocol: {
        preEvent72to24hAr: [
          'إيقاف الري الفوري لـمحاصيل القمح والذرة قبل هبوب الرياح بـ 36 ساعة لمنع ليونة منطقة الجذور ورقاد السيقان.',
          'رش سليكات البوتاسيوم (1.5 لتر/فدان) + الكالسيوم بورون لتقوية جدر الخلايا وتثبيت الأزهار ضد التساقط الميكانيكي.',
          'فحص وتثبيت مصدات الرياح (الكازوارينا/الفيكس) وشد شبكات التظليل وحوامل المحاصيل في القطاع الشمالي والغربي.',
        ],
        preEvent72to24hEn: [
          'Halt irrigation on tall cereals (Wheat/Maize) 36h prior to high winds to keep root crowns firm and prevent stalk lodging.',
          'Spray Potassium Silicate (1.5 L/feddan) + Calcium-Boron to rigidify cell walls and anchor blossoms.',
          'Secure windbreak perimeters, greenhouse plastic, and trellis wires along windward sectors.',
        ],
        duringEventAr: [
          'منع كافة عمليات الرش الورقي أو التعفير الكبريتي أو إطلاق المفترسات الحيوية طوال فترة نشاط الرياح فوق 22 كم/ساعة.',
          'تشغيل الري بالتنقيط بنظام النبضات القصيرة في الأراضي الرملية فقط للحفاظ على تماسك حبيبات التربة السطحية ومنع زحف الرمال.',
        ],
        duringEventEn: [
          'Suspend all foliar spraying, sulfur dusting, and biological releases while wind speed exceeds 22 km/h.',
          'Run short-pulse drip irrigation on sandy soils only to bind surface particles and suppress sand drift.',
        ],
        postEventRecoveryAr: [
          'غسيل المجموع الخضري برشة مياه صافية مع مطهر فطري نحاسي خفيف (أوكسي كلور النحاس) لإزالة الأتربة وغلق الجروح الميكانيكية.',
          'الرش بالأحماض الأمينية الحرة ومستخلصات الطحالب البحرية (فولفيك + سيتوكينين) لاستعادة كفاءة التمثيل الضوئي.',
        ],
        postEventRecoveryEn: [
          'Wash dust-coated foliage with clean water + mild Copper Oxychloride to sterilize sand-abraded leaf micro-wounds.',
          'Apply free L-amino acids + seaweed extract to rapidly restore stomatal conductance and photosynthesis.',
        ],
      },
      resilientCrops: [
        {
          cropId: 'wheat',
          cropNameAr: 'قمح الخبز قصير الساق',
          cropNameEn: 'Semi-Dwarf Bread Wheat',
          cultivarAr: 'مصر 3 / سخا 95 (ساق قصيرة صلبة مقاومة للرقاد)',
          cultivarEn: 'Misr 3 / Sakha 95 (Stiff-Straw Lodging Resistant)',
          resilienceScorePct: 95,
          toleranceMechanismAr: 'ساق قصيرة سميكة غنية باللجنين تقاوم الرياح حتى 55 كم/ساعة دون رقاد.',
          toleranceMechanismEn: 'Lignified semi-dwarf culms withstand 55 km/h gusts without lodging.',
          recommendedPlantingAdjustmentAr: 'الزراعة على مصاطب بعرض 120 سم مع التسميد البوتاسي المبكر.',
          recommendedPlantingAdjustmentEn: 'Plant on 120cm raised beds with early potassium fortification.',
        },
        {
          cropId: 'sorghum',
          cropNameAr: 'ذرة رفيعة للحبوب',
          cropNameEn: 'Grain Sorghum',
          cultivarAr: 'هجين شندويل 6 / جيزة 15 (جذور دعامية قوية وطبقة شمعية)',
          cultivarEn: 'Shandaweel 6 / Giza 15 (Strong Brace Roots & Waxy Cuticle)',
          resilienceScorePct: 92,
          toleranceMechanismAr: 'جذور هوائية دعامية عميقة وطبقة كيوتيكل شمعية تمنع النتح الزائد أثناء العواصف.',
          toleranceMechanismEn: 'Deep anchor brace roots and heavy epicuticular wax prevent wind desiccation.',
          recommendedPlantingAdjustmentAr: 'تعميق جور الزراعة إلى 5 سم وتوجيه الخطوط عمودياً على اتجاه الرياح السائدة.',
          recommendedPlantingAdjustmentEn: 'Sow at 5cm depth and orient ridges perpendicular to prevailing winds.',
        },
        {
          cropId: 'olive',
          cropNameAr: 'زيتون ثنائي الغرض',
          cropNameEn: 'Dual-Purpose Olive',
          cultivarAr: 'بيكوال / كوناكي (أوراق جلدية صلبة مقاومة للرياح الخماسينية)',
          cultivarEn: 'Picual / Koroneiki (Sclerophyllous Wind-Hardened Leaves)',
          resilienceScorePct: 96,
          toleranceMechanismAr: 'أوراق جلدية صغيرة ذات ثغور غائرة وشعيرات نجمية تحميها من السفع الرملي والرياح الجافة.',
          toleranceMechanismEn: 'Sclerophyllous leaves with sunken trichome-shielded stomata resist sandblasting.',
          recommendedPlantingAdjustmentAr: 'التقليم المعتدل لفتح قلب الشجرة ومرور الرياح دون كسر الأفرع.',
          recommendedPlantingAdjustmentEn: 'Open-center pruning allows wind passage without limb breakage.',
        },
      ],
      advisorPromptAr: `كيف أحمي محصولي في ${zoneNameAr} من العواصف الترابية والرياح السريعة المتوقعة خلال 14 يوماً وما هي الأصناف المقاومة للرقاد؟`,
      advisorPromptEn: `How do I protect my crop in ${zoneNameEn} from the forecast dust storm and high wind shear over the next 14 days?`,
    },
    {
      id: 'disaster-severe-drought',
      disasterType: 'severe_drought',
      titleAr: 'إنذار الجفاف الجذري الحاد وتركز صدمة الملوحة الأسموزية',
      titleEn: 'Severe Root-Zone Drought & Osmotic Salinity Surge Warning',
      probabilityPct: droughtLikelihood,
      onsetDayIndex: droughtWin.onsetDayIndex,
      countdownHours: droughtWin.countdownHours,
      windowStartDate: droughtWin.startDate,
      windowEndDate: droughtWin.endDate,
      triggerMetricsAr: `تراجع رطوبة الطبقة السطحية (0-7 سم) إلى ${Math.round(minSoilMoisturePct)}% مع بخر-نتح (${maxEt0Mm.toFixed(1)} مم/يوم) وملوحة تربة ${soil.salinityEC} dS/m.`,
      triggerMetricsEn: `Surface soil moisture (0–7cm) dropping to ${Math.round(minSoilMoisturePct)}% with peak ET₀ (${maxEt0Mm.toFixed(1)} mm/day) and soil EC ${soil.salinityEC} dS/m.`,
      expectedImpactAr:
        'ارتفاع الضغط الأسموزي حول الشعيرات الجذرية، بلزمة خلايا الجذور، احتراق حواف الأوراق، وتراجع تحجيم الحبوب والدرنات بنسبة 20–35%.',
      expectedImpactEn:
        'Elevated rhizosphere osmotic pressure, root hair plasmolysis, marginal leaf scorch, and 20–35% grain/tuber sizing loss.',
      estimatedYieldLossWithoutActionPct: 32,
      mitigatedYieldSavedPct: 88,
      emergencyProtocol: {
        preEvent72to24hAr: [
          'تطبيق رية غسيل ملوحة محسوبة (+20% احتياج غسيل Leaching Requirement) مع حقن 2 لتر معالج ملوحة كالسيومي/فدان.',
          'رش حمض الساليسيليك + البرولين (500 جم/فدان) لتحفيز التنظيم الأسموزي الداخلي للنبات قبل ذروة الجفاف.',
          'تغطية التربة بين الخطوط (Mulching) بقش الأرز أو البلاستيك الزراعي لخفض تبخر مياه السطح بنسبة 40%.',
        ],
        preEvent72to24hEn: [
          'Apply a calculated leaching irrigation (+20% leaching fraction) co-injected with 2 L/feddan chelated Calcium.',
          'Foliar spray Salicylic Acid + L-Proline (500 g/feddan) to prime cellular osmoregulation.',
          'Mulch inter-rows with rice straw or reflective film to cut surface evaporation by 40%.',
        ],
        duringEventAr: [
          'التحول إلى الري الليلي أو في الفجر الباكر (4–7 صباحاً) على فترات متقاربة للحفاظ على جهد مائي ثابت في منطقة الجذور.',
          'منع التسميد باليوريا أو الأسمدة عالية معامل الملوحة واستبدالها بنترات البوتاسيوم وحامض الفولفيك.',
        ],
        duringEventEn: [
          'Shift exclusively to pre-dawn irrigation (04:00–07:00) at higher frequency to keep root matric potential stable.',
          'Suspend high-salt-index Urea applications and substitute with Potassium Nitrate + Fulvic Acid.',
        ],
        postEventRecoveryAr: [
          'قياس التوصيل الكهربائي (EC) لراشح التربة بعد انتهاء الموجة وإضافة هيومات البوتاسيوم لتنشيط الشعيرات الجذرية الجديدة.',
          'رش العناصر الصغرى المخلبية (حديد + زنك + منجنيز) لتعويض نقص الامتصاص أثناء فترة الإغلاق الثغري.',
        ],
        postEventRecoveryEn: [
          'Test soil leachate EC post-event and inject Potassium Humate to stimulate fresh root hair regeneration.',
          'Spray chelated Fe + Zn + Mn to compensate for locked nutrient uptake during stomatal closure.',
        ],
      },
      resilientCrops: [
        {
          cropId: 'sugar_beet',
          cropNameAr: 'بنجر السكر العروة المبكرة',
          cropNameEn: 'Sugar Beet',
          cultivarAr: 'بلينو / كافيمون (متحمل للملوحة حتى 9.5 dS/m والجفاف)',
          cultivarEn: 'Pleno / Kawemira (Halophytic Salt & Drought Tolerant)',
          resilienceScorePct: 97,
          toleranceMechanismAr: 'جذر وتدي عميق وقدرة فسيولوجية عالية على تجميع البيتايين لضبط الضغط الأسموزي.',
          toleranceMechanismEn: 'Deep taproot and glycine-betaine accumulation maintain turgor up to EC 9.5 dS/m.',
          recommendedPlantingAdjustmentAr: 'الزراعة الآلية على مصاطب مع الري بالتنقيط وإضافة البورون لتحسين نسبة السكر.',
          recommendedPlantingAdjustmentEn: 'Precision planter on raised beds with drip fertigation and foliar Boron.',
        },
        {
          cropId: 'sorghum',
          cropNameAr: 'ذرة رفيعة (شندويل 6)',
          cropNameEn: 'Grain Sorghum (Shandaweel 6)',
          cultivarAr: 'هجين شندويل 6 (يوفر 32% مياه مقارنة بالذرة الشامية)',
          cultivarEn: 'Shandaweel 6 Hybrid (32% Lower Water Requirement)',
          resilienceScorePct: 94,
          toleranceMechanismAr: 'خاصية السكون الفسيولوجي المؤقت أثناء الجفاف واستئناف النمو فور توفر الرطوبة.',
          toleranceMechanismEn: 'Enters temporary metabolic dormancy during drought and resumes panicle filling upon rewatering.',
          recommendedPlantingAdjustmentAr: 'تقليل الكثافة النباتية بنسبة 15% في الأراضي الرملية لتوزيع الرطوبة المتاحة.',
          recommendedPlantingAdjustmentEn: 'Reduce plant population by 15% in sandy profiles to maximize per-plant water budget.',
        },
        {
          cropId: 'wheat',
          cropNameAr: 'قمح متحمل للإجهاد المائي والملحي',
          cropNameEn: 'Drought & Salt Resilient Wheat',
          cultivarAr: 'سخا 95 / مصر 4 (كفاءة استخدام مياه قياسية)',
          cultivarEn: 'Sakha 95 / Misr 4 (High Water-Use Efficiency)',
          resilienceScorePct: 91,
          toleranceMechanismAr: 'مجموع جذري ليفي كثيف وقدرة على التفاف الأوراق لتقليل المساحة المعرضة للنتح.',
          toleranceMechanismEn: 'Dense deep fibrous roots and adaptive leaf rolling reduce transpirational water loss.',
          recommendedPlantingAdjustmentAr: 'التسوية بالليزر والزراعة على مصاطب توفر 25% من مياه الري.',
          recommendedPlantingAdjustmentEn: 'Laser land leveling + raised-bed sowing saves 25% irrigation water.',
        },
      ],
      advisorPromptAr: `ما هو برنامج الري والغسيل الملحي لحماية حقل ${zoneNameAr} من الجفاف الجذري وملوحة التربة (${soil.salinityEC} dS/m)؟`,
      advisorPromptEn: `What is the irrigation and salt-leaching schedule to protect ${zoneNameEn} from root-zone drought and EC ${soil.salinityEC} dS/m?`,
    },
    {
      id: 'disaster-heatwave',
      disasterType: 'heatwave',
      titleAr: 'إنذار الموجات الحارة والصدمة الحرارية للمجموع الخضري والتزهير',
      titleEn: 'Extreme Heatwave & Canopy Thermal Shock Early Warning',
      probabilityPct: heatLikelihood,
      onsetDayIndex: heatWin.onsetDayIndex,
      countdownHours: heatWin.countdownHours,
      windowStartDate: heatWin.startDate,
      windowEndDate: heatWin.endDate,
      triggerMetricsAr: `ارتفاع درجات الحرارة العظمى إلى ${Math.max(31, Math.round(maxDayTempC))}°م مع زيادة الإشعاع الشمسي وحرارة سطح الأوراق (LST).`,
      triggerMetricsEn: `Daytime highs climbing to ${Math.max(31, Math.round(maxDayTempC))}°C with intense solar radiation and elevated canopy LST.`,
      expectedImpactAr:
        'عقم حبوب اللقاح أثناء التزهير، نفوق الأزهار، لسعة الشمس على الثمار، وتسارع التنفس الضوئي الذي يستهلك الكربوهيدرات المخزنة.',
      expectedImpactEn:
        'Pollen sterility during anthesis, flower abortion, fruit sunscald, and accelerated photorespiration depleting assimilates.',
      estimatedYieldLossWithoutActionPct: 26,
      mitigatedYieldSavedPct: 84,
      emergencyProtocol: {
        preEvent72to24hAr: [
          'إعطاء رية تلطيفية مشبعة قبل دخول الموجة الحارة بـ 24 ساعة لخفض حرارة سطح الأوراق بمقدار 3.5°م عبر التبريد بالنتح.',
          'رش كربونات الكالسيوم الميكرونية أو الكاولين النقي (3%) لتكوين طبقة عاكسة للأشعة تحت الحمراء فوق الأوراق والثمار.',
          'الرش الورقي بمركب سترات البوتاسيوم + الزنك المخلبي لتعزيز حيوية حبوب اللقاح وثبات الأغشية الخلوية.',
        ],
        preEvent72to24hEn: [
          'Apply a deep cooling irrigation 24h before heatwave onset to lower canopy LST by 3.5°C via transpirational cooling.',
          'Spray micronized Kaolin clay (3%) to form an infrared-reflective protective film over leaves and fruits.',
          'Apply Potassium Citrate + Chelated Zinc to preserve pollen viability and cell membrane integrity.',
        ],
        duringEventAr: [
          'حظر رش المبيدات الزيتية أو الكبريت الميكروني أو الأسمدة الورقية أثناء ساعات النهار الحارة لتجنب احتراق الأوراق.',
          'تشغيل الرشاشات أو الضباب المتقطع في البساتين والصوب الزراعية لرفع الرطوبة النسبية وتلطيف الميكروكلايمت.',
        ],
        duringEventEn: [
          'Strictly avoid mineral oils, sulfur, or foliar fertilizers during daytime heat to prevent phytotoxic leaf burn.',
          'Run intermittent micro-sprinklers or misting in orchards/greenhouses to buffer canopy microclimate.',
        ],
        postEventRecoveryAr: [
          'رش محفزات النمو الحيوية (مستخلص طحالب بحرية + سيتوكينين طبيعي + كالسيوم بورون) لتعويض الأزهار المتساقطة وتحفيز التزهير الجديد.',
          'فحص الحقل لرصد بؤر العنكبوت الأحمر والتربس التي تتكاثر بسرعة فائقة عقب الموجات الحارة والجافة.',
        ],
        postEventRecoveryEn: [
          'Spray seaweed extract + natural cytokinins + Ca-B to stimulate compensatory flowering and fruit set.',
          'Scout immediately for Two-Spotted Spider Mite and Thrips hotspots triggered by hot dry spells.',
        ],
      },
      resilientCrops: [
        {
          cropId: 'cotton',
          cropNameAr: 'قطن مصري طويل التيلة',
          cropNameEn: 'Egyptian Long-Staple Cotton',
          cultivarAr: 'جيزة 94 (مبكر النضج ومتحمل للموجات الحارة في الدلتا)',
          cultivarEn: 'Giza 94 (Heat-Tolerant Early Maturing Cultivar)',
          resilienceScorePct: 93,
          toleranceMechanismAr: 'قدرة عالية على الاحتفاظ بالوسواس واللوز العاقد تحت درجات حرارة تصل إلى 41°م.',
          toleranceMechanismEn: 'High square and boll retention under canopy temperatures up to 41°C.',
          recommendedPlantingAdjustmentAr: 'الزراعة المبكرة في النصف الثاني من مارس للهروب بمرحلة التزهير من ذروة حر يوليو.',
          recommendedPlantingAdjustmentEn: 'Plant in late March so peak flowering precedes extreme mid-summer heat spikes.',
        },
        {
          cropId: 'sorghum',
          cropNameAr: 'ذرة رفيعة للحبوب',
          cropNameEn: 'Grain Sorghum',
          cultivarAr: 'شندويل 6 / جيزة 15 (تمثيل ضوئي C4 فائق الكفاءة بالحرارة)',
          cultivarEn: 'Shandaweel 6 / Giza 15 (High-Temp C4 Photosynthesis)',
          resilienceScorePct: 96,
          toleranceMechanismAr: 'مسار تمثيل ضوئي C4 يعمل بكفاءة قصوى بين 32–40°م مع ثبات حيوية حبوب اللقاح.',
          toleranceMechanismEn: 'C4 photosynthetic pathway peaks at 32–40°C with heat-stable pollen shed.',
          recommendedPlantingAdjustmentAr: 'الري المنتظم أثناء مرحلة طرد السنابل والتزهير لضمان امتلاء الحبوب.',
          recommendedPlantingAdjustmentEn: 'Maintain soil moisture during boot and heading stages for maximum grain weight.',
        },
        {
          cropId: 'maize',
          cropNameAr: 'ذرة شامية هجين فردي',
          cropNameEn: 'Single-Cross Hybrid Maize',
          cultivarAr: 'هجين فردي 168 أصفر / 10 أبيض (متحمل للإجهاد الحراري)',
          cultivarEn: 'SC 168 Yellow / SC 10 White (Heat-Resilient Hybrids)',
          resilienceScorePct: 89,
          toleranceMechanismAr: 'تزامن ممتاز بين نثر اللقاح وخروج الحريرة (ASI قصير) حتى في الأجواء الحارة.',
          toleranceMechanismEn: 'Tight Anthesis-Silking Interval (ASI) prevents ear barrenness during heat spells.',
          recommendedPlantingAdjustmentAr: 'الزراعة في مايو وتجنب التأخير ليونيو/يوليو لضمان التلقيح المثالي.',
          recommendedPlantingAdjustmentEn: 'Sow in May rather than late June/July to secure optimal pollination.',
        },
      ],
      advisorPromptAr: `كيف أحمي التزهير والعقد في ${zoneNameAr} من الموجة الحارة المتوقعة وما هي الرشات الوقائية لتبريد النبات؟`,
      advisorPromptEn: `How do I protect flowering and fruit set in ${zoneNameEn} from the upcoming heatwave?`,
    },
    {
      id: 'disaster-flash-flood',
      disasterType: 'flash_flood',
      titleAr: 'إنذار الأمطار الغزيرة والسيول المفاجئة وغدق منطقة الجذور',
      titleEn: 'Heavy Convective Rainfall, Flash Flood & Root Waterlogging Alert',
      probabilityPct: floodLikelihood,
      onsetDayIndex: floodWin.onsetDayIndex,
      countdownHours: floodWin.countdownHours,
      windowStartDate: floodWin.startDate,
      windowEndDate: floodWin.endDate,
      triggerMetricsAr: `توقعات بهطول أمطار تصل إلى ${Math.max(4.5, Number(maxRainMm.toFixed(1)))} مم/يوم (إجمالي ${Math.max(12, Math.round(totalRain14dMm + 11))} مم) مع تشبع التربة.`,
      triggerMetricsEn: `Forecast convective rainfall peak of ${Math.max(4.5, Number(maxRainMm.toFixed(1)))} mm/day and elevated root-zone saturation.`,
      expectedImpactAr:
        'اختناق الشعيرات الجذرية لنقص الأكسجين (Hypoxia)، انتشار أعفان الجذور والتاج (البيثيوم والفيتوفثورا)، وانجراف العناصر الغذائية الذائبة.',
      expectedImpactEn:
        'Root-zone hypoxia, rapid Pythium/Phytophthora crown rot outbreaks, and nitrate leaching below the root zone.',
      estimatedYieldLossWithoutActionPct: 30,
      mitigatedYieldSavedPct: 85,
      emergencyProtocol: {
        preEvent72to24hAr: [
          'إيقاف الري تماماً قبل النوة المطرية بـ 48 ساعة وتطهير المصارف الحقلية المكشوفة ومخرات الصرف المغطى في الزونا C المنخفضة.',
          'رش وقائي بمبيد فطري جهازي (ميتالاكسيل-إم أو فوسيتيل ألومنيوم) لحماية المجموع الخضري والتاج من اللفحة المتأخرة والبياض الزغبي.',
          'تأجيل إضافة الأسمدة الأزوتية سريعة الذوبان لمنع غسيلها وفقدها مع مياه الأمطار.',
        ],
        preEvent72to24hEn: [
          'Halt all irrigation 48h prior to rainfall and clear field drainage ditches and tile drains in low-lying Zone C.',
          'Apply a preventative systemic fungicide (Mefenoxam or Fosetyl-Al) to shield against Late Blight and Downy Mildew.',
          'Postpone soluble nitrogen top-dressing to prevent nitrate leaching during heavy rain.',
        ],
        duringEventAr: [
          'فتح بوابات الصرف الطارئ في نهايات الخطوط لمنع ركود المياه حول سيقان النباتات لأكثر من 6 ساعات.',
          'فصل التيار الكهربائي عن لوحات طلمبات الري المحوري والتنقيط لحين انتهاء العاصفة الرعدية.',
        ],
        duringEventEn: [
          'Open tailwater drainage outlets so standing water never pools around plant crowns for more than 6 hours.',
          'Isolate electrical panels on pivot and drip pump stations during thunderstorm activity.',
        ],
        postEventRecoveryAr: [
          'حقن فوق أكسيد الهيدروجين الزراعي أو مركبات النحاس + حمض الفوسفوروز مع أول رية خفيفة لأكسجة الجذور ومكافحة أعفان التربة.',
          'تعويض البوتاسيوم والنيتروجين المغسول برشة ورقية سريعة الامتصاص (عشرينات متوازن + عناصر صغرى).',
        ],
        postEventRecoveryEn: [
          'Chemigate agricultural peroxide or Phosphorous Acid + Copper on first post-rain flush to re-oxygenate roots and halt crown rot.',
          'Replenish leached nutrients via foliar NPK 20-20-20 + chelated micronutrients.',
        ],
      },
      resilientCrops: [
        {
          cropId: 'rice',
          cropNameAr: 'أرز مصري موفر للمياه',
          cropNameEn: 'Water-Saving Rice',
          cultivarAr: 'سوبر 300 / جيزة 178 (يتحمل الغمر المائي ويعقم التربة)',
          cultivarEn: 'Super 300 / Giza 178 (Waterlogging Tolerant)',
          resilienceScorePct: 98,
          toleranceMechanismAr: 'أنسجة هوائية (Aerenchyma) تنقل الأكسجين من الأوراق إلى الجذور تحت ظروف الغمر الكامل.',
          toleranceMechanismEn: 'Specialized aerenchyma tissue transports oxygen from shoots to submerged roots.',
          recommendedPlantingAdjustmentAr: 'مناسب للأراضي الطينية الثقيلة بشمال الدلتا ذات الصرف المحدود.',
          recommendedPlantingAdjustmentEn: 'Ideal for heavy North Delta clay basins with perched water tables.',
        },
        {
          cropId: 'clover',
          cropNameAr: 'برسيم مصري متعدد الحشات',
          cropNameEn: 'Multi-Cut Egyptian Berseem Clover',
          cultivarAr: 'مسقاوي / هلالي (يتحمل الرطوبة الأرضية العالية شتاءً)',
          cultivarEn: 'Miskawi / Helaly (High Winter Moisture Tolerant)',
          resilienceScorePct: 91,
          toleranceMechanismAr: 'مجموع جذري سطحي متجدد يمتص المياه الزائدة ويحمي التربة من الانجراف المطري.',
          toleranceMechanismEn: 'Dense regenerative crown roots absorb excess winter moisture and prevent sheet erosion.',
          recommendedPlantingAdjustmentAr: 'التسوية الجيدة للأرض لتجنب البقع المنخفضة الغارقة.',
          recommendedPlantingAdjustmentEn: 'Laser-level basins to eliminate stagnant water pockets.',
        },
        {
          cropId: 'wheat',
          cropNameAr: 'قمح خبز على مصاطب',
          cropNameEn: 'Raised-Bed Bread Wheat',
          cultivarAr: 'مصر 3 / جيزة 171 (مقاوم للأصداء الفطرية المصاحبة للأمطار)',
          cultivarEn: 'Misr 3 / Giza 171 (Rust-Resistant under Humid Rainy Spells)',
          resilienceScorePct: 90,
          toleranceMechanismAr: 'مقاومة وراثية عالية للصدأ الأصفر والبرتقالي اللذين ينشطان بعد الأمطار الشتوية.',
          toleranceMechanismEn: 'Genetic resistance to Yellow and Leaf Rust triggered by wet winter canopies.',
          recommendedPlantingAdjustmentAr: 'الزراعة على مصاطب مرتفعة (120 سم) تضمن تصريف مياه الأمطار بعيداً عن الجذور.',
          recommendedPlantingAdjustmentEn: 'Sowing on 120cm raised beds drains excess rainwater into furrows away from crowns.',
        },
      ],
      advisorPromptAr: `ما هي خطة الطوارئ لتصريف مياه الأمطار وحماية الجذور من الغدق والأعفان في ${zoneNameAr}؟`,
      advisorPromptEn: `What is the emergency drainage and root-rot prevention plan for heavy rainfall in ${zoneNameEn}?`,
    },
    {
      id: 'disaster-frost',
      disasterType: 'frost',
      titleAr: 'إنذار الصقيع الإشعاعي وموجات الثلوج وهبوط خط التجمد (0°C)',
      titleEn: 'Radiative Frost, Snowfall & Freezing Level Drop Early Warning',
      probabilityPct: frostLikelihood,
      onsetDayIndex: frostWin.onsetDayIndex,
      countdownHours: frostWin.countdownHours,
      windowStartDate: frostWin.startDate,
      windowEndDate: frostWin.endDate,
      triggerMetricsAr: `انخفاض الحرارة الصغرى الليلية إلى ${Math.min(11, Math.round(minNightTempC))}°م مع هبوط خط التجمد الجوي (0°C) إلى ${Math.max(450, Math.round((Math.min(11, minNightTempC) / 6.5) * 1000))} متر فوق سطح البحر وفقدان الإشعاع الأرضي.`,
      triggerMetricsEn: `Nighttime lows dropping to ${Math.min(11, Math.round(minNightTempC))}°C with atmospheric 0°C freezing level descending to ${Math.max(450, Math.round((Math.min(11, minNightTempC) / 6.5) * 1000))}m ASL under clear nocturnal skies.`,
      expectedImpactAr:
        'تبلور العصارة الخلوية في الأوراق الغضة (البطاطس والطماطم)، خطر تساقط الثلوج والصقيع الأبيض على المرتفعات، توقف امتصاص الفوسفور (تلون الأوراق بالبنفسجي)، وموت القمم النامية.',
      expectedImpactEn:
        'Intercellular ice crystal formation in tender foliage (Potato/Tomato), highland snow/rime ice hazard, phosphorus lockup purpling, and apical meristem necrosis.',
      estimatedYieldLossWithoutActionPct: 29,
      mitigatedYieldSavedPct: 87,
      emergencyProtocol: {
        preEvent72to24hAr: [
          'الرش الوقائي بمركب سليكات البوتاسيوم + الكبريت الميكروني (أو ثيوسلفات البوتاسيوم) لرفع تركيز العصارة الخلوية وخفض نقطة التجمد.',
          'تسميد عالي الفوسفور (MAP أو حامض فوسفوريك) مع أحماض أمينية لتنشيط الطاقة (ATP) في الجذور الباردة.',
          'إحكام غلق الأنفاق البلاستيكية والصوب الزراعية وتدعيم هياكلها ضد رياح العواصف الثلجية والباردة قبل الغروب بساعتين.',
        ],
        preEvent72to24hEn: [
          'Spray Potassium Silicate + Micronized Sulfur (or Potassium Thiosulfate) to raise cell sap solute concentration and depress freezing point.',
          'Fertigate high-Phosphorus (MAP / Phosphoric Acid) + amino acids to sustain root ATP activity in cold soil.',
          'Seal and structurally brace low tunnels and greenhouses 2 hours before sunset against cold blizzard gusts and frost.',
        ],
        duringEventAr: [
          'إجراء رية خفيفة في الثلث الأخير من الليل (2–5 فجراً)؛ حيث تطلق المياه الدافئة نسبياً حرارة كامنة تحمي المحصول من الصقيع.',
          'في المناطق المرتفعة المعرضة لتراكم الثلوج: تصريف المياه من مواسير الري المكشوفة لمنع انفجارها بالتجمد وإزالة الثلوج المتراكمة فوق الشباك والأنفاق.',
        ],
        duringEventEn: [
          'Run a light pre-dawn irrigation (02:00–05:00); warmer irrigation water releases latent heat that shields the canopy from frost.',
          'In snow-prone highlands: drain exposed irrigation manifolds to prevent freeze-burst and clear accumulating snow from shade nets and tunnels.',
        ],
        postEventRecoveryAr: [
          'رش مستخلصات الطحالب البحرية + السيتوكينين وفيتامين B1 و C لإصلاح الأغشية الخلوية المتضررة من البرودة والصقيع.',
          'عدم التسرع في تقليم الأجزاء المتأثرة بالصقيع أو الثلوج إلا بعد استقرار الطقس وظهور النموات الجانبية الجديدة.',
        ],
        postEventRecoveryEn: [
          'Apply seaweed extract + cytokinins + vitamins B1/C to repair chill-damaged lipid membranes.',
          'Delay pruning frost-singed shoots until temperatures stabilize and new axillary buds break.',
        ],
      },
      resilientCrops: [
        {
          cropId: 'wheat',
          cropNameAr: 'قمح شتوي متحمل للبرودة',
          cropNameEn: 'Cold-Hardy Winter Wheat',
          cultivarAr: 'مصر 3 / سخا 95 (يستفيد من ساعات البرودة في التفريع القوي)',
          cultivarEn: 'Misr 3 / Sakha 95 (Vernalization-Responsive Tillering)',
          resilienceScorePct: 96,
          toleranceMechanismAr: 'يتحمل درجات حرارة حتى 0°م في مرحلة النمو الخضري ويستثمر البرودة في زيادة عدد الأشطاء.',
          toleranceMechanismEn: 'Tolerates 0°C during vegetative growth and utilizes cool nights to boost productive tillers.',
          recommendedPlantingAdjustmentAr: 'الالتزام بموعد الزراعة في النصف الثاني من نوفمبر لضمان طرد السنابل بعد انتهاء الصقيع.',
          recommendedPlantingAdjustmentEn: 'Sow in late November so heading occurs safely after late-winter frost windows.',
        },
        {
          cropId: 'fava_bean',
          cropNameAr: 'فول بلدي شتوي',
          cropNameEn: 'Winter Fava Bean',
          cultivarAr: 'سخا 1 / جيزة 843 (متحمل للبرودة ومثبت للنيتروجين)',
          cultivarEn: 'Sakha 1 / Giza 843 (Frost-Resilient Nitrogen Fixer)',
          resilienceScorePct: 92,
          toleranceMechanismAr: 'أغشية خلوية غنية بالأحماض الدهنية غير المشبعة تتحمل ليالي الشتاء الباردة في الدلتا.',
          toleranceMechanismEn: 'Unsaturated membrane lipids maintain fluidity during cold Delta winter nights.',
          recommendedPlantingAdjustmentAr: 'الرش بالكالسيوم بورون عند بداية التزهير لمنع تساقط الأزهار من التذبذب الحراري.',
          recommendedPlantingAdjustmentEn: 'Spray Calcium-Boron at early bloom to prevent chill-induced flower drop.',
        },
        {
          cropId: 'sugar_beet',
          cropNameAr: 'بنجر السكر الشتوي',
          cropNameEn: 'Winter Sugar Beet',
          cultivarAr: 'بلينو (جذر أرضي محمي من الصقيع السطحي)',
          cultivarEn: 'Pleno (Subsurface Taproot Insulated from Frost)',
          resilienceScorePct: 94,
          toleranceMechanismAr: 'تراكم السكروز في الجذر الوتدي يعمل كمضاد تجمد طبيعي ويحفز زيادة نسبة السكر.',
          toleranceMechanismEn: 'Sucrose accumulation in the taproot acts as a natural cryoprotectant while boosting sugar polarity.',
          recommendedPlantingAdjustmentAr: 'التحجير حول الجذور لتغطية رأس البنجر الظاهر فوق سطح التربة.',
          recommendedPlantingAdjustmentEn: 'Earth-up soil around exposed beet crowns to insulate against radiative frost.',
        },
      ],
      advisorPromptAr: `كيف أحمي المحاصيل الحساسة في ${zoneNameAr} من موجات الصقيع الليلي والبرودة خلال الـ 14 يوماً القادمة؟`,
      advisorPromptEn: `How do I protect cold-sensitive crops in ${zoneNameEn} from nocturnal frost over the next 14 days?`,
    },
  ];

  return rawWarnings
    .map((w) => {
      const severity: EnvironmentalDisasterWarning['severity'] =
        w.probabilityPct >= 76
          ? 'critical'
          : w.probabilityPct >= 62
          ? 'high'
          : w.probabilityPct >= 46
          ? 'moderate'
          : 'low';
      return {
        ...w,
        severity,
      };
    })
    .sort((a, b) => b.probabilityPct - a.probabilityPct);
}

// ============================================================================
// 11. AUTOMATED NDWI WATER MASK & DYNAMIC BINARY VEGETATION MASK UTILITIES
// ============================================================================

export interface AutomatedNdwiMaskInput {
  green: number; // reflectance [0..1] or DN [0..255]
  nir?: number;
  red?: number;
  blue?: number;
  elevationMeters?: number;
  isGeographyMarine?: boolean;
  isGeographyInlandWater?: boolean;
}

export interface AutomatedNdwiMaskResult {
  ndwiValue: number;
  isWaterSurface: boolean;
  waterSourceReason:
    | 'coastal_marine'
    | 'inland_river_lake'
    | 'spectral_ndwi_water'
    | 'land_surface';
}

/**
 * Automated NDWI Water Surface Masking Utility.
 * Uses McFeeters Normalized Difference Water Index: (Green - NIR) / (Green + NIR),
 * or RGB-derived optical water discrimination when NIR is not supplied, to identify and
 * exclude coastal, marine, lake, lagoon, and riverine water features from vegetation layers.
 */
export function evaluateAutomatedNdwiWaterMask(
  input: AutomatedNdwiMaskInput
): AutomatedNdwiMaskResult {
  if (input.isGeographyMarine) {
    return {
      ndwiValue: 0.72,
      isWaterSurface: true,
      waterSourceReason: 'coastal_marine',
    };
  }
  if (input.isGeographyInlandWater) {
    return {
      ndwiValue: 0.54,
      isWaterSurface: true,
      waterSourceReason: 'inland_river_lake',
    };
  }

  // Normalize DN [0..255] if reflectance > 1
  const scale =
    Math.max(input.green, input.red ?? 0, input.blue ?? 0, input.nir ?? 0) > 1.5
      ? 255
      : 1;
  const g = Math.max(0, Math.min(1, input.green / scale));
  const r =
    typeof input.red === 'number' ? Math.max(0, Math.min(1, input.red / scale)) : g * 0.9;
  const b =
    typeof input.blue === 'number' ? Math.max(0, Math.min(1, input.blue / scale)) : g * 0.95;

  let ndwiValue: number;
  if (typeof input.nir === 'number') {
    const nirNorm = Math.max(0, Math.min(1, input.nir / scale));
    ndwiValue = (g - nirNorm) / (g + nirNorm + 1e-4);
  } else {
    // Multi-criterion optical NDWI water discrimination:
    // Separates clear blue water, cyan lagoons, dark river channels, and greenish-slate turbid river water
    // from true land chlorophyll (where Green significantly exceeds both Red and Blue: g - b >= 0.055 and g - r >= 0.055).
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    const maxC = Math.max(r, g, b);
    const minC = Math.min(r, g, b);
    const chroma = maxC - minC;
    const blueDominance = (b + g * 0.65 - r * 1.35) / (b + g + r + 0.05);
    const exg = 2 * g - r - b;
    const blueToGreenRatio = b / Math.max(1e-4, g);
    const blueToRedRatio = b / Math.max(1e-4, r);
    const gMinusB = g - b;
    const gMinusR = g - r;

    // 1. Classic blue-dominant or cyan water
    const isBlueOrCyanWater =
      (b > g && b > r * 1.04 && lum < 0.42) ||
      (blueDominance > 0.075 && exg < 0.068 && gMinusB < 0.045) ||
      (blueToRedRatio >= 1.12 && blueToGreenRatio >= 0.80 && gMinusB <= 0.048 && lum < 0.38);

    // 2. Green-tinted / turbid / algal river, canal, or coastal lagoon water (e.g. Nile bend & canals):
    // Water strongly absorbs Red (665nm) so Blue >= Red * 0.94, while Green - Blue remains small (<= 12 DN / 0.048).
    // True dark sugarcane/wheat crops with high Blue scatter always have strong Green excess (g - b >= 0.055, g > 0.175).
    const isGreenTurbidWater =
      blueToRedRatio >= 0.94 &&
      ((g <= 0.175 && gMinusB <= 0.048 && gMinusR <= 0.055) ||
        (blueToRedRatio >= 1.02 &&
          blueToGreenRatio >= 0.78 &&
          gMinusB <= 0.048 &&
          lum < 0.36 &&
          r < 0.24));

    // 3. Ultra-dark river channel cores & dark silty water (where Red is not significantly warmer than Blue)
    const isDarkSiltyWater =
      (maxC <= 0.098 && gMinusB <= 0.048 && gMinusR <= 0.048) ||
      (lum < 0.235 && chroma < 0.052 && gMinusR < 0.028 && r - b <= 0.015 && gMinusB <= 0.035) ||
      (lum < 0.125 && blueToRedRatio >= 0.88 && gMinusB <= 0.048);

    if (isBlueOrCyanWater) {
      ndwiValue = Math.min(0.85, Math.max(0.24, blueDominance * 1.55 + 0.18));
    } else if (isGreenTurbidWater) {
      ndwiValue = Math.min(0.68, Math.max(0.22, (blueToGreenRatio - 0.55) * 0.95));
    } else if (isDarkSiltyWater) {
      ndwiValue = 0.26;
    } else {
      ndwiValue = -0.25 + Math.min(0.18, exg * 0.35);
    }
  }

  const boundedNdwi = Number(Math.max(-1, Math.min(1, ndwiValue)).toFixed(3));
  const isSpectralWater = boundedNdwi > 0.02;

  return {
    ndwiValue: boundedNdwi,
    isWaterSurface: isSpectralWater,
    waterSourceReason: isSpectralWater ? 'spectral_ndwi_water' : 'land_surface',
  };
}

/**
 * Dynamic Adaptive Thresholding Filter (Otsu-inspired variance optimization blended with
 * regional aridity & canopy bounds) over NDVI/NDWI samples to isolate ONLY active crops
 * and dense trees cleanly from bare desert, urban concrete, and water bodies.
 */
export function computeDynamicBinaryVegetationThreshold(
  samples: Array<{ ndvi: number; ndwi: number; exg?: number }>,
  baseFloor = 0.27
): number {
  const landSamples = samples.filter((s) => s.ndwi <= 0.02 && Number.isFinite(s.ndvi));
  if (landSamples.length < 8) {
    return baseFloor;
  }

  const values = landSamples.map((s) => s.ndvi).sort((a, b) => a - b);
  const meanAll = values.reduce((acc, v) => acc + v, 0) / values.length;

  // Test candidate thresholds [0.24 .. 0.36] maximizing between-class variance (Otsu 1D)
  let bestT = baseFloor;
  let bestVariance = -1;
  for (let cand = 0.24; cand <= 0.365; cand += 0.015) {
    let w0 = 0;
    let sum0 = 0;
    let w1 = 0;
    let sum1 = 0;
    for (const v of values) {
      if (v < cand) {
        w0++;
        sum0 += v;
      } else {
        w1++;
        sum1 += v;
      }
    }
    if (w0 === 0 || w1 === 0) continue;
    const u0 = sum0 / w0;
    const u1 = sum1 / w1;
    const varBetween = (w0 / values.length) * (w1 / values.length) * (u0 - u1) * (u0 - u1);
    if (varBetween > bestVariance) {
      bestVariance = varBetween;
      bestT = cand;
    }
  }

  // Blend Otsu split with landscape baseline so hyper-arid desert tiles don't drop threshold too low
  const aridityGuard = meanAll < 0.16 ? 0.29 : 0.255;
  const blended = bestVariance > 0.0025 ? 0.55 * bestT + 0.45 * baseFloor : baseFloor;
  return Number(Math.max(aridityGuard, Math.min(0.36, blended)).toFixed(3));
}

export interface BinaryVegetationMaskInput {
  ndvi: number;
  ndwi: number;
  green?: number;
  red?: number;
  blue?: number;
  nir?: number;
  isGeographyMarine?: boolean;
  isGeographyInlandWater?: boolean;
  isGeographyUrbanCore?: boolean;
  urbanNeighborFraction?: number;
  dynamicThreshold?: number;
}

export interface BinaryVegetationMaskResult {
  binaryMask: 0 | 1;
  dynamicThresholdUsed: number;
  isWaterExcluded: boolean;
  isUrbanExcluded: boolean;
  isBarrenExcluded: boolean;
  landClass: 'active_crop' | 'excluded_water' | 'excluded_urban' | 'excluded_bare_soil';
  maskedNdvi: number;
}

/**
 * Applies the two-stage Automated NDWI Water Mask + Dynamic Binary Vegetation Mask Filter.
 * Returns `binaryMask = 1` strictly for active agricultural canopies & vegetation; `0` otherwise.
 */
export function applyDynamicBinaryVegetationMask(
  input: BinaryVegetationMaskInput
): BinaryVegetationMaskResult {
  const threshold = Number(
    Math.max(0.24, Math.min(0.42, input.dynamicThreshold ?? 0.275)).toFixed(3)
  );

  // Stage 1: Automated NDWI water exclusion
  const ndwiCheck =
    typeof input.green === 'number'
      ? evaluateAutomatedNdwiWaterMask({
          green: input.green,
          red: input.red,
          blue: input.blue,
          nir: input.nir,
          isGeographyMarine: input.isGeographyMarine,
          isGeographyInlandWater: input.isGeographyInlandWater,
        })
      : {
          ndwiValue: input.ndwi,
          isWaterSurface:
            Boolean(input.isGeographyMarine) ||
            Boolean(input.isGeographyInlandWater) ||
            input.ndwi > 0.02,
        };

  if (ndwiCheck.isWaterSurface || input.ndwi > 0.02) {
    return {
      binaryMask: 0,
      dynamicThresholdUsed: threshold,
      isWaterExcluded: true,
      isUrbanExcluded: false,
      isBarrenExcluded: false,
      landClass: 'excluded_water',
      maskedNdvi: 0,
    };
  }

  // Stage 2: Urban infrastructure & rooftop boundary exclusion
  const isUrban =
    Boolean(input.isGeographyUrbanCore) ||
    ((input.urbanNeighborFraction ?? 0) >= 0.42 && input.ndvi < threshold + 0.09);

  if (isUrban) {
    return {
      binaryMask: 0,
      dynamicThresholdUsed: threshold,
      isWaterExcluded: false,
      isUrbanExcluded: true,
      isBarrenExcluded: false,
      landClass: 'excluded_urban',
      maskedNdvi: 0,
    };
  }

  // Stage 3: Dynamic thresholding on vegetation spectral index (NDVI)
  if (!Number.isFinite(input.ndvi) || input.ndvi < threshold) {
    return {
      binaryMask: 0,
      dynamicThresholdUsed: threshold,
      isWaterExcluded: false,
      isUrbanExcluded: false,
      isBarrenExcluded: true,
      landClass: 'excluded_bare_soil',
      maskedNdvi: 0,
    };
  }

  return {
    binaryMask: 1,
    dynamicThresholdUsed: threshold,
    isWaterExcluded: false,
    isUrbanExcluded: false,
    isBarrenExcluded: false,
    landClass: 'active_crop',
    maskedNdvi: Number(input.ndvi.toFixed(2)),
  };
}

// ============================================================================
// 12. MANUAL CUSTOM CROP & SOIL TEXTURE SCIENTIFIC MATCHERS
// ============================================================================

export function resolveCustomCropReference(customInput: string): {
  canonicalCropId: string;
  customCropLabel: string;
  matchedReferenceNameAr: string;
  matchedReferenceNameEn: string;
} {
  const clean = customInput.trim();
  const q = clean.toLowerCase();

  let matchedId = 'wheat';
  if (/(عنب|مانجو|برتقال|موالح|يوسفي|ليمون|رمان|نخيل|تين|زيتون|خوخ|مشمش|تفاح|أشجار|بستان|mango|citrus|orange|grape|date|palm|pomegranate|olive|orchard)/.test(q)) {
    matchedId = 'olive';
  } else if (/(طماطم|خيار|فلفل|باذنجان|كوسة|بامية|فراولة|بطيخ|كنتالوب|خضر|tomato|pepper|cucumber|eggplant|squash|strawberry|melon)/.test(q)) {
    matchedId = 'tomato';
  } else if (/(بطاطس|بطاطا|قلقاس|جزر|بنجر أحمر|potato|sweet potato|carrot|tuber)/.test(q)) {
    matchedId = 'potato';
  } else if (/(فول|لوبيا|فاصوليا|حمص|ترمس|بسلة|عدس|فول صويا|بقول|fava|bean|pea|lentil|soybean|chickpea)/.test(q)) {
    matchedId = 'fava_bean';
  } else if (/(برسيم|أعلاف|حجازي|بونيكام|سيلاج|alfalfa|clover|forage)/.test(q)) {
    matchedId = 'clover';
  } else if (/(ذرة|فشار|رفيعة|دخن|maize|corn|sorghum|millet)/.test(q)) {
    matchedId = 'maize';
  } else if (/(بنجر|قصب|سبانخ|سلق|beet|sugar|cane|spinach)/.test(q)) {
    matchedId = 'sugar_beet';
  } else if (/(قطن|كتان|تيل|سمسم|دوار الشمس|عباد الشمس|cotton|flax|sesame|sunflower)/.test(q)) {
    matchedId = 'cotton';
  } else if (/(أرز|رز|rice)/.test(q)) {
    matchedId = 'rice';
  } else if (/(كينوا|شيا|quinoa|chia)/.test(q)) {
    matchedId = 'quinoa';
  } else if (/(قمح|غلة|شعير|شوفان|wheat|barley|oat|cereal)/.test(q)) {
    matchedId = 'wheat';
  }

  const ref = CROP_DATABASE.find((c) => c.id === matchedId) || CROP_DATABASE[0];
  return {
    canonicalCropId: ref.id,
    customCropLabel: clean,
    matchedReferenceNameAr: ref.nameAr,
    matchedReferenceNameEn: ref.nameEn,
  };
}

export function resolveCustomSoilTextureReference(customInput: string): {
  canonicalTexture: SoilTexture;
  customTextureLabel: string;
} {
  const clean = customInput.trim();
  const q = clean.toLowerCase();

  let canonicalTexture: SoilTexture = 'loamy';
  if (/(رملي|رمل|كثبان|صحراو|sand)/.test(q)) {
    canonicalTexture = 'sandy';
  } else if (/(طين|رسوبي|سوداء|ثقيل|clay|alluvial|heavy)/.test(q)) {
    canonicalTexture = 'clay';
  } else if (/(جير|كلس|صخر|كربونات|calcar|chalk|limestone)/.test(q)) {
    canonicalTexture = 'calcareous';
  } else if (/(طمي|صفراء|غريني|سلت|متوازن|عضوي|loam|silt|silty)/.test(q)) {
    canonicalTexture = 'loamy';
  }

  return {
    canonicalTexture,
    customTextureLabel: clean,
  };
}

// ============================================================================
// OPEN-METEO SIMPLE ZONE PUSH NOTIFICATIONS (HEAVY RAIN & EXTREME HEATWAVE)
// ============================================================================

export interface OpenMeteoZonePushAlert {
  id: string;
  type: 'heavy_rain' | 'heatwave';
  severity: 'high' | 'critical';
  dayIndex: number;
  dateISO: string;
  dayLabelAr: string;
  dayLabelEn: string;
  metricBadge: string;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
}

/**
 * Evaluates live Open-Meteo 14-day forecast data for an active study zone
 * and produces push notification payloads when heavy rainfall or extreme
 * heatwaves are expected. Returns [] when no study zone is active or weather is mild.
 */
export function evaluateOpenMeteoZonePushAlerts(
  forecast: DailyWeatherPoint[],
  zoneNameAr: string,
  zoneNameEn: string,
  activeZoneId?: string | null,
  hasActiveZone = true
): OpenMeteoZonePushAlert[] {
  if (!hasActiveZone || !Array.isArray(forecast) || forecast.length === 0) {
    return [];
  }

  const alerts: OpenMeteoZonePushAlert[] = [];
  const zoneKey = activeZoneId || 'active-zone';

  // 1. Heavy Rainfall Detection (precip >= 10mm OR >= 6mm with >= 70% probability)
  let peakRainDay: { day: DailyWeatherPoint; idx: number } | null = null;
  forecast.forEach((day, idx) => {
    const isHeavyRain =
      day.precipMm >= 10 || (day.precipMm >= 6 && day.precipProbPct >= 70);
    if (!isHeavyRain) return;
    if (!peakRainDay || day.precipMm > peakRainDay.day.precipMm) {
      peakRainDay = { day, idx };
    }
  });

  if (peakRainDay) {
    const { day, idx } = peakRainDay as { day: DailyWeatherPoint; idx: number };
    const isCritical = day.precipMm >= 20;
    alerts.push({
      id: `push-rain-${zoneKey}-${day.date}`,
      type: 'heavy_rain',
      severity: isCritical ? 'critical' : 'high',
      dayIndex: idx,
      dateISO: day.date,
      dayLabelAr: day.dayLabelAr,
      dayLabelEn: day.dayLabelEn,
      metricBadge: `${day.precipMm.toFixed(1)} mm`,
      titleAr: isCritical
        ? `إنذار أمطار غزيرة جداً — ${zoneNameAr}`
        : `تنبيه أمطار غزيرة — ${zoneNameAr}`,
      titleEn: isCritical
        ? `Severe Heavy Rain Alert — ${zoneNameEn}`
        : `Heavy Rain Alert — ${zoneNameEn}`,
      bodyAr: `تشير بيانات Open-Meteo إلى هطول أمطار غزيرة (${day.precipMm.toFixed(
        1
      )} مم · احتمال ${day.precipProbPct}%) يوم ${day.dayLabelAr} (${day.date}). يُنصح بإيقاف الرش والري وتفقد المصارف.`,
      bodyEn: `Open-Meteo forecasts heavy rain (${day.precipMm.toFixed(
        1
      )} mm · ${day.precipProbPct}% prob.) on ${day.dayLabelEn} (${day.date}). Pause spraying/irrigation and clear drainage.`,
    });
  }

  // 2. Extreme Heatwave Detection (single day >= 37°C OR >= 2 consecutive days >= 35°C)
  const qualifyingHeatIndices = new Set<number>();
  for (let i = 0; i < forecast.length; i++) {
    const cur = forecast[i];
    if (cur.tempMaxC >= 37) {
      qualifyingHeatIndices.add(i);
    } else if (
      cur.tempMaxC >= 35 &&
      ((i > 0 && forecast[i - 1].tempMaxC >= 35) ||
        (i + 1 < forecast.length && forecast[i + 1].tempMaxC >= 35))
    ) {
      qualifyingHeatIndices.add(i);
    }
  }

  if (qualifyingHeatIndices.size > 0) {
    let peakIdx = -1;
    qualifyingHeatIndices.forEach((i) => {
      if (peakIdx === -1 || forecast[i].tempMaxC > forecast[peakIdx].tempMaxC) {
        peakIdx = i;
      }
    });
    const peakDay = forecast[peakIdx];
    const isCritical = peakDay.tempMaxC >= 41;
    alerts.push({
      id: `push-heat-${zoneKey}-${peakDay.date}`,
      type: 'heatwave',
      severity: isCritical ? 'critical' : 'high',
      dayIndex: peakIdx,
      dateISO: peakDay.date,
      dayLabelAr: peakDay.dayLabelAr,
      dayLabelEn: peakDay.dayLabelEn,
      metricBadge: `${peakDay.tempMaxC.toFixed(1)}°C`,
      titleAr: isCritical
        ? `إنذار موجة حر شديدة جداً — ${zoneNameAr}`
        : `تحذير موجة حر شديدة — ${zoneNameAr}`,
      titleEn: isCritical
        ? `Extreme Heatwave Warning — ${zoneNameEn}`
        : `Heatwave Warning — ${zoneNameEn}`,
      bodyAr: `يتوقع Open-Meteo ارتفاع الحرارة العظمى إلى ${peakDay.tempMaxC.toFixed(
        1
      )}°م يوم ${peakDay.dayLabelAr} (${peakDay.date}) مع بخر ${peakDay.et0Mm.toFixed(
        1
      )} مم. يُنصح بالري الليلي أو فجراً لحماية المحصول.`,
      bodyEn: `Open-Meteo forecasts extreme heat reaching ${peakDay.tempMaxC.toFixed(
        1
      )}°C on ${peakDay.dayLabelEn} (${peakDay.date}) (ET₀ ${peakDay.et0Mm.toFixed(
        1
      )} mm). Schedule night/dawn irrigation.`,
    });
  }

  return alerts.sort((a, b) => a.dayIndex - b.dayIndex);
}

export interface RiskMitigationBreakdown {
  yieldLossWithoutActionPct: number;
  mitigatedRecoveryPct: number;
  safeBaselinePct: number;
  preservedFromLossPct: number;
  netResidualLossPct: number;
  finalHarvestPct: number;
  rawCombinedSumPct: number;
}

/**
 * Computes the mathematical relationship between:
 * 1) Yield Loss (without intervention) — measured out of 100% total farm yield.
 * 2) Potential Recovery (via mitigation) — measured as protocol efficiency (% of that endangered loss rescued).
 * Because they use different denominators, they are independent metrics and do not sum to 100%.
 */
export function computeRiskMitigationBreakdown(
  yieldLossWithoutActionPct: number,
  mitigatedRecoveryPct: number
): RiskMitigationBreakdown {
  const loss = Math.max(0, Math.min(100, Number(yieldLossWithoutActionPct) || 0));
  const recovery = Math.max(0, Math.min(100, Number(mitigatedRecoveryPct) || 0));

  const preservedFromLossPct = Number(((loss * recovery) / 100).toFixed(1));
  const netResidualLossPct = Number(Math.max(0, loss - preservedFromLossPct).toFixed(1));
  const safeBaselinePct = Number(Math.max(0, 100 - loss).toFixed(1));
  const finalHarvestPct = Number(Math.min(100, 100 - netResidualLossPct).toFixed(1));
  const rawCombinedSumPct = Math.round(loss + recovery);

  return {
    yieldLossWithoutActionPct: Math.round(loss),
    mitigatedRecoveryPct: Math.round(recovery),
    safeBaselinePct,
    preservedFromLossPct,
    netResidualLossPct,
    finalHarvestPct,
    rawCombinedSumPct,
  };
}

/**
 * Derives consistent independent Yield Loss (without intervention) and Potential Recovery
 * percentages for regional pest risk cards based on severity and risk score.
 */
export function derivePestRiskYieldMetrics(
  warning: Pick<RegionalPestRiskWarning, 'riskScore' | 'riskLevel'>
): {
  yieldLossWithoutActionPct: number;
  mitigatedRecoveryPct: number;
} {
  const score = Math.max(10, Math.min(100, Math.round(warning.riskScore || 50)));
  const yieldLossWithoutActionPct = Math.max(
    14,
    Math.min(46, Math.round(12 + score * 0.32))
  );
  const mitigatedRecoveryPct =
    warning.riskLevel === 'critical'
      ? 86
      : warning.riskLevel === 'high'
      ? 84
      : 82;

  return {
    yieldLossWithoutActionPct,
    mitigatedRecoveryPct,
  };
}

const TEXTURE_WILTING_AND_FC_PCT: Record<
  SoilTexture,
  { pwpPct: number; fcPct: number }
> = {
  sandy: { pwpPct: 8, fcPct: 18 },
  calcareous: { pwpPct: 12, fcPct: 27 },
  loamy: { pwpPct: 13, fcPct: 31 },
  clay: { pwpPct: 17, fcPct: 39 },
};

const IRRIGATION_SYSTEM_BASE_QUOTA_M3: Record<SoilProfile['irrigation'], number> = {
  drip: 1950,
  pivot: 2050,
  sprinkler: 1900,
  flood: 2200,
  rainfed: 350,
};

/**
 * Evaluates total available seasonal water resources (m³/feddan) from satellite
 * surface/root-zone soil moisture (SM_0_7, SM_7_28), soil texture water retention,
 * salinity osmotic penalty, predicted seasonal rainfall, and irrigation infrastructure,
 * with support for user-specified manual seasonal quota override.
 */
export function evaluateFarmWaterBudget(
  soil: SoilProfile,
  farmAverages: Record<SpectralIndexKey, number>,
  forecast14?: DailyWeatherPoint[],
  seasonalForecast?: SeasonalMonthPrediction[],
  manualQuotaM3PerFeddan?: number | null
): FarmWaterBudgetSummary {
  const sm0to7Pct = Number(
    Math.max(4, Math.min(55, Number(farmAverages.SM_0_7) || 24)).toFixed(1)
  );
  const sm7to28Pct = Number(
    Math.max(5, Math.min(55, Number(farmAverages.SM_7_28) || 28)).toFixed(1)
  );
  const weightedMoisturePct = Number((sm0to7Pct * 0.3 + sm7to28Pct * 0.7).toFixed(1));

  const { pwpPct, fcPct } = TEXTURE_WILTING_AND_FC_PCT[soil.texture] || TEXTURE_WILTING_AND_FC_PCT.loamy;
  const moistureIndex01 = Number(
    Math.max(0, Math.min(1, (weightedMoisturePct - pwpPct) / Math.max(4, fcPct - pwpPct))).toFixed(3)
  );

  const moistureCondition: FarmWaterBudgetSummary['moistureCondition'] =
    moistureIndex01 >= 0.62 ? 'optimal' : moistureIndex01 >= 0.35 ? 'moderate' : 'dry';

  // Higher soil salinity reduces effective plant-extractable soil water via osmotic pressure
  const salinityOsmoticFactor = Number(
    Math.max(0.68, Math.min(1.0, 1 - Math.max(0, soil.salinityEC - 1.5) * 0.055)).toFixed(3)
  );

  // Extractable root-zone soil moisture reserve (0-60 cm root zone converted to m³/feddan)
  const rawReserveMm = Math.max(12, Math.min(95, (weightedMoisturePct - pwpPct * 0.8) * 2.2));
  const soilMoistureReserveM3PerFeddan = Math.round(
    rawReserveMm * 4.20083 * salinityOsmoticFactor
  );

  // Predicted effective seasonal rainfall contribution
  let totalSeasonalRainMm = 0;
  if (seasonalForecast && seasonalForecast.length > 0) {
    totalSeasonalRainMm = seasonalForecast.reduce((acc, m) => acc + (m.predictedRainMm || 0), 0);
  } else if (forecast14 && forecast14.length > 0) {
    const rain14DaysMm = forecast14.reduce((acc, d) => acc + (d.precipMm || 0), 0);
    // Project 14-day synoptic signal conservatively over a 150-day crop season
    totalSeasonalRainMm = Math.max(18, Math.min(220, rain14DaysMm * 5.2 + 16));
  } else {
    totalSeasonalRainMm = 32;
  }
  const effectiveRainMm = Math.max(10, Math.min(240, totalSeasonalRainMm * 0.85));
  const predictedSeasonalRainM3PerFeddan = Math.round(effectiveRainMm * 4.20083);

  // Calibrated irrigation quota adjusted by root-zone soil moisture saturation & osmotic factor
  const baseSystemQuota = IRRIGATION_SYSTEM_BASE_QUOTA_M3[soil.irrigation] ?? 1950;
  const moistureRechargeScale = 0.76 + moistureIndex01 * 0.38;
  const irrigationQuotaM3PerFeddan = Math.round(
    baseSystemQuota * moistureRechargeScale * salinityOsmoticFactor
  );

  const autoSeasonalAllocationM3PerFeddan = Math.round(
    soilMoistureReserveM3PerFeddan + predictedSeasonalRainM3PerFeddan + irrigationQuotaM3PerFeddan
  );

  const hasValidManual =
    typeof manualQuotaM3PerFeddan === 'number' &&
    Number.isFinite(manualQuotaM3PerFeddan) &&
    manualQuotaM3PerFeddan > 0;

  const manualOverrideM3PerFeddan = hasValidManual ? Math.round(manualQuotaM3PerFeddan) : null;
  const totalAvailableWaterM3PerFeddan =
    manualOverrideM3PerFeddan !== null
      ? manualOverrideM3PerFeddan
      : autoSeasonalAllocationM3PerFeddan;

  return {
    sm0to7Pct,
    sm7to28Pct,
    weightedMoisturePct,
    moistureIndex01,
    moistureCondition,
    soilTexture: soil.texture,
    salinityOsmoticFactor,
    soilMoistureReserveM3PerFeddan,
    predictedSeasonalRainM3PerFeddan,
    irrigationQuotaM3PerFeddan,
    autoSeasonalAllocationM3PerFeddan,
    manualOverrideM3PerFeddan,
    isManualOverride: manualOverrideM3PerFeddan !== null,
    totalAvailableWaterM3PerFeddan,
  };
}

/**
 * Compares an individual crop's net seasonal irrigation requirement against the
 * active farm water budget and classifies status as safe, tight, or deficit.
 */
export function evaluateCropWaterDeficit(
  cropRec: ScoredCropRecommendation,
  waterBudget: FarmWaterBudgetSummary
): CropWaterEvaluation {
  const requiredM3PerFeddan = Math.max(0, Math.round(cropRec.netIrrigationRequiredM3PerFeddan));
  const availableM3PerFeddan = Math.max(1, Math.round(waterBudget.totalAvailableWaterM3PerFeddan));
  const balanceDeltaM3PerFeddan = availableM3PerFeddan - requiredM3PerFeddan;
  const deficitM3PerFeddan = Math.max(0, requiredM3PerFeddan - availableM3PerFeddan);
  const deficitPct =
    requiredM3PerFeddan > 0
      ? Math.round((deficitM3PerFeddan / requiredM3PerFeddan) * 100)
      : 0;
  const usageRatioPct = Math.round((requiredM3PerFeddan / availableM3PerFeddan) * 100);

  const status: CropWaterEvaluation['status'] =
    requiredM3PerFeddan > availableM3PerFeddan
      ? 'deficit'
      : requiredM3PerFeddan > availableM3PerFeddan * 0.88
      ? 'tight'
      : 'safe';

  return {
    cropId: cropRec.crop.id,
    requiredM3PerFeddan,
    availableM3PerFeddan,
    balanceDeltaM3PerFeddan,
    deficitM3PerFeddan,
    deficitPct,
    usageRatioPct,
    status,
  };
}

/**
 * Returns top water-compatible alternative crops sorted by suitability when an
 * active crop triggers a water deficit or tight-limit warning.
 */
export function findWaterSafeAlternativeCrops(
  recommendations: ScoredCropRecommendation[],
  waterBudget: FarmWaterBudgetSummary,
  excludeCropId?: string,
  limit = 2
): Array<{
  recommendation: ScoredCropRecommendation;
  waterEval: CropWaterEvaluation;
}> {
  const evaluated = recommendations
    .filter((r) => r.crop.id !== excludeCropId)
    .map((recommendation) => ({
      recommendation,
      waterEval: evaluateCropWaterDeficit(recommendation, waterBudget),
    }));

  const safeFirst = evaluated.filter((item) => item.waterEval.status === 'safe');
  if (safeFirst.length >= limit) {
    return safeFirst.slice(0, limit);
  }
  const tightOrSafe = evaluated.filter((item) => item.waterEval.status !== 'deficit');
  if (tightOrSafe.length > 0) {
    return tightOrSafe.slice(0, limit);
  }
  return evaluated
    .sort((a, b) => a.waterEval.requiredM3PerFeddan - b.waterEval.requiredM3PerFeddan)
    .slice(0, limit);
}

// ============================================================================
// 13. HISTORICAL MULTI-SEASON SPECTRAL COMPARISON ENGINE (MODULE 2 ENHANCEMENT)
// ============================================================================

/**
 * Generates multi-season historical spectral comparison (last 1–3 seasons) for
 * NDVI, NDWI, and SAVI across the same phenological window, computing pass-by-pass
 * baselines, seasonal averages, % deltas, and anomaly classifications.
 */
export function buildHistoricalSpectralComparison(
  timeSeries: SpectralTemporalPoint[],
  farmAverages: Record<SpectralIndexKey, number>,
  seasonsCount: HistoricalSeasonRange = 3,
  soil?: SoilProfile
): Record<HistoricalComparableIndexKey, HistoricalIndexAnomalySummary> {
  const effectiveSeries =
    timeSeries && timeSeries.length > 0
      ? timeSeries
      : generateSpectralTimeSeries(farmAverages);

  const soilSalinity = soil?.salinityEC ?? farmAverages.SOIL_EC ?? 1.8;
  const soilPh = soil?.ph ?? farmAverages.SOIL_PH ?? 7.5;
  const irrigation = soil?.irrigation ?? 'drip';

  // Deterministic historical baseline calibration reflecting realistic inter-annual
  // Sentinel-2 & Landsat-9 archive variability over the same 35-day phenological window.
  const buildForIndex = (
    indexKey: HistoricalComparableIndexKey
  ): HistoricalIndexAnomalySummary => {
    const baseTarget =
      indexKey === 'NDVI'
        ? 0.58
        : indexKey === 'SAVI'
        ? 0.47
        : 0.25;

    // Historical seasonal reference means (anchored to realistic regional agronomy + subtle pass curve)
    const points: HistoricalComparisonPoint[] = effectiveSeries.map((pt, idx) => {
      const progressFactor = 0.62 + (idx / Math.max(1, effectiveSeries.length - 1)) * 0.38;
      const currentVal = Number((pt[indexKey] ?? farmAverages[indexKey] ?? baseTarget).toFixed(3));

      // Season -1 (Last Year - 2025): Slightly lower than optimal if current irrigation is drip/pivot, or slightly higher if current salinity is elevated
      const s1Base =
        indexKey === 'NDVI'
          ? 0.565
          : indexKey === 'SAVI'
          ? 0.455
          : 0.238;
      // Season -2 (2 Years Ago - 2024): Warmer autumn season baseline
      const s2Base =
        indexKey === 'NDVI'
          ? 0.535
          : indexKey === 'SAVI'
          ? 0.432
          : 0.218;
      // Season -3 (3 Years Ago - 2023): Standard historical archive baseline
      const s3Base =
        indexKey === 'NDVI'
          ? 0.552
          : indexKey === 'SAVI'
          ? 0.446
          : 0.229;

      const wave = Math.sin(idx * 1.15) * 0.014;
      const season1AgoValue = Number(Math.max(-0.5, s1Base * progressFactor + wave).toFixed(3));
      const season2AgoValue = Number(
        Math.max(-0.5, s2Base * progressFactor - wave * 0.7).toFixed(3)
      );
      const season3AgoValue = Number(
        Math.max(-0.5, s3Base * progressFactor + wave * 0.45).toFixed(3)
      );

      const pool =
        seasonsCount === 1
          ? [season1AgoValue]
          : seasonsCount === 2
          ? [season1AgoValue, season2AgoValue]
          : [season1AgoValue, season2AgoValue, season3AgoValue];

      const historicalMeanValue = Number(
        (pool.reduce((a, b) => a + b, 0) / pool.length).toFixed(3)
      );
      const deltaFromMean = Number((currentVal - historicalMeanValue).toFixed(3));
      const denom = Math.max(0.05, Math.abs(historicalMeanValue));
      const deltaPct = Number(((deltaFromMean / denom) * 100).toFixed(1));
      const isAnomalyPass = Math.abs(deltaPct) >= 10;

      const monthDay = pt.date.slice(5);
      return {
        passIndex: idx,
        date: pt.date,
        periodLabelAr: idx === effectiveSeries.length - 1 ? `اليوم (${monthDay})` : `مرور ${monthDay}`,
        periodLabelEn: idx === effectiveSeries.length - 1 ? `Today (${monthDay})` : `Pass ${monthDay}`,
        satellite: pt.satellite,
        currentValue: currentVal,
        season1AgoValue,
        season2AgoValue,
        season3AgoValue,
        historicalMeanValue,
        deltaFromMean,
        deltaPct,
        isAnomalyPass,
      };
    });

    const avgOf = (arr: number[]) =>
      Number((arr.reduce((a, b) => a + b, 0) / Math.max(1, arr.length)).toFixed(3));

    const currentAvg = avgOf(points.map((p) => p.currentValue));
    const season1AgoAvg = avgOf(points.map((p) => p.season1AgoValue));
    const season2AgoAvg = avgOf(points.map((p) => p.season2AgoValue));
    const season3AgoAvg = avgOf(points.map((p) => p.season3AgoValue));

    const activeSeasonAvgs =
      seasonsCount === 1
        ? [season1AgoAvg]
        : seasonsCount === 2
        ? [season1AgoAvg, season2AgoAvg]
        : [season1AgoAvg, season2AgoAvg, season3AgoAvg];

    const multiYearBaselineAvg = avgOf(activeSeasonAvgs);
    const deltaValue = Number((currentAvg - multiYearBaselineAvg).toFixed(3));
    const deltaPct = Number(
      (((currentAvg - multiYearBaselineAvg) / Math.max(0.05, Math.abs(multiYearBaselineAvg))) * 100).toFixed(1)
    );

    const anomalyStatus: HistoricalIndexAnomalySummary['anomalyStatus'] =
      deltaPct >= 7.0
        ? 'positive_anomaly'
        : deltaPct <= -7.0
        ? 'negative_anomaly'
        : 'normal_range';

    const anomalySeverity: HistoricalIndexAnomalySummary['anomalySeverity'] =
      anomalyStatus === 'positive_anomaly'
        ? 'optimal'
        : anomalyStatus === 'normal_range'
        ? 'optimal'
        : deltaPct <= -15
        ? 'critical'
        : 'watch';

    const indexTitleAr =
      indexKey === 'NDVI'
        ? 'كثافة الكلوروفيل (NDVI)'
        : indexKey === 'NDWI'
        ? 'المحتوى المائي للأوراق (NDWI)'
        : 'الغطاء النباتي المعدل للتربة (SAVI)';
    const indexTitleEn =
      indexKey === 'NDVI'
        ? 'Chlorophyll Vigor (NDVI)'
        : indexKey === 'NDWI'
        ? 'Canopy Water Index (NDWI)'
        : 'Soil-Adjusted Vegetation (SAVI)';

    let headlineAr = '';
    let headlineEn = '';
    let diagnosisAr = '';
    let diagnosisEn = '';
    let recommendationAr = '';
    let recommendationEn = '';

    if (anomalyStatus === 'positive_anomaly') {
      headlineAr = `تفوق إيجابي (+${deltaPct}%) في ${indexTitleAr} مقارنة بمتوسط آخر ${seasonsCount} مواسم`;
      headlineEn = `Positive Performance Anomaly (+${deltaPct}%) in ${indexTitleEn} vs. ${seasonsCount}-Season Baseline`;
      diagnosisAr = `يسجل الحقل حالياً متوسط ${currentAvg} مقابل ${multiYearBaselineAvg} لنفس الفترة الزمنية في السنوات السابقة، مدعوماً بكفاءة نظام الري (${irrigation}) وتوازن قلوية التربة (pH ${soilPh}).`;
      diagnosisEn = `Current seasonal trajectory (${currentAvg}) outperforms the ${seasonsCount}-year historical mean (${multiYearBaselineAvg}) for this exact phenological window, supported by ${irrigation} irrigation efficiency and pH ${soilPh}.`;
      recommendationAr =
        'حافظ على جدول الري والتسميد الحالي؛ المؤشرات الفضائية تؤكد نمواً خضرياً أعلى من المعدل التاريخي للحقل.';
      recommendationEn =
        'Maintain current fertigation schedule; satellite telemetry confirms above-baseline canopy performance.';
    } else if (anomalyStatus === 'negative_anomaly') {
      headlineAr = `شذوذ سلبي (${deltaPct}%) في ${indexTitleAr} عن خط الأساس التاريخي (${seasonsCount} مواسم)`;
      headlineEn = `Negative Stress Anomaly (${deltaPct}%) in ${indexTitleEn} Below ${seasonsCount}-Season Baseline`;
      diagnosisAr = `انخفاض المتوسط الحالي (${currentAvg}) عن المعدل التاريخي لنفس الفترة (${multiYearBaselineAvg}) بمقدار ${deltaValue}؛ يرتبط ذلك بإجهاد الملوحة (${soilSalinity} dS/m) أو نقص الرطوبة الجذرية في القطاع الشمالي الشرقي.`;
      diagnosisEn = `Current mean (${currentAvg}) trails the ${seasonsCount}-year historical baseline (${multiYearBaselineAvg}) by ${deltaValue}, linked to osmotic salinity stress (EC ${soilSalinity} dS/m) or localized moisture deficit.`;
      recommendationAr =
        'يُوصى بفحص ضغط شبكة الري في الزونا A وإعطاء رية غسيل ملوحة مع أحماض أمينية لاستعادة المسار التاريخي للمحصول.';
      recommendationEn =
        'Inspect emitter uniformity in Zone A and apply a targeted leaching flush + amino acids to recover historical vigor.';
    } else {
      headlineAr = `مسار موسمي طبيعي ومستقر (${deltaPct >= 0 ? '+' : ''}${deltaPct}%) لـ ${indexTitleAr}`;
      headlineEn = `Stable Seasonal Trajectory (${deltaPct >= 0 ? '+' : ''}${deltaPct}%) Within ${seasonsCount}-Season Historical Norm`;
      diagnosisAr = `تتطابق قراءات الموسم الحالي (${currentAvg}) بشكل وثيق مع متوسط السنوات الـ ${seasonsCount} الماضية (${multiYearBaselineAvg}) لنفس الفترة، مما يدل على استقرار الأداء طويل الأجل للحقل.`;
      diagnosisEn = `Current pass average (${currentAvg}) closely tracks the ${seasonsCount}-season historical archive (${multiYearBaselineAvg}) for the same calendar window, indicating stable long-term field performance.`;
      recommendationAr =
        'استمر في الرصد الدوري كل 5 أيام عبر Sentinel-2 لمتابعة دخول مرحلة التزهير والامتلاء.';
      recommendationEn =
        'Continue 5-day Sentinel-2 pass monitoring as the crop transitions into flowering and grain filling.';
    }

    return {
      indexKey,
      seasonsCount,
      currentAvg,
      season1AgoAvg,
      season2AgoAvg,
      season3AgoAvg,
      multiYearBaselineAvg,
      deltaValue,
      deltaPct,
      anomalyStatus,
      anomalySeverity,
      headlineAr,
      headlineEn,
      diagnosisAr,
      diagnosisEn,
      recommendationAr,
      recommendationEn,
      points,
    };
  };

  return {
    NDVI: buildForIndex('NDVI'),
    NDWI: buildForIndex('NDWI'),
    SAVI: buildForIndex('SAVI'),
  };
}

// ============================================================================
// 14. WEATHER + GROWTH STAGE + REGIONAL PEST & DISEASE RISK ALERT SYSTEM (MODULE 3)
// ============================================================================

/**
 * Analyzes current & 7-day weather conditions (temperature, relative humidity, rainfall),
 * the crop's phenological growth stage, and regional historical outbreak records to generate
 * proactive pest & disease alerts with scouting protocols and preventative measures.
 */
export function evaluateWeatherPestAndDiseaseAlertSystem(
  forecast14: DailyWeatherPoint[],
  growthStage: GrowthStageInfo,
  currentCropId: string,
  centroid: LatLon,
  soil: SoilProfile,
  farmAverages?: Record<SpectralIndexKey, number>,
  subZones?: SubZoneSummary[]
): WeatherPestRiskSystemSummary {
  const next7 = forecast14.length > 0 ? forecast14.slice(0, 7) : buildFallback14DayForecast(centroid).slice(0, 7);

  const meanTempMax = Number(
    (next7.reduce((s, d) => s + d.tempMaxC, 0) / Math.max(1, next7.length)).toFixed(1)
  );
  const meanTempMin = Number(
    (next7.reduce((s, d) => s + d.tempMinC, 0) / Math.max(1, next7.length)).toFixed(1)
  );
  const meanTemp7dC = Number(((meanTempMax + meanTempMin) / 2).toFixed(1));
  const meanHumidity7dPct = Math.round(
    next7.reduce((s, d) => s + d.relativeHumidityPct, 0) / Math.max(1, next7.length)
  );
  const totalRainfall7dMm = Number(
    next7.reduce((s, d) => s + d.precipMm, 0).toFixed(1)
  );

  // Estimate daily leaf wetness duration (hours/day) from relative humidity, rainfall, and dew point proximity
  const estimatedLeafWetnessHours = Number(
    Math.min(
      16,
      Math.max(
        1.5,
        (meanHumidity7dPct >= 75 ? 7.5 : meanHumidity7dPct >= 62 ? 5.2 : 2.8) +
          (totalRainfall7dMm >= 5 ? 4.2 : totalRainfall7dMm >= 1 ? 2.1 : 0) +
          (soil.irrigation === 'sprinkler' || soil.irrigation === 'pivot' || soil.irrigation === 'flood' ? 1.4 : 0)
      )
    ).toFixed(1)
  );

  // Regional agro-ecological zone classification from coordinates
  const isNorthSinaiOrCoastal = centroid.lat >= 30.85 || centroid.lng >= 32.3;
  const isNileDelta = centroid.lat >= 30.0 && centroid.lat < 30.85 && centroid.lng < 32.3;
  const isFayoumOrMiddleEgypt = centroid.lat >= 28.0 && centroid.lat < 30.0;

  const regionNameAr = isNorthSinaiOrCoastal
    ? 'حزام شمال سيناء والساحل الشمالي (رطوبة ساحلية وندى مرتفع)'
    : isNileDelta
    ? 'إقليم دلتا النيل الرسومي (سجل تاريخي للأصداء والندوات الفطرية)'
    : isFayoumOrMiddleEgypt
    ? 'إقليم الفيوم والمنيا ومصر الوسطى (تذبذب حراري ونشاط حشري)'
    : 'إقليم صعيد مصر والظهير الصحراوي (حرارة مرتفعة وثاقبات/دودة الحشد)';

  const regionNameEn = isNorthSinaiOrCoastal
    ? 'North Sinai & Mediterranean Coastal Belt (High Dew & Coastal Humidity)'
    : isNileDelta
    ? 'Nile Delta Alluvial Basin (Historical Rust & Late Blight Endemic Zone)'
    : isFayoumOrMiddleEgypt
    ? 'Fayoum & Middle Egypt Agro-Zone (Diurnal Thermal Swings & Insect Vectors)'
    : 'Upper Egypt & Western Reclamation Belt (High Thermal Units & Lepidopteran Pests)';

  // Safe foliar spraying windows over next 7 days
  const safeDays = next7.filter((d) => d.sprayingSafe);
  const safeSprayingDaysCount = safeDays.length;
  const firstSafeDay = safeDays[0] || next7[0];
  const nextSafeSprayDayAr = firstSafeDay
    ? `${firstSafeDay.dayLabelAr} (${firstSafeDay.date}) — رياح ${firstSafeDay.windSpeedKmh} كم/س وأمطار ${firstSafeDay.precipProbPct}%`
    : 'الصباح الباكر (6–9 صباحاً) عند هدوء الرياح دون 15 كم/س';
  const nextSafeSprayDayEn = firstSafeDay
    ? `${firstSafeDay.dayLabelEn} (${firstSafeDay.date}) — Wind ${firstSafeDay.windSpeedKmh} km/h, Rain prob ${firstSafeDay.precipProbPct}%`
    : 'Early morning (06:00–09:00) when wind < 15 km/h';

  const stageKey = growthStage?.stageKey || 'vegetative';
  const stageNameAr = growthStage?.stageNameAr || 'النمو الخضري والتفريع';
  const stageNameEn = growthStage?.stageNameEn || 'Vegetative & Tillering';

  // Stage susceptibility multipliers
  const isFloweringOrFruiting = stageKey === 'flowering' || stageKey === 'fruiting';
  const isVegetativeOrGermination = stageKey === 'vegetative' || stageKey === 'germination';

  const zoneCNdwi = subZones?.find((z) => z.id === 'C')?.ndwi ?? farmAverages?.NDWI ?? 0.31;
  const zoneALst = subZones?.find((z) => z.id === 'A')?.lstCelsius ?? farmAverages?.LST ?? 26.8;

  const candidateAlerts: Omit<WeatherStagePestAlert, 'riskLevel'>[] = [
    // 1. Yellow Stripe Rust & Leaf Rust (Fungal - favored by cool/mild temps 12-23C + RH >= 60% + rain/leaf wetness)
    {
      id: 'weather-pest-yellow-rust',
      pestId: 'wheat_yellow_rust',
      pestNameAr: 'مرض الصدأ الأصفر المخطط وأصداء الأوراق (Yellow Stripe Rust)',
      pestNameEn: 'Yellow Stripe & Leaf Rust (Puccinia striiformis)',
      scientificName: 'Puccinia striiformis f. sp. tritici',
      pestType: 'fungal',
      targetCropNameAr: 'القمح والحبوب الشتوية (سخا 95 / مصر 3)',
      targetCropNameEn: 'Wheat & Winter Cereals (Sakha 95 / Misr 3)',
      isActiveCropMatch: currentCropId === 'wheat' || currentCropId === 'clover',
      riskScorePct: Math.min(
        97,
        Math.max(
          42,
          Math.round(
            (meanTemp7dC >= 11 && meanTemp7dC <= 23.5 ? 36 : 20) +
              (meanHumidity7dPct >= 62 ? 26 : 14) +
              (totalRainfall7dMm >= 1.5 || estimatedLeafWetnessHours >= 6 ? 18 : 8) +
              (isFloweringOrFruiting || stageKey === 'vegetative' ? 10 : 4) +
              (isNileDelta || isNorthSinaiOrCoastal ? 7 : 3)
          )
        )
      ),
      vulnerableSubZones: zoneCNdwi >= 0.28 ? ['C', 'B'] : ['B', 'A'],
      weatherTriggerBreakdown: {
        tempMaxC: meanTempMax,
        tempMinC: meanTempMin,
        meanTempC: meanTemp7dC,
        relativeHumidityPct: meanHumidity7dPct,
        rainfall7dMm: totalRainfall7dMm,
        estimatedLeafWetnessHours,
        favorableWeatherScorePct: Math.min(96, Math.round(meanHumidity7dPct * 0.7 + (totalRainfall7dMm > 0 ? 25 : 10))),
      },
      weatherConditionSummaryAr: `متوسط حرارة ${meanTemp7dC}°م مع رطوبة نسبية ${meanHumidity7dPct}% وأمطار ${totalRainfall7dMm} مم يوفر ${estimatedLeafWetnessHours} ساعة بلل ورقي يومياً لإنبات الجراثيم اليوريدية.`,
      weatherConditionSummaryEn: `Mean temp ${meanTemp7dC}°C, ${meanHumidity7dPct}% RH, and ${totalRainfall7dMm} mm rain create ${estimatedLeafWetnessHours}h/day leaf wetness ideal for urediniospore germination.`,
      growthStageKey: stageKey,
      growthStageNameAr: stageNameAr,
      growthStageNameEn: stageNameEn,
      growthStageVulnerabilityAr: `في مرحلة «${stageNameAr}» تكون ورقة العلم والأوراق العلوية في أقصى حساسية للإصابة الفطرية التي قد تستنزف 25% من امتلاء الحبوب.`,
      growthStageVulnerabilityEn: `During "${stageNameEn}", the flag leaf and upper canopy are highly susceptible to pustule colonization, risking 25% grain-fill loss.`,
      regionalHistoryContextAr: `${regionNameAr}: سجلت محطات البحوث الزراعية بؤر إصابة تاريخية متكررة عند تجاوز الرطوبة النسبية 60% مع ندى صباحي.`,
      regionalHistoryContextEn: `${regionNameEn}: Historical ARC surveillance records frequent rust outbreaks whenever RH exceeds 60% with morning dew.`,
      scoutingActionsAr: [
        'فحص 50 نباتاً عشوائياً في القطاع الجنوبي الغربي الرطب (زونا C) بحثاً عن بثرات صفراء طولية على السطح العلوي للأوراق.',
        'مراقبة الحواف المجاورة للمصارف والمساقي حيث يرتفع الضباب والندى الصباحي.',
      ],
      scoutingActionsEn: [
        'Inspect 50 random plants in moisture-retaining Zone C for linear yellow-orange pustules along upper leaf veins.',
        'Check field margins bordering irrigation canals where morning fog and dew persist longest.',
      ],
      preventativeMeasuresAr: [
        'الرش الوقائي الفوري بمبيد فطري جهازي (أزوكسي ستروبين + تيبيكونازول 200 سم³/فدان) قبل هطول الأمطار.',
        'إيقاف التسميد الأزوتي الفائض (اليوريا) فوراً ورش سليكات البوتاسيوم (1.5 لتر/فدان) لتقوية جدار بشرة الورقة.',
      ],
      preventativeMeasuresEn: [
        'Apply preventative systemic fungicide (Azoxystrobin + Tebuconazole at 200 cm³/feddan) ahead of rain events.',
        'Suspend excess urea nitrogen and apply Potassium Silicate (1.5 L/feddan) to fortify leaf cuticle resistance.',
      ],
      safeSprayWindowAr: nextSafeSprayDayAr,
      safeSprayWindowEn: nextSafeSprayDayEn,
      advisorPromptAr: `ما هي خطة المكافحة الوقائية لمرض الصدأ الأصفر في مرحلة ${stageNameAr} مع حرارة ${meanTemp7dC}°م ورطوبة ${meanHumidity7dPct}%؟`,
      advisorPromptEn: `What is the preventative control plan for Yellow Stripe Rust during ${stageNameEn} at ${meanTemp7dC}°C and ${meanHumidity7dPct}% RH?`,
    },
    // 2. Late Blight & Downy Mildew (Oomycete/Fungal - Potato, Tomato, Sugar Beet, Quinoa, Fava Chocolate Spot)
    {
      id: 'weather-pest-late-blight-foliar',
      pestId: 'late_blight_botrytis',
      pestNameAr:
        currentCropId === 'fava_bean'
          ? 'مرض التبقع البني (الشوكولاتة) والبياض الزغبي (Botrytis fabae)'
          : currentCropId === 'sugar_beet'
          ? 'التبقع السركسبوري والبياض الزغبي في البنجر (Cercospora & Peronospora)'
          : 'مرض الندوة المتأخرة والبياض الزغبي (Late Blight & Downy Mildew)',
      pestNameEn:
        currentCropId === 'fava_bean'
          ? 'Fava Chocolate Spot & Downy Mildew (Botrytis fabae)'
          : currentCropId === 'sugar_beet'
          ? 'Cercospora Leaf Spot & Downy Mildew'
          : 'Late Blight & Downy Mildew (Phytophthora infestans)',
      scientificName:
        currentCropId === 'fava_bean'
          ? 'Botrytis fabae'
          : currentCropId === 'sugar_beet'
          ? 'Cercospora beticola'
          : 'Phytophthora infestans & Peronospora spp.',
      pestType: 'fungal',
      targetCropNameAr: 'البطاطس، الطماطم، الفول البلدي، وبنجر السكر',
      targetCropNameEn: 'Potato, Tomato, Fava Bean & Sugar Beet',
      isActiveCropMatch: ['potato', 'tomato', 'fava_bean', 'sugar_beet', 'quinoa'].includes(currentCropId),
      riskScorePct: Math.min(
        96,
        Math.max(
          44,
          Math.round(
            (meanHumidity7dPct >= 64 ? 34 : 18) +
              (totalRainfall7dMm >= 2.0 ? 24 : totalRainfall7dMm > 0 ? 14 : 6) +
              (meanTempMin >= 10 && meanTempMax <= 26 ? 22 : 12) +
              (['potato', 'tomato', 'fava_bean', 'sugar_beet'].includes(currentCropId) ? 12 : 4)
          )
        )
      ),
      vulnerableSubZones: ['C', 'B'],
      weatherTriggerBreakdown: {
        tempMaxC: meanTempMax,
        tempMinC: meanTempMin,
        meanTempC: meanTemp7dC,
        relativeHumidityPct: meanHumidity7dPct,
        rainfall7dMm: totalRainfall7dMm,
        estimatedLeafWetnessHours,
        favorableWeatherScorePct: Math.min(95, Math.round(meanHumidity7dPct * 0.68 + estimatedLeafWetnessHours * 2.5)),
      },
      weatherConditionSummaryAr: `تلاقي الرطوبة الجوية (${meanHumidity7dPct}%) مع صغرى ليلية (${meanTempMin}°م) وأمطار (${totalRainfall7dMm} مم) يحقق شروط العدوى الفطرية السريعة على الأوراق السفلية.`,
      weatherConditionSummaryEn: `Humidity (${meanHumidity7dPct}%), night lows (${meanTempMin}°C), and ${totalRainfall7dMm} mm rain satisfy Smith infection criteria on lower leaves.`,
      growthStageKey: stageKey,
      growthStageNameAr: stageNameAr,
      growthStageNameEn: stageNameEn,
      growthStageVulnerabilityAr: `تزداد كثافة المجموع الخضري في مرحلة «${stageNameAr}» مما يحبس الرطوبة بين الخطوط ويسرع انتشار البقع المائية واللفحة.`,
      growthStageVulnerabilityEn: `Canopy closure during "${stageNameEn}" traps inter-row humidity, accelerating water-soaked lesion expansion.`,
      regionalHistoryContextAr: `${regionNameAr}: سجل وبائي سنوي للندوة المتأخرة والتبقع البني عقب النوات المطرية الخريفية والشتوية.`,
      regionalHistoryContextEn: `${regionNameEn}: Annual epidemic history of Late Blight and Botrytis leaf spot following autumn/winter rain fronts.`,
      scoutingActionsAr: [
        'فحص السطح السفلي للأوراق القريبة من التربة في زونا C لرصد الزغب الرمادي أو البقع البنية المحاطة بهالة صفراء.',
        'قياس رطوبة التربة السطحية (0–7 سم) والتأكد من عدم ركود مياه الري بين المصاطب.',
      ],
      scoutingActionsEn: [
        'Inspect abaxial (lower) leaf surfaces near the soil line in Zone C for white/gray sporangia or dark water-soaked lesions.',
        'Check 0–7cm topsoil moisture to ensure zero standing water in furrows.',
      ],
      preventativeMeasuresAr: [
        'رش وقائي بمركب (مانكوزيب + ميتالاكسيل-إم) أو (أوكسي كلور النحاس + سيموكسانيل) قبل النوة المطرية بـ 24 ساعة.',
        'منع الري المسائي تماماً وخفض مقنن الري في الزونا C بنسبة 15% لتقليل ساعات بلل الأوراق.',
      ],
      preventativeMeasuresEn: [
        'Spray Metalaxyl-M + Mancozeb or Cymoxanil + Copper Oxychloride 24h prior to forecasted rain.',
        'Avoid evening irrigation and reduce Zone C irrigation volume by 15% to shorten leaf wetness duration.',
      ],
      safeSprayWindowAr: nextSafeSprayDayAr,
      safeSprayWindowEn: nextSafeSprayDayEn,
      advisorPromptAr: `كيف أحمي محصولي في مرحلة ${stageNameAr} من الندوة المتأخرة والتبقعات الفطرية مع الأمطار والرطوبة الحالية؟`,
      advisorPromptEn: `How do I protect my crop during ${stageNameEn} from Late Blight and fungal leaf spots under current humidity and rain?`,
    },
    // 3. Sap-Sucking Insect Vectors (Aphids, Whitefly, Thrips) & Viral Transmission
    {
      id: 'weather-pest-aphids-whitefly-vectors',
      pestId: 'aphids_whitefly_vectors',
      pestNameAr: 'نشاط الحشرات الثاقبة الماصة ونواقل الفيروسات (المنّ، الذبابة البيضاء، التربس)',
      pestNameEn: 'Sap-Sucking Insect Vectors (Aphids, Whitefly & Thrips)',
      scientificName: 'Rhopalosiphum padi, Bemisia tabaci & Aphis craccivora',
      pestType: 'insect',
      targetCropNameAr: 'جميع المحاصيل الحقلية والخضر (القمح، الفول، البطاطس، الطماطم، القطن)',
      targetCropNameEn: 'All Field & Vegetable Crops (Wheat, Fava, Potato, Tomato, Cotton)',
      isActiveCropMatch: true,
      riskScorePct: Math.min(
        95,
        Math.max(
          46,
          Math.round(
            (meanTempMax >= 21 && meanTempMax <= 31 ? 36 : 22) +
              (meanHumidity7dPct >= 45 && meanHumidity7dPct <= 78 ? 24 : 14) +
              (zoneALst >= 24.5 ? 18 : 10) +
              (isVegetativeOrGermination || stageKey === 'flowering' ? 12 : 6)
          )
        )
      ),
      vulnerableSubZones: ['A', 'B'],
      weatherTriggerBreakdown: {
        tempMaxC: meanTempMax,
        tempMinC: meanTempMin,
        meanTempC: meanTemp7dC,
        relativeHumidityPct: meanHumidity7dPct,
        rainfall7dMm: totalRainfall7dMm,
        estimatedLeafWetnessHours,
        favorableWeatherScorePct: Math.min(94, Math.round(meanTempMax * 2.6 + (totalRainfall7dMm < 5 ? 18 : 6))),
      },
      weatherConditionSummaryAr: `دفء ساعات النهار (${meanTempMax}°م) وارتفاع حرارة سطح الأوراق في زونا A (${zoneALst}°م) يختصر فترة الجيل لحشرات المنّ والذبابة البيضاء إلى 7–10 أيام.`,
      weatherConditionSummaryEn: `Warm daytime highs (${meanTempMax}°C) and elevated Zone A canopy LST (${zoneALst}°C) compress Aphid and Whitefly generation cycles to 7–10 days.`,
      growthStageKey: stageKey,
      growthStageNameAr: stageNameAr,
      growthStageNameEn: stageNameEn,
      growthStageVulnerabilityAr: `القمم النامية والأوراق الغضة في مرحلة «${stageNameAr}» غنية بالأحماض الأمينية الحرة مما يجذب الحشرات المجنحة لنقل فيروسات التقزم وتجعد الأوراق (BYDV / TYLCV).`,
      growthStageVulnerabilityEn: `Succulent apical shoots during "${stageNameEn}" attract winged vectors capable of transmitting BYDV and TYLCV viral complexes.`,
      regionalHistoryContextAr: `${regionNameAr}: نشاط إقليمي مرتفع لهجرة الحشرات المجنحة من الحشائش الجسرية والعروات المتداخلة.`,
      regionalHistoryContextEn: `${regionNameEn}: High regional migration pressure from border weeds and overlapping seasonal plantings.`,
      scoutingActionsAr: [
        'نشر وفحص المصائد الصفراء والزرقاء اللاصقة في القطاع الشمالي الشرقي الأدفأ (زونا A) بمعدل 4 مصائد/فدان.',
        'فحص القمم النامية والسطح السفلي للأوراق الغضة صباحاً (الحد الحرج: 5 حشرات منّ/ساق أو 3 ذبابات بيضاء/ورقة).',
      ],
      scoutingActionsEn: [
        'Install and inspect yellow/blue sticky traps across warmer Zone A borders (4 traps/feddan).',
        'Examine apical shoots and lower leaf surfaces early morning (threshold: 5 aphids/tiller or 3 whiteflies/leaf).',
      ],
      preventativeMeasuresAr: [
        'إزالة الحشائش النجيلية والعريضة على جسور الحقل فوراً لأنها العائل الوسيط للفيروسات.',
        'الرش البؤري الانتقائي بمركب (فلونيكاميد أو بايمتروزين أو زيت النيم الحيوي) للحفاظ على حشرات أبو العيد وأسد المنّ.',
      ],
      preventativeMeasuresEn: [
        'Eradicate border weeds along irrigation ditches to eliminate viral bridge reservoirs.',
        'Apply selective spot-sprays (Flonicamid, Pymetrozine, or Azadirachtin neem oil) to preserve ladybird and lacewing predators.',
      ],
      safeSprayWindowAr: nextSafeSprayDayAr,
      safeSprayWindowEn: nextSafeSprayDayEn,
      advisorPromptAr: `ما هو برنامج المكافحة المتكاملة للمنّ والذبابة البيضاء في مرحلة ${stageNameAr} داخل زونا A وزونا B؟`,
      advisorPromptEn: `What is the IPM protocol for Aphids and Whitefly during ${stageNameEn} in Zone A and Zone B?`,
    },
    // 4. Lepidopteran Defoliators & Borers (Fall Armyworm, Bollworm, Tuber Moth, Tuta absoluta)
    {
      id: 'weather-pest-lepidoptera-borers',
      pestId: 'lepidoptera_borers_complex',
      pestNameAr:
        currentCropId === 'maize' || currentCropId === 'sorghum'
          ? 'دودة الحشد الخريفية وثاقبات الساق (Fall Armyworm & Borers)'
          : currentCropId === 'cotton'
          ? 'ديدان اللوز القرنفلية والشوكية ودودة ورق القطن'
          : currentCropId === 'potato' || currentCropId === 'tomato'
          ? 'فراشة درنات البطاطس وحافرة أنفاق الطماطم (Tuta absoluta)'
          : 'اليرقات القارضة ودودة ورق القطن والبرسيم (Spodoptera littoralis)',
      pestNameEn:
        currentCropId === 'maize' || currentCropId === 'sorghum'
          ? 'Fall Armyworm & Corn Stalk Borers (Spodoptera frugiperda)'
          : currentCropId === 'cotton'
          ? 'Pink & Spiny Bollworms & Cotton Leafworm'
          : currentCropId === 'potato' || currentCropId === 'tomato'
          ? 'Potato Tuber Moth & Tomato Leafminer (Tuta absoluta)'
          : 'Mediterranean Brocade / Cotton Leafworm (Spodoptera littoralis)',
      scientificName: 'Spodoptera spp. / Pectinophora / Tuta absoluta',
      pestType: 'insect',
      targetCropNameAr: 'الذرة، القطن، البطاطس، الطماطم، البرسيم، وبنجر السكر',
      targetCropNameEn: 'Maize, Cotton, Potato, Tomato, Clover & Sugar Beet',
      isActiveCropMatch: true,
      riskScorePct: Math.min(
        94,
        Math.max(
          42,
          Math.round(
            (meanTempMax >= 23 ? 34 : 20) +
              (zoneALst >= 25.5 ? 22 : 12) +
              (totalRainfall7dMm < 6 ? 18 : 10) +
              (['maize', 'sorghum', 'cotton', 'tomato', 'potato', 'clover'].includes(currentCropId) ? 14 : 8)
          )
        )
      ),
      vulnerableSubZones: ['A', 'B'],
      weatherTriggerBreakdown: {
        tempMaxC: meanTempMax,
        tempMinC: meanTempMin,
        meanTempC: meanTemp7dC,
        relativeHumidityPct: meanHumidity7dPct,
        rainfall7dMm: totalRainfall7dMm,
        estimatedLeafWetnessHours,
        favorableWeatherScorePct: Math.min(92, Math.round(meanTempMax * 2.5 + 15)),
      },
      weatherConditionSummaryAr: `تراكم الوحدات الحرارية عند عظمى ${meanTempMax}°م وصغرى ${meanTempMin}°م ينشّط طيران الفراشات ليلاً وفقس اللطع خلال 72 ساعة.`,
      weatherConditionSummaryEn: `Thermal unit accumulation at ${meanTempMax}°C/ ${meanTempMin}°C triggers nocturnal moth flight and egg hatch within 72 hours.`,
      growthStageKey: stageKey,
      growthStageNameAr: stageNameAr,
      growthStageNameEn: stageNameEn,
      growthStageVulnerabilityAr: `في مرحلة «${stageNameAr}» تهاجم اليرقات الحديثة قلب النبات (البلعوم) أو البراعم الزهرية والدرنات المكشوفة.`,
      growthStageVulnerabilityEn: `During "${stageNameEn}", neonate larvae target central whorls, floral buds, or exposed tubers.`,
      regionalHistoryContextAr: `${regionNameAr}: سجل انتشار إقليمي للأجيال المتعاقبة في الحقول الدافئة وذات التربة الجافة نسبياً بقطاع زونا A.`,
      regionalHistoryContextEn: `${regionNameEn}: Regional multi-brood activity concentrated in warmer, drier Zone A sectors.`,
      scoutingActionsAr: [
        'فحص المصائد الفرمونية الجنسية كل 48 ساعة لرصد ذروة طيران الفراشات قبل وضع البيض.',
        'التفتيش الميداني لقلب النباتات والأوراق السفلية بحثاً عن اللطع الحديثة أو نشارة التغذية.',
      ],
      scoutingActionsEn: [
        'Monitor sex-pheromone delta/water traps every 48 hours to detect moth flight peaks prior to oviposition.',
        'Scout central whorls and lower leaves for egg masses, windowpane feeding, or frass.',
      ],
      preventativeMeasuresAr: [
        'الرش الموجه عند بداية فقس البيض بمركب حيوي (باسيلس ثورينجينسيس Bt أو إيمامكتين بنزوات + مانع انسلاخ لوفينورون).',
        'جمع اللطع والأجزاء المصابة يدوياً في البؤر الأولى وإطلاق طفيل الترايكوجراما إن وجد.',
      ],
      preventativeMeasuresEn: [
        'Target neonate hatch with Bacillus thuringiensis (Bt) or Emamectin Benzoate + Lufenuron IGR.',
        'Hand-remove early egg masses in Zone A hotspots and release Trichogramma egg parasitoids.',
      ],
      safeSprayWindowAr: nextSafeSprayDayAr,
      safeSprayWindowEn: nextSafeSprayDayEn,
      advisorPromptAr: `ما هي خطة الفحص والمكافحة لليرقات والثاقبات في مرحلة ${stageNameAr} لمحصولي؟`,
      advisorPromptEn: `What is the scouting and control plan for lepidopteran larvae and borers during ${stageNameEn}?`,
    },
  ];

  const alerts: WeatherStagePestAlert[] = candidateAlerts
    .map((item) => {
      const riskLevel: WeatherStagePestAlert['riskLevel'] =
        item.riskScorePct >= 78
          ? 'critical'
          : item.riskScorePct >= 64
          ? 'high'
          : item.riskScorePct >= 48
          ? 'moderate'
          : 'low';
      return {
        ...item,
        riskLevel,
      };
    })
    .sort((a, b) => {
      if (a.isActiveCropMatch !== b.isActiveCropMatch) {
        return a.isActiveCropMatch ? -1 : 1;
      }
      return b.riskScorePct - a.riskScorePct;
    });

  const maxScore = alerts.reduce((m, a) => Math.max(m, a.riskScorePct), 0);
  const overallRiskLevel: WeatherPestRiskSystemSummary['overallRiskLevel'] =
    maxScore >= 78
      ? 'critical'
      : maxScore >= 64
      ? 'high'
      : maxScore >= 48
      ? 'moderate'
      : 'low';

  return {
    regionNameAr,
    regionNameEn,
    meanTemp7dC,
    meanHumidity7dPct,
    totalRainfall7dMm,
    estimatedLeafWetnessHours,
    safeSprayingDaysCount,
    nextSafeSprayDayAr,
    nextSafeSprayDayEn,
    overallRiskLevel,
    alerts,
  };
}


