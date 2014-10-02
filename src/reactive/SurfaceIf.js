/**
 * Surface If Component
 *      Like {{#if}} components in blaze (meteor)
 *
 * @constructor
 * @extends {famous/core/Surface}
 * @status v0.3.0
 */
define('famodev/reactive/SurfaceIf', [
    'require', 
    'exports',
    'module',
    'famous/core/Surface',
    'famodev/reactive/ReactiveSession'
    ],
    function(require, exports, module){

        var Surface             = require('famous/core/Surface');
        var ReactiveSession     = require('famodev/reactive/ReactiveSession');

        function SurfaceIf (options) {
            Surface.apply(this, arguments);
            this._reactiveSession = new ReactiveSession({
                data: options.condition
            });
            _setListeners.call(this);
            // private modifier
            this._modifier = options.modifier;
            this.condition = options.condition;
            this.contentBlock = options.contentBlock;
            this.elseContentBlock = options.elseContentBlock;

            // set content first time
            var content, condition = this.getContent();
            if(condition == '')
                condition = this.condition();
            if(condition) {
                content = this.contentBlock();
            }
            else {
                content = this.elseContentBlock();
            }
            this.setContent(content);
        }
        SurfaceIf.prototype = Object.create(Surface.prototype);

        /**
         * Functions
         */
        function _setListeners () {
            this._reactiveSession.on('changed', function(value){
                this.emit('changed', value);
            }.bind(this));
        }

        /**
         * Methods
         */
        var cleanup = SurfaceIf.prototype.cleanup;
        var deploy  = SurfaceIf.prototype.deploy;
        _.extend(SurfaceIf.prototype, {
            constructor: SurfaceIf,
            //this function will save content in document.createDocumentFragment();
            //we will not change content if we want it reactive
            recall: function (target) {},
            deploy: function (target) {
                deploy.call(this, target);
                this.emit('rendered');
            },
            getModifier: function(){
                var self = this;
                return {
                    beforeSetContent: function(func){
                        self._animateBeforeSetContent = func.bind(self._modifier);
                    },
                    afterSetContent: function(func){
                        self._animateAfterSetContent = func.bind(self._modifier);
                    }
                };
            },
            cleanup: function (allocator) {
                this.emit('destroyed');
                cleanup.call(this, allocator);
            },
            runEffect: function(value){
                var content;
                if(value) {
                    content = this.contentBlock();
                }
                else {
                    content = this.elseContentBlock();
                }
                if (this._animateBeforeSetContent /** and equal function*/ ) {
                    this._animateBeforeSetContent(function () {
                        this._animateBeforeSetContent = null;
                        this.setContent(content);
                        if (this._animateAfterSetContent /** and equal function*/ ) {
                            this._animateAfterSetContent();
                            this._animateAfterSetContent = null;
                        }
                    }.bind(this));
                }
                else {
                    this.setContent(content);
                    if (this._animateAfterSetContent /** and equal function*/ ) {
                        this._animateAfterSetContent();
                        this._animateAfterSetContent = null;
                    }
                }
            }
        });

        module.exports = SurfaceIf;

    });

// example
// Meteor.startup(function () {
//     Session.set('surfaceIf', false);
//     require([
//             'famous/core/Modifier',
//             'famous/core/Engine',
//             'famodev/reactive/SurfaceIf',
//             'famous/core/RenderNode'
//         ],
//         function(Modifier, Engine, SurfaceIf, RenderNode){

//         var mainContext = Engine.createContext();
//         var mod = new Modifier({
//             align: [0.5, 0.5],
//             origin: [0.5, 0.5]
//         });
//         var _surface = new SurfaceIf({
//             modifier: mod,
//             condition: function () {
//                 if (Session.get('surfaceIf')) return true;
//                 else return false;
//             },
//             contentBlock: function () {
//                 return '1010101';
//             },
//             elseContentBlock: function () {
//                 return '0000000';
//             },
//             size: [120, 120],
//             classes: ['filterIcon'],
//             properties: {
//                 color: 'white',
//                 backgroundColor: '#FA5C4F',
//                 lineHeight: '120px',
//                 textAlign: 'center'
//             }
//         });

//         _surface.on('click', function () {
//             if (!Session.get('surfaceIf')) Session.set('surfaceIf', true);
//             else Session.set('surfaceIf', false);
//         });

//         _surface.on('changed', function (data) {
//             console.log(data);
//             var mod = this.getModifier();
//             mod.beforeSetContent(function (cb) {
//                 this.setOpacity(0.25, {
//                     duration: 500,
//                     curve: "easeIn"
//                 }, cb);
//             });
//             mod.afterSetContent(function () {
//                 this.setOpacity(1, {
//                     duration: 500,
//                     curve: "easeIn"
//                 });
//             });
//             this.runEffect(data);
//         }.bind(_surface));

//         _surface.on('rendered', function(){
//             console.log('rendered');
//         });

//         _surface.on('destroyed', function(){
//             console.log('destroyed');
//         });

//         var node = new RenderNode(_surface);

//         // test delete
//         Meteor.setTimeout(function(){
//             node.set(new RenderNode());
//             // re add
//             Meteor.setTimeout(function(){
//                 Session.set('surfaceIf', true);
//                 node.set(_surface);
//             }, 1000);

//         }, 1000);

//         mainContext
//         .add(mod)
//         .add(node);
//     });
// });