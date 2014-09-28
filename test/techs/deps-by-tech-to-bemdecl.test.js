var mockFs = require('mock-fs'),
    TestNode = require('enb/lib/test/mocks/test-node'),
    levelsTech = require('../../techs/levels'),
    filesTech = require('../../techs/files'),
    depsTech = require('../../techs/deps'),
    bemdeclFromDepsByTechTech = require('../../techs/deps-by-tech-to-bemdecl');

describe('techs', function () {
    describe('deps-by-tech-to-bemdecl', function () {
        var bundle,
            shouldLevels,
            mustLevels;

        beforeEach(function () {
            mockFs({
                'should-deps-js.blocks': {
                    block: {
                        'block.deps.js': stringifyDepsJs({
                            tech: 'sourceTech',
                            shouldDeps: [{ tech: 'destTech', block: 'other-block' }]
                        })
                    },
                    'block-bool-mod': {
                        'block-bool-mod.deps.js': stringifyDepsJs({
                            tech: 'sourceTech',
                            shouldDeps: [{ tech: 'destTech', block: 'other-block', mods: { mod: true } }]
                        })
                    },
                    'block-mod': {
                        'block-mod.deps.js': stringifyDepsJs({
                            tech: 'sourceTech',
                            shouldDeps: [{ tech: 'destTech', block: 'other-block', mods: { modName: 'modVal' } }]
                        })
                    },
                    elem: {
                        'elem.deps.js': stringifyDepsJs({
                            tech: 'sourceTech',
                            shouldDeps: [{ tech: 'destTech', block: 'other-block', elem: 'elem' }]
                        })
                    },
                    elems: {
                        'elems.deps.js': stringifyDepsJs({
                            tech: 'sourceTech',
                            shouldDeps: [{ tech: 'destTech', block: 'other-block', elems: ['elem-1', 'elem-2'] }]
                        })
                    },
                    'elem-bool-mod': {
                        'elem-bool-mod.deps.js': stringifyDepsJs({
                            tech: 'sourceTech',
                            shouldDeps: [{ tech: 'destTech', block: 'other-block', elem: 'elem', mods: { mod: true } }]
                        })
                    },
                    'elem-mod': {
                        'elem-mod.deps.js': stringifyDepsJs({
                            tech: 'sourceTech',
                            shouldDeps: [{ tech: 'destTech', block: 'other-block',
                                elem: 'elem', mods: { modName: 'modVal' } }]
                        })
                    },

                    A: {
                        'A.deps.js': stringifyDepsJs({
                            tech: 'sourceTech',
                            shouldDeps: [{ tech: 'destTech', block: 'B' }]
                        })
                    },
                    B: {
                        'B.deps.js': stringifyDepsJs({
                            tech: 'sourceTech',
                            shouldDeps: [{ tech: 'destTech', block: 'A' }]
                        })
                    },

                    'some-block': {
                        'some-block.deps.js': stringifyDepsJs({
                            tech: 'sourceTech',
                            shouldDeps: [
                                { tech: 'destTech', mods: { some: true } },
                                { tech: 'destTech', elem: 'some-elem-1' },
                                { tech: 'destTech', elem: 'some-elem-2', mods: { some: true } }
                            ]
                        })
                    }
                },
                'must-deps-js.blocks': {
                    block: {
                        'block.deps.js': stringifyDepsJs({
                            tech: 'sourceTech',
                            mustDeps: [{ tech: 'destTech', block: 'other-block' }]
                        })
                    },
                    'block-bool-mod': {
                        'block-bool-mod.deps.js': stringifyDepsJs({
                            tech: 'sourceTech',
                            mustDeps: [{ tech: 'destTech', block: 'other-block', mods: { mod: true } }]
                        })
                    },
                    'block-mod': {
                        'block-mod.deps.js': stringifyDepsJs({
                            tech: 'sourceTech',
                            mustDeps: [{ tech: 'destTech', block: 'other-block', mods: { modName: 'modVal' } }]
                        })
                    },
                    elem: {
                        'elem.deps.js': stringifyDepsJs({
                            tech: 'sourceTech',
                            mustDeps: [{ tech: 'destTech', block: 'other-block', elem: 'elem' }]
                        })
                    },
                    elems: {
                        'elems.deps.js': stringifyDepsJs({
                            tech: 'sourceTech',
                            mustDeps: [{ tech: 'destTech', block: 'other-block', elems: ['elem-1', 'elem-2'] }]
                        })
                    },
                    'elem-bool-mod': {
                        'elem-bool-mod.deps.js': stringifyDepsJs({
                            tech: 'sourceTech',
                            mustDeps: [{ tech: 'destTech', block: 'other-block', elem: 'elem', mods: { mod: true } }]
                        })
                    },
                    'elem-mod': {
                        'elem-mod.deps.js': stringifyDepsJs({
                            tech: 'sourceTech',
                            mustDeps: [{ tech: 'destTech', block: 'other-block',
                                elem: 'elem', mods: { modName: 'modVal' } }]
                        })
                    },

                    A: {
                        'A.deps.js': stringifyDepsJs({
                            tech: 'sourceTech',
                            mustDeps: [{ tech: 'destTech', block: 'B' }]
                        })
                    },
                    B: {
                        'B.deps.js': stringifyDepsJs({
                            tech: 'sourceTech',
                            mustDeps: [{ tech: 'destTech', block: 'A' }]
                        })
                    }
                },
                bundle: {
                    'some-block.bemdecl.js': stringifyBemdecl([{ name: 'some-block' }]),
                    'block.bemdecl.js': stringifyBemdecl([{ name: 'block' }]),
                    'block-bool-mod.bemdecl.js': stringifyBemdecl([{ name: 'block-bool-mod' }]),
                    'block-mod.bemdecl.js': stringifyBemdecl([{ name: 'block-mod' }]),
                    'elem.bemdecl.js': stringifyBemdecl([{ name: 'elem' }]),
                    'elems.bemdecl.js': stringifyBemdecl([{ name: 'elems' }]),
                    'elem-bool-mod.bemdecl.js': stringifyBemdecl([{ name: 'elem-bool-mod' }]),
                    'elem-mod.bemdecl.js': stringifyBemdecl([{ name: 'elem-mod' }]),
                    'loop.bemdecl.js': stringifyBemdecl([{ name: 'A' }])
                }
            });

            bundle = new TestNode('bundle');
            shouldLevels = ['should-deps-js.blocks'];
            mustLevels = ['must-deps-js.blocks'];
        });

        afterEach(function () {
            mockFs.restore();
        });

        it('must add block field to dep by context', function (done) {
            bundle.runTech(levelsTech, { levels: shouldLevels })
                .then(function (levels) {
                    bundle.provideTechData('?.levels', levels);

                    return bundle.runTechAndRequire(depsTech, { bemdeclFile: 'some-block.bemdecl.js' });
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
                        { name: 'some-block', mods: [{ name: 'some', vals: [{ name: true }] }] },
                        { name: 'some-block', elems: [{ name: 'some-elem-1' }] },
                        { name: 'some-block', elems: [{ name: 'some-elem-2',
                            mods: [{ name: 'some', vals: [{ name: true }] }]
                        }] }
                    ]);
                })
                .then(done, done);
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
