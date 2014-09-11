var FileSystem = require('enb/lib/test/mocks/test-file-system'),
    TestNode = require('enb/lib/test/mocks/test-node'),
    subtractTech = require('../../techs/subtract-deps');

describe('techs', function () {
    describe('subtract-deps', function () {
        var fileSystem,
            bundle,
            dataBundle;

        beforeEach(function () {
            fileSystem = new FileSystem([{
                directory: 'bundle', items: [
                    { file: 'block.deps.js', content: stringify([{ block: 'block' }]) },
                    { file: 'block-mod.deps.js', content: stringify([{ block: 'block',
                        mod: 'modName', val: 'modVal' }]) },
                    { file: 'elem.deps.js', content: stringify([{ block: 'block', elem: 'elem' }]) },
                    { file: 'elem-mod.deps.js', content: stringify([{ block: 'block', elem: 'elem',
                        mod: 'modName', val: 'modVal' }]) },

                    { file: 'empty.deps.js', content: stringify([]) },
                    { file: 'set.deps.js', content: stringify([{ block: '1' }, { block: '2' }, { block: '3' }]) },
                    { file: 'part.deps.js', content: stringify([{ block: '2' }]) },
                    { file: 'nonexistent.deps.js', content: stringify([{ block: 'O_o' }]) }
                ]
            }]);
            fileSystem.setup();

            bundle = new TestNode('bundle');
            dataBundle = new TestNode('bundle');

            dataBundle.provideTechData('data.deps.js', { deps: [{ block: 'block' }] });
        });

        afterEach(function () {
            fileSystem.teardown();
        });

        it('must require result target from data', function (done) {
            dataBundle.runTechAndRequire(subtractTech, {
                    from: 'block.deps.js',
                    what: 'block.deps.js'
                })
                .spread(function (result) {
                    result.deps.must.eql([]);
                })
                .then(done, done);
        });

        it('must provide result from data', function (done) {
            dataBundle.runTech(subtractTech, {
                    from: 'block.deps.js',
                    what: 'block.deps.js'
                })
                .then(function (res) {
                    res.deps.must.eql([]);
                })
                .then(done, done);
        });

        it('must require result target from file', function (done) {
            dataBundle.runTechAndRequire(subtractTech, {
                    from: 'block.deps.js',
                    what: 'block.deps.js'
                })
                .spread(function (result) {
                    result.deps.must.eql([]);
                })
                .then(done, done);
        });

        it('must subtract elem from block', function (done) {
            bundle.runTech(subtractTech, {
                    from: 'block.deps.js',
                    what: 'elem.deps.js'
                })
                .then(function (res) {
                    res.deps.must.eql([{ block: 'block' }]);
                })
                .then(done, done);
        });

        it('must subtract mod of block from block', function (done) {
            bundle.runTech(subtractTech, {
                    from: 'block.deps.js',
                    what: 'block-mod.deps.js'
                })
                .then(function (res) {
                    res.deps.must.eql([{ block: 'block' }]);
                })
                .then(done, done);
        });

        it('must subtract mod of elem from elem', function (done) {
            bundle.runTech(subtractTech, {
                    from: 'elem.deps.js',
                    what: 'elem-mod.deps.js'
                })
                .then(function (res) {
                    res.deps.must.eql([{ block: 'block', elem: 'elem' }]);
                })
                .then(done, done);
        });

        it('must subtract same sets', function (done) {
            bundle.runTech(subtractTech, {
                    from: 'set.deps.js',
                    what: 'set.deps.js'
                })
                .then(function (res) {
                    res.deps.must.eql([]);
                })
                .then(done, done);
        });

        it('must subtract nonexistent item from set', function (done) {
            bundle.runTech(subtractTech, {
                    from: 'set.deps.js',
                    what: 'nonexistent.deps.js'
                })
                .then(function (res) {
                    res.deps.must.eql([{ block: '1' }, { block: '2' }, { block: '3' }]);
                })
                .then(done, done);
        });

        it('must subtract empty set from nonempty set', function (done) {
            bundle.runTech(subtractTech, {
                    from: 'set.deps.js',
                    what: 'empty.deps.js'
                })
                .then(function (res) {
                    res.deps.must.eql([{ block: '1' }, { block: '2' }, { block: '3' }]);
                })
                .then(done, done);
        });

        it('must subtract set from empty set', function (done) {
            bundle.runTech(subtractTech, {
                    from: 'empty.deps.js',
                    what: 'set.deps.js'
                })
                .then(function (res) {
                    res.deps.must.eql([]);
                })
                .then(done, done);
        });

        it('must subtract disjoint set', function (done) {
            bundle.runTech(subtractTech, {
                    from: 'set.deps.js',
                    what: 'part.deps.js'
                })
                .then(function (res) {
                    res.deps.must.eql([{ block: '1' }, { block: '3' }]);
                })
                .then(done, done);
        });
    });
});

function stringify(bemjson) {
    return 'exports.deps = ' + JSON.stringify(bemjson) + ';';
}
