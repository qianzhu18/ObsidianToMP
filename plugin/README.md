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
把本目录链接到你的 Vault 插件目录：

```bash
ln -sfn "/绝对路径/ObsidianToMP/plugin" "<你的Vault路径>/.obsidian/plugins/obsidian-to-mp"
```

在 Obsidian 里启用 `ObsidianToMP` 即可。

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

## 分支策略
- `main`: 基线与汇总
- `stable`: 可直接体验的稳定迭代分支

## 协议
MIT。见 `LICENSE` 与 `NOTICE`。
