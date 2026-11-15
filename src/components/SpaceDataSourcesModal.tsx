import React, { useState, useMemo } from 'react';
import {
  Satellite,
  ExternalLink,
  ShieldCheck,
  Search,
  Filter,
  Layers,
  Sparkles,
  X,
  Activity,
  Globe2,
  Droplets,
  Sprout,
  TrendingUp,
  Cpu,
} from 'lucide-react';
import {
  SPACE_DATA_SOURCES,
  SpaceDataCategory,
  SpaceAgency,
  SpaceDataSource,
} from '../data/spaceDataSources';
import { Language } from '../types/agro';

interface SpaceDataSourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const SpaceDataSourcesModal: React.FC<SpaceDataSourcesModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  const isAr = language === 'ar';
  const [selectedCategory, setSelectedCategory] = useState<SpaceDataCategory | 'all'>('all');
  const [selectedAgency, setSelectedAgency] = useState<SpaceAgency | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSources = useMemo(() => {
    return SPACE_DATA_SOURCES.filter((source) => {
      if (selectedCategory !== 'all' && source.category !== selectedCategory) {
        return false;
      }
      if (selectedAgency !== 'all' && source.agency !== selectedAgency) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = source.name.toLowerCase().includes(q) || source.nameAr.includes(q);
        const matchesRole = source.roleInGeoAgri.toLowerCase().includes(q) || source.roleInGeoAgriAr.includes(q);
        const matchesMeas = source.measurement.toLowerCase().includes(q) || source.measurementAr.includes(q);
        const matchesAgency = source.agency.toLowerCase().includes(q);
        return matchesName || matchesRole || matchesMeas || matchesAgency;
      }
      return true;
    });
  }, [selectedCategory, selectedAgency, searchQuery]);

  if (!isOpen) return null;

  const categories: Array<{ id: SpaceDataCategory | 'all'; labelAr: string; labelEn: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'all', labelAr: 'الكل (24 مصدراً)', labelEn: 'All (24 Sources)', icon: Layers },
    { id: 'earth_observation', labelAr: 'أقمار الرصد الفضائي (9)', labelEn: 'Earth Observation (9)', icon: Satellite },
    { id: 'agro_climate', labelAr: 'الأرصاد والمناخ الزراعي (4)', labelEn: 'Agroclimatology (4)', icon: Globe2 },
    { id: 'soils_hydrology', labelAr: 'التربة والمياه (4)', labelEn: 'Soils & Water (4)', icon: Droplets },
    { id: 'cropland_rotation', labelAr: 'المحاصيل والدورات (5)', labelEn: 'Crops & Rotations (5)', icon: Sprout },
    { id: 'markets_yield', labelAr: 'الأسواق والاقتصاد (2)', labelEn: 'Markets & Economics (2)', icon: TrendingUp },
  ];

  const agencies: Array<SpaceAgency | 'all'> = ['all', 'NASA', 'ESA / ECMWF', 'USDA', 'USGS', 'FAO'];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-5xl max-h-[92vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-950/90 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
              <Satellite className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                  {isAr
                    ? 'مرتكزات بيانات الفضاء وناسا الرسمية'
                    : 'NASA & Partner Space Agency Data Foundations'}
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{isAr ? 'بيانات حقيقية 100%' : '100% Verified Real Data'}</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {isAr
                  ? 'منظومة الأقمار الصناعية ومراصد الأرض المعتمدة في حسابات GeoAgri Pro'
                  : 'Authoritative satellite constellations and agro-observatories backing GeoAgri Pro'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={isAr ? 'إغلاق' : 'Close'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Verification Guarantee Banner */}
        <div className="px-5 py-2.5 bg-gradient-to-r from-emerald-600/10 via-teal-600/10 to-sky-600/10 border-b border-emerald-500/20 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-medium">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              {isAr
                ? 'تستند كافة المؤشرات والتوصيات إلى 24 منظومة بيانات رسمية من NASA وESA وUSDA وUSGS وFAO بدون أي بيانات عشوائية.'
                : 'All indices and agronomic decisions are mathematically grounded in 24 authoritative space agency sources.'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{isAr ? 'تغذية ومزامنة نشطة' : 'Active Telemetry Synchronization'}</span>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1">
              <div className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isAr
                    ? 'ابحث باسم القمر الصناعي، المستشعر، أو نوع البيانات (مثال: SMAP, ECOSTRESS, رطوبة, أمطار, قمح)...'
                    : 'Search satellite, sensor, or variable (e.g. SMAP, ECOSTRESS, NDVI, Soil)...'
                }
                className="w-full ps-9 pe-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Agency Filter */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 me-1">
                {isAr ? 'الوكالة:' : 'Agency:'}
              </span>
              {agencies.map((agency) => (
                <button
                  key={agency}
                  type="button"
                  onClick={() => setSelectedAgency(agency)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                    selectedAgency === agency
                      ? 'bg-slate-900 text-white dark:bg-emerald-600'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {agency === 'all' ? (isAr ? 'جميع الوكالات' : 'All') : agency}
                </button>
              ))}
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{isAr ? cat.labelAr : cat.labelEn}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Sources Grid */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5">
          {filteredSources.length === 0 ? (
            <div className="py-16 text-center text-slate-500 dark:text-slate-400 space-y-2">
              <Search className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-bold">
                {isAr ? 'لم يتم العثور على مصادر مطابقة لبحثك' : 'No matching data sources found'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedAgency('all');
                  setSearchQuery('');
                }}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                {isAr ? 'إعادة ضبط عوامل التصفية' : 'Reset all filters'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredSources.map((source) => (
                <div
                  key={source.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition-all flex flex-col justify-between gap-3 group"
                >
                  {/* Card Header */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black tracking-wide uppercase bg-slate-900 text-white dark:bg-slate-800">
                            {source.agency}
                          </span>
                          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                            {isAr ? source.categoryLabelAr : source.categoryLabelEn}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                          {isAr ? source.nameAr : source.name}
                        </h3>
                        {isAr && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                            {source.name}
                          </p>
                        )}
                      </div>

                      <a
                        href={source.officialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 text-slate-400 transition shrink-0"
                        title={isAr ? 'فتح البوابة الرسمية للبيانات' : 'Open Official Data Portal'}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>

                    {/* What it measures */}
                    <div className="text-xs text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 space-y-1">
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>{isAr ? 'القياسات والمتغيرات:' : 'Measurements & Variables:'}</span>
                      </div>
                      <p className="text-[11px] leading-relaxed">
                        {isAr ? source.measurementAr : source.measurement}
                      </p>
                    </div>

                    {/* Role in GeoAgri */}
                    <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                        <span>{isAr ? 'الدور في منظومة GeoAgri Pro:' : 'Role in GeoAgri Pro:'}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        {isAr ? source.roleInGeoAgriAr : source.roleInGeoAgri}
                      </p>
                    </div>
                  </div>

                  {/* Card Footer: Resolutions & Status Badge */}
                  <div className="pt-2.5 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <div className="flex items-center gap-2 font-mono text-slate-500 dark:text-slate-400">
                      <span>📏 {source.spatialResolution}</span>
                      <span>•</span>
                      <span>⏱️ {source.temporalResolution}</span>
                    </div>

                    <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${source.badgeColor}`}>
                      {isAr ? source.integrationStatusAr : source.integrationStatusEn}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              {isAr
                ? 'كافة الروابط توجه إلى بوابات NASA Earthdata وESA وUSDA الرسمية.'
                : 'All links point directly to official NASA Earthdata, ESA, and USDA data repositories.'}
            </span>
          </div>

          <div className="flex items-center gap-2 ms-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer shadow-md"
            >
              {isAr ? 'تم وفهمت' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
