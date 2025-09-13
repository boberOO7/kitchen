export const CARCASS_OPTIONS = [
  { id: "carc_white",   label: "White",        value: "#e9ecef" },
  { id: "carc_light",   label: "Light grey",   value: "#dcdfe3" },
  { id: "carc_graphite",label: "Graphite",     value: "#3c4043" },
  { id: "carc_antr",    label: "Anthracite",   value: "#2b2f33" },
  { id: "carc_black",   label: "Black",        value: "#1b1b1b" },
];

// Фасади: звичайні кольори або шлях до зображення (PNG/JPG)
export const FACADE_OPTIONS = [
  { id: "graphite", label: "Graphite",  value: "#3c4043" },
  { id: "snow",     label: "Snow",      value: "#f5f5f5" },
  { id: "navy",     label: "Navy",      value: "#22324b" },
  { id: "forest",   label: "Forest",    value: "#2f4f4f" },
  { id: "wine",     label: "Wine",      value: "#6b2336" },
  { id: "oak",      label: "Oak veneer",     value: "/textures/oak.jpg" },
  { id: "concrete", label: "Concrete matte", value: "/textures/concrete.jpg" },
  { id: "wood",     label: "Wood texture",    value: "/textures/wood.jpg" },
];

export const COUNTERTOPS = [
  { id: "white", name: "White Quartz", hex: "#efefef", priceMultiplier: 1.0 },
  { id: "oak",   name: "Oak",          hex: "#caa472", priceMultiplier: 0.9 },
  { id: "slate", name: "Dark Slate",   hex: "#222629", priceMultiplier: 1.1 },
];

// допоміжний набір «плиток» для стільниць (щоб працювати зі SwatchPicker)
export const COUNTERTOP_SWATCHES = COUNTERTOPS.map(c => ({
  id: c.id,
  label: c.name,
  value: c.hex,   // колір як у фасадів
}));

export const MODULE_CATALOG = [
  { id: "base60",   name: "Base 60 cm",     width: 0.6, depth: 0.6, height: 0.9, price: 220 },
  { id: "drawer40", name: "Drawer 40 cm",   width: 0.4, depth: 0.6, height: 0.9, price: 260 },
  { id: "sink80",   name: "Sink 80 cm",     width: 0.8, depth: 0.6, height: 0.9, price: 300, role: "sink" },
  { id: "dish60",   name: "Dishwasher 60",  width: 0.6, depth: 0.6, height: 0.9, price: 180 },
  { id: "hob60",    name: "Hob 60 cm",      width: 0.6, depth: 0.6, height: 0.9, price: 240, role: "hob" },
  { id: "filler",   name: "Filler (auto)",  width: 0.05, depth: 0.6, height: 0.9, price: 40, isFiller: true },
];

export const UPPER_PRESET = { height: 0.72, depth: 0.35 };

export const TOP_THICK = 0.04;
export const CUT_W = 0.54;
export const CUT_D = 0.44;

// 1x1 прозорий PNG – щоб useTexture завжди був усередині Canvas
export const ONE_PX =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/edn9aUAAAAASUVORK5CYII=";
