var vow = require('vow'),
    mockFs = require('mock-fs'),
    TestNode = require('enb/lib/test/mocks/test-node'),
    levelsTech = require('../../techs/levels'),
    depsTech = require('../../techs/deps'),
    oldDepsTech = require('../../techs/deps-old'),
    DepsGraph = require('../../lib/deps/deps-graph');

describe('techs', function () {
    describe('deps-old', function () {
        afterEach(function () {
            mockFs.restore();
        });

        describe('property-based test: techs return deps in correct order for random graphs',
            function () {
                [5, 10, 20, 50].forEach(function (nodes) {
                    for (var edges = 5; edges <= 100; edges += 5) {
                        for (var rate = 0; rate <= 100; rate += 5) {
                            var mustEdges = Math.floor(edges * rate / 100);
                            createTestCase(nodes, mustEdges, edges - mustEdges);
                        }
                    }
                });

                var bemdecl = [{ name: 'A' }];

                function createTestCase(nodes, must, should) {
                    it('nodes: ' + nodes + ', mustDeps: ' + must + ', shouldDeps: ' + should, function (done) {
                        var graph = DepsGraph.random(nodes, must, should, 'case-' + [nodes, must, should].join('-'));
                        if (graph) {
                            testDepsTechs(graph, bemdecl, done);
                        } else {
                            done();
                        }
                    });
                }
            }
        );
    });
});

function getResults(tech, fsScheme, bemdecl) {
    var levels = Object.keys(fsScheme),
        fsBundle, dataBundle;

    fsScheme['fs-bundle'] = {
        'fs-bundle.bemdecl.js': 'exports.blocks = ' + JSON.stringify(bemdecl) + ';'
    };
    fsScheme['data-bundle'] = {};

    mockFs(fsScheme);

    fsBundle = new TestNode('fs-bundle');
    dataBundle = new TestNode('data-bundle');

    dataBundle.provideTechData('?.bemdecl.js', { blocks: bemdecl });

    return fsBundle.runTech(levelsTech, { levels: levels })
        .then(function (levels) {
            fsBundle.provideTechData('?.levels', levels);
            dataBundle.provideTechData('?.levels', levels);

            return vow.all([
                fsBundle.runTechAndRequire(tech),
                fsBundle.runTechAndGetResults(tech),
                dataBundle.runTechAndRequire(tech),
                dataBundle.runTechAndGetResults(tech)
            ]);
        })
        .spread(function (res1, res2, res3, res4) {
            return [
                res1[0].deps, res2['fs-bundle.deps.js'].deps,
                res3[0].deps, res4['data-bundle.deps.js'].deps
            ];
        });
}

function testDepsTechs(graph, bemdecl, done) {
    var fsScheme = graph.toTestScheme();
    vow.all([depsTech, oldDepsTech].map(function (tech) {
        return getResults(tech, fsScheme, bemdecl)
            .then(function (result) {
                isCorrect(graph, convertToObjResult(result)).must.be(true);
            });
    })).then(function () {
        done();
    });
}

function convertToObjResult(result) {
    var objResult = {};
    result[1].forEach(function (dep, idx) {
        objResult[dep.block] = idx;
    });
    return objResult;
}

function isCorrect(graph, result) {
    return Object.keys(graph.must).every(function (id) {
        var name = DepsGraph.idToName(id);
        return result.hasOwnProperty(name) && Object.keys(graph.must[id]).every(function (mustId) {
            var mustName = DepsGraph.idToName(mustId);
            return result.hasOwnProperty(mustName) && result[mustName] < result[name];
        });
    }) && Object.keys(graph.should).every(function (id) {
        var name = DepsGraph.idToName(id);
        return result.hasOwnProperty(name) && Object.keys(graph.should[id]).every(function (shouldId) {
            var shouldName = DepsGraph.idToName(shouldId);
            return result.hasOwnProperty(shouldName);
        });
    });
}
