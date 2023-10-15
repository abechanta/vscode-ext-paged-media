"use strict";
import path from "path";
import vscode from "vscode";
import parser from "node-html-parser";
// import Printer from "pagedjs-cli";	// this line causes activation error concerning to "fileURLToPath" imported from this line.
import Printer from "./printer";		// so we fork it here.
import { downloadBrowser, } from "../node_modules/puppeteer/lib/cjs/puppeteer/node/install";

class Exporter {
	constructor(context) {
		this.context = context;
	}

	_getStyles(uri) {
		const markdownExtention = vscode.extensions.getExtension("vscode.markdown-language-features");
		const markdownConfig = vscode.workspace.getConfiguration("markdown", uri);
		return [].concat(
			markdownExtention.packageJSON.contributes["markdown.previewStyles"].map(style => path.resolve(markdownExtention.extensionPath, style)),
			markdownConfig.get("styles").map(style => path.resolve(path.dirname(uri.fsPath), style)),
		);
	}

	async _prepareHtml(uri, bodyHtml, uriContent) {
		this.vscodeVars = "padding: 0; margin: 0;";
		const markdownConfig = vscode.workspace.getConfiguration("markdown.preview", uri);
		// this.vscodeVars += `--markdown-font-family: -apple-system, BlinkMacSystemFont, &quot;Segoe WPC&quot;, &quot;Segoe UI&quot;, system-ui, &quot;Ubuntu&quot;, &quot;Droid Sans&quot;, sans-serif; --markdown-font-size: 14px; --markdown-line-height: 1.6;`;
		this.vscodeVars += `--markdown-font-family: ${markdownConfig.get("fontFamily")}; --markdown-font-size: ${markdownConfig.get("fontSize")}px; --markdown-line-height: ${markdownConfig.get("lineHeight")};`;
		this.vscodeVars += `--vscode-font-family: &quot;Segoe WPC&quot;, &quot;Segoe UI&quot;, sans-serif; --vscode-font-weight: normal; --vscode-font-size: 13px; --vscode-widget-border: #303031;`;
		const editorConfig = vscode.workspace.getConfiguration("editor", uri);
		// this.vscodeVars += `--vscode-editor-font-family: &quot;MyricaM M&quot;, Consolas, &quot;Courier New&quot;, monospace; --vscode-editor-font-weight: normal; --vscode-editor-font-size: 18px;`;
		this.vscodeVars += `--vscode-editor-font-family: ${editorConfig.get("fontFamily")}; --vscode-editor-font-weight: ${editorConfig.get("fontWeight")}; --vscode-editor-font-size: ${editorConfig.get("fontSize")}px;`;
		const contentHtml = `
<!DOCTYPE html>
<html style="${this.vscodeVars}">
	<head>
		<meta http-equiv="content-type" content="text/html;charset=utf-8">
		<meta http-equiv="Content-Security-Policy" content="">
		<meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no">
	</head>
	<body class="vscode-body wordWrap" style="padding: 0; margin: 0; /*overflow: hidden;*/ /*width: 100%;*/ /*height: 100%;*/ overscroll-behavior-x: none;">
		<div class="markdown-body">
${bodyHtml}
		</div>
	</body>
</html>`;
		const bodyEncoded = (new TextEncoder).encode(contentHtml);
		return vscode.workspace.fs.writeFile(uriContent, bodyEncoded)
			.then(() => uriContent);
	}

	async _prepareBrowser(options) {
		const reporter = options.reporter;
		reporter.report({ increment: 1, message: `Loading browser...`, });
		// process.env['PUPPETEER_EXECUTABLE_PATH'] = "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe";
		return downloadBrowser();
	}

	async _exportFile(uriSrc, uriDst, options, exporter) {
		const reporter = options.reporter;
		const headless = true;
		const allowLocal = true;
		const additionalScripts = [
			path.join(this.context.extensionPath, "dist", "previewer.bundle.js"),
			path.join(this.context.extensionPath, "dist", "browser.js"),
		];
		const printer = new Printer({ headless, allowLocal, additionalScripts, "styles": options.styles, });
		printer.on("page", page => {
			reporter.report(page.position == 0 ?
				{ increment: 10, message: `Loading browser done.`, } :
				{ increment: 1, message: `Rendering page: ${page.position + 1}`, }
			);
		});
		printer.on("rendered", message => {
			reporter.report({ increment: 10, message: `Generating: ${message}`, });
		});
		printer.on("postprocessing", message => {
			reporter.report({ increment: 10, message: `Postprocessing: ${message}`, });
		});

		const handler = options.registerCancelHandler;
		const canceled = new Promise((resolve, reject) => {
			handler(() => reject("Canceled"));
		});
		return Promise.race([
			canceled,
			exporter(uriSrc.fsPath, printer, { "outlineTags": options.outlineTags, })
				.then(content => {
					return vscode.workspace.fs.writeFile(uriDst, content);
				}).then(() => uriDst),
		]).catch(err => {
			throw err;
		});
	}

	async exportHtml(uri, bodyHtml, options) {
		options.styles = this._getStyles(uri);
		const uriSrcHtml = uri.with({ path: uri.path + ".1.html", });
		const uriDstHtml = uri.with({ path: uri.path + ".2.html", });
		return this._prepareBrowser(options)
			.then(() => {
				return this._prepareHtml(uri, bodyHtml, uriSrcHtml)
			})
			.then(uriSrcHtml_ => {
				return this._exportFile(uriSrcHtml, uriDstHtml, options, (srcPath, printer, printerOption) => {
					return printer.html(srcPath, printerOption)
						.then(bodyHtml => {
							const html = parser.parse(bodyHtml)
							html.getElementsByTagName("script").forEach(tag => tag.tagName = "noscript");
							return (new TextEncoder).encode(html.outerHTML);
						});
					});
			});
	}

	async exportPdf(uri, bodyHtml, options) {
		options.styles = this._getStyles(uri);
		const uriSrcHtml = uri.with({ path: uri.path + ".1.html", });
		const uriPdf = uri.with({ path: uri.path + ".pdf", });
		return this._prepareBrowser(options)
			.then(() => {
				return this._prepareHtml(uri, bodyHtml, uriSrcHtml);
			})
			.then(uriSrcHtml_ => {
				return this._exportFile(uriSrcHtml, uriPdf, options, (srcPath, printer, printerOption) => {
					return printer.pdf(srcPath, printerOption);
				});
			});
	}
};

export default Exporter;
