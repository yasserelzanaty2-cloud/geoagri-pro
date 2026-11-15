import type { User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import {
  DailyWeatherPoint,
  Language,
  SoilProfile,
  UserStudyZone,
} from '../types/agro';
import {
  PRESET_FARM_ZONES,
  buildFallback14DayForecast,
  generateSubZonesAndGrid,
} from '../utils/agroEngine';
import { mergeStudyZonesAdditively } from './localZonesStorage';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function sanitizeStr(val: string | undefined | null, maxLen: number, fallback = ''): string {
  const clean = typeof val === 'string' ? val.trim() : '';
  const target = clean.length > 0 ? clean : fallback;
  return target.slice(0, maxLen);
}

function sanitizeId(rawId: string): string {
  const cleaned = rawId.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 128);
  return cleaned || `zone-${Date.now()}`;
}

function stripUndefinedDeep<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function sanitizeSoilTexture(texture: unknown): SoilProfile['texture'] {
  if (
    texture === 'clay' ||
    texture === 'loamy' ||
    texture === 'sandy' ||
    texture === 'calcareous'
  ) {
    return texture;
  }
  return 'clay';
}

function sanitizeSoilIrrigation(irrigation: unknown): SoilProfile['irrigation'] {
  if (
    irrigation === 'flood' ||
    irrigation === 'drip' ||
    irrigation === 'sprinkler' ||
    irrigation === 'pivot' ||
    irrigation === 'rainfed'
  ) {
    return irrigation;
  }
  return 'drip';
}

async function callAuthenticatedCloudSqlApi(
  endpoint: string,
  method: 'GET' | 'POST' | 'DELETE',
  body?: Record<string, unknown>
): Promise<Response | null> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) return null;
    const token = await currentUser.getIdToken();
    const res = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return res;
  } catch {
    return null;
  }
}

export async function upsertUserProfile(
  user: User,
  prefs: { preferredLanguage: Language; activeZoneId?: string | null }
): Promise<{ activeZoneId: string | null }> {
  const userPath = `users/${user.uid}`;
  const ref = doc(db, 'users', user.uid);
  const safeDisplayName = sanitizeStr(user.displayName, 120, 'GeoAgri User');
  const safePhoto = sanitizeStr(user.photoURL, 512, '');
  const safeLang: Language = prefs.preferredLanguage === 'en' ? 'en' : 'ar';
  const safeActiveZoneId = sanitizeStr(prefs.activeZoneId, 128, '');

  let sqlActiveZoneId = '';
  try {
    const syncRes = await callAuthenticatedCloudSqlApi('/api/users/sync', 'POST', {
      displayName: safeDisplayName,
      photoURL: safePhoto,
      preferredLanguage: safeLang,
      ...(safeActiveZoneId ? { activeZoneId: safeActiveZoneId } : {}),
    });
    if (syncRes && syncRes.ok) {
      const syncData = (await syncRes.json()) as {
        user?: { activeZoneId?: string | null };
      };
      sqlActiveZoneId = sanitizeStr(syncData?.user?.activeZoneId, 128, '');
    }
  } catch {
    // ignore Cloud SQL sync notice; Firestore & local storage remain active
  }

  let firestoreActiveZoneId = '';
  try {
    const existingSnap = await getDoc(ref);
    if (!existingSnap.exists()) {
      const initialActive = safeActiveZoneId || sqlActiveZoneId;
      await setDoc(ref, {
        uid: user.uid,
        displayName: safeDisplayName,
        photoURL: safePhoto,
        preferredLanguage: safeLang,
        activeZoneId: initialActive,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      firestoreActiveZoneId = initialActive;
    } else {
      firestoreActiveZoneId = sanitizeStr(existingSnap.data()?.activeZoneId, 128, '');
      await updateDoc(ref, {
        displayName: safeDisplayName,
        photoURL: safePhoto,
        preferredLanguage: safeLang,
        ...(safeActiveZoneId ? { activeZoneId: safeActiveZoneId } : {}),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }

  const resolved = safeActiveZoneId || firestoreActiveZoneId || sqlActiveZoneId;
  return { activeZoneId: resolved || null };
}

export async function syncActiveZoneSelection(
  uid: string,
  activeZoneId: string | null
): Promise<void> {
  const safeZoneId = activeZoneId ? sanitizeId(activeZoneId) : '';
  const userPath = `users/${uid}`;
  const ref = doc(db, 'users', uid);

  void callAuthenticatedCloudSqlApi('/api/users/sync', 'POST', {
    ...(safeZoneId ? { activeZoneId: safeZoneId } : { clearActiveZone: true }),
  });

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        uid,
        displayName: sanitizeStr(auth.currentUser?.displayName, 120, 'GeoAgri User'),
        photoURL: sanitizeStr(auth.currentUser?.photoURL, 512, ''),
        preferredLanguage: 'ar',
        activeZoneId: safeZoneId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        activeZoneId: safeZoneId,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, userPath);
  }
}

export async function saveUserZoneToFirestore(
  uid: string,
  zone: UserStudyZone
): Promise<void> {
  const safeZoneId = sanitizeId(zone.id);
  const docPath = `users/${uid}/zones/${safeZoneId}`;
  const ref = doc(db, 'users', uid, 'zones', safeZoneId);

  const boundedVertices = (zone.vertices || []).slice(0, 100).map((v) => ({
    lat: Number(v.lat),
    lng: Number(v.lng),
  }));

  const safeCustomTexture = sanitizeStr(zone.soil?.customTextureLabel, 120, '');
  const safeCustomIrrigation = sanitizeStr(zone.soil?.customIrrigationLabel, 120, '');
  const safeCustomCrop = sanitizeStr(zone.customCropLabel, 120, '');

  const safeSoil: SoilProfile = {
    texture: sanitizeSoilTexture(zone.soil?.texture),
    salinityEC: Number(zone.soil?.salinityEC ?? 1.25),
    ph: Number(zone.soil?.ph ?? 7.4),
    organicMatterPct: Number(zone.soil?.organicMatterPct ?? 2.3),
    irrigation: sanitizeSoilIrrigation(zone.soil?.irrigation),
    groundwaterDepthM: Number(zone.soil?.groundwaterDepthM ?? 1.6),
    ...(safeCustomTexture ? { customTextureLabel: safeCustomTexture } : {}),
    ...(safeCustomIrrigation ? { customIrrigationLabel: safeCustomIrrigation } : {}),
  };

  const payload: Record<string, unknown> = {
    id: safeZoneId,
    ownerUid: uid,
    nameAr: sanitizeStr(zone.nameAr, 120, 'Study Zone'),
    nameEn: sanitizeStr(zone.nameEn, 120, 'Study Zone'),
    categoryAr: sanitizeStr(zone.categoryAr, 120, 'حقل محاصيل'),
    categoryEn: sanitizeStr(zone.categoryEn, 120, 'Crop Plot'),
    color: sanitizeStr(zone.color, 24, '#10b981'),
    vertices: boundedVertices,
    centroid: {
      lat: Number(zone.centroid?.lat ?? 30.0),
      lng: Number(zone.centroid?.lng ?? 31.0),
    },
    area: stripUndefinedDeep(zone.area || {}),
    soil: safeSoil,
    currentCropId: sanitizeStr(zone.currentCropId, 64, 'wheat'),
    ...(safeCustomCrop ? { customCropLabel: safeCustomCrop } : {}),
    plantingDateISO: sanitizeStr(zone.plantingDateISO, 32, '2026-10-10'),
    subZones: stripUndefinedDeep((zone.subZones || []).slice(0, 6)),
    farmAverages: stripUndefinedDeep(zone.farmAverages || {}),
    weatherSource: sanitizeStr(zone.weatherSource, 40, 'agro-simulation-fallback'),
    nasaSource: sanitizeStr(zone.nasaSource, 40, 'nasa-power-calibrated-cache'),
    radiometricSource: sanitizeStr(zone.radiometricSource, 50, 'agro-coupled-model'),
    customRotationPlans: stripUndefinedDeep(zone.customRotationPlans || {}),
    updatedAt: serverTimestamp(),
  };

  void callAuthenticatedCloudSqlApi('/api/zones', 'POST', {
    zone: {
      ...payload,
      updatedAt: new Date().toISOString(),
    },
  });

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        ...payload,
        createdAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, payload);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function deleteUserZoneFromFirestore(
  uid: string,
  zoneId: string
): Promise<void> {
  const safeZoneId = sanitizeId(zoneId);
  const docPath = `users/${uid}/zones/${safeZoneId}`;
  void callAuthenticatedCloudSqlApi(`/api/zones/${encodeURIComponent(safeZoneId)}`, 'DELETE');
  try {
    await deleteDoc(doc(db, 'users', uid, 'zones', safeZoneId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

export async function clearAllUserZonesFromFirestore(
  uid: string,
  zoneIds: string[]
): Promise<void> {
  if (zoneIds.length === 0) return;
  const colPath = `users/${uid}/zones`;
  void callAuthenticatedCloudSqlApi('/api/zones', 'DELETE');
  try {
    const batch = writeBatch(db);
    for (const zid of zoneIds) {
      batch.delete(doc(db, 'users', uid, 'zones', sanitizeId(zid)));
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, colPath);
  }
}

function hydrateStudyZoneFromDoc(raw: Record<string, unknown>): UserStudyZone {
  const vertices = Array.isArray(raw.vertices)
    ? (raw.vertices as Array<{ lat: number; lng: number }>)
    : [];
  const centroid = (raw.centroid as { lat: number; lng: number }) || { lat: 30.0, lng: 31.0 };
  const soil = raw.soil as SoilProfile;
  const forecast14: DailyWeatherPoint[] = buildFallback14DayForecast(centroid);

  const hydratedSpatial =
    vertices.length >= 3
      ? generateSubZonesAndGrid(vertices, soil, PRESET_FARM_ZONES[0].baseSpectralBands, {
          sm0to7Pct: forecast14[0]?.soilMoisture0to7Pct ?? 26,
          sm7to28Pct: forecast14[0]?.soilMoisture7to28Pct ?? 31,
        })
      : { subZones: [], gridCells: [], farmAverages: raw.farmAverages };

  const createdRaw = raw.createdAt as { toDate?: () => Date } | string | undefined;
  const createdISO =
    createdRaw && typeof createdRaw === 'object' && typeof createdRaw.toDate === 'function'
      ? createdRaw.toDate().toISOString()
      : typeof createdRaw === 'string'
      ? createdRaw
      : new Date().toISOString();

  return {
    id: String(raw.id),
    ownerUid: typeof raw.ownerUid === 'string' ? raw.ownerUid : undefined,
    nameAr: String(raw.nameAr || 'Study Zone'),
    nameEn: String(raw.nameEn || 'Study Zone'),
    categoryAr: String(raw.categoryAr || ''),
    categoryEn: String(raw.categoryEn || ''),
    color: String(raw.color || '#10b981'),
    createdAt: createdISO,
    vertices,
    centroid,
    area: raw.area as UserStudyZone['area'],
    soil,
    currentCropId: String(raw.currentCropId || 'wheat'),
    customCropLabel:
      typeof raw.customCropLabel === 'string' && raw.customCropLabel.trim()
        ? raw.customCropLabel
        : undefined,
    plantingDateISO: String(raw.plantingDateISO || '2026-10-10'),
    subZones:
      Array.isArray(raw.subZones) && raw.subZones.length > 0
        ? (raw.subZones as UserStudyZone['subZones'])
        : (hydratedSpatial.subZones as UserStudyZone['subZones']),
    gridCells: hydratedSpatial.gridCells,
    farmAverages:
      (raw.farmAverages as UserStudyZone['farmAverages']) ||
      (hydratedSpatial.farmAverages as UserStudyZone['farmAverages']),
    forecast14,
    weatherSource:
      (raw.weatherSource as UserStudyZone['weatherSource']) || 'agro-simulation-fallback',
    nasaSource:
      (raw.nasaSource as UserStudyZone['nasaSource']) || 'nasa-power-calibrated-cache',
    customRotationPlans: raw.customRotationPlans as UserStudyZone['customRotationPlans'],
    radiometricSource:
      (raw.radiometricSource as UserStudyZone['radiometricSource']) || 'agro-coupled-model',
  };
}

export function subscribeToUserZones(
  uid: string,
  onZones: (zones: UserStudyZone[]) => void,
  onError?: (err: unknown) => void,
  options?: { getDeletedZoneIds?: () => Iterable<string> }
): () => void {
  const path = `users/${uid}/zones`;
  const zonesQuery = query(collection(db, 'users', uid, 'zones'), where('ownerUid', '==', uid));
  let isCancelled = false;
  let sqlZones: UserStudyZone[] = [];
  let firestoreZones: UserStudyZone[] = [];
  let hasSqlResponded = false;
  let hasFirestoreResponded = false;

  const emitMergedZones = () => {
    if (isCancelled || (!hasSqlResponded && !hasFirestoreResponded)) return;
    const deletedIds = options?.getDeletedZoneIds?.();
    const merged = mergeStudyZonesAdditively([sqlZones, firestoreZones], deletedIds);
    onZones(merged);
  };

  void callAuthenticatedCloudSqlApi('/api/zones', 'GET').then(async (res) => {
    if (!res || !res.ok || isCancelled) return;
    try {
      const data = (await res.json()) as {
        zones?: Array<{ payloadJson?: string; createdAt?: string }>;
      };
      if (!Array.isArray(data.zones) || isCancelled) return;
      const sqlHydrated: UserStudyZone[] = [];
      for (const row of data.zones) {
        if (!row.payloadJson) continue;
        try {
          const parsedRaw = JSON.parse(row.payloadJson) as Record<string, unknown>;
          if (row.createdAt && !parsedRaw.createdAt) {
            parsedRaw.createdAt = row.createdAt;
          }
          sqlHydrated.push(hydrateStudyZoneFromDoc(parsedRaw));
        } catch {
          // ignore malformed row
        }
      }
      hasSqlResponded = true;
      sqlZones = sqlHydrated;
      emitMergedZones();
    } catch {
      // ignore fallback error
    }
  });

  const unsubscribeFirestore = onSnapshot(
    zonesQuery,
    (snapshot) => {
      if (isCancelled) return;
      hasFirestoreResponded = true;
      firestoreZones = snapshot.docs
        .map((d) => hydrateStudyZoneFromDoc(d.data() as Record<string, unknown>))
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      emitMergedZones();
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError?.(wrapped);
      }
    }
  );

  return () => {
    isCancelled = true;
    unsubscribeFirestore();
  };
}

