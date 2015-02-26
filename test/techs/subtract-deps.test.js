var path = require('path'),
    vow = require('vow'),
    mockFs = require('mock-fs'),
    TestNode = require('enb/lib/test/mocks/test-node'),
    Tech = require('../../techs/subtract-deps');

describe('techs', function () {
    describe('subtract-deps', function () {
        afterEach(function () {
            mockFs.restore();
        });

        it('must provide result from cache', function (done) {
            mockFs({
                bundle: {
                    'bundle.deps.js': 'exports.deps = ' + JSON.stringify([{ block: 'other-block' }]) + ';',
                    'bundle-1.deps.js': 'exports.deps = ' + JSON.stringify([{ block: 'block-1' }]) + ';',
                    'bundle-2.deps.js': 'exports.deps = ' + JSON.stringify([{ block: 'block-1' }]) + ';'
                }
            });

            var bundle = new TestNode('bundle'),
                cache = bundle.getNodeCache('bundle.deps.js');

            cache.cacheFileInfo('deps-file', path.resolve('bundle/bundle.deps.js'));
            cache.cacheFileInfo('deps-from-file', path.resolve('bundle/bundle-1.deps.js'));
            cache.cacheFileInfo('deps-what-file', path.resolve('bundle/bundle-2.deps.js'));

            return bundle.runTech(Tech, { from: 'bundle-1.deps.js', what: 'bundle-2.deps.js' })
                .then(function (target) {
                    target.deps.must.eql([{ block: 'other-block' }]);
                })
                .then(done, done);
        });

        it('must support deps as array', function (done) {
            mockFs({
                bundle: {}
            });

            var bundle = new TestNode('bundle');

            bundle.provideTechData('bundle-1.deps.js', [{ block: 'block' }]);
            bundle.provideTechData('bundle-2.deps.js', [{ block: 'block' }]);

            return bundle.runTech(Tech, { from: 'bundle-1.deps.js', what: 'bundle-2.deps.js' })
                .then(function (target) {
                    target.deps.must.eql([]);
                })
                .then(done, done);
        });

        it('must subtract block from block', function (done) {
            var from = [{ block: 'block' }],
                what = [{ block: 'block' }],
                expected = [];

            assert(from, what, expected, done);
        });

        it('must subtract elem from block', function (done) {
            var from = [{ block: 'block' }],
                what = [{ block: 'block', elem: 'elem' }],
                expected = [{ block: 'block' }];

            assert(from, what, expected, done);
        });

        it('must subtract mod of block from block', function (done) {
            var from = [{ block: 'block' }],
                what = [{ block: 'block', mod: 'mod-name', val: 'mod-val' }],
                expected = [{ block: 'block' }];

            assert(from, what, expected, done);
        });

        it('must subtract elem from elem', function (done) {
            var from = [{ block: 'block', elem: 'elem' }],
                what = [{ block: 'block', elem: 'elem' }],
                expected = [];

            assert(from, what, expected, done);
        });

        it('must subtract mod of elem from elem', function (done) {
            var from = [{ block: 'block', elem: 'elem' }],
                what = [{ block: 'block', elem: 'elem', mod: 'mod-name', val: 'mod-val' }],
                expected = [{ block: 'block', elem: 'elem' }];

            assert(from, what, expected, done);
        });

        it('must subtract nonexistent item from set', function (done) {
            var from = [{ block: '1' }, { block: '2' }, { block: '3' }],
                what = [{ block: 'O_o' }],
                expected = [{ block: '1' }, { block: '2' }, { block: '3' }];

            assert(from, what, expected, done);
        });

        it('must subtract empty set from nonempty set', function (done) {
            var from = [{ block: '1' }, { block: '2' }, { block: '3' }],
                what = [],
                expected = [{ block: '1' }, { block: '2' }, { block: '3' }];

            assert(from, what, expected, done);
        });

        it('must subtract set from empty set', function (done) {
            var from = [],
                what = [{ block: '1' }, { block: '2' }, { block: '3' }],
                expected = [];

            assert(from, what, expected, done);
        });

        it('must subtract disjoint set', function (done) {
            var from = [{ block: '1' }, { block: '2' }, { block: '3' }],
                what = [{ block: '2' }],
                expected = [{ block: '1' }, { block: '3' }];

            assert(from, what, expected, done);
        });
    });
});

function assert(from, what, expected, done) {
    mockFs({
        'fs-bundle': {
            'from.deps.js': 'exports.deps = ' + JSON.stringify(from) + ';',
            'what.deps.js': 'exports.deps = ' + JSON.stringify(what) + ';'
        },
        'data-bundle': {}
    });

    var fsBundle = new TestNode('fs-bundle'),
        dataBundle = (new TestNode('data-bundle')),
        options = { from: 'from.deps.js', what: 'what.deps.js' };

    dataBundle.provideTechData('from.deps.js', { deps: from });
    dataBundle.provideTechData('what.deps.js', { deps: what });

    return vow.all([
            fsBundle.runTechAndGetResults(Tech, options),
            fsBundle.runTechAndRequire(Tech, options),
            dataBundle.runTechAndGetResults(Tech, options),
            dataBundle.runTechAndRequire(Tech, options)
        ])
        .spread(function (data1, target1, data2, target2) {
            data1['fs-bundle.deps.js'].deps.must.eql(expected);
            target1[0].deps.must.eql(expected);
            data2['data-bundle.deps.js'].deps.must.eql(expected);
            target2[0].deps.must.eql(expected);
        })
        .then(done, done);
}
