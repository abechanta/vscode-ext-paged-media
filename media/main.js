// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
    const vscode = acquireVsCodeApi();

    window.addEventListener('load', event => {
        console.log("vscode ready! ", vscode);
    });
}());
