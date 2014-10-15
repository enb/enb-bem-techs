var path = require('path'),
    mockFs = require('mock-fs'),
    TestNode = require('enb/lib/test/mocks/test-node'),
    Tech = require('../../techs/provide-bemdecl');

describe('techs', function () {
    describe('provide-deps', function () {
        var fsBundle,
            dataBundle,
            bundle,
            bemdecl = [{ name: 'block' }];

        beforeEach(function () {
            mockFs({
                'fs-bundle': {
                    'fs-bundle.bemdecl.js': 'exports.blocks = ' + JSON.stringify(bemdecl) + ';'
                },
                'data-bundle': {},
                bundle: {}
            });

            fsBundle = new TestNode('fs-bundle');
            dataBundle = new TestNode('data-bundle');

            bundle = new TestNode('bundle');
            bundle.provideNodeTechData('data-bundle', 'data-bundle.bemdecl.js', { blocks: bemdecl });
        });

        afterEach(function () {
            mockFs.restore();
        });

        it('must provide `?.bemdecl.js` target from file', function (done) {
            bundle.runTech(Tech, {
                node: 'fs-bundle',
                source: 'fs-bundle.bemdecl.js' })
                .then(function (res) {
                    res.blocks.must.eql(bemdecl);
                })
                .then(done, done);
        });

        it('must provide `?.bemdecl.js` target from data', function (done) {
            bundle.runTech(Tech, {
                node: 'data-bundle',
                source: 'data-bundle.bemdecl.js' })
                .then(function (res) {
                    res.blocks.must.eql(bemdecl);
                })
                .then(done, done);
        });

        it('must require `?.bemdecl.js` target from file', function (done) {
            bundle.runTechAndRequire(Tech, {
                node: 'fs-bundle',
                source: 'fs-bundle.bemdecl.js' })
                .spread(function (res) {
                    res.blocks.must.eql(bemdecl);
                })
                .then(done, done);
        });

        it('must require `?.deps.js` target from data', function (done) {
            bundle.runTechAndRequire(Tech, {
                node: 'data-bundle',
                source: 'data-bundle.bemdecl.js' })
                .spread(function (res) {
                    res.blocks.must.eql(bemdecl);
                })
                .then(done, done);
        });

        it('must provide result from cache', function (done) {
            mockFs({
                'bundle-1': {
                    'bundle-1.bemdecl.js': 'exports.blocks = ' + JSON.stringify([{ block: 'block' }]) + ';'
                },
                'bundle-2': {
                    'bundle-2.bemdecl.js': 'exports.blocks = ' + JSON.stringify([{ block: 'block' }]) + ';'
                }
            });

            var bundle = new TestNode('bundle-2'),
                cache = bundle.getNodeCache('bundle-2.bemdecl.js');

            cache.cacheFileInfo('bemdecl-source-file', path.resolve('bundle-1/bundle-1.bemdecl.js'));
            cache.cacheFileInfo('bemdecl-file', path.resolve('bundle-2/bundle-2.bemdecl.js'));

            return bundle.runTech(Tech, { node: 'bundle-1' })
                .then(function (target) {
                    target.blocks.must.eql([{ block: 'block' }]);
                })
                .then(done, done);
        });
    });
});
