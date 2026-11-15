# GeoAgri Pro Firestore Security Specification

## 1. Data Invariants
1. **Default Deny**: No path outside `/users/{userId}` and `/users/{userId}/zones/{zoneId}` may be read or written by any client.
2. **Identity & Ownership**:
   - All reads, lists, creates, updates, and deletes inside `/users/{userId}` and `/users/{userId}/zones/{zoneId}` strictly require an authenticated, email-verified user whose `request.auth.uid == userId`.
   - `uid` in `/users/{userId}` and `ownerUid` in `/users/{userId}/zones/{zoneId}` MUST equal `request.auth.uid` on create and remain strictly immutable on update.
3. **Path ID Poisoning Guard**: Every document path variable (`userId`, `zoneId`) must pass `isValidId()` (`<= 128` chars, alphanumeric + `_`/`-`).
4. **Schema Strictness (Zero Shadow Fields)**: Both `create` (`hasAll` + `hasOnly`) and `update` (`affectedKeys().hasOnly(...)`) reject unapproved keys and enforce bounded string/list lengths.
5. **Temporal Integrity**: `createdAt` must equal `request.time` on create and stay immutable on update; `updatedAt` must equal `request.time` on every create and update.
6. **Master Gate Relational Check**: Writes to `/users/{userId}/zones/{zoneId}` verify parent `/users/{userId}` exists or is created synchronously cleanly under the same authenticated owner (`request.auth.uid == userId`).
7. **List Query Enforcement**: `allow list` on `/users/{userId}/zones/{zoneId}` explicitly requires `resource.data.ownerUid == request.auth.uid`, preventing any client-delegated blanket queries.

---

## 2. The "Dirty Dozen" Attack Payloads (All Must Return `PERMISSION_DENIED`)

1. **Unauthenticated Zone Read/Write**: Anonymous caller attempts `get` or `create` on `/users/u1/zones/zone-1` (`request.auth == null`).
2. **Unverified Email Spoofing**: Authenticated user with `email_verified: false` attempts to write a zone document.
3. **Cross-Tenant Read/List Hijack**: Signed-in user `u2` attempts `get`, `list`, or `delete` on `/users/u1/zones/zone-1`.
4. **Owner UID Spoofing**: Signed-in user `u1` creates `/users/u1/zones/z1` with `{ ownerUid: "u2", ... }`.
5. **Shadow / Privilege Escalation Field**: Signed-in user `u1` writes `{ isAdmin: true, role: "superadmin" }` into `/users/u1` or `/users/u1/zones/z1`.
6. **Malicious Path ID Poisoning**: Signed-in user `u1` creates zone with invalid 200-char ID or path characters `../admin`.
7. **Oversized String DoS / Denial-of-Wallet**: Signed-in user `u1` sets `nameAr` or `customCropLabel` to a 5,000-character string.
8. **Empty / Non-Polygon Vertices Injection**: User creates zone with `vertices: []` (< 3 points) or > 100 vertices or non-map vertex item.
9. **Fake Client Timestamp Backdating**: User submits `createdAt: "1999-01-01T00:00:00Z"` instead of server `request.time`.
10. **Immutable Field Mutation on Update**: User attempts to mutate `ownerUid`, `id`, or `createdAt` during an `updateDoc` operation.
11. **Missing Required Fields on Create**: User creates a zone omitting `soil`, `farmAverages`, or `customRotationPlans`.
12. **Blanket User Profile Collection Scraping**: Signed-in user attempts `list` on `/users` to enumerate other users' display names or UIDs.
