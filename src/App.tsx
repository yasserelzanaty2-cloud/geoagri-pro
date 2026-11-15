/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  FileDown,
  Globe,
  Layers,
  LogIn,
  LogOut,
  MapPin,
  Menu,
  Moon,
  PlusCircle,
  Sprout,
  Sun,
  X,
} from 'lucide-react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  AdvisorSiteAction,
  CustomRotationEvaluation,
  DailyWeatherPoint,
  Language,
  LatLon,
  MainTabId,
  PresetFarmZone,
  RotationSeasonSlot,
  SoilProfile,
  SpatialGridCell,
  SpectralIndexKey,
  ThematicMapLayerId,
  UserStudyZone,
  WeeklyChecklistTask,
  ZoneCustomRotationPlan,
} from './types/agro';
import {
  CROP_DATABASE,
  OpenMeteoZonePushAlert,
  PRESET_FARM_ZONES,
  buildDefaultCustomRotationPlans,
  buildFallback14DayForecast,
  buildRotationStrategies,
  buildWeeklyFarmChecklist,
  calculateGeodesicArea,
  calculateGrowthStageAndGDD,
  evaluateCustomRotationPlan,
  evaluateOpenMeteoZonePushAlerts,
  fetchLiveOpenMeteoForecast,
  fetchNasaPowerClimatology,
  generateSeasonal6MonthForecast,
  generateSmartWeatherAlerts,
  generateSpectralTimeSeries,
  generateSubZonesAndGrid,
  getPolygonCentroid,
  optimizeZoneRotationPlan,
  scoreCropsForFarm,
} from './utils/agroEngine';
import {
  recomputeSubZonesAndAveragesFromCells,
  samplePolygonGridFromEsriTiles,
} from './utils/satellitePixelAnalyzer';
import { generateAndDownloadFarmPdfReport } from './utils/pdfReportGenerator';
import {
  auth,
  getGoogleAuthRedirectResult,
  signInWithGoogleSmart,
  signOutUser,
} from './firebase';
import {
  clearAllUserZonesFromFirestore,
  deleteUserZoneFromFirestore,
  saveUserZoneToFirestore,
  subscribeToUserZones,
  syncActiveZoneSelection,
  upsertUserProfile,
} from './services/firebaseZonesService';
import {
  PersistedFarmState,
  loadPersistedFarmState,
  mergeStudyZonesAdditively,
  resolvePreferredActiveZone,
  savePersistedFarmState,
} from './services/localZonesStorage';
import {
  BrowserPushPermissionState,
  dispatchBrowserPushNotification,
  getBrowserNotificationPermission,
  isPushNotificationPreferenceEnabled,
  requestBrowserNotificationPermission,
  setPushNotificationPreferenceEnabled,
} from './services/weatherPushService';
import { FullScreenAtlasView } from './components/FullScreenAtlasView';
import { ZoneDraftConfirmPayload } from './components/MultiZoneManagerBar';
import { SpectralIndicesView } from './components/SpectralIndicesView';
import { WeatherForecastView } from './components/WeatherForecastView';
import { CropRecommenderView } from './components/CropRecommenderView';
import { AdvisorConsultantView } from './components/AdvisorConsultantView';
import { FloatingAdvisorChat } from './components/FloatingAdvisorChat';
import { useAdvisorChat } from './hooks/useAdvisorChat';

const DEFAULT_SOIL_PROFILE: SoilProfile = {
  texture: 'clay',
  irrigation: 'drip',
  salinityEC: 1.25,
  ph: 7.4,
  organicMatterPct: 2.3,
  groundwaterDepthM: 1.6,
};

export default function App() {
  const [initialPersistedState] = useState<PersistedFarmState>(() => loadPersistedFarmState());

  const [language, setLanguage] = useState<Language>(initialPersistedState.language || 'ar');
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<MainTabId>(initialPersistedState.activeTab || 'atlas');

  // Firebase Google Auth State (Official Google Accounts via Firebase Auth)
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(false);
  const [isDomainAuthModalOpen, setIsDomainAuthModalOpen] = useState<boolean>(false);
  const [domainModalHost, setDomainModalHost] = useState<string>('yasserelzanaty2-cloud.github.io');
  const [domainCopied, setDomainCopied] = useState<boolean>(false);

  // Multi-Zone State: Hydrated immediately from local persistence so page refresh never loses active farm
  const [zones, setZones] = useState<UserStudyZone[]>(initialPersistedState.zones);
  const [activeZoneId, setActiveZoneId] = useState<string | null>(
    initialPersistedState.activeZoneId
  );
  const [comparedZoneIds, setComparedZoneIds] = useState<string[]>([]);
  const deletedZoneIdsRef = useRef<Set<string>>(new Set(initialPersistedState.deletedZoneIds));
  const remotePreferredZoneIdRef = useRef<string | null>(null);
  const zonesRef = useRef<UserStudyZone[]>([]);
  const activeZoneIdRef = useRef<string | null>(null);
  zonesRef.current = zones;
  activeZoneIdRef.current = activeZoneId;

  // Quick-Save Drawn Boundary Modal State (available from Spectral Indices & Active Farm Bar)
  const [quickSaveModalOpen, setQuickSaveModalOpen] = useState<boolean>(false);
  const [quickSaveFarmName, setQuickSaveFarmName] = useState<string>('');

  // Active working polygon & soil state
  const [selectedPreset, setSelectedPreset] = useState<PresetFarmZone>(PRESET_FARM_ZONES[0]);
  const [vertices, setVertices] = useState<LatLon[]>(initialPersistedState.vertices);
  const [soil, setSoil] = useState<SoilProfile>(initialPersistedState.soil);
  const [currentCropId, setCurrentCropId] = useState<string>(initialPersistedState.currentCropId);
  const [customCropLabel, setCustomCropLabel] = useState<string | undefined>(
    initialPersistedState.customCropLabel
  );
  const [activeLayer, setActiveLayer] = useState<SpectralIndexKey>('NDVI');
  const [activeThematicMap, setActiveThematicMap] = useState<ThematicMapLayerId>('natural');
  const [selectedMoistureDayIdx, setSelectedMoistureDayIdx] = useState<number>(0);

  // Real Satellite Tile Pixel-Sampled Grid Cells
  const [sampledGridCells, setSampledGridCells] = useState<SpatialGridCell[] | null>(null);
  const [radiometricSource, setRadiometricSource] = useState<
    'satellite-tile-pixel-calibrated' | 'agro-coupled-model'
  >('agro-coupled-model');

  // Custom Crop Rotation Plans State (Zones A, B, C)
  const [customRotationPlans, setCustomRotationPlans] = useState<
    Record<'A' | 'B' | 'C', ZoneCustomRotationPlan>
  >(() => buildDefaultCustomRotationPlans('wheat'));

  // Status Banner (PDF export or Cloud Sync notifications) & Auth Popup Guidance
  const [pdfBannerMessage, setPdfBannerMessage] = useState<string | null>(null);
  const [authPopupAlert, setAuthPopupAlert] = useState<{
    messageAr: string;
    messageEn: string;
    showOpenTab: boolean;
  } | null>(null);
  const [pendingAdvisorPrompt, setPendingAdvisorPrompt] = useState<string | null>(null);
  const [isFloatingChatOpen, setIsFloatingChatOpen] = useState<boolean>(false);
  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false);
  const mobileMenuWrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [activeTab]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileNavOpen(false);
    };
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (
        mobileMenuWrapperRef.current &&
        !mobileMenuWrapperRef.current.contains(e.target as Node)
      ) {
        setMobileNavOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [mobileNavOpen]);

  // Live Weather & Climatology State
  const centroid = useMemo(() => getPolygonCentroid(vertices), [vertices]);
  const [forecast14, setForecast14] = useState<DailyWeatherPoint[]>(() =>
    buildFallback14DayForecast({ lat: 27.0, lng: 28.0 })
  );
  const [weatherSource, setWeatherSource] = useState<
    'open-meteo-live' | 'agro-simulation-fallback'
  >('agro-simulation-fallback');
  const [nasaSource, setNasaSource] = useState<
    'nasa-power-live' | 'nasa-power-calibrated-cache'
  >('nasa-power-calibrated-cache');
  const [nasaRainOverride, setNasaRainOverride] = useState<
    Record<number, { rainMm: number; tempC: number }> | undefined
  >(undefined);
  const [isRefreshingWeather, setIsRefreshingWeather] = useState<boolean>(false);
  const [isCalibratingPixels, setIsCalibratingPixels] = useState<boolean>(false);

  // Open-Meteo Simple Push Notification State (Active Study Zone)
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState<boolean>(() =>
    isPushNotificationPreferenceEnabled()
  );
  const [notificationPermission, setNotificationPermission] =
    useState<BrowserPushPermissionState>(() => getBrowserNotificationPermission());
  const [dismissedPushAlertIds, setDismissedPushAlertIds] = useState<string[]>([]);
  const sentBrowserPushTagsRef = useRef<Set<string>>(new Set());

  // Sync HTML dir and lang attributes
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  // Sync Dark Mode class on <html>
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Geodesic Area & Baseline Sub-Zone Spectral + Soil Moisture/Salinity/pH Calculations
  const area = useMemo(() => calculateGeodesicArea(vertices), [vertices]);

  const activeForecastMoisture = useMemo(() => {
    const dayPoint = forecast14[selectedMoistureDayIdx] || forecast14[0];
    return {
      sm0to7Pct: dayPoint?.soilMoisture0to7Pct ?? 28,
      sm7to28Pct: dayPoint?.soilMoisture7to28Pct ?? 33,
    };
  }, [forecast14, selectedMoistureDayIdx]);

  const baselineSpatial = useMemo(() => {
    if (vertices.length < 3) {
      return {
        subZones: [],
        gridCells: [],
        farmAverages: {
          NDVI: 0,
          NDWI: 0,
          SAVI: 0,
          NDMI: 0,
          EVI: 0,
          LST: 0,
          SM_0_7: 0,
          SM_7_28: 0,
          SOIL_EC: 0,
          SOIL_PH: 0,
        } as Record<SpectralIndexKey, number>,
      };
    }
    return generateSubZonesAndGrid(
      vertices,
      soil,
      selectedPreset.baseSpectralBands,
      activeForecastMoisture
    );
  }, [vertices, soil, selectedPreset.baseSpectralBands, activeForecastMoisture]);

  // Sample real Esri World Imagery satellite tile pixels (CORS-enabled) for 100% spatial accuracy
  useEffect(() => {
    if (vertices.length < 3 || baselineSpatial.gridCells.length === 0) {
      setSampledGridCells(null);
      return;
    }

    let cancelled = false;
    setIsCalibratingPixels(true);
    const baseTemp =
      forecast14[selectedMoistureDayIdx]?.tempMaxC ??
      selectedPreset.baseSpectralBands.lstCelsius;

    samplePolygonGridFromEsriTiles(
      baselineSpatial.gridCells,
      soil,
      baseTemp,
      activeForecastMoisture
    )
      .then((sampled) => {
        if (cancelled) return;
        if (sampled && sampled.length > 0) {
          setSampledGridCells(sampled);
          setRadiometricSource('satellite-tile-pixel-calibrated');
        } else {
          setSampledGridCells(null);
          setRadiometricSource('agro-coupled-model');
        }
      })
      .finally(() => {
        if (!cancelled) setIsCalibratingPixels(false);
      });

    return () => {
      cancelled = true;
    };
  }, [baselineSpatial.gridCells, soil, activeForecastMoisture, selectedMoistureDayIdx]);

  const { subZones, gridCells, farmAverages } = useMemo(() => {
    if (vertices.length < 3) {
      return baselineSpatial;
    }
    if (sampledGridCells && sampledGridCells.length === baselineSpatial.gridCells.length) {
      const recomputed = recomputeSubZonesAndAveragesFromCells(
        vertices,
        soil,
        sampledGridCells,
        baselineSpatial.subZones
      );
      return {
        subZones: recomputed.subZones,
        gridCells: sampledGridCells,
        farmAverages: recomputed.farmAverages,
      };
    }
    return baselineSpatial;
  }, [sampledGridCells, baselineSpatial, vertices, soil]);

  // Keep active zone synchronized inside local `zones` array whenever its calibrated data updates
  useEffect(() => {
    if (!activeZoneId || vertices.length < 3) return;
    setZones((prev) =>
      prev.map((z) =>
        z.id === activeZoneId
          ? {
              ...z,
              vertices,
              centroid,
              area,
              soil,
              currentCropId,
              customCropLabel,
              gridCells,
              subZones,
              farmAverages,
              forecast14,
              radiometricSource,
            }
          : z
      )
    );
  }, [
    activeZoneId,
    vertices,
    centroid,
    area,
    soil,
    currentCropId,
    customCropLabel,
    gridCells,
    subZones,
    farmAverages,
    forecast14,
    radiometricSource,
  ]);

  // Automatically persist active farm state locally across page refreshes
  useEffect(() => {
    savePersistedFarmState({
      zones,
      activeZoneId,
      vertices,
      soil,
      currentCropId,
      customCropLabel,
      activeTab,
      deletedZoneIds: Array.from(deletedZoneIdsRef.current),
      language,
    });
  }, [zones, activeZoneId, vertices, soil, currentCropId, customCropLabel, activeTab, language]);

  // Firebase Auth listener + Cloud Firestore / Cloud SQL real-time additive zone subscription
  useEffect(() => {
    // Purge any stale mock/dummy accounts previously cached in localStorage
    try {
      const saved = localStorage.getItem('geoagri_saved_user');
      if (saved && (saved.includes('user_') || saved.includes('geomatrix.org'))) {
        localStorage.removeItem('geoagri_saved_user');
      }
    } catch {
      // ignore
    }

    void getGoogleAuthRedirectResult();
    let unsubscribeZones: (() => void) | null = null;
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (unsubscribeZones) {
        unsubscribeZones();
        unsubscribeZones = null;
      }

      if (!user) return;

      try {
        const profileSync = await upsertUserProfile(user, {
          preferredLanguage: language,
          activeZoneId: activeZoneIdRef.current,
        });
        if (profileSync?.activeZoneId) {
          remotePreferredZoneIdRef.current = profileSync.activeZoneId;
        }

        // Push any local guest-drawn zones created before sign-in into user's Firestore collection
        const unsyncedGuestZones = zonesRef.current.filter(
          (z) => z.ownerUid !== user.uid && !deletedZoneIdsRef.current.has(z.id)
        );
        if (unsyncedGuestZones.length > 0) {
          setZones((prev) =>
            prev.map((z) => (z.ownerUid === user.uid ? z : { ...z, ownerUid: user.uid }))
          );
          for (const gz of unsyncedGuestZones) {
            await saveUserZoneToFirestore(user.uid, { ...gz, ownerUid: user.uid });
          }
        }
      } catch {
        // Structured Firestore error is already logged by handleFirestoreError in firebaseZonesService
      }

      const syncedLocalToCloudIds = new Set<string>();
      unsubscribeZones = subscribeToUserZones(
        user.uid,
        (cloudZones) => {
          const cloudIds = new Set(cloudZones.map((cz) => cz.id));
          const mergedZones = mergeStudyZonesAdditively(
            [zonesRef.current, cloudZones],
            deletedZoneIdsRef.current
          );
          setZones(mergedZones);

          // Ensure any local zone not yet present in cloud is uploaded once so other devices receive it
          for (const mz of mergedZones) {
            if (
              !cloudIds.has(mz.id) &&
              !deletedZoneIdsRef.current.has(mz.id) &&
              !syncedLocalToCloudIds.has(mz.id)
            ) {
              syncedLocalToCloudIds.add(mz.id);
              void saveUserZoneToFirestore(user.uid, { ...mz, ownerUid: user.uid }).catch(() => {});
            }
          }

          if (mergedZones.length === 0) return;

          const preferred = resolvePreferredActiveZone(mergedZones, [
            activeZoneIdRef.current,
            remotePreferredZoneIdRef.current,
            initialPersistedState.activeZoneId,
          ]);
          if (preferred && preferred.id !== activeZoneIdRef.current) {
            setActiveZoneId(preferred.id);
            setVertices(preferred.vertices);
            setSoil(preferred.soil);
            setCurrentCropId(preferred.currentCropId);
            setCustomCropLabel(preferred.customCropLabel);
            setForecast14(preferred.forecast14);
            setSampledGridCells(preferred.gridCells);
            setCustomRotationPlans(preferred.customRotationPlans);
            setRadiometricSource(preferred.radiometricSource);
          }
        },
        () => {
          // Structured Firestore error is already logged by handleFirestoreError in firebaseZonesService
        },
        {
          getDeletedZoneIds: () => deletedZoneIdsRef.current,
        }
      );
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeZones) unsubscribeZones();
    };
  }, []);

  // Scientific Evaluation of Custom Crop Rotation Plans for Zones A, B, C
  const rotationEvaluations = useMemo<Record<'A' | 'B' | 'C', CustomRotationEvaluation>>(() => {
    return {
      A: evaluateCustomRotationPlan(customRotationPlans.A, soil),
      B: evaluateCustomRotationPlan(customRotationPlans.B, soil),
      C: evaluateCustomRotationPlan(customRotationPlans.C, soil),
    };
  }, [customRotationPlans, soil]);

  const timeSeries = useMemo(
    () => generateSpectralTimeSeries(farmAverages),
    [farmAverages]
  );

  const growthStage = useMemo(
    () =>
      calculateGrowthStageAndGDD(
        currentCropId,
        selectedPreset.plantingDateISO,
        farmAverages.NDVI || 0.65,
        forecast14[0]?.tempMaxC ? (forecast14[0].tempMaxC + forecast14[0].tempMinC) / 2 : 21.5
      ),
    [currentCropId, selectedPreset.plantingDateISO, farmAverages.NDVI, forecast14]
  );

  const seasonal6Months = useMemo(
    () =>
      generateSeasonal6MonthForecast(
        centroid,
        soil,
        growthStage.cropCoefficientKc,
        nasaRainOverride
      ),
    [centroid, soil, growthStage.cropCoefficientKc, nasaRainOverride]
  );

  const weatherAlerts = useMemo(
    () => generateSmartWeatherAlerts(forecast14, Math.max(1, area.totalFeddansDecimal)),
    [forecast14, area.totalFeddansDecimal]
  );

  const activeZoneRecord = useMemo(
    () => zones.find((z) => z.id === activeZoneId) || null,
    [zones, activeZoneId]
  );

  const activePushAlerts = useMemo<OpenMeteoZonePushAlert[]>(() => {
    const zNameAr = activeZoneRecord?.nameAr || 'زونة الدراسة المحددة';
    const zNameEn = activeZoneRecord?.nameEn || 'Selected Study Zone';
    return evaluateOpenMeteoZonePushAlerts(
      forecast14,
      zNameAr,
      zNameEn,
      activeZoneId,
      vertices.length >= 3
    );
  }, [forecast14, activeZoneRecord, activeZoneId, vertices.length]);

  useEffect(() => {
    if (!pushNotificationsEnabled || vertices.length < 3 || activePushAlerts.length === 0) {
      return;
    }
    if (notificationPermission !== 'granted') return;
    activePushAlerts.forEach((alert) => {
      if (sentBrowserPushTagsRef.current.has(alert.id)) return;
      const title = language === 'ar' ? alert.titleAr : alert.titleEn;
      const body = language === 'ar' ? alert.bodyAr : alert.bodyEn;
      if (dispatchBrowserPushNotification(title, body, alert.id)) {
        sentBrowserPushTagsRef.current.add(alert.id);
      }
    });
  }, [
    pushNotificationsEnabled,
    vertices.length,
    activePushAlerts,
    notificationPermission,
    language,
  ]);

  const handleTogglePushNotifications = () => {
    setPushNotificationsEnabled((prev) => {
      const next = !prev;
      setPushNotificationPreferenceEnabled(next);
      return next;
    });
  };

  const handleEnableBrowserPushNotifications = async () => {
    setPushNotificationsEnabled(true);
    setPushNotificationPreferenceEnabled(true);
    const perm = await requestBrowserNotificationPermission();
    setNotificationPermission(perm);
    if (perm === 'granted') {
      if (activePushAlerts.length > 0) {
        activePushAlerts.forEach((alert) => {
          const title = language === 'ar' ? alert.titleAr : alert.titleEn;
          const body = language === 'ar' ? alert.bodyAr : alert.bodyEn;
          if (dispatchBrowserPushNotification(title, body, alert.id)) {
            sentBrowserPushTagsRef.current.add(alert.id);
          }
        });
      } else {
        dispatchBrowserPushNotification(
          language === 'ar'
            ? 'GeoAgri Pro — تنبيهات Open-Meteo مفعّلة'
            : 'GeoAgri Pro — Open-Meteo Push Alerts Active',
          language === 'ar'
            ? 'سيتم إخطارك فور توقع أمطار غزيرة أو موجات حر شديدة تؤثر على زونة الدراسة المحددة.'
            : 'You will be notified immediately when heavy rainfall or extreme heatwaves threaten your study zone.',
          `push-armed-${activeZoneId || 'global'}`
        );
      }
    }
  };

  const handleDismissPushAlert = (alertId: string) => {
    setDismissedPushAlertIds((prev) =>
      prev.includes(alertId) ? prev : [...prev, alertId]
    );
  };

  const cropRecommendations = useMemo(
    () =>
      scoreCropsForFarm(
        soil,
        farmAverages,
        seasonal6Months,
        Math.max(1, area.totalFeddansDecimal),
        currentCropId
      ),
    [soil, farmAverages, seasonal6Months, area.totalFeddansDecimal, currentCropId]
  );

  const rotationStrategies = useMemo(
    () => buildRotationStrategies(soil, farmAverages),
    [soil, farmAverages]
  );

  const [checklist, setChecklist] = useState<WeeklyChecklistTask[]>([]);

  useEffect(() => {
    if (vertices.length >= 3 && cropRecommendations.length > 0 && subZones.length > 0) {
      const generated = buildWeeklyFarmChecklist(
        area,
        subZones,
        forecast14,
        cropRecommendations[0]
      );
      setChecklist((prev) => {
        const customAiTasks = prev.filter((t) => t.id.startsWith('ai-task-'));
        return [...customAiTasks, ...generated];
      });
    }
  }, [activeZoneId, currentCropId, subZones.length]);

  const syncLiveWeatherAndClimatology = async (targetCentroid: LatLon) => {
    setIsRefreshingWeather(true);
    try {
      const [meteoRes, nasaRes] = await Promise.all([
        fetchLiveOpenMeteoForecast(targetCentroid),
        fetchNasaPowerClimatology(targetCentroid),
      ]);
      const mergedForecast = nasaRes.latestNasaTelemetry
        ? meteoRes.forecast.map((day, idx) => ({
            ...day,
            solarRadiationMjM2:
              idx === 0 && nasaRes.latestNasaTelemetry?.solarRadiationMjM2 !== undefined
                ? nasaRes.latestNasaTelemetry.solarRadiationMjM2
                : day.solarRadiationMjM2,
            earthSkinTempC:
              idx === 0 && nasaRes.latestNasaTelemetry?.earthSkinTempC !== undefined
                ? nasaRes.latestNasaTelemetry.earthSkinTempC
                : day.earthSkinTempC,
            nasaGwetTopPct:
              nasaRes.latestNasaTelemetry?.nasaGwetTopPct ?? day.nasaGwetTopPct,
            nasaGwetRootPct:
              nasaRes.latestNasaTelemetry?.nasaGwetRootPct ?? day.nasaGwetRootPct,
            nasaDataSource: 'NASA POWER Live + GPM IMERG + SMAP',
          }))
        : meteoRes.forecast;
      setForecast14(mergedForecast);
      setWeatherSource(meteoRes.source);
      setNasaSource(nasaRes.source);
      if (nasaRes.monthlyRainMm) {
        const mapped: Record<number, { rainMm: number; tempC: number }> = {};
        Object.entries(nasaRes.monthlyRainMm).forEach(([k, v]) => {
          mapped[Number(k)] = { rainMm: v, tempC: 23 };
        });
        setNasaRainOverride(mapped);
      }
    } finally {
      setIsRefreshingWeather(false);
    }
  };

  useEffect(() => {
    if (vertices.length < 3) return;
    const timer = setTimeout(() => {
      syncLiveWeatherAndClimatology(centroid);
    }, 220);
    return () => clearTimeout(timer);
  }, [activeZoneId, Math.round(centroid.lat * 250), Math.round(centroid.lng * 250), vertices.length >= 3]);

  // Multi-Zone Handlers (with optional Firebase Firestore cloud sync when signed in)
  const persistZoneIfSignedIn = async (zone: UserStudyZone, uidOverride?: string) => {
    const uid = uidOverride || currentUser?.uid;
    if (!uid) return;
    try {
      await saveUserZoneToFirestore(uid, { ...zone, ownerUid: uid });
    } catch (err) {
      console.error('Failed to sync zone to Firestore:', err);
    }
  };

  const handleCreateZone = (
    draft: ZoneDraftConfirmPayload & {
      vertices: LatLon[];
      salinityEC?: number;
      ph?: number;
      organicMatterPct?: number;
      irrigation?: SoilProfile['irrigation'];
    },
    uidOverride?: string
  ) => {
    const newId = `zone-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newCentroid = getPolygonCentroid(draft.vertices);
    const newArea = calculateGeodesicArea(draft.vertices);
    const newSoil: SoilProfile = {
      ...DEFAULT_SOIL_PROFILE,
      texture: draft.soilTexture,
      ...(draft.customTextureLabel ? { customTextureLabel: draft.customTextureLabel } : {}),
      ...(draft.salinityEC !== undefined ? { salinityEC: draft.salinityEC } : {}),
      ...(draft.ph !== undefined ? { ph: draft.ph } : {}),
      ...(draft.organicMatterPct !== undefined ? { organicMatterPct: draft.organicMatterPct } : {}),
      ...(draft.irrigation ? { irrigation: draft.irrigation } : {}),
    };
    const newForecast = buildFallback14DayForecast(newCentroid);
    const initialSpatial = generateSubZonesAndGrid(
      draft.vertices,
      newSoil,
      selectedPreset.baseSpectralBands,
      {
        sm0to7Pct: newForecast[0]?.soilMoisture0to7Pct ?? 28,
        sm7to28Pct: newForecast[0]?.soilMoisture7to28Pct ?? 33,
      }
    );
    const newRotations = buildDefaultCustomRotationPlans(draft.cropId);
    const zoneColors = ['#10b981', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ec4899'];
    const resolvedUid = uidOverride || currentUser?.uid;

    const newZone: UserStudyZone = {
      id: newId,
      ...(resolvedUid ? { ownerUid: resolvedUid } : {}),
      nameAr: draft.nameAr,
      nameEn: draft.nameEn,
      categoryAr: draft.categoryAr,
      categoryEn: draft.categoryEn,
      color: zoneColors[zones.length % zoneColors.length],
      createdAt: new Date().toISOString(),
      vertices: draft.vertices,
      centroid: newCentroid,
      area: newArea,
      soil: newSoil,
      currentCropId: draft.cropId,
      ...(draft.customCropLabel ? { customCropLabel: draft.customCropLabel } : {}),
      plantingDateISO: new Date().toISOString().slice(0, 10),
      gridCells: initialSpatial.gridCells,
      subZones: initialSpatial.subZones,
      farmAverages: initialSpatial.farmAverages,
      forecast14: newForecast,
      weatherSource: 'agro-simulation-fallback',
      nasaSource: 'nasa-power-calibrated-cache',
      customRotationPlans: newRotations,
      radiometricSource: 'agro-coupled-model',
    };

    // Clear previous spatial indices immediately and activate the new zone
    setSampledGridCells(null);
    setZones((prev) => [...prev, newZone]);
    setActiveZoneId(newId);
    setVertices(draft.vertices);
    setSoil(newSoil);
    setCurrentCropId(draft.cropId);
    setCustomCropLabel(draft.customCropLabel);
    setForecast14(newForecast);
    setCustomRotationPlans(newRotations);

    void persistZoneIfSignedIn(newZone, resolvedUid);
    if (resolvedUid) {
      void syncActiveZoneSelection(resolvedUid, newId);
    }
  };

  const showSignInOutcomeNotice = (
    outcome: Awaited<ReturnType<typeof signInWithGoogleSmart>>,
    savedLocally = false
  ) => {
    if (outcome.status === 'popup_blocked') {
      setAuthPopupAlert({
        messageAr: savedLocally
          ? 'تم حفظ الزونة محلياً! المتصفح حظر نافذة تسجيل الدخول المنبثقة — يُرجى السماح بالنوافذ المنبثقة لهذا الموقع أو فتح المنصة في تبويب مستقل لمزامنتها بحساب جوجل.'
          : 'المتصفح حظر نافذة تسجيل الدخول المنبثقة. يُرجى السماح بالنوافذ المنبثقة (Pop-ups) لهذا الموقع من شريط العنوان أو فتح المنصة في تبويب مستقل ثم المحاولة مجدداً.',
        messageEn: savedLocally
          ? 'Zone saved locally! Browser blocked the Google Sign-In popup — allow pop-ups for this site or open in a standalone tab to enable cloud sync.'
          : 'Your browser blocked the Google Sign-In popup. Please allow pop-ups in the address bar or open the app in a standalone tab and try again.',
        showOpenTab: outcome.isInIframe,
      });
      return;
    }

    if (outcome.status === 'unauthorized_domain') {
      const host = outcome.host || (typeof window !== 'undefined' ? window.location.hostname : 'yasserelzanaty2-cloud.github.io');
      setDomainModalHost(host);
      setIsDomainAuthModalOpen(true);
      return;
    }

    if (outcome.status === 'error') {
      setAuthPopupAlert({
        messageAr: `تعذر إتمام تسجيل الدخول بحساب Google (${outcome.code}) — يمكنك مواصلة العمل وستُحفظ بياناتك محلياً بأمان.`,
        messageEn: `Google Sign-In could not complete (${outcome.code}). You can continue working safely locally.`,
        showOpenTab: false,
      });
    }
  };

  const handleSignInWithGoogle = async () => {
    setAuthPopupAlert(null);
    setIsAuthLoading(true);
    try {
      const outcome = await signInWithGoogleSmart();
      if (outcome.status === 'signed_in') {
        setCurrentUser(outcome.user);
        setPdfBannerMessage(
          language === 'ar'
            ? `تم تسجيل الدخول بنجاح بحساب Google: ${outcome.user.displayName || outcome.user.email}`
            : `Signed in successfully with Google: ${outcome.user.displayName || outcome.user.email}`
        );
        setTimeout(() => setPdfBannerMessage(null), 5000);
      } else if (outcome.status === 'unauthorized_domain') {
        const host = outcome.host || (typeof window !== 'undefined' ? window.location.hostname : 'yasserelzanaty2-cloud.github.io');
        setDomainModalHost(host);
        setIsDomainAuthModalOpen(true);
      } else if (outcome.status === 'cancelled') {
        // User closed the popup window
      } else {
        showSignInOutcomeNotice(outcome, false);
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsAuthLoading(true);
    try {
      try {
        localStorage.removeItem('geoagri_saved_user');
      } catch {
        // ignore
      }
      await signOutUser();
      setCurrentUser(null);
      setPdfBannerMessage(
        language === 'ar' ? 'تم تسجيل الخروج بنجاح.' : 'Signed out successfully.'
      );
      setTimeout(() => setPdfBannerMessage(null), 4000);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignInAndConfirmPendingDraft = async (
    draft: ZoneDraftConfirmPayload & { vertices: LatLon[] }
  ) => {
    setAuthPopupAlert(null);
    setIsAuthLoading(true);
    try {
      const outcome = await signInWithGoogleSmart();
      if (outcome.status === 'signed_in') {
        handleCreateZone(draft, outcome.user.uid);
        setPdfBannerMessage(
          language === 'ar'
            ? `تم حفظ الزونة ومزامنتها سحابياً مع حساب Google (${outcome.user.displayName || outcome.user.email}).`
            : `Zone saved & synced to Google account (${outcome.user.displayName || outcome.user.email}).`
        );
        setTimeout(() => setPdfBannerMessage(null), 5500);
      } else if (outcome.status === 'unauthorized_domain') {
        // Always save drawn zone locally for guest/current session so work is never lost
        handleCreateZone(draft);
        const host = outcome.host || (typeof window !== 'undefined' ? window.location.hostname : 'yasserelzanaty2-cloud.github.io');
        setDomainModalHost(host);
        setIsDomainAuthModalOpen(true);
      } else {
        // Preserve drawn zone locally immediately so work is never lost
        handleCreateZone(draft);
        showSignInOutcomeNotice(outcome, true);
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSelectActiveZone = (zoneId: string) => {
    const found = zones.find((z) => z.id === zoneId);
    if (!found) return;
    setActiveZoneId(found.id);
    setVertices(found.vertices);
    setSoil(found.soil);
    setCurrentCropId(found.currentCropId);
    setCustomCropLabel(found.customCropLabel);
    setForecast14(found.forecast14);
    setSampledGridCells(found.gridCells);
    setCustomRotationPlans(found.customRotationPlans);
    setRadiometricSource(found.radiometricSource);
    if (currentUser?.uid) {
      void syncActiveZoneSelection(currentUser.uid, found.id);
    }
  };

  const handleToggleCompareZone = (zoneId: string) => {
    setComparedZoneIds((prev) =>
      prev.includes(zoneId) ? prev.filter((id) => id !== zoneId) : [...prev, zoneId]
    );
  };

  const handleRenameZone = (zoneId: string, newNameAr: string, newCategoryAr: string) => {
    const target = zones.find((z) => z.id === zoneId);
    const updatedZone = target
      ? { ...target, nameAr: newNameAr, nameEn: newNameAr, categoryAr: newCategoryAr }
      : null;

    setZones((prev) =>
      prev.map((z) =>
        z.id === zoneId
          ? {
              ...z,
              nameAr: newNameAr,
              nameEn: newNameAr,
              categoryAr: newCategoryAr,
            }
          : z
      )
    );
    if (updatedZone) void persistZoneIfSignedIn(updatedZone);
  };

  const handleDeleteZone = (zoneId: string) => {
    deletedZoneIdsRef.current.add(zoneId);
    const remaining = zones.filter((z) => z.id !== zoneId);
    setZones(remaining);
    setComparedZoneIds((prev) => prev.filter((id) => id !== zoneId));
    if (currentUser?.uid) {
      void deleteUserZoneFromFirestore(currentUser.uid, zoneId);
    }
    if (activeZoneId === zoneId) {
      if (remaining.length > 0) {
        handleSelectActiveZone(remaining[0].id);
      } else {
        setActiveZoneId(null);
        setVertices([]);
        setSampledGridCells(null);
        setCustomCropLabel(undefined);
        setChecklist((prev) => prev.filter((t) => t.id.startsWith('ai-task-')));
        if (currentUser?.uid) {
          void syncActiveZoneSelection(currentUser.uid, null);
        }
      }
    }
  };

  const handleClearAllZones = () => {
    const idsToDelete = zones.map((z) => z.id);
    idsToDelete.forEach((id) => deletedZoneIdsRef.current.add(id));
    setZones([]);
    setActiveZoneId(null);
    setComparedZoneIds([]);
    setVertices([]);
    setSampledGridCells(null);
    setCustomCropLabel(undefined);
    setChecklist((prev) => prev.filter((t) => t.id.startsWith('ai-task-')));
    if (currentUser?.uid && idsToDelete.length > 0) {
      void clearAllUserZonesFromFirestore(currentUser.uid, idsToDelete);
      void syncActiveZoneSelection(currentUser.uid, null);
    }
  };

  const handleOpenQuickSaveBoundary = () => {
    if (vertices.length < 3) return;
    const nextIdx = zones.length + 1;
    setQuickSaveFarmName(language === 'ar' ? `مزرعتي ${nextIdx}` : `My Farm ${nextIdx}`);
    setQuickSaveModalOpen(true);
  };

  const handleConfirmQuickSaveBoundary = (e: React.FormEvent) => {
    e.preventDefault();
    if (vertices.length < 3) return;
    const trimmedName =
      quickSaveFarmName.trim() ||
      (language === 'ar' ? `مزرعتي ${zones.length + 1}` : `My Farm ${zones.length + 1}`);
    handleCreateZone({
      nameAr: trimmedName,
      nameEn: trimmedName,
      categoryAr: 'حقل محاصيل',
      categoryEn: 'Crop Plot',
      soilTexture: soil.texture,
      customTextureLabel: soil.customTextureLabel,
      salinityEC: soil.salinityEC,
      ph: soil.ph,
      organicMatterPct: soil.organicMatterPct,
      irrigation: soil.irrigation,
      cropId: currentCropId,
      customCropLabel,
      vertices,
    });
    setQuickSaveModalOpen(false);
    setPdfBannerMessage(
      language === 'ar'
        ? `تم حفظ المزرعة "${trimmedName}" وتثبيتها في الشريط العلوي.`
        : `Saved farm "${trimmedName}" and pinned it to the active farm bar.`
    );
    setTimeout(() => setPdfBannerMessage(null), 4500);
  };

  const handleUpdateZoneSoil = (zoneId: string, nextSoil: SoilProfile) => {
    const target = zones.find((z) => z.id === zoneId);
    if (!target) return;
    const recalc = generateSubZonesAndGrid(
      target.vertices,
      nextSoil,
      selectedPreset.baseSpectralBands,
      {
        sm0to7Pct: target.forecast14[0]?.soilMoisture0to7Pct ?? 28,
        sm7to28Pct: target.forecast14[0]?.soilMoisture7to28Pct ?? 33,
      }
    );
    const updatedZone: UserStudyZone = {
      ...target,
      soil: nextSoil,
      gridCells: recalc.gridCells,
      subZones: recalc.subZones,
      farmAverages: recalc.farmAverages,
    };
    setZones((prev) => prev.map((z) => (z.id === zoneId ? updatedZone : z)));
    if (zoneId === activeZoneId) {
      setSoil(nextSoil);
      setSampledGridCells(null);
    }
    void persistZoneIfSignedIn(updatedZone);
  };

  const handleChangeSoil = (nextSoil: SoilProfile) => {
    setSoil(nextSoil);
    setSampledGridCells(null);
    if (activeZoneId) {
      handleUpdateZoneSoil(activeZoneId, nextSoil);
    }
  };

  const handleChangeCurrentCrop = (cropId: string, nextCustomCropLabel?: string) => {
    setCurrentCropId(cropId);
    setCustomCropLabel(nextCustomCropLabel);
    if (activeZoneId) {
      const target = zones.find((z) => z.id === activeZoneId);
      if (target) {
        void persistZoneIfSignedIn({
          ...target,
          currentCropId: cropId,
          customCropLabel: nextCustomCropLabel,
        });
      }
    }
  };

  const handleVerticesChange = (newVerts: LatLon[]) => {
    if (newVerts.length === 0) {
      setSampledGridCells(null);
    }
    setVertices(newVerts);
  };

  const handleSelectPreset = (preset: PresetFarmZone) => {
    setSelectedPreset(preset);
    handleCreateZone({
      nameAr: preset.nameAr,
      nameEn: preset.nameEn,
      categoryAr: 'حقل محاصيل حقلية مروي',
      categoryEn: 'Irrigated Field Crop Plot',
      soilTexture: preset.soil.texture,
      cropId: preset.currentCropId,
      vertices: preset.vertices,
    });
  };

  const handleUpdateZoneCropSlot = (
    zoneId: 'A' | 'B' | 'C',
    slotId: RotationSeasonSlot['slotId'],
    newCropId: string
  ) => {
    setCustomRotationPlans((prev) => {
      const nextPlans = {
        ...prev,
        [zoneId]: {
          ...prev[zoneId],
          slots: prev[zoneId].slots.map((s) =>
            s.slotId === slotId ? { ...s, cropId: newCropId } : s
          ),
        },
      };
      if (activeZoneId) {
        const target = zonesRef.current.find((z) => z.id === activeZoneId);
        if (target) {
          const updatedZone = { ...target, customRotationPlans: nextPlans };
          setZones((zPrev) => zPrev.map((z) => (z.id === activeZoneId ? updatedZone : z)));
          void persistZoneIfSignedIn(updatedZone);
        }
      }
      return nextPlans;
    });
  };

  const handleAutoOptimizeZone = (zoneId: 'A' | 'B' | 'C') => {
    setCustomRotationPlans((prev) => {
      const nextPlans = {
        ...prev,
        [zoneId]: optimizeZoneRotationPlan(prev[zoneId], soil),
      };
      if (activeZoneId) {
        const target = zonesRef.current.find((z) => z.id === activeZoneId);
        if (target) {
          const updatedZone = { ...target, customRotationPlans: nextPlans };
          setZones((zPrev) => zPrev.map((z) => (z.id === activeZoneId ? updatedZone : z)));
          void persistZoneIfSignedIn(updatedZone);
        }
      }
      return nextPlans;
    });
  };

  const activeZoneObj = zones.find((z) => z.id === activeZoneId) || null;

  const handleDownloadPdfReport = async () => {
    if (vertices.length < 3) return;
    const result = await generateAndDownloadFarmPdfReport({
      language,
      zoneNameAr: activeZoneObj ? activeZoneObj.nameAr : 'زونة الدراسة المحددة',
      zoneNameEn: activeZoneObj ? activeZoneObj.nameEn : 'Selected Study Zone',
      centroid,
      area,
      soil,
      farmAverages,
      subZones,
      forecast14,
      seasonal6Months,
      topCrops: cropRecommendations,
      customRotationPlans,
      rotationEvaluations,
    });

    const sizeKb = Math.max(1, Math.round(result.byteLength / 1024));
    setPdfBannerMessage(
      language === 'ar'
        ? `تم إنشاء وتحميل التقرير الميداني بنجاح (${result.filename} · ${sizeKb} KB) للاستخدام بدون إنترنت.`
        : `Offline field PDF report generated & downloaded (${result.filename} · ${sizeKb} KB).`
    );
    setTimeout(() => {
      setPdfBannerMessage(null);
    }, 6000);
  };

  const handleToggleChecklistTask = (taskId: string) => {
    setChecklist((prev) =>
      prev.map((item) =>
        item.id === taskId ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const handleExecuteAdvisorActions = (actions: AdvisorSiteAction[]) => {
    for (const act of actions) {
      if (act.type === 'CREATE_ZONE') {
        handleCreateZone({
          nameAr: act.zoneDraft.nameAr,
          nameEn: act.zoneDraft.nameEn,
          categoryAr: act.zoneDraft.categoryAr,
          categoryEn: act.zoneDraft.categoryEn,
          soilTexture: act.zoneDraft.soilTexture,
          salinityEC: act.zoneDraft.salinityEC,
          ph: act.zoneDraft.ph,
          organicMatterPct: act.zoneDraft.organicMatterPct,
          irrigation: act.zoneDraft.irrigation,
          cropId: act.zoneDraft.cropId,
          customCropLabel: act.zoneDraft.customCropLabel,
          vertices: act.zoneDraft.vertices,
        });
      } else if (act.type === 'UPDATE_ZONE_CONFIG') {
        const u = act.updates;
        if (act.zoneId && act.zoneId !== activeZoneId) {
          const targetZone = zonesRef.current.find((z) => z.id === act.zoneId);
          if (targetZone) {
            const nextZoneSoil: SoilProfile = {
              ...targetZone.soil,
              ...(u.soilTexture ? { texture: u.soilTexture } : {}),
              ...(u.salinityEC !== undefined ? { salinityEC: u.salinityEC } : {}),
              ...(u.ph !== undefined ? { ph: u.ph } : {}),
              ...(u.organicMatterPct !== undefined ? { organicMatterPct: u.organicMatterPct } : {}),
              ...(u.irrigation ? { irrigation: u.irrigation } : {}),
            };
            const nextCropId = u.cropId || targetZone.currentCropId;
            const nextCustomCrop =
              u.cropId !== undefined ? u.customCropLabel : targetZone.customCropLabel;
            const recalc = generateSubZonesAndGrid(
              targetZone.vertices,
              nextZoneSoil,
              selectedPreset.baseSpectralBands,
              {
                sm0to7Pct: targetZone.forecast14[0]?.soilMoisture0to7Pct ?? 28,
                sm7to28Pct: targetZone.forecast14[0]?.soilMoisture7to28Pct ?? 33,
              }
            );
            const updatedZone: UserStudyZone = {
              ...targetZone,
              soil: nextZoneSoil,
              currentCropId: nextCropId,
              ...(nextCustomCrop
                ? { customCropLabel: nextCustomCrop }
                : { customCropLabel: undefined }),
              gridCells: recalc.gridCells,
              subZones: recalc.subZones,
              farmAverages: recalc.farmAverages,
            };
            setZones((prev) => prev.map((z) => (z.id === targetZone.id ? updatedZone : z)));
            void persistZoneIfSignedIn(updatedZone);
          }
        } else {
          if (u.cropId) {
            handleChangeCurrentCrop(u.cropId, u.customCropLabel);
          }
          if (
            u.soilTexture ||
            u.salinityEC !== undefined ||
            u.ph !== undefined ||
            u.organicMatterPct !== undefined ||
            u.irrigation
          ) {
            handleChangeSoil({
              ...soil,
              ...(u.soilTexture ? { texture: u.soilTexture } : {}),
              ...(u.salinityEC !== undefined ? { salinityEC: u.salinityEC } : {}),
              ...(u.ph !== undefined ? { ph: u.ph } : {}),
              ...(u.organicMatterPct !== undefined ? { organicMatterPct: u.organicMatterPct } : {}),
              ...(u.irrigation ? { irrigation: u.irrigation } : {}),
            });
          }
        }
      } else if (act.type === 'RENAME_ZONE') {
        const targetId = act.zoneId || activeZoneId;
        if (targetId) {
          const targetZone = zonesRef.current.find((z) => z.id === targetId);
          handleRenameZone(
            targetId,
            act.newNameAr,
            act.newCategoryAr || targetZone?.categoryAr || 'حقل محاصيل'
          );
        }
      } else if (act.type === 'TOGGLE_COMPARE_ZONE') {
        if (act.mode === 'clear_all') {
          setComparedZoneIds([]);
        } else if (act.zoneId) {
          const zid = act.zoneId;
          if (act.mode === 'add') {
            setComparedZoneIds((prev) => (prev.includes(zid) ? prev : [...prev, zid]));
          } else if (act.mode === 'remove') {
            setComparedZoneIds((prev) => prev.filter((id) => id !== zid));
          } else {
            handleToggleCompareZone(zid);
          }
        }
      } else if (act.type === 'CLEAR_DRAWN_VERTICES') {
        handleVerticesChange([]);
      } else if (act.type === 'SWITCH_MAP_LAYER') {
        if (act.spectralLayer) {
          setActiveLayer(act.spectralLayer);
        }
        if (act.thematicLayer) {
          setActiveThematicMap(act.thematicLayer);
        }
        if (act.navigateToAtlas) {
          setActiveTab('atlas');
        }
      } else if (act.type === 'SWITCH_ACTIVE_ZONE') {
        handleSelectActiveZone(act.zoneId);
      } else if (act.type === 'DELETE_ZONE') {
        if (act.clearAll) {
          handleClearAllZones();
        } else if (act.zoneId) {
          handleDeleteZone(act.zoneId);
        } else if (activeZoneId) {
          handleDeleteZone(activeZoneId);
        }
      } else if (act.type === 'NAVIGATE_TAB') {
        setActiveTab(act.tabId);
      } else if (act.type === 'EXPORT_PDF_REPORT') {
        void handleDownloadPdfReport();
      } else if (act.type === 'ADD_CHECKLIST_TASK') {
        const newTask: WeeklyChecklistTask = {
          id: `ai-task-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          titleAr: act.titleAr,
          titleEn: act.titleEn,
          detailAr: act.detailAr || act.titleAr,
          detailEn: act.detailEn || act.titleEn,
          category: act.category || 'scouting',
          priority: act.priority || 'high',
          dayAr: act.dayAr || 'اليوم / قريباً',
          dayEn: act.dayEn || 'Today / Upcoming',
          completed: false,
        };
        setChecklist((prev) => [newTask, ...prev]);
      } else if (act.type === 'TOGGLE_CHECKLIST_TASK') {
        setChecklist((prev) => {
          if (prev.length === 0) return prev;
          if (act.markAll) {
            const nextVal = act.completed ?? true;
            return prev.map((t) => ({ ...t, completed: nextVal }));
          }
          const query = act.matchText?.trim().toLowerCase();
          let matchedOnce = false;
          return prev.map((t, idx) => {
            if (act.taskId && t.id === act.taskId) {
              matchedOnce = true;
              return { ...t, completed: act.completed ?? !t.completed };
            }
            if (
              query &&
              (t.titleAr.toLowerCase().includes(query) ||
                t.titleEn.toLowerCase().includes(query) ||
                t.detailAr.toLowerCase().includes(query) ||
                t.detailEn.toLowerCase().includes(query))
            ) {
              matchedOnce = true;
              return { ...t, completed: act.completed ?? !t.completed };
            }
            if (!act.taskId && !query && idx === 0 && !matchedOnce) {
              matchedOnce = true;
              return { ...t, completed: act.completed ?? !t.completed };
            }
            return t;
          });
        });
      } else if (act.type === 'DELETE_CHECKLIST_TASK') {
        setChecklist((prev) => {
          if (act.clearAll) return [];
          if (act.taskId) return prev.filter((t) => t.id !== act.taskId);
          const query = act.matchText?.trim().toLowerCase();
          if (query) {
            return prev.filter(
              (t) =>
                !t.titleAr.toLowerCase().includes(query) &&
                !t.titleEn.toLowerCase().includes(query) &&
                !t.detailAr.toLowerCase().includes(query) &&
                !t.detailEn.toLowerCase().includes(query)
            );
          }
          return prev.slice(1);
        });
      } else if (act.type === 'UPDATE_ROTATION_SLOT') {
        handleUpdateZoneCropSlot(act.subZoneId, act.slotId, act.cropId);
      } else if (act.type === 'OPTIMIZE_ROTATION') {
        if (act.subZoneId === 'ALL') {
          handleAutoOptimizeZone('A');
          handleAutoOptimizeZone('B');
          handleAutoOptimizeZone('C');
        } else {
          handleAutoOptimizeZone(act.subZoneId);
        }
      } else if (act.type === 'SET_THEME') {
        setDarkMode((prev) => (act.toggle ? !prev : Boolean(act.darkMode)));
      } else if (act.type === 'SET_LANGUAGE') {
        setLanguage(act.language);
      } else if (act.type === 'TOGGLE_PUSH_NOTIFICATIONS') {
        if (act.dismissAllAlerts) {
          setDismissedPushAlertIds(activePushAlerts.map((a) => a.id));
        }
        if (act.enabled === true) {
          void handleEnableBrowserPushNotifications();
        } else if (act.enabled === false) {
          setPushNotificationsEnabled(false);
          setPushNotificationPreferenceEnabled(false);
        } else if (!act.dismissAllAlerts) {
          handleTogglePushNotifications();
        }
      } else if (act.type === 'REFRESH_WEATHER') {
        void syncLiveWeatherAndClimatology(centroid);
      } else if (act.type === 'CLOSE_FULLSCREEN_CHAT') {
        setIsFloatingChatOpen(false);
      }
    }
  };

  const activeCropObj =
    CROP_DATABASE.find((c) => c.id === currentCropId) || CROP_DATABASE[0];

  const isAr = language === 'ar';
  const hasActiveStudyArea = vertices.length >= 3;

  const advisorChat = useAdvisorChat({
    language,
    hasActiveZones: hasActiveStudyArea,
    zoneNameAr: activeZoneObj ? activeZoneObj.nameAr : '',
    zoneNameEn: activeZoneObj ? activeZoneObj.nameEn : '',
    centroid,
    currentCropId,
    customCropLabel: activeZoneObj?.customCropLabel ?? customCropLabel,
    area,
    soil,
    farmAverages,
    subZones: hasActiveStudyArea ? subZones : [],
    forecast14,
    topCrops: hasActiveStudyArea ? cropRecommendations : [],
    zones,
    activeZoneId,
    checklist,
    darkMode,
    activeTab,
    activeLayer,
    activeThematicMap,
    drawnVerticesCount: vertices.length,
    pushNotificationsEnabled,
    comparedZoneIds,
    pendingAdvisorPrompt,
    onClearPendingAdvisorPrompt: () => setPendingAdvisorPrompt(null),
    onExecuteSiteActions: handleExecuteAdvisorActions,
  });

  const navTabs: Array<{
    id: MainTabId;
    labelAr: string;
    labelEn: string;
  }> = [
    {
      id: 'atlas',
      labelAr: 'الخريطة الشاملة',
      labelEn: 'Full-Screen Atlas',
    },
    {
      id: 'indices',
      labelAr: 'تحليل المؤشرات',
      labelEn: 'Spectral Indices',
    },
    {
      id: 'weather',
      labelAr: 'الأمطار والتنبؤ',
      labelEn: 'Rain & Climate AI',
    },
    {
      id: 'crops',
      labelAr: 'التوصيات والدورة',
      labelEn: 'Best Crops & Rotation',
    },
    {
      id: 'advisor',
      labelAr: 'GeoAgri ai',
      labelEn: 'GeoAgri ai',
    },
  ];

  const renderZeroZonesPromptForTab = () => (
    <div
      data-testid="tab-zero-zones-prompt"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center max-w-2xl mx-auto my-8 space-y-4"
    >
      <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
        <MapPin className="w-6 h-6" />
      </div>
      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
        {isAr
          ? 'يرجى تحديد زونة دراسة على الخريطة الشاملة أولاً'
          : 'Please Define a Study Zone on the Full-Screen Atlas First'}
      </h2>
      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
        {isAr
          ? 'تم إزالة جميع الزونات العشوائية والمسبقة لكي تبدأ الدراسة على أرضك الفعلية فقط. انتقل إلى الخريطة الشاملة وحدد زونة واحدة أو عدة زونات، وقم بتسميتها لعرض بياناتها المستقلة.'
          : 'All preset and mock zones have been removed so you can analyze your own selected land. Open the Full-Screen Atlas, draw one or more zones, and name them to view independent telemetry.'}
      </p>
      <button
        type="button"
        onClick={() => setActiveTab('atlas')}
        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold inline-flex items-center gap-2 cursor-pointer"
      >
        <PlusCircle className="w-4 h-4" />
        <span>
          {isAr ? 'انتقل إلى الخريطة الشاملة لتحديد زونة الدراسة' : 'Go to Atlas to Draw Study Zone'}
        </span>
      </button>
    </div>
  );

  return (
    <div
      className={`w-full max-w-[100vw] overflow-x-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col ${
        activeTab === 'atlas' ? 'h-dvh overflow-hidden' : 'min-h-dvh pb-8'
      }`}
    >
      {/* Simplified 3-Zone Top Navigation Bar consistent across all views */}
      <div
        ref={mobileMenuWrapperRef}
        className={`sticky top-0 shrink-0 transition-all ${
          mobileNavOpen ? 'z-[100]' : 'z-40'
        }`}
      >
        <header className="h-[clamp(3.25rem,5vh,3.75rem)] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-2.5 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 lg:gap-8">
          {/* Zone 1: Mobile/Tablet Menu Trigger (<1024px) + Single text element wordmark */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
            <button
              type="button"
              data-testid="mobile-nav-menu-btn"
              aria-expanded={mobileNavOpen}
              aria-controls="mobile-tablet-nav-drawer"
              aria-label={isAr ? 'فتح قائمة الأقسام' : 'Open navigation menu'}
              onClick={() => setMobileNavOpen((prev) => !prev)}
              className="lg:hidden min-h-[44px] min-w-[44px] p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center shrink-0 cursor-pointer transition-colors"
            >
              {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <a
              href="#top"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('atlas');
                setMobileNavOpen(false);
              }}
              className="text-[clamp(0.85rem,1.4vw,1.05rem)] font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 truncate max-w-[135px] sm:max-w-none"
            >
              <span>GeoAgri Pro</span>
            </a>
          </div>

          {/* Zone 2: Clean single-line text navigation links (Desktop >=1024px) */}
          <nav
            aria-label="Primary Navigation"
            data-testid="primary-top-navigation"
            className="hidden lg:flex items-center gap-5 xl:gap-6 text-xs xl:text-sm font-medium text-slate-600 dark:text-slate-300"
          >
            {navTabs.map((t) => (
              <button
                key={t.id}
                type="button"
                data-testid={`top-nav-${t.id}`}
                onClick={() => setActiveTab(t.id)}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === t.id
                    ? 'text-emerald-700 dark:text-emerald-400 font-bold underline underline-offset-8 decoration-2'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {isAr ? t.labelAr : t.labelEn}
              </button>
            ))}
          </nav>

          {/* Zone 3: Account, PDF Report (Desktop), Theme & Language */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {currentUser ? (
              <div
                data-testid="google-user-session-controls"
                className="flex items-center gap-1 sm:gap-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-1.5 sm:px-2 py-1 min-h-[44px] lg:min-h-[38px]"
              >
                {currentUser.photoURL && (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    className="w-5 h-5 rounded-full object-cover shrink-0"
                    referrerPolicy="no-referrer"
                  />
                )}
                <span className="hidden sm:inline text-xs font-semibold text-slate-800 dark:text-slate-100 max-w-[92px] truncate">
                  {currentUser.displayName || currentUser.email}
                </span>
                <button
                  type="button"
                  data-testid="google-signout-btn"
                  onClick={handleSignOut}
                  disabled={isAuthLoading}
                  aria-label={isAr ? 'تسجيل الخروج' : 'Sign out'}
                  className="p-1.5 rounded hover:bg-rose-500/15 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer flex items-center gap-1 text-[11px] font-bold whitespace-nowrap"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">{isAr ? 'خروج' : 'Sign out'}</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                data-testid="google-signin-header-btn"
                onClick={handleSignInWithGoogle}
                disabled={isAuthLoading}
                className="min-h-[44px] lg:min-h-[38px] px-2 sm:px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 hover:bg-sky-600 hover:text-white dark:hover:bg-sky-600 border border-slate-300 dark:border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                <span className="sm:hidden">{isAr ? 'دخول' : 'Sign in'}</span>
                <span className="hidden sm:inline">{isAr ? 'دخول بحساب جوجل' : 'Google Sign in'}</span>
              </button>
            )}

            {hasActiveStudyArea && (
              <button
                type="button"
                onClick={handleDownloadPdfReport}
                aria-label={isAr ? 'تحميل تقرير الزونة PDF' : 'Download Zone PDF Report'}
                className="hidden lg:flex min-h-[38px] px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 items-center gap-1.5 cursor-pointer"
              >
                <FileDown className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                <span>PDF</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              aria-label={isAr ? 'تبديل الوضع الليلي' : 'Toggle Dark Mode'}
              className="min-h-[44px] min-w-[44px] lg:min-h-[38px] lg:min-w-[38px] p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              type="button"
              data-testid="language-toggle-btn"
              onClick={() => setLanguage(isAr ? 'en' : 'ar')}
              className="min-h-[44px] lg:min-h-[38px] px-2.5 sm:px-3 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 sm:gap-1.5 cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 shrink-0" />
              <span>{isAr ? 'EN' : 'AR'}</span>
            </button>
          </div>
        </header>

        {/* Mobile & Tablet Navigation Drawer (<1024px) */}
        {mobileNavOpen && (
          <>
            <div
              className="lg:hidden fixed inset-0 top-[clamp(3.25rem,5vh,3.75rem)] bg-slate-950/40 backdrop-blur-xs z-40"
              onClick={() => setMobileNavOpen(false)}
              aria-hidden="true"
            />
            <nav
              id="mobile-tablet-nav-drawer"
              data-testid="mobile-tablet-nav-drawer"
              aria-label="Mobile Navigation"
              className="lg:hidden absolute top-full inset-x-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-2xl p-3 space-y-1.5 max-h-[calc(100dvh-60px)] overflow-y-auto"
            >
            {navTabs.map((t) => {
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  data-testid={`mobile-nav-${t.id}`}
                  onClick={() => {
                    setActiveTab(t.id);
                    setMobileNavOpen(false);
                  }}
                  className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-700/60'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium border border-transparent'
                  }`}
                >
                  <span>{isAr ? t.labelAr : t.labelEn}</span>
                  {isActive && (
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      {isAr ? 'نشط' : 'Active'}
                    </span>
                  )}
                </button>
              );
            })}

            {hasActiveStudyArea && (
              <div className="pt-1.5 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  data-testid="mobile-nav-download-pdf"
                  onClick={() => {
                    void handleDownloadPdfReport();
                    setMobileNavOpen(false);
                  }}
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-900 dark:text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <FileDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    {isAr ? 'تصدير تقرير PDF للمزرعة النشطة' : 'Export Active Farm PDF Report'}
                  </span>
                </button>
              </div>
            )}
          </nav>
        </>
      )}
      </div>

      {/* Always-Visible Active Farm Context Bar across all tabs and viewports */}
      <div
        data-testid="active-farm-context-bar"
        className="shrink-0 z-20 bg-slate-50/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 px-2.5 sm:px-6 py-1.5 sm:py-2"
      >
        <div className="max-w-[min(96vw,78rem)] mx-auto flex flex-wrap items-center justify-between gap-x-2.5 gap-y-1.5">
          <div className="flex flex-wrap items-center gap-x-1.5 sm:gap-x-2 gap-y-0.5 text-[11px] sm:text-xs min-w-0">
            <Sprout className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="hidden sm:inline font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
              {isAr ? 'المزرعة النشطة:' : 'Active Farm:'}
            </span>
            {activeZoneObj ? (
              <>
                <span
                  data-testid="active-farm-bar-name"
                  className="font-bold text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-[280px]"
                >
                  {isAr ? activeZoneObj.nameAr : activeZoneObj.nameEn}
                </span>
                <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                  ·
                </span>
                <span className="font-mono tabular-nums font-semibold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                  {area.feddans} {isAr ? 'فدان' : 'fed'} {area.qirats} {isAr ? 'قيراط' : 'qirat'}
                </span>
                <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                  ·
                </span>
                <span className="text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  {customCropLabel || (isAr ? activeCropObj.nameAr : activeCropObj.nameEn)}
                </span>
              </>
            ) : hasActiveStudyArea ? (
              <>
                <span
                  data-testid="active-farm-bar-name"
                  className="font-bold text-amber-700 dark:text-amber-300 whitespace-nowrap"
                >
                  {isAr ? 'حدود مرسومة قيد التحليل' : 'Drawn Boundary Active'}
                </span>
                <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                  ·
                </span>
                <span className="font-mono tabular-nums font-semibold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                  {area.feddans} {isAr ? 'فدان' : 'fed'} {area.qirats} {isAr ? 'قيراط' : 'qirat'}
                </span>
                <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                  ·
                </span>
                <span className="text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  {customCropLabel || (isAr ? activeCropObj.nameAr : activeCropObj.nameEn)}
                </span>
              </>
            ) : (
              <span
                data-testid="active-farm-bar-name"
                className="text-slate-500 dark:text-slate-400"
              >
                {isAr
                  ? 'لم يتم اختيار مزرعة بعد — ارسم حدوداً على الخريطة أو اطلب من GeoAgri ai'
                  : 'No farm selected yet — draw boundaries on the map or ask GeoAgri ai'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {zones.length > 0 && (
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 min-h-[34px]">
                <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <select
                  aria-label={isAr ? 'تبديل المزرعة النشطة' : 'Switch Active Farm'}
                  data-testid="global-active-zone-select"
                  value={activeZoneId || ''}
                  onChange={(e) => handleSelectActiveZone(e.target.value)}
                  className="text-xs font-bold bg-transparent text-slate-900 dark:text-white cursor-pointer outline-none max-w-[160px] sm:max-w-[220px] truncate"
                >
                  {zones.map((z) => (
                    <option
                      key={z.id}
                      value={z.id}
                      className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    >
                      {isAr ? z.nameAr : z.nameEn} ({z.area.feddans} {isAr ? 'فدان' : 'fed'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {zones.length === 0 && hasActiveStudyArea && (
              <button
                type="button"
                data-testid="topbar-save-drawn-farm-btn"
                onClick={handleOpenQuickSaveBoundary}
                className="min-h-[34px] px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{isAr ? 'حفظ وتسمية المزرعة' : 'Save Farm'}</span>
              </button>
            )}

            {activeTab !== 'atlas' && (
              <button
                type="button"
                onClick={() => setActiveTab('atlas')}
                className="min-h-[34px] px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{isAr ? 'الخريطة والحدود' : 'Map & Boundaries'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Save Drawn Boundary Modal */}
      {quickSaveModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleConfirmQuickSaveBoundary}
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isAr ? 'حفظ الحدود المرسومة كمزرعة دائمة' : 'Save Drawn Boundary as Farm'}
              </h3>
              <button
                type="button"
                onClick={() => setQuickSaveModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {isAr
                ? `المساحة المحددة: ${area.feddans} فدان ${area.qirats} قيراط — سيتم حفظها محلياً وسحابياً واستعادتها تلقائياً في كل مرة.`
                : `Selected area: ${area.feddans} feddans ${area.qirats} qirats — saved locally and to cloud for automatic recovery.`}
            </p>
            <div className="space-y-1.5">
              <label
                htmlFor="quick-save-farm-name"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                {isAr ? 'اسم المزرعة أو الحقل' : 'Farm / Plot Name'}
              </label>
              <input
                id="quick-save-farm-name"
                type="text"
                autoFocus
                required
                maxLength={120}
                value={quickSaveFarmName}
                onChange={(e) => setQuickSaveFarmName(e.target.value)}
                placeholder={isAr ? 'مثال: مزرعة المنصورة الشرقية' : 'e.g. East Delta Plot'}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setQuickSaveModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
              >
                {isAr ? 'حفظ المزرعة' : 'Save Farm'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Official Google Auth & Firebase Domain Authorization Modal */}
      {isDomainAuthModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setIsDomainAuthModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-5 text-slate-800 dark:text-slate-100"
            onClick={(e) => e.stopPropagation()}
            dir={isAr ? 'rtl' : 'ltr'}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-600 dark:text-sky-400">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {isAr ? 'تفعيل تسجيل الدخول بحساب Google الرسمي' : 'Authorize Domain for Google Sign-In'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isAr ? 'خطوة أمان واحدة في Firebase للسماح لجميع المستخدمين بالدخول' : 'One-time Firebase setup to allow everyone to log in'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDomainAuthModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Explanation */}
            <div className="bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 rounded-xl p-3.5 text-xs text-sky-900 dark:text-sky-200 space-y-2">
              <p className="leading-relaxed">
                {isAr
                  ? 'لحماية الحسابات، تفرض أنظمة Google وFirebase إضافة نطاق الموقع إلى قائمة النطاقات المصرح بها (Authorized Domains) حتى تتمكن أنت وجميع أعضاء الفريق والزوار من تسجيل الدخول بحسابات Google الشخصية (@gmail.com).'
                  : 'For security, Google OAuth requires adding this site domain to Firebase Authorized Domains so that every user can log in with their personal Google account.'}
              </p>
            </div>

            {/* Step 1: Copy Domain Box */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {isAr ? 'النطاق المطلوب إضافته:' : 'Domain to authorize:'}
              </label>
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl p-2 font-mono text-xs text-slate-900 dark:text-white">
                <span className="flex-1 truncate select-all">{domainModalHost}</span>
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard.writeText(domainModalHost);
                    setDomainCopied(true);
                    setTimeout(() => setDomainCopied(false), 3000);
                  }}
                  className="px-2.5 py-1 bg-white dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-sans font-bold flex items-center gap-1.5 transition-colors cursor-pointer text-slate-700 dark:text-slate-200"
                >
                  {domainCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400">{isAr ? 'تم النسخ ✓' : 'Copied ✓'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{isAr ? 'نسخ النطاق' : 'Copy'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Direct Link to Firebase Console */}
            <a
              href="https://console.firebase.google.com/project/clever-circlet-494509-s0/authentication/settings"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full p-3 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-transform transform hover:-translate-y-0.5 cursor-pointer text-center"
            >
              <span>{isAr ? 'فتح لوحة تحكم Firebase مباشرة لإضافة النطاق' : 'Open Firebase Console Authorized Domains'}</span>
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* Steps list */}
            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="font-bold text-slate-700 dark:text-slate-200 mb-1">
                {isAr ? 'طريقة الإضافة (تستغرق 30 ثانية فقط):' : '3-Step Setup (30 seconds):'}
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-sky-500/20 text-sky-600 dark:text-sky-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                <span>{isAr ? 'اضغط الزر أعلاه لفتح صفحة إعدادات مشروعك في Firebase.' : 'Click the button above to open Firebase Settings.'}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-sky-500/20 text-sky-600 dark:text-sky-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                <span>{isAr ? 'في قسم "النطاقات المصرح بها" (Authorized domains)، اضغط على "إضافة نطاق" (Add domain).' : 'In "Authorized domains", click "Add domain".'}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-sky-500/20 text-sky-600 dark:text-sky-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                <span>{isAr ? `الصق (${domainModalHost}) واضغط "حفظ" (Save) — وسيعمل تسجيل الدخول بجوجل فوراً!` : `Paste (${domainModalHost}) and click Save — done!`}</span>
              </div>
            </div>

            {/* Instant localhost tip */}
            <div className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg">
              {isAr
                ? '💡 ملاحظة للمطور: إذا كنت تشغل التطبيق محلياً عبر (http://localhost:3000)، فإن تسجيل الدخول بحساب Google يعمل فوراً ومصرح به مسبقاً دون الحاجة لأي إعدادات.'
                : '💡 Note: If running locally on http://localhost:3000, Google Sign-In is already authorized and works immediately.'}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsDomainAuthModalOpen(false);
                  void handleSignInWithGoogle();
                }}
                className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer text-center"
              >
                {isAr ? 'إعادة محاولة الدخول بجوجل الآن' : 'Retry Google Sign-In Now'}
              </button>
              <button
                type="button"
                onClick={() => setIsDomainAuthModalOpen(false)}
                className="py-2 px-4 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                {isAr ? 'متابعة كزائر' : 'Continue as Guest'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Sign-In Popup Guidance Banner (non-blocking, preserves local work) */}
      {authPopupAlert && (
        <div
          data-testid="auth-popup-alert-banner"
          className="max-w-7xl mx-auto w-full px-3.5 sm:px-6 pt-3"
        >
          <div className="bg-amber-950/95 border border-amber-500/40 text-amber-50 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <div className="flex items-start gap-2.5 text-xs sm:text-sm font-medium max-w-2xl">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{isAr ? authPopupAlert.messageAr : authPopupAlert.messageEn}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsDomainAuthModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{isAr ? 'خطوات تفعيل النطاق' : 'Domain Setup Guide'}</span>
              </button>
              {authPopupAlert.showOpenTab && typeof window !== 'undefined' && (
                <a
                  href={window.location.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{isAr ? 'فتح في تبويب مستقل' : 'Open in New Tab'}</span>
                </a>
              )}
              <button
                type="button"
                onClick={handleSignInWithGoogle}
                disabled={isAuthLoading}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-xs font-semibold cursor-pointer"
              >
                {isAr ? 'إعادة المحاولة' : 'Retry'}
              </button>
              <button
                type="button"
                onClick={() => setAuthPopupAlert(null)}
                className="text-xs font-mono text-amber-200 hover:text-white px-2 py-1 cursor-pointer"
              >
                {isAr ? 'إغلاق' : 'Dismiss'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Report & Cloud Sync Confirmation Banner */}
      {pdfBannerMessage && (
        <div
          data-testid="pdf-report-banner"
          className="max-w-7xl mx-auto w-full px-3.5 sm:px-6 pt-3"
        >
          <div className="bg-emerald-900 text-white rounded-xl px-4 py-3 flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>{pdfBannerMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setPdfBannerMessage(null)}
              className="text-xs font-mono text-emerald-200 hover:text-white px-2 py-1 cursor-pointer"
            >
              {isAr ? 'إغلاق' : 'Dismiss'}
            </button>
          </div>
        </div>
      )}

      {/* Main Content Container */}
      <main
        className={`flex-1 w-full mx-auto ${
          activeTab === 'atlas'
            ? 'min-h-0 overflow-hidden p-0 m-0 max-w-none'
            : 'max-w-[min(96vw,78rem)] px-[clamp(0.75rem,2.5vw,1.75rem)] py-[clamp(0.85rem,2vw,1.5rem)]'
        }`}
      >
        {activeTab === 'atlas' && (
          <FullScreenAtlasView
            language={language}
            selectedPresetId={selectedPreset.id}
            onSelectPreset={handleSelectPreset}
            vertices={vertices}
            onChangeVertices={handleVerticesChange}
            soil={soil}
            onChangeSoil={handleChangeSoil}
            area={area}
            subZones={subZones}
            gridCells={gridCells}
            farmAverages={farmAverages}
            activeLayer={activeLayer}
            onChangeActiveLayer={setActiveLayer}
            activeThematicMap={activeThematicMap}
            onChangeThematicMap={setActiveThematicMap}
            forecast14={forecast14}
            selectedMoistureDayIdx={selectedMoistureDayIdx}
            onChangeMoistureDayIdx={setSelectedMoistureDayIdx}
            onDownloadPdfReport={handleDownloadPdfReport}
            radiometricSource={
              radiometricSource === 'satellite-tile-pixel-calibrated'
                ? 'satellite-pixel-live'
                : 'agro-coupled-model'
            }
            zones={zones}
            activeZoneId={activeZoneId}
            comparedZoneIds={comparedZoneIds}
            onSelectActiveZone={handleSelectActiveZone}
            onToggleCompareZone={handleToggleCompareZone}
            onCreateZone={(draft) => handleCreateZone(draft)}
            onSignInAndConfirmPendingDraft={handleSignInAndConfirmPendingDraft}
            currentUser={
              currentUser
                ? {
                    uid: currentUser.uid,
                    displayName: currentUser.displayName,
                    email: currentUser.email,
                    photoURL: currentUser.photoURL,
                  }
                : null
            }
            isAuthLoading={isAuthLoading}
            onRenameZone={handleRenameZone}
            onDeleteZone={handleDeleteZone}
            onClearAllZones={handleClearAllZones}
            onUpdateZoneSoil={handleUpdateZoneSoil}
            isRefreshingData={isRefreshingWeather || isCalibratingPixels}
            currentCropId={currentCropId}
            customCropLabel={customCropLabel}
            onChangeCurrentCrop={handleChangeCurrentCrop}
            pushNotificationsEnabled={pushNotificationsEnabled}
            onTogglePushNotifications={handleTogglePushNotifications}
            notificationPermission={notificationPermission}
            onEnableBrowserPushNotifications={handleEnableBrowserPushNotifications}
            activePushAlerts={activePushAlerts}
            dismissedPushAlertIds={dismissedPushAlertIds}
            onDismissPushAlert={handleDismissPushAlert}
          />
        )}

        {activeTab === 'indices' && (
          <SpectralIndicesView
            language={language}
            farmAverages={farmAverages}
            subZones={subZones}
            timeSeries={timeSeries}
            growthStage={growthStage}
            cropNameAr={customCropLabel || activeCropObj.nameAr}
            cropNameEn={customCropLabel || activeCropObj.nameEn}
            activeLayer={activeLayer}
            onSelectLayerOnMap={(layer) => {
              setActiveLayer(layer);
              if (layer === 'LST') {
                setActiveThematicMap('temperature');
              } else if (layer === 'SM_0_7') {
                setActiveThematicMap('soil_moisture');
              } else {
                setActiveThematicMap('vegetation');
              }
              setActiveTab('atlas');
            }}
            hasActiveStudyArea={hasActiveStudyArea}
            area={area}
            zones={zones}
            activeZoneId={activeZoneId}
            comparedZoneIds={comparedZoneIds}
            onSelectActiveZone={handleSelectActiveZone}
            onToggleCompareZone={handleToggleCompareZone}
            onGoToMapToDrawZone={() => setActiveTab('atlas')}
            onSaveDrawnBoundary={handleOpenQuickSaveBoundary}
            soil={soil}
          />
        )}

        {activeTab === 'weather' &&
          (hasActiveStudyArea ? (
            <WeatherForecastView
              language={language}
              centroid={centroid}
              area={area}
              soil={soil}
              forecast14={forecast14}
              seasonal6Months={seasonal6Months}
              alerts={weatherAlerts}
              weatherSource={weatherSource}
              nasaSource={nasaSource}
              isRefreshing={isRefreshingWeather}
              onRefreshWeather={() => syncLiveWeatherAndClimatology(centroid)}
              farmAverages={farmAverages}
              subZones={subZones}
              growthStage={growthStage}
              currentCropId={currentCropId}
              customCropLabel={customCropLabel}
              onConsultAgronomistWithPrompt={(promptText) => {
                setPendingAdvisorPrompt(promptText);
                setActiveTab('advisor');
              }}
            />
          ) : (
            renderZeroZonesPromptForTab()
          ))}

        {activeTab === 'crops' &&
          (hasActiveStudyArea ? (
            <CropRecommenderView
              language={language}
              area={area}
              soil={soil}
              growthStage={growthStage}
              recommendations={cropRecommendations}
              rotationStrategies={rotationStrategies}
              selectedCropId={currentCropId}
              onAdoptCrop={(cropId) => handleChangeCurrentCrop(cropId, undefined)}
              customRotationPlans={customRotationPlans}
              rotationEvaluations={rotationEvaluations}
              onUpdateZoneCropSlot={handleUpdateZoneCropSlot}
              onAutoOptimizeZone={handleAutoOptimizeZone}
              onDownloadPdfReport={handleDownloadPdfReport}
              centroid={centroid}
              forecast14={forecast14}
              farmAverages={farmAverages}
              subZones={subZones}
              onConsultAgronomistWithPrompt={(promptText) => {
                setPendingAdvisorPrompt(promptText);
                setActiveTab('advisor');
              }}
            />
          ) : (
            renderZeroZonesPromptForTab()
          ))}

        {activeTab === 'advisor' && (
          <AdvisorConsultantView
            language={language}
            hasActiveZones={hasActiveStudyArea}
            zoneNameAr={activeZoneObj ? activeZoneObj.nameAr : ''}
            zoneNameEn={activeZoneObj ? activeZoneObj.nameEn : ''}
            centroid={centroid}
            currentCropId={currentCropId}
            customCropLabel={activeZoneObj?.customCropLabel ?? customCropLabel}
            area={area}
            soil={soil}
            farmAverages={farmAverages}
            subZones={hasActiveStudyArea ? subZones : []}
            forecast14={forecast14}
            topCrops={hasActiveStudyArea ? cropRecommendations : []}
            checklist={checklist}
            onToggleChecklistTask={handleToggleChecklistTask}
            onGoToAtlas={() => setActiveTab('atlas')}
            pendingAdvisorPrompt={pendingAdvisorPrompt}
            onClearPendingAdvisorPrompt={() => setPendingAdvisorPrompt(null)}
            zones={zones}
            activeZoneId={activeZoneId}
            onExecuteSiteActions={handleExecuteAdvisorActions}
            onSelectLayerOnMap={(layer) => {
              setActiveLayer(layer);
              setActiveTab('atlas');
            }}
            onAdoptCrop={(cropId, customLabel) => handleChangeCurrentCrop(cropId, customLabel)}
            advisorChat={advisorChat}
            onOpenFullPageChat={() => setIsFloatingChatOpen(true)}
          />
        )}
      </main>

      <FloatingAdvisorChat
        isOpen={isFloatingChatOpen}
        onOpenChange={setIsFloatingChatOpen}
        hideBubble={activeTab === 'advisor'}
        isAtlasTab={activeTab === 'atlas'}
        language={language}
        hasActiveZones={hasActiveStudyArea}
        zoneNameAr={activeZoneObj ? activeZoneObj.nameAr : ''}
        zoneNameEn={activeZoneObj ? activeZoneObj.nameEn : ''}
        centroid={centroid}
        currentCropId={currentCropId}
        customCropLabel={activeZoneObj?.customCropLabel ?? customCropLabel}
        area={area}
        farmAverages={farmAverages}
        soilSalinityEC={soil.salinityEC}
        subZones={hasActiveStudyArea ? subZones : []}
        forecast14={forecast14}
        topCrops={hasActiveStudyArea ? cropRecommendations : []}
        checklist={checklist}
        advisorChat={advisorChat}
        onToggleChecklistTask={handleToggleChecklistTask}
        onGoToAtlas={() => setActiveTab('atlas')}
        onSelectLayerOnMap={(layer) => {
          setActiveLayer(layer);
          setActiveTab('atlas');
        }}
        onAdoptCrop={(cropId, customLabel) => handleChangeCurrentCrop(cropId, customLabel)}
      />
    </div>
  );
}
