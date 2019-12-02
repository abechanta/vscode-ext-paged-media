const path = require("path");

const config = {
	target: 'web',
	entry: {
		'loading': './loading.js'
	},
	output: {
		path: path.join(__dirname, "out"),
		filename: '[name].bundle.js'
	},
	module: {
		rules: [
			{
				parser: {
					amd: false
				},
				include: /node_modules\/lodash\// // https://github.com/lodash/lodash/issues/3052
			},
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader'
				}
			}
		]
	}
}

module.exports = [config]
