var FileSystem = require('enb/lib/test/mocks/test-file-system'),
    TestNode = require('enb/lib/test/mocks/test-node'),
    provideTech = require('../../techs/provide-bemdecl');

describe('techs', function () {
    describe('bemdecl-provider', function () {
        var fileSystem,
            fromFileBundle,
            fromDataBundle,
            toBundle;

        beforeEach(function () {
            fileSystem = new FileSystem([
                {
                    directory: 'from-file-bundle',
                    items: [{
                        file: 'from-file-bundle.bemdecl.js',
                        content: stringify([{ name: 'block' }])
                    }]
                },
                { directory: 'from-data-bundle', items: [] },
                { directory: 'to-bundle', items: [] }
            ]);
            fileSystem.setup();

            fromFileBundle = new TestNode('from-file-bundle');
            fromDataBundle = new TestNode('from-data-bundle');

            toBundle = new TestNode('to-bundle');
            toBundle.provideNodeTechData('from-data-bundle', 'from-data-bundle.bemdecl.js', [{ name: 'block' }]);
        });

        afterEach(function () {
            fileSystem.teardown();
        });

        it('must provide `?.bemdecl.js` target from file', function (done) {
            toBundle.runTech(provideTech, {
                    node: 'from-file-bundle',
                    source: 'from-file-bundle.bemdecl.js' })
                .then(function (bemdecl) {
                    bemdecl.must.eql([{ name: 'block' }]);
                })
                .then(done, done);
        });

        it('must provide `?.bemdecl.js` target from data', function (done) {
            toBundle.runTech(provideTech, {
                    node: 'from-data-bundle',
                    source: 'from-data-bundle.bemdecl.js' })
                .then(function (bemdecl) {
                    bemdecl.must.eql([{ name: 'block' }]);
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
