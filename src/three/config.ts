export type Vector3Tuple = [number, number, number];
export type ProductKey = "epee" | "mask";
export interface ProductConfig {
  enabled: boolean;
  modelPath: string | null;
  posterPath: string | null;
  posterMediaId: string | null;
  scale: number;
  position: Vector3Tuple;
  rotation: Vector3Tuple;
  cameraPosition: Vector3Tuple;
  mobileCameraPosition: Vector3Tuple;
  rotationSpeed: number;
  lighting: {
    ambient: number;
    key: number;
    fill: number;
    exposure: number;
    background: string;
  };
  title: string;
  description: string;
  theme: "dark" | "light";
}

// Real Blender assets only. No model requests, viewer UI or Three.js downloads
// occur while these switches are off and no approved poster is configured.
export const products: Record<ProductKey, ProductConfig> = {
  epee: {
    enabled: false,
    modelPath: null,
    posterPath: "images/epee-poster.webp",
    posterMediaId: "equipment",
    scale: 1,
    position: [0, 0, 0],
    rotation: [0, 0, -0.4],
    cameraPosition: [0, 0.25, 2.6],
    mobileCameraPosition: [0, 0.1, 3.6],
    rotationSpeed: 0.12,
    lighting: {
      ambient: 1.4,
      key: 4.5,
      fill: 2,
      exposure: 1,
      background: "#101114",
    },
    title: "Шпага. Точность в каждой детали.",
    description:
      "Глубокая чашеобразная гарда защищает кисть. Пистолетная или французская рукоятка помогает управлять клинком. Точность начинается с деталей.",
    theme: "dark",
  },
  mask: {
    enabled: false,
    modelPath: null,
    posterPath: null,
    posterMediaId: null,
    scale: 1,
    position: [0, 0, 0],
    rotation: [0, -0.25, 0],
    cameraPosition: [0, 0.15, 1.8],
    mobileCameraPosition: [0, 0.1, 2.4],
    rotationSpeed: 0.1,
    lighting: {
      ambient: 1.8,
      key: 3.5,
      fill: 2,
      exposure: 1,
      background: "#f5f5f7",
    },
    title: "Маска. Внимание к защите.",
    description: "Сетка, форма и конструкция защитной экипировки — в деталях.",
    theme: "light",
  },
};
