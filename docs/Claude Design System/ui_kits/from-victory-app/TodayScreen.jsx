// From Victory — Today screen (home)

function TodayScreen({ onNavigate }) {
  const greeting = "Tuesday, March 12";
  return (
    <Screen>
      <TopBar
        eyebrow="Today"
        title={greeting}
        trailing={
          <button aria-label="Notifications" style={{
            width: 36, height: 36, borderRadius: 999, background: 'transparent',
            border: `1px solid ${FV.border}`, color: FV.fg, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
          }}>
            <Icon name="bell" size={18}/>
            <span style={{ position: 'absolute', top: 8, right: 9, width: 6, height: 6, borderRadius: 999, background: FV.gold }}/>
          </button>
        }
      />

      <div style={{ padding: '4px 20px 20px' }}>
        {/* Hero — identity reminder + brand mark */}
        <div style={{ marginTop: 8, marginBottom: 22, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <img src="../../assets/logo-icon.svg" alt="" style={{ height: 56, width: 'auto', flex: 'none', marginTop: 2 }}/>
          <div>
            <Eyebrow style={{ color: FV.gold, marginBottom: 8 }}>From Victory</Eyebrow>
            <div style={{ fontFamily: FV.fontHeading, fontWeight: 600, fontSize: 24, lineHeight: 1.18, color: FV.fg, letterSpacing: '-0.01em', textWrap: 'pretty' }}>
              Your identity is secure.<br/>Compete from there.
            </div>
          </div>
        </div>

        {/* Rhythm card */}
        <Card padding={20} radius={20} style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
          <RhythmRing pct={70} size={86} label="rhythm"/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Eyebrow>Today's rhythm</Eyebrow>
            <div style={{ fontFamily: FV.fontHeading, fontWeight: 600, fontSize: 17, color: FV.fg, marginTop: 4, marginBottom: 2 }}>
              Two reps to go
            </div>
            <div style={{ fontFamily: FV.fontBody, fontSize: 13, color: FV.fg2 }}>
              ~5 minutes. Pick up where you are.
            </div>
          </div>
        </Card>

        {/* Modules grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
          <ModuleTile icon="book"    title="Devotional" duration="3 min" done onClick={() => onNavigate('devotional')}/>
          <ModuleTile icon="journal" title="Journal"    duration="5 min" onClick={() => onNavigate('journal')}/>
          <ModuleTile icon="clock"   title="Pre-game"   duration="2 min" onClick={() => onNavigate('pregame')}/>
          <ModuleTile icon="flame"   title="Reflect"    duration="4 min"/>
        </div>

        {/* Game-day banner */}
        <div style={{ marginTop: 22, marginBottom: 8 }}>
          <Eyebrow>Coming up</Eyebrow>
        </div>
        <div style={{
          position: 'relative', borderRadius: 20, overflow: 'hidden',
          border: `1px solid ${FV.border}`, minHeight: 168,
          background: `linear-gradient(180deg, rgba(5,5,5,0.1) 0%, rgba(5,5,5,0.85) 100%), linear-gradient(135deg, ${FV.navy} 0%, ${FV.bg} 70%)`,
        }}>
          {/* watermark flame */}
          <div style={{ position: 'absolute', right: -20, top: -20, opacity: 0.06, height: 220 }}>
            <img src="../../assets/mark-flame.svg" alt="" style={{ height: '100%', width: 'auto' }}/>
          </div>
          <div style={{ position: 'absolute', inset: 0, padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <Eyebrow style={{ color: FV.gold }}>Game · Tonight · 7:30 PM</Eyebrow>
              <div style={{
                fontFamily: FV.fontDisplay, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em',
                fontSize: 30, lineHeight: 1, color: FV.fg, marginTop: 10,
              }}>
                Three breaths.<br/>Reset.
              </div>
            </div>
            <Button variant="coach" onClick={() => onNavigate('pregame')} full>PRE-GAME RESET</Button>
          </div>
        </div>
      </div>
    </Screen>
  );
}
window.TodayScreen = TodayScreen;
