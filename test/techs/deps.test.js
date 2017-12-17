'use strict';

const path = require('path');
const vow = require('vow');
const mockFs = require('mock-fs');
const TestNode = require('mock-enb/lib/mock-node');
const techs = require('../..');
const levelsTech = techs.levels;
const depsTech = techs.deps;

describe('techs: deps', () => {
    afterEach(() => {
        mockFs.restore();
    });

    it('must provide result from cache', () => {
        const bemdecl = [{ name: 'block' }];
        const deps = [{ block: 'block' }, { block: 'other-block' }];

        mockFs({
            blocks: {},
            bundle: {
                'bundle.bemdecl.js': `exports.blocks = ${JSON.stringify(bemdecl)};`,
                'bundle.deps.js': `exports.deps = ${JSON.stringify(deps)};`
            }
        });

        const bundle = new TestNode('bundle');
        const cache = bundle.getNodeCache('bundle.deps.js');

        cache.cacheFileInfo('decl-file', path.resolve('bundle/bundle.bemdecl.js'));
        cache.cacheFileInfo('deps-file', path.resolve('bundle/bundle.deps.js'));
        cache.cacheFileList('deps-file-list', []);

        return bundle.runTech(levelsTech, { levels: ['blocks'] })
            .then(levels => {
                bundle.provideTechData('?.levels', levels);

                return bundle.runTechAndRequire(depsTech);
            })
            .spread(target => {
                target.deps.must.eql([
                    { block: 'block' },
                    { block: 'other-block' }
                ]);
            });
    });

    describe('deps.js format', () => {
        it('must add should dep of block at deps format', () => {
            mockFs({
                blocks: {
                    block: {
                        'block.deps.js': stringifyDepsJs({ shouldDeps: [{ block: 'other-block' }] })
                    }
                },
                bundle: {}
            });

            const bundle = new TestNode('bundle');

            bundle.provideTechData('?.deps.js', { deps: [{ block: 'block' }] });

            return bundle.runTech(levelsTech, { levels: ['blocks'] })
                .then(levels => {
                    bundle.provideTechData('?.levels', levels);

                    return bundle.runTechAndRequire(depsTech, {
                        bemdeclFile: '?.deps.js'
                    });
                })
                .spread(target => {
                    target.deps.must.eql([
                        { block: 'block' },
                        { block: 'other-block' }
                    ]);
                });
        });

        it('must add should dep of block at deps as array format', () => {
            mockFs({
                blocks: {
                    block: {
                        'block.deps.js': stringifyDepsJs({ shouldDeps: [{ block: 'other-block' }] })
                    }
                },
                bundle: {}
            });

            const bundle = new TestNode('bundle');

            bundle.provideTechData('?.deps.js', [{ block: 'block' }]);

            return bundle.runTech(levelsTech, { levels: ['blocks'] })
                .then(levels => {
                    bundle.provideTechData('?.levels', levels);

                    return bundle.runTechAndRequire(depsTech, {
                        bemdeclFile: '?.deps.js'
                    });
                })
                .spread(target => {
                    target.deps.must.eql([
                        { block: 'block' },
                        { block: 'other-block' }
                    ]);
                });
        });

        it('must add should dep of block', () => {
            const scheme = {
                blocks: {
                    block: {
                        'block.deps.js': stringifyDepsJs({ shouldDeps: [{ block: 'other-block' }] })
                    }
                }
            };

            const bemdecl = [{ name: 'block' }];

            const deps = [
                { block: 'block' },
                { block: 'other-block' }
            ];

            return assert(scheme, bemdecl, deps);
        });
        /*
         actual
         [
             {
                "block": "other-block"
             },
             {
                "block": "block"
             },
             {
                 "block": "other-block",
                 "mod": "mod",
                 "val": true
             }
         ]
        */
        it.skip('must add should dep of block boolean mod', () => {
            const scheme = {
                blocks: {
                    block: {
                        'block.deps.js': stringifyDepsJs({
                            shouldDeps: [{ block: 'other-block', mods: { mod: true } }]
                        })
                    }
                }
            };

            const bemdecl = [{ name: 'block' }];

            const deps = [
                { block: 'block' },
                { block: 'other-block' },
                { block: 'other-block', mod: 'mod' },
                { block: 'other-block', mod: 'mod', val: true }
            ];

            return assert(scheme, bemdecl, deps);
        });

        /*
        actual
        [
             {
                "block": "other-block"
             },
             {
                 "block": "other-block",
                 "mod": "mod-name",
                 "val": true
             },
             {
                "block": "block"
             },
             {
                 "block": "other-block",
                 "mod": "mod-name",
                 "val": "mod-val"
             }
        ]
        */
        it.skip('must add should dep of block mod', () => {
            const scheme = {
                blocks: {
                    block: {
                        'block.deps.js': stringifyDepsJs({
                            shouldDeps: [{ block: 'other-block', mods: { 'mod-name': 'mod-val' } }]
                        })
                    }
                }
            };

            const bemdecl = [{ name: 'block' }];

            const deps = [
                { block: 'block' },
                { block: 'other-block' },
                { block: 'other-block', mod: 'mod-name' },
                { block: 'other-block', mod: 'mod-name', val: 'mod-val' }
            ];

            return assert(scheme, bemdecl, deps);
        });

        /*
        actual

         [
             {
                "block": "block"
             },
             {
                 "block": "block",
                 "mod": "mod-name",
                 "val": true
             },
             {
                 "block": "block",
                 "mod": "mod-name",
                 "val": "mod-val"
             }
         ]
        */
        it.skip('must add should dep of self mod', () => {
            const scheme = {
                blocks: {
                    block: {
                        'block.deps.js': stringifyDepsJs({
                            shouldDeps: [{ mods: { 'mod-name': 'mod-val' } }]
                        })
                    }
                }
            };

            const bemdecl = [{ name: 'block' }];

            const deps = [
                { block: 'block' },
                { block: 'block', mod: 'mod-name' },
                { block: 'block', mod: 'mod-name', val: 'mod-val' }
            ];

            return assert(scheme, bemdecl, deps);
        });

        it('must add should dep of elem', () => {
            const scheme = {
                blocks: {
                    block: {
                        'block.deps.js': stringifyDepsJs({
                            shouldDeps: [{ block: 'other-block', elem: 'elem' }]
                        })
                    }
                }
            };

            const bemdecl = [{ name: 'block' }];

            const deps = [
                { block: 'block' },
                { block: 'other-block', elem: 'elem' }
            ];

            return assert(scheme, bemdecl, deps);
        });

        /*
         actual

         [
             {
                "block": "other-block"
             },
             {
                "block": "block"
             },
             {
                 "block": "other-block",
                 "elem": "elem-1"
             },
             {
                 "block": "other-block",
                 "elem": "elem-2"
             }
         ]
        */
        it.skip('must add should dep of elems', () => {
            const scheme = {
                blocks: {
                    block: {
                        'block.deps.js': stringifyDepsJs({
                            shouldDeps: [{ block: 'other-block', elems: ['elem-1', 'elem-2'] }]
                        })
                    }
                }
            };

            const bemdecl = [{ name: 'block' }];

            const deps = [
                { block: 'block' },
                { block: 'other-block' },
                { block: 'other-block', elem: 'elem-1' },
                { block: 'other-block', elem: 'elem-2' }
            ];

            return assert(scheme, bemdecl, deps);
        });

        /*
         actual

         [
            {
                "block": "other-block",
                "elem": "elem"
            },
            {
                "block": "block"
            },
            {
                "block": "other-block",
                "elem": "elem",
                "mod": "mod",
                "val": true
            }
         ]
        */
        it.skip('must add should dep of elem bool mod', () => {
            const scheme = {
                blocks: {
                    block: {
                        'block.deps.js': stringifyDepsJs({
                            shouldDeps: [{ block: 'other-block', elem: 'elem', mods: { mod: true } }]
                        })
                    }
                }
            };

            const bemdecl = [{ name: 'block' }];

            const deps = [
                { block: 'block' },
                { block: 'other-block', elem: 'elem' },
                { block: 'other-block', elem: 'elem', mod: 'mod' },
                { block: 'other-block', elem: 'elem', mod: 'mod', val: true }
            ];

            return assert(scheme, bemdecl, deps);
        });

        /*
        actual

        [
            {
                "block": "other-block",
                "elem": "elem"
            },
            {
                "block": "other-block",
                "elem": "elem",
                "mod": "mod-name",
                "val": true
            },
            {
                "block": "block"
            },
            {
                "block": "other-block",
                "elem": "elem",
                "mod": "mod-name",
                "val": "mod-val"
            }
        ]
        */
        it.skip('must add should dep of elem mod', () => {
            const scheme = {
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
            };

            const bemdecl = [{ name: 'block' }];

            const deps = [
                { block: 'block' },
                { block: 'other-block', elem: 'elem' },
                { block: 'other-block', elem: 'elem', mod: 'mod-name' },
                { block: 'other-block', elem: 'elem', mod: 'mod-name', val: 'mod-val' }
            ];

            return assert(scheme, bemdecl, deps);
        });

        /*
         actual

         [
             {
                "block": "block"
             },
             {
                 "block": "block",
                 "elem": "elem"
             },
             {
                 "block": "block",
                 "elem": "elem",
                 "mod": "mod-name",
                 "val": true
             },
             {
                 "block": "block",
                 "elem": "elem",
                 "mod": "mod-name",
                 "val": "mod-val"
             }
         ]
        */
        it.skip('must add should dep of self mod to elem', () => {
            const scheme = {
                blocks: {
                    block: {
                        __elem: {
                            'block__elem.deps.js': stringifyDepsJs({
                                shouldDeps: [{
                                    mods: { 'mod-name': 'mod-val' }
                                }]
                            })
                        }
                    }
                }
            };

            const bemdecl = [{ name: 'block', elems: [{ name: 'elem' }] }];

            const deps = [
                { block: 'block' },
                { block: 'block', elem: 'elem' },
                { block: 'block', elem: 'elem', mod: 'mod-name' },
                { block: 'block', elem: 'elem', mod: 'mod-name', val: 'mod-val' }
            ];

            return assert(scheme, bemdecl, deps);
        });

        it('must support elem as array', () => {
            const scheme = {
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
            };

            const bemdecl = [{ name: 'block' }];

            const deps = [
                { block: 'block' },
                { block: 'other-block', elem: 'elem' }
            ];

            return assert(scheme, bemdecl, deps);
        });

        it('must respect context for elem', () => {
            const scheme = {
                blocks: {
                    block: {
                        'block.deps.js': stringifyDepsJs({
                            shouldDeps: [
                                { elem: 'elem' }
                            ]
                        })
                    }
                }
            };

            const bemdecl = [{ name: 'block' }];

            const deps = [
                { block: 'block' },
                { block: 'block', elem: 'elem' }
            ];

            return assert(scheme, bemdecl, deps);
        });

        /*
        actual

        [
            {
                "block": "block"
            },
            {
                "block": "block",
                "mod": "mod",
                "val": true
            }
        ]
        */
        it.skip('must respect context for mod', () => {
            const scheme = {
                blocks: {
                    block: {
                        'block.deps.js': stringifyDepsJs({
                            shouldDeps: [
                                { mod: 'mod' }
                            ]
                        })
                    }
                }
            };

            const bemdecl = [{ name: 'block' }];

            const deps = [
                { block: 'block' },
                { block: 'block', mod: 'mod' }
            ];

            return assert(scheme, bemdecl, deps);
        });

        /*
        actual

        [
            {
                "block": "block"
            },
            {
                "block": "block",
                "mod": "mod",
                "val": true
            },
            {
                "block": "block",
                "mod": "mod",
                "val": "val"
            }
        ]
        */
        it.skip('must respect context for mods', () => {
            const scheme = {
                blocks: {
                    block: {
                        'block.deps.js': stringifyDepsJs({
                            shouldDeps: [
                                { mods: { mod: 'val' } }
                            ]
                        })
                    }
                }
            };

            const bemdecl = [{ name: 'block' }];

            const deps = [
                { block: 'block' },
                { block: 'block', mod: 'mod' },
                { block: 'block', mod: 'mod', val: 'val' }
            ];

            return assert(scheme, bemdecl, deps);
        });

        /*
        actual

        [
            {
                "block": "block"
            },
            {
                "block": "block",
                "elem": "elem"
            },
            {
                "block": "block",
                "elem": "elem",
                "mod": "mod",
                "val": true
            },
            {
                "block": "block",
                "elem": "elem",
                "mod": "mod",
                "val": "val"
            }
        ]
        */
        it.skip('must respect context for elem mods', () => {
            const scheme = {
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
            };

            const bemdecl = [{ name: 'block', elems: [{ name: 'elem' }] }];

            const deps = [
                { block: 'block' },
                { block: 'block', elem: 'elem' },
                { block: 'block', elem: 'elem', mod: 'mod' },
                { block: 'block', elem: 'elem', mod: 'mod', val: 'val' }
            ];

            return assert(scheme, bemdecl, deps);
        });

        /*
        actual

        [
            {
                "block": "block"
            },
            {
                "block": "block",
                "elem": "elem"
            },
            {
                "block": "block",
                "elem": "elem",
                "mod": "mod",
                "val": true
            }
        ]
        */
        it.skip('must respect context for elem mod', () => {
            const scheme = {
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
            };

            const bemdecl = [{ name: 'block', elems: [{ name: 'elem' }] }];

            const deps = [
                { block: 'block' },
                { block: 'block', elem: 'elem' },
                { block: 'block', elem: 'elem', mod: 'mod' }
            ];

            return assert(scheme, bemdecl, deps);
        });

        // https://github.com/bem-sdk/bem-deps/issues/80
        it.skip('must support boolean mods as array', () => {
            const scheme = {
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
            };

            const bemdecl = [{ name: 'block' }];

            const deps = [
                { block: 'block' },
                { block: 'block', mod: 'mod-1' },
                { block: 'block', mod: 'mod-2' },
                { block: 'block', elem: 'elem' },
                { block: 'block', elem: 'elem', mod: 'mod-1' },
                { block: 'block', elem: 'elem', mod: 'mod-2' },
                { block: 'block', mod: 'mod-1', val: true },
                { block: 'block', mod: 'mod-2', val: true },
                { block: 'block', elem: 'elem', mod: 'mod-1', val: true },
                { block: 'block', elem: 'elem', mod: 'mod-2', val: true }
            ];

            return assert(scheme, bemdecl, deps);
        });

        it('must add loop shouldDeps', () => {
            const scheme = {
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
            };

            const bemdecl = [{ name: 'A' }];

            const deps = [
                { block: 'A' },
                { block: 'B' }
            ];

            return assert(scheme, bemdecl, deps);
        });

        it('must add must dep of block', () => {
            const scheme = {
                blocks: {
                    block: {
                        'block.deps.js': stringifyDepsJs({ mustDeps: [{ block: 'other-block' }] })
                    }
                }
            };

            const bemdecl = [{ name: 'block' }];

            const deps = [
                { block: 'other-block' },
                { block: 'block' }
            ];

            return assert(scheme, bemdecl, deps);
        });

        // https://github.com/bem-sdk/bem-deps/issues/54
        it.skip('must add must dep of self elem', () => {
            const scheme = {
                blocks: {
                    block: {
                        'block.deps.js': stringifyDepsJs({ mustDeps: [{ elems: ['elem'] }] })
                    }
                }
            };

            const bemdecl = [{ name: 'block' }];

            const deps = [
                { block: 'block', elem: 'elem' },
                { block: 'block' }
            ];

            return assert(scheme, bemdecl, deps);
        });

        /*
        actual

        [
            {
                "block": "other-block"
            },
            {
                "block": "other-block",
                "mod": "mod",
                "val": true
            },
            {
                "block": "block"
            }
        ]
        */
        it.skip('must add must dep of block boolean mod', () => {
            const scheme = {
                blocks: {
                    block: {
                        'block.deps.js': stringifyDepsJs({
                            mustDeps: [{ block: 'other-block', mods: { mod: true } }]
                        })
                    }
                }
            };

            const bemdecl = [{ name: 'block' }];

            const deps = [
                { block: 'other-block' },
                { block: 'other-block', mod: 'mod' },
                { block: 'other-block', mod: 'mod', val: true },
                { block: 'block' }
            ];

            return assert(scheme, bemdecl, deps);
        });

        // https://github.com/bem-sdk/bem-deps/issues/54
        it.skip('must add must dep of self mod', () => {
            const scheme = {
                blocks: {
                    block: {
                        'block.deps.js': stringifyDepsJs({
                            mustDeps: [{ mods: { 'mod-name': 'mod-val' } }]
                        })
                    }
                }
            };

            const bemdecl = [{ name: 'block' }];

            const deps = [
                { block: 'block', mod: 'mod-name' },
                { block: 'block', mod: 'mod-name', val: 'mod-val' },
                { block: 'block' }
            ];

            return assert(scheme, bemdecl, deps);
        });

        /*
        actual

        [
            {
                "block": "other-block"
            },
            {
                "block": "other-block",
                "mod": "mod-name",
                "val": true
            },
            {
                "block": "other-block",
                "mod": "mod-name",
                "val": "mod-val"
            },
            {
                "block": "block"
            }
        ]
        */
        it.skip('must add must dep of block mod', () => {
            const scheme = {
                blocks: {
                    block: {
                        'block.deps.js': stringifyDepsJs({
                            mustDeps: [{ block: 'other-block', mods: { 'mod-name': 'mod-val' } }]
                        })
                    }
                }
            };

            const bemdecl = [{ name: 'block' }];

            const deps = [
                { block: 'other-block' },
                { block: 'other-block', mod: 'mod-name' },
                { block: 'other-block', mod: 'mod-name', val: 'mod-val' },
                { block: 'block' }
            ];

            return assert(scheme, bemdecl, deps);
        });

        it('must add must dep of elem', () => {
            const scheme = {
                blocks: {
                    block: {
                        'block.deps.js': stringifyDepsJs({
                            mustDeps: [{ block: 'other-block', elem: 'elem' }]
                        })
                    }
                }
            };

            const bemdecl = [{ name: 'block' }];

            const deps = [
                { block: 'other-block', elem: 'elem' },
                { block: 'block' }
            ];

            return assert(scheme, bemdecl, deps);
        });

        it('must add must dep of elems', () => {
            const scheme = {
                          blocks: {
                              block: {
                                  'block.deps.js': stringifyDepsJs({
                                      mustDeps: [{ block: 'other-block', elems: ['elem-1', 'elem-2'] }]
                                  })
                              }
                          }
                      };

            const bemdecl = [{ name: 'block' }];

            const deps = [
                { block: 'other-block' },
                { block: 'other-block', elem: 'elem-1' },
                { block: 'other-block', elem: 'elem-2' },
                { block: 'block' }
            ];

            return assert(scheme, bemdecl, deps);
        });

        /*
         actual

        [
            {
                "block": "other-block",
                "elem": "elem"
            },
            {
                "block": "other-block",
                "elem": "elem",
                "mod": "mod",
                "val": true
            },
            {
                "block": "block"
            }
        ]
        */
        it.skip('must add must dep of elem bool mod', () => {
            const scheme = {
                blocks: {
                    block: {
                        'block.deps.js': stringifyDepsJs({
                            mustDeps: [{ block: 'other-block', elem: 'elem', mods: { mod: true } }]
                        })
                    }
                }
            };

            const bemdecl = [{ name: 'block' }];

            const deps = [
                { block: 'other-block', elem: 'elem' },
                { block: 'other-block', elem: 'elem', mod: 'mod' },
                { block: 'other-block', elem: 'elem', mod: 'mod', val: true },
                { block: 'block' }
            ];

            return assert(scheme, bemdecl, deps);
        });

        /*
         actual

         [
             {
                 "block": "other-block",
                 "elem": "elem"
             },
             {
                 "block": "other-block",
                 "elem": "elem",
                 "mod": "mod-name",
                 "val": true
             },
             {
                 "block": "other-block",
                 "elem": "elem",
                 "mod": "mod-name",
                 "val": "mod-val"
             },
             {
                "block": "block"
             }
         ]
        */
        it.skip('must add must dep of elem mod', () => {
            const scheme = {
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
            };

            const bemdecl = [{ name: 'block' }];

            const deps = [
                { block: 'other-block', elem: 'elem' },
                { block: 'other-block', elem: 'elem', mod: 'mod-name' },
                { block: 'other-block', elem: 'elem', mod: 'mod-name', val: 'mod-val' },
                { block: 'block' }
            ];

            return assert(scheme, bemdecl, deps);
        });

        // https://github.com/bem-sdk/bem-deps/issues/54
        it.skip('must add must dep of self mod to elem', () => {
            const scheme = {
                blocks: {
                    block: {
                        __elem: {
                            'block__elem.deps.js': stringifyDepsJs({
                                mustDeps: [{
                                    mods: { 'mod-name': 'mod-val' }
                                }]
                            })
                        }
                    }
                }
            };

            const bemdecl = [{ name: 'block', elems: [{ name: 'elem' }] }];

            const deps = [
                { block: 'block' },
                { block: 'block', elem: 'elem', mod: 'mod-name' },
                { block: 'block', elem: 'elem', mod: 'mod-name', val: 'mod-val' },
                { block: 'block', elem: 'elem' }
            ];

            return assert(scheme, bemdecl, deps);
        });

        it('must throw if loop mustDeps', () => {
            const scheme = {
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
            };

            const bemdecl = [{ name: 'A' }];

            return getResults(scheme, bemdecl)
                .fail(err => {
                    err.must.throw();
                });
        });

        it('must remove dep of block', () => {
            const scheme = {
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
            };

            const bemdecl = [{ name: 'block' }];
            const deps = [{ block: 'block' }];

            return assert(scheme, bemdecl, deps);
        });

        it('must remove dep of block boolean mod', () => {
            const scheme = {
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
            };

            const bemdecl = [{ name: 'block' }];
            const deps = [{ block: 'block' }];

            return assert(scheme, bemdecl, deps);
        });

        it('must remove dep of block mod', () => {
            const scheme = {
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
            };

            const bemdecl = [{ name: 'block' }];
            const deps = [{ block: 'block' }];

            return assert(scheme, bemdecl, deps);
        });

        it('must remove dep of elem', () => {
            const scheme = {
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
            };

            const bemdecl = [{ name: 'block' }];
            const deps = [{ block: 'block' }];

            return assert(scheme, bemdecl, deps);
        });

        it('must remove dep of elems', () => {
            const scheme = {
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
            };

            const bemdecl = [{ name: 'block' }];
            const deps = [{ block: 'block' }];

            return assert(scheme, bemdecl, deps);
        });

        it('must remove dep of elem bool mod', () => {
            const scheme = {
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
            };

            const bemdecl = [{ name: 'block' }];
            const deps = [{ block: 'block' }];

            return assert(scheme, bemdecl, deps);
        });

        it('must remove dep of elem mod', () => {
            const scheme = {
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
            };

            const bemdecl = [{ name: 'block' }];

            const deps = [
                { block: 'block' }
            ];

            return assert(scheme, bemdecl, deps);
        });

        it('must break shouldDeps loop', () => {
            const scheme = {
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
            };

            const bemdecl = [{ name: 'A' }];

            const deps = [
                { block: 'A' }
            ];

            return assert(scheme, bemdecl, deps);
        });

        it('must skip empty dependency files', () => {
            const scheme = {
                blocks: {
                    block: {
                        'block.deps.js': ''
                    }
                }
            };

            const bemdecl = [{ name: 'block' }];

            const deps = [
                { block: 'block' }
            ];

            return assert(scheme, bemdecl, deps);
        });

        it('must skip dependency files with commented code', () => {
            const scheme = {
                blocks: {
                    block: {
                        'block.deps.js': `/*${stringifyDepsJs({ shouldDeps: [{ block: 'other-block' }] })}*/`
                    }
                }
            };

            const bemdecl = [{ name: 'block' }];

            const deps = [
                { block: 'block' }
            ];

            return assert(scheme, bemdecl, deps);
        });
    });

    // don't support yaml format
    describe.skip('deps.yaml format', () => {
        it('must add should dep of block', () => {
            const scheme = {
                blocks: {
                    block: {
                        'block.deps.yaml': '- block: other-block'
                    }
                }
            };

            const bemdecl = [{ name: 'block' }];

            const deps = [
                { block: 'block' },
                { block: 'other-block' }
            ];

            return assert(scheme, bemdecl, deps);
        });

        it('must add should dep of block boolean mod', () => {
            const scheme = {
                blocks: {
                    block: {
                        'block.deps.yaml': '- block: other-block\n  mods: { mod: true }'
                    }
                }
            };

            const bemdecl = [{ name: 'block' }];

            const deps = [
                { block: 'block' },
                { block: 'other-block' },
                { block: 'other-block', mod: 'mod' },
                { block: 'other-block', mod: 'mod', val: true }
            ];

            return assert(scheme, bemdecl, deps);
        });

        it('must add should dep of block mod', () => {
            const scheme = {
                blocks: {
                    block: {
                        'block.deps.yaml': '- block: other-block\n  mods: { mod-name: mod-val }'
                    }
                }
            };

            const bemdecl = [{ name: 'block' }];

            const deps = [
                { block: 'block' },
                { block: 'other-block' },
                { block: 'other-block', mod: 'mod-name' },
                { block: 'other-block', mod: 'mod-name', val: 'mod-val' }
            ];

            return assert(scheme, bemdecl, deps);
        });

        it('must add should dep of elem', () => {
            const scheme = {
                blocks: {
                    block: {
                        'block.deps.yaml': '- block: other-block\n  elem: elem'
                    }
                }
            };

            const bemdecl = [{ name: 'block' }];

            const deps = [
                { block: 'block' },
                { block: 'other-block', elem: 'elem' }
            ];

            return assert(scheme, bemdecl, deps);
        });

        it('must add should dep of elems', () => {
            const scheme = {
                blocks: {
                    block: {
                        'block.deps.yaml': '- block: other-block\n  elems: [elem-1, elem-2]'
                    }
                }
            };

            const bemdecl = [{ name: 'block' }];

            const deps = [
                { block: 'block' },
                { block: 'other-block' },
                { block: 'other-block', elem: 'elem-1' },
                { block: 'other-block', elem: 'elem-2' }
            ];

            return assert(scheme, bemdecl, deps);
        });

        it('must add should dep of elem bool mod', () => {
            const scheme = {
                blocks: {
                    block: {
                        'block.deps.yaml': '- block: other-block\n  elem: elem\n  mods: { mod: true }'
                    }
                }
            };

            const bemdecl = [{ name: 'block' }];

            const deps = [
                { block: 'block' },
                { block: 'other-block', elem: 'elem' },
                { block: 'other-block', elem: 'elem', mod: 'mod' },
                { block: 'other-block', elem: 'elem', mod: 'mod', val: true }
            ];

            return assert(scheme, bemdecl, deps);
        });

        it('must add should dep of elem mod', () => {
            const scheme = {
                blocks: {
                    block: {
                        'block.deps.yaml': '- block: other-block\n  elem: elem\n  mods: { mod-name: mod-val }'
                    }
                }
            };

            const bemdecl = [{ name: 'block' }];

            const deps = [
                { block: 'block' },
                { block: 'other-block', elem: 'elem' },
                { block: 'other-block', elem: 'elem', mod: 'mod-name' },
                { block: 'other-block', elem: 'elem', mod: 'mod-name', val: 'mod-val' }
            ];

            return assert(scheme, bemdecl, deps);
        });

        it('must add loop shouldDeps', () => {
            const scheme = {
                blocks: {
                    A: {
                        'A.deps.yaml': '- block: B'
                    },
                    B: {
                        'B.deps.yaml': '- block: A'
                    }
                }
            };

            const bemdecl = [{ name: 'A' }];

            const deps = [
                { block: 'A' },
                { block: 'B' }
            ];

            return assert(scheme, bemdecl, deps);
        });

        it('must add must dep of block', () => {
            const scheme = {
                blocks: {
                    block: {
                        'block.deps.yaml': '- block: other-block\n  required: true'
                    }
                }
            };

            const bemdecl = [{ name: 'block' }];

            const deps = [
                { block: 'other-block' },
                { block: 'block' }
            ];

            return assert(scheme, bemdecl, deps);
        });

        it('must add must dep of block boolean mod', () => {
            const scheme = {
                blocks: {
                    block: {
                        'block.deps.yaml': '- block: other-block\n  required: true\n  mods: { mod: true }'
                    }
                }
            };

            const bemdecl = [{ name: 'block' }];

            const deps = [
                { block: 'other-block' },
                { block: 'other-block', mod: 'mod' },
                { block: 'other-block', mod: 'mod', val: true },
                { block: 'block' }
            ];

            return assert(scheme, bemdecl, deps);
        });

        it('must add must dep of block mod', () => {
            const scheme = {
                blocks: {
                    block: {
                        'block.deps.yaml': '- block: other-block\n  required: true\n' +
                        '  mods: { mod-name: mod-val }'
                    }
                }
            };

            const bemdecl = [{ name: 'block' }];

            const deps = [
                { block: 'other-block' },
                { block: 'other-block', mod: 'mod-name' },
                { block: 'other-block', mod: 'mod-name', val: 'mod-val' },
                { block: 'block' }
            ];

            return assert(scheme, bemdecl, deps);
        });

        it('must add must dep of elem', () => {
            const scheme = {
                blocks: {
                    block: {
                        'block.deps.yaml': '- block: other-block\n  required: true\n  elem: elem'
                    }
                }
            };

            const bemdecl = [{ name: 'block' }];

            const deps = [
                { block: 'other-block', elem: 'elem' },
                { block: 'block' }
            ];

            return assert(scheme, bemdecl, deps);
        });

        it('must add must dep of elems', () => {
            const scheme = {
                blocks: {
                    block: {
                        'block.deps.yaml': '- block: other-block\n  required: true\n  elems: [elem-1, elem-2]'
                    }
                }
            };

            const bemdecl = [{ name: 'block' }];

            const deps = [
                { block: 'other-block' },
                { block: 'other-block', elem: 'elem-1' },
                { block: 'other-block', elem: 'elem-2' },
                { block: 'block' }
            ];

            return assert(scheme, bemdecl, deps);
        });

        it('must add must dep of elem bool mod', () => {
            const scheme = {
                blocks: {
                    block: {
                        'block.deps.yaml': '- block: other-block\n  required: true\n' +
                        '  elem: elem\n  mods: { mod: true }'
                    }
                }
            };

            const bemdecl = [{ name: 'block' }];

            const deps = [
                { block: 'other-block', elem: 'elem' },
                { block: 'other-block', elem: 'elem', mod: 'mod' },
                { block: 'other-block', elem: 'elem', mod: 'mod', val: true },
                { block: 'block' }
            ];

            return assert(scheme, bemdecl, deps);
        });

        it('must add must dep of elem mod', () => {
            const scheme = {
                blocks: {
                    block: {
                        'block.deps.yaml': '- block: other-block\n  required: true\n' +
                        '  elem: elem\n  mods: { mod-name: mod-val }'
                    }
                }
            };

            const bemdecl = [{ name: 'block' }];

            const deps = [
                { block: 'other-block', elem: 'elem' },
                { block: 'other-block', elem: 'elem', mod: 'mod-name' },
                { block: 'other-block', elem: 'elem', mod: 'mod-name', val: 'mod-val' },
                { block: 'block' }
            ];

            return assert(scheme, bemdecl, deps);
        });

        it('must add loop mustDeps', () => {
            const scheme = {
                blocks: {
                    A: {
                        'A.deps.yaml': '- block: B\n  required: true'
                    },
                    B: {
                        'B.deps.yaml': '- block: A\n  required: true'
                    }
                }
            };

            const bemdecl = [{ name: 'A' }];

            return assertError(scheme, bemdecl);
        });

        it('must detect complex mustDeps loop', () => {
            const scheme = {
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
            };

            const bemdecl = [{ name: 'A' }];

            return assertError(scheme, bemdecl, { strict: true });
        });

        it('must resolve shouldDeps after mustDeps', () => {
            const scheme = {
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
            };

            const bemdecl = [{ name: 'A' }];

            const deps = [
                { block: 'B' },
                { block: 'A' },
                { block: 'C' }
            ];

            return assert(scheme, bemdecl, deps);
        });

        describe('short aliases for shouldDeps', () => {
            it('should support notation with blocks as array of strings', () => {
                const scheme = {
                    blocks: {
                        block: {
                            'block.deps.js': stringifyDepsJs({ shouldDeps: (['other-block']) })
                        }
                    }
                };

                const bemdecl = [{ name: 'block' }];

                const deps = [
                    { block: 'block' },
                    { block: 'other-block' }
                ];

                return assert(scheme, bemdecl, deps);
            });

            it('should support notation with a block as a string', () => {
                const scheme = {
                    blocks: {
                        block: {
                            'block.deps.js': stringifyDepsJs({ shouldDeps: 'other-block' })
                        }
                    }
                };

                const bemdecl = [{ name: 'block' }];

                const deps = [
                    { block: 'block' },
                    { block: 'other-block' }
                ];

                return assert(scheme, bemdecl, deps);
            });
        });
    });
});

function getResults(fsScheme, bemdecl) {
    const levelPaths = Object.keys(fsScheme);
    let fsBundle;
    let dataBundle;

    fsScheme['fs-bundle'] = {
        'fs-bundle.bemdecl.js': `exports.blocks = ${JSON.stringify(bemdecl)};`
    };
    fsScheme['data-bundle'] = {};

    mockFs(fsScheme);

    fsBundle = new TestNode('fs-bundle');
    dataBundle = new TestNode('data-bundle');

    dataBundle.provideTechData('?.bemdecl.js', { blocks: bemdecl });

    return fsBundle.runTech(levelsTech, { levels: levelPaths })
        .then(levels => {
            fsBundle.provideTechData('?.levels', levels);
            dataBundle.provideTechData('?.levels', levels);

            return vow.all([
                fsBundle.runTechAndRequire(depsTech),
                fsBundle.runTechAndGetResults(depsTech),
                dataBundle.runTechAndRequire(depsTech),
                dataBundle.runTechAndGetResults(depsTech)
            ]);
        })
        .spread((res1, res2, res3, res4) => [
        res1[0].deps, res2['fs-bundle.deps.js'].deps,
        res3[0].deps, res4['data-bundle.deps.js'].deps
    ]);
}

function assert(fsScheme, bemdecl, deps) {
    return getResults(fsScheme, bemdecl, deps)
        .then(results => {
            results.forEach(actualDeps => {
                actualDeps.must.eql(deps);
            });
        }, err => {
            throw err;
        });
}

function assertError(fsScheme, bemdecl, techOpts) {
    return getResults(fsScheme, bemdecl, techOpts)
        .then(() => {
            // test should always throw error
            (true).must.not.be.truthy();
        }, err => {
            err.must.be.an.instanceof(Error);
            // error message should only address loops in mustDeps
            err.message.must.contain('Unresolved deps:');
        });
}

function stringifyDepsJs(bemjson) {
    return `(${JSON.stringify(bemjson)})`;
}
