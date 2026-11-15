import {
  AreaBreakdown,
  CustomRotationEvaluation,
  DailyWeatherPoint,
  Language,
  LatLon,
  ScoredCropRecommendation,
  SeasonalMonthPrediction,
  SoilProfile,
  SpectralIndexKey,
  SubZoneSummary,
  ZoneCustomRotationPlan,
} from '../types/agro';
import { CROP_DATABASE } from './agroEngine';

export interface FarmReportPayload {
  language: Language;
  zoneNameAr: string;
  zoneNameEn: string;
  centroid: LatLon;
  area: AreaBreakdown;
  soil: SoilProfile;
  farmAverages: Record<SpectralIndexKey, number>;
  subZones: SubZoneSummary[];
  forecast14: DailyWeatherPoint[];
  seasonal6Months: SeasonalMonthPrediction[];
  topCrops: ScoredCropRecommendation[];
  customRotationPlans: Record<'A' | 'B' | 'C', ZoneCustomRotationPlan>;
  rotationEvaluations: Record<'A' | 'B' | 'C', CustomRotationEvaluation>;
}

/**
 * Pure helper that wraps a JPEG byte array (or generates a valid text-stream PDF if no image is supplied)
 * into a 100% standards-compliant ISO-32000 %PDF-1.4 binary Uint8Array.
 */
export function buildValidPdfDocumentBytes(
  summaryAsciiLines: string[],
  jpegBytes?: Uint8Array,
  imgWidth = 1240,
  imgHeight = 1754
): Uint8Array {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  let offset = 0;
  const xrefOffsets: number[] = [0]; // object 0

  const pushStr = (str: string) => {
    const bytes = encoder.encode(str);
    chunks.push(bytes);
    offset += bytes.length;
  };

  const pushBytes = (bytes: Uint8Array) => {
    chunks.push(bytes);
    offset += bytes.length;
  };

  const startObj = (id: number) => {
    xrefOffsets[id] = offset;
    pushStr(`${id} 0 obj\n`);
  };

  const endObj = () => {
    pushStr(`\nendobj\n`);
  };

  pushStr(`%PDF-1.4\n%\xE2\xE3\xCF\xD3\n`);

  // Object 1: Catalog
  startObj(1);
  pushStr(`<< /Type /Catalog /Pages 2 0 R >>`);
  endObj();

  // Object 2: Pages
  startObj(2);
  pushStr(`<< /Type /Pages /Kids [3 0 R] /Count 1 >>`);
  endObj();

  if (jpegBytes && jpegBytes.length > 0) {
    // Page 1 renders the high-res bilingual canvas image across A4 (595 x 842 pt)
    startObj(3);
    pushStr(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im0 4 0 R >> /Font << /F1 6 0 R >> >> /Contents 5 0 R >>`
    );
    endObj();

    // Object 4: XObject Image (DCTDecode JPEG)
    startObj(4);
    pushStr(
      `<< /Type /XObject /Subtype /Image /Width ${imgWidth} /Height ${imgHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`
    );
    pushBytes(jpegBytes);
    pushStr(`\nendstream`);
    endObj();

    // Object 5: Content stream drawing the full-page report image
    const contentStream = `q\n595 0 0 842 0 0 cm\n/Im0 Do\nQ\n`;
    startObj(5);
    pushStr(`<< /Length ${contentStream.length} >>\nstream\n${contentStream}endstream`);
    endObj();

    // Object 6: Standard Helvetica Font
    startObj(6);
    pushStr(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`);
    endObj();
  } else {
    // Pure ASCII PDF fallback (used in Node.js unit tests where HTMLCanvasElement is absent)
    startObj(3);
    pushStr(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>`
    );
    endObj();

    const safeLines = summaryAsciiLines.map((l) =>
      l.replace(/[()\\]/g, '').replace(/[^\x20-\x7E]/g, ' ')
    );
    const textOps = [
      'BT',
      '/F1 11 Tf',
      '40 800 Td',
      '15 TL',
      ...safeLines.map((line) => `(${line}) Tj T*`),
      'ET',
    ].join('\n');

    startObj(4);
    pushStr(`<< /Length ${textOps.length} >>\nstream\n${textOps}\nendstream`);
    endObj();

    startObj(5);
    pushStr(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`);
    endObj();
  }

  const startXrefOffset = offset;
  const objCount = xrefOffsets.length;
  pushStr(`xref\n0 ${objCount}\n`);
  pushStr(`0000000000 65535 f \n`);
  for (let i = 1; i < objCount; i++) {
    const padded = String(xrefOffsets[i] ?? 0).padStart(10, '0');
    pushStr(`${padded} 00000 n \n`);
  }
  pushStr(
    `trailer\n<< /Size ${objCount} /Root 1 0 R >>\nstartxref\n${startXrefOffset}\n%%EOF\n`
  );

  const totalLen = chunks.reduce((acc, c) => acc + c.length, 0);
  const result = new Uint8Array(totalLen);
  let pos = 0;
  for (const c of chunks) {
    result.set(c, pos);
    pos += c.length;
  }
  return result;
}

/**
 * Builds structured summary lines for the farm report (used for both PDF metadata and preview).
 */
export function buildReportSummaryLines(payload: FarmReportPayload): string[] {
  const {
    zoneNameEn,
    centroid,
    area,
    soil,
    farmAverages,
    subZones,
    forecast14,
    topCrops,
    customRotationPlans,
    rotationEvaluations,
  } = payload;

  const rain14d = forecast14.reduce((a, b) => a + b.precipMm, 0).toFixed(1);
  const et014d = forecast14.reduce((a, b) => a + b.et0Mm, 0).toFixed(1);
  const bestCrop = topCrops[0];

  const lines: string[] = [
    `GEOAGRI PRO - PRECISION AGRICULTURE OFFLINE FIELD REPORT`,
    `Generated: ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC`,
    `Farm Zone: ${zoneNameEn}`,
    `Centroid Coordinates: ${centroid.lat.toFixed(4)} N, ${centroid.lng.toFixed(4)} E`,
    `Geodesic Area: ${area.feddans} Feddans, ${area.qirats} Qirats, ${area.sahms} Sahms (${area.hectares} ha / ${area.squareMeters} m2)`,
    `------------------------------------------------------------------------`,
    `1. SOIL PROFILE & REAL-TIME MOISTURE`,
    `Texture: ${soil.texture.toUpperCase()} | Salinity EC: ${soil.salinityEC} dS/m | Soil pH: ${soil.ph} | Irrigation: ${soil.irrigation.toUpperCase()}`,
    `Surface Moisture (0-7cm): ${farmAverages.SM_0_7}% | Root-Zone Moisture (7-28cm): ${farmAverages.SM_7_28}%`,
    `------------------------------------------------------------------------`,
    `2. MULTI-SPECTRAL SATELLITE INDICES (FARM MEAN)`,
    `NDVI: ${farmAverages.NDVI} | NDWI: ${farmAverages.NDWI} | SAVI: ${farmAverages.SAVI} | NDMI: ${farmAverages.NDMI} | EVI: ${farmAverages.EVI} | LST: ${farmAverages.LST} C`,
    ...subZones.map(
      (z) =>
        `Zone ${z.id} (${z.areaFeddans} fed): NDVI ${z.ndvi} | SM(0-7cm) ${z.soilMoisturePct}% | SM(7-28cm) ${z.soilMoistureDeepPct}% | EC ${z.salinityEC} dS/m | pH ${z.soilPh}`
    ),
    `------------------------------------------------------------------------`,
    `3. 14-DAY WEATHER & WATER BALANCE FORECAST`,
    `14-Day Cumulative Rain: ${rain14d} mm | 14-Day Reference ET0: ${et014d} mm`,
    `Top Recommended Crop: ${bestCrop?.crop.nameEn ?? 'Wheat'} (${bestCrop?.suitabilityScore ?? 95}% Suitability, Yield: ${bestCrop?.expectedYieldTonPerFeddan ?? 3.4} t/fed)`,
    `------------------------------------------------------------------------`,
    `4. CUSTOM CROP ROTATION PLAN & SOIL HEALTH SCORES`,
  ];

  (['A', 'B', 'C'] as const).forEach((zId) => {
    const plan = customRotationPlans[zId];
    const evalRes = rotationEvaluations[zId];
    if (plan && evalRes) {
      const seq = plan.slots
        .map((s) => CROP_DATABASE.find((c) => c.id === s.cropId)?.nameEn.split(' (')[0] || s.cropId)
        .join(' -> ');
      lines.push(
        `Zone ${zId} Rotation [Soil Health ${evalRes.soilHealthScore}% | N Balance ${evalRes.nitrogenBalanceKgPerFeddan} kg/fed]: ${seq}`
      );
    }
  });

  return lines;
}

/**
 * Renders a high-resolution bilingual (Arabic + English) visual PDF page on an HTML5 Canvas
 * and triggers an immediate .pdf download for offline field use.
 */
export async function generateAndDownloadFarmPdfReport(
  payload: FarmReportPayload
): Promise<{ filename: string; byteLength: number }> {
  const summaryLines = buildReportSummaryLines(payload);
  const filename = `GeoAgri-Pro-Report-${new Date().toISOString().slice(0, 10)}.pdf`;

  if (typeof document === 'undefined') {
    const bytes = buildValidPdfDocumentBytes(summaryLines);
    return { filename, byteLength: bytes.byteLength };
  }

  const width = 1240;
  const height = 1754;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  let jpegBytes: Uint8Array | undefined;

  if (ctx) {
    // Background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    // Header Banner
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(0, 0, width, 155);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px Cairo, Plus Jakarta Sans, sans-serif';
    ctx.fillText('GeoAgri Pro — التقرير الفني الشامل للمزرعة (للاستخدام الميداني بدون إنترنت)', 48, 62);

    ctx.fillStyle = '#a7f3d0';
    ctx.font = '500 19px IBM Plex Mono, Cairo, sans-serif';
    ctx.fillText(
      `${payload.zoneNameAr}  |  ${payload.centroid.lat.toFixed(4)}°N, ${payload.centroid.lng.toFixed(4)}°E  |  ${new Date().toISOString().slice(0, 10)}`,
      48,
      104
    );
    ctx.fillStyle = '#d1fae5';
    ctx.font = '16px Plus Jakarta Sans, sans-serif';
    ctx.fillText(
      `Offline Precision Agriculture Decision Support Report · Area: ${payload.area.feddans} Feddans, ${payload.area.qirats} Qirats (${payload.area.hectares} ha)`,
      48,
      134
    );

    const drawCard = (x: number, y: number, w: number, h: number, title: string) => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, w, h);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 21px Cairo, Plus Jakarta Sans, sans-serif';
      ctx.fillText(title, x + 22, y + 36);

      ctx.strokeStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(x + 22, y + 50);
      ctx.lineTo(x + w - 22, y + 50);
      ctx.stroke();
    };

    // Section 1: Area & Soil Profile + Real-Time Soil Moisture (0-7cm & 7-28cm)
    drawCard(44, 185, 1152, 215, '01. المساحة الجيوديسية وخصائص التربة ورطوبة الأعماق (Soil Profile, EC, pH & Moisture)');

    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 18px IBM Plex Mono, Cairo, sans-serif';
    ctx.fillText(
      `Area: ${payload.area.feddans} Feddan · ${payload.area.qirats} Qirat · ${payload.area.sahms} Sahm (${payload.area.hectares} Hectares / ${payload.area.squareMeters.toLocaleString()} m²)`,
      68,
      268
    );
    ctx.fillText(
      `Soil Texture: ${payload.soil.texture.toUpperCase()}   |   Salinity (EC): ${payload.farmAverages.SOIL_EC} dS/m   |   Soil pH: ${payload.farmAverages.SOIL_PH}   |   Irrigation: ${payload.soil.irrigation.toUpperCase()}`,
      68,
      308
    );
    ctx.fillStyle = '#0284c7';
    ctx.fillText(
      `Open-Meteo Live Soil Moisture -> Surface (0-7 cm): ${payload.farmAverages.SM_0_7}%   |   Root-Zone (7-28 cm): ${payload.farmAverages.SM_7_28}%`,
      68,
      348
    );
    ctx.fillStyle = '#047857';
    ctx.font = '16px Cairo, sans-serif';
    ctx.fillText(
      `توصية الإصلاح الأرضي (زونا A): ${payload.subZones[0]?.amendmentAr ?? ''}`,
      68,
      382
    );

    // Section 2: Multi-Spectral Indices & Sub-Zone Table
    drawCard(44, 425, 1152, 310, '02. مؤشرات الأقمار الصناعية وتقسيم الزونا (Multi-Spectral Indices & Sub-Zone Diagnostics)');

    const indicesList: Array<{ k: SpectralIndexKey; label: string; unit: string }> = [
      { k: 'NDVI', label: 'NDVI Vigor', unit: '' },
      { k: 'NDWI', label: 'NDWI Water', unit: '' },
      { k: 'SAVI', label: 'SAVI Soil-Adj', unit: '' },
      { k: 'NDMI', label: 'NDMI Root', unit: '' },
      { k: 'EVI', label: 'EVI Biomass', unit: '' },
      { k: 'LST', label: 'LST Thermal', unit: '°C' },
    ];

    indicesList.forEach((item, idx) => {
      const bx = 68 + idx * 184;
      const by = 492;
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(bx, by, 170, 72);
      ctx.fillStyle = '#475569';
      ctx.font = '14px IBM Plex Mono, sans-serif';
      ctx.fillText(item.label, bx + 14, by + 26);
      ctx.fillStyle = '#065f46';
      ctx.font = 'bold 22px IBM Plex Mono, sans-serif';
      ctx.fillText(`${payload.farmAverages[item.k]}${item.unit}`, bx + 14, by + 56);
    });

    payload.subZones.forEach((z, idx) => {
      const zy = 598 + idx * 42;
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 16px IBM Plex Mono, Cairo, sans-serif';
      ctx.fillText(
        `Zone ${z.id} (${z.areaFeddans} fed) — NDVI: ${z.ndvi} | NDWI: ${z.ndwi} | SM(0-7cm): ${z.soilMoisturePct}% | SM(7-28cm): ${z.soilMoistureDeepPct}% | EC: ${z.salinityEC} dS/m | pH: ${z.soilPh} | LST: ${z.lstCelsius}°C`,
        68,
        zy
      );
    });

    // Section 3: Weather Forecast & Water Balance
    drawCard(44, 760, 1152, 260, '03. التنبؤ بالأمطار والميزان المائي لـ 14 يوماً و6 أشهر (Rainfall & Agro-Weather Trends)');

    const rain14 = payload.forecast14.reduce((a, b) => a + b.precipMm, 0).toFixed(1);
    const et014 = payload.forecast14.reduce((a, b) => a + b.et0Mm, 0).toFixed(1);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 18px IBM Plex Mono, Cairo, sans-serif';
    ctx.fillText(
      `14-Day Forecast Total Rain: ${rain14} mm   |   14-Day Reference ET0: ${et014} mm   |   Net Irrigation: ${Math.max(0, Math.round((Number(et014) * 0.9 - Number(rain14) * 0.8) * 4.2))} m³/feddan`,
      68,
      842
    );

    payload.seasonal6Months.slice(0, 6).forEach((m, idx) => {
      const mx = 68 + idx * 184;
      const my = 870;
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(mx, my, 172, 125);
      ctx.strokeStyle = '#cbd5e1';
      ctx.strokeRect(mx, my, 172, 125);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 15px Cairo, sans-serif';
      ctx.fillText(m.monthNameEn, mx + 12, my + 26);
      ctx.fillStyle = '#0284c7';
      ctx.font = 'bold 15px IBM Plex Mono, sans-serif';
      ctx.fillText(`Rain: ${m.predictedRainMm} mm`, mx + 12, my + 52);
      ctx.fillStyle = '#334155';
      ctx.font = '14px IBM Plex Mono, sans-serif';
      ctx.fillText(`${m.avgTempMaxC}°/${m.avgTempMinC}°C`, mx + 12, my + 76);
      ctx.fillStyle = '#047857';
      ctx.font = 'bold 14px IBM Plex Mono, sans-serif';
      ctx.fillText(`Irrig: ${m.supplementalIrrigationM3PerFeddan} m³`, mx + 12, my + 104);
    });

    // Section 4: Top Crop Recommendations & Custom Crop Rotation Plan
    drawCard(44, 1045, 1152, 640, '04. توصيات المحاصيل وخطة الدورة الزراعية المخصصة لكل زونا (Top Crops & Custom Rotation Plan)');

    payload.topCrops.slice(0, 3).forEach((rec, idx) => {
      const ry = 1122 + idx * 45;
      ctx.fillStyle = '#065f46';
      ctx.font = 'bold 17px Cairo, Plus Jakarta Sans, sans-serif';
      ctx.fillText(
        `#${idx + 1} ${rec.crop.nameAr} (${rec.crop.nameEn}) — Match: ${rec.suitabilityScore}% (${rec.gradeLabel}) | Window: ${rec.crop.optimalPlantingStartEn}-${rec.crop.optimalPlantingEndEn} | Yield: ${rec.expectedYieldTonPerFeddan} t/fed`,
        68,
        ry
      );
    });

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 19px Cairo, Plus Jakarta Sans, sans-serif';
    ctx.fillText('Custom 5-Season Crop Rotation Timeline by Zone (Past -> Current -> Planned):', 68, 1280);

    (['A', 'B', 'C'] as const).forEach((zId, idx) => {
      const py = 1320 + idx * 110;
      const plan = payload.customRotationPlans[zId];
      const evalRes = payload.rotationEvaluations[zId];

      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(68, py, 1104, 92);
      ctx.strokeStyle = '#94a3b8';
      ctx.strokeRect(68, py, 1104, 92);

      const seqStr = plan.slots
        .map((s) => {
          const c = CROP_DATABASE.find((item) => item.id === s.cropId);
          return `${s.periodEn.split(' ')[0]}: ${c?.nameEn.split(' (')[0] ?? s.cropId}`;
        })
        .join('   ->   ');

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 16px IBM Plex Mono, sans-serif';
      ctx.fillText(
        `Zone ${zId}  |  Soil Health Score: ${evalRes.soilHealthScore}%  |  Pest Break: ${evalRes.pestBreakScore}%  |  N Balance: ${evalRes.nitrogenBalanceKgPerFeddan > 0 ? '+' : ''}${evalRes.nitrogenBalanceKgPerFeddan} kg N/fed`,
        86,
        py + 30
      );

      ctx.fillStyle = '#047857';
      ctx.font = 'bold 15px IBM Plex Mono, sans-serif';
      ctx.fillText(seqStr, 86, py + 58);

      const firstWarning = evalRes.warnings[0];
      ctx.fillStyle =
        firstWarning?.severity === 'critical'
          ? '#dc2626'
          : firstWarning?.severity === 'warning'
          ? '#d97706'
          : '#059669';
      ctx.font = '14px Cairo, Plus Jakarta Sans, sans-serif';
      ctx.fillText(
        firstWarning ? `${firstWarning.titleAr} — ${firstWarning.titleEn}` : 'No rotation conflicts detected.',
        86,
        py + 82
      );
    });

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    const base64 = dataUrl.split(',')[1];
    if (base64) {
      const binaryStr = atob(base64);
      jpegBytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        jpegBytes[i] = binaryStr.charCodeAt(i);
      }
    }
  }

  const pdfBytes = buildValidPdfDocumentBytes(summaryLines, jpegBytes, width, height);
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 5000);

  return { filename, byteLength: pdfBytes.byteLength };
}
