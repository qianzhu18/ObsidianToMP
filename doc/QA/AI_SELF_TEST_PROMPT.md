# AI 自测提示词

把下面这段发给 Codex / Claude Code / 其他 AI Agent，用于 ObsidianToMP 发布前自测。

```text
你现在是 ObsidianToMP 的发布前 QA Agent。

目标：
按照仓库内 `ObsidianToMP/doc/QA/AI_SELF_TEST_MATRIX.md` 执行自测，判断当前版本是否可以进入 release candidate。不要创建 GitHub Issues，不要发布 Release，不要提交真实公众号草稿。只做测试、记录证据、输出报告。

必须遵守：
1. 先读 `README.md`、`ObsidianToMP/README.md`、`ObsidianToMP/plugin/README.md`、`ObsidianToMP/doc/QA/AI_SELF_TEST_MATRIX.md`。
2. 不要覆盖用户已有改动。开始前记录 git status。
3. 使用 fresh clone 或临时目录验证新用户路径。
4. 准备至少 4 个测试 Vault：clean、content、broken-assets、agent。
5. 准备至少 12 篇样稿，覆盖长文、列表、表格、代码、Callout、图片、双链、frontmatter、异常输入。
6. 先跑 Smoke；Smoke 未全过时停止全量测试，直接输出 No-Go 报告。
7. 全量测试必须覆盖：构建、安装、启用、布局拖拽、Markdown 渲染、主题全集、复制、图片/图床、公众号配置负向、Agent 队列、Release 文档。
8. 主题测试不能抽样。必须读取当前插件主题全集：默认主题 + Raphael 内置主题 + MWeb assets 主题，并逐个跑手机/平板/桌面/复制检查。
9. 公众号 AppSecret、S3 Secret、真实草稿保存都需要用户明确确认；没有确认时只跑负向和 mock 测试。
10. 每个 FAIL 必须包含：测试 ID、优先级、复现步骤、实际结果、期望结果、证据路径、建议修复方向。

输出：
1. 在 `ObsidianToMP/doc/QA/reports/` 下生成一份测试报告，文件名格式：
   `TEST_REPORT_YYYY-MM-DD_<version-or-commit>.md`
2. 报告必须包含：
   - 总用例数、PASS、FAIL、BLOCKED
   - P0/P1/P2 数量
   - Release Verdict: Go / No-Go
   - Failed Cases 表格
   - Theme Matrix Result 表格
   - 关键截图/日志/剪贴板 HTML/result JSON 证据路径
3. 最后用一句明确结论：
   - `✅ 可以进入 RC`
   - 或 `❌ 不能发布，原因是：...`
```

## 快速验收口令

如果只想先跑最短闭环，可以让 AI 执行：

```text
只跑 `AI_SELF_TEST_MATRIX.md` 中的 Smoke 测试。Smoke 必须 20/20 全过；任何 FAIL 都输出 No-Go。
```

## 全量验收口令

正式发布前使用：

```text
完整执行 `AI_SELF_TEST_MATRIX.md`，包括主题批量展开测试和布局拖拽压力测试。不要抽样主题，不要跳过复制测试。真实公众号接口未授权时标记 BLOCKED，不要自行输入密钥。
```
