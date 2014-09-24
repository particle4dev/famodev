var path    = Npm.require('path');
var fs      = Npm.require('fs');
(function() {
    // library folder to ensure load order
    var libFolder = path.join(process.cwd(), 'lib');
    // The filename of the smart.require
    var filename = path.join(libFolder, 'smart.require');

    // add famodev package
    var data = JSON.parse(fs.readFileSync(filename, "utf8"));
    if(!data['famodev']) {
        data['famodev'] = {
            "git": "git@bitbucket.org:particle4devs-team/famodev.git",
            "branch": "releases"
        };
        fs.writeFileSync(filename, JSON.stringify(data, null, '\t'), 'utf8');
    }
})();