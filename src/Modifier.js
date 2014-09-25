define('famodev/Modifier',[
    'require', 
    'exports',
    'module',
    'famous/core/Modifier',
    'famous/transitions/Transitionable',
    'famous/transitions/TransitionableTransform',
    'famous/core/Transform',
    'famodev/Utils'
    ],
    function (require, exports, module) {
        
        var Modifier                = require('famous/core/Modifier');
        var Transitionable          = require('famous/transitions/Transitionable');
        var TransitionableTransform = require('famous/transitions/TransitionableTransform');
        var Transform               = require('famous/core/Transform');

        var Utils                   = require('famodev/Utils');

        function Modifier2 (options) {
            this._xTran = new Transitionable(0);
            this._yTran = new Transitionable(0);
            this._zTran = new Transitionable(0);
            if (options) {
                if (options.transform) {
                    this.setX(options.transform[12]);
                    this.setY(options.transform[13]);
                    this.setZ(options.transform[14]);
                    options.transform = function() {
                        return Transform.translate(this._xTran.get(), this._yTran.get(), this._zTran.get());
                    }.bind(this);
                }                
            }
            else {
                options = {};
                options.transform = function() {
                    return Transform.translate(this._xTran.get(), this._yTran.get(), this._zTran.get());
                }.bind(this);
            }

            // start position
            this._xPosStart  = this._xTran.get();
            this._yPosStart  = this._yTran.get();
            this._zPosStart  = this._zTran.get();
            // current position
            this.resetPosition();

            Modifier.call(this, options);

            // scale
            this._scale = new TransitionableTransform(Transform.scale(1, 1, 1));
            this._modScale = new Modifier({
                transform: this._scale
            });
        }
        Modifier2.prototype = Object.create(Modifier.prototype);
        Modifier2.prototype.constructor = Modifier2;

        /**
         *
         */
        Modifier2.prototype.resetPosition = function () {
            this._xPos  = this._xPosStart;
            this._yPos  = this._yPosStart;
            this._zPos  = this._zPosStart;
        };
        /**
         *
         */
        Modifier2.prototype.getX = function () {
            return this._xPos;
        };
        /**
         *
         */
        Modifier2.prototype.getY = function () {
            return this._yPos;
        };
        /**
         *
         */
        Modifier2.prototype.getZ = function () {
            return this._zPos;
        };
        /**
         *
         */
        Modifier2.prototype.setX = function (val, tran, cb) {
            this._xPos = val;
            this._xTran.set(val, tran, cb);
            return this;
        };
        /**
         *
         */
        Modifier2.prototype.setY = function (val, tran, cb) {
            this._yPos = val;
            this._yTran.set(val, tran, cb);
            return this;
        };
        /**
         *
         */
        Modifier2.prototype.setZ = function (val, tran, cb) {
            this._zPos = val;
            this._zTran.set(val, tran, cb);
            return this;
        };
        /**
         *
         */
        Modifier2.prototype.addX = function (val, tran, cb) {
            this._xPos += val;
            this._xTran.set(this._xPos, tran, cb);
            return this;
        };
        /**
         *
         */
        Modifier2.prototype.addY = function (val, tran, cb) {
            this._yPos += val;
            this._yTran.set(this._yPos, tran, cb);
            return this;
        };
        /**
         *
         */
        Modifier2.prototype.addZ = function (val, tran, cb) {
            this._zPos += val;
            this._zTran.set(this._zPos, tran, cb);
            return this;
        };
        /**
         *
         */
        Modifier2.prototype.resetPositionX = function (tran, cb) {
            this.resetPosition();
            this._xTran.set(this._xPosStart, tran, cb);
            return this;
        };
        /**
         *
         */
        Modifier2.prototype.resetPositionY = function (tran, cb) {
            this.resetPosition();
            this._yTran.set(this._yPosStart, tran, cb);
            return this;
        };
        /**
         *
         */
        Modifier2.prototype.resetPositionZ = function (tran, cb) {
            this.resetPosition();
            this._zTran.set(this._zPosStart, tran, cb);
            return this;
        };


        module.exports = Modifier2;
    });