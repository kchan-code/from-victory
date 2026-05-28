// From Victory — Design tokens (mirrored from tokens.css for JSX use) + atomic components.

const FV = {
  bg:'#050505', elev1:'#101010', elev2:'#151515', elev3:'#1C1C1C',
  border:'rgba(247,247,247,0.08)', borderStrong:'rgba(247,247,247,0.14)',
  fg:'#F7F7F7', fg2:'rgba(247,247,247,0.72)', fg3:'rgba(247,247,247,0.48)', fg4:'rgba(247,247,247,0.28)',
  gold:'#DFAF37', goldHot:'#F4C24F', goldDeep:'#B5892A',
  goldSoft:'rgba(223,175,55,0.16)', goldSoft2:'rgba(223,175,55,0.06)',
  cobalt:'#245BFF', cobaltBright:'#3D72FF', cobaltSoft:'rgba(36,91,255,0.18)',
  navy:'#071A33', purple:'#24113F',
  success:'#4FC78A', warning:'#E8A33A', danger:'#E5564C',
  fontDisplay:"'Big Shoulders Display', 'Saira Condensed', Impact, sans-serif",
  fontHeading:"'Sora', system-ui, sans-serif",
  fontBody:"'Manrope', system-ui, sans-serif",
  fontScripture:"'Source Serif 4', Georgia, serif",
  fontMono:"'JetBrains Mono', ui-monospace, monospace",
  easeOut:'cubic-bezier(0.2,0.7,0.2,1)',
  easeSoft:'cubic-bezier(0.34,1.2,0.64,1)',
};
window.FV = FV;

// asset paths — we live in /, assets in /assets
const FV_ASSETS = {
  iconGold:        'assets/logo-icon-transparent.png',
  iconFull:        'assets/logo-icon.png',
  stacked:         'assets/logo-stacked-transparent.png',
  stackedFull:     'assets/logo-stacked.png',
  wordmark:        'assets/logo-wordmark-transparent.png',
  flameMark:       'assets/mark-flame.png',
};
window.FV_ASSETS = FV_ASSETS;

// ── Eyebrow / micro label
function Eyebrow({ children, color = FV.fg3, style }) {
  return <div style={{
    fontFamily: FV.fontMono, fontSize: 10, letterSpacing: '0.20em',
    textTransform: 'uppercase', color, fontWeight: 600, ...style,
  }}>{children}</div>;
}
window.Eyebrow = Eyebrow;

// ── Section eyebrow with flame mark
function SectionMark({ children, style }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, ...style }}>
      <img src={FV_ASSETS.flameMark} alt="" style={{ height: 12, width: 'auto', opacity: 0.9 }} aria-hidden/>
      <Eyebrow color={FV.gold}>{children}</Eyebrow>
    </div>
  );
}
window.SectionMark = SectionMark;

// ── Verse reference (mono gold)
function VerseRef({ children, color = FV.gold }) {
  return <div style={{
    fontFamily: FV.fontMono, fontSize: 11, letterSpacing: '0.18em',
    textTransform: 'uppercase', color, fontWeight: 600,
  }}>{children}</div>;
}
window.VerseRef = VerseRef;

// ── Button
function Button({ children, variant = 'primary', size = 'md', onClick, style, leading, trailing, full, disabled }) {
  const base = {
    fontFamily: FV.fontHeading, fontWeight: 600,
    fontSize: size === 'sm' ? 13 : size === 'lg' ? 16 : 15,
    border: '1px solid transparent', borderRadius: 999, cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: size === 'sm' ? '9px 14px' : size === 'lg' ? '16px 24px' : '13px 20px',
    transition: `transform 140ms ${FV.easeOut}, background 160ms ${FV.easeOut}, border-color 160ms ${FV.easeOut}, color 160ms ${FV.easeOut}`,
    width: full ? '100%' : 'auto',
    opacity: disabled ? 0.45 : 1,
    letterSpacing: '0.005em',
  };
  const variants = {
    primary:   { background: FV.gold, color: '#0B0905', borderColor: FV.gold },
    secondary: { background: 'transparent', color: FV.fg, borderColor: FV.borderStrong },
    quiet:     { background: FV.elev1, color: FV.fg, borderColor: FV.border },
    ghost:     { background: 'transparent', color: FV.fg2, borderColor: 'transparent', padding: '8px 4px' },
    danger:    { background: 'transparent', color: FV.fg3, borderColor: FV.border },
    coach: {
      background: 'rgba(5,5,5,0.65)', color: FV.fg, borderColor: FV.gold,
      fontFamily: FV.fontDisplay, fontWeight: 800, textTransform: 'uppercase',
      letterSpacing: '0.14em', fontSize: size === 'lg' ? 15 : 13,
      borderRadius: 10, padding: size === 'lg' ? '17px 26px' : '14px 22px',
      backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
    },
    coachGold: {
      background: FV.gold, color: '#0B0905', borderColor: FV.gold,
      fontFamily: FV.fontDisplay, fontWeight: 800, textTransform: 'uppercase',
      letterSpacing: '0.14em', fontSize: size === 'lg' ? 15 : 13,
      borderRadius: 10, padding: size === 'lg' ? '17px 26px' : '14px 22px',
    },
  };
  return (
    <button onClick={disabled ? undefined : onClick} disabled={disabled}
            style={{ ...base, ...variants[variant], ...style }}
            onMouseDown={e => !disabled && (e.currentTarget.style.transform = 'scale(0.97)')}
            onMouseUp={e => e.currentTarget.style.transform = ''}
            onMouseLeave={e => e.currentTarget.style.transform = ''}>
      {leading}{children}{trailing}
    </button>
  );
}
window.Button = Button;

// ── Chip
function Chip({ children, variant = 'default', onClick, selected, style, leading }) {
  const base = {
    fontFamily: FV.fontMono, fontSize: 10, letterSpacing: '0.16em',
    textTransform: 'uppercase', padding: '7px 12px', borderRadius: 999,
    border: '1px solid transparent', display: 'inline-flex', alignItems: 'center', gap: 6,
    fontWeight: 600, transition: `all 140ms ${FV.easeOut}`,
    cursor: onClick ? 'pointer' : 'default',
  };
  const variants = {
    default: { background: FV.elev2, color: FV.fg2, borderColor: FV.border },
    gold:    { background: 'transparent', color: FV.gold, borderColor: 'rgba(223,175,55,0.5)' },
    cobalt:  { background: 'rgba(36,91,255,0.12)', color: FV.cobaltBright, borderColor: 'rgba(36,91,255,0.4)' },
    solid:   { background: FV.gold, color: '#0B0905', borderColor: FV.gold },
    outline: { background: 'transparent', color: FV.fg2, borderColor: FV.border },
  };
  const sel = selected ? { background: 'rgba(223,175,55,0.10)', color: FV.gold, borderColor: 'rgba(223,175,55,0.55)' } : {};
  return (
    <button onClick={onClick} style={{ ...base, ...variants[variant], ...sel, ...style, font: undefined, cursor: onClick ? 'pointer' : 'default' }}>
      {leading}{children}
    </button>
  );
}
window.Chip = Chip;

// ── Card
function Card({ children, padding = 20, radius = 14, style, accent, onClick }) {
  const accentStyles = {
    verse:  { background: `radial-gradient(120% 80% at 30% 0%, rgba(223,175,55,0.07), transparent 60%), ${FV.elev1}` },
    prayer: { background: `radial-gradient(120% 90% at 50% 0%, rgba(36,91,255,0.10), transparent 70%), ${FV.elev1}` },
    gold:   { background: `linear-gradient(180deg, rgba(223,175,55,0.06), rgba(223,175,55,0)) , ${FV.elev1}`, borderColor: 'rgba(223,175,55,0.22)' },
  };
  return (
    <div onClick={onClick} style={{
      background: FV.elev1, border: `1px solid ${FV.border}`,
      borderRadius: radius, padding,
      cursor: onClick ? 'pointer' : 'default',
      transition: `background 160ms ${FV.easeOut}, border-color 160ms ${FV.easeOut}`,
      ...(accent ? accentStyles[accent] || {} : {}),
      ...style,
    }}>{children}</div>
  );
}
window.Card = Card;

// ── Rhythm ring (progress)
function RhythmRing({ pct = 0, size = 96, stroke = 8, color = FV.cobalt, trackColor = 'rgba(247,247,247,0.06)', label, big = false, children }) {
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  const off = C * (1 - Math.max(0, Math.min(1, pct / 100)));
  return (
    <div style={{ position: 'relative', width: size, height: size, flex: 'none' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} stroke={trackColor} strokeWidth={stroke} fill="none"/>
        <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth={stroke} fill="none"
                strokeLinecap="round" strokeDasharray={C} strokeDashoffset={off}
                style={{ transition: 'stroke-dashoffset 600ms cubic-bezier(0.2,0.7,0.2,1)' }}/>
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        {children != null ? children : (
          <>
            <span style={{ fontFamily: FV.fontDisplay, fontWeight: 800, fontSize: size * (big ? 0.32 : 0.26), color: FV.fg, lineHeight: 1 }}>
              {pct}<span style={{ fontSize: size * (big ? 0.14 : 0.12), opacity: 0.55 }}>%</span>
            </span>
            {label && <span style={{ fontFamily: FV.fontMono, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: FV.fg3, marginTop: 3, fontWeight: 600 }}>{label}</span>}
          </>
        )}
      </div>
    </div>
  );
}
window.RhythmRing = RhythmRing;

// ── Module tile
function ModuleTile({ icon, title, duration, onClick, done, accent }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button onClick={onClick}
            onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
            style={{
              background: hover ? FV.elev2 : FV.elev1, border: `1px solid ${hover ? FV.borderStrong : FV.border}`,
              borderRadius: 14, padding: 16, textAlign: 'left', cursor: 'pointer', color: FV.fg,
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              minHeight: 132, transition: `all 160ms ${FV.easeOut}`,
            }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: done ? FV.goldSoft : accent === 'cobalt' ? FV.cobaltSoft : 'rgba(247,247,247,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1px solid ${done ? 'rgba(223,175,55,0.28)' : 'transparent'}`,
      }}>
        <Icon name={icon} size={18} color={done ? FV.gold : accent === 'cobalt' ? FV.cobaltBright : FV.fg2}/>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 14, gap: 8 }}>
        <div style={{ fontFamily: FV.fontHeading, fontWeight: 600, fontSize: 15, lineHeight: 1.2 }}>{title}</div>
        <div style={{ fontFamily: FV.fontMono, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: done ? FV.gold : FV.fg3, fontWeight: 600, flex: 'none' }}>
          {done ? 'Done' : duration}
        </div>
      </div>
    </button>
  );
}
window.ModuleTile = ModuleTile;

// ── Flame mark
function FlameMark({ size = 18, opacity = 1, style }) {
  return (
    <img src={FV_ASSETS.flameMark} alt="" aria-hidden
         style={{ height: size, width: 'auto', display: 'block', opacity, ...style }}/>
  );
}
window.FlameMark = FlameMark;

// ── Stepper dots (progress dots for onboarding)
function StepDots({ total, current }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          width: i === current ? 22 : 6, height: 6, borderRadius: 999,
          background: i <= current ? FV.gold : 'rgba(247,247,247,0.14)',
          transition: `width 240ms ${FV.easeOut}, background 240ms ${FV.easeOut}`,
        }}/>
      ))}
    </div>
  );
}
window.StepDots = StepDots;

// ── Pill (segmented control)
function SegmentedControl({ options, value, onChange }) {
  return (
    <div style={{
      display: 'inline-flex', padding: 3, background: FV.elev1,
      borderRadius: 999, border: `1px solid ${FV.border}`, gap: 2,
    }}>
      {options.map(o => {
        const on = o.value === value;
        return (
          <button key={o.value} onClick={() => onChange(o.value)} style={{
            padding: '7px 13px', borderRadius: 999, border: 0, cursor: 'pointer',
            background: on ? FV.gold : 'transparent',
            color: on ? '#0B0905' : FV.fg2,
            fontFamily: FV.fontMono, fontSize: 10, letterSpacing: '0.14em',
            textTransform: 'uppercase', fontWeight: 600,
            transition: `all 140ms ${FV.easeOut}`,
          }}>{o.label}</button>
        );
      })}
    </div>
  );
}
window.SegmentedControl = SegmentedControl;

// ── Choice card (for onboarding — large tappable)
function ChoiceCard({ icon, title, sub, selected, onClick, dense = false }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', textAlign: 'left', cursor: 'pointer',
      background: selected ? 'rgba(223,175,55,0.07)' : FV.elev1,
      border: `1px solid ${selected ? 'rgba(223,175,55,0.55)' : FV.border}`,
      borderRadius: 14, padding: dense ? '14px 16px' : 18,
      color: FV.fg, display: 'flex', alignItems: 'center', gap: 14,
      transition: `all 160ms ${FV.easeOut}`,
    }}>
      {icon && (
        <div style={{
          width: dense ? 36 : 40, height: dense ? 36 : 40, borderRadius: 10,
          background: selected ? FV.goldSoft : 'rgba(247,247,247,0.05)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none',
          border: `1px solid ${selected ? 'rgba(223,175,55,0.28)' : 'transparent'}`,
        }}>
          <Icon name={icon} size={dense ? 17 : 19} color={selected ? FV.gold : FV.fg2}/>
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: FV.fontHeading, fontWeight: 600, fontSize: dense ? 14 : 15, color: FV.fg }}>{title}</div>
        {sub && <div style={{ fontFamily: FV.fontBody, fontSize: 12, color: FV.fg3, marginTop: 2, lineHeight: 1.4 }}>{sub}</div>}
      </div>
      <div style={{
        width: 18, height: 18, borderRadius: 999, flex: 'none',
        border: `1.5px solid ${selected ? FV.gold : FV.border}`,
        background: selected ? FV.gold : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {selected && <Icon name="check" size={11} color="#0B0905" strokeWidth={2.5}/>}
      </div>
    </button>
  );
}
window.ChoiceCard = ChoiceCard;

// ── Rhythm bar (7-day mini bar)
function RhythmBar({ days, height = 36 }) {
  // days: array of { label, value 0–1, today? }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${days.length}, 1fr)`, gap: 8 }}>
      {days.map((d, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: '100%', height, borderRadius: 6,
            background: 'rgba(247,247,247,0.05)',
            border: `1px solid ${d.today ? 'rgba(223,175,55,0.4)' : 'transparent'}`,
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', left: 0, right: 0, bottom: 0,
              height: `${(d.value || 0) * 100}%`,
              background: d.value >= 1 ? FV.gold : d.value > 0 ? FV.cobalt : 'transparent',
              borderRadius: 6,
              transition: `height 400ms ${FV.easeOut}`,
            }}/>
          </div>
          <div style={{
            fontFamily: FV.fontMono, fontSize: 9, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: d.today ? FV.gold : FV.fg3, fontWeight: 600,
          }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
}
window.RhythmBar = RhythmBar;
