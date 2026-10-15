import { products } from "../src/three/config.ts";
import { readFileSync, existsSync } from "node:fs";
import { resolve, sep } from "node:path";
import assert from "node:assert/strict";
const media = JSON.parse(readFileSync("src/data/media.json", "utf8"));
const local = (path) => {
  const root = resolve("public"),
    target = resolve(root, path);
  assert.ok(
    target.startsWith(root + sep) && existsSync(target),
    `Missing or unsafe asset: ${path}`,
  );
};
for (const [key, config] of Object.entries(products)) {
  assert.ok(Number.isFinite(config.scale) && config.scale > 0);
  assert.ok(
    Number.isFinite(config.rotationSpeed) &&
      config.rotationSpeed >= 0 &&
      config.rotationSpeed <= 0.5,
  );
  for (const vector of [
    config.position,
    config.rotation,
    config.cameraPosition,
    config.mobileCameraPosition,
  ])
    assert.ok(vector.length === 3 && vector.every(Number.isFinite));
  if (config.posterPath) {
    local(config.posterPath);
    assert.ok(
      media.some(
        (m) =>
          m.id === config.posterMediaId &&
          m.src === config.posterPath &&
          m.permissionStatus === "approved",
      ),
      `${key}: poster must be approved media`,
    );
  }
  if (config.enabled) {
    assert.ok(
      config.modelPath && config.posterPath && config.posterMediaId,
      `${key}: enabling requires model and approved poster`,
    );
    assert.match(config.modelPath, /\.(glb|gltf)$/);
    local(config.modelPath);
  }
}
console.log(
  "3D configuration valid. Enabled models:",
  Object.values(products).filter((p) => p.enabled).length,
);
