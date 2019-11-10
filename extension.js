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
                    // FIXME: Injection here causes following console error,
                    // "Refused to load the script 'vscode-resource://file/xxxxxxxxxxxxxxxx/media/paged.polyfill.js' because it violates the following Content Security Policy directive: "script-src 'nonce-xxxxxxxxxxxxxxxx'"."
                    // then displays notification.
                    // "Some content has been disabled in this document."
                    // Users must set "Select security setting for Markdown previews in this workspace" from "Strict" to "Disable",
                    // but another console error will occur.
                    // "Failed to load resource: net::ERR_ACCESS_DENIED"
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
