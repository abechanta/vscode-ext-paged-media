"use strict";
import path from "path";
import vscode from "vscode";
// import Printer from "pagedjs-cli";	// this line causes activation error concerning to "fileURLToPath" imported from this line.
import Printer from "./printer";		// so we fork it here.

class Exporter {
	constructor(context) {
		this.context = context;
		this.vscodeVars = "";
	}

	_getStyles(uri) {
		const markdownExtention = vscode.extensions.getExtension("vscode.markdown-language-features");
		const markdownConfig = vscode.workspace.getConfiguration("markdown", uri);
		return [].concat(
			markdownExtention.packageJSON.contributes["markdown.previewStyles"].map(style => path.resolve(markdownExtention.extensionPath, style)),
			markdownConfig.get("styles").map(style => path.resolve(path.dirname(uri.fsPath), style)),
		);
	}

	_prepareHtml(bodyHtml, uriContent) {
		const contentHtml = `
<html style="${this.vscodeVars}">
	<head>
		<meta http-equiv="content-type" content="text/html;charset=utf-8">
		<meta http-equiv="Content-Security-Policy" content="">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
	</head>
	<body class="vscode-body">
${bodyHtml}
	</body>
</html>`;
		const bodyEncoded = (new TextEncoder).encode(contentHtml);
		return vscode.workspace.fs.writeFile(uriContent, bodyEncoded)
			.then(() => uriContent);
	}

	_exportFile(uriSrc, uriDst, options, exporter) {
		const reporter = options.reporter;
		const headless = true;
		const allowLocal = true;
		const additionalScripts = [
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
				}).then(() => {
					return printer.close();
				}).then(() => uriDst),
		]).catch(err => {
			throw err;
		});
	}

	exportHtml(uri, bodyHtml, options) {
		options.styles = this._getStyles(uri);
		const uriSrcHtml = uri.with({ path: uri.path + ".1.html", });
		const uriDstHtml = uri.with({ path: uri.path + ".2.html", });
		return this._prepareHtml(bodyHtml, uriSrcHtml)
			.then(uriSrcHtml_ => {
				return this._exportFile(uriSrcHtml, uriDstHtml, options, (srcPath, printer, printerOption) => {
					return printer.html(srcPath, printerOption)
						.then(bodyHtml => {
							return (new TextEncoder).encode(bodyHtml);
						});
					});
			});
	}

	exportPdf(uri, bodyHtml, options) {
		options.styles = this._getStyles(uri);
		const uriSrcHtml = uri.with({ path: uri.path + ".1.html", });
		const uriPdf = uri.with({ path: uri.path + ".pdf", });
		return this._prepareHtml(bodyHtml, uriSrcHtml)
			.then(uriSrcHtml_ => {
				return this._exportFile(uriSrcHtml, uriPdf, options, (srcPath, printer, printerOption) => {
					return printer.pdf(srcPath, printerOption);
				});
			});
	}
};

export default Exporter;
