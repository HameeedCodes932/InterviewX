const STEPS = [
  {
    step: "01",
    title: "Choose an interview category",
    body: "Select the path that matches the interviews you are preparing for.",
  },
  {
    step: "02",
    title: "Practise with an AI interviewer",
    body: "Enter a focused simulation guided by a professional virtual interviewer.",
  },
  {
    step: "03",
    title: "Review your performance",
    body: "Reflect on how you answered — feedback arrives in a later stage of the product.",
  },
] as const;

export function HowItWorks() {
  return (
    <section
      className="ix-dash-panel"
      aria-labelledby="how-it-works-heading"
    >
      <div className="max-w-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ix-charcoal/45">
          Your interview journey
        </p>
        <h2
          id="how-it-works-heading"
          className="mt-1.5 font-display text-[1.35rem] tracking-tight text-ix-graphite sm:text-[1.5rem]"
        >
          How InterviewX works
        </h2>
        <p className="mt-2 text-sm text-ix-charcoal/55">
          A simple path from category selection to deliberate practice — without
          inventing history or scores before the engine is ready.
        </p>
      </div>

      <ol className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {STEPS.map((item) => (
          <li
            key={item.step}
            className="rounded-[1.1rem] border border-[#e0ddd6] bg-[#fafaf7]/80 px-4 py-4"
          >
            <span className="font-display text-sm font-semibold tracking-wide text-ix-indigo">
              {item.step}
            </span>
            <h3 className="mt-2 text-[15px] font-medium text-ix-graphite">
              {item.title}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ix-charcoal/55">
              {item.body}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
