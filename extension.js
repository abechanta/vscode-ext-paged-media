"use strict";
const path = require("path");
const vscode = require("vscode");
const Exporter = require("./ext-exporter");

// FIXME
// loading "loading.js" from "markdown.previewScripts" causes csp violation,
// markdown previewer restricts to "script-src 'nonce-xxxxxxxxxxxxxxxx'", loading.bundle.js has "unsafe-eval".
// so user must set "Markdown: Change Preview Security Settings" from "Strict" to "Disable" for each user document.
// refs: https://github.com/webpack/webpack/issues/6461

function activate(context) {
	const exporter = Exporter(context);
	const includeRe = /^!\[\s*rel=content\s*\]\(\s*([^\s)]+)\s*[^\s)]*\s*\)$/im;
	let document = {
		uri: undefined,
		bodyHtml: undefined,
		bodyMd: undefined,
	};
	let didRecommend = false;

	context.subscriptions.push(
		vscode.commands.registerCommand('pagedView.exportPdf', () => {
			const title = "Export in PDF Format";
			vscode.window.withProgress({
				title: title,
				location: vscode.ProgressLocation.Notification,
				cancellable: true,
			}, (progress, token) => {
				const registerCancelHandler = onCancel => {
					token.onCancellationRequested(() => {
						onCancel();
					});
				};

				progress.report({ increment: 10, message: "", });
				return exporter.exportFiles(document.uri, document.bodyHtml, { registerCancelHandler: registerCancelHandler, reporter: progress, }).then(message => {
					vscode.window.showInformationMessage(`${title}: done.\n${message}`);
					return undefined;
				}).catch(message => {
					vscode.window.showErrorMessage(`${title}: ${message}`);
					return undefined;
				});
			});
		})
	);

	const recommendUserSettings = function (tokens, doc) {
		const hasTopPage = tokens => (tokens[0].type == "html_block") && (tokens[0].content.includes("@toppage"));
		const hasInclude = bodyMd => bodyMd.match(includeRe);
		if (didRecommend || !hasTopPage(tokens) || !hasInclude(doc.bodyMd)) {
			return;
		}
		didRecommend = true;
		const markdownConfig = vscode.workspace.getConfiguration("markdown", doc.uri);
		const scrollEditorWithPreview = !!markdownConfig.get("preview.scrollEditorWithPreview");
		if (scrollEditorWithPreview) {
			vscode.window.showInformationMessage("Recommended: When using W3C Paged Media Viewer, set \"markdown.preview.scrollEditorWithPreview\" to \"Off\". This will surpress unexpected scrolling of editor while editing.");
		}
	};

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
			md.use(require("markdown-it-multimd-table"), { multiline: true, rowspan: true, headerless: true, });
			md.use(require("markdown-it-footnote-conventional"));
			md.use(require("./markdown-it-toc"), { slugify: slugify, selection: [1, 2, 3], });
			md.use(require("markdown-it-include"), { includeRe: includeRe, root: () => path.dirname(vscode.window.activeTextEditor.document.fileName), });

			const render = md.renderer.render;
			md.renderer.render = (tokens, options, env) => {
				try {
					document.bodyHtml = render.call(md.renderer, tokens, options, env);
					document.bodyMd = vscode.window.activeTextEditor.document.getText();
					document.uri = vscode.window.activeTextEditor.document.uri.with();
					recommendUserSettings(tokens, document);
					return document.bodyHtml;
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
