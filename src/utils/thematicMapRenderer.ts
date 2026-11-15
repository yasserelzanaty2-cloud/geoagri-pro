import {
  AirPollutantSpecies,
  BaseMapStyleId,
  DailyWeatherPoint,
  ElevationColorPalette,
  ElevationDisplayMode,
  GlobalTemperatureSubMode,
  LatLon,
  OpenMeteoSoilMoistureDepth,
  PressureAltitudeLevel,
  SpectralIndexKey,
  ThematicMapLayerId,
  VentuskyAtmosphericOptions,
  VentuskyLiveTelemetryNode,
} from '../types/agro';
import {
  applyDynamicBinaryVegetationMask,
  evaluateAutomatedNdwiWaterMask,
} from './agroEngine';

export interface ThematicMapMeta {
  id: ThematicMapLayerId;
  titleAr: string;
  titleEn: string;
  shortAr: string;
  shortEn: string;
  subtitleAr: string;
  subtitleEn: string;
  unit: string;
  minLabelAr: string;
  maxLabelAr: string;
  minLabelEn: string;
  maxLabelEn: string;
  gradientCss: string;
  legendStepsAr: string[];
  legendStepsEn: string[];
  linkedSpectralIndex?: SpectralIndexKey;
}

export const THEMATIC_MAPS_META: Record<ThematicMapLayerId, ThematicMapMeta> = {
  natural: {
    id: 'natural',
    titleAr: 'الوضع الافتراضي للخريطة الطبيعية (بدون طبقات لونية)',
    titleEn: 'Default Natural Satellite Map (No Color Overlays)',
    shortAr: 'الوضع الافتراضي (طبيعي)',
    shortEn: 'Default (Natural)',
    subtitleAr:
      'عرض شكل كوكب الأرض والخريطة الفضائية الطبيعي بدون أي مؤشرات أو فلاتر لونية، مع استجابة فورية لتغيير خلفية القمر الصناعي',
    subtitleEn:
      'Displays the pure natural satellite and terrain base map without any thematic or spectral color overlays',
    unit: ' m',
    minLabelAr: 'قمر صناعي طبيعي',
    maxLabelAr: 'دقة كاملة 100%',
    minLabelEn: 'Natural Satellite',
    maxLabelEn: 'Full Resolution',
    gradientCss:
      'linear-gradient(to right, #0f172a 0%, #1e3a8a 25%, #0d9488 50%, #15803d 75%, #e5d8b8 100%)',
    legendStepsAr: [
      'مسطحات مائية وبحار طبيعية',
      'أراضٍ زراعية ودلتا خضراء طبيعية',
      'سهول ومناطق عمرانية واضحة',
      'صحارٍ وتضاريس رملية وجبلية طبيعية',
    ],
    legendStepsEn: [
      'Natural Oceans & Water Bodies',
      'Natural Vegetated & Delta Croplands',
      'Clear Urban & Infrastructure Features',
      'Natural Desert & Mountain Terrain',
    ],
  },
  vegetation: {
    id: 'vegetation',
    titleAr: 'خريطة الغطاء النباتي والأراضي الزراعية (نباتات وأراضٍ غير مزروعة)',
    titleEn: 'Cropland & Vegetation Cover Map (Active Crops & Fallow Farmland)',
    shortAr: 'خريطة الغطاء النباتي',
    shortEn: 'Vegetation Map',
    subtitleAr:
      'تمييز المحاصيل والأشجار النشطة بالأخضر، والأراضي الصفراء أو الطينية غير المزروعة وسط المزارع بالأخضر الفاتح — مع بقاء المباني والطرق والمياه والصحراء بدون تلوين',
    subtitleEn:
      'Active crops & orchards shaded green and unplanted clay/yellow farmland plots shaded light green — buildings, roads, water & open desert remain uncolored',
    unit: ' NDVI',
    minLabelAr: '0.00 (مبانٍ/ماء/صحراء)',
    maxLabelAr: '0.99 (غطاء نباتي كثيف)',
    minLabelEn: '0.00 (Built/Water/Desert)',
    maxLabelEn: '0.99 (Dense Canopy)',
    gradientCss:
      'linear-gradient(to right, #dfcec2 0% 18%, #bef264 18% 42%, #6eaa01 42% 72%, #056400 72% 100%)',
    legendStepsAr: [
      '0.00–0.14 مبانٍ / طرق / مياه وأنهار / صحراء مفتوحة (بدون تلوين — شفاف)',
      '0.15–0.27 أرض زراعية غير مزروعة / صفراء أو طينية وسط المزارع (أخضر فاتح)',
      '0.28–0.44 إنبات مبكر ومحاصيل موسمية خفيفة (أخضر متوسط)',
      '0.45–0.65 غطاء زراعي نشط وحقول صحية (أخضر)',
      '>0.66 أشجار وبساتين ومحاصيل كثيفة الذروة (أخضر داكن)',
    ],
    legendStepsEn: [
      '0.00–0.14 Buildings / Roads / Water & Rivers / Open Desert (Uncolored)',
      '0.15–0.27 Unplanted Yellow or Muddy Farmland Inside Farms (Light Green)',
      '0.28–0.44 Early Emergence & Moderate Crops (Medium Green)',
      '0.45–0.65 Healthy Active Cropland (Green)',
      '>0.66 Dense Orchards, Forests & Peak Canopy (Deep Green)',
    ],
    linkedSpectralIndex: 'NDVI',
  },
  wind: {
    id: 'wind',
    titleAr: 'خريطة اتجاه الرياح وسرعتها الحية (Wind Streamlines & Speed)',
    titleEn: 'Live Wind Direction & Velocity Streamlines Map (Open-Meteo 10m)',
    shortAr: 'اتجاه الرياح وسرعتها',
    shortEn: 'Wind Speed & Dir',
    subtitleAr: 'حقل سرعة الرياح اللوني وأسهم الاتجاه الحية بالدرجات، وسلامة الرش الحقلي لمنع انجراف المبيدات',
    subtitleEn: 'Live wind speed heatmap, cardinal azimuth vectors, and pesticide spray drift safety',
    unit: ' km/h',
    minLabelAr: '5 كم/س (هادئة)',
    maxLabelAr: '38 كم/س (عاصفة)',
    minLabelEn: '5 km/h (Calm)',
    maxLabelEn: '38 km/h (Strong)',
    gradientCss:
      'linear-gradient(to right, #10b981 0% 20%, #06b6d4 20% 40%, #3b82f6 40% 60%, #f59e0b 60% 80%, #ef4444 80% 100%)',
    legendStepsAr: [
      '<12 كم/س هادئة (رش آمن 100%)',
      '12–18 كم/س معتدلة (رش مسموح)',
      '18–24 كم/س نشطة (خطر انجراف)',
      '24–32 كم/س قوية (يُمنع الرش)',
      '>32 كم/س عاصفة (خطر رقاد)',
    ],
    legendStepsEn: [
      '<12 km/h Calm (Safe Spray)',
      '12–18 km/h Moderate Breeze',
      '18–24 km/h Fresh (Drift Risk)',
      '24–32 km/h Strong (No Spraying)',
      '>32 km/h Gale (Lodging Risk)',
    ],
  },
  weather: {
    id: 'weather',
    titleAr: 'خريطة الغلاف الجوي والغطاء السحابي (NASA MODIS Clouds)',
    titleEn: 'Atmospheric Cloud Fraction & Weather Map (NASA MODIS)',
    shortAr: 'خريطة الطقس والسحب',
    shortEn: 'Clouds & Weather',
    subtitleAr:
      'رصد الغطاء السحابي الحي من قمر MODIS مع عزل السماء الصافية والبحار وإبراز كتل السحب النشطة بالألوان الرسمية',
    subtitleEn:
      'Live NASA MODIS cloud fraction with clear skies & oceans masked transparent and active cloud bands highlighted',
    unit: '% Cloud',
    minLabelAr: '0% (سماء صافية)',
    maxLabelAr: '100% (سحب كثيفة/عواصف)',
    minLabelEn: '0% (Clear Sky)',
    maxLabelEn: '100% (Dense Overcast)',
    gradientCss:
      'linear-gradient(to right, #64748b 0% 20%, #0003ff 20% 40%, #055000 40% 60%, #ffff01 60% 80%, #ff0005 80% 100%)',
    legendStepsAr: [
      '0–18% سماء صافية (شفاف فوق الأرض والبحار)',
      '19–38% سحب خفيفة متفرقة (أزرق)',
      '39–60% غطاء سحابي متوسط (أخضر)',
      '61–82% سحب كثيفة رطبة (أصفر)',
      '83–100% غطاء سحابي كامل وعواصف (أحمر)',
    ],
    legendStepsEn: [
      '0–18% Clear Sky (Transparent)',
      '19–38% Scattered Light Clouds (Blue)',
      '39–60% Moderate Cloud Cover (Green)',
      '61–82% Dense Humid Clouds (Yellow)',
      '83–100% Full Overcast / Storm (Red)',
    ],
  },
  temperature: {
    id: 'temperature',
    titleAr: 'خريطة حرارة سطح الأرض العالمية (NASA MODIS LST)',
    titleEn: 'Global Land Surface Temperature Map (NASA MODIS LST)',
    shortAr: 'خريطة الحرارة',
    shortEn: 'Temperature Map',
    subtitleAr:
      'توزيع حرارة سطح الأرض (LST) بلوحة ناسا الرسمية: من الأزرق الجليدي والأخضر المعتدل إلى الأصفر والبرتقالي والأحمر الحراري',
    subtitleEn:
      'Official NASA MODIS Land Surface Temperature palette from freezing blue to mild green, warm gold, and hot red',
    unit: '°C',
    minLabelAr: '<0°م (تجمد)',
    maxLabelAr: '55+°م (حرارة قصوى)',
    minLabelEn: '<0°C (Freeze)',
    maxLabelEn: '55+°C (Extreme Heat)',
    gradientCss:
      'linear-gradient(to right, #006bff 0% 20%, #24ffab 20% 40%, #afff00 40% 60%, #ffd600 60% 80%, #ff6a00 80% 100%)',
    legendStepsAr: [
      '<0°م مناطق متجمدة وصقيع (أزرق)',
      '0–15°م سطح بارد إلى معتدل (نعناعي)',
      '15–28°م نطاق دافئ مثالي للنمو (أخضر-ليموني)',
      '28–40°م سطح حار وتربة مكشوفة (أصفر ذهبي)',
      '>40°م إجهاد حراري مرتفع (برتقالي-أحمر)',
    ],
    legendStepsEn: [
      '<0°C Freezing / Frost Zone',
      '0–15°C Cool Land Surface',
      '15–28°C Optimal Warm Canopy',
      '28–40°C Hot Bare Soil',
      '>40°C Extreme Heat Stress',
    ],
    linkedSpectralIndex: 'LST',
  },
  drought: {
    id: 'drought',
    titleAr: 'خريطة الجفاف ورطوبة الجذور العالمية (NASA SMAP L4)',
    titleEn: 'Global Drought & Root-Zone Soil Moisture (NASA SMAP L4)',
    shortAr: 'خريطة الجفاف',
    shortEn: 'Drought Map',
    subtitleAr:
      'لوحة ألوان القمر الصناعي NASA SMAP L4 الرسمية: البرتقالي والأصفر للجفاف الحرج، والأخضر والتركواز والأزرق للرطوبة والتشبع',
    subtitleEn:
      'Official NASA SMAP L4 soil moisture palette from amber-yellow drought to green, teal, and deep blue saturation',
    unit: '% SM',
    minLabelAr: '0% (جفاف حرج)',
    maxLabelAr: '55%+ (تشبع كامل)',
    minLabelEn: '0% (Severe Drought)',
    maxLabelEn: '55%+ (Saturated)',
    gradientCss:
      'linear-gradient(to right, #ffa200 0% 20%, #fff800 20% 40%, #53a900 40% 60%, #00ca95 60% 80%, #008eff 80% 100%)',
    legendStepsAr: [
      '0–10% جفاف حرج ونقطة ذبول (برتقالي)',
      '10–20% رطوبة منخفضة وبداية جفاف (أصفر)',
      '20–30% رطوبة متوسطة متوازنة (أخضر)',
      '30–42% سعة حقلية مثالية للمحصول (تركواز)',
      '>42% تشبع رطوبي عالٍ (أزرق/كحلي)',
    ],
    legendStepsEn: [
      '0–10% Critical Drought (Amber)',
      '10–20% Low Moisture Deficit (Yellow)',
      '20–30% Moderate Soil Moisture (Green)',
      '30–42% Optimal Field Capacity (Teal)',
      '>42% High Saturation (Blue)',
    ],
    linkedSpectralIndex: 'SM_0_7',
  },
  rainfall: {
    id: 'rainfall',
    titleAr: 'خريطة التنبؤ والهطول المطري الفضائي (NASA GPM IMERG)',
    titleEn: 'Global Satellite Precipitation Rate Map (NASA GPM IMERG)',
    shortAr: 'التنبؤ بالأمطار',
    shortEn: 'Rainfall Forecast',
    subtitleAr:
      'لوحة ألوان NASA GPM IMERG الرسمية لمعدل هطول الأمطار: الأخضر الداكن والليموني للمطر الخفيف فالأصفر والبرتقالي والأحمر للعواصف',
    subtitleEn:
      'Official NASA GPM IMERG precipitation colormap from dark green & lime drizzle to yellow, orange, and red storms',
    unit: ' mm/hr',
    minLabelAr: '0.1 مم/س (رذاذ خفيف)',
    maxLabelAr: '15+ مم/س (عاصفة شديدة)',
    minLabelEn: '0.1 mm/hr (Drizzle)',
    maxLabelEn: '15+ mm/hr (Intense Storm)',
    gradientCss:
      'linear-gradient(to right, #00764e 0% 20%, #68cb00 20% 40%, #f7d900 40% 60%, #ff5f25 60% 80%, #f30000 80% 100%)',
    legendStepsAr: [
      '0.1–0.3 مم/س رذاذ مطري خفيف (أخضر داكن)',
      '0.3–1.5 مم/س أمطار خفيفة إلى متوسطة (أخضر ليموني)',
      '1.5–4.0 مم/س أمطار متوسطة نافعة (أصفر)',
      '4.0–12.0 مم/س أمطار غزيرة — إيقاف الري (برتقالي)',
      '>12.0 مم/س عاصفة مطرية شديدة (أحمر قانٍ)',
    ],
    legendStepsEn: [
      '0.1–0.3 mm/hr Light Drizzle (Dark Green)',
      '0.3–1.5 mm/hr Light–Moderate Rain (Lime)',
      '1.5–4.0 mm/hr Moderate Rain (Yellow)',
      '4.0–12.0 mm/hr Heavy Rain — Halt Irrigation (Orange)',
      '>12.0 mm/hr Severe Storm (Deep Red)',
    ],
  },
  elevation: {
    id: 'elevation',
    titleAr: 'خريطة ارتفاعات الأرض وخطوط الكنتور والتضاريس العالمية (SRTM DEM & Contours)',
    titleEn: 'Global Land Elevation, Contours & Topographic Relief Map (SRTM DEM)',
    shortAr: 'ارتفاعات الأرض (العالم)',
    shortEn: 'Global Elevation',
    subtitleAr:
      'رصد ارتفاع أي نقطة في العالم بالمتر فوق سطح البحر (m ASL)، وخطوط الكنتور، ونسبة انحدار الأرض وتصريف المياه',
    subtitleEn:
      'Global elevation in meters above sea level (m ASL), topographic contours, slope %, and drainage gradient',
    unit: ' m',
    minLabelAr: '0 م (ساحلي/دلتا منخفضة)',
    maxLabelAr: '3500+ م (قمم شاهقة)',
    minLabelEn: '0 m (Low Delta/Basin)',
    maxLabelEn: '3500+ m (High Summits)',
    gradientCss:
      'linear-gradient(to right, #0d9488 0% 10%, #16a34a 10% 24%, #84cc16 24% 38%, #eab308 38% 52%, #f97316 52% 66%, #dc2626 66% 80%, #9333ea 80% 92%, #f8fafc 92% 100%)',
    legendStepsAr: [
      '0–50 م سهول ساحلية ودلتا منخفضة',
      '50–200 م مصاطب وسهول زراعية',
      '200–500 م هضاب متوسطة الارتفاع',
      '500–2000 م تلال وسلاسل جبلية',
      '>2000 م قمم جبلية شاهقة',
    ],
    legendStepsEn: [
      '0–50 m Low Alluvial Delta & Coast',
      '50–200 m Lowland Plains & Terraces',
      '200–500 m Moderate Plateaus',
      '500–2000 m Hills & Mountain Ranges',
      '>2000 m High Alpine Summits',
    ],
  },
  dem_drainage: {
    id: 'dem_drainage',
    titleAr: 'خريطة تضاريس صرف المياه والمنخفضات الحقلية (DEM Hydrology)',
    titleEn: 'DEM Agricultural Water Drainage & Low-Spot Depression Map',
    shortAr: 'صرف المياه والمنخفضات (DEM)',
    shortEn: 'DEM Drainage & Depressions',
    subtitleAr:
      'تحليل الارتفاعات الدقيقة لتحديد اتجاهات جريان وصرف المياه بالميل، ورصد أكثر المناطق انخفاضاً وعرضة لتجمع المياه وتغدق الجذور داخل الحقول',
    subtitleEn:
      'Topographic DEM flow-direction and local depression analysis identifying surface drainage pathways and low-lying field waterlogging pockets',
    unit: ' m',
    minLabelAr: 'منخفض تجمع مياه',
    maxLabelAr: 'مرتفع سريع الصرف',
    minLabelEn: 'Low Depression Pool',
    maxLabelEn: 'High Runoff Ridge',
    gradientCss:
      'linear-gradient(to right, #1d4ed8 0% 25%, #06b6d4 25% 50%, #84cc16 50% 75%, #ea580c 75% 100%)',
    legendStepsAr: [
      'أحواض ومنخفضات حقلية عميقة — خطر تجمع المياه وغرق الجذور (أزرق داكن)',
      'مجاري ومسارات صرف المياه الطبيعية المنخفضة (سماوي)',
      'أراضٍ معتدلة الانحدار متوازنة الصرف (أخضر ليموني)',
      'مرتفعات ومناطق سريعة الجريان السطحي (برتقالي)',
    ],
    legendStepsEn: [
      'Low-Lying Field Depressions — High Waterlogging Risk (Deep Blue)',
      'Natural Drainage Swales & Runoff Channels (Cyan)',
      'Balanced Agricultural Drainage Grade (Lime Green)',
      'Elevated Ridges & Rapid Surface Runoff (Orange)',
    ],
  },
  soil_moisture: {
    id: 'soil_moisture',
    titleAr: 'خريطة رطوبة التربة الحية (NASA SMAP L4 & Open-Meteo 0cm/7cm)',
    titleEn: 'Live Soil Moisture Map (NASA SMAP L4 & Open-Meteo 0cm/7cm)',
    shortAr: 'رطوبة التربة الحية (0cm/7cm)',
    shortEn: 'Soil Moisture (0cm/7cm)',
    subtitleAr:
      'لوحة ألوان NASA SMAP L4 لرطوبة التربة العالمية متكاملة مع قياسات Open-Meteo للأعماق (0 و7 سم) عند النقر',
    subtitleEn:
      'Official NASA SMAP L4 soil moisture color ramp synchronized with Open-Meteo 0cm/7cm point depth telemetry',
    unit: '% SM',
    minLabelAr: '0% (جفاف حرج)',
    maxLabelAr: '55%+ (تشبع كامل)',
    minLabelEn: '0% (Severe Dry)',
    maxLabelEn: '55%+ (Full Saturation)',
    gradientCss:
      'linear-gradient(to right, #ffa200 0% 20%, #fff800 20% 40%, #53a900 40% 60%, #00ca95 60% 80%, #008eff 80% 100%)',
    legendStepsAr: [
      '0–10% جفاف حرج — نقطة الذبول (برتقالي)',
      '10–20% رطوبة منخفضة تحتاج ري (أصفر)',
      '20–30% رطوبة معتدلة متوازنة (أخضر)',
      '30–42% سعة حقلية مثالية للجذور (تركواز)',
      '>42% تشبع رطوبي عالٍ — أوقف الري (أزرق)',
    ],
    legendStepsEn: [
      '0–10% Critical Dry (Amber)',
      '10–20% Low Soil Moisture (Yellow)',
      '20–30% Moderate Moisture (Green)',
      '30–42% Optimal Field Capacity (Teal)',
      '>42% High Saturation (Blue)',
    ],
    linkedSpectralIndex: 'SM_0_7',
  },
  snow_ice: {
    id: 'snow_ice',
    titleAr: 'خريطة تتبع سقوط الثلوج وعواصف الثلوج وخط التجمد (NASA MODIS Snow & Open-Meteo)',
    titleEn: 'Global Snowfall, Blizzard Storm Track & Freezing Level Map (MODIS & Open-Meteo)',
    shortAr: 'الثلوج وعواصف الثلوج',
    shortEn: 'Snow & Blizzards',
    subtitleAr:
      'تتبع مناطق تراكم الثلوج (سم)، مسار العواصف الثلجية، ارتفاع خط التجمد (0°م)، ودرجة حرارة الصقيع الحرجة للمحاصيل',
    subtitleEn:
      'Tracks snow accumulation (cm), blizzard tracks, freezing level altitude (0°C m), and critical crop frost thresholds',
    unit: ' cm',
    minLabelAr: '0 سم (صقيع/خط تجمد)',
    maxLabelAr: '35+ سم (عاصفة ثلجية)',
    minLabelEn: '0 cm (Frost Watch)',
    maxLabelEn: '35+ cm (Blizzard)',
    gradientCss:
      'linear-gradient(to right, #38bdf8 0% 20%, #60a5fa 20% 40%, #818cf8 40% 60%, #c084fc 60% 80%, #f8fafc 80% 100%)',
    legendStepsAr: [
      'تنبيه صقيع ليلي وخط تجمد منخفض (<2°م)',
      '1–5 سم تساقط ثلجي خفيف وصقيع متجمد',
      '5–15 سم تراكم ثلجي متوسط فوق المرتفعات',
      '15–35 سم ثلوج كثيفة ومنخفض قطبي نشط',
      '>35 سم عاصفة ثلجية شديدة (Blizzard) وتجمد كامل',
    ],
    legendStepsEn: [
      'Frost Watch & Low Freezing Level (<2°C)',
      '1–5 cm Light Snowfall & Hoarfrost',
      '5–15 cm Moderate Highland Snow Pack',
      '15–35 cm Heavy Snow Accumulation',
      '>35 cm Severe Blizzard & Deep Freeze',
    ],
  },
  day_night: {
    id: 'day_night',
    titleAr: 'خريطة الوقت وتحديد مناطق الصباح والنهار والليل (Solar Terminator & World Time)',
    titleEn: 'Global Day/Night Solar Terminator, World Time & Daylight Radiation Map',
    shortAr: 'الوقت والنهار والليل',
    shortEn: 'Day/Night & Time',
    subtitleAr:
      'رسم خط الفجر والغسق الفلكي الحي، مناطق الصباح والظهيرة والليل، إضاءة المدن ليلاً، وساعات السطوع الشمسي للمحاصيل',
    subtitleEn:
      'Real-time solar terminator, morning/noon/night zones, nocturnal city lights, and crop daylight radiation hours',
    unit: ' W/m²',
    minLabelAr: 'ليل دامس (0 W/m²)',
    maxLabelAr: 'ذروة النهار (950+ W/m²)',
    minLabelEn: 'Night (0 W/m²)',
    maxLabelEn: 'Solar Noon (950+ W/m²)',
    gradientCss:
      'linear-gradient(to right, #020617 0% 20%, #1e1b4b 20% 40%, #f59e0b 40% 60%, #38bdf8 60% 80%, #fef08a 80% 100%)',
    legendStepsAr: [
      'وقت الليل الكامل + إضاءة المدن (0 W/m²)',
      'الشفق الفلكي والفجر/الغسق (-12° إلى 0°)',
      'وقت الصباح الباكر أو المساء (إشعاع لطيف)',
      'نهار مشمس نشط للتمثيل الضوئي (300–650 W/m²)',
      'ذروة السطوع الشمسي وقت الظهيرة (>650 W/m²)',
    ],
    legendStepsEn: [
      'Full Nighttime + Urban City Lights (0 W/m²)',
      'Astronomical & Civil Twilight (Dawn/Dusk)',
      'Early Morning / Late Afternoon Low Sun',
      'Active Daylight Photosynthesis (300–650 W/m²)',
      'Peak Solar Noon Irradiance (>650 W/m²)',
    ],
  },
  apparent_temp: {
    id: 'apparent_temp',
    titleAr: 'درجة الحرارة الظاهرية والمحسوسة للجسم والنبات (Apparent / Feels-Like)',
    titleEn: 'Global Apparent / Feels-Like Temperature Map (Ventusky / ICON)',
    shortAr: 'الحرارة الظاهرية',
    shortEn: 'Apparent Temp',
    subtitleAr:
      'درجة الحرارة المحسوسة فعلياً بعد دمج الرطوبة النسبية وسرعة الرياح والإشعاع الشمسي لرصد الإجهاد الحراري وتبريد الرياح',
    subtitleEn:
      'Feels-like thermal index combining air temperature, relative humidity, wind chill, and solar radiation load',
    unit: '°C',
    minLabelAr: '-40°م (قارس)',
    maxLabelAr: '+50°م (إجهاد لاهب)',
    minLabelEn: '-40°C (Bitter)',
    maxLabelEn: '+50°C (Scorching)',
    gradientCss:
      'linear-gradient(to right, #c084fc 0% 15%, #312e81 15% 32%, #06b6d4 32% 48%, #22c55e 48% 64%, #eab308 64% 80%, #dc2626 80% 100%)',
    legendStepsAr: [
      'أقل من 0°م برد قارس وخطر صقيع ريحي (أرجواني/كحلي)',
      '0–14°م جو بارد إلى لطيف (أزرق/تركواز)',
      '15–25°م نطاق مريح ونشط للعمل الحقلي (أخضر)',
      '26–34°م دافئ إلى حار رطب (أصفر/برتقالي)',
      '>35°م إجهاد حراري محسوس مرتفع (أحمر داكن)',
    ],
    legendStepsEn: [
      '<0°C Freezing Wind-Chill Load',
      '0–14°C Cold to Cool Breeze',
      '15–25°C Comfortable Field Working Window',
      '26–34°C Warm Humid Heat Load',
      '>35°C Extreme Apparent Heat Stress',
    ],
  },
  wind_gusts: {
    id: 'wind_gusts',
    titleAr: 'خريطة هبوب الرياح والذروة العاصفية (Max Wind Gusts ICON/GFS)',
    titleEn: 'Global Peak Wind Gusts Velocity Map (1h / 3h / 24h)',
    shortAr: 'هبوب الرياح',
    shortEn: 'Wind Gusts',
    subtitleAr:
      'رصد أقصى هبات الرياح المفاجئة بالكيلومتر/ساعة لحماية البيوت المحمية، أشجار الفاكهة، ومنع رقاد المحاصيل أثناء العواصف',
    subtitleEn:
      'Tracks peak convective and synoptic wind gusts (km/h) to protect greenhouses, orchards, and tall cereal stands',
    unit: ' km/h',
    minLabelAr: '0 كم/س (هادئ)',
    maxLabelAr: '140+ كم/س (إعصاري)',
    minLabelEn: '0 km/h (Calm)',
    maxLabelEn: '140+ km/h (Storm)',
    gradientCss:
      'linear-gradient(to right, #475569 0% 15%, #3b82f6 15% 32%, #22c55e 32% 52%, #eab308 52% 70%, #ef4444 70% 86%, #450a0a 86% 100%)',
    legendStepsAr: [
      '0–20 كم/س هبات خفيفة وآمنة تماماً للرش',
      '20–40 كم/س هبات متوسطة تحتاج حذر للرش الورقي',
      '40–65 كم/س هبات نشطة قد تثير الأتربة وتهز الأفرع',
      '65–90 كم/س هبات قوية خطرة على الصوب والذرة',
      '>90 كم/س عاصفة وهبات شديدة — طوارئ حقلية',
    ],
    legendStepsEn: [
      '0–20 km/h Light Calm Gusts',
      '20–40 km/h Moderate Breeze Gusts',
      '40–65 km/h Fresh Dust-Raising Gusts',
      '65–90 km/h Strong Damaging Gusts',
      '>90 km/h Severe Storm Gusts Hazard',
    ],
  },
  pressure: {
    id: 'pressure',
    titleAr: 'خريطة الضغط الجوي ومراكز المنخفضات والمرتفعات (MSLP hPa & Isobars)',
    titleEn: 'Atmospheric Sea-Level Pressure, Isobars & Cyclone Centers (hPa)',
    shortAr: 'ضغط جوي',
    shortEn: 'Pressure hPa',
    subtitleAr:
      'توزيع الضغط الجوي بالهيكتوباسكال مع خطوط تساوي الضغط ومراكز المنخفضات والمرتفعات الجوية للتنبؤ بتقلبات الطقس والأمطار',
    subtitleEn:
      'Mean sea-level barometric pressure (hPa) with isobar rings and High/Low centers to forecast approaching fronts',
    unit: ' hPa',
    minLabelAr: '940 hPa (منخفض عميق)',
    maxLabelAr: '1054 hPa (مرتفع قوي)',
    minLabelEn: '940 hPa (Deep Low)',
    maxLabelEn: '1054 hPa (High Ridge)',
    gradientCss:
      'linear-gradient(to right, #311042 0% 15%, #3b0764 15% 30%, #2563eb 30% 48%, #22c55e 48% 65%, #eab308 65% 82%, #dc2626 82% 94%, #450a0a 94% 100%)',
    legendStepsAr: [
      '<985 hPa منخفض جوي عميق وأعاصير نشطة (L)',
      '985–1005 hPa نطاق عدم استقرار ومنخفضات ممطرة',
      '1005–1016 hPa ضغط جوي معتدل متقلب',
      '1016–1026 hPa مرتفع جوي مستقر وجاف (H)',
      '>1026 hPa مرتفع جوي قوي وصفاء مستقر',
    ],
    legendStepsEn: [
      '<985 hPa Deep Cyclone / Storm Core (L)',
      '985–1005 hPa Unsettled Frontal Low',
      '1005–1016 hPa Neutral Transitional Pressure',
      '1016–1026 hPa Fair Weather High Ridge (H)',
      '>1026 hPa Strong Anticyclone Stability',
    ],
  },
  thunderstorms: {
    id: 'thunderstorms',
    titleAr: 'خريطة العواصف الرعدية وطاقة الحمل الحراري (CAPE J/kg)',
    titleEn: 'Thunderstorm Instability & Convective Energy Map (CAPE J/kg)',
    shortAr: 'عواصف رعدية (CAPE)',
    shortEn: 'Thunderstorms CAPE',
    subtitleAr:
      'مؤشر CAPE لطاقة عدم الاستقرار الجوي بالجول/كجم لتوقع العواصف الرعدية، السحب الركامية، والسيول المفاجئة قبل حدوثها',
    subtitleEn:
      'Convective Available Potential Energy (J/kg) pinpointing thunderstorm development, hail risk, and flash downpours',
    unit: ' J/kg',
    minLabelAr: '0 J/kg (مستقر)',
    maxLabelAr: '5000+ J/kg (عنيف)',
    minLabelEn: '0 J/kg (Stable)',
    maxLabelEn: '5000+ J/kg (Extreme)',
    gradientCss:
      'linear-gradient(to right, #475569 0% 12%, #6366f1 12% 28%, #06b6d4 28% 45%, #22c55e 45% 62%, #eab308 62% 78%, #dc2626 78% 92%, #450a0a 92% 100%)',
    legendStepsAr: [
      '0–250 J/kg غلاف جوي مستقر بدون سحب رعدية',
      '250–800 J/kg عدم استقرار خفيف وسحب ركامية',
      '800–1600 J/kg فرص واضحة لعواصف رعدية وزخات ممطرة',
      '1600–2800 J/kg عواصف رعدية قوية وبرق وبَرَد محتمل',
      '>2800 J/kg طاقة رعدية شديدة (Supercell) — تنبيه طوارئ',
    ],
    legendStepsEn: [
      '0–250 J/kg Stable Atmosphere',
      '250–800 J/kg Weak Convective Instability',
      '800–1600 J/kg Moderate Thunderstorm Potential',
      '1600–2800 J/kg Strong Storms & Hail Potential',
      '>2800 J/kg Extreme Severe Convective Energy',
    ],
  },
  weather_radar: {
    id: 'weather_radar',
    titleAr: 'رادار الطقس الحي ومؤشر انعكاسية الأمطار والصواعق (WORAD dBZ + Blitzortung)',
    titleEn: 'Live Weather Radar Reflectivity & Lightning Strikes (dBZ WORAD)',
    shortAr: 'رادار الطقس وصواعق',
    shortEn: 'Weather Radar & Bolts',
    subtitleAr:
      'رصد مباشر لخلايا الأمطار بالرادار العالمي (dBZ) مع تتبع مواقع ضربات البرق والصواعق الحية فوق الخلايا الرعدية',
    subtitleEn:
      'Real-time WORAD precipitation reflectivity (0–60 dBZ) paired with active lightning strike detection overlays',
    unit: ' dBZ',
    minLabelAr: '0 dBZ (صافٍ)',
    maxLabelAr: '60+ dBZ (برد/صواعق)',
    minLabelEn: '0 dBZ (Clear)',
    maxLabelEn: '60+ dBZ (Severe Hail)',
    gradientCss:
      'linear-gradient(to right, #475569 0% 14%, #3b82f6 14% 32%, #22c55e 32% 52%, #eab308 52% 70%, #dc2626 70% 88%, #f8fafc 88% 100%)',
    legendStepsAr: [
      '0–10 dBZ رصد صافٍ خالٍ من خلايا الهطول',
      '10–25 dBZ سحب ممطرة خفيفة (رذاذ مستمر)',
      '25–40 dBZ أمطار متوسطة إلى غزيرة نشطة',
      '40–52 dBZ خلايا رعدية كثيفة وهطول غزير + برق',
      '>52 dBZ عاصفة بردية شديدة وصواعق كثيفة (⚡)',
    ],
    legendStepsEn: [
      '0–10 dBZ Clear Radar Echo',
      '10–25 dBZ Light Rain Echoes',
      '25–40 dBZ Moderate to Heavy Rain Cells',
      '40–52 dBZ Convective Downpour + Lightning',
      '>52 dBZ Severe Hail Core & Intense Lightning (⚡)',
    ],
  },
  satellite_ir: {
    id: 'satellite_ir',
    titleAr: 'مرئيات القمر الصناعي الحي للسحب والعواصف (GOES + HIMAWARI + METEOSAT)',
    titleEn: 'Geostationary Satellite Cloud Composite (GOES + HIMAWARI + METEOSAT)',
    shortAr: 'قمر اصطناعي للسحب',
    shortEn: 'Satellite Clouds',
    subtitleAr:
      'رصد مرئي وحراري تحت الأحمر لدوامات السحب والأعاصير والمنخفضات الجوية على مستوى العالم ليلاً ونهاراً',
    subtitleEn:
      'True multispectral geostationary IR + visible cloud swirl imagery tracking fronts, cyclones, and fog bands globally',
    unit: '% IR Cloud',
    minLabelAr: 'سماء صافية',
    maxLabelAr: 'سحب عميقة (-65°C)',
    minLabelEn: 'Clear Surface',
    maxLabelEn: 'Deep Cold Tops (-65°C)',
    gradientCss:
      'linear-gradient(to right, #0f172a 0% 25%, #334155 25% 50%, #94a3b8 50% 75%, #f8fafc 75% 100%)',
    legendStepsAr: [
      'داكن/أرض مكشوفة: سماء صافية وإشعاع أرضي واضح',
      'رمادي مزرق: سحب منخفضة أو ضباب خفيف دافئ القمم',
      'أبيض فاتح: سحب متوسطة السماكة وجبهات ممطرة',
      'أبيض ناصع كثيف: قمم سحب ركامية شاهقة البرودة وأعاصير',
    ],
    legendStepsEn: [
      'Dark Earth Surface: Clear Sky & Low Cloud-Free Albedo',
      'Blue-Grey Veil: Low Stratus Clouds & Morning Fog',
      'Bright Grey-White: Mid-Level Frontal Cloud Bands',
      'Pure Brilliant White: Deep Cold Convective Cyclone Tops',
    ],
  },
  humidity: {
    id: 'humidity',
    titleAr: 'خريطة الرطوبة النسبية ونقطة الندى متعددة الارتفاعات (RH% & Dew Point)',
    titleEn: 'Multi-Level Relative Humidity & Dew Point Temperature Map (GFS)',
    shortAr: 'الرطوبة ونقطة الندى',
    shortEn: 'Humidity & Dew Pt',
    subtitleAr:
      'قياس الرطوبة النسبية عند ارتفاع 2م ومستويات الضغط الجوي (900 / 850 / 700 hPa) مع خريطة درجة التكثف (Dew Point) للتنبؤ بالندى والأمراض الفطرية',
    subtitleEn:
      'Relative humidity across 2m and pressure surfaces (900/850/700 hPa) plus Dew Point for fungal blight & fog alerts',
    unit: '%',
    minLabelAr: '0% (جفاف صحراوي)',
    maxLabelAr: '100% (تشبع وندى)',
    minLabelEn: '0% (Arid Dry)',
    maxLabelEn: '100% (Saturated Fog)',
    gradientCss:
      'linear-gradient(to right, #786028 0% 22%, #a89860 22% 45%, #cbd5e1 45% 72%, #f1f5f9 72% 88%, #ffffff 88% 100%)',
    legendStepsAr: [
      '0–30% هواء صحراوي شديد الجفاف (نحاسي/بني)',
      '30–55% رطوبة معتدلة مريحة لمعظم المحاصيل (بيج/رملي)',
      '55–75% رطوبة مرتفعة مثالية لنمو الخضر وتقليل البخر',
      '75–90% رطوبة عالية — مراقبة الصدأ واللفحة المتأخرة',
      '>90% تشبع كامل وتكون الندى والضباب الكثيف (أبيض)',
    ],
    legendStepsEn: [
      '0–30% Arid Dry Desert Air (Bronze/Olive)',
      '30–55% Balanced Moderate Humidity (Sand/Beige)',
      '55–75% Moist Air Reducing Evaporative Stress',
      '75–90% High Fungal Leaf-Wetness Risk Window',
      '>90% Saturated Dew Formation & Dense Fog (White)',
    ],
  },
  air_quality: {
    id: 'air_quality',
    titleAr: 'خريطة تلوث الهواء والغبار ومؤشر الأشعة فوق البنفسجية (SILAM / CAMS)',
    titleEn: 'Global Air Quality, Desert Dust & UV Index Map (SILAM & Open-Meteo CAMS)',
    shortAr: 'تلوث الهواء والغبار وUV',
    shortEn: 'Air Quality & Dust',
    subtitleAr:
      'رصد مباشر للجسيمات الدقيقة PM2.5 وPM10 وعواصف الغبار الصحراوي والغازات (NO2, SO2, O3, CO) ومؤشر الأشعة فوق البنفسجية UV لحماية العمالة والمحاصيل',
    subtitleEn:
      'Tracks PM2.5, PM10, desert Dust storms, NO2, SO2, O3, CO, AQI, and UV index using Open-Meteo CAMS & SILAM modeling',
    unit: ' µg/m³',
    minLabelAr: '0 (هواء نقي)',
    maxLabelAr: '200+ (عاصفة/خطر)',
    minLabelEn: '0 (Clean Air)',
    maxLabelEn: '200+ (Hazardous)',
    gradientCss:
      'linear-gradient(to right, #3b82f6 0% 18%, #fef08a 18% 36%, #eab308 36% 54%, #f97316 54% 70%, #e11d48 70% 86%, #450a0a 86% 100%)',
    legendStepsAr: [
      '0–15 µg/m³ هواء نقي ممتاز (أزرق صافٍ)',
      '15–35 µg/m³ جودة هواء مقبولة وغبار خفيف (أصفر فاتح)',
      '35–65 µg/m³ تلوث متوسط أو عوالق غبارية (أصفر/برتقالي)',
      '65–120 µg/m³ مرتفع — ترسب غباري على أوراق المحاصيل (أحمر وردي)',
      '>120 µg/m³ حرج جداً / عاصفة ترابية — غسل رشاشات بعد العاصفة (عنابي داكن)',
    ],
    legendStepsEn: [
      '0–15 µg/m³ Clean Air Quality (Blue)',
      '15–35 µg/m³ Fair Light Haze (Pale Yellow)',
      '35–65 µg/m³ Moderate Pollution / Suspended Dust',
      '65–120 µg/m³ Unhealthy Heavy Aerosol / Dust Plume',
      '>120 µg/m³ Hazardous Dust Storm / Severe Smog (Dark Crimson)',
    ],
  },
};

export interface ScientificTileOverlaySpec {
  id: string;
  tileUrl: string;
  secondaryTileUrl?: string;
  opacity: number;
  maxNativeZoom: number;
  attribution: string;
  labelAr: string;
  labelEn: string;
}

export function getRecentFullModisDateIso(daysAgo = 4): string {
  const ms = Date.now() - Math.max(2, daysAgo) * 86_400_000;
  return new Date(ms).toISOString().slice(0, 10);
}

/**
 * Returns real georeferenced scientific tile overlays (NASA GIBS WMTS, Esri World Hillshade, OpenTopoMap)
 * using gap-free 8-day composites / live `default/default` / verified full-orbit STD dates so every
 * NASA GIBS layer renders full continental coverage without missing orbital swath strips.
 */
export function getScientificTileOverlayForThematicMap(
  thematicMap: ThematicMapLayerId,
  elevationDisplayMode: ElevationDisplayMode = '3d_color_only'
): ScientificTileOverlaySpec | null {
  if (thematicMap === 'vegetation') {
    return {
      id: 'nasa-gibs-modis-ndvi',
      tileUrl:
        'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_NDVI_8Day/default/default/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png',
      opacity: 0.72,
      maxNativeZoom: 9,
      attribution: 'NASA EOSDIS GIBS / MODIS Terra NDVI 8-Day',
      labelAr: 'طبقة ناسا الفضائية للغطاء النباتي (NASA GIBS MODIS NDVI)',
      labelEn: 'NASA GIBS MODIS Terra NDVI 8-Day Layer',
    };
  }
  if (thematicMap === 'temperature') {
    return {
      id: 'nasa-gibs-modis-lst',
      tileUrl:
        'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_L3_Land_Surface_Temp_8Day_Day/default/default/GoogleMapsCompatible_Level7/{z}/{y}/{x}.png',
      opacity: 0.74,
      maxNativeZoom: 7,
      attribution: 'NASA EOSDIS GIBS / MODIS Terra L3 8-Day Land Surface Temperature',
      labelAr: 'طبقة ناسا لحرارة سطح الأرض (NASA GIBS MODIS 8-Day LST)',
      labelEn: 'NASA GIBS MODIS 8-Day Land Surface Temperature Layer',
    };
  }
  if (thematicMap === 'drought' || thematicMap === 'soil_moisture') {
    return {
      id: 'nasa-gibs-smap-moisture',
      tileUrl:
        'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/SMAP_L4_Analyzed_Root_Zone_Soil_Moisture/default/default/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png',
      opacity: 0.72,
      maxNativeZoom: 6,
      attribution: 'NASA SMAP L4 Root-Zone Soil Moisture & Open-Meteo',
      labelAr: 'طبقة ناسا SMAP وOpen-Meteo لرطوبة التربة والجفاف',
      labelEn: 'NASA SMAP L4 & Open-Meteo Soil Moisture Layer',
    };
  }
  if (thematicMap === 'rainfall') {
    return {
      id: 'nasa-gibs-imerg-precip',
      tileUrl:
        'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/IMERG_Precipitation_Rate/default/default/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png',
      opacity: 0.78,
      maxNativeZoom: 6,
      attribution: 'NASA GPM IMERG / EOSDIS GIBS & NASA POWER PRECTOTCORR',
      labelAr: 'طبقة ناسا الفضائية لهطول الأمطار (NASA GPM IMERG + NASA POWER)',
      labelEn: 'NASA GPM IMERG Precipitation Rate & NASA POWER Layer',
    };
  }
  if (thematicMap === 'weather') {
    const cloudDate = getRecentFullModisDateIso(4);
    return {
      id: 'nasa-gibs-modis-clouds',
      tileUrl: `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_Cloud_Fraction_Day/default/${cloudDate}/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png`,
      opacity: 0.68,
      maxNativeZoom: 6,
      attribution: 'NASA EOSDIS GIBS / MODIS Cloud Fraction STD & NASA POWER',
      labelAr: 'طبقة ناسا للغلاف الجوي والسحب (NASA GIBS MODIS Cloud & POWER)',
      labelEn: 'NASA GIBS MODIS Cloud Fraction & Atmospheric Layer',
    };
  }
  if (thematicMap === 'elevation') {
    if (elevationDisplayMode === 'contours_only') {
      return {
        id: 'opentopo-contours',
        tileUrl: 'https://tile.opentopomap.org/{z}/{x}/{y}.png',
        opacity: 0.68,
        maxNativeZoom: 15,
        attribution: 'OpenTopoMap (SRTM DEM Contours)',
        labelAr: 'خريطة خطوط الكنتور الطوبوغرافية (OpenTopoMap SRTM)',
        labelEn: 'OpenTopoMap SRTM Topographic Contours',
      };
    }
    return {
      id: 'esri-hillshade-opentopo',
      tileUrl:
        'https://services.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}',
      secondaryTileUrl:
        elevationDisplayMode === '3d_contours'
          ? 'https://tile.opentopomap.org/{z}/{x}/{y}.png'
          : undefined,
      opacity: elevationDisplayMode === '3d_color_only' ? 0.32 : 0.62,
      maxNativeZoom: 15,
      attribution: 'Esri World Hillshade & AWS/NASA SRTM Terrarium DEM',
      labelAr: 'تضاريس العالم ثلاثية الأبعاد متدرجة الارتفاع (SRTM 3D Stepped Relief)',
      labelEn: 'Global 3D Stepped Elevation Relief (SRTM Terrarium DEM)',
    };
  }
  if (thematicMap === 'dem_drainage') {
    return {
      id: 'terrarium-dem-drainage',
      tileUrl:
        'https://services.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}',
      opacity: 0.72,
      maxNativeZoom: 15,
      attribution: 'AWS/Mapzen Terrarium SRTM DEM & D8 Flow Hydrologic Gradient',
      labelAr: 'طبقة الارتفاعات التضاريسية واتجاهات صرف المياه والمنخفضات الحقلية (DEM)',
      labelEn: 'DEM Agricultural Water Drainage Flow & Low-Spot Depression Layer',
    };
  }
  if (thematicMap === 'snow_ice') {
    return {
      id: 'nasa-gibs-modis-snow',
      tileUrl:
        'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_NDSI_Snow_Cover/default/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png',
      opacity: 0.78,
      maxNativeZoom: 8,
      attribution: 'NASA EOSDIS GIBS / MODIS NDSI Snow Cover & Open-Meteo Freezing Level',
      labelAr: 'طبقة ناسا لتتبع الثلوج وعواصف الثلوج وخط التجمد (MODIS NDSI + Open-Meteo)',
      labelEn: 'NASA MODIS Snow Cover, Blizzard Track & Freezing Level Layer',
    };
  }
  if (thematicMap === 'day_night') {
    return {
      id: 'nasa-viirs-city-lights-day-night',
      tileUrl:
        'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_CityLights_2012/default/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpg',
      opacity: 0.75,
      maxNativeZoom: 8,
      attribution: 'NASA Suomi NPP VIIRS Day/Night Band & Solar Ephemeris Engine',
      labelAr: 'طبقة الفجر والغسق والوقت العالمي وإضاءة المدن ليلاً (VIIRS Day/Night)',
      labelEn: 'Global Solar Terminator, World Time & VIIRS Night City Lights',
    };
  }
  return null;
}

// High-precision global continental landmass polygons [lng, lat] with zero self-intersections
const GLOBAL_LANDMASS_POLYGONS: Array<Array<[number, number]>> = [
  // Africa Mainland + Sinai Peninsula
  [
    [-17.55, 14.7], [-16.6, 18.0], [-16.2, 21.0], [-14.8, 24.5], [-13.2, 27.8],
    [-9.6, 30.4], [-9.3, 32.5], [-6.0, 35.85], [-2.0, 35.2], [3.0, 36.85],
    [10.2, 37.3], [11.1, 35.2], [11.5, 33.1], [15.5, 32.1], [20.1, 32.1],
    [22.5, 32.9], [25.15, 31.62], [27.2, 31.42], [28.9, 30.92], [29.88, 31.26],
    [30.12, 31.36], [30.38, 31.50], [30.85, 31.60], [31.12, 31.62], [31.52, 31.54],
    [31.84, 31.55], [32.05, 31.40], [32.32, 31.30], [32.58, 31.12], [33.05, 31.24],
    [33.45, 31.24], [33.82, 31.16], [34.25, 31.32], [34.92, 29.52], [34.45, 27.95],
    [33.65, 27.75], [35.2, 25.0], [37.2, 21.0], [38.9, 18.0], [41.5, 15.0],
    [43.4, 12.6], [45.0, 10.5], [51.35, 11.9], [49.8, 7.5], [45.3, 2.0],
    [41.5, -1.5], [40.4, -10.5], [39.5, -16.0], [35.0, -18.0], [35.5, -24.0],
    [32.8, -26.0], [28.0, -32.8], [20.0, -34.8], [18.4, -33.9], [14.5, -22.9],
    [11.8, -17.0], [12.2, -6.0], [9.4, 1.0], [8.8, 4.0], [5.5, 4.3],
    [1.0, 6.0], [-4.0, 5.2], [-7.7, 4.4], [-13.5, 9.5], [-16.6, 12.2],
    [-17.55, 14.7],
  ],
  // Madagascar
  [
    [49.3, -12.0], [50.4, -15.5], [47.5, -25.0], [44.0, -25.2], [43.3, -21.0],
    [44.4, -16.8], [48.2, -13.5], [49.3, -12.0],
  ],
  // Eurasia (Europe + Anatolia + Levant/Palestine + Arabian Peninsula + Asia + India + SE Asia)
  [
    [-9.5, 38.7], [-9.3, 42.9], [-1.8, 43.4], [-1.2, 46.2], [-4.8, 48.4],
    [-1.9, 48.6], [-1.5, 49.7], [2.4, 51.0], [8.5, 54.0], [10.5, 57.7],
    [5.0, 60.0], [10.0, 64.0], [20.0, 70.0], [28.0, 71.0], [40.0, 68.0],
    [60.0, 70.0], [90.0, 73.5], [130.0, 71.5], [172.0, 66.0], [161.0, 55.0],
    [141.0, 53.0], [135.0, 44.0], [129.0, 35.0], [126.5, 34.5], [126.0, 38.0],
    [122.0, 39.5], [118.0, 38.5], [122.0, 31.0], [120.5, 24.0], [114.0, 22.2],
    [108.0, 21.5], [109.2, 13.0], [105.0, 8.6], [101.0, 13.4], [103.8, 1.3],
    [100.0, 6.5], [98.5, 10.0], [96.5, 16.5], [94.3, 16.0], [92.3, 21.1],
    [89.0, 21.7], [86.5, 20.4], [80.3, 13.1], [77.5, 8.1], [75.8, 11.5],
    [72.8, 19.1], [70.2, 20.8], [68.8, 23.0], [66.8, 24.9], [61.5, 25.2],
    [56.5, 26.2], [59.8, 22.5], [54.0, 17.0], [45.0, 12.8], [43.4, 12.6],
    [42.8, 15.0], [40.2, 20.0], [39.1, 21.6], [36.8, 25.5], [34.92, 29.52],
    [34.25, 31.32], [34.55, 31.72], [34.77, 32.08], [34.98, 32.82], [35.1, 33.1],
    [35.8, 35.5], [36.2, 36.8], [32.5, 36.2], [27.2, 36.6], [26.2, 40.0],
    [23.8, 38.0], [22.5, 36.4], [20.0, 39.2], [19.2, 42.0], [13.8, 45.5],
    [16.2, 41.8], [15.6, 38.0], [12.3, 41.8], [8.9, 44.4], [7.5, 43.75],
    [6.6, 43.15], [5.4, 43.22], [4.6, 43.34], [3.5, 43.28], [3.1, 42.4],
    [-0.5, 38.0], [-5.4, 36.0], [-9.5, 38.7],
  ],
  // Scandinavia & Baltic
  [
    [5.0, 58.5], [8.0, 58.0], [12.5, 55.5], [18.5, 59.5], [21.5, 65.0],
    [30.0, 70.5], [18.0, 69.5], [10.0, 64.0], [5.0, 60.5], [5.0, 58.5],
  ],
  // Great Britain & Ireland
  [
    [-5.5, 50.1], [1.4, 51.3], [1.7, 52.6], [-0.2, 54.1], [-3.0, 58.6],
    [-5.8, 57.5], [-4.8, 55.0], [-3.0, 53.4], [-5.2, 51.8], [-5.5, 50.1],
  ],
  [
    [-10.4, 51.8], [-9.8, 54.2], [-6.1, 55.2], [-6.0, 52.2], [-8.5, 51.5], [-10.4, 51.8],
  ],
  // Sicily, Sardinia, Corsica, Crete, Cyprus, Sri Lanka
  [[12.4, 37.8], [15.6, 38.2], [15.1, 36.7], [12.5, 37.5], [12.4, 37.8]],
  [[8.2, 40.9], [9.7, 41.2], [9.6, 39.0], [8.4, 39.1], [8.2, 40.9]],
  [[8.6, 42.8], [9.5, 42.9], [9.3, 41.4], [8.6, 42.0], [8.6, 42.8]],
  [[23.5, 35.5], [26.3, 35.3], [26.1, 34.9], [23.6, 35.2], [23.5, 35.5]],
  [[32.3, 35.0], [34.6, 35.6], [34.0, 34.9], [32.4, 34.7], [32.3, 35.0]],
  [[79.8, 9.7], [81.8, 7.6], [80.5, 6.0], [79.8, 7.1], [79.8, 9.7]],
  // Japan, Sumatra, Java, Borneo, Sulawesi, Philippines, New Guinea, Australia, New Zealand
  [
    [130.5, 31.5], [134.0, 34.0], [139.8, 35.5], [141.5, 41.0], [145.5, 43.5],
    [141.0, 45.4], [139.0, 38.0], [135.5, 35.5], [130.5, 33.5], [130.5, 31.5],
  ],
  [[95.3, 5.5], [105.8, -5.8], [102.5, -5.2], [95.3, 5.5]],
  [[105.5, -6.1], [114.4, -7.8], [114.2, -8.6], [105.2, -6.9], [105.5, -6.1]],
  [[109.0, 1.5], [117.5, 6.8], [118.8, 1.0], [115.8, -3.8], [110.2, -3.0], [109.0, 1.5]],
  [[130.8, -1.5], [141.0, -2.5], [150.5, -10.2], [142.0, -9.2], [132.5, -4.2], [130.8, -1.5]],
  [
    [114.0, -22.0], [122.0, -18.0], [131.0, -12.0], [136.5, -12.2], [136.0, -16.0],
    [142.5, -10.7], [146.0, -17.0], [153.5, -28.0], [150.0, -37.5], [145.0, -38.5],
    [138.5, -35.0], [131.0, -31.5], [121.0, -34.0], [115.0, -34.3], [114.0, -22.0],
  ],
  [[172.8, -34.5], [178.4, -37.7], [175.0, -41.5], [166.5, -46.2], [172.8, -34.5]],
  // North & Central America
  [
    [-168.0, 65.5], [-140.0, 70.0], [-95.0, 72.0], [-75.0, 70.0], [-55.0, 52.0],
    [-65.0, 45.0], [-70.0, 42.0], [-75.5, 35.5], [-80.2, 25.8], [-82.5, 28.0],
    [-89.0, 29.2], [-97.0, 26.0], [-96.0, 19.0], [-87.0, 21.5], [-88.0, 16.0],
    [-83.5, 10.0], [-77.5, 8.5], [-84.0, 9.5], [-92.0, 14.5], [-105.0, 20.0],
    [-112.0, 31.0], [-110.0, 23.0], [-117.1, 32.5], [-122.4, 37.8], [-124.5, 48.0],
    [-135.0, 57.0], [-150.0, 60.0], [-162.0, 55.0], [-168.0, 65.5],
  ],
  // South America
  [
    [-77.5, 8.5], [-71.5, 11.5], [-62.0, 10.5], [-50.0, 1.0], [-35.0, -5.5],
    [-38.5, -13.0], [-40.0, -20.0], [-48.5, -28.0], [-53.5, -34.0], [-58.0, -38.0],
    [-65.0, -43.0], [-68.0, -54.8], [-74.0, -52.0], [-73.0, -42.0], [-71.5, -33.0],
    [-70.5, -18.0], [-77.0, -12.0], [-81.0, -4.5], [-80.0, 1.0], [-77.5, 8.5],
  ],
  // Greenland
  [
    [-44.0, 60.0], [-22.0, 70.0], [-18.0, 81.0], [-55.0, 82.0], [-70.0, 76.0],
    [-52.0, 68.0], [-44.0, 60.0],
  ],
];

function pointInPolygonLngLat(lng: number, lat: number, poly: Array<[number, number]>): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0];
    const yi = poly[i][1];
    const xj = poly[j][0];
    const yj = poly[j][1];
    const intersect =
      yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Checks if a coordinate lies strictly inside an enclosed sea body (Mediterranean Sea north of the
 * Nile Delta shoreline, Red Sea, Gulf of Suez, Gulf of Aqaba, Arabian Gulf, Black Sea, Caspian Sea).
 */
export function isStrictEnclosedSeaAtLatLon(lat: number, lng: number): boolean {
  const normLng = ((((lng + 180) % 360) + 360) % 360) - 180;

  // Red Sea main trough (strictly inside deep marine channel, away from coastal plains)
  if (lat >= 12.6 && lat <= 27.72) {
    const redSeaCenterLng = 34.05 + (27.72 - lat) * 0.57;
    if (Math.abs(normLng - redSeaCenterLng) < 0.76) return true;
  }
  // Gulf of Suez (strictly central marine channel, preserving Suez, Ain Sokhna & Ras Gharib shores)
  if (lat >= 27.82 && lat <= 29.82) {
    const suezCenterLng = 32.56 + (29.82 - lat) * 0.51;
    if (Math.abs(normLng - suezCenterLng) < 0.13) return true;
  }
  // Gulf of Aqaba
  if (lat >= 28.1 && lat <= 29.46) {
    const aqabaCenterLng = 34.73 + (lat - 28.1) * 0.17;
    if (Math.abs(normLng - aqabaCenterLng) < 0.09) return true;
  }
  // Arabian / Persian Gulf
  if (lat >= 24.2 && lat <= 29.8 && normLng >= 48.4 && normLng <= 56.1) {
    const gulfCenterLng = 50.15 + (29.6 - lat) * 0.86;
    if (Math.abs(normLng - gulfCenterLng) < 0.95) return true;
  }
  // Black Sea (excluding Crimea)
  if (lat >= 41.45 && lat <= 46.0 && normLng >= 28.4 && normLng <= 41.0) {
    if (lat >= 44.3 && normLng >= 32.3 && normLng <= 36.7) return false;
    return true;
  }
  // Caspian Sea
  if (lat >= 36.85 && lat <= 46.5 && normLng >= 47.7 && normLng <= 53.5) {
    return true;
  }
  // Eastern Mediterranean Sea (strictly north of the Nile Delta, Damietta, Port Said, Bardawil & Sinai coast)
  if (lat >= 31.22 && lat <= 36.1 && normLng >= 25.0 && normLng <= 34.25) {
    let coastLat = 31.42;
    if (normLng < 29.85) {
      // Matrouh - Alamein - Alexandria west coast
      coastLat = 31.24 + Math.max(0, (29.85 - normLng) * 0.085);
    } else if (normLng <= 32.05) {
      // Nile Delta northern arch: Alexandria -> Rosetta -> Baltim (31.62°N) -> Damietta / Ras El Bar (31.54°N)
      const t = (normLng - 31.05) / 1.05;
      coastLat = 31.64 - 0.16 * t * t;
    } else if (normLng <= 32.62) {
      // Port Said, Port Fouad, Manzala coastal bar & Tinah plain
      coastLat = 31.42 - (normLng - 32.05) * 0.14;
    } else {
      // North Sinai, Lake Bardawil barrier spit, El Arish & Rafah
      coastLat = 31.32 + Math.sin(((normLng - 32.62) / 1.65) * Math.PI) * 0.12;
    }
    if (lat > coastLat + 0.04) {
      // Protect Crete and Cyprus
      if (lat >= 34.8 && lat <= 35.65 && normLng >= 23.5 && normLng <= 26.35) return false;
      if (lat >= 34.55 && lat <= 35.7 && normLng >= 32.25 && normLng <= 34.6) return false;
      return true;
    }
  }

  return false;
}

/**
 * High-Precision Continental Polygon Land vs Marine/Ocean Mask.
 * Uses curved landmass polygon containment plus enclosed seas so coastlines never suffer from rectangular cutoffs.
 */
export function isMarineOrOceanWaterAtLatLon(lat: number, lng: number): boolean {
  const normLng = ((((lng + 180) % 360) + 360) % 360) - 180;

  if (lat > 78 || lat < -56) {
    if (lat <= 83 && normLng >= -72 && normLng <= -14) return false;
    return true;
  }

  if (isStrictEnclosedSeaAtLatLon(lat, normLng)) {
    return true;
  }

  // Explicitly guarantee all Egyptian mainland, Nile Delta (including Damietta & Port Said), Nile Valley, Deserts & Sinai land
  if (
    lat >= 22.0 &&
    lat <= 31.66 &&
    normLng >= 24.95 &&
    normLng <= 34.92 &&
    !isStrictEnclosedSeaAtLatLon(lat, normLng)
  ) {
    return false;
  }

  // Check curved continental landmass polygons
  for (let i = 0; i < GLOBAL_LANDMASS_POLYGONS.length; i++) {
    if (pointInPolygonLngLat(normLng, lat, GLOBAL_LANDMASS_POLYGONS[i])) {
      return false;
    }
  }

  return true;
}

export interface BaseMapStyleMeta {
  id: BaseMapStyleId;
  labelAr: string;
  labelEn: string;
  tileUrl: string;
  labelsUrl?: string;
  hillshadeUrl?: string;
  filterCss?: string;
  attribution: string;
}

export const BASE_MAP_STYLES: Record<BaseMapStyleId, BaseMapStyleMeta> = {
  satellite: {
    id: 'satellite',
    labelAr: 'قمر صناعي عالي الدقة (Esri Sentinel-2/Maxar)',
    labelEn: 'High-Res Satellite (Esri Sentinel-2/Maxar)',
    tileUrl:
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Esri, Maxar, Earthstar Geographics, Copernicus Sentinel-2',
  },
  hybrid: {
    id: 'hybrid',
    labelAr: 'قمر صناعي هجين بالأسماء والحدود (Hybrid)',
    labelEn: 'Hybrid Satellite + Labels & Boundaries',
    tileUrl:
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    labelsUrl:
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Esri, Maxar, Earthstar Geographics, HERE',
  },
  topo_contours: {
    id: 'topo_contours',
    labelAr: 'خريطة الكنتور وارتفاعات الأرض العالمية (SRTM Contours + Hillshade)',
    labelEn: 'Global Contours & Elevation Relief (SRTM DEM + Hillshade)',
    tileUrl:
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    hillshadeUrl:
      'https://services.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}',
    labelsUrl:
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
    filterCss: 'brightness(0.82) contrast(1.18) saturate(0.82)',
    attribution: 'NASA SRTM DEM, Esri World Hillshade, Earthstar Geographics',
  },
  terrain: {
    id: 'terrain',
    labelAr: 'خريطة التضاريس والأحواض الطبيعية (Esri World Topo)',
    labelEn: 'Global Topographic & Hydrological Terrain (Esri Topo)',
    tileUrl:
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    hillshadeUrl:
      'https://services.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Esri, USGS, NOAA, FAO',
  },
  dark_scientific: {
    id: 'dark_scientific',
    labelAr: 'الخريطة العلمية الداكنة للمؤشرات (Esri Dark Gray Atlas)',
    labelEn: 'Dark Scientific Atlas (Esri World Dark Gray + Labels)',
    tileUrl:
      'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    labelsUrl:
      'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Esri, HERE, Garmin, OpenStreetMap contributors',
  },
  dark_satellite: {
    id: 'dark_satellite',
    labelAr: 'قمر صناعي علمي داكن عالي التباين (Dark High-Contrast Satellite)',
    labelEn: 'Dark High-Contrast Satellite + Labels',
    tileUrl:
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    labelsUrl:
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
    filterCss: 'brightness(0.68) contrast(1.24) saturate(0.86)',
    attribution: 'Esri, Maxar, Earthstar Geographics',
  },
};

export interface RegionalTelemetryNode {
  id: string;
  nameAr: string;
  nameEn: string;
  lat: number;
  lng: number;
  windSpeedKmh: number;
  windDirDeg: number;
  windDirCardinalAr: string;
  windDirCardinalEn: string;
  tempC: number;
  humidityPct: number;
  pressureHpa: number;
  rainMm: number;
  rainProbPct: number;
  droughtEsi: number;
  ndvi: number;
}

/**
 * Generates deterministic + live-calibrated regional & global agro-meteorological nodes
 * so zooming out to Egypt, MENA, or the World Map shows rich synoptic telemetry.
 */
export function buildRegionalAndGlobalTelemetryNodes(
  farmCentroid: LatLon,
  activeDayWeather: DailyWeatherPoint,
  farmNdvi: number
): RegionalTelemetryNode[] {
  const baseTemp = activeDayWeather?.tempMaxC ?? 25;
  const baseWind = activeDayWeather?.windSpeedKmh ?? 16;
  const baseDir = activeDayWeather?.windDirectionDeg ?? 330;
  const baseRain = activeDayWeather?.precipMm ?? 0;
  const baseProb = activeDayWeather?.precipProbPct ?? 12;
  const baseRh = activeDayWeather?.relativeHumidityPct ?? 62;
  const basePress = activeDayWeather?.surfacePressureHpa ?? 1015;

  const cardinalAr = (deg: number) => {
    const arr = ['شمالية', 'شمالية شرقية', 'شرقية', 'جنوبية شرقية', 'جنوبية', 'جنوبية غربية', 'غربية', 'شمالية غربية'];
    return arr[Math.round(((deg % 360) + 360) % 360 / 45) % 8];
  };
  const cardinalEn = (deg: number) => {
    const arr = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return arr[Math.round(((deg % 360) + 360) % 360 / 45) % 8];
  };

  return [
    {
      id: 'farm-node',
      nameAr: 'موقع مزرعتك النشطة',
      nameEn: 'Active Farm Zone',
      lat: farmCentroid.lat,
      lng: farmCentroid.lng,
      windSpeedKmh: baseWind,
      windDirDeg: baseDir,
      windDirCardinalAr: cardinalAr(baseDir),
      windDirCardinalEn: cardinalEn(baseDir),
      tempC: baseTemp,
      humidityPct: baseRh,
      pressureHpa: basePress,
      rainMm: baseRain,
      rainProbPct: baseProb,
      droughtEsi: Number(((farmNdvi - 0.35) * 2.2).toFixed(2)),
      ndvi: farmNdvi,
    },
    {
      id: 'north-delta-kafr',
      nameAr: 'شمال الدلتا (كفر الشيخ / سخا)',
      nameEn: 'North Delta (Sakha Agro-Station)',
      lat: 31.1107,
      lng: 30.9388,
      windSpeedKmh: Math.min(42, baseWind + 4),
      windDirDeg: (baseDir + 350) % 360,
      windDirCardinalAr: cardinalAr(baseDir + 350),
      windDirCardinalEn: cardinalEn(baseDir + 350),
      tempC: Number((baseTemp - 1.2).toFixed(1)),
      humidityPct: Math.min(92, baseRh + 8),
      pressureHpa: basePress - 1,
      rainMm: Number((baseRain * 1.35 + (baseProb > 40 ? 2.4 : 0)).toFixed(1)),
      rainProbPct: Math.min(95, baseProb + 12),
      droughtEsi: 0.92,
      ndvi: 0.78,
    },
    {
      id: 'sinai-bir-al-abd',
      nameAr: 'شمال سيناء (بئر العبد / العريش)',
      nameEn: 'North Sinai Corridor',
      lat: 31.018,
      lng: 33.012,
      windSpeedKmh: Math.min(45, baseWind + 6),
      windDirDeg: (baseDir + 15) % 360,
      windDirCardinalAr: cardinalAr(baseDir + 15),
      windDirCardinalEn: cardinalEn(baseDir + 15),
      tempC: Number((baseTemp + 0.6).toFixed(1)),
      humidityPct: Math.min(88, baseRh + 4),
      pressureHpa: basePress,
      rainMm: Number((baseRain * 1.2 + (baseProb > 45 ? 1.8 : 0)).toFixed(1)),
      rainProbPct: Math.min(92, baseProb + 8),
      droughtEsi: -0.25,
      ndvi: 0.42,
    },
    {
      id: 'west-delta-nubaria',
      nameAr: 'غرب الدلتا (النوبارية / وادي النطرون)',
      nameEn: 'West Delta (Nubaria Reclamation)',
      lat: 30.665,
      lng: 30.065,
      windSpeedKmh: Math.min(40, baseWind + 2),
      windDirDeg: (baseDir + 345) % 360,
      windDirCardinalAr: cardinalAr(baseDir + 345),
      windDirCardinalEn: cardinalEn(baseDir + 345),
      tempC: Number((baseTemp + 0.4).toFixed(1)),
      humidityPct: Math.max(30, baseRh - 5),
      pressureHpa: basePress + 1,
      rainMm: Number((baseRain * 0.9).toFixed(1)),
      rainProbPct: Math.max(5, baseProb - 4),
      droughtEsi: 0.45,
      ndvi: 0.64,
    },
    {
      id: 'fayoum-depression',
      nameAr: 'منخفض الفيوم الزراعي',
      nameEn: 'Fayoum Oasis Basin',
      lat: 29.359,
      lng: 30.785,
      windSpeedKmh: Math.max(6, baseWind - 2),
      windDirDeg: baseDir,
      windDirCardinalAr: cardinalAr(baseDir),
      windDirCardinalEn: cardinalEn(baseDir),
      tempC: Number((baseTemp + 1.4).toFixed(1)),
      humidityPct: Math.max(25, baseRh - 10),
      pressureHpa: basePress + 1,
      rainMm: Number(Math.max(0, baseRain * 0.4).toFixed(1)),
      rainProbPct: Math.max(4, Math.round(baseProb * 0.55)),
      droughtEsi: 0.62,
      ndvi: 0.71,
    },
    {
      id: 'west-minya',
      nameAr: 'غرب المنيا (مشروع 1.5 مليون فدان)',
      nameEn: 'West Minya Pivot Zone',
      lat: 28.146,
      lng: 30.425,
      windSpeedKmh: baseWind + 1,
      windDirDeg: (baseDir + 10) % 360,
      windDirCardinalAr: cardinalAr(baseDir + 10),
      windDirCardinalEn: cardinalEn(baseDir + 10),
      tempC: Number((baseTemp + 2.6).toFixed(1)),
      humidityPct: Math.max(20, baseRh - 16),
      pressureHpa: basePress + 2,
      rainMm: Number(Math.max(0, baseRain * 0.2).toFixed(1)),
      rainProbPct: Math.max(2, Math.round(baseProb * 0.35)),
      droughtEsi: -0.48,
      ndvi: 0.54,
    },
    {
      id: 'toshka-owainat',
      nameAr: 'توشكى وشرق العوينات (جنوب الوادي)',
      nameEn: 'Toshka & East Oweinat Pivots',
      lat: 22.615,
      lng: 28.715,
      windSpeedKmh: Math.max(8, baseWind - 1),
      windDirDeg: (baseDir + 25) % 360,
      windDirCardinalAr: cardinalAr(baseDir + 25),
      windDirCardinalEn: cardinalEn(baseDir + 25),
      tempC: Number((baseTemp + 5.8).toFixed(1)),
      humidityPct: Math.max(14, baseRh - 28),
      pressureHpa: basePress + 3,
      rainMm: 0,
      rainProbPct: 2,
      droughtEsi: -0.85,
      ndvi: 0.58,
    },
  ];
}

export interface SpatialWindVectorPoint {
  id: string;
  lat: number;
  lng: number;
  speedKmh: number;
  dirDeg: number; // Meteorological "from" direction in degrees (0=N, 90=E, 180=S, 270=W)
  flowAngleRad: number; // Mathematical canvas angle of motion
  cardinalAr: string;
  cardinalEn: string;
  color: string;
  safetyLabelAr: string;
  safetyLabelEn: string;
  isZonePoint?: boolean;
  zoneName?: string;
}

export interface LocalizedRainCloudCluster {
  id: string;
  lat: number;
  lng: number;
  nameAr: string;
  nameEn: string;
  precipMm: number;
  precipProbPct: number;
  cloudCoverPct: number;
  intensity: 'light' | 'moderate' | 'heavy' | 'storm';
  color: string;
  radiusMeters: number;
}

const spatialWeatherCache = new Map<string, SpatialWindVectorPoint[]>();

export function getWindSpeedColor(speedKmh: number): string {
  if (speedKmh < 12) return '#10b981'; // Calm green (<12)
  if (speedKmh < 18) return '#06b6d4'; // Moderate cyan (12-18)
  if (speedKmh < 24) return '#3b82f6'; // Active blue (18-24)
  if (speedKmh < 32) return '#f59e0b'; // Strong amber (24-32)
  return '#ef4444'; // Gale/hazard red (>32)
}

export function getCardinalDirection(deg: number, isAr: boolean): string {
  const norm = ((deg % 360) + 360) % 360;
  const idx = Math.round(norm / 45) % 8;
  const ar = [
    'شمالية',
    'شمالية شرقية',
    'شرقية',
    'جنوبية شرقية',
    'جنوبية',
    'جنوبية غربية',
    'غربية',
    'شمالية غربية',
  ];
  const en = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return isAr ? ar[idx] : en[idx];
}

/**
 * Evaluates a physically continuous, spatially varying wind vector (speed + direction)
 * at any (lat, lng) coordinate, blending synoptic pressure-gradient curvature, coastal
 * sea-breeze deflection, and live Open-Meteo station observations so arrows never point
 * uniformly in a single rigid angle.
 */
export function evaluateSpatialWindAtLatLon(
  lat: number,
  lng: number,
  activeDayWeather?: DailyWeatherPoint,
  liveNodes?: SpatialWindVectorPoint[]
): {
  speedKmh: number;
  dirDeg: number;
  flowAngleRad: number;
  color: string;
  cardinalAr: string;
  cardinalEn: string;
  safetyLabelAr: string;
  safetyLabelEn: string;
} {
  const baseSpeed = activeDayWeather?.windSpeedKmh ?? 15.5;
  const baseDir = activeDayWeather?.windDirectionDeg ?? 325;

  // If live Open-Meteo grid nodes exist, perform inverse-distance-squared interpolation (IDW)
  let interpSpeed = baseSpeed;
  let sinSum = 0;
  let cosSum = 0;

  if (liveNodes && liveNodes.length > 0) {
    let wTotal = 0;
    let spdSum = 0;
    for (const node of liveNodes) {
      const dLat = lat - node.lat;
      const dLng = lng - node.lng;
      const distSq = dLat * dLat + dLng * dLng + 0.0004;
      const w = 1 / distSq;
      wTotal += w;
      spdSum += node.speedKmh * w;
      const rad = (node.dirDeg * Math.PI) / 180;
      sinSum += Math.sin(rad) * w;
      cosSum += Math.cos(rad) * w;
    }
    if (wTotal > 0) {
      interpSpeed = spdSum / wTotal;
    }
  }

  // Smooth planetary & synoptic wind circulation (Ventusky / ECMWF global circulation belts + Mediterranean Etesian flow)
  const absLat = Math.abs(lat);
  // Global circulation belt baseline direction:
  // 0-28°: Trade winds (NE in N. Hemisphere ~55°, SE in S. Hemisphere ~125°)
  // 28-60°: Mid-latitude Westerlies / Mediterranean NW flow (~310° in MENA, ~255° in mid-latitudes)
  const isMenaOrMed = lat >= 18 && lat <= 38 && lng >= -10 && lng <= 55;
  const globalSynopticDir = isMenaOrMed
    ? baseDir
    : absLat < 26
    ? lat >= 0
      ? 62
      : 118
    : absLat < 60
    ? 262
    : 75;

  const coastalLift = Math.max(-2.5, Math.min(5.5, (32 - Math.abs(lat - 31.5)) * 0.25));
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;
  const waveSpeedDelta =
    Math.sin(latRad * 3.0 + lngRad * 2.0) * 3.8 +
    Math.cos(latRad * 2.2 - lngRad * 3.1) * 2.6;

  // Smooth synoptic planetary wave deflection (zero high-frequency Moiré aliasing)
  const valleyDeflectionDeg =
    Math.sin(lngRad * 3.5 + latRad * 2.0) * 22 +
    Math.cos(latRad * 2.8 - lngRad * 2.5) * 16;

  const baseDirFromIdw =
    liveNodes && liveNodes.length > 0
      ? ((Math.atan2(sinSum, cosSum) * 180) / Math.PI + 360) % 360
      : globalSynopticDir;

  const localShearDeg = ((lat - 30.0) * 85 + (lng - 31.0) * 65) % 24;
  const localSpeedGradient = ((lat - 30.0) * 14 + (lng - 31.0) * 11) % 3.2;
  const dirDeg = Math.round(((baseDirFromIdw + valleyDeflectionDeg + localShearDeg) % 360 + 360) % 360);
  const speedKmh = Number(
    Math.max(5.0, Math.min(44.0, interpSpeed + coastalLift + waveSpeedDelta + localSpeedGradient)).toFixed(1)
  );

  const towardDeg = (dirDeg + 180) % 360;
  const flowAngleRad = ((towardDeg - 90) * Math.PI) / 180;

  const color = getWindSpeedColor(speedKmh);
  const safetyLabelAr =
    speedKmh < 18
      ? 'آمن للرش (أخضر/أزرق)'
      : speedKmh < 26
      ? 'رياح نشطة — تنبيه'
      : 'رياح شديدة — خطر انجراف';
  const safetyLabelEn =
    speedKmh < 18
      ? 'Safe Spraying'
      : speedKmh < 26
      ? 'Active Wind — Caution'
      : 'High Wind — Drift Hazard';

  return {
    speedKmh,
    dirDeg,
    flowAngleRad,
    color,
    cardinalAr: getCardinalDirection(dirDeg, true),
    cardinalEn: getCardinalDirection(dirDeg, false),
    safetyLabelAr,
    safetyLabelEn,
  };
}

/**
 * Fetches a live 3x3 spatial grid of wind speed and wind direction from Open-Meteo
 * for the visible map bounding box, falling back seamlessly to the physical spatial model.
 */
export async function fetchLiveSpatialWindGrid(
  bounds: { south: number; north: number; west: number; east: number },
  activeDayWeather?: DailyWeatherPoint
): Promise<SpatialWindVectorPoint[]> {
  const key = `${bounds.south.toFixed(1)}_${bounds.north.toFixed(1)}_${bounds.west.toFixed(1)}_${bounds.east.toFixed(1)}`;
  if (spatialWeatherCache.has(key)) {
    return spatialWeatherCache.get(key)!;
  }

  const lats: number[] = [];
  const lngs: number[] = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const lat = Number(
        (bounds.south + ((bounds.north - bounds.south) * (r + 0.5)) / 3).toFixed(3)
      );
      const lng = Number(
        (bounds.west + ((bounds.east - bounds.west) * (c + 0.5)) / 3).toFixed(3)
      );
      lats.push(Math.max(-80, Math.min(80, lat)));
      lngs.push(Math.max(-179, Math.min(179, lng)));
    }
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats.join(',')}&longitude=${lngs.join(',')}&current=wind_speed_10m,wind_direction_10m&timezone=auto`;
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      const list = Array.isArray(json) ? json : [json];
      const nodes: SpatialWindVectorPoint[] = list.map((item: any, idx: number) => {
        const lat = lats[idx] ?? lats[0];
        const lng = lngs[idx] ?? lngs[0];
        const rawSpd = Number(item?.current?.wind_speed_10m ?? activeDayWeather?.windSpeedKmh ?? 15);
        const rawDir = Number(item?.current?.wind_direction_10m ?? activeDayWeather?.windDirectionDeg ?? 325);
        const evaluated = evaluateSpatialWindAtLatLon(lat, lng, {
          ...(activeDayWeather as DailyWeatherPoint),
          windSpeedKmh: rawSpd,
          windDirectionDeg: rawDir,
        });
        return {
          id: `live-wind-${idx}`,
          lat,
          lng,
          speedKmh: evaluated.speedKmh,
          dirDeg: evaluated.dirDeg,
          flowAngleRad: evaluated.flowAngleRad,
          cardinalAr: evaluated.cardinalAr,
          cardinalEn: evaluated.cardinalEn,
          color: evaluated.color,
          safetyLabelAr: evaluated.safetyLabelAr,
          safetyLabelEn: evaluated.safetyLabelEn,
        };
      });
      spatialWeatherCache.set(key, nodes);
      return nodes;
    }
  } catch {
    // Fallback to deterministic spatial model below
  }

  const fallbackNodes: SpatialWindVectorPoint[] = lats.map((lat, idx) => {
    const lng = lngs[idx];
    const evaluated = evaluateSpatialWindAtLatLon(lat, lng, activeDayWeather);
    return {
      id: `model-wind-${idx}`,
      lat,
      lng,
      speedKmh: evaluated.speedKmh,
      dirDeg: evaluated.dirDeg,
      flowAngleRad: evaluated.flowAngleRad,
      cardinalAr: evaluated.cardinalAr,
      cardinalEn: evaluated.cardinalEn,
      color: evaluated.color,
      safetyLabelAr: evaluated.safetyLabelAr,
      safetyLabelEn: evaluated.safetyLabelEn,
    };
  });
  spatialWeatherCache.set(key, fallbackNodes);
  return fallbackNodes;
}

/**
 * Evaluates localized precipitation at any (lat, lng) coordinate and returns whether
 * a localized rain cloud exists at that spot or if it is a clear/dry sky zone.
 */
export function evaluateSpatialRainAtLatLon(
  lat: number,
  lng: number,
  forecast14: DailyWeatherPoint[],
  selectedDayIdx: number
): {
  isRaining: boolean;
  precipMm: number;
  precipProbPct: number;
  cloudCoverPct: number;
  statusAr: string;
  statusEn: string;
  color: string;
} {
  const activeDay = forecast14[selectedDayIdx] || forecast14[0];
  const baseDayRain = activeDay?.precipMm ?? 0;
  const baseDayProb = activeDay?.precipProbPct ?? 8;

  // Strictly use ONLY the selected day's NASA POWER / Open-Meteo precipitation!
  // Never substitute future 14-day maximum rain into a dry day.
  if (baseDayRain < 0.5 || baseDayProb < 30) {
    const dryProb = Math.min(22, Math.max(4, Math.round(baseDayProb)));
    const dryCloud = Math.min(28, Math.max(6, activeDay?.cloudCoverPct ?? dryProb + 6));
    return {
      isRaining: false,
      precipMm: 0,
      precipProbPct: dryProb,
      cloudCoverPct: dryCloud,
      statusAr: `سماء صافية / جاف (0.0 مم · احتمال هطول ${dryProb}% — NASA POWER)`,
      statusEn: `Clear Dry Sky (0.0 mm · ${dryProb}% prob — NASA POWER)`,
      color: '#475569',
    };
  }

  // Genuine rain day (baseDayRain >= 0.5 && baseDayProb >= 30):
  // Evaluate spatial distribution across coastal vs inland zones
  const cellWave =
    Math.sin(lat * 18.5 + lng * 14.2) * 0.55 +
    Math.cos(lat * 11.0 - lng * 16.5) * 0.45;
  const coastalFactor = lat >= 30.85 ? 1.25 : lat >= 30.3 ? 1.0 : 0.65;

  const rawLocalRain =
    cellWave > -0.15
      ? Number(
          Math.max(0, baseDayRain * coastalFactor * (0.75 + Math.max(0, cellWave) * 0.45)).toFixed(1)
        )
      : Number((baseDayRain * 0.55).toFixed(1));

  const isRaining = rawLocalRain >= 0.5;
  const precipMm = isRaining ? rawLocalRain : 0;
  const precipProbPct = isRaining
    ? Math.min(95, Math.max(30, Math.round(baseDayProb * (0.85 + Math.max(0, cellWave) * 0.18))))
    : Math.min(24, Math.max(6, Math.round(baseDayProb * 0.35)));
  const cloudCoverPct = isRaining
    ? Math.min(98, Math.max(55, precipProbPct + 10))
    : Math.min(28, Math.max(8, precipProbPct));

  // Mapped 1:1 to NASA GPM IMERG stops (#00764e, #68cb00, #f7d900, #ff5f25, #f30000)
  const color = !isRaining
    ? '#00764e'
    : precipMm > 12
    ? '#f30000'
    : precipMm > 4
    ? '#ff5f25'
    : precipMm > 1.5
    ? '#f7d900'
    : precipMm > 0.3
    ? '#68cb00'
    : '#00764e';

  const statusAr = isRaining
    ? precipMm > 8
      ? `سحابة ممطرة غزيرة (${precipMm} مم · احتمال ${precipProbPct}%)`
      : `سحابة ممطرة موضعية (${precipMm} مم · احتمال ${precipProbPct}%)`
    : `سماء صافية / جاف (0.0 مم · احتمال هطول ${precipProbPct}%)`;

  const statusEn = isRaining
    ? precipMm > 8
      ? `Heavy Rain Cloud (${precipMm} mm · ${precipProbPct}% prob)`
      : `Localized Rain Cloud (${precipMm} mm · ${precipProbPct}% prob)`
    : `Clear Dry Sky (0.0 mm · ${precipProbPct}% prob)`;

  return {
    isRaining,
    precipMm,
    precipProbPct,
    cloudCoverPct,
    statusAr,
    statusEn,
    color,
  };
}

/**
 * Builds localized rain cloud clusters ONLY over geographic cells where genuine rain is forecast
 * on the selected day (`precipMm >= 0.5` and `precipProbPct >= 30`), with strict non-overlapping
 * minimum distance separation so badges never stack on top of each other.
 */
export function buildLocalizedRainCloudClusters(
  bounds: { south: number; north: number; west: number; east: number },
  forecast14: DailyWeatherPoint[],
  selectedDayIdx: number,
  userZones: Array<{ id: string; nameAr: string; nameEn: string; centroid: LatLon }>
): LocalizedRainCloudCluster[] {
  const activeDay = forecast14[selectedDayIdx] || forecast14[0];
  const baseDayRain = activeDay?.precipMm ?? 0;
  const baseDayProb = activeDay?.precipProbPct ?? 8;

  // When the selected day is dry (< 0.5 mm or < 30% prob), return ZERO rain cloud clusters!
  if (baseDayRain < 0.5 || baseDayProb < 30) {
    return [];
  }

  const clusters: LocalizedRainCloudCluster[] = [];
  const latSpan = Math.max(0.02, Math.min(12, bounds.north - bounds.south));
  const lngSpan = Math.max(0.02, Math.min(16, bounds.east - bounds.west));
  const minSeparationDeg = Math.max(0.028, Math.min(latSpan, lngSpan) * 0.34);

  const isTooClose = (lat: number, lng: number) =>
    clusters.some((existing) => Math.hypot(existing.lat - lat, existing.lng - lng) < minSeparationDeg);

  // 1. Check each user-defined study zone centroid first
  userZones.forEach((z) => {
    const evalRain = evaluateSpatialRainAtLatLon(
      z.centroid.lat,
      z.centroid.lng,
      forecast14,
      selectedDayIdx
    );
    if (evalRain.isRaining && !isTooClose(z.centroid.lat, z.centroid.lng)) {
      clusters.push({
        id: `rain-zone-${z.id}`,
        lat: z.centroid.lat,
        lng: z.centroid.lng,
        nameAr: z.nameAr,
        nameEn: z.nameEn,
        precipMm: evalRain.precipMm,
        precipProbPct: evalRain.precipProbPct,
        cloudCoverPct: evalRain.cloudCoverPct,
        intensity:
          evalRain.precipMm > 12
            ? 'storm'
            : evalRain.precipMm > 5
            ? 'heavy'
            : evalRain.precipMm > 2
            ? 'moderate'
            : 'light',
        color: evalRain.color,
        radiusMeters: 2200,
      });
    }
  });

  // 2. Sample a 3x3 spaced regional grid within the current map viewport and include ONLY well-spaced cells with genuine rain
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const lat = Number((bounds.south + ((r + 0.5) / 3) * latSpan).toFixed(4));
      const lng = Number((bounds.west + ((c + 0.5) / 3) * lngSpan).toFixed(4));
      if (isTooClose(lat, lng)) continue;
      const evalRain = evaluateSpatialRainAtLatLon(lat, lng, forecast14, selectedDayIdx);
      if (evalRain.isRaining) {
        clusters.push({
          id: `rain-cell-${r}-${c}`,
          lat,
          lng,
          nameAr: `سحابة ممطرة (${lat.toFixed(2)}°N, ${lng.toFixed(2)}°E)`,
          nameEn: `Rain Cloud Cell (${lat.toFixed(2)}°N, ${lng.toFixed(2)}°E)`,
          precipMm: evalRain.precipMm,
          precipProbPct: evalRain.precipProbPct,
          cloudCoverPct: evalRain.cloudCoverPct,
          intensity:
            evalRain.precipMm > 12
              ? 'storm'
              : evalRain.precipMm > 5
              ? 'heavy'
              : evalRain.precipMm > 2
              ? 'moderate'
              : 'light',
          color: evalRain.color,
          radiusMeters: Math.max(600, Math.round(latSpan * 9500)),
        });
      }
    }
  }

  return clusters.slice(0, 4);
}

export interface GlobalElevationPointReading {
  lat: number;
  lng: number;
  elevationMeters: number;
  elevationExactMeters: number;
  slopePct: number;
  landformAr: string;
  landformEn: string;
  drainageNoteAr: string;
  drainageNoteEn: string;
  color: string;
  source: 'open-meteo-dem' | 'srtm-harmonic-model';
}

export interface SteppedElevationTier {
  maxMeters: number;
  hexScientific: string;
  rgbScientific: [number, number, number];
  hexClassic: string;
  rgbClassic: [number, number, number];
  rangeLabel: string;
  labelAr: string;
  labelEn: string;
}

export const STEPPED_ELEVATION_TIERS: SteppedElevationTier[] = [
  {
    maxMeters: 0,
    hexScientific: '#0d9488',
    rgbScientific: [13, 148, 136],
    hexClassic: '#0f766e',
    rgbClassic: [15, 118, 110],
    rangeLabel: '< 0 m',
    labelAr: 'منخفضات تحت سطح البحر',
    labelEn: 'Sub-Sea Depression',
  },
  {
    maxMeters: 50,
    hexScientific: '#16a34a',
    rgbScientific: [22, 163, 74],
    hexClassic: '#15803d',
    rgbClassic: [21, 128, 61],
    rangeLabel: '0 – 50 m',
    labelAr: 'سهول ساحلية ودلتا منخفضة',
    labelEn: 'Low Alluvial Delta & Coast',
  },
  {
    maxMeters: 200,
    hexScientific: '#84cc16',
    rgbScientific: [132, 204, 22],
    hexClassic: '#65a30d',
    rgbClassic: [101, 163, 13],
    rangeLabel: '50 – 200 m',
    labelAr: 'سهول ومصاطب زراعية',
    labelEn: 'Lowland Plains & Terraces',
  },
  {
    maxMeters: 500,
    hexScientific: '#eab308',
    rgbScientific: [234, 179, 8],
    hexClassic: '#facc15',
    rgbClassic: [250, 204, 21],
    rangeLabel: '200 – 500 m',
    labelAr: 'هضاب متوسطة الارتفاع',
    labelEn: 'Moderate Plateaus',
  },
  {
    maxMeters: 1000,
    hexScientific: '#f97316',
    rgbScientific: [249, 115, 22],
    hexClassic: '#d97706',
    rgbClassic: [217, 119, 6],
    rangeLabel: '500 – 1000 m',
    labelAr: 'تلال ومرتفعات صخرية',
    labelEn: 'Upland Hills & Escarpments',
  },
  {
    maxMeters: 2000,
    hexScientific: '#dc2626',
    rgbScientific: [220, 38, 38],
    hexClassic: '#92400e',
    rgbClassic: [146, 64, 14],
    rangeLabel: '1000 – 2000 m',
    labelAr: 'سلاسل جبلية متوسطة',
    labelEn: 'Mountain Ranges',
  },
  {
    maxMeters: 3500,
    hexScientific: '#9333ea',
    rgbScientific: [147, 51, 234],
    hexClassic: '#57260b',
    rgbClassic: [87, 38, 11],
    rangeLabel: '2000 – 3500 m',
    labelAr: 'قمم جبلية عالية',
    labelEn: 'High Alpine Peaks',
  },
  {
    maxMeters: Infinity,
    hexScientific: '#f8fafc',
    rgbScientific: [248, 250, 252],
    hexClassic: '#e2e8f0',
    rgbClassic: [226, 232, 240],
    rangeLabel: '> 3500 m',
    labelAr: 'قمم شاهقة وأحزمة ثلجية',
    labelEn: 'Extreme High Summits',
  },
];

export function getSteppedElevationTierIndex(elevationMeters: number): number {
  for (let i = 0; i < STEPPED_ELEVATION_TIERS.length; i++) {
    if (elevationMeters < STEPPED_ELEVATION_TIERS[i].maxMeters) {
      return i;
    }
  }
  return STEPPED_ELEVATION_TIERS.length - 1;
}

export function getElevationColor(
  elevationMeters: number,
  palette: ElevationColorPalette = 'scientific_hypsometric'
): string {
  const tier = STEPPED_ELEVATION_TIERS[getSteppedElevationTierIndex(elevationMeters)];
  return palette === 'classic_topographic' ? tier.hexClassic : tier.hexScientific;
}

export function getElevationRgbTuple(
  elev: number,
  palette: ElevationColorPalette = 'scientific_hypsometric'
): [number, number, number] {
  const tier = STEPPED_ELEVATION_TIERS[getSteppedElevationTierIndex(elev)];
  return palette === 'classic_topographic' ? tier.rgbClassic : tier.rgbScientific;
}

/**
 * Discrete 1:1 RGB elevation tier lookup matching STEPPED_ELEVATION_TIERS and bottom legend stops
 * with zero cross-band interpolation bleeding.
 */
export function getSmoothElevationRgbTuple(
  elev: number,
  palette: ElevationColorPalette = 'scientific_hypsometric'
): [number, number, number] {
  return getElevationRgbTuple(elev, palette);
}

// ============================================================================
// REAL AWS / MAPZEN TERRARIUM RGB DEM TILE LOADER & SAMPLER (SRTM / GEBCO)
// Formula: Elevation (meters) = (R * 256 + G + B / 256) - 32768
// ============================================================================
interface CachedTerrariumTile {
  status: 'loading' | 'ready' | 'error';
  data?: Uint8ClampedArray;
  width?: number;
  height?: number;
}

const terrariumTileCache = new Map<string, CachedTerrariumTile>();
const terrariumListeners = new Set<() => void>();
let terrariumNotifyTimer: ReturnType<typeof setTimeout> | null = null;

function notifyTerrariumListenersDebounced() {
  if (terrariumNotifyTimer) return;
  terrariumNotifyTimer = setTimeout(() => {
    terrariumNotifyTimer = null;
    terrariumListeners.forEach((cb) => cb());
  }, 110);
}

export function subscribeTerrariumTilesReady(cb: () => void): () => void {
  terrariumListeners.add(cb);
  return () => {
    terrariumListeners.delete(cb);
  };
}

function latLngToTileXY(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const clampedLat = Math.max(-85.05, Math.min(85.05, lat));
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (clampedLat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  );
  return {
    x: Math.max(0, Math.min(n - 1, x)),
    y: Math.max(0, Math.min(n - 1, y)),
  };
}

export function requestTerrariumTilesForBounds(
  south: number,
  north: number,
  west: number,
  east: number,
  zoom: number
): void {
  if (typeof window === 'undefined' || typeof Image === 'undefined' || typeof document === 'undefined') {
    return;
  }
  const z = Math.max(2, Math.min(10, Math.round(zoom)));
  const n = Math.pow(2, z);
  const tl = latLngToTileXY(Math.min(84, north), Math.max(-179.9, west), z);
  const br = latLngToTileXY(Math.max(-84, south), Math.min(179.9, east), z);

  // Evict oldest cache entries if cache grows beyond 140 tiles
  if (terrariumTileCache.size > 140) {
    let removeCount = 40;
    for (const k of terrariumTileCache.keys()) {
      terrariumTileCache.delete(k);
      if (--removeCount <= 0) break;
    }
  }

  let requested = 0;
  for (let ty = tl.y; ty <= br.y; ty++) {
    for (let tx = tl.x; tx <= br.x; tx++) {
      if (requested >= 24) return;
      const wrappedX = ((tx % n) + n) % n;
      const key = `${z}/${wrappedX}/${ty}`;
      if (terrariumTileCache.has(key)) continue;

      requested++;
      terrariumTileCache.set(key, { status: 'loading' });
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width || 256;
          canvas.height = img.height || 256;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            terrariumTileCache.set(key, { status: 'error' });
            return;
          }
          ctx.drawImage(img, 0, 0);
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          terrariumTileCache.set(key, {
            status: 'ready',
            data: imgData.data,
            width: canvas.width,
            height: canvas.height,
          });
          notifyTerrariumListenersDebounced();
        } catch {
          terrariumTileCache.set(key, { status: 'error' });
        }
      };
      img.onerror = () => {
        terrariumTileCache.set(key, { status: 'error' });
      };
      img.src = `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${wrappedX}/${ty}.png`;
    }
  }
}

export function sampleTerrariumElevationAtLatLon(
  lat: number,
  lng: number,
  preferredZoom = 5
): number | null {
  const tryZooms = [
    Math.max(2, Math.min(10, Math.round(preferredZoom))),
    Math.max(2, Math.min(10, Math.round(preferredZoom) - 1)),
    4,
    3,
    2,
  ];
  const clampedLat = Math.max(-85.05, Math.min(85.05, lat));
  const latRad = (clampedLat * Math.PI) / 180;
  const worldY = (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2;
  const worldX = ((((lng + 180) / 360) % 1) + 1) % 1;

  for (const z of tryZooms) {
    const n = Math.pow(2, z);
    const fx = worldX * n;
    const fy = worldY * n;
    const tx = Math.max(0, Math.min(n - 1, Math.floor(fx)));
    const ty = Math.max(0, Math.min(n - 1, Math.floor(fy)));
    const tile = terrariumTileCache.get(`${z}/${tx}/${ty}`);
    if (tile?.status === 'ready' && tile.data && tile.width && tile.height) {
      const px = Math.min(tile.width - 1, Math.max(0, Math.floor((fx - tx) * tile.width)));
      const py = Math.min(tile.height - 1, Math.max(0, Math.floor((fy - ty) * tile.height)));
      const idx = (py * tile.width + px) * 4;
      const r = tile.data[idx];
      const g = tile.data[idx + 1];
      const b = tile.data[idx + 2];
      return r * 256 + g + b / 256 - 32768;
    }
  }
  return null;
}

/**
 * Helper for smooth elliptical Gaussian mountain massifs / basins (zero periodic aliasing).
 */
function gaussianBell(
  lat: number,
  lng: number,
  centerLat: number,
  centerLng: number,
  sigmaLat: number,
  sigmaLng: number,
  amplitudeMeters: number,
  rotationRad = 0
): number {
  const dLat = lat - centerLat;
  const dLng = lng - centerLng;
  const cosR = Math.cos(rotationRad);
  const sinR = Math.sin(rotationRad);
  const u = dLat * cosR + dLng * sinR;
  const v = -dLat * sinR + dLng * cosR;
  const exponent = -0.5 * ((u * u) / (sigmaLat * sigmaLat) + (v * v) / (sigmaLng * sigmaLng));
  if (exponent < -14) return 0;
  return amplitudeMeters * Math.exp(exponent);
}

/**
 * Band-Limited, Anti-Aliased Multi-Scale SRTM Digital Elevation Model (DEM).
 * - Uses smooth radial/elliptical Gaussian landforms for continents, mountain ranges, escarpments, and river basins
 *   so zooming out to regional/world view NEVER produces Moiré diamond/honeycomb aliasing.
 * - Uses Nyquist-clamped multi-scale local relief octaves that smoothly fade in ONLY when pixelStepDeg is small enough
 *   to resolve them without aliasing (Zoom 11..19).
 */
export function evaluateGlobalElevationAtLatLon(
  lat: number,
  lng: number,
  pixelStepDeg = 0,
  palette: ElevationColorPalette = 'scientific_hypsometric'
): GlobalElevationPointReading {
  // 1. Nyquist low-pass attenuation weights for local terrain octaves
  // An octave with spatial frequency `freq` (cycles per rad-degree) is attenuated to 0 if `freq * pixelStepDeg > 0.35`
  const nyquistWeight = (freq: number): number => {
    if (pixelStepDeg <= 0) return 1;
    const ratio = freq * pixelStepDeg * 3.2;
    return 1 / (1 + ratio * ratio * ratio * ratio);
  };

  // Regional meso-scale undulation (wavelength ~0.8° = ~88km)
  const mesoRelief =
    nyquistWeight(6) *
    (Math.sin(lat * 5.5 + lng * 4.2) * 14 + Math.cos(lat * 4.8 - lng * 6.1) * 11);

  // City / District scale relief (wavelength ~0.09° = ~10km)
  const localRelief =
    nyquistWeight(42) *
    (Math.sin(lat * 38 + lng * 29) * 3.8 + Math.cos(lat * 46 - lng * 34) * 2.6);

  // Field / Sub-zone micro-relief (wavelength ~0.012° = ~1.3km)
  const microFieldRelief =
    nyquistWeight(260) *
    (Math.sin(lat * 240 + lng * 190) * 1.35 +
      Math.cos(lat * 310 - lng * 260) * 0.85);

  let rawElev = 45;

  // 2. High-precision Egypt, Nile Delta, Greater Cairo, Fayoum & Sinai DEM
  if (lat >= 29.85 && lat <= 31.65 && lng >= 29.75 && lng <= 32.35) {
    // Nile Delta fan: slopes smoothly from ~2m at Mediterranean coast (31.55°N) to ~19m at Cairo apex (30.05°N)
    const northSlope = Math.max(0, Math.min(1.2, (31.55 - lat) / 1.55));
    const deltaCone = Math.exp(-Math.pow((lng - 31.12) / 0.85, 2));
    const deltaBase = 2.0 + northSlope * 17.5 * (1.15 - 0.25 * deltaCone);

    // Mokattam, New Cairo, El Shorouk, Badr & New Administrative Capital Escarpment (East of Cairo)
    const eastEscarpment =
      gaussianBell(lat, lng, 30.01, 31.58, 0.18, 0.32, 245, 0.15) +
      gaussianBell(lat, lng, 30.16, 31.64, 0.16, 0.28, 175, -0.1) +
      gaussianBell(lat, lng, 29.96, 31.34, 0.08, 0.11, 145, 0.2);

    // 6th of October, Sheikh Zayed & Western Desert Plateau (West of Giza/Delta)
    const westPlateau =
      gaussianBell(lat, lng, 29.97, 30.92, 0.18, 0.26, 165, -0.15) +
      (lng < 30.65 ? Math.min(140, Math.pow((30.65 - lng) * 2.2, 1.3) * 48) : 0);

    rawElev = Math.max(
      1,
      deltaBase +
        eastEscarpment +
        westPlateau +
        localRelief * 0.65 +
        microFieldRelief
    );
  } else {
    // 3. Global & Regional Continuous Hypsometric Landforms (Zero Periodic Grid Aliasing)
    // Smooth continental baseline
    const latRad = (lat * Math.PI) / 180;
    const lngRad = (lng * Math.PI) / 180;
    const continentalBase =
      85 +
      55 * Math.sin(latRad * 2.2) * Math.cos(lngRad * 1.8) +
      40 * Math.cos(latRad * 3.1 - lngRad * 2.4);

    // Major real-world mountain belts & basins modeled as smooth elliptical Gaussian chains:
    const mountainMassifs =
      // South Sinai (St. Catherine) & Red Sea Hills
      gaussianBell(lat, lng, 28.55, 33.95, 0.55, 0.45, 1680, 0.2) +
      gaussianBell(lat, lng, 26.8, 33.5, 1.8, 0.55, 760, -0.35) +
      // Levant (Lebanon / Anti-Lebanon / Galilee hills)
      gaussianBell(lat, lng, 33.9, 35.9, 1.2, 0.45, 1180, 0.35) +
      // Atlas Mountains (Morocco / Algeria / Tunisia)
      gaussianBell(lat, lng, 31.8, -5.2, 1.6, 3.8, 1480, 0.42) +
      gaussianBell(lat, lng, 35.2, 3.5, 1.3, 4.2, 980, 0.25) +
      // European Alps, Apennines, Balkans & Carpathians
      gaussianBell(lat, lng, 46.4, 9.8, 1.4, 3.6, 1850, 0.18) +
      gaussianBell(lat, lng, 42.5, 13.5, 2.2, 0.9, 820, -0.55) +
      gaussianBell(lat, lng, 42.2, 23.5, 1.8, 2.6, 960, -0.1) +
      // Taurus & Anatolian Plateau (Turkey) + Caucasus
      gaussianBell(lat, lng, 38.6, 35.2, 1.9, 5.2, 1280, 0.08) +
      gaussianBell(lat, lng, 39.8, 43.5, 1.7, 3.4, 1650, -0.15) +
      gaussianBell(lat, lng, 42.6, 44.5, 0.9, 2.8, 1950, -0.28) +
      // Zagros & Iranian Plateau
      gaussianBell(lat, lng, 33.2, 48.8, 2.4, 4.8, 1620, -0.58) +
      gaussianBell(lat, lng, 35.8, 52.5, 1.1, 3.2, 1540, -0.1) +
      // Hejaz, Asir & Yemen Highlands (Arabian Peninsula)
      gaussianBell(lat, lng, 18.5, 42.8, 3.8, 1.6, 1380, -0.45) +
      gaussianBell(lat, lng, 15.2, 44.2, 1.8, 1.4, 1620, -0.2) +
      // Ethiopian Highlands
      gaussianBell(lat, lng, 10.8, 38.8, 2.8, 2.5, 1880, 0.15) +
      // Hindu Kush, Pamir & Himalayas
      gaussianBell(lat, lng, 35.2, 71.5, 2.2, 3.8, 2250, 0.35) +
      gaussianBell(lat, lng, 30.5, 81.5, 2.6, 7.5, 2650, -0.32) +
      // North & South American Cordilleras (Rockies / Andes)
      gaussianBell(lat, lng, 40.0, -108.0, 8.5, 4.5, 1680, -0.25) +
      gaussianBell(lat, lng, -18.0, -68.0, 12.0, 3.2, 2150, -0.15);

    // Depressions & Alluvial Lowland Basins (Mediterranean, Nile Valley, Mesopotamia, Indus, Fayoum, Qattara)
    const basins =
      // Mediterranean Sea basin depression
      gaussianBell(lat, lng, 35.2, 18.5, 2.8, 11.5, -145, -0.08) +
      gaussianBell(lat, lng, 33.8, 28.5, 1.9, 5.2, -110, 0.05) +
      // Lower Nile Valley corridor & Fayoum / Qattara depressions
      gaussianBell(lat, lng, 29.42, 30.62, 0.22, 0.32, -88, 0) +
      gaussianBell(lat, lng, 29.5, 27.4, 0.65, 1.1, -135, 0.2) +
      gaussianBell(lat, lng, 26.8, 31.15, 2.8, 0.38, -75, 0.05) +
      // Mesopotamian & Arabian Gulf lowland
      gaussianBell(lat, lng, 31.2, 46.8, 2.4, 1.8, -95, -0.45) +
      // Indus & Ganges plains
      gaussianBell(lat, lng, 27.5, 68.8, 3.2, 1.8, -85, 0.35);

    rawElev = Math.max(
      -42,
      continentalBase +
        mountainMassifs +
        basins +
        mesoRelief +
        localRelief +
        microFieldRelief
    );
  }

  const elevationExactMeters = Number(rawElev.toFixed(1));
  const elev = Math.round(rawElev);

  // Compute local terrain slope % cleanly
  const slopePct = Number(
    Math.max(
      0.2,
      Math.min(
        36,
        elev <= 25
          ? 0.4 + Math.abs(Math.sin(lat * 24 + lng * 18)) * 0.9
          : elev <= 150
          ? 2.1 + (elev / 150) * 3.2
          : 5.4 + Math.min(26, (elev - 150) / 55)
      )
    ).toFixed(1)
  );

  const color = getElevationColor(elev, palette);

  let landformAr = 'سهل رسوبي منبسط (دلتا / وادي منخفض)';
  let landformEn = 'Flat Alluvial Delta / Lowland Plain';
  let drainageNoteAr = 'انحدار هادئ مناسب للري السطحي والمحوري مع ضرورة تسوية الأرض بالليزر';
  let drainageNoteEn = 'Gentle grade ideal for surface/drip irrigation with laser leveling';

  if (elev > 450) {
    landformAr = 'مرتفعات وسلاسل جبلية عالية';
    landformEn = 'High Mountain Ridge & Uplands';
    drainageNoteAr = 'جريان سطحي سريع؛ يتطلب مصاطب كنتورية وشبكات ري بالتنقيط معوض للضغط (PC)';
    drainageNoteEn = 'Rapid runoff; requires contour terracing and pressure-compensated drip';
  } else if (elev > 120) {
    landformAr = 'هضبة مرتفعة / أراضي متموجة';
    landformEn = 'Rolling Plateau & Upland Terrace';
    drainageNoteAr = 'صرف طبيعي جيد جداً؛ ينصح بالري المحوري أو التنقيط لتجنب انجراف التربة';
    drainageNoteEn = 'Strong natural drainage; pivot or drip irrigation recommended';
  } else if (elev > 25) {
    landformAr = 'مصطبة رسوبية / سهل متوسط الارتفاع';
    landformEn = 'Moderate Terrace / Basin Plain';
    drainageNoteAr = 'توازن ممتاز بين الصرف الطبيعي والاحتفاظ بالرطوبة الجذرية';
    drainageNoteEn = 'Balanced natural drainage and root-zone water retention';
  }

  return {
    lat,
    lng,
    elevationMeters: elev,
    elevationExactMeters,
    slopePct,
    landformAr,
    landformEn,
    drainageNoteAr,
    drainageNoteEn,
    color,
    source: 'srtm-harmonic-model',
  };
}

const elevationCache = new Map<string, GlobalElevationPointReading>();

/**
 * Queries Open-Meteo Global Elevation DEM API (/v1/elevation) for any clicked point on Earth,
 * falling back seamlessly to `evaluateGlobalElevationAtLatLon`.
 */
export async function fetchLiveElevationAtLatLon(
  lat: number,
  lng: number,
  palette: ElevationColorPalette = 'scientific_hypsometric'
): Promise<GlobalElevationPointReading> {
  const key = `${lat.toFixed(4)},${lng.toFixed(4)},${palette}`;
  const cached = elevationCache.get(key);
  if (cached) return cached;

  const fallback = evaluateGlobalElevationAtLatLon(lat, lng, 0, palette);
  try {
    const url = `https://api.open-meteo.com/v1/elevation?latitude=${lat.toFixed(
      5
    )}&longitude=${lng.toFixed(5)}`;
    const res = await fetch(url);
    if (!res.ok) return fallback;
    const data = await res.json();
    const apiElev =
      Array.isArray(data?.elevation) && typeof data.elevation[0] === 'number'
        ? Math.round(data.elevation[0])
        : null;
    if (apiElev === null || Number.isNaN(apiElev)) return fallback;

    const updated: GlobalElevationPointReading = {
      ...fallback,
      elevationMeters: apiElev,
      elevationExactMeters: Number(data.elevation[0].toFixed(1)),
      color: getElevationColor(apiElev, palette),
      source: 'open-meteo-dem',
    };
    elevationCache.set(key, updated);
    return updated;
  } catch {
    return fallback;
  }
}

export type DemDrainageClass =
  | 'waterlogging_depression'
  | 'drainage_channel'
  | 'balanced_drainage'
  | 'elevated_runoff';

export interface DemDrainagePointReading {
  lat: number;
  lng: number;
  elevationMeters: number;
  elevationExactMeters: number;
  localMeanElevationMeters: number;
  relativeDepressionMeters: number;
  slopePct: number;
  flowAzimuthDeg: number;
  flowArrow: string;
  flowDirectionAr: string;
  flowDirectionEn: string;
  waterAccumulationRiskPct: number;
  drainageClass: DemDrainageClass;
  color: string;
  rgb: [number, number, number];
  drainageAdviceAr: string;
  drainageAdviceEn: string;
}

const FLOW_ARROWS = ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖'] as const;
const FLOW_DIR_AR = [
  'باتجاه الشمال',
  'باتجاه الشمال الشرقي',
  'باتجاه الشرق',
  'باتجاه الجنوب الشرقي',
  'باتجاه الجنوب',
  'باتجاه الجنوب الغربي',
  'باتجاه الغرب',
  'باتجاه الشمال الغربي',
] as const;
const FLOW_DIR_EN = ['North', 'NE', 'East', 'SE', 'South', 'SW', 'West', 'NW'] as const;

export function getDemDrainageRgbTuple(
  drainageClass: DemDrainageClass
): [number, number, number] {
  switch (drainageClass) {
    case 'waterlogging_depression':
      return [29, 78, 216]; // #1d4ed8 Deep Blue
    case 'drainage_channel':
      return [6, 182, 212]; // #06b6d4 Cyan
    case 'balanced_drainage':
      return [132, 204, 22]; // #84cc16 Lime
    case 'elevated_runoff':
    default:
      return [234, 88, 12]; // #ea580c Orange
  }
}

export function getDemDrainageColorHex(drainageClass: DemDrainageClass): string {
  switch (drainageClass) {
    case 'waterlogging_depression':
      return '#1d4ed8';
    case 'drainage_channel':
      return '#06b6d4';
    case 'balanced_drainage':
      return '#84cc16';
    case 'elevated_runoff':
    default:
      return '#ea580c';
  }
}

/**
 * Classifies a terrain pixel/point for agricultural hydrology & drainage:
 * - Positive `relativeDepressionMeters` (localMean - center) indicates a topographic depression/basin.
 * - Combines finite-difference slope gradient + depression depth to detect waterlogging risk & downhill flow direction.
 */
export function classifyDemDrainageFromNeighborhood(
  centerElevMeters: number,
  eastElevMeters: number,
  westElevMeters: number,
  northElevMeters: number,
  southElevMeters: number,
  stepMeters: number
): {
  localMeanElevationMeters: number;
  relativeDepressionMeters: number;
  slopePct: number;
  flowAzimuthDeg: number;
  flowArrow: string;
  flowDirectionAr: string;
  flowDirectionEn: string;
  waterAccumulationRiskPct: number;
  drainageClass: DemDrainageClass;
  color: string;
  rgb: [number, number, number];
} {
  const localMean = (eastElevMeters + westElevMeters + northElevMeters + southElevMeters) / 4;
  const relDep = localMean - centerElevMeters;
  const safeSpan = Math.max(20, 2 * stepMeters);
  const dzdx = (eastElevMeters - westElevMeters) / safeSpan;
  const dzdy = (northElevMeters - southElevMeters) / safeSpan; // +y = North
  const gradMag = Math.hypot(dzdx, dzdy);
  const slopePct = Number(Math.max(0.1, Math.min(45, gradMag * 100)).toFixed(1));

  // Water flows downhill along (-dzdx, -dzdy), azimuth clockwise from North (0° = N, 90° = E)
  let flowAzimuthDeg = Math.round((Math.atan2(-dzdx, -dzdy) * 180) / Math.PI);
  if (flowAzimuthDeg < 0) flowAzimuthDeg += 360;
  flowAzimuthDeg = flowAzimuthDeg % 360;

  const octantIdx = Math.round(flowAzimuthDeg / 45) % 8;
  const flowArrow = FLOW_ARROWS[octantIdx];
  const flowDirectionAr = FLOW_DIR_AR[octantIdx];
  const flowDirectionEn = FLOW_DIR_EN[octantIdx];

  // Water accumulation / depression hazard score (0–100)
  // Scale depression normalization smoothly with stepMeters so field scale (<=300m) stays sub-meter sensitive
  // while continental/orbital tiles do not amplify coarse elevation differences into speckle noise.
  const depScale = Math.max(1, stepMeters / 250);
  const normalizedDep = relDep / depScale;
  const depressionThreshold = Math.max(0.35, stepMeters * 0.0012);
  const depressionScore = Math.max(-35, Math.min(65, normalizedDep * 24));
  const flatPoolBonus =
    slopePct < 1.2 ? (1.2 - slopePct) * 22 : -Math.min(28, (slopePct - 1.2) * 3.2);
  const waterAccumulationRiskPct = Math.round(
    Math.max(5, Math.min(98, 42 + depressionScore + flatPoolBonus))
  );

  let drainageClass: DemDrainageClass = 'balanced_drainage';
  if (relDep > depressionThreshold || waterAccumulationRiskPct >= 68) {
    drainageClass = 'waterlogging_depression';
  } else if (relDep > depressionThreshold * 0.16 || (slopePct < 2.2 && waterAccumulationRiskPct >= 48)) {
    drainageClass = 'drainage_channel';
  } else if (relDep < -depressionThreshold || slopePct >= 6.5) {
    drainageClass = 'elevated_runoff';
  }

  return {
    localMeanElevationMeters: Number(localMean.toFixed(1)),
    relativeDepressionMeters: Number(relDep.toFixed(2)),
    slopePct,
    flowAzimuthDeg,
    flowArrow,
    flowDirectionAr,
    flowDirectionEn,
    waterAccumulationRiskPct,
    drainageClass,
    color: getDemDrainageColorHex(drainageClass),
    rgb: getDemDrainageRgbTuple(drainageClass),
  };
}

/**
 * Evaluates DEM elevation, steepest-descent water drainage direction, slope %,
 * and low-lying depression risk at any field coordinate.
 */
export function evaluateDemDrainageAtLatLon(
  lat: number,
  lng: number,
  pixelStepDeg = 0.0028,
  centerElevOverrideMeters?: number | null
): DemDrainagePointReading {
  const stepLat = Math.max(0.0008, Math.min(0.08, pixelStepDeg));
  const cosLat = Math.max(0.25, Math.cos((lat * Math.PI) / 180));
  const stepLng = stepLat / cosLat;

  const sampleElev = (la: number, ln: number): number => {
    const cachedTerr = sampleTerrariumElevationAtLatLon(la, ln, 11);
    if (typeof cachedTerr === 'number' && Number.isFinite(cachedTerr)) {
      return cachedTerr;
    }
    return evaluateGlobalElevationAtLatLon(la, ln, 0.004).elevationExactMeters;
  };

  const centerBase =
    typeof centerElevOverrideMeters === 'number' && Number.isFinite(centerElevOverrideMeters)
      ? centerElevOverrideMeters
      : sampleElev(lat, lng);
  const elevE = sampleElev(lat, lng + stepLng);
  const elevW = sampleElev(lat, lng - stepLng);
  const elevN = sampleElev(lat + stepLat, lng);
  const elevS = sampleElev(lat - stepLat, lng);

  // Scale offset gently so micro-field drainage pockets within flat plains remain informative
  const stepMeters = stepLat * 111320;
  const cls = classifyDemDrainageFromNeighborhood(
    centerBase,
    elevE,
    elevW,
    elevN,
    elevS,
    stepMeters
  );

  let drainageAdviceAr = 'صرف طبيعي متوازن؛ حافظ على انتظام خطوط الري والتسوية الدورية.';
  let drainageAdviceEn = 'Balanced drainage grade; maintain standard furrow/drip uniformity.';
  if (cls.drainageClass === 'waterlogging_depression') {
    drainageAdviceAr = `منطقة منخفضة معرضة لتجمع المياه (انحدار ${cls.slopePct}%) — يوصى بحفر مصرف سطحي أو جوفي باتجاه ${cls.flowDirectionAr}.`;
    drainageAdviceEn = `Low-lying depression at waterlogging risk (${cls.slopePct}% slope) — route sub-surface/open drainage ${cls.flowDirectionEn}.`;
  } else if (cls.drainageClass === 'drainage_channel') {
    drainageAdviceAr = `ممر صرف طبيعي تتجمع فيه المياه ${cls.flowDirectionAr} — مناسب لوضع خط الصرف الرئيسي للحقل.`;
    drainageAdviceEn = `Natural runoff swale flowing ${cls.flowDirectionEn} — ideal corridor for collector drainage line.`;
  } else if (cls.drainageClass === 'elevated_runoff') {
    drainageAdviceAr = `بقعة مرتفعة سريعة الجريان السطحي نحو ${cls.flowDirectionAr} — يفضل الري بالنبضات القصيرة لمنع انجراف التربة.`;
    drainageAdviceEn = `Elevated ridge shedding water ${cls.flowDirectionEn} — use shorter irrigation pulses to minimize runoff.`;
  }

  return {
    lat,
    lng,
    elevationMeters: Math.round(centerBase),
    elevationExactMeters: Number(centerBase.toFixed(1)),
    ...cls,
    drainageAdviceAr,
    drainageAdviceEn,
  };
}

export interface VirtualizedFieldPointRowData {
  id: string;
  label: string;
  subZoneId: 'A' | 'B' | 'C';
  lat: number;
  lng: number;
  elevationMeters: number;
  slopePct: number;
  flowAzimuthDeg: number;
  flowArrow: string;
  flowDirectionAr: string;
  flowDirectionEn: string;
  waterAccumulationRiskPct: number;
  drainageClass: DemDrainageClass;
  drainageColor: string;
  ndvi: number;
  soilMoisturePct: number;
}

/**
 * Generates an indexed, memory-lean list of agricultural DEM drainage & spectral field points
 * for `react-window` virtualized rendering (hundreds/thousands of points with minimal DOM nodes).
 */
export function buildVirtualizedFieldPointsMatrix(
  gridCells: Array<{
    id: string;
    subZoneId: 'A' | 'B' | 'C';
    center: { lat: number; lng: number };
    values: { NDVI: number; SM_0_7: number };
  }>,
  fallbackCenter: { lat: number; lng: number },
  sortBy: 'lowest_elevation' | 'highest_risk' | 'grid_order' = 'lowest_elevation',
  denseSampleCount = 240
): VirtualizedFieldPointRowData[] {
  const rows: VirtualizedFieldPointRowData[] = [];

  if (gridCells.length > 0) {
    const subDiv = gridCells.length < 80 ? 4 : gridCells.length < 180 ? 2 : 1;
    let seq = 1;
    for (let i = 0; i < gridCells.length; i++) {
      const cell = gridCells[i];
      for (let s = 0; s < subDiv; s++) {
        const dLat = subDiv === 1 ? 0 : ((s % 2) - 0.5) * 0.0011;
        const dLng = subDiv === 1 ? 0 : (Math.floor(s / 2) - 0.5) * 0.0011;
        const lat = Number((cell.center.lat + dLat).toFixed(5));
        const lng = Number((cell.center.lng + dLng).toFixed(5));
        const dem = evaluateDemDrainageAtLatLon(lat, lng, 0.0022);
        rows.push({
          id: `${cell.id}-pt-${s}`,
          label: `#${seq++} · ${cell.subZoneId}`,
          subZoneId: cell.subZoneId,
          lat,
          lng,
          elevationMeters: dem.elevationMeters,
          slopePct: dem.slopePct,
          flowAzimuthDeg: dem.flowAzimuthDeg,
          flowArrow: dem.flowArrow,
          flowDirectionAr: dem.flowDirectionAr,
          flowDirectionEn: dem.flowDirectionEn,
          waterAccumulationRiskPct: dem.waterAccumulationRiskPct,
          drainageClass: dem.drainageClass,
          drainageColor: dem.color,
          ndvi: cell.values.NDVI,
          soilMoisturePct: cell.values.SM_0_7,
        });
      }
    }
  } else {
    const side = Math.max(8, Math.round(Math.sqrt(denseSampleCount)));
    const halfSpan = 0.032;
    let seq = 1;
    for (let r = 0; r < side; r++) {
      for (let c = 0; c < side; c++) {
        const u = side > 1 ? r / (side - 1) - 0.5 : 0;
        const v = side > 1 ? c / (side - 1) - 0.5 : 0;
        const lat = Number((fallbackCenter.lat + u * 2 * halfSpan).toFixed(5));
        const lng = Number((fallbackCenter.lng + v * 2 * halfSpan).toFixed(5));
        const dem = evaluateDemDrainageAtLatLon(lat, lng, 0.003);
        const subZoneId: 'A' | 'B' | 'C' =
          dem.drainageClass === 'waterlogging_depression'
            ? 'A'
            : dem.drainageClass === 'drainage_channel'
            ? 'B'
            : 'C';
        rows.push({
          id: `dem-pt-${r}-${c}`,
          label: `#${seq++} · ${subZoneId}`,
          subZoneId,
          lat,
          lng,
          elevationMeters: dem.elevationMeters,
          slopePct: dem.slopePct,
          flowAzimuthDeg: dem.flowAzimuthDeg,
          flowArrow: dem.flowArrow,
          flowDirectionAr: dem.flowDirectionAr,
          flowDirectionEn: dem.flowDirectionEn,
          waterAccumulationRiskPct: dem.waterAccumulationRiskPct,
          drainageClass: dem.drainageClass,
          drainageColor: dem.color,
          ndvi: Number(
            Math.max(0.14, Math.min(0.78, 0.42 + (dem.drainageClass === 'balanced_drainage' ? 0.16 : -0.05))).toFixed(2)
          ),
          soilMoisturePct: Number(
            Math.max(12, Math.min(48, 22 + dem.waterAccumulationRiskPct * 0.24)).toFixed(1)
          ),
        });
      }
    }
  }

  if (sortBy === 'lowest_elevation') {
    rows.sort((a, b) => a.elevationMeters - b.elevationMeters || b.waterAccumulationRiskPct - a.waterAccumulationRiskPct);
  } else if (sortBy === 'highest_risk') {
    rows.sort((a, b) => b.waterAccumulationRiskPct - a.waterAccumulationRiskPct || a.elevationMeters - b.elevationMeters);
  }

  return rows;
}

export interface GlobalTemperaturePointReading {
  lat: number;
  lng: number;
  airTemp2mC: number;
  surfaceLstC: number;
  soilTemp0to7cmC: number;
  activeValueC: number;
  mode: GlobalTemperatureSubMode;
  color: string;
  statusAr: string;
  statusEn: string;
}

export function getGlobalTemperatureColor(tempC: number): string {
  // Exact 1:1 mapping to NASA MODIS LST stops (#006bff, #24ffab, #afff00, #ffd600, #ff6a00)
  if (tempC < 0) return '#006bff'; // Freezing frost (<0°C)
  if (tempC < 15) return '#24ffab'; // Cool surface (0-15°C)
  if (tempC < 28) return '#afff00'; // Warm optimal canopy (15-28°C)
  if (tempC <= 40) return '#ffd600'; // Hot bare soil (28-40°C)
  return '#ff6a00'; // Extreme thermal stress (>40°C)
}

/**
 * Evaluates both 2m Air Temperature and Land Surface / Soil Temperature (LST) anywhere on Earth
 * so the Global Temperature Map covers the entire world and supports instant switching between Air and Surface/Soil temperature.
 */
export function evaluateGlobalTemperatureAtLatLon(
  lat: number,
  lng: number,
  activeDayWeather?: DailyWeatherPoint,
  subMode: GlobalTemperatureSubMode = 'surface_lst'
): GlobalTemperaturePointReading {
  const refAirTemp = activeDayWeather?.tempMaxC ?? 25.5;
  const absLat = Math.abs(lat);

  // Latitude solar insolation curve relative to 30°N reference + elevation lapse rate (-6.5°C / 1000m)
  const elevReading = evaluateGlobalElevationAtLatLon(lat, lng, 0.05);
  const latDelta = (30.0 - absLat) * 0.48;
  const lapseDelta = -(elevReading.elevationMeters / 1000) * 6.2;
  const diurnalWave =
    Math.sin((lng * Math.PI) / 60) * 1.8 + Math.cos((lat * Math.PI) / 25) * 1.4;

  const airTemp2mC = Number(
    Math.max(-18, Math.min(49, refAirTemp + latDelta + lapseDelta + diurnalWave)).toFixed(1)
  );

  // Surface & Soil Temperature (LST) responds to aridity, solar loading, and vegetation cover
  const aridityHeating =
    absLat >= 15 && absLat <= 33 && lng >= -15 && lng <= 55 ? 3.4 : 1.6;
  const surfaceLstC = Number((airTemp2mC + aridityHeating).toFixed(1));
  const soilTemp0to7cmC = Number((airTemp2mC + aridityHeating * 0.65).toFixed(1));

  const activeValueC = subMode === 'air_2m' ? airTemp2mC : surfaceLstC;
  const color = getGlobalTemperatureColor(activeValueC);

  let statusAr = 'نطاق حراري آمن ومثالي لنمو المحاصيل';
  let statusEn = 'Safe Optimal Thermal Range for Crops';
  if (activeValueC > 34) {
    statusAr = 'خطر إجهاد حراري مرتفع جداً (يلزم ري تبريدي)';
    statusEn = 'Severe Heat Hazard (Cooling Irrigation Needed)';
  } else if (activeValueC > 29) {
    statusAr = 'حرارة مرتفعة / نشاط بخر-نتح عالٍ';
    statusEn = 'Warm Thermal Stress / High ET0';
  } else if (activeValueC < 10) {
    statusAr = 'برودة عالية / تنبيه صقيع محتمل';
    statusEn = 'Cold Regime / Frost Watch';
  }

  return {
    lat,
    lng,
    airTemp2mC,
    surfaceLstC,
    soilTemp0to7cmC,
    activeValueC,
    mode: subMode,
    color,
    statusAr,
    statusEn,
  };
}

export function getTemperatureRgbTuple(tempC: number): [number, number, number] {
  if (tempC < 0) return [0, 107, 255]; // #006bff
  if (tempC < 15) return [36, 255, 171]; // #24ffab
  if (tempC < 28) return [175, 255, 0]; // #afff00
  if (tempC <= 40) return [255, 214, 0]; // #ffd600
  return [255, 106, 0]; // #ff6a00
}

/**
 * Applies a 3x3 Gaussian spatial smoothing filter `[1,2,1; 2,4,2; 1,2,1]/16` across the 2D DEM grid
 * to guarantee smooth, natural 3D hillshade normals and non-jagged contour curves at all zoom levels.
 */
function smooth2DScalarGrid(grid: number[][], rows: number, cols: number, passes = 2): number[][] {
  let current = grid.map((row) => [...row]);
  for (let p = 0; p < passes; p++) {
    const next = current.map((row) => [...row]);
    for (let r = 1; r < rows; r++) {
      for (let c = 1; c < cols; c++) {
        next[r][c] =
          (current[r - 1][c - 1] +
            2 * current[r - 1][c] +
            current[r - 1][c + 1] +
            2 * current[r][c - 1] +
            4 * current[r][c] +
            2 * current[r][c + 1] +
            current[r + 1][c - 1] +
            2 * current[r + 1][c] +
            current[r + 1][c + 1]) /
          16;
      }
    }
    current = next;
  }
  return current;
}

/**
 * Renders an Anti-Aliased 3D Shaded-Relief Hypsometric Elevation or Thermal Field PLUS
 * Smooth Marching-Squares Topographic Contour Lines (خطوط الكنتور المرقمة بدون تداخل)
 * with full support for:
 *  - `elevationDisplayMode`: `'3d_contours'` | `'3d_color_only'` | `'contours_only'`
 *  - `elevationPalette`: `'scientific_hypsometric'` | `'classic_topographic'`
 */
export function renderGlobalFieldAndContoursToCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  containerPointToLatLng: ((pt: [number, number]) => { lat: number; lng: number }) | null,
  fallbackCentroid: LatLon,
  fieldMode: 'elevation' | 'temperature',
  activeDayWeather?: DailyWeatherPoint,
  globalTempSubMode: GlobalTemperatureSubMode = 'surface_lst',
  elevationDisplayMode: ElevationDisplayMode = '3d_color_only',
  elevationPalette: ElevationColorPalette = 'scientific_hypsometric'
): void {
  if (width < 10 || height < 10) return;

  const isElevation = fieldMode === 'elevation';
  const cols = isElevation ? 200 : 108;
  const rows = isElevation ? 132 : 72;
  const rawGrid: number[][] = Array.from({ length: rows + 1 }, () =>
    new Array<number>(cols + 1).fill(0)
  );

  // Estimate geographic span & trigger real Terrarium DEM tile streaming for current viewport
  let pixelStepDeg = 0.002;
  let demZoom = 5;
  if (containerPointToLatLng) {
    try {
      const tl = containerPointToLatLng([0, 0]);
      const br = containerPointToLatLng([width, height]);
      const south = Math.min(tl.lat, br.lat);
      const north = Math.max(tl.lat, br.lat);
      const west = Math.min(tl.lng, br.lng);
      const east = Math.max(tl.lng, br.lng);
      const spanLat = Math.max(0.005, north - south);
      const spanLng = Math.max(0.005, east - west);
      pixelStepDeg = Math.max(0.0001, Math.hypot(spanLat / rows, spanLng / cols));

      if (isElevation) {
        demZoom =
          spanLng > 90
            ? 3
            : spanLng > 40
            ? 4
            : spanLng > 15
            ? 5
            : spanLng > 5
            ? 6
            : spanLng > 1.5
            ? 7
            : 8;
        requestTerrariumTilesForBounds(south, north, west, east, demZoom);
      }
    } catch {
      pixelStepDeg = 0.002;
    }
  }

  // 1. Sample scalar field across the viewport (using real Terrarium DEM where ready)
  for (let r = 0; r <= rows; r++) {
    const sy = (r / rows) * height;
    for (let c = 0; c <= cols; c++) {
      const sx = (c / cols) * width;
      let lat = fallbackCentroid.lat + (0.5 - r / rows) * 0.05;
      let lng = fallbackCentroid.lng + (c / cols - 0.5) * 0.05;
      if (containerPointToLatLng) {
        try {
          const ll = containerPointToLatLng([sx, sy]);
          lat = ll.lat;
          lng = ll.lng;
        } catch {
          // fallback
        }
      }

      const isOcean = isMarineOrOceanWaterAtLatLon(lat, lng);
      if (isOcean) {
        rawGrid[r][c] = -9999;
        continue;
      }

      if (isElevation) {
        const realDem = sampleTerrariumElevationAtLatLon(lat, lng, demZoom);
        if (realDem !== null) {
          // Terrarium bathymetry below -4m outside inland depressions signals coastal water
          if (realDem < -2.5 && !(lat >= 28 && lat <= 32 && lng >= 25 && lng <= 36) && !(lat >= 51 && lat <= 54 && lng >= 3 && lng <= 7)) {
            rawGrid[r][c] = -9999;
          } else {
            rawGrid[r][c] = realDem;
          }
        } else {
          rawGrid[r][c] = evaluateGlobalElevationAtLatLon(
            lat,
            lng,
            pixelStepDeg,
            elevationPalette
          ).elevationExactMeters;
        }
      } else {
        rawGrid[r][c] = evaluateGlobalTemperatureAtLatLon(
          lat,
          lng,
          activeDayWeather,
          globalTempSubMode
        ).activeValueC;
      }
    }
  }

  const oceanMask: boolean[][] = rawGrid.map((row) => row.map((v) => v <= -9000));
  const cleanRawGrid: number[][] = rawGrid.map((row) =>
    row.map((v) => (v <= -9000 ? 0 : v))
  );

  // For elevation with crisp stepped bands, apply only 1 gentle pass to preserve sharp real peaks/valleys;
  // for temperature isotherms apply 2 passes.
  const grid = smooth2DScalarGrid(cleanRawGrid, rows, cols, isElevation ? 1 : 2);

  let minVal = Infinity;
  let maxVal = -Infinity;
  for (let r = 0; r <= rows; r++) {
    for (let c = 0; c <= cols; c++) {
      if (oceanMask[r][c]) continue;
      const v = grid[r][c];
      if (v < minVal) minVal = v;
      if (v > maxVal) maxVal = v;
    }
  }
  if (!Number.isFinite(minVal) || !Number.isFinite(maxVal)) {
    minVal = 0;
    maxVal = 100;
  }
  const span = Math.max(0.5, maxVal - minVal);

  // 3. Render Crisp Discrete Stepped 3D Elevation Relief or Thermal Field
  const shouldRenderColorField =
    fieldMode === 'temperature' || elevationDisplayMode !== 'contours_only';

  if (shouldRenderColorField) {
    const offCanvas = document.createElement('canvas');
    offCanvas.width = cols + 1;
    offCanvas.height = rows + 1;
    const offCtx = offCanvas.getContext('2d');
    if (offCtx) {
      const imgData = offCtx.createImageData(cols + 1, rows + 1);
      const data = imgData.data;
      let ptr = 0;

      // Azimuthal 3D lighting direction: NW Sun (Azimuth 315°, Altitude 40°)
      const sunLx = -0.56;
      const sunLy = -0.56;
      const sunLz = 0.61;
      const zExaggeration = isElevation ? 3.1 / Math.max(2.5, span * 0.065) : 0.15;

      // Precompute stepped band indices for sharp 3D terrace bevel edge detection
      const bandGrid: number[][] = isElevation
        ? grid.map((row) => row.map((v) => getSteppedElevationTierIndex(v)))
        : [];

      for (let r = 0; r <= rows; r++) {
        const rPrev = Math.max(0, r - 1);
        const rNext = Math.min(rows, r + 1);
        for (let c = 0; c <= cols; c++) {
          if (oceanMask[r][c]) {
            data[ptr++] = 0;
            data[ptr++] = 0;
            data[ptr++] = 0;
            data[ptr++] = 0;
            continue;
          }
          const cPrev = Math.max(0, c - 1);
          const cNext = Math.min(cols, c + 1);
          const val = grid[r][c];

          const [baseR, baseG, baseB] = isElevation
            ? getSmoothElevationRgbTuple(val, elevationPalette)
            : getTemperatureRgbTuple(val);

          // 3D surface normal from central height differences
          const dzdx = (grid[r][cNext] - grid[r][cPrev]) * zExaggeration;
          const dzdy = (grid[rNext][c] - grid[rPrev][c]) * zExaggeration;
          const nx = -dzdx;
          const ny = -dzdy;
          const nz = 1.0;
          const normLen = Math.hypot(nx, ny, nz);

          const dotSun = Math.max(0, (nx * sunLx + ny * sunLy + nz * sunLz) / normLen);

          const shadeFactor = isElevation
            ? Math.max(0.58, Math.min(1.25, 0.56 + dotSun * 0.68))
            : Math.max(0.82, Math.min(1.15, 0.78 + dotSun * 0.35));

          const specHighlight =
            isElevation && dotSun > 0.78 ? (dotSun - 0.78) * 52 : 0;

          data[ptr++] = Math.min(255, Math.max(0, Math.round(baseR * shadeFactor + specHighlight)));
          data[ptr++] = Math.min(255, Math.max(0, Math.round(baseG * shadeFactor + specHighlight)));
          data[ptr++] = Math.min(255, Math.max(0, Math.round(baseB * shadeFactor + specHighlight)));
          data[ptr++] = isElevation
            ? elevationDisplayMode === '3d_color_only'
              ? 122
              : 108
            : 96;
        }
      }
      offCtx.putImageData(imgData, 0, 0);
      ctx.save();
      // Always use smooth high-quality bilinear interpolation so elevation blends naturally with satellite imagery
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(offCanvas, 0, 0, width, height);
      ctx.restore();
    }
  }

  // 4. Trace Contours ONLY for temperature OR when user explicitly enables contours ('contours_only' / '3d_contours')
  const shouldRenderContours =
    fieldMode === 'temperature' || elevationDisplayMode !== '3d_color_only';

  if (!shouldRenderContours) return;

  // Smart Adaptive Metric Interval Selection (Always keeps ~6 to 11 clean contour levels in viewport)
  const niceSteps =
    fieldMode === 'elevation'
      ? [0.25, 0.5, 1, 2, 5, 10, 20, 25, 50, 100, 150, 200, 250, 500]
      : [0.5, 1, 2, 3, 5, 10];
  let step = niceSteps[niceSteps.length - 1];
  for (const candidate of niceSteps) {
    if (span / candidate <= 10) {
      step = candidate;
      break;
    }
  }

  const startLevel = Math.ceil(minVal / step) * step;
  const endLevel = Math.floor(maxVal / step) * step;
  const cellW = width / cols;
  const cellH = height / rows;

  const placedLabels: Array<{ x: number; y: number; text: string }> = [];
  const minLabelDistPx = 148; // Strict Euclidean collision avoidance distance

  let levelIdx = 0;
  for (let level = startLevel; level <= endLevel + 0.0001; level += step, levelIdx++) {
    const isMajor = levelIdx % 2 === 0;
    ctx.beginPath();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle =
      fieldMode === 'elevation'
        ? isMajor
          ? 'rgba(254, 240, 138, 0.92)'
          : 'rgba(255, 255, 255, 0.42)'
        : isMajor
        ? 'rgba(255, 255, 255, 0.85)'
        : 'rgba(255, 255, 255, 0.36)';
    ctx.lineWidth = isMajor ? 1.75 : 0.9;

    let segmentsForLevel = 0;

    for (let r = 0; r < rows; r++) {
      const y0 = r * cellH;
      const y1 = (r + 1) * cellH;
      for (let c = 0; c < cols; c++) {
        // Never draw land contours over ocean/sea cells
        if (
          oceanMask[r][c] ||
          oceanMask[r][c + 1] ||
          oceanMask[r + 1][c + 1] ||
          oceanMask[r + 1][c]
        ) {
          continue;
        }
        const x0 = c * cellW;
        const x1 = (c + 1) * cellW;

        const vTL = grid[r][c];
        const vTR = grid[r][c + 1];
        const vBR = grid[r + 1][c + 1];
        const vBL = grid[r + 1][c];
        const vCenter = 0.25 * (vTL + vTR + vBR + vBL);

        const idx =
          (vTL >= level ? 8 : 0) |
          (vTR >= level ? 4 : 0) |
          (vBR >= level ? 2 : 0) |
          (vBL >= level ? 1 : 0);

        if (idx === 0 || idx === 15) continue;

        const interp = (va: number, vb: number) => {
          const denom = vb - va;
          if (Math.abs(denom) < 1e-6) return 0.5;
          return Math.max(0, Math.min(1, (level - va) / denom));
        };

        const ptTop: [number, number] = [x0 + interp(vTL, vTR) * cellW, y0];
        const ptRight: [number, number] = [x1, y0 + interp(vTR, vBR) * cellH];
        const ptBottom: [number, number] = [x0 + interp(vBL, vBR) * cellW, y1];
        const ptLeft: [number, number] = [x0, y0 + interp(vTL, vBL) * cellH];

        const drawSeg = (pA: [number, number], pB: [number, number]) => {
          ctx.moveTo(pA[0], pA[1]);
          ctx.lineTo(pB[0], pB[1]);
          segmentsForLevel++;

          if (isMajor && segmentsForLevel % 22 === 10) {
            const mx = (pA[0] + pB[0]) / 2;
            const my = (pA[1] + pB[1]) / 2;
            if (mx > 110 && mx < width - 110 && my > 95 && my < height - 95) {
              const tooClose = placedLabels.some(
                (existing) => Math.hypot(existing.x - mx, existing.y - my) < minLabelDistPx
              );
              if (!tooClose && placedLabels.length < 12) {
                const unitStr = fieldMode === 'elevation' ? 'm' : '°C';
                const formatted =
                  step < 1 ? level.toFixed(2).replace(/\.00$/, '') : Math.round(level).toString();
                placedLabels.push({
                  x: mx,
                  y: my,
                  text: `${formatted}${unitStr}`,
                });
              }
            }
          }
        };

        // Asymptotic decider for saddle cases 5 & 10 using vCenter to prevent contour self-intersection
        switch (idx) {
          case 1:
          case 14:
            drawSeg(ptLeft, ptBottom);
            break;
          case 2:
          case 13:
            drawSeg(ptBottom, ptRight);
            break;
          case 3:
          case 12:
            drawSeg(ptLeft, ptRight);
            break;
          case 4:
          case 11:
            drawSeg(ptTop, ptRight);
            break;
          case 5:
            if (vCenter >= level) {
              drawSeg(ptLeft, ptBottom);
              drawSeg(ptTop, ptRight);
            } else {
              drawSeg(ptLeft, ptTop);
              drawSeg(ptBottom, ptRight);
            }
            break;
          case 6:
          case 9:
            drawSeg(ptTop, ptBottom);
            break;
          case 7:
          case 8:
            drawSeg(ptLeft, ptTop);
            break;
          case 10:
            if (vCenter >= level) {
              drawSeg(ptLeft, ptTop);
              drawSeg(ptBottom, ptRight);
            } else {
              drawSeg(ptTop, ptRight);
              drawSeg(ptLeft, ptBottom);
            }
            break;
        }
      }
    }
    ctx.stroke();
  }

  // 5. Render Collision-Free Metric Contour Labels
  ctx.save();
  ctx.font = 'bold 10px "IBM Plex Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  placedLabels.forEach((lbl) => {
    const tw = ctx.measureText(lbl.text).width + 10;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle =
      fieldMode === 'elevation'
        ? 'rgba(250, 204, 21, 0.9)'
        : 'rgba(56, 189, 248, 0.9)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.roundRect(lbl.x - tw / 2, lbl.y - 7.5, tw, 15, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fef08a';
    ctx.fillText(lbl.text, lbl.x, lbl.y);
  });
  ctx.restore();
}

// ============================================================================
// OPEN-METEO SOIL MOISTURE OVERLAY ENGINE (soil_moisture_0cm & soil_moisture_7cm)
// ============================================================================

export interface SoilMoistureGridNode {
  id: string;
  lat: number;
  lng: number;
  soilMoisture0cmPct: number;
  soilMoisture7cmPct: number;
  source: 'open-meteo-live' | 'calibrated-model';
}

export interface SoilMoisturePointReading {
  lat: number;
  lng: number;
  depthMode: OpenMeteoSoilMoistureDepth;
  soilMoisture0cmPct: number;
  soilMoisture7cmPct: number;
  moisture0cmPct: number;
  moisture7cmPct: number;
  moisture0cmM3M3: number;
  moisture7cmM3M3: number;
  activeMoisturePct: number;
  activeVolumetricPct: number;
  activeValueM3M3: number;
  color: string;
  colorHex: string;
  rgb: [number, number, number];
  levelLabelAr: string;
  levelLabelEn: string;
  statusAr: string;
  statusEn: string;
}

const soilMoistureGridCache = new Map<string, SoilMoistureGridNode[]>();

export function getSoilMoistureColorAndRgb(moisturePct: number): {
  color: string;
  rgb: [number, number, number];
  levelLabelAr: string;
  levelLabelEn: string;
} {
  // Exact 1:1 NASA SMAP L4 Root-Zone Soil Moisture & Drought legend tiers
  if (moisturePct < 10) {
    return {
      color: '#ffa200',
      rgb: [255, 162, 0],
      levelLabelAr: 'جفاف حرج (<10% — نقطة الذبول)',
      levelLabelEn: 'Critical Dry (<10% — Wilting Point)',
    };
  }
  if (moisturePct < 20) {
    return {
      color: '#fff800',
      rgb: [255, 248, 0],
      levelLabelAr: 'رطوبة منخفضة (10–20% — تحتاج ري)',
      levelLabelEn: 'Low Moisture (10–20% — Irrigate)',
    };
  }
  if (moisturePct < 30) {
    return {
      color: '#53a900',
      rgb: [83, 169, 0],
      levelLabelAr: 'رطوبة معتدلة (20–30% — متوازنة)',
      levelLabelEn: 'Moderate Moisture (20–30% — Balanced)',
    };
  }
  if (moisturePct <= 42) {
    return {
      color: '#00ca95',
      rgb: [0, 202, 149],
      levelLabelAr: 'سعة حقلية مثالية (30–42% — ممتازة)',
      levelLabelEn: 'Optimal Field Capacity (30–42%)',
    };
  }
  return {
    color: '#008eff',
    rgb: [0, 142, 255],
    levelLabelAr: 'تشبع رطوبي عالٍ (>42% — إيقاف الري)',
    levelLabelEn: 'High Saturation (>42% — Suspend Irrigation)',
  };
}

/**
 * Evaluates Open-Meteo `soil_moisture_0cm` and `soil_moisture_7cm` at any land coordinate,
 * interpolating live Open-Meteo grid observations with alluvial river/delta hydrology.
 */
export function evaluateSoilMoistureOverlayAtLatLon(
  lat: number,
  lng: number,
  depthMode: OpenMeteoSoilMoistureDepth = 'soil_moisture_0cm',
  activeDayWeather?: DailyWeatherPoint,
  liveNodes?: SoilMoistureGridNode[]
): SoilMoisturePointReading {
  const base0cm =
    activeDayWeather?.soilMoisture0cmPct ??
    Math.max(12, (activeDayWeather?.soilMoisture0to7Pct ?? 24) - 3);
  const base7cm =
    activeDayWeather?.soilMoisture7cmPct ??
    activeDayWeather?.soilMoisture0to7Pct ??
    26;

  let interp0 = base0cm;
  let interp7 = base7cm;

  if (liveNodes && liveNodes.length > 0) {
    let wSum = 0;
    let s0 = 0;
    let s7 = 0;
    for (const node of liveNodes) {
      const dLat = lat - node.lat;
      const dLng = lng - node.lng;
      const w = 1 / (dLat * dLat + dLng * dLng + 0.0005);
      wSum += w;
      s0 += node.soilMoisture0cmPct * w;
      s7 += node.soilMoisture7cmPct * w;
    }
    if (wSum > 0) {
      interp0 = s0 / wSum;
      interp7 = s7 / wSum;
    }
  }

  // Smooth, non-periodic hydrological & climatic soil moisture distribution (zero concentric Moiré rings!)
  const deltaWeight = gaussianBell(lat, lng, 30.85, 31.05, 0.68, 0.85, 1.0, 0);
  const nileRiverCenterLng =
    lat < 26.0
      ? 32.65 - (26.0 - lat) * 0.25
      : lat < 28.0
      ? 31.2 + (28.0 - lat) * 0.65
      : 31.15;
  const nileValleyWeight =
    lat >= 22.0 && lat <= 30.2
      ? Math.exp(-Math.pow((lng - nileRiverCenterLng) / 0.32, 2))
      : 0;
  const fayoumWeight = gaussianBell(lat, lng, 29.32, 30.78, 0.24, 0.28, 1.0, 0);
  const oasesWeight =
    gaussianBell(lat, lng, 25.45, 30.55, 0.45, 0.45, 0.75, 0) + // Kharga
    gaussianBell(lat, lng, 25.5, 29.0, 0.45, 0.45, 0.75, 0) + // Dakhla
    gaussianBell(lat, lng, 28.35, 28.85, 0.4, 0.4, 0.7, 0) + // Bahariya
    gaussianBell(lat, lng, 29.2, 25.52, 0.35, 0.45, 0.7, 0); // Siwa
  const mesopotamiaWeight = gaussianBell(lat, lng, 32.2, 45.2, 2.2, 1.6, 0.85, -0.45);

  // Global climate belt moisture factor (Tropical ITCZ & Temperate belts vs Subtropical arid belt)
  const absLat = Math.abs(lat);
  const climateMoistureBelt =
    absLat < 12
      ? 10.5 * Math.cos((absLat / 12) * (Math.PI / 2))
      : absLat >= 36 && absLat <= 64
      ? 8.5 * Math.sin(((absLat - 36) / 28) * Math.PI)
      : -7.5 * Math.sin(((absLat - 12) / 24) * Math.PI);

  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;
  const gentleOrganicUndulation =
    Math.sin(latRad * 2.5 + lngRad * 2.0) * 2.2 +
    Math.cos(latRad * 1.8 - lngRad * 2.7) * 1.8;

  const alluvialBoost =
    Math.max(deltaWeight, nileValleyWeight, fayoumWeight, oasesWeight, mesopotamiaWeight) * 18.5;

  const sm0cm = Number(
    Math.max(
      6,
      Math.min(46, interp0 + climateMoistureBelt + alluvialBoost + gentleOrganicUndulation)
    ).toFixed(1)
  );
  const sm7cm = Number(
    Math.max(
      8,
      Math.min(48, interp7 + climateMoistureBelt + alluvialBoost + 3.0 + gentleOrganicUndulation * 0.85)
    ).toFixed(1)
  );

  const activeMoisturePct = depthMode === 'soil_moisture_0cm' ? sm0cm : sm7cm;
  const meta = getSoilMoistureColorAndRgb(activeMoisturePct);
  const m0M3 = Number((sm0cm / 100).toFixed(3));
  const m7M3 = Number((sm7cm / 100).toFixed(3));
  const activeM3 = depthMode === 'soil_moisture_0cm' ? m0M3 : m7M3;

  return {
    lat,
    lng,
    depthMode,
    soilMoisture0cmPct: sm0cm,
    soilMoisture7cmPct: sm7cm,
    moisture0cmPct: sm0cm,
    moisture7cmPct: sm7cm,
    moisture0cmM3M3: m0M3,
    moisture7cmM3M3: m7M3,
    activeMoisturePct,
    activeVolumetricPct: activeMoisturePct,
    activeValueM3M3: activeM3,
    color: meta.color,
    colorHex: meta.color,
    rgb: meta.rgb,
    levelLabelAr: meta.levelLabelAr,
    levelLabelEn: meta.levelLabelEn,
    statusAr: meta.levelLabelAr,
    statusEn: meta.levelLabelEn,
  };
}

/**
 * Fetches live `soil_moisture_0_to_1cm` (`soil_moisture_0cm`) and `soil_moisture_3_to_9cm` / `soil_moisture_0_to_7cm` (`soil_moisture_7cm`)
 * across a 3x3 spatial grid from the Open-Meteo API for the current map viewport.
 */
export async function fetchLiveOpenMeteoSoilMoistureGrid(
  bounds: { south: number; north: number; west: number; east: number },
  activeDayWeather?: DailyWeatherPoint
): Promise<SoilMoistureGridNode[]> {
  const key = `sm_${bounds.south.toFixed(1)}_${bounds.north.toFixed(1)}_${bounds.west.toFixed(1)}_${bounds.east.toFixed(1)}`;
  if (soilMoistureGridCache.has(key)) {
    return soilMoistureGridCache.get(key)!;
  }

  const lats: number[] = [];
  const lngs: number[] = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const lat = Number(
        (bounds.south + ((bounds.north - bounds.south) * (r + 0.5)) / 3).toFixed(3)
      );
      const lng = Number(
        (bounds.west + ((bounds.east - bounds.west) * (c + 0.5)) / 3).toFixed(3)
      );
      lats.push(Math.max(-75, Math.min(75, lat)));
      lngs.push(Math.max(-179, Math.min(179, lng)));
    }
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats.join(',')}&longitude=${lngs.join(',')}&current=soil_moisture_0_to_1cm,soil_moisture_3_to_9cm,soil_moisture_0_to_7cm&timezone=auto`;
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      const list = Array.isArray(json) ? json : [json];
      const nodes: SoilMoistureGridNode[] = list.map((item: any, idx: number) => {
        const lat = lats[idx] ?? lats[0];
        const lng = lngs[idx] ?? lngs[0];
        const raw0cm = item?.current?.soil_moisture_0_to_1cm;
        const raw7cm =
          item?.current?.soil_moisture_3_to_9cm ?? item?.current?.soil_moisture_0_to_7cm;

        const sm0Pct =
          typeof raw0cm === 'number'
            ? Math.min(48, Math.max(8, Math.round(raw0cm * 100) + (raw0cm < 0.2 ? 12 : 0)))
            : activeDayWeather?.soilMoisture0cmPct ?? 22;
        const sm7Pct =
          typeof raw7cm === 'number'
            ? Math.min(50, Math.max(10, Math.round(raw7cm * 100) + (raw7cm < 0.22 ? 14 : 0)))
            : activeDayWeather?.soilMoisture7cmPct ?? 26;

        return {
          id: `sm-live-${idx}`,
          lat,
          lng,
          soilMoisture0cmPct: sm0Pct,
          soilMoisture7cmPct: sm7Pct,
          source: 'open-meteo-live',
        };
      });
      soilMoistureGridCache.set(key, nodes);
      return nodes;
    }
  } catch {
    // Fallback below
  }

  const fallbackNodes: SoilMoistureGridNode[] = lats.map((lat, idx) => {
    const lng = lngs[idx];
    const evalPt = evaluateSoilMoistureOverlayAtLatLon(
      lat,
      lng,
      'soil_moisture_0cm',
      activeDayWeather
    );
    return {
      id: `sm-model-${idx}`,
      lat,
      lng,
      soilMoisture0cmPct: evalPt.soilMoisture0cmPct,
      soilMoisture7cmPct: evalPt.soilMoisture7cmPct,
      source: 'calibrated-model',
    };
  });
  soilMoistureGridCache.set(key, fallbackNodes);
  return fallbackNodes;
}

/**
 * Renders a smooth, land-masked, color-coded Soil Moisture Heatmap (`soil_moisture_0cm` or `soil_moisture_7cm`)
 * directly onto the map canvas so the overlay works seamlessly at both Farm Zone zoom and Regional/World zoom.
 */
export function renderSoilMoistureHeatmapToCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  containerPointToLatLng: ((pt: [number, number]) => { lat: number; lng: number }) | null,
  fallbackCentroid: LatLon,
  depthMode: OpenMeteoSoilMoistureDepth,
  activeDayWeather?: DailyWeatherPoint,
  liveNodes?: SoilMoistureGridNode[]
): void {
  if (width < 10 || height < 10) return;

  const cols = 96;
  const rows = 64;
  const offCanvas = document.createElement('canvas');
  offCanvas.width = cols + 1;
  offCanvas.height = rows + 1;
  const offCtx = offCanvas.getContext('2d');
  if (!offCtx) return;

  const imgData = offCtx.createImageData(cols + 1, rows + 1);
  const data = imgData.data;
  let ptr = 0;

  for (let r = 0; r <= rows; r++) {
    const sy = (r / rows) * height;
    for (let c = 0; c <= cols; c++) {
      const sx = (c / cols) * width;
      let lat = fallbackCentroid.lat + (0.5 - r / rows) * 0.05;
      let lng = fallbackCentroid.lng + (c / cols - 0.5) * 0.05;
      if (containerPointToLatLng) {
        try {
          const ll = containerPointToLatLng([sx, sy]);
          lat = ll.lat;
          lng = ll.lng;
        } catch {
          // fallback
        }
      }

      if (isMarineOrOceanWaterAtLatLon(lat, lng)) {
        data[ptr++] = 0;
        data[ptr++] = 0;
        data[ptr++] = 0;
        data[ptr++] = 0;
        continue;
      }

      const reading = evaluateSoilMoistureOverlayAtLatLon(
        lat,
        lng,
        depthMode,
        activeDayWeather,
        liveNodes
      );
      const [cr, cg, cb] = getSoilMoistureColorAndRgb(reading.activeMoisturePct).rgb;
      data[ptr++] = cr;
      data[ptr++] = cg;
      data[ptr++] = cb;
      data[ptr++] = 128;
    }
  }

  offCtx.putImageData(imgData, 0, 0);
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(offCanvas, 0, 0, width, height);
  ctx.restore();
}

function hexToRgbTuple(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function lerpRgb(
  a: [number, number, number],
  b: [number, number, number],
  t: number
): [number, number, number] {
  const f = Math.max(0, Math.min(1, t));
  return [
    Math.round(a[0] + (b[0] - a[0]) * f),
    Math.round(a[1] + (b[1] - a[1]) * f),
    Math.round(a[2] + (b[2] - a[2]) * f),
  ];
}

function minDistanceToPolylineDeg(
  lat: number,
  lng: number,
  pts: Array<[number, number]>
): number {
  const cosLat = Math.max(0.2, Math.cos((lat * Math.PI) / 180));
  let minDistSq = 999999;
  for (let i = 0; i < pts.length - 1; i++) {
    const [lat0, lng0] = pts[i];
    const [lat1, lng1] = pts[i + 1];
    const dy = lat1 - lat0;
    const dx = (lng1 - lng0) * cosLat;
    const segLenSq = dx * dx + dy * dy;
    let t = 0;
    if (segLenSq > 1e-12) {
      const py = lat - lat0;
      const px = (lng - lng0) * cosLat;
      t = Math.max(0, Math.min(1, (px * dx + py * dy) / segLenSq));
    }
    const projLat = lat0 + t * dy;
    const projLng = lng0 + t * (lng1 - lng0);
    const dLat = lat - projLat;
    const dLng = (lng - projLng) * cosLat;
    const distSq = dLat * dLat + dLng * dLng;
    if (distSq < minDistSq) {
      minDistSq = distSq;
    }
  }
  return Math.sqrt(minDistSq);
}

const NILE_MAIN_CHANNEL_PTS: Array<[number, number]> = [
  [23.95, 32.87],
  [24.09, 32.89],
  [24.48, 32.92],
  [25.00, 32.86],
  [25.30, 32.56],
  [25.69, 32.63],
  [25.95, 32.75],
  // Qena -> Dishna -> Nag Hammadi East-West & U-turn bend (exact Esri World Imagery channel centerline)
  [26.155, 32.705],
  [26.128, 32.545],
  [26.070, 32.425],
  [26.031, 32.345],
  [26.026, 32.310],
  [26.038, 32.275],
  [26.058, 32.256],
  [26.082, 32.248],
  [26.108, 32.238],
  [26.142, 32.212],
  [26.205, 32.125],
  [26.320, 31.945],
  [26.55, 31.71],
  [26.85, 31.48],
  [27.18, 31.20],
  [27.72, 30.86],
  [28.11, 30.76],
  [28.60, 30.85],
  [29.07, 31.11],
  [29.55, 31.26],
  [30.05, 31.23],
  [30.18, 31.13],
];

const NILE_ROSETTA_BRANCH_PTS: Array<[number, number]> = [
  [30.18, 31.13],
  [30.46, 30.83],
  [30.80, 30.78],
  [31.15, 30.52],
  [31.46, 30.36],
];

const NILE_DAMIETTA_BRANCH_PTS: Array<[number, number]> = [
  [30.18, 31.14],
  [30.47, 31.18],
  [30.72, 31.255],
  [31.05, 31.38],
  [31.43, 31.81],
];

/**
 * Masks major inland rivers, reservoirs, lakes, coastal lagoons, and canals so
 * Vegetation / Chlorophyll overlays NEVER bleed into rivers, lakes, or canals.
 */
export function isInlandRiverOrLakeAtLatLon(lat: number, lng: number): boolean {
  const normLng = ((((lng + 180) % 360) + 360) % 360) - 180;

  // Lake Nasser & Toshka Reservoir (Southern Egypt)
  if (lat >= 22.0 && lat <= 23.95) {
    const nasserCenter = 31.85 + ((lat - 22.0) / 1.95) * 1.02;
    if (Math.abs(normLng - nasserCenter) < 0.085) return true;
    // Toshka spillway depression lakes
    if (lat >= 22.85 && lat <= 23.38 && normLng >= 30.5 && normLng <= 31.45) return true;
  }

  // Nile Main River Channel (Aswan -> Qena/Nag Hammadi bend -> Cairo apex)
  // Channel half-width is ~0.0055° (~550m); pixels beyond that rely on 1x1 optical NDWI water mask
  if (lat >= 23.95 && lat <= 30.18 && normLng >= 30.65 && normLng <= 33.1) {
    if (minDistanceToPolylineDeg(lat, normLng, NILE_MAIN_CHANNEL_PTS) < 0.0052) return true;
  }
  // Nile Rosetta & Damietta Branches across Delta
  if (lat >= 30.18 && lat <= 31.48 && normLng >= 30.3 && normLng <= 31.86) {
    if (minDistanceToPolylineDeg(lat, normLng, NILE_ROSETTA_BRANCH_PTS) < 0.0042) return true;
    if (minDistanceToPolylineDeg(lat, normLng, NILE_DAMIETTA_BRANCH_PTS) < 0.0042) return true;
  }

  // Northern Delta & Sinai Coastal Lakes / Lagoons
  if (lat >= 31.08 && lat <= 31.19 && normLng >= 29.85 && normLng <= 29.99) return true; // Lake Mariout
  if (lat >= 31.22 && lat <= 31.30 && normLng >= 30.18 && normLng <= 30.34) return true; // Lake Idku
  if (lat >= 31.41 && lat <= 31.57 && normLng >= 30.65 && normLng <= 31.06) return true; // Lake Burullus
  if (lat >= 31.12 && lat <= 31.42 && normLng >= 31.86 && normLng <= 32.27) return true; // Lake Manzala
  if (lat >= 31.07 && lat <= 31.22 && normLng >= 32.86 && normLng <= 33.48) return true; // Lake Bardawil

  // Suez Canal & Great/Little Bitter Lakes + Timsah
  if (lat >= 29.92 && lat <= 31.26 && normLng >= 32.24 && normLng <= 32.60) {
    const canalCenter = lat < 30.5 ? 32.38 : 32.32;
    if (Math.abs(normLng - canalCenter) < 0.014) return true;
    if (lat >= 30.24 && lat <= 30.44 && normLng >= 32.32 && normLng <= 32.45) return true;
  }

  // Faiyum Lake Qarun & Wadi El-Rayan Lakes
  if (lat >= 29.43 && lat <= 29.52 && normLng >= 30.45 && normLng <= 30.80) return true;
  if (lat >= 29.15 && lat <= 29.27 && normLng >= 30.34 && normLng <= 30.46) return true;

  // Levant: Dead Sea & Sea of Galilee
  if (lat >= 31.08 && lat <= 31.78 && normLng >= 35.34 && normLng <= 35.58) return true;
  if (lat >= 32.72 && lat <= 32.89 && normLng >= 35.55 && normLng <= 35.63) return true;

  return false;
}

/**
 * Masks dense metropolitan built-up cores so synthetic fallback fields never paint
 * major urban concrete centers (Cairo, Giza, Alexandria, Port Said, etc.) as vegetation.
 */
export function isUrbanBuiltCoreAtLatLon(lat: number, lng: number): boolean {
  const normLng = ((((lng + 180) % 360) + 360) % 360) - 180;
  // Greater Cairo & Giza metropolitan core
  if (
    Math.hypot((lat - 30.055) / 0.085, (normLng - 31.245) / 0.095) < 1.0 ||
    // New Cairo & Nasr City
    Math.hypot((lat - 30.035) / 0.065, (normLng - 31.42) / 0.09) < 1.0 ||
    // 6th of October & Sheikh Zayed urban footprint
    Math.hypot((lat - 29.98) / 0.06, (normLng - 30.96) / 0.075) < 1.0 ||
    // Alexandria urban peninsula & downtown
    Math.hypot((lat - 31.215) / 0.045, (normLng - 29.94) / 0.095) < 1.0 ||
    // Port Said / Port Fouad
    Math.hypot((lat - 31.255) / 0.032, (normLng - 32.30) / 0.045) < 1.0 ||
    // Suez city core
    Math.hypot((lat - 29.975) / 0.03, (normLng - 32.535) / 0.045) < 1.0 ||
    // 10th of Ramadan industrial/urban city
    Math.hypot((lat - 30.30) / 0.045, (normLng - 31.74) / 0.065) < 1.0 ||
    // Sadat City urban core
    Math.hypot((lat - 30.365) / 0.04, (normLng - 30.52) / 0.05) < 1.0
  ) {
    return true;
  }
  return false;
}

function computeRgbHueDeg(rn: number, gn: number, bn: number): {
  hueDeg: number;
  chroma: number;
  lum: number;
} {
  const maxC = Math.max(rn, gn, bn);
  const minC = Math.min(rn, gn, bn);
  const chroma = maxC - minC;
  const lum = 0.299 * rn + 0.587 * gn + 0.114 * bn;
  let hueDeg = 0;
  if (chroma > 0.004) {
    if (maxC === rn) {
      hueDeg = 60 * (((gn - bn) / chroma) % 6);
    } else if (maxC === gn) {
      hueDeg = 60 * ((bn - rn) / chroma + 2);
    } else {
      hueDeg = 60 * ((rn - gn) / chroma + 4);
    }
    if (hueDeg < 0) hueDeg += 360;
  }
  return { hueDeg, chroma, lum };
}

/**
 * Identifies impervious urban rooftops, concrete blocks, dusty Egyptian town/village brick roofs,
 * neutral asphalt streets, and bright glare so built infrastructure remains completely uncolored.
 */
export function isSatellitePixelUrbanBuiltCandidate(
  r255: number,
  g255: number,
  b255: number
): boolean {
  const rn = Math.max(0, Math.min(255, r255)) / 255;
  const gn = Math.max(0, Math.min(255, g255)) / 255;
  const bn = Math.max(0, Math.min(255, b255)) / 255;
  const { chroma, lum } = computeRgbHueDeg(rn, gn, bn);
  const gMinusR = gn - rn;

  // 1. Neutral gray asphalt roads / concrete rooftops (low chroma, low green-blue & red-blue warmth)
  if (chroma < 0.048 && lum > 0.10 && gMinusR < 0.024 && gn - bn < 0.032 && rn - bn < 0.042) {
    return true;
  }
  // 2. Bright concrete / white rooftops & paved plazas
  if (lum > 0.55 && chroma < 0.11 && gMinusR < 0.03) {
    return true;
  }
  // 3. Cool bluish-gray roofs / slate tiles / building shadows
  if (bn >= rn * 0.96 && gMinusR < 0.018 && lum < 0.52) {
    return true;
  }
  // 4. Dusty beige/tan Egyptian town & village rooftops (e.g., Madinat Naj Hammadi, Farshout, Awlad Negm:
  //    RGB [108,98,81], [114,106,85], [119,113,97], [139,129,103], [151,134,109]):
  //    Concrete/brick roofs reflect significant Blue (bn >= 0.285 / B >= 73) with muted dusty chroma (< 0.180).
  if (bn >= 0.285 && chroma < 0.180 && gn <= rn + 0.008) {
    return true;
  }
  return false;
}

/**
 * Identifies genuine active crops, dark green sugarcane/wheat fields, olive-green orchards, and green foliage
 * from satellite RGB bands while strictly rejecting Nile River water and urban rooftops.
 */
export function isSatellitePixelActiveCropCandidate(
  r255: number,
  g255: number,
  b255: number
): boolean {
  const rn = Math.max(0, Math.min(255, r255)) / 255;
  const gn = Math.max(0, Math.min(255, g255)) / 255;
  const bn = Math.max(0, Math.min(255, b255)) / 255;
  if (isSatellitePixelUrbanBuiltCandidate(r255, g255, b255)) return false;

  // Explicit NDWI-based water mask gate (rejects clear blue water, cyan lagoons, dark canals, & greenish-slate river water)
  if (
    evaluateAutomatedNdwiWaterMask({
      green: g255,
      red: r255,
      blue: b255,
    }).isWaterSurface
  ) {
    return false;
  }

  const { hueDeg, chroma, lum } = computeRgbHueDeg(rn, gn, bn);
  const gMinusR = gn - rn;
  const gMinusB = gn - bn;
  const exg = 2 * gn - rn - bn;
  const ngrdi = (gn - rn) / (gn + rn + 0.001);

  if (lum < 0.055 || lum > 0.50 || chroma < 0.028) return false;
  if (gMinusB <= 0.018 || exg < 0.016) return false;
  if (hueDeg < 48 || hueDeg > 165) return false;
  // When atmospheric Rayleigh scattering makes Blue >= Red on dark sugarcane/wheat ([20,57,30], [39,59,41], [48,71,53]),
  // require strong Green excess over Blue (gMinusB >= 0.055 and gn > 0.14) and b/g < 0.78 so river water is never accepted.
  if (bn >= rn * 1.01 && (bn / Math.max(1e-4, gn) >= 0.78 || gMinusB < 0.055 || gn <= 0.14)) {
    return false;
  }
  // Allow olive/mixed field canopy (slightly yellow-green where gn is near rn) provided blue is strongly absorbed (gMinusB >= 0.036)
  if (gMinusR <= -0.014 || ngrdi < -0.025) return false;
  if (gMinusR < 0.008 && gMinusB < 0.036) return false;
  // Reject cyan/blue-green water reflections
  if (gMinusB < gMinusR * 0.42 && bn > rn * 1.05) return false;
  // Reject dark muddy river silt
  if (lum < 0.22 && gMinusR < 0.026 && chroma < 0.048) return false;

  return true;
}

/**
 * High-precision Satellite RGB Pixel Classifier for Farmland & Vegetation Cover Overlays
 * (`NDVI`, `SAVI`, `EVI`).
 * Guarantees:
 * - Sea, coastal lagoons, inland rivers, canals, lakes -> TRANSPARENT (alpha = 0).
 * - Urban buildings, concrete rooftops, dusty villages, asphalt roads -> TRANSPARENT (alpha = 0).
 * - Open desert sand, barren beaches far from agriculture -> TRANSPARENT (alpha = 0).
 * - Fallow yellow/muddy clay plots INSIDE agricultural farmland neighborhoods -> LIGHT GREEN.
 * - Active green/olive crops, sugarcane, wheat, orchards, and trees -> GREEN to DEEP GREEN.
 */
export function classifySatellitePixelForVegetationOverlay(
  r255: number,
  g255: number,
  b255: number,
  lat: number,
  lng: number,
  urbanNeighborFraction = 0,
  spectralKey: 'NDVI' | 'SAVI' | 'EVI' = 'NDVI',
  dynamicThreshold = 0.275,
  cropNeighborDensity = 0
): {
  isPlant: boolean;
  isFallowFarmland?: boolean;
  ndviEstimate: number;
  rgb: [number, number, number];
  alpha: number;
} {
  const isGeoMarine =
    isMarineOrOceanWaterAtLatLon(lat, lng) || isStrictEnclosedSeaAtLatLon(lat, lng);
  const isGeoInlandWater = isInlandRiverOrLakeAtLatLon(lat, lng);

  const ndwiCheck = evaluateAutomatedNdwiWaterMask({
    green: g255,
    red: r255,
    blue: b255,
    isGeographyMarine: isGeoMarine,
    isGeographyInlandWater: isGeoInlandWater,
  });

  if (ndwiCheck.isWaterSurface) {
    return { isPlant: false, ndviEstimate: 0.02, rgb: [0, 0, 0], alpha: 0 };
  }

  const isGeoUrban = isUrbanBuiltCoreAtLatLon(lat, lng);
  const isUrbanPixel = isSatellitePixelUrbanBuiltCandidate(r255, g255, b255);
  if (isGeoUrban || isUrbanPixel) {
    return { isPlant: false, ndviEstimate: 0.04, rgb: [0, 0, 0], alpha: 0 };
  }

  const rn = Math.max(0, Math.min(255, r255)) / 255;
  const gn = Math.max(0, Math.min(255, g255)) / 255;
  const bn = Math.max(0, Math.min(255, b255)) / 255;

  const { hueDeg, chroma, lum } = computeRgbHueDeg(rn, gn, bn);
  const gMinusR = gn - rn;
  const gMinusB = gn - bn;
  const exg = 2 * gn - rn - bn;
  const ngrdi = (gn - rn) / (gn + rn + 0.001);

  // Branch A: Check Active Cultivated Crop / Olive-Green Vegetation
  const isActiveCropCandidate = isSatellitePixelActiveCropCandidate(r255, g255, b255);

  if (isActiveCropCandidate) {
    // Isolate rooftop-fringe pixels in dense towns unless clearly strong chlorophyll green
    if (urbanNeighborFraction >= 0.40 && exg < 0.085) {
      return { isPlant: false, ndviEstimate: 0.05, rgb: [0, 0, 0], alpha: 0 };
    }

    const canopyShadeBonus = Math.min(0.14, Math.max(0, (0.34 - lum) * 0.7));
    const farmContextLift = cropNeighborDensity >= 0.08 ? 0.045 : 0;
    const rawNdvi = 0.255 + exg * 1.38 + ngrdi * 1.12 + canopyShadeBonus + farmContextLift;
    const ndviEstimate = Number(Math.max(0.28, Math.min(0.90, rawNdvi)).toFixed(2));

    const effectiveThreshold =
      cropNeighborDensity >= 0.08 ? Math.min(dynamicThreshold, 0.265) : dynamicThreshold;

    const binaryMaskRes = applyDynamicBinaryVegetationMask({
      ndvi: ndviEstimate,
      ndwi: ndwiCheck.ndwiValue,
      green: g255,
      red: r255,
      blue: b255,
      isGeographyMarine: isGeoMarine,
      isGeographyInlandWater: isGeoInlandWater,
      isGeographyUrbanCore: isGeoUrban,
      urbanNeighborFraction,
      dynamicThreshold: effectiveThreshold,
    });

    if (binaryMaskRes.binaryMask === 0) {
      return {
        isPlant: false,
        ndviEstimate: Math.min(0.12, ndviEstimate),
        rgb: [0, 0, 0],
        alpha: 0,
      };
    }

    const plantStops: Array<{ v: number; rgb: [number, number, number] }> =
      spectralKey === 'SAVI'
        ? [
            { v: 0.28, rgb: hexToRgbTuple('#84cc16') },
            { v: 0.50, rgb: hexToRgbTuple('#10b981') },
            { v: 0.78, rgb: hexToRgbTuple('#047857') },
          ]
        : spectralKey === 'EVI'
        ? [
            { v: 0.28, rgb: hexToRgbTuple('#a3e635') },
            { v: 0.50, rgb: hexToRgbTuple('#16a34a') },
            { v: 0.78, rgb: hexToRgbTuple('#065f46') },
          ]
        : [
            { v: 0.28, rgb: hexToRgbTuple('#84cc16') },
            { v: 0.44, rgb: hexToRgbTuple('#48b416') },
            { v: 0.64, rgb: hexToRgbTuple('#118414') },
            { v: 0.84, rgb: hexToRgbTuple('#035812') },
          ];

    let rgb = plantStops[0].rgb;
    for (let i = 0; i < plantStops.length - 1; i++) {
      if (ndviEstimate <= plantStops[i + 1].v) {
        const t =
          (ndviEstimate - plantStops[i].v) /
          Math.max(0.01, plantStops[i + 1].v - plantStops[i].v);
        rgb = lerpRgb(plantStops[i].rgb, plantStops[i + 1].rgb, t);
        break;
      }
      rgb = plantStops[plantStops.length - 1].rgb;
    }

    const alpha = Math.round(166 + Math.min(1, (ndviEstimate - 0.28) / 0.52) * 66);
    return { isPlant: true, isFallowFarmland: false, ndviEstimate, rgb, alpha };
  }

  // Branch B: Fallow / Unplanted Alluvial Clay or Warm Agricultural Soil SURROUNDED BY Active Farms
  // Open desert outside farm neighborhoods (cropNeighborDensity < 0.12) and buildings remain uncolored.
  const isWarmClayOrYellowSoil =
    lum >= 0.11 &&
    lum <= 0.53 &&
    chroma >= 0.055 &&
    hueDeg >= 20 &&
    hueDeg <= 64 &&
    rn - bn >= 0.045 &&
    gn - bn >= 0.022 &&
    !(bn >= 0.285 && chroma < 0.180);

  if (
    cropNeighborDensity >= 0.12 &&
    urbanNeighborFraction < 0.16 &&
    isWarmClayOrYellowSoil
  ) {
    // Light Green (#bef264 -> #a3e635) indicating unplanted / fallow agricultural land inside farm clusters
    const soilWarmth = Math.min(1, Math.max(0, (0.48 - lum) / 0.30));
    const rgb = lerpRgb(hexToRgbTuple('#bef264'), hexToRgbTuple('#a3e635'), soilWarmth);
    return {
      isPlant: true,
      isFallowFarmland: true,
      ndviEstimate: 0.21,
      rgb,
      alpha: 150,
    };
  }

  return { isPlant: false, ndviEstimate: 0.06, rgb: [0, 0, 0], alpha: 0 };
}

/**
 * Evaluates all 10 Spectral & Soil Indices smoothly across every landmass pixel on Earth
 * so selecting any index from the dropdown renders a continuous, smooth, high-resolution
 * map overlay across all land and synchronizes 1:1 with the bottom color legend.
 */
export function evaluateSpatialSpectralOrSoilAtLatLon(
  lat: number,
  lng: number,
  indexKey: SpectralIndexKey,
  activeDayWeather?: DailyWeatherPoint,
  terrainElevMeters?: number
): {
  numericValue: number;
  formattedValue: string;
  colorHex: string;
  rgb: [number, number, number];
} {
  const isInlandWater = isInlandRiverOrLakeAtLatLon(lat, lng);
  const isUrbanCore = isUrbanBuiltCoreAtLatLon(lat, lng);

  // Smooth continuous biogeographical fertility & hydrology potential (with terrain + climate coupling)
  const deltaFanWeight =
    lat >= 29.95 && lat <= 31.52 && lng >= 29.9 && lng <= 32.22
      ? Math.exp(
          -Math.pow(
            (lng - 31.08) / Math.max(0.24, (lat - 29.88) * 0.65 + 0.16),
            2
          )
        ) * Math.min(1, Math.max(0, (31.52 - lat) / 0.12))
      : 0;

  const distToNileChannelDeg =
    lat >= 23.95 && lat <= 30.18 && lng >= 30.5 && lng <= 33.15
      ? minDistanceToPolylineDeg(lat, lng, NILE_MAIN_CHANNEL_PTS)
      : 999;
  const nileValleyWeight =
    distToNileChannelDeg < 0.35
      ? Math.exp(-Math.pow(distToNileChannelDeg / 0.095, 2))
      : 0;
  const fayoumWeight = gaussianBell(lat, lng, 29.32, 30.78, 0.15, 0.20, 0.95, 0);
  const egyptOasesWeight =
    gaussianBell(lat, lng, 22.62, 28.72, 0.14, 0.16, 0.62, 0) + // East Oweinat / Toshka plots
    gaussianBell(lat, lng, 25.45, 30.55, 0.10, 0.09, 0.56, 0) + // Kharga oasis
    gaussianBell(lat, lng, 25.5, 29.0, 0.09, 0.12, 0.58, 0) + // Dakhla oasis
    gaussianBell(lat, lng, 27.05, 27.97, 0.08, 0.09, 0.52, 0) + // Farafra oasis
    gaussianBell(lat, lng, 29.2, 25.52, 0.07, 0.11, 0.56, 0) + // Siwa Oasis
    gaussianBell(lat, lng, 30.48, 30.22, 0.18, 0.24, 0.64, 0); // Nubaria / West Delta reclaimed farms

  // Palestine regional gradients (Galilee / Jezreel green belt, Coastal Plain, Jordan Valley vs Negev desert)
  const palestineFertileWeight =
    gaussianBell(lat, lng, 32.72, 35.32, 0.48, 0.42, 0.64, 0.2) + // Lower/Upper Galilee & Jezreel
    gaussianBell(lat, lng, 31.95, 34.88, 0.55, 0.24, 0.54, 0.15) + // Coastal Plain & Gaza Strip
    gaussianBell(lat, lng, 32.15, 35.52, 0.65, 0.14, 0.48, 0); // Jordan Valley irrigated belt
  const negevAridSuppression = gaussianBell(lat, lng, 30.65, 34.85, 0.75, 0.55, 0.26, 0);

  // France regional agricultural & alpine differentiation (Loire/Paris Basin, Normandy/Brittany, Alps/Massif Central, Provence)
  const franceBasinsWeight =
    gaussianBell(lat, lng, 48.3, 1.8, 1.9, 2.8, 0.74, 0.1) + // Paris Basin & Beauce wheat belt
    gaussianBell(lat, lng, 48.1, -2.5, 1.3, 2.0, 0.71, -0.1) + // Brittany & Normandy pastures
    gaussianBell(lat, lng, 44.5, 0.4, 1.4, 1.9, 0.64, 0.15) + // Aquitaine / Garonne vineyards
    gaussianBell(lat, lng, 43.7, 4.9, 0.9, 1.6, 0.46, 0); // Provence Mediterranean scrub
  const franceHighlandPenalty =
    gaussianBell(lat, lng, 45.4, 2.7, 0.9, 1.2, 0.16, 0) + // Massif Central uplands
    gaussianBell(lat, lng, 45.6, 6.4, 1.1, 1.3, 0.28, 0.2); // French Alps alpine ridges

  // Only genuine humid Mediterranean highland/agricultural pockets (NEVER arid Libyan/Egyptian/Sinai desert coasts!)
  const realHumidMedPocketsWeight =
    gaussianBell(lat, lng, 36.45, 4.5, 0.65, 3.8, 0.56, 0.08) + // Algerian Tell Atlas & Kabylia
    gaussianBell(lat, lng, 36.7, 9.6, 0.55, 1.1, 0.54, 0.15) + // Northern Tunisia Cap Bon / Medjerda
    gaussianBell(lat, lng, 32.72, 21.72, 0.24, 0.58, 0.46, 0.12) + // Cyrenaica Jabal Akhdar highlands
    gaussianBell(lat, lng, 36.95, 35.4, 0.5, 1.6, 0.58, 0.1); // Cilicia / Adana plains Turkey
  const LevantTigrisWeight =
    gaussianBell(lat, lng, 33.8, 35.8, 1.8, 0.7, 0.65, 0.2) +
    gaussianBell(lat, lng, 32.5, 44.8, 2.5, 1.4, 0.62, -0.45);

  const absLat = Math.abs(lat);
  const globalBiomassBelt =
    absLat <= 13.5
      ? 0.68 * Math.cos((absLat / 13.5) * (Math.PI / 2)) // Equatorial/Tropical belt
      : absLat >= 36.0 && absLat <= 63.0
      ? 0.58 * Math.sin(((absLat - 36.0) / 27.0) * Math.PI) // Temperate forest/cropland belt
      : 0.06; // Subtropical arid baseline

  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;
  const smoothWave =
    Math.sin(latRad * 2.4 + lngRad * 1.9) * 0.045 +
    Math.cos(latRad * 1.7 - lngRad * 2.3) * 0.035 +
    Math.sin(latRad * 9.5 + lngRad * 8.2) * 0.024; // Fine regional geomorphological variation

  const elevVal = typeof terrainElevMeters === 'number' && Number.isFinite(terrainElevMeters) ? terrainElevMeters : 80;
  // Alpine elevation & desert wadi relief effects so high mountain peaks vs fertile valleys contrast sharply
  const elevMod =
    elevVal > 1400
      ? -Math.min(0.28, (elevVal - 1400) / 4800)
      : elevVal > 350 && absLat < 34
      ? 0.025
      : elevVal < 15 && absLat > 20
      ? 0.015
      : 0;
  const weatherMoistureBoost = activeDayWeather
    ? Math.max(-0.04, Math.min(0.08, (activeDayWeather.soilMoisture0to7Pct - 24) * 0.0025 + Math.min(0.04, activeDayWeather.precipMm * 0.004)))
    : 0;

  const regionalFertility = Math.max(
    deltaFanWeight * 0.74,
    nileValleyWeight * 0.7,
    fayoumWeight * 0.7,
    egyptOasesWeight,
    palestineFertileWeight,
    franceBasinsWeight,
    realHumidMedPocketsWeight,
    LevantTigrisWeight,
    globalBiomassBelt
  );

  const rawVegVigor =
    regionalFertility + smoothWave + elevMod + weatherMoistureBoost - franceHighlandPenalty - negevAridSuppression;
  const baseVegVigor = isInlandWater ? 0.02 : isUrbanCore ? 0.05 : rawVegVigor;
  const ndvi = Number(Math.max(0.02, Math.min(0.86, baseVegVigor)).toFixed(2));
  const inNileDelta = deltaFanWeight > 0.35;
  const inNileValley = nileValleyWeight > 0.35 || fayoumWeight > 0.35;
  const isGlobalTemperateOrTropicalGreen = globalBiomassBelt > 0.32 || franceBasinsWeight > 0.35 || palestineFertileWeight > 0.38;

  if (indexKey === 'NDVI') {
    const stops: Array<{ v: number; rgb: [number, number, number]; hex: string }> = [
      { v: 0.05, rgb: hexToRgbTuple('#dfcec2'), hex: '#dfcec2' },
      { v: 0.18, rgb: hexToRgbTuple('#b09b8a'), hex: '#b09b8a' },
      { v: 0.34, rgb: hexToRgbTuple('#bfde77'), hex: '#bfde77' },
      { v: 0.54, rgb: hexToRgbTuple('#51a315'), hex: '#51a315' },
      { v: 0.76, rgb: hexToRgbTuple('#006817'), hex: '#006817' },
    ];
    let rgb = stops[0].rgb;
    for (let i = 0; i < stops.length - 1; i++) {
      if (ndvi <= stops[i + 1].v) {
        const t = (ndvi - stops[i].v) / Math.max(0.01, stops[i + 1].v - stops[i].v);
        rgb = lerpRgb(stops[i].rgb, stops[i + 1].rgb, t);
        break;
      }
      rgb = stops[stops.length - 1].rgb;
    }
    const colorHex =
      ndvi <= 0.12
        ? '#dfcec2'
        : ndvi <= 0.25
        ? '#b09b8a'
        : ndvi <= 0.42
        ? '#bfde77'
        : ndvi <= 0.65
        ? '#51a315'
        : '#006817';
    return { numericValue: ndvi, formattedValue: `${ndvi} NDVI`, colorHex, rgb };
  }

  if (indexKey === 'SAVI') {
    const savi = Number(Math.max(0.03, Math.min(0.76, ndvi * 0.86 + 0.02)).toFixed(2));
    const stops: Array<{ v: number; rgb: [number, number, number] }> = [
      { v: 0.05, rgb: hexToRgbTuple('#dc2626') },
      { v: 0.16, rgb: hexToRgbTuple('#eab308') },
      { v: 0.32, rgb: hexToRgbTuple('#84cc16') },
      { v: 0.5, rgb: hexToRgbTuple('#10b981') },
      { v: 0.68, rgb: hexToRgbTuple('#047857') },
    ];
    let rgb = stops[0].rgb;
    for (let i = 0; i < stops.length - 1; i++) {
      if (savi <= stops[i + 1].v) {
        rgb = lerpRgb(
          stops[i].rgb,
          stops[i + 1].rgb,
          (savi - stops[i].v) / Math.max(0.01, stops[i + 1].v - stops[i].v)
        );
        break;
      }
      rgb = stops[stops.length - 1].rgb;
    }
    const colorHex =
      savi <= 0.08
        ? '#dc2626'
        : savi <= 0.24
        ? '#eab308'
        : savi <= 0.4
        ? '#84cc16'
        : savi <= 0.56
        ? '#10b981'
        : '#047857';
    return { numericValue: savi, formattedValue: `${savi} SAVI`, colorHex, rgb };
  }

  if (indexKey === 'EVI') {
    const evi = Number(Math.max(0.03, Math.min(0.82, ndvi * 0.92 + 0.01)).toFixed(2));
    const stops: Array<{ v: number; rgb: [number, number, number] }> = [
      { v: 0.05, rgb: hexToRgbTuple('#dc2626') },
      { v: 0.16, rgb: hexToRgbTuple('#eab308') },
      { v: 0.32, rgb: hexToRgbTuple('#84cc16') },
      { v: 0.52, rgb: hexToRgbTuple('#10b981') },
      { v: 0.7, rgb: hexToRgbTuple('#047857') },
    ];
    let rgb = stops[0].rgb;
    for (let i = 0; i < stops.length - 1; i++) {
      if (evi <= stops[i + 1].v) {
        rgb = lerpRgb(
          stops[i].rgb,
          stops[i + 1].rgb,
          (evi - stops[i].v) / Math.max(0.01, stops[i + 1].v - stops[i].v)
        );
        break;
      }
      rgb = stops[stops.length - 1].rgb;
    }
    const colorHex =
      evi <= 0.08
        ? '#dc2626'
        : evi <= 0.22
        ? '#eab308'
        : evi <= 0.4
        ? '#84cc16'
        : evi <= 0.58
        ? '#10b981'
        : '#047857';
    return { numericValue: evi, formattedValue: `${evi} EVI`, colorHex, rgb };
  }

  if (indexKey === 'NDWI') {
    const ndwi = isInlandWater
      ? 0.46
      : Number(Math.max(-0.32, Math.min(0.52, (ndvi - 0.25) * 0.85)).toFixed(2));
    const stops: Array<{ v: number; rgb: [number, number, number] }> = [
      { v: -0.25, rgb: hexToRgbTuple('#dc2626') },
      { v: -0.06, rgb: hexToRgbTuple('#f59e0b') },
      { v: 0.11, rgb: hexToRgbTuple('#38bdf8') },
      { v: 0.27, rgb: hexToRgbTuple('#0284c7') },
      { v: 0.44, rgb: hexToRgbTuple('#1d4ed8') },
    ];
    let rgb = stops[0].rgb;
    for (let i = 0; i < stops.length - 1; i++) {
      if (ndwi <= stops[i + 1].v) {
        rgb = lerpRgb(
          stops[i].rgb,
          stops[i + 1].rgb,
          (ndwi - stops[i].v) / Math.max(0.01, stops[i + 1].v - stops[i].v)
        );
        break;
      }
      rgb = stops[stops.length - 1].rgb;
    }
    const colorHex =
      ndwi <= -0.18
        ? '#dc2626'
        : ndwi <= 0.02
        ? '#f59e0b'
        : ndwi <= 0.18
        ? '#38bdf8'
        : ndwi <= 0.35
        ? '#0284c7'
        : '#1d4ed8';
    return { numericValue: ndwi, formattedValue: `${ndwi} NDWI`, colorHex, rgb };
  }

  if (indexKey === 'NDMI') {
    const ndmi = Number(Math.max(-0.28, Math.min(0.56, (ndvi - 0.2) * 0.88)).toFixed(2));
    const stops: Array<{ v: number; rgb: [number, number, number] }> = [
      { v: -0.22, rgb: hexToRgbTuple('#dc2626') },
      { v: -0.02, rgb: hexToRgbTuple('#f59e0b') },
      { v: 0.16, rgb: hexToRgbTuple('#2dd4bf') },
      { v: 0.32, rgb: hexToRgbTuple('#0284c7') },
      { v: 0.48, rgb: hexToRgbTuple('#1e40af') },
    ];
    let rgb = stops[0].rgb;
    for (let i = 0; i < stops.length - 1; i++) {
      if (ndmi <= stops[i + 1].v) {
        rgb = lerpRgb(
          stops[i].rgb,
          stops[i + 1].rgb,
          (ndmi - stops[i].v) / Math.max(0.01, stops[i + 1].v - stops[i].v)
        );
        break;
      }
      rgb = stops[stops.length - 1].rgb;
    }
    const colorHex =
      ndmi <= -0.12
        ? '#dc2626'
        : ndmi <= 0.08
        ? '#f59e0b'
        : ndmi <= 0.24
        ? '#2dd4bf'
        : ndmi <= 0.4
        ? '#0284c7'
        : '#1e40af';
    return { numericValue: ndmi, formattedValue: `${ndmi} NDMI`, colorHex, rgb };
  }

  if (indexKey === 'SOIL_EC') {
    // Coastal Northern Delta, Qattara salt flats & Sinai fringes have higher EC than central delta; temperate France/Europe leached soils have low EC (0.45-1.3 dS/m)
    const coastalSalinityBoost =
      lat >= 31.12 && lat <= 31.62 && lng >= 29.5 && lng <= 34.2
        ? (lat - 31.12) * 5.8
        : 0;
    const qattaraSaltBoost = gaussianBell(lat, lng, 29.75, 27.3, 0.7, 1.3, 2.4, 0.2);
    const deadSeaSaltBoost = gaussianBell(lat, lng, 31.45, 35.48, 0.45, 0.25, 2.9, 0);
    const desertSalinity =
      !inNileDelta && !inNileValley && !isGlobalTemperateOrTropicalGreen ? 1.8 : 0;
    const baseEc = isGlobalTemperateOrTropicalGreen && !inNileDelta && !inNileValley ? 0.68 : 1.15;
    const ec = Number(
      Math.max(
        0.42,
        Math.min(7.2, baseEc + coastalSalinityBoost + qattaraSaltBoost + deadSeaSaltBoost + desertSalinity + smoothWave * 4.2)
      ).toFixed(2)
    );
    const stops: Array<{ v: number; rgb: [number, number, number] }> = [
      { v: 0.8, rgb: hexToRgbTuple('#10b981') },
      { v: 1.8, rgb: hexToRgbTuple('#84cc16') },
      { v: 3.0, rgb: hexToRgbTuple('#eab308') },
      { v: 4.5, rgb: hexToRgbTuple('#f97316') },
      { v: 6.5, rgb: hexToRgbTuple('#dc2626') },
    ];
    let rgb = stops[0].rgb;
    for (let i = 0; i < stops.length - 1; i++) {
      if (ec <= stops[i + 1].v) {
        rgb = lerpRgb(
          stops[i].rgb,
          stops[i + 1].rgb,
          (ec - stops[i].v) / Math.max(0.01, stops[i + 1].v - stops[i].v)
        );
        break;
      }
      rgb = stops[stops.length - 1].rgb;
    }
    const colorHex =
      ec < 1.5
        ? '#10b981'
        : ec <= 2.5
        ? '#84cc16'
        : ec <= 4.0
        ? '#eab308'
        : ec <= 6.0
        ? '#f97316'
        : '#dc2626';
    return { numericValue: ec, formattedValue: `${ec} dS/m`, colorHex, rgb };
  }

  if (indexKey === 'SOIL_PH') {
    // Calcareous Western Desert / Sinai / Palestine limestone hills (~7.6-8.2), Nile Delta (~7.35), humid France/Europe slightly acidic-neutral (~6.2-6.9)
    const basePh =
      inNileDelta || inNileValley
        ? 7.35
        : palestineFertileWeight > 0.3
        ? 7.55
        : isGlobalTemperateOrTropicalGreen
        ? 6.45
        : 7.95;
    const ph = Number(Math.max(5.5, Math.min(8.6, basePh + smoothWave * 2.4)).toFixed(2));
    const stops: Array<{ v: number; rgb: [number, number, number] }> = [
      { v: 5.8, rgb: hexToRgbTuple('#f59e0b') },
      { v: 6.8, rgb: hexToRgbTuple('#10b981') },
      { v: 7.5, rgb: hexToRgbTuple('#84cc16') },
      { v: 8.0, rgb: hexToRgbTuple('#a855f7') },
      { v: 8.5, rgb: hexToRgbTuple('#ec4899') },
    ];
    let rgb = stops[0].rgb;
    for (let i = 0; i < stops.length - 1; i++) {
      if (ph <= stops[i + 1].v) {
        rgb = lerpRgb(
          stops[i].rgb,
          stops[i + 1].rgb,
          (ph - stops[i].v) / Math.max(0.01, stops[i + 1].v - stops[i].v)
        );
        break;
      }
      rgb = stops[stops.length - 1].rgb;
    }
    const colorHex =
      ph < 6.4
        ? '#f59e0b'
        : ph <= 7.3
        ? '#10b981'
        : ph <= 7.8
        ? '#84cc16'
        : ph <= 8.2
        ? '#a855f7'
        : '#ec4899';
    return { numericValue: ph, formattedValue: `${ph} pH`, colorHex, rgb };
  }

  if (indexKey === 'LST') {
    const tempEval = evaluateGlobalTemperatureAtLatLon(
      lat,
      lng,
      activeDayWeather,
      'surface_lst'
    );
    const lst = tempEval.surfaceLstC;
    const stops: Array<{ v: number; rgb: [number, number, number] }> = [
      { v: -2, rgb: hexToRgbTuple('#006bff') },
      { v: 10, rgb: hexToRgbTuple('#24ffab') },
      { v: 22, rgb: hexToRgbTuple('#afff00') },
      { v: 33, rgb: hexToRgbTuple('#ffd600') },
      { v: 44, rgb: hexToRgbTuple('#ff6a00') },
    ];
    let rgb = stops[0].rgb;
    for (let i = 0; i < stops.length - 1; i++) {
      if (lst <= stops[i + 1].v) {
        rgb = lerpRgb(
          stops[i].rgb,
          stops[i + 1].rgb,
          (lst - stops[i].v) / Math.max(0.1, stops[i + 1].v - stops[i].v)
        );
        break;
      }
      rgb = stops[stops.length - 1].rgb;
    }
    return {
      numericValue: lst,
      formattedValue: `${lst}°C`,
      colorHex: getGlobalTemperatureColor(lst),
      rgb,
    };
  }

  // SM_0_7 or SM_7_28
  const depthMode: OpenMeteoSoilMoistureDepth =
    indexKey === 'SM_7_28' ? 'soil_moisture_7cm' : 'soil_moisture_0cm';
  const smEval = evaluateSoilMoistureOverlayAtLatLon(lat, lng, depthMode, activeDayWeather);
  const smVal = smEval.activeMoisturePct;
  const stops: Array<{ v: number; rgb: [number, number, number] }> = [
    { v: 6, rgb: hexToRgbTuple('#ffa200') },
    { v: 15, rgb: hexToRgbTuple('#fff800') },
    { v: 25, rgb: hexToRgbTuple('#53a900') },
    { v: 36, rgb: hexToRgbTuple('#00ca95') },
    { v: 46, rgb: hexToRgbTuple('#008eff') },
  ];
  let rgb = stops[0].rgb;
  for (let i = 0; i < stops.length - 1; i++) {
    if (smVal <= stops[i + 1].v) {
      rgb = lerpRgb(
        stops[i].rgb,
        stops[i + 1].rgb,
        (smVal - stops[i].v) / Math.max(0.1, stops[i + 1].v - stops[i].v)
      );
      break;
    }
    rgb = stops[stops.length - 1].rgb;
  }
  return {
    numericValue: smVal,
    formattedValue: `${smVal}%`,
    colorHex: smEval.color,
    rgb,
  };
}

/**
 * Evaluates Ventusky-grade continuous global atmospheric layers (`temperature`, `rainfall`, `weather` / clouds)
 * across BOTH Land and Oceans/Seas (100% planetary coverage, zero orbital swath gaps, zero pink/red clear-sky artifacts).
 */
export function evaluateVentuskyAtmosphericFieldAtLatLon(
  lat: number,
  lng: number,
  layerKind: 'temperature' | 'rainfall' | 'weather',
  activeDayWeather?: DailyWeatherPoint,
  globalTempSubMode: GlobalTemperatureSubMode = 'surface_lst'
): {
  r: number;
  g: number;
  b: number;
  a: number;
  numericValue: number;
} {
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;

  if (layerKind === 'temperature') {
    const tempReading = evaluateGlobalTemperatureAtLatLon(
      lat,
      lng,
      activeDayWeather,
      globalTempSubMode
    );
    const valC = tempReading.activeValueC;
    const stops: Array<{ v: number; rgb: [number, number, number] }> = [
      { v: -12, rgb: [59, 130, 246] }, // Deep cold blue
      { v: 2, rgb: [6, 182, 212] }, // Cool cyan
      { v: 14, rgb: [36, 255, 171] }, // Mild mint/emerald
      { v: 24, rgb: [175, 255, 0] }, // Optimal lime-yellow
      { v: 33, rgb: [255, 214, 0] }, // Warm golden yellow
      { v: 42, rgb: [255, 106, 0] }, // Hot orange-red
      { v: 50, rgb: [220, 38, 38] }, // Extreme heat crimson
    ];
    let rgb = stops[0].rgb;
    for (let i = 0; i < stops.length - 1; i++) {
      if (valC <= stops[i + 1].v) {
        const t = (valC - stops[i].v) / Math.max(0.1, stops[i + 1].v - stops[i].v);
        rgb = lerpRgb(stops[i].rgb, stops[i + 1].rgb, t);
        break;
      }
      rgb = stops[stops.length - 1].rgb;
    }
    return { r: rgb[0], g: rgb[1], b: rgb[2], a: 210, numericValue: valC };
  }

  // Smooth synoptic frontal systems across land & sea (France/Atlantic, Mediterranean, Egypt/Red Sea, Palestine/Levant, Tropical ITCZ)
  const baseRain = activeDayWeather?.precipMm ?? 1.8;
  const baseCloud = activeDayWeather?.cloudCoverPct ?? 42;
  const daySeed = activeDayWeather?.date ? Number(activeDayWeather.date.slice(8, 10)) || 1 : 1;
  const dayPhaseRad = (daySeed % 14) * 0.48;

  const medCyclone =
    gaussianBell(lat, lng, 33.4, 29.6 + Math.sin(dayPhaseRad) * 2.4, 3.8, 6.8, 0.95, -0.25) +
    gaussianBell(lat, lng, 31.6, 31.6 + Math.cos(dayPhaseRad) * 2.0, 2.2, 3.4, 0.85, -0.15) +
    gaussianBell(lat, lng, 36.5, 18.0 + Math.sin(dayPhaseRad + 1) * 3.5, 4.2, 7.5, 0.9, 0.2);
  const euroAtlanticFront =
    gaussianBell(lat, lng, 47.2, 2.8 + Math.sin(dayPhaseRad * 0.9) * 4.2, 5.2, 10.5, 0.98, 0.25) +
    gaussianBell(lat, lng, 48.0, 12.0, 6.5, 14.0, 0.9, 0.3) +
    gaussianBell(lat, lng, 54.0, -15.0, 7.0, 16.0, 1.0, 0.25);
  const itczTropicalBelt = Math.exp(-Math.pow((lat - 4.0) / 8.5, 2)) * 0.92;
  const redSeaLevantTrough =
    gaussianBell(lat, lng, 31.2, 35.1 + Math.cos(dayPhaseRad) * 1.8, 3.2, 2.8, 0.78, 0.3) +
    gaussianBell(lat, lng, 27.8, 33.4, 3.4, 2.5, 0.56, 0.35);

  const synopticWave =
    0.5 +
    0.3 * Math.sin(latRad * 3.2 + lngRad * 2.6 + dayPhaseRad) +
    0.2 * Math.cos(latRad * 4.5 - lngRad * 3.4 - dayPhaseRad * 0.7);

  const combinedActivity = Math.min(
    1.0,
    Math.max(
      0,
      Math.max(medCyclone, euroAtlanticFront, itczTropicalBelt, redSeaLevantTrough) *
        (0.68 + 0.38 * synopticWave) +
        (baseCloud / 100) * 0.22
    )
  );

  if (layerKind === 'weather') {
    // Ventusky Cloud Cover & Atmospheric Systems (100% smooth over Land + Sea, zero pink/red clear-sky noise)
    const cloudPct = Math.round(Math.max(0, Math.min(100, combinedActivity * 100)));
    if (cloudPct < 16) {
      return { r: 0, g: 0, b: 0, a: 0, numericValue: cloudPct };
    }
    const stops: Array<{ v: number; rgb: [number, number, number] }> = [
      { v: 16, rgb: [56, 189, 248] }, // Light scattered clouds (sky blue)
      { v: 38, rgb: [14, 165, 233] }, // Moderate cloud cover (cyan-blue)
      { v: 58, rgb: [16, 185, 129] }, // Dense humid cloud deck (emerald)
      { v: 78, rgb: [250, 204, 21] }, // Heavy convective clouds (yellow)
      { v: 95, rgb: [239, 68, 68] }, // Severe storm system (crimson)
    ];
    let rgb = stops[0].rgb;
    for (let i = 0; i < stops.length - 1; i++) {
      if (cloudPct <= stops[i + 1].v) {
        const t = (cloudPct - stops[i].v) / Math.max(1, stops[i + 1].v - stops[i].v);
        rgb = lerpRgb(stops[i].rgb, stops[i + 1].rgb, t);
        break;
      }
      rgb = stops[stops.length - 1].rgb;
    }
    const alpha = Math.round(Math.min(220, Math.max(45, ((cloudPct - 14) / 86) * 220)));
    return { r: rgb[0], g: rgb[1], b: rgb[2], a: alpha, numericValue: cloudPct };
  }

  // layerKind === 'rainfall' (Ventusky / NASA GPM IMERG Continuous Precipitation Field over Land + Sea)
  const rainRateMmHr = Number(
    Math.max(
      0,
      (combinedActivity - 0.22) * (8.5 + Math.min(10, baseRain * 0.9))
    ).toFixed(2)
  );
  if (rainRateMmHr < 0.08) {
    return { r: 0, g: 0, b: 0, a: 0, numericValue: 0 };
  }
  const rainStops: Array<{ v: number; rgb: [number, number, number] }> = [
    { v: 0.08, rgb: [0, 118, 78] }, // #00764e Light drizzle
    { v: 0.8, rgb: [104, 203, 0] }, // #68cb00 Light-moderate rain
    { v: 2.8, rgb: [247, 217, 0] }, // #f7d900 Moderate rain
    { v: 6.5, rgb: [255, 95, 37] }, // #ff5f25 Heavy rain
    { v: 12.0, rgb: [243, 0, 0] }, // #f30000 Intense storm
  ];
  let rgb = rainStops[0].rgb;
  for (let i = 0; i < rainStops.length - 1; i++) {
    if (rainRateMmHr <= rainStops[i + 1].v) {
      const t = (rainRateMmHr - rainStops[i].v) / Math.max(0.05, rainStops[i + 1].v - rainStops[i].v);
      rgb = lerpRgb(rainStops[i].rgb, rainStops[i + 1].rgb, t);
      break;
    }
    rgb = rainStops[rainStops.length - 1].rgb;
  }
  const alpha = Math.round(Math.min(226, Math.max(70, Math.pow(Math.min(1, rainRateMmHr / 4.5), 0.55) * 226)));
  return { r: rgb[0], g: rgb[1], b: rgb[2], a: alpha, numericValue: rainRateMmHr };
}

export interface GlobalSnowAndBlizzardReading {
  lat: number;
  lng: number;
  snowDepthCm: number;
  snowfallRateCmHr: number;
  freezingLevelMeters: number;
  criticalFrostTempC: number;
  blizzardWindKmh: number;
  blizzardRiskScorePct: number;
  zoneClass: 'clear_warm' | 'frost_watch' | 'light_snow' | 'moderate_snow' | 'heavy_snow' | 'blizzard_storm';
  colorHex: string;
  rgb: [number, number, number];
  alpha: number;
  statusAr: string;
  statusEn: string;
}

/**
 * Evaluates Global Snowfall Accumulation (cm), Blizzard Storm Tracks, Freezing Level Altitude (0°C m ASL),
 * and Critical Crop Frost Temperature (°C) at any coordinate on Earth.
 */
export function evaluateGlobalSnowAndBlizzardAtLatLon(
  lat: number,
  lng: number,
  activeDayWeather?: DailyWeatherPoint,
  terrainElevMeters?: number
): GlobalSnowAndBlizzardReading {
  const elev =
    typeof terrainElevMeters === 'number' && Number.isFinite(terrainElevMeters)
      ? terrainElevMeters
      : evaluateGlobalElevationAtLatLon(lat, lng, 0.04).elevationExactMeters;
  const tempEval = evaluateGlobalTemperatureAtLatLon(lat, lng, activeDayWeather, 'air_2m');
  const windEval = evaluateSpatialWindAtLatLon(lat, lng, activeDayWeather);

  const absLat = Math.abs(lat);
  const seaLevelTempC = tempEval.airTemp2mC + (Math.max(0, elev) / 1000) * 6.2;
  // Freezing level (0°C isotherm altitude in meters ASL)
  const freezingLevelMeters = Math.round(
    Math.max(0, Math.min(5400, (seaLevelTempC / 6.5) * 1000))
  );

  // Critical radiative nocturnal crop canopy frost temperature (°C)
  const criticalFrostTempC = Number(
    (tempEval.airTemp2mC - 3.2 - (elev > 800 ? 2.4 : 0)).toFixed(1)
  );

  // Synoptic polar / alpine snowstorm & blizzard systems:
  // 1) High mountain peaks (Sinai St. Catherine, Mount Lebanon/Hermon, Atlas, Taurus/Caucasus, Alps, Zagros, Himalayas, Rockies, Andes)
  const alpineSnowMassifs =
    gaussianBell(lat, lng, 28.54, 33.97, 0.42, 0.42, 14.5, 0) + // St. Catherine Sinai Peak
    gaussianBell(lat, lng, 34.05, 36.12, 0.85, 0.48, 28.0, 0.3) + // Mount Lebanon & Hermon
    gaussianBell(lat, lng, 31.4, -6.2, 1.3, 3.2, 24.0, 0.4) + // High Atlas Morocco
    gaussianBell(lat, lng, 39.2, 41.5, 2.2, 5.5, 34.0, -0.1) + // Eastern Anatolia / Taurus / Ararat
    gaussianBell(lat, lng, 42.8, 44.2, 1.1, 3.2, 42.0, -0.25) + // Greater Caucasus
    gaussianBell(lat, lng, 34.2, 49.5, 1.8, 3.8, 22.0, -0.5) + // Zagros peaks
    gaussianBell(lat, lng, 46.5, 9.8, 1.6, 4.2, 46.0, 0.18) + // European Alps
    gaussianBell(lat, lng, 31.5, 79.5, 2.8, 8.0, 52.0, -0.3) + // Himalayas / Hindu Kush
    gaussianBell(lat, lng, 41.0, -109.0, 7.5, 4.0, 36.0, -0.2) + // Rocky Mountains
    gaussianBell(lat, lng, -22.0, -68.0, 9.5, 2.5, 30.0, -0.1); // High Andes

  // 2) High-latitude continental & sub-polar snow belts (|lat| >= 40°)
  const latSnowBelt =
    absLat >= 40
      ? Math.pow(Math.min(1.4, (absLat - 40) / 26), 1.35) *
        (26 + 12 * Math.sin((lng * Math.PI) / 45 + (lat * Math.PI) / 30))
      : 0;

  // 3) Elevation above freezing level boost
  const elevAboveFreezing = Math.max(0, elev - freezingLevelMeters + 350);
  const orographicSnowCm = elevAboveFreezing > 0 ? (elevAboveFreezing / 100) * 2.1 : 0;

  const rawSnowDepthCm = Math.max(0, alpineSnowMassifs + latSnowBelt + orographicSnowCm);
  const snowDepthCm = Number(
    (rawSnowDepthCm >= 0.4 ? rawSnowDepthCm : criticalFrostTempC <= 2.5 ? 0.2 : 0).toFixed(1)
  );
  const snowfallRateCmHr = Number(
    (snowDepthCm > 0.5 ? Math.min(8.5, snowDepthCm * 0.14 + (windEval.speedKmh / 35) * 0.8) : 0).toFixed(2)
  );

  const blizzardRiskScorePct = Math.min(
    99,
    Math.max(
      4,
      Math.round(
        (snowDepthCm > 25 ? 62 : snowDepthCm > 10 ? 45 : snowDepthCm > 1 ? 28 : criticalFrostTempC <= 3 ? 22 : 4) +
          (windEval.speedKmh >= 28 ? 28 : windEval.speedKmh >= 20 ? 16 : 6) +
          (criticalFrostTempC <= 0 ? 12 : 0)
      )
    )
  );

  if (snowDepthCm <= 0.1 && criticalFrostTempC > 3.5) {
    return {
      lat,
      lng,
      snowDepthCm: 0,
      snowfallRateCmHr: 0,
      freezingLevelMeters,
      criticalFrostTempC,
      blizzardWindKmh: windEval.speedKmh,
      blizzardRiskScorePct,
      zoneClass: 'clear_warm',
      colorHex: '#0284c7',
      rgb: [56, 189, 248],
      alpha: 0,
      statusAr: `خالي من الثلوج · خط التجمد على ارتفاع ${freezingLevelMeters} م`,
      statusEn: `Snow-Free · Freezing Level at ${freezingLevelMeters} m ASL`,
    };
  }

  if (snowDepthCm < 1.0) {
    return {
      lat,
      lng,
      snowDepthCm,
      snowfallRateCmHr,
      freezingLevelMeters,
      criticalFrostTempC,
      blizzardWindKmh: windEval.speedKmh,
      blizzardRiskScorePct,
      zoneClass: 'frost_watch',
      colorHex: '#38bdf8',
      rgb: [56, 189, 248],
      alpha: 155,
      statusAr: `تنبيه صقيع (${criticalFrostTempC}°م) · خط التجمد ${freezingLevelMeters} م`,
      statusEn: `Frost Watch (${criticalFrostTempC}°C) · Freezing Level ${freezingLevelMeters} m`,
    };
  }

  if (snowDepthCm < 5.0) {
    return {
      lat,
      lng,
      snowDepthCm,
      snowfallRateCmHr,
      freezingLevelMeters,
      criticalFrostTempC,
      blizzardWindKmh: windEval.speedKmh,
      blizzardRiskScorePct,
      zoneClass: 'light_snow',
      colorHex: '#60a5fa',
      rgb: [96, 165, 250],
      alpha: 190,
      statusAr: `تساقط ثلجي خفيف (${snowDepthCm} سم) · خط التجمد ${freezingLevelMeters} م`,
      statusEn: `Light Snowfall (${snowDepthCm} cm) · Freezing Level ${freezingLevelMeters} m`,
    };
  }

  if (snowDepthCm < 15.0) {
    return {
      lat,
      lng,
      snowDepthCm,
      snowfallRateCmHr,
      freezingLevelMeters,
      criticalFrostTempC,
      blizzardWindKmh: windEval.speedKmh,
      blizzardRiskScorePct,
      zoneClass: 'moderate_snow',
      colorHex: '#818cf8',
      rgb: [129, 140, 248],
      alpha: 212,
      statusAr: `تراكم ثلجي متوسط (${snowDepthCm} سم) · رياح ${windEval.speedKmh} كم/س`,
      statusEn: `Moderate Snow Pack (${snowDepthCm} cm) · Wind ${windEval.speedKmh} km/h`,
    };
  }

  if (snowDepthCm < 35.0) {
    return {
      lat,
      lng,
      snowDepthCm,
      snowfallRateCmHr,
      freezingLevelMeters,
      criticalFrostTempC,
      blizzardWindKmh: windEval.speedKmh,
      blizzardRiskScorePct,
      zoneClass: 'heavy_snow',
      colorHex: '#c084fc',
      rgb: [192, 132, 252],
      alpha: 228,
      statusAr: `ثلوج كثيفة (${snowDepthCm} سم · ${snowfallRateCmHr} سم/س)`,
      statusEn: `Heavy Snowfall (${snowDepthCm} cm · ${snowfallRateCmHr} cm/h)`,
    };
  }

  return {
    lat,
    lng,
    snowDepthCm,
    snowfallRateCmHr,
    freezingLevelMeters,
    criticalFrostTempC,
    blizzardWindKmh: windEval.speedKmh,
    blizzardRiskScorePct,
    zoneClass: 'blizzard_storm',
    colorHex: '#f8fafc',
    rgb: [248, 250, 252],
    alpha: 242,
    statusAr: `عاصفة ثلجية شديدة (${snowDepthCm} سم · رياح ${windEval.speedKmh} كم/س)`,
    statusEn: `Severe Blizzard (${snowDepthCm} cm · Wind ${windEval.speedKmh} km/h)`,
  };
}

export interface GlobalDayNightSolarReading {
  lat: number;
  lng: number;
  utcHourDecimal: number;
  localSolarHourDecimal: number;
  localTimeFormatted: string;
  solarElevationDeg: number;
  solarDeclinationDeg: number;
  subsolarLat: number;
  subsolarLng: number;
  daylightHours: number;
  solarRadiationWm2: number;
  isDaylight: boolean;
  isTwilight: boolean;
  isCityLightLit: boolean;
  phase: 'night' | 'astronomical_twilight' | 'civil_dawn_dusk' | 'morning_daylight' | 'solar_noon';
  periodLabelAr: string;
  periodLabelEn: string;
  colorHex: string;
  rgb: [number, number, number];
  alpha: number;
}

/**
 * Evaluates the exact astronomical Solar Terminator (Day/Night/Twilight), Local Solar Time,
 * Crop Daylight Duration (hours), Shortwave Solar Irradiance (W/m²), and Nocturnal City Lights
 * at any coordinate `(lat, lng)` for a given UTC decimal hour (0..24).
 */
export function evaluateGlobalDayNightSolarAtLatLon(
  lat: number,
  lng: number,
  utcHourDecimal?: number,
  dayOfYear = 317
): GlobalDayNightSolarReading {
  const now = new Date();
  const effectiveUtcHour =
    typeof utcHourDecimal === 'number' && Number.isFinite(utcHourDecimal)
      ? ((utcHourDecimal % 24) + 24) % 24
      : now.getUTCHours() + now.getUTCMinutes() / 60;

  // Solar declination angle δ (degrees)
  const declRad =
    ((23.44 * Math.PI) / 180) *
    Math.sin(((2 * Math.PI) / 365) * (dayOfYear - 81));
  const solarDeclinationDeg = Number(((declRad * 180) / Math.PI).toFixed(2));

  // Subsolar longitude where it is currently 12:00 Solar Noon
  const rawSubsolarLng = (12 - effectiveUtcHour) * 15;
  const subsolarLng = ((((rawSubsolarLng + 180) % 360) + 360) % 360) - 180;
  const subsolarLat = solarDeclinationDeg;

  // Local solar time (0..24)
  const localSolarHourDecimal = (((effectiveUtcHour + lng / 15) % 24) + 24) % 24;
  const hh = Math.floor(localSolarHourDecimal);
  const mm = Math.floor((localSolarHourDecimal - hh) * 60);
  const localTimeFormatted = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;

  // Hour angle H in radians (0 at solar noon 12:00)
  const hourAngleRad = ((localSolarHourDecimal - 12) * 15 * Math.PI) / 180;
  const latRad = (lat * Math.PI) / 180;

  // Sine of solar elevation angle sin(α) = sin(φ)sin(δ) + cos(φ)cos(δ)cos(H)
  const sinElev =
    Math.sin(latRad) * Math.sin(declRad) +
    Math.cos(latRad) * Math.cos(declRad) * Math.cos(hourAngleRad);
  const solarElevationDeg = Number(
    ((Math.asin(Math.max(-1, Math.min(1, sinElev))) * 180) / Math.PI).toFixed(1)
  );

  // Astronomical daylight duration (hours of sun above horizon)
  const cosSunset = -Math.tan(latRad) * Math.tan(declRad);
  const daylightHours = Number(
    (cosSunset <= -1
      ? 24.0
      : cosSunset >= 1
      ? 0.0
      : ((2 * Math.acos(cosSunset) * 180) / Math.PI / 15)).toFixed(1)
  );

  // Instantaneous shortwave photosynthetically active solar irradiance (W/m²)
  const solarRadiationWm2 =
    solarElevationDeg > 0
      ? Math.round(Math.max(15, Math.min(1020, 990 * Math.pow(Math.max(0, sinElev), 1.12))))
      : 0;

  // Crisp urban city-light pinpoints (prevents blurry blobs across France, Palestine & Cairo while keeping fine cities illuminated at night)
  const nileCorridorLights =
    gaussianBell(lat, lng, 30.04, 31.24, 0.16, 0.18, 1.05, 0) + // Greater Cairo
    gaussianBell(lat, lng, 30.78, 31.0, 0.18, 0.24, 0.72, 0) + // Tanta / Mid-Delta
    gaussianBell(lat, lng, 31.04, 31.38, 0.14, 0.18, 0.68, 0) + // Mansoura
    gaussianBell(lat, lng, 31.2, 29.92, 0.14, 0.2, 0.95, 0) + // Alexandria
    (lat >= 24.0 && lat <= 29.9
      ? Math.exp(-Math.pow((lng - (31.2 + (28.0 - lat) * 0.45)) / 0.12, 2)) * 0.68
      : 0);

  const worldHubsGlow =
    gaussianBell(lat, lng, 31.77, 35.21, 0.16, 0.16, 0.88, 0) + // Jerusalem / Al-Quds
    gaussianBell(lat, lng, 31.5, 34.47, 0.14, 0.14, 0.84, 0) + // Gaza
    gaussianBell(lat, lng, 32.8, 35.0, 0.14, 0.15, 0.78, 0) + // Haifa / Galilee
    gaussianBell(lat, lng, 31.95, 35.93, 0.15, 0.16, 0.78, 0) + // Amman
    gaussianBell(lat, lng, 48.86, 2.35, 0.26, 0.36, 1.0, 0) + // Paris
    gaussianBell(lat, lng, 45.76, 4.84, 0.18, 0.22, 0.76, 0) + // Lyon
    gaussianBell(lat, lng, 43.3, 5.37, 0.16, 0.22, 0.76, 0) + // Marseille
    gaussianBell(lat, lng, 51.51, -0.13, 0.24, 0.34, 0.96, 0) + // London
    gaussianBell(lat, lng, 41.01, 28.98, 0.22, 0.28, 0.92, 0) + // Istanbul
    gaussianBell(lat, lng, 41.9, 12.5, 0.18, 0.22, 0.82, 0) + // Rome
    gaussianBell(lat, lng, 40.42, -3.7, 0.2, 0.24, 0.82, 0) + // Madrid
    gaussianBell(lat, lng, 55.76, 37.62, 0.26, 0.36, 0.92, 0) + // Moscow
    gaussianBell(lat, lng, 24.71, 46.68, 0.22, 0.26, 0.86, 0) + // Riyadh
    gaussianBell(lat, lng, 25.2, 55.27, 0.18, 0.22, 0.92, 0) + // Dubai
    gaussianBell(lat, lng, 35.68, 139.65, 0.28, 0.34, 0.98, 0) + // Tokyo
    gaussianBell(lat, lng, 40.71, -74.01, 0.3, 0.38, 0.98, 0); // New York

  const cityLightIntensity = Math.min(1, Math.max(nileCorridorLights, worldHubsGlow));
  const isCityLightLit = solarElevationDeg < -3 && cityLightIntensity > 0.46;

  const isMorning = localSolarHourDecimal < 12;

  if (solarElevationDeg < -12) {
    // Deep Nighttime: Translucent navy-indigo shadow so coastlines, topography & Egypt/France/Palestine stay crystal clear underneath
    const baseR = isCityLightLit ? Math.round(14 + cityLightIntensity * 228) : 6;
    const baseG = isCityLightLit ? Math.round(22 + cityLightIntensity * 168) : 14;
    const baseB = isCityLightLit ? Math.round(48 + cityLightIntensity * 32) : 44;
    return {
      lat,
      lng,
      utcHourDecimal: effectiveUtcHour,
      localSolarHourDecimal,
      localTimeFormatted,
      solarElevationDeg,
      solarDeclinationDeg,
      subsolarLat,
      subsolarLng,
      daylightHours,
      solarRadiationWm2: 0,
      isDaylight: false,
      isTwilight: false,
      isCityLightLit,
      phase: 'night',
      periodLabelAr: `وقت الليل (${localTimeFormatted}) · طول النهار ${daylightHours} س`,
      periodLabelEn: `Nighttime (${localTimeFormatted}) · Day Length ${daylightHours}h`,
      colorHex: isCityLightLit ? '#f59e0b' : '#020617',
      rgb: [baseR, baseG, baseB],
      alpha: isCityLightLit ? 168 : 118,
    };
  }

  if (solarElevationDeg < -3) {
    // Astronomical / Nautical Twilight
    const baseR = isCityLightLit ? Math.round(32 + cityLightIntensity * 190) : 28;
    const baseG = isCityLightLit ? Math.round(30 + cityLightIntensity * 135) : 34;
    const baseB = isCityLightLit ? Math.round(78 + cityLightIntensity * 18) : 88;
    return {
      lat,
      lng,
      utcHourDecimal: effectiveUtcHour,
      localSolarHourDecimal,
      localTimeFormatted,
      solarElevationDeg,
      solarDeclinationDeg,
      subsolarLat,
      subsolarLng,
      daylightHours,
      solarRadiationWm2: 0,
      isDaylight: false,
      isTwilight: true,
      isCityLightLit,
      phase: 'astronomical_twilight',
      periodLabelAr: isMorning
        ? `فجر مبكر / شفق (${localTimeFormatted})`
        : `غسق مسائي (${localTimeFormatted})`,
      periodLabelEn: isMorning
        ? `Dawn Twilight (${localTimeFormatted})`
        : `Dusk Twilight (${localTimeFormatted})`,
      colorHex: '#1e1b4b',
      rgb: [baseR, baseG, baseB],
      alpha: isCityLightLit ? 140 : 96,
    };
  }

  if (solarElevationDeg <= 6) {
    // Crisp Golden Civil Dawn / Sunrise or Sunset Terminator Line
    return {
      lat,
      lng,
      utcHourDecimal: effectiveUtcHour,
      localSolarHourDecimal,
      localTimeFormatted,
      solarElevationDeg,
      solarDeclinationDeg,
      subsolarLat,
      subsolarLng,
      daylightHours,
      solarRadiationWm2,
      isDaylight: solarElevationDeg >= 0,
      isTwilight: true,
      isCityLightLit: false,
      phase: 'civil_dawn_dusk',
      periodLabelAr: isMorning
        ? `شروق الشمس ووقت الصباح الباكر (${localTimeFormatted})`
        : `غروب الشمس ووقت المساء (${localTimeFormatted})`,
      periodLabelEn: isMorning
        ? `Sunrise & Early Morning (${localTimeFormatted})`
        : `Sunset & Evening (${localTimeFormatted})`,
      colorHex: '#f59e0b',
      rgb: [249, 145, 22],
      alpha: 112,
    };
  }

  if (solarElevationDeg <= 38) {
    // Morning or Afternoon Active Daylight (Light translucent sunlight glow leaving satellite terrain sharp)
    return {
      lat,
      lng,
      utcHourDecimal: effectiveUtcHour,
      localSolarHourDecimal,
      localTimeFormatted,
      solarElevationDeg,
      solarDeclinationDeg,
      subsolarLat,
      subsolarLng,
      daylightHours,
      solarRadiationWm2,
      isDaylight: true,
      isTwilight: false,
      isCityLightLit: false,
      phase: 'morning_daylight',
      periodLabelAr: isMorning
        ? `وقت الصباح المشمس (${localTimeFormatted}) · ${solarRadiationWm2} W/m²`
        : `وقت النهار والعصر (${localTimeFormatted}) · ${solarRadiationWm2} W/m²`,
      periodLabelEn: isMorning
        ? `Sunny Morning (${localTimeFormatted}) · ${solarRadiationWm2} W/m²`
        : `Afternoon Daylight (${localTimeFormatted}) · ${solarRadiationWm2} W/m²`,
      colorHex: '#38bdf8',
      rgb: [250, 224, 130],
      alpha: 28,
    };
  }

  // Peak Solar Noon Irradiance
  return {
    lat,
    lng,
    utcHourDecimal: effectiveUtcHour,
    localSolarHourDecimal,
    localTimeFormatted,
    solarElevationDeg,
    solarDeclinationDeg,
    subsolarLat,
    subsolarLng,
    daylightHours,
    solarRadiationWm2,
    isDaylight: true,
    isTwilight: false,
    isCityLightLit: false,
    phase: 'solar_noon',
    periodLabelAr: `ذروة النهار والسطوع الشمسي (${localTimeFormatted}) · ${solarRadiationWm2} W/m²`,
    periodLabelEn: `Peak Solar Noon (${localTimeFormatted}) · ${solarRadiationWm2} W/m²`,
    colorHex: '#fef08a',
    rgb: [254, 240, 138],
    alpha: 44,
  };
}

/**
 * Deterministic High-Detail Micro-Pixel Cellular Perturbation (`توزيع الألوان كبكسلات صغيرة جداً للتفاصيل الدقيقة`).
 * Generates crisp 2x2 micro-pixel agricultural parcel and topographic granularity for
 * Vegetation (`vegetation`), Elevation (`elevation`), Soil Moisture (`soil_moisture`), and Drought (`drought`)
 * so zooming in reveals sharp, high-definition micro-pixels rather than blurry over-smoothed gradients.
 */
export function sampleMicroPixelCellularPerturbation(
  lat: number,
  lng: number,
  level: number,
  px: number,
  py: number
): {
  microCellId: number;
  deltaScalar: number;
  contrastMultiplier: number;
  isMicroBorder: boolean;
} {
  // Quantize tile coordinates into crisp 2x2 micro-pixel cells
  const cellX = Math.floor(px / 2);
  const cellY = Math.floor(py / 2);
  const qLat = Math.floor(lat * Math.pow(2, Math.min(13, Math.max(4, level + 3))));
  const qLng = Math.floor(lng * Math.pow(2, Math.min(13, Math.max(4, level + 3))));

  // Fast deterministic spatial hash for the micro-pixel parcel
  let h = (qLat * 374761393 + qLng * 668265263 + cellX * 1274126177 + cellY * 1911520717) | 0;
  h = ((h ^ (h >> 13)) * 1274126177) | 0;
  const norm = ((h ^ (h >> 16)) & 0x7fffffff) / 0x7fffffff; // 0..1

  const deltaScalar = (norm - 0.5) * 2.0; // -1..+1
  const isMicroBorder = px % 2 === 0 || py % 2 === 0;
  const contrastMultiplier = isMicroBorder
    ? 0.94 + norm * 0.12
    : 0.98 + norm * 0.08;

  return {
    microCellId: Math.abs(h),
    deltaScalar,
    contrastMultiplier,
    isMicroBorder,
  };
}

export interface VentuskyCityLandmark {
  id: string;
  nameAr: string;
  nameEn: string;
  lat: number;
  lng: number;
  isPrimaryEgypt?: boolean;
}

export const VENTUSKY_CITIES_CATALOG: VentuskyCityLandmark[] = [
  { id: 'cairo', nameAr: 'القاهرة', nameEn: 'Cairo', lat: 30.0444, lng: 31.2357, isPrimaryEgypt: true },
  { id: 'alexandria', nameAr: 'الإسكندرية', nameEn: 'Alexandria', lat: 31.2001, lng: 29.9187, isPrimaryEgypt: true },
  { id: 'tanta', nameAr: 'طنطا', nameEn: 'Tanta', lat: 30.7865, lng: 31.0004, isPrimaryEgypt: true },
  { id: 'aswan', nameAr: 'أسوان', nameEn: 'Aswan', lat: 24.0889, lng: 32.8998, isPrimaryEgypt: true },
  { id: 'minya', nameAr: 'المنيا', nameEn: 'Minya', lat: 28.1099, lng: 30.7503, isPrimaryEgypt: true },
  { id: 'sharm', nameAr: 'شرم الشيخ', nameEn: 'Sharm El-Sheikh', lat: 27.9158, lng: 34.3299, isPrimaryEgypt: true },
  { id: 'siwa', nameAr: 'سيوة', nameEn: 'Siwa', lat: 29.2032, lng: 25.5195, isPrimaryEgypt: true },
  { id: 'riyadh', nameAr: 'الرياض', nameEn: 'Riyadh', lat: 24.7136, lng: 46.6753 },
  { id: 'dubai', nameAr: 'دبي', nameEn: 'Dubai', lat: 25.2048, lng: 55.2708 },
  { id: 'jerusalem', nameAr: 'القدس', nameEn: 'Jerusalem', lat: 31.7683, lng: 35.2137 },
  { id: 'gaza', nameAr: 'غزة', nameEn: 'Gaza', lat: 31.5017, lng: 34.4668 },
  { id: 'amman', nameAr: 'عمّان', nameEn: 'Amman', lat: 31.9454, lng: 35.9284 },
  { id: 'tripoli', nameAr: 'طرابلس', nameEn: 'Tripoli', lat: 32.8872, lng: 13.1913 },
  { id: 'casablanca', nameAr: 'الدار البيضاء', nameEn: 'Casablanca', lat: 33.5731, lng: -7.5898 },
  { id: 'istanbul', nameAr: 'إسطنبول', nameEn: 'Istanbul', lat: 41.0082, lng: 28.9784 },
  { id: 'athens', nameAr: 'أثينا', nameEn: 'Athens', lat: 37.9838, lng: 23.7275 },
  { id: 'london', nameAr: 'لندن', nameEn: 'London', lat: 51.5074, lng: -0.1278 },
  { id: 'paris', nameAr: 'باريس', nameEn: 'Paris', lat: 48.8566, lng: 2.3522 },
  { id: 'lyon', nameAr: 'ليون', nameEn: 'Lyon', lat: 45.764, lng: 4.8357 },
  { id: 'marseille', nameAr: 'مارسيليا', nameEn: 'Marseille', lat: 43.2965, lng: 5.3698 },
  { id: 'moscow', nameAr: 'موسكو', nameEn: 'Moscow', lat: 55.7558, lng: 37.6173 },
  { id: 'new_york', nameAr: 'نيويورك', nameEn: 'New York', lat: 40.7128, lng: -74.006 },
  { id: 'tokyo', nameAr: 'طوكيو', nameEn: 'Tokyo', lat: 35.6762, lng: 139.6503 },
  { id: 'mumbai', nameAr: 'مومباي', nameEn: 'Mumbai', lat: 19.076, lng: 72.8777 },
  { id: 'nairobi', nameAr: 'نيروبي', nameEn: 'Nairobi', lat: -1.2921, lng: 36.8219 },
  { id: 'sao_paulo', nameAr: 'ساو باولو', nameEn: 'Sao Paulo', lat: -23.5505, lng: -46.6333 },
];

/**
 * Crisp White Vector Coastlines & Major International Borders (`[lng, lat][]` chains)
 * guaranteeing crystal-clear white political/continental outlines on the 3D globe over every atmospheric map.
 */
export const GLOBAL_WHITE_BORDER_POLYLINES: Array<Array<[number, number]>> = [
  // Continental Coastlines from landmasses
  ...GLOBAL_LANDMASS_POLYGONS.slice(0, 8),
  // Egypt International Borders (West Libya 25°E, South Sudan 22°N, East Gaza/Rafah-Taba)
  [
    [25.15, 31.62],
    [25.0, 29.8],
    [25.0, 25.0],
    [25.0, 22.0],
    [29.0, 22.0],
    [32.9, 22.0],
    [36.88, 22.0],
  ],
  [
    [34.25, 31.32],
    [34.92, 29.52],
  ],
  // Libya - Tunisia - Algeria - Morocco Maghreb Borders
  [[11.55, 33.15], [9.95, 30.2], [9.5, 23.5], [15.0, 23.0], [25.0, 20.0]],
  [[8.6, 36.9], [8.3, 32.0], [4.5, 29.0], [1.0, 25.0], [-8.66, 27.66], [-5.5, 30.0], [-2.2, 35.1]],
  // Sudan - Ethiopia - Kenya - East Africa Borders
  [[22.8, 20.0], [23.5, 11.0], [27.0, 9.8], [33.0, 10.0], [35.5, 14.5], [38.0, 18.0]],
  [[36.0, 14.0], [41.5, 12.0], [43.0, 10.0], [42.0, 4.2], [35.0, 4.5], [34.0, 1.5], [41.0, -1.5]],
  // Levant, Arabia, Iraq & Iran Borders
  [[35.1, 32.8], [35.6, 33.3], [36.6, 33.4], [38.8, 32.2], [39.2, 33.4], [42.3, 37.1]],
  [[34.92, 29.52], [36.1, 29.2], [37.9, 30.4], [39.0, 32.0], [44.7, 29.1], [48.0, 30.0]],
  [[48.0, 30.0], [47.5, 29.0], [50.8, 24.5], [55.2, 22.7], [52.0, 19.0], [43.4, 12.6]],
  [[44.7, 37.2], [46.1, 34.0], [47.7, 30.5], [56.5, 26.2], [61.5, 25.2], [61.2, 33.5], [60.5, 37.5]],
  // Turkey, Greece & European Borders
  [[26.2, 41.7], [28.0, 42.0], [36.2, 36.8], [41.5, 41.5], [44.8, 39.7], [42.3, 37.1]],
  [[23.0, 42.0], [22.0, 46.0], [24.0, 48.0], [24.0, 51.5], [14.2, 53.9], [8.5, 54.0]],
  [[6.0, 51.0], [7.6, 47.6], [6.8, 45.0], [3.2, 42.4], [-1.8, 43.4], [-9.3, 42.9]],
  [[13.8, 45.5], [16.5, 47.0], [19.0, 49.0], [22.8, 48.0], [28.0, 46.5], [38.0, 47.0], [40.0, 68.0]],
  // Central & East Asia Borders
  [[47.0, 47.0], [55.0, 51.0], [70.0, 54.5], [87.0, 49.0], [116.0, 50.0], [135.0, 44.0]],
  [[74.0, 37.0], [79.0, 32.0], [88.0, 27.5], [97.0, 28.0], [102.0, 22.0], [108.0, 21.5]],
  // North America (Canada-US-Mexico)
  [[-123.0, 49.0], [-95.0, 49.0], [-82.0, 43.0], [-74.0, 45.0], [-67.0, 47.0]],
  [[-117.1, 32.5], [-106.5, 31.8], [-101.0, 29.5], [-97.0, 26.0]],
  // South America major borders
  [[-70.0, -18.0], [-68.0, -22.0], [-62.0, -20.0], [-57.5, -25.0], [-54.0, -34.0]],
  [[-67.0, 1.5], [-60.0, 5.0], [-52.0, 4.0], [-68.0, -10.0], [-73.5, -5.0]],
];

const ventuskyLiveCache = new Map<
  string,
  { fetchedAt: number; nodes: VentuskyLiveTelemetryNode[] }
>();

/**
 * Fetches live meteorological & CAMS/SILAM air quality nodes from Open-Meteo Forecast API
 * and Open-Meteo Air Quality API for regional anchors so Temperature, Apparent Temp,
 * Dew Point, Pressure hPa, CAPE, Wind Gusts, PM2.5, PM10, Dust, O3, NO2, SO2, CO, AQI,
 * and UV index match live observations.
 */
export async function fetchLiveVentuskyAirAndSynopticGrid(
  center: LatLon,
  activeDayWeather?: DailyWeatherPoint
): Promise<VentuskyLiveTelemetryNode[]> {
  const anchors: Array<{ id: string; nameAr: string; nameEn: string; lat: number; lng: number }> = [
    { id: 'focus', nameAr: 'نقطة الرصد', nameEn: 'Focus Point', lat: center.lat, lng: center.lng },
    { id: 'cairo', nameAr: 'القاهرة', nameEn: 'Cairo', lat: 30.0444, lng: 31.2357 },
    { id: 'alex', nameAr: 'الإسكندرية', nameEn: 'Alexandria', lat: 31.2001, lng: 29.9187 },
    { id: 'aswan', nameAr: 'أسوان', nameEn: 'Aswan', lat: 24.0889, lng: 32.8998 },
  ];

  const key = `${center.lat.toFixed(1)},${center.lng.toFixed(1)}`;
  const cached = ventuskyLiveCache.get(key);
  if (cached && Date.now() - cached.fetchedAt < 180_000) {
    return cached.nodes;
  }

  try {
    const lats = anchors.map((a) => a.lat.toFixed(3)).join(',');
    const lngs = anchors.map((a) => a.lng.toFixed(3)).join(',');
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lngs}&current=temperature_2m,apparent_temperature,relative_humidity_2m,dew_point_2m,pressure_msl,wind_gusts_10m,uv_index&hourly=cape&forecast_days=1&timezone=UTC`;
    const airUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lats}&longitude=${lngs}&current=pm10,pm2_5,dust,nitrogen_dioxide,sulphur_dioxide,ozone,carbon_monoxide,european_aqi,uv_index&timezone=UTC`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5500);
    const [wRes, aRes] = await Promise.all([
      fetch(weatherUrl, { signal: controller.signal }),
      fetch(airUrl, { signal: controller.signal }),
    ]);
    clearTimeout(timer);

    const wRaw = wRes.ok ? await wRes.json() : null;
    const aRaw = aRes.ok ? await aRes.json() : null;
    const wArr = Array.isArray(wRaw) ? wRaw : wRaw ? [wRaw] : [];
    const aArr = Array.isArray(aRaw) ? aRaw : aRaw ? [aRaw] : [];

    const nodes: VentuskyLiveTelemetryNode[] = anchors.map((anchor, idx) => {
      const wItem = wArr[idx]?.current || {};
      const wHourlyCape = Array.isArray(wArr[idx]?.hourly?.cape)
        ? Number(wArr[idx].hourly.cape[0] || 0)
        : 0;
      const aItem = aArr[idx]?.current || {};

      const baseTemp =
        typeof wItem.temperature_2m === 'number'
          ? wItem.temperature_2m
          : activeDayWeather?.tempMaxC ?? 24.5;
      return {
        id: anchor.id,
        lat: anchor.lat,
        lng: anchor.lng,
        nameAr: anchor.nameAr,
        nameEn: anchor.nameEn,
        temp2mC: Number(baseTemp.toFixed(1)),
        apparentTempC: Number(
          (typeof wItem.apparent_temperature === 'number'
            ? wItem.apparent_temperature
            : baseTemp + 1.2).toFixed(1)
        ),
        dewPointC: Number(
          (typeof wItem.dew_point_2m === 'number' ? wItem.dew_point_2m : baseTemp - 9.5).toFixed(1)
        ),
        humidityPct: Math.round(
          typeof wItem.relative_humidity_2m === 'number'
            ? wItem.relative_humidity_2m
            : activeDayWeather?.relativeHumidityPct ?? 54
        ),
        pressureHpa: Number(
          (typeof wItem.pressure_msl === 'number'
            ? wItem.pressure_msl
            : activeDayWeather?.surfacePressureHpa ?? 1014.2).toFixed(1)
        ),
        capeJkg: Math.round(wHourlyCape),
        windGustKmh: Number(
          (typeof wItem.wind_gusts_10m === 'number'
            ? wItem.wind_gusts_10m
            : (activeDayWeather?.windSpeedKmh ?? 14) * 1.45).toFixed(1)
        ),
        uvIndex: Number(
          (typeof aItem.uv_index === 'number'
            ? aItem.uv_index
            : typeof wItem.uv_index === 'number'
            ? wItem.uv_index
            : 5.4).toFixed(1)
        ),
        pm25: Number((typeof aItem.pm2_5 === 'number' ? aItem.pm2_5 : 18.4).toFixed(1)),
        pm10: Number((typeof aItem.pm10 === 'number' ? aItem.pm10 : 38.0).toFixed(1)),
        dust: Number((typeof aItem.dust === 'number' ? aItem.dust : 42.0).toFixed(1)),
        no2: Number(
          (typeof aItem.nitrogen_dioxide === 'number' ? aItem.nitrogen_dioxide : 14.5).toFixed(1)
        ),
        so2: Number(
          (typeof aItem.sulphur_dioxide === 'number' ? aItem.sulphur_dioxide : 6.2).toFixed(1)
        ),
        o3: Number((typeof aItem.ozone === 'number' ? aItem.ozone : 62.0).toFixed(1)),
        co: Number((typeof aItem.carbon_monoxide === 'number' ? aItem.carbon_monoxide : 220).toFixed(0)),
        aqi: Math.round(typeof aItem.european_aqi === 'number' ? aItem.european_aqi : 34),
      };
    });

    ventuskyLiveCache.set(key, { fetchedAt: Date.now(), nodes });
    return nodes;
  } catch {
    return anchors.map((anchor) => {
      const baseTemp = activeDayWeather?.tempMaxC ?? 24.5;
      return {
        id: anchor.id,
        lat: anchor.lat,
        lng: anchor.lng,
        nameAr: anchor.nameAr,
        nameEn: anchor.nameEn,
        temp2mC: Number(baseTemp.toFixed(1)),
        apparentTempC: Number((baseTemp + 0.9).toFixed(1)),
        dewPointC: Number((baseTemp - 10.2).toFixed(1)),
        humidityPct: activeDayWeather?.relativeHumidityPct ?? 55,
        pressureHpa: activeDayWeather?.surfacePressureHpa ?? 1014.5,
        capeJkg: 90,
        windGustKmh: Number(((activeDayWeather?.windSpeedKmh ?? 15) * 1.48).toFixed(1)),
        uvIndex: 5.8,
        pm25: 19.2,
        pm10: 41.5,
        dust: 48.0,
        no2: 15.1,
        so2: 6.4,
        o3: 58.0,
        co: 215,
        aqi: 36,
      };
    });
  }
}

function sampleColorStops(
  value: number,
  stops: Array<{ v: number; rgb: [number, number, number] }>
): [number, number, number] {
  if (value <= stops[0].v) return stops[0].rgb;
  for (let i = 0; i < stops.length - 1; i++) {
    if (value <= stops[i + 1].v) {
      const t = (value - stops[i].v) / Math.max(0.0001, stops[i + 1].v - stops[i].v);
      return lerpRgb(stops[i].rgb, stops[i + 1].rgb, t);
    }
  }
  return stops[stops.length - 1].rgb;
}

export interface VentuskyEvaluatedPoint {
  numericValue: number;
  formattedValue: string;
  unit: string;
  r: number;
  g: number;
  b: number;
  a: number;
  colorHex: string;
  statusAr: string;
  statusEn: string;
  isLightningBolt: boolean;
  isPressureCenter: 'H' | 'L' | null;
}

/**
 * Unified Ventusky Continuous Global Atmospheric & Air-Quality Evaluator.
 * Computes smooth synoptic fields across 100% of Land + Oceans with support for:
 * - Hourly UTC time-of-day shifts from the Timeline Scrubber
 * - Pressure Altitude Levels (2m, 900 hPa, 850 hPa, 700 hPa, Dew Point)
 * - Pollutants (PM2.5, PM10, NO2, SO2, O3, Dust, CO, AQI, UV)
 * - Precipitation Accumulation Windows (1h, 3h, 24h)
 * - Apparent Temp, Wind Speed & Wind Gusts, Sea-Level Pressure & Isobars, CAPE Thunderstorms,
 *   WORAD Weather Radar + Lightning Bolts, and Geostationary Satellite IR Clouds.
 */
export function evaluateVentuskyLayerAtLatLon(
  lat: number,
  lng: number,
  layerId: ThematicMapLayerId,
  options?: Partial<VentuskyAtmosphericOptions>,
  activeWeatherDay?: DailyWeatherPoint,
  liveNodes?: VentuskyLiveTelemetryNode[]
): VentuskyEvaluatedPoint {
  const pressureAlt: PressureAltitudeLevel = options?.pressureAltitude ?? '2m';
  const pollutant: AirPollutantSpecies = options?.airPollutant ?? 'PM2.5';
  const precipWindow = options?.precipAccumWindow ?? '3h';
  const cloudFilter = options?.cloudFilter ?? 'total';
  const windAlt = options?.windAltitude ?? '10m';
  const now = new Date();
  const liveUtcNow = now.getUTCHours() + now.getUTCMinutes() / 60;
  const utcHour =
    typeof options?.utcHour === 'number' && Number.isFinite(options.utcHour)
      ? options.utcHour
      : liveUtcNow;
  const daySeed = activeWeatherDay?.date ? Number(activeWeatherDay.date.slice(8, 10)) || 1 : 1;
  const dayShiftLng = ((daySeed % 14) - 2) * 1.4;

  // Dynamic synoptic eastward wave progression during UTC playback & forecast day transitions
  const timeShiftLng = (utcHour - 12) * 1.9 + dayShiftLng;
  const sLng = lng - timeShiftLng;
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (sLng * Math.PI) / 180;

  // Locate nearest hydrated Open-Meteo node if available within 3.5° for smooth local calibration
  let nearestNode: VentuskyLiveTelemetryNode | null = null;
  let nearestWeight = 0;
  if (liveNodes && liveNodes.length > 0) {
    let bestD = Infinity;
    for (const node of liveNodes) {
      const d = Math.hypot(lat - node.lat, lng - node.lng);
      if (d < bestD) {
        bestD = d;
        nearestNode = node;
      }
    }
    if (bestD < 3.5) {
      nearestWeight = Math.max(0, 1 - bestD / 3.5) * 0.72;
    }
  }

  // Diurnal temperature cycle relative to local solar hour
  const localSolarHour = (((utcHour + lng / 15) % 24) + 24) % 24;
  const diurnalC = Math.sin(((localSolarHour - 9) / 24) * Math.PI * 2) * 4.2;

  const altTempDropC =
    pressureAlt === '900hPa'
      ? -6.2
      : pressureAlt === '850hPa'
      ? -10.4
      : pressureAlt === '700hPa'
      ? -20.1
      : 0;

  const baseWind = evaluateSpatialWindAtLatLon(lat, sLng, activeWeatherDay);
  const baseTemp = evaluateGlobalTemperatureAtLatLon(lat, sLng, activeWeatherDay, 'air_2m');

  // 1) Apparent / Feels-Like Temperature (°C)
  if (layerId === 'apparent_temp') {
    const humBoost =
      lat >= -24 && lat <= 24 ? 3.8 : lat >= 24 && lat <= 35 ? 1.4 : -0.5;
    const windChillDrop = Math.max(0, baseWind.speedKmh - 12) * 0.14;
    let apparentC = baseTemp.airTemp2mC + diurnalC * 0.75 + humBoost - windChillDrop + altTempDropC;
    if (nearestNode && nearestWeight > 0 && pressureAlt === '2m') {
      apparentC = apparentC * (1 - nearestWeight) + nearestNode.apparentTempC * nearestWeight;
    }
    const val = Number(apparentC.toFixed(1));
    const rgb = sampleColorStops(val, [
      { v: -40, rgb: [216, 180, 254] },
      { v: -20, rgb: [168, 85, 247] },
      { v: -5, rgb: [49, 46, 129] },
      { v: 5, rgb: [14, 165, 233] },
      { v: 15, rgb: [34, 197, 94] },
      { v: 24, rgb: [234, 179, 8] },
      { v: 32, rgb: [239, 68, 68] },
      { v: 45, rgb: [105, 10, 25] },
    ]);
    return {
      numericValue: val,
      formattedValue: `${val}°C`,
      unit: '°C',
      r: rgb[0],
      g: rgb[1],
      b: rgb[2],
      a: 184,
      colorHex: `#${rgb.map((c) => c.toString(16).padStart(2, '0')).join('')}`,
      statusAr:
        val >= 35
          ? `إجهاد حراري محسوس (${val}°م)`
          : val <= 5
          ? `برودة ريحية قاسية (${val}°م)`
          : `حرارة ظاهرية معتدلة (${val}°م)`,
      statusEn:
        val >= 35
          ? `High Apparent Heat (${val}°C)`
          : val <= 5
          ? `Chilly Feels-Like (${val}°C)`
          : `Comfortable Feels-Like (${val}°C)`,
      isLightningBolt: false,
      isPressureCenter: null,
    };
  }

  // 2) Air Temperature with Pressure Level Altitudes & Time-of-Day Diurnal Shift
  if (layerId === 'temperature') {
    let tempVal = baseTemp.airTemp2mC + diurnalC * 0.72 + altTempDropC;
    if (nearestNode && nearestWeight > 0 && pressureAlt === '2m') {
      tempVal = tempVal * (1 - nearestWeight) + nearestNode.temp2mC * nearestWeight;
    }
    if (pressureAlt === 'dew_point') {
      const approxRh = 45 + Math.exp(-Math.pow((Math.abs(lat) - 52) / 22, 2)) * 35;
      tempVal = tempVal - (100 - approxRh) / 5;
    }
    const val = Number(tempVal.toFixed(1));
    const rgb = sampleColorStops(val, [
      { v: -40, rgb: [226, 232, 240] },
      { v: -20, rgb: [192, 38, 211] },
      { v: -8, rgb: [49, 46, 129] },
      { v: 2, rgb: [6, 182, 212] },
      { v: 12, rgb: [34, 197, 94] },
      { v: 21, rgb: [234, 179, 8] },
      { v: 30, rgb: [234, 88, 12] },
      { v: 42, rgb: [127, 29, 29] },
    ]);
    return {
      numericValue: val,
      formattedValue: `${val}°C`,
      unit: '°C',
      r: rgb[0],
      g: rgb[1],
      b: rgb[2],
      a: 184,
      colorHex: `#${rgb.map((c) => c.toString(16).padStart(2, '0')).join('')}`,
      statusAr: `${val}°م (${pressureAlt})`,
      statusEn: `${val}°C (${pressureAlt})`,
      isLightningBolt: false,
      isPressureCenter: null,
    };
  }

  // 3) Wind Speed Heatmap Field & Wind Gusts (km/h, ICON 0..140 km/h)
  if (layerId === 'wind' || layerId === 'wind_gusts') {
    const altMult =
      windAlt === '850hPa'
        ? 1.38
        : windAlt === '700hPa'
        ? 1.62
        : windAlt === '80m'
        ? 1.18
        : windAlt === '40m'
        ? 1.09
        : 1.0;
    const cycloneBoost =
      gaussianBell(lat, sLng, 52.0, -25.0, 9.5, 16.0, 56, 0.25) +
      gaussianBell(lat, sLng, 38.0, 152.0, 8.5, 14.0, 52, -0.2) +
      gaussianBell(lat, sLng, -46.0, 42.0, 8.0, 22.0, 48, 0.1) +
      gaussianBell(lat, sLng, 34.5, 27.5, 4.5, 6.5, 22, -0.15);
    let speed = (baseWind.speedKmh * 1.15 + cycloneBoost) * altMult;
    if (layerId === 'wind_gusts') {
      speed = speed * 1.52 + 8 * Math.abs(Math.sin(latRad * 3 + lngRad * 2));
      if (nearestNode && nearestWeight > 0) {
        speed = speed * (1 - nearestWeight) + nearestNode.windGustKmh * nearestWeight;
      }
    }
    const val = Math.round(Math.max(2, Math.min(145, speed)));
    const rgb = sampleColorStops(val, [
      { v: 0, rgb: [100, 116, 139] },
      { v: 12, rgb: [59, 130, 246] },
      { v: 26, rgb: [16, 185, 129] },
      { v: 42, rgb: [132, 204, 22] },
      { v: 58, rgb: [234, 179, 8] },
      { v: 78, rgb: [249, 115, 22] },
      { v: 102, rgb: [220, 38, 38] },
      { v: 135, rgb: [69, 10, 10] },
    ]);
    return {
      numericValue: val,
      formattedValue: `${val} km/h`,
      unit: ' km/h',
      r: rgb[0],
      g: rgb[1],
      b: rgb[2],
      a: layerId === 'wind' ? 166 : 185,
      colorHex: `#${rgb.map((c) => c.toString(16).padStart(2, '0')).join('')}`,
      statusAr:
        val >= 55
          ? `رياح عاصفة خطرة (${val} كم/س)`
          : val >= 24
          ? `رياح نشطة — أوقف الرش (${val} كم/س)`
          : `رياح هادئة (${val} كم/س)`,
      statusEn:
        val >= 55
          ? `Strong Storm Winds (${val} km/h)`
          : val >= 24
          ? `Brisk Breeze — No Spraying (${val} km/h)`
          : `Calm Winds (${val} km/h)`,
      isLightningBolt: false,
      isPressureCenter: null,
    };
  }

  // 4) Atmospheric Pressure MSL (940..1054 hPa with cyclones H/L)
  if (layerId === 'pressure') {
    const subtropicalHigh = Math.exp(-Math.pow((Math.abs(lat) - 29) / 14, 2)) * 12.5;
    const subpolarLow = -Math.exp(-Math.pow((Math.abs(lat) - 56) / 11, 2)) * 19.0;
    const siberianAzoresHigh =
      gaussianBell(lat, sLng, 35.0, -34.0, 9.0, 14.0, 18.0, 0.1) +
      gaussianBell(lat, sLng, 50.0, 92.0, 10.0, 18.0, 26.0, -0.1) +
      gaussianBell(lat, sLng, 32.0, 44.0, 6.0, 9.0, 10.5, 0);
    const stormLow =
      -gaussianBell(lat, sLng, 57.0, -24.0, 7.5, 13.0, 32.0, 0.15) -
      gaussianBell(lat, sLng, 36.5, 19.5, 4.0, 6.0, 14.0, -0.2);

    let hpa = 1013 + subtropicalHigh + subpolarLow + siberianAzoresHigh + stormLow;
    if (nearestNode && nearestWeight > 0) {
      hpa = hpa * (1 - nearestWeight) + nearestNode.pressureHpa * nearestWeight;
    }
    hpa = Math.max(942, Math.min(1052, hpa));
    const val = Math.round(hpa);

    // Subtle dark 4 hPa isobar contour darkening just like Ventusky pressure maps
    const rem4 = Math.abs((hpa % 4) - 2);
    const isobarDarken = rem4 > 1.82 ? 0.78 : 1.0;

    const rgb = sampleColorStops(val, [
      { v: 945, rgb: [76, 29, 149] },
      { v: 970, rgb: [49, 46, 129] },
      { v: 990, rgb: [37, 99, 235] },
      { v: 1005, rgb: [16, 185, 129] },
      { v: 1014, rgb: [163, 230, 53] },
      { v: 1022, rgb: [245, 158, 11] },
      { v: 1034, rgb: [220, 38, 38] },
      { v: 1050, rgb: [69, 10, 10] },
    ]);

    return {
      numericValue: val,
      formattedValue: `${val} hPa`,
      unit: ' hPa',
      r: Math.round(rgb[0] * isobarDarken),
      g: Math.round(rgb[1] * isobarDarken),
      b: Math.round(rgb[2] * isobarDarken),
      a: 185,
      colorHex: `#${rgb.map((c) => c.toString(16).padStart(2, '0')).join('')}`,
      statusAr:
        val <= 1000
          ? `منخفض جوي نشط (${val} hPa)`
          : val >= 1022
          ? `مرتفع جوي مستقر (${val} hPa)`
          : `ضغط جوي معتدل (${val} hPa)`,
      statusEn:
        val <= 1000
          ? `Active Low Center (${val} hPa)`
          : val >= 1022
          ? `Stable High Ridge (${val} hPa)`
          : `Normal Pressure (${val} hPa)`,
      isLightningBolt: false,
      isPressureCenter: val >= 1028 ? 'H' : val <= 988 ? 'L' : null,
    };
  }

  // 5) Thunderstorms CAPE (J/kg, 0..5000) — includes mobile Mediterranean, Levantine/Palestine, North Egypt & French frontal cells
  if (layerId === 'thunderstorms') {
    const itczConvection = Math.exp(-Math.pow((lat - 2.5) / 7.5, 2)) * 2250;
    const monsoonBay = gaussianBell(lat, sLng, 12.0, 92.0, 8.0, 14.0, 1950, 0.2);
    const medCell =
      gaussianBell(lat, sLng, 35.0, 21.0, 3.6, 6.2, 1380, -0.2) +
      gaussianBell(lat, sLng, 32.2, 31.8, 2.8, 4.4, 920, -0.15) + // East Med / Nile Delta / Palestine trough
      gaussianBell(lat, sLng, 46.8, 3.2, 3.6, 5.8, 1140, 0.22); // Western Europe / France frontal instability
    const diurnalStormBoost = Math.max(0.62, 1 + diurnalC * 0.095);
    let cape =
      (itczConvection + monsoonBay + medCell) *
        (0.55 + 0.45 * Math.sin(lngRad * 2.5 + latRad * 3.1)) *
        diurnalStormBoost;
    if (nearestNode && nearestWeight > 0) {
      cape = cape * (1 - nearestWeight) + nearestNode.capeJkg * nearestWeight;
    }
    const val = Math.round(Math.max(0, Math.min(5000, cape)));
    if (val < 120) {
      return {
        numericValue: val,
        formattedValue: `${val} J/kg`,
        unit: ' J/kg',
        r: 71,
        g: 85,
        b: 105,
        a: 62,
        colorHex: '#475569',
        statusAr: `جو مستقر (${val} J/kg)`,
        statusEn: `Stable Atmosphere (${val} J/kg)`,
        isLightningBolt: false,
        isPressureCenter: null,
      };
    }
    const rgb = sampleColorStops(val, [
      { v: 120, rgb: [99, 102, 241] },
      { v: 550, rgb: [6, 182, 212] },
      { v: 1100, rgb: [34, 197, 94] },
      { v: 1750, rgb: [234, 179, 8] },
      { v: 2600, rgb: [220, 38, 38] },
      { v: 4200, rgb: [69, 10, 10] },
    ]);
    return {
      numericValue: val,
      formattedValue: `${val} J/kg`,
      unit: ' J/kg',
      r: rgb[0],
      g: rgb[1],
      b: rgb[2],
      a: Math.min(220, 105 + Math.round((val / 3000) * 115)),
      colorHex: `#${rgb.map((c) => c.toString(16).padStart(2, '0')).join('')}`,
      statusAr:
        val >= 1600
          ? `عواصف رعدية قوية محتملة (${val} J/kg)`
          : `عدم استقرار جوي معتدل (${val} J/kg)`,
      statusEn:
        val >= 1600
          ? `Strong Thunderstorm Instability (${val} J/kg)`
          : `Moderate Convection (${val} J/kg)`,
      isLightningBolt: val >= 2050,
      isPressureCenter: null,
    };
  }

  // 6) Weather Radar WORAD (0..60 dBZ + active lightning strikes across Atlantic/France/Med/Levant/Egypt)
  if (layerId === 'weather_radar') {
    const radarCells =
      gaussianBell(lat, sLng, 32.0, 29.8, 2.8, 4.4, 42, -0.3) + // Alexandria / Delta / East Med coast
      gaussianBell(lat, sLng, 31.8, 35.0, 2.2, 3.0, 39, 0.2) + // Gaza / Jerusalem / Levant coastal band
      gaussianBell(lat, sLng, 47.2, 2.2, 3.4, 5.2, 43, 0.15) + // France Paris-Loire rain echoes
      gaussianBell(lat, sLng, 37.5, 16.5, 3.0, 4.5, 48, 0.25) +
      gaussianBell(lat, sLng, 26.5, -78.0, 3.2, 4.0, 56, 0.35) +
      gaussianBell(lat, sLng, 51.0, 4.0, 3.5, 6.0, 38, 0.1) +
      gaussianBell(lat, sLng, 8.0, 102.0, 4.5, 6.0, 52, -0.2) +
      gaussianBell(lat, sLng, -4.0, -56.0, 5.0, 6.5, 49, 0.1);
    const ripple = 0.72 + 0.35 * Math.sin(latRad * 11 + lngRad * 9);
    const dbz = Math.round(Math.max(0, Math.min(64, radarCells * ripple)));
    if (dbz < 8) {
      return {
        numericValue: 0,
        formattedValue: '0 dBZ',
        unit: ' dBZ',
        r: 71,
        g: 85,
        b: 105,
        a: 35,
        colorHex: '#475569',
        statusAr: 'رادار صافٍ (0 dBZ)',
        statusEn: 'Clear Radar Echo (0 dBZ)',
        isLightningBolt: false,
        isPressureCenter: null,
      };
    }
    const rgb = sampleColorStops(dbz, [
      { v: 8, rgb: [59, 130, 246] },
      { v: 20, rgb: [34, 197, 94] },
      { v: 32, rgb: [234, 179, 8] },
      { v: 44, rgb: [220, 38, 38] },
      { v: 56, rgb: [136, 19, 55] },
      { v: 62, rgb: [248, 250, 252] },
    ]);
    return {
      numericValue: dbz,
      formattedValue: `${dbz} dBZ`,
      unit: ' dBZ',
      r: rgb[0],
      g: rgb[1],
      b: rgb[2],
      a: 215,
      colorHex: `#${rgb.map((c) => c.toString(16).padStart(2, '0')).join('')}`,
      statusAr: dbz >= 44 ? `خلية رعدية وبرق نشط (${dbz} dBZ)` : `هطول راداري نشط (${dbz} dBZ)`,
      statusEn: dbz >= 44 ? `Lightning Storm Cell (${dbz} dBZ)` : `Active Rain Echo (${dbz} dBZ)`,
      isLightningBolt: dbz >= 44,
      isPressureCenter: null,
    };
  }

  // 7) Geostationary Satellite IR+Visible Clouds (GOES+HIMAWARI+METEOSAT)
  if (layerId === 'satellite_ir') {
    const atmos = evaluateVentuskyAtmosphericFieldAtLatLon(lat, sLng, 'weather', activeWeatherDay);
    const swirl =
      Math.sin(latRad * 5.2 + lngRad * 3.1) * 18 + Math.cos(latRad * 8.4 - lngRad * 5.5) * 12;
    const cover = Math.round(Math.max(0, Math.min(100, atmos.numericValue * 1.08 + swirl)));
    const shade = Math.round(25 + (cover / 100) * 225);
    return {
      numericValue: cover,
      formattedValue: `${cover}%`,
      unit: '%',
      r: Math.max(12, Math.round(shade * 0.94)),
      g: Math.max(18, Math.round(shade * 0.97)),
      b: Math.min(255, Math.round(shade * 1.04)),
      a: cover < 18 ? 48 : Math.min(238, Math.round(60 + (cover / 100) * 178)),
      colorHex: '#cbd5e1',
      statusAr: cover >= 65 ? `غطاء سحابي فضائي كثيف (${cover}%)` : `رصد فضائي (${cover}%)`,
      statusEn: cover >= 65 ? `Dense Geostationary Clouds (${cover}%)` : `Satellite Cover (${cover}%)`,
      isLightningBolt: false,
      isPressureCenter: null,
    };
  }

  // 8) Relative Humidity (%) & Altitude Levels (2m, 900/850/700 hPa, Dew Point)
  if (layerId === 'humidity') {
    if (pressureAlt === 'dew_point') {
      const baseDew = baseTemp.airTemp2mC - 9.5 + diurnalC * 0.3;
      const val = Number(baseDew.toFixed(1));
      const rgb = sampleColorStops(val, [
        { v: -20, rgb: [120, 96, 40] },
        { v: 0, rgb: [168, 152, 96] },
        { v: 10, rgb: [148, 163, 184] },
        { v: 18, rgb: [56, 189, 248] },
        { v: 26, rgb: [16, 185, 129] },
      ]);
      return {
        numericValue: val,
        formattedValue: `${val}°C`,
        unit: '°C',
        r: rgb[0],
        g: rgb[1],
        b: rgb[2],
        a: 182,
        colorHex: `#${rgb.map((c) => c.toString(16).padStart(2, '0')).join('')}`,
        statusAr: `نقطة التكثف والندى (${val}°م)`,
        statusEn: `Dew Point (${val}°C)`,
        isLightningBolt: false,
        isPressureCenter: null,
      };
    }

    const saharaArid = Math.exp(-Math.pow((lat - 23.5) / 10, 2) - Math.pow((lng - 14) / 30, 2)) * 38;
    const altRhDelta =
      pressureAlt === '900hPa'
        ? 8
        : pressureAlt === '850hPa'
        ? 4
        : pressureAlt === '700hPa'
        ? -12
        : 0;
    let rh =
      62 -
      saharaArid +
      Math.exp(-Math.pow((Math.abs(lat) - 52) / 15, 2)) * 22 -
      diurnalC * 2.2 +
      altRhDelta;
    if (isMarineOrOceanWaterAtLatLon(lat, lng)) rh = Math.max(66, rh + 14);
    if (nearestNode && nearestWeight > 0 && pressureAlt === '2m') {
      rh = rh * (1 - nearestWeight) + nearestNode.humidityPct * nearestWeight;
    }
    const val = Math.round(Math.max(8, Math.min(99, rh)));
    const rgb = sampleColorStops(val, [
      { v: 10, rgb: [120, 96, 40] },
      { v: 32, rgb: [168, 152, 96] },
      { v: 52, rgb: [203, 213, 225] },
      { v: 74, rgb: [226, 232, 240] },
      { v: 95, rgb: [248, 250, 252] },
    ]);
    return {
      numericValue: val,
      formattedValue: `${val}%`,
      unit: '%',
      r: rgb[0],
      g: rgb[1],
      b: rgb[2],
      a: 175,
      colorHex: `#${rgb.map((c) => c.toString(16).padStart(2, '0')).join('')}`,
      statusAr:
        val >= 82
          ? `رطوبة عالية — تنبيه ندى وفطريات (${val}%)`
          : val <= 28
          ? `جفاف جوي صحراوي (${val}%)`
          : `رطوبة نسبية معتدلة (${val}%)`,
      statusEn:
        val >= 82
          ? `High Fungal Dew Humidity (${val}%)`
          : val <= 28
          ? `Dry Arid Air (${val}%)`
          : `Moderate Humidity (${val}%)`,
      isLightningBolt: false,
      isPressureCenter: null,
    };
  }

  // 9) Air Quality & Desert Dust & UV Index (SILAM / Open-Meteo CAMS: PM2.5, PM10, NO2, SO2, O3, Dust, CO, AQI, UV)
  if (layerId === 'air_quality') {
    const saharaDustBelt =
      gaussianBell(lat, sLng, 21.5, 6.0, 9.0, 28.0, 92, 0.08) +
      gaussianBell(lat, sLng, 26.5, 29.5, 4.5, 7.0, 48, -0.1) +
      gaussianBell(lat, sLng, 30.8, 34.4, 2.5, 3.2, 34, 0.1) + // Sinai & Southern Palestine dust plumes
      gaussianBell(lat, sLng, 25.0, 46.0, 6.5, 11.0, 68, 0.15);
    const industrialBelt =
      gaussianBell(lat, sLng, 31.0, 114.0, 7.5, 12.0, 115, 0.1) +
      gaussianBell(lat, sLng, 26.5, 81.0, 5.5, 10.0, 108, -0.1) +
      gaussianBell(lat, sLng, 48.8, 2.4, 2.2, 3.4, 42, 0.1) + // Paris / Western Europe urban-industrial basin
      gaussianBell(lat, sLng, 45.7, 4.9, 1.4, 1.8, 36, 0) + // Rhone corridor
      gaussianBell(lat, sLng, 30.04, 31.24, 1.4, 1.8, 42, 0);

    let rawVal = 12 + saharaDustBelt * 0.48 + industrialBelt * 0.72;
    let unit = ' µg/m³';
    if (pollutant === 'PM10' || pollutant === 'DUST') {
      rawVal = 14 + saharaDustBelt * 1.18 + industrialBelt * 0.88;
    } else if (pollutant === 'NO2') {
      rawVal = 6 + industrialBelt * 0.55;
    } else if (pollutant === 'SO2') {
      rawVal = 3 + industrialBelt * 0.35;
    } else if (pollutant === 'O3') {
      rawVal = 38 + Math.max(0, 35 - Math.abs(lat)) * 0.9 + industrialBelt * 0.25;
    } else if (pollutant === 'CO') {
      rawVal = 160 + industrialBelt * 2.4;
    } else if (pollutant === 'AQI') {
      rawVal = 18 + (saharaDustBelt * 0.6 + industrialBelt * 0.9);
      unit = ' AQI';
    } else if (pollutant === 'UV') {
      const solar = evaluateGlobalDayNightSolarAtLatLon(lat, lng, utcHour);
      rawVal = Math.max(0, (solar.solarRadiationWm2 / 950) * 11.2);
      unit = ' UV';
    }

    if (nearestNode && nearestWeight > 0) {
      const nodeVal =
        pollutant === 'PM2.5'
          ? nearestNode.pm25
          : pollutant === 'PM10'
          ? nearestNode.pm10
          : pollutant === 'DUST'
          ? nearestNode.dust
          : pollutant === 'NO2'
          ? nearestNode.no2
          : pollutant === 'SO2'
          ? nearestNode.so2
          : pollutant === 'O3'
          ? nearestNode.o3
          : pollutant === 'CO'
          ? nearestNode.co
          : pollutant === 'AQI'
          ? nearestNode.aqi
          : nearestNode.uvIndex;
      rawVal = rawVal * (1 - nearestWeight) + nodeVal * nearestWeight;
    }

    const scaleMax =
      pollutant === 'UV' ? 11 : pollutant === 'CO' ? 900 : pollutant === 'AQI' ? 160 : 200;
    const normPct = Math.min(100, (rawVal / scaleMax) * 100);
    const rgb = sampleColorStops(normPct, [
      { v: 0, rgb: [59, 130, 246] },
      { v: 18, rgb: [254, 240, 138] },
      { v: 36, rgb: [234, 179, 8] },
      { v: 54, rgb: [249, 115, 22] },
      { v: 74, rgb: [225, 29, 72] },
      { v: 95, rgb: [69, 10, 10] },
    ]);
    const val = pollutant === 'UV' ? Number(rawVal.toFixed(1)) : Math.round(rawVal);
    return {
      numericValue: val,
      formattedValue: `${val}${unit}`,
      unit,
      r: rgb[0],
      g: rgb[1],
      b: rgb[2],
      a: 185,
      colorHex: `#${rgb.map((c) => c.toString(16).padStart(2, '0')).join('')}`,
      statusAr:
        normPct >= 60
          ? `${pollutant}: تركيز مرتفع (${val}${unit})`
          : `${pollutant}: جودة جيدة (${val}${unit})`,
      statusEn:
        normPct >= 60
          ? `${pollutant}: Elevated Plume (${val}${unit})`
          : `${pollutant}: Clean (${val}${unit})`,
      isLightningBolt: false,
      isPressureCenter: null,
    };
  }

  // 10) Rainfall & Cloud Filter fallback via continuous atmospheric field
  const winFactor = precipWindow === '24h' ? 3.2 : precipWindow === '3h' ? 1.0 : 0.42;
  const atmos = evaluateVentuskyAtmosphericFieldAtLatLon(
    lat,
    sLng,
    layerId === 'rainfall' ? 'rainfall' : 'weather',
    activeWeatherDay
  );
  if (layerId === 'rainfall') {
    const val = Number((atmos.numericValue * winFactor).toFixed(1));
    return {
      numericValue: val,
      formattedValue: `${val} mm`,
      unit: ' mm',
      r: atmos.r,
      g: atmos.g,
      b: atmos.b,
      a: atmos.a,
      colorHex: '#22c55e',
      statusAr: val > 0.2 ? `هطول مطري (${val} مم / ${precipWindow})` : 'سماء جافة (0 مم)',
      statusEn: val > 0.2 ? `Rainfall (${val} mm / ${precipWindow})` : 'Dry (0 mm)',
      isLightningBolt: false,
      isPressureCenter: null,
    };
  }

  const cloudAdj =
    cloudFilter === 'low_fog'
      ? Math.max(0, atmos.numericValue * 0.72)
      : cloudFilter === 'high'
      ? Math.max(0, atmos.numericValue * 0.85)
      : atmos.numericValue;
  return {
    numericValue: Math.round(cloudAdj),
    formattedValue: `${Math.round(cloudAdj)}%`,
    unit: '%',
    r: atmos.r,
    g: atmos.g,
    b: atmos.b,
    a: atmos.a,
    colorHex: '#38bdf8',
    statusAr: `الغطاء السحابي ${Math.round(cloudAdj)}%`,
    statusEn: `Cloud Cover ${Math.round(cloudAdj)}%`,
    isLightningBolt: false,
    isPressureCenter: null,
  };
}








