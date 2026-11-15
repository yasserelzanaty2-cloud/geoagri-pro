import {
  DailyWeatherPoint,
  ElevationColorPalette,
  SoilTexture,
  SoilTextureLegendSpec,
  SpectralIndexKey,
  SpatialGridCell,
  ThematicMapLayerId,
  VentuskyAtmosphericOptions,
  VentuskyLiveTelemetryNode,
} from '../types/agro';
import { getSpectralColor } from './agroEngine';
import {
  THEMATIC_MAPS_META,
  evaluateDemDrainageAtLatLon,
  evaluateGlobalDayNightSolarAtLatLon,
  evaluateGlobalElevationAtLatLon,
  evaluateGlobalSnowAndBlizzardAtLatLon,
  evaluateVentuskyLayerAtLatLon,
  getGlobalTemperatureColor,
  getSoilMoistureColorAndRgb,
} from './thematicMapRenderer';

export const SOIL_TEXTURE_ORDER: SoilTexture[] = ['clay', 'loamy', 'sandy', 'calcareous'];

export const SOIL_TEXTURE_LEGEND_SPECS: Record<SoilTexture, SoilTextureLegendSpec> = {
  clay: {
    texture: 'clay',
    nameAr: 'طينية ثقيلة رسوبية (Clay Alluvial)',
    nameEn: 'Heavy Alluvial Clay',
    badgeCode: 'CLAY',
    swatchColor: '#78350f',
    gradientCss: 'linear-gradient(to right, #451a03 0%, #78350f 50%, #92400e 100%)',
    fieldCapacityPct: 42,
    wiltingPointPct: 20,
    availableWaterMmPerM: 220,
    infiltrationRateMmHr: '2 – 6 mm/hr',
    leachingFactor: '×1.00 (احتفاظ عالٍ بالعناصر)',
    descriptionAr:
      'سعة حقلية عالية (42%) واحتفاظ ممتاز بالماء والكاتيونات، مع بطء الصرف وحساسية لتراكم الأملاح عند غياب المصارف.',
    descriptionEn:
      'High water-holding capacity (42% FC) and strong cation retention; slow internal drainage requiring sub-surface leaching.',
    idealCropsAr: 'القمح، البرسيم، الأرز، الفول البلدي، القطن، بنجر السكر',
    idealCropsEn: 'Wheat, Berseem Clover, Rice, Faba Bean, Cotton, Sugar Beet',
  },
  loamy: {
    texture: 'loamy',
    nameAr: 'صفراء طميية متوازنة (Loamy / Silt Loam)',
    nameEn: 'Balanced Silt-Clay Loam',
    badgeCode: 'LOAM',
    swatchColor: '#b45309',
    gradientCss: 'linear-gradient(to right, #92400e 0%, #b45309 50%, #15803d 100%)',
    fieldCapacityPct: 32,
    wiltingPointPct: 13,
    availableWaterMmPerM: 190,
    infiltrationRateMmHr: '10 – 20 mm/hr',
    leachingFactor: '×1.08 (توازن مثالي)',
    descriptionAr:
      'توازن مثالي بين السعة الحقلية (32%) والتهوية الجذرية ونفاذية الماء، وتعد الأعلى كفاءة لامتصاص NPK.',
    descriptionEn:
      'Optimal balance between field capacity (32% FC), root-zone aeration, and hydraulic conductivity for peak NPK uptake.',
    idealCropsAr: 'الذرة، البطاطس، الطماطم، القمح، الفول السوداني، الموالح',
    idealCropsEn: 'Maize, Potato, Tomato, Wheat, Peanut, Citrus Orchards',
  },
  sandy: {
    texture: 'sandy',
    nameAr: 'رملية خفيفة صحراوية (Sandy Desert)',
    nameEn: 'Coarse Desert Sandy Soil',
    badgeCode: 'SAND',
    swatchColor: '#f59e0b',
    gradientCss: 'linear-gradient(to right, #d97706 0%, #f59e0b 50%, #fde047 100%)',
    fieldCapacityPct: 14,
    wiltingPointPct: 5,
    availableWaterMmPerM: 90,
    infiltrationRateMmHr: '35 – 75 mm/hr',
    leachingFactor: '×1.25 (غسيل سريع للنيتروجين)',
    descriptionAr:
      'نفاذية سريعة جداً وسعة حقلية منخفضة (14%)، تتطلب ري بالتنقيط أو البيفوت وتقسيم جرعات التسميد لمنع غسيل النترات.',
    descriptionEn:
      'Rapid infiltration (35–75 mm/hr) and low water storage (14% FC); requires frequent pulse drip/pivot fertigation.',
    idealCropsAr: 'البطاطس، الفول السوداني، الزيتون، الطماطم، الشعير، البطيخ',
    idealCropsEn: 'Potato, Peanut, Olive, Tomato, Barley, Watermelon',
  },
  calcareous: {
    texture: 'calcareous',
    nameAr: 'جيرية كلسية (Calcareous CaCO₃ > 12%)',
    nameEn: 'Calcareous Soil (High CaCO₃)',
    badgeCode: 'CALC',
    swatchColor: '#d6d3d1',
    gradientCss: 'linear-gradient(to right, #a8a29e 0%, #d6d3d1 50%, #f5f5f4 100%)',
    fieldCapacityPct: 25,
    wiltingPointPct: 11,
    availableWaterMmPerM: 140,
    infiltrationRateMmHr: '8 – 16 mm/hr',
    leachingFactor: '×1.18 (تثبيت الفوسفور والحديد)',
    descriptionAr:
      'غنية بكربونات الكالسيوم وقابلة لتكوين قشرة سطحية صلبة وتثبيت الفوسفور، وتحتاج تسميداً حامضياً (حامض فوسفوريك وسلفات نشادر).',
    descriptionEn:
      'High calcium carbonate content prone to surface crusting and phosphorus fixation; requires acidified fertigation.',
    idealCropsAr: 'الزيتون، الشعير، بنجر السكر، القمح، الفستق، التين',
    idealCropsEn: 'Olive, Barley, Sugar Beet, Wheat, Fig, Sugar Crops',
  },
};

export interface ScientificColorStop {
  color: string;
  rangeLabel: string;
  labelAr: string;
  labelEn: string;
  meaningAr: string;
  meaningEn: string;
}


export interface UnifiedActiveLayerSpec {
  selectionType: 'spectral' | 'thematic';
  activeLayer: SpectralIndexKey;
  activeThematicMap: ThematicMapLayerId;
  badgeCode: string;
  titleAr: string;
  titleEn: string;
  shortAr: string;
  shortEn: string;
  unit: string;
  meanValueFormatted: string;
  minLabelAr: string;
  maxLabelAr: string;
  minLabelEn: string;
  maxLabelEn: string;
  gradientCss: string;
  formulaCode: string;
  methodologyAr: string;
  methodologyEn: string;
  colorStops: ScientificColorStop[];
}

export const SPECTRAL_SCIENTIFIC_SPECS: Record<
  SpectralIndexKey,
  {
    shortAr: string;
    shortEn: string;
    titleAr: string;
    titleEn: string;
    unit: string;
    minAr: string;
    maxAr: string;
    minEn: string;
    maxEn: string;
    gradientCss: string;
    formulaCode: string;
    methodologyAr: string;
    methodologyEn: string;
    colorStops: ScientificColorStop[];
  }
> = {
  NDVI: {
    shortAr: 'NDVI الغطاء النباتي',
    shortEn: 'NDVI Vigor',
    titleAr: 'مؤشر اختلاف الغطاء النباتي الطبيعي المُصحح جوياً (BOA Sentinel-2 NDVI)',
    titleEn: 'Atmospherically Corrected Normalized Difference Vegetation Index (BOA NDVI)',
    unit: '',
    minAr: '0.02 (مباني/حضر)',
    maxAr: '0.85 (أرض زراعية كثيفة)',
    minEn: '0.02 (Urban/Built)',
    maxEn: '0.85 (Dense Cropland)',
    gradientCss:
      'linear-gradient(to right, #dc2626 0%, #eab308 26%, #84cc16 50%, #10b981 76%, #047857 100%)',
    formulaCode: 'NDVI_BOA = (ρ_NIR_B8 - ρ_Red_B4) / (ρ_NIR_B8 + ρ_Red_B4)  [AOD τ550 = 0.18]',
    methodologyAr:
      'يتم تحويل إشعاع القمر الصناعي من أعلى الغلاف الجوي (TOA) إلى انعكاس سطح الأرض (BOA) مع عزل المناطق المبنية باللون الأحمر، وتلوين الأراضي غير المزروعة بالأصفر، والغطاء النباتي الكثيف بالأخضر الداكن.',
    methodologyEn:
      'Converts TOA radiance to BOA surface reflectance, isolating built-up areas in red, uncultivated bare soil in yellow, and dense cropland in dark green.',
    colorStops: [
      {
        color: '#dc2626',
        rangeLabel: '0.02 – 0.08',
        labelAr: 'مناطق مبنية وكتل سكنية (حضر معزول)',
        labelEn: 'Impervious Urban / Built-up Areas',
        meaningAr: 'أسطح خرسانية ومباني وطرق جافة تُلوّن بالأحمر وتُستبعد من متوسط الزراعة',
        meaningEn: 'Dry concrete roofs, buildings & streets isolated in red',
      },
      {
        color: '#eab308',
        rangeLabel: '0.10 – 0.24',
        labelAr: 'أراضي غير مزروعة / تربة مكشوفة',
        labelEn: 'Uncultivated / Bare Soil',
        meaningAr: 'أرض زراعية غير منزرعة حالياً (محروثة أو بور)',
        meaningEn: 'Uncultivated fallow agricultural soil',
      },
      {
        color: '#84cc16',
        rangeLabel: '0.25 – 0.42',
        labelAr: 'إنبات مبكر / غطاء نباتي خفيف',
        labelEn: 'Early Emergence / Light Canopy',
        meaningAr: 'بداية نمو البادرات والمحصول في مراحله الأولى',
        meaningEn: 'Early vegetative emergence and partial row cover',
      },
      {
        color: '#10b981',
        rangeLabel: '0.43 – 0.65',
        labelAr: 'أرض زراعية خضراء صحية',
        labelEn: 'Healthy Green Cropland',
        meaningAr: 'نمو خضري نشط وتمثيل ضوئي منتظم في الحقل الزراعي',
        meaningEn: 'Active vegetative growth with healthy chlorophyll density',
      },
      {
        color: '#047857',
        rangeLabel: '0.66 – 0.86',
        labelAr: 'أرض زراعية كثيفة الغطاء',
        labelEn: 'Dense Vigorous Cropland',
        meaningAr: 'ذروة الكثافة الكلوروفيلية وإغلاق المظلة النباتية بالكامل',
        meaningEn: 'Peak chlorophyll activity and full canopy closure',
      },
    ],
  },
  NDWI: {
    shortAr: 'NDWI مياه الأوراق',
    shortEn: 'NDWI Leaf Water',
    titleAr: 'مؤشر المحتوى المائي للأوراق والسطح المُصحح جوياً (Gao/McFeeters NDWI)',
    titleEn: 'Atmospherically Corrected Canopy & Surface Water Index (NDWI)',
    unit: '',
    minAr: '-0.35 (مباني جافة)',
    maxAr: '+0.55 (تشبع مائي)',
    minEn: '-0.35 (Dry Urban)',
    maxEn: '+0.55 (High Water)',
    gradientCss:
      'linear-gradient(to right, #dc2626 0%, #f59e0b 28%, #38bdf8 60%, #0284c7 82%, #1d4ed8 100%)',
    formulaCode: 'NDWI_BOA = 0.65·[(ρ_NIR - ρ_SWIR1)/(ρ_NIR + ρ_SWIR1)] + 0.35·[(ρ_G - ρ_NIR)/(ρ_G + ρ_NIR)]',
    methodologyAr:
      'يقيس المحتوى المائي الحقيقي داخل أنسجة الأوراق النباتية والمسطحات المائية، ويعطي قيماً سالبة حادة للمباني والكتل الخرسانية الجافة.',
    methodologyEn:
      'Measures liquid water thickness inside leaf tissues and canals while assigning strongly negative values to dry impervious buildings.',
    colorStops: [
      {
        color: '#dc2626',
        rangeLabel: '-0.38 – -0.18',
        labelAr: 'مباني صماء جافة تماماً',
        labelEn: 'Impervious Dry Buildings',
        meaningAr: 'كتل عمرانية وأسطح صلبة خالية من المحتوى المائي النباتي',
        meaningEn: 'Impervious built-up blocks with zero canopy water',
      },
      {
        color: '#f59e0b',
        rangeLabel: '-0.17 – +0.02',
        labelAr: 'تربة مكشوفة أو عطش نباتي',
        labelEn: 'Bare Soil / Water Deficit',
        meaningAr: 'انخفاض ضغط الامتلاء المائي في الأوراق والحاجة لجدولة رية',
        meaningEn: 'Low leaf turgor or dry bare soil surface',
      },
      {
        color: '#38bdf8',
        rangeLabel: '+0.03 – +0.18',
        labelAr: 'محتوى مائي معتدل',
        labelEn: 'Moderate Leaf Moisture',
        meaningAr: 'توازن مائي مقبول داخل المجموع الخضري',
        meaningEn: 'Balanced leaf water content across crop stand',
      },
      {
        color: '#0284c7',
        rangeLabel: '+0.19 – +0.35',
        labelAr: 'امتلاء مائي ممتاز للخلايا',
        labelEn: 'High Canopy Hydration',
        meaningAr: 'محصول مروي جيداً وامتصاص مائي نشط من الجذور',
        meaningEn: 'Well-irrigated crop with vigorous root water uptake',
      },
      {
        color: '#1d4ed8',
        rangeLabel: '+0.36 – +0.60',
        labelAr: 'تشبع مائي / مسطح مائي',
        labelEn: 'Saturated / Water Canal',
        meaningAr: 'مياه سطحية أو غطاء نباتي كثيف مشبع بالرطوبة بعد الري',
        meaningEn: 'Open irrigation canal or freshly irrigated dense crop',
      },
    ],
  },
  SAVI: {
    shortAr: 'SAVI معدل التربة',
    shortEn: 'SAVI Soil-Adj',
    titleAr: 'مؤشر الغطاء النباتي المُعدل لتأثير سطوع التربة (Huete SAVI, L=0.5)',
    titleEn: 'Soil-Adjusted Vegetation Index (Huete SAVI, L=0.5)',
    unit: '',
    minAr: '0.02 (مباني/حضر)',
    maxAr: '0.75 (أرض زراعية كثيفة)',
    minEn: '0.02 (Urban/Built)',
    maxEn: '0.75 (Dense Cropland)',
    gradientCss:
      'linear-gradient(to right, #dc2626 0%, #eab308 28%, #84cc16 58%, #10b981 82%, #047857 100%)',
    formulaCode: 'SAVI = [(ρ_NIR_BOA - ρ_Red_BOA) / (ρ_NIR_BOA + ρ_Red_BOA + L)] × (1 + L),  L = 0.5',
    methodologyAr:
      'يزيل التشويش الناتج عن سطوع التربة الرملية أو الجيرية المكشوفة بين خطوط الزراعة ويعزل المناطق المبنية بالأحمر والأراضي غير المزروعة بالأصفر والزراعة الكثيفة بالأخضر الداكن.',
    methodologyEn:
      'Eliminates background soil brightness distortion in partial canopies while isolating impervious buildings in red and bare land in yellow.',
    colorStops: [
      {
        color: '#dc2626',
        rangeLabel: '0.02 – 0.08',
        labelAr: 'مناطق مبنية وأسطح صماء (حضر)',
        labelEn: 'Impervious Built Surfaces',
        meaningAr: 'منشآت ومباني غير زراعية معزولة باللون الأحمر',
        meaningEn: 'Non-agricultural buildings isolated in red',
      },
      {
        color: '#eab308',
        rangeLabel: '0.09 – 0.24',
        labelAr: 'أراضي غير مزروعة / تربة مكشوفة',
        labelEn: 'Uncultivated Bare Soil',
        meaningAr: 'أرض زراعية غير منزرعة أو محروثة قبل الزراعة',
        meaningEn: 'Uncultivated fallow soil prior to sowing',
      },
      {
        color: '#84cc16',
        rangeLabel: '0.25 – 0.42',
        labelAr: 'غطاء نباتي جزئي نشط',
        labelEn: 'Partial Crop Canopy',
        meaningAr: 'نمو جيد للمحصول مع ظهور التربة بين الخطوط',
        meaningEn: 'Healthy row-crop development with visible inter-row soil',
      },
      {
        color: '#10b981',
        rangeLabel: '0.43 – 0.58',
        labelAr: 'أرض زراعية خضراء متكاملة',
        labelEn: 'Established Green Cropland',
        meaningAr: 'تغطية نباتية عالية واستفادة مثلى من الإشعاع الشمسي',
        meaningEn: 'High canopy cover and strong photosynthetic efficiency',
      },
      {
        color: '#047857',
        rangeLabel: '0.59 – 0.78',
        labelAr: 'ذروة الكتلة الزراعية الخضراء',
        labelEn: 'Peak Soil-Adjusted Vigor',
        meaningAr: 'أعلى كثافة نباتية مصححة من تأثير خلفية التربة',
        meaningEn: 'Maximum soil-adjusted canopy biomass density',
      },
    ],
  },
  NDMI: {
    shortAr: 'NDMI رطوبة الجذور',
    shortEn: 'NDMI Root Moisture',
    titleAr: 'مؤشر رطوبة المجموع الجذري والمظلة النباتية (Sentinel-2 SWIR NDMI)',
    titleEn: 'Normalized Difference Moisture Index (SWIR1 Root & Canopy NDMI)',
    unit: '',
    minAr: '-0.30 (جاف/مباني)',
    maxAr: '+0.60 (رطب جداً)',
    minEn: '-0.30 (Dry/Built)',
    maxEn: '+0.60 (Moist)',
    gradientCss:
      'linear-gradient(to right, #dc2626 0%, #f59e0b 28%, #38bdf8 58%, #0284c7 80%, #1d4ed8 100%)',
    formulaCode: 'NDMI = (ρ_NIR_842nm - ρ_SWIR1_1610nm) / (ρ_NIR_842nm + ρ_SWIR1_1610nm)',
    methodologyAr:
      'يعتمد على امتصاص الأشعة تحت الحمراء القصيرة (SWIR1) لقياس إجهاد العطش المبكر قبل ظهور الاصفرار المرئي.',
    methodologyEn:
      'Uses SWIR-1 absorption at 1610nm to detect early root-zone water stress before visible wilting.',
    colorStops: [
      {
        color: '#dc2626',
        rangeLabel: '-0.35 – -0.15',
        labelAr: 'مباني صماء / جفاف شديد',
        labelEn: 'Impervious / Severe Stress',
        meaningAr: 'كتل سكنية جافة أو إجهاد مائي حاد جداً',
        meaningEn: 'Impervious urban surfaces or severe water deficit',
      },
      {
        color: '#f59e0b',
        rangeLabel: '-0.14 – +0.05',
        labelAr: 'إجهاد رطوبي مبكر',
        labelEn: 'Early Moisture Deficit',
        meaningAr: 'نقص الرطوبة المتاحة في منطقة الجذور السطحية',
        meaningEn: 'Depleting root-zone moisture requiring irrigation',
      },
      {
        color: '#38bdf8',
        rangeLabel: '+0.06 – +0.25',
        labelAr: 'رطوبة جذرية معتدلة',
        labelEn: 'Moderate Root Moisture',
        meaningAr: 'امداد مائي مستقر للنبات',
        meaningEn: 'Adequate water supply to crop canopy',
      },
      {
        color: '#0284c7',
        rangeLabel: '+0.26 – +0.44',
        labelAr: 'رطوبة مثالية للنمو',
        labelEn: 'Optimal Hydration',
        meaningAr: 'رطوبة مثلى في منطقة انتشار الجذور والأوراق',
        meaningEn: 'Optimal moisture across root zone and leaves',
      },
      {
        color: '#1d4ed8',
        rangeLabel: '+0.45 – +0.65',
        labelAr: 'امتلاء رطوبي كامل',
        labelEn: 'Full Moisture Capacity',
        meaningAr: 'أعلى محتوى رطوبي للنبات والتربة المحيطة',
        meaningEn: 'Maximum canopy and root-zone water content',
      },
    ],
  },
  EVI: {
    shortAr: 'EVI الكتلة الحيوية',
    shortEn: 'EVI Biomass',
    titleAr: 'مؤشر الغطاء النباتي المُحسّن المقاوم للغلاف الجوي (MODIS/Sentinel-2 EVI)',
    titleEn: 'Enhanced Vegetation Index with Aerosol Resistance (EVI)',
    unit: '',
    minAr: '0.02 (مباني)',
    maxAr: '0.80 (كتلة كثيفة)',
    minEn: '0.02 (Built)',
    maxEn: '0.80 (High Biomass)',
    gradientCss:
      'linear-gradient(to right, #dc2626 0%, #f59e0b 26%, #84cc16 56%, #10b981 80%, #047857 100%)',
    formulaCode: 'EVI = 2.5 × (ρ_NIR - ρ_Red) / (ρ_NIR + 6·ρ_Red - 7.5·ρ_Blue + 1)',
    methodologyAr:
      'يستخدم النطاق الأزرق (B2) لتصحيح تشتت الهباء الجوي (Aerosols) ويمنع التشبع في المحاصيل الكثيفة كالقمح والذرة.',
    methodologyEn:
      'Incorporates Band 2 Blue to correct residual aerosol scattering and prevent saturation in high-LAI crops.',
    colorStops: [
      {
        color: '#dc2626',
        rangeLabel: '0.02 – 0.07',
        labelAr: 'مباني ومناطق عمرانية',
        labelEn: 'Urban / Impervious',
        meaningAr: 'انعدام الكتلة الحيوية النباتية فوق المباني',
        meaningEn: 'Zero vegetative biomass over built structures',
      },
      {
        color: '#f59e0b',
        rangeLabel: '0.08 – 0.20',
        labelAr: 'تربة مكشوفة / نمو ضعيف',
        labelEn: 'Bare Soil / Low Biomass',
        meaningAr: 'كتلة حيوية منخفضة جداً أو تربة غير منزرعة',
        meaningEn: 'Minimal biomass or fallow agricultural soil',
      },
      {
        color: '#84cc16',
        rangeLabel: '0.21 – 0.38',
        labelAr: 'كتلة حيوية متوسطة',
        labelEn: 'Moderate Leaf Area (LAI)',
        meaningAr: 'بناء ضوئي نشط وتراكم متوسط للمادة الجافة',
        meaningEn: 'Developing leaf area index and dry matter accumulation',
      },
      {
        color: '#10b981',
        rangeLabel: '0.39 – 0.56',
        labelAr: 'كتلة حيوية مرتفعة',
        labelEn: 'High Crop Biomass',
        meaningAr: 'محصول قوي وكثافة أوراق عالية',
        meaningEn: 'Strong crop stand with high leaf area index',
      },
      {
        color: '#047857',
        rangeLabel: '0.57 – 0.82',
        labelAr: 'ذروة الإنتاجية الحيوية',
        labelEn: 'Peak Canopy Biomass',
        meaningAr: 'أقصى إنتاجية للكتلة الحيوية دون تشبع طيفي',
        meaningEn: 'Peak canopy biomass without spectral saturation',
      },
    ],
  },
  LST: {
    shortAr: 'LST الحرارة',
    shortEn: 'LST Thermal',
    titleAr: 'درجة حرارة سطح الأرض والمظلة النباتية (ECOSTRESS / Sentinel-3 LST)',
    titleEn: 'Land & Canopy Surface Temperature (LST °C)',
    unit: '°C',
    minAr: '18°م (آمن/تبريد النتح)',
    maxAr: '36°م (خطر حراري عالٍ)',
    minEn: '18°C (Safe Cool Canopy)',
    maxEn: '36°C (High Heat Hazard)',
    gradientCss:
      'linear-gradient(to right, #10b981 0%, #06b6d4 28%, #eab308 56%, #f97316 78%, #ef4444 100%)',
    formulaCode: 'LST = T_air + ΔT_rad(1 - NDVI_BOA) - Λ_transpiration(NDWI_BOA)',
    methodologyAr:
      'يتدرج من الأخضر الآمن للحقول المروية المبردة بالنتح (Transpiration Cooling) إلى الأحمر للدلالة على الخطورة والإجهاد الحراري العالي.',
    methodologyEn:
      'Scales from safe green over transpiring crops to hazard red for extreme heat stress.',
    colorStops: [
      {
        color: '#10b981',
        rangeLabel: '16.0 – 21.5°C',
        labelAr: 'نطاق آمن ومثالي (تبريد نتح عالٍ)',
        labelEn: 'Safe Cool Transpiring Canopy',
        meaningAr: 'تبريد فسيولوجي ممتاز للمحصول المروي وعدم وجود أي إجهاد حراري',
        meaningEn: 'Strong evaporative cooling over well-watered crop',
      },
      {
        color: '#06b6d4',
        rangeLabel: '21.6 – 24.5°C',
        labelAr: 'حرارة معتدلة للتمثيل الضوئي',
        labelEn: 'Optimal Canopy Temp',
        meaningAr: 'نطاق حراري آمن لنشاط الإنزيمات النباتية',
        meaningEn: 'Ideal thermal window for crop photosynthesis',
      },
      {
        color: '#eab308',
        rangeLabel: '24.6 – 27.5°C',
        labelAr: 'دفء معتدل / بداية إجهاد',
        labelEn: 'Mild Thermal Rise',
        meaningAr: 'انخفاض نسبي في معدل النتح وبدء غلق الثغور الجزئي',
        meaningEn: 'Partial stomatal closure and moderate warming',
      },
      {
        color: '#f97316',
        rangeLabel: '27.6 – 30.0°C',
        labelAr: 'تربة مكشوفة ساخنة / عطش',
        labelEn: 'Warm Bare Soil / Stress',
        meaningAr: 'سطح تربة جافة أو نباتات تعاني من إجهاد حراري ومائي',
        meaningEn: 'Dry exposed soil or heat-stressed crop stand',
      },
      {
        color: '#ef4444',
        rangeLabel: '> 30.0°C',
        labelAr: 'جزيرة حرارية (مباني صماء / جفاف حاد)',
        labelEn: 'Urban Heat Island / Severe Stress',
        meaningAr: 'أسطح مباني خرسانية ساخنة جداً أو جفاف شديد',
        meaningEn: 'Hot concrete rooftops or extreme thermal drought stress',
      },
    ],
  },
  SM_0_7: {
    shortAr: 'رطوبة 0-7 سم',
    shortEn: 'SM 0-7cm',
    titleAr: 'رطوبة التربة السطحية المُعايرة طيفياً وجوياً (0–7 سم Volumetric %)',
    titleEn: 'Radiometrically Calibrated Surface Soil Moisture (0–7 cm %)',
    unit: '%',
    minAr: '2% (مباني صماء)',
    maxAr: '44% (سعة حقلية)',
    minEn: '2% (Impervious)',
    maxEn: '44% (Field Capacity)',
    gradientCss:
      'linear-gradient(to right, #dc2626 0%, #f59e0b 26%, #38bdf8 56%, #0284c7 80%, #1d4ed8 100%)',
    formulaCode: 'SM_0_7 = f(OpenMeteo_SM0_7, Texture_Retention, NDVI_BOA, NDWI_BOA)  [Urban < 4.6%]',
    methodologyAr:
      'يدمج بيانات رطوبة التربة من Open-Meteo مع قوام التربة والغطاء النباتي الحقيقي، مع عزل المباني السكنية لتعطي دائماً رطوبة شبه صفرية (<4.6%).',
    methodologyEn:
      'Couples Open-Meteo 0–7cm soil moisture with soil texture retention and BOA canopy vigor while isolating buildings (<4.6%).',
    colorStops: [
      {
        color: '#dc2626',
        rangeLabel: '1.8% – 4.8%',
        labelAr: 'مباني وطرق صماء جافة',
        labelEn: 'Impervious Built / Roads',
        meaningAr: 'أسطح مباني وكتل سكنية غير منفذة للمياه (تُستبعد من متوسط المزرعة)',
        meaningEn: 'Impervious roofs and roads (excluded from farm moisture average)',
      },
      {
        color: '#f59e0b',
        rangeLabel: '8.0% – 17.5%',
        labelAr: 'تربة مكشوفة جافة (تحتاج ري)',
        labelEn: 'Dry Bare Soil (Irrigate)',
        meaningAr: 'اقتراب الطبقة السطحية من نقطة الذبول وحاجة البادرات للري',
        meaningEn: 'Surface soil approaching wilting point; schedule irrigation',
      },
      {
        color: '#38bdf8',
        rangeLabel: '17.6% – 25.5%',
        labelAr: 'رطوبة سطحية معتدلة',
        labelEn: 'Moderate Surface Moisture',
        meaningAr: 'رطوبة متاحة مقبولة مع بدء استهلاك الماء السهل',
        meaningEn: 'Readily available surface water partially consumed',
      },
      {
        color: '#0284c7',
        rangeLabel: '25.6% – 33.5%',
        labelAr: 'رطوبة زراعية مثالية',
        labelEn: 'Optimal Crop Soil Moisture',
        meaningAr: 'توازن مثالي بين الماء والهواء في الطبقة السطحية (0–7 سم)',
        meaningEn: 'Ideal water-to-air ratio in 0–7cm topsoil layer',
      },
      {
        color: '#1d4ed8',
        rangeLabel: '33.6% – 46.0%',
        labelAr: 'تشبع رطوبي / سعة حقلية كاملة',
        labelEn: 'Full Field Capacity',
        meaningAr: 'أرض مروية حديثاً أو ذات غطاء نباتي كثيف يحتفظ بالرطوبة',
        meaningEn: 'Freshly irrigated plot or dense moisture-retaining crop',
      },
    ],
  },
  SM_7_28: {
    shortAr: 'رطوبة 7-28 سم',
    shortEn: 'SM 7-28cm',
    titleAr: 'رطوبة منطقة انتشار الجذور الفعالة (7–28 سم Root-Zone %)',
    titleEn: 'Calibrated Active Root-Zone Soil Moisture (7–28 cm %)',
    unit: '%',
    minAr: '3% (مباني صماء)',
    maxAr: '48% (تشبع جذري)',
    minEn: '3% (Impervious)',
    maxEn: '48% (Root Saturation)',
    gradientCss:
      'linear-gradient(to right, #dc2626 0%, #f59e0b 25%, #38bdf8 55%, #0284c7 78%, #1d4ed8 100%)',
    formulaCode: 'SM_7_28 = f(OpenMeteo_SM7_28, Clay_Loam_Capacity, NDMI_BOA)',
    methodologyAr:
      'يقيس مخزون الرطوبة الفعلي في منطقة انتشار الجذور الفعالة (7 إلى 28 سم) لتحديد كمية وموعد الرية القادمة بدقة.',
    methodologyEn:
      'Quantifies volumetric water storage in the primary 7–28cm root zone to guide irrigation scheduling.',
    colorStops: [
      {
        color: '#dc2626',
        rangeLabel: '2.0% – 5.5%',
        labelAr: 'كتل عمرانية صماء غير زراعية',
        labelEn: 'Impervious Built Blocks',
        meaningAr: 'مباني ومنشآت صلبة معزولة عن التربة الزراعية',
        meaningEn: 'Non-agricultural buildings isolated from root zone',
      },
      {
        color: '#f59e0b',
        rangeLabel: '10.0% – 20.0%',
        labelAr: 'إجهاد جفاف جذري',
        labelEn: 'Root-Zone Water Deficit',
        meaningAr: 'انخفاض مخزون الرطوبة حول الجذور وضرورة الري التكميلي',
        meaningEn: 'Depleted root-zone reserve requiring immediate irrigation',
      },
      {
        color: '#38bdf8',
        rangeLabel: '20.1% – 28.0%',
        labelAr: 'مخزون رطوبي متوسط',
        labelEn: 'Moderate Root Reserve',
        meaningAr: 'رطوبة كافية لعدة أيام قبل الوصول لحد الإجهاد',
        meaningEn: 'Adequate root moisture buffer for upcoming days',
      },
      {
        color: '#0284c7',
        rangeLabel: '28.1% – 36.0%',
        labelAr: 'سعة حقلية مثالية للجذور',
        labelEn: 'Optimal Root-Zone Moisture',
        meaningAr: 'أفضل مستوى رطوبي لامتصاص العناصر الغذائية (NPK)',
        meaningEn: 'Optimal root hydration for peak NPK nutrient uptake',
      },
      {
        color: '#1d4ed8',
        rangeLabel: '36.1% – 48.5%',
        labelAr: 'امتلاء رطوبي عميق',
        labelEn: 'Deep Moisture Reserve',
        meaningAr: 'مخزون مائي عميق ممتاز في التربة الطينية/الطميية المروية',
        meaningEn: 'Abundant deep moisture reserve in irrigated clay/loam',
      },
    ],
  },
  SOIL_EC: {
    shortAr: 'ملوحة التربة EC',
    shortEn: 'Salinity EC',
    titleAr: 'خريطة التوصيل الكهربائي وملوحة التربة (Soil Salinity ECe dS/m)',
    titleEn: 'Soil Electrical Conductivity & Salinity Stress Map (ECe dS/m)',
    unit: ' dS/m',
    minAr: '0.8 (عذبة)',
    maxAr: '8.5 (ملوحة حرجة)',
    minEn: '0.8 (Non-Saline)',
    maxEn: '8.5 (High Salinity)',
    gradientCss:
      'linear-gradient(to right, #10b981 0%, #84cc16 28%, #eab308 55%, #f97316 78%, #ef4444 100%)',
    formulaCode: 'EC_cell = EC_base × [1 + 0.35·(1 - Vigor_BOA) + Drainage_Factor]',
    methodologyAr:
      'يرصد تجمعات الأملاح السطحية والجذرية استناداً إلى قوام التربة وكفاءة الغسيل والغطاء النباتي لتحديد احتياجات الجبس الزراعي وغسيل التربة.',
    methodologyEn:
      'Maps root-zone salinity accumulation using soil profile EC, leaching efficiency, and canopy vigor.',
    colorStops: [
      {
        color: '#10b981',
        rangeLabel: '0.5 – 1.8 dS/m',
        labelAr: 'تربة غير ملحية (ممتازة)',
        labelEn: 'Non-Saline Optimal Soil',
        meaningAr: 'صالحة لجميع المحاصيل الحساسة والفاكهة دون أي فقد في الإنتاجية',
        meaningEn: 'Suitable for all sensitive crops with zero osmotic yield loss',
      },
      {
        color: '#84cc16',
        rangeLabel: '1.9 – 2.8 dS/m',
        labelAr: 'ملوحة خفيفة جداً',
        labelEn: 'Slightly Saline',
        meaningAr: 'مناسبة لمعظم المحاصيل الحقلية والخضر مع ري منتظم',
        meaningEn: 'Safe for most field and vegetable crops under normal irrigation',
      },
      {
        color: '#eab308',
        rangeLabel: '2.9 – 4.2 dS/m',
        labelAr: 'ملوحة متوسطة (تحتاج غسيل)',
        labelEn: 'Moderately Saline',
        meaningAr: 'تتطلب إضافة احتياج غسيل مائي 15% واختيار محاصيل متحملة',
        meaningEn: 'Requires 15% leaching fraction and moderately tolerant crops',
      },
      {
        color: '#f97316',
        rangeLabel: '4.3 – 6.0 dS/m',
        labelAr: 'ملوحة مرتفعة (إجهاد اسموزي)',
        labelEn: 'High Salinity Stress',
        meaningAr: 'تسبب تقزم المحاصيل الحساسة وتستلزم إضافة الجبس الزراعي والغسيل',
        meaningEn: 'Causes osmotic stress; apply agricultural gypsum and leaching',
      },
      {
        color: '#ef4444',
        rangeLabel: '> 6.0 dS/m',
        labelAr: 'ملوحة حرجة جداً / سبخة',
        labelEn: 'Severe Saline / Sodic',
        meaningAr: 'لا تصلح إلا للمحاصيل الملحية (الشعير، البنجر، الكينوا) مع الصرف الجيد',
        meaningEn: 'Restrict to halophytic/tolerant crops (barley, sugar beet, quinoa)',
      },
    ],
  },
  SOIL_PH: {
    shortAr: 'حموضة التربة pH',
    shortEn: 'Soil pH',
    titleAr: 'خريطة تفاعل التربة والقلوية وتيسر العناصر الصغرى (Soil pH)',
    titleEn: 'Soil Reaction, Alkalinity & Micronutrient Availability (pH)',
    unit: ' pH',
    minAr: '6.2 (متعادل حمضي)',
    maxAr: '8.6 (قلوي جيري)',
    minEn: '6.2 (Slightly Acidic)',
    maxEn: '8.6 (Alkaline)',
    gradientCss:
      'linear-gradient(to right, #f59e0b 0%, #10b981 30%, #06b6d4 60%, #a855f7 82%, #e11d48 100%)',
    formulaCode: 'pH_cell = pH_profile - 0.32·(Vigor_BOA - 0.5) + CaCO3_Alkalinity',
    methodologyAr:
      'يحدد درجة حموضة وقلوية التربة التي تتحكم في تيسر الفوسفور والحديد والزنك والمنجنيز حول الجذور.',
    methodologyEn:
      'Monitors soil pH governing phosphorus, iron, zinc, and manganese solubility in the rhizosphere.',
    colorStops: [
      {
        color: '#f59e0b',
        rangeLabel: '5.8 – 6.4 pH',
        labelAr: 'مائل للحموضة',
        labelEn: 'Slightly Acidic',
        meaningAr: 'تيسر عالٍ للعناصر الصغرى',
        meaningEn: 'High micronutrient solubility',
      },
      {
        color: '#10b981',
        rangeLabel: '6.5 – 7.4 pH',
        labelAr: 'متعادل مثالي (أعلى تيسر)',
        labelEn: 'Neutral Optimal Range',
        meaningAr: 'أفضل مدى لامتصاص كافة العناصر الكبرى والصغرى (NPK + Fe/Zn)',
        meaningEn: 'Peak availability of N, P, K and chelated micronutrients',
      },
      {
        color: '#06b6d4',
        rangeLabel: '7.5 – 7.9 pH',
        labelAr: 'قلوي خفيف (أراضي الدلتا)',
        labelEn: 'Mildly Alkaline',
        meaningAr: 'ينصح باستخدام الأسمدة الحامضية وحمض الفوسفوريك مع الري',
        meaningEn: 'Use acidic fertilizers (ammonium sulfate / phosphoric acid)',
      },
      {
        color: '#a855f7',
        rangeLabel: '8.0 – 8.3 pH',
        labelAr: 'قلوي جيري (نقص حديد وفوسفور)',
        labelEn: 'Calcareous Alkaline',
        meaningAr: 'تثبيت للفوسفور والحديد؛ يلزم إضافة الكبريت الزراعي والحديد المخلبي EDDHA',
        meaningEn: 'P and Fe fixation; apply elemental sulfur and EDDHA chelated iron',
      },
      {
        color: '#e11d48',
        rangeLabel: '> 8.3 pH',
        labelAr: 'قلوية صودية شديدة',
        labelEn: 'Strongly Alkaline / Sodic',
        meaningAr: 'تدهور بناء التربة ونقص حاد في العناصر؛ يلزم معالجة بالجبس والكبريت',
        meaningEn: 'Severe alkalinity requiring gypsum, sulfur, and organic acids',
      },
    ],
  },
};

export const THEMATIC_COLOR_STOPS: Record<ThematicMapLayerId, ScientificColorStop[]> = {
  natural: [
    {
      color: '#1e3a8a',
      rangeLabel: 'المسطحات المائية والبحار',
      labelAr: 'مياه البحار والأنهار والترع',
      labelEn: 'Seas, Rivers & Canals',
      meaningAr: 'المسطحات المائية الطبيعية في مرئيات القمر الصناعي بدون تلوين صناعي',
      meaningEn: 'Natural water bodies on pure satellite imagery without thematic tinting',
    },
    {
      color: '#d4a373',
      rangeLabel: 'الصحاري والرمال والجبال',
      labelAr: 'التضاريس الرملية والصحراوية الطبيعية',
      labelEn: 'Natural Desert & Arid Terrain',
      meaningAr: 'الألوان الطبيعية للرمال والهضاب والتكوينات الجيولوجية كما يرصدها القمر الصناعي',
      meaningEn: 'True-color desert sands, plateaus, and geological formations',
    },
    {
      color: '#a3b18a',
      rangeLabel: 'السهول الزراعية والتربة',
      labelAr: 'الأراضي الزراعية والطميية الطبيعية',
      labelEn: 'Alluvial Plains & Farmland',
      meaningAr: 'تدرجات الأراضي الزراعية وحقول الدلتا والوادي بصورتها الطبيعية الحقيقية',
      meaningEn: 'True-color agricultural fields and alluvial delta soils',
    },
    {
      color: '#15803d',
      rangeLabel: 'الغطاء الخضري الطبيعي',
      labelAr: 'المزروعات والغطاء النباتي الحقيقي',
      labelEn: 'True-Color Vegetation Canopy',
      meaningAr: 'اللون الأخضر الحقيقي للمحاصيل والأشجار من مرئيات Sentinel-2 / Esri World Imagery',
      meaningEn: 'Natural true-color crop canopy from high-res satellite imagery',
    },
  ],
  vegetation: [
    {
      color: '#dfcec2',
      rangeLabel: '0.00 – 0.14 NDVI',
      labelAr: 'مبانٍ ومياه وصحراء مفتوحة (بدون تلوين)',
      labelEn: 'Buildings, Water & Open Desert (Uncolored)',
      meaningAr: 'أسطح مباني وطرق وأنهار وبحار وصحارٍ جرداء تبقى بلونها الأصلي دون تلوين',
      meaningEn: 'Urban roofs, roads, rivers, seas & barren desert remain uncolored',
    },
    {
      color: '#bef264',
      rangeLabel: '0.15 – 0.27 NDVI',
      labelAr: 'أرض زراعية غير مزروعة / صفراء أو طينية (أخضر فاتح)',
      labelEn: 'Unplanted Yellow/Clay Farmland (Light Green)',
      meaningAr: 'قطع أراضٍ زراعية غير منزرعة حالياً (صفراء أو طينية محروثة) وسط المزارع',
      meaningEn: 'Fallow or unplanted clay/yellow agricultural parcels inside farmland clusters',
    },
    {
      color: '#84cc16',
      rangeLabel: '0.28 – 0.44 NDVI',
      labelAr: 'إنبات مبكر / غطاء خفيف',
      labelEn: 'Early Emergence Canopy',
      meaningAr: 'بداية نمو البادرات والمحاصيل الحقلية الموسمية',
      meaningEn: 'Early vegetative emergence and partial row cover',
    },
    {
      color: '#48b416',
      rangeLabel: '0.45 – 0.65 NDVI',
      labelAr: 'غطاء زراعي نشط وصحي (أخضر)',
      labelEn: 'Healthy Active Cropland (Green)',
      meaningAr: 'نمو خضري متوازن وتمثيل ضوئي جيد في الحقول المروية والبساتين',
      meaningEn: 'Active vegetative growth with healthy chlorophyll across irrigated fields',
    },
    {
      color: '#056400',
      rangeLabel: '0.66 – 0.99 NDVI',
      labelAr: 'غطاء زراعي وغابي كثيف (أخضر داكن)',
      labelEn: 'Dense Lush Vegetation (Dark Green)',
      meaningAr: 'ذروة الكثافة الكلوروفيلية وإغلاق المظلة النباتية بالكامل',
      meaningEn: 'Peak chlorophyll density and closed orchard/crop canopy',
    },
  ],
  wind: [
    {
      color: '#10b981',
      rangeLabel: '< 12 km/h',
      labelAr: 'رياح هادئة (رش آمن 100%)',
      labelEn: 'Calm Wind (Safe Spraying)',
      meaningAr: 'ظروف مثالية للرش الورقي والمبيدات دون خطر انجراف',
      meaningEn: 'Ideal conditions for foliar spraying with zero drift risk',
    },
    {
      color: '#06b6d4',
      rangeLabel: '12 – 18 km/h',
      labelAr: 'نسيم معتدل (تهوية ممتازة)',
      labelEn: 'Moderate Breeze',
      meaningAr: 'يقلل الرطوبة الفطرية داخل المحصول ويسمح بالرش الحذر',
      meaningEn: 'Reduces canopy fungal humidity; cautious spraying allowed',
    },
    {
      color: '#3b82f6',
      rangeLabel: '18 – 24 km/h',
      labelAr: 'رياح نشطة (يزداد النتح)',
      labelEn: 'Fresh Wind (Higher ET0)',
      meaningAr: 'ارتفاع البخر-نتح وخطر انجراف قطرات الرش الدقيقة',
      meaningEn: 'Elevated evapotranspiration and spray drift risk',
    },
    {
      color: '#f59e0b',
      rangeLabel: '24 – 32 km/h',
      labelAr: 'رياح قوية (يُمنع الرش)',
      labelEn: 'Strong Wind (Halt Spraying)',
      meaningAr: 'يجب إيقاف رش المبيدات تماماً وتأمين الصوب الزراعية',
      meaningEn: 'Halt all pesticide spraying and secure greenhouses',
    },
    {
      color: '#ef4444',
      rangeLabel: '> 32 km/h',
      labelAr: 'رياح عاصفة (خطر رقاد المحصول)',
      labelEn: 'Gale / Lodging Hazard',
      meaningAr: 'خطر رقاد القمح والذرة؛ يمنع الري أثناء هبوب الرياح',
      meaningEn: 'High crop lodging risk; avoid irrigating tall cereals',
    },
  ],
  weather: [
    {
      color: '#64748b',
      rangeLabel: '0% – 18% Cloud',
      labelAr: 'سماء صافية (شفاف بدون غطاء)',
      labelEn: 'Clear Sky (Transparent)',
      meaningAr: 'صفاء جوي كامل وإشعاع شمسي مرتفع؛ تُعزل خلفيته لتبقى الأرض والبحار واضحة',
      meaningEn: 'Clear sky masked transparent to preserve satellite & ocean clarity',
    },
    {
      color: '#0003ff',
      rangeLabel: '19% – 38% Cloud',
      labelAr: 'سحب خفيفة متفرقة',
      labelEn: 'Scattered Light Clouds',
      meaningAr: 'تغطية سحابية خفيفة ذات رطوبة جوية معتدلة',
      meaningEn: 'Scattered cloud bands with moderate boundary humidity',
    },
    {
      color: '#055000',
      rangeLabel: '39% – 60% Cloud',
      labelAr: 'غطاء سحابي متوسط',
      labelEn: 'Partly–Mostly Cloudy',
      meaningAr: 'انخفاض نسبي في البخر-نتح مع تزايد الرطوبة الجوية',
      meaningEn: 'Reduced evaporative demand and elevated air humidity',
    },
    {
      color: '#ffff01',
      rangeLabel: '61% – 82% Cloud',
      labelAr: 'سحب كثيفة ورطوبة عالية',
      labelEn: 'Dense Humid Overcast',
      meaningAr: 'بلل أوراق محتمل وفرص تساقط أمطار خفيفة إلى متوسطة',
      meaningEn: 'Elevated leaf wetness and rain potential',
    },
    {
      color: '#ff0005',
      rangeLabel: '83% – 100% Cloud',
      labelAr: 'غطاء سحابي كامل وعواصف',
      labelEn: 'Full Overcast / Storm Front',
      meaningAr: 'كتل سحابية ركامية كثيفة مصحوبة بفرص هطول أمطار غزيرة',
      meaningEn: 'Dense convective cloud mass with high rainfall potential',
    },
  ],
  temperature: [
    {
      color: '#006bff',
      rangeLabel: '< 0°C',
      labelAr: 'تجمد وصقيع شديد',
      labelEn: 'Sub-Zero Frost / Snow',
      meaningAr: 'مناطق متجمدة أو مرتفعات ثلجية دون الصفر المئوي (ناسا MODIS LST)',
      meaningEn: 'Sub-freezing ground and alpine snow cover',
    },
    {
      color: '#24ffab',
      rangeLabel: '0 – 15°C',
      labelAr: 'سطح بارد إلى معتدل',
      labelEn: 'Cool Land Surface',
      meaningAr: 'حرارة سطح منخفضة مناسبة للمحاصيل الشتوية وتقليل الفاقد التبخري',
      meaningEn: 'Cool surface regime ideal for winter crops',
    },
    {
      color: '#afff00',
      rangeLabel: '15 – 28°C',
      labelAr: 'نطاق دافئ مثالي للنمو',
      labelEn: 'Optimal Warm Canopy',
      meaningAr: 'تبريد نتح نشط للحقول الخضراء ونشاط مثالي للتمثيل الضوئي',
      meaningEn: 'Balanced transpiration cooling over healthy crops',
    },
    {
      color: '#ffd600',
      rangeLabel: '28 – 40°C',
      labelAr: 'سطح حار / تربة مكشوفة',
      labelEn: 'Hot Exposed Surface',
      meaningAr: 'ارتفاع حرارة التربة المكشوفة والمباني مع زيادة معدل البخر',
      meaningEn: 'Warm bare ground increasing soil evaporation',
    },
    {
      color: '#ff6a00',
      rangeLabel: '> 40°C (أحمر >52°)',
      labelAr: 'إجهاد حراري شديد',
      labelEn: 'Extreme Thermal Stress',
      meaningAr: 'ذروة الإشعاع الحراري؛ يُنصح بتكثيف الري وتجنب الرش وقت الظهيرة',
      meaningEn: 'Peak surface heat stress; avoid midday spraying',
    },
  ],
  drought: [
    {
      color: '#ffa200',
      rangeLabel: '0% – 10% SM',
      labelAr: 'جفاف حرج وأراضٍ قاحلة',
      labelEn: 'Critical Drought / Arid',
      meaningAr: 'جفاف شديد وتناقص حاد في مخزون الجذور (ناسا SMAP L4)',
      meaningEn: 'Severe root-zone moisture depletion (NASA SMAP L4)',
    },
    {
      color: '#fff800',
      rangeLabel: '10% – 20% SM',
      labelAr: 'رطوبة منخفضة (بداية جفاف)',
      labelEn: 'Low Moisture Deficit',
      meaningAr: 'بداية إجهاد مائي تتطلب جدولة رية تكميلية للمحصول',
      meaningEn: 'Early water deficit requiring scheduled irrigation',
    },
    {
      color: '#53a900',
      rangeLabel: '20% – 30% SM',
      labelAr: 'رطوبة زراعية متوازنة',
      labelEn: 'Moderate Soil Moisture',
      meaningAr: 'مخزون رطوبي مقبول يدعم استقرار الجذور والإنبات',
      meaningEn: 'Balanced moisture buffer supporting crop growth',
    },
    {
      color: '#00ca95',
      rangeLabel: '30% – 42% SM',
      labelAr: 'سعة حقلية مثالية (لا جفاف)',
      labelEn: 'Optimal Field Capacity',
      meaningAr: 'أفضل توازن للماء والهواء في منطقة الجذور لامتصاص العناصر NPK',
      meaningEn: 'Ideal root-zone hydration for peak nutrient uptake',
    },
    {
      color: '#008eff',
      rangeLabel: '> 42% SM',
      labelAr: 'تشبع رطوبي عالٍ (أزرق/كحلي)',
      labelEn: 'High Moisture Saturation',
      meaningAr: 'تربة مشبعة بالمياه؛ يجب إيقاف الري لتفادي اختناق الجذور',
      meaningEn: 'Saturated root zone; suspend irrigation immediately',
    },
  ],
  rainfall: [
    {
      color: '#00764e',
      rangeLabel: '0.1 – 0.3 mm/hr',
      labelAr: 'رذاذ مطري خفيف',
      labelEn: 'Light Rain Drizzle',
      meaningAr: 'هطول خفيف جداً (أخضر داكن في NASA IMERG) لا يغني عن الري',
      meaningEn: 'Very light rainfall; keep scheduled irrigation active',
    },
    {
      color: '#68cb00',
      rangeLabel: '0.3 – 1.5 mm/hr',
      labelAr: 'أمطار خفيفة إلى متوسطة',
      labelEn: 'Light–Moderate Rain',
      meaningAr: 'ترطيب سطحي للأوراق والتربة العليا مع غسيل خفيف للأتربة',
      meaningEn: 'Light canopy and topsoil wetting (NASA IMERG Lime)',
    },
    {
      color: '#f7d900',
      rangeLabel: '1.5 – 4.0 mm/hr',
      labelAr: 'أمطار متوسطة نافعة للمحصول',
      labelEn: 'Moderate Beneficial Rain',
      meaningAr: 'تغسل الأملاح السطحية وتوفر 35–60% من احتياج الرية القادمة',
      meaningEn: 'Leaches surface salts and reduces irrigation demand',
    },
    {
      color: '#ff5f25',
      rangeLabel: '4.0 – 12.0 mm/hr',
      labelAr: 'أمطار غزيرة (إيقاف الري)',
      labelEn: 'Heavy Rain (Halt Irrigation)',
      meaningAr: 'تغطي كامل الاحتياج المائي للمحصول؛ أوقف الري فوراً',
      meaningEn: 'Satisfies full crop water demand; halt irrigation now',
    },
    {
      color: '#f30000',
      rangeLabel: '> 12.0 mm/hr',
      labelAr: 'عاصفة مطرية شديدة جداً',
      labelEn: 'Severe Storm Accumulation',
      meaningAr: 'خطر تجمع المياه والغرق الجذري؛ افتح المصارف الحقلية فوراً',
      meaningEn: 'Waterlogging hazard; open drainage channels immediately',
    },
  ],
  elevation: [
    {
      color: '#0d9488',
      rangeLabel: '< 0 m ASL',
      labelAr: 'منخفضات تحت سطح البحر',
      labelEn: 'Sub-Sea Depressions',
      meaningAr: 'منخفضات جغرافية تحت مستوى سطح البحر مثل منخفض القطارة والبحر الميت',
      meaningEn: 'Sub-sea level basins and depressions (e.g., Qattara, Dead Sea)',
    },
    {
      color: '#16a34a',
      rangeLabel: '0 – 50 m ASL',
      labelAr: 'سهول ساحلية ودلتا منخفضة',
      labelEn: 'Low Alluvial Delta & Coast',
      meaningAr: 'أراضي دلتاوية وساحلية منبسطة خصبة مناسبة للري السطحي والمحوري',
      meaningEn: 'Flat alluvial delta and coastal plains suitable for irrigation',
    },
    {
      color: '#84cc16',
      rangeLabel: '50 – 200 m ASL',
      labelAr: 'سهول ومصاطب زراعية',
      labelEn: 'Lowland Plains & Terraces',
      meaningAr: 'صرف طبيعي متوازن وتهوية ممتازة لمنطقة الجذور',
      meaningEn: 'Balanced natural drainage and root-zone aeration',
    },
    {
      color: '#eab308',
      rangeLabel: '200 – 500 m ASL',
      labelAr: 'هضاب متوسطة الارتفاع',
      labelEn: 'Moderate Plateaus',
      meaningAr: 'ينصح بالري المحوري أو التنقيط لتجنب جريان المياه السطحية',
      meaningEn: 'Recommended for center-pivot or drip to prevent runoff',
    },
    {
      color: '#f97316',
      rangeLabel: '500 – 1000 m ASL',
      labelAr: 'تلال ومرتفعات صخرية',
      labelEn: 'Upland Hills & Escarpments',
      meaningAr: 'تحتاج مصاطب زراعية ونقاطات ري معوضة للضغط (PC)',
      meaningEn: 'Requires terracing and pressure-compensated drip emitters',
    },
    {
      color: '#dc2626',
      rangeLabel: '1000 – 2000 m ASL',
      labelAr: 'سلاسل جبلية متوسطة',
      labelEn: 'Mountain Ranges',
      meaningAr: 'انحدار عالٍ وبرودة مرتفعات؛ مخصص للمدرجات الجبلية والغابات',
      meaningEn: 'Steep terrain and cooler lapse rate; mountain ecosystems',
    },
    {
      color: '#9333ea',
      rangeLabel: '2000 – 3500 m ASL',
      labelAr: 'قمم جبلية عالية',
      labelEn: 'High Alpine Peaks',
      meaningAr: 'قمم جبلية شاهقة ذات مناخ جبلي بارد وانحدارات حادة',
      meaningEn: 'High alpine ridges with steep slopes and cold climate',
    },
    {
      color: '#f8fafc',
      rangeLabel: '> 3500 m ASL',
      labelAr: 'قمم شاهقة وأحزمة ثلجية',
      labelEn: 'Extreme High Summits',
      meaningAr: 'أعلى السلاسل الجبلية العالمية (مثل الهيمالايا والألب والأنديز)',
      meaningEn: 'Highest global mountain summits and glacial belts',
    },
  ],
  dem_drainage: [
    {
      color: '#1d4ed8',
      rangeLabel: '≥68% Risk',
      labelAr: 'منخفض حقلي حرج (تجمع المياه)',
      labelEn: 'Low-Lying Waterlogging Depression',
      meaningAr: 'أكثر النقاط انخفاضاً بالحقل؛ تتجمع فيها مياه الري والأمطار مع خطر تغدق الجذور وتعفنها',
      meaningEn: 'Lowest field pockets where runoff pools, posing high root-zone waterlogging hazard',
    },
    {
      color: '#06b6d4',
      rangeLabel: '48–67% Flow',
      labelAr: 'ممر صرف طبيعي وانحدار هادئ',
      labelEn: 'Natural Drainage Swale & Flow Path',
      meaningAr: 'مسار الجريان الطبيعي للمياه باتجاه المنخفضات؛ مناسب لتخطيط المصارف الزراعية',
      meaningEn: 'Natural surface flow corridor channeling runoff downhill; ideal collector drain path',
    },
    {
      color: '#84cc16',
      rangeLabel: '1.5–6% Grade',
      labelAr: 'أرض متوازنة الصرف والتهوية',
      labelEn: 'Balanced Agricultural Drainage Grade',
      meaningAr: 'انحدار مثالي يسمح بتصريف الفائض المائي دون تعرية أو تغدق',
      meaningEn: 'Optimal grade allowing excess water to drain without soil erosion or pooling',
    },
    {
      color: '#ea580c',
      rangeLabel: '≥6.5% Slope',
      labelAr: 'مرتفع سريع الجريان السطحي',
      labelEn: 'Elevated Rapid-Runoff Ridge',
      meaningAr: 'مناطق مرتفعة تتجه منها المياه للأسفل سريعاً؛ تتطلب ريّاً بالنبضات لتقليل الفاقد',
      meaningEn: 'Higher ground shedding surface water downhill rapidly; requires pulse irrigation',
    },
  ],
  soil_moisture: [
    {
      color: '#ffa200',
      rangeLabel: '0% – 10% SM',
      labelAr: 'جفاف حرج — نقطة الذبول',
      labelEn: 'Critical Dry (Wilting Point)',
      meaningAr: 'انخفاض حاد لرطوبة التربة في NASA SMAP يستلزم الري الفوري للمحصول',
      meaningEn: 'Severe depletion requiring immediate irrigation (NASA SMAP)',
    },
    {
      color: '#fff800',
      rangeLabel: '10% – 20% SM',
      labelAr: 'رطوبة منخفضة تحتاج ري',
      labelEn: 'Low Moisture (Irrigate)',
      meaningAr: 'بداية إجهاد مائي في الطبقة السطحية أو الجذرية؛ يُنصح بجدولة رية',
      meaningEn: 'Early moisture stress in surface/root layer; schedule irrigation',
    },
    {
      color: '#53a900',
      rangeLabel: '20% – 30% SM',
      labelAr: 'رطوبة معتدلة متوازنة',
      labelEn: 'Moderate Balanced Moisture',
      meaningAr: 'مستوى رطوبي مقبول يسمح بنشاط الجذور مع متابعة البخر-نتح',
      meaningEn: 'Adequate soil moisture buffer supporting normal root activity',
    },
    {
      color: '#00ca95',
      rangeLabel: '30% – 42% SM',
      labelAr: 'سعة حقلية مثالية للمحصول',
      labelEn: 'Optimal Field Capacity',
      meaningAr: 'أفضل توازن بين الماء والهواء في منطقة الجذور لامتصاص العناصر NPK',
      meaningEn: 'Ideal soil water-to-air balance for maximum NPK uptake',
    },
    {
      color: '#008eff',
      rangeLabel: '> 42% SM',
      labelAr: 'تشبع رطوبي عالٍ (أزرق/كحلي)',
      labelEn: 'High Saturation (Suspend Irrigation)',
      meaningAr: 'امتلاء كامل للمسام المائية؛ أوقف الري لتجنب اختناق الجذور',
      meaningEn: 'Saturated soil pores; suspend irrigation to prevent root hypoxia',
    },
  ],
  snow_ice: [
    {
      color: '#0f172a',
      rangeLabel: '0 cm (> +4°C)',
      labelAr: 'أرض دافئة خالية من الثلوج والصقيع',
      labelEn: 'Snow-Free & Frost-Safe',
      meaningAr: 'لا يوجد تساقط ثلجي أو صقيع سطحي؛ خط التجمد (0°C) مرتفع بعيداً عن سطح المحصول',
      meaningEn: 'Zero snow accumulation and freezing level well above crop canopy',
    },
    {
      color: '#0284c7',
      rangeLabel: '0 – 1 cm (0°C to +3°C)',
      labelAr: 'نطاق صقيع زراعي / صقيع إشعاعي',
      labelEn: 'Crop Frost Hazard Zone',
      meaningAr: 'انخفاض الحرارة قرب الصفر المئوي؛ خطر تجمد عصارة الأوراق والبراعم الحساسة فجراً',
      meaningEn: 'Near-zero canopy temperatures risking radiative frost damage at dawn',
    },
    {
      color: '#38bdf8',
      rangeLabel: '1 – 8 cm Snow',
      labelAr: 'تساقط ثلجي خفيف وغطاء جليدي رقيق',
      labelEn: 'Light Snowfall & Rime Ice',
      meaningAr: 'تراكم ثلجي خفيف على المرتفعات والسهول الباردة؛ يتطلب تدفئة الصوب والري الوقائي',
      meaningEn: 'Light snow cover on highlands and cold plains; protect tunnels and orchards',
    },
    {
      color: '#a855f7',
      rangeLabel: '8 – 28 cm Snow',
      labelAr: 'تراكم ثلوج كثيف وموجة صقيع قطبية',
      labelEn: 'Heavy Snow & Polar Freeze',
      meaningAr: 'تراكم ثلجي كثيف وهبوط خط التجمد؛ خطر تكسر الأفرع وتجمد شبكات الري السطحية',
      meaningEn: 'Heavy snow accumulation and low freezing level; drain exposed irrigation pipes',
    },
    {
      color: '#f8fafc',
      rangeLabel: '> 28 cm (عاصفة ثلجية)',
      labelAr: 'عاصفة ثلجية شديدة (Blizzard) وتراكم جليدي',
      labelEn: 'Severe Blizzard & Deep Snowpack',
      meaningAr: 'عاصفة ثلجية قطبية مصحوبة برياح عاتية وتراكم ثلجي كثيف يغطي القمم والمنحدرات',
      meaningEn: 'Full blizzard conditions with high winds and deep alpine snowpack',
    },
  ],
  day_night: [
    {
      color: '#020617',
      rangeLabel: 'الليل العميق (Elev < -12°)',
      labelAr: 'الليل الكامل وسكون التمثيل الضوئي (أضواء المدن)',
      labelEn: 'Astronomical Night & City Lights',
      meaningAr: 'غياب الإشعاع الشمسي وتنفس ليلي للنبات؛ تظهر إضاءة المدن والقرى في وادي النيل والدلتا',
      meaningEn: 'Zero solar irradiance (dark respiration phase) with nocturnal city lights visible',
    },
    {
      color: '#312e81',
      rangeLabel: 'الشفق والغسق (-12° to -1°)',
      labelAr: 'منطقة الشفق البحري والمدني (قبل الشروق / بعد الغروب)',
      labelEn: 'Dawn & Dusk Twilight Belt',
      meaningAr: 'انتقال تدريجي للإضاءة الجوية؛ التوقيت الأمثل للرش الورقي قبل نشاط الرياح',
      meaningEn: 'Transitional twilight zone; ideal calm window for early foliar spraying',
    },
    {
      color: '#f97316',
      rangeLabel: 'خط الفجر والغروب (-1° to +6°)',
      labelAr: 'خط الفجر والغسق الحي (Solar Terminator)',
      labelEn: 'Live Solar Terminator (Sunrise / Sunset)',
      meaningAr: 'الحد الفاصل الحي بين الليل والنهار على الكوكب؛ بداية فتح الثغور النباتية صباحاً',
      meaningEn: 'Active solar terminator boundary marking sunrise and sunset across the globe',
    },
    {
      color: '#facc15',
      rangeLabel: 'الصباح والضحى (+6° to +35°)',
      labelAr: 'إشراق الصباح والتمثيل الضوئي النشط',
      labelEn: 'Morning Daylight & Active Photosynthesis',
      meaningAr: 'إشعاع شمسي معتدل (250–650 W/m²) مثالي لأعلى كفاءة بناء ضوئي دون إجهاد حراري',
      meaningEn: 'Moderate solar irradiance optimal for peak stomatal conductance and photosynthesis',
    },
    {
      color: '#fef08a',
      rangeLabel: 'ذروة النهار (+35° to 90°)',
      labelAr: 'ذروة السطوع الشمسي وقت الظهيرة (Solar Noon)',
      labelEn: 'Peak Solar Noon Irradiance',
      meaningAr: 'أقصى إشعاع شمسي ساقط (> 800 W/m²)؛ ذروة البخر-نتح والحاجة لتوافر الرطوبة الجذرية',
      meaningEn: 'Maximum shortwave solar radiation and peak crop evapotranspiration demand',
    },
  ],
  apparent_temp: [
    {
      color: '#c084fc',
      rangeLabel: '< -10°C',
      labelAr: 'برد قارس وتجمد ريحي',
      labelEn: 'Severe Wind-Chill Freeze',
      meaningAr: 'انخفاض حاد في الحرارة المحسوسة يهدد البراعم والأنسجة الغضة',
      meaningEn: 'Bitter feels-like cold risking frostbite on tender crop shoots',
    },
    {
      color: '#06b6d4',
      rangeLabel: '0 – 14°C',
      labelAr: 'هواء بارد إلى لطيف',
      labelEn: 'Cool to Brisk Breeze',
      meaningAr: 'برودة معتدلة تتطلب تهوية مدروسة في الصوب الزراعية',
      meaningEn: 'Cool feels-like air ideal for winter crops and tunnel monitoring',
    },
    {
      color: '#22c55e',
      rangeLabel: '15 – 25°C',
      labelAr: 'نطاق مريح للعمل الحقلي والنبات',
      labelEn: 'Comfortable Field Zone',
      meaningAr: 'حرارة ظاهرية مثالية لنشاط العمال والعمليات الزراعية',
      meaningEn: 'Optimal thermal comfort for field crews and vegetative growth',
    },
    {
      color: '#eab308',
      rangeLabel: '26 – 34°C',
      labelAr: 'دفء وحمل حراري رطب',
      labelEn: 'Warm Humid Heat Load',
      meaningAr: 'ارتفاع ملموس في الحمل الحراري والرطوبة النسبية',
      meaningEn: 'Elevated apparent heat with rising humidity load',
    },
    {
      color: '#dc2626',
      rangeLabel: '> 35°C',
      labelAr: 'إجهاد حراري لاهب وخطر على العمال',
      labelEn: 'Extreme Apparent Heat Stress',
      meaningAr: 'جدولة العمل والري في الساعات الباكرة وتفادي ذروة الظهيرة',
      meaningEn: 'Shift field labor to early morning and run cooling pulse irrigation',
    },
  ],
  wind_gusts: [
    {
      color: '#475569',
      rangeLabel: '0 – 20 km/h',
      labelAr: 'هبات خفيفة وهادئة',
      labelEn: 'Calm Light Gusts',
      meaningAr: 'آمنة تماماً لجميع أعمال الرش الورقي والتلقيح',
      meaningEn: 'Safe for foliar spraying and pollination flights',
    },
    {
      color: '#3b82f6',
      rangeLabel: '20 – 40 km/h',
      labelAr: 'هبات متوسطة متقطعة',
      labelEn: 'Moderate Gusts',
      meaningAr: 'حذر عند رش المبيدات الدقيقة لاحتمال الانجراف',
      meaningEn: 'Exercise caution during fine-droplet spraying',
    },
    {
      color: '#22c55e',
      rangeLabel: '40 – 60 km/h',
      labelAr: 'هبات نشطة تثير الأتربة',
      labelEn: 'Fresh Dusty Gusts',
      meaningAr: 'منع الرش وتثبيت أغطية الأنفاق البلاستيكية والصوب',
      meaningEn: 'Halt spraying and secure greenhouse cladding',
    },
    {
      color: '#f97316',
      rangeLabel: '60 – 85 km/h',
      labelAr: 'هبات قوية خطرة على المحاصيل',
      labelEn: 'Strong Damaging Gusts',
      meaningAr: 'خطر رقاد الذرة والقمح وتكسر أفرع الموالح والمانجو',
      meaningEn: 'High lodging risk in tall cereals and fruit orchard limbs',
    },
    {
      color: '#7f1d1d',
      rangeLabel: '> 85 km/h',
      labelAr: 'عاصفة وهبات إعصارية مدمرة',
      labelEn: 'Severe Storm Gusts',
      meaningAr: 'حالة طوارئ حقلية — إيقاف البيفوت وتأمين المنشآت',
      meaningEn: 'Field emergency — park center pivots and lock greenhouses',
    },
  ],
  pressure: [
    {
      color: '#4c1d95',
      rangeLabel: '< 985 hPa',
      labelAr: 'منخفض جوي عميق (L)',
      labelEn: 'Deep Cyclone Low (L)',
      meaningAr: 'مركز منخفض جوي قوي مصحوب برياح عاتية واضطراب جوي واسع',
      meaningEn: 'Deep low-pressure center driving gale winds and storm fronts',
    },
    {
      color: '#2563eb',
      rangeLabel: '985 – 1005 hPa',
      labelAr: 'نطاق منخفضات وجبهات ممطرة',
      labelEn: 'Unsettled Frontal Trough',
      meaningAr: 'انخفاض الضغط يسبق عادةً نشاط الرياح وتكاثر السحب الممطرة',
      meaningEn: 'Falling barometer preceding frontal cloud bands and rain',
    },
    {
      color: '#10b981',
      rangeLabel: '1005 – 1016 hPa',
      labelAr: 'ضغط متوازن متقلب',
      labelEn: 'Neutral Pressure',
      meaningAr: 'استقرار نسبي على حافة الكتل الهوائية المعتدلة',
      meaningEn: 'Transitional surface pressure between air masses',
    },
    {
      color: '#f59e0b',
      rangeLabel: '1016 – 1026 hPa',
      labelAr: 'مرتفع جوي مستقر (H)',
      labelEn: 'Fair Weather High (H)',
      meaningAr: 'أجواء مشمسة مستقرة ومثالية لعمليات الخدمة والحصاد',
      meaningEn: 'Stable fair skies suited for harvesting and field operations',
    },
    {
      color: '#7f1d1d',
      rangeLabel: '> 1026 hPa',
      labelAr: 'مرتفع جوي قوي وموجات حارة/صقيع',
      labelEn: 'Strong Anticyclone Ridge',
      meaningAr: 'ثبات جوي طويل قد يسبب صقيعاً إشعاعياً شتاءً أو قبة حرارية صيفاً',
      meaningEn: 'Persistent dome causing winter frost inversions or summer heat domes',
    },
  ],
  thunderstorms: [
    {
      color: '#475569',
      rangeLabel: '0 – 200 J/kg',
      labelAr: 'غلاف جوي مستقر',
      labelEn: 'Stable Atmosphere',
      meaningAr: 'انعدام تيارات الحمل الحراري الرأسية',
      meaningEn: 'Negligible convective thunderstorm energy',
    },
    {
      color: '#06b6d4',
      rangeLabel: '200 – 800 J/kg',
      labelAr: 'عدم استقرار خفيف',
      labelEn: 'Weak Instability',
      meaningAr: 'سحب ركامية متفرقة قد تعطي زخات خفيفة',
      meaningEn: 'Isolated cumulus build-ups with minor shower potential',
    },
    {
      color: '#22c55e',
      rangeLabel: '800 – 1600 J/kg',
      labelAr: 'فرص عواصف رعدية متوسطة',
      labelEn: 'Moderate Thunderstorm Risk',
      meaningAr: 'نشاط رعدي محتمل يستوجب فتح مصارف الأمطار',
      meaningEn: 'Convective storms likely; clear field drainage channels',
    },
    {
      color: '#eab308',
      rangeLabel: '1600 – 2800 J/kg',
      labelAr: 'عواصف رعدية قوية وبَرَد',
      labelEn: 'Strong Storms & Hail',
      meaningAr: 'برق نشط وهبات هابطة وخطر تساقط البرد على المحاصيل',
      meaningEn: 'Active lightning, downbursts, and hail damage hazard',
    },
    {
      color: '#dc2626',
      rangeLabel: '> 2800 J/kg',
      labelAr: 'طاقة رعدية فائقة (Supercell)',
      labelEn: 'Extreme Severe CAPE',
      meaningAr: 'عواصف عنيفة وسيول سريعة — تنبيه طوارئ قصوى',
      meaningEn: 'Severe convective supercell hazard and flash flooding risk',
    },
  ],
  weather_radar: [
    {
      color: '#475569',
      rangeLabel: '0 – 8 dBZ',
      labelAr: 'رادار صافٍ',
      labelEn: 'Clear Echo',
      meaningAr: 'خلو الأجواء من خلايا الهطول المرصودة رادارياً',
      meaningEn: 'No active radar precipitation echoes',
    },
    {
      color: '#3b82f6',
      rangeLabel: '8 – 22 dBZ',
      labelAr: 'أمطار خفيفة ورذاذ',
      labelEn: 'Light Rain Echo',
      meaningAr: 'سحب ممطرة خفيفة التأثير على العمليات الحقلية',
      meaningEn: 'Light stratiform rain droplets',
    },
    {
      color: '#22c55e',
      rangeLabel: '22 – 36 dBZ',
      labelAr: 'أمطار متوسطة إلى غزيرة',
      labelEn: 'Moderate–Heavy Rain',
      meaningAr: 'هطول فعّال يضيف رطوبة ملحوظة للطبقة السطحية',
      meaningEn: 'Active rain cell contributing measurable moisture',
    },
    {
      color: '#eab308',
      rangeLabel: '36 – 48 dBZ',
      labelAr: 'خلايا رعدية غزيرة وبرق',
      labelEn: 'Convective Cell + Lightning',
      meaningAr: 'أمطار شديدة مصحوبة بضربات برق مرصودة (⚡)',
      meaningEn: 'Intense downpour with active Blitzortung lightning strikes (⚡)',
    },
    {
      color: '#dc2626',
      rangeLabel: '> 48 dBZ',
      labelAr: 'قلب عاصفة بردية وصواعق',
      labelEn: 'Hail Core & Extreme Bolts',
      meaningAr: 'خلايا عنيفة جداً مع خطر البَرَد والسيول والصواعق الكثيفة',
      meaningEn: 'Extreme radar reflectivity with hail & dense lightning hazard',
    },
  ],
  satellite_ir: [
    {
      color: '#0f172a',
      rangeLabel: '0 – 18%',
      labelAr: 'سماء صافية وسطح مكشوف',
      labelEn: 'Clear Surface Sky',
      meaningAr: 'إشعاع شمسي كامل نهاراً ورصد ممتاز لدرجة حرارة الأرض',
      meaningEn: 'Cloud-free sky with maximum solar irradiance',
    },
    {
      color: '#475569',
      rangeLabel: '18 – 45%',
      labelAr: 'سحب منخفضة / ضباب خفيف',
      labelEn: 'Low Stratus / Haze',
      meaningAr: 'قمم سحب دافئة قريبة من السطح أو ضباب صباحي',
      meaningEn: 'Low-altitude warm cloud tops or morning mist',
    },
    {
      color: '#94a3b8',
      rangeLabel: '45 – 75%',
      labelAr: 'أحزمة سحب جبهية متوسطة',
      labelEn: 'Mid-Level Frontal Cloud',
      meaningAr: 'كتل سحابية مصاحبة للمنخفضات الجوية العابرة',
      meaningEn: 'Frontal cloud shield tracking synoptic wave troughs',
    },
    {
      color: '#f8fafc',
      rangeLabel: '75 – 100%',
      labelAr: 'قمم سحب عميقة وباردة (-65°C)',
      labelEn: 'Deep Cold Cyclone Tops',
      meaningAr: 'سحب ركامية شاهقة الارتفاع وعواصف نشطة',
      meaningEn: 'Tall glaciated convective tops producing heavy storms',
    },
  ],
  humidity: [
    {
      color: '#786028',
      rangeLabel: '0 – 30%',
      labelAr: 'هواء جاف صحراوي',
      labelEn: 'Arid Dry Air',
      meaningAr: 'فقد بخر-نتح مرتفع وتناقص سريع لرطوبة التربة السطحية',
      meaningEn: 'High evaporative demand driving rapid topsoil drying',
    },
    {
      color: '#a89860',
      rangeLabel: '30 – 55%',
      labelAr: 'رطوبة نسبية معتدلة',
      labelEn: 'Moderate Balanced RH',
      meaningAr: 'نطاق مثالي للتلقيح وعقد الثمار وتقليل الأمراض الفطرية',
      meaningEn: 'Balanced RH favoring pollination and low fungal pressure',
    },
    {
      color: '#cbd5e1',
      rangeLabel: '55 – 75%',
      labelAr: 'رطوبة مرتفعة لطيفة',
      labelEn: 'Moist Growth Air',
      meaningAr: 'انخفاض إجهاد العطش وتوافر ندى ليلي خفيف',
      meaningEn: 'Lower water stress with mild nocturnal dew',
    },
    {
      color: '#e2e8f0',
      rangeLabel: '75 – 90%',
      labelAr: 'خطر أمراض فطرية وندى كثيف',
      labelEn: 'High Fungal Blight Risk',
      meaningAr: 'مراقبة البياض الزغبي والندوة المتأخرة في البطاطس والطماطم',
      meaningEn: 'Monitor downy mildew and late blight in potato/tomato leaves',
    },
    {
      color: '#ffffff',
      rangeLabel: '90 – 100%',
      labelAr: 'تشبع رطوبي وضباب كامل',
      labelEn: 'Saturated Fog & Dew',
      meaningAr: 'توقف البخر وظهور ضباب كثيف وبلل مستمر للأوراق',
      meaningEn: 'Near-100% saturation with persistent leaf wetness and fog',
    },
  ],
  air_quality: [
    {
      color: '#3b82f6',
      rangeLabel: '0 – 15 µg/m³',
      labelAr: 'هواء نقي ممتاز',
      labelEn: 'Clean Air',
      meaningAr: 'جودة هواء مثالية وشفافية شمسية كاملة',
      meaningEn: 'Pristine air quality with full solar transparency',
    },
    {
      color: '#fef08a',
      rangeLabel: '15 – 35 µg/m³',
      labelAr: 'جودة مقبولة / عوالق خفيفة',
      labelEn: 'Fair Light Haze',
      meaningAr: 'تأثير طفيف على الضوء المباشر',
      meaningEn: 'Minimal aerosol scattering',
    },
    {
      color: '#eab308',
      rangeLabel: '35 – 65 µg/m³',
      labelAr: 'غبار متوسط أو تلوث حضري',
      labelEn: 'Moderate Dust / Smog',
      meaningAr: 'بداية ترسب الأتربة على أوراق المحاصيل وخلايا الطاقة',
      meaningEn: 'Noticeable aerosol haze depositing dust on crop leaves',
    },
    {
      color: '#e11d48',
      rangeLabel: '65 – 120 µg/m³',
      labelAr: 'تركيز غبار وملوثات مرتفع',
      labelEn: 'Unhealthy Dust Plume',
      meaningAr: 'تقليل ساعات العمل الشاق وغسل الأوراق عند اللزوم بعد العاصفة',
      meaningEn: 'Elevated dust/aerosol load; limit strenuous outdoor work',
    },
    {
      color: '#450a0a',
      rangeLabel: '> 120 µg/m³',
      labelAr: 'عاصفة ترابية حادة / تلوث خطير',
      labelEn: 'Hazardous Dust Storm',
      meaningAr: 'انخفاض حاد للتمثيل الضوئي وتضرر التلقيح — تشغيل غسل المحوري بعد العاصفة',
      meaningEn: 'Severe dust storm blocking solar radiation and pollination',
    },
  ],
};

export const CLASSIC_TOPO_ELEVATION_COLOR_STOPS: ScientificColorStop[] = [
  {
    color: '#0f766e',
    rangeLabel: '< 0 m ASL',
    labelAr: 'منخفضات تحت سطح البحر',
    labelEn: 'Sub-Sea Depression',
    meaningAr: 'منخفضات وأحواض تحت منسوب سطح البحر',
    meaningEn: 'Sub-sea level inland basins',
  },
  {
    color: '#15803d',
    rangeLabel: '0 – 50 m ASL',
    labelAr: 'سهول ودلتا خضراء منخفضة',
    labelEn: 'Deep Valley & Delta Green',
    meaningAr: 'أراضي وادي ودلتا خصبة منخفضة المنسوب',
    meaningEn: 'Low-lying fertile river valley and delta plain',
  },
  {
    color: '#65a30d',
    rangeLabel: '50 – 200 m ASL',
    labelAr: 'مصاطب وسهول متوسطة',
    labelEn: 'Lowland Terrace Olive-Lime',
    meaningAr: 'مصاطب زراعية جيدة الصرف الطبيعي',
    meaningEn: 'Well-drained agricultural terrace',
  },
  {
    color: '#facc15',
    rangeLabel: '200 – 500 m ASL',
    labelAr: 'هضاب صفراء/رملية متموجة',
    labelEn: 'Warm Sand Plateau',
    meaningAr: 'هضاب متوسطة الارتفاع تتطلب ري محوري أو تنقيط',
    meaningEn: 'Rolling plateau suited for pivot or drip irrigation',
  },
  {
    color: '#d97706',
    rangeLabel: '500 – 1000 m ASL',
    labelAr: 'تلال ومرتفعات بنية فاتحة',
    labelEn: 'Ochre Upland Hills',
    meaningAr: 'مرتفعات متموجة وتلال صخرية',
    meaningEn: 'Upland hills and escarpments',
  },
  {
    color: '#92400e',
    rangeLabel: '1000 – 2000 m ASL',
    labelAr: 'سلاسل جبلية بنية داكنة',
    labelEn: 'Umber Mountain Ranges',
    meaningAr: 'مرتفعات وسلاسل جبلية عالية الانحدار',
    meaningEn: 'High mountain ranges',
  },
  {
    color: '#57260b',
    rangeLabel: '2000 – 3500 m ASL',
    labelAr: 'قمم جبلية داكنة جداً',
    labelEn: 'High Alpine Ridges',
    meaningAr: 'قمم جبلية عالية جداً',
    meaningEn: 'High alpine ridges',
  },
  {
    color: '#e2e8f0',
    rangeLabel: '> 3500 m ASL',
    labelAr: 'قمم ثلجية شاهقة',
    labelEn: 'Snow & Glacial Summits',
    meaningAr: 'قمم جبلية شاهقة الارتفاع',
    meaningEn: 'Extreme high mountain summits',
  },
];

/**
 * Evaluates a single spatial grid cell for the active unified layer (spectral or thematic),
 * guaranteeing 100% synchronization between cell colors, cell values, and the bottom legend.
 */
export function evaluateCellForUnifiedLayer(
  cell: SpatialGridCell,
  activeThematicMap: ThematicMapLayerId,
  activeLayer: SpectralIndexKey,
  forecast14: DailyWeatherPoint[],
  selectedDayIdx: number,
  isAr: boolean,
  elevationPalette: ElevationColorPalette = 'scientific_hypsometric',
  ventuskyOptions?: Partial<VentuskyAtmosphericOptions>,
  ventuskyLiveNodes?: VentuskyLiveTelemetryNode[]
): {
  color: string;
  numericValue: number;
  valueFormatted: string;
  layerShortLabel: string;
  categoryLabel: string;
} {
  const activeDay = forecast14[selectedDayIdx] || forecast14[0];
  const isUrban = cell.landCover === 'urban_built';

  if (activeThematicMap === 'natural') {
    return {
      color: '#15803d',
      numericValue: cell.values.NDVI,
      valueFormatted: isAr ? 'عرض طبيعي مباشر' : 'Natural True-Color',
      layerShortLabel: isAr ? 'الوضع الطبيعي' : 'Natural View',
      categoryLabel: isAr ? cell.landCoverLabelAr || 'مرئية طبيعية' : cell.landCoverLabelEn || 'True-Color',
    };
  }

  if (
    activeThematicMap === 'apparent_temp' ||
    activeThematicMap === 'wind_gusts' ||
    activeThematicMap === 'pressure' ||
    activeThematicMap === 'thunderstorms' ||
    activeThematicMap === 'weather_radar' ||
    activeThematicMap === 'satellite_ir' ||
    activeThematicMap === 'humidity' ||
    activeThematicMap === 'air_quality'
  ) {
    const vEval = evaluateVentuskyLayerAtLatLon(
      cell.center.lat,
      cell.center.lng,
      activeThematicMap,
      ventuskyOptions,
      activeDay,
      ventuskyLiveNodes
    );
    const meta = THEMATIC_MAPS_META[activeThematicMap];
    return {
      color: vEval.colorHex,
      numericValue: vEval.numericValue,
      valueFormatted: vEval.formattedValue,
      layerShortLabel: isAr ? meta.shortAr : meta.shortEn,
      categoryLabel: isAr ? vEval.statusAr : vEval.statusEn,
    };
  }

  if (activeThematicMap === 'wind') {
    const baseWind = activeDay?.windSpeedKmh ?? 16;
    // Open bare/urban areas experience higher surface wind velocity than dense rough crop canopies
    const roughnessDelta = isUrban
      ? 2.2
      : cell.landCover === 'bare_soil'
      ? 3.1
      : (0.65 - cell.values.NDVI) * 6.5;
    const cellWind = Number(Math.max(3.5, baseWind + roughnessDelta).toFixed(1));
    const color =
      cellWind < 12
        ? '#10b981'
        : cellWind < 18
        ? '#06b6d4'
        : cellWind < 24
        ? '#3b82f6'
        : cellWind < 32
        ? '#f59e0b'
        : '#ef4444';
    return {
      color,
      numericValue: cellWind,
      valueFormatted: `${cellWind} km/h`,
      layerShortLabel: isAr ? 'سرعة الرياح' : 'Wind Speed',
      categoryLabel:
        cellWind < 18
          ? isAr
            ? 'رش آمن'
            : 'Safe Spray'
          : isAr
          ? 'خطر انجراف الرش'
          : 'Drift Hazard',
    };
  }

  if (activeThematicMap === 'weather') {
    const baseCloud = activeDay?.cloudCoverPct ?? 24;
    const baseRh = activeDay?.relativeHumidityPct ?? 58;
    const microRhDelta = isUrban ? -6 : (cell.values.SM_0_7 - 24) * 0.45;
    const cellRh = Math.round(Math.max(16, Math.min(96, baseRh + microRhDelta)));
    const cellCloud = Math.round(Math.max(0, Math.min(100, baseCloud + microRhDelta * 0.6)));
    // Exact 1:1 NASA MODIS Cloud Fraction stops (#64748b, #0003ff, #055000, #ffff01, #ff0005)
    const color =
      cellCloud <= 18
        ? '#64748b'
        : cellCloud <= 38
        ? '#0003ff'
        : cellCloud <= 60
        ? '#055000'
        : cellCloud <= 82
        ? '#ffff01'
        : '#ff0005';
    return {
      color,
      numericValue: cellCloud,
      valueFormatted: `${cellCloud}% Cloud`,
      layerShortLabel: isAr ? 'الغطاء السحابي' : 'Cloud Cover',
      categoryLabel: `${cellCloud}% Cloud · ${cellRh}% RH`,
    };
  }

  if (activeThematicMap === 'rainfall') {
    // Combine selected day rainfall + 14-day cumulative & micro-topographic retention
    const dayRain = activeDay?.precipMm ?? 0;
    const dayProb = activeDay?.precipProbPct ?? 12;
    const total14Rain = forecast14.reduce((acc, d) => acc + (d.precipMm || 0), 0);
    const maxProb14 = forecast14.reduce((acc, d) => Math.max(acc, d.precipProbPct || 0), 0);

    // Spatial micro-convergence: cells with cooler canopy/higher NDWI and lower elevation retain more effective rain
    const spatialFactor = isUrban
      ? 0.55 // high runoff on impervious roofs
      : Math.max(0.75, Math.min(1.38, 0.92 + cell.values.NDWI * 0.85 + (cell.values.SM_0_7 - 22) * 0.012));

    // If selected day has rain > 0.2mm, show selected day spatial rain; otherwise show 14-day cumulative forecast distribution
    const baseEffectiveRain =
      dayRain >= 0.3
        ? dayRain
        : Math.max(total14Rain, (maxProb14 / 100) * 8.5);
    const cellRainMm = Number((baseEffectiveRain * spatialFactor).toFixed(1));
    const cellProbPct = Math.min(
      98,
      Math.max(
        5,
        Math.round((dayRain >= 0.3 ? dayProb : Math.max(dayProb, maxProb14 * 0.85)) * (0.88 + spatialFactor * 0.12))
      )
    );

    // Exact 1:1 NASA GPM IMERG Precipitation stops (#00764e, #68cb00, #f7d900, #ff5f25, #f30000)
    const color =
      cellRainMm > 12.0
        ? '#f30000'
        : cellRainMm > 4.0
        ? '#ff5f25'
        : cellRainMm > 1.5
        ? '#f7d900'
        : cellRainMm > 0.3
        ? '#68cb00'
        : '#00764e';

    return {
      color,
      numericValue: cellRainMm,
      valueFormatted: `${cellRainMm} mm (${cellProbPct}%)`,
      layerShortLabel:
        dayRain >= 0.3
          ? isAr
            ? 'أمطار اليوم المحدد'
            : 'Selected Day Rain'
          : isAr
          ? 'تراكم الأمطار المتوقع (14 يوم)'
          : '14-Day Forecast Rain',
      categoryLabel: `${cellRainMm} mm · ${cellProbPct}%`,
    };
  }

  if (activeThematicMap === 'elevation') {
    const elevReading = evaluateGlobalElevationAtLatLon(
      cell.center.lat,
      cell.center.lng,
      0,
      elevationPalette
    );
    return {
      color: elevReading.color,
      numericValue: elevReading.elevationMeters,
      valueFormatted: `${elevReading.elevationMeters} m ASL`,
      layerShortLabel: isAr ? 'ارتفاع الأرض' : 'Elevation',
      categoryLabel: isAr
        ? `${elevReading.landformAr} (انحدار ${elevReading.slopePct}%)`
        : `${elevReading.landformEn} (Slope ${elevReading.slopePct}%)`,
    };
  }

  if (activeThematicMap === 'dem_drainage') {
    const demReading = evaluateDemDrainageAtLatLon(cell.center.lat, cell.center.lng, 0.0024);
    return {
      color: demReading.color,
      numericValue: demReading.elevationMeters,
      valueFormatted: `${demReading.elevationMeters}m ${demReading.flowArrow} ${demReading.slopePct}%`,
      layerShortLabel: isAr ? 'صرف المياه (DEM)' : 'DEM Drainage',
      categoryLabel: isAr
        ? `صرف ${demReading.flowDirectionAr} · خطر تجمع ${demReading.waterAccumulationRiskPct}%`
        : `Flows ${demReading.flowDirectionEn} · Pool Risk ${demReading.waterAccumulationRiskPct}%`,
    };
  }

  if (activeThematicMap === 'snow_ice') {
    const elevReading = evaluateGlobalElevationAtLatLon(
      cell.center.lat,
      cell.center.lng,
      0,
      elevationPalette
    );
    const snowReading = evaluateGlobalSnowAndBlizzardAtLatLon(
      cell.center.lat,
      cell.center.lng,
      activeDay,
      elevReading.elevationMeters
    );
    return {
      color: snowReading.colorHex,
      numericValue: snowReading.snowDepthCm,
      valueFormatted:
        snowReading.snowDepthCm > 0
          ? `${snowReading.snowDepthCm} cm (${snowReading.criticalFrostTempC}°C)`
          : `${snowReading.criticalFrostTempC}°C (0 cm)`,
      layerShortLabel: isAr ? 'الثلوج والصقيع' : 'Snow & Frost',
      categoryLabel: isAr
        ? `${snowReading.statusAr} · خط التجمد ${snowReading.freezingLevelMeters}m`
        : `${snowReading.statusEn} · Freeze Lv ${snowReading.freezingLevelMeters}m`,
    };
  }

  if (activeThematicMap === 'day_night') {
    const dayNightReading = evaluateGlobalDayNightSolarAtLatLon(
      cell.center.lat,
      cell.center.lng
    );
    return {
      color: dayNightReading.colorHex,
      numericValue: dayNightReading.solarRadiationWm2,
      valueFormatted: `${dayNightReading.localTimeFormatted} (${dayNightReading.solarRadiationWm2} W/m²)`,
      layerShortLabel: isAr ? 'التوقيت والإشعاع الشمسي' : 'Solar Time & Irradiance',
      categoryLabel: isAr
        ? `${dayNightReading.periodLabelAr} · النهار ${dayNightReading.daylightHours} ساعة`
        : `${dayNightReading.periodLabelEn} · Daylight ${dayNightReading.daylightHours}h`,
    };
  }

  // Determine effective spectral key for temperature / drought / soil_moisture / vegetation / explicit spectral index
  const effectiveKey: SpectralIndexKey =
    activeThematicMap === 'temperature'
      ? 'LST'
      : (activeThematicMap === 'drought' || activeThematicMap === 'soil_moisture') &&
        activeLayer !== 'SM_7_28'
      ? 'SM_0_7'
      : activeLayer;

  const val = cell.values[effectiveKey];
  const spec = SPECTRAL_SCIENTIFIC_SPECS[effectiveKey];

  // Isolate urban_built cells in Red (#dc2626) ONLY on vegetation layers (NDVI, SAVI, EVI)
  if (
    isUrban &&
    activeThematicMap === 'vegetation' &&
    (effectiveKey === 'NDVI' || effectiveKey === 'SAVI' || effectiveKey === 'EVI')
  ) {
    return {
      color: '#dc2626',
      numericValue: val,
      valueFormatted: `${val}${spec.unit}`,
      layerShortLabel: isAr ? spec.shortAr : spec.shortEn,
      categoryLabel: isAr ? 'مناطق مبنية وحضر (معزول بالأحمر)' : 'Urban Built-up (Red Isolated)',
    };
  }

  // Ensure uncultivated bare soil is isolated in Yellow (#eab308) ONLY on vegetation layers
  if (
    cell.landCover === 'bare_soil' &&
    activeThematicMap === 'vegetation' &&
    (effectiveKey === 'NDVI' || effectiveKey === 'SAVI' || effectiveKey === 'EVI')
  ) {
    return {
      color: '#eab308',
      numericValue: val,
      valueFormatted: `${val}${spec.unit}`,
      layerShortLabel: isAr ? spec.shortAr : spec.shortEn,
      categoryLabel: isAr ? 'أرض غير مزروعة / تربة مكشوفة' : 'Uncultivated Bare Soil',
    };
  }

  const thematicColor =
    activeThematicMap === 'temperature'
      ? getGlobalTemperatureColor(val)
      : activeThematicMap === 'drought' || activeThematicMap === 'soil_moisture'
      ? getSoilMoistureColorAndRgb(val).color
      : getSpectralColor(effectiveKey, val);

  return {
    color: thematicColor,
    numericValue: val,
    valueFormatted: `${val}${spec.unit}`,
    layerShortLabel: isAr ? spec.shortAr : spec.shortEn,
    categoryLabel: isAr ? cell.landCoverLabelAr || '' : cell.landCoverLabelEn || '',
  };
}

function orientGradientForLocale(gradientCss: string, isAr: boolean): string {
  if (!isAr) return gradientCss;
  return gradientCss.replace('linear-gradient(to right,', 'linear-gradient(to left,');
}

/**
 * Resolves the complete UnifiedActiveLayerSpec for the current map state so that
 * top pills, map cells, and the bottom legend bar + scientific table are 100% synchronized.
 */
export function resolveUnifiedActiveLayerSpec(
  activeThematicMap: ThematicMapLayerId,
  activeLayer: SpectralIndexKey,
  farmAverages: Record<SpectralIndexKey, number>,
  gridCells: SpatialGridCell[],
  forecast14: DailyWeatherPoint[],
  selectedDayIdx: number,
  isAr: boolean,
  elevationPalette: ElevationColorPalette = 'scientific_hypsometric',
  ventuskyOptions?: Partial<VentuskyAtmosphericOptions>,
  ventuskyLiveNodes?: VentuskyLiveTelemetryNode[]
): UnifiedActiveLayerSpec {
  const activeDay = forecast14[selectedDayIdx] || forecast14[0];
  const vOpts = ventuskyOptions;

  const isSecondaryFieldSpectral =
    activeThematicMap === 'vegetation' &&
    (activeLayer === 'NDWI' ||
      activeLayer === 'SAVI' ||
      activeLayer === 'NDMI' ||
      activeLayer === 'EVI' ||
      activeLayer === 'SOIL_EC' ||
      activeLayer === 'SOIL_PH' ||
      activeLayer === 'SM_7_28');

  if (!isSecondaryFieldSpectral) {
    const meta = THEMATIC_MAPS_META[activeThematicMap];
    const evals =
      gridCells.length > 0
        ? gridCells.map((c) =>
            evaluateCellForUnifiedLayer(
              c,
              activeThematicMap,
              activeLayer,
              forecast14,
              selectedDayIdx,
              isAr,
              elevationPalette,
              vOpts,
              ventuskyLiveNodes
            )
          )
        : [];

    const centroidFallbackLat = gridCells[0]?.center?.lat ?? 30.05;
    const centroidFallbackLng = gridCells[0]?.center?.lng ?? 31.23;
    const ventuskyFallback = evaluateVentuskyLayerAtLatLon(
      centroidFallbackLat,
      centroidFallbackLng,
      activeThematicMap,
      vOpts,
      activeDay,
      ventuskyLiveNodes
    );

    const avgNumeric =
      evals.length > 0
        ? Number(
            (evals.reduce((acc, e) => acc + e.numericValue, 0) / evals.length).toFixed(2)
          )
        : activeThematicMap === 'natural'
        ? 0
        : activeThematicMap === 'wind'
        ? activeDay?.windSpeedKmh ?? 16
        : activeThematicMap === 'weather'
        ? activeDay?.cloudCoverPct ?? 24
        : activeThematicMap === 'temperature'
        ? activeDay?.earthSkinTempC ?? activeDay?.tempMaxC ?? 25
        : activeThematicMap === 'soil_moisture' || activeThematicMap === 'drought'
        ? activeDay?.soilMoisture0to7Pct ?? 24
        : activeThematicMap === 'vegetation'
        ? farmAverages.NDVI
        : activeThematicMap === 'elevation'
        ? 14
        : activeThematicMap === 'dem_drainage'
        ? 12
        : activeThematicMap === 'snow_ice'
        ? 0
        : activeThematicMap === 'day_night'
        ? 620
        : activeThematicMap === 'apparent_temp' ||
          activeThematicMap === 'wind_gusts' ||
          activeThematicMap === 'pressure' ||
          activeThematicMap === 'thunderstorms' ||
          activeThematicMap === 'weather_radar' ||
          activeThematicMap === 'satellite_ir' ||
          activeThematicMap === 'humidity' ||
          activeThematicMap === 'air_quality'
        ? ventuskyFallback.numericValue
        : activeDay?.precipMm ?? 0;

    const meanValueFormatted =
      activeThematicMap === 'natural'
        ? isAr
          ? 'مرئية القمر الصناعي الطبيعية'
          : 'True-Color Satellite View'
        : activeThematicMap === 'apparent_temp'
        ? `${avgNumeric}°C`
        : activeThematicMap === 'wind_gusts'
        ? `${Math.round(avgNumeric)} km/h`
        : activeThematicMap === 'pressure'
        ? `${Math.round(avgNumeric)} hPa`
        : activeThematicMap === 'thunderstorms'
        ? `${Math.round(avgNumeric)} J/kg`
        : activeThematicMap === 'weather_radar'
        ? `${Math.round(avgNumeric)} dBZ`
        : activeThematicMap === 'satellite_ir'
        ? `${Math.round(avgNumeric)}% IR`
        : activeThematicMap === 'humidity'
        ? vOpts?.pressureAltitude === 'dew_point'
          ? `${avgNumeric}°C DewPt`
          : `${Math.round(avgNumeric)}%`
        : activeThematicMap === 'air_quality'
        ? `${avgNumeric}${ventuskyFallback.unit}`
        : gridCells.length === 0
        ? isAr
          ? 'انقر على الخريطة لعرض القراءة'
          : 'Click map to inspect'
        : activeThematicMap === 'wind'
        ? `${avgNumeric} km/h (${
            isAr
              ? activeDay?.windDirectionCardinalAr || 'شمالية غربية'
              : activeDay?.windDirectionCardinalEn || 'NW'
          })`
        : activeThematicMap === 'weather'
        ? `${Math.round(avgNumeric)}% Cloud · ${activeDay?.relativeHumidityPct ?? 58}% RH`
        : activeThematicMap === 'temperature'
        ? `${avgNumeric}°C`
        : activeThematicMap === 'soil_moisture' || activeThematicMap === 'drought'
        ? `${avgNumeric}% SM`
        : activeThematicMap === 'vegetation'
        ? `${avgNumeric} NDVI`
        : activeThematicMap === 'elevation'
        ? `${Math.round(avgNumeric)} m ASL`
        : activeThematicMap === 'dem_drainage'
        ? `${Math.round(avgNumeric)} m ASL (DEM)`
        : activeThematicMap === 'snow_ice'
        ? `${avgNumeric} cm Snow · Min ${activeDay?.tempMinC ?? 9}°C`
        : activeThematicMap === 'day_night'
        ? `${Math.round(avgNumeric)} W/m²`
        : `${avgNumeric} mm (${Math.max(
            activeDay?.precipProbPct ?? 15,
            ...forecast14.map((d) => d.precipProbPct || 0)
          )}%)`;

    const modelLabel = vOpts?.forecastModel ?? 'AUTO';
    const formulaCode =
      activeThematicMap === 'natural'
        ? 'RGB_TrueColor = HighRes_Satellite_BaseMap(Sentinel2_Esri_Google_OSM)'
        : activeThematicMap === 'wind'
        ? `V_stream = Wind(${vOpts?.windAltitude ?? '10m'}) [${modelLabel}] + Streamlines`
        : activeThematicMap === 'wind_gusts'
        ? `V_gust = Max_Wind_Gust_10m [${modelLabel}] [km/h]`
        : activeThematicMap === 'apparent_temp'
        ? `T_app = f(T_2m, RH%, V_10m, Rad_SW) [${modelLabel}] [°C]`
        : activeThematicMap === 'pressure'
        ? `P_MSL = Mean_Sea_Level_Pressure [${modelLabel}] + 4hPa Isobars + H/L`
        : activeThematicMap === 'thunderstorms'
        ? `CAPE = Convective_Available_Potential_Energy [${modelLabel}] [J/kg]`
        : activeThematicMap === 'weather_radar'
        ? `Z_dBZ = WORAD_Reflectivity [0–60 dBZ] + Blitzortung Lightning (⚡)`
        : activeThematicMap === 'satellite_ir'
        ? `BT_IR = Geostationary(GOES + HIMAWARI + METEOSAT) Clouds`
        : activeThematicMap === 'humidity'
        ? `RH_${vOpts?.pressureAltitude ?? '2m'} = Open-Meteo/GFS Multi-Level Moisture [%]`
        : activeThematicMap === 'air_quality'
        ? `${vOpts?.airPollutant ?? 'PM2.5'} = SILAM / Open-Meteo CAMS [${ventuskyFallback.unit.trim()}]`
        : activeThematicMap === 'weather'
        ? `Cloud_Fraction(${vOpts?.cloudFilter ?? 'total'}) = NASA_GIBS_MODIS_Cloud_Day [0–100%]`
        : activeThematicMap === 'temperature'
        ? `T_${vOpts?.pressureAltitude ?? '2m'} = Smooth_Temp_Model [${modelLabel}] [°C]`
        : activeThematicMap === 'soil_moisture' || activeThematicMap === 'drought'
        ? 'SM_Vol = MicroPixel_SMAP_RootZone(lat,lng) + Open-Meteo 0cm/7cm [%]'
        : activeThematicMap === 'vegetation'
        ? 'NDVI = MicroPixel_MODIS_Sentinel2(ρ_NIR - ρ_Red) / (ρ_NIR + ρ_Red)'
        : activeThematicMap === 'elevation'
        ? 'Z_3D = MicroPixel_3D_SRTM_DEM(lat,lng) + Peak_Relief_Shading [m ASL]'
        : activeThematicMap === 'dem_drainage'
        ? 'D8_Flow = argmax(-ΔZ / Δs) + TWI_Depression(Z_mean_local - Z_px) [m ASL & %]'
        : activeThematicMap === 'snow_ice'
        ? 'Snow_Depth = NDSI_MODIS_Snow(lat,lng,Z) + Blizzard_Track(V_wind, T_freeze_0C) [cm]'
        : activeThematicMap === 'day_night'
        ? 'sin(α_sun) = sin(φ)sin(δ) + cos(φ)cos(δ)cos(H_UTC + λ) [Terminator & W/m²]'
        : `P_rate(${vOpts?.precipAccumWindow ?? '3h'}) = Smooth_GPM_IMERG_Rate [${modelLabel}] [mm]`;

    const rawGradientCss =
      activeThematicMap === 'elevation' && elevationPalette === 'classic_topographic'
        ? 'linear-gradient(to right, #0f766e 0% 10%, #15803d 10% 24%, #65a30d 24% 38%, #facc15 38% 52%, #d97706 52% 66%, #92400e 66% 80%, #57260b 80% 92%, #e2e8f0 92% 100%)'
        : meta.gradientCss;

    const activeColorStops =
      activeThematicMap === 'elevation' && elevationPalette === 'classic_topographic'
        ? CLASSIC_TOPO_ELEVATION_COLOR_STOPS
        : THEMATIC_COLOR_STOPS[activeThematicMap];

    const dynamicUnit =
      activeThematicMap === 'humidity' && vOpts?.pressureAltitude === 'dew_point'
        ? '°C'
        : activeThematicMap === 'air_quality'
        ? ventuskyFallback.unit
        : meta.unit;

    return {
      selectionType: 'thematic',
      activeLayer,
      activeThematicMap,
      badgeCode: activeThematicMap.toUpperCase(),
      titleAr: meta.titleAr,
      titleEn: meta.titleEn,
      shortAr:
        activeThematicMap === 'air_quality'
          ? `${meta.shortAr} (${vOpts?.airPollutant ?? 'PM2.5'})`
          : activeThematicMap === 'humidity' && vOpts?.pressureAltitude === 'dew_point'
          ? isAr
            ? 'نقطة الندى (Dew Point)'
            : 'Dew Point'
          : meta.shortAr,
      shortEn:
        activeThematicMap === 'air_quality'
          ? `${meta.shortEn} (${vOpts?.airPollutant ?? 'PM2.5'})`
          : activeThematicMap === 'humidity' && vOpts?.pressureAltitude === 'dew_point'
          ? 'Dew Point (°C)'
          : meta.shortEn,
      unit: dynamicUnit,
      meanValueFormatted,
      minLabelAr: meta.minLabelAr,
      maxLabelAr: meta.maxLabelAr,
      minLabelEn: meta.minLabelEn,
      maxLabelEn: meta.maxLabelEn,
      gradientCss: orientGradientForLocale(rawGradientCss, isAr),
      formulaCode,
      methodologyAr: meta.subtitleAr,
      methodologyEn: meta.subtitleEn,
      colorStops: activeColorStops,
    };
  }

  const effectiveKey: SpectralIndexKey = activeLayer;

  const spec = SPECTRAL_SCIENTIFIC_SPECS[effectiveKey];
  const val = farmAverages[effectiveKey];

  return {
    selectionType: 'spectral',
    activeLayer: effectiveKey,
    activeThematicMap,
    badgeCode: effectiveKey,
    titleAr: spec.titleAr,
    titleEn: spec.titleEn,
    shortAr: spec.shortAr,
    shortEn: spec.shortEn,
    unit: spec.unit,
    meanValueFormatted: `${val}${spec.unit}`,
    minLabelAr: spec.minAr,
    maxLabelAr: spec.maxAr,
    minLabelEn: spec.minEn,
    maxLabelEn: spec.maxEn,
    gradientCss: orientGradientForLocale(spec.gradientCss, isAr),
    formulaCode: spec.formulaCode,
    methodologyAr: spec.methodologyAr,
    methodologyEn: spec.methodologyEn,
    colorStops: spec.colorStops,
  };
}

export interface SatelliteMissionChoice {
  id: string;
  satelliteAr: string;
  satelliteEn: string;
  dataNameAr: string;
  dataNameEn: string;
  resolutionBadge: string;
  actionType: 'thematic' | 'spectral';
  thematicMapId?: ThematicMapLayerId;
  spectralIndexKey?: SpectralIndexKey;
}

export interface SatelliteCatalogGroup {
  id: string;
  titleAr: string;
  titleEn: string;
  accentColor: 'emerald' | 'sky' | 'amber' | 'violet' | 'cyan';
  choices: SatelliteMissionChoice[];
}

export interface ActiveSatelliteSelectionMeta {
  isDefaultNatural: boolean;
  activeChoiceId: string;
  satelliteShortAr: string;
  satelliteShortEn: string;
  dataShortAr: string;
  dataShortEn: string;
  resolutionBadge: string;
}

const SATELLITE_MISSION_CATALOG: SatelliteCatalogGroup[] = [
  {
    id: 'optical_vegetation',
    titleAr: 'أقمار الرصد البصري والنباتات (Sentinel-2 & NASA MODIS)',
    titleEn: 'Optical & Crop Vegetation Satellites (Sentinel-2 & MODIS)',
    accentColor: 'emerald',
    choices: [
      {
        id: 'NDVI',
        satelliteAr: 'Sentinel-2 + MODIS',
        satelliteEn: 'Sentinel-2 + MODIS',
        dataNameAr: 'كثافة الغطاء النباتي (NDVI)',
        dataNameEn: 'Vegetation Density (NDVI)',
        resolutionBadge: '10m',
        actionType: 'spectral',
        spectralIndexKey: 'NDVI',
        thematicMapId: 'vegetation',
      },
      {
        id: 'NDWI',
        satelliteAr: 'Sentinel-2 Optical',
        satelliteEn: 'Sentinel-2 Optical',
        dataNameAr: 'تجمعات المياه ورطوبة الأوراق (NDWI)',
        dataNameEn: 'Surface Water & Leaf Moisture (NDWI)',
        resolutionBadge: '10m',
        actionType: 'spectral',
        spectralIndexKey: 'NDWI',
        thematicMapId: 'vegetation',
      },
      {
        id: 'SAVI',
        satelliteAr: 'Sentinel-2 Optical',
        satelliteEn: 'Sentinel-2 Optical',
        dataNameAr: 'الغطاء النباتي وتصحيح التربة (SAVI)',
        dataNameEn: 'Soil-Adjusted Vegetation (SAVI)',
        resolutionBadge: '10m',
        actionType: 'spectral',
        spectralIndexKey: 'SAVI',
        thematicMapId: 'vegetation',
      },
      {
        id: 'NDMI',
        satelliteAr: 'Sentinel-2 SWIR',
        satelliteEn: 'Sentinel-2 SWIR',
        dataNameAr: 'الإجهاد المائي بالمحاصيل (NDMI)',
        dataNameEn: 'Canopy Water Stress (NDMI)',
        resolutionBadge: '20m',
        actionType: 'spectral',
        spectralIndexKey: 'NDMI',
        thematicMapId: 'vegetation',
      },
      {
        id: 'EVI',
        satelliteAr: 'NASA MODIS Terra',
        satelliteEn: 'NASA MODIS Terra',
        dataNameAr: 'مؤشر النمو المحسّن (EVI)',
        dataNameEn: 'Enhanced Vegetation Index (EVI)',
        resolutionBadge: '250m',
        actionType: 'spectral',
        spectralIndexKey: 'EVI',
        thematicMapId: 'vegetation',
      },
      {
        id: 'LST',
        satelliteAr: 'NASA MODIS Thermal',
        satelliteEn: 'NASA MODIS Thermal',
        dataNameAr: 'حرارة سطح الأرض والنباتات (LST)',
        dataNameEn: 'Land Surface Temperature (LST)',
        resolutionBadge: '1km',
        actionType: 'spectral',
        spectralIndexKey: 'LST',
        thematicMapId: 'temperature',
      },
    ],
  },
  {
    id: 'soil_hydrology',
    titleAr: 'أقمار رطوبة التربة والملوحة (NASA SMAP & SoilGrids)',
    titleEn: 'Soil Moisture & Chemistry Satellites (NASA SMAP & SoilGrids)',
    accentColor: 'amber',
    choices: [
      {
        id: 'soil_moisture',
        satelliteAr: 'NASA SMAP L4',
        satelliteEn: 'NASA SMAP L4',
        dataNameAr: 'رطوبة التربة السطحية (0–7 سم)',
        dataNameEn: 'Surface Soil Moisture (0–7 cm)',
        resolutionBadge: 'SM 0cm',
        actionType: 'thematic',
        thematicMapId: 'soil_moisture',
      },
      {
        id: 'SM_7_28',
        satelliteAr: 'NASA SMAP + Open-Meteo',
        satelliteEn: 'NASA SMAP + Open-Meteo',
        dataNameAr: 'رطوبة منطقة الجذور (7–28 سم)',
        dataNameEn: 'Root-Zone Soil Moisture (7–28 cm)',
        resolutionBadge: 'SM 28cm',
        actionType: 'spectral',
        spectralIndexKey: 'SM_7_28',
        thematicMapId: 'vegetation',
      },
      {
        id: 'drought',
        satelliteAr: 'NASA SMAP / POWER',
        satelliteEn: 'NASA SMAP / POWER',
        dataNameAr: 'مؤشر الجفاف الزراعي الشامل',
        dataNameEn: 'Agricultural Drought Stress',
        resolutionBadge: 'SMAP',
        actionType: 'thematic',
        thematicMapId: 'drought',
      },
      {
        id: 'SOIL_EC',
        satelliteAr: 'ISRIC SoilGrids v2',
        satelliteEn: 'ISRIC SoilGrids v2',
        dataNameAr: 'ملوحة التربة (EC dS/m)',
        dataNameEn: 'Soil Salinity (EC dS/m)',
        resolutionBadge: '250m',
        actionType: 'spectral',
        spectralIndexKey: 'SOIL_EC',
        thematicMapId: 'vegetation',
      },
      {
        id: 'SOIL_PH',
        satelliteAr: 'ISRIC SoilGrids v2',
        satelliteEn: 'ISRIC SoilGrids v2',
        dataNameAr: 'حموضة وقلوية التربة (pH)',
        dataNameEn: 'Soil Reaction (pH)',
        resolutionBadge: '250m',
        actionType: 'spectral',
        spectralIndexKey: 'SOIL_PH',
        thematicMapId: 'vegetation',
      },
    ],
  },
  {
    id: 'weather_atmosphere',
    titleAr: 'أقمار الطقس والأمطار والسحب (NASA GPM / GOES / ECMWF)',
    titleEn: 'Weather, Rain & Cloud Satellites (NASA GPM / GOES / ECMWF)',
    accentColor: 'sky',
    choices: [
      {
        id: 'rainfall',
        satelliteAr: 'NASA GPM IMERG',
        satelliteEn: 'NASA GPM IMERG',
        dataNameAr: 'خريطة الأمطار والهطول الفضائي',
        dataNameEn: 'Satellite Precipitation & Rain',
        resolutionBadge: 'GPM',
        actionType: 'thematic',
        thematicMapId: 'rainfall',
      },
      {
        id: 'satellite_ir',
        satelliteAr: 'GOES + METEOSAT IR',
        satelliteEn: 'GOES + METEOSAT IR',
        dataNameAr: 'مرئيات السحب بالأشعة تحت الحمراء',
        dataNameEn: 'Infrared Geostationary Clouds',
        resolutionBadge: 'IR',
        actionType: 'thematic',
        thematicMapId: 'satellite_ir',
      },
      {
        id: 'weather_radar',
        satelliteAr: 'WORAD + Blitzortung',
        satelliteEn: 'WORAD + Blitzortung',
        dataNameAr: 'رادار الطقس الحي والصواعق',
        dataNameEn: 'Live Weather Radar & Lightning',
        resolutionBadge: 'dBZ',
        actionType: 'thematic',
        thematicMapId: 'weather_radar',
      },
      {
        id: 'temperature',
        satelliteAr: 'ICON / GFS / ECMWF',
        satelliteEn: 'ICON / GFS / ECMWF',
        dataNameAr: 'درجات حرارة الهواء والسطح',
        dataNameEn: 'Air & Surface Temperature',
        resolutionBadge: '°C',
        actionType: 'thematic',
        thematicMapId: 'temperature',
      },
      {
        id: 'wind',
        satelliteAr: 'ICON / NOAA GFS',
        satelliteEn: 'ICON / NOAA GFS',
        dataNameAr: 'اتجاه وسرعة الرياح الانسيابية',
        dataNameEn: 'Wind Velocity & Streamlines',
        resolutionBadge: 'km/h',
        actionType: 'thematic',
        thematicMapId: 'wind',
      },
      {
        id: 'humidity',
        satelliteAr: 'ECMWF / GFS',
        satelliteEn: 'ECMWF / GFS',
        dataNameAr: 'الرطوبة النسبية ونقطة الندى',
        dataNameEn: 'Relative Humidity & Dew Point',
        resolutionBadge: 'RH%',
        actionType: 'thematic',
        thematicMapId: 'humidity',
      },
      {
        id: 'air_quality',
        satelliteAr: 'SILAM / CAMS',
        satelliteEn: 'SILAM / CAMS',
        dataNameAr: 'جودة الهواء والغبار ومؤشر UV',
        dataNameEn: 'Air Quality, Dust & UV Index',
        resolutionBadge: 'AQI',
        actionType: 'thematic',
        thematicMapId: 'air_quality',
      },
      {
        id: 'pressure',
        satelliteAr: 'ECMWF / GFS MSLP',
        satelliteEn: 'ECMWF / GFS MSLP',
        dataNameAr: 'الضغط الجوي وخطوط الأيزوبار',
        dataNameEn: 'Barometric Pressure & Isobars',
        resolutionBadge: 'hPa',
        actionType: 'thematic',
        thematicMapId: 'pressure',
      },
      {
        id: 'thunderstorms',
        satelliteAr: 'NOAA GFS CAPE',
        satelliteEn: 'NOAA GFS CAPE',
        dataNameAr: 'طاقة العواصف الرعدية (CAPE)',
        dataNameEn: 'Thunderstorm Energy (CAPE)',
        resolutionBadge: 'J/kg',
        actionType: 'thematic',
        thematicMapId: 'thunderstorms',
      },
      {
        id: 'snow_ice',
        satelliteAr: 'NASA MODIS Snow',
        satelliteEn: 'NASA MODIS Snow',
        dataNameAr: 'الثلوج وخط التجمد والصقيع',
        dataNameEn: 'Snow Pack & Freezing Level',
        resolutionBadge: '0°C',
        actionType: 'thematic',
        thematicMapId: 'snow_ice',
      },
      {
        id: 'day_night',
        satelliteAr: 'Solar Ephemeris',
        satelliteEn: 'Solar Ephemeris',
        dataNameAr: 'خط النهار والليل والسطوع الشمسي',
        dataNameEn: 'Solar Terminator & Daylight',
        resolutionBadge: 'W/m²',
        actionType: 'thematic',
        thematicMapId: 'day_night',
      },
    ],
  },
  {
    id: 'terrain_radar',
    titleAr: 'رادار التضاريس وصرف المياه (SRTM / Terrarium DEM)',
    titleEn: 'Elevation & Drainage Radar (NASA SRTM / Terrarium 30m DEM)',
    accentColor: 'cyan',
    choices: [
      {
        id: 'elevation',
        satelliteAr: 'SRTM / Terrarium DEM',
        satelliteEn: 'SRTM / Terrarium DEM',
        dataNameAr: 'ارتفاعات الأرض والكنتور 3D',
        dataNameEn: 'Land Elevation & Contours',
        resolutionBadge: '30m',
        actionType: 'thematic',
        thematicMapId: 'elevation',
      },
      {
        id: 'dem_drainage',
        satelliteAr: 'SRTM Hydrology DEM',
        satelliteEn: 'SRTM Hydrology DEM',
        dataNameAr: 'صرف المياه والمنخفضات الحقلية',
        dataNameEn: 'Drainage Flow & Low Spots',
        resolutionBadge: '30m',
        actionType: 'thematic',
        thematicMapId: 'dem_drainage',
      },
    ],
  },
];

export function getSatelliteMissionCatalog(): SatelliteCatalogGroup[] {
  return SATELLITE_MISSION_CATALOG;
}

export function resolveActiveSatelliteSelectionMeta(
  activeThematicMap: ThematicMapLayerId,
  activeLayer: SpectralIndexKey,
  baseStyleShortAr: string,
  baseStyleShortEn: string
): ActiveSatelliteSelectionMeta {
  if (activeThematicMap === 'natural') {
    return {
      isDefaultNatural: true,
      activeChoiceId: 'natural',
      satelliteShortAr: 'الوضع الافتراضي',
      satelliteShortEn: 'Default View',
      dataShortAr: baseStyleShortAr || 'خريطة طبيعية',
      dataShortEn: baseStyleShortEn || 'Natural Map',
      resolutionBadge: 'RGB',
    };
  }

  for (const group of SATELLITE_MISSION_CATALOG) {
    for (const ch of group.choices) {
      if (ch.actionType === 'spectral') {
        if (
          ch.spectralIndexKey === activeLayer &&
          (ch.thematicMapId === activeThematicMap ||
            (activeThematicMap === 'vegetation' && ch.spectralIndexKey !== 'LST'))
        ) {
          return {
            isDefaultNatural: false,
            activeChoiceId: ch.id,
            satelliteShortAr: ch.satelliteAr,
            satelliteShortEn: ch.satelliteEn,
            dataShortAr: ch.dataNameAr,
            dataShortEn: ch.dataNameEn,
            resolutionBadge: ch.resolutionBadge,
          };
        }
      } else if (ch.thematicMapId === activeThematicMap) {
        return {
          isDefaultNatural: false,
          activeChoiceId: ch.id,
          satelliteShortAr: ch.satelliteAr,
          satelliteShortEn: ch.satelliteEn,
          dataShortAr: ch.dataNameAr,
          dataShortEn: ch.dataNameEn,
          resolutionBadge: ch.resolutionBadge,
        };
      }
    }
  }

  const fallbackMeta = THEMATIC_MAPS_META[activeThematicMap];
  return {
    isDefaultNatural: false,
    activeChoiceId: activeThematicMap,
    satelliteShortAr: 'قمر رصد فضائي',
    satelliteShortEn: 'Satellite GIS',
    dataShortAr: fallbackMeta?.shortAr || activeThematicMap,
    dataShortEn: fallbackMeta?.shortEn || activeThematicMap,
    resolutionBadge: 'GIS',
  };
}

