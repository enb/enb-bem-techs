var mockFs = require('mock-fs'),
    TestNode = require('enb/lib/test/mocks/test-node'),
    provideTech = require('../../techs/provide-bemdecl');

describe('techs', function () {
    describe('provide-bemdecl', function () {
        var fromFileBundle,
            fromDataBundle,
            toBundle;

        beforeEach(function () {
            mockFs({
                'from-file-bundle': {
                    'from-file-bundle.bemdecl.js': stringify([{ name: 'block' }])
                },
                'from-data-bundle': {},
                'to-bundle': {}
            });

            fromFileBundle = new TestNode('from-file-bundle');
            fromDataBundle = new TestNode('from-data-bundle');

            toBundle = new TestNode('to-bundle');
            toBundle.provideNodeTechData('from-data-bundle', 'from-data-bundle.bemdecl.js', {
                blocks: [{ name: 'block' }]
            });
        });

        afterEach(function () {
            mockFs.restore();
        });

        it('must provide `?.bemdecl.js` target from file', function (done) {
            toBundle.runTech(provideTech, {
                    node: 'from-file-bundle',
                    source: 'from-file-bundle.bemdecl.js' })
                .then(function (bemdecl) {
                    bemdecl.blocks.must.eql([{ name: 'block' }]);
                })
                .then(done, done);
        });

        it('must provide `?.bemdecl.js` target from data', function (done) {
            toBundle.runTech(provideTech, {
                    node: 'from-data-bundle',
                    source: 'from-data-bundle.bemdecl.js' })
                .then(function (bemdecl) {
                    bemdecl.blocks.must.eql([{ name: 'block' }]);
                })
                .then(done, done);
        });

        it('must require `?.bemdecl.js` target from file', function (done) {
            toBundle.runTechAndRequire(provideTech, {
                    node: 'from-file-bundle',
                    source: 'from-file-bundle.bemdecl.js' })
                .spread(function (bemdecl) {
                    bemdecl.blocks.must.eql([{ name: 'block' }]);
                })
                .then(done, done);
        });

        it('must require `?.bemdecl.js` target from data', function (done) {
            toBundle.runTechAndRequire(provideTech, {
                    node: 'from-data-bundle',
                    source: 'from-data-bundle.bemdecl.js' })
                .spread(function (bemdecl) {
                    bemdecl.blocks.must.eql([{ name: 'block' }]);
                })
                .then(done, done);
        });
    });
});

function stringify(bemjson) {
    return 'exports.blocks = ' + JSON.stringify(bemjson) + ';';
}
