var mockFs = require('mock-fs'),
    TestNode = require('enb/lib/test/mocks/test-node'),
    bemdeclTech = require('../../techs/bemjson-to-bemdecl');

describe('techs', function () {
    describe('bemdecl-from-bemjson', function () {
        var bundle;

        beforeEach(function () {
            mockFs({
                bundle: {
                    'block.bemjson.js': stringify({ block: 'block' }),
                    'block-bool-mod.bemjson.js': stringify({ block: 'block', mods: { mod: true } }),
                    'block-mod.bemjson.js': stringify({ block: 'block', mods: { modName: 'modVal' } }),
                    'elem.bemjson.js': stringify({ block: 'block', elem: 'elem' }),
                    'elem-bool-mod.bemjson.js': stringify({ block: 'block', elem: 'elem', elemMods: { mod: true } }),
                    'elem-mod.bemjson.js': stringify({ block: 'block', elem: 'elem', elemMods: { modName: 'modVal' } }),
                    'attrs.bemjson.js': stringify({ attrs: {
                        block: 'block',
                        mods: { mod: true, modName: 'modVal' },
                        elem: 'elem' },
                        elemMods: { mod: true, modName: 'modVal' }
                    }),
                    'custom.bemjson.js': stringify({ custom: { block: 'block' } }),
                    'deep-custom.bemjson.js': stringify({
                        custom: {
                            one: { block: 'block-1' },
                            two: { block: 'block-2' }
                        }
                    }),
                    'undefined.bemjson.js': stringify([undefined])
                }
            });

            bundle = new TestNode('bundle');
        });

        afterEach(function () {
            mockFs.restore();
        });

        it('must require result', function (done) {
            bundle.runTechAndRequire(bemdeclTech, { source: 'block.bemjson.js' })
                .spread(function (bemdecl) {
                    bemdecl.blocks.must.eql([{ name: 'block' }]);
                })
                .then(done, done);
        });

        it('must detect block', function (done) {
            bundle.runTech(bemdeclTech, { source: 'block.bemjson.js' })
                .then(function (bemdecl) {
                    bemdecl.blocks.must.eql([{ name: 'block' }]);
                })
                .then(done, done);
        });

        it('must detect boolean mod of block', function (done) {
            bundle.runTech(bemdeclTech, { source: 'block-bool-mod.bemjson.js' })
                .then(function (bemdecl) {
                    bemdecl.blocks.must.eql([
                        { name: 'block' },
                        { name: 'block', mods: [{ name: 'mod', vals: [{ name: true }] }] }
                    ]);
                })
                .then(done, done);
        });

        it('must detect mod of block', function (done) {
            bundle.runTech(bemdeclTech, { source: 'block-mod.bemjson.js' })
                .then(function (bemdecl) {
                    bemdecl.blocks.must.eql([
                        { name: 'block' },
                        { name: 'block', mods: [{ name: 'modName', vals: [{ name: 'modVal' }] }] }
                    ]);
                })
                .then(done, done);
        });

        it('must detect elem of block', function (done) {
            bundle.runTech(bemdeclTech, { source: 'elem.bemjson.js' })
                .then(function (bemdecl) {
                    bemdecl.blocks.must.eql([{ name: 'block', elems: [{ name: 'elem' }] }]);
                })
                .then(done, done);
        });

        it('must detect bool mod of elem', function (done) {
            bundle.runTech(bemdeclTech, { source: 'elem-bool-mod.bemjson.js' })
                .then(function (bemdecl) {
                    bemdecl.blocks.must.eql([
                        { name: 'block', elems: [{ name: 'elem' }] },
                        { name: 'block', elems: [{ name: 'elem', mods: [{ name: 'mod', vals: [{ name: true }] }] }] }
                    ]);
                })
                .then(done, done);
        });

        it('must detect mod of elem', function (done) {
            bundle.runTech(bemdeclTech, { source: 'elem-mod.bemjson.js' })
                .then(function (bemdecl) {
                    bemdecl.blocks.must.eql([
                        { name: 'block', elems: [{ name: 'elem' }] },
                        { name: 'block', elems: [{ name: 'elem', mods: [
                            { name: 'modName', vals: [{ name: 'modVal' }] }
                        ] }] }
                    ]);
                })
                .then(done, done);
        });

        it('must detect block in custom field', function (done) {
            bundle.runTech(bemdeclTech, { source: 'custom.bemjson.js' })
                .then(function (bemdecl) {
                    bemdecl.blocks.must.eql([{ name: 'block' }]);
                })
                .then(done, done);
        });

        it('must detect blocks in deep custom field', function (done) {
            bundle.runTech(bemdeclTech, { source: 'deep-custom.bemjson.js' })
                .then(function (bemdecl) {
                    bemdecl.blocks.must.eql([
                        { name: 'block-1' },
                        { name: 'block-2' }
                    ]);
                })
                .then(done, done);
        });

        it('must not fail when entity equals undefined', function (done) {
            bundle.runTech(bemdeclTech, { source: 'undefined.bemjson.js' })
                .then(function (bemdecl) {
                    bemdecl.blocks.must.eql([]);
                })
                .then(done, done);
        });
    });
});

function stringify(bemjson) {
    return '(' + JSON.stringify(bemjson) + ')';
}
