export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 40 40"
      fill="none"
      className={className}
      aria-hidden
    >
      <circle cx="20" cy="20" r="20" fill="#17191F" />
      <path
        d="M13 22.5L20 14l7 8.5"
        stroke="#F5F5F2"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 16.5V27"
        stroke="#F5F5F2"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
