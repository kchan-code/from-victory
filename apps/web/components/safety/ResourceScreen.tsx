import type { SafetyResourcesFocus } from "@/lib/safety/keywords";

type Props = {
  /**
   * Which resource gets the lead emphasis. Driven by the detected
   * category's resources_focus field. All three resources are always
   * displayed — the focus only controls visual emphasis.
   */
  focus?: SafetyResourcesFocus;
};

const RESOURCES = {
  "988_lifeline": {
    name: "988 Suicide & Crisis Lifeline",
    primaryAction: "Call or text 988",
    primaryHref: "tel:988",
    description: "Free, confidential support for anyone in crisis. 24/7.",
  },
  crisis_text_line: {
    name: "Crisis Text Line",
    primaryAction: "Text HOME to 741741",
    primaryHref: "sms:741741?body=HOME",
    description: "Free, 24/7, text-based crisis support.",
  },
  trusted_adult: {
    name: "Talk to a trusted adult",
    primaryAction: null,
    primaryHref: null,
    description:
      "A parent, coach, teacher, pastor, or counselor. You don't have to carry this alone.",
  },
} as const;

const ORDER: SafetyResourcesFocus[] = [
  "988_lifeline",
  "crisis_text_line",
  "trusted_adult",
];

export function ResourceScreen({ focus = "988_lifeline" }: Props) {
  const ordered: SafetyResourcesFocus[] = [
    focus,
    ...ORDER.filter((r) => r !== focus),
  ];

  return (
    <section
      role="region"
      aria-label="Crisis resources"
      className="bg-charcoal border border-hairline rounded-2xl p-7 sm:p-8"
    >
      <p className="font-display font-semibold uppercase tracking-[0.16em] text-[11px] text-gold mb-3">
        We see you
      </p>
      <h2 className="font-display font-extrabold uppercase tracking-[0.04em] text-cream text-[24px] sm:text-[28px] leading-tight mb-4">
        Some of what you wrote sounds heavy.
      </h2>
      <p className="font-body text-cream/80 text-[15px] leading-relaxed mb-6">
        You don&rsquo;t have to handle this on your own. Below are people
        trained to listen, available right now. Your training session is
        saved &mdash; nothing here will be sent to your parent.
      </p>

      <ul className="grid gap-4 mb-6">
        {ordered.map((key, idx) => {
          const r = RESOURCES[key];
          const isLead = idx === 0;
          return (
            <li
              key={key}
              className={`bg-onyx border ${
                isLead ? "border-gold" : "border-hairline"
              } rounded-xl p-5`}
            >
              <p className="font-display font-bold uppercase tracking-[0.06em] text-cream text-[15px] mb-1.5">
                {r.name}
              </p>
              <p className="font-body text-cream/70 text-[14px] leading-relaxed mb-3">
                {r.description}
              </p>
              {r.primaryAction && r.primaryHref ? (
                <a
                  href={r.primaryHref}
                  className={`inline-flex items-center font-heading font-semibold text-[14px] rounded-pill px-5 py-2.5 no-underline transition-colors duration-base ease-out ${
                    isLead
                      ? "bg-gold text-onyx border border-gold hover:bg-gold-bright"
                      : "bg-transparent text-cream border border-cream/30 hover:border-cream/60"
                  }`}
                >
                  {r.primaryAction}
                </a>
              ) : null}
            </li>
          );
        })}
      </ul>

      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-cream/50 leading-relaxed">
        From Victory is not a mental-health service. These resources are
        provided by independent organisations. In an immediate emergency,
        call 911.
      </p>
    </section>
  );
}
