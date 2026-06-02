interface SvgIconProps {
  href: string
  className?: string
  style?: React.CSSProperties
  size?: number | string
  onClick?: (e: React.MouseEvent) => void
}

export default function SvgIcon({ href, className, style, size = 16, onClick }: SvgIconProps) {
  return (
    <svg
      className={className}
      style={{ width: size, height: size, ...style }}
      viewBox="0 0 48 48"
      onClick={onClick}
    >
      <use href={`#${href}`} />
    </svg>
  )
}
