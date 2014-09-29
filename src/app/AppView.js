Application = (function () {

    return function (options) {
        require([
            'famodev/app/EventsCenter'
        ],
        function(EventsCenter) {
            EventsCenter.listen('loading', function () {
                options.loading();
            });
            EventsCenter.listen('launch', function () {
                options.launch();
            });
        });
        return options;
    };
})();

/**

FamousApplication.on('init', function(next){
    next();
});

FamousApplication.on('loading', function(next){
    next();
});

FamousApplication.on('launch', function(next){
    next();
});

FamousApplication.ready()

*/