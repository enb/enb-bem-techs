'use strict';

const path = require('path');
const vow = require('vow');
const mockFs = require('mock-fs');
const FileList = require('enb/lib/file-list');
const TestNode = require('mock-enb/lib/mock-node');
const techs = require('../..');
const levelsTech = techs.levels;
const filesTech = techs.files;
const depsTech = techs.deps;
const depsByTechToBemdecl = techs.depsByTechToBemdecl;

describe('techs: deps-by-tech-to-bemdecl', () => {
    afterEach(() => {
        mockFs.restore();
    });

    it('must provide result from cache', () => {
        mockFs({
            blocks: {
                block: {
                    'block.deps.js': stringifyDepsJs({
                        tech: 'sourceTech',
                        shouldDeps: {
                            block: 'other-block'
                        }
                    })
                }
            },
            bundle: {
                'bundle.bemdecl.js': `exports.blocks = ${JSON.stringify([{ name: 'block' }])};`
            }
        });

        const bundle = new TestNode('bundle');
        const depsFiles = new FileList();
        const cache = bundle.getNodeCache('bundle.bemdecl.js');

        const options = {
            sourceTech: 'sourceTech'
        };

        depsFiles.addFiles([FileList.getFileInfo(path.join('blocks', 'block', 'block.deps.js'))]);

        cache.cacheFileInfo('bemdecl-file', path.resolve('bundle/bundle.bemdecl.js'));
        cache.cacheFileList('deps-files', depsFiles.getBySuffix('deps.js'));

        bundle.provideTechData('?.files', new FileList());

        return bundle.runTech(depsByTechToBemdecl, options)
            .then(target => {
                target.blocks.must.eql([]);
            });
    });

    it('must support deps format for BEMDECL', () => {
        const scheme = {
            blocks: {
                block: {
                    'block.deps.js': stringifyDepsJs({
                        tech: 'sourceTech',
                        shouldDeps: [{ block: 'other-block' }]
                    })
                }
            }
        };
        const bemdecl = [{ name: 'block' }];
        const exepted = [{ block: 'block', tech: 'sourceTech' }, { block: 'other-block', tech: 'sourceTech' }];

        return assert(scheme, bemdecl, exepted, {
            sourceTech: 'sourceTech',
            bemdeclFormat: 'deps'
        });
    });

    describe('deps.js format', () => {
        it('must respect context for block', () => {
            const scheme = {
                blocks: {
                    block: {
                        'block.deps.js': stringifyDepsJs({
                            tech: 'sourceTech',
                            shouldDeps: {
                                tech: 'destTech'
                            }
                        })
                    }
                }
            };
            const bemdecl = [{ name: 'block' }];
            const exepted = [{ name: 'block' }];

            return assert(scheme, bemdecl, exepted, { sourceTech: 'sourceTech', destTech: 'destTech' });
        });

        it('must respect context for mod', () => {
            const scheme = {
                blocks: {
                    block: {
                        _mod: {
                            'block_mod_val.deps.js': stringifyDepsJs({
                                tech: 'sourceTech',
                                shouldDeps: {
                                    tech: 'destTech'
                                }
                            })
                        }
                    }
                }
            };
            const bemdecl = [{ name: 'block', mods: [{ name: 'mod', vals: [{ name: 'val' }] }] }];
            const exepted = [{ name: 'block', mods: [{ name: 'mod', vals: [{ name: 'val' }] }] }];

            return assert(scheme, bemdecl, exepted, { sourceTech: 'sourceTech', destTech: 'destTech' });
        });

        it('must respect context for boolean mod', () => {
            const scheme = {
                blocks: {
                    block: {
                        _mod: {
                            'block_mod.deps.js': stringifyDepsJs({
                                tech: 'sourceTech',
                                shouldDeps: {
                                    tech: 'destTech'
                                }
                            })
                        }
                    }
                }
            };
            const bemdecl = [{ name: 'block', mods: [{ name: 'mod', vals: [{ name: true }] }] }];
            const exepted = [{ name: 'block', mods: [{ name: 'mod', vals: [] }] }];

            return assert(scheme, bemdecl, exepted, { sourceTech: 'sourceTech', destTech: 'destTech' });
        });

        it('must respect context for elem', () => {
            const scheme = {
                blocks: {
                    block: {
                        __elem: {
                            'block__elem.deps.js': stringifyDepsJs({
                                tech: 'sourceTech',
                                shouldDeps: {
                                    tech: 'destTech'
                                }
                            })
                        }
                    }
                }
            };
            const bemdecl = [{ name: 'block', elems: [{ name: 'elem' }] }];
            const exepted = [{ name: 'block', elems: [{ name: 'elem' }] }];

            return assert(scheme, bemdecl, exepted, { sourceTech: 'sourceTech', destTech: 'destTech' });
        });

        it('must respect context for elem mod', () => {
            const scheme = {
                blocks: {
                    block: {
                        __elem: {
                            _mod: {
                                'block__elem_mod_val.deps.js': stringifyDepsJs({
                                    tech: 'sourceTech',
                                    shouldDeps: {
                                        tech: 'destTech'
                                    }
                                })
                            }
                        }
                    }
                }
            };
            const bemdecl = [{ name: 'block', elems: [
                { name: 'elem', mods: [{ name: 'mod', vals: [{ name: 'val' }] }] }
            ] }];
            const exepted = [{ name: 'block', elems: [
                { name: 'elem', mods: [{ name: 'mod', vals: [{ name: 'val' }] }] }
            ] }];

            return assert(scheme, bemdecl, exepted, { sourceTech: 'sourceTech', destTech: 'destTech' });
        });

        it('must respect context for boolean mod of elem', () => {
            const scheme = {
                blocks: {
                    block: {
                        __elem: {
                            _mod: {
                                'block__elem_mod.deps.js': stringifyDepsJs({
                                    tech: 'sourceTech',
                                    shouldDeps: {
                                        tech: 'destTech'
                                    }
                                })
                            }
                        }
                    }
                }
            };
            const bemdecl = [{ name: 'block', elems: [
                { name: 'elem', mods: [{ name: 'mod', vals: [{ name: true }] }] }
            ] }];
            const exepted = [{ name: 'block', elems: [
                { name: 'elem', mods: [{ name: 'mod', vals: [] }] }
            ] }];

            return assert(scheme, bemdecl, exepted, { sourceTech: 'sourceTech', destTech: 'destTech' });
        });

        it('must not respect context 1', () => {
            const scheme = {
                blocks: {
                    block: {
                        __elem: {
                            'block__elem.deps.js': stringifyDepsJs({
                                tech: 'sourceTech',
                                shouldDeps: {
                                    tech: 'destTech',
                                    block: 'other-block'
                                }
                            })
                        }
                    }
                }
            };
            const bemdecl = [{ name: 'block', elems: [{ name: 'elem' }] }];
            const exepted = [{ name: 'other-block' }];

            return assert(scheme, bemdecl, exepted, { sourceTech: 'sourceTech', destTech: 'destTech' });
        });

        it('must not respect mod context for other block', () => {
            const scheme = {
                blocks: {
                    block: {
                        _mod: {
                            'block_mod_val.deps.js': stringifyDepsJs({
                                tech: 'sourceTech',
                                shouldDeps: {
                                    block: 'other-block',
                                    tech: 'destTech'
                                }
                            })
                        }
                    }
                }
            };
            const bemdecl = [{ name: 'block', mods: [{ name: 'mod', vals: [{ name: 'val' }] }] }];
            const exepted = [{ name: 'other-block' }];

            return assert(scheme, bemdecl, exepted, { sourceTech: 'sourceTech', destTech: 'destTech' });
        });

        it('must not respect mod val context for other mod', () => {
            const scheme = {
                blocks: {
                    block: {
                        _mod: {
                            'block_mod_val.deps.js': stringifyDepsJs({
                                tech: 'sourceTech',
                                shouldDeps: {
                                    mod: 'other-mod',
                                    tech: 'destTech'
                                }
                            })
                        }
                    }
                }
            };
            const bemdecl = [{ name: 'block', mods: [{ name: 'mod', vals: [{ name: 'val' }] }] }];
            const exepted = [{ name: 'block', mods: [{ name: 'other-mod', vals: [] }] }];

            return assert(scheme, bemdecl, exepted, { sourceTech: 'sourceTech', destTech: 'destTech' });
        });

        it('must not respect elem context for other elem', () => {
            const scheme = {
                blocks: {
                    block: {
                        __elem: {
                            _mod: {
                                'block__elem_mod_val.deps.js': stringifyDepsJs({
                                    tech: 'sourceTech',
                                    shouldDeps: {
                                        elem: 'other-elem',
                                        tech: 'destTech'
                                    }
                                })
                            }
                        }
                    }
                }
            };

            const bemdecl = [{ name: 'block', elems: [
                { name: 'elem', mods: [{ name: 'mod', vals: [{ name: 'val' }] }] }
            ] }];
            const exepted = [{ name: 'block', elems: [{ name: 'other-elem' }] }];

            return assert(scheme, bemdecl, exepted, { sourceTech: 'sourceTech', destTech: 'destTech' });
        });

        it('must add should dep of block', () => {
            const scheme = {
                blocks: {
                    block: {
                        'block.deps.js': stringifyDepsJs({
                            tech: 'sourceTech',
                            shouldDeps: [{ block: 'other-block' }]
                        })
                    }
                }
            };
            const bemdecl = [{ name: 'block' }];
            const exepted = [{ name: 'block' }, { name: 'other-block' }];

            return assert(scheme, bemdecl, exepted);
        });

        it('must add should dep of block boolean mod', () => {
            const scheme = {
                blocks: {
                    block: {
                        'block.deps.js': stringifyDepsJs({
                            tech: 'sourceTech',
                            shouldDeps: [{ block: 'other-block', mods: { mod: true } }]
                        })
                    }
                }
            };
            const bemdecl = [{ name: 'block' }];
            const exepted = [{ name: 'block' }, { name: 'other-block', mods: [{ name: 'mod', vals: [] }] }];

            return assert(scheme, bemdecl, exepted);
        });

        it('must add should dep of block mod', () => {
            const scheme = {
                blocks: {
                    block: {
                        'block.deps.js': stringifyDepsJs({
                            tech: 'sourceTech',
                            shouldDeps: [{
                                block: 'other-block',
                                mods: { 'mod-name': 'mod-val' }
                            }]
                        })
                    }
                }
            };
            const bemdecl = [{ name: 'block' }];

            const exepted = [
                { name: 'block' },
                { name: 'other-block', mods: [{ name: 'mod-name', vals: [{ name: 'mod-val' }] }] }
            ];

            return assert(scheme, bemdecl, exepted);
        });

        it('must add should dep of elem', () => {
            const scheme = {
                blocks: {
                    block: {
                        'block.deps.js': stringifyDepsJs({
                            tech: 'sourceTech',
                            shouldDeps: [{ block: 'other-block', elem: 'elem' }]
                        })
                    }
                }
            };

            const bemdecl = [{ name: 'block' }];
            const exepted = [{ name: 'block' }, { name: 'other-block', elems: [{ name: 'elem' }] }];

            return assert(scheme, bemdecl, exepted);
        });

        it('must add should dep of elems', () => {
            const scheme = {
                blocks: {
                    block: {
                        'block.deps.js': stringifyDepsJs({
                            tech: 'sourceTech',
                            shouldDeps: [
                                { block: 'other-block', elems: ['elem-1', 'elem-2'] }
                            ]
                        })
                    }
                }
            };
            const bemdecl = [{ name: 'block' }];

            const exepted = [
                { name: 'block' },
                { name: 'other-block', elems: [{ name: 'elem-1' }, { name: 'elem-2' }] },
            ];

            return assert(scheme, bemdecl, exepted);
        });

        it('must add should dep of elem bool mod', () => {
            const scheme = {
                blocks: {
                    block: {
                        'block.deps.js': stringifyDepsJs({
                            tech: 'sourceTech',
                            shouldDeps: [{
                                block: 'other-block',
                                elem: 'elem', mods: { mod: true }
                            }]
                        })
                    }
                }
            };
            const bemdecl = [{ name: 'block' }];

            const exepted = [
                { name: 'block' },
                {
                    name: 'other-block',
                    elems: [{ name: 'elem', mods: [{ name: 'mod', vals: [] }] }]
                }
            ];

            return assert(scheme, bemdecl, exepted);
        });

        it('must add should dep of elem mod', () => {
            const scheme = {
                blocks: {
                    block: {
                        'block.deps.js': stringifyDepsJs({
                            tech: 'sourceTech',
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

            const exepted = [
                { name: 'block' },
                {
                    name: 'other-block',
                    elems: [{ name: 'elem', mods: [{ name: 'mod-name', vals: [{ name: 'mod-val' }] }] }]
                }
            ];

            return assert(scheme, bemdecl, exepted);
        });

        it('must add loop shouldDeps', () => {
            const scheme = {
                blocks: {
                    A: {
                        'A.deps.js': stringifyDepsJs({
                            tech: 'sourceTech',
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

            const exepted = [
                { name: 'A' },
                { name: 'B' }
            ];

            return assert(scheme, bemdecl, exepted);
        });

        it('must add must dep of block', () => {
            const scheme = {
                blocks: {
                    block: {
                        'block.deps.js': stringifyDepsJs({
                            tech: 'sourceTech',
                            mustDeps: [{ block: 'other-block' }]
                        })
                    }
                }
            };
            const bemdecl = [{ name: 'block' }];
            const exepted = [{ name: 'other-block' }, { name: 'block' }];

            return assert(scheme, bemdecl, exepted);
        });

        it('must add must dep of block boolean mod', () => {
            const scheme = {
                blocks: {
                    block: {
                        'block.deps.js': stringifyDepsJs({
                            tech: 'sourceTech',
                            mustDeps: [{ block: 'other-block', mods: { mod: true } }]
                        })
                    }
                }
            };
            const bemdecl = [{ name: 'block' }];
            const exepted = [{ name: 'other-block', mods: [{ name: 'mod', vals: [] }] }, { name: 'block' }];

            return assert(scheme, bemdecl, exepted);
        });

        it('must add must dep of block boolean mod with short record', () => {
            const scheme = {
                blocks: {
                    block: {
                        'block.deps.js': stringifyDepsJs({
                            tech: 'sourceTech',
                            mustDeps: [{ block: 'other-block', mod: 'mod' }]
                        })
                    }
                }
            };
            const bemdecl = [{ name: 'block' }];
            const exepted = [{ name: 'other-block', mods: [{ name: 'mod', vals: [] }] }, { name: 'block' }];

            return assert(scheme, bemdecl, exepted);
        });

        it('must add must dep of block mod', () => {
            const scheme = {
                blocks: {
                    block: {
                        'block.deps.js': stringifyDepsJs({
                            tech: 'sourceTech',
                            mustDeps: [
                                { block: 'other-block', mods: { 'mod-name': 'mod-val' } }
                            ]
                        })
                    }
                }
            };
            const bemdecl = [{ name: 'block' }];

            const exepted = [
                { name: 'other-block', mods: [{ name: 'mod-name', vals: [{ name: 'mod-val' }] }] },
                { name: 'block' }
            ];

            return assert(scheme, bemdecl, exepted);
        });

        it('must add must dep of elem', () => {
            const scheme = {
                blocks: {
                    block: {
                        'block.deps.js': stringifyDepsJs({
                            tech: 'sourceTech',
                            mustDeps: [{ block: 'other-block', elem: 'elem' }]
                        })
                    }
                }
            };

            const bemdecl = [{ name: 'block' }];
            const exepted = [{ name: 'other-block', elems: [{ name: 'elem' }] }, { name: 'block' }];

            return assert(scheme, bemdecl, exepted);
        });

        it('must add must dep of elems', () => {
            const scheme = {
                blocks: {
                    block: {
                        'block.deps.js': stringifyDepsJs({
                            tech: 'sourceTech',
                            mustDeps: [{ block: 'other-block', elems: ['elem-1', 'elem-2'] }]
                        })
                    }
                }
            };
            const bemdecl = [{ name: 'block' }];

            const exepted = [
                { name: 'other-block', elems: [{ name: 'elem-1' }, { name: 'elem-2' }] },
                { name: 'block' }
            ];

            return assert(scheme, bemdecl, exepted);
        });

        it('must add must dep of elem bool mod', () => {
            const scheme = {
                blocks: {
                    block: {
                        'block.deps.js': stringifyDepsJs({
                            tech: 'sourceTech',
                            mustDeps: [
                                { block: 'other-block', elem: 'elem', mods: { mod: true } }
                            ]
                        })
                    }
                }
            };
            const bemdecl = [{ name: 'block' }];

            const exepted = [
                {
                    name: 'other-block',
                    elems: [{ name: 'elem', mods: [{ name: 'mod', vals: [] }] }]
                },
                { name: 'block' }
            ];

            return assert(scheme, bemdecl, exepted);
        });

        it('must add must dep of elem bool mod with short record', () => {
            const scheme = {
                blocks: {
                    block: {
                        'block.deps.js': stringifyDepsJs({
                            tech: 'sourceTech',
                            mustDeps: [
                                { block: 'other-block', elem: 'elem', mod: 'mod' }
                            ]
                        })
                    }
                }
            };
            const bemdecl = [{ name: 'block' }];

            const exepted = [
                {
                    name: 'other-block',
                    elems: [{ name: 'elem', mods: [{ name: 'mod', vals: [] }] }]
                },
                { name: 'block' }
            ];

            return assert(scheme, bemdecl, exepted);
        });

        it('must add must dep of elem mod', () => {
            const scheme = {
                blocks: {
                    block: {
                        'block.deps.js': stringifyDepsJs({
                            tech: 'sourceTech',
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

            const exepted = [
                {
                    name: 'other-block',
                    elems: [{ name: 'elem', mods: [{ name: 'mod-name', vals: [{ name: 'mod-val' }] }] }]
                },
                { name: 'block' }
            ];

            return assert(scheme, bemdecl, exepted);
        });

        it('must add loop shouldDeps', () => {
            const scheme = {
                blocks: {
                    A: {
                        'A.deps.js': stringifyDepsJs({
                            tech: 'sourceTech',
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

            const exepted = [
                { name: 'B' },
                { name: 'A' }
            ];

            return assert(scheme, bemdecl, exepted);
        });

        it('must add blocks only with `tech`', () => {
            const scheme = {
                blocks: {
                    block: {
                        'block.deps.js': stringifyDepsJs({
                            tech: 'sourceTech',
                            mustDeps: [
                                { block: 'block-with-destTech', tech: 'destTech' },
                                { block: 'other-block' }
                            ]
                        })
                    }
                }
            };
            const bemdecl = [{ name: 'block' }];

            const exepted = [
                { name: 'block-with-destTech' }
            ];

            return assert(scheme, bemdecl, exepted, {
                sourceTech: 'sourceTech',
                destTech: 'destTech'
            });
        });

        it('must add block with `tech` if `destTech` option not specified', () => {
            const scheme = {
                blocks: {
                    block: {
                        'block.deps.js': stringifyDepsJs({
                            tech: 'sourceTech',
                            mustDeps: [{ block: 'block-with-destTech', tech: 'destTech' }]
                        })
                    }
                }
            };
            const bemdecl = [{ name: 'block' }];

            const exepted = [
                { name: 'block-with-destTech' },
                { name: 'block' }
            ];

            return assert(scheme, bemdecl, exepted);
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
            const exepted = [{ name: 'block' }];

            return assert(scheme, bemdecl, exepted);
        });

        it('must skip dependency files with commented code', () => {
            const scheme = {
                blocks: {
                    block: {
                        'block.deps.js': [
                            '/*',
                            stringifyDepsJs({
                                tech: 'sourceTech',
                                shouldDeps: [{ block: 'other-block' }]
                            }),
                            '*/'
                        ].join('')
                    }
                }
            };

            const bemdecl = [{ name: 'block' }];
            const exepted = [{ name: 'block' }];

            return assert(scheme, bemdecl, exepted);
        });
    });
});

function getResults(fsScheme, bemdecl, options) {
    const levelPaths = Object.keys(fsScheme);
    let bundle;

    options || (options = {});
    options.sourceTech || (options.sourceTech = 'sourceTech');

    fsScheme['bundle'] = {};

    mockFs(fsScheme);

    bundle = new TestNode('bundle');
    bundle.provideTechData('?.bemdecl.js', { blocks: bemdecl });

    return bundle.runTech(levelsTech, { levels: levelPaths })
        .then(levels => {
            bundle.provideTechData('?.levels', levels);

            return bundle.runTechAndGetResults(depsTech);
        })
        .spread(res => {
            bundle.provideTechData('?.deps.js', res);

            return bundle.runTechAndGetResults(filesTech);
        })
        .then(res => {
            const files = res['bundle.files'];

            bundle.provideTechData('?.files', files);

            return vow.all([
                bundle.runTechAndGetResults(depsByTechToBemdecl, options),
                bundle.runTechAndRequire(depsByTechToBemdecl, options)
            ]);
        })
        .spread((target1, target2) => {
            if (options.bemdeclFormat === 'deps') {
                return [target1['bundle.bemdecl.js'].deps, target2[0].deps];
            } else {
                return [target1['bundle.bemdecl.js'].blocks, target2[0].blocks];
            }
        });
}

function assert(fsScheme, bemdecl, exepted, options) {
    return getResults(fsScheme, bemdecl, options)
        .then(results => {
            results.forEach(actualBemdecl => {
                actualBemdecl.must.eql(exepted);
            });
        });
}

function stringifyDepsJs(bemjson) {
    return `(${JSON.stringify(bemjson)})`;
}
