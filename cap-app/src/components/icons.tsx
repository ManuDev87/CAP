/**
 * Inline SVG icon set (lucide-style). Replaces the FontAwesome CDN kit so
 * icons keep working offline and match the corporate design system.
 */
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function StrokeIcon({ children, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      width="1em"
      height="1em"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconLogout = (p: IconProps) => (
  <StrokeIcon {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </StrokeIcon>
);

export const IconChart = (p: IconProps) => (
  <StrokeIcon {...p}>
    <path d="M3 3v16a2 2 0 0 0 2 2h16" />
    <path d="m19 9-5 5-4-4-3 3" />
  </StrokeIcon>
);

export const IconArrowLeft = (p: IconProps) => (
  <StrokeIcon {...p}>
    <path d="m12 19-7-7 7-7" />
    <path d="M19 12H5" />
  </StrokeIcon>
);

export const IconFlask = (p: IconProps) => (
  <StrokeIcon {...p}>
    <path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2" />
    <path d="M8.5 2h7" />
    <path d="M7 16h10" />
  </StrokeIcon>
);

export const IconTrash = (p: IconProps) => (
  <StrokeIcon {...p}>
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </StrokeIcon>
);

export const IconHelp = (p: IconProps) => (
  <StrokeIcon {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <path d="M12 17h.01" />
  </StrokeIcon>
);

export const IconComment = (p: IconProps) => (
  <StrokeIcon {...p}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    <path d="M8 9h.01" />
    <path d="M12 9h.01" />
    <path d="M16 9h.01" />
  </StrokeIcon>
);

export const IconFileSign = (p: IconProps) => (
  <StrokeIcon {...p}>
    <path d="M20 19.5v.5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8.5L18 5.5" />
    <path d="M8 18h1" />
    <path d="M18.4 9.6a2.1 2.1 0 1 1 3 3L17 17l-4 1 1-4Z" />
  </StrokeIcon>
);

export const IconTeacher = (p: IconProps) => (
  <StrokeIcon {...p}>
    <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
    <path d="M22 10v6" />
    <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
  </StrokeIcon>
);

export const IconChevronLeft = (p: IconProps) => (
  <StrokeIcon {...p}>
    <path d="m15 18-6-6 6-6" />
  </StrokeIcon>
);

export const IconChevronRight = (p: IconProps) => (
  <StrokeIcon {...p}>
    <path d="m9 18 6-6-6-6" />
  </StrokeIcon>
);

export const IconChevronUp = (p: IconProps) => (
  <StrokeIcon {...p}>
    <path d="m18 15-6-6-6 6" />
  </StrokeIcon>
);

export const IconChevronDown = (p: IconProps) => (
  <StrokeIcon {...p}>
    <path d="m6 9 6 6 6-6" />
  </StrokeIcon>
);

export const IconWarning = (p: IconProps) => (
  <StrokeIcon {...p}>
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </StrokeIcon>
);

export const IconPauseCircle = (p: IconProps) => (
  <StrokeIcon {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="M10 15V9" />
    <path d="M14 15V9" />
  </StrokeIcon>
);

/** Adobe-PDF glyph used on the "Plantilla CAP" card (from the legacy app). */
export const IconPdf = (p: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 384 512"
    width="1em"
    height="1em"
    fill="currentColor"
    aria-hidden="true"
    {...p}
  >
    <path d="M181.9 256.1c-5-16-4.9-46.9-2-46.9 8.4 0 7.6 36.9 2 46.9zm-1.7 47.2c-7.7 20.2-17.3 43.3-28.4 62.7 18.3-7 39-17.2 62.9-21.9-12.7-9.6-24.9-23.4-34.5-40.8zM86.1 428.1c0 .8 13.2-5.4 34.9-40.2-6.7 6.3-29.1 24.5-34.9 40.2zM248 160h136v328c0 13.3-10.7 24-24 24H24c-13.3 0-24-10.7-24-24V24C0 10.7 10.7 0 24 0h200v136c0 13.2 10.8 24 24 24zm-8 171.8c-20-12.2-33.3-29-42.7-53.8 4.5-18.5 11.6-46.6 6.2-64.2-4.7-29.4-42.4-26.5-47.8-6.8-5 18.3-.4 44.1 8.1 77-11.6 27.6-28.7 64.6-40.8 85.8-.1 0-.1.1-.2.1-27.1 13.9-73.6 44.5-54.5 68 5.6 6.9 16 10 21.5 10 17.9 0 35.7-18 61.1-61.8 25.8-8.5 54.1-19.1 79-23.2 21.7 11.8 47.1 19.5 64 19.5 29.2 0 31.2-32 19.7-43.4-13.9-13.6-54.3-9.7-73.6-7.2zM377 105L279 7c-4.5-4.5-10.6-7-17-7h-6v128h128v-6.1c0-6.3-2.5-12.4-7-16.9zm-74.1 255.3c4.1-2.7-2.5-11.9-42.8-9 37.1 15.8 42.8 9 42.8 9z" />
  </svg>
);

export const IconCheckBadge = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="11" fill="#fff" />
    <path
      d="M7 13l3.5 3.5L17 9"
      stroke="var(--color-brand-500)"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const IconCrossBadge = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="11" fill="#fff" />
    <line x1="7" y1="7" x2="17" y2="17" stroke="var(--color-danger-500)" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="17" y1="7" x2="7" y2="17" stroke="var(--color-danger-500)" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

export const IconCheckCircle = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" width="22" height="22">
    <circle cx="12" cy="12" r="11" fill="var(--color-brand-500)" />
    <path d="M7 13l3.5 3.5L17 9" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

export const IconCrossCircle = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" width="22" height="22">
    <circle cx="12" cy="12" r="11" fill="var(--color-danger-500)" />
    <line x1="7" y1="7" x2="17" y2="17" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="17" y1="7" x2="7" y2="17" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

export const IconSpinner = (p: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    width="1em"
    height="1em"
    aria-hidden="true"
    className={`animate-spin ${p.className ?? ""}`}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

export const IconX = (p: IconProps) => (
  <StrokeIcon {...p}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </StrokeIcon>
);

export const IconExternalLink = (p: IconProps) => (
  <StrokeIcon {...p}>
    <path d="M15 3h6v6" />
    <path d="M10 14 21 3" />
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
  </StrokeIcon>
);

export const IconSearch = (p: IconProps) => (
  <StrokeIcon {...p}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </StrokeIcon>
);

export const IconUsers = (p: IconProps) => (
  <StrokeIcon {...p}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </StrokeIcon>
);

export const IconUserPlus = (p: IconProps) => (
  <StrokeIcon {...p}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <line x1="19" y1="8" x2="19" y2="14" />
    <line x1="22" y1="11" x2="16" y2="11" />
  </StrokeIcon>
);

export const IconLayoutDashboard = (p: IconProps) => (
  <StrokeIcon {...p}>
    <rect width="7" height="9" x="3" y="3" rx="1" />
    <rect width="7" height="5" x="14" y="3" rx="1" />
    <rect width="7" height="9" x="14" y="12" rx="1" />
    <rect width="7" height="5" x="3" y="16" rx="1" />
  </StrokeIcon>
);
