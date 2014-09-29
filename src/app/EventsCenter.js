define('famodev/app/EventsCenter', [
    'require', 
    'exports',
    'module',
    'famous/core/EventHandler'
    ], function (require, exports, module) {
        
        var EventHandler = require('famous/core/EventHandler');
        var eventHandler = new EventHandler();
        var eventHandlerType = new EventHandler();

        return module.exports = {
            'listen': function (type, listener) {
                if(type.indexOf("#") != -1) {
                    eventHandler.on(type, listener);
                }
                else
                    eventHandlerType.on(type, listener);
            },
            'trigger': function (type) {
                var args = Array.prototype.slice.call(arguments);
                eventHandler.emit.apply(eventHandler, args);
                // type
                args.shift();
                var tmp = type.split("#");
                args.unshift(tmp[1]);
                args.unshift(tmp[0]);
                eventHandlerType.emit.apply(eventHandlerType, args);
            },

            'pipe': function (event) {
                event.pipe(eventHandler);
            },
            'onpipe': function (event) {
                eventHandler.pipe(event);
            }
        };
});