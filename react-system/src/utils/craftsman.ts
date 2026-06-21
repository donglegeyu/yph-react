export type CertificateStatus = 'valid' | 'expiring' | 'expired' | ''

export interface CertificateMockInfo {
  certificateNo: string
  status: CertificateStatus
  effectiveDate: string
  expiryDate: string
}

export function mockCertificateInfo(certificateType: string, index: number): CertificateMockInfo {
  const hash = (certificateType || 'cert').split('').reduce((a, c) => a + c.charCodeAt(0), 0) + index * 7
  const seq = String(100000 + (hash % 900000))
  const certificateNo = `${(certificateType || 'CERT').slice(0, 2).toUpperCase()}${new Date().getFullYear()}${seq}`
  const today = new Date()
  const effectiveYear = today.getFullYear() - (hash % 3) - 1
  const effectiveMonth = (hash % 12) + 1
  const effectiveDay = (hash % 27) + 1
  const effectiveDate = `${effectiveYear}-${String(effectiveMonth).padStart(2, '0')}-${String(effectiveDay).padStart(2, '0')}`
  const expiryMs = new Date(`${effectiveDate}`).getTime() + 1095 * 24 * 60 * 60 * 1000
  const expiryDate = new Date(expiryMs).toISOString().slice(0, 10)
  const nowMs = today.getTime()
  const status: CertificateStatus = expiryMs < nowMs ? 'expired' : (expiryMs - nowMs < 60 * 24 * 60 * 60 * 1000 ? 'expiring' : 'valid')
  return { certificateNo, status, effectiveDate, expiryDate }
}

export function isCertificateExpired(certificateType: string, index: number): boolean {
  return mockCertificateInfo(certificateType, index).status === 'expired'
}
