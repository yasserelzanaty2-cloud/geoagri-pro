import React from 'react';
import {
  Box,
  Compass,
  Crosshair,
  Eye,
  Mountain,
  Palette,
  RotateCcw,
  RotateCw,
  Thermometer,
} from 'lucide-react';
import {
  ElevationColorPalette,
  ElevationDisplayMode,
  GlobalTemperatureSubMode,
  Language,
  LatLon,
  ThematicMapLayerId,
} from '../types/agro';
import { computeZonePrincipalAlignmentAngle } from '../utils/mapOrientationUtils';

interface MapOrientationControllerProps {
  language: Language;
  rotationDeg: number;
  onChangeRotationDeg: (deg: number) => void;
  viewMode3D: boolean;
  onToggleViewMode3D: () => void;
  pitchDeg: number;
  onChangePitchDeg: (deg: number) => void;
  vertices: LatLon[];
  activeThematicMap: ThematicMapLayerId;
  globalTempSubMode: GlobalTemperatureSubMode;
  onChangeGlobalTempSubMode: (mode: GlobalTemperatureSubMode) => void;
  showGlobalHeatCanvas: boolean;
  onToggleGlobalHeatCanvas: () => void;
  elevationDisplayMode?: ElevationDisplayMode;
  onChangeElevationDisplayMode?: (mode: ElevationDisplayMode) => void;
  elevationPalette?: ElevationColorPalette;
  onChangeElevationPalette?: (palette: ElevationColorPalette) => void;
}

export const MapOrientationController: React.FC<MapOrientationControllerProps> = ({
  language,
  rotationDeg,
  onChangeRotationDeg,
  viewMode3D,
  onToggleViewMode3D,
  pitchDeg,
  onChangePitchDeg,
  vertices,
  activeThematicMap,
  globalTempSubMode,
  onChangeGlobalTempSubMode,
  showGlobalHeatCanvas,
  onToggleGlobalHeatCanvas,
  elevationDisplayMode = '3d_color_only',
  onChangeElevationDisplayMode,
  elevationPalette = 'scientific_hypsometric',
  onChangeElevationPalette,
}) => {
  const isAr = language === 'ar';
  const hasZone = vertices.length >= 3;

  const handleAutoStraightenZone = () => {
    const res = computeZonePrincipalAlignmentAngle(vertices, rotationDeg);
    onChangeRotationDeg(res.recommendedRotationDeg);
  };

  const handleStepRotate = (delta: number) => {
    const next = Math.round(((rotationDeg + delta) % 360 + 360) % 360);
    onChangeRotationDeg(next);
  };

  return (
    <div
      data-testid="map-orientation-controller"
      className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl px-3 py-2 text-white shadow-xl flex flex-wrap items-center justify-between gap-2 text-xs"
    >
      {/* Left / Right Group 1: Compass, 360° Slider & Quick Step Rotation */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Live Rotating Compass Button (Click to Reset North 0°) */}
        <button
          type="button"
          data-testid="compass-reset-north-btn"
          onClick={() => onChangeRotationDeg(0)}
          title={
            isAr
              ? 'إعادة توجيه الخريطة للشمال القياسي (0°)'
              : 'Reset Map Orientation to North (0°)'
          }
          className={`min-h-[30px] px-2.5 py-1 rounded-xl font-bold flex items-center gap-1.5 border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            rotationDeg !== 0
              ? 'bg-amber-500/20 border-amber-400/60 text-amber-300 hover:bg-amber-500/30'
              : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
          }`}
        >
          <Compass
            className="w-4 h-4 text-emerald-400 transition-transform duration-200"
            style={{ transform: `rotate(${rotationDeg}deg)` }}
          />
          <span className="font-mono tabular-nums">{rotationDeg}°</span>
          <span className="text-[10px] text-slate-300">
            {rotationDeg === 0 ? (isAr ? 'شمال' : 'N') : isAr ? 'تصفير 0°' : 'Reset'}
          </span>
        </button>

        {/* Quick -15° / +15° / 90° Rotation Buttons */}
        <div className="flex items-center gap-1 bg-slate-950/90 border border-slate-800 rounded-xl p-0.5">
          <button
            type="button"
            data-testid="rotate-left-15-btn"
            onClick={() => handleStepRotate(-15)}
            title={isAr ? 'تدوير لليسار 15°' : 'Rotate Counter-Clockwise 15°'}
            className="px-2 py-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="font-mono tabular-nums text-[10px]">-15°</span>
          </button>

          <input
            type="range"
            data-testid="map-rotation-slider"
            min={0}
            max={360}
            step={1}
            value={rotationDeg}
            onChange={(e) => onChangeRotationDeg(Number(e.target.value))}
            aria-label={isAr ? 'تدوير الخريطة 360 درجة' : 'Rotate Map 360 Degrees'}
            className="w-20 sm:w-28 accent-emerald-500 cursor-pointer h-1.5"
          />

          <button
            type="button"
            data-testid="rotate-right-15-btn"
            onClick={() => handleStepRotate(15)}
            title={isAr ? 'تدوير لليمين 15°' : 'Rotate Clockwise 15°'}
            className="px-2 py-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
          >
            <span className="font-mono tabular-nums text-[10px]">+15°</span>
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            data-testid="rotate-90-btn"
            onClick={() => handleStepRotate(90)}
            title={isAr ? 'تدوير ربع دورة 90°' : 'Rotate 90°'}
            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono tabular-nums text-[10px] cursor-pointer whitespace-nowrap shrink-0"
          >
            90°
          </button>
        </div>

        {/* Auto-Straighten Zone Button */}
        <button
          type="button"
          data-testid="auto-straighten-zone-btn"
          disabled={!hasZone}
          onClick={handleAutoStraightenZone}
          title={
            hasZone
              ? isAr
                ? 'تدوير الخريطة تلقائياً بحيث تصبح حدود الزونة المحددة أفقية/عمودية مستقيمة لدراستها بدقة'
                : 'Automatically rotate map so the selected zone boundary aligns straight'
              : isAr
              ? 'ارسم أو اختر زونة أولاً لتفعيل المحاذاة التلقائية'
              : 'Draw or select a zone first to auto-straighten'
          }
          className={`min-h-[30px] px-2.5 py-1 rounded-xl font-bold flex items-center gap-1.5 border transition-all whitespace-nowrap shrink-0 ${
            hasZone
              ? 'bg-emerald-600/25 hover:bg-emerald-600/40 border-emerald-400/60 text-emerald-200 cursor-pointer'
              : 'bg-slate-800/50 border-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
          <span>
            {isAr ? 'محاذاة استقامة الزونة تلقائياً' : 'Auto-Straighten Zone'}
          </span>
        </button>
      </div>

      {/* Group 2: View Mode (2D Flat vs 3D Perspective Tilt) + Global Temperature / 3D Elevation Sub-Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Dual Global Temperature Switcher when Temperature Map is Active */}
        {activeThematicMap === 'temperature' && (
          <div
            data-testid="global-temp-submode-switcher"
            className="flex items-center gap-1 bg-slate-950/90 border border-amber-500/40 rounded-xl p-0.5"
          >
            <Thermometer className="w-3.5 h-3.5 text-amber-400 ms-1.5" />
            <button
              type="button"
              data-testid="temp-submode-surface-btn"
              onClick={() => onChangeGlobalTempSubMode('surface_lst')}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                globalTempSubMode === 'surface_lst'
                  ? 'bg-amber-600 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {isAr ? 'حرارة السطح والتربة (LST)' : 'Surface & Soil (LST)'}
            </button>
            <button
              type="button"
              data-testid="temp-submode-air-btn"
              onClick={() => onChangeGlobalTempSubMode('air_2m')}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                globalTempSubMode === 'air_2m'
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {isAr ? 'حرارة الهواء (2m)' : 'Air Temp (2m)'}
            </button>
          </div>
        )}

        {/* 3D Elevation Display Mode & Color Palette Controls when Elevation Map is Active */}
        {activeThematicMap === 'elevation' && (
          <>
            {onChangeElevationDisplayMode && (
              <div
                data-testid="elevation-display-mode-switcher"
                className="flex items-center gap-1 bg-slate-950/90 border border-emerald-500/40 rounded-xl p-0.5"
              >
                <Mountain className="w-3.5 h-3.5 text-emerald-400 ms-1.5 shrink-0" />
                <button
                  type="button"
                  data-testid="elev-mode-3d-only-btn"
                  onClick={() => onChangeElevationDisplayMode('3d_color_only')}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    elevationDisplayMode === '3d_color_only'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {isAr ? 'تضاريس 3D متدرجة (بدون خطوط)' : '3D Stepped Relief'}
                </button>
                <button
                  type="button"
                  data-testid="elev-mode-3d-contours-btn"
                  onClick={() => onChangeElevationDisplayMode('3d_contours')}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    elevationDisplayMode === '3d_contours'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {isAr ? '3D + كنتور' : '3D + Contours'}
                </button>
                <button
                  type="button"
                  data-testid="elev-mode-contours-only-btn"
                  onClick={() => onChangeElevationDisplayMode('contours_only')}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    elevationDisplayMode === 'contours_only'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {isAr ? 'كنتور فقط' : 'Contours Only'}
                </button>
              </div>
            )}

            {onChangeElevationPalette && (
              <div
                data-testid="elevation-palette-switcher"
                className="flex items-center gap-1 bg-slate-950/90 border border-amber-500/40 rounded-xl p-0.5"
              >
                <Palette className="w-3.5 h-3.5 text-amber-400 ms-1.5 shrink-0" />
                <button
                  type="button"
                  data-testid="elev-palette-scientific-btn"
                  onClick={() => onChangeElevationPalette('scientific_hypsometric')}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    elevationPalette === 'scientific_hypsometric'
                      ? 'bg-amber-600 text-white'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {isAr ? 'تدرج علمي' : 'Scientific Ramp'}
                </button>
                <button
                  type="button"
                  data-testid="elev-palette-classic-btn"
                  onClick={() => onChangeElevationPalette('classic_topographic')}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    elevationPalette === 'classic_topographic'
                      ? 'bg-amber-700 text-white'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {isAr ? 'تدرج طوبوغرافي' : 'Classic Topo'}
                </button>
              </div>
            )}
          </>
        )}

        {/* Toggle Global Continuous Heatmap Overlay for Temperature or Elevation */}
        {(activeThematicMap === 'temperature' || activeThematicMap === 'elevation') && (
          <button
            type="button"
            data-testid="toggle-global-field-overlay-btn"
            onClick={onToggleGlobalHeatCanvas}
            className={`min-h-[30px] px-2.5 py-1 rounded-xl font-bold flex items-center gap-1.5 border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              showGlobalHeatCanvas
                ? 'bg-sky-600/30 border-sky-400 text-sky-200'
                : 'bg-slate-800 border-slate-700 text-slate-300'
            }`}
          >
            {activeThematicMap === 'elevation' ? (
              <Mountain className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Eye className="w-3.5 h-3.5 text-sky-400" />
            )}
            <span>
              {activeThematicMap === 'elevation'
                ? isAr
                  ? showGlobalHeatCanvas
                    ? 'طبقة التضاريس: مفعلة'
                    : 'طبقة التضاريس: مخفية'
                  : showGlobalHeatCanvas
                  ? '3D Relief Layer: ON'
                  : '3D Relief Layer: OFF'
                : isAr
                ? 'التدرج الحراري العالمي: مفعل'
                : 'Global Thermal Field: ON'}
            </span>
          </button>
        )}

        {/* 2D Ortho / 3D Perspective Tilt View Mode Toggle */}
        <div className="flex items-center gap-1.5 bg-slate-950/90 border border-slate-800 rounded-xl px-1.5 py-0.5">
          <button
            type="button"
            data-testid="toggle-3d-tilt-btn"
            onClick={onToggleViewMode3D}
            className={`min-h-[26px] px-2.5 py-0.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              viewMode3D
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>
              {viewMode3D
                ? isAr
                  ? `منظور 3D (${pitchDeg}°)`
                  : `3D Tilt (${pitchDeg}°)`
                : isAr
                ? 'وضع العرض: مسطح 2D / 3D'
                : 'View: 2D / 3D Tilt'}
            </span>
          </button>

          {viewMode3D && (
            <input
              type="range"
              data-testid="map-pitch-slider"
              min={15}
              max={55}
              step={5}
              value={pitchDeg}
              onChange={(e) => onChangePitchDeg(Number(e.target.value))}
              title={isAr ? 'زاوية ميل المنظور ثلاثي الأبعاد' : '3D Tilt Pitch Angle'}
              className="w-16 accent-indigo-500 cursor-pointer h-1.5"
            />
          )}
        </div>
      </div>
    </div>
  );
};

