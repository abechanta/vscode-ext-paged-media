"use strict";
const path = require("path");
const vscode = require("vscode");
const child_process = require("child_process");

module.exports = function Exporter(context) {
	function _makeHtml(body) {
		const styleBase = path.join(context.extensionPath, "media", "github-markdown.css");
		const re = /.*(\<\s*link[^\>]*rel=['"]stylesheet['"][^\>]*\>).*/;
		var links = "", styles;
		while (styles = re.exec(body)) {
			links += styles[0];
			body = body.substr(0, styles.index) + body.substr(styles.index + styles[0].length);
		}
		return `
<html>
	<head>
		<meta http-equiv="content-type" content="text/html;charset=utf-8">
		<meta http-equiv="Content-Security-Policy" content="">
		<link rel="stylesheet" href="${styleBase}" />
${links}
	</head>
	<body class="vscode-body">
		<div class="markdown-body">
${body}
		</div>
	</body>
</html>`;
	}

	function _exportHtml(uri, body) {
		const html = uri.with({path: uri.path.toString().replace(/\.md$/, ".html")});
		var data = _makeHtml(body);
		data = (new TextEncoder).encode(data);
		return vscode.workspace.fs.writeFile(html, data).then(() => {
			console.log(`export html done: ${html.fsPath}`);
			return html;
		});
	}

	function _exportPdf(uri) {
		const pdf = uri.with({path: uri.path.toString().replace(/\.html$/, ".pdf")});
		const cli = path.join(context.extensionPath, "node_modules", "pagedjs-cli", "bin", "paged");
		// NOTE: workaround for pagedjs-cli.
		// ---> pass "uri.fsPath.replace(...)" instead of "uri.fsPath"
		// this will surpress unexpected progress stopping when launching chromium.
		//
		// const proc = child_process.spawn("node", [cli, "--inputs", uri.fsPath, "--output", pdf.fsPath, ], { encoding: "utf8", cwd: context.extensionPath, });
		const proc = child_process.spawn("node", [cli, "--inputs", uri.fsPath.replace(/^[A-Za-z]:/, ""), "--output", pdf.fsPath, ], { encoding: "utf8", cwd: context.extensionPath, });
		console.log(`invoke cli: args: ${proc.spawnargs}`);
		return new Promise((resolve, reject) => {
			proc.stdout.on("data", data => {
				console.log(data.toString());
			});
			proc.on("close", () => {
				console.log(`export pdf done: ${pdf.fsPath}`);
				resolve(pdf);
			});
			proc.on("error", err => {
				reject(err.message);
			});
			proc.on("exit", (code, signal) => {
				if (code > 0) {
					reject(`process terminated with exit code: ${code}`);
				}
				if (signal) {
					reject(`process terminated with signal: ${signal}`);
				}
			});
		});
	}

	return {
		exportFiles(uri, body) {
			return _exportHtml(uri, body).then(html => {
				return _exportPdf(html);
			});
		}
	};
};
