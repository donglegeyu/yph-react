// 从 IconPark sprite 提取图标并修复 stroke 颜色
import { readFileSync, writeFileSync, readdirSync } from 'fs'

// 需要提取的图标列表
const icons = [
  'home', 'star', 'folder-open', 'shopping-cart-add',
  'shopping-cart', 'tag', 'setting', 'setting-one',
  'commodity', 'shopping', 'buy', 'goods', 'list'
]

// 读取 sprite 文件
const content = readFileSync('./public/iconpark/sprite_raw.js', 'utf-8')

// 提取 SVG 符号定义
const symbolRegex = /<symbol id="([^"]+)"([^>]*)>([\s\S]*?)<\/symbol>/g

let match
const symbols = {}

while ((match = symbolRegex.exec(content)) !== null) {
  const [, id, attrs, innerContent] = match
  symbols[id] = { attrs, innerContent }
}

// 提取并处理每个图标
for (const iconName of icons) {
  // 查找匹配的图标（支持后缀变体如 icon-jj123）
  const matchedId = Object.keys(symbols).find(id =>
    id === iconName || id.startsWith(iconName + '-') || id.startsWith(iconName + 'jj')
  )

  if (matchedId && symbols[matchedId]) {
    const { attrs, innerContent } = symbols[matchedId]

    // 构建 SVG，将硬编码的 stroke 替换为 currentColor
    let svgContent = innerContent
      .replace(/stroke="#333"/g, 'stroke="currentColor"')
      .replace(/stroke-width="4"/g, 'stroke-width="1.5"')

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" width="24" height="24">
  ${svgContent}
</svg>`

    // 清理并写入文件
    const cleanSvg = svg.replace(/\s+/g, ' ').replace(/> </g, '><').trim()
    writeFileSync(`./public/iconpark/${iconName}.svg`, cleanSvg)
    console.log(`✓ 提取: ${iconName} -> ${matchedId}`)
  } else {
    console.log(`✗ 未找到: ${iconName}`)
  }
}

console.log('\n完成! 图标已保存到 public/iconpark/')
