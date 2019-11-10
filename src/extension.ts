import * as path from 'path';
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('pagedMedia.open', () => {
			ViewerPanel.createOrShow(context.extensionPath);
		})
	);
}

class ViewerPanel {
	public static currentPanel: ViewerPanel | undefined;

	public static readonly viewType = 'pagedMedia';

	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionPath: string;
	private _disposables: vscode.Disposable[] = [];

	public static createOrShow(extensionPath: string) {
		const column = vscode.ViewColumn.Beside;

		// If we already have a panel, show it.
		if (ViewerPanel.currentPanel) {
			ViewerPanel.currentPanel._panel.reveal(column);
			return;
		}

		// Otherwise, create a new panel.
		const panel = vscode.window.createWebviewPanel(
			ViewerPanel.viewType,
			'Paged Media',
			column,
			{
				enableScripts: true,
				retainContextWhenHidden: true,
				localResourceRoots: [vscode.Uri.file(path.join(extensionPath, 'media'))]
			}
		);

		ViewerPanel.currentPanel = new ViewerPanel(panel, extensionPath);
	}

	private constructor(panel: vscode.WebviewPanel, extensionPath: string) {
		this._panel = panel;
		this._extensionPath = extensionPath;

		// Set the webview's initial html content
		this._update();

		// Listen for when the panel is disposed
		// This happens when the user closes the panel or when the panel is closed programatically
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		// Update the content based on view changes
		this._panel.onDidChangeViewState(
			e => {
				if (this._panel.visible) {
					this._update();
				}
			},
			null,
			this._disposables
		);
	}

	public dispose() {
		ViewerPanel.currentPanel = undefined;

		// Clean up our resources
		this._panel.dispose();

		while (this._disposables.length) {
			const x = this._disposables.pop();
			if (x) {
				x.dispose();
			}
		}
	}

	private _update() {
		const scriptUri = vscode.Uri.file(
			path.join(this._extensionPath, 'media', 'main.js')
		).with({ scheme: 'vscode-resource' });
		// TODO
		// File "/media/paged.polyfill.js" is copied from node_modules folder by hand. This should be done by build scripts.
		const pagedjsUri = vscode.Uri.file(
			path.join(this._extensionPath, 'media', 'paged.polyfill.js')
		).with({ scheme: 'vscode-resource' });
		// TODO
		// Should be read from workspace file.
		const styleUri = vscode.Uri.file(
			path.join(this._extensionPath, 'media', 'a4.css')
		).with({ scheme: 'vscode-resource' });

		// Use a nonce to whitelist which scripts can be run
		const nonce = getNonce();

		// Get content from activeEditor
		const bodyContent = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.document.getText() : "<h1>Hello World.</h1>";

		// To surpress error message below, we'll grant 'unsafe-eval' for script.
		// ---> Uncaught EvalError: Refused to evaluate a string as JavaScript because 'unsafe-eval' is not an allowed source of script in the following Content Security Policy directive: "script-src 'nonce-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'".
		// To surpress error message below, we'll grant 'unsafe-inline' for style-src.
		// ---> paged.polyfill.js:24272 Refused to apply inline style because it violates the following Content Security Policy directive: "default-src 'none'". Either the 'unsafe-inline' keyword, a hash ('sha256-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'), or a nonce ('nonce-...') is required to enable inline execution. Note also that 'style-src' was not explicitly set, so 'default-src' is used as a fallback.
		// To surpress error message below, we'll grant 'data:' for img-src.
		// ---> Refused to load the image '<URL>' because it violates the following Content Security Policy directive: "img-src vscode-resource:".
		// To surpress error message below, we'll grant 'vscode-resource:' for connect-src & style-src.
		// ---> Refused to connect to 'vscode-resource:................/media/a4.css' because it violates the following Content Security Policy directive: "default-src 'none'". Note that 'connect-src' was not explicitly set, so 'default-src' is used as a fallback.
		this._panel.webview.html = `<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta http-equiv="Content-Security-Policy" content="default-src 'none'; connect-src vscode-resource:; img-src vscode-resource: data:; script-src 'nonce-${nonce}' 'unsafe-eval'; style-src 'unsafe-inline' vscode-resource:;">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<script nonce="${nonce}" src="${pagedjsUri}"></script>
		<script nonce="${nonce}" src="${scriptUri}"></script>
		<link rel="stylesheet" href="${styleUri}" />
	</head>
	<body>
${bodyContent}
	</body>
</html>`;
	}
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}
