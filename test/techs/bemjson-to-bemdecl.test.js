var path = require('path'),
    vow = require('vow'),
    mockFs = require('mock-fs'),
    TestNode = require('enb/lib/test/mocks/test-node'),
    Tech = require('../../techs/bemjson-to-bemdecl');

describe('techs', function () {
    describe('bemdecl-from-bemjson', function () {
        afterEach(function () {
            mockFs.restore();
        });

        it('must detect block', function (done) {
            var bemjson = { block: 'block' },
                bemdecl = [{ name: 'block' }];

            assert(bemjson, bemdecl, done);
        });

        it('must detect boolean mod of block', function (done) {
            var bemjson = { block: 'block', mods: { mod: true } },
                bemdecl = [
                    { name: 'block' },
                    { name: 'block', mods: [{ name: 'mod', vals: [{ name: true }] }] }
                ];

            assert(bemjson, bemdecl, done);
        });

        it('must detect mod of block', function (done) {
            var bemjson = { block: 'block', mods: { 'mod-name': 'mod-val' } },
                bemdecl = [
                    { name: 'block' },
                    { name: 'block', mods: [{ name: 'mod-name', vals: [{ name: 'mod-val' }] }] }
                ];

            assert(bemjson, bemdecl, done);
        });

        it('must detect elem of block', function (done) {
            var bemjson = { block: 'block', elem: 'elem' },
                bemdecl = [{ name: 'block', elems: [{ name: 'elem' }] }];

            assert(bemjson, bemdecl, done);
        });

        it('must detect boolean mod of elem', function (done) {
            var bemjson = { block: 'block', elem: 'elem', elemMods: { mod: true } },
                bemdecl = [
                    { name: 'block', elems: [{ name: 'elem' }] },
                    { name: 'block', elems: [{ name: 'elem', mods: [{ name: 'mod', vals: [{ name: true }] }] }] }
                ];

            assert(bemjson, bemdecl, done);
        });

        it('must detect boolean mod of elem', function (done) {
            var bemjson = { block: 'block', elem: 'elem', elemMods: { 'mod-name': 'mod-val' } },
                bemdecl = [
                    { name: 'block', elems: [{ name: 'elem' }] },
                    { name: 'block', elems: [{ name: 'elem', mods: [
                        { name: 'mod-name', vals: [{ name: 'mod-val' }] }]
                    }] }
                ];

            assert(bemjson, bemdecl, done);
        });

        it('must detect block in custom field', function (done) {
            var bemjson = { custom: { block: 'block' } },
                bemdecl = [{ name: 'block' }];

            assert(bemjson, bemdecl, done);
        });

        it('must detect blocks in deep custom field', function (done) {
            var bemjson = {
                    custom: {
                        one: { block: 'block-1' },
                        two: { block: 'block-2' }
                    }
                },
                bemdecl = [
                    { name: 'block-1' },
                    { name: 'block-2' }
                ];

            assert(bemjson, bemdecl, done);
        });

        it('must not detect block in attrs', function (done) {
            var bemjson = { attrs: { block: 'block' } },
                bemdecl = [];

            assert(bemjson, bemdecl, done);
        });

        it('must not detect block in js', function (done) {
            var bemjson = { js: { block: 'block' } },
                bemdecl = [];

            assert(bemjson, bemdecl, done);
        });

        it('must not fail when entity equals undefined', function (done) {
            var bemjson = [undefined],
                bemdecl = [];

            assert(bemjson, bemdecl, done);
        });

        it('must detect nested block', function (done) {
            var bemjson = {
                    block: 'block-1',
                    content: [
                        { block: 'block-2' }
                    ]
                },
                bemdecl = [
                    { name: 'block-1' },
                    { name: 'block-2' }
                ];

            assert(bemjson, bemdecl, done);
        });

        it('must detect nested elem', function (done) {
            var bemjson = {
                    block: 'block',
                    content: [
                        { elem: 'elem' }
                    ]
                },
                bemdecl = [
                    { name: 'block' },
                    { name: 'block', elems: [{ name: 'elem' }] }
                ];

            assert(bemjson, bemdecl, done);
        });

        it('must detect duplicate block', function (done) {
            var bemjson = [
                    { block: 'block' },
                    { block: 'block' }
                ],
                bemdecl = [
                    { name: 'block' }
                ];

            assert(bemjson, bemdecl, done);
        });

        it('must detect duplicate block', function (done) {
            var bemjson = [
                    { block: 'block', elem: 'elem' },
                    { block: 'block', elem: 'elem' }
                ],
                bemdecl = [
                    { name: 'block', elems: [{ name: 'elem' }] }
                ];

            assert(bemjson, bemdecl, done);
        });

        it('must detect duplicate mod of block', function (done) {
            var bemjson = [
                    { block: 'block', mods: { 'mod-name': 'mod-val' } },
                    { block: 'block', mods: { 'mod-name': 'mod-val' } }
                ],
                bemdecl = [
                    { name: 'block' },
                    { name: 'block', mods: [{ name: 'mod-name', vals: [{ name: 'mod-val' }] }] }
                ];

            assert(bemjson, bemdecl, done);
        });

        it('must provide result from cache', function (done) {
            var bemjson = [
                    { block: 'block' }
                ],
                bemdecl = [
                    { name: 'other-block' }
                ];

            mockFs({
                bundle: {
                    'bundle.bemjson.js': '(' + JSON.stringify(bemjson) + ')',
                    'bundle.bemdecl.js': 'exports.blocks = ' + JSON.stringify(bemdecl) + ';'
                }
            });

            var bundle = new TestNode('bundle'),
                cache = bundle.getNodeCache('bundle.bemdecl.js');

            cache.cacheFileInfo('bemdecl-file', path.resolve('bundle/bundle.bemdecl.js'));
            cache.cacheFileInfo('bemjson-file', path.resolve('bundle/bundle.bemjson.js'));

            return bundle.runTechAndRequire(Tech)
                .then(function (target) {
                    target[0].blocks.must.eql(bemdecl);
                })
                .then(done, done);
        });
    });
});

function assert(bemjson, bemdecl, done) {
    mockFs({
        bundle: {
            'bundle.bemjson.js': '(' + JSON.stringify(bemjson) + ')'
        }
    });

    var bundle = new TestNode('bundle');

    return vow.all([
            bundle.runTechAndGetResults(Tech),
            bundle.runTechAndRequire(Tech)
        ])
        .spread(function (data, target) {
            data['bundle.bemdecl.js'].blocks.must.eql(bemdecl);
            target[0].blocks.must.eql(bemdecl);
        })
        .then(done, done);
}
