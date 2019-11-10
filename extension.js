'use strict'
const path = require("path");
const vscode = require("vscode");

function activate(context) {
    // TODO
    // File "media/paged.polyfill.js" should be copied automatically from node_modules folder.
    const scriptUri = vscode.Uri.file(
        path.join(context.extensionPath, "media", "paged.polyfill.js")
    ).with({ scheme: 'vscode-resource' });

    return {
        extendMarkdownIt(md) {
            // md.use(require('markdown-it-'));

            const render = md.renderer.render;
            md.renderer.render = (tokens, options, env) => {
                try {
                    const html = render.call(md.renderer, tokens, options, env);
					// FIXME
					// loading pagedjs polyfill here causes "net::ERR_ACCESS_DENIED" caused by csp violation supposedly,
					// markdown previewer restricts to "script-src 'nonce-xxxxxxxxxxxxxxxx'", loading.bundle.js has "vscode-resource:".
                    const scriptLink = `<script src="${scriptUri}"></script>`;
                    return [ scriptLink, html, ].join("\n");
                } catch (err) {
                    throw err;
                }
            };

            const highlight = md.options.highlight;
            md.options.highlight = (code, lang) => {
                // highlight reserves "pre" block to render... this is not good method for paged media...
                if (lang && lang.match(/\bstyle\b/i)) {
                    return `<style>${code}</style>`;
                }
                return highlight(code, lang);
            };

            return md;
        }
    };
}
exports.activate = activate;
