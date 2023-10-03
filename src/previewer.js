"use strict";

if (!window.PagedConfig) {
	// assign once.
	// if already assigned any, it means this script is running on puppeteer for exporting.
	window.PagedConfig = {
		auto: true,
	};
}

if (!window.PagedConfig.before) {
	// assign once.
	let ready = new Promise(function(resolve, reject) {
		if (document.readyState == "loading") {
			document.addEventListener("DOMContentLoaded", () => {
				resolve(document.readyState);
			});
		} else {
			resolve(document.readyState);
		}
	});
	window.PagedConfig.before = async () => {
		return ready.then(setup);
	};
}

function moveStyles(container) {
	// move style tags from htmlBody to htmlHead in order to successful loading from local files on puppeteer.
	const attrsList = {
		"LINK": [ "rel", "href", ],
		"STYLE": [ "innerHTML", ],
	};

	let styles = Array.from(container.querySelectorAll("link[rel='stylesheet'], style"));
	styles.forEach(style => {
		const node = document.createElement(style.tagName);
		attrsList[style.tagName].forEach(attr => {
			node[attr] = style[attr];
		});
		document.head.appendChild(node);
		style.remove();
	});
}

function setup() {
	const container = document.querySelector(".markdown-body");
	if (window.PagedConfig.content) {
		// if already assigned any, it means this script is running for exporting.
		return;
	}
	// assign once.
	moveStyles(container);
	window.PagedConfig.content = container.innerHTML;
	window.PagedConfig.renderTo = container.parentElement;
	container.remove();
}
