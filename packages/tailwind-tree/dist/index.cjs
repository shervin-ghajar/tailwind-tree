'use strict';

var getTwSafelist = require('./utils/getTwSafelist');

/* eslint-disable @typescript-eslint/no-explicit-any */
const classCollector = new Set([]);
function twTree(input, prefix = "") {
    const classes = [];
    for (const item of input) {
        if (typeof item === "string") {
            const fullClass = prefix + item;
            classes.push(fullClass);
            classCollector.add(fullClass);
        }
        else if (typeof item === "object" && item !== null) {
            for (const variant in item) {
                const nested = twTree(item[variant], `${prefix}${variant}:`);
                classes.push(nested);
            }
        }
    }
    return classes.join(" ");
}

Object.defineProperty(exports, "getTwSafelist", {
    enumerable: true,
    get: function () { return getTwSafelist.getTwSafelist; }
});
exports.twTree = twTree;
