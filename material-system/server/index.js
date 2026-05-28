const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 8081; // 使用 8081 端口避免与主服务冲突

app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(__dirname, 'data', 'icons.json');

// 默认图标配置
const defaultIcons = {
  preset: [
    { value: 'home', label: '首页' },
    { value: 'star', label: '收藏' },
    { value: 'folder', label: '文件夹' },
    { value: 'shopping', label: '购物' },
    { value: 'shopping-cart-del', label: '购物车' },
    { value: 'buy', label: '采购' },
    { value: 'commodity', label: '商品' },
    { value: 'tag', label: '标签' },
    { value: 'setting', label: '设置' },
    { value: 'list', label: '列表' },
    { value: 'more-one', label: '更多' },
    { value: 'more-two', label: '更多2' },
    { value: 'more-three', label: '更多3' },
    { value: 'bookmark', label: '书签' },
    { value: 'chart-histogram', label: '图表' },
    { value: 'comments', label: '评论' },
    { value: 'table', label: '表格' },
    { value: 'doc-search', label: '文档搜索' },
    { value: 'file-cabinet', label: '文件柜' },
    { value: 'inbox', label: '收件箱' },
    { value: 'message-security', label: '消息' },
    { value: 'people-top-card', label: '用户' },
    { value: 'delivery', label: '配送' },
    { value: 'order', label: '订单' },
    { value: 'coupon', label: '优惠券' },
    { value: 'wallet', label: '钱包' },
    { value: 'bank-card', label: '银行卡' },
    { value: 'bill', label: '账单' },
    { value: 'financing', label: '融资' },
    { value: 'transaction', label: '交易' },
    { value: 'receive', label: '收款' },
    { value: 'building-one', label: '建筑' },
    { value: 'mall-bag', label: '购物袋' },
    { value: 'handbag', label: '手提包' },
    { value: 'box', label: '箱子' },
    { value: 'warehousing', label: '仓储' },
    { value: 'ranking-list', label: '排行榜' },
    { value: 'refresh', label: '刷新' },
    { value: 'edit', label: '编辑' },
    { value: 'scan-setting', label: '扫描设置' },
    { value: 'database-config', label: '数据库' },
    { value: 'schedule', label: '日程' },
    { value: 'plan', label: '计划' },
    { value: 'view-list', label: '视图列表' },
    { value: 'application-one', label: '应用' },
    { value: 'all-application', label: '所有应用' },
    { value: 'category-management', label: '分类' },
    { value: 'internal-data', label: '数据' },
    { value: 'ad-product', label: '广告产品' },
    { value: 'config', label: '配置' },
    { value: 'material-three', label: '材料' },
  ],
  custom: []
};

// 读取图标配置
function readIcons() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('读取图标配置失败:', e);
  }
  return { ...defaultIcons };
}

// 保存图标配置
function writeIcons(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error('保存图标配置失败:', e);
    return false;
  }
}

// GET /api/icons - 获取图标配置
app.get('/api/icons', (req, res) => {
  const icons = readIcons();
  res.json({
    code: 200,
    data: icons
  });
});

// PUT /api/icons - 保存图标配置
app.put('/api/icons', (req, res) => {
  const { preset, custom } = req.body;
  
  if (!Array.isArray(preset) || !Array.isArray(custom)) {
    return res.json({
      code: 400,
      message: '参数错误'
    });
  }
  
  const success = writeIcons({ preset, custom });
  
  if (success) {
    res.json({
      code: 200,
      message: '保存成功'
    });
  } else {
    res.json({
      code: 500,
      message: '保存失败'
    });
  }
});

// GET /api/nav-menus - 获取菜单（返回空数据，避免影响前端）
app.get('/api/nav-menus', (req, res) => {
  res.json({
    code: 200,
    data: []
  });
});

// 其他 API 返回 404，避免拦截现有接口
app.use('/api/custom-nav-menus', (req, res) => {
  res.json({ code: 404, message: 'Not Found' });
});

app.use('/api/favorites', (req, res) => {
  res.json({ code: 404, message: 'Not Found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`图标配置服务已启动: http://localhost:${PORT}`);
  console.log(`图标配置数据文件: ${DATA_FILE}`);
});
