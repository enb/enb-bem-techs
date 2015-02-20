var path = require('path'),
    vow = require('vow'),
    mockFs = require('mock-fs'),
    TestNode = require('enb/lib/test/mocks/test-node'),
    levelsTech = require('../../techs/levels'),
    depsTech = require('../../techs/deps');

describe('techs', function () {
    describe('deps', function () {
        afterEach(function () {
            mockFs.restore();
        });

        it('must provide result from cache', function (done) {
            var bemdecl = [{ name: 'block' }],
                deps = [{ block: 'block' }, { block: 'other-block' }];

            mockFs({
                blocks: {},
                bundle: {
                    'bundle.bemdecl.js': 'exports.blocks = ' + JSON.stringify(bemdecl) + ';',
                    'bundle.deps.js': 'exports.deps = ' + JSON.stringify(deps) + ';'
                }
            });

            var bundle = new TestNode('bundle'),
                cache = bundle.getNodeCache('bundle.deps.js');

            cache.cacheFileInfo('decl-file', path.resolve('bundle/bundle.bemdecl.js'));
            cache.cacheFileInfo('deps-file', path.resolve('bundle/bundle.deps.js'));
            cache.cacheFileList('deps-file-list', []);

            bundle.runTech(levelsTech, { levels: ['blocks'] })
                .then(function (levels) {
                    bundle.provideTechData('?.levels', levels);

                    return bundle.runTechAndRequire(depsTech);
                })
                .spread(function (target) {
                    target.deps.must.eql([
                        { block: 'block' },
                        { block: 'other-block' }
                    ]);
                })
                .then(done, done);
        });

        describe('deps.js format', function () {
            it('must add should dep of block at deps format', function (done) {
                mockFs({
                    blocks: {
                        block: {
                            'block.deps.js': stringifyDepsJs({ shouldDeps: [{ block: 'other-block' }] })
                        }
                    },
                    bundle: {}
                });

                var bundle = new TestNode('bundle');

                bundle.provideTechData('?.deps.js', { deps: [{ block: 'block' }] });

                bundle.runTech(levelsTech, { levels: ['blocks'] })
                    .then(function (levels) {
                        bundle.provideTechData('?.levels', levels);

                        return bundle.runTechAndRequire(depsTech, {
                            bemdeclFile: '?.deps.js'
                        });
                    })
                    .spread(function (target) {
                        target.deps.must.eql([
                            { block: 'block' },
                            { block: 'other-block' }
                        ]);
                    })
                    .then(done, done);
            });

            it('must add should dep of block at deps as array format', function (done) {
                mockFs({
                    blocks: {
                        block: {
                            'block.deps.js': stringifyDepsJs({ shouldDeps: [{ block: 'other-block' }] })
                        }
                    },
                    bundle: {}
                });

                var bundle = new TestNode('bundle');

                bundle.provideTechData('?.deps.js', [{ block: 'block' }]);

                bundle.runTech(levelsTech, { levels: ['blocks'] })
                    .then(function (levels) {
                        bundle.provideTechData('?.levels', levels);

                        return bundle.runTechAndRequire(depsTech, {
                            bemdeclFile: '?.deps.js'
                        });
                    })
                    .spread(function (target) {
                        target.deps.must.eql([
                            { block: 'block' },
                            { block: 'other-block' }
                        ]);
                    })
                    .then(done, done);
            });

            it('must add should dep of block', function (done) {
                var scheme = {
                        blocks: {
                            block: {
                                'block.deps.js': stringifyDepsJs({ shouldDeps: [{ block: 'other-block' }] })
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    deps = [
                        { block: 'block' },
                        { block: 'other-block' }
                    ];

                assert(scheme, bemdecl, deps, done);
            });

            it('must add should dep of block boolean mod', function (done) {
                var scheme = {
                        blocks: {
                            block: {
                                'block.deps.js': stringifyDepsJs({
                                    shouldDeps: [{ block: 'other-block', mods: { mod: true } }]
                                })
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    deps = [
                        { block: 'block' },
                        { block: 'other-block' },
                        { block: 'other-block', mod: 'mod' },
                        { block: 'other-block', mod: 'mod', val: true }
                    ];

                assert(scheme, bemdecl, deps, done);
            });

            it('must add should dep of block mod', function (done) {
                var scheme = {
                        blocks: {
                            block: {
                                'block.deps.js': stringifyDepsJs({
                                    shouldDeps: [{ block: 'other-block', mods: { 'mod-name': 'mod-val' } }]
                                })
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    deps = [
                        { block: 'block' },
                        { block: 'other-block' },
                        { block: 'other-block', mod: 'mod-name' },
                        { block: 'other-block', mod: 'mod-name', val: 'mod-val' }
                    ];

                assert(scheme, bemdecl, deps, done);
            });

            it('must add should dep of elem', function (done) {
                var scheme = {
                        blocks: {
                            block: {
                                'block.deps.js': stringifyDepsJs({
                                    shouldDeps: [{ block: 'other-block', elem: 'elem' }]
                                })
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    deps = [
                        { block: 'block' },
                        { block: 'other-block', elem: 'elem' }
                    ];

                assert(scheme, bemdecl, deps, done);
            });

            it('must add should dep of elems', function (done) {
                var scheme = {
                        blocks: {
                            block: {
                                'block.deps.js': stringifyDepsJs({
                                    shouldDeps: [{ block: 'other-block', elems: ['elem-1', 'elem-2'] }]
                                })
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    deps = [
                        { block: 'block' },
                        { block: 'other-block' },
                        { block: 'other-block', elem: 'elem-1' },
                        { block: 'other-block', elem: 'elem-2' }
                    ];

                assert(scheme, bemdecl, deps, done);
            });

            it('must add should dep of elem bool mod', function (done) {
                var scheme = {
                        blocks: {
                            block: {
                                'block.deps.js': stringifyDepsJs({
                                    shouldDeps: [{ block: 'other-block', elem: 'elem', mods: { mod: true } }]
                                })
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    deps = [
                        { block: 'block' },
                        { block: 'other-block', elem: 'elem' },
                        { block: 'other-block', elem: 'elem', mod: 'mod' },
                        { block: 'other-block', elem: 'elem', mod: 'mod', val: true }
                    ];

                assert(scheme, bemdecl, deps, done);
            });

            it('must add should dep of elem mod', function (done) {
                var scheme = {
                        blocks: {
                            block: {
                                'block.deps.js': stringifyDepsJs({
                                    shouldDeps: [{
                                        block: 'other-block',
                                        elem: 'elem',
                                        mods: { 'mod-name': 'mod-val' }
                                    }]
                                })
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    deps = [
                        { block: 'block' },
                        { block: 'other-block', elem: 'elem' },
                        { block: 'other-block', elem: 'elem', mod: 'mod-name' },
                        { block: 'other-block', elem: 'elem', mod: 'mod-name', val: 'mod-val' }
                    ];

                assert(scheme, bemdecl, deps, done);
            });

            it('must add loop shouldDeps', function (done) {
                var scheme = {
                        blocks: {
                            A: {
                                'A.deps.js': stringifyDepsJs({
                                    shouldDeps: [{ block: 'B' }]
                                })
                            },
                            B: {
                                'B.deps.js': stringifyDepsJs({
                                    shouldDeps: [{ block: 'A' }]
                                })
                            }
                        }
                    },
                    bemdecl = [{ name: 'A' }],
                    deps = [
                        { block: 'A' },
                        { block: 'B' }
                    ];

                assert(scheme, bemdecl, deps, done);
            });

            it('must add must dep of block', function (done) {
                var scheme = {
                        blocks: {
                            block: {
                                'block.deps.js': stringifyDepsJs({ mustDeps: [{ block: 'other-block' }] })
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    deps = [
                        { block: 'other-block' },
                        { block: 'block' }
                    ];

                assert(scheme, bemdecl, deps, done);
            });

            it('must add must dep of self elem', function (done) {
                var scheme = {
                        blocks: {
                            block: {
                                'block.deps.js': stringifyDepsJs({ mustDeps: [{ elems: ['elem'] }] })
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    deps = [
                        { block: 'block', elem: 'elem' },
                        { block: 'block' }
                    ];

                assert(scheme, bemdecl, deps, done);
            });

            it('must add must dep of block boolean mod', function (done) {
                var scheme = {
                        blocks: {
                            block: {
                                'block.deps.js': stringifyDepsJs({
                                    mustDeps: [{ block: 'other-block', mods: { mod: true } }]
                                })
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    deps = [
                        { block: 'other-block' },
                        { block: 'other-block', mod: 'mod' },
                        { block: 'other-block', mod: 'mod', val: true },
                        { block: 'block' }
                    ];

                assert(scheme, bemdecl, deps, done);
            });

            it('must add must dep of block mod', function (done) {
                var scheme = {
                        blocks: {
                            block: {
                                'block.deps.js': stringifyDepsJs({
                                    mustDeps: [{ block: 'other-block', mods: { 'mod-name': 'mod-val' } }]
                                })
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    deps = [
                        { block: 'other-block' },
                        { block: 'other-block', mod: 'mod-name' },
                        { block: 'other-block', mod: 'mod-name', val: 'mod-val' },
                        { block: 'block' }
                    ];

                assert(scheme, bemdecl, deps, done);
            });

            it('must add must dep of elem', function (done) {
                var scheme = {
                        blocks: {
                            block: {
                                'block.deps.js': stringifyDepsJs({
                                    mustDeps: [{ block: 'other-block', elem: 'elem' }]
                                })
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    deps = [
                        { block: 'other-block', elem: 'elem' },
                        { block: 'block' }
                    ];

                assert(scheme, bemdecl, deps, done);
            });

            it('must add must dep of elems', function (done) {
                var scheme = {
                        blocks: {
                            block: {
                                'block.deps.js': stringifyDepsJs({
                                    mustDeps: [{ block: 'other-block', elems: ['elem-1', 'elem-2'] }]
                                })
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    deps = [
                        { block: 'other-block' },
                        { block: 'other-block', elem: 'elem-1' },
                        { block: 'other-block', elem: 'elem-2' },
                        { block: 'block' }
                    ];

                assert(scheme, bemdecl, deps, done);
            });

            it('must add must dep of elem bool mod', function (done) {
                var scheme = {
                        blocks: {
                            block: {
                                'block.deps.js': stringifyDepsJs({
                                    mustDeps: [{ block: 'other-block', elem: 'elem', mods: { mod: true } }]
                                })
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    deps = [
                        { block: 'other-block', elem: 'elem' },
                        { block: 'other-block', elem: 'elem', mod: 'mod' },
                        { block: 'other-block', elem: 'elem', mod: 'mod', val: true },
                        { block: 'block' }
                    ];

                assert(scheme, bemdecl, deps, done);
            });

            it('must add must dep of elem mod', function (done) {
                var scheme = {
                        blocks: {
                            block: {
                                'block.deps.js': stringifyDepsJs({
                                    mustDeps: [{
                                        block: 'other-block',
                                        elem: 'elem',
                                        mods: { 'mod-name': 'mod-val' }
                                    }]
                                })
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    deps = [
                        { block: 'other-block', elem: 'elem' },
                        { block: 'other-block', elem: 'elem', mod: 'mod-name' },
                        { block: 'other-block', elem: 'elem', mod: 'mod-name', val: 'mod-val' },
                        { block: 'block' }
                    ];

                assert(scheme, bemdecl, deps, done);
            });

            it('must throw if loop mustDeps', function (done) {
                var scheme = {
                        blocks: {
                            A: {
                                'A.deps.js': stringifyDepsJs({
                                    mustDeps: [{ block: 'B' }]
                                })
                            },
                            B: {
                                'B.deps.js': stringifyDepsJs({
                                    mustDeps: [{ block: 'A' }]
                                })
                            }
                        }
                    },
                    bemdecl = [{ name: 'A' }];

                getResults(scheme, bemdecl)
                    .fail(function (err) {
                        err.must.throw();
                    })
                    .then(done, done);
            });

            it('must remove dep of block', function (done) {
                var scheme = {
                        'level-1': {
                            block: {
                                'block.deps.js': stringifyDepsJs({ shouldDeps: [{ block: 'other-block' }] })
                            }
                        },
                        'level-2': {
                            block: {
                                'block.deps.js': stringifyDepsJs({ noDeps: [{ block: 'other-block' }] })
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    deps = [{ block: 'block' }];

                assert(scheme, bemdecl, deps, done);
            });

            it('must remove dep of block boolean mod', function (done) {
                var scheme = {
                        'level-1': {
                            block: {
                                'block.deps.js': stringifyDepsJs({
                                    shouldDeps: [{ block: 'other-block', mods: { mod: true } }]
                                })
                            }
                        },
                        'level-2': {
                            block: {
                                'block.deps.js': stringifyDepsJs({
                                    noDeps: [{ block: 'other-block', mods: { mod: true } }]
                                })
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    deps = [{ block: 'block' }];

                assert(scheme, bemdecl, deps, done);
            });

            it('must remove dep of block mod', function (done) {
                var scheme = {
                        'level-1': {
                            block: {
                                'block.deps.js': stringifyDepsJs({
                                    shouldDeps: [{ block: 'other-block', mods: { 'mod-name': 'mod-val' } }]
                                })
                            }
                        },
                        'level-2': {
                            block: {
                                'block.deps.js': stringifyDepsJs({
                                    noDeps: [{ block: 'other-block', mods: { 'mod-name': 'mod-val' } }]
                                })
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    deps = [{ block: 'block' }];

                assert(scheme, bemdecl, deps, done);
            });

            it('must remove dep of elem', function (done) {
                var scheme = {
                        'level-1': {
                            block: {
                                'block.deps.js': stringifyDepsJs({
                                    shouldDeps: [{ block: 'other-block', elem: 'elem' }]
                                })
                            }
                        },
                        'level-2': {
                            block: {
                                'block.deps.js': stringifyDepsJs({
                                    noDeps: [{ block: 'other-block', elem: 'elem' }]
                                })
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    deps = [{ block: 'block' }];

                assert(scheme, bemdecl, deps, done);
            });

            it('must remove dep of elems', function (done) {
                var scheme = {
                        'level-1': {
                            block: {
                                'block.deps.js': stringifyDepsJs({
                                    shouldDeps: [{ block: 'other-block', elems: ['elem-1', 'elem-2'] }]
                                })
                            }
                        },
                        'level-2': {
                            block: {
                                'block.deps.js': stringifyDepsJs({
                                    noDeps: [{ block: 'other-block', elems: ['elem-1', 'elem-2'] }]
                                })
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    deps = [{ block: 'block' }];

                assert(scheme, bemdecl, deps, done);
            });

            it('must remove dep of elem bool mod', function (done) {
                var scheme = {
                        'level-1': {
                            block: {
                                'block.deps.js': stringifyDepsJs({
                                    shouldDeps: [{ block: 'other-block', elem: 'elem', mods: { mod: true } }]
                                })
                            }
                        },
                        'level-2': {
                            block: {
                                'block.deps.js': stringifyDepsJs({
                                    noDeps: [{ block: 'other-block', elem: 'elem', mods: { mod: true } }]
                                })
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    deps = [{ block: 'block' }];

                assert(scheme, bemdecl, deps, done);
            });

            it('must remove dep of elem mod', function (done) {
                var scheme = {
                        'level-1': {
                            block: {
                                'block.deps.js': stringifyDepsJs({
                                    shouldDeps: [{
                                        block: 'other-block',
                                        elem: 'elem',
                                        mods: { 'mod-name': 'mod-val' }
                                    }]
                                })
                            }
                        },
                        'level-2': {
                            block: {
                                'block.deps.js': stringifyDepsJs({
                                    noDeps: [{
                                        block: 'other-block',
                                        elem: 'elem',
                                        mods: { 'mod-name': 'mod-val' }
                                    }]
                                })
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    deps = [
                        { block: 'block' }
                    ];

                assert(scheme, bemdecl, deps, done);
            });

            it('must break shouldDeps loop', function (done) {
                var scheme = {
                        'level-1': {
                            A: {
                                'A.deps.js': stringifyDepsJs({
                                    shouldDeps: [{ block: 'B' }]
                                })
                            },
                            B: {
                                'B.deps.js': stringifyDepsJs({
                                    shouldDeps: [{ block: 'A' }]
                                })
                            }
                        },
                        'level-2': {
                            A: {
                                'A.deps.js': stringifyDepsJs({
                                    noDeps: [{ block: 'B' }]
                                })
                            }
                        }
                    },
                    bemdecl = [{ name: 'A' }],
                    deps = [
                        { block: 'A' }
                    ];

                assert(scheme, bemdecl, deps, done);
            });
        });

        describe('deps.yaml format', function () {
            it('must add should dep of block', function (done) {
                var scheme = {
                        blocks: {
                            block: {
                                'block.deps.yaml': '- block: other-block'
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    deps = [
                        { block: 'block' },
                        { block: 'other-block' }
                    ];

                assert(scheme, bemdecl, deps, done);
            });

            it('must add should dep of block boolean mod', function (done) {
                var scheme = {
                        blocks: {
                            block: {
                                'block.deps.yaml': '- block: other-block\n  mods: { mod: true }'
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    deps = [
                        { block: 'block' },
                        { block: 'other-block' },
                        { block: 'other-block', mod: 'mod' },
                        { block: 'other-block', mod: 'mod', val: true }
                    ];

                assert(scheme, bemdecl, deps, done);
            });

            it('must add should dep of block mod', function (done) {
                var scheme = {
                        blocks: {
                            block: {
                                'block.deps.yaml': '- block: other-block\n  mods: { mod-name: mod-val }'
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    deps = [
                        { block: 'block' },
                        { block: 'other-block' },
                        { block: 'other-block', mod: 'mod-name' },
                        { block: 'other-block', mod: 'mod-name', val: 'mod-val' }
                    ];

                assert(scheme, bemdecl, deps, done);
            });

            it('must add should dep of elem', function (done) {
                var scheme = {
                        blocks: {
                            block: {
                                'block.deps.yaml': '- block: other-block\n  elem: elem'
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    deps = [
                        { block: 'block' },
                        { block: 'other-block', elem: 'elem' }
                    ];

                assert(scheme, bemdecl, deps, done);
            });

            it('must add should dep of elems', function (done) {
                var scheme = {
                        blocks: {
                            block: {
                                'block.deps.yaml': '- block: other-block\n  elems: [elem-1, elem-2]'
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    deps = [
                        { block: 'block' },
                        { block: 'other-block' },
                        { block: 'other-block', elem: 'elem-1' },
                        { block: 'other-block', elem: 'elem-2' }
                    ];

                assert(scheme, bemdecl, deps, done);
            });

            it('must add should dep of elem bool mod', function (done) {
                var scheme = {
                        blocks: {
                            block: {
                                'block.deps.yaml': '- block: other-block\n  elem: elem\n  mods: { mod: true }'
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    deps = [
                        { block: 'block' },
                        { block: 'other-block', elem: 'elem' },
                        { block: 'other-block', elem: 'elem', mod: 'mod' },
                        { block: 'other-block', elem: 'elem', mod: 'mod', val: true }
                    ];

                assert(scheme, bemdecl, deps, done);
            });

            it('must add should dep of elem mod', function (done) {
                var scheme = {
                        blocks: {
                            block: {
                                'block.deps.yaml': '- block: other-block\n  elem: elem\n  mods: { mod-name: mod-val }'
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    deps = [
                        { block: 'block' },
                        { block: 'other-block', elem: 'elem' },
                        { block: 'other-block', elem: 'elem', mod: 'mod-name' },
                        { block: 'other-block', elem: 'elem', mod: 'mod-name', val: 'mod-val' }
                    ];

                assert(scheme, bemdecl, deps, done);
            });

            it('must add loop shouldDeps', function (done) {
                var scheme = {
                        blocks: {
                            A: {
                                'A.deps.yaml': '- block: B'
                            },
                            B: {
                                'B.deps.yaml': '- block: A'
                            }
                        }
                    },
                    bemdecl = [{ name: 'A' }],
                    deps = [
                        { block: 'A' },
                        { block: 'B' }
                    ];

                assert(scheme, bemdecl, deps, done);
            });

            it('must add must dep of block', function (done) {
                var scheme = {
                        blocks: {
                            block: {
                                'block.deps.yaml': '- block: other-block\n  required: true'
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    deps = [
                        { block: 'other-block' },
                        { block: 'block' }
                    ];

                assert(scheme, bemdecl, deps, done);
            });

            it('must add must dep of block boolean mod', function (done) {
                var scheme = {
                        blocks: {
                            block: {
                                'block.deps.yaml': '- block: other-block\n  required: true\n  mods: { mod: true }'
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    deps = [
                        { block: 'other-block' },
                        { block: 'other-block', mod: 'mod' },
                        { block: 'other-block', mod: 'mod', val: true },
                        { block: 'block' }
                    ];

                assert(scheme, bemdecl, deps, done);
            });

            it('must add must dep of block mod', function (done) {
                var scheme = {
                        blocks: {
                            block: {
                                'block.deps.yaml': '- block: other-block\n  required: true\n' +
                                '  mods: { mod-name: mod-val }'
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    deps = [
                        { block: 'other-block' },
                        { block: 'other-block', mod: 'mod-name' },
                        { block: 'other-block', mod: 'mod-name', val: 'mod-val' },
                        { block: 'block' }
                    ];

                assert(scheme, bemdecl, deps, done);
            });

            it('must add must dep of elem', function (done) {
                var scheme = {
                        blocks: {
                            block: {
                                'block.deps.yaml': '- block: other-block\n  required: true\n  elem: elem'
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    deps = [
                        { block: 'other-block', elem: 'elem' },
                        { block: 'block' }
                    ];

                assert(scheme, bemdecl, deps, done);
            });

            it('must add must dep of elems', function (done) {
                var scheme = {
                        blocks: {
                            block: {
                                'block.deps.yaml': '- block: other-block\n  required: true\n  elems: [elem-1, elem-2]'
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    deps = [
                        { block: 'other-block' },
                        { block: 'other-block', elem: 'elem-1' },
                        { block: 'other-block', elem: 'elem-2' },
                        { block: 'block' }
                    ];

                assert(scheme, bemdecl, deps, done);
            });

            it('must add must dep of elem bool mod', function (done) {
                var scheme = {
                        blocks: {
                            block: {
                                'block.deps.yaml': '- block: other-block\n  required: true\n' +
                                '  elem: elem\n  mods: { mod: true }'
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    deps = [
                        { block: 'other-block', elem: 'elem' },
                        { block: 'other-block', elem: 'elem', mod: 'mod' },
                        { block: 'other-block', elem: 'elem', mod: 'mod', val: true },
                        { block: 'block' }
                    ];

                assert(scheme, bemdecl, deps, done);
            });

            it('must add must dep of elem mod', function (done) {
                var scheme = {
                        blocks: {
                            block: {
                                'block.deps.yaml': '- block: other-block\n  required: true\n' +
                                '  elem: elem\n  mods: { mod-name: mod-val }'
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    deps = [
                        { block: 'other-block', elem: 'elem' },
                        { block: 'other-block', elem: 'elem', mod: 'mod-name' },
                        { block: 'other-block', elem: 'elem', mod: 'mod-name', val: 'mod-val' },
                        { block: 'block' }
                    ];

                assert(scheme, bemdecl, deps, done);
            });

            it('must add loop mustDeps', function (done) {
                var scheme = {
                        blocks: {
                            A: {
                                'A.deps.yaml': '- block: B\n  required: true'
                            },
                            B: {
                                'B.deps.yaml': '- block: A\n  required: true'
                            }
                        }
                    },
                    bemdecl = [{ name: 'A' }];

                getResults(scheme, bemdecl)
                    .fail(function (err) {
                        err.must.throw();
                    })
                    .then(done, done);
            });

            it('must resolve shouldDeps after mustDeps', function (done) {
                var scheme = {
                        blocks: {
                            A: {
                                'A.deps.js': stringifyDepsJs({
                                    mustDeps: [{ block: 'B' }]
                                })
                            },
                            B: {
                                'B.deps.js': stringifyDepsJs({
                                    shouldDeps: [{ block: 'C' }]
                                })
                            },
                            C: {
                                'C.deps.js': stringifyDepsJs({
                                    mustDeps: [{ block: 'A' }]
                                })
                            }
                        }
                    },
                    bemdecl = [{ name: 'A' }],
                    deps = [
                        { block: 'B' },
                        { block: 'A' },
                        { block: 'C' }
                    ];

                assert(scheme, bemdecl, deps, done);
            });
        });
    });
});

function getResults(fsScheme, bemdecl) {
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
                fsBundle.runTechAndRequire(depsTech),
                fsBundle.runTechAndGetResults(depsTech),
                dataBundle.runTechAndRequire(depsTech),
                dataBundle.runTechAndGetResults(depsTech)
            ]);
        })
        .spread(function (res1, res2, res3, res4) {
            return [
                res1[0].deps, res2['fs-bundle.deps.js'].deps,
                res3[0].deps, res4['data-bundle.deps.js'].deps
            ];
        });
}

function assert(fsScheme, bemdecl, deps, done) {
    getResults(fsScheme, bemdecl, deps)
        .then(function (results) {
            results.forEach(function (actualDeps) {
                actualDeps.must.eql(deps);
            });
        })
        .then(done, done);
}

function stringifyDepsJs(bemjson) {
    return '(' + JSON.stringify(bemjson) + ')';
}
