// From Victory — Profile / You screen

function ProfileScreen() {
  const stats = [
    { label: 'Days this week', value: '5' },
    { label: 'Rhythm last 30',  value: '24' },
    { label: 'Journal entries', value: '18' },
  ];
  const paths = [
    { name: 'Hockey · Mental toughness', status: 'In progress · week 3', tone: 'gold' },
    { name: 'Pre-game routines',         status: 'Open',                  tone: 'default' },
    { name: 'Identity in Christ',        status: 'Started · week 2',      tone: 'default' },
  ];

  return (
    <Screen>
      <TopBar eyebrow="Account" title="You"
              trailing={<button style={{ background:'transparent', border:0, color:FV.fg2, cursor:'pointer' }}><Icon name="settings" size={20}/></button>}/>

      <div style={{ padding: '4px 20px 24px' }}>
        {/* Identity card */}
        <div style={{
          background: `radial-gradient(120% 80% at 20% 0%, rgba(223,175,55,0.10), transparent 60%), ${FV.elev1}`,
          border: `1px solid ${FV.border}`, borderRadius: 20, padding: 22,
          display: 'flex', alignItems: 'center', gap: 16, marginTop: 8,
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 999, background: FV.elev2,
            border: `1px solid ${FV.borderStrong}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: FV.fontDisplay, fontWeight: 800, fontSize: 24, color: FV.gold, position: 'relative',
          }}>
            JM
            <span style={{
              position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, borderRadius: 999,
              background: FV.gold, border: `2px solid ${FV.bg}`,
            }}/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: FV.fontHeading, fontWeight: 600, fontSize: 18, color: FV.fg }}>Jordan M.</div>
            <div style={{ fontFamily: FV.fontMono, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: FV.gold, marginTop: 4 }}>
              U14 · Hockey
            </div>
          </div>
        </div>

        {/* Stats — rhythm not streak */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, marginTop: 18, borderRadius: 14, overflow: 'hidden', border: `1px solid ${FV.border}`, background: FV.border }}>
          {stats.map((s, i) => (
            <div key={i} style={{ background: FV.elev1, padding: 16, textAlign: 'left' }}>
              <div style={{ fontFamily: FV.fontDisplay, fontWeight: 800, fontSize: 30, color: FV.fg, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontFamily: FV.fontMono, fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: FV.fg3, marginTop: 8 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Affirmation strip */}
        <div style={{ marginTop: 16, padding: '14px 16px', background: FV.elev1, borderRadius: 14, border: `1px solid ${FV.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <FlameMark size={18}/>
          <div style={{ fontFamily: FV.fontBody, fontSize: 13, color: FV.fg2 }}>
            Glad you've been showing up. Rhythm — not perfection.
          </div>
        </div>

        {/* Training paths */}
        <div style={{ marginTop: 24, marginBottom: 10 }}>
          <Eyebrow>Training paths</Eyebrow>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {paths.map((p, i) => (
            <div key={i} style={{
              background: FV.elev1, border: `1px solid ${FV.border}`, borderRadius: 14,
              padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 8, height: 40, borderRadius: 4,
                background: p.tone === 'gold' ? FV.gold : 'rgba(247,247,247,0.12)',
              }}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: FV.fontHeading, fontWeight: 600, fontSize: 14, color: FV.fg }}>{p.name}</div>
                <div style={{ fontFamily: FV.fontMono, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: p.tone === 'gold' ? FV.gold : FV.fg3, marginTop: 4 }}>
                  {p.status}
                </div>
              </div>
              <Icon name="arrowRight" size={18} color={FV.fg3}/>
            </div>
          ))}
        </div>

        {/* Settings rows */}
        <div style={{ marginTop: 24 }}>
          <Eyebrow>Account</Eyebrow>
          <div style={{ marginTop: 10, background: FV.elev1, border: `1px solid ${FV.border}`, borderRadius: 14, overflow: 'hidden' }}>
            {['Parent dashboard', 'Notifications', 'Privacy & safety', 'Sign out'].map((row, i, arr) => (
              <div key={row} style={{
                padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderBottom: i < arr.length - 1 ? `1px solid ${FV.border}` : 'none',
                fontFamily: FV.fontBody, fontSize: 14,
                color: row === 'Sign out' ? FV.fg2 : FV.fg,
              }}>
                <span>{row}</span>
                <Icon name="arrowRight" size={16} color={FV.fg3}/>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Screen>
  );
}
window.ProfileScreen = ProfileScreen;
