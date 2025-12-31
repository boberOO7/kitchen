// Shared options for the 3D configurator UI + URL serialization.

export const FACADE_SETS = [
  { id: "wood", label: "Дуб · глянець", value: { base: "/assets/textures/wood_d.jpg" } },
  { id: "graphite", label: "Дуб · сірий", value: { base: "/assets/textures/wood_r1.jpg" } },
  { id: "white", label: "Білий · мат", value: { base: "/assets/textures/white_d.jpg" } },
];

export const TOP_SETS = [
  { id: "quartz_white", label: "Білий кварц", value: "#efefef" },
  { id: "dark_slate", label: "Темний сланець", value: "#222629" },
];

export const CARCASS_SETS = [
  { id: "carc_white", label: "Білий", value: "#e9ecef" },
  { id: "carc_grey", label: "Світло-сірий", value: "#dcdfe3" },
  { id: "carc_graph", label: "Графіт", value: "#3c4043" },
];

export const CONFIG_DEFAULTS = {
  facadeId: FACADE_SETS[1].id, // graphite
  topId: TOP_SETS[0].id, // quartz_white
  carcassId: CARCASS_SETS[0].id, // carc_white
};

export const CONFIG_ALLOWED = {
  facadeId: new Set(FACADE_SETS.map((x) => x.id)),
  topId: new Set(TOP_SETS.map((x) => x.id)),
  carcassId: new Set(CARCASS_SETS.map((x) => x.id)),
};


