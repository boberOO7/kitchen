import React from "react";

export default function SwatchPicker({ options, value, onChange }) {
  return (
    <div className="swatch-grid">
      {options.map(o => (
        <button
          key={o.id}
          className={`swatch ${value === o.id ? "selected" : ""}`}
          onClick={() => onChange(o.id)}
          title={o.label}
        >
          <span
            className="chip"
            style={(o.value || "").startsWith("#") ? { background:o.value } : { backgroundImage:`url(${o.value})` }}
          />
          <span className="cap">{o.label}</span>
        </button>
      ))}
    </div>
  );
}
