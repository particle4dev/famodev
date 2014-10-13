/**
 * Lightbox
 *      improved from famous
 *
 * @constructor
 * @extends {famous/views/Lightbox}
 * @status stable
 */
define('famodev/Lightbox', [
    'require', 
    'exports',
    'module',
    'famous/views/Lightbox'
    ], function(require, exports, module){

        var LightboxView    = require('famous/views/Lightbox');

        function Lightbox () {
            LightboxView.apply(this, arguments);
            this._currentRenderable = null;
        }
        Lightbox.prototype = Object.create(LightboxView.prototype);
        Lightbox.prototype.constructor = Lightbox;
        Lightbox.DEFAULT_OPTIONS   = LightboxView.DEFAULT_OPTIONS;

        /**
         * https://github.com/Famous/famous/blob/master/src/views/Lightbox.js#L94
         * not use
         */
        var originShow =  Lightbox.prototype.show;
        Lightbox.prototype.show = function (renderable) {
            this._currentRenderable = renderable;
            var args = Array.prototype.slice.call(arguments);
            originShow.apply(this, args);
        };

        /**
         * not use
         */
        var originHide =  Lightbox.prototype.hide;
        Lightbox.prototype.hide = function () {
            var args = Array.prototype.slice.call(arguments);
            originHide.apply(this, args);
            this._currentRenderable = null;
        };

        /**
         * make it to reanderable
         */
        Lightbox.prototype.getSize = function () {
            var length = this.nodes.length;
            if(length == 0)
                return [0, 0];
            return this.nodes[length -1].getSize();
        };

        module.exports = Lightbox;
});