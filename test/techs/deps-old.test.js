var path = require('path'),

    vow = require('vow'),
    mockFs = require('mock-fs'),
    TestNode = require('mock-enb/lib/mock-node'),

    techs = require('../utils/techs'),
    levelsTech = techs.levels,
    depsTech = techs.depsOld;

describe('techs: deps-old', function () {
    afterEach(function () {
        mockFs.restore();
    });

    it('must provide result from cache', function () {
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

        return bundle.runTech(levelsTech, { levels: ['blocks'] })
            .then(function (levels) {
                bundle.provideTechData('?.levels', levels);

                return bundle.runTechAndRequire(depsTech);
            })
            .spread(function (target) {
                target.deps.must.eql([
                    { block: 'block' },
                    { block: 'other-block' }
                ]);
            });
    });

    describe('deps.js format', function () {
        it('must add should dep of block at deps as array format', function () {
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

            return bundle.runTech(levelsTech, { levels: ['blocks'] })
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
                });
        });

        it('must add should dep of block at deps format', function () {
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

            return bundle.runTech(levelsTech, { levels: ['blocks'] })
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
                });
        });

        it('must add should dep of block', function () {
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

            return assert(scheme, bemdecl, deps);
        });

        it('must add should dep of block boolean mod', function () {
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

            return assert(scheme, bemdecl, deps);
        });

        it('must add should dep of block mod', function () {
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

            return assert(scheme, bemdecl, deps);
        });

        it('must add should dep of elem', function () {
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

            return assert(scheme, bemdecl, deps);
        });

        it('must add should dep of elems', function () {
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

            return assert(scheme, bemdecl, deps);
        });

        it('must add should dep of elem bool mod', function () {
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

            return assert(scheme, bemdecl, deps);
        });

        it('must add should dep of elem mod', function () {
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

            return assert(scheme, bemdecl, deps);
        });

        it('must support elem as array', function () {
            var scheme = {
                    blocks: {
                        block: {
                            'block.deps.js': stringifyDepsJs({
                                shouldDeps: [{
                                    block: 'other-block',
                                    elem: ['elem']
                                }]
                            })
                        }
                    }
                },
                bemdecl = [{ name: 'block' }],
                deps = [
                    { block: 'block' },
                    { block: 'other-block', elem: 'elem' }
                ];

            return assert(scheme, bemdecl, deps);
        });

        it('must respect context for elem', function () {
            var scheme = {
                    blocks: {
                        block: {
                            'block.deps.js': stringifyDepsJs({
                                shouldDeps: [
                                    { elem: 'elem' }
                                ]
                            })
                        }
                    }
                },
                bemdecl = [{ name: 'block' }],
                deps = [
                    { block: 'block' },
                    { block: 'block', elem: 'elem' }
                ];

            return assert(scheme, bemdecl, deps);
        });

        it('must respect context for mod', function () {
            var scheme = {
                    blocks: {
                        block: {
                            'block.deps.js': stringifyDepsJs({
                                shouldDeps: [
                                    { mod: 'mod' }
                                ]
                            })
                        }
                    }
                },
                bemdecl = [{ name: 'block' }],
                deps = [
                    { block: 'block' },
                    { block: 'block', mod: 'mod' }
                ];

            return assert(scheme, bemdecl, deps);
        });

        it('must respect context for mods', function () {
            var scheme = {
                    blocks: {
                        block: {
                            'block.deps.js': stringifyDepsJs({
                                shouldDeps: [
                                    { mods: { mod: 'val' } }
                                ]
                            })
                        }
                    }
                },
                bemdecl = [{ name: 'block' }],
                deps = [
                    { block: 'block' },
                    { block: 'block', mod: 'mod' },
                    { block: 'block', mod: 'mod', val: 'val' }
                ];

            return assert(scheme, bemdecl, deps);
        });

        it('must respect context for elem mods', function () {
            var scheme = {
                    blocks: {
                        block: {
                            __elem: {
                                'block__elem.deps.js': stringifyDepsJs({
                                    shouldDeps: [
                                        { mods: { mod: 'val' } }
                                    ]
                                })
                            }
                        }
                    }
                },
                bemdecl = [{ name: 'block', elems: [{ name: 'elem' }] }],
                deps = [
                    { block: 'block' },
                    { block: 'block', elem: 'elem' },
                    { block: 'block', elem: 'elem', mod: 'mod' },
                    { block: 'block', elem: 'elem', mod: 'mod', val: 'val' }
                ];

            return assert(scheme, bemdecl, deps);
        });

        it('must respect context for elem mod', function () {
            var scheme = {
                    blocks: {
                        block: {
                            __elem: {
                                'block__elem.deps.js': stringifyDepsJs({
                                    shouldDeps: [
                                        { mod: 'mod' }
                                    ]
                                })
                            }
                        }
                    }
                },
                bemdecl = [{ name: 'block', elems: [{ name: 'elem' }] }],
                deps = [
                    { block: 'block' },
                    { block: 'block', elem: 'elem' },
                    { block: 'block', elem: 'elem', mod: 'mod' }
                ];

            return assert(scheme, bemdecl, deps);
        });

        it('must support boolean mods as array', function () {
            var scheme = {
                    blocks: {
                        block: {
                            'block.deps.js': stringifyDepsJs({
                                shouldDeps: [
                                    { block: 'block', mods: ['mod-1', 'mod-2'] },
                                    { block: 'block', elem: 'elem', mods: ['mod-1', 'mod-2'] }
                                ]
                            })
                        }
                    }
                },
                bemdecl = [{ name: 'block' }],
                deps = [
                    { block: 'block' },
                    { block: 'block', mod: 'mod-1' },
                    { block: 'block', mod: 'mod-2' },
                    { block: 'block', elem: 'elem' },
                    { block: 'block', elem: 'elem', mod: 'mod-1' },
                    { block: 'block', elem: 'elem', mod: 'mod-2' }
                ];

            return assert(scheme, bemdecl, deps);
        });

        it('must add loop shouldDeps', function () {
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

            return assert(scheme, bemdecl, deps);
        });

        it('must add must dep of block', function () {
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

            return assert(scheme, bemdecl, deps);
        });

        it('must add must dep of self elem', function () {
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

            return assert(scheme, bemdecl, deps);
        });

        it('must add must dep of block boolean mod', function () {
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

            return assert(scheme, bemdecl, deps);
        });

        it('must add must dep of block mod', function () {
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

            return assert(scheme, bemdecl, deps);
        });

        it('must add must dep of elem', function () {
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

            return assert(scheme, bemdecl, deps);
        });

        it('must add must dep of elems', function () {
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

            return assert(scheme, bemdecl, deps);
        });

        it('must add must dep of elem bool mod', function () {
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

            return assert(scheme, bemdecl, deps);
        });

        it('must add must dep of elem mod', function () {
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

            return assert(scheme, bemdecl, deps);
        });

        it('must produce warning if loop mustDeps in non-strict mode', function () {
            var scheme = {
                    blocks: {
                        A: {
                            'A.deps.js': stringifyDepsJs({
                                mustDeps: [{ block: 'B' }]
                            })
                        },
                        B: {
                            'B.deps.js': stringifyDepsJs({
                                mustDeps: [{ block: 'C' }, { block: 'A' }]
                            })
                        },
                        C: {
                            'C.deps.js': stringifyDepsJs({
                                mustDeps: [{ block: 'B' }]
                            })
                        }
                    }
                },
                bemdecl = [{ name: 'A' }],
                deps = [
                    { block: 'C' },
                    { block: 'B' },
                    { block: 'A' }
                ];

            return assert(scheme, bemdecl, deps, { strict: false })
                .then(function (res) {
                    // warnings should only address loops in mustDeps
                    res.messages.must.not.be.empty();
                    res.messages.filter(function (obj) {
                        return obj.action === '[circular mustDeps]';
                    }).length.must.equal(res.messages.length);
                });
        });

        it('must throw if loop mustDeps in strict mode', function () {
            var scheme = {
                    blocks: {
                        A: {
                            'A.deps.js': stringifyDepsJs({
                                mustDeps: [{ block: 'B' }]
                            })
                        },
                        B: {
                            'B.deps.js': stringifyDepsJs({
                                mustDeps: [{ block: 'C' }, { block: 'A' }]
                            })
                        },
                        C: {
                            'C.deps.js': stringifyDepsJs({
                                mustDeps: [{ block: 'B' }]
                            })
                        }
                    }
                },
                bemdecl = [{ name: 'A' }];

            return assertError(scheme, bemdecl, { strict: true });
        });

        it('must detect complex mustDeps loop', function () {
            var scheme = {
                    blocks: {
                        A: {
                            'A.deps.js': stringifyDepsJs({
                                mustDeps: [{ block: 'B' }]
                            })
                        },
                        B: {
                            'B.deps.js': stringifyDepsJs({
                                mustDeps: [{ block: 'C' }, { block: 'D' }]
                            })
                        },
                        C: {
                            'C.deps.js': stringifyDepsJs({
                                shouldDeps: [{ block: 'E' }]
                            })
                        },
                        D: {
                            'D.deps.js': stringifyDepsJs({
                                mustDeps: [{ block: 'E' }]
                            })
                        },
                        E: {
                            'E.deps.js': stringifyDepsJs({
                                mustDeps: [{ block: 'B' }]
                            })
                        }
                    }
                },
                bemdecl = [{ name: 'A' }];

            return assertError(scheme, bemdecl, { strict: true });
        });

        it('must remove dep of block', function () {
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

            return assert(scheme, bemdecl, deps);
        });

        it('must remove dep of block boolean mod', function () {
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

            return assert(scheme, bemdecl, deps);
        });

        it('must remove dep of block mod', function () {
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

            return assert(scheme, bemdecl, deps);
        });

        it('must remove dep of elem', function () {
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

            return assert(scheme, bemdecl, deps);
        });

        it('must remove dep of elems', function () {
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

            return assert(scheme, bemdecl, deps);
        });

        it('must remove dep of elem bool mod', function () {
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

            return assert(scheme, bemdecl, deps);
        });

        it('must remove dep of elem mod', function () {
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

            return assert(scheme, bemdecl, deps);
        });

        it('must break shouldDeps loop', function () {
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

            return assert(scheme, bemdecl, deps);
        });

        it('must resolve shouldDeps after mustDeps', function () {
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

            return assert(scheme, bemdecl, deps);
        });

        it('must skip empty dependency files', function () {
            var scheme = {
                    blocks: {
                        block: {
                            'block.deps.js': ''
                        }
                    }
                },
                bemdecl = [{ name: 'block' }],
                deps = [
                    { block: 'block' }
                ];

            return assert(scheme, bemdecl, deps);
        });

        it('must skip dependency files with commented code', function () {
            var scheme = {
                    blocks: {
                        block: {
                            'block.deps.js': '/*' + stringifyDepsJs({ shouldDeps: [{ block: 'other-block' }] }) + '*/'
                        }
                    }
                },
                bemdecl = [{ name: 'block' }],
                deps = [
                    { block: 'block' }
                ];

            return assert(scheme, bemdecl, deps);
        });

        describe('short aliases for shouldDeps', function () {
            it('should support notation with blocks as array of strings', function () {
                var scheme = {
                        blocks: {
                            block: {
                                'block.deps.js': stringifyDepsJs({ shouldDeps: (['other-block']) })
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    deps = [
                        { block: 'block' },
                        { block: 'other-block' }
                    ];

                return assert(scheme, bemdecl, deps);
            });

            it('should support notation with a block as a string', function () {
                var scheme = {
                        blocks: {
                            block: {
                                'block.deps.js': stringifyDepsJs({ shouldDeps: 'other-block' })
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    deps = [
                        { block: 'block' },
                        { block: 'other-block' }
                    ];

                return assert(scheme, bemdecl, deps);
            });
        });
    });
});

function getResults(fsScheme, bemdecl, techOpts) {
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
                fsBundle.runTechAndRequire(depsTech, techOpts),
                fsBundle.runTechAndGetResults(depsTech, techOpts),
                dataBundle.runTechAndRequire(depsTech, techOpts),
                dataBundle.runTechAndGetResults(depsTech, techOpts)
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

function assert(fsScheme, bemdecl, deps, techOpts) {
    return getResults(fsScheme, bemdecl, techOpts)
        .then(function (res) {
            res.forEach(function (actualDeps) {
                actualDeps.must.eql(deps);
            });
            return res;
        }, function (err) {
            throw err;
        });
}

function assertError(fsScheme, bemdecl, techOpts) {
    return getResults(fsScheme, bemdecl, techOpts)
        .then(function () {
            // test should always throw error
            (true).must.not.be.truthy();
        }, function (err) {
            err.must.be.an.instanceof(Error);
            // error message should only address loops in mustDeps
            err.message.must.contain('Circular mustDeps:');
        });
}

function stringifyDepsJs(bemjson) {
    return '(' + JSON.stringify(bemjson) + ')';
}
