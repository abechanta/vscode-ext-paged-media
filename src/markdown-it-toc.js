"use strict";

function hasClass(token, classname) {
	return token.attrGet("class") && token.attrGet("class").split(" ").includes(classname);
}

function isSelected(selection) {
	const isSelectedNumber = selection => level => level >= selection;
	const isSelectedArray = selection => level => selection.includes(level);
	return selection => Array.isArray(selection) ? isSelectedArray(selection) : isSelectedNumber(selection);
}

function numbering(options) {
	const options_ = Object.assign({}, {
		selection: [1, 2, 3, 4, 5, 6],
	}, options);
	var chapters = [];
	var lineNumber = 0;

	return (token, opts) => {
		const re = /^h([1-6])$/i;
		const level = parseInt(re.exec(token.tag)[1]);
		if (
			!isSelected(options_.selection)(level) ||
			hasClass(token, options_.excludeClassname) ||
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

function aliasing(options) {
	const re = /\{[^}]*(data-alias=[^ ]+)[^}]*\}/i;

	return state => {
		state.tokens
			.map((token, idx, tokens) => {
				if (
					(token.type !== "heading_open") ||
					(tokens[idx + 1].type !== "inline") ||
					!re.test(tokens[idx + 1].content)
				) {
					return;
				}
				return tokens[idx + 1];
			})
			.filter(token => token)
			.forEach(token => {
				state.env = state.env || {};
				state.env.references = state.env.references || {};
				const alias = re.exec(token.content)[1].split("=")[1].toUpperCase();
				const title = token.content.replace(re, "").trim();
				const entry = {
					title: title || "",
					href: "#" + options.slugify(title),
				};
				state.env.references[alias] = entry;
			})
		;
		return false;
	};
}

function deleteUnnumberedHeadingsFromTocAst(md, options) {
	const ruleName = "generateTocAst";
	const idx = md.core.ruler.__find__(ruleName);
	const rule = md.core.ruler.getRules("")[idx];
	md.core.ruler.at(ruleName, state => {
		rule({ tokens: state.tokens.filter(token => !hasClass(token, options.excludeClassname)), });
	});
}

function include_plugin(md, options) {
	const excludeClassname = "unnumbered";

	md.use(require("markdown-it-anchor"), { slugify: options.slugify, callback: numbering({ selection: options.selection, excludeClassname: excludeClassname, }), });
	md.use(require("markdown-it-toc-done-right"), { slugify: options.slugify, level: options.selection, });
	md.core.ruler.after("block", "heading_alias", aliasing({ slugify: options.slugify, }));
	deleteUnnumberedHeadingsFromTocAst(md, { excludeClassname: excludeClassname, });

	return md;
};

module.exports = (md, options) => include_plugin(md, options);
