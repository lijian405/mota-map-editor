# 多格占地与怪物脚印（Footprint）

本文记录「单物体占据多个地图格子」的实现方式，以及与地图编辑器心点坐标（`x,y`）的约定。

## 背景

- 地图逻辑与碰撞基于格子：`MapLoader.tiles_by_pos` 按格索引物体。
- 默认每个物体只占 1×1；大体积怪物贴图可能跨多格，但若不扩展索引，只有锚点格会触发战斗/阻挡。
- 部分编辑器在旋转或放置多格怪时，导出的 **`x,y` 表示怪物中心（心点）所在格**，而不是左上角。

## 地图数据字段

写在 `map_data.json` 里对应 tile 对象上（与 `type: "monster"` 等并列）：

| 字段 | 类型 | 说明 |
|------|------|------|
| `footprintW` / `footprint_w` | 数 | 占地宽度（格），≥1，默认 1 |
| `footprintH` / `footprint_h` | 数 | 占地高度（格），≥1，默认 1 |
| `footprintOrigin` / `footprint_origin` | 字符串 | **`"topleft"`**（默认）或 **`"center"`** / **`"heart"`** |

### `footprintOrigin` 含义

- **`topleft`（默认）**  
  - `x,y` = 占地矩形的**左上角**那一格。  
  - 与未引入脚印前的行为一致，旧图可不写该字段。

- **`center` / `heart`**  
  - `x,y` = 编辑器中的**心点格**（奇数宽×奇数高时即几何中心那一格）。  
  - 运行时由 `get_footprint_top_left()` 换算左上角，再向 `footprintW × footprintH` 铺开索引。

### 存档与稳定键

- `GameObject.grid_position` 始终存**编辑器写入的那份 `x,y`**（心点或左上角，取决于 `footprintOrigin`）。
- `get_stable_tile_key()` 使用这份坐标，与 `id` 字段配合，保证存档/往返楼层一致。
- 占地展开只影响**空间索引与贴图世界坐标**，不改变「这一条地图记录」的身份键语义。

## 运行时行为

1. **索引**  
   对脚印覆盖的每一格，`tiles_by_pos` 中都注册**同一个节点**，玩家走到任意一格都会解析到同一怪物/物体。

2. **世界坐标**  
   节点 `position` 为脚印矩形**几何中心**的世界坐标（由左上角格 `get_footprint_top_left()` 与 `footprintW/H` 推算），大图贴图自然落在格子中央区域。

3. **移动**  
   `MapLoader.move_object()` 在更新 `grid_position` 后，按新的心点/左上角重新计算 `get_footprint_top_left()` 并重算世界坐标与索引。

4. **移除**  
   `_remove_node_from_tiles_index` / `_unindex_and_forget` 通过 `iter_footprint_cells()` 从所有脚印格中移除该节点，避免残留阻挡。

## 涉及文件

| 文件 | 变更要点 |
|------|----------|
| `scripts/gameobjects/gameobject.gd` | `footprint_w/h`、`footprint_origin`；`set_tile_data` 解析 JSON；`get_footprint_top_left()`；`iter_footprint_cells()` |
| `scripts/map_loader.gd` | `_create_tile` 放置时用 `get_footprint_top_left()` 算中心；`_index_object_footprint`、`move_object` 与之一致 |
| `map_data/map_data.json` | 按需为大型怪物增加脚印字段（示例见下） |

## 示例：15 层怪物 `114`

心点在 `(5, 4)`，3×3 占地，与编辑器一致：

```json
{
  "x": 5.0,
  "y": 4.0,
  "type": "monster",
  "name": "114",
  "footprintW": 3.0,
  "footprintH": 3.0,
  "footprintOrigin": "center"
}
```

实际占格范围：x ∈ [4, 6]，y ∈ [3, 5]（相对地图原点，与具体楼层布局有关）。  
制图时须避免在脚印范围内再叠放其它会参与碰撞的物体，以免同格多对象带来交互顺序问题。

## 制图注意

- 奇数×奇数 + `center`：心点唯一，与常见「中间格为 5」类编辑器一致。
- 偶数宽或偶数高：`center` 模式下左上角由公式 `(grid - (W-1)/2, …)` 整数推算，心点落在偏左/偏上的「中心格」一侧，若需与编辑器完全一致，应在导出侧与本文公式对齐或统一改为 `topleft` 导出。

---

*文档版本：与当前仓库中 `GameObject` / `MapLoader` 脚印实现同步。*
