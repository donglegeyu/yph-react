#!/usr/bin/env node
/**
 * company-ui AI 输出校验器 — 治理闭环环节③（自动校验）
 *
 * 把 Skill 的七条红线 + 数据契约变成可执行检查。AI 生成代码后立即运行，
 * 违规打回重生成——防「客观违规」与「迭代漂移」，不依赖人工肉眼审核。
 *
 * 零依赖（纯 Node.js），可复制到任何消费 @donglegeyu/company-ui 的业务项目：
 *
 *   curl -O https://raw.githubusercontent.com/donglegeyu/company-ui-skills/main/scripts/ai-lint.mjs
 *   node ai-lint.mjs src/
 *
 * 用法：
 *   node ai-lint.mjs [目录或文件...]    # 默认扫描 ./src
 *   node ai-lint.mjs src --quiet        # 只输出 error 级（挂 CI 用）
 *
 * 豁免机制（用于登记例外，而非绕过规范）：
 *   行级：行尾加   // lint-ai-disable-line            （该行全部规则）
 *                 // lint-ai-disable-line no-antd-import   （该行单条规则）
 *   文件级：文件头（前 10 行内）加
 *                 /* lint-ai-disable *​/               （本文件全部规则）
 *                 /* lint-ai-disable no-hardcoded-color *​/  （本文件单条规则）
 *
 * 退出码：存在 error → 1（可直接挂 CI / lint-staged / AI 自动修复循环）
 */

import fs from 'node:fs';
import path from 'node:path';

const VERSION = '1.1.0';

/* ===== 基础配置 ===== */

const CODE_EXT = new Set(['.ts', '.tsx', '.js', '.jsx']);
const STYLE_EXT = new Set(['.scss', '.css', '.less']);
const TS_EXT = new Set(['.ts', '.tsx']);
const SKIP_DIRS = new Set([
  'node_modules', 'dist', 'es', 'lib', 'build', 'coverage',
  '.git', '.dumi', '.umi', '.umi-production', 'public', 'fixtures', '__snapshots__',
]);

/** antd 原生组件白名单（无 Company 封装，可直接使用） */
const ANTD_WHITELIST = new Set([
  'Space', 'Tag', 'Form', 'Row', 'Col', 'Popover', 'Menu', 'App',
  'theme', 'ConfigProvider',
]);

/* ===== 规则清单 ===== */

const RULE_META = {
  'no-antd-import':      { level: 'error',   brief: '禁止从 antd 导入白名单外的组件（用 CompanyXxx）' },
  'no-hardcoded-color':  { level: 'error',   brief: '禁止硬编码颜色（用 theme.useToken() 或 designRules）' },
  'no-important':        { level: 'error',   brief: '禁止使用 !important' },
  'no-any':              { level: 'error',   brief: '禁止使用 any 类型' },
  'no-default-export':   { level: 'error',   brief: '禁止默认导出（用 export function / export const）' },
  'no-antd-icon-node':   { level: 'error',   brief: '禁止 iconNode 传 antd 图标（用 icon 字符串键）' },
  'page-response-contract': { level: 'warning', brief: 'PageResponse 字段是 list（不是 records / dataList）' },
  'prefer-template':     { level: 'warning', brief: '业务模板优先于基础组件手动拼装' },
  'antd-6-api':          { level: 'warning', brief: 'antd 6 API 废弃项（orientation / medium）' },
  'no-preset-tag-color': { level: 'warning', brief: 'Tag 的 color 禁用 preset 色板名（绕过主题治理，用语义名 success/processing/...）' },
  'excessive-tags':      { level: 'warning', brief: '单文件标签使用 ≥6 处——仅核心状态字段用标签，非核心用纯文本' },
};

/** antd Tag preset 色板名（静态硬编码，不受 ConfigProvider 主题影响） */
const TAG_PRESET_COLORS = new Set([
  'pink', 'red', 'volcano', 'orange', 'gold', 'yellow', 'lime',
  'green', 'cyan', 'blue', 'geekblue', 'purple', 'magenta',
]);

/* ===== 文件遍历 ===== */

function walk(target, out = []) {
  let stat;
  try {
    stat = fs.statSync(target);
  } catch {
    return out;
  }
  if (stat.isDirectory()) {
    for (const name of fs.readdirSync(target)) {
      if (SKIP_DIRS.has(name)) continue;
      if (name.startsWith('.')) continue;
      walk(path.join(target, name), out);
    }
  } else if (stat.isFile()) {
    const ext = path.extname(target);
    if (CODE_EXT.has(ext) || STYLE_EXT.has(ext)) out.push(target);
  }
  return out;
}

/* ===== 豁免解析 ===== */

/** 文件级豁免：返回 null（未豁免）、'all' 或规则名 Set */
function parseFileDisable(lines) {
  const head = lines.slice(0, 10).join('\n');
  const rules = new Set();
  let disabledAll = false;
  const re = /lint-ai-disable(?!-line)(?:\s+([\w-]+))?/g;
  let m;
  while ((m = re.exec(head)) !== null) {
    if (m[1]) {
      if (RULE_META[m[1]]) rules.add(m[1]);
    } else {
      disabledAll = true;
    }
  }
  if (disabledAll) return 'all';
  return rules.size ? rules : null;
}

/** 行级豁免：返回 true（该行该规则豁免） */
function isLineDisabled(line, rule) {
  const idx = line.indexOf('lint-ai-disable-line');
  if (idx === -1) return false;
  const rest = line.slice(idx + 'lint-ai-disable-line'.length);
  const m = rest.match(/^\s+([\w-]+)/);
  // 不带规则名 → 豁免该行全部规则
  return !m || m[1] === rule;
}

/** 判断违规位置是否在 // 注释内（减少教学注释误报） */
function inLineComment(line, col) {
  const idx = line.indexOf('//');
  return idx !== -1 && col > idx;
}

/* ===== 各规则实现（返回 [{ line, col, message, rule }]，line 从 1 起） ===== */

const RE_IMPORT_ANTD = /import\s+(?:(type)\s+)?(.+?)\s+from\s+['"]antd(\/[^'"]*)?['"]|require\(\s*['"]antd(\/[^'"]*)?['"]\s*\)/;
const RE_IMPORT_PKG = /from\s+['"]@donglegeyu\/company-ui['"]/;

function parseSpecifiers(clause) {
  const m = clause.match(/\{([^}]*)\}/);
  if (!m) return [];
  return m[1]
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      if (s.startsWith('type ')) return { imported: s.slice(5).trim(), typeOnly: true };
      const as = s.match(/^([\w$]+)\s+as\s+([\w$]+)$/);
      return as ? { imported: as[1], typeOnly: false } : { imported: s, typeOnly: false };
    });
}

function checkAntdImport(lines, ext, add) {
  if (!CODE_EXT.has(ext)) return new Set();
  const pkgImports = new Set();
  lines.forEach((line, i) => {
    const lineNo = i + 1;
    // 收集业务模板 import（供 prefer-template 用）
    if (RE_IMPORT_PKG.test(line)) {
      for (const s of parseSpecifiers(line)) pkgImports.add(s.imported);
    }
    if (isLineDisabled(line, 'no-antd-import')) return;
    const m = line.match(RE_IMPORT_ANTD);
    if (!m) return;
    // 类型导入豁免（import type { TableColumnsType } from 'antd'）
    if (m[1] === 'type') return;
    // 子路径（antd/es/xxx）与副作用导入直接违规
    if (m[3] || m[4]) {
      add(lineNo, 1, `禁止从 antd 子路径导入（应从 @donglegeyu/company-ui 导入 CompanyXxx）`, 'no-antd-import');
      return;
    }
    const clause = m[2];
    // import * as Antd / import Antd from 'antd'
    if (!clause.trim().startsWith('{')) {
      add(lineNo, 1, `禁止整包导入 antd（按需从 @donglegeyu/company-ui 导入 CompanyXxx）`, 'no-antd-import');
      return;
    }
    const bad = parseSpecifiers(clause).filter(
      (s) => !s.typeOnly && !ANTD_WHITELIST.has(s.imported),
    );
    if (bad.length) {
      const names = bad.map((s) => `Company${s.imported}`).join('、');
      add(
        lineNo,
        1,
        `禁止从 antd 导入 ${bad.map((s) => s.imported).join('、')}（用 ${names}，从 @donglegeyu/company-ui 导入；白名单：${[...ANTD_WHITELIST].join(' / ')}）`,
        'no-antd-import',
      );
    }
  });
  return pkgImports;
}

function checkHardcodedColor(lines, ext, add) {
  const isCode = CODE_EXT.has(ext);
  const hexRe = isCode
    ? /['"`](#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3}))['"`]/g
    : /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g;
  const rgbRe = isCode
    ? /['"`](rgba?\([^'"`]*\))['"`]/g
    : /rgba?\([^)]*\)/g;
  lines.forEach((line, i) => {
    if (isLineDisabled(line, 'no-hardcoded-color')) return;
    for (const re of [hexRe, rgbRe]) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(line)) !== null) {
        if (isLineDisabled(line, 'no-hardcoded-color')) break;
        const found = m[1] || m[0].replace(/^['"`]|['"`]$/g, '');
        add(
          i + 1,
          m.index + 1,
          `禁止硬编码颜色 ${found}（用 theme.useToken() 的 token，或 designRules 常量）`,
          'no-hardcoded-color',
        );
      }
    }
  });
}

function checkImportant(lines, ext, add) {
  lines.forEach((line, i) => {
    if (isLineDisabled(line, 'no-important')) return;
    const m = line.indexOf('!important');
    if (m !== -1) {
      add(i + 1, m + 1, '禁止使用 !important（用 ConfigProvider 组件级覆盖或内联 style）', 'no-important');
    }
  });
}

function checkAny(lines, ext, add) {
  if (!TS_EXT.has(ext)) return;
  const re = /(:\s*any\b)|(as\s+any\b)|(<any>)|(\bany\[\])/g;
  lines.forEach((line, i) => {
    if (isLineDisabled(line, 'no-any')) return;
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(line)) !== null) {
      if (inLineComment(line, m.index)) continue;
      add(i + 1, m.index + 1, '禁止使用 any 类型（定义明确的 TypeScript interface）', 'no-any');
    }
  });
}

function checkDefaultExport(lines, ext, add) {
  if (!CODE_EXT.has(ext)) return;
  const re = /export\s+default\b/g;
  lines.forEach((line, i) => {
    if (isLineDisabled(line, 'no-default-export')) return;
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(line)) !== null) {
      if (inLineComment(line, m.index)) continue;
      add(i + 1, m.index + 1, '禁止默认导出（用 export function / export const 具名导出）', 'no-default-export');
    }
  });
}

function checkAntdIconNode(lines, ext, add) {
  if (!CODE_EXT.has(ext)) return;
  const re = /iconNode\s*[=:]\s*[<{]?\s*(\w*(?:Outlined|Filled|TwoTone))\b/;
  lines.forEach((line, i) => {
    if (isLineDisabled(line, 'no-antd-icon-node')) return;
    const m = line.match(re);
    if (m) {
      add(
        i + 1,
        m.index + 1,
        `禁止 iconNode 传 antd 图标 ${m[1]}（用 icon 字符串键，如 icon: 'setting'；业务菜单可不写 icon 自动匹配）`,
        'no-antd-icon-node',
      );
    }
  });
}

function checkContract(lines, ext, add) {
  if (!CODE_EXT.has(ext)) return;
  lines.forEach((line, i) => {
    if (isLineDisabled(line, 'page-response-contract')) return;
    let m = line.match(/\.records\b/);
    if (m) {
      add(i + 1, m.index + 2, '分页字段是 list（不是 .records）— PageResponse 契约：{ list, total, pageNum, pageSize }', 'page-response-contract');
    }
    m = line.match(/\bdataList\b/);
    if (m) {
      add(i + 1, m.index + 1, '分页字段是 list（不是 dataList）— PageResponse 契约：{ list, total, pageNum, pageSize }', 'page-response-contract');
    }
  });
}

function checkAntd6Api(lines, ext, add) {
  if (!CODE_EXT.has(ext)) return;
  lines.forEach((line, i) => {
    if (isLineDisabled(line, 'antd-6-api')) return;
    let m = line.match(/direction\s*=\s*[{("']*\s*["']?vertical/);
    if (m) {
      add(i + 1, m.index + 1, 'antd 6 已废弃 direction="vertical"（用 orientation="vertical"）', 'antd-6-api');
    }
    m = line.match(/size\s*=\s*["']middle["']/);
    if (m) {
      add(i + 1, m.index + 1, 'antd 6 推荐用 size="medium"（middle 虽兼容但不推荐）', 'antd-6-api');
    }
  });
}

/** 偏移 → { line, col }（line 从 1 起） */
function offsetToPos(lines, abs) {
  let off = 0;
  for (let i = 0; i < lines.length; i++) {
    if (abs < off + lines[i].length + 1) return { line: i + 1, col: abs - off + 1 };
    off += lines[i].length + 1;
  }
  return { line: lines.length, col: 1 };
}

/** 收集 Tag 开标签匹配（<CompanyTag / <Tag，排除 </Tag>、<Tag.CheckableTag、<TagFoo） */
function collectTagOpenTags(content, re) {
  const matches = [];
  re.lastIndex = 0;
  let m;
  while ((m = re.exec(content)) !== null) matches.push(m);
  return matches;
}

/** no-preset-tag-color：Tag 的 color 用了 antd preset 色板名（静态色，绕过主题治理） */
function checkPresetTagColor(lines, ext, add) {
  if (!CODE_EXT.has(ext)) return;
  const content = lines.join('\n');
  const openRe = /<(?:CompanyTag|Tag)(?=[\s/>])[^>]*?>/g;
  for (const m of collectTagOpenTags(content, openRe)) {
    const cm = m[0].match(/\bcolor\s*=\s*["'](\w+)["']/);
    if (!cm || !TAG_PRESET_COLORS.has(cm[1])) continue;
    const pos = offsetToPos(lines, m.index + cm.index);
    add(
      pos.line,
      pos.col,
      `Tag 的 color="${cm[1]}" 是 antd preset 色板（静态硬编码，绕过主题治理，渲染出非品牌色）——用语义名 success/processing/warning/error/default 或品牌 hex`,
      'no-preset-tag-color',
    );
  }
}

/** excessive-tags：单文件标签 JSX ≥6 处（warning，提示「非必要不用标签」） */
function checkExcessiveTags(lines, ext, add) {
  if (!CODE_EXT.has(ext)) return;
  const content = lines.join('\n');
  const openRe = /<(?:CompanyTag|Tag)(?=[\s/>])/g;
  const count = (content.match(openRe) || []).length;
  if (count < 6) return;
  const first = content.search(openRe);
  if (first === -1) return;
  const pos = offsetToPos(lines, first);
  add(
    pos.line,
    pos.col,
    `本文件标签使用 ${count} 处——标签样式过多列表显得杂乱，一般仅核心状态字段用标签（1 个为宜），非核心字段用纯文本`,
    'excessive-tags',
  );
}

/** prefer-template：文件级启发式（import 组合判断），warning */
function checkPreferTemplate(lines, ext, add, pkgImports) {
  if (!CODE_EXT.has(ext) || !pkgImports.size) return;
  const has = (n) => pkgImports.has(n);
  // 找 import 行号（挂 warning 到首个相关 import 行）
  const findLine = (name) => {
    const idx = lines.findIndex((l) => new RegExp(`\\b${name}\\b`).test(l) && RE_IMPORT_PKG.test(l));
    return idx === -1 ? 1 : idx + 1;
  };
  if (isLineDisabled(lines.join('\n'), 'prefer-template')) return;
  if (has('CompanyTable') && has('CompanyPagination') && !has('SmartListTemplate') && !has('StatisticsListPage')) {
    add(
      findLine('CompanyTable'),
      1,
      '列表页优先用 SmartListTemplate（fields + fetchData + pagination 一体），不要 CompanyTable + CompanyPagination 手动拼装',
      'prefer-template',
    );
  }
  if ((has('CompanySidebar') || has('CompanyMultiTabs')) && !has('AdminLayoutTemplate')) {
    add(
      findLine('CompanySidebar') === 1 ? findLine('CompanyMultiTabs') : findLine('CompanySidebar'),
      1,
      '后台骨架优先用 AdminLayoutTemplate（侧边导航 + 多页签 + 内容区一体托管），不要手动拼装 CompanySidebar + CompanyMultiTabs',
      'prefer-template',
    );
  }
}

/* ===== 主流程 ===== */

function lintFile(file) {
  const problems = [];
  let content;
  try {
    content = fs.readFileSync(file, 'utf8');
  } catch {
    return problems;
  }
  const lines = content.split(/\r?\n/);
  const ext = path.extname(file);
  const fileDisable = parseFileDisable(lines);
  if (fileDisable === 'all') return problems;

  const add = (line, col, message, rule) => {
    if (fileDisable && fileDisable.has(rule)) return;
    if (line >= 1 && isLineDisabled(lines[line - 1] || '', rule)) return;
    problems.push({ file, line, col, message, rule, level: RULE_META[rule].level });
  };

  const pkgImports = checkAntdImport(lines, ext, add);
  checkHardcodedColor(lines, ext, add);
  checkImportant(lines, ext, add);
  checkAny(lines, ext, add);
  checkDefaultExport(lines, ext, add);
  checkAntdIconNode(lines, ext, add);
  checkContract(lines, ext, add);
  checkAntd6Api(lines, ext, add);
  checkPresetTagColor(lines, ext, add);
  checkExcessiveTags(lines, ext, add);
  checkPreferTemplate(lines, ext, add, pkgImports);
  return problems;
}

/* ===== 输出 ===== */

const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const c = {
  red: (s) => (useColor ? `\x1b[31m${s}\x1b[0m` : s),
  yellow: (s) => (useColor ? `\x1b[33m${s}\x1b[0m` : s),
  green: (s) => (useColor ? `\x1b[32m${s}\x1b[0m` : s),
  bold: (s) => (useColor ? `\x1b[1m${s}\x1b[0m` : s),
  dim: (s) => (useColor ? `\x1b[2m${s}\x1b[0m` : s),
};

function printHelp() {
  console.log(`
company-ui AI 输出校验器 v${VERSION} — 治理闭环环节③

用法：
  node ai-lint.mjs [目录或文件...]     默认扫描 ./src
  node ai-lint.mjs src --quiet         只输出 error 级

规则清单：
${Object.entries(RULE_META)
  .map(([id, r]) => `  ${r.level === 'error' ? 'E' : 'W'}  ${id.padEnd(22)}${r.brief}`)
  .join('\n')}

豁免（登记例外，不是绕过规范）：
  行级   // lint-ai-disable-line [规则名]
  文件级 /* lint-ai-disable [规则名] *​/（文件头前 10 行内）

退出码：存在 error → 1
`);
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }
  const quiet = args.includes('--quiet');
  const targets = args.filter((a) => !a.startsWith('--'));
  if (!targets.length) targets.push('src');

  const files = targets.flatMap((t) => walk(path.resolve(t)));
  if (!files.length) {
    console.log(c.yellow(`未找到可扫描的源码文件（.ts/.tsx/.js/.jsx/.scss/.css/.less）：${targets.join(' ')}`));
    process.exit(0);
  }

  let all = [];
  for (const f of files) all = all.concat(lintFile(f));
  if (quiet) all = all.filter((p) => p.level === 'error');

  const errors = all.filter((p) => p.level === 'error');
  const warnings = all.filter((p) => p.level === 'warning');

  console.log(`\ncompany-ui AI 输出校验器 v${VERSION}（治理闭环 · 环节③ 自动校验）\n`);

  if (all.length) {
    // 按文件分组输出
    const byFile = new Map();
    for (const p of all) {
      if (!byFile.has(p.file)) byFile.set(p.file, []);
      byFile.get(p.file).push(p);
    }
    for (const [file, list] of [...byFile.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
      console.log(c.bold(file));
      for (const p of list.sort((a, b) => a.line - b.line || a.col - b.col)) {
        const sev = p.level === 'error' ? c.red('error') : c.yellow('warning');
        console.log(`  ${String(p.line).padStart(4)}:${String(p.col).padEnd(3)} ${sev}  ${p.message}  ${c.dim(p.rule)}`);
      }
      console.log('');
    }
  }

  const summary =
    errors.length || warnings.length
      ? c[errors.length ? 'red' : 'yellow'](
          `✖ ${errors.length} errors, ${warnings.length} warnings（${files.length} 个文件）`,
        )
      : c.green(`✔ 0 errors, 0 warnings（${files.length} 个文件，全部合规）`);
  console.log(summary);
  if (errors.length) {
    console.log(c.dim('存在 error：请按提示修复后重新校验（AI 应自动修复并复跑，直至 0 error）'));
    process.exit(1);
  }
}

main();
