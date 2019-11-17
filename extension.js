'use strict';
const pagedjs = require("pagedjs");
const JSDOM = require("jsdom").JSDOM;

function prepareDomGlobals() {
	const jsdom = new JSDOM("", { pretendToBeVisual: true, });

	global.document = jsdom.window.document;
	global.document.fonts = []
	global.NodeFilter = jsdom.window.NodeFilter;
	global.performance = jsdom.window.performance;
	global.window = jsdom.window;

	global.requestAnimationFrame = jsdom.window.requestAnimationFrame;
	global.cancelAnimationFrame = jsdom.window.cancelAnimationFrame;

	// FIXME
	// TypeError: document.createRange is not a function
	// TypeError: range.createContextualFragment is not a function
	global.document.createRange = function() {
		return {
			setEnd: function() {},
			setStart: function() {},
			getBoundingClientRect: function() {
				return { right: 0, };
			}
		}
	};
}

async function renderHtml(html) {
	try {
		const pv = new pagedjs.Previewer();
		const rendered = await pv.preview(html);
		return rendered;
	} catch (err) {
		throw err;
	}
}

function activate(context) {
	prepareDomGlobals();

	return {
        extendMarkdownIt(md) {
            // md.use(require('markdown-it-'));

            const render = md.renderer.render;
            md.renderer.render = (tokens, options, env) => {
                try {
					const html = render.call(md.renderer, tokens, options, env);
					return renderHtml(html);
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
