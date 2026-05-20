// From Victory — Devotional / Word screen (scripture reflection)

function DevotionalScreen({ onBack }) {
  return (
    <Screen>
      <TopBar eyebrow="Word · Day 12" title="More than conquerors" onBack={onBack}
              trailing={<button style={{ background:'transparent', border:0, color: FV.fg2, cursor:'pointer' }}><Icon name="more" size={20}/></button>}/>

      <div style={{ padding: '4px 20px 20px' }}>
        {/* Verse card */}
        <Card accent="verse" radius={20} padding={24} style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <FlameMark size={20}/>
            <VerseRef>Romans 8:37 · NIV</VerseRef>
          </div>
          <p className="fv-scripture" style={{
            fontFamily: FV.fontScripture, fontSize: 22, lineHeight: 1.55, color: FV.fg,
            margin: 0, textWrap: 'pretty', fontWeight: 400,
          }}>
            "No, in all these things we are more than conquerors through him who loved us."
          </p>
        </Card>

        {/* Body reflection */}
        <div style={{ marginTop: 22 }}>
          <Eyebrow>Today's reflection</Eyebrow>
          <p style={{ fontFamily: FV.fontBody, fontSize: 15, lineHeight: 1.6, color: FV.fg2, marginTop: 10 }}>
            Paul didn't say <em style={{ color: FV.fg }}>after</em> these things. He said <em style={{ color: FV.fg }}>in</em> them.
            On the bench. Down two goals. Losing a starting spot. The win is already yours
            because of who you belong to — not what the scoreboard says tonight.
          </p>
          <p style={{ fontFamily: FV.fontBody, fontSize: 15, lineHeight: 1.6, color: FV.fg2, marginTop: 12 }}>
            Compete from that. Not for it.
          </p>
        </div>

        {/* Prompt */}
        <div style={{ marginTop: 22, padding: 16, background: FV.elev1, border: `1px solid ${FV.border}`, borderRadius: 14 }}>
          <Eyebrow style={{ color: FV.gold }}>Prompt</Eyebrow>
          <div style={{ fontFamily: FV.fontHeading, fontWeight: 500, fontSize: 16, color: FV.fg, marginTop: 8 }}>
            Where today do I need to hear "more than conqueror" — and what would change if I believed it?
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          <Button variant="primary" full>Take to journal</Button>
          <Button variant="secondary">Save</Button>
        </div>

        {/* Read more */}
        <div style={{ marginTop: 22, paddingTop: 16, borderTop: `1px solid ${FV.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Eyebrow>Read passage</Eyebrow>
          <span style={{ fontFamily: FV.fontHeading, fontWeight: 600, fontSize: 14, color: FV.gold }}>Romans 8:31–39 →</span>
        </div>
      </div>
    </Screen>
  );
}
window.DevotionalScreen = DevotionalScreen;
