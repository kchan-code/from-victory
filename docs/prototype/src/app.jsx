// From Victory — App router + Tweaks

const DEFAULT_USER = {
  name: 'Jordan',
  ageLevel: 'u15',
  sport: 'hockey',
  position: 'forward',
  challenges: ['confidence', 'mistakes'],
  faith: 'growing',
  goal: 'discipline',
};

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "faithIntensity": "growing",
  "skipOnboarding": false,
  "rhythmStyle": "ring",
  "showJumper": true
}/*EDITMODE-END*/;

function FromVictoryApp() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // route state
  // phase: 'splash' | 'welcome' | 'onboarding' | 'app'
  const [phase, setPhase] = React.useState(t.skipOnboarding ? 'app' : 'splash');
  const [user, setUser] = React.useState(DEFAULT_USER);

  // tab + overlay route inside app
  const [tab, setTab] = React.useState('today');
  const [overlay, setOverlay] = React.useState(null); // null | 'pregame' | 'postgame' | 'training' | 'checkin' | 'weeklyReview'
  const [completedToday, setCompletedToday] = React.useState(['center']);

  // sync skipOnboarding tweak with phase
  React.useEffect(() => {
    if (t.skipOnboarding && phase !== 'app') setPhase('app');
  }, [t.skipOnboarding]);

  const navigate = (route) => {
    if (route === 'pregame' || route === 'postgame' || route === 'training' || route === 'checkin' || route === 'weeklyReview') {
      setOverlay(route);
    } else if (route === 'word') {
      setTab('word');
    } else if (route === 'journal') {
      setTab('journal');
    } else if (route === 'today') {
      setTab('today'); setOverlay(null);
    }
  };

  const faithLevel = t.faithIntensity || user.faith;

  // ── Splash → Welcome → Onboarding → App
  if (phase === 'splash') {
    return <SplashScreen onContinue={() => setPhase('welcome')}/>;
  }

  if (phase === 'welcome') {
    return <WelcomeScreen
             onContinue={() => setPhase('onboarding')}
             onSignIn={() => setPhase('app')}/>;
  }

  if (phase === 'onboarding') {
    return <OnboardingFlow
             onComplete={(data) => { setUser(data); setTweak('faithIntensity', data.faith); setPhase('app'); setOverlay('training'); }}
             onBack={() => setPhase('welcome')}/>;
  }

  // ── App with bottom tab + overlay layer
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: FV.bg, color: FV.fg, position: 'relative' }}>
      {/* Tab content */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative', display: 'flex' }}>
        {tab === 'today' && (
          <TodayScreen onNavigate={navigate} user={user} faithLevel={faithLevel}
                       completedToday={completedToday}
                       rhythmPct={Math.round(completedToday.length / 4 * 100)}/>
        )}
        {tab === 'train' && (
          <TrainScreen onNavigate={navigate} faithLevel={faithLevel}/>
        )}
        {tab === 'word' && (
          <WordScreen onNavigate={navigate} faithLevel={faithLevel}/>
        )}
        {tab === 'journal' && (
          <JournalScreen onNavigate={navigate}/>
        )}
        {tab === 'you' && (
          <ProfileScreen onNavigate={navigate} user={user} faithLevel={faithLevel}/>
        )}
      </div>

      <TabBar active={tab} onChange={id => { setTab(id); setOverlay(null); }}/>

      {/* Overlay screens */}
      {overlay && (
        <div style={{
          position: 'absolute', inset: 0, background: FV.bg, zIndex: 50,
          animation: 'fvOverlayIn 320ms cubic-bezier(0.2,0.7,0.2,1)',
        }}>
          <style>{`
            @keyframes fvOverlayIn {
              from { opacity: 0; transform: translateY(8px); }
              to   { opacity: 1; transform: translateY(0); }
            }
          `}</style>
          {overlay === 'training' && (
            <TrainingSession onClose={() => setOverlay(null)} faithLevel={faithLevel}
                             onComplete={() => { setCompletedToday(['center', 'truth', 'reflect', 'train']); setOverlay(null); setTab('today'); }}/>
          )}
          {overlay === 'checkin' && (
            <QuickCheckin onClose={() => setOverlay(null)} faithLevel={faithLevel}
                          onComplete={() => { setCompletedToday(c => Array.from(new Set([...c, 'truth', 'reflect']))); setOverlay(null); }}/>
          )}
          {overlay === 'pregame' && (
            <PregameFlow onClose={() => setOverlay(null)} faithLevel={faithLevel}
                         onComplete={() => { setOverlay('postgame'); }}/>
          )}
          {overlay === 'postgame' && (
            <PostgameFlow onClose={() => setOverlay(null)} faithLevel={faithLevel}
                          onComplete={() => { setOverlay(null); setTab('today'); }}/>
          )}
          {overlay === 'weeklyReview' && (
            <WeeklyReview onClose={() => setOverlay(null)}/>
          )}
        </div>
      )}

      {/* Tweaks panel */}
      <TweaksPanel title="From Victory tweaks">
        <TweakSection label="Faith intensity">
          <TweakRadio label="Mode" value={t.faithIntensity} options={['open', 'growing', 'deep']}
                      onChange={v => setTweak('faithIntensity', v)}/>
        </TweakSection>
        <TweakSection label="Flow">
          <TweakToggle label="Skip onboarding" value={t.skipOnboarding}
                       onChange={v => setTweak('skipOnboarding', v)}/>
          <TweakToggle label="Screen jumper" value={t.showJumper}
                       onChange={v => setTweak('showJumper', v)}/>
        </TweakSection>
        <TweakSection label="Jump to screen">
          <ScreenJumper onJump={(target) => {
            if (target === 'splash') { setPhase('splash'); setOverlay(null); }
            else if (target === 'welcome') { setPhase('welcome'); setOverlay(null); }
            else if (target === 'onboarding') { setPhase('onboarding'); setOverlay(null); }
            else if (['today','train','word','journal','you'].includes(target)) {
              setPhase('app'); setTab(target); setOverlay(null);
            } else {
              setPhase('app'); setOverlay(target);
            }
          }}/>
        </TweakSection>
      </TweaksPanel>

      {/* Floating screen jumper (when tweaks closed but user wants quick access) */}
      {t.showJumper && phase === 'app' && (
        <FloatingJumper onJump={(target) => {
          if (target === 'splash') { setPhase('splash'); setOverlay(null); }
          else if (target === 'welcome') { setPhase('welcome'); setOverlay(null); }
          else if (target === 'onboarding') { setPhase('onboarding'); setOverlay(null); }
          else if (['today','train','word','journal','you'].includes(target)) {
            setPhase('app'); setTab(target); setOverlay(null);
          } else {
            setPhase('app'); setOverlay(target);
          }
        }}/>
      )}
    </div>
  );
}
window.FromVictoryApp = FromVictoryApp;

// Screen jumper for Tweaks panel — full screen list
function ScreenJumper({ onJump }) {
  const screens = [
    { id: 'splash',       label: 'Splash' },
    { id: 'welcome',      label: 'Welcome' },
    { id: 'onboarding',   label: 'Onboarding' },
    { id: 'today',        label: 'Today dashboard' },
    { id: 'train',        label: 'Train tab' },
    { id: 'word',         label: 'Word / devotional' },
    { id: 'journal',      label: 'Journal' },
    { id: 'you',          label: 'Profile' },
    { id: 'training',     label: 'Daily training session' },
    { id: 'checkin',      label: 'Quick check-in' },
    { id: 'pregame',      label: 'Pre-game flow' },
    { id: 'postgame',     label: 'Post-game reset' },
    { id: 'weeklyReview', label: 'Weekly rhythm review' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
      {screens.map(s => (
        <button key={s.id} onClick={() => onJump(s.id)} style={{
          background: 'transparent', border: `1px solid rgba(255,255,255,0.08)`,
          color: 'inherit', padding: '7px 10px', borderRadius: 8, cursor: 'pointer',
          fontFamily: FV.fontBody, fontSize: 11, textAlign: 'left',
          transition: 'background 140ms ease-out',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          {s.label}
        </button>
      ))}
    </div>
  );
}

// Small floating button (top-right inside the phone) that pops a screen list
function FloatingJumper({ onJump }) {
  const [open, setOpen] = React.useState(false);
  const screens = [
    { id: 'splash',       label: 'Splash' },
    { id: 'welcome',      label: 'Welcome' },
    { id: 'onboarding',   label: 'Onboarding' },
    { id: 'today',        label: 'Today' },
    { id: 'train',        label: 'Train' },
    { id: 'word',         label: 'Word' },
    { id: 'journal',      label: 'Journal' },
    { id: 'you',          label: 'Profile' },
    { id: 'training',     label: 'Training session' },
    { id: 'checkin',      label: 'Quick check-in' },
    { id: 'pregame',      label: 'Pre-game' },
    { id: 'postgame',     label: 'Post-game' },
    { id: 'weeklyReview', label: 'Weekly review' },
  ];
  return (
    <>
      <button onClick={() => setOpen(o => !o)} aria-label="Screen jumper" style={{
        position: 'absolute', top: 60, right: 64, zIndex: 100,
        width: 28, height: 28, borderRadius: 999,
        background: 'rgba(5,5,5,0.7)', border: `1px solid ${FV.border}`,
        color: FV.fg2, cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(8px)',
      }}>
        <Icon name="more" size={14}/>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'absolute', inset: 0, zIndex: 99, background: 'rgba(0,0,0,0.3)' }}/>
          <div style={{
            position: 'absolute', top: 94, right: 16, zIndex: 101, width: 220,
            background: FV.elev2, border: `1px solid ${FV.borderStrong}`, borderRadius: 14,
            padding: 8, boxShadow: '0 24px 48px -16px rgba(0,0,0,0.7)',
            maxHeight: 420, overflowY: 'auto',
          }}>
            <div style={{ fontFamily: FV.fontMono, fontSize: 9, letterSpacing: '0.18em', color: FV.fg3, textTransform: 'uppercase', fontWeight: 600, padding: '8px 10px 6px' }}>
              Jump to
            </div>
            {screens.map(s => (
              <button key={s.id} onClick={() => { onJump(s.id); setOpen(false); }} style={{
                width: '100%', textAlign: 'left', background: 'transparent', border: 0,
                color: FV.fg2, padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                fontFamily: FV.fontBody, fontSize: 12.5,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = FV.elev3; e.currentTarget.style.color = FV.fg; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = FV.fg2; }}>
                {s.label}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}
