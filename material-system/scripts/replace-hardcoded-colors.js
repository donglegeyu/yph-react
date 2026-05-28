#!/usr/bin/env node
/**
 * Design Token 迁移脚本
 * 将所有硬编码颜色替换为 CSS 变量
 */

const fs = require('fs');
const path = require('path');

// 颜色映射表
const colorMap = {
  // 主色
  '#F95914': 'var(--primary-color, #F95914)',
  '#FF7043': 'var(--primary-hover, #FF7043)',
  '#E64A19': 'var(--primary-active, #E64A19)',
  
  // 辅助色
  '#999': 'var(--color-text-disabled-light, #999)',
  '#595959': 'var(--color-text-secondary, #595959)',
  
  // 状态色
  '#F44336': 'var(--color-error, #F44336)',
  '#FF4D4F': 'var(--color-error, #FF4D4F)',
  
  // 背景色
  '#FAFAFA': 'var(--color-bg-light, #FAFAFA)',
  '#F5F5F5': 'var(--color-bg-lighter, #F5F5F5)',
  '#FFFFFF': 'var(--color-bg-container, #FFFFFF)',
  '#262626': 'var(--color-bg-gray, #262626)',
  
  // 边框色
  '#d9d9d9': 'var(--color-border, #d9d9d9)',
  '#D9D9D9': 'var(--color-border, #D9D9D9)',
  
  // 功能色背景
  '#FFF2E8': 'var(--color-status-pending-bg, #FFF2E8)',
  '#FFF2F0': 'var(--color-error-bg, #FFF2F0)',
  '#f6ffed': 'var(--color-success-bg, #f6ffed)',
};

// 遍历文件
function replaceInFile(filePath) {
  const ext = path.extname(filePath);
  
  // 只处理 .vue, .scss, .css 文件
  if (!['.vue', '.scss', '.css'].includes(ext)) {
    return;
  }
  
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;
    
    // 替换颜色
    Object.keys(colorMap).forEach(color => {
      const newColor = colorMap[color];
      // 忽略大小写替换
      const regex = new RegExp(color.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      if (regex.test(content)) {
        content = content.replace(regex, newColor);
        modified = true;
        console.log(`  ✓ ${path.basename(filePath)}: ${color} → ${newColor.split('(')[0].replace('var(--', '')}`);
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content);
    }
  } catch (err) {
    console.error(`  ✗ Error processing ${filePath}:`, err.message);
  }
}

// 遍历目录
function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // 跳过 node_modules 和 .git
      if (!['node_modules', '.git', 'dist', 'build'].includes(file)) {
        walkDir(filePath);
      }
    } else {
      replaceInFile(filePath);
    }
  });
}

// 主函数
const srcDir = path.join(__dirname, '../material-system/src');
console.log('🔍 开始替换硬编码颜色...\n');
walkDir(srcDir);
console.log('\n✅ 完成！所有硬编码颜色已替换为 CSS 变量。');
