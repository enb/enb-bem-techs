var FileSystem = require('enb/lib/test/mocks/test-file-system');
var TestNode = require('enb/lib/test/mocks/test-node');
var provideTech = require('../../techs/deps-provider');

describe('techs', function () {
    describe('deps-provider', function () {
        var fileSystem;
        var fromFileBundle;
        var fromDataBundle;
        var toBundle;

        beforeEach(function () {
            fileSystem = new FileSystem([
                {
                    directory: 'from-file-bundle',
                    items: [{
                        file: 'from-file-bundle.deps.js',
                        content: stringify([{ block: 'block' }])
                    }]
                },
                { directory: 'from-data-bundle', items: [] },
                { directory: 'to-bundle', items: [] }
            ]);
            fileSystem.setup();

            fromFileBundle = new TestNode('from-file-bundle');
            fromDataBundle = new TestNode('from-data-bundle');

            toBundle = new TestNode('to-bundle');
            toBundle.provideNodeTechData('from-data-bundle', 'from-data-bundle.deps.js', [{ block: 'block' }]);
        });

        afterEach(function () {
            fileSystem.teardown();
        });

        it('must provide `?.deps.js` target from file', function (done) {
            toBundle.runTech(provideTech, {
                    node: 'from-file-bundle',
                    source: 'from-file-bundle.deps.js' })
                .then(function (bemdecl) {
                    bemdecl.must.eql([{ block: 'block' }]);
                })
                .then(done, done);
        });

        it('must provide `?.deps.js` target from data', function (done) {
            toBundle.runTech(provideTech, {
                    node: 'from-data-bundle',
                    source: 'from-data-bundle.deps.js' })
                .then(function (bemdecl) {
                    bemdecl.must.eql([{ block: 'block' }]);
                })
                .then(done, done);
        });

        it('must require `?.deps.js` target from file', function (done) {
            toBundle.runTechAndRequire(provideTech, {
                    node: 'from-file-bundle',
                    source: 'from-file-bundle.deps.js' })
                .spread(function (bemdecl) {
                    bemdecl.deps.must.eql([{ block: 'block' }]);
                })
                .then(done, done);
        });

        it('must require `?.deps.js` target from data', function (done) {
            toBundle.runTechAndRequire(provideTech, {
                    node: 'from-data-bundle',
                    source: 'from-data-bundle.deps.js' })
                .spread(function (bemdecl) {
                    bemdecl.deps.must.eql([{ block: 'block' }]);
                })
                .then(done, done);
        });
    });
});

function stringify(bemjson) {
    return 'exports.deps = ' + JSON.stringify(bemjson) + ';';
}
