import { useMemo } from 'react'

interface ColorScaleProps {
  baseColor: string
  steps?: number
  size?: number
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return null
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  }
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => {
    const hex = Math.round(x).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')
}

export default function ColorScale({ baseColor, steps = 10, size = 24 }: ColorScaleProps) {
  const colors = useMemo(() => {
    const rgb = hexToRgb(baseColor)
    if (!rgb) return []
    const result: string[] = []
    for (let i = 0; i < steps; i++) {
      const factor = 1 - (i / (steps - 1)) * 0.8
      result.push(rgbToHex(
        rgb.r * factor,
        rgb.g * factor,
        rgb.b * factor
      ))
    }
    return result
  }, [baseColor, steps])

  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {colors.map((color, index) => (
        <div
          key={index}
          style={{
            width: size,
            height: size,
            backgroundColor: color,
            borderRadius: 4,
            border: '1px solid rgba(0,0,0,0.06)',
          }}
          title={color}
        />
      ))}
    </div>
  )
}
