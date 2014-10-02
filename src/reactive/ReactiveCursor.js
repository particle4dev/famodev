/**
 * ReactiveCursor
 *     module is to process data which is a cursor
 *
 * @constructor
 * @extends {}
 * @status v0.3.0
 */
define('famodev/reactive/ReactiveCursor',[
    'require', 
    'exports',
    'module',
    'famous/core/EventHandler',
    'famous/core/OptionsManager'
    ],
    function (require, exports, module) {

        var EventHandler    = require('famous/core/EventHandler');
        var OptionsManager  = require('famous/core/OptionsManager');

        function ReactiveCursor(options) {
            this.options = Object.create(ReactiveCursor.DEFAULT_OPTIONS);
            this._optionsManager = new OptionsManager(this.options);
            this._optionsManager.setOptions(options);

            this._eventInput = new EventHandler();
            this._eventOutput = new EventHandler();
            EventHandler.setInputHandler(this, this._eventInput);
            EventHandler.setOutputHandler(this, this._eventOutput);

            if(!this.options || !this.options.data)
                throw new Error('options data does not specific');

            this._result = [];
            this._cursor = new ReactiveVar();

            /** 
             * NOTE: this is important !!!
             * because we have to wait the hooks function are setted
             */
            setTimeout(function(){
                handCursor.call(this, this.options.data);
            }.bind(this), 0);
        }
        ReactiveCursor.DEFAULT_OPTIONS = {};

        /**
         * Functions
         */
        function handCursor (cursor) {
            if(!isCursor(cursor))
                return;

            var self = this;
            self._cursor.set(parseData(this.options.data));
            // https://github.com/meteor/meteor/blob/277e19fb4f9bdc37c4bba7f79d1982352bc22f2c/packages/blaze/builtins.js#L75
            self._observeHandle = ObserveSequence.observe(function(){
                return self._cursor.get();
            },{
                addedAt: function (id, item, i, beforeId){
                    item._id = id;
                    self._result.splice(i, 0, item);
                    self._eventOutput.emit('addedAt', {
                        id: id,
                        item: item,
                        i: i,
                        beforeId: beforeId
                    });
                },
                changedAt: function (id, newItem, oldItem, atIndex) {
                    self._result[atIndex] = newItem;
                    self._eventOutput.emit('changedAt', {
                        id: id,
                        newItem: newItem,
                        oldItem: oldItem,
                        atIndex: atIndex
                    });
                },
                removedAt: function (id, item, i) {
                    self._result.splice (i, 1);
                    self._eventOutput.emit('removedAt', {
                        id: id,
                        item: item,
                        i: i
                    });
                },
                movedTo: function (id, item, i, j, beforeId) {
                    var temp = self._result[i];
                    self._result.splice(i, 1);
                    self._result.splice(j, 0, temp);
                    self._eventOutput.emit('movedTo', {
                        id: id,
                        item: item,
                        i: i,
                        j: j,
                        beforeId: beforeId
                    });
                }
            });
        }

        function parseData (data) {
            if(typeof data === 'function')
                return data();
            return data;
        }

        /**
         * Methods
         */
        _.extend(ReactiveCursor.prototype, {
            constructor: ReactiveCursor,
            get: function () {
                return this._result;
            },
            stop: function () {
                if(this._observeHandle && this._observeHandle.stop) {
                    this._observeHandle.stop();
                    this._observeHandle = null;
                }
            }
        });

        module.exports = ReactiveCursor;

    });

// with database
// Meteor.startup(function(){
//     Items = new Meteor.Collection('items',{
//         connection: null
//     });
//     Items.insert({
//         _id: 'test00',
//         text: 'cookie00'
//     });
//     Items.insert({
//         _id: 'test01',
//         text: 'cookie01'
//     });
//     Items.insert({
//         _id: 'test02',
//         text: 'cookie02'
//     });
//     Items.insert({
//         _id: 'test03',
//         text: 'cookie03'
//     });
//     Items.insert({
//         _id: 'test04',
//         text: 'cookie04'
//     });
//     Items.insert({
//         _id: 'test06',
//         text: 'cookie06'
//     });
//     require([
//         'famodev/reactive/ReactiveCursor'
//     ], function(ReactiveCursor){
//         var reactiveCursor = new ReactiveCursor({
//             data: function(){
//                 return Items.find({}, {sort: {text: -1}});
//             }
//         });

//         reactiveCursor.on('addedAt', function(data){
//             console.log(data, 'addedAt');
//         });

//         reactiveCursor.on('changedAt', function(data){
//             console.log(data, 'changedAt');
//         });

//         reactiveCursor.on('removedAt', function(data){
//             console.log(data, 'removedAt');
//         });

//         reactiveCursor.on('movedTo', function(data){
//             console.log(data, 'movedTo');
//         });

//         // reactiveObject.set(function(){
//         //     return PicturesCollection.find(); 
//         // });

//         Meteor.setTimeout(function(){
//             Items.update('test06', {$set: {text: '06'}});
//             Items.insert({
//                 _id: 'test05',
//                 text: 'cookie05'
//             });
//             Items.remove('test03');
//             Meteor.setTimeout(function(){
//                 console.log(reactiveCursor.get());
//                 reactiveCursor.stop();
//             }, 1000);

//         }, 1000);
//     });
// });