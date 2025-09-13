import React from "react";

export default function Price({ lineup, facadeFinish, countertop, hasUpper, hasHood }) {
  const base = lineup.reduce((s, m) => s + (m.price ?? 0), 0);
  const finishK = facadeFinish === "gloss" ? 1.12 : 1.0;
  const topK = countertop?.priceMultiplier ?? 1.0;
  const upperCost = hasUpper ? Math.round(base * 0.45) : 0;
  const hoodCost = hasHood ? 280 : 0;
  const subtotal = Math.round((base + upperCost + hoodCost) * finishK * topK);
  return (
    <div className="price">
      <div><span>Lower modules:</span><b>€{base}</b></div>
      {hasUpper && <div><span>Upper modules (est):</span><b>€{upperCost}</b></div>}
      {hasHood && <div><span>Range hood:</span><b>€{hoodCost}</b></div>}
      <div><span>Finish factor:</span><b>{finishK.toFixed(2)}</b></div>
      <div><span>Countertop factor:</span><b>{topK.toFixed(2)}</b></div>
      <hr />
      <div className="total"><span>Estimated total:</span><b>€{subtotal}</b></div>
    </div>
  );
}
