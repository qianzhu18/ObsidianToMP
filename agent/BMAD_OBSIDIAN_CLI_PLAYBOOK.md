# BMAD × Obsidian CLI × ObsidianToMP 开发流程

目标：把 `BMAD-METHOD` 的规划/实现流程，和 Obsidian CLI + ObsidianToMP 发布链路打通。

## 0. 可行性结论
- 可行。
- BMAD 提供多 Agent 开发流程和工作流指令（适合需求拆解、实现、测试、文档）。
- Obsidian CLI 提供脚本化控制（创建笔记、执行命令、重载插件）。
- ObsidianToMP 提供发布侧能力（预览、复制、发公众号草稿、图床托管）。

## 1. 先决条件
1. Node.js 20+（BMAD 安装器要求）
2. Obsidian 1.12+ 安装器版本（CLI 功能要求）
3. 目标 Vault 已启用 `obsidian-to-mp` 插件

## 2. 安装 BMAD
在项目根目录执行：

```bash
npx bmad-method install
```

建议选择：
- AI 工具：Claude Code
- 模块：BMad Method（BMM）优先

安装后会生成 `_bmad/` 与 `.claude/` 等目录。

## 3. 启用并验证 Obsidian CLI
在 Obsidian 桌面端：
1. `Settings -> General`
2. 启用 `Command line interface`
3. 跟随提示注册 CLI

终端验证：

```bash
obsidian help
obsidian commands filter=obsidian-to-mp
```

如果命令不可用，说明 CLI 还未注册成功或版本不满足。

## 4. 绑定到你的 Vault（示例）
你的实验库路径示例：

```text
/Users/mac/Downloads/code/obsidian publish/测试/测试
```

先确认 Vault 名称（CLI 用名称，不是路径）：

```bash
obsidian vaults verbose
```

你当前的 Vault 名称是 `测试`，使用命令时显式指定：

```bash
obsidian vault="测试" daily
```

## 5. 开发流程（推荐）
1. BMAD 做需求与实现拆解  
在 Claude Code 中跑 BMAD 工作流（如初始化、拆 Story、实现任务）。

2. Agent 产出文稿到 Vault  
将 AI 输出写入 `content/inbox/*.md`。

3. CLI 自动触发 Obsidian 动作  
- 创建/更新文稿
- 重载插件（开发时）
- 打开发布预览命令

4. ObsidianToMP 完成发布前动作  
- 多端预览
- 点击“复制到公众号”自动上传本地图片（在线图片自动跳过）
- 复制到公众号或发草稿

## 6. 最小自动化命令链
```bash
# 1) 重载插件（每次 build 后）
obsidian vault="测试" plugin:reload id=obsidian-to-mp

# 2) 查看插件命令 ID（首次做）
obsidian vault="测试" commands filter=obsidian-to-mp

# 3) 执行发布预览命令（替换成第2步返回的真实 id）
obsidian vault="测试" command id="<actual-command-id>"
```

## 7. 推荐分支模型
- `stable`: 线上可用，随时可回退
- `main`: 对外主线，周期同步 stable
- `codex/agent-exploration`: Agent 自动化实验

回退命令：

```bash
git checkout stable
```

## 8. 常见故障排查
1. `obsidian: command not found`  
CLI 未安装/未注册；先在 Obsidian 设置中启用 CLI。

2. `commands filter=obsidian-to-mp` 无结果  
插件没启用或 vault 指错。

3. `Vault not found`  
大多是把“路径”当成 `vault=` 传入，先执行 `obsidian vaults verbose`，改用 Vault 名称。

4. 图床上传 403  
优先检查 OSS URL 风格、Bucket ACL/Policy（上传成功不等于可公开读）。
