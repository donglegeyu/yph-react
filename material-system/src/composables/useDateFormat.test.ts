import { describe, it, expect, beforeEach } from 'vitest'
import { useDateFormat } from './useDateFormat'

describe('useDateFormat', () => {
  describe('初始化', () => {
    it('应该返回一个对象', () => {
      const result = useDateFormat()
      expect(result).toBeDefined()
      expect(typeof result).toBe('object')
    })

    it('应该包含必要的方法', () => {
      const {
        formatDateTime,
        formatDate,
        formatTime,
        formatDateRange,
        parseDate,
        getRelativeTime,
        isToday,
        isValidDate,
      } = useDateFormat()

      expect(typeof formatDateTime).toBe('function')
      expect(typeof formatDate).toBe('function')
      expect(typeof formatTime).toBe('function')
      expect(typeof formatDateRange).toBe('function')
      expect(typeof parseDate).toBe('function')
      expect(typeof getRelativeTime).toBe('function')
      expect(typeof isToday).toBe('function')
      expect(typeof isValidDate).toBe('function')
    })
  })

  describe('formatDateTime', () => {
    it('应该格式化日期时间为标准格式', () => {
      const { formatDateTime } = useDateFormat()

      expect(formatDateTime('2026-04-23T10:30:00')).toBe('2026-04-23 10:30:00')
      expect(formatDateTime('2026-12-25 08:00:00')).toBe('2026-12-25 08:00:00')
    })

    it('应该处理 Date 对象', () => {
      const { formatDateTime } = useDateFormat()
      const date = new Date('2026-04-23T10:30:00')

      expect(formatDateTime(date)).toBe('2026-04-23 10:30:00')
    })

    it('对于空值应该返回空字符串', () => {
      const { formatDateTime } = useDateFormat()

      expect(formatDateTime('')).toBe('')
      expect(formatDateTime(null)).toBe('')
      expect(formatDateTime(undefined)).toBe('')
    })

    it('对于无效日期应该返回空字符串', () => {
      const { formatDateTime } = useDateFormat()

      expect(formatDateTime('invalid')).toBe('')
      expect(formatDateTime('not-a-date')).toBe('')
    })
  })

  describe('formatDate', () => {
    it('应该格式化日期为标准格式', () => {
      const { formatDate } = useDateFormat()

      expect(formatDate('2026-04-23')).toBe('2026-04-23')
      expect(formatDate('2026-12-25')).toBe('2026-12-25')
    })

    it('应该支持自定义分隔符', () => {
      const { formatDate } = useDateFormat()

      expect(formatDate('2026-04-23', '/')).toBe('2026/04/23')
      expect(formatDate('2026-04-23', '.')).toBe('2026.04.23')
    })

    it('对于空值应该返回空字符串', () => {
      const { formatDate } = useDateFormat()

      expect(formatDate('')).toBe('')
      expect(formatDate(null)).toBe('')
      expect(formatDate(undefined)).toBe('')
    })
  })

  describe('formatTime', () => {
    it('应该格式化时间为标准格式', () => {
      const { formatTime } = useDateFormat()

      expect(formatTime('2026-04-23T10:30:00')).toBe('10:30:00')
      expect(formatTime('2026-04-23T08:00:05')).toBe('08:00:05')
    })

    it('对于空值应该返回空字符串', () => {
      const { formatTime } = useDateFormat()

      expect(formatTime('')).toBe('')
      expect(formatTime(null)).toBe('')
      expect(formatTime(undefined)).toBe('')
    })
  })

  describe('formatDateRange', () => {
    it('应该格式化日期范围', () => {
      const { formatDateRange } = useDateFormat()

      expect(formatDateRange('2026-04-01', '2026-04-23')).toBe('2026-04-01 ~ 2026-04-23')
    })

    it('应该支持自定义分隔符', () => {
      const { formatDateRange } = useDateFormat()

      expect(formatDateRange('2026-04-01', '2026-04-23', '/')).toBe('2026/04/01 ~ 2026/04/23')
    })

    it('对于空值应该返回空字符串', () => {
      const { formatDateRange } = useDateFormat()

      expect(formatDateRange('', '')).toBe('')
      expect(formatDateRange(null, null)).toBe('')
    })

    it('对于单边空值应该返回另一边', () => {
      const { formatDateRange } = useDateFormat()

      expect(formatDateRange('2026-04-01', '')).toBe('2026-04-01')
      expect(formatDateRange('', '2026-04-23')).toBe('2026-04-23')
    })
  })

  describe('parseDate', () => {
    it('应该解析日期字符串', () => {
      const { parseDate } = useDateFormat()
      const result = parseDate('2026-04-23')

      expect(result).toBeInstanceOf(Date)
      expect(result?.getFullYear()).toBe(2026)
      expect(result?.getMonth()).toBe(3) // 月份从0开始
      expect(result?.getDate()).toBe(23)
    })

    it('对于空值应该返回 null', () => {
      const { parseDate } = useDateFormat()

      expect(parseDate('')).toBe(null)
      expect(parseDate(null)).toBe(null)
      expect(parseDate(undefined)).toBe(null)
    })

    it('对于无效日期应该返回 null', () => {
      const { parseDate } = useDateFormat()

      expect(parseDate('invalid')).toBe(null)
      expect(parseDate('not-a-date')).toBe(null)
    })
  })

  describe('isValidDate', () => {
    it('应该正确验证有效日期', () => {
      const { isValidDate } = useDateFormat()

      expect(isValidDate('2026-04-23')).toBe(true)
      expect(isValidDate('2026-12-25')).toBe(true)
    })

    it('应该正确验证无效日期', () => {
      const { isValidDate } = useDateFormat()

      expect(isValidDate('')).toBe(false)
      expect(isValidDate('invalid')).toBe(false)
      expect(isValidDate('not-a-date')).toBe(false)
    })
  })

  describe('padZero', () => {
    it('应该补零', () => {
      const { padZero } = useDateFormat()

      expect(padZero(1)).toBe('01')
      expect(padZero(9)).toBe('09')
      expect(padZero(10)).toBe('10')
      expect(padZero(12)).toBe('12')
    })
  })

  describe('默认格式设置', () => {
    it('应该支持设置默认分隔符', () => {
      const { formatDate, setDefaultSeparator } = useDateFormat()

      setDefaultSeparator('/')
      expect(formatDate('2026-04-23')).toBe('2026/04/23')
    })
  })

  describe('边界情况', () => {
    it('应该处理极端日期', () => {
      const { formatDateTime } = useDateFormat()

      expect(formatDateTime('2000-01-01T00:00:00')).toBe('2000-01-01 00:00:00')
      expect(formatDateTime('2099-12-31T23:59:59')).toBe('2099-12-31 23:59:59')
    })

    it('应该处理单数字月份和日期', () => {
      const { formatDateTime } = useDateFormat()

      expect(formatDateTime('2026-01-05T03:07:09')).toBe('2026-01-05 03:07:09')
    })
  })
})
