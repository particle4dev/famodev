define('famodev/ui/papers/PapersSystem', [
    'require', 
    'exports',
    'module',

    'famous/views/SequentialLayout',
    'famodev/ui/papers/Paper'

    ],
    function (require, exports, module) {

    var SequentialLayout        = require('famous/views/SequentialLayout');
    var Paper                   = require('famodev/ui/papers/Paper');

    function PapersSystem(renderable) {
        this.sequentialLayout = new SequentialLayout({
            direction: 2 // trick; tat ca cac surface de nen nhau 
        });
        this._renderablesStore = new Register();
        this._renderables = [];
        this.sequentialLayout.sequenceFrom(this._renderables);
    }
    
    /**
     * Add Views
     */

    /**
     * Methods
     */
    _.extend(PapersSystem.prototype, {
        register: function (name, renderable) {
            this._renderablesStore.set(name, new Paper(name, renderable));
        },
        show: function (name) {
            var paper = this._renderablesStore.get(name);
            this._renderables.push(paper);
            setTimeout(function(){
                paper.show();
            }, 0);
        },
        hide: function (name /** options */) {
            var paper;
            if(_.isUndefined(name)) 
                paper = this._renderables[this._renderables.length - 1];
            else
                paper = this._renderablesStore.get(name);
            paper.hide(function(){
                // remove
                // this._renderablesStore.remove(name); // no remove on register, paper can be show again
                
                // DOESNT WORK; the dom doesn't removed from document (body) why ???
                // this._renderables = _.without(this._renderables, paper); 
                
                var index = this._renderables.indexOf(paper);
                if (index > -1) {
                    this._renderables.splice(index, 1);
                }
            }.bind(this));
        },
        /**
         * Generate a render spec from the contents of this component.
         *
         * @private
         * @method render
         * @return {number} Render spec for this component
         */
        render: function () {
            return this.sequentialLayout.render();
        },
        


        reset: function(){
            while(this._renderables.length > 0) {
                this._renderables.pop();
            }
        }
    });
    /**
     * Events
     */

    module.exports = PapersSystem;

});

// test
// define('header', [
//     'require', 
//     'exports',
//     'module',
//     'famous/core/View',
//     'famous/core/Surface',
//     'famous/core/Transform',
//     'famous/modifiers/StateModifier'
//     ],
//     function (require, exports, module) {

//     var View            = require('famous/core/View');
//     var Surface         = require('famous/core/Surface');
//     var Transform       = require('famous/core/Transform');
//     var StateModifier   = require('famous/modifiers/StateModifier');

//     function header() {
//         View.apply(this, arguments);

//         _createbackground.call(this);

//         _setListeners.call(this);
//     }
//     header.prototype = Object.create(View.prototype);
//     header.prototype.constructor = header;
//     header.DEFAULT_OPTIONS = {};

//     /**
//      * Add Views
//      */
//     function _createbackground() {
//         this
//         ._add(new StateModifier({
//             transform: Transform.translate(0, 0, -1)
//         }))
//         .add(new Surface({
//             properties: {
//                 backgroundColor: 'green'
//             }
//         }));
//     }

//     /**
//      * Methods
//      */

//     /**
//      * Events
//      */

//     function _setListeners() {
        
//     }

//     module.exports = header;

// });

// define('footer', [
//     'require', 
//     'exports',
//     'module',
//     'famous/core/View',
//     'famous/core/Surface',
//     'famous/core/Transform',
//     'famous/modifiers/StateModifier'
//     ],
//     function (require, exports, module) {

//     var View            = require('famous/core/View');
//     var Surface         = require('famous/core/Surface');
//     var Transform       = require('famous/core/Transform');
//     var StateModifier   = require('famous/modifiers/StateModifier');

//     function footer() {
//         View.apply(this, arguments);

//         _createbackground.call(this);

//         _setListeners.call(this);
//     }
//     footer.prototype = Object.create(View.prototype);
//     footer.prototype.constructor = footer;
//     footer.DEFAULT_OPTIONS = {};

//     /**
//      * Add Views
//      */
//     function _createbackground() {
//         this
//         ._add(new StateModifier({
//             transform: Transform.translate(0, 0, -1)
//         }))
//         .add(new Surface({
//             properties: {
//                 backgroundColor: 'blue'
//             }
//         }));
//     }

//     /**
//      * Methods
//      */

//     /**
//      * Events
//      */

//     function _setListeners() {
        
//     }

//     module.exports = footer;

// });

// define('body', [
//     'require', 
//     'exports',
//     'module',
//     'famous/core/View',
//     'famous/core/Surface',
//     'famous/core/Transform',
//     'famous/modifiers/StateModifier'
//     ],
//     function (require, exports, module) {

//     var View            = require('famous/core/View');
//     var Surface         = require('famous/core/Surface');
//     var Transform       = require('famous/core/Transform');
//     var StateModifier   = require('famous/modifiers/StateModifier');

//     function body() {
//         View.apply(this, arguments);

//         _createbackground.call(this);

//         _setListeners.call(this);
//     }
//     body.prototype = Object.create(View.prototype);
//     body.prototype.constructor = body;
//     body.DEFAULT_OPTIONS = {};

//     /**
//      * Add Views
//      */
//     function _createbackground() {
//         this
//         ._add(new StateModifier({
//             transform: Transform.translate(0, 0, -1)
//         }))
//         .add(new Surface({
//             properties: {
//                 backgroundColor: 'yellow'
//             }
//         }));
//     }

//     /**
//      * Methods
//      */

//     /**
//      * Events
//      */

//     function _setListeners() {
        
//     }

//     module.exports = body;

// });

// define('paper', [
//     'require', 
//     'exports',
//     'module',
//     'famous/core/View',
//     'famous/core/Surface',
//     'famous/core/Transform',
//     'famous/modifiers/StateModifier',
//     'famous/views/HeaderFooterLayout',

//     'header',
//     'footer',
//     'body'
//     ],
//     function (require, exports, module) {

//     var View            = require('famous/core/View');
//     var Surface         = require('famous/core/Surface');
//     var Transform       = require('famous/core/Transform');
//     var StateModifier   = require('famous/modifiers/StateModifier');
//     var HeaderFooter    = require('famous/views/HeaderFooterLayout');

//     var header          = require('header');
//     var footer          = require('footer');
//     var body            = require('body');

//     function paper() {
//         View.apply(this, arguments);

//         _createLayout.call(this);
//         _createHeader.call(this);
//         _createFooter.call(this);
//         _createBody.call(this);

//         _setListeners.call(this);
//     }
//     paper.prototype = Object.create(View.prototype);
//     paper.prototype.constructor = paper;
//     paper.DEFAULT_OPTIONS = {};

//     /**
//      * Add Views
//      */
    
//     function _createLayout() {
//         this.layout = new HeaderFooter({
//             headerSize: this.options.headerSize
//         });
//         this
//         ._add(new StateModifier({
//             transform: Transform.translate(0, 0, 0.1)
//         }))
//         .add(this.layout);
//     }

//     function _createHeader() {
//         this._headerModifier = new StateModifier({
//             transform: Transform.translate(0, 0, zIndex4_header),
//             align: [0, 0],
//             origin: [0, 0],
//             size: [undefined, 44]
//         });
//         this.layout.header
//         .add(this._headerModifier)
//         .add(new header());
//     }

//     function _createFooter() {
//         this._footerModifier = new StateModifier({
//             transform: Transform.translate(0, 0, 1),
//             align: [0, 0],
//             origin: [0, 0],
//             size: [undefined, 44]
//         });
//         this.layout.footer
//         .add(this._footerModifier)
//         .add(new footer());
//     }

//     function _createBody() {
//         this.layout.content
//         .add(new StateModifier({
//             transform: Transform.translate(0, 0, 2),
//             size: [undefined, undefined]
//         }))
//         .add(new body());
//     }

//     /**
//      * Methods
//      */

//     /**
//      * Events
//      */

//     function _setListeners() {
        
//     }

//     module.exports = paper;

// });

// Meteor.startup(function(){
//     require([
//         'famous/core/Engine',
//         'famous/core/Surface',
//         'famous/modifiers/StateModifier',
//         'famous/core/Transform',

//         'PapersSystem',
//         'paper'
//     ],
//     function(Engine, Surface, StateModifier, Transform, PapersSystem, paper) {

//         var mainContext     = Engine.createContext();
//         var p               = new paper();

//         //https://developer.mozilla.org/en-US/docs/Web/CSS/perspective
//         //mainContext.setPerspective(1000);

//         var papersSystem = new PapersSystem();
//         papersSystem.register('paper', p);
//         papersSystem.register('paper2', new paper());

//         mainContext.add(new Surface({
//             size: [undefined, undefined],
//             properties: {
//                 backgroundColor: 'red'
//             }
//         }));

//         mainContext
//         .add(new StateModifier({
//             transform: Transform.translate(0, 0, 0.1)
//         }))
//         .add(papersSystem);

//         Meteor.setTimeout(function () {
//             papersSystem.show('paper');
//             Meteor.setTimeout(function () {
//                 papersSystem.show('paper2');
//                 papersSystem.hide('paper');
//             }, 3000);
//         }, 2000)
//     });

// });
