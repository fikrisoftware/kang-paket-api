interface Props {
  size?: number
  className?: string
}

/** Mark "Kang Paket" — kotak paket terbuka + panah. Warna brand oranye (tetap, lepas dari tema). */
export function Logo({ size = 20, className }: Props): JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* flap belakang */}
      <path d="M150 232 L256 174 L238 146 L132 204 Z" fill="#FFA34D" />
      <path d="M362 232 L256 174 L274 146 L380 204 Z" fill="#FF9536" />
      {/* mulut kotak */}
      <path d="M150 232 L256 174 L362 232 L256 290 Z" fill="#6E3208" />
      {/* dua sisi depan */}
      <path d="M150 232 L256 290 L256 420 L150 362 Z" fill="#EE7016" />
      <path d="M256 290 L362 232 L362 362 L256 420 Z" fill="#CE5A0A" />
      {/* panah */}
      <g stroke="#FF8A2A" strokeWidth={26} strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M250 268 L386 150" />
        <path d="M330 150 L392 138 L380 198" />
      </g>
    </svg>
  )
}
