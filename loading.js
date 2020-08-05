"use strict";
window.Paged = require('pagedjs');
require('./paged-config');
(function() {
	window.addEventListener("load", () => {
		const rootNode = document.querySelector(".vscode-body");
		const firstNode = rootNode && rootNode.firstChild && rootNode.firstChild.nextSibling || undefined;
		console.log("firstNode: ", firstNode);
		if (firstNode && (firstNode.nodeName === "#comment") && firstNode.data.includes("@toppage")) {
			console.log("onload event invoked.");
			window.PagedConfig.before();
			const pv = new window.Paged.Previewer(/*{ "hyphenGlyph": "\u2011", }*/);
			pv.preview().then(window.PagedConfig.after);
		}
	});
}());
