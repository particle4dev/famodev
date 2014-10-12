define('famodev/ui/Toast', [
    'require', 
    'exports',
    'module',
    'famous/core/RenderNode',
    'famous/core/Surface',
    'famous/core/Transform',
    'famous/core/Modifier',

    'famodev/Utils',
    'famodev/reactive/ReactiveSurface'
    ],
    function(require, exports, module) {

        var RenderNode  = require('famous/core/RenderNode');
        var Surface     = require('famous/core/Surface');
        var Transform   = require('famous/core/Transform');
        var Modifier    = require('famous/core/Modifier');

        var Utils       = require('famodev/Utils');
        var ReactiveSurface = require('famodev/reactive/ReactiveSurface');

        var message = new ReactiveVar();
        message.set('I am a tweet. I have exactly 140 characters. If you want to make sure that I only have 140 characters you can check for yourself. 0123456789');

        function Toast () {

        }

        // static method
        _.extend(Toast, {
            init: function(appContent, zIndex){
                var node = new RenderNode();

                var mod2 = new Modifier({
                    align: [0.5, 1],
                    origin: [0.5, 0.5],
                    transform : function(){
                        // return Transform.rotateZ(.01 * (Date.now() - initialTime));
                        var left = (Utils.windowWidth() - 320)/2;
                        return
                        Transform.translate(left, 0, 0);
                    }
                });


                var m = new ReactiveSurface({
                    size: [320, true],
                    // <i class="fa fa-info fr" style=""></i>
                    classes: ['border-rounded', 'color-white', 'text-center'],
                    properties: {
                        position: 'relative',
                        backgroundColor: '#666',
                        lineHeight: '23px',
                        padding: '16px 32px'
                    },
                    content: function(){
                        return message.get();
                    }
                });

                node
                .add(mod2)
                .add(m);


                var initialTime = Date.now();
                var mod = new Modifier({
                    opacity: 0,
                    align: [0, 1],
                    transform: Transform.translate(0, -100, zIndex)
                });
                
                m.on('click', function(){
                    mod.setOpacity(0,  {
                        duration: 200,
                        curve: 'easeIn'
                    });
                });

                // setTimeout(function(){
                //     appContent
                //     .add(mod)
                //     .add(node);

                //     setTimeout(function(){
                //         mod.setOpacity(1,  {
                //             duration: 200,
                //             curve: 'easeIn'
                //         });
                //     }, 1000);

                // }, 2000);
            },
            set: function (v) {
                message.set(v);
            }
        });

        module.exports = Toast;

});


    // var t = Toast.createText({
    //      duration: Toast.UNIDENTIFIED,
    //      text: 'voting...',
    //      outEffect,
    //      inEffect,
    //      position,
    //      data,
    //      template
    // }); 
    // t.show();
    // t.setText('done');
    // t.hide();