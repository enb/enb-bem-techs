var FileSystem = require('enb/lib/test/mocks/test-file-system'),
    TestNode = require('enb/lib/test/mocks/test-node'),
    mergeTech = require('../../techs/merge-bemdecl');

describe('techs', function () {
    describe('merge-bemdecl', function () {
        var fileSystem,
            bundle,
            dataBundle;

        beforeEach(function () {
            fileSystem = new FileSystem([{
                directory: 'bundle', items: [
                    { file: 'block.bemdecl.js', content: stringify([{ name: 'block' }]) },
                    { file: 'block-mod.bemdecl.js', content: stringify([{
                        name: 'block',
                        mods: [{ name: 'modName', vals: [{ name: 'modVal' }] }]
                    }]) },
                    { file: 'elem.bemdecl.js', content: stringify([{
                        name: 'block',
                        elems: [{ name: 'elem' }]
                    }]) },
                    { file: 'elem-mod.bemdecl.js', content: stringify([{
                        name: 'block',
                        elems: [{ name: 'elem', mods: [{ name: 'modName', vals: [{ name: 'modVal' }] }] }]
                    }]) },

                    { file: 'empty.bemdecl.js', content: stringify([]) },
                    { file: 'set.bemdecl.js', content: stringify([{ name: '1' }, { name: '2' }, { name: '3' }]) },
                    { file: 'part.bemdecl.js', content: stringify([{ name: '2' }]) },
                    { file: 'nonexistent.bemdecl.js', content: stringify([{ name: 'O_o' }]) }
                ]
            }]);
            fileSystem.setup();

            bundle = new TestNode('bundle');
            dataBundle = new TestNode('bundle');

            dataBundle.provideTechData('data.bemdecl.js', { blocks: [{ name: 'block' }] });
        });

        afterEach(function () {
            fileSystem.teardown();
        });

        it('must require result target from data', function (done) {
            dataBundle.runTechAndRequire(mergeTech, { sources: ['data.bemdecl.js'] })
                .spread(function (bemdecl) {
                    bemdecl.blocks.must.eql([{ name: 'block' }]);
                })
                .then(done, done);
        });

        it('must provide result from data', function (done) {
            dataBundle.runTech(mergeTech, { sources: ['data.bemdecl.js'] })
                .then(function (bemdecl) {
                    bemdecl.blocks.must.eql([{ name: 'block' }]);
                })
                .then(done, done);
        });

        it('must require result target from file', function (done) {
            bundle.runTechAndRequire(mergeTech, { sources: ['block.bemdecl.js'] })
                .spread(function (bemdecl) {
                    bemdecl.blocks.must.eql([{ name: 'block' }]);
                })
                .then(done, done);
        });

        it('must merge block with mod of block', function (done) {
            bundle.runTech(mergeTech, { sources: [
                    'block.bemdecl.js', 'block-mod.bemdecl.js'
                ] })
                .then(function (bemdecl) {
                    bemdecl.blocks.must.eql([
                        { name: 'block' },
                        { name: 'block', mods: [{ name: 'modName', vals: [{ name: 'modVal' }] }] }
                    ]);
                })
                .then(done, done);
        });

        it('must merge block with elem', function (done) {
            bundle.runTech(mergeTech, { sources: [
                    'block.bemdecl.js', 'elem.bemdecl.js'
                ] })
                .then(function (bemdecl) {
                    bemdecl.blocks.must.eql([
                        { name: 'block' },
                        { name: 'block', elems: [{ name: 'elem' }] }
                    ]);
                })
                .then(done, done);
        });

        it('must merge elem with mod of elem', function (done) {
            bundle.runTech(mergeTech, { sources: [
                    'elem.bemdecl.js', 'elem-mod.bemdecl.js'
                ] })
                .then(function (bemdecl) {
                    bemdecl.blocks.must.eql([
                        { name: 'block' },
                        { name: 'block', elems: [{ name: 'elem' }] },
                        { name: 'block', elems: [{ name: 'elem', mods: [
                            { name: 'modName', vals: [{ name: 'modVal' }] }
                        ] }] }
                    ]);
                })
                .then(done, done);
        });

        it('must merge set with empty set', function (done) {
            bundle.runTech(mergeTech, { sources: [
                    'empty.bemdecl.js', 'set.bemdecl.js'
                ] })
                .then(function (bemdecl) {
                    bemdecl.blocks.must.eql([{ name: '1' }, { name: '2' }, { name: '3' }]);
                })
                .then(done, done);
        });

        it('must merge intersecting sets', function (done) {
            bundle.runTech(mergeTech, { sources: [
                    'set.bemdecl.js', 'part.bemdecl.js'
                ] })
                .then(function (bemdecl) {
                    bemdecl.blocks.must.eql([{ name: '1' }, { name: '2' }, { name: '3' }]);
                })
                .then(done, done);
        });

        it('must merge disjoint sets', function (done) {
            bundle.runTech(mergeTech, { sources: [
                    'set.bemdecl.js', 'nonexistent.bemdecl.js'
                ] })
                .then(function (bemdecl) {
                    bemdecl.blocks.must.eql([{ name: '1' }, { name: '2' }, { name: '3' }, { name: 'O_o' }]);
                })
                .then(done, done);
        });
    });
});

function stringify(bemjson) {
    return 'exports.blocks = ' + JSON.stringify(bemjson) + ';';
}
