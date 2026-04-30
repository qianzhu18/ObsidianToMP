# ObsidianToMP AI 自测生产级测试集

更新时间：2026-04-30  
用途：开源发布前，给 Codex / Claude Code / 其他 AI Agent 执行完整自测。  
结论口径：本文件通过前，不进入正式 release；只允许标记为 `rc` 或 `stabilization`。

## 0. 测试原则

1. 先测闭环，再测美化。核心闭环是：安装插件 -> 打开工作台 -> 渲染预览 -> 复制排版 -> 图片处理 -> 可选保存公众号草稿 -> 写回 Agent 队列结果。
2. 主题不是装饰项。主题会影响公众号复制后的真实可用性，必须作为 P1 发布门槛。
3. AI 不能只凭肉眼说“看起来可以”。每个关键测试必须留下证据：命令输出、截图、剪贴板落地 HTML、结果 JSON、或错误日志。
4. 不在默认测试中提交真实公众号草稿。涉及 AppSecret、图床 Secret、公众号接口写入时，必须由用户确认后才执行。
5. Issue 暂时不拆也可以，但测试失败必须记录为 `FAIL`，并写清楚可复现步骤。后续准备开源时，再把未关闭的 P0/P1 FAIL 批量转成 GitHub Issues。

## 1. 发布门槛

### 1.1 硬门槛

- P0 失败数必须为 `0`。
- P1 失败数必须为 `0`，除非明确降级为“不在本版本支持”并写进 README。
- Smoke 测试必须 `100% PASS`。
- 核心回归测试通过率必须 >= `98%`。
- 全量测试通过率必须 >= `95%`。
- 主题矩阵必须全部跑完，不能只抽样。
- README、Release 资产、插件 manifest 版本必须一致。

### 1.2 P0 定义

- 插件无法安装或启用。
- Obsidian 启动崩溃或插件加载崩溃。
- 拖动布局、切换笔记、重启后核心工作台不可用。
- 复制提示成功但核心内容丢失，例如本地图片无法用且没有明确错误。
- 保存草稿误发布、泄露密钥、写坏用户笔记。
- Agent 队列写错文件、覆盖用户数据、返回假成功。

### 1.3 P1 定义

- 主题存在但选择后白屏、明显错位、不能恢复。
- 复制到公众号/本地 HTML 后主要结构丢失：标题、列表、表格、代码块、图片。
- 图床配置错误提示不清楚，用户无法自行修复。
- 文档指引和线上版本不一致。
- Release 包缺文件或资源包不完整。

## 2. 测试环境

### 2.1 必备环境

- macOS：当前主测环境。
- Obsidian：记录版本号。
- Node.js：记录版本号。
- npm registry：记录 `npm config get registry`。
- 网络：至少测 GitHub 可访问与 GitHub 不可访问两种状态。

### 2.2 测试 Vault

AI 至少准备 4 个 Vault：

| Vault | 用途 | 特征 |
| --- | --- | --- |
| `vault-clean` | 新用户首次安装 | 无插件、无设置、无主题资源 |
| `vault-content` | 内容渲染回归 | 含复杂 Markdown、图片、表格、代码、Callout |
| `vault-broken-assets` | 资源修复 | 故意删 `assets.zip` 解出的部分文件 |
| `vault-agent` | Agent 队列 | 含 `content/.obsidiantomp/publish-request.json` |

### 2.3 样稿集合

至少准备 12 篇样稿：

| 样稿 ID | 文件名 | 覆盖点 |
| --- | --- | --- |
| MD-01 | `基础长文.md` | 标题、段落、加粗、斜体、分割线 |
| MD-02 | `列表密集.md` | 有序列表、无序列表、嵌套列表、任务列表 |
| MD-03 | `表格文章.md` | 宽表格、中文表格、长英文单元格 |
| MD-04 | `代码文章.md` | ts/js/python/bash/json 代码块、行内代码 |
| MD-05 | `Callout文章.md` | NOTE/TIP/WARNING/QUOTE |
| MD-06 | `图片文章.md` | 本地 png/jpg/webp/gif/svg、重复图片 |
| MD-07 | `在线图片文章.md` | http/https、失效链接、带 query 的图片 URL |
| MD-08 | `双链嵌入.md` | Obsidian 双链、块引用、嵌入块 |
| MD-09 | `脚注数学.md` | 脚注、LaTeX、特殊符号 |
| MD-10 | `超长内容.md` | 3000+ 字、长段落、长 URL |
| MD-11 | `Frontmatter控制.md` | 标题、作者、摘要、公众号、主题、封面 |
| MD-12 | `异常输入.md` | 缺文件图片、坏 frontmatter、空文档 |

## 3. AI 执行流程

每次自测按这个顺序执行：

1. `PRE`：环境与仓库检查。
2. `BLD`：构建与静态完整性检查。
3. `INS`：安装、启用、更新、卸载。
4. `UI`：工作台、布局、拖拽、重启恢复。
5. `MD`：Markdown 渲染。
6. `TME`：主题与代码高亮全量矩阵。
7. `CPY`：复制与剪贴板落地。
8. `IMG`：图片与图床。
9. `WX`：公众号配置与草稿箱，默认只跑负向和 mock，真实接口需用户确认。
10. `AGT`：Agent 队列。
11. `REL`：Release、README、安装文档。
12. `RPT`：生成测试报告。

## 4. Smoke 测试集

Smoke 必须每次改代码后跑完。

| ID | 优先级 | 用例 | 步骤 | 期望 |
| --- | --- | --- | --- | --- |
| SMK-001 | P0 | Fresh clone | 从 GitHub fresh clone | 仓库可拉取，默认分支正确 |
| SMK-002 | P0 | 安装依赖 | `cd plugin && npm install` | 无失败 |
| SMK-003 | P0 | 构建 | `npm run build` | `main.js/styles.css` 生成 |
| SMK-004 | P0 | manifest 合法 | 读取根目录和 plugin manifest | id、name、version 一致 |
| SMK-005 | P0 | Release zip 结构 | 解压安装包 | 只有 `main.js/styles.css/manifest.json` 三件套 |
| SMK-006 | P0 | assets.zip 结构 | 解压资源包 | 有 `lib.wasm/themes.json/highlights.json/themes/highlights` |
| SMK-007 | P0 | 干净 Vault 安装 | zip 安装到 `.obsidian/plugins/obsidian-to-mp` | Obsidian 能识别插件 |
| SMK-008 | P0 | 插件启用 | 启用插件并重启 Obsidian | 无启动错误 |
| SMK-009 | P0 | 命令注册 | 搜索 ObsidianToMP 命令 | 工作台、初始化、队列保存命令存在 |
| SMK-010 | P0 | 打开工作台 | 打开任一 Markdown 后打开工作台 | 预览非白屏 |
| SMK-011 | P0 | 基础渲染 | 打开 `基础长文.md` | 标题、正文、列表可见 |
| SMK-012 | P0 | 复制按钮 | 点击复制排版 | 成功或给出明确错误，不允许假成功 |
| SMK-013 | P0 | 无公众号保存草稿 | 未配置公众号点击保存草稿 | 明确提示先配置公众号 |
| SMK-014 | P0 | 主题菜单 | 打开主题菜单 | 至少显示默认主题和外部主题 |
| SMK-015 | P0 | 切换主题 | 切换 1 个 MWeb + 1 个 Raphael | 预览立即变化且不白屏 |
| SMK-016 | P0 | 设备切换 | 手机/平板/桌面切换 | 宽度变化合理，无内容消失 |
| SMK-017 | P0 | 布局拖拽 | 拖动 Obsidian 左右分栏后切回手机 | 比例恢复，不漂移 |
| SMK-018 | P0 | 初始化工作流 | 执行初始化命令 | 创建 content 目录和模板 |
| SMK-019 | P0 | 队列缺配置 | 有请求文件但无公众号配置 | result 写入 error，不假成功 |
| SMK-020 | P0 | 重启恢复 | 关闭重开 Obsidian | 插件仍可用，工作台可再打开 |

## 5. 完整测试矩阵

### 5.1 PRE 环境与仓库

| ID | 优先级 | 用例 | 期望 |
| --- | --- | --- | --- |
| PRE-001 | P0 | 当前工作区 git 状态记录 | 报告中列出 dirty 文件，不误删用户改动 |
| PRE-002 | P0 | fresh clone 测试 | clone 到临时目录，不污染当前工作区 |
| PRE-003 | P1 | Node 版本记录 | 报告中记录 Node/npm 版本 |
| PRE-004 | P1 | npm registry 记录 | 报告中记录 registry，audit 不可用时说明 |
| PRE-005 | P1 | Obsidian CLI 可用性 | 可用则记录版本，不可用则走 GUI 测试 |
| PRE-006 | P1 | 测试 Vault 路径记录 | 报告中列出 4 个测试 Vault 绝对路径 |
| PRE-007 | P1 | 网络状态记录 | GitHub latest release 可访问 |
| PRE-008 | P2 | 离线状态准备 | 模拟 GitHub 不可访问，已有资源不应损坏 |

### 5.2 BLD 构建与静态完整性

| ID | 优先级 | 用例 | 期望 |
| --- | --- | --- | --- |
| BLD-001 | P0 | `npm install` | 无失败 |
| BLD-002 | P0 | `npm run build` | TypeScript 和 esbuild 通过 |
| BLD-003 | P0 | `npm run build:release` | 同步根目录产物 |
| BLD-004 | P0 | manifest 版本一致 | 根目录、plugin、release 三处一致 |
| BLD-005 | P0 | versions.json 合法 | 包含当前版本，minAppVersion 合理 |
| BLD-006 | P1 | package-lock 同步 | install 后无非预期 lockfile 改动 |
| BLD-007 | P1 | main.js 非空 | 文件大小合理，包含命令 ID |
| BLD-008 | P1 | styles.css 非空 | 包含工作台关键样式 |
| BLD-009 | P1 | release zip 文件名 | `obsidian-to-mp-vX.Y.Z.zip` 与版本一致 |
| BLD-010 | P1 | release zip 内容 | 不包含源码、node_modules、隐藏文件 |
| BLD-011 | P1 | assets.zip 内容 | 主题/高亮/wasm 数量与配置一致 |
| BLD-012 | P1 | 主题配置唯一性 | className 不重复 |
| BLD-013 | P1 | 高亮配置唯一性 | name 不重复 |
| BLD-014 | P1 | 资源路径安全 | zip 内没有 `../` 逃逸路径 |
| BLD-015 | P2 | bundle 搜索敏感词 | 不包含明文测试 Secret |

### 5.3 INS 安装、启用、更新

| ID | 优先级 | 用例 | 期望 |
| --- | --- | --- | --- |
| INS-001 | P0 | Release zip 手动安装 | Obsidian 可识别并启用 |
| INS-002 | P0 | BRAT 安装路径文档验证 | README 步骤足够清晰 |
| INS-003 | P0 | 源码 symlink 安装 | 开发者路径可启用 |
| INS-004 | P0 | 首次启用 | 不崩溃，不出现注册重复 view 错误 |
| INS-005 | P1 | 禁用再启用 | 设置不丢，命令恢复 |
| INS-006 | P1 | 卸载重装 | 无旧资源污染导致启动失败 |
| INS-007 | P1 | 从旧版升级 | v1.0.5/v1.0.6 到当前版本设置兼容 |
| INS-008 | P1 | 降级提示 | 若降级不支持，要有可理解说明 |
| INS-009 | P1 | 多 Vault 安装 | A Vault 启用不影响 B Vault |
| INS-010 | P1 | Restricted mode | 第三方插件开关关闭时说明清楚 |
| INS-011 | P2 | 路径含中文/空格 | 插件安装与资源读取正常 |
| INS-012 | P2 | Windows 风格路径 | 文档路径说明正确 |

### 5.4 UI 工作台与布局稳定性

| ID | 优先级 | 用例 | 期望 |
| --- | --- | --- | --- |
| UI-001 | P0 | 打开工作台 | 非白屏，显示工具栏和预览 |
| UI-002 | P0 | 拖动左右分栏 | 手机/平板/桌面比例可恢复 |
| UI-003 | P0 | 极窄宽度 | 按钮不挤出不可用区域，预览不消失 |
| UI-004 | P0 | 极宽宽度 | 桌面预览不无限拉伸导致不可读 |
| UI-005 | P0 | 重复打开工作台 | 不注册重复 view，不崩溃 |
| UI-006 | P1 | 关闭再打开工作台 | 状态恢复合理 |
| UI-007 | P1 | 切换笔记 | 预览跟随当前笔记更新 |
| UI-008 | P1 | 修改笔记内容 | 预览刷新，不需要重启 |
| UI-009 | P1 | 长账号名 | 下拉不撑破工具栏 |
| UI-010 | P1 | 无账号 | 显示“请在设置添加公众号” |
| UI-011 | P1 | 封面区域 | 未选封面、已选封面、删除封面都正常 |
| UI-012 | P1 | 主题菜单 | 菜单可滚动，长列表可选到底 |
| UI-013 | P1 | 高亮菜单 | 74 个高亮项可滚动选择 |
| UI-014 | P1 | Loading 状态 | 保存/复制/刷新时有加载反馈，不永久卡住 |
| UI-015 | P1 | 错误通知 | 错误文案可读，不只显示 `[object Object]` |
| UI-016 | P1 | 帮助按钮 | 打开正确 GitHub 页面 |
| UI-017 | P1 | 公众号后台按钮 | 打开 mp.weixin.qq.com，不自动提交内容 |
| UI-018 | P1 | Obsidian 暗色主题 | 工作台按钮和文本可读 |
| UI-019 | P2 | Obsidian 亮色主题 | 工作台视觉正常 |
| UI-020 | P2 | 多窗口 | 新窗口打开笔记时插件不崩溃 |
| UI-021 | P2 | Collapse 切换 | 工具栏折叠/展开不破坏预览 |
| UI-022 | P2 | 滚动长文 | 预览滚动顺畅，不带动整个 Obsidian 异常滚动 |
| UI-023 | P2 | 底部状态栏 | 不遮挡工作台关键按钮 |
| UI-024 | P2 | 截图基线 | 每个设备视口保存截图作为证据 |

### 5.5 MD Markdown 渲染

| ID | 优先级 | 用例 | 期望 |
| --- | --- | --- | --- |
| MD-001 | P0 | 空文档 | 不崩溃，有空状态或空预览 |
| MD-002 | P0 | 普通长文 | 标题、段落、加粗、斜体正常 |
| MD-003 | P1 | H1-H6 | 层级可区分 |
| MD-004 | P1 | 无序列表 | 缩进与项目符号正常 |
| MD-005 | P1 | 有序列表 | 编号连续，不丢失 |
| MD-006 | P1 | 嵌套列表 | 层级不塌陷 |
| MD-007 | P1 | 任务列表 | checkbox 表达合理 |
| MD-008 | P1 | 表格 | 表头、边框、宽度正常 |
| MD-009 | P1 | 宽表格 | 不撑破手机预览 |
| MD-010 | P1 | 代码块 | 代码块背景、字体、换行正常 |
| MD-011 | P1 | 行内代码 | 不破坏行高 |
| MD-012 | P1 | 引用块 | 样式清楚 |
| MD-013 | P1 | Callout NOTE | 结构和图标/标题正常 |
| MD-014 | P1 | Callout WARNING | 警告样式正常 |
| MD-015 | P1 | 脚注 | 不丢引用 |
| MD-016 | P1 | 数学公式 | 成功渲染或明确提示能力限制 |
| MD-017 | P1 | Obsidian 双链 | 可读，不出现内部协议垃圾 |
| MD-018 | P1 | 嵌入块 | 能展开或明确提示 |
| MD-019 | P1 | 块引用 | 引用内容正确 |
| MD-020 | P1 | 高亮 `==text==` | 样式正常 |
| MD-021 | P1 | 删除线 | 样式正常 |
| MD-022 | P1 | 分割线 | 样式正常 |
| MD-023 | P1 | 长 URL | 自动换行，不横向溢出 |
| MD-024 | P1 | 长英文单词 | 不撑破容器 |
| MD-025 | P1 | 中英文混排 | 间距和换行正常 |
| MD-026 | P1 | emoji/特殊符号 | 不乱码 |
| MD-027 | P1 | frontmatter 移除 | 预览正文不显示 frontmatter |
| MD-028 | P1 | frontmatter 主题 | 能覆盖默认主题 |
| MD-029 | P1 | frontmatter 公众号 | 能锁定账号选择 |
| MD-030 | P1 | frontmatter 封面 | 能读取封面 |
| MD-031 | P2 | HTML 内联 | 安全渲染，不执行危险脚本 |
| MD-032 | P2 | 注释 | 不污染正文 |
| MD-033 | P2 | Mermaid | 若不支持需明确降级 |
| MD-034 | P2 | Excalidraw | 若不支持需明确降级 |
| MD-035 | P2 | 超长文 3000+ 字 | 渲染不明显卡死 |
| MD-036 | P2 | 频繁编辑 | 10 次连续修改不崩溃 |

### 5.6 TME 主题与高亮

#### 5.6.1 静态完整性

| ID | 优先级 | 用例 | 期望 |
| --- | --- | --- | --- |
| TME-001 | P0 | MWeb 主题配置数 | `themes.json` 32 个 |
| TME-002 | P0 | MWeb 主题 CSS | 每个 className 都有对应 CSS |
| TME-003 | P0 | Release 资源包主题 | release assets.zip 中主题完整 |
| TME-004 | P1 | Raphael 内置主题数 | 当前内置 30 个，且 className 唯一 |
| TME-005 | P1 | 主题合并去重 | 默认主题 + Raphael + MWeb 不重复 |
| TME-006 | P1 | 高亮配置数 | 当前 74 个，文件完整 |
| TME-007 | P1 | 上游对账 | 与 `refer/mweb-themes/themes.json` 对齐，差异写明 |
| TME-008 | P1 | 主题名可读 | 菜单里名称不是 className 裸值 |

#### 5.6.2 主题批量展开测试

对以下主题全集逐个执行 `TME-BATCH`：

- 默认主题：`obsidian-light`
- Raphael 主题：插件 `src/raphael-themes.ts` 中全部主题
- MWeb 主题：`assets/themes.json` 中全部主题

每个主题必须跑 6 个检查：

| 批量 ID | 优先级 | 对每个主题执行 | 期望 |
| --- | --- | --- | --- |
| TME-BATCH-001 | P0 | 选择主题 | 不报错，不白屏 |
| TME-BATCH-002 | P1 | 手机预览 | 宽度合理，无横向溢出 |
| TME-BATCH-003 | P1 | 平板预览 | 宽度合理，内容完整 |
| TME-BATCH-004 | P1 | 桌面预览 | 不过度拉伸，排版可读 |
| TME-BATCH-005 | P1 | 复杂样稿渲染 | 标题、列表、表格、代码、图片都可见 |
| TME-BATCH-006 | P1 | 复制到本地 HTML 沙盒 | 复制后的 HTML 主要样式仍存在 |

记录格式：

```text
theme=<className>
name=<display name>
mobile=PASS/FAIL
tablet=PASS/FAIL
desktop=PASS/FAIL
copy=PASS/FAIL
screenshot=<path>
note=<异常说明>
```

#### 5.6.3 高亮批量测试

对 74 个高亮主题逐个执行：

| 批量 ID | 优先级 | 对每个高亮执行 | 期望 |
| --- | --- | --- | --- |
| HLT-BATCH-001 | P1 | 选择高亮主题 | 不报错 |
| HLT-BATCH-002 | P1 | TypeScript 代码块 | token 有颜色或至少样式可读 |
| HLT-BATCH-003 | P2 | 暗色高亮 + 亮色文章主题 | 对比度可读 |
| HLT-BATCH-004 | P2 | 亮色高亮 + 暗色文章主题 | 对比度可读 |

### 5.7 CPY 复制与剪贴板

| ID | 优先级 | 用例 | 期望 |
| --- | --- | --- | --- |
| CPY-001 | P0 | 无图床无公众号复制含本地图 | 不允许假成功；必须提示需要图床/公众号或使用可用 fallback |
| CPY-002 | P0 | 无图片普通文复制 | 剪贴板有 HTML 和纯文本 |
| CPY-003 | P1 | 复制长文 | 内容完整，无截断 |
| CPY-004 | P1 | 复制列表 | 列表结构保留 |
| CPY-005 | P1 | 复制表格 | 表格结构保留 |
| CPY-006 | P1 | 复制代码块 | 代码块样式保留 |
| CPY-007 | P1 | 复制 Callout | 内容不丢 |
| CPY-008 | P1 | 复制在线图片 | 不重复上传，链接保留 |
| CPY-009 | P1 | 复制本地图片到云图床 | 成功上传并替换公网 URL |
| CPY-010 | P1 | 图床开启但配置不完整 | 明确报错，不写入坏剪贴板 |
| CPY-011 | P1 | 剪贴板 fallback | navigator clipboard 失败时 Electron fallback 可用 |
| CPY-012 | P1 | 连续复制 | 5 次连续复制结果稳定 |
| CPY-013 | P1 | 切换主题后复制 | 使用当前主题 CSS |
| CPY-014 | P2 | 复制后粘贴到本地 contenteditable | HTML 结构可检查 |
| CPY-015 | P2 | 复制纯文本 fallback | 至少正文可读 |

### 5.8 IMG 图片与图床

| ID | 优先级 | 用例 | 期望 |
| --- | --- | --- | --- |
| IMG-001 | P0 | 本地 png | 预览可见 |
| IMG-002 | P0 | 本地 jpg | 预览可见 |
| IMG-003 | P1 | 本地 webp | 可转换或明确提示 |
| IMG-004 | P1 | 本地 gif | 预览和复制策略明确 |
| IMG-005 | P1 | 本地 svg | 不崩溃，策略明确 |
| IMG-006 | P1 | 缺失图片 | 明确提示缺失路径 |
| IMG-007 | P1 | 重复图片 | 上传去重或结果一致 |
| IMG-008 | P1 | 大图 | 不崩溃，上传失败有提示 |
| IMG-009 | P1 | 在线图片 | 不重复上传 |
| IMG-010 | P1 | 在线图片 404 | 提示可理解 |
| IMG-011 | P1 | URL 带 query | 文件名和类型判断正确 |
| IMG-012 | P1 | R2 path style | 测试上传成功 |
| IMG-013 | P1 | OSS virtual-hosted | 测试上传成功 |
| IMG-014 | P1 | Public Base URL | 生成公网 URL 正确 |
| IMG-015 | P1 | Bucket 私有 | 403 诊断清楚 |
| IMG-016 | P1 | AccessKey 错 | 鉴权错误清楚 |
| IMG-017 | P1 | Endpoint 错 | URL 错误清楚 |
| IMG-018 | P1 | Region 错 | 错误清楚 |
| IMG-019 | P2 | Path Prefix | 路径前缀生效 |
| IMG-020 | P2 | 清空图床设置 | 不残留旧 Secret 到 UI |

### 5.9 WX 公众号配置与草稿箱

默认只跑负向；真实 AppID/AppSecret 测试必须由用户确认。

| ID | 优先级 | 用例 | 期望 |
| --- | --- | --- | --- |
| WX-001 | P0 | 无公众号保存草稿 | 明确提示先配置 |
| WX-002 | P1 | 公众号格式错误 | 保存设置失败并提示格式 |
| WX-003 | P1 | AppSecret 为空 | 不保存，提示对应账号 |
| WX-004 | P1 | Secret 掩码保留 | 重新保存不会清空真实 Secret |
| WX-005 | P1 | 清空公众号信息 | 二次确认后清空 |
| WX-006 | P1 | 测试公众号无配置 | 提示先设置 |
| WX-007 | P1 | AppSecret 错误 | 提示 AppSecret 错 |
| WX-008 | P1 | IP 白名单错误 | 提示添加出口 IP |
| WX-009 | P1 | token 网络失败 | 不崩溃，提示网络或接口失败 |
| WX-010 | P1 | 无封面保存草稿 | 使用默认封面或明确提示 |
| WX-011 | P1 | frontmatter 封面 | 能读取并上传 |
| WX-012 | P1 | thumb_media_id | 已有素材 ID 时不重复上传封面 |
| WX-013 | P1 | 保存文章草稿 | 成功返回 media_id |
| WX-014 | P1 | 保存图片草稿 | 成功返回 media_id 或明确不支持 |
| WX-015 | P1 | 异常内容 | 接口失败时建议手动复制 |
| WX-016 | P2 | 多公众号 | 选择账号正确 |

### 5.10 AGT Agent 队列

| ID | 优先级 | 用例 | 期望 |
| --- | --- | --- | --- |
| AGT-001 | P0 | 初始化工作流 | 创建 inbox/review/publish/.obsidiantomp |
| AGT-002 | P0 | 请求文件缺失 | result 写 error 或 Notice 清楚 |
| AGT-003 | P0 | JSON 格式错误 | 不崩溃，写 error |
| AGT-004 | P0 | note 缺失 | 提示指定 note 或打开 Markdown |
| AGT-005 | P0 | note 路径不存在 | result error |
| AGT-006 | P0 | note 不是 md | result error |
| AGT-007 | P1 | 相对路径 | 正确找到文件 |
| AGT-008 | P1 | 绝对路径 | 能 normalize 到 vault 内路径 |
| AGT-009 | P1 | 中文路径 | 正常读取 |
| AGT-010 | P1 | resultPath 自定义 | 写入指定位置 |
| AGT-011 | P1 | requestId | 原样写回 result |
| AGT-012 | P1 | running 状态 | 开始处理先写 running |
| AGT-013 | P1 | 无公众号配置 | 写 error，不假成功 |
| AGT-014 | P1 | 指定 account name | 能匹配公众号名称 |
| AGT-015 | P1 | 指定 appid | 能匹配 appid |
| AGT-016 | P1 | 多次运行 | 不覆盖无关文件 |
| AGT-017 | P2 | 并发请求 | 明确当前是否支持；不支持需文档写明 |
| AGT-018 | P2 | Agent 说明文档 | `AGENT_WORKFLOW.md` 步骤可执行 |

### 5.11 REL 文档与发布资产

| ID | 优先级 | 用例 | 期望 |
| --- | --- | --- | --- |
| REL-001 | P0 | README 版本 | 当前发布版本与 manifest 一致 |
| REL-002 | P0 | Latest Release | GitHub latest 指向当前版本 |
| REL-003 | P0 | Release 资产齐全 | 5 个资产齐全 |
| REL-004 | P1 | BRAT 指引 | 仓库根目录有 manifest/main/styles |
| REL-005 | P1 | 手动安装指引 | 路径和文件名正确 |
| REL-006 | P1 | 源码安装指引 | 命令可执行 |
| REL-007 | P1 | 主题资源排障 | 包含下载、强制重下、网络说明 |
| REL-008 | P1 | 图床配置说明 | R2/OSS/URL Style 说明清楚 |
| REL-009 | P1 | 公众号配置说明 | 不要求用户把 Secret 发给 AI |
| REL-010 | P1 | 不支持项说明 | Mermaid/移动端复制等限制写清楚 |
| REL-011 | P1 | 截图更新 | README 截图与当前 UI 一致 |
| REL-012 | P2 | CHANGELOG | 本版本修复和已知问题清楚 |
| REL-013 | P2 | License/NOTICE | 参考项目来源说明保留 |

### 5.12 STR 压力与回归

| ID | 优先级 | 用例 | 期望 |
| --- | --- | --- | --- |
| STR-001 | P1 | 100 次切换主题 | 不崩溃，不内存明显失控 |
| STR-002 | P1 | 50 次切换设备 | 比例稳定 |
| STR-003 | P1 | 20 次拖动分栏 | 预览可恢复 |
| STR-004 | P1 | 10 篇文章快速切换 | 当前预览不串稿 |
| STR-005 | P1 | 10 次复制 | 剪贴板稳定 |
| STR-006 | P1 | 删除 assets 后重载 | 自动降级或重新下载 |
| STR-007 | P1 | 半下载 assets | 资源状态提示不误判 ready |
| STR-008 | P1 | Obsidian 重启 3 次 | 插件保持可用 |
| STR-009 | P2 | 长文滚动到底部 | 不明显卡顿 |
| STR-010 | P2 | 控制台错误检查 | 无新增未捕获异常 |

## 6. 主题验收补充规则

主题自测不能只看“菜单里有”。必须同时看 4 层：

1. 资源层：配置和 CSS 是否完整。
2. 预览层：在 Obsidian 工作台是否可读。
3. 复制层：复制出来的 HTML 是否保留主要样式。
4. 公众号层：真实公众号编辑器兼容性。此项需要用户确认后才可进入真实后台测试。

主题失败分类：

| 分类 | 例子 | 处理 |
| --- | --- | --- |
| `missing-resource` | 配置有主题但 CSS 不存在 | P0，必须修 |
| `menu-broken` | 菜单不可滚动/无法选择 | P1，必须修 |
| `preview-blank` | 选择后白屏 | P1，必须修 |
| `layout-overflow` | 手机预览横向溢出 | P1，必须修 |
| `copy-loss` | 复制后主题样式基本丢失 | P1，必须修或降级说明 |
| `aesthetic-low` | 能用但不好看 | P2，可后续优化 |

## 7. AI 测试报告模板

每次跑完后生成：

```markdown
# ObsidianToMP AI Test Report

Date:
Tester:
Commit:
Version:
Obsidian:
Node:
Vaults:

## Summary
- Total:
- PASS:
- FAIL:
- BLOCKED:
- P0:
- P1:

## Release Verdict
Go / No-Go:
Reason:

## Failed Cases
| ID | Priority | Result | Repro | Evidence | Suggested Fix |
| --- | --- | --- | --- | --- | --- |

## Theme Matrix Result
| theme | mobile | tablet | desktop | copy | screenshot | note |
| --- | --- | --- | --- | --- | --- | --- |

## Evidence
- Build log:
- Screenshots:
- Clipboard HTML samples:
- Result JSON:
- Console errors:
```

## 8. 当前产品的优先测试焦点

基于 2026-04-30 的自测观察，下一轮 AI 应优先验证这些点：

1. 拖动 Obsidian 分栏后，手机/平板/桌面预览比例是否恢复。
2. 主题全集是否真的可选择、可预览、可复制，而不是只存在于资源包。
3. 无公众号/无图床时，含本地图片的复制是否会假成功。
4. Release 线上版本和本地开发版本是否一致。
5. README 截图、按钮命名、实际 UI 是否一致。

这些点任意一个仍失败，都不建议正式开源发布。
