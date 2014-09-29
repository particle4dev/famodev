Package.describe({
    summary: "open source front-end framework for developing mobile apps with famous and meteor",
    version: "0.3.0-rc0",
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
    api.use(['reactive-var', 'observe-sequence', 'ui'], client);
    api.use(['particle4dev:famous@1.0.0'], both);
    api.use(['particle4dev:sass@0.2.9'], both);
    api.imply(['particle4dev:sass@0.2.9'], both);
    api.add_files([
        'stylesheets/main.scss',

        'src/Pipeline.js',
        //
        'src/reactive/ReactiveSurface.js',
        'src/reactive/ReactiveTemplate.js',
        'src/reactive/Each.js',
        'src/reactive/SurfaceIf.js',

        'src/Node.js',
        'src/Modifier.js',
        'src/Utils.js',
        'src/Scrollview.js',

        'src/ui/tabs/TabBar.js',
        'src/ui/tabs/TabButton.js',

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