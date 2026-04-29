/*
 * Copyright (c) 2024-2025 Sun Booshi
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

import { Plugin, WorkspaceLeaf, App, PluginManifest, Notice, TAbstractFile, TFile, TFolder, ItemView } from 'obsidian';
import { NMPSettings } from './settings';
import { setVersion, uevent } from './utils';
import { usePluginStore } from './store/PluginStore';
import { ArticleRender } from './article-render';

const VIEW_TYPE_NOTE_PREVIEW = 'obsidian-to-mp-note-preview';
const PUBLISH_REQUEST_PATH = 'content/.obsidiantomp/publish-request.json';
const PUBLISH_RESULT_PATH = 'content/.obsidiantomp/publish-result.json';

interface PublishDraftRequest {
	note?: string;
	notePath?: string;
	path?: string;
	appid?: string;
	account?: string;
	resultPath?: string;
	requestId?: string;
}

interface PublishDraftResult {
	ok: boolean;
	status: 'success' | 'error';
	note?: string;
	media_id?: string;
	appid?: string;
	requestId?: string;
	publishedAt: string;
	error?: string;
}

class FallbackPreviewView extends ItemView {
	private readonly message: string;

	constructor(leaf: WorkspaceLeaf, message: string) {
		super(leaf);
		this.message = message;
	}

	getViewType() {
		return VIEW_TYPE_NOTE_PREVIEW;
	}

	getIcon() {
		return 'clipboard-paste';
	}

	getDisplayText() {
		return 'ObsidianToMP 预览';
	}

	async onOpen() {
		const container = this.containerEl.children[1] as HTMLElement;
		if (!container) {
			return;
		}
		container.empty();
		container.createEl('div', {
			text: `ObsidianToMP 预览模块加载失败：${this.message}`,
		});
	}
}

export default class NoteToMpPlugin extends Plugin {
	settings: NMPSettings;
	assetsManager: any;
	constructor(app: App, manifest: PluginManifest) {
	    super(app, manifest);
			this.assetsManager = null;
	}

	private tryLoadStyle() {
		try {
			require('./styles.css');
		} catch (error) {
			console.error('[ObsidianToMP] load styles failed', error);
		}
	}

	private tryInitAssetsManager() {
		try {
			const AssetsManager = require('./assets').default;
			AssetsManager.setup(this.app, this.manifest);
			this.assetsManager = AssetsManager.getInstance();
		} catch (error) {
			console.error('[ObsidianToMP] init assets manager failed', error);
			new Notice('ObsidianToMP 资源模块加载失败，部分功能可能不可用。');
		}
	}

	async loadResource() {
		try {
			await this.loadSettings();
			if (this.assetsManager) {
				await this.assetsManager.loadAssets();
			}
			usePluginStore.getState().setResourceLoaded(true);
		} catch (error) {
			console.error('[ObsidianToMP] loadResource failed', error);
			new Notice('ObsidianToMP 资源加载失败，请在设置页重新下载主题资源后重试。');
		}
	}

	private async ensureWorkflowFolder(folderPath: string) {
		const parts = folderPath.split('/').filter(Boolean);
		let current = '';
		for (const part of parts) {
			current = current ? `${current}/${part}` : part;
			const existing = this.app.vault.getAbstractFileByPath(current);
			if (existing instanceof TFolder) {
				continue;
			}
			if (existing) {
				throw new Error(`${current} 已存在但不是文件夹`);
			}
			await this.app.vault.createFolder(current);
		}
	}

	private async createWorkflowFileIfMissing(path: string, content: string, created: string[]) {
		const existing = this.app.vault.getAbstractFileByPath(path);
		if (existing) {
			return;
		}
		const folder = path.split('/').slice(0, -1).join('/');
		if (folder) {
			await this.ensureWorkflowFolder(folder);
		}
		await this.app.vault.create(path, content);
		created.push(path);
	}

	async initializeWritingWorkflow() {
		try {
			const folders = ['content/inbox', 'content/review', 'content/publish'];
			for (const folder of folders) {
				await this.ensureWorkflowFolder(folder);
			}

			const created: string[] = [];
			await this.createWorkflowFileIfMissing(
				'content/inbox/00-选题卡模板.md',
				`---
标题: ""
作者: ""
摘要: ""
公众号: ""
样式: "obsidian-light"
代码高亮: "默认"
封面: ""
---

# 选题

## 读者是谁

## 这篇解决什么问题

## 角度/承诺

## 关键素材

## 发布检查
- [ ] 标题明确
- [ ] 首屏有钩子
- [ ] 本地图片可正常预览
- [ ] 已在 ObsidianToMP 中预览手机/平板/桌面
`,
				created,
			);

			await this.createWorkflowFileIfMissing(
				'content/inbox/公众号稿件模板.md',
				`---
标题: ""
作者: ""
摘要: ""
公众号: ""
样式: "obsidian-light"
代码高亮: "默认"
封面: ""
---

# 标题

开头 2-4 行：直接进入读者的真实处境。

## 一、核心观点

## 二、具体例子

## 三、可执行方法

## 发布前检查
- [ ] 结构完整
- [ ] 图片已确认
- [ ] 代码块/列表/引用显示正常
- [ ] 点击“复制到公众号”后样式正常
`,
				created,
			);

			await this.createWorkflowFileIfMissing(
				'content/AGENT_WORKFLOW.md',
				`# ObsidianToMP Agent 写作链路

推荐流程：
1. Agent/Codex/Claude Code 把初稿写入 \`content/inbox/\`。
2. 人工校对后移动到 \`content/review/\`。
3. 终稿移动到 \`content/publish/\`。
4. 在 Obsidian 打开终稿，执行“复制到公众号”或“发布公众号文章”。
5. 如果要让 Codex 直接保存到草稿箱，写入 \`content/.obsidiantomp/publish-request.json\` 后执行命令 \`obsidian-to-mp-publish-queued-draft\`。

Codex 示例：
\`\`\`bash
codex run "根据选题卡生成公众号稿件，写入当前 vault 的 content/inbox/文章名.md。frontmatter 使用：标题、作者、摘要、公众号、样式、代码高亮、封面。"
\`\`\`

自动保存草稿请求示例：
\`\`\`json
{
  "note": "content/publish/文章名.md",
  "account": "公众号名称",
  "resultPath": "content/.obsidiantomp/publish-result.json"
}
\`\`\`

触发 Obsidian CLI：
\`\`\`bash
obsidian vault="<Vault名称>" command id="obsidian-to-mp-publish-queued-draft"
\`\`\`

注意：
- 插件不会在 Obsidian 内直接启动外部 Agent；Agent 写请求，插件负责读取请求并调用公众号草稿 API。
- 本地图片会在“复制到公众号”时按设置自动上传到云端图床；在线图片会跳过。
`,
				created,
			);

			const message = created.length > 0
				? `已初始化写作工作流：${created.length} 个模板文件`
				: '写作工作流已存在，无需重复初始化';
			new Notice(message);
		} catch (error) {
			console.error('[ObsidianToMP] init writing workflow failed', error);
			const msg = error instanceof Error ? error.message : String(error);
			new Notice(`初始化写作工作流失败：${msg}`);
		}
	}

	private normalizeVaultPath(path: string) {
		const normalized = path.replace(/\\/g, '/').replace(/^file:\/\//, '');
		if (!normalized.startsWith('/')) {
			return normalized.replace(/^\/+/, '');
		}

		const adapter = this.app.vault.adapter as any;
		if (adapter?.getBasePath) {
			const basePath = String(adapter.getBasePath()).replace(/\\/g, '/').replace(/\/+$/, '');
			if (normalized === basePath) {
				return '';
			}
			if (normalized.startsWith(`${basePath}/`)) {
				return normalized.slice(basePath.length + 1);
			}
		}

		return normalized.replace(/^\/+/, '');
	}

	private resolveRequestedAppid(appid?: string) {
		const value = (appid || '').trim();
		if (value) {
			if (value.startsWith('wx')) {
				return value;
			}
			const byName = this.settings.wxInfo.find(wx => wx.name === value);
			if (byName) {
				return byName.appid;
			}
			const byAppid = this.settings.wxInfo.find(wx => wx.appid === value);
			if (byAppid) {
				return byAppid.appid;
			}
		}
		return this.settings.wxInfo.length > 0 ? this.settings.wxInfo[0].appid : '';
	}

	private async readPublishRequest(path: string): Promise<PublishDraftRequest> {
		if (!await this.app.vault.adapter.exists(path)) {
			throw new Error(`找不到发布请求文件：${path}`);
		}
		const raw = await this.app.vault.adapter.read(path);
		const parsed = JSON.parse(raw || '{}');
		if (!parsed || typeof parsed !== 'object') {
			throw new Error('发布请求不是有效 JSON 对象');
		}
		return parsed as PublishDraftRequest;
	}

	private async writePublishResult(path: string, result: PublishDraftResult) {
		const folder = path.split('/').slice(0, -1).join('/');
		if (folder) {
			await this.ensureWorkflowFolder(folder);
		}
		await this.app.vault.adapter.write(path, JSON.stringify(result, null, 2));
	}

	private resolvePublishFile(request: PublishDraftRequest = {}) {
		const requested = request.note || request.notePath || request.path || '';
		if (requested) {
			const file = this.app.vault.getAbstractFileByPath(this.normalizeVaultPath(requested));
			if (!(file instanceof TFile)) {
				throw new Error(`找不到要发布的 Markdown：${requested}`);
			}
			if (file.extension.toLowerCase() !== 'md') {
				throw new Error('只能发布 Markdown 文件');
			}
			return file;
		}

		const active = this.app.workspace.getActiveFile();
		if (!(active instanceof TFile)) {
			throw new Error('请在请求文件中指定 note，或先打开要发布的 Markdown');
		}
		if (active.extension.toLowerCase() !== 'md') {
			throw new Error('只能发布 Markdown 文件');
		}
		return active;
	}

	private createHiddenRenderContainer() {
		const container = document.createElement('div');
		container.style.position = 'fixed';
		container.style.left = '-10000px';
		container.style.top = '0';
		container.style.width = '414px';
		container.style.minHeight = '100px';
		container.style.pointerEvents = 'none';
		container.style.opacity = '0';
		document.body.appendChild(container);
		return container;
	}

	async publishNoteToDraft(note: TFile, appid?: string) {
		await this.loadResource();
		const targetAppid = this.resolveRequestedAppid(appid);
		if (!targetAppid) {
			throw new Error('请先在 ObsidianToMP 设置中保存公众号信息');
		}

		const render = new ArticleRender(this.app);
		const container = this.createHiddenRenderContainer();
		try {
			const css = await render.getCSS(note, this.settings.defaultStyle, this.settings.defaultHighlight);
			await render.renderMarkdown(container, note);
			return await render.postArticle(targetAppid, null, container, css);
		} finally {
			container.remove();
		}
	}

	async publishActiveNoteToDraft() {
		try {
			const file = this.resolvePublishFile();
			const mediaId = await this.publishNoteToDraft(file);
			new Notice(`已保存到公众号草稿箱：${mediaId}`);
		} catch (error) {
			console.error('[ObsidianToMP] publish active note failed', error);
			const msg = error instanceof Error ? error.message : String(error);
			new Notice(`保存草稿失败：${msg}`);
		}
	}

	async publishQueuedDraft(requestPath: string = PUBLISH_REQUEST_PATH) {
		let request: PublishDraftRequest = {};
		let resultPath = PUBLISH_RESULT_PATH;
		try {
			request = await this.readPublishRequest(requestPath);
			resultPath = request.resultPath ? this.normalizeVaultPath(request.resultPath) : PUBLISH_RESULT_PATH;
			const file = this.resolvePublishFile(request);
			await this.loadResource();
			const appid = this.resolveRequestedAppid(request.account || request.appid);
			const mediaId = await this.publishNoteToDraft(file, appid);
			const result: PublishDraftResult = {
				ok: true,
				status: 'success',
				note: file.path,
				media_id: mediaId,
				appid,
				requestId: request.requestId,
				publishedAt: new Date().toISOString(),
			};
			await this.writePublishResult(resultPath, result);
			new Notice(`已保存到公众号草稿箱：${mediaId}`);
		} catch (error) {
			console.error('[ObsidianToMP] publish queued draft failed', error);
			const msg = error instanceof Error ? error.message : String(error);
			const result: PublishDraftResult = {
				ok: false,
				status: 'error',
				note: request.note || request.notePath || request.path,
				requestId: request.requestId,
				publishedAt: new Date().toISOString(),
				error: msg,
			};
			await this.writePublishResult(resultPath, result);
			new Notice(`保存草稿失败：${msg}`);
		}
	}

	async onload() {
		console.log('Loading ObsidianToMP');
		this.tryLoadStyle();
		this.tryInitAssetsManager();
		usePluginStore.getState().setApp(this.app);
		usePluginStore.getState().setPlugin(this);
		setVersion(this.manifest.version);
		this.app.workspace.onLayoutReady(()=>{
			this.loadResource();
		})

		this.registerView(
			VIEW_TYPE_NOTE_PREVIEW,
			(leaf) => {
				try {
					const { NotePreview } = require('./note-preview');
					return new NotePreview(leaf, this);
				} catch (error) {
					console.error('[ObsidianToMP] create preview view failed', error);
					const msg = error instanceof Error ? error.message : String(error);
					return new FallbackPreviewView(leaf, msg);
				}
			}
		);

		const ribbonIconEl = this.addRibbonIcon('clipboard-paste', '复制到公众号', (evt: MouseEvent) => {
			this.activateView();
		});
		ribbonIconEl.addClass('obsidian-to-mp-plugin-ribbon-class');

		this.addCommand({
			id: 'obsidian-to-mp-preview',
			name: '复制到公众号',
			callback: () => {
				this.activateView();
			}
		});

		this.addCommand({
			id: 'obsidian-to-mp-init-writing-workflow',
			name: '初始化公众号写作工作流',
			callback: () => {
				this.initializeWritingWorkflow();
			}
		});

		this.addCommand({
			id: 'obsidian-to-mp-publish-active-draft',
			name: '无弹窗保存当前笔记到公众号草稿箱',
			callback: () => {
				this.publishActiveNoteToDraft();
			}
		});

		this.addCommand({
			id: 'obsidian-to-mp-publish-queued-draft',
			name: '发布队列稿件到公众号草稿箱',
			callback: () => {
				this.publishQueuedDraft();
			}
		});

		try {
			const { NoteToMpSettingTab } = require('./setting-tab');
			this.addSettingTab(new NoteToMpSettingTab(this.app, this));
		} catch (error) {
			console.error('[ObsidianToMP] setting tab load failed', error);
			new Notice('ObsidianToMP 设置页加载失败，请查看控制台日志。');
		}

		this.addCommand({
			id: 'obsidian-to-mp-pub',
			name: '发布公众号文章',
			callback: () => {
				const file = this.app.workspace.getActiveFile();
				if (!(file instanceof TFile)) {
					new Notice('请先打开要发布的笔记再执行发布');
					return;
				}
				if (file.extension.toLocaleLowerCase() !== 'md') {
					new Notice('只能发布 Markdown 文件');
					return;
				}
				try {
					const { NotePubModal } = require('./note-pub');
					new NotePubModal(this.app, [file]).open();
				} catch (error) {
					console.error('[ObsidianToMP] note publish modal load failed', error);
					new Notice('发布模块加载失败，请查看控制台日志。');
				}
			}
		});

		// 监听右键菜单
		this.registerEvents();
		uevent('load');
	}

	onunload() {

	}

	registerEvents() {
		const clickOnFile = (file: TAbstractFile, merge: boolean) => {
			if (file instanceof TFile) {
				if (file.extension.toLowerCase() !== 'md') {
					new Notice('只能发布 Markdown 文件');
					return;
				}
				try {
					const { NotePubModal } = require('./note-pub');
					new NotePubModal(this.app, [file], merge).open();
				} catch (error) {
					console.error('[ObsidianToMP] note publish modal load failed', error);
					new Notice('发布模块加载失败，请查看控制台日志。');
				}
			} else if (file instanceof TFolder) {
				const files: TFile[] = [];
				file.children.forEach((child) => {
					if (child instanceof TFile && child.extension.toLocaleLowerCase() === "md") {
						files.push(child);
					}
				});
				try {
					const { NotePubModal } = require('./note-pub');
					new NotePubModal(this.app, files, merge).open();
				} catch (error) {
					console.error('[ObsidianToMP] note publish modal load failed', error);
					new Notice('发布模块加载失败，请查看控制台日志。');
				}
			}
		}

		const clickOnFiles = (files: TAbstractFile[], merge: boolean) => {
			const notes: TFile[] = [];
			files.forEach((child) => {
				if (child instanceof TFile && child.extension.toLocaleLowerCase() === "md") {
					notes.push(child);
				}
			});
			try {
				const { NotePubModal } = require('./note-pub');
				new NotePubModal(this.app, notes, merge).open();
			} catch (error) {
				console.error('[ObsidianToMP] note publish modal load failed', error);
				new Notice('发布模块加载失败，请查看控制台日志。');
			}
		};

		// 监听右键菜单
    this.registerEvent(
      this.app.workspace.on('file-menu', (menu, file) => {
        menu.addItem((item) => {
          item
            .setTitle('发布到公众号')
            .setIcon('lucide-send')
            .onClick(async () => {
              clickOnFile(file, false);
            });
        });
      })
    );

		this.registerEvent(
      this.app.workspace.on('file-menu', (menu, file) => {
        menu.addItem((item) => {
          item
            .setTitle('合并发布到公众号')
            .setIcon('lucide-send')
            .onClick(async () => {
              clickOnFile(file, true);
            });
        });
      })
    );

		this.registerEvent(
      this.app.workspace.on('files-menu', (menu, files, source) => {
        menu.addItem((item) => {
          item
            .setTitle('发布到公众号')
            .setIcon('lucide-send')
            .onClick(() => {
							clickOnFiles(files, false);
            });
        });
      })
    );

		this.registerEvent(
      this.app.workspace.on('files-menu', (menu, files, source) => {
        menu.addItem((item) => {
          item
            .setTitle('合并发布到公众号')
            .setIcon('lucide-send')
            .onClick(() => {
							clickOnFiles(files, true);
            });
        });
      })
    );
	}

	async loadSettings() {
		NMPSettings.loadSettings(await this.loadData());
		NMPSettings.getInstance().updateKeyInfo().then(updated => {
			if (updated) {
				this.saveSettings();
			}
		});
	}

	async saveSettings() {
		await this.saveData(NMPSettings.allSettings());
	}

	async activateView() {
		const { workspace } = this.app;
	
		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_NOTE_PREVIEW);
	
		if (leaves.length > 0) {
			leaf = leaves[0];
		} else {
		  	leaf = workspace.getRightLeaf(false);
		  	await leaf?.setViewState({ type: VIEW_TYPE_NOTE_PREVIEW, active: false });
		}
	
		if (leaf) workspace.revealLeaf(leaf);
	}

	getNotePreview(): ItemView | null {
		const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_NOTE_PREVIEW);
		if (leaves.length > 0) {
			return leaves[0].view as ItemView;
		}
		return null;
	}
}
