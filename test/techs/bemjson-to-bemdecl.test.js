var path = require('path'),

    vow = require('vow'),
    mockFs = require('mock-fs'),
    TestNode = require('mock-enb/lib/mock-node'),

    Tech = require('../..').bemjsonToBemdecl;

describe('techs: bemjson-to-bemdecl', function () {
    afterEach(function () {
        mockFs.restore();
    });

    it('must support deps format', function () {
        var bemjson = { block: 'block' },
            bemdecl = [{ block: 'block' }];

        return assert(bemjson, bemdecl, { bemdeclFormat: 'deps' });
    });

    it('must detect block', function () {
        var bemjson = { block: 'block' },
            bemdecl = [{ name: 'block' }];

        return assert(bemjson, bemdecl);
    });

    it('must detect boolean mod of block', function () {
        var bemjson = { block: 'block', mods: { mod: true } },
            bemdecl = [
                { name: 'block' },
                { name: 'block', mods: [{ name: 'mod', vals: [{ name: true }] }] }
            ];

        return assert(bemjson, bemdecl);
    });

    it('must detect mod of block', function () {
        var bemjson = { block: 'block', mods: { 'mod-name': 'mod-val' } },
            bemdecl = [
                { name: 'block' },
                { name: 'block', mods: [{ name: 'mod-name', vals: [{ name: 'mod-val' }] }] }
            ];

        return assert(bemjson, bemdecl);
    });

    it('must detect elem of block', function () {
        var bemjson = { block: 'block', elem: 'elem' },
            bemdecl = [{ name: 'block', elems: [{ name: 'elem' }] }];

        return assert(bemjson, bemdecl);
    });

    it('must detect boolean mod of elem', function () {
        var bemjson = { block: 'block', elem: 'elem', elemMods: { mod: true } },
            bemdecl = [
                { name: 'block', elems: [{ name: 'elem' }] },
                { name: 'block', elems: [{ name: 'elem', mods: [{ name: 'mod', vals: [{ name: true }] }] }] }
            ];

        return assert(bemjson, bemdecl);
    });

    it('must detect boolean mod of elem', function () {
        var bemjson = { block: 'block', elem: 'elem', elemMods: { 'mod-name': 'mod-val' } },
            bemdecl = [
                { name: 'block', elems: [{ name: 'elem' }] },
                { name: 'block', elems: [{ name: 'elem', mods: [
                    { name: 'mod-name', vals: [{ name: 'mod-val' }] }]
                }] }
            ];

        return assert(bemjson, bemdecl);
    });

    it('must detect block in custom field', function () {
        var bemjson = { custom: { block: 'block' } },
            bemdecl = [{ name: 'block' }];

        return assert(bemjson, bemdecl);
    });

    it('must detect blocks in deep custom field', function () {
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

        return assert(bemjson, bemdecl);
    });

    it('must not detect block in attrs', function () {
        var bemjson = { attrs: { block: 'block' } },
            bemdecl = [];

        return assert(bemjson, bemdecl);
    });

    it('must not detect block in js', function () {
        var bemjson = { js: { block: 'block' } },
            bemdecl = [];

        return assert(bemjson, bemdecl);
    });

    it('must not fail when entity equals undefined', function () {
        var bemjson = [undefined],
            bemdecl = [];

        return assert(bemjson, bemdecl);
    });

    it('must detect nested block', function () {
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

        return assert(bemjson, bemdecl);
    });

    it('must detect nested elem', function () {
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

        return assert(bemjson, bemdecl);
    });

    it('must detect duplicate block', function () {
        var bemjson = [
                { block: 'block' },
                { block: 'block' }
            ],
            bemdecl = [
                { name: 'block' }
            ];

        return assert(bemjson, bemdecl);
    });

    it('must detect duplicate block', function () {
        var bemjson = [
                { block: 'block', elem: 'elem' },
                { block: 'block', elem: 'elem' }
            ],
            bemdecl = [
                { name: 'block', elems: [{ name: 'elem' }] }
            ];

        return assert(bemjson, bemdecl);
    });

    it('must detect duplicate mod of block', function () {
        var bemjson = [
                { block: 'block', mods: { 'mod-name': 'mod-val' } },
                { block: 'block', mods: { 'mod-name': 'mod-val' } }
            ],
            bemdecl = [
                { name: 'block' },
                { name: 'block', mods: [{ name: 'mod-name', vals: [{ name: 'mod-val' }] }] }
            ];

        return assert(bemjson, bemdecl);
    });

    it('must provide result from cache', function () {
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
            });
    });
});

function assert(bemjson, bemdecl, options) {
    options || (options = {});

    mockFs({
        bundle: {
            'bundle.bemjson.js': '(' + JSON.stringify(bemjson) + ')'
        }
    });

    var bundle = new TestNode('bundle');

    return vow.all([
            bundle.runTechAndGetResults(Tech, options),
            bundle.runTechAndRequire(Tech, options)
        ])
        .spread(function (data, target) {
            var isDepsFormat = options.bemdeclFormat === 'deps',
                actualDecl = isDepsFormat ? data['bundle.bemdecl.js'].deps : data['bundle.bemdecl.js'].blocks,
                actualData = isDepsFormat ? target[0].deps : target[0].blocks;

            actualDecl.must.eql(bemdecl);
            actualData.must.eql(bemdecl);
        });
}
