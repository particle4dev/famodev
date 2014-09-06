isCursor = function (c) {
    return c && c.observe;
};
define(function (require, exports, module) {

        var ViewSequence    = require('famous/core/ViewSequence');
        var Surface         = require('famous/core/Surface');
        var Transform       = require('famous/core/Transform');
        var EventHandler    = require('famous/core/EventHandler');
        var Transitionable  = require('famous/transitions/Transitionable');
        var Modifier2       = require('famous/core/Modifier');
        var RenderNode      = require('famous/core/RenderNode');

        var Node            = require('famodev/Node');
        var Modifier        = require('famodev/Modifier');
        var Utils           = require('famodev/Utils');

        function Each(options) {
            this._beforeAddedFunction = Each.DEFAULT_BEFORE_ADDED;
            this.eventHandler = new EventHandler();
            this.eventHandler.bindThis(this);

            if(_.isObject(options)){
                if(options.scrollview)
                    this._scrollview = options.scrollview;
                var args = Array.prototype.slice.call(arguments, 1);
                if(isCursor(options.data)){
                    this._cursor = options.data;
                    this._renderTemplate = options.template;
                    this.handWithCursor.apply(this, arguments);
                    return ;
                }
                if(_.isArray(options.data)){

                    this._dataList = options.data;
                    args.unshift(this._dataList);
                    ViewSequence.apply(this, args);
                    return ;
                }
            }
            if(isCursor(options)){
                this._cursor = options;
                this.handWithCursor.apply(this, arguments);
                return ;
            }
            ViewSequence.apply(this, arguments);
        }
        Each.prototype = Object.create(ViewSequence.prototype);
        Each.prototype.constructor = Each;
        Each.DEFAULT_OPTIONS = _.extend(ViewSequence.DEFAULT_OPTIONS, {

        });
        Each.DEFAULT_BEFORE_ADDED = function(view){
            var node = new Node({
                modifier: new Modifier(),
                surface: view
            });

            return node;
        };

        // Each.Backing = ViewSequence.Backing;
        Each.Backing = function (array){
            ViewSequence.Backing.apply(this, arguments);
        };
        Each.Backing.prototype = Object.create(ViewSequence.Backing.prototype);
        Each.Backing.prototype.constructor = Each.Backing;

        /**
         * _beforeAdded is used to apply
         *
         * @chainable
         */
        Each.prototype.setBeforeAdded = function (func) {
            this._beforeAddedFunction = func;
            return this;
        };
        /**
         * Bind a callback function to an event type handled by this object.
         *
         * @method "on"
         *
         * @param {string} type event type key (for example, 'click')
         * @param {function(string, Object)} fn handler callback
         * @return {EventHandler} this
         */
        Each.prototype.on = function on(type, fn) {
            if(!this._lastAddedObject)
                this._lastAddedObject = {
                    id: null,
                    item: null,
                    i: null,
                    beforeId: null
                };
            if(!this._lastChangedObject)
                this._lastChangedObject = {
                    id: null,
                    newItem: null,
                    oldItem: null,
                    atIndex: null
                };
            if(!this._lastRemovedObject)
                this._lastRemovedObject = {
                    id: null,
                    item: null,
                    i: null
                };
            if(!this._lastMovedObject)
                this._lastMovedObject = {
                    id: null,
                    item: null,
                    i: null,
                    j: null,
                    beforeId: null
                };
            var func;
            if('addedAt' === type) {
                func = function(){
                    var item = this._lastAddedObject;
                    fn.call(null, item.id, item.item, item.i, item.beforeId);
                };
                this.eventHandler.on(type, func);
            }

            if('changedAt' === type) {
                func = function(){
                    var item = this._lastChangedObject;
                    fn.call(null, item.id, item.newItem, item.oldItem, item.atIndex);
                };
                this.eventHandler.on(type, func);
            }
            if('removedAt' === type) {
                func = function(){
                    var item = this._lastRemovedObject;
                    fn.call(null, item.id, item.item, item.i);
                };
                this.eventHandler.on(type, func);
            }
            if('movedTo' === type) {
                func = function(){
                    var item = this._lastMovedObject;
                    fn.call(null, item.id, item.item, item.i, item.j, item.beforeId);
                };
                this.eventHandler.on(type, func);
            }
        };
        /**
         *
         *
         * @return null
         */

        Each.prototype.handWithCursor = function (options) {
            var args = Array.prototype.slice.call(arguments, 1);
            this._dataList = [];
            _observeCursor.call(this);
            args.unshift(this._dataList);
            ViewSequence.apply(this, args);
            return ;
        };

        Each.prototype.push = function (view, isRunbeforeAddedFunction) {
            if(_.isFunction(this._beforeAddedFunction) && isRunbeforeAddedFunction)
                view = this._beforeAddedFunction(view);
            ViewSequence.prototype.push.call(this, view);
        };

        Each.prototype.splice = function (index, howMany, view, isRunbeforeAddedFunction) {
            if(_.isFunction(this._beforeAddedFunction) && isRunbeforeAddedFunction)
                view = this._beforeAddedFunction(view);
            ViewSequence.prototype.splice.call(this, index, howMany, view);
        };

        Each.prototype.getLength = function () {
            return this._.array.length;
        };

        Each.prototype.getViewAt = function (index) {
            return this._.array[index]._child._child._object;
        };

        //Modifier
        Each.prototype.getModifierAt = function (index) {
            if(index < this._.array.length) {
                return this._.array[index]._child._object;
            } else {
                return null;
            }
        };
        Each.prototype.forEachMod = function (startIndex, endIndex, callback) {
            startIndex = startIndex || 0;
            endIndex = endIndex || this.getLength() - 1;

            for(var i = startIndex; i <= endIndex; i++){
                callback(this.getModifierAt(i));
            }
        };

        Each.prototype.increaseSpace = function (index, size, transition, callback) {
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
        };

        Each.prototype.getListViews = function () {
            return this._dataList;
        };

        /**
         *
         *
         */
        function _observeCursor () {
            var self = this;
            var i = 0;
            self._observeHandle = ObserveSequence.observe(function(){
                return self._cursor;
            },{
                addedAt: function (id, item, i, beforeId){
                    var temp = self._renderTemplate(item, i);
                    
                    // attach events
                    temp._record = item;
                    temp.getId = function () {
                        return id;
                    };
                    
                    temp.pipe(self._scrollview);
                    if(_.isFunction(self._beforeAddedFunction))
                        temp = self._beforeAddedFunction(temp);
                    //if(i == 0 && i == self._dataList.length)
                    self._lastAddedObject = {
                        id: id,
                        item: item,
                        i: i,
                        beforeId: beforeId
                    };
                    self.eventHandler.emit('addedAt');
                        return self._dataList.splice(i, 0, temp);
                },
                changedAt: function (id, newItem, oldItem, atIndex) {
                    var temp = self._renderTemplate(newItem, atIndex);
                    temp.pipe(self._scrollview);
                    temp._record = newItem;
                    if(_.isFunction(self._beforeAddedFunction))
                        temp = self._beforeAddedFunction(temp);

                    self._lastChangedObject = {
                        id: id,
                        newItem: newItem,
                        oldItem: oldItem,
                        atIndex: atIndex
                    };
                    self.eventHandler.emit('changedAt');
                    self._dataList[atIndex] = temp;
                },
                removedAt: function (id, item, i) {
                    self._lastRemovedObject = {
                        id: id,
                        item: item,
                        i: i
                    };
                    self.eventHandler.emit('removedAt');
                    self._dataList.splice (i, 1);
                },
                movedTo: function (id, item, i, j, beforeId) {
                    self._lastMovedObject = {
                        id: id,
                        item: item,
                        i: i,
                        j: j,
                        beforeId: beforeId
                    };
                    self.eventHandler.emit('movedTo');
                    // switch
                    var temp = self._dataList[i];
                    self._dataList[i] = self._dataList[j];
                    self._dataList[j] = temp;
                }
            });
        }

        module.exports = Each;

    });

// with array
/**
Meteor.startup(function(){
    define(function(require, exports, module) {
        var Engine     = require("famous/core/Engine");
        var Surface    = require("famous/core/Surface");
        var Scrollview = require("famous/views/Scrollview");
        var Each       = require('famodev/Each')
        var mainContext = Engine.createContext();

        var scrollview = new Scrollview();
        var surfaces = [];

        for (var i = 0, temp; i < 40; i++) {
            temp = new Surface({
                 content: "Surface: " + (i + 1),
                 size: [undefined, 200],
                 properties: {
                     backgroundColor: "hsl(" + (i * 360 / 40) + ", 100%, 50%)",
                     lineHeight: "200px",
                     textAlign: "center"
                 }
            });

            temp.pipe(scrollview);
            surfaces.push(temp);
        }
        var each = new Each(surfaces);
        scrollview.sequenceFrom(each);

        mainContext.add(scrollview);
    });
});
*/
// with database
Meteor.startup(function(){

    Items = new Meteor.Collection('items',{
        connection: null
    });
    for (var i = 0; i < 40; i++)
        Items.insert({
            _id: 'test' + i,
            text: 'cookie' + i
        });

    define([
            'famous/core/Engine',
            'famous/core/Surface',
            'famous/views/Scrollview',
            'famodev/Each',
            'famodev/Box',
            'famous/core/Transform'
      ],
      function(Engine, Surface, Scrollview, Each, Box, Transform) {

        var mainContext = Engine.createContext();

        var scrollview = new Scrollview();
        var each = new Each({
            data: Items.find({}, {sort: {
                text: 1
            }}),
            scrollview: scrollview,
            template: function(data, i){
                return new Surface({
                      content: data.text,
                      size: [undefined, 200],
                      properties: {
                          backgroundColor: "hsl(" + (i * 360 / 40) + ", 100%, 50%)",
                          lineHeight: "200px",
                          textAlign: "center"
                      }
                });
            }
        });
        // add events
        _.each(each.getListViews(), function (node) {
            node.on('hold', function(data){
                this.addX(data.delta);
                if(!this.zoom) {
                    this.setZ(10);
                    this._modifier._scale.set(Transform.scale(1.2, 1.2, 2), { duration: 200, curve: 'easeInOut'});
                    this.zoom = true;
                }
            }.bind(node));

            node.on('moveEnd', function(data){
                if(this.zoom) {
                    this.setZ(1);
                    this._modifier._scale.set(Transform.scale(1, 1, 1), { duration: 200, curve: 'easeInOut'});
                    this.zoom = false;
                }
                if(this.getX() > 176) {
                    this.addX(Utils.getWindowWidth(), { duration: 200, curve: 'easeInOut'}, function () {
                        Items.remove(this._surface.getId());
                    }.bind(this));
                    return ;
                }
                this.resetX({ duration: 200, curve: 'easeInOut'});
            }.bind(node));
        });

        scrollview.sequenceFrom(each);

        each.on('addedAt', function (id, item, i, beforeId){
            console.log(id, item, i, beforeId, 'added');
        });

        each.on('changedAt', function (id, newItem, oldItem, atIndex) {
            console.log(id, newItem, oldItem, atIndex, 'changed');
        });

        each.on('removedAt', function (id, item, i) {
            console.log(id, item, i, 'removedAt');
        });

        each.on('movedTo', function (id, item, i, j, beforeId) {
            console.log(id, item, i, j, beforeId, 'movedTo');
        });

        mainContext.add(scrollview);

        Meteor.setTimeout(function(){
            Items.update('test1', {$set: {text: 'cookie'}});
        }, 3000);
        //
        Meteor.setTimeout(function(){
            Items.remove('test3');
            Items.insert({
                _id: 'test',
                text: 'cookie'
            });
        }, 4000);

        // Meteor.setTimeout(function(){
        //     each.increaseSpace(1, 200, {duration: 500, curve: "easeIn"}, function(){
        //         var sur = new Surface({
        //                 content: "newItem._id",
        //                 size: [undefined, 200],
        //                 properties: {
        //                     backgroundColor: "hsl(" + (0 * 360 / 40) + ", 100%, 50%)",
        //                     lineHeight: "200px",
        //                     textAlign: "center"
        //                 }
        //             });
        //         sur.pipe(scrollview);
        //         var box = new Box({
        //             inOrigin: [0, 0],
        //             outOrigin: [0, 0],
        //             showOrigin: [0, 0],
        //         });
        //         box.addRenderable(sur);
        //         each.splice(2, 0, box);
        //         box.show();
        //     });
        // }, 5000);
    });
});
