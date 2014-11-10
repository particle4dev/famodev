define('famodev/ui/papers/Paper', [
    'require', 
    'exports',
    'module',

    'famous/core/RenderNode',
    'famous/core/Transform',
    'famous/core/Modifier',
    'famous/transitions/Transitionable',
    'famous/transitions/TransitionableTransform',
    'famous/transitions/Easing',
    'famous/utilities/Utility',

    ],
    function (require, exports, module) {

    var RenderNode                  = require('famous/core/RenderNode');
    var Transform                   = require('famous/core/Transform');
    var Modifier                    = require('famous/core/Modifier');
    var Transitionable              = require('famous/transitions/Transitionable');
    var TransitionableTransform     = require('famous/transitions/TransitionableTransform');
    var Easing                      = require('famous/transitions/Easing');
    var Utility                     = require('famous/utilities/Utility');

    var _status = {
        // in
        inTransform: Transform.translate(0, window.innerHeight, 0),
        inOpacity: 0,
        inOrigin: [0.5, 0.5],
        inAlign: [0.5, 0.5],

        // out
        outTransform: Transform.translate(0, window.innerHeight, 0),
        outOpacity: 1,
        outOrigin: [0.5, 0.5],
        outAlign: [0.5, 0.5],

        // show
        showTransform: Transform.translate(0, 0, 0),
        showOpacity: 1,
        showOrigin: [0.5, 0.5],
        showAlign: [0.5, 0.5],

        inTransition: {
            duration: 250,
            curve: Easing.easeInOutBack
        },
        outTransition: {
            duration: 250,
            curve: Easing.easeInOutBack
        }
    };

    function Paper(name, renderable) {
        this._name          = name;
        this._node          = new RenderNode();
        this._renderable    = renderable;

        this._boxModifier = {
            transform: new TransitionableTransform(_status.inTransform),
            opacity: new Transitionable(_status.inOpacity),
            align: new Transitionable(_status.inAlign),
            origin: new Transitionable(_status.inOrigin)
        };

        this.boxModifier = new Modifier({
            align: this._boxModifier.align,
            transform: this._boxModifier.transform,
            opacity: this._boxModifier.opacity,
            origin: this._boxModifier.origin,
            size: [undefined, undefined]
        });

        this._node.add(this.boxModifier).add(this._renderable);
    }
    
    /**
     * Add Views
     */

    /**
     * Methods
     */
    _.extend(Paper.prototype, {
        show: function (callback) {
            var self = this;
            var _cb = callback ? Utility.after(3, function(){
                callback();
                // call rendered
                if(self._renderable && self._renderable.rendered)
                    self._renderable.rendered();
            }) : Utility.after(3, function(){
                // call rendered
                if(self._renderable && self._renderable.rendered)
                    self._renderable.rendered();
            });

            var transition = _status.inTransition;

            this._boxModifier.transform.set(_status.showTransform, transition, _cb);
            this._boxModifier.opacity.set(_status.showOpacity, transition, _cb);
            this._boxModifier.origin.set(_status.showOrigin, transition, _cb);
            this._boxModifier.align.set(_status.showAlign, transition, _cb);
        },
        hide: function (callback) {
            var self = this;
            var _cb = callback ? Utility.after(3, function(){
                callback();
                // call destroyed
                if(self._renderable && self._renderable.destroyed)
                    self._renderable.destroyed();
            }) : Utility.after(3, function(){
                // call destroyed
                if(self._renderable && self._renderable.destroyed)
                    self._renderable.destroyed();
            });
            var transition = _status.outTransition;

            this._boxModifier.transform.set(_status.outTransform, transition, _cb);
            this._boxModifier.opacity.set(_status.outOpacity, transition, _cb);
            this._boxModifier.origin.set(_status.outOrigin, transition, _cb);
            this._boxModifier.align.set(_status.outAlign, transition, _cb);
        },
        /**
         * Generate a render spec from the contents of this component.
         *
         * @private
         * @method render
         * @return {number} Render spec for this component
         */
        render: function () {
            return this._node.render();
        }
    });


    /**
     * Events
     */

    module.exports = Paper;

});