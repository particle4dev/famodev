/**
 * not implement yet
 */
define('famodev/Modal', [
    'famous/core/Modifier',
    'famous/core/RenderNode'
    ], function(require, exports, module){

        var Modifier        = require('famous/core/Modifier');
        var RenderNode      = require('famous/core/RenderNode');

        var _nodes = [];
        function Modal () {
            
        }

        // add views
        function _createBackdrop () {

        };

        function _create () {
            // body...
        };
        /**
         * singleton pattern
         */
        module.exports = {
            register: function(key, renderable) {

                // add modifier
                var node = new RenderNode();
                node.add(new Modifier()).add(renderable);
                _nodes.push(node);
            },
            show: function(key) {
                // body...
            },
            hide: function(key) {
                // body...
            },
            /**
             * Generate a render spec from the contents of this component.
             *
             * @private
             * @method render
             * @return {number} Render spec for this component
             */
            render: function () {
                var result = [];
                for (var i = 0; i < _nodes.length; i++) {
                    result.push(_nodes[i].render());
                }
                return result;
            },
            getInstance: function () {

            },
            visibleBackdrop: function() {

            },
            invisibleBackdrop: function() {

            }
        };

    })

// test
Meteor.startup(function () {
    define(function(require, exports, module){

        var Engine      = require('famous/core/Engine');
        var Surface     = require('famous/core/Surface');
        var Modal       = require('famodev/Modal');

        var mainContext = Engine.createContext();

        Modal.register('login', new Surface({
            content: 'Surface'
        }));

        mainContext.add(Modal);

    });
});