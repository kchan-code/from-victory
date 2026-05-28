// From Victory — Splash + Welcome + Onboarding screens

// ──────────────────────────────────────────────────────────────
// SPLASH — Logo icon centered on onyx, subtle flame pulse
function SplashScreen({ onContinue }) {
  React.useEffect(() => {
    const t = setTimeout(() => onContinue && onContinue(), 1800);
    return () => clearTimeout(t);
  }, []);
  return (
    <div style={{
      flex: 1, height: '100%', position: 'relative', overflow: 'hidden',
      background: `radial-gradient(60% 40% at 50% 40%, rgba(223,175,55,0.08), transparent 70%), ${FV.bg}`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      animation: 'fvFadeIn 600ms cubic-bezier(0.2,0.7,0.2,1)',
    }}>
      <style>{`
        @keyframes fvFadeIn { from {opacity: 0;} to {opacity: 1;} }
        @keyframes fvFlamePulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.04); opacity: 0.92; }
        }
        @keyframes fvSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <img src={FV_ASSETS.iconGold} alt="From Victory"
           style={{
             height: 132, width: 'auto', display: 'block',
             animation: 'fvFlamePulse 3.5s cubic-bezier(0.4,0,0.4,1) infinite',
             filter: 'drop-shadow(0 0 40px rgba(223,175,55,0.18))',
           }}/>
      <div style={{ marginTop: 32, animation: 'fvSlideUp 800ms 400ms both cubic-bezier(0.2,0.7,0.2,1)' }}>
        <Eyebrow color={FV.gold} style={{ textAlign: 'center', letterSpacing: '0.28em' }}>From Victory</Eyebrow>
      </div>
      <div style={{
        position: 'absolute', bottom: 56, left: 0, right: 0, textAlign: 'center',
        animation: 'fvSlideUp 800ms 800ms both cubic-bezier(0.2,0.7,0.2,1)',
      }}>
        <div style={{
          fontFamily: FV.fontMono, fontSize: 10, color: FV.fg3,
          letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 600,
        }}>Rooted · Fueled · Built</div>
      </div>
    </div>
  );
}
window.SplashScreen = SplashScreen;

// ──────────────────────────────────────────────────────────────
// WELCOME — Big identity statement, single CTA
function WelcomeScreen({ onContinue, onSignIn }) {
  return (
    <div style={{
      flex: 1, height: '100%', position: 'relative', overflow: 'hidden',
      background: `linear-gradient(180deg, ${FV.bg} 0%, ${FV.bg} 55%, rgba(7,26,51,0.65) 100%)`,
      color: FV.fg, display: 'flex', flexDirection: 'column',
      animation: 'fvFadeIn 500ms cubic-bezier(0.2,0.7,0.2,1)',
    }}>
      {/* Hero band — full stacked lockup (icon + wordmark) */}
      <div style={{ paddingTop: 64, paddingBottom: 32, display: 'flex', justifyContent: 'center' }}>
        <img src={FV_ASSETS.stacked} alt="From Victory"
             style={{ height: 168, width: 'auto', filter: 'drop-shadow(0 0 32px rgba(223,175,55,0.12))' }}/>
      </div>

      {/* Watermark flame */}
      <div style={{ position: 'absolute', right: -60, bottom: 200, opacity: 0.05, pointerEvents: 'none' }}>
        <img src={FV_ASSETS.flameMark} alt="" style={{ height: 360, width: 'auto' }}/>
      </div>

      <div style={{ padding: '0 28px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: 40 }}>
        <Eyebrow color={FV.gold} style={{ marginBottom: 14, letterSpacing: '0.24em' }}>Welcome</Eyebrow>
        <div style={{
          fontFamily: FV.fontDisplay, fontWeight: 800, textTransform: 'uppercase',
          letterSpacing: '0.005em', fontSize: 46, lineHeight: 0.96, color: FV.fg,
        }}>
          Your<br/>identity is<br/>secure.
        </div>
        <div style={{
          fontFamily: FV.fontDisplay, fontWeight: 600, textTransform: 'uppercase',
          letterSpacing: '0.04em', fontSize: 22, lineHeight: 1.1, marginTop: 16,
          color: FV.gold,
        }}>
          Compete from victory.
        </div>

        <div style={{ height: 1, background: FV.border, margin: '32px 0 22px' }}/>

        <p style={{
          fontFamily: FV.fontBody, fontSize: 14, lineHeight: 1.55, color: FV.fg2,
          margin: 0, maxWidth: 320, textWrap: 'pretty',
        }}>
          A daily training room for athletes — built on mental toughness,
          rhythm, and the truth that your worth is not on the scoreboard.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 28 }}>
          <Button variant="primary" size="lg" full onClick={onContinue}
                  trailing={<Icon name="arrowRight" size={16} color="#0B0905" strokeWidth={2}/>}>
            Begin training
          </Button>
          <Button variant="ghost" full onClick={onSignIn}>
            I already have an account
          </Button>
        </div>
      </div>
    </div>
  );
}
window.WelcomeScreen = WelcomeScreen;

// ──────────────────────────────────────────────────────────────
// ONBOARDING — multi-step setup
const SPORTS = [
  { id: 'hockey',     label: 'Hockey',     icon: 'hockey',     active: true },
  { id: 'basketball', label: 'Basketball', icon: 'basketball', active: false },
  { id: 'football',   label: 'Football',   icon: 'football',   active: false },
  { id: 'soccer',     label: 'Soccer',     icon: 'soccer',     active: false },
  { id: 'baseball',   label: 'Baseball',   icon: 'baseball',   active: false },
  { id: 'other',      label: 'Other sport', icon: 'target',    active: false },
];

// Sport-specific position + age tables. The labels for "U15", etc, change with sport
// (e.g. hockey uses Bantam/Midget; basketball uses 7th–8th grade; soccer uses U13/U15).
const POSITIONS_BY_SPORT = {
  hockey: [
    { id: 'forward', label: 'Forward', sub: 'Wing, center, finisher.' },
    { id: 'defense', label: 'Defense', sub: 'Hold the line. Lead from the back.' },
    { id: 'goalie',  label: 'Goalie',  sub: 'The wall. The reset master.' },
  ],
  basketball: [
    { id: 'guard',   label: 'Guard',   sub: 'PG or SG. Run the floor.' },
    { id: 'wing',    label: 'Wing',    sub: 'SF. Two-way slasher.' },
    { id: 'forward', label: 'Forward', sub: 'PF. Stretch the four.' },
    { id: 'center',  label: 'Center',  sub: 'Anchor the paint.' },
  ],
  football: [
    { id: 'qb',     label: 'Quarterback', sub: 'Lead the offense.' },
    { id: 'skill',  label: 'Skill (RB / WR / TE)', sub: 'Move the chains.' },
    { id: 'line',   label: 'Line (OL / DL)', sub: 'Win the trenches.' },
    { id: 'lb',     label: 'Linebacker',  sub: 'Read and react.' },
    { id: 'db',     label: 'Defensive back', sub: 'Lock down the field.' },
    { id: 'st',     label: 'Special teams', sub: 'One play, full effort.' },
  ],
  soccer: [
    { id: 'gk',  label: 'Goalkeeper', sub: 'The last line.' },
    { id: 'def', label: 'Defender',   sub: 'Hold the back four.' },
    { id: 'mid', label: 'Midfielder', sub: 'Set the rhythm.' },
    { id: 'fwd', label: 'Forward',    sub: 'Finish the chance.' },
  ],
  baseball: [
    { id: 'pitcher', label: 'Pitcher',   sub: 'Own the mound.' },
    { id: 'catcher', label: 'Catcher',   sub: 'Quarterback the field.' },
    { id: 'infield', label: 'Infield',   sub: 'Quick hands, quick feet.' },
    { id: 'outfield',label: 'Outfield',  sub: 'Track and finish.' },
  ],
  other: [
    { id: 'starter',   label: 'Starter',   sub: 'In the lineup.' },
    { id: 'rotation',  label: 'Rotation',  sub: 'Earning more minutes.' },
    { id: 'developing',label: 'Developing',sub: 'Earning a spot.' },
  ],
};

const AGE_LEVELS_BY_SPORT = {
  hockey: [
    { id: 'u13', label: 'U13 / Bantam', sub: '12 – 13' },
    { id: 'u15', label: 'U15 / Midget', sub: '14 – 15' },
    { id: 'u18', label: 'U18 / Prep',   sub: '16 – 17' },
    { id: 'col', label: 'College',      sub: '18+' },
  ],
  basketball: [
    { id: 'u13', label: 'Middle school', sub: '12 – 13' },
    { id: 'u15', label: 'JV / freshman', sub: '14 – 15' },
    { id: 'u18', label: 'Varsity',       sub: '16 – 17' },
    { id: 'col', label: 'College',       sub: '18+' },
  ],
  football: [
    { id: 'u13', label: 'Youth',       sub: '12 – 13' },
    { id: 'u15', label: 'JV',          sub: '14 – 15' },
    { id: 'u18', label: 'Varsity',     sub: '16 – 17' },
    { id: 'col', label: 'College',     sub: '18+' },
  ],
  soccer: [
    { id: 'u13', label: 'U13',         sub: '12 – 13' },
    { id: 'u15', label: 'U15',         sub: '14 – 15' },
    { id: 'u18', label: 'U17 / U19',   sub: '16 – 17' },
    { id: 'col', label: 'College',     sub: '18+' },
  ],
  baseball: [
    { id: 'u13', label: '13U',         sub: '12 – 13' },
    { id: 'u15', label: '15U',         sub: '14 – 15' },
    { id: 'u18', label: 'High school', sub: '16 – 17' },
    { id: 'col', label: 'College',     sub: '18+' },
  ],
  other: [
    { id: 'u13', label: 'Middle school', sub: '12 – 13' },
    { id: 'u15', label: 'Early high school', sub: '14 – 15' },
    { id: 'u18', label: 'High school', sub: '16 – 17' },
    { id: 'col', label: 'College',     sub: '18+' },
  ],
};

const CHALLENGES = [
  { id: 'confidence', label: 'Confidence' },
  { id: 'focus',      label: 'Focus under pressure' },
  { id: 'mistakes',   label: 'Fear of mistakes' },
  { id: 'coach',      label: 'Coach pressure' },
  { id: 'badgames',   label: 'Bad-game recovery' },
  { id: 'consistency',label: 'Consistency' },
  { id: 'anxiety',    label: 'Pre-game anxiety' },
  { id: 'leadership', label: 'Leadership' },
  { id: 'effort',     label: 'Effort discipline' },
  { id: 'injury',     label: 'Coming back from injury' },
];

const FAITH_LEVELS = [
  { id: 'open',   title: 'Open',   intensity: 1, sub: 'Mostly mindset language. Scripture present but light.', sample: '"Your worth is not defined by today\u2019s performance. Reset and take the next step."' },
  { id: 'growing',title: 'Growing',intensity: 2, sub: 'Balanced. Mindset framed in faith.', sample: '"Your worth is not on the scoreboard. Reset, breathe, and take the next faithful step."' },
  { id: 'deep',   title: 'Deep',   intensity: 3, sub: 'Full scripture and prayer. Identity-in-Christ language throughout.', sample: '"Your identity is secure in Christ. Today\u2019s performance does not define you. Reset, pray, and take the next faithful step."' },
];

// "Identity in Christ" is the FOUNDATION shown above this list, never a selectable goal.
const GOALS = [
  { id: 'mental',    label: 'Mental toughness',    sub: 'Stay anchored when adversity hits.',          icon: 'shield' },
  { id: 'confide',   label: 'Quiet confidence',    sub: 'Compete calmly because your worth is secure.',icon: 'sparkle' },
  { id: 'reset',     label: 'Reset after mistakes',sub: 'Release the last play. Return to truth.',     icon: 'zap' },
  { id: 'discipline',label: 'Daily discipline',    sub: 'Build a rhythm of faithful training.',        icon: 'target' },
  { id: 'pressure',  label: 'Pressure and focus',  sub: 'Stay present when the moment gets loud.',     icon: 'wind' },
];

window.FV_ONBOARDING_DATA = { SPORTS, POSITIONS_BY_SPORT, AGE_LEVELS_BY_SPORT, CHALLENGES, FAITH_LEVELS, GOALS };

function OnboardingStepFrame({ step, total, title, sub, children, onBack, onNext, nextLabel = 'Continue', nextDisabled, footer, padTop = 28 }) {
  return (
    <div style={{
      flex: 1, height: '100%', display: 'flex', flexDirection: 'column',
      background: FV.bg, color: FV.fg, overflow: 'hidden',
    }}>
      {/* Header with back + progress */}
      <div style={{ padding: '60px 20px 0', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={onBack} aria-label="Back" style={{
          width: 36, height: 36, borderRadius: 999, background: 'transparent',
          border: `1px solid ${FV.border}`, color: FV.fg, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none',
        }}><Icon name="arrowLeft" size={18}/></button>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <StepDots total={total} current={step}/>
        </div>
        <div style={{ width: 36 }}/>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: `${padTop}px 24px 16px` }}>
        <Eyebrow color={FV.gold}>Step {String(step + 1).padStart(2, '0')} of {String(total).padStart(2, '0')}</Eyebrow>
        <h1 style={{
          fontFamily: FV.fontHeading, fontWeight: 600, fontSize: 26, lineHeight: 1.15,
          letterSpacing: '-0.01em', margin: '10px 0 8px', color: FV.fg, textWrap: 'balance',
        }}>{title}</h1>
        {sub && <p style={{
          fontFamily: FV.fontBody, fontSize: 14, lineHeight: 1.5, color: FV.fg2,
          margin: '0 0 22px', textWrap: 'pretty',
        }}>{sub}</p>}
        {children}
      </div>

      {/* Footer */}
      <div style={{
        padding: '12px 20px 28px', background: 'rgba(5,5,5,0.85)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        borderTop: `1px solid ${FV.border}`,
      }}>
        {footer || (
          <Button variant="primary" full size="lg" onClick={onNext} disabled={nextDisabled}
                  trailing={<Icon name="arrowRight" size={16} color="#0B0905" strokeWidth={2}/>}>
            {nextLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
window.OnboardingStepFrame = OnboardingStepFrame;

function OnboardingFlow({ onComplete, onBack }) {
  const [step, setStep] = React.useState(0);
  const [data, setData] = React.useState({
    name: 'Jordan',
    ageLevel: 'u15',
    sport: 'hockey',
    position: 'forward',
    challenges: ['confidence', 'mistakes'],
    faith: 'growing',
    goal: 'discipline',
  });
  const TOTAL = 7;
  const set = (k, v) => setData(d => ({ ...d, [k]: v }));
  const toggle = (k, v) => setData(d => ({
    ...d, [k]: d[k].includes(v) ? d[k].filter(x => x !== v) : [...d[k], v].slice(0, 3),
  }));
  const next = () => step < TOTAL - 1 ? setStep(step + 1) : onComplete(data);
  const back = () => step === 0 ? onBack && onBack() : setStep(step - 1);

  const frameProps = { step, total: TOTAL, onBack: back, onNext: next };

  // Resolve the sport-specific tables (falls back to hockey if unset)
  const ages = AGE_LEVELS_BY_SPORT[data.sport] || AGE_LEVELS_BY_SPORT.hockey;
  const positions = POSITIONS_BY_SPORT[data.sport] || POSITIONS_BY_SPORT.hockey;
  const sportLabel = SPORTS.find(s => s.id === data.sport)?.label || 'your sport';

  if (step === 0) {
    return (
      <OnboardingStepFrame {...frameProps}
        title="What should we call you?"
        sub="First name only. This stays private to your device."
        nextDisabled={!data.name.trim()}>
        <div style={{ marginTop: 6 }}>
          <input value={data.name} onChange={e => set('name', e.target.value)}
                 placeholder="Your name"
                 style={{
                   width: '100%', boxSizing: 'border-box',
                   background: FV.elev2, border: `1px solid ${FV.border}`,
                   borderRadius: 14, padding: '16px 18px', color: FV.fg,
                   fontFamily: FV.fontHeading, fontSize: 18, fontWeight: 500,
                   outline: 'none', letterSpacing: '-0.005em',
                 }}/>
        </div>
        <div style={{
          marginTop: 22, padding: '14px 16px',
          background: FV.elev1, border: `1px solid ${FV.border}`,
          borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <Icon name="lock" size={16} color={FV.fg3}/>
          <div style={{ fontFamily: FV.fontBody, fontSize: 12.5, color: FV.fg2, lineHeight: 1.45 }}>
            We don't ask for last names, school, or team. Your journal stays on your device.
          </div>
        </div>
      </OnboardingStepFrame>
    );
  }

  if (step === 1) {
    return (
      <OnboardingStepFrame {...frameProps}
        title="Pick your sport."
        sub="Hockey is live for the first season. More sports are coming.">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {SPORTS.map(s => (
            <button key={s.id} onClick={() => {
                      if (!s.active) return;
                      // When switching sport, reset position to that sport's first option
                      const firstPos = (POSITIONS_BY_SPORT[s.id] || [])[0];
                      setData(d => ({ ...d, sport: s.id, position: firstPos ? firstPos.id : d.position }));
                    }}
                    disabled={!s.active}
                    style={{
                      background: data.sport === s.id ? 'rgba(223,175,55,0.08)' : FV.elev1,
                      border: `1px solid ${data.sport === s.id ? 'rgba(223,175,55,0.55)' : FV.border}`,
                      borderRadius: 14, padding: '20px 16px', color: FV.fg,
                      cursor: s.active ? 'pointer' : 'not-allowed',
                      opacity: s.active ? 1 : 0.5,
                      display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12,
                      textAlign: 'left', minHeight: 110,
                    }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: data.sport === s.id ? FV.goldSoft : 'rgba(247,247,247,0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name={s.icon} size={20} color={data.sport === s.id ? FV.gold : FV.fg2}/>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%' }}>
                <div style={{ fontFamily: FV.fontHeading, fontWeight: 600, fontSize: 15 }}>{s.label}</div>
                {!s.active && <span style={{
                  fontFamily: FV.fontMono, fontSize: 9, letterSpacing: '0.14em',
                  textTransform: 'uppercase', color: FV.fg3, fontWeight: 600,
                }}>Soon</span>}
              </div>
            </button>
          ))}
        </div>
      </OnboardingStepFrame>
    );
  }

  if (step === 2) {
    return (
      <OnboardingStepFrame {...frameProps}
        title={`Your ${sportLabel.toLowerCase()}.`}
        sub="Level and position — we tailor pre-game cues and reset drills to both.">
        <Eyebrow style={{ marginBottom: 10 }}>Level</Eyebrow>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
          {ages.map(a => (
            <ChoiceCard key={a.id} title={a.label} sub={a.sub}
                        selected={data.ageLevel === a.id}
                        onClick={() => set('ageLevel', a.id)} dense/>
          ))}
        </div>
        <Eyebrow style={{ marginBottom: 10 }}>Position</Eyebrow>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {positions.map(p => (
            <ChoiceCard key={p.id} title={p.label} sub={p.sub}
                        selected={data.position === p.id}
                        onClick={() => set('position', p.id)} dense/>
          ))}
        </div>
      </OnboardingStepFrame>
    );
  }

  if (step === 3) {
    return (
      <OnboardingStepFrame {...frameProps}
        title="What's hard right now?"
        sub={`Pick one to three. We'll build ${data.name || 'your'} first weeks around these.`}
        nextDisabled={data.challenges.length === 0}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {CHALLENGES.map(c => (
            <Chip key={c.id} onClick={() => toggle('challenges', c.id)}
                  selected={data.challenges.includes(c.id)} style={{ padding: '10px 14px', fontSize: 11 }}>
              {c.label}
            </Chip>
          ))}
        </div>
        <div style={{
          marginTop: 22, fontFamily: FV.fontMono, fontSize: 10,
          letterSpacing: '0.16em', textTransform: 'uppercase', color: FV.fg3, fontWeight: 600,
        }}>
          {data.challenges.length} of 3 selected
        </div>
      </OnboardingStepFrame>
    );
  }

  if (step === 4) {
    return (
      <OnboardingStepFrame {...frameProps}
        title="Faith comfort level."
        sub="Same foundation, different intensity. You can change this any time.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {FAITH_LEVELS.map(f => (
            <button key={f.id} onClick={() => set('faith', f.id)} style={{
              textAlign: 'left', cursor: 'pointer',
              background: data.faith === f.id ? 'rgba(223,175,55,0.07)' : FV.elev1,
              border: `1px solid ${data.faith === f.id ? 'rgba(223,175,55,0.55)' : FV.border}`,
              borderRadius: 18, padding: 18, color: FV.fg,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontFamily: FV.fontHeading, fontWeight: 600, fontSize: 16 }}>{f.title}</div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[1,2,3].map(i => (
                    <div key={i} style={{
                      width: 18, height: 4, borderRadius: 2,
                      background: i <= f.intensity ? (data.faith === f.id ? FV.gold : FV.fg2) : 'rgba(247,247,247,0.12)',
                    }}/>
                  ))}
                </div>
              </div>
              <div style={{ fontFamily: FV.fontBody, fontSize: 12.5, color: FV.fg3, marginTop: 5 }}>{f.sub}</div>
              {data.faith === f.id && (
                <div style={{
                  marginTop: 12, paddingTop: 12, borderTop: `1px solid ${FV.border}`,
                  fontFamily: FV.fontScripture, fontSize: 13.5, lineHeight: 1.55, color: FV.fg2,
                  fontStyle: 'italic',
                }}>
                  {f.sample}
                </div>
              )}
            </button>
          ))}
        </div>
      </OnboardingStepFrame>
    );
  }

  if (step === 5) {
    return (
      <OnboardingStepFrame {...frameProps}
        title="Where do you want to grow first?"
        sub="Your identity is already secure in Christ. Choose one growth area to focus your first 30 days. You can adjust your path anytime.">
        {/* FOUNDATION — non-selectable, declarative */}
        <div style={{
          position: 'relative', borderRadius: 18, padding: '18px 18px 18px 18px',
          background: `linear-gradient(180deg, rgba(223,175,55,0.10) 0%, rgba(223,175,55,0.02) 100%), ${FV.elev1}`,
          border: `1px solid rgba(223,175,55,0.32)`,
          marginBottom: 18, overflow: 'hidden',
        }}>
          {/* gold top accent */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 2,
            background: `linear-gradient(90deg, transparent, ${FV.gold} 30%, ${FV.gold} 70%, transparent)`,
          }}/>
          {/* watermark flame */}
          <div style={{ position: 'absolute', right: -12, top: -8, opacity: 0.07, pointerEvents: 'none' }}>
            <img src={FV_ASSETS.flameMark} alt="" style={{ height: 100, width: 'auto' }}/>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, position: 'relative' }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10, flex: 'none',
              background: 'rgba(223,175,55,0.14)',
              border: '1px solid rgba(223,175,55,0.32)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FlameMark size={20}/>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Eyebrow color={FV.gold} style={{ letterSpacing: '0.24em' }}>Foundation</Eyebrow>
              <div style={{
                fontFamily: FV.fontHeading, fontWeight: 600, fontSize: 17,
                color: FV.fg, marginTop: 4, letterSpacing: '-0.005em',
              }}>
                Identity in Christ
              </div>
              <div style={{
                fontFamily: FV.fontBody, fontSize: 12.5, color: FV.fg2,
                marginTop: 4, lineHeight: 1.5, textWrap: 'pretty',
              }}>
                Your worth is not earned by performance. Every path starts here.
              </div>
            </div>
          </div>
        </div>

        {/* Selectable growth options */}
        <Eyebrow style={{ marginBottom: 10 }}>Choose one growth area</Eyebrow>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {GOALS.map(g => (
            <ChoiceCard key={g.id} icon={g.icon} title={g.label} sub={g.sub}
                        selected={data.goal === g.id}
                        onClick={() => set('goal', g.id)}/>
          ))}
        </div>
      </OnboardingStepFrame>
    );
  }

  // Step 6 — Confirmation
  return (
    <OnboardingStepFrame {...frameProps}
      title={`Let's begin, ${data.name || 'athlete'}.`}
      sub="Here's the rhythm we'll start with. You can refine all of this from your profile."
      nextLabel="Start today's rhythm"
      padTop={20}>
      <Card padding={18} radius={18} accent="gold" style={{ marginBottom: 12 }}>
        <Eyebrow color={FV.gold}>Your path</Eyebrow>
        <div style={{ fontFamily: FV.fontHeading, fontWeight: 600, fontSize: 18, marginTop: 6, color: FV.fg }}>
          {GOALS.find(g => g.id === data.goal)?.label}
        </div>
        <div style={{ fontFamily: FV.fontBody, fontSize: 13, color: FV.fg2, marginTop: 4, lineHeight: 1.45 }}>
          {GOALS.find(g => g.id === data.goal)?.sub}
        </div>
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${FV.border}`, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Chip variant="gold">{sportLabel}</Chip>
          <Chip>{positions.find(p => p.id === data.position)?.label}</Chip>
          <Chip>{ages.find(a => a.id === data.ageLevel)?.label}</Chip>
          <Chip>{FAITH_LEVELS.find(f => f.id === data.faith)?.title} faith</Chip>
        </div>
      </Card>

      <div style={{ marginTop: 4, marginBottom: 10 }}>
        <Eyebrow>Focus areas</Eyebrow>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
        {data.challenges.map(c => (
          <Chip key={c} variant="outline">{CHALLENGES.find(x => x.id === c)?.label}</Chip>
        ))}
      </div>

      <Card padding={18} radius={14} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Icon name="clock" size={22} color={FV.gold}/>
        <div>
          <div style={{ fontFamily: FV.fontHeading, fontWeight: 600, fontSize: 14, color: FV.fg }}>5-minute daily rhythm</div>
          <div style={{ fontFamily: FV.fontBody, fontSize: 12.5, color: FV.fg3, marginTop: 2 }}>Center · Truth · Reflect · Train · Carry</div>
        </div>
      </Card>
    </OnboardingStepFrame>
  );
}
window.OnboardingFlow = OnboardingFlow;
