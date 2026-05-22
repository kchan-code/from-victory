import { ResourceScreen } from "@/components/safety/ResourceScreen";
import { safetyVocabulary } from "@/lib/safety/keywords";

export const metadata = {
  title: "Dev · Safety Resource Preview",
};

// Preview route for the inline resource screen. Env-gated to non-prod by
// the /dev layout (apps/web/app/dev/layout.tsx). PR-09 will render this
// component from the journal save flow when detection fires.
export default function SafetyResourcePreviewPage() {
  return (
    <main className="min-h-screen bg-onyx px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-[720px]">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-cream/50 mb-4">
          Dev preview · /dev/safety-resource
        </p>
        <h1 className="font-display font-extrabold uppercase tracking-[0.04em] text-cream text-[32px] sm:text-[36px] leading-tight mb-3">
          ResourceScreen variants
        </h1>
        <p className="font-body text-cream/70 text-[15px] leading-relaxed mb-10">
          One render per category from{" "}
          <code className="text-gold font-mono text-[13px]">
            packages/content/safety-keywords.json
          </code>
          . Focused resource changes per the category&rsquo;s
          <code className="text-gold font-mono text-[13px]">
            {" "}
            resources_focus
          </code>{" "}
          field.
        </p>

        <div className="grid gap-8">
          {safetyVocabulary.categories.map((cat) => (
            <div key={cat.id}>
              <p className="font-display font-semibold uppercase tracking-[0.18em] text-[12px] text-cream/50 mb-3">
                category: {cat.id} &middot; focus: {cat.resources_focus}
              </p>
              <ResourceScreen focus={cat.resources_focus} />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
