import {
  Button,
  Card,
  Chip,
  Eyebrow,
  FlameMark,
  Icon,
  type IconName,
  RhythmRing,
  VerseRef,
} from "@/components/ui";

export const metadata = {
  title: "Component Showcase — From Victory",
  robots: { index: false, follow: false },
};

const ICON_NAMES: IconName[] = [
  "home",
  "homeOutline",
  "train",
  "book",
  "journal",
  "profile",
  "arrowRight",
  "arrowLeft",
  "play",
  "pause",
  "clock",
  "bell",
  "check",
  "more",
  "close",
  "settings",
  "edit",
  "flame",
  "whistle",
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-hairline pt-6 mt-8 first:border-t-0 first:mt-0 first:pt-0">
      <Eyebrow tone="gold">{title}</Eyebrow>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function ComponentsShowcase() {
  return (
    <main className="mx-auto max-w-[420px] px-5 py-10">
      <header className="flex items-center gap-3 mb-8">
        <FlameMark size={24} />
        <div>
          <h1 className="text-cream">Primitives</h1>
          <p className="text-cream/50 text-[13px] mt-1">
            Internal showcase. Not indexed.
          </p>
        </div>
      </header>

      <Section title="Eyebrow">
        <div className="flex flex-col gap-2">
          <Eyebrow>Default eyebrow</Eyebrow>
          <Eyebrow tone="gold">Gold eyebrow</Eyebrow>
        </div>
      </Section>

      <Section title="VerseRef">
        <VerseRef>Romans 8:37 · NIV</VerseRef>
      </Section>

      <Section title="Chip">
        <div className="flex flex-wrap gap-2">
          <Chip>Default</Chip>
          <Chip variant="gold">Gold</Chip>
          <Chip variant="cobalt">Cobalt</Chip>
          <Chip variant="solid">Solid</Chip>
        </div>
      </Section>

      <Section title="Button — primary">
        <div className="flex flex-col gap-3">
          <Button>Take to journal</Button>
          <Button size="sm">Save entry</Button>
          <Button full>Full width</Button>
        </div>
      </Section>

      <Section title="Button — secondary / ghost">
        <div className="flex flex-col gap-3">
          <Button variant="secondary">Save</Button>
          <Button variant="ghost">Skip for now</Button>
        </div>
      </Section>

      <Section title="Button — coach">
        <Button variant="coach" full>
          PRE-GAME RESET
        </Button>
      </Section>

      <Section title="Button — with leading / trailing">
        <div className="flex flex-col gap-3">
          <Button
            variant="secondary"
            trailing={<Icon name="arrowRight" size={16} />}
          >
            Continue
          </Button>
          <Button
            variant="ghost"
            leading={<Icon name="arrowLeft" size={16} />}
          >
            Back
          </Button>
        </div>
      </Section>

      <Section title="Card — plain">
        <Card>
          <p className="text-cream">
            A plain card on charcoal. Hairline border, padding md, radius md.
          </p>
        </Card>
      </Section>

      <Section title="Card — verse accent">
        <Card accent="verse" radius="lg" padding="lg">
          <Eyebrow tone="gold">Today&apos;s passage</Eyebrow>
          <p className="fv-scripture mt-3">
            For we are more than conquerors through him who loved us.
          </p>
          <div className="mt-4">
            <VerseRef>Romans 8:37 · NIV</VerseRef>
          </div>
        </Card>
      </Section>

      <Section title="Card — prayer accent">
        <Card accent="prayer" radius="xl" padding="lg">
          <Eyebrow>Coach</Eyebrow>
          <p className="text-cream mt-3">
            Three breaths. Reset. Lock back in.
          </p>
        </Card>
      </Section>

      <Section title="RhythmRing">
        <div className="flex items-center gap-6">
          <RhythmRing pct={0} label="rhythm" />
          <RhythmRing pct={42} label="rhythm" />
          <RhythmRing pct={86} size={72} stroke={6} label="week" />
        </div>
      </Section>

      <Section title="FlameMark">
        <div className="flex items-end gap-4 text-gold">
          <FlameMark size={16} />
          <FlameMark size={24} />
          <FlameMark size={40} />
          <FlameMark size={64} className="text-cobalt" />
        </div>
        <p className="text-cream/50 text-[12px] mt-2">
          Fill is <code className="font-mono">currentColor</code>; last one is
          tinted via <code className="font-mono">text-cobalt</code>.
        </p>
      </Section>

      <Section title="Icon — stroke">
        <div className="grid grid-cols-6 gap-3 text-cream">
          {ICON_NAMES.map((name) => (
            <div
              key={name}
              className="flex flex-col items-center gap-1.5 p-2 rounded-sm border border-hairline"
            >
              <Icon name={name} size={20} />
              <span className="font-mono text-[9px] text-cream/50 uppercase tracking-wider">
                {name}
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Icon — filled variant">
        <div className="flex items-center gap-4 text-gold">
          <Icon name="home" size={24} filled />
          <Icon name="flame" size={24} filled />
          <Icon name="check" size={24} filled />
        </div>
      </Section>
    </main>
  );
}
