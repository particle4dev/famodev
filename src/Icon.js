/**
 * inspired by http://www.google.com/design/spec/animation/responsive-interaction.html
 */

define('famodev/Icon', [
    'require', 
    'exports',
    'module',
    'famous/core/Modifier',
    'famous/core/OptionsManager',
    'famous/core/RenderNode',
    'famous/core/Transform',
    'famous/transitions/Transitionable',
    'famous/transitions/TransitionableTransform'
    ], function (require, exports, module) {

        var Modifier        = require('famous/core/Modifier');
        var OptionsManager  = require('famous/core/OptionsManager');
        var RenderNode      = require('famous/core/RenderNode');
        var Transform       = require('famous/core/Transform');
        var Transitionable  = require('famous/transitions/Transitionable');
        var TransitionableTransform = require('famous/transitions/TransitionableTransform');

        function Icon (options) {
            this._nodes = {};
            this.options = Object.create(Icon.DEFAULT_OPTIONS);
            this._optionsManager = new OptionsManager(this.options);

            if (options) this.setOptions(options);
        }
        /**
         * Patches the Lightbox instance's options with the passed-in ones.
         *
         * @method setOptions
         * @param {Options} options An object of configurable options for the Lightbox instance.
         */
        Icon.prototype.setOptions = function setOptions(options) {
            return this._optionsManager.setOptions(options);
        };

        Icon.prototype.add = function(key, renderable) {
            this._transform = new TransitionableTransform(this.options.inTransform);
            this._opacity = new Transitionable(this.options.inOpacity);
            this._origin = new Transitionable(this.options.inOrigin);
            var transform = new Modifier({
                transform:  this._transform,
                opacity: this._opacity,
                origin: this._origin
            });
            var node = new RenderNode();
            renderable.setSize(this.options.size);
            node.add(transform).add(renderable);
            this._nodes[key] = node;
        };

        // inTransform => showTransform
        // showTransform => outTransform
        Icon.DEFAULT_OPTIONS = {
            inTransform: Transform.scale(0.001, 0.001, 0.001),
            inOpacity: 0,
            inOrigin: [0.5, 0.5],
            outTransform: Transform.scale(0.001, 0.001, 0.001),
            outOpacity: 0,
            outOrigin: [0.5, 0.5],
            showTransform: Transform.identity,
            showOpacity: 1,
            showOrigin: [0.5, 0.5],

            inTransition: true, //second param in set
            outTransition: true, //second param in set
            overlap: false,
            size: [44, 44]
        };
        /**
         * Show displays the targeted renderable with a transition and an optional callback to
         *  execute afterwards.
         * @method show
         * @param {Object} renderable The renderable you want to show.
         * @param {Transition} [transition] Overwrites the default transition in to display the
         * passed-in renderable.
         * @param {function} [callback] Executes after transitioning in the renderable.
         */
        Icon.prototype.show = function (key, transition, callback) {
            var self = this;
            self._showing = true;

            if (transition instanceof Function) {
                callback = transition;
                transition = undefined;
            }
            if (!transition) transition = this.options.inTransition;

            var _cb = callback ? Utility.after(3, function(){
                callback.call(self);
            }) : undefined;

            //self._transform.set(Transform.identity, true, _cb);
            self._transform.set(this.options.showTransform, transition, _cb);

            self._opacity.set(this.options.showOpacity, transition, _cb);
            self._origin.set(this.options.showOrigin, transition, _cb);

            var initialTime = Date.now();
            Meteor.setTimeout(function(){
                self._transform.setRotate(Transform.rotateZ(0.002 * (Date.now() - initialTime)), transition);
            }, 3000);
        };
        /**
         * Generate a render spec from the contents of this component.
         *
         * @private
         * @method render
         * @return {number} Render spec for this component
         */
        Icon.prototype.render = function () {
            var result = [];
            _.each(this._nodes, function(v){
                result.push(v.render());
            });
            return result;
        };

        module.exports = Icon;

    });