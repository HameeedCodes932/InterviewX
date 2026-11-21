type IconProps = { className?: string };

/** Original, consistent line icons for interview categories. */
export function IconSoftwareEngineering({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M8 8.5L4.5 12 8 15.5M16 8.5L19.5 12 16 15.5M13.2 6.5l-2.4 11"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconIssb({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M12 3.5l2.1 4.3 4.7.7-3.4 3.3.8 4.7L12 14.3 7.8 16.5l.8-4.7-3.4-3.3 4.7-.7L12 3.5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconAiMl({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="12" r="2.2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="5.5" cy="7" r="1.6" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="18.5" cy="7" r="1.6" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="5.5" cy="17" r="1.6" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="18.5" cy="17" r="1.6" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10.2 10.8 6.8 8.2M13.8 10.8l3.4-2.6M10.2 13.2l-3.4 2.6M13.8 13.2l3.4 2.6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconCssPms({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M7 4.5h10a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 18V6A1.5 1.5 0 0 1 7 4.5z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M8.5 9h7M8.5 12.5h7M8.5 16h4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconScholarship({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M3.5 10.5 12 6l8.5 4.5L12 15 3.5 10.5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M7 12.5v4.2c0 .4.7 1.5 5 2.8 4.3-1.3 5-2.4 5-2.8v-4.2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20.5 10.8v5.2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconHrBehavioural({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="9" cy="8.5" r="2.3" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16" cy="9.2" r="1.9" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M4.5 18.5c.6-2.8 2.6-4.2 4.5-4.2s3.9 1.4 4.5 4.2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M13.2 14.6c.9-.7 2-1.1 3.1-1.1 1.6 0 3 1 3.7 2.8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
