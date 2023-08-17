"use strict";
import path from "path";
import vscode from "vscode";
import Printer from "pagedjs-cli";
const vscodeVars = "";

module.exports = function Exporter(context) {
	function _getStyles(uri) {
		let styles = [];
		const markdownExtention = vscode.extensions.getExtension("vscode.markdown-language-features");
		for (const style of markdownExtention.packageJSON.contributes["markdown.previewStyles"]) {
			styles.push(path.join(markdownExtention.extensionPath, style));
		}
		const markdownConfig = vscode.workspace.getConfiguration("markdown", uri);
		for (const style of markdownConfig.get("styles")) {
			styles.push(style);
		}
		return styles;
	}

	function _makeHtml(body, styles) {
		const script = path.join(context.extensionPath, "out", "loading.bundle.js");
		const config = path.join(context.extensionPath, "paged-config.js");
		const re = /.*(\<\s*link[^\>]*rel=['"]stylesheet['"][^\>]*\>).*/;
		let linkNodes = "", node;
		for (const style of styles) {
			linkNodes += `<link rel="stylesheet" href="${style}" />\n`;
		}
		while (node = re.exec(body)) {
			linkNodes += node[0] + "\n";
			body = body.substr(0, node.index) + body.substr(node.index + node[0].length);
		}
		return `
<html style="${vscodeVars}">
	<head>
		<meta http-equiv="content-type" content="text/html;charset=utf-8">
		<meta http-equiv="Content-Security-Policy" content="">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
${linkNodes}
		<script src="${config}"></script>
		<!--<script src="${script}"></script>-->
	</head>
	<body class="vscode-body">
${body}
	</body>
</html>`;
	}

	function _exportHtml(uri, body, options) {
		const reporter = options.reporter;
		const html = uri.with({path: uri.path.toString().replace(/\.md$/, ".html")});
		const styles = _getStyles(uri);
		let data = _makeHtml(body, styles);
		data = (new TextEncoder).encode(data);
		return vscode.workspace.fs.writeFile(html, data).then(() => {
			reporter.report({ increment: 10, message: `Export HTML done: ${html.fsPath}`, });
			return html;
		});
	}

	function _exportPdf(uri, options) {
		const reporter = options.reporter;
		const pdf = uri.with({path: uri.path.toString().replace(/\.html$/, ".pdf")});
		const headless = true;
		const allowLocal = true;
		
		const additionalScripts = [
			path.join(context.extensionPath, "dist", "browser.js"),
			// "C:/Users/abech/Documents/dev/vscode-ext-paged-media/dist/browser.js",
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
		return Promise.race([canceled, printer.pdf(uri.fsPath, { "outlineTags": [ "h1", "h2", "h3", ], }), ]).then(content => {
			return Promise.race([canceled, vscode.workspace.fs.writeFile(pdf, content), ]);
		}).then(() => {
			return pdf.toString();
		}).catch(err => {
			throw err;
		});
	}

	return {
		exportFiles(uri, body, options) {
			return _exportHtml(uri, body, options).then(html => _exportPdf(html, options));
		}
	};
};
