// components/UI/AccordionSection.jsx
import React from "react";

export default function AccordionSection({ id, title, summary, openId, setOpenId, children }) {
  const open = openId === id;
  return (
    <section className={`acc ${open ? "open" : ""}`}>
      <button
        type="button"
        className="acc-header"
        onClick={() => setOpenId(open ? null : id)}
        aria-expanded={open}
      >
        <div className="acc-title">{title}</div>
        <div className="acc-summary">{summary}</div>
        <span className="acc-chevron" aria-hidden />
      </button>
      <div className="acc-body">
        {children}
      </div>
    </section>
  );
}
