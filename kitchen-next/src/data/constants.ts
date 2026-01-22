// "use client" not required here; this module only exports data.

// Map facade selection -> GLB url in /public
export const MODEL_BY_FACADE = {
  graphite: "/assets/kitchen/kitchen-8.glb",
  wood: "/assets/kitchen/kitchen-4.glb",
  white: "/assets/kitchen/kitchen-7.glb",
};

export const CARCASS_OPTIONS = [
  { id: "carc_white", label: "White", value: "#e9ecef" },
  { id: "carc_light", label: "Light grey", value: "#dcdfe3" },
  { id: "carc_graphite", label: "Graphite", value: "#3c4043" },
  { id: "carc_antr", label: "Anthracite", value: "#2b2f33" },
  { id: "carc_black", label: "Black", value: "#1b1b1b" },
];

export const FACADE_OPTIONS = [
  { id: "graphite", label: "Graphite", value: "#3c4043" },
  { id: "snow", label: "Snow", value: "#f5f5f5" },
  { id: "navy", label: "Navy", value: "#22324b" },
  { id: "forest", label: "Forest", value: "#2f4f4f" },
  { id: "wine", label: "Wine", value: "#6b2336" },
  { id: "oak", label: "Oak veneer", value: "/assets/textures/wood_d.jpg" },
  { id: "concrete", label: "Concrete matte", value: "/assets/textures/marble_d.jpg" },
  { id: "wood", label: "Wood texture", value: "/assets/textures/wood_d.jpg" },
];

export const COUNTERTOPS = [
  { id: "white", name: "White Quartz", hex: "#efefef" },
  { id: "oak", name: "Oak", hex: "#caa472" },
  { id: "slate", name: "Dark Slate", hex: "#222629" },
];

export const COUNTERTOP_SWATCHES = COUNTERTOPS.map((c) => ({
  id: c.id,
  label: c.name,
  value: c.hex,
}));

