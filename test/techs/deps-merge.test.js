var FileSystem = require('enb/lib/test/mocks/test-file-system');
var TestNode = require('enb/lib/test/mocks/test-node');
var mergeTech = require('../../techs/deps-merge');

describe('techs', function () {
    describe('deps-merge', function () {
        var fileSystem;
        var bundle;
        var dataBundle;

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

            dataBundle.provideTechData('data.deps.js', [{ block: 'block' }]);
        });

        afterEach(function () {
            fileSystem.teardown();
        });

        it('must require result target from data', function (done) {
            dataBundle.runTechAndRequire(mergeTech, { sources: ['data.deps.js']})
                .spread(function (result) {
                    result.deps.must.eql([{ block: 'block' }]);
                })
                .then(done, done);
        });

        it('must provide result from data', function (done) {
            dataBundle.runTech(mergeTech, { sources: ['data.deps.js']})
                .then(function (deps) {
                    deps.must.eql([{ block: 'block' }]);
                })
                .then(done, done);
        });

        it('must require result target from file', function (done) {
            bundle.runTechAndRequire(mergeTech, { sources: ['block.deps.js']})
                .spread(function (result) {
                    result.deps.must.eql([{ block: 'block' }]);
                })
                .then(done, done);
        });

        it('must merge block with mod of block', function (done) {
            bundle.runTech(mergeTech, { sources: ['block.deps.js', 'block-mod.deps.js'] })
                .then(function (bemdecl) {
                    bemdecl.must.eql([
                        { block: 'block' },
                        { block: 'block', mod: 'modName', val: 'modVal' }
                    ]);
                })
                .then(done, done);
        });

        it('must merge block with elem', function (done) {
            bundle.runTech(mergeTech, { sources: ['block.deps.js', 'elem.deps.js'] })
                .then(function (bemdecl) {
                    bemdecl.must.eql([
                        { block: 'block' },
                        { block: 'block', elem: 'elem' }
                    ]);
                })
                .then(done, done);
        });

        it('must merge elem with mod of elem', function (done) {
            bundle.runTech(mergeTech, { sources: [
                    'elem.deps.js', 'elem-mod.deps.js'
                ]})
                .then(function (bemdecl) {
                    bemdecl.must.eql([
                        { block: 'block', elem: 'elem' },
                        { block: 'block', elem: 'elem', mod: 'modName', val: 'modVal' }
                    ]);
                })
                .then(done, done);
        });

        it('must merge set with empty set', function (done) {
            bundle.runTech(mergeTech, { sources: ['empty.deps.js', 'set.deps.js'] })
                .then(function (bemdecl) {
                    bemdecl.must.eql([{ block: '1' }, { block: '2' }, { block: '3' }]);
                })
                .then(done, done);
        });

        it('must merge intersecting sets', function (done) {
            bundle.runTech(mergeTech, { sources: ['set.deps.js', 'part.deps.js'] })
                .then(function (bemdecl) {
                    bemdecl.must.eql([{ block: '1' }, { block: '2' }, { block: '3' }]);
                })
                .then(done, done);
        });

        it('must merge disjoint sets', function (done) {
            bundle.runTech(mergeTech, { sources: ['set.deps.js', 'nonexistent.deps.js'] })
                .then(function (bemdecl) {
                    bemdecl.must.eql([{ block: '1' }, { block: '2' }, { block: '3' }, { block: 'O_o' }]);
                })
                .then(done, done);
        });
    });
});

function stringify(bemjson) {
    return 'exports.deps = ' + JSON.stringify(bemjson) + ';';
}
