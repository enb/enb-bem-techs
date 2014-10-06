var mockFs = require('mock-fs'),
    TestNode = require('enb/lib/test/mocks/test-node'),
    Tech = require('../../techs/provide-deps');

describe('techs', function () {
    describe('provide-deps', function () {
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

        it('must provide `?.deps.js` target from file', function (done) {
            bundle.runTech(Tech, {
                    node: 'fs-bundle',
                    source: 'fs-bundle.deps.js' })
                .then(function (res) {
                    res.deps.must.eql(deps);
                })
                .then(done, done);
        });

        it('must provide `?.deps.js` target from data', function (done) {
            bundle.runTech(Tech, {
                    node: 'data-bundle',
                    source: 'data-bundle.deps.js' })
                .then(function (res) {
                    res.deps.must.eql(deps);
                })
                .then(done, done);
        });

        it('must require `?.deps.js` target from file', function (done) {
            bundle.runTechAndRequire(Tech, {
                    node: 'fs-bundle',
                    source: 'fs-bundle.deps.js' })
                .spread(function (res) {
                    res.deps.must.eql(deps);
                })
                .then(done, done);
        });

        it('must require `?.deps.js` target from data', function (done) {
            bundle.runTechAndRequire(Tech, {
                    node: 'data-bundle',
                    source: 'data-bundle.deps.js' })
                .spread(function (res) {
                    res.deps.must.eql(deps);
                })
                .then(done, done);
        });
    });
});
