var fs = require('fs'),
    path = require('path'),

    vow = require('vow'),
    mockFs = require('mock-fs'),
    TestNode = require('mock-enb/lib/mock-node'),

    techs = require('../../utils/techs'),
    levelsTech = techs.levels,
    depsTechs = {
        deps: techs.deps
    },
    DepsGraph = require('../../../lib/deps/deps-graph'),
    needGatherDeps = process.env.GATHER_DEPS,
    snapshot = needGatherDeps ? {} : require('./snapshot'),
    EOL = require('os').EOL;

describe('deps: random graphs', function () {
    before(function () {
        var message = [
            'n — max number of nodes',
            'm — number of mustDeps',
            's — number of shouldDeps',
            'l — loops in mustDeps allowed'
        ].map(function (line) {
            return '  ' + line;
        }).join(EOL);

        console.log(EOL + message + EOL);
    });

    afterEach(function () {
        mockFs.restore();
    });

    [5, 10, 15, 20, 60].forEach(function (nodeNum) {
        [5, 10, 20, 50, 75, 90].forEach(function (edgeRate) {
            [0, 5, 10, 20, 50, 75, 90, 100].forEach(function (mustRate) {
                [false, true].forEach(function (allowLoops) {
                    var edgeNum = Math.floor((nodeNum * (nodeNum - 1) / 2) * edgeRate / 100),
                        mustEdgeNum = Math.floor(edgeNum * mustRate / 100);
                    createTestCase(nodeNum, mustEdgeNum, edgeNum - mustEdgeNum, allowLoops);
                });
            });
        });
    });

    var bemdecl = [{ name: 'A' }];

    function createTestCase(nodes, must, should, allowLoops) {
        var id = ['case', 'n' + nodes, 'm' + must, 's' + should + (allowLoops ? '-l' : '')].join('-');
        describe(id, function () {
            var graph;
            before(function () {
                graph = DepsGraph.random(nodes, must, should, id, allowLoops);
            });

            [
                { name: 'deps', opts: {} }
            ].forEach(function (tech) {
                var techKey = tech.name + (tech.opts.strict ? ' --strict' : '');
                it(techKey, function () {
                    if (graph) {
                        return testDepsTechs(techKey, tech.name, tech.opts, graph, allowLoops, bemdecl, id);
                    }
                });
            });
        });
    }

    after(function (done) {
        if (needGatherDeps) {
            var filename = path.join(__dirname, 'snapshot.json');

            fs.writeFile(filename, JSON.stringify(snapshot, null, 4), done);
        } else {
            done();
        }
    });
});

function getResults(tech, fsScheme, bemdecl, techOpts) {
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
                fsBundle.runTechAndRequire(tech, techOpts),
                fsBundle.runTechAndGetResults(tech, techOpts),
                dataBundle.runTechAndRequire(tech, techOpts),
                dataBundle.runTechAndGetResults(tech, techOpts)
            ]);
        })
        .spread(function (res1, res2, res3, res4) {
            var result = [
                res1[0].deps, res2['fs-bundle.deps.js'].deps,
                res3[0].deps, res4['data-bundle.deps.js'].deps
            ];
            result.messages = dataBundle.getLogger()._messages;
            return result;
        });
}

function testDepsTechs(techKey, techName, techOpts, graph, allowLoops, bemdecl, id) {
    var fsScheme = graph.toTestScheme(),
        snapshotTech = snapshot[techKey] || (snapshot[techKey] = {});
    return getResults(depsTechs[techName], fsScheme, bemdecl, techOpts)
        .then(function (result) {
            var depsIndices = {},
                depsList = result[1].map(function (dep, idx) {
                    depsIndices[dep.block] = idx;
                    return dep.block;
                });

            if (needGatherDeps) {
                if (techKey === 'deps-old' && allowLoops) {
                    if (!checkCorrectness(graph, depsIndices)) {
                        // warnings should only address loops in mustDeps
                        result.messages.must.not.be.empty();
                        result.messages.filter(function (obj) {
                            return obj.message === 'circular mustDeps';
                        }).length.must.equal(result.messages.length);
                    }
                } else {
                    checkCorrectness(graph, depsIndices).must.be(true);
                }

                snapshotTech[id] = depsList.join(',');
            } else {
                // compare with reference deps snapshot
                // set GATHER_DEPS env variable to update snapshot
                depsList.must.eql(snapshotTech[id].split(','));
            }

            return result;
        }, function (err) {
            // handle circular mustDeps exception
            if (!allowLoops || techKey === 'deps-old') {
                // error is unexpected for graph without mustDeps loops or for deps-old in non-strict mode
                throw err;
            }
            // error message should only address loops in mustDeps
            err.message.must.contain(techKey === 'deps' ? 'Unresolved deps:' : 'Circular mustDeps:');
            if (needGatherDeps) {
                snapshotTech[id] = null;
            } else {
                // snapshot must contain null
                snapshotTech.must.have.property(id, null);
            }
        });
}

function checkCorrectness(graph, depsIndices) {
    var correctMustOrder = true;
    Object.keys(graph.must).forEach(function (id) {
        var name = DepsGraph.idToName(id);
        depsIndices.must.have.property(name);
        Object.keys(graph.must[id]).forEach(function (mustId) {
            var mustName = DepsGraph.idToName(mustId);
            depsIndices.must.have.property(mustName);
            if (depsIndices[mustName] > depsIndices[name]) {
                // entity should not precede its mustDeps
                correctMustOrder = false;
            }
        });
    });
    Object.keys(graph.should).forEach(function (id) {
        var name = DepsGraph.idToName(id);
        depsIndices.must.have.property(name);
        Object.keys(graph.should[id]).forEach(function (shouldId) {
            var shouldName = DepsGraph.idToName(shouldId);
            depsIndices.must.have.property(shouldName);
        });
    });
    return correctMustOrder;
}
