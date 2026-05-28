export interface FullPageExportOptions {
  title?: string
}

function getAllCSS(): string {
  const styles: string[] = []
  document.querySelectorAll('style').forEach((style: HTMLStyleElement) => {
    const content = style.textContent || ''
    if (content && !content.includes('v-bind') && !content.includes('__csssing')) {
      styles.push(content)
    }
  })
  return styles.join('\n')
}

function getCSSVariables(): string {
  const root = document.documentElement
  const styles = getComputedStyle(root)
  const variables: string[] = []
  for (let i = 0; i < styles.length; i++) {
    const prop = styles[i]
    if (prop.startsWith('--')) {
      const value = styles.getPropertyValue(prop)
      if (value) {
        variables.push(`  ${prop}: ${value};`)
      }
    }
  }
  if (variables.length === 0) {
    variables.push('  --primary-color: #F95914;')
    variables.push('  --primary-hover: #FF7043;')
    variables.push('  --color-text: rgba(0, 0, 0, 0.88);')
    variables.push('  --color-text-secondary: rgba(0, 0, 0, 0.65);')
    variables.push('  --color-bg-container: #FFFFFF;')
    variables.push('  --color-bg-light: #FAFAFA;')
    variables.push('  --color-border: #D9D9D9;')
    variables.push('  --color-border-secondary: #F0F0F0;')
  }
  return variables.join('\n')
}

function getSVGDefinitions(): string {
  const symbolElements = document.querySelectorAll('symbol')
  if (symbolElements.length > 0) {
    let svg = '<svg style="display:none" xmlns="http://www.w3.org/2000/svg">'
    symbolElements.forEach((sym: SVGElement) => {
      const clone = sym.cloneNode(true) as SVGElement
      svg += clone.outerHTML
    })
    svg += '</svg>'
    return svg
  }
  const svgContainers = document.querySelectorAll('svg[symbol], svg#sprite, svg#sprite-nav, svg#icons')
  let result = ''
  svgContainers.forEach((svg: SVGElement) => {
    const clone = svg.cloneNode(true) as SVGElement
    clone.style.display = 'none'
    result += clone.outerHTML
  })
  return result
}

interface TableData {
  tableData: Record<string, unknown>[]
  columns: Array<{ key: string; label: string; width?: number }>
  originalActionCells: string[]
}

function extractTableData(): TableData {
  const tableRows: Record<string, unknown>[] = []
  const columns: Array<{ key: string; label: string; width?: number }> = []
  const originalActionCells: string[] = []

  const headerCells = document.querySelectorAll('.ant-table-thead th')
  headerCells.forEach((th: HTMLTableCellElement, idx: number) => {
    const label = th.textContent?.trim() || ''
    const style = th.getAttribute('style') || ''
    const widthMatch = style.match(/(\d+)px/)
    const width = widthMatch ? parseInt(widthMatch[1]) : undefined
    if (label && label !== '操作') {
      columns.push({ key: `col_${idx}`, label, width })
    }
  })

  const contentColCount = columns.length
  const tbodyRows = document.querySelectorAll('.ant-table-tbody tr')
  tbodyRows.forEach((row: HTMLTableRowElement) => {
    const rowData: Record<string, unknown> = {}
    const cells = row.querySelectorAll('td')
    if (cells.length === 0) return

    const hasData = Array.from(cells).some((cell: HTMLTableCellElement) => cell.textContent?.trim())
    if (!hasData) return

    for (let idx = 0; idx < contentColCount; idx++) {
      const cell = cells[idx] as HTMLTableCellElement
      if (!cell) break
      const headerCol = columns[idx]
      if (!headerCol) break
      rowData[headerCol.label] = cell.textContent?.trim() || ''
    }

    if (Object.keys(rowData).length > 0) {
      tableRows.push(rowData)
      const actionCell = cells[contentColCount] as HTMLTableCellElement
      originalActionCells.push(actionCell ? actionCell.innerHTML : '')
    }
  })

  return { tableData: tableRows, columns, originalActionCells }
}

function fixImageUrls(html: string): string {
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = html
  const imgs = tempDiv.querySelectorAll('img')
  const baseUrl = window.location.origin
  imgs.forEach((img: HTMLImageElement) => {
    let src = img.getAttribute('src') || ''
    if (src.startsWith('@/')) {
      src = src.replace('@/', '/src/')
    }
    if (src.startsWith('/src/') || src.startsWith('/assets/')) {
      src = baseUrl + src
    }
    img.setAttribute('src', src)
  })
  return tempDiv.innerHTML
}

function prepareExportDOM(): void {
  const morePanels = document.querySelectorAll('.more-panel, .more-dropdown, .ant-dropdown, .action-dropdown')
  morePanels.forEach((el: Element) => {
    (el as HTMLElement).style.display = 'none'
  })
}

export function exportFullPage(options: FullPageExportOptions = {}): string {
  const { title = '导出页面' } = options

  prepareExportDOM()

  const allCSS = getAllCSS()
  const cssVars = getCSSVariables()
  const svgDefs = getSVGDefinitions()
  const tableData = extractTableData()
  const bodyContent = fixImageUrls(document.body.innerHTML)

  const exportTime = new Date().toLocaleString('zh-CN')

  const statusMap: Record<string, { text: string; color: string }> = {
    '草稿': { text: '草稿', color: 'default' },
    '审核中': { text: '审核中', color: 'pending' },
    '已通过': { text: '已通过', color: 'approved' },
    '已拒绝': { text: '已拒绝', color: 'rejected' },
    'draft': { text: '草稿', color: 'default' },
    'pending': { text: '审核中', color: 'pending' },
    'approved': { text: '已通过', color: 'approved' },
    'rejected': { text: '已拒绝', color: 'rejected' },
  }

  const tableDataJson = JSON.stringify(tableData.tableData)
  const columnsJson = JSON.stringify(tableData.columns)
  const actionCellsJson = JSON.stringify(tableData.originalActionCells)
  const statusMapJson = JSON.stringify(statusMap)

  const interactiveCode = `var tableData = ${tableDataJson};
var columns = ${columnsJson};
var originalActionCells = ${actionCellsJson};
var statusMap = ${statusMapJson};
var filters = {};
var currentPage = 1;
var pageSize = 20;

function getAllRows() {
  return document.querySelectorAll('.ant-table-tbody tr');
}

function getVisibleRows() {
  var rows = getAllRows();
  var visibleRows = [];
  rows.forEach(function(row) {
    var cells = row.querySelectorAll('td');
    var hasData = Array.from(cells).some(function(cell) {
      return cell.textContent && cell.textContent.trim();
    });
    if (!hasData) return;

    var matches = Object.keys(filters).every(function(key) {
      var filterVal = filters[key];
      if (!filterVal) return true;
      var rowVal = '';
      for (var i = 0; i < columns.length; i++) {
        if (columns[i].label === key) {
          rowVal = cells[i] ? cells[i].textContent || '' : '';
          break;
        }
      }
      return rowVal.toLowerCase().includes(String(filterVal).toLowerCase());
    });

    if (matches) {
      visibleRows.push(row);
    }
  });
  return visibleRows;
}

function updatePagination() {
  var total = getVisibleRows().length;
  var totalPages = Math.ceil(total / pageSize);
  var start = (currentPage - 1) * pageSize;
  var end = start + pageSize;

  var rows = getAllRows();
  rows.forEach(function(row, idx) {
    var cells = row.querySelectorAll('td');
    var hasData = Array.from(cells).some(function(cell) {
      return cell.textContent && cell.textContent.trim();
    });
    if (!hasData) {
      row.style.display = 'none';
      return;
    }

    var visibleRows = getVisibleRows();
    var visibleIndex = visibleRows.indexOf(row);
    if (visibleIndex >= start && visibleIndex < end) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });

  var totalEl = document.querySelector('.ant-pagination-total-text');
  if (totalEl) {
    totalEl.textContent = '共 ' + total + ' 条';
  }
}

function initFilters() {
  var filterItems = document.querySelectorAll('.filter-form .ant-form-item');
  filterItems.forEach(function(item) {
    var labelEl = item.querySelector('.ant-form-item-label label');
    if (!labelEl) return;
    var label = labelEl.textContent.replace(':', '').trim();

    var select = item.querySelector('select');
    var input = item.querySelector('input:not([type="hidden"])');

    if (select) {
      select.addEventListener('change', function() {
        filters[label] = this.value;
        currentPage = 1;
        updatePagination();
      });
    } else if (input) {
      input.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
          currentPage = 1;
          updatePagination();
        }
      });
    }
  });

  var searchBtn = document.querySelector('.filter-form .ant-btn-primary');
  if (searchBtn) {
    searchBtn.addEventListener('click', function() {
      currentPage = 1;
      updatePagination();
    });
  }
}

function initPagination() {
  var prevBtn = document.querySelector('.ant-pagination-prev');
  var nextBtn = document.querySelector('.ant-pagination-next');
  var pageItems = document.querySelectorAll('.ant-pagination-item');

  if (prevBtn) {
    prevBtn.addEventListener('click', function() {
      if (currentPage > 1) {
        currentPage--;
        updatePagination();
        updatePaginationUI();
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', function() {
      var total = getVisibleRows().length;
      var totalPages = Math.ceil(total / pageSize);
      if (currentPage < totalPages) {
        currentPage++;
        updatePagination();
        updatePaginationUI();
      }
    });
  }

  pageItems.forEach(function(item) {
    item.addEventListener('click', function() {
      var page = parseInt(this.textContent);
      if (!isNaN(page)) {
        currentPage = page;
        updatePagination();
        updatePaginationUI();
      }
    });
  });
}

function updatePaginationUI() {
  var pageItems = document.querySelectorAll('.ant-pagination-item');
  pageItems.forEach(function(item) {
    var page = parseInt(item.textContent);
    if (page === currentPage) {
      item.classList.add('ant-pagination-item-active');
    } else {
      item.classList.remove('ant-pagination-item-active');
    }
  });
}

function initSyncScroll() {
  var tableWrapper = document.querySelector('.ant-table-wrapper');
  var tableThead = document.querySelector('.ant-table-thead');
  if (tableWrapper && tableThead) {
    tableWrapper.addEventListener('scroll', function() {
      tableThead.scrollLeft = tableWrapper.scrollLeft;
    });
  }
}

document.addEventListener('DOMContentLoaded', function() {
  updatePagination();
  initFilters();
  initPagination();
  initSyncScroll();
});`

  const baseStyles = `:root { ${cssVars} }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; overflow-x: auto; }
body { font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', Helvetica, Arial, sans-serif; }
.export-badge { position: fixed; top: 8px; right: 8px; background: #F95914; color: #fff; padding: 4px 12px; border-radius: 4px; font-size: 12px; z-index: 99999; box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
.ant-tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; white-space: nowrap; }
.ant-tag-default { background: #F5F5F5; color: rgba(0, 0, 0, 0.65); }
.ant-tag-pending { background: #FFF2E8; color: #FA541C; }
.ant-tag-approved { background: #F6FFED; color: #52C41A; }
.ant-tag-rejected { background: #FFF1F0; color: #CF1322; }
.ant-table { border-collapse: collapse; width: 100%; table-layout: auto; }
.ant-table th, .ant-table td { padding: 12px 16px; border-bottom: 1px solid #f0f0f0; white-space: nowrap; }
.ant-table th { background: #fafafa; font-weight: 500; }
.ant-table-row:hover td { background: #FAFAFA; }
.ant-pagination-item-active { background: #F95914 !important; border-color: #F95914 !important; }
.ant-pagination-item-active a { color: #fff !important; }
.ant-pagination-item:hover { border-color: #F95914; }
.ant-pagination-item:hover a { color: #F95914; }
.ant-pagination-prev:hover .ant-pagination-item-link, .ant-pagination-next:hover .ant-pagination-item-link { border-color: #F95914; color: #F95914; }
.ant-select:not(.ant-select-disabled):hover .ant-select-selector { border-color: #F95914; }
.ant-select-focused .ant-select-selector { border-color: #F95914 !important; box-shadow: 0 0 0 2px rgba(249, 89, 20, 0.2) !important; }
.ant-btn-primary { background: #F95914; border-color: #F95914; }
.ant-btn-primary:hover { background: #FF7043; border-color: #FF7043; }`

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - ${exportTime}</title>
  <style>${baseStyles}</style>
  <style>${allCSS}</style>
</head>
<body>
  ${svgDefs}
  <div class="export-badge">导出快照 · ${exportTime}</div>
  ${bodyContent}
  <script>${interactiveCode}</script>
</body>
</html>`

  return html
}

export function downloadFullPageExport(html: string, filename: string): void {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.html') ? filename : `${filename}.html`

  document.body.appendChild(link)
  link.click()

  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
