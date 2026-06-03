import { useState, useMemo } from 'react'
import { Select } from 'antd'
import './AccessibilityChecker.scss'

interface Props {
  tokenName: string
  color: string
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null
}

function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1)
  const rgb2 = hexToRgb(color2)
  if (!rgb1 || !rgb2) return 0
  const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b)
  const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

function getWcagLevel(ratio: number): string {
  if (ratio >= 7) return 'AAA'
  if (ratio >= 4.5) return 'AA'
  if (ratio >= 3) return 'AA (large & UI components)'
  return 'Fail'
}

function sRGBtoY(sRGB: number): number {
  if (sRGB <= 0.04045) return sRGB / 12.92
  return Math.pow((sRGB + 0.055) / 1.055, 2.4)
}

function getLuminanceApca(r: number, g: number, b: number): number {
  const rY = sRGBtoY(r / 255) * 0.2126729
  const gY = sRGBtoY(g / 255) * 0.7151522
  const bY = sRGBtoY(b / 255) * 0.0721750
  return rY + gY + bY
}

function getApcaContrast(txtColor: string, bgColor: string): number {
  const txtRgb = hexToRgb(txtColor)
  const bgRgb = hexToRgb(bgColor)
  if (!txtRgb || !bgRgb) return 0
  const txtY = getLuminanceApca(txtRgb.r, txtRgb.g, txtRgb.b)
  const bgY = getLuminanceApca(bgRgb.r, bgRgb.g, bgRgb.b)
  const normBG = Math.pow(bgY, 0.56)
  const normTXT = Math.pow(txtY, 0.57)
  if (bgY > txtY) return (normBG - normTXT) * 1.14 * 100
  else return (normTXT - normBG) * 1.14 * 100 * -1
}

function getApcaLevel(value: number): string {
  const absValue = Math.abs(value)
  if (absValue >= 90) return 'Ok for text'
  if (absValue >= 75) return 'Ok for large text'
  if (absValue >= 60) return 'Ok for UI components'
  return 'Not recommended'
}

function getResultStyle(level: string): React.CSSProperties {
  if (level === 'Fail' || level === 'Not recommended') {
    return { backgroundColor: 'var(--ant-color-error-bg, #FFF2F0)' }
  }
  return { backgroundColor: 'var(--ant-color-success-bg, #F6FFED)' }
}

export default function AccessibilityChecker({ tokenName, color }: Props) {
  const [compareColor, setCompareColor] = useState('white')

  const colorMap: Record<string, string> = {
    white: '#ffffff',
    black: '#000000',
  }

  const results = useMemo(() => {
    if (!color) return null
    const bgColor = colorMap[compareColor] || '#ffffff'
    const textOnWhite = getApcaContrast(color, bgColor)
    const bgOnWhite = getApcaContrast(bgColor, color)
    const wcagRatio = getContrastRatio(color, bgColor)
    return {
      textOnWhite: { value: textOnWhite, level: getApcaLevel(textOnWhite) },
      bgOnWhite: { value: bgOnWhite, level: getApcaLevel(bgOnWhite) },
      wcag: { value: wcagRatio, level: getWcagLevel(wcagRatio) },
    }
  }, [color, compareColor])

  return (
    <div className="accessibility-checker">
      <div className="checker-row">
        <div className="checker-label">
          <span>{tokenName}</span>
          <span className="vs-text">vs.</span>
          <Select
            value={compareColor}
            onChange={setCompareColor}
            style={{ width: 160 }}
            options={[
              { label: '--color-white', value: 'white' },
              { label: '--color-black', value: 'black' },
            ]}
          />
        </div>
      </div>

      {results && (
        <div className="checker-results">
          <div className="checker-item">
            <div className="checker-box" style={{ backgroundColor: '#ffffff', color: color }}>
              APCA
            </div>
            <div className="checker-result" style={getResultStyle(results.textOnWhite.level)}>
              <span className="value">{results.textOnWhite.value.toFixed(0)}</span>
              <span className="separator">-</span>
              <span className="level">{results.textOnWhite.level}</span>
            </div>
          </div>

          <div className="checker-item">
            <div className="checker-box" style={{ backgroundColor: color, color: '#ffffff' }}>
              APCA
            </div>
            <div className="checker-result" style={getResultStyle(results.bgOnWhite.level)}>
              <span className="value">{results.bgOnWhite.value.toFixed(0)}</span>
              <span className="separator">-</span>
              <span className="level">{results.bgOnWhite.level}</span>
            </div>
          </div>

          <div className="checker-item">
            <div className="checker-box" style={{ backgroundColor: '#ffffff', color: color }}>
              WCAG
            </div>
            <div className="checker-result" style={getResultStyle(results.wcag.level)}>
              <span className="value">{results.wcag.value.toFixed(2)}:1</span>
              <span className="separator">-</span>
              <span className="level">{results.wcag.level}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
