// ??? need this? maybe it is factory pattern
define('famodev/reactive/ReactiveObject',[
    'require', 
    'exports',
    'module',
    'famous/core/EventHandler'
    ],
    function (require, exports, module) {

        var EventHandler    = require('famous/core/EventHandler');

        function ReactiveObject(options) {
            this._eventInput = new EventHandler();
            this._eventOutput = new EventHandler();
            EventHandler.setInputHandler(this, this._eventInput);
            EventHandler.setOutputHandler(this, this._eventOutput);
        }

        module.exports = ReactiveObject;

    });