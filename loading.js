"use strict";
window.Paged = require('pagedjs');
(function() {
	function salvageStyles() {
		const attrsList = {
			"LINK": [ "rel", "href", ],
			"STYLE": [ "innerHTML", ],
		};

		// salvage styles from body content
		let styles = Array.from(document.querySelectorAll("body link[rel='stylesheet'], body style"));
		styles.forEach(style => {
			const node = document.createElement(style.tagName);
			attrsList[style.tagName].forEach(attr => {
				node[attr] = style[attr];
			});
			document.head.appendChild(node);
			style.remove();
		});
	}

	window.addEventListener("load", () => {
		const rootNode = document.querySelector(".vscode-body");
		const firstNode = rootNode && rootNode.firstChild && rootNode.firstChild.nextSibling || undefined;
		console.log("firstNode: ", firstNode);
		if (firstNode && (firstNode.nodeName === "#comment") && firstNode.data.includes("@toppage")) {
			console.log("onload event invoked.");
			salvageStyles();
			const pv = new window.Paged.Previewer();
			pv.preview();
		}
	});
}());
