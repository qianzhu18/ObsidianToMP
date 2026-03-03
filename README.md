# ObsidianToMP

> 在 Obsidian 本地写作，一键复制到公众号编辑器，或一键同步到公众号草稿箱。  
> 重点解决本地图片上传痛点：支持配置 **S3 兼容图床**（如 Cloudflare R2 / MinIO / 兼容 S3 的对象存储）。

[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](./plugin/LICENSE)
[![Stable Branch](https://img.shields.io/badge/branch-stable-blue)](https://github.com/qianzhu18/ObsidianToMP/tree/stable)

## 为什么做这个项目
很多人用 Obsidian 写公众号，最大痛点有两个：
1. 复制粘贴后格式不稳定（尤其代码块、列表）。
2. 本地图片无法无门槛同步到云端，导致必须走公众号素材上传。

ObsidianToMP 的目标是做成一个 **体感良好、上手即用** 的本地插件：
- 不强制依赖付费服务
- 支持本地预览 + 复制 + 发草稿
- 支持你自己的云图床

## 主要能力（当前 stable）
- 公众号排版预览（Obsidian 内）
- 一键复制到公众号编辑器
- 一键同步到公众号草稿箱
- 多主题（含整合主题包）
- 多端预览切换（手机 / 平板 / 桌面）
- S3 兼容图床配置
- “上传图片到云端”按钮（手动触发）
- 复制时自动上传云图（未选择公众号账号时）
- 图床 URL Style（`auto/path/virtual-hosted`，兼容 OSS）
- “上传+生成Hosted稿”按钮（自动生成 `*.hosted.md`）

## 使用截图
![preview](./plugin/images/screenshot.png)

## 快速开始

### 1. 获取代码
```bash
git clone https://github.com/qianzhu18/ObsidianToMP.git
cd ObsidianToMP
git checkout stable
```

### 2. 构建插件
```bash
cd plugin
npm install
npm run build
```

### 3. 在 Obsidian 中安装（本地开发方式）
将 `plugin/` 目录软链接到你的 Vault：

```bash
ln -sfn "/绝对路径/ObsidianToMP/plugin" "<你的Vault路径>/.obsidian/plugins/obsidian-to-mp"
```

然后在 Obsidian：
- 设置 -> 第三方插件 -> 关闭安全模式
- 启用 `ObsidianToMP`

## 云图床配置（S3 兼容）
在插件设置中填写：
- Endpoint
- Bucket
- Region（R2 可用 `auto`）
- URL Style（OSS 推荐 `virtual-hosted`，不确定时选 `auto`）
- AccessKey ID
- Secret Access Key
- Public Base URL（可选）
- Path Prefix（可选）

建议先点“测试上传”，成功后再正式使用。

## 研发路线（Road to 50 stars）
这是一个个人入门开源项目，目标是通过持续打磨拿到 50 stars：
- [x] 可用 MVP：预览、复制、发草稿
- [x] 图床能力：S3 兼容 + 自动上传兜底
- [ ] 复制保真回归集（列表/表格/Callout/代码块）
- [ ] 发布流程可观测（错误分层与排障文档）
- [ ] Demo Vault 与示例模板

欢迎提 Issue 与 PR，一起把这个项目做成 Obsidian 中文写作发布链路里的标准方案。

## 协议与致谢
- 本项目为 MIT 协议开源：见 [plugin/LICENSE](./plugin/LICENSE)
- 基于上游开源项目二次开发，保留了协议要求的版权与许可说明：见 [plugin/NOTICE](./plugin/NOTICE)
