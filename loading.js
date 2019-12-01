window.Paged = require('pagedjs');
window.addEventListener("load", () => {
	console.log("hello from loading.js.");
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

	const pv = new window.Paged.Previewer();
	pv.preview();
});
