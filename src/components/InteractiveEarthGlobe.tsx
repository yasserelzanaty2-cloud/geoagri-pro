import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  Globe,
  Maximize2,
  Plus,
  RotateCcw,
  Sparkles,
  Sun,
  Thermometer,
  Droplets,
  CloudRain,
  Wind,
  ZoomIn,
  ZoomOut,
  Cpu,
  Layers,
  ChevronUp,
  ChevronDown,
  X,
} from 'lucide-react';
import {
  DailyWeatherPoint,
  ElevationColorPalette,
  GlobalTemperatureSubMode,
  LatLon,
  OpenMeteoSoilMoistureDepth,
  ThematicMapLayerId,
} from '../types/agro';
import {
  THEMATIC_MAPS_META,
  evaluateGlobalElevationAtLatLon,
  evaluateGlobalTemperatureAtLatLon,
  evaluateSoilMoistureOverlayAtLatLon,
  evaluateSpatialRainAtLatLon,
  evaluateSpatialWindAtLatLon,
  getElevationRgbTuple,
  getSteppedElevationTierIndex,
  isMarineOrOceanWaterAtLatLon,
  requestTerrariumTilesForBounds,
  sampleTerrariumElevationAtLatLon,
  subscribeTerrariumTilesReady,
} from '../utils/thematicMapRenderer';

export interface GlobeZoneSummary {
  id: string;
  nameAr: string;
  nameEn: string;
  centroid: LatLon;
  areaFeddans?: number;
}

export interface InspectedGlobePoint {
  lat: number;
  lng: number;
  isOcean: boolean;
  tempC: number;
  skinTempC: number;
  precipMm: number;
  precipProbPct: number;
  solarRadMjM2: number;
  humidityPct: number;
  soilMoisture0cmPct: number;
  soilMoisture7cmPct: number;
  elevationMeters: number;
  windSpeedKmh: number;
  windCardinal: string;
  ndviEstimate: number;
}

interface InteractiveEarthGlobeProps {
  isAr: boolean;
  activeThematicMap: ThematicMapLayerId;
  activeDayWeather?: DailyWeatherPoint;
  forecast14: DailyWeatherPoint[];
  selectedDayIdx: number;
  globalTempSubMode?: GlobalTemperatureSubMode;
  elevationPalette?: ElevationColorPalette;
  soilMoistureDepth?: OpenMeteoSoilMoistureDepth;
  soilMoistureOverlayEnabled?: boolean;
  zones: GlobeZoneSummary[];
  activeZoneId: string;
  initialCenter?: LatLon;
  initialZoom?: number;
  cameraSyncNonce?: number;
  onSelectZone?: (zoneId: string) => void;
  onFlyToLocation2D: (target: LatLon, targetZoom?: number, startDrawing?: boolean) => void;
  /** Live callback whenever the user rotates or zooms the 3D globe camera */
  onGlobeCameraChange?: (center: LatLon, zoom: number) => void;
  /** Controlled or internal state for whether the NASA telemetry popover is open */
  telemetryOpen?: boolean;
  onToggleTelemetryOpen?: (open: boolean) => void;
  /** Hide the globe's own bottom telemetry trigger if parent renders unified bottom pills */
  hideInternalBottomTrigger?: boolean;
  onInspectedPointChange?: (pt: InspectedGlobePoint) => void;
}

export const QUICK_GLOBE_REGIONS: Array<{
  id: string;
  labelAr: string;
  labelEn: string;
  lat: number;
  lng: number;
  zoom: number;
}> = [
  { id: 'egypt-delta', labelAr: 'مصر والدلتا', labelEn: 'Egypt & Delta', lat: 30.65, lng: 31.15, zoom: 3.4 },
  { id: 'sinai', labelAr: 'شمال سيناء', labelEn: 'North Sinai', lat: 30.95, lng: 33.15, zoom: 3.9 },
  { id: 'mena', labelAr: 'الشرق الأوسط', labelEn: 'MENA', lat: 26.5, lng: 29.5, zoom: 2.1 },
  { id: 'africa', labelAr: 'أفريقيا', labelEn: 'Africa', lat: 6.5, lng: 21.0, zoom: 1.45 },
  { id: 'europe', labelAr: 'أوروبا', labelEn: 'Europe', lat: 47.0, lng: 14.0, zoom: 1.9 },
  { id: 'asia', labelAr: 'آسيا', labelEn: 'Asia', lat: 32.0, lng: 82.0, zoom: 1.4 },
  { id: 'americas', labelAr: 'الأمريكتين', labelEn: 'Americas', lat: 15.0, lng: -75.0, zoom: 1.3 },
];

function hexToRgbTuple(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  if (Number.isNaN(num)) return [16, 185, 129];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

// High-precision continental outline polygons (lng, lat) for instant photorealistic satellite fallback before tiles stream
const CONTINENT_POLYGONS: Array<Array<[number, number]>> = [
  // Africa & Madagascar
  [
    [-17.5, 14.7], [-16.0, 21.0], [-13.2, 27.8], [-6.0, 35.8], [3.0, 36.9],
    [10.2, 37.3], [11.5, 33.1], [20.0, 32.1], [25.2, 31.6], [29.9, 31.2],
    [32.3, 31.3], [33.8, 28.0], [34.9, 29.5], [32.6, 29.9], [34.5, 25.5],
    [37.2, 21.0], [41.0, 15.5], [43.4, 12.6], [51.4, 11.9], [49.0, 6.0],
    [41.0, -1.5], [40.4, -10.5], [35.0, -18.0], [35.5, -24.0], [32.8, -26.0],
    [28.0, -32.8], [20.0, -34.8], [18.4, -33.9], [14.5, -22.9], [11.8, -17.0],
    [12.2, -6.0], [8.8, 4.0], [5.5, 4.3], [1.0, 6.0], [-7.7, 4.4],
    [-13.5, 9.5], [-17.5, 14.7],
  ],
  // Eurasia (Europe + Asia + Arabian Peninsula + India + SE Asia)
  [
    [-9.5, 38.7], [-9.0, 43.0], [-1.8, 43.4], [-4.5, 48.4], [2.5, 51.0],
    [8.5, 54.0], [10.5, 57.7], [5.0, 60.0], [10.0, 64.0], [20.0, 70.0],
    [28.0, 71.0], [40.0, 68.0], [60.0, 70.0], [90.0, 73.0], [130.0, 71.0],
    [170.0, 66.0], [160.0, 55.0], [141.0, 53.0], [135.0, 44.0], [129.0, 35.0],
    [122.0, 39.0], [118.0, 38.0], [122.0, 31.0], [120.0, 23.0], [108.0, 21.5],
    [109.0, 13.0], [104.0, 1.3], [100.0, 7.0], [97.0, 16.0], [91.0, 22.0],
    [80.0, 13.0], [77.5, 8.1], [72.8, 19.0], [67.0, 24.8], [56.5, 25.2],
    [50.0, 26.5], [48.0, 30.0], [56.2, 26.2], [59.8, 22.5], [54.0, 17.0],
    [45.0, 12.8], [43.5, 12.6], [39.2, 21.5], [34.9, 29.5], [34.3, 31.3],
    [35.8, 35.0], [36.2, 36.8], [27.0, 36.5], [26.0, 40.0], [29.0, 41.2],
    [39.0, 41.0], [40.0, 44.0], [34.0, 45.0], [30.0, 46.0], [24.0, 38.0],
    [20.0, 39.0], [15.5, 38.0], [12.5, 42.0], [13.8, 45.5], [16.0, 40.0],
    [8.9, 44.4], [5.0, 43.3], [3.2, 42.4], [-0.5, 38.0], [-5.4, 36.0],
    [-9.5, 38.7],
  ],
  // North America
  [
    [-168.0, 65.5], [-140.0, 70.0], [-95.0, 72.0], [-75.0, 70.0], [-55.0, 52.0],
    [-65.0, 45.0], [-70.0, 42.0], [-75.5, 35.5], [-80.2, 25.8], [-82.5, 28.0],
    [-89.0, 29.2], [-97.0, 26.0], [-96.0, 19.0], [-87.0, 21.5], [-88.0, 16.0],
    [-83.5, 10.0], [-78.0, 8.0], [-84.0, 9.5], [-92.0, 14.5], [-105.0, 20.0],
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
  // Australia
  [
    [114.0, -22.0], [122.0, -18.0], [131.0, -12.0], [136.5, -12.2], [136.0, -16.0],
    [142.5, -10.7], [146.0, -17.0], [153.5, -28.0], [150.0, -37.5], [145.0, -38.5],
    [138.5, -35.0], [131.0, -31.5], [121.0, -34.0], [115.0, -34.3], [114.0, -22.0],
  ],
  // Greenland
  [
    [-44.0, 60.0], [-22.0, 70.0], [-18.0, 81.0], [-55.0, 82.0], [-70.0, 76.0],
    [-52.0, 68.0], [-44.0, 60.0],
  ],
  // UK & Ireland
  [
    [-5.5, 50.1], [1.4, 51.3], [1.7, 52.6], [-0.2, 54.1], [-3.0, 58.6],
    [-5.8, 57.5], [-4.8, 55.0], [-3.0, 53.4], [-5.2, 51.8], [-5.5, 50.1],
  ],
  // Japan
  [
    [130.5, 31.5], [134.0, 34.0], [139.8, 35.5], [141.5, 41.0], [145.0, 43.5],
    [140.0, 43.0], [139.0, 38.0], [135.5, 35.5], [130.5, 33.5], [130.5, 31.5],
  ],
];

// Render a photorealistic natural satellite base map onto a Web Mercator 1024x1024 canvas
function paintPhotorealisticNaturalEarthBase(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;

  // 1. Deep bathymetric ocean gradient (Google Earth deep marine blue)
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, h);
  oceanGrad.addColorStop(0, '#071b34');
  oceanGrad.addColorStop(0.25, '#092446');
  oceanGrad.addColorStop(0.5, '#0b2c56');
  oceanGrad.addColorStop(0.75, '#092446');
  oceanGrad.addColorStop(1, '#071b34');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, w, h);

  const lngLatToMercXY = (lng: number, lat: number): [number, number] => {
    const x = ((lng + 180) / 360) * w;
    const clampedLat = Math.max(-85, Math.min(85, lat));
    const phi = (clampedLat * Math.PI) / 180;
    const s = Math.sin(phi);
    const y = (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * h;
    return [x, y];
  };

  // 2. Continental shelf shallow turquoise glow around continents
  ctx.save();
  ctx.strokeStyle = 'rgba(14, 116, 144, 0.35)';
  ctx.lineWidth = 6;
  ctx.lineJoin = 'round';
  CONTINENT_POLYGONS.forEach((poly) => {
    ctx.beginPath();
    poly.forEach(([lng, lat], idx) => {
      const [x, y] = lngLatToMercXY(lng, lat);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.stroke();
  });
  ctx.restore();

  // 3. Clip to continents and paint realistic biomes (Sahara/Arabian desert, Nile Delta/Valley, Tropical & Temperate forests)
  ctx.save();
  ctx.beginPath();
  CONTINENT_POLYGONS.forEach((poly) => {
    poly.forEach(([lng, lat], idx) => {
      const [x, y] = lngLatToMercXY(lng, lat);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
  });
  ctx.clip();

  // Latitude biome bands
  const landGrad = ctx.createLinearGradient(0, 0, 0, h);
  landGrad.addColorStop(0.0, '#d8e2dc'); // Arctic tundra
  landGrad.addColorStop(0.22, '#2d5a3c'); // Boreal & European forest
  landGrad.addColorStop(0.34, '#4a6b3b'); // Mediterranean & temperate
  landGrad.addColorStop(0.41, '#c9a675'); // Sahara & Arabian desert belt
  landGrad.addColorStop(0.46, '#b8925e'); // Southern Sahara / Sahel transition
  landGrad.addColorStop(0.51, '#245530'); // Equatorial rainforest (Congo / Amazon)
  landGrad.addColorStop(0.58, '#4e733b'); // Southern savanna
  landGrad.addColorStop(0.66, '#b38b59'); // Kalahari / Australian outback
  landGrad.addColorStop(1.0, '#c8d6d0');
  ctx.fillStyle = landGrad;
  ctx.fillRect(0, 0, w, h);

  // Paint lush Nile Delta & Nile River Valley in Egypt
  const nileDeltaPoly: Array<[number, number]> = [
    [29.85, 31.2], [30.4, 31.45], [31.3, 31.55], [32.15, 31.25],
    [31.25, 30.02], [31.1, 29.0], [30.75, 28.0], [31.2, 27.1],
    [32.6, 25.7], [32.9, 24.0], [32.5, 24.0], [32.2, 25.7],
    [30.8, 27.1], [30.4, 28.0], [30.8, 29.0], [30.95, 30.02],
  ];
  ctx.fillStyle = '#1f5e39';
  ctx.beginPath();
  nileDeltaPoly.forEach(([lng, lat], idx) => {
    const [x, y] = lngLatToMercXY(lng, lat);
    if (idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

// WebGL Vertex Shader (Full-Screen Quad for Raycasted 3D Spherical Globe)
const GLOBE_VERTEX_SHADER_SRC = `
  attribute vec2 a_position;
  varying vec2 v_uv;
  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

// WebGL Fragment Shader (Google Earth 3D Spherical Projection sampling Web Mercator Satellite Imagery + Thematic Overlay)
const GLOBE_FRAGMENT_SHADER_SRC = `
  precision highp float;
  varying vec2 v_uv;
  uniform vec2 u_resolution;
  uniform vec2 u_globeCenterRad; // (phi0, lambda0) in radians
  uniform float u_radius;
  uniform sampler2D u_satTex;
  uniform sampler2D u_thematicTex;
  uniform float u_thematicBlend;

  const float PI = 3.141592653589793;

  float hash21(vec2 p) {
    p = fract(p * vec2(234.34, 435.345));
    p += dot(p, p + 34.23);
    return fract(p.x * p.y);
  }

  void main() {
    vec2 fragCoord = vec2(v_uv.x * u_resolution.x, (1.0 - v_uv.y) * u_resolution.y);
    vec2 center = u_resolution * 0.5;
    vec2 delta = fragCoord - center;
    float dist = length(delta);

    // 1. Deep space background gradient (Google Earth dark cosmos)
    float spaceNorm = clamp(dist / (max(u_resolution.x, u_resolution.y) * 0.75), 0.0, 1.0);
    vec3 spaceColor = mix(vec3(0.025, 0.055, 0.115), vec3(0.005, 0.012, 0.028), spaceNorm);

    // Subtle crisp stars outside the globe limb
    if (dist > u_radius * 1.01) {
      vec2 starCell = floor(fragCoord / 34.0);
      vec2 starLocal = fract(fragCoord / 34.0) - 0.5;
      float h = hash21(starCell);
      if (h > 0.93 && length(starLocal) < 0.06) {
        spaceColor += vec3(0.82, 0.90, 1.0) * ((h - 0.93) * 11.0);
      }
    }

    // 2. Outer atmospheric Rayleigh blue halo (Google Earth horizon glow)
    if (dist > u_radius) {
      float haloFactor = clamp(1.0 - (dist - u_radius) / (u_radius * 0.14), 0.0, 1.0);
      vec3 haloColor = vec3(0.24, 0.68, 0.98) * pow(haloFactor, 2.4) * 0.48;
      gl_FragColor = vec4(spaceColor + haloColor, 1.0);
      return;
    }

    // 3. 3D Sphere Surface Normal & Inverse Orthographic Projection
    float nx = delta.x / u_radius;
    float ny = -delta.y / u_radius;
    float nz = sqrt(max(0.0, 1.0 - nx * nx - ny * ny));
    float rho = clamp(length(vec2(nx, ny)), 0.0, 1.0);
    float c = asin(rho);
    float cosC = cos(c);
    float sinC = sin(c);

    float phi0 = u_globeCenterRad.x;
    float lambda0 = u_globeCenterRad.y;

    float phi = (rho < 0.0001)
      ? phi0
      : asin(clamp(cosC * sin(phi0) + (ny * sinC * cos(phi0)) / max(rho, 0.0001), -1.0, 1.0));

    float lambda = lambda0 + atan(
      nx * sinC,
      rho * cos(phi0) * cosC - ny * sin(phi0) * sinC
    );

    // Normalize longitude to [-PI, PI]
    lambda = mod(lambda + PI, 2.0 * PI);
    if (lambda < 0.0) lambda += 2.0 * PI;
    lambda -= PI;

    // Sample Web Mercator Satellite Texture (Esri World Imagery + Natural Earth Base)
    float u = (lambda + PI) / (2.0 * PI);
    float sinPhi = clamp(sin(phi), -0.995, 0.995);
    float vMerc = clamp(0.5 - log((1.0 + sinPhi) / (1.0 - sinPhi)) / (4.0 * PI), 0.0, 1.0);
    vec3 satColor = texture2D(u_satTex, vec2(u, vMerc)).rgb;

    // Optional NASA Thematic Layer Blending over Land
    float vEqui = (0.5 * PI - phi) / PI;
    vec4 themSample = texture2D(u_thematicTex, vec2(u, vEqui));
    float isLand = themSample.a;
    vec3 baseColor = mix(satColor, themSample.rgb, u_thematicBlend * isLand);

    // 4. 3D Directional Solar Illumination + Atmospheric Fresnel Limb Scattering
    vec3 normal = normalize(vec3(nx, ny, nz));
    vec3 lightDir = normalize(vec3(-0.28, 0.24, 0.92));
    vec3 viewDir = vec3(0.0, 0.0, 1.0);
    float ndotl = max(0.32, dot(normal, lightDir));

    vec3 halfVec = normalize(lightDir + viewDir);
    float spec = pow(max(0.0, dot(normal, halfVec)), 36.0) * (1.0 - isLand * 0.85) * 0.18;

    // Atmospheric Fresnel scattering near the planetary horizon
    float fresnel = pow(1.0 - nz, 3.2);
    vec3 atmosphereRim = vec3(0.28, 0.72, 0.98) * fresnel * 0.46;

    vec3 litColor = baseColor * (0.35 + 0.72 * ndotl) + vec3(spec) + atmosphereRim;

    // Smooth anti-aliased edge transition at sphere boundary
    float edgeAlpha = smoothstep(u_radius, u_radius - 1.5, dist);
    vec3 finalColor = mix(spaceColor + vec3(0.24, 0.68, 0.98) * 0.38, litColor, edgeAlpha);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

interface WebGLGlobeResources {
  gl: WebGLRenderingContext | WebGL2RenderingContext;
  program: WebGLProgram;
  posBuffer: WebGLBuffer;
  satTexture: WebGLTexture;
  thematicTexture: WebGLTexture;
  uResolution: WebGLUniformLocation | null;
  uGlobeCenterRad: WebGLUniformLocation | null;
  uRadius: WebGLUniformLocation | null;
  uSatTex: WebGLUniformLocation | null;
  uThematicTex: WebGLUniformLocation | null;
  uThematicBlend: WebGLUniformLocation | null;
}

export const InteractiveEarthGlobe: React.FC<InteractiveEarthGlobeProps> = ({
  isAr,
  activeThematicMap,
  activeDayWeather,
  forecast14,
  selectedDayIdx,
  globalTempSubMode = 'surface_lst',
  elevationPalette = 'scientific_hypsometric',
  soilMoistureDepth = 'soil_moisture_0cm',
  soilMoistureOverlayEnabled = false,
  zones,
  activeZoneId,
  initialCenter,
  initialZoom,
  cameraSyncNonce = 0,
  onSelectZone,
  onFlyToLocation2D,
  onGlobeCameraChange,
  telemetryOpen: controlledTelemetryOpen,
  onToggleTelemetryOpen,
  hideInternalBottomTrigger = false,
  onInspectedPointChange,
}) => {
  const webglCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const satMercatorCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const webglResRef = useRef<WebGLGlobeResources | null>(null);
  const [webglReady, setWebglReady] = useState<boolean>(false);
  const [satTilesLoadedCount, setSatTilesLoadedCount] = useState<number>(0);
  const [terrariumRevision, setTerrariumRevision] = useState<number>(0);
  const [showThematicTintOnGlobe, setShowThematicTintOnGlobe] = useState<boolean>(
    () => activeThematicMap === 'elevation'
  );
  const [internalTelemetryOpen, setInternalTelemetryOpen] = useState<boolean>(false);
  // Only show the yellow crosshair pin AFTER the user explicitly clicks a point on the globe (never pin a default study zone!)
  const [hasUserClickedPoint, setHasUserClickedPoint] = useState<boolean>(false);

  // Auto-enable globe thematic overlay when user selects Global Elevation Relief so stepped 3D colors show immediately
  useEffect(() => {
    if (activeThematicMap === 'elevation') {
      setShowThematicTintOnGlobe(true);
      requestTerrariumTilesForBounds(-75, 75, -179, 179, 2);
    }
  }, [activeThematicMap]);

  useEffect(() => {
    const unsub = subscribeTerrariumTilesReady(() => {
      setTerrariumRevision((r) => r + 1);
    });
    return unsub;
  }, []);

  const isTelemetryOpen =
    controlledTelemetryOpen !== undefined ? controlledTelemetryOpen : internalTelemetryOpen;

  const setTelemetryOpen = useCallback(
    (next: boolean) => {
      setInternalTelemetryOpen(next);
      onToggleTelemetryOpen?.(next);
    },
    [onToggleTelemetryOpen]
  );

  // Start at a free planetary view unless caller supplies an explicit center/zoom
  const [globeCenter, setGlobeCenter] = useState<LatLon>(() =>
    initialCenter
      ? { lat: initialCenter.lat, lng: initialCenter.lng }
      : { lat: 24.0, lng: 18.0 }
  );
  const [globeZoom, setGlobeZoom] = useState<number>(
    () => initialZoom ?? (zones.length > 0 ? 2.0 : 1.18)
  );
  const globeCenterRef = useRef<LatLon>(globeCenter);
  const globeZoomRef = useRef<number>(globeZoom);

  // Sync camera whenever parent explicitly requests a full-planet reset or zoom-out handoff
  useEffect(() => {
    if (cameraSyncNonce <= 0) return;
    const nextCenter = initialCenter
      ? { lat: initialCenter.lat, lng: initialCenter.lng }
      : { lat: 24.0, lng: 18.0 };
    const nextZoom = initialZoom ?? 1.18;
    globeCenterRef.current = nextCenter;
    globeZoomRef.current = nextZoom;
    setGlobeCenter(nextCenter);
    setGlobeZoom(nextZoom);
  }, [cameraSyncNonce]);

  useEffect(() => {
    globeCenterRef.current = globeCenter;
    globeZoomRef.current = globeZoom;
    onGlobeCameraChange?.(globeCenter, globeZoom);
  }, [globeCenter, globeZoom, onGlobeCameraChange]);

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; lat: number; lng: number } | null>(null);
  const movedDistanceRef = useRef<number>(0);

  const evaluatePointTelemetry = useCallback(
    (lat: number, lng: number): InspectedGlobePoint => {
      const isOcean = isMarineOrOceanWaterAtLatLon(lat, lng);
      const tempEval = evaluateGlobalTemperatureAtLatLon(
        lat,
        lng,
        activeDayWeather,
        globalTempSubMode
      );
      const rainEval = evaluateSpatialRainAtLatLon(lat, lng, forecast14, selectedDayIdx);
      const smEval = evaluateSoilMoistureOverlayAtLatLon(
        lat,
        lng,
        soilMoistureDepth,
        activeDayWeather
      );
      const elevEval = evaluateGlobalElevationAtLatLon(lat, lng, 0.05, elevationPalette);
      const windEval = evaluateSpatialWindAtLatLon(lat, lng, activeDayWeather);

      const latSolarFactor = Math.max(0.45, Math.cos(((Math.abs(lat) - 22) * Math.PI) / 180));
      const baseSolar = activeDayWeather?.solarRadiationMjM2 ?? 18.2;
      const solarRadMjM2 = Number(
        Math.max(6.5, Math.min(27.5, baseSolar * latSolarFactor * (rainEval.isRaining ? 0.68 : 1.0))).toFixed(1)
      );

      const isFertileBelt =
        (lat >= 29.8 && lat <= 31.55 && lng >= 29.8 && lng <= 32.1) ||
        (lat >= 24.0 && lat < 29.8 && Math.abs(lng - 31.15) < 0.45) ||
        (Math.abs(lat) < 12 && !isOcean) ||
        (lat >= 36 && lat <= 55 && !isOcean);

      const ndviEstimate = isOcean
        ? 0
        : Number(
            Math.max(
              0.08,
              Math.min(
                0.84,
                (isFertileBelt ? 0.64 : 0.22) +
                  Math.sin(lat * 8 + lng * 6) * 0.08
              )
            ).toFixed(2)
          );

      const humidityPct = Math.round(
        Math.max(
          16,
          Math.min(
            94,
            (activeDayWeather?.relativeHumidityPct ?? 56) +
              (isOcean ? 18 : Math.abs(lat) > 20 && Math.abs(lat) < 31 && !isFertileBelt ? -18 : 4)
          )
        )
      );

      return {
        lat: Number(lat.toFixed(4)),
        lng: Number(lng.toFixed(4)),
        isOcean,
        tempC: tempEval.airTemp2mC,
        skinTempC: tempEval.surfaceLstC,
        precipMm: rainEval.precipMm,
        precipProbPct: rainEval.precipProbPct,
        solarRadMjM2,
        humidityPct,
        soilMoisture0cmPct: isOcean ? 0 : smEval.soilMoisture0cmPct,
        soilMoisture7cmPct: isOcean ? 0 : smEval.soilMoisture7cmPct,
        elevationMeters: isOcean ? 0 : elevEval.elevationMeters,
        windSpeedKmh: windEval.speedKmh,
        windCardinal: isAr ? windEval.cardinalAr : windEval.cardinalEn,
        ndviEstimate,
      };
    },
    [
      activeDayWeather,
      elevationPalette,
      forecast14,
      globalTempSubMode,
      isAr,
      selectedDayIdx,
      soilMoistureDepth,
    ]
  );

  const [inspectedPoint, setInspectedPoint] = useState<InspectedGlobePoint>(() =>
    evaluatePointTelemetry(globeCenter.lat, globeCenter.lng)
  );

  useEffect(() => {
    const nextPt = evaluatePointTelemetry(inspectedPoint.lat, inspectedPoint.lng);
    setInspectedPoint(nextPt);
    onInspectedPointChange?.(nextPt);
  }, [evaluatePointTelemetry]);

  // Build Equirectangular NASA Thematic Texture (360 x 180 RGBA) with Crisp 3D Stepped Elevation Relief
  const equirectangularThematicData = useMemo(() => {
    const texW = 360;
    const texH = 180;
    const pixels = new Uint8Array(texW * texH * 4);
    let ptr = 0;

    const effectiveLayer: ThematicMapLayerId = soilMoistureOverlayEnabled
      ? 'soil_moisture'
      : activeThematicMap;

    // Pre-sample real Terrarium DEM elevation grid when Elevation mode is active for 3D stepped relief + NW hillshade
    let elevField: Float32Array | null = null;
    let oceanField: Uint8Array | null = null;
    let bandField: Int8Array | null = null;

    if (effectiveLayer === 'elevation') {
      elevField = new Float32Array(texW * texH);
      oceanField = new Uint8Array(texW * texH);
      bandField = new Int8Array(texW * texH);

      for (let y = 0; y < texH; y++) {
        const lat = 90 - ((y + 0.5) / texH) * 180;
        for (let x = 0; x < texW; x++) {
          const lng = ((x + 0.5) / texW) * 360 - 180;
          const idx = y * texW + x;
          const isOcean = isMarineOrOceanWaterAtLatLon(lat, lng);
          if (isOcean) {
            oceanField[idx] = 1;
            elevField[idx] = 0;
            bandField[idx] = -1;
            continue;
          }
          const realDem = sampleTerrariumElevationAtLatLon(lat, lng, 2);
          const elevM =
            realDem !== null
              ? realDem
              : evaluateGlobalElevationAtLatLon(lat, lng, 0.25, elevationPalette)
                  .elevationExactMeters;
          if (
            realDem !== null &&
            realDem < -2.5 &&
            !(lat >= 28 && lat <= 32 && lng >= 25 && lng <= 36) &&
            !(lat >= 51 && lat <= 54 && lng >= 3 && lng <= 7)
          ) {
            oceanField[idx] = 1;
            elevField[idx] = 0;
            bandField[idx] = -1;
          } else {
            elevField[idx] = elevM;
            bandField[idx] = getSteppedElevationTierIndex(elevM);
          }
        }
      }
    }

    for (let y = 0; y < texH; y++) {
      const lat = 90 - ((y + 0.5) / texH) * 180;
      const yPrev = Math.max(0, y - 1);
      const yNext = Math.min(texH - 1, y + 1);
      for (let x = 0; x < texW; x++) {
        const lng = ((x + 0.5) / texW) * 360 - 180;
        const idx = y * texW + x;
        const isOcean = oceanField
          ? oceanField[idx] === 1
          : isMarineOrOceanWaterAtLatLon(lat, lng);

        let baseR = 10;
        let baseG = 38;
        let baseB = 74;

        if (!isOcean) {
          if (effectiveLayer === 'temperature') {
            const tEval = evaluateGlobalTemperatureAtLatLon(
              lat,
              lng,
              activeDayWeather,
              globalTempSubMode
            );
            [baseR, baseG, baseB] = hexToRgbTuple(tEval.color);
          } else if (effectiveLayer === 'elevation' && elevField && bandField) {
            const elevM = elevField[idx];
            const [tierR, tierG, tierB] = getElevationRgbTuple(elevM, elevationPalette);
            const xPrev = (x - 1 + texW) % texW;
            const xNext = (x + 1) % texW;

            // 3D Directional NW Hillshade over global terrain
            const dzdx = (elevField[y * texW + xNext] - elevField[y * texW + xPrev]) * 0.0022;
            const dzdy = (elevField[yNext * texW + x] - elevField[yPrev * texW + x]) * 0.0022;
            const normLen = Math.hypot(-dzdx, -dzdy, 1.0);
            const ndotl = ((-dzdx) * -0.56 + (-dzdy) * -0.56 + 0.61) / normLen;
            let shade = 0.72 + Math.max(0, ndotl) * 0.52;

            // Crisp stepped terrace cliff bevel where elevation tier transitions
            const curBand = bandField[idx];
            const nwBand = bandField[yPrev * texW + xPrev];
            const seBand = bandField[yNext * texW + xNext];
            if (nwBand >= 0 && curBand > nwBand) {
              shade += 0.16; // Lit upper rim
            } else if (seBand >= 0 && curBand < seBand) {
              shade -= 0.18; // Stepped terrace shadow
            }

            baseR = Math.round(tierR * shade);
            baseG = Math.round(tierG * shade);
            baseB = Math.round(tierB * shade);
          } else if (effectiveLayer === 'soil_moisture' || effectiveLayer === 'drought') {
            const smEval = evaluateSoilMoistureOverlayAtLatLon(
              lat,
              lng,
              soilMoistureDepth,
              activeDayWeather
            );
            [baseR, baseG, baseB] = smEval.rgb;
          } else if (effectiveLayer === 'rainfall') {
            const rEval = evaluateSpatialRainAtLatLon(
              lat,
              lng,
              forecast14,
              selectedDayIdx
            );
            if (rEval.isRaining) {
              [baseR, baseG, baseB] = hexToRgbTuple(rEval.color);
            } else {
              baseR = 34;
              baseG = 118;
              baseB = 72;
            }
          } else {
            const isNileDeltaOrValley =
              (lat >= 29.8 && lat <= 31.55 && lng >= 29.85 && lng <= 32.05) ||
              (lat >= 24.0 && lat < 29.8 && Math.abs(lng - 31.15) < 0.42);
            baseR = isNileDeltaOrValley ? 16 : 36;
            baseG = isNileDeltaOrValley ? 185 : 148;
            baseB = isNileDeltaOrValley ? 129 : 88;
          }
        }

        pixels[ptr++] = Math.min(255, Math.max(0, baseR));
        pixels[ptr++] = Math.min(255, Math.max(0, baseG));
        pixels[ptr++] = Math.min(255, Math.max(0, baseB));
        pixels[ptr++] = isOcean ? 0 : 255;
      }
    }

    return { width: texW, height: texH, pixels };
  }, [
    activeDayWeather,
    activeThematicMap,
    elevationPalette,
    forecast14,
    globalTempSubMode,
    selectedDayIdx,
    soilMoistureDepth,
    soilMoistureOverlayEnabled,
    terrariumRevision,
  ]);

  // Initialize Photorealistic Satellite Canvas & Stream Real Esri World Imagery Tiles (z=2 & z=3)
  useEffect(() => {
    let cancelled = false;
    const satCanvas = document.createElement('canvas');
    satCanvas.width = 2048;
    satCanvas.height = 2048;
    satMercatorCanvasRef.current = satCanvas;

    // 1. Paint immediate smooth continental satellite base (Zero blocky squares!)
    paintPhotorealisticNaturalEarthBase(satCanvas);

    const ctx = satCanvas.getContext('2d');
    if (!ctx) return;

    const uploadSatCanvasToWebGL = () => {
      if (cancelled) return;
      const res = webglResRef.current;
      if (res) {
        const { gl, satTexture } = res;
        gl.bindTexture(gl.TEXTURE_2D, satTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, satCanvas);
      }
      setSatTilesLoadedCount((c) => c + 1);
    };

    // 2. Stream z=2 (4x4 = 16 tiles) for immediate global photorealistic coverage
    const z2 = 2;
    const n2 = 4;
    const tileDrawSize2 = satCanvas.width / n2;
    for (let ty = 0; ty < n2; ty++) {
      for (let tx = 0; tx < n2; tx++) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          if (cancelled) return;
          ctx.drawImage(img, tx * tileDrawSize2, ty * tileDrawSize2, tileDrawSize2, tileDrawSize2);
          uploadSatCanvasToWebGL();
        };
        img.src = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z2}/${ty}/${tx}`;
      }
    }

    // 3. Stream z=3 (8x8 = 64 tiles = 2048x2048) for crisp Google Earth continental & Nile Delta detail
    const z3 = 3;
    const n3 = 8;
    const tileDrawSize3 = satCanvas.width / n3;
    for (let ty = 0; ty < n3; ty++) {
      for (let tx = 0; tx < n3; tx++) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          if (cancelled) return;
          ctx.drawImage(img, tx * tileDrawSize3, ty * tileDrawSize3, tileDrawSize3, tileDrawSize3);
          uploadSatCanvasToWebGL();
        };
        img.src = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z3}/${ty}/${tx}`;
      }
    }

    return () => {
      cancelled = true;
    };
  }, []);

  // Initialize WebGL Shader Pipeline once on mount
  useEffect(() => {
    const glCanvas = webglCanvasRef.current;
    if (!glCanvas) return;

    const gl =
      (glCanvas.getContext('webgl2', { antialias: true, preserveDrawingBuffer: false }) as WebGL2RenderingContext | null) ||
      (glCanvas.getContext('webgl', { antialias: true, preserveDrawingBuffer: false }) as WebGLRenderingContext | null);

    if (!gl) {
      setWebglReady(false);
      return;
    }

    const compileShader = (type: number, source: string): WebGLShader | null => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = compileShader(gl.VERTEX_SHADER, GLOBE_VERTEX_SHADER_SRC);
    const fs = compileShader(gl.FRAGMENT_SHADER, GLOBE_FRAGMENT_SHADER_SRC);
    if (!vs || !fs) {
      setWebglReady(false);
      return;
    }

    const program = gl.createProgram();
    if (!program) {
      setWebglReady(false);
      return;
    }
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      setWebglReady(false);
      return;
    }

    const posBuffer = gl.createBuffer();
    const satTexture = gl.createTexture();
    const thematicTexture = gl.createTexture();
    if (!posBuffer || !satTexture || !thematicTexture) {
      setWebglReady(false);
      return;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    gl.bindTexture(gl.TEXTURE_2D, satTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    if (satMercatorCanvasRef.current) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, satMercatorCanvasRef.current);
    }

    gl.bindTexture(gl.TEXTURE_2D, thematicTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    webglResRef.current = {
      gl,
      program,
      posBuffer,
      satTexture,
      thematicTexture,
      uResolution: gl.getUniformLocation(program, 'u_resolution'),
      uGlobeCenterRad: gl.getUniformLocation(program, 'u_globeCenterRad'),
      uRadius: gl.getUniformLocation(program, 'u_radius'),
      uSatTex: gl.getUniformLocation(program, 'u_satTex'),
      uThematicTex: gl.getUniformLocation(program, 'u_thematicTex'),
      uThematicBlend: gl.getUniformLocation(program, 'u_thematicBlend'),
    };
    setWebglReady(true);

    return () => {
      gl.deleteTexture(satTexture);
      gl.deleteTexture(thematicTexture);
      gl.deleteBuffer(posBuffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      webglResRef.current = null;
    };
  }, []);

  // Upload updated thematic texture when thematic map changes
  useEffect(() => {
    const res = webglResRef.current;
    if (!res) return;
    const { gl, thematicTexture } = res;
    gl.bindTexture(gl.TEXTURE_2D, thematicTexture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      equirectangularThematicData.width,
      equirectangularThematicData.height,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      equirectangularThematicData.pixels
    );
  }, [equirectangularThematicData, webglReady]);

  // Project (lat, lng) onto 2D orthographic sphere screen coordinates
  const projectLatLonToGlobe = useCallback(
    (lat: number, lng: number, cx: number, cy: number, radius: number) => {
      const phi = (lat * Math.PI) / 180;
      const lambda = (lng * Math.PI) / 180;
      const phi0 = (globeCenter.lat * Math.PI) / 180;
      const lambda0 = (globeCenter.lng * Math.PI) / 180;
      const dLambda = lambda - lambda0;

      const cosC =
        Math.sin(phi0) * Math.sin(phi) +
        Math.cos(phi0) * Math.cos(phi) * Math.cos(dLambda);

      if (cosC < 0) return null; // Backside of Earth sphere

      const x = cx + radius * Math.cos(phi) * Math.sin(dLambda);
      const y =
        cy -
        radius *
          (Math.cos(phi0) * Math.sin(phi) -
            Math.sin(phi0) * Math.cos(phi) * Math.cos(dLambda));

      return { x, y, cosC };
    },
    [globeCenter.lat, globeCenter.lng]
  );

  // Inverse orthographic projection: screen (x, y) -> spherical (lat, lng)
  const unprojectScreenToLatLon = useCallback(
    (sx: number, sy: number, cx: number, cy: number, radius: number): LatLon | null => {
      const nx = (sx - cx) / radius;
      const ny = (cy - sy) / radius;
      const rho = Math.hypot(nx, ny);
      if (rho > 1.0) return null; // Outside Earth sphere disc

      const c = Math.asin(Math.min(1, rho));
      const cosC = Math.cos(c);
      const sinC = Math.sin(c);
      const phi0 = (globeCenter.lat * Math.PI) / 180;
      const lambda0 = (globeCenter.lng * Math.PI) / 180;

      const phi =
        rho < 1e-5
          ? phi0
          : Math.asin(cosC * Math.sin(phi0) + (ny * sinC * Math.cos(phi0)) / rho);

      const lambda =
        lambda0 +
        Math.atan2(
          nx * sinC,
          rho * Math.cos(phi0) * cosC - ny * Math.sin(phi0) * sinC
        );

      const lat = (phi * 180) / Math.PI;
      let lng = (lambda * 180) / Math.PI;
      lng = ((((lng + 180) % 360) + 360) % 360) - 180;

      return { lat, lng };
    },
    [globeCenter.lat, globeCenter.lng]
  );

  // Render the Google Earth 3D Globe (WebGL GPU Shader Pass + 2D Vector Pins Pass)
  useEffect(() => {
    const overlayCanvas = overlayCanvasRef.current;
    if (!overlayCanvas) return;
    const ctx = overlayCanvas.getContext('2d');
    if (!ctx) return;

    const width = overlayCanvas.clientWidth || 960;
    const height = overlayCanvas.clientHeight || 580;
    overlayCanvas.width = width;
    overlayCanvas.height = height;

    const cx = width / 2;
    const cy = height / 2;
    const baseRadius = Math.min(width, height) * 0.38;
    const radius = baseRadius * globeZoom;

    ctx.clearRect(0, 0, width, height);

    // 1. Hardware-Accelerated WebGL 3D Globe Pass
    const glRes = webglResRef.current;
    const glCanvas = webglCanvasRef.current;
    let renderedViaWebGL = false;

    if (glRes && glCanvas && webglReady) {
      glCanvas.width = width;
      glCanvas.height = height;
      const {
        gl,
        program,
        posBuffer,
        satTexture,
        thematicTexture,
        uResolution,
        uGlobeCenterRad,
        uRadius,
        uSatTex,
        uThematicTex,
        uThematicBlend,
      } = glRes;

      gl.viewport(0, 0, width, height);
      gl.useProgram(program);

      const posLoc = gl.getAttribLocation(program, 'a_position');
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, satTexture);
      if (uSatTex) gl.uniform1i(uSatTex, 0);

      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, thematicTexture);
      if (uThematicTex) gl.uniform1i(uThematicTex, 1);

      if (uThematicBlend) {
        const blendFactor =
          showThematicTintOnGlobe || soilMoistureOverlayEnabled
            ? activeThematicMap === 'elevation' && !soilMoistureOverlayEnabled
              ? 0.78
              : 0.48
            : 0.0;
        gl.uniform1f(uThematicBlend, blendFactor);
      }
      if (uResolution) gl.uniform2f(uResolution, width, height);
      if (uGlobeCenterRad) {
        gl.uniform2f(
          uGlobeCenterRad,
          (globeCenter.lat * Math.PI) / 180,
          (globeCenter.lng * Math.PI) / 180
        );
      }
      if (uRadius) gl.uniform1f(uRadius, radius);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      renderedViaWebGL = true;
    }

    // 2. Fallback Canvas2D Spherical Pass (samples satMercatorCanvasRef so even fallback is photorealistic!)
    if (!renderedViaWebGL && satMercatorCanvasRef.current) {
      const spaceGrad = ctx.createRadialGradient(cx, cy, radius * 0.15, cx, cy, Math.max(width, height) * 0.75);
      spaceGrad.addColorStop(0, '#071326');
      spaceGrad.addColorStop(0.55, '#030812');
      spaceGrad.addColorStop(1, '#010409');
      ctx.fillStyle = spaceGrad;
      ctx.fillRect(0, 0, width, height);

      const haloGrad = ctx.createRadialGradient(cx, cy, radius * 0.95, cx, cy, radius * 1.14);
      haloGrad.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
      haloGrad.addColorStop(0.5, 'rgba(14, 165, 233, 0.12)');
      haloGrad.addColorStop(1, 'rgba(2, 132, 199, 0)');
      ctx.fillStyle = haloGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.14, 0, Math.PI * 2);
      ctx.fill();

      const satCtx = satMercatorCanvasRef.current.getContext('2d');
      if (satCtx) {
        const satW = satMercatorCanvasRef.current.width;
        const satH = satMercatorCanvasRef.current.height;
        const satPixels = satCtx.getImageData(0, 0, satW, satH).data;

        const sampleStep = 4;
        const cols = Math.ceil(width / sampleStep);
        const rows = Math.ceil(height / sampleStep);
        const offCanvas = document.createElement('canvas');
        offCanvas.width = cols;
        offCanvas.height = rows;
        const offCtx = offCanvas.getContext('2d');

        if (offCtx) {
          const imgData = offCtx.createImageData(cols, rows);
          const data = imgData.data;
          let ptr = 0;

          for (let r = 0; r < rows; r++) {
            const sy = (r + 0.5) * sampleStep;
            for (let c = 0; c < cols; c++) {
              const sx = (c + 0.5) * sampleStep;
              const dx = sx - cx;
              const dy = sy - cy;
              const dist = Math.hypot(dx, dy);

              if (dist > radius) {
                data[ptr++] = 0;
                data[ptr++] = 0;
                data[ptr++] = 0;
                data[ptr++] = 0;
                continue;
              }

              const ll = unprojectScreenToLatLon(sx, sy, cx, cy, radius);
              if (!ll) {
                data[ptr++] = 0;
                data[ptr++] = 0;
                data[ptr++] = 0;
                data[ptr++] = 0;
                continue;
              }

              const nx = dx / radius;
              const ny = dy / radius;
              const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
              const sunDot = Math.max(0.35, -nx * 0.28 - ny * 0.24 + nz * 0.92);

              const u = (ll.lng + 180) / 360;
              const sinPhi = Math.max(-0.995, Math.min(0.995, Math.sin((ll.lat * Math.PI) / 180)));
              const vMerc = Math.max(
                0,
                Math.min(1, 0.5 - Math.log((1 + sinPhi) / (1 - sinPhi)) / (4 * Math.PI))
              );

              const tx = Math.min(satW - 1, Math.max(0, Math.floor(u * satW)));
              const ty = Math.min(satH - 1, Math.max(0, Math.floor(vMerc * satH)));
              const sIdx = (ty * satW + tx) * 4;

              data[ptr++] = Math.min(255, Math.max(0, Math.round(satPixels[sIdx] * sunDot)));
              data[ptr++] = Math.min(255, Math.max(0, Math.round(satPixels[sIdx + 1] * sunDot)));
              data[ptr++] = Math.min(255, Math.max(0, Math.round(satPixels[sIdx + 2] * sunDot)));
              data[ptr++] = 255;
            }
          }

          offCtx.putImageData(imgData, 0, 0);
          ctx.save();
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(offCanvas, 0, 0, width, height);
          ctx.restore();
        }
      }
    }

    // 3. Outer Atmospheric Horizon Rim
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    // 4. Draw User Study Zones on the 3D Globe
    zones.forEach((z) => {
      const pt = projectLatLonToGlobe(z.centroid.lat, z.centroid.lng, cx, cy, radius);
      if (!pt) return;
      const isSelected = z.id === activeZoneId;

      ctx.save();
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, isSelected ? 8 : 5.5, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? 'rgba(16, 185, 129, 0.95)' : 'rgba(56, 189, 248, 0.9)';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      const rawLabel = isAr ? z.nameAr : z.nameEn;
      const label =
        isAr && /[\u0600-\u06FF]/.test(rawLabel) ? `\u202B${rawLabel}\u202C` : rawLabel;
      ctx.font = 'bold 11px "Cairo", "Tajawal", sans-serif';
      ctx.direction = isAr ? 'rtl' : 'ltr';
      const tw = ctx.measureText(label).width + 14;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = isSelected ? '#10b981' : '#38bdf8';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(pt.x - tw / 2, pt.y - 26, tw, 18, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#f8fafc';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, pt.x, pt.y - 17);
      ctx.restore();
    });

    // 5. Draw Inspected Point Crosshair Marker ONLY after the user explicitly clicks a point on the globe (never pin a default study zone!)
    if (hasUserClickedPoint) {
      const inspPt = projectLatLonToGlobe(inspectedPoint.lat, inspectedPoint.lng, cx, cy, radius);
      if (inspPt) {
        ctx.save();
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(inspPt.x, inspPt.y, 9, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(inspPt.x, inspPt.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }, [
    activeZoneId,
    equirectangularThematicData,
    globeCenter,
    globeZoom,
    hasUserClickedPoint,
    inspectedPoint.lat,
    inspectedPoint.lng,
    isAr,
    projectLatLonToGlobe,
    satTilesLoadedCount,
    showThematicTintOnGlobe,
    soilMoistureOverlayEnabled,
    unprojectScreenToLatLon,
    webglReady,
    zones,
  ]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    movedDistanceRef.current = 0;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      lat: globeCenter.lat,
      lng: globeCenter.lng,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    movedDistanceRef.current = Math.hypot(dx, dy);

    const sensitivity = 0.25 / Math.max(0.8, globeZoom * 0.65);
    const nextLat = Math.max(-78, Math.min(78, dragStartRef.current.lat + dy * sensitivity));
    let nextLng = dragStartRef.current.lng - dx * sensitivity;
    nextLng = ((((nextLng + 180) % 360) + 360) % 360) - 180;

    const nextCenter = { lat: nextLat, lng: nextLng };
    globeCenterRef.current = nextCenter;
    setGlobeCenter(nextCenter);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const wasClick = movedDistanceRef.current < 6;
    setIsDragging(false);
    dragStartRef.current = null;

    if (wasClick && overlayCanvasRef.current) {
      const rect = overlayCanvasRef.current.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const baseRadius = Math.min(rect.width, rect.height) * 0.38;
      const radius = baseRadius * globeZoom;

      // Check if user clicked near an existing zone pin
      for (const z of zones) {
        const zPt = projectLatLonToGlobe(z.centroid.lat, z.centroid.lng, cx, cy, radius);
        if (zPt && Math.hypot(sx - zPt.x, sy - zPt.y) < 18) {
          onSelectZone?.(z.id);
          setHasUserClickedPoint(true);
          const nextPt = evaluatePointTelemetry(z.centroid.lat, z.centroid.lng);
          setInspectedPoint(nextPt);
          onInspectedPointChange?.(nextPt);
          return;
        }
      }

      const clickedLl = unprojectScreenToLatLon(sx, sy, cx, cy, radius);
      if (clickedLl) {
        setHasUserClickedPoint(true);
        const nextPt = evaluatePointTelemetry(clickedLl.lat, clickedLl.lng);
        setInspectedPoint(nextPt);
        onInspectedPointChange?.(nextPt);
      }
    }
  };

  // Cursor-aware Google Earth Zoom: Zooming steers toward the exact point under the mouse cursor and transitions seamlessly into that exact coordinate in 2D
  const applyGlobeZoomStep = (delta: number, cursorTargetLl?: LatLon | null) => {
    let resolvedCenter = globeCenterRef.current;

    if (delta > 0 && cursorTargetLl) {
      let dLng = cursorTargetLl.lng - resolvedCenter.lng;
      if (dLng > 180) dLng -= 360;
      if (dLng < -180) dLng += 360;
      const steerFactor = 0.32;
      const nextLat = Math.max(
        -78,
        Math.min(78, resolvedCenter.lat + (cursorTargetLl.lat - resolvedCenter.lat) * steerFactor)
      );
      const nextLng = ((((resolvedCenter.lng + dLng * steerFactor + 180) % 360) + 360) % 360) - 180;
      resolvedCenter = { lat: Number(nextLat.toFixed(4)), lng: Number(nextLng.toFixed(4)) };
      globeCenterRef.current = resolvedCenter;
      setGlobeCenter(resolvedCenter);

      const nextPt = evaluatePointTelemetry(cursorTargetLl.lat, cursorTargetLl.lng);
      setInspectedPoint(nextPt);
      onInspectedPointChange?.(nextPt);
    }

    const prevZoom = globeZoomRef.current;
    const nextZoom = Number((prevZoom + delta).toFixed(2));

    if (nextZoom > 5.2 && delta > 0) {
      // Seamless transition to detailed satellite map at the exact coordinate the user is zooming on (e.g., America, Europe, Asia, Africa)
      const flyTarget = cursorTargetLl ?? resolvedCenter;
      globeZoomRef.current = 4.8;
      setGlobeZoom(4.8);
      setTimeout(() => {
        onFlyToLocation2D(flyTarget, 6, false);
      }, 20);
      return;
    }

    const clampedZoom = Math.max(0.95, Math.min(5.2, nextZoom));
    globeZoomRef.current = clampedZoom;
    setGlobeZoom(clampedZoom);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.34 : -0.34;
    let cursorLl: LatLon | null = null;

    if (overlayCanvasRef.current) {
      const rect = overlayCanvasRef.current.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const baseRadius = Math.min(rect.width, rect.height) * 0.38;
      const radius = baseRadius * globeZoomRef.current;
      cursorLl = unprojectScreenToLatLon(sx, sy, cx, cy, radius);
    }

    applyGlobeZoomStep(delta, cursorLl);
  };

  const activeLayerTitle = soilMoistureOverlayEnabled
    ? isAr
      ? 'رطوبة التربة الحية (NASA SMAP)'
      : 'Live Soil Moisture (NASA SMAP)'
    : isAr
    ? THEMATIC_MAPS_META[activeThematicMap].shortAr
    : THEMATIC_MAPS_META[activeThematicMap].shortEn;

  return (
    <div
      data-testid="interactive-earth-globe-container"
      className="relative w-full h-full min-h-[540px] bg-slate-950 overflow-hidden select-none"
    >
      {/* Hardware-Accelerated WebGL 3D Globe Surface Canvas */}
      <canvas
        ref={webglCanvasRef}
        data-testid="interactive-earth-globe-webgl-canvas"
        className="absolute inset-0 w-full h-full block pointer-events-none"
      />

      {/* Interactive Vector HUD & Pin Overlay Canvas */}
      <canvas
        ref={overlayCanvasRef}
        data-testid="interactive-earth-globe-canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => setIsDragging(false)}
        onWheel={handleWheel}
        className={`relative z-10 w-full h-full block ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      />

      {/* Quick Region Jump & Satellite Overlay Toggle (Hidden when parent renders unified draggable floating launcher) */}
      <div
        className={
          hideInternalBottomTrigger
            ? 'sr-only pointer-events-none'
            : 'absolute top-3 right-3 z-[1010] flex flex-wrap items-center justify-end gap-1.5 px-2.5 py-1.5 rounded-2xl bg-slate-950/90 border border-slate-700/80 shadow-xl max-w-[62vw]'
        }
      >
        <span className="text-[11px] font-bold text-sky-400 flex items-center gap-1 px-1 whitespace-nowrap">
          <Globe className="w-3.5 h-3.5" />
          {isAr ? 'انتقال سريع:' : 'Jump:'}
        </span>
        {QUICK_GLOBE_REGIONS.map((reg) => (
          <button
            key={reg.id}
            type="button"
            data-testid={`globe-region-btn-${reg.id}`}
            onClick={() => {
              const target = { lat: reg.lat, lng: reg.lng };
              globeCenterRef.current = target;
              globeZoomRef.current = reg.zoom;
              setGlobeCenter(target);
              setGlobeZoom(reg.zoom);
              const nextPt = evaluatePointTelemetry(reg.lat, reg.lng);
              setInspectedPoint(nextPt);
              onInspectedPointChange?.(nextPt);
            }}
            className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-slate-900/90 text-slate-200 hover:bg-sky-500/20 hover:text-sky-300 border border-slate-700/70 transition cursor-pointer whitespace-nowrap"
          >
            {isAr ? reg.labelAr : reg.labelEn}
          </button>
        ))}

        <button
          type="button"
          data-testid="globe-thematic-tint-toggle-btn"
          onClick={() => setShowThematicTintOnGlobe((prev) => !prev)}
          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition cursor-pointer whitespace-nowrap flex items-center gap-1 ${
            showThematicTintOnGlobe
              ? 'bg-emerald-600 text-white border-emerald-400'
              : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
          }`}
          title={
            isAr
              ? 'إظهار/إخفاء التلوين الطيفي فوق صور القمر الصناعي الحقيقية'
              : 'Toggle thematic color tint over photorealistic satellite globe'
          }
        >
          <Layers className="w-3 h-3" />
          <span>{showThematicTintOnGlobe ? (isAr ? 'طبقة المؤشر: مفعلة' : 'Overlay: ON') : isAr ? 'قمر صناعي حقيقي' : 'True Satellite'}</span>
        </button>
      </div>

      {/* Left Zoom & Rotation Controls (Supports continuous zoom into 2D farm level) */}
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 z-[1010] flex flex-col gap-2 bg-slate-950/90 p-2 rounded-2xl border border-slate-700/80 shadow-xl">
        <button
          type="button"
          data-testid="globe-zoom-in-btn"
          onClick={() => applyGlobeZoomStep(0.55)}
          className="p-2 rounded-xl bg-slate-900 text-slate-200 hover:bg-emerald-500/20 hover:text-emerald-300 border border-slate-700 cursor-pointer"
          title={isAr ? 'تقريب الكوكب (استمر للتقريب حتى مستوى المزرعة)' : 'Zoom In Globe (continue to zoom to farm level)'}
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <div className="text-[10px] font-mono font-bold text-center text-sky-300 tabular-nums">
          {globeZoom.toFixed(1)}x
        </div>
        <button
          type="button"
          data-testid="globe-zoom-out-btn"
          onClick={() => applyGlobeZoomStep(-0.55)}
          className="p-2 rounded-xl bg-slate-900 text-slate-200 hover:bg-emerald-500/20 hover:text-emerald-300 border border-slate-700 cursor-pointer"
          title={isAr ? 'تصغير الكوكب' : 'Zoom Out Globe'}
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            const resetCenter = { lat: 24.0, lng: 18.0 };
            globeCenterRef.current = resetCenter;
            globeZoomRef.current = 1.55;
            setGlobeCenter(resetCenter);
            setGlobeZoom(1.55);
            setHasUserClickedPoint(false);
          }}
          className="p-2 rounded-xl bg-slate-900 text-slate-200 hover:bg-sky-500/20 hover:text-sky-300 border border-slate-700 cursor-pointer"
          title={isAr ? 'إعادة ضبط عرض الكوكب الحر' : 'Reset Free Globe View'}
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Optional standalone bottom pill if parent does not render unified bottom pills */}
      {!hideInternalBottomTrigger && (
        <div className="absolute bottom-3 right-4 z-[1010]">
          <button
            type="button"
            data-testid="globe-standalone-telemetry-pill-btn"
            onClick={() => setTelemetryOpen(!isTelemetryOpen)}
            className="px-3.5 py-2 rounded-2xl bg-slate-950/95 border border-sky-500/50 text-xs font-extrabold text-sky-300 hover:bg-slate-900 shadow-xl flex items-center gap-2 cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {isAr
                ? `بيانات النقطة (${inspectedPoint.lat.toFixed(2)}°N, ${inspectedPoint.lng.toFixed(2)}°E)`
                : `Point Telemetry (${inspectedPoint.lat.toFixed(2)}°N, ${inspectedPoint.lng.toFixed(2)}°E)`}
            </span>
            {isTelemetryOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}

      {/* Collapsible Live NASA POWER Point Telemetry & Zoom-to-Zone Action Card (Hidden by default until user clicks the bottom button!) */}
      <div
        data-testid="globe-nasa-inspector-card"
        className={
          isTelemetryOpen
            ? 'absolute bottom-16 left-1/2 -translate-x-1/2 w-[94vw] max-w-[460px] z-[1020] bg-slate-950/95 border border-sky-500/50 rounded-2xl p-3.5 shadow-2xl text-slate-100 animate-in fade-in duration-150'
            : 'sr-only pointer-events-none'
        }
      >
        <div className="flex items-center justify-between gap-2 pb-2 mb-2.5 border-b border-slate-800">
          <div>
            <div className="text-xs font-extrabold text-white flex items-center gap-1.5">
              <span>
                {isAr
                  ? 'بيانات وكالة ناسا الفضائية للنقطة المحددة (NASA POWER & GIBS)'
                  : 'NASA POWER & GIBS Point Telemetry'}
              </span>
            </div>
            <div className="text-[11px] font-mono text-sky-300 tabular-nums">
              {inspectedPoint.lat.toFixed(3)}°N, {inspectedPoint.lng.toFixed(3)}°E ·{' '}
              <span className="text-emerald-300">{activeLayerTitle}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              data-testid="globe-webgl-engine-badge"
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 whitespace-nowrap"
            >
              <Cpu className="w-3 h-3" />
              <span>{webglReady ? 'WebGL 3D' : '3D Engine'}</span>
            </span>
            <button
              type="button"
              onClick={() => setTelemetryOpen(false)}
              className="p-1 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white cursor-pointer"
              title={isAr ? 'إغلاق' : 'Close'}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3 text-[11px]">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2">
            <div className="text-slate-400 flex items-center gap-1 text-[10px]">
              <Thermometer className="w-3 h-3 text-amber-400" />
              {isAr ? 'الحرارة (T2M/TS)' : 'Temp (T2M/TS)'}
            </div>
            <div className="font-mono font-bold text-white mt-0.5 tabular-nums">
              {inspectedPoint.tempC}°C / {inspectedPoint.skinTempC}°C
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2">
            <div className="text-slate-400 flex items-center gap-1 text-[10px]">
              <CloudRain className="w-3 h-3 text-sky-400" />
              {isAr ? 'الأمطار (IMERG)' : 'Rain (IMERG)'}
            </div>
            <div className="font-mono font-bold text-white mt-0.5 tabular-nums">
              {inspectedPoint.precipMm} mm ({inspectedPoint.precipProbPct}%)
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2">
            <div className="text-slate-400 flex items-center gap-1 text-[10px]">
              <Sun className="w-3 h-3 text-yellow-400" />
              {isAr ? 'الإشعاع الشمسي' : 'Solar Rad'}
            </div>
            <div className="font-mono font-bold text-white mt-0.5 tabular-nums">
              {inspectedPoint.solarRadMjM2} MJ/m²
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2">
            <div className="text-slate-400 flex items-center gap-1 text-[10px]">
              <Droplets className="w-3 h-3 text-cyan-400" />
              {isAr ? 'رطوبة التربة والجو' : 'Soil & Air RH'}
            </div>
            <div className="font-mono font-bold text-white mt-0.5 tabular-nums">
              {inspectedPoint.isOcean
                ? `${inspectedPoint.humidityPct}% RH`
                : `${inspectedPoint.soilMoisture0cmPct}% SM · ${inspectedPoint.humidityPct}%`}
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2">
            <div className="text-slate-400 flex items-center gap-1 text-[10px]">
              <Wind className="w-3 h-3 text-teal-400" />
              {isAr ? 'الرياح (WS2M)' : 'Wind (WS2M)'}
            </div>
            <div className="font-mono font-bold text-white mt-0.5 tabular-nums">
              {inspectedPoint.windSpeedKmh} km/h {inspectedPoint.windCardinal}
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2">
            <div className="text-slate-400 flex items-center gap-1 text-[10px]">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              {isAr ? 'NDVI / الارتفاع' : 'NDVI / Elev'}
            </div>
            <div className="font-mono font-bold text-white mt-0.5 tabular-nums">
              {inspectedPoint.isOcean
                ? isAr
                  ? 'مسطح بحري'
                  : 'Marine'
                : `${inspectedPoint.ndviEstimate} · ${inspectedPoint.elevationMeters}m`}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-testid="globe-fly-to-2d-btn"
            onClick={() => {
              setTelemetryOpen(false);
              onFlyToLocation2D({ lat: inspectedPoint.lat, lng: inspectedPoint.lng }, 15, false);
            }}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40 transition cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            {isAr
              ? 'تقريب للمنطقة وفتح الخريطة التفصيلية 2D'
              : 'Zoom into Region & Open Detailed 2D Map'}
          </button>

          <button
            type="button"
            data-testid="globe-draw-zone-here-btn"
            onClick={() => {
              setTelemetryOpen(false);
              onFlyToLocation2D({ lat: inspectedPoint.lat, lng: inspectedPoint.lng }, 16, true);
            }}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-900/40 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            {isAr ? 'تحديد زونة هنا' : 'Draw Zone Here'}
          </button>
        </div>
      </div>
    </div>
  );
};
