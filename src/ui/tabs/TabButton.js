define('famodev/ui/tabs/TabButton', [
    'require', 
    'exports',
    'module',
    'famous/core/Surface',
    'famous/core/EventHandler'
    ], function(require, exports, module) {

        var Surface         = require('famous/core/Surface');
        var EventHandler    = require('famous/core/EventHandler');

        function TabButton(options) {
            this._eventOutput = new EventHandler();
            EventHandler.setOutputHandler(this, this._eventOutput);

            this._surface = new Surface();

            this._surface.on('click', function() {
                if(!this.selected)
                    this.select();
            }.bind(this));
            this._surface.pipe(this._eventOutput);

            if (options) this.setOptions(options);
        }

        TabButton.OFF = 0;
        TabButton.ON = 1;
        TabButton.TOGGLE = 2;

        /**
         * Add Views
         */

        /**
         * Override the current options
         *
         * @method setOptions
         *
         * @param {object} options JSON
         */
        TabButton.prototype.setOptions = function setOptions(options) {
            if (this.options === undefined) {
                this.options = {};
            }
            if (options.content !== undefined) {
                this.options.content = options.content;
                this._surface.setContent(this.options.content);
            }
            if (options.size !== undefined) {
                this.options.size = options.size;
                this._surface.setSize(this.options.size);
            }
            if (options.properties !== undefined) {
                this.options.properties = options.properties;
                this._surface.setProperties(this.options.properties);
            }
            if (options.classes !== undefined) {
                this.options.classes = options.classes;
                this._surface.setClasses(this.options.classes);
            }
            if (options.offClasses) {
                this.options.offClasses = options.offClasses;
            }
            if (options.onClasses) {
                this.options.onClasses = options.onClasses;
            }
            if(options.selected)
                this.select();
        };

        /**
         * Methods
         */

        /**
         * Transition towards the 'on' state and dispatch an event to
         *  listeners to announce it was selected
         *
         * @method select
         */
        TabButton.prototype.select = function select() {
            this.selected = true;
            _.each(this.options.offClasses, function (v) {
                this._surface.removeClass(v);
            }.bind(this));
            _.each(this.options.onClasses, function (v) {
                this._surface.addClass(v);
            }.bind(this));
            this._eventOutput.emit('select');
        };

        /**
         * Transition towards the 'off' state and dispatch an event to
         *  listeners to announce it was deselected
         *
         * @method deselect
         */
        TabButton.prototype.deselect = function deselect() {
            this.selected = false;
            _.each(this.options.offClasses, function (v) {
                this._surface.addClass(v);
            }.bind(this));
            _.each(this.options.onClasses, function (v) {
                this._surface.removeClass(v);
            }.bind(this));
            this._eventOutput.emit('deselect');
        };
        /**
         * Return the size defined in the options object
         *
         * @method getSize
         *
         * @return {array} two element array [height, width]
         */
        TabButton.prototype.getSize = function getSize() {
            return this.options.size;
        };

        /**
         * Generate a render spec from the contents of this component.
         *
         * @private
         * @method render
         * @return {number} Render spec for this component
         */
        TabButton.prototype.render = function render() {
            return this._surface.render();
        };

        /**
         * Return the state of the button
         *
         * @method isSelected
         *
         * @return {boolean} selected state
         */
        TabButton.prototype.isSelected = function isSelected() {
            return this.selected;
        };

        /**
         * Return content of the button
         *
         * @method getContent
         *
         * @return {boolean} selected state
         */
        TabButton.prototype.getContent = function getContent() {
            return this._surface.getContent();
        };

        /**
         * Events
         */

        module.exports = TabButton;

    });
