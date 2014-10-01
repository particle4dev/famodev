isCursor = function (c) {
    return c && c.observe;
};
isNode = function (c) {
    return c instanceof Node
};
isReactive = function (c) {
    if(isCursor(c))
        return false;
    if(isNode(c))
        return false;14
    return true;
};
notImplemented = function () {
    throw new Error('not implemented');
};