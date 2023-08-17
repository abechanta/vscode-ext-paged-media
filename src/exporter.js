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
			markdownExtention.packageJSON.contributes["markdown.previewStyles"].map(style => path.join(markdownExtention.extensionPath, style)),
			markdownConfig.get("styles"),
		);
	}

	_makeHtml(body, styles) {
		let linkNodes = styles.map(style => `<link rel="stylesheet" href="${style}" />`).join("\n");
		return `
<html style="${this.vscodeVars}">
	<head>
		<meta http-equiv="content-type" content="text/html;charset=utf-8">
		<meta http-equiv="Content-Security-Policy" content="">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
${linkNodes}
	</head>
	<body class="vscode-body">
${body}
	</body>
</html>`;
	}

	_exportHtml(uri, body, options) {
		const reporter = options.reporter;
		const html = uri.with({path: uri.path.toString().replace(/\.md$/, ".html")});
		const styles = this._getStyles(uri);
		let data = this._makeHtml(body, styles);
		data = (new TextEncoder).encode(data);
		return vscode.workspace.fs.writeFile(html, data).then(() => {
			reporter.report({ increment: 10, message: `Export HTML done: ${html.fsPath}`, });
			return html;
		});
	}

	_exportPdf(uri, options) {
		const reporter = options.reporter;
		const pdf = uri.with({path: uri.path.toString().replace(/\.html$/, ".pdf")});
		const headless = true;
		const allowLocal = true;
		const additionalScripts = [
			path.join(this.context.extensionPath, "dist", "browser.js"),
		];
		const printer = new Printer({ headless, allowLocal, additionalScripts, });
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
		if (!headless) {
			return Promise.race([canceled, printer.preview(uri.fsPath), ]).then(page => {
				return uri.toString();
			}).catch(err => {
				throw err;
			});
		}
		return Promise.race([canceled, printer.pdf(uri.fsPath, { "outlineTags": options.outlineTags, }), ]).then(content => {
			return Promise.race([canceled, vscode.workspace.fs.writeFile(pdf, content), ]);
		}).then(() => {
			return pdf.toString();
		}).catch(err => {
			throw err;
		});
	}

	exportFiles(uri, body, options) {
		return this._exportHtml(uri, body, options).then(html => this._exportPdf(html, options));
	}
};

export default Exporter;
