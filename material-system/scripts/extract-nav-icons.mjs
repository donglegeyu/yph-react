import { readFileSync, writeFileSync, mkdirSync } from 'fs'

const icons = [
  'home',
  'star',
  'folder',
  'folder-open',
  'shopping',
  'shopping-cart-del',
  'shopping-cart-add',
  'tag',
  'setting',
  'list',
  'buy',
  'commodity',
  'more-one',
  'more-two',
  'more-three',
  'bookmark',
  'bookmark-one',
  'chart-histogram',
  'comments',
  'table',
  'doc-search',
  'file-cabinet',
  'inbox',
  'message-security',
  'people-top-card',
  'user-positioning',
  'delivery',
  'order',
  'coupon',
  'wallet',
  'bank-card',
  'bill',
  'financing',
  'transaction',
  'receive',
  'building-one',
  'mall-bag',
  'handbag',
  'box',
  'warehousing',
  'ticket',
  'ranking-list',
  'refresh',
  'search',
  'edit',
  'scan-setting',
  'database-config',
  'schedule',
  'plan',
  'view-list',
  'application-one',
  'all-application',
  'category-management',
  'internal-data',
  'ad-product',
  'config',
  'material-three',
]

const content = readFileSync('./public/iconpark/sprite_new.js', 'utf-8')

const symbolRegex = /<symbol id="([^"]+)"([^>]*)>([\s\S]*?)<\/symbol>/g

const symbols = {}
let match
while ((match = symbolRegex.exec(content)) !== null) {
  const [, id, attrs, innerContent] = match
  symbols[id] = { attrs, innerContent }
}

const svgSymbols = []

for (const iconName of icons) {
  const matchedId = Object.keys(symbols).find(id =>
    id === iconName || id.startsWith(iconName + '-') || id.startsWith(iconName + 'jj') || id.startsWith(iconName + 'klbd') || id.startsWith(iconName + 'jac') || id.startsWith(iconName + 'jeo') || id.startsWith(iconName + 'jab') || id.startsWith(iconName + 'jah') || id.startsWith(iconName + 'jil') || id.startsWith(iconName + 'jik') || id.startsWith(iconName + 'jill') || id.startsWith(iconName + 'jilk') || id.startsWith(iconName + 'jikh') || id.startsWith(iconName + 'jikf') || id.startsWith(iconName + 'jikhfb') || id.startsWith(iconName + 'jilk4') || id.startsWith(iconName + 'jilk0') || id.startsWith(iconName + 'jilk0oa')
  )

  if (matchedId && symbols[matchedId]) {
    const { innerContent } = symbols[matchedId]

    let svgContent = innerContent
      .replace(/stroke="#333"/g, 'stroke="currentColor"')
      .replace(/stroke-width="4"/g, 'stroke-width="1.5"')
      .replace(/data-follow-fill="currentColor"/g, 'data-follow-stroke="currentColor"')

    svgContent = svgContent.replace(/<path d="([^"]+)"([^>]*?)(\s*\/?>)/g, (match, d, middle, end) => {
      if (!middle.includes('stroke=')) {
        return `<path stroke-linejoin="round" stroke-linecap="round" stroke-width="1.5" stroke="currentColor" d="${d}"${middle} data-follow-stroke="currentColor"/>`
      }
      return match
    })

    svgSymbols.push(`  <symbol id="${iconName}" viewBox="0 0 48 48" fill="none">
${svgContent}
  </symbol>`)

    console.log(`✓ ${iconName} -> ${matchedId}`)
  } else {
    console.log(`✗ ${iconName} - 未找到`)
  }
}

const spriteSvg = `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">
${svgSymbols.join('\n')}
</svg>`

writeFileSync('./public/iconpark/sprite_nav.svg', spriteSvg)
console.log('\n完成! 导航图标已保存到 public/iconpark/sprite_nav.svg')
