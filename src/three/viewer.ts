import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { ProductConfig } from "./config";

export function createViewer(root: HTMLElement, config: ProductConfig) {
  const container = root.querySelector<HTMLElement>(".product-canvas")!;
  const controlPanel = root.querySelector<HTMLElement>(".product-controls")!;
  const rotateButton = root.querySelector<HTMLButtonElement>(
    '[data-viewer-action="rotate"]',
  )!;
  const resetButton = root.querySelector<HTMLButtonElement>(
    '[data-viewer-action="reset"]',
  )!;
  const angle = root.querySelector<HTMLInputElement>("[data-viewer-angle]")!;
  const status = root.querySelector<HTMLElement>(".viewer-status")!;
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const mobile = matchMedia("(max-width: 760px)");
  const aborter = new AbortController();
  let renderer: THREE.WebGLRenderer | undefined;
  let controls: OrbitControls | undefined;
  let object: THREE.Group | undefined;
  let frame = 0,
    lastTime = 0,
    visible = true,
    disposed = false,
    rotating = !motion.matches;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(config.lighting.background);
  const camera = new THREE.PerspectiveCamera(32, 1, 0.01, 100);
  const target = new THREE.Vector3(...config.position);
  const placeCamera = () => {
    camera.position.set(
      ...(mobile.matches ? config.mobileCameraPosition : config.cameraPosition),
    );
    camera.lookAt(target);
    controls?.target.copy(target);
    controls?.update();
    render();
  };
  const disposeObject = (model: THREE.Object3D) => {
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    const textures = new Set<THREE.Texture>();
    model.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return;
      geometries.add(node.geometry);
      for (const material of Array.isArray(node.material)
        ? node.material
        : [node.material]) {
        materials.add(material);
        for (const value of Object.values(material))
          if (value instanceof THREE.Texture) textures.add(value);
      }
    });
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
    textures.forEach((t) => {
      const image = t.source?.data;
      if (image instanceof ImageBitmap) image.close();
      t.dispose();
    });
  };
  function render() {
    if (!disposed && renderer && object) renderer.render(scene, camera);
  }
  function animate(time: number) {
    frame = 0;
    if (
      disposed ||
      !object ||
      !visible ||
      document.hidden ||
      !rotating ||
      motion.matches
    )
      return;
    if (lastTime)
      object.rotation.y +=
        config.rotationSpeed * Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;
    angle.value = String(
      Math.round(
        THREE.MathUtils.euclideanModulo(
          THREE.MathUtils.radToDeg(object.rotation.y - config.rotation[1]) +
            180,
          360,
        ) - 180,
      ),
    );
    render();
    frame = requestAnimationFrame(animate);
  }
  function syncRotation() {
    cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
    const active = rotating && !motion.matches;
    rotateButton.setAttribute("aria-pressed", String(active));
    rotateButton.textContent = active
      ? "Остановить вращение"
      : "Включить вращение";
    rotateButton.disabled = motion.matches;
    if (active && visible && !document.hidden)
      frame = requestAnimationFrame(animate);
    render();
  }
  const resize = () => {
    const { width, height } = container.getBoundingClientRect();
    if (!width || !height || !renderer) return;
    renderer.setPixelRatio(
      Math.min(devicePixelRatio, mobile.matches ? 1.5 : 2),
    );
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    render();
  };
  const reset = () => {
    object?.rotation.set(...config.rotation);
    angle.value = "0";
    placeCamera();
  };
  const toggle = () => {
    rotating = !rotating;
    syncRotation();
  };
  const setAngle = () => {
    rotating = false;
    if (object)
      object.rotation.y =
        config.rotation[1] + THREE.MathUtils.degToRad(Number(angle.value));
    syncRotation();
  };
  const stopForInteraction = () => {
    rotating = false;
    syncRotation();
  };
  const onMotion = () => {
    if (motion.matches) rotating = false;
    syncRotation();
  };
  const onMobile = () => {
    placeCamera();
    resize();
  };
  const intersection = new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    syncRotation();
  });
  const resizeObserver = new ResizeObserver(resize);
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    aborter.abort();
    cancelAnimationFrame(frame);
    intersection.disconnect();
    resizeObserver.disconnect();
    document.removeEventListener("visibilitychange", syncRotation);
    motion.removeEventListener("change", onMotion);
    mobile.removeEventListener("change", onMobile);
    rotateButton.removeEventListener("click", toggle);
    resetButton.removeEventListener("click", reset);
    angle.removeEventListener("input", setAngle);
    controls?.dispose();
    if (object) disposeObject(object);
    renderer?.dispose();
    renderer?.domElement.remove();
    controlPanel.hidden = true;
    root.dataset.viewerState = "fallback";
  };
  async function load() {
    try {
      const url = new URL(
        `${import.meta.env.BASE_URL}${config.modelPath}`,
        location.origin,
      );
      const response = await fetch(url, { signal: aborter.signal });
      if (!response.ok) throw new Error("Model unavailable");
      const data = await response.arrayBuffer();
      const gltf = await new GLTFLoader().parseAsync(
        data,
        new URL(".", url).href,
      );
      if (disposed) {
        disposeObject(gltf.scene);
        return;
      }
      object = gltf.scene;
      object.scale.setScalar(config.scale);
      object.position.set(...config.position);
      object.rotation.set(...config.rotation);
      scene.add(object);
      scene.add(new THREE.AmbientLight(0xffffff, config.lighting.ambient));
      const key = new THREE.DirectionalLight(0xffffff, config.lighting.key);
      key.position.set(2, 3, 4);
      scene.add(key);
      const fill = new THREE.DirectionalLight(0xcbd8ed, config.lighting.fill);
      fill.position.set(-3, 1, -2);
      scene.add(fill);
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: "low-power",
      });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = config.lighting.exposure;
      renderer.domElement.setAttribute("aria-hidden", "true");
      container.append(renderer.domElement);
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enablePan = false;
      controls.enableDamping = false;
      controls.minDistance = 0.1;
      controls.maxDistance = 12;
      controls.addEventListener("change", render);
      controls.addEventListener("start", stopForInteraction);
      rotateButton.addEventListener("click", toggle);
      resetButton.addEventListener("click", reset);
      angle.addEventListener("input", setAngle);
      document.addEventListener("visibilitychange", syncRotation);
      motion.addEventListener("change", onMotion);
      mobile.addEventListener("change", onMobile);
      resizeObserver.observe(container);
      intersection.observe(root);
      placeCamera();
      resize();
      root.dataset.viewerState = "ready";
      controlPanel.hidden = false;
      status.textContent =
        "Интерактивный осмотр готов. Управляйте ракурсом мышью, касанием или ползунком.";
      syncRotation();
    } catch {
      if (disposed) return;
      if (object) {
        scene.remove(object);
        disposeObject(object);
        object = undefined;
      }
      renderer?.dispose();
      renderer?.domElement.remove();
      root.dataset.viewerState = "fallback";
      controlPanel.hidden = true;
      status.textContent = "Показана статичная фотография.";
    }
  }
  void load();
  return { dispose };
}
