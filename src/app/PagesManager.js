/**
 * PagesManager
 *      
 *
 * @constructor
 * @extends {}
 * @status v0.3.0
 */
define('famodev/app/PagesManager', [
    'require', 
    'exports',
    'module',
    'famous/views/Lightbox',
    'famous/core/Transform',
    'famous/transitions/Transitionable',
    'famous/transitions/SpringTransition',
    'famous/transitions/Easing'
    ], function (require, exports, module) {

        var Lightbox            = require('famous/views/Lightbox');
        var Transform           = require('famous/core/Transform');
        var Transitionable      = require('famous/transitions/Transitionable');
        var SpringTransition    = require('famous/transitions/SpringTransition');
        var Easing              = require('famous/transitions/Easing');

        Transitionable.registerMethod('spring', SpringTransition);
        /**
         * Add Views
         */
        var PagesManager = function(opt){
            var PagesLine       = new Pipeline();
            var pages = {},
            defaultPage = null,
            currentpage = null;
            if(!opt)
                opt = PagesManager.SlideHideLeft;
            var lightbox = new Lightbox(opt);

            // add method
            this['getInstance'] = function(){
                return lightbox;
            };
            this['register'] = function (path, options) {
                var pageModule = require(path);
                pages[path] = new pageModule(options);
            };
            this['defaultPage'] = function (page) {
                if(page)
                    return defaultPage = page;
                return defaultPage;
            };
            this['show'] = function (path) {
                PagesLine.push(function(path){
                    if(!path)
                        path = defaultPage;
                    if(currentpage == path)
                        return;
                    // call destroyed
                    var p = pages[currentpage];
                    if(p && p.destroyed)
                        p.destroyed();

                    p = pages[path];
                    // call rendered
                    if(p && p.rendered)
                        p.rendered();

                    lightbox.show(p);
                    currentpage = path;
                }, path);
                PagesLine.sequenceFlush({
                    duration: 500 //ms
                });
            };
        };

        // static value
        _.extend(PagesManager, {
            HideOutgoingSpringIn: {
                inOpacity: 0,
                outOpacity: 0,
                inTransform: Transform.scale(0, -0.1, 0), //Transform.translate(window.innerWidth,0,0),
                outTransform: Transform.translate(0, 0, 1),
                inTransition: {
                    method: 'spring',
                    period: 500,
                    dampingRatio: 0.6
                },
                outTransition: {
                    duration: 300,
                    curve: Easing.easeOut
                }
            },
            OpacityIn: {
                inOpacity: 0,
                outOpacity: 0,
                inTransform: Transform.identity,
                outTransform: Transform.identity,
                inTransition: {
                    duration: 500,
                    curve: Easing.easeIn
                },
                outTransition: {
                    duration: 350,
                    curve: Easing.easeOut
                }
            },
            Identity: {
                inOpacity: 1,
                outOpacity: 1,
                inTransform: Transform.identity,
                outTransform: Transform.identity,
                inTransition: {
                    duration: 500,
                    curve: Easing.easeIn
                },
                outTransition: {
                    duration: 300,
                    curve: Easing.easeIn
                },
            },
            SlideDown: {
                inOpacity: 0,
                outOpacity: 1,
                showOpacity: 1,
                showTransform: Transform.identity,
                inTransform: Transform.inFront,
                outTransform: Transform.translate(0, window.innerHeight, 0),
                inTransition: {
                    duration: 500,
                    curve: Easing.easeIn
                },
                outTransition: {
                    duration: 350,
                    curve: Easing.easeIn
                },
                overlap: true
            },
            SlideUp: {
                inOpacity: 0,
                outOpacity: 0,
                showOpacity: 1,
                showTransform: Transform.identity,
                inTransform: Transform.translate(0, window.innerHeight, 0),
                outTransform: Transform.behind,
                inTransition: {
                    duration: 500,
                    curve: Easing.easeIn
                },
                outTransition: {
                    duration: 350,
                    curve: Easing.easeIn
                },
                overlap: true
            },
            SlideLeft: {
                inOpacity: 1,
                outOpacity: 1,
                inTransform: Transform.translate(window.innerWidth, 0, 0),
                outTransform: Transform.translate(window.innerWidth * -1, 0, 0),
                inTransition: {
                    duration: 500,
                    curve: Easing.easeIn
                },
                outTransition: {
                    duration: 350,
                    curve: Easing.easeIn
                },
                overlap: true
            },
            SlideRight: {
                inOpacity: 1,
                outOpacity: 1,
                inTransform: Transform.translate(window.innerWidth * -1, 0, 0),
                outTransform: Transform.translate(window.innerWidth, 0, 0),
                inTransition: {
                    duration: 500,
                    curve: Easing.easeIn
                },
                outTransition: {
                    duration: 350,
                    curve: Easing.easeIn
                },
                overlap: true
            },
            SlideHideLeft: {
                inOpacity: 0,
                outOpacity: 1,
                showOpacity: 1,
                showTransform: Transform.identity,
                inTransform: Transform.identity,
                outTransform: Transform.translate(window.innerWidth * -1, 0, 0),
                inTransition: {
                    duration: 500,
                    curve: Easing.easeIn
                },
                outTransition: {
                    duration: 350,
                    curve: Easing.easeIn
                },
                // overlap: true
            }
        });

        /**
         * Methods
         */
        _.extend(PagesManager.prototype, {

        });

        /**
         * Events
         */

        return module.exports = PagesManager;
});