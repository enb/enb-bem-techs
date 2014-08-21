var path = require('path');
var Level = require('../lib/levels/level');
var LevelPlain = require('../lib/levels/level-plain');

var fixturesDirname = path.resolve(__dirname, 'fixtures');
var nestedLevelDirname = path.join(fixturesDirname, 'nested-level');
var simpleLevelDirname = path.join(fixturesDirname, 'simple-level');

suite('scan level', function () {
    set('iterations', 10000);
    set('type', 'static');

    bench('nested level', function (done) {
        var level = new Level(nestedLevelDirname);

        level.load()
            .then(done, done);
    });

    bench('simple level', function (done) {
        var level = new Level(simpleLevelDirname, LevelPlain);

        level.load()
            .then(done, done);
    });
});
