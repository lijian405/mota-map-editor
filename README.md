# 魔塔 Tile 地图编辑器

一个可视化的魔塔（Magic Tower）Tile 地图编辑器，支持拖拽式编辑、事件系统配置和预览测试。

## 功能特性

### 地图编辑
- 自定义地图宽高
- 拖拽/点击放置 Tile
- 选中 Tile 可拖动移动位置
- Delete 键删除选中 Tile
- 右键取消当前选中
- 鼠标滚轮缩放画布
- 右键拖拽平移画布
- 撤销/重做功能（Ctrl+Z / Ctrl+Y）

### Tile 库
- 分类展示：地形、道具、怪物、NPC、门
- 搜索过滤
- 预设 Tile 图标

### 事件系统
- 触发条件：踩上 Tile、碰撞 Tile（支持方向）、对话、使用道具等
- 执行条件：钥匙数量、属性要求、事件状态等
- 动作序列：获得/消耗道具、改变属性、传送、对话、切换楼层等
- 事件模板快速创建

### 预览模式
- WASD/方向键控制角色移动
- 碰撞检测（墙、门、怪物）
- 道具拾取
- 钥匙/门交互
- 状态显示（HP、攻击、防御、钥匙）

### 数据管理
- 导入/导出 JSON 格式
- 自动保存（每 5 秒 + 页面关闭前）
- 多楼层管理

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| Ctrl + C | 复制选中的 Tile |
| Ctrl + V | 粘贴已复制的 Tile |
| Ctrl + Z | 撤销 |
| Ctrl + Y / Ctrl + Shift + Z | 重做 |
| Delete | 删除选中的 Tile |
| 鼠标滚轮 | 缩放画布 |
| 右键拖拽 | 平移画布 |
| 右键 | 取消当前选中 |

预览模式：
| 快捷键 | 功能 |
|--------|------|
| W / ↑ | 向上移动 |
| S / ↓ | 向下移动 |
| A / ← | 向左移动 |
| D / → | 向右移动 |

## 技术栈

- **前端框架**: React 18 + TypeScript
- **状态管理**: Redux Toolkit
- **UI 组件**: Ant Design
- **构建工具**: Vite
- **文件操作**: FileSaver.js

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 项目结构

```
src/
├── components/          # React 组件
│   ├── EventPanel.tsx      # 事件编辑面板
│   ├── MapBorderFrame.tsx # 地图边框
│   ├── MapCanvas.tsx      # 地图画布
│   ├── PreviewMode.tsx    # 预览模式
│   ├── PropertyPanel.tsx  # 属性面板
│   ├── StatusBar.tsx      # 状态栏
│   ├── TileEventPanel.tsx # Tile 事件面板
│   ├── TileLibrary.tsx    # Tile 库
│   └── Toolbar.tsx        # 工具栏
├── data/
│   ├── eventTemplates.ts  # 事件模板
│   └── presetTiles.ts     # 预设 Tile
├── store/
│   ├── editorSlice.ts     # 编辑器状态
│   ├── historySlice.ts    # 历史记录
│   └── mapSlice.ts        # 地图数据
├── types/
│   ├── event.ts           # 事件类型定义
│   ├── index.ts           # 类型导出
│   └── tile.ts            # Tile 类型定义
├── utils/
│   ├── mapBoardGeometry.ts   # 地图几何计算
│   ├── mapUtils.ts           # 地图工具函数
│   └── previewEventRuntime.ts # 预览事件运行时
├── App.tsx
├── main.tsx
└── index.css
```

## JSON 数据格式

导出的 JSON 包含完整地图数据：

```json
{
  "version": "1.0",
  "totalFloors": 3,
  "currentFloor": 1,
  "floors": [{
    "floorId": 1,
    "mapWidth": 20,
    "mapHeight": 15,
    "playerStart": { "x": 2, "y": 2, "hp": 1000, "attack": 10, ... },
    "tiles": [...],
    "globalEvents": [...],
    "customEvents": [...],
    "stairs": { "up": null, "down": { "x": 10, "y": 10 } }
  }]
}
```

## License

MIT
