"use strict";

function salvageStyles() {
    console.log("salvageStyles");
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
}

function fixSplitCodeBlocks() {
    console.log("fixSplitCodeBlocks");
    const t = document.querySelectorAll("pre > code[data-split-to]");
    const f = document.querySelectorAll("pre > code[data-split-from]");
    if (f.length != t.length) {
        return;
    }
    for (let idx = 0; idx < t.length; idx++) {
        let tlines = t[idx].textContent.split("\n");
        let last = tlines.pop();
        if (/^\s*$/.test(last)) {
            // fix indentation
            t[idx].textContent = tlines.join("\n");
            f[idx].textContent = last + f[idx].textContent;
        } else {
            // fix hyphenation if presented
            tlines.push(last.replace(/\u2011$/, ""));	// \u2011 is "‑"
            t[idx].textContent = tlines.join("\n");
        }
    }
}

module.exports = {
    auto: false,
    // before: salvageStyles,
    before: () => {},
    // after: fixSplitCodeBlocks,
    after: () => {},
};
