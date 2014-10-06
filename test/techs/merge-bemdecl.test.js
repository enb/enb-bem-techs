var vow = require('vow'),
    mockFs = require('mock-fs'),
    TestNode = require('enb/lib/test/mocks/test-node'),
    Tech = require('../../techs/merge-bemdecl');

describe('techs', function () {
    describe('merge-bemdecl', function () {
        afterEach(function () {
            mockFs.restore();
        });

        it('must provide result', function (done) {
            var sources = [[{ name: 'block' }]],
                bemdecl = [{ name: 'block' }];

            assert(sources, bemdecl, done);
        });

        it('must merge block with mod of block', function (done) {
            var bemdecl1 = [{ name: 'block' }],
                bemdecl2 = [{
                    name: 'block',
                    mods: [{ name: 'mod-name', vals: [{ name: 'mod-val' }] }]
                }],
                exepted = [
                    { name: 'block' },
                    { name: 'block', mods: [{ name: 'mod-name', vals: [{ name: 'mod-val' }] }] }
                ];

            assert([bemdecl1, bemdecl2], exepted, done);
        });

        it('must merge block with elem', function (done) {
            var bemdecl1 = [{ name: 'block' }],
                bemdecl2 = [{
                    name: 'block',
                    elems: [{ name: 'elem' }]
                }],
                exepted = [
                    { name: 'block' },
                    { name: 'block', elems: [{ name: 'elem' }] }
                ];

            assert([bemdecl1, bemdecl2], exepted, done);
        });

        it('must merge elem with mod of elem', function (done) {
            var bemdecl1 = [{
                    name: 'block',
                    elems: [{ name: 'elem' }]
                }],
                bemdecl2 = [{
                    name: 'block',
                    elems: [{ name: 'elem', mods: [{ name: 'modName', vals: [{ name: 'modVal' }] }] }]
                }],
                exepted = [
                    { name: 'block' },
                    { name: 'block', elems: [{ name: 'elem' }] },
                    { name: 'block', elems: [{ name: 'elem', mods: [
                        { name: 'modName', vals: [{ name: 'modVal' }] }
                    ] }] }
                ];

            assert([bemdecl1, bemdecl2], exepted, done);
        });

        it('must merge set with empty set', function (done) {
            var bemdecl1 = [],
                bemdecl2 = [{ name: '1' }, { name: '2' }, { name: '3' }],
                exepted = [{ name: '1' }, { name: '2' }, { name: '3' }];

            assert([bemdecl1, bemdecl2], exepted, done);
        });

        it('must merge intersecting sets', function (done) {
            var bemdecl1 = [{ name: '1' }, { name: '2' }, { name: '3' }],
                bemdecl2 = [{ name: '2' }],
                exepted = [{ name: '1' }, { name: '2' }, { name: '3' }];

            assert([bemdecl1, bemdecl2], exepted, done);
        });

        it('must merge disjoint sets', function (done) {
            var bemdecl1 = [{ name: '1' }, { name: '2' }, { name: '3' }],
                bemdecl2 = [{ name: 'O_o' }],
                exepted = [{ name: '1' }, { name: '2' }, { name: '3' }, { name: 'O_o' }];

            assert([bemdecl1, bemdecl2], exepted, done);
        });
    });
});

function assert(sources, expected, done) {
    var dataBundle = new TestNode('data-bundle'),
        fsBundle,
        dir = {},
        options = { sources: [] },
        dataOptions = { sources: [] };

    mockFs({ 'data-bundle': {} });

    sources.forEach(function (bemdecl, i) {
        var target = i + '.bemdecl.js',
            dataTarget = 'data-' + target;

        dir[target] = 'exports.blocks = ' + JSON.stringify(bemdecl) + ';';
        options.sources.push(target);

        dataBundle.provideTechData(dataTarget, { blocks: bemdecl });
        dataOptions.sources.push(dataTarget);
    });

    mockFs({ 'fs-bundle': dir, 'data-bundle': {} });

    fsBundle = (new TestNode('fs-bundle'));

    return vow.all([
            fsBundle.runTechAndGetResults(Tech, options),
            fsBundle.runTechAndRequire(Tech, options),
            dataBundle.runTechAndGetResults(Tech, dataOptions),
            dataBundle.runTechAndRequire(Tech, dataOptions)
        ])
        .spread(function (data1, target1, data2, target2) {
            data1['fs-bundle.bemdecl.js'].blocks.must.eql(expected);
            target1[0].blocks.must.eql(expected);
            data2['data-bundle.bemdecl.js'].blocks.must.eql(expected);
            target2[0].blocks.must.eql(expected);
        })
        .then(done, done);
}
