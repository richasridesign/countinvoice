/** Inline icon set, ported from the prototype's ICONS map. */

const PATHS: Record<string, React.ReactNode> = {
  grid: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.3" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.3" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.3" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.3" />
    </>
  ),
  users: (
    <>
      <circle cx="8.5" cy="8" r="3.2" />
      <path d="M2.8 19c.7-3.2 2.9-5 5.7-5s5 1.8 5.7 5" />
      <circle cx="16.8" cy="8.6" r="2.6" />
      <path d="M15 14.3c2.2.2 4 1.9 4.6 4.7" />
    </>
  ),
  check: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
      <path d="M8 12.3l2.6 2.6L16.2 9" />
    </>
  ),
  file: (
    <>
      <path d="M6.5 2.8h7.4L18 7.3v13.9a1 1 0 0 1-1 1h-10.5a1 1 0 0 1-1-1V3.8a1 1 0 0 1 1-1z" />
      <path d="M13.7 2.8V7h4.3" />
      <path d="M8.2 12.2h6.7M8.2 15.6h6.7M8.2 18.9h4" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" strokeWidth="1.8" />,
  back: <path d="M15 18l-6-6 6-6" strokeWidth="1.8" />,
  chevron: <path d="M6 9l6 6 6-6" strokeWidth="1.8" />,
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2.2" />
      <path d="M4 6.5l8 6 8-6" />
    </>
  ),
  // The Google "G" keeps its four brand colours, drawn on a 48-unit grid and scaled to fit.
  google: (
    <g transform="scale(0.5)" stroke="none">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </g>
  ),
  print: (
    <>
      <path d="M6.5 8.5V3.8h11V8.5" />
      <rect x="4.2" y="8.5" width="15.6" height="8" rx="1.6" />
      <path d="M6.5 15.5v4.7h11v-4.7" />
    </>
  ),
  link: (
    <>
      <path d="M9.5 14.5l5-5" />
      <path d="M13 6.3l1-1a3.6 3.6 0 0 1 5.1 5.1l-1.8 1.8" />
      <path d="M11 17.7l-1 1a3.6 3.6 0 0 1-5.1-5.1l1.8-1.8" />
    </>
  ),
  sign: (
    <>
      <path d="M6.3 2.8h8.2L18.7 7v13.2a1 1 0 0 1-1 1H6.3a1 1 0 0 1-1-1V3.8a1 1 0 0 1 1-1z" />
      <path d="M14.5 2.8V7h4.2" />
      <path d="M8 14.2c.9-1.1 1.7-1.1 2.2-.2s1.1 1 1.8.1 1.4-1.3 2.2-.2.9 1.4 1.8.6" />
    </>
  ),
  trash: (
    <>
      <path d="M4 6.5h16" />
      <path d="M8.5 6.5V4.8a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1V6.5" />
      <path d="M6.5 6.5l.7 12.7a1 1 0 0 0 1 .95h7.6a1 1 0 0 0 1-.95l.7-12.7" />
      <path d="M10.2 10.5v6M13.8 10.5v6" />
    </>
  ),
  edit: (
    <>
      <path d="M14.3 4.3l5.4 5.4L8 21.4H2.6V16z" />
      <path d="M12.3 6.3l5.4 5.4" />
    </>
  ),
  external: (
    <>
      <path
        d="M9.5 5.5H6a1.5 1.5 0 0 0-1.5 1.5v11A1.5 1.5 0 0 0 6 19.5h11a1.5 1.5 0 0 0 1.5-1.5v-3.5"
        strokeWidth="1.8"
      />
      <path d="M13.5 4.5H19.5V10.5" strokeWidth="1.8" />
      <path d="M19.2 4.8l-8 8" strokeWidth="1.8" />
    </>
  ),
  upload: (
    <>
      <path d="M12 15.5V4.5" />
      <path d="M7.5 9 12 4.5 16.5 9" />
      <path d="M4.5 15.5v3a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5v-3" />
    </>
  ),
  download: (
    <>
      <path d="M12 4.5v11" />
      <path d="M7.5 11 12 15.5 16.5 11" />
      <path d="M4.5 15.5v3a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5v-3" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5.5" width="16" height="14.5" rx="2" />
      <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" />
    </>
  ),
  bell: (
    <>
      <path d="M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 1.5H5z" />
      <path d="M10 20.5a2 2 0 0 0 4 0" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 3.5v2.4M12 18.1v2.4M20.5 12h-2.4M5.9 12H3.5M17.8 6.2l-1.7 1.7M7.9 16.1l-1.7 1.7M17.8 17.8l-1.7-1.7M7.9 7.9 6.2 6.2" />
    </>
  ),
};

export type IconName = keyof typeof PATHS;

export function Icon({ name }: { name: IconName }) {
  const body = PATHS[name];
  if (!body) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {body}
    </svg>
  );
}
