// From Victory — Pre-game flow + Post-game reset flow

// ──────────────────────────────────────────────────────────────
// PRE-GAME MINDSET FLOW — Coach-mode, cinematic
const PREGAME_STEPS = ['intro', 'breath', 'identity', 'focus', 'controllable', 'ready'];

function PregameFlow({ onClose, faithLevel = 'growing', onComplete }) {
  const [step, setStep] = React.useState(0);
  const [focusCue, setFocusCue] = React.useState(null);
  const [controllable, setControllable] = React.useState(null);
  const t = window.FV_TRUTHS[faithLevel] || window.FV_TRUTHS.growing;
  const next = () => step < PREGAME_STEPS.length - 1 ? setStep(step + 1) : (onComplete ? onComplete() : onClose());
  const prev = () => step > 0 ? setStep(step - 1) : onClose();
  const current = PREGAME_STEPS[step];

  // Cinematic background image
  const bg = (
    <div aria-hidden style={{
      position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0,
      background: `
        linear-gradient(180deg, rgba(5,5,5,0.55) 0%, rgba(5,5,5,0.92) 100%),
        radial-gradient(80% 60% at 30% 20%, rgba(36,91,255,0.4), transparent 60%),
        radial-gradient(60% 40% at 80% 90%, rgba(223,175,55,0.18), transparent 60%),
        linear-gradient(135deg, ${FV.navy} 0%, ${FV.bg} 70%)`,
    }}>
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.12, mixBlendMode: 'screen',
        background: `radial-gradient(2px 2px at 20% 30%, #fff, transparent), radial-gradient(2px 2px at 60% 70%, #fff, transparent), radial-gradient(1px 1px at 40% 50%, #fff, transparent)`,
        backgroundSize: '180px 180px, 240px 240px, 120px 120px',
      }}/>
      <div style={{
        position: 'absolute', right: -80, bottom: -40, opacity: 0.08,
      }}>
        <img src={FV_ASSETS.flameMark} alt="" style={{ height: 480, width: 'auto' }}/>
      </div>
    </div>
  );

  return (
    <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', color: FV.fg, overflow: 'hidden' }}>
      {bg}

      {/* Header */}
      <div style={{ position: 'relative', zIndex: 2, padding: '60px 20px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={prev} aria-label="Back" style={{
          width: 36, height: 36, borderRadius: 999, background: 'rgba(5,5,5,0.5)',
          border: `1px solid ${FV.border}`, color: FV.fg, cursor: 'pointer',
          backdropFilter: 'blur(8px)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none',
        }}><Icon name="arrowLeft" size={18}/></button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <Eyebrow color={FV.gold} style={{ letterSpacing: '0.24em' }}>Pre-game reset</Eyebrow>
        </div>
        <button onClick={onClose} aria-label="Close" style={{
          width: 36, height: 36, borderRadius: 999, background: 'rgba(5,5,5,0.5)',
          border: `1px solid ${FV.border}`, color: FV.fg, cursor: 'pointer',
          backdropFilter: 'blur(8px)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none',
        }}><Icon name="close" size={16}/></button>
      </div>

      {/* Step pips */}
      <div style={{ position: 'relative', zIndex: 2, padding: '12px 24px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${PREGAME_STEPS.length}, 1fr)`, gap: 5 }}>
          {PREGAME_STEPS.map((s, i) => (
            <div key={s} style={{
              height: 3, borderRadius: 2,
              background: i <= step ? FV.gold : 'rgba(247,247,247,0.18)',
              transition: 'background 280ms ease-out',
            }}/>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 2, padding: '0 24px' }}>
        {current === 'intro' && <PregameIntro/>}
        {current === 'breath' && <PregameBreath/>}
        {current === 'identity' && <PregameIdentity t={t}/>}
        {current === 'focus' && <PregameFocus value={focusCue} onChange={setFocusCue}/>}
        {current === 'controllable' && <PregameControllable value={controllable} onChange={setControllable}/>}
        {current === 'ready' && <PregameReady focusCue={focusCue} controllable={controllable}/>}
      </div>

      {/* Footer */}
      <div style={{ position: 'relative', zIndex: 2, padding: '12px 20px 28px' }}>
        <Button variant="coachGold" full size="lg" onClick={next}>
          {current === 'ready' ? 'Step on the ice' : current === 'intro' ? 'Begin' : 'Next'}
        </Button>
      </div>
    </div>
  );
}
window.PregameFlow = PregameFlow;

function PregameIntro() {
  return (
    <div style={{ paddingTop: 36, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Eyebrow color={FV.gold} style={{ marginBottom: 16, letterSpacing: '0.28em' }}>Game · 7:30 PM</Eyebrow>
      <div style={{
        fontFamily: FV.fontDisplay, fontWeight: 800, textTransform: 'uppercase',
        letterSpacing: '0.005em', fontSize: 56, lineHeight: 0.92, color: FV.fg,
      }}>
        Breathe.<br/>Focus.<br/><span style={{ color: FV.gold }}>Compete.</span>
      </div>
      <div style={{ height: 1, background: 'rgba(247,247,247,0.18)', margin: '32px 0 22px' }}/>
      <p style={{
        fontFamily: FV.fontBody, fontSize: 15, color: FV.fg2,
        lineHeight: 1.55, margin: 0, maxWidth: 320,
      }}>
        You are not the scoreboard. You are not the last game. Three breaths, one truth, one cue. Then we step on.
      </p>
    </div>
  );
}

function PregameBreath() {
  const [phase, setPhase] = React.useState('inhale');
  const [breath, setBreath] = React.useState(1);
  React.useEffect(() => {
    const seq = [{ p: 'inhale', d: 4000 }, { p: 'hold', d: 2000 }, { p: 'exhale', d: 6000 }];
    let i = 0;
    let timer;
    const run = () => {
      setPhase(seq[i].p);
      timer = setTimeout(() => {
        i = (i + 1) % seq.length;
        if (i === 0) setBreath(b => Math.min(b + 1, 3));
        run();
      }, seq[i].d);
    };
    run();
    return () => clearTimeout(timer);
  }, []);
  return (
    <div style={{ paddingTop: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
      <Eyebrow color={FV.gold} style={{ letterSpacing: '0.28em', marginBottom: 14 }}>Box breath {Math.min(breath, 3)} of 3</Eyebrow>
      <div style={{ position: 'relative', width: 240, height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>
        <div style={{
          position: 'absolute', width: 240, height: 240, borderRadius: '50%',
          border: `1px solid rgba(223,175,55,0.18)`,
        }}/>
        <div style={{
          position: 'absolute', width: 190, height: 190, borderRadius: '50%',
          border: `1px solid rgba(223,175,55,0.32)`,
        }}/>
        <div style={{
          width: 150, height: 150, borderRadius: '50%',
          background: `radial-gradient(circle at 35% 30%, rgba(244,194,79,0.55), rgba(223,175,55,0.35) 60%, rgba(7,26,51,0.6) 100%)`,
          boxShadow: '0 0 80px rgba(223,175,55,0.3)',
          transition: phase === 'inhale' ? 'transform 4s cubic-bezier(0.4,0,0.4,1)' : phase === 'exhale' ? 'transform 6s cubic-bezier(0.4,0,0.4,1)' : 'transform 0.2s ease-out',
          transform: phase === 'inhale' ? 'scale(1)' : phase === 'exhale' ? 'scale(0.6)' : 'scale(1)',
        }}/>
      </div>
      <div style={{
        marginTop: 24, fontFamily: FV.fontDisplay, fontWeight: 800,
        fontSize: 32, textTransform: 'uppercase', letterSpacing: '0.14em', color: FV.fg,
      }}>{phase}</div>
      <div style={{ marginTop: 6, fontFamily: FV.fontMono, fontSize: 11, letterSpacing: '0.18em', color: FV.fg3, textTransform: 'uppercase', fontWeight: 600 }}>
        4 in · 2 hold · 6 out
      </div>
      <div style={{ marginTop: 14, fontFamily: FV.fontBody, fontSize: 12.5, color: FV.fg3, textAlign: 'center', maxWidth: 280, lineHeight: 1.5 }}>
        Diaphragm breath — belly rises, chest stays still.
      </div>
    </div>
  );
}

function PregameIdentity({ t }) {
  return (
    <div style={{ paddingTop: 24, display: 'flex', flexDirection: 'column' }}>
      <Eyebrow color={FV.gold} style={{ marginBottom: 16, letterSpacing: '0.24em' }}>Identity</Eyebrow>
      <div style={{
        fontFamily: FV.fontDisplay, fontWeight: 800, textTransform: 'uppercase',
        letterSpacing: '0.005em', fontSize: 42, lineHeight: 0.95, color: FV.fg,
      }}>
        Your identity<br/>is <span style={{ color: FV.gold }}>not</span><br/>on the<br/>scoreboard.
      </div>
      {t.scripture && (
        <Card padding={18} radius={16} accent="verse" style={{ marginTop: 28, background: 'rgba(16,16,16,0.72)', backdropFilter: 'blur(8px)' }}>
          <VerseRef>{t.verseRef}</VerseRef>
          <div style={{
            fontFamily: FV.fontScripture, fontSize: 16, lineHeight: 1.5,
            color: FV.fg, marginTop: 10,
          }}>"{t.verseText}"</div>
        </Card>
      )}
    </div>
  );
}

const FOCUS_CUES = [
  { id: 'shift1',   label: 'Three steps. Hard first shift.', cue: 'Move feet. Win the wall.' },
  { id: 'breath',   label: 'Breathe before every faceoff.',  cue: 'Two breaths. Lock in.' },
  { id: 'recover',  label: 'Mistake \u2192 ten seconds \u2192 reset.', cue: 'Drop it. Run the next play.' },
  { id: 'voice',    label: 'Talk to a teammate every shift.',cue: 'Lift one. Compete together.' },
];

function PregameFocus({ value, onChange }) {
  return (
    <div style={{ paddingTop: 24 }}>
      <Eyebrow color={FV.gold} style={{ marginBottom: 10 }}>Focus cue</Eyebrow>
      <div style={{ fontFamily: FV.fontHeading, fontWeight: 600, fontSize: 22, lineHeight: 1.25, color: FV.fg, marginBottom: 18, textWrap: 'balance' }}>
        Pick one cue to anchor every shift.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {FOCUS_CUES.map(f => (
          <button key={f.id} onClick={() => onChange(f.id)} style={{
            textAlign: 'left', cursor: 'pointer',
            background: value === f.id ? 'rgba(223,175,55,0.10)' : 'rgba(16,16,16,0.7)',
            border: `1px solid ${value === f.id ? 'rgba(223,175,55,0.55)' : FV.border}`,
            borderRadius: 14, padding: 14, color: FV.fg, backdropFilter: 'blur(6px)',
          }}>
            <div style={{ fontFamily: FV.fontHeading, fontWeight: 600, fontSize: 14 }}>{f.label}</div>
            {value === f.id && (
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${FV.border}`, fontFamily: FV.fontMono, fontSize: 10, letterSpacing: '0.16em', color: FV.gold, textTransform: 'uppercase', fontWeight: 600 }}>
                Cue · {f.cue}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function PregameControllable({ value, onChange }) {
  const OPTIONS = ['Effort on every shift', 'Body language on the bench', 'Encourage one teammate', 'First puck — be ready'];
  return (
    <div style={{ paddingTop: 24 }}>
      <Eyebrow color={FV.gold} style={{ marginBottom: 10 }}>Controllable</Eyebrow>
      <div style={{ fontFamily: FV.fontHeading, fontWeight: 600, fontSize: 22, lineHeight: 1.25, color: FV.fg, marginBottom: 18, textWrap: 'balance' }}>
        One thing inside your control tonight.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {OPTIONS.map(o => (
          <button key={o} onClick={() => onChange(o)} style={{
            textAlign: 'left', cursor: 'pointer',
            background: value === o ? 'rgba(223,175,55,0.10)' : 'rgba(16,16,16,0.7)',
            border: `1px solid ${value === o ? 'rgba(223,175,55,0.55)' : FV.border}`,
            borderRadius: 14, padding: '14px 16px', color: FV.fg, backdropFilter: 'blur(6px)',
            fontFamily: FV.fontHeading, fontWeight: 600, fontSize: 14,
          }}>{o}</button>
        ))}
      </div>
    </div>
  );
}

function PregameReady({ focusCue, controllable }) {
  const f = FOCUS_CUES.find(x => x.id === focusCue);
  return (
    <div style={{ paddingTop: 28, display: 'flex', flexDirection: 'column' }}>
      <FlameMark size={42} style={{ marginBottom: 18, filter: 'drop-shadow(0 0 24px rgba(223,175,55,0.4))' }}/>
      <Eyebrow color={FV.gold} style={{ marginBottom: 14, letterSpacing: '0.28em' }}>Ready</Eyebrow>
      <div style={{
        fontFamily: FV.fontDisplay, fontWeight: 800, textTransform: 'uppercase',
        letterSpacing: '0.005em', fontSize: 44, lineHeight: 0.92, color: FV.fg,
      }}>
        Compete<br/>from <span style={{ color: FV.gold }}>victory</span>.
      </div>

      <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Card padding={16} radius={12} style={{ background: 'rgba(16,16,16,0.7)', backdropFilter: 'blur(6px)' }}>
          <Eyebrow color={FV.gold}>Focus cue</Eyebrow>
          <div style={{ fontFamily: FV.fontHeading, fontSize: 15, fontWeight: 600, marginTop: 4, color: FV.fg }}>{f?.label || 'Three steps. Hard first shift.'}</div>
        </Card>
        <Card padding={16} radius={12} style={{ background: 'rgba(16,16,16,0.7)', backdropFilter: 'blur(6px)' }}>
          <Eyebrow color={FV.gold}>Controllable</Eyebrow>
          <div style={{ fontFamily: FV.fontHeading, fontSize: 15, fontWeight: 600, marginTop: 4, color: FV.fg }}>{controllable || 'Effort on every shift'}</div>
        </Card>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// POST-GAME RESET FLOW
const POSTGAME_STEPS = ['result', 'wentwell', 'hard', 'mistake', 'release', 'carry', 'done'];

function PostgameFlow({ onClose, faithLevel = 'growing', onComplete }) {
  const [step, setStep] = React.useState(0);
  const [state, setState] = React.useState({ result: null, wentWell: '', hard: '', mistake: '', release: '', carry: '' });
  const t = window.FV_TRUTHS[faithLevel] || window.FV_TRUTHS.growing;
  const set = (k, v) => setState(s => ({ ...s, [k]: v }));
  const next = () => step < POSTGAME_STEPS.length - 1 ? setStep(step + 1) : (onComplete ? onComplete() : onClose());
  const prev = () => step > 0 ? setStep(step - 1) : onClose();

  const c = POSTGAME_STEPS[step];

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
          <Eyebrow>Post-game reset</Eyebrow>
        </div>
        <button onClick={onClose} aria-label="Close" style={{
          width: 36, height: 36, borderRadius: 999, background: 'transparent',
          border: `1px solid ${FV.border}`, color: FV.fg, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none',
        }}><Icon name="close" size={16}/></button>
      </div>

      {/* Progress */}
      <div style={{ padding: '12px 24px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${POSTGAME_STEPS.length}, 1fr)`, gap: 5 }}>
          {POSTGAME_STEPS.map((s, i) => (
            <div key={s} style={{ height: 3, borderRadius: 2, background: i <= step ? FV.gold : 'rgba(247,247,247,0.12)' }}/>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 12px' }}>
        {c === 'result' && (
          <>
            <div style={{
              fontFamily: FV.fontDisplay, fontWeight: 800, textTransform: 'uppercase',
              letterSpacing: '0.02em', fontSize: 36, lineHeight: 0.95, color: FV.fg,
              marginBottom: 14, textWrap: 'balance',
            }}>
              Win or lose,<br/>your identity<br/>is <span style={{ color: FV.gold }}>secure</span>.
            </div>
            <p style={{ fontFamily: FV.fontBody, fontSize: 14, color: FV.fg2, margin: '0 0 26px', lineHeight: 1.55 }}>
              Tonight is a teacher, not a verdict. Let's reflect, release, and grow.
            </p>
            <Eyebrow style={{ marginBottom: 10 }}>How did tonight go?</Eyebrow>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {['Win', 'Loss', 'Mixed'].map(r => (
                <button key={r} onClick={() => set('result', r)} style={{
                  background: state.result === r ? 'rgba(223,175,55,0.10)' : FV.elev1,
                  border: `1px solid ${state.result === r ? 'rgba(223,175,55,0.55)' : FV.border}`,
                  borderRadius: 12, padding: '14px 8px', color: FV.fg, cursor: 'pointer',
                  fontFamily: FV.fontHeading, fontWeight: 600, fontSize: 14,
                }}>{r}</button>
              ))}
            </div>
          </>
        )}

        {c === 'wentwell' && (
          <PostgamePrompt eyebrow="What went well?" title="Name one thing you're proud of."
                          sub="One shift, one rep, one habit. Big or small."
                          value={state.wentWell} onChange={v => set('wentWell', v)}
                          placeholder="Tonight I…"/>
        )}
        {c === 'hard' && (
          <PostgamePrompt eyebrow="What was hard?" title="Name one thing that was tough."
                          sub="No shame here. Just honest naming."
                          value={state.hard} onChange={v => set('hard', v)}
                          placeholder="The hardest part was…"/>
        )}
        {c === 'mistake' && (
          <PostgamePrompt eyebrow="Mistake \u2192 training" title="Turn a mistake into a rep."
                          sub="Pick one moment from tonight. What's the next-time cue?"
                          value={state.mistake} onChange={v => set('mistake', v)}
                          placeholder="Next time I will…"/>
        )}
        {c === 'release' && (
          <PostgamePrompt eyebrow="Release" title="What needs to be left here?"
                          sub="One thing you will not carry into tomorrow."
                          value={state.release} onChange={v => set('release', v)}
                          placeholder="I'm leaving…"/>
        )}
        {c === 'carry' && (
          <PostgamePrompt eyebrow="Carry" title="One thing to carry forward."
                          sub="A truth, a cue, a thank-you."
                          value={state.carry} onChange={v => set('carry', v)}
                          placeholder="I'm carrying…"/>
        )}

        {c === 'done' && (
          <div style={{ paddingTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <FlameMark size={56} style={{ marginBottom: 18, filter: 'drop-shadow(0 0 24px rgba(223,175,55,0.3))' }}/>
            <Eyebrow color={FV.gold} style={{ marginBottom: 14, letterSpacing: '0.24em' }}>Reset complete</Eyebrow>
            <div style={{
              fontFamily: FV.fontDisplay, fontWeight: 800, textTransform: 'uppercase',
              letterSpacing: '0.02em', fontSize: 32, lineHeight: 0.95, color: FV.fg,
              marginBottom: 24,
            }}>
              Reflected.<br/>Released.<br/>Growing.
            </div>
            {t.scripture && (
              <Card padding={20} radius={16} accent="verse" style={{ textAlign: 'left', width: '100%' }}>
                <VerseRef>{t.verseRef}</VerseRef>
                <div style={{ fontFamily: FV.fontScripture, fontSize: 16, lineHeight: 1.5, color: FV.fg, marginTop: 10 }}>
                  "{t.verseText}"
                </div>
              </Card>
            )}
            {!t.scripture && (
              <Card padding={20} radius={16} accent="verse" style={{ textAlign: 'left', width: '100%' }}>
                <Eyebrow color={FV.gold}>Carry</Eyebrow>
                <div style={{ fontFamily: FV.fontHeading, fontWeight: 600, fontSize: 17, lineHeight: 1.4, color: FV.fg, marginTop: 8 }}>
                  {state.carry || 'You\u2019re still you. Show up tomorrow.'}
                </div>
              </Card>
            )}
          </div>
        )}
      </div>

      <div style={{ padding: '12px 20px 28px', borderTop: `1px solid ${FV.border}`, background: 'rgba(5,5,5,0.85)', backdropFilter: 'blur(12px)' }}>
        <Button variant="primary" full size="lg" onClick={next}
                trailing={c !== 'done' ? <Icon name="arrowRight" size={16} color="#0B0905" strokeWidth={2}/> : null}>
          {c === 'done' ? 'Back to today' : c === 'result' ? 'Continue' : 'Next'}
        </Button>
      </div>
    </div>
  );
}
window.PostgameFlow = PostgameFlow;

function PostgamePrompt({ eyebrow, title, sub, value, onChange, placeholder }) {
  return (
    <>
      <Eyebrow color={FV.gold} style={{ marginBottom: 10 }}>{eyebrow}</Eyebrow>
      <div style={{
        fontFamily: FV.fontHeading, fontWeight: 600, fontSize: 22, lineHeight: 1.25,
        letterSpacing: '-0.005em', color: FV.fg, marginBottom: 8,
      }}>{title}</div>
      <p style={{ fontFamily: FV.fontBody, fontSize: 13.5, color: FV.fg3, margin: '0 0 18px', lineHeight: 1.5 }}>
        {sub}
      </p>
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
                style={{
                  width: '100%', boxSizing: 'border-box', minHeight: 140,
                  background: FV.elev2, border: `1px solid ${FV.border}`,
                  borderRadius: 14, padding: 16, color: FV.fg,
                  fontFamily: FV.fontBody, fontSize: 14.5, lineHeight: 1.65,
                  outline: 'none', resize: 'none',
                }}/>
    </>
  );
}
