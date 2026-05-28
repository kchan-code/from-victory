// From Victory — Today dashboard, Quick check-in, Full daily training session

// Truth lines vary with faith level
const TRUTHS = {
  open: {
    headline: 'Your worth is not on the scoreboard.',
    truth: 'Today\u2019s performance does not define you. Reset and take the next step.',
    verseRef: 'Truth of the day',
    verseText: '"You are stronger than the thing in front of you. Reset, and go again."',
    scripture: false,
  },
  growing: {
    headline: 'Your worth is not on the scoreboard.',
    truth: 'Today\u2019s game does not define you. Reset, breathe, and take the next faithful step.',
    verseRef: 'Romans 8:37',
    verseText: 'In all these things we are more than conquerors through him who loved us.',
    scripture: true,
  },
  deep: {
    headline: 'Your identity is secure in Christ.',
    truth: 'Today\u2019s performance does not define you. Reset, pray, and take the next faithful step.',
    verseRef: 'Romans 8:37',
    verseText: 'No, in all these things we are more than conquerors through him who loved us.',
    scripture: true,
  },
};
window.FV_TRUTHS = TRUTHS;

// ──────────────────────────────────────────────────────────────
// TODAY DASHBOARD
function TodayScreen({ onNavigate, user, faithLevel = 'growing', rhythmPct = 60, completedToday = ['center'] }) {
  const t = TRUTHS[faithLevel] || TRUTHS.growing;
  const greeting = "Tuesday · Mar 12";
  const remaining = 4 - completedToday.length;

  return (
    <Screen>
      <TopBar
        eyebrow={greeting}
        title={`Good morning, ${user?.name || 'Jordan'}`}
        trailing={
          <button aria-label="Notifications" style={{
            width: 36, height: 36, borderRadius: 999, background: 'transparent',
            border: `1px solid ${FV.border}`, color: FV.fg, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
          }}>
            <Icon name="bell" size={17}/>
            <span style={{ position: 'absolute', top: 8, right: 9, width: 6, height: 6, borderRadius: 999, background: FV.gold }}/>
          </button>
        }
      />

      <div style={{ padding: '4px 20px 20px' }}>
        {/* Identity hero */}
        <div style={{ marginTop: 8, marginBottom: 22 }}>
          <SectionMark style={{ marginBottom: 10 }}>From Victory</SectionMark>
          <div style={{
            fontFamily: FV.fontHeading, fontWeight: 600, fontSize: 26, lineHeight: 1.15,
            color: FV.fg, letterSpacing: '-0.01em', textWrap: 'pretty', maxWidth: 320,
          }}>
            {t.headline}
          </div>
          <div style={{
            fontFamily: FV.fontBody, fontSize: 13.5, lineHeight: 1.5,
            color: FV.fg2, marginTop: 8, maxWidth: 320,
          }}>
            {t.truth}
          </div>
        </div>

        {/* Rhythm card — primary daily action */}
        <Card padding={20} radius={20} style={{ marginBottom: 12 }} accent="gold">
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <RhythmRing pct={rhythmPct} size={88} color={FV.cobalt}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Eyebrow>Today's rhythm</Eyebrow>
              <div style={{ fontFamily: FV.fontHeading, fontWeight: 600, fontSize: 17, color: FV.fg, marginTop: 4, marginBottom: 3 }}>
                {remaining > 0 ? `${remaining} reps to go` : 'Rhythm complete'}
              </div>
              <div style={{ fontFamily: FV.fontBody, fontSize: 12.5, color: FV.fg2 }}>
                {remaining > 0 ? '~3 minutes. Pick up where you are.' : 'Carry the truth into the day.'}
              </div>
            </div>
          </div>
          <div style={{ height: 1, background: FV.border, margin: '16px 0' }}/>
          <Button variant="primary" full
                  trailing={<Icon name="arrowRight" size={14} color="#0B0905" strokeWidth={2}/>}
                  onClick={() => onNavigate('training')}>
            {remaining > 0 ? 'Continue training' : 'Open today\u2019s recap'}
          </Button>
        </Card>

        {/* Quick check-in (shorter mode) */}
        <Card padding={16} radius={14} style={{ marginBottom: 22, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
              onClick={() => onNavigate('checkin')}>
          <div style={{
            width: 38, height: 38, borderRadius: 10, background: FV.cobaltSoft,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none',
          }}>
            <Icon name="zap" size={18} color={FV.cobaltBright}/>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: FV.fontHeading, fontWeight: 600, fontSize: 14, color: FV.fg }}>Three-minute check-in</div>
            <div style={{ fontFamily: FV.fontBody, fontSize: 12, color: FV.fg3 }}>Mood, one truth, one step.</div>
          </div>
          <Icon name="chevronRight" size={18} color={FV.fg3}/>
        </Card>

        {/* Module grid */}
        <Eyebrow style={{ marginBottom: 10 }}>Today's reps</Eyebrow>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <ModuleTile icon="wind"    title="Center"   duration="1 min"
                      done={completedToday.includes('center')}
                      onClick={() => onNavigate('training')}/>
          <ModuleTile icon="book"    title="Truth"    duration="2 min"
                      done={completedToday.includes('truth')}
                      onClick={() => onNavigate('word')}/>
          <ModuleTile icon="pen"     title="Reflect"  duration="3 min"
                      done={completedToday.includes('reflect')}
                      onClick={() => onNavigate('journal')}/>
          <ModuleTile icon="target"  title="Train"    duration="4 min"
                      done={completedToday.includes('train')}/>
        </div>

        {/* Game-day banner */}
        <div style={{ marginTop: 22, marginBottom: 8 }}>
          <Eyebrow>Coming up</Eyebrow>
        </div>
        <div style={{
          position: 'relative', borderRadius: 20, overflow: 'hidden',
          border: `1px solid ${FV.border}`, minHeight: 196,
          background: `
            linear-gradient(180deg, rgba(5,5,5,0.4) 0%, rgba(5,5,5,0.9) 100%),
            radial-gradient(120% 60% at 90% 0%, rgba(36,91,255,0.35), transparent 60%),
            linear-gradient(135deg, ${FV.navy} 0%, ${FV.bg} 70%)`,
        }}>
          {/* watermark flame */}
          <div style={{ position: 'absolute', right: -30, top: -30, opacity: 0.07, height: 250, pointerEvents: 'none' }}>
            <img src={FV_ASSETS.flameMark} alt="" style={{ height: '100%', width: 'auto' }}/>
          </div>
          <div style={{ position: 'absolute', inset: 0, padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <Eyebrow color={FV.gold}>Game · Tonight · 7:30 PM</Eyebrow>
              <div style={{
                fontFamily: FV.fontDisplay, fontWeight: 800, textTransform: 'uppercase',
                letterSpacing: '0.025em', fontSize: 30, lineHeight: 1, color: FV.fg, marginTop: 10,
              }}>
                Breathe.<br/>Focus.<br/>Compete.
              </div>
            </div>
            <Button variant="coachGold" full onClick={() => onNavigate('pregame')}>
              Pre-game reset
            </Button>
          </div>
        </div>

        {/* Recent reflections */}
        <div style={{ marginTop: 26, marginBottom: 8 }}>
          <Eyebrow>Recent reflections</Eyebrow>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <RecentEntry date="Mon" tag="Mistakes" preview="Felt slow in the second period. Reset on the bench. Came back ready."/>
          <RecentEntry date="Sun" tag="Identity"  preview="I'm not the scoreboard. I'm not the last shift. Show up tomorrow."/>
        </div>
      </div>
    </Screen>
  );
}
window.TodayScreen = TodayScreen;

function RecentEntry({ date, tag, preview }) {
  return (
    <div style={{
      background: FV.elev1, border: `1px solid ${FV.border}`, borderRadius: 12,
      padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 8, background: FV.elev2,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        flex: 'none',
      }}>
        <div style={{ fontFamily: FV.fontMono, fontSize: 9, color: FV.fg3, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600 }}>{date}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 2 }}>
          <Chip variant="outline" style={{ padding: '3px 8px', fontSize: 9 }}>{tag}</Chip>
        </div>
        <div style={{
          fontFamily: FV.fontBody, fontSize: 13, color: FV.fg2,
          overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box',
          WebkitBoxOrient: 'vertical', WebkitLineClamp: 1,
        }}>{preview}</div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// QUICK CHECK-IN  (3-minute mode)
const MOODS = [
  { id: 'flat',   label: 'Flat',    color: FV.fg3 },
  { id: 'tense',  label: 'Tense',   color: '#9A8FFF' },
  { id: 'steady', label: 'Steady',  color: FV.success },
  { id: 'fired',  label: 'Fired up',color: FV.gold },
];

function QuickCheckin({ onClose, faithLevel = 'growing', onComplete }) {
  const [step, setStep] = React.useState(0);
  const [mood, setMood] = React.useState(null);
  const [response, setResponse] = React.useState('');
  const [action, setAction] = React.useState(null);
  const t = TRUTHS[faithLevel] || TRUTHS.growing;

  const STEPS = 4;

  const next = () => step < STEPS - 1 ? setStep(step + 1) : (onComplete ? onComplete() : onClose());

  return (
    <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', background: FV.bg, color: FV.fg, overflow: 'hidden' }}>
      <TopBar dense onBack={onClose} eyebrow="Quick check-in" title={`${Math.min(3, Math.ceil((STEPS-step)*0.8))} min remaining`}/>

      <div style={{ padding: '8px 20px 0' }}>
        <StepDots total={STEPS} current={step}/>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 20px' }}>
        {step === 0 && (
          <>
            <h2 style={{ fontFamily: FV.fontHeading, fontWeight: 600, fontSize: 24, lineHeight: 1.2, margin: '4px 0 6px', letterSpacing: '-0.005em' }}>
              How are you walking in?
            </h2>
            <p style={{ color: FV.fg3, fontSize: 13.5, margin: '0 0 26px' }}>One word. No wrong answer.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {MOODS.map(m => (
                <button key={m.id} onClick={() => setMood(m.id)} style={{
                  background: mood === m.id ? 'rgba(223,175,55,0.07)' : FV.elev1,
                  border: `1px solid ${mood === m.id ? 'rgba(223,175,55,0.55)' : FV.border}`,
                  borderRadius: 14, padding: '18px 16px', color: FV.fg, cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start',
                  minHeight: 110, textAlign: 'left',
                }}>
                  <div style={{ width: 12, height: 12, borderRadius: 999, background: m.color }}/>
                  <div style={{ fontFamily: FV.fontHeading, fontWeight: 600, fontSize: 17 }}>{m.label}</div>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <SectionMark style={{ marginBottom: 14 }}>Truth</SectionMark>
            <Card padding={22} radius={20} accent="verse">
              {t.scripture && <VerseRef>{t.verseRef}</VerseRef>}
              <div style={{
                fontFamily: FV.fontScripture, fontSize: 18, lineHeight: 1.55,
                color: FV.fg, marginTop: t.scripture ? 12 : 0, fontWeight: 400,
                fontStyle: t.scripture ? 'normal' : 'italic',
              }}>{t.scripture ? t.verseText : t.truth}</div>
            </Card>
            <p style={{ color: FV.fg2, fontSize: 13.5, marginTop: 22, lineHeight: 1.55 }}>
              Sit with it for ten seconds before you scroll past.
            </p>
          </>
        )}

        {step === 2 && (
          <>
            <h2 style={{ fontFamily: FV.fontHeading, fontWeight: 600, fontSize: 22, lineHeight: 1.2, margin: '4px 0 6px', letterSpacing: '-0.005em' }}>
              One reflection.
            </h2>
            <p style={{ color: FV.fg3, fontSize: 13.5, margin: '0 0 16px' }}>
              What's one thing you're carrying — and what's one thing you can leave?
            </p>
            <textarea value={response} onChange={e => setResponse(e.target.value)}
                      placeholder="Carrying… leaving…"
                      style={{
                        width: '100%', boxSizing: 'border-box', minHeight: 140,
                        background: FV.elev2, border: `1px solid ${FV.border}`,
                        borderRadius: 14, padding: 16, color: FV.fg,
                        fontFamily: FV.fontBody, fontSize: 14, lineHeight: 1.6,
                        outline: 'none', resize: 'none',
                      }}/>
          </>
        )}

        {step === 3 && (
          <>
            <h2 style={{ fontFamily: FV.fontHeading, fontWeight: 600, fontSize: 22, lineHeight: 1.2, margin: '4px 0 6px', letterSpacing: '-0.005em' }}>
              One controllable.
            </h2>
            <p style={{ color: FV.fg3, fontSize: 13.5, margin: '0 0 16px' }}>
              One thing inside your control today.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['First-shift effort', 'Body language on the bench', 'Three deep breaths before each shift', 'Encourage one teammate'].map(opt => (
                <ChoiceCard key={opt} title={opt} selected={action === opt} onClick={() => setAction(opt)} dense/>
              ))}
            </div>
          </>
        )}
      </div>

      <div style={{ padding: '12px 20px 28px', borderTop: `1px solid ${FV.border}`, background: 'rgba(5,5,5,0.85)', backdropFilter: 'blur(12px)' }}>
        <Button variant="primary" full size="lg" onClick={next}
                trailing={step < STEPS - 1 ? <Icon name="arrowRight" size={16} color="#0B0905" strokeWidth={2}/> : null}
                disabled={step === 0 && !mood}>
          {step < STEPS - 1 ? 'Next' : 'Carry it'}
        </Button>
      </div>
    </div>
  );
}
window.QuickCheckin = QuickCheckin;

// ──────────────────────────────────────────────────────────────
// FULL DAILY TRAINING SESSION (Center → Truth → Reflect → Train → Carry)
const SESSION_STEPS = [
  { id: 'center',  label: 'Center',  icon: 'wind',   sub: 'Breath' },
  { id: 'truth',   label: 'Truth',   icon: 'book',   sub: 'Scripture' },
  { id: 'reflect', label: 'Reflect', icon: 'pen',    sub: 'Journal' },
  { id: 'train',   label: 'Train',   icon: 'target', sub: 'Mindset' },
  { id: 'carry',   label: 'Carry',   icon: 'flame',  sub: 'One step' },
];

function TrainingSession({ onClose, faithLevel = 'growing', onComplete }) {
  const [step, setStep] = React.useState(0);
  const t = TRUTHS[faithLevel] || TRUTHS.growing;
  const current = SESSION_STEPS[step];

  const next = () => step < SESSION_STEPS.length - 1 ? setStep(step + 1) : (onComplete ? onComplete() : onClose());
  const prev = () => step > 0 ? setStep(step - 1) : onClose();

  return (
    <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', background: FV.bg, color: FV.fg, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '60px 20px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={prev} aria-label="Back" style={{
          width: 36, height: 36, borderRadius: 999, background: 'transparent',
          border: `1px solid ${FV.border}`, color: FV.fg, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none',
        }}><Icon name="arrowLeft" size={18}/></button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <Eyebrow style={{ marginBottom: 2 }}>Daily training · {step+1} of {SESSION_STEPS.length}</Eyebrow>
          <div style={{ fontFamily: FV.fontDisplay, fontWeight: 800, fontSize: 18, textTransform: 'uppercase', letterSpacing: '0.08em', color: FV.fg }}>{current.label}</div>
        </div>
        <button onClick={onClose} aria-label="Close" style={{
          width: 36, height: 36, borderRadius: 999, background: 'transparent',
          border: `1px solid ${FV.border}`, color: FV.fg, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none',
        }}><Icon name="close" size={16}/></button>
      </div>

      {/* Step pips */}
      <div style={{ padding: '12px 24px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${SESSION_STEPS.length}, 1fr)`, gap: 6 }}>
          {SESSION_STEPS.map((s, i) => (
            <div key={s.id} style={{
              height: 3, borderRadius: 2,
              background: i <= step ? FV.gold : 'rgba(247,247,247,0.12)',
              transition: `background 280ms ${FV.easeOut}`,
            }}/>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 12px' }}>
        {step === 0 && <SessionCenter/>}
        {step === 1 && <SessionTruth t={t}/>}
        {step === 2 && <SessionReflect/>}
        {step === 3 && <SessionTrain/>}
        {step === 4 && <SessionCarry t={t}/>}
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 20px 28px', borderTop: `1px solid ${FV.border}`, background: 'rgba(5,5,5,0.85)', backdropFilter: 'blur(12px)' }}>
        <Button variant="primary" full size="lg" onClick={next}
                trailing={step < SESSION_STEPS.length - 1 ? <Icon name="arrowRight" size={16} color="#0B0905" strokeWidth={2}/> : null}>
          {step < SESSION_STEPS.length - 1 ? `Continue \u2192 ${SESSION_STEPS[step+1].label}` : 'Carry it into the day'}
        </Button>
      </div>
    </div>
  );
}
window.TrainingSession = TrainingSession;

// — Step 1: Center (breath)
function SessionCenter() {
  const [phase, setPhase] = React.useState('inhale'); // inhale | hold | exhale
  const [count, setCount] = React.useState(1);
  React.useEffect(() => {
    const seq = [
      { p: 'inhale',  d: 4000 },
      { p: 'hold',    d: 2000 },
      { p: 'exhale',  d: 6000 },
    ];
    let i = 0;
    const tick = () => {
      setPhase(seq[i].p);
      if (i === 0 && phase === 'exhale') setCount(c => Math.min(c + 1, 3));
      const t = setTimeout(() => { i = (i + 1) % seq.length; if (i === 0) setCount(c => Math.min(c + 1, 3)); tick(); }, seq[i].d);
      return t;
    };
    const t = tick();
    return () => clearTimeout(t);
  }, []);
  const label = phase === 'inhale' ? 'Inhale' : phase === 'hold' ? 'Hold' : 'Exhale';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingTop: 12 }}>
      <Eyebrow color={FV.gold} style={{ marginBottom: 18 }}>Breath {Math.min(count, 3)} of 3</Eyebrow>
      <p style={{ fontFamily: FV.fontBody, fontSize: 14, color: FV.fg2, margin: '0 0 14px', maxWidth: 300, lineHeight: 1.55 }}>
        Find your center before you train. Box breath — four in, two hold, six out.
      </p>
      <p style={{ fontFamily: FV.fontBody, fontSize: 12.5, color: FV.fg3, margin: '0 0 26px', maxWidth: 280, lineHeight: 1.55 }}>
        Breathe with your diaphragm. Belly rises, chest stays still.
      </p>
      <div style={{ position: 'relative', width: 220, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <style>{`
          @keyframes fvBreatheIn  { from { transform: scale(0.7); } to { transform: scale(1.0); } }
          @keyframes fvBreatheOut { from { transform: scale(1.0); } to { transform: scale(0.7); } }
        `}</style>
        {/* concentric rings */}
        <div style={{
          position: 'absolute', width: 220, height: 220, borderRadius: '50%',
          border: `1px solid rgba(36,91,255,0.18)`,
        }}/>
        <div style={{
          position: 'absolute', width: 170, height: 170, borderRadius: '50%',
          border: `1px solid rgba(36,91,255,0.32)`,
        }}/>
        <div style={{
          width: 130, height: 130, borderRadius: '50%',
          background: `radial-gradient(circle at 35% 30%, rgba(223,175,55,0.45), rgba(36,91,255,0.4) 60%, rgba(7,26,51,0.6) 100%)`,
          boxShadow: `0 0 60px rgba(36,91,255,0.25)`,
          transition: phase === 'inhale' ? 'transform 4s cubic-bezier(0.4,0,0.4,1)' : phase === 'exhale' ? 'transform 6s cubic-bezier(0.4,0,0.4,1)' : 'transform 0.2s ease-out',
          transform: phase === 'inhale' ? 'scale(1)' : phase === 'exhale' ? 'scale(0.65)' : 'scale(1)',
        }}/>
      </div>
      <div style={{ marginTop: 28, fontFamily: FV.fontDisplay, fontWeight: 700, fontSize: 26, textTransform: 'uppercase', letterSpacing: '0.16em', color: FV.fg }}>
        {label}
      </div>
    </div>
  );
}

// — Step 2: Truth
function SessionTruth({ t }) {
  return (
    <div style={{ paddingTop: 12 }}>
      <Card padding={24} radius={20} accent="verse">
        {t.scripture && <VerseRef>{t.verseRef}</VerseRef>}
        <div style={{
          fontFamily: FV.fontScripture, fontSize: 22, lineHeight: 1.5,
          color: FV.fg, marginTop: t.scripture ? 14 : 0,
        }}>
          {t.scripture ? `\u201C${t.verseText}\u201D` : t.headline}
        </div>
      </Card>
      <div style={{ height: 1, background: FV.border, margin: '24px 0 18px' }}/>
      <Eyebrow style={{ marginBottom: 8 }}>Identity statement</Eyebrow>
      <div style={{
        fontFamily: FV.fontHeading, fontWeight: 500, fontSize: 18, lineHeight: 1.35,
        color: FV.fg, letterSpacing: '-0.005em',
      }}>
        I'm not what I did last shift.<br/>I'm secure. I show up again.
      </div>
    </div>
  );
}

// — Step 3: Reflect
function SessionReflect() {
  const [text, setText] = React.useState('');
  return (
    <div style={{ paddingTop: 12 }}>
      <Eyebrow color={FV.gold} style={{ marginBottom: 10 }}>Today's prompt</Eyebrow>
      <div style={{
        fontFamily: FV.fontHeading, fontWeight: 600, fontSize: 21, lineHeight: 1.25,
        color: FV.fg, letterSpacing: '-0.005em', marginBottom: 18,
      }}>
        Name one mistake you're afraid of making. Then write how you'll respond if it happens.
      </div>
      <textarea value={text} onChange={e => setText(e.target.value)}
                placeholder="Write as much or as little as you need…"
                style={{
                  width: '100%', boxSizing: 'border-box', minHeight: 180,
                  background: FV.elev2, border: `1px solid ${FV.border}`,
                  borderRadius: 16, padding: 18, color: FV.fg,
                  fontFamily: FV.fontBody, fontSize: 14.5, lineHeight: 1.7,
                  outline: 'none', resize: 'none',
                }}/>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
        <Eyebrow>Private to your device</Eyebrow>
        <Eyebrow color={FV.fg3}>{text.length} chars</Eyebrow>
      </div>
    </div>
  );
}

// — Step 4: Train
function SessionTrain() {
  const [picked, setPicked] = React.useState(null);
  return (
    <div style={{ paddingTop: 12 }}>
      <Eyebrow color={FV.gold} style={{ marginBottom: 8 }}>Mindset rep</Eyebrow>
      <div style={{
        fontFamily: FV.fontHeading, fontWeight: 600, fontSize: 22, lineHeight: 1.25,
        letterSpacing: '-0.005em', color: FV.fg, marginBottom: 18,
      }}>
        Visualize the reset.
      </div>
      <p style={{ fontFamily: FV.fontBody, fontSize: 13.5, color: FV.fg2, margin: '0 0 18px', lineHeight: 1.55 }}>
        Picture the mistake happening. Then picture what comes next — the breath, the cue, the next play. Walk through it three times.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          { id: 'puck',   label: 'I lose the puck at the blue line', cue: 'Three steps. Back-check hard. Reset.' },
          { id: 'shift',  label: 'Bad first shift', cue: 'Bench. Two breaths. Coach the next line.' },
          { id: 'penalty',label: 'I take a penalty', cue: 'Don\u2019t argue. Walk to the box. Show up on the kill.' },
        ].map(s => (
          <button key={s.id} onClick={() => setPicked(s.id)} style={{
            textAlign: 'left', cursor: 'pointer',
            background: picked === s.id ? 'rgba(223,175,55,0.07)' : FV.elev1,
            border: `1px solid ${picked === s.id ? 'rgba(223,175,55,0.55)' : FV.border}`,
            borderRadius: 14, padding: 16, color: FV.fg,
          }}>
            <div style={{ fontFamily: FV.fontHeading, fontWeight: 600, fontSize: 14 }}>{s.label}</div>
            {picked === s.id && (
              <div style={{
                marginTop: 10, paddingTop: 10, borderTop: `1px solid ${FV.border}`,
                fontFamily: FV.fontMono, fontSize: 11, letterSpacing: '0.12em',
                color: FV.gold, textTransform: 'uppercase', fontWeight: 600,
              }}>Cue · {s.cue}</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// — Step 5: Carry
function SessionCarry({ t }) {
  return (
    <div style={{ paddingTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
      <FlameMark size={56} style={{ marginBottom: 18, filter: 'drop-shadow(0 0 24px rgba(223,175,55,0.3))' }}/>
      <Eyebrow color={FV.gold} style={{ marginBottom: 16 }}>Carry</Eyebrow>
      <div style={{
        fontFamily: FV.fontDisplay, fontWeight: 800, textTransform: 'uppercase',
        letterSpacing: '0.02em', fontSize: 32, lineHeight: 0.95, color: FV.fg,
        textWrap: 'balance', maxWidth: 300,
      }}>
        Rhythm started.<br/>Carry the truth.
      </div>
      <Card padding={20} radius={16} accent="verse" style={{ marginTop: 28, textAlign: 'left', width: '100%' }}>
        <Eyebrow color={FV.gold}>One phrase for today</Eyebrow>
        <div style={{
          fontFamily: FV.fontScripture, fontSize: 19, lineHeight: 1.4,
          color: FV.fg, marginTop: 10,
        }}>
          {t.scripture ? '\u201CMore than conquerors.\u201D' : '\u201CI\u2019m not the scoreboard.\u201D'}
        </div>
      </Card>
      <div style={{ marginTop: 22 }}>
        <Eyebrow>You can return any time. Today's rhythm is complete.</Eyebrow>
      </div>
    </div>
  );
}
