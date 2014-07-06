define('partials/SurfaceIf', [

    'famous/core/Surface'
    
    ], function(require, exports, module){

        var Surface             = require('famous/core/Surface');

        function SurfaceIf (options) {
            Surface.apply(this, arguments);
            // private modifier
            this._modifier = options.modifier;
            this.condition = options.condition;
            this.contentBlock = options.contentBlock;
            this.elseContentBlock = options.elseContentBlock;

            console.log(this.contentBlock);
        };
        SurfaceIf.prototype = Object.create(Surface.prototype);
        SurfaceIf.prototype.constructor = SurfaceIf;

        //this function will save content in document.createDocumentFragment();
        //we will not change content if we want it reactive
        SurfaceIf.prototype.recall = function (target) {

        }
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
            }
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
                self.rangeUpdater.stop()
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
                self.rangeUpdater.stop()
                self.rangeUpdater = null;
            }
            cleanup.call(this, allocator);
        };

        module.exports = SurfaceIf;

    })

/**

var surf = new SurfaceIf({
    modifier: this._rowModifiers[(row * 3) + col],
    condition: function(){
        if(Session.get('surfaceIf'))
            return true;
        else
            return false;
    },
    contentBlock: function(){
        var modifier = this.getModifier();
        modifier.afterSetContent(function(cb){
            this.setOpacity(1, {duration: 300, curve: 'easeInOut'}, cb);
        });
        return '<div class="circle ' + data.availability + '" style="width: 75px; height: 75px; background: ' + data.background + '; padding: 18px;">'+
            '<i class="button button-icon icon ' + data.icon + '" style="color: ' + data.iconColor + '; width: 35px; height: 35px;"></i>'+
            '</div>'+
            '<div class="' + data.availability + '" style="text-align: center; color: #fff; text-transform:uppercase; font-size: 11px;"> ' + data.text + ' </div>';
        },
    elseContentBlock: function(){
        var modifier = this.getModifier();
        modifier.beforeSetContent(function(cb){
            this.setOpacity(0, {duration: 300, curve: 'easeInOut'}, cb);
        });
        return '';
    },
    size: [undefined,undefined],
    classes: ['filterIcon']
});

*/