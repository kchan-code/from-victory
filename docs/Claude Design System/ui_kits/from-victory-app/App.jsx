// From Victory — main interactive app

function FromVictoryApp() {
  const [tab, setTab] = React.useState('today');
  // Modal/overlay screens that aren't tabs
  const [overlay, setOverlay] = React.useState(null); // 'devotional' | 'pregame' | null

  const close = () => setOverlay(null);

  let body;
  if (overlay === 'devotional') body = <DevotionalScreen onBack={close}/>;
  else if (overlay === 'pregame') body = <PregameScreen onBack={close}/>;
  else if (tab === 'today')   body = <TodayScreen onNavigate={setOverlay}/>;
  else if (tab === 'word')    body = <DevotionalScreen onBack={() => setTab('today')}/>;
  else if (tab === 'journal') body = <JournalScreen onBack={() => setTab('today')}/>;
  else if (tab === 'you')     body = <ProfileScreen/>;
  else if (tab === 'train')   body = <TrainScreen onNavigate={setOverlay}/>;

  return (
    <div style={{
      width: '100%', height: '100%', background: FV.bg, color: FV.fg,
      fontFamily: FV.fontBody, position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>
      {body}
      {/* Tab bar always present (overlays cover it via z-index of header only — keep it) */}
      {!overlay && <TabBar active={tab} onChange={setTab}/>}
    </div>
  );
}
window.FromVictoryApp = FromVictoryApp;

// Simple Train screen since the tab is shown
function TrainScreen({ onNavigate }) {
  const sport = [
    { name: 'Hockey · U14',   active: true },
    { name: 'Basketball',     active: false, soon: true },
    { name: 'Soccer',         active: false, soon: true },
    { name: 'Track & field',  active: false, soon: true },
  ];
  const sessions = [
    { eyebrow: 'Module 03', title: 'Reset between shifts',    duration: '4 min', tone: 'gold' },
    { eyebrow: 'Module 04', title: 'Visualization · pre-game', duration: '6 min' },
    { eyebrow: 'Module 05', title: 'Post-game review',         duration: '5 min' },
    { eyebrow: 'Module 06', title: 'Talking back to fear',     duration: '7 min' },
  ];
  return (
    <Screen>
      <TopBar eyebrow="Training" title="Mental toughness · Week 3"/>
      <div style={{ padding: '4px 20px 20px' }}>
        {/* Sport segmented */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 16 }}>
          {sport.map(s => (
            <span key={s.name} style={{
              fontFamily: FV.fontMono, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase',
              padding: '8px 12px', borderRadius: 999, whiteSpace: 'nowrap',
              border: `1px solid ${s.active ? FV.gold : FV.border}`,
              color: s.active ? FV.gold : (s.soon ? FV.fg3 : FV.fg2),
              background: s.active ? 'transparent' : FV.elev1,
            }}>
              {s.name}{s.soon && ' · soon'}
            </span>
          ))}
        </div>

        {/* Path progress */}
        <Card padding={18} radius={18} style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Eyebrow>Path progress</Eyebrow>
            <span style={{ fontFamily: FV.fontMono, fontSize: 11, color: FV.gold, letterSpacing: '0.12em' }}>9 / 24</span>
          </div>
          <div style={{ height: 6, background: 'rgba(247,247,247,0.06)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: '37.5%', height: '100%', background: FV.gold, borderRadius: 3 }}/>
          </div>
          <div style={{ fontFamily: FV.fontBody, fontSize: 13, color: FV.fg2, marginTop: 12 }}>
            Steady rhythm. Three modules left this week — no rush.
          </div>
        </Card>

        <div style={{ marginBottom: 10 }}><Eyebrow>This week</Eyebrow></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sessions.map((s, i) => (
            <button key={i}
                    onClick={() => i === 0 && onNavigate('pregame')}
                    style={{
              background: FV.elev1, border: `1px solid ${s.tone === 'gold' ? 'rgba(223,175,55,0.5)' : FV.border}`,
              borderRadius: 14, padding: 16, textAlign: 'left', cursor: 'pointer', color: FV.fg,
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: s.tone === 'gold' ? FV.goldSoft : FV.elev2,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none',
              }}>
                <Icon name={i === 0 ? 'play' : 'clock'} size={18} color={s.tone === 'gold' ? FV.gold : FV.fg2}/>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Eyebrow style={{ color: s.tone === 'gold' ? FV.gold : FV.fg3 }}>{s.eyebrow}</Eyebrow>
                <div style={{ fontFamily: FV.fontHeading, fontWeight: 600, fontSize: 15, color: FV.fg, marginTop: 4 }}>
                  {s.title}
                </div>
              </div>
              <span style={{ fontFamily: FV.fontMono, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: FV.fg3 }}>
                {s.duration}
              </span>
            </button>
          ))}
        </div>
      </div>
    </Screen>
  );
}
window.TrainScreen = TrainScreen;
