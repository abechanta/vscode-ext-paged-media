"use strict";
import path from "path";
import vscode from "vscode";
import Exporter from "./exporter";

const previewStyles = [
	["preset.preview.highlightPageMargin.lineColor", v => `--mpm-preview-page-margin-color: ${v};`],
	["preset.preview.emulatePageLayout.fontColor", v => `--mpm-preview-font-color: ${v};`],
	["preset.preview.emulatePageLayout.paperColor", v => `--mpm-preview-paper-color: ${v};`],
	["preset.preview.emulatePageLayout.cutOffColor", v => `--mpm-preview-cut-off-color: ${v};`],
	["preset.preview.emulateIn2Columns.margin", v => `--mpm-preview-page-margin: ${v}mm;`],
];
const previewStylesheets = [
	["preset.preview.highlightPageMargin.enable", v => `styles/preview/highlight-page-margin.css`],
	["preset.preview.emulatePageLayout.enable", v => `styles/preview/emulate-page-layout.css`],
	["preset.preview.emulateIn2Columns.enable", v => `styles/preview/emulate-in-2-columns.css`],
];
const presetStyles = [
];
const presetStylesheets = [
	["preset.pageLayout.base", v => `styles/page-layout/base.css`],
	["preset.pageLayout.size", v => `styles/page-layout/size/${v}.css`],
	["preset.pageLayout.marks", v => `styles/page-layout/marks/${v}.css`],
	["preset.pageLayout.bleed", v => `styles/page-layout/bleed/${v}.css`],
	["preset.pageLayout.margin", v => `styles/page-layout/margin/${v}.css`],
	["preset.pageLayout.pageNumber", v => `styles/page-layout/page-number/${v}.css`],
	["preset.pageLayout.hiddenPageNumber", v => `styles/page-layout/hidden-page-number/${v}.css`],
	["preset.pageLayout.runningHeader", v => `styles/page-layout/running-header/${v}.css`],
	["preset.contentLayout.pageBreakChapters", v => `styles/content-layout/page-break-chapters/${v}.css`],
	["preset.contentLayout.pageBreakCaptions", v => `styles/content-layout/page-break-captions/${v}.css`],
	["preset.contentLayout.widowsAndOrphans", v => `styles/content-layout/widows-and-orphans/${v}.css`],
	["preset.contentLayout.titlePage", v => `styles/content-layout/title-page/${v}.css`],
	["preset.contentLayout.colophonPage", v => `styles/content-layout/colophon-page/${v}.css`],
	["preset.contentLayout.tocPages", v => `styles/content-layout/toc-pages/${v}.css`],
	["preset.contentStyle.base", v => `styles/content-style/base.css`],
	["preset.contentStyle.chapterBorder", v => `styles/content-style/chapter-border/${v}.css`],
	["preset.contentStyle.chapterFontSize", v => `styles/content-style/chapter-font-size/${v}.css`],
	["preset.contentStyle.numberingChapters", v => `styles/content-style/numbering-chapters/${v}.css`],
	["preset.contentStyle.numberingCaptions", v => `styles/content-style/numbering-captions/${v}.css`],
	["preset.contentStyle.tagLinks", v => `styles/content-style/tag-links/${v}.css`],
];

// FIXME
// loading "previewer.js" from "markdown.previewScripts" causes csp violation,
// markdown previewer restricts to "script-src 'nonce-xxxxxxxxxxxxxxxx'", previewer.bundle.js has "unsafe-eval".
// so user must set "Markdown: Change Preview Security Settings" from "Strict" to "Disable" for each user document.
// refs: https://github.com/webpack/webpack/issues/6461

function activate(context) {
	const includeRe = /^!\[\s*rel=content\s*\]\(\s*([^\s)]+)\s*[^\s)]*\s*\)$/im;
	const slugify = str => encodeURIComponent(String(str || "__blank__").trim().toLowerCase().replace(/\s|[\]\[\!\"\#\$\%\&\'\(\)\*\+\,\.\/\:\;\<\=\>\?\@\\\^\_\{\|\}\~]/g, '-').replace(/-$/, ''));
	const hasTopPage = bodyMd => bodyMd?.split("\n")[0]?.includes("@toppage");
	const hasInclude = bodyMd => bodyMd?.match(includeRe);
	const exporter = new Exporter(context);
	let _md = null;
	let _didRecommend = false;

	const exporterBuilder = (title, exportFile) => () => {
		const uri = vscode.window.activeTextEditor?.document?.uri?.with();
		const bodyMd = vscode.window.activeTextEditor?.document?.getText();
		let bodyHtml = _md.render(bodyMd, { addStylesArgs: [true, ""], });
		if (!uri || !bodyMd || !bodyHtml || !hasTopPage(bodyMd)) {
			vscode.window.showInformationMessage(`${title}: Active document has no \"@toppage\" header at beggining. Exporting skipped.`);
			return undefined;
		}

		vscode.window.withProgress({
			title: title,
			location: vscode.ProgressLocation.Notification,
			cancellable: true,
		}, (progress, token) => {
			const exportOptions = {
				registerCancelHandler: onCancel => token.onCancellationRequested(() => onCancel()),
				reporter: progress,
				outlineTags: ["h1", "h2", "h3"],
			};

			progress.report({ increment: 10, message: "", });
			return exportFile.apply(exporter, [uri, bodyHtml, exportOptions]).then(uri => {
				vscode.window.showInformationMessage(`${title}: Done. ${uri.fsPath}`);
				return undefined;
			}).catch(message => {
				vscode.window.showErrorMessage(`${title}: ${message}`);
				return undefined;
			});
		});
	}

	context.subscriptions.push(
		vscode.commands.registerCommand('pagedView.exportPdf', exporterBuilder("Export in PDF Format", exporter.exportPdf)),
		vscode.commands.registerCommand('pagedView.exportHtml', exporterBuilder("Export in HTML Format", exporter.exportHtml)),
	);

	const getStyleTag = (myConfig, applyPreviewStyles) => {
		let styles = [];
		if (applyPreviewStyles) {
			styles.push(...previewStyles.map(v => v[1](myConfig.get(v[0]))));
		}
		styles.push(...presetStyles.map(v => v[1](myConfig.get(v[0]))));
		return styles.length > 0 ? `<style>
:root {
${styles.join("\n")}
}
</style>
` : "";
	};

	const getStyleLinks = (myConfig, applyPreviewStyles, stylesheetPrefix) => {
		let stylesheets = [];
		if (applyPreviewStyles) {
			stylesheets.push(...previewStylesheets.filter(v => myConfig.get(v[0])).map(v => v[1](myConfig.get(v[0]))))
		}
		stylesheets.push(...presetStylesheets.filter(v => myConfig.get(v[0])).map(v => v[1](myConfig.get(v[0]))))
		return stylesheets.map(stylesheet => `<link rel="stylesheet" type="text/css" href="${stylesheetPrefix}${path.resolve(context.extensionPath, stylesheet)}" />`).join("\n");
	}

	const addStyles = (bodyHtml, isExporting, stylesheetPrefix) => {
		const uri = vscode.window.activeTextEditor?.document?.uri?.with();
		const myConfig = vscode.workspace.getConfiguration("markdownPagedMedia", uri);
		if (myConfig.get("ignorePresetStyles")) {
			return bodyHtml;
		}
		const applyPreviewStyles = !isExporting || myConfig.get("applyPreviewStylesWhenExporting");
		const styleTag = getStyleTag(myConfig, applyPreviewStyles);
		const styleLinks = getStyleLinks(myConfig, applyPreviewStyles, stylesheetPrefix);
		return styleTag + styleLinks + bodyHtml;
	};

	const recommendUserSettings = () => {
		const bodyMd = vscode.window.activeTextEditor?.document?.getText();
		const uri = vscode.window.activeTextEditor?.document?.uri?.with();
		const markdownConfig = vscode.workspace.getConfiguration("markdown", uri);
		const scrollEditorWithPreview = !!markdownConfig.get("preview.scrollEditorWithPreview");
		if (!_didRecommend && hasTopPage(bodyMd) && hasInclude(bodyMd) && scrollEditorWithPreview) {
			_didRecommend = true;
			vscode.window.showInformationMessage("Recommended: When using W3C Paged Media Viewer, set \"markdown.preview.scrollEditorWithPreview\" to \"Off\". This will surpress unexpected scrolling of editor while editing.");
		}
	};

	return {
		extendMarkdownIt(md) {
			md.use(require("markdown-it-attrs"));
			md.use(require("markdown-it-kbd"));
			md.use(require("markdown-it-ruby"));
			md.use(require("markdown-it-div"));
			md.use(require("markdown-it-multimd-table"), { multiline: true, rowspan: true, headerless: true, });
			md.use(require("markdown-it-footnote-here"));
			md.use(require("./markdown-it-toc"), { slugify: slugify, selection: [1, 2, 3], });
			md.use(require("markdown-it-include"), { includeRe: includeRe, root: () => {
				return path.dirname(vscode.window.activeTextEditor?.document?.fileName);
			}, });

			const render = md.renderer.render;
			md.renderer.render = (tokens, options, env) => {
				try {
					recommendUserSettings();
					let bodyHtml = render.call(md.renderer, tokens, options, env);
					const addStylesArgs = env.addStylesArgs || [false, "https://file+.vscode-resource.vscode-cdn.net/"];
					bodyHtml = addStyles(bodyHtml, ...addStylesArgs);
					return bodyHtml;
				} catch (err) {
					const title = "Pagenate";
					vscode.window.showErrorMessage(`${title}: ${err.message}`);
					throw err;
				}
			};

			const highlight = md.options.highlight;
			md.options.highlight = (code, lang) => {
				return "";	// disable highlighter, here.
			};

			return _md = md;
		}
	};
}

exports.activate = activate;
