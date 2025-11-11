export function HeroBackdrop() {
  return (
    <svg
      viewBox="0 0 1440 400"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      <defs>
        <linearGradient id="hero-sky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id="hero-road" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#0f172a" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#020617" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id="hero-divider" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#f8fafc" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#e2e8f0" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      <rect width="1440" height="400" fill="url(#hero-sky)" />
      <g opacity="0.6">
        <path d="M-120 340 L340 180 L720 320 L1100 170 L1600 340 L1600 420 L-120 420 Z" fill="#0b1526" />
        <path d="M-60 360 L360 200 L720 320 L1080 210 L1500 360 L1500 420 L-60 420 Z" fill="#12213a" opacity="0.8" />
      </g>
      <path d="M600 0 L840 0 L960 420 L480 420 Z" fill="url(#hero-road)" opacity="0.85" />
      <path d="M718 0 L722 0 L842 420 L838 420 Z" fill="url(#hero-divider)" opacity="0.8" />
      <path d="M682 0 L686 0 L806 420 L802 420 Z" fill="url(#hero-divider)" opacity="0.45" />
    </svg>
  );
}
