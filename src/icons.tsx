// src/icons.tsx
import * as React from "react";

/** Base props are just normal SVG props */
type IconProps = React.SVGProps<SVGSVGElement>;

/** Simple line icon */
export const IconBooking: React.FC<IconProps> = ({ className = "", ...props }) => (
  <svg
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    aria-hidden
    role="img"
    className={`inline align-[-.125em] ${className}`}
    {...props}
  >
    {/* calendar outline */}
    <rect x="3" y="4.5" width="18" height="16" rx="2.5"
      fill="none" stroke="currentColor" strokeWidth="1.8" />
    <path d="M8 3.5v3M16 3.5v3M3 9h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    {/* little date square */}
    <rect x="7.5" y="12" width="4" height="3.5" rx="0.6" fill="currentColor" opacity=".25" />
  </svg>
);

/** Customers (two-tone example with primary + subtle secondary) */
export const IconCustomers: React.FC<IconProps> = ({ className = "", ...props }) => (
  <svg
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    aria-hidden
    role="img"
    className={`inline align-[-.125em] ${className}`}
    {...props}
  >
    {/* head */}
    <circle cx="8" cy="8" r="3.25" fill="none" stroke="currentColor" strokeWidth="1.8" />
    {/* torso (secondary fill uses currentColor with opacity) */}
    <path d="M3.5 18.5c.7-3 3.1-4.8 6.1-4.8s5.4 1.8 6.1 4.8"
      fill="currentColor" opacity=".18" />
    <path d="M3.5 18.5c.7-3 3.1-4.8 6.1-4.8s5.4 1.8 6.1 4.8"
      fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    {/* buddy outline */}
    <circle cx="16.5" cy="9" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" opacity=".9" />
  </svg>
);

/** Settings / gear */
export const IconSettings: React.FC<IconProps> = ({ className = "", ...props }) => (
  <svg
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    aria-hidden
    role="img"
    className={`inline align-[-.125em] ${className}`}
    {...props}
  >
    <circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M19 12a7 7 0 0 0-.1-1l2.1-1.6-1.8-3.1-2.5.6a7 7 0 0 0-1.7-1L14.5 2h-5L8 5.9a7 7 0 0 0-1.7 1l-2.5-.6L2 9.4 4.1 11a7 7 0 0 0 0 2L2 14.6l1.8 3.1 2.5-.6a7 7 0 0 0 1.7 1L9.5 22h5l.4-2.9a7 7 0 0 0 1.7-1l2.5.6 1.8-3.1L18.9 13c.1-.3.1-.7.1-1Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity=".9"
    />
  </svg>
);