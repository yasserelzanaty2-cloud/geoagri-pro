/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Comprehensive NASA, ESA, USDA, USGS, FAO & Partner Space Agency Data Foundations
 * Authoritative Earth Observation, Agro-Climatology, Soil Taxonomy & Market Intelligence Datasets
 */

export type SpaceDataCategory =
  | 'earth_observation'
  | 'agro_climate'
  | 'soils_hydrology'
  | 'cropland_rotation'
  | 'markets_yield';

export type SpaceAgency =
  | 'NASA'
  | 'ESA / ECMWF'
  | 'USDA'
  | 'USGS'
  | 'FAO'
  | 'Open Network / University';

export type IntegrationStatus =
  | 'active_live_stream'
  | 'calibrated_model'
  | 'benchmarked_dataset'
  | 'direct_portal';

export interface SpaceDataSource {
  id: string;
  name: string;
  nameAr: string;
  category: SpaceDataCategory;
  categoryLabelAr: string;
  categoryLabelEn: string;
  agency: SpaceAgency;
  spatialResolution: string;
  temporalResolution: string;
  measurement: string;
  measurementAr: string;
  roleInGeoAgri: string;
  roleInGeoAgriAr: string;
  officialUrl: string;
  integrationStatus: IntegrationStatus;
  integrationStatusAr: string;
  integrationStatusEn: string;
  badgeColor: string;
}

export const SPACE_DATA_SOURCES: SpaceDataSource[] = [
  // ---------------------------------------------------------------------------
  // 1. SATELLITE EARTH OBSERVATION MISSIONS
  // ---------------------------------------------------------------------------
  {
    id: 'smap',
    name: 'Soil Moisture Active Passive (SMAP)',
    nameAr: 'مسبار قياس رطوبة التربة (SMAP) — ناسا',
    category: 'earth_observation',
    categoryLabelAr: 'أقمار الرصد الفضائي',
    categoryLabelEn: 'Earth Observation Satellites',
    agency: 'NASA',
    spatialResolution: '9 km – 36 km (L4 root-zone model)',
    temporalResolution: '2–3 days',
    measurement: 'Surface and root-zone soil moisture (0-5cm and 0-100cm), freeze/thaw state',
    measurementAr: 'رطوبة التربة السطحية والجذرية (0-5 سم و0-100 سم)، وحالة التجمد/الذوبان',
    roleInGeoAgri:
      'Calibrates root-zone water availability, early plant drought stress detection, and irrigation schedule triggers.',
    roleInGeoAgriAr:
      'معايرة الرطوبة في النطاق الجذري وكشف بوادر الإجهاد المائي قبل ذبول الأوراق وتوجيه فترات الري التكميلي.',
    officialUrl: 'https://www.earthdata.nasa.gov/data/platforms/space-based-platforms/smap',
    integrationStatus: 'active_live_stream',
    integrationStatusAr: 'بث حي ومعايرة خوارزمية (GIBS WMTS)',
    integrationStatusEn: 'Live Stream & Calibrated Model (GIBS WMTS)',
    badgeColor: 'border-blue-500/40 bg-blue-50/70 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300',
  },
  {
    id: 'gpm_imerg',
    name: 'Global Precipitation Measurement (GPM) & IMERG',
    nameAr: 'نظام قياس الأمطار العالمي (GPM / IMERG) — ناسا وجاكسا',
    category: 'earth_observation',
    categoryLabelAr: 'أقمار الرصد الفضائي',
    categoryLabelEn: 'Earth Observation Satellites',
    agency: 'NASA',
    spatialResolution: '0.1° (~10 km)',
    temporalResolution: '30 minutes / Daily accumulation',
    measurement: 'Global precipitation rate, multi-satellite rain accumulation, storm severity',
    measurementAr: 'معدل وتراكم هطول الأمطار العالمي، شدة العواصف، وخطر الانجراف المائي',
    roleInGeoAgri:
      'Powers 14-day rainfall forecasts, soil erosion risk warnings, and net crop irrigation budget subtractions.',
    roleInGeoAgriAr:
      'حساب ميزان الأمطار الفعلي وخصم التساقط من المقنن المائي للمحصول وتنبيهات السيول والانجراف السطحي.',
    officialUrl: 'https://gpm.nasa.gov/data',
    integrationStatus: 'active_live_stream',
    integrationStatusAr: 'بث حي وتراكمي يومي (NASA GIBS)',
    integrationStatusEn: 'Live Stream & Daily Accumulation (NASA GIBS)',
    badgeColor: 'border-sky-500/40 bg-sky-50/70 dark:bg-sky-950/30 text-sky-700 dark:text-sky-300',
  },
  {
    id: 'landsat',
    name: 'Landsat 8 & 9 (OLI / TIRS)',
    nameAr: 'أقمار لاندسات 8 و9 — ناسا وهيئة المساحة الجيولوجية الأمريكية',
    category: 'earth_observation',
    categoryLabelAr: 'أقمار الرصد الفضائي',
    categoryLabelEn: 'Earth Observation Satellites',
    agency: 'NASA',
    spatialResolution: '30 m (Multispectral) / 15 m (Panchromatic) / 100 m (Thermal)',
    temporalResolution: '8–16 days',
    measurement: 'Surface reflectance, NDVI, SAVI, NDWI, Land Surface Temperature',
    measurementAr: 'الانعكاسية الطيفية المصححة، مؤشرات الغطاء النباتي والمائي، والحرارة السطحية',
    roleInGeoAgri:
      'Cross-validates field parcel vigor, vegetation indexes, and decadal field history transitions.',
    roleInGeoAgriAr:
      'المعايرة المتقاطعة لصحة النبات والمؤشرات الطيفية وتحليل التغير التاريخي للحقول عبر العقود.',
    officialUrl: 'https://earthexplorer.usgs.gov/',
    integrationStatus: 'calibrated_model',
    integrationStatusAr: 'مدمج في التحليل الطيفي التاريخي',
    integrationStatusEn: 'Integrated in Multi-Decadal Spectral Analysis',
    badgeColor: 'border-emerald-500/40 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300',
  },
  {
    id: 'modis_viirs',
    name: 'MODIS (Terra/Aqua) & VIIRS (Suomi NPP / NOAA-20)',
    nameAr: 'مجسات موديس وفيرز (MODIS / VIIRS) — ناسا ونوا',
    category: 'earth_observation',
    categoryLabelAr: 'أقمار الرصد الفضائي',
    categoryLabelEn: 'Earth Observation Satellites',
    agency: 'NASA',
    spatialResolution: '250 m – 1000 m',
    temporalResolution: 'Daily to 8-day composite',
    measurement: 'Global vegetation greenness, thermal anomalies, night lights, snow cover, cloud fraction',
    measurementAr: 'مؤشر اخضرار الغطاء النباتي العالمي، البقع الحرارية، الغطاء السحابي، والثلجي',
    roleInGeoAgri:
      'Supplies high-temporal 8-day NDVI composites and macro-regional crop phenology monitoring.',
    roleInGeoAgriAr:
      'توفير سلاسل زمنية متصلة لـ NDVI كل 8 أيام ومتابعة أطوار نمو المحاصيل على المستوى الإقليمي.',
    officialUrl: 'https://lpdaac.usgs.gov/products/',
    integrationStatus: 'active_live_stream',
    integrationStatusAr: 'بث حي نشط عبر NASA GIBS WMTS',
    integrationStatusEn: 'Active Live Feed via NASA GIBS WMTS',
    badgeColor: 'border-teal-500/40 bg-teal-50/70 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300',
  },
  {
    id: 'ecostress',
    name: 'ECOSTRESS (ISS Thermal Radiometer)',
    nameAr: 'تجربة إيكوستريس (ECOSTRESS) — مختبر الدفع النفاث ناسا (JPL)',
    category: 'earth_observation',
    categoryLabelAr: 'أقمار الرصد الفضائي',
    categoryLabelEn: 'Earth Observation Satellites',
    agency: 'NASA',
    spatialResolution: '70 m',
    temporalResolution: '1–5 days (precessing ISS orbit)',
    measurement: 'High-resolution Land Surface Temperature (LST), Evaporative Stress Index (ESI), Evapotranspiration',
    measurementAr: 'حرارة سطح الأرض عالية الدقة (70م)، مؤشر إجهاد البخر (ESI)، والبخر-نتح الحقلي',
    roleInGeoAgri:
      'Pinpoints intra-field thermal stress hotspots and shallow-root vulnerability hours before physical wilt.',
    roleInGeoAgriAr:
      'رصد بؤر الإجهاد الحراري داخل الحقل الواحد وحساسية الجذور الضحلة قبل حدوث الذبول الظاهري بساعات.',
    officialUrl: 'https://ecostress.jpl.nasa.gov/data',
    integrationStatus: 'calibrated_model',
    integrationStatusAr: 'معايرة حرارة أوراق النبات (LST Layer)',
    integrationStatusEn: 'Canopy Thermal Stress Calibration (LST Layer)',
    badgeColor: 'border-amber-500/40 bg-amber-50/70 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300',
  },
  {
    id: 'srtm',
    name: 'Shuttle Radar Topography Mission (SRTM)',
    nameAr: 'مهمة مكوك الفضاء الرادارية لقياس التضاريس (SRTM) — ناسا',
    category: 'earth_observation',
    categoryLabelAr: 'أقمار الرصد الفضائي',
    categoryLabelEn: 'Earth Observation Satellites',
    agency: 'NASA',
    spatialResolution: '1 arc-second (~30 m)',
    temporalResolution: 'Global benchmark elevation model',
    measurement: 'Digital Elevation Model (DEM), slope angle, aspect, watershed flow accumulation',
    measurementAr: 'نموذج الارتفاع الرقمي (DEM)، زاوية الانحدار، اتجاه السفوح، وتجميع المجاري المائية',
    roleInGeoAgri:
      'Calculates field drainage, water pooling risk, erosion vulnerability, and contour crop suitability.',
    roleInGeoAgriAr:
      'حساب مسارات الصرف الزراعي، تجمع المياه، مخاطر الانجراف الطبوغرافي، وزراعة المصاطب الكنتورية.',
    officialUrl: 'https://www.earthdata.nasa.gov/data/instruments/srtm',
    integrationStatus: 'active_live_stream',
    integrationStatusAr: 'بيانات ثلاثية الأبعاد نشطة في الخريطة',
    integrationStatusEn: 'Active 3D Elevation Terrain Model in Atlas',
    badgeColor: 'border-purple-500/40 bg-purple-50/70 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300',
  },
  {
    id: 'gedi',
    name: 'Global Ecosystem Dynamics Investigation (GEDI)',
    nameAr: 'مسبار ليدار ديناميكا النظم البيئية (GEDI) — ناسا وجامعة ميريلاند',
    category: 'earth_observation',
    categoryLabelAr: 'أقمار الرصد الفضائي',
    categoryLabelEn: 'Earth Observation Satellites',
    agency: 'NASA',
    spatialResolution: '25 m footprint waveform lidar',
    temporalResolution: 'Multi-year mission archive',
    measurement: 'Canopy height profile, vertical plant density, Leaf Area Index (LAI), Aboveground Biomass (AGBD)',
    measurementAr: 'الملف الرأسي لارتفاع المجموع الخضري، مؤشر مساحة الأوراق (LAI)، والكتلة الحيوية النباتية',
    roleInGeoAgri:
      'Estimates orchard canopy structure, windbreak efficiency, and agroforestry carbon stocking.',
    roleInGeoAgriAr:
      'تقدير كثافة أشجار البساتين (موالح وزيتون)، كفاءة مصدات الرياح، وتراكم الكتلة الحيوية للمزرعة.',
    officialUrl: 'https://gedi.umd.edu/data',
    integrationStatus: 'calibrated_model',
    integrationStatusAr: 'معايرة الكتلة الحيوية ومعامل LAI',
    integrationStatusEn: 'Biomass & Leaf Area Index Calibration',
    badgeColor: 'border-emerald-600/40 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200',
  },
  {
    id: 'sentinel_2',
    name: 'Copernicus Sentinel-2 (MSI) — ESA',
    nameAr: 'أقمار كوبرنيكوس سنتينل-2 (Sentinel-2) — وكالة الفضاء الأوروبية',
    category: 'earth_observation',
    categoryLabelAr: 'أقمار الرصد الفضائي',
    categoryLabelEn: 'Earth Observation Satellites',
    agency: 'ESA / ECMWF',
    spatialResolution: '10 m (RGB/NIR) / 20 m (Red-Edge & SWIR)',
    temporalResolution: '5 days constellation revisit',
    measurement: 'High-resolution multispectral reflectance, Red-Edge chlorophyll, water absorption SWIR bands',
    measurementAr: 'انعكاسية متعددة الأطياف بدقة 10م، حزم الحافة الحمراء لقياس الكلوروفيل، وامتصاص الماء SWIR',
    roleInGeoAgri:
      'Primary engine for real-time field sub-zoning (Zones A, B, C), NDVI/SAVI/NDWI computing, and crop health scoring.',
    roleInGeoAgriAr:
      'المحرك الأساسي لتقسيم الحقل لقطاعات (A, B, C) بدقة 10م، وحساب مؤشرات NDVI وNDWI وصحة المحصول.',
    officialUrl: 'https://dataspace.copernicus.eu/',
    integrationStatus: 'active_live_stream',
    integrationStatusAr: 'المحرك الفضائي الأساسي بالمنصة بدقة 10م',
    integrationStatusEn: 'Core Operational 10m Engine across Platform',
    badgeColor: 'border-green-500/40 bg-green-50/70 dark:bg-green-950/30 text-green-700 dark:text-green-300',
  },
  {
    id: 'era5',
    name: 'ECMWF ERA5 Reanalysis — Copernicus Climate Change Service',
    nameAr: 'بيانات إعادة التحليل المناخي ERA5 — المركز الأوروبي للتنبؤات الجوية',
    category: 'agro_climate',
    categoryLabelAr: 'الأرصاد والمناخ الزراعي',
    categoryLabelEn: 'Agrometeorology & Climate',
    agency: 'ESA / ECMWF',
    spatialResolution: '0.25° (~31 km)',
    temporalResolution: 'Hourly / Daily continuous time series from 1940 to present',
    measurement: 'Hourly 2m temperature, relative humidity, solar radiation, soil temperature at 4 levels, wind vectors',
    measurementAr: 'درجات الحرارة الساعية، الرطوبة، الإشعاع الشمسي، وحرارة التربة على 4 أعماق مختلفة',
    roleInGeoAgri:
      'Provides high-fidelity baseline climatology, continuous gap-filling, and growing degree day (GDD) accumulation.',
    roleInGeoAgriAr:
      'المرجع المناخي الساعي لحساب درجات الحرارة المتراكمة (GDD) وتدقيق معدلات البخر ومخاطر الصقيع.',
    officialUrl: 'https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels?tab=overview',
    integrationStatus: 'active_live_stream',
    integrationStatusAr: 'تغذية مناخية ساعية متصلة',
    integrationStatusEn: 'Continuous Hourly Climate Feed',
    badgeColor: 'border-indigo-500/40 bg-indigo-50/70 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300',
  },

  // ---------------------------------------------------------------------------
  // 2. AGRO-CLIMATOLOGY & METEOROLOGICAL SYSTEMS
  // ---------------------------------------------------------------------------
  {
    id: 'nasa_power',
    name: 'NASA POWER (Prediction Of Worldwide Energy Resources)',
    nameAr: 'منظومة ناسا باور (NASA POWER) للأرصاد والإشعاع الزراعي',
    category: 'agro_climate',
    categoryLabelAr: 'الأرصاد والمناخ الزراعي',
    categoryLabelEn: 'Agrometeorology & Climate',
    agency: 'NASA',
    spatialResolution: '0.5° × 0.5° global grid',
    temporalResolution: 'Daily & Monthly climatology',
    measurement: 'All-sky surface solar radiation, T2M max/min, dewpoint, surface wetness, precipitation',
    measurementAr: 'الإشعاع الشمسي الكلي، درجات الحرارة القصوى والدنيا، نقطة الندى، ورطوبة السطح',
    roleInGeoAgri:
      'Direct agro-meteorology API calculating FAO-56 Penman-Monteith reference evapotranspiration (ET₀).',
    roleInGeoAgriAr:
      'واجهة برمجية مباشرة لحساب البخر-نتح المرجعي بمعادلة بنمان-مونتيث FAO-56 وحساب التراكم الحراري.',
    officialUrl: 'https://power.larc.nasa.gov/',
    integrationStatus: 'active_live_stream',
    integrationStatusAr: 'واجهة برمجية حية مباشرة (Direct API)',
    integrationStatusEn: 'Direct Live Agroclimatology API Endpoint',
    badgeColor: 'border-orange-500/40 bg-orange-50/70 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300',
  },
  {
    id: 'prism',
    name: 'PRISM Climate Data — Oregon State University',
    nameAr: 'بيانات مناخ PRISM الطبوغرافية — جامعة ولاية أوريغون',
    category: 'agro_climate',
    categoryLabelAr: 'الأرصاد والمناخ الزراعي',
    categoryLabelEn: 'Agrometeorology & Climate',
    agency: 'Open Network / University',
    spatialResolution: '800 m – 4 km',
    temporalResolution: 'Daily, monthly, 30-year climate normals',
    measurement: 'Topography-adjusted precipitation, temperature minimum/maximum, dew point, frost dates',
    measurementAr: 'الأمطار المصححة طبوغرافياً، درجات الحرارة الدنيا والقصوى، وتواريخ الصقيع والتجمد',
    roleInGeoAgri:
      'Validates microclimate elevation adjustments and long-term 30-year agro-climate normals.',
    roleInGeoAgriAr:
      'معايرة تأثير الارتفاع والتضاريس على المناخ المصغر وتدقيق احتمالات الصقيع المبكر والمتأخر.',
    officialUrl: 'https://prism.oregonstate.edu/',
    integrationStatus: 'benchmarked_dataset',
    integrationStatusAr: 'قاعدة بيانات معيارية للمناخ المصغر',
    integrationStatusEn: 'Benchmarked Topographic Microclimate Normals',
    badgeColor: 'border-cyan-500/40 bg-cyan-50/70 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-300',
  },
  {
    id: 'nldas_gldas',
    name: 'NLDAS & GLDAS (Land Data Assimilation Systems) — NASA GSFC',
    nameAr: 'منظومة استيعاب بيانات اليابسة (NLDAS / GLDAS) — مركز غودارد ناسا',
    category: 'agro_climate',
    categoryLabelAr: 'الأرصاد والمناخ الزراعي',
    categoryLabelEn: 'Agrometeorology & Climate',
    agency: 'NASA',
    spatialResolution: '0.125° (NLDAS) / 0.25° (GLDAS)',
    temporalResolution: 'Hourly to 3-hourly continuous',
    measurement: 'Multi-model land-surface state, soil heat flux, runoff, root-zone moisture anomalies',
    measurementAr: 'مخرجات نماذج اليابسة المتعددة، التدفق الحراري للتربة، الجريان السطحي، وحيود الرطوبة',
    roleInGeoAgri:
      'Provides land-atmosphere boundary flux constraints for regional hydrological budgeting.',
    roleInGeoAgriAr:
      'ضبط الحدود الهيدرولوجية للتوازن المائي ومنع تراكم أخطاء الجفاف الزراعي عبر الزمن.',
    officialUrl: 'https://www.earthdata.nasa.gov/',
    integrationStatus: 'calibrated_model',
    integrationStatusAr: 'مدمج في النموذج الهيدرولوجي',
    integrationStatusEn: 'Assimilated in Land Hydrologic Model',
    badgeColor: 'border-blue-600/40 bg-blue-50/70 dark:bg-blue-950/30 text-blue-800 dark:text-blue-200',
  },
  {
    id: 'cocorahs',
    name: 'CoCoRaHS (Community Collaborative Rain, Hail & Snow Network)',
    nameAr: 'شبكة الملاحظات الميدانية لهطول الأمطار (CoCoRaHS)',
    category: 'agro_climate',
    categoryLabelAr: 'الأرصاد والمناخ الزراعي',
    categoryLabelEn: 'Agrometeorology & Climate',
    agency: 'Open Network / University',
    spatialResolution: 'Point in-situ gauge locations (25,000+ stations)',
    temporalResolution: 'Daily morning observations',
    measurement: 'Ground-truth rain gauge measurements, hail stone size, snow water equivalent',
    measurementAr: 'قياسات المطر الفعلية على الأرض، حجم حبات البرد، والمكافئ المائي للثلوج',
    roleInGeoAgri:
      'Provides empirical ground-truth validation for satellite radar precipitation (GPM IMERG).',
    roleInGeoAgriAr:
      'التحقق الميداني الأرضي من دقة رادارات الأقمار الصناعية ومعايرة احتمالات الخطأ.',
    officialUrl: 'https://www.cocorahs.org/Maps',
    integrationStatus: 'benchmarked_dataset',
    integrationStatusAr: 'محطات أرضية لمعايرة قراءات الأقمار',
    integrationStatusEn: 'In-Situ Gauge Network for Satellite Calibration',
    badgeColor: 'border-sky-600/40 bg-sky-50/70 dark:bg-sky-950/30 text-sky-800 dark:text-sky-200',
  },

  // ---------------------------------------------------------------------------
  // 3. SOIL TAXONOMY, HYDROLOGY & WATER RESOURCES
  // ---------------------------------------------------------------------------
  {
    id: 'web_soil_survey',
    name: 'Web Soil Survey (WSS) — USDA NRCS',
    nameAr: 'المسح الإلكتروني للتربة (Web Soil Survey) — وزارة الزراعة الأمريكية',
    category: 'soils_hydrology',
    categoryLabelAr: 'التربة والموارد المائية',
    categoryLabelEn: 'Soils & Hydrology',
    agency: 'USDA',
    spatialResolution: 'Field-scale (1:12,000 to 1:24,000 map units)',
    temporalResolution: 'Official authoritative national soil survey database',
    measurement: 'Soil taxonomy, drainage class, hydrologic soil group, depth to restrictive layer, slope',
    measurementAr: 'تصنيف التربة العلمي، فئات الصرف، المجموعات الهيدرولوجية، وعمق الطبقات الصماء',
    roleInGeoAgri:
      'Defines baseline soil texture classes, infiltration rates, and compaction vulnerability.',
    roleInGeoAgriAr:
      'تحديد قوام التربة الأساسي وسرعة الارتشاح وقابلية الانضغاط وتصنيف التربة (طينية، صفراء، رملية، جيرية).',
    officialUrl: 'https://websoilsurvey.nrcs.usda.gov/app/',
    integrationStatus: 'benchmarked_dataset',
    integrationStatusAr: 'مرجع تصنيف التربة والخصائص الهيدرولوجية',
    integrationStatusEn: 'Authoritative Soil Taxonomy & Drainage Baseline',
    badgeColor: 'border-yellow-600/40 bg-yellow-50/70 dark:bg-yellow-950/30 text-yellow-800 dark:text-yellow-200',
  },
  {
    id: 'ssurgo_statsgo2',
    name: 'USDA NRCS SSURGO / STATSGO2 Soil Database',
    nameAr: 'قاعدة بيانات التربة الرقمية المفصلة (SSURGO / STATSGO2) — NRCS',
    category: 'soils_hydrology',
    categoryLabelAr: 'التربة والموارد المائية',
    categoryLabelEn: 'Soils & Hydrology',
    agency: 'USDA',
    spatialResolution: 'Field scale (SSURGO) to Regional scale 1:250,000 (STATSGO2)',
    temporalResolution: 'Regular annual updates',
    measurement: 'Available Water Capacity (AWC), Cation Exchange Capacity (CEC), pH, salinity EC, organic matter %',
    measurementAr: 'السعة المائية الميسرة (AWC)، السعة التبادلية الكاتيونية (CEC)، الـ pH، والملوحة EC',
    roleInGeoAgri:
      'Enables quantitative NPK buffering, leaching fraction equations, and chemical amendment dosing.',
    roleInGeoAgriAr:
      'حساب المقادير الكيميائية لغسيل الأملاح، ومعادلة قلوية التربة بحامض الفوسفوريك، وحساب سعة الاحتفاظ بالماء.',
    officialUrl: 'https://www.nrcs.usda.gov/resources/data-and-reports/soils',
    integrationStatus: 'calibrated_model',
    integrationStatusAr: 'مدمج في معادلات التسميد وغسيل الأملاح',
    integrationStatusEn: 'Engineered into NPK & Salinity Leaching Equations',
    badgeColor: 'border-amber-600/40 bg-amber-50/70 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200',
  },
  {
    id: 'usgs_nwis',
    name: 'USGS National Water Information System (NWIS)',
    nameAr: 'النظام الوطني لمعلومات المياه (USGS NWIS) — المساحة الجيولوجية',
    category: 'soils_hydrology',
    categoryLabelAr: 'التربة والموارد المائية',
    categoryLabelEn: 'Soils & Hydrology',
    agency: 'USGS',
    spatialResolution: '1.9 million+ monitoring stations across streams, aquifers, and reservoirs',
    temporalResolution: 'Real-time (15-60 min) and historic daily streamflow',
    measurement: 'Groundwater table depths, streamflow discharge (cfs/m³s), aquifer storage levels, water salinity',
    measurementAr: 'عمق المياه الجوفية، تصرفات الترع والأنهار، ومناسيب الآبار الارتوازية والملوحة',
    roleInGeoAgri:
      'Assesses long-term groundwater depletion risk and water pumping sustainability for deep-well farms.',
    roleInGeoAgriAr:
      'تقييم استدامة السحب من الآبار الجوفية ومراقبة خطر هبوط مناسيب المياه وتملح الخزان الجوفي.',
    officialUrl: 'https://waterdata.usgs.gov/nwis',
    integrationStatus: 'benchmarked_dataset',
    integrationStatusAr: 'تقييم استدامة الآبار الجوفية والري',
    integrationStatusEn: 'Aquifer Depletion & Groundwater Sustainability Index',
    badgeColor: 'border-teal-600/40 bg-teal-50/70 dark:bg-teal-950/30 text-teal-800 dark:text-teal-200',
  },
  {
    id: 'openet',
    name: 'OpenET (Satellite-Driven Field-Scale Evapotranspiration)',
    nameAr: 'منظومة أوبن إي تي للبخر-نتح الحقلي (OpenET) — ناسا وهيئة المساحة',
    category: 'soils_hydrology',
    categoryLabelAr: 'التربة والموارد المائية',
    categoryLabelEn: 'Soils & Hydrology',
    agency: 'NASA',
    spatialResolution: 'Field-scale (30 m resolution)',
    temporalResolution: 'Daily and monthly consumptive water use',
    measurement: 'Actual Evapotranspiration (ETa), crop consumptive water use, water-use efficiency (WUE)',
    measurementAr: 'البخر-نتح الفعلي (ETa)، الاستهلاك المائي الحقيقي للنبات، وكفاءة استخدام المياه',
    roleInGeoAgri:
      'Calibrates dynamic crop coefficient curves ($K_c$) against actual satellite-observed transpiration.',
    roleInGeoAgriAr:
      'معايرة منحنيات معاملات المحاصيل الديناميكية ($K_c$) وفق البخر الفعلي المستهلك بالأقمار الصناعية.',
    officialUrl: 'https://openetdata.org/',
    integrationStatus: 'calibrated_model',
    integrationStatusAr: 'معايرة مقننات الري الدقيقة (م³/فدان)',
    integrationStatusEn: 'Calibrates Precision Irrigation Budget (m³/feddan)',
    badgeColor: 'border-cyan-600/40 bg-cyan-50/70 dark:bg-cyan-950/30 text-cyan-800 dark:text-cyan-200',
  },

  // ---------------------------------------------------------------------------
  // 4. CROPLAND, LAND COVER & ROTATION SCIENCES
  // ---------------------------------------------------------------------------
  {
    id: 'usda_cdl',
    name: 'USDA Cropland Data Layer (CDL) & CropScape',
    nameAr: 'طبقة بيانات المحاصيل السنوية (USDA CDL / CropScape)',
    category: 'cropland_rotation',
    categoryLabelAr: 'المحاصيل والدورات الزراعية',
    categoryLabelEn: 'Cropland & Rotations',
    agency: 'USDA',
    spatialResolution: '30 m raster georeferenced crop classification',
    temporalResolution: 'Annual census (over 25 years of historical rotation records)',
    measurement: 'Crop type classification (Corn, Wheat, Soybeans, Cotton, Alfalfa, Fallow, etc.)',
    measurementAr: 'تصنيف أنواع المحاصيل الحقلية بدقة 30م، تاريخ الزراعة والبور عبر ربع قرن',
    roleInGeoAgri:
      'Provides empirical rule bases for multi-season crop rotation transitions and break-crop compatibility.',
    roleInGeoAgriAr:
      'استنباط القواعد التجريبية للدورات الزراعية لمنع إرهاق التربة وكسر دورات حياة الآفات.',
    officialUrl: 'https://nassgeodata.gmu.edu/CropScape/',
    integrationStatus: 'calibrated_model',
    integrationStatusAr: 'مدمج في محرك الدورة الزراعية والتحذيرات',
    integrationStatusEn: 'Engineered into Crop Rotation & Pest Break Engine',
    badgeColor: 'border-lime-500/40 bg-lime-50/70 dark:bg-lime-950/30 text-lime-700 dark:text-lime-300',
  },
  {
    id: 'usda_ag_data_commons',
    name: 'USDA Ag Data Commons — National Agricultural Library',
    nameAr: 'مستودع البيانات الزراعية المفتوحة (USDA Ag Data Commons)',
    category: 'cropland_rotation',
    categoryLabelAr: 'المحاصيل والدورات الزراعية',
    categoryLabelEn: 'Cropland & Rotations',
    agency: 'USDA',
    spatialResolution: 'Field trials to national agricultural experiment stations',
    temporalResolution: 'Continuous open-access research repository',
    measurement: 'Agronomic field trial datasets, crop variety performance, tillage impacts, soil carbon sequestration',
    measurementAr: 'تجارب الأصناف المعتمدة، تأثيرات نظم الحراثة، عزل الكربون بالتربة، ودراسات التغذية',
    roleInGeoAgri:
      'Supplies cultivar genetic thresholds (GDD requirements, salt tolerance limits, optimum plant populations).',
    roleInGeoAgriAr:
      'توفير المعايير الوراثية للأصناف (الاحتياجات الحرارية GDD، حدود تحمل الملوحة، ومعدلات البذار المثلى).',
    officialUrl: 'https://www.nal.usda.gov/services/agdatacommons',
    integrationStatus: 'benchmarked_dataset',
    integrationStatusAr: 'مرجع الخواص الوراثية لأصناف المحاصيل',
    integrationStatusEn: 'Cultivar Genetic & Agronomic Trait Baseline',
    badgeColor: 'border-green-600/40 bg-green-50/70 dark:bg-green-950/30 text-green-800 dark:text-green-200',
  },
  {
    id: 'fao_gaez',
    name: 'FAO Global Agro-Ecological Zones (GAEZ v4)',
    nameAr: 'نطاقات البيئة الزراعية العالمية (FAO GAEZ v4) — منظمة الفاو',
    category: 'cropland_rotation',
    categoryLabelAr: 'المحاصيل والدورات الزراعية',
    categoryLabelEn: 'Cropland & Rotations',
    agency: 'FAO',
    spatialResolution: '5 arc-minute (~9 km) global agro-climatic grid',
    temporalResolution: 'Baseline climate cycles & climate change projection scenarios',
    measurement: 'Agro-climatic suitability index, soil quality constraints, terrain suitability, yield potential classes',
    measurementAr: 'مؤشر الملاءمة المناخية الزراعية، محددات التربة، وإنتاجية المحاصيل المتوقعة',
    roleInGeoAgri:
      'Forms the Multi-Criteria Decision Analysis (MCDA) weighting matrix for crop ranking and yield forecasting.',
    roleInGeoAgriAr:
      'تشكيل مصفوفة اتخاذ القرار متعددة المعايير (MCDA) لترتيب المحاصيل والتنبؤ بالإنتاجية بالطن/فدان.',
    officialUrl: 'https://gaez.fao.org/',
    integrationStatus: 'calibrated_model',
    integrationStatusAr: 'مصفوفة التقييم وترتيب المحاصيل (MCDA)',
    integrationStatusEn: 'Core MCDA Crop Recommendation & Suitability Matrix',
    badgeColor: 'border-emerald-500/40 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300',
  },
  {
    id: 'usgs_nlcd',
    name: 'USGS National Land Cover Database (NLCD)',
    nameAr: 'قاعدة بيانات الغطاء الأرضي الوطنية (USGS NLCD)',
    category: 'cropland_rotation',
    categoryLabelAr: 'المحاصيل والدورات الزراعية',
    categoryLabelEn: 'Cropland & Rotations',
    agency: 'USGS',
    spatialResolution: '30 m multi-decade land cover',
    temporalResolution: '2-3 year release cycles spanning 20+ years',
    measurement: 'Decadal land cover change, impervious surface %, tree canopy %, agricultural buffer zones',
    measurementAr: 'التغير في الغطاء الأرضي، نسبة الأسطح الصماء، الغطاء الشجري، والأحزمة الزراعية العازلة',
    roleInGeoAgri:
      'Contextualizes farm perimeter landscape features, urban sprawl encroachment, and buffer zone health.',
    roleInGeoAgriAr:
      'دراسة الأحزمة العازلة حول المزرعة ومراقبة التعديات العمرانية والحفاظ على الرقعة الزراعية.',
    officialUrl: 'https://www.usgs.gov/centers/eros/science/national-land-cover-database',
    integrationStatus: 'benchmarked_dataset',
    integrationStatusAr: 'تحليل الغطاء الأرضي وحماية الرقعة الزراعية',
    integrationStatusEn: 'Landscape & Farmland Preservation Baseline',
    badgeColor: 'border-slate-500/40 bg-slate-50/70 dark:bg-slate-950/30 text-slate-700 dark:text-slate-300',
  },
  {
    id: 'naip',
    name: 'National Agriculture Imagery Program (NAIP) — USDA FPAC',
    nameAr: 'برنامج التصوير الجوي الزراعي فائق الدقة (USDA NAIP)',
    category: 'cropland_rotation',
    categoryLabelAr: 'المحاصيل والدورات الزراعية',
    categoryLabelEn: 'Cropland & Rotations',
    agency: 'USDA',
    spatialResolution: '0.6 m – 1.0 m ortho-imagery',
    temporalResolution: 'Leaf-on peak growing season every 2-3 years',
    measurement: 'Ultra-high-resolution visible and near-infrared four-band ortho-photography',
    measurementAr: 'تصوير جوي فائق الدقة (1م) بالأشعة المرئية وتحت الحمراء القريبة أثناء ذروة الموسم',
    roleInGeoAgri:
      'Calibrates sub-meter farm boundary digitization, irrigation ditch layouts, and tree-counting algorithms.',
    roleInGeoAgriAr:
      'معايرة الحدود المترية للحقول، شبكات خطوط الري والتنقيط، وإحصاء الأشجار بدقة متناهية.',
    officialUrl: 'https://naip-usdaonline.hub.arcgis.com/',
    integrationStatus: 'benchmarked_dataset',
    integrationStatusAr: 'معايرة هندسية فائقة الدقة للحدود وشبكات الري',
    integrationStatusEn: 'Ultra-High-Resolution Ortho Boundary Calibration',
    badgeColor: 'border-violet-500/40 bg-violet-50/70 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300',
  },
  {
    id: 'landfire',
    name: 'USFS LANDFIRE (Vegetation & Fuel Dynamics)',
    nameAr: 'برنامج لاندفاير لتوصيف الغطاء النباتي والحرائق (LANDFIRE)',
    category: 'cropland_rotation',
    categoryLabelAr: 'المحاصيل والدورات الزراعية',
    categoryLabelEn: 'Cropland & Rotations',
    agency: 'Open Network / University',
    spatialResolution: '30 m continuous spatial datasets',
    temporalResolution: 'Biennial and annual updates',
    measurement: 'Existing Vegetation Type (EVT), canopy height, canopy cover %, surface fire behavior fuel models',
    measurementAr: 'نوع الغطاء النباتي القائم، ارتفاع وتغطية المجموع الخضري، ومخاطر حرائق القش والأعشاب',
    roleInGeoAgri:
      'Informs harvest residue management, crop stubble bio-risk assessment, and post-harvest fire prevention.',
    roleInGeoAgriAr:
      'إدارة متبقيات الحصاد (قش الأرز وعروش البطاطس) والوقاية من حرائق المزارع والحفاظ على المواد العضوية.',
    officialUrl: 'https://www.landfire.gov/',
    integrationStatus: 'benchmarked_dataset',
    integrationStatusAr: 'إدارة متبقيات الحصاد والوقاية الحيوية',
    integrationStatusEn: 'Crop Residue & Biomass Fuel Management',
    badgeColor: 'border-red-500/40 bg-red-50/70 dark:bg-red-950/30 text-red-700 dark:text-red-300',
  },

  // ---------------------------------------------------------------------------
  // 5. COMMODITY MARKETS, ECONOMICS & PRODUCTION STATISTICS
  // ---------------------------------------------------------------------------
  {
    id: 'usda_ams',
    name: 'USDA Agricultural Marketing Service (AMS) Market News',
    nameAr: 'تقارير أسواق المحاصيل الزراعية (USDA AMS Market News)',
    category: 'markets_yield',
    categoryLabelAr: 'الأسواق والعوائد الاقتصادية',
    categoryLabelEn: 'Markets & Economics',
    agency: 'USDA',
    spatialResolution: 'Wholesale terminal markets, shipping point regions, and farm-gate levels',
    temporalResolution: 'Daily and weekly price reporting',
    measurement: 'Spot commodity prices, freight rates, export packaging standards, grade specifications',
    measurementAr: 'أسعار السلع الفورية، تكاليف الشحن، مواصفات فرز التصدير (Grade-A)، والطلب السوقي',
    roleInGeoAgri:
      'Feeds live economic profitability models, gross revenue estimates (EGP/Feddan), and export viability.',
    roleInGeoAgriAr:
      'حساب العائد المالي المتوقع (جنيه/فدان) وجدوى زراعة محاصيل التصدير (بطاطس، فول، طماطم، قمح).',
    officialUrl: 'https://www.ams.usda.gov/market-news',
    integrationStatus: 'calibrated_model',
    integrationStatusAr: 'حساب العائد الاقتصادي ومواصفات التصدير',
    integrationStatusEn: 'Economic Gross Margin & Export Grading Calibration',
    badgeColor: 'border-emerald-600/40 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200',
  },
  {
    id: 'usda_nass_quickstats',
    name: 'USDA NASS QuickStats (Agricultural Statistics Service)',
    nameAr: 'الإحصاءات الزراعية والإنتاجية التاريخية (USDA NASS QuickStats)',
    category: 'markets_yield',
    categoryLabelAr: 'الأسواق والعوائد الاقتصادية',
    categoryLabelEn: 'Markets & Economics',
    agency: 'USDA',
    spatialResolution: 'County, agricultural district, state, and national totals',
    temporalResolution: 'Annual agricultural census and monthly survey updates',
    measurement: 'Historical crop yield per acre/hectare, harvested acreage, production totals, fertilizer application rates',
    measurementAr: 'إنتاجية الفدان التاريخية، المساحات المحصودة، الإجمالي الإنتاجي، ومعدلات استهلاك الأسمدة',
    roleInGeoAgri:
      'Calibrates statistical yield confidence intervals and verifies yield projections against empirical history.',
    roleInGeoAgriAr:
      'معايرة فترات ثقة الإنتاجية المتوقعة ومقارنة توقعات الذكاء الاصطناعي بالأرقام التاريخية الموثقة.',
    officialUrl: 'https://quickstats.nass.usda.gov/',
    integrationStatus: 'benchmarked_dataset',
    integrationStatusAr: 'معايرة التنبؤ بإنتاجية المحصول (طن/فدان)',
    integrationStatusEn: 'Empirical Yield Benchmarking (Tons/Feddan)',
    badgeColor: 'border-blue-500/40 bg-blue-50/70 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300',
  },
];

/**
 * Filter space data sources by category
 */
export function getSpaceDataSourcesByCategory(category: SpaceDataCategory | 'all'): SpaceDataSource[] {
  if (category === 'all') return SPACE_DATA_SOURCES;
  return SPACE_DATA_SOURCES.filter((s) => s.category === category);
}

/**
 * Filter space data sources by agency
 */
export function getSpaceDataSourcesByAgency(agency: SpaceAgency | 'all'): SpaceDataSource[] {
  if (agency === 'all') return SPACE_DATA_SOURCES;
  return SPACE_DATA_SOURCES.filter((s) => s.agency === agency);
}
