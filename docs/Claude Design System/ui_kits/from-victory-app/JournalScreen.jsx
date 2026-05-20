// From Victory — Journal screen

function JournalScreen({ onBack }) {
  const [draft, setDraft] = React.useState('');
  const [focused, setFocused] = React.useState(false);

  const entries = [
    { date: 'Mar 11', mood: 'focused', preview: 'Felt nervous before warm-ups. Read Romans 8 in the locker room before…' },
    { date: 'Mar 10', mood: 'tired',   preview: "Lost 4–1. Coach pulled me after the second. I'm not going to make this about me…" },
    { date: 'Mar 08', mood: 'steady',  preview: 'Good practice. Stayed in my body, not in my head, on the breakaway drill.' },
  ];

  return (
    <Screen>
      <TopBar eyebrow="Journal · Private" title="Today" onBack={onBack}
              trailing={<Eyebrow style={{ color: FV.fg3 }}>Kid-only</Eyebrow>}/>

      <div style={{ padding: '8px 20px 24px' }}>
        {/* Prompt of the day */}
        <div style={{ background: FV.elev1, border: `1px solid ${FV.border}`, borderRadius: 14, padding: 16, marginBottom: 14 }}>
          <Eyebrow style={{ color: FV.gold }}>Prompt</Eyebrow>
          <div style={{ fontFamily: FV.fontHeading, fontWeight: 500, fontSize: 16, color: FV.fg, marginTop: 8 }}>
            Where today do I need to hear "more than conqueror" — and what would change if I believed it?
          </div>
        </div>

        {/* Composer */}
        <div style={{
          background: FV.elev3, border: `1px solid ${focused ? FV.cobalt : FV.border}`, borderRadius: 18,
          padding: 16, transition: 'border-color 160ms',
          boxShadow: focused ? `0 0 0 3px rgba(36,91,255,0.18)` : 'none',
        }}>
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Your journal is yours. Write when you have something."
            style={{
              width: '100%', boxSizing: 'border-box', background: 'transparent', border: 0,
              color: FV.fg, fontFamily: FV.fontBody, fontSize: 16, lineHeight: 1.6,
              minHeight: 140, outline: 'none', resize: 'none',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTop: `1px solid ${FV.border}` }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <Chip>Game day</Chip>
              <Chip>Focused</Chip>
            </div>
            <Button variant="primary" size="sm">Save entry</Button>
          </div>
        </div>

        {/* Past entries */}
        <div style={{ marginTop: 26, marginBottom: 10 }}>
          <Eyebrow>This week</Eyebrow>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {entries.map((e, i) => (
            <div key={i} style={{
              background: FV.elev1, border: `1px solid ${FV.border}`, borderRadius: 14,
              padding: 14 , display: 'flex', gap: 14, alignItems: 'flex-start',
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10, background: FV.elev2,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', flex: 'none',
              }}>
                <span style={{ fontFamily: FV.fontDisplay, fontWeight: 800, fontSize: 15, color: FV.fg, lineHeight: 1 }}>
                  {e.date.split(' ')[1]}
                </span>
                <span style={{ fontFamily: FV.fontMono, fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: FV.fg3, marginTop: 2 }}>
                  {e.date.split(' ')[0]}
                </span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                  <Eyebrow style={{ color: FV.fg3 }}>{e.mood}</Eyebrow>
                </div>
                <div style={{ fontFamily: FV.fontBody, fontSize: 13.5, lineHeight: 1.5, color: FV.fg2, textWrap: 'pretty' }}>
                  {e.preview}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Screen>
  );
}
window.JournalScreen = JournalScreen;
