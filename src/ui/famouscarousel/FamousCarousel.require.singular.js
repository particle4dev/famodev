define('constructors/SizeAwareView',['require','exports','module','famous/core/View','famous/core/Entity','famous/core/Transform'],function (require, exports, module) {var View      = require('famous/core/View');
var Entity    = require('famous/core/Entity');
var Transform = require('famous/core/Transform');

/*
 *  A view that keeps track of the parent's resize, passed down from the
 *  commit function. This can be anything higher in the render tree, 
 *  either the engine, or a modifier with a size, or a custom render function
 *  that changes the size. 
 *
 *  If you have a View that inherits from this, you get a .getParentSize()
 *  method that you can query at any point, and a `parentResize` event on 
 *  the `_eventInput` that you can listen to for immediate notificaitons of
 *  changes.
 *  
 *  @class SizeAwareView
 */
function SizeAwareView() {
    View.apply(this, arguments);
    this.__id = Entity.register(this);
    this.__parentSize = []; //Store reference to parent size.
}

SizeAwareView.prototype = Object.create( View.prototype );
SizeAwareView.prototype.constructor = SizeAwareView;

/*
 * Commit the content change from this node to the document.
 * Keeps track of parent's size and fires 'parentResize' event on
 * eventInput when it changes.
 *
 * @private
 * @method commit
 * @param {Object} context
 */
SizeAwareView.prototype.commit = function commit( context ) {
    var transform = context.transform;
    var opacity = context.opacity;
    var origin = context.origin;

    // Update the reference to view's parent size if it's out of sync with 
    // the commit's context. Notify the element of the resize.
    if (!this.__parentSize || this.__parentSize[0] !== context.size[0] || 
        this.__parentSize[1] !== context.size[1]) {
        this.__parentSize[0] = context.size[0];
        this.__parentSize[1] = context.size[1];
        this._eventInput.emit('parentResize', this.__parentSize);
    }

    if (this.__parentSize) { 
      transform = Transform.moveThen([
          -this.__parentSize[0]*origin[0], 
          -this.__parentSize[1]*origin[1], 
          0], transform);
    }

    return {
        transform: transform,
        opacity: opacity,
        size: this.__parentSize,
        target: this._node.render()
    };
}

/*
 * Get view's parent size.
 * @method getSize
 */
SizeAwareView.prototype.getParentSize = function getParentSize() {
    return this.__parentSize;
}

/*
 * Actual rendering happens in commit.
 * @method render
 */
SizeAwareView.prototype.render = function render() {
    return this.__id;
};

module.exports = SizeAwareView;

});

define('registries/Easing',['require','exports','module','famous/transitions/Easing','famous/transitions/TweenTransition'],function (require, exports, module) {var Easing = require('famous/transitions/Easing');
var TweenTransition = require('famous/transitions/TweenTransition');

/**
 * Helper function to register easing curves globally in an application.
 * To use this, all you must do is require this in.
 *
 * @example
 *  // Anywhere in your application, typically in app.js
 *  var RegisterEasing = require('registries/Easing');
 *  // Allows transitions as follows: 
 *  myModifier.setTransform(Transform.identity, {
 *    curve: 'outExpo', // as a string.
 *    duration: 500 
 *  });
 *
 * @class RegisterEasing
 * @protected
 * 
 */
function getAvailableTransitionCurves() { 
    var keys = getKeys(Easing).sort();
    var curves = {};
    for (var i = 0; i < keys.length; i++) {
        curves[keys[i]] = (Easing[keys[i]]);
    }
    return curves;
}

function getKeys(obj){
    var keys = [];
    var key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)){
            keys.push(key);
        }
    }
    return keys;
}

function registerKeys () {
    var curves = getAvailableTransitionCurves();
    for ( var key in curves ) {
        TweenTransition.registerCurve(key, curves[key]);
    }
}

registerKeys();

});

define('registries/Physics',['require','exports','module','famous/transitions/Transitionable','famous/transitions/SpringTransition','famous/transitions/SnapTransition','famous/transitions/WallTransition'],function (require, exports, module) {var Transitionable   = require('famous/transitions/Transitionable');
var SpringTransition = require('famous/transitions/SpringTransition');
var SnapTransition   = require('famous/transitions/SnapTransition');
var WallTransition   = require('famous/transitions/WallTransition');

Transitionable.registerMethod('spring', SpringTransition);
Transitionable.registerMethod('snap', SnapTransition);
Transitionable.registerMethod('wall', WallTransition);

});

define('slides/Slide',['require','exports','module','famous/core/Surface'],function (require, exports, module) {var Surface = require('famous/core/Surface');

/*
 * The most Basic Slide: a surface.
 */
function Slide (documentFragment) {
  Surface.call(this, {
    content: documentFragment,
    size: [true, true]
  });
}

Slide.prototype = Object.create(Surface.prototype);
Slide.prototype.constructor = Slide;

module.exports = Slide;

});

define('slides/ResponsiveSlide',['require','exports','module','famous/core/Surface','famous/core/Modifier','famous/core/View','famous/core/Transform','famous/transitions/TransitionableTransform'],function (require, exports, module) {var Surface                 = require('famous/core/Surface');
var Modifier                = require('famous/core/Modifier');
var View                    = require('famous/core/View');
var Transform               = require('famous/core/Transform');
var TransitionableTransform = require('famous/transitions/TransitionableTransform');

/*
 * ResponsiveSlide that scales based on the size of the carousel.
 */
function ResponsiveSlide (documentFragment, resizeTransition) {
  View.apply(this);
  this.on = ResponsiveSlide.on;
  this._resizeTransition = resizeTransition;

  this.surface = new Surface({
    content: documentFragment,
    size: [true, true]
  });
  this.surface.pipe(this._eventOutput);

  this.transform = new TransitionableTransform();
  this.modifier = new Modifier({
    transform: this.transform
  });

  this.add(this.modifier).add(this.surface);

  // Values set in 'setSize'
  this.trueSize   = null;
  this.scale      = null;
  this.scaledSize = null;
}

ResponsiveSlide.prototype = Object.create(View.prototype);
ResponsiveSlide.prototype.constructor = ResponsiveSlide;

ResponsiveSlide.prototype.getSize = function getSize() {
  return this.scaledSize || this.surface.getSize();
}

ResponsiveSlide.prototype.setSize = function setSize(containerSize, useTransition) {
  // Set 'true' size of the surface
  if (this.trueSize === null) {
    var size = this.surface.getSize();
    if (size !== null && size !== undefined && !(size[0] == 0 || size[1] == 0)) {
      this.trueSize = size;
    } else {
      return;
    }
  }

  // Set scale based on containerSize
  this.scale = Math.min(
    containerSize[0] / this.trueSize[0],
    containerSize[1] / this.trueSize[1]
  );
  this.scale = Math.min(this.scale, 1); //Only scale images down
  this.transform.halt();
  var transition = useTransition ? this._resizeTransition : null;
  this.transform.setScale([this.scale, this.scale, 1], transition);

  // Save scaled size
  this.scaledSize = [
    this.trueSize[0] * this.scale,
    this.trueSize[1] * this.scale
  ];
  return this.scaledSize;
}

ResponsiveSlide.on = function(event, action) {
  this.surface.on(event, action);
}

ResponsiveSlide.prototype.type = 'responsive';

module.exports = ResponsiveSlide;

});

define('components/Arrows',['require','exports','module','famous/core/View','famous/core/Modifier','famous/surfaces/ImageSurface','famous/core/Surface','famous/core/Transform','famous/transitions/Transitionable','famous/transitions/TransitionableTransform','famous/utilities/Timer'],function (require, exports, module) {var View                    = require('famous/core/View');
var Modifier                = require('famous/core/Modifier');
var ImageSurface            = require('famous/surfaces/ImageSurface');

var Surface                 = require('famous/core/Surface');

var Transform               = require('famous/core/Transform');
var Transitionable          = require('famous/transitions/Transitionable');
var TransitionableTransform = require('famous/transitions/TransitionableTransform');
var Timer                   = require('famous/utilities/Timer');

/**
 *  Adjustable arrows used for Carousel navigation.
 *
 *  @class Arrows
 *  @constructor
 *  @protected
 *  
 *  @param {Object} [options] An object of configurable options.
 *  @param {String} [options.position] Valid options: ["bottom" | "middle" | "top"]. Determines the vertical placement of the arrows. The horizontal position of the arrows are flush against left/right bounding border of the carousel.
 *  @param {Array|2D} [options.padding] Determines the displacement from the arrow position set by arrowsPosition. The first value in the array corresponds to the horizontal offset where a positive value pushes the arrows towards the center of the carousel. The second value in the array corresponds to the vertical offset where a positive value pushes the arrow down towards the bottom of the carousel.
 *  @param {String} [options.previousIconURL] URL of an image to use for the previous button skin.
 *  @param {String} [options.nextIconURL] URL of an image to use for the next button skin.
 *  @param {Boolean} [options.animateOnClick] Determines whether arrows display animation on click.
 *  @param {Boolean} [option.toggleDisplayOnHover] Determines whether arrows should be animated in/out when user hovers over the carousel. A value of 'false' signifies that the arrows will always be displayed.
 *  @css {.famous-carousel-arrow} CSS class applied to the arrows.
 */
function Arrows(options) {
  View.apply(this, arguments);

  // Store reference to surfaces/modifiers/transitionableTransforms
  this._storage = {
    prev: {
      surface: null,
      positionMod: null,
      animationMod: null,
      transTransform: null,
      opacityTrans: null
    },
    next: {
      surface: null,
      positionMod: null,
      animationMod: null,
      transTransform: null,
      opacityTrans: null
    }
  }

  // Keep track of arrow animation state
  this._arrowsDisplayed = this.options['toggleDisplayOnHover'] ? false : true;
  this._animationQueue = {
    showCount: 0,
    hideCount: 0
  }

  this._init();
}

Arrows.prototype = Object.create(View.prototype);
Arrows.prototype.constructor = Arrows;

Arrows.DEFAULT_OPTIONS = {
  'position' : 'center',
  'padding' : [10, 0],
  'previousIconURL' : undefined,
  'nextIconURL' : undefined,
  'animateOnClick' : true,
  'toggleDisplayOnHover' : true
}

Arrows.POSITION_TO_ALIGN = {
  'bottom' : 1,
  'middle' : 0.5,
  'top'    : 0
}

Arrows.ANIMATION_OPTIONS = {
  click: {
    offset: 10,
    transition: {
      curve: 'outBack',
      duration: 250
    }
  },
  display: {
    curve: 'outExpo',
    duration: 600
  }
}

/**
 * Show arrows.
 *
 * @protected
 * @method show
 */
Arrows.prototype.show = function show() {
  if(!this._arrowsDisplayed) {
    this._arrowsDisplayed = true;
    this._animationQueue.showCount++;
    this._queueAnimation('show');
  }
}

/**
 * Hide arrows.
 *
 * @protected
 * @method hide
 */
Arrows.prototype.hide = function hide() {
  if(this._arrowsDisplayed) {
    this._arrowsDisplayed = false;
    this._animationQueue.hideCount++;
    this._queueAnimation('hide');
  }
}

/**
 * Initializes Arrows class.
 *
 * @protected
 * @method _init
 */
Arrows.prototype._init = function _init() {
  this._initContent();
  this._events(this);
}

/**
 * Creates and adds ImageSurfaces used for prev/next arrow icons.
 * If an arrowURL is undefined, the Famo.us hosted stock arrow is used.
 *
 * @protected
 * @method _initContent
 */
Arrows.prototype._initContent = function _initContent() {
  var options = this._defineOptions(this.options['position']);
  var initialOpacity = this._arrowsDisplayed ? 1 : 0;

  //-----------Set up Arrows-----------//
  for(var arrowName in options) {
    var storage = this._storage[arrowName];
    //Initialize position and animation Modifiers
    storage.positionMod = new Modifier({
      origin: [0.5, 0.5],
      align: [0.5, 0.5],
      transform: Transform.translate(options[arrowName].translation[0], options[arrowName].translation[1])
    });
    storage.transTransform = new TransitionableTransform();
    storage.opacityTrans = new Transitionable(0);
    storage.animationMod = new Modifier({
      transform: storage.transTransform,
      opacity: storage.opacityTrans
    });

    //Create ImageSurface
    storage.surface = new ImageSurface({
      classes: ['famous-carousel-arrow', options[arrowName].className],
      content: options[arrowName].iconURL,
      size: [true, true],
      properties: options[arrowName].properties
    });

    //Add Surface
    this.add(storage.positionMod)
        .add(storage.animationMod)
        .add(storage.surface);

    //Initialize opacity and position
    Timer.after(function(storage, arrowName, initialOpacity){
      storage.positionMod.setOrigin(options[arrowName].placement);
      storage.positionMod.setAlign(options[arrowName].placement);
      storage.opacityTrans.set(initialOpacity);
    }.bind(null, storage, arrowName, initialOpacity), 2);
  }
}

/**
 * Sets up options used to create and position arrows.
 *
 * @protected
 * @method _defineOptions
 * @param {String} [position]
 * @return {Object} An object with properties used to create arrow Surfaces & Modifiers
 */
Arrows.prototype._defineOptions = function _defineOptions(position) {
  var padding = this.options['padding'];

  var defaultBorderWidth = 2;
  var defaultPadding = 5;
  var defaultProperites = {
    border: defaultBorderWidth + 'px solid #404040',
    padding: defaultPadding + 'px',
    borderRadius: '50%',
    zIndex: 2
  }

  var options = {
    prev: {className: 'famous-carousel-arrow-previous'},
    next: {className: 'famous-carousel-arrow-next'}
  };
  var extraOffset = -defaultBorderWidth - defaultBorderWidth;

  //Check to see if default image needs to be used.
  if(this.options['previousIconURL'] === undefined) {
    options.prev.iconURL = '/images/icons/arrow_left_dark.svg'; //TODO: Change to hosted URL
    options.prev.properties = defaultProperites;
  } else {
    options.prev.iconURL = this.options['previousIconURL'];
    options.prev.properties = {zIndex: 2};
  }

  if(this.options['nextIconURL'] === undefined) {
    options.next.iconURL = '/images/icons/arrow_right_dark.svg'; //TODO: Change to hosted URL
    options.next.properties = defaultProperites;
    options.next.extraXPadding = extraOffset; //Used to offset padding/border on default image.
  } else {
    options.next.iconURL = this.options['nextIconURL'];
    options.next.properties = {zIndex: 2};
    options.next.extraXPadding = 0;
  }

  //Calculate vertically padding/border offset (dependent on position)
  var extraYPadding;
  if(position === 'top') extraYPadding = 0;
  else if(position === 'middle') extraYPadding = extraOffset / 2;
  else extraYPadding = extraOffset;

  options.prev.placement = [0, Arrows.POSITION_TO_ALIGN[position]];
  options.prev.translation = [padding[0], extraYPadding - padding[1]];
  
  options.next.placement = [1, Arrows.POSITION_TO_ALIGN[position]];
  options.next.translation = [extraOffset - padding[0], extraYPadding - padding[1]];

  return options;
}

/**
 * Sets up arrows click events.
 *
 * @protected
 * @method _events
 */
Arrows.prototype._events = function _events() {
  var prevSurf = this._storage.prev.surface;
  var nextSurf = this._storage.next.surface;

  //Click Events
  prevSurf.on('click', function(){
    this._onPrev();
    this._eventOutput.emit('click');
  }.bind(this));
  nextSurf.on('click', function(){
    this._onNext();
    this._eventOutput.emit('click');
  }.bind(this));

  //Hover Events
  if(this.options['toggleDisplayOnHover']) {
    prevSurf.on('mouseover', this.show.bind(this));
    nextSurf.on('mouseover', this.show.bind(this));
    prevSurf.on('mouseout', this.hide.bind(this));
    nextSurf.on('mouseout', this.hide.bind(this));
  }
}

/**
 * Emits 'previous' end and triggers animation
 *
 * @protected
 * @method _onPrev
 */
Arrows.prototype._onPrev = function _onPrev(){
  this._eventOutput.emit('previous');
  this._animateArrow(this._storage.prev.transTransform, -1);
}

/**
 * Emits 'next' end and triggers animation
 *
 * @protected
 * @method _onNext
 */
Arrows.prototype._onNext = function _onNext(){
  this._eventOutput.emit('next');
  this._animateArrow(this._storage.next.transTransform, 1);
}

/**
 * Animates an arrow.
 *
 * @protected
 * @method _animateArrow
 * @param {TransionableTransform} [transTransform] TransionableTransform attached to Modifier of clicked arrow.
 * @param {Number} [direction] Direction of animation. -1 for left, 1 for right.
 */
Arrows.prototype._animateArrow = function _animateArrow(transTransform, direction) {
  if(!this.options['animateOnClick']) return;

  var opts = Arrows.ANIMATION_OPTIONS.click;
  transTransform.halt();
  transTransform.set(
    Transform.translate(opts.offset * direction, 0),
    {duration: 1},
    function(){
      transTransform.set(
        Transform.identity,
        opts.transition
      );
    }
  );
}

/**
 * Queues up show/hide animation for both arrows.
 * (Prevents triggering animation if both show+hide are called within 
 * a threshold interval. Used to prevent triggering animation when hovering
 * over an arrow inside of the Carousel.)
 *
 * @protected
 * @method _queueAnimation
 */
Arrows.prototype._queueAnimation = function _queueAnimation() {
  var q = this._animationQueue;
  Timer.setTimeout(function(){
    while(q.showCount > 0 && q.hideCount > 0) {
      q.showCount--;
      q.hideCount--;
    }
    if(q.showCount > 0) {
      q.showCount--;
      this._showOrHide('show');
    } else if(q.hideCount > 0) {
      q.hideCount--;
      this._showOrHide('hide');
    }
  }.bind(this), 25);
}

/**
 * Triggers animatino to show or hide the arrows.
 *
 * @protected
 * @method _showOrHide
 * @param {String} [actionName] 'show' or 'hide'
 */
Arrows.prototype._showOrHide = function _showOrHide(actionName) {
  //----------------Set Animation Options----------------//
  var opts = Arrows.ANIMATION_OPTIONS.display;
  var duration = opts.duration;
  var opacity;
  var scale1 = 1.2;
  var scale2;
  var delay;
  if(actionName === 'show') {
    opacity = 1;
    scale2 = 1;
    delay = 0;
  } else {
    opacity = 0;
    scale2 = 0.001;
    delay = duration / 2;
  }

  //----------------Trigger Animations----------------//
  var prevOpacity = this._storage.prev.opacityTrans;
  var nextOpacity = this._storage.next.opacityTrans;
  var prevTrans = this._storage.prev.transTransform;
  var nextTrans = this._storage.next.transTransform;

  //Halt transitions
  prevOpacity.halt();
  nextOpacity.halt();
  prevTrans.halt();
  nextTrans.halt();

  //Set Opacity.
  prevOpacity.delay(delay, function() {
    prevOpacity.set(opacity, {duration: duration/2, curve: 'outBack'});
    nextOpacity.set(opacity, {duration: duration/2, curve: 'outBack'});
  })

  //Set Transform
  prevTrans.set(
    Transform.scale(scale1, scale1),
    {duration: duration * 1/4, curve: opts.curve},
    function() {
      prevTrans.set(Transform.scale(scale2, scale2), {duration: duration * 3/4, curve: opts.curve});
    }
  );

  nextTrans.set(
    Transform.scale(scale1, scale1),
    {duration: duration * 1/4, curve: opts.curve},
    function() {
      nextTrans.set(Transform.scale(scale2, scale2), {duration: duration * 3/4, curve: opts.curve});
    }
  );
}

module.exports = Arrows;

});

define('events/EventHelpers',['require','exports','module','famous/utilities/Timer','famous/core/Engine'],function (require, exports, module) {var Timer = require('famous/utilities/Timer');
var Engine = require('famous/core/Engine');

/*
 *  When a predicate evaluates to true, execute the executeFn. (Polling promise.all).
 *  @param predicates {Array|Function} functions that returns true / false
 *  @param executeFn {Function} function to execute after predicate returns true
 *  @param numTicks {Number} How often we should check. By default, it's every frame.
 */
function when( predicates, executeFn, numTicks ) {
    if (!numTicks) numTicks = 1;
    if (!(predicates instanceof Array)) predicates = [predicates];

    var waitFn = Timer.every(function () {
        for (var i = 0; i < predicates.length; i++) {
            if (!predicates[i]()) return;
        };
        executeFn();
        Timer.clear(waitFn);
    }, numTicks);
}

/*
 *  A pipes to B, and B to A.
 *  @param {Class} eventerA 
 *  @param {Class} eventerB 
 */
function dualPipe (eventerA, eventerB ) {
    eventerA.pipe(eventerB);
    eventerB.pipe(eventerA);
}

function clear (fn) {
  Engine.removeListener('prerender', fn);
}

/*
 *  frameQueue sets up an action to occur after n number
 *  of frames. It returns a function that will reset
 *  the frames to wait.
 */
function frameQueue (executeFn, numTicks) {
  var originalNumberOfTicks = numTicks;

  var waitFn = function () {
      numTicks--;
      if (numTicks <= 0) { 
        executeFn();
        clear(waitFn);
      }
  };

  Engine.on('prerender', waitFn);

  return function () {
    numTicks = originalNumberOfTicks;
  }
}

module.exports = {
    when: when,
    dualPipe: dualPipe,
    frameQueue: frameQueue
}

});

define('components/Dots',['require','exports','module','../constructors/SizeAwareView','famous/core/Surface','famous/core/Modifier','famous/core/RenderNode','famous/core/Transform','famous/transitions/Transitionable','famous/transitions/TransitionableTransform','famous/views/SequentialLayout','famous/utilities/Timer','../events/EventHelpers'],function (require, exports, module) {var SizeAwareView           = require('../constructors/SizeAwareView');
var Surface                 = require('famous/core/Surface');
var Modifier                = require('famous/core/Modifier');
var RenderNode              = require('famous/core/RenderNode');
var Transform               = require('famous/core/Transform');
var Transitionable          = require('famous/transitions/Transitionable');
var TransitionableTransform = require('famous/transitions/TransitionableTransform');
var SequentialLayout        = require('famous/views/SequentialLayout');
var Timer                   = require('famous/utilities/Timer');

var EventHelpers            = require('../events/EventHelpers');

/**
 * Adjustable dots used for Carousel navigation.
 *
 * @class Dots
 * @constructor
 * @protected
 *
 * @param {Object} [options] An object of configurable options.
 * @param {String} [options.position] Valid options: ["left" | "middle" | "right"]. Determines the horizontal placement of the arrows. The vertical position of the arrows are flush against bottom bounding border of the carousel.
 * @param {Array|2D} [options.padding] Determines the displacement from dot position set by dotsPosition. The first value in the array corresponds to the horizontal offset where a positive value pushes the dots to right and a negative value pushes them to the left. The second value in the array corresponds to the vertical offset where a negative value pushes the dots up towards the top of the carousel and a positive value pushes them down.
 * @param {Array|2D} [options.size] The width and height (in pixels) of the selection dots.
 * @param {Number} [options.horizontalSpacing] The horizontal spacing (in pixels) between each dot.
 * @param {Number} [options.length] The number of dots to display.
 * @param {Number} [options.selectedIndex] The index of the image currently being displayed.
 *
 * @css {.famous-carousel-dot} Applied to each dot.
 * @css {.famous-carousel-dot-selected} Applied to currently selected dot.
 */
function Dots(options) {
  SizeAwareView.apply(this, arguments);

  this._data = {
    dots: [], // {surface, modifier, transTransform, renderNode}
    parentSize: [],
    dotCount: this.options['length'],
    layoutModel: [], // array used as blueprint to create layout,
    selectedIndex: this.options['selectedIndex']
  }

  this.layout = new SequentialLayout({
    defaultItemSize: this.options['size']
  }); //Layout used to display dots.
  this.positionMod = new Modifier();
  this.animationMod = new Modifier();
  this.opacityTrans = new Transitionable(1);
  this.transTransform = new TransitionableTransform();

  this.displayed = true; //Track whether arrows are displayed.

  // Delay initialization until parentSize is defined since
  // the dots need to be size aware in order to properly lay
  // themselves out.
  EventHelpers.when(function() {
    return this.getParentSize().length !== 0;
  }.bind(this), this._init.bind(this));
}

Dots.prototype = Object.create(SizeAwareView.prototype);
Dots.prototype.constructor = Dots;

Dots.DEFAULT_OPTIONS = {
  'position'          : 'middle',
  'padding'           : [0, -10],
  'size'              : [10, 10],
  'horizontalSpacing' : 10,
  'length'            : 1,
  'selectedIndex'     : 0,
  'applyDefaultStyle' : true
}

Dots.POSITION_TO_ALIGN = {
  'left' : 0,
  'middle' : 0.5,
  'right'    : 1
}

Dots.ANIMATION_OPTIONS = {
  click: {
    offset: -7,
    transition: {
      curve: 'outExpo',
      duration: 250
    }
  },
  display: {
    scaleUp: 1.15,
    duration: 600,
    curve: 'outExpo'
  }
}

/**
 * Sets an index.
 *
 * @method setIndex
 */
Dots.prototype.setIndex = function setIndex(index) {
  if (index === this._data.selectedIndex) return;
  if (index >= this._data.dots.length || index < 0) return;

  // Remove class from old index
  var oldIndex = this._data.selectedIndex;
  if (this._data.dots[oldIndex]) {
    this._data.dots[oldIndex].surface.removeClass('famous-carousel-dot-selected');
    if(this.options['applyDefaultStyle']) {
      this._data.dots[oldIndex].surface.setProperties({'background-color' : 'white'})
    }
  }

  // Set current index
  this._data.dots[index].surface.addClass('famous-carousel-dot-selected');
  if(this.options['applyDefaultStyle']) {
      this._data.dots[index].surface.setProperties({'background-color' : 'black'})
    }
  this._data.selectedIndex = index;
}

/**
 * Display dots using animation.
 * Options set in Dots.ANIMATION_OPTIONS.display
 *
 * @method show
 * @param {Function} [cb] Callback function to call after animation.
 */
Dots.prototype.show = function show(cb) {
  if (this.displayed) return;

  this.opacityTrans.halt();
  this.transTransform.halt();

  this.displayed = true;
  var opts = Dots.ANIMATION_OPTIONS.display;
  this.opacityTrans.set(1, {duration: 100, curve: 'inExpo'});
  this.transTransform.set(Transform.identity);
  this.transTransform.set(
    Transform.scale(opts.scaleUp, opts.scaleUp),
    {duration: opts.duration * 1/3, curve: 'outExpo'},
    function(){
      this.transTransform.set(
        Transform.identity,
        {duration: opts.duration * 2/3, curve: opts.curve},
        cb
      );
    }.bind(this)
  );
}

/**
 * Hide dots using animation.
 * Options set in Dots.ANIMATION_OPTIONS.display
 *
 * @method hide
 * @param {Function} [cb] Callback function to call after animation.
 */
Dots.prototype.hide = function hide(cb) {
  if (!this.displayed) return;

  this.opacityTrans.halt();
  this.transTransform.halt();

  this.displayed = false;
  var opts = Dots.ANIMATION_OPTIONS.display;
  this.opacityTrans.set(1, {duration: opts.duration, curve: opts.curve});
  this.transTransform.set(
    Transform.scale(opts.scaleUp, opts.scaleUp),
    {duration: opts.duration * 0.25, curve: 'outExpo'},
    function() {
      this.transTransform.set(
        Transform.scale(0.0001, 0.0001),
        {duration: opts.duration * 0.75, curve: opts.curve},
        cb
      );
    }.bind(this)
  );
}

/**
 * Changes number of dots displayed with an animation.
 *
 * @method setLength
 * @param {Number} [length] Length of new dot count.
 * @param {Number} [itemsPerPage] Number of items displayed per page (used to calculate updated index).
 */
Dots.prototype.setLength = function setLength(length, itemsPerPage, selectedIndex){
  this._data.dotCount = length;
  this._data.selectedIndex = Math.floor(selectedIndex / itemsPerPage);

  this.hide(function(){
    this._init();
    this.setIndex(this._data.selectedIndex);
    Timer.after(this.show.bind(this), 1); //Make sure content is initialized before triggering animation.
  }.bind(this));
}

/**
 * @method _init
 * @protected
 */
Dots.prototype._init = function _init() {
  this._data.parentSize = this.getParentSize();

  this._initContent();
  this._createLayout();
}

/**
 * @method _initContent
 * @protected
 */
Dots.prototype._initContent = function _initSurfaces() {
  //Create Dots
  this._data.dots = [];
  for(var i = 0; i < this._data.dotCount; i++) {
    this._data.dots.push(this._createNode(i));
  }
}

/**
 * Creates and returns an object with Surface, Modifier,
 * TransitionableTransform, and RenderNode representing an individual dot.
 *
 * @method _createNode
 * @protected
 * @param {Number} [index] Index corresponding to dot.
 * @return {Object} [storage] Contains reference to index, surface, transTransform, modifier and renderNode
 */
Dots.prototype._createNode = function _createNode(index) {
  var storage = {};
  storage.index = index;

  var defaultProperties = {
    zIndex: 2
  };
  if(this.options['applyDefaultStyle']) {
    defaultProperties['background-color'] = 'white';
    defaultProperties['border-radius'] = '50%';
    defaultProperties['border'] = '1px solid black';
  }

  storage.surface = new Surface({
    classes: ['famous-carousel-dot'],
    size: this.options['size'],
    properties: defaultProperties
  });

  if(index === this._data.selectedIndex) {
    storage.surface.addClass('famous-carousel-dot-selected');
    if(this.options['applyDefaultStyle']) {
      storage.surface.setProperties({'background-color' : 'black'});
    }
  }

  storage.surface.on('click', this._changeIndex.bind(this, storage));
  if(this.options['arrowsToggleDisplayOnHover']) {
    storage.surface.on('mouseover', this._eventOutput.emit.bind(this._eventOutput, 'showArrows'));
    storage.surface.on('mouseout', this._eventOutput.emit.bind(this._eventOutput, 'hideArrows'));
  }

  storage.transTransform =  new TransitionableTransform();
  storage.modifier = new Modifier({
    transform: storage.transTransform
  });

  storage.renderNode = new RenderNode();
  storage.renderNode.add(storage.modifier).add(storage.surface)

  return storage;
}

/**
 * Create SequentialLayout used to position the dots.
 *
 * @method _createLayout
 * @protected
 */
Dots.prototype._createLayout = function _createLayout() {
  //Create an array representing blueprint for SequentialLayout.
  var layoutModel = this._createLayoutModel();

  //Single row --> single SequentialLayout to display dots
  if(layoutModel.length === 1) {
    this.layout.setOptions({
      direction: 0,
      itemSpacing: this.options['horizontalSpacing']
    });
    this.layout.sequenceFrom(layoutModel[0]);
  } else {
    this._createNestedLayout();
  }

  this._addLayout();
}

/**
 * Create nested SequentialLayout used to position the dots.
 * (Handles edge case when there are multiple rows of dots.)
 *
 * @method _createNestedLayout
 * @protected
 */
Dots.prototype._createNestedLayout = function _createNestedLayout() {
  var rowLayouts = []; //Store of horizontal SequentialLayouts
  var spacing = this.options['horizontalSpacing'];

  this.layout.setOptions({
    direction: 1,
    itemSpacing: spacing
  });
  this.layout.sequenceFrom(rowLayouts);

  //Populate rows.
  var layoutModel = this._data.layoutModel;
  var rowLayout;
  for(var row = 0; row < layoutModel.length; row++) {
    rowLayout = new SequentialLayout({
      direction: 0,
      itemSpacing: spacing,
      defaultItemSize: this.options['size']
    });
    rowLayout.sequenceFrom(layoutModel[row]);

    //Apply positioning modifier to position bottom row.
    if(row === (layoutModel.length - 1) && layoutModel.length > 1) {
      var node = new RenderNode();
      node.add(new Modifier({
        origin: [Dots.POSITION_TO_ALIGN[this.options['position']], 0]
      })).add(rowLayout);
      rowLayouts.push(node);
    } else {
      rowLayouts.push(rowLayout);
    }
  }
}

/**
 * Add dots layout to view.
 *
 * @method _addLayout
 * @protected
 */
Dots.prototype._addLayout = function _addLayout() {
  var horizontalPos = Dots.POSITION_TO_ALIGN[this.options['position']];
  
  this.positionMod.setOrigin([horizontalPos, 1]);
  this.positionMod.setAlign([horizontalPos, 1]);
  this.positionMod.setTransform(Transform.translate(this.options['padding'][0], 
                                                    this.options['padding'][1]));

  this.animationMod.setOpacity(this.opacityTrans);
  this.animationMod.setTransform(this.transTransform);

  this.add(this.positionMod).add(this.animationMod).add(this.layout);
}

/**
 * Create an array used to represent how many dots should be placed per row. 
 * (Deals with corner case in which there are multiple rows of dots.)
 *
 * @method _createLayoutModel
 * @protected
 * @param {Array|Nested} [layoutModel]
 */
Dots.prototype._createLayoutModel = function _createLayoutModel() {
  var widthThreshold = this._data.parentSize[0]; //Entry point to limit dots to slide size.

  //Reset model.
  var layoutModel = [];
  layoutModel.push([]);

  var rowIndex = 0;
  var rowWidth = 0; //Tracks length of current row in pixels.

  var dotWidth = this.options['size'][0] + this.options['horizontalSpacing'];

  //Create model.
  var dots = this._data.dots;
  for(var i = 0; i < dots.length; i++) {
    //Check if there is enough space to add dot to current row
    if((rowWidth + dotWidth) > widthThreshold) {
      //Add new row.
      rowIndex++;
      rowWidth = 0;
      layoutModel.push([]);
    }

    rowWidth += dotWidth;
    layoutModel[rowIndex].push(dots[i].renderNode);
  }
  
  this._data.layoutModel = layoutModel;
  return layoutModel;
}

/**
 * Emits 'set' event and triggers animation.
 *
 * @method _changeIndex
 * @protected
 * @param {Object} [dot] Dot object with reference its index and transTransform
 */
Dots.prototype._changeIndex = function _changeIndex(dot) {
  this._eventOutput.emit('set', dot.index);
  this._animateDot(dot.transTransform);
}

/**
 * Animates a selected dot.
 * Options set in Dots.ANIMATION_OPTIONS.click
 *
 * @method _animateDot
 * @protected
 * @param {TransitionableTransform} [transTransform]
 */
Dots.prototype._animateDot = function _animateDot(transTransform) {
  var opts = Dots.ANIMATION_OPTIONS.click;
  transTransform.set(Transform.translate(0, opts.offset), {duration: 1}, function(){
    transTransform.set(Transform.identity, opts.transition);
  })
}

module.exports = Dots;

});

define('helpers/ObjectHelpers',['require','exports','module'],function (require, exports, module) {/*
 *  Shallow copy b into a.
 *  @method extend
 */
function extend (a, b) {
  for (var key in b) a[key] = b[key];
}

/*
 * Set up prototypal inheritance chain.
 * @method inherits
 */
function inherits (a, b) {
  a.prototype = Object.create(b.prototype);
  a.prototype.constructor = a;
}

/*
 * Return new object with combination of a & b.
 * @method merge
 */
function merge (a, b) {
  var obj = {};
  extend(obj, a);
  extend(obj, b);
  return obj;
}

module.exports = { 
  extend: extend,
  inherits: inherits,
  merge: merge
};

});

define('layouts/Layout',['require','exports','module','../helpers/ObjectHelpers','famous/core/Transform','famous/utilities/Utility'],function (require, exports, module) {var ObjectHelpers = require('../helpers/ObjectHelpers');
var Transform     = require('famous/core/Transform');
var Utility       = require('famous/utilities/Utility');

/**
 * For advanced developers only! Not exposed in the FamousCarousel global distribution.
 * Parent class for the all layouts that are used in the Carousel.
 * All layouts must implement the 'activate', 'layout', 'getRenderLimit',
 * and 'deactivate' methods.
 *
 * @class Layout
 * @param options {Object} Options that are merged with the default options for the class used to customize a layout.
 */
function Layout (options) {
  //Merge passed in and default options.
  var defaultOptions = Utility.clone(this.constructor.DEFAULT_OPTIONS || {});
  this.options = ObjectHelpers.merge(defaultOptions, options);
  this.id = this.constructor.id;

  //Properties that are set via setController
  this.controller = null;
  this.data = null;

  this.activated = false;
  return this;
}

/**
 * Set's reference to LayoutController.
 *
 * @method setController
 * @protected
 * @param controller {Object} Reference to LayoutController.
 */
Layout.prototype.setController = function setController(controller){
  this.controller = controller;
  this.data = controller.data;
}

/**
 *  Reset child transforms, aligns, and origins.
 *  @method _resetChildProperties
 *  @private
 */
Layout.prototype.resetChildProperties = function resetChildProperties() {
  var cleanUpDuration = this.options.transition.duration || this.options.transition.period || 200;
  for (var i = 0; i < this.controller.nodes.length; i++) {
    this.data.childTransforms[i].set(Transform.identity, 
      {curve: 'outExpo', duration: cleanUpDuration}
    );
    this.data.childOrigins[i].set([0, 0]);
    this.data.childAligns[i].set([0, 0]);
  }
}

// These methods must be fully implemented in all functioning classes that inherit from Layout.

/**
 *  Required to be implemented for a custom layout.
 *  The render limit is a two dimensional array representing the number of elements before and
 *  after the current index that is rendered into the dom. For example, a renderLimit of [3, 3]
 *  would render seven items total, three before the current index, the current index and the three 
 *  following. Render limit supports looping.
 *
 *  @method getRenderLimit
 */
Layout.prototype.getRenderLimit = function getRenderLimit() {}

/**
 *  The activation animations are called on initialization. This allows you to have a different
 *  animation from the general index change events. The Carousel.GridLayout takes the most advantage
 *  of this, animating the items into the grid, then allowing pagination afterwards.
 *
 *  If you need to add event listeners or other logic, it should be inserted here.
 *
 *  @method activate
 */
Layout.prototype.activate = function activate() {}

/**
 *  The layout animation is called on every index change. This where most of the animations will 
 *  occur.
 *  @method layout
 */
Layout.prototype.layout = function layout() {}

/**
 *  Deactivate allows you to perform cleanup on any event listeners that you may have registered on your 
 *  custom layout.
 *  @method deactivate
 */
Layout.prototype.deactivate = function deactivate() {}

module.exports = Layout;

});

define('layouts/SingularLayout',['require','exports','module','./Layout','famous/core/Transform','famous/utilities/Timer'],function (require, exports, module) {var Layout    = require('./Layout');
var Transform = require('famous/core/Transform');
var Timer     = require('famous/utilities/Timer');

/**
 *  Parent class of all 'Singular' layouts (i.e., those that display one item at a time and transition from one item to another.)
 *  The currentItemTransition and previousItemTransition methods are not fully implemented.
 *  SingularLayout extends Layout.
 *
 *  @class SingularLayout
 *  @protected
 *  @param {Object} [options] Configurable options to set on layout.
 */
function SingularLayout(options) {
  Layout.call(this, options);

  this.isSingular = true;

  //Properties that are set on 'activate'
  this._boundSizeListener = null;
  return this;
}

SingularLayout.prototype = Object.create(Layout.prototype);
SingularLayout.prototype.constructor = SingularLayout;

SingularLayout.DEFAULT_OPTIONS = {};

/**
 *  Activate layout.
 *  @method activate
 */
SingularLayout.prototype.activate = function activate(controller) {
  this.controller._eventOutput.emit('paginationChange', 1);

  for(var i = 0; i < this.controller.items.length; i++) {
    //Reset child origins / aligns / transforms
    this.data.childOrigins[i].set([0.5, 0.5]);
    this.data.childAligns[i].set([0.5, 0.5]);
    this.data.childTransforms[i].set(Transform.identity);

    //-----------Animate currently selected slide-----------//
    if (i === this.controller.index) {
      //Opacitate in.
      this.data.opacities[i].set(1, this.options.curve);

      //If size is defined, apply proper translation.
      if (this.data.sizeCache[i]) {
        
        //------Transition between two SingularLayouts------//
        if(this.controller.isLastLayoutSingular || this.controller.isLastLayoutSingular === null) {
          this.centerItem(i, {
            method: 'spring',
            dampingRatio: 0.65,
            period : 400,
          });
        }
        
        //------Transition between Singular and 'Multiple' Layout------//
        else {
          // Add extra 'bounce' animation.
          // 1.) Scale item down.
          this.data.childTransforms[i].set(
            Transform.scale(0.8, 0.8),
            {duration: 150},
            function(i){
              //Center item
              this.centerItem(i, { 
                method: 'spring',
                dampingRatio: 0.65,
                period : 400,
              });

              // 2.) Scale item back to identity.
              this.data.childTransforms[i].set(
                Transform.identity,
                {duration: 150}
              );

            }.bind(this, i)
          )
        }
      }
    }
    //-----------Animate all other slides-----------//
    else {
      //Instantly push back zIndex so selected slide is in front.
      this.data.childTransforms[i].set(
        Transform.translate(0,0,-10)
      )

      //Opacitate out.
      this.data.opacities[i].set(0, {duration: 300}, function(i){
        //Center parent position is size is defined.
        if (this.data.sizeCache[i]) {
          this.centerItem(i);
        }
      }.bind(this, i));
    }
  }

  //Call 'centerItem' after an item's size is defined.
  this._boundSizeListener = this.centerItem.bind(this);
  this.controller._eventInput.on('initialSize', this._boundSizeListener);

  this._addTouchEvents();
  this.activated = true;
}

/**
 *  Layout slides.
 *  @method layout
 */
SingularLayout.prototype.layout = function layout() {
  var currentIndex = this.controller.index;
  var previousIndex = this.controller.lastIndex;
  var finalIndex = this.controller.items.length - 1;

  //Check for cycling forwards from last to first, and backward from first to last
  var isMovingForward = 
    (currentIndex > previousIndex || (currentIndex === 0 && previousIndex === finalIndex)) &&
    !(currentIndex === finalIndex && previousIndex === 0)

  var containerSize = this.controller.getSize().slice(0);
  for (var i = 0; i < this.controller.items.length; i++) {
    if (i === this.controller.index) {
      this.centerItem(i);
      this.currentItemTransition(
        this.getItem(i),
        containerSize,
        isMovingForward
      );
    } 
    else if (i === this.controller.lastIndex) {
      this.centerItem(i);
      this.previousItemTransition(
        this.getItem(i),
        containerSize,
        isMovingForward
      );
    } 
    else {
      this.otherItemTransition(
        this.getItem(i),
        containerSize
      );
    }
  }
}

/**
 *  Transform to apply on layout to all items excluding those that are currently/previously selected.
 *  @method otherItemTransition
 *  @param item {Object} Object containing refence to Transitionables linked to items parent and child origin/align/transform and opacity.
 *  @param containerSize {Array|2D}
 */
SingularLayout.prototype.otherItemTransition = function otherItemTransition(item, containerSize) {
  item.opacity.set(0);
}

/**
 *  These methods must be implemented in Layouts that inherit from SingularLayout in order to be useable.
 */
SingularLayout.prototype.currentItemTransition = function currentTransition(item, containerSize, index, previousIndex) {}
SingularLayout.prototype.previousItemTransition = function previousItemTransition(item, containerSize, index, previousIndex) {}

/**
 *  Deactivate layout.
 *  @method deactivate
 */
SingularLayout.prototype.deactivate = function deactivate() {
  this.controller.isLastLayoutSingular = true;
  this.controller._eventInput.removeListener(
    'initialSize', this._boundSizeListener
  );
  this._removeTouchEvents();
}

/**
 *  Return render limit for layout.
 *  @method getRenderLimit
 *  @return {Array|2D}
 */
SingularLayout.prototype.getRenderLimit = function getRenderLimit() {
  return [1,1];
}

/**
 *  Get the centered position of an item (based on the container size).
 *  @method getCenteredPosition
 *  @param index {Number}
 *  @return {Array|2D}
 */
SingularLayout.prototype.getCenteredPosition = function getCenteredPosition(index) {
  var containerSize = this.controller.getSize();
  var itemSize = this.data.sizeCache[index];
  return [ 
    (containerSize[0] - itemSize[0]) * 0.5,
    (containerSize[1] - itemSize[1]) * 0.5 
  ];
}

/**
 *  Apply transform to parentTransform to center an item.
 *  @method centerItem
 *  @param index {Number}
 *  @param transition {Object} Transition used for animation. (Physics [Spring, Snap, Wall]: {method: method, dampingRatio: dampingRatio, period: period} OR EasingCurve: {duration: duration, curve: curve})
 */
SingularLayout.prototype.centerItem = function centerItem(index, transition) {
  // Adjust for params passed in as object through event
  if(typeof index !== "number") {
    var eventObj = index;
    index = eventObj.index;
    transition = eventObj.transition;
  }

  // Check that size is defined
  var itemSize = this.data.sizeCache[index];
  if (itemSize === undefined || itemSize === null) return;

  var containerSize = this.controller.getSize();

  this.data.parentTransforms[index].halt();
  this.data.parentTransforms[index].set(
    Transform.translate(
      (containerSize[0] - itemSize[0]) * 0.5,
      (containerSize[1] - itemSize[1]) * 0.5 
    ),
    transition
  );
}

/**
 *  Get reference to an item and Transionables linked to its origns/aligns/transforms/opacity.
 *  @method getItem
 *  @param i {Number} Index of the item to retreive.
 *  @return {Object}
 */
SingularLayout.prototype.getItem = function getItem(i) {
  return {
    item : this.controller.items[i],
    size: this.data.sizeCache[i],
    index: i,
    
    opacity: this.data.opacities[i],
    parentOrigin: this.data.parentOrigins[i],
    parentAlign: this.data.parentAligns[i],
    parentSize: this.data.parentSizes[i],
    parentTransform : this.data.parentTransforms[i],

    childTransform : this.data.childTransforms[i],
    childOrigin: this.data.childOrigins[i],
    childAlign: this.data.childAligns[i]
  };
}

/**
 * @method _onSyncStart
 * @protected
 * @param data
 */
SingularLayout.prototype._onSyncStart = function (data) {
    this._maxDelta   = this.controller.getSize()[0]  * 0.15;
}

/**
 * @method _onSyncUpdate
 * @protected
 * @param data
 */
SingularLayout.prototype._onSyncUpdate = function (data) {
    var index      = this.controller.index;
    var touchTrans = this.data.touchOffset;
    var pos = data.position[0];
    var offset = pos;
    var absPos = Math.abs(pos);
    if (Math.abs(pos) > this._maxDelta) {
        var diff = absPos - this._maxDelta;
        offset = this._maxDelta + Math.log(diff) * 10;
        if (pos < 0) offset *= -1;
    }
    touchTrans.set([offset, 0]);
}

/**
 * @method _onSyncEnd
 * @protected
 * @param data
 */
SingularLayout.prototype._onSyncEnd = function (data) {
    var index      = this.controller.index;      
    var touchTrans = this.data.touchOffset;
    var touchPos   = touchTrans.get();
    var size       = this.data.sizeCache[index];

    if (Math.abs(touchPos[0]) > size[0] * 1/5) {
      var eventName = touchTrans.get()[0] < 0 ? 'next' : 'previous';
      this.controller._eventOutput.emit(eventName);
    }
    
    touchTrans.set([0, 0], {
      curve: 'outBack',
      duration: 150
    });
}

/**
 *  Add touch events on sync's 'update' and 'end'
 *  @method _addTouchEvents
 *  @protected
 */
SingularLayout.prototype._addTouchEvents = function _addTouchEvents() {
  this.boundTouchStart = this._onSyncStart.bind(this);
  this.boundTouchUpdate = this._onSyncUpdate.bind(this);
  this.boundTouchEnd = this._onSyncEnd.bind(this);
  this.controller.sync.on('start', this.boundTouchStart);
  this.controller.sync.on('update', this.boundTouchUpdate);
  this.controller.sync.on('end', this.boundTouchEnd);
}

/**
 *  Remove reference to touch events.
 *  @method _removeTouchEvents
 *  @protected
 */
SingularLayout.prototype._removeTouchEvents = function _removeTouchEvents() {
  this.controller.sync.removeListener('start', this.boundTouchStart);
  this.controller.sync.removeListener('update', this.boundTouchUpdate);
  this.controller.sync.removeListener('end', this.boundTouchEnd);
}

module.exports = SingularLayout;

});

define('layouts/SingularSoftScale',['require','exports','module','./SingularLayout','famous/core/Transform','famous/utilities/Utility'],function (require, exports, module) {var SingularLayout = require('./SingularLayout');
var Transform = require('famous/core/Transform');
var Utility = require('famous/utilities/Utility');


/**
 *  SingularLayout that transitions between items by scaling and opaciting items.
 *  SingularSoftScale extends SingularLayout.
 *
 *  @class SingularSoftScale
 *  @param {Object} [options] Configurable options to set on layout.
 *  @param {Object} [options.transition] Transition used for animations. (Physics [Spring, Snap, Wall]: {method: method, dampingRatio: dampingRatio, period: period} OR EasingCurve: {duration: duration, curve: curve}) 
 *  @param {Number} [options.scaleUpValue] Value to scale item up by. Deafults to 1.3.
 *  @param {Number} [options.scaleDownValue] Value to scale item down by. Defaults to 0.9.
 *  @param {Number} [options.delayRatio] Ratio applied to transition's duration used to calculate the delay on the current item's transform and opacity transition. Defaults to 0.05.
 */
function SingularSoftScale(options) {
  SingularLayout.call(this, options);
}

SingularSoftScale.prototype = Object.create(SingularLayout.prototype);
SingularSoftScale.prototype.constructor = SingularSoftScale;

SingularSoftScale.id = 'SingularSoftScale';

SingularSoftScale.DEFAULT_OPTIONS = {
  transition: {duration: 600, curve: 'easeOut'},
  scaleUpValue: 1.3,
  scaleDownValue: 0.9,
  delayRatio: 0.05
};

/**
 *  Transform to apply on layout to to currently selected item.
 *  @method currentItemTransition
 *  @protected
 *  @param item {Object} Object containing refence to Transitionables linked to items parent and child origin/align/transform and opacity.
 *  @param containerSize {Array|2D}
 *  @param isMovingForward {Boolean} Boolean determining whether the user is moving forward through the items.
 */
SingularSoftScale.prototype.currentItemTransition = function currentTransition(item, containerSize, isMovingForward) {
  var scaleAmount = (isMovingForward) ? 
    this.options.scaleDownValue : 
    this.options.scaleUpValue;

  item.opacity.set(0);
  item.childTransform.set(Transform.scale(scaleAmount, scaleAmount));

  var trans = this.options.transition;
  var duration = trans.duration || trans.period;
  var delay = duration * this.options.delayRatio;
  duration = duration - delay;

  var transition = trans.method ?
  {period: duration, dampingRatio: trans.dampingRatio, method: trans.method} : //Physics transition
  {duration: duration, curve: trans.curve}; //Easing curve
  

  item.opacity.delay(delay, function(){
    item.opacity.set(1, transition);
    item.childTransform.set(Transform.scale(1, 1), transition);
  });
};

/**
 *  Transform to apply on layout to to previously selected item.
 *  @method previousItemTransition
 *  @protected
 *  @param item {Object} Object containing refence to Transitionables linked to items parent and child origin/align/transform and opacity.
 *  @param containerSize {Array|2D}
 *  @param isMovingForward {Boolean} Boolean determining whether the user is moving forward through the items.
 */
SingularSoftScale.prototype.previousItemTransition = function previousItemTransition(item, containerSize, isMovingForward) {
  var scaleAmount = (isMovingForward) ? 
    this.options.scaleUpValue : 
    this.options.scaleDownValue;

  var trans = this.options.transition;
  var opacityTransition = trans.method ?
  {period: trans.period * 0.45, method: trans.method, dampingRatio: trans.dampingRatio} : //Physics transition
  {duration: trans.duration * 0.45, curve: trans.curve}; //Easing curve

  //Set transform
  item.childTransform.set(Transform.scale(scaleAmount, scaleAmount), trans);

  //Set opacity
  item.opacity.set(0, opacityTransition);
};

module.exports = SingularSoftScale;

});

define('dom/IE',['require','exports','module'],function (require, exports, module) {module.exports = navigator.userAgent.indexOf('MSIE') !== -1 || navigator.appVersion.indexOf('Trident/') > 0

});

define('layouts/SingularTwist',['require','exports','module','./SingularLayout','famous/core/Transform','famous/utilities/Utility','../dom/IE'],function (require, exports, module) {var SingularLayout = require('./SingularLayout');
var Transform = require('famous/core/Transform');
var Utility = require('famous/utilities/Utility');
var IsIE = require('../dom/IE');

/**
 *  SingularLayout that transitions between items using a 3D 'flip' animation.
 *  SingularTwist extends SingularLayout.
 *
 *  @class SingularTwist
 *  @param {Object} [options] Configurable options to set on layout.
 *  @param {Object} [options.transition] Transition used for animations. (Physics [Spring, Snap, Wall]: {method: method, dampingRatio: dampingRatio, period: period} OR EasingCurve: {duration: duration, curve: curve}) 
 *  @param {String} [options.direction]  Takes values of 'x' or 'y'. Determines the direction of the transition's flipping animation. Defaults to 'x'.
 *  @param {String} [options.depth] Depth to send the flip forwards or backwards. We recommend a negative value. Defaults to -1500.
 */
function SingularTwist(options) {
  SingularLayout.call(this, options);
  this.options.direction = this.options.direction.toLowerCase();
}

SingularTwist.prototype = Object.create(SingularLayout.prototype);
SingularTwist.prototype.constructor = SingularTwist;

SingularTwist.id = 'SingularTwist';

SingularTwist.DEFAULT_OPTIONS = {
  transition: {
    method: 'spring',
    dampingRatio: 0.85,
    period : 600
  },
  direction: 'x',
  flipDirection: false,
  depth: -1500
};

/**
 *  Transform to apply on layout to to currently selected item.
 *  @method currentItemTransition
 *  @protected
 *  @param item {Object} Object containing refence to Transitionables linked to items parent and child origin/align/transform and opacity.
 *  @param containerSize {Array|2D}
 *  @param isMovingForward {Boolean} Boolean determining whether the user is moving forward through the items.
 */
SingularTwist.prototype.currentItemTransition = function currentTransition(item, containerSize, isMovingForward) {
  item.childTransform.halt();
  item.opacity.set(1);

  if (IsIE) {
    item.item.setProperties({
      zIndex: 1
    });
  }
  var trans;
  if (isMovingForward) { 
    trans = _getTransformFromDirection(this.options.direction, Math.PI * 0.99, this.options.depth);
    item.childTransform.set(trans);
    item.childTransform.set(Transform.identity, this.options.transition);
  } 
  else {
    trans = _getTransformFromDirection(this.options.direction, -Math.PI * 0.99, this.options.depth);
    item.childTransform.set(trans);
    item.childTransform.set(Transform.identity, this.options.transition);
  }
};

/**
 *  Transform to apply on layout to to previously selected item.
 *  @method previousItemTransition
 *  @protected
 *  @param item {Object} Object containing refence to Transitionables linked to items parent and child origin/align/transform and opacity.
 *  @param containerSize {Array|2D}
 *  @param isMovingForward {Boolean} Boolean determining whether the user is moving forward through the items.
 */
SingularTwist.prototype.previousItemTransition = function previousItemTransition(item, containerSize, isMovingForward) {
  item.childTransform.halt();
  item.opacity.set(1);

  if (IsIE) {
    item.item.setProperties({
      zIndex: -1
    });
  }
  var trans;
  if (isMovingForward) { 
    item.childTransform.set(Transform.translate(0, 0, -10));
    trans = _getTransformFromDirection(this.options.direction, -Math.PI * 0.99, this.options.depth - 10);
    item.childTransform.set(trans, this.options.transition);
  }
  else { 
    item.childTransform.set(Transform.translate(0, 0, -10));
    trans = _getTransformFromDirection(this.options.direction, Math.PI * 0.99, this.options.depth - 10);
    item.childTransform.set(trans, this.options.transition);
  }
};

//-------------------Helper function-------------------//

/**
 *  Get transform to apply to item based on direction.
 *  @method _getTransformFromDirection
 *  @protected
 *  @param dir {String} 'x' or 'y'
 *  @param val {Number} Amount to rotate the item by.
 *  @param depth {Number} Amount to push the item back along the z-axis.
 *  @private
 */
function _getTransformFromDirection (dir, val, depth) {
  if (dir === 'x') { return Transform.thenMove(Transform.rotateY(val), [0, 0, depth]); }
  else { return Transform.thenMove(Transform.rotateX(val), [0, 0, depth]); }
}

module.exports = SingularTwist;

});

define('layouts/SingularSlideBehind',['require','exports','module','./SingularLayout','famous/core/Transform','../dom/IE'],function (require, exports, module) {var SingularLayout = require('./SingularLayout');
var Transform = require('famous/core/Transform');
var IsIE = require('../dom/IE');

/**
 *  Transitions between items by doing a 3D 'shuffle' animation.
 *
 *  @class SingularSlideBehind
 *  @param {Object} [options] Configurable options to set on layout.
 *  @param {Number} [options.duration] Duration of the entire transition. Defaults to 600.
 *  @param {Number} [options.rotationAngle] Angle of rotation applied to items during the 'shuffling' animation in radians. Defaults to Math.PI * 0.25.
 */
function SingularSlideBehind(options) {
  SingularLayout.call(this, options);
}

SingularSlideBehind.prototype = Object.create(SingularLayout.prototype);
SingularSlideBehind.prototype.constructor = SingularSlideBehind;

SingularSlideBehind.id = 'SingularSlideBehind';

SingularSlideBehind.DEFAULT_OPTIONS = {
  duration: 600,
  rotationAngle: Math.PI / 4 //Rotate to be applied
};

SingularSlideBehind.FirstCurve = 'easeInOut';
SingularSlideBehind.SecondCurve = 'easeInOut';
SingularSlideBehind.DurationRatio =  1/3; //Ratio between durations of first & second transitions
SingularSlideBehind.OffsetFactor = 1/2; //Portion of image that is offset in animation
SingularSlideBehind.zIndex = -500; //zIndex applied to translates

/**
 *  Transform to apply on layout to to currently selected item.
 *  @method currentItemTransition
 *  @protected
 *  @param item {Object} Object containing refence to Transitionables linked to items parent and child origin/align/transform and opacity.
 *  @param containerSize {Array|2D}
 *  @param isMovingForward {Boolean} Boolean determining whether the user is moving forward through the items.
 */
SingularSlideBehind.prototype.currentItemTransition = function currentTransition(item, containerSize, isMovingForward) {
  var origin;
  var align;
  var rotationDirection;
  var offset;

  if(isMovingForward) {
    origin = [0.5, 1];
    align = [0.5, 1];
    rotationDirection = 1;
    offset = item.size[1] * SingularSlideBehind.OffsetFactor;
  } 
  else {
    origin = [0.5, 0];
    align = [0.5, 0];
    rotationDirection = -1;
    offset = item.size[1] * SingularSlideBehind.OffsetFactor * -1;
  }

  var firstTransLength = this.options.duration * SingularSlideBehind.DurationRatio;
  var secondTransLength = this.options.duration - firstTransLength;
  var transition1 = {
    duration: firstTransLength,
    curve: SingularSlideBehind.FirstCurve
  };

   var transition2 = {
    duration: firstTransLength,
    curve: SingularSlideBehind.SecondCurve
  };

  //Set up and execute hinge animation.
  item.childOrigin.set(origin);
  item.childAlign.set(align);

  //Initialize
  item.opacity.set(1, transition1);
  item.childTransform.set(
    Transform.multiply(
      Transform.translate(0, 0, SingularSlideBehind.zIndex),
      Transform.rotateX(this.options.rotationAngle * rotationDirection)
    )
  );

  //Translate
  item.childTransform.set(Transform.translate(0, offset, SingularSlideBehind.zIndex / 2), 
    transition1,
    function() {
      if (IsIE) { 
        item.item.setProperties({ 
          zIndex: 1
        });
      }
      item.childTransform.set(
          Transform.identity,
          transition2
        );
    }
  );
};

/**
 *  Transform to apply on layout to to previously selected item.
 *  @method previousItemTransition
 *  @protected
 *  @param item {Object} Object containing refence to Transitionables linked to items parent and child origin/align/transform and opacity.
 *  @param containerSize {Array|2D}
 *  @param isMovingForward {Boolean} Boolean determining whether the user is moving forward through the items.
 */
SingularSlideBehind.prototype.previousItemTransition = function previousItemTransition(item, containerSize, isMovingForward) {
  var origin;
  var align;
  var rotationDirection;
  var offset;
  if(isMovingForward) {
    origin = [0.5, 0];
    align = [0.5, 0];
    rotationDirection = -1;
    offset = item.size[1] * SingularSlideBehind.OffsetFactor * -1;
  } 
  else {
    origin = [0.5, 1];
    align = [0.5, 1];
    rotationDirection = 1;
    offset = item.size[1] * SingularSlideBehind.OffsetFactor;
  }

  var firstTransLength = this.options.duration * SingularSlideBehind.DurationRatio;
  var transition1 = {
    duration: firstTransLength,
    curve: SingularSlideBehind.FirstCurve
  };

   var transition2 = {
    duration: this.options.duration - firstTransLength,
    curve: SingularSlideBehind.SecondCurve
  };

  //Set up and execute hinge animation.
  item.childOrigin.set(origin);
  item.childAlign.set(align);

  item.childTransform.set(
    Transform.multiply(
      Transform.translate(0, offset),
      Transform.rotateX(this.options.rotationAngle * rotationDirection)
    ),
    transition1,
    function() {
      if (IsIE) {
        item.item.setProperties({
          zIndex: -1
        });
      }
      item.opacity.set(0, transition2);
      item.childTransform.set(
        Transform.translate(0, 0, SingularSlideBehind.zIndex),
        transition2
      );
    }.bind(this)
  );
};

module.exports = SingularSlideBehind;

});

define('layouts/SingularParallax',['require','exports','module','./SingularLayout','famous/core/Transform'],function (require, exports, module) {var SingularLayout = require('./SingularLayout');
var Transform = require('famous/core/Transform');

/**
 *  Transitions between items using a parallax effect.
 *
 *  @class SingularParallax
 *  @param {Object} [options] Configurable options to set on layout.
 *  @param {Object} [options.transition] Transition used for animations. (Physics [Spring, Snap, Wall]: {method: method, dampingRatio: dampingRatio, period: period} OR EasingCurve: {duration: duration, curve: curve}) 
 *  @param {String} [options.direction]  Takes values of 'x' or 'y'. Determines the direction of the transition's animation. Defaults to 'x'.
 *  @param {String} [options.parallaxRatio] Parallax percentage, from 0 - 1. At zero, it doesn't move at all. At 1, it moves the entire size of the current item. Defaults to 0.2.
 */
function SingularParallax(options) {
  SingularLayout.call(this, options);
  this.axis = this.options.direction === 'x' ? 0 : 1;
}

SingularParallax.prototype = Object.create(SingularLayout.prototype);
SingularParallax.prototype.constructor = SingularParallax;

SingularParallax.id = 'SingularParallax';

SingularParallax.DEFAULT_OPTIONS = {
  transition: { 
    method: 'spring',
    dampingRatio: 0.90,
    period : 550
  },
  direction: 'x',
  parallaxRatio: 0.4
};

/**
 *  Transform to apply on layout to to currently selected item.
 *  @method currentItemTransition
 *  @protected
 *  @param item {Object} Object containing refence to Transitionables linked to items parent and child origin/align/transform and opacity.
 *  @param containerSize {Array|2D}
 *  @param isMovingForward {Boolean} Boolean determining whether the user is moving forward through the items.
 */
SingularParallax.prototype.currentItemTransition = function currentTransition(item, containerSize, isMovingForward) {
  item.opacity.set(1);
  item.parentTransform.halt();
  
  var centeredPos = this.getCenteredPosition(this.controller.index);
  var startPos = [centeredPos[0], centeredPos[1], 1];
  
  if (isMovingForward) { 
    startPos[this.axis] = (item.size[this.axis] + containerSize[this.axis]) * -0.5;
    item.parentTransform.set(Transform.translate(startPos[0], startPos[1], startPos[2]));
    item.parentTransform.set(Transform.translate(centeredPos[0], centeredPos[1]), this.options.transition);
  }
  else { 
    startPos[this.axis] = (item.size[this.axis] + containerSize[this.axis]) * 0.5 + item.size[this.axis];
    item.parentTransform.set(Transform.translate(startPos[0], startPos[1], startPos[2]));
    item.parentTransform.set(Transform.translate(centeredPos[0], centeredPos[1]), this.options.transition);
  }
};

/**
 *  Transform to apply on layout to to previously selected item.
 *  @method previousItemTransition
 *  @protected
 *  @param item {Object} Object containing refence to Transitionables linked to items parent and child origin/align/transform and opacity.
 *  @param containerSize {Array|2D}
 *  @param isMovingForward {Boolean} Boolean determining whether the user is moving forward through the items.
 */
SingularParallax.prototype.previousItemTransition = function previousItemTransition(item, containerSize, isMovingForward) {
  item.opacity.set(1);
  item.parentTransform.halt();

  // Handle opacity
  item.opacity.set(0, this.options.transition);

  // Shift z-index back
  var currentTrans = item.parentTransform.get();
  item.parentTransform.set(Transform.translate(currentTrans[12], currentTrans[13], -2));

  var centeredPos = this.getCenteredPosition(this.controller.lastIndex);
  if (isMovingForward) {
    centeredPos[this.axis] += item.size[this.axis] * this.options.parallaxRatio;
  } 
  else { 
    centeredPos[this.axis] += item.size[this.axis] * -this.options.parallaxRatio;
  }
  item.parentTransform.set(Transform.translate(centeredPos[0], centeredPos[1]), this.options.transition);
};

module.exports = SingularParallax;

});

define('layouts/SingularOpacity',['require','exports','module','./SingularLayout','famous/core/Transform'],function (require, exports, module) {var SingularLayout = require('./SingularLayout');
var Transform      = require('famous/core/Transform');

/**
 *  Switches between items using a basic opacity transition.
 *
 *  @class SingularOpacity
 *  @param {Object} [options] Configurable options to set on layout.
 *  @param {Object} [options.transition] Transition used for animations. (Physics [Spring, Snap, Wall]: {method: method, dampingRatio: dampingRatio, period: period} OR EasingCurve: {duration: duration, curve: curve}) 
 */
function SingularOpacity(options) {
  SingularLayout.call(this, options);
}

SingularOpacity.prototype = Object.create(SingularLayout.prototype);
SingularOpacity.prototype.constructor = SingularOpacity;

SingularOpacity.id = 'SingularOpacity';

SingularOpacity.DEFAULT_OPTIONS = {
  transition: {curve: 'linear', duration: 500}
};

/**
 *  Transform to apply on layout to to currently selected item.
 *  @method currentItemTransition
 *  @protected
 *  @param item {Object} Object containing refence to Transitionables linked to items parent and child origin/align/transform and opacity.
 *  @param containerSize {Array|2D}
 *  @param isMovingForward {Boolean} Boolean determining whether the user is moving forward through the items.
 */
SingularOpacity.prototype.currentItemTransition = function currentTransition(item, containerSize, isMovingForward) {
  item.opacity.set(1, this.options.transition);
}

/**
 *  Transform to apply on layout to to previously selected item.
 *  @method previousItemTransition
 *  @protected
 *  @param item {Object} Object containing refence to Transitionables linked to items parent and child origin/align/transform and opacity.
 *  @param containerSize {Array|2D}
 *  @param isMovingForward {Boolean} Boolean determining whether the user is moving forward through the items.
 */
SingularOpacity.prototype.previousItemTransition = function previousItemTransition(item, containerSize, isMovingForward) {
  item.opacity.set(0, this.options.transition);
}

module.exports = SingularOpacity;

});

define('layouts/SingularSlideIn',['require','exports','module','./SingularLayout','famous/core/Transform'],function (require, exports, module) {var SingularLayout = require('./SingularLayout');
var Transform      = require('famous/core/Transform');

/**
 *  SingularLayout that transitions between items by sliding in the current item and doing a 3D hinge animation on the previous item.
 *  SingularSlideIn extends SingularLayout.
 *
 *  @class SingularSlideIn
 *  @param {Object} [options] Configurable options to set on layout.
 *  @param {Object} [options.transition] Transition used for animations. (Physics [Spring, Snap, Wall]: {method: method, dampingRatio: dampingRatio, period: period} OR EasingCurve: {duration: duration, curve: curve}) 
 *  @param {String} [options.delayRatio] Ratio applied to transition's duration used to calculate the delay on the current item's transition. Defaults to 0.15.
 *  @param {String} [options.direction] Takes values of 'x' or 'y'. Determines the direction of the exiting slide's pivot. Defaults to 'y'.
 */
function SingularSlideIn(options) {
  SingularLayout.call(this, options);
  this.options.direction = this.options.direction.toLowerCase();
}

SingularSlideIn.prototype = Object.create(SingularLayout.prototype);
SingularSlideIn.prototype.constructor = SingularSlideIn;

SingularSlideIn.id = 'SingularSlideIn';

SingularSlideIn.DEFAULT_OPTIONS = {
  transition: {curve: 'easeOut', duration: 600},
  delayRatio: 0.15,
  direction: 'y'
};

/**
 *  Transform to apply on layout to to currently selected item.
 *  @method currentItemTransition
 *  @protected
 *  @param item {Object} Object containing refence to Transitionables linked to items parent and child origin/align/transform and opacity.
 *  @param containerSize {Array|2D}
 *  @param isMovingForward {Boolean} Boolean determining whether the user is moving forward through the items.
 */
SingularSlideIn.prototype.currentItemTransition = function currentTransition(item, containerSize, isMovingForward) {
  //Calculate delay and transition duration
  var trans = this.options.transition;
  var duration = trans.duration || trans.period;
  var delay = duration * this.options.delayRatio;
  duration -= delay;

  //Set duration
  var transition = trans.method ? 
  {period: duration, method: trans.method, dampingRatio: trans.dampingRatio} :
  {duration: duration, curve: trans.curve};

  //Set offset
  var offsetX;
  var offsetY;
  if(isMovingForward) {
    if(this.options.direction === 'x') {
      offsetX = containerSize[0];
      offsetY = 0;
    }
    else {
      offsetX = 0;
      offsetY = containerSize[1] * -1;
    }
    
  }
  else {
    if(this.options.direction === 'x') {
      offsetX = containerSize[0] * -1;
      offsetY = 0;
    }
    else {
      offsetX = 0;
      offsetY = containerSize[1];
    }
  }

  //Initial values before 'in' transition
  item.opacity.set(1);
  item.childTransform.set(Transform.translate(offsetX, offsetY));

  //Delay and then apply Transform.
  item.opacity.delay(delay, function(){
    item.childTransform.set(Transform.translate(0, 0), transition);
  });
};

/**
 *  Transform to apply on layout to to previously selected item.
 *  @method previousItemTransition
 *  @protected
 *  @param item {Object} Object containing refence to Transitionables linked to items parent and child origin/align/transform and opacity.
 *  @param containerSize {Array|2D}
 *  @param isMovingForward {Boolean} Boolean determining whether the user is moving forward through the items.
 */
SingularSlideIn.prototype.previousItemTransition = function previousItemTransition(item, containerSize, isMovingForward) {
  //Calculate pivot points by setting origin/align
  var origin;
  var align;
  var rotationDirection;
  if(isMovingForward) {
    if(this.options.direction === 'x') {
      origin = [0, 0.5];
      align = [0, 0.5];
    }
    else {
      origin = [0.5, 1];
      align = [0.5, 1];
    }
    rotationDirection = 1;
  } 
  else {
    if(this.options.direction === 'x') {
      origin = [1, 0.5];
      align = [1, 0.5];
    }
    else {
      origin = [0.5, 0];
      align = [0.5, 0];
    }
    rotationDirection = -1;
  }

  //Set up and execute hinge animation.
  item.childOrigin.set(origin);
  item.childAlign.set(align);

  if(this.options.direction === 'x') {
    item.childTransform.set(Transform.rotateY(
      Math.PI / 4 * rotationDirection
    ), this.options.transition);
  }
  else {
    item.childTransform.set(Transform.rotateX(
      Math.PI / 3 * rotationDirection
    ), this.options.transition);
  }

  item.opacity.set(0, this.options.transition);
};

module.exports = SingularSlideIn;

});

define('layouts/GridLayout',['require','exports','module','./Layout','famous/core/Transform','famous/transitions/Easing'],function (require, exports, module) {var Layout    = require('./Layout');
var Transform = require('famous/core/Transform');
var Easing    = require('famous/transitions/Easing');

/**
 *  A grid layout that displays multiple items.
 *
 *  @class GridLayout
 *  @param {Object} [options] Configurable options to set on layout.
 *  @param {Array|2D} [options.gridDimensions] Sets the number of items displayed on each page in the grid. First value maps to number of columns, second value maps to number of rows. Defaults to [3, 3].
 *  @param {Array|2D} [options.padding] Padding between items in grid. First value maps to horizontal padding, second value maps to vertical padding. Defaults to [15, 15].
 *  @param {Object} [options.selectedItemTransition] Unique transition applied to the selected item. (Physics [Spring, Snap, Wall]: {method: method, dampingRatio: dampingRatio, period: period} OR EasingCurve: {duration: duration, curve: curve}). 
 *  @param {Object} [options.transition] Transition used for all animations. (Physics [Spring, Snap, Wall]: {method: method, dampingRatio: dampingRatio, period: period} OR EasingCurve: {duration: duration, curve: curve})
 *  @param {Object} [options.delayLength] Total length of delay used to stagger the animation during the transition from a SingularLayout to Grid. Defaults to 600.
 */
function GridLayout(options) {
  Layout.call(this, options);
}

GridLayout.prototype = Object.create(Layout.prototype);
GridLayout.prototype.constructor = GridLayout;

GridLayout.id = 'GridLayout';

GridLayout.DEFAULT_OPTIONS = {
  gridDimensions: [3, 3],
  padding: [15, 15],
  selectedItemTransition: { 
    method: 'spring',
    dampingRatio: 0.65,
    period : 600
  },
  transition: { 
    curve: 'outExpo',
    duration: 800
  },
  delayLength: 600
};

/**
 *  Activate layout.
 *  @method activate
 *  @protected
 */
GridLayout.prototype.activate = function activate() {
  this.controller._eventOutput.emit(
    'paginationChange',
    this.options.gridDimensions[0] * this.options.gridDimensions[1]
  );

  //Reset child transforms/origins/aligns
  this.resetChildProperties();

  //-------------------------------Animate items-------------------------------//
  var itemCount = this.options.gridDimensions[0] * this.options.gridDimensions[1]
  var totalPages = Math.ceil(this.controller.nodes.length / itemCount);
  var currentPage = Math.floor( this.controller.index / itemCount );

  //Calculate indicies of items to display
  var startIndex = currentPage * itemCount;

  //Check for less items on last page.
  var endIndex = (currentPage === totalPages - 1) ? 
    startIndex + (this.controller.nodes.length - currentPage * itemCount) - 1: 
    startIndex + itemCount - 1;

  //Add delays to stagger animations of items on current page.
  this._delayTransitions(startIndex, endIndex);

  //Animate items.
  this._animateItems(startIndex, endIndex);

  this._handleTouchEvents();
  this.activated = true;
}

/**
 *  Layout slides.
 *  @method layout
 *  @protected
 */
GridLayout.prototype.layout = function layout() {
  var transforms = this._getTransforms();
  var trans;
  for(var i = 0; i < this.controller.nodes.length; i++) {
    trans = this.data.parentTransforms[i];
    trans.set(transforms[i].transform, this.options.transition);
    this.data.opacities[i].halt();
    this.data.opacities[i].set(1, this.options.transition);
  }
}

/**
 *  Deactivate layout.
 *  @method deactivate
 *  @protected
 */
GridLayout.prototype.deactivate = function deactivate() {
  this.controller.isLastLayoutSingular = false;
  this._removeTouchEvents();
}

/**
 *  Return render limit for layout.
 *  @method getRenderLimit
 *  @return {Array|2D}
 *  @protected
 */
GridLayout.prototype.getRenderLimit = function getRenderLimit() {
  return [0, this.controller.nodes.length];
}

/**
 *  Handle touch events (e.g., 'update' and 'end).
 *  @method _handleTouchEvents
 *  @protected
 */
GridLayout.prototype._handleTouchEvents = function _handleTouchEvents() {
  this.boundTouchUpdate = function(data) {
    var touchTrans = this.data.touchOffset;
    var touchPos = touchTrans.get();
    touchPos[0] += data.delta[0];
    touchTrans.set([touchPos[0], touchPos[1]]);
  }.bind(this)

  this.boundTouchEnd = function(data){
    var touchTrans  = this.data.touchOffset;
    var touchPos    = touchTrans.get();
    var touchOffset = touchPos[0];
    var containerWidth = this.controller.getSize()[0];

    // Clear touch offset and add back to the parent modifier
    for(var i = 0; i < this.controller.items.length; i++) {
      var parentTrans = this.data.parentTransforms[i];
      var parentPos = parentTrans.translate.get();
      parentTrans.setTranslate([parentPos[0] + touchPos[0], parentPos[1]]);
      
    }
    touchTrans.set([0, 0]);

    if(touchOffset < (containerWidth * -1/5)) {
      this.controller._eventOutput.emit('next');
    } else if(touchOffset > (containerWidth * 1/5)){
      this.controller._eventOutput.emit('previous');
    } else {
      this.layout();
    }

  }.bind(this);


  this._addTouchEvents();
}

/**
 *  Add touch events on sync's 'update' and 'end'
 *  @method _addTouchEvents
 *  @protected
 */
GridLayout.prototype._addTouchEvents = function _addTouchEvents() {
  this.controller.sync.on('update', this.boundTouchUpdate);
  this.controller.sync.on('end', this.boundTouchEnd);
}

/**
 *  Remove reference to touch events.
 *  @method _removeTouchEvents
 *  @protected
 */
GridLayout.prototype._removeTouchEvents = function _removeTouchEvents() {
  this.controller.sync.removeListener('update', this.boundTouchUpdate);
  this.controller.sync.removeListener('end', this.boundTouchEnd);
}

//----------------------------------------------------------------------//
//----------------------------Helper methods----------------------------//
//----------------------------------------------------------------------//

/**
 *  Set delays on items' transitions in order to stagger the animation when switching from a SingularLayout to GridLayout.
 *  @method _delayTransitions
 *  @param startIndex {Number} Index of first item on current page.
 *  @param endIndex {Number} Index of last item on current page.
 *  @private
 */
GridLayout.prototype._delayTransitions = function _delayTransitions(startIndex, endIndex) {
  var forward = this.controller.index;
  var back = (this.controller.index - 1) < startIndex ? undefined : this.controller.index - 1;
  var delayCount = 0;
  var delayTime;
  var trans;

  //Loop in both directions to set delays.
  var itemsToDelay = endIndex - startIndex + 1;
  while (delayCount < itemsToDelay) {
    var denominator = (itemsToDelay - 1) === 0 ? 1 : (itemsToDelay - 1); // Avoid division by 0
    var percentage = delayCount / denominator;
    var easedPercentage = Easing.inOutSine(percentage);
    delayTime = (easedPercentage * this.options.delayLength) + 1;

    //Set delays
    if (forward !== undefined) {
      this._setItemDelay(forward, delayTime);
      forward = (forward + 1) > endIndex ? undefined : forward + 1;
      delayCount++;
    }

    if (back !== undefined) {
      this._setItemDelay(back, delayTime);
      back = (back - 1) < startIndex ? undefined : back - 1;
      delayCount++;
    }
  }
}

/**
 *  Set a delay on an item's transition.
 *  @method _setItemDelay
 *  @param index {Number} Index of item to delay.
 *  @param delayTime {Number} Amount of time to delay the transition by.
 *  @private
 */
GridLayout.prototype._setItemDelay = function _setItemDelay(index, delayTime) {
  trans = this.data.parentTransforms[index];
  trans.rotate.delay(delayTime);
  trans.scale.delay(delayTime);
  trans.translate.delay(delayTime);
  this.data.opacities[index].delay(delayTime);
}

/**
 *  Apply transforms and opacity transitions to items.
 *  @method _animateItems
 *  @param startIndex {Number} Index of first item on current page.
 *  @param endIndex {Number} Index of last item on current page.
 *  @private
 */
GridLayout.prototype._animateItems = function _animateItems(startIndex, endIndex) {;
  //Helper function
  var onCurrentPage = function onCurrentPage (index) {
    return index >= startIndex && index <= endIndex;
  }

  var transforms = this._getTransforms();
  for(var i = 0; i < this.controller.nodes.length; i++) {

    if (onCurrentPage( i )) { 
      if (i === this.controller.index) {
        //Add extra velocity to transition
        var method = this.options.selectedItemTransition.method || 'spring';
        var dampingRatio = this.options.selectedItemTransition.dampingRatio || 0.65;
        var period = this.options.selectedItemTransition.period || 600;

        this.data.parentTransforms[i].set(
          transforms[i].transform, {
            method        : method,
            dampingRatio  : dampingRatio,
            period        : period
          }
        );
      } else {
        this.data.parentTransforms[i].set(
         transforms[i].transform, this.options.transition
        );
      }
    }
    else { 
      if(this.controller.isLastLayoutSingular || this.controller.isLastLayoutSingular === null) {
        this.data.parentTransforms[i].set(transforms[i].transform);
      } else {
        this.data.parentTransforms[i].set(transforms[i].transform, this.options.transition);
      }
    }

    this.data.opacities[i].set(1, this.options.transition);
  }
}

/**
 *  Get transforms needed to place each item in its proper position.
 *  @method _getTransforms
 *  @return transforms {Object}
 *  @private
 */
GridLayout.prototype._getTransforms = function _getTransforms(){
  var getGrid = this._getGridPositions(this.controller.getSize().slice(0), this.options.padding, this.options.gridDimensions);
  var cellSize = getGrid.cellSize;
  var containerSize = this.controller.getSize().slice(0);

  var pageLength = this.options.gridDimensions[0] * this.options.gridDimensions[1]
  var currentPage = Math.floor( this.controller.index / pageLength );

  var transforms = [];
  for (var i = 0; i < this.controller.nodes.length; i++) {
    var gridPos = getGrid.at(i);
    gridPos[0] -= (currentPage * containerSize[0] + currentPage * this.options.padding[0]);
    gridPos[2] = 1; //Reset zIndex

    var size = this.data.sizeCache[i] || this.data.sizeCache[0];
    var maxScale = Math.min(cellSize[0] / size[0], cellSize[1] / size[1]);

    // center items within cell size.
    var aligns = [
      Math.round(cellSize[0] - size[0] * maxScale) * 0.5,
      Math.round(cellSize[1] - size[1] * maxScale) * 0.5
    ];

    transforms.push({
      transform: Transform.thenMove(Transform.scale(maxScale, maxScale), [gridPos[0] + aligns[0], gridPos[1] + aligns[1]]), 
      gridPos: gridPos,
      maxScale: maxScale
    });
  }
  return transforms;
}

/**
 *  Returns a function that calculates an item's position in the grid.
 *  @method _getGridPositions
 *  @param containerSize {Array|2D}
 *  @param padding {Array|2D}
 *  @param gridDimensions {Array|2D}
 *  @return at {Function} Function that returns gridPosition of an item pased on its index.
 *  @private
 */
GridLayout.prototype._getGridPositions = function _getGridPositions (containerSize, padding, gridDimensions) {
  var cellSize = [
    (containerSize[0] - padding[0] * Math.max(gridDimensions[0] - 1, 0)) / gridDimensions[0],
    (containerSize[1] - padding[1] * Math.max(gridDimensions[1] - 1, 0)) / gridDimensions[1]
  ];
  var totalSize = gridDimensions[0] * gridDimensions[1];
  return {
    at: function (i) {
      var page = Math.floor(i / totalSize);
      var column = i % gridDimensions[0];
      var row = Math.floor( (i - page * totalSize) / gridDimensions[0] );
      return [
        column * cellSize[0] + column * padding[0] + page * containerSize[0] + page * padding[0],
        row * cellSize[1] + row * padding[1]
      ];
    },
    cellSize: cellSize
  };
}

module.exports = GridLayout;

});

define('layouts/CoverflowLayout',['require','exports','module','./Layout','../helpers/ObjectHelpers','famous/core/Transform','famous/transitions/Transitionable','../dom/IE'],function (require, exports, module) {var Layout         = require('./Layout');
var ObjectHelpers  = require('../helpers/ObjectHelpers');
var Transform      = require('famous/core/Transform');
var Transitionable = require('famous/transitions/Transitionable');
var IsIE           = require('../dom/IE');

/**
 *  A 2d circular layout that can occur in any two dimensions. (x&y, x&z, z&y)
 *
 *  @class CoverflowLayout
 *  @param {Object} [options] Configurable options to set on the circle.
 *  @param {Object} [options.transition] Transition used for animations. (Physics [Spring, Snap, Wall]: {method: method, dampingRatio: dampingRatio, period: period} OR EasingCurve: {duration: duration, curve: curve}). Defaults to {curve: 'outExpo', duration: 1000}.
 *  @param {Number} [options.radiusPercent] Width of the circle in relation to the entire width of the screen. Defaults to 0.5.
 *  @param {String} [options.dimension1] First dimension of the coverflow. 'x', 'y', or 'z' are valid entries and should not be the same as dimension2. Defaults to 'x'.
 *  @param {String} [options.dimension2] Second dimension of the coverflow. 'x', 'y', or 'z' are valid entries and should not be the same as dimension1. Defaults to 'z'.
 */
function CoverflowLayout(options) {
  Layout.call(this, options);
  this._touchOffset = 0;

  this.boundTouchUpdate = this._onSyncUpdate.bind(this);
  this.boundTouchEnd = this._onSyncEnd.bind(this);
  this.step;
}

CoverflowLayout.prototype = Object.create(Layout.prototype);
CoverflowLayout.prototype.constructor = CoverflowLayout;

CoverflowLayout.id = 'CoverflowLayout';

CoverflowLayout.DEFAULT_OPTIONS = {
  transition: {curve: 'outExpo', duration: 1000 },
  radiusPercent: 0.5,
  dimension1: 'x',
  dimension2: 'z'
};

/*
 * @static DIRECTION
 */
var DIRECTION = {
  'x': 0,
  'y': 1,
  'z': 2
}

/*
 *  Lookup for third dimension.
 *  If you've chosen:
 *  X & Y: return Z
 *  X & Z: return Y
 *  Y & Z: return X
 *  @static
 */
var UNUSED_DIRECTION = {
  1: 'z',
  2: 'y',
  3: 'x'
}

/**
 *  Activate layout.
 *  @protected
 *  @method activate
 */
CoverflowLayout.prototype.activate = function activate() {
  this.controller._eventOutput.emit('paginationChange', 1);

  this._bindSyncEvents();

  //Reset child transforms/origins/aligns
  this.resetChildProperties();

  this.layout();
  this.activated = true;
}

CoverflowLayout.prototype._getRadius = function (containerSize) {
  if (!containerSize) containerSize = this.controller.getSize()[0];
  return containerSize * this.options.radiusPercent;
}

/**
 *  Layout slides.
 *  @method layout
 *  @protected
 */
CoverflowLayout.prototype.layout = function layout(preventAnimation) {
  var containerSize = this.controller.getSize();
  var indexSize     = this.controller.items[this.controller.index].getSize();
  var nodeLength    = this.controller.nodes.length;
  this.step         = Math.PI * 2 / nodeLength;
  
  var circle = this._getParametricCircle({
    x1: containerSize[0] * 0.5,
    y1: containerSize[0] * -0.5,
    radius: this._getRadius(containerSize[0])
  });

  var centeredPosition = [
    (containerSize[0] - indexSize[0]) * 0.5,
    (containerSize[1] - indexSize[1]) * 0.5,
    0
  ];

  var startingTransform = [];
  startingTransform[0] = 
    (this.options.dimension1 === 'x' || this.options.dimension2 === 'x') ? 0 : centeredPosition[0];
  startingTransform[1] = 
    (this.options.dimension1 === 'y' || this.options.dimension2 === 'y') ? 0 : centeredPosition[1];
  startingTransform[2] = 0;

  //------------Set Transition------------//
  if (IsIE) var zIndices = [];
  for (var i = 0; i < nodeLength; i++) {
    var index = this.controller._sanitizeIndex(this.controller.index + i);
    var trans = this.data.parentTransforms[index];
    var opacity = this.data.opacities[index];
    
    var circlePoints = circle(this.step * i + Math.PI * 0.5 + this._touchOffset);
    var translate = startingTransform.slice();

    translate[DIRECTION[this.options.dimension1]] += (containerSize[0] - circlePoints[0] - indexSize[0] * 0.5);
    translate[DIRECTION[this.options.dimension2]] += circlePoints[1];
    if (IsIE) zIndices.push(translate[2]);

    if (!preventAnimation) { 
      trans.set(
        Transform.translate(translate[0], translate[1], translate[2]),
        this.options.transition
      );
    } else { 
      trans.set(Transform.translate(translate[0], translate[1], translate[2]));
    }
  };

  if (IsIE && !preventAnimation) this.forceZIndex(zIndices);
  
  if (!preventAnimation) trans.halt();
  trans.set(
    Transform.translate(translate[0], translate[1], translate[2]),
    this.options.transition
  );

  //------------Set Opacity------------//
  var opacityDuration = this.options.transition.duration || this.options.transition.period;
  opacityDuration *= 0.25;

  var opacityCurve = preventAnimation ?
    undefined :
    {
      curve: 'linear',
      duration: opacityDuration
    };

  for (var i = 0; i < this.controller.renderLimit[0]; i++) {
    var opacityTransitionable = this.data.opacities[this.controller._sanitizeIndex(this.controller.index + 1 + i)];
    if (opacityTransitionable) { 
      opacityTransitionable.halt();
      opacityTransitionable.set(1 - (i / this.controller.renderLimit[0]), opacityCurve);
    }
  };

  for (var i = 0; i < this.controller.renderLimit[1]; i++) {
    var opacityTransitionable = this.data.opacities[this.controller._sanitizeIndex(this.controller.index - 1 - i)];
    if (opacityTransitionable) { 
      opacityTransitionable.halt();
      opacityTransitionable.set(1 - (i / this.controller.renderLimit[1]), opacityCurve);
    }
  };
  this.data.opacities[this.controller.index].halt();
  this.data.opacities[this.controller.index].set(1, opacityCurve);
} 

/**
 *  Deactivate layout.
 *  @method deactivate
 *  @protected
 *  
 */
CoverflowLayout.prototype.deactivate = function deactivate() {
  this.controller.isLastLayoutSingular = false;
  if (IsIE) {
    for (var i = 0; i < this.controller.nodes.length; i++) {
      this.controller.items[i].setProperties({
        'zIndex': ''
      });
    }
  }
  this._unbindSyncEvents();
}

/**
 *  Return render limit for layout.
 *  @method getRenderLimit
 *  @protected
 *  @return {Array|2D}
 */
CoverflowLayout.prototype.getRenderLimit = function getRenderLimit() {
  return [Math.min(10, Math.ceil(this.controller.nodes.length * 0.5)),
          Math.min(10, Math.ceil(this.controller.nodes.length * 0.5))];
}

/**
 *  For IE only, force correct zIndexing.
 *  @method forceZIndex
 *  @protected
 */
CoverflowLayout.prototype.forceZIndex = function (indices) {
  for (var i = 0; i < this.controller.nodes.length; i++) {
    var index = this.controller._sanitizeIndex(this.controller.index + i);
    this.controller.items[index].setProperties({
      'zIndex' : Math.round(indices[i])
    });
  };
}

/**
 *  Setup sync event listeners
 *  @method _bindSyncEvents
 *  @protected
 */
CoverflowLayout.prototype._bindSyncEvents = function () {
  this.controller.sync.on('update', this.boundTouchUpdate);
  this.controller.sync.on('end', this.boundTouchEnd);
}

/**
 *  Remove sync event listeners
 *  @method _unbindSyncEvents
 *  @protected
 */
CoverflowLayout.prototype._unbindSyncEvents = function (e) {
  this.controller.sync.removeListener('update', this.boundTouchUpdate);
  this.controller.sync.removeListener('end', this.boundTouchEnd);
}

/**
 *  Add additional angles to the parametric circle based on the x differential from the swipe.
 *  angle T = acos ( touchOffset / radius )
 *
 *  @method _onSyncUpdate
 *  @protected
 */
CoverflowLayout.prototype._onSyncUpdate = function (e) {
  var pos = e.position[0] / this._getRadius();
  this._touchOffset = Math.atan(pos);
  if (this._touchOffset > 0.5) {
      this._touchOffset += Math.log(this._touchOffset + 0.5);
  } else if (this._touchOffset < -0.5) {
      this._touchOffset -= Math.log(-this._touchOffset + 0.5);
  }
  this.layout(true);
}

/**
 *  Add velcoity to the angle, and calculate the next index to set the carousel to.
 *  @method _onSyncEnd
 *  @protected
 */
CoverflowLayout.prototype._onSyncEnd = function (e) {
  var vel = e.velocity[0] * 0.1;
  var step = Math.round((-this._touchOffset - vel) / this.step);
  this._touchOffset = 0;
  var newIndex = this.controller._sanitizeIndex(this.controller.index + step) 
  if (newIndex == this.controller.index) {
      this.layout();
  } else {
    this.controller._eventOutput.emit('set', newIndex);
  }
}

//----------------------------Helper methods----------------------------//

/*
 *  Get parametric circle.
 *  @method _getParametricCircle
 *  @protected
 *  @param _options {Object} configurable options to set on the circle.
 *  @param [_options.x1] {number} x offset
 *  @param [_options.y1] {number} y offset
 *  @param [_options.radius] {number} radius of the circle.
 *  @returns {Function} Call with each step of the circle.
 */
CoverflowLayout.prototype._getParametricCircle = function getParametricCircle ( _options ) {
  var options = {
    x1: 0,
    y1: 0,
    radius: 20
  }
  ObjectHelpers.extend(options, _options);
  return function ( t ) {
    return [
      options.x1 + options.radius * Math.cos(t),
      options.y1 + options.radius * Math.sin(t),
    ]
  }
}

module.exports = CoverflowLayout;

});

define('layouts/SequentialLayout',['require','exports','module','./Layout','famous/core/Transform','famous/transitions/Easing'],function (require, exports, module) {var Layout    = require('./Layout');
var Transform = require('famous/core/Transform');
var Easing    = require('famous/transitions/Easing');

/**
 *  A linear layout that displays items in sequential order (horizontally or vertically).
 *  The selected item will appear flush againt the left (or top) of the carousel container.
 *
 *  @class SequentialLayout
 *  @param {Object} [options] Configurable options to set on layout.
 *  @param {Object} [options.transition] Transition used for animations. (Physics [Spring, Snap, Wall]: {method: method, dampingRatio: dampingRatio, period: period} OR EasingCurve: {duration: duration, curve: curve})
 *  @param {Object} [options.touchEndTransition] Transition used for animations that are triggered by touch (i.e., dragging) events. (Physics [Spring, Snap, Wall]: {method: method, dampingRatio: dampingRatio, period: period} OR EasingCurve: {duration: duration, curve: curve})
 *  @param {Array|2D} [options.padding] x & y padding added to the size of each item.
 *  @param {String} [options.direction]  Takes values of 'x' or 'y'. Determines the direction of the layout.
 */
function SequentialLayout(options) {
  Layout.call(this, options);

  this.applyPreAnimationOffset = []; // Array of Booleans indicating whether to translate item before animation
  this.useTouchEndTransition = false; // Set to true on touch 'end' event
}

SequentialLayout.prototype = Object.create(Layout.prototype);
SequentialLayout.prototype.constructor = SequentialLayout;

SequentialLayout.id = 'SequentialLayout';

SequentialLayout.DEFAULT_OPTIONS = {
  transition: {
    duration: 800,
    curve: 'outExpo'
  },
  touchEndTransition: {
    duration: 250,
    curve: 'outExpo'
  },
  padding: [10, 0],
  direction: 'x'
};

/**
 *  Activate layout.
 *  @method activate
 *  @protected
 */
SequentialLayout.prototype.activate = function activate() {
  this.controller._eventOutput.emit('paginationChange', 1);

  // Reset child transforms/origins/aligns
  this.resetChildProperties();

  // Reset opacity
  for(var i = 0; i < this.controller.nodes.length; i++) {
    this.data.opacities[i].set(1, this.options.transition);
  }

  this.containerSize = this.controller.getSize();
  this.layout();
  this._handleTouchEvents();
  this.activated = true;
}

/**
 *  Layout slides.
 *  @method layout
 *  @protected
 */
SequentialLayout.prototype.layout = function layout() {
  this.direction         = (this.options.direction === 'y') ? 1 : 0;
  this.oppositeDirection = (this.direction === 1) ? 0 : 1;
  this.transforms = []; // Store transforms to be applied to items
  this.backwardIndex = 1;
  this.frontIndex; // Index of item at front of layout
  this.additionalOffset = 0;

  var index;
  var currentIndex = this.controller.index;
  var lastIndex = this.controller.nodes.length - 1;
  var processedIndicies = []; // Store reference to lowest index processed in reverse loop
  var wasItemAdded; // Boolean
  var forwardSize = [0, 0];
  var backwardsSize = [0, 0];
  var isLayoutLargerThanContainer = false;

  // Layout current item and items in front using positive translation
  for(var i = 0; i < this.controller.renderLimit[1]; i++) {
    if (processedIndicies.length >= this.controller.items.length) break;
    wasItemAdded = this._addItemInFront(i, currentIndex, forwardSize, processedIndicies);
    if (wasItemAdded) {
      // Check if items in front take up entire container
      if (this.containerSize[this.direction] < forwardSize[this.direction]) {
        // Start to add items behind current index
        isLayoutLargerThanContainer = true;
        this._addItemBehind(currentIndex, backwardsSize, processedIndicies);
      }
    } else {
      break;
    }
  }

  // Layout items behind the current index using negative translation
  for(var i = this.backwardIndex; i <= this.controller.renderLimit[0]; i++) {
    wasItemAdded = this._addItemBehind(currentIndex, backwardsSize, processedIndicies);
    if (!wasItemAdded) break;
  }

  // Apply extra offset if to ensure edge is flush against container.
  if (isLayoutLargerThanContainer) this._applyAdditionalOffset();

  // Apply transforms
  this._applyTransforms();
}

/**
 *  Deactivate layout.
 *  @method deactivate
 *  @protected
 */
SequentialLayout.prototype.deactivate = function deactivate() {
  this.isLastLayoutSingular = false;
  this._removeTouchEvents();
}

/**
 *  Return render limit for layout.
 *  @method getRenderLimit
 *  @protected
 *  @return {Array|2D}
 */
SequentialLayout.prototype.getRenderLimit = function getRenderLimit() {
  return [5, Math.min(10, this.controller.nodes.length)];
}

/**
 *  Handle touch events (e.g., 'update' and 'end).
 *  @method _handleTouchEvents
 *  @protected
 */
SequentialLayout.prototype._handleTouchEvents = function _handleTouchEvents() {
  var direction = (this.options.direction === 'y') ? 1 : 0;

  this.boundTouchUpdate = function(data) {
    var touchTrans = this.data.touchOffset;
    var touchPos = touchTrans.get();
    touchPos[direction] += data.delta[direction];
    touchTrans.set([touchPos[0], touchPos[1]]);
  }.bind(this)

  this.boundTouchEnd = function(data){
    // Clear touch offset and add back to the parent modifier
    var touchTrans  = this.data.touchOffset;
    var touchPos    = touchTrans.get();
    var touchOffset = touchPos[direction];

    for(var i = 0; i < this.controller.items.length; i++) {
      var parentTrans = this.data.parentTransforms[i];
      var parentPos = parentTrans.translate.get();
      parentTrans.setTranslate([parentPos[0] + touchPos[0], parentPos[1] + touchPos[1]])
    }
    touchTrans.set([0, 0]);

    // Trigger selection changed based on closest item
    var iterator = touchOffset > 0 ? -1 : 1;
    var index = this.controller.index;
    touchOffset = Math.abs(touchOffset);
    while(touchOffset > 0) {
      touchOffset -= this.data.sizeCache[index][direction];
      index = this.controller._sanitizeIndex(index + iterator);
    }
    this.useTouchEndTransition = true;
    this.controller._eventOutput.emit('set', index);

  }.bind(this);

  this._addTouchEvents();
}

/**
 *  Add touch events on sync's 'update' and 'end'
 *  @method _addTouchEvents
 *  @protected
 */
SequentialLayout.prototype._addTouchEvents = function _addTouchEvents() {
  this.controller.sync.on('update', this.boundTouchUpdate);
  this.controller.sync.on('end', this.boundTouchEnd);
}

/**
 *  Remove reference to touch events.
 *  @method _removeTouchEvents
 *  @protected
 */
SequentialLayout.prototype._removeTouchEvents = function _removeTouchEvents() {
  this.controller.sync.removeListener('update', this.boundTouchUpdate);
  this.controller.sync.removeListener('end', this.boundTouchEnd);
}

//----------------------------------------------------------------------//
//----------------------------Helper methods----------------------------//
//----------------------------------------------------------------------//
/**
 *  Caclulates the transform to be applied to an item in front of the current index.
 *  @method _addItemInFront
 *  @protected
 *  @param index {Number} Index of the item whose transform is being calculated.
 *  @param currentIndex {Number} Index of currently selected item.
 *  @param forwardSize {Array|2D} Total size of transform to be applied to items in front of currrent index.
 *  @param processIndicies {Array|2D} Indicies of items whose transforms have already been calculated.
 *  @return {Boolean} Returns true/false based on if transform was calculated. 
 */
SequentialLayout.prototype._addItemInFront = function _addItemInFront(index, currentIndex, forwardSize, processedIndicies) {
  index = this.frontIndex = this.controller._sanitizeIndex(currentIndex + index);

  if (processedIndicies.indexOf(index) !== -1) return false; // Prevent processing item twice.
  if (this.controller.options.loop === true || index >= currentIndex) {
    this.transforms[index] = this._getTransform(index, forwardSize, this.oppositeDirection);
    forwardSize[this.direction] += this.data.sizeCache[index][this.direction] + this.options.padding[this.direction];
    processedIndicies.push(index);
    return true;
  } else {
    return false;
  }
}

/**
 *  Caclulates the transform to be applied to an item behind of the current index.
 *  @method _addItemBehind
 *  @protected
 *  @param currentIndex {Number} Index of currently selected item.
 *  @param backwardsSize {Array|2D} Total size of transform to be applied to items behind currrent index.
 *  @param processIndicies {Array|2D} Indicies of items whose transforms have already been calculated.
 *  @return {Boolean} Returns true/false based on if transform was calculated. 
 */
SequentialLayout.prototype._addItemBehind = function _addItemBehind(currentIndex, backwardsSize, processedIndicies) {
  index = currentIndex - this.backwardIndex;
  this.backwardIndex++;
  if (!this.controller.options['loop'] && index < 0) {
    return false;
  }
  index = this.controller._sanitizeIndex(index);
  if (processedIndicies.indexOf(index) !== -1 || !this.data.sizeCache[index]) {
    return false; // Prevent processing item twice.
  }

  backwardsSize[this.direction] -= this.data.sizeCache[index][this.direction] + this.options.padding[this.direction];
  this.transforms[index] = this._getTransform(index, backwardsSize, this.oppositeDirection);
  processedIndicies.push(index);
  return true;
}

/**
 *  Applies an additional offset to ensure that last item is flush against the edge of carousel.
 *  @method _applyAdditionalOffset
 *  @protected
 */
SequentialLayout.prototype._applyAdditionalOffset = function _applyAdditionalOffset() {
  if(!this.controller.options.loop) {
    if(this.transforms[lastIndex] && this.data.sizeCache[lastIndex]) {
      var lastItemOffset = (this.direction === 0) ? this.transforms[lastIndex][12] : this.transforms[lastIndex][13];
      if(lastItemOffset >= 0) {
        var edgePosition = lastItemOffset + this.data.sizeCache[this.frontIndex][this.direction];

        if(edgePosition < this.containerSize[this.direction]) {
          this.additionalOffset = this.containerSize[this.direction] - edgePosition;
        }
      }
    }
  }
}

/**
 *  Animates the items based on the transforms calculated in _addItemInFront and _addItemBehind
 *  @method _applyTransforms
 *  @protected
 */
SequentialLayout.prototype._applyTransforms = function _applyTransforms() {
  // Set transition (apply special transition touch end)
  var transition = this.options.transition;
  if(this.useTouchEndTransition) {
    transition = this.options.touchEndTransition;
    this.useTouchEndTransition = false;
  }

  // Apply transforms
  for(var i = 0; i < this.controller.nodes.length; i++) {
    if(this.transforms[i]) {
      var orientaion = (this.direction === 0) ? 12 : 13; //X or Y translation

      // Check for item 'teleporting' (e.g., moving from behind current index to in front due to looping)
      var currentOffset = this.data.parentTransforms[i].get()[orientaion];
      var futureOffset = this.transforms[i][orientaion];
      var offsetChange = Math.abs(currentOffset - futureOffset);

      // Position item before animating in
      if(this.applyPreAnimationOffset[i] || offsetChange > this.containerSize[this.direction] * 2) {
      // if(this.applyPreAnimationOffset[i]) {
        var itemOffset = this.transforms[i][orientaion];
        var offsetDirection = (0 > itemOffset) ? -1 : 1;
        var centeredPos = this._getCenteredPosition(i, this.oppositeDirection);
        var offscreenTranslation = [];
        offscreenTranslation[this.direction] = this.containerSize[this.direction] * offsetDirection;
        offscreenTranslation[this.oppositeDirection] = centeredPos[this.oppositeDirection];

        this.data.parentTransforms[i].set(
          Transform.translate(offscreenTranslation[0], offscreenTranslation[1])
        );
        this.applyPreAnimationOffset[i] = false;
      }

      // Add additional offset to handle edge case.
      this.transforms[i][orientaion] += this.additionalOffset;

      //Animate items
      this.data.parentTransforms[i].set(this.transforms[i], transition);
      this.data.opacities[i].set(1, transition);

    } else {
      // Translate item out of view port & hide item
      this.data.parentTransforms[i].set(
        Transform.translate(this.containerSize[0], this.containerSize[1])
      );
      this.data.opacities[i].set(0);
      this.applyPreAnimationOffset[i] = true;
    }
  }
}

/**
 *  Returns the centered position of an item based on its size and direction of the layout.
 *  (If the layout is horizontal, the item will be centered vertically and vice versa.)
 *  @method _getCenteredPosition
 *  @protected
 *  @param index {Number} Index of the item to be cenetered
 *  @param axis {Number} Axis along which the item should be centered. Valid values are 0 or 1.
 *  @return {Array|2D}
 */
SequentialLayout.prototype._getCenteredPosition = function _getCenteredPosition(index, axis) {
  if(this.data.sizeCache[index] === undefined) return [0, 0];

  var center = [0, 0];
  center[axis] = (this.containerSize[axis] - this.data.sizeCache[index][axis]) * 0.5;
  return center;
}

/**
 *  Get the Transform to be applied to an item to place it in its proper position.
 *  @method _getTransform
 *  @protected
 *  @param index {Number} Index of the item to be cenetered
 *  @param layoutSize {Array|2D} Size of the layout.
 *  @param axis {Number} Axis along which the item should be centered. Valid values are 0 or 1.
 *  @return {Array|2D}
 */
SequentialLayout.prototype._getTransform = function _getTransform(index, layoutSize, axis) {
  var centered = this._getCenteredPosition(index, axis);
  return Transform.translate(layoutSize[0] + centered[0], layoutSize[1] + centered[1]);
}

module.exports = SequentialLayout;

});

define('layouts/LayoutFactory',['require','exports','module','./SingularSoftScale','./SingularTwist','./SingularSlideBehind','./SingularParallax','./SingularOpacity','./SingularSlideIn','./GridLayout','./CoverflowLayout','./SequentialLayout'],function (require, exports, module) {var SingularSoftScale   = require('./SingularSoftScale');
var SingularTwist       = require('./SingularTwist');
var SingularSlideBehind = require('./SingularSlideBehind');
var SingularParallax    = require('./SingularParallax');
var SingularOpacity     = require('./SingularOpacity');
var SingularSlideIn     = require('./SingularSlideIn');

var GridLayout          = require('./GridLayout');
var CoverflowLayout     = require('./CoverflowLayout');
var SequentialLayout    = require('./SequentialLayout');

var LayoutFactory = {};

//Ensure that Layout is invoked as a Constructor
LayoutFactory.wrap = function(constructor) {
  function wrapper(obj){
    if(!(obj instanceof constructor)) {
      return new constructor(obj);
    } else {
      return obj;
    }
  }
  wrapper.id = constructor.id;
  return wrapper;
}

LayoutFactory.SingularSoftScale   = LayoutFactory.wrap(SingularSoftScale);
LayoutFactory.SingularTwist       = LayoutFactory.wrap(SingularTwist);
LayoutFactory.SingularSlideBehind = LayoutFactory.wrap(SingularSlideBehind);
LayoutFactory.SingularParallax    = LayoutFactory.wrap(SingularParallax);
LayoutFactory.SingularOpacity     = LayoutFactory.wrap(SingularOpacity);
LayoutFactory.SingularSlideIn     = LayoutFactory.wrap(SingularSlideIn);
LayoutFactory.GridLayout          = LayoutFactory.wrap(GridLayout);
LayoutFactory.CoverflowLayout     = LayoutFactory.wrap(CoverflowLayout);
LayoutFactory.SequentialLayout    = LayoutFactory.wrap(SequentialLayout);

module.exports = LayoutFactory;

});

define('layouts/LayoutController',['require','exports','module','famous/utilities/Timer','famous/core/Engine','famous/core/Transform','famous/core/RenderNode','famous/core/Modifier','famous/surfaces/ContainerSurface','famous/transitions/TransitionableTransform','famous/transitions/Transitionable','./LayoutFactory','../constructors/SizeAwareView','../events/EventHelpers'],function (require, exports, module) {var Timer                   = require('famous/utilities/Timer');
var Engine                  = require('famous/core/Engine');
var Transform               = require('famous/core/Transform');
var RenderNode              = require('famous/core/RenderNode');
var Modifier                = require('famous/core/Modifier');
var ContainerSurface        = require('famous/surfaces/ContainerSurface');
var TransitionableTransform = require('famous/transitions/TransitionableTransform');
var Transitionable          = require('famous/transitions/Transitionable');
var LayoutFactory           = require('./LayoutFactory');
var SizeAwareView           = require('../constructors/SizeAwareView');
var EventHelpers            = require('../events/EventHelpers');

/**
 *  A class that swaps layouts and sets up the render tree
 *  for layouts to manipulate.
 *
 *  @class LayoutController
 *  @protected
 */
function LayoutController (options) {
  SizeAwareView.apply(this, arguments);

  this.items;
  this.container;
  this.index;
  this.lastIndex;
  this._activeLayout;
  this.renderLimit = [1, 4];
  this.isLastLayoutSingular = null;

  this.nodes = [];
  this.data = {
    opacities: [],
    
    parentTransforms: [],
    parentOrigins: [],
    parentAligns: [],
    parentSizes: [],

    childTransforms: [],
    childOrigins: [],
    childAligns: [],

    touchOffset: new Transitionable([0,0]),

    sizeCache: [],
    sizeCacheFull: false
  }

  this._boundLayout = this._layout.bind(this);
  this._boundActivate = this._activate.bind(this);

  this.sync = options['sync']; // Used in Layouts

  this._init();
}

LayoutController.prototype = Object.create(SizeAwareView.prototype);
LayoutController.prototype.constructor = LayoutController;

LayoutController.DEFAULT_OPTIONS = {
  'responsiveSizing' : false,
  'classes' : [],
  'loop': undefined,
  'properties': { 
    'overflow' : 'hidden',
    'zIndex' : 1
  },
  'perspective': 1000
}

// PUBLIC API METHODS

/**
 *  Set the size of the parent container.
 *  @method setSize
 */
LayoutController.prototype.setSize = function (size) {
  this.container.setSize(size);

  // Wait 2 frame to register updated container size
  Timer.after(function(){
    if (this.options['responsiveSizing']) {
      this.data.sizeCache = new Array(this.nodes.length);
      this.data.sizeCacheFull = false;
      this._updateSizeCache(true);

      // Call Layout on activated, non-Singular Layouts
      if (this._activeLayout.id.indexOf('Singular') === -1 && this._activeLayout.activated) {
        this._activeLayout.layout();
      }
    } else {
      this._recenter();
    }
  }.bind(this), 2);
  
}

/**
 *  @method getSize
 *  @returns {Array} Size array in pixels.
 */
LayoutController.prototype.getSize = function() {
  return this.container.getSize();
};


/**
 *  @method setItems
 */
LayoutController.prototype.setItems = function (items) {
  this.items = items;
  this._reset();
  this._createItems();
  this.data.sizeCache = new Array(items.length);
  this.data.sizeCacheFull = false;
}

/**
 *  @method setIndex
 */
LayoutController.prototype.setIndex = function (index, triggerAnimation) {
  this.lastIndex = this.index;
  this.index = index;
  this._updateRenderedIndices();
  if(triggerAnimation) this.layout();
}

/**
 *  Get the active layout
 *  @method getLayout
 */
LayoutController.prototype.getLength = function() {
  return Math.min(this.index + this.renderLimit[0] + this.renderLimit[1], this.nodes.length);
}

/**
 *  @method setRenderLimit
 *  @param distanceFromIndices {Array} Two dimensional array, first parameter 
 *  is the number of items before the index that will be rendered, 
 *  and the second marks the items after the current index that will be rendered.
 */
LayoutController.prototype.setRenderLimit = function (distanceFromIndices) {
  if (!distanceFromIndices instanceof Array) { 
    this.renderLimit = [0, distanceFromIndices];
  }
  else { 
    this.renderLimit = distanceFromIndices;
  }
  this._updateRenderedIndices();
}

/**
 *  Get the active layout
 *  @method getLayout
 */
LayoutController.prototype.getLayout = function() {
  return this._activeLayout;
};


/**
 *  @method setLayout
 */
LayoutController.prototype.setLayout = function( layoutDefinition ) {
  if (layoutDefinition instanceof Function) layoutDefinition = new layoutDefinition({});
  if (this._activeLayout) this._activeLayout.deactivate();
  this._activeLayout = layoutDefinition;
  this._activeLayout.setController(this);

  var newLimit = this._activeLayout.getRenderLimit();
  if (newLimit) {
    this.setRenderLimit(newLimit);
  } else {
    this._updateRenderedIndices();
  }
  this._safeActivate();
}

/**
 * Stops the animations
 *
 * @method halt
 */
LayoutController.prototype.halt = function halt() {
  for (var i = 0; i < this.nodes.length; i++) {
    this.data.childOrigins[i].halt();
    this.data.childAligns[i].halt();
    this.data.childTransforms[i].halt();

    this.data.parentOrigins[i].halt();
    this.data.parentAligns[i].halt();
    this.data.parentTransforms[i].halt();
    this.data.opacities[i].halt();
  };
}

// PROTECTED METHODS
LayoutController.prototype._init = function () {
  this._createContainer();
}

/**
 *  Delayed for four frames. 
 *    Gives items time to be rendered into the dom, 
 *    have their size read, one frame for prerender, and an extra 
 *    frame for saftey. 
 *  Layout the items after a frame queue of 4.
 *  @method layout
 *  @protected
 */
LayoutController.prototype.layout = function () {
  if (this._layoutQueue) this._layoutQueue();
  else { 
    this._layoutQueue = EventHelpers.frameQueue(this._boundLayout, 4);
  }
}

/**
 *  Activate the new items after a frame queue of 4.
 *    Gives items time to be rendered into the dom, 
 *    have their size read, one frame for prerender, and an extra 
 *    frame for saftey. 
 *  @method _safeActivate
 *  @protected
 */
LayoutController.prototype._safeActivate = function () {
  if (this._activateQueue) this._activateQueue();
  else { 
    this._activateQueue = EventHelpers.frameQueue(this._boundActivate, 4);
  }
}

LayoutController.prototype._activate = function () {
  this._activateQueue = undefined;
  this._updateSizeCache();
  this.halt();
  this._activeLayout.activate(); 
}

/**
 * Combine previously rendered with future rendered items, without
 * duplicates.
 *
 * @method _updateRenderedIndices
 * @protected
 */
LayoutController.prototype._updateRenderedIndices = function () {
  var previouslyRendered = this._previousRender ? this._previousRender : [];
  this.futureIndices = this._calculateFutureIndices();

  this._toRender = [];
  for (var i = 0; i < previouslyRendered.length; i++) {
    this._toRender.push(previouslyRendered[i]);
  };

  for (var i = 0; i < this.futureIndices.length; i++) {
    if (this._toRender.indexOf(this.futureIndices[i]) < 0) {
      this._toRender.push(this.futureIndices[i]);
    }
  };
  this._previousRender = this.futureIndices;
  this._toRender.sort(function (a,b) {
    return a - b;
  });
}

/**
 *  Given the new layout's renderLimit, calculate what items
 *  will be rendered. 
 *
 *  @method _calculateFutureIndices
 *  @returns {Array} Array of ids to render
 *  @protected
 */
LayoutController.prototype._calculateFutureIndices = function () {
  var toRender = [];
  var nodeLength = this.nodes.length;
  var maxNegative = 0;
  var totalLimit = this.renderLimit[0] + this.renderLimit[1];
  for (var i = 0; i < totalLimit; i++) {
    if (i == nodeLength) break;
    var index = this.index - this.renderLimit[0] + i; // nodes behind renderlimit
    if (index < 0) {  // loop around
      var currIndex = index % nodeLength; 
      currIndex = currIndex == 0 ? currIndex : currIndex + nodeLength;
      if (currIndex == nodeLength) continue;
      toRender.push(currIndex);
      maxNegative = currIndex > maxNegative ? currIndex : maxNegative;
    }
    else if (maxNegative == 0 || index < maxNegative) {
      toRender.push(index % nodeLength);
    }
  }; 
  return toRender;
}

/**
 *  Create the container surface.
 *  @method _createContainer
 *  @protected
 */
LayoutController.prototype._createContainer = function () {
  this.container = new ContainerSurface({
    classes: this.options.classes,
    properties: this.options.properties
  });
  this.container.context.setPerspective(this.options.perspective);

  var mainNode = new RenderNode();
  mainNode.render = this._innerRender.bind(this);

  this.add(this.container);
  this.container.add(mainNode);
}

LayoutController.prototype._connectContainer = function _connectContainer(obj) {
  this.container.pipe(obj);
  this.container.pipe(obj.sync);
}

/**
 *  For each item, set up a parent and child modifier. 
 *  Parent modifier is responsible sizing, allowing child modifier
 *  to have origin / alignment controlled rotations and scaling.
 *  Stored in `this.data`.
 *
 *  @method _createItems
 *  @protected
 */
LayoutController.prototype._createItems = function () {
  for (var i = 0; i < this.items.length; i++) {
    var renderable = this.items[i];
    var opacity = new Transitionable(1);

    var parentTransform = new TransitionableTransform();
    var parentOrigin = new Transitionable([0,0]);
    var parentAlign = new Transitionable([0,0]);
    var parentSize = new Transitionable([undefined, undefined]);

    var childTransform = new TransitionableTransform();
    var childOrigin = new Transitionable([0,0]);
    var childAlign = new Transitionable([0,0]);

    var mod = new Modifier({
      // use for translations.
      transform: parentTransform,
      origin: parentOrigin, 
      align: parentAlign,
      opacity: opacity,
      size: parentSize
    });

    var childMod = new Modifier({
      // use for rotations.
      transform: childTransform,
      origin: childOrigin, 
      align: childAlign
    });

    var touchMod = new Modifier({
      // use for touch (direct manipulation)
      transform: function(){
        var pos = this.data.touchOffset.get();
        return Transform.translate(pos[0], pos[1])
      }.bind(this)
    });

    var node = new RenderNode();
    node.getSize = renderable.getSize.bind(renderable);
    node.add(touchMod).add(mod).add(childMod).add(renderable);

    this.nodes.push(node);

    this.data.parentTransforms.push(parentTransform);
    this.data.opacities.push(opacity);
    this.data.parentOrigins.push(parentOrigin);
    this.data.parentAligns.push(parentAlign);
    this.data.parentSizes.push(parentSize);

    this.data.childTransforms.push(childTransform);
    this.data.childOrigins.push(childOrigin);
    this.data.childAligns.push(childAlign);
  };
}

/**
 *  Reset the nodes and transforms.
 */
LayoutController.prototype._reset = function () {
  this.nodes = []
  this.data.parentTransforms = [];
  this.data.opacities = [];
  this.data.parentOrigins = [];
  this.data.parentAligns = [];
  this.data.parentSizes = [];
  this.data.childTransforms = [];
  this.data.childOrigins = [];
  this.data.childAligns = [];
  this.data.sizeCache = [];
  this.data.sizeCacheFull = false;
}

LayoutController.prototype._sanitizeIndex = function (index) {
  var length = this.nodes.length;
  if (index < 0) return index % length + length;
  else if (index > length - 1) return index % length;
  return index;
}

/**
 *  Store the size of all items. Because we limit the number of items
 *  in the DOM at all times, and Surface does not save the old values
 *  of the content, this allows us to learn the sizes of all the items,
 *  after one pass through.
 *  Emits an 'initialSize' event the first time an item is rendered.
 *
 *  @method _updateSizeCache
 *  @param useResizeTransition {Boolean} Boolean indicating whether transition should be used to animate resize.
 */
LayoutController.prototype._updateSizeCache = function (useResizeTransition) {
  if (this.data.sizeCacheFull) return;

  var cache = this.data.sizeCache;
  var containerSize = this.container.getSize();
  var size;
  var validSizeCount = 0;
  for (var i = 0; i < cache.length; i++) {
    // Only check items whose size hasn't been cached
    if (cache[i] === undefined) {
      var item = this.items[i];
      size = item.getSize();

      // Check that size is properly defined and save it to cache
      if (size !== null && size !== undefined && !(size[0] == 0 || size[1] == 0)) {
        if (item.type === 'responsive') {
          size = item.setSize(containerSize, useResizeTransition);
        }

        cache[i] = size;
        this.data.parentSizes[i].set(size);

        // Trigger 'centerItem' on SingularLayouts
        var transition = useResizeTransition ? this.options['resizeTransition'] : null;
        this._eventInput.emit('initialSize', {
          index: i, 
          transition: transition
        });
        validSizeCount++;
      }
    } else {
      validSizeCount++;
    }
  }
  if (validSizeCount === cache.length) this.data.sizeCacheFull = true;
}

/**
 *  @method _layout
 */
LayoutController.prototype._layout = function() {
  this._layoutQueue = undefined;
  this._updateSizeCache();
  this.halt();
  if (this._activeLayout && this._activeLayout.activated) this._activeLayout.layout();
};

/**
 * Recenters the content
 *
 * @method _recenter
 */
LayoutController.prototype._recenter = function halt() {
  if (!this._activeLayout) return;

  if (this._activeLayout.isSingular) {
    // Responsive SingularLayouts take care of their own recentering through resize events.
    // Non-responsive SingularLayouts must be manually recentered.
    if (!this.options['responsiveSizing']) {
      for(var i = 0; i < this.data.sizeCache.length; i++) {
        if (this.data.sizeCache[i]) {
          this._activeLayout.centerItem(i, this.options['resizeTransition']);
        }
      }
    }
  } else {
    this.layout();
  }
}

/**
 *  Famous Render function.
 *  @method _innerRender
 *  @protected
 */
LayoutController.prototype._innerRender = function () {
  var result = [];

  for (var i = 0; i < this._toRender.length; i++) {
    result[i] = this.nodes[this._toRender[i]].render();
  };

  return result;
}

module.exports = LayoutController;

});

define('Carousel',['require','exports','module','famous/core/RenderNode','famous/core/Modifier','famous/core/Engine','famous/core/Surface','./constructors/SizeAwareView','famous/utilities/Timer','famous/inputs/FastClick','./registries/Easing','./registries/Physics','famous/inputs/GenericSync','famous/inputs/TouchSync','famous/inputs/MouseSync','famous/inputs/ScrollSync','famous/inputs/ScaleSync','./slides/Slide','./slides/ResponsiveSlide','./components/Arrows','./components/Dots','./layouts/LayoutController','./layouts/LayoutFactory'],function (require, exports, module) {/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owners: <tim@famo.us> <arkady@famo.us>
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */
var RenderNode         = require('famous/core/RenderNode');
var Modifier           = require('famous/core/Modifier');
var Engine             = require('famous/core/Engine');
var Surface            = require('famous/core/Surface');
var SizeAwareView      = require('./constructors/SizeAwareView');
var Timer              = require('famous/utilities/Timer');
var FastClick          = require('famous/inputs/FastClick');
// Register the curves
var RegisterEasing     = require('./registries/Easing');
var RegisterPhysics    = require('./registries/Physics');
// Syncs
var GenericSync        = require('famous/inputs/GenericSync');
var TouchSync          = require('famous/inputs/TouchSync');
var MouseSync          = require('famous/inputs/MouseSync');
var ScrollSync         = require('famous/inputs/ScrollSync');
var ScaleSync          = require('famous/inputs/ScaleSync');
var Slide              = require('./slides/Slide');
var ResponsiveSlide    = require('./slides/ResponsiveSlide');
var Arrows             = require('./components/Arrows');
var Dots               = require('./components/Dots');
var LayoutController   = require('./layouts/LayoutController');
var LayoutFactory      = require('./layouts/LayoutFactory');

GenericSync.register({
  'mouse': MouseSync,
  'touch': TouchSync,
  'scroll': ScrollSync
});

/**
 * Carousel takes content directly directly from the HTML DOM, from JavaScript DocumentFragments,
 * or direct references to Famo.us Renderables. Carousel allows content to be viewed in a
 * range of customizable layouts with smooth transitions. 
 *
 * @class Carousel
 * @param {Object} [options] An object of configurable options.
 * @param {Layout} [options.contentLayout] Determines the initial layout of the carousel. Defaults to FamousCarousel.SingularSoftScale. Other valid options are layouts attached to the FamousCarousel class. 
 * @param {Boolean} [options.responsiveSizing] Automatically scales items down to fit inside of the carousel.
 *
 * @param {Array | Number 2D} [options.innerContentAreaSize] **Famo.us only** Determines the size of the inner content area in which the slide content is displayed and outside of which the slide content is clipped. This inner area can be smaller than the overall carousel container to avoid slide content overlaying the arrows and dots. The inner area will be centered inside of the container. This option supports strings in the format ['X%', 'Y%'], which are parsed as percentages of the total container size. For example, an input of ['90%', '90%'] will create an inner content area that is 90% of the overall container, leaving 5% on the top/right/bottom/left for the arrows/dots to be positioned without being overlayed by slide content.
 * @param {Array | Number 2D} [options.contentPadding] **Plugin Only** Determines the padding between the inner content area (the rectangle inside of which slide content is displayed and outside of which slide content is clipped) and the total size of the containing div. Adding padding will make the inner content area smaller, which can ensure that the arrows and dots are not overlayed by the slide content. The 'x' padding is applied equally to the left/right and the 'y' padding is applied equally to the top/bottom, thus centering the inner content area.
 *
 * @param {Boolean} [options.arrowsEnabled] Whether the next and previous arrows are visible. Defaults to true.
 * @param {String} [options.arrowsPosition] Valid options: ["bottom" | "middle" | "top"]. Determines the vertical placement of the arrows. The horizontal position of the arrows are flush against left/right bounding border of the carousel. This can be modified by using arrowsPadding. Defaults to "middle".
 * @param {Array | Number 2D} [options.arrowsPadding] Determines the displacement from the arrow position. The first value in the array corresponds to the horizontal offset where a positive value pushes the arrows towards the center of the carousel. The second value in the array corresponds to the vertical offset where a positive value pushes the arrow down towards the bottom of the carousel. Defaults to [10, 0].
 * @param {String} [options.arrowsPreviousIconURL] URL of an image to use for the previous button skin.
 * @param {String} [options.arrowsNextIconURL] URL of an image to use for the next button skin.
 * @param {Boolean} [options.arrowsAnimateOnClick] Determines whether arrows animate on click. Defaults to true.
 * @param {Boolean} [options.arrowsToggleDisplayOnHover] Determines whether arrows should be animated in/out when user hovers over the carousel. A value of false signifies that the arrows will always be displayed. Defaults to true.
 *
 * @param {Boolean} [options.dotsEnabled] Determines whether the selection dots are to be used. Defaults to true.
 * @param {String} [options.dotsPosition] Valid options: ["left" | "middle" | "right"]. Determines the horizontal placement of the dots. The vertical position of the dots are flush against bottom bounding box of the carousel. This can be modified by dotsPadding. Defaults to "middle".
 * @param {Array | Number 2D} [options.dotsPadding] Determines the displacement from dot position set by dotsPosition. The first value in the array corresponds to the horizontal offset where a positive value pushes the dots to right and a negative value pushes them to the left. The second value in the array corresponds to the vertical offset where a negative value pushes the dots up towards the top of the carousel and a positive value pushes them down. Defaults to [0, -10].
 * @param {Array | Number 2D} [options.dotsSize] The width and height (in pixels) of the selection dots. Defaults to [10,10].
 * @param {Number} [options.dotsHorizontalSpacing] The horizontal spacing (in pixels) between each dot. Defaults to 10.
 * @param {Boolean} [options.dotsDefaultStyle] Determines whether to apply a default style to the dots. Default to true. The default style is applied as an inline style using the style attribute. As such, it takes precedence over any styles applied to ‘famous-carousel-dot’ or ‘famous-carousel-dot-selected’ using an external css style sheet (unless overwritten with the !important exception). The default styles applied to all dots (‘.famous-carousel-dot’) are {background-color: white, border: 1px solid black’, border-radius: 50%}. The default style applied to the selected dot {‘.famous-carousel-dot-selected’} is {background-color: black}. If different styles are desired, this options should be set to false and the styles should be applied to ‘.famous-carousel-dot’ and ‘.famous-carousel-dot-selected' in a separate style sheet.
 *
 * @param {Number} [options.selectedIndex] The index of the item to initially display. Corresponds to the index of the items in the options array, if given. Defaults to 0.
 * @param {Array} [options.items] For Carousel's not affixed to HTML DOM Elements, items specifies the DOM Elements or Famo.us renderables (Famo.us objects which support render(), commit() and getSize()) to be displayed in the carousel. Typically, this would be an array of Surfaces, Views or references to HTML DOM Elements.
 * @param {Boolean} [options.loop] Whether or not to loop from the last item back to the first (when going forward), or from the first back to the last (when going backwards). Defaults to true.
 * @param {Boolean} [options.keyboardEnabled] Automatically listen for right / left arrow keyboard presses to trigger next / previous. Defaults to true.
 * @param {Boolean} [options.mouseEnabled] Enable dragging of slides with mice on layouts that respect direct manipulation. Defaults to true.
 * @param {Boolean} [options.touchEnabled] Enable dragging of slides with touch on layouts that respect direct manipulation. Defaults to true.
 *
 * @css {.famous-carousel-container} Container div to set background color on.
 * @css {.famous-carousel-dot} If dots are enabled, the class corresponding to each dot.
 * @css {.famous-carousel-dot-selected} Applied to dot representing the current page.
 * @css {.famous-carousel-arrow} CSS class applied to the arrows, if enabled.
 * 
 */
function Carousel (options, isPlugin) {
  SizeAwareView.apply(this, arguments);
  this._isPlugin = isPlugin;

  this._data = {
    index: undefined,
    previousIndex: undefined,
    paginatedIndex: 1,
    itemsPerPage: 1,
    items: undefined,
    renderables: [],
    length: undefined
  }

  this.layoutDefinition;

  this.sync = new GenericSync();
  this.scaleSync = new ScaleSync();

  this.layoutController = new LayoutController({
    classes: ['famous-carousel-container'],
    itemsPerPage: this._data.itemsPerPage,
    responsiveSizing: this.options.responsiveSizing,
    loop: this.options.loop,
    sync: this.sync,
    resizeTransition: Carousel._resizeTransition
  });
  this.layoutController._connectContainer(this); //Pipe ContainerSurface

  // Add additonal Surface to capture mouse events if 
  // inner content area is smaller than total size of container/
  // Only relevant if arrows should toggle on hover
  this._mouseEventCatcher;
  if (this.options['arrowsToggleDisplayOnHover'] && 
     (this.options['contentPadding'] || this.options['innerContentAreaSize'])) {
    this._addMouseEventCatcher();
  }

  this.isThrottleResizeActive = false;
  this.isHoverActive = false;

  this._init();
}

Carousel.prototype = Object.create(SizeAwareView.prototype);
Carousel.prototype.constructor = Carousel;

Carousel.EVENTS = { 
  /**
   * New index that the carousel is set to. Triggered by arrow clicks, 
   * keyboard events or dot clicks. Calling setSelectedIndex will not trigger 
   * a selectionChange event.
   * 
   * @event selectionChange
   * @param {Number} index
   */
  selection: 'selectionChange',

  /**
   * Index of the clicked item.
   * 
   * @event itemClick
   * @param {Number} index
   */
  itemClick: 'itemClick'
}

Carousel._resizeTransition = {duration: 200, curve: 'linear'};

/**
 *  Calls next for right arrow key press, previous for left arrow key press.
 *
 *  @method _handleKeyup
 *  @static
 *  @protected
 *  @param {Event} Keyboard event.
 */
Carousel._handleKeyup = function _handleKeyup(e) {
  if (e.keyCode == 37) { // left arrow
    this.previous();
    this._emitSelection();
  }
  else if (e.keyCode == 39) {  // right arrow
    this.next();
    this._emitSelection();
  }
}

// PUBLIC API METHODS

/**
 *
 * @method setContentLayout
 * @param layoutDefinition {Layout} Wrapped Layout class wrapped in LayoutFactory. Permitted values
 * are enumerated on the FamousCarousel class. Specific layout options can be passed in as initialization
 * parameters to these classes. See individual classes for layout options and documentation.
 *
 * @example
 *    // Standalone Plugin
 *    var carousel = FamousContainer("#parentDiv", FamousCarousel({
 *      contentLayout: FamousCarousel.SingularSlideIn
 *    });
 *
 *    // Famous App
 *    var FamousCarousel = require('Carousel');
 *    var carousel = FamousCarousel({
 *      contentLayout: FamousCarousel.SingularSlideIn
 *    });
 *
 *    // set with default options
 *    carousel.setContentLayout(FamousCarousel.Grid);
 *
 *    // choose Grid layout with customized options.
 *    carousel.setContentLayout(FamousCarousel.Grid({
 *      gridSize: [5, 5]
 *    });
 *
 */
Carousel.prototype.setContentLayout = function setContentLayout(layoutDefinition) {
  if (!layoutDefinition) throw 'No layout definition given!';
  this.layoutDefinition = layoutDefinition;
  this.layoutController.setLayout(this.layoutDefinition);
  return this;
}

/**
 * Returns the currently active layout.
 * @method getContentLayout
 * @return {Object} Current layout definition.
 */
Carousel.prototype.getContentLayout = function getContentLayout() {
  return this.layoutDefinition;

}

/**
 * @method getSelectedIndex
 * @return {Number} Get the currently selected index.
 */
Carousel.prototype.getSelectedIndex = function getSelectedIndex() {
  return this._data.index;
}

/**
 * Set the current selected index of the carousel. Respects looping.
 * Triggers animation unless method is explicitly invoked with a flag to prevent animation. (Use case is when there is a simultaneous layout and index change).
 * This will NOT trigger a selectionChange event.
 * 
 * @method setSelectedIndex
 * @param index {Number} Index to set to.
 * @param triggerAnimation {Boolean} Flag indicating whether to trigger animation. Defaults to 'true'.
 * @return {Number} Updated index.
 */
Carousel.prototype.setSelectedIndex = function setSelectedIndex(index , triggerAnimation) {
  if (index == this._data.index) return this._data.index;

  //Calculate new index
  this._data.previousIndex = this._data.index;
  this._data.index = this._clamp(index);
  this._data.paginatedIndex = this._clamp(Math.floor(this._data.index / this._data.itemsPerPage));

  if (this._data.previousIndex !== this._data.index) {
    //Update LayoutController.
    triggerAnimation = (triggerAnimation === undefined) ? true : triggerAnimation;
    this.layoutController.setIndex(this._data.index, triggerAnimation);

    //Update dots.
    if(this.dots) this.dots.setIndex(this._data.paginatedIndex);
  }

  return this._data.index;
}

/**
 * Convenience function to go to the next index. For layouts that contain more than one item (grid), moves the layout to the next page.
 * @method next
 * @return {Number} New index after applying next.
 */
Carousel.prototype.next = function next() {
  var index = this._data.index + this._data.itemsPerPage;
  return this.setSelectedIndex(index);
}

/**
 * Convenience function to go to the previous index. For layouts that contain more than one item (grid), moves the layout to the previous page.
 * @method previous
 * @return {Number} New index after applying previous.
 */
Carousel.prototype.previous = function previous() {
  var index = this._data.index - this._data.itemsPerPage;
  return this.setSelectedIndex(index);
}

/**
 * @method getItems
 * @return {Array} Items the Carousel is composed of.
 */
Carousel.prototype.getItems = function getItems() {
  return this._data.items;
}

/**
 * Recreate the carousel with a new set of items. See also options.items for more details.
 * @method setItems
 * @param itemArray {Array} New items to create the Carousel with.
 */
Carousel.prototype.setItems = function setItems( itemArray ) {
  this._data.items = itemArray.slice(0);
  this._data.length = this._data.items.length;
  this._initItems();
  this.layoutController.setItems( this._data.renderables );
  return this;
}

/**
 * Get the current size of the carousel. 
 * @method getSize
 * @return {Array | Number} Current size in pixels of the Carousel.
 */
Carousel.prototype.getSize = function getSize() {
  return this.getParentSize();
}

/**
 *  TODO
 *  @method setSize
 */
Carousel.prototype.setSize = function setSize(size) {

}

// PROTECTED METHODS

/**
 * Initalizes the carousel.
 * @method _init
 * @protected
 */
Carousel.prototype._init = function _init() {
  this.setItems(this.options.items);
  this.setSelectedIndex(this.options.selectedIndex, false);
  this._initContent();
  this._events();

  Timer.after(function(){
    this._resize();
    this.setContentLayout(this.options.contentLayout);
  }.bind(this), 2);
}

/**
 * Initializes the current content.
 * @method _initContent
 * @protected
 */
Carousel.prototype._initContent = function _initContent() {
  if (this.options['arrowsEnabled']) {
    this.arrows = new Arrows({
      'position'             : this.options['arrowsPosition'],
      'padding'              : this.options['arrowsPadding'],
      'previousIconURL'      : this.options['arrowsPreviousIconURL'],
      'nextIconURL'          : this.options['arrowsNextIconURL'],
      'animateOnClick'       : this.options['arrowsAnimateOnClick'],
      'toggleDisplayOnHover' : this.options['arrowsToggleDisplayOnHover']
    });
    this.add(this.arrows);
  }

  if (this.options['dotsEnabled']) {
    this.dots = new Dots({
      'position'                  : this.options['dotsPosition'],
      'padding'                   : this.options['dotsPadding'],
      'size'                      : this.options['dotsSize'],
      'horizontalSpacing'         : this.options['dotsHorizontalSpacing'],
      'length'                    : Math.ceil(this._data.items.length / this._data.itemsPerPage),
      'selectedIndex'             : this.options['selectedIndex'],
      'applyDefaultStyle'         : this.options['dotsDefaultStyle'],
      'arrowsToggleDisplayOnHover': this.options['arrowsToggleDisplayOnHover']
    });
    this.add(this.dots);
  }

  this._sizeModifier = new Modifier({
    size: this._getCarouselSize(),
    origin: [0.5, 0.5],
    align: [0.5, 0.5]
  });

  this.add(this._sizeModifier).add(this.layoutController);
  
}

/**
 *  Initializes the items.
 *  @method _initItems
 *  @protected
 */
Carousel.prototype._initItems = function _initItems() {
  var slideConstructor = (this.options.responsiveSizing) ? ResponsiveSlide : Slide;

  for (var i = 0; i < this._data.items.length; i++) {
    if (this._data.items[i].render) { 
      this._data.renderables.push(this._data.items[i]);
    }
    else {
      var slide = new slideConstructor(this._data.items[i], Carousel._resizeTransition);
      this._data.renderables.push(slide);
    }

    // Trigger event on 'tap' (i.e., mouse or touch)
    // Avoid triggering event on 'drag'
    var startTime = null;
    var timeDiff = null;

    var setStartTime = function() {
      startTime = new Date();
    }
    var triggerEvent = function(i) {
      if ((new Date() - startTime) < 150) {
        this._eventOutput.emit(Carousel.EVENTS.itemClick, i);
      }
    }

    this._data.renderables[i].on('mousedown', setStartTime);
    this._data.renderables[i].on('touchstart', setStartTime);
    this._data.renderables[i].on('mouseup', triggerEvent.bind(this, i));
    this._data.renderables[i].on('touchend', triggerEvent.bind(this, i));
  };
}

/**
 *  Items per page changes the number of dots, and the number of items that are
 *  animated on each arrow click.
 *
 *  @method _setItemsPerPage
 *  @protected
 *  @param itemsPerPage {Number}
 *  @param forceDotAnimation {Boolean} Boolean indicating whether to trigger dot animation even if items per page hasn't changed (used on resize).
 */
Carousel.prototype._setItemsPerPage = function _setItemsPerPage(itemsPerPage, forceDotAnimation) {
  if((this._data.itemsPerPage === itemsPerPage) && !forceDotAnimation) return;

  this._data.itemsPerPage = itemsPerPage;
  if(this.dots) {
    this.dots.setLength(
      Math.ceil(this._data.items.length / itemsPerPage), //length
      itemsPerPage,
      this._data.index
    );
  }
}

/**
 *  Adds a Surface to capture mouse events (in order to display arrows on hover).
 *  Created when the inner content area is smaller than the total container size.
 *
 *  @method _addMouseEventCatcher
 *  @protected
 */
Carousel.prototype._addMouseEventCatcher = function _addMouseEventCatcher() {
  var surf = new Surface({
    size: [undefined, undefined],
    properties: {opacity: 0}
  });
  this.add(surf);

  surf.on('mouseover', function(){
      this.arrows.show();
      this.isHoverActive = true;
    }.bind(this));

  surf.on('mouseout', function(){
    this.arrows.hide();
    this.isHoverActive = false;
  }.bind(this));

  this._mouseEventCatcher = surf;
}

/**
 *  Internal resize callback. 
 *
 *  @method _resize
 *  @protected
 */
Carousel.prototype._resize = function _resize() {
  // Update size
  var carouselSize = this._getCarouselSize();
  this._sizeModifier.setSize(carouselSize);
  
  // Update LayoutController
  this.layoutController.setSize(carouselSize);

  // Update dots
  this._setItemsPerPage(this._data.itemsPerPage, true);
}

/**
 *  Throttles _reszie to ensure it's only triggered once per time window.
 *
 *  @method _throttleResize
 *  @protected
 */
Carousel.prototype._throttleResize = function _throttleResize() {
  if(this.isThrottleResizeActive) return;

  this.isThrottleResizeActive = true;
  var context = this;
  Timer.setTimeout(function(){
    context.isThrottleResizeActive = false;
    context._resize();
  }, 500);
}

/**
 *  Gets the current size of the carousel.
 *
 *  @method _getCarouselSize
 *  @protected
 */
Carousel.prototype._getCarouselSize = function () {
  var size = [];
  var parentSize = this.getSize();

  if (this._isPlugin) {
    size[0] = parentSize[0] - this.options['contentPadding'][0] * 2;
    size[1] = parentSize[1] - this.options['contentPadding'][1] * 2;
  }
  else {
    size[0] = typeof this.options['innerContentAreaSize'][0] == 'number' ?
      this.options['innerContentAreaSize'][0] :
      parseFloat(this.options['innerContentAreaSize'][0]) / 100 * parentSize[0];

    size[1] = typeof this.options['innerContentAreaSize'][1] == 'number' ?
      this.options['innerContentAreaSize'][1] :
      parseFloat(this.options['innerContentAreaSize'][1]) / 100 * parentSize[1];
  }

  return size;
}

/**
 *  Clamp or loop a number based on options.
 *  @param index {Number} number to clamp or loop.
 *  @returns index {Number} clamped or looped number
 *  @protected
 *  @method clamp 
 */
Carousel.prototype._clamp = function clamp( index, loop ) {
  if (typeof loop == 'undefined') loop = this.options['loop'];
  if (index > this._data.length - 1) {
    if (loop) index = 0
    else {
      index = this._data.length - 1;
    }
  } else if (index < 0 ) {
    if (loop) index = this._data.length - 1;
    else {
      index = 0;
    }
  }
  return index;
}

/**
 *  Displays then hides arrows. Used to display an arrow on touch devices.
 *  @protected
 *  @method _flashArrows 
 */
Carousel.prototype._flashArrows = function _flashArrows() {
  Timer.clear(this.arrowsHide);
  
  var arrows = this.arrows;
  arrows.show();
  this.arrowsHide = Timer.setTimeout(function(){
    arrows.hide();
  }, 2000);
}

/**
 *  Emits 'selectionChange' event if index has been udpated.
 *  @protected
 *  @method _emitSelection
 */
Carousel.prototype._emitSelection = function _emitSelection() {
  if (this._data.index !== this._data.previousIndex) {
    this._eventOutput.emit(Carousel.EVENTS.selection, this._data.index);
  }
}

////////////////////////////////////////////////////////////////////////////////////////
//// Handle Events
////////////////////////////////////////////////////////////////////////////////////////

/**
 *  Internal event listener setup.
 *  @method _events
 *  @protected
 */
Carousel.prototype._events = function _events() {
  this._eventInput.on('parentResize', this._throttleResize.bind(this));

  this._syncEvents();
  this._pinchEvents();
  this._keyboardEvents();
  this._arrowsEvents();
  this._dotsEvents();
  this._layoutControllerEvents();
}

/**
 *  Handles events associated with GenericSync (e.g., touch & mouse)
 *  @method _syncEvents
 *  @protected
 */
Carousel.prototype._syncEvents = function _syncEvents() {
  var inputs = [];
  if (this.options['touchEnabled']) inputs.push('touch');
  if (this.options['mouseEnabled']) inputs.push('mouse');
  this.sync.addSync(inputs);

  var startTime = null;
  this.sync.on('start', function() {
    // Display arrows on touch device
    if (this.options['arrowsEnabled'] && this.options['arrowsToggleDisplayOnHover'] && !this.isHoverActive) {
      this._flashArrows();
    }
  }.bind(this));

  this.sync.on('end', function() {
    this.isHoverActive = false;
  });
}

/**
 *  Handles events associated with pinch gestures
 *  @method _pinchEvents
 *  @protected
 */
Carousel.prototype._pinchEvents = function _pinchEvents() {
  var pinchStartDist;
  var pinchDistanceDiff;
  var blockPinchUpdate = false;

  this.scaleSync.on('start', function(data){
    startDist = data.distance;
    blockPinchUpdate = false;
  });

  this.scaleSync.on('update', function(data){
    if(blockPinchUpdate) return;

    pinchDistanceDiff = Math.abs(startDist - data.distance);
    if (pinchDistanceDiff > 50) {
      blockPinchUpdate = true;
      if(data.scale > 1) {
        this._eventOutput.emit('pinchOut');
      } else {
        this._eventOutput.emit('pinchIn');
      }
    }
  }.bind(this));
}

/**
 *  Handles events associated with keyboard input
 *  @method _keyboardEvents
 *  @protected
 */
Carousel.prototype._keyboardEvents = function _keyboardEvents() {
  if (this.options['keyboardEnabled']) {
    this._handleKeyup = Carousel._handleKeyup.bind(this);
    Engine.on('keyup', this._handleKeyup);
  }
}

/**
 *  Handles events associated with Dots
 *  @method _arrowsEvents
 *  @protected
 */
Carousel.prototype._arrowsEvents = function _arrowsEvents() {
  if (this.arrows) {
    this.arrows.on('previous', function() {
      this.previous();
      this._emitSelection();
    }.bind(this));

    this.arrows.on('next', function() {
      this.next();
      this._emitSelection();
    }.bind(this));

    this.arrows.on('click', function() {
      if (this.options['arrowsToggleDisplayOnHover'] && !this.isHoverActive) this._flashArrows();
    }.bind(this));
  }

  if (this.options['arrowsToggleDisplayOnHover'] && this.arrows) {
    this._eventInput.on('mouseover', function(){
      this.arrows.show.call(this.arrows);
      this.isHoverActive = true;
    }.bind(this));

    this._eventInput.on('mouseout', function(){
      this.arrows.hide.call(this.arrows)
      this.isHoverActive = false;
    }.bind(this));
  }
}

/**
 *  Handles events associated with Dots
 *  @method _layoutControllerEvents
 *  @protected
 */
Carousel.prototype._dotsEvents = function _dotsEvents() {
  if (this.dots) {
    this.dots.on('set', function(index) {
      this.setSelectedIndex(index * this._data.itemsPerPage);
      this._emitSelection();
    }.bind(this));
  }
  if (this.dots && this.arrows) {
    this.dots.on('showArrows', this.arrows.show.bind(this.arrows));
    this.dots.on('hideArrows', this.arrows.hide.bind(this.arrows));
  }
}

/**
 *  Handles events associated with LayoutController
 *  @method _layoutControllerEvents
 *  @protected
 */
Carousel.prototype._layoutControllerEvents = function _layoutControllerEvents() {
  this.layoutController.on('paginationChange', this._setItemsPerPage.bind(this));
  this.layoutController.on('previous', function() {
    this.previous();
    this._emitSelection();
  }.bind(this));

  this.layoutController.on('next', function() {
    this.next();
    this._emitSelection();
  }.bind(this));

  this.layoutController.on('set', function(index) {
    this.setSelectedIndex(index);
    this._emitSelection();
  }.bind(this));
}

////////////////////////////////////////////////////////////////////////////////////////
//// Layouts and Default Options
////////////////////////////////////////////////////////////////////////////////////////

//Singular Layouts

/**
 *  SingularSoftScale
 *  @method Carousel.SingularSoftScale
 *  @static
 */
Carousel.SingularSoftScale = LayoutFactory.SingularSoftScale;
/**
 *  SingularTwist
 *  @method Carousel.SingularTwist
 *  @static
 */
Carousel.SingularTwist = LayoutFactory.SingularTwist;
/**
 *  SingularParallax
 *  @method Carousel.SingularParallax
 *  @static
 */
Carousel.SingularParallax = LayoutFactory.SingularParallax;
/**
 *  SingularSlideBehind
 *  @method Carousel.SingularSlideBehind
 *  @static
 */
Carousel.SingularSlideBehind = LayoutFactory.SingularSlideBehind;
/**
 *  SingularOpacity
 *  @method Carousel.SingularOpacity
 *  @static
 */
Carousel.SingularOpacity = LayoutFactory.SingularOpacity;
/**
 *  SingularSlideIn
 *  @method Carousel.SingularSlideIn
 *  @static
 */
Carousel.SingularSlideIn = LayoutFactory.SingularSlideIn;
/**
 *  SequentialLayout
 *  @method Carousel.SequentialLayout
 *  @static
 */
Carousel.SequentialLayout = LayoutFactory.SequentialLayout;


//Browsing Layouts
/**
 *  GridLayout
 *  @method Carousel.GridLayout
 *  @static
 */
Carousel.GridLayout = LayoutFactory.GridLayout;
/**
 *  CoverflowLayout
 *  @method Carousel.CoverflowLayout
 *  @static
 */
Carousel.CoverflowLayout = LayoutFactory.CoverflowLayout;

Carousel.DEFAULT_OPTIONS = {
  contentLayout: Carousel.SingularSoftScale,
  responsiveSizing: false,

  innerContentAreaSize: ['100%', '100%'],
  contentPadding: [0,0],

  arrowsEnabled: true,
  arrowsPosition: "middle",
  arrowsPadding: [10, 0],
  arrowsPreviousIconURL: undefined,
  arrowsNextIconURL: undefined,
  arrowsAnimateOnClick: true,
  arrowsToggleDisplayOnHover: true,

  dotsEnabled: true,
  dotsPosition: "middle",
  dotsPadding: [0, -10],
  dotsSize: [10, 10],
  dotsHorizontalSpacing: 10,
  dotsDefaultStyle: true,

  selectedIndex: 0,
  items: [],
  loop: true,

  keyboardEnabled: true,
  mouseEnabled: true,
  touchEnabled: true
}

module.exports = Carousel;

});

