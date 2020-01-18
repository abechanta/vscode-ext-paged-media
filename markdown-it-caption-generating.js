'use strict';

function generating(state) {
	state.tokens
		.map((token, idx, tokens) => {
			if (
				(token.type !== "paragraph_open") ||
				(tokens[idx + 1].type !== "inline") ||
				!token.attrGet("class") || !token.attrGet("class").split(" ").includes("figures")
			) {
				return;
			}
			return tokens[idx + 1];
		})
		.filter(token => {
			return token && token.children;
		})
		.forEach(token => {
			// token.children.push();
			const captions = token.children
				.filter(token => (token.type === "image") && token.content.length)
				.map(token => token.content)
				.reduce((captions, content) => captions ? captions + " / " + content : content, "")
			;
			if (!captions) {
				return;
			}
			console.log("line", token.map[0], captions);
			var tok;
			tok = new state.Token("paragraph_open", "p", 1);
			tok.block = true;
			token.children.push(tok);
			tok = new state.Token("inline", "", 0);
			tok.content = captions;
			token.children.push(tok);
			tok = new state.Token("paragraph_close", "p", -1);
			tok.block = true;
			token.children.push(tok);
		})
	;
}

module.exports = function include_plugin(md, options) {
	md.core.ruler.push("caption_generating", generating);

	return md;
};
