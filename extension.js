"use strict";
const path = require("path");
const vscode = require("vscode");
const Exporter = require("./ext-exporter");
const sleep = sec => {
	return new Promise((resolve, reject) => {
		setTimeout(Math.random() < 0.5 ? resolve : reject, sec * 1000, new vscode.Uri({path: process.cwd(), scheme: "file", }));
	});
};

// FIXME
// loading "loading.js" from "markdown.previewScripts" causes csp violation,
// markdown previewer restricts to "script-src 'nonce-xxxxxxxxxxxxxxxx'", loading.bundle.js has "unsafe-eval".
// so user must set "Markdown: Change Preview Security Settings" from "Strict" to "Disable" for each user document.
// refs: https://github.com/webpack/webpack/issues/6461

function activate(context) {
	context.subscriptions.push(
		vscode.commands.registerCommand('pagedView.exportPdf', () => {
			const title = "Export in PDF Format";
			vscode.window.withProgress({
				title: title,
				location: vscode.ProgressLocation.Notification,
				cancellable: true,
			}, (progress, token) => {
				token.onCancellationRequested(() => {
					// subprocess.kill("SIGTERM");
					vscode.window.showWarningMessage(`${title}: cancelled.`);
				});

				progress.report({ increment: 10, message: "", });
				return sleep(3).then(message => {
					vscode.window.showInformationMessage(`${title}: done.\n${message}`);
					return null;
				}).catch(message => {
					vscode.window.showErrorMessage(`${title}: failed.\n${message}`);
					return null;
				});
			});
		})
	);

	const slugify = function (str) {
		str = str || "__blank__";
		return encodeURIComponent(String(str).trim().toLowerCase().replace(/\s|[\]\[\!\"\#\$\%\&\'\(\)\*\+\,\.\/\:\;\<\=\>\?\@\\\^\_\{\|\}\~]/g, '-'));
	};

	return {
		extendMarkdownIt(md) {
			md.use(require("markdown-it-attrs"));
			md.use(require("markdown-it-kbd"));
			md.use(require("markdown-it-ruby"));
			md.use(require("markdown-it-div"));
			md.use(require("markdown-it-multimd-table"), { enableMultilineRows: true, enableRowspan: true, });
			md.use(require("markdown-it-footnote-conventional"));
			md.use(require("./markdown-it-toc"), { slugify: slugify, selection: [1, 2, 3], });
			md.use(require("./markdown-it-link-completing"));
			md.use(require("markdown-it-include"), { includeRe: /!\[\s*rel=content\s*\]\(\s*([^\s)]+)\s*[^\s)]*\s*\)/i, root: () => path.dirname(vscode.window.activeTextEditor.document.fileName), });

			const exporter = Exporter(context);
			const render = md.renderer.render;
			md.renderer.render = (tokens, options, env) => {
				try {
					const body = render.call(md.renderer, tokens, options, env);
					const uri = vscode.window.activeTextEditor.document.uri;
					exporter.exportFiles(uri, body).then(() => {
						console.log("successfully finished.");
					});
					return body;
				} catch (err) {
					throw err;
				}
			};

			const highlight = md.options.highlight;
			md.options.highlight = (code, lang) => {
				return "";	// disable highlighter, here.
			};

			return md;
		}
	};
}
exports.activate = activate;
