import Link from "next/link";
import { INTERVIEW_CATEGORIES } from "./categories";

export function CategoryGrid() {
  return (
    <section aria-labelledby="categories-heading">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ix-charcoal/55">
            Interview categories
          </p>
          <h2
            id="categories-heading"
            className="mt-1.5 font-display text-[1.45rem] tracking-tight text-ix-graphite sm:text-[1.7rem]"
          >
            Choose where to begin
          </h2>
        </div>
        <p className="max-w-sm text-sm leading-relaxed text-ix-charcoal/65">
          Software Engineering is available now. Additional categories will open
          as InterviewX expands.
        </p>
      </div>

      {/* Mobile: 2 columns × 3 rows; tablet 2; desktop 3 */}
      <div className="mt-5 grid grid-cols-2 gap-2.5 min-[375px]:gap-3 sm:gap-4 xl:grid-cols-3">
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
              <div className="flex items-start justify-between gap-2">
                <span
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.7rem] sm:h-11 sm:w-11 sm:rounded-xl"
                  style={{
                    backgroundColor: `${category.accent}33`,
                    color: category.accent,
                  }}
                >
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </span>
                <span
                  className={`max-w-[7.5rem] shrink-0 rounded-full px-2 py-0.5 text-center text-[10px] font-semibold leading-tight tracking-wide sm:max-w-none sm:px-2.5 sm:py-1 sm:text-[11px] ${
                    available
                      ? "bg-[#4f51b8] text-white"
                      : "bg-[#d4cfc4] text-[#3a3834]"
                  }`}
                >
                  {available ? "Available Now" : "Coming Soon"}
                </span>
              </div>

              <h3 className="mt-3 font-display text-[1.02rem] leading-snug tracking-tight text-ix-graphite sm:mt-4 sm:text-[1.2rem]">
                {category.title}
              </h3>
              <p className="mt-1.5 flex-1 text-[12px] leading-relaxed text-ix-charcoal/70 sm:mt-2 sm:text-sm sm:text-ix-charcoal/65">
                {category.description}
              </p>

              <div className="mt-3.5 sm:mt-5">
                {available ? (
                  <Link
                    href="/interview/setup"
                    className="ix-btn-primary !py-2.5 text-[13px] sm:!py-[0.9rem] sm:text-[15px]"
                  >
                    Begin practice
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="ix-dash-btn-soon cursor-not-allowed"
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
