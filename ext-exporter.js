"use strict";
const sleep = sec => {
	return new Promise(resolve => setTimeout(resolve, sec * 1000));
};

module.exports = function Exporter(context) {
	return {
		exportFiles(uri, body) {
			return sleep(3);
		}
	};
};
