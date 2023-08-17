"use strict";
window.Paged = require('pagedjs');
require('./paged-config');
(function() {
	window.addEventListener("load", () => {
		const containerElement = document.querySelector(".markdown-body");
		console.log("containerElement: ", containerElement);
		if (containerElement && Array.from(containerElement.childNodes).some(n => n.nodeName == "#comment" && n.data.includes("@toppage"))) {
			console.log("onload event invoked.");
			// while (containerElement.childNodes[0].nodeName != "#comment") {
			// 	console.log("removed: ", containerElement.childNodes[0].nodeName);
			// 	containerElement.childNodes[0].remove();
			// }
			// containerElement.childNodes[0].nextElementSibling.remove();
			window.PagedConfig.before();
			const pv = new window.Paged.Previewer(/*{ "hyphenGlyph": "\u2011", }*/);
			pv.preview(containerElement.innerHTML, undefined, undefined).then(window.PagedConfig.after);
			containerElement.style.display = "none";
		}
	});
}());
