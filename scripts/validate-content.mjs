import { readFileSync, existsSync } from "node:fs";
import { resolve, sep } from "node:path";
import assert from "node:assert/strict";

const read = (name) =>
  JSON.parse(readFileSync(`src/data/${name}.json`, "utf8"));
const sourceIds = new Set(read("sources").map((s) => s.id));
const media = read("media");
const mediaById = new Map(media.map((m) => [m.id, m]));
const https = (value) => {
  const url = new URL(value);
  assert.equal(url.protocol, "https:", "Sources must use HTTPS");
};
const validDate = (value) => {
  assert.match(value, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(
    new Date(value).toISOString().slice(0, 10),
    value,
    "Invalid calendar date",
  );
};
const unique = (items) =>
  assert.equal(
    new Set(items.map((i) => i.id)).size,
    items.length,
    "IDs must be unique",
  );
const localFile = (file) => {
  assert.equal(typeof file, "string");
  const root = resolve("public");
  const target = resolve(root, file);
  assert.ok(target.startsWith(root + sep), "Media must remain under public/");
  assert.ok(existsSync(target), `Missing media: ${file}`);
};
for (const m of media) {
  assert.equal(
    m.permissionStatus,
    "approved",
    "Media publication must be approved",
  );
  assert.ok(
    ["approved", "not-applicable"].includes(m.minorsPermission),
    "Check consent for images of minors",
  );
  for (const key of ["alt", "caption", "author", "license"])
    assert.ok(m[key]?.trim(), `Missing media ${key}`);
  assert.equal(
    m.weapon,
    "epee",
    "Published photos/videos must be verified epee fencing",
  );
  assert.ok(m.weaponVerification?.trim(), "Explain how epee was identified");
  assert.ok(
    m.rightsReference?.trim(),
    "Reference the permission or license record; never publish private consent forms",
  );
  assert.ok(["image", "video"].includes(m.type));
  https(m.sourceUrl);
  localFile(m.src);
  if (m.type === "image") {
    assert.ok(Number.isInteger(m.width) && m.width > 0 && Number.isInteger(m.height) && m.height > 0, "Image dimensions required");
    assert.ok(Array.isArray(m.variants) && m.variants.length, "Responsive image variants required");
    for (const variant of m.variants) {
      localFile(variant.src);
      assert.ok(Number.isInteger(variant.width) && variant.width > 0, "Valid srcset width required");
    }
    https(m.licenseUrl);
    assert.ok(m.changes?.trim(), "Describe changes for attribution");
    assert.ok(sourceIds.has(m.sourceId), "Media source must be registered");
  }
  if (m.type === "video") {
    assert.ok(m.poster, "Video requires a poster");
    localFile(m.poster);
  }
}
unique(media);
for (const type of ["news", "events"]) {
  const items = read(type);
  unique(items);
  for (const item of items) {
    validDate(item.date);
    https(item.sourceUrl);
    assert.ok(item.title?.trim() && item.summary?.trim());
    if (type === "news") assert.ok(item.category?.trim());
    else {
      assert.ok(item.location?.trim());
      if (item.endDate) {
        validDate(item.endDate);
        assert.ok(item.endDate >= item.date);
      }
    }
    if (item.image) {
      const approved = mediaById.get(item.mediaId);
      assert.ok(
        approved && approved.src === item.image,
        "News photo must reference approved media",
      );
      assert.ok(item.imageAlt?.trim());
      localFile(item.image);
    }
  }
}
const federation = read("federation");
assert.ok(sourceIds.has(federation.sourceId));
for (const coach of federation.coaches) {
  assert.ok(sourceIds.has(coach.sourceId));
  assert.match(coach.phoneHref, /^\+7\d{10}$/);
  if (coach.photo)
    assert.ok(
      media.some(
        (m) => m.src === coach.photo && m.permissionStatus === "approved",
      ),
      "Coach photo must be approved media",
    );
}
console.log(
  `Content checks passed: ${read("news").length} news, ${read("events").length} events, ${media.length} approved media; source references and contact format valid.`,
);
