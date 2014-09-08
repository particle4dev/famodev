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
            this._cursor = new ReactiveVar();
            this._beforeAddedFunction = Each.DEFAULT_BEFORE_ADDED;
            this.eventHandler = new EventHandler();
            this.eventHandler.bindThis(this);

            if(_.isObject(options)){
                if(options.scrollview)
                    this._scrollview = options.scrollview;
                var args = Array.prototype.slice.call(arguments, 1);
                if(_.isFunction(options.data)){
                    this._datacursor = options.data;
                    // this._cursor = options.data;
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
                this._datacursor = options;
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
            // create cursor
            // https://github.com/meteor/meteor/blob/0b1d744731dc7fb4477331ebad5f5d62276000f1/packages/blaze/builtins.js#L69
            Tracker.autorun(function () {
                this._cursor.set(this._datacursor());
            }.bind(this));
            // isCursor
            // FIXME: what about function is array ?
            // FIXME: do we need stop track ?

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
                return self._cursor.get();
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