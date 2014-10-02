/**
 * Surface If Component
 *      Like {{#each}} components in blaze (meteor)
 *
 * @constructor
 * @extends {famous/core/Surface}
 * @status v0.3.0
 */

define('famodev/reactive/Each',[
    'require', 
    'exports',
    'module',
    'famous/core/ViewSequence',
    'famous/core/Surface',
    'famous/core/Transform',
    'famous/core/EventHandler',
    'famous/transitions/Transitionable',
    'famous/core/RenderNode',

    'famodev/Node',
    'famodev/Modifier',
    'famodev/Utils',
    'famodev/reactive/ReactiveCursor'
    ],
    function (require, exports, module) {

        var ViewSequence    = require('famous/core/ViewSequence');
        var Surface         = require('famous/core/Surface');
        var Transform       = require('famous/core/Transform');
        var EventHandler    = require('famous/core/EventHandler');
        var Transitionable  = require('famous/transitions/Transitionable');
        var RenderNode      = require('famous/core/RenderNode');

        var Node            = require('famodev/Node');
        var Modifier        = require('famodev/Modifier');
        var Utils           = require('famodev/Utils');
        var ReactiveCursor  = require('famodev/reactive/ReactiveCursor');

        function Each(options) {
            this._cursor = new ReactiveVar();
            this._beforeAddedFunction = Each.DEFAULT_BEFORE_ADDED;
            this._dataList = [];
            this._eventOutput = new EventHandler();
            EventHandler.setOutputHandler(this, this._eventOutput);
            if(_.isObject(options)){
                if(options.scrollview)
                    this._scrollview = options.scrollview;
                var args = Array.prototype.slice.call(arguments, 1);
                if(_.isFunction(options.data)){
                    this._datacursor = options.data;
                    this._renderTemplate = options.template;
                    var args = arguments;
                    setTimeout(function () {
                        this.handWithCursor.apply(this, args);
                    }.bind(this), 0);
                    ViewSequence.apply(this, [this._dataList]);
                    return ;
                }
                if(_.isArray(options.data)){
                    this._dataList = options.data;
                    args.unshift(this._dataList);
                    ViewSequence.apply(this, args);
                    return ;
                }
            }
            ViewSequence.apply(this, arguments);
        }
        Each.prototype = Object.create(ViewSequence.prototype);
        Each.DEFAULT_OPTIONS = _.extend(ViewSequence.DEFAULT_OPTIONS, {});
        Each.DEFAULT_BEFORE_ADDED = function(view){
            var node = new Node({
                modifier: new Modifier({
                    transform: Transform.translate(0, 0, 0)
                }),
                surface: view
            });
            return node;
        };
        /** Backing */
        Each.Backing = function (array){
            ViewSequence.Backing.apply(this, arguments);
        };
        Each.Backing.prototype = Object.create(ViewSequence.Backing.prototype);
        Each.Backing.prototype.constructor = Each.Backing;

        /**
         * Functions
         */

        /**
         * Methods
         */
        _.extend(Each.prototype, {
            constructor: Each,
            /**
             * _beforeAdded is used to apply
             *
             * @chainable
             */
            setBeforeAdded: function (func) {
                this._beforeAddedFunction = func;
                return this;
            },
            /**
             * hand cursor
             *
             * @return null
             */
            handWithCursor: function (options) {
                // create cursor
                // https://github.com/meteor/meteor/blob/0b1d744731dc7fb4477331ebad5f5d62276000f1/packages/blaze/builtins.js#L69
                // FIXME: what about function is array ?
                // FIXME: do we need stop track ?

                this._reactiveCursor = new ReactiveCursor({
                    data: this._datacursor
                });

                this._reactiveCursor.on('addedAt', function(data){
                    var temp = this._renderTemplate(data.item, data.i);
                    // attach events
                    temp._record = data.item;
                    temp.getId = function () {
                        return data.id;
                    };

                    temp.pipe(this._scrollview);
                    if(_.isFunction(this._beforeAddedFunction))
                        temp = this._beforeAddedFunction(temp);

                    this._eventOutput.emit('addedAt', data);
                    this._eventOutput.emit('addedNode', temp);
                    return this._dataList.splice(data.i, 0, temp);
                }.bind(this));

                this._reactiveCursor.on('changedAt', function(data){
                    var temp = this._renderTemplate(data.newItem, data.atIndex);
                    // attach events
                    temp._record = data.newItem;
                    temp.getId = function () {
                        return id;
                    };

                    temp.pipe(this._scrollview);
                    if(_.isFunction(this._beforeAddedFunction))
                        temp = this._beforeAddedFunction(temp);

                    this._eventOutput.emit('changedAt', data);
                    this._eventOutput.emit('changedNode', temp);
                    return this._dataList[data.atIndex] = temp;
                }.bind(this));

                this._reactiveCursor.on('removedAt', function(data){
                    this._eventOutput.emit('removedAt', data);
                    this._eventOutput.emit('removedNode', this._dataList[data.i]);
                    return this._dataList.splice(data.i, 1);
                }.bind(this));

                this._reactiveCursor.on('movedTo', function(data){
                    var temp = this._dataList[data.i];
                    this._eventOutput.emit('movedTo', data);
                    this._eventOutput.emit('movedNode', temp);
                    this._dataList.splice(data.i, 1);
                    return this._dataList.splice(data.j, 0, temp);
                }.bind(this));
            },

            // FIXME tests
            push: function (view, isRunbeforeAddedFunction) {
                if(_.isFunction(this._beforeAddedFunction) && isRunbeforeAddedFunction)
                    view = this._beforeAddedFunction(view);
                ViewSequence.prototype.push.call(this, view);
            },
            splice: function (index, howMany, view, isRunbeforeAddedFunction) {
                if(_.isFunction(this._beforeAddedFunction) && isRunbeforeAddedFunction)
                    view = this._beforeAddedFunction(view);
                ViewSequence.prototype.splice.call(this, index, howMany, view);
            },
            getLength: function () {
                return this._.array.length;
            },
            getViewAt: function (index) {
                return this._.array[index]._child._child._object;
            },
            // modifier
            getModifierAt: function (index) {
                if(index < this._.array.length) {
                    return this._.array[index]._child._object;
                } else {
                    return null;
                }
            },
            forEachMod: function (startIndex, endIndex, callback) {
                startIndex = startIndex || 0;
                endIndex = endIndex || this.getLength() - 1;

                for(var i = startIndex; i <= endIndex; i++){
                    callback(this.getModifierAt(i));
                }
            },
            increaseSpace: function (index, size, transition, callback) {
                var trans = new Transitionable(0);

                //link elements to transitionable
                this.forEachMod(index + 1, undefined, function(mod){
                    mod.transformFrom(function(){
                        return Transform.translate(0, trans.get(), 0);
                    });
                });

                //animate elements up into empty space, then remove transitionable
                trans.set(0).set(size, transition, function(){
                    if(callback){
                        callback();
                    }
                    //have to pass a transition object parameter for trans.set to work
                    trans.set(0, {duration: 0.0001});
                }.bind(this));
            },
            getListViews: function () {
                return this._dataList;
            }
        });

        module.exports = Each;
    });

// with database
// Meteor.startup(function(){

//     Items = new Meteor.Collection('items',{
//         connection: null
//     });
//     for (var i = 0; i < 40; i++)
//         Items.insert({
//             _id:    'test' + i,
//             title:  'title' + i,
//             text:   'cookie' + i
//         });

//     require([
//             'famous/core/Engine',
//             'famous/core/Surface',
//             'famodev/Scrollview',
//             'famodev/reactive/Each',
//             'famous/core/Transform',
//             'famodev/Utils'
//       ],
//       function(Engine, Surface, Scrollview, Each, Transform, Utils) {

//         var mainContext = Engine.createContext();
//         var _scrollview = new Scrollview();

//         var _eachObject = new Each({
//             data: function() {
//                 return Items.find({}, {
//                     sort: {
//                         text: 1
//                     },
//                     limit: 20
//                 });
//             },
//             scrollview: _scrollview,
//             template: function(data) {
//                 return new Surface({
//                     size: [undefined, 60],
//                     content: '<div class="list-plain active--list-1 pam border-bottom border--3" style="padding: 14px; border-bottom-width: 1px; border-bottom-style: solid; border-color: #dfe0e1;">' +
//                     '<span class="db text-color-1 f4" style="display: block; font-size: 15px; color: #3c3d3e;">' + data.title +
//                     '</span>' +
//                     '<span class="db text-color-2 f6" style="display: block; font-size: 13px; color: #696e71;">' + data.text +
//                     '</span>' +
//                     '</div>'
//                 });
//             }
//         });

//         // Add Events
//         _eachObject.on('addedAt', function (data){
//             console.log(data, 'added');
//         });

//         _eachObject.on('changedAt', function (data){
//             console.log(data, 'changedAt');
//         });

//         _eachObject.on('removedAt', function (data){
//             console.log(data, 'removedAt');
//         });

//         _eachObject.on('movedTo', function (data){
//             console.log(data, 'movedTo');
//         });

//         _eachObject.on('addedNode', function (node){
//             attachEventNode(node);
//         });

//         _eachObject.on('changedNode', function (node){
//             attachEventNode(node);
//         });

//         _eachObject.on('removedNode', function (node){
//             console.log(node, 'removedNode');
//         });

//         _eachObject.on('movedNode', function (node){
//             console.log(node, 'movedNode');
//         });

//         function attachEventNode(node) {
//             node.on('hold', function(data) {
//                 this.addX(data.delta);
//                 if (!this.zoom) {
//                     this.setZ(10);
//                     this._modifier._scale.set(Transform.scale(1.2, 1.2, 2), {
//                         duration: 200,
//                         curve: 'easeInOut'
//                     });
//                     this.zoom = true;
//                 }
//             }.bind(node));
//             node.on('moveEnd', function(data) {
//                 if (this.zoom) {
//                     this.setZ(1);
//                     this._modifier._scale.set(Transform.scale(1, 1, 1), {
//                         duration: 200,
//                         curve: 'easeInOut'
//                     });
//                     this.zoom = false;
//                 }
//                 if (this.getX() > 176) {
//                     this.addX(Utils.windowWidth(), {
//                         duration: 200,
//                         curve: 'easeInOut'
//                     }, function() {
//                         if (Items.findOne(this._surface.getId()))
//                             Items.remove(this._surface.getId());
//                     }.bind(this));
//                     return;
//                 }
//                 if (this.getX() < -126) {
//                     this.addX(-Utils.windowWidth(), {
//                         duration: 200,
//                         curve: 'easeInOut'
//                     }, function() {
//                         if (Items.findOne(this._surface.getId()))
//                             Items.remove(this._surface.getId());
//                     }.bind(this));
//                     return;
//                 }
//                 this.resetX({
//                     duration: 200,
//                     curve: 'easeInOut'
//                 });
//             }.bind(node));
//         }

//         _scrollview.sequenceFrom(_eachObject);

//         mainContext.add(_scrollview);

//         setTimeout(function () {
//             Items.update('test0', {$set: {title: 'shit'}});
//         }, 1000);

//         setTimeout(function () {
//             Items.update('test1', {$set: {text: 'cookie123'}});
//         }, 1000);

//         setTimeout(function () {
//             Items.remove('test10');
//         }, 1000);

//     });
// });

// Meteor.startup(function(){
//     require([
//         'require', 
//         'exports',
//         'module',
//         "famous/core/Engine",
//         "famous/core/Surface",
//         "famous/views/Scrollview",
//         'famodev/reactive/Each'
//         ],
//         function(require, exports, module) {
//         var Engine     = require("famous/core/Engine");
//         var Surface    = require("famous/core/Surface");
//         var Scrollview = require("famous/views/Scrollview");
//         var Each       = require('famodev/reactive/Each');
//         var mainContext = Engine.createContext();

//         var scrollview = new Scrollview();
//         var surfaces = [];

//         for (var i = 0, temp; i < 40; i++) {
//             temp = new Surface({
//                  content: "Surface: " + (i + 1),
//                  size: [undefined, 200],
//                  properties: {
//                      backgroundColor: "hsl(" + (i * 360 / 40) + ", 100%, 50%)",
//                      lineHeight: "200px",
//                      textAlign: "center"
//                  }
//             });

//             temp.pipe(scrollview);
//             surfaces.push(temp);
//         }
//         // var each = new Each(surfaces);
//         var each = new Each({
//             data: surfaces
//         });
//         scrollview.sequenceFrom(each);

//         mainContext.add(scrollview);
//     });
// });