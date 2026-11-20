import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Compass,
  MapPin,
  Crosshair,
  Navigation,
  Plus,
  Trash2,
  Check,
  X,
  Satellite,
  Radio,
  FileText,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Share2,
} from 'lucide-react';
import { LatLon } from '../types/agro';
import { calculateGeodesicArea } from '../utils/agroEngine';

export interface FarmBoundaryGpsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'ar' | 'en';
  onConfirmBoundary: (vertices: LatLon[]) => void;
  initialLocation?: LatLon | null;
}

interface RecordedGpsPoint extends LatLon {
  accuracyMeters?: number;
  timestamp: number;
}

/**
 * Calculates Great-Circle distance in meters between two lat/lng points.
 */
function computeHaversineDistanceMeters(p1: LatLon, p2: LatLon): number {
  const R = 6371008.8; // Earth radius in meters
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.lat * Math.PI) / 180) *
      Math.cos((p2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Parses a single line or coordinate string into { lat, lng }
 */
function parseSingleCoordinateLine(raw: string): LatLon | null {
  const text = raw.trim();
  if (!text) return null;

  // 1. DMS Check: e.g. 30°49'30.5"N 31°15'14.8"E
  const dmsRegex = /(\d+)[°\s]+(\d+)['\s]+([\d.]+)?["\s]*([NSEWnsew])?/g;
  const dmsMatches = [...text.matchAll(dmsRegex)];
  if (dmsMatches.length >= 2) {
    const parseDms = (m: RegExpMatchArray) => {
      const deg = parseFloat(m[1]) || 0;
      const min = parseFloat(m[2]) || 0;
      const sec = parseFloat(m[3]) || 0;
      const dir = (m[4] || '').toUpperCase();
      let dec = deg + min / 60 + sec / 3600;
      if (dir === 'S' || dir === 'W') dec = -dec;
      return { dec, dir };
    };
    const c1 = parseDms(dmsMatches[0]);
    const c2 = parseDms(dmsMatches[1]);
    if (c1.dir === 'E' || c1.dir === 'W') {
      return { lat: c2.dec, lng: c1.dec };
    }
    return { lat: c1.dec, lng: c2.dec };
  }

  // 2. Google Maps URL or standard decimal: "30.825142, 31.254115"
  const decRegex = /(-?\d{1,3}(?:\.\d+)?)[,\s\t]+(-?\d{1,3}(?:\.\d+)?)/;
  const m = decRegex.exec(text);
  if (m) {
    const num1 = parseFloat(m[1]);
    const num2 = parseFloat(m[2]);
    if (!isNaN(num1) && !isNaN(num2)) {
      // Auto-detect and swap if user pasted lng, lat in North Africa/Middle East
      if (num1 > 35 && num2 >= 20 && num2 <= 35) {
        return { lat: num2, lng: num1 };
      }
      if (Math.abs(num1) <= 90 && Math.abs(num2) <= 180) {
        return { lat: num1, lng: num2 };
      }
    }
  }

  return null;
}

/**
 * Parses multi-line block of coordinates
 */
function parseBulkCoordinatesBlock(text: string): LatLon[] {
  const lines = text.split(/[\r\n]+/);
  const result: LatLon[] = [];
  for (const line of lines) {
    const pt = parseSingleCoordinateLine(line);
    if (pt) {
      result.push(pt);
    }
  }
  return result;
}

export const FarmBoundaryGpsModal: React.FC<FarmBoundaryGpsModalProps> = ({
  isOpen,
  onClose,
  language,
  onConfirmBoundary,
  initialLocation,
}) => {
  const isAr = language === 'ar';
  const [activeTab, setActiveTab] = useState<'gps_field' | 'manual_coords'>('gps_field');
  const [manualInputMode, setManualInputMode] = useState<'paste' | 'table'>('paste');

  // --- GPS FIELD SURVEYOR STATE ---
  const [liveGpsCoords, setLiveGpsCoords] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
    altitude: number | null;
  } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<
    'idle' | 'searching' | 'active' | 'denied' | 'unavailable' | 'timeout'
  >('idle');
  const [recordedGpsPoints, setRecordedGpsPoints] = useState<RecordedGpsPoint[]>([]);
  const [lastRecordedCornerTime, setLastRecordedCornerTime] = useState<number>(0);
  const watchIdRef = useRef<number | null>(null);

  // --- MANUAL COORDS STATE ---
  const [bulkText, setBulkText] = useState('');
  const [tablePoints, setTablePoints] = useState<Array<{ lat: string; lng: string }>>([
    { lat: '', lng: '' },
    { lat: '', lng: '' },
    { lat: '', lng: '' },
  ]);

  // Start live GPS watching when Tab is 'gps_field' and modal is open
  useEffect(() => {
    if (!isOpen || activeTab !== 'gps_field') {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    if (!navigator.geolocation) {
      setGpsStatus('unavailable');
      return;
    }

    setGpsStatus('searching');

    // First do an immediate getCurrentPosition
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLiveGpsCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          altitude: pos.coords.altitude,
        });
        setGpsStatus('active');
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setGpsStatus('denied');
        } else if (err.code === err.TIMEOUT) {
          setGpsStatus('timeout');
        } else {
          setGpsStatus('unavailable');
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );

    // Watch position continuously as the farmer walks
    const wid = navigator.geolocation.watchPosition(
      (pos) => {
        setLiveGpsCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          altitude: pos.coords.altitude,
        });
        setGpsStatus('active');
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setGpsStatus('denied');
        }
      },
      { enableHighAccuracy: true, maximumAge: 1000 }
    );
    watchIdRef.current = wid;

    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isOpen, activeTab]);

  // Action: Record current GPS point
  const handleRecordCurrentGpsCorner = () => {
    if (!liveGpsCoords) return;

    // Optional haptic vibration feedback on phones
    try {
      if (navigator.vibrate) {
        navigator.vibrate([80, 40, 80]);
      }
    } catch {}

    const newPoint: RecordedGpsPoint = {
      lat: Number(liveGpsCoords.lat.toFixed(6)),
      lng: Number(liveGpsCoords.lng.toFixed(6)),
      accuracyMeters: Math.round(liveGpsCoords.accuracy),
      timestamp: Date.now(),
    };

    setRecordedGpsPoints((prev) => [...prev, newPoint]);
    setLastRecordedCornerTime(Date.now());
  };

  // Action: Remove specific recorded corner
  const handleRemoveGpsCorner = (idx: number) => {
    setRecordedGpsPoints((prev) => prev.filter((_, i) => i !== idx));
  };

  // Action: Undo last corner
  const handleUndoLastGpsCorner = () => {
    setRecordedGpsPoints((prev) => prev.slice(0, -1));
  };

  // Action: Clear all GPS corners
  const handleClearGpsCorners = () => {
    setRecordedGpsPoints([]);
  };

  // Compute live area for GPS points
  const gpsAreaBreakdown = useMemo(() => {
    if (recordedGpsPoints.length < 3) return null;
    return calculateGeodesicArea(recordedGpsPoints);
  }, [recordedGpsPoints]);

  // Compute perimeter and segment distances
  const gpsSegments = useMemo(() => {
    if (recordedGpsPoints.length < 2) return [];
    const segs: Array<{ fromIdx: number; toIdx: number; distMeters: number }> = [];
    for (let i = 0; i < recordedGpsPoints.length - 1; i++) {
      const d = computeHaversineDistanceMeters(recordedGpsPoints[i], recordedGpsPoints[i + 1]);
      segs.push({ fromIdx: i + 1, toIdx: i + 2, distMeters: d });
    }
    // Closing segment back to start
    if (recordedGpsPoints.length >= 3) {
      const dClosing = computeHaversineDistanceMeters(
        recordedGpsPoints[recordedGpsPoints.length - 1],
        recordedGpsPoints[0]
      );
      segs.push({
        fromIdx: recordedGpsPoints.length,
        toIdx: 1,
        distMeters: dClosing,
      });
    }
    return segs;
  }, [recordedGpsPoints]);

  const totalGpsPerimeterMeters = useMemo(() => {
    return gpsSegments.reduce((sum, s) => sum + s.distMeters, 0);
  }, [gpsSegments]);

  // --- MANUAL COORDS PARSING ---
  const parsedManualPoints: LatLon[] = useMemo(() => {
    if (manualInputMode === 'paste') {
      return parseBulkCoordinatesBlock(bulkText);
    } else {
      return tablePoints
        .map((p) => {
          const lat = parseFloat(p.lat.trim());
          const lng = parseFloat(p.lng.trim());
          if (!isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
            return { lat, lng };
          }
          return null;
        })
        .filter((p): p is LatLon => p !== null);
    }
  }, [manualInputMode, bulkText, tablePoints]);

  const manualAreaBreakdown = useMemo(() => {
    if (parsedManualPoints.length < 3) return null;
    return calculateGeodesicArea(parsedManualPoints);
  }, [parsedManualPoints]);

  // Handle final submission
  const handleConfirmAndDraw = () => {
    const finalPoints = activeTab === 'gps_field' ? recordedGpsPoints : parsedManualPoints;
    if (finalPoints.length < 3) return;

    onConfirmBoundary(
      finalPoints.map((p) => ({
        lat: p.lat,
        lng: p.lng,
      }))
    );
    onClose();
  };

  // Sample templates for users to test
  const handleLoadSample = (sampleType: 'delta' | 'toshka') => {
    if (sampleType === 'delta') {
      setBulkText(`30.825120, 31.254100
30.825150, 31.256250
30.823600, 31.256200
30.823570, 31.254110`);
    } else {
      setBulkText(`22.651200, 31.542100
22.651250, 31.547500
22.646800, 31.547400
22.646750, 31.542050`);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl max-h-[92dvh] flex flex-col bg-slate-900 border border-emerald-500/40 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.85)] text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/15 border border-amber-400/40 text-amber-400 flex items-center justify-center shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>{isAr ? 'تحديد حدود المزرعة بدقة' : 'Define Farm Boundaries'}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  {isAr ? 'GPS الحقل & إحداثيات' : 'Field GPS & Coordinates'}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {isAr
                  ? 'امشِ بهاتفك على أركان الأرض لتسجيلها ميدانياً، أو أدخل إحداثياتك المسجلة'
                  : 'Walk parcel corners with phone GPS, or enter surveying coordinates'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
            title={isAr ? 'إغلاق' : 'Close'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="p-3 border-b border-slate-800 bg-slate-950/40 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('gps_field')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
              activeTab === 'gps_field'
                ? 'bg-emerald-600 border-emerald-400 text-white shadow-md shadow-emerald-900/50'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Radio className="w-4 h-4 text-emerald-200" />
            <span>{isAr ? '📡 تسجيل أركان المزرعة بالهاتف (GPS الحقل)' : '📡 Field GPS Walk Mode'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('manual_coords')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
              activeTab === 'manual_coords'
                ? 'bg-sky-600 border-sky-400 text-white shadow-md shadow-sky-900/50'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4 text-sky-200" />
            <span>{isAr ? '⌨️ إدخال الإحداثيات (أرقام أو نسخ ولصق)' : '⌨️ Enter Coordinates Manually'}</span>
          </button>
        </div>

        {/* Tab 1 Content: GPS Field Surveyor */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {activeTab === 'gps_field' ? (
            <div className="space-y-4">
              {/* GPS Live Telemetry Status Banner */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative flex items-center justify-center">
                    <div
                      className={`w-3.5 h-3.5 rounded-full ${
                        gpsStatus === 'active'
                          ? 'bg-emerald-400'
                          : gpsStatus === 'searching'
                          ? 'bg-amber-400 animate-ping'
                          : 'bg-rose-500'
                      }`}
                    />
                    {gpsStatus === 'active' && (
                      <div className="absolute w-6 h-6 rounded-full bg-emerald-400/20 animate-pulse" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>{isAr ? 'نظام التموضع العالمي (GPS):' : 'Satellite GPS Status:'}</span>
                      {gpsStatus === 'active' && (
                        <span className="text-emerald-400 font-bold">
                          {isAr ? 'متصل وجاهز للرصد' : 'Connected & Active'}
                        </span>
                      )}
                      {gpsStatus === 'searching' && (
                        <span className="text-amber-400">
                          {isAr ? 'جاري التقاط إشارة الأقمار الصناعية...' : 'Acquiring satellites...'}
                        </span>
                      )}
                      {gpsStatus === 'denied' && (
                        <span className="text-rose-400">
                          {isAr ? 'تم رفض إذن الوصول للموقع' : 'Location permission denied'}
                        </span>
                      )}
                      {gpsStatus === 'unavailable' && (
                        <span className="text-rose-400">
                          {isAr ? 'مستشعر GPS غير متاح' : 'GPS sensor unavailable'}
                        </span>
                      )}
                    </span>

                    {liveGpsCoords && (
                      <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                        {isAr ? 'الموقع الحالي:' : 'Live:'} {liveGpsCoords.lat.toFixed(6)}° N,{' '}
                        {liveGpsCoords.lng.toFixed(6)}° E
                        {liveGpsCoords.altitude !== null && (
                          <span className="ms-2">
                            ({isAr ? 'الارتفاع:' : 'Alt:'} {Math.round(liveGpsCoords.altitude)} م)
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                </div>

                {liveGpsCoords && (
                  <div
                    className={`px-3 py-1 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 border ${
                      liveGpsCoords.accuracy <= 5
                        ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                        : liveGpsCoords.accuracy <= 15
                        ? 'bg-amber-950/80 border-amber-500/50 text-amber-300'
                        : 'bg-rose-950/80 border-rose-500/50 text-rose-300'
                    }`}
                  >
                    <Satellite className="w-3.5 h-3.5" />
                    <span>
                      {isAr ? 'دقة الرصد: ±' : 'Accuracy: ±'}
                      {liveGpsCoords.accuracy.toFixed(1)} {isAr ? 'متر' : 'm'}
                    </span>
                  </div>
                )}
              </div>

              {/* Farmer Field Walking Instructions */}
              <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-200 flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  {isAr ? (
                    <>
                      <strong>كيفية استخدام GPS الحقل:</strong> قف بهاتفك عند <strong>الركن الأول</strong> لأرضك واضغط الزر أدناه لتسجيله. ثم امشِ بمحاذاة الحد للركن الثاني وسجله، واستمر في المشي حتى تسجل جميع أركان مزرعتك بالتسلسل.
                    </>
                  ) : (
                    <>
                      <strong>How to use Field GPS:</strong> Walk with your phone to <strong>Corner 1</strong> of your parcel and press the button below. Then walk along the boundary to Corner 2 and record it, continuing around all corners in order.
                    </>
                  )}
                </p>
              </div>

              {/* Big Touch Button to Record Corner */}
              <button
                type="button"
                onClick={handleRecordCurrentGpsCorner}
                disabled={!liveGpsCoords}
                className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/60 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                <MapPin className="w-5 h-5 text-amber-300 animate-bounce" />
                <span>
                  {isAr
                    ? `📍 تسجيل موقعي الحالي (الركن رقم ${recordedGpsPoints.length + 1})`
                    : `📍 Record Current Location (Corner #${recordedGpsPoints.length + 1})`}
                </span>
              </button>

              {/* Recorded Corners List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300 px-1">
                  <span>
                    {isAr
                      ? `الأركان المسجلة حتى الآن (${recordedGpsPoints.length}):`
                      : `Recorded Corners (${recordedGpsPoints.length}):`}
                  </span>
                  {recordedGpsPoints.length > 0 && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleUndoLastGpsCorner}
                        className="text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>{isAr ? 'تراجع عن آخر ركن' : 'Undo last'}</span>
                      </button>
                      <span className="text-slate-600">|</span>
                      <button
                        type="button"
                        onClick={handleClearGpsCorners}
                        className="text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>{isAr ? 'مسح الكل' : 'Clear all'}</span>
                      </button>
                    </div>
                  )}
                </div>

                {recordedGpsPoints.length === 0 ? (
                  <div className="p-6 text-center border-2 border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs">
                    {isAr
                      ? 'لم يتم تسجيل أي ركن بعد — قف عند ركن المزرعة الأول واضغط الزر الأخضر أعلاه'
                      : 'No corners recorded yet — stand at your first farm corner and tap the green button above'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                    {recordedGpsPoints.map((pt, idx) => {
                      const segDist =
                        idx > 0
                          ? computeHaversineDistanceMeters(recordedGpsPoints[idx - 1], pt)
                          : null;
                      return (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-[11px] shrink-0">
                              {idx + 1}
                            </span>
                            <div>
                              <p className="font-mono text-white text-[11px]">
                                {pt.lat.toFixed(6)}, {pt.lng.toFixed(6)}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {segDist !== null ? (
                                  <span className="text-emerald-400">
                                    {isAr ? `طول الضلع السابق: ${segDist} م` : `Prev edge: ${segDist} m`}
                                  </span>
                                ) : (
                                  <span className="text-sky-300 font-medium">
                                    {isAr ? 'نقطة الانطلاق (الركن 1)' : 'Starting corner'}
                                  </span>
                                )}
                                {pt.accuracyMeters && ` · ±${pt.accuracyMeters}م`}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveGpsCorner(idx)}
                            className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                            title={isAr ? 'حذف هذا الركن' : 'Delete corner'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Live Area Breakdown Preview */}
              {gpsAreaBreakdown && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-950 to-teal-950/80 border border-emerald-500/40 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>{isAr ? 'المساحة المحسوبة من الأركان:' : 'Calculated Farm Area:'}</span>
                    </span>
                    <span className="font-mono text-xs text-slate-400">
                      {isAr ? 'المحيط:' : 'Perimeter:'} {totalGpsPerimeterMeters} {isAr ? 'متر' : 'm'}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold font-mono text-white tabular-nums">
                      {gpsAreaBreakdown.totalFeddansDecimal.toFixed(2)}
                    </span>
                    <span className="text-sm font-bold text-emerald-300">
                      {isAr ? 'فدان' : 'Feddans'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono ms-2">
                      ({gpsAreaBreakdown.feddans} {isAr ? 'فدان' : 'Fed'} · {gpsAreaBreakdown.qirats}{' '}
                      {isAr ? 'قيراط' : 'Qir'} · {gpsAreaBreakdown.sahms} {isAr ? 'سهم' : 'Sahm'})
                    </span>
                    <span className="text-xs text-slate-500 font-mono ms-auto">
                      {gpsAreaBreakdown.squareMeters.toLocaleString()} م²
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Tab 2 Content: Manual Coordinates Input & Paste */
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-300">
                  {isAr ? 'طريقة إدخال الإحداثيات:' : 'Input Method:'}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setManualInputMode('paste')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer border ${
                      manualInputMode === 'paste'
                        ? 'bg-sky-600 border-sky-400 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    {isAr ? '📋 نسخ ولصق سريع' : '📋 Bulk Paste'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualInputMode('table')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer border ${
                      manualInputMode === 'table'
                        ? 'bg-sky-600 border-sky-400 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    {isAr ? '✍️ جدول خطوة بخطوة' : '✍️ Table Rows'}
                  </button>
                </div>
              </div>

              {manualInputMode === 'paste' ? (
                <div className="space-y-2">
                  <label className="block text-xs text-slate-300 font-semibold">
                    {isAr
                      ? 'الصق إحداثيات أركان المزرعة (سطر لكل نقطة أو مفصولة بفواصل):'
                      : 'Paste corner coordinates (one line per point):'}
                  </label>
                  <textarea
                    rows={6}
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    placeholder={`30.825120, 31.254100\n30.825150, 31.256250\n30.823600, 31.256200\n30.823570, 31.254110`}
                    className="w-full font-mono text-xs bg-slate-950 border border-slate-700 focus:border-sky-400 rounded-xl p-3 text-white outline-none placeholder:text-slate-600 leading-relaxed"
                  />

                  {/* Sample coordinates buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[11px] text-slate-500 font-medium">
                      {isAr ? 'أمثلة جاهزة للتجربة:' : 'Quick samples:'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleLoadSample('delta')}
                      className="px-2 py-0.5 rounded-md text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer border border-white/10"
                    >
                      {isAr ? 'مزرعة بالدلتا (4.8 فدان)' : 'Delta Farm (4.8 Fed)'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLoadSample('toshka')}
                      className="px-2 py-0.5 rounded-md text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer border border-white/10"
                    >
                      {isAr ? 'مشروع توشكى (62 فدان)' : 'Toshka Farm (62 Fed)'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Step-by-step table */
                <div className="space-y-2">
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {tablePoints.map((row, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        <span className="w-6 h-6 rounded-lg bg-sky-950 border border-sky-400/40 text-sky-300 font-bold flex items-center justify-center text-[10px] shrink-0">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          placeholder={isAr ? 'خط العرض (Lat: 30.825)' : 'Latitude'}
                          value={row.lat}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTablePoints((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, lat: val } : item))
                            );
                          }}
                          className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 font-mono text-white text-xs outline-none focus:border-sky-400"
                        />
                        <input
                          type="text"
                          placeholder={isAr ? 'خط الطول (Lng: 31.254)' : 'Longitude'}
                          value={row.lng}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTablePoints((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, lng: val } : item))
                            );
                          }}
                          className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 font-mono text-white text-xs outline-none focus:border-sky-400"
                        />
                        {tablePoints.length > 3 && (
                          <button
                            type="button"
                            onClick={() =>
                              setTablePoints((prev) => prev.filter((_, i) => i !== idx))
                            }
                            className="p-1.5 text-slate-500 hover:text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setTablePoints((prev) => [...prev, { lat: '', lng: '' }])}
                    className="w-full py-1.5 rounded-xl border border-dashed border-slate-700 hover:border-sky-400 text-slate-400 hover:text-sky-300 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isAr ? '+ إضافة ركن إضافي' : '+ Add Another Corner'}</span>
                  </button>
                </div>
              )}

              {/* Status and Parsed Points Preview */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  {isAr ? 'النقاط التي تم التعرف عليها:' : 'Valid parsed corners:'}{' '}
                  <strong className="text-white font-mono">{parsedManualPoints.length}</strong>{' '}
                  {isAr ? 'أركان' : 'points'}
                </span>
                {parsedManualPoints.length < 3 && (
                  <span className="text-amber-400 text-[11px] flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{isAr ? 'مطلوب 3 أركان على الأقل لإغلاق المزرعة' : 'Min 3 points required'}</span>
                  </span>
                )}
              </div>

              {manualAreaBreakdown && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-950/80 via-slate-950 to-teal-950/80 border border-sky-500/40 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-sky-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-sky-400" />
                      <span>{isAr ? 'المساحة المحسوبة من الإحداثيات:' : 'Calculated Farm Area:'}</span>
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold font-mono text-white tabular-nums">
                      {manualAreaBreakdown.totalFeddansDecimal.toFixed(2)}
                    </span>
                    <span className="text-sm font-bold text-sky-300">
                      {isAr ? 'فدان' : 'Feddans'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono ms-2">
                      ({manualAreaBreakdown.feddans} {isAr ? 'فدان' : 'Fed'} ·{' '}
                      {manualAreaBreakdown.qirats} {isAr ? 'قيراط' : 'Qir'} ·{' '}
                      {manualAreaBreakdown.sahms} {isAr ? 'سهم' : 'Sahm'})
                    </span>
                    <span className="text-xs text-slate-500 font-mono ms-auto">
                      {manualAreaBreakdown.squareMeters.toLocaleString()} م²
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Confirmation Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>

          <button
            type="button"
            onClick={handleConfirmAndDraw}
            disabled={
              activeTab === 'gps_field'
                ? recordedGpsPoints.length < 3
                : parsedManualPoints.length < 3
            }
            className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Check className="w-4 h-4" />
            <span>
              {isAr
                ? `اعتماد وحفظ حدود المزرعة (${
                    activeTab === 'gps_field'
                      ? recordedGpsPoints.length
                      : parsedManualPoints.length
                  } أركان)`
                : `Confirm & Draw Farm (${
                    activeTab === 'gps_field'
                      ? recordedGpsPoints.length
                      : parsedManualPoints.length
                  } corners)`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
