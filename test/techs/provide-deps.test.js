var path = require('path'),

    mockFs = require('mock-fs'),
    TestNode = require('mock-enb/lib/mock-node'),

    Tech = require('../utils/techs').provideDeps;

describe('techs: provide-deps', function () {
    var fsBundle,
        dataBundle,
        bundle,
        deps = [{ block: 'block' }];

    beforeEach(function () {
        mockFs({
            'fs-bundle': {
                'fs-bundle.deps.js': 'exports.deps = ' + JSON.stringify(deps) + ';'
            },
            'data-bundle': {},
            bundle: {}
        });

        fsBundle = new TestNode('fs-bundle');
        dataBundle = new TestNode('data-bundle');

        bundle = new TestNode('bundle');
        bundle.provideNodeTechData('data-bundle', 'data-bundle.deps.js', { deps: deps });
    });

    afterEach(function () {
        mockFs.restore();
    });

    it('must provide `?.deps.js` target from file', function () {
        return bundle.runTech(Tech, {
                node: 'fs-bundle',
                source: 'fs-bundle.deps.js'
            })
            .then(function (res) {
                res.deps.must.eql(deps);
            });
    });

    it('must provide `?.deps.js` target from data', function () {
        return bundle.runTech(Tech, {
                node: 'data-bundle',
                source: 'data-bundle.deps.js'
            })
            .then(function (res) {
                res.deps.must.eql(deps);
            });
    });

    it('must require `?.deps.js` target from file', function () {
        return bundle.runTechAndRequire(Tech, {
                node: 'fs-bundle',
                source: 'fs-bundle.deps.js'
            })
            .spread(function (res) {
                res.deps.must.eql(deps);
            });
    });

    it('must require `?.deps.js` target from data', function () {
        return bundle.runTechAndRequire(Tech, {
                node: 'data-bundle',
                source: 'data-bundle.deps.js'
            })
            .spread(function (res) {
                res.deps.must.eql(deps);
            });
    });

    it('must provide result from cache', function () {
        mockFs({
            'bundle-1': {
                'bundle-1.deps.js': 'exports.deps = ' + JSON.stringify([{ block: 'block' }]) + ';'
            },
            'bundle-2': {
                'bundle-2.deps.js': 'exports.deps = ' + JSON.stringify([{ block: 'other-block' }]) + ';'
            }
        });

        var bundle = new TestNode('bundle-2'),
            cache = bundle.getNodeCache('bundle-2.deps.js');

        cache.cacheFileInfo('deps-source-file', path.resolve('bundle-1/bundle-1.deps.js'));
        cache.cacheFileInfo('deps-file', path.resolve('bundle-2/bundle-2.deps.js'));

        return bundle.runTech(Tech, { node: 'bundle-1' })
            .then(function (target) {
                target.deps.must.eql([{ block: 'other-block' }]);
            });
    });
});
