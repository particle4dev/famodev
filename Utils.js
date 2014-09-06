
define(function(require, exports, module) {

        var Transform = require('famous/core/Transform');
        var Utilities = require('famous/math/Utilities');

        module.exports = {
            getWindowHeight: function () {
                return window.innerHeight;
            },
            getWindowWidth: function () {
                return window.innerWidth;
            },
            frontOfZ: function(m, value) {
                if (value === undefined) value = 1;
                if(_.isArray(m))
                    return Transform.translate(m[12], m[13], m[14] + value);
                if(_.isObject(m) && m.getFinalTransform)
                    // recursive function
                    return frontOfZ(m.getFinalTransform());
            },
            behindZ: function(m, value) {
                if (value === undefined) value = 1;
                if(_.isArray(m))
                    return Transform.translate(m[12], m[13], m[14] - 1);
                if(_.isObject(m) && m.getFinalTransform)
                    // recursive function
                    return behindZ(m.getFinalTransform());
            },
            getModifierX: function (t) {
                return Math.round(t.getTransform.call(t)[12]);
            },
            getModifierY: function (t) {
                return Math.round(t.getTransform()[13]);
            },
            getModifierZ: function (t) {
                return Math.round(t.getTransform()[14]);
            }
        };
});
