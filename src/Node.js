define('famodev/Node',[
    'require', 
    'exports',
    'module',
    'famous/core/RenderNode',
    'famous/inputs/GenericSync',
    'famous/inputs/MouseSync',
    'famous/inputs/TouchSync',

    'famodev/Modifier'
    ],
    function (require, exports, module) {

        var RenderNode          = require('famous/core/RenderNode');
        var GenericSync         = require('famous/inputs/GenericSync');
        var MouseSync           = require('famous/inputs/MouseSync');
        var TouchSync           = require('famous/inputs/TouchSync');

        var Modifier            = require('famodev/Modifier');

        GenericSync.register({
            'mouse': MouseSync,
            'touch': TouchSync
        });

        function Node(options) {
            RenderNode.apply(this);
            this._surface = null;
            this._modifier = null;

            if(options.surface) {
                this._surface = options.surface;
            }
            if(options.modifier) {
                this._modifier = options.modifier;
            }
            var t = this.add(this._modifier);
            if(this._modifier instanceof Modifier)
                t = t.add(this._modifier._modScale);
            t.add(this._surface);

            this._addMethods();
            this._addEvents();
            this.options = _.extend(options, Node.DEFAULT_OPTIONS); 
        }
        Node.prototype = Object.create(RenderNode.prototype);
        Node.prototype.constructor = Node;
        Node.DEFAULT_OPTIONS = {
            holdTime: 500
        };
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

        Node.prototype._addMethods = function () {
            // surface
            // https://github.com/Famous/famous/blob/master/core/Surface.js
            // https://github.com/Famous/famous/blob/master/core/ElementOutput.js
            if(!this._surface)
                return;
            if(!this._modifier)
                return;

            this.on             = this._surface.on.bind(this._surface);
            this.removeListener = this._surface.removeListener.bind(this._surface);
            this.emit           = this._surface.emit.bind(this._surface);
            this.pipe           = this._surface.pipe.bind(this._surface);
            this.unpipe         = this._surface.unpipe.bind(this._surface);

            // modifier
            // https://github.com/Famous/famous/blob/master/core/Modifier.js
            this.setTransform       = this._modifier.setTransform.bind(this._modifier);
            this.setOpacity         = this._modifier.setOpacity.bind(this._modifier);
            this.setOrigin          = this._modifier.setOrigin.bind(this._modifier);
            this.setAlign           = this._modifier.setAlign.bind(this._modifier);
            this.setSize            = this._modifier.setSize.bind(this._modifier);
            this.getTransform       = this._modifier.getTransform.bind(this._modifier);
            this.getFinalTransform  = this._modifier.getFinalTransform.bind(this._modifier);
            this.getOpacity         = this._modifier.getOpacity.bind(this._modifier);
            this.getOrigin          = this._modifier.getOrigin.bind(this._modifier);
            // famodev's modifier
            if(this._modifier instanceof Modifier) {
                this.getX          = this._modifier.getX.bind(this._modifier);
                this.getY          = this._modifier.getY.bind(this._modifier);
                this.getZ          = this._modifier.getZ.bind(this._modifier);

                this.setX          = this._modifier.setX.bind(this._modifier);
                this.setY          = this._modifier.setY.bind(this._modifier);
                this.setZ          = this._modifier.setZ.bind(this._modifier);

                this.addX          = this._modifier.addX.bind(this._modifier);
                this.addY          = this._modifier.addY.bind(this._modifier);
                this.addZ          = this._modifier.addZ.bind(this._modifier);

                this.resetX          = this._modifier.resetPositionX.bind(this._modifier);
                this.resetY          = this._modifier.resetPositionY.bind(this._modifier);
                this.resetZ          = this._modifier.resetPositionZ.bind(this._modifier);
            }

        };

        Node.prototype._addEvents = function(){
            var sync = new GenericSync(
            ['mouse', 'touch'], {
                direction: GenericSync.DIRECTION_X
            });
            this.pipe(sync);
            /**
             * Hold events
             *      http://stackoverflow.com/questions/4710111/determining-long-tap-long-press-tap-hold-on-android-with-jquery
             *      http://stackoverflow.com/questions/6139225/how-to-detect-a-long-touch-pressure-with-javascript-for-android-and-iphone
             */

            sync.on('start', function(data) {
                // start hold event
                this._idHoldEvent = setTimeout(function () {
                    this._holdEvent = true;
                    this.emit('hold', data);
                }.bind(this), this.options.holdTime);
            }.bind(this));

            sync.on('update', function(data) {
                this.emit('moveX', data);
                if(this._holdEvent)
                    this.emit('hold', data);
            }.bind(this));

            sync.on('end', function(data) {
                this.emit('moveEnd', data);
                // clear hold event
                if(this._idHoldEvent) {
                    clearTimeout(this._idHoldEvent);
                    this._idHoldEvent = null;
                    this._holdEvent = false;
                }
            }.bind(this));
        };

        module.exports = Node;

    });