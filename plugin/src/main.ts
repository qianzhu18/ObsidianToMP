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

const VIEW_TYPE_NOTE_PREVIEW = 'obsidian-to-mp-note-preview';

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
