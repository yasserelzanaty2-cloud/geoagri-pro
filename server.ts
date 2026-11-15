import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { FunctionDeclaration, GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import {
  clearAllUserStudyZonesByUid,
  deleteUserStudyZoneByUid,
  getOrCreateUser,
  getUserStudyZonesByUid,
  upsertUserStudyZoneByUid,
} from './src/db/users.ts';
import {
  AdvisorSiteInventory,
  mapGeminiToolCallsToSiteActions,
} from './src/utils/advisorToolMapper.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '25mb' }));

  app.post('/api/users/sync', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      if (!uid) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const email = req.user?.email || `${uid}@geoagri.local`;
      const { displayName, photoURL, preferredLanguage, activeZoneId, clearActiveZone } =
        req.body || {};
      const resolvedActiveZoneId =
        clearActiveZone === true
          ? null
          : typeof activeZoneId === 'string' && activeZoneId.trim().length > 0
          ? activeZoneId.trim().slice(0, 128)
          : undefined;
      const userRecord = await getOrCreateUser(uid, email, {
        displayName: typeof displayName === 'string' ? displayName : req.user?.name || null,
        photoUrl: typeof photoURL === 'string' ? photoURL : req.user?.picture || null,
        preferredLanguage: typeof preferredLanguage === 'string' ? preferredLanguage : 'ar',
        ...(resolvedActiveZoneId !== undefined ? { activeZoneId: resolvedActiveZoneId } : {}),
      });
      res.json({ user: userRecord });
    } catch (error: unknown) {
      console.error('Failed to sync user profile:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to sync user profile',
      });
    }
  });

  app.get('/api/zones', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      if (!uid) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const email = req.user?.email || `${uid}@geoagri.local`;
      await getOrCreateUser(uid, email);
      const rows = await getUserStudyZonesByUid(uid);
      res.json({ zones: rows });
    } catch (error: unknown) {
      console.error('Failed to fetch study zones:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to fetch study zones',
      });
    }
  });

  app.post('/api/zones', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      if (!uid) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const email = req.user?.email || `${uid}@geoagri.local`;
      const zone = req.body?.zone;
      if (!zone || typeof zone.id !== 'string') {
        res.status(400).json({ error: 'Valid zone payload is required' });
        return;
      }

      const saved = await upsertUserStudyZoneByUid(uid, email, {
        zoneId: String(zone.id).slice(0, 128),
        nameAr: String(zone.nameAr || 'Study Zone').slice(0, 120),
        nameEn: String(zone.nameEn || 'Study Zone').slice(0, 120),
        categoryAr: String(zone.categoryAr || 'حقل محاصيل').slice(0, 120),
        categoryEn: String(zone.categoryEn || 'Crop Plot').slice(0, 120),
        color: String(zone.color || '#10b981').slice(0, 24),
        currentCropId: String(zone.currentCropId || 'wheat').slice(0, 64),
        customCropLabel:
          typeof zone.customCropLabel === 'string' ? zone.customCropLabel.slice(0, 120) : null,
        plantingDateIso: String(zone.plantingDateISO || '2026-10-10').slice(0, 32),
        payloadJson: JSON.stringify(zone),
      });
      res.json({ zone: saved });
    } catch (error: unknown) {
      console.error('Failed to save study zone:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to save study zone',
      });
    }
  });

  app.delete('/api/zones/:zoneId', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      if (!uid) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const zoneId = String(req.params.zoneId || '').slice(0, 128);
      await deleteUserStudyZoneByUid(uid, zoneId);
      res.json({ deleted: true });
    } catch (error: unknown) {
      console.error('Failed to delete study zone:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to delete study zone',
      });
    }
  });

  app.delete('/api/zones', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      if (!uid) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      await clearAllUserStudyZonesByUid(uid);
      res.json({ cleared: true });
    } catch (error: unknown) {
      console.error('Failed to clear study zones:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to clear study zones',
      });
    }
  });

  // Authoritative GIS Data Proxy Endpoints (ISRIC SoilGrids v2.0, Open-Meteo Live Grid, ESA WorldCover 10m WMTS)
  const gisJsonCache = new Map<string, { expiresAt: number; payload: unknown }>();
  const setGisCache = (key: string, payload: unknown, ttlMs: number) => {
    if (gisJsonCache.size >= 300) {
      const oldest = gisJsonCache.keys().next().value;
      if (oldest) gisJsonCache.delete(oldest);
    }
    gisJsonCache.set(key, { expiresAt: Date.now() + ttlMs, payload });
  };

  app.get('/api/gis/soilgrids', async (req, res) => {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon ?? req.query.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      res.status(400).json({ error: 'Valid lat and lon query parameters are required' });
      return;
    }

    const cacheKey = `sg:${lat.toFixed(2)},${lon.toFixed(2)}`;
    const cached = gisJsonCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      res.json(cached.payload);
      return;
    }

    try {
      const url = `https://rest.isric.org/soilgrids/v2.0/properties/query?lon=${lon.toFixed(
        4
      )}&lat=${lat.toFixed(
        4
      )}&property=phh2o&property=soc&property=clay&property=sand&depth=0-5cm&depth=5-15cm&value=mean`;
      const upstream = await fetch(url, {
        signal: AbortSignal.timeout(5500),
        headers: { Accept: 'application/json', 'User-Agent': 'GeoAgriPro/1.0' },
      });
      if (!upstream.ok) {
        res.json({ soil: null });
        return;
      }
      const rawJson = (await upstream.json()) as {
        properties?: { layers?: Array<{ name?: string; depths?: Array<{ values?: { mean?: number } }> }> };
      };
      const layers = rawJson?.properties?.layers;
      if (!Array.isArray(layers)) {
        res.json({ soil: null });
        return;
      }
      const getLayerMean = (name: string): number | null => {
        const hit = layers.find((l) => l.name === name);
        const val = hit?.depths?.[0]?.values?.mean;
        return typeof val === 'number' && Number.isFinite(val) ? val : null;
      };
      const phRaw = getLayerMean('phh2o');
      const socRaw = getLayerMean('soc');
      const clayRaw = getLayerMean('clay');
      const sandRaw = getLayerMean('sand');

      if (phRaw === null && socRaw === null && clayRaw === null) {
        res.json({ soil: null });
        return;
      }

      const ph = phRaw !== null ? Number(Math.max(4.5, Math.min(9.5, phRaw / 10)).toFixed(2)) : 7.4;
      const organicMatterPct =
        socRaw !== null ? Number(Math.max(0.2, Math.min(10, socRaw * 0.01724)).toFixed(2)) : 1.8;
      const clayPct = clayRaw !== null ? Number((clayRaw / 10).toFixed(1)) : 32;
      const sandPct = sandRaw !== null ? Number((sandRaw / 10).toFixed(1)) : 34;
      const ecEstimateDsM = Number(
        Math.max(
          0.45,
          Math.min(5.5, 0.75 + (ph > 7.6 ? (ph - 7.6) * 1.15 : 0) + (clayPct > 38 ? 0.35 : 0))
        ).toFixed(2)
      );

      const payload = {
        soil: {
          lat,
          lng: lon,
          ph,
          organicMatterPct,
          clayPct,
          sandPct,
          ecEstimateDsM,
          source: 'ISRIC SoilGrids v2.0 (250m)' as const,
        },
      };
      setGisCache(cacheKey, payload, 15 * 60 * 1000);
      res.json(payload);
    } catch {
      res.json({ soil: null });
    }
  });

  app.get('/api/gis/open-meteo-grid', async (req, res) => {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon ?? req.query.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      res.status(400).json({ error: 'Valid lat and lon query parameters are required' });
      return;
    }

    const cacheKey = `om:${lat.toFixed(2)},${lon.toFixed(2)}`;
    const cached = gisJsonCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      res.json(cached.payload);
      return;
    }

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(
        4
      )}&longitude=${lon.toFixed(
        4
      )}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,soil_moisture_0_to_1cm,soil_moisture_3_to_9cm,soil_moisture_9_to_27cm&timezone=UTC`;
      const upstream = await fetch(url, { signal: AbortSignal.timeout(5500) });
      if (!upstream.ok) {
        res.json({ current: null });
        return;
      }
      const data = await upstream.json();
      setGisCache(cacheKey, data, 10 * 60 * 1000);
      res.json(data);
    } catch {
      res.json({ current: null });
    }
  });

  app.get('/api/gis/worldcover/:z/:x/:y', async (req, res) => {
    const z = Number.parseInt(String(req.params.z), 10);
    const x = Number.parseInt(String(req.params.x), 10);
    const y = Number.parseInt(String(req.params.y), 10);
    if (!Number.isFinite(z) || !Number.isFinite(x) || !Number.isFinite(y) || z < 0 || z > 16) {
      res.status(400).end();
      return;
    }
    const n = Math.pow(2, z);
    const wx = ((x % n) + n) % n;
    const wy = Math.max(0, Math.min(n - 1, y));

    const fetchPng = async (url: string, timeoutMs: number): Promise<Buffer | null> => {
      try {
        const upstream = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
        if (!upstream.ok) return null;
        const ctype = upstream.headers.get('content-type') || '';
        if (!ctype.includes('image/png') && !ctype.includes('image/')) return null;
        const buf = Buffer.from(await upstream.arrayBuffer());
        return buf.length > 64 ? buf : null;
      } catch {
        return null;
      }
    };

    try {
      const origin = 20037508.342789244;
      const tileMeters = (2 * origin) / n;
      const minX = -origin + wx * tileMeters;
      const maxX = minX + tileMeters;
      const maxY = origin - wy * tileMeters;
      const minY = maxY - tileMeters;

      // Primary: Impact Observatory / Microsoft / Esri Sentinel-2 10m Land Cover (fast, reliable EPSG:3857 nearest-neighbor)
      const esri10mUrl = `https://ic.imagery1.arcgis.com/arcgis/rest/services/Sentinel2_10m_LandCover/ImageServer/exportImage?bbox=${minX.toFixed(
        2
      )},${minY.toFixed(2)},${maxX.toFixed(2)},${maxY.toFixed(
        2
      )}&bboxSR=3857&imageSR=3857&size=256,256&interpolation=RSP_NearestNeighbor&format=png32&f=image`;

      // Secondary: ESA WorldCover 2021 10m WMTS
      const terrascopeUrl = `https://wmts.terrascope.be?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=esa-worldcover-map-10m-2021-v2_map&STYLE=default&FORMAT=image/png&TILEMATRIXSET=EPSG:3857&TILEMATRIX=${z}&TILEROW=${wy}&TILECOL=${wx}&TIME=2021-01-01`;

      const buf = (await fetchPng(esri10mUrl, 6000)) ?? (await fetchPng(terrascopeUrl, 3000));
      if (!buf) {
        res.status(502).end();
        return;
      }
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.send(buf);
    } catch {
      res.status(502).end();
    }
  });

  app.post('/api/transcribe', async (req, res) => {
    const { audioBase64, mimeType, language } = req.body || {};

    if (
      typeof audioBase64 !== 'string' ||
      audioBase64.trim().length === 0 ||
      typeof mimeType !== 'string' ||
      mimeType.trim().length === 0
    ) {
      res.status(400).json({ error: 'Audio data and mimeType are required' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
      res.status(503).json({
        error: 'Speech transcription service unavailable without GEMINI_API_KEY',
      });
      return;
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const promptText =
        language === 'en'
          ? 'Transcribe the spoken audio accurately word for word in the exact language spoken (English, Egyptian Arabic, or Modern Standard Arabic, including agricultural or technical terms like GeoAgri, NDVI, NDWI, EC, pH). Output ONLY the clean transcribed text with proper punctuation and no commentary.'
          : 'فرّغ الكلام المنطوق في هذا المقطع الصوتي بدقة تامة كلمة بكلمة كما قيل بالضبط (سواء باللهجة المصرية أو العربية الفصحى أو الإنجليزية، بما في ذلك المصطلحات الزراعية والتقنية مثل GeoAgri وNDVI وEC وpH). أعد النص المُفرّغ فقط بدون أي مقدمات أو شروحات أو تخمين كلمات غير منطوقة.';

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType.split(';')[0] || 'audio/webm',
                data: audioBase64,
              },
            },
            { text: promptText },
          ],
        },
      });

      res.json({
        transcript: (response.text || '').trim(),
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Transcription failed',
      });
    }
  });

  const GEOAGRI_FUNCTION_DECLARATIONS: FunctionDeclaration[] = [
    {
      name: 'create_farm_zone',
      description:
        'Create and activate a new agricultural study zone/farm on the map using an Egyptian/MENA region name or explicit lat/lng coordinates, plus optional feddan area, crop, soil texture, EC salinity, pH, irrigation system, and custom farm name.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          locationOrRegion: {
            type: Type.STRING,
            description:
              'Egyptian governorate or agricultural region name in Arabic or English, e.g. كفر الشيخ, أسيوط, المنيا, سيناء, الفيوم, الدقهلية, توشكى, النوبارية, Luxor, Qena.',
          },
          latitude: { type: Type.NUMBER, description: 'Optional latitude (e.g. 27.1783).' },
          longitude: { type: Type.NUMBER, description: 'Optional longitude (e.g. 31.1859).' },
          areaFeddans: { type: Type.NUMBER, description: 'Farm size in Feddans (default 50).' },
          nameAr: { type: Type.STRING, description: 'Arabic display name for the farm zone.' },
          nameEn: { type: Type.STRING, description: 'English display name for the farm zone.' },
          cropId: {
            type: Type.STRING,
            description:
              'Crop ID (wheat, maize, sorghum, fava_bean, sugar_beet, potato, tomato, cotton, clover, olive, rice, quinoa) or crop name in Arabic/English.',
          },
          customCropLabel: {
            type: Type.STRING,
            description: 'Custom crop label if not in standard list (e.g. مانجو, فراولة, موالح, نخيل).',
          },
          soilTexture: {
            type: Type.STRING,
            description: 'Soil texture: clay, sandy, loamy, or calcareous.',
          },
          salinityEC: { type: Type.NUMBER, description: 'Soil salinity EC in dS/m.' },
          ph: { type: Type.NUMBER, description: 'Soil pH (4.0 to 10.5).' },
          irrigation: {
            type: Type.STRING,
            description: 'Irrigation system: drip, pivot, sprinkler, flood, or rainfed.',
          },
        },
      },
    },
    {
      name: 'delete_farm_zone',
      description:
        'Delete a specific saved study zone/farm by name, ID, position (first/last/active), OR delete ALL saved zones when requested.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          target: {
            type: Type.STRING,
            description: 'One of: active, first, last, by_name, all.',
          },
          zoneId: { type: Type.STRING, description: 'Exact ID from siteInventory.zones if known.' },
          zoneNameQuery: {
            type: Type.STRING,
            description: 'Partial or full name of the farm/zone to delete.',
          },
          index: {
            type: Type.NUMBER,
            description: '1-based index of the zone to delete (e.g. 1 for first, 2 for second).',
          },
          clearAll: {
            type: Type.BOOLEAN,
            description: 'Set true to delete all saved study zones.',
          },
        },
      },
    },
    {
      name: 'rename_farm_zone',
      description: 'Rename an existing study zone/farm (active zone by default or specified by name/ID).',
      parameters: {
        type: Type.OBJECT,
        properties: {
          zoneId: { type: Type.STRING },
          zoneNameQuery: { type: Type.STRING },
          newNameAr: { type: Type.STRING, description: 'New Arabic name for the farm zone.' },
          newNameEn: { type: Type.STRING, description: 'New English name for the farm zone.' },
          newCategoryAr: { type: Type.STRING, description: 'Optional category label in Arabic.' },
        },
        required: ['newNameAr'],
      },
    },
    {
      name: 'switch_active_farm_zone',
      description: 'Switch the currently active study zone/farm to another saved zone by ID, name, or index.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          zoneId: { type: Type.STRING },
          zoneNameQuery: { type: Type.STRING },
          target: { type: Type.STRING, description: 'first or last' },
          index: { type: Type.NUMBER, description: '1-based index' },
        },
      },
    },
    {
      name: 'compare_farm_zone',
      description: 'Add, remove, toggle, or clear zones in the multi-zone comparison panel.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          mode: {
            type: Type.STRING,
            description: 'One of: add, remove, toggle, clear_all.',
          },
          zoneId: { type: Type.STRING },
          zoneNameQuery: { type: Type.STRING },
        },
        required: ['mode'],
      },
    },
    {
      name: 'update_farm_settings',
      description:
        'Update active farm agronomic settings: crop, custom crop label, soil texture, salinity EC, pH, organic matter %, or irrigation system.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          zoneId: { type: Type.STRING },
          zoneNameQuery: { type: Type.STRING },
          cropId: { type: Type.STRING },
          customCropLabel: { type: Type.STRING },
          soilTexture: {
            type: Type.STRING,
            description: 'clay, sandy, loamy, or calcareous',
          },
          salinityEC: { type: Type.NUMBER, description: 'Soil EC in dS/m' },
          ph: { type: Type.NUMBER, description: 'Soil pH' },
          organicMatterPct: { type: Type.NUMBER, description: 'Organic matter %' },
          irrigation: {
            type: Type.STRING,
            description: 'drip, pivot, sprinkler, flood, or rainfed',
          },
        },
      },
    },
    {
      name: 'clear_drawn_polygon',
      description:
        'Clear/delete temporary unsaved drawn polygon vertices on the map without deleting saved zones.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          confirm: { type: Type.BOOLEAN },
        },
      },
    },
    {
      name: 'switch_map_layer',
      description:
        'Switch the active spectral index layer (NDVI, NDWI, SAVI, NDMI, EVI, LST, SM_0_7, SM_7_28, SOIL_EC, SOIL_PH) or thematic map layer (natural, vegetation, soil_moisture, temperature, rainfall, wind, dem_drainage).',
      parameters: {
        type: Type.OBJECT,
        properties: {
          spectralLayer: { type: Type.STRING },
          thematicLayer: { type: Type.STRING },
          navigateToAtlas: { type: Type.BOOLEAN },
        },
      },
    },
    {
      name: 'navigate_app_tab',
      description:
        'Navigate the application to a specific main section/tab: atlas (map), indices (spectral analysis), weather (rain & climate), crops (recommendations & rotation), or advisor (GeoAgri ai).',
      parameters: {
        type: Type.OBJECT,
        properties: {
          tabId: {
            type: Type.STRING,
            description: 'One of: atlas, indices, weather, crops, advisor.',
          },
        },
        required: ['tabId'],
      },
    },
    {
      name: 'manage_weekly_task',
      description:
        'Add, complete/uncomplete/toggle, delete a specific task, or clear all tasks in the Weekly Field Action Checklist.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          operation: {
            type: Type.STRING,
            description: 'One of: add, complete, uncomplete, toggle, delete, clear_all.',
          },
          taskId: { type: Type.STRING },
          title: { type: Type.STRING, description: 'Task title (for add or delete match).' },
          matchText: { type: Type.STRING, description: 'Substring to match task for delete/toggle.' },
          detail: { type: Type.STRING, description: 'Detailed agronomic instruction for the task.' },
          category: {
            type: Type.STRING,
            description: 'One of: irrigation, fertilization, scouting, soil.',
          },
          priority: {
            type: Type.STRING,
            description: 'One of: high, medium, normal.',
          },
          dayLabel: { type: Type.STRING, description: 'Scheduled day/timing label.' },
          markAll: { type: Type.BOOLEAN },
          clearAll: { type: Type.BOOLEAN },
        },
        required: ['operation'],
      },
    },
    {
      name: 'manage_pest_incident',
      description:
        'Pin/log a new pest/disease incident hotspot on a sub-zone, mark an incident as treated/active, delete an incident, or clear all logged pest incidents.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          operation: {
            type: Type.STRING,
            description: 'One of: log, mark_treated, mark_active, mark_all_treated, delete, clear_all.',
          },
          incidentId: { type: Type.STRING },
          pestId: {
            type: Type.STRING,
            description:
              'yellow_rust, fall_armyworm, late_blight, aphids_virus, root_knot_nematode, tuta_whitefly, or Arabic/English pest name.',
          },
          subZoneId: { type: Type.STRING, description: 'A, B, or C' },
          severity: { type: Type.STRING, description: 'low, moderate, high, or critical' },
          notes: { type: Type.STRING },
          clearAll: { type: Type.BOOLEAN },
        },
        required: ['operation'],
      },
    },
    {
      name: 'manage_crop_rotation',
      description:
        'Update a seasonal crop rotation slot (past2, past1, current, next1, next2) in Sub-Zone A, B, or C, or run automatic scientific rotation optimization.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          operation: { type: Type.STRING, description: 'set_slot or optimize' },
          subZoneId: { type: Type.STRING, description: 'A, B, C, or ALL' },
          slotId: {
            type: Type.STRING,
            description: 'past2, past1, current, next1, or next2',
          },
          cropId: { type: Type.STRING },
        },
        required: ['operation'],
      },
    },
    {
      name: 'control_app_preferences',
      description:
        'Control global app state & utilities: toggle/set dark mode, change language (ar/en), toggle weather push notifications, dismiss weather alerts, refresh live weather telemetry, export PDF field report, clear chat history, close expanded chat, or display an inline widget.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          darkMode: { type: Type.BOOLEAN },
          toggleDarkMode: { type: Type.BOOLEAN },
          language: { type: Type.STRING, description: 'ar or en' },
          pushNotificationsEnabled: { type: Type.BOOLEAN },
          dismissWeatherAlerts: { type: Type.BOOLEAN },
          refreshWeather: { type: Type.BOOLEAN },
          exportPdfReport: { type: Type.BOOLEAN },
          clearChat: { type: Type.BOOLEAN },
          closeFullscreenChat: { type: Type.BOOLEAN },
          showInlineWidget: {
            type: Type.STRING,
            description:
              'pest_radar, weekly_checklist, spectral_subzones, irrigation_npk, crop_mcda, or zone_action_card',
          },
        },
      },
    },
  ];

  let primaryCooldownUntil = 0;

  app.post('/api/advisor', async (req, res) => {
    const {
      prompt,
      attachment,
      farmContext,
      siteInventory,
      language,
      conversationHistory,
    } = req.body || {};

    const hasValidAttachment =
      attachment &&
      typeof attachment.base64Data === 'string' &&
      attachment.base64Data.length > 0 &&
      typeof attachment.mimeType === 'string' &&
      attachment.mimeType.length > 0;

    const effectivePrompt =
      typeof prompt === 'string' && prompt.trim().length > 0
        ? prompt.trim()
        : language === 'en'
        ? 'Analyze the attached agricultural image/video in detail, diagnose crop health, soil condition, or any pests/diseases, and provide a concise written executive summary with numbers and direct actionable recommendations.'
        : 'حلل الصورة أو الفيديو المرفق بدقة (صحة المحصول والأوراق، حالة التربة أو الري، أو أي آفات وأمراض ظاهرة) وقدم ملخصاً تنفيذياً مكتوباً وسريعاً بالأرقام والتوصية المباشرة.';

    if (!effectivePrompt && !hasValidAttachment) {
      res.status(400).json({ error: 'Prompt or media attachment is required' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
      res.status(200).json({
        mode: 'local_scientific_engine',
        text: null,
      });
      return;
    }

    const normalizedInventory: AdvisorSiteInventory =
      siteInventory && typeof siteInventory === 'object'
        ? {
            language: siteInventory.language === 'en' ? 'en' : 'ar',
            darkMode: Boolean(siteInventory.darkMode),
            activeTab: siteInventory.activeTab || 'atlas',
            activeLayer: siteInventory.activeLayer || 'NDVI',
            activeThematicMap: siteInventory.activeThematicMap || 'natural',
            activeZoneId: siteInventory.activeZoneId || null,
            activeCropId: siteInventory.activeCropId || 'wheat',
            activeCentroid: siteInventory.activeCentroid || { lat: 30.8481, lng: 30.9401 },
            drawnVerticesCount: Number(siteInventory.drawnVerticesCount || 0),
            hasActiveZones: Boolean(siteInventory.hasActiveZones),
            pushNotificationsEnabled: Boolean(siteInventory.pushNotificationsEnabled),
            comparedZoneIds: Array.isArray(siteInventory.comparedZoneIds)
              ? siteInventory.comparedZoneIds
              : [],
            zones: Array.isArray(siteInventory.zones) ? siteInventory.zones : [],
            checklist: Array.isArray(siteInventory.checklist) ? siteInventory.checklist : [],
            incidents: Array.isArray(siteInventory.incidents) ? siteInventory.incidents : [],
          }
        : {
            language: language === 'en' ? 'en' : 'ar',
            darkMode: false,
            activeTab: 'atlas',
            activeLayer: 'NDVI',
            activeThematicMap: 'natural',
            activeZoneId: null,
            activeCropId: 'wheat',
            activeCentroid: { lat: 30.8481, lng: 30.9401 },
            drawnVerticesCount: 0,
            hasActiveZones: farmContext?.hasActiveZones !== false,
            pushNotificationsEnabled: false,
            comparedZoneIds: [],
            zones: [],
            checklist: [],
            incidents: [],
          };

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const hasActiveZones = farmContext?.hasActiveZones !== false;
      const mediaNote = hasValidAttachment
        ? language === 'en'
          ? `\nIMPORTANT: The user attached a ${attachment.mediaType || 'media'} file (${attachment.fileName || attachment.mimeType}). Inspect it carefully for leaf chlorosis/necrosis, pest/disease symptoms, soil moisture/salinity crusting, or irrigation issues, and integrate your visual findings clearly into your written reply.`
          : `\nمهم جداً: أرفق المستخدم ملف ${attachment.mediaType === 'video' ? 'فيديو' : 'صورة'} (${attachment.fileName || attachment.mimeType}). افحص المرفق بدقة لتشخيص حالة النبات أو الأوراق أو الآفات أو التربة والري، واكتب التشخيص البصري الدقيق والتوصية العملية.`
        : '';

      const historyText =
        Array.isArray(conversationHistory) && conversationHistory.length > 0
          ? `\nRecent Conversation History:\n${conversationHistory
              .slice(-8)
              .map((m: { sender?: string; text?: string }) => `${m.sender}: ${m.text}`)
              .join('\n')}`
          : '';

      const coreBehaviorRulesEn = `CRITICAL FULL-CONTROL & REASONING RULES:
1. You have FULL programmatic control of the GeoAgri Pro application via your declared function tools. Whenever the user asks you to execute a command, add/create anything (farm zone, weekly task, pest incident), update/rename/optimize/toggle anything (settings, theme, language, rotation, notifications), switch layers/tabs/zones, export PDF, clear chat, or delete/remove/clear anything (zone, drawn polygon, task, pest incident, all items), YOU MUST INVOKE the appropriate function tool(s) immediately!
2. NEVER pretend you performed an action in text without actually calling the function tool. You can call multiple tools in one turn for compound requests.
3. Keep greetings, mic checks ("can you hear me"), and general chat direct and natural WITHOUT calling tools or dumping unrelated irrigation/NDVI stats.
4. For agricultural/geospatial questions, provide expert written advice citing relevant telemetry numbers. Reply strictly in written text chat.`;

      const coreBehaviorRulesAr = `قواعد الذكاء والتحكم الكامل في التطبيق (إلزامية):
1. لديك تحكم كامل وشامل في كل وظائف تطبيق GeoAgri Pro عبر أدوات الدوال (Function Calling). كلما طلب منك المستخدم تنفيذ أي أمر، أو إضافة شيء (مزرعة/زونة جديدة، مهمة أسبوعية، بؤرة آفة)، أو تعديل/تسمية/تحسين/تبديل أي شيء (محصول، تربة، ملوحة، ري، دورة زراعية، وضع ليلي، لغة الموقع، إشعارات، طبقة خريطة، تبويب)، أو مسح/حذف أي شيء (مزرعة بالاسم أو الترتيب أو الكل، حدود مرسومة، مهمة أو كل المهام، بؤرة أو كل البؤر، مسح الشات) — **يجب عليك استدعاء الأداة/الأدوات المناسبة فوراً**.
2. يُمنع منعاً باتاً الادعاء في الرد النصي أنك نفذت أمراً دون استدعاء أداته الفعلية! يمكنك استدعاء أكثر من أداة في نفس الرد إذا طلب المستخدم عدة أوامر معاً.
3. إذا كان المستخدم يرحب بك أو يختبر الميكروفون (مثل "سامعني كويس") أو يتحدث حديثاً عاماً، أجب بذكاء ولباقة في صلب كلامه بدون استدعاء أدوات وبدون إقحام أرقام عشوائية.
4. التزم بالردود الكتابية الذكية والمباشرة فقط (بدون الإشارة لأي صوت منطوق).`;

      const inventorySummary = `Live Application Inventory (for IDs/names when reading, updating, or deleting items):
${JSON.stringify(normalizedInventory, null, 2)}`;

      const systemInstruction = !hasActiveZones
        ? language === 'en'
          ? `You are "GeoAgri ai", the intelligent controller & precision agronomy advisor on GeoAgri Pro.
${coreBehaviorRulesEn}
${inventorySummary}
Context: The user currently has no active study zone drawn on the map.${mediaNote}${historyText}`
          : `أنت "GeoAgri ai"، المتحكم الذكي الشامل والمستشار الزراعي الفضائي على منصة GeoAgri Pro.
${coreBehaviorRulesAr}
${inventorySummary}
السياق الحالي: لا توجد زونة نشطة مرسومة حالياً على الخريطة.${mediaNote}${historyText}`
        : language === 'en'
        ? `You are "GeoAgri ai", the intelligent controller & precision agronomy advisor on GeoAgri Pro.
${coreBehaviorRulesEn}
${inventorySummary}
Live Telemetry for Active Farm:
${JSON.stringify(farmContext, null, 2)}${mediaNote}${historyText}`
        : `أنت "GeoAgri ai"، المتحكم الذكي الشامل والمستشار الزراعي الفضائي على منصة GeoAgri Pro.
${coreBehaviorRulesAr}
${inventorySummary}
البيانات الحية للمزرعة النشطة:
${JSON.stringify(farmContext, null, 2)}${mediaNote}${historyText}`;

      const userParts = hasValidAttachment
        ? [
            {
              inlineData: {
                mimeType: attachment.mimeType,
                data: attachment.base64Data,
              },
            },
            { text: effectivePrompt },
          ]
        : [{ text: effectivePrompt }];

      const withTimeout = async <T>(promise: Promise<T>, ms: number): Promise<T> => {
        let timer: ReturnType<typeof setTimeout> | undefined;
        try {
          return await Promise.race([
            promise,
            new Promise<never>((_, reject) => {
              timer = setTimeout(() => reject(new Error(`Gemini timeout after ${ms}ms`)), ms);
            }),
          ]);
        } finally {
          if (timer) clearTimeout(timer);
        }
      };

      const callModelWithQuotaFallback = async (
        contentsPayload: Parameters<typeof ai.models.generateContent>[0]['contents'],
        thinking: ThinkingLevel
      ) => {
        const modelsToTry =
          Date.now() < primaryCooldownUntil
            ? (['gemini-1.5-flash'] as const)
            : (['gemini-2.5-flash', 'gemini-1.5-flash'] as const);
        let lastErr: unknown;
        for (const modelName of modelsToTry) {
          try {
            return await withTimeout(
              ai.models.generateContent({
                model: modelName,
                contents: contentsPayload,
                config: {
                  systemInstruction,
                  tools: [{ functionDeclarations: GEOAGRI_FUNCTION_DECLARATIONS }],
                  ...(modelName.includes('2.5')
                    ? {
                        thinkingConfig: {
                          thinkingLevel: thinking,
                        },
                      }
                    : {}),
                },
              }),
              15000
            );
          } catch (err) {
            lastErr = err;
            const msg = err instanceof Error ? err.message : String(err);
            const isQuotaOrRateLimit =
              msg.includes('429') ||
              msg.includes('RESOURCE_EXHAUSTED') ||
              msg.toLowerCase().includes('quota') ||
              msg.includes('timeout');
            if (modelName === 'gemini-2.5-flash' && (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED'))) {
              primaryCooldownUntil = Date.now() + 10 * 60 * 1000;
            }
            if (!isQuotaOrRateLimit || modelName === modelsToTry[modelsToTry.length - 1]) {
              throw err;
            }
            console.warn(
              `Primary model ${modelName} hit quota/rate-limit, switching to gemini-1.5-flash.`
            );
          }
        }
        throw lastErr;
      };

      const response1 = await callModelWithQuotaFallback(
        [{ role: 'user', parts: userParts }],
        hasValidAttachment ? ThinkingLevel.MEDIUM : ThinkingLevel.LOW
      );

      const functionCalls = response1.functionCalls;
      if (Array.isArray(functionCalls) && functionCalls.length > 0) {
        const mapped = mapGeminiToolCallsToSiteActions(
          functionCalls.map((fc) => ({
            id: fc.id,
            name: fc.name,
            args: (fc.args || {}) as Record<string, unknown>,
          })),
          normalizedInventory
        );

        let finalText = '';
        const previousContent = response1.candidates?.[0]?.content;
        if (previousContent) {
          try {
            const response2 = await callModelWithQuotaFallback(
              [
                { role: 'user', parts: userParts },
                previousContent,
                {
                  role: 'user',
                  parts: mapped.functionResponses.map((fr) => ({
                    functionResponse: {
                      ...(fr.id ? { id: fr.id } : {}),
                      name: fr.name,
                      response: fr.response,
                    },
                  })),
                },
              ],
              ThinkingLevel.LOW
            );
            finalText = (response2.text || '').trim();
          } catch (turn2Err) {
            console.warn(
              'Gemini Turn 2 synthesis fallback:',
              turn2Err instanceof Error ? turn2Err.message : turn2Err
            );
          }
        }

        if (!finalText) {
          const isEn = language === 'en';
          finalText = mapped.toolActions
            .map((a) => `✅ ${isEn ? a.summaryEn : a.summaryAr}`)
            .join('\n');
        }

        res.json({
          mode: 'gemini_live',
          text: finalText || null,
          toolActions: mapped.toolActions,
          inlineWidgets: mapped.inlineWidgets,
        });
        return;
      }

      res.json({
        mode: 'gemini_live',
        text: response1.text || null,
        toolActions: [],
        inlineWidgets: [],
      });
    } catch (error) {
      console.error('Gemini advisor error:', error instanceof Error ? error.message : error);
      // Fall back gracefully to the deterministic client/agro-scientific engine on API key or quota issues
      res.status(200).json({
        mode: 'local_scientific_engine',
        text: null,
        warning: error instanceof Error ? error.message : 'Fallback activated',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const cesiumStaticPath = path.join(__dirname, 'node_modules', 'cesium', 'Build', 'Cesium');
    app.use('/cesiumStatic', express.static(cesiumStaticPath));
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GeoAgri Pro server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
