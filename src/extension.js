"use strict";
import path from "path";
import vscode from "vscode";
import Exporter from "./exporter";

// FIXME
// loading "previewer.js" from "markdown.previewScripts" causes csp violation,
// markdown previewer restricts to "script-src 'nonce-xxxxxxxxxxxxxxxx'", previewer.bundle.js has "unsafe-eval".
// so user must set "Markdown: Change Preview Security Settings" from "Strict" to "Disable" for each user document.
// refs: https://github.com/webpack/webpack/issues/6461

function activate(context) {
	const includeRe = /^!\[\s*rel=content\s*\]\(\s*([^\s)]+)\s*[^\s)]*\s*\)$/im;
	const slugify = str => encodeURIComponent(String(str || "__blank__").trim().toLowerCase().replace(/\s|[\]\[\!\"\#\$\%\&\'\(\)\*\+\,\.\/\:\;\<\=\>\?\@\\\^\_\{\|\}\~]/g, '-').replace(/-$/, ''));
	const hasTopPage = tokens => (tokens[0].type == "html_block") && (tokens[0].content.includes("@toppage"));
	const hasInclude = bodyMd => bodyMd.match(includeRe);
	const exporter = new Exporter(context);
	let document = {
		uri: undefined,
		bodyHtml: undefined,
		bodyMd: undefined,
		bodyMdTokens: undefined,
	};
	let didRecommend = false;

	const exporterBuilder = (title, exportFile) => () => {
		if (!document.uri || !document.bodyHtml ||!document.bodyMd ||!document.bodyMdTokens || !hasTopPage(document.bodyMdTokens)) {
			vscode.window.showInformationMessage(`${title}: Active document has no \"@toppage\" header at beggining. Exporting skipped.`);
			return undefined;
		}
		vscode.window.withProgress({
			title: title,
			location: vscode.ProgressLocation.Notification,
			cancellable: true,
		}, (progress, token) => {
			const exportOptions = {
				registerCancelHandler: onCancel => token.onCancellationRequested(() => onCancel()),
				reporter: progress,
				outlineTags: ["h1", "h2", "h3"],
			};

			progress.report({ increment: 10, message: "", });
			return exportFile.apply(exporter, [document.uri, document.bodyHtml, exportOptions]).then(uri => {
				vscode.window.showInformationMessage(`${title}: Done. ${uri.fsPath}`);
				return undefined;
			}).catch(message => {
				vscode.window.showErrorMessage(`${title}: ${message}`);
				return undefined;
			});
		});
	}

	context.subscriptions.push(
		vscode.commands.registerCommand('pagedView.exportPdf', exporterBuilder("Export in PDF Format", exporter.exportPdf)),
		vscode.commands.registerCommand('pagedView.exportHtml', exporterBuilder("Export in HTML Format", exporter.exportHtml)),
	);

	const recommendUserSettings = (tokens, doc) => {
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

	return {
		extendMarkdownIt(md) {
			md.use(require("markdown-it-attrs"));
			md.use(require("markdown-it-kbd"));
			md.use(require("markdown-it-ruby"));
			md.use(require("markdown-it-div"));
			md.use(require("markdown-it-multimd-table"), { multiline: true, rowspan: true, headerless: true, });
			md.use(require("markdown-it-footnote-here"));
			md.use(require("./markdown-it-toc"), { slugify: slugify, selection: [1, 2, 3], });
			md.use(require("markdown-it-include"), { includeRe: includeRe, root: () => {
				return path.dirname(vscode.window.activeTextEditor.document.fileName);
			}, });

			const render = md.renderer.render;
			md.renderer.render = (tokens, options, env) => {
				try {
					document.bodyHtml = render.call(md.renderer, tokens, options, env);
					document.bodyMdTokens = tokens;
					document.bodyMd = vscode.window.activeTextEditor.document.getText();
					document.uri = vscode.window.activeTextEditor.document.uri.with();
					recommendUserSettings(tokens, document);
					return document.bodyHtml;
				} catch (err) {
					const title = "Pagenate";
					vscode.window.showErrorMessage(`${title}: ${err.message}`);
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