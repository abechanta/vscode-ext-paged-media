'use strict'

function activate(context) {
	return {
		extendMarkdownIt(md) {
			// md.use(require('markdown-it-'));

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
