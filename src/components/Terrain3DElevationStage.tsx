import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Layers, Mountain, RotateCcw, Sliders, X } from 'lucide-react';
import {
  ElevationColorPalette,
} from '../types/agro';
import {
  GlobalElevationPointReading,
  STEPPED_ELEVATION_TIERS,
  evaluateGlobalElevationAtLatLon,
  getElevationRgbTuple,
  getSteppedElevationTierIndex,
  isMarineOrOceanWaterAtLatLon,
  requestTerrariumTilesForBounds,
  sampleTerrariumElevationAtLatLon,
  subscribeTerrariumTilesReady,
} from '../utils/thematicMapRenderer';

interface Terrain3DElevationStageProps {
  isAr: boolean;
  bounds: { south: number; north: number; west: number; east: number };
  elevationPalette: ElevationColorPalette;
  onClose: () => void;
  onInspectElevation?: (reading: GlobalElevationPointReading) => void;
}

export const Terrain3DElevationStage: React.FC<Terrain3DElevationStageProps> = ({
  isAr,
  bounds,
  elevationPalette,
  onClose,
  onInspectElevation,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [terrariumRev, setTerrariumRev] = useState<number>(0);
  const [steppedTerraces, setSteppedTerraces] = useState<boolean>(true);
  const [exaggeration, setExaggeration] = useState<number>(2.8);
  const [clickedSample, setClickedSample] = useState<GlobalElevationPointReading | null>(null);
  const [elevRange, setElevRange] = useState<{ minM: number; maxM: number }>({ minM: 0, maxM: 1200 });

  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const gridMetaRef = useRef<{
    cols: number;
    rows: number;
    south: number;
    north: number;
    west: number;
    east: number;
    worldWidth: number;
    worldDepth: number;
  } | null>(null);

  // Subscribe to real AWS Terrarium DEM tiles as they stream in
  useEffect(() => {
    const unsub = subscribeTerrariumTilesReady(() => {
      setTerrariumRev((r) => r + 1);
    });
    return unsub;
  }, []);

  // Trigger Terrarium DEM tile fetch for current bounds
  useEffect(() => {
    const spanLng = Math.max(0.02, bounds.east - bounds.west);
    const demZoom =
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
    requestTerrariumTilesForBounds(bounds.south, bounds.north, bounds.west, bounds.east, demZoom);
  }, [bounds.south, bounds.north, bounds.west, bounds.east]);

  const rebuildMeshGeometry = useCallback(
    (mesh: THREE.Mesh, demZoom: number) => {
      const cols = 150;
      const rows = 104;
      const worldWidth = 110;
      const worldDepth = 76;

      gridMetaRef.current = {
        cols,
        rows,
        south: bounds.south,
        north: bounds.north,
        west: bounds.west,
        east: bounds.east,
        worldWidth,
        worldDepth,
      };

      const latSpan = Math.max(0.02, bounds.north - bounds.south);
      const lngSpan = Math.max(0.02, bounds.east - bounds.west);
      const pixelStepDeg = Math.hypot(latSpan / rows, lngSpan / cols);

      const elevations = new Float32Array((cols + 1) * (rows + 1));
      const oceanFlags = new Uint8Array((cols + 1) * (rows + 1));
      let minM = Infinity;
      let maxM = -Infinity;

      for (let r = 0; r <= rows; r++) {
        const lat = bounds.north - (r / rows) * latSpan;
        for (let c = 0; c <= cols; c++) {
          const lng = bounds.west + (c / cols) * lngSpan;
          const idx = r * (cols + 1) + c;

          const isOcean = isMarineOrOceanWaterAtLatLon(lat, lng);
          if (isOcean) {
            oceanFlags[idx] = 1;
            elevations[idx] = -25;
            continue;
          }

          const realDem = sampleTerrariumElevationAtLatLon(lat, lng, demZoom);
          let elevM: number;
          if (realDem !== null) {
            if (
              realDem < -2.5 &&
              !(lat >= 28 && lat <= 32 && lng >= 25 && lng <= 36) &&
              !(lat >= 51 && lat <= 54 && lng >= 3 && lng <= 7)
            ) {
              oceanFlags[idx] = 1;
              elevM = -25;
            } else {
              elevM = realDem;
            }
          } else {
            elevM = evaluateGlobalElevationAtLatLon(
              lat,
              lng,
              pixelStepDeg,
              elevationPalette
            ).elevationExactMeters;
          }

          elevations[idx] = elevM;
          if (elevM < minM) minM = elevM;
          if (elevM > maxM) maxM = elevM;
        }
      }

      if (!Number.isFinite(minM) || !Number.isFinite(maxM)) {
        minM = 0;
        maxM = 800;
      }
      setElevRange({ minM: Math.round(minM), maxM: Math.round(maxM) });

      const elevSpan = Math.max(80, maxM - Math.min(0, minM));
      const maxHeightUnits = 9.5 * exaggeration;

      // Build stepped terrace heights if steppedTerraces is enabled, otherwise smooth heights
      const tierStepHeights = [0.08, 0.35, 1.0, 2.0, 3.3, 5.0, 7.1, 9.6];

      const geom = new THREE.PlaneGeometry(worldWidth, worldDepth, cols, rows);
      geom.rotateX(-Math.PI / 2);

      const posAttr = geom.attributes.position as THREE.BufferAttribute;
      const colors = new Float32Array(posAttr.count * 3);

      for (let i = 0; i < posAttr.count; i++) {
        const isOcean = oceanFlags[i] === 1;
        const elevM = elevations[i];

        if (isOcean) {
          posAttr.setY(i, -0.45);
          colors[i * 3] = 9 / 255;
          colors[i * 3 + 1] = 36 / 255;
          colors[i * 3 + 2] = 74 / 255;
          continue;
        }

        const tierIdx = getSteppedElevationTierIndex(elevM);
        const [cr, cg, cb] = getElevationRgbTuple(elevM, elevationPalette);

        let yHeight: number;
        if (steppedTerraces) {
          // Crisp terraced stair-stepped height per elevation band + micro slope inside band
          const bandBase = (tierStepHeights[tierIdx] / 9.6) * maxHeightUnits;
          const prevMax = tierIdx === 0 ? -100 : STEPPED_ELEVATION_TIERS[tierIdx - 1].maxMeters;
          const nextMax =
            STEPPED_ELEVATION_TIERS[tierIdx].maxMeters === Infinity
              ? 6000
              : STEPPED_ELEVATION_TIERS[tierIdx].maxMeters;
          const localFrac = Math.max(0, Math.min(1, (elevM - prevMax) / Math.max(1, nextMax - prevMax)));
          yHeight = bandBase + localFrac * 0.25 * exaggeration;
        } else {
          const norm = Math.max(0, (elevM - Math.min(0, minM)) / elevSpan);
          yHeight = Math.pow(norm, 0.85) * maxHeightUnits;
        }

        posAttr.setY(i, yHeight);
        colors[i * 3] = cr / 255;
        colors[i * 3 + 1] = cg / 255;
        colors[i * 3 + 2] = cb / 255;
      }

      geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geom.computeVertexNormals();

      const oldGeom = mesh.geometry;
      mesh.geometry = geom;
      oldGeom.dispose();
    },
    [bounds.south, bounds.north, bounds.west, bounds.east, elevationPalette, exaggeration, steppedTerraces]
  );

  // Initialize Three.js WebGL Scene, Lighting, OrbitControls & Raycasting
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 900;
    const height = container.clientHeight || 560;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#020617');
    scene.fog = new THREE.Fog('#020617', 120, 260);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 500);
    camera.position.set(0, 56, 78);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI * 0.46;
    controls.minDistance = 24;
    controls.maxDistance = 175;
    controls.target.set(0, 2, 0);
    controls.update();
    controlsRef.current = controls;

    // 3-Point Topographic Relief Lighting (Strong NW Sun + Sky Hemisphere + Subtle Rim)
    const hemiLight = new THREE.HemisphereLight('#e0f2fe', '#0f172a', 0.85);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight('#fffbeb', 1.85);
    sunLight.position.set(-55, 78, -42);
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight('#38bdf8', 0.45);
    fillLight.position.set(48, 30, 52);
    scene.add(fillLight);

    // Subtle ocean sea-level base reference plate
    const seaGeo = new THREE.PlaneGeometry(110.2, 76.2);
    seaGeo.rotateX(-Math.PI / 2);
    const seaMat = new THREE.MeshStandardMaterial({
      color: '#08254a',
      roughness: 0.72,
      metalness: 0.12,
    });
    const seaMesh = new THREE.Mesh(seaGeo, seaMat);
    seaMesh.position.y = -0.5;
    scene.add(seaMesh);

    const terrainMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.78,
      metalness: 0.06,
      flatShading: true,
    });
    const terrainGeo = new THREE.PlaneGeometry(110, 76, 16, 16);
    terrainGeo.rotateX(-Math.PI / 2);
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    scene.add(terrainMesh);
    meshRef.current = terrainMesh;

    const spanLng = Math.max(0.02, bounds.east - bounds.west);
    const demZoom =
      spanLng > 90 ? 3 : spanLng > 40 ? 4 : spanLng > 15 ? 5 : spanLng > 5 ? 6 : spanLng > 1.5 ? 7 : 8;
    rebuildMeshGeometry(terrainMesh, demZoom);

    // Raycast click-to-inspect elevation on the 3D terrain mesh
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let downX = 0;
    let downY = 0;

    const onPointerDown = (ev: PointerEvent) => {
      downX = ev.clientX;
      downY = ev.clientY;
    };

    const onPointerUp = (ev: PointerEvent) => {
      if (Math.hypot(ev.clientX - downX, ev.clientY - downY) > 6) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObject(terrainMesh, false);
      if (hits.length > 0 && gridMetaRef.current) {
        const p = hits[0].point;
        const m = gridMetaRef.current;
        const u = Math.max(0, Math.min(1, p.x / m.worldWidth + 0.5));
        const v = Math.max(0, Math.min(1, p.z / m.worldDepth + 0.5));
        const lat = Number((m.north - v * (m.north - m.south)).toFixed(4));
        const lng = Number((m.west + u * (m.east - m.west)).toFixed(4));
        const realDem = sampleTerrariumElevationAtLatLon(lat, lng, demZoom);
        const reading = evaluateGlobalElevationAtLatLon(lat, lng, 0.01, elevationPalette);
        const resolved =
          realDem !== null
            ? {
                ...reading,
                elevationMeters: Math.round(realDem),
                elevationExactMeters: Number(realDem.toFixed(1)),
              }
            : reading;
        setClickedSample(resolved);
        onInspectElevation?.(resolved);
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    let animId = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const w = Math.max(100, entry.contentRect.width);
      const h = Math.max(100, entry.contentRect.height);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    ro.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      controls.dispose();
      seaGeo.dispose();
      seaMat.dispose();
      terrainMesh.geometry.dispose();
      terrainMat.dispose();
      renderer.dispose();
      meshRef.current = null;
      controlsRef.current = null;
      cameraRef.current = null;
    };
  }, []);

  // Rebuild geometry smoothly when Terrarium tiles load or stepped/exaggeration/palette changes
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const spanLng = Math.max(0.02, bounds.east - bounds.west);
    const demZoom =
      spanLng > 90 ? 3 : spanLng > 40 ? 4 : spanLng > 15 ? 5 : spanLng > 5 ? 6 : spanLng > 1.5 ? 7 : 8;
    const mat = mesh.material as THREE.MeshStandardMaterial;
    mat.flatShading = steppedTerraces;
    mat.needsUpdate = true;
    rebuildMeshGeometry(mesh, demZoom);
  }, [terrariumRev, rebuildMeshGeometry, bounds.east, bounds.west, steppedTerraces]);

  const handleResetCamera = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(0, 56, 78);
      controlsRef.current.target.set(0, 2, 0);
      controlsRef.current.update();
    }
  };

  return (
    <div
      data-testid="terrain-3d-elevation-stage"
      className="absolute inset-0 z-35 bg-slate-950/98 flex flex-col overflow-hidden"
    >
      {/* Top Compact HUD Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 bg-slate-950/95 border-b border-slate-800 z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center">
            <Mountain className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-xs font-extrabold text-white">
              {isAr
                ? 'مجسم التضاريس والارتفاعات ثلاثي الأبعاد الحقيقي (SRTM 3D)'
                : 'Real 3D Extruded Terrain Relief (SRTM 3D)'}
            </div>
            <div className="text-[10px] font-mono text-slate-400 tabular-nums">
              {isAr ? 'اسحب للتدوير والإمالة · عجلة الفأرة للتقريب · انقر لقياس الارتفاع' : 'Drag to orbit & tilt · Scroll to zoom · Click peak to measure'}
              {' · '}
              <span className="text-emerald-400">
                {elevRange.minM}m – {elevRange.maxM}m ASL
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Stepped Terraces vs Smooth 3D Relief */}
          <button
            type="button"
            data-testid="terrain-3d-stepped-toggle-btn"
            onClick={() => setSteppedTerraces((prev) => !prev)}
            className={`min-h-[28px] px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 border cursor-pointer transition-colors ${
              steppedTerraces
                ? 'bg-emerald-600 text-white border-emerald-400'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>
              {steppedTerraces
                ? isAr
                  ? 'مستويات متدرجة 3D'
                  : 'Stepped Tiers 3D'
                : isAr
                ? 'سطح متدرج ناعم'
                : 'Smooth 3D Surface'}
            </span>
          </button>

          {/* Vertical Exaggeration Slider */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 text-[11px]">
            <Sliders className="w-3 h-3 text-amber-400" />
            <span className="text-slate-300">{isAr ? 'بروز الارتفاع:' : 'Relief:'}</span>
            <input
              type="range"
              min={1.0}
              max={6.0}
              step={0.2}
              value={exaggeration}
              onChange={(e) => setExaggeration(Number(e.target.value))}
              className="w-20 accent-emerald-500 cursor-pointer h-1.5"
            />
            <span className="font-mono text-emerald-300 tabular-nums">{exaggeration.toFixed(1)}x</span>
          </div>

          <button
            type="button"
            onClick={handleResetCamera}
            className="min-h-[28px] px-2 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
            title={isAr ? 'إعادة ضبط زاوية الكاميرا' : 'Reset 3D Camera'}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            data-testid="terrain-3d-close-btn"
            onClick={onClose}
            className="min-h-[28px] px-2.5 py-1 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white text-[11px] font-extrabold flex items-center gap-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>{isAr ? 'العودة للخريطة' : 'Back to Map'}</span>
          </button>
        </div>
      </div>

      {/* Three.js WebGL Terrain Canvas Container */}
      <div className="relative flex-1 w-full h-full">
        <div ref={containerRef} className="w-full h-full" />

        {/* Discrete Tier Color Legend Strip in Bottom Left */}
        <div className="absolute bottom-3 left-3 z-20 flex flex-wrap items-center gap-1.5 bg-slate-950/90 border border-slate-700/85 rounded-2xl px-2.5 py-1.5 shadow-xl max-w-[92vw]">
          {STEPPED_ELEVATION_TIERS.map((tier, idx) => (
            <div key={idx} className="flex items-center gap-1 text-[10px] font-mono text-slate-200 whitespace-nowrap">
              <span
                className="w-2.5 h-2.5 rounded-xs border border-white/30 shrink-0"
                style={{
                  backgroundColor:
                    elevationPalette === 'classic_topographic' ? tier.hexClassic : tier.hexScientific,
                }}
              />
              <span>{tier.rangeLabel}</span>
            </div>
          ))}
        </div>

        {/* Clicked Point Elevation Badge */}
        {clickedSample && (
          <div className="absolute top-3 left-3 z-20 bg-slate-950/95 border border-emerald-500/60 rounded-2xl px-3 py-2 shadow-2xl text-xs">
            <div className="font-mono text-[10px] text-sky-300 tabular-nums">
              {clickedSample.lat.toFixed(3)}°N, {clickedSample.lng.toFixed(3)}°E
            </div>
            <div className="font-extrabold text-emerald-300 font-mono text-sm tabular-nums mt-0.5">
              {clickedSample.elevationMeters} m ASL
            </div>
            <div className="text-[11px] text-slate-300">
              {isAr ? clickedSample.landformAr : clickedSample.landformEn}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
