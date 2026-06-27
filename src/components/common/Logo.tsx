interface Props {
  size?: number
  className?: string
}

/** Mark "Kang Paket" — kotak paket 3D. Warna mengikuti currentColor (set via style/color). */
export function Logo({ size = 18, className }: Props): JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinejoin="round"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M16 8 L24.4 12.1 V19.9 L16 24 L7.6 19.9 V12.1 Z" />
      <path d="M7.6 12.1 L16 16.25 L24.4 12.1" />
      <path d="M16 16.25 V24" />
    </svg>
  )
}
