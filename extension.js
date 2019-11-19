'use strict'

// FIXME
// loading "loading.js" from "markdown.previewScripts" causes csp violation,
// markdown previewer restricts to "script-src 'nonce-xxxxxxxxxxxxxxxx'", loading.bundle.js has "unsafe-eval".
// so user must set "Markdown: Change Preview Security Settings" from "Strict" to "Disable" for each user document.
// refs: https://github.com/webpack/webpack/issues/6461

function activate(context) {
	return {
		extendMarkdownIt(md) {
			md.use(require("markdown-it-attrs"));
			md.use(require("markdown-it-kbd"));
			md.use(require("markdown-it-ruby"));

			const render = md.renderer.render;
			md.renderer.render = (tokens, options, env) => {
				try {
					return render.call(md.renderer, tokens, options, env);
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
