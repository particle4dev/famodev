/**
 * ReactiveSession
 *     module is to process data which is object, number, string (not a cursor)
 *
 * @constructor
 * @extends {}
 * @status v0.3.0
 */
define('famodev/reactive/ReactiveSession', [
    'require', 
    'exports',
    'module',
    'famous/core/EventHandler',
    'famous/core/OptionsManager'
    ],
    function (require, exports, module) {

        var EventHandler    = require('famous/core/EventHandler');
        var OptionsManager  = require('famous/core/OptionsManager');

        function ReactiveSession(options) {
            this.options = Object.create(ReactiveSession.DEFAULT_OPTIONS);
            this._optionsManager = new OptionsManager(this.options);
            this._optionsManager.setOptions(options);

            this._eventInput = new EventHandler();
            this._eventOutput = new EventHandler();
            EventHandler.setInputHandler(this, this._eventInput);
            EventHandler.setOutputHandler(this, this._eventOutput);

            if(!this.options || !this.options.data)
                throw new Error('options data does not specific');

            this._value = null;
            if(this.options.surface) {
                this.on('changed', function(value){
                    this.setContent(value);
                }.bind(this.options.surface));
            }

            /** 
             * NOTE: this is important !!!
             * because we have to wait the hooks function are setted
             */
            setTimeout(function(){
                handReactiveFunction.call(this, this.options.data);
                if(this.options.surface)
                    this.options.surface.setContent(this._value);
            }.bind(this), 0);
        }
        ReactiveSession.DEFAULT_OPTIONS = {};

        /**
         * Functions
         */
        function handReactiveFunction (data) {
            if(!isReactive(data))
                return;
            this.stop();
            this._rangeUpdater = Tracker.autorun(function (c) {
                if(typeof data === 'function')
                    this._value = data();
                if (! c.firstRun)
                    this._eventOutput.emit('changed', this._value);
            }.bind(this));
        }

        /**
         * Methods
         */
        _.extend(ReactiveSession.prototype, {
            stop: function() {
                if(this._rangeUpdater && this._rangeUpdater.stop) {
                    this._rangeUpdater.stop();
                    this._rangeUpdater = null;
                }
            },
            set: function(data){
                if(!isReactive(data))
                    return;
                this.options.data = data;
            },
            get: function () {
                return this._value;
            },
            rerun: function () {
                handReactiveFunction.call(this, this.options.data);
            }
        });

        module.exports = ReactiveSession;

    });


//with session
// require([
//     'famodev/reactive/ReactiveSession'
//     ], function (ReactiveSession) {
//         Session.set("currentRoomId", "_init");
//         var reactiveObject = new ReactiveSession({
//             data: function () {
//                 return Session.get("currentRoomId");
//             }
//         });
//         reactiveObject.on('changed', function(value){
//             console.log(">>>>>>>>>> " + value);
//         });
//         Meteor.setTimeout(function(){
//             Session.set("currentRoomId", "_init2");

//             Meteor.setTimeout(function(){
//                 reactiveObject.stop();
//                 Session.set("currentRoomId", "_init3");

//                 Meteor.setTimeout(function(){
//                     reactiveObject.rerun();
//                     Session.set("currentRoomId", "_init4");
//                 }, 1000);
//             }, 1000);
//         }, 1000);
//     });


//with database
// Meteor.startup(function(){
//     Items = new Meteor.Collection('items',{
//         connection: null
//     });
//     Items.insert({
//         _id: 'test',
//         text: 'cookie'
//     });
//     require([
//         'famodev/reactive/ReactiveSession'
//     ], function(ReactiveSession){
//         var reactiveObject = new ReactiveSession({
//             data: function(){
//                 return Items.findOne('test').text;
//             }
//         });
//         reactiveObject.on('changed', function(value){
//             console.log(">>>>>>>>>> " + value);
//         });
//         Meteor.setTimeout(function(){
//             Items.update('test', {$set: {text: 'cookie 2'}});
//         }, 1000);
//     });
// });