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

import { App, TextAreaComponent, PluginSettingTab, Setting, Notice, sanitizeHTMLToDom } from 'obsidian';
import NoteToMpPlugin from './main';
import { wxGetToken, getWxAccessToken, requestLatestVersion } from './weixin-api';
import { cleanMathCache } from './markdown/math';
import { NMPSettings } from './settings';
import { DocModal } from './doc-modal';
import { compareVersions } from './utils';
import { CloudImageUploader } from './image-host';

export class NoteToMpSettingTab extends PluginSettingTab {
	plugin: NoteToMpPlugin;
	wxInfo: string;
	wxTextArea: TextAreaComponent|null;
	settings: NMPSettings;
	headerEl: HTMLElement|null;

	constructor(app: App, plugin: NoteToMpPlugin) {
		super(app, plugin);
		this.plugin = plugin;
		this.settings = NMPSettings.getInstance();
		this.wxInfo = this.parseWXInfo();
	}

	maskSecret(secret: string) {
		if (!secret) {
			return '';
		}
		if (secret.length <= 8) {
			return '*'.repeat(secret.length);
		}
		return `${secret.slice(0, 4)}${'*'.repeat(secret.length - 8)}${secret.slice(-4)}`;
	}

	displayWXInfo(txt:string) {
	    this.wxTextArea?.setValue(txt);
	}

	parseWXInfo() {
	    const wxInfo = this.settings.wxInfo;
		if (wxInfo.length == 0) {
			return '';
		}

		let res = '';
		for (let wx of wxInfo) {
		    res += `${wx.name}|${wx.appid}|${this.maskSecret(wx.secret)}\n`;
		}
		return res;
	}

	async testWXInfo() {
	    const wxInfo = this.settings.wxInfo;
		if (wxInfo.length == 0) {
		    new Notice('请先设置公众号信息');
			return;
		}
		try {
			const docUrl = 'https://github.com/qianzhu18/ObsidianToMP';
			for (let wx of wxInfo) {
				const res = await wxGetToken(wx.appid, wx.secret);
				const token = getWxAccessToken(res);
				if (res.status !== 200 || token.length === 0) {
					const data = res.json || {};
					const code = data.errcode ?? data.code;
					let content = data.errmsg || data.message || '获取 access_token 失败';
					if (code === 50002) {
						content = '用户受限，可能是您的公众号被冻结或注销，请联系微信客服处理';
					}
					else if (code === 40125) {
						content = 'AppSecret错误，请检查或者重置，详细操作步骤请参考下方文档';
					}
					else if (code === 40164) {
						content = 'IP地址不在白名单中，请将当前设备出口 IP 添加到公众号后台白名单后重试。';
					}
					const modal = new DocModal(this.app, `${wx.name} 测试失败`, content, docUrl);
					modal.open();
					break;
				}
				new Notice(`${wx.name} 测试通过`);
			}
		} catch (error) {
			new Notice(`测试失败：${error}`);
		}
	}

	async saveWXInfo() {
	    if (this.wxInfo.length == 0) {
			new Notice('请输入内容');
			return false;
		}

		const oldSecretsByAppId = new Map<string, string>();
		for (const wx of this.settings.wxInfo) {
			oldSecretsByAppId.set(wx.appid, wx.secret);
		}

		const wechat: {name: string, appid: string, secret: string}[] = [];
		const lines = this.wxInfo.split('\n');
		for (let line of lines) {
			line = line.trim();
			if (line.length == 0) {
			    continue;
			}
			const items = line.split('|');
			if (items.length != 3) {
				new Notice('格式错误，请检查');
				return false;
			}
			const name = items[0];
			const appid = items[1].trim();
			const oldSecret = oldSecretsByAppId.get(appid);
			let secret = items[2].trim();
			if (oldSecret && secret === this.maskSecret(oldSecret)) {
				// Keep existing secret when user leaves masked value unchanged.
				secret = oldSecret;
			}
			if (!secret) {
				new Notice(`公众号 ${name} 的 AppSecret 不能为空`);
				return false;
			}
			wechat.push({name, appid, secret});
		}

		if (wechat.length == 0) {
		    return false;
		}

		try {
			this.settings.wxInfo = wechat;
			await this.plugin.saveSettings();
			this.wxInfo = this.parseWXInfo();
			this.displayWXInfo(this.wxInfo);
			new Notice('保存成功');
			return true;

		} catch (error) {
			new Notice(`保存失败：${error}`);
			console.error(error);	
		}

		return false;
	}

	async clear() {
		this.settings.wxInfo = [];
		await this.plugin.saveSettings();
		this.wxInfo = '';
		this.displayWXInfo('')
	}

	display() {
		const {containerEl} = this;

		containerEl.empty();

		this.wxInfo = this.parseWXInfo();

		this.headerEl = containerEl.createEl('div');
		this.headerEl.style.cssText = 'display: flex;flex-direction: row;align-items: center;';
		this.headerEl.createEl('h2', {text: 'ObsidianToMP'}).style.cssText = 'margin-right: 10px;';
		this.headerEl.createEl('a', {text: 'GitHub', attr: {href: 'https://github.com/qianzhu18/ObsidianToMP'}});
		this.headerEl.createEl('div', {text: ' '}).style.cssText = 'width: 10px;';
		const version = this.plugin.manifest.version;
		this.headerEl.createEl('div', {text: `当前版本: v${version}`});
		this.headerEl.createEl('div', {text: ' · by qianzhu18'});
		this.headerEl.createEl('div', {text: ' '}).style.cssText = 'width: 10px;';

		containerEl.createEl('h2', {text: '插件设置'});

		new Setting(containerEl)
			.setName('默认样式')
			.addDropdown(dropdown => {
                const styles = this.plugin.assetsManager.themes;
                for (let s of styles) {
				    dropdown.addOption(s.className, s.name);
                }
				dropdown.setValue(this.settings.defaultStyle);
                dropdown.onChange(async (value) => {
					this.settings.defaultStyle = value;
					await this.plugin.saveSettings();
                });
			});

		new Setting(containerEl)
			.setName('代码高亮')
			.addDropdown(dropdown => {
                const styles = this.plugin.assetsManager.highlights;
                for (let s of styles) {
				    dropdown.addOption(s.name, s.name);
                }
				dropdown.setValue(this.settings.defaultHighlight);
                dropdown.onChange(async (value) => {
					this.settings.defaultHighlight = value;
					await this.plugin.saveSettings();
                });
			});

		new Setting(containerEl)
			.setName('链接展示样式')
			.addDropdown(dropdown => {
				dropdown.addOption('inline', '内嵌');
			    dropdown.addOption('footnote', '脚注');
				dropdown.setValue(this.settings.linkStyle);
				dropdown.onChange(async (value) => {
				    this.settings.linkStyle = value;
					await this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName('文件嵌入展示样式')
			.addDropdown(dropdown => {
				dropdown.addOption('quote', '引用');
			    dropdown.addOption('content', '正文');
				dropdown.setValue(this.settings.embedStyle);
				dropdown.onChange(async (value) => {
				    this.settings.embedStyle = value;
					await this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName('数学公式语法')
			.addDropdown(dropdown => {
				dropdown.addOption('latex', 'latex');
			    dropdown.addOption('asciimath', 'asciimath');
				dropdown.setValue(this.settings.math);
				dropdown.onChange(async (value) => {
				    this.settings.math = value;
					cleanMathCache();
					await this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName('显示代码行号')
			.addToggle(toggle => {
			    toggle.setValue(this.settings.lineNumber);
				toggle.onChange(async (value) => {
				    this.settings.lineNumber = value;
					await this.plugin.saveSettings();
				});
			})

		new Setting(containerEl)
			.setName('启用空行渲染')
			.addToggle(toggle => {
			    toggle.setValue(this.settings.enableEmptyLine);
				toggle.onChange(async (value) => {
				    this.settings.enableEmptyLine = value;
					await this.plugin.saveSettings();
				});
			})
		
		new Setting(containerEl)
		.setName('渲染图片标题')
		.addToggle(toggle => {
			toggle.setValue(this.settings.useFigcaption);
			toggle.onChange(async (value) => {
				this.settings.useFigcaption = value;
				await this.plugin.saveSettings();
			});
		})

		new Setting(containerEl)
		.setName('Excalidraw 渲染为 PNG 图片')
		.addToggle(toggle => {
			toggle.setValue(this.settings.excalidrawToPNG);
			toggle.onChange(async (value) => {
				this.settings.excalidrawToPNG = value;
				await this.plugin.saveSettings();
			});
		})

		new Setting(containerEl)
			.setName('水印图片')
			.addText(text => {
			    text.setPlaceholder('请输入图片名称')
					.setValue(this.settings.watermark)
					.onChange(async (value) => {
					  this.settings.watermark = value.trim();
						await this.plugin.saveSettings();
					})
					.inputEl.setAttr('style', 'width: 320px;')
			})

		new Setting(containerEl)
			.setName('获取更多主题')
			.addButton(button => {
			    button.setButtonText('下载');
				button.onClick(async () => {
					button.setButtonText('下载中...');
					await this.plugin.assetsManager.downloadThemes();
					button.setButtonText('下载完成');
				});
			})
			.addButton(button => {
				button.setIcon('folder-open');
				button.onClick(async () => {
					await this.plugin.assetsManager.openAssets();
				});
			});

		new Setting(containerEl)
			.setName('清空主题')
			.addButton(button => {
			    button.setButtonText('清空');
				button.onClick(async () => {
					await this.plugin.assetsManager.removeThemes();
					this.settings.resetStyelAndHighlight();
					await this.plugin.saveSettings();
				});
			})
		new Setting(containerEl)
			.setName('全局CSS属性')
			.setDesc('只能填写CSS属性，不能写选择器')
			.addTextArea(text => {
				this.wxTextArea = text;
			    text.setPlaceholder('请输入CSS属性，如：background: #fff;padding: 10px;')
				    .setValue(this.settings.baseCSS)
					.onChange(async (value) => {
					    this.settings.baseCSS = value;
							await this.plugin.saveSettings();
					})
				    .inputEl.setAttr('style', 'width: 520px; height: 60px;');
		})
		const customCSSDoc = '使用指南：<a href="https://github.com/qianzhu18/ObsidianToMP/blob/main/plugin/README.md">https://github.com/qianzhu18/ObsidianToMP/blob/main/plugin/README.md</a>';
		new Setting(containerEl)
			.setName('自定义CSS笔记')
			.setDesc(sanitizeHTMLToDom(customCSSDoc))
			.addText(text => {
				text.setPlaceholder('请输入自定义CSS笔记标题')
				.setValue(this.settings.customCSSNote)
				.onChange(async (value) => {
					this.settings.customCSSNote = value.trim();
					await this.plugin.saveSettings();
					await this.plugin.assetsManager.loadCustomCSS();
				})
				.inputEl.setAttr('style', 'width: 320px;')
		});

		const expertDoc = '使用指南：<a href="https://github.com/qianzhu18/ObsidianToMP/blob/main/plugin/README.md">https://github.com/qianzhu18/ObsidianToMP/blob/main/plugin/README.md</a>';
		new Setting(containerEl)
			.setName('专家设置笔记')
			.setDesc(sanitizeHTMLToDom(expertDoc))
			.addText(text => {
				text.setPlaceholder('请输入专家设置笔记标题')
				.setValue(this.settings.expertSettingsNote)
				.onChange(async (value) => {
					this.settings.expertSettingsNote = value.trim();
					await this.plugin.saveSettings();
					await this.plugin.assetsManager.loadExpertSettings();
				})
				.inputEl.setAttr('style', 'width: 320px;')
		});
		
		let isClear = this.settings.wxInfo.length > 0;
		let isRealClear = false;
		const buttonText = isClear ? '清空公众号信息' : '保存公众号信息';
		new Setting(containerEl)
			.setName('公众号信息')
			.addTextArea(text => {
				this.wxTextArea = text;
			    text.setPlaceholder('请输入公众号信息\n格式：公众号名称|公众号AppID|公众号AppSecret\n多个公众号请换行输入\n若显示为掩码，保持不改即沿用原 Secret\n输入完成后点击保存按钮')
				    .setValue(this.wxInfo)
					.onChange(value => {
					    this.wxInfo = value;
					})
				  .inputEl.setAttr('style', 'width: 520px; height: 120px;');
			})
		
		new Setting(containerEl).addButton(button => {
			button.setButtonText(buttonText);
			button.onClick(async () => {
				if (isClear) {
					isRealClear = true;
					isClear = false;
					button.setButtonText('确认清空?');
				}
				else if (isRealClear) {
					isRealClear = false;
					isClear = false;
					this.clear();
					button.setButtonText('保存公众号信息');
				}
				else {
					button.setButtonText('保存中...');
					if (await this.saveWXInfo()) {
						isClear = true;
						isRealClear = false;
						button.setButtonText('清空公众号信息');
					}
					else {
						button.setButtonText('保存公众号信息');
					}
				}
			});
		})
		.addButton(button => {
			button.setButtonText('测试公众号');
			button.onClick(async () => {
				button.setButtonText('测试中...');
				await this.testWXInfo();
				button.setButtonText('测试公众号');
			})
		})
		containerEl.createEl('h3', {text: '云端图床（S3 兼容）'});

		new Setting(containerEl)
			.setName('复制时自动上传本地图')
			.setDesc('开启后，点击“复制到公众号”会自动上传本地/内嵌图片到图床；已是在线图片会自动跳过。')
			.addToggle(toggle => {
				toggle.setValue(this.settings.cloudImageHost.enabled);
				toggle.onChange(async (value) => {
					this.settings.cloudImageHost.enabled = value;
					await this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName('Endpoint')
			.setDesc('例如：https://<accountid>.r2.cloudflarestorage.com（只填域名也可以，会自动补 https://）')
			.addText(text => {
				text.setPlaceholder('https://s3-compatible-endpoint')
					.setValue(this.settings.cloudImageHost.endpoint || '')
					.onChange(async (value) => {
						this.settings.cloudImageHost.endpoint = value.trim();
						await this.plugin.saveSettings();
					})
					.inputEl.setAttr('style', 'width: 420px;');
			});

		new Setting(containerEl)
			.setName('Bucket')
			.addText(text => {
				text.setPlaceholder('your-bucket-name')
					.setValue(this.settings.cloudImageHost.bucket || '')
					.onChange(async (value) => {
						this.settings.cloudImageHost.bucket = value.trim();
						await this.plugin.saveSettings();
					})
					.inputEl.setAttr('style', 'width: 320px;');
			});

		new Setting(containerEl)
			.setName('Region')
			.setDesc('R2 可使用 auto；AWS S3 使用具体 Region。')
			.addText(text => {
				text.setPlaceholder('auto')
					.setValue(this.settings.cloudImageHost.region || 'auto')
					.onChange(async (value) => {
						this.settings.cloudImageHost.region = value.trim() || 'auto';
						await this.plugin.saveSettings();
					})
					.inputEl.setAttr('style', 'width: 180px;');
			});

		new Setting(containerEl)
			.setName('URL Style')
			.setDesc('阿里云 OSS 推荐 virtual-hosted；不确定时用 auto（自动判断并兜底重试）。')
			.addDropdown(dropdown => {
				dropdown
					.addOption('auto', 'auto（推荐）')
					.addOption('path', 'path-style')
					.addOption('virtual-hosted', 'virtual-hosted-style')
					.setValue(this.settings.cloudImageHost.urlStyle || 'auto')
					.onChange(async (value: 'auto' | 'path' | 'virtual-hosted') => {
						this.settings.cloudImageHost.urlStyle = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName('AccessKey ID')
			.addText(text => {
				text.setPlaceholder('Access Key ID')
					.setValue(this.settings.cloudImageHost.accessKeyId || '')
					.onChange(async (value) => {
						this.settings.cloudImageHost.accessKeyId = value.trim();
						await this.plugin.saveSettings();
					})
					.inputEl.setAttr('style', 'width: 320px;');
			});

		new Setting(containerEl)
			.setName('Secret Access Key')
			.addText(text => {
				text.setPlaceholder('Secret Access Key')
					.setValue(this.settings.cloudImageHost.secretAccessKey || '')
					.onChange(async (value) => {
						this.settings.cloudImageHost.secretAccessKey = value.trim();
						await this.plugin.saveSettings();
					});
				text.inputEl.type = 'password';
				text.inputEl.setAttr('style', 'width: 320px;');
			});

		new Setting(containerEl)
			.setName('Public Base URL（可选）')
			.setDesc('例如：https://cdn.example.com，不填则回落到 Endpoint/Bucket 直链。')
			.addText(text => {
				text.setPlaceholder('https://cdn.example.com')
					.setValue(this.settings.cloudImageHost.publicBaseUrl || '')
					.onChange(async (value) => {
						this.settings.cloudImageHost.publicBaseUrl = value.trim();
						await this.plugin.saveSettings();
					})
					.inputEl.setAttr('style', 'width: 420px;');
			});

		new Setting(containerEl)
			.setName('Path Prefix（可选）')
			.setDesc('上传路径前缀，默认 obsidiantomp。')
			.addText(text => {
				text.setPlaceholder('obsidiantomp')
					.setValue(this.settings.cloudImageHost.pathPrefix || '')
					.onChange(async (value) => {
						this.settings.cloudImageHost.pathPrefix = value.trim();
						await this.plugin.saveSettings();
					})
					.inputEl.setAttr('style', 'width: 220px;');
			});

		new Setting(containerEl)
			.setName('测试云端图床')
			.setDesc('上传 1x1 PNG 测试文件并返回 URL。')
			.addButton(button => {
				button.setButtonText('测试上传');
				button.onClick(async () => {
					button.setButtonText('测试中...');
					try {
						const uploader = new CloudImageUploader(this.settings.cloudImageHost);
						const result = await uploader.uploadTestImage();
						new Notice(`测试成功（${uploader.getEffectiveUrlStyle()}）：${result.url}`);
					} catch (error) {
						new Notice(`测试失败：${error.message}`);
					} finally {
						button.setButtonText('测试上传');
					}
				});
			});
		this.checkUpdate();
	}

	checkUpdate() {
		requestLatestVersion().then((versionInfo) => {
			if (!versionInfo) return;
			if (!this.headerEl) return;
			if (compareVersions(versionInfo.version, this.plugin.manifest.version) > 0) {
				this.headerEl.createEl('a', {text: '有新版本: v' + versionInfo.version, attr: {href: versionInfo.url}});
			}
		});	
	}
}
