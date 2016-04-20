var path = require('path'),

    vow = require('vow'),
    mockFs = require('mock-fs'),
    TestNode = require('mock-enb/lib/mock-node'),

    Tech = require('../utils/techs').mergeBemdecl;

describe('techs: merge-bemdecl', function () {
    afterEach(function () {
        mockFs.restore();
    });

    it('must provide result', function () {
        var sources = [[{ name: 'block' }]],
            bemdecl = [{ name: 'block' }];

        return assert(sources, bemdecl);
    });

    it('must provide result from cache', function () {
        mockFs({
            bundle: {
                'bundle.bemdecl.js': 'exports.blocks = ' + JSON.stringify([
                    { name: 'other-block' }
                ]) + ';',
                'bundle-1.bemdecl.js': 'exports.blocks = ' + JSON.stringify([{ name: 'block-1' }]) + ';',
                'bundle-2.bemdecl.js': 'exports.blocks = ' + JSON.stringify([{ name: 'block-2' }]) + ';'
            }
        });

        var bundle = new TestNode('bundle'),
            cache = bundle.getNodeCache('bundle.bemdecl.js'),
            sourcePath1 = path.resolve('bundle', 'bundle-1.bemdecl.js'),
            sourcePath2 = path.resolve('bundle', 'bundle-2.bemdecl.js');

        cache.cacheFileInfo('bemdecl-file', path.resolve('bundle', 'bundle.bemdecl.js'));
        cache.cacheFileInfo(sourcePath1, sourcePath1);
        cache.cacheFileInfo(sourcePath2, sourcePath2);

        return bundle.runTech(Tech, { sources: ['bundle-1.bemdecl.js', 'bundle-2.bemdecl.js'] })
            .then(function (target) {
                target.blocks.must.eql([{ name: 'other-block' }]);
            });
    });

    it('must support mods without vals', function () {
        var bemdecl1 = [{
                name: 'block-1',
                mods: [{ name: 'mod' }]
            }],
            bemdecl2 = [{
                name: 'block-2'
            }],
            exepted = [
                { name: 'block-1' },
                { name: 'block-1', mods: [{ name: 'mod' }] },
                { name: 'block-2' }
            ];

        return assert([bemdecl1, bemdecl2], exepted);
    });

    it('must merge block with mod of block', function () {
        var bemdecl1 = [{ name: 'block' }],
            bemdecl2 = [{
                name: 'block',
                mods: [{ name: 'mod-name', vals: [{ name: 'mod-val' }] }]
            }],
            exepted = [
                { name: 'block' },
                { name: 'block', mods: [{ name: 'mod-name', vals: [{ name: 'mod-val' }] }] }
            ];

        return assert([bemdecl1, bemdecl2], exepted);
    });

    it('must merge block with elem', function () {
        var bemdecl1 = [{ name: 'block' }],
            bemdecl2 = [{
                name: 'block',
                elems: [{ name: 'elem' }]
            }],
            exepted = [
                { name: 'block' },
                { name: 'block', elems: [{ name: 'elem' }] }
            ];

        return assert([bemdecl1, bemdecl2], exepted);
    });

    it('must merge elem with mod of elem', function () {
        var bemdecl1 = [{
                name: 'block',
                elems: [{ name: 'elem' }]
            }],
            bemdecl2 = [{
                name: 'block',
                elems: [{ name: 'elem', mods: [{ name: 'modName', vals: [{ name: 'modVal' }] }] }]
            }],
            exepted = [
                { name: 'block' },
                { name: 'block', elems: [{ name: 'elem' }] },
                { name: 'block', elems: [{ name: 'elem', mods: [
                    { name: 'modName', vals: [{ name: 'modVal' }] }
                ] }] }
            ];

        return assert([bemdecl1, bemdecl2], exepted);
    });

    it('must merge elems of block', function () {
        var bemdecl1 = [{
                name: 'block',
                elems: [{ name: 'elem-1' }]
            }],
            bemdecl2 = [{
                name: 'block',
                elems: [{ name: 'elem-2' }]
            }],
            exepted = [
                { name: 'block' },
                { name: 'block', elems: [{ name: 'elem-1' }] },
                { name: 'block', elems: [{ name: 'elem-2' }] }
            ];

        return assert([bemdecl1, bemdecl2], exepted);
    });

    it('must merge set with empty set', function () {
        var bemdecl1 = [],
            bemdecl2 = [{ name: '1' }, { name: '2' }, { name: '3' }],
            exepted = [{ name: '1' }, { name: '2' }, { name: '3' }];

        return assert([bemdecl1, bemdecl2], exepted);
    });

    it('must merge intersecting sets', function () {
        var bemdecl1 = [{ name: '1' }, { name: '2' }, { name: '3' }],
            bemdecl2 = [{ name: '2' }],
            exepted = [{ name: '1' }, { name: '2' }, { name: '3' }];

        return assert([bemdecl1, bemdecl2], exepted);
    });

    it('must merge disjoint sets', function () {
        var bemdecl1 = [{ name: '1' }, { name: '2' }, { name: '3' }],
            bemdecl2 = [{ name: 'O_o' }],
            exepted = [{ name: '1' }, { name: '2' }, { name: '3' }, { name: 'O_o' }];

        return assert([bemdecl1, bemdecl2], exepted);
    });
});

function assert(sources, expected) {
    var bundle,
        dir = {},
        options = { sources: [] };

    sources.forEach(function (bemdecl, i) {
        var target = i + '.bemdecl.js';

        dir[target] = 'exports.blocks = ' + JSON.stringify(bemdecl) + ';';
        options.sources.push(target);
    });

    mockFs({ bundle: dir });
    bundle = (new TestNode('bundle'));

    return vow.all([
            bundle.runTechAndGetResults(Tech, options),
            bundle.runTechAndRequire(Tech, options)
        ])
        .spread(function (target1, target2) {
            target1['bundle.bemdecl.js'].blocks.must.eql(expected);
            target2[0].blocks.must.eql(expected);
        });
}
