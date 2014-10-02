/**
 * ReactiveTemplate
 *     Display content with meteor template.
 *
 * @constructor
 * @extends {famous/core/Surface}
 * @status v0.3.0
 */
define('famodev/reactive/ReactiveTemplate',[
    'require', 
    'exports',
    'module',
    'famous/core/Surface'
    ],
    function(require, exports, module){

        var Surface             = require('famous/core/Surface');

        function ReactiveTemplate (options){
            Surface.apply(this, arguments);
            if ( !isTemplate(options.template) )
                throw new Error("Component required here");
            // https://github.com/meteor/meteor/blob/a81fbf483efa4f40ea2d382f0c7275d408536e96/packages/blaze/view.js#L196
            if (options.template.isCreated)
                throw new Error("Can't render the same View twice");

            this._template = options.template;

            if (typeof options.data !== 'function') {
                this._data = function() { return options.data; };
            } else {
                this._data = options.data;
            }
        }
        ReactiveTemplate.prototype = Object.create(Surface.prototype);

        /**
         * Functions
         */
        
        /**
         * Methods
         */
        var cleanup = ReactiveTemplate.prototype.cleanup;
        _.extend(ReactiveTemplate.prototype, {
            constructor: ReactiveTemplate,
            /**
             * @method setContent
             */
            setContent: function setContent() {},
            /**
             * Render and insert the UI component into the DOM.
             *
             * @private
             * @method deploy
             * @param {Node} target document parent of this container
             */
            deploy: function deploy(target) {
                var self = this;
                // inplement hooks
                // https://github.com/meteor/meteor/commit/24e3c3e0e1d363b28e87cfd2d2e499048d4f8091
                // ???
                self._stop();
                self._rangeUpdater = Tracker.autorun(function (c) {
                    var data;
                    if(_.isFunction(self._data))
                        data = self._data();
                    if (! c.firstRun)
                        self.emit('changed', data);
                });
                self._blazeView = UI.renderWithData(self._template, self._data, target);
                self.emit('rendered');
            },
            //wrap up cleanup method
            cleanup: function (allocator) {
                this._stop();
                this.emit('destroyed');
                cleanup.call(this, allocator);
            },
            _stop: function () {
                if(this._rangeUpdater && this._rangeUpdater.stop){
                    this._rangeUpdater.stop();
                    this._rangeUpdater = null;
                }
            },
            /**
             * Remove the UI component from the DOM via jQuery, Blaze will cleanup.
             *
             * @private
             * @method recall
             */
            recall: function recall(target) {
                $(target).empty();
            }
        });

        module.exports = ReactiveTemplate;
    });

// with template
// Template.__checkName("example");
// Template["example"] = new Template("Template.example", (function() {
//     var view = this;
//     return HTML.DIV({
//         style: "width: 200px; height: 200px; background: red;"
//     }, "\n        ", Blaze.View(function() {
//         return Spacebars.mustache(view.lookup("session"));
//     }), "\n    ");
// }));

// Meteor.startup(function(){
//     Session.set('session', 'value');
//     require([
//         'famodev/reactive/ReactiveTemplate',
//         'famous/core/Engine',
//         'famous/core/Modifier',
//         'famous/core/Transform',
//         'famous/core/RenderNode'
//     ], function(){
//         var ReactiveTemplate    = require('famodev/reactive/ReactiveTemplate');
//         var Engine              = require('famous/core/Engine');
//         var Modifier            = require('famous/core/Modifier');
//         var Transform           = require('famous/core/Transform');
//         var RenderNode          = require('famous/core/RenderNode');
        
//         var mainContext = Engine.createContext();
//         var sur = new ReactiveTemplate({
//             properties: {
//                 textAlign: 'center',
//                 color: 'white',
//                 fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
//                 fontWeight: '200',
//                 fontSize: '16px',
//                 lineHeight: "200px"
//             },
//             template: Template.example,
//             data: function () {
//                 return {
//                     session: Session.get('session')
//                 };
//             }
//         });

//         var mod = new Modifier({
//             origin: [.5, .5]
//         });

//         sur.on('rendered', function(){
//             console.log('rendered');
//         });

//         sur.on('destroyed', function(){
//             console.log('destroyed');
//         });

//         sur.on('changed', function(data){
//             console.log(data);
//             mod.setTransform(Transform.translate(10, 0, 0), {duration: 500, curve: "easeIn"});
//         });

//         var node = new RenderNode(sur);

//         mainContext.add(mod).add(node);
//         Meteor.setTimeout(function(){
//             Session.set('session', 'value2');

//             Meteor.setTimeout(function(){
//                 node.set(new RenderNode());

//                 Meteor.setTimeout(function(){
//                     Session.set('session', 'value23');
//                     node.set(sur);
//                 }, 1000);

//             }, 1000);

//         }, 1000);
//     });
// });