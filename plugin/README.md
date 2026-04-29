# ObsidianToMP Plugin

ObsidianToMP 是面向微信公众号写作场景的 Obsidian 本地插件，强调：
- 本地优先
- 可复制粘贴
- 可一键同步草稿
- 可接入你自己的云图床

## 当前功能
- 公众号预览
- 一键复制到公众号编辑器（自动处理本地图片）
- 一键发草稿到公众号后台
- 多主题 + 代码高亮
- 多端预览（手机 / 平板 / 桌面）
- S3 兼容图床上传
- Codex / Claude Code 队列式保存到公众号草稿箱

## 工作台模块
- 图床设计与诊断：配置 S3 兼容图床、测试上传、公网可读校验、URL Style/ACL 错误提示。
- 主题选择：默认样式、代码高亮、外部主题包、自定义 CSS 笔记。
- 机型预览：手机 / 平板 / 桌面预览切换。
- Agent 联动：写作 skill 写入 `publish-request.json`，插件渲染并保存到公众号草稿箱。

## 本地开发

```bash
npm install
npm run build
```

构建产物：
- `main.js`
- `styles.css`
- `manifest.json`

## 安装到 Obsidian
优先使用零代码安装：

1. BRAT 安装（推荐）
- 安装并启用 `BRAT`
- 在 BRAT 中点击 `Add Beta Plugin`
- 输入仓库：`qianzhu18/ObsidianToMP`
- 安装完成后启用 `ObsidianToMP`
- 首次启用会自动下载主题/高亮资源（`assets.zip`）
- Release 与仓库根目录都提供 Obsidian 所需的 `manifest.json / main.js / styles.css`
- 若仍提示 `no manifest.json`：删除失败记录 -> 重启 Obsidian -> 重新添加

2. Release 手动安装（最稳）
- 下载：`https://github.com/qianzhu18/ObsidianToMP/releases/latest`
- 解压最新的 `obsidian-to-mp-v版本号.zip` 到 `<Vault>/.obsidian/plugins/obsidian-to-mp`
- 确认目录内有：`main.js`、`styles.css`、`manifest.json`
- 重启并启用插件

3. 本地开发安装（仅开发者）
```bash
ln -sfn "/绝对路径/ObsidianToMP/plugin" "<你的Vault路径>/.obsidian/plugins/obsidian-to-mp"
```
然后在 Obsidian 里启用 `ObsidianToMP`。

## 云图床说明
插件设置里可配置 S3 兼容图床：
- Endpoint
- Bucket
- Region
- AccessKey ID
- Secret Access Key
- Public Base URL（可选）
- Path Prefix（可选）

复制时会自动上传本地/内嵌图片到图床，已是在线图片会自动跳过，不需要额外按钮。

## 主题/高亮资源故障排查
1. 打开插件设置，点击 `获取更多主题 -> 下载`。
2. 看到“下载完成”后，重新打开预览视图。
3. 如果资源目录异常（数量不全/高亮仍缺失），点击 `强制重下`。
4. 手动验证资源地址可访问：`https://github.com/qianzhu18/ObsidianToMP/releases/latest/download/assets.zip`
5. 如果外部网络限制 GitHub 下载，请切换网络后重试。

## Agent 写作链路
在命令面板执行 `ObsidianToMP: 初始化公众号写作工作流`，插件会创建：
- `content/inbox/`：Agent 初稿和选题卡
- `content/review/`：人工校对
- `content/publish/`：待发布终稿
- `content/AGENT_WORKFLOW.md`：Codex / Claude Code 调用示例

当前版本不在 Obsidian 内直接启动外部 Agent，避免 shell 权限和跨端兼容问题；推荐让 Codex/Claude Code 写入 vault 后，再由插件完成预览、复制和发草稿。

### 队列式保存到公众号草稿箱
Codex/Claude Code 可以写入：

```text
content/.obsidiantomp/publish-request.json
```

示例：

```json
{
  "note": "content/publish/文章名.md",
  "account": "公众号名称或 wx 开头的 AppID",
  "resultPath": "content/.obsidiantomp/publish-result.json"
}
```

然后通过 Obsidian CLI 触发：

```bash
obsidian vault="<Vault名称>" command id="obsidian-to-mp:obsidian-to-mp-publish-queued-draft"
```

插件会渲染目标 Markdown、上传图片和封面、调用微信公众号草稿 API，并把结果写回 `publish-result.json`。

## 分支策略
- `main`: 基线与汇总
- `stable`: 可直接体验的稳定迭代分支

## 协议
MIT。见 `LICENSE` 与 `NOTICE`。
