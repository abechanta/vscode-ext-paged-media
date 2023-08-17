"use strict";
window.Paged = require("pagedjs");
window.PagedConfig = require("./paged-config");

window.addEventListener("load", () => {
	const containerElement = document.querySelector(".markdown-body");
	console.log("containerElement: ", containerElement);
	if (containerElement && Array.from(containerElement.childNodes).some(n => n.nodeName == "#comment" && n.data.includes("@toppage"))) {
		console.log("onload event invoked.");
		window.PagedConfig.before();
		const pv = new window.Paged.Previewer();
		pv.preview(containerElement.innerHTML, undefined, undefined).then(window.PagedConfig.after);
		containerElement.style.display = "none";
	}
});
