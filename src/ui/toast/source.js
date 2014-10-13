/**
 * Toast
 *      Like toast components in android
 *
 * @constructor
 * @extends {}
 * @status v0.3.0
 */
// FIXME: Think about template content
// and position

define('famodev/ui/Toast', [
    'require', 
    'exports',
    'module',
    'famous/core/RenderNode',
    'famous/core/Surface',
    'famous/core/Transform',
    'famous/core/Modifier',

    'famodev/Utils',
    'famodev/reactive/ReactiveSurface'
    ],
    function(require, exports, module) {

        var RenderNode  = require('famous/core/RenderNode');
        var Surface     = require('famous/core/Surface');
        var Transform   = require('famous/core/Transform');
        var Modifier    = require('famous/core/Modifier');

        var Utils       = require('famodev/Utils');
        var ReactiveSurface = require('famodev/reactive/ReactiveSurface');

        var _message = new ReactiveVar();
        // _message.set('I am a tweet. I have exactly 140 characters. If you want to make sure that I only have 140 characters you can check for yourself. 0123456789');
        _message.set('');

        // hide, show
        var _effectModifier     = new Modifier({
            opacity: 0,
            transform: Transform.translate(0, 0, 0)
        });
        // y axis
        var _positionYModifier  = null;
        // x axis
        var _positionXModifier  = null;
        // message surface
        var _messageSurface     = null;
        // node
        var _node               = new RenderNode();

        function Toast (options) {
            this.options = options || {};
            if(!this.options.duration)
            this.options.duration = Toast.DURATION;
        
            if(!this.options.outEffect)
                this.options.outEffect = Toast.OUT_EFFECT;

            if(!this.options.inEffect)
                this.options.inEffect = Toast.IN_EFFECT;
        }
        _.extend(Toast.prototype, {
            setText: function(text){
                Toast._setText(text);
            },
            show: function () {
                if(Toast.IS_SHOW){
                var t = Toast.toastList.pop();
                    if(t)
                        t.hide(_.bind(function () {
                            this.show();
                        }, this));
                    return;
                }
                Toast.IS_SHOW = true;
                Toast.toastList.push(this);
                // if(this.options.data)
                //     Toast._setData(this.options.data);
                // if(this.options.template)
                //     Toast._setContent(this.options.template);
                // if(this.options.position)
                //     Toast._setPosition(this.options.position);
                if(this.options.text)
                    this.setText(this.options.text);
            
                Toast._show(this.options.inEffect);
                if(this.options.duration && this.options.duration != Toast.UNIDENTIFIED)
                    this._setTimeoutIDduration = Meteor.setTimeout(_.bind(function () {
                       this.hide(); 
                    }, this), this.options.duration);

            },
            hide: function (cb) {
                if(this._setTimeoutIDduration) {
                    Meteor.clearTimeout(this._setTimeoutIDduration);
                    this._setTimeoutIDduration = null;
                }
                Toast._hide(this.options.outEffect, _.bind(function () {
                    Toast.IS_SHOW = false;
                    Toast.toastList.pop();
                    if(_.isFunction(cb))
                        cb();
                }, this));
            }
        });

        // static methods
        _.extend(Toast, {
            DURATION: 2000, // 2s
            UNIDENTIFIED: {},
            IN_EFFECT: {
                duration: 200,
                curve: 'easeIn'
            },
            OUT_EFFECT: {
                duration: 200,
                curve: 'easeIn'
            },
            IS_SHOW: false,
            toastList: [],

            createText: function (options) {
                return new Toast(options);
            },
            _getText: function () {
                return _message.get();
            },
            _setText: function (t) {
                _message.set(t);
            },
            _show: function(opt, cb){
                _effectModifier.setOpacity(1, opt, cb);
            },
            _hide: function(opt, cb){
                _effectModifier.setOpacity(0, opt, cb);
            },

            init: function(appContent, zIndex){
                this._initMessage();
                this._initXaxis();
                this._initYaxis(zIndex);

                _node
                .add(_positionYModifier)
                .add(_positionXModifier)
                .add(_messageSurface);

                appContent
                .add(_effectModifier)
                .add(_node);
            },
            _initMessage: function(){
                if(!_messageSurface) {
                    _messageSurface = new ReactiveSurface({
                        size: [320, true],
                        // <i class="fa fa-info fr" style=""></i>
                        classes: ['border-rounded', 'color-white', 'text-center'],
                        properties: {
                            backgroundColor: '#666',
                            lineHeight: '23px',
                            padding: '16px 32px'
                        },
                        content: function(){
                            return _message.get();
                        }
                    });
                    _messageSurface.on('click', function(){
                        Toast._hide();
                    });
                }
            },
            _initXaxis: function(){
                if(!_positionXModifier) {
                    // var initialTime = Date.now();
                    _positionXModifier = new Modifier({
                        align: [0.5, 1],
                        origin: [0.5, 0.5],
                        transform : function(){
                            // return Transform.rotateZ(.01 * (Date.now() - initialTime));
                            return
                            Transform.translate((Utils.windowWidth() - 320)/2, 0, 0);
                        }
                    });
                }
            },
            _initYaxis: function(zIndex){
                if(!_positionYModifier) {
                    _positionYModifier = new Modifier({
                        align: [0, 1],
                        transform: Transform.translate(0, -100, zIndex)
                    });
                }
            }
        });

        module.exports = Toast;

});

// Meteor.startup(function(){
//     require([
//         'famous/core/Engine',
//         'famodev/ui/Toast'
//     ], function(Engine, Toast) {
//         var mainContext = Engine.createContext();
//         // create toast
//         Toast.init(mainContext, zIndex6_toast);
//         var t = Toast.createText({
//             duration: Toast.UNIDENTIFIED,
//             text: 'voting...'
//         });
//         t.show();
//         Meteor.setTimeout(function() {
//             t.setText('done');
//             Meteor.setTimeout(function() {
//                 t.hide();
//             }, 1000);
//         }, 2000);
//     });
// });

// Meteor.startup(function(){
//     require([
//         'famous/core/Engine',
//         'famodev/ui/Toast',
//         'famous/transitions/Easing'
//     ], function(Engine, Toast, Easing) {
//         var mainContext = Engine.createContext();
//         // create toast
//         Toast.init(mainContext, zIndex6_toast);
//         var t = Toast.createText({
//             duration: Toast.UNIDENTIFIED,
//             text: 'voting...',
//             outEffect: {
//                 duration : 1000,
//                 curve: Easing.inBounce
//             },
//             inEffect: {
//                 duration : 1000,
//                 curve: Easing.inBounce
//             }
//         });
//         t.show();
//         Meteor.setTimeout(function() {
//             t.setText('done');
//             Meteor.setTimeout(function() {
//                 t.hide();
//             }, 1000);
//         }, 2000);
//     });
// });

    // var t = Toast.createText({
    //      duration: Toast.UNIDENTIFIED,
    //      text: 'voting...',
    //      outEffect,
    //      inEffect,
    //      position,
    //      data,
    //      template
    // }); 
    // t.show();
    // t.setText('done');
    // t.hide();