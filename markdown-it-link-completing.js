'use strict';

function completing(tokens, idx) {
	const token0 = tokens[idx + 0];
	const token1 = tokens[idx + 1];
	if (
		// (token0.type !== "link_open") || (token0.tag !== "a") ||
		(token1.type !== "link_close") || (token1.tag !== "a")
	) {
		return;
	}

	const classValue = token0.attrGet("class");
	token0.attrSet("class", classValue ? classValue + " ref" : "ref");
}

module.exports = function include_plugin(md, options) {
	md.use(require("markdown-it-for-inline"), "link_completing", "link_open", completing);

	return md;
};
