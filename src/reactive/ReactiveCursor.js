define('famodev/reactive/ReactiveCursor',[
    'require', 
    'exports',
    'module',
    'famous/core/EventHandler'
    ],
    function (require, exports, module) {

        var EventHandler    = require('famous/core/EventHandler');

        function ReactiveCursor(options) {
            this._eventInput = new EventHandler();
            this._eventOutput = new EventHandler();
            EventHandler.setInputHandler(this, this._eventInput);
            EventHandler.setOutputHandler(this, this._eventOutput);
        }

        module.exports = ReactiveCursor;

    });
/**
    // database
    var reactiveObject = new ReactiveObject({
        data: function () {
            return PicturesCollection.find();
        }
    });

    // API
    reactiveObject.on('addedAt', function(value){
        // todo something
    });

    reactiveObject.on('changedAt', function(value){
        // todo something
    });

    reactiveObject.on('removedAt', function(value){
        // todo something
    });

    reactiveObject.on('movedTo', function(value){
        // todo something
    });
    
    //
    reactiveObject.get(); // array

    reactiveObject.set(function(){
        return PicturesCollection.find(); 
    });

    reactiveObject.stop();
*/