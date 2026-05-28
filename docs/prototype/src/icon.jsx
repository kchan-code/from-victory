// From Victory — Icon set. Lucide-inspired 24x24 line icons, 1.75px stroke.

const FV_ICONS = {
  home:        'M3 11l9-7 9 7M5 11v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9 M9 22v-7h6v7',
  homeFill:    'M11.3 3.2a1 1 0 0 1 1.4 0L20 9v11a2 2 0 0 1-2 2h-3.5v-7h-5V22H6a2 2 0 0 1-2-2V9z',
  train:       'M5 4h11a3 3 0 0 1 3 3v11l-4-2H5z M9 9h7 M9 13h5',
  trainFill:   'M5 4h11a3 3 0 0 1 3 3v11l-4-2H5z',
  book:        'M3 6a2 2 0 0 1 2-2h6v17H5a2 2 0 0 0-2 2V6z M21 6a2 2 0 0 0-2-2h-6v17h6a2 2 0 0 1 2 2V6z',
  bookFill:    'M3 6a2 2 0 0 1 2-2h6v17H5a2 2 0 0 0-2 2zm18 0a2 2 0 0 0-2-2h-6v17h6a2 2 0 0 1 2 2z',
  journal:     'M6 4h11l3 3v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z M17 4v3h3 M9 12h7 M9 16h5',
  journalFill: 'M6 4h11l3 3v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z',
  profile:     'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4 21c1.5-4 5-6 8-6s6.5 2 8 6',
  profileFill: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c1.5-4 5-6 8-6s6.5 2 8 6z',
  arrowRight:  'M5 12h14 M13 6l6 6-6 6',
  arrowLeft:   'M19 12H5 M11 6l-6 6 6 6',
  arrowUpRight:'M7 17L17 7 M8 7h9v9',
  chevronRight:'M9 6l6 6-6 6',
  chevronLeft: 'M15 6l-6 6 6 6',
  chevronDown: 'M6 9l6 6 6-6',
  play:        'M7 5v14l12-7z',
  pause:       'M7 5h4v14H7z M13 5h4v14h-4z',
  clock:       'M12 7v5l3 2 M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z',
  bell:        'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9 M10 21a2 2 0 0 0 4 0',
  check:       'M4 12l5 5L20 6',
  checkCircle: 'M22 11.1V12a10 10 0 1 1-5.9-9.1 M8 11l3 3 9-9',
  circle:      'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z',
  plus:        'M12 5v14 M5 12h14',
  minus:       'M5 12h14',
  more:        'M5 12h.01M12 12h.01M19 12h.01',
  close:       'M6 6l12 12M6 18L18 6',
  settings:    'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1A2 2 0 1 1 4.3 17l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1A2 2 0 1 1 7 4.3l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  edit:        'M12 19l7-7-3-3-7 7v3h3z M14 7l3 3',
  flame:       'M12 3c-2 4-5 6-5 10a5 5 0 1 0 10 0c0-2-1.5-3.5-3-5 .5 2.5-1 4-1 4s-2-1-1-9z',
  flameFill:   'M12 3c-2 4-5 6-5 10a5 5 0 1 0 10 0c0-2-1.5-3.5-3-5 .5 2.5-1 4-1 4s-2-1-1-9z',
  target:      'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  shield:      'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  whistle:     'M14 6l8-4-2 6-6 1z M9 10a6 6 0 1 0 6 6',
  lock:        'M5 11h14v10H5z M8 11V8a4 4 0 1 1 8 0v3',
  hockey:      'M3 21h18 M5 17l8-14 4 2-8 14z M14 10l3 1.5',
  basketball:  'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M2 12h20 M12 2c3 3 3 17 0 20 M12 2c-3 3-3 17 0 20',
  football:    'M5 5c8-4 14 2 14 2s6 6 2 14c-8 4-14-2-14-2S1 13 5 5z M9 9l6 6 M11 7l6 6 M7 11l6 6',
  soccer:      'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 8l4 3-1.5 5h-5L8 11z',
  baseball:    'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M4.5 7.5C7 9 8 12 8 15s-1 6-3.5 7.5 M19.5 7.5C17 9 16 12 16 15s1 6 3.5 7.5',
  wind:        'M4 12h12a3 3 0 1 0-3-3 M4 17h17a3 3 0 1 1-3 3 M4 7h5',
  heart:       'M12 21s-8-5.5-8-12a5 5 0 0 1 8-4 5 5 0 0 1 8 4c0 6.5-8 12-8 12z',
  sparkle:     'M12 3v4 M12 17v4 M3 12h4 M17 12h4 M5.6 5.6l2.8 2.8 M15.6 15.6l2.8 2.8 M18.4 5.6l-2.8 2.8 M8.4 15.6l-2.8 2.8',
  trending:    'M3 17l6-6 4 4 8-8 M14 7h7v7',
  calendar:    'M5 6h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z M16 3v6 M8 3v6 M4 11h16',
  tag:         'M20.6 12.6 12 21l-8-8 8.6-8.6L20.6 4z M15 9h.01',
  trophy:      'M8 21h8 M12 17v4 M6 4h12v5a6 6 0 1 1-12 0z M6 5H4a2 2 0 0 0 0 4h2 M18 5h2a2 2 0 0 1 0 4h-2',
  search:      'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z M21 21l-4.3-4.3',
  filter:      'M3 5h18l-7 9v6l-4-2v-4z',
  user:        'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4 21c1.5-4 5-6 8-6s6.5 2 8 6',
  users:       'M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M2 21c1-3.5 4-5 7-5s6 1.5 7 5 M17 11a3 3 0 1 0 0-6 M21 21a4 4 0 0 0-3-7',
  pray:        'M9 4h6l-1.5 8h2.5l-3 9-3-9h2.5z',
  pen:         'M3 21l4-1 11-11-3-3L4 17z M14 6l3 3',
  download:    'M12 4v12 M6 12l6 6 6-6 M4 22h16',
  share:       'M12 3v12 M6 9l6-6 6 6 M4 14v5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5',
  zap:         'M13 2L4 14h7l-1 8 9-12h-7z',
  shieldCheck: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z M9 12l2 2 4-4',
  micOff:      'M9 9V5a3 3 0 0 1 6 0v6 M5 11a7 7 0 0 0 13 4 M12 18v4 M3 3l18 18',
};

const FV_FILLED = new Set(['homeFill','flameFill','trainFill','bookFill','journalFill','profileFill']);

function Icon({ name, size = 22, color = 'currentColor', filled = false, strokeWidth = 1.75 }) {
  const key = filled && FV_ICONS[name + 'Fill'] ? name + 'Fill' : name;
  const path = FV_ICONS[key];
  if (!path) return null;
  const isFilled = filled && FV_FILLED.has(key);
  if (isFilled) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden>
        {path.split(' M').map((seg, i) => (
          <path key={i} d={(i === 0 ? '' : 'M') + seg} />
        ))}
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke={color} strokeWidth={strokeWidth}
         strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {path.split(' M').map((seg, i) => (
        <path key={i} d={(i === 0 ? '' : 'M') + seg} />
      ))}
    </svg>
  );
}

window.Icon = Icon;
