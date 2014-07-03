define(function(require, exports, module){
        var Surface             = require('famous/core/Surface');

        function ReactiveSurface (){
            Surface.apply(this, arguments);

        };
        ReactiveSurface.prototype = Object.create(Surface.prototype);
        ReactiveSurface.prototype.constructor = ReactiveSurface;
        ReactiveSurface.prototype.deploy = function deploy(target) {
            //https://github.com/meteor/meteor/blob/devel/packages/ui/render.js#L343
            var self = this;
            self.rangeUpdater = Deps.autorun(function (c) {
                var content = self.getContent();
                if(typeof content === 'function')
                    content = content();
                if (content instanceof Node) {
                    while (target.hasChildNodes()) target.removeChild(target.firstChild);
                    target.appendChild(content);
                }
                else target.innerHTML = content;
                if (! c.firstRun)
                    self.emit('changed', content);
            });
        };
        /**
         * Set or overwrite inner (HTML) content of this surface. Note that this
         *    causes a re-rendering if the content has changed.
         *
         * @method setContent
         * @param {string|Document Fragment} content HTML content
         */
        Surface.prototype.setContent = function setContent(content) {
            var self = this;
            if(self.rangeUpdater && self.rangeUpdater.stop){
                self.rangeUpdater.stop()
                self.rangeUpdater = null;
            }
            if (this.content !== content) {
                this.content = content;
                this._contentDirty = true;
            }
        };
        module.exports = ReactiveSurface;
});
// with session

// Meteor.startup(function(){
//     Session.setDefault('session', 'value');
//     define([
//         'famodev/ReactiveSurface',
//         'famous/core/Engine',
//         'famous/core/Modifier'
//     ], function(){
//         var ReactiveSurface = require('famodev/ReactiveSurface');
//         var Engine          = require('famous/core/Engine');
//         var Modifier        = require('famous/core/Modifier');

//         var mainContext = Engine.createContext();
//         var sur = new ReactiveSurface({
//             size: [200, 200],
//             properties: {
//                 textAlign: 'center',
//                 color: 'white',
//                 fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
//                 fontWeight: '200',
//                 fontSize: '16px',
//                 lineHeight: "200px",
//                 background: 'red'
//             },
//             content: function(){
//                 return Session.get('session');
//             }
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

//with database

// Meteor.startup(function(){
//     Items = new Meteor.Collection('items',{
//         connection: null
//     });
//     Items.insert({
//         _id: 'test',
//         text: 'cookie'
//     });
//     define([
//         'famodev/ReactiveSurface',
//         'famous/core/Engine',
//         'famous/core/Modifier'
//     ], function(){
//         var ReactiveSurface = require('famodev/ReactiveSurface');
//         var Engine          = require('famous/core/Engine');
//         var Modifier        = require('famous/core/Modifier');

//         var mainContext = Engine.createContext();
//         var sur = new ReactiveSurface({
//             size: [200, 200],
//             properties: {
//                 textAlign: 'center',
//                 color: 'white',
//                 fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
//                 fontWeight: '200',
//                 fontSize: '16px',
//                 lineHeight: "200px",
//                 background: 'red'
//             },
//             content: function(){
//                 return Items.findOne('test').text;
//             }
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
//             Items.update('test', {$set: {text: 'cookie 2'}});
//         }, 3000);
//     });
// });
