Package.describe({
    summary: "open source front-end framework for developing mobile apps with famous and meteor",
    version: "0.2.5-rc7",
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
    api.use(['reactive-var', 'observe-sequence'], client);
    api.use(['raix:famono@0.8.1'], both);
    api.use(['particle4dev:sass@0.2.9'], server);
    api.add_files([
        // reactive
        'src/reactive/ReactiveSurface.js',
        'src/reactive/ReactiveTemplate.js',
        'src/reactive/SurfaceIf.js',
        'src/reactive/Each.js',

        //ui
        'src/ui/tabs/TabBar.js',
        'src/ui/tabs/TabButton.js',

        // base
        'src/Scrollview2.js',
        'src/Utils.js',
        'src/Node.js',
        'src/Modifier.js'

    ], client);
    if (typeof api.export !== 'undefined') {}
});

Package.on_test(function(api) {
    api.use(['test-helpers', 'tinytest'], client);
    api.add_files([
    ], client);
});