Famono.scope('famodev/ReactiveTemplate', ["famous/core/Surface"], function(require, define) {
/**
 * ReactiveTemplate
 * 
 * {{ Missing param }}
 *
 * @constructor
 * @extends {famous/core/Surface}
 * @status stable
 */
define(function(require, exports, module){
        
        var Surface             = require('famous/core/Surface');

        function ReactiveTemplate (options){
            Surface.apply(this, arguments);
            if (! UI.isComponent(options.template))
                throw new Error("Component required here");
            if (options.template.isInited)
                throw new Error("Can't render component instance");

            this._template = options.template;

            if (typeof options.data !== 'function') {
                this._data = function() { return options.data; };
            } else {
                this._data = options.data;
            }
        };
        ReactiveTemplate.prototype = Object.create(Surface.prototype);
        ReactiveTemplate.prototype.constructor = ReactiveTemplate;
        /**
         * noop.
         *
         * @method setContent
         *
         */
        ReactiveTemplate.prototype.setContent = function setContent() {};

        /**
         * Render and insert the UI component into the DOM.
         *
         * @private
         * @method deploy
         * @param {Node} target document parent of this container
         */
        ReactiveTemplate.prototype.deploy = function deploy(target) {
            this._renderTmp = UI.render(this._template.extend({data: this._data}));
            UI.insert(this._renderTmp, target);
        };

        /**
         * Remove the UI component from the DOM via jQuery, Blaze will cleanup.
         *
         * @private
         * @method recall
         */
        ReactiveTemplate.prototype.recall = function recall(target) {
            $(target).empty();
        };
        module.exports = ReactiveTemplate;
    });

// with template
// Template.__define__("example", (function() {
//     var self = this;
//     var template = this;
//     return HTML.DIV({
//         style: "width: 200px; height: 200px; background: red;"
//     }, "\n        ", function() {
//         return Spacebars.mustache(self.lookup("session"));
//     }, "\n    ");
// }));
// Template.example.session = function(){
//     return Session.get('session');
// };
// Meteor.startup(function(){
//     Session.setDefault('session', 'value');
//     define([
//         'famodev/ReactiveTemplate',
//         'famous/core/Engine',
//         'famous/core/Modifier'
//     ], function(){
//         var ReactiveTemplate    = require('famodev/ReactiveTemplate');
//         var Engine              = require('famous/core/Engine');
//         var Modifier            = require('famous/core/Modifier');

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
//             template: Template.example
//         });

//         var mod = new Modifier({
//             origin: [.5, .5]
//         });

//         sur.on('changed', function(data){
//             console.log(data);
//             mod.setTransform(Transform.translate(10, 0, 0), {duration: 500, curve: "easeIn"});
//         });

//         mainContext.add(mod).add(sur);
//         Meteor.setTimeout(function(){
//             Session.set('session', 'value2');
//         }, 3000);
//     });
// });
});