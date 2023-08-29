"use strict";

if (window.Paged || window.PagedConfig) {
	console.log("PagedConfig setup skipped.");
} else {
	window.PagedConfig = require("./paged-config");
}
