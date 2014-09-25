/**
 * ReactiveSurface
 *
 * {{ Missing param }}
 *
 * @constructor
 * @extends {famous/core/Surface}
 * @status stable
 */
define('famodev/reactive/ReactiveSurface',[
    'require', 
    'exports',
    'module',
    'famous/core/Surface'
    ],
    function(require, exports, module){

        var Surface             = require('famous/core/Surface');

        function ReactiveSurface (){
            Surface.apply(this, arguments);

            // FIXME: thinking about this
            //this.emit('created');
        }
        ReactiveSurface.prototype = Object.create(Surface.prototype);
        ReactiveSurface.prototype.constructor = ReactiveSurface;
        ReactiveSurface.prototype.deploy = function deploy(target) {
            //https://github.com/meteor/meteor/blob/devel/packages/ui/render.js#L343
            var self = this;
            self.rangeUpdater = Deps.autorun(function (c) {
                var content = self.getContent();
                if(typeof content === 'function')
                    content = content();
                if (content instanceof Node) {
                    while (target.hasChildNodes()) target.removeChild(target.firstChild);
                    target.appendChild(content);
                }
                else target.innerHTML = content;
                if (! c.firstRun)
                    self.emit('changed', content);
            });
            self.emit('rendered');
        };
        /**
         * Set or overwrite inner (HTML) content of this surface. Note that this
         *    causes a re-rendering if the content has changed.
         *
         * @method setContent
         * @param {string|Document Fragment} content HTML content
         */
        ReactiveSurface.prototype.setContent = function setContent(content) {
            var self = this;
            if(self.rangeUpdater && self.rangeUpdater.stop){
                self.rangeUpdater.stop();
                self.rangeUpdater = null;
            }
            if (this.content !== content) {
                this.content = content;
                this._contentDirty = true;
            }
        };

        //wrap up cleanup method
        var cleanup = ReactiveSurface.prototype.cleanup;
        ReactiveSurface.prototype.cleanup = function (allocator) {
            var self = this;
            if(self.rangeUpdater && self.rangeUpdater.stop){
                self.rangeUpdater.stop();
                self.rangeUpdater = null;
            }
            cleanup.call(this, allocator);

            // FIXME: thinking about this
            this.emit('destroyed');
        };

        //this function will save content in document.createDocumentFragment();
        //we will not change content if we want it reactive
        ReactiveSurface.prototype.recall = function (target) {

        };
        module.exports = ReactiveSurface;
    });