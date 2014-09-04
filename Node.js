define(function (require, exports, module) {

        var ViewSequence    = require('famous/core/ViewSequence');
        var Modifier        = require('famous/core/Modifier');
        var Surface         = require('famous/core/Surface');
        var RenderNode      = require('famous/core/RenderNode');
        var Transform       = require('famous/core/Transform');
        var EventHandler    = require('famous/core/EventHandler');
        var Transitionable  = require('famous/transitions/Transitionable');

        function Node(options) {
            this._surface = null;
            this._modifier = null;
            this._node = new RenderNode();

            if(options.surface) {
                this._surface = options.surface;
            }
            if(options.modifier) {
                this._modifier = options.modifier;
            }
        }
        Node.prototype = Object.create(ViewSequence.prototype);
        Node.prototype.constructor = Node;
        Node.DEFAULT_OPTIONS = ViewSequence.DEFAULT_OPTIONS;

        /**
         * Methods
         */

        Node.prototype.getModifier = function () {
            return this._modifier;
        };

        Node.prototype.getSurface = function () {
            return this._surface;
        };

        Node.prototype.setModifier = function (mod) {
            this._modifier = mod;
            return this;
        };

        Node.prototype.setSurface = function (sur) {
            this._surface = sur;
            return this;
        };

        Node.prototype.render = function () {
            if(!this._surface)
                throw new Error('Surface not found');
            if(!this._modifier)
                throw new Error('Modifier not found');
            this._node.add(this._modifier).add(this._surface);
            this._addMethods();
            return this._node.render();
        };

        Node.prototype._addMethods = function () {
            // surface
            // https://github.com/Famous/famous/blob/master/core/Surface.js
            // https://github.com/Famous/famous/blob/master/core/ElementOutput.js

            this.on             = this._surface.on;
            this.removeListener = this._surface.removeListener;
            this.emit           = this._surface.emit;
            this.pipe           = this._surface.pipe;
            this.unpipe         = this._surface.unpipe;

            // modifier
            // https://github.com/Famous/famous/blob/master/core/Modifier.js
            this.setTransform       = this._modifier.setTransform;
            this.setOpacity         = this._modifier.setOpacity;
            this.setOrigin          = this._modifier.setOrigin;
            this.setAlign           = this._modifier.setAlign;
            this.setSize            = this._modifier.setSize;
            this.getTransform       = this._modifier.getTransform;
            this.getFinalTransform  = this._modifier.getFinalTransform;
            this.getOpacity         = this._modifier.getOpacity;
            this.getOrigin          = this._modifier.getOrigin;
            this.getSize            = this._modifier.getSize;

        };

        module.exports = Node;

    });

/**
 * CODE STYLES

    var Node = require('famodev/Node');

    var n = new Node({});

    n.getModifier();
    n.getSurface();

 */
