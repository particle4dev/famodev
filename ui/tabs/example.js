// Meteor.startup(function(){
//     define(function(require, exports, module) {
//         var Engine              = require('famous/core/Engine');
//         var Modifier            = require('famous/core/Modifier');
//         var TabButton           = require('famodev/ui/tabs/TabButton');
//         var TabBar              = require('famodev/ui/tabs/TabBar');
//
//         var mainContext = Engine.createContext();
//         var mod = new Modifier({
//             align: [0.5, 0.5],
//             origin: [0.5, 0.5]
//         });
//         var _tabs = new TabBar({
//             widget: TabButton
//         });
//         mainContext.add(mod).add(_tabs);
//         _tabs.setOptions({
//             sections: [{
//                 selected: true,
//                 size: [undefined, 44],
//                 offClasses: [],
//                 onClasses: ['border-bottom--2', 'border--9'],
//                 classes: ['tab-button', 'bg-white'],
//                 content: 'ABOUT',
//                 properties: {
//                     'color': '#7e7f80'
//                 }
//             }, {
//                 size: [undefined, 44],
//                 offClasses: [],
//                 onClasses: ['border-bottom--2', 'border--9'],
//                 classes: ['tab-button', 'bg-white'],
//                 content: 'POSTS',
//                 properties: {
//                     'color': '#7e7f80'
//                 }
//             }, {
//                 size: [undefined, 44],
//                 offClasses: [],
//                 onClasses: ['border-bottom--2', 'border--9'],
//                 classes: ['tab-button', 'bg-white'],
//                 content: 'PHOTOS',
//                 properties: {
//                     'color': '#7e7f80'
//                 }
//             }, {
//                 size: [undefined, 44],
//                 offClasses: [],
//                 onClasses: ['border-bottom--2', 'border--9'],
//                 classes: ['tab-button', 'bg-white'],
//                 content: 'YOUTUBE',
//                 properties: {
//                     'color': '#7e7f80'
//                 }
//             }]
//         });
//         _tabs.on('tabSelected', function (tab) {
//             console.log(tab.getContent(), 'tabSelected');
//         });
//         _tabs.on('tabUnselected', function (tab) {
//             console.log(tab.getContent(), 'tabUnselected');
//         });
//
//     });
// });
