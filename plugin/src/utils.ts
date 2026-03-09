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

import { App, sanitizeHTMLToDom, Platform, TFile } from "obsidian";
import type * as Postcss from "./postcss/postcss";

let PluginVersion = "0.0.0";
let PlugPlatform = "obsidian";
let postcssModule: typeof import("./postcss/postcss") | null = null;

function getPostcss(): typeof import("./postcss/postcss") {
	if (postcssModule !== null) {
		return postcssModule;
	}

	try {
		const mod = require("./postcss/postcss") as typeof import("./postcss/postcss");
		postcssModule = mod;
		return mod;
	} catch (error) {
		console.error("[ObsidianToMP] failed to load postcss runtime:", error);
		throw new Error("当前环境暂不支持 CSS 解析能力");
	}
}

export function setVersion(version: string) {
	PluginVersion = version;
	if (Platform.isWin) {
		PlugPlatform = "win";
	}
	else if (Platform.isMacOS) {
		PlugPlatform = "mac";
	}
	else if (Platform.isLinux) {
		PlugPlatform = "linux";
	}
	else if (Platform.isIosApp) {
		PlugPlatform = "ios";
	}
	else if (Platform.isAndroidApp) {
		PlugPlatform = "android";
	}
}

function getStyleSheet() {
	for (var i = 0; i < document.styleSheets.length; i++) {
		var sheet = document.styleSheets[i];
		if (sheet.title == 'note-to-mp-style') {
		  return sheet;
		}
	}
}

function applyStyles(element: HTMLElement, styles: CSSStyleDeclaration, computedStyle: CSSStyleDeclaration) {
	for (let i = 0; i < styles.length; i++) {
		const propertyName = styles[i];
		let propertyValue = computedStyle.getPropertyValue(propertyName);
		if (propertyName == 'width' && styles.getPropertyValue(propertyName) == 'fit-content') {
			propertyValue = 'fit-content';
		}
		if (propertyName.indexOf('margin') >= 0 && styles.getPropertyValue(propertyName).indexOf('auto') >= 0) {
		    propertyValue = styles.getPropertyValue(propertyName);
		}
		element.style.setProperty(propertyName, propertyValue);
	}
}

function parseAndApplyStyles(element: HTMLElement, sheet:CSSStyleSheet) {
	try {
		const computedStyle = getComputedStyle(element);
		for (let i = 0; i < sheet.cssRules.length; i++) {
			const rule = sheet.cssRules[i];
			if (rule instanceof CSSStyleRule && element.matches(rule.selectorText)) {
			  	applyStyles(element, rule.style, computedStyle);
			}
		}
	} catch (e) {
		console.warn("Unable to access stylesheet: " + sheet.href, e);
	}
}

function traverse(root: HTMLElement, sheet:CSSStyleSheet) {
	let element = root.firstElementChild;
	while (element) {
		if (element.tagName === 'svg') {
			// pass
		}
		else {
	  		traverse(element as HTMLElement, sheet);
		}
	  	element = element.nextElementSibling;
	}
	parseAndApplyStyles(root, sheet);
}

export async function CSSProcess(content: HTMLElement) {
	// 获取样式表
	const style = getStyleSheet();
	if (style) {
		traverse(content, style);
	}
}

export function parseCSS(css: string) {
	return getPostcss().parse(css);
}

export function ruleToStyle(rule: Postcss.Rule) {
	let style = '';	
	rule.walkDecls(decl => {
		style += decl.prop + ':' + decl.value + ';';
	})

	return style;
}

function processPseudoSelector(selector: string) {
	if (selector.includes('::before') || selector.includes('::after')) {
		selector = selector.replace(/::before/g, '').replace(/::after/g, '');
	}
	return selector;
}

function getPseudoType(selector: string) {
	if (selector.includes('::before')) {
		return 'before';
	}
	else if (selector.includes('::after')) {
		return 'after';
	}
	return undefined;
}

function applyStyle(root: HTMLElement, cssRoot: Postcss.Root) {
	if (root.tagName.toLowerCase() === 'a' && root.classList.contains('wx_topic_link')) {
		return;
	}

	const cssText = root.style.cssText;
	cssRoot.walkRules(rule => {
		const selector = processPseudoSelector(rule.selector);
		try {
			if (root.matches(selector)) {
				let item = root;

				const pseudoType = getPseudoType(rule.selector);
				if (pseudoType) {
					let content = '';
					rule.walkDecls('content', decl => {
						content = decl.value || '';
					})
					item = createSpan();
					if (content.startsWith('"') && content.length >= 2) {
						item.textContent = content.replace(/(^")|("$)/g, '');
					}
					else if (content.startsWith("'") && content.length >= 2) {
						item.textContent = content.replace(/(^')|('$)/g, '');
					}
					else {
						item.textContent = content;
					}

					if (pseudoType === 'before') {
						root.prepend(item);
					}
					else if (pseudoType === 'after') {
						root.appendChild(item);
					}
				}

				rule.walkDecls(decl => {
					// 如果已经设置了，则不覆盖
					const setted = cssText.includes(decl.prop);
					if (!setted || decl.important) {
						item.style.setProperty(decl.prop, decl.value);
					}
				})
			}
		}
		catch (err) {
			if (err.message && err.message.includes('is not a valid selector')) {
				return;
			}
			else {
				throw err;
			}
		}
	});

	if (root.tagName === 'svg') {
		return;
	}

	let element = root.firstElementChild;
	while (element) {
		applyStyle(element as HTMLElement, cssRoot);
	  	element = element.nextElementSibling;
	}
}

export function applyCSS(html: string, css: string) {
	const doc = sanitizeHTMLToDom(html);
	const root = doc.firstChild as HTMLElement;
	if (!root) {
		return html;
	}

	let cssRoot: Postcss.Root;
	try {
		cssRoot = getPostcss().parse(css);
	} catch (error) {
		console.warn("[ObsidianToMP] applyCSS fallback to original html:", error);
		return root.outerHTML;
	}
	applyStyle(root, cssRoot);
	return root.outerHTML;
}

export function normalizePasteHTML(html: string) {
	const doc = sanitizeHTMLToDom(html);
	const root = doc.firstChild as HTMLElement;
	if (!root) {
		return html;
	}

	const isInCodeSection = (el: Element) => !!el.closest('.code-section');

	root.querySelectorAll('pre').forEach((pre) => {
		const item = pre as HTMLElement;
		item.style.setProperty('white-space', 'pre');
		item.style.setProperty('word-break', 'normal');
		item.style.setProperty('overflow-x', 'auto');
	});

	root.querySelectorAll('pre code').forEach((code) => {
		const item = code as HTMLElement;
		item.style.setProperty('display', 'block');
		item.style.setProperty('white-space', 'pre');
	});

	root.querySelectorAll('ol').forEach((ol) => {
		const item = ol as HTMLElement;
		if (isInCodeSection(item)) {
			return;
		}
		item.style.setProperty('list-style-type', 'decimal');
		item.style.setProperty('padding-left', '1.5em');
	});

	root.querySelectorAll('ul').forEach((ul) => {
		const item = ul as HTMLElement;
		if (isInCodeSection(item)) {
			return;
		}
		item.style.setProperty('list-style-type', 'disc');
		item.style.setProperty('padding-left', '1.5em');
	});

	root.querySelectorAll('li').forEach((li) => {
		const item = li as HTMLElement;
		if (isInCodeSection(item)) {
			return;
		}
		item.style.setProperty('display', 'list-item');
	});

	root.querySelectorAll('.code-section ul').forEach((ul) => {
		const item = ul as HTMLElement;
		item.style.setProperty('list-style-type', 'none');
		item.style.setProperty('padding-left', '0');
		item.style.setProperty('margin', '0');
	});

	root.querySelectorAll('.code-section li').forEach((li) => {
		const item = li as HTMLElement;
		item.style.setProperty('display', 'block');
		item.style.setProperty('list-style-type', 'none');
		item.style.setProperty('margin', '0');
		item.style.setProperty('padding', '0');
	});

	return root.outerHTML;
}

function htmlToPlainText(html: string) {
	try {
		const doc = sanitizeHTMLToDom(html);
		return doc.textContent?.trim() || '';
	} catch (error) {
		console.warn('Failed to parse html to plain text:', error);
		return '';
	}
}

export async function writeHtmlToClipboard(html: string) {
	const text = htmlToPlainText(html) || html;

	if (navigator?.clipboard?.write) {
		const ClipboardItemCtor = (globalThis as any).ClipboardItem;
		if (ClipboardItemCtor) {
			try {
				await navigator.clipboard.write([
					new ClipboardItemCtor({
						'text/html': new Blob([html], { type: 'text/html' }),
						'text/plain': new Blob([text], { type: 'text/plain' }),
					}),
				]);
				return;
			} catch (error) {
				console.warn('navigator.clipboard.write failed, fallback to electron clipboard:', error);
			}
		}
	}

	try {
		const { clipboard } = require('electron');
		clipboard.write({ html, text });
		return;
	} catch (error) {
		console.warn('electron clipboard fallback failed:', error);
	}

	throw new Error('当前环境不支持写入剪贴板');
}

export function uevent(name: string) {
	// Analytics endpoint removed in local-first mode.
	return;
}

/**
 * 创建一个防抖函数
 * @param func 要执行的函数
 * @param wait 等待时间（毫秒）
 * @returns 防抖处理后的函数
 */
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
	let timeout: NodeJS.Timeout | null = null;

	return function(this: any, ...args: Parameters<T>) {
		const context = this;

		const later = () => {
			timeout = null;
			func.apply(context, args);
		};

		if (timeout !== null) {
			clearTimeout(timeout);
		}
		timeout = setTimeout(later, wait);
	};
}

export function cleanUrl(href: string) {
  try {
    href = encodeURI(href).replace(/%25/g, '%');
  } catch (e) {
    return null;
  }
  return href;
}

export async function waitForLayoutReady(app: App): Promise<void> {
  if (app.workspace.layoutReady) {
    return;
  }
  return new Promise((resolve) => {
    app.workspace.onLayoutReady(() => resolve());
  });
}


export function mimeToImageExt(type: string): string {
	const mimeToExt: { [key: string]: string } = {
		'image/jpeg': '.jpg',
		'image/jpg': '.jpg',
		'image/png': '.png',
		'image/gif': '.gif',
		'image/bmp': '.bmp',
		'image/webp': '.webp',
		'image/svg+xml': '.svg',
		'image/tiff': '.tiff'
	};
	return mimeToExt[type] || '.jpg';
}

export function imageExtToMime(ext: string): string {
	const extToMime: { [key: string]: string } = {
		'.jpg': 'image/jpeg',
		'.jpeg': 'image/jpeg',
		'.png': 'image/png',
		'.gif': 'image/gif',
		'.bmp': 'image/bmp',
		'.webp': 'image/webp',
		'.svg': 'image/svg+xml',
		'.tiff': 'image/tiff'
	};
	return extToMime[ext.toLowerCase()] || 'image/jpeg';
}

export function trimEmbedTag(name: string) {
	return name.trim().replace(/^!\[\[/, '').replace(/^\[\[/, '').replace(/]]$/, '');
}

const escapeMap: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
};

export function escapeHTML(str: string) {
  return str.replace(/[&<>"']/g, (ch) => escapeMap[ch]);
}

const FRONT_MATTER_REGEX = /^(---)$.+?^(---)$.+?/ims;
export function removeFrontMatter(md: string) {
	if (md.startsWith('---')) {
    return md.replace(FRONT_MATTER_REGEX, '');
  }
	return md;
}

/**
 * 版本比较函数
 * 比较两个版本号的大小
 * @param v1 版本号1
 * @param v2 版本号2
 * @returns 1 if v1 > v2, -1 if v1 < v2, 0 if v1 === v2
 */
export function compareVersions(v1: string, v2: string): number {
	const parts1 = v1.split('.').map(Number);
	const parts2 = v2.split('.').map(Number);
	
	const maxLength = Math.max(parts1.length, parts2.length);
	
	for (let i = 0; i < maxLength; i++) {
		const num1 = parts1[i] || 0;
		const num2 = parts2[i] || 0;
		
		if (num1 > num2) return 1;
		if (num1 < num2) return -1;
	}
	
	return 0;
}

/**
 * 检查版本是否符合目标版本要求
 * @param currentVersion 当前版本
 * @param targetVersion 目标版本表达式，如 ">2.0.0", "=2.0.0", "<2.0.0", ">=2.0.0", "<=2.0.0"
 * @returns 是否符合要求
 */
export function matchesVersionRequirement(currentVersion: string, targetVersion: string): boolean {
	if (!targetVersion || targetVersion.trim() === '') {
		return true; // 如果没有版本要求，则显示
	}

	const match = targetVersion.match(/^(>=|<=|>|<|=)(.+)$/);
	if (!match) {
		return true; // 如果格式不正确，默认显示
	}

	const operator = match[1];
	const requiredVersion = match[2].trim();
	const comparison = compareVersions(currentVersion, requiredVersion);

	switch (operator) {
		case '>':
			return comparison > 0;
		case '>=':
			return comparison >= 0;
		case '<':
			return comparison < 0;
		case '<=':
			return comparison <= 0;
		case '=':
			return comparison === 0;
		default:
			return true;
	}
}
