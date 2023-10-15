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

if (!window.PagedConfig.after) {
	// assign once.
	window.PagedConfig.after = async (rendered) => {
		addClassToEachContentRoot();
		moveTrailingSpaceCharacters();
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

function trimHeadingElements(container) {
	while (!container.firstElementChild.innerText) {
		container.removeChild(container.firstElementChild);
	}
}

function trimTrailingElements(container) {
	while (!container.lastElementChild.innerText) {
		container.removeChild(container.lastElementChild);
	}
}

function setup() {
	const container = document.querySelector(".markdown-body");
	if (window.PagedConfig.content) {
		// if already assigned any, it means this script is running for exporting.
		return;
	}
	// assign once.
	moveStyles(container);
	trimHeadingElements(container);
	trimTrailingElements(container);
	window.PagedConfig.content = container.innerHTML;
	window.PagedConfig.renderTo = container.parentElement;
	container.remove();
}


function addClassToEachContentRoot() {
	const divs = Array.from(document.querySelectorAll(".pagedjs_page_content > div"));
	divs.forEach(e => {
		e.className += "markdown-body";
	});
}

function moveTrailingSpaceCharacters() {
	// some lines at the bottom of code blocks disappear when they end with a space.
	// so lets fix them.
	const codes = Array.from(document.querySelectorAll("code[data-split-to]")).filter(e => e.innerText.endsWith(" "));
	codes.forEach(e => {
		const chunked = document.querySelectorAll(`code[data-ref="${e.dataset["ref"]}"]`);
		for (let idx = 1; idx < chunked.length; idx++) {
			const [e0, e1] = [chunked[idx - 1], chunked[idx]];
			const m = e0.innerText.match(/\n? +$/);
			if (m) {
				const trailer = m.input.substr(m.index + (m.input[0] == " " ? 0 : 1));
				e0.innerText = e0.innerText.substr(0, m.index);
				e1.innerText = trailer + e1.innerText;
			}
		}
	});
}
