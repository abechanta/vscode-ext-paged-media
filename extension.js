'use strict'

// FIXME
// loading "loading.js" from "markdown.previewScripts" causes csp violation,
// markdown previewer restricts to "script-src 'nonce-xxxxxxxxxxxxxxxx'", loading.bundle.js has "unsafe-eval".
// so user must set "Markdown: Change Preview Security Settings" from "Strict" to "Disable" for each user document.
// refs: https://github.com/webpack/webpack/issues/6461

function activate(context) {
	const slugify = function (str) {
		str = str || "__blank__";
		return encodeURIComponent(String(str).trim().toLowerCase().replace(/\s|[\]\[\!\"\#\$\%\&\'\(\)\*\+\,\.\/\:\;\<\=\>\?\@\\\^\_\{\|\}\~]/g, '-'));
	};

	const numbering = function (opts) {
		const opts_ = Object.assign({}, {
			selection: [1, 2, 3, 4, 5, 6],
		}, opts);
		const isSelectedNumber = selection => level => level >= selection;
		const isSelectedArray = selection => level => selection.includes(level);
		const isSelected = selection => Array.isArray(selection) ? isSelectedArray(selection) : isSelectedNumber(selection);
		var chapters = [];
		var lineNumber = 0;

		return (token, opts) => {
			const re = /^h([1-6])$/i;
			const level = parseInt(re.exec(token.tag)[1]);
			if (
				!isSelected(opts_.selection)(level) ||
				(opts.title === "")
			) {
				return;
			}

			if (lineNumber >= token.map[0]) {
				// beginning of document detected.
				chapters = [];
			}
			lineNumber = token.map[0];

			if (chapters.length >= level) {
				chapters = chapters.splice(0, level);
				chapters[level - 1]++;
			} else {
				while (chapters.length < level) {
					chapters.push(1);
				}
			}

			token.attrSet("data-chapter-number", chapters.join("."));
		};
	};

	return {
		extendMarkdownIt(md) {
			md.use(require("markdown-it-attrs"));
			md.use(require("markdown-it-kbd"));
			md.use(require("markdown-it-ruby"));
			md.use(require("markdown-it-div"));
			md.use(require("markdown-it-multimd-table"), { enableMultilineRows: true, enableRowspan: true, });
			md.use(require("markdown-it-footnote-conventional"));

			// syntax for toc.
			md.use(require("markdown-it-anchor"), { slugify: slugify, callback: numbering({ selection: [1, 2, 3], }), });
			md.use(require("markdown-it-toc-done-right"), { slugify: slugify, level: [1, 2, 3], });

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
