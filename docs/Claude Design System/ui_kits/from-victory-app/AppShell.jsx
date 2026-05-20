// From Victory — App shell: top bar + bottom tab bar + screen wrapper

function TopBar({ title, eyebrow, onBack, trailing }) {
  return (
    <div style={{
      padding: '66px 20px 12px', display: 'flex', alignItems: 'center', gap: 12,
      minHeight: 56, position: 'sticky', top: 0, zIndex: 5,
      background: 'rgba(5,5,5,0.78)', backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      borderBottom: `1px solid ${FV.border}`,
    }}>
      {onBack && (
        <button onClick={onBack} aria-label="Back" style={{
          width: 36, height: 36, borderRadius: 999, background: 'transparent',
          border: `1px solid ${FV.border}`, color: FV.fg, display: 'inline-flex',
          alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          <Icon name="arrowLeft" size={18}/>
        </button>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        {title && <div style={{ fontFamily: FV.fontHeading, fontWeight: 600, fontSize: 18, color: FV.fg, marginTop: eyebrow ? 2 : 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>}
      </div>
      {trailing}
    </div>
  );
}
window.TopBar = TopBar;

function TabBar({ active, onChange }) {
  const tabs = [
    { id: 'today',    label: 'Today',   icon: 'home',    iconFill: 'home' },
    { id: 'train',    label: 'Train',   icon: 'train' },
    { id: 'journal',  label: 'Journal', icon: 'journal' },
    { id: 'word',     label: 'Word',    icon: 'book' },
    { id: 'you',      label: 'You',     icon: 'profile' },
  ];
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0,
      paddingBottom: 28, paddingTop: 8,
      background: 'rgba(5,5,5,0.92)', backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderTop: `1px solid ${FV.border}`,
      display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', zIndex: 10,
    }}>
      {tabs.map(t => {
        const on = t.id === active;
        return (
          <button key={t.id} onClick={() => onChange(t.id)} style={{
            background: 'transparent', border: 0, padding: '8px 0', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
            color: on ? FV.gold : FV.fg2,
          }}>
            <Icon name={t.icon} size={22} filled={on && t.iconFill === t.icon}/>
            <span style={{ fontFamily: FV.fontMono, fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600 }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
window.TabBar = TabBar;

// Screen wrapper — handles scrollable content above the tab bar
function Screen({ children, padBottom = 110, scroll = true, style }) {
  return (
    <div style={{
      flex: 1, overflowY: scroll ? 'auto' : 'hidden', overflowX: 'hidden',
      background: FV.bg, color: FV.fg,
      paddingBottom: padBottom,
      ...style,
    }}>
      {children}
    </div>
  );
}
window.Screen = Screen;
