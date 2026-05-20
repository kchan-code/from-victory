// From Victory — Pre-game reset (Coach mode, breath timer)

function PregameScreen({ onBack }) {
  const [phase, setPhase] = React.useState('inhale'); // inhale | hold | exhale
  const [running, setRunning] = React.useState(false);
  const [breathCount, setBreathCount] = React.useState(0);

  React.useEffect(() => {
    if (!running) return;
    const sequence = ['inhale', 'hold', 'exhale'];
    const durations = { inhale: 4000, hold: 2000, exhale: 6000 };
    let idx = sequence.indexOf(phase);
    const t = setTimeout(() => {
      if (sequence[idx] === 'exhale') {
        setBreathCount(b => Math.min(3, b + 1));
      }
      setPhase(sequence[(idx + 1) % sequence.length]);
    }, durations[phase]);
    return () => clearTimeout(t);
  }, [phase, running]);

  const scale = phase === 'inhale' ? 1 : phase === 'hold' ? 1 : 0.55;
  const labelMap = { inhale: 'Inhale', hold: 'Hold', exhale: 'Exhale' };

  return (
    <div style={{
      flex: 1, background: `radial-gradient(80% 60% at 50% 30%, rgba(36,91,255,0.18) 0%, transparent 60%), ${FV.bg}`,
      display: 'flex', flexDirection: 'column', position: 'relative', color: FV.fg, paddingBottom: 110,
    }}>
      <TopBar eyebrow="Pre-game · Coach" title="Three breaths. Reset." onBack={onBack}/>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 32px' }}>
        {/* count pips */}
        <div style={{ display: 'flex', gap: 8 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 28, height: 4, borderRadius: 2,
              background: i < breathCount ? FV.gold : 'rgba(247,247,247,0.12)',
              transition: 'background 300ms',
            }}/>
          ))}
        </div>

        {/* breath orb */}
        <div style={{ position: 'relative', width: 260, height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            border: `1px solid rgba(36,91,255,0.25)`,
          }}/>
          <div style={{
            width: 220, height: 220, borderRadius: '50%',
            background: `radial-gradient(circle at 50% 40%, rgba(36,91,255,0.55), rgba(36,91,255,0.08) 70%)`,
            border: `1px solid rgba(36,91,255,0.5)`,
            transform: `scale(${scale})`,
            transition: phase === 'inhale' ? 'transform 4000ms ease-in-out' :
                        phase === 'exhale' ? 'transform 6000ms ease-in-out' :
                        'transform 200ms',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
          }}>
            <span style={{ fontFamily: FV.fontDisplay, fontWeight: 800, fontSize: 36, letterSpacing: '0.06em', textTransform: 'uppercase', color: FV.fg }}>
              {labelMap[phase]}
            </span>
            <span style={{ fontFamily: FV.fontMono, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(247,247,247,0.7)', marginTop: 8 }}>
              {breathCount} of 3
            </span>
          </div>
        </div>

        {/* Anchor verse */}
        <div style={{ textAlign: 'center', maxWidth: 320 }}>
          <VerseRef>Philippians 4:7</VerseRef>
          <p style={{
            fontFamily: FV.fontScripture, fontSize: 17, lineHeight: 1.55, color: FV.fg2,
            margin: '10px 0 22px', textWrap: 'pretty',
          }}>
            "The peace of God, which transcends all understanding, will guard your hearts."
          </p>
          <Button variant="coach" onClick={() => setRunning(r => !r)} full>
            {running ? 'PAUSE' : breathCount === 0 ? 'BEGIN' : 'CONTINUE'}
          </Button>
        </div>
      </div>
    </div>
  );
}
window.PregameScreen = PregameScreen;
