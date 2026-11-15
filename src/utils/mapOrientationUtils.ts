import { LatLon } from '../types/agro';

export interface ZoneAlignmentResult {
  longestEdgeLengthMeters: number;
  edgeAngleScreenDeg: number;
  recommendedRotationDeg: number;
  alignmentDescriptionAr: string;
  alignmentDescriptionEn: string;
}

/**
 * Calculates the principal axis angle of a user-defined study zone polygon (from its longest boundary segment)
 * and returns the exact map rotation angle (0° - 360°) that aligns the zone straight horizontally or vertically on screen.
 */
export function computeZonePrincipalAlignmentAngle(
  vertices: LatLon[],
  currentRotationDeg: number = 0
): ZoneAlignmentResult {
  if (!vertices || vertices.length < 2) {
    return {
      longestEdgeLengthMeters: 0,
      edgeAngleScreenDeg: 0,
      recommendedRotationDeg: 0,
      alignmentDescriptionAr: 'الوضع القياسي (الشمال للأعلى 0°)',
      alignmentDescriptionEn: 'Standard North-Up (0°)',
    };
  }

  let maxLenSq = -1;
  let bestDx = 1;
  let bestDy = 0;

  const n = vertices.length;
  for (let i = 0; i < n; i++) {
    const p1 = vertices[i];
    const p2 = vertices[(i + 1) % n];
    const midLatRad = (((p1.lat + p2.lat) / 2) * Math.PI) / 180;
    // Screen coordinates: +X is East, +Y is South
    const dxMeters = (p2.lng - p1.lng) * 111320 * Math.cos(midLatRad);
    const dyMeters = -(p2.lat - p1.lat) * 110540;
    const lenSq = dxMeters * dxMeters + dyMeters * dyMeters;
    if (lenSq > maxLenSq) {
      maxLenSq = lenSq;
      bestDx = dxMeters;
      bestDy = dyMeters;
    }
  }

  const longestEdgeLengthMeters = Math.round(Math.sqrt(Math.max(0, maxLenSq)));
  // Angle of longest edge in screen space (-180 to 180, where 0 is horizontal East-West)
  const rawAngleDeg = (Math.atan2(bestDy, bestDx) * 180) / Math.PI;

  // Candidate 1: Rotate by -rawAngleDeg so the longest edge is perfectly horizontal (0°)
  const horizRot = Math.round(((-rawAngleDeg % 360) + 360) % 360);
  // Candidate 2: Rotate so the longest edge is perfectly vertical (90°)
  const vertRot = Math.round((((90 - rawAngleDeg) % 360) + 360) % 360);
  // Candidate 3: 180-flipped horizontal
  const horizFlipRot = (horizRot + 180) % 360;

  // Pick the horizontal or vertical alignment closest to 0° (or toggle if already at horizRot)
  const candidates = [horizRot, vertRot, horizFlipRot];
  let chosen = horizRot;
  let minAngularDistFromZero = 999;

  for (const c of candidates) {
    const distFromZero = Math.min(c, 360 - c);
    if (distFromZero < minAngularDistFromZero) {
      minAngularDistFromZero = distFromZero;
      chosen = c;
    }
  }

  // If the zone is already Axis-Aligned (chosen === 0) or user is already at `chosen`, offer a 90° orthogonal straighten or 15° inspection angle
  if (Math.abs(chosen - currentRotationDeg) <= 1 && chosen !== 0) {
    chosen = (chosen + 90) % 360;
  } else if (chosen === 0 && currentRotationDeg === 0) {
    // If the user drew a rectangle that is already 0°, rotating by 90° rotates its long axis upright
    chosen = 90;
  }

  return {
    longestEdgeLengthMeters,
    edgeAngleScreenDeg: Number(rawAngleDeg.toFixed(1)),
    recommendedRotationDeg: chosen,
    alignmentDescriptionAr: `تمت محاذاة الضلع الرئيسي للزونة (${longestEdgeLengthMeters} م) عند زاوية ${chosen}° لتصبح مستقيمة`,
    alignmentDescriptionEn: `Aligned primary zone axis (${longestEdgeLengthMeters}m) at ${chosen}° for straight inspection`,
  };
}

/**
 * Unprojects a mouse click event on a rotated/tilted viewport back into unrotated Leaflet container pixel coordinates,
 * ensuring drawing tools and pixel clicks remain accurate when the map is rotated or tilted.
 */
export function unprojectRotatedClientPoint(
  clientX: number,
  clientY: number,
  viewportRect: DOMRect,
  mapStageWidth: number,
  mapStageHeight: number,
  rotationDeg: number,
  pitchDeg: number = 0,
  scaleFactor: number = 1
): { x: number; y: number } {
  const cx = viewportRect.left + viewportRect.width / 2;
  const cy = viewportRect.top + viewportRect.height / 2;

  const safeScale = Math.max(0.5, scaleFactor || 1);
  const dx = (clientX - cx) / safeScale;
  // Compensate for 3D tilt foreshortening along Y
  const pitchRad = (pitchDeg * Math.PI) / 180;
  const cosPitch = Math.max(0.45, Math.cos(pitchRad));
  const dy = (clientY - cy) / (cosPitch * safeScale);

  // Inverse rotate by -rotationDeg
  const rad = (-rotationDeg * Math.PI) / 180;
  const rx = dx * Math.cos(rad) - dy * Math.sin(rad);
  const ry = dx * Math.sin(rad) + dy * Math.cos(rad);

  return {
    x: mapStageWidth / 2 + rx,
    y: mapStageHeight / 2 + ry,
  };
}

