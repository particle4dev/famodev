isCursor = function (c) {
    return c && c.observe;
};
define('famodev/Each', [
        'famous/core/ViewSequence',
        'famous/core/Modifier',
        'famous/core/Surface',
        'famous/core/RenderNode',
        'famous/core/Transform',
        'famous/transitions/Transitionable'
    ], function (require, exports, module) {

        var ViewSequence    = require('famous/core/ViewSequence');
        var Modifier        = require('famous/core/Modifier');
        var Surface         = require('famous/core/Surface');
        var RenderNode      = require('famous/core/RenderNode');
        var Transform       = require('famous/core/Transform');
        var Transitionable  = require('famous/transitions/Transitionable');

        function Each(optons) {
            this._beforeAddedFunction = Each.DEFAULT_BEFORE_ADDED;
            if(_.isObject(optons)){
                if(optons.scrollview)
                    this._scrollview = optons.scrollview;
                var args = Array.prototype.slice.call(arguments, 1);
                if(isCursor(optons.data)){
                   
                    this._cursor = optons.data;
                    this._dataList = [];
                    _observeCursor.call(this);
                    args.unshift(this._dataList);
                    ViewSequence.apply(this, args);
                    return ;
                }
                if(_.isArray(optons.data)){

                    this._dataList = optons.data;
                    args.unshift(this._dataList);
                    ViewSequence.apply(this, args);
                    return ;
                }
            }
            if(isCursor(optons)){
                var args = Array.prototype.slice.call(arguments, 1);
                this._cursor = optons;
                this._dataList = [];
                _observeCursor.call(this);
                args.unshift(this._dataList);
                ViewSequence.apply(this, args);
                return ;
            }
            ViewSequence.apply(this, arguments);
        };
        Each.prototype = Object.create(ViewSequence.prototype);
        Each.prototype.constructor = Each;
        Each.DEFAULT_OPTIONS = _.extend(ViewSequence.DEFAULT_OPTIONS, {
            
        });
        Each.DEFAULT_BEFORE_ADDED = function(view){
            var node = new RenderNode();
            node.add(new Modifier()).add(view);
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
         *
         *
         * @return null
         */
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

        /**
         *
         *
         */
        function _observeCursor () {
            var self = this;
            var i = 0;
            self._observeHandle = ObserveSequence.observe(function(){
                return self._cursor
            },{
                addedAt: function (id, item, i, beforeId){
                    console.log(id, item, i, beforeId, 'added');
                    var temp = new Surface({
                        content: item._id,
                        size: [undefined, 200],
                        properties: {
                            backgroundColor: "hsl(" + (i * 360 / 40) + ", 100%, 50%)",
                            lineHeight: "200px",
                            textAlign: "center"
                        }                        
                    });
                    temp._record = item;
                    temp.pipe(self._scrollview);
                    if(_.isFunction(self._beforeAddedFunction))
                        temp = self._beforeAddedFunction(temp);
                    //if(i == 0 && i == self._dataList.length)
                        return self._dataList.push(temp);
                },
                changedAt: function (id, newItem, oldItem, atIndex) {
                    console.log(id, newItem, oldItem, atIndex, 'changed');
                    var temp = new Surface({
                        content: newItem._id,
                        size: [undefined, 200],
                        properties: {
                            backgroundColor: "hsl(" + (atIndex * 360 / 40) + ", 100%, 50%)",
                            lineHeight: "200px",
                            textAlign: "center"
                        }
                    });
                    temp.pipe(self._scrollview);
                    temp._record = newItem;
                    if(_.isFunction(self._beforeAddedFunction))
                        temp = self._beforeAddedFunction(temp);
                    self._dataList[atIndex] = temp;
                },
                removedAt: function (id, item, i) {
                    console.log(id, item, i, 'removed');
                    self._dataList.splice (i, 1);
                },
                movedTo: function (id, item, i, j, beforeId) {
                    console.log(id, item, i, j, beforeId, 'movedTo');
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
// Meteor.startup(function(){

//     Items = new Meteor.Collection('items',{
//         connection: null
//     });
//     for (var i = 0; i < 40; i++)
//         Items.insert({
//             _id: 'test' + i,
//             text: 'cookie' + i
//         });

//     define(function(require, exports, module) {
//         var Engine     = require("famous/core/Engine");
//         var Surface    = require("famous/core/Surface");
//         var Scrollview = require("famous/views/Scrollview");
//         var Each       = require('famodev/Each');
//         var Box        = require('famodev/Box');
        
//         var mainContext = Engine.createContext();

//         var scrollview = new Scrollview();
//         var each = new Each({
//             data: Items.find({}, {sort: {
//                 text: 1
//             }}),
//             scrollview: scrollview
//         });
//         scrollview.sequenceFrom(each);

//         mainContext.add(scrollview);

//         Meteor.setTimeout(function(){
//             Items.update('test1', {$set: {text: 'cookie'}});
//         }, 3000);

//         Meteor.setTimeout(function(){
//             Items.remove('test3');
//         }, 4000);

//         Meteor.setTimeout(function(){
//             each.increaseSpace(1, 200, {duration: 500, curve: "easeIn"}, function(){
//                 var sur = new Surface({
//                         content: "newItem._id",
//                         size: [undefined, 200],
//                         properties: {
//                             backgroundColor: "hsl(" + (0 * 360 / 40) + ", 100%, 50%)",
//                             lineHeight: "200px",
//                             textAlign: "center"
//                         }
//                     });
//                 sur.pipe(scrollview);
//                 var box = new Box({
//                     inOrigin: [0, 0],
//                     outOrigin: [0, 0],
//                     showOrigin: [0, 0],
//                 });
//                 box.addRenderable(sur);
//                 each.splice(2, 0, box);
//                 box.show();
//             });
//         }, 5000);
//     });
// });