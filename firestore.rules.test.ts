import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
const blueprintPath = path.resolve(process.cwd(), 'firebase-blueprint.json');
const rulesText = fs.readFileSync(rulesPath, 'utf8');
const blueprint = JSON.parse(fs.readFileSync(blueprintPath, 'utf8'));

test('Firestore Rules enforce Default-Deny catch-all and Pillar invariants across the Dirty Dozen', () => {
  // 1. Default Deny at root
  assert.match(rulesText, /rules_version\s*=\s*'2'/);
  assert.match(rulesText, /match \/\{document=\*\*\} \{\s*allow read, write: if false;\s*\}/);

  // 2. Email verification & owner check (rejects unauthenticated & email_verified=false)
  assert.match(rulesText, /request\.auth\.token\.email_verified\s*==\s*true/);
  assert.match(rulesText, /request\.auth\.uid\s*==\s*userId/);

  // 3. No blanket /users list scraping
  assert.match(rulesText, /match \/users\/\{userId\}[\s\S]*allow list:\s*if false;/);

  // 4. Query Enforcer on zones list (evaluates existing resource.data.ownerUid)
  assert.match(rulesText, /allow list:\s*if isValidId\(userId\) && isOwner\(userId\)[\s\S]*existing\(\)\.ownerUid == request\.auth\.uid/);

  // 5. ID Poisoning Regex Guard
  assert.match(rulesText, /function isValidId\(id\)[\s\S]*?id\.size\(\)\s*<=\s*128[\s\S]*?id\.matches\(/);

  // 6. Strict Create Keys & Update affectedKeys().hasOnly() + Immutability
  assert.match(rulesText, /isValidStudyZoneCreate/);
  assert.match(rulesText, /isValidStudyZoneUpdate/);
  assert.match(rulesText, /nextData\.ownerUid\s*==\s*prevData\.ownerUid/);
  assert.match(rulesText, /nextData\.createdAt\s*==\s*prevData\.createdAt/);
  assert.match(rulesText, /nextData\.updatedAt\s*==\s*request\.time/);

  // 7. Bounded array & string checks on vertices / custom labels
  assert.match(rulesText, /data\.vertices\.size\(\)\s*>=\s*3\s*&&\s*data\.vertices\.size\(\)\s*<=\s*100/);
  assert.match(rulesText, /data\.customCropLabel\.size\(\)\s*<=\s*120/);
  assert.match(rulesText, /data\.soil\.customTextureLabel\.size\(\)\s*<=\s*120/);

  // 8. Blueprint matches collections protected in rules
  assert.ok(blueprint.firestore['/users/{userId}']);
  assert.ok(blueprint.firestore['/users/{userId}/zones/{zoneId}']);
});
