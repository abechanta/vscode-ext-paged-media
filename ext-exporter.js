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

	function _exportHtml(uri, body, options) {
		const reporter = options.reporter;
		const html = uri.with({path: uri.path.toString().replace(/\.md$/, ".html")});
		var data = _makeHtml(body);
		data = (new TextEncoder).encode(data);
		return vscode.workspace.fs.writeFile(html, data).then(() => {
			reporter.report({ increment: 10, message: `export html done: ${html.fsPath}`, });
			return html;
		});
	}

	function _exportPdf(uri, options) {
		const reporter = options.reporter;
		const pdf = uri.with({path: uri.path.toString().replace(/\.html$/, ".pdf")});
		const cli = path.join(context.extensionPath, "node_modules", "pagedjs-cli", "bin", "paged");
		// NOTE: workaround for pagedjs-cli.
		// ---> pass "uri.fsPath.replace(...)" instead of "uri.fsPath"
		// this will surpress unexpected progress stopping when launching chromium.
		//
		// const proc = child_process.spawn("node", [cli, "--inputs", uri.fsPath, "--output", pdf.fsPath, ], { encoding: "utf8", cwd: context.extensionPath, });
		const proc = child_process.spawn("node", [cli, "--inputs", uri.fsPath.replace(/^[A-Za-z]:/, ""), "--output", pdf.fsPath, ], { encoding: "utf8", cwd: context.extensionPath, });
		reporter.report({ increment: 10, message: `invoke cli: args: ${proc.spawnargs}`, });
		const handler = options.registerCancelHandler;
		handler(() => {
			proc.kill("SIGTERM");
		});

		return new Promise((resolve, reject) => {
			proc.stdout.on("data", data => {
				reporter.report({ increment: 10, message: data.toString(), });
			});
			proc.stderr.on("data", data => {
				reporter.report({ increment: 10, message: data.toString(), });
			});
			proc.on("close", () => {
				reporter.report({ increment: 10, message: `export pdf done: ${pdf.fsPath}`, });
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
		exportFiles(uri, body, options) {
			return _exportHtml(uri, body, options).then(html => {
				return _exportPdf(html, options);
			});
		}
	};
};
