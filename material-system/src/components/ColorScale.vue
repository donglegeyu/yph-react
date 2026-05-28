<template>
  <div class="color-scale">
    <div class="scale-label" v-if="!hideHeader">{{ label }}</div>
    <div class="scale-container">
      <a-popover
        v-model:open="showPicker"
        trigger="click"
        placement="bottomLeft"
        :overlay-style="{ padding: '8px', width: '260px' }"
        :get-popup-container="(triggerNode: HTMLElement) => triggerNode.parentElement"
        @open-change="handlePopoverVisibleChange"
        :overlay-class-name="'color-picker-popover'"
      >
        <template #content>
          <div class="color-picker-body">
            <div class="color-picker-left">
              <div 
                id="color-sb-area"
                class="color-sb-area"
                :style="{ backgroundColor: hueColor }"
                ref="sbAreaRef"
                @mousedown="startSBDrag"
                @mousemove="handleSBMove"
                @mouseup="handleSBUp"
              >
                <div class="color-sb-white"></div>
                <div class="color-sb-black"></div>
                <div class="color-sb-cursor" :style="'left:' + (sbCursorX * 100) + '%;top:' + (sbCursorY * 100) + '%;background:' + pendingColor" :data-x="sbCursorX" :data-y="sbCursorY"></div>
              </div>
              <div class="color-hue-bar" ref="hueBarRef" @click="handleHueClick">
                <div class="color-hue-cursor" :style="{ left: hueCursorLeft * 100 + '%' }"></div>
              </div>
            </div>
          </div>
          <div class="color-picker-inputs">
            <div class="color-preview" :style="{ backgroundColor: pendingColor }"></div>
            <a-input :value="colorInputValue" placeholder="#FFFFFF" @change="handleInputChange" style="flex: 1" />
            <a-select v-model:value="colorFormat" style="width: 72px; margin-left: 0">
              <a-select-option value="hex">HEX</a-select-option>
              <a-select-option value="rgb">RGB</a-select-option>
              <a-select-option value="hsl">HSL</a-select-option>
            </a-select>
          </div>
          <div class="color-picker-actions">
            <a-button @click="cancelPicker">取消</a-button>
            <a-button type="primary" @click="confirmPicker">确定</a-button>
          </div>
        </template>
        <div
          v-show="!hideBase"
          class="scale-base-wrapper"
        >
          <a-tooltip :title="internalBaseColor">
            <div
              class="scale-base-inner"
              :style="{ backgroundColor: pendingColor || internalBaseColor }"
              @click="openPicker"
              @mouseover="setHovered(true)"
              @mouseout="setHovered(false)"
            />
          </a-tooltip>
        </div>
      </a-popover>
      <div
        class="scale-strip"
        @mouseover="setHovered(true)"
        @mouseout="setHovered(false)"
      >
        <a-tooltip
          v-for="(color, index) in displayColors"
          :key="index"
          :title="color"
        >
          <div
            class="scale-item"
            :class="{
              'active': isActive(index),
              'scale-first': index === 0,
              'scale-last': index === displayColors.length - 1
            }"
            :style="getScaleItemStyle(color, index)"
            @click="handleItemClick(index)"
          >
            <span class="scale-number" :style="{ opacity: shouldShowNumber ? 1 : 0 }">{{ index }}</span>
          </div>
        </a-tooltip>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Props {
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
}

const props = withDefaults(defineProps<Props>(), {
  label: '品牌色',
  baseColor: '#F95914',
  colors: () => [],
  customColors: () => [],
  highlightIndex: 5,
  tokenPrefix: 'primary',
  selectedIndex: null,
  selectedGroupKey: '',
  hideHeader: false,
  hideBase: false
})

const colorInput = ref<HTMLInputElement | null>(null)
const internalBaseColor = ref(props.baseColor || '#F95914')
const isCustomized = ref(false)
const showPicker = ref(false)
const pendingColor = ref('')
const hueBarRef = ref<HTMLElement | null>(null)
const sbAreaRef = ref<HTMLElement | null>(null)
const hueCursorLeft = ref(0)
const sbCursorX = ref(0)
const sbCursorY = ref(0)
const isDraggingSB = ref(false)
const hexInput = ref('')
const colorFormat = ref('hex')

const hueColor = computed(() => {
  const hue = hueCursorLeft.value * 360
  return `hsl(${hue}, 100%, 50%)`
})

const colorInputValue = computed(() => {
  const hex = pendingColor.value
  if (!hex) return ''
  
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  
  if (colorFormat.value === 'rgb') {
    return `rgb(${r}, ${g}, ${b})`
  }
  
  if (colorFormat.value === 'hsl') {
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
})

watch(colorFormat, () => {
  hexInput.value = colorInputValue.value
})

function hexToHsb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = max === 0 ? 0 : (max - min) / max
  let brightness = max
  if (max !== min) {
    const d = max - min
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return { h: h * 360, s, b: brightness }
}

function hsbToHex(h: number, s: number, b: number): string {
  const i = Math.floor(h / 60) % 6
  const f = h / 60 - Math.floor(h / 60)
  const p = b * (1 - s)
  const q = b * (1 - f * s)
  const t = b * (1 - (1 - f) * s)
  let r = 0, g = 0, bl = 0
  switch (i) {
    case 0: r = b; g = t; bl = p; break
    case 1: r = q; g = b; bl = p; break
    case 2: r = p; g = b; bl = t; break
    case 3: r = p; g = q; bl = b; break
    case 4: r = t; g = p; bl = b; break
    case 5: r = b; g = p; bl = q; break
  }
  const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(bl)}`.toUpperCase()
}

function updateColorFromHSB() {
  pendingColor.value = hsbToHex(hueCursorLeft.value * 360, sbCursorX.value, 1 - sbCursorY.value)
  hexInput.value = pendingColor.value
}

watch(() => props.baseColor, (newVal) => {
  if (newVal && !isCustomized.value) {
    internalBaseColor.value = newVal
  }
})

watch(isCustomized, (customized) => {
  if (!customized && props.baseColor) {
    internalBaseColor.value = props.baseColor
  }
})

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

  const hsv = rgbToHsv(r, g, b)

  function getHue(h: number, i: number, light: boolean): number {
    let hue: number
    if (h >= 60 && h <= 240) {
      hue = light ? h - hueStep * i : h + hueStep * i
    } else {
      hue = light ? h + hueStep * i : h - hueStep * i
    }
    if (hue < 0) hue += 360
    else if (hue >= 360) hue -= 360
    return hue
  }

  function getSaturation(s: number, i: number, light: boolean, isDark: boolean): number {
    if (h === 0 && s === 0) return s
    let saturation: number
    if (light) {
      saturation = s - saturationStep * i
    } else if (i === darkColorCount) {
      saturation = s + saturationStep
    } else {
      saturation = s + saturationStep2 * i
    }
    if (saturation > 1) saturation = 1
    if (light && i === lightColorCount && saturation > 0.1) saturation = 0.1
    if (saturation < 0.06) saturation = 0.06
    return Math.round(saturation * 100) / 100
  }

  function getValue(v: number, i: number, light: boolean): number {
    let value: number
    if (light) {
      value = v + brightnessStep1 * i
    } else {
      value = v - brightnessStep2 * i
    }
    value = Math.max(0, Math.min(1, value))
    return Math.round(value * 100) / 100
  }

  const { h, s, v } = hsv
  const patterns: string[] = []

  for (let i = lightColorCount; i > 0; i--) {
    const newH = getHue(h, i, true)
    const newS = getSaturation(s, i, true, false)
    const newV = getValue(v, i, true)
    patterns.push(hsvToHex(newH, newS, newV))
  }

  patterns.push(baseColor.toUpperCase())

  for (let i = 1; i <= darkColorCount; i++) {
    const newH = getHue(h, i, false)
    const newS = getSaturation(s, i, false, i === darkColorCount)
    const newV = getValue(v, i, false)
    patterns.push(hsvToHex(newH, newS, newV))
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

function hsvToHex(h: number, s: number, v: number): string {
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

const generatedColors = computed(() => {
  const baseColor = pendingColor.value || internalBaseColor.value
  return generateColorScale(baseColor)
})

const displayColors = computed(() => {
  const generated = props.colors && props.colors.length > 0 ? props.colors : generatedColors.value
  if (props.customColors && props.customColors.length > 0) {
    return generated.map((color, index) => props.customColors[index] || color)
  }
  return generated
})

function isActive(index: number): boolean {
  if (props.selectedIndex !== null) {
    return props.selectedIndex === index && props.selectedGroupKey === props.tokenPrefix
  }
  return index === props.highlightIndex
}

const isHovered = ref(false)

function setHovered(value: boolean) {
  isHovered.value = value
}

const shouldShowNumber = computed(() => {
  return isHovered.value || props.selectedGroupKey === props.tokenPrefix
})

const emit = defineEmits<{
  select: [{ index: number; color: string; tokenName: string; groupKey: string }]
}>()

function handleItemClick(index: number) {
  emit('select', {
    index,
    color: displayColors.value[index],
    tokenName: `${props.tokenPrefix}-${index}`,
    groupKey: props.tokenPrefix || ''
  })
}

function openPicker() {
  console.log('internalBaseColor:', internalBaseColor.value)
  pendingColor.value = internalBaseColor.value || '#F95914'
  console.log('pendingColor:', pendingColor.value)
  hexInput.value = pendingColor.value
  const hsb = hexToHsb(pendingColor.value)
  hueCursorLeft.value = hsb.h / 360
  sbCursorX.value = hsb.s
  sbCursorY.value = 1 - hsb.b
  showPicker.value = true
}

function handleHueClick(event: MouseEvent) {
  const rect = hueBarRef.value?.getBoundingClientRect()
  if (!rect) return
  hueCursorLeft.value = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width))
  updateColorFromHSB()
}

function startSBDrag(event: MouseEvent) {
  isDraggingSB.value = true
  updateCursorPosition(event)
  document.addEventListener('mousemove', handleSBMove)
  document.addEventListener('mouseup', handleSBUp)
}

function handleSBMove(event: MouseEvent) {
  if (!isDraggingSB.value) return
  updateCursorPosition(event)
}

function handleSBUp() {
  isDraggingSB.value = false
  document.removeEventListener('mousemove', handleSBMove)
  document.removeEventListener('mouseup', handleSBUp)
}

function updateCursorPosition(event: MouseEvent) {
  const el = sbAreaRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  sbCursorX.value = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width))
  sbCursorY.value = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height))
  updateColorFromHSB()
}

function handleInputChange(value: string) {
  if (colorFormat.value === 'hex' && /^#[0-9A-Fa-f]{6}$/.test(value)) {
    pendingColor.value = value.toUpperCase()
    const hsb = hexToHsb(pendingColor.value)
    hueCursorLeft.value = hsb.h / 360
    sbCursorX.value = hsb.s
    sbCursorY.value = 1 - hsb.b
  }
}

function cancelPicker() {
  showPicker.value = false
  pendingColor.value = ''
}

function handlePopoverVisibleChange(open: boolean) {
  if (!open) {
    pendingColor.value = ''
  }
}

function confirmPicker() {
  if (pendingColor.value) {
    internalBaseColor.value = pendingColor.value
    isCustomized.value = true
    if (!props.selectedGroupKey || props.selectedGroupKey !== props.tokenPrefix) {
      emit('select', {
        index: 5,
        color: pendingColor.value,
        tokenName: `${props.tokenPrefix}-5`,
        groupKey: props.tokenPrefix || ''
      })
    }
  }
  showPicker.value = false
  pendingColor.value = ''
}

function getScaleItemStyle(color: string, index: number) {
  const isDark = index >= 6

  return {
    backgroundColor: color,
    color: isDark ? '#ffffff' : '#1c1f23'
  }
}
</script>

<style scoped lang="scss">
.color-scale {
  margin-bottom: 0;
}

:deep(.ant-modal-close-x) {
  display: none !important;
}

.color-picker-body {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  width: 100%;
}

.color-picker-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.color-sb-area {
  position: relative;
  width: 100%;
  height: 160px;
  border-radius: 4px;
  cursor: crosshair;
  overflow: hidden;
}

.color-sb-white {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to right, #fff, transparent);
}

.color-sb-black {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to top, #000, transparent);
}

.color-sb-cursor {
  position: absolute;
  width: 12px;
  height: 12px;
  border: 2px solid #fff;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  pointer-events: none;
}

:deep(.color-sb-cursor) {
  position: absolute !important;
  width: 12px;
  height: 12px;
  border: 2px solid #fff;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  pointer-events: none;
}

.color-picker-inputs {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  gap: 8px;
}

.color-preview {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  border: 1px solid var(--color-border, #d9d9d9);
  flex-shrink: 0;
}

.color-hue-bar {
  position: relative;
  width: 100%;
  height: 16px;
  border-radius: 8px;
  background: linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000);
  cursor: pointer;
  margin-bottom: 8px;
}

.color-hue-cursor {
  position: absolute;
  top: -2px;
  width: 8px;
  height: 20px;
  background: #fff;
  border: 1px solid #333;
  border-radius: 4px;
  transform: translateX(-50%);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.color-picker-inputs {
  display: flex;
  margin-bottom: 12px;
}

.color-picker-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.scale-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text, rgba(0, 0, 0, 0.88));
  margin-bottom: 4px;
  margin-left: 64px;
}

.scale-container {
  display: flex;
  align-items: center;
}

.scale-base-wrapper {
  position: relative;
  width: 48px;
  height: 48px;
  margin-right: 16px;
  flex-shrink: 0;
}

.scale-base-inner {
  width: 100%;
  height: 100%;
  border-radius: 6px;
  cursor: pointer;
}

.scale-strip {
  display: flex;
  align-items: center;
  height: 64px;
}

:deep(.ant-tooltip) {
  .ant-tooltip-inner {
    padding: 4px 8px;
    border-radius: 4px;
  }
}

.scale-item {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  user-select: none;
  transition: transform 0.1s ease;
  position: relative;
  cursor: pointer;
  transform: scale(1);
  z-index: 0;
  outline: none;
}

@keyframes scaleUpStep1 {
  0% {
    transform: scale(1);
  }
  100% {
    transform: scale(1.1);
  }
}

@keyframes scaleUpStep2 {
  0% {
    border-radius: 0;
  }
  100% {
    border-radius: 12px;
  }
}

@keyframes scaleUpStep3 {
  0% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1.3);
  }
}

.scale-item.active {
  animation: 
    scaleUpStep1 0.05s cubic-bezier(0.34, 1.56, 0.64, 1) forwards,
    scaleUpStep2 0.05s ease-out 0.05s forwards,
    scaleUpStep3 0.1s cubic-bezier(0.22, 1, 0.36, 1) 0.1s forwards;
  z-index: 1 !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

.scale-first {
  border-radius: 6px 0 0 6px;
}

.scale-last {
  border-radius: 0 6px 6px 0;
}

.scale-number {
  opacity: 0;
  transition: opacity 0.15s ease;
}
</style>
