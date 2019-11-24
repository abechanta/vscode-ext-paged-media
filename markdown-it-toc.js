'use strict';

function hasClass(token, classname) {
	return token.attrGet("class") && token.attrGet("class").split(" ").includes(classname);
}

function isSelected(selection) {
	const isSelectedNumber = selection => level => level >= selection;
	const isSelectedArray = selection => level => selection.includes(level);
	return selection => Array.isArray(selection) ? isSelectedArray(selection) : isSelectedNumber(selection);
}

module.exports = function include_plugin(md, options) {
	const exception = "unnumbered";

	function numbering(opts) {
		const opts_ = Object.assign({}, {
			selection: [1, 2, 3, 4, 5, 6],
		}, opts);
		var chapters = [];
		var lineNumber = 0;

		return (token, opts) => {
			const re = /^h([1-6])$/i;
			const level = parseInt(re.exec(token.tag)[1]);
			if (
				!isSelected(opts_.selection)(level) ||
				hasClass(token, exception) ||
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
	}

	function deleteUnnumberedHeadingsFromTocAst(md) {
		const idx = md.core.ruler.__find__("generateTocAst");
		const rule = md.core.ruler.getRules("")[idx];
		md.core.ruler.getRules("")[idx] = state => {
			rule({ tokens: state.tokens.filter(token => !hasClass(token, exception)), });
		};
	}

	md.use(require("markdown-it-anchor"), { slugify: options.slugify, callback: numbering({ selection: options.selection, }), });
	md.use(require("markdown-it-toc-done-right"), { slugify: options.slugify, level: options.selection, });
	deleteUnnumberedHeadingsFromTocAst(md);

	return md;
};
