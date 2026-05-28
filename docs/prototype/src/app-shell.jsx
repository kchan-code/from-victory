// From Victory — App shell (TopBar, TabBar, Screen wrapper)

function TopBar({ title, eyebrow, onBack, trailing, transparent, sticky = true, dense = false }) {
  return (
    <div style={{
      padding: `${dense ? 50 : 60}px 20px ${dense ? 8 : 12}px`,
      display: 'flex', alignItems: 'center', gap: 12,
      minHeight: 52, position: sticky ? 'sticky' : 'relative', top: 0, zIndex: 5,
      background: transparent ? 'transparent' : 'rgba(5,5,5,0.78)',
      backdropFilter: transparent ? 'none' : 'blur(14px)',
      WebkitBackdropFilter: transparent ? 'none' : 'blur(14px)',
      borderBottom: transparent ? 'none' : `1px solid ${FV.border}`,
    }}>
      {onBack && (
        <button onClick={onBack} aria-label="Back" style={{
          width: 36, height: 36, borderRadius: 999, background: 'transparent',
          border: `1px solid ${FV.border}`, color: FV.fg, display: 'inline-flex',
          alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flex: 'none',
        }}>
          <Icon name="arrowLeft" size={18}/>
        </button>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        {title && <div style={{
          fontFamily: FV.fontHeading, fontWeight: 600, fontSize: 17, color: FV.fg,
          marginTop: eyebrow ? 2 : 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          letterSpacing: '-0.005em',
        }}>{title}</div>}
      </div>
      {trailing}
    </div>
  );
}
window.TopBar = TopBar;

function TabBar({ active, onChange }) {
  const tabs = [
    { id: 'today',   label: 'Today',   icon: 'home' },
    { id: 'train',   label: 'Train',   icon: 'train' },
    { id: 'word',    label: 'Word',    icon: 'book' },
    { id: 'journal', label: 'Journal', icon: 'journal' },
    { id: 'you',     label: 'You',     icon: 'profile' },
  ];
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0,
      paddingBottom: 28, paddingTop: 10,
      background: 'rgba(5,5,5,0.92)',
      backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
      borderTop: `1px solid ${FV.border}`,
      display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', zIndex: 10,
    }}>
      {tabs.map(t => {
        const on = t.id === active;
        return (
          <button key={t.id} onClick={() => onChange(t.id)} style={{
            background: 'transparent', border: 0, padding: '6px 0 4px', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
            color: on ? FV.gold : FV.fg2,
            position: 'relative',
          }}>
            <Icon name={t.icon} size={22} filled={on}/>
            <span style={{
              fontFamily: FV.fontMono, fontSize: 9, letterSpacing: '0.18em',
              textTransform: 'uppercase', fontWeight: 600,
            }}>{t.label}</span>
            {on && <div style={{
              position: 'absolute', top: -10, width: 22, height: 2, borderRadius: 2,
              background: FV.gold,
            }}/>}
          </button>
        );
      })}
    </div>
  );
}
window.TabBar = TabBar;

// Screen wrapper — scrollable area above the tab bar
function Screen({ children, padBottom = 110, scroll = true, background, style }) {
  return (
    <div style={{
      flex: 1, height: '100%',
      overflowY: scroll ? 'auto' : 'hidden', overflowX: 'hidden',
      background: background || FV.bg, color: FV.fg,
      paddingBottom: padBottom,
      position: 'relative',
      ...style,
    }}>
      {children}
    </div>
  );
}
window.Screen = Screen;
