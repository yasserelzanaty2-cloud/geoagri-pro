/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AdvisorInlineWidgetType,
  AdvisorSiteAction,
  Language,
} from '../types/agro';
import {
  AdvisorSiteInventory,
  GeminiFunctionCallInput,
  mapGeminiToolCallsToSiteActions,
} from '../utils/advisorToolMapper';

const STORAGE_KEY = 'geoagri_gemini_api_key';

export function getStoredGeminiApiKey(): string {
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && stored.trim().length > 10) {
        return stored.trim();
      }
    }
  } catch {
    // ignore
  }
  // Fall back to Vite environment variable if injected
  const viteEnvKey = (import.meta as unknown as { env?: { VITE_GEMINI_API_KEY?: string } })
    ?.env?.VITE_GEMINI_API_KEY;
  if (typeof viteEnvKey === 'string' && viteEnvKey.trim().length > 10) {
    return viteEnvKey.trim();
  }
  return '';
}

export function setStoredGeminiApiKey(apiKey: string): void {
  try {
    if (typeof window !== 'undefined') {
      const clean = apiKey.trim();
      if (clean) {
        localStorage.setItem(STORAGE_KEY, clean);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  } catch {
    // ignore
  }
}

export function hasGeminiApiKey(): boolean {
  return getStoredGeminiApiKey().length > 0;
}

export interface GeminiAdvisorRequest {
  prompt: string;
  language: Language;
  siteInventory: AdvisorSiteInventory;
  farmContext: Record<string, unknown>;
  conversationHistory?: Array<{ sender: string; text: string }>;
  attachment?: {
    mediaType?: string;
    mimeType: string;
    base64Data: string;
    fileName?: string;
  };
}

export interface GeminiAdvisorResult {
  mode: 'gemini_live';
  text: string;
  toolActions: AdvisorSiteAction[];
  inlineWidgets: AdvisorInlineWidgetType[];
  modelUsed: string;
}

// 13 Function Declarations for GeoAgri Pro Full-Control
const GEMINI_FUNCTION_DECLARATIONS = [
  {
    name: 'create_farm_zone',
    description:
      'Creates and delineates a new agricultural study zone/farm parcel on the map with name, area in feddans, crop, soil, and optional coordinates or known Egyptian agricultural region.',
    parameters: {
      type: 'OBJECT',
      properties: {
        name: { type: 'STRING', description: 'Name of the farm zone (e.g. مزرعة شرق الدلتا)' },
        areaFeddans: { type: 'NUMBER', description: 'Area size in Egyptian Feddans' },
        cropId: { type: 'STRING', description: 'Crop identifier: wheat, fava_bean, clover, sugar_beet, potato, quinoa, olive, tomato, maize, sorghum, cotton, rice' },
        customCropLabel: { type: 'STRING', description: 'Custom crop name if not in standard list' },
        soilTexture: { type: 'STRING', description: 'clay, loamy, sandy, or calcareous' },
        salinityEC: { type: 'NUMBER', description: 'Soil electrical conductivity in dS/m' },
        soilPh: { type: 'NUMBER', description: 'Soil pH value (default 7.5)' },
        irrigation: { type: 'STRING', description: 'drip, pivot, sprinkler, or flood' },
        locationOrRegion: { type: 'STRING', description: 'Region name: delta, minya, fayoum, sinai, toshka, new_valley, asyut, suez, etc.' },
        latitude: { type: 'NUMBER', description: 'Latitude coordinate' },
        longitude: { type: 'NUMBER', description: 'Longitude coordinate' },
      },
    },
  },
  {
    name: 'update_zone_config',
    description: 'Updates active farm parameters: active crop, soil texture, salinity EC, soil pH, irrigation system, or custom crop label.',
    parameters: {
      type: 'OBJECT',
      properties: {
        cropId: { type: 'STRING', description: 'Crop id' },
        customCropLabel: { type: 'STRING', description: 'Custom crop display name' },
        soilTexture: { type: 'STRING', description: 'clay, loamy, sandy, or calcareous' },
        salinityEC: { type: 'NUMBER', description: 'Salinity EC in dS/m' },
        soilPh: { type: 'NUMBER', description: 'Soil pH' },
        irrigation: { type: 'STRING', description: 'drip, pivot, sprinkler, flood' },
      },
    },
  },
  {
    name: 'switch_map_layer',
    description: 'Switches the displayed spectral or thematic map layer on the satellite atlas.',
    parameters: {
      type: 'OBJECT',
      properties: {
        spectralLayer: { type: 'STRING', description: 'NDVI, NDWI, SAVI, EVI, NDMI, LST, SM_0_7, SM_7_28, SOIL_EC, SOIL_PH' },
        thematicLayer: { type: 'STRING', description: 'natural, vegetation, moisture, thermal, dem_drainage, rainfall, wind, soil_moisture' },
        navigateToAtlas: { type: 'BOOLEAN', description: 'Whether to open Full-Screen Atlas tab' },
      },
    },
  },
  {
    name: 'navigate_app_tab',
    description: 'Navigates to a specific main application section/tab: atlas (map), indices (spectral analysis), weather (rain & climate), crops (recommendations & rotation), or advisor (GeoAgri ai).',
    parameters: {
      type: 'OBJECT',
      properties: {
        tabId: { type: 'STRING', description: 'atlas, indices, weather, crops, or advisor' },
      },
      required: ['tabId'],
    },
  },
  {
    name: 'manage_weekly_task',
    description: 'Add, complete, delete, or clear weekly field checklist tasks.',
    parameters: {
      type: 'OBJECT',
      properties: {
        action: { type: 'STRING', description: 'add, complete, delete, or clear_all' },
        title: { type: 'STRING', description: 'Task title' },
        category: { type: 'STRING', description: 'irrigation, fertilization, pest_control, soil_prep, harvest' },
        priority: { type: 'STRING', description: 'high, medium, low' },
        day: { type: 'STRING', description: 'Assigned day name' },
      },
      required: ['action'],
    },
  },
  {
    name: 'manage_pest_incident',
    description: 'Pin a new pest incident or disease hotspot, mark as treated, or clear pest pins.',
    parameters: {
      type: 'OBJECT',
      properties: {
        action: { type: 'STRING', description: 'pin, treat, delete, or clear_all' },
        pestId: { type: 'STRING', description: 'yellow_rust, fall_armyworm, late_blight, aphids_virus, root_knot_nematode, tuta_whitefly' },
        subZoneId: { type: 'STRING', description: 'A, B, or C' },
        severity: { type: 'STRING', description: 'critical, high, medium, low' },
        notes: { type: 'STRING', description: 'Field scouting notes' },
      },
      required: ['action'],
    },
  },
  {
    name: 'set_app_theme',
    description: 'Switches application theme to dark mode or light mode.',
    parameters: {
      type: 'OBJECT',
      properties: {
        darkMode: { type: 'BOOLEAN', description: 'true for Dark Mode, false for Light Mode' },
      },
      required: ['darkMode'],
    },
  },
  {
    name: 'set_app_language',
    description: 'Switches application interface language to Arabic (ar) or English (en).',
    parameters: {
      type: 'OBJECT',
      properties: {
        language: { type: 'STRING', description: 'ar or en' },
      },
      required: ['language'],
    },
  },
  {
    name: 'export_pdf_report',
    description: 'Generates and downloads the comprehensive agronomic PDF engineering report for the active farm.',
    parameters: { type: 'OBJECT', properties: {} },
  },
  {
    name: 'clear_chat_history',
    description: 'Wipes the current advisor chat history and starts a fresh conversation.',
    parameters: { type: 'OBJECT', properties: {} },
  },
  {
    name: 'refresh_satellite_weather',
    description: 'Refreshes live satellite weather, evapotranspiration, and NASA rainfall forecasts.',
    parameters: { type: 'OBJECT', properties: {} },
  },
  {
    name: 'delete_study_zone',
    description: 'Deletes a farm study zone by ID, order, name, or clears all zones.',
    parameters: {
      type: 'OBJECT',
      properties: {
        zoneId: { type: 'STRING', description: 'Target zone ID' },
        zoneName: { type: 'STRING', description: 'Zone name' },
        clearAll: { type: 'BOOLEAN', description: 'Whether to delete all zones' },
      },
    },
  },
  {
    name: 'switch_active_zone',
    description: 'Switches the currently active farm zone to another saved zone.',
    parameters: {
      type: 'OBJECT',
      properties: {
        zoneId: { type: 'STRING', description: 'Target zone ID' },
        zoneName: { type: 'STRING', description: 'Target zone name' },
      },
    },
  },
];

/**
 * Call Google Gemini API directly from client side
 * Uses official currently supported models: gemini-2.5-flash -> fallback: gemini-1.5-flash
 */
export async function callGeminiDirect(
  req: GeminiAdvisorRequest
): Promise<GeminiAdvisorResult | null> {
  const apiKey = getStoredGeminiApiKey();
  if (!apiKey) {
    return null;
  }

  const isAr = req.language === 'ar';
  const hasAttachment =
    req.attachment &&
    typeof req.attachment.base64Data === 'string' &&
    req.attachment.base64Data.length > 0;

  const systemPrompt = `You are "GeoAgri ai", the elite Precision Agriculture & GIS Advisor on GeoAgri Pro.
CRITICAL INSTRUCTIONS:
1. Always be SCIENTIFICALLY RIGOROUS, CONCISE, AND DIRECT. Do NOT output long generic boilerplate, disclaimers, or unrequested farm overviews.
2. If the user asks HOW TO GROW A CROP (e.g. "ازرع رز ازاي", "ازرع الفول ازاي", "طريقة زراعة القمح"), provide immediate, actionable, step-by-step planting instructions:
   - Optimal Planting Window (الموعد الدقيق)
   - Land & Soil Preparation (إعداد الأرض والحرث والتسوية)
   - Seed Rate & Cultivars (التقاوي والأصناف المعتمدة)
   - Irrigation & Water Needs (المقنن المائي ومواعيد الريات الحاكمة)
   - NPK & Weed/Pest Protection (جرعات التسميد وأهم الآفات وطرق وقايتها).
3. If the user asks "من أنت" / "انت مين" / "who are you", state clearly and concisely that you are GeoAgri ai, the precision agronomist & GIS controller, and briefly state how you help.
4. If the user asks about crop suitability or compares a crop (e.g. "طيب والرز"), evaluate that specific crop against the active farm data (soil texture, salinity EC, rainfall, water balance) with a clear recommendation.
5. If the user asks to execute an application command (add farm, delete, change crop, switch tab, toggle dark mode, add task, pin pest, export PDF), CALL THE CORRESPONDING FUNCTION TOOL IMMEDIATELY.
6. Reply in ${isAr ? 'clear, professional, natural Arabic (العربية)' : 'English'}.

Live Farm Context:
${JSON.stringify(req.farmContext, null, 2)}

Live Application Inventory:
${JSON.stringify(req.siteInventory, null, 2)}`;

  const userParts: Array<Record<string, unknown>> = [];
  if (hasAttachment && req.attachment) {
    userParts.push({
      inlineData: {
        mimeType: req.attachment.mimeType,
        data: req.attachment.base64Data,
      },
    });
  }
  userParts.push({ text: req.prompt });

  // History parts
  const contents: Array<{ role: string; parts: unknown[] }> = [];
  if (Array.isArray(req.conversationHistory) && req.conversationHistory.length > 0) {
    for (const h of req.conversationHistory.slice(-6)) {
      contents.push({
        role: h.sender === 'user' ? 'user' : 'model',
        parts: [{ text: h.text }],
      });
    }
  }
  contents.push({ role: 'user', parts: userParts });

  // Supported Google models in priority order
  const models = ['gemini-2.5-flash', 'gemini-1.5-flash'];

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const bodyPayload = {
        contents,
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        tools: [{ functionDeclarations: GEMINI_FUNCTION_DECLARATIONS }],
        generationConfig: {
          temperature: 0.35,
          maxOutputTokens: 1200,
        },
      };

      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
        signal: AbortSignal.timeout(hasAttachment ? 35000 : 25000),
      });

      if (!resp.ok) {
        console.warn(`Gemini direct call to ${model} returned HTTP ${resp.status}`);
        continue;
      }

      const data = await resp.json();
      const candidate = data.candidates?.[0];
      const parts = candidate?.content?.parts || [];

      // Extract function calls if any
      const functionCalls: GeminiFunctionCallInput[] = [];
      let textOutput = '';

      for (const p of parts) {
        if (p.functionCall) {
          functionCalls.push({
            name: p.functionCall.name,
            args: p.functionCall.args,
          });
        }
        if (p.text) {
          textOutput += p.text;
        }
      }

      let toolActions: AdvisorSiteAction[] = [];
      let inlineWidgets: AdvisorInlineWidgetType[] = [];

      if (functionCalls.length > 0) {
        const mapping = mapGeminiToolCallsToSiteActions(functionCalls, req.siteInventory);
        toolActions = mapping.toolActions;
        inlineWidgets = mapping.inlineWidgets;

        // If no text was output alongside function calls, provide concise confirmation
        if (!textOutput.trim() && toolActions.length > 0) {
          textOutput = toolActions
            .map((a) => `✅ ${isAr ? a.summaryAr : a.summaryEn}`)
            .join('\n');
        }
      }

      if (textOutput.trim() || toolActions.length > 0) {
        return {
          mode: 'gemini_live',
          text: textOutput.trim(),
          toolActions,
          inlineWidgets,
          modelUsed: model,
        };
      }
    } catch (err) {
      console.warn(`Error calling Gemini model ${model} directly:`, err);
    }
  }

  return null;
}

/**
 * Direct Gemini audio transcription using gemini-2.5-flash
 */
export async function transcribeAudioDirect(
  base64Audio: string,
  mimeType: string,
  language: 'ar' | 'en'
): Promise<string | null> {
  const apiKey = getStoredGeminiApiKey();
  if (!apiKey || !base64Audio) return null;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: mimeType || 'audio/webm',
                  data: base64Audio,
                },
              },
              {
                text:
                  language === 'ar'
                    ? 'قم بنسخ وتسجيل هذا التسجيل الصوتي بدقة إلى نص عربي واضح. اكتب النص المنطوق فقط بدون أي مقدمات أو تعليقات.'
                    : 'Transcribe this audio recording accurately into text. Output only the verbatim spoken transcript without greetings or commentary.',
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 300,
        },
      }),
      signal: AbortSignal.timeout(20000),
    });

    if (!resp.ok) return null;
    const data = await resp.json();
    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text;
    return typeof text === 'string' ? text.trim() : null;
  } catch (err) {
    console.warn('Direct transcription error:', err);
    return null;
  }
}

