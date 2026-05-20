// From Victory — atomic UI components

const FV = {
  bg:'#050505', elev1:'#101010', elev2:'#151515', elev3:'#1C1C1C',
  border:'rgba(247,247,247,0.08)', borderStrong:'rgba(247,247,247,0.14)',
  fg:'#F7F7F7', fg2:'rgba(247,247,247,0.72)', fg3:'rgba(247,247,247,0.48)', fg4:'rgba(247,247,247,0.28)',
  gold:'#DFAF37', goldHot:'#F4C24F', goldDeep:'#B5892A', goldSoft:'rgba(223,175,55,0.16)',
  cobalt:'#245BFF', cobaltBright:'#3D72FF', cobaltSoft:'rgba(36,91,255,0.18)',
  navy:'#071A33', purple:'#24113F',
  fontDisplay:"'Big Shoulders Display', 'Saira Condensed', Impact, sans-serif",
  fontHeading:"'Sora', system-ui, sans-serif",
  fontBody:"'Manrope', system-ui, sans-serif",
  fontScripture:"'Source Serif 4', Georgia, serif",
  fontMono:"'JetBrains Mono', ui-monospace, monospace",
};
window.FV = FV;

// ── Eyebrow / micro label
function Eyebrow({ children, color = FV.fg3, style }) {
  return <div style={{
    fontFamily: FV.fontMono, fontSize: 10, letterSpacing: '0.18em',
    textTransform: 'uppercase', color, fontWeight: 600, ...style,
  }}>{children}</div>;
}
window.Eyebrow = Eyebrow;

// ── Verse reference (mono gold)
function VerseRef({ children }) {
  return <div style={{
    fontFamily: FV.fontMono, fontSize: 11, letterSpacing: '0.16em',
    textTransform: 'uppercase', color: FV.gold, fontWeight: 600,
  }}>{children}</div>;
}
window.VerseRef = VerseRef;

// ── Button
function Button({ children, variant = 'primary', size = 'md', onClick, style, leading, trailing, full }) {
  const base = {
    fontFamily: FV.fontHeading, fontWeight: 600, fontSize: size === 'sm' ? 13 : 15,
    border: '1px solid transparent', borderRadius: 999, cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: size === 'sm' ? '10px 16px' : '14px 22px', transition: 'all 160ms cubic-bezier(0.2,0.7,0.2,1)',
    width: full ? '100%' : 'auto',
  };
  const variants = {
    primary:   { background: FV.gold, color: '#050505', borderColor: FV.gold },
    secondary: { background: 'transparent', color: FV.fg, borderColor: FV.borderStrong },
    ghost:     { background: 'transparent', color: FV.fg2, borderColor: 'transparent', padding: '8px 4px' },
    coach: {
      background: FV.bg, color: FV.fg, borderColor: FV.gold,
      fontFamily: FV.fontDisplay, fontWeight: 800, textTransform: 'uppercase',
      letterSpacing: '0.14em', fontSize: 14, borderRadius: 10, padding: '16px 26px',
    },
  };
  return (
    <button onClick={onClick} style={{ ...base, ...variants[variant], ...style }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
            onMouseUp={e => e.currentTarget.style.transform = ''}
            onMouseLeave={e => e.currentTarget.style.transform = ''}>
      {leading}{children}{trailing}
    </button>
  );
}
window.Button = Button;

// ── Chip
function Chip({ children, variant = 'default' }) {
  const variants = {
    default: { background: FV.elev2, color: FV.fg2, borderColor: FV.border },
    gold:    { background: 'transparent', color: FV.gold, borderColor: 'rgba(223,175,55,0.5)' },
    cobalt:  { background: 'rgba(36,91,255,0.12)', color: FV.cobaltBright, borderColor: 'rgba(36,91,255,0.4)' },
    solid:   { background: FV.gold, color: '#050505', borderColor: FV.gold },
  };
  return <span style={{
    fontFamily: FV.fontMono, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase',
    padding: '6px 10px', borderRadius: 999, border: '1px solid transparent',
    display: 'inline-flex', alignItems: 'center', ...variants[variant],
  }}>{children}</span>;
}
window.Chip = Chip;

// ── Ring (rhythm progress)
function RhythmRing({ pct = 0, size = 96, stroke = 8, color = FV.cobalt, label }) {
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  const off = C * (1 - Math.max(0, Math.min(1, pct / 100)));
  return (
    <div style={{ position: 'relative', width: size, height: size, flex: 'none' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} stroke="rgba(247,247,247,0.06)" strokeWidth={stroke} fill="none"/>
        <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth={stroke} fill="none"
                strokeLinecap="round" strokeDasharray={C} strokeDashoffset={off}
                style={{ transition: 'stroke-dashoffset 600ms cubic-bezier(0.2,0.7,0.2,1)' }}/>
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <span style={{ fontFamily: FV.fontDisplay, fontWeight: 800, fontSize: size * 0.24, color: FV.fg, lineHeight: 1 }}>
          {pct}<span style={{ fontSize: size * 0.13, opacity: 0.6 }}>%</span>
        </span>
        {label && <span style={{ fontFamily: FV.fontMono, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: FV.fg3, marginTop: 2 }}>{label}</span>}
      </div>
    </div>
  );
}
window.RhythmRing = RhythmRing;

// ── Card
function Card({ children, padding = 20, radius = 14, style, accent }) {
  return (
    <div style={{
      background: FV.elev1, border: `1px solid ${FV.border}`,
      borderRadius: radius, padding,
      ...(accent === 'verse' ? {
        background: `radial-gradient(120% 80% at 30% 0%, rgba(223,175,55,0.07), transparent 60%), ${FV.elev1}`,
      } : {}),
      ...(accent === 'prayer' ? {
        background: `radial-gradient(120% 90% at 50% 0%, rgba(36,91,255,0.10), transparent 70%), ${FV.elev1}`,
      } : {}),
      ...style,
    }}>{children}</div>
  );
}
window.Card = Card;

// ── ModuleTile
function ModuleTile({ icon, title, duration, onClick, done }) {
  return (
    <button onClick={onClick} style={{
      background: FV.elev1, border: `1px solid ${FV.border}`, borderRadius: 14,
      padding: 16, textAlign: 'left', cursor: 'pointer', color: FV.fg,
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      minHeight: 130, transition: 'background 160ms cubic-bezier(0.2,0.7,0.2,1)',
    }}
    onMouseEnter={e => e.currentTarget.style.background = FV.elev2}
    onMouseLeave={e => e.currentTarget.style.background = FV.elev1}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: done ? FV.goldSoft : 'rgba(247,247,247,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name={icon} size={18} color={done ? FV.gold : FV.fg2}/>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 14 }}>
        <div style={{ fontFamily: FV.fontHeading, fontWeight: 600, fontSize: 15 }}>{title}</div>
        <div style={{ fontFamily: FV.fontMono, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: done ? FV.gold : FV.fg3 }}>
          {done ? 'Done' : duration}
        </div>
      </div>
    </button>
  );
}
window.ModuleTile = ModuleTile;

// ── FlameMark — small brand icon for headers. Uses the real flame extracted from the logo.
function FlameMark({ size = 18 }) {
  // mark-flame.svg is ~130×215 (aspect ~0.6)
  return (
    <img src="../../assets/mark-flame.svg" alt=""
         style={{ height: size, width: 'auto', display: 'block' }} aria-hidden/>
  );
}
window.FlameMark = FlameMark;
