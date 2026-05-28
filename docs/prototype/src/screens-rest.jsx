// From Victory — Train tab, Word (devotional), Journal, Weekly review, Profile

// ──────────────────────────────────────────────────────────────
// TRAIN TAB — Training path / weekly themes
const WEEKLY_THEMES = [
  { week: 1, theme: 'Identity',   status: 'done',     desc: 'Train from secure identity. Eight days of identity statements + journaling.' },
  { week: 2, theme: 'Mistakes',   status: 'active',   desc: 'Reset after mistakes — the 10-second rule. Your week.', progress: 0.42 },
  { week: 3, theme: 'Pressure',   status: 'locked',   desc: 'Calm under pressure. Breathwork + visualization.' },
  { week: 4, theme: 'Resilience', status: 'locked',   desc: 'Come back from bad games and bad weeks.' },
  { week: 5, theme: 'Leadership', status: 'locked',   desc: 'Lift the room without losing yourself.' },
  { week: 6, theme: 'Gratitude',  status: 'locked',   desc: 'Long-season resilience through gratitude.' },
];

function TrainScreen({ onNavigate, faithLevel = 'growing' }) {
  return (
    <Screen>
      <TopBar eyebrow="Train" title="Your path"
              trailing={<button aria-label="Filter" style={{ width: 36, height: 36, borderRadius: 999, background: 'transparent', border: `1px solid ${FV.border}`, color: FV.fg, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="filter" size={16}/></button>}/>

      <div style={{ padding: '4px 20px 20px' }}>
        {/* Hero stat */}
        <Card padding={22} radius={20} accent="gold" style={{ marginTop: 6, marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{
              width: 76, height: 76, borderRadius: 18, flex: 'none',
              background: `linear-gradient(135deg, rgba(223,175,55,0.18), rgba(223,175,55,0.05))`,
              border: '1px solid rgba(223,175,55,0.28)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FlameMark size={36}/>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Eyebrow color={FV.gold}>Week 2 of 6 · Reset path</Eyebrow>
              <div style={{ fontFamily: FV.fontHeading, fontWeight: 600, fontSize: 19, color: FV.fg, marginTop: 4 }}>
                Reset after mistakes
              </div>
              <div style={{ fontFamily: FV.fontBody, fontSize: 12.5, color: FV.fg2, marginTop: 4 }}>
                3 of 7 days complete
              </div>
            </div>
          </div>
          <div style={{ height: 1, background: FV.border, margin: '18px 0' }}/>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Button variant="primary" full
                    trailing={<Icon name="arrowRight" size={14} color="#0B0905" strokeWidth={2}/>}
                    onClick={() => onNavigate('training')}>
              Today's session
            </Button>
            <Button variant="secondary" full onClick={() => onNavigate('checkin')}>
              Quick mode
            </Button>
          </div>
        </Card>

        {/* Game day shortcuts */}
        <Eyebrow style={{ marginBottom: 10 }}>Game day</Eyebrow>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 22 }}>
          <ModuleTile icon="zap"     title="Pre-game"  duration="3 min" accent="cobalt"
                      onClick={() => onNavigate('pregame')}/>
          <ModuleTile icon="heart"   title="Post-game" duration="5 min" accent="cobalt"
                      onClick={() => onNavigate('postgame')}/>
        </div>

        {/* Path */}
        <Eyebrow style={{ marginBottom: 12 }}>Training path</Eyebrow>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {WEEKLY_THEMES.map(w => (
            <PathItem key={w.week} item={w}/>
          ))}
        </div>

        {/* Weekly review */}
        <div style={{ marginTop: 24 }}>
          <Card padding={18} radius={16} style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
                onClick={() => onNavigate('weeklyReview')}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, background: FV.cobaltSoft,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none',
            }}>
              <Icon name="trending" size={20} color={FV.cobaltBright}/>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: FV.fontHeading, fontWeight: 600, fontSize: 14, color: FV.fg }}>This week's rhythm</div>
              <div style={{ fontFamily: FV.fontBody, fontSize: 12, color: FV.fg3 }}>Look back. See the pattern. No streaks.</div>
            </div>
            <Icon name="chevronRight" size={18} color={FV.fg3}/>
          </Card>
        </div>
      </div>
    </Screen>
  );
}
window.TrainScreen = TrainScreen;

function PathItem({ item }) {
  const isActive = item.status === 'active';
  const isDone = item.status === 'done';
  const isLocked = item.status === 'locked';
  return (
    <div style={{
      background: isActive ? 'rgba(223,175,55,0.05)' : FV.elev1,
      border: `1px solid ${isActive ? 'rgba(223,175,55,0.35)' : FV.border}`,
      borderRadius: 14, padding: 16, display: 'flex', alignItems: 'flex-start', gap: 14,
      opacity: isLocked ? 0.55 : 1,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10, flex: 'none',
        background: isActive ? FV.goldSoft : isDone ? FV.cobaltSoft : 'rgba(247,247,247,0.05)',
        border: `1px solid ${isActive ? 'rgba(223,175,55,0.28)' : 'transparent'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}>
        {isDone ? <Icon name="check" size={18} color={FV.cobaltBright} strokeWidth={2.5}/>
         : isLocked ? <Icon name="lock" size={15} color={FV.fg3}/>
         : <div style={{ fontFamily: FV.fontDisplay, fontWeight: 800, fontSize: 17, color: FV.gold }}>{item.week}</div>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
          <div style={{ fontFamily: FV.fontHeading, fontWeight: 600, fontSize: 15, color: FV.fg }}>
            Week {item.week} — {item.theme}
          </div>
          {isActive && <Chip variant="gold" style={{ padding: '3px 8px', fontSize: 9 }}>This week</Chip>}
          {isDone && <Chip variant="cobalt" style={{ padding: '3px 8px', fontSize: 9 }}>Done</Chip>}
        </div>
        <div style={{ fontFamily: FV.fontBody, fontSize: 12.5, color: FV.fg2, marginTop: 4, lineHeight: 1.45 }}>{item.desc}</div>
        {isActive && (
          <div style={{ marginTop: 10, height: 4, borderRadius: 2, background: 'rgba(247,247,247,0.08)', overflow: 'hidden' }}>
            <div style={{ width: `${item.progress * 100}%`, height: '100%', background: FV.gold, borderRadius: 2 }}/>
          </div>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// WORD (Devotional / Scripture)
function WordScreen({ onNavigate, faithLevel = 'growing' }) {
  const t = window.FV_TRUTHS[faithLevel] || window.FV_TRUTHS.growing;
  const verses = [
    { ref: 'ROMANS 8:37',     text: 'No, in all these things we are more than conquerors through him who loved us.', tag: 'Identity' },
    { ref: 'PHIL 4:13',       text: 'I can do all this through him who gives me strength.', tag: 'Confidence' },
    { ref: '1 COR 9:25',      text: 'Everyone who competes in the games goes into strict training.', tag: 'Discipline' },
    { ref: 'JOSHUA 1:9',      text: 'Be strong and courageous. Do not be afraid; do not be discouraged.', tag: 'Courage' },
  ];
  return (
    <Screen>
      <TopBar eyebrow="The Word" title="Today's truth"/>
      <div style={{ padding: '4px 20px 20px' }}>
        {/* Verse hero */}
        <Card padding={26} radius={22} accent="verse" style={{ marginTop: 6, marginBottom: 18, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -10, top: -10, opacity: 0.06, pointerEvents: 'none' }}>
            <img src={FV_ASSETS.flameMark} alt="" style={{ height: 200, width: 'auto' }}/>
          </div>
          <VerseRef>{t.verseRef || 'Romans 8:37'}</VerseRef>
          <div style={{
            fontFamily: FV.fontScripture, fontSize: 24, lineHeight: 1.45,
            color: FV.fg, marginTop: 16, fontWeight: 400, position: 'relative',
          }}>
            "{t.scripture ? t.verseText : 'No, in all these things we are more than conquerors through him who loved us.'}"
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 22, flexWrap: 'wrap' }}>
            <Chip variant="gold">Identity</Chip>
            <Chip variant="outline">Mindset</Chip>
          </div>
        </Card>

        {/* Reflection */}
        <Eyebrow style={{ marginBottom: 10 }}>Reflection</Eyebrow>
        <Card padding={20} radius={16} style={{ marginBottom: 18 }}>
          <p style={{ fontFamily: FV.fontBody, fontSize: 14, color: FV.fg, margin: 0, lineHeight: 1.6 }}>
            Paul writes <em>more than conquerors</em> while he\u2019s being hunted. Not <em>winners</em>. Conquerors. The athlete\u2019s version: your identity isn\u2019t the scoreboard \u2014 it\u2019s the One who held you through it.
          </p>
          <div style={{ height: 1, background: FV.border, margin: '16px 0' }}/>
          <div style={{ fontFamily: FV.fontHeading, fontWeight: 600, fontSize: 15, color: FV.fg }}>
            What does competing <em>from</em> victory look like for you today?
          </div>
          <div style={{ marginTop: 14 }}>
            <Button variant="secondary" onClick={() => onNavigate && onNavigate('journal')}
                    trailing={<Icon name="pen" size={14} color={FV.fg2}/>}>
              Open in journal
            </Button>
          </div>
        </Card>

        {/* Prayer */}
        {(faithLevel === 'growing' || faithLevel === 'deep') && (
          <>
            <Eyebrow style={{ marginBottom: 10 }}>Prayer</Eyebrow>
            <Card padding={22} radius={16} accent="prayer" style={{ marginBottom: 22 }}>
              <div style={{ fontFamily: FV.fontScripture, fontSize: 16, lineHeight: 1.65, color: FV.fg, fontStyle: 'italic' }}>
                Father, my identity is not in tonight\u2019s game. Train me to compete from rest and walk in courage. Quiet what I cannot control. Lock in on what I can.
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
                <Button variant="quiet" leading={<Icon name="pray" size={14} color={FV.fg2}/>}>Pray this</Button>
                <Button variant="ghost"><Icon name="share" size={14}/></Button>
              </div>
            </Card>
          </>
        )}

        {/* Verse library */}
        <Eyebrow style={{ marginBottom: 10 }}>This week — Mistakes</Eyebrow>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {verses.map(v => (
            <div key={v.ref} style={{
              background: FV.elev1, border: `1px solid ${FV.border}`, borderRadius: 12,
              padding: 14,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <VerseRef>{v.ref}</VerseRef>
                <Chip variant="outline" style={{ padding: '3px 8px', fontSize: 9 }}>{v.tag}</Chip>
              </div>
              <div style={{ fontFamily: FV.fontScripture, fontSize: 14.5, lineHeight: 1.5, color: FV.fg2 }}>
                "{v.text}"
              </div>
            </div>
          ))}
        </div>
      </div>
    </Screen>
  );
}
window.WordScreen = WordScreen;

// ──────────────────────────────────────────────────────────────
// JOURNAL
const JOURNAL_TAGS = ['Identity', 'Confidence', 'Fear', 'Focus', 'Mistakes', 'Pressure', 'Leadership', 'Gratitude', 'Discipline', 'Prayer'];

const SAMPLE_ENTRIES = [
  { id: 1, date: 'Mar 11', day: 'Mon', tags: ['Mistakes'], preview: 'Felt slow in the second period. Reset on the bench. Came back ready.' },
  { id: 2, date: 'Mar 10', day: 'Sun', tags: ['Identity'], preview: 'I\u2019m not the scoreboard. I\u2019m not the last shift. Show up tomorrow.' },
  { id: 3, date: 'Mar 09', day: 'Sat', tags: ['Pre-game', 'Focus'], preview: 'Pre-game nerves felt different tonight. Three breaths actually worked.' },
  { id: 4, date: 'Mar 07', day: 'Thu', tags: ['Gratitude'], preview: 'Coach pulled me aside. Said he saw me leading. Carry that.' },
];

function JournalScreen({ onNavigate }) {
  const [mode, setMode] = React.useState('list'); // list | compose
  const [text, setText] = React.useState('');
  const [selectedTags, setSelectedTags] = React.useState([]);
  const [filterTag, setFilterTag] = React.useState(null);
  const toggleTag = (t) => setSelectedTags(s => s.includes(t) ? s.filter(x => x !== t) : [...s, t]);

  if (mode === 'compose') {
    return (
      <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', background: FV.bg, color: FV.fg, overflow: 'hidden' }}>
        <TopBar dense onBack={() => setMode('list')} eyebrow="New entry" title="Tuesday · Mar 12"
                trailing={<Eyebrow color={text ? FV.gold : FV.fg3}>{text.length} chars</Eyebrow>}/>
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
          {/* Optional prompt */}
          <Card padding={16} radius={14} accent="verse" style={{ marginBottom: 14 }}>
            <Eyebrow color={FV.gold}>Optional prompt</Eyebrow>
            <div style={{ fontFamily: FV.fontHeading, fontWeight: 600, fontSize: 15, lineHeight: 1.4, color: FV.fg, marginTop: 6 }}>
              What truth do you need to remember walking into practice tonight?
            </div>
          </Card>

          <textarea value={text} onChange={e => setText(e.target.value)}
                    placeholder="Write as much or as little as you need…"
                    autoFocus
                    style={{
                      width: '100%', boxSizing: 'border-box', minHeight: 240,
                      background: FV.elev1, border: `1px solid ${FV.border}`,
                      borderRadius: 16, padding: 18, color: FV.fg,
                      fontFamily: FV.fontBody, fontSize: 15, lineHeight: 1.7,
                      outline: 'none', resize: 'none',
                    }}/>

          {/* Tags */}
          <div style={{ marginTop: 18 }}>
            <Eyebrow style={{ marginBottom: 10 }}>Tags · optional</Eyebrow>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {JOURNAL_TAGS.map(t => (
                <Chip key={t} onClick={() => toggleTag(t)} selected={selectedTags.includes(t)}>{t}</Chip>
              ))}
            </div>
          </div>
        </div>
        <div style={{ padding: '12px 20px 28px', borderTop: `1px solid ${FV.border}`, display: 'flex', gap: 10, background: 'rgba(5,5,5,0.85)', backdropFilter: 'blur(12px)' }}>
          <Button variant="secondary" full onClick={() => setMode('list')}>Save draft</Button>
          <Button variant="primary" full onClick={() => setMode('list')} disabled={!text}
                  trailing={<Icon name="check" size={14} color="#0B0905" strokeWidth={2.5}/>}>
            Save entry
          </Button>
        </div>
      </div>
    );
  }

  const filtered = filterTag ? SAMPLE_ENTRIES.filter(e => e.tags.includes(filterTag)) : SAMPLE_ENTRIES;

  return (
    <Screen>
      <TopBar eyebrow="Journal" title="Your reflections"
              trailing={<button aria-label="Search" style={{ width: 36, height: 36, borderRadius: 999, background: 'transparent', border: `1px solid ${FV.border}`, color: FV.fg, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="search" size={16}/></button>}/>

      <div style={{ padding: '4px 20px 20px' }}>
        {/* Compose CTA */}
        <Card padding={20} radius={20} style={{
          background: `linear-gradient(180deg, rgba(223,175,55,0.05), rgba(223,175,55,0)), ${FV.elev1}`,
          borderColor: 'rgba(223,175,55,0.18)', marginBottom: 18, marginTop: 6,
        }}>
          <Eyebrow color={FV.gold}>Tuesday · Mar 12</Eyebrow>
          <div style={{ fontFamily: FV.fontHeading, fontWeight: 600, fontSize: 17, color: FV.fg, marginTop: 6, marginBottom: 14, lineHeight: 1.3 }}>
            Your journal is yours.<br/>Write when you have something.
          </div>
          <Button variant="primary"
                  trailing={<Icon name="arrowRight" size={14} color="#0B0905" strokeWidth={2}/>}
                  onClick={() => setMode('compose')}>
            Start an entry
          </Button>
        </Card>

        {/* Tag filter */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 16, paddingBottom: 4, marginLeft: -20, paddingLeft: 20, marginRight: -20, paddingRight: 20 }}>
          <Chip onClick={() => setFilterTag(null)} selected={!filterTag}>All</Chip>
          {JOURNAL_TAGS.slice(0, 6).map(t => (
            <Chip key={t} onClick={() => setFilterTag(t)} selected={filterTag === t}>{t}</Chip>
          ))}
        </div>

        <Eyebrow style={{ marginBottom: 10 }}>{filterTag ? `Tagged · ${filterTag}` : 'Recent'}</Eyebrow>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(e => (
            <div key={e.id} style={{
              background: FV.elev1, border: `1px solid ${FV.border}`, borderRadius: 14,
              padding: 14, display: 'flex', alignItems: 'flex-start', gap: 14, cursor: 'pointer',
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10, background: FV.elev2, flex: 'none',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ fontFamily: FV.fontMono, fontSize: 9, color: FV.fg3, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600 }}>{e.day}</div>
                <div style={{ fontFamily: FV.fontDisplay, fontWeight: 700, fontSize: 15, color: FV.fg, lineHeight: 1 }}>{e.date.split(' ')[1]}</div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 6, marginBottom: 5, flexWrap: 'wrap' }}>
                  {e.tags.map(t => <Chip key={t} variant="outline" style={{ padding: '2px 7px', fontSize: 9 }}>{t}</Chip>)}
                </div>
                <div style={{ fontFamily: FV.fontBody, fontSize: 13.5, color: FV.fg2, lineHeight: 1.45 }}>{e.preview}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Screen>
  );
}
window.JournalScreen = JournalScreen;

// ──────────────────────────────────────────────────────────────
// WEEKLY RHYTHM REVIEW
function WeeklyReview({ onClose }) {
  const days = [
    { label: 'M', value: 1.0, today: false },
    { label: 'T', value: 0.8, today: false },
    { label: 'W', value: 1.0, today: false },
    { label: 'T', value: 0.4, today: false },
    { label: 'F', value: 0.0, today: false },
    { label: 'S', value: 1.0, today: false },
    { label: 'S', value: 0.6, today: true },
  ];
  return (
    <Screen background={FV.bg}>
      <TopBar onBack={onClose} eyebrow="This week" title="Rhythm review"/>
      <div style={{ padding: '4px 20px 24px' }}>
        {/* Big rhythm */}
        <Card padding={24} radius={20} style={{ marginTop: 6, marginBottom: 18 }} accent="gold">
          <Eyebrow color={FV.gold}>Mar 06 — Mar 12</Eyebrow>
          <div style={{ display: 'flex', alignItems: 'center', gap: 22, marginTop: 12 }}>
            <RhythmRing pct={71} size={120} stroke={10} color={FV.gold} big/>
            <div>
              <div style={{ fontFamily: FV.fontDisplay, fontSize: 48, fontWeight: 800, color: FV.fg, lineHeight: 1 }}>5<span style={{ fontSize: 22, opacity: 0.6, fontWeight: 600 }}>/7</span></div>
              <div style={{ fontFamily: FV.fontMono, fontSize: 10, letterSpacing: '0.18em', color: FV.fg3, textTransform: 'uppercase', fontWeight: 600, marginTop: 4 }}>Days practiced</div>
              <div style={{ fontFamily: FV.fontBody, fontSize: 13, color: FV.fg2, marginTop: 8 }}>Steady week. Strong start.</div>
            </div>
          </div>
          <div style={{ marginTop: 22 }}>
            <RhythmBar days={days} height={56}/>
          </div>
        </Card>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
          <StatCard icon="zap" label="Reps completed" value="18"/>
          <StatCard icon="pen" label="Reflections" value="4"/>
          <StatCard icon="book" label="Verses read" value="6"/>
          <StatCard icon="target" label="Pre-game resets" value="2"/>
        </div>

        {/* Growth themes */}
        <Eyebrow style={{ marginBottom: 10 }}>Growth themes</Eyebrow>
        <Card padding={20} radius={16} style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontFamily: FV.fontHeading, fontWeight: 600, fontSize: 14, color: FV.fg }}>Identity</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ fontFamily: FV.fontMono, fontSize: 10, color: FV.gold, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>+2 vs last week</div>
              <Icon name="trending" size={12} color={FV.gold}/>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <ThemeBar label="Identity"   value={0.8}/>
            <ThemeBar label="Mistakes"   value={0.65}/>
            <ThemeBar label="Focus"      value={0.5}/>
            <ThemeBar label="Gratitude"  value={0.3}/>
          </div>
        </Card>

        {/* Carry forward */}
        <Card padding={20} radius={16} accent="verse">
          <Eyebrow color={FV.gold}>Carry forward</Eyebrow>
          <div style={{ fontFamily: FV.fontHeading, fontWeight: 600, fontSize: 17, lineHeight: 1.35, color: FV.fg, marginTop: 8 }}>
            You showed up five times this week. That's the rhythm.
          </div>
          <div style={{ fontFamily: FV.fontBody, fontSize: 13.5, color: FV.fg2, marginTop: 8, lineHeight: 1.5 }}>
            Friday's miss is part of it. Welcome back \u2014 next week starts Monday.
          </div>
        </Card>
      </div>
    </Screen>
  );
}
window.WeeklyReview = WeeklyReview;

function StatCard({ icon, label, value }) {
  return (
    <div style={{
      background: FV.elev1, border: `1px solid ${FV.border}`, borderRadius: 14, padding: 16,
    }}>
      <Icon name={icon} size={16} color={FV.gold}/>
      <div style={{ fontFamily: FV.fontDisplay, fontWeight: 800, fontSize: 28, color: FV.fg, marginTop: 10, lineHeight: 1 }}>{value}</div>
      <div style={{ fontFamily: FV.fontMono, fontSize: 9, letterSpacing: '0.16em', color: FV.fg3, textTransform: 'uppercase', fontWeight: 600, marginTop: 6 }}>{label}</div>
    </div>
  );
}

function ThemeBar({ label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ fontFamily: FV.fontMono, fontSize: 10, color: FV.fg2, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, width: 78 }}>{label}</div>
      <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(247,247,247,0.06)', overflow: 'hidden' }}>
        <div style={{ width: `${value * 100}%`, height: '100%', background: FV.cobalt, borderRadius: 3 }}/>
      </div>
      <div style={{ fontFamily: FV.fontMono, fontSize: 10, color: FV.fg3, width: 28, textAlign: 'right' }}>{Math.round(value * 100)}</div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// PROFILE / YOU
function ProfileScreen({ onNavigate, user, faithLevel = 'growing' }) {
  return (
    <Screen>
      <TopBar eyebrow="You" title={user?.name || 'Jordan'}
              trailing={<button aria-label="Settings" style={{ width: 36, height: 36, borderRadius: 999, background: 'transparent', border: `1px solid ${FV.border}`, color: FV.fg, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="settings" size={16}/></button>}/>

      <div style={{ padding: '4px 20px 20px' }}>
        {/* Identity card */}
        <Card padding={22} radius={20} style={{ marginTop: 6, marginBottom: 14 }} accent="gold">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%', flex: 'none', position: 'relative',
              background: `linear-gradient(135deg, ${FV.elev2}, ${FV.bg})`,
              border: `1px solid ${FV.borderStrong}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontFamily: FV.fontDisplay, fontWeight: 800, fontSize: 24, color: FV.fg }}>{(user?.name || 'J')[0]}</span>
              <div style={{
                position: 'absolute', bottom: -2, right: -2, width: 22, height: 22, borderRadius: '50%',
                background: FV.gold, border: `2px solid ${FV.bg}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <FlameMark size={10}/>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: FV.fontHeading, fontWeight: 600, fontSize: 19, color: FV.fg }}>{user?.name || 'Jordan'}</div>
              <div style={{ fontFamily: FV.fontMono, fontSize: 10, letterSpacing: '0.16em', color: FV.fg3, textTransform: 'uppercase', fontWeight: 600, marginTop: 4 }}>
                {user?.sport || 'Hockey'} · {user?.position || 'Forward'} · U15
              </div>
            </div>
          </div>
          <div style={{ height: 1, background: FV.border, margin: '18px 0' }}/>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Eyebrow color={FV.gold}>Compete from</Eyebrow>
              <div style={{ fontFamily: FV.fontHeading, fontSize: 14, fontWeight: 600, marginTop: 4, color: FV.fg }}>Reset after mistakes</div>
            </div>
            <Button variant="ghost" size="sm">Edit</Button>
          </div>
        </Card>

        {/* Stats — rhythm, NOT streak */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 18 }}>
          <StatCard icon="calendar" label="Days this wk" value="5"/>
          <StatCard icon="trending" label="Rhythm · 30d" value="71%"/>
          <StatCard icon="pen" label="Entries" value="18"/>
        </div>

        {/* Account rows */}
        <div style={{ marginBottom: 14 }}><Eyebrow>Training</Eyebrow></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 22 }}>
          <Row icon="trending" label="Weekly rhythm review" onClick={() => onNavigate('weeklyReview')}/>
          <Row icon="target" label="Training path"/>
          <Row icon="bell" label="Reminders"/>
          <Row icon="flame" label="Faith intensity" value={faithLevel === 'open' ? 'Open' : faithLevel === 'deep' ? 'Deep' : 'Growing'}/>
        </div>

        <div style={{ marginBottom: 14 }}><Eyebrow>Account</Eyebrow></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Row icon="user" label="Profile & sport"/>
          <Row icon="shield" label="Privacy"/>
          <Row icon="settings" label="Notifications"/>
          <Row icon="users" label="Coaches & parents"/>
        </div>

        <div style={{ marginTop: 32, textAlign: 'center' }}>
          <Eyebrow color={FV.fg3}>From Victory · v0.1</Eyebrow>
        </div>
      </div>
    </Screen>
  );
}
window.ProfileScreen = ProfileScreen;

function Row({ icon, label, value, onClick }) {
  return (
    <button onClick={onClick} style={{
      background: 'transparent', border: 0, padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: 14, color: FV.fg, textAlign: 'left',
      transition: `background 140ms ${FV.easeOut}`,
    }}
    onMouseEnter={e => e.currentTarget.style.background = FV.elev1}
    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <div style={{
        width: 32, height: 32, borderRadius: 8, background: FV.elev2,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none',
      }}>
        <Icon name={icon} size={15} color={FV.fg2}/>
      </div>
      <div style={{ flex: 1, fontFamily: FV.fontBody, fontSize: 14, color: FV.fg, fontWeight: 500 }}>{label}</div>
      {value && <div style={{ fontFamily: FV.fontMono, fontSize: 10, color: FV.fg3, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600 }}>{value}</div>}
      <Icon name="chevronRight" size={16} color={FV.fg3}/>
    </button>
  );
}
