Application = (function () {
    var ready = new ReactiveVar();
    ready.set(false);
    var app = function (options) {
        require([
            'famodev/app/EventsCenter'
        ],
        function(EventsCenter) {
            EventsCenter.listen('loading', function () {
                options.loading();
            });
            EventsCenter.listen('launch', function () {
                ready.set(true);
                options.launch();
            });
        });
        return options;
    };
    app.isready = function () {
        return ready.get();
    };
    return app;
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