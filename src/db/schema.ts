import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  displayName: text('display_name'),
  photoUrl: text('photo_url'),
  preferredLanguage: text('preferred_language').default('ar').notNull(),
  activeZoneId: text('active_zone_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const studyZones = pgTable('study_zones', {
  id: serial('id').primaryKey(),
  zoneKey: text('zone_key').notNull().unique(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  ownerUid: text('owner_uid').notNull(),
  zoneId: text('zone_id').notNull(),
  nameAr: text('name_ar').notNull(),
  nameEn: text('name_en').notNull(),
  categoryAr: text('category_ar').notNull(),
  categoryEn: text('category_en').notNull(),
  color: text('color').notNull(),
  currentCropId: text('current_crop_id').notNull(),
  customCropLabel: text('custom_crop_label'),
  plantingDateIso: text('planting_date_iso').notNull(),
  payloadJson: text('payload_json').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  studyZones: many(studyZones),
}));

export const studyZonesRelations = relations(studyZones, ({ one }) => ({
  owner: one(users, {
    fields: [studyZones.userId],
    references: [users.id],
  }),
}));
