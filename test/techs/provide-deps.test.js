var mockFs = require('mock-fs'),
    TestNode = require('enb/lib/test/mocks/test-node'),
    provideTech = require('../../techs/provide-deps');

describe('techs', function () {
    describe('provide-deps', function () {
        var fromFileBundle,
            fromDataBundle,
            toBundle;

        beforeEach(function () {
            mockFs({
                'from-file-bundle': {
                    'from-file-bundle.deps.js': stringify([{ block: 'block' }])
                },
                'from-data-bundle': {},
                'to-bundle': {}
            });

            fromFileBundle = new TestNode('from-file-bundle');
            fromDataBundle = new TestNode('from-data-bundle');

            toBundle = new TestNode('to-bundle');
            toBundle.provideNodeTechData('from-data-bundle', 'from-data-bundle.deps.js', {
                deps: [{ block: 'block' }]
            });
        });

        afterEach(function () {
            mockFs.restore();
        });

        it('must provide `?.deps.js` target from file', function (done) {
            toBundle.runTech(provideTech, {
                    node: 'from-file-bundle',
                    source: 'from-file-bundle.deps.js' })
                .then(function (res) {
                    res.deps.must.eql([{ block: 'block' }]);
                })
                .then(done, done);
        });

        it('must provide `?.deps.js` target from data', function (done) {
            toBundle.runTech(provideTech, {
                    node: 'from-data-bundle',
                    source: 'from-data-bundle.deps.js' })
                .then(function (res) {
                    res.deps.must.eql([{ block: 'block' }]);
                })
                .then(done, done);
        });

        it('must require `?.deps.js` target from file', function (done) {
            toBundle.runTechAndRequire(provideTech, {
                    node: 'from-file-bundle',
                    source: 'from-file-bundle.deps.js' })
                .spread(function (res) {
                    res.deps.must.eql([{ block: 'block' }]);
                })
                .then(done, done);
        });

        it('must require `?.deps.js` target from data', function (done) {
            toBundle.runTechAndRequire(provideTech, {
                    node: 'from-data-bundle',
                    source: 'from-data-bundle.deps.js' })
                .spread(function (res) {
                    res.deps.must.eql([{ block: 'block' }]);
                })
                .then(done, done);
        });
    });
});

function stringify(bemjson) {
    return 'exports.deps = ' + JSON.stringify(bemjson) + ';';
}
