Package.describe({
    summary: "open source front-end framework for developing mobile apps with famous and meteor",
    version: "0.3.0-rc2",
    name: "particle4dev:famodev",
    git: "https://particle4dev@bitbucket.org/particle4devs-team/famodev.git"
});

// meteor test-packages ./
var both = ['client', 'server'];
var client = ['client'];
var server = ['server'];

Package.on_use(function(api) {
    if (api.versionsFrom)
        api.versionsFrom('METEOR@0.9.2');
    api.use(['underscore', 'tracker', 'reactive-var', 'observe-sequence', 'ui', 'blaze', 'templating'], client);
    api.use(['particle4dev:famous@1.0.0'], both);
    api.use(['particle4dev:sass@0.2.9'], both);
    api.imply(['particle4dev:sass@0.2.9'], both);
    api.add_files([
        'stylesheets/main.scss',

        // utils
        'src/utils/helpers.js',
        'src/utils/pipeline.js',
        
        // reactive
        'src/reactive/ReactiveSession.js', // stable v0.3.0
        'src/reactive/ReactiveCursor.js', // stable v0.3.0
        'src/reactive/ReactiveSurface.js', // stable v0.3.0
        'src/reactive/ReactiveTemplate.js', // stable v0.3.0
        'src/reactive/SurfaceIf.js', // stable v0.3.0
        'src/reactive/Each.js', // stable v0.3.0
        

        'src/Node.js',
        'src/Modifier.js',
        'src/Utils.js',
        'src/Scrollview.js',

        'src/ui/tabs/TabBar.js',
        'src/ui/tabs/TabButton.js',
        'src/ui/Slidershow.js',

        // from famous
        'src/ui/famouscarousel/FamousCarousel.require.singular.js',

        'src/app/EventsCenter.js',
        'src/app/PagesManager.js',

        'src/app/AppView.js'
    ], client);
    if (typeof api.export !== 'undefined') {
        api.export('Application', client);
    }
});

Package.on_test(function(api) {
    api.use(['test-helpers', 'tinytest'], client);
    api.add_files([
    ], client);
});