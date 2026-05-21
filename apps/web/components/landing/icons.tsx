// Hidden SVG sprite of all icon symbols used on the landing page.
// Render once near the top of the page; reference via <SvgIcon name="..." />.

export function LandingIconDefs() {
  return (
    <svg
      width="0"
      height="0"
      style={{ position: "absolute" }}
      aria-hidden="true"
    >
      <defs>
        <symbol id="i-arrow" viewBox="0 0 16 16">
          <path
            d="M3 8h10M9 4l4 4-4 4"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </symbol>
        <symbol id="i-play" viewBox="0 0 16 16">
          <path
            d="M4 3.5v9l8-4.5-8-4.5z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
            fill="none"
          />
        </symbol>
        <symbol id="i-wind" viewBox="0 0 24 24">
          <path
            d="M3 8h10a3 3 0 100-6M3 12h14a3 3 0 110 6M3 16h6"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </symbol>
        <symbol id="i-book" viewBox="0 0 24 24">
          <path
            d="M4 4h6a3 3 0 013 3v13a2 2 0 00-2-2H4V4zM20 4h-6a3 3 0 00-3 3v13a2 2 0 012-2h7V4z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </symbol>
        <symbol id="i-pen" viewBox="0 0 24 24">
          <path
            d="M15 4l5 5L9 20H4v-5L15 4z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </symbol>
        <symbol id="i-target" viewBox="0 0 24 24">
          <circle
            cx="12"
            cy="12"
            r="9"
            stroke="currentColor"
            strokeWidth="1.75"
            fill="none"
          />
          <circle
            cx="12"
            cy="12"
            r="5"
            stroke="currentColor"
            strokeWidth="1.75"
            fill="none"
          />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        </symbol>
        <symbol id="i-flame" viewBox="0 0 24 24">
          <path
            d="M12 2c1 3 3 4 3 7a3 3 0 11-6 0c0-1 .5-2 1-3-2 1-4 4-4 7a6 6 0 0012 0c0-5-3-8-6-11z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
            fill="none"
          />
        </symbol>
        <symbol id="i-bell" viewBox="0 0 24 24">
          <path
            d="M6 16V11a6 6 0 1112 0v5l1.5 2.5h-15L6 16zM10 20a2 2 0 004 0"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </symbol>
        <symbol id="i-home" viewBox="0 0 24 24">
          <path
            d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1v-9z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
            fill="none"
          />
        </symbol>
        <symbol id="i-zap" viewBox="0 0 24 24">
          <path
            d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
            fill="none"
          />
        </symbol>
        <symbol id="i-user" viewBox="0 0 24 24">
          <circle
            cx="12"
            cy="8"
            r="4"
            stroke="currentColor"
            strokeWidth="1.75"
            fill="none"
          />
          <path
            d="M4 21a8 8 0 0116 0"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            fill="none"
          />
        </symbol>
        <symbol id="i-shield" viewBox="0 0 24 24">
          <path
            d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
            fill="none"
          />
        </symbol>
        <symbol id="i-link" viewBox="0 0 24 24">
          <path
            d="M10 13a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1M14 11a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </symbol>
        <symbol id="i-pulse" viewBox="0 0 24 24">
          <path
            d="M2 12h4l3-7 4 14 3-7h6"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </symbol>
        <symbol id="i-anchor" viewBox="0 0 24 24">
          <circle
            cx="12"
            cy="6"
            r="3"
            stroke="currentColor"
            strokeWidth="1.75"
            fill="none"
          />
          <path
            d="M12 9v13M5 13a7 7 0 0014 0M8 17H5M19 17h-3"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </symbol>
        <symbol id="i-check" viewBox="0 0 16 16">
          <path
            d="M3 8.5l3 3 7-7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </symbol>
        <symbol id="i-chev" viewBox="0 0 16 16">
          <path
            d="M6 4l4 4-4 4"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </symbol>
      </defs>
    </svg>
  );
}
