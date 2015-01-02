var path = require('path'),
    vow = require('vow'),
    mockFs = require('mock-fs'),
    fileList = require('enb/lib/file-list'),
    TestNode = require('enb/lib/test/mocks/test-node'),
    Tech = require('../../techs/merge-deps');

describe('techs', function () {
    describe('merge-deps', function () {
        afterEach(function () {
            mockFs.restore();
        });

        it('must provide result from data', function (done) {
            var sources = [[{ block: 'block' }]],
                deps = [{ block: 'block' }];

            assert(sources, deps, done);
        });

        it('must provide result from cache', function (done) {
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
                cache = bundle.getNodeCache('bundle.deps.js');

            cache.cacheFileInfo('deps-file', path.resolve('bundle', 'bundle.deps.js'));
            cache.cacheFileList('source-file-list', [
                path.resolve('bundle', 'bundle-1.deps.js'),
                path.resolve('bundle', 'bundle-2.deps.js')
            ].map(function (filename) {
                return fileList.getFileInfo(filename);
            }));

            return bundle.runTech(Tech, { sources: ['bundle-1.deps.js', 'bundle-2.deps.js'] })
                .then(function (target) {
                    target.deps.must.eql([{ block: 'other-block' }]);
                })
                .then(done, done);
        });

        it('must support BEMDECL', function (done) {
            var decl1 = [{ name: 'block-1' }],
                decl2 = [{ name: 'block-2' }],
                expected = [
                    { block: 'block-1' },
                    { block: 'block-2' }
                ];

            assert([decl1, decl2], expected, done);
        });

        it('must merge block with mod of block', function (done) {
            var decl1 = [{ block: 'block' }],
                decl2 = [{ block: 'block', mod: 'mod-name', val: 'mod-val' }],
                expected = [
                    { block: 'block' },
                    { block: 'block', mod: 'mod-name', val: 'mod-val' }
                ];

            assert([decl1, decl2], expected, done);
        });

        it('must merge block with elem', function (done) {
            var decl1 = [{ block: 'block' }],
                decl2 = [{ block: 'block', elem: 'elem' }],
                expected = [
                    { block: 'block' },
                    { block: 'block', elem: 'elem' }
                ];

            assert([decl1, decl2], expected, done);
        });

        it('must merge elem with mod of elem', function (done) {
            var decl1 = [{ block: 'block', elem: 'elem' }],
                decl2 = [{ block: 'block', elem: 'elem', mod: 'mod-name', val: 'mod-val' }],
                expected = [
                    { block: 'block', elem: 'elem' },
                    { block: 'block', elem: 'elem', mod: 'mod-name', val: 'mod-val' }
                ];

            assert([decl1, decl2], expected, done);
        });

        it('must merge elems of block', function (done) {
            var decl1 = [{ block: 'block', elem: 'elem-1' }],
                decl2 = [{ block: 'block', elem: 'elem-2' }],
                expected = [
                    { block: 'block', elem: 'elem-1' },
                    { block: 'block', elem: 'elem-2' }
                ];

            assert([decl1, decl2], expected, done);
        });

        it('must merge set with empty set', function (done) {
            var decl1 = [],
                decl2 = [{ block: '1' }, { block: '2' }, { block: '3' }],
                expected = [{ block: '1' }, { block: '2' }, { block: '3' }];

            assert([decl1, decl2], expected, done);
        });

        it('must merge intersecting sets', function (done) {
            var decl1 = [{ block: '1' }, { block: '2' }, { block: '3' }],
                decl2 = [{ block: '2' }],
                expected = [{ block: '1' }, { block: '2' }, { block: '3' }];

            assert([decl1, decl2], expected, done);
        });

        it('must merge disjoint sets', function (done) {
            var decl1 = [{ block: '1' }, { block: '2' }, { block: '3' }],
                decl2 = [{ block: 'O_o' }],
                expected = [{ block: '1' }, { block: '2' }, { block: '3' }, { block: 'O_o' }];

            assert([decl1, decl2], expected, done);
        });
    });
});

function assert(sources, expected, done) {
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
        })
        .then(done, done);
}
