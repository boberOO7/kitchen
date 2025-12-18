"use client";

import React from "react";

function makeChipStyle(opt) {
  const v = opt?.value;

  // Simple hex color
  if (typeof v === "string" && v.trim().startsWith("#")) {
    return { background: v };
  }

  // Image URL
  if (typeof v === "string") {
    return { backgroundImage: `url(${v})`, backgroundSize: "cover", backgroundPosition: "center" };
  }

  // Object with base texture
  if (v && typeof v === "object") {
    const thumb = opt.thumb || v.base || v.diffuse || v.albedo || v.colorMap || null;
    if (typeof thumb === "string") {
      if (thumb.trim().startsWith("#")) {
        return { background: thumb };
      }
      return { backgroundImage: `url(${thumb})`, backgroundSize: "cover", backgroundPosition: "center" };
    }
  }

  // Fallback gradient
  return { background: "linear-gradient(135deg, #e8e8e8 0%, #f5f5f5 50%, #e0e0e0 100%)" };
}

export default function SwatchPicker({ options, value, onChange }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map((o) => {
        const selected = value === o.id;
        return (
          <button
            key={o.id}
            className={`group flex flex-col items-center gap-2 border p-2.5 transition ${
              selected
                ? "border-[var(--sky-accent)] bg-[var(--sky-bg-alt)]"
                : "border-[var(--sky-border)] bg-[var(--sky-card-bg)] hover:border-[var(--sky-muted2)]"
            }`}
            style={{ borderRadius: 2 }}
            onClick={() => onChange(o.id)}
            title={o.label}
            type="button"
          >
            <span
              className="aspect-[4/3] w-full"
              style={{
                ...makeChipStyle(o),
                borderRadius: 1,
                boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.06)",
              }}
            />
            <span
              className={`text-center text-[11px] leading-tight ${
                selected ? "font-medium text-[var(--sky-fg)]" : "text-[var(--sky-muted)]"
              }`}
            >
              {o.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
