import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Popover, Input, Select, Button } from 'antd'
import { CompanyTooltip } from '@donglegeyu/company-ui'
import './ColorScale.scss'

interface ColorScaleProps {
  label?: string
  baseColor?: string
  colors?: string[]
  customColors?: (string | undefined)[]
  highlightIndex?: number
  tokenPrefix?: string
  selectedIndex?: number | null
  selectedGroupKey?: string
  hideHeader?: boolean
  hideBase?: boolean
  onSelect?: (payload: { index: number; color: string; tokenName: string; groupKey: string }) => void
}

const DEFAULT_BASE_COLOR = '#F95914'

function hexToHsb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  const s = max === 0 ? 0 : (max - min) / max
  const v = max
  if (max !== min) {
    const d = max - min
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break
      case g: h = ((b - r) / d + 2) * 60; break
      case b: h = ((r - g) / d + 4) * 60; break
    }
  }
  return { h, s, v }
}

function hsbToHex(h: number, s: number, v: number): string {
  const i = Math.floor(h / 60) % 6
  const f = h / 60 - Math.floor(h / 60)
  const p = v * (1 - s)
  const q = v * (1 - f * s)
  const t = v * (1 - (1 - f) * s)
  let r = 0, g = 0, b = 0
  switch (i) {
    case 0: r = v; g = t; b = p; break
    case 1: r = q; g = v; b = p; break
    case 2: r = p; g = v; b = t; break
    case 3: r = p; g = q; b = v; break
    case 4: r = t; g = p; b = v; break
    case 5: r = v; g = p; b = q; break
  }
  const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase()
}

function generateColorScale(baseColor: string): string[] {
  const hueStep = 2
  const saturationStep = 0.16
  const saturationStep2 = 0.05
  const brightnessStep1 = 0.05
  const brightnessStep2 = 0.15
  const lightColorCount = 5
  const darkColorCount = 4

  const hex = baseColor.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16) / 255
  const g = parseInt(hex.substring(2, 4), 16) / 255
  const b = parseInt(hex.substring(4, 6), 16) / 255

  const { h, s, v } = rgbToHsv(r, g, b)

  function getHue(hue: number, i: number, light: boolean): number {
    let result: number
    if (hue >= 60 && hue <= 240) {
      result = light ? hue - hueStep * i : hue + hueStep * i
    } else {
      result = light ? hue + hueStep * i : hue - hueStep * i
    }
    if (result < 0) result += 360
    else if (result >= 360) result -= 360
    return result
  }

  function getSaturation(sat: number, i: number, light: boolean, _isDark: boolean): number {
    if (h === 0 && s === 0) return sat
    let saturation: number
    if (light) {
      saturation = sat - saturationStep * i
    } else if (i === darkColorCount) {
      saturation = sat + saturationStep
    } else {
      saturation = sat + saturationStep2 * i
    }
    if (saturation > 1) saturation = 1
    if (light && i === lightColorCount && saturation > 0.1) saturation = 0.1
    if (saturation < 0.06) saturation = 0.06
    return Math.round(saturation * 100) / 100
  }

  function getValue(val: number, i: number, light: boolean): number {
    let value: number
    if (light) {
      value = val + brightnessStep1 * i
    } else {
      value = val - brightnessStep2 * i
    }
    value = Math.max(0, Math.min(1, value))
    return Math.round(value * 100) / 100
  }

  const patterns: string[] = []

  for (let i = lightColorCount; i > 0; i--) {
    const newH = getHue(h, i, true)
    const newS = getSaturation(s, i, true, false)
    const newV = getValue(v, i, true)
    patterns.push(hsbToHex(newH, newS, newV))
  }

  patterns.push(baseColor.toUpperCase())

  for (let i = 1; i <= darkColorCount; i++) {
    const newH = getHue(h, i, false)
    const newS = getSaturation(s, i, false, i === darkColorCount)
    const newV = getValue(v, i, false)
    patterns.push(hsbToHex(newH, newS, newV))
  }

  return patterns
}

function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  const s = max === 0 ? 0 : d / max
  const v = max
  if (max !== min) {
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break
      case g: h = ((b - r) / d + 2) * 60; break
      case b: h = ((r - g) / d + 4) * 60; break
    }
  }
  return { h, s, v }
}

export default function ColorScale({
  label = '品牌色',
  baseColor = DEFAULT_BASE_COLOR,
  colors,
  customColors,
  highlightIndex = 5,
  tokenPrefix = 'primary',
  selectedIndex,
  selectedGroupKey,
  hideHeader = false,
  hideBase = false,
  onSelect,
}: ColorScaleProps) {
  const [showPicker, setShowPicker] = useState(false)
  const [pendingColor, setPendingColor] = useState('')
  const [internalBaseColor, setInternalBaseColor] = useState(baseColor || DEFAULT_BASE_COLOR)
  const [isCustomized, setIsCustomized] = useState(false)
  const [hueCursorLeft, setHueCursorLeft] = useState(0)
  const [sbCursorX, setSbCursorX] = useState(0)
  const [sbCursorY, setSbCursorY] = useState(0)
  const isDraggingRef = useRef(false)
  const [hexInput, setHexInput] = useState('')
  const [colorFormat, setColorFormat] = useState<'hex' | 'rgb' | 'hsl'>('hex')
  const [isHovered, setIsHovered] = useState(false)

  const hueBarRef = useRef<HTMLDivElement>(null)
  const sbAreaRef = useRef<HTMLDivElement>(null)

  const hueColor = useMemo(() => {
    const hue = hueCursorLeft * 360
    return `hsl(${hue}, 100%, 50%)`
  }, [hueCursorLeft])

  const generatedColors = useMemo(() => {
    const base = pendingColor || internalBaseColor
    return generateColorScale(base)
  }, [pendingColor, internalBaseColor])

  const displayColors = useMemo(() => {
    const generated = colors && colors.length > 0 ? colors : generatedColors
    if (customColors && customColors.length > 0) {
      return generated.map((color, index) => customColors[index] || color)
    }
    return generated
  }, [colors, generatedColors, customColors])

  const isActive = useCallback((index: number) => {
    if (selectedIndex !== null && selectedIndex !== undefined) {
      return selectedIndex === index && selectedGroupKey === tokenPrefix
    }
    return index === highlightIndex
  }, [selectedIndex, selectedGroupKey, highlightIndex, tokenPrefix])

  const shouldShowNumber = useMemo(() => {
    return isHovered || selectedGroupKey === tokenPrefix
  }, [isHovered, selectedGroupKey, tokenPrefix])

  const colorInputValue = useMemo(() => {
    const hex = pendingColor
    if (!hex) return ''

    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)

    if (colorFormat === 'rgb') {
      return `rgb(${r}, ${g}, ${b})`
    }

    if (colorFormat === 'hsl') {
      const max = Math.max(r, g, b) / 255
      const min = Math.min(r, g, b) / 255
      let h = 0, s = 0, l = (max + min) / 2
      if (max !== min) {
        const d = max - min
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
        switch (max) {
          case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
          case g: h = ((b - r) / d + 2) / 6; break
          case b: h = ((r - g) / d + 4) / 6; break
        }
      }
      return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`
    }

    return hex
  }, [pendingColor, colorFormat])

  useEffect(() => {
    if (baseColor && !isCustomized) {
      setInternalBaseColor(baseColor)
    }
  }, [baseColor, isCustomized])

  useEffect(() => {
    setHexInput(colorInputValue)
  }, [colorInputValue])

  const updateColorFromHSB = useCallback(() => {
    const newColor = hsbToHex(hueCursorLeft * 360, sbCursorX, 1 - sbCursorY)
    setPendingColor(newColor)
    setHexInput(newColor)
  }, [hueCursorLeft, sbCursorX, sbCursorY])

  const openPicker = useCallback(() => {
    const base = pendingColor || internalBaseColor || DEFAULT_BASE_COLOR
    setPendingColor(base)
    setHexInput(base)
    const hsb = hexToHsb(base)
    setHueCursorLeft(hsb.h / 360)
    setSbCursorX(hsb.s)
    setSbCursorY(1 - hsb.v)
    setShowPicker(true)
  }, [pendingColor, internalBaseColor])

  const handleHueClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = hueBarRef.current?.getBoundingClientRect()
    if (!rect) return
    setHueCursorLeft(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)))
  }, [])

  useEffect(() => {
    updateColorFromHSB()
  }, [hueCursorLeft, sbCursorX, sbCursorY, updateColorFromHSB])

  const startSBDrag = useCallback((e: React.MouseEvent) => {
    isDraggingRef.current = true
    updateCursorPosition(e)
    document.addEventListener('mousemove', handleSBMove as unknown as (e: MouseEvent) => void)
    document.addEventListener('mouseup', handleSBUp)
  }, [])

  const handleSBMove = useCallback((e: React.MouseEvent) => {
    if (!isDraggingRef.current) return
    updateCursorPosition(e)
  }, [])

  const handleSBUp = useCallback(() => {
    isDraggingRef.current = false
    document.removeEventListener('mousemove', handleSBMove as unknown as (e: MouseEvent) => void)
    document.removeEventListener('mouseup', handleSBUp)
  }, [handleSBMove])

  const updateCursorPosition = useCallback((e: React.MouseEvent) => {
    const el = sbAreaRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setSbCursorX(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)))
    setSbCursorY(Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)))
  }, [])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setHexInput(value)
    if (colorFormat === 'hex' && /^#[0-9A-Fa-f]{6}$/.test(value)) {
      setPendingColor(value.toUpperCase())
      const hsb = hexToHsb(value.toUpperCase())
      setHueCursorLeft(hsb.h / 360)
      setSbCursorX(hsb.s)
      setSbCursorY(1 - hsb.v)
    }
  }, [colorFormat])

  const cancelPicker = useCallback(() => {
    setShowPicker(false)
    setPendingColor('')
  }, [])

  const handlePopoverVisibleChange = useCallback((open: boolean) => {
    if (!open) {
      setPendingColor('')
    }
  }, [])

  const confirmPicker = useCallback(() => {
    if (pendingColor) {
      setInternalBaseColor(pendingColor)
      setIsCustomized(true)
      onSelect?.({
        index: 5,
        color: pendingColor,
        tokenName: `${tokenPrefix}-5`,
        groupKey: tokenPrefix || '',
      })
    }
    setShowPicker(false)
    setPendingColor('')
  }, [pendingColor, onSelect, tokenPrefix])

  const handleItemClick = useCallback((index: number) => {
    onSelect?.({
      index,
      color: displayColors[index],
      tokenName: `${tokenPrefix}-${index}`,
      groupKey: tokenPrefix || '',
    })
  }, [displayColors, onSelect, tokenPrefix])

  const getScaleItemStyle = useCallback((color: string, index: number): React.CSSProperties => {
    const isDark = index >= 6
    return {
      backgroundColor: color,
      color: isDark ? '#ffffff' : '#1c1f23',
    }
  }, [])

  const pickerContent = useMemo(() => (
    <>
      <div className="color-picker-body">
        <div className="color-picker-left">
          <div
            id="color-sb-area"
            className="color-sb-area"
            style={{ backgroundColor: hueColor }}
            ref={sbAreaRef}
            onMouseDown={startSBDrag}
            onMouseMove={handleSBMove}
            onMouseUp={handleSBUp}
          >
            <div className="color-sb-white" />
            <div className="color-sb-black" />
            <div
              className="color-sb-cursor"
              style={{
                left: `${sbCursorX * 100}%`,
                top: `${sbCursorY * 100}%`,
                background: pendingColor || internalBaseColor,
              }}
            />
          </div>
          <div
            className="color-hue-bar"
            ref={hueBarRef}
            onClick={handleHueClick}
          >
            <div className="color-hue-cursor" style={{ left: `${hueCursorLeft * 100}%` }} />
          </div>
        </div>
      </div>
      <div className="color-picker-inputs">
        <div className="color-preview" style={{ backgroundColor: pendingColor || internalBaseColor }} />
        <Input
          value={hexInput}
          placeholder="#FFFFFF"
          onChange={handleInputChange}
          style={{ flex: 1 }}
        />
        <Select
          value={colorFormat}
          onChange={(v) => setColorFormat(v)}
          style={{ width: 72 }}
          options={[
            { value: 'hex', label: 'HEX' },
            { value: 'rgb', label: 'RGB' },
            { value: 'hsl', label: 'HSL' },
          ]}
        />
      </div>
      <div className="color-picker-actions">
        <Button onClick={cancelPicker}>取消</Button>
        <Button type="primary" onClick={confirmPicker}>确定</Button>
      </div>
    </>
  ), [hueColor, sbCursorX, sbCursorY, pendingColor, internalBaseColor, hueCursorLeft, hexInput, colorFormat, handleHueClick, startSBDrag, handleSBMove, handleSBUp, handleInputChange, cancelPicker, confirmPicker])

  return (
    <div className="color-scale">
      {!hideHeader && <div className="scale-label">{label}</div>}
      <div className="scale-container">
        <Popover
          open={showPicker}
          trigger="click"
          placement="bottomLeft"
          overlayStyle={{ padding: 8, width: 260 }}
          content={pickerContent}
          onOpenChange={handlePopoverVisibleChange}
        >
          {!hideBase && (
            <div className="scale-base-wrapper">
              <CompanyTooltip title={internalBaseColor}>
                <div
                  className="scale-base-inner"
                  style={{ backgroundColor: pendingColor || internalBaseColor }}
                  onClick={openPicker}
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                />
              </CompanyTooltip>
            </div>
          )}
        </Popover>
        <div
          className="scale-strip"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {displayColors.map((color, index) => (
            <CompanyTooltip key={index} title={color}>
              <div
                className={`scale-item ${isActive(index) ? 'active' : ''} ${index === 0 ? 'scale-first' : ''} ${index === displayColors.length - 1 ? 'scale-last' : ''}`}
                style={getScaleItemStyle(color, index)}
                onClick={() => handleItemClick(index)}
              >
                <span className="scale-number" style={{ opacity: shouldShowNumber ? 1 : 0 }}>
                  {index}
                </span>
              </div>
            </CompanyTooltip>
          ))}
        </div>
      </div>
    </div>
  )
}
