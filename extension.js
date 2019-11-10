'use strict'

function activate(context) {
    return {
        extendMarkdownIt(md) {
            // md.use(require('markdown-it-'));
            return md;
        }
    };
}
exports.activate = activate;
