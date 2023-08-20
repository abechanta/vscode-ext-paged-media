"use strict";

function salvageStyles(container) {
	console.log("salvageStyles");
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

function wrapContent(container) {
	console.log("wrapContent container:", container);
	const ref = document.createElement("div");
	ref.style = "display: none;";
	ref.innerHTML = container.innerHTML;
	const body = container.parentElement;
	body.appendChild(ref);

	container.innerHTML = "";
	return ref;
}

let container;
function setup() {
	container = document.querySelector(".markdown-body");
	salvageStyles(container);
}

const media = window.matchMedia("print");
if (media?.matches) {
	document.addEventListener("DOMContentLoaded", setup);
} else {
	setup();
}

module.exports = {
	auto: true,
	before: () => {
		if (container && Array.from(container.childNodes).some(n => n.nodeName == "#comment" && n.data.includes("@toppage"))) {
			console.log("PagedConfig before event invoked.");
			const ref = wrapContent(container);
		}
	},
	after: () => {},
	content: container.innerHTML,
	renderTo: container,
};
