var path = require('path'),
    FileSystem = require('enb/lib/test/mocks/test-file-system'),
    TestNode = require('enb/lib/test/mocks/test-node'),
    levelsTech = require('../../techs/levels'),
    filesTech = require('../../techs/files'),
    depsTech = require('../../techs/deps'),
    bemdeclFromDepsByTechTech = require('../../techs/bemdecl-from-deps-by-tech');

describe('techs', function () {
    describe('bemdecl-from-deps-by-tech', function () {
        var fileSystem,
            bundle,
            shouldLevels,
            mustLevels;

        beforeEach(function () {
            fileSystem = new FileSystem([{
                directory: 'should-deps-js.blocks', items: [
                    { directory: 'block', items: [
                        { file: 'block.deps.js', content: stringifyDepsJs({
                            tech: 'sourceTech',
                            shouldDeps: [{ tech: 'destTech', block: 'other-block' }]
                        }) }
                    ] },
                    { directory: 'block-bool-mod', items: [
                        { file: 'block-bool-mod.deps.js', content: stringifyDepsJs({
                            tech: 'sourceTech',
                            shouldDeps: [{ tech: 'destTech', block: 'other-block', mods: { mod: true } }]
                        }) }
                    ] },
                    { directory: 'block-mod', items: [
                        { file: 'block-mod.deps.js', content: stringifyDepsJs({
                            tech: 'sourceTech',
                            shouldDeps: [{ tech: 'destTech', block: 'other-block', mods: { modName: 'modVal' } }]
                        }) }
                    ] },
                    { directory: 'elem', items: [
                        { file: 'elem.deps.js', content: stringifyDepsJs({
                            tech: 'sourceTech',
                            shouldDeps: [{ tech: 'destTech', block: 'other-block', elem: 'elem' }]
                        }) }
                    ] },
                    { directory: 'elems', items: [
                        { file: 'elems.deps.js', content: stringifyDepsJs({
                            tech: 'sourceTech',
                            shouldDeps: [{ tech: 'destTech', block: 'other-block', elems: ['elem-1', 'elem-2'] }]
                        }) }
                    ] },
                    { directory: 'elem-bool-mod', items: [
                        { file: 'elem-bool-mod.deps.js', content: stringifyDepsJs({
                            tech: 'sourceTech',
                            shouldDeps: [{ tech: 'destTech', block: 'other-block', elem: 'elem', mods: { mod: true } }]
                        }) }
                    ] },
                    { directory: 'elem-mod', items: [
                        { file: 'elem-mod.deps.js', content: stringifyDepsJs({
                            tech: 'sourceTech',
                            shouldDeps: [{ tech: 'destTech', block: 'other-block',
                                elem: 'elem', mods: { modName: 'modVal' } }]
                        }) }
                    ] },

                    { directory: 'A', items: [
                        { file: 'A.deps.js', content: stringifyDepsJs({
                            tech: 'sourceTech',
                            shouldDeps: [{ tech: 'destTech', block: 'B' }]
                        }) }
                    ] },
                    { directory: 'B', items: [
                        { file: 'B.deps.js', content: stringifyDepsJs({
                            tech: 'sourceTech',
                            shouldDeps: [{ tech: 'destTech', block: 'A' }]
                        }) }
                    ] }
                ]
            }, {
                directory: 'must-deps-js.blocks', items: [
                    { directory: 'block', items: [
                        { file: 'block.deps.js', content: stringifyDepsJs({
                            tech: 'sourceTech',
                            mustDeps: [{ tech: 'destTech', block: 'other-block' }]
                        }) }
                    ] },
                    { directory: 'block-bool-mod', items: [
                        { file: 'block-bool-mod.deps.js', content: stringifyDepsJs({
                            tech: 'sourceTech',
                            mustDeps: [{ tech: 'destTech', block: 'other-block', mods: { mod: true } }]
                        }) }
                    ] },
                    { directory: 'block-mod', items: [
                        { file: 'block-mod.deps.js', content: stringifyDepsJs({
                            tech: 'sourceTech',
                            mustDeps: [{ tech: 'destTech', block: 'other-block', mods: { modName: 'modVal' } }]
                        }) }
                    ] },
                    { directory: 'elem', items: [
                        { file: 'elem.deps.js', content: stringifyDepsJs({
                            tech: 'sourceTech',
                            mustDeps: [{ tech: 'destTech', block: 'other-block', elem: 'elem' }]
                        }) }
                    ] },
                    { directory: 'elems', items: [
                        { file: 'elems.deps.js', content: stringifyDepsJs({
                            tech: 'sourceTech',
                            mustDeps: [{ tech: 'destTech', block: 'other-block', elems: ['elem-1', 'elem-2'] }]
                        }) }
                    ] },
                    { directory: 'elem-bool-mod', items: [
                        { file: 'elem-bool-mod.deps.js', content: stringifyDepsJs({
                            tech: 'sourceTech',
                            mustDeps: [{ tech: 'destTech', block: 'other-block', elem: 'elem', mods: { mod: true } }]
                        }) }
                    ] },
                    { directory: 'elem-mod', items: [
                        { file: 'elem-mod.deps.js', content: stringifyDepsJs({
                            tech: 'sourceTech',
                            mustDeps: [{ tech: 'destTech', block: 'other-block',
                                elem: 'elem', mods: { modName: 'modVal' } }]
                        }) }
                    ] },

                    { directory: 'A', items: [
                        { file: 'A.deps.js', content: stringifyDepsJs({
                            tech: 'sourceTech',
                            mustDeps: [{ tech: 'destTech', block: 'B' }]
                        }) }
                    ] },
                    { directory: 'B', items: [
                        { file: 'B.deps.js', content: stringifyDepsJs({
                            tech: 'sourceTech',
                            mustDeps: [{ tech: 'destTech', block: 'A' }]
                        }) }
                    ] }
                ]
            }, {
                directory: 'bundle', items: [
                    { file: 'block.bemdecl.js', content: stringifyBemdecl([{ name: 'block' }]) },
                    { file: 'block-bool-mod.bemdecl.js', content: stringifyBemdecl([{ name: 'block-bool-mod' }]) },
                    { file: 'block-mod.bemdecl.js', content: stringifyBemdecl([{ name: 'block-mod' }]) },
                    { file: 'elem.bemdecl.js', content: stringifyBemdecl([{ name: 'elem' }]) },
                    { file: 'elems.bemdecl.js', content: stringifyBemdecl([{ name: 'elems' }]) },
                    { file: 'elem-bool-mod.bemdecl.js', content: stringifyBemdecl([{ name: 'elem-bool-mod' }]) },
                    { file: 'elem-mod.bemdecl.js', content: stringifyBemdecl([{ name: 'elem-mod' }]) },
                    { file: 'loop.bemdecl.js', content: stringifyBemdecl([{ name: 'A' }]) }
                ]
            }]);

            fileSystem.setup();

            bundle = new TestNode('bundle');
            shouldLevels = [path.join(fileSystem._root, 'should-deps-js.blocks')];
            mustLevels = [path.join(fileSystem._root, 'must-deps-js.blocks')];
        });

        afterEach(function () {
            fileSystem.teardown();
        });

        it('must add should dep of block', function (done) {
            bundle.runTech(levelsTech, { levels: shouldLevels })
                .then(function (levels) {
                    bundle.provideTechData('?.levels', levels);

                    return bundle.runTechAndRequire(depsTech, { bemdeclFile: 'block.bemdecl.js' });
                })
                .spread(function (res) {
                    bundle.provideTechData('?.deps.js', res);

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(function (res) {
                    var files = res['bundle.files'];

                    bundle.provideTechData('?.files', files);

                    return bundle.runTechAndRequire(bemdeclFromDepsByTechTech, {
                        sourceTech: 'sourceTech',
                        destTech: 'destTech'
                    });
                })
                .spread(function (target) {
                    target.blocks.must.eql([
                        { name: 'other-block' }
                    ]);
                })
                .then(done, done);
        });

        it('must add should dep of block boolean mod', function (done) {
            bundle.runTech(levelsTech, { levels: shouldLevels })
                .then(function (levels) {
                    bundle.provideTechData('?.levels', levels);

                    return bundle.runTechAndRequire(depsTech, { bemdeclFile: 'block-bool-mod.bemdecl.js' });
                })
                .spread(function (res) {
                    bundle.provideTechData('?.deps.js', res);

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(function (res) {
                    var files = res['bundle.files'];

                    bundle.provideTechData('?.files', files);

                    return bundle.runTechAndRequire(bemdeclFromDepsByTechTech, {
                        sourceTech: 'sourceTech',
                        destTech: 'destTech'
                    });
                })
                .spread(function (target) {
                    target.blocks.must.eql([
                        { name: 'other-block', mods: [{ name: 'mod', vals: [{ name: true }] }] }
                    ]);
                })
                .then(done, done);
        });

        it('must add should dep of block mod', function (done) {
            bundle.runTech(levelsTech, { levels: shouldLevels })
                .then(function (levels) {
                    bundle.provideTechData('?.levels', levels);

                    return bundle.runTechAndRequire(depsTech, { bemdeclFile: 'block-mod.bemdecl.js' });
                })
                .spread(function (res) {
                    bundle.provideTechData('?.deps.js', res);

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(function (res) {
                    var files = res['bundle.files'];

                    bundle.provideTechData('?.files', files);

                    return bundle.runTechAndRequire(bemdeclFromDepsByTechTech, {
                        sourceTech: 'sourceTech',
                        destTech: 'destTech'
                    });
                })
                .spread(function (target) {
                    target.blocks.must.eql([
                        { name: 'other-block', mods: [{ name: 'modName', vals: [{ name: 'modVal' }] }] }
                    ]);
                })
                .then(done, done);
        });

        it('must add should dep of elem', function (done) {
            bundle.runTech(levelsTech, { levels: shouldLevels })
                .then(function (levels) {
                    bundle.provideTechData('?.levels', levels);

                    return bundle.runTechAndRequire(depsTech, { bemdeclFile: 'elem.bemdecl.js' });
                })
                .spread(function (res) {
                    bundle.provideTechData('?.deps.js', res);

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(function (res) {
                    var files = res['bundle.files'];

                    bundle.provideTechData('?.files', files);

                    return bundle.runTechAndRequire(bemdeclFromDepsByTechTech, {
                        sourceTech: 'sourceTech',
                        destTech: 'destTech'
                    });
                })
                .spread(function (target) {
                    target.blocks.must.eql([
                        { name: 'other-block', elems: [{ name: 'elem' }] }
                    ]);
                })
                .then(done, done);
        });

        it('must add should dep of elems', function (done) {
            bundle.runTech(levelsTech, { levels: shouldLevels })
                .then(function (levels) {
                    bundle.provideTechData('?.levels', levels);

                    return bundle.runTechAndRequire(depsTech, { bemdeclFile: 'elems.bemdecl.js' });
                })
                .spread(function (res) {
                    bundle.provideTechData('?.deps.js', res);

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(function (res) {
                    var files = res['bundle.files'];

                    bundle.provideTechData('?.files', files);

                    return bundle.runTechAndRequire(bemdeclFromDepsByTechTech, {
                        sourceTech: 'sourceTech',
                        destTech: 'destTech'
                    });
                })
                .spread(function (target) {
                    target.blocks.must.eql([
                        { name: 'other-block' },
                        { name: 'other-block', elems: [{ name: 'elem-1' }] },
                        { name: 'other-block', elems: [{ name: 'elem-2' }] }
                    ]);
                })
                .then(done, done);
        });

        it('must add should dep of elem bool mod', function (done) {
            bundle.runTech(levelsTech, { levels: shouldLevels })
                .then(function (levels) {
                    bundle.provideTechData('?.levels', levels);

                    return bundle.runTechAndRequire(depsTech, { bemdeclFile: 'elem-bool-mod.bemdecl.js' });
                })
                .spread(function (res) {
                    bundle.provideTechData('?.deps.js', res);

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(function (res) {
                    var files = res['bundle.files'];

                    bundle.provideTechData('?.files', files);

                    return bundle.runTechAndRequire(bemdeclFromDepsByTechTech, {
                        sourceTech: 'sourceTech',
                        destTech: 'destTech'
                    });
                })
                .spread(function (target) {
                    target.blocks.must.eql([
                        {
                            name: 'other-block',
                            elems: [{ name: 'elem', mods: [{ name: 'mod', vals: [{ name: true }] }] }]
                        }
                    ]);
                })
                .then(done, done);
        });

        it('must add should dep of elem mod', function (done) {
            bundle.runTech(levelsTech, { levels: shouldLevels })
                .then(function (levels) {
                    bundle.provideTechData('?.levels', levels);

                    return bundle.runTechAndRequire(depsTech, { bemdeclFile: 'elem-mod.bemdecl.js' });
                })
                .spread(function (res) {
                    bundle.provideTechData('?.deps.js', res);

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(function (res) {
                    var files = res['bundle.files'];

                    bundle.provideTechData('?.files', files);

                    return bundle.runTechAndRequire(bemdeclFromDepsByTechTech, {
                        sourceTech: 'sourceTech',
                        destTech: 'destTech'
                    });
                })
                .spread(function (target) {
                    target.blocks.must.eql([
                        {
                            name: 'other-block',
                            elems: [{ name: 'elem', mods: [{ name: 'modName', vals: [{ name: 'modVal' }] }] }]
                        }
                    ]);
                })
                .then(done, done);
        });

        it('must add loop shouldDeps', function (done) {
            bundle.runTech(levelsTech, { levels: shouldLevels })
                .then(function (levels) {
                    bundle.provideTechData('?.levels', levels);

                    return bundle.runTechAndRequire(depsTech, { bemdeclFile: 'loop.bemdecl.js' });
                })
                .spread(function (res) {
                    bundle.provideTechData('?.deps.js', res);

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(function (res) {
                    var files = res['bundle.files'];

                    bundle.provideTechData('?.files', files);

                    return bundle.runTechAndRequire(bemdeclFromDepsByTechTech, {
                        sourceTech: 'sourceTech',
                        destTech: 'destTech'
                    });
                })
                .spread(function (target) {
                    target.blocks.must.eql([
//                        { block: 'A' },
                        { name: 'B' }
                    ]);
                })
                .then(done, done);
        });

        it('must add must dep of block', function (done) {
            bundle.runTech(levelsTech, { levels: mustLevels })
                .then(function (levels) {
                    bundle.provideTechData('?.levels', levels);

                    return bundle.runTechAndRequire(depsTech, { bemdeclFile: 'block.bemdecl.js' });
                })
                .spread(function (res) {
                    bundle.provideTechData('?.deps.js', res);

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(function (res) {
                    var files = res['bundle.files'];

                    bundle.provideTechData('?.files', files);

                    return bundle.runTechAndRequire(bemdeclFromDepsByTechTech, {
                        sourceTech: 'sourceTech',
                        destTech: 'destTech'
                    });
                })
                .spread(function (target) {
                    target.blocks.must.eql([
                        { name: 'other-block' }
                    ]);
                })
                .then(done, done);
        });

        it('must add must dep of block boolean mod', function (done) {
            bundle.runTech(levelsTech, { levels: mustLevels })
                .then(function (levels) {
                    bundle.provideTechData('?.levels', levels);

                    return bundle.runTechAndRequire(depsTech, { bemdeclFile: 'block-bool-mod.bemdecl.js' });
                })
                .spread(function (res) {
                    bundle.provideTechData('?.deps.js', res);

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(function (res) {
                    var files = res['bundle.files'];

                    bundle.provideTechData('?.files', files);

                    return bundle.runTechAndRequire(bemdeclFromDepsByTechTech, {
                        sourceTech: 'sourceTech',
                        destTech: 'destTech'
                    });
                })
                .spread(function (target) {
                    target.blocks.must.eql([
                        { name: 'other-block', mods: [{ name: 'mod', vals: [{ name: true }] }] }
                    ]);
                })
                .then(done, done);
        });

        it('must add must dep of block mod', function (done) {
            bundle.runTech(levelsTech, { levels: mustLevels })
                .then(function (levels) {
                    bundle.provideTechData('?.levels', levels);

                    return bundle.runTechAndRequire(depsTech, { bemdeclFile: 'block-mod.bemdecl.js' });
                })
                .spread(function (res) {
                    bundle.provideTechData('?.deps.js', res);

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(function (res) {
                    var files = res['bundle.files'];

                    bundle.provideTechData('?.files', files);

                    return bundle.runTechAndRequire(bemdeclFromDepsByTechTech, {
                        sourceTech: 'sourceTech',
                        destTech: 'destTech'
                    });
                })
                .spread(function (target) {
                    target.blocks.must.eql([
                        { name: 'other-block', mods: [{ name: 'modName', vals: [{ name: 'modVal' }] }] }
                    ]);
                })
                .then(done, done);
        });

        it('must add must dep of elem', function (done) {
            bundle.runTech(levelsTech, { levels: mustLevels })
                .then(function (levels) {
                    bundle.provideTechData('?.levels', levels);

                    return bundle.runTechAndRequire(depsTech, { bemdeclFile: 'elem.bemdecl.js' });
                })
                .spread(function (res) {
                    bundle.provideTechData('?.deps.js', res);

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(function (res) {
                    var files = res['bundle.files'];

                    bundle.provideTechData('?.files', files);

                    return bundle.runTechAndRequire(bemdeclFromDepsByTechTech, {
                        sourceTech: 'sourceTech',
                        destTech: 'destTech'
                    });
                })
                .spread(function (target) {
                    target.blocks.must.eql([
                        { name: 'other-block', elems: [{ name: 'elem' }] }
                    ]);
                })
                .then(done, done);
        });

        it('must add must dep of elems', function (done) {
            bundle.runTech(levelsTech, { levels: mustLevels })
                .then(function (levels) {
                    bundle.provideTechData('?.levels', levels);

                    return bundle.runTechAndRequire(depsTech, { bemdeclFile: 'elems.bemdecl.js' });
                })
                .spread(function (res) {
                    bundle.provideTechData('?.deps.js', res);

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(function (res) {
                    var files = res['bundle.files'];

                    bundle.provideTechData('?.files', files);

                    return bundle.runTechAndRequire(bemdeclFromDepsByTechTech, {
                        sourceTech: 'sourceTech',
                        destTech: 'destTech'
                    });
                })
                .spread(function (target) {
                    target.blocks.must.eql([
                        { name: 'other-block' },
                        { name: 'other-block', elems: [{ name: 'elem-1' }] },
                        { name: 'other-block', elems: [{ name: 'elem-2' }] }
                    ]);
                })
                .then(done, done);
        });

        it('must add must dep of elem bool mod', function (done) {
            bundle.runTech(levelsTech, { levels: mustLevels })
                .then(function (levels) {
                    bundle.provideTechData('?.levels', levels);

                    return bundle.runTechAndRequire(depsTech, { bemdeclFile: 'elem-bool-mod.bemdecl.js' });
                })
                .spread(function (res) {
                    bundle.provideTechData('?.deps.js', res);

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(function (res) {
                    var files = res['bundle.files'];

                    bundle.provideTechData('?.files', files);

                    return bundle.runTechAndRequire(bemdeclFromDepsByTechTech, {
                        sourceTech: 'sourceTech',
                        destTech: 'destTech'
                    });
                })
                .spread(function (target) {
                    target.blocks.must.eql([
                        {
                            name: 'other-block',
                            elems: [{ name: 'elem', mods: [{ name: 'mod', vals: [{ name: true }] }] }]
                        }
                    ]);
                })
                .then(done, done);
        });

        it('must add must dep of elem mod', function (done) {
            bundle.runTech(levelsTech, { levels: mustLevels })
                .then(function (levels) {
                    bundle.provideTechData('?.levels', levels);

                    return bundle.runTechAndRequire(depsTech, { bemdeclFile: 'elem-mod.bemdecl.js' });
                })
                .spread(function (res) {
                    bundle.provideTechData('?.deps.js', res);

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(function (res) {
                    var files = res['bundle.files'];

                    bundle.provideTechData('?.files', files);

                    return bundle.runTechAndRequire(bemdeclFromDepsByTechTech, {
                        sourceTech: 'sourceTech',
                        destTech: 'destTech'
                    });
                })
                .spread(function (target) {
                    target.blocks.must.eql([
                        {
                            name: 'other-block',
                            elems: [{ name: 'elem', mods: [{ name: 'modName', vals: [{ name: 'modVal' }] }] }]
                        }
                    ]);
                })
                .then(done, done);
        });

//        it('must throw if loop mustDeps', function (done) {
//            bundle.runTech(levelsTech, { levels: mustLevels })
//                .then(function () {
//                    return bundle.runTechAndRequire(depsTech, { bemdeclFile: 'loop.bemdecl.js' });
//                })
//                .then(function () {
//                    return bundle.runTechAndGetResults(filesTech);
//                })
//                .then(function () {
//                    return bundle.runTechAndRequire(bemdeclFromDepsByTechTech, {
//                        sourceTech: 'sourceTech',
//                        destTech: 'destTech'
//                    });
//                })
//                .fail(function (err) {
//                    err.must.throw();
//                })
//                .then(done, done);
//        });
    });
});

function stringifyDepsJs(bemjson) {
    return '(' + JSON.stringify(bemjson) + ')';
}

function stringifyBemdecl(bemjson) {
    return 'exports.blocks = ' + JSON.stringify(bemjson) + ';';
}
