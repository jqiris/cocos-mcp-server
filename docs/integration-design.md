# Cocos MCP Server 工具整合设计文档

## 1. 概述

### 1.1 背景

Cocos MCP Server 当前实现了面向 Cocos Creator 编辑器的 MCP（Model Context Protocol）工具集，共计 **15 个工具文件**，包含约 **160+ 个细粒度工具**。每个工具对应编辑器的一个具体操作，例如 `create_node`、`set_node_property`、`get_scene_hierarchy` 等。

随着功能不断扩展，细粒度工具模式暴露出以下问题：

- **工具数量膨胀**：160+ 个工具导致 LLM 上下文窗口消耗严重，工具选择准确率下降
- **语义关联缺失**：相关操作散布在不同工具中，LLM 难以理解操作间的逻辑关系
- **参数重复**：大量工具共享相同的参数模式（如 nodeUuid、componentType），增加了不必要的 schema 开销

### 1.2 目标

基于 13 张设计图（`docs/integration/` 目录）中定义的目标工具架构，将现有细粒度工具整合为 **13 个功能模块、约 55 个语义化分组工具**。每个分组工具通过 `action` 参数选择具体操作，替代原有的多个独立工具。

### 1.3 整合前后对比

| 维度 | 整合前 | 整合后 |
|------|--------|--------|
| 工具文件数 | 15 | 13（模块化重组） |
| 工具总数 | ~160+ | ~55 |
| 单工具操作粒度 | 每个操作一个工具 | 每组操作一个工具 |
| LLM 上下文消耗 | 高（每个工具独立 schema） | 低（action 分发共享 schema） |
| 语义表达 | 操作导向（动词+名词） | 功能导向（名词+动词） |

## 2. 设计原则

### 2.1 语义化分组

将功能相关的操作归入同一个分组工具。例如，将 `copy_node`、`paste_node`、`cut_node` 合并为 `node_clipboard` 分组工具，通过 `action` 参数区分操作：

```
node_clipboard(action="copy", uuids=[...])
node_clipboard(action="paste", target="...", uuids=[...])
node_clipboard(action="cut", uuids=[...])
```

### 2.2 向后兼容

在整合过程中，保留原有内部实现逻辑。分组工具作为新的外部接口层，内部调用已有的执行方法。原有细粒度工具可在过渡期保留为别名。

### 2.3 最小新增原则

优先通过合并已有工具实现分组。只有设计图中明确要求且当前实现中完全缺失的功能，才标记为"需新增"。

### 2.4 统一错误处理

每个分组工具统一错误返回格式，包含：
- `success`: 操作是否成功
- `message`: 人类可读的描述信息
- `data`: 返回数据（可选）
- `error`: 错误信息（失败时）

## 3. 工具整合对照表

### 3.1 完整映射表

| 设计模块 | 设计分组工具名 | 当前源文件 | 当前工具 | 状态 |
|---------|--------------|-----------|---------|------|
| **场景工具** | `scene_management` | scene-tools.ts | get_current_scene, get_scene_list, open_scene, close_scene, create_scene, save_scene, save_scene_as | ✅已实现 |
| | `scene_hierarchy` | scene-tools.ts | get_scene_hierarchy | ✅已实现 |
| | `scene_execution_control` | scene-advanced-tools.ts | execute_component_method, execute_scene_script, restore_prefab | ✅已实现 |
| | `scene_state_management` | scene-advanced-tools.ts | scene_snapshot, scene_snapshot_abort, begin_undo_recording, end_undo_recording, cancel_undo_recording, soft_reload_scene | ✅已实现 |
| | `scene_query_system` | scene-advanced-tools.ts | query_scene_ready, query_scene_dirty, query_scene_classes, query_scene_components, query_component_has_script, query_nodes_by_asset_uuid | ✅已实现 |
| **节点工具** | `node_query` | node-tools.ts | find_nodes, find_node_by_name, get_node_info, get_all_nodes, detect_node_type | ✅已实现 |
| | `node_lifecycle` | node-tools.ts | create_node, delete_node | ✅已实现 |
| | `node_transform` | node-tools.ts | set_node_property, set_node_transform | ✅已实现 |
| | `node_hierarchy` | node-tools.ts | move_node, duplicate_node | ✅已实现 |
| | `node_clipboard` | scene-advanced-tools.ts | copy_node, paste_node, cut_node | ✅已实现 |
| | `node_property_management` | scene-advanced-tools.ts | reset_node_property, reset_node_transform, reset_component | ✅已实现 |
| | `node_array_management` | scene-advanced-tools.ts | move_array_element, remove_array_element | ✅已实现 |
| **组件工具** | `component_manage` | component-tools.ts | add_component, remove_component | ✅已实现 |
| | `component_script` | component-tools.ts | attach_script | ✅已实现 |
| | `component_query` | component-tools.ts | get_components, get_component_info, get_available_components | ✅已实现 |
| | `set_component_property` | component-tools.ts | set_component_property | ✅已实现 |
| | `configure_click_event` | component-tools.ts | （无对应工具） | ❌需新增 |
| **预制体工具** | `prefab_browse` | prefab-tools.ts | get_prefab_list, load_prefab, get_prefab_info, validate_prefab | ✅已实现 |
| | `prefab_lifecycle` | prefab-tools.ts | create_prefab, delete_prefab | ✅已实现 |
| | `prefab_instance` | prefab-tools.ts | instantiate_prefab, revert_prefab | ✅已实现 |
| | `prefab_edit` | prefab-tools.ts | （无对应工具） | ❌需新增 |
| **简易资源工具** | `asset_manage` | asset-advanced-tools.ts | import_asset, delete_asset, save_asset_meta, generate_available_url | ✅已实现 |
| | `asset_analyze` | asset-advanced-tools.ts | get_asset_dependencies, get_unused_assets | ✅已实现 |
| | `asset_system` | asset-advanced-tools.ts | check_asset_db_status, refresh_asset, open_asset_external | ✅已实现 |
| | `asset_query` | asset-advanced-tools.ts | get_asset_info, query_assets | ✅已实现 |
| | `asset_operations` | asset-advanced-tools.ts | create_asset, copy_asset, move_asset, save_asset | ✅已实现 |
| **项目工具** | `project_manage` | project-tools.ts | run_project, build_project, get_project_info, get_project_settings | ✅已实现 |
| | `project_build_system` | project-tools.ts | build_panel相关工具, preview_server相关工具 | ✅已实现 |
| **广播工具** | `broadcast_log_management` | broadcast-tools.ts | get_broadcast_log, clear_broadcast_log | ✅已实现 |
| | `broadcast_listener_management` | broadcast-tools.ts | listen_broadcast, stop_listening, get_active_listeners | ✅已实现 |
| **调试工具** | `debug_console` | debug-tools.ts | get_console_logs, clear_console | ✅已实现 |
| | `debug_logs` | debug-tools.ts | get_project_logs, get_log_file_info, search_project_logs | ✅已实现 |
| | `debug_system` | debug-tools.ts | get_editor_info, get_performance_stats, validate_scene, get_node_tree | ✅已实现 |
| **服务器工具** | `server_information` | server-tools.ts | query_server_ip_list, query_sorted_server_ip_list, query_server_port, get_server_status | ✅已实现 |
| | `server_connectivity` | server-tools.ts | check_server_connectivity, get_network_interfaces | ✅已实现 |
| **偏好设置工具** | `preferences_manage` | preferences-tools.ts | open_preferences_settings, query_preferences_config, set_preferences_config, reset_preferences | ✅已实现 |
| | `preferences_query` | preferences-tools.ts | get_all_preferences | ✅已实现 |
| | `preferences_backup` | preferences-tools.ts | export_preferences, import_preferences | ✅已实现 |
| **参考图片工具** | `reference_image_management` | reference-image-tools.ts | add_reference_image, remove_reference_image, switch_reference_image, clear_all_reference_images | ✅已实现 |
| | `reference_image_query` | reference-image-tools.ts | query_reference_image_config, query_current_reference_image, list_reference_images | ✅已实现 |
| | `reference_image_transform` | reference-image-tools.ts | set_reference_image_position, set_reference_image_scale, set_reference_image_opacity | ✅已实现 |
| | `reference_image_display` | reference-image-tools.ts | refresh_reference_image, set_reference_image_data | ✅已实现 |
| **场景视图工具** | `scene_view_gizmo_management` | scene-view-tools.ts | change_gizmo_tool, query_gizmo_tool_name, change_gizmo_pivot, change_gizmo_coordinate, change_align_with_view | ✅已实现 |
| | `scene_view_mode_control` | scene-view-tools.ts | switch_2d_3d, set_grid_visible等 | ✅已实现 |
| | `scene_view_icon_gizmo` | scene-view-tools.ts | set_icon_gizmo_3d_mode, set_icon_gizmo_2d_mode, set_icon_gizmo_size | ✅已实现 |
| | `scene_view_camera_control` | scene-view-tools.ts | focus_camera, align_camera, align_view | ✅已实现 |
| | `scene_view_status_management` | scene-view-tools.ts | get_scene_view_status, reset_scene_view_default | ✅已实现 |
| **验证工具** | `validate_json_params` | validation-tools.ts | validate_json_params | ✅已实现 |
| | `safe_string_value` | validation-tools.ts | safe_string_value | ✅已实现 |
| | `format_mcp_request` | validation-tools.ts | format_mcp_request | ✅已实现 |

### 3.2 统计汇总

| 状态 | 分组工具数 | 占比 |
|------|-----------|------|
| ✅ 已实现 | 53 | 96.4% |
| ❌ 需新增 | 2 | 3.6% |
| **合计** | **55** | **100%** |

## 4. 各模块详细设计

### 4.1 场景工具（scene）

#### 4.1.1 scene_management — 场景管理

**用途**：获取当前场景信息、列出所有场景、打开/关闭场景、创建新场景、保存场景。

**当前实现**：`scene-tools.ts` 中的 7 个工具。

**整合方案**：将 `get_current_scene`、`get_scene_list`、`open_scene`、`close_scene`、`create_scene`、`save_scene`、`save_scene_as` 合并为一个分组工具。

```typescript
{
  name: 'scene_management',
  description: '场景管理：获取当前场景信息、列出所有场景、打开/关闭场景、创建新场景、保存场景',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: [
          'get_current',
          'get_list',
          'open',
          'close',
          'create',
          'save',
          'save_as'
        ],
        description: '操作类型'
      },
      // action=open 所需参数
      scenePath: {
        type: 'string',
        description: '场景文件路径（open/create/save_as 时使用）'
      },
      sceneName: {
        type: 'string',
        description: '场景名称（create 时使用）'
      },
      savePath: {
        type: 'string',
        description: '保存路径（create 时使用）'
      }
    },
    required: ['action']
  }
}
```

**action 映射表**：

| action | 原工具 | 必要参数 |
|--------|--------|---------|
| `get_current` | get_current_scene | 无 |
| `get_list` | get_scene_list | 无 |
| `open` | open_scene | scenePath |
| `close` | close_scene | 无 |
| `create` | create_scene | sceneName, savePath |
| `save` | save_scene | 无 |
| `save_as` | save_scene_as | scenePath |

---

#### 4.1.2 scene_hierarchy — 场景层级

**用途**：获取当前场景的完整节点层级结构，支持可选的组件信息展示。

**当前实现**：`scene-tools.ts` 中的 `get_scene_hierarchy`。

**整合方案**：此工具较为独立，但为统一风格，仍包装为分组工具。

```typescript
{
  name: 'scene_hierarchy',
  description: '获取当前场景的完整节点层级结构，支持可选的组件信息展示',
  inputSchema: {
    type: 'object',
    properties: {
      includeComponents: {
        type: 'boolean',
        description: '是否包含组件信息',
        default: false
      }
    }
  }
}
```

**说明**：此工具功能单一，无 `action` 参数，直接执行获取层级操作。

---

#### 4.1.3 scene_execution_control — 场景执行控制

**用途**：执行组件方法、执行场景脚本、恢复预制体实例。

**当前实现**：`scene-advanced-tools.ts` 中的 `execute_component_method`、`execute_scene_script`、`restore_prefab`。

**整合方案**：

```typescript
{
  name: 'scene_execution_control',
  description: '场景执行控制：执行组件方法、执行场景脚本、恢复预制体实例',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['execute_component_method', 'execute_scene_script', 'restore_prefab'],
        description: '操作类型'
      },
      // execute_component_method 参数
      uuid: {
        type: 'string',
        description: '组件UUID（execute_component_method 时使用）'
      },
      name: {
        type: 'string',
        description: '方法名/插件名'
      },
      args: {
        type: 'array',
        description: '方法参数',
        default: []
      },
      // restore_prefab 参数
      nodeUuid: {
        type: 'string',
        description: '节点UUID（restore_prefab 时使用）'
      },
      assetUuid: {
        type: 'string',
        description: '预制体资源UUID（restore_prefab 时使用）'
      }
    },
    required: ['action']
  }
}
```

**action 映射表**：

| action | 原工具 | 必要参数 |
|--------|--------|---------|
| `execute_component_method` | execute_component_method | uuid, name |
| `execute_scene_script` | execute_scene_script | name, method |
| `restore_prefab` | restore_prefab | nodeUuid, assetUuid |

---

#### 4.1.4 scene_state_management — 场景状态管理

**用途**：创建场景快照、管理撤销/重做录制、控制场景重新加载。

**当前实现**：`scene-advanced-tools.ts` 中的 `scene_snapshot`、`scene_snapshot_abort`、`begin_undo_recording`、`end_undo_recording`、`cancel_undo_recording`、`soft_reload_scene`。

**整合方案**：

```typescript
{
  name: 'scene_state_management',
  description: '场景状态管理：创建快照、管理撤销/重做录制、控制场景重新加载',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: [
          'create_snapshot',
          'abort_snapshot',
          'begin_undo_recording',
          'end_undo_recording',
          'cancel_undo_recording',
          'soft_reload'
        ],
        description: '操作类型'
      },
      nodeUuid: {
        type: 'string',
        description: '节点UUID（begin_undo_recording 时使用）'
      },
      undoId: {
        type: 'string',
        description: '撤销录制ID（end/cancel_undo_recording 时使用）'
      }
    },
    required: ['action']
  }
}
```

**action 映射表**：

| action | 原工具 | 必要参数 |
|--------|--------|---------|
| `create_snapshot` | scene_snapshot | 无 |
| `abort_snapshot` | scene_snapshot_abort | 无 |
| `begin_undo_recording` | begin_undo_recording | nodeUuid |
| `end_undo_recording` | end_undo_recording | undoId |
| `cancel_undo_recording` | cancel_undo_recording | undoId |
| `soft_reload` | soft_reload_scene | 无 |

---

#### 4.1.5 scene_query_system — 场景查询系统

**用途**：获取场景状态、查询可用类和组件、按资源UUID查找节点。

**当前实现**：`scene-advanced-tools.ts` 中的 `query_scene_ready`、`query_scene_dirty`、`query_scene_classes`、`query_scene_components`、`query_component_has_script`、`query_nodes_by_asset_uuid`。

**整合方案**：

```typescript
{
  name: 'scene_query_system',
  description: '场景查询系统：获取场景状态、查询可用类/组件、按资源UUID查找节点',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: [
          'query_ready',
          'query_dirty',
          'query_classes',
          'query_components',
          'query_component_has_script',
          'query_nodes_by_asset'
        ],
        description: '操作类型'
      },
      extends: {
        type: 'string',
        description: '基类过滤（query_classes 时使用）'
      },
      className: {
        type: 'string',
        description: '类名（query_component_has_script 时使用）'
      },
      assetUuid: {
        type: 'string',
        description: '资源UUID（query_nodes_by_asset 时使用）'
      }
    },
    required: ['action']
  }
}
```

**action 映射表**：

| action | 原工具 | 必要参数 |
|--------|--------|---------|
| `query_ready` | query_scene_ready | 无 |
| `query_dirty` | query_scene_dirty | 无 |
| `query_classes` | query_scene_classes | 无 |
| `query_components` | query_scene_components | 无 |
| `query_component_has_script` | query_component_has_script | className |
| `query_nodes_by_asset` | query_nodes_by_asset_uuid | assetUuid |

---

### 4.2 节点工具（node）

#### 4.2.1 node_query — 节点查询

**用途**：搜索节点、获取节点详情、列出所有节点、检测节点类型（2D/3D）。

**当前实现**：`node-tools.ts` 中的 `find_nodes`、`find_node_by_name`、`get_node_info`、`get_all_nodes`、`detect_node_type`。

**整合方案**：

```typescript
{
  name: 'node_query',
  description: '节点查询：按名称搜索节点、获取节点详情、列出所有节点、检测2D/3D类型',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['find', 'find_by_name', 'get_info', 'get_all', 'detect_type'],
        description: '操作类型'
      },
      pattern: {
        type: 'string',
        description: '搜索模式（find 时使用）'
      },
      exactMatch: {
        type: 'boolean',
        description: '精确匹配（find 时使用）',
        default: false
      },
      name: {
        type: 'string',
        description: '节点名称（find_by_name 时使用）'
      },
      uuid: {
        type: 'string',
        description: '节点UUID（get_info/detect_type 时使用）'
      }
    },
    required: ['action']
  }
}
```

**action 映射表**：

| action | 原工具 | 必要参数 |
|--------|--------|---------|
| `find` | find_nodes | pattern |
| `find_by_name` | find_node_by_name | name |
| `get_info` | get_node_info | uuid |
| `get_all` | get_all_nodes | 无 |
| `detect_type` | detect_node_type | uuid |

---

#### 4.2.2 node_lifecycle — 节点生命周期

**用途**：创建新节点或删除已有节点。

**当前实现**：`node-tools.ts` 中的 `create_node`、`delete_node`。

**整合方案**：

```typescript
{
  name: 'node_lifecycle',
  description: '节点生命周期管理：创建新节点、删除已有节点',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['create', 'delete'],
        description: '操作类型'
      },
      // create 参数
      name: {
        type: 'string',
        description: '节点名称（create 时使用）'
      },
      parentUuid: {
        type: 'string',
        description: '父节点UUID'
      },
      nodeType: {
        type: 'string',
        enum: ['Node', '2DNode', '3DNode'],
        default: 'Node'
      },
      siblingIndex: {
        type: 'number',
        default: -1
      },
      assetUuid: {
        type: 'string',
        description: '资源UUID（从预制体实例化时使用）'
      },
      assetPath: {
        type: 'string',
        description: '资源路径（从预制体实例化时使用）'
      },
      components: {
        type: 'array',
        items: { type: 'string' },
        description: '初始组件列表'
      },
      unlinkPrefab: {
        type: 'boolean',
        default: false
      },
      keepWorldTransform: {
        type: 'boolean',
        default: false
      },
      initialTransform: {
        type: 'object',
        description: '初始变换设置'
      },
      // delete 参数
      uuid: {
        type: 'string',
        description: '节点UUID（delete 时使用）'
      }
    },
    required: ['action']
  }
}
```

---

#### 4.2.3 node_transform — 节点变换

**用途**：修改节点属性（名称、可见性等）和变换属性（位置、旋转、缩放）。

**当前实现**：`node-tools.ts` 中的 `set_node_property`、`set_node_transform`。

**整合方案**：

```typescript
{
  name: 'node_transform',
  description: '修改节点属性和变换：名称、可见性、位置、旋转、缩放',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['set_property', 'set_transform'],
        description: '操作类型'
      },
      uuid: {
        type: 'string',
        description: '节点UUID'
      },
      // set_property 参数
      property: {
        type: 'string',
        description: '属性名（set_property 时使用）'
      },
      value: {
        description: '属性值（set_property 时使用）'
      },
      // set_transform 参数
      position: {
        type: 'object',
        description: '位置 {x, y, z}'
      },
      rotation: {
        type: 'object',
        description: '旋转 {x, y, z}'
      },
      scale: {
        type: 'object',
        description: '缩放 {x, y, z}'
      }
    },
    required: ['action', 'uuid']
  }
}
```

---

#### 4.2.4 node_hierarchy — 节点层级操作

**用途**：移动节点（更改父节点）和复制节点。

**当前实现**：`node-tools.ts` 中的 `move_node`、`duplicate_node`。

**整合方案**：

```typescript
{
  name: 'node_hierarchy',
  description: '节点层级操作：移动节点（更改父节点）、复制节点',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['move', 'duplicate'],
        description: '操作类型'
      },
      uuid: {
        type: 'string',
        description: '目标节点UUID'
      },
      // move 参数
      newParentUuid: {
        type: 'string',
        description: '新父节点UUID（move 时使用）'
      },
      siblingIndex: {
        type: 'number',
        default: -1
      },
      // duplicate 参数
      includeChildren: {
        type: 'boolean',
        default: true
      }
    },
    required: ['action', 'uuid']
  }
}
```

---

#### 4.2.5 node_clipboard — 节点剪贴板

**用途**：复制、粘贴、剪切节点操作。

**当前实现**：`scene-advanced-tools.ts` 中的 `copy_node`、`paste_node`、`cut_node`。

**整合方案**：

```typescript
{
  name: 'node_clipboard',
  description: '节点剪贴板操作：复制、粘贴、剪切节点',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['copy', 'paste', 'cut'],
        description: '操作类型'
      },
      uuids: {
        oneOf: [
          { type: 'string' },
          { type: 'array', items: { type: 'string' } }
        ],
        description: '节点UUID或UUID数组'
      },
      // paste 参数
      target: {
        type: 'string',
        description: '目标父节点UUID（paste 时使用）'
      },
      keepWorldTransform: {
        type: 'boolean',
        default: false
      }
    },
    required: ['action']
  }
}
```

---

#### 4.2.6 node_property_management — 节点属性重置

**用途**：重置节点属性、变换、组件设置为默认值。

**当前实现**：`scene-advanced-tools.ts` 中的 `reset_node_property`、`reset_node_transform`、`reset_component`。

**整合方案**：

```typescript
{
  name: 'node_property_management',
  description: '节点属性重置：将节点属性、变换、组件恢复为默认值',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['reset_property', 'reset_transform', 'reset_component'],
        description: '操作类型'
      },
      uuid: {
        type: 'string',
        description: '节点/组件UUID'
      },
      // reset_property 参数
      path: {
        type: 'string',
        description: '属性路径（reset_property 时使用）'
      }
    },
    required: ['action', 'uuid']
  }
}
```

---

#### 4.2.7 node_array_management — 节点数组管理

**用途**：移动或移除节点数组属性中的元素。

**当前实现**：`scene-advanced-tools.ts` 中的 `move_array_element`、`remove_array_element`。

**整合方案**：

```typescript
{
  name: 'node_array_management',
  description: '节点数组属性管理：移动或移除数组元素',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['move_element', 'remove_element'],
        description: '操作类型'
      },
      uuid: {
        type: 'string',
        description: '节点UUID'
      },
      path: {
        type: 'string',
        description: '数组属性路径'
      },
      // move_element 参数
      target: {
        type: 'number',
        description: '目标索引（move_element 时使用）'
      },
      offset: {
        type: 'number',
        description: '偏移量（move_element 时使用）'
      },
      // remove_element 参数
      index: {
        type: 'number',
        description: '要移除的索引（remove_element 时使用）'
      }
    },
    required: ['action', 'uuid', 'path']
  }
}
```

---

### 4.3 组件工具（component）

#### 4.3.1 component_manage — 组件管理

**用途**：为节点添加或移除引擎内置组件（如 cc.Sprite、cc.Button 等）。

**当前实现**：`component-tools.ts` 中的 `add_component`、`remove_component`。

**整合方案**：

```typescript
{
  name: 'component_manage',
  description: '组件管理：为节点添加或移除引擎内置组件',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['add', 'remove'],
        description: '操作类型'
      },
      nodeUuid: {
        type: 'string',
        description: '目标节点UUID'
      },
      componentType: {
        type: 'string',
        description: '组件类型（如 cc.Sprite、cc.Button）'
      }
    },
    required: ['action', 'nodeUuid', 'componentType']
  }
}
```

---

#### 4.3.2 component_script — 脚本组件管理

**用途**：为节点挂载或移除自定义脚本组件。

**当前实现**：`component-tools.ts` 中的 `attach_script`。

**整合方案**：

```typescript
{
  name: 'component_script',
  description: '脚本组件管理：为节点挂载或移除自定义脚本组件',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['attach', 'detach'],
        description: '操作类型'
      },
      nodeUuid: {
        type: 'string',
        description: '目标节点UUID'
      },
      scriptPath: {
        type: 'string',
        description: '脚本资源路径（如 db://assets/scripts/MyScript.ts）'
      },
      scriptName: {
        type: 'string',
        description: '脚本类名（detach 时使用）'
      }
    },
    required: ['action', 'nodeUuid']
  }
}
```

**说明**：当前实现中 `detach`（移除脚本组件）功能缺失，需在整合时补充。移除脚本组件可复用 `remove_component` 的逻辑，以脚本类名作为 componentType 参数。

---

#### 4.3.3 component_query — 组件查询

**用途**：获取节点上的组件信息、列出所有组件、获取可用的组件类型列表。

**当前实现**：`component-tools.ts` 中的 `get_components`、`get_component_info`、`get_available_components`。

**整合方案**：

```typescript
{
  name: 'component_query',
  description: '组件查询：获取节点组件信息、查看特定组件详情、获取可用组件类型列表',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['get_all', 'get_info', 'get_available'],
        description: '操作类型'
      },
      nodeUuid: {
        type: 'string',
        description: '节点UUID'
      },
      componentType: {
        type: 'string',
        description: '组件类型（get_info 时使用）'
      },
      category: {
        type: 'string',
        enum: ['all', 'renderer', 'ui', 'physics', 'animation', 'audio'],
        default: 'all',
        description: '组件分类过滤（get_available 时使用）'
      }
    },
    required: ['action']
  }
}
```

---

#### 4.3.4 set_component_property — 设置组件属性

**用途**：设置一个或多个组件属性值。支持丰富的属性类型（字符串、数字、颜色、向量、引用等）。

**当前实现**：`component-tools.ts` 中的 `set_component_property`。

**整合方案**：此工具功能较为复杂且参数众多，保留独立接口。

```typescript
{
  name: 'set_component_property',
  description: '设置组件属性值。支持设置内置UI组件和自定义脚本组件的属性。注意：节点基础属性请使用 node_transform 工具，节点变换属性请使用 node_transform 工具。',
  inputSchema: {
    type: 'object',
    properties: {
      nodeUuid: {
        type: 'string',
        description: '目标节点UUID'
      },
      componentType: {
        type: 'string',
        description: '组件类型'
      },
      property: {
        type: 'string',
        description: '属性名'
      },
      propertyType: {
        type: 'string',
        enum: [
          'string', 'number', 'boolean', 'integer', 'float',
          'color', 'vec2', 'vec3', 'size',
          'node', 'component', 'spriteFrame', 'prefab', 'asset',
          'nodeArray', 'colorArray', 'numberArray', 'stringArray'
        ],
        description: '属性类型'
      },
      value: {
        description: '属性值（格式根据 propertyType 决定）'
      }
    },
    required: ['nodeUuid', 'componentType', 'property', 'propertyType', 'value']
  }
}
```

**说明**：无需 `action` 参数，此工具保持原有的单一操作模式。

---

#### 4.3.5 configure_click_event — 配置点击事件

**用途**：为 Button 组件配置或移除点击事件回调。

**当前实现**：无。

**整合方案**：这是设计图中新增的工具，需要全新实现。

```typescript
{
  name: 'configure_click_event',
  description: '配置或移除 Button 组件的点击事件。支持绑定场景节点上的脚本方法作为回调。',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['set', 'remove'],
        description: '操作类型：设置或移除点击事件'
      },
      nodeUuid: {
        type: 'string',
        description: '包含 Button 组件的节点UUID'
      },
      // set 时的参数
      targetNodeUuid: {
        type: 'string',
        description: '目标脚本所在的节点UUID'
      },
      scriptComponentType: {
        type: 'string',
        description: '目标脚本组件类型名'
      },
      methodName: {
        type: 'string',
        description: '回调方法名'
      },
      customEventData: {
        type: 'string',
        description: '自定义事件数据（可选）'
      }
    },
    required: ['action', 'nodeUuid']
  }
}
```

**实现要点**：

1. `action="set"` 时，需要：
   - 验证源节点上存在 `cc.Button` 组件
   - 验证目标节点上存在指定的脚本组件
   - 通过 `scene.set-property` 设置 Button 的 `_clickEvents` 属性
   - 事件格式为 `[{target: {__uuid__: targetNodeUuid}, component: scriptComponentType, handler: methodName, customEventData: ""}]`

2. `action="remove"` 时，将 `_clickEvents` 设置为空数组

3. 内部实现需利用现有的 `set_component_property` 逻辑，将事件配置作为 cc.Button 组件的属性进行设置

---

### 4.4 预制体工具（prefab）

#### 4.4.1 prefab_browse — 预制体浏览

**用途**：获取预制体列表、查看预制体信息、验证预制体。

**当前实现**：`prefab-tools.ts` 中的 `get_prefab_list`、`load_prefab`、`get_prefab_info`、`validate_prefab`。

**整合方案**：

```typescript
{
  name: 'prefab_browse',
  description: '预制体浏览：获取预制体列表、加载预制体、查看预制体信息、验证预制体',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['get_list', 'load', 'get_info', 'validate'],
        description: '操作类型'
      },
      folder: {
        type: 'string',
        default: 'db://assets',
        description: '搜索目录（get_list 时使用）'
      },
      prefabPath: {
        type: 'string',
        description: '预制体路径'
      }
    },
    required: ['action']
  }
}
```

---

#### 4.4.2 prefab_lifecycle — 预制体生命周期

**用途**：从场景节点创建新预制体、删除预制体。

**当前实现**：`prefab-tools.ts` 中的 `create_prefab`、`duplicate_prefab`。

**整合方案**：

```typescript
{
  name: 'prefab_lifecycle',
  description: '预制体生命周期管理：从场景节点创建新预制体、复制预制体',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['create', 'duplicate'],
        description: '操作类型'
      },
      nodeUuid: {
        type: 'string',
        description: '节点UUID（create 时使用，从此节点创建预制体）'
      },
      prefabPath: {
        type: 'string',
        description: '预制体路径'
      }
    },
    required: ['action', 'prefabPath']
  }
}
```

---

#### 4.4.3 prefab_instance — 预制体实例管理

**用途**：在场景中实例化预制体、断开预制体链接、应用更改、还原预制体。

**当前实现**：`prefab-tools.ts` 中的 `instantiate_prefab`、`revert_prefab`、`restore_prefab_node`。

**整合方案**：

```typescript
{
  name: 'prefab_instance',
  description: '场景预制体实例管理：实例化预制体、断开链接、应用更改、还原',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['instantiate', 'unlink', 'apply_changes', 'revert'],
        description: '操作类型'
      },
      prefabPath: {
        type: 'string',
        description: '预制体路径（instantiate 时使用）'
      },
      parentUuid: {
        type: 'string',
        description: '父节点UUID（instantiate 时使用）'
      },
      position: {
        type: 'object',
        description: '初始位置'
      },
      nodeUuid: {
        type: 'string',
        description: '场景中的预制体实例节点UUID'
      }
    },
    required: ['action']
  }
}
```

**说明**：`unlink`（断开预制体链接）和 `apply_changes`（将实例更改应用到预制体资源）功能需要新增实现。

---

#### 4.4.4 prefab_edit — 预制体编辑

**用途**：进入预制体编辑模式、进行修改、保存、退出编辑模式。

**当前实现**：无。

**整合方案**：这是设计图中新增的工具，需要全新实现。

```typescript
{
  name: 'prefab_edit',
  description: '预制体编辑工作流：进入预制体编辑模式、修改预制体、保存更改、退出编辑模式',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['enter_edit_mode', 'save', 'exit_edit_mode'],
        description: '操作类型'
      },
      nodeUuid: {
        type: 'string',
        description: '预制体实例节点UUID（enter_edit_mode 时使用）'
      }
    },
    required: ['action']
  }
}
```

**实现要点**：

1. `enter_edit_mode`：
   - 通过 `Editor.Message.request('scene', 'enter-prefab-edit-mode', nodeUuid)` 进入预制体编辑模式
   - 编辑器会切换到预制体编辑视图，场景中只显示预制体的内容
   - 返回当前编辑状态信息

2. `save`：
   - 通过 `Editor.Message.request('scene', 'save-prefab')` 保存预制体更改
   - 在预制体编辑模式下可用
   - 保存成功后预制体资源文件将被更新

3. `exit_edit_mode`：
   - 通过 `Editor.Message.request('scene', 'exit-prefab-edit-mode')` 退出预制体编辑模式
   - 返回到正常的场景编辑视图
   - 未保存的更改将被提示

---

### 4.5 简易资源工具（asset）

#### 4.5.1 asset_manage — 资源管理

**用途**：导入资源、删除资源、保存资源元数据、生成可用URL。

**当前实现**：`asset-advanced-tools.ts` 中的 `import_asset`、`delete_asset`、`save_asset_meta`、`generate_available_url`。

**整合方案**：

```typescript
{
  name: 'asset_manage',
  description: '资源管理：导入、删除资源，保存元数据，生成可用URL',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['import', 'delete', 'save_meta', 'generate_url'],
        description: '操作类型'
      },
      assetPath: {
        type: 'string',
        description: '资源路径'
      },
      urlOrUUID: {
        type: 'string',
        description: '资源URL或UUID（save_meta 时使用）'
      },
      content: {
        type: 'string',
        description: '元数据内容（save_meta 时使用）'
      },
      url: {
        type: 'string',
        description: '资源URL（generate_url 时使用）'
      }
    },
    required: ['action']
  }
}
```

---

#### 4.5.2 asset_analyze — 资源分析

**用途**：获取资源依赖关系、获取未使用资源列表。

**当前实现**：`asset-advanced-tools.ts` 中的 `get_asset_dependencies`、`get_unused_assets`。

**整合方案**：

```typescript
{
  name: 'asset_analyze',
  description: '资源分析：获取资源依赖关系、获取未使用资源列表',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['get_dependencies', 'get_unused'],
        description: '操作类型'
      },
      assetUuid: {
        type: 'string',
        description: '资源UUID（get_dependencies 时使用）'
      },
      assetPath: {
        type: 'string',
        description: '资源路径'
      }
    },
    required: ['action']
  }
}
```

---

#### 4.5.3 asset_system — 资源系统

**用途**：检查资源数据库状态、刷新资源数据库、用外部程序打开资源。

**当前实现**：`asset-advanced-tools.ts` 中的 `query_asset_db_ready`、`refresh_asset`、`open_asset_external`。

**整合方案**：

```typescript
{
  name: 'asset_system',
  description: '资源系统：检查资源数据库状态、刷新资源数据库、用外部程序打开资源',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['check_db_ready', 'refresh', 'open_external'],
        description: '操作类型'
      },
      assetPath: {
        type: 'string',
        description: '资源路径（open_external 时使用）'
      }
    },
    required: ['action']
  }
}
```

---

#### 4.5.4 asset_query — 资源查询

**用途**：搜索资源、获取资源详情。

**当前实现**：`asset-advanced-tools.ts` 中的 `get_asset_info`、`query_assets`。

**整合方案**：

```typescript
{
  name: 'asset_query',
  description: '资源查询：搜索资源、获取资源详情',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['get_info', 'search'],
        description: '操作类型'
      },
      assetPath: {
        type: 'string',
        description: '资源路径'
      },
      pattern: {
        type: 'string',
        description: '搜索模式（如 db://assets/**/*.png）'
      }
    },
    required: ['action']
  }
}
```

---

#### 4.5.5 asset_operations — 资源操作

**用途**：创建、复制、移动、删除、保存、导入资源文件。

**当前实现**：`asset-advanced-tools.ts` 中的相关工具。

**整合方案**：

```typescript
{
  name: 'asset_operations',
  description: '资源文件操作：创建、复制、移动、删除、保存资源',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['create', 'copy', 'move', 'delete', 'save', 'import'],
        description: '操作类型'
      },
      sourcePath: {
        type: 'string',
        description: '源路径'
      },
      targetPath: {
        type: 'string',
        description: '目标路径'
      },
      content: {
        type: 'string',
        description: '文件内容（create 时使用）'
      },
      overwrite: {
        type: 'boolean',
        default: false
      }
    },
    required: ['action']
  }
}
```

---

### 4.6 项目工具（project）

#### 4.6.1 project_manage — 项目管理

**用途**：运行项目预览、构建项目、获取项目信息和设置。

**当前实现**：`project-tools.ts` 中的 `run_project`、`build_project`、`get_project_info`、`get_project_settings` 等。

**整合方案**：

```typescript
{
  name: 'project_manage',
  description: '项目管理：运行项目预览、构建项目、获取项目信息和设置',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['run', 'build', 'get_info', 'get_settings', 'set_settings'],
        description: '操作类型'
      },
      platform: {
        type: 'string',
        description: '目标平台'
      },
      debug: {
        type: 'boolean',
        default: true
      },
      settings: {
        type: 'object',
        description: '项目设置（set_settings 时使用）'
      }
    },
    required: ['action']
  }
}
```

---

#### 4.6.2 project_build_system — 项目构建系统

**用途**：控制构建面板、检查构建状态、管理预览服务器。

**当前实现**：`project-tools.ts` 中与构建面板和预览服务器相关的工具。

**整合方案**：

```typescript
{
  name: 'project_build_system',
  description: '项目构建系统：控制构建面板、检查构建状态、管理预览服务器',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: [
          'open_build_panel',
          'close_build_panel',
          'get_build_status',
          'start_preview_server',
          'stop_preview_server',
          'get_preview_status'
        ],
        description: '操作类型'
      },
      platform: {
        type: 'string',
        description: '目标平台'
      }
    },
    required: ['action']
  }
}
```

---

### 4.7 广播工具（broadcast）

#### 4.7.1 broadcast_log_management — 广播日志管理

**用途**：获取广播消息日志、按条件过滤日志、清空日志。

**当前实现**：`broadcast-tools.ts` 中的 `get_broadcast_log`、`clear_broadcast_log`。

**整合方案**：

```typescript
{
  name: 'broadcast_log_management',
  description: '广播日志管理：获取广播消息日志、按类型过滤、清空日志',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['get_log', 'clear_log'],
        description: '操作类型'
      },
      limit: {
        type: 'number',
        default: 50,
        description: '返回消息数量（get_log 时使用）'
      },
      messageType: {
        type: 'string',
        description: '按消息类型过滤'
      }
    },
    required: ['action']
  }
}
```

---

#### 4.7.2 broadcast_listener_management — 广播监听管理

**用途**：启动、停止广播监听器，获取活跃监听器列表。

**当前实现**：`broadcast-tools.ts` 中的 `listen_broadcast`、`stop_listening`、`get_active_listeners`。

**整合方案**：

```typescript
{
  name: 'broadcast_listener_management',
  description: '广播监听管理：启动、停止广播监听器，获取活跃监听器列表',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['start_listening', 'stop_listening', 'get_active_listeners'],
        description: '操作类型'
      },
      messageType: {
        type: 'string',
        description: '消息类型（start/stop_listening 时使用）'
      }
    },
    required: ['action']
  }
}
```

---

### 4.8 调试工具（debug）

#### 4.8.1 debug_console — 调试控制台

**用途**：获取编辑器控制台日志、清空控制台。

**当前实现**：`debug-tools.ts` 中的 `get_console_logs`、`clear_console`。

**整合方案**：

```typescript
{
  name: 'debug_console',
  description: '调试控制台：获取编辑器控制台日志、清空控制台',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['get_logs', 'clear'],
        description: '操作类型'
      },
      limit: {
        type: 'number',
        default: 100
      },
      filter: {
        type: 'string',
        enum: ['all', 'log', 'warn', 'error', 'info'],
        default: 'all'
      }
    },
    required: ['action']
  }
}
```

---

#### 4.8.2 debug_logs — 项目日志

**用途**：读取、搜索、分析项目日志文件。

**当前实现**：`debug-tools.ts` 中的 `get_project_logs`、`get_log_file_info`、`search_project_logs`。

**整合方案**：

```typescript
{
  name: 'debug_logs',
  description: '项目日志管理：读取日志文件、获取日志文件信息、搜索日志内容',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['get_logs', 'get_file_info', 'search'],
        description: '操作类型'
      },
      filePath: {
        type: 'string',
        description: '日志文件路径'
      },
      keyword: {
        type: 'string',
        description: '搜索关键词（search 时使用）'
      },
      lines: {
        type: 'number',
        description: '返回行数'
      }
    },
    required: ['action']
  }
}
```

---

#### 4.8.3 debug_system — 调试系统信息

**用途**：获取编辑器版本、项目详情、内存使用、性能统计。

**当前实现**：`debug-tools.ts` 中的 `get_editor_info`、`get_performance_stats`、`validate_scene`、`get_node_tree`。

**整合方案**：

```typescript
{
  name: 'debug_system',
  description: '调试系统信息：获取编辑器版本、项目详情、内存使用、性能统计、场景验证',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['get_editor_info', 'get_performance', 'validate_scene', 'get_node_tree'],
        description: '操作类型'
      },
      uuid: {
        type: 'string',
        description: '节点UUID（get_node_tree 时使用）'
      }
    },
    required: ['action']
  }
}
```

---

### 4.9 服务器工具（server）

#### 4.9.1 server_information — 服务器信息

**用途**：查询服务器IP地址列表、端口、基本状态信息。

**当前实现**：`server-tools.ts` 中的 `query_server_ip_list`、`query_sorted_server_ip_list`、`query_server_port`、`get_server_status`。

**整合方案**：

```typescript
{
  name: 'server_information',
  description: '服务器信息：查询IP地址列表、端口、基本状态',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['get_ip_list', 'get_sorted_ip_list', 'get_port', 'get_status'],
        description: '操作类型'
      }
    },
    required: ['action']
  }
}
```

---

#### 4.9.2 server_connectivity — 服务器连接

**用途**：测试服务器连接性、检查网络状态、获取网络接口信息。

**当前实现**：`server-tools.ts` 中的 `check_server_connectivity`、`get_network_interfaces`。

**整合方案**：

```typescript
{
  name: 'server_connectivity',
  description: '服务器连接：测试连接性、检查网络状态、获取网络接口信息',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['check_connectivity', 'get_network_interfaces'],
        description: '操作类型'
      }
    },
    required: ['action']
  }
}
```

---

### 4.10 偏好设置工具（preferences）

#### 4.10.1 preferences_manage — 偏好设置管理

**用途**：打开偏好设置面板、获取/设置配置、重置偏好设置。

**当前实现**：`preferences-tools.ts` 中的 `open_preferences_settings`、`query_preferences_config`、`set_preferences_config`、`reset_preferences`。

**整合方案**：

```typescript
{
  name: 'preferences_manage',
  description: '偏好设置管理：打开设置面板、获取/设置配置、重置偏好设置',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['open_panel', 'get_config', 'set_config', 'reset'],
        description: '操作类型'
      },
      tab: {
        type: 'string',
        enum: ['general', 'external-tools', 'data-editor', 'laboratory', 'extensions'],
        description: '设置标签页'
      },
      name: {
        type: 'string',
        description: '配置项名称'
      },
      value: {
        description: '配置值'
      }
    },
    required: ['action']
  }
}
```

---

#### 4.10.2 preferences_query — 偏好设置查询

**用途**：获取所有偏好设置、列出分类、搜索偏好设置。

**当前实现**：`preferences-tools.ts` 中的 `get_all_preferences`。

**整合方案**：

```typescript
{
  name: 'preferences_query',
  description: '偏好设置查询：获取所有偏好设置、列出分类、搜索偏好设置',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['get_all', 'list_categories', 'search'],
        description: '操作类型'
      },
      keyword: {
        type: 'string',
        description: '搜索关键词（search 时使用）'
      }
    },
    required: ['action']
  }
}
```

**说明**：`list_categories` 和 `search` 功能需新增实现。`list_categories` 可从 `get_all_preferences` 的返回结果中提取分类列表。`search` 可通过遍历偏好设置并匹配关键词实现。

---

#### 4.10.3 preferences_backup — 偏好设置备份

**用途**：导出和导入偏好设置。

**当前实现**：`preferences-tools.ts` 中的 `export_preferences`、`import_preferences`。

**整合方案**：

```typescript
{
  name: 'preferences_backup',
  description: '偏好设置备份：导出和导入偏好设置',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['export', 'import'],
        description: '操作类型'
      },
      filePath: {
        type: 'string',
        description: '文件路径'
      }
    },
    required: ['action']
  }
}
```

---

### 4.11 参考图片工具（reference_image）

#### 4.11.1 reference_image_management — 参考图片管理

**用途**：添加、移除、切换、清空参考图片。

**当前实现**：`reference-image-tools.ts` 中的 `add_reference_image`、`remove_reference_image`、`switch_reference_image`、`clear_all_reference_images`。

**整合方案**：

```typescript
{
  name: 'reference_image_management',
  description: '参考图片管理：添加、移除、切换、清空参考图片',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['add', 'remove', 'switch', 'clear_all'],
        description: '操作类型'
      },
      paths: {
        type: 'array',
        items: { type: 'string' },
        description: '图片路径数组（add 时使用）'
      },
      index: {
        type: 'number',
        description: '图片索引（switch/remove 时使用）'
      }
    },
    required: ['action']
  }
}
```

---

#### 4.11.2 reference_image_query — 参考图片查询

**用途**：获取参考图片配置、获取当前图片数据、列出可用参考图片。

**当前实现**：`reference-image-tools.ts` 中的 `query_reference_image_config`、`query_current_reference_image`、`list_reference_images`。

**整合方案**：

```typescript
{
  name: 'reference_image_query',
  description: '参考图片查询：获取配置、当前图片数据、列出可用参考图片',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['get_config', 'get_current', 'list'],
        description: '操作类型'
      }
    },
    required: ['action']
  }
}
```

---

#### 4.11.3 reference_image_transform — 参考图片变换

**用途**：设置参考图片的位置、缩放、透明度等变换属性。

**当前实现**：`reference-image-tools.ts` 中的 `set_reference_image_position`、`set_reference_image_scale`、`set_reference_image_opacity`。

**整合方案**：

```typescript
{
  name: 'reference_image_transform',
  description: '参考图片变换：设置位置、缩放、透明度等变换属性',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['set_position', 'set_scale', 'set_opacity'],
        description: '操作类型'
      },
      x: {
        type: 'number',
        description: 'X坐标/水平缩放'
      },
      y: {
        type: 'number',
        description: 'Y坐标/垂直缩放/透明度'
      }
    },
    required: ['action']
  }
}
```

---

#### 4.11.4 reference_image_display — 参考图片显示

**用途**：刷新参考图片显示、管理可见性。

**当前实现**：`reference-image-tools.ts` 中的 `refresh_reference_image`、`set_reference_image_data`。

**整合方案**：

```typescript
{
  name: 'reference_image_display',
  description: '参考图片显示：刷新显示、设置图片数据',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['refresh', 'set_data'],
        description: '操作类型'
      },
      data: {
        type: 'object',
        description: '图片数据（set_data 时使用）'
      }
    },
    required: ['action']
  }
}
```

---

### 4.12 场景视图工具（scene_view）

#### 4.12.1 scene_view_gizmo_management — Gizmo 管理

**用途**：更改 Gizmo 类型（移动/旋转/缩放）、切换轴心、坐标系、视图对齐模式。

**当前实现**：`scene-view-tools.ts` 中的 `change_gizmo_tool`、`query_gizmo_tool_name`、`change_gizmo_pivot`、`change_gizmo_coordinate`、`change_align_with_view`。

**整合方案**：

```typescript
{
  name: 'scene_view_gizmo_management',
  description: 'Gizmo管理：更改工具类型、轴心点、坐标系、视图对齐模式',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: [
          'set_tool', 'get_tool_name',
          'set_pivot', 'set_coordinate',
          'set_align_with_view'
        ],
        description: '操作类型'
      },
      name: {
        type: 'string',
        enum: ['position', 'rotation', 'scale', 'rect'],
        description: 'Gizmo工具名称'
      }
    },
    required: ['action']
  }
}
```

---

#### 4.12.2 scene_view_mode_control — 视图模式控制

**用途**：切换 2D/3D 视图模式、管理网格显示。

**当前实现**：`scene-view-tools.ts` 中相关的 2D/3D 切换和网格控制工具。

**整合方案**：

```typescript
{
  name: 'scene_view_mode_control',
  description: '视图模式控制：切换2D/3D视图、管理网格显示',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['switch_2d_3d', 'set_grid_visible', 'get_view_mode'],
        description: '操作类型'
      },
      visible: {
        type: 'boolean',
        description: '是否可见（set_grid_visible 时使用）'
      }
    },
    required: ['action']
  }
}
```

---

#### 4.12.3 scene_view_icon_gizmo — IconGizmo 管理

**用途**：设置 IconGizmo 的 3D/2D 模式、调整大小。

**当前实现**：`scene-view-tools.ts` 中的 `set_icon_gizmo_3d_mode`、`set_icon_gizmo_2d_mode`、`set_icon_gizmo_size`。

**整合方案**：

```typescript
{
  name: 'scene_view_icon_gizmo',
  description: 'IconGizmo管理：设置3D/2D模式、调整大小',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['set_3d_mode', 'set_2d_mode', 'set_size'],
        description: '操作类型'
      },
      size: {
        type: 'number',
        description: 'IconGizmo大小（set_size 时使用）'
      }
    },
    required: ['action']
  }
}
```

---

#### 4.12.4 scene_view_camera_control — 相机控制

**用途**：聚焦相机到指定节点、对齐相机、对齐视图。

**当前实现**：`scene-view-tools.ts` 中的 `focus_camera`、`align_camera`、`align_view`。

**整合方案**：

```typescript
{
  name: 'scene_view_camera_control',
  description: '相机控制：聚焦相机到节点、对齐相机、对齐视图',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['focus', 'align_camera', 'align_view'],
        description: '操作类型'
      },
      uuid: {
        type: 'string',
        description: '目标节点UUID（focus/align_camera 时使用）'
      }
    },
    required: ['action']
  }
}
```

---

#### 4.12.5 scene_view_status_management — 场景视图状态

**用途**：获取场景视图综合状态信息、重置视图为默认状态。

**当前实现**：`scene-view-tools.ts` 中的 `get_scene_view_status`、`reset_scene_view_default`。

**整合方案**：

```typescript
{
  name: 'scene_view_status_management',
  description: '场景视图状态：获取综合状态信息、重置视图为默认状态',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['get_status', 'reset_default'],
        description: '操作类型'
      }
    },
    required: ['action']
  }
}
```

---

### 4.13 验证工具（validate）

#### 4.13.1 验证工具（保持不变）

**用途**：验证和修复 JSON 参数、创建安全字符串值、格式化 MCP 请求。

**当前实现**：`validation-tools.ts` 中的 `validate_json_params`、`safe_string_value`、`format_mcp_request`。

**整合方案**：验证工具设计为通用辅助工具，保持不变，无需合并。

```typescript
// validate_json_params - 验证并修复JSON参数
{
  name: 'validate_json_params',
  description: '验证和修复JSON参数，在发送给其他工具之前使用',
  inputSchema: {
    type: 'object',
    properties: {
      jsonString: { type: 'string', description: 'JSON字符串' },
      expectedSchema: { type: 'object', description: '期望的参数schema' }
    },
    required: ['jsonString']
  }
}

// safe_string_value - 创建安全字符串值
{
  name: 'safe_string_value',
  description: '创建不会导致JSON解析问题的安全字符串值',
  inputSchema: {
    type: 'object',
    properties: {
      value: { type: 'string', description: '原始字符串值' }
    },
    required: ['value']
  }
}

// format_mcp_request - 格式化MCP请求
{
  name: 'format_mcp_request',
  description: '格式化完整的MCP请求',
  inputSchema: {
    type: 'object',
    properties: {
      toolName: { type: 'string', description: '工具名称' },
      args: { description: '工具参数' }
    },
    required: ['toolName']
  }
}
```

---

## 5. 新增工具清单

以下是设计图中要求但当前实现中完全缺失的功能，需要在整合过程中新增实现：

| 序号 | 工具名 | 所属模块 | 功能描述 | 优先级 |
|------|--------|---------|---------|--------|
| 1 | `configure_click_event` | 组件工具 | 为 Button 组件配置或移除点击事件回调 | P1 - 高 |
| 2 | `prefab_edit` | 预制体工具 | 进入/保存/退出预制体编辑模式 | P1 - 高 |

### 5.1 configure_click_event 实现细节

**依赖的编辑器 API**：
- `Editor.Message.request('scene', 'query-node', uuid)` - 查询节点信息
- `Editor.Message.request('scene', 'set-property', {...})` - 设置属性

**实现步骤**：

1. 接收 `action="set"` 请求
2. 查询源节点，验证存在 `cc.Button` 组件
3. 查询目标节点，验证存在指定的脚本组件
4. 构建点击事件数据结构：
   ```json
   [{
     "target": { "__uuid__": "target-node-uuid" },
     "component": "ScriptComponentName",
     "handler": "onButtonClick",
     "customEventData": ""
   }]
   ```
5. 通过 `set-property` 设置 Button 组件的 `_clickEvents` 属性
6. 验证设置结果

### 5.2 prefab_edit 实现细节

**依赖的编辑器 API**：
- `Editor.Message.request('scene', 'enter-prefab-edit-mode', nodeUuid)` - 进入编辑模式
- `Editor.Message.request('scene', 'save-prefab')` - 保存预制体
- `Editor.Message.request('scene', 'exit-prefab-edit-mode')` - 退出编辑模式

**实现步骤**：

1. `enter_edit_mode`：
   - 验证目标节点是预制体实例
   - 调用编辑器 API 进入预制体编辑模式
   - 返回编辑状态信息

2. `save`：
   - 验证当前处于预制体编辑模式
   - 调用编辑器 API 保存预制体
   - 返回保存结果

3. `exit_edit_mode`：
   - 检查是否有未保存的更改
   - 调用编辑器 API 退出预制体编辑模式
   - 返回退出状态

---

## 6. 实施计划

### 6.1 阶段一：基础架构重构（优先级：P0）

**目标**：建立分组工具的统一架构。

| 任务 | 说明 | 预估工时 |
|------|------|---------|
| 1.1 定义 GroupedToolExecutor 接口 | 创建支持 action 分发的工具执行器基类 | 2h |
| 1.2 实现工具注册适配器 | 让分组工具兼容现有的 ToolManager 注册机制 | 3h |
| 1.3 实现向后兼容层 | 保留旧工具名作为别名，自动映射到新的分组工具 | 2h |
| 1.4 编写分组工具单元测试框架 | 为分组工具编写基础测试工具和断言方法 | 2h |

### 6.2 阶段二：核心模块整合（优先级：P1）

**目标**：整合使用频率最高的工具模块。

| 任务 | 说明 | 预估工时 |
|------|------|---------|
| 2.1 整合场景工具（5个分组） | scene_management, scene_hierarchy, scene_execution_control, scene_state_management, scene_query_system | 4h |
| 2.2 整合节点工具（7个分组） | node_query, node_lifecycle, node_transform, node_hierarchy, node_clipboard, node_property_management, node_array_management | 5h |
| 2.3 整合组件工具（5个分组） | component_manage, component_script, component_query, set_component_property, configure_click_event | 4h |
| 2.4 整合预制体工具（4个分组） | prefab_browse, prefab_lifecycle, prefab_instance, prefab_edit | 4h |
| 2.5 新增 configure_click_event | 实现 Button 点击事件配置功能 | 3h |
| 2.6 新增 prefab_edit | 实现预制体编辑模式功能 | 3h |

### 6.3 阶段三：辅助模块整合（优先级：P2）

**目标**：整合辅助性工具模块。

| 任务 | 说明 | 预估工时 |
|------|------|---------|
| 3.1 整合资源工具（5个分组） | asset_manage, asset_analyze, asset_system, asset_query, asset_operations | 4h |
| 3.2 整合项目工具（2个分组） | project_manage, project_build_system | 3h |
| 3.3 整合广播工具（2个分组） | broadcast_log_management, broadcast_listener_management | 1h |

### 6.4 阶段四：系统模块整合（优先级：P2）

**目标**：整合系统级工具模块。

| 任务 | 说明 | 预估工时 |
|------|------|---------|
| 4.1 整合调试工具（3个分组） | debug_console, debug_logs, debug_system | 2h |
| 4.2 整合服务器工具（2个分组） | server_information, server_connectivity | 1h |
| 4.3 整合偏好设置工具（3个分组） | preferences_manage, preferences_query, preferences_backup | 2h |

### 6.5 阶段五：编辑器模块整合（优先级：P3）

**目标**：整合编辑器界面相关工具模块。

| 任务 | 说明 | 预估工时 |
|------|------|---------|
| 5.1 整合参考图片工具（4个分组） | reference_image_management, reference_image_query, reference_image_transform, reference_image_display | 2h |
| 5.2 整合场景视图工具（5个分组） | scene_view_gizmo_management, scene_view_mode_control, scene_view_icon_gizmo, scene_view_camera_control, scene_view_status_management | 3h |

### 6.6 阶段六：验证与发布（优先级：P1）

**目标**：确保整合后的工具集功能完整、质量可靠。

| 任务 | 说明 | 预估工时 |
|------|------|---------|
| 6.1 全量回归测试 | 对所有 55 个分组工具进行功能回归测试 | 4h |
| 6.2 LLM 集成测试 | 验证 LLM 能否正确选择和调用分组工具 | 3h |
| 6.3 文档更新 | 更新 README 和使用文档 | 2h |
| 6.4 版本发布 | 发布 v2.0 版本 | 1h |

### 6.7 工时汇总

| 阶段 | 优先级 | 预估工时 |
|------|--------|---------|
| 阶段一：基础架构重构 | P0 | 9h |
| 阶段二：核心模块整合 | P1 | 23h |
| 阶段三：辅助模块整合 | P2 | 8h |
| 阶段四：系统模块整合 | P2 | 5h |
| 阶段五：编辑器模块整合 | P3 | 5h |
| 阶段六：验证与发布 | P1 | 10h |
| **合计** | | **60h** |

### 6.8 文件结构变更预览

整合后的文件结构：

```
source/tools/
├── types.ts                          # 类型定义（新增 GroupedToolDefinition）
├── tool-manager.ts                   # 工具管理器（重构注册逻辑）
├── grouped-tool-base.ts              # 分组工具基类（新增）
├── scene/
│   ├── scene-management.ts           # 场景管理（合并自 scene-tools.ts）
│   ├── scene-hierarchy.ts            # 场景层级
│   ├── scene-execution-control.ts    # 场景执行控制（合并自 scene-advanced-tools.ts）
│   ├── scene-state-management.ts     # 场景状态管理
│   └── scene-query-system.ts         # 场景查询系统
├── node/
│   ├── node-query.ts                 # 节点查询
│   ├── node-lifecycle.ts             # 节点生命周期
│   ├── node-transform.ts             # 节点变换
│   ├── node-hierarchy.ts             # 节点层级操作
│   ├── node-clipboard.ts             # 节点剪贴板
│   ├── node-property-management.ts   # 节点属性重置
│   └── node-array-management.ts      # 节点数组管理
├── component/
│   ├── component-manage.ts           # 组件管理
│   ├── component-script.ts           # 脚本组件管理
│   ├── component-query.ts            # 组件查询
│   ├── set-component-property.ts     # 设置组件属性
│   └── configure-click-event.ts      # 配置点击事件（新增）
├── prefab/
│   ├── prefab-browse.ts              # 预制体浏览
│   ├── prefab-lifecycle.ts           # 预制体生命周期
│   ├── prefab-instance.ts            # 预制体实例管理
│   └── prefab-edit.ts                # 预制体编辑（新增）
├── asset/
│   ├── asset-manage.ts               # 资源管理
│   ├── asset-analyze.ts              # 资源分析
│   ├── asset-system.ts               # 资源系统
│   ├── asset-query.ts                # 资源查询
│   └── asset-operations.ts           # 资源操作
├── project/
│   ├── project-manage.ts             # 项目管理
│   └── project-build-system.ts       # 项目构建系统
├── broadcast/
│   ├── broadcast-log-management.ts    # 广播日志管理
│   └── broadcast-listener-management.ts # 广播监听管理
├── debug/
│   ├── debug-console.ts              # 调试控制台
│   ├── debug-logs.ts                 # 项目日志
│   └── debug-system.ts               # 调试系统信息
├── server/
│   ├── server-information.ts         # 服务器信息
│   └── server-connectivity.ts        # 服务器连接
├── preferences/
│   ├── preferences-manage.ts         # 偏好设置管理
│   ├── preferences-query.ts          # 偏好设置查询
│   └── preferences-backup.ts         # 偏好设置备份
├── reference-image/
│   ├── reference-image-management.ts # 参考图片管理
│   ├── reference-image-query.ts      # 参考图片查询
│   ├── reference-image-transform.ts  # 参考图片变换
│   └── reference-image-display.ts    # 参考图片显示
├── scene-view/
│   ├── scene-view-gizmo-management.ts # Gizmo管理
│   ├── scene-view-mode-control.ts    # 视图模式控制
│   ├── scene-view-icon-gizmo.ts      # IconGizmo管理
│   ├── scene-view-camera-control.ts  # 相机控制
│   └── scene-view-status-management.ts # 场景视图状态
└── validation/
    ├── validate-json-params.ts       # 验证JSON参数
    ├── safe-string-value.ts          # 安全字符串值
    └── format-mcp-request.ts         # 格式化MCP请求
```

---

## 附录 A：分组工具 inputSchema 通用模式

所有分组工具遵循统一的 inputSchema 设计模式：

```typescript
// 模式一：带 action 的分组工具（大部分情况）
interface GroupedToolSchema {
  type: 'object';
  properties: {
    action: {
      type: 'string';
      enum: ['action1', 'action2', ...];
      description: '操作类型';
    };
    // 各 action 需要的参数，根据 action 动态验证
  };
  required: ['action'];
}

// 模式二：无 action 的单一功能工具（少数情况）
interface SingleToolSchema {
  type: 'object';
  properties: {
    // 工具特定的参数
  };
  required: ['...'];
}
```

## 附录 B：向后兼容策略

为降低迁移风险，采用以下向后兼容策略：

1. **别名映射**：在 ToolManager 中注册旧工具名到新分组工具的别名映射
2. **参数转换**：将旧工具的参数自动转换为分组工具的 `{action, ...params}` 格式
3. **过渡期**：保留旧工具实现至少一个版本周期，并在日志中输出弃用警告
4. **文档引导**：在工具 description 中添加迁移提示

示例别名映射：

```typescript
const toolAliases: Record<string, { groupedTool: string; action: string }> = {
  'create_node': { groupedTool: 'node_lifecycle', action: 'create' },
  'delete_node': { groupedTool: 'node_lifecycle', action: 'delete' },
  'get_node_info': { groupedTool: 'node_query', action: 'get_info' },
  'find_nodes': { groupedTool: 'node_query', action: 'find' },
  'add_component': { groupedTool: 'component_manage', action: 'add' },
  'remove_component': { groupedTool: 'component_manage', action: 'remove' },
  // ... 更多别名
};
```
