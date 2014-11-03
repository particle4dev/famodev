define('famodev/ui/Button', [
    'require', 
    'exports',
    'module',
    'famous/core/Surface',
    'famous/core/Transform',
    'famous/transitions/Transitionable'
    ], function (require, exports, module) {
    'use strict';

    var Surface             = require('famous/core/Surface');
    var Transform           = require('famous/core/Transform');
    var Transitionable      = require('famous/transitions/Transitionable');

    function ButtonSurface() {
        Surface.apply(this, arguments);

        this.gradientOpacity = new Transitionable(0.1);
        this.gradientSize = new Transitionable(0);
        this.offsetX = 0;
        this.offsetY = 0;

        this.on('mousedown', function (data) {
            this.offsetX = (data.offsetX || data.layerX) + 'px';
            this.offsetY = (data.offsetY || data.layerY) + 'px';

            this.gradientOpacity.set(0.1);
            this.gradientSize.set(0);
            this.gradientSize.set(100, {
                duration: 300,
                curve: 'easeOut'
            });
        }.bind(this));

        this.on('mouseup', function () {
            this.gradientOpacity.set(0, {
                duration: 300,
                curve: 'easeOut'
            });
        });

        this.on('mouseleave', function () {
            this.gradientOpacity.set(0, {
                duration: 300,
                curve: 'easeOut'
            });
        });
    }

    ButtonSurface.prototype = Object.create(Surface.prototype);
    ButtonSurface.prototype.constructor = ButtonSurface;

    ButtonSurface.prototype.render = function () {
        var gradientOpacity = this.gradientOpacity.get();
        var gradientSize = this.gradientSize.get();
        var fadeSize = gradientSize * 0.75;

        this.setProperties({
            backgroundImage: 'radial-gradient(circle at ' + this.offsetX + ' ' + this.offsetY + ', rgba(0,0,0,' + gradientOpacity + '), rgba(0,0,0,' + gradientOpacity + ') ' + gradientSize + 'px, rgba(255,255,255,' + gradientOpacity + ') ' + gradientSize + 'px)'
        });

        // return what Surface expects
        return this.id;
    };

    module.exports = ButtonSurface;
});

// Meteor.startup(function () {
// // http://stackoverflow.com/questions/24946191/how-to-implement-google-paper-button-effects
// // https://github.com/Famous/famous/blob/master/src/surfaces/SubmitInputSurface.js
// // https://github.com/Famous/famous/blob/master/src/surfaces/InputSurface.js
// require([
//     'require',
//     'exports',
//     'module',
//     'famous/core/Engine',
//     'famous/core/Transform',
//     'famous/utilities/Timer',
//     'famous/modifiers/StateModifier',
//     'famodev/ui/Button'
//     ], function (require, exports, module) {
//     var Engine              = require('famous/core/Engine');
//     var Transform           = require('famous/core/Transform');
//     var Timer               = require('famous/utilities/Timer');
//     var StateModifier       = require('famous/modifiers/StateModifier');
//     var ButtonSurface       = require('famodev/ui/Button');

//     var mainContext = Engine.createContext();

//     var surface = new ButtonSurface({
//         content: 'Secondary',
//         size: [150, 44],
//         properties: {
//             fontFamily: 'Helvetica Neue',
//             fontSize: '18px',
//             fontWeight: '300',
//             textAlign: 'center',
//             lineHeight: '44px',
//             backgroundColor: '#ecf0f1'
//         }
//     });

//     var modifier = new StateModifier({
//         transform: Transform.translate(50, 50, 0)
//     });

//     var surface2 = new ButtonSurface({
//         content: 'Primary',
//         size: [150, 44],
//         properties: {
//             fontFamily: 'Helvetica Neue',
//             fontSize: '18px',
//             fontWeight: '300',
//             textAlign: 'center',
//             lineHeight: '44px',
//             backgroundColor: '#3799dc'
//         }
//     });

//     var modifier2 = new StateModifier({
//         transform: Transform.translate(250, 50, 0)
//     });

//     var surface3 = new ButtonSurface({
//         content: 'Big Button',
//         size: [150, 150],
//         properties: {
//             fontFamily: 'Helvetica Neue',
//             fontSize: '18px',
//             fontWeight: '300',
//             textAlign: 'center',
//             lineHeight: '150px',
//             backgroundColor: '#1abc9c'
//         }
//     });

//     var modifier3 = new StateModifier({
//         transform: Transform.translate(450, 50, 0)
//     });


//     mainContext.add(modifier).add(surface);
//     mainContext.add(modifier2).add(surface2);
//     mainContext.add(modifier3).add(surface3);
// });

// });