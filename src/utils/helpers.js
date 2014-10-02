function parseData (data) {
    if(typeof data === 'function')
        return data();
    return data;
}
isCursor = function (c) {
    c = parseData(c);
    return c && c.observe;
};
isNode = function (c) {
    return c instanceof Node
};
isReactive = function (c) {
    c = parseData(c);
    if(isCursor(c))
        return false;
    if(isNode(c))
        return false;
    return true;
};
isTemplate = Blaze.isTemplate;
notImplemented = function () {
    throw new Error('not implemented');
};