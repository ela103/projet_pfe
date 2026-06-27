type SmartSEOLogoProps = {
  compact?: boolean
  className?: string
}

function LogoMark({ compact = false }: { compact?: boolean }) {
  const prefix = compact ? "smartseo-mark" : "smartseo-logo"

  return (
    <g>
      <circle
        cx="44"
        cy="43"
        r="23"
        stroke={`url(#${prefix}-ring)`}
        strokeWidth="5"
      />

      <path
        d="M32 50V57"
        stroke="#1A2754"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M41 45V57"
        stroke="#315CFF"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M50 39V57"
        stroke="#8B5CF6"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M59 34V57"
        stroke="#20D6C7"
        strokeWidth="5"
        strokeLinecap="round"
      />

      <path
        d="M28.5 45L38 37L47 42L59.5 30.5"
        stroke="#6D45F5"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M54.5 30.5H59.5V35.5"
        stroke="#6D45F5"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M61 60L75 74"
        stroke="#315CFF"
        strokeWidth="6"
        strokeLinecap="round"
      />

      <defs>
        <linearGradient
          id={`${prefix}-ring`}
          x1="23"
          y1="20"
          x2="67"
          y2="68"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#A855F7" />
          <stop offset="0.55" stopColor="#7C3AED" />
          <stop offset="1" stopColor="#315CFF" />
        </linearGradient>
      </defs>
    </g>
  )
}

export function SmartSEOLogo({ compact = false, className = "" }: SmartSEOLogoProps) {
  if (compact) {
    return (
      <svg
        viewBox="0 0 88 88"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-labelledby="smartseo-mark-title"
        role="img"
      >
        <title id="smartseo-mark-title">SmartSEO</title>
        <LogoMark compact />
      </svg>
    )
  }

  return (
    <svg
      viewBox="0 0 190 132"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-labelledby="smartseo-logo-title"
      role="img"
    >
      <title id="smartseo-logo-title">SmartSEO</title>
      <g transform="translate(51 2)">
        <LogoMark />
      </g>
      <text
        x="95"
        y="116"
        fill="currentColor"
        fontFamily="Inter, ui-sans-serif, system-ui, sans-serif"
        fontSize="28"
        fontWeight="800"
        letterSpacing="-1.2"
        textAnchor="middle"
      >
        Smart<tspan fill="#8B5CF6" fontWeight="850">SEO</tspan>
      </text>
    </svg>
  )
}
