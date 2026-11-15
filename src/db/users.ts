import { and, asc, eq } from 'drizzle-orm';
import { db, isCloudSqlConfigured } from './index.ts';
import { studyZones, users } from './schema.ts';

export interface UserProfileUpdateInput {
  displayName?: string | null;
  photoUrl?: string | null;
  preferredLanguage?: string | null;
  activeZoneId?: string | null;
}

interface FallbackUserRecord {
  id: number;
  uid: string;
  email: string;
  displayName: string | null;
  photoUrl: string | null;
  preferredLanguage: string;
  activeZoneId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface FallbackStudyZoneRecord {
  id: number;
  zoneKey: string;
  userId: number;
  ownerUid: string;
  zoneId: string;
  nameAr: string;
  nameEn: string;
  categoryAr: string;
  categoryEn: string;
  color: string;
  currentCropId: string;
  customCropLabel: string | null;
  plantingDateIso: string;
  payloadJson: string;
  createdAt: Date;
  updatedAt: Date;
}

let nextFallbackUserId = 1;
let nextFallbackZoneId = 1;
let sqlRuntimeUnreachable = false;
const fallbackUsersByUid = new Map<string, FallbackUserRecord>();
const fallbackZonesByKey = new Map<string, FallbackStudyZoneRecord>();

function shouldUseFallbackStore(): boolean {
  return !isCloudSqlConfigured() || sqlRuntimeUnreachable;
}

function upsertFallbackUser(
  uid: string,
  email: string,
  profile?: UserProfileUpdateInput
): FallbackUserRecord {
  const safeEmail = email || `${uid}@geoagri.local`;
  const now = new Date();
  const existing = fallbackUsersByUid.get(uid);
  if (existing) {
    const updated: FallbackUserRecord = {
      ...existing,
      email: safeEmail,
      displayName:
        profile?.displayName !== undefined ? profile.displayName : existing.displayName,
      photoUrl: profile?.photoUrl !== undefined ? profile.photoUrl : existing.photoUrl,
      preferredLanguage: profile?.preferredLanguage || existing.preferredLanguage || 'ar',
      activeZoneId:
        profile?.activeZoneId !== undefined ? profile.activeZoneId : existing.activeZoneId,
      updatedAt: now,
    };
    fallbackUsersByUid.set(uid, updated);
    return updated;
  }

  const created: FallbackUserRecord = {
    id: nextFallbackUserId++,
    uid,
    email: safeEmail,
    displayName: profile?.displayName ?? null,
    photoUrl: profile?.photoUrl ?? null,
    preferredLanguage: profile?.preferredLanguage || 'ar',
    activeZoneId: profile?.activeZoneId ?? null,
    createdAt: now,
    updatedAt: now,
  };
  fallbackUsersByUid.set(uid, created);
  return created;
}

export async function getOrCreateUser(
  uid: string,
  email: string,
  profile?: UserProfileUpdateInput
) {
  if (shouldUseFallbackStore()) {
    return upsertFallbackUser(uid, email, profile);
  }

  try {
    const safeEmail = email || `${uid}@geoagri.local`;
    const updateFields: Record<string, unknown> = {
      email: safeEmail,
      updatedAt: new Date(),
    };
    if (profile?.displayName !== undefined) {
      updateFields.displayName = profile.displayName;
    }
    if (profile?.photoUrl !== undefined) {
      updateFields.photoUrl = profile.photoUrl;
    }
    if (profile?.preferredLanguage) {
      updateFields.preferredLanguage = profile.preferredLanguage;
    }
    if (profile?.activeZoneId !== undefined) {
      updateFields.activeZoneId = profile.activeZoneId;
    }

    const result = await db
      .insert(users)
      .values({
        uid,
        email: safeEmail,
        displayName: profile?.displayName ?? null,
        photoUrl: profile?.photoUrl ?? null,
        preferredLanguage: profile?.preferredLanguage || 'ar',
        activeZoneId: profile?.activeZoneId ?? null,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: updateFields,
      })
      .returning();

    return result[0];
  } catch {
    sqlRuntimeUnreachable = true;
    return upsertFallbackUser(uid, email, profile);
  }
}

export async function getUserStudyZonesByUid(uid: string) {
  if (shouldUseFallbackStore()) {
    return Array.from(fallbackZonesByKey.values())
      .filter((z) => z.ownerUid === uid)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  try {
    const rows = await db
      .select({
        id: studyZones.id,
        zoneId: studyZones.zoneId,
        ownerUid: studyZones.ownerUid,
        nameAr: studyZones.nameAr,
        nameEn: studyZones.nameEn,
        categoryAr: studyZones.categoryAr,
        categoryEn: studyZones.categoryEn,
        color: studyZones.color,
        currentCropId: studyZones.currentCropId,
        customCropLabel: studyZones.customCropLabel,
        plantingDateIso: studyZones.plantingDateIso,
        payloadJson: studyZones.payloadJson,
        createdAt: studyZones.createdAt,
        updatedAt: studyZones.updatedAt,
      })
      .from(studyZones)
      .innerJoin(users, eq(studyZones.userId, users.id))
      .where(eq(users.uid, uid))
      .orderBy(asc(studyZones.createdAt));

    return rows;
  } catch {
    sqlRuntimeUnreachable = true;
    return Array.from(fallbackZonesByKey.values())
      .filter((z) => z.ownerUid === uid)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
}

export interface StudyZoneUpsertInput {
  zoneId: string;
  nameAr: string;
  nameEn: string;
  categoryAr: string;
  categoryEn: string;
  color: string;
  currentCropId: string;
  customCropLabel?: string | null;
  plantingDateIso: string;
  payloadJson: string;
}

function upsertFallbackStudyZone(
  uid: string,
  email: string,
  input: StudyZoneUpsertInput
): FallbackStudyZoneRecord {
  const userRecord = upsertFallbackUser(uid, email);
  const zoneKey = `${uid}:${input.zoneId}`;
  const now = new Date();
  const existing = fallbackZonesByKey.get(zoneKey);

  const record: FallbackStudyZoneRecord = {
    id: existing ? existing.id : nextFallbackZoneId++,
    zoneKey,
    userId: userRecord.id,
    ownerUid: uid,
    zoneId: input.zoneId,
    nameAr: input.nameAr,
    nameEn: input.nameEn,
    categoryAr: input.categoryAr,
    categoryEn: input.categoryEn,
    color: input.color,
    currentCropId: input.currentCropId,
    customCropLabel: input.customCropLabel ?? null,
    plantingDateIso: input.plantingDateIso,
    payloadJson: input.payloadJson,
    createdAt: existing ? existing.createdAt : now,
    updatedAt: now,
  };
  fallbackZonesByKey.set(zoneKey, record);
  return record;
}

export async function upsertUserStudyZoneByUid(
  uid: string,
  email: string,
  input: StudyZoneUpsertInput
) {
  if (shouldUseFallbackStore()) {
    return upsertFallbackStudyZone(uid, email, input);
  }

  try {
    const userRecord = await getOrCreateUser(uid, email);
    const zoneKey = `${uid}:${input.zoneId}`;

    const result = await db
      .insert(studyZones)
      .values({
        zoneKey,
        userId: userRecord.id,
        ownerUid: uid,
        zoneId: input.zoneId,
        nameAr: input.nameAr,
        nameEn: input.nameEn,
        categoryAr: input.categoryAr,
        categoryEn: input.categoryEn,
        color: input.color,
        currentCropId: input.currentCropId,
        customCropLabel: input.customCropLabel ?? null,
        plantingDateIso: input.plantingDateIso,
        payloadJson: input.payloadJson,
      })
      .onConflictDoUpdate({
        target: studyZones.zoneKey,
        set: {
          nameAr: input.nameAr,
          nameEn: input.nameEn,
          categoryAr: input.categoryAr,
          categoryEn: input.categoryEn,
          color: input.color,
          currentCropId: input.currentCropId,
          customCropLabel: input.customCropLabel ?? null,
          plantingDateIso: input.plantingDateIso,
          payloadJson: input.payloadJson,
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  } catch {
    sqlRuntimeUnreachable = true;
    return upsertFallbackStudyZone(uid, email, input);
  }
}

export async function deleteUserStudyZoneByUid(uid: string, zoneId: string) {
  const zoneKey = `${uid}:${zoneId}`;
  fallbackZonesByKey.delete(zoneKey);
  if (shouldUseFallbackStore()) {
    return;
  }

  try {
    await db
      .delete(studyZones)
      .where(and(eq(studyZones.zoneKey, zoneKey), eq(studyZones.ownerUid, uid)));
  } catch {
    sqlRuntimeUnreachable = true;
  }
}

export async function clearAllUserStudyZonesByUid(uid: string) {
  for (const [k, z] of fallbackZonesByKey.entries()) {
    if (z.ownerUid === uid) {
      fallbackZonesByKey.delete(k);
    }
  }
  if (shouldUseFallbackStore()) {
    return;
  }

  try {
    await db.delete(studyZones).where(eq(studyZones.ownerUid, uid));
  } catch {
    sqlRuntimeUnreachable = true;
  }
}
