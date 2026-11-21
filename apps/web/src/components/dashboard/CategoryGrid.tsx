"use client";

import { useState } from "react";
import { INTERVIEW_CATEGORIES } from "./categories";

const SETUP_NOTICE =
  "Interview setup is the next development stage — this category is ready to select, but the practice room is not wired yet.";

export function CategoryGrid() {
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <section aria-labelledby="categories-heading">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ix-charcoal/45">
            Interview categories
          </p>
          <h2
            id="categories-heading"
            className="mt-1.5 font-display text-[1.45rem] tracking-tight text-ix-graphite sm:text-[1.65rem]"
          >
            Choose where to begin
          </h2>
        </div>
        <p className="max-w-sm text-sm text-ix-charcoal/55">
          Software Engineering is available now. Additional categories will open
          as InterviewX expands.
        </p>
      </div>

      {notice ? (
        <p
          className="mt-4 rounded-ix-sm border border-ix-indigo/20 bg-white/70 px-3.5 py-3 text-sm leading-relaxed text-ix-charcoal/80"
          role="status"
        >
          {notice}
        </p>
      ) : null}

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {INTERVIEW_CATEGORIES.map((category) => {
          const available = category.status === "available";
          const Icon = category.Icon;

          return (
            <article
              key={category.id}
              className={`ix-dash-card flex h-full flex-col ${
                available ? "ix-dash-card-available" : "ix-dash-card-soon"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: `${category.accent}14`,
                    color: category.accent,
                  }}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ${
                    available
                      ? "bg-ix-indigo/12 text-ix-indigo"
                      : "bg-[#e7e5df] text-ix-charcoal/50"
                  }`}
                >
                  {available ? "Available Now" : "Coming Soon"}
                </span>
              </div>

              <h3 className="mt-4 font-display text-[1.2rem] tracking-tight text-ix-graphite">
                {category.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-ix-charcoal/60">
                {category.description}
              </p>

              <div className="mt-5">
                {available ? (
                  <button
                    type="button"
                    className="ix-btn-primary"
                    onClick={() => setNotice(SETUP_NOTICE)}
                  >
                    Begin practice
                  </button>
                ) : (
                  <button
                    type="button"
                    className="ix-btn-secondary w-full cursor-not-allowed opacity-60"
                    disabled
                    aria-disabled="true"
                  >
                    Coming soon
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
