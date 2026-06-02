import type { FilterOption, PaginationConfig } from '@/types'

export interface ExportNavigationItem {
  key: string
  label: string
  icon?: string
  children?: ExportNavigationItem[]
}

export interface ExportPageState {
  meta: {
    title: string
    exportTime: string
    version: string
  }
  navigation: {
    activeFirstNav: string
    activeSecondNav: string
    firstNavItems: ExportNavigationItem[]
    secondNavItems: ExportNavigationItem[]
  }
  tabs: {
    activeTab: string
    tabs: Array<{ key: string; label: string; path: string }>
  }
  listConfig: {
    columns: Array<{
      key: string
      label: string
      width?: number
      fixed?: 'left' | 'right'
    }>
    filters: Record<string, unknown>
    pagination: PaginationConfig
    filterOptions: FilterOption[]
  }
  data: Record<string, unknown>[]
  statusMap: Record<string, { text: string; color: string }>
}

function generateDesignTokenCSS(): string {
  return `
    :root {
      --primary-color: #F95914;
      --primary-hover: #FF7043;
      --primary-active: #E64A19;
      --color-success: #52C41A;
      --color-warning: #FAAD14;
      --color-error: #FF4D4F;
      --color-info: #1890FF;
      --color-success-bg: #F6FFED;
      --color-warning-bg: #FFFBE6;
      --color-error-bg: #FFF2F0;
      --color-info-bg: #E6F4FF;
      --color-text: rgba(0, 0, 0, 0.88);
      --color-text-secondary: rgba(0, 0, 0, 0.65);
      --color-text-tertiary: rgba(0, 0, 0, 0.45);
      --color-text-disabled: rgba(0, 0, 0, 0.25);
      --color-bg-container: #FFFFFF;
      --color-bg-light: #FAFAFA;
      --color-bg-lighter: #F5F5F5;
      --color-border: #D9D9D9;
      --color-border-secondary: #F0F0F0;
      --color-status-pending: #FA541C;
      --color-status-pending-bg: #FFF2E8;
      --color-status-approved: #52C41A;
      --color-status-approved-bg: #F6FFED;
      --color-status-rejected: #CF1322;
      --color-status-rejected-bg: #FFF1F0;
    }
  `
}

function generateCoreStyles(): string {
  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'PingFang SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      -webkit-font-smoothing: antialiased;
      background: #F5F5F5;
      color: var(--color-text);
    }
    .export-badge {
      position: fixed;
      top: 8px;
      right: 8px;
      background: var(--primary-color);
      color: #fff;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 9999;
      opacity: 0.9;
    }
    .layout {
      display: flex;
      min-height: 100vh;
    }
    .first-sidebar {
      width: 126px;
      background: #1F1F1F;
      display: flex;
      flex-direction: column;
      padding: 20px 8px;
      flex-shrink: 0;
    }
    .brand-area {
      text-align: center;
      margin-bottom: 24px;
    }
    .brand-logo {
      width: 60px;
      height: 24px;
      margin: 0 auto 8px;
    }
    .brand-name {
      font-size: 16px;
      font-weight: 600;
      color: #fff;
    }
    .first-nav-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 4px;
      color: rgba(255,255,255,0.65);
      cursor: pointer;
      font-size: 14px;
      margin-bottom: 4px;
      transition: all 0.2s;
    }
    .first-nav-item:hover { color: #fff; background: rgba(255,255,255,0.08); }
    .first-nav-item.active { color: #fff; background: var(--primary-color); }
    .first-nav-icon { width: 16px; height: 16px; }
    .second-sidebar {
      width: 220px;
      background: #fff;
      border-right: 1px solid #f0f0f0;
      padding: 20px 8px;
      flex-shrink: 0;
    }
    .second-nav-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 4px;
      color: rgba(0,0,0,0.88);
      cursor: pointer;
      font-size: 14px;
      margin-bottom: 2px;
      transition: all 0.2s;
    }
    .second-nav-item:hover { background: #f5f5f5; }
    .second-nav-item.active { color: var(--primary-color); background: #FFF7F0; font-weight: 500; }
    .second-nav-icon { width: 16px; height: 16px; }
    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-width: 0;
    }
    .tab-bar {
      height: 40px;
      display: flex;
      align-items: center;
      padding: 0 12px;
      background: transparent;
      flex-shrink: 0;
    }
    .tab-list {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .tab-item {
      height: 28px;
      display: flex;
      align-items: center;
      padding: 0 8px 0 12px;
      gap: 6px;
      border-radius: 4px;
      background: #F2F1F0;
      cursor: pointer;
      font-size: 14px;
      color: rgba(0,0,0,0.65);
      transition: all 0.2s;
      flex-shrink: 0;
    }
    .tab-item:hover { background: #F5F5F5; }
    .tab-item.active { background: #F0EEED; color: rgba(0,0,0,0.88); }
    .tab-close {
      width: 12px;
      height: 12px;
      opacity: 0.45;
    }
    .tab-close:hover { opacity: 1; }
    .page-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 0 12px 12px;
      overflow: hidden;
    }
    .page-header {
      display: flex;
      align-items: center;
      height: 48px;
      gap: 16px;
    }
    .page-title {
      font-size: 16px;
      font-weight: 600;
      color: rgba(0,0,0,0.88);
    }
    .filter-form {
      background: #fff;
      padding: 10px 12px;
      border-radius: 6px;
      margin-bottom: 12px;
    }
    .filter-row {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
    }
    .filter-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .filter-label {
      font-size: 14px;
      color: rgba(0,0,0,0.65);
      white-space: nowrap;
    }
    .filter-input {
      height: 32px;
      padding: 4px 12px;
      border: 1px solid var(--color-border);
      border-radius: 6px;
      font-size: 14px;
      outline: none;
      transition: all 0.2s;
    }
    .filter-input:focus { border-color: var(--primary-color); box-shadow: 0 0 0 2px rgba(255,107,53,0.2); }
    .filter-select {
      height: 32px;
      padding: 4px 12px;
      border: 1px solid var(--color-border);
      border-radius: 6px;
      font-size: 14px;
      outline: none;
      background: #fff;
      min-width: 120px;
      cursor: pointer;
    }
    .filter-select:focus { border-color: var(--primary-color); box-shadow: 0 0 0 2px rgba(255,107,53,0.2); }
    .btn {
      height: 32px;
      padding: 4px 16px;
      border-radius: 6px;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
    }
    .btn-primary {
      background: var(--primary-color);
      color: #fff;
    }
    .btn-primary:hover { background: var(--primary-hover); }
    .btn-default {
      background: #fff;
      color: var(--color-text);
      border: 1px solid var(--color-border);
    }
    .btn-default:hover { color: var(--primary-color); border-color: var(--primary-color); }
    .content-card {
      flex: 1;
      background: #fff;
      border-radius: 6px 6px 0 0;
      padding: 12px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-height: 0;
    }
    .toolbar {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
    }
    .toolbar-left, .toolbar-right { display: flex; gap: 8px; align-items: center; }
    .table-wrapper {
      flex: 1;
      overflow: auto;
      min-height: 0;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }
    .data-table th {
      background: var(--color-bg-light);
      padding: 12px 16px;
      text-align: left;
      font-weight: 600;
      border-bottom: 1px solid var(--color-border);
      white-space: nowrap;
      position: sticky;
      top: 0;
      z-index: 1;
    }
    .data-table td {
      padding: 12px 16px;
      border-bottom: 1px solid var(--color-border-secondary);
      color: var(--color-text);
    }
    .data-table tr:hover td { background: var(--color-bg-light); }
    .data-table .fixed-left { position: sticky; left: 0; background: inherit; z-index: 1; }
    .data-table .fixed-right { position: sticky; right: 0; background: inherit; z-index: 1; }
    .status-tag {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
    }
    .status-pending { background: var(--color-status-pending-bg); color: var(--color-status-pending); }
    .status-approved { background: var(--color-status-approved-bg); color: var(--color-status-approved); }
    .status-rejected { background: var(--color-status-rejected-bg); color: var(--color-status-rejected); }
    .status-draft { background: var(--color-bg-light); color: var(--color-text-secondary); }
    .pagination {
      display: flex;
      justify-content: flex-end;
      padding-top: 12px;
      flex-shrink: 0;
    }
    .pagination-info { margin-right: 16px; color: var(--color-text-secondary); font-size: 14px; }
    .pagination-buttons { display: flex; gap: 4px; }
    .page-btn {
      min-width: 32px;
      height: 32px;
      border: 1px solid var(--color-border);
      background: #fff;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    .page-btn:hover:not(:disabled) { border-color: var(--primary-color); color: var(--primary-color); }
    .page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .page-btn.active { background: var(--primary-color); color: #fff; border-color: var(--primary-color); }
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      color: var(--color-text-tertiary);
    }
    .empty-icon { width: 64px; height: 64px; margin-bottom: 16px; opacity: 0.5; }
  `
}

function generateIconsSVG(): string {
  return `
    <svg style="display:none">
      <symbol id="icon-home" viewBox="0 0 48 48">
        <path d="M8 42V18L24 6l16 12v24H32V30H16v12H8z" stroke="currentColor" stroke-width="4" fill="none"/>
      </symbol>
      <symbol id="icon-star" viewBox="0 0 24 24">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" stroke-width="2" fill="none"/>
      </symbol>
      <symbol id="icon-star-fill" viewBox="0 0 24 24">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/>
      </symbol>
      <symbol id="icon-list" viewBox="0 0 48 48">
        <path d="M8 12h32M8 24h32M8 36h32" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
      </symbol>
      <symbol id="icon-setting" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r="8" stroke="currentColor" stroke-width="4" fill="none"/>
        <path d="M24 8v4M24 36v4M8 24h4M36 24h4M12 12l3 3M33 33l3 3M12 36l3-3M33 15l3-3" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
      </symbol>
      <symbol id="icon-down" viewBox="0 0 48 48">
        <path d="M12 18l12 12 12-12" stroke="currentColor" stroke-width="4" stroke-linecap="round" fill="none"/>
      </symbol>
      <symbol id="icon-close" viewBox="0 0 48 48">
        <path d="M12 12l24 24M36 12L12 36" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
      </symbol>
      <symbol id="icon-refresh" viewBox="0 0 48 48">
        <path d="M24 12v12l8-4" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round"/>
        <circle cx="24" cy="24" r="16" stroke="currentColor" stroke-width="4" fill="none"/>
      </symbol>
      <symbol id="icon-export" viewBox="0 0 48 48">
        <path d="M24 8v20M16 24l8 8 8-8" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round"/>
        <path d="M8 36v4h32v-4" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round"/>
      </symbol>
    </svg>
  `
}

function generateFilterForm(state: ExportPageState): string {
  const { filterOptions, filters } = state.listConfig
  
  if (!filterOptions || filterOptions.length === 0) {
    return '<div class="filter-form" style="display:none"></div>'
  }

  const filterItems = filterOptions
    .filter(opt => !['action', 'index', 'checkbox', 'selection'].includes(opt.key))
    .map(opt => {
      const value = filters[opt.key] || ''
      if (opt.type === 'select' && opt.options) {
        return `
          <div class="filter-item">
            <span class="filter-label">${opt.label}</span>
            <select class="filter-select" data-filter="${opt.key}">
              <option value="">全部</option>
              ${opt.options?.map((o) => 
                `<option value="${o.value}" ${value === o.value ? 'selected' : ''}>${o.label}</option>`
              ).join('')}
            </select>
          </div>
        `
      } else {
        return `
          <div class="filter-item">
            <span class="filter-label">${opt.label}</span>
            <input type="text" class="filter-input" placeholder="请输入" value="${value}" data-filter="${opt.key}">
          </div>
        `
      }
    }).join('')

  return `
    <div class="filter-form">
      <div class="filter-row">
        ${filterItems}
        <div class="filter-item">
          <button class="btn btn-primary" onclick="handleSearch()">查询</button>
          <button class="btn btn-default" onclick="handleReset()">重置</button>
        </div>
      </div>
    </div>
  `
}

function generateTable(state: ExportPageState): string {
  const { columns } = state.listConfig
  
  if (!columns || columns.length === 0) {
    return '<div class="empty-state"><div class="empty-icon">📋</div><div>暂无数据</div></div>'
  }

  const headerCells = columns.map(col => {
    const style = col.fixed === 'left' ? 'left' : col.fixed === 'right' ? 'right' : ''
    return `<th class="${style}" style="width:${col.width || 120}px">${col.label}</th>`
  }).join('')

  const dataRows = state.data.map((row, idx) => {
    const cells = columns.map(col => {
      let content = row[col.key] !== undefined && row[col.key] !== null ? String(row[col.key]) : ''
      const style = col.fixed === 'left' ? 'fixed-left' : col.fixed === 'right' ? 'fixed-right' : ''
      
      if (col.key === 'status') {
        const statusInfo = state.statusMap[content] || { text: content, color: 'default' }
        content = `<span class="status-tag status-${statusInfo.color}">${statusInfo.text}</span>`
      }
      
      return `<td class="${style}">${content}</td>`
    }).join('')
    
    return `<tr data-index="${idx}">${cells}</tr>`
  }).join('')

  return `
    <table class="data-table">
      <thead><tr>${headerCells}</tr></thead>
      <tbody>${dataRows}</tbody>
    </table>
  `
}

function generatePagination(state: ExportPageState): string {
  const { pagination } = state.listConfig
  const { current = 1, pageSize = 20, total = 0 } = pagination
  const totalPages = Math.ceil(total / pageSize)
  
  const pageButtons: string[] = []
  for (let i = 1; i <= totalPages && i <= 7; i++) {
    pageButtons.push(`<button class="page-btn ${i === current ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`)
  }

  return `
    <div class="pagination">
      <span class="pagination-info">共 ${total} 条</span>
      <div class="pagination-buttons">
        <button class="page-btn" onclick="goToPage(${current - 1})" ${current <= 1 ? 'disabled' : ''}>‹</button>
        ${pageButtons.join('')}
        <button class="page-btn" onclick="goToPage(${current + 1})" ${current >= totalPages ? 'disabled' : ''}>›</button>
      </div>
    </div>
  `
}

function generateScript(state: ExportPageState): string {
  const dataJson = JSON.stringify(state.data)
  const filterOptionsJson = JSON.stringify(state.listConfig.filterOptions)
  const statusMapJson = JSON.stringify(state.statusMap)
  const paginationJson = JSON.stringify(state.listConfig.pagination)

  return `
    <script>
      const PAGE_STATE = ${JSON.stringify(state)};
      let filteredData = ${dataJson};
      let currentFilters = ${JSON.stringify(state.listConfig.filters)};
      let pagination = ${paginationJson};
      const filterOptions = ${filterOptionsJson};
      const statusMap = ${statusMapJson};

      function handleSearch() {
        const inputs = document.querySelectorAll('.filter-input, .filter-select');
        inputs.forEach(input => {
          const key = input.dataset.filter;
          if (key) {
            currentFilters[key] = input.value;
          }
        });
        applyFilters();
      }

      function handleReset() {
        currentFilters = {};
        document.querySelectorAll('.filter-input').forEach(input => input.value = '');
        document.querySelectorAll('.filter-select').forEach(select => select.value = '');
        applyFilters();
      }

      function applyFilters() {
        filteredData = PAGE_STATE.data.filter(row => {
          return Object.keys(currentFilters).every(key => {
            const filterVal = currentFilters[key];
            if (!filterVal) return true;
            const rowVal = String(row[key] || '').toLowerCase();
            return rowVal.includes(String(filterVal).toLowerCase());
          });
        });
        pagination.current = 1;
        pagination.total = filteredData.length;
        renderTable();
        renderPagination();
      }

      function getPageData() {
        const start = (pagination.current - 1) * pagination.pageSize;
        const end = start + pagination.pageSize;
        return filteredData.slice(start, end);
      }

      function goToPage(page) {
        const totalPages = Math.ceil(pagination.total / pagination.pageSize);
        if (page < 1 || page > totalPages) return;
        pagination.current = page;
        renderTable();
        renderPagination();
      }

      function renderTable() {
        const { columns } = PAGE_STATE.listConfig;
        const pageData = getPageData();
        const tbody = document.querySelector('.data-table tbody');
        
        if (!pageData || pageData.length === 0) {
          tbody.innerHTML = '<tr><td colspan="' + columns.length + '"><div class="empty-state"><div class="empty-icon">📋</div><div>暂无数据</div></div></td></tr>';
          return;
        }

        tbody.innerHTML = pageData.map(row => {
          const cells = columns.map(col => {
            let content = row[col.key] !== undefined && row[col.key] !== null ? String(row[col.key]) : '';
            const style = col.fixed === 'left' ? 'fixed-left' : col.fixed === 'right' ? 'fixed-right' : '';
            
            if (col.key === 'status') {
              const statusInfo = statusMap[content] || { text: content, color: 'default' };
              content = '<span class="status-tag status-' + statusInfo.color + '">' + statusInfo.text + '</span>';
            }
            
            return '<td class="' + style + '">' + content + '</td>';
          }).join('');
          return '<tr>' + cells + '</tr>';
        }).join('');
      }

      function renderPagination() {
        const totalPages = Math.ceil(pagination.total / pagination.pageSize);
        const paginationEl = document.querySelector('.pagination');
        const info = paginationEl.querySelector('.pagination-info');
        const buttons = paginationEl.querySelector('.pagination-buttons');
        
        if (info) info.textContent = '共 ' + pagination.total + ' 条';
        
        if (buttons) {
          let btns = '<button class="page-btn" onclick="goToPage(' + (pagination.current - 1) + ')" ' + (pagination.current <= 1 ? 'disabled' : '') + '>‹</button>';
          for (let i = 1; i <= totalPages && i <= 7; i++) {
            btns += '<button class="page-btn ' + (i === pagination.current ? 'active' : '') + '" onclick="goToPage(' + i + ')">' + i + '</button>';
          }
          btns += '<button class="page-btn" onclick="goToPage(' + (pagination.current + 1) + ')" ' + (pagination.current >= totalPages ? 'disabled' : '') + '>›</button>';
          buttons.innerHTML = btns;
        }
      }

      document.addEventListener('DOMContentLoaded', () => {
        renderTable();
        renderPagination();
      });
    </script>
  `
}

export function generateExportHTML(state: ExportPageState): string {
  const { meta, navigation, tabs } = state

  const firstNavItems = navigation.firstNavItems.map(item => `
    <div class="first-nav-item ${navigation.activeFirstNav === item.key ? 'active' : ''}" data-key="${item.key}">
      <svg class="first-nav-icon"><use href="#${item.icon || 'icon-list'}"/></svg>
      <span>${item.label}</span>
    </div>
  `).join('')

  const secondNavItems = navigation.secondNavItems.map(item => `
    <div class="second-nav-item ${navigation.activeSecondNav === item.key ? 'active' : ''}" data-key="${item.key}">
      <svg class="second-nav-icon"><use href="#${item.icon || 'icon-list'}"/></svg>
      <span>${item.label}</span>
    </div>
  `).join('')

  const tabItems = tabs.tabs.map(tab => `
    <div class="tab-item ${tabs.activeTab === tab.key ? 'active' : ''}">
      <span>${tab.label}</span>
    </div>
  `).join('')

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${meta.title} - ${meta.exportTime}</title>
  ${generateIconsSVG()}
  <style>
    ${generateDesignTokenCSS()}
    ${generateCoreStyles()}
  </style>
</head>
<body>
  <div class="export-badge">导出快照 · ${meta.exportTime}</div>
  
  <div class="layout">
    <!-- 一级导航 -->
    <aside class="first-sidebar">
      <div class="brand-area">
        <div class="brand-name">星际VUE</div>
      </div>
      ${firstNavItems}
    </aside>
    
    <!-- 二级导航 -->
    <nav class="second-sidebar">
      ${secondNavItems}
    </nav>
    
    <!-- 主内容 -->
    <div class="main-content">
      <!-- 标签页 -->
      <div class="tab-bar">
        <div class="tab-list">
          ${tabItems}
        </div>
      </div>
      
      <!-- 页面容器 -->
      <div class="page-container">
        <!-- 页面标题 -->
        <div class="page-header">
          <h1 class="page-title">${meta.title}</h1>
        </div>
        
        <!-- 筛选表单 -->
        ${generateFilterForm(state)}
        
        <!-- 内容卡片 -->
        <div class="content-card">
          <!-- 工具栏 -->
          <div class="toolbar">
            <div class="toolbar-left">
              <button class="btn btn-primary">新增</button>
              <button class="btn btn-default">导出</button>
              <button class="btn btn-default">导入</button>
            </div>
            <div class="toolbar-right">
              <button class="btn btn-default" style="width:32px;padding:0;display:flex;align-items:center;justify-content:center">
                <svg style="width:16px;height:16px"><use href="#icon-setting"/></svg>
              </button>
              <button class="btn btn-default" style="width:32px;padding:0;display:flex;align-items:center;justify-content:center">
                <svg style="width:16px;height:16px"><use href="#icon-refresh"/></svg>
              </button>
            </div>
          </div>
          
          <!-- 表格 -->
          <div class="table-wrapper">
            ${generateTable(state)}
          </div>
          
          <!-- 分页 -->
          ${generatePagination(state)}
        </div>
      </div>
    </div>
  </div>
  
  ${generateScript(state)}
</body>
</html>`
}
