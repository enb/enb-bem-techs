var vow = require('vow'),
    mockFs = require('mock-fs'),
    TestNode = require('enb/lib/test/mocks/test-node'),
    levelsTech = require('../../techs/levels'),
    filesTech = require('../../techs/files'),
    depsTech = require('../../techs/deps'),
    bemdeclFromDepsByTechTech = require('../../techs/deps-by-tech-to-bemdecl');

describe('techs', function () {
    describe('deps', function () {
        afterEach(function () {
            mockFs.restore();
        });

        describe('deps.js format', function () {
            it('must add should dep of block', function (done) {
                var scheme = {
                        blocks: {
                            block: {
                                'block.deps.js': stringifyDepsJs({
                                    tech: 'sourceTech',
                                    shouldDeps: [{ tech: 'destTech', block: 'other-block' }]
                                })
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    exepted = [{ name: 'other-block' }];

                assert(scheme, bemdecl, exepted, done);
            });

            it('must add should dep of block boolean mod', function (done) {
                var scheme = {
                        blocks: {
                            block: {
                                'block.deps.js': stringifyDepsJs({
                                    tech: 'sourceTech',
                                    shouldDeps: [{ tech: 'destTech', block: 'other-block', mods: { mod: true } }]
                                })
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    exepted = [{ name: 'other-block', mods: [{ name: 'mod', vals: [{ name: true }] }] }];

                assert(scheme, bemdecl, exepted, done);
            });

            it('must add should dep of block mod', function (done) {
                var scheme = {
                        blocks: {
                            block: {
                                'block.deps.js': stringifyDepsJs({
                                    tech: 'sourceTech',
                                    shouldDeps: [{
                                        tech: 'destTech',
                                        block: 'other-block',
                                        mods: { 'mod-name': 'mod-val' }
                                    }]
                                })
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    exepted = [{ name: 'other-block', mods: [{ name: 'mod-name', vals: [{ name: 'mod-val' }] }] }];

                assert(scheme, bemdecl, exepted, done);
            });

            it('must add should dep of elem', function (done) {
                var scheme = {
                        blocks: {
                            block: {
                                'block.deps.js': stringifyDepsJs({
                                    tech: 'sourceTech',
                                    shouldDeps: [{ tech: 'destTech', block: 'other-block', elem: 'elem' }]
                                })
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    exepted = [{ name: 'other-block', elems: [{ name: 'elem' }] }];

                assert(scheme, bemdecl, exepted, done);
            });

            it('must add should dep of elems', function (done) {
                var scheme = {
                        blocks: {
                            block: {
                                'block.deps.js': stringifyDepsJs({
                                    tech: 'sourceTech',
                                    shouldDeps: [
                                        { tech: 'destTech', block: 'other-block', elems: ['elem-1', 'elem-2'] }
                                    ]
                                })
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    exepted = [
                        { name: 'other-block' },
                        { name: 'other-block', elems: [{ name: 'elem-1' }] },
                        { name: 'other-block', elems: [{ name: 'elem-2' }] }
                    ];

                assert(scheme, bemdecl, exepted, done);
            });

            it('must add should dep of elem bool mod', function (done) {
                var scheme = {
                        blocks: {
                            block: {
                                'block.deps.js': stringifyDepsJs({
                                    tech: 'sourceTech',
                                    shouldDeps: [{
                                        tech: 'destTech',
                                        block: 'other-block',
                                        elem: 'elem', mods: { mod: true }
                                    }]
                                })
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    exepted = [{
                        name: 'other-block',
                        elems: [{ name: 'elem', mods: [{ name: 'mod', vals: [{ name: true }] }] }]
                    }];

                assert(scheme, bemdecl, exepted, done);
            });

            it('must add should dep of elem mod', function (done) {
                var scheme = {
                        blocks: {
                            block: {
                                'block.deps.js': stringifyDepsJs({
                                    tech: 'sourceTech',
                                    shouldDeps: [{
                                        tech: 'destTech',
                                        block: 'other-block',
                                        elem: 'elem',
                                        mods: { 'mod-name': 'mod-val' }
                                    }]
                                })
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    exepted = [ {
                        name: 'other-block',
                        elems: [{ name: 'elem', mods: [{ name: 'mod-name', vals: [{ name: 'mod-val' }] }] }]
                    }];

                assert(scheme, bemdecl, exepted, done);
            });

            it('must add loop shouldDeps', function (done) {
                var scheme = {
                        blocks: {
                            A: {
                                'A.deps.js': stringifyDepsJs({
                                    tech: 'sourceTech',
                                    shouldDeps: [{ tech: 'destTech', block: 'B' }]
                                })
                            },
                            B: {
                                'B.deps.js': stringifyDepsJs({
                                    shouldDeps: [{ tech: 'destTech', block: 'A' }]
                                })
                            }
                        }
                    },
                    bemdecl = [{ name: 'A' }],
                    exepted = [
                        // { name: 'A' },
                        { name: 'B' }
                    ];

                assert(scheme, bemdecl, exepted, done);
            });

            it('must add must dep of block', function (done) {
                var scheme = {
                        blocks: {
                            block: {
                                'block.deps.js': stringifyDepsJs({
                                    tech: 'sourceTech',
                                    mustDeps: [{ tech: 'destTech', block: 'other-block' }]
                                })
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    exepted = [{ name: 'other-block' }];

                assert(scheme, bemdecl, exepted, done);
            });

            it('must add must dep of block boolean mod', function (done) {
                var scheme = {
                        blocks: {
                            block: {
                                'block.deps.js': stringifyDepsJs({
                                    tech: 'sourceTech',
                                    mustDeps: [{ tech: 'destTech', block: 'other-block', mods: { mod: true } }]
                                })
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    exepted = [{ name: 'other-block', mods: [{ name: 'mod', vals: [{ name: true }] }] }];

                assert(scheme, bemdecl, exepted, done);
            });

            it('must add must dep of block mod', function (done) {
                var scheme = {
                        blocks: {
                            block: {
                                'block.deps.js': stringifyDepsJs({
                                    tech: 'sourceTech',
                                    mustDeps: [
                                        { tech: 'destTech', block: 'other-block', mods: { 'mod-name': 'mod-val' } }
                                    ]
                                })
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    exepted = [{ name: 'other-block', mods: [{ name: 'mod-name', vals: [{ name: 'mod-val' }] }] }];

                assert(scheme, bemdecl, exepted, done);
            });

            it('must add must dep of elem', function (done) {
                var scheme = {
                        blocks: {
                            block: {
                                'block.deps.js': stringifyDepsJs({
                                    tech: 'sourceTech',
                                    mustDeps: [{ tech: 'destTech', block: 'other-block', elem: 'elem' }]
                                })
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    exepted = [{ name: 'other-block', elems: [{ name: 'elem' }] }];

                assert(scheme, bemdecl, exepted, done);
            });

            it('must add must dep of elems', function (done) {
                var scheme = {
                        blocks: {
                            block: {
                                'block.deps.js': stringifyDepsJs({
                                    tech: 'sourceTech',
                                    mustDeps: [{ tech: 'destTech', block: 'other-block', elems: ['elem-1', 'elem-2'] }]
                                })
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    exepted = [
                        { name: 'other-block' },
                        { name: 'other-block', elems: [{ name: 'elem-1' }] },
                        { name: 'other-block', elems: [{ name: 'elem-2' }] }
                    ];

                assert(scheme, bemdecl, exepted, done);
            });

            it('must add must dep of elem bool mod', function (done) {
                var scheme = {
                        blocks: {
                            block: {
                                'block.deps.js': stringifyDepsJs({
                                    tech: 'sourceTech',
                                    mustDeps: [
                                        { tech: 'destTech', block: 'other-block', elem: 'elem', mods: { mod: true } }
                                    ]
                                })
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    exepted = [{
                        name: 'other-block',
                        elems: [{ name: 'elem', mods: [{ name: 'mod', vals: [{ name: true }] }] }]
                    }];

                assert(scheme, bemdecl, exepted, done);
            });

            it('must add must dep of elem mod', function (done) {
                var scheme = {
                        blocks: {
                            block: {
                                'block.deps.js': stringifyDepsJs({
                                    tech: 'sourceTech',
                                    mustDeps: [{
                                        tech: 'destTech',
                                        block: 'other-block',
                                        elem: 'elem',
                                        mods: { 'mod-name': 'mod-val' }
                                    }]
                                })
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    exepted = [ {
                        name: 'other-block',
                        elems: [{ name: 'elem', mods: [{ name: 'mod-name', vals: [{ name: 'mod-val' }] }] }]
                    }];

                assert(scheme, bemdecl, exepted, done);
            });

            it('must add loop shouldDeps', function (done) {
                var scheme = {
                        blocks: {
                            A: {
                                'A.deps.js': stringifyDepsJs({
                                    tech: 'sourceTech',
                                    mustDeps: [{ tech: 'destTech', block: 'B' }]
                                })
                            },
                            B: {
                                'B.deps.js': stringifyDepsJs({
                                    mustDeps: [{ tech: 'destTech', block: 'A' }]
                                })
                            }
                        }
                    },
                    bemdecl = [{ name: 'A' }],
                    exepted = [
                        // { name: 'A' },
                        { name: 'B' }
                    ];

                assert(scheme, bemdecl, exepted, done);
            });
        });
    });
});

function getResults(fsScheme, bemdecl) {
    var levels = Object.keys(fsScheme),
        options = {
            sourceTech: 'sourceTech',
            destTech: 'destTech'
        },
        bundle;

    fsScheme['bundle'] = {};

    mockFs(fsScheme);

    bundle = new TestNode('bundle');
    bundle.provideTechData('?.bemdecl.js', { blocks: bemdecl });

    return bundle.runTech(levelsTech, { levels: levels })
        .then(function (levels) {
            bundle.provideTechData('?.levels', levels);

            return bundle.runTechAndGetResults(depsTech);
        })
        .spread(function (res) {
            bundle.provideTechData('?.deps.js', res);

            return bundle.runTechAndGetResults(filesTech);
        })
        .then(function (res) {
            var files = res['bundle.files'];

            bundle.provideTechData('?.files', files);

            return vow.all([
                bundle.runTechAndGetResults(bemdeclFromDepsByTechTech, options),
                bundle.runTechAndRequire(bemdeclFromDepsByTechTech, options)
            ]);
        })
        .spread(function (target1, target2) {
            return [target1['bundle.bemdecl.js'].blocks, target2[0].blocks];
        });
}

function assert(fsScheme, bemdecl, exepted, done) {
    getResults(fsScheme, bemdecl)
        .then(function (results) {
            results.forEach(function (actualBemdecl) {
                actualBemdecl.must.eql(exepted);
            });
        })
        .then(done, done);
}

function stringifyDepsJs(bemjson) {
    return '(' + JSON.stringify(bemjson) + ')';
}
