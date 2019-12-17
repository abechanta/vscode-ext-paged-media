"use strict";
const child_process = require("child_process");

module.exports = function Exporter(context) {
	function _exportPdf(uri) {
		const proc = child_process.spawn("node", ["--version", ], { encoding: "utf8", cwd: context.extensionPath, });
		console.log(`invoke cli: args: ${proc.spawnargs}`);
		return new Promise((resolve, reject) => {
			proc.stdout.on("data", data => {
				console.log(data.toString());
			});
			proc.on("close", () => {
				console.log(`export pdf done: ${uri.fsPath}`);
				resolve(uri);
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
			return _exportPdf(uri);
		}
	};
};
