import { ref } from 'vue'

export interface UseDateFormatOptions {
  defaultFormat?: string
  defaultSeparator?: string
}

export function useDateFormat(options: UseDateFormatOptions = {}) {
  const defaultFormat = ref(options.defaultFormat || 'YYYY-MM-DD HH:mm:ss')
  const defaultSeparator = ref(options.defaultSeparator || '-')

  function setDefaultFormat(format: string) {
    defaultFormat.value = format
  }

  function setDefaultSeparator(separator: string) {
    defaultSeparator.value = separator
  }

  function padZero(num: number): string {
    return num < 10 ? `0${num}` : `${num}`
  }

  function formatDateTime(dateTime: string | Date | undefined | null): string {
    if (!dateTime) return ''
    
    const date = dateTime instanceof Date ? dateTime : new Date(dateTime)
    if (isNaN(date.getTime())) return ''
    
    const year = date.getFullYear()
    const month = padZero(date.getMonth() + 1)
    const day = padZero(date.getDate())
    const hours = padZero(date.getHours())
    const minutes = padZero(date.getMinutes())
    const seconds = padZero(date.getSeconds())
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  }

  function formatDate(date: string | Date | undefined | null, separator?: string): string {
    if (!date) return ''
    
    const dateObj = date instanceof Date ? date : new Date(date)
    if (isNaN(dateObj.getTime())) return ''
    
    const sep = separator || defaultSeparator.value
    const year = dateObj.getFullYear()
    const month = padZero(dateObj.getMonth() + 1)
    const day = padZero(dateObj.getDate())
    
    return `${year}${sep}${month}${sep}${day}`
  }

  function formatTime(dateTime: string | Date | undefined | null): string {
    if (!dateTime) return ''
    
    const date = dateTime instanceof Date ? dateTime : new Date(dateTime)
    if (isNaN(date.getTime())) return ''
    
    const hours = padZero(date.getHours())
    const minutes = padZero(date.getMinutes())
    const seconds = padZero(date.getSeconds())
    
    return `${hours}:${minutes}:${seconds}`
  }

  function formatDateRange(startDate: any, endDate: any, separator?: string): string {
    if (!startDate && !endDate) return ''
    if (!startDate) return formatDate(endDate, separator)
    if (!endDate) return formatDate(startDate, separator)
    
    return `${formatDate(startDate, separator)} ~ ${formatDate(endDate, separator)}`
  }

  function parseDate(dateString: string): Date | null {
    if (!dateString) return null
    
    const date = new Date(dateString)
    return isNaN(date.getTime()) ? null : date
  }

  function getRelativeTime(dateTime: string | Date): string {
    if (!dateTime) return ''
    
    const date = dateTime instanceof Date ? dateTime : new Date(dateTime)
    if (isNaN(date.getTime())) return ''
    
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    if (seconds < 60) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`
    
    return formatDate(date)
  }

  function isToday(dateTime: string | Date): boolean {
    if (!dateTime) return false
    
    const date = dateTime instanceof Date ? dateTime : new Date(dateTime)
    if (isNaN(date.getTime())) return false
    
    const today = new Date()
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    )
  }

  function isValidDate(dateString: string): boolean {
    if (!dateString) return false
    const date = new Date(dateString)
    return !isNaN(date.getTime())
  }

  return {
    defaultFormat,
    defaultSeparator,
    setDefaultFormat,
    setDefaultSeparator,
    padZero,
    formatDateTime,
    formatDate,
    formatTime,
    formatDateRange,
    parseDate,
    getRelativeTime,
    isToday,
    isValidDate,
  }
}
