var path = require('path'),

    vow = require('vow'),
    mockFs = require('mock-fs'),
    TestNode = require('mock-enb/lib/mock-node'),

    Tech = require('../..').mergeDeps;

describe('techs: merge-deps', function () {
    afterEach(function () {
        mockFs.restore();
    });

    it('must provide result from data', function () {
        mockFs({
            bundle: {}
        });

        var bundle = new TestNode('bundle');

        bundle.provideTechData('bundle-1.deps.js', { deps: [{ block: 'block-1' }] });
        bundle.provideTechData('bundle-2.deps.js', { deps: [{ block: 'block-2' }] });

        return bundle.runTech(Tech, { sources: ['bundle-1.deps.js', 'bundle-2.deps.js'] })
            .then(function (target) {
                target.deps.must.eql([
                    { block: 'block-1' },
                    { block: 'block-2' }
                ]);
            });
    });

    it('must support deps as array', function () {
        mockFs({
            bundle: {}
        });

        var bundle = new TestNode('bundle');

        bundle.provideTechData('bundle-1.deps.js', [{ block: 'block-1' }]);
        bundle.provideTechData('bundle-2.deps.js', [{ block: 'block-2' }]);

        return bundle.runTech(Tech, { sources: ['bundle-1.deps.js', 'bundle-2.deps.js'] })
            .then(function (target) {
                target.deps.must.eql([
                    { block: 'block-1' },
                    { block: 'block-2' }
                ]);
            });
    });

    it('must provide result from cache', function () {
        mockFs({
            bundle: {
                'bundle.deps.js': 'exports.deps = ' + JSON.stringify([
                    { block: 'other-block' }
                ]) + ';',
                'bundle-1.deps.js': 'exports.deps = ' + JSON.stringify([{ block: 'block-1' }]) + ';',
                'bundle-2.deps.js': 'exports.deps = ' + JSON.stringify([{ block: 'block-2' }]) + ';'
            }
        });

        var bundle = new TestNode('bundle'),
            cache = bundle.getNodeCache('bundle.deps.js'),
            sourcePath1 = path.resolve('bundle', 'bundle-1.deps.js'),
            sourcePath2 = path.resolve('bundle', 'bundle-2.deps.js');

        cache.cacheFileInfo('deps-file', path.resolve('bundle', 'bundle.deps.js'));
        cache.cacheFileInfo(sourcePath1, sourcePath1);
        cache.cacheFileInfo(sourcePath2, sourcePath2);

        return bundle.runTech(Tech, { sources: ['bundle-1.deps.js', 'bundle-2.deps.js'] })
            .then(function (target) {
                target.deps.must.eql([{ block: 'other-block' }]);
            });
    });

    it('must support BEMDECL', function () {
        var decl1 = [{ name: 'block-1' }],
            decl2 = [{ name: 'block-2' }],
            expected = [
                { block: 'block-1' },
                { block: 'block-2' }
            ];

        return assert([decl1, decl2], expected);
    });

    it('must merge block with mod of block', function () {
        var decl1 = [{ block: 'block' }],
            decl2 = [{ block: 'block', mod: 'mod-name', val: 'mod-val' }],
            expected = [
                { block: 'block' },
                { block: 'block', mod: 'mod-name', val: 'mod-val' }
            ];

        return assert([decl1, decl2], expected);
    });

    it('must merge block with elem', function () {
        var decl1 = [{ block: 'block' }],
            decl2 = [{ block: 'block', elem: 'elem' }],
            expected = [
                { block: 'block' },
                { block: 'block', elem: 'elem' }
            ];

        return assert([decl1, decl2], expected);
    });

    it('must merge elem with mod of elem', function () {
        var decl1 = [{ block: 'block', elem: 'elem' }],
            decl2 = [{ block: 'block', elem: 'elem', mod: 'mod-name', val: 'mod-val' }],
            expected = [
                { block: 'block', elem: 'elem' },
                { block: 'block', elem: 'elem', mod: 'mod-name', val: 'mod-val' }
            ];

        return assert([decl1, decl2], expected);
    });

    it('must merge elems of block', function () {
        var decl1 = [{ block: 'block', elem: 'elem-1' }],
            decl2 = [{ block: 'block', elem: 'elem-2' }],
            expected = [
                { block: 'block', elem: 'elem-1' },
                { block: 'block', elem: 'elem-2' }
            ];

        return assert([decl1, decl2], expected);
    });

    it('must merge set with empty set', function () {
        var decl1 = [],
            decl2 = [{ block: '1' }, { block: '2' }, { block: '3' }],
            expected = [{ block: '1' }, { block: '2' }, { block: '3' }];

        return assert([decl1, decl2], expected);
    });

    it('must merge intersecting sets', function () {
        var decl1 = [{ block: '1' }, { block: '2' }, { block: '3' }],
            decl2 = [{ block: '2' }],
            expected = [{ block: '1' }, { block: '2' }, { block: '3' }];

        return assert([decl1, decl2], expected);
    });

    it('must merge disjoint sets', function () {
        var decl1 = [{ block: '1' }, { block: '2' }, { block: '3' }],
            decl2 = [{ block: 'O_o' }],
            expected = [{ block: '1' }, { block: '2' }, { block: '3' }, { block: 'O_o' }];

        return assert([decl1, decl2], expected);
    });
});

function assert(sources, expected) {
    var bundle,
        dir = {},
        options = { sources: [] };

    sources.forEach(function (deps, i) {
        var target = i + '.deps.js',

            isBemdecl = !!deps && deps.length && deps[0].name;

        dir[target] = isBemdecl ? 'exports.blocks = ' + JSON.stringify(deps) + ';' :
            'exports.deps = ' + JSON.stringify(deps) + ';';
        options.sources.push(target);
    });

    mockFs({ bundle: dir });
    bundle = (new TestNode('bundle'));

    return vow.all([
            bundle.runTechAndGetResults(Tech, options),
            bundle.runTechAndRequire(Tech, options)
        ])
        .spread(function (target1, target2) {
            target1['bundle.deps.js'].deps.must.eql(expected);
            target2[0].deps.must.eql(expected);
        });
}
