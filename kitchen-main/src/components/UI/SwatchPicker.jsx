import React from "react";

function makeChipStyle(opt) {
  const v = opt?.value;

  // 1) Рядок: #hex або url
  if (typeof v === "string") {
    if (v.trim().startsWith("#")) return { background: v };
    return { backgroundImage: `url(${v})` };
  }

  // 2) Обʼєкт пресету: використовуємо opt.thumb або base/diffuse/albedo
  if (v && typeof v === "object") {
    const thumb =
      opt.thumb ||
      v.base || v.diffuse || v.albedo || v.colorMap || null;

    if (typeof thumb === "string") {
      if (thumb.trim().startsWith("#")) return { background: thumb };
      return { backgroundImage: `url(${thumb})` };
    }
  }

  // 3) Фолбек — сірий плейсхолдер
  return {
    background:
      "linear-gradient(135deg, #eceff3 0%, #f7f8fa 60%, #e8edf3 100%)",
  };
}

export default function SwatchPicker({ options, value, onChange }) {
  return (
    <div className="swatch-grid">
      {options.map((o) => (
        <button
          key={o.id}
          className={`swatch ${value === o.id ? "selected" : ""}`}
          onClick={() => onChange(o.id)}
          title={o.label}
          type="button"
        >
          <span className="chip" style={makeChipStyle(o)} />
          <span className="cap">{o.label}</span>
        </button>
      ))}
    </div>
  );
}
