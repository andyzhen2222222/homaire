/**
 * 飞书多维表格 → Homaire 商品字段映射（单一数据源）
 * 同步逻辑（feishuBitableSync / productImport）与管理员后台说明均引用本文件。
 */

export type FeishuImportFieldSpec = {
  /** 写入 Product / 导入行的键 */
  targetKey: string;
  /** 后台展示名 */
  targetLabel: string;
  /** 飞书列名别名（精确匹配，含 GIGA / 大健常用列） */
  aliases: string[];
  required?: boolean;
  notes: string;
};

/** 飞书列名 → 系统字段（固定映射，勿在后台随意改键名） */
export const FEISHU_IMPORT_FIELD_SPECS: FeishuImportFieldSpec[] = [
  {
    targetKey: 'name',
    targetLabel: '商品名称（ERP / 完整名）',
    aliases: [
      'name',
      'Name',
      '名称',
      '商品名',
      '产品标题-英语',
      '产品标题-法语',
      '产品简称',
      '产品简称-法语',
      '标题',
      '标题-英语',
      '标题-法语',
      '英文标题',
      'product',
      'Product',
    ],
    notes:
      '前台 H1 优先 shortTitle。标题优先级：产品标题-英语 → 产品简称 → 标题-法语 → 简短描述/长描述；SKU 仅最后兜底。',
  },
  {
    targetKey: 'sku',
    targetLabel: 'SKU / 产品型号',
    aliases: ['SKU', 'sku', '产品型号', 'SKU-RBL', '货号', '型号'],
    notes: '仅作型号展示（详情页 Model 行），不映射为商品主标题。',
  },
  {
    targetKey: 'shortTitle',
    targetLabel: '店铺主标题',
    aliases: ['shortTitle', 'ShortTitle', '短标题', '店铺标题'],
    notes: '列表 / 详情 H1 优先展示；建议 ≤72 字。',
  },
  {
    targetKey: 'price',
    targetLabel: '售价',
    aliases: [
      'price',
      'Price',
      '价格',
      '售价',
      '法国平台调价最低价',
      '法国平台售价',
      '法国最新单价',
    ],
    required: true,
    notes: '主价取法国平台售价；若调价最低价更低则写入 discountPrice 并 onSale。',
  },
  {
    targetKey: 'stock',
    targetLabel: '库存',
    aliases: ['stock', 'Stock', '库存', '可售库存', '拉取库存', '线上库存', '数量'],
    required: true,
    notes: '整数；缺省为 0。',
  },
  {
    targetKey: 'description',
    targetLabel: '摘要描述',
    aliases: [
      'description',
      'Description',
      '描述',
      '简介',
      '简短描述1-英文',
      '简短描述1-法语',
      '简短描述',
    ],
    notes: '侧栏导语。GIGA 表：简短描述 1–2（优先 -英文）合并；缺省从长描述首段补全。',
  },
  {
    targetKey: 'features',
    targetLabel: '核心卖点（Highlights）',
    aliases: [
      'features',
      'Features',
      '卖点',
      '特点',
      '简短描述2',
      '简短描述2-英文',
      '简短描述3',
      '简短描述3-英文',
      '简短描述4',
      '简短描述4-英文',
      '简短描述5',
      '简短描述5-英文',
    ],
    notes: 'GIGA 表：汇总 简短描述1–8（优先 -英文）；1–2 作摘要，3+ 作侧栏卖点。勿留空，否则前台曾显示占位文案。',
  },
  {
    targetKey: 'detailHtml',
    targetLabel: 'Product Story 长描述',
    aliases: ['detailHtml', 'DetailHtml', '详情', '长描述', '长描述-法语', 'html-法语', '产品描述-法语', 'html', 'HTML'],
    notes: '纯文本会自动包成 HTML；含图文块时直接渲染。',
  },
  {
    targetKey: 'images',
    targetLabel: '商品图',
    aliases: ['images', 'Images', '图片', '主图', '图片1', 'image', 'Image', '附件'],
    notes: '合并顺序：主图 → 原图片1…8（GIGA 白底主图）→ 图片1…8（平台处理后/细节图）。列表与详情首图取 images[0]。',
  },
  {
    targetKey: 'subCategory',
    targetLabel: '子系列 / 材质',
    aliases: ['subCategory', 'SubCategory', '子类', '沙发类型', '沙发类型-中文', '材质', '材质-法语', '颜色-法语'],
    notes: '筛选侧栏 Series；桌子类常用「材质」列。',
  },
  {
    targetKey: 'category',
    targetLabel: '分类 slug',
    aliases: ['category', 'Category', '类目', '分类', '品类'],
    notes: '飞书按分类绑定时由后台叶子 slug 覆盖，可不填列。',
  },
  {
    targetKey: 'videoUrl',
    targetLabel: '视频',
    aliases: ['videoUrl', 'VideoUrl', '视频'],
    notes: '可选。',
  },
  {
    targetKey: 'manualUrl',
    targetLabel: '安装 PDF',
    aliases: ['manualUrl', 'ManualUrl', '说明书'],
    notes: '可选；详情页 Installation PDF 区块。',
  },
  {
    targetKey: 'onSale',
    targetLabel: '促销开关',
    aliases: ['onSale', 'OnSale', '促销', '上架'],
    notes: '布尔 / 是·否。',
  },
  {
    targetKey: 'discountPrice',
    targetLabel: '折扣价',
    aliases: ['discountPrice', 'DiscountPrice', '折扣价', '活动价'],
    notes: '可选。',
  },
];

/** 供 feishuBitableSync.pickAliasKey 使用 */
export function getFeishuFieldAliasRecord(): Record<string, string[]> {
  return Object.fromEntries(FEISHU_IMPORT_FIELD_SPECS.map((s) => [s.targetKey, [...s.aliases]]));
}

export const GIGA_SHORT_DESCRIPTION_RULES = {
  title: 'GIGA / 大健「简短描述」拆分（与沙发、桌子飞书表一致）',
  rows: [
    {
      range: '简短描述 1–2（优先 简短描述N-英文）',
      mapsTo: 'description',
      detail: '合并为详情页侧栏首段摘要。',
    },
    {
      range: '简短描述 3–8（优先 -英文 列）',
      mapsTo: 'features',
      detail: '详情页 Highlights 列表；每条一行，最多 8 条。',
    },
    {
      range: '长描述',
      mapsTo: 'detailHtml',
      detail: 'Product Story 正文；无 HTML 时自动分段。',
    },
    {
      range: '产品标题-英语 / 产品简称 / 标题-法语 / 产品简称-法语',
      mapsTo: 'name / shortTitle',
      detail: '优先于 SKU、产品型号；Cdiscount 法语表用标题-法语列。',
    },
    {
      range: 'SKU / 产品型号',
      mapsTo: 'sku（型号）',
      detail: '不作为 H1；详情页显示为 Model xxx。',
    },
  ] as const,
};

export const FEISHU_SYNC_USAGE_STEPS = [
  {
    step: '1',
    title: '准备飞书链接',
    body: '在飞书多维表格编辑页复制地址栏 URL，须含 /base/ 与 table= 参数；分享视图 /share/ 链接无法同步。',
  },
  {
    step: '2',
    title: '绑定分类',
    body: '分类管理 → 编辑叶子分类（如 tables、sofas）→ 粘贴飞书 URL → 可选启用定时同步。',
  },
  {
    step: '3',
    title: '执行同步',
    body: '分类列表点击「同步」，或面板「同步全部已配置」。开发环境需 npm run dev + 本机 lark-cli 已登录。',
  },
  {
    step: '4',
    title: '生产部署',
    body: '服务器执行 FEISHU_CATEGORY=<slug> npm run sync:feishu -- "<url>"（同步时自动忽略 view= 以拉取全部列），再 npm run deploy:prepare 与 npm run start；或后台「推送到服务端」。',
  },
  {
    step: '5',
    title: '核对字段',
    body: '同步后抽查详情页：标题应为英文产品名而非 SKU；Highlights 应对应飞书简短描述 3+，而非占位文案。',
  },
] as const;

export const FEISHU_CLI_SETUP = [
  '安装并配置 lark-cli（飞书开放平台应用）',
  '终端执行：lark-cli auth login --domain base',
  '开发服务器：npm run dev（提供 /api/feishu/sync）',
  '命令行批量：FEISHU_CATEGORY=tables npm run sync:feishu -- "<飞书URL>"',
] as const;
