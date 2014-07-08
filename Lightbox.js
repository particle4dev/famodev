define('famodev/Lightbox', [

    'famous/views/Lightbox',
    'famous/core/Transform',
    'famous/core/Modifier',
    'famous/core/RenderNode',
    'famous/utilities/Utility',
    'famous/transitions/Transitionable',
    'famous/transitions/TransitionableTransform'

    ], function(require, exports, module){

        var LightboxView    = require('famous/views/Lightbox');
        var Transform       = require('famous/core/Transform');
        var Modifier        = require('famous/core/Modifier');
        var RenderNode      = require('famous/core/RenderNode');
        var Utility         = require('famous/utilities/Utility');
        var Transitionable  = require('famous/transitions/Transitionable');
        var TransitionableTransform = require('famous/transitions/TransitionableTransform');

        function Lightbox () {
            LightboxView.apply(this, arguments);
        }
        Lightbox.prototype = Object.create(LightboxView.prototype);
        Lightbox.prototype.constructor = Lightbox;
        Lightbox.DEFAULT_OPTIONS   = LightboxView.DEFAULT_OPTIONS;

        /**
         *
         */
        Lightbox.prototype.next = LightboxView.prototype.show;
        /**
         *
         */
        Lightbox.prototype.prev = function (renderable, transition, callback) {
            if (!renderable) {
                return this._hidePrev(callback);
            }

            if (transition instanceof Function) {
                callback = transition;
                transition = undefined;
            }

            if (this._showing) {
                if (this.options.overlap) this._hidePrev();
                else {
                    return this._hidePrev(this.prev.bind(this, renderable, transition, callback));
                }
            }
            this._showing = true;

            var stateItem = {
                transform: new TransitionableTransform(this.options.outTransform),
                origin: new Transitionable(this.options.inOrigin),
                opacity: new Transitionable(this.options.inOpacity)
            };

            var transform = new Modifier({
                transform: stateItem.transform,
                opacity: stateItem.opacity,
                origin: stateItem.origin
            });
            var node = new RenderNode();
            node.add(transform).add(renderable);
            this.nodes.push(node);
            this.states.push(stateItem);
            this.transforms.push(transform);

            var _cb = callback ? Utility.after(3, callback) : undefined;

            if (!transition) transition = this.options.inTransition;
            stateItem.transform.set(this.options.showTransform, transition, _cb);
            stateItem.opacity.set(this.options.showOpacity, transition, _cb);
            stateItem.origin.set(this.options.showOrigin, transition, _cb);
        };

        Lightbox.prototype._hidePrev = function hide(transition, callback) {
            if (!this._showing) return;
            this._showing = false;

            if (transition instanceof Function) {
                callback = transition;
                transition = undefined;
            }
            var node = this.nodes[this.nodes.length - 1];
            var transform = this.transforms[this.transforms.length - 1];
            var stateItem = this.states[this.states.length - 1];
            var _cb = Utility.after(3, function() {
                this.nodes.splice(this.nodes.indexOf(node), 1);
                this.states.splice(this.states.indexOf(stateItem), 1);
                this.transforms.splice(this.transforms.indexOf(transform), 1);
                if (callback) callback.call(this);
            }.bind(this));

            if (!transition) transition = this.options.outTransition;
            stateItem.transform.set(this.options.inTransform, transition, _cb);
            stateItem.opacity.set(this.options.outOpacity, transition, _cb);
            stateItem.origin.set(this.options.outOrigin, transition, _cb);
        };

        module.exports = Lightbox;
});

// Meteor.startup(function(){

//     define(function(require, exports, module){

//         var Lightbox    = require('famodev/Lightbox');
//         var Engine      = require('famous/core/Engine');
//         var Surface     = require('famous/core/Surface');
//         var Transform   = require('famous/core/Transform');
//         var Easing      = require('famous/transitions/Easing');

//         var mainContext = Engine.createContext();

//         var box = new Lightbox({
//             inTransform: Transform.translate(300, 0, 0),
//             outTransform: Transform.translate(-500, 0, 0),
//             inTransition: { duration: 500, curve: Easing.outBack },
//             outTransition: { duration: 350, curve: Easing.inQuad }
//         });

//         var sur1 = new Surface({
//             content: 'Click here 1',
//             size: [100, 100],
//             properties: {
//                 backgroundColor: '#FA5C4F',
//                 lineHeight: '100px',
//                 textAlign: 'center',
//                 color: '#fff'
//             }
//         });
//         var sur2 = new Surface({
//             content: 'Click here 2',
//             size: [100, 100],
//             properties: {
//                 backgroundColor: '#FA5C4F',
//                 lineHeight: '100px',
//                 textAlign: 'center',
//                 color: '#fff'
//             }
//         });

//         mainContext.add(box);

//         box.next(sur1);

//         sur1.on('click', function(){
//             box.next(sur2);
//         });
//         sur2.on('click', function(){
//             box.prev(sur1);
//         });
//     });

// });