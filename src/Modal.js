/**
 * version 0.1
 */
// https://github.com/driftyco/ionic/blob/v1.0.0-beta.6/scss/_popup.scss
define('famodev/Modals', [
    'require', 
    'exports',
    'module',
    'famous/core/View',
    'famous/modifiers/StateModifier',
    'famous/core/RenderNode',
    'famous/core/Surface',
    'famous/core/Transform',
    'famous/surfaces/ContainerSurface',
    'famous/transitions/Transitionable',
    'famous/transitions/TransitionableTransform',
    'famous/core/Modifier',
    'famous/utilities/Utility',
    'famous/views/RenderController'
    ], function(require, exports, module){

        var View               = require('famous/core/View');
        var StateModifier      = require('famous/modifiers/StateModifier');
        var RenderNode         = require('famous/core/RenderNode');
        var Surface            = require('famous/core/Surface');
        var Transform          = require('famous/core/Transform');

        var ContainerSurface        = require('famous/surfaces/ContainerSurface');
        var Transitionable          = require('famous/transitions/Transitionable');
        var TransitionableTransform = require('famous/transitions/TransitionableTransform');
        var Modifier                = require('famous/core/Modifier');
        var Utility                 = require('famous/utilities/Utility');
        var RenderController        = require('famous/views/RenderController');

        function Modal () {
            View.apply(this, arguments);

            this._containerView = new ContainerSurface({
                size: [window.innerWidth - 40, true],
                properties: {
                    overflow: 'hidden',
                    zIndex: "1050" // from bootstrap
                }
            });
            this._containerModifier = new StateModifier({
                origin: [0.5, 0.5],
                align: [0.5, 0.5]
            });
            this._add(this._containerModifier).add(this._containerView);

            createBackground.call(this);
            createContainerModal.call(this);
        }
        Modal.prototype = Object.create(View.prototype);
        Modal.prototype.constructor = Modal;
        Modal.DEFAULT_OPTIONS = {};

        var _containerModal = null;

        /**
         * Add Views
         */
        function createBackground () {
            this._bg = new Surface({
                properties: {
                    borderRadius: "0px",
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    boxShadow: '0 10px 20px -5px rgba(0, 0, 0, 0.5)',
                    minHeight: "50px"
                }
            });
            this._containerView.add(this._bg);
        }

        function createContainerModal () {
            _containerModal = new RenderController();
            _containerModalModifier = new StateModifier({
                origin: [0.5, 0.5],
                align: [0.5, 0.5],
                opacity: 1
            });
            this._containerView.add(_containerModalModifier).add(_containerModal);
        }

        /**
         * Methods
         */
        Modal.prototype.show = function (renderable) {
            _containerModal.show(renderable);
            var size = renderable.size;
            if(size) {
                size = [window.innerWidth - 40, size[1]];
                this._bg.setSize(size);
                this._containerView.setSize(size);
            }
        };

        /**
         * Events
         */

        var _nodes = [],
        _status = {
            // in
            inTransform: Transform.scale(0.001, 0.001, 0.001),
            inOpacity: 0,
            inOrigin: [0.5, 0.5],
            // out
            outTransform: Transform.scale(0.001, 0.001, 0.001),
            outOpacity: 0,
            outOrigin: [0.5, 0.5],
            // show
            showTransform: Transform.identity,
            showOpacity: 1,
            showOrigin: [0.5, 0.5]
        },
        isShow    = false,
        modifiers = {},
        modals    = {},
        _backdropModifier = null,
        _boxModifier = null,
        _containerModalModifier = null,
        _boxSurface = null;
        // add views
        function _createBackdrop () {
            var backdropSurface = new Surface({
                size: [undefined, window.innerHeight],
                properties: {
                    backgroundColor: "rgba(0, 0, 0, 0.4)"
                }
            });

            // add modifier
            _backdropModifier = {
                transform: new TransitionableTransform(_status.inTransform),
                opacity: new Transitionable(_status.inOpacity),
                origin: new Transitionable(_status.inOrigin),
                align: new Transitionable([0.5, 0.5])
            };

            backdropModifier = new Modifier({
                transform: _backdropModifier.transform,
                opacity: _backdropModifier.opacity,
                origin: _backdropModifier.origin,
                align: _backdropModifier.align
            });

            var node = new RenderNode();
            node.add(backdropModifier).add(backdropSurface);
            _nodes.push(node);

            // attach Event
            backdropSurface.on('click', function (event) {
                if(!isShow)
                    return ;
                hide();
                isShow = false;
            });
        }
        function _createBox(){
            _boxSurface = new Modal();

            _boxModifier = {
                transform: new TransitionableTransform(_status.inTransform),
                opacity: new Transitionable(_status.inOpacity),
                origin: new Transitionable(_status.inOrigin),
                align: new Transitionable([0.5, 0.5])
            };

            var boxModifier = new Modifier({
                transform: _boxModifier.transform,
                opacity: _boxModifier.opacity,
                origin: _boxModifier.origin,
                align: _boxModifier.align,
                size: [undefined, undefined]
            });

            var node = new RenderNode();
            node.add(boxModifier).add(_boxSurface);
            _nodes.push(node);
        }

        // animation
        function show (callback) {
            var _cb = callback ? Utility.after(3, callback) : undefined;
            _backdropModifier.transform.set(Transform.scale(1, 1, 1));
            _boxModifier.transform.set(Transform.multiply(Transform.scale(2, 2, 1), Transform.translate(0, 0, 0)));

            _backdropModifier.opacity.set(0.5, { duration: 200, curve: 'easeInOut'}, _cb);
            _boxModifier.opacity.set(1, { duration: 300, curve: 'easeInOut'}, _cb);
            _boxModifier.transform.set(Transform.scale(1, 1, 1), { duration: 300, curve: 'easeInOut'}, _cb);
        }
        function hide (callback) {
            var _cb = callback ? Utility.after(3, function(){
                callback();
                _backdropModifier.transform.set(_status.outTransform);
                _boxModifier.transform.set(_status.outTransform);
            }) : Utility.after(3, function(){
                _backdropModifier.transform.set(_status.outTransform);
                _boxModifier.transform.set(_status.outTransform);
            });

            _backdropModifier.opacity.set(0, { duration: 200, curve: 'easeInOut'}, _cb);
            _boxModifier.opacity.set(0, { duration: 300, curve: 'easeInOut'}, _cb);
            _boxModifier.transform.set(Transform.scale(2, 2, 1), { duration: 300, curve: 'easeInOut'}, _cb);
        }

        //start
        _createBackdrop();
        _createBox();
        //_createContainerModal();

        /**
         * singleton pattern
         */
        module.exports = {
            register: function(key, renderable) {
                modals[key] = renderable;
            },

            show: function(key, cb) {
                if(isShow)
                    return this.hide.call(this, function () {
                        this.show(key, cb);
                    }.bind(this));
                _boxSurface.show(modals[key]);
                show(cb);
                isShow = true;
            },
            hide: function(cb) {
                if(!isShow)
                    return ;
                hide(cb);
                isShow = false;
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

});