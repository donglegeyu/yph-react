import pcaCodeData from 'china-division/dist/pca-code.json'

export function formatAreaCode(areaCode?: string): string {
  if (!areaCode) return '--'
  const codes = areaCode.split(',').map((c) => c.trim()).filter(Boolean)
  if (codes.length === 0) return '--'
  const path: string[] = []
  let list = pcaCodeData as DivisionRegion[]
  for (const code of codes) {
    const hit = list.find((n) => String(n.code) === String(code))
    if (!hit) break
    path.push(hit.name)
    list = hit.children || []
  }
  return path.length > 0 ? path.join(' / ') : '--'
}
