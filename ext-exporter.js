"use strict";
const path = require("path");
const vscode = require("vscode");
const child_process = require("child_process");

module.exports = function Exporter(context) {
	function _exportHtml(uri) {
		const html = uri.with({path: uri.path.toString().replace(/\.md$/, ".html")});
		var data = "---HTML CONTENT COMES HERE---\n";
		data = (new TextEncoder).encode(data);
		return vscode.workspace.fs.writeFile(html, data).then(() => {
			console.log(`export html done: ${html.fsPath}`);
			return html;
		});
	}

	function _exportPdf(uri) {
		const pdf = uri.with({path: uri.path.toString().replace(/\.html$/, ".pdf")});
		const proc = child_process.spawn("node", ["--version", ], { encoding: "utf8", cwd: context.extensionPath, });
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
			return _exportHtml(uri).then(html => {
				return _exportPdf(html);
			});
		}
	};
};
