window.Paged = require('pagedjs');
window.addEventListener("load", () => {
	console.log("hello from loading.js.");
	const pv = new window.Paged.Previewer();
	pv.preview();
});
