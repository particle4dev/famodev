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
            if (! Blaze.isTemplate(options.template))
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
            var self = this,
            data = {};
            if(_.isFunction(self._data))
                data = self._data();
            // inplement hooks
            var originRendered = self._template.rendered;
            self._template.rendered = function () {
                originRendered.call(this);
                // https://github.com/meteor/meteor/commit/24e3c3e0e1d363b28e87cfd2d2e499048d4f8091
                // FIXME: fire event
                _.each(this.findAll('.watch'), function (container) {
                    container._uihooks = {
                        insertElement: function (n, next) {
                            console.log("insert");
                            container.insertBefore(n, next);
                        },
                        removeElement: function (n) {
                            console.log("remove");
                            container.removeChild(n);
                        },
                        moveElement: function (n, next) {
                            console.log("move");
                            container.insertBefore(n, next);
                        }
                    };
                });
            };

            self.rangeUpdater = Deps.autorun(function (c) {
                self._renderTmp = UI.renderWithData(self._template, data);
                UI.insert(self._renderTmp, target);
                if (! c.firstRun)
                    self.emit('changed', data);
            });
            self.emit('rendered');

        };

        //wrap up cleanup method
        var cleanup = ReactiveTemplate.prototype.cleanup;
        ReactiveTemplate.prototype.cleanup = function (allocator) {
            var self = this;
            if(self.rangeUpdater && self.rangeUpdater.stop){
                self.rangeUpdater.stop();
                self.rangeUpdater = null;
            }
            cleanup.call(this, allocator);

            // FIXME: thinking about this
            this.emit('destroyed');
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
