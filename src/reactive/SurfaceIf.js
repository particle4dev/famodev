Famono.scope('famodev/src/reactive/SurfaceIf', ["famous/core/Surface"], function(require, define) {
/**
 * Surface If Component
 *
 * {{ Missing param }}
 *
 * @constructor
 * @extends {famous/core/Surface}
 * @status stable
 */
define(function(require, exports, module){

        var Surface             = require('famous/core/Surface');

        function SurfaceIf (options) {
            Surface.apply(this, arguments);
            // private modifier
            this._modifier = options.modifier;
            this.condition = options.condition;
            this.contentBlock = options.contentBlock;
            this.elseContentBlock = options.elseContentBlock;
        }
        SurfaceIf.prototype = Object.create(Surface.prototype);
        SurfaceIf.prototype.constructor = SurfaceIf;

        //this function will save content in document.createDocumentFragment();
        //we will not change content if we want it reactive
        SurfaceIf.prototype.recall = function (target) {

        };
        /**
         * Place the document element that this component manages into the document.
         *
         * @private
         * @method deploy
         * @param {Node} target document parent of this container
         */
        SurfaceIf.prototype.deploy = function deploy(target) {
            //https://github.com/Famous/core/blob/master/Surface.js#L552
            //https://github.com/meteor/meteor/blob/devel/packages/ui/render.js#L343
            var self = this, content;
            self.rangeUpdater = Deps.autorun(function (c) {
                if(!!self.condition()) {
                    content = self.contentBlock();
                }
                else {
                    content = self.elseContentBlock();
                }
                if(self._animateBeforeSetContent /** and equal function*/){
                    self._animateBeforeSetContent(function(){
                        self._animateBeforeSetContent = null;

                        self.setInnerContent(target, content, c.firstRun);
                        if(self._animateAfterSetContent /** and equal function*/){
                            self._animateAfterSetContent();
                            self._animateAfterSetContent = null;
                        }
                    });
                }
                else {
                    self.setInnerContent(target, content, c.firstRun);
                    if(self._animateAfterSetContent /** and equal function*/){
                        self._animateAfterSetContent();
                        self._animateAfterSetContent = null;
                    }
                }
            });
        };
        SurfaceIf.prototype.setInnerContent = function(target, content, isfirstRun){
            if (content instanceof Node) {
                while (target.hasChildNodes()) target.removeChild(target.firstChild);
                target.appendChild(content);
            }
            else target.innerHTML = content;
            if(!isfirstRun)
                this.emit('changed', content);
        };

        // modifier
        SurfaceIf.prototype.getModifier = function(){
            var self = this;
            return {
                beforeSetContent: function(func){
                    self._animateBeforeSetContent = func.bind(self._modifier);
                },
                afterSetContent: function(func){
                    self._animateAfterSetContent = func.bind(self._modifier);
                }
            };
        };

        /**
         * Set or overwrite inner (HTML) content of this surface. Note that this
         *    causes a re-rendering if the content has changed.
         *
         * @method setContent
         * @param {string|Document Fragment} content HTML content
         */
        SurfaceIf.prototype.setContent = function setContent(content) {
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
        var cleanup = SurfaceIf.prototype.cleanup;
        SurfaceIf.prototype.cleanup = function (allocator) {
            var self = this;
            if(self.rangeUpdater && self.rangeUpdater.stop){
                self.rangeUpdater.stop();
                self.rangeUpdater = null;
            }
            cleanup.call(this, allocator);
        };

        module.exports = SurfaceIf;

    });
});