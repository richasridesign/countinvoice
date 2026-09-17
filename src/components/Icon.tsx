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
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2.2" />
      <path d="M4 6.5l8 6 8-6" />
    </>
  ),
  google: (
    <path d="M12 10.9v3.7h5.2c-.2 1.3-1.6 3.9-5.2 3.9-3.1 0-5.7-2.6-5.7-5.8s2.6-5.8 5.7-5.8c1.8 0 3 .8 3.6 1.4l2.5-2.4C16.7 4.4 14.6 3.5 12 3.5 6.9 3.5 2.8 7.7 2.8 12.7S6.9 22 12 22c6.9 0 8.6-4.8 8.6-7.3 0-.5-.1-1-.1-1.4H12z" />
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
