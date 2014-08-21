var fs = require('fs');
var path = require('path');
var vow = require('vow');
var Level = require('../lib/levels/level');

var fixturesDirname = path.resolve(__dirname, 'fixtures');
var libsDirname = path.join(fixturesDirname, 'libs');

var platforms = ['common', 'desktop', 'touch', 'touch-pad', 'touch-phone', 'test'];
var bl = getLevels(platforms, ['bem-bl']);
var core = getLevels(platforms, ['bem-core', 'bem-components', 'bem-components/design']);
var all = [].concat(bl, core);

suite('scan levels', function () {
    set('iterations', 1000);
    set('concurrency', 10);

    bench('`bem-bl`', function (done) {
        vow.all(bl.map(function (level) {
            return (new Level(level)).load();
        })).then(done, done);
    });

    bench('`bem-core` + `bem-components`', function (done) {
        vow.all(core.map(function (level) {
            return (new Level(level)).load();
        })).then(done, done);
    });

    bench('`bem-bl` + `bem-core` + `bem-components`', function (done) {
        vow.all(all.map(function (level) {
            return (new Level(level)).load();
        })).then(done, done);
    });
});

function getLevels(platforms, libraries) {
    var levels = [];
    var libs = libraries.map(function (lib) {
        return path.join(libsDirname, lib);
    });

    platforms.forEach(function (platform) {
        libs.forEach(function (lib) {
            var level1 = path.join(lib, platform + '.blocks');
            var level2 = path.join(lib, 'blocks-' + platform);

            fs.existsSync(level1) && levels.push(level1);
            fs.existsSync(level2) && levels.push(level2);
        });
    });

    return levels;
}
