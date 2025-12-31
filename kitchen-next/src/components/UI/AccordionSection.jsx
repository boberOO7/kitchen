"use client";

import React from "react";

export default function AccordionSection({ id, title, summary, openId, setOpenId, children }) {
  const open = openId === id;

  return (
    <section
      className="mb-2 overflow-hidden border border-[var(--sky-border)] bg-[var(--sky-card-bg)]"
      style={{ borderRadius: 2 }}
    >
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 bg-transparent px-4 py-3 text-left transition hover:bg-[var(--sky-bg-alt)]"
        onClick={() => setOpenId(open ? null : id)}
        aria-expanded={open}
      >
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-[var(--sky-fg)]">{title}</div>
          {summary && (
            <div className="mt-0.5 truncate text-xs text-[var(--sky-muted)]">{summary}</div>
          )}
        </div>
        <svg
          className={`h-4 w-4 shrink-0 text-[var(--sky-muted)] transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div
        className={`grid transition-all duration-200 ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-[var(--sky-border)] px-4 py-3">{children}</div>
        </div>
      </div>
    </section>
  );
}
