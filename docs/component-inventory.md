# Cherry Studio 组件清单

**日期：** 2026-05-29

## 1. 组件版图

Cherry Studio 的 UI 组件主要分布在两层：

- `src/renderer/components/`：应用直接使用的业务共享组件
- `packages/ui/src/components/`：设计系统级组件库

当前更推荐把新通用组件沉淀到 `packages/ui`，而不是继续扩展 `src/renderer/components`。

## 2. 渲染层共享组件目录

`src/renderer/components/` 当前规模较大，包含 300+ 文件，已经形成若干稳定簇。

### 内容与富文本相关

- `CodeBlockView/`
- `CodeEditor/`
- `CodeToolbar/`
- `CodeViewer.tsx`
- `MarkdownEditor/`
- `MarkdownShadowDomRenderer.tsx`
- `RichEditor/`

这些组件服务于聊天内容展示、代码块渲染、富文本编辑和内容操作。

### 布局与导航相关

- `layout/`
- `Sidebar/`
- `TopView/`
- `WindowControls/`
- `QuickPanel/`
- `HorizontalScrollContainer/`

这些组件更接近应用壳层与多区域布局。

### 选择器与资源配置相关

- `ModelSelector/`
- `ModelSelectorLegacy.tsx`
- `ProviderLogoPicker/`
- `ResourceSelector/`
- `LanguageSelect.tsx`
- `Selector.tsx`

这些组件在设置页、模型选择、资源配置和 provider 管理中反复出现。

### 内容展示与交互辅助

- `Avatar/`
- `Preview/`
- `ImageViewer.tsx`
- `ExpandableText.tsx`
- `HighlightText.tsx`
- `Spinner.tsx`
- `IndicatorLight.tsx`
- `Skeleton/`

### 操作型组件

- `Buttons/`
- `CopyButton.tsx`
- `TranslateButton.tsx`
- `AddButton.tsx`
- `SelectionContextMenu.tsx`
- `ActionTools/`

### 领域型组件

- `MiniApp/`
- `Oauth/`
- `Tags/`
- `Popups/`
- `LocalBackupManager.tsx`
- `WebdavBackupManager.tsx`
- `S3BackupManager.tsx`

这些已经明显带有业务属性，更适合作为应用层组件，而不是设计系统通用原子。

## 3. 页面域与组件消费关系

`src/renderer/pages/` 的页面域包括：

- `agents`
- `files`
- `history`
- `home`
- `knowledge`
- `launchpad`
- `library`
- `mini-apps`
- `notes`
- `openclaw`
- `paintings`
- `settings`
- `store`
- `translate`

这些页面域共同消费 `components/`、`store/` 和 `data/`，因此 `components/` 中的很多组件已经天然承担“应用共享层”的角色。

## 4. `@cherrystudio/ui` 组件库

`packages/ui/src/components/` 按设计系统语义分层：

- `primitives/`：基础原子组件
- `composites/`：复合组件
- `icons/`：图标运行时导出与目录
- `index.ts`：统一导出

包内还提供：

- `hooks/`
- `lib/`
- `styles/`
- `utils/`

从 README 看，这个包已经不仅是组件集合，还包含：

- 设计 token
- Tailwind theme contract
- icon 生成流水线
- Storybook 资产

## 5. 组件栈现状判断

### 稳定方向

- 新通用组件：优先进入 `packages/ui`
- 应用业务共享组件：仍可放 `src/renderer/components`
- 页面局部组件：应尽量就近放在页面/窗口域内

### 现存技术债

- UI 栈仍有 `antd` 与 `@cherrystudio/ui` 共存
- 某些 `renderer/components` 目录已经同时混合了设计系统组件和业务组件
- `ModelSelectorLegacy.tsx` 之类命名说明迁移尚未完全结束

## 6. 适合复用的高价值组件簇

### 编辑与代码展示

这是 Cherry Studio 的核心使用场景，建议优先复用：

- `CodeBlockView`
- `CodeViewer`
- `MarkdownEditor`
- `RichEditor`

### 模型/Provider 配置

- `ModelSelector`
- `ProviderLogoPicker`
- `ProviderAvatar`
- `ModelTagsWithLabel`

### 交互壳层

- `layout`
- `Sidebar`
- `WindowControls`
- `QuickPanel`

### 备份与存储配置

- `LocalBackupManager`
- `WebdavBackupManager`
- `S3BackupManager`

这些组件往往隐含主进程 API、配置结构和业务流程，复用前应先读实现。

## 7. 设计系统相关资源

`packages/ui` 除运行时代码外，还包含：

- `.storybook/`
- `stories/`
- `scripts/`
- `icons/`
- `docs/`

这些目录不属于应用直接运行时 API，但对设计系统维护很关键。

## 8. 开发建议

- 做新页面时，先查 `packages/ui` 是否已有基础组件
- 做新业务面板时，优先复用 `src/renderer/components` 里的领域组件
- 若发现通用模式重复出现，应考虑从 `renderer/components` 提炼到 `packages/ui`
- 所有新 UI 都应遵守 `DESIGN.md` 与 `CLAUDE.md` 中的技术路线

---

这份清单不追求逐个文件列名，而是帮助你先判断：某个 UI 需求应该落在“设计系统层、应用共享组件层，还是页面局部组件层”。
